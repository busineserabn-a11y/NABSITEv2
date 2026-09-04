import { User, Role } from '../types';

/**
 * NABSITE Permission Modules
 */
export type PermissionModule =
  | 'companies'
  | 'websites'
  | 'studio'
  | 'menu'
  | 'products'
  | 'reviews'
  | 'offers'
  | 'announcements'
  | 'leads'
  | 'qr'
  | 'analytics'
  | 'media'
  | 'settings'
  | 'discipline'
  | 'school_faq';

/**
 * NABSITE Granular Actions
 */
export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'export'
  | 'manage'
  | 'reorder';

/**
 * Permission Matrix: Mapping from Module to allowed Actions
 */
export type PermissionMatrix = Partial<Record<PermissionModule, PermissionAction[]>>;

/**
 * Module metadata definitions for UI and authorization
 */
export interface ModuleDefinition {
  key: PermissionModule;
  label: string;
  category: 'core' | 'content' | 'operations' | 'system';
  description: string;
  icon: string;
  supportedActions: PermissionAction[];
}

export const PERMISSION_MODULES: ModuleDefinition[] = [
  {
    key: 'companies',
    label: 'Companies & Profiles',
    category: 'core',
    description: 'Company profiles, business hours, addresses, contact information, and branding.',
    icon: 'Building2',
    supportedActions: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  },
  {
    key: 'websites',
    label: 'Websites & Domains',
    category: 'core',
    description: 'Website records, template configurations, domains, and lifecycle statuses.',
    icon: 'Globe',
    supportedActions: ['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'manage'],
  },
  {
    key: 'studio',
    label: 'Website Studio 2.1',
    category: 'content',
    description: 'Full-page visual builder, drag-and-drop elements, typography, hero, and theme design.',
    icon: 'Sparkles',
    supportedActions: ['view', 'edit', 'publish', 'unpublish', 'manage'],
  },
  {
    key: 'menu',
    label: 'Digital Menu & Dishes',
    category: 'content',
    description: 'Food categories, pricing, descriptions, dietary tags, availability, and item popups.',
    icon: 'Utensils',
    supportedActions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'products',
    label: 'Products & Store',
    category: 'content',
    description: 'Product catalogs, stock status, pricing tiers, and direct purchase triggers.',
    icon: 'ShoppingBag',
    supportedActions: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  },
  {
    key: 'reviews',
    label: 'Customer Reviews',
    category: 'operations',
    description: 'Guest feedback, ratings moderation, approvals, and owner reply management.',
    icon: 'Star',
    supportedActions: ['view', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'offers',
    label: 'Offers & Promotions',
    category: 'operations',
    description: 'Discount coupons, special deals, promo banners, and countdown announcements.',
    icon: 'Tag',
    supportedActions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'announcements',
    label: 'Announcements & News',
    category: 'operations',
    description: 'Company news flashes, event dates, operational updates, and urgent alerts.',
    icon: 'Megaphone',
    supportedActions: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  },
  {
    key: 'leads',
    label: 'Inquiries & Leads',
    category: 'operations',
    description: 'Contact form submissions, client bookings, meeting requests, and lead statuses.',
    icon: 'MessageSquare',
    supportedActions: ['view', 'edit', 'delete', 'export', 'manage'],
  },
  {
    key: 'qr',
    label: 'QR Codes & Stands',
    category: 'operations',
    description: 'Physical table stands, custom brand QR codes, high-res downloads, and scan metrics.',
    icon: 'QrCode',
    supportedActions: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  },
  {
    key: 'analytics',
    label: 'Analytics & Traffic',
    category: 'system',
    description: 'Page views, scan counts, phone call clicks, telegram leads, and device telemetry.',
    icon: 'BarChart3',
    supportedActions: ['view', 'export'],
  },
  {
    key: 'media',
    label: 'Media & Gallery',
    category: 'content',
    description: 'Photo libraries, hero videos, logo uploads, and multi-resolution image assets.',
    icon: 'Image',
    supportedActions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  {
    key: 'settings',
    label: 'Platform & Settings',
    category: 'system',
    description: 'Global system parameters, SEO settings, security policies, and integrations.',
    icon: 'Settings',
    supportedActions: ['view', 'edit', 'manage'],
  },
  {
    key: 'discipline',
    label: 'Discipline / Behavior',
    category: 'operations',
    description: 'Student behavioral incident records, actions taken, disciplinary follow-up, and resolution tracking.',
    icon: 'ShieldAlert',
    supportedActions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'school_faq',
    label: 'School FAQ',
    category: 'content',
    description: 'Frequently asked questions for school inquiries, parent information, and live website FAQ display.',
    icon: 'HelpCircle',
    supportedActions: ['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'reorder'],
  },
];

/**
 * Standard Action Labels
 */
export const ACTION_LABELS: Record<PermissionAction, { label: string; desc: string }> = {
  view: { label: 'View', desc: 'Read and view data/pages' },
  create: { label: 'Create', desc: 'Create new records or pages' },
  edit: { label: 'Edit', desc: 'Modify existing content and details' },
  delete: { label: 'Delete', desc: 'Delete or archive records' },
  publish: { label: 'Publish', desc: 'Publish live to the public internet' },
  unpublish: { label: 'Unpublish', desc: 'Take live content offline / draft' },
  export: { label: 'Export', desc: 'Download CSV, Excel, or PDF reports' },
  manage: { label: 'Manage', desc: 'Full administrator override' },
  reorder: { label: 'Reorder', desc: 'Change display order sequence' },
};

/**
 * Default permission matrix presets
 */
export const DEFAULT_ADMIN_MATRIX: PermissionMatrix = {
  companies: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  websites: ['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'manage'],
  studio: ['view', 'edit', 'publish', 'unpublish', 'manage'],
  menu: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  products: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  reviews: ['view', 'edit', 'delete', 'publish', 'manage'],
  offers: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  announcements: ['view', 'create', 'edit', 'delete', 'publish', 'manage'],
  leads: ['view', 'edit', 'delete', 'export', 'manage'],
  qr: ['view', 'create', 'edit', 'delete', 'export', 'manage'],
  analytics: ['view', 'export'],
  media: ['view', 'create', 'edit', 'delete', 'manage'],
  settings: ['view', 'edit'],
  discipline: ['view', 'create', 'edit', 'delete'],
  school_faq: ['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'reorder'],
};

export const DEFAULT_SUB_ADMIN_MATRIX: PermissionMatrix = {
  companies: ['view', 'edit'],
  websites: ['view', 'edit'],
  studio: ['view', 'edit'],
  menu: ['view', 'create', 'edit', 'delete', 'publish'],
  products: ['view', 'create', 'edit', 'delete'],
  reviews: ['view', 'edit', 'publish'],
  offers: ['view', 'create', 'edit', 'publish'],
  announcements: ['view', 'create', 'edit', 'publish'],
  leads: ['view', 'edit'],
  qr: ['view', 'create', 'edit', 'export'],
  analytics: ['view'],
  media: ['view', 'create', 'edit'],
  settings: ['view'],
  discipline: ['view', 'create', 'edit', 'delete'],
  school_faq: ['view', 'create', 'edit', 'publish', 'unpublish', 'reorder', 'delete'],
};

export const READ_ONLY_MATRIX: PermissionMatrix = {
  companies: ['view'],
  websites: ['view'],
  studio: ['view'],
  menu: ['view'],
  products: ['view'],
  reviews: ['view'],
  offers: ['view'],
  announcements: ['view'],
  leads: ['view'],
  qr: ['view'],
  analytics: ['view'],
  media: ['view'],
  settings: ['view'],
  discipline: ['view'],
  school_faq: ['view'],
};

export const CONTENT_CREATOR_MATRIX: PermissionMatrix = {
  companies: ['view'],
  websites: ['view', 'edit'],
  studio: ['view', 'edit'],
  menu: ['view', 'create', 'edit', 'delete', 'publish'],
  products: ['view', 'create', 'edit'],
  reviews: ['view', 'edit'],
  offers: ['view', 'create', 'edit', 'publish'],
  announcements: ['view', 'create', 'edit', 'publish'],
  leads: ['view'],
  qr: ['view', 'create', 'export'],
  analytics: ['view'],
  media: ['view', 'create', 'edit', 'delete'],
  settings: ['view'],
  discipline: ['view', 'create'],
  school_faq: ['view', 'create', 'edit', 'publish', 'reorder'],
};

/**
 * Normalizes legacy string permission arrays into the modern PermissionMatrix
 */
export function normalizePermissionMatrix(user: Partial<User>): PermissionMatrix {
  if (user.permissionMatrix && Object.keys(user.permissionMatrix).length > 0) {
    return user.permissionMatrix;
  }

  if (user.role === 'OWNER') {
    const full: PermissionMatrix = {};
    PERMISSION_MODULES.forEach((mod) => {
      full[mod.key] = [...mod.supportedActions];
    });
    return full;
  }

  if (user.role === 'ADMIN') {
    return { ...DEFAULT_ADMIN_MATRIX };
  }

  // Convert legacy permissions list if available
  const matrix: PermissionMatrix = {
    companies: ['view'],
    websites: ['view'],
    studio: ['view'],
    settings: ['view'],
  };

  const perms = user.permissions || [];
  if (perms.includes('edit_website') || (perms as any).includes('manage_pages')) {
    matrix.studio = ['view', 'edit'];
    matrix.websites = ['view', 'edit'];
  }
  if (perms.includes('manage_products') || perms.includes('manage_categories') || perms.includes('manage_prices')) {
    matrix.products = ['view', 'create', 'edit', 'delete'];
    matrix.menu = ['view', 'create', 'edit', 'delete', 'publish'];
  }
  if (perms.includes('moderate_reviews')) {
    matrix.reviews = ['view', 'edit', 'publish'];
  }
  if (perms.includes('manage_offers') || perms.includes('manage_announcements')) {
    matrix.offers = ['view', 'create', 'edit', 'publish'];
    matrix.announcements = ['view', 'create', 'edit', 'publish'];
  }
  if (perms.includes('manage_qr')) {
    matrix.qr = ['view', 'create', 'edit', 'export'];
  }
  if (perms.includes('view_analytics')) {
    matrix.analytics = ['view'];
  }
  if (perms.includes('edit_business_info') || perms.includes('manage_hours')) {
    matrix.companies = ['view', 'edit'];
  }

  // Map discipline permissions
  const disciplineActions: PermissionAction[] = [];
  if (perms.includes('view_discipline') || user.role === 'SUB_ADMIN') disciplineActions.push('view');
  if (perms.includes('create_discipline') || user.role === 'SUB_ADMIN') disciplineActions.push('create');
  if (perms.includes('edit_discipline') || user.role === 'SUB_ADMIN') disciplineActions.push('edit');
  if (perms.includes('delete_discipline')) disciplineActions.push('delete');
  if (disciplineActions.length > 0) {
    matrix.discipline = disciplineActions;
  }

  // Map school FAQ permissions
  const faqActions: PermissionAction[] = [];
  if (perms.includes('view_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('view');
  if (perms.includes('create_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('create');
  if (perms.includes('edit_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('edit');
  if (perms.includes('delete_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('delete');
  if (perms.includes('publish_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('publish', 'unpublish');
  if (perms.includes('reorder_school_faq') || user.role === 'SUB_ADMIN') faqActions.push('reorder');
  if (faqActions.length > 0) {
    matrix.school_faq = faqActions;
  }

  return matrix;
}

/**
 * Universal authorization check function
 * can(user, "website.edit", companyId)
 * can(user, "menu", companyId, "create")
 */
export function can(
  user: User | null | undefined,
  moduleOrPermission: PermissionModule | string,
  companyId?: string,
  action?: PermissionAction
): boolean {
  if (!user) return false;
  if (user.status === 'disabled' || user.status === 'suspended') return false;

  // Root Owner has absolute unrestricted access everywhere
  if (user.role === 'OWNER') return true;

  // Check company scope
  if (companyId) {
    if (user.role === 'ADMIN') {
      // If admin is assigned to all companies or company is in assigned list
      if (user.assignedAllCompanies !== false) {
        // Admin with unrestricted companies
      } else if (user.assignedCompanyIds && user.assignedCompanyIds.length > 0) {
        if (!user.assignedCompanyIds.includes(companyId)) {
          return false;
        }
      }
    } else if (user.role === 'SUB_ADMIN') {
      const allowedCompanies: string[] = [];
      if (user.assignedCompanyId) allowedCompanies.push(user.assignedCompanyId);
      if (user.assignedCompanyIds) allowedCompanies.push(...user.assignedCompanyIds);

      if (allowedCompanies.length > 0 && !allowedCompanies.includes(companyId)) {
        return false;
      }
    }
  }

  // Parse module and action
  let targetModule: PermissionModule;
  let targetAction: PermissionAction = action || 'view';

  if (moduleOrPermission.includes('.')) {
    const parts = moduleOrPermission.split('.');
    targetModule = parts[0] as PermissionModule;
    targetAction = (parts[1] || 'view') as PermissionAction;
  } else {
    targetModule = moduleOrPermission as PermissionModule;
  }

  const matrix = normalizePermissionMatrix(user);
  const actions = matrix[targetModule];

  if (!actions || actions.length === 0) return false;

  if (actions.includes('manage')) return true;
  return actions.includes(targetAction);
}

/**
 * Counts total active permissions in a matrix
 */
export function countPermissions(matrix: PermissionMatrix): number {
  return Object.values(matrix).reduce((sum, actions) => sum + (actions?.length || 0), 0);
}
