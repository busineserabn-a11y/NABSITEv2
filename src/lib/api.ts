// Centralized API Client for NABSITE
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(0, err?.message || 'Network request failed');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    let data: any = null;
    if (isJson) {
      try {
        data = await response.json();
        errorMsg = data?.error || data?.message || errorMsg;
      } catch {
        // ignore json parse error
      }
    }
    throw new ApiError(response.status, errorMsg, data);
  }

  if (!isJson) {
    throw new ApiError(500, 'Invalid response format from server');
  }

  const data = await response.json();
  return data as T;
}

export const api = {
  // Public
  getSettings: async () => {
    try {
      return await request<PlatformSettings>('/public/settings');
    } catch {
      return INITIAL_SETTINGS;
    }
  },
  getCategories: async () => {
    try {
      return await request<Category[]>('/public/categories');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },
  getShowcase: async () => {
    try {
      return await request<ShowcaseItem[]>('/public/showcase');
    } catch {
      return INITIAL_SHOWCASE;
    }
  },
  discoverCompanies: async (query?: string, category?: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      return await request<Company[]>(`/public/discover?${params.toString()}`);
    } catch {
      let filtered = [...INITIAL_COMPANIES];
      if (category && category !== 'all') {
        filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
      }
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.shortDescription?.toLowerCase().includes(q) ||
            c.fullDescription?.toLowerCase().includes(q) ||
            c.subcategory?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },
  getPublicCompany: async (slug: string) => {
    try {
      return await request<{
        company: Company;
        website: Website;
        products?: Product[];
        productCategories?: ProductCategory[];
        reviews?: Review[];
        offers?: Offer[];
        announcements?: Announcement[];
        suspended?: boolean;
      }>(`/public/company/${slug}`);
    } catch {
      const comp = INITIAL_COMPANIES.find(
        (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id === slug
      );
      if (!comp) {
        throw new Error('Company not found');
      }
      const web = INITIAL_WEBSITES.find((w) => w.companyId === comp.id) || INITIAL_WEBSITES[0];
      const prods = INITIAL_PRODUCTS.filter((p) => p.companyId === comp.id);
      const prodCats = INITIAL_PRODUCT_CATEGORIES.filter((pc) => pc.companyId === comp.id);
      const revs = INITIAL_REVIEWS.filter((r) => r.companyId === comp.id);
      const offs = INITIAL_OFFERS.filter((o) => o.companyId === comp.id);
      const anns = INITIAL_ANNOUNCEMENTS.filter((a) => a.companyId === comp.id);

      return {
        company: comp,
        website: web,
        products: prods,
        productCategories: prodCats,
        reviews: revs,
        offers: offs,
        announcements: anns,
        suspended: comp.status === 'suspended',
      };
    }
  },
  submitLead: (leadData: Partial<Lead>) =>
    request<{ success: boolean; lead: Lead }>('/public/leads', { method: 'POST', body: JSON.stringify(leadData) }),
  submitReview: (reviewData: { companyId: string; name: string; rating: number; text: string }) =>
    request<{ success: boolean; message: string }>('/public/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  recordEvent: (eventData: any) =>
    request<{ success: boolean; id: string }>('/public/analytics/event', { method: 'POST', body: JSON.stringify(eventData) }),

  // Auth
  login: (email: string, password?: string) =>
    request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  ownerLogin: (key?: string, email?: string) =>
    request<{ user: User; token: string }>('/auth/owner-login', { method: 'POST', body: JSON.stringify({ key, email }) }),
  getMe: () => request<{ user: User }>('/auth/me'),

  // Companies
  getCompanies: async () => {
    try {
      return await request<Company[]>('/companies');
    } catch {
      return INITIAL_COMPANIES;
    }
  },
  getCompany: async (id: string) => {
    try {
      return await request<{ company: Company; website: Website }>(`/companies/${id}`);
    } catch {
      const comp = INITIAL_COMPANIES.find((c) => c.id === id || c.slug === id) || INITIAL_COMPANIES[0];
      const web = INITIAL_WEBSITES.find((w) => w.companyId === comp.id) || INITIAL_WEBSITES[0];
      return { company: comp, website: web };
    }
  },
  createCompany: (companyData: any) =>
    request<{ company: Company; website: Website; qr: QrConfig }>('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    }),
  updateCompany: (id: string, updates: Partial<Company>) =>
    request<{ company: Company }>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  updateCompanyStatus: (id: string, status: string) =>
    request<{ success: boolean; company: Company }>(`/companies/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteCompany: (id: string) =>
    request<{ success: boolean; message: string }>(`/companies/${id}`, { method: 'DELETE' }),

  // Websites & Studio
  getWebsites: async () => {
    try {
      return await request<Website[]>('/websites');
    } catch {
      return INITIAL_WEBSITES;
    }
  },
  getWebsite: async (id: string) => {
    try {
      return await request<{ website: Website; company: Company }>(`/websites/${id}`);
    } catch {
      const web = INITIAL_WEBSITES.find((w) => w.id === id || w.companyId === id) || INITIAL_WEBSITES[0];
      const comp = INITIAL_COMPANIES.find((c) => c.id === web.companyId) || INITIAL_COMPANIES[0];
      return { website: web, company: comp };
    }
  },
  getCompanyWebsite: async (companyId: string) => {
    try {
      return await request<{ company: Company; website: Website }>(`/companies/${companyId}`);
    } catch {
      const comp = INITIAL_COMPANIES.find((c) => c.id === companyId) || INITIAL_COMPANIES[0];
      const web = INITIAL_WEBSITES.find((w) => w.companyId === comp.id) || INITIAL_WEBSITES[0];
      return { company: comp, website: web };
    }
  },
  saveDraft: (id: string, draftConfig: any, themeId?: string) =>
    request<{ success: boolean; website: Website }>(`/websites/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ draftConfig, themeId }),
    }),
  updateWebsite: (id: string, updates: any) =>
    request<{ success: boolean; website: Website }>(`/websites/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  publishWebsite: (id: string) => request<{ success: boolean; website: Website }>(`/websites/${id}/publish`, { method: 'POST' }),
  unpublishWebsite: (id: string) => request<{ success: boolean; website: Website }>(`/websites/${id}/unpublish`, { method: 'POST' }),

  // Themes & Features
  getThemes: async () => {
    try {
      return await request<ThemeDefinition[]>('/themes');
    } catch {
      return THEME_REGISTRY;
    }
  },
  getFeatures: async () => {
    try {
      return await request<FeatureDefinition[]>('/features');
    } catch {
      return FEATURE_REGISTRY;
    }
  },

  // Products
  getProducts: async (companyId?: string) => {
    try {
      return await request<Product[]>(`/products${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_PRODUCTS.filter((p) => p.companyId === companyId) : INITIAL_PRODUCTS;
    }
  },
  createProduct: (productData: any) => request<Product>('/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id: string, updates: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  // Product Categories
  getProductCategories: async (companyId?: string) => {
    try {
      return await request<ProductCategory[]>(`/product-categories${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_PRODUCT_CATEGORIES.filter((p) => p.companyId === companyId) : INITIAL_PRODUCT_CATEGORIES;
    }
  },
  createProductCategory: (data: any) =>
    request<ProductCategory>('/product-categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteProductCategory: (id: string) => request<{ success: boolean }>(`/product-categories/${id}`, { method: 'DELETE' }),

  // Reviews
  getReviews: async (companyId?: string) => {
    try {
      return await request<Review[]>(`/reviews${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_REVIEWS.filter((r) => r.companyId === companyId) : INITIAL_REVIEWS;
    }
  },
  moderateReview: (id: string, status: string, reply?: string) =>
    request<{ success: boolean; review: Review }>(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reply }),
    }),

  // Offers & Announcements
  getOffers: async (companyId?: string) => {
    try {
      return await request<Offer[]>(`/offers${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_OFFERS.filter((o) => o.companyId === companyId) : INITIAL_OFFERS;
    }
  },
  createOffer: (offerData: any) => request<Offer>('/offers', { method: 'POST', body: JSON.stringify(offerData) }),
  deleteOffer: (id: string) => request<{ success: boolean }>(`/offers/${id}`, { method: 'DELETE' }),
  getAnnouncements: async (companyId?: string) => {
    try {
      return await request<Announcement[]>(`/announcements${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_ANNOUNCEMENTS.filter((a) => a.companyId === companyId) : INITIAL_ANNOUNCEMENTS;
    }
  },
  createAnnouncement: (annData: any) =>
    request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(annData) }),

  // Leads
  getLeads: async () => {
    try {
      return await request<Lead[]>('/leads');
    } catch {
      return INITIAL_LEADS;
    }
  },
  updateLeadStatus: (id: string, status: string, notes?: any, assignedAdminId?: string) =>
    request<{ success: boolean; lead: Lead }>(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, assignedAdminId }),
    }),
  convertLead: (id: string) =>
    request<{ success: boolean; company: Company; website: Website }>(`/leads/${id}/convert`, { method: 'POST' }),

  // QR
  getQrs: async (companyId?: string) => {
    try {
      return await request<QrConfig[]>(`/qr${companyId ? `?companyId=${companyId}` : ''}`);
    } catch {
      return companyId ? INITIAL_QR_CONFIGS.filter((q) => q.companyId === companyId) : INITIAL_QR_CONFIGS;
    }
  },
  createQr: (qrData: any) => request<QrConfig>('/qr', { method: 'POST', body: JSON.stringify(qrData) }),
  updateQr: (id: string, updates: Partial<QrConfig>) =>
    request<QrConfig>(`/qr/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteQr: (id: string) => request<{ success: boolean }>(`/qr/${id}`, { method: 'DELETE' }),
  getQrImage: (id: string) => request<{ dataUrl: string; fullUrl: string }>(`/qr/${id}/image`),
  generateQr: (data: { url: string; size?: number; fgColor?: string; bgColor?: string; margin?: number }) =>
    request<{ dataUrl: string; normalizedUrl: string }>('/qr/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Users & Team
  getUsers: async () => {
    try {
      return await request<User[]>('/users');
    } catch {
      return INITIAL_USERS;
    }
  },
  inviteUser: (inviteData: any) => request<any>('/invitations', { method: 'POST', body: JSON.stringify(inviteData) }),
  revokeInvitation: (id: string) => request<any>(`/invitations/${id}`, { method: 'DELETE' }),

  // Owner System
  getOwnerSettings: async () => {
    try {
      return await request<PlatformSettings>('/owner/settings');
    } catch {
      return INITIAL_SETTINGS;
    }
  },
  updateSettings: (updates: Partial<PlatformSettings>) =>
    request<{ success: boolean; settings: PlatformSettings }>('/owner/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  updateOwnerSettings: (updates: Partial<PlatformSettings>) =>
    request<{ success: boolean; settings: PlatformSettings }>('/owner/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  getAuditLogs: async () => {
    try {
      return await request<AuditLog[]>('/owner/audit');
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },
  getOwnerAnalytics: () => request<any>('/owner/analytics/summary'),
  getHealth: () => request<any>('/health'),
  getOwnerExport: () => request<any>('/owner/export'),
  updateShowcase: (items: ShowcaseItem[]) =>
    request<{ success: boolean; showcase: ShowcaseItem[] }>('/owner/showcase', {
      method: 'PUT',
      body: JSON.stringify(items),
    }),
  createCategory: (data: Partial<Category>) =>
    request<{ success: boolean; category: Category }>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Media
  getMedia: (companyId?: string) => request<MediaAsset[]>(`/media${companyId ? `?companyId=${companyId}` : ''}`),
  uploadMedia: (data: any) => request<MediaAsset>('/media', { method: 'POST', body: JSON.stringify(data) }),
};
