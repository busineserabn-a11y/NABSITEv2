import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Flame,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Phone,
  Send,
  Share2,
  UtensilsCrossed,
  Eye,
  Info,
  ChefHat,
  Clock,
} from 'lucide-react';
import { Product, Company, DietaryTag } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MenuItemDetailModalProps {
  item: Product | null;
  categoryName?: string;
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
}

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({
  item,
  categoryName,
  company,
  isOpen,
  onClose,
  currency = 'ETB',
}) => {
  const [showChefMode, setShowChefMode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getDietaryBadge = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'vegetarian':
      case 'vegan':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Leaf className="w-3 h-3" /> {tag}
          </span>
        );
      case 'spicy':
      case 'hot':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3" /> Spicy
          </span>
        );
      case 'chef_choice':
      case 'chef choice':
      case 'popular':
      case 'favorite':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <ChefHat className="w-3 h-3" /> Chef&apos;s Special
          </span>
        );
      case 'halal':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            ✓ Halal
          </span>
        );
      case 'gluten_free':
      case 'gluten free':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            🌾 Gluten Free
          </span>
        );
      case 'new':
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            ★ New
          </span>
        );
      default:
        return (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            {tag}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Close Button */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
            title="Share item link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
          {/* High-Resolution Hero Food Photo */}
          <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 to-slate-900 text-amber-400">
                <UtensilsCrossed className="w-16 h-16 opacity-40" />
                <span className="text-xs font-bold uppercase tracking-wider mt-2 opacity-60">Delightful Dining</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

            {/* Category / Status Badges */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-xl backdrop-blur-md border border-amber-400/30 shadow-md">
                {categoryName || 'Chef Selection'}
              </span>
              {item.featured && (
                <span className="text-xs font-bold text-slate-950 bg-amber-400 px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                  ★ Popular Dish
                </span>
              )}
            </div>
          </div>

          {/* Item Details Container */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Title & Price */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {item.name}
              </h3>
              <div className="flex items-baseline gap-1 self-start sm:self-auto">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {item.price.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {item.currency || currency}
                </span>
              </div>
            </div>

            {/* Dietary Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.featured && getDietaryBadge('chef_choice')}
              {item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('veg') ? getDietaryBadge('vegetarian') : null}
              {item.name.toLowerCase().includes('chili') || item.name.toLowerCase().includes('spicy') || item.name.toLowerCase().includes('tibs') ? getDietaryBadge('spicy') : null}
              {getDietaryBadge('halal')}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dish Details & Preparation
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {item.description || 'Crafted with premium fresh ingredients by our culinary team, cooked to perfection for a rich, authentic flavor experience.'}
              </p>
            </div>

            {/* Staff / Chef Show Mode (Requested by user) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Dining In? Show this to Chef or Staff
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChefMode(!showChefMode)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 underline hover:no-underline"
                >
                  {showChefMode ? 'Standard View' : 'Highlight Card'}
                </button>
              </div>

              {showChefMode ? (
                <div className="p-3 rounded-xl bg-amber-500 text-slate-950 font-black text-center space-y-1 shadow-md">
                  <div className="text-lg uppercase tracking-wide">{item.name}</div>
                  <div className="text-sm font-extrabold opacity-90">1x Selection · {item.price.toLocaleString()} {item.currency || currency}</div>
                  <div className="text-[10px] uppercase font-bold tracking-widest bg-slate-950 text-amber-400 px-2 py-0.5 rounded-md inline-block">
                    Ready to Order
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/90 leading-normal">
                  Tap &apos;Highlight Card&apos; when pointing to this selection at your table or counter for quick order confirmation.
                </p>
              )}
            </div>

            {/* Freshness & Kitchen Info */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Availability</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Fresh in Kitchen</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Cook Time</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">12–18 mins approx</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {copied ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Link Copied!
              </span>
            ) : (
              <span>{company.name}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {company.telegramUsername && (
              <a
                href={`https://t.me/${company.telegramUsername}?text=${encodeURIComponent(`Hi, I'd like to order: ${item.name} (${item.price} ${item.currency || currency})`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
            )}
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Kitchen</span>
              </a>
            )}
            <Button size="sm" variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
