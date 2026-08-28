import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
  ArrowRight,
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Utensils,
  Store,
  ChevronRight,
} from 'lucide-react';
import {
  ThemeDefinition,
  Company,
  Website,
  WebsiteConfig,
  Product,
  ProductCategory,
  Review,
  Offer,
  Announcement,
} from '../../types';
import { THEME_REGISTRY, BUSINESS_CATEGORIES, TEMPLATES_BY_CATEGORY } from '../../data/themes';
import { generateWebsiteConfigForCategory, getCategoryDesignProfile } from '../../data/categoryProfiles';
import { WebsiteRenderer } from '../website/WebsiteRenderer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TemplateSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  company: Company;
  website: Website | null;
  config: WebsiteConfig;
  products?: Product[];
  productCategories?: ProductCategory[];
  reviews?: Review[];
  offers?: Offer[];
  announcements?: Announcement[];
  onApplyTemplate: (newThemeId: string, newConfigUpdates?: WebsiteConfig) => void;
}

export const TemplateSwitcherModal: React.FC<TemplateSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  company,
  website,
  config,
  products = [],
  productCategories = [],
  reviews = [],
  offers = [],
  announcements = [],
  onApplyTemplate,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentThemeId);
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'compare'>('recommended');
  const [selectedCategory, setSelectedCategory] = useState<string>(company.category || 'all');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewViewport, setPreviewViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [applyCategoryArchitecture, setApplyCategoryArchitecture] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const currentTheme =
    THEME_REGISTRY.find((t) => t.id === currentThemeId) || THEME_REGISTRY[0];
  const selectedTheme =
    THEME_REGISTRY.find((t) => t.id === selectedThemeId) || currentTheme;

  // Recommended templates for company category
  const companyCat = company.category || 'Restaurant';
  const categoryTemplates =
    TEMPLATES_BY_CATEGORY[companyCat] ||
    THEME_REGISTRY.filter((t) =>
      t.categoryCompatibilities?.some(
        (c) => c.toLowerCase() === companyCat.toLowerCase()
      )
    );
  const recommendedTemplates = categoryTemplates.slice(0, 8);

  // All templates filtered
  const filteredTemplates = THEME_REGISTRY.filter((t) => {
    // Category match
    const matchesCat =
      selectedCategory === 'all' ||
      (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase()) ||
      t.categoryCompatibilities?.some(
        (c) => c.toLowerCase() === selectedCategory.toLowerCase()
      );

    // Style filter match
    let matchesStyle = true;
    if (selectedFilter === 'mobile') {
      matchesStyle =
        t.id.includes('digital_menu') ||
        t.id.includes('mobile') ||
        t.mobileNavStyle === 'bottom_bar' ||
        t.layoutArchetype === 'mobile_first';
    } else if (selectedFilter === 'menu') {
      matchesStyle =
        t.layoutArchetype === 'menu_first' ||
        t.id.includes('menu') ||
        t.categoryCompatibilities.includes('Restaurant') ||
        t.categoryCompatibilities.includes('Café');
    } else if (selectedFilter === 'store') {
      matchesStyle =
        t.layoutArchetype === 'store_front' ||
        t.id.includes('store') ||
        t.id.includes('retail') ||
        t.categoryCompatibilities.includes('Retail');
    } else if (selectedFilter === 'minimal') {
      matchesStyle =
        t.personality === 'minimal' ||
        t.id.includes('minimal') ||
        t.cardStyle === 'clean_border';
    } else if (selectedFilter === 'luxury') {
      matchesStyle =
        t.personality === 'luxury' ||
        t.id.includes('luxury') ||
        t.previewColor === '#D97706';
    } else if (selectedFilter === 'dark') {
      matchesStyle =
        t.defaultPalette.bg === '#09090B' ||
        t.defaultPalette.bg === '#020617' ||
        t.id.includes('dark');
    }

    // Search query match
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.recommendedUse && t.recommendedUse.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesStyle && matchesSearch;
  });

  const handleConfirmApply = () => {
    setIsApplying(true);
    try {
      let updatedConfig: WebsiteConfig;

      if (applyCategoryArchitecture) {
        // Regenerate complete category-tailored pages, bespoke sections, and design profile
        const targetCategory = selectedTheme.category || company.category || 'Restaurant';
        updatedConfig = generateWebsiteConfigForCategory(company, targetCategory, selectedTheme.id);
      } else {
        // Build updated config with new theme design palette & fonts while preserving all content
        const newPalette = selectedTheme.defaultPalette;
        const newTypography = selectedTheme.typography;

        updatedConfig = {
          ...config,
          design: {
            ...config.design,
            primaryColor: newPalette.primary,
            secondaryColor: newPalette.secondary,
            accentColor: newPalette.accent,
            bgColor: newPalette.bg,
            surfaceColor: newPalette.surface,
            textColor: newPalette.text,
            mutedTextColor: newPalette.muted,
            headingFont: newTypography.headingFont,
            bodyFont: newTypography.bodyFont,
          },
        };
      }

      onApplyTemplate(selectedTheme.id, updatedConfig);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900/90 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Change Website Template</h2>
                <Badge variant="gold" size="sm">
                  324 Layout Systems
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Switch layout architecture without losing company products, menu items, reviews, or info.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation & Filters Bar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('recommended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'recommended'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended for {companyCat}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All 324 Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Live Comparison Preview</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'compare' && (
            <div className="w-full sm:w-64">
              <Input
                icon={Search}
                placeholder="Search templates, styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border-slate-700 text-xs py-1.5"
              />
            </div>
          )}
        </div>

        {/* Secondary Category & Style Filter Badges (For 'All' tab) */}
        {activeTab === 'all' && (
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 space-y-2 shrink-0">
            {/* Industry Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0 mr-1">
                Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                All ({THEME_REGISTRY.length})
              </button>
              {BUSINESS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Layout Style Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0 mr-1">
                Style:
              </span>
              {[
                { id: 'all', label: 'All Styles' },
                { id: 'mobile', label: '📱 Mobile-First' },
                { id: 'menu', label: '🍽️ Menu-First' },
                { id: 'store', label: '🛍️ Store-First' },
                { id: 'minimal', label: '✨ Minimal' },
                { id: 'luxury', label: '👑 Luxury' },
                { id: 'dark', label: '🌑 Dark Dining' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedFilter(style.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-all ${
                    selectedFilter === style.id
                      ? 'bg-slate-700 text-amber-300 font-bold border border-amber-400/40'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'compare' ? (
            /* SIDE-BY-SIDE / FULL COMPARISON PREVIEW */
            <div className="space-y-4">
              {/* Viewport & Notice Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="text-xs">
                    <span className="text-slate-400">Comparing: </span>
                    <span className="font-bold text-white">{currentTheme.name}</span>
                    <span className="text-slate-500 mx-1.5">→</span>
                    <span className="font-extrabold text-amber-400">{selectedTheme.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      previewViewport === 'mobile'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      previewViewport === 'tablet'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      previewViewport === 'desktop'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                </div>
              </div>

              {/* Preview Stage */}
              <div className="flex justify-center bg-slate-950/80 p-4 rounded-3xl border border-slate-800 min-h-[480px]">
                <div
                  className={`bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                    previewViewport === 'mobile'
                      ? 'w-[375px] max-w-full'
                      : previewViewport === 'tablet'
                      ? 'w-[768px] max-w-full'
                      : 'w-full'
                  }`}
                  style={{ minHeight: '500px' }}
                >
                  <WebsiteRenderer
                    company={company}
                    website={website}
                    themeId={selectedTheme.id}
                    config={{
                      ...config,
                      design: {
                        ...config.design,
                        primaryColor: selectedTheme.defaultPalette.primary,
                        secondaryColor: selectedTheme.defaultPalette.secondary,
                        accentColor: selectedTheme.defaultPalette.accent,
                        bgColor: selectedTheme.defaultPalette.bg,
                        surfaceColor: selectedTheme.defaultPalette.surface,
                        textColor: selectedTheme.defaultPalette.text,
                        mutedTextColor: selectedTheme.defaultPalette.muted,
                        headingFont: selectedTheme.typography.headingFont,
                        bodyFont: selectedTheme.typography.bodyFont,
                      },
                    }}
                    products={products}
                    productCategories={productCategories}
                    reviews={reviews}
                    offers={offers}
                    announcements={announcements}
                    activePageSlug="home"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* TEMPLATE GRID VIEW */
            <div className="space-y-6">
              {/* CURRENT TEMPLATE BADGE SUMMARY */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white border border-slate-700 shrink-0"
                    style={{ backgroundColor: currentTheme.defaultPalette.primary }}
                  >
                    Active
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Current Template:
                      </span>
                      <Badge variant="active" size="sm">
                        {currentTheme.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentTheme.description}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ✓ Content Protected
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Switching templates preserves all items
                  </p>
                </div>
              </div>

              {/* TEMPLATES CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(activeTab === 'recommended' ? recommendedTemplates : filteredTemplates).map(
                  (theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    const isCurrent = currentThemeId === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`group relative rounded-2xl bg-slate-900/90 border transition-all cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-xl ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-amber-500/10'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Theme Palette Strip */}
                        <div className="h-14 flex items-stretch border-b border-slate-800 relative">
                          <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.primary }} />
                          <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.secondary }} />
                          <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.accent }} />
                          <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.surface }} />
                          <div className="flex-1" style={{ backgroundColor: theme.defaultPalette.bg }} />

                          {isCurrent && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-black bg-slate-950/90 text-emerald-400 border border-emerald-500/40">
                              ACTIVE NOW
                            </div>
                          )}

                          {theme.badge && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500 text-slate-950">
                              {theme.badge}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors truncate">
                              {theme.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {theme.category || theme.categoryCompatibilities?.[0]}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2">
                            {theme.description}
                          </p>

                          {/* Architecture Features */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                              {theme.typography.headingFont}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 text-slate-300 border border-slate-800 font-mono capitalize">
                              {theme.heroStyle.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThemeId(theme.id);
                              setActiveTab('compare');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedThemeId(theme.id);
                              handleConfirmApply();
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200'
                            }`}
                          >
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                            <span>Use Template</span>
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Safe Data Preservation Footer & Apply Action */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200">
                  100% Data Preservation Guarantee
                </p>
                <p className="text-[11px] text-slate-400">
                  Switching to <span className="text-amber-400 font-bold">{selectedTheme.name}</span> preserves all your products, menu items, prices, and reviews.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyCategoryArchitecture}
                onChange={(e) => setApplyCategoryArchitecture(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Generate Category-Tailored Sections & Pages</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isApplying}>
              Cancel
            </Button>

            <Button
              variant="gold"
              size="sm"
              onClick={handleConfirmApply}
              isLoading={isApplying}
              icon={CheckCircle2}
              iconPosition="right"
              className="font-extrabold shadow-lg shadow-amber-500/20"
            >
              Apply {selectedTheme.name}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
