import React from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Save,
  Rocket,
  QrCode,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Layers,
  Palette,
  FileText,
  Utensils,
  Sliders,
  Menu,
} from 'lucide-react';
import { Company, Website, WebsitePage } from '../../types';
import { THEME_REGISTRY } from '../../data/themes';
import { CompanyName } from '../ui/CompanyName';

interface StudioTopBarProps {
  company: Company;
  website: Website | null;
  activePage: WebsitePage;
  pages: WebsitePage[];
  viewport: 'mobile' | 'tablet' | 'desktop';
  currentThemeId?: string;
  activeTab?: string;
  onTabChange?: (tab: 'design' | 'pages' | 'sections' | 'navigation' | 'features' | 'menu' | 'qr' | 'settings') => void;
  onOpenTemplateSwitcher?: () => void;
  onViewportChange: (vp: 'mobile' | 'tablet' | 'desktop') => void;
  onSelectPage: (slug: string) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onOpenPreviewModal: () => void;
  onOpenQrStudio: () => void;
}

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  company,
  website,
  activePage,
  pages,
  viewport,
  currentThemeId = 'theme_restaurant_classic',
  activeTab = 'pages',
  onTabChange,
  onOpenTemplateSwitcher,
  onViewportChange,
  onSelectPage,
  hasUnsavedChanges,
  isSaving,
  isPublishing,
  onSaveDraft,
  onPublish,
  onOpenPreviewModal,
  onOpenQrStudio,
}) => {
  const [pageDropdownOpen, setPageDropdownOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const currentTheme =
    THEME_REGISTRY.find((t) => t.id === currentThemeId) || THEME_REGISTRY[0];

  return (
    <header className="h-auto py-2 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 flex flex-col gap-2 shrink-0 text-white z-30 select-none">
      {/* Upper Bar: Exit, Company, Template Switcher, Viewports, and Actions */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* Left: Exit, Company, Template Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/company/${company.id}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center shrink-0 border border-slate-700"
            title="Back to Business Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                  STUDIO 2.1
                </span>
                <span className="text-xs font-bold text-slate-200 truncate">
                  <CompanyName name={company.name} maxWidth="max-w-[120px] md:max-w-[160px]" />
                </span>
              </div>
            </div>

            {/* Prominent Current Template Badge + Change Template Button */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Template:
              </span>
              <span className="text-xs font-extrabold text-white truncate max-w-[120px] md:max-w-[160px]">
                {currentTheme.name}
              </span>
              {onOpenTemplateSwitcher && (
                <button
                  type="button"
                  onClick={onOpenTemplateSwitcher}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black tracking-wide uppercase shadow-sm transition-all hover:scale-105 ml-1 cursor-pointer"
                >
                  Change Template
                </button>
              )}
            </div>

            {/* Active Editing Page Dropdown */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Page: {activePage.name || 'Home'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {pageDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPageDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      Switch Page View
                    </div>
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPage(p.slug);
                          setPageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          p.slug === activePage.slug
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {p.isHome && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                              p.slug === activePage.slug ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            HOME
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Responsive Viewport Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => onViewportChange('mobile')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewport === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Mobile Viewport (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => onViewportChange('tablet')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewport === 'tablet'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => onViewportChange('desktop')}
            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewport === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            title="Desktop Full Screen"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* Right: Actions, Save, Publish */}
        <div className="flex items-center gap-2">
          {/* Save Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Unsaved draft
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Draft saved
              </span>
            )}
          </div>

          {/* QR Studio Button */}
          <button
            type="button"
            onClick={onOpenQrStudio}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Open QR Studio & Digital Menu Stand"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">QR Stand</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
          </button>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 space-y-0.5">
                  <a
                    href={`/c/${company.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Live Website</span>
                  </a>
                  <a
                    href={`/c/${company.slug}/menu`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Digital Menu</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQrStudio();
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors text-left"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Print QR Stand</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lower Bar: Clear Top-Level Navigation: Design | Pages | Sections | Features | Content | Preview | Publish */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto scrollbar-thin">
        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('design')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'design'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Design</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('pages')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'pages'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pages</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('sections')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'sections'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sections</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('navigation')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'navigation'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Nav & Header</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('features')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'features'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Features</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('menu')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Content / Store</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="px-3 py-1 rounded-xl text-xs font-extrabold text-sky-400 hover:bg-slate-800 hover:text-sky-300 flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="px-3 py-1 rounded-xl text-xs font-extrabold text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 flex items-center gap-1.5 transition-all"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </nav>

        {/* Viewport shortcut icons on mobile */}
        <div className="flex lg:hidden items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onViewportChange('mobile')}
            className={`p-1 rounded ${viewport === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewportChange('desktop')}
            className={`p-1 rounded ${viewport === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
