import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Home,
  GripVertical,
  Layers,
  Edit2,
  Check,
  X,
  Sparkles,
  Utensils,
  ShoppingBag,
  Star,
  Info,
  Phone,
  HelpCircle,
  Megaphone,
  Tag,
  Image,
  Sliders,
  Settings,
} from 'lucide-react';
import { WebsitePage } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StudioPagesSidebarProps {
  pages: WebsitePage[];
  activePageSlug: string;
  onSelectPage: (slug: string) => void;
  onOpenPageSettings?: (slug: string) => void;
  onOpenPageControl?: () => void;
  onAddPage: (page: { name: string; slug: string; title: string; template: string }) => void;
  onUpdatePage: (id: string, updates: Partial<WebsitePage>) => void;
  onDeletePage: (id: string) => void;
  onReorderPages: (pages: WebsitePage[]) => void;
}

const PAGE_TEMPLATES = [
  { id: 'custom', name: 'Custom Blank Page', icon: FileText, desc: 'Start with an empty page and add custom sections' },
  { id: 'menu', name: 'Digital Food Menu', icon: Utensils, desc: 'Food categories, dish photos, ingredients, dietary badges' },
  { id: 'store', name: 'Product Store / Catalog', icon: ShoppingBag, desc: 'Product items, search, filters, pricing and direct order' },
  { id: 'about', name: 'About & Heritage', icon: Info, desc: 'Story, founding team, vision, credentials and gallery' },
  { id: 'services', name: 'Services & Offerings', icon: Sparkles, desc: 'Service cards, packages, pricing tiers and inquiry form' },
  { id: 'reviews', name: 'Customer Reviews', icon: Star, desc: 'Verified guest feedback and rating submission form' },
  { id: 'offers', name: 'Special Offers & Deals', icon: Tag, desc: 'Promotions, discount coupons and limited-time specials' },
  { id: 'announcements', name: 'News & Announcements', icon: Megaphone, desc: 'Business updates, press releases and event notices' },
  { id: 'gallery', name: 'Photo Gallery', icon: Image, desc: 'High-resolution photo grid with lightbox modal' },
  { id: 'faq', name: 'FAQ & Questions', icon: HelpCircle, desc: 'Interactive accordion answers to common customer questions' },
  { id: 'contact', name: 'Contact & Location', icon: Phone, desc: 'Direct phone, telegram, map location and inquiry form' },
];

export const StudioPagesSidebar: React.FC<StudioPagesSidebarProps> = ({
  pages,
  activePageSlug,
  onSelectPage,
  onOpenPageSettings,
  onOpenPageControl,
  onAddPage,
  onUpdatePage,
  onDeletePage,
  onReorderPages,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleOpenAddModal = (templateId = 'custom') => {
    setSelectedTemplate(templateId);
    const tmpl = PAGE_TEMPLATES.find((t) => t.id === templateId);
    const defaultName = tmpl && tmpl.id !== 'custom' ? tmpl.name : '';
    setNewPageName(defaultName);
    setNewPageSlug(defaultName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    setIsAddModalOpen(true);
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;
    const finalSlug = (newPageSlug.trim() || newPageName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');
    onAddPage({
      name: newPageName.trim(),
      slug: finalSlug,
      title: newPageName.trim(),
      template: selectedTemplate,
    });
    setIsAddModalOpen(false);
    setNewPageName('');
    setNewPageSlug('');
  };

  const startRename = (page: WebsitePage) => {
    setEditingPageId(page.id);
    setEditName(page.name);
  };

  const saveRename = (page: WebsitePage) => {
    if (editName.trim() && editName.trim() !== page.name) {
      onUpdatePage(page.id, { name: editName.trim() });
    }
    setEditingPageId(null);
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderPages(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Pages Manager</h3>
          <p className="text-xs text-slate-500">{pages.length} pages total</p>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenPageControl && (
            <button
              type="button"
              onClick={onOpenPageControl}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1 border border-slate-700 shadow-sm transition-colors"
              title="Category Page Control & Enable/Disable"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenAddModal('custom')}
            className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            title="Add New Page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {pages.map((page, idx) => {
          const isActive = page.slug === activePageSlug;
          const isEditing = editingPageId === page.id;

          return (
            <div
              key={page.id}
              onClick={() => onSelectPage(page.slug)}
              className={`group rounded-2xl p-2.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-xs'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {page.isHome ? (
                    <Home className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(page);
                          if (e.key === 'Escape') setEditingPageId(null);
                        }}
                        autoFocus
                        className="w-full text-xs font-bold bg-slate-950 border border-amber-400 rounded-lg px-2 py-1 text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveRename(page)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPageId(null)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                          {page.name}
                        </span>
                        {page.isHome && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-1 rounded">
                            HOME
                          </span>
                        )}
                        {(page.enabled === false || page.isPublished === false) && (
                          <span className="text-[9px] font-bold bg-rose-950/80 border border-rose-800 text-rose-300 px-1 rounded">
                            DISABLED
                          </span>
                        )}
                        {page.isHidden && page.enabled !== false && (
                          <span className="text-[9px] font-bold bg-slate-700 text-slate-300 px-1 rounded">
                            HIDDEN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        /{page.slug} · {page.sections?.length || 0} sections
                      </span>
                    </div>
                  )}
                </div>

                {/* Page Action Icons */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  {onOpenPageSettings && (
                    <button
                      type="button"
                      onClick={() => onOpenPageSettings(page.slug)}
                      className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                      title="Page Layout & SEO Customizer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startRename(page)}
                    className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Rename Page"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdatePage(page.id, { isHidden: !page.isHidden })}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={page.isHidden ? 'Show in Navigation' : 'Hide from Navigation'}
                  >
                    {page.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {!page.isHome && (
                    <button
                      type="button"
                      onClick={() => onDeletePage(page.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Page Templates */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
          Add Preset Page
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenAddModal('menu')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-200 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">🍽 Menu</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('store')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-200 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">🛍 Store</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('about')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-200 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">ℹ️ About</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('reviews')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-200 transition-colors"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">⭐ Reviews</span>
          </button>
        </div>
      </div>

      {/* Add Page Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Website Page"
        description="Choose a page template or create a custom blank page."
      >
        <form onSubmit={handleCreatePage} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Page Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {PAGE_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      if (!newPageName || PAGE_TEMPLATES.some((t) => t.name === newPageName)) {
                        setNewPageName(tmpl.name);
                        setNewPageSlug(tmpl.id === 'custom' ? 'new-page' : tmpl.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{tmpl.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{tmpl.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Input
            label="Page Name *"
            required
            placeholder="e.g. Daily Specials"
            value={newPageName}
            onChange={(e) => {
              setNewPageName(e.target.value);
              setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
            }}
          />

          <Input
            label="Page URL Slug"
            placeholder="e.g. daily-specials"
            value={newPageSlug}
            onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
            helperText={`Public URL: /c/{slug}/${newPageSlug || 'page'}`}
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Plus}>
              Create Page
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
