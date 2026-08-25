import ExcelJS from 'exceljs';

// ============================================================================
// 1. MASTER REGISTRIES (Single Source of Truth for Excel & Firestore)
// ============================================================================

export const NABSITE_CATEGORIES = [
  'Restaurant',
  'Café',
  'Hotel',
  'Bakery',
  'Salon',
  'Barbershop',
  'Retail',
  'Grocery',
  'Fitness',
  'Clinic',
  'Education',
  'Automotive',
  'Real Estate',
  'Professional Services',
  'Bar & Lounge',
  'Nightclub',
  'Spa & Wellness',
  'Entertainment',
  'Pharmacy',
];

export const NABSITE_STATUSES = ['draft', 'active', 'suspended', 'archived'];

export const NABSITE_COUNTRIES = [
  'Ethiopia',
  'Kenya',
  'Rwanda',
  'Uganda',
  'Tanzania',
  'United Arab Emirates',
  'United States',
  'United Kingdom',
  'Germany',
  'Canada',
];

export const NABSITE_CITIES = [
  'Addis Ababa',
  'Hawassa',
  'Dire Dawa',
  'Bahir Dar',
  'Adama',
  'Mekelle',
  'Gondar',
  'Nairobi',
  'Kigali',
  'Dubai',
];

export const YES_NO_OPTIONS = ['Yes', 'No'];

export const TIME_SLOT_OPTIONS = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30',
  '00:00',
  '01:00',
  '02:00',
  '03:00',
];

export interface ColumnDefinition {
  key: string;
  header: string;
  constraint: 'REQUIRED' | 'OPTIONAL' | 'SYSTEM';
  width: number;
  validationType?: 'category' | 'country' | 'city' | 'status' | 'yesno' | 'time' | 'email' | 'url';
  example: string;
  desc: string;
}

export const WORKBOOK_COLUMNS: ColumnDefinition[] = [
  // Required identity & core
  { key: 'company_key', header: 'company_key', constraint: 'REQUIRED', width: 16, example: 'C001', desc: 'Permanent unique ID (e.g. C001, C002)' },
  { key: 'company_name', header: 'company_name', constraint: 'REQUIRED', width: 28, example: 'Addis Garden Restaurant', desc: 'Full official business name' },
  { key: 'short_name', header: 'short_name', constraint: 'REQUIRED', width: 20, example: 'Addis Garden', desc: 'Compact name for badges & mobile nav' },
  { key: 'category', header: 'category', constraint: 'REQUIRED', width: 22, validationType: 'category', example: 'Restaurant', desc: 'Select from NABSITE Category Registry' },
  { key: 'city', header: 'city', constraint: 'REQUIRED', width: 18, validationType: 'city', example: 'Addis Ababa', desc: 'City of primary operation' },
  { key: 'country', header: 'country', constraint: 'REQUIRED', width: 18, validationType: 'country', example: 'Ethiopia', desc: 'Operating country' },

  // Optional profile & media
  { key: 'description', header: 'description', constraint: 'OPTIONAL', width: 36, example: 'Contemporary Ethiopian dining & coffee lounge in Bole.', desc: 'High-level business summary for storefront hero & SEO' },
  { key: 'logo_url', header: 'logo_url', constraint: 'OPTIONAL', width: 34, validationType: 'url', example: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', desc: 'Direct public HTTPS image link for company brand mark' },
  { key: 'cover_image_url', header: 'cover_image_url', constraint: 'OPTIONAL', width: 34, validationType: 'url', example: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', desc: 'Direct public HTTPS image link for website hero backdrop' },

  // Contact & Social links
  { key: 'phone', header: 'phone', constraint: 'OPTIONAL', width: 20, example: '+251 911 234 567', desc: 'Primary customer phone / hotline' },
  { key: 'whatsapp', header: 'whatsapp', constraint: 'OPTIONAL', width: 20, example: '+251 911 234 567', desc: 'WhatsApp hotline number for direct messaging CTA' },
  { key: 'email', header: 'email', constraint: 'OPTIONAL', width: 26, validationType: 'email', example: 'info@addisgarden.et', desc: 'Official customer & business inquiries email' },
  { key: 'address', header: 'address', constraint: 'OPTIONAL', width: 32, example: 'Bole Medhanealem, Cameroon St', desc: 'Physical street or mall unit location' },
  { key: 'google_maps_url', header: 'google_maps_url', constraint: 'OPTIONAL', width: 32, validationType: 'url', example: 'https://maps.google.com/?q=Bole+Addis+Ababa', desc: 'Google Maps pin URL for navigation' },
  { key: 'website_url', header: 'website_url', constraint: 'OPTIONAL', width: 28, validationType: 'url', example: 'https://addisgarden.et', desc: 'Existing external corporate website (if any)' },
  { key: 'facebook_url', header: 'facebook_url', constraint: 'OPTIONAL', width: 28, validationType: 'url', example: 'https://facebook.com/addisgarden', desc: 'Official Facebook page link' },
  { key: 'instagram_url', header: 'instagram_url', constraint: 'OPTIONAL', width: 28, validationType: 'url', example: 'https://instagram.com/addisgarden', desc: 'Official Instagram profile link' },
  { key: 'tiktok_url', header: 'tiktok_url', constraint: 'OPTIONAL', width: 28, validationType: 'url', example: 'https://tiktok.com/@addisgarden', desc: 'Official TikTok channel' },
  { key: 'telegram_url', header: 'telegram_url', constraint: 'OPTIONAL', width: 28, validationType: 'url', example: 'https://t.me/addisgarden', desc: 'Official Telegram channel or bot link' },

  // Opening hours per day
  { key: 'monday_open', header: 'monday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '08:00', desc: 'Monday opening time' },
  { key: 'monday_close', header: 'monday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '22:00', desc: 'Monday closing time' },
  { key: 'monday_closed', header: 'monday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Monday' },

  { key: 'tuesday_open', header: 'tuesday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '08:00', desc: 'Tuesday opening time' },
  { key: 'tuesday_close', header: 'tuesday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '22:00', desc: 'Tuesday closing time' },
  { key: 'tuesday_closed', header: 'tuesday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Tuesday' },

  { key: 'wednesday_open', header: 'wednesday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '08:00', desc: 'Wednesday opening time' },
  { key: 'wednesday_close', header: 'wednesday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '22:00', desc: 'Wednesday closing time' },
  { key: 'wednesday_closed', header: 'wednesday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Wednesday' },

  { key: 'thursday_open', header: 'thursday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '08:00', desc: 'Thursday opening time' },
  { key: 'thursday_close', header: 'thursday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '22:00', desc: 'Thursday closing time' },
  { key: 'thursday_closed', header: 'thursday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Thursday' },

  { key: 'friday_open', header: 'friday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '08:00', desc: 'Friday opening time' },
  { key: 'friday_close', header: 'friday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '23:30', desc: 'Friday closing time' },
  { key: 'friday_closed', header: 'friday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Friday' },

  { key: 'saturday_open', header: 'saturday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '09:00', desc: 'Saturday opening time' },
  { key: 'saturday_close', header: 'saturday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '23:30', desc: 'Saturday closing time' },
  { key: 'saturday_closed', header: 'saturday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Saturday' },

  { key: 'sunday_open', header: 'sunday_open', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '09:00', desc: 'Sunday opening time' },
  { key: 'sunday_close', header: 'sunday_close', constraint: 'OPTIONAL', width: 14, validationType: 'time', example: '21:00', desc: 'Sunday closing time' },
  { key: 'sunday_closed', header: 'sunday_closed', constraint: 'OPTIONAL', width: 15, validationType: 'yesno', example: 'No', desc: 'Mark Yes if business is closed all day Sunday' },

  // Lifecycle Status
  { key: 'status', header: 'status', constraint: 'REQUIRED', width: 16, validationType: 'status', example: 'draft', desc: 'Controlled lifecycle: draft, active, suspended, archived' },

  // System Fields (Protected / Auto-generated)
  { key: 'system_company_id', header: 'system_company_id', constraint: 'SYSTEM', width: 24, example: '(Auto-Generated)', desc: 'SYSTEM ONLY — Leave blank or untouched' },
  { key: 'generated_slug', header: 'generated_slug', constraint: 'SYSTEM', width: 24, example: '(Auto-Generated)', desc: 'SYSTEM ONLY — Leave blank or untouched' },
  { key: 'created_at', header: 'created_at', constraint: 'SYSTEM', width: 24, example: '(Auto-Generated)', desc: 'SYSTEM ONLY — Leave blank or untouched' },
  { key: 'import_batch_id', header: 'import_batch_id', constraint: 'SYSTEM', width: 24, example: '(Auto-Generated)', desc: 'SYSTEM ONLY — Leave blank or untouched' },
  { key: 'import_status', header: 'import_status', constraint: 'SYSTEM', width: 20, example: '(Auto-Generated)', desc: 'SYSTEM ONLY — Leave blank or untouched' },
];

export const DEMO_SAMPLE_ROWS: Record<string, any>[] = [
  {
    company_key: 'C001',
    company_name: 'Addis Garden Restaurant',
    short_name: 'Addis Garden',
    category: 'Restaurant',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    description: 'Premier culinary dining offering authentic Ethiopian heritage dishes and contemporary fusion in Bole.',
    logo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 911 123 456',
    whatsapp: '+251 911 123 456',
    email: 'contact@addisgarden.et',
    address: 'Bole Medhanealem, Cameroon Street',
    google_maps_url: 'https://maps.google.com/?q=Bole+Medhanealem+Addis+Ababa',
    website_url: 'https://addisgarden.et',
    facebook_url: 'https://facebook.com/addisgarden',
    instagram_url: 'https://instagram.com/addisgarden',
    tiktok_url: 'https://tiktok.com/@addisgarden',
    telegram_url: 'https://t.me/addisgarden',
    monday_open: '08:00',
    monday_close: '22:00',
    monday_closed: 'No',
    tuesday_open: '08:00',
    tuesday_close: '22:00',
    tuesday_closed: 'No',
    wednesday_open: '08:00',
    wednesday_close: '22:00',
    wednesday_closed: 'No',
    thursday_open: '08:00',
    thursday_close: '22:00',
    thursday_closed: 'No',
    friday_open: '08:00',
    friday_close: '23:30',
    friday_closed: 'No',
    saturday_open: '09:00',
    saturday_close: '23:30',
    saturday_closed: 'No',
    sunday_open: '09:00',
    sunday_close: '21:00',
    sunday_closed: 'No',
    status: 'active',
    system_company_id: '',
    generated_slug: '',
    created_at: '',
    import_batch_id: '',
    import_status: '',
  },
  {
    company_key: 'C002',
    company_name: 'Blue Moon Coffee House',
    short_name: 'Blue Moon',
    category: 'Café',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    description: 'Single-origin specialty coffee beans freshly roasted at 3,000 meters above sea level with artisanal pastries.',
    logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 922 456 789',
    whatsapp: '+251 922 456 789',
    email: 'hello@bluemooncoffee.et',
    address: 'Entoto Park Scenic Pavilion',
    google_maps_url: 'https://maps.google.com/?q=Entoto+Park+Addis+Ababa',
    website_url: 'https://bluemooncoffee.et',
    facebook_url: 'https://facebook.com/bluemooncoffee',
    instagram_url: 'https://instagram.com/bluemooncoffee',
    tiktok_url: 'https://tiktok.com/@bluemooncoffee',
    telegram_url: 'https://t.me/bluemooncoffee',
    monday_open: '07:00',
    monday_close: '20:00',
    monday_closed: 'No',
    tuesday_open: '07:00',
    tuesday_close: '20:00',
    tuesday_closed: 'No',
    wednesday_open: '07:00',
    wednesday_close: '20:00',
    wednesday_closed: 'No',
    thursday_open: '07:00',
    thursday_close: '20:00',
    thursday_closed: 'No',
    friday_open: '07:00',
    friday_close: '21:00',
    friday_closed: 'No',
    saturday_open: '07:00',
    saturday_close: '21:00',
    saturday_closed: 'No',
    sunday_open: '08:00',
    sunday_close: '19:00',
    sunday_closed: 'No',
    status: 'active',
    system_company_id: '',
    generated_slug: '',
    created_at: '',
    import_batch_id: '',
    import_status: '',
  },
  {
    company_key: 'C003',
    company_name: 'Harmony Wellness & Medical Clinic',
    short_name: 'Harmony Clinic',
    category: 'Clinic',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    description: 'Comprehensive health diagnostics, physiotherapy, specialized consultations, and preventive family care.',
    logo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80',
    cover_image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 933 789 012',
    whatsapp: '+251 933 789 012',
    email: 'care@harmonyclinic.et',
    address: 'Kazanchis, Guinea Conakry Street',
    google_maps_url: 'https://maps.google.com/?q=Kazanchis+Addis+Ababa',
    website_url: 'https://harmonyclinic.et',
    facebook_url: 'https://facebook.com/harmonyclinic',
    instagram_url: 'https://instagram.com/harmonyclinic',
    tiktok_url: '',
    telegram_url: 'https://t.me/harmonyclinic',
    monday_open: '08:30',
    monday_close: '18:00',
    monday_closed: 'No',
    tuesday_open: '08:30',
    tuesday_close: '18:00',
    tuesday_closed: 'No',
    wednesday_open: '08:30',
    wednesday_close: '18:00',
    wednesday_closed: 'No',
    thursday_open: '08:30',
    thursday_close: '18:00',
    thursday_closed: 'No',
    friday_open: '08:30',
    friday_close: '18:00',
    friday_closed: 'No',
    saturday_open: '09:00',
    saturday_close: '15:00',
    saturday_closed: 'No',
    sunday_open: '',
    sunday_close: '',
    sunday_closed: 'Yes',
    status: 'draft',
    system_company_id: '',
    generated_slug: '',
    created_at: '',
    import_batch_id: '',
    import_status: '',
  },
];

// ============================================================================
// 2. WORKBOOK GENERATOR FUNCTION (Produces NABSITE_Company_Import_Template.xlsx)
// ============================================================================

export async function generateControlledExcelTemplate(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NABSITE Multi-Tenant Engine';
  workbook.lastModifiedBy = 'NABSITE System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // --------------------------------------------------------------------------
  // SHEET 1: START_HERE (Branded instructions & workflow guide)
  // --------------------------------------------------------------------------
  const startSheet = workbook.addWorksheet('START_HERE', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FFF59E0B' } }, // Amber tab
  });

  startSheet.columns = [
    { width: 5 },
    { width: 32 },
    { width: 70 },
  ];

  // Header Title
  startSheet.mergeCells('B2:C2');
  const titleCell = startSheet.getCell('B2');
  titleCell.value = 'NABSITE ENTERPRISE COMPANY IMPORT WORKBOOK';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate 900
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  startSheet.getRow(2).height = 36;

  // Subtitle
  startSheet.mergeCells('B3:C3');
  const subCell = startSheet.getCell('B3');
  subCell.value = 'Official Controlled Data-Entry Workbook for Multi-Company Batch Ingestion';
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  startSheet.getRow(3).height = 22;

  // Instructions & Step-by-Step Table
  const instructions = [
    ['Step 1', 'Download this official template from NABSITE Owner Console.'],
    ['Step 2', 'Read these instructions carefully and check the EXAMPLE & ERROR_GUIDE sheets.'],
    ['Step 3', 'Navigate to the "COMPANIES" sheet and fill in one company per row.'],
    ['Step 4', 'Use the Excel dropdown arrows wherever provided (do NOT type arbitrary text).'],
    ['Step 5', 'Do NOT modify or delete columns marked ◆ SYSTEM — DO NOT EDIT.'],
    ['Step 6', 'For logos and cover photos, provide direct public HTTPS image links.'],
    ['Step 7', 'Save the completed workbook as a standard .xlsx file.'],
    ['Step 8', 'Upload the workbook at: NABSITE → Owner → Companies → Import Many.'],
    ['Step 9', 'Review the live validation matrix (Valid, Warnings, Errors) in NABSITE.'],
    ['Step 10', 'Confirm and commit to create real Firestore companies with website, menu & QR.'],
  ];

  startSheet.mergeCells('B5:C5');
  const stepHead = startSheet.getCell('B5');
  stepHead.value = 'STANDARD ONBOARDING WORKFLOW';
  stepHead.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  stepHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  startSheet.getRow(5).height = 24;

  let rowIdx = 6;
  instructions.forEach(([step, desc]) => {
    const r = startSheet.getRow(rowIdx);
    r.getCell(2).value = step;
    r.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F172A' } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

    r.getCell(3).value = desc;
    r.getCell(3).font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
    r.getCell(3).alignment = { vertical: 'middle', wrapText: true };
    r.height = 20;
    rowIdx++;
  });

  // Visual Legend
  rowIdx += 1;
  startSheet.mergeCells(`B${rowIdx}:C${rowIdx}`);
  const legHead = startSheet.getCell(`B${rowIdx}`);
  legHead.value = 'COLUMN CONSTRAINT & COLOR CODING';
  legHead.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  legHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  startSheet.getRow(rowIdx).height = 24;
  rowIdx++;

  const legends = [
    ['● REQUIRED (Red / Rose Header)', 'Mandatory fields (company_key, company_name, short_name, category, city, country, status). Row cannot be imported if empty.'],
    ['○ OPTIONAL (Slate / Neutral Header)', 'Optional fields (description, images, phone, email, social links, opening hours). Can remain blank if not applicable.'],
    ['◆ SYSTEM (Blue / Indigo Header)', 'System-generated identifiers and metadata. Do NOT type values manually into these columns; NABSITE manages them.'],
  ];

  legends.forEach(([tag, expl]) => {
    const r = startSheet.getRow(rowIdx);
    r.getCell(2).value = tag;
    r.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F172A' } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    r.getCell(3).value = expl;
    r.getCell(3).font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
    r.getCell(3).alignment = { vertical: 'middle', wrapText: true };
    r.height = 22;
    rowIdx++;
  });

  // Critical Rules Box
  rowIdx += 1;
  startSheet.mergeCells(`B${rowIdx}:C${rowIdx}`);
  const ruleHead = startSheet.getCell(`B${rowIdx}`);
  ruleHead.value = 'CRITICAL INTEGRITY RULES';
  ruleHead.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ruleHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }; // Amber 700
  startSheet.getRow(rowIdx).height = 24;
  rowIdx++;

  const criticalRules = [
    '1. Use Dropdown Arrows: Do not type arbitrary values into Category, Country, City, or Status cells. Use the dropdown arrow.',
    '2. Image Format: Enter direct HTTPS URLs (e.g. https://domain.com/photo.jpg). Do not paste local file paths or embed image files.',
    '3. Permanent Key: Use unique company_key (e.g. C001, C002). Re-importing with the same key safely updates the record without duplicating.',
    '4. Multi-Company Scale: One company per row in the "COMPANIES" sheet. You can enter 1 to 500+ companies in a single workbook.',
  ];

  criticalRules.forEach((rule) => {
    startSheet.mergeCells(`B${rowIdx}:C${rowIdx}`);
    const r = startSheet.getCell(`B${rowIdx}`);
    r.value = rule;
    r.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF78350F' } };
    r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
    r.alignment = { vertical: 'middle', wrapText: true };
    startSheet.getRow(rowIdx).height = 20;
    rowIdx++;
  });

  // --------------------------------------------------------------------------
  // SHEET 2: OPTIONS (Controlled Registry Reference Sheet)
  // --------------------------------------------------------------------------
  const optSheet = workbook.addWorksheet('OPTIONS', {
    properties: { tabColor: { argb: 'FF64748B' } },
  });

  optSheet.columns = [
    { header: 'Category_Registry', key: 'categories', width: 24 },
    { header: 'Status_Registry', key: 'statuses', width: 18 },
    { header: 'Country_Registry', key: 'countries', width: 22 },
    { header: 'City_Registry', key: 'cities', width: 20 },
    { header: 'Yes_No_Registry', key: 'yesno', width: 14 },
    { header: 'Time_Registry', key: 'times', width: 14 },
  ];

  // Header row styling for OPTIONS
  const optHeaderRow = optSheet.getRow(1);
  optHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  optHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  optHeaderRow.height = 24;

  const maxOptRows = Math.max(
    NABSITE_CATEGORIES.length,
    NABSITE_STATUSES.length,
    NABSITE_COUNTRIES.length,
    NABSITE_CITIES.length,
    YES_NO_OPTIONS.length,
    TIME_SLOT_OPTIONS.length
  );

  for (let i = 0; i < maxOptRows; i++) {
    const row = optSheet.getRow(i + 2);
    row.getCell(1).value = NABSITE_CATEGORIES[i] || '';
    row.getCell(2).value = NABSITE_STATUSES[i] || '';
    row.getCell(3).value = NABSITE_COUNTRIES[i] || '';
    row.getCell(4).value = NABSITE_CITIES[i] || '';
    row.getCell(5).value = YES_NO_OPTIONS[i] || '';
    row.getCell(6).value = TIME_SLOT_OPTIONS[i] || '';
    row.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
  }

  // --------------------------------------------------------------------------
  // SHEET 3: COMPANIES (The Primary Controlled Data Entry Sheet)
  // --------------------------------------------------------------------------
  const compSheet = workbook.addWorksheet('COMPANIES', {
    views: [{ state: 'frozen', ySplit: 2, showGridLines: true }],
    properties: { tabColor: { argb: 'FF10B981' } }, // Emerald tab
  });

  // Assign columns and widths
  compSheet.columns = WORKBOOK_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Row 1: Primary Header
  const row1 = compSheet.getRow(1);
  row1.height = 26;
  WORKBOOK_COLUMNS.forEach((col, idx) => {
    const cell = row1.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (col.constraint === 'REQUIRED') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } }; // Deep Red
    } else if (col.constraint === 'OPTIONAL') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } }; // Indigo 900
    }
  });

  // Row 2: Constraint Indicator & Sub-header
  const row2 = compSheet.getRow(2);
  row2.height = 20;
  WORKBOOK_COLUMNS.forEach((col, idx) => {
    const cell = row2.getCell(idx + 1);
    cell.font = { name: 'Arial', size: 8, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (col.constraint === 'REQUIRED') {
      cell.value = '● REQUIRED';
      cell.font = { ...cell.font, color: { argb: 'FF991B1B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red 100
    } else if (col.constraint === 'OPTIONAL') {
      cell.value = '○ OPTIONAL';
      cell.font = { ...cell.font, color: { argb: 'FF475569' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
    } else {
      cell.value = '◆ SYSTEM — DO NOT EDIT';
      cell.font = { ...cell.font, color: { argb: 'FF3730A3' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Indigo 100
    }
  });

  // Enable Auto-Filter on Row 1
  compSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: WORKBOOK_COLUMNS.length },
  };

  // Configure Data Validations for 150 entry rows (Rows 3 to 150)
  const categoryRangeFormula = `OPTIONS!$A$2:$A$${NABSITE_CATEGORIES.length + 1}`;
  const statusRangeFormula = `OPTIONS!$B$2:$B$${NABSITE_STATUSES.length + 1}`;
  const countryRangeFormula = `OPTIONS!$C$2:$C$${NABSITE_COUNTRIES.length + 1}`;
  const cityRangeFormula = `OPTIONS!$D$2:$D$${NABSITE_CITIES.length + 1}`;
  const yesnoRangeFormula = `OPTIONS!$E$2:$E$${YES_NO_OPTIONS.length + 1}`;
  const timeRangeFormula = `OPTIONS!$F$2:$F$${TIME_SLOT_OPTIONS.length + 1}`;

  for (let r = 3; r <= 150; r++) {
    const dataRow = compSheet.getRow(r);
    dataRow.height = 20;

    WORKBOOK_COLUMNS.forEach((col, cIdx) => {
      const cell = dataRow.getCell(cIdx + 1);
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } };

      // Apply Excel Data Validations (Dropdowns & Input Prompts)
      if (col.validationType === 'category') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [categoryRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please choose an official category from the NABSITE dropdown.',
        };
      } else if (col.validationType === 'status') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [statusRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Status',
          error: 'Please select one of: draft, active, suspended, archived.',
        };
      } else if (col.validationType === 'country') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [countryRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Country',
          error: 'Please select a supported country from the dropdown.',
        };
      } else if (col.validationType === 'city') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [cityRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid City',
          error: 'Please select a supported city from the dropdown.',
        };
      } else if (col.validationType === 'yesno') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [yesnoRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Closed Flag',
          error: 'Select Yes or No.',
        };
      } else if (col.validationType === 'time') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [timeRangeFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Time',
          error: 'Select a 24-hour time slot (e.g. 08:00, 22:00).',
        };
      }

      // Format system columns to look disabled
      if (col.constraint === 'SYSTEM') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  }

  // --------------------------------------------------------------------------
  // SHEET 4: EXAMPLE (Demonstration Records Sheet)
  // --------------------------------------------------------------------------
  const exSheet = workbook.addWorksheet('EXAMPLE', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
    properties: { tabColor: { argb: 'FF3B82F6' } }, // Blue tab
  });

  exSheet.columns = WORKBOOK_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Banner Row
  exSheet.mergeCells(1, 1, 1, WORKBOOK_COLUMNS.length);
  const exBanner = exSheet.getCell(1, 1);
  exBanner.value = 'EXAMPLES — DO NOT IMPORT THESE AS REAL COMPANIES (COPY AND ADAPT STRUCTURE TO "COMPANIES" SHEET)';
  exBanner.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  exBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
  exBanner.alignment = { vertical: 'middle', horizontal: 'center' };
  exSheet.getRow(1).height = 26;

  // Header Row 2
  const exRow2 = exSheet.getRow(2);
  exRow2.height = 24;
  WORKBOOK_COLUMNS.forEach((col, idx) => {
    const cell = exRow2.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Header Row 3 (Constraints)
  const exRow3 = exSheet.getRow(3);
  exRow3.height = 18;
  WORKBOOK_COLUMNS.forEach((col, idx) => {
    const cell = exRow3.getCell(idx + 1);
    cell.value = col.constraint;
    cell.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF64748B' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Populate Demo Rows
  DEMO_SAMPLE_ROWS.forEach((sample, rIdx) => {
    const row = exSheet.getRow(rIdx + 4);
    row.height = 20;
    WORKBOOK_COLUMNS.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = sample[col.key] || '';
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // --------------------------------------------------------------------------
  // SHEET 5: ERROR_GUIDE (Comprehensive Troubleshooting Table)
  // --------------------------------------------------------------------------
  const errSheet = workbook.addWorksheet('ERROR_GUIDE', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FFEF4444' } }, // Red tab
  });

  errSheet.columns = [
    { width: 6 },
    { header: 'Error Identifier / Scenario', key: 'scenario', width: 30 },
    { header: 'Meaning & Validation Impact', key: 'meaning', width: 44 },
    { header: 'Required Fix / Importer Action', key: 'fix', width: 46 },
  ];

  // Header banner
  errSheet.mergeCells('B2:D2');
  const errBanner = errSheet.getCell('B2');
  errBanner.value = 'NABSITE BULK IMPORT TROUBLESHOOTING & ERROR GUIDE';
  errBanner.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  errBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };
  errBanner.alignment = { vertical: 'middle', horizontal: 'center' };
  errSheet.getRow(2).height = 32;

  // Table Headers
  const errHeaderRow = errSheet.getRow(4);
  errHeaderRow.height = 24;
  ['scenario', 'meaning', 'fix'].forEach((k, idx) => {
    const cell = errHeaderRow.getCell(idx + 2);
    cell.value = idx === 0 ? 'Validation Condition' : idx === 1 ? 'Meaning & Validation Rule' : 'Required Fix / Action';
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const errorGuideData = [
    ['Missing company name', 'Required field company_name is blank or whitespace.', 'Enter the official commercial business name.'],
    ['Missing company key', 'Required field company_key is blank.', 'Provide a permanent unique key (e.g. C001, C002).'],
    ['Duplicate company key in file', 'The same company_key appears multiple times in your workbook.', 'Ensure every company row in the file has a distinct company_key.'],
    ['Invalid category', 'Category text does not match the official NABSITE registry.', 'Select the category using the Excel dropdown arrow.'],
    ['Invalid URL format', 'Image or social link does not start with http:// or https://.', 'Enter a valid direct HTTP/HTTPS link (e.g. https://domain.com/photo.jpg).'],
    ['Invalid email format', 'Email address is malformed (missing @ or domain).', 'Provide a valid RFC-compliant email (e.g. info@business.com) or leave blank.'],
    ['Existing company in Firestore', 'Company key already exists in NABSITE database.', 'Select "Update Existing" in NABSITE import wizard to refresh data, or use a new key.'],
    ['Invalid lifecycle status', 'Status is not one of: draft, active, suspended, archived.', 'Select a valid lifecycle status from the dropdown (default: draft).'],
    ['Missing short name', 'Required field short_name is blank.', 'Enter a concise 1-3 word business abbreviation for mobile headers.'],
    ['Time slot format mismatch', 'Opening hour string is invalid.', 'Choose time slot from dropdown (e.g. 08:00, 22:00) or mark closed as Yes.'],
    ['System column edited', 'Manual values entered into system-managed columns.', 'Leave system columns empty. NABSITE automatically assigns Firestore IDs and slugs.'],
  ];

  let errRowIdx = 5;
  errorGuideData.forEach(([scenario, meaning, fix]) => {
    const r = errSheet.getRow(errRowIdx);
    r.height = 24;

    r.getCell(2).value = scenario;
    r.getCell(2).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } };
    r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    r.getCell(2).alignment = { vertical: 'middle', wrapText: true };

    r.getCell(3).value = meaning;
    r.getCell(3).font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
    r.getCell(3).alignment = { vertical: 'middle', wrapText: true };

    r.getCell(4).value = fix;
    r.getCell(4).font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } };
    r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    r.getCell(4).alignment = { vertical: 'middle', wrapText: true };

    errRowIdx++;
  });

  // Write workbook to buffer and return Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
