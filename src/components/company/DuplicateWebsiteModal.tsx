import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
  Utensils,
  Megaphone,
  Tag,
  ArrowRight,
  ExternalLink,
  Loader2,
  Building2,
  Globe,
  GraduationCap,
  Calendar,
  DoorOpen,
  Search,
  Users,
  FileCheck2,
  CalendarCheck,
  ShieldAlert,
  HelpCircle,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { api, generateSlug } from '../../lib/api';
import {
  Company,
  Website,
  SchoolFeatureKey,
  SCHOOL_FEATURE_DEFINITIONS,
  DEFAULT_SCHOOL_FEATURES,
} from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface DuplicateWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCompany: Company | null;
  sourceWebsite?: Website | null;
  onSuccess?: (newCompany: Company, newWebsite: Website) => void;
}

export const DuplicateWebsiteModal: React.FC<DuplicateWebsiteModalProps> = ({
  isOpen,
  onClose,
  sourceCompany,
  sourceWebsite,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanySlug, setNewCompanySlug] = useState('');

  // General Options
  const [copyMenuContent, setCopyMenuContent] = useState(true);
  const [copyAnnouncements, setCopyAnnouncements] = useState(true);
  const [copyOffers, setCopyOffers] = useState(true);

  // School Feature Checkboxes (10 Features)
  const [schoolFeatures, setSchoolFeatures] = useState<Record<SchoolFeatureKey, boolean>>({
    ...DEFAULT_SCHOOL_FEATURES,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    company: Company;
    website: Website;
    productsCount?: number;
    categoriesCount?: number;
  } | null>(null);

  const isSchool =
    sourceCompany?.category === 'School' ||
    sourceCompany?.subcategory === 'School' ||
    !!sourceCompany?.schoolFeatures ||
    sourceCompany?.id.includes('school') ||
    sourceCompany?.slug.includes('school');

  useEffect(() => {
    if (sourceCompany) {
      const defaultName = `${sourceCompany.name} (Copy)`;
      const defaultSlug = generateSlug(`${sourceCompany.slug}-copy`);
      setNewCompanyName(defaultName);
      setNewCompanySlug(defaultSlug);
      setError(null);
      setCompletedResult(null);

      // Initialize school features from source or default
      if (sourceCompany.schoolFeatures) {
        setSchoolFeatures({
          ...DEFAULT_SCHOOL_FEATURES,
          ...(sourceCompany.schoolFeatures as Record<SchoolFeatureKey, boolean>),
        });
      } else {
        setSchoolFeatures({ ...DEFAULT_SCHOOL_FEATURES });
      }
    }
  }, [sourceCompany, isOpen]);

  const handleNameChange = (name: string) => {
    setNewCompanyName(name);
    if (!newCompanySlug || newCompanySlug === generateSlug(`${sourceCompany?.slug}-copy`)) {
      setNewCompanySlug(generateSlug(name));
    }
  };

  const toggleSchoolFeature = (key: SchoolFeatureKey) => {
    setSchoolFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAllSchoolFeatures = (enable: boolean) => {
    const updated = { ...schoolFeatures };
    (Object.keys(updated) as SchoolFeatureKey[]).forEach((k) => {
      updated[k] = enable;
    });
    setSchoolFeatures(updated);
  };

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCompany) return;
    if (!newCompanyName.trim()) {
      setError('Please provide a name for the duplicated company website.');
      return;
    }
    const cleanSlug = generateSlug(newCompanySlug.trim() || newCompanyName.trim());
    if (!cleanSlug) {
      setError('A valid URL slug is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.duplicateCompanyAndWebsite({
        sourceCompanyId: sourceCompany.id,
        newCompanyName: newCompanyName.trim(),
        newCompanySlug: cleanSlug,
        copyMenuContent: isSchool ? false : copyMenuContent,
        copyAnnouncements: isSchool ? schoolFeatures.announcements : copyAnnouncements,
        copyOffers: isSchool ? false : copyOffers,
        copySchoolFaq: isSchool ? schoolFeatures.school_faq : false,
        schoolFeatures: isSchool ? schoolFeatures : undefined,
      });

      setCompletedResult({
        company: result.company,
        website: result.website,
        productsCount: result.duplicatedProductsCount,
        categoriesCount: result.duplicatedCategoriesCount,
      });

      if (onSuccess) {
        onSuccess(result.company, result.website);
      }
    } catch (err: any) {
      console.error('Duplication failed:', err);
      setError(err.message || 'Failed to duplicate website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!sourceCompany) return null;

  const getFeatureIcon = (key: SchoolFeatureKey) => {
    switch (key) {
      case 'academic_years':
        return <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'grades':
        return <Layers className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'sections':
        return <DoorOpen className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'global_search':
        return <Search className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'student_roster':
        return <Users className="w-4 h-4 text-teal-500 shrink-0" />;
      case 'marklist':
        return <FileCheck2 className="w-4 h-4 text-violet-500 shrink-0" />;
      case 'class_attendance':
        return <CalendarCheck className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'discipline_behavior':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'school_faq':
        return <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'announcements':
        return <Megaphone className="w-4 h-4 text-orange-500 shrink-0" />;
      default:
        return <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isSchool ? 'Duplicate School Website' : 'Duplicate Company Website'}
      description={
        isSchool
          ? `Create an independent copy of "${sourceCompany.name}" with its full website layout, design, and selected school features.`
          : `Create an independent copy of "${sourceCompany.name}" with its complete design, navigation, and structure.`
      }
    >
      {completedResult ? (
        <div className="space-y-6 py-2">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-300">
              {isSchool ? 'School Website Duplication Complete!' : 'Website Duplication Complete!'}
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
              An independent Firestore website and company document have been created for{' '}
              <span className="font-bold">{completedResult.company.name}</span>. Modifying this copy will never affect the original school or website.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>New School/Company ID:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{completedResult.company.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Public Website URL:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">/c/{completedResult.company.slug}</span>
            </div>
            {isSchool && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Independent database created: Student, marklist, and attendance records start fresh and empty.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isSchool ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={GraduationCap}
                  onClick={() => {
                    onClose();
                    navigate(`/owner/schools/${completedResult.company.id}`);
                  }}
                >
                  Open School Academic Hub
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  icon={Sparkles}
                  onClick={() => {
                    onClose();
                    navigate(`/studio/${completedResult.company.id}`);
                  }}
                >
                  Website Studio
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={Sparkles}
                  onClick={() => {
                    onClose();
                    navigate(`/studio/${completedResult.company.id}`);
                  }}
                >
                  Open in Website Studio
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  icon={Building2}
                  onClick={() => {
                    onClose();
                    navigate(`/company/${completedResult.company.id}`);
                  }}
                >
                  Go to Company Hub
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleDuplicate} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source Info Card */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                {isSchool ? <GraduationCap className="w-3.5 h-3.5" /> : null}
                Source {isSchool ? 'School Website' : 'Website'}
              </span>
              <Badge variant="gold" size="sm">
                {sourceCompany.category}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {sourceCompany.logo ? (
                <img
                  src={sourceCompany.logo}
                  alt={sourceCompany.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-200 dark:border-amber-900"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center">
                  {sourceCompany.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {sourceCompany.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">/c/{sourceCompany.slug}</p>
              </div>
            </div>
          </div>

          {/* Target Company Name & Slug */}
          <div className="space-y-3">
            <Input
              label={isSchool ? 'New School Name *' : 'New Company / Website Name *'}
              required
              placeholder={isSchool ? 'e.g. Future Generation Academy - Branch 2' : 'e.g. Blue Nile Café - Bole Branch'}
              value={newCompanyName}
              onChange={(e) => handleNameChange(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                New Website URL Slug *
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                <span className="px-3 text-xs text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 py-2.5">
                  /c/
                </span>
                <input
                  type="text"
                  required
                  placeholder="future-gen-branch-2"
                  value={newCompanySlug}
                  onChange={(e) => setNewCompanySlug(generateSlug(e.target.value))}
                  className="w-full text-xs font-mono bg-transparent px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier for the public website address. Must be lowercase alphanumeric with dashes.
              </p>
            </div>
          </div>

          {/* Isolation & Data Boundary Guarantee Banner */}
          {isSchool && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Strict School Isolation Guarantee:</span>
              </div>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] list-disc list-inside">
                <li><strong className="text-slate-900 dark:text-white">Copied:</strong> Website design, layout, navigation, pages, and selected feature configurations.</li>
                <li><strong className="text-slate-900 dark:text-white">NOT Copied:</strong> Student records, marklists, attendance, and discipline records remain private and empty.</li>
                <li>Modifying either school will never affect the other.</li>
              </ul>
            </div>
          )}

          {/* School Feature Selection Checkboxes (Exact 10 Features) */}
          {isSchool ? (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Choose School Features for New Website:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Select the academic tools available in the duplicate school management portal.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSchoolFeatures(true)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400"
                  >
                    Select All
                  </button>
                  <span className="text-slate-400">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllSchoolFeatures(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-400"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-60 overflow-y-auto pr-1">
                {SCHOOL_FEATURE_DEFINITIONS.map((feat) => {
                  const isChecked = !!schoolFeatures[feat.key];
                  return (
                    <label
                      key={feat.key}
                      onClick={() => toggleSchoolFeature(feat.key)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by label onClick
                        className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {getFeatureIcon(feat.key)}
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {feat.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            /* General Company Duplication Toggles */
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Duplication Options:
              </span>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Duplicate Food Menu & Products
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Copies all catalog categories and dishes/products with fresh IDs.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={copyMenuContent}
                  onChange={(e) => setCopyMenuContent(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-sky-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Duplicate Announcements & Bulletins
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Copies notices, circulars, and announcements.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={copyAnnouncements}
                  onChange={(e) => setCopyAnnouncements(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Duplicate Promotional Offers
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Copies active discount banners and promo items.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={copyOffers}
                  onChange={(e) => setCopyOffers(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={loading ? Loader2 : Copy}
              disabled={loading}
            >
              {loading ? 'Duplicating Website...' : isSchool ? 'Create School Website' : 'Confirm & Duplicate'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

