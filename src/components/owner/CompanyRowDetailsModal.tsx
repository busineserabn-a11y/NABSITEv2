import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Image,
  MapPin,
  Clock,
  Globe,
  GraduationCap,
  Sparkles,
  Check,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { CompanyCreationRow, DEFAULT_SCHOOL_FEATURES } from '../../types/companyCreation';
import { BUSINESS_CATEGORIES } from '../../data/themes';
import { Button } from '../ui/Button';
import { DayHours } from '../../types';

interface CompanyRowDetailsModalProps {
  row: CompanyCreationRow;
  rowIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRow: CompanyCreationRow) => void;
}

type TabKey =
  | 'basic'
  | 'contact'
  | 'branding'
  | 'location'
  | 'hours'
  | 'website'
  | 'category'
  | 'governance';

export const CompanyRowDetailsModal: React.FC<CompanyRowDetailsModalProps> = ({
  row,
  rowIndex,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanyCreationRow>({ ...row });
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  if (!isOpen) return null;

  const isSchool =
    (formData.category || '').toLowerCase() === 'school' ||
    (formData.category || '').toLowerCase() === 'education';

  const updateField = (field: keyof CompanyCreationRow, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const updateCategoryData = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      categoryData: {
        ...(prev.categoryData || {}),
        [field]: val,
      },
    }));
  };

  const updateSocial = (network: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [network]: val,
      },
    }));
  };

  const updateHour = (dayIndex: number, field: keyof DayHours, val: any) => {
    const updated = [...(formData.hours || [])];
    if (updated[dayIndex]) {
      updated[dayIndex] = { ...updated[dayIndex], [field]: val };
      setFormData((prev) => ({ ...prev, hours: updated }));
    }
  };

  const applyHoursPreset = (preset: 'standard' | 'extended' | 'allday') => {
    const base = [...(formData.hours || [])];
    const newHours = base.map((h) => {
      if (preset === 'standard') {
        const isWeekend = h.day === 'Saturday' || h.day === 'Sunday';
        return {
          ...h,
          isOpen: !isWeekend,
          openTime: '08:30',
          closeTime: '17:30',
          is24Hours: false,
        };
      }
      if (preset === 'extended') {
        return {
          ...h,
          isOpen: h.day !== 'Sunday',
          openTime: '08:00',
          closeTime: '21:00',
          is24Hours: false,
        };
      }
      return {
        ...h,
        isOpen: true,
        openTime: '00:00',
        closeTime: '23:59',
        is24Hours: true,
      };
    });
    setFormData((prev) => ({ ...prev, hours: newHours }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-500/20">
              #{rowIndex + 1}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {formData.name || 'New Company Row'}
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {formData.category || 'Uncategorized'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full text data entry for company profile, branding, contacts, hours, and category parameters.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/40 scrollbar-none text-xs font-semibold">
          {[
            { key: 'basic', label: 'Identity & Story', icon: Building2 },
            { key: 'contact', label: 'Contact & Social', icon: Phone },
            { key: 'branding', label: 'Branding URLs', icon: Image },
            { key: 'location', label: 'Location & Map', icon: MapPin },
            { key: 'hours', label: 'Business Hours', icon: Clock },
            { key: 'website', label: 'Website Content', icon: Globe },
            {
              key: 'category',
              label: isSchool ? 'School Academic Hub' : `${formData.category || 'Category'} Specific`,
              icon: isSchool ? GraduationCap : Sparkles,
            },
            { key: 'governance', label: 'Governance & Plan', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800/60 rounded-t-lg'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-900 dark:text-white">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Addis International Academy or Lucy Coffee"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Legal / Registered Business Name
                </label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => updateField('legalName', e.target.value)}
                  placeholder="e.g. Addis International Academy PLC"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short Display Name (for Stand Cards & Badges)
                </label>
                <input
                  type="text"
                  value={formData.shortName || ''}
                  onChange={(e) => updateField('shortName', e.target.value)}
                  placeholder="e.g. AIA or Lucy"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  URL Slug (/c/your-slug) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value.toLowerCase())}
                  placeholder="addis-international"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="School">School / Academic Institution</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subcategory / Specialization
                </label>
                <input
                  type="text"
                  value={formData.subcategory || ''}
                  onChange={(e) => updateField('subcategory', e.target.value)}
                  placeholder="e.g. K-12 Private School or Specialty Coffee Roaster"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Internal Reference Code / ID
                </label>
                <input
                  type="text"
                  value={formData.companyKey || ''}
                  onChange={(e) => updateField('companyKey', e.target.value)}
                  placeholder="e.g. COMP-1025"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short Tagline / Elevator Pitch
                </label>
                <input
                  type="text"
                  value={formData.shortDescription || ''}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="e.g. Inspiring tomorrow's leaders through holistic academic excellence."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Story & Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Comprehensive narrative describing the enterprise, founding story, mission, and unique offering..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & SOCIAL */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Secondary / Office Telephone
                </label>
                <input
                  type="tel"
                  value={formData.secondaryPhone || ''}
                  onChange={(e) => updateField('secondaryPhone', e.target.value)}
                  placeholder="+251 116 000 000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Official Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contact@enterprise.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Support / Inquiries Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="info@enterprise.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  WhatsApp Direct Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp || ''}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Telegram Username (without @)
                </label>
                <input
                  type="text"
                  value={formData.telegramUsername || ''}
                  onChange={(e) => updateField('telegramUsername', e.target.value.replace(/^@/, ''))}
                  placeholder="enterprise_official"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Existing External Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  placeholder="https://www.myenterprise.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Social Channels Sub-grid */}
              <div className="md:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Social Network Channels
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    placeholder="Facebook Page URL"
                    value={formData.socialLinks?.facebook || ''}
                    onChange={(e) => updateSocial('facebook', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="Instagram Profile URL"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={(e) => updateSocial('instagram', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="TikTok Channel URL"
                    value={formData.socialLinks?.tiktok || ''}
                    onChange={(e) => updateSocial('tiktok', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn Profile URL"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={(e) => updateSocial('linkedin', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="YouTube Channel URL"
                    value={formData.socialLinks?.youtube || ''}
                    onChange={(e) => updateSocial('youtube', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    placeholder="Twitter / X Profile URL"
                    value={formData.socialLinks?.twitter || ''}
                    onChange={(e) => updateSocial('twitter', e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & MEDIA */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Direct image URL inputs. Images load via CDN links without requiring manual file uploads.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo || ''}
                    onChange={(e) => updateField('logo', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {formData.logo && (
                    <div className="flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="w-12 h-12 object-cover rounded-md border border-slate-200"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/100x100?text=No+Image';
                        }}
                      />
                      <span className="text-xs text-slate-500 truncate">{formData.logo}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cover / Hero Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage || ''}
                    onChange={(e) => updateField('coverImage', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {formData.coverImage && (
                    <div className="relative h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/600x200?text=Cover+Image';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Main Showcase / Campus Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.mainImage || ''}
                    onChange={(e) => updateField('mainImage', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={formData.favicon || ''}
                    onChange={(e) => updateField('favicon', e.target.value)}
                    placeholder="https://.../favicon.ico"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Additional Gallery Image URLs (comma or newline separated)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.additionalImages || ''}
                    onChange={(e) => updateField('additionalImages', e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCATION & MAP */}
          {activeTab === 'location' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Street Address / Campus Coordinates
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="e.g. Bole Subcity, Woreda 03, House #142"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  City / Town
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Addis Ababa"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  State / Region / Zone
                </label>
                <input
                  type="text"
                  value={formData.stateRegion || ''}
                  onChange={(e) => updateField('stateRegion', e.target.value)}
                  placeholder="Shewa"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="Ethiopia"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.latitude || ''}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  placeholder="9.0105"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.longitude || ''}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  placeholder="38.7612"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Maps URL / Directions Link
                </label>
                <input
                  type="url"
                  value={formData.mapLink || ''}
                  onChange={(e) => updateField('mapLink', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 5: OPERATING HOURS */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Quick Timetable Presets:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyHoursPreset('standard')}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Office 8:30 - 17:30 (M-F)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHoursPreset('extended')}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Retail 8:00 - 21:00 (M-Sat)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHoursPreset('allday')}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    24/7 Everyday
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(formData.hours || []).map((h, idx) => (
                  <div key={h.day} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-36">
                      <input
                        type="checkbox"
                        id={`modal-hour-${idx}`}
                        checked={h.isOpen}
                        onChange={(e) => updateHour(idx, 'isOpen', e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                      />
                      <label
                        htmlFor={`modal-hour-${idx}`}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {h.day}
                      </label>
                    </div>

                    {h.isOpen ? (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Open:</span>
                          <input
                            type="time"
                            value={h.openTime}
                            onChange={(e) => updateHour(idx, 'openTime', e.target.value)}
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Close:</span>
                          <input
                            type="time"
                            value={h.closeTime}
                            onChange={(e) => updateHour(idx, 'closeTime', e.target.value)}
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-auto">
                          <input
                            type="checkbox"
                            checked={!!h.is24Hours}
                            onChange={(e) => updateHour(idx, 'is24Hours', e.target.checked)}
                            className="w-3.5 h-3.5 rounded"
                          />
                          24h Open
                        </label>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                        Closed All Day
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PUBLIC WEBSITE INFORMATION */}
          {activeTab === 'website' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Website Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.websiteHeroTitle || ''}
                  onChange={(e) => updateField('websiteHeroTitle', e.target.value)}
                  placeholder={`Welcome to ${formData.name || 'Our Company'}`}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hero Subtitle / Value Proposition
                </label>
                <textarea
                  rows={2}
                  value={formData.websiteHeroDescription || ''}
                  onChange={(e) => updateField('websiteHeroDescription', e.target.value)}
                  placeholder="The leading institution providing premier services and memorable experiences..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  About Us Section Narrative
                </label>
                <textarea
                  rows={3}
                  value={formData.websiteAboutText || ''}
                  onChange={(e) => updateField('websiteAboutText', e.target.value)}
                  placeholder="Founded with a vision of excellence, we specialize in delivering high-impact solutions..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Primary Call-To-Action Button Text
                </label>
                <input
                  type="text"
                  value={formData.websiteCtaText || ''}
                  onChange={(e) => updateField('websiteCtaText', e.target.value)}
                  placeholder="e.g. Enroll Now, Explore Menu, Book Appointment"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Call-To-Action Button Link / Target
                </label>
                <input
                  type="text"
                  value={formData.websiteCtaLink || ''}
                  onChange={(e) => updateField('websiteCtaLink', e.target.value)}
                  placeholder="#contact or /c/slug/menu"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 7: CATEGORY SPECIFIC (SCHOOL / RESTAURANT / HOTEL / CLINIC ETC) */}
          {activeTab === 'category' && (
            <div className="space-y-6">
              {isSchool ? (
                /* School Specific Inputs */
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Academic & Institutional Parameters
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Configure verified school credentials, curriculum standards, and operational features.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Curriculum System
                      </label>
                      <input
                        type="text"
                        value={formData.categoryData?.schoolCurriculum || ''}
                        onChange={(e) => updateCategoryData('schoolCurriculum', e.target.value)}
                        placeholder="e.g. National Curriculum (MoE) / Cambridge / IB"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Grade Levels Offered
                      </label>
                      <input
                        type="text"
                        value={formData.categoryData?.schoolGradeLevels || ''}
                        onChange={(e) => updateCategoryData('schoolGradeLevels', e.target.value)}
                        placeholder="e.g. KG to Grade 12 (Comprehensive)"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Academic Calendar Year
                      </label>
                      <input
                        type="text"
                        value={formData.categoryData?.schoolAcademicYear || ''}
                        onChange={(e) => updateCategoryData('schoolAcademicYear', e.target.value)}
                        placeholder="2026/2027"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Head of School / Principal Name
                      </label>
                      <input
                        type="text"
                        value={formData.categoryData?.schoolPrincipal || ''}
                        onChange={(e) => updateCategoryData('schoolPrincipal', e.target.value)}
                        placeholder="Dr. Alemu Bekele"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Admissions Office Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.categoryData?.schoolAdmissionsPhone || ''}
                        onChange={(e) => updateCategoryData('schoolAdmissionsPhone', e.target.value)}
                        placeholder="+251 911 223 344"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Admissions Inquiries Email
                      </label>
                      <input
                        type="email"
                        value={formData.categoryData?.schoolAdmissionsEmail || ''}
                        onChange={(e) => updateCategoryData('schoolAdmissionsEmail', e.target.value)}
                        placeholder="admissions@school.edu.et"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tuition & Scholarships Policy Note
                      </label>
                      <input
                        type="text"
                        value={formData.categoryData?.schoolTuitionNote || ''}
                        onChange={(e) => updateCategoryData('schoolTuitionNote', e.target.value)}
                        placeholder="Merit-based scholarships available for top 5% entrance exam performers."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* 10 School System Features */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Enable School Management System Features (10 Modules)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        { key: 'academicYears', label: 'Academic Years' },
                        { key: 'grades', label: 'Grades Structure' },
                        { key: 'sections', label: 'Sections Management' },
                        { key: 'globalSearch', label: 'Global Search' },
                        { key: 'studentRoster', label: 'Student Roster / Registration' },
                        { key: 'marklist', label: 'Marklist & Grading' },
                        { key: 'attendance', label: 'Class Attendance' },
                        { key: 'discipline', label: 'Discipline / Behavior' },
                        { key: 'schoolFaq', label: 'School FAQ' },
                        { key: 'announcements', label: 'School Announcements' },
                      ].map((feat) => {
                        const currentFeats = formData.schoolFeatures || DEFAULT_SCHOOL_FEATURES;
                        const isChecked = currentFeats[feat.key] !== false;
                        return (
                          <label
                            key={feat.key}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-500 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  schoolFeatures: {
                                    ...(prev.schoolFeatures || DEFAULT_SCHOOL_FEATURES),
                                    [feat.key]: e.target.checked,
                                  },
                                }));
                              }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {feat.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : formData.category === 'Restaurant' || formData.category === 'Café' ? (
                /* Restaurant / Cafe */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cuisine Style
                    </label>
                    <input
                      type="text"
                      value={formData.categoryData?.cuisineType || ''}
                      onChange={(e) => updateCategoryData('cuisineType', e.target.value)}
                      placeholder="e.g. Traditional Ethiopian, Italian, Continental"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Price Range
                    </label>
                    <select
                      value={formData.categoryData?.priceRange || '$$'}
                      onChange={(e) => updateCategoryData('priceRange', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="$">$ (Budget-friendly)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (Fine Dining)</option>
                      <option value="$$$$">$$$$ (Ultra Luxury)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Dining Modes
                    </label>
                    <input
                      type="text"
                      value={formData.categoryData?.diningOptions || ''}
                      onChange={(e) => updateCategoryData('diningOptions', e.target.value)}
                      placeholder="Dine-in, Takeaway, Home Delivery"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Signature Dish / Specialty
                    </label>
                    <input
                      type="text"
                      value={formData.categoryData?.specialtyDish || ''}
                      onChange={(e) => updateCategoryData('specialtyDish', e.target.value)}
                      placeholder="Special Tibs, Signature Macchiato, Woodfire Pizza"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : formData.category === 'Hotel' ? (
                /* Hotel */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Star Rating
                    </label>
                    <select
                      value={formData.categoryData?.starRating || 4}
                      onChange={(e) => updateCategoryData('starRating', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value={1}>1 Star</option>
                      <option value={2}>2 Star</option>
                      <option value={3}>3 Star</option>
                      <option value={4}>4 Star</option>
                      <option value={5}>5 Star Luxury</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Check-In & Check-Out Times
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.categoryData?.checkInTime || '14:00'}
                        onChange={(e) => updateCategoryData('checkInTime', e.target.value)}
                        placeholder="Check-in: 14:00"
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                      <input
                        type="text"
                        value={formData.categoryData?.checkOutTime || '11:00'}
                        onChange={(e) => updateCategoryData('checkOutTime', e.target.value)}
                        placeholder="Check-out: 11:00"
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Key Amenities
                    </label>
                    <input
                      type="text"
                      value={formData.categoryData?.amenitiesList || ''}
                      onChange={(e) => updateCategoryData('amenitiesList', e.target.value)}
                      placeholder="High-Speed Wi-Fi, Airport Shuttle, Spa & Sauna, Swimming Pool, Gym"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : formData.category === 'Healthcare' || (formData.category || '').toLowerCase() === 'clinic' ? (
                /* Clinic / Healthcare */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Medical Specialties Offered
                    </label>
                    <input
                      type="text"
                      value={formData.categoryData?.medicalSpecialties || ''}
                      onChange={(e) => updateCategoryData('medicalSpecialties', e.target.value)}
                      placeholder="e.g. General Medicine, Pediatrics, Dental Care, Diagnostics"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Appointment Booking URL
                    </label>
                    <input
                      type="url"
                      value={formData.categoryData?.appointmentBookingUrl || ''}
                      onChange={(e) => updateCategoryData('appointmentBookingUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="emergency-services-toggle"
                      checked={!!formData.categoryData?.emergencyServices}
                      onChange={(e) => updateCategoryData('emergencyServices', e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <label
                      htmlFor="emergency-services-toggle"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      24/7 Emergency Services Available
                    </label>
                  </div>
                </div>
              ) : (
                /* General Industry Notes */
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category Specific Notes / Special Configurations
                  </label>
                  <textarea
                    rows={4}
                    value={formData.categoryData?.industryNotes || ''}
                    onChange={(e) => updateCategoryData('industryNotes', e.target.value)}
                    placeholder="Provide any industry-specific qualifications, licenses, or custom parameters..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 8: GOVERNANCE & PLAN */}
          {activeTab === 'governance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="active">Active & Verified</option>
                  <option value="draft">Draft (Private)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Platform Tier / Plan
                </label>
                <select
                  value={formData.plan || 'business_pro'}
                  onChange={(e) => updateField('plan', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="business_starter">Business Starter</option>
                  <option value="business_pro">Business Pro (Recommended)</option>
                  <option value="enterprise">Enterprise VIP</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assigned Sub-Admin User ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.assignedAdminId || ''}
                  onChange={(e) => updateField('assignedAdminId', e.target.value)}
                  placeholder="e.g. usr_manager_12345"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400">
                  Can also be assigned anytime later in the Mastermind Sub-Admin Access Matrix.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" />
            Changes apply to row #{rowIndex + 1}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" icon={Check} onClick={handleSave}>
              Save Row Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
