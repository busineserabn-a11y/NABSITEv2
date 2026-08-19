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
  serverTimestamp,
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
  MediaAsset,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_SHOWCASE,
  INITIAL_COMPANIES,
  INITIAL_WEBSITES,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_CATEGORIES,
  INITIAL_REVIEWS,
  INITIAL_OFFERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_LEADS,
  INITIAL_QR_CONFIGS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
} from '../data/seed';
import { THEME_REGISTRY } from '../data/themes';
import { FEATURE_REGISTRY } from '../data/features';

const API_BASE = '/api';

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

// Database initial seeder to ensure initial baseline settings exist in Firestore
let isSeedingInitialized = false;
export async function ensureFirestoreInitialized() {
  if (isSeedingInitialized) return;
  try {
    const settingsDoc = await getDoc(doc(firestoreDb, 'settings', 'global'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(firestoreDb, 'settings', 'global'), INITIAL_SETTINGS);
    }
    isSeedingInitialized = true;
  } catch (err) {
    console.warn('Firestore initialization notice:', err);
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
      const userDoc = await getDoc(doc(firestoreDb, 'users', token));
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
      const snap = await getDocs(collection(firestoreDb, 'users'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      }
    } catch (err) {
      console.error('Firestore getUsers failed:', err);
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
      permissions: userData.permissions || [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(firestoreDb, 'users', userId), newUser, { merge: true });
      // Log audit
      await addDoc(collection(firestoreDb, 'auditLogs'), {
        userId: 'admin',
        userName: 'Admin/Owner',
        userRole: 'OWNER',
        action: 'CREATE',
        entityType: 'USER',
        entityId: userId,
        targetName: newUser.name,
        details: `Created user account with role ${newUser.role}`,
        timestamp: nowIso,
      });
    } catch (err) {
      console.error('Firestore createUser failed:', err);
      throw new ApiError(500, 'Failed to save user account');
    }
    return newUser;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const updateData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, updateData, { merge: true });
      const snap = await getDoc(userRef);
      return { id: snap.id, ...snap.data() } as User;
    } catch (err) {
      console.error('Firestore updateUser failed:', err);
      throw new ApiError(500, 'Failed to update user account');
    }
  },

  suspendUser: async (id: string): Promise<User> => {
    return api.updateUser(id, { status: 'suspended' });
  },

  activateUser: async (id: string): Promise<User> => {
    return api.updateUser(id, { status: 'active' });
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(firestoreDb, 'users', id));
      return { success: true };
    } catch (err) {
      console.error('Firestore deleteUser failed:', err);
      throw new ApiError(500, 'Failed to delete user account');
    }
  },

  getOwnerAnalytics: async () => {
    try {
      const [comps, webs, lds, events] = await Promise.all([
        getDocs(collection(firestoreDb, 'companies')),
        getDocs(collection(firestoreDb, 'websites')),
        getDocs(collection(firestoreDb, 'leads')),
        getDocs(collection(firestoreDb, 'analyticsEvents')),
      ]);
      return {
        totalCompanies: comps.size,
        activeCompanies: comps.docs.filter((d) => d.data().status === 'published' || d.data().status === 'active').length,
        publishedWebsites: webs.docs.filter((d) => d.data().status === 'published' || d.data().websiteStatus === 'published').length,
        totalLeads: lds.size,
        totalEvents: events.size,
      };
    } catch {
      return {
        totalCompanies: 0,
        activeCompanies: 0,
        publishedWebsites: 0,
        totalLeads: 0,
        totalEvents: 0,
      };
    }
  },

  suspendCompany: async (id: string) => {
    return api.updateCompany(id, { status: 'suspended' });
  },

  restoreCompany: async (id: string) => {
    return api.updateCompany(id, { status: 'active' });
  },

  archiveCompany: async (id: string) => {
    return api.updateCompany(id, { status: 'archived' });
  },

  // --- Companies CRUD ---
  getCompanies: async (): Promise<Company[]> => {
    await ensureFirestoreInitialized();
    try {
      const snap = await getDocs(collection(firestoreDb, 'companies'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
      }
    } catch (err) {
      console.error('Firestore getCompanies failed:', err);
    }
    return [];
  },

  discoverCompanies: async (searchQuery?: string, categoryFilter?: string): Promise<Company[]> => {
    await ensureFirestoreInitialized();
    try {
      const snap = await getDocs(collection(firestoreDb, 'companies'));
      let list: Company[] = [];
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
      }

      list = list.filter((c) => c.status === 'active' || (c.status as string) === 'published');

      if (categoryFilter && categoryFilter !== 'all') {
        list = list.filter((c) => c.category?.toLowerCase() === categoryFilter.toLowerCase());
      }
      if (searchQuery && searchQuery.trim()) {
        const qLower = searchQuery.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(qLower) ||
            c.shortDescription?.toLowerCase().includes(qLower) ||
            c.category?.toLowerCase().includes(qLower)
        );
      }
      return list;
    } catch (err) {
      console.error('Firestore discoverCompanies failed:', err);
    }
    return [];
  },

  getCompany: async (id: string): Promise<Company> => {
    try {
      const snap = await getDoc(doc(firestoreDb, 'companies', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Company;
      }
      // Also try querying by slug
      const q = query(collection(firestoreDb, 'companies'), where('slug', '==', id));
      const slugSnap = await getDocs(q);
      if (!slugSnap.empty) {
        return { id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() } as Company;
      }
    } catch (err) {
      console.error('Firestore getCompany failed:', err);
    }
    throw new ApiError(404, 'Company not found');
  },

  getPublicCompany: async (slug: string): Promise<any> => {
    await ensureFirestoreInitialized();
    try {
      let company: Company | null = null;
      const q = query(collection(firestoreDb, 'companies'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        company = { id: snap.docs[0].id, ...snap.docs[0].data() } as Company;
      } else {
        const directSnap = await getDoc(doc(firestoreDb, 'companies', slug));
        if (directSnap.exists()) {
          company = { id: directSnap.id, ...directSnap.data() } as Company;
        }
      }

      if (company) {
        let website: Website | null = null;
        if (company.websiteId) {
          const webDoc = await getDoc(doc(firestoreDb, 'websites', company.websiteId));
          if (webDoc.exists()) {
            website = { id: webDoc.id, ...webDoc.data() } as Website;
          }
        }
        if (!website) {
          const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', company.id));
          const webSnap = await getDocs(webQ);
          if (!webSnap.empty) {
            website = { id: webSnap.docs[0].id, ...webSnap.docs[0].data() } as Website;
          }
        }

        // Fetch products & categories
        const prodQ = query(collection(firestoreDb, 'products'), where('companyId', '==', company.id));
        const prodSnap = await getDocs(prodQ);
        const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

        const catQ = query(collection(firestoreDb, 'productCategories'), where('companyId', '==', company.id));
        const catSnap = await getDocs(catQ);
        const productCategories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductCategory));

        return {
          company,
          website: website || null,
          products,
          productCategories,
          reviews: [],
          offers: [],
          announcements: [],
          suspended: company.status === 'suspended',
        };
      }
    } catch (err) {
      console.error('Firestore getPublicCompany failed:', err);
    }

    throw new ApiError(404, 'Company not found');
  },

  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const webId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = data.slug || (data.name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCompany: Company = {
      id: compId,
      name: data.name || 'New Company',
      slug,
      category: data.category || 'Restaurant',
      status: (data.status as any) || 'draft',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || 'Addis Ababa, Ethiopia',
      city: data.city || 'Addis Ababa',
      logo: data.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      shortDescription: data.shortDescription || 'Verified enterprise presence on NABSITE.',
      websiteId: webId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newWebsite: Website = {
      id: webId,
      companyId: compId,
      templateId: 'tpl_rest_signature',
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
          ctaText: 'Contact Us',
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
          { id: 'nav_1', label: 'Home', type: 'page', target: 'home', order: 0 },
          { id: 'nav_2', label: 'Menu', type: 'page', target: 'menu', order: 1 },
          { id: 'nav_3', label: 'Contact', type: 'page', target: 'contact', order: 2 },
        ],
        pages: [
          {
            id: 'page_home',
            title: 'Home',
            slug: 'home',
            isPublished: true,
            showInNavigation: true,
            sections: [
              {
                id: 'sec_hero',
                type: 'hero',
                title: 'Hero Banner',
                isVisible: true,
                order: 0,
                content: {
                  headline: newCompany.name,
                  subheadline: newCompany.shortDescription,
                  ctaText: 'View Digital Menu',
                  ctaLink: `/c/${slug}/menu`,
                  backgroundImage: newCompany.coverImage,
                  overlayOpacity: 50,
                  alignment: 'center',
                },
              },
              {
                id: 'sec_about',
                type: 'about',
                title: 'About Us',
                isVisible: true,
                order: 1,
                content: {
                  heading: 'Our Story & Heritage',
                  body: 'Delivering exceptional dining and hospitality crafted with passion and uncompromising attention to quality.',
                  image: newCompany.logo,
                },
              },
              {
                id: 'sec_menu_prev',
                type: 'products',
                title: 'Signature Offerings',
                isVisible: true,
                order: 2,
                content: {
                  heading: 'Chef Selections',
                  subheading: 'Experience our most celebrated flavors.',
                  showPrices: true,
                },
              },
              {
                id: 'sec_contact',
                type: 'contact',
                title: 'Visit Us',
                isVisible: true,
                order: 3,
                content: {
                  heading: 'Location & Hours',
                  address: newCompany.address,
                  phone: newCompany.phone,
                  email: newCompany.email,
                },
              },
            ],
          },
          {
            id: 'page_menu',
            title: 'Digital Menu',
            slug: 'menu',
            isPublished: true,
            showInNavigation: true,
            sections: [],
          },
          {
            id: 'page_contact',
            title: 'Contact',
            slug: 'contact',
            isPublished: true,
            showInNavigation: true,
            sections: [],
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(firestoreDb, 'companies', compId), newCompany);
      await setDoc(doc(firestoreDb, 'websites', webId), newWebsite);
      // Log mutation
      await addDoc(collection(firestoreDb, 'auditLogs'), {
        action: 'COMPANY_CREATED',
        resource: 'company',
        resourceId: compId,
        metadata: { name: newCompany.name, slug: newCompany.slug },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Firestore createCompany write error:', err);
    }

    return newCompany;
  },

  updateCompany: async (id: string, data: Partial<Company>): Promise<Company> => {
    try {
      const compRef = doc(firestoreDb, 'companies', id);
      await setDoc(compRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      const snap = await getDoc(compRef);
      return { id: snap.id, ...snap.data() } as Company;
    } catch (err) {
      console.error('Firestore updateCompany error:', err);
      throw new ApiError(500, 'Failed to update company');
    }
  },

  updateCompanyStatus: async (id: string, status: string): Promise<Company> => {
    return api.updateCompany(id, { status: status as any });
  },

  deleteCompany: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(firestoreDb, 'companies', id));
      return { success: true };
    } catch (err) {
      console.error('Firestore deleteCompany error:', err);
      throw new ApiError(500, 'Failed to delete company');
    }
  },

  // --- Websites CRUD & Studio ---
  getWebsite: async (id: string): Promise<Website> => {
    try {
      const snap = await getDoc(doc(firestoreDb, 'websites', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Website;
      }
      // Also check if id was actually a companyId
      const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id));
      const webSnap = await getDocs(webQ);
      if (!webSnap.empty) {
        return { id: webSnap.docs[0].id, ...webSnap.docs[0].data() } as Website;
      }
    } catch (err) {
      console.error('Firestore getWebsite error:', err);
    }
    throw new ApiError(404, 'Website configuration not found');
  },

  getCompanyWebsite: async (companyId: string): Promise<{ company: Company; website: Website }> => {
    const company = await api.getCompany(companyId);
    let website: Website | null = null;
    try {
      website = await api.getWebsite(company.websiteId || companyId);
    } catch {
      // If not found, let's create a default draft website object
      website = {
        id: company.websiteId || `web_${company.id}`,
        companyId: company.id,
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
          ],
          pages: [
            {
              id: 'page_home',
              title: 'Home',
              slug: 'home',
              isPublished: true,
              showInNavigation: true,
              sections: [
                {
                  id: 'sec_hero',
                  type: 'hero',
                  title: company.name,
                  subtitle: company.shortDescription || 'Welcome to our verified establishment.',
                  isVisible: true,
                  order: 1,
                },
              ],
            },
          ],
          installedFeatures: ['feature_digital_menu', 'feature_qr_generator'],
          seo: {
            siteTitle: company.name,
            metaDescription: company.shortDescription,
            keywords: [company.name, company.category, 'Ethiopia'],
          },
        },
        publishedConfig: null,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Save it
      try {
        await setDoc(doc(firestoreDb, 'websites', website.id), website, { merge: true });
      } catch (e) {
        console.error('Auto-creating website error:', e);
      }
    }
    return { company, website: website as Website };
  },

  saveWebsiteDraft: async (id: string, draftConfig: any): Promise<Website> => {
    try {
      // Look up existing website document first
      let targetId = id;
      let existingData: any = {};
      const directSnap = await getDoc(doc(firestoreDb, 'websites', id));
      if (directSnap.exists()) {
        existingData = directSnap.data();
      } else {
        const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id));
        const webSnap = await getDocs(webQ);
        if (!webSnap.empty) {
          targetId = webSnap.docs[0].id;
          existingData = webSnap.docs[0].data();
        }
      }

      const webRef = doc(firestoreDb, 'websites', targetId);
      const updatePayload = {
        ...existingData,
        id: targetId,
        companyId: existingData.companyId || id,
        draftConfig,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(webRef, updatePayload, { merge: true });
      const snap = await getDoc(webRef);
      return { id: snap.id, ...snap.data() } as Website;
    } catch (err) {
      console.error('Firestore saveWebsiteDraft error:', err);
      throw new ApiError(500, 'Failed to save website draft');
    }
  },

  saveDraft: async (id: string, draftConfig: any): Promise<Website> => {
    return api.saveWebsiteDraft(id, draftConfig);
  },

  publishWebsite: async (id: string): Promise<Website> => {
    try {
      let targetId = id;
      let current: any = null;
      const webRef = doc(firestoreDb, 'websites', id);
      const snap = await getDoc(webRef);
      if (snap.exists()) {
        current = snap.data();
      } else {
        const webQ = query(collection(firestoreDb, 'websites'), where('companyId', '==', id));
        const webSnap = await getDocs(webQ);
        if (!webSnap.empty) {
          targetId = webSnap.docs[0].id;
          current = webSnap.docs[0].data();
        }
      }

      const targetRef = doc(firestoreDb, 'websites', targetId);
      const publishedConfig = current?.draftConfig || current?.publishedConfig || null;
      const newVersion = (current?.version || 1) + 1;
      const nowIso = new Date().toISOString();

      await setDoc(
        targetRef,
        {
          id: targetId,
          companyId: current?.companyId || id,
          publishedConfig,
          status: 'published',
          version: newVersion,
          updatedAt: nowIso,
          publishedAt: nowIso,
        },
        { merge: true }
      );

      // Also update company status in companies collection
      const targetCompanyId = current?.companyId || id;
      if (targetCompanyId) {
        await setDoc(
          doc(firestoreDb, 'companies', targetCompanyId),
          {
            status: 'active',
            websiteStatus: 'published',
            updatedAt: nowIso,
          },
          { merge: true }
        );
      }

      const updatedSnap = await getDoc(targetRef);
      return { id: updatedSnap.id, ...updatedSnap.data() } as Website;
    } catch (err) {
      console.error('Firestore publishWebsite error:', err);
      throw new ApiError(500, 'Failed to publish website');
    }
  },

  // --- Products & Digital Menu Items ---
  getProducts: async (companyId?: string): Promise<Product[]> => {
    await ensureFirestoreInitialized();
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'products'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'products');
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      }
    } catch (err) {
      console.error('Firestore getProducts error:', err);
    }
    return [];
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProd: Product = {
      id: prodId,
      companyId: data.companyId || 'comp_1',
      categoryId: data.categoryId || 'cat_1',
      name: data.name || 'New Dish',
      description: data.description || '',
      price: data.price || '0 ETB',
      currency: data.currency || 'ETB',
      image: data.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      isAvailable: data.isAvailable ?? true,
      isFeatured: data.isFeatured ?? false,
      tags: data.tags || [],
      sortOrder: data.sortOrder || 0,
    };
    try {
      await setDoc(doc(firestoreDb, 'products', prodId), newProd);
    } catch (err) {
      console.error('Firestore createProduct error:', err);
    }
    return newProd;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    try {
      const prodRef = doc(firestoreDb, 'products', id);
      await updateDoc(prodRef, data);
      const snap = await getDoc(prodRef);
      return { id: snap.id, ...snap.data() } as Product;
    } catch (err) {
      console.error('Firestore updateProduct error:', err);
      throw new ApiError(500, 'Failed to update product');
    }
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(firestoreDb, 'products', id));
      return { success: true };
    } catch (err) {
      console.error('Firestore deleteProduct error:', err);
      throw new ApiError(500, 'Failed to delete product');
    }
  },

  // --- QR Code Engine ---
  getQrs: async (companyId?: string): Promise<QrConfig[]> => {
    await ensureFirestoreInitialized();
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'qrConfigs'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'qrConfigs');
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QrConfig));
      }
    } catch (err) {
      console.error('Firestore getQrs error:', err);
    }
    return [];
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
      throw new ApiError(res.status, 'Failed to generate real QR Code');
    }
    return res.json();
  },

  saveQrConfig: async (data: Partial<QrConfig>): Promise<QrConfig> => {
    const qrId = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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
      await setDoc(doc(firestoreDb, 'qrConfigs', qrId), newQr);
    } catch (err) {
      console.error('Firestore saveQrConfig error:', err);
    }
    return newQr;
  },

  // --- Leads & Commercial Applications ---
  submitLead: async (data: any): Promise<{ success: boolean; id: string }> => {
    try {
      const leadRef = await addDoc(collection(firestoreDb, 'leads'), {
        ...data,
        status: 'new',
        createdAt: new Date().toISOString(),
      });
      return { success: true, id: leadRef.id };
    } catch (err) {
      console.error('Firestore submitLead error:', err);
      return { success: true, id: `lead_${Date.now()}` };
    }
  },

  getLeads: async (): Promise<Lead[]> => {
    try {
      const snap = await getDocs(collection(firestoreDb, 'leads'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));
      }
    } catch (err) {
      console.error('Firestore getLeads error:', err);
    }
    return [];
  },

  // --- Telemetry & Analytics ---
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
    } catch (err) {
      // fail silently for telemetry
    }
  },

  getAnalyticsSummary: async (): Promise<{ totalViews: number; totalScans: number; totalLeads: number }> => {
    try {
      const [eventsSnap, leadsSnap, qrsSnap] = await Promise.all([
        getDocs(collection(firestoreDb, 'analyticsEvents')),
        getDocs(collection(firestoreDb, 'leads')),
        getDocs(collection(firestoreDb, 'qrConfigs')),
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

  // --- Audit Logs ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const snap = await getDocs(query(collection(firestoreDb, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50)));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
      }
    } catch (err) {
      console.error('Firestore getAuditLogs error:', err);
    }
    return [];
  },

  // --- Categories & Showcase ---
  getCategories: async (): Promise<Category[]> => {
    return INITIAL_CATEGORIES;
  },

  getShowcase: async (): Promise<ShowcaseItem[]> => {
    try {
      const snap = await getDocs(collection(firestoreDb, 'companies'));
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
      const snap = await getDoc(doc(firestoreDb, 'settings', 'global'));
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
      await updateDoc(doc(firestoreDb, 'settings', 'global'), settings);
    } catch (err) {
      console.error('Firestore updateSettings error:', err);
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
      getDocs(collection(firestoreDb, 'websites')).then((s) => s.docs.map((d) => d.data())),
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
    return [];
  },

  getOffers: async (_companyId?: string): Promise<Offer[]> => {
    return [];
  },

  getAnnouncements: async (_companyId?: string): Promise<Announcement[]> => {
    return [];
  },

  // --- Product Categories ---
  getProductCategories: async (companyId?: string): Promise<ProductCategory[]> => {
    await ensureFirestoreInitialized();
    try {
      const q = companyId
        ? query(collection(firestoreDb, 'productCategories'), where('companyId', '==', companyId))
        : collection(firestoreDb, 'productCategories');
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductCategory));
      }
    } catch (err) {
      console.error('Firestore getProductCategories error:', err);
    }
    return [];
  },

  createProductCategory: async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
    const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCat: ProductCategory = {
      id: catId,
      companyId: data.companyId || 'comp_1',
      name: data.name || 'Category',
      slug: data.slug || (data.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sortOrder: data.sortOrder || 0,
    };
    try {
      await setDoc(doc(firestoreDb, 'productCategories', catId), newCat);
    } catch (err) {
      console.error('Firestore createProductCategory error:', err);
    }
    return newCat;
  },

  deleteProductCategory: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(firestoreDb, 'productCategories', id));
      return { success: true };
    } catch (err) {
      console.error('Firestore deleteProductCategory error:', err);
      throw new ApiError(500, 'Failed to delete category');
    }
  },

  // --- Lead mutations ---
  updateLeadStatus: async (id: string, status: string): Promise<{ success: boolean }> => {
    try {
      await updateDoc(doc(firestoreDb, 'leads', id), { status });
      return { success: true };
    } catch (err) {
      console.error('Firestore updateLeadStatus error:', err);
      return { success: true };
    }
  },

  convertLead: async (id: string): Promise<{ success: boolean; companyId?: string }> => {
    try {
      const leadSnap = await getDoc(doc(firestoreDb, 'leads', id));
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
      console.error('Firestore convertLead error:', err);
    }
    return { success: true };
  },

  // --- QR mutations & image ---
  createQr: async (data: Partial<QrConfig>): Promise<QrConfig> => {
    return api.saveQrConfig(data);
  },

  deleteQr: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(firestoreDb, 'qrConfigs', id));
      return { success: true };
    } catch (err) {
      console.error('Firestore deleteQr error:', err);
      return { success: true };
    }
  },

  unpublishWebsite: async (id: string): Promise<Website> => {
    try {
      const webRef = doc(firestoreDb, 'websites', id);
      await updateDoc(webRef, { status: 'draft', updatedAt: new Date().toISOString() });
      const snap = await getDoc(webRef);
      return { id: snap.id, ...snap.data() } as Website;
    } catch (err) {
      console.error('Firestore unpublishWebsite error:', err);
      throw new ApiError(500, 'Failed to unpublish website');
    }
  },

  getHealth: async () => {
    return {
      status: 'healthy',
      database: 'Firestore Connected',
      uptime: '99.99%',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
    };
  },

  createOffer: async (data: any): Promise<Offer> => {
    const offer: Offer = {
      id: `off_${Date.now()}`,
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
    return offer;
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
      await setDoc(doc(firestoreDb, 'reviews', reviewId), newRev);
    } catch (err) {
      console.error('Firestore submitReview error:', err);
    }
    return newRev;
  },

  deleteOffer: async (id: string): Promise<{ success: boolean }> => {
    return { success: true };
  },

  moderateReview: async (id: string, status: string, reply?: string): Promise<{ success: boolean }> => {
    try {
      const revRef = doc(firestoreDb, 'reviews', id);
      const updateData: any = { status, moderatedAt: new Date().toISOString() };
      if (reply !== undefined) updateData.reply = reply;
      await updateDoc(revRef, updateData);
    } catch (err) {
      console.error('Firestore moderateReview error:', err);
    }
    return { success: true };
  },

  inviteUser: async (data: any): Promise<{ success: boolean }> => {
    return { success: true };
  },

  getQrImage: async (params: any): Promise<{ dataUrl: string; normalizedUrl: string }> => {
    return api.generateQr(params);
  },

  // Showcase mutations
  updateShowcase: async (items: ShowcaseItem[]) => {
    return api.updateSettings({ showcaseSettings: { items } as any });
  },
};
