import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Settings,
  Sparkles,
  Sliders,
  Copy,
  Trash2,
  Check,
  Star,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  Code,
  LayoutTemplate,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { WebsitePage, Company } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { buildPublicUrl } from '../../lib/urls';

interface StudioPageCustomizerProps {
  company: Company;
  page: WebsitePage;
  pages: WebsitePage[];
  onUpdatePage: (updates: Partial<WebsitePage>) => void;
  onSetAsHome: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
}

export const StudioPageCustomizer: React.FC<StudioPageCustomizerProps> = ({
  company,
  page,
  pages,
  onUpdatePage,
  onSetAsHome,
  onDuplicatePage,
  onDeletePage,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'layout' | 'seo'>('general');

  const pageCanonicalUrl = buildPublicUrl(
    company.slug,
    page.isHome ? undefined : page.slug
  );

  const copyUrl = () => {
    navigator.clipboard.writeText(pageCanonicalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Header Tabs */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Page Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'layout'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Page Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'seo'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>SEO & Social</span>
          </button>
        </div>

        {page.isHome && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
            HOMEPAGE
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* TAB 1: GENERAL PAGE INFO */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Page Identity & Routing
              </h4>
              <p className="text-[11px] text-slate-500">
                WordPress-style page attributes, URL slugs, and publication states.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Page Navigation Title *"
                placeholder="e.g. Special Events & Catering"
                value={page.name}
                onChange={(e) => onUpdatePage({ name: e.target.value })}
              />

              <Input
                label="Main Page Heading (H1)"
                placeholder="e.g. Celebrate Your Special Moments With Us"
                value={page.title || ''}
                onChange={(e) => onUpdatePage({ title: e.target.value })}
              />

              {/* Slug & Canonical URL Preview */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  URL Slug (Permalink)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      disabled={page.isHome}
                      value={page.isHome ? 'home (root)' : page.slug}
                      onChange={(e) =>
                        onUpdatePage({
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                        })
                      }
                      className="w-full text-xs font-mono rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono text-slate-300">
                  <span className="truncate text-amber-300">{pageCanonicalUrl}</span>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0"
                    title="Copy Canonical URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Visibility & Home Settings */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <div>
                  <div>Publish Page</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Published pages are visible to the public.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={page.isPublished !== false}
                  onChange={(e) => onUpdatePage({ isPublished: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer pt-2 border-t border-slate-700/60">
                <div>
                  <div>Hide from Main Navigation Menu</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Page will remain accessible directly via URL without appearing in header links.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={page.isHidden || false}
                  onChange={(e) => onUpdatePage({ isHidden: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Actions: Set as home, duplicate, delete */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              {!page.isHome && (
                <button
                  type="button"
                  onClick={onSetAsHome}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Set as Homepage</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDuplicatePage}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Page</span>
              </button>

              {!page.isHome && pages.length > 1 && (
                <button
                  type="button"
                  onClick={onDeletePage}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5 transition-colors sm:ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Page</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAGE CANVAS & LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Page Canvas & Layout Template
              </h4>
              <p className="text-[11px] text-slate-500">
                Choose template structures or toggle header and footer for standalone landing pages.
              </p>
            </div>

            {/* Template options */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Page Template Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    key: 'standard',
                    name: 'Full Header & Footer',
                    desc: 'Standard website page with complete navigation and footer',
                  },
                  {
                    key: 'landing',
                    name: 'Landing Page Canvas',
                    desc: 'Focused conversion funnel with minimal header & no distractions',
                  },
                  {
                    key: 'contained',
                    name: 'Boxed Contained Layout',
                    desc: 'Restricts content to max 1200px width with padded margins',
                  },
                  {
                    key: 'fluid',
                    name: 'Fluid Full-Width Canvas',
                    desc: 'Edge-to-edge content width ideal for visual portfolios',
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() =>
                      onUpdatePage({
                        template: tpl.key as any,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      (page.template || 'standard') === tpl.key
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{tpl.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <h5 className="text-xs font-bold text-white">Custom Page Background (Optional)</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Custom Background Color Hex"
                  placeholder="e.g. #0F172A or leave empty for theme default"
                  value={page.customBgColor || ''}
                  onChange={(e) => onUpdatePage({ customBgColor: e.target.value })}
                />
                <Input
                  label="Background Texture / Pattern"
                  placeholder="e.g. dots, grid, none"
                  value={page.customPattern || ''}
                  onChange={(e) => onUpdatePage({ customPattern: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEO & SOCIAL PREVIEW */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Search Engine Optimization & Meta
              </h4>
              <p className="text-[11px] text-slate-500">
                Optimize search results on Google, Telegram previews, WhatsApp link cards and social media.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="SEO Meta Title"
                placeholder={`${page.name} | ${company.name}`}
                value={page.metaTitle || ''}
                onChange={(e) => onUpdatePage({ metaTitle: e.target.value })}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  placeholder={`Explore ${page.name} at ${company.name}. Discover our signature dishes, offers, and digital ordering.`}
                  value={page.metaDescription || ''}
                  onChange={(e) => onUpdatePage({ metaDescription: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Google Search Card Preview */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  Google Search Snippet Preview
                </span>
                <div className="text-xs text-emerald-400 font-mono truncate">{pageCanonicalUrl}</div>
                <div className="text-sm font-bold text-blue-400 hover:underline truncate cursor-pointer">
                  {page.metaTitle || `${page.name} — ${company.name}`}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2">
                  {page.metaDescription ||
                    company.description ||
                    `Welcome to ${company.name}. Explore official digital menus, opening hours, verified reviews, and customer orders.`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
