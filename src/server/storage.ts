import {
  Category,
  Company,
  Website,
  Product,
  ProductCategory,
  Review,
  Offer,
  Announcement,
  Lead,
  Invitation,
  QrConfig,
  AnalyticsEvent,
  ShowcaseItem,
  PlatformSettings,
  AuditLog,
  User,
  Role,
  SubAdminPermission,
  MediaAsset,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_COMPANIES,
  INITIAL_WEBSITES,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_CATEGORIES,
  INITIAL_REVIEWS,
  INITIAL_OFFERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_LEADS,
  INITIAL_INVITATIONS,
  INITIAL_QR_CONFIGS,
  INITIAL_SHOWCASE,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANALYTICS,
} from '../data/seed';
import { THEME_REGISTRY } from '../data/themes';
import { FEATURE_REGISTRY } from '../data/features';

export class Nabsitedatabase {
  public settings: PlatformSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
  public categories: Category[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
  public users: User[] = JSON.parse(JSON.stringify(INITIAL_USERS));
  public companies: Company[] = JSON.parse(JSON.stringify(INITIAL_COMPANIES));
  public websites: Website[] = JSON.parse(JSON.stringify(INITIAL_WEBSITES));
  public products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  public productCategories: ProductCategory[] = JSON.parse(JSON.stringify(INITIAL_PRODUCT_CATEGORIES));
  public reviews: Review[] = JSON.parse(JSON.stringify(INITIAL_REVIEWS));
  public offers: Offer[] = JSON.parse(JSON.stringify(INITIAL_OFFERS));
  public announcements: Announcement[] = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
  public leads: Lead[] = JSON.parse(JSON.stringify(INITIAL_LEADS));
  public invitations: Invitation[] = JSON.parse(JSON.stringify(INITIAL_INVITATIONS));
  public qrConfigs: QrConfig[] = JSON.parse(JSON.stringify(INITIAL_QR_CONFIGS));
  public showcase: ShowcaseItem[] = JSON.parse(JSON.stringify(INITIAL_SHOWCASE));
  public auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  public analytics: AnalyticsEvent[] = JSON.parse(JSON.stringify(INITIAL_ANALYTICS));
  public mediaAssets: MediaAsset[] = [];

  constructor() {
    // Populate some initial media assets
    this.mediaAssets = [
      {
        id: 'med_1',
        companyId: 'comp_addis_gourmet',
        name: 'Dining Garden Terrace',
        url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
        size: 245000,
        mimeType: 'image/jpeg',
        category: 'hero',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'med_2',
        companyId: 'comp_addis_gourmet',
        name: 'Shekla Tibs Sizzle',
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        size: 185000,
        mimeType: 'image/jpeg',
        category: 'products',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'med_3',
        companyId: 'comp_bluenile_tech',
        name: 'Data Center Array',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        size: 320000,
        mimeType: 'image/jpeg',
        category: 'hero',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ];
  }

  // --- Audit Logging Helper ---
  public log(
    actorId: string,
    actorName: string,
    actorRole: Role,
    action: string,
    resourceType: string,
    resourceId: string,
    companyId?: string,
    result: 'SUCCESS' | 'FAILED' | 'DENIED' = 'SUCCESS',
    metadata?: Record<string, any>
  ): AuditLog {
    const entry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      actorId,
      actorName,
      actorRole,
      action,
      resourceType,
      resourceId,
      companyId,
      timestamp: new Date().toISOString(),
      result,
      metadata,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return entry;
  }

  // --- Security & Permission Checkers ---
  public canAccessCompany(user: User | null, companyIdOrSlug: string): boolean {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    const clean = String(companyIdOrSlug || '').toLowerCase().trim();
    const company = this.companies.find(
      (c) =>
        c.id === companyIdOrSlug ||
        c.slug === companyIdOrSlug ||
        c.id.toLowerCase() === clean ||
        c.slug.toLowerCase() === clean ||
        c.slug.toLowerCase().replace(/[-_]/g, '') === clean.replace(/[-_]/g, '')
    );
    const resolvedId = company ? company.id : companyIdOrSlug;

    if (user.role === 'ADMIN') {
      if (!user.assignedCompanyIds || user.assignedCompanyIds.length === 0) return true;
      return (
        user.assignedCompanyIds.includes(resolvedId) ||
        user.assignedCompanyIds.includes(companyIdOrSlug)
      );
    }
    if (user.role === 'SUB_ADMIN') {
      return (
        user.assignedCompanyId === resolvedId ||
        user.assignedCompanyId === companyIdOrSlug
      );
    }
    return false;
  }

  public hasSubAdminPermission(user: User | null, permission: SubAdminPermission): boolean {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
    if (user.role === 'SUB_ADMIN') {
      return user.permissions?.includes(permission) ?? false;
    }
    return false;
  }

  // --- Filter Users (Prevent Admin/SubAdmin from viewing Owner info) ---
  public getVisibleUsers(requester: User | null): User[] {
    if (!requester) return [];
    if (requester.role === 'OWNER') {
      return this.users;
    }
    // Owner is completely invisible in Admin / Sub-Admin user lists
    return this.users.filter((u) => u.role !== 'OWNER');
  }

  // --- Ensure & Repair Website Record ---
  public ensureWebsiteForCompany(companyId: string): Website {
    let website = this.websites.find((w) => w.companyId === companyId);
    const company = this.companies.find((c) => c.id === companyId);

    if (!website) {
      const themeId = 'theme_general_business';
      const theme = THEME_REGISTRY.find((t) => t.id === themeId) || THEME_REGISTRY[0];
      website = {
        id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        companyId,
        themeId,
        status: 'draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draftConfig: this.createDefaultConfig(company?.name || 'My Business', company?.shortDescription || '', theme),
        publishedConfig: null,
      };
      this.websites.unshift(website);
    } else {
      // Auto-repair existing website if malformed
      if (!website.themeId || !THEME_REGISTRY.some((t) => t.id === website!.themeId)) {
        website.themeId = 'theme_general_business';
      }
      const theme = THEME_REGISTRY.find((t) => t.id === website!.themeId) || THEME_REGISTRY[0];
      website.draftConfig = this.repairConfig(website.draftConfig, company?.name || 'My Business', company?.shortDescription || '', theme);
    }
    return website;
  }

  public createDefaultConfig(name: string, shortDesc: string, theme: any) {
    return {
      design: {
        primaryColor: theme.defaultPalette.primary,
        secondaryColor: theme.defaultPalette.secondary,
        accentColor: theme.defaultPalette.accent,
        bgColor: theme.defaultPalette.bg,
        surfaceColor: theme.defaultPalette.surface,
        textColor: theme.defaultPalette.text,
        mutedTextColor: theme.defaultPalette.muted,
        headingFont: theme.typography.headingFont,
        bodyFont: theme.typography.bodyFont,
        headingScale: 'normal' as const,
        borderRadius: 'lg' as const,
        maxWidth: 'standard' as const,
        spacingDensity: 'comfortable' as const,
        buttonStyle: 'rounded' as const,
        cardStyle: 'bordered' as const,
      },
      header: {
        showLogo: true,
        showCompanyName: true,
        style: 'standard' as const,
        sticky: true,
        showPhoneBtn: true,
        showTelegramBtn: true,
        showCtaBtn: true,
        ctaText: 'Contact Us',
        ctaTarget: '#contact',
      },
      footer: {
        showLogo: true,
        showDescription: true,
        showContactInfo: true,
        showSocialLinks: true,
        showNavigation: true,
        showDeveloperCredit: true,
        customText: `${name} — Managed Digital Platform`,
      },
      navigation: [
        { id: 'nav_1', label: 'Home', type: 'page' as const, target: 'home', order: 1 },
        { id: 'nav_2', label: 'Store', type: 'page' as const, target: 'store', order: 2 },
        { id: 'nav_3', label: 'Reviews', type: 'page' as const, target: 'reviews', order: 3 },
        { id: 'nav_4', label: 'Contact', type: 'page' as const, target: 'contact', order: 4 },
      ],
      installedFeatures: [
        { featureId: 'feature_store', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_reviews', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_hours', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_location', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_call', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_telegram', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_faq', enabled: true, installedAt: new Date().toISOString() },
      ],
      seo: {
        siteTitle: `${name} | Official Website`,
        metaDescription: shortDesc || `Welcome to ${name}`,
        keywords: [name, 'business', 'ethiopia'],
      },
      pages: [
        {
          id: 'page_home',
          name: 'Home',
          slug: 'home',
          title: `Welcome to ${name}`,
          order: 1,
          isHome: true,
          isPublished: true,
          isHidden: false,
          sections: [
            {
              id: 'sec_hero',
              type: 'hero' as const,
              order: 1,
              isVisible: true,
              title: name,
              subtitle: shortDesc || 'Discover exceptional service, quality products, and dedicated hospitality.',
              cta: {
                text: 'Contact Us',
                url: '#contact',
                type: 'internal' as const,
                style: 'primary' as const,
              },
            },
            {
              id: 'sec_about',
              type: 'about' as const,
              order: 2,
              isVisible: true,
              title: 'About Our Business',
              subtitle: 'Committed to excellence, authenticity, and unmatched customer care.',
            },
            {
              id: 'sec_store',
              type: 'products' as const,
              order: 3,
              isVisible: true,
              title: 'Featured Catalog & Menu',
              subtitle: 'Explore our latest offerings, prices, and special selections.',
            },
            {
              id: 'sec_reviews',
              type: 'reviews' as const,
              order: 4,
              isVisible: true,
              title: 'Verified Customer Reviews',
              subtitle: 'Read genuine feedback from our valued guests and clients.',
            },
            {
              id: 'sec_hours',
              type: 'hours' as const,
              order: 5,
              isVisible: true,
              title: 'Opening Hours & Schedule',
              subtitle: 'Visit us during our standard weekly operating hours.',
            },
            {
              id: 'sec_contact',
              type: 'contact' as const,
              order: 6,
              isVisible: true,
              title: 'Get In Touch',
              subtitle: 'We are here to answer your questions and take your orders.',
            },
          ],
        },
        {
          id: 'page_store',
          name: 'Store',
          slug: 'store',
          title: 'Store Catalog & Menu',
          order: 2,
          isHome: false,
          isPublished: true,
          isHidden: false,
          sections: [
            {
              id: 'sec_store_page',
              type: 'products' as const,
              order: 1,
              isVisible: true,
              title: 'Full Product Catalog & Menu',
              subtitle: 'Browse all items, prices, and direct ordering options.',
            },
          ],
        },
        {
          id: 'page_reviews',
          name: 'Reviews',
          slug: 'reviews',
          title: 'Customer Feedback',
          order: 3,
          isHome: false,
          isPublished: true,
          isHidden: false,
          sections: [
            {
              id: 'sec_reviews_page',
              type: 'reviews' as const,
              order: 1,
              isVisible: true,
              title: 'What Our Customers Say',
              subtitle: 'Verified guest ratings and real customer experiences.',
            },
          ],
        },
        {
          id: 'page_contact',
          name: 'Contact',
          slug: 'contact',
          title: 'Contact Us',
          order: 4,
          isHome: false,
          isPublished: true,
          isHidden: false,
          sections: [
            {
              id: 'sec_contact_page',
              type: 'contact' as const,
              order: 1,
              isVisible: true,
              title: 'Contact & Location',
              subtitle: 'Direct hotline, Telegram messaging, and physical address.',
            },
          ],
        },
      ],
    };
  }

  public repairConfig(config: any, name: string, shortDesc: string, theme: any) {
    if (!config || typeof config !== 'object') {
      return this.createDefaultConfig(name, shortDesc, theme);
    }
    const def = this.createDefaultConfig(name, shortDesc, theme);
    const result = { ...def, ...config };

    result.design = { ...def.design, ...(config.design || {}) };
    result.header = { ...def.header, ...(config.header || {}) };
    result.footer = { ...def.footer, ...(config.footer || {}) };
    result.navigation = Array.isArray(config.navigation) && config.navigation.length > 0 ? config.navigation : def.navigation;
    result.installedFeatures = Array.isArray(config.installedFeatures) ? config.installedFeatures : def.installedFeatures;

    if (!Array.isArray(config.pages) || config.pages.length === 0) {
      result.pages = def.pages;
    } else {
      result.pages = config.pages;
      // Ensure at least one home page
      if (!result.pages.some((p: any) => p.isHome)) {
        if (result.pages[0]) {
          result.pages[0].isHome = true;
          result.pages[0].slug = 'home';
        } else {
          result.pages.unshift(def.pages[0]);
        }
      }
    }
    return result;
  }

  // --- Public Company Lookup (Only Active & Published) ---
  public getPublicCompanyBySlug(slug: string): { company: Company; website: Website } | null {
    if (!slug) return null;
    const clean = String(slug).toLowerCase().trim();
    const cleanNoHyphen = clean.replace(/[-_]/g, '');

    const company = this.companies.find((c) => {
      const cSlug = c.slug.toLowerCase();
      const cId = c.id.toLowerCase();
      const cSlugNoHyphen = cSlug.replace(/[-_]/g, '');
      const cNameNoSpecial = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      return (
        c.slug === slug ||
        c.id === slug ||
        cSlug === clean ||
        cId === clean ||
        cSlugNoHyphen === cleanNoHyphen ||
        cNameNoSpecial === cleanNoHyphen ||
        (clean.includes('addis-gourmet') && c.slug === 'addis-gourmet') ||
        (clean.includes('bluenile') && c.slug === 'bluenile-tech') ||
        (clean.includes('habesha') && c.slug === 'habesha-crafts') ||
        (clean.includes('apex') && c.slug === 'apex-construction') ||
        (clean.includes('lucy') && c.slug === 'lucy-wellness') ||
        (clean.includes('zenith') && c.slug === 'zenith-realty')
      );
    });

    if (!company || company.status === 'archived') {
      return null;
    }
    let website = this.websites.find((w) => w.companyId === company.id);
    if (!website) {
      website = this.ensureWebsiteForCompany(company.id);
    }
    return { company, website };
  }

  // --- Record Analytics Event ---
  public recordAnalytics(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): AnalyticsEvent {
    const newEvent: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.analytics.unshift(newEvent);
    if (this.analytics.length > 2000) {
      this.analytics.pop();
    }
    return newEvent;
  }

  // --- Publish Website with Validation ---
  public validateAndPublishWebsite(websiteId: string, actor: User): { success: boolean; errors?: string[]; website?: Website } {
    const website = this.websites.find((w) => w.id === websiteId);
    if (!website) {
      return { success: false, errors: ['Website record not found.'] };
    }

    const company = this.companies.find((c) => c.id === website.companyId);
    if (!company) {
      return { success: false, errors: ['Associated company not found.'] };
    }

    if (!this.canAccessCompany(actor, company.id)) {
      this.log(actor.id, actor.name, actor.role, 'PUBLISH_WEBSITE', 'WEBSITE', websiteId, company.id, 'DENIED');
      return { success: false, errors: ['Unauthorized to publish website for this company.'] };
    }

    if (actor.role === 'SUB_ADMIN' && !this.hasSubAdminPermission(actor, 'edit_website')) {
      return { success: false, errors: ['Sub-Admin lacks permission to publish website.'] };
    }

    const errors: string[] = [];

    // Validation checklist
    if (!company.name || company.name.trim().length === 0) {
      errors.push('Company name is required.');
    }
    if (!company.logo || company.logo.trim().length === 0) {
      errors.push('Company logo is required before publishing.');
    }
    if (!company.category || company.category.trim().length === 0) {
      errors.push('Business category is required.');
    }
    if (!company.phone && !company.email && !company.telegramUsername) {
      errors.push('At least one contact method (Phone, Email, or Telegram) is required.');
    }

    const homePage = website.draftConfig.pages.find((p) => p.isHome);
    if (!homePage) {
      errors.push('Website must contain an active Home page.');
    }

    if (!website.draftConfig.design.primaryColor) {
      errors.push('Primary theme color is required.');
    }

    if (errors.length > 0) {
      this.log(actor.id, actor.name, actor.role, 'PUBLISH_WEBSITE_VALIDATION_FAILED', 'WEBSITE', websiteId, company.id, 'FAILED', { errors });
      return { success: false, errors };
    }

    // Clone draft snapshot to publishedConfig
    website.publishedConfig = JSON.parse(JSON.stringify(website.draftConfig));
    website.status = 'published';
    website.version += 1;
    website.publishedAt = new Date().toISOString();
    website.updatedAt = new Date().toISOString();
    website.lastPublishedBy = actor.name;

    company.websiteStatus = 'published';
    if (company.status === 'draft') {
      company.status = 'active';
    }
    company.updatedAt = new Date().toISOString();
    company.publishedAt = new Date().toISOString();

    this.log(actor.id, actor.name, actor.role, 'PUBLISH_WEBSITE', 'WEBSITE', websiteId, company.id, 'SUCCESS', {
      version: website.version,
      pagesCount: website.draftConfig.pages.length,
      themeId: website.themeId,
    });

    return { success: true, website };
  }
}

export const db = new Nabsitedatabase();
