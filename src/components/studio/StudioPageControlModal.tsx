import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Home,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Settings2,
  Check,
  X,
  Edit2,
  HelpCircle,
  ArrowRight,
  Info,
  Power,
} from 'lucide-react';
import { PageConfig, PageRequirementType, Company } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { getCategoryDesignProfile } from '../../data/categoryProfiles';

interface StudioPageControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageConfig[];
  company: Company;
  onUpdatePages: (updatedPages: PageConfig[]) => void;
  onSelectPage?: (slug: string) => void;
}

export const StudioPageControlModal: React.FC<StudioPageControlModalProps> = ({
  isOpen,
  onClose,
  pages,
  company,
  onUpdatePages,
  onSelectPage,
}) => {
  const profile = getCategoryDesignProfile(company.category);
  const [editingSlugPageId, setEditingSlugPageId] = useState<string | null>(null);
  const [tempSlug, setTempSlug] = useState<string>('');
  const [slugError, setSlugError] = useState<string | null>(null);

  // New Custom Page Form
  const [newCustomOpen, setNewCustomOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTemplate, setNewPageTemplate] = useState('standard');

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const handleToggleEnabled = (pageId: string) => {
    const updated = pages.map((p) => {
      if (p.id !== pageId) return p;
      if (p.isHome) return p; // Home cannot be disabled
      const newEnabled = !(p.enabled !== false && p.isPublished !== false);
      return {
        ...p,
        enabled: newEnabled,
        isPublished: newEnabled,
        showInNavigation: newEnabled ? (p.showInNavigation !== false) : false,
      };
    });
    onUpdatePages(updated);
  };

  const handleToggleNavigation = (pageId: string) => {
    const updated = pages.map((p) => {
      if (p.id !== pageId) return p;
      const currentNav = p.showInNavigation !== false && !p.isHidden;
      return {
        ...p,
        showInNavigation: !currentNav,
        isHidden: currentNav,
      };
    });
    onUpdatePages(updated);
  };

  const startEditSlug = (p: PageConfig) => {
    if (p.isHome) return;
    setEditingSlugPageId(p.id);
    setTempSlug(p.slug);
    setSlugError(null);
  };

  const saveEditSlug = (pageId: string) => {
    const clean = tempSlug.trim().toLowerCase();
    if (!clean) {
      setSlugError('Slug cannot be empty.');
      return;
    }
    if (!slugRegex.test(clean)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and hyphens (e.g. "academics-2026").');
      return;
    }
    const exists = pages.some((p) => p.id !== pageId && p.slug === clean);
    if (exists) {
      setSlugError(`A page with slug "/${clean}" already exists.`);
      return;
    }

    const updated = pages.map((p) => (p.id === pageId ? { ...p, slug: clean } : p));
    onUpdatePages(updated);
    setEditingSlugPageId(null);
    setSlugError(null);
  };

  const handleCreateCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newPageTitle.trim();
    if (!title) return;
    const cleanSlug = (newPageSlug.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');

    if (!slugRegex.test(cleanSlug)) {
      setSlugError('Custom page slug must only contain lowercase letters, numbers, and single dashes.');
      return;
    }
    if (pages.some((p) => p.slug === cleanSlug)) {
      setSlugError(`Page slug "/${cleanSlug}" is already in use.`);
      return;
    }

    const newPage: PageConfig = {
      id: `page_${cleanSlug}_${Date.now().toString(36)}`,
      name: title,
      title: title,
      slug: cleanSlug,
      order: pages.length + 1,
      isHome: false,
      enabled: true,
      isPublished: true,
      requirementType: 'custom',
      showInNavigation: true,
      sections: [
        {
          id: `sec_hero_${cleanSlug}_1`,
          type: 'hero',
          order: 1,
          isVisible: true,
          title: title,
          subtitle: `Explore ${title} at ${company.name}.`,
        },
        {
          id: `sec_about_${cleanSlug}_2`,
          type: 'about',
          order: 2,
          isVisible: true,
          title: `About ${title}`,
          subtitle: `Information and highlights for our ${title.toLowerCase()} page.`,
        },
      ],
    };

    onUpdatePages([...pages, newPage]);
    setNewPageTitle('');
    setNewPageSlug('');
    setNewCustomOpen(false);
    setSlugError(null);
  };

  const getRequirementBadge = (p: PageConfig) => {
    if (p.isHome) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/20">
          Required
        </span>
      );
    }
    const type = p.requirementType || 'recommended';
    switch (type) {
      case 'recommended':
        return (
          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 font-extrabold text-[10px] uppercase tracking-wider border border-sky-500/20">
            Recommended ({company.category})
          </span>
        );
      case 'optional':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-700 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-wider border border-slate-500/20">
            Optional
          </span>
        );
      case 'custom':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] uppercase tracking-wider border border-purple-500/20">
            Custom Page
          </span>
        );
      default:
        return null;
    }
  };

  const enabledPagesCount = pages.filter((p) => p.enabled !== false && p.isPublished !== false).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Website Page Control & Structure"
      description={`Category pages are recommendations, not requirements. Enable only the pages and features ${company.name} actually needs.`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Zero Data Loss Policy:</span> Disabling a page removes it from the public site and header navigation, but keeps all section content safely saved in your draft.
          </div>
        </div>

        {slugError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{slugError}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Active Pages ({enabledPagesCount} of {pages.length} enabled)
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={Plus}
            onClick={() => setNewCustomOpen(!newCustomOpen)}
          >
            {newCustomOpen ? 'Cancel' : 'Add Custom Page'}
          </Button>
        </div>

        {/* New Custom Page Inline Form */}
        {newCustomOpen && (
          <form
            onSubmit={handleCreateCustomPage}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in-50"
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Create New Custom Page
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Page Title *"
                required
                placeholder="e.g. Scholarship & Grants"
                value={newPageTitle}
                onChange={(e) => {
                  setNewPageTitle(e.target.value);
                  if (!newPageSlug) {
                    setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }
                }}
              />
              <Input
                label="URL Slug (e.g. scholarships) *"
                required
                placeholder="scholarships"
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setNewCustomOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary" icon={Plus}>
                Create Page
              </Button>
            </div>
          </form>
        )}

        {/* Pages Control Table / Cards */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {pages.map((p) => {
            const isEnabled = p.enabled !== false && p.isPublished !== false;
            const isHome = !!p.isHome;
            const inNav = p.showInNavigation !== false && !p.isHidden && isEnabled;
            const isEditingSlug = editingSlugPageId === p.id;

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEnabled
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Page Title & Slug */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isHome ? (
                        <Home className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {p.name || p.title}
                      </h4>
                      {getRequirementBadge(p)}
                    </div>

                    {/* Slug line */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>URL:</span>
                      {isEditingSlug ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempSlug}
                            onChange={(e) => setTempSlug(e.target.value.toLowerCase())}
                            className="px-2 py-0.5 rounded border border-amber-500 bg-white dark:bg-slate-900 text-xs font-mono"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveEditSlug(p.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlugPageId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">/{p.slug}</span>
                          {!isHome && (
                            <button
                              type="button"
                              onClick={() => startEditSlug(p)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title="Edit URL Slug"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{p.sections?.length || 0} sections</span>
                    </div>
                  </div>

                  {/* Controls: Enabled Toggle & Navigation Toggle */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Navigation Toggle */}
                    <button
                      type="button"
                      disabled={!isEnabled}
                      onClick={() => handleToggleNavigation(p.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        inNav
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      } ${!isEnabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-amber-400'}`}
                      title={inNav ? 'Visible in Navigation' : 'Hidden from Navigation'}
                    >
                      {inNav ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{inNav ? 'In Nav' : 'Hidden'}</span>
                    </button>

                    {/* Enable / Disable Button */}
                    {isHome ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                        Always Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(p.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                          isEnabled
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & close */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[11px] text-slate-500">
            Changes apply instantly to your Studio workspace draft.
          </p>
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
