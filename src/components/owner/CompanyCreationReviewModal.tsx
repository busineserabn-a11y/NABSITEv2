import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Building,
  AlertCircle,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentCompanyTitle, setCurrentCompanyTitle] = useState('');
  const [createdCompanies, setCreatedCompanies] = useState<Company[]>([]);
  const [creationErrors, setCreationErrors] = useState<{ rowIdx: number; name: string; error: string }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const handleStartCreation = async () => {
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    setCurrentProgress(0);
    setCreationErrors([]);
    const newlyCreated: Company[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setCurrentCompanyTitle(row.name);
      setCurrentProgress(i + 1);

      try {
        const slug = row.slug ? row.slug.trim().toLowerCase() : generateSlug(row.name);

        const companyPayload: Partial<Company> = {
          name: row.name.trim(),
          shortName: row.shortName?.trim() || row.legalName?.trim() || row.name.trim().substring(0, 20),
          slug,
          category: row.category || 'Restaurant',
          subcategory: row.subcategory?.trim() || '',
          shortDescription:
            row.shortDescription?.trim() || 'Certified business and service provider registered with NABSITE.',
          description: row.description?.trim() || '',
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
          schoolFeatures: row.schoolFeatures,
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
            latitude: row.latitude,
            longitude: row.longitude,
            mainImage: row.mainImage,
            additionalImages: row.additionalImages,
            favicon: row.favicon,
            tagline: row.tagline,
            websiteHeroTitle: row.websiteHeroTitle,
            websiteHeroDescription: row.websiteHeroDescription,
            websiteAboutText: row.websiteAboutText,
            websiteCtaText: row.websiteCtaText,
            websiteCtaLink: row.websiteCtaLink,
            categoryData: row.categoryData || {},
            batchCreatedViaV2: true,
            createdAtSession: new Date().toISOString(),
          },
        };

        const created = await api.createCompany(companyPayload);
        newlyCreated.push(created);
      } catch (err: any) {
        console.error(`Failed to create company "${row.name}":`, err);
        setCreationErrors((prev) => [
          ...prev,
          {
            rowIdx: i + 1,
            name: row.name,
            error: err.message || 'Unknown Firestore write failure',
          },
        ]);
      }
    }

    setCreatedCompanies(newlyCreated);
    setIsFinished(true);
    setIsSubmitting(false);
    onSuccessCreated(newlyCreated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isFinished ? 'Bulk Creation Complete' : 'Review & Finalize Batch Creation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFinished
                  ? `Successfully created ${createdCompanies.length} enterprise records in Firestore.`
                  : 'Verify batch details before committing real records to Firestore database.'}
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-900 dark:text-white">
          {/* Ongoing Creation Mode */}
          {isSubmitting && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Creating Companies in Firestore...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Writing company profile, provisioning custom website document, and registering QR codes.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Progress: {currentProgress} / {validRows.length}</span>
                  <span>{Math.round((currentProgress / validRows.length) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(currentProgress / validRows.length) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 italic">
                  Currently writing: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentCompanyTitle}</span>
                </div>
              </div>
            </div>
          )}

          {/* Finished Results Mode */}
          {isFinished && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {createdCompanies.length} of {validRows.length} Companies Created Successfully!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Real documents written to Firestore database (`companies`, `websites`, `qrConfigs`).
                  </p>
                </div>
              </div>

              {creationErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-2">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {creationErrors.length} Failed to Create:
                  </div>
                  <ul className="text-xs text-rose-700 dark:text-rose-400 list-disc list-inside space-y-1">
                    {creationErrors.map((err, i) => (
                      <li key={i}>
                        <span className="font-semibold">{err.name}:</span> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Created Enterprise Directory
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  {createdCompanies.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {c.name}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1"
                        >
                          Public Site <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link
                          to={`/owner/companies/${c.id}`}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium"
                        >
                          Details
                        </Link>
                        <Link
                          to={`/studio/${c.id}`}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 font-medium"
                        >
                          Studio
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pre-Creation Review Mode */}
          {!isSubmitting && !isFinished && (
            <div className="space-y-5">
              {/* Batch Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500">Total Rows</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {rows.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Ready to Create
                  </span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {validRows.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Has Incomplete Errors
                  </span>
                  <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
                    {invalidRows.length}
                  </div>
                </div>
              </div>

              {/* Warning for invalid rows */}
              {invalidRows.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">{invalidRows.length} rows have missing or invalid data</span> (e.g. empty Company Name or invalid slug). If you proceed now, only the {validRows.length} valid rows will be submitted.
                  </div>
                </div>
              )}

              {/* Ready Companies Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Companies to be Provisioned ({validRows.length})
                </h4>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {validRows.map((r, i) => (
                    <div key={r.tempId} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-6">#{i + 1}</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-2">
                            <span>{r.category}</span>
                            <span>•</span>
                            <span className="font-mono">/c/{r.slug}</span>
                            {r.phone && (
                              <>
                                <span>•</span>
                                <span>{r.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        Ready
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
                Done
              </Button>
            </div>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={isSubmitting ? Loader2 : ArrowRight}
                disabled={isSubmitting || validRows.length === 0}
                onClick={handleStartCreation}
              >
                {isSubmitting
                  ? 'Writing to Firestore...'
                  : `Commit & Create ${validRows.length} ${validRows.length === 1 ? 'Company' : 'Companies'}`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
