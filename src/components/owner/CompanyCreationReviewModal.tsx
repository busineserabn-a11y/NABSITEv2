import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  CheckCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyCreationRow } from '../../types/companyCreation';
import { api, generateSlug } from '../../lib/api';
import { Button } from '../ui/Button';
import { Company } from '../../types';

interface CompanyCreationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: CompanyCreationRow[];
  onSuccessCreated: (createdCompanies: Company[]) => void;
}

export const CompanyCreationReviewModal: React.FC<CompanyCreationReviewModalProps> = ({
  isOpen,
  onClose,
  rows,
  onSuccessCreated,
}) => {
  const validRows = useMemo(() => rows.filter((r) => r.isValid && r.name?.trim().length > 0), [rows]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [approvedCompanies, setApprovedCompanies] = useState<Company[]>([]);
  const [skippedTempIds, setSkippedTempIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const currentItem = validRows[currentIndex];
  const isCurrentApproved = approvedCompanies.some((c) => c.slug === currentItem?.slug);
  const isCurrentSkipped = skippedTempIds.includes(currentItem?.tempId || '');

  const handleApproveCurrent = async () => {
    if (!currentItem) return;

    setIsApproving(true);
    setErrorMsg(null);

    try {
      const slug = currentItem.slug ? currentItem.slug.trim().toLowerCase() : generateSlug(currentItem.name);
      const isSchool = (currentItem.category || '').toLowerCase() === 'school';

      const companyPayload: Partial<Company> = {
        name: currentItem.name.trim(),
        shortName: currentItem.shortName?.trim() || currentItem.legalName?.trim() || currentItem.name.trim().substring(0, 20),
        slug,
        category: currentItem.category || 'Restaurant',
        subcategory: currentItem.subcategory?.trim() || '',
        shortDescription:
          currentItem.shortDescription?.trim() || 'Certified business and service provider registered with NABSITE.',
        description: currentItem.description?.trim() || '',
        phone: currentItem.phone?.trim() || '+251 911 000 000',
        email: currentItem.email?.trim() || '',
        websiteUrl: currentItem.websiteUrl?.trim() || '',
        address: currentItem.address?.trim() || 'Bole Road, Addis Ababa',
        city: currentItem.city?.trim() || 'Addis Ababa',
        mapLink: currentItem.mapLink?.trim() || 'https://maps.google.com/?q=Addis+Ababa',
        logo:
          currentItem.logo?.trim() ||
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
        coverImage:
          currentItem.coverImage?.trim() ||
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
        hours: currentItem.hours,
        socialLinks: currentItem.socialLinks,
        schoolFeatures: currentItem.schoolFeatures || (isSchool ? {
          academicYears: true,
          grades: true,
          sections: true,
          globalSearch: true,
          studentRoster: true,
          marklist: true,
          attendance: true,
          discipline: true,
          schoolFaq: true,
          announcements: true,
        } : undefined),
        status: currentItem.status || 'active',
        plan: currentItem.plan || 'business_pro',
        assignedAdminId: currentItem.assignedAdminId || '',
        metadata: {
          legalName: currentItem.legalName,
          secondaryPhone: currentItem.secondaryPhone,
          contactEmail: currentItem.contactEmail,
          whatsapp: currentItem.whatsapp,
          telegramUsername: currentItem.telegramUsername,
          stateRegion: currentItem.stateRegion,
          country: currentItem.country,
          postalCode: currentItem.postalCode,
          tagline: currentItem.tagline,
          websiteHeroTitle: currentItem.websiteHeroTitle,
          websiteHeroDescription: currentItem.websiteHeroDescription,
          websiteAboutText: currentItem.websiteAboutText,
          websiteCtaText: currentItem.websiteCtaText,
          websiteCtaLink: currentItem.websiteCtaLink,
          categoryData: currentItem.categoryData || {},
          batchApprovedViaV2: true,
        },
      };

      const created = await api.createCompany(companyPayload);
      try {
        if (created.websiteId) {
          await api.publishWebsite(created.websiteId);
        }
      } catch (pubErr) {
        console.warn('Auto-publish notice:', pubErr);
      }

      const nextApproved = [...approvedCompanies, created];
      setApprovedCompanies(nextApproved);

      // Check if finished
      if (currentIndex + 1 >= validRows.length) {
        setIsFinished(true);
        onSuccessCreated(nextApproved);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error('Failed to approve company:', err);
      setErrorMsg(err.message || 'Firestore write failure');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSkipCurrent = () => {
    if (!currentItem) return;
    setSkippedTempIds((prev) => [...prev, currentItem.tempId]);
    if (currentIndex + 1 >= validRows.length) {
      setIsFinished(true);
      onSuccessCreated(approvedCompanies);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isFinished ? 'All Websites Approved & Finished!' : 'Approve Websites One-by-One'}
                {!isFinished && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold">
                    {currentIndex + 1} of {validRows.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFinished
                  ? `Successfully created & published ${approvedCompanies.length} websites in Firestore.`
                  : 'Inspect and approve each website individually before committing.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-900 dark:text-white">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Finished Results Mode */}
          {isFinished ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {approvedCompanies.length} Websites Approved & Published!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Real documents written to Firestore database (`companies`, `websites`, `qrConfigs`).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Approved Enterprise Directory
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  {approvedCompanies.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {c.name}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            {c.category}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">/c/{c.slug}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/c/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1"
                        >
                          Visit Live <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link
                          to={`/studio/${c.id}`}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-semibold"
                        >
                          Studio
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : currentItem ? (
            /* Active Website Inspection Card */
            <div className="space-y-4">
              {/* Stepper Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Progress: {approvedCompanies.length} Approved</span>
                  <span>{Math.round((approvedCompanies.length / validRows.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(approvedCompanies.length / validRows.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Simulated Browser Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-slate-200/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>nabsite.com/c/{currentItem.slug}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                    Reviewing
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500 text-white font-extrabold uppercase">
                          {currentItem.category}
                        </span>
                        {currentItem.subcategory && (
                          <span className="text-xs text-slate-400">{currentItem.subcategory}</span>
                        )}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {currentItem.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                        {currentItem.shortDescription ||
                          'Certified enterprise registered with NABSITE digital infrastructure.'}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                      <img
                        src={
                          currentItem.logo ||
                          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80'
                        }
                        alt="Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-semibold text-slate-400 block text-[11px]">Primary Phone:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {currentItem.phone || '+251 911 000 000'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block text-[11px]">Location:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {currentItem.address || 'Bole'}, {currentItem.city || 'Addis Ababa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      ✓ Dynamic QR Code
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      ✓ Mobile Responsive Site
                    </span>
                    {currentItem.category === 'School' && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        ✓ School Academic Engine
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No valid websites found to approve.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          {isFinished ? (
            <div className="flex items-center justify-between w-full">
              <Link to="/owner/companies">
                <Button size="sm" variant="ghost">
                  Back to Companies Vault
                </Button>
              </Link>
              <Button size="sm" variant="primary" onClick={onClose}>
                Finished
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={ChevronLeft}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0 || isApproving}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkipCurrent}
                  disabled={isApproving}
                  className="text-slate-500 hover:text-slate-800 text-xs"
                >
                  Skip
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" onClick={onClose} disabled={isApproving}>
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={isApproving ? Loader2 : CheckCircle2}
                  disabled={isApproving || !currentItem}
                  onClick={handleApproveCurrent}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isApproving
                    ? 'Writing to Firestore...'
                    : currentIndex + 1 === validRows.length
                    ? 'Approve & Finish'
                    : 'Approve & Next ->'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
