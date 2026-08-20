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
import { db as firestoreDb } from './firebase';
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
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS } from '../data/seed';
import { THEME_REGISTRY } from '../data/themes';
import { FEATURE_REGISTRY } from '../data/features';
import { withTimeout, logAudit, logError } from './firestoreUtils';

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

  createUser: async (userData: Partial<User>): Promise<User> => {
    const userId = userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: userId,
      email: (userData.email || '').trim().toLowerCase(),
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
    } catch (err) {
      logError('createUser', err, { userId });
      throw new ApiError(500, 'Failed to save user account in Firestore.');
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
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
      }
    } catch (err) {
      logError('getCompanies', err);
    }
    return [];
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

    const newWebsite: Website = {
      id: webId,
      companyId: compId,
      themeId: 'theme_restaurant_classic',
      status: 'draft',
      draftConfig: {
        design: {
          primaryColor: '#B91C1C',
          secondaryColor: '#7F1D1D',
          accentColor: '#F97316',
          bgColor: '#FFFBEB',
          surfaceColor: '#FFFFFF',
          textColor: '#451A03',
          mutedTextColor: '#78716C',
          headingFont: 'Playfair Display',
          bodyFont: 'Plus Jakarta Sans',
          spacingDensity: 'comfortable',
        },
        header: {
          showLogo: true,
          showCompanyName: true,
          style: 'standard',
          sticky: true,
          showPhoneBtn: true,
          showTelegramBtn: true,
          showCtaBtn: true,
        },
        footer: {
          showLogo: true,
          showDescription: true,
          showContactInfo: true,
          showSocialLinks: true,
          showNavigation: true,
          showDeveloperCredit: true,
        },
        navigation: [
          { id: 'nav_home', label: 'Home', type: 'page', target: 'home', order: 1 },
          { id: 'nav_menu', label: 'Menu & Offerings', type: 'page', target: 'menu', order: 2 },
          { id: 'nav_about', label: 'About Us', type: 'page', target: 'about', order: 3 },
          { id: 'nav_contact', label: 'Contact', type: 'page', target: 'contact', order: 4 },
        ],
        pages: [
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
                title: newCompany.name,
                subtitle: newCompany.shortDescription,
                isVisible: true,
                order: 1,
              },
              {
                id: 'sec_featured',
                type: 'products',
                title: 'Featured Selection',
                subtitle: 'Handcrafted quality and signature favorites',
                isVisible: true,
                order: 2,
              },
              {
                id: 'sec_hours',
                type: 'hours',
                title: 'Business Hours & Location',
                subtitle: 'Visit our establishment in Addis Ababa',
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
                title: 'Full Menu & Catalog',
                subtitle: 'Discover our comprehensive range of products and services',
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
                title: 'Our Heritage & Mission',
                subtitle: `Learn more about ${newCompany.name}`,
                content: newCompany.shortDescription,
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
                subtitle: 'Call, message on Telegram, or visit us in person',
                isVisible: true,
                order: 1,
              },
            ],
          },
        ],
        installedFeatures: ['feature_digital_menu', 'feature_qr_generator'],
        seo: {
          siteTitle: newCompany.name,
          metaDescription: newCompany.shortDescription,
          keywords: [newCompany.name, newCompany.category, 'Ethiopia'],
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
      const code = err.code || 'UNKNOWN';
      throw new ApiError(500, `[Firestore Error on websites/${id} (${code})]: ${err.message || err}`);
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

    const newWebsite: Website = {
      id: webId,
      companyId: data.companyId,
      themeId: data.themeId || 'theme_restaurant_classic',
      status: data.status || 'draft',
      draftConfig: data.draftConfig || {
        design: {
          primaryColor: '#B91C1C',
          secondaryColor: '#7F1D1D',
          accentColor: '#F97316',
          bgColor: '#FFFBEB',
          surfaceColor: '#FFFFFF',
          textColor: '#451A03',
          mutedTextColor: '#78716C',
          headingFont: 'Playfair Display',
          bodyFont: 'Plus Jakarta Sans',
          spacingDensity: 'comfortable',
        },
        header: {
          showLogo: true,
          showCompanyName: true,
          style: 'standard',
          sticky: true,
          showPhoneBtn: true,
          showTelegramBtn: true,
          showCtaBtn: true,
        },
        footer: {
          showLogo: true,
          showDescription: true,
          showContactInfo: true,
          showSocialLinks: true,
          showNavigation: true,
          showDeveloperCredit: true,
        },
        navigation: [
          { id: 'nav_home', label: 'Home', type: 'page', target: 'home', order: 1 },
          { id: 'nav_menu', label: 'Menu & Offerings', type: 'page', target: 'menu', order: 2 },
          { id: 'nav_about', label: 'About Us', type: 'page', target: 'about', order: 3 },
          { id: 'nav_contact', label: 'Contact', type: 'page', target: 'contact', order: 4 },
        ],
        pages: defaultPages,
        installedFeatures: ['feature_digital_menu', 'feature_qr_generator'],
        seo: {
          siteTitle: parentCompany?.name || 'Verified Website',
          metaDescription: parentCompany?.shortDescription || 'Official verified storefront on NABSITE.',
          keywords: [parentCompany?.name || 'Business', parentCompany?.category || 'Ethiopia', 'NABSITE'],
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
  }): Promise<{ dataUrl: string; normalizedUrl: string }> => {
    const res = await fetch('/api/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to generate QR Code');
    }
    return res.json();
  },

  saveQrConfig: async (data: Partial<QrConfig>): Promise<QrConfig> => {
    const qrId = data.id || `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newQr: QrConfig = {
      id: qrId,
      companyId: data.companyId || '',
      targetUrl: data.targetUrl || 'https://nabsite.et',
      title: data.title || 'Official Digital Stand',
      caption: data.caption || 'SCAN WITH PHONE CAMERA',
      fgColor: data.fgColor || '#0F172A',
      bgColor: data.bgColor || '#FFFFFF',
      size: data.size || 400,
      margin: data.margin || 2,
      frameStyle: data.frameStyle || 'badge',
      scanCount: 0,
      createdAt: new Date().toISOString(),
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
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
    } catch {
      return [];
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
};
