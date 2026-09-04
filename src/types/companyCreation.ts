import { DayHours, SocialLinks } from './index';

export interface CategorySpecificData {
  // School
  schoolCurriculum?: string;
  schoolGradeLevels?: string;
  schoolAcademicYear?: string;
  schoolPrincipal?: string;
  schoolAdmissionsPhone?: string;
  schoolAdmissionsEmail?: string;
  schoolTuitionNote?: string;
  schoolFeatures?: Record<string, boolean>;

  // Restaurant & Café
  cuisineType?: string;
  diningOptions?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  specialtyDish?: string;

  // Hotel
  starRating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  amenitiesList?: string;

  // Clinic / Healthcare
  medicalSpecialties?: string;
  emergencyServices?: boolean;
  appointmentBookingUrl?: string;

  // Salon & Beauty
  salonServices?: string;
  bookingDepositRequired?: boolean;

  // Gym & Fitness
  membershipTypes?: string;
  trainerAvailable?: boolean;

  // Retail
  productTypes?: string;
  returnPolicy?: string;

  // Generic / Other
  industryNotes?: string;
  [key: string]: any;
}

export interface CompanyCreationRow {
  tempId: string;
  
  // Basic Identity
  name: string;
  legalName?: string;
  shortName?: string;
  slug: string;
  companyKey?: string;
  category: string;
  subcategory?: string;
  shortDescription?: string;
  description?: string;
  status: 'active' | 'draft';
  plan?: 'business_starter' | 'business_pro' | 'enterprise';

  // Contact Channels
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  contactEmail?: string;
  whatsapp?: string;
  telegramUsername?: string;
  websiteUrl?: string;
  socialLinks?: SocialLinks;

  // Branding & Media
  logo?: string;
  coverImage?: string;
  mainImage?: string;
  additionalImages?: string;
  favicon?: string;
  tagline?: string;

  // Physical Coordinates & Address
  address?: string;
  city?: string;
  stateRegion?: string;
  country?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  mapLink?: string;

  // Operating Hours (Mon - Sun)
  hours: DayHours[];

  // Public Website Content
  websiteHeroTitle?: string;
  websiteHeroDescription?: string;
  websiteAboutText?: string;
  websiteCtaText?: string;
  websiteCtaLink?: string;

  // Category Specific Data
  categoryData: CategorySpecificData;
  schoolFeatures?: Record<string, boolean>;

  // Administrative / Governance
  assignedAdminId?: string;

  // Validation State
  isValid?: boolean;
  errors?: Record<string, string>;
  warnings?: string[];
}

export const DEFAULT_WEEK_HOURS: DayHours[] = [
  { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  { day: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
];

export const DEFAULT_SCHOOL_FEATURES: Record<string, boolean> = {
  academicYears: true,
  grades: true,
  sections: true,
  globalSearch: true,
  studentRoster: true,
  marklist: true,
  attendance: true,
  discipline: true,
  schoolFaq: true,
  announcements: true,
};

export function createEmptyCompanyRow(indexNumber: number = 1): CompanyCreationRow {
  const randSuffix = Math.random().toString(36).substring(2, 6);
  return {
    tempId: `row_${Date.now()}_${randSuffix}`,
    name: '',
    legalName: '',
    shortName: '',
    slug: '',
    companyKey: `COMP-${1000 + indexNumber}`,
    category: 'Restaurant',
    subcategory: '',
    shortDescription: '',
    description: '',
    status: 'active',
    plan: 'business_pro',
    phone: '',
    secondaryPhone: '',
    email: '',
    contactEmail: '',
    whatsapp: '',
    telegramUsername: '',
    websiteUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      tiktok: '',
      telegram: '',
      whatsapp: '',
      linkedin: '',
      twitter: '',
      youtube: '',
    },
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    mainImage: '',
    additionalImages: '',
    favicon: '',
    tagline: '',
    address: 'Bole Road, Addis Ababa',
    city: 'Addis Ababa',
    stateRegion: 'Shewa',
    country: 'Ethiopia',
    postalCode: '1000',
    latitude: '9.0105',
    longitude: '38.7612',
    mapLink: 'https://maps.google.com/?q=Addis+Ababa',
    hours: JSON.parse(JSON.stringify(DEFAULT_WEEK_HOURS)),
    websiteHeroTitle: '',
    websiteHeroDescription: '',
    websiteAboutText: '',
    websiteCtaText: '',
    websiteCtaLink: '',
    categoryData: {},
    schoolFeatures: { ...DEFAULT_SCHOOL_FEATURES },
    assignedAdminId: '',
    isValid: false,
    errors: {},
    warnings: [],
  };
}
