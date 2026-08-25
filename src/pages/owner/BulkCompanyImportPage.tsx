import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  Layers,
  Filter,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company } from '../../types';
import {
  COMPANY_IMPORT_COLUMNS,
  SAMPLE_COMPANIES_DATA,
  downloadSpreadsheetFile,
  downloadFailedRowsCsv,
  downloadOfficialExcelTemplate,
  parseUploadedFile,
  validateCompanyImportData,
  executeBulkCompanyImport,
  ValidatedCompanyRow,
  DuplicateHandlingMode,
  ImportProgress,
  ImportResultSummary,
} from '../../lib/bulkImport';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export const BulkCompanyImportPage: React.FC = () => {
  const navigate = useNavigate();

  // Existing companies from Firestore for validation checks
  const [existingCompanies, setExistingCompanies] = useState<Company[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Workflow Steps: 'guide' | 'upload' | 'preview' | 'importing' | 'results'
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');

  // Parsed & Validated rows
  const [validatedRows, setValidatedRows] = useState<ValidatedCompanyRow[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateHandlingMode>('create_and_update');
  const [tableFilter, setTableFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  // Guide Modal
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [isDownloadingOfficial, setIsDownloadingOfficial] = useState(false);

  // Live import progress
  const [progress, setProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    created: 0,
    updated: 0,
    warnings: 0,
    failed: 0,
    phase: 'parsing',
  });

  // Final Results
  const [results, setResults] = useState<ImportResultSummary | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Load existing companies on mount for instant collision detection
  useEffect(() => {
    const fetchExisting = async () => {
      setLoadingExisting(true);
      try {
        const comps = await api.getCompanies();
        setExistingCompanies(comps || []);
      } catch (err) {
        console.error('Could not fetch existing companies for import pre-validation:', err);
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, []);

  // Handlers for template downloads
  const handleDownloadOfficialControlled = async () => {
    setIsDownloadingOfficial(true);
    try {
      await downloadOfficialExcelTemplate();
    } catch (err) {
      console.error('Failed to generate controlled template:', err);
      setErrorBanner('Failed to generate official Excel template.');
    } finally {
      setIsDownloadingOfficial(false);
    }
  };

  const handleDownloadBlank = (format: 'xlsx' | 'csv') => {
    const emptyRow: Record<string, string> = {};
    COMPANY_IMPORT_COLUMNS.forEach((col) => {
      emptyRow[col.key] = '';
    });
    downloadSpreadsheetFile([emptyRow], 'NABSITE_Company_Import_Template', format);
  };

  const handleDownloadSample = () => {
    downloadSpreadsheetFile(SAMPLE_COMPANIES_DATA, 'NABSITE_Company_Import_Sample', 'xlsx');
  };

  // Handle file selection and immediate in-memory validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorBanner(null);
    try {
      const rawRows = await parseUploadedFile(file);
      if (!rawRows || rawRows.length === 0) {
        throw new Error('The uploaded file contains no recognizable data rows.');
      }

      // Deep syntactic & Firestore validation
      const validationReport = await validateCompanyImportData(rawRows, existingCompanies);
      setValidatedRows(validationReport.validatedRows);
      setStep('preview');
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorBanner(err.message || 'Failed to parse file. Ensure it is a valid spreadsheet.');
    }
  };

  // Execute Batch Import
  const handleStartImport = async () => {
    setStep('importing');
    setErrorBanner(null);

    try {
      const summary = await executeBulkCompanyImport(
        validatedRows,
        duplicateMode,
        (p) => setProgress(p)
      );
      setResults(summary);
      setStep('results');
    } catch (err: any) {
      console.error('Import execution error:', err);
      setErrorBanner(err.message || 'Import execution failed.');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setValidatedRows([]);
    setResults(null);
    setErrorBanner(null);
  };

  // Filtered rows for the preview table
  const filteredPreviewRows = validatedRows.filter((r) => {
    if (tableFilter === 'all') return true;
    return r.status === tableFilter;
  });

  const validCount = validatedRows.filter((r) => r.status === 'valid').length;
  const warningCount = validatedRows.filter((r) => r.status === 'warning').length;
  const errorCount = validatedRows.filter((r) => r.status === 'error').length;
  const totalCount = validatedRows.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/owner/companies">
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Companies Vault
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                NABSITE Bulk Ingestion System
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              Bulk Company Import
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={HelpCircle}
            onClick={() => setGuideModalOpen(true)}
          >
            Column Reference Guide
          </Button>
        </div>
      </div>

      {/* Workflow Steps Indicator */}
      <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
              step === 'upload'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-[11px]">
              1
            </div>
            <span>Download & Upload</span>
          </div>

          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
              step === 'preview'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-[11px]">
              2
            </div>
            <span>Validate & Preview</span>
          </div>

          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
              step === 'importing'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20'
                : 'text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-[11px]">
              3
            </div>
            <span>Batch Ingestion</span>
          </div>

          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
              step === 'results'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                : 'text-slate-500'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-[11px]">
              4
            </div>
            <span>Results & Diagnostics</span>
          </div>
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">{errorBanner}</div>
          <Button size="sm" variant="ghost" onClick={() => setErrorBanner(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD & TEMPLATES */}
      {/* ========================================================================= */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Primary Controlled Excel Template Banner */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-500/10 via-amber-500/5 to-slate-900/5 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      Recommended
                    </Badge>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Official Form-Controlled Workbook
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    Official NABSITE Controlled Excel Template (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                    Multi-sheet formatted workbook with <strong>interactive Excel dropdowns</strong> (Business Categories, Status, Countries, Time Slots), field classification color-coding, cell protection, and a built-in Error Reference Guide.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="md"
                  variant="primary"
                  icon={Download}
                  isLoading={isDownloadingOfficial}
                  onClick={handleDownloadOfficialControlled}
                >
                  Download Controlled Template
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/10 dark:border-emerald-500/10 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>5 Formatted Sheets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dropdown Validations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pre-filled Examples</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live Error Guide</span>
              </div>
            </div>
          </div>

          {/* Secondary Download Cards (CSV / Quick Sample) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Raw CSV / Spreadsheet Format
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Single-sheet standard header columns for automated pipeline imports.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => handleDownloadBlank('csv')}
                >
                  Download Blank CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => handleDownloadBlank('xlsx')}
                >
                  Plain XLSX
                </Button>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pre-filled Sample Dataset
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sample dataset containing 3 realistic Ethiopian enterprises ready to test.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Download}
                  onClick={handleDownloadSample}
                >
                  Download Sample XLSX
                </Button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Stage */}
          <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-3xl p-12 text-center transition-all bg-slate-50/60 dark:bg-slate-950/40">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Drop your populated spreadsheet here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports Excel (.xlsx, .xls), CSV (.csv), or JSON (.json). The file will be deeply verified before any database write.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  {existingCompanies.length} Existing Companies in Database
                </Badge>
              </div>
            </div>
          </div>

          {/* Column Quick Guide Preview */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Mandatory Validation Rules
                </h3>
              </div>
              <button
                onClick={() => setGuideModalOpen(true)}
                className="text-xs font-bold text-amber-500 hover:underline"
              >
                View Full Documentation
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">1. Required Primary Key</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <code className="text-amber-500 font-bold">company_key</code> (e.g. C001, C002) is mandatory and unique per enterprise.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">2. Business Categorization</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <code className="text-amber-500 font-bold">category</code> (Restaurant, Cafe, Hotel, Bar, Retail, Health, etc.)
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">3. Media Assets</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <code className="text-amber-500 font-bold">logo_url</code> and <code className="text-amber-500 font-bold">cover_image_url</code> must be valid HTTPS links.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PREVIEW & VALIDATION TABLE */}
      {/* ========================================================================= */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Validation KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setTableFilter('all')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Rows</span>
              <div className="text-2xl font-black mt-1">{totalCount}</div>
            </div>

            <div
              onClick={() => setTableFilter('valid')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'valid'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Valid Ready (✓)</span>
              <div className="text-2xl font-black mt-1">{validCount}</div>
            </div>

            <div
              onClick={() => setTableFilter('warning')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'warning'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-500'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Warnings (⚠)</span>
              <div className="text-2xl font-black mt-1">{warningCount}</div>
            </div>

            <div
              onClick={() => setTableFilter('error')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                tableFilter === 'error'
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-rose-500'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Errors (✕)</span>
              <div className="text-2xl font-black mt-1">{errorCount}</div>
            </div>
          </div>

          {/* Duplicate Mode Selector & Action Bar */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Duplicate Key Handling Policy</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { key: 'create_and_update', label: 'Create New + Update Existing' },
                  { key: 'create_only', label: 'Create New Only (Skip Existing)' },
                  { key: 'update_existing', label: 'Update Existing Only' },
                  { key: 'skip_existing', label: 'Skip Existing (Leave Intact)' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setDuplicateMode(mode.key as DuplicateHandlingMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      duplicateMode === mode.key
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Discard & Upload Again
              </Button>
              <Button
                variant="gold"
                size="sm"
                icon={Zap}
                onClick={handleStartImport}
                disabled={validCount + warningCount === 0}
                className="font-bold shadow-md"
              >
                Ingest {validCount + warningCount} Companies to Firestore
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/90 shadow-2xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ingestion Candidate Records ({filteredPreviewRows.length} Displayed)
                </h3>
                <p className="text-xs text-slate-500">
                  Review data accuracy, slug assignments, and identified warnings before batch commit.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Filter: {tableFilter.toUpperCase()}
              </Badge>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Row</th>
                    <th className="p-3">Key</th>
                    <th className="p-3">Company & Brand</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">City / Address</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Diagnostic Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredPreviewRows.map((r) => (
                    <tr
                      key={r.rowIndex}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        r.status === 'error'
                          ? 'bg-rose-50/50 dark:bg-rose-950/20'
                          : r.status === 'warning'
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-400">{r.rowIndex}</td>
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {r.data.company_key || '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          {r.data.logo_url ? (
                            <img
                              src={r.data.logo_url}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {r.data.company_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              slug: /c/{r.generatedSlug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge size="sm" variant="neutral">
                          {r.data.category || 'Restaurant'}
                        </Badge>
                      </td>
                      <td className="p-3 text-[11px] truncate max-w-[140px]">
                        {r.data.city || 'Addis Ababa'} • {r.data.address || 'Bole'}
                      </td>
                      <td className="p-3 text-[11px]">
                        <div>{r.data.phone || '—'}</div>
                        <div className="text-slate-400">{r.data.email || ''}</div>
                      </td>
                      <td className="p-3">
                        {r.status === 'valid' && (
                          <Badge size="sm" variant="success">
                            Ready
                          </Badge>
                        )}
                        {r.status === 'warning' && (
                          <Badge size="sm" variant="pending">
                            Notice
                          </Badge>
                        )}
                        {r.status === 'error' && (
                          <Badge size="sm" variant="danger">
                            Error
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {r.errors.length > 0 && (
                          <div className="text-rose-600 dark:text-rose-400 font-medium space-y-0.5">
                            {r.errors.map((e, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 shrink-0" />
                                <span>{e}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {r.warnings.length > 0 && (
                          <div className="text-amber-600 dark:text-amber-400 font-medium space-y-0.5 mt-0.5">
                            {r.warnings.map((w, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {r.errors.length === 0 && r.warnings.length === 0 && (
                          <span className="text-emerald-500 font-medium text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            All fields validated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: LIVE BATCH INGESTION PROGRESS */}
      {/* ========================================================================= */}
      {step === 'importing' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
            <RefreshCw className="w-10 h-10 animate-spin" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Persisting Entities to Firestore
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Executing atomic writes, provisioning default websites, menu structures, and QR configurations.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">
                Processing {progress.processed} of {progress.total}
              </span>
              <span className="text-amber-500 font-black">
                {progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Live Progress KPIs */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Created</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{progress.created}</div>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Updated</span>
              <div className="text-lg font-black text-sky-600 dark:text-sky-400">{progress.updated}</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-500 uppercase">Warnings</span>
              <div className="text-lg font-black text-amber-500">{progress.warnings}</div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Failed</span>
              <div className="text-lg font-black text-rose-500">{progress.failed}</div>
            </div>
          </div>

          {progress.currentItem && (
            <p className="text-xs text-slate-400 italic">
              Currently processing: {progress.currentItem}...
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: IMPORT RESULTS & DIAGNOSTICS */}
      {/* ========================================================================= */}
      {step === 'results' && results && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Bulk Import Execution Finished
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Completed in {(results.durationMs / 1000).toFixed(2)}s. All valid companies are now accessible across NABSITE.
              </p>
            </div>

            {/* Results KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  Created New
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {results.createdCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase">
                  Updated Existing
                </span>
                <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
                  {results.updatedCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-500 uppercase">
                  Non-Fatal Warnings
                </span>
                <div className="text-2xl font-black text-amber-500 mt-1">
                  {results.warningCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[11px] font-bold text-rose-500 uppercase">
                  Failed Rows
                </span>
                <div className="text-2xl font-black text-rose-500 mt-1">
                  {results.failedCount}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link to="/owner/companies">
                <Button variant="gold" size="md" icon={Building2} className="font-bold shadow-md">
                  Open Companies Vault
                </Button>
              </Link>
              {results.failedRows.length > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  icon={Download}
                  onClick={() => downloadFailedRowsCsv(results.failedRows)}
                >
                  Download Failed Rows ({results.failedRows.length})
                </Button>
              )}
              <Button variant="ghost" size="md" onClick={handleReset}>
                Import Another File
              </Button>
            </div>
          </div>

          {/* Failed Rows Diagnostics Table */}
          {results.failedRows.length > 0 && (
            <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 overflow-hidden bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    Failed Ingestion Diagnostic Breakdown ({results.failedRows.length} Rows)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Download the correction file, resolve the specific column issues, and re-upload.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => downloadFailedRowsCsv(results.failedRows)}
                >
                  Export Failed Rows CSV
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Company Key</th>
                      <th className="p-2.5">Company Name</th>
                      <th className="p-2.5">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40 text-slate-600 dark:text-slate-300">
                    {results.failedRows.map((f, i) => (
                      <tr key={i} className="hover:bg-rose-50/50">
                        <td className="p-2.5 font-bold text-slate-400">{f.row}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-600">{f.key}</td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-white">{f.name}</td>
                        <td className="p-2.5 text-rose-600 dark:text-rose-400 font-medium">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLUMN REFERENCE GUIDE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        title="NABSITE Spreadsheet & Workbook Guide"
        description="Comprehensive reference for the official multi-sheet Excel workbook, columns, constraints, and validation rules."
        maxWidth="3xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Workbook Sheet Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Controlled Workbook Structure (5 Sheets)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-600 dark:text-amber-400">1. START_HERE</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Welcome manual, 7-step checklist, visual color guide (Required / Optional / System), and image link rules.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">2. COMPANIES (Main Form)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  The primary data table with Excel dropdowns for Category, Status, Country, City, and Hours.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="font-bold text-sky-600 dark:text-sky-400">3. OPTIONS (Master Lists)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Protected lists powering the Excel in-cell dropdowns. Ensures exact data compatibility.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="font-bold text-purple-600 dark:text-purple-400">4. EXAMPLE (Reference Rows)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Ready-to-view rows illustrating realistic restaurants, cafes, and healthcare providers.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 sm:col-span-2">
                <span className="font-bold text-rose-600 dark:text-rose-400">5. ERROR_GUIDE (Self-Help Diagnostic)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Common validation error codes, explanation of why they happen, and step-by-step resolution.
                </p>
              </div>
            </div>
          </div>

          {/* Columns Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Entity Columns Specification
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="p-3">Column Name</th>
                    <th className="p-3">Required</th>
                    <th className="p-3">Example</th>
                    <th className="p-3">Description & Validation Rules</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  {COMPANY_IMPORT_COLUMNS.map((col) => (
                    <tr key={col.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {col.key}
                      </td>
                      <td className="p-3">
                        {col.required ? (
                          <Badge size="sm" variant="danger">
                            Required
                          </Badge>
                        ) : (
                          <Badge size="sm" variant="neutral">
                            Optional
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {col.example}
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                        {col.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              size="sm"
              variant="primary"
              icon={Download}
              isLoading={isDownloadingOfficial}
              onClick={handleDownloadOfficialControlled}
            >
              Download Controlled (.xlsx)
            </Button>
            <Button size="sm" variant="outline" onClick={() => setGuideModalOpen(false)}>
              Close Guide
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
