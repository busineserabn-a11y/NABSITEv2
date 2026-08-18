import { ThemeDefinition } from '../types';
import { RESTAURANT_TEMPLATES } from './templates/restaurant';
import { CAFE_TEMPLATES } from './templates/cafe';
import { BAKERY_TEMPLATES } from './templates/bakery';
import { FAST_FOOD_TEMPLATES } from './templates/fastFood';
import { HOTEL_TEMPLATES } from './templates/hotel';
import { RETAIL_TEMPLATES } from './templates/retail';
import { FASHION_TEMPLATES } from './templates/fashion';
import { BEAUTY_TEMPLATES } from './templates/beauty';
import { FITNESS_TEMPLATES } from './templates/fitness';
import { HEALTHCARE_TEMPLATES } from './templates/healthcare';
import { REALESTATE_TEMPLATES } from './templates/realestate';
import { CONSTRUCTION_TEMPLATES } from './templates/construction';
import { TECHNOLOGY_TEMPLATES } from './templates/technology';
import { PROFESSIONAL_TEMPLATES } from './templates/professional';
import { EDUCATION_TEMPLATES } from './templates/education';
import { AUTOMOTIVE_TEMPLATES } from './templates/automotive';
import { CREATIVE_TEMPLATES } from './templates/creative';
import { LOCAL_TEMPLATES } from './templates/local';

// Re-export individual category collections (18 templates per category)
export {
  RESTAURANT_TEMPLATES,
  CAFE_TEMPLATES,
  BAKERY_TEMPLATES,
  FAST_FOOD_TEMPLATES,
  HOTEL_TEMPLATES,
  RETAIL_TEMPLATES,
  FASHION_TEMPLATES,
  BEAUTY_TEMPLATES,
  FITNESS_TEMPLATES,
  HEALTHCARE_TEMPLATES,
  REALESTATE_TEMPLATES,
  CONSTRUCTION_TEMPLATES,
  TECHNOLOGY_TEMPLATES,
  PROFESSIONAL_TEMPLATES,
  EDUCATION_TEMPLATES,
  AUTOMOTIVE_TEMPLATES,
  CREATIVE_TEMPLATES,
  LOCAL_TEMPLATES,
};

// 18 Core Business Categories
export const BUSINESS_CATEGORIES: string[] = [
  'Restaurant',
  'Café',
  'Bakery',
  'Fast Food',
  'Hotel',
  'Retail',
  'Fashion',
  'Beauty & Salon',
  'Fitness & Gym',
  'Healthcare',
  'Real Estate',
  'Construction',
  'Technology',
  'Professional Services',
  'Education',
  'Automotive',
  'Creative / Portfolio',
  'Local Business',
];

// Map of 18 business categories to their respective 18 templates (324 total)
export const TEMPLATES_BY_CATEGORY: Record<string, ThemeDefinition[]> = {
  Restaurant: RESTAURANT_TEMPLATES,
  Café: CAFE_TEMPLATES,
  Bakery: BAKERY_TEMPLATES,
  'Fast Food': FAST_FOOD_TEMPLATES,
  Hotel: HOTEL_TEMPLATES,
  Retail: RETAIL_TEMPLATES,
  Fashion: FASHION_TEMPLATES,
  'Beauty & Salon': BEAUTY_TEMPLATES,
  'Fitness & Gym': FITNESS_TEMPLATES,
  Healthcare: HEALTHCARE_TEMPLATES,
  'Real Estate': REALESTATE_TEMPLATES,
  Construction: CONSTRUCTION_TEMPLATES,
  Technology: TECHNOLOGY_TEMPLATES,
  'Professional Services': PROFESSIONAL_TEMPLATES,
  Education: EDUCATION_TEMPLATES,
  Automotive: AUTOMOTIVE_TEMPLATES,
  'Creative / Portfolio': CREATIVE_TEMPLATES,
  'Local Business': LOCAL_TEMPLATES,
};

// Master collection of all 324 high-craft website templates across 18 business categories
export const ALL_CATEGORY_TEMPLATES: ThemeDefinition[] = [
  ...RESTAURANT_TEMPLATES,
  ...CAFE_TEMPLATES,
  ...BAKERY_TEMPLATES,
  ...FAST_FOOD_TEMPLATES,
  ...HOTEL_TEMPLATES,
  ...RETAIL_TEMPLATES,
  ...FASHION_TEMPLATES,
  ...BEAUTY_TEMPLATES,
  ...FITNESS_TEMPLATES,
  ...HEALTHCARE_TEMPLATES,
  ...REALESTATE_TEMPLATES,
  ...CONSTRUCTION_TEMPLATES,
  ...TECHNOLOGY_TEMPLATES,
  ...PROFESSIONAL_TEMPLATES,
  ...EDUCATION_TEMPLATES,
  ...AUTOMOTIVE_TEMPLATES,
  ...CREATIVE_TEMPLATES,
  ...LOCAL_TEMPLATES,
];

// Master Theme Registry for NABSITE
export const THEME_REGISTRY: ThemeDefinition[] = ALL_CATEGORY_TEMPLATES;

// Legacy alias mapping to maintain backward compatibility with previous prototype theme IDs
export const LEGACY_THEME_ALIASES: Record<string, string> = {
  theme_restaurant: 'tpl_restaurant_signature',
  theme_restaurant_classic: 'tpl_restaurant_signature',
  theme_restaurant_premium: 'tpl_restaurant_tasting',
  theme_restaurant_modern: 'tpl_restaurant_modern',
  theme_restaurant_menu_first: 'tpl_restaurant_menu_first',
  theme_culinary: 'tpl_restaurant_signature',
  theme_cafe: 'tpl_cafe_artisan',
  theme_cafe_cozy: 'tpl_cafe_artisan',
  theme_cafe_minimal: 'tpl_cafe_minimalist',
  theme_cafe_urban: 'tpl_cafe_urban_espresso',
  theme_cafe_gallery: 'tpl_cafe_pastry_lounge',
  theme_hotel: 'tpl_hotel_luxury',
  theme_hotel_luxury: 'tpl_hotel_luxury',
  theme_hotel_boutique: 'tpl_hotel_boutique',
  theme_hotel_modern: 'tpl_hotel_modern_business',
  theme_hotel_resort: 'tpl_hotel_resort_spa',
  theme_retail: 'tpl_retail_flagship',
  theme_retail_modern: 'tpl_retail_flagship',
  theme_retail_catalog: 'tpl_retail_catalog',
  theme_retail_premium: 'tpl_retail_luxury_boutique',
  theme_retail_minimal: 'tpl_retail_minimal_curated',
  theme_technology: 'tpl_tech_saas',
  theme_tech_startup: 'tpl_tech_saas',
  theme_tech_saas: 'tpl_tech_saas',
  theme_tech_corporate: 'tpl_tech_enterprise',
  theme_tech_innovation: 'tpl_tech_deeptech',
  theme_professional: 'tpl_pro_corporate',
  theme_pro_corporate: 'tpl_pro_corporate',
  theme_pro_consultant: 'tpl_pro_consulting',
  theme_pro_agency: 'tpl_pro_creative_agency',
  theme_pro_financial: 'tpl_pro_wealth_finance',
  theme_beauty: 'tpl_beauty_luxury',
  theme_beauty_luxury: 'tpl_beauty_luxury',
  theme_beauty_salon: 'tpl_beauty_salon_studio',
  theme_beauty_minimal: 'tpl_beauty_derma_clinic',
  theme_beauty_boutique: 'tpl_beauty_organic_spa',
  theme_construction: 'tpl_construction_corporate',
  theme_construction_corporate: 'tpl_construction_corporate',
  theme_construction_contractor: 'tpl_construction_contractor',
  theme_construction_engineering: 'tpl_construction_engineering',
  theme_construction_industrial: 'tpl_construction_industrial',
  theme_healthcare: 'tpl_healthcare_clinic',
  theme_healthcare_clinic: 'tpl_healthcare_clinic',
  theme_healthcare_medical_pro: 'tpl_healthcare_specialist',
  theme_healthcare_wellness: 'tpl_healthcare_wellness',
  theme_healthcare_corporate: 'tpl_healthcare_hospital',
  theme_education: 'tpl_edu_school',
  theme_education_school: 'tpl_edu_school',
  theme_education_academy: 'tpl_edu_academy',
  theme_education_training: 'tpl_edu_skills_training',
  theme_education_modern: 'tpl_edu_online_univ',
  theme_automotive: 'tpl_auto_showroom',
  theme_auto_dealer: 'tpl_auto_showroom',
  theme_auto_garage: 'tpl_auto_workshop',
  theme_auto_premium: 'tpl_auto_exotic_motors',
  theme_auto_modern: 'tpl_auto_ev_mobility',
  theme_general_corporate: 'tpl_pro_corporate',
  theme_general_business: 'tpl_pro_corporate',
  theme_general_modern: 'tpl_pro_consulting',
  theme_general_minimal: 'tpl_creative_minimal',
  theme_general_creative: 'tpl_local_community',
  theme_corporate: 'tpl_pro_corporate',
  theme_minimal: 'tpl_creative_minimal',
  theme_creative: 'tpl_creative_studio',
};

/**
 * Resolves a theme or template definition by ID with fallback and legacy resolution
 */
export function getThemeById(themeId?: string): ThemeDefinition {
  if (!themeId) return THEME_REGISTRY[0];

  // Direct ID match
  const directMatch = THEME_REGISTRY.find((t) => t.id === themeId);
  if (directMatch) return directMatch;

  // Legacy alias match
  const resolvedAlias = LEGACY_THEME_ALIASES[themeId];
  if (resolvedAlias) {
    const aliasedTheme = THEME_REGISTRY.find((t) => t.id === resolvedAlias);
    if (aliasedTheme) return aliasedTheme;
  }

  // Name or category fuzzy match
  const fuzzyMatch = THEME_REGISTRY.find(
    (t) =>
      t.id.toLowerCase().includes(themeId.toLowerCase()) ||
      t.name.toLowerCase().includes(themeId.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(themeId.toLowerCase()))
  );
  if (fuzzyMatch) return fuzzyMatch;

  return THEME_REGISTRY[0];
}

/**
 * Retrieves all 18 templates for a specific business category
 */
export function getTemplatesByCategory(categoryName: string): ThemeDefinition[] {
  if (!categoryName) return RESTAURANT_TEMPLATES;

  // Direct lookup
  if (TEMPLATES_BY_CATEGORY[categoryName]) {
    return TEMPLATES_BY_CATEGORY[categoryName];
  }

  // Normalized matching
  const normalized = categoryName.toLowerCase().trim();
  for (const [catKey, templates] of Object.entries(TEMPLATES_BY_CATEGORY)) {
    if (
      catKey.toLowerCase() === normalized ||
      catKey.toLowerCase().includes(normalized) ||
      normalized.includes(catKey.toLowerCase())
    ) {
      return templates;
    }
  }

  // Check compatibilities
  const matching = THEME_REGISTRY.filter((t) => {
    return (
      (t.category && t.category.toLowerCase().includes(normalized)) ||
      t.categoryCompatibilities?.some((c) => c.toLowerCase().includes(normalized))
    );
  });

  return matching.length > 0 ? matching : RESTAURANT_TEMPLATES;
}
