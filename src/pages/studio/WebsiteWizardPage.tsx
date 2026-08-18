import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Palette,
  Code,
  Globe,
  Sliders,
  Check,
  ShoppingBag,
  Star,
  Tag,
  Clock,
  MapPin,
  Phone,
  Send,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, ThemeDefinition } from '../../types';
import { THEME_REGISTRY, BUSINESS_CATEGORIES, getTemplatesByCategory, getThemeById } from '../../data/themes';
import { FEATURE_REGISTRY } from '../../data/features';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export const WebsiteWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<'theme' | 'custom_html'>('theme');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('tpl_restaurant_signature');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'feature_store',
    'feature_reviews',
    'feature_hours',
    'feature_location',
    'feature_call',
    'feature_telegram',
    'feature_faq',
  ]);
  const [customHtmlCode, setCustomHtmlCode] = useState<string>('');
  const [customCssCode, setCustomCssCode] = useState<string>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getCompany(id)
      .then((res) => {
        if (res?.company) {
          setCompany(res.company);
          // Suggest appropriate top template for the company's category
          const categoryTemplates = getTemplatesByCategory(res.company.category);
          if (categoryTemplates && categoryTemplates.length > 0) {
            setSelectedThemeId(categoryTemplates[0].id);
            setSelectedCategoryTab(res.company.category || 'all');
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFeature = (featId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
  };

  const handleFinishWizard = async () => {
    if (!company) return;
    setCreating(true);
    try {
      const selectedTheme = THEME_REGISTRY.find((t) => t.id === selectedThemeId) || THEME_REGISTRY[0];
      const websitePayload = {
        companyId: company.id,
        themeId: method === 'theme' ? selectedThemeId : 'theme_minimal',
        status: 'draft',
        draftConfig: {
          design: {
            primaryColor: selectedTheme.defaultPalette.primary,
            secondaryColor: selectedTheme.defaultPalette.secondary,
            accentColor: selectedTheme.defaultPalette.accent,
            bgColor: selectedTheme.defaultPalette.bg,
            surfaceColor: selectedTheme.defaultPalette.surface,
            textColor: selectedTheme.defaultPalette.text,
            mutedTextColor: selectedTheme.defaultPalette.muted,
            headingFont: selectedTheme.typography.headingFont,
            bodyFont: selectedTheme.typography.bodyFont,
            spacingDensity: 'comfortable',
          },
          header: {
            showLogo: true,
            showCompanyName: true,
            style: 'standard',
            sticky: true,
            showPhoneBtn: selectedFeatures.includes('feature_call'),
            showTelegramBtn: selectedFeatures.includes('feature_telegram'),
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
          pages: [
            { id: 'page_home', name: 'Home', slug: 'home', title: 'Home', isHome: true, isPublished: true, isHidden: false, order: 1, sections: [] },
            { id: 'page_store', name: 'Store', slug: 'store', title: 'Store Catalog', isHome: false, isPublished: selectedFeatures.includes('feature_store'), isHidden: false, order: 2, sections: [] },
            { id: 'page_reviews', name: 'Reviews', slug: 'reviews', title: 'Guest Reviews', isHome: false, isPublished: selectedFeatures.includes('feature_reviews'), isHidden: false, order: 3, sections: [] },
            { id: 'page_contact', name: 'Contact', slug: 'contact', title: 'Contact Us', isHome: false, isPublished: true, isHidden: false, order: 4, sections: [] },
          ],
          installedFeatures: selectedFeatures,
          customHtml: method === 'custom_html' ? {
            id: `html_${Date.now()}`,
            websiteId: '',
            companyId: company.id,
            name: 'Custom Template',
            html: customHtmlCode,
            css: customCssCode,
            js: '',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } : undefined,
        },
      };

      await api.saveDraft(company.id, websitePayload.draftConfig, websitePayload.themeId);
      navigate(`/studio/${company.id}`);
    } catch (err) {
      console.error(err);
      navigate(`/studio/${company.id}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-amber-400 rounded-full" />
      </div>
    );
  }

  const selectedTheme = THEME_REGISTRY.find((t) => t.id === selectedThemeId) || THEME_REGISTRY[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/company/${company.id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Back to Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Website Creation Wizard
            </h1>
            <p className="text-xs text-slate-500">
              Configuring digital storefront for <span className="font-bold text-slate-700 dark:text-slate-300">{company.name}</span>
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : step > s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: METHOD SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Choose Creation Method
            </h2>
            <p className="text-xs text-slate-500">
              Select how you would like to construct this website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method A */}
            <div
              onClick={() => setMethod('theme')}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-4 ${
                method === 'theme'
                  ? 'border-amber-500 bg-amber-500/5 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Method A: NABSITE 24-Theme Engine</span>
                  {method === 'theme' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Choose from 24 finely crafted, responsive business archetypes with automatic menu catalogs, verified reviews, operating hours, and full live visual customization.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  24 Archetypes
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Instant Preview
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Zero Code Required
                </span>
              </div>
            </div>

            {/* Method B */}
            <div
              onClick={() => setMethod('custom_html')}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-4 ${
                method === 'custom_html'
                  ? 'border-amber-500 bg-amber-500/5 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Method B: Custom HTML Template</span>
                  {method === 'custom_html' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Paste pre-built HTML, CSS, and JS. Rendered securely in an isolated sandboxed frame with custom promotional logic.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Full Code Control
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Secure Sandbox
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setStep(2)}>
              Continue to Theme Selection
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: THEME SELECTION */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Select Website Template</span>
                <Badge variant="gold" size="sm">
                  324 Available
                </Badge>
              </h2>
              <p className="text-xs text-slate-500">
                18 unique layouts tailored for {company.category || 'your industry'}.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full self-start sm:self-auto">
              Current: {selectedTheme.name}
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategoryTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryTab(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategoryTab.toLowerCase() === cat.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {THEME_REGISTRY.filter((t) => {
              if (selectedCategoryTab === 'all') return true;
              return (
                (t.category && t.category.toLowerCase() === selectedCategoryTab.toLowerCase()) ||
                t.categoryCompatibilities?.some((c) => c.toLowerCase().includes(selectedCategoryTab.toLowerCase()))
              );
            }).map((t) => {
              const isSelected = selectedThemeId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{t.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {t.category || t.categoryCompatibilities?.[0] || 'Universal'}
                    </span>
                  </div>

                  {/* Palette color strip */}
                  <div className="h-3 rounded-md overflow-hidden flex items-stretch border border-slate-200 dark:border-slate-700">
                    <div className="flex-1" style={{ backgroundColor: t.defaultPalette.primary }} />
                    <div className="flex-1" style={{ backgroundColor: t.defaultPalette.secondary }} />
                    <div className="flex-1" style={{ backgroundColor: t.defaultPalette.accent }} />
                    <div className="flex-1" style={{ backgroundColor: t.defaultPalette.surface }} />
                    <div className="flex-1" style={{ backgroundColor: t.defaultPalette.bg }} />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{t.description}</p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" size="md" icon={ArrowLeft} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setStep(3)}>
              Continue to Features
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: FEATURE CHECKLIST */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Configure Enabled Features & Sections
            </h2>
            <p className="text-xs text-slate-500">
              Select what interactive modules to include on the public website.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'feature_store', name: 'Product / Menu Catalog', desc: 'Display items with ETB pricing, photos, and order CTAs', icon: ShoppingBag },
              { id: 'feature_reviews', name: 'Verified Customer Reviews', desc: 'Customer star ratings and live review submission modal', icon: Star },
              { id: 'feature_offers', name: 'Promotions & Special Deals', desc: 'Discount banners with claim actions', icon: Tag },
              { id: 'feature_hours', name: 'Business Schedule & Live Status', desc: 'Real-time open/closed indicator with daily hours', icon: Clock },
              { id: 'feature_location', name: 'Location & Google Maps', desc: 'Physical premises address and navigation link', icon: MapPin },
              { id: 'feature_call', name: 'Direct Phone Hotline', desc: '1-click tap to call company phone number', icon: Phone },
              { id: 'feature_telegram', name: 'Telegram Channel / Support', desc: 'Direct message link to company Telegram', icon: Send },
              { id: 'feature_faq', name: 'FAQ Accordion Block', desc: 'Interactive expandable frequently asked questions', icon: HelpCircle },
            ].map((feat) => {
              const isChecked = selectedFeatures.includes(feat.id);
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  onClick={() => toggleFeature(feat.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 opacity-60'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{feat.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" size="md" icon={ArrowLeft} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setStep(4)}>
              Review & Launch Studio
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION & INITIALIZE */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Ready to Generate Digital Storefront
            </h2>
            <p className="text-xs text-slate-500">
              Review your configuration summary before opening Website Studio.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={company.logo}
                alt={company.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{company.name}</h3>
                <p className="text-xs text-slate-500">{company.category} • nabsite.et/c/{company.slug}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Theme</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedTheme.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Features</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedFeatures.length} Modules Enabled</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" size="md" icon={ArrowLeft} onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              isLoading={creating}
              onClick={handleFinishWizard}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              Initialize Website Studio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
