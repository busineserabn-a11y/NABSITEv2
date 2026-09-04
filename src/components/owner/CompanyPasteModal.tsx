import React, { useState } from 'react';
import { X, Clipboard, ArrowRight, Table, Check, AlertCircle } from 'lucide-react';
import { CompanyCreationRow } from '../../types/companyCreation';
import { parseSpreadsheetPaste } from '../../lib/companyCreationValidator';
import { Button } from '../ui/Button';

interface CompanyPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedRows: (newRows: CompanyCreationRow[], mode: 'append' | 'replace' | 'insert') => void;
  existingRows: CompanyCreationRow[];
}

export const CompanyPasteModal: React.FC<CompanyPasteModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedRows,
  existingRows,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [insertMode, setInsertMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const previewLines = pasteText
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const previewRows = previewLines.slice(0, 5).map((line) => line.split('\t'));

  const handleApply = () => {
    if (!pasteText.trim()) return;

    if (insertMode === 'replace') {
      const parsed = parseSpreadsheetPaste(pasteText, 0, []);
      onApplyParsedRows(parsed, 'replace');
    } else {
      const parsed = parseSpreadsheetPaste(pasteText, existingRows.length, existingRows);
      onApplyParsedRows(parsed, 'append');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Paste from Excel or Google Sheets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copy cells directly from your spreadsheet and paste them here (Tab = column, Newline = row).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-900 dark:text-white">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
            <div className="font-bold mb-1">Standard Spreadsheet Column Order:</div>
            <div className="font-mono text-[11px] opacity-90">
              [Col 1: Name] | [Col 2: Slug/Category] | [Col 3: Category/Phone] | [Col 4: Phone/Email] | [Col 5: Email/City] | [Col 6: Address] | [Col 7: City] | [Col 8: Description]
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Paste Clipboard Content (Ctrl+V / Cmd+V)</span>
              {previewLines.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-normal">
                  {previewLines.length} {previewLines.length === 1 ? 'row' : 'rows'} detected
                </span>
              )}
            </label>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Lucy Coffee	lucy-coffee	Café	+251 911 000 111	info@lucy.com	Bole Medhanialem	Addis Ababa	Artisanal coffee house&#10;Addis Academy	addis-academy	School	+251 116 223 344	contact@addisacademy.edu	Kazanchis	Addis Ababa	Excellence in education"
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Live Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-amber-500" />
                Parsed Columns Preview (First {Math.min(5, previewRows.length)} rows):
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2 w-10">#</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Slug / Cat</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {previewRows.map((cells, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                          {cells[0] || '—'}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                          {cells[1] || '—'}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                          {cells[2] || cells[3] || '—'}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                          {cells[3] || cells[4] || '—'}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                          {cells[5] || cells[6] || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action options */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Insert Mode:</span>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="insertMode"
                value="append"
                checked={insertMode === 'append'}
                onChange={() => setInsertMode('append')}
                className="text-amber-600"
              />
              Append to existing table ({existingRows.length} rows currently)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="insertMode"
                value="replace"
                checked={insertMode === 'replace'}
                onChange={() => setInsertMode('replace')}
                className="text-amber-600"
              />
              Replace all rows
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={ArrowRight}
            disabled={previewLines.length === 0}
            onClick={handleApply}
          >
            Import {previewLines.length} {previewLines.length === 1 ? 'Company' : 'Companies'} into Table
          </Button>
        </div>
      </div>
    </div>
  );
};
