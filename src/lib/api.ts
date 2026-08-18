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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  // Public
  getSettings: () => request<PlatformSettings>('/public/settings'),
  getCategories: () => request<Category[]>('/public/categories'),
  getShowcase: () => request<ShowcaseItem[]>('/public/showcase'),
  discoverCompanies: (query?: string, category?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    return request<Company[]>(`/public/discover?${params.toString()}`);
  },
  getPublicCompany: (slug: string) =>
    request<{
      company: Company;
      website: Website;
      products?: Product[];
      productCategories?: ProductCategory[];
      reviews?: Review[];
      offers?: Offer[];
      announcements?: Announcement[];
      suspended?: boolean;
    }>(`/public/company/${slug}`),
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
  getCompanies: () => request<Company[]>('/companies'),
  getCompany: (id: string) => request<{ company: Company; website: Website }>(`/companies/${id}`),
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
  getWebsites: () => request<Website[]>('/websites'),
  getWebsite: (id: string) => request<{ website: Website; company: Company }>(`/websites/${id}`),
  getCompanyWebsite: async (companyId: string) => {
    const res = await request<{ company: Company; website: Website }>(`/companies/${companyId}`);
    return res;
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
  getThemes: () => request<ThemeDefinition[]>('/themes'),
  getFeatures: () => request<FeatureDefinition[]>('/features'),

  // Products
  getProducts: (companyId?: string) => request<Product[]>(`/products${companyId ? `?companyId=${companyId}` : ''}`),
  createProduct: (productData: any) => request<Product>('/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id: string, updates: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  // Product Categories
  getProductCategories: (companyId?: string) =>
    request<ProductCategory[]>(`/product-categories${companyId ? `?companyId=${companyId}` : ''}`),
  createProductCategory: (data: any) =>
    request<ProductCategory>('/product-categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteProductCategory: (id: string) => request<{ success: boolean }>(`/product-categories/${id}`, { method: 'DELETE' }),

  // Reviews
  getReviews: (companyId?: string) => request<Review[]>(`/reviews${companyId ? `?companyId=${companyId}` : ''}`),
  moderateReview: (id: string, status: string, reply?: string) =>
    request<{ success: boolean; review: Review }>(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reply }),
    }),

  // Offers & Announcements
  getOffers: (companyId?: string) => request<Offer[]>(`/offers${companyId ? `?companyId=${companyId}` : ''}`),
  createOffer: (offerData: any) => request<Offer>('/offers', { method: 'POST', body: JSON.stringify(offerData) }),
  deleteOffer: (id: string) => request<{ success: boolean }>(`/offers/${id}`, { method: 'DELETE' }),
  getAnnouncements: (companyId?: string) =>
    request<Announcement[]>(`/announcements${companyId ? `?companyId=${companyId}` : ''}`),
  createAnnouncement: (annData: any) =>
    request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(annData) }),

  // Leads
  getLeads: () => request<Lead[]>('/leads'),
  updateLeadStatus: (id: string, status: string, notes?: any, assignedAdminId?: string) =>
    request<{ success: boolean; lead: Lead }>(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, assignedAdminId }),
    }),
  convertLead: (id: string) =>
    request<{ success: boolean; company: Company; website: Website }>(`/leads/${id}/convert`, { method: 'POST' }),

  // QR
  getQrs: (companyId?: string) => request<QrConfig[]>(`/qr${companyId ? `?companyId=${companyId}` : ''}`),
  createQr: (qrData: any) => request<QrConfig>('/qr', { method: 'POST', body: JSON.stringify(qrData) }),
  updateQr: (id: string, updates: Partial<QrConfig>) =>
    request<QrConfig>(`/qr/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteQr: (id: string) => request<{ success: boolean }>(`/qr/${id}`, { method: 'DELETE' }),
  getQrImage: (id: string) => request<{ dataUrl: string; fullUrl: string }>(`/qr/${id}/image`),
  generateQr: (data: { url: string; size?: number; fgColor?: string; bgColor?: string; margin?: number }) =>
    request<{ dataUrl: string; normalizedUrl: string }>('/qr/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Users & Team
  getUsers: () => request<User[]>('/users'),
  inviteUser: (inviteData: any) => request<any>('/invitations', { method: 'POST', body: JSON.stringify(inviteData) }),
  revokeInvitation: (id: string) => request<any>(`/invitations/${id}`, { method: 'DELETE' }),

  // Owner System
  getOwnerSettings: () => request<PlatformSettings>('/owner/settings'),
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
  getAuditLogs: () => request<AuditLog[]>('/owner/audit'),
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
