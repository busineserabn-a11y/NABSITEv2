import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Send,
  Mail,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  QrCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Tag,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  Globe,
  Info,
  Award,
  Users,
  Grid,
  Check,
  Percent,
  Menu as MenuIcon,
  X,
  Search,
  Building2,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import {
  Company,
  Website,
  WebsiteConfig,
  Product,
  ProductCategory,
  Review,
  Offer,
  Announcement,
  ThemeDefinition,
  PageConfig,
  SectionConfig,
} from '../../types';
import { THEME_REGISTRY } from '../../data/themes';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { CompanyName } from '../ui/CompanyName';
import { MenuItemDetailModal } from './MenuItemDetailModal';
import { DigitalMenuRenderer } from './DigitalMenuRenderer';

export interface WebsiteRendererProps {
  company: Company;
  website?: Website | null;
  config: WebsiteConfig;
  themeId?: string;
  products?: Product[];
  productCategories?: ProductCategory[];
  reviews?: Review[];
  offers?: Offer[];
  announcements?: Announcement[];
  activePageSlug?: string;
  onNavigatePage?: (slug: string) => void;
  isStudioEditor?: boolean;
  activeSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  showVerificationBanner?: boolean;
}

export const WebsiteRenderer: React.FC<WebsiteRendererProps> = ({
  company,
  website,
  config,
  themeId,
  products = [],
  productCategories = [],
  reviews = [],
  offers = [],
  announcements = [],
  activePageSlug = 'home',
  onNavigatePage,
  isStudioEditor = false,
  activeSectionId = null,
  onSelectSection,
  showVerificationBanner = true,
}) => {
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, text: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [selectedDetailItem, setSelectedDetailItem] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const activeThemeId = themeId || website?.themeId || 'theme_corporate';
  const theme = THEME_REGISTRY.find((t) => t.id === activeThemeId) || THEME_REGISTRY[0];

  const design = config?.design || {
    primaryColor: theme.defaultPalette.primary,
    secondaryColor: theme.defaultPalette.secondary,
    accentColor: theme.defaultPalette.accent,
    bgColor: theme.defaultPalette.bg,
    surfaceColor: theme.defaultPalette.surface,
    textColor: theme.defaultPalette.text,
    mutedTextColor: theme.defaultPalette.muted,
    headingFont: theme.typography.headingFont,
    bodyFont: theme.typography.bodyFont,
  };

  const pages = config?.pages || [
    { id: 'page_home', name: 'Home', slug: 'home', title: 'Home', isHome: true, isPublished: true, isHidden: false, order: 1, sections: [] },
  ];

  const activePage = pages.find((p) => p.slug === activePageSlug) || pages.find((p) => p.isHome) || pages[0];

  // Helper for Open/Closed status
  const isCurrentlyOpen = (): boolean => {
    if (!company.hours || company.hours.length === 0) return true;
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = company.hours.find((h) => h.day === days[now.getDay()]);
    if (!today || !today.isOpen) return false;

    try {
      const [oh, om] = (today.openTime || '08:00').split(':').map(Number);
      const [ch, cm] = (today.closeTime || '20:00').split(':').map(Number);
      const currentM = now.getHours() * 60 + now.getMinutes();
      return currentM >= oh * 60 + om && currentM <= ch * 60 + cm;
    } catch {
      return true;
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.text) return;
    try {
      await api.submitReview({
        companyId: company.id,
        name: reviewForm.name,
        rating: reviewForm.rating,
        text: reviewForm.text,
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSubmitted(false);
        setReviewForm({ name: '', rating: 5, text: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedProductCategory === 'all' || p.categoryId === selectedProductCategory;
    const matchesSearch = !productSearchQuery.trim() || 
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(productSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handlePageClick = (slug: string) => {
    if (onNavigatePage) {
      onNavigatePage(slug);
    }
  };

  // Section wrapper for Studio selection highlight
  const renderSectionContainer = (
    sectionId: string,
    content: React.ReactNode,
    className = ''
  ) => {
    const isSelected = isStudioEditor && activeSectionId === sectionId;
    return (
      <div
        key={sectionId}
        id={`section-${sectionId}`}
        onClick={(e) => {
          if (isStudioEditor && onSelectSection) {
            e.stopPropagation();
            onSelectSection(sectionId);
          }
        }}
        className={`relative transition-all ${
          isStudioEditor ? 'cursor-pointer hover:ring-2 hover:ring-amber-400/50' : ''
        } ${isSelected ? 'ring-2 ring-amber-500 shadow-md' : ''} ${className}`}
      >
        {isStudioEditor && isSelected && (
          <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-sm">
            Active: {sectionId}
          </div>
        )}
        {content}
      </div>
    );
  };

  // -------------------------------------------------------------
  // HERO STYLES VARIATIONS (Based on 24 Themes Archetypes)
  // -------------------------------------------------------------
  const renderHeroSection = () => {
    const isSplit = theme.heroStyle === 'split' || theme.id.includes('corporate') || theme.id.includes('restaurant') || theme.id.includes('hotel') || theme.id.includes('real_estate');
    const isTech = theme.heroStyle === 'centered' && (theme.id.includes('tech') || theme.id.includes('dark'));
    const isMinimal = theme.id.includes('minimal') || theme.id.includes('portfolio') || theme.id.includes('creative');
    const isLuxury = theme.id.includes('luxury') || theme.id.includes('fashion') || theme.id.includes('beauty');

    return (
      <section
        className={`relative overflow-hidden ${
          isTech
            ? 'bg-slate-950 text-white py-20 sm:py-32 border-b border-slate-800'
            : isLuxury
            ? 'bg-stone-950 text-amber-100 py-20 sm:py-28'
            : isMinimal
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-16 sm:py-24 border-b border-slate-100 dark:border-slate-800'
            : 'bg-slate-900 text-white py-16 sm:py-24'
        }`}
        style={{
          backgroundColor: isMinimal ? undefined : design.secondaryColor || '#0F172A',
        }}
      >
        {company.coverImage && !isMinimal && (
          <div className="absolute inset-0 z-0">
            <img
              src={company.coverImage}
              alt={company.name}
              className="w-full h-full object-cover opacity-25 blur-2xs scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {isSplit ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{theme.name} Edition • Managed Digital Hub</span>
                </div>

                <div className="space-y-4">
                  <h2
                    className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
                    style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
                  >
                    {company.shortDescription || `Welcome to ${company.name}`}
                  </h2>
                  {company.fullDescription && (
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                      {company.fullDescription}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{avgRating}</span>
                    <span className="text-slate-300">({reviews.length} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                    <span>{company.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span>{isCurrentlyOpen() ? 'Open Today' : 'Closed Now'}</span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      onClick={() => api.recordEvent({ companyId: company.id, eventType: 'CALL_CLICK', path: `/c/${company.slug}` })}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-950 transition-transform active:scale-95 shadow-md"
                      style={{ backgroundColor: design.accentColor || '#F59E0B' }}
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call {company.phone}</span>
                    </a>
                  )}
                  {company.telegramUsername && (
                    <a
                      href={`https://t.me/${company.telegramUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}` })}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-white transition-opacity hover:opacity-90 shadow-md"
                      style={{ backgroundColor: '#229ED9' }}
                    >
                      <Send className="w-4 h-4" />
                      <span>Message on Telegram</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Split Hero Image Showcase */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-4/3 lg:aspect-square">
                  <img
                    src={
                      company.coverImage ||
                      company.logo ||
                      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'
                    }
                    alt={company.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                    <div className="text-white">
                      <p className="text-xs uppercase tracking-wider font-bold text-amber-400">{company.category}</p>
                      <p className="text-lg font-bold">{company.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Centered Hero Layout */
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{theme.name} Edition • {company.category}</span>
              </div>

              <h2
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
                style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
              >
                {company.shortDescription || `Welcome to ${company.name}`}
              </h2>

              {company.fullDescription && (
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {company.fullDescription}
                </p>
              )}

              {/* Centered Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold">{avgRating}</span>
                  <span className="text-slate-300">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" />
                  <span>{company.address}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span>{isCurrentlyOpen() ? 'Open Today' : 'Closed'}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    onClick={() => api.recordEvent({ companyId: company.id, eventType: 'CALL_CLICK', path: `/c/${company.slug}` })}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-slate-950 shadow-md"
                    style={{ backgroundColor: design.accentColor || '#F59E0B' }}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                )}
                {company.telegramUsername && (
                  <a
                    href={`https://t.me/${company.telegramUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}` })}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md"
                    style={{ backgroundColor: '#229ED9' }}
                  >
                    <Send className="w-4 h-4" />
                    <span>Open Telegram</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // PROMOS & ANNOUNCEMENTS BANNER
  // -------------------------------------------------------------
  const renderPromosBanner = () => {
    if (offers.length === 0 && announcements.length === 0) return null;
    return (
      <section className="bg-amber-500/10 border-y border-amber-500/20 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              {offers.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    SPECIAL OFFER: {offers[0].title}
                  </span>
                  {offers[0].discountText && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                      {offers[0].discountText}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  LATEST NEWS: {announcements[0]?.title}
                </span>
              )}
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
                {offers[0]?.description || announcements[0]?.content || 'Exclusive customer update.'}
              </p>
            </div>
          </div>
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shrink-0"
            >
              Claim Special
            </a>
          )}
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // STORE / DIGITAL MENU CATALOG SECTION
  // -------------------------------------------------------------
  const renderProductsSection = () => {
    if (products.length === 0) return null;
    const isMenuMode = activePageSlug === 'menu' || company.category?.toLowerCase().includes('restaurant') || company.category?.toLowerCase().includes('cafe') || company.category?.toLowerCase().includes('dining');

    return (
      <section id="store" className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {isMenuMode ? 'Digital Menu & Kitchen' : 'Verified Store Offerings'}
              </span>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1"
                style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
              >
                {isMenuMode ? 'Fresh Digital Menu' : 'Product Catalog'}
              </h3>
            </div>

            {/* Quick Search Bar */}
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isMenuMode ? 'Search dishes, drinks...' : 'Search items...'}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {productSearchQuery && (
                <button
                  onClick={() => setProductSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          {productCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedProductCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap border ${
                  selectedProductCategory === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                }`}
              >
                All Items ({products.length})
              </button>
              {productCategories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedProductCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap border ${
                      selectedProductCategory === cat.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <Utensils className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No items match your search</p>
            <p className="text-xs text-slate-500">Try clearing your search query or selecting another category.</p>
            <Button size="sm" variant="outline" onClick={() => { setProductSearchQuery(''); setSelectedProductCategory('all'); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedDetailItem(product);
                  setDetailModalOpen(true);
                }}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-[0.99]"
              >
                <div>
                  {product.image && (
                    <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-900">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {product.featured && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                          ★ Chef&apos;s Favorite
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-amber-300 font-bold text-[10px] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        Tap for Details
                      </span>
                    </div>
                  )}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h4>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                        {product.price.toLocaleString()} {product.currency || 'ETB'}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0" onClick={(e) => e.stopPropagation()}>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Fresh & Available
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailItem(product);
                          setDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors"
                      >
                        Preview
                      </button>
                      {company.telegramUsername && (
                        <a
                          href={`https://t.me/${company.telegramUsername}?text=${encodeURIComponent(`Hi, I'd like to order: ${product.name}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}#${product.id}` })}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Order</span>
                        </a>
                      )}
                      {company.phone && (
                        <a
                          href={`tel:${company.phone}`}
                          onClick={() => api.recordEvent({ companyId: company.id, eventType: 'PRODUCT_VIEW', path: `/c/${company.slug}#${product.id}` })}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  // -------------------------------------------------------------
  // REVIEWS & SOCIAL PROOF SECTION
  // -------------------------------------------------------------
  const renderReviewsSection = () => {
    return (
      <section id="reviews" className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Customer Testimonials
              </span>
              <h3
                className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1"
                style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
              >
                Verified Guest Feedback
              </h3>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={Star}
              onClick={() => setReviewModalOpen(true)}
              style={{ backgroundColor: design.accentColor || '#F59E0B' }}
              className="text-slate-950"
            >
              Leave a Review
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{rev.text}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{rev.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Be the first to leave a review!</p>
                <p className="text-[11px] text-slate-400">Your feedback helps us continuously deliver premier service.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // SCHEDULE & LOCATION SECTION
  // -------------------------------------------------------------
  const renderScheduleLocationSection = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayName = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

    return (
      <section id="hours" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Operating Hours Table */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
                  >
                    Business Schedule
                  </h3>
                  <p className="text-xs text-slate-500">Official opening times</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  isCurrentlyOpen()
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isCurrentlyOpen() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isCurrentlyOpen() ? 'Open Right Now' : 'Closed Today'}
              </span>
            </div>

            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-700/50">
              {company.hours && company.hours.length > 0 ? (
                company.hours.map((h) => {
                  const isToday = h.day.toLowerCase() === currentDayName.toLowerCase();
                  return (
                    <div
                      key={h.day}
                      className={`pt-2.5 flex items-center justify-between text-xs ${
                        isToday ? 'font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {h.day}
                        {isToday && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold">Today</span>}
                      </span>
                      <span>
                        {h.isOpen ? `${h.openTime} – ${h.closeTime}` : 'Closed'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Open Daily: 08:00 AM – 10:00 PM
                </div>
              )}
            </div>
          </div>

          {/* Location & Map Address */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold text-slate-900 dark:text-white"
                    style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
                  >
                    Location & Directions
                  </h3>
                  <p className="text-xs text-slate-500">Visit our physical premises</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building2Icon className="w-4 h-4 text-slate-400" />
                  {company.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {company.address}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {company.mapLink ? (
                <a
                  href={company.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => api.recordEvent({ companyId: company.id, eventType: 'MAP_CLICK', path: `/c/${company.slug}` })}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open in Google Maps / Navigation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(company.name + ' ' + company.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => api.recordEvent({ companyId: company.id, eventType: 'MAP_CLICK', path: `/c/${company.slug}` })}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Find on Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <Link
                to={`/c/${company.slug}/qr`}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>View Printable QR Table Stand</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // FAQ ACCORDION SECTION
  // -------------------------------------------------------------
  const renderFaqSection = () => {
    const faqs = [
      { q: `What are ${company.name}'s prime specialties?`, a: company.shortDescription || `We deliver exceptional ${company.category} services crafted with authentic quality.` },
      { q: `How do I place an order or make a reservation?`, a: `You can reach out directly via our phone line (${company.phone || 'listed above'}) or message us instantly on Telegram (@${company.telegramUsername || 'channel'}).` },
      { q: `Where are you located?`, a: `We are conveniently located at ${company.address}. Click the location button above for navigation.` },
    ];

    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Frequently Asked Questions
            </span>
            <h3
              className="text-2xl font-extrabold tracking-tight"
              style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
            >
              Everything You Need to Know
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = !!faqExpanded[idx];
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setFaqExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // CUSTOM HTML SANDBOX SECTION
  // -------------------------------------------------------------
  const renderCustomHtmlSection = () => {
    const custom = config?.customHtml;
    if (!custom || !custom.html) return null;

    const sandboxDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            ${custom.css || ''}
          </style>
        </head>
        <body>
          ${custom.html}
          <script>
            try {
              ${custom.js || ''}
            } catch(e) {
              console.error("Custom script error:", e);
            }
          </script>
        </body>
      </html>
    `;

    return (
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <iframe
            srcDoc={sandboxDoc}
            title="Custom HTML Content"
            sandbox="allow-scripts"
            className="w-full min-h-[300px] border-0"
          />
        </div>
      </section>
    );
  };

  // -------------------------------------------------------------
  // CONTACT & DIRECT CHANNELS SECTION
  // -------------------------------------------------------------
  const renderContactSection = () => {
    return (
      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Direct Communications
          </span>
          <h3
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
          >
            Get in Touch with {company.name}
          </h3>
          <p className="text-xs text-slate-500">We respond promptly across all verified channels.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              onClick={() => api.recordEvent({ companyId: company.id, eventType: 'CALL_CLICK', path: `/c/${company.slug}` })}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all text-center space-y-3 shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Hotline</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{company.phone}</p>
              </div>
            </a>
          )}

          {company.telegramUsername && (
            <a
              href={`https://t.me/${company.telegramUsername}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}` })}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition-all text-center space-y-3 shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telegram Channel</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">@{company.telegramUsername}</p>
              </div>
            </a>
          )}

          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all text-center space-y-3 shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Email</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{company.email}</p>
              </div>
            </a>
          )}
        </div>
      </section>
    );
  };

  // Helper mini building icon
  function Building2Icon(props: any) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }

  // -------------------------------------------------------------
  // RENDER SECTIONS ACCORDING TO ACTIVE PAGE
  // -------------------------------------------------------------
  const isPageMenu = activePageSlug === 'menu';
  const isPageStore = activePageSlug === 'store' || activePageSlug === 'products';
  const isPageContact = activePageSlug === 'contact';
  const isPageReviews = activePageSlug === 'reviews';
  const isPageOffers = activePageSlug === 'offers' || activePageSlug === 'announcements';
  const isPageAbout = activePageSlug === 'about';

  return (
    <div
      className="min-h-screen text-slate-900 antialiased selection:bg-slate-900 selection:text-white pb-20 md:pb-0"
      style={{
        backgroundColor: design.bgColor || '#FAFAF9',
        color: design.textColor || '#1C1917',
        fontFamily: `"${design.bodyFont || 'Plus Jakarta Sans'}", sans-serif`,
      }}
    >
      {/* Platform Verification Top Banner */}
      {showVerificationBanner && (
        <div className="bg-slate-950 text-white text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified NABSITE
              </span>
              <span className="hidden sm:inline text-slate-400 text-xs">
                Official digital storefront for {company.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/c/${company.slug}/qr`}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Stand</span>
              </Link>
              <Link to="/" className="text-slate-400 hover:text-white text-xs hidden sm:inline">
                Platform Directory
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1. BRAND HEADER & MULTI-PAGE NAVIGATION */}
      {renderSectionContainer(
        'header',
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={company.logo}
                alt={company.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs cursor-pointer"
                onClick={() => handlePageClick('home')}
                referrerPolicy="no-referrer"
              />
              <div className="cursor-pointer" onClick={() => handlePageClick('home')}>
                <h1
                  className="text-lg sm:text-xl font-extrabold tracking-tight"
                  style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
                >
                  {company.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{company.category}</span>
                  <span>•</span>
                  <span className={`font-semibold flex items-center gap-1 ${isCurrentlyOpen() ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyOpen() ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {isCurrentlyOpen() ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => handlePageClick('home')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activePageSlug === 'home' || !activePageSlug ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Home
              </button>

              {products.length > 0 && (
                <button
                  onClick={() => handlePageClick('menu')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activePageSlug === 'menu' || activePageSlug === 'store' || activePageSlug === 'products' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Digital Menu / Store
                </button>
              )}

              {reviews.length > 0 && (
                <button
                  onClick={() => handlePageClick('reviews')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activePageSlug === 'reviews' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Reviews ({reviews.length})
                </button>
              )}

              {(offers.length > 0 || announcements.length > 0) && (
                <button
                  onClick={() => handlePageClick('offers')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    activePageSlug === 'offers' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Offers & News
                </button>
              )}

              <button
                onClick={() => handlePageClick('contact')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activePageSlug === 'contact' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Contact & Location
              </button>
            </nav>

            {/* Quick Action CTAs & Mobile Hamburger */}
            <div className="flex items-center gap-2">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  onClick={() => api.recordEvent({ companyId: company.id, eventType: 'CALL_CLICK', path: `/c/${company.slug}` })}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
              )}
              {company.telegramUsername && (
                <a
                  href={`https://t.me/${company.telegramUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}` })}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#229ED9' }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
              )}

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
              <button
                onClick={() => { handlePageClick('home'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                  activePageSlug === 'home' || !activePageSlug ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>🏠 Home</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {products.length > 0 && (
                <button
                  onClick={() => { handlePageClick('menu'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                    activePageSlug === 'menu' || activePageSlug === 'store' || activePageSlug === 'products' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>🍽️ Digital Menu & Store ({products.length})</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              )}

              {reviews.length > 0 && (
                <button
                  onClick={() => { handlePageClick('reviews'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                    activePageSlug === 'reviews' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>⭐ Verified Reviews ({reviews.length})</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              )}

              {(offers.length > 0 || announcements.length > 0) && (
                <button
                  onClick={() => { handlePageClick('offers'); setMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                    activePageSlug === 'offers' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>🏷️ Offers & News</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              )}

              <button
                onClick={() => { handlePageClick('contact'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                  activePageSlug === 'contact' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>📍 Contact & Location</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <Link
                to={`/c/${company.slug}/qr`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Digital QR Stand</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            </div>
          )}
        </header>
      )}

      {/* RENDER BODY ACCORDING TO ACTIVE PAGE */}
      {isPageMenu || isPageStore ? (
        <div className="space-y-12">
          {renderSectionContainer('store', renderProductsSection())}
          {renderSectionContainer('contact', renderContactSection())}
        </div>
      ) : isPageReviews ? (
        <div className="space-y-12">
          {renderSectionContainer('reviews', renderReviewsSection())}
          {renderSectionContainer('contact', renderContactSection())}
        </div>
      ) : isPageOffers ? (
        <div className="space-y-12">
          {renderSectionContainer('promos', renderPromosBanner())}
          {renderSectionContainer('store', renderProductsSection())}
          {renderSectionContainer('contact', renderContactSection())}
        </div>
      ) : isPageContact ? (
        <div className="space-y-12">
          {renderSectionContainer('contact', renderContactSection())}
          {renderSectionContainer('hours', renderScheduleLocationSection())}
        </div>
      ) : (
        /* Default Full Home Page */
        <main className="space-y-12">
          {renderSectionContainer('hero', renderHeroSection())}
          {renderSectionContainer('promos', renderPromosBanner())}
          {renderSectionContainer('store', renderProductsSection())}
          {renderSectionContainer('hours', renderScheduleLocationSection())}
          {renderSectionContainer('reviews', renderReviewsSection())}
          {renderSectionContainer('faq', renderFaqSection())}
          {renderSectionContainer('custom_html', renderCustomHtmlSection())}
          {renderSectionContainer('contact', renderContactSection())}
        </main>
      )}

      {/* FOOTER SECTION */}
      {renderSectionContainer(
        'footer',
        <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 border-t border-slate-800 mt-16">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={company.logo}
                alt={company.name}
                className="w-8 h-8 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-bold text-white">{company.name}</p>
                <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} All Rights Reserved.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <button onClick={() => handlePageClick('home')} className="hover:text-white transition-colors">
                Home
              </button>
              {products.length > 0 && (
                <button onClick={() => handlePageClick('menu')} className="hover:text-white transition-colors">
                  Digital Menu / Catalog
                </button>
              )}
              <button onClick={() => handlePageClick('reviews')} className="hover:text-white transition-colors">
                Reviews
              </button>
              <button onClick={() => handlePageClick('contact')} className="hover:text-white transition-colors">
                Contact & Location
              </button>
              <Link to={`/c/${company.slug}/qr`} className="hover:text-white transition-colors">
                QR Stand
              </Link>
            </div>

            <div className="text-center sm:text-right text-[11px] text-slate-500 space-y-0.5">
              <p>
                Verified Digital Presence on <span className="font-bold text-amber-400">NABSITE</span>
              </p>
              <p className="text-[10px]">Managed Digital Identity Engine</p>
            </div>
          </div>
        </footer>
      )}

      {/* STICKY MOBILE BOTTOM ACTION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md px-3 py-2 flex items-center justify-around gap-2 shadow-2xl">
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            onClick={() => api.recordEvent({ companyId: company.id, eventType: 'CALL_CLICK', path: `/c/${company.slug}` })}
            className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Now</span>
          </a>
        )}
        {company.telegramUsername && (
          <a
            href={`https://t.me/${company.telegramUsername}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => api.recordEvent({ companyId: company.id, eventType: 'TELEGRAM_CLICK', path: `/c/${company.slug}` })}
            className="flex-1 py-2 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
            style={{ backgroundColor: '#229ED9' }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </a>
        )}
        {products.length > 0 && (
          <button
            onClick={() => handlePageClick('menu')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center"
            title="Digital Menu"
          >
            <Utensils className="w-4 h-4" />
          </button>
        )}
        <Link
          to={`/c/${company.slug}/qr`}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center"
          title="QR Stand"
        >
          <QrCode className="w-4 h-4" />
        </Link>
      </div>

      {/* Review Submission Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Leave a Review for ${company.name}`}
        description="Your authentic rating helps other customers discover high-quality local businesses."
      >
        {reviewSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Review Submitted!</h4>
            <p className="text-xs text-slate-500">
              Thank you for your feedback! Your review has been entered into the verification moderation queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <Input
              label="Your Full Name *"
              required
              placeholder="e.g. Samuel Bekele"
              value={reviewForm.name}
              onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Star Rating *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Review Comments *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience with the service, atmosphere, or products..."
                value={reviewForm.text}
                onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              Submit Customer Review
            </Button>
          </form>
        )}
      </Modal>
      {/* Digital Menu Item Detail Modal */}
      <MenuItemDetailModal
        item={selectedDetailItem}
        categoryName={productCategories.find((c) => c.id === selectedDetailItem?.categoryId)?.name}
        company={company}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailItem(null);
        }}
      />
    </div>
  );
};
