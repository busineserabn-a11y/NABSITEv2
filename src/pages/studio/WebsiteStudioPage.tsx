import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe,
  Palette,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Save,
  Rocket,
  Eye,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Layers,
  FileText,
  Utensils,
  QrCode,
  Zap,
  Settings,
  X,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Company,
  Website,
  WebsiteConfig,
  WebsitePage,
  SectionConfig,
  SectionType,
  Product,
  ProductCategory,
  Review,
  Offer,
  Announcement,
  CustomHtmlSite,
} from '../../types';
import { THEME_REGISTRY } from '../../data/themes';
import { WebsiteRenderer } from '../../components/website/WebsiteRenderer';
import { StudioTopBar } from '../../components/studio/StudioTopBar';
import { StudioPagesSidebar } from '../../components/studio/StudioPagesSidebar';
import { StudioSectionsManager } from '../../components/studio/StudioSectionsManager';
import { StudioSectionEditor } from '../../components/studio/StudioSectionEditor';
import { StudioMenuManager } from '../../components/studio/StudioMenuManager';
import { StudioDesignEditor } from '../../components/studio/StudioDesignEditor';
import { StudioQrPanel } from '../../components/studio/StudioQrPanel';
import { StudioFeaturesPanel } from '../../components/studio/StudioFeaturesPanel';
import { StudioSettingsPanel } from '../../components/studio/StudioSettingsPanel';
import { StudioNavigationManager } from '../../components/studio/StudioNavigationManager';
import { StudioPageCustomizer } from '../../components/studio/StudioPageCustomizer';
import { TemplateSwitcherModal } from '../../components/studio/TemplateSwitcherModal';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

type StudioWorkspaceTab = 'pages' | 'page_edit' | 'sections' | 'navigation' | 'menu' | 'design' | 'qr' | 'features' | 'settings';

export const WebsiteStudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Core Data
  const [company, setCompany] = useState<Company | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Studio UI State
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioWorkspaceTab>('pages');
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [activePageSlug, setActivePageSlug] = useState<string>('home');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isTemplateSwitcherOpen, setIsTemplateSwitcherOpen] = useState(false);

  // Saving & Publishing State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Working Website Config & Theme
  const [selectedThemeId, setSelectedThemeId] = useState<string>('theme_restaurant_classic');
  const [config, setConfig] = useState<WebsiteConfig>({
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
      { id: 'nav_menu', label: 'Menu', type: 'page', target: 'menu', order: 2 },
      { id: 'nav_about', label: 'About', type: 'page', target: 'about', order: 3 },
      { id: 'nav_contact', label: 'Contact', type: 'page', target: 'contact', order: 4 },
    ],
    pages: [
      {
        id: 'page_home',
        name: 'Home',
        slug: 'home',
        title: 'Home',
        isHome: true,
        isPublished: true,
        isHidden: false,
        order: 1,
        sections: [
          { id: 'sec_hero', type: 'hero', order: 1, isVisible: true, title: 'Welcome', subtitle: 'Crafted with passion' },
          { id: 'sec_products', type: 'products', order: 2, isVisible: true, title: 'Our Featured Menu' },
          { id: 'sec_about', type: 'about', order: 3, isVisible: true, title: 'Our Story & Heritage' },
          { id: 'sec_hours', type: 'hours', order: 4, isVisible: true, title: 'Opening Hours' },
          { id: 'sec_reviews', type: 'reviews', order: 5, isVisible: true, title: 'Guest Testimonials' },
        ],
      },
      {
        id: 'page_menu',
        name: 'Digital Menu',
        slug: 'menu',
        title: 'Digital Menu & Specials',
        isHome: false,
        isPublished: true,
        isHidden: false,
        order: 2,
        sections: [
          { id: 'sec_menu_hero', type: 'hero', order: 1, isVisible: true, title: 'Explore Our Complete Menu' },
          { id: 'sec_menu_products', type: 'products', order: 2, isVisible: true, title: 'All Dishes & Refreshments' },
        ],
      },
      {
        id: 'page_about',
        name: 'About',
        slug: 'about',
        title: 'About Us',
        isHome: false,
        isPublished: true,
        isHidden: false,
        order: 3,
        sections: [
          { id: 'sec_about_full', type: 'about', order: 1, isVisible: true, title: 'Our Story & Tradition' },
        ],
      },
      {
        id: 'page_contact',
        name: 'Contact',
        slug: 'contact',
        title: 'Contact Us',
        isHome: false,
        isPublished: true,
        isHidden: false,
        order: 4,
        sections: [
          { id: 'sec_contact_hours', type: 'hours', order: 1, isVisible: true, title: 'Visit Our Location' },
          { id: 'sec_contact_form', type: 'contact', order: 2, isVisible: true, title: 'Send Inquiries' },
        ],
      },
    ],
    installedFeatures: ['feature_menu', 'feature_store', 'feature_reviews', 'feature_location', 'feature_call', 'feature_telegram'],
    seo: {
      siteTitle: 'Official Verified Website',
      metaDescription: 'Welcome to our verified digital storefront.',
      keywords: ['business', 'verified', 'nabsite'],
    },
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Company & Website Data
  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      let compData: Company | null = null;
      let webData: Website | null = null;

      // 1. Try to load company by ID or Slug
      try {
        compData = await api.getCompany(id);
      } catch {
        // ID might be a website ID
        try {
          webData = await api.getWebsite(id);
          if (webData?.companyId) {
            compData = await api.getCompany(webData.companyId).catch(() => null);
          }
        } catch {
          // Both lookups failed
        }
      }

      // 2. If company was found but website not yet loaded, load company's website
      if (compData && !webData) {
        try {
          webData = await api.getWebsite(compData.websiteId || compData.id);
        } catch (e) {
          console.warn('Website not found for company, falling back to initialized config:', e);
        }
      }

      if (compData) {
        setCompany(compData);
      } else {
        setLoadError(`Unable to find company with ID or Slug "${id}".`);
      }

      if (webData) {
        setWebsite(webData);
        if (webData.themeId) setSelectedThemeId(webData.themeId);
        const activeConf = webData.draftConfig || webData.publishedConfig;
        if (activeConf) {
          setConfig(activeConf);
        }
      }

      const compId = compData?.id || id;
      const [prodRes, catRes, revRes, offRes, annRes] = await Promise.all([
        api.getProducts(compId).catch(() => []),
        api.getProductCategories(compId).catch(() => []),
        api.getReviews(compId).catch(() => []),
        api.getOffers(compId).catch(() => []),
        api.getAnnouncements(compId).catch(() => []),
      ]);

      setProducts(prodRes || []);
      setProductCategories(catRes || []);
      setReviews(revRes || []);
      setOffers(offRes || []);
      setAnnouncements(annRes || []);
    } catch (err: any) {
      console.error('Studio initialization error:', err);
      setLoadError(err.message || 'Failed to initialize Website Studio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Current active page object
  const pages = config?.pages || [];
  const activePage: WebsitePage =
    pages.find((p) => p.slug === activePageSlug) ||
    pages.find((p) => p.isHome) ||
    pages[0] || {
      id: 'page_home',
      name: 'Home',
      slug: 'home',
      title: 'Home',
      isHome: true,
      isPublished: true,
      isHidden: false,
      order: 1,
      sections: [],
    };

  const activeSection =
    activePage.sections?.find((s) => s.id === activeSectionId) || null;

  // -------------------------------------------------------------
  // MUTATION HANDLERS
  // -------------------------------------------------------------

  const handleUpdateConfig = (newConfig: WebsiteConfig) => {
    setConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
      const res: any = await api.saveDraft(company.websiteId || company.id, config, selectedThemeId);
      if (res) setWebsite(res?.website || res);
      setHasUnsavedChanges(false);
      showToast('Draft changes & template saved to Firestore!', 'success');
    } catch (err: any) {
      console.error(err);
      const errDetail = err?.message || 'Failed to save draft to Firestore.';
      showToast(errDetail, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!company) return;
    setIsPublishing(true);
    try {
      await api.saveDraft(company.websiteId || company.id, config, selectedThemeId);
      const res: any = await api.publishWebsite(company.websiteId || company.id);
      if (res) setWebsite(res?.website || res);
      setHasUnsavedChanges(false);
      showToast(`Website published successfully at /c/${company.slug}`, 'success');
    } catch (err: any) {
      console.error(err);
      const errDetail = err?.message || 'Failed to publish website.';
      showToast(errDetail, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleApplyTemplate = async (newThemeId: string, updatedConfig?: WebsiteConfig) => {
    if (!company) return;
    setSelectedThemeId(newThemeId);
    let finalConfig = updatedConfig || config;
    
    // Auto-harmonize design palette from new theme preset if needed
    const targetTheme = THEME_REGISTRY.find((t) => t.id === newThemeId);
    if (targetTheme && !updatedConfig) {
      finalConfig = {
        ...config,
        design: {
          ...config.design,
          primaryColor: targetTheme.defaultPalette.primary || config.design.primaryColor,
          secondaryColor: targetTheme.defaultPalette.secondary || config.design.secondaryColor,
          accentColor: targetTheme.defaultPalette.accent || config.design.accentColor,
          bgColor: targetTheme.defaultPalette.bg || config.design.bgColor,
          surfaceColor: targetTheme.defaultPalette.surface || config.design.surfaceColor,
          textColor: targetTheme.defaultPalette.text || config.design.textColor,
          mutedTextColor: targetTheme.defaultPalette.muted || config.design.mutedTextColor,
          headingFont: targetTheme.typography.headingFont || config.design.headingFont,
          bodyFont: targetTheme.typography.bodyFont || config.design.bodyFont,
        },
      };
    }

    setConfig(finalConfig);
    setHasUnsavedChanges(true);

    try {
      const saveRes: any = await api.saveDraft(company.websiteId || company.id, finalConfig, newThemeId);
      if (saveRes) setWebsite(saveRes?.website || saveRes);
      setHasUnsavedChanges(false);
      showToast(`Switched and saved template "${targetTheme?.name || 'New Template'}" to Firestore!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Template switched locally. Click Save Draft to sync.', 'info');
    }
  };

  // Page Operations
  const handleAddPage = ({ name, slug, title, template }: { name: string; slug: string; title: string; template: string }) => {
    let initialSections: SectionConfig[] = [];
    if (template === 'menu') {
      initialSections = [
        { id: `sec_hero_${Date.now()}`, type: 'hero', order: 1, isVisible: true, title: `${name}`, subtitle: 'Explore culinary delights' },
        { id: `sec_prod_${Date.now()}`, type: 'products', order: 2, isVisible: true, title: 'Dishes & Specials' },
      ];
    } else if (template === 'store') {
      initialSections = [
        { id: `sec_hero_${Date.now()}`, type: 'hero', order: 1, isVisible: true, title: `${name}`, subtitle: 'Full Product Catalog' },
        { id: `sec_prod_${Date.now()}`, type: 'products', order: 2, isVisible: true, title: 'Catalog Collection' },
      ];
    } else if (template === 'about') {
      initialSections = [
        { id: `sec_about_${Date.now()}`, type: 'about', order: 1, isVisible: true, title: 'About Us', content: `${company?.fullDescription || company?.shortDescription || ''}` },
      ];
    } else if (template === 'reviews') {
      initialSections = [
        { id: `sec_rev_${Date.now()}`, type: 'reviews', order: 1, isVisible: true, title: 'Guest Testimonials' },
      ];
    } else if (template === 'contact') {
      initialSections = [
        { id: `sec_hrs_${Date.now()}`, type: 'hours', order: 1, isVisible: true, title: 'Opening Hours & Location' },
        { id: `sec_con_${Date.now()}`, type: 'contact', order: 2, isVisible: true, title: 'Contact Us' },
      ];
    } else {
      initialSections = [
        { id: `sec_hero_${Date.now()}`, type: 'hero', order: 1, isVisible: true, title: name, subtitle: title },
      ];
    }

    const newPage: WebsitePage = {
      id: `page_${Date.now()}`,
      name,
      slug,
      title: title || name,
      isHome: false,
      isPublished: true,
      isHidden: false,
      order: pages.length + 1,
      sections: initialSections,
    };

    handleUpdateConfig({
      ...config,
      pages: [...pages, newPage],
    });
    setActivePageSlug(slug);
    showToast(`Page "${name}" created!`, 'success');
  };

  const handleUpdatePage = (pageId: string, updates: Partial<WebsitePage>) => {
    const updatedPages = pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p));
    handleUpdateConfig({ ...config, pages: updatedPages });
  };

  const handleDeletePage = (pageId: string) => {
    const target = pages.find((p) => p.id === pageId);
    if (!target || target.isHome) return;
    const updatedPages = pages.filter((p) => p.id !== pageId);
    handleUpdateConfig({ ...config, pages: updatedPages });
    if (activePageSlug === target.slug) {
      setActivePageSlug('home');
    }
    showToast(`Page "${target.name}" removed`, 'info');
  };

  const handleReorderPages = (reordered: WebsitePage[]) => {
    handleUpdateConfig({ ...config, pages: reordered });
  };

  // Section Operations on Active Page
  const handleAddSection = (type: SectionType) => {
    const newSection: SectionConfig = {
      id: `sec_${type}_${Date.now()}`,
      type,
      order: (activePage.sections?.length || 0) + 1,
      isVisible: true,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      subtitle: '',
    };

    const updatedSections = [...(activePage.sections || []), newSection];
    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, sections: updatedSections } : p
    );

    handleUpdateConfig({ ...config, pages: updatedPages });
    setActiveSectionId(newSection.id);
    showToast(`Added ${type} section`, 'success');
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<SectionConfig>) => {
    const updatedSections = (activePage.sections || []).map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, sections: updatedSections } : p
    );
    handleUpdateConfig({ ...config, pages: updatedPages });
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedSections = (activePage.sections || []).filter((s) => s.id !== sectionId);
    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, sections: updatedSections } : p
    );
    handleUpdateConfig({ ...config, pages: updatedPages });
    if (activeSectionId === sectionId) setActiveSectionId(null);
    showToast('Section removed', 'info');
  };

  const handleReorderSections = (reordered: SectionConfig[]) => {
    const updatedPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, sections: reordered } : p
    );
    handleUpdateConfig({ ...config, pages: updatedPages });
  };

  // Products and Categories Operations
  const handleAddProduct = async (productData: Partial<Product>) => {
    if (!company) return;
    try {
      const res = await api.createProduct({
        companyId: company.id,
        ...productData,
      } as any);
      if (res?.id) {
        setProducts((prev) => [res, ...prev]);
        showToast(`Item "${res.name}" created!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add product', 'error');
    }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const res = await api.updateProduct(productId, updates);
      if (res?.id) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? res : p)));
        showToast('Item updated!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('Item removed', 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleAddCategory = async (categoryData: Partial<ProductCategory>) => {
    if (!company) return;
    try {
      const res = await api.createProductCategory({
        companyId: company.id,
        ...categoryData,
      } as any);
      if (res?.id) {
        setProductCategories((prev) => [...prev, res]);
        showToast(`Category "${res.name}" added!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add category', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await api.deleteProductCategory(categoryId);
      setProductCategories((prev) => prev.filter((c) => c.id !== categoryId));
      showToast('Category deleted', 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete category', 'error');
    }
  };

  const handleToggleFeature = (featureId: string) => {
    const currentFeats = config.installedFeatures || [];
    const updatedFeats = currentFeats.includes(featureId)
      ? currentFeats.filter((f) => f !== featureId)
      : [...currentFeats, featureId];
    handleUpdateConfig({ ...config, installedFeatures: updatedFeats });
  };

  // -------------------------------------------------------------
  // RENDER LOADING / ERROR
  // -------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          <p className="text-sm font-semibold">Initializing Website Studio 2.0...</p>
        </div>
      </div>
    );
  }

  if (loadError || !company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full p-6 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-4 shadow-2xl">
          <Globe className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Studio Initialization</h2>
          <p className="text-xs text-slate-400">
            {loadError || 'The requested website record could not be loaded.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/owner/companies">
              <Button size="sm" variant="secondary">
                Back to Hub
              </Button>
            </Link>
            <Button size="sm" variant="primary" icon={RefreshCw} onClick={fetchData}>
              Retry Load
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <StudioTopBar
        company={company}
        website={website}
        activePage={activePage}
        pages={pages}
        viewport={viewport}
        currentThemeId={selectedThemeId}
        activeTab={activeTab}
        onTabChange={(t) => {
          if (t === 'settings') {
            setActiveTab('settings');
          } else {
            setActiveTab(t as StudioWorkspaceTab);
          }
        }}
        onOpenTemplateSwitcher={() => setIsTemplateSwitcherOpen(true)}
        onViewportChange={setViewport}
        onSelectPage={(slug) => {
          setActivePageSlug(slug);
          setActiveSectionId(null);
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isPublishing={isPublishing}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onOpenPreviewModal={() => setPreviewModalOpen(true)}
        onOpenQrStudio={() => setActiveTab('qr')}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-700 text-rose-300'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Vertical Navigation Icons Bar */}
        <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-2 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'pages'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Pages Manager"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Pages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'sections'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Page Sections"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('navigation')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'navigation'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Header & Navigation Builder"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Nav</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Menu & Store Builder"
          >
            <Utensils className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'design'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Design & Themes"
          >
            <Palette className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="QR Code Studio"
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'features'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Features & Badges"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Features</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="SEO & Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">SEO</span>
          </button>
        </aside>

        {/* Workspace Active Drawer Panel */}
        <div className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
          {activeTab === 'pages' && (
            <StudioPagesSidebar
              pages={pages}
              activePageSlug={activePageSlug}
              onSelectPage={(slug) => {
                setActivePageSlug(slug);
                setActiveSectionId(null);
              }}
              onOpenPageSettings={(slug) => {
                setActivePageSlug(slug);
                setActiveTab('page_edit');
              }}
              onAddPage={handleAddPage}
              onUpdatePage={handleUpdatePage}
              onDeletePage={handleDeletePage}
              onReorderPages={handleReorderPages}
            />
          )}

          {activeTab === 'page_edit' && (
            <StudioPageCustomizer
              company={company}
              page={activePage}
              pages={pages}
              onUpdatePage={(updates) => handleUpdatePage(activePage.id, updates)}
              onSetAsHome={() => {
                const updated = pages.map((p) => ({
                  ...p,
                  isHome: p.id === activePage.id,
                }));
                handleUpdateConfig({ ...config, pages: updated });
              }}
              onDuplicatePage={() => {
                const newPage: WebsitePage = {
                  ...activePage,
                  id: `page_${Date.now()}`,
                  name: `${activePage.name} (Copy)`,
                  slug: `${activePage.slug}-copy`,
                  isHome: false,
                  sections: (activePage.sections || []).map((sec) => ({
                    ...sec,
                    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  })),
                };
                handleUpdateConfig({ ...config, pages: [...pages, newPage] });
                setActivePageSlug(newPage.slug);
              }}
              onDeletePage={() => handleDeletePage(activePage.id)}
            />
          )}

          {activeTab === 'sections' && (
            <StudioSectionsManager
              sections={activePage.sections || []}
              activeSectionId={activeSectionId}
              onSelectSection={(secId) => setActiveSectionId(secId)}
              onAddSection={handleAddSection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              onReorderSections={handleReorderSections}
            />
          )}

          {activeTab === 'navigation' && (
            <StudioNavigationManager
              company={company}
              pages={pages}
              navigation={config.navigation}
              header={config.header}
              onUpdateNavigation={(nav) => {
                handleUpdateConfig({ ...config, navigation: nav });
              }}
              onUpdateHeader={(hdr) => {
                handleUpdateConfig({ ...config, header: { ...config.header, ...hdr } as any });
              }}
            />
          )}

          {activeTab === 'menu' && (
            <StudioMenuManager
              company={company}
              products={products}
              productCategories={productCategories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'design' && (
            <StudioDesignEditor
              currentThemeId={selectedThemeId}
              config={config}
              onUpdateThemeId={(thId) => {
                setSelectedThemeId(thId);
                setHasUnsavedChanges(true);
              }}
              onUpdateDesign={(d) => handleUpdateConfig({ ...config, design: { ...config.design, ...d } })}
              onUpdateHeader={(h) => handleUpdateConfig({ ...config, header: { ...config.header, ...h } })}
              onUpdateFooter={(f) => handleUpdateConfig({ ...config, footer: { ...config.footer, ...f } })}
            />
          )}

          {activeTab === 'qr' && <StudioQrPanel company={company} />}

          {activeTab === 'features' && (
            <StudioFeaturesPanel
              installedFeatures={config.installedFeatures || []}
              onToggleFeature={handleToggleFeature}
            />
          )}

          {activeTab === 'settings' && (
            <StudioSettingsPanel
              seo={config.seo}
              customHtml={config.customHtml}
              onUpdateSeo={(s) => handleUpdateConfig({ ...config, seo: { ...config.seo, ...s } })}
              onUpdateCustomHtml={(c) =>
                handleUpdateConfig({
                  ...config,
                  customHtml: {
                    ...(config.customHtml || {
                      id: `html_${Date.now()}`,
                      websiteId: '',
                      companyId: company.id,
                      name: 'Custom',
                      html: '',
                      css: '',
                      js: '',
                      status: 'published',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }),
                    ...c,
                  },
                })
              }
            />
          )}
        </div>

        {/* Center Live Interactive Canvas */}
        <main className="flex-1 bg-slate-950 overflow-y-auto flex flex-col items-center p-4 sm:p-6 scrollbar-thin">
          <div
            className={`transition-all duration-300 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 ${
              viewport === 'mobile'
                ? 'w-full max-w-[390px] min-h-[800px]'
                : viewport === 'tablet'
                ? 'w-full max-w-[768px] min-h-[900px]'
                : 'w-full max-w-6xl min-h-[900px]'
            }`}
          >
            {/* Visual Header Indicator in Canvas */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px] text-amber-400 font-bold">
                LIVE CANVAS PREVIEW · EDITING /{activePage.slug}
              </span>
              <span className="text-[10px] text-slate-500">
                Click any section below to customize
              </span>
            </div>

            {/* Render Public Component inside Canvas */}
            <WebsiteRenderer
              company={company}
              website={website}
              config={config}
              products={products}
              productCategories={productCategories}
              reviews={reviews}
              offers={offers}
              announcements={announcements}
              activePageSlug={activePageSlug}
              onNavigatePage={(slug) => {
                setActivePageSlug(slug);
                setActiveSectionId(null);
              }}
              isStudioEditor={true}
              activeSectionId={activeSectionId}
              onSelectSection={(secId) => {
                setActiveSectionId(secId);
                setActiveTab('sections');
              }}
            />
          </div>
        </main>

        {/* Section Editor Slide-Over (Right Side) */}
        {activeSection && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 shrink-0 z-30">
            <StudioSectionEditor
              section={activeSection}
              onUpdate={(updates) => handleUpdateSection(activeSection.id, updates)}
              onClose={() => setActiveSectionId(null)}
            />
          </aside>
        )}
      </div>

      {/* Live Interactive Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Live Preview: ${company.name}`}
        description="Experience the website exactly as customers will on mobile and desktop."
      >
        <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-700 bg-white dark:bg-slate-950 p-2 scrollbar-thin">
          <WebsiteRenderer
            company={company}
            website={website}
            config={config}
            products={products}
            productCategories={productCategories}
            reviews={reviews}
            offers={offers}
            announcements={announcements}
            activePageSlug={activePageSlug}
            onNavigatePage={(slug) => setActivePageSlug(slug)}
            isStudioEditor={false}
          />
        </div>
      </Modal>

      {/* Template Switcher Modal */}
      {isTemplateSwitcherOpen && (
        <TemplateSwitcherModal
          isOpen={isTemplateSwitcherOpen}
          onClose={() => setIsTemplateSwitcherOpen(false)}
          currentThemeId={selectedThemeId}
          company={company}
          website={website}
          config={config}
          products={products}
          productCategories={productCategories}
          reviews={reviews}
          offers={offers}
          announcements={announcements}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </div>
  );
};
