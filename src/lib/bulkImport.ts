import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { api, generateSlug } from './api';
import { withTimeout, logAudit, logError } from './firestoreUtils';
import { Company, Website, Product, ProductCategory, QrConfig, Offer, Announcement } from '../types';

// ==========================================
// 1. DATA MODELS & TYPES FOR BULK IMPORT
// ==========================================

export interface RawCompanyRow {
  company_key: string;
  company_name: string;
  short_name?: string;
  category: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  google_maps_url?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  telegram_url?: string;
  status?: string;
  [key: string]: any;
}

export interface ValidatedCompanyRow {
  rowIndex: number;
  data: RawCompanyRow;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  isExistingKey: boolean;
  isExistingSlug: boolean;
  generatedSlug: string;
  matchedCompanyId?: string;
}

export type DuplicateHandlingMode =
  | 'create_only' // Skip existing company_key
  | 'update_existing' // Update matching existing company_key
  | 'create_and_update' // Create new & update existing
  | 'skip_existing'; // Leave existing completely untouched

export interface ImportProgress {
  total: number;
  processed: number;
  created: number;
  updated: number;
  warnings: number;
  failed: number;
  currentItem?: string;
  phase: 'parsing' | 'validating' | 'importing' | 'verifying' | 'completed' | 'error';
}

export interface ImportResultSummary {
  totalSubmitted: number;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  warningCount: number;
  failedCount: number;
  createdCompanies: Company[];
  updatedCompanies: Company[];
  failedRows: { row: number; key: string; name: string; reason: string; raw: RawCompanyRow }[];
  durationMs: number;
}

// Sub-module Import Types
export interface RawMenuRow {
  company_key?: string;
  category_key?: string;
  category_name: string;
  item_name: string;
  short_name?: string;
  description?: string;
  price: number | string;
  currency?: string;
  image_url?: string;
  ingredients?: string;
  available?: string | boolean;
  featured?: string | boolean;
  display_order?: number | string;
  [key: string]: any;
}

export interface RawPageRow {
  company_key?: string;
  page_key: string;
  page_name: string;
  slug: string;
  page_type?: string;
  title: string;
  description?: string;
  visible?: string | boolean;
  display_order?: number | string;
  [key: string]: any;
}

export interface RawOfferRow {
  company_key?: string;
  offer_key: string;
  title: string;
  short_description?: string;
  discount_badge?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  status?: string;
  [key: string]: any;
}

export interface RawAnnouncementRow {
  company_key?: string;
  announcement_key: string;
  title: string;
  content: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  status?: string;
  [key: string]: any;
}

export interface RawQrRow {
  company_key?: string;
  qr_key: string;
  target_type: string;
  target_url: string;
  title: string;
  caption?: string;
  fg_color?: string;
  bg_color?: string;
  frame_style?: string;
  [key: string]: any;
}

// ==========================================
// 2. TEMPLATE DEFINITIONS & FILE GENERATION
// ==========================================

export const COMPANY_IMPORT_COLUMNS = [
  { key: 'company_key', label: 'Company Key', required: true, example: 'C001', desc: 'Permanent unique identifier (e.g. C001, C002)' },
  { key: 'company_name', label: 'Company Name', required: true, example: 'Addis Gourmet Restaurant', desc: 'Official commercial business name' },
  { key: 'short_name', label: 'Short Name', required: false, example: 'Addis Gourmet', desc: 'Abbreviated name for compact buttons & badges' },
  { key: 'category', label: 'Category', required: true, example: 'Restaurant', desc: 'Business category (Restaurant, Cafe, Hotel, Bar, Retail, etc.)' },
  { key: 'description', label: 'Description', required: false, example: 'Fine Ethiopian and international dining experience in Bole.', desc: 'High-level business overview for website hero & SEO' },
  { key: 'logo_url', label: 'Logo Image URL', required: false, example: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', desc: 'Direct public HTTPS image link for company logo' },
  { key: 'cover_image_url', label: 'Cover Image URL', required: false, example: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', desc: 'Direct public HTTPS link for website cover / hero backdrop' },
  { key: 'phone', label: 'Phone', required: false, example: '+251 911 234 567', desc: 'Primary customer telephone or hotline' },
  { key: 'whatsapp', label: 'WhatsApp', required: false, example: '+251 911 234 567', desc: 'WhatsApp number for click-to-chat CTA' },
  { key: 'email', label: 'Email', required: false, example: 'info@addisgourmet.et', desc: 'Official contact email' },
  { key: 'address', label: 'Address', required: false, example: 'Bole Road, Next to Mega Building', desc: 'Physical street address or floor location' },
  { key: 'city', label: 'City', required: false, example: 'Addis Ababa', desc: 'City of operation' },
  { key: 'country', label: 'Country', required: false, example: 'Ethiopia', desc: 'Country location' },
  { key: 'google_maps_url', label: 'Google Maps URL', required: false, example: 'https://maps.google.com/?q=Bole+Addis+Ababa', desc: 'Google Maps location link' },
  { key: 'website_url', label: 'External Website URL', required: false, example: 'https://addisgourmet.et', desc: 'Existing external website if applicable' },
  { key: 'facebook_url', label: 'Facebook URL', required: false, example: 'https://facebook.com/addisgourmet', desc: 'Facebook page link' },
  { key: 'instagram_url', label: 'Instagram URL', required: false, example: 'https://instagram.com/addisgourmet', desc: 'Instagram profile link' },
  { key: 'tiktok_url', label: 'TikTok URL', required: false, example: 'https://tiktok.com/@addisgourmet', desc: 'TikTok profile link' },
  { key: 'telegram_url', label: 'Telegram URL', required: false, example: 'https://t.me/addisgourmet', desc: 'Telegram channel or direct bot link' },
  { key: 'status', label: 'Status', required: false, example: 'active', desc: 'Status: active, draft, suspended, or archived (Default: active)' },
];

export const SAMPLE_COMPANIES_DATA: RawCompanyRow[] = [
  {
    company_key: 'C001',
    company_name: 'Addis Gourmet Restaurant',
    short_name: 'Addis Gourmet',
    category: 'Restaurant',
    description: 'Premier culinary dining offering authentic Ethiopian heritage dishes and contemporary fusion.',
    logo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 911 123 456',
    whatsapp: '+251 911 123 456',
    email: 'contact@addisgourmet.et',
    address: 'Bole Medhanealem, Cameroon Street',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    google_maps_url: 'https://maps.google.com/?q=Bole+Medhanealem+Addis+Ababa',
    website_url: 'https://addisgourmet.et',
    facebook_url: 'https://facebook.com/addisgourmet',
    instagram_url: 'https://instagram.com/addisgourmet',
    tiktok_url: 'https://tiktok.com/@addisgourmet',
    telegram_url: 'https://t.me/addisgourmet',
    status: 'active',
  },
  {
    company_key: 'C002',
    company_name: 'Entoto Artisan Coffee Roasters',
    short_name: 'Entoto Coffee',
    category: 'Cafe',
    description: 'Single-origin specialty coffee beans freshly roasted at 3,000 meters above sea level.',
    logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 922 456 789',
    whatsapp: '+251 922 456 789',
    email: 'beans@entotocoffee.et',
    address: 'Entoto Park Scenic Pavilion',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    google_maps_url: 'https://maps.google.com/?q=Entoto+Park+Addis+Ababa',
    website_url: 'https://entotocoffee.et',
    facebook_url: 'https://facebook.com/entotocoffee',
    instagram_url: 'https://instagram.com/entotocoffee',
    tiktok_url: 'https://tiktok.com/@entotocoffee',
    telegram_url: 'https://t.me/entotocoffee',
    status: 'active',
  },
  {
    company_key: 'C003',
    company_name: 'Harmony Wellness & Medical Clinic',
    short_name: 'Harmony Clinic',
    category: 'Health & Medical',
    description: 'Comprehensive health diagnostics, physiotherapy, and preventive family medical care.',
    logo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 933 789 012',
    whatsapp: '+251 933 789 012',
    email: 'care@harmonyclinic.et',
    address: 'Kazanchis, Guinea Conakry Street',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    google_maps_url: 'https://maps.google.com/?q=Kazanchis+Addis+Ababa',
    website_url: 'https://harmonyclinic.et',
    facebook_url: 'https://facebook.com/harmonyclinic',
    instagram_url: 'https://instagram.com/harmonyclinic',
    tiktok_url: '',
    telegram_url: 'https://t.me/harmonyclinic',
    status: 'active',
  },
];

export const SAMPLE_MENU_DATA: RawMenuRow[] = [
  {
    company_key: 'C001',
    category_key: 'CAT_MAIN',
    category_name: 'Main Dishes',
    item_name: 'Special Doro Wat & Injera',
    short_name: 'Special Doro Wat',
    description: 'Slow-cooked traditional chicken simmered in rich berbere gravy, caramelized onions, hard-boiled egg, served with organic teff injera.',
    price: 450,
    currency: 'ETB',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Free-range chicken, Organic berbere, Spiced clarified butter (Niter Kibbeh), Garlic, Hard-boiled egg',
    available: 'true',
    featured: 'true',
    display_order: 1,
  },
  {
    company_key: 'C001',
    category_key: 'CAT_MAIN',
    category_name: 'Main Dishes',
    item_name: 'Prime Ribeye Steak',
    short_name: 'Ribeye Steak',
    description: '300g charcoal-grilled tender beef ribeye served with rosemary truffle jus and garlic mashed potatoes.',
    price: 680,
    currency: 'ETB',
    image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Aged beef ribeye, Truffle oil, Rosemary, Garlic, Butter, Organic sea salt',
    available: 'true',
    featured: 'true',
    display_order: 2,
  },
  {
    company_key: 'C001',
    category_key: 'CAT_DRINKS',
    category_name: 'Artisan Beverages & Coffee',
    item_name: 'Ceremonial Yirgacheffe Pour-Over',
    short_name: 'Yirgacheffe Coffee',
    description: 'Light roast floral specialty coffee prepared in traditional clay jebena with aromatic frankincense.',
    price: 120,
    currency: 'ETB',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Grade 1 Yirgacheffe Washed Arabica beans, Spring water, Rue herb (Tena’adam)',
    available: 'true',
    featured: 'false',
    display_order: 3,
  },
  {
    company_key: 'C001',
    category_key: 'CAT_DESSERTS',
    category_name: 'Desserts & Sweets',
    item_name: 'Honey Baklava with Pistachio',
    short_name: 'Pistachio Baklava',
    description: 'Crispy golden filo pastry layered with roasted pistachios, drizzled with raw mountain honey syrup.',
    price: 190,
    currency: 'ETB',
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80',
    ingredients: 'Filo pastry, Crushed pistachio, Mountain honey, Cardamom, Rosewater',
    available: 'true',
    featured: 'false',
    display_order: 4,
  },
];

export const SAMPLE_PAGES_DATA: RawPageRow[] = [
  {
    company_key: 'C001',
    page_key: 'PAGE_HOME',
    page_name: 'Home',
    slug: 'home',
    page_type: 'landing',
    title: 'Welcome to Addis Gourmet',
    description: 'Main storefront presenting hero banner, featured dishes, and customer reviews.',
    visible: 'true',
    display_order: 1,
  },
  {
    company_key: 'C001',
    page_key: 'PAGE_MENU',
    page_name: 'Digital Menu',
    slug: 'menu',
    page_type: 'menu',
    title: 'Complete Food & Drink Catalog',
    description: 'Interactive digital menu with dietary tags, real-time availability, and price list.',
    visible: 'true',
    display_order: 2,
  },
  {
    company_key: 'C001',
    page_key: 'PAGE_REVIEWS',
    page_name: 'Guest Reviews',
    slug: 'reviews',
    page_type: 'reviews',
    title: 'Verified Customer Ratings',
    description: 'Real patron reviews and 5-star testimonials.',
    visible: 'true',
    display_order: 3,
  },
  {
    company_key: 'C001',
    page_key: 'PAGE_CONTACT',
    page_name: 'Contact & Table Booking',
    slug: 'contact',
    page_type: 'contact',
    title: 'Find Us & Make Inquiries',
    description: 'Interactive Google Maps directions, phone links, and opening schedule.',
    visible: 'true',
    display_order: 4,
  },
];

export const SAMPLE_OFFERS_DATA: RawOfferRow[] = [
  {
    company_key: 'C001',
    offer_key: 'OFFER_LUNCH',
    title: 'Executive Business Lunch 20% Off',
    short_description: 'Includes main dish, fresh salad, and Ethiopian ceremonial coffee between 12:00 PM and 3:00 PM.',
    discount_badge: '20% OFF',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
    status: 'active',
  },
  {
    company_key: 'C001',
    offer_key: 'OFFER_WEEKEND',
    title: 'Weekend Feast for Two',
    short_description: 'Platter of mixed tibs, doro wat, seasonal vegetables, and a complimentary bottle of Tej.',
    discount_badge: 'SPECIAL BUNDLE',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    status: 'active',
  },
];

export const SAMPLE_ANNOUNCEMENTS_DATA: RawAnnouncementRow[] = [
  {
    company_key: 'C001',
    announcement_key: 'ANN_LIVE_MUSIC',
    title: 'Live Acoustic Jazz Every Friday Evening',
    content: 'Join us every Friday from 7:00 PM for live Ethio-Jazz performances while dining.',
    priority: 'high',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    status: 'published',
  },
];

export const SAMPLE_QR_DATA: RawQrRow[] = [
  {
    company_key: 'C001',
    qr_key: 'QR_MENU_STAND',
    target_type: 'menu',
    target_url: 'https://nabsite.io/c/addis-gourmet/menu',
    title: 'Main Dining Table Stand',
    caption: 'SCAN TO VIEW DIGITAL MENU',
    fg_color: '#0F172A',
    bg_color: '#FFFFFF',
    frame_style: 'badge',
  },
  {
    company_key: 'C001',
    qr_key: 'QR_REVIEWS_STAND',
    target_type: 'reviews',
    target_url: 'https://nabsite.io/c/addis-gourmet/reviews',
    title: 'Reception Feedback Plaque',
    caption: 'LEAVE A 5-STAR REVIEW',
    fg_color: '#B45309',
    bg_color: '#FFFBEB',
    frame_style: 'table_stand',
  },
];

// ==========================================
// 3. FILE EXPORT & DOWNLOAD UTILITIES
// ==========================================

export function downloadSpreadsheetFile(
  data: any[],
  filename: string,
  format: 'xlsx' | 'csv' = 'xlsx'
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  if (format === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  } else {
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  }
}

export function downloadFailedRowsCsv(
  failedRows: { row: number; key: string; name: string; reason: string; raw: any }[],
  filename: string = 'NABSITE_Failed_Rows_For_Correction.csv'
) {
  const flattened = failedRows.map((f) => ({
    failed_row_number: f.row,
    failure_reason: f.reason,
    ...f.raw,
  }));
  downloadSpreadsheetFile(flattened, filename, 'csv');
}

// ==========================================
// 4. PARSING & SYNTACTIC VALIDATION
// ==========================================

export async function parseUploadedFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Uploaded file could not be read (empty payload)');
        }

        // Check if JSON
        if (file.name.endsWith('.json')) {
          const text = typeof buffer === 'string' ? buffer : new TextDecoder().decode(buffer as ArrayBuffer);
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else if (parsed && Array.isArray(parsed.companies)) {
            resolve(parsed.companies);
          } else {
            resolve([parsed]);
          }
          return;
        }

        // XLSX, XLS, CSV parsing via SheetJS
        const workbook = XLSX.read(buffer, { type: typeof buffer === 'string' ? 'string' : 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Spreadsheet does not contain any readable sheets.');
        }

        const sheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        resolve(rawJson);
      } catch (err: any) {
        reject(new Error(`Failed to parse spreadsheet: ${err.message || String(err)}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading error. Please try uploading again.'));
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

function isValidHttpUrl(string: string): boolean {
  if (!string || typeof string !== 'string') return false;
  const trimmed = string.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

// ==========================================
// 5. COMPREHENSIVE COMPANY VALIDATION ENGINE
// ==========================================

export async function validateCompanyImportData(
  rows: RawCompanyRow[],
  existingCompanies: Company[] = []
): Promise<{
  validatedRows: ValidatedCompanyRow[];
  totalValid: number;
  totalWarnings: number;
  totalErrors: number;
  duplicateKeysInFile: string[];
}> {
  const validatedRows: ValidatedCompanyRow[] = [];
  const keyOccurrences = new Map<string, number>();
  const slugOccurrences = new Map<string, number>();

  const existingKeysSet = new Set(
    existingCompanies.map((c) => (c.metadata?.companyKey || c.id || '').toLowerCase().trim())
  );
  const existingSlugsSet = new Set(
    existingCompanies.map((c) => (c.slug || '').toLowerCase().trim())
  );

  // 1. Pass 1: Count key repetitions in current file
  rows.forEach((r) => {
    const key = (r.company_key || '').toString().trim().toLowerCase();
    if (key) {
      keyOccurrences.set(key, (keyOccurrences.get(key) || 0) + 1);
    }
  });

  const duplicateKeysInFile: string[] = [];
  keyOccurrences.forEach((count, key) => {
    if (count > 1) duplicateKeysInFile.push(key);
  });

  // 2. Pass 2: Row-by-row deep inspection
  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // Excel row indexing (1-based + 1 for header)
    const errors: string[] = [];
    const warnings: string[] = [];

    const key = (rawRow.company_key || '').toString().trim();
    const name = (rawRow.company_name || '').toString().trim();
    const category = (rawRow.category || '').toString().trim();
    const email = (rawRow.email || '').toString().trim();
    const logo = (rawRow.logo_url || '').toString().trim();
    const cover = (rawRow.cover_image_url || '').toString().trim();
    const maps = (rawRow.google_maps_url || '').toString().trim();
    const web = (rawRow.website_url || '').toString().trim();
    const fb = (rawRow.facebook_url || '').toString().trim();
    const ig = (rawRow.instagram_url || '').toString().trim();
    const tt = (rawRow.tiktok_url || '').toString().trim();
    const tg = (rawRow.telegram_url || '').toString().trim();
    const status = (rawRow.status || 'active').toString().trim().toLowerCase();

    // Required Field Validations
    if (!key) {
      errors.push('Missing required field "company_key". (e.g. C001)');
    }
    if (!name) {
      errors.push('Missing required field "company_name".');
    }
    if (!category) {
      errors.push('Missing required field "category". (e.g. Restaurant, Cafe, Hotel, Bar, Retail, etc.)');
    }

    // Duplicate Key In File
    if (key && (keyOccurrences.get(key.toLowerCase()) || 0) > 1) {
      errors.push(`Duplicate "company_key" "${key}" appears multiple times in this spreadsheet.`);
    }

    // Status check
    const allowedStatuses = ['active', 'draft', 'suspended', 'archived'];
    if (status && !allowedStatuses.includes(status)) {
      warnings.push(`Status "${status}" is unrecognized; defaulting to "active".`);
    }

    // Image URL validations
    if (logo) {
      if (!isValidHttpUrl(logo)) {
        errors.push(`Invalid logo image URL "${logo}". Must be a valid http:// or https:// URL.`);
      }
    } else {
      warnings.push('No logo URL provided. A curated category placeholder will be assigned.');
    }

    if (cover) {
      if (!isValidHttpUrl(cover)) {
        errors.push(`Invalid cover image URL "${cover}". Must be a valid http:// or https:// URL.`);
      }
    } else {
      warnings.push('No cover image URL provided. A curated backdrop will be assigned.');
    }

    // Link validations
    if (maps && !isValidHttpUrl(maps)) {
      warnings.push(`Google Maps URL "${maps}" appears invalid.`);
    }
    if (web && !isValidHttpUrl(web)) {
      warnings.push(`Website URL "${web}" appears invalid.`);
    }
    if (fb && !isValidHttpUrl(fb)) {
      warnings.push(`Facebook URL "${fb}" appears invalid.`);
    }
    if (ig && !isValidHttpUrl(ig)) {
      warnings.push(`Instagram URL "${ig}" appears invalid.`);
    }
    if (tt && !isValidHttpUrl(tt)) {
      warnings.push(`TikTok URL "${tt}" appears invalid.`);
    }
    if (tg && !isValidHttpUrl(tg) && !tg.startsWith('t.me/') && !tg.startsWith('@')) {
      warnings.push(`Telegram link "${tg}" should start with https://t.me/ or @.`);
    }

    // Email format
    if (email && !isValidEmail(email)) {
      warnings.push(`Email address "${email}" appears improperly formatted.`);
    }

    // Contact completeness
    if (!rawRow.phone && !rawRow.whatsapp && !email) {
      warnings.push('No contact info (phone, whatsapp, or email) provided.');
    }

    // Slug generation & collision detection
    const generatedSlug = generateSlug(name || key || `comp-${rowNum}`);
    const isExistingKey = key ? existingKeysSet.has(key.toLowerCase()) : false;
    const isExistingSlug = existingSlugsSet.has(generatedSlug.toLowerCase());

    if (isExistingKey) {
      warnings.push(`Company key "${key}" already exists in the NABSITE database.`);
    }

    // Matched existing company ID if key exists
    let matchedCompanyId: string | undefined;
    if (isExistingKey) {
      const match = existingCompanies.find(
        (c) =>
          (c.metadata?.companyKey || '').toLowerCase() === key.toLowerCase() ||
          c.id.toLowerCase() === key.toLowerCase()
      );
      if (match) matchedCompanyId = match.id;
    }

    // Row status evaluation
    let rowStatus: 'valid' | 'warning' | 'error' = 'valid';
    if (errors.length > 0) {
      rowStatus = 'error';
    } else if (warnings.length > 0) {
      rowStatus = 'warning';
    }

    validatedRows.push({
      rowIndex: rowNum,
      data: rawRow,
      status: rowStatus,
      errors,
      warnings,
      isExistingKey,
      isExistingSlug,
      generatedSlug,
      matchedCompanyId,
    });
  });

  const totalErrors = validatedRows.filter((r) => r.status === 'error').length;
  const totalWarnings = validatedRows.filter((r) => r.status === 'warning').length;
  const totalValid = validatedRows.filter((r) => r.status === 'valid').length;

  return {
    validatedRows,
    totalValid,
    totalWarnings,
    totalErrors,
    duplicateKeysInFile,
  };
}

// ==========================================
// 6. CONTROLLED BATCH FIRESTORE IMPORTER
// ==========================================

export async function executeBulkCompanyImport(
  validatedRows: ValidatedCompanyRow[],
  duplicateMode: DuplicateHandlingMode,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResultSummary> {
  const startTime = Date.now();
  const createdCompanies: Company[] = [];
  const updatedCompanies: Company[] = [];
  const failedRows: { row: number; key: string; name: string; reason: string; raw: RawCompanyRow }[] = [];

  let createdCount = 0;
  let updatedCount = 0;
  let warningCount = 0;
  let failedCount = 0;

  // Filter rows based on duplicate mode
  const actionableRows = validatedRows.filter((row) => {
    if (row.status === 'error') {
      failedRows.push({
        row: row.rowIndex,
        key: row.data.company_key || 'UNKNOWN',
        name: row.data.company_name || 'Unnamed',
        reason: row.errors.join('; '),
        raw: row.data,
      });
      failedCount++;
      return false;
    }

    if (row.isExistingKey) {
      if (duplicateMode === 'create_only' || duplicateMode === 'skip_existing') {
        // Skip existing key
        return false;
      }
    }

    return true;
  });

  const totalToProcess = actionableRows.length;

  // Audit event: bulk import started
  await logAudit(
    'BULK_COMPANY_IMPORT_STARTED',
    'SYSTEM',
    `import_${Date.now()}`,
    `Bulk company import initiated for ${totalToProcess} entities (Duplicate mode: ${duplicateMode})`
  ).catch(() => {});

  // Controlled Batch Processing (Chunks of 10 for optimal Firestore throughput without freezing)
  const CHUNK_SIZE = 5;
  for (let i = 0; i < actionableRows.length; i += CHUNK_SIZE) {
    const chunk = actionableRows.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (row) => {
        const itemRaw = row.data;
        const key = (itemRaw.company_key || '').toString().trim();
        const name = (itemRaw.company_name || '').toString().trim();
        const shortName = (itemRaw.short_name || name.substring(0, 20)).toString().trim();
        const category = (itemRaw.category || 'Restaurant').toString().trim();
        const slug = row.generatedSlug || generateSlug(name);
        const nowIso = new Date().toISOString();

        try {
          if (row.isExistingKey && (duplicateMode === 'update_existing' || duplicateMode === 'create_and_update') && row.matchedCompanyId) {
            // --- UPDATE EXISTING COMPANY ---
            const targetCompId = row.matchedCompanyId;
            const updatePayload: Partial<Company> = {
              name,
              shortName,
              category,
              shortDescription: itemRaw.description || 'Certified business and service provider registered with NABSITE.',
              logo: itemRaw.logo_url || undefined,
              coverImage: itemRaw.cover_image_url || undefined,
              phone: itemRaw.phone || undefined,
              email: itemRaw.email || undefined,
              telegram: itemRaw.telegram_url || undefined,
              websiteUrl: itemRaw.website_url || undefined,
              address: itemRaw.address || undefined,
              city: itemRaw.city || undefined,
              mapLink: itemRaw.google_maps_url || undefined,
              status: (itemRaw.status as any) || 'active',
              updatedAt: nowIso,
              metadata: {
                companyKey: key,
                lastImportedAt: nowIso,
                importMode: 'bulk_update',
              },
            };

            // Remove undefined keys
            Object.keys(updatePayload).forEach((k) => (updatePayload as any)[k] === undefined && delete (updatePayload as any)[k]);

            await withTimeout(
              setDoc(doc(firestoreDb, 'companies', targetCompId), updatePayload, { merge: true }),
              10000,
              `Updating company ${key} in Firestore timed out`
            );

            // Read-after-write verification
            const verifySnap = await getDoc(doc(firestoreDb, 'companies', targetCompId));
            if (!verifySnap.exists()) {
              throw new Error(`Verification failed: Company ${targetCompId} was not found after update write.`);
            }

            const updatedObj = { id: verifySnap.id, ...verifySnap.data() } as Company;
            updatedCompanies.push(updatedObj);
            updatedCount++;

            if (row.warnings.length > 0) warningCount++;

            await logAudit('COMPANY_UPDATED_FROM_IMPORT', 'COMPANY', targetCompId, `Updated ${name} (key: ${key}) from bulk import`, name).catch(() => {});
          } else {
            // --- CREATE NEW COMPANY ---
            const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const webId = `web_${compId}`;
            const qrId = `qr_${compId}`;

            const newCompany: Company = {
              id: compId,
              name,
              shortName,
              slug,
              logo: itemRaw.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
              coverImage: itemRaw.cover_image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
              category,
              shortDescription: itemRaw.description || 'Certified business and service provider registered with NABSITE.',
              phone: itemRaw.phone || '+251 911 000 000',
              email: itemRaw.email || '',
              telegram: itemRaw.telegram_url || '',
              websiteUrl: itemRaw.website_url || '',
              address: itemRaw.address || 'Bole Road, Addis Ababa',
              city: itemRaw.city || 'Addis Ababa',
              mapLink: itemRaw.google_maps_url || 'https://maps.google.com/?q=Addis+Ababa',
              openingHours: 'Mon - Sun: 8:00 AM - 10:00 PM',
              status: (itemRaw.status as any) || 'active',
              websiteStatus: 'draft',
              websiteId: webId,
              plan: 'business_pro',
              metrics: { views: 0, qrScans: 0, leadsCount: 0, reviewsCount: 0, averageRating: 5.0 },
              metadata: {
                companyKey: key,
                importedAt: nowIso,
                importMode: 'bulk_create',
              },
              createdAt: nowIso,
              updatedAt: nowIso,
            };

            // Initial Website configuration
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
                        subtitle: `${newCompany.address}, ${newCompany.city}`,
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
                        subtitle: 'Explore our complete dishes and specialties',
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

            // Default Stand QR config
            const initialQr: QrConfig = {
              id: qrId,
              companyId: compId,
              targetUrl: `${window.location.origin}/c/${slug}`,
              title: `${newCompany.name} Table Stand`,
              caption: 'SCAN TO VIEW DIGITAL MENU & INFO',
              fgColor: '#0F172A',
              bgColor: '#FFFFFF',
              size: 400,
              margin: 2,
              frameStyle: 'badge',
              scanCount: 0,
              createdAt: nowIso,
            };

            // Default Menu Category
            const defaultCatId = `cat_${compId}_main`;
            const defaultCategory: ProductCategory = {
              id: defaultCatId,
              companyId: compId,
              name: 'Signature Offerings',
              slug: 'signature-offerings',
              sortOrder: 1,
            };

            // 1. Write Company
            await withTimeout(
              setDoc(doc(firestoreDb, 'companies', compId), newCompany),
              10000,
              `Creating company document ${key} timed out`
            );

            // 2. Write Website
            await withTimeout(
              setDoc(doc(firestoreDb, 'websites', webId), newWebsite),
              8000
            ).catch((e) => console.warn('Non-fatal website write notice:', e));

            // 3. Write QR
            await withTimeout(
              setDoc(doc(firestoreDb, 'qrConfigs', qrId), initialQr),
              8000
            ).catch((e) => console.warn('Non-fatal QR write notice:', e));

            // 4. Write initial Category
            await withTimeout(
              setDoc(doc(firestoreDb, 'productCategories', defaultCatId), defaultCategory),
              8000
            ).catch((e) => console.warn('Non-fatal Category write notice:', e));

            // 5. Read-after-write verification
            const verifySnap = await getDoc(doc(firestoreDb, 'companies', compId));
            if (!verifySnap.exists()) {
              throw new Error(`Verification failed: Company ${compId} was not found after write.`);
            }

            const createdObj = { id: verifySnap.id, ...verifySnap.data() } as Company;
            createdCompanies.push(createdObj);
            createdCount++;

            if (row.warnings.length > 0) warningCount++;

            await logAudit('COMPANY_IMPORTED', 'COMPANY', compId, `Created enterprise ${name} (key: ${key}) from bulk import`, name).catch(() => {});
          }
        } catch (itemErr: any) {
          logError('executeBulkCompanyImportItem', itemErr, { key, name });
          failedRows.push({
            row: row.rowIndex,
            key,
            name,
            reason: itemErr.message || String(itemErr),
            raw: itemRaw,
          });
          failedCount++;
        }

        // Live progress notification
        const processedCount = createdCount + updatedCount + failedCount;
        if (onProgress) {
          onProgress({
            total: totalToProcess,
            processed: processedCount,
            created: createdCount,
            updated: updatedCount,
            warnings: warningCount,
            failed: failedCount,
            currentItem: name,
            phase: processedCount >= totalToProcess ? 'completed' : 'importing',
          });
        }
      })
    );
  }

  // Audit completion
  const durationMs = Date.now() - startTime;
  if (failedCount > 0 && createdCount === 0 && updatedCount === 0) {
    await logAudit(
      'BULK_IMPORT_FAILED',
      'SYSTEM',
      `import_${Date.now()}`,
      `Bulk company import failed completely: ${failedCount} errors`
    ).catch(() => {});
  } else {
    await logAudit(
      'BULK_IMPORT_COMPLETED',
      'SYSTEM',
      `import_${Date.now()}`,
      `Bulk import completed in ${durationMs}ms: Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${failedCount}`
    ).catch(() => {});
  }

  return {
    totalSubmitted: validatedRows.length,
    totalProcessed: createdCount + updatedCount + failedCount,
    createdCount,
    updatedCount,
    warningCount,
    failedCount,
    createdCompanies,
    updatedCompanies,
    failedRows,
    durationMs,
  };
}

// ==========================================
// 7. SUB-MODULE IMPORTERS (MENU, PAGES, OFFERS, ANNOUNCEMENTS, QR)
// ==========================================

export async function executeBulkMenuImport(
  companyId: string,
  rows: RawMenuRow[]
): Promise<{ created: number; updated: number; failed: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];
  const nowIso = new Date().toISOString();

  // Fetch existing categories to reuse or create new
  const existingCats = await api.getProductCategories(companyId).catch(() => []);
  const categoryMap = new Map<string, string>(); // category_name -> id
  existingCats.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const itemName = (r.item_name || '').toString().trim();
    const catName = (r.category_name || 'Main Offerings').toString().trim();
    if (!itemName) {
      failed++;
      errors.push(`Row ${i + 2}: Item name is required`);
      continue;
    }

    try {
      // Find or create category
      let catId = categoryMap.get(catName.toLowerCase());
      if (!catId) {
        const createdCat = await api.createProductCategory({
          companyId,
          name: catName,
          sortOrder: categoryMap.size + 1,
        });
        catId = createdCat.id;
        categoryMap.set(catName.toLowerCase(), catId);
      }

      const priceNum = typeof r.price === 'number' ? r.price : parseFloat((r.price || '0').toString().replace(/[^0-9.]/g, '')) || 0;
      const isAvail = r.available === undefined ? true : (r.available === true || r.available === 'true' || r.available === '1' || r.available === 'yes');
      const isFeat = r.featured === true || r.featured === 'true' || r.featured === '1' || r.featured === 'yes';

      await api.createProduct({
        companyId,
        categoryId: catId,
        name: itemName,
        description: r.description || '',
        price: priceNum,
        currency: r.currency || 'ETB',
        image: r.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        isAvailable: isAvail,
        isFeatured: isFeat,
        tags: r.ingredients ? r.ingredients.split(',').map((s) => s.trim()) : [],
        sortOrder: Number(r.display_order) || i + 1,
      });

      created++;
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 2} (${itemName}): ${err.message || String(err)}`);
    }
  }

  await logAudit('MENU_IMPORTED', 'MENU', companyId, `Imported ${created} menu items for company ${companyId}`).catch(() => {});
  return { created, updated, failed, errors };
}

export async function executeBulkPagesImport(
  companyId: string,
  rows: RawPageRow[]
): Promise<{ created: number; failed: number; errors: string[] }> {
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const { website } = await api.getCompanyWebsite(companyId);
    const draftConfig: any = website.draftConfig || {};
    const existingPages = (draftConfig.pages as any[]) || [];

    const newPages = [...existingPages];

    rows.forEach((r, idx) => {
      const pageName = (r.page_name || r.title || '').toString().trim();
      const slug = (r.slug || generateSlug(pageName)).toString().trim();
      if (!pageName) {
        failed++;
        errors.push(`Row ${idx + 2}: Page name is required.`);
        return;
      }

      const isVisible = r.visible === undefined ? true : (r.visible === true || r.visible === 'true' || r.visible === '1');
      const pageId = `page_${slug.replace(/[^a-z0-9_]/g, '_')}`;

      // Check if page with slug already exists
      const existingIdx = newPages.findIndex((p: any) => p.slug === slug || p.id === pageId);
      const pageObj = {
        id: pageId,
        name: pageName,
        title: r.title || pageName,
        slug,
        isPublished: isVisible,
        showInNavigation: isVisible,
        sections: [
          {
            id: `sec_${pageId}_hero`,
            type: r.page_type === 'menu' ? 'products' : 'hero',
            title: r.title || pageName,
            subtitle: r.description || `Welcome to ${pageName}`,
            isVisible: true,
            order: 1,
          },
        ],
      };

      if (existingIdx >= 0) {
        newPages[existingIdx] = pageObj;
      } else {
        newPages.push(pageObj);
      }
      created++;
    });

    draftConfig.pages = newPages;
    await api.saveDraft(website.id, draftConfig);
    await logAudit('PAGES_IMPORTED', 'WEBSITE', website.id, `Imported ${created} custom pages into website`).catch(() => {});
  } catch (err: any) {
    failed += rows.length;
    errors.push(err.message || 'Failed to update website pages in database.');
  }

  return { created, failed, errors };
}

export async function executeBulkOffersImport(
  companyId: string,
  rows: RawOfferRow[]
): Promise<{ created: number; failed: number; errors: string[] }> {
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = (r.title || '').toString().trim();
    if (!title) {
      failed++;
      errors.push(`Row ${i + 2}: Offer title is required`);
      continue;
    }

    try {
      await api.createOffer({
        companyId,
        title,
        description: r.short_description || '',
        discount: r.discount_badge || 'SPECIAL OFFER',
        validUntil: r.end_date || '2026-12-31',
        image: r.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
        active: r.status !== 'inactive' && r.status !== 'expired',
      });
      created++;
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 2} (${title}): ${err.message || String(err)}`);
    }
  }

  return { created, failed, errors };
}

export async function executeBulkAnnouncementsImport(
  companyId: string,
  rows: RawAnnouncementRow[]
): Promise<{ created: number; failed: number; errors: string[] }> {
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = (r.title || '').toString().trim();
    if (!title) {
      failed++;
      errors.push(`Row ${i + 2}: Announcement title is required`);
      continue;
    }

    try {
      await api.createAnnouncement({
        companyId,
        title,
        content: r.content || '',
        publishDate: r.start_date || new Date().toISOString(),
        status: (r.status as any) || 'published',
      });
      created++;
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 2} (${title}): ${err.message || String(err)}`);
    }
  }

  return { created, failed, errors };
}
