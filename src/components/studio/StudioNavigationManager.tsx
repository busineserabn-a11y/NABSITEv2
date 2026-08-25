import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Sparkles,
  Layers,
  Settings,
  Phone,
  Send,
  Sliders,
  Check,
  Globe,
  Tag,
  Share2,
  ChevronRight,
  Hash,
  FileText,
  MousePointerClick,
  LayoutTemplate,
} from 'lucide-react';
import { HeaderConfig, NavItem, WebsitePage, Company } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { buildPublicUrl } from '../../lib/urls';

interface StudioNavigationManagerProps {
  company: Company;
  header: HeaderConfig;
  navigation: NavItem[];
  pages: WebsitePage[];
  onUpdateHeader: (updates: Partial<HeaderConfig>) => void;
  onUpdateNavigation: (newNav: NavItem[]) => void;
}

export const StudioNavigationManager: React.FC<StudioNavigationManagerProps> = ({
  company,
  header,
  navigation = [],
  pages = [],
  onUpdateHeader,
  onUpdateNavigation,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'header' | 'banner'>('menu');
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);

  // Add new navigation link
  const handleAddLink = () => {
    const newId = `nav_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newItem: NavItem = {
      id: newId,
      label: 'New Link',
      type: 'page',
      target: pages[0]?.slug || 'home',
      url: `/c/${company.slug}`,
      targetBlank: false,
      order: navigation.length + 1,
      badge: '',
    };
    onUpdateNavigation([...navigation, newItem]);
    setEditingItem(newItem);
  };

  // Update existing link
  const handleUpdateItem = (id: string, updates: Partial<NavItem>) => {
    const updated = navigation.map((item) => {
      if (item.id === id) {
        const next = { ...item, ...updates };
        // Auto update computed URL if type is page
        if (updates.type === 'page' && updates.target) {
          next.url = updates.target === 'home' ? `/c/${company.slug}` : `/c/${company.slug}/${updates.target}`;
        }
        return next;
      }
      return item;
    });
    onUpdateNavigation(updated);
    if (editingItem && editingItem.id === id) {
      setEditingItem((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Delete link
  const handleDeleteItem = (id: string) => {
    onUpdateNavigation(navigation.filter((n) => n.id !== id));
    if (editingItem?.id === id) setEditingItem(null);
  };

  // Reorder
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= navigation.length) return;
    const items = [...navigation];
    const [moved] = items.splice(index, 1);
    items.splice(target, 0, moved);
    const reindexed = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    onUpdateNavigation(reindexed);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Sub-tabs */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Navigation Links ({navigation.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'header'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Header Style</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'banner'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Announcement Bar</span>
          </button>
        </div>

        {activeTab === 'menu' && (
          <button
            type="button"
            onClick={handleAddLink}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Link</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* TAB 1: MENU LINKS */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Header & Mobile Menu Links
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manage main navigation links, internal pages, custom external URLs, and badges.
                </p>
              </div>
            </div>

            {/* Links List */}
            <div className="space-y-2">
              {navigation.map((item, idx) => {
                const isSelected = editingItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-3 flex items-center justify-between gap-3">
                      {/* Left: Move handles & label */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === navigation.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div
                          className="cursor-pointer min-w-0"
                          onClick={() => setEditingItem(isSelected ? null : item)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize font-mono text-amber-400/80">
                              {item.type || 'page'}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[180px] font-mono text-slate-400">
                              {item.type === 'page'
                                ? `Page: /${item.target || 'home'}`
                                : item.type === 'anchor'
                                ? `Anchor: #${item.target}`
                                : item.url || '/'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingItem(isSelected ? null : item)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {isSelected ? 'Done' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-xl bg-slate-700 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete navigation link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Editor Form */}
                    {isSelected && (
                      <div className="p-4 border-t border-slate-700/60 bg-slate-900/80 space-y-3.5 rounded-b-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Link Label *"
                            placeholder="e.g. Menu, About, Book Table"
                            value={item.label}
                            onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                          />

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Link Target Type
                            </label>
                            <select
                              value={item.type || 'page'}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  type: e.target.value as any,
                                  target: e.target.value === 'page' ? (pages[0]?.slug || 'home') : '',
                                })
                              }
                              className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-white focus:border-amber-500 focus:outline-none"
                            >
                              <option value="page">Internal Studio Page</option>
                              <option value="anchor">Section Anchor (#section)</option>
                              <option value="custom">Custom External URL</option>
                            </select>
                          </div>
                        </div>

                        {/* Page Selector */}
                        {item.type === 'page' && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Select Target Page
                            </label>
                            <select
                              value={item.target || 'home'}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  target: e.target.value,
                                  url: e.target.value === 'home' ? `/c/${company.slug}` : `/c/${company.slug}/${e.target.value}`,
                                })
                              }
                              className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-white focus:border-amber-500 focus:outline-none font-medium"
                            >
                              {pages.map((p) => (
                                <option key={p.id} value={p.slug}>
                                  {p.name} (/{p.slug}) {p.isHome ? '— [Homepage]' : ''}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Canonical: {buildPublicUrl(company.slug, item.target === 'home' ? undefined : item.target)}
                            </p>
                          </div>
                        )}

                        {/* Anchor Selector */}
                        {item.type === 'anchor' && (
                          <Input
                            label="Anchor ID (e.g. special-offers or sec_products)"
                            placeholder="special-offers"
                            value={item.target || ''}
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                target: e.target.value.replace(/^#/, ''),
                                url: `#${e.target.value.replace(/^#/, '')}`,
                              })
                            }
                          />
                        )}

                        {/* Custom URL Input */}
                        {(item.type === 'custom_url' || item.type === 'external') && (
                          <div className="space-y-1.5">
                            <Input
                              label="Custom Destination URL"
                              placeholder="https://t.me/yourrestaurant"
                              value={item.target || item.url || ''}
                              onChange={(e) => handleUpdateItem(item.id, { target: e.target.value, url: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-400">
                              Supports absolute URLs (https://...), Telegram links, or WhatsApp links.
                            </p>
                          </div>
                        )}

                        {/* Badges and New Tab */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <Input
                            label="Highlight Badge (Optional)"
                            placeholder="e.g. HOT, NEW, 20% OFF"
                            value={item.badge || ''}
                            onChange={(e) => handleUpdateItem(item.id, { badge: e.target.value })}
                          />

                          <div className="flex items-center space-x-2 pt-6">
                            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.targetBlank || false}
                                onChange={(e) => handleUpdateItem(item.id, { targetBlank: e.target.checked })}
                                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                              />
                              <span>Open link in new tab (_blank)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: HEADER STYLING */}
        {activeTab === 'header' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Header Layout & Behavior
              </h4>
              <p className="text-[11px] text-slate-500">
                Customize desktop & mobile navigation bar layout, stickiness, branding and CTA buttons.
              </p>
            </div>

            {/* Header Style presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigation Bar Layout Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'standard', name: 'Standard Solid', desc: 'Classic full-width header' },
                  { key: 'floating', name: 'Floating Pill', desc: 'Modern detached pill bar' },
                  { key: 'minimal', name: 'Minimalist Clean', desc: 'Subtle borders and compact height' },
                  { key: 'centered', name: 'Centered Brand', desc: 'Centered logo with split menu' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => onUpdateHeader({ style: st.key as any })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      header.style === st.key
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{st.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/80 space-y-3">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <span>Sticky Navigation (Fixed on scroll)</span>
                <input
                  type="checkbox"
                  checked={header.sticky !== false}
                  onChange={(e) => onUpdateHeader({ sticky: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <span>Transparent over Hero Banner (Homepage)</span>
                <input
                  type="checkbox"
                  checked={header.transparentOnHero || false}
                  onChange={(e) => onUpdateHeader({ transparentOnHero: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <span>Display Business Brand Name next to Logo</span>
                <input
                  type="checkbox"
                  checked={header.showCompanyName !== false}
                  onChange={(e) => onUpdateHeader({ showCompanyName: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Header Action CTA Button */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">Header Action Button (CTA)</h5>
                  <p className="text-[10px] text-slate-400">Prominent button displayed on top right of navigation</p>
                </div>
                <input
                  type="checkbox"
                  checked={header.showCtaBtn !== false}
                  onChange={(e) => onUpdateHeader({ showCtaBtn: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </div>

              {header.showCtaBtn !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Input
                    label="Button Text"
                    placeholder="e.g. Order Online, Book Table, Call"
                    value={header.ctaLabel || 'Order Now'}
                    onChange={(e) => onUpdateHeader({ ctaLabel: e.target.value })}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Button Action
                    </label>
                    <select
                      value={header.ctaAction || 'menu'}
                      onChange={(e) => onUpdateHeader({ ctaAction: e.target.value as any })}
                      className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="menu">Open Digital Menu (/menu)</option>
                      <option value="phone">Direct Phone Call</option>
                      <option value="telegram">Open Telegram Chat</option>
                      <option value="url">Custom External URL</option>
                    </select>
                  </div>

                  {(header.ctaAction === 'url' || (header.ctaAction as string) === 'custom') && (
                    <div className="sm:col-span-2">
                      <Input
                        label="Custom Destination URL"
                        placeholder="https://..."
                        value={header.ctaUrl || ''}
                        onChange={(e) => onUpdateHeader({ ctaUrl: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANNOUNCEMENT BAR */}
        {activeTab === 'banner' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Top Announcement Ribbon
              </h4>
              <p className="text-[11px] text-slate-500">
                Display special announcements, seasonal offers, or holiday hours at the very top of the page.
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-200 cursor-pointer">
                <span>Enable Announcement Banner</span>
                <input
                  type="checkbox"
                  checked={header.announcementBanner?.enabled || false}
                  onChange={(e) =>
                    onUpdateHeader({
                      announcementBanner: {
                        ...(header.announcementBanner || { text: '' }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              {header.announcementBanner?.enabled && (
                <div className="space-y-3 pt-2">
                  <Input
                    label="Announcement Text *"
                    placeholder="🔥 Enjoy 20% discount on all family platters this weekend!"
                    value={header.announcementBanner?.text || ''}
                    onChange={(e) =>
                      onUpdateHeader({
                        announcementBanner: {
                          ...(header.announcementBanner || { enabled: true, text: '' }),
                          text: e.target.value,
                        },
                      })
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Action Link Label (Optional)"
                      placeholder="e.g. Claim Now →"
                      value={header.announcementBanner?.actionText || ''}
                      onChange={(e) =>
                        onUpdateHeader({
                          announcementBanner: {
                            ...(header.announcementBanner || { enabled: true, text: '' }),
                            actionText: e.target.value,
                          },
                        })
                      }
                    />

                    <Input
                      label="Action Link URL (Optional)"
                      placeholder="/menu or #special-offers"
                      value={header.announcementBanner?.actionUrl || ''}
                      onChange={(e) =>
                        onUpdateHeader({
                          announcementBanner: {
                            ...(header.announcementBanner || { enabled: true, text: '' }),
                            actionUrl: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Background Color</label>
                      <input
                        type="color"
                        value={header.announcementBanner?.bgColor || '#B91C1C'}
                        onChange={(e) =>
                          onUpdateHeader({
                            announcementBanner: {
                              ...(header.announcementBanner || { enabled: true, text: '' }),
                              bgColor: e.target.value,
                            },
                          })
                        }
                        className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-400">Text Color</label>
                      <input
                        type="color"
                        value={header.announcementBanner?.textColor || '#FFFFFF'}
                        onChange={(e) =>
                          onUpdateHeader({
                            announcementBanner: {
                              ...(header.announcementBanner || { enabled: true, text: '' }),
                              textColor: e.target.value,
                            },
                          })
                        }
                        className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
