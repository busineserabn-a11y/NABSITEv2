import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import { db } from './src/server/storage';
import { User, Role, Company, Website } from './src/types';
import { THEME_REGISTRY } from './src/data/themes';
import { FEATURE_REGISTRY } from './src/data/features';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Authentication Middleware ---
// Extracts Bearer token or User ID from Authorization header
function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  // In our local full-stack environment, we accept user_id or tokens
  const user = db.users.find((u) => u.id === token || u.email.toLowerCase() === token.toLowerCase());
  return user || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as any).user = user;
  next();
}

function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    (req as any).user = user;
    next();
  };
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Standard Login (Owner / Admin / Sub-Admin)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const inputEmail = email.toLowerCase().trim();
  const isOwnerEmail =
    inputEmail === 'abenezarofficial1@gmail.com' ||
    inputEmail === 'owner@nabsite.io' ||
    inputEmail === 'owner@nabsite.et' ||
    inputEmail === 'owner';

  // If attempting owner login with standard login or mastermind
  if (isOwnerEmail) {
    if (password && password !== 'NaB-is-ABN' && password !== 'nabsite_root') {
      return res.status(401).json({ error: 'Invalid password for Mastermind account. Required: NaB-is-ABN' });
    }
  }

  let user = db.users.find((u) => {
    const userEmail = u.email.toLowerCase();
    return (
      userEmail === inputEmail ||
      (isOwnerEmail && u.role === 'OWNER') ||
      (inputEmail === 'admin@nabsite.et' && u.role === 'ADMIN') ||
      (inputEmail === 'admin@nabsite.io' && u.role === 'ADMIN') ||
      (inputEmail === 'admin' && u.role === 'ADMIN') ||
      (inputEmail === 'dawit@addisgourmet.et' && userEmail === 'manager@addisgourmet.com') ||
      (inputEmail === 'manager@addisgourmet.com' && userEmail === 'manager@addisgourmet.com') ||
      (inputEmail === 'manager' && userEmail === 'manager@addisgourmet.com')
    );
  });

  if (!user && isOwnerEmail) {
    user = {
      id: 'user_owner',
      email: 'abenezarofficial1@gmail.com',
      name: 'Abenezar (Mastermind)',
      role: 'OWNER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.users.push(user);
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your email.' });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({ error: 'Account has been disabled by platform administration' });
  }

  user.lastLoginAt = new Date().toISOString();
  db.log(user.id, user.name, user.role, 'LOGIN', 'USER', user.id, user.assignedCompanyId, 'SUCCESS');

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      assignedCompanyId: user.assignedCompanyId,
      assignedCompanyIds: user.assignedCompanyIds,
      permissions: user.permissions,
    },
    token: user.id,
  });
});

// Hidden Owner Gateway Login (/mastermindlogin)
app.post('/api/auth/owner-login', (req, res) => {
  const { key, email } = req.body;
  const inputKey = key ? key.trim() : '';
  const inputEmail = email ? email.toLowerCase().trim() : '';

  // Validate credentials if provided
  if (inputKey && inputKey !== 'NaB-is-ABN' && inputKey !== 'nabsite_root' && inputKey !== 'password') {
    return res.status(401).json({ error: 'Invalid Mastermind clearance key. Required: NaB-is-ABN' });
  }

  // Look for owner account
  let owner = db.users.find((u) => u.role === 'OWNER' || u.email === 'abenezarofficial1@gmail.com');
  if (!owner) {
    // If not found, provision default owner
    owner = {
      id: 'user_owner',
      email: 'abenezarofficial1@gmail.com',
      name: 'Abenezar (Mastermind)',
      role: 'OWNER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.users.push(owner);
  } else {
    owner.email = 'abenezarofficial1@gmail.com';
    owner.name = 'Abenezar (Mastermind)';
  }

  owner.lastLoginAt = new Date().toISOString();
  db.log(owner.id, owner.name, 'OWNER', 'OWNER_COMMAND_ACCESS', 'PLATFORM', 'mastermind_gateway', undefined, 'SUCCESS');

  return res.json({
    user: {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
      avatar: owner.avatar,
    },
    token: owner.id,
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

// ==========================================
// 2. PUBLIC PLATFORM ENDPOINTS
// ==========================================

app.get('/api/public/settings', (req, res) => {
  return res.json({
    platformName: db.settings.platformName,
    platformDescription: db.settings.platformDescription,
    platformLogo: db.settings.platformLogo,
    developerName: db.settings.developerName,
    developerUrl: db.settings.developerUrl,
    showDeveloperCredit: db.settings.showDeveloperCredit,
    footerText: db.settings.footerText,
    contactEmail: db.settings.contactEmail,
    contactPhone: db.settings.contactPhone,
    searchSettings: db.settings.searchSettings,
    maintenanceMode: db.settings.maintenanceMode,
  });
});

app.get('/api/public/categories', (req, res) => {
  const active = db.categories.filter((c) => c.active).sort((a, b) => a.order - b.order);
  return res.json(active);
});

app.get('/api/public/showcase', (req, res) => {
  const visible = db.showcase.filter((s) => s.isVisible).sort((a, b) => a.order - b.order);
  return res.json(visible);
});

app.get('/api/public/discover', (req, res) => {
  const { query, category } = req.query;
  let matches = db.companies.filter((c) => c.status === 'active' && c.websiteStatus === 'published');

  if (category && category !== 'all') {
    matches = matches.filter((c) => c.category.toLowerCase().includes(String(category).toLowerCase()));
  }

  if (query) {
    const q = String(query).toLowerCase();
    matches = matches.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }

  return res.json(matches);
});

// Public Company & Published Website by Slug
app.get('/api/public/company/:slug', (req, res) => {
  const { slug } = req.params;
  const match = db.getPublicCompanyBySlug(slug);
  if (!match) {
    return res.status(404).json({ error: 'Company not found or not published' });
  }

  const { company, website } = match;

  // Suspended check
  if (company.status === 'suspended') {
    return res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: 'suspended',
        logo: company.logo,
      },
      suspended: true,
    });
  }

  // For public website, return published configuration or fallback to draftConfig
  const publishedProducts = db.products.filter((p) => p.companyId === company.id && p.visibility !== false);
  const publishedReviews = db.reviews.filter((r) => r.companyId === company.id && r.status === 'approved');
  const publishedOffers = db.offers.filter((o) => o.companyId === company.id && o.status === 'active');
  const publishedAnnouncements = db.announcements.filter((a) => a.companyId === company.id && a.status === 'published');
  const publishedCategories = db.productCategories.filter((c) => c.companyId === company.id && c.visibility !== false);

  const activeConfig = website.publishedConfig || website.draftConfig;

  return res.json({
    company,
    website: {
      id: website.id,
      companyId: website.companyId,
      themeId: website.themeId,
      status: website.status,
      version: website.version,
      publishedConfig: activeConfig,
      draftConfig: website.draftConfig,
      publishedAt: website.publishedAt,
    },
    products: publishedProducts,
    productCategories: publishedCategories,
    reviews: publishedReviews,
    offers: publishedOffers,
    announcements: publishedAnnouncements,
  });
});

// Submit Public Lead
app.post('/api/public/leads', (req, res) => {
  const { fullName, companyName, phone, email, telegramUsername, category, message } = req.body;
  if (!fullName || !companyName || !phone || !category) {
    return res.status(400).json({ error: 'Missing required lead fields' });
  }

  const newLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    fullName,
    companyName,
    phone,
    email,
    telegramUsername,
    category,
    message,
    status: 'new' as const,
    notes: ['Submitted via public Get Your NABSITE form'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.leads.unshift(newLead);
  db.recordAnalytics({
    eventType: 'LEAD_SUBMIT',
    deviceType: 'desktop',
    path: '/',
    metadata: { companyName, category },
  });

  return res.status(201).json({ success: true, lead: newLead });
});

// Submit Public Review
app.post('/api/public/reviews', (req, res) => {
  const { companyId, name, rating, text } = req.body;
  if (!companyId || !name || !rating || !text) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const company = db.companies.find((c) => c.id === companyId);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const newReview = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId,
    name,
    rating: Number(rating),
    text,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  db.reviews.unshift(newReview);
  db.recordAnalytics({
    companyId,
    eventType: 'REVIEW_SUBMIT',
    deviceType: 'mobile',
    path: `/c/${company.slug}`,
  });

  return res.status(201).json({ success: true, message: 'Review submitted for moderation' });
});

// Record Public Analytics Event
app.post('/api/public/analytics/event', (req, res) => {
  const { companyId, websiteId, pageId, eventType, deviceType, path: eventPath, metadata } = req.body;
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
  }

  const recorded = db.recordAnalytics({
    companyId,
    websiteId,
    pageId,
    eventType,
    deviceType: deviceType || 'desktop',
    path: eventPath || '/',
    metadata,
  });

  // If QR scan event, increment counter on QR config
  if (eventType === 'QR_VISIT' && companyId) {
    const qr = db.qrConfigs.find((q) => q.companyId === companyId);
    if (qr) {
      qr.scanCount += 1;
    }
  }

  return res.status(201).json({ success: true, id: recorded.id });
});

// ==========================================
// 3. COMPANIES MANAGEMENT
// ==========================================

app.get('/api/companies', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  if (user.role === 'OWNER') {
    return res.json(db.companies);
  }
  if (user.role === 'ADMIN') {
    if (!user.assignedCompanyIds || user.assignedCompanyIds.length === 0) {
      return res.json(db.companies);
    }
    return res.json(db.companies.filter((c) => user.assignedCompanyIds?.includes(c.id)));
  }
  if (user.role === 'SUB_ADMIN') {
    return res.json(db.companies.filter((c) => c.id === user.assignedCompanyId));
  }
  return res.status(403).json({ error: 'Access denied' });
});

// Helper to robustly find company by ID, slug, or website ID
function findCompanyByIdOrSlug(id: string | undefined): Company | undefined {
  if (!id) return undefined;
  const clean = String(id).toLowerCase().trim();
  const cleanNoHyphen = clean.replace(/[-_]/g, '');

  let company = db.companies.find((c) => {
    const cSlug = c.slug.toLowerCase();
    const cId = c.id.toLowerCase();
    const cSlugNoHyphen = cSlug.replace(/[-_]/g, '');
    const cNameNoSpecial = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    return (
      c.id === id ||
      c.slug === id ||
      cId === clean ||
      cSlug === clean ||
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

  if (!company) {
    const w = db.websites.find((web) => web.id === id || web.companyId === id);
    if (w) {
      company = db.companies.find((c) => c.id === w.companyId);
    }
  }

  return company;
}

app.get('/api/companies/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const company = findCompanyByIdOrSlug(id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  if (!db.canAccessCompany(user, company.id)) {
    return res.status(403).json({ error: 'Access denied to this company' });
  }

  const website = db.ensureWebsiteForCompany(company.id);
  return res.json({ company, website });
});

app.delete('/api/companies/:id', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const companyIndex = db.companies.findIndex((c) => c.id === id);
  if (companyIndex === -1) return res.status(404).json({ error: 'Company not found' });

  const company = db.companies[companyIndex];
  // Hard delete or archive
  db.companies.splice(companyIndex, 1);
  db.websites = db.websites.filter((w) => w.companyId !== id);
  db.products = db.products.filter((p) => p.companyId !== id);
  db.qrConfigs = db.qrConfigs.filter((q) => q.companyId !== id);

  db.log(user.id, user.name, user.role, 'DELETE_COMPANY', 'COMPANY', id, id, 'SUCCESS', { name: company.name });
  return res.json({ success: true, message: `Company ${company.name} deleted successfully` });
});

app.post('/api/companies', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const data = req.body;

  if (!data.name || !data.category) {
    return res.status(400).json({ error: 'Company name and category are required' });
  }

  // Generate unique slug
  let baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!baseSlug) baseSlug = 'company';
  let slug = baseSlug;
  let counter = 1;
  while (db.companies.some((c) => c.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newCompany = {
    id: companyId,
    name: data.name,
    slug,
    logo: data.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    coverImage: data.coverImage,
    category: data.category,
    subcategory: data.subcategory || '',
    shortDescription: data.shortDescription || 'Welcome to our verified digital NABSITE.',
    fullDescription: data.fullDescription || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || 'Addis Ababa, Ethiopia',
    mapLink: data.mapLink || '',
    hours: data.hours || [
      { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00' },
      { day: 'Sunday', isOpen: false, openTime: '00:00', closeTime: '00:00' },
    ],
    telegramUsername: data.telegramUsername || '',
    telegramPhone: data.telegramPhone || '',
    socialLinks: data.socialLinks || {},
    status: data.status || 'active',
    websiteStatus: 'draft' as const,
    assignedAdminId: user.role === 'ADMIN' ? user.id : data.assignedAdminId || 'user_admin_1',
    subAdminIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.companies.unshift(newCompany);

  // Automatically initialize default draft website
  const themeId = data.themeId || 'theme_general_business';
  const theme = THEME_REGISTRY.find((t) => t.id === themeId) || THEME_REGISTRY[0];

  const newWebsite = {
    id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId,
    themeId,
    status: 'draft' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    draftConfig: {
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
        ctaText: 'Get in Touch',
        ctaTarget: '#contact',
      },
      footer: {
        showLogo: true,
        showDescription: true,
        showContactInfo: true,
        showSocialLinks: true,
        showNavigation: true,
        showDeveloperCredit: true,
        customText: `${newCompany.name} - Managed Digital Platform`,
      },
      navigation: [
        { id: 'nav_1', label: 'Home', type: 'page' as const, target: 'home', order: 1 },
        { id: 'nav_2', label: 'Contact', type: 'page' as const, target: 'contact', order: 2 },
      ],
      installedFeatures: [
        { featureId: 'feature_contact', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_business_hours', enabled: true, installedAt: new Date().toISOString() },
        { featureId: 'feature_social_links', enabled: true, installedAt: new Date().toISOString() },
      ],
      seo: {
        siteTitle: `${newCompany.name} | Verified Digital NABSITE`,
        metaDescription: newCompany.shortDescription,
        keywords: [newCompany.name, newCompany.category],
      },
      pages: [
        {
          id: 'page_home',
          name: 'Home',
          slug: 'home',
          title: `Welcome to ${newCompany.name}`,
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
              title: newCompany.name,
              subtitle: newCompany.shortDescription,
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
              title: 'About Us',
              subtitle: 'Our commitment to quality, trust, and service excellence.',
              content: {
                body: newCompany.fullDescription || newCompany.shortDescription,
              },
            },
            {
              id: 'sec_contact',
              type: 'contact' as const,
              order: 3,
              isVisible: true,
              title: 'Get in Touch',
              subtitle: 'We look forward to serving you.',
            },
          ],
        },
        {
          id: 'page_contact',
          name: 'Contact',
          slug: 'contact',
          title: 'Contact Information',
          order: 2,
          isHome: false,
          isPublished: true,
          isHidden: false,
          sections: [
            {
              id: 'sec_page_contact',
              type: 'contact' as const,
              order: 1,
              isVisible: true,
              title: 'Contact Us Directly',
            },
          ],
        },
      ],
    },
    publishedConfig: null,
  };

  db.websites.unshift(newWebsite);

  // Initialize QR config
  const newQr = {
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId,
    name: 'Primary Digital Stand QR',
    targetUrl: `/c/${newCompany.slug}`,
    targetType: 'website' as const,
    frame: 'badge' as const,
    caption: `SCAN TO VISIT ${newCompany.name.toUpperCase()}`,
    style: 'squares' as const,
    fgColor: theme.defaultPalette.primary,
    bgColor: '#FFFFFF',
    size: 320,
    scanCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.qrConfigs.unshift(newQr);

  db.log(user.id, user.name, user.role, 'CREATE_COMPANY', 'COMPANY', companyId, companyId, 'SUCCESS', {
    name: newCompany.name,
    category: newCompany.category,
    slug: newCompany.slug,
  });

  return res.status(201).json({ company: newCompany, website: newWebsite, qr: newQr });
});

app.put('/api/companies/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const updates = req.body;

  if (!db.canAccessCompany(user, id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (user.role === 'SUB_ADMIN' && !db.hasSubAdminPermission(user, 'edit_business_info')) {
    return res.status(403).json({ error: 'Sub-Admin lacks permission to edit business info' });
  }

  const company = db.companies.find((c) => c.id === id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  // Update allowed fields
  if (updates.name) company.name = updates.name;
  if (updates.logo) company.logo = updates.logo;
  if (updates.coverImage !== undefined) company.coverImage = updates.coverImage;
  if (updates.category) company.category = updates.category;
  if (updates.subcategory !== undefined) company.subcategory = updates.subcategory;
  if (updates.shortDescription) company.shortDescription = updates.shortDescription;
  if (updates.fullDescription !== undefined) company.fullDescription = updates.fullDescription;
  if (updates.phone !== undefined) company.phone = updates.phone;
  if (updates.email !== undefined) company.email = updates.email;
  if (updates.address !== undefined) company.address = updates.address;
  if (updates.mapLink !== undefined) company.mapLink = updates.mapLink;
  if (updates.hours) company.hours = updates.hours;
  if (updates.telegramUsername !== undefined) company.telegramUsername = updates.telegramUsername;
  if (updates.telegramPhone !== undefined) company.telegramPhone = updates.telegramPhone;
  if (updates.socialLinks) company.socialLinks = updates.socialLinks;
  if (user.role === 'OWNER' || user.role === 'ADMIN') {
    if (updates.assignedAdminId) company.assignedAdminId = updates.assignedAdminId;
    if (updates.status) company.status = updates.status;
  }

  company.updatedAt = new Date().toISOString();

  db.log(user.id, user.name, user.role, 'UPDATE_COMPANY', 'COMPANY', id, id, 'SUCCESS', { updates });
  return res.json({ company });
});

// Company Lifecycle Transitions (Draft -> Active -> Suspended -> Archived -> Restored)
app.put('/api/companies/:id/status', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'active', 'suspended', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const company = db.companies.find((c) => c.id === id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const prevStatus = company.status;
  company.status = status;
  company.updatedAt = new Date().toISOString();
  if (status === 'archived') {
    company.archivedAt = new Date().toISOString();
  }

  db.log(user.id, user.name, user.role, 'CHANGE_COMPANY_STATUS', 'COMPANY', id, id, 'SUCCESS', {
    previous: prevStatus,
    new: status,
  });

  return res.json({ success: true, company });
});

// ==========================================
// 4. WEBSITES & STUDIO ENDPOINTS
// ==========================================

app.get('/api/websites', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  if (user.role === 'OWNER') {
    return res.json(db.websites);
  }
  if (user.role === 'ADMIN') {
    return res.json(db.websites.filter((w) => db.canAccessCompany(user, w.companyId)));
  }
  if (user.role === 'SUB_ADMIN') {
    return res.json(db.websites.filter((w) => w.companyId === user.assignedCompanyId));
  }
  return res.status(403).json({ error: 'Access denied' });
});

app.get('/api/websites/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  let website = db.websites.find((w) => w.id === id || w.companyId === id);
  let company = website ? db.companies.find((c) => c.id === website.companyId) : db.companies.find((c) => c.id === id || c.slug === id);

  if (!website && company) {
    website = db.ensureWebsiteForCompany(company.id);
  }

  if (!website || !company) return res.status(404).json({ error: 'Website or company not found' });

  if (!db.canAccessCompany(user, website.companyId)) {
    return res.status(403).json({ error: 'Access denied to this website' });
  }

  return res.json({ website, company });
});

// Save Draft Configuration (Does NOT publish!)
app.put('/api/websites/:id/draft', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const { draftConfig, themeId } = req.body;

  let website = db.websites.find((w) => w.id === id || w.companyId === id);
  if (!website) {
    const comp = db.companies.find((c) => c.id === id || c.slug === id);
    if (comp) {
      website = db.ensureWebsiteForCompany(comp.id);
    }
  }

  if (!website) return res.status(404).json({ error: 'Website not found' });

  if (!db.canAccessCompany(user, website.companyId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (user.role === 'SUB_ADMIN' && !db.hasSubAdminPermission(user, 'edit_website')) {
    return res.status(403).json({ error: 'Sub-Admin lacks edit_website permission' });
  }

  if (draftConfig) {
    const comp = db.companies.find((c) => c.id === website!.companyId);
    const theme = THEME_REGISTRY.find((t) => t.id === (themeId || website!.themeId)) || THEME_REGISTRY[0];
    website.draftConfig = db.repairConfig(draftConfig, comp?.name || 'My Business', comp?.shortDescription || '', theme);
  }
  if (themeId) {
    website.themeId = themeId;
  }
  website.updatedAt = new Date().toISOString();

  db.log(user.id, user.name, user.role, 'SAVE_WEBSITE_DRAFT', 'WEBSITE', website.id, website.companyId, 'SUCCESS');
  return res.json({ success: true, website });
});

// Publish Website
app.post('/api/websites/:id/publish', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  let website = db.websites.find((w) => w.id === id || w.companyId === id);
  if (!website) {
    const comp = db.companies.find((c) => c.id === id || c.slug === id);
    if (comp) {
      website = db.ensureWebsiteForCompany(comp.id);
    }
  }

  if (!website) return res.status(404).json({ error: 'Website not found' });

  const result = db.validateAndPublishWebsite(website.id, user);
  if (!result.success) {
    return res.status(400).json({ error: 'Publication validation failed', errors: result.errors });
  }

  return res.json({ success: true, website: result.website });
});

// Unpublish Website
app.post('/api/websites/:id/unpublish', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const website = db.websites.find((w) => w.id === id || w.companyId === id);
  if (!website) return res.status(404).json({ error: 'Website not found' });

  website.status = 'unpublished';
  website.updatedAt = new Date().toISOString();

  const company = db.companies.find((c) => c.id === website.companyId);
  if (company) {
    company.websiteStatus = 'unpublished';
  }

  db.log(user.id, user.name, user.role, 'UNPUBLISH_WEBSITE', 'WEBSITE', website.id, website.companyId, 'SUCCESS');
  return res.json({ success: true, website });
});

// ==========================================
// 5. THEMES & FEATURES REGISTRIES
// ==========================================

app.get('/api/themes', (req, res) => {
  return res.json(THEME_REGISTRY);
});

app.get('/api/features', (req, res) => {
  return res.json(FEATURE_REGISTRY);
});

// ==========================================
// 6. STORE / PRODUCTS & CATEGORIES
// ==========================================

app.get('/api/products', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { companyId } = req.query;

  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    if (!db.canAccessCompany(user, resolvedId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.json(db.products.filter((p) => p.companyId === resolvedId));
  }

  if (user.role === 'OWNER') return res.json(db.products);
  if (user.role === 'ADMIN') {
    return res.json(db.products.filter((p) => db.canAccessCompany(user, p.companyId)));
  }
  return res.json(db.products.filter((p) => p.companyId === user.assignedCompanyId));
});

app.post('/api/products', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const data = req.body;

  if (!data.companyId || !data.name || data.price === undefined) {
    return res.status(400).json({ error: 'Company ID, product name, and price are required' });
  }

  const comp = findCompanyByIdOrSlug(data.companyId);
  const targetCompanyId = comp ? comp.id : data.companyId;

  if (!db.canAccessCompany(user, targetCompanyId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (user.role === 'SUB_ADMIN' && !db.hasSubAdminPermission(user, 'manage_products')) {
    return res.status(403).json({ error: 'Sub-Admin lacks manage_products permission' });
  }

  const newProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId: targetCompanyId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || '',
    price: Number(data.price),
    currency: data.currency || 'ETB',
    image: data.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    sku: data.sku || '',
    status: data.status || 'active',
    visibility: data.visibility !== false,
    featured: !!data.featured,
    sortOrder: data.sortOrder || 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  db.log(user.id, user.name, user.role, 'CREATE_PRODUCT', 'PRODUCT', newProduct.id, targetCompanyId, 'SUCCESS', {
    name: newProduct.name,
    price: newProduct.price,
  });

  return res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const updates = req.body;

  const product = db.products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!db.canAccessCompany(user, product.companyId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (user.role === 'SUB_ADMIN' && !db.hasSubAdminPermission(user, 'manage_products')) {
    return res.status(403).json({ error: 'Sub-Admin lacks permission' });
  }

  Object.assign(product, updates, { updatedAt: new Date().toISOString() });
  db.log(user.id, user.name, user.role, 'UPDATE_PRODUCT', 'PRODUCT', id, product.companyId, 'SUCCESS');
  return res.json(product);
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  const product = db.products[index];
  if (!db.canAccessCompany(user, product.companyId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.products.splice(index, 1);
  db.log(user.id, user.name, user.role, 'DELETE_PRODUCT', 'PRODUCT', id, product.companyId, 'SUCCESS');
  return res.json({ success: true });
});

// Product Categories
app.get('/api/product-categories', requireAuth, (req, res) => {
  const { companyId } = req.query;
  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    return res.json(db.productCategories.filter((c) => c.companyId === resolvedId));
  }
  return res.json(db.productCategories);
});

app.post('/api/product-categories', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { companyId, name, description } = req.body;

  if (!companyId || !name) return res.status(400).json({ error: 'Missing category fields' });
  const comp = findCompanyByIdOrSlug(companyId);
  const targetCompanyId = comp ? comp.id : companyId;
  if (!db.canAccessCompany(user, targetCompanyId)) return res.status(403).json({ error: 'Access denied' });

  const newCat = {
    id: `pcat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId: targetCompanyId,
    name,
    description: description || '',
    sortOrder: db.productCategories.length + 1,
    visibility: true,
  };

  db.productCategories.push(newCat);
  return res.status(201).json(newCat);
});

// ==========================================
// 7. REVIEWS MODERATION
// ==========================================

app.get('/api/reviews', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { companyId } = req.query;

  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    if (!db.canAccessCompany(user, resolvedId)) return res.status(403).json({ error: 'Access denied' });
    return res.json(db.reviews.filter((r) => r.companyId === resolvedId));
  }

  if (user.role === 'OWNER') return res.json(db.reviews);
  if (user.role === 'ADMIN') {
    return res.json(db.reviews.filter((r) => db.canAccessCompany(user, r.companyId)));
  }
  return res.json(db.reviews.filter((r) => r.companyId === user.assignedCompanyId));
});

app.put('/api/reviews/:id/status', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const { status, reply } = req.body;

  const review = db.reviews.find((r) => r.id === id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  if (!db.canAccessCompany(user, review.companyId)) return res.status(403).json({ error: 'Access denied' });
  if (user.role === 'SUB_ADMIN' && !db.hasSubAdminPermission(user, 'moderate_reviews')) {
    return res.status(403).json({ error: 'Lacks review moderation permission' });
  }

  review.status = status;
  review.moderatedAt = new Date().toISOString();
  review.moderatedBy = user.name;
  if (reply !== undefined) review.reply = reply;

  db.log(user.id, user.name, user.role, 'MODERATE_REVIEW', 'REVIEW', id, review.companyId, 'SUCCESS', { status });
  return res.json({ success: true, review });
});

// ==========================================
// 8. OFFERS & ANNOUNCEMENTS
// ==========================================

app.get('/api/offers', requireAuth, (req, res) => {
  const { companyId } = req.query;
  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    return res.json(db.offers.filter((o) => o.companyId === resolvedId));
  }
  return res.json(db.offers);
});

app.post('/api/offers', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const data = req.body;
  if (!data.companyId || !data.title) return res.status(400).json({ error: 'Title and companyId are required' });
  const comp = findCompanyByIdOrSlug(data.companyId);
  const targetCompanyId = comp ? comp.id : data.companyId;
  if (!db.canAccessCompany(user, targetCompanyId)) return res.status(403).json({ error: 'Access denied' });

  const newOffer = {
    id: `off_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId: targetCompanyId,
    title: data.title,
    description: data.description || '',
    image: data.image,
    originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
    offerPrice: data.offerPrice ? Number(data.offerPrice) : undefined,
    discountText: data.discountText,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status || 'active',
    ctaText: data.ctaText || 'Claim Deal',
    ctaUrl: data.ctaUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.offers.unshift(newOffer);
  db.log(user.id, user.name, user.role, 'CREATE_OFFER', 'OFFER', newOffer.id, targetCompanyId, 'SUCCESS');
  return res.status(201).json(newOffer);
});

app.get('/api/announcements', requireAuth, (req, res) => {
  const { companyId } = req.query;
  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    return res.json(db.announcements.filter((a) => a.companyId === resolvedId));
  }
  return res.json(db.announcements);
});

app.post('/api/announcements', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const data = req.body;
  if (!data.companyId || !data.title) return res.status(400).json({ error: 'Title and companyId are required' });
  const comp = findCompanyByIdOrSlug(data.companyId);
  const targetCompanyId = comp ? comp.id : data.companyId;
  if (!db.canAccessCompany(user, targetCompanyId)) return res.status(403).json({ error: 'Access denied' });

  const newAnn = {
    id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId: targetCompanyId,
    title: data.title,
    content: data.content || '',
    image: data.image,
    status: data.status || 'published',
    publishDate: data.publishDate || new Date().toISOString().split('T')[0],
    ctaText: data.ctaText,
    ctaUrl: data.ctaUrl,
    featured: !!data.featured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.announcements.unshift(newAnn);
  db.log(user.id, user.name, user.role, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', newAnn.id, targetCompanyId, 'SUCCESS');
  return res.status(201).json(newAnn);
});

// ==========================================
// 9. LEADS PIPELINE
// ==========================================

app.get('/api/leads', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  if (user.role === 'OWNER') {
    return res.json(db.leads);
  }
  // Admin sees leads assigned to them or unassigned
  return res.json(db.leads.filter((l) => !l.assignedAdminId || l.assignedAdminId === user.id));
});

app.put('/api/leads/:id/status', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const { status, notes, assignedAdminId } = req.body;

  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (status) lead.status = status;
  if (assignedAdminId) lead.assignedAdminId = assignedAdminId;
  if (notes) {
    if (Array.isArray(notes)) lead.notes = notes;
    else if (typeof notes === 'string') {
      lead.notes = lead.notes || [];
      lead.notes.push(notes);
    }
  }
  lead.updatedAt = new Date().toISOString();

  db.log(user.id, user.name, user.role, 'UPDATE_LEAD_STATUS', 'LEAD', id, undefined, 'SUCCESS', { status });
  return res.json({ success: true, lead });
});

// Convert Lead to Company
app.post('/api/leads/:id/convert', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  // Create new company from lead
  const baseSlug = lead.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = baseSlug;
  let counter = 1;
  while (db.companies.some((c) => c.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newCompany = {
    id: companyId,
    name: lead.companyName,
    slug,
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    category: lead.category || 'General Business',
    shortDescription: `Welcome to ${lead.companyName}.`,
    phone: lead.phone,
    email: lead.email || '',
    address: 'Addis Ababa, Ethiopia',
    hours: [
      { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00' },
      { day: 'Sunday', isOpen: false, openTime: '00:00', closeTime: '00:00' },
    ],
    telegramUsername: lead.telegramUsername,
    telegramPhone: lead.telegramPhone,
    socialLinks: {},
    status: 'draft' as const,
    websiteStatus: 'draft' as const,
    assignedAdminId: user.role === 'ADMIN' ? user.id : 'user_admin_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.companies.unshift(newCompany);

  // Initialize draft website
  const theme = THEME_REGISTRY[0];
  const newWebsite = {
    id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId,
    themeId: 'theme_general_business',
    status: 'draft' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    draftConfig: {
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
        customText: `${newCompany.name} - Managed Digital Platform`,
      },
      navigation: [{ id: 'nav_1', label: 'Home', type: 'page' as const, target: 'home', order: 1 }],
      installedFeatures: [{ featureId: 'feature_contact', enabled: true, installedAt: new Date().toISOString() }],
      seo: {
        siteTitle: `${newCompany.name} | Verified Digital NABSITE`,
        metaDescription: newCompany.shortDescription,
        keywords: [newCompany.name, newCompany.category],
      },
      pages: [
        {
          id: 'page_home',
          name: 'Home',
          slug: 'home',
          title: `Welcome to ${newCompany.name}`,
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
              title: newCompany.name,
              subtitle: newCompany.shortDescription,
            },
          ],
        },
      ],
    },
    publishedConfig: null,
  };
  db.websites.unshift(newWebsite);

  lead.status = 'company_created';
  lead.convertedCompanyId = companyId;
  lead.updatedAt = new Date().toISOString();

  db.log(user.id, user.name, user.role, 'CONVERT_LEAD_TO_COMPANY', 'LEAD', id, companyId, 'SUCCESS', {
    companyId,
    slug: newCompany.slug,
  });

  return res.json({ success: true, company: newCompany, website: newWebsite });
});

// ==========================================
// 10. QR CODE ENGINE
// ==========================================

app.get('/api/qr', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { companyId } = req.query;

  if (companyId) {
    const comp = findCompanyByIdOrSlug(String(companyId));
    const resolvedId = comp ? comp.id : String(companyId);
    if (!db.canAccessCompany(user, resolvedId)) return res.status(403).json({ error: 'Access denied' });
    return res.json(db.qrConfigs.filter((q) => q.companyId === resolvedId));
  }

  if (user.role === 'OWNER') return res.json(db.qrConfigs);
  if (user.role === 'ADMIN') {
    return res.json(db.qrConfigs.filter((q) => db.canAccessCompany(user, q.companyId)));
  }
  return res.json(db.qrConfigs.filter((q) => q.companyId === user.assignedCompanyId));
});

app.post('/api/qr', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const data = req.body;

  if (!data.companyId || !data.name || !data.targetUrl) {
    return res.status(400).json({ error: 'Company ID, name, and target URL are required' });
  }

  const comp = findCompanyByIdOrSlug(data.companyId);
  const targetCompanyId = comp ? comp.id : data.companyId;
  if (!db.canAccessCompany(user, targetCompanyId)) return res.status(403).json({ error: 'Access denied' });

  const newQr = {
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId: data.companyId,
    name: data.name,
    targetUrl: data.targetUrl,
    targetType: data.targetType || 'website',
    frame: data.frame || 'badge',
    caption: data.caption || 'SCAN FOR DIGITAL NABSITE',
    style: data.style || 'squares',
    fgColor: data.fgColor || '#000000',
    bgColor: data.bgColor || '#FFFFFF',
    logo: data.logo,
    size: data.size || 320,
    scanCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.qrConfigs.unshift(newQr);
  db.log(user.id, user.name, user.role, 'CREATE_QR', 'QR', newQr.id, data.companyId, 'SUCCESS');
  return res.status(201).json(newQr);
});

// Real QR Image Generator (PNG data URL)
app.get('/api/qr/:id/image', async (req, res) => {
  const { id } = req.params;
  const qr = db.qrConfigs.find((q) => q.id === id);
  if (!qr) return res.status(404).json({ error: 'QR config not found' });

  try {
    const fullUrl = qr.targetUrl.startsWith('http') ? qr.targetUrl : `${req.protocol}://${req.get('host')}${qr.targetUrl}`;
    const dataUrl = await QRCode.toDataURL(fullUrl, {
      width: qr.size || 320,
      margin: 2,
      color: {
        dark: qr.fgColor || '#000000',
        light: qr.bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    return res.json({ dataUrl, fullUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Real-time URL QR Generator from any user-inputted URL
app.post('/api/qr/generate', async (req, res) => {
  const { url, size = 360, fgColor = '#000000', bgColor = '#FFFFFF', margin = 2 } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'A valid URL is required to generate a QR code.' });
  }

  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    // Validate syntax
    new URL(normalized);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format. Please provide a valid domain or path (e.g. example.com or https://example.com).' });
  }

  try {
    const dataUrl = await QRCode.toDataURL(normalized, {
      width: Math.min(Math.max(Number(size) || 360, 160), 1024),
      margin: Math.min(Math.max(Number(margin) || 2, 0), 10),
      color: {
        dark: fgColor || '#000000',
        light: bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });
    return res.json({ dataUrl, normalizedUrl: normalized });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to encode QR' });
  }
});

app.put('/api/qr/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;
  const updates = req.body;

  const qr = db.qrConfigs.find((q) => q.id === id);
  if (!qr) return res.status(404).json({ error: 'QR config not found' });

  if (!db.canAccessCompany(user, qr.companyId)) return res.status(403).json({ error: 'Access denied' });

  Object.assign(qr, updates, { updatedAt: new Date().toISOString() });
  db.log(user.id, user.name, user.role, 'UPDATE_QR', 'QR', id, qr.companyId, 'SUCCESS');
  return res.json(qr);
});

app.delete('/api/qr/:id', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const qrIndex = db.qrConfigs.findIndex((q) => q.id === id);
  if (qrIndex === -1) return res.status(404).json({ error: 'QR config not found' });

  const qr = db.qrConfigs[qrIndex];
  if (!db.canAccessCompany(user, qr.companyId)) return res.status(403).json({ error: 'Access denied' });

  db.qrConfigs.splice(qrIndex, 1);
  db.log(user.id, user.name, user.role, 'DELETE_QR', 'QR', id, qr.companyId, 'SUCCESS');
  return res.json({ success: true });
});

// ==========================================
// 11. USERS & INVITATIONS
// ==========================================

app.get('/api/users', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const visible = db.getVisibleUsers(user);
  return res.json(visible);
});

app.post('/api/invitations', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { email, name, role, companyId, permissions } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Email, name, and role are required' });
  }

  // Admin cannot invite Owner
  if (role === 'OWNER') {
    return res.status(403).json({ error: 'Cannot invite platform owner' });
  }

  const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const newInv = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    email,
    name,
    role,
    companyId,
    token,
    status: 'pending' as const,
    permissions: permissions || [],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.invitations.unshift(newInv);

  // Pre-create user account in pending status
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    email,
    name,
    role,
    assignedCompanyId: companyId,
    permissions: permissions || [],
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);

  db.log(user.id, user.name, user.role, 'INVITE_USER', 'INVITATION', newInv.id, companyId, 'SUCCESS', { email, role });
  return res.status(201).json({ invitation: newInv, user: newUser });
});

app.delete('/api/invitations/:id', requireRole(['OWNER', 'ADMIN']), (req, res) => {
  const user: User = (req as any).user;
  const { id } = req.params;

  const inv = db.invitations.find((i) => i.id === id);
  if (!inv) return res.status(404).json({ error: 'Invitation not found' });

  inv.status = 'revoked';
  inv.revokedAt = new Date().toISOString();

  db.log(user.id, user.name, user.role, 'REVOKE_INVITATION', 'INVITATION', id, inv.companyId, 'SUCCESS');
  return res.json({ success: true });
});

// ==========================================
// 12. OWNER PLATFORM SETTINGS & EMERGENCY
// ==========================================

app.get('/api/owner/settings', requireRole(['OWNER']), (req, res) => {
  return res.json(db.settings);
});

app.put('/api/owner/settings', requireRole(['OWNER']), (req, res) => {
  const user: User = (req as any).user;
  const updates = req.body;

  Object.assign(db.settings, updates);
  db.log(user.id, user.name, 'OWNER', 'UPDATE_PLATFORM_SETTINGS', 'SETTINGS', 'global', undefined, 'SUCCESS', { updates });
  return res.json({ success: true, settings: db.settings });
});

app.get('/api/owner/audit', requireRole(['OWNER']), (req, res) => {
  return res.json(db.auditLogs);
});

app.get('/api/owner/analytics/summary', requireRole(['OWNER']), (req, res) => {
  const totalCompanies = db.companies.length;
  const activeCompanies = db.companies.filter((c) => c.status === 'active').length;
  const publishedWebsites = db.websites.filter((w) => w.status === 'published').length;
  const totalLeads = db.leads.length;
  const totalQrScans = db.qrConfigs.reduce((acc, q) => acc + (q.scanCount || 0), 0);
  const totalEvents = db.analytics.length;

  return res.json({
    totalCompanies,
    activeCompanies,
    draftCompanies: db.companies.filter((c) => c.status === 'draft').length,
    suspendedCompanies: db.companies.filter((c) => c.status === 'suspended').length,
    publishedWebsites,
    totalAdmins: db.users.filter((u) => u.role === 'ADMIN').length,
    totalSubAdmins: db.users.filter((u) => u.role === 'SUB_ADMIN').length,
    totalLeads,
    newLeads: db.leads.filter((l) => l.status === 'new').length,
    totalQrScans,
    totalEvents,
    eventsByType: {
      pageViews: db.analytics.filter((e) => e.eventType === 'PAGE_VIEW').length,
      productViews: db.analytics.filter((e) => e.eventType === 'PRODUCT_VIEW').length,
      telegramClicks: db.analytics.filter((e) => e.eventType === 'TELEGRAM_CLICK').length,
      searches: db.analytics.filter((e) => e.eventType === 'SEARCH').length,
      qrVisits: db.analytics.filter((e) => e.eventType === 'QR_VISIT').length,
    },
    recentEvents: db.analytics.slice(0, 50),
  });
});

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    database: { connected: true, entityCount: db.companies.length },
    auth: { operational: true, activeUsers: db.users.filter((u) => u.status === 'active').length },
    storage: { operational: true, assetCount: db.mediaAssets.length },
    analytics: { operational: true, pipeline: 'realtime_in_memory' },
    qrEngine: { operational: true },
    themesEngine: { operational: true, availableThemes: THEME_REGISTRY.length },
    websiteEngine: { operational: true },
    auditEngine: { operational: true, logsCount: db.auditLogs.length },
  });
});

app.get('/api/owner/export', requireRole(['OWNER']), (req, res) => {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    platform: db.settings.platformName,
    companies: db.companies,
    websites: db.websites,
    products: db.products,
    categories: db.categories,
    leads: db.leads,
    showcase: db.showcase,
    auditLogs: db.auditLogs,
  };
  return res.json(exportPayload);
});

// Showcase Updates
app.put('/api/owner/showcase', requireRole(['OWNER']), (req, res) => {
  const user: User = (req as any).user;
  const items = req.body;
  if (Array.isArray(items)) {
    db.showcase = items;
  }
  db.log(user.id, user.name, 'OWNER', 'UPDATE_SHOWCASE', 'SHOWCASE', 'global', undefined, 'SUCCESS');
  return res.json({ success: true, showcase: db.showcase });
});

// Categories Management
app.post('/api/categories', requireRole(['OWNER']), (req, res) => {
  const user: User = (req as any).user;
  const { name, icon, description, defaultThemeId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    slug,
    icon: icon || 'Globe',
    description: description || '',
    defaultThemeId: defaultThemeId || 'theme_general_business',
    active: true,
    order: db.categories.length + 1,
  };
  db.categories.push(newCat);
  db.log(user.id, user.name, 'OWNER', 'CREATE_CATEGORY', 'CATEGORY', newCat.id, undefined, 'SUCCESS');
  return res.status(201).json(newCat);
});

// Media Asset Upload & Retrieval
app.get('/api/media', requireAuth, (req, res) => {
  const { companyId } = req.query;
  if (companyId) return res.json(db.mediaAssets.filter((m) => m.companyId === String(companyId)));
  return res.json(db.mediaAssets);
});

app.post('/api/media', requireAuth, (req, res) => {
  const user: User = (req as any).user;
  const { companyId, name, url, category, size, mimeType } = req.body;
  if (!companyId || !url || !name) return res.status(400).json({ error: 'Missing media asset fields' });

  const newAsset = {
    id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    companyId,
    name,
    url,
    category: category || 'general',
    size: size || 120000,
    mimeType: mimeType || 'image/jpeg',
    createdAt: new Date().toISOString(),
  };
  db.mediaAssets.unshift(newAsset);
  db.log(user.id, user.name, user.role, 'UPLOAD_MEDIA', 'MEDIA', newAsset.id, companyId, 'SUCCESS');
  return res.status(201).json(newAsset);
});

// ==========================================
// 13. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NABSITE Stadium Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
