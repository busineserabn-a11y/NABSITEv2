import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Palette,
  Type,
  Link2,
  Phone,
  Send,
  Plus,
  Trash2,
  HelpCircle,
  Image,
  Tag,
  Check,
  Sliders,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  LayoutTemplate,
  Star,
  Clock,
  MapPin,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { SectionConfig, SectionType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StudioSectionEditorProps {
  section: SectionConfig | null;
  onUpdate: (updates: Partial<SectionConfig>) => void;
  onClose: () => void;
}

export const StudioSectionEditor: React.FC<StudioSectionEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

  if (!section) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white border-l border-slate-800 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              BLOCK CUSTOMIZER
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              {section.type}
            </span>
          </div>
          <h3 className="text-xs font-black text-white truncate">
            {section.title || section.type.toUpperCase()}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 p-2 border-b border-slate-800 bg-slate-950/40">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'content'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'style'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Style & Spacing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'advanced'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Advanced
        </button>
      </div>

      {/* Editor Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* TAB 1: CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Title & Subtitle */}
            <div className="space-y-3">
              <Input
                label="Section Headline"
                placeholder="e.g. Our Signature Specialties"
                value={section.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />

              <Input
                label="Section Tagline / Subtitle"
                placeholder="e.g. Crafted daily with the finest ingredients"
                value={section.subtitle || ''}
                onChange={(e) => onUpdate({ subtitle: e.target.value })}
              />
            </div>

            {/* HERO SECTION BLOCK */}
            {section.type === 'hero' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Hero Banner Controls
                </span>

                <Input
                  label="Headline Highlight Badge"
                  placeholder="e.g. 🔥 Voted Addis' Best Coffee 2026"
                  value={section.badgeText || ''}
                  onChange={(e) => onUpdate({ badgeText: e.target.value })}
                />

                <Input
                  label="Background Cover Image URL"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={section.bgImageUrl || ''}
                  onChange={(e) => onUpdate({ bgImageUrl: e.target.value })}
                />

                {/* Primary CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <Input
                    label="Primary CTA Text"
                    placeholder="e.g. Explore Menu"
                    value={section.ctaText || ''}
                    onChange={(e) => onUpdate({ ctaText: e.target.value })}
                  />
                  <Input
                    label="Primary CTA URL"
                    placeholder="/menu or #sec_products"
                    value={section.ctaUrl || ''}
                    onChange={(e) => onUpdate({ ctaUrl: e.target.value })}
                  />
                </div>

                {/* Secondary CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    label="Secondary Button Text"
                    placeholder="e.g. Reserve Table / Call"
                    value={section.secondaryCtaText || ''}
                    onChange={(e) => onUpdate({ secondaryCtaText: e.target.value })}
                  />
                  <Input
                    label="Secondary Button URL"
                    placeholder="tel:+251911234567 or #contact"
                    value={section.secondaryCtaUrl || ''}
                    onChange={(e) => onUpdate({ secondaryCtaUrl: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* ABOUT SECTION BLOCK */}
            {section.type === 'about' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  About Story & Highlights
                </span>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Story Description / Heritage Paragraph
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell your brand story, traditions, and culinary passion..."
                    value={section.bodyContent || ''}
                    onChange={(e) => onUpdate({ bodyContent: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <Input
                  label="Founder / Story Photo URL"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={section.bgImageUrl || ''}
                  onChange={(e) => onUpdate({ bgImageUrl: e.target.value })}
                />
              </div>
            )}

            {/* PRODUCTS / MENU BLOCK */}
            {section.type === 'products' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Menu & Catalog Options
                </span>

                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                    <span>Show Category Filter Tabs</span>
                    <input
                      type="checkbox"
                      checked={section.showCategories !== false}
                      onChange={(e) => onUpdate({ showCategories: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                    <span>Show Search Bar</span>
                    <input
                      type="checkbox"
                      checked={section.showSearch !== false}
                      onChange={(e) => onUpdate({ showSearch: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                    <span>Display Prices & Currency</span>
                    <input
                      type="checkbox"
                      checked={section.showPrices !== false}
                      onChange={(e) => onUpdate({ showPrices: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* FAQ ACCORDION BLOCK */}
            {section.type === 'faq' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  FAQ Q&A Accordion
                </span>
                <p className="text-[11px] text-slate-500">
                  Answers to frequent questions about parking, reservations, catering, delivery, and payment options.
                </p>
              </div>
            )}

            {/* CUSTOM HTML BLOCK */}
            {section.type === 'custom_html' && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Custom HTML / Embed Snippet
                </span>
                <textarea
                  rows={8}
                  placeholder="<div><h3>Special Widget</h3><p>Custom HTML or embed code here</p></div>"
                  value={section.customHtml || ''}
                  onChange={(e) => onUpdate({ customHtml: e.target.value })}
                  className="w-full text-xs font-mono rounded-xl border border-slate-700 p-2.5 bg-slate-950 text-amber-300 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STYLE & SPACING */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Text Alignment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Text Alignment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'left', icon: AlignLeft, label: 'Left' },
                  { key: 'center', icon: AlignCenter, label: 'Center' },
                  { key: 'right', icon: AlignRight, label: 'Right' },
                ].map((al) => {
                  const Icon = al.icon;
                  const isSelected = (section.alignment || 'left') === al.key;
                  return (
                    <button
                      key={al.key}
                      type="button"
                      onClick={() => onUpdate({ alignment: al.key as any })}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{al.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Container Max-Width */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Container Width
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'contained', label: 'Standard (5xl)' },
                  { key: 'wide', label: 'Wide (7xl)' },
                  { key: 'full', label: 'Full Width' },
                ].map((cw) => (
                  <button
                    key={cw.key}
                    type="button"
                    onClick={() => onUpdate({ containerWidth: cw.key as any })}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      (section.containerWidth || 'contained') === cw.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {cw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Spacing / Padding */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Section Padding Spacing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'compact', label: 'Compact' },
                  { key: 'normal', label: 'Normal' },
                  { key: 'generous', label: 'Spacious' },
                ].map((pad) => (
                  <button
                    key={pad.key}
                    type="button"
                    onClick={() => onUpdate({ padding: pad.key as any })}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      (section.padding || 'normal') === pad.key
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {pad.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Overrides */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <h5 className="text-xs font-bold text-white">Custom Block Colors</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Background Color Hex"
                  placeholder="e.g. #1E293B"
                  value={section.customBgColor || ''}
                  onChange={(e) => onUpdate({ customBgColor: e.target.value })}
                />
                <Input
                  label="Text Color Hex"
                  placeholder="e.g. #FFFFFF"
                  value={section.customTextColor || ''}
                  onChange={(e) => onUpdate({ customTextColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Anchor ID & Developer Attributes
              </h4>
              <p className="text-[11px] text-slate-500">
                Set custom HTML ID for one-click smooth scrolling from navigation links.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Section Anchor ID (#anchor)"
                placeholder="e.g. special-offers or reviews"
                value={section.anchorId || section.id}
                onChange={(e) =>
                  onUpdate({
                    anchorId: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                  })
                }
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Nav links targeting #{section.anchorId || section.id} will smoothly scroll to this block.
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <span>Section Visibility</span>
                <input
                  type="checkbox"
                  checked={section.isVisible !== false}
                  onChange={(e) => onUpdate({ isVisible: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
