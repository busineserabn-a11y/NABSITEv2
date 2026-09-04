import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clipboard,
  Save,
  RotateCcw,
  Building2,
  ArrowRight,
  ShieldCheck,
  Download,
  Upload,
  Search,
  Sparkles,
  HelpCircle,
  Layers,
  Keyboard,
  CheckCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CompanyCreationRow, createEmptyCompanyRow } from '../../types/companyCreation';
import { validateCompanyRow, parseSpreadsheetPaste } from '../../lib/companyCreationValidator';
import { BUSINESS_CATEGORIES } from '../../data/themes';
import { generateSlug } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { CompanyRowDetailsModal } from '../../components/owner/CompanyRowDetailsModal';
import { CompanyPasteModal } from '../../components/owner/CompanyPasteModal';
import { CompanyCreationReviewModal } from '../../components/owner/CompanyCreationReviewModal';
import { SequentialWebsiteApprovalStudio } from '../../components/owner/SequentialWebsiteApprovalStudio';
import { Company } from '../../types';

const STORAGE_DRAFT_KEY = 'nabsite_company_creation_v2_draft';

// Define the 8 editable column indexes for keyboard navigation (like Marklist Spreadsheet 2.0)
// 0: name, 1: slug, 2: category, 3: shortName, 4: phone, 5: email, 6: city, 7: address
const NUM_EDITABLE_COLS = 8;

export const MultiCompanyCreationPage: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'spreadsheet' (input data) vs 'approval' (approve websites one by one)
  const [viewMode, setViewMode] = useState<'spreadsheet' | 'approval'>('spreadsheet');

  // Rows state
  const [rows, setRows] = useState<CompanyCreationRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved draft:', e);
    }
    // Default start with 3 empty rows
    return [
      createEmptyCompanyRow(1),
      createEmptyCompanyRow(2),
      createEmptyCompanyRow(3),
    ];
  });

  const [activeEditingIndex, setActiveEditingIndex] = useState<number | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-validate and auto-save draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(rows));
      const now = new Date();
      setLastSavedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.warn('Draft auto-save warning:', err);
    }
  }, [rows]);

  // Update a single cell in a row
  const updateCell = useCallback(
    (index: number, field: keyof CompanyCreationRow, value: any) => {
      setRows((prev) => {
        const updated = [...prev];
        const currentRow = { ...updated[index], [field]: value };

        // If name was updated and slug was empty or matches old name's slug, auto-suggest slug
        if (field === 'name') {
          const oldExpectedSlug = generateSlug(updated[index].name || '');
          if (!currentRow.slug || currentRow.slug === oldExpectedSlug) {
            currentRow.slug = generateSlug(value || '');
          }
        }

        // Validate
        const validation = validateCompanyRow(currentRow, updated);
        currentRow.isValid = validation.isValid;
        currentRow.errors = validation.errors;
        currentRow.warnings = validation.warnings;

        updated[index] = currentRow;
        return updated;
      });
    },
    []
  );

  // Cell focus helper (Marklist Spreadsheet 2.0 pattern)
  const focusCell = (rowIdx: number, colIdx: number) => {
    const el = document.getElementById(`grid-cell-${rowIdx}-${colIdx}`);
    if (el) {
      el.focus();
      if ((el as HTMLInputElement).select) {
        (el as HTMLInputElement).select();
      }
    }
  };

  // Keyboard navigation handler for rapid spreadsheet data entry
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx === rows.length - 1) {
        // Automatically append a new row and focus it!
        addRows(1);
        setTimeout(() => {
          focusCell(rowIdx + 1, colIdx);
        }, 50);
      } else {
        focusCell(rowIdx + 1, colIdx);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx < rows.length - 1) {
        focusCell(rowIdx + 1, colIdx);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        focusCell(rowIdx - 1, colIdx);
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (colIdx === NUM_EDITABLE_COLS - 1) {
        // Move to next row col 0
        if (rowIdx < rows.length - 1) {
          e.preventDefault();
          focusCell(rowIdx + 1, 0);
        }
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (colIdx === 0 && rowIdx > 0) {
        e.preventDefault();
        focusCell(rowIdx - 1, NUM_EDITABLE_COLS - 1);
      }
    }
  };

  // Add Row(s)
  const addRows = (count: number = 1) => {
    setRows((prev) => {
      const newItems: CompanyCreationRow[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push(createEmptyCompanyRow(prev.length + i + 1));
      }
      return [...prev, ...newItems];
    });
  };

  // Duplicate Row
  const duplicateRow = (index: number) => {
    setRows((prev) => {
      const source = prev[index];
      const clone: CompanyCreationRow = {
        ...JSON.parse(JSON.stringify(source)),
        tempId: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: source.name ? `${source.name} (Copy)` : '',
        slug: source.slug ? `${source.slug}-copy` : '',
        companyKey: `${source.companyKey || 'COMP'}-COPY`,
        approvalStatus: 'pending',
        createdCompanyId: undefined,
        createdWebsiteId: undefined,
      };
      const validation = validateCompanyRow(clone, prev);
      clone.isValid = validation.isValid;
      clone.errors = validation.errors;
      clone.warnings = validation.warnings;

      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  // Clear Row
  const clearRow = (index: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = createEmptyCompanyRow(index + 1);
      return next;
    });
  };

  // Delete Row
  const deleteRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [createEmptyCompanyRow(1)];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Clear all empty rows
  const clearEmptyRows = () => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.name.trim().length > 0);
      return filtered.length > 0 ? filtered : [createEmptyCompanyRow(1)];
    });
  };

  // Reset entire table
  const resetEntireTable = () => {
    if (window.confirm('Reset the entire table and clear all entered rows?')) {
      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setRows([
        createEmptyCompanyRow(1),
        createEmptyCompanyRow(2),
        createEmptyCompanyRow(3),
      ]);
    }
  };

  // Load Sample Preset Batch (for quick testing)
  const loadSampleBatch = () => {
    const sampleRows: CompanyCreationRow[] = [
      {
        ...createEmptyCompanyRow(1),
        name: 'Lucy Ethiopian Heritage Café',
        slug: 'lucy-heritage-cafe',
        category: 'Café',
        subcategory: 'Specialty Coffee & Roastery',
        shortName: 'Lucy Café',
        phone: '+251 911 234 567',
        email: 'contact@lucycafe.com',
        city: 'Addis Ababa',
        address: 'Bole Road, Near Medhanialem Church',
        shortDescription: 'Organic single-origin Ethiopian coffee roasted daily with cultural ceremonies.',
        websiteHeroTitle: 'Authentic Ethiopian Coffee Culture',
        websiteHeroDescription: 'Experience traditional coffee ceremonies and hand-roasted beans in Addis Ababa.',
        websiteCtaText: 'View Coffee Menu',
        isValid: true,
      },
      {
        ...createEmptyCompanyRow(2),
        name: 'Bright Horizons International Academy',
        slug: 'bright-horizons-academy',
        category: 'School',
        subcategory: 'Primary & Secondary Education',
        shortName: 'Bright Horizons',
        phone: '+251 912 345 678',
        email: 'admissions@brighthorizons.edu.et',
        city: 'Addis Ababa',
        address: 'Sarbet, Behind International Clinic',
        shortDescription: 'Excellence in education with Ethiopian and international curricula, modern labs, and sports.',
        websiteHeroTitle: 'Nurturing Future Leaders',
        websiteHeroDescription: 'Comprehensive K-12 education with dedicated faculty, digital marklists, and STEM facilities.',
        websiteCtaText: 'Apply for Admissions',
        schoolFeatures: {
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
        },
        isValid: true,
      },
      {
        ...createEmptyCompanyRow(3),
        name: 'Apex Athletic & Wellness Hub',
        slug: 'apex-athletic-hub',
        category: 'Fitness & Gym',
        subcategory: 'Crossfit & Health Spa',
        shortName: 'Apex Gym',
        phone: '+251 913 456 789',
        email: 'info@apexhub.et',
        city: 'Addis Ababa',
        address: 'Kazanchis, Near ECA Building',
        shortDescription: 'State-of-the-art fitness facility featuring certified personal trainers, sauna, and group cardio.',
        websiteHeroTitle: 'Elevate Your Fitness & Health',
        websiteHeroDescription: 'Modern equipment, personal training programs, and nutrition consultations.',
        websiteCtaText: 'Join Today',
        isValid: true,
      },
    ];

    setRows(sampleRows);
  };

  // Quick Batch Fill: Auto-generate slugs for any empty rows
  const autoGenerateAllSlugs = () => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (!r.name) return r;
        const newSlug = generateSlug(r.name);
        const updated = { ...r, slug: newSlug };
        const validation = validateCompanyRow(updated, prev);
        return {
          ...updated,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      })
    );
  };

  // Paste handler on table wrapper
  const handleTablePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.includes('\t') || text.includes('\n'))) {
      const parsed = parseSpreadsheetPaste(text, rows.length, rows);
      setRows(parsed);
    }
  };

  // Export CSV backup of entered data
  const exportDraftCsv = () => {
    const headers = [
      'Company Name',
      'Slug',
      'Category',
      'Subcategory',
      'Short Description',
      'Phone',
      'Email',
      'Address',
      'City',
      'Website URL',
    ];
    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      lines.push(
        [
          escape(r.name),
          escape(r.slug),
          escape(r.category),
          escape(r.subcategory),
          escape(r.shortDescription),
          escape(r.phone),
          escape(r.email),
          escape(r.address),
          escape(r.city),
          escape(r.websiteUrl),
        ].join(',')
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nabsite_companies_draft_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validation metrics
  const validCount = rows.filter((r) => r.isValid && r.name?.trim().length > 0).length;
  const invalidCount = rows.filter((r) => !r.isValid && r.name?.trim().length > 0).length;
  const approvedCount = rows.filter((r) => r.approvalStatus === 'approved').length;

  return (
    <div className="space-y-6 max-w-full pb-28">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Link to="/owner/companies" className="hover:text-amber-500 transition-colors">
              Companies Vault
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              Company Creation V2.0
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Multi-Company Data Entry & Approval
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/20">
              V2.0 MARKLIST SYSTEM
            </span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Marklist-style spreadsheet data entry for multiple companies, followed by sequential one-by-one website approval and publishing.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {lastSavedTime && (
            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mr-2">
              <Save className="w-3.5 h-3.5 text-emerald-500" />
              <span>Draft auto-saved {lastSavedTime}</span>
            </div>
          )}

          {viewMode === 'spreadsheet' && (
            <>
              <Button
                size="sm"
                variant="outline"
                icon={Sparkles}
                onClick={loadSampleBatch}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400"
                title="Load 3 sample enterprises (Café, School, Gym) for instant testing"
              >
                Load Sample Batch
              </Button>

              <Button
                size="sm"
                variant="outline"
                icon={Clipboard}
                onClick={() => setIsPasteModalOpen(true)}
                className="text-xs font-semibold"
              >
                Paste from Excel
              </Button>

              <Button
                size="sm"
                variant="outline"
                icon={Download}
                onClick={exportDraftCsv}
                className="text-xs font-semibold"
                title="Download draft as CSV"
              >
                Export Backup
              </Button>
            </>
          )}

          {viewMode === 'spreadsheet' ? (
            <Button
              size="sm"
              variant="primary"
              icon={ArrowRight}
              onClick={() => setViewMode('approval')}
              disabled={validCount === 0}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              Proceed to Website Approval ({validCount} Ready)
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              icon={FileSpreadsheet}
              onClick={() => setViewMode('spreadsheet')}
              className="text-xs font-bold"
            >
              Back to Spreadsheet View
            </Button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs (Spreadsheet vs Sequential Approval) */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('spreadsheet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'spreadsheet'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>1. Spreadsheet Data Entry ({rows.length} Rows)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('approval')}
          disabled={validCount === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewMode === 'approval'
              ? 'bg-emerald-600 text-white shadow-sm'
              : validCount === 0
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>
            2. Sequential Website Approval ({approvedCount}/{validCount} Approved)
          </span>
        </button>
      </div>

      {/* VIEW MODE 1: SPREADSHEET DATA ENTRY */}
      {viewMode === 'spreadsheet' && (
        <div className="space-y-6">
          {/* Row Control Ribbon & Shortcuts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            {/* Add Row Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
                Add Rows:
              </span>
              <Button
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() => addRows(1)}
                className="text-xs font-semibold"
              >
                + 1 Company
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addRows(5)}
                className="text-xs font-semibold"
              >
                + 5 Rows
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addRows(10)}
                className="text-xs font-semibold"
              >
                + 10 Rows
              </Button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={autoGenerateAllSlugs}
                className="text-xs text-slate-600 hover:text-amber-600 font-semibold"
                title="Auto-fill URL slugs for all rows from their names"
              >
                Auto-generate Slugs
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearEmptyRows}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear Empty Rows
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={resetEntireTable}
                className="text-xs text-rose-500 hover:text-rose-700"
              >
                Reset Table
              </Button>
            </div>

            {/* Quick Search & Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter current rows..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-44"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="School">School</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Keyboard Navigation Tip */}
          <div className="px-4 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-amber-600" />
              <span>
                <strong>Marklist 2.0 Speed Navigation:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/60 font-mono text-[10px]">Enter</kbd> to save and move to the next row (auto-creates new rows). Use <kbd className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/60 font-mono text-[10px]">Tab</kbd> or arrow keys to move between cells.
              </span>
            </div>
            <span className="hidden md:inline font-mono text-[10px]">
              {validCount} ready for one-by-one approval
            </span>
          </div>

          {/* Spreadsheet Master Table */}
          <div
            ref={tableRef}
            onPaste={handleTablePaste}
            className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto max-h-[65vh]">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                {/* Sticky Table Header */}
                <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 select-none">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-20 text-center">Status</th>
                    <th className="p-3 min-w-[220px]">
                      Company Name <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 min-w-[170px]">
                      Slug (/c/slug) <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 min-w-[160px]">
                      Category <span className="text-red-500">*</span>
                    </th>
                    <th className="p-3 min-w-[150px]">Short / Legal Name</th>
                    <th className="p-3 min-w-[150px]">Main Phone</th>
                    <th className="p-3 min-w-[180px]">Main Email</th>
                    <th className="p-3 min-w-[130px]">City</th>
                    <th className="p-3 min-w-[200px]">Address</th>
                    <th className="p-3 w-36 text-center">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {rows.map((row, index) => {
                    // Apply search/category filter
                    if (filterQuery) {
                      const q = filterQuery.toLowerCase();
                      const matchName = (row.name || '').toLowerCase().includes(q);
                      const matchSlug = (row.slug || '').toLowerCase().includes(q);
                      const matchCat = (row.category || '').toLowerCase().includes(q);
                      const matchCity = (row.city || '').toLowerCase().includes(q);
                      if (!matchName && !matchSlug && !matchCat && !matchCity) return null;
                    }
                    if (categoryFilter !== 'ALL' && row.category !== categoryFilter) {
                      return null;
                    }

                    const hasError = !row.isValid;
                    const errorMsg = Object.values(row.errors || {}).join(' | ');
                    const isApproved = row.approvalStatus === 'approved';

                    return (
                      <tr
                        key={row.tempId}
                        className={`transition-colors group hover:bg-amber-50/40 dark:hover:bg-amber-950/20 ${
                          isApproved
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                            : hasError && row.name
                            ? 'bg-rose-50/30 dark:bg-rose-950/10'
                            : ''
                        }`}
                      >
                        {/* Row Index */}
                        <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Status Badge */}
                        <td className="p-2.5 text-center">
                          {isApproved ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              title="Approved & Created in Firestore"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved
                            </span>
                          ) : row.isValid && row.name ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              title="Ready for approval"
                            >
                              Ready
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
                              title={errorMsg || 'Fill required fields (Company Name & Slug)'}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Incomplete
                            </span>
                          )}
                        </td>

                        {/* Col 0: Company Name Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-0`}
                            type="text"
                            value={row.name}
                            onChange={(e) => updateCell(index, 'name', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 0)}
                            placeholder="e.g. Lucy Ethiopian Coffee"
                            className={`w-full px-2.5 py-1.5 text-xs bg-transparent rounded border transition-colors text-slate-900 dark:text-white font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              row.errors?.name
                                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          />
                        </td>

                        {/* Col 1: Slug Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-1`}
                            type="text"
                            value={row.slug}
                            onChange={(e) => updateCell(index, 'slug', e.target.value.toLowerCase())}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 1)}
                            placeholder="lucy-coffee"
                            className={`w-full px-2.5 py-1.5 text-xs bg-transparent rounded border transition-colors text-slate-700 dark:text-slate-300 font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              row.errors?.slug
                                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          />
                        </td>

                        {/* Col 2: Category Cell */}
                        <td className="p-1.5">
                          <select
                            id={`grid-cell-${index}-2`}
                            value={row.category}
                            onChange={(e) => updateCell(index, 'category', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 2)}
                            className="w-full px-2 py-1.5 text-xs bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="School">School</option>
                            {BUSINESS_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Col 3: Short / Legal Name Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-3`}
                            type="text"
                            value={row.shortName || ''}
                            onChange={(e) => updateCell(index, 'shortName', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 3)}
                            placeholder="Lucy"
                            className="w-full px-2.5 py-1.5 text-xs bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>

                        {/* Col 4: Main Phone Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-4`}
                            type="tel"
                            value={row.phone || ''}
                            onChange={(e) => updateCell(index, 'phone', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 4)}
                            placeholder="+251 911 000 000"
                            className="w-full px-2.5 py-1.5 text-xs bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>

                        {/* Col 5: Main Email Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-5`}
                            type="email"
                            value={row.email || ''}
                            onChange={(e) => updateCell(index, 'email', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 5)}
                            placeholder="contact@enterprise.com"
                            className={`w-full px-2.5 py-1.5 text-xs bg-transparent rounded border transition-colors text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              row.errors?.email
                                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          />
                        </td>

                        {/* Col 6: City Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-6`}
                            type="text"
                            value={row.city || ''}
                            onChange={(e) => updateCell(index, 'city', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 6)}
                            placeholder="Addis Ababa"
                            className="w-full px-2.5 py-1.5 text-xs bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>

                        {/* Col 7: Address Cell */}
                        <td className="p-1.5">
                          <input
                            id={`grid-cell-${index}-7`}
                            type="text"
                            value={row.address || ''}
                            onChange={(e) => updateCell(index, 'address', e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, index, 7)}
                            placeholder="Bole Subcity"
                            className="w-full px-2.5 py-1.5 text-xs bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>

                        {/* Actions Column */}
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveEditingIndex(index)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Open Full Details Editor (Story, Hours, Location, Branding, School Features)"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateRow(index)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Duplicate row"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => clearRow(index)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              title="Clear row inputs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRow(index)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span> Total Rows:
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Valid & Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                      <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} Incomplete
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400">
                  Double click any row or click the <Sliders className="w-3 h-3 inline mx-0.5" /> icon to edit all 8 tabs of business information.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Plus}
                  onClick={() => addRows(1)}
                  className="text-xs font-semibold"
                >
                  Add Row
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => setViewMode('approval')}
                  disabled={validCount === 0}
                  className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                >
                  Proceed to Website Approval ({validCount} Ready)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SEQUENTIAL WEBSITE APPROVAL STUDIO ("APPROVING EACH ONE BY ONE THERE AND FINISHED") */}
      {viewMode === 'approval' && (
        <SequentialWebsiteApprovalStudio
          rows={rows}
          onUpdateRow={(idx, updated) => {
            setRows((prev) => {
              const next = [...prev];
              next[idx] = updated;
              return next;
            });
          }}
          onOpenRowDetails={(idx) => setActiveEditingIndex(idx)}
          onBackToSpreadsheet={() => setViewMode('spreadsheet')}
          onFinishedAll={(created) => {
            console.log('All websites finished and approved:', created);
          }}
        />
      )}

      {/* Row Full Details Modal */}
      {activeEditingIndex !== null && rows[activeEditingIndex] && (
        <CompanyRowDetailsModal
          row={rows[activeEditingIndex]}
          rowIndex={activeEditingIndex}
          isOpen={true}
          onClose={() => setActiveEditingIndex(null)}
          onSave={(updatedRow) => {
            setRows((prev) => {
              const next = [...prev];
              const validation = validateCompanyRow(updatedRow, next);
              next[activeEditingIndex] = {
                ...updatedRow,
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
              };
              return next;
            });
            setActiveEditingIndex(null);
          }}
        />
      )}

      {/* Excel / Google Sheets Paste Modal */}
      <CompanyPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        existingRows={rows}
        onApplyParsedRows={(newRows) => {
          setRows(newRows);
        }}
      />

      {/* Review Modal (Backup Quick Trigger) */}
      <CompanyCreationReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        rows={rows}
        onSuccessCreated={(created) => {
          console.log(`Successfully created ${created.length} companies.`);
        }}
      />
    </div>
  );
};
