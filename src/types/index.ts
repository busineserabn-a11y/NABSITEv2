/**
 * NABSITE - Comprehensive Types & Data Schema
 * Platform Foundation for Multi-Tenant Digital Identity & Website System
 */

export type Role = 'OWNER' | 'ADMIN' | 'SUB_ADMIN' | 'VISITOR';

export type CompanyStatus = 'draft' | 'active' | 'suspended' | 'archived';
export type WebsiteStatus = 'draft' | 'published' | 'unpublished' | 'suspended' | 'archived';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'in_discussion'
  | 'approved'
  | 'company_created'
  | 'website_in_progress'
  | 'published'
  | 'rejected'
  | 'archived';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'archived';
export type OfferStatus = 'draft' | 'active' | 'inactive' | 'expired' | 'archived';
export type AnnouncementStatus = 'draft' | 'published' | 'hidden' | 'archived';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type SubAdminPermission =
  | 'view_business_info'
  | 'edit_business_info'
  | 'manage_hours'
  | 'manage_products'
  | 'manage_prices'
  | 'manage_categories'
  | 'manage_announcements'
  | 'manage_offers'
  | 'moderate_reviews'
  | 'manage_social'
  | 'manage_pages'
  | 'edit_website'
  | 'manage_features'
  | 'manage_store'
  | 'view_analytics'
  | 'manage_qr';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  assignedCompanyId?: string; // For SUB_ADMIN
  assignedCompanyIds?: string[]; // For ADMIN or SUB_ADMIN multi-company
  assignedAllCompanies?: boolean; // For ADMIN (true = full access to all companies)
  permissions?: SubAdminPermission[];
  permissionMatrix?: Record<string, string[]>;
  status: 'active' | 'disabled' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface DayHours {
  day: string; // 'Monday', 'Tuesday', etc.
  isOpen: boolean;
  is24Hours?: boolean;
  openTime: string; // '08:00'
  closeTime: string; // '20:00'
  periods?: { open: string; close: string }[];
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  whatsapp?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  github?: string;
}

export type BusinessHour = DayHours;

export interface Company {
  id: string;
  name: string;
  shortName?: string;
  slug: string;
  logo: string;
  coverImage?: string;
  category: string;
  subcategory?: string;
  shortDescription: string;
  description?: string;
  fullDescription?: string;
  phone: string;
  email: string;
  telegram?: string;
  websiteUrl?: string;
  address: string;
  city?: string;
  websiteId?: string;
  mapLink?: string;
  hours?: DayHours[];
  openingHours?: string;
  telegramUsername?: string;
  telegramPhone?: string;
  socialLinks?: SocialLinks;
  status: CompanyStatus;
  websiteStatus?: WebsiteStatus;
  assignedAdminId?: string;
  assignedAdminIds?: string[];
  subAdminIds?: string[];
  plan?: string;
  metrics?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  defaultThemeId: string;
  active: boolean;
  order: number;
}

export type SectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'products'
  | 'categories'
  | 'gallery'
  | 'announcements'
  | 'offers'
  | 'reviews'
  | 'testimonials'
  | 'team'
  | 'statistics'
  | 'faq'
  | 'contact'
  | 'map'
  | 'hours'
  | 'social'
  | 'cta'
  | 'telegram_cta'
  | 'custom_html'
  | 'divider'
  | 'rich_text'
  | 'store'
  | 'promos'
  // Education & School
  | 'programs'
  | 'academic_programs'
  | 'faculty'
  | 'campus_tour'
  | 'campus_life'
  | 'admissions'
  | 'principal_message'
  | 'events'
  | 'achievements'
  // Hotel & Hospitality
  | 'rooms'
  | 'amenities'
  | 'hotel_amenities'
  | 'dining'
  | 'booking_cta'
  | 'reservation'
  // Café & Specialty Coffee
  | 'specialty_brews'
  | 'bean_origins'
  | 'coffee_origin'
  | 'cozy_spaces'
  | 'cafe_vibe'
  | 'curated_menu'
  | 'pastry_showcase'
  // Clinic & Healthcare
  | 'medical_services'
  | 'doctors'
  | 'doctors_directory'
  | 'appointment_booking'
  | 'emergency_notice'
  | 'departments'
  // Salon & Beauty
  | 'treatments'
  | 'beauty_treatments'
  | 'stylists'
  | 'stylist_directory'
  | 'pricing_tiers'
  | 'price_list'
  | 'beauty_gallery'
  | 'before_after'
  // Fitness & Gym
  | 'workout_programs'
  | 'fitness_classes'
  | 'trainers'
  | 'membership_tiers'
  | 'membership_plans'
  | 'class_schedule'
  // Real Estate & Construction & Auto & Food
  | 'property_listings'
  | 'agent_roster'
  | 'project_portfolio'
  | 'capabilities'
  | 'vehicle_inventory'
  | 'test_drive_cta'
  | 'chef_story'
  | 'chef_signature'
  | 'signature_dishes'
  | 'table_reservation';

export interface CtaConfig {
  text: string;
  url: string;
  type: 'internal' | 'external' | 'phone' | 'email' | 'telegram' | 'whatsapp' | 'store';
  style: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill';
}

export interface SectionDesignConfig {
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  paddingY?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export interface SectionConfig {
  id: string;
  type: SectionType;
  order: number;
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  bgImageUrl?: string;
  content?: any;
  bodyContent?: string;
  layoutVariant?: string;
  design?: SectionDesignConfig;
  cta?: CtaConfig;
  secondaryCta?: CtaConfig;
  alignment?: 'left' | 'center' | 'right';
  ctaText?: string;
  ctaLink?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  showCategories?: boolean;
  showSearch?: boolean;
  showPrices?: boolean;
  containerWidth?: 'contained' | 'wide' | 'full';
  padding?: 'compact' | 'normal' | 'generous';
  customBgColor?: string;
  customTextColor?: string;
  anchorId?: string;
  customHtml?: string;
}

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface PageConfig {
  id: string;
  name?: string;
  slug: string;
  title: string;
  description?: string;
  order?: number;
  isHome?: boolean;
  isPublished?: boolean;
  isHidden?: boolean;
  showInNavigation?: boolean;
  template?: 'standard' | 'landing' | 'contained' | 'fluid';
  customBgColor?: string;
  customPattern?: string;
  metaTitle?: string;
  metaDescription?: string;
  sections: SectionConfig[];
  seo?: PageSeo;
}

export interface NavItem {
  id: string;
  label: string;
  type: 'page' | 'external' | 'anchor' | 'menu' | 'offers' | 'contact' | 'custom_url';
  target: string;
  url?: string;
  order: number;
  openNewTab?: boolean;
  targetBlank?: boolean;
  isHidden?: boolean;
  badge?: string;
  children?: NavItem[];
}

export interface HeaderConfig {
  showLogo: boolean;
  showCompanyName: boolean;
  style: 'standard' | 'centered' | 'split' | 'minimal' | 'transparent' | 'floating' | 'glass';
  sticky: boolean;
  headerHeight?: string;
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
  showPhoneBtn: boolean;
  showTelegramBtn: boolean;
  showCtaBtn: boolean;
  ctaText?: string;
  ctaLabel?: string;
  ctaTarget?: string;
  ctaUrl?: string;
  ctaAction?: 'url' | 'phone' | 'telegram' | 'menu' | 'reserve';
  ctaStyle?: 'primary' | 'secondary' | 'outline' | 'amber';
  mobileMenuStyle?: 'drawer' | 'dropdown' | 'fullscreen';
  backgroundColor?: string;
  transparentOnTop?: boolean;
  transparentOnHero?: boolean;
  textColor?: string;
  announcementBanner?: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
    linkText?: string;
    actionText?: string;
    actionUrl?: string;
    bgColor?: string;
    textColor?: string;
  };
}

export interface FooterConfig {
  showLogo: boolean;
  showDescription: boolean;
  showContactInfo: boolean;
  showSocialLinks: boolean;
  showNavigation: boolean;
  showDeveloperCredit: boolean;
  customText?: string;
  copyrightText?: string;
}

export interface DesignConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
  headingScale?: 'compact' | 'normal' | 'expressive' | 'grand';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  maxWidth?: 'standard' | 'wide' | 'narrow' | 'full';
  spacingDensity?: 'compact' | 'comfortable' | 'spacious';
  buttonStyle?: 'rounded' | 'pill' | 'square' | 'soft';
  cardStyle?: 'flat' | 'bordered' | 'elevated' | 'glass';
}

export type WebsitePage = PageConfig;
export type CustomHtmlSite = CustomHtmlBlock;

export interface CustomHtmlBlock {
  id: string;
  websiteId: string;
  pageId?: string;
  companyId: string;
  name: string;
  html: string;
  css: string;
  js: string;
  status: 'draft' | 'published' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface InstalledFeature {
  featureId: string;
  enabled: boolean;
  installedAt?: string;
  config?: Record<string, any>;
}

export interface SeoConfig {
  siteTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface WebsiteConfig {
  design: DesignConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  navigation: NavItem[];
  pages: PageConfig[];
  installedFeatures: (InstalledFeature | string)[];
  customHtml?: CustomHtmlBlock;
  seo: SeoConfig;
}

export interface Website {
  id: string;
  companyId: string;
  templateId?: string;
  themeId: string;
  status: WebsiteStatus;
  draftConfig: WebsiteConfig;
  publishedConfig: WebsiteConfig | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastPublishedBy?: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
}

export interface ThemeLayout {
  containerWidth: string;
  sectionPadding: string;
  cardRadius: string;
  heroAlignment: 'center' | 'left' | 'split';
  spacingDensity?: 'compact' | 'comfortable' | 'spacious';
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  categoryCompatibilities: string[];
  category?: string;
  previewColor: string;
  personality: string;
  headerStyle: string;
  heroStyle: string;
  cardStyle: string;
  footerStyle: string;
  mobileNavStyle?: string;
  layoutArchetype?: string;
  sectionOrder?: string[];
  recommendedUse?: string;
  supportedFeatures?: string[];
  badge?: string;
  isRecommended?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  rating?: number;
  active?: boolean;
  typography: ThemeTypography;
  layout: ThemeLayout;
  defaultPalette: ColorPalette;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'commerce' | 'engagement' | 'integration' | 'marketing';
  version: string;
  defaultEnabled: boolean;
}

export interface ProductCategory {
  id: string;
  companyId: string;
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  visibility?: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number | string;
  currency: string;
  image: string;
  sku?: string;
  status?: ProductStatus;
  visibility?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
  tags?: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  companyId: string;
  name: string;
  rating: number; // 1 to 5
  text: string;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  reply?: string;
}

export interface Offer {
  id: string;
  companyId: string;
  title: string;
  description: string;
  image?: string;
  originalPrice?: number;
  offerPrice?: number;
  discountText?: string;
  discountPercent?: number;
  startDate?: string;
  endDate?: string;
  validUntil?: string;
  isActive?: boolean;
  status: OfferStatus;
  ctaText?: string;
  ctaUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  companyId: string;
  title: string;
  content: string;
  image?: string;
  status?: AnnouncementStatus;
  publishDate?: string;
  ctaText?: string;
  ctaUrl?: string;
  featured?: boolean;
  category?: 'Academic' | 'Event' | 'Holiday' | 'General' | 'Arabic' | 'PTA' | string;
  description?: string;
  priority?: 'normal' | 'high' | 'urgent';
  pinned?: boolean;
  author?: string;
  date?: string;
  tags?: string[];
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email?: string;
  telegramUsername?: string;
  telegramPhone?: string;
  category: string;
  message?: string;
  status: LeadStatus;
  assignedAdminId?: string;
  convertedCompanyId?: string;
  notes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string;
  token: string;
  status: InvitationStatus;
  permissions: SubAdminPermission[];
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface QrConfig {
  id: string;
  companyId: string;
  name?: string;
  title?: string;
  targetUrl: string;
  targetType?: 'website' | 'store' | 'menu' | 'offer' | 'contact' | 'custom_page' | 'custom_url';
  pageSlug?: string;
  frame?: 'none' | 'simple' | 'badge' | 'card' | 'speech_bubble';
  frameStyle?: string;
  caption?: string;
  style?: 'squares' | 'dots' | 'rounded';
  fgColor: string;
  bgColor: string;
  logo?: string;
  size?: number;
  margin?: number;
  startDate?: string;
  expiryDate?: string;
  duration?: string;
  scanCount: number;
  createdAt: string;
  updatedAt?: string;
}

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'SEARCH'
  | 'PRODUCT_VIEW'
  | 'PHONE_CLICK'
  | 'MAP_CLICK'
  | 'SOCIAL_CLICK'
  | 'TELEGRAM_CLICK'
  | 'OFFER_CLICK'
  | 'QR_VISIT'
  | 'REVIEW_SUBMIT'
  | 'LEAD_SUBMIT';

export interface AnalyticsEvent {
  id: string;
  companyId?: string;
  websiteId?: string;
  pageId?: string;
  eventType: AnalyticsEventType;
  timestamp: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  path: string;
  metadata?: Record<string, any>;
}

export interface ShowcaseItem {
  id: string;
  companyId: string;
  displayName: string;
  logo: string;
  quote?: string;
  category: string;
  targetUrl: string;
  order: number;
  isVisible: boolean;
  title?: string;
  image?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'spicy'
  | 'gluten_free'
  | 'chef_choice'
  | 'popular'
  | 'new';

export type MenuAvailability = 'available' | 'sold_out' | 'hidden';

export interface MenuCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  sortOrder: number;
  visibility: boolean;
}

export interface MenuItem {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  dietaryTags: DietaryTag[];
  availability: MenuAvailability;
  ingredients?: string[];
  allergens?: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LandingHeroSettings {
  backgroundType: 'animated' | 'gradient' | 'image' | 'video' | 'solid' | 'custom';
  bgType?: 'animated' | 'gradient' | 'image' | 'video' | 'solid' | 'custom' | string;
  imageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  videoFallbackImageUrl?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  overlayOpacity?: number; // 0 to 100
  blur?: number; // px
  brightness?: number; // %
  solidColor?: string;
  headline?: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  heroAlignment?: 'center' | 'left';
  motionIntensity?: 'low' | 'medium' | 'high' | 'off' | 'subtle' | 'normal' | 'expressive';
  showMotionElements?: boolean;
  enableHandAnimation?: boolean;
  enableParticles?: boolean;
  enableFloatingCards?: boolean;
  enableParallax?: boolean;
  enableGlow?: boolean;
}

export interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  platformLogo: string;
  favicon?: string;
  developerName: string;
  developerUrl: string;
  showDeveloperCredit: boolean;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  disablePublishing: boolean;
  disableSignups: boolean;
  categoryDefaultTemplates?: Record<string, string>;
  searchSettings: {
    enableLocationSearch: boolean;
    enableCategoryFilters: boolean;
    featuredCategories: string[];
  };
  showcaseSettings?: {
    autoplay: boolean;
    direction: 'left' | 'right';
    speed: number; // in ms
    pauseOnHover: boolean;
    pauseOnTouch?: boolean;
    cardSize?: 'compact' | 'normal' | 'spacious';
  };
  heroSettings?: LandingHeroSettings;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId: string;
  companyId?: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILED' | 'DENIED';
  metadata?: Record<string, any>;
}

export interface MediaAsset {
  id: string;
  companyId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  category: 'logos' | 'hero' | 'gallery' | 'products' | 'announcements' | 'offers' | 'general';
  createdAt: string;
}

export interface CategoryDesignProfile {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  iconName: string;
  description: string;
  visualPersonality: string;
  tagline: string;
  recommendedThemes: string[];
  defaultPalette: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scaleRatio: number;
    headingWeight: string;
  };
  heroDefaults: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: { text: string; action: string };
    ctaSecondary?: { text: string; action: string };
    layout: 'split' | 'fullscreen' | 'centered' | 'editorial' | 'minimal';
  };
  defaultNavigation: Array<{
    id: string;
    label: string;
    target: string;
    type: 'page' | 'anchor' | 'external' | 'custom_url';
    order: number;
  }>;
  defaultPages: PageConfig[];
  recommendedPages: string[];
  optionalPages: string[];
  excludedPages: string[];
  sectionCatalog: Array<{
    type: SectionType;
    name: string;
    icon: string;
    desc: string;
    categorySpecific: boolean;
    defaultTitle: string;
    defaultSubtitle?: string;
    defaultData?: any;
  }>;
  businessFeatures: string[];
  mobileLayoutSettings: {
    primaryAction: 'call' | 'telegram' | 'book' | 'order' | 'quote' | 'directions' | 'menu';
    bottomBarItems: Array<{ icon: string; label: string; action: string; target?: string }>;
    cardDisplayMode: 'grid' | 'carousel' | 'list';
  };
}

