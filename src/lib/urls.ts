/**
 * NABSITE Canonical URL Management
 * Official Platform Base URL: https://nabsite-abn.vercel.app/
 */

export const CANONICAL_BASE_URL = 'https://nabsite-abn.vercel.app';
export const DISPLAY_DOMAIN = 'nabsite-abn.vercel.app';

/**
 * Builds a canonical public URL for any company and sub-page.
 *
 * Examples:
 * - buildPublicUrl() => 'https://nabsite-abn.vercel.app'
 * - buildPublicUrl('lucy-roastery') => 'https://nabsite-abn.vercel.app/c/lucy-roastery'
 * - buildPublicUrl('lucy-roastery', 'menu') => 'https://nabsite-abn.vercel.app/c/lucy-roastery/menu'
 * - buildPublicUrl('lucy-roastery', 'about') => 'https://nabsite-abn.vercel.app/c/lucy-roastery/about'
 * - buildPublicUrl('lucy-roastery', 'contact') => 'https://nabsite-abn.vercel.app/c/lucy-roastery/contact'
 * - buildPublicUrl('lucy-roastery', 'qr') => 'https://nabsite-abn.vercel.app/c/lucy-roastery/qr'
 */
export function buildPublicUrl(
  companySlug?: string,
  pageSlug?: string,
  subpath?: string
): string {
  if (!companySlug) {
    return CANONICAL_BASE_URL;
  }

  const cleanSlug = companySlug.trim().replace(/^\/+|\/+$/g, '');
  let url = `${CANONICAL_BASE_URL}/c/${cleanSlug}`;

  if (pageSlug && pageSlug !== 'home' && pageSlug !== '/') {
    const cleanPage = pageSlug.trim().replace(/^\/+|\/+$/g, '');
    url += `/${cleanPage}`;
  }

  if (subpath) {
    const cleanSub = subpath.trim().replace(/^\/+|\/+$/g, '');
    url += `/${cleanSub}`;
  }

  return url;
}

/**
 * Builds the canonical digital menu URL for a company.
 */
export function buildMenuUrl(companySlug: string): string {
  return buildPublicUrl(companySlug, 'menu');
}

/**
 * Builds the canonical QR destination URL based on target type.
 */
export function buildQrDestinationUrl(
  companySlug: string,
  targetType: string = 'website',
  pageSlug?: string,
  customUrl?: string
): string {
  if (customUrl && customUrl.startsWith('http')) {
    return customUrl;
  }

  switch (targetType) {
    case 'menu':
    case 'store':
      return buildPublicUrl(companySlug, 'menu');
    case 'offer':
      return buildPublicUrl(companySlug, 'offers');
    case 'contact':
      return buildPublicUrl(companySlug, 'contact');
    case 'custom_page':
      return buildPublicUrl(companySlug, pageSlug || 'custom');
    case 'website':
    default:
      return buildPublicUrl(companySlug);
  }
}

/**
 * Formats a short display URL for badges and cards.
 * E.g. nabsite-abn.vercel.app/c/lucy-roastery
 */
export function formatDisplayUrl(companySlug?: string, pageSlug?: string): string {
  if (!companySlug) return DISPLAY_DOMAIN;
  if (!pageSlug || pageSlug === 'home') return `${DISPLAY_DOMAIN}/c/${companySlug}`;
  return `${DISPLAY_DOMAIN}/c/${companySlug}/${pageSlug}`;
}
