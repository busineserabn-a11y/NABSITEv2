import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  downloadSpreadsheetFile,
  parseUploadedFile,
  SAMPLE_MENU_DATA,
  SAMPLE_PAGES_DATA,
  SAMPLE_OFFERS_DATA,
  SAMPLE_ANNOUNCEMENTS_DATA,
  SAMPLE_QR_DATA,
  executeBulkMenuImport,
  executeBulkPagesImport,
  executeBulkOffersImport,
  executeBulkAnnouncementsImport,
  RawMenuRow,
  RawPageRow,
  RawOfferRow,
  RawAnnouncementRow,
  RawQrRow,
} from '../../lib/bulkImport';
import { api } from '../../lib/api';

export type SubModuleType = 'menu' | 'pages' | 'offers' | 'announcements' | 'qr';

interface SubModuleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleType: SubModuleType;
  companyId: string;
  companyName: string;
  companyKey?: string;
  onSuccess: () => void;
}

export const SubModuleImportModal: React.FC<SubModuleImportModalProps> = ({
  isOpen,
  onClose,
  moduleType,
  companyId,
  companyName,
  companyKey = 'C001',
  onSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{ created: number; updated: number; failed: number; errors: string[] } | null>(null);

  const getModuleConfig = () => {
    switch (moduleType) {
      case 'menu':
        return {
          title: 'Import Digital Menu Catalog',
          desc: `Upload meals, drinks, categories, prices in ETB, and dietary tags for ${companyName}.`,
          sampleData: SAMPLE_MENU_DATA.map((d) => ({ ...d, company_key: companyKey })),
          templateFilename: `NABSITE_Menu_Template_${companyKey}`,
          columns: [
            { key: 'category_name', label: 'Category Name', req: true, ex: 'Main Dishes' },
            { key: 'item_name', label: 'Item / Dish Name', req: true, ex: 'Special Doro Wat' },
            { key: 'price', label: 'Price (ETB)', req: true, ex: '450' },
            { key: 'currency', label: 'Currency', req: false, ex: 'ETB' },
            { key: 'description', label: 'Description', req: false, ex: 'Slow-cooked traditional chicken with teff injera' },
            { key: 'image_url', label: 'Image URL', req: false, ex: 'https://images.unsplash.com/photo-...' },
            { key: 'ingredients', label: 'Ingredients', req: false, ex: 'Chicken, Berbere, Kibbeh' },
            { key: 'available', label: 'Available', req: false, ex: 'true' },
            { key: 'featured', label: 'Featured', req: false, ex: 'true' },
          ],
        };
      case 'pages':
        return {
          title: 'Import Website Custom Pages',
          desc: `Bulk configure page sections, slugs, navigation entries, and layouts for ${companyName}.`,
          sampleData: SAMPLE_PAGES_DATA.map((d) => ({ ...d, company_key: companyKey })),
          templateFilename: `NABSITE_Pages_Template_${companyKey}`,
          columns: [
            { key: 'page_name', label: 'Page Name', req: true, ex: 'About Us' },
            { key: 'slug', label: 'Slug', req: true, ex: 'about' },
            { key: 'title', label: 'Page Title', req: true, ex: 'Our Culinary Story' },
            { key: 'page_type', label: 'Page Type', req: false, ex: 'landing' },
            { key: 'description', label: 'Description', req: false, ex: 'Brief overview for hero section' },
            { key: 'visible', label: 'Visible', req: false, ex: 'true' },
          ],
        };
      case 'offers':
        return {
          title: 'Import Promotional Offers & Discounts',
          desc: `Add special bundles, discount percentages, promo banners, and expiry dates for ${companyName}.`,
          sampleData: SAMPLE_OFFERS_DATA.map((d) => ({ ...d, company_key: companyKey })),
          templateFilename: `NABSITE_Offers_Template_${companyKey}`,
          columns: [
            { key: 'offer_key', label: 'Offer Key', req: true, ex: 'OFFER_LUNCH' },
            { key: 'title', label: 'Offer Title', req: true, ex: 'Executive Business Lunch' },
            { key: 'discount_badge', label: 'Discount Badge', req: true, ex: '20% OFF' },
            { key: 'short_description', label: 'Description', req: false, ex: 'Includes lunch and coffee' },
            { key: 'start_date', label: 'Start Date', req: false, ex: '2026-08-01' },
            { key: 'end_date', label: 'End Date', req: false, ex: '2026-12-31' },
            { key: 'image_url', label: 'Image URL', req: false, ex: 'https://images.unsplash.com/photo-...' },
          ],
        };
      case 'announcements':
        return {
          title: 'Import Announcements & Live Bulletins',
          desc: `Broadcast events, live notices, urgent schedule updates, and promotions for ${companyName}.`,
          sampleData: SAMPLE_ANNOUNCEMENTS_DATA.map((d) => ({ ...d, company_key: companyKey })),
          templateFilename: `NABSITE_Announcements_Template_${companyKey}`,
          columns: [
            { key: 'announcement_key', label: 'Announcement Key', req: true, ex: 'ANN_LIVE_MUSIC' },
            { key: 'title', label: 'Announcement Title', req: true, ex: 'Live Ethio-Jazz Fridays' },
            { key: 'content', label: 'Content', req: true, ex: 'Every Friday from 7:00 PM' },
            { key: 'priority', label: 'Priority', req: false, ex: 'high' },
            { key: 'start_date', label: 'Start Date', req: false, ex: '2026-08-01' },
            { key: 'end_date', label: 'End Date', req: false, ex: '2026-12-31' },
          ],
        };
      case 'qr':
        return {
          title: 'Import QR Configurations',
          desc: `Configure branded table stands, review plaques, and digital destinations for ${companyName}.`,
          sampleData: SAMPLE_QR_DATA.map((d) => ({ ...d, company_key: companyKey })),
          templateFilename: `NABSITE_QR_Template_${companyKey}`,
          columns: [
            { key: 'qr_key', label: 'QR Key', req: true, ex: 'QR_TABLE_1' },
            { key: 'title', label: 'Title / Placement', req: true, ex: 'Table 1 Dining Stand' },
            { key: 'target_type', label: 'Destination Type', req: true, ex: 'menu' },
            { key: 'target_url', label: 'Destination URL', req: true, ex: 'https://nabsite.io/c/company/menu' },
            { key: 'caption', label: 'Stand Caption', req: false, ex: 'SCAN TO ORDER' },
            { key: 'fg_color', label: 'Foreground Color', req: false, ex: '#0F172A' },
            { key: 'bg_color', label: 'Background Color', req: false, ex: '#FFFFFF' },
          ],
        };
    }
  };

  const config = getModuleConfig();

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    // Generate empty template with headers
    const emptyRow: Record<string, string> = {};
    config.columns.forEach((c) => {
      emptyRow[c.key] = '';
    });
    downloadSpreadsheetFile([emptyRow], config.templateFilename, format);
  };

  const handleDownloadSample = () => {
    downloadSpreadsheetFile(config.sampleData, `${config.templateFilename}_SAMPLE`, 'xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportError(null);
      const rows = await parseUploadedFile(file);
      if (!rows || rows.length === 0) {
        throw new Error('The uploaded spreadsheet contains no data rows.');
      }
      setParsedRows(rows);
      setStep('preview');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse file.');
    }
  };

  const handleExecuteImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      if (moduleType === 'menu') {
        const res = await executeBulkMenuImport(companyId, parsedRows as RawMenuRow[]);
        setResultStats({ ...res, updated: 0 });
      } else if (moduleType === 'pages') {
        const res = await executeBulkPagesImport(companyId, parsedRows as RawPageRow[]);
        setResultStats({ created: res.created, updated: 0, failed: res.failed, errors: res.errors });
      } else if (moduleType === 'offers') {
        const res = await executeBulkOffersImport(companyId, parsedRows as RawOfferRow[]);
        setResultStats({ created: res.created, updated: 0, failed: res.failed, errors: res.errors });
      } else if (moduleType === 'announcements') {
        const res = await executeBulkAnnouncementsImport(companyId, parsedRows as RawAnnouncementRow[]);
        setResultStats({ created: res.created, updated: 0, failed: res.failed, errors: res.errors });
      } else if (moduleType === 'qr') {
        let created = 0;
        let failed = 0;
        const errors: string[] = [];
        for (const qrRow of parsedRows as RawQrRow[]) {
          try {
            await api.createQr({
              companyId,
              title: qrRow.title || 'Table QR Stand',
              targetUrl: qrRow.target_url || `${window.location.origin}/c/${companyId}`,
              frameStyle: (qrRow.frame_style as any) || 'badge',
              fgColor: qrRow.fg_color || '#0F172A',
              bgColor: qrRow.bg_color || '#FFFFFF',
            });
            created++;
          } catch (e: any) {
            failed++;
            errors.push(`QR ${qrRow.title || 'Stand'}: ${e.message}`);
          }
        }
        setResultStats({ created, updated: 0, failed, errors });
      }

      setStep('results');
      onSuccess();
    } catch (err: any) {
      setImportError(err.message || 'Import execution encountered an error.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setParsedRows([]);
    setResultStats(null);
    setImportError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      description={config.desc}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { key: 'upload', label: '1. Template & Upload' },
            { key: 'preview', label: '2. Validate & Preview' },
            { key: 'results', label: '3. Import Results' },
          ].map((s) => (
            <div
              key={s.key}
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                step === s.key
                  ? 'text-amber-500 font-black'
                  : 'text-slate-400'
              }`}
            >
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {importError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Blank Template</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Get the official spreadsheet with pre-formatted column headers for {config.title}.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={() => handleDownloadTemplate('xlsx')}
                  >
                    Excel (.xlsx)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={() => handleDownloadTemplate('csv')}
                  >
                    CSV (.csv)
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Download Sample Dataset</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pre-filled with realistic sample rows formatted specifically for {companyName}.
                </p>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Download}
                    onClick={handleDownloadSample}
                  >
                    Download Sample Excel
                  </Button>
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload */}
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-3xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-950/40">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Click to browse or drop spreadsheet file here
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json)
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  Target Entity: {companyName}
                </Badge>
              </div>
            </div>

            {/* Expected Columns Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Spreadsheet Column Reference</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {config.columns.map((c) => (
                  <div key={c.key} className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{c.key}</span>
                      {c.req && <span className="text-[10px] text-rose-500 font-bold">REQ</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW TABLE */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Validated Spreadsheet ({parsedRows.length} Rows Detected)
                </h4>
                <p className="text-xs text-slate-500">
                  Verify the parsed records below before executing Firestore persistence.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleReset}>
                Choose Different File
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    {config.columns.slice(0, 5).map((col) => (
                      <th key={col.key} className="p-2.5">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {parsedRows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                      {config.columns.slice(0, 5).map((col) => (
                        <td key={col.key} className="p-2.5 truncate max-w-[150px]">
                          {String(row[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedRows.length > 50 && (
              <p className="text-xs text-slate-400 text-center">
                Showing first 50 rows of {parsedRows.length} total rows.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" onClick={handleReset} disabled={importing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={handleExecuteImport}
                isLoading={importing}
              >
                Import {parsedRows.length} Records
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS SUMMARY */}
        {step === 'results' && resultStats && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Import Completed Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data has been verified and permanently written to Firestore.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Created
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {resultStats.created}
                </div>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Updated
                </span>
                <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                  {resultStats.updated}
                </div>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                  Failed
                </span>
                <div className="text-xl font-black text-rose-500 mt-0.5">
                  {resultStats.failed}
                </div>
              </div>
            </div>

            {resultStats.errors && resultStats.errors.length > 0 && (
              <div className="text-left p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                <div className="font-bold">Errors encountered during import:</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {resultStats.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="primary" onClick={onClose}>
                Done & Refresh View
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
