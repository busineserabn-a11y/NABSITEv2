import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Code,
  Search,
  FileCode,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { WebsiteConfig, CustomHtmlSite, Company } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getCategoryDesignProfile } from '../../data/categoryProfiles';

interface StudioSettingsPanelProps {
  company: Company;
  seo: WebsiteConfig['seo'];
  customHtml?: CustomHtmlSite;
  onUpdateSeo: (seoUpdates: Partial<WebsiteConfig['seo']>) => void;
  onUpdateCustomHtml: (htmlUpdates: Partial<CustomHtmlSite>) => void;
  onRegenerateCategoryDesign?: (categoryName: string) => void;
}

export const StudioSettingsPanel: React.FC<StudioSettingsPanelProps> = ({
  company,
  seo,
  customHtml,
  onUpdateSeo,
  onUpdateCustomHtml,
  onRegenerateCategoryDesign,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const profile = getCategoryDesignProfile(company.category || 'Restaurant');

  const handleRegenerate = async () => {
    if (!onRegenerateCategoryDesign) return;
    setIsRegenerating(true);
    try {
      await onRegenerateCategoryDesign(company.category || 'Restaurant');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            SEO & System Architecture Settings
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Optimize search engine metadata, sandboxed code, and category structure
        </p>
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Category Architecture Regeneration */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Category Design Architecture</span>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Current Category: <span className="font-bold text-amber-400">{company.category || 'Restaurant'}</span>
            </p>
            <p className="text-slate-400 text-[11px]">
              Visual Style: {profile.visualPersonality} — {profile.tagline}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Regenerating applies category-specific sections (e.g. roastery origin for café, suites for hotel, admissions for schools) while 100% preserving your menu, products, and reviews.
            </span>
          </div>

          {onRegenerateCategoryDesign && (
            <Button
              variant="gold"
              size="sm"
              onClick={handleRegenerate}
              isLoading={isRegenerating}
              icon={RefreshCw}
              className="w-full text-xs font-bold"
            >
              Regenerate {company.category || 'Category'} Architecture
            </Button>
          )}
        </div>

        {/* SEO Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Search className="w-3.5 h-3.5" />
            <span>Search Engine Optimization (SEO)</span>
          </div>

          <Input
            label="Browser Tab Title (Meta Title)"
            placeholder="e.g. Traditional Tibs & Pastry | Verified NABSITE"
            value={seo?.siteTitle || ''}
            onChange={(e) => onUpdateSeo({ siteTitle: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Meta Description
            </label>
            <textarea
              rows={3}
              placeholder="A concise summary of your business shown in Google search results..."
              value={seo?.metaDescription || ''}
              onChange={(e) => onUpdateSeo({ metaDescription: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <Input
            label="Search Keywords (comma-separated)"
            placeholder="restaurant, traditional food, addis ababa, delivery"
            value={Array.isArray(seo?.keywords) ? seo.keywords.join(', ') : ''}
            onChange={(e) =>
              onUpdateSeo({
                keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>

        {/* Custom Code Sandbox */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Code className="w-3.5 h-3.5" />
            <span>Custom CSS / Stylesheet</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Custom CSS Overrides
            </label>
            <textarea
              rows={6}
              placeholder="/* Add custom CSS rules */\n.custom-accent { font-weight: 900; }"
              value={customHtml?.css || ''}
              onChange={(e) => onUpdateCustomHtml({ css: e.target.value })}
              className="w-full font-mono text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
