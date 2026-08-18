import React, { useState } from 'react';
import {
  Palette,
  Type,
  Layout,
  Layers,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
  Sun,
  Moon,
  Brush,
} from 'lucide-react';
import { ThemeDefinition, WebsiteConfig } from '../../types';
import { THEME_REGISTRY } from '../../data/themes';

interface StudioDesignEditorProps {
  currentThemeId: string;
  config: WebsiteConfig;
  onUpdateThemeId: (themeId: string) => void;
  onUpdateDesign: (designUpdates: Partial<WebsiteConfig['design']>) => void;
  onUpdateHeader: (headerUpdates: Partial<WebsiteConfig['header']>) => void;
  onUpdateFooter: (footerUpdates: Partial<WebsiteConfig['footer']>) => void;
}

const CATEGORY_TABS = [
  'All',
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

const PRESET_PALETTES = [
  { name: 'Warm Amber & Gold', primary: '#D97706', secondary: '#78350F', accent: '#F59E0B', bg: '#FFFBEB', surface: '#FFFFFF', text: '#451A03', muted: '#78716C' },
  { name: 'Corporate Navy', primary: '#1E3A8A', secondary: '#0F172A', accent: '#3B82F6', bg: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#64748B' },
  { name: 'Emerald Botanical', primary: '#047857', secondary: '#064E3B', accent: '#10B981', bg: '#F0FDF4', surface: '#FFFFFF', text: '#064E3B', muted: '#6B7280' },
  { name: 'Cyber Obsidian', primary: '#7C3AED', secondary: '#5B21B6', accent: '#A78BFA', bg: '#090D16', surface: '#131B2E', text: '#F8FAFC', muted: '#94A3B8' },
  { name: 'Crimson Bistro', primary: '#B91C1C', secondary: '#7F1D1D', accent: '#F97316', bg: '#FFFBEB', surface: '#FFFFFF', text: '#451A03', muted: '#78716C' },
  { name: 'Minimalist Charcoal', primary: '#18181B', secondary: '#27272A', accent: '#71717A', bg: '#FFFFFF', surface: '#F8FAFC', text: '#0F172A', muted: '#64748B' },
];

const FONT_PAIRINGS = [
  { name: 'Outfit + Plus Jakarta Sans', heading: 'Outfit', body: 'Plus Jakarta Sans', desc: 'Modern high-conversion digital identity' },
  { name: 'Playfair Display + Inter', heading: 'Playfair Display', body: 'Inter', desc: 'Elegant dining, hotel & luxury editorial' },
  { name: 'Cinzel + Plus Jakarta Sans', heading: 'Cinzel', body: 'Plus Jakarta Sans', desc: 'Opulent fine-dining & luxury watchmaker' },
  { name: 'Space Grotesk + Inter', heading: 'Space Grotesk', body: 'Inter', desc: 'Deep-tech, SaaS and engineering precision' },
  { name: 'Inter + Inter', heading: 'Inter', body: 'Inter', desc: 'Ultra-clean minimalist utility' },
];

export const StudioDesignEditor: React.FC<StudioDesignEditorProps> = ({
  currentThemeId,
  config,
  onUpdateThemeId,
  onUpdateDesign,
  onUpdateHeader,
  onUpdateFooter,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'colors' | 'typography' | 'header_footer'>('theme');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');

  const currentTheme = THEME_REGISTRY.find((t) => t.id === currentThemeId) || THEME_REGISTRY[0];
  const design = config?.design || {
    primaryColor: currentTheme.defaultPalette.primary,
    secondaryColor: currentTheme.defaultPalette.secondary,
    accentColor: currentTheme.defaultPalette.accent,
    bgColor: currentTheme.defaultPalette.bg,
    surfaceColor: currentTheme.defaultPalette.surface,
    textColor: currentTheme.defaultPalette.text,
    mutedTextColor: currentTheme.defaultPalette.muted,
    headingFont: currentTheme.typography.headingFont,
    bodyFont: currentTheme.typography.bodyFont,
    spacingDensity: 'comfortable',
  };

  const header = config?.header || {
    showLogo: true,
    showCompanyName: true,
    style: 'standard',
    sticky: true,
    showPhoneBtn: true,
    showTelegramBtn: true,
    showCtaBtn: true,
  };

  const footer = config?.footer || {
    showLogo: true,
    showDescription: true,
    showContactInfo: true,
    showSocialLinks: true,
    showNavigation: true,
    showDeveloperCredit: true,
  };

  const filteredThemes = THEME_REGISTRY.filter((t) => {
    if (selectedCategoryTab === 'All') return true;
    return t.category === selectedCategoryTab || t.categoryCompatibilities?.some((c) => c.toLowerCase().includes(selectedCategoryTab.toLowerCase()));
  });

  const applyTheme = (theme: ThemeDefinition) => {
    onUpdateThemeId(theme.id);
    onUpdateDesign({
      primaryColor: theme.defaultPalette.primary,
      secondaryColor: theme.defaultPalette.secondary,
      accentColor: theme.defaultPalette.accent,
      bgColor: theme.defaultPalette.bg,
      surfaceColor: theme.defaultPalette.surface,
      textColor: theme.defaultPalette.text,
      mutedTextColor: theme.defaultPalette.muted,
      headingFont: theme.typography.headingFont,
      bodyFont: theme.typography.bodyFont,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Sub-tabs header */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'theme'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Archetypes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'colors'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Palettes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'typography'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Fonts & Layout
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('header_footer')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center ${
            activeTab === 'header_footer'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Header / Footer
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* TAB 1: THEME ARCHETYPES */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Choose Website Archetype
              </h3>
              <p className="text-xs text-slate-500">
                At least 4 genuinely distinct layouts per major business category
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedCategoryTab === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredThemes.map((theme) => {
                const isSelected = theme.id === currentThemeId;
                return (
                  <div
                    key={theme.id}
                    onClick={() => applyTheme(theme)}
                    className={`rounded-2xl p-3.5 border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: theme.previewColor }}
                        />
                        <h4 className="text-xs font-bold text-white">{theme.name}</h4>
                      </div>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{theme.headerStyle} header</span>
                      <span>{theme.heroStyle} hero</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: COLOR PALETTES */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                1-Click Preset Palettes
              </h3>
              <p className="text-xs text-slate-500">Instantly harmonize brand colors</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() =>
                    onUpdateDesign({
                      primaryColor: pal.primary,
                      secondaryColor: pal.secondary,
                      accentColor: pal.accent,
                      bgColor: pal.bg,
                      surfaceColor: pal.surface,
                      textColor: pal.text,
                      mutedTextColor: pal.muted,
                    })
                  }
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500/50 text-left transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{pal.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.accent }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.bg }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Fine-Tune Brand Colors
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400">Primary Brand</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.primaryColor || '#D97706'}
                      onChange={(e) => onUpdateDesign({ primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.primaryColor || '#D97706'}
                      onChange={(e) => onUpdateDesign({ primaryColor: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400">Accent Highlight</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.accentColor || '#F59E0B'}
                      onChange={(e) => onUpdateDesign({ accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.accentColor || '#F59E0B'}
                      onChange={(e) => onUpdateDesign({ accentColor: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400">Canvas Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.bgColor || '#0F172A'}
                      onChange={(e) => onUpdateDesign({ bgColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.bgColor || '#0F172A'}
                      onChange={(e) => onUpdateDesign({ bgColor: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400">Card Surface</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.surfaceColor || '#1E293B'}
                      onChange={(e) => onUpdateDesign({ surfaceColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={design.surfaceColor || '#1E293B'}
                      onChange={(e) => onUpdateDesign({ surfaceColor: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY & LAYOUT */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Typography Pairings
              </h3>
              <p className="text-xs text-slate-500">Curated font hierarchies</p>
            </div>

            <div className="space-y-2">
              {FONT_PAIRINGS.map((fp) => {
                const isSelected = design.headingFont === fp.heading;
                return (
                  <button
                    key={fp.name}
                    type="button"
                    onClick={() => onUpdateDesign({ headingFont: fp.heading, bodyFont: fp.body })}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-800 hover:bg-slate-750 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{fp.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fp.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Layout Density
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => onUpdateDesign({ spacingDensity: density })}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-colors ${
                      design.spacingDensity === density
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HEADER & FOOTER */}
        {activeTab === 'header_footer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Navigation Header Settings
              </h3>
              <p className="text-xs text-slate-500">Configure top brand bar</p>
            </div>

            <div className="space-y-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>Sticky Top Navigation Bar</span>
                <input
                  type="checkbox"
                  checked={header.sticky !== false}
                  onChange={(e) => onUpdateHeader({ sticky: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>Display Verified Business Logo</span>
                <input
                  type="checkbox"
                  checked={header.showLogo !== false}
                  onChange={(e) => onUpdateHeader({ showLogo: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>Show Quick Direct Call Button</span>
                <input
                  type="checkbox"
                  checked={header.showPhoneBtn !== false}
                  onChange={(e) => onUpdateHeader({ showPhoneBtn: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                <span>Show Telegram Concierge Button</span>
                <input
                  type="checkbox"
                  checked={header.showTelegramBtn !== false}
                  onChange={(e) => onUpdateHeader({ showTelegramBtn: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Footer Options
              </h3>
              <div className="space-y-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                  <span>Show Verified Digital Identity Seal</span>
                  <input
                    type="checkbox"
                    checked={footer.showDeveloperCredit !== false}
                    onChange={(e) => onUpdateFooter({ showDeveloperCredit: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                  <span>Show Social Media Links</span>
                  <input
                    type="checkbox"
                    checked={footer.showSocialLinks !== false}
                    onChange={(e) => onUpdateFooter({ showSocialLinks: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
