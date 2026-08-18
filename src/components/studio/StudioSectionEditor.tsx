import React from 'react';
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
  if (!section) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white border-l border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            SECTION SETTINGS
          </span>
          <h3 className="text-sm font-black text-white truncate">
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

      {/* Editor Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Title & Subtitle */}
        <div className="space-y-3">
          <Input
            label="Section Title"
            placeholder="e.g. Our Signature Specialties"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />

          <Input
            label="Section Subtitle / Tagline"
            placeholder="e.g. Crafted daily with organic ingredients"
            value={section.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
          />
        </div>

        {/* Section Type Specific Settings */}
        {section.type === 'hero' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Hero Section Controls
            </span>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hero Alignment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ alignment: 'left' })}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                    section.alignment !== 'center'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Left-Aligned
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ alignment: 'center' })}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                    section.alignment === 'center'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Centered
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Primary Call to Action Button
              </label>
              <Input
                label="CTA Button Text"
                placeholder="e.g. View Digital Menu"
                value={section.ctaText || ''}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
              />
              <Input
                label="CTA Button Link"
                placeholder="e.g. /menu or #products or tel:+251911000000"
                value={section.ctaLink || ''}
                onChange={(e) => onUpdate({ ctaLink: e.target.value })}
              />
            </div>
          </div>
        )}

        {section.type === 'about' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              About Content
            </span>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Story & Details
              </label>
              <textarea
                rows={5}
                value={section.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Share your business origin, culinary philosophy, or company mission..."
                className="w-full text-xs rounded-xl border border-slate-700 p-3 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        )}

        {section.type === 'products' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Food Menu & Catalog Display
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              This section automatically renders items from your Menu & Store Builder, including instant search, category filters, dietary tags, and popup details.
            </p>
          </div>
        )}

        {section.type === 'custom_html' && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Custom HTML & Embed
            </span>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                HTML Embed Code
              </label>
              <textarea
                rows={8}
                value={section.customHtml || ''}
                onChange={(e) => onUpdate({ customHtml: e.target.value })}
                placeholder="<div><h3>Custom Widget</h3><p>Sandboxed HTML content</p></div>"
                className="w-full font-mono text-xs rounded-xl border border-slate-700 p-3 bg-slate-950 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        )}

        {/* Visibility toggle */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200">Section Visibility</span>
            <p className="text-[11px] text-slate-400">Control whether this section appears on live website</p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ isVisible: section.isVisible === false ? true : false })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              section.isVisible !== false
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {section.isVisible !== false ? 'Visible' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done Editing
        </Button>
      </div>
    </div>
  );
};
