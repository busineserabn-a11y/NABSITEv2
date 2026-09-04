import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Globe,
  Palette,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Send,
  Eye,
  SkipForward,
  CheckCheck,
  School,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyCreationRow } from '../../types/companyCreation';
import { api, generateSlug } from '../../lib/api';
import { Button } from '../ui/Button';
import { Company } from '../../types';
import { TEMPLATES_BY_CATEGORY, BUSINESS_CATEGORIES } from '../../data/themes';

interface SequentialWebsiteApprovalStudioProps {
  rows: CompanyCreationRow[];
  onUpdateRow: (index: number, updatedRow: CompanyCreationRow) => void;
  onOpenRowDetails: (index: number) => void;
  onBackToSpreadsheet: () => void;
  onFinishedAll: (createdCompanies: Company[]) => void;
}

export const SequentialWebsiteApprovalStudio: React.FC<SequentialWebsiteApprovalStudioProps> = ({
  rows,
  onUpdateRow,
  onOpenRowDetails,
  onBackToSpreadsheet,
  onFinishedAll,
}) => {
  // Filter valid rows that can be approved
  const validRowIndices = useMemo(() => {
    return rows
      .map((r, i) => (r.isValid && r.name?.trim().length > 0 ? i : -1))
      .filter((i) => i !== -1);
  }, [rows]);

  // Current active row index in `rows`
  const [activeRowIndex, setActiveRowIndex] = useState<number>(() => {
    // Start on the first pending valid row
    const firstPending = rows.findIndex((r) => r.isValid && r.name && (!r.approvalStatus || r.approvalStatus === 'pending'));
    return firstPending !== -1 ? firstPending : (validRowIndices[0] ?? 0);
  });

  const [isApprovingCurrent, setIsApprovingCurrent] = useState(false);
  const [isApprovingAllRemaining, setIsApprovingAllRemaining] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [publishLiveImmediately, setPublishLiveImmediately] = useState(true);
  const [approvalFeedback, setApprovalFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Quick inline edits for active row
  const activeRow = rows[activeRowIndex];

  // Templates available for active row category
  const availableTemplates = useMemo(() => {
    if (!activeRow?.category) return [];
    const cat = activeRow.category;
    return TEMPLATES_BY_CATEGORY[cat] || TEMPLATES_BY_CATEGORY['Restaurant'] || [];
  }, [activeRow?.category]);

  // Selected template
  const currentTemplate = useMemo(() => {
    if (!availableTemplates.length) return null;
    if (activeRow?.selectedThemeId) {
      return availableTemplates.find((t) => t.id === activeRow.selectedThemeId) || availableTemplates[0];
    }
    return availableTemplates[0];
  }, [availableTemplates, activeRow?.selectedThemeId]);

  // Track stats
  const stats = useMemo(() => {
    const totalValid = validRowIndices.length;
    const approved = rows.filter((r) => r.approvalStatus === 'approved').length;
    const skipped = rows.filter((r) => r.approvalStatus === 'skipped').length;
    const pending = totalValid - approved - skipped;
    const allDone = totalValid > 0 && approved + skipped >= totalValid;
    return { totalValid, approved, skipped, pending, allDone };
  }, [rows, validRowIndices]);

  // If stats.allDone is reached, user is in "Finished" state
  const isFinished = stats.allDone && stats.totalValid > 0;

  // Jump to next pending website
  const jumpToNextPending = () => {
    const nextPending = rows.findIndex(
      (r, i) => r.isValid && (!r.approvalStatus || r.approvalStatus === 'pending') && i !== activeRowIndex
    );
    if (nextPending !== -1) {
      setActiveRowIndex(nextPending);
    } else {
      // Find any next index
      const currPos = validRowIndices.indexOf(activeRowIndex);
      if (currPos < validRowIndices.length - 1) {
        setActiveRowIndex(validRowIndices[currPos + 1]);
      }
    }
  };

  // Jump to prev website
  const jumpToPrev = () => {
    const currPos = validRowIndices.indexOf(activeRowIndex);
    if (currPos > 0) {
      setActiveRowIndex(validRowIndices[currPos - 1]);
    }
  };

  // Approve a single company and create its website
  const handleApproveWebsite = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row || !row.isValid) return;

    setIsApprovingCurrent(true);
    setApprovalFeedback(null);

    try {
      const slug = row.slug ? row.slug.trim().toLowerCase() : generateSlug(row.name);
      const isSchool = (row.category || '').toLowerCase() === 'school';

      const companyPayload: Partial<Company> = {
        name: row.name.trim(),
        shortName: row.shortName?.trim() || row.legalName?.trim() || row.name.trim().substring(0, 20),
        slug,
        category: row.category || 'Restaurant',
        subcategory: row.subcategory?.trim() || '',
        shortDescription:
          row.shortDescription?.trim() ||
          (row.websiteHeroDescription?.trim()
            ? row.websiteHeroDescription.trim()
            : 'Certified business and service provider registered with NABSITE.'),
        description: row.description?.trim() || row.websiteAboutText?.trim() || '',
        phone: row.phone?.trim() || '+251 911 000 000',
        email: row.email?.trim() || '',
        websiteUrl: row.websiteUrl?.trim() || '',
        address: row.address?.trim() || 'Bole Road, Addis Ababa',
        city: row.city?.trim() || 'Addis Ababa',
        mapLink: row.mapLink?.trim() || 'https://maps.google.com/?q=Addis+Ababa',
        logo:
          row.logo?.trim() ||
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
        coverImage:
          row.coverImage?.trim() ||
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
        hours: row.hours,
        socialLinks: row.socialLinks,
        schoolFeatures: row.schoolFeatures || (isSchool ? {
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
        status: row.status || 'active',
        plan: row.plan || 'business_pro',
        assignedAdminId: row.assignedAdminId || '',
        metadata: {
          legalName: row.legalName,
          secondaryPhone: row.secondaryPhone,
          contactEmail: row.contactEmail,
          whatsapp: row.whatsapp,
          telegramUsername: row.telegramUsername,
          stateRegion: row.stateRegion,
          country: row.country,
          postalCode: row.postalCode,
          tagline: row.tagline,
          websiteHeroTitle: row.websiteHeroTitle || `Welcome to ${row.name}`,
          websiteHeroDescription: row.websiteHeroDescription || row.shortDescription,
          websiteAboutText: row.websiteAboutText,
          websiteCtaText: row.websiteCtaText || (isSchool ? 'Apply for Admission' : 'Explore Offerings'),
          websiteCtaLink: row.websiteCtaLink || '/contact',
          categoryData: row.categoryData || {},
          selectedThemeId: row.selectedThemeId || currentTemplate?.id,
          batchApprovedViaV2: true,
          approvedAt: new Date().toISOString(),
        },
      };

      // 1. Create Company in Firestore
      const createdCompany = await api.createCompany(companyPayload);

      // 2. If user requested immediate publishing, publish website
      let finalWebsiteId = createdCompany.websiteId;
      if (publishLiveImmediately && createdCompany.websiteId) {
        try {
          await api.publishWebsite(createdCompany.websiteId);
        } catch (pubErr) {
          console.warn('Publish notice (saved as draft):', pubErr);
        }
      }

      // 3. Update row in memory
      const updatedRow: CompanyCreationRow = {
        ...row,
        approvalStatus: 'approved',
        createdCompanyId: createdCompany.id,
        createdWebsiteId: finalWebsiteId,
        createdSlug: createdCompany.slug,
        creationError: undefined,
      };
      onUpdateRow(rowIndex, updatedRow);

      setApprovalFeedback({
        type: 'success',
        message: `Approved & Created! Website live at /c/${createdCompany.slug}`,
      });

      // 4. Auto-advance if enabled
      if (autoAdvance) {
        setTimeout(() => {
          jumpToNextPending();
        }, 600);
      }
    } catch (err: any) {
      console.error(`Approval error for "${row.name}":`, err);
      const updatedRow: CompanyCreationRow = {
        ...row,
        approvalStatus: 'failed',
        creationError: err.message || 'Firestore write error',
      };
      onUpdateRow(rowIndex, updatedRow);
      setApprovalFeedback({
        type: 'error',
        message: `Failed to approve "${row.name}": ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsApprovingCurrent(false);
    }
  };

  // Skip active row
  const handleSkipWebsite = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return;

    const updatedRow: CompanyCreationRow = {
      ...row,
      approvalStatus: 'skipped',
    };
    onUpdateRow(rowIndex, updatedRow);
    jumpToNextPending();
  };

  // Approve all remaining pending websites in sequence
  const handleApproveAllRemaining = async () => {
    const pendingIndices = rows
      .map((r, i) => (r.isValid && (!r.approvalStatus || r.approvalStatus === 'pending') ? i : -1))
      .filter((i) => i !== -1);

    if (pendingIndices.length === 0) return;

    if (!window.confirm(`Approve all ${pendingIndices.length} remaining websites sequentially?`)) {
      return;
    }

    setIsApprovingAllRemaining(true);

    for (const idx of pendingIndices) {
      setActiveRowIndex(idx);
      await handleApproveWebsite(idx);
    }

    setIsApprovingAllRemaining(false);
  };

  // Keyboard navigation: Enter to Approve, ArrowLeft for Prev, ArrowRight for Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if (e.key === 'Enter' && !isApprovingCurrent && !isApprovingAllRemaining) {
        e.preventDefault();
        handleApproveWebsite(activeRowIndex);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        jumpToNextPending();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        jumpToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRowIndex, isApprovingCurrent, isApprovingAllRemaining, rows]);

  // Current position in valid items list
  const currentPos = validRowIndices.indexOf(activeRowIndex) + 1;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Breadcrumb Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <button
              type="button"
              onClick={onBackToSpreadsheet}
              className="hover:text-amber-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Spreadsheet Data Entry
            </button>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              Sequential Website Approval Studio
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Approve Websites One-by-One
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
              V2.0 LIVE QUEUE
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review each generated website individually. Verify theme, live URL slug, branding, and contact details before committing.
          </p>
        </div>

        {/* Global Toolbar & Auto-Advance Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={publishLiveImmediately}
              onChange={(e) => setPublishLiveImmediately(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span>Publish live immediately</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span>Auto-advance to next</span>
          </label>

          <Button
            size="sm"
            variant="outline"
            onClick={onBackToSpreadsheet}
            className="text-xs font-semibold"
          >
            Spreadsheet Mode
          </Button>

          {stats.pending > 1 && (
            <Button
              size="sm"
              variant="outline"
              icon={CheckCheck}
              onClick={handleApproveAllRemaining}
              disabled={isApprovingAllRemaining}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Approve Remaining ({stats.pending})
            </Button>
          )}
        </div>
      </div>

      {/* Progress & Metric Header Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Progress Tracker */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-2">
              <span>Reviewing Website</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black">
                {currentPos || 1} of {stats.totalValid}
              </span>
            </span>
            <span className="text-slate-500">
              {Math.round((stats.approved / (stats.totalValid || 1)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(stats.approved / (stats.totalValid || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{stats.approved} Approved</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{stats.pending} Pending</span>
          </div>
          {stats.skipped > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <SkipForward className="w-3.5 h-3.5" />
              <span>{stats.skipped} Skipped</span>
            </div>
          )}
        </div>
      </div>

      {/* Finished Screen Banner if All are Approved */}
      {isFinished && (
        <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-500/10 via-amber-500/5 to-slate-100 dark:from-emerald-950/30 dark:via-amber-950/20 dark:to-slate-900 border border-emerald-500/20 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <CheckCheck className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  All Websites Approved & Finished!
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  You have successfully inspected and provisioned {stats.approved} enterprise websites in Firestore. All digital assets, theme configs, and URLs are live.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/owner/companies">
                <Button size="sm" variant="primary" className="font-bold">
                  View in Companies Vault
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={onBackToSpreadsheet}>
                Spreadsheet Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {approvalFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            approvalFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {approvalFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{approvalFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setApprovalFeedback(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Batch Website Navigator (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Websites in Batch ({stats.totalValid})
              </h3>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {validRowIndices.map((idx, pos) => {
                const item = rows[idx];
                const isActive = idx === activeRowIndex;
                const isApproved = item.approvalStatus === 'approved';
                const isSkipped = item.approvalStatus === 'skipped';
                const isFailed = item.approvalStatus === 'failed';

                return (
                  <div
                    key={item.tempId}
                    onClick={() => setActiveRowIndex(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-xs'
                        : isApproved
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 mt-0.5 w-5">
                        #{pos + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">/c/{item.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Chip */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isApproved ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Live
                        </span>
                      ) : isSkipped ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Skipped
                        </span>
                      ) : isFailed ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                          Error
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Website Inspection & Approval Stage (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {activeRow ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              {/* Browser Mockup Top Header */}
              <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-slate-500 ml-2">Website Preview Studio</span>
                </div>

                {/* Simulated URL Bar */}
                <div className="flex-1 max-w-md mx-auto flex items-center bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                  <Globe className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                  <span className="text-slate-400 mr-0.5">nabsite.com/c/</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{activeRow.slug}</span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  {activeRow.approvalStatus === 'approved' ? (
                    <a
                      href={`/c/${activeRow.createdSlug || activeRow.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600 shadow-xs"
                    >
                      <span>Visit Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                      Draft Preview
                    </span>
                  )}
                </div>
              </div>

              {/* Stage Body */}
              <div className="p-6 space-y-6">
                {/* 1. Hero Preview Banner */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white min-h-[220px] flex flex-col justify-end p-6 shadow-sm">
                  {/* Background Cover Image */}
                  <img
                    src={
                      activeRow.coverImage ||
                      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80'
                    }
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Hero Content */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md shrink-0">
                        <img
                          src={
                            activeRow.logo ||
                            'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80'
                          }
                          alt="Logo"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold tracking-wide uppercase">
                            {activeRow.category}
                          </span>
                          {activeRow.subcategory && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-medium">
                              {activeRow.subcategory}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-white mt-1">
                          {activeRow.name}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2 max-w-xl">
                      {activeRow.websiteHeroDescription ||
                        activeRow.shortDescription ||
                        'Certified enterprise operating with verified NABSITE digital infrastructure.'}
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all cursor-default"
                      >
                        {activeRow.websiteCtaText ||
                          (activeRow.category === 'School' ? 'Apply for Admission' : 'Explore Offerings')}
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-xs transition-all cursor-default"
                      >
                        Contact & Location
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Quick Live Tweaks Bar (Name, Slug, Theme) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Quick Customizer Before Approval
                    </h4>
                    <button
                      type="button"
                      onClick={() => onOpenRowDetails(activeRowIndex)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      Full 8-Tab Editor
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Editable Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Enterprise Name
                      </label>
                      <input
                        type="text"
                        value={activeRow.name}
                        onChange={(e) => {
                          const updated = { ...activeRow, name: e.target.value };
                          onUpdateRow(activeRowIndex, updated);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Editable Slug */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        URL Slug (/c/slug)
                      </label>
                      <input
                        type="text"
                        value={activeRow.slug}
                        onChange={(e) => {
                          const updated = { ...activeRow, slug: e.target.value.toLowerCase() };
                          onUpdateRow(activeRowIndex, updated);
                        }}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Website Template
                      </label>
                      <select
                        value={activeRow.selectedThemeId || currentTemplate?.id || ''}
                        onChange={(e) => {
                          const updated = { ...activeRow, selectedThemeId: e.target.value };
                          onUpdateRow(activeRowIndex, updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {availableTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.personality || 'Modern'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Generated Modules & Key Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Digital Assets & Pages */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Generated Pages & Sections
                    </h5>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        ✓ Home (Hero & Overview)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        ✓ About Our Story
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        ✓ Offerings / Services
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        ✓ Contact & Inquiry
                      </span>
                      {activeRow.category === 'School' && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                          ✓ School Academic Engine
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        ✓ Dynamic QR Code
                      </span>
                    </div>
                  </div>

                  {/* Contact & Hours Summary */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Contact & Coordinates
                    </h5>
                    <div className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{activeRow.phone || '+251 911 000 000'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{activeRow.email || 'None provided (optional)'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {activeRow.address || 'Bole Road'}, {activeRow.city || 'Addis Ababa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Mon-Sun Standard Hours Configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                {/* Previous & Next Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ChevronLeft}
                    onClick={jumpToPrev}
                    disabled={validRowIndices.indexOf(activeRowIndex) <= 0}
                    className="text-xs"
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={jumpToNextPending}
                    className="text-xs flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSkipWebsite(activeRowIndex)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Skip for Now
                  </Button>

                  {activeRow.approvalStatus === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mr-2">
                        <CheckCircle2 className="w-4 h-4" /> Approved
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={jumpToNextPending}
                        className="text-xs font-bold"
                      >
                        Next Pending Website &rarr;
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={isApprovingCurrent ? Loader2 : CheckCircle2}
                      disabled={isApprovingCurrent || isApprovingAllRemaining}
                      onClick={() => handleApproveWebsite(activeRowIndex)}
                      className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-5"
                    >
                      {isApprovingCurrent
                        ? 'Writing to Firestore...'
                        : `Approve & Create Website [Enter]`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Website Selected
              </h3>
              <p className="text-xs text-slate-500">
                Please click a website row from the left batch list to inspect and approve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
