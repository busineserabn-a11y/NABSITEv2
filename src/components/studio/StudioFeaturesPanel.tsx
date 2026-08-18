import React from 'react';
import {
  Sparkles,
  Utensils,
  ShoppingBag,
  Star,
  Tag,
  Megaphone,
  ShieldCheck,
  MapPin,
  Send,
  Phone,
  HelpCircle,
  Code,
  Layers,
  Gift,
} from 'lucide-react';
import { FEATURE_REGISTRY } from '../../data/features';

interface StudioFeaturesPanelProps {
  installedFeatures: (string | any)[];
  onToggleFeature: (featureId: string) => void;
}

const EXTENDED_FEATURES = [
  { id: 'feature_menu', name: 'Digital Food Menu & Detail Modals', icon: Utensils, desc: 'Interactive food dishes, allergen alerts, spice indicators & popups' },
  { id: 'feature_store', name: 'Product Store & Catalog', icon: ShoppingBag, desc: 'Full retail product showcase with search, filtering and prices' },
  { id: 'feature_reviews', name: 'Guest Reviews & Moderation', icon: Star, desc: 'Customer star ratings, testimonial submission and trust badge' },
  { id: 'feature_offers', name: 'Special Offers & Promotions', icon: Tag, desc: 'Discounts, coupon codes and limited-time banners' },
  { id: 'feature_announcements', name: 'Announcements & News', icon: Megaphone, desc: 'Broadcast business updates, seasonal events and holiday notices' },
  { id: 'feature_location', name: 'Interactive Map & Address', icon: MapPin, desc: 'Live map location, directions and physical address details' },
  { id: 'feature_call', name: 'Direct 1-Tap Calling', icon: Phone, desc: 'Prominent header and sticky call button for immediate phone contact' },
  { id: 'feature_telegram', name: 'Telegram Concierge', icon: Send, desc: 'Instant 1-tap Telegram message link with pre-filled inquiries' },
  { id: 'feature_faq', name: 'FAQ Accordion', icon: HelpCircle, desc: 'Expandable answers for customer inquiries and policies' },
  { id: 'feature_lucky_wheel', name: 'Lucky Wheel Promo Game', icon: Gift, desc: 'Gamified spin wheel offering customer discount coupons' },
  { id: 'feature_custom_html', name: 'Custom HTML Embeds', icon: Code, desc: 'Embed external widgets, reservation forms or custom styling' },
];

export const StudioFeaturesPanel: React.FC<StudioFeaturesPanelProps> = ({
  installedFeatures = [],
  onToggleFeature,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Features & Capabilities
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Enable or disable interactive modules across your website
        </p>
      </div>

      {/* Feature Switches List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
        {EXTENDED_FEATURES.map((feat) => {
          const Icon = feat.icon;
          const isEnabled = installedFeatures.some((f) =>
            typeof f === 'string' ? f === feat.id : f?.featureId === feat.id
          );

          return (
            <div
              key={feat.id}
              onClick={() => onToggleFeature(feat.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-white'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-2.5 rounded-xl ${isEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-slate-300'}`}>
                    {feat.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    {feat.desc}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
