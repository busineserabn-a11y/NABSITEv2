import React, { useState } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  EyeOff,
  Edit2,
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
  MapPin,
  Clock,
  Code,
  LayoutTemplate,
} from 'lucide-react';
import { SectionConfig, SectionType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface StudioSectionsManagerProps {
  sections: SectionConfig[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onAddSection: (type: SectionType) => void;
  onUpdateSection: (id: string, updates: Partial<SectionConfig>) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (sections: SectionConfig[]) => void;
}

const SECTION_CATALOG: { type: SectionType; name: string; icon: any; desc: string }[] = [
  { type: 'hero', name: 'Hero Banner', icon: LayoutTemplate, desc: 'Large prominent title, tagline, cover photo & CTA buttons' },
  { type: 'about', name: 'About & Heritage', icon: Info, desc: 'Company history, mission statement, values and founder story' },
  { type: 'products', name: 'Food Menu / Products', icon: Utensils, desc: 'Live dishes or product catalog with search & dietary tags' },
  { type: 'categories', name: 'Category Showcase', icon: Layers, desc: 'Visual grid of popular categories and collection cards' },
  { type: 'offers', name: 'Special Offers & Deals', icon: Tag, desc: 'Discount banners, promo coupon codes, and bundle specials' },
  { type: 'announcements', name: 'News & Announcements', icon: Megaphone, desc: 'Official updates, upcoming events and new menu arrivals' },
  { type: 'reviews', name: 'Customer Reviews', icon: Star, desc: 'Verified guest ratings, testimonials and review modal' },
  { type: 'faq', name: 'FAQ Accordion', icon: HelpCircle, desc: 'Frequently asked questions with expandable answer tabs' },
  { type: 'gallery', name: 'Photo Gallery', icon: Image, desc: 'High-resolution photo showcase with zoom modal' },
  { type: 'hours', name: 'Business Schedule', icon: Clock, desc: 'Official opening hours and live open/closed badge' },
  { type: 'map', name: 'Map & Location', icon: MapPin, desc: 'Physical address, interactive Google map pin and directions' },
  { type: 'contact', name: 'Contact & Inquiry', icon: Phone, desc: 'Direct phone, telegram, email and customer inquiry form' },
  { type: 'custom_html', name: 'Custom HTML Block', icon: Code, desc: 'Sandboxed custom embed widget or custom layout' },
];

export const StudioSectionsManager: React.FC<StudioSectionsManagerProps> = ({
  sections = [],
  activeSectionId,
  onSelectSection,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getSectionIcon = (type: SectionType) => {
    const item = SECTION_CATALOG.find((c) => c.type === type);
    return item?.icon || Layers;
  };

  const getSectionTitle = (sec: SectionConfig) => {
    if (sec.title) return sec.title;
    const item = SECTION_CATALOG.find((c) => c.type === sec.type);
    return item?.name || sec.type.toUpperCase();
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onReorderSections(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Page Sections</h3>
          <p className="text-xs text-slate-500">{sections.length} sections on this page</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Section</span>
        </button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {sections.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-3">
            <Layers className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-300">No sections on this page yet</p>
            <p className="text-[11px] text-slate-500">
              Click below to add your first content section (Hero, Menu, About, etc.).
            </p>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Section
            </Button>
          </div>
        ) : (
          sections.map((sec, idx) => {
            const Icon = getSectionIcon(sec.type);
            const isSelected = sec.id === activeSectionId;
            const isVisible = sec.isVisible !== false;

            return (
              <div
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`group rounded-2xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                } ${!isVisible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300 font-extrabold' : 'text-white'}`}>
                          {getSectionTitle(sec)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                        {sec.type} · Section #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Reorder, Visibility, Delete */}
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSection(sec.id, { isVisible: !isVisible })}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title={isVisible ? 'Hide Section' : 'Show Section'}
                    >
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSection(sec.id)}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Section Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Content Section"
        description="Select a section block to insert into this page."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {SECTION_CATALOG.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                onClick={() => {
                  onAddSection(item.type);
                  setIsAddModalOpen(false);
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 cursor-pointer transition-all flex items-start gap-3 group active:scale-[0.98]"
              >
                <div className="p-2.5 rounded-xl bg-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};
