import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Search,
  X,
  Phone,
  Send,
  Clock,
  MapPin,
  Sparkles,
  QrCode,
  Share2,
  ChevronRight,
  Flame,
  Leaf,
  CheckCircle2,
  Info,
  Layers,
  ChefHat,
  Coffee,
  Wine,
  Sun,
  Moon,
} from 'lucide-react';
import { Company, Product, ProductCategory, Website, WebsiteConfig } from '../../types';
import { MenuItemDetailModal } from './MenuItemDetailModal';
import { CompanyName } from '../ui/CompanyName';

interface DigitalMenuRendererProps {
  company: Company;
  website?: Website | null;
  config?: WebsiteConfig;
  products: Product[];
  productCategories: ProductCategory[];
  onOpenQr?: () => void;
}

export const DigitalMenuRenderer: React.FC<DigitalMenuRendererProps> = ({
  company,
  website,
  config,
  products = [],
  productCategories = [],
  onOpenQr,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // Check Open/Closed status
  const isCurrentlyOpen = (): { open: boolean; text: string } => {
    if (!company.hours || company.hours.length === 0) return { open: true, text: 'Open Daily' };
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = company.hours.find((h) => h.day === days[now.getDay()]);
    if (!today || !today.isOpen) return { open: false, text: 'Closed Today' };

    try {
      const [oh, om] = (today.openTime || '08:00').split(':').map(Number);
      const [ch, cm] = (today.closeTime || '22:00').split(':').map(Number);
      const currentM = now.getHours() * 60 + now.getMinutes();
      const isOpen = currentM >= oh * 60 + om && currentM <= ch * 60 + cm;
      return {
        open: isOpen,
        text: isOpen ? `Open · Closes ${today.closeTime || '10:00 PM'}` : `Closed · Opens ${today.openTime || '8:00 AM'}`,
      };
    } catch {
      return { open: true, text: 'Open Now' };
    }
  };

  const status = isCurrentlyOpen();

  // Filter products by category and search
  const filteredItems = useMemo(() => {
    return products.filter((p) => {
      if (p.visibility === false) return false;
      const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleItemClick = (item: Product) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  // Group categories for fast navigation
  const activeCategoryName =
    selectedCategoryId === 'all'
      ? 'All Selections'
      : productCategories.find((c) => c.id === selectedCategoryId)?.name || 'Menu';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-24">
      {/* 1. RESTAURANT DIGITAL IDENTITY HEADER */}
      <header className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl shadow-amber-500/10 bg-slate-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg">
                  <UtensilsCrossed className="w-7 h-7" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                    DIGITAL MENU
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      status.open
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {status.text}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  <CompanyName name={company.name} maxWidth="max-w-[280px] sm:max-w-md" />
                </h1>
                {company.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{company.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors border border-slate-700 shadow-sm"
                  title="Call Restaurant"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {company.telegramUsername && (
                <a
                  href={`https://t.me/${company.telegramUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 flex items-center justify-center transition-colors border border-sky-500/30 shadow-sm"
                  title="Telegram Order"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tap any dish to view ingredients, high-res photos &amp; show to staff.</span>
            </span>
          </div>

          {/* 2. SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes, drinks, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. STICKY HORIZONTAL CATEGORY NAVIGATION */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 py-2.5 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border flex items-center gap-1.5 shrink-0 ${
              selectedCategoryId === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Items ({products.length})</span>
          </button>

          {productCategories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DIGITAL MENU ITEMS GRID */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>{activeCategoryName}</span>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {filteredItems.length} options
            </span>
          </h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No items found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No dishes or drinks match your current search &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
            >
              Show All Menu Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const catObj = productCategories.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-600">
                          <UtensilsCrossed className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        {item.featured ? (
                          <span className="text-[10px] font-extrabold text-slate-950 bg-amber-400 px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                            ★ Chef&apos;s Pick
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-300 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-800">
                            {catObj?.name || 'Dish'}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-amber-400/30">
                          Tap for Details
                        </span>
                      </div>

                      {/* Bottom Price in Image for mobile clarity */}
                      <div className="absolute bottom-2 left-3 right-3 flex items-baseline justify-between">
                        <span className="text-lg font-black text-amber-400 drop-shadow-md">
                          {item.price.toLocaleString()} <span className="text-xs font-semibold text-amber-200/80">{item.currency || 'ETB'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="p-4 pt-0">
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Available
                      </span>
                      <span className="font-bold text-amber-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        View Item <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. BOTTOM BAR / QUICK ASSISTANCE */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-300">
              <CompanyName name={company.name} maxWidth="max-w-[140px] sm:max-w-xs" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Kitchen</span>
              </a>
            )}
            {company.telegramUsername && (
              <a
                href={`https://t.me/${company.telegramUsername}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* 6. POPUP DETAIL MODAL (Opens upon tapping any meal/drink) */}
      <MenuItemDetailModal
        item={selectedItem}
        categoryName={productCategories.find((c) => c.id === selectedItem?.categoryId)?.name}
        company={company}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
};
