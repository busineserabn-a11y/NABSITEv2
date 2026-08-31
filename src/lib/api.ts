import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import QRCode from 'qrcode';
import { db as firestoreDb, createFirebaseAuthUser } from './firebase';
import {
  Company,
  Website,
  Category,
  ShowcaseItem,
  PlatformSettings,
  Lead,
  Review,
  Offer,
  Announcement,
  Product,
  ProductCategory,
  QrConfig,
  User,
  AuditLog,
  ThemeDefinition,
  FeatureDefinition,
  DuplicateWebsiteOptions,
  DuplicationResult,
  AcademicYear,
  Grade,
  Section,
  Subject,
  Student,
  StudentScore,
  Marklist,
  SchoolDashboardStats,
  SchoolSearchResult,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS, INITIAL_COMPANIES, INITIAL_WEBSITES, INITIAL_ANNOUNCEMENTS } from '../data/seed';
import {
  INITIAL_ACADEMIC_YEARS,
  INITIAL_GRADES,
  INITIAL_SECTIONS,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_MARKLISTS,
} from '../data/schoolSeed';
import { THEME_REGISTRY } from '../data/themes';
import { FEATURE_REGISTRY } from '../data/features';
import { getCategoryDesignProfile, generateWebsiteConfigForCategory } from '../data/categoryProfiles';
import { withTimeout, logAudit, logError } from './firestoreUtils';
import { CANONICAL_BASE_URL, buildPublicUrl, buildQrDestinationUrl } from './urls';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('nabsite_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('nabsite_auth_token', token);
  } else {
    localStorage.removeItem('nabsite_auth_token');
  }
}

// Generate unique clean slug
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `company-${Date.now().toString(36)}`;
}

// Ensure platform settings baseline in Firestore if empty
let isSeedingInitialized = false;
export async function ensureFirestoreInitialized() {
  if (isSeedingInitialized) return;
  isSeedingInitialized = true;
  try {
    const settingsDoc = await withTimeout(getDoc(doc(firestoreDb, 'settings', 'global')), 4000);
    if (!settingsDoc.exists()) {
      await setDoc(doc(firestoreDb, 'settings', 'global'), INITIAL_SETTINGS, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore baseline initialization notice:', err);
  }
}

// Real Firestore-Powered API Layer
export const api = {
  // --- Initialization & Health ---
  init: async () => {
    await ensureFirestoreInitialized();
  },

  // --- Auth / User Management ---
  getMe: async () => {
    const token = getAuthToken();
    if (!token) return { user: null };
    try {
      const userDoc = await withTimeout(getDoc(doc(firestoreDb, 'users', token)), 5000);
      if (userDoc.exists()) {
        return { user: { id: userDoc.id, ...userDoc.data() } as User };
      }
    } catch {
      // ignore
    }
    return { user: null };
  },

  // --- Users CRUD ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snap = await withTimeout(getDocs(collection(firestoreDb, 'users')), 8000);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      }
    } catch (err) {
      logError('getUsers', err);
    }
    return [];
  },

  createUser: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    const rawEmail = (userData.email || '').trim().toLowerCase();
    let authUid = userData.id;

    // If password provided, provision the real user account in Firebase Auth
    if (userData.password && userData.password.trim()) {
      try {
        const createdUid = await createFirebaseAuthUser(rawEmail, userData.password.trim());
        if (createdUid) {
          authUid = createdUid;
        }
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.warn('Firebase Auth user already exists for:', rawEmail);
        } else if (authErr.code === 'auth/weak-password') {
          throw new ApiError(400, 'The password is too weak. Please use at least 6 characters.');
        } else if (authErr.code === 'auth/invalid-email') {
          throw new ApiError(400, 'The provided email address is improperly formatted.');
        } else {
          throw new ApiError(500, `Firebase Authentication error: ${authErr.message || authErr}`);
        }
      }
    }

    const userId = authUid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: userId,
      email: rawEmail,
      name: userData.name || 'Staff User',
      role: userData.role || 'SUB_ADMIN',
      status: userData.status || 'active',
      assignedCompanyId: userData.assignedCompanyId || '',
      assignedCompanyIds: userData.assignedCompanyIds || (userData.assignedCompanyId ? [userData.assignedCompanyId] : []),
      permissions: userData.permissions || ['manage_products', 'edit_website'],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(
        setDoc(doc(firestoreDb, 'users', userId), newUser, { merge: true }),
        10000,
        'Failed to save user account (timeout).'
      );
      await logAudit('CREATE', 'USER', userId, `Created user account ${newUser.email} with role ${newUser.role}`, newUser.name);
    } catch (err: any) {
      logError('createUser', err, { userId });
      throw new ApiError(500, `Failed to save user account in Firestore: ${err.message || err}`);
    }
    return newUser;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const updateData = { ...data, updatedAt: new Date().toISOString() };
      await withTimeout(setDoc(userRef, updateData, { merge: true }), 8000);
      const snap = await getDoc(userRef);
      await logAudit('UPDATE', 'USER', id, `Updated user ${id} fields`);
      return { id: snap.id, ...snap.data() } as User;
    } catch (err) {
      logError('updateUser', err, { id });
      throw new ApiError(500, 'Failed to update user');
    }
  },

  updateUserPermissions: async (
    userId: string,
    permissionsData: {
      permissions?: any[];
      permissionMatrix?: Record<string, string[]>;
      assignedCompanyIds?: string[];
      assignedAllCompanies?: boolean;
      actor?: { id: string; name: string; role: any; email: string };
    }
  ): Promise<User> => {
    try {
      const userRef = doc(firestoreDb, 'users', userId);
      const existingSnap = await getDoc(userRef);
      if (!existingSnap.exists()) {
        throw new ApiError(404, `User ${userId} not found in Firestore`);
      }
      const existingUser = existingSnap.data() as User;

      const updatePayload: Partial<User> = {
        updatedAt: new Date().toISOString(),
      };

      if (permissionsData.permissions !== undefined) {
        updatePayload.permissions = permissionsData.permissions;
      }
      if (permissionsData.permissionMatrix !== undefined) {
        updatePayload.permissionMatrix = permissionsData.permissionMatrix;
      }
      if (permissionsData.assignedCompanyIds !== undefined) {
        updatePayload.assignedCompanyIds = permissionsData.assignedCompanyIds;
        if (permissionsData.assignedCompanyIds.length > 0) {
          updatePayload.assignedCompanyId = permissionsData.assignedCompanyIds[0];
        }
      }
      if (permissionsData.assignedAllCompanies !== undefined) {
        updatePayload.assignedAllCompanies = permissionsData.assignedAllCompanies;
      }

      await withTimeout(setDoc(userRef, updatePayload, { merge: true }), 10000);
      const updatedSnap = await getDoc(userRef);
      const updatedUser = { id: updatedSnap.id, ...updatedSnap.data() } as User;

      const actorInfo = permissionsData.actor || {
        id: 'owner_master',
        name: 'Platform Owner',
        role: 'OWNER',
        email: 'abenezarofficial1@gmail.com',
      };

      await logAudit(
        'PERMISSION_UPDATE',
        'USER',
        userId,
        `Owner updated permissions for ${existingUser.name} (${existingUser.email})`,
        existingUser.name,
        undefined,
        {
          actorId: actorInfo.id,
          actorName: actorInfo.name,
          actorRole: actorInfo.role,
          targetUserEmail: existingUser.email,
          targetUserRole: existingUser.role,
          previousMatrix: existingUser.permissionMatrix || {},
          newMatrix: updatedUser.permissionMatrix || {},
          assignedCompanyIds: updatedUser.assignedCompanyIds || [],
          assignedAllCompanies: updatedUser.assignedAllCompanies,
        }
      );

      return updatedUser;
    } catch (err: any) {
      logError('updateUserPermissions', err, { userId });
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Failed to update user permissions: ${err.message || err}`);
    }
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'users', id)), 8000);
      await logAudit('DELETE', 'USER', id, `Deleted user account ${id}`);
      return { success: true };
    } catch (err) {
      logError('deleteUser', err, { id });
      throw new ApiError(500, 'Failed to delete user');
    }
  },

  // --- Companies CRUD ---
  getCompanies: async (): Promise<Company[]> => {
    try {
      const snap = await withTimeout(getDocs(collection(firestoreDb, 'companies')), 10000);
      if (!snap.empty) {
        const firestoreList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
        // Check for any seed companies not yet in Firestore (e.g. comp_gara_guri) and include them
        const existingIds = new Set(firestoreList.map((c) => c.id));
        const missingSeed = INITIAL_COMPANIES.filter((sc) => !existingIds.has(sc.id));
        return [...firestoreList, ...missingSeed];
      }
    } catch (err) {
      logError('getCompanies', err);
    }
    return INITIAL_COMPANIES;
  },

  getCompany: async (id: string): Promise<Company> => {
    try {
      // 1. Direct ID match
      const docRef = doc(firestoreDb, 'companies', id);
      const snap = await withTimeout(getDoc(docRef), 8000);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Company;
      }

      // 2. Slug match
      const q = query(collection(firestoreDb, 'companies'), where('slug', '==', id), limit(1));
      const qSnap = await withTimeout(getDocs(q), 8000);
      if (!qSnap.empty) {
        return { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as Company;
      }
    } catch (err) {
      logError('getCompany', err, { id });
    }

    // 3. Fallback to INITIAL_COMPANIES
    const fallbackCompany = INITIAL_COMPANIES.find(
      (c) => c.id === id || c.slug === id || c.slug === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase()
    );
    if (fallbackCompany) {
      // Asynchronously sync to Firestore
      setDoc(doc(firestoreDb, 'companies', fallbackCompany.id), fallbackCompany).catch(() => {});
      return fallbackCompany;
    }

    throw new ApiError(404, `Company with identifier '${id}' not found`);
  },

  getCompanyBySlug: async (slug: string): Promise<Company> => {
    return api.getCompany(slug);
  },

  getPublicCompany: async (identifier: string): Promise<{
    company: Company;
    website?: Website;
    products?: Product[];
    productCategories?: ProductCategory[];
    reviews?: Review[];
    offers?: Offer[];
    announcements?: Announcement[];
    suspended?: boolean;
  }> => {
    const company = await api.getCompany(identifier);
    let website: Website | undefined;
    try {
      website = await api.getWebsite(company.websiteId || company.id);
    } catch {
      // website can be undefined
    }

    const compId = company.id;
    const [products, productCategories, reviews, offers, announcements] = await Promise.all([
      api.getProducts(compId).catch(() => []),
      api.getProductCategories(compId).catch(() => []),
      api.getReviews(compId).catch(() => []),
      api.getOffers(compId).catch(() => []),
      api.getAnnouncements(compId).catch(() => []),
    ]);

    const isSuspended = company.status === 'suspended' || website?.status === 'suspended';

    return {
      company,
      website,
      products,
      productCategories,
      reviews,
      offers,
      announcements,
      suspended: isSuspended,
    };
  },

  discoverCompanies: async (
    queryOrParams?: string | { category?: string; query?: string; city?: string },
    category?: string,
    city?: string
  ): Promise<Company[]> => {
    const all = await api.getCompanies();
    let q = '';
    let cat = '';
    let ct = '';

    if (typeof queryOrParams === 'string') {
      q = queryOrParams;
      cat = category || '';
      ct = city || '';
    } else if (queryOrParams && typeof queryOrParams === 'object') {
      q = queryOrParams.query || '';
      cat = queryOrParams.category || '';
      ct = queryOrParams.city || '';
    }

    return all.filter((c) => {
      if (cat && cat !== 'all' && c.category?.toLowerCase() !== cat.toLowerCase()) {
        return false;
      }
      if (ct && ct !== 'all' && c.city && !c.city.toLowerCase().includes(ct.toLowerCase())) {
        return false;
      }
      if (q) {
        const queryLower = q.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(queryLower);
        const matchDesc = c.shortDescription?.toLowerCase().includes(queryLower);
        const matchCat = c.category?.toLowerCase().includes(queryLower);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  },

  createCompany: async (companyData: Partial<Company>): Promise<Company> => {
    const compId = companyData.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const webId = `web_${compId}`;
    const qrId = `qr_${compId}`;
    const slug = companyData.slug || generateSlug(companyData.name || 'New Company');
    const nowIso = new Date().toISOString();

    const newCompany: Company = {
      id: compId,
      name: companyData.name || 'Untitled Enterprise',
      shortName: companyData.shortName || companyData.name?.substring(0, 20) || 'Enterprise',
      slug,
      logo: companyData.logo || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
      coverImage: companyData.coverImage || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
      category: companyData.category || 'Restaurant',
      shortDescription: companyData.shortDescription || 'Certified business and service provider registered with NABSITE.',
      phone: companyData.phone || '+251 911 000 000',
      email: companyData.email || '',
      telegram: companyData.telegram || '',
      websiteUrl: companyData.websiteUrl || '',
      address: companyData.address || 'Bole Road, Addis Ababa',
      city: companyData.city || 'Addis Ababa',
      mapLink: companyData.mapLink || 'https://maps.google.com/?q=Addis+Ababa',
      openingHours: companyData.openingHours || 'Mon - Sun: 8:00 AM - 10:00 PM',
      status: companyData.status || 'active',
      websiteStatus: 'draft',
      websiteId: webId,
      assignedAdminId: companyData.assignedAdminId || '',
      assignedAdminIds: companyData.assignedAdminIds || [],
      plan: 'business_pro',
      metrics: { views: 0, qrScans: 0, leadsCount: 0, reviewsCount: 0, averageRating: 5.0 },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const categoryProfile = getCategoryDesignProfile(newCompany.category);
    const categoryWebsiteConfig = generateWebsiteConfigForCategory(newCompany, newCompany.category);

    const newWebsite: Website = {
      id: webId,
      companyId: compId,
      themeId: categoryProfile.recommendedThemes[0] || 'tpl_rest_signature',
      status: 'draft',
      draftConfig: {
        ...categoryWebsiteConfig,
        installedFeatures: categoryProfile.businessFeatures.map((f, i) => `feature_cat_${i + 1}`),
        seo: {
          siteTitle: `${newCompany.name} | Official Website`,
          metaDescription: newCompany.shortDescription || categoryProfile.tagline,
          keywords: [newCompany.name, newCompany.category, 'Addis Ababa', 'Ethiopia'],
        },
      },
      publishedConfig: null,
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const initialQr: QrConfig = {
      id: qrId,
      companyId: compId,
      targetUrl: `${window.location.origin}/c/${slug}`,
      title: `${newCompany.name} Stand Card`,
      caption: 'SCAN WITH PHONE CAMERA',
      fgColor: '#0F172A',
      bgColor: '#FFFFFF',
      size: 400,
      margin: 2,
      frameStyle: 'badge',
      scanCount: 0,
      createdAt: nowIso,
    };

    // Step-by-step write with exact error isolation
    try {
      // 1. Write Company Document
      try {
        await withTimeout(
          setDoc(doc(firestoreDb, 'companies', compId), newCompany),
          8000,
          'Writing company document to Firestore timed out'
        );
      } catch (compErr: any) {
        const code = compErr.code || 'UNKNOWN';
        const msg = compErr.message || String(compErr);
        throw new ApiError(500, `[Firestore Error on companies/${compId} (${code})]: ${msg}`);
      }

      // 2. Write Website Document
      try {
        await withTimeout(
          setDoc(doc(firestoreDb, 'websites', webId), newWebsite),
          8000,
          'Writing website document to Firestore timed out'
        );
      } catch (webErr: any) {
        const code = webErr.code || 'UNKNOWN';
        const msg = webErr.message || String(webErr);
        console.warn(`[Non-fatal website init notice on websites/${webId} (${code})]:`, msg);
      }

      // 3. Write QR Configuration
      try {
        await withTimeout(
          setDoc(doc(firestoreDb, 'qrConfigs', qrId), initialQr),
          8000,
          'Writing QR configuration to Firestore timed out'
        );
      } catch (qrErr: any) {
        const code = qrErr.code || 'UNKNOWN';
        const msg = qrErr.message || String(qrErr);
        console.warn(`[Non-fatal QR init notice on qrConfigs/${qrId} (${code})]:`, msg);
      }

      // 4. Verification Check: Read back the company document from Firestore to verify persistence
      const verifySnap = await getDoc(doc(firestoreDb, 'companies', compId));
      if (!verifySnap.exists()) {
        throw new ApiError(500, `Verification failed: Company ${compId} was not found in Firestore after write.`);
      }

      // 5. Non-blocking audit log
      logAudit('CREATE', 'COMPANY', compId, `Created enterprise ${newCompany.name} (slug: ${slug})`, newCompany.name).catch(() => {});

      return { id: verifySnap.id, ...verifySnap.data() } as Company;
    } catch (err: any) {
      logError('createCompany', err, { compId, slug });
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(500, `Failed to create company: ${err.message || String(err)}`);
    }
  },

  updateCompany: async (id: string, data: Partial<Company>): Promise<Company> => {
    try {
      const compRef = doc(firestoreDb, 'companies', id);
      const updatePayload = { ...data, updatedAt: new Date().toISOString() };
      await withTimeout(setDoc(compRef, updatePayload, { merge: true }), 10000);
      const snap = await getDoc(compRef);
      await logAudit('UPDATE', 'COMPANY', id, `Updated company ${id}`);
      return { id: snap.id, ...snap.data() } as Company;
    } catch (err: any) {
      logError('updateCompany', err, { id });
      throw new ApiError(500, `Failed to update company: ${err.message}`);
    }
  },

  updateCompanyStatus: async (id: string, status: string): Promise<Company> => {
    return api.updateCompany(id, { status: status as any });
  },

  deleteCompany: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'companies', id)), 10000);
      await logAudit('DELETE', 'COMPANY', id, `Deleted company ${id}`);
      return { success: true };
    } catch (err: any) {
      logError('deleteCompany', err, { id });
      throw new ApiError(500, `Failed to delete company: ${err.message}`);
    }
  },

  // --- Websites CRUD & Realtime Engine ---
  getWebsites: async (): Promise<Website[]> => {
    try {
      const snap = await withTimeout(
        getDocs(collection(firestoreDb, 'websites')),
        10000,
        'Fetching websites from Firestore timed out'
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Website));
    } catch (err: any) {
      logError('getWebsites', err);
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on collection/websites (${code})]: ${msg}`);
    }
  },

  subscribeWebsites: (
    onNext: (websites: Website[], fromCache: boolean) => void,
    onError: (error: Error, code: string) => void
  ): (() => void) => {
    const q = collection(firestoreDb, 'websites');
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Website));
        onNext(list, fromCache);
      },
      (err: any) => {
        const code = err.code || 'UNKNOWN';
        logError('subscribeWebsites', err);
        onError(err, code);
      }
    );
  },

  getWebsite: async (id: string): Promise<Website> => {
    try {
      const snap = await withTimeout(getDoc(doc(firestoreDb, 'websites', id)), 8000);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Website;
      }
      // Also check if id was companyId
      const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id), limit(1));
      const webSnap = await withTimeout(getDocs(webQ), 8000);
      if (!webSnap.empty) {
        return { id: webSnap.docs[0].id, ...webSnap.docs[0].data() } as Website;
      }
    } catch (err: any) {
      logError('getWebsite', err, { id });
    }

    // Fallback to INITIAL_WEBSITES
    const fallbackWebsite = INITIAL_WEBSITES.find((w) => w.id === id || w.companyId === id);
    if (fallbackWebsite) {
      setDoc(doc(firestoreDb, 'websites', fallbackWebsite.id), fallbackWebsite).catch(() => {});
      return fallbackWebsite;
    }

    throw new ApiError(404, `Website configuration '${id}' not found in Firestore`);
  },

  createWebsite: async (data: {
    companyId: string;
    id?: string;
    themeId?: string;
    draftConfig?: any;
    status?: 'draft' | 'published' | 'suspended';
  }): Promise<Website> => {
    if (!data.companyId) {
      throw new ApiError(400, 'Cannot create website without a valid companyId');
    }
    const webId = data.id || `web_${data.companyId}`;
    const nowIso = new Date().toISOString();

    let parentCompany: Company | null = null;
    try {
      parentCompany = await api.getCompany(data.companyId);
    } catch {
      // Non-fatal if company lookup takes longer
    }

    const defaultPages = [
      {
        id: 'page_home',
        name: 'Home',
        title: 'Home',
        slug: 'home',
        isHome: true,
        isPublished: true,
        showInNavigation: true,
        sections: [
          {
            id: 'sec_hero',
            type: 'hero',
            title: parentCompany?.name || 'Welcome to Our Establishment',
            subtitle: parentCompany?.shortDescription || 'Experience unmatched quality, culinary excellence, and hospitality.',
            isVisible: true,
            order: 1,
          },
          {
            id: 'sec_featured',
            type: 'products',
            title: 'Featured Offerings',
            subtitle: 'Handcrafted quality and signature selections',
            isVisible: true,
            order: 2,
          },
          {
            id: 'sec_hours',
            type: 'hours',
            title: 'Location & Hours',
            subtitle: parentCompany?.address || 'Bole Road, Addis Ababa, Ethiopia',
            isVisible: true,
            order: 3,
          },
        ],
      },
      {
        id: 'page_menu',
        name: 'Menu & Offerings',
        title: 'Digital Menu & Offerings',
        slug: 'menu',
        isPublished: true,
        showInNavigation: true,
        sections: [
          {
            id: 'sec_menu_hero',
            type: 'hero',
            title: 'Explore Our Complete Menu',
            subtitle: 'Discover our comprehensive catalog of dishes, drinks, and special items',
            isVisible: true,
            order: 1,
          },
          {
            id: 'sec_menu_items',
            type: 'products',
            title: 'All Offerings',
            subtitle: 'Freshly prepared and curated daily',
            isVisible: true,
            order: 2,
          },
        ],
      },
      {
        id: 'page_about',
        name: 'About Us',
        title: 'About Our Business',
        slug: 'about',
        isPublished: true,
        showInNavigation: true,
        sections: [
          {
            id: 'sec_about_story',
            type: 'about',
            title: 'Our Heritage & Tradition',
            subtitle: `The Story of ${parentCompany?.name || 'our company'}`,
            content: parentCompany?.shortDescription || 'Certified business providing superior service and verified hospitality across Ethiopia.',
            isVisible: true,
            order: 1,
          },
        ],
      },
      {
        id: 'page_contact',
        name: 'Contact',
        title: 'Contact & Inquiries',
        slug: 'contact',
        isPublished: true,
        showInNavigation: true,
        sections: [
          {
            id: 'sec_contact_info',
            type: 'contact',
            title: 'Get in Touch',
            subtitle: 'Call, telegram, or visit our venue directly',
            isVisible: true,
            order: 1,
          },
        ],
      },
    ];

    const companyCategory = parentCompany?.category || 'Restaurant';
    const categoryProfile = getCategoryDesignProfile(companyCategory);
    const generatedConfig = parentCompany
      ? generateWebsiteConfigForCategory(parentCompany, companyCategory, data.themeId)
      : null;

    const newWebsite: Website = {
      id: webId,
      companyId: data.companyId,
      themeId: data.themeId || categoryProfile.recommendedThemes[0] || 'theme_restaurant_classic',
      status: data.status || 'draft',
      draftConfig: data.draftConfig || generatedConfig || {
        ...generateWebsiteConfigForCategory(
          {
            id: data.companyId,
            name: 'Verified Business',
            shortDescription: 'Certified partner on NABSITE',
            category: companyCategory,
          } as any,
          companyCategory,
          data.themeId
        ),
        installedFeatures: categoryProfile.businessFeatures.map((f, i) => `feature_cat_${i + 1}`),
        seo: {
          siteTitle: parentCompany?.name || 'Verified Website',
          metaDescription: parentCompany?.shortDescription || categoryProfile.tagline,
          keywords: [parentCompany?.name || 'Business', companyCategory, 'Ethiopia', 'NABSITE'],
        },
      },
      publishedConfig: null,
      version: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      // 1. Write to Firestore
      await withTimeout(
        setDoc(doc(firestoreDb, 'websites', webId), newWebsite),
        10000,
        'Writing website document to Firestore timed out'
      );

      // 2. Read-after-write verification
      const verifySnap = await getDoc(doc(firestoreDb, 'websites', webId));
      if (!verifySnap.exists()) {
        throw new ApiError(500, `Verification failed: Website ${webId} was not confirmed in Firestore.`);
      }

      // 3. Link with Company
      try {
        await updateDoc(doc(firestoreDb, 'companies', data.companyId), {
          websiteId: webId,
          websiteStatus: newWebsite.status,
          updatedAt: nowIso,
        });
      } catch (cErr) {
        console.warn('Company link notice:', cErr);
      }

      await logAudit('CREATE', 'WEBSITE', webId, `Created website for ${data.companyId}`);
      return { id: verifySnap.id, ...verifySnap.data() } as Website;
    } catch (err: any) {
      logError('createWebsite', err, { webId, companyId: data.companyId });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on websites/${webId} (${code})]: ${msg}`);
    }
  },

  updateWebsite: async (id: string, data: Partial<Website>): Promise<Website> => {
    try {
      const webRef = doc(firestoreDb, 'websites', id);
      const updatePayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await withTimeout(setDoc(webRef, updatePayload, { merge: true }), 10000);

      // Read-after-write verification
      const snap = await getDoc(webRef);
      if (!snap.exists()) {
        throw new ApiError(404, `Website ${id} not found after write`);
      }

      const verified = { id: snap.id, ...snap.data() } as Website;
      if (verified.companyId && data.status) {
        try {
          await updateDoc(doc(firestoreDb, 'companies', verified.companyId), {
            websiteStatus: data.status,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      await logAudit('UPDATE', 'WEBSITE', id, `Updated website ${id}`);
      return verified;
    } catch (err: any) {
      logError('updateWebsite', err, { id });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on update websites/${id} (${code})]: ${msg}`);
    }
  },

  deleteWebsite: async (id: string): Promise<{ success: boolean }> => {
    try {
      let companyId: string | null = null;
      try {
        const snap = await getDoc(doc(firestoreDb, 'websites', id));
        if (snap.exists()) {
          companyId = snap.data().companyId;
        }
      } catch {
        // ignore pre-lookup error
      }

      await withTimeout(deleteDoc(doc(firestoreDb, 'websites', id)), 10000);

      if (companyId) {
        try {
          await updateDoc(doc(firestoreDb, 'companies', companyId), {
            websiteStatus: 'draft',
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      await logAudit('DELETE', 'WEBSITE', id, `Deleted website ${id}`);
      return { success: true };
    } catch (err: any) {
      logError('deleteWebsite', err, { id });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on delete websites/${id} (${code})]: ${msg}`);
    }
  },

  getCompanyWebsite: async (companyId: string): Promise<{ company: Company; website: Website }> => {
    const company = await api.getCompany(companyId);
    let website: Website | null = null;
    try {
      website = await api.getWebsite(company.websiteId || companyId);
    } catch {
      // Provision website immediately if missing
      website = await api.createWebsite({
        companyId: company.id,
        themeId: 'theme_restaurant_classic',
        status: 'draft',
      });
    }
    return { company, website: website as Website };
  },

  saveWebsiteDraft: async (id: string, draftConfig: any, themeId?: string): Promise<Website> => {
    try {
      let targetId = id;
      let existingData: any = {};
      const directSnap = await withTimeout(getDoc(doc(firestoreDb, 'websites', id)), 8000);
      if (directSnap.exists()) {
        existingData = directSnap.data();
      } else {
        const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id), limit(1));
        const webSnap = await withTimeout(getDocs(webQ), 8000);
        if (!webSnap.empty) {
          targetId = webSnap.docs[0].id;
          existingData = webSnap.docs[0].data();
        }
      }

      const webRef = doc(firestoreDb, 'websites', targetId);
      const updatePayload: any = {
        ...existingData,
        id: targetId,
        companyId: existingData.companyId || id,
        draftConfig,
        updatedAt: new Date().toISOString(),
      };
      if (themeId) {
        updatePayload.themeId = themeId;
      }

      await withTimeout(setDoc(webRef, updatePayload, { merge: true }), 10000);

      // Read-after-write verification
      const snap = await getDoc(webRef);
      if (!snap.exists()) {
        throw new ApiError(500, `Failed to verify saved draft on websites/${targetId}`);
      }
      return { id: snap.id, ...snap.data() } as Website;
    } catch (err: any) {
      logError('saveWebsiteDraft', err, { id });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on saveWebsiteDraft (${code})]: ${msg}`);
    }
  },

  saveDraft: async (id: string, draftConfig: any, themeId?: string): Promise<Website> => {
    return api.saveWebsiteDraft(id, draftConfig, themeId);
  },

  duplicateCompanyAndWebsite: async (options: DuplicateWebsiteOptions): Promise<DuplicationResult> => {
    const { sourceCompanyId, newCompanyName, newCompanySlug, copyMenuContent, copyAnnouncements, copyOffers } = options;
    const nowIso = new Date().toISOString();

    try {
      // 1. Fetch Source Company
      const sourceCompany = await api.getCompany(sourceCompanyId);
      if (!sourceCompany) {
        throw new ApiError(404, `Source company ${sourceCompanyId} not found`);
      }

      // 2. Fetch Source Website
      let sourceWebsite: Website | null = null;
      try {
        const webRes = await api.getCompanyWebsite(sourceCompanyId);
        sourceWebsite = webRes.website;
      } catch (wErr) {
        console.warn('Could not fetch source website, falling back to default:', wErr);
      }

      // 3. Generate new Unique IDs
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const newCompanyId = `comp_${Date.now()}_${randomSuffix}`;
      const newWebsiteId = `web_${Date.now()}_${randomSuffix}`;

      // 4. Deep clone website draft config & assign fresh section/page IDs to prevent shared state
      const sourceDraft = sourceWebsite?.draftConfig || (sourceCompany ? generateWebsiteConfigForCategory(sourceCompany) : null);
      
      let clonedDraftConfig: any = null;
      if (sourceDraft) {
        const rawCopy = JSON.parse(JSON.stringify(sourceDraft));
        const clonedPages = (rawCopy.pages || []).map((page: any, pIdx: number) => {
          const pageIdSuffix = Math.random().toString(36).substring(2, 6);
          const newPageId = `page_${page.slug || 'p'}_${pIdx + 1}_${pageIdSuffix}`;
          return {
            ...page,
            id: newPageId,
            enabled: page.enabled !== undefined ? page.enabled : (page.isPublished !== false),
            isPublished: page.isPublished !== false,
            requirementType: page.requirementType || (page.isHome ? 'required' : 'recommended'),
            categorySource: page.categorySource || sourceCompany.category,
            sections: (page.sections || []).map((sec: any, sIdx: number) => ({
              ...sec,
              id: `sec_${sec.type || 'item'}_${sIdx + 1}_${Math.random().toString(36).substring(2, 6)}`,
            })),
          };
        });

        const clonedNav = (rawCopy.navigation || []).map((nav: any, nIdx: number) => ({
          ...nav,
          id: `nav_${nav.target || 'link'}_${nIdx + 1}_${Math.random().toString(36).substring(2, 6)}`,
        }));

        clonedDraftConfig = {
          ...rawCopy,
          pages: clonedPages,
          navigation: clonedNav,
          seo: {
            ...rawCopy.seo,
            siteTitle: `${newCompanyName} | Official Website`,
            metaDescription: sourceCompany.shortDescription || `${newCompanyName} official digital website`,
          },
        };
      }

      // 5. Create independent Company Document in Firestore
      const newCompany: Company = {
        ...JSON.parse(JSON.stringify(sourceCompany)),
        id: newCompanyId,
        name: newCompanyName,
        slug: newCompanySlug,
        websiteId: newWebsiteId,
        websiteStatus: 'draft',
        status: 'active',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await withTimeout(setDoc(doc(firestoreDb, 'companies', newCompanyId), newCompany), 10000);

      // 6. Create independent Website Document in Firestore
      const newWebsite: Website = {
        id: newWebsiteId,
        companyId: newCompanyId,
        themeId: sourceWebsite?.themeId || 'tpl_restaurant_signature',
        status: 'draft',
        draftConfig: clonedDraftConfig,
        publishedConfig: null,
        version: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await withTimeout(setDoc(doc(firestoreDb, 'websites', newWebsiteId), newWebsite), 10000);

      // 7. Clone Menu & Products if requested
      let duplicatedCategoriesCount = 0;
      let duplicatedProductsCount = 0;

      if (copyMenuContent) {
        try {
          const [sourceCats, sourceProds] = await Promise.all([
            api.getProductCategories(sourceCompanyId),
            api.getProducts(sourceCompanyId),
          ]);

          const catIdMap = new Map<string, string>();

          // Clone categories
          for (const cat of sourceCats) {
            const newCatId = `pcat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            catIdMap.set(cat.id, newCatId);
            const newCat: ProductCategory = {
              ...cat,
              id: newCatId,
              companyId: newCompanyId,
            };
            await setDoc(doc(firestoreDb, 'productCategories', newCatId), newCat);
            duplicatedCategoriesCount++;
          }

          // Clone products
          for (const prod of sourceProds) {
            const newProdId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const mappedCatId = prod.categoryId ? catIdMap.get(prod.categoryId) || undefined : undefined;
            const newProd: Product = {
              ...prod,
              id: newProdId,
              companyId: newCompanyId,
              categoryId: mappedCatId,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            await setDoc(doc(firestoreDb, 'products', newProdId), newProd);
            duplicatedProductsCount++;
          }
        } catch (menuErr) {
          console.warn('Error cloning menu content:', menuErr);
        }
      }

      // 8. Clone Announcements if requested
      if (copyAnnouncements) {
        try {
          const sourceAnns = await api.getAnnouncements(sourceCompanyId);
          for (const ann of sourceAnns) {
            const newAnnId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newAnn: Announcement = {
              ...ann,
              id: newAnnId,
              companyId: newCompanyId,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            await setDoc(doc(firestoreDb, 'announcements', newAnnId), newAnn);
          }
        } catch (annErr) {
          console.warn('Error cloning announcements:', annErr);
        }
      }

      // 9. Clone Offers if requested
      if (copyOffers) {
        try {
          const sourceOffers = await api.getOffers(sourceCompanyId);
          for (const off of sourceOffers) {
            const newOffId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newOffer: Offer = {
              ...off,
              id: newOffId,
              companyId: newCompanyId,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            await setDoc(doc(firestoreDb, 'offers', newOffId), newOffer);
          }
        } catch (offErr) {
          console.warn('Error cloning offers:', offErr);
        }
      }

      // 10. Audit log
      await logAudit('DUPLICATE', 'COMPANY', newCompanyId, `Duplicated website from ${sourceCompany.name} (${sourceCompanyId}) to ${newCompanyName} (${newCompanyId})`);

      return {
        company: newCompany,
        website: newWebsite,
        duplicatedCategoriesCount,
        duplicatedProductsCount,
      };
    } catch (err: any) {
      logError('duplicateCompanyAndWebsite', err, { sourceCompanyId, newCompanyName });
      throw new ApiError(500, `Website duplication failed: ${err.message || String(err)}`);
    }
  },

  publishWebsite: async (id: string): Promise<Website> => {
    try {
      let targetId = id;
      let current: any = null;
      const webRef = doc(firestoreDb, 'websites', id);
      const snap = await withTimeout(getDoc(webRef), 8000);
      if (snap.exists()) {
        current = snap.data();
      } else {
        const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id), limit(1));
        const webSnap = await withTimeout(getDocs(webQ), 8000);
        if (!webSnap.empty) {
          targetId = webSnap.docs[0].id;
          current = webSnap.docs[0].data();
        }
      }

      const targetRef = doc(firestoreDb, 'websites', targetId);
      const publishedConfig = current?.draftConfig || current?.publishedConfig || null;
      const newVersion = (current?.version || 1) + 1;
      const nowIso = new Date().toISOString();
      const targetCompanyId = current?.companyId || id;

      const batch = writeBatch(firestoreDb);
      batch.set(
        targetRef,
        {
          id: targetId,
          companyId: targetCompanyId,
          publishedConfig,
          status: 'published',
          version: newVersion,
          updatedAt: nowIso,
          publishedAt: nowIso,
        },
        { merge: true }
      );

      if (targetCompanyId) {
        batch.set(
          doc(firestoreDb, 'companies', targetCompanyId),
          {
            status: 'active',
            websiteStatus: 'published',
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }

      await withTimeout(batch.commit(), 10000);
      await logAudit('PUBLISH', 'WEBSITE', targetId, `Published website version ${newVersion}`);

      // Read-after-write verification
      const updatedSnap = await getDoc(targetRef);
      if (!updatedSnap.exists()) {
        throw new ApiError(500, `Published website verification failed for websites/${targetId}`);
      }
      return { id: updatedSnap.id, ...updatedSnap.data() } as Website;
    } catch (err: any) {
      logError('publishWebsite', err, { id });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on publishWebsite (${code})]: ${msg}`);
    }
  },

  unpublishWebsite: async (id: string): Promise<Website> => {
    try {
      const webRef = doc(firestoreDb, 'websites', id);
      await withTimeout(updateDoc(webRef, { status: 'draft', updatedAt: new Date().toISOString() }), 8000);
      
      const snap = await getDoc(webRef);
      if (snap.exists() && snap.data().companyId) {
        try {
          await updateDoc(doc(firestoreDb, 'companies', snap.data().companyId), {
            websiteStatus: 'draft',
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
      return { id: snap.id, ...snap.data() } as Website;
    } catch (err: any) {
      logError('unpublishWebsite', err, { id });
      const code = err.code || 'UNKNOWN';
      const msg = err.message || String(err);
      throw new ApiError(500, `[Firestore Error on unpublishWebsite (${code})]: ${msg}`);
    }
  },

  regenerateWebsiteDesign: async (
    companyId: string,
    categoryName?: string,
    templateId?: string
  ): Promise<Website> => {
    try {
      const company = await api.getCompany(companyId);
      const targetCategory = categoryName || company.category;
      const profile = getCategoryDesignProfile(targetCategory);
      const targetThemeId = templateId || profile.recommendedThemes[0];
      const regeneratedConfig = generateWebsiteConfigForCategory(company, targetCategory, targetThemeId);

      const targetWebId = company.websiteId || `web_${company.id}`;
      const nowIso = new Date().toISOString();

      const websiteDocRef = doc(firestoreDb, 'websites', targetWebId);
      const existingSnap = await getDoc(websiteDocRef);
      let currentWebsite = existingSnap.exists() ? (existingSnap.data() as Website) : null;

      if (!currentWebsite) {
        // Look up by companyId query
        const q = query(collection(firestoreDb, 'websites'), where('companyId', '==', company.id), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          currentWebsite = { id: snap.docs[0].id, ...snap.docs[0].data() } as Website;
        }
      }

      const updatedWebsite: Website = {
        id: currentWebsite?.id || targetWebId,
        companyId: company.id,
        themeId: targetThemeId,
        status: currentWebsite?.status || 'draft',
        draftConfig: {
          ...regeneratedConfig,
          installedFeatures: profile.businessFeatures.map((f, i) => `feature_cat_${i + 1}`),
          seo: {
            siteTitle: `${company.name} | Official Website`,
            metaDescription: company.shortDescription || profile.tagline,
            keywords: [company.name, targetCategory, 'Addis Ababa', 'Ethiopia'],
          },
        },
        publishedConfig: currentWebsite?.publishedConfig || null,
        version: (currentWebsite?.version || 1) + 1,
        createdAt: currentWebsite?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await setDoc(doc(firestoreDb, 'websites', updatedWebsite.id), updatedWebsite, { merge: true });

      // Update company category if it changed
      if (categoryName && categoryName !== company.category) {
        await updateDoc(doc(firestoreDb, 'companies', company.id), {
          category: categoryName,
          updatedAt: nowIso,
        });
      }

      await logAudit(
        'UPDATE',
        'WEBSITE',
        updatedWebsite.id,
        `Regenerated category design profile for ${targetCategory}`
      );

      return updatedWebsite;
    } catch (err: any) {
      logError('regenerateWebsiteDesign', err, { companyId, categoryName, templateId });
      throw new ApiError(500, `Failed to regenerate website design: ${err.message || err}`);
    }
  },

  // --- Products CRUD ---
  getProducts: async (companyId?: string): Promise<Product[]> => {
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'products'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'products');
      const snap = await withTimeout(getDocs(q), 10000, 'Fetching products from Firestore timed out');
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch (err: any) {
      logError('getProducts', err, { companyId });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on products query (${code})]: ${err.message || err}`);
    }
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const prodId = data.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProd: Product = {
      id: prodId,
      companyId: data.companyId || 'comp_1',
      categoryId: data.categoryId || 'cat_1',
      name: data.name || 'New Dish / Item',
      description: data.description || '',
      price: data.price ?? 0,
      currency: data.currency || 'ETB',
      image: data.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      isAvailable: data.isAvailable ?? true,
      isFeatured: data.isFeatured ?? false,
      tags: data.tags || [],
      sortOrder: data.sortOrder || 0,
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'products', prodId), newProd), 10000);
      const snap = await getDoc(doc(firestoreDb, 'products', prodId));
      if (!snap.exists()) {
        throw new ApiError(500, `Verification failed: Product ${prodId} was not found after write.`);
      }
      return { id: snap.id, ...snap.data() } as Product;
    } catch (err: any) {
      logError('createProduct', err);
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on products/${prodId} (${code})]: ${err.message || err}`);
    }
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      const prodRef = doc(firestoreDb, 'products', id);
      await withTimeout(setDoc(prodRef, data, { merge: true }), 10000);
      const snap = await getDoc(prodRef);
      if (!snap.exists()) {
        throw new ApiError(404, `Product ${id} not found after write`);
      }
      return { id: snap.id, ...snap.data() } as Product;
    } catch (err: any) {
      logError('updateProduct', err, { id });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on update products/${id} (${code})]: ${err.message || err}`);
    }
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'products', id)), 10000);
      return { success: true };
    } catch (err: any) {
      logError('deleteProduct', err, { id });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on delete products/${id} (${code})]: ${err.message || err}`);
    }
  },

  // --- Product Categories ---
  getProductCategories: async (companyId?: string): Promise<ProductCategory[]> => {
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'productCategories'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'productCategories');
      const snap = await withTimeout(getDocs(q), 10000, 'Fetching categories timed out');
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductCategory));
    } catch (err: any) {
      logError('getProductCategories', err, { companyId });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on productCategories query (${code})]: ${err.message || err}`);
    }
  },

  createProductCategory: async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
    const catId = data.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCat: ProductCategory = {
      id: catId,
      companyId: data.companyId || 'comp_1',
      name: data.name || 'Category',
      slug: data.slug || (data.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sortOrder: data.sortOrder || 0,
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'productCategories', catId), newCat), 10000);
      const snap = await getDoc(doc(firestoreDb, 'productCategories', catId));
      if (!snap.exists()) {
        throw new ApiError(500, `Verification failed: Category ${catId} was not found after write.`);
      }
      return { id: snap.id, ...snap.data() } as ProductCategory;
    } catch (err: any) {
      logError('createProductCategory', err);
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on productCategories/${catId} (${code})]: ${err.message || err}`);
    }
  },

  deleteProductCategory: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'productCategories', id)), 10000);
      return { success: true };
    } catch (err: any) {
      logError('deleteProductCategory', err, { id });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on delete productCategories/${id} (${code})]: ${err.message || err}`);
    }
  },

  // --- QR Code Management ---
  getQrs: async (companyId?: string): Promise<QrConfig[]> => {
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'qrConfigs'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'qrConfigs');
      const snap = await withTimeout(getDocs(q), 10000, 'Fetching QR configs timed out');
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QrConfig));
    } catch (err: any) {
      logError('getQrs', err, { companyId });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on qrConfigs query (${code})]: ${err.message || err}`);
    }
  },

  generateQr: async (params: {
    url: string;
    size?: number;
    fgColor?: string;
    bgColor?: string;
    margin?: number;
  }): Promise<{ dataUrl: string; normalizedUrl: string; svgString?: string }> => {
    let normalized = (params.url || '').trim();
    if (!normalized) {
      normalized = CANONICAL_BASE_URL;
    }
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    const qrSize = Math.min(Math.max(Number(params.size) || 360, 100), 2048);
    const qrMargin = typeof params.margin === 'number' ? Math.max(0, Math.min(params.margin, 10)) : 2;
    const darkColor = params.fgColor || '#0F172A';
    const lightColor = params.bgColor || '#FFFFFF';

    try {
      // 1. Instant client-side generation via QRCode library
      const dataUrl = await QRCode.toDataURL(normalized, {
        width: qrSize,
        margin: qrMargin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        errorCorrectionLevel: 'H',
      });

      let svgString: string | undefined;
      try {
        svgString = await QRCode.toString(normalized, {
          type: 'svg',
          margin: qrMargin,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel: 'H',
        });
      } catch {
        // svg is optional
      }

      return { dataUrl, normalizedUrl: normalized, svgString };
    } catch (clientErr) {
      console.warn('Client-side QR generation encountered fallback, trying server endpoint:', clientErr);
      try {
        const res = await fetch('/api/qr/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: normalized,
            size: qrSize,
            fgColor: darkColor,
            bgColor: lightColor,
            margin: qrMargin,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          return { dataUrl: json.dataUrl, normalizedUrl: json.normalizedUrl || normalized };
        }
      } catch (serverErr) {
        console.error('Server-side QR endpoint also failed:', serverErr);
      }
      throw new ApiError(500, 'Failed to generate QR Code. Please check destination URL format.');
    }
  },

  generateQrSvg: async (params: {
    url: string;
    fgColor?: string;
    bgColor?: string;
    margin?: number;
  }): Promise<string> => {
    let normalized = (params.url || '').trim();
    if (!normalized) normalized = CANONICAL_BASE_URL;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    return await QRCode.toString(normalized, {
      type: 'svg',
      margin: typeof params.margin === 'number' ? params.margin : 2,
      color: {
        dark: params.fgColor || '#0F172A',
        light: params.bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
  },

  saveQrConfig: async (data: Partial<QrConfig>): Promise<QrConfig> => {
    const qrId = data.id || `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newQr: QrConfig = {
      id: qrId,
      companyId: data.companyId || '',
      name: data.name || data.title || 'Official Digital Stand',
      title: data.title || data.name || 'Official Digital Stand',
      targetUrl: data.targetUrl || CANONICAL_BASE_URL,
      targetType: data.targetType || 'website',
      pageSlug: data.pageSlug || '',
      caption: data.caption || 'SCAN WITH PHONE CAMERA',
      fgColor: data.fgColor || '#0F172A',
      bgColor: data.bgColor || '#FFFFFF',
      size: data.size || 400,
      margin: data.margin ?? 2,
      frame: data.frame || 'badge',
      frameStyle: data.frameStyle || 'badge',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate || '',
      duration: data.duration || 'permanent',
      scanCount: data.scanCount || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'qrConfigs', qrId), newQr), 10000);
      const snap = await getDoc(doc(firestoreDb, 'qrConfigs', qrId));
      if (!snap.exists()) {
        throw new ApiError(500, `Verification failed: QR Config ${qrId} was not found after write.`);
      }
      return { id: snap.id, ...snap.data() } as QrConfig;
    } catch (err: any) {
      logError('saveQrConfig', err);
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on qrConfigs/${qrId} (${code})]: ${err.message || err}`);
    }
  },

  createQr: async (data: Partial<QrConfig>): Promise<QrConfig> => {
    return api.saveQrConfig(data);
  },

  deleteQr: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'qrConfigs', id)), 10000);
      return { success: true };
    } catch (err: any) {
      logError('deleteQr', err, { id });
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on delete qrConfigs/${id} (${code})]: ${err.message || err}`);
    }
  },

  // --- Leads & Inquiries ---
  submitLead: async (data: any): Promise<{ success: boolean; id: string }> => {
    try {
      const leadRef = await withTimeout(
        addDoc(collection(firestoreDb, 'leads'), {
          ...data,
          status: 'new',
          createdAt: new Date().toISOString(),
        }),
        8000
      );
      return { success: true, id: leadRef.id };
    } catch (err) {
      logError('submitLead', err);
      return { success: true, id: `lead_${Date.now()}` };
    }
  },

  getLeads: async (): Promise<Lead[]> => {
    try {
      const snap = await withTimeout(getDocs(collection(firestoreDb, 'leads')), 8000);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));
      }
    } catch (err) {
      logError('getLeads', err);
    }
    return [];
  },

  updateLeadStatus: async (id: string, status: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(updateDoc(doc(firestoreDb, 'leads', id), { status }), 8000);
      return { success: true };
    } catch (err) {
      logError('updateLeadStatus', err, { id });
      return { success: true };
    }
  },

  convertLead: async (id: string): Promise<{ success: boolean; companyId?: string }> => {
    try {
      const leadSnap = await withTimeout(getDoc(doc(firestoreDb, 'leads', id)), 8000);
      if (leadSnap.exists()) {
        const lead = leadSnap.data() as Lead;
        const comp = await api.createCompany({
          name: lead.companyName || 'New Company',
          category: lead.category || 'Restaurant',
          phone: lead.phone || '',
          email: lead.email || '',
        });
        await updateDoc(doc(firestoreDb, 'leads', id), { status: 'converted', convertedCompanyId: comp.id });
        return { success: true, companyId: comp.id };
      }
    } catch (err) {
      logError('convertLead', err, { id });
    }
    return { success: true };
  },

  // --- Real Telemetry & Analytics ---
  recordEvent: async (event: {
    companyId?: string;
    websiteId?: string;
    eventType: string;
    path: string;
  }): Promise<void> => {
    try {
      await addDoc(collection(firestoreDb, 'analyticsEvents'), {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // silently ignore telemetry write errors
    }
  },

  getAnalyticsSummary: async (): Promise<{ totalViews: number; totalScans: number; totalLeads: number }> => {
    try {
      const [eventsSnap, leadsSnap, qrsSnap] = await Promise.all([
        withTimeout(getDocs(collection(firestoreDb, 'analyticsEvents')), 8000),
        withTimeout(getDocs(collection(firestoreDb, 'leads')), 8000),
        withTimeout(getDocs(collection(firestoreDb, 'qrConfigs')), 8000),
      ]);
      return {
        totalViews: eventsSnap.size,
        totalLeads: leadsSnap.size,
        totalScans: qrsSnap.docs.reduce((acc, d) => acc + (d.data().scanCount || 0), 0),
      };
    } catch {
      return { totalViews: 0, totalScans: 0, totalLeads: 0 };
    }
  },

  getAnalyticsTimeSeries: async (companyId?: string): Promise<{
    dailyViews: { date: string; views: number; scans: number }[];
    categoryBreakdown: { category: string; count: number }[];
    deviceBreakdown: { name: string; value: number }[];
  }> => {
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'analyticsEvents'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'analyticsEvents');
      const eventsSnap = await withTimeout(getDocs(q), 8000);
      const events = eventsSnap.docs.map((d) => d.data() as any);

      const daysMap = new Map<string, { views: number; scans: number }>();
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daysMap.set(key, { views: 0, scans: 0 });
      }

      events.forEach((ev) => {
        if (ev.timestamp) {
          const evDate = new Date(ev.timestamp);
          const key = evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (daysMap.has(key)) {
            const current = daysMap.get(key)!;
            if (ev.eventType === 'qr_scan') {
              current.scans += 1;
            } else {
              current.views += 1;
            }
          }
        }
      });

      const dailyViews = Array.from(daysMap.entries()).map(([date, counts]) => ({
        date,
        views: counts.views,
        scans: counts.scans,
      }));

      const compSnap = await withTimeout(getDocs(collection(firestoreDb, 'companies')), 8000);
      const catCounts: Record<string, number> = {};
      compSnap.docs.forEach((d) => {
        const cat = d.data().category || 'Restaurant';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      const categoryBreakdown = Object.entries(catCounts).map(([category, count]) => ({
        category,
        count,
      }));

      const deviceBreakdown = [
        { name: 'Mobile Web', value: Math.max(1, events.filter((e) => e.device === 'mobile').length) },
        { name: 'Desktop Web', value: Math.max(1, events.filter((e) => e.device === 'desktop').length) },
        { name: 'Physical QR Scans', value: Math.max(1, events.filter((e) => e.eventType === 'qr_scan').length) },
      ];

      return { dailyViews, categoryBreakdown, deviceBreakdown };
    } catch {
      const dailyViews = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        dailyViews.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: 0,
          scans: 0,
        });
      }
      return { dailyViews, categoryBreakdown: [], deviceBreakdown: [] };
    }
  },

  // --- Audit Logs ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const snap = await withTimeout(
        getDocs(query(collection(firestoreDb, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50))),
        8000
      );
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
      }
    } catch (err) {
      logError('getAuditLogs', err);
    }
    return [];
  },

  // --- Static Registry lookups ---
  getCategories: async (): Promise<Category[]> => {
    return INITIAL_CATEGORIES;
  },

  getShowcase: async (): Promise<ShowcaseItem[]> => {
    try {
      const snap = await withTimeout(getDocs(collection(firestoreDb, 'companies')), 8000);
      if (!snap.empty) {
        const publishedComps = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Company))
          .filter((c) => c.status === 'active' || (c.status as string) === 'published');
        return publishedComps.map((comp, idx) => ({
          id: `show_${comp.id}`,
          companyId: comp.id,
          displayName: comp.name,
          title: comp.name,
          logo: comp.logo || '',
          quote: comp.shortDescription || '',
          description: comp.shortDescription || '',
          category: comp.category,
          targetUrl: `/c/${comp.slug}`,
          image:
            comp.coverImage ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
          order: idx + 1,
          isVisible: true,
          createdAt: comp.createdAt || new Date().toISOString(),
          updatedAt: comp.updatedAt || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn('getShowcase error:', e);
    }
    return [];
  },

  getThemes: async (): Promise<ThemeDefinition[]> => {
    return THEME_REGISTRY;
  },

  getFeatures: async (): Promise<FeatureDefinition[]> => {
    return FEATURE_REGISTRY;
  },

  getSettings: async (): Promise<PlatformSettings> => {
    try {
      const snap = await withTimeout(getDoc(doc(firestoreDb, 'settings', 'global')), 6000);
      if (snap.exists()) {
        return snap.data() as PlatformSettings;
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
  },

  updateSettings: async (settings: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'settings', 'global'), settings, { merge: true }), 8000);
    } catch (err) {
      logError('updateSettings', err);
    }
    return { ...INITIAL_SETTINGS, ...settings };
  },

  getOwnerSettings: async (): Promise<PlatformSettings> => {
    return api.getSettings();
  },

  updateOwnerSettings: async (settings: PlatformSettings): Promise<PlatformSettings> => {
    return api.updateSettings(settings);
  },

  getOwnerExport: async (): Promise<any> => {
    const [companies, websites, products] = await Promise.all([
      api.getCompanies(),
      withTimeout(getDocs(collection(firestoreDb, 'websites')), 10000).then((s) => s.docs.map((d) => d.data())),
      api.getProducts(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      platform: 'NABSITE Production Database',
      companies,
      websites,
      products,
    };
  },

  // --- Reviews, Offers, Announcements ---
  getReviews: async (_companyId?: string): Promise<Review[]> => {
    try {
      const q = _companyId
        ? query(collection(firestoreDb, 'reviews'), where('companyId', '==', _companyId))
        : collection(firestoreDb, 'reviews');
      const snap = await withTimeout(getDocs(q), 8000);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    } catch {
      return [];
    }
  },

  submitReview: async (reviewData: {
    companyId: string;
    name: string;
    rating: number;
    text: string;
  }): Promise<Review> => {
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRev: Review = {
      id: reviewId,
      companyId: reviewData.companyId,
      name: reviewData.name,
      rating: reviewData.rating,
      text: reviewData.text,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'reviews', reviewId), newRev), 8000);
    } catch (err) {
      logError('submitReview', err);
    }
    return newRev;
  },

  moderateReview: async (id: string, status: string, reply?: string): Promise<{ success: boolean }> => {
    try {
      const revRef = doc(firestoreDb, 'reviews', id);
      const updateData: any = { status, moderatedAt: new Date().toISOString() };
      if (reply !== undefined) updateData.reply = reply;
      await withTimeout(updateDoc(revRef, updateData), 8000);
    } catch (err) {
      logError('moderateReview', err);
    }
    return { success: true };
  },

  getOffers: async (_companyId?: string): Promise<Offer[]> => {
    try {
      const q = _companyId
        ? query(collection(firestoreDb, 'offers'), where('companyId', '==', _companyId))
        : collection(firestoreDb, 'offers');
      const snap = await withTimeout(getDocs(q), 8000);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
    } catch {
      return [];
    }
  },

  createOffer: async (data: any): Promise<Offer> => {
    const offerId = `off_${Date.now()}`;
    const offer: Offer = {
      id: offerId,
      companyId: data.companyId || 'comp_1',
      title: data.title || 'Special Promotion',
      description: data.description || '',
      discountPercent: data.discountPercent,
      validUntil: data.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'offers', offerId), offer), 8000);
    } catch (err) {
      logError('createOffer', err);
    }
    return offer;
  },

  deleteOffer: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'offers', id)), 8000);
    } catch (err) {
      logError('deleteOffer', err);
    }
    return { success: true };
  },

  getAnnouncements: async (_companyId?: string): Promise<Announcement[]> => {
    try {
      const q = _companyId
        ? query(collection(firestoreDb, 'announcements'), where('companyId', '==', _companyId))
        : collection(firestoreDb, 'announcements');
      const snap = await withTimeout(getDocs(q), 8000);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      if (list.length > 0) return list;
    } catch {
      // fallback
    }

    // Fallback to INITIAL_ANNOUNCEMENTS
    if (_companyId) {
      const filtered = INITIAL_ANNOUNCEMENTS.filter((a) => a.companyId === _companyId);
      if (filtered.length > 0) {
        filtered.forEach((ann) => {
          setDoc(doc(firestoreDb, 'announcements', ann.id), ann).catch(() => {});
        });
        return filtered;
      }
    }
    return INITIAL_ANNOUNCEMENTS;
  },

  createAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
    const annId = data.id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const img = (data.imageUrl || data.image || '').trim();
    const newAnn: Announcement = {
      id: annId,
      companyId: data.companyId || '',
      title: data.title || 'Important Notice',
      content: data.content || '',
      image: img,
      imageUrl: img,
      category: data.category || 'General',
      description: data.description || '',
      priority: data.priority || 'normal',
      pinned: data.pinned || false,
      author: data.author || '',
      date: data.date || nowIso.split('T')[0],
      tags: data.tags || [],
      attachmentUrl: data.attachmentUrl || '',
      publishDate: data.publishDate || nowIso,
      status: (data.status as any) || 'published',
      featured: data.featured || false,
      ctaText: data.ctaText || '',
      ctaUrl: data.ctaUrl || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    try {
      await withTimeout(setDoc(doc(firestoreDb, 'announcements', annId), newAnn), 8000);
    } catch (err) {
      logError('createAnnouncement', err);
    }
    return newAnn;
  },

  updateAnnouncement: async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
    const annRef = doc(firestoreDb, 'announcements', id);
    const img = data.imageUrl !== undefined ? data.imageUrl.trim() : (data.image !== undefined ? data.image.trim() : undefined);
    const updatePayload: any = {
      ...data,
      ...(img !== undefined ? { image: img, imageUrl: img } : {}),
      updatedAt: new Date().toISOString(),
    };
    try {
      await withTimeout(setDoc(annRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(annRef);
      return { id: snap.id, ...snap.data() } as Announcement;
    } catch (err) {
      logError('updateAnnouncement', err, { id });
      throw new ApiError(500, 'Failed to update announcement');
    }
  },

  deleteAnnouncement: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'announcements', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteAnnouncement', err, { id });
      throw new ApiError(500, 'Failed to delete announcement');
    }
  },

  getHealth: async () => {
    const startTime = Date.now();
    let firestoreStatus = 'Connected';
    let firestoreLatency = 0;
    try {
      await withTimeout(getDoc(doc(firestoreDb, 'settings', 'global')), 5000);
      firestoreLatency = Date.now() - startTime;
    } catch (err: any) {
      firestoreStatus = `Error: ${err.message}`;
    }

    return {
      status: firestoreStatus === 'Connected' ? 'healthy' : 'degraded',
      database: firestoreStatus,
      firestoreLatencyMs: firestoreLatency,
      storage: 'Firebase Storage Ready',
      realtimeDb: 'Not Used (Firestore is Primary Engine)',
      version: '3.0.0-PROD',
      timestamp: new Date().toISOString(),
    };
  },

  getQrImage: async (params: any): Promise<{ dataUrl: string; normalizedUrl: string }> => {
    return api.generateQr(params);
  },

  updateShowcase: async (items: ShowcaseItem[]) => {
    return api.updateSettings({ showcaseSettings: { items } as any });
  },

  inviteUser: async (data: any): Promise<{ success: boolean }> => {
    return { success: true };
  },

  // ===========================================================================
  // School Academic Engine API (V1 Core Features)
  // ===========================================================================

  // --- 1. Academic Years ---
  getAcademicYears: async (companyId: string): Promise<AcademicYear[]> => {
    try {
      const q = query(collection(firestoreDb, 'academicYears'), where('companyId', '==', companyId));
      const snap = await withTimeout(getDocs(q), 6000);
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AcademicYear));
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      }
    } catch (err) {
      logError('getAcademicYears', err, { companyId });
    }
    // Return seeded fallback if matching company
    return INITIAL_ACADEMIC_YEARS.filter((ay) => ay.companyId === companyId);
  },

  createAcademicYear: async (data: Partial<AcademicYear> & { companyId: string; name: string }): Promise<AcademicYear> => {
    const id = data.id || `ay_${data.companyId.replace('comp_', '')}_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'academicYears', id);

    // If marked active, deactivate others
    if (data.isActive) {
      try {
        const existing = await api.getAcademicYears(data.companyId);
        for (const yr of existing) {
          if (yr.isActive && yr.id !== id) {
            await updateDoc(doc(firestoreDb, 'academicYears', yr.id), { isActive: false, updatedAt: nowIso }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not reset other active years:', err);
      }
    }

    const payload: AcademicYear = {
      id,
      companyId: data.companyId,
      name: data.name.trim(),
      calendarType: data.calendarType || 'ETHIOPIAN',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      isActive: data.isActive ?? false,
      description: data.description || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload), 8000);
      return payload;
    } catch (err) {
      logError('createAcademicYear', err, { id });
      throw new ApiError(500, 'Failed to create academic year in database');
    }
  },

  updateAcademicYear: async (id: string, data: Partial<AcademicYear>): Promise<AcademicYear> => {
    const docRef = doc(firestoreDb, 'academicYears', id);
    const nowIso = new Date().toISOString();

    if (data.isActive && data.companyId) {
      try {
        const existing = await api.getAcademicYears(data.companyId);
        for (const yr of existing) {
          if (yr.isActive && yr.id !== id) {
            await updateDoc(doc(firestoreDb, 'academicYears', yr.id), { isActive: false, updatedAt: nowIso }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not reset active years on update:', err);
      }
    }

    const updatePayload = {
      ...data,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as AcademicYear;
    } catch (err) {
      logError('updateAcademicYear', err, { id });
      throw new ApiError(500, 'Failed to update academic year');
    }
  },

  setActiveAcademicYear: async (companyId: string, yearId: string): Promise<void> => {
    const nowIso = new Date().toISOString();
    try {
      const allYears = await api.getAcademicYears(companyId);
      for (const yr of allYears) {
        const targetActive = yr.id === yearId;
        if (yr.isActive !== targetActive) {
          await setDoc(doc(firestoreDb, 'academicYears', yr.id), { isActive: targetActive, updatedAt: nowIso }, { merge: true });
        }
      }
    } catch (err) {
      logError('setActiveAcademicYear', err, { companyId, yearId });
      throw new ApiError(500, 'Failed to set active academic year');
    }
  },

  deleteAcademicYear: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'academicYears', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteAcademicYear', err, { id });
      throw new ApiError(500, 'Failed to delete academic year');
    }
  },

  // --- 2. Grades ---
  getGrades: async (companyId: string): Promise<Grade[]> => {
    try {
      const q = query(collection(firestoreDb, 'grades'), where('companyId', '==', companyId));
      const snap = await withTimeout(getDocs(q), 6000);
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Grade));
        return list.sort((a, b) => (a.level || 0) - (b.level || 0));
      }
    } catch (err) {
      logError('getGrades', err, { companyId });
    }
    return INITIAL_GRADES.filter((g) => g.companyId === companyId);
  },

  createGrade: async (data: Partial<Grade> & { companyId: string; name: string }): Promise<Grade> => {
    const id = data.id || `gr_${data.companyId.replace('comp_', '')}_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'grades', id);

    const payload: Grade = {
      id,
      companyId: data.companyId,
      name: data.name.trim(),
      level: data.level ?? parseInt(data.name.replace(/\D/g, '') || '0', 10),
      academicYearId: data.academicYearId || '',
      description: data.description || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload), 8000);
      return payload;
    } catch (err) {
      logError('createGrade', err, { id });
      throw new ApiError(500, 'Failed to create grade');
    }
  },

  updateGrade: async (id: string, data: Partial<Grade>): Promise<Grade> => {
    const docRef = doc(firestoreDb, 'grades', id);
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as Grade;
    } catch (err) {
      logError('updateGrade', err, { id });
      throw new ApiError(500, 'Failed to update grade');
    }
  },

  deleteGrade: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'grades', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteGrade', err, { id });
      throw new ApiError(500, 'Failed to delete grade');
    }
  },

  // --- 3. Sections ---
  getSections: async (companyId: string, gradeId?: string): Promise<Section[]> => {
    try {
      let q = query(collection(firestoreDb, 'sections'), where('companyId', '==', companyId));
      if (gradeId) {
        q = query(collection(firestoreDb, 'sections'), where('companyId', '==', companyId), where('gradeId', '==', gradeId));
      }
      const snap = await withTimeout(getDocs(q), 6000);
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Section));
        return list.sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch (err) {
      logError('getSections', err, { companyId, gradeId });
    }
    const filtered = INITIAL_SECTIONS.filter((s) => s.companyId === companyId && (!gradeId || s.gradeId === gradeId));
    return filtered;
  },

  createSection: async (data: Partial<Section> & { companyId: string; gradeId: string; name: string }): Promise<Section> => {
    const id = data.id || `sec_${data.companyId.replace('comp_', '')}_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'sections', id);

    const payload: Section = {
      id,
      companyId: data.companyId,
      gradeId: data.gradeId,
      name: data.name.trim(),
      room: data.room || '',
      capacity: data.capacity || 40,
      academicYearId: data.academicYearId || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload), 8000);
      return payload;
    } catch (err) {
      logError('createSection', err, { id });
      throw new ApiError(500, 'Failed to create section');
    }
  },

  updateSection: async (id: string, data: Partial<Section>): Promise<Section> => {
    const docRef = doc(firestoreDb, 'sections', id);
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as Section;
    } catch (err) {
      logError('updateSection', err, { id });
      throw new ApiError(500, 'Failed to update section');
    }
  },

  deleteSection: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'sections', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteSection', err, { id });
      throw new ApiError(500, 'Failed to delete section');
    }
  },

  // --- 4. Subjects ---
  getSubjects: async (companyId: string, gradeId?: string): Promise<Subject[]> => {
    try {
      const q = query(collection(firestoreDb, 'subjects'), where('companyId', '==', companyId));
      const snap = await withTimeout(getDocs(q), 6000);
      if (!snap.empty) {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subject));
        if (gradeId) {
          list = list.filter((sub) => sub.isCommon || (sub.gradeIds && sub.gradeIds.includes(gradeId)));
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch (err) {
      logError('getSubjects', err, { companyId, gradeId });
    }
    let list = INITIAL_SUBJECTS.filter((s) => s.companyId === companyId);
    if (gradeId) {
      list = list.filter((sub) => sub.isCommon || (sub.gradeIds && sub.gradeIds.includes(gradeId)));
    }
    return list;
  },

  createSubject: async (data: Partial<Subject> & { companyId: string; name: string }): Promise<Subject> => {
    const id = data.id || `sub_${data.companyId.replace('comp_', '')}_${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'subjects', id);

    const payload: Subject = {
      id,
      companyId: data.companyId,
      name: data.name.trim(),
      code: data.code || '',
      gradeIds: data.gradeIds || [],
      sectionIds: data.sectionIds || [],
      maxScore: data.maxScore || 100,
      isCommon: data.isCommon ?? false,
      description: data.description || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload), 8000);
      return payload;
    } catch (err) {
      logError('createSubject', err, { id });
      throw new ApiError(500, 'Failed to create subject');
    }
  },

  updateSubject: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    const docRef = doc(firestoreDb, 'subjects', id);
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as Subject;
    } catch (err) {
      logError('updateSubject', err, { id });
      throw new ApiError(500, 'Failed to update subject');
    }
  },

  deleteSubject: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'subjects', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteSubject', err, { id });
      throw new ApiError(500, 'Failed to delete subject');
    }
  },

  // --- 5. Students ---
  getStudents: async (
    companyId: string,
    filters?: { gradeId?: string; sectionId?: string; academicYearId?: string; search?: string }
  ): Promise<Student[]> => {
    try {
      let q = query(collection(firestoreDb, 'students'), where('companyId', '==', companyId));
      if (filters?.gradeId) {
        q = query(q, where('gradeId', '==', filters.gradeId));
      }
      if (filters?.sectionId) {
        q = query(q, where('sectionId', '==', filters.sectionId));
      }
      const snap = await withTimeout(getDocs(q), 6000);
      if (!snap.empty) {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        if (filters?.academicYearId) {
          list = list.filter((s) => !s.academicYearId || s.academicYearId === filters.academicYearId);
        }
        if (filters?.search && filters.search.trim()) {
          const sTerm = filters.search.toLowerCase().trim();
          list = list.filter(
            (s) =>
              s.fullName.toLowerCase().includes(sTerm) ||
              s.admissionNo.toLowerCase().includes(sTerm) ||
              s.id.toLowerCase().includes(sTerm)
          );
        }
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      }
    } catch (err) {
      logError('getStudents', err, { companyId, filters });
    }

    // Fallback to initial students
    let list = INITIAL_STUDENTS.filter((s) => s.companyId === companyId);
    if (filters?.gradeId) {
      list = list.filter((s) => s.gradeId === filters.gradeId);
    }
    if (filters?.sectionId) {
      list = list.filter((s) => s.sectionId === filters.sectionId);
    }
    if (filters?.academicYearId) {
      list = list.filter((s) => !s.academicYearId || s.academicYearId === filters.academicYearId);
    }
    if (filters?.search && filters.search.trim()) {
      const sTerm = filters.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(sTerm) ||
          s.admissionNo.toLowerCase().includes(sTerm) ||
          s.id.toLowerCase().includes(sTerm)
      );
    }
    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  createStudent: async (data: Partial<Student> & { companyId: string; fullName: string; gradeId: string; sectionId: string }): Promise<Student> => {
    // Generate long unique identifier format
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = data.id || `GG_STU_${Date.now()}_${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'students', id);

    const payload: Student = {
      id,
      companyId: data.companyId,
      fullName: data.fullName.trim(),
      admissionNo: data.admissionNo || `ADM/${new Date().getFullYear()}/${randomSuffix}`,
      gender: data.gender || 'male',
      dateOfBirth: data.dateOfBirth || '',
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId || '',
      status: data.status || 'active',
      guardianName: data.guardianName || '',
      guardianPhone: data.guardianPhone || '',
      guardianEmail: data.guardianEmail || '',
      notes: data.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload), 8000);
      return payload;
    } catch (err) {
      logError('createStudent', err, { id });
      throw new ApiError(500, 'Failed to register student');
    }
  },

  updateStudent: async (id: string, data: Partial<Student>): Promise<Student> => {
    const docRef = doc(firestoreDb, 'students', id);
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 8000);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as Student;
    } catch (err) {
      logError('updateStudent', err, { id });
      throw new ApiError(500, 'Failed to update student profile');
    }
  },

  deleteStudent: async (id: string): Promise<{ success: boolean }> => {
    try {
      await withTimeout(deleteDoc(doc(firestoreDb, 'students', id)), 8000);
      return { success: true };
    } catch (err) {
      logError('deleteStudent', err, { id });
      throw new ApiError(500, 'Failed to remove student');
    }
  },

  // --- 6. Marklist Engine ---
  getMarklist: async (
    companyId: string,
    academicYearId: string,
    gradeId: string,
    sectionId: string,
    subjectId: string
  ): Promise<Marklist> => {
    const marklistId = `marklist_${academicYearId}_${gradeId}_${sectionId}_${subjectId}`;
    const docRef = doc(firestoreDb, 'marklists', marklistId);

    // Fetch students belonging to this grade and section
    const students = await api.getStudents(companyId, { gradeId, sectionId, academicYearId });

    try {
      const snap = await withTimeout(getDoc(docRef), 6000);
      if (snap.exists()) {
        const savedData = snap.data() as Marklist;
        // Merge with current roster to ensure newly added students appear seamlessly
        const existingEntriesMap = new Map(savedData.entries.map((e) => [e.studentId, e]));
        const mergedEntries = students.map((stu) => {
          const existing = existingEntriesMap.get(stu.id);
          return {
            studentId: stu.id,
            studentName: stu.fullName,
            admissionNo: stu.admissionNo,
            score: existing ? existing.score : null,
            componentScores: existing?.componentScores || {},
            weightedTotal: existing?.weightedTotal ?? existing?.score ?? null,
            notes: existing?.notes || '',
            updatedAt: existing?.updatedAt || savedData.updatedAt,
          };
        });

        return {
          id: marklistId,
          companyId,
          academicYearId,
          gradeId,
          sectionId,
          subjectId,
          maxScore: savedData.maxScore || 100,
          status: savedData.status || 'draft',
          entries: mergedEntries,
          lastUpdatedBy: savedData.lastUpdatedBy,
          createdAt: savedData.createdAt,
          updatedAt: savedData.updatedAt,
        };
      }
    } catch (err) {
      logError('getMarklist', err, { marklistId });
    }

    // Check seed marklists
    const seeded = INITIAL_MARKLISTS.find(
      (m) =>
        m.companyId === companyId &&
        m.academicYearId === academicYearId &&
        m.gradeId === gradeId &&
        m.sectionId === sectionId &&
        m.subjectId === subjectId
    );

    if (seeded) {
      const existingEntriesMap = new Map(seeded.entries.map((e) => [e.studentId, e]));
      const mergedEntries = students.map((stu) => {
        const existing = existingEntriesMap.get(stu.id);
        return {
          studentId: stu.id,
          studentName: stu.fullName,
          admissionNo: stu.admissionNo,
          score: existing ? existing.score : null,
          componentScores: existing?.componentScores || {},
          weightedTotal: existing?.weightedTotal ?? existing?.score ?? null,
          notes: existing?.notes || '',
          updatedAt: existing?.updatedAt || seeded.updatedAt,
        };
      });
      return { ...seeded, entries: mergedEntries };
    }

    // New blank assessment sheet with all students of section ready
    return {
      id: marklistId,
      companyId,
      academicYearId,
      gradeId,
      sectionId,
      subjectId,
      maxScore: 100,
      status: 'draft',
      entries: students.map((stu) => ({
        studentId: stu.id,
        studentName: stu.fullName,
        admissionNo: stu.admissionNo,
        score: null,
        componentScores: {},
        weightedTotal: null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  saveMarklist: async (
    marklistData: Partial<Marklist> & {
      companyId: string;
      academicYearId: string;
      gradeId: string;
      sectionId: string;
      subjectId: string;
      entries: Array<{
        studentId: string;
        studentName: string;
        admissionNo: string;
        score: number | null;
        componentScores?: Record<string, number | null>;
        weightedTotal?: number | null;
        notes?: string;
      }>;
    }
  ): Promise<Marklist> => {
    const marklistId =
      marklistData.id ||
      `marklist_${marklistData.academicYearId}_${marklistData.gradeId}_${marklistData.sectionId}_${marklistData.subjectId}`;
    const nowIso = new Date().toISOString();
    const docRef = doc(firestoreDb, 'marklists', marklistId);

    const payload: Marklist = {
      id: marklistId,
      companyId: marklistData.companyId,
      academicYearId: marklistData.academicYearId,
      gradeId: marklistData.gradeId,
      sectionId: marklistData.sectionId,
      subjectId: marklistData.subjectId,
      maxScore: marklistData.maxScore ?? 100,
      status: marklistData.status || 'submitted',
      entries: marklistData.entries.map((e) => ({
        studentId: e.studentId,
        studentName: e.studentName,
        admissionNo: e.admissionNo,
        score: e.score,
        componentScores: e.componentScores || {},
        weightedTotal: e.weightedTotal ?? e.score ?? null,
        notes: e.notes || '',
        updatedAt: nowIso,
      })),
      lastUpdatedBy: marklistData.lastUpdatedBy || 'Faculty / Administrator',
      createdAt: marklistData.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      await withTimeout(setDoc(docRef, payload, { merge: true }), 8000);
      return payload;
    } catch (err) {
      logError('saveMarklist', err, { marklistId });
      throw new ApiError(500, 'Failed to save student marklist');
    }
  },

  // --- Student Portal Verified Lookups ---
  verifyStudentForPortal: async (
    companyId: string,
    fullName: string,
    fanNumber: string
  ): Promise<{ student: Student; grade: Grade | null; section: Section | null; academicYear: AcademicYear | null } | null> => {
    if (!fullName || !fanNumber) return null;
    const cleanName = fullName.trim().toLowerCase();
    const cleanFan = fanNumber.trim().toLowerCase();

    // Fetch all students for this company
    const students = await api.getStudents(companyId);
    
    // Strict dual verification: both full name AND FAN / Admission No (or ID) must match
    const matched = students.find((s) => {
      const nameMatch = s.fullName.toLowerCase().trim() === cleanName;
      const fanMatch =
        s.admissionNo.toLowerCase().trim() === cleanFan ||
        s.id.toLowerCase().trim() === cleanFan ||
        s.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanFan.replace(/[^a-z0-9]/g, '') ||
        s.id.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanFan.replace(/[^a-z0-9]/g, '');
      return nameMatch && fanMatch;
    });

    if (!matched) return null;

    const [grades, sections, years] = await Promise.all([
      api.getGrades(companyId),
      api.getSections(companyId),
      api.getAcademicYears(companyId),
    ]);

    const grade = grades.find((g) => g.id === matched.gradeId) || null;
    const section = sections.find((s) => s.id === matched.sectionId) || null;
    const academicYear = years.find((y) => y.id === matched.academicYearId) || years.find((y) => y.isActive) || null;

    return {
      student: matched,
      grade,
      section,
      academicYear,
    };
  },

  getStudentAcademicReport: async (
    companyId: string,
    studentId: string
  ): Promise<Array<{
    subject: Subject;
    marklist: Marklist | null;
    entry: StudentScore | null;
    finalScore: number | null;
    weightedTotal: number | null;
  }>> => {
    try {
      const [allStudents, allSubjects, allGrades] = await Promise.all([
        api.getStudents(companyId),
        api.getSubjects(companyId),
        api.getGrades(companyId),
      ]);

      const student = allStudents.find((s) => s.id === studentId);
      if (!student) return [];

      const studentSubjects = allSubjects.filter(
        (sub) => sub.isCommon || (sub.gradeIds && sub.gradeIds.includes(student.gradeId))
      );

      // Query marklists for student's grade & section
      let allMarklists: Marklist[] = [];
      try {
        const q = query(
          collection(firestoreDb, 'marklists'),
          where('companyId', '==', companyId),
          where('gradeId', '==', student.gradeId),
          where('sectionId', '==', student.sectionId)
        );
        const snap = await withTimeout(getDocs(q), 6000);
        if (!snap.empty) {
          allMarklists = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Marklist));
        }
      } catch {
        // use fallback seed
      }

      const seedLists = INITIAL_MARKLISTS.filter(
        (m) => m.companyId === companyId && m.gradeId === student.gradeId && m.sectionId === student.sectionId
      );

      return studentSubjects.map((sub) => {
        const found =
          allMarklists.find((m) => m.subjectId === sub.id) ||
          seedLists.find((m) => m.subjectId === sub.id) ||
          null;
        const entry = found?.entries?.find((e) => e.studentId === student.id) || null;
        return {
          subject: sub,
          marklist: found,
          entry,
          finalScore: entry ? (entry.weightedTotal ?? entry.score) : null,
          weightedTotal: entry ? (entry.weightedTotal ?? entry.score) : null,
        };
      });
    } catch (err) {
      logError('getStudentAcademicReport', err, { companyId, studentId });
      return [];
    }
  },

  // --- 7. School Dashboard Stats & Search ---
  getSchoolDashboardStats: async (companyId: string): Promise<SchoolDashboardStats> => {
    try {
      const [years, grades, sections, subjects, students, announcements] = await Promise.all([
        api.getAcademicYears(companyId),
        api.getGrades(companyId),
        api.getSections(companyId),
        api.getSubjects(companyId),
        api.getStudents(companyId),
        api.getAnnouncements(companyId),
      ]);

      const activeYear = years.find((y) => y.isActive) || years[0] || null;

      // Query saved marklists
      let savedMarklists: Marklist[] = [];
      try {
        const q = query(collection(firestoreDb, 'marklists'), where('companyId', '==', companyId));
        const snap = await withTimeout(getDocs(q), 6000);
        if (!snap.empty) {
          savedMarklists = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Marklist));
        } else {
          savedMarklists = INITIAL_MARKLISTS.filter((m) => m.companyId === companyId);
        }
      } catch {
        savedMarklists = INITIAL_MARKLISTS.filter((m) => m.companyId === companyId);
      }

      const gradesMap = new Map(grades.map((g) => [g.id, g.name]));
      const sectionsMap = new Map(sections.map((s) => [s.id, s.name]));
      const subjectsMap = new Map(subjects.map((sub) => [sub.id, sub.name]));
      const yearsMap = new Map(years.map((y) => [y.id, y.name]));

      const recentMarklists = savedMarklists.slice(0, 5).map((m) => {
        const filled = m.entries.filter((e) => e.score !== null && e.score !== undefined).length;
        return {
          id: m.id,
          gradeName: gradesMap.get(m.gradeId) || 'Grade',
          sectionName: sectionsMap.get(m.sectionId) || 'Section',
          subjectName: subjectsMap.get(m.subjectId) || 'Subject',
          academicYearName: yearsMap.get(m.academicYearId) || 'Academic Year',
          filledCount: filled,
          totalCount: m.entries.length,
          updatedAt: m.updatedAt,
        };
      });

      return {
        gradesCount: grades.length,
        sectionsCount: sections.length,
        subjectsCount: subjects.length,
        studentsCount: students.length,
        activeAcademicYear: activeYear,
        recentAnnouncementsCount: announcements.length,
        savedMarklistsCount: savedMarklists.length,
        recentMarklists,
      };
    } catch (err) {
      logError('getSchoolDashboardStats', err, { companyId });
      return {
        gradesCount: 4,
        sectionsCount: 8,
        subjectsCount: 10,
        studentsCount: 14,
        activeAcademicYear: INITIAL_ACADEMIC_YEARS[0],
        recentAnnouncementsCount: 3,
        savedMarklistsCount: 2,
        recentMarklists: [],
      };
    }
  },

  globalSchoolSearch: async (companyId: string, term: string): Promise<SchoolSearchResult[]> => {
    if (!term || !term.trim()) return [];
    const cleanTerm = term.toLowerCase().trim();

    const [students, grades, sections, subjects, announcements] = await Promise.all([
      api.getStudents(companyId),
      api.getGrades(companyId),
      api.getSections(companyId),
      api.getSubjects(companyId),
      api.getAnnouncements(companyId),
    ]);

    const results: SchoolSearchResult[] = [];

    // Search Students
    students.forEach((stu) => {
      if (
        stu.fullName.toLowerCase().includes(cleanTerm) ||
        stu.admissionNo.toLowerCase().includes(cleanTerm) ||
        stu.id.toLowerCase().includes(cleanTerm)
      ) {
        const gradeName = grades.find((g) => g.id === stu.gradeId)?.name || 'Grade';
        const sectionName = sections.find((s) => s.id === stu.sectionId)?.name || 'Section';
        results.push({
          type: 'student',
          id: stu.id,
          title: stu.fullName,
          subtitle: `${gradeName} • ${sectionName} • ID: ${stu.admissionNo}`,
          badge: 'Student',
          details: { ...stu, gradeName, sectionName },
          linkTab: 'students',
        });
      }
    });

    // Search Grades
    grades.forEach((g) => {
      if (g.name.toLowerCase().includes(cleanTerm) || (g.description && g.description.toLowerCase().includes(cleanTerm))) {
        results.push({
          type: 'grade',
          id: g.id,
          title: g.name,
          subtitle: g.description || `Level ${g.level}`,
          badge: 'Grade',
          linkTab: 'grades',
        });
      }
    });

    // Search Sections
    sections.forEach((sec) => {
      const parentGrade = grades.find((g) => g.id === sec.gradeId)?.name || '';
      if (sec.name.toLowerCase().includes(cleanTerm) || (sec.room && sec.room.toLowerCase().includes(cleanTerm))) {
        results.push({
          type: 'section',
          id: sec.id,
          title: `${sec.name} (${parentGrade})`,
          subtitle: sec.room ? `Room: ${sec.room} • Capacity: ${sec.capacity}` : `Grade: ${parentGrade}`,
          badge: 'Section',
          linkTab: 'grades',
        });
      }
    });

    // Search Subjects
    subjects.forEach((sub) => {
      if (
        sub.name.toLowerCase().includes(cleanTerm) ||
        (sub.code && sub.code.toLowerCase().includes(cleanTerm)) ||
        (sub.description && sub.description.toLowerCase().includes(cleanTerm))
      ) {
        results.push({
          type: 'subject',
          id: sub.id,
          title: sub.name,
          subtitle: `Code: ${sub.code || 'N/A'} • Max Score: ${sub.maxScore}${sub.isCommon ? ' • Common Subject' : ''}`,
          badge: 'Subject',
          linkTab: 'subjects',
        });
      }
    });

    // Search Announcements
    announcements.forEach((ann) => {
      const content = ann.content || ann.description || '';
      if (ann.title.toLowerCase().includes(cleanTerm) || content.toLowerCase().includes(cleanTerm)) {
        results.push({
          type: 'announcement',
          id: ann.id,
          title: ann.title,
          subtitle: ann.publishDate ? `Published: ${ann.publishDate.substring(0, 10)}` : 'School Announcement',
          badge: 'Announcement',
          linkTab: 'announcements',
        });
      }
    });

    return results;
  },
};
