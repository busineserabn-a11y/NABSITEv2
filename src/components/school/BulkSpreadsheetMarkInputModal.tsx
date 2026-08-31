import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Download,
  Upload,
  RefreshCw,
  Save,
  HelpCircle,
  Table,
} from 'lucide-react';
import {
  AcademicYear,
  Grade,
  Section,
  Subject,
  MarklistEntry,
  Company,
  AssessmentComponent,
} from '../../types';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  parseSpreadsheetPastedText,
  computeStudentSubjectResult,
} from '../../lib/academicUtils';

interface BulkSpreadsheetMarkInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  academicYears: AcademicYear[];
  grades: Grade[];
  sections: Section[];
  subjects: Subject[];
  initialSelection?: {
    academicYearId?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
  };
  onSuccessSave: () => void;
}

export const BulkSpreadsheetMarkInputModal: React.FC<BulkSpreadsheetMarkInputModalProps> = ({
  isOpen,
  onClose,
  company,
  academicYears,
  grades,
  sections,
  subjects,
  initialSelection,
  onSuccessSave,
}) => {
  if (!isOpen) return null;

  // Filter selections
  const [selectedYearId, setSelectedYearId] = useState<string>(
    initialSelection?.academicYearId || academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || ''
  );
  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    initialSelection?.gradeId || grades[0]?.id || ''
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSelection?.sectionId || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSelection?.subjectId || ''
  );

  // Target assessment component mode: 'ALL_COMPONENTS' or specific component ID or 'FINAL_SCORE'
  const [selectedComponentId, setSelectedComponentId] = useState<string>('ALL_COMPONENTS');

  // Paste raw text buffer & parsing
  const [pasteBuffer, setPasteBuffer] = useState<string>('');
  const [pasteMode, setPasteMode] = useState<'SCORE_ONLY' | 'NAME_AND_SCORE'>('SCORE_ONLY');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);

  // Marklist Data
  const [entries, setEntries] = useState<MarklistEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter sections and subjects
  const availableSections = useMemo(() => {
    if (!selectedGradeId) return [];
    return sections.filter((s) => s.gradeId === selectedGradeId);
  }, [sections, selectedGradeId]);

  const availableSubjects = useMemo(() => {
    if (!selectedGradeId) return subjects;
    return subjects.filter((s) => s.isCommon || (s.gradeIds && s.gradeIds.includes(selectedGradeId)));
  }, [subjects, selectedGradeId]);

  // Keep section & subject in sync
  useEffect(() => {
    if (availableSections.length > 0) {
      if (!selectedSectionId || !availableSections.some((s) => s.id === selectedSectionId)) {
        setSelectedSectionId(availableSections[0].id);
      }
    } else {
      setSelectedSectionId('');
    }
  }, [availableSections, selectedSectionId]);

  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubjectId || !availableSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [availableSubjects, selectedSubjectId]);

  // Active Subject details & assessment components
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentGrade = grades.find((g) => g.id === selectedGradeId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);
  const currentYear = academicYears.find((y) => y.id === selectedYearId);
  const components: AssessmentComponent[] = currentSubject?.assessmentComponents || [];

  // Fetch marklist when filters change
  const fetchRoster = async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.getMarklist(
        company.id,
        selectedYearId,
        selectedGradeId,
        selectedSectionId,
        selectedSubjectId
      );
      setEntries(data.entries || []);
    } catch (err: any) {
      console.error('Failed to load roster:', err);
      setFeedback({ type: 'error', message: 'Failed to load student roster.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [company.id, selectedYearId, selectedGradeId, selectedSectionId, selectedSubjectId]);

  // Helper: Update a single student's component score
  const handleUpdateComponentScore = (studentId: string, compId: string, val: string) => {
    const numeric = val === '' ? null : parseFloat(val);
    const comp = components.find((c) => c.id === compId);
    const compMax = comp?.maxScore || 100;

    if (numeric !== null && (isNaN(numeric) || numeric < 0 || numeric > compMax)) {
      return;
    }

    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.studentId !== studentId) return entry;
        const nextCompScores = {
          ...(entry.componentScores || {}),
          [compId]: numeric,
        };

        // Recalculate full weighted total if subject has components
        const result = computeStudentSubjectResult(nextCompScores, currentSubject || null);
        return {
          ...entry,
          componentScores: nextCompScores,
          score: result.finalPercentage !== null ? result.finalPercentage : entry.score,
          weightedTotal: result.finalPercentage,
        };
      })
    );
  };

  // Helper: Update overall score directly
  const handleUpdateFinalScore = (studentId: string, val: string) => {
    const numeric = val === '' ? null : parseFloat(val);
    if (numeric !== null && (isNaN(numeric) || numeric < 0 || numeric > 100)) {
      return;
    }
    setEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId
          ? { ...entry, score: numeric, weightedTotal: numeric }
          : entry
      )
    );
  };

  // Apply Pasted Spreadsheet Data
  const handleApplyPastedText = () => {
    if (!pasteBuffer.trim()) return;

    const parsed = parseSpreadsheetPastedText(pasteBuffer);
    if (parsed.length === 0) {
      setFeedback({ type: 'error', message: 'Could not detect numeric marks in pasted text.' });
      return;
    }

    let appliedCount = 0;

    setEntries((prev) => {
      const next = [...prev];

      // If pasting for a specific component
      if (selectedComponentId !== 'ALL_COMPONENTS' && selectedComponentId !== 'FINAL_SCORE') {
        const targetComp = components.find((c) => c.id === selectedComponentId);
        const compMax = targetComp?.maxScore || 100;

        for (let i = 0; i < Math.min(next.length, parsed.length); i++) {
          const row = parsed[i];
          const rawScore = row && row[0] !== undefined && row[0] !== '' ? parseFloat(row[0]) : NaN;
          if (!isNaN(rawScore) && rawScore >= 0 && rawScore <= compMax) {
            const currentComps = { ...(next[i].componentScores || {}), [selectedComponentId]: rawScore };
            const result = computeStudentSubjectResult(currentComps, currentSubject || null);
            next[i] = {
              ...next[i],
              componentScores: currentComps,
              score: result.finalPercentage !== null ? result.finalPercentage : next[i].score,
              weightedTotal: result.finalPercentage,
            };
            appliedCount++;
          }
        }
      } else if (selectedComponentId === 'ALL_COMPONENTS' && components.length > 0) {
        // Multi-column paste
        for (let i = 0; i < Math.min(next.length, parsed.length); i++) {
          const row = parsed[i];
          if (!row || row.length === 0) continue;
          const currentComps = { ...(next[i].componentScores || {}) };
          let changed = false;

          components.forEach((comp, colIdx) => {
            const cellVal = row[colIdx];
            if (cellVal !== undefined && cellVal !== '') {
              const valNum = parseFloat(cellVal);
              if (!isNaN(valNum) && valNum >= 0 && valNum <= comp.maxScore) {
                currentComps[comp.id] = valNum;
                changed = true;
              }
            }
          });

          if (changed) {
            const result = computeStudentSubjectResult(currentComps, currentSubject || null);
            next[i] = {
              ...next[i],
              componentScores: currentComps,
              score: result.finalPercentage !== null ? result.finalPercentage : next[i].score,
              weightedTotal: result.finalPercentage,
            };
            appliedCount++;
          }
        }
      } else {
        // Pasting directly into final score
        for (let i = 0; i < Math.min(next.length, parsed.length); i++) {
          const row = parsed[i];
          const rawScore = row && row[0] !== undefined && row[0] !== '' ? parseFloat(row[0]) : NaN;
          if (!isNaN(rawScore) && rawScore >= 0 && rawScore <= 100) {
            next[i] = {
              ...next[i],
              score: rawScore,
              weightedTotal: rawScore,
            };
            appliedCount++;
          }
        }
      }

      return next;
    });

    setFeedback({
      type: 'success',
      message: `Successfully pasted and populated marks for ${appliedCount} students in order!`,
    });
    setPasteBuffer('');
    setShowPasteBox(false);
  };

  // Save All Marks to Firebase
  const handleSaveAll = async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await api.saveMarklist({
        companyId: company.id,
        academicYearId: selectedYearId,
        gradeId: selectedGradeId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        maxScore: 100,
        status: 'submitted',
        entries,
        lastUpdatedBy: 'Bulk Spreadsheet Input Tool',
      });

      setFeedback({ type: 'success', message: 'All student marks saved successfully!' });
      onSuccessSave();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save bulk marks:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save marks.' });
    } finally {
      setSaving(false);
    }
  };

  // Copy Template structure to clipboard
  const handleCopyTemplate = () => {
    const headers = ['#', 'Student ID', 'Admission No', 'Full Name'];
    if (components.length > 0) {
      components.forEach((c) => headers.push(`${c.name} (${c.weight}%, max ${c.maxScore})`));
      headers.push('Weighted Total (100%)');
    } else {
      headers.push('Mark / Score (100%)');
    }

    const rows = entries.map((e, idx) => {
      const base = [idx + 1, e.studentId, e.admissionNo, e.studentName];
      if (components.length > 0) {
        components.forEach((c) => base.push(e.componentScores?.[c.id] ?? ''));
        base.push(e.weightedTotal ?? e.score ?? '');
      } else {
        base.push(e.score ?? '');
      }
      return base.join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(tsv);
    setFeedback({ type: 'success', message: 'Template copied to clipboard! You can paste it directly into Excel or Google Sheets.' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Spreadsheet-Style Bulk Mark Input Table
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fast multi-student score entry with copy-paste from Excel / Google Sheets and weighted calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Copy} onClick={handleCopyTemplate}>
              Copy Excel Template
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 mx-6 mt-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 4 Filter Dropdowns & Component Selector Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Grade Level
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Section / Stream
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={availableSections.length === 0}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {availableSections.length === 0 ? (
                <option value="">No sections found</option>
              ) : (
                availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Curriculum Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjects.length === 0}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {availableSubjects.length === 0 ? (
                <option value="">No subjects found</option>
              ) : (
                availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code || 'CODE'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Fast Action Paste Drawer Toggle */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Roster: {entries.length} Students
            </span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold">
              {currentGrade?.name} — {currentSection?.name} ({currentSubject?.name})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                showPasteBox
                  ? 'bg-sky-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {showPasteBox ? 'Hide Paste Box' : 'Paste Column from Spreadsheet'}
            </button>
          </div>
        </div>

        {/* Paste from Excel / Spreadsheet Box */}
        {showPasteBox && (
          <div className="p-4 sm:p-6 bg-sky-500/5 border-b border-sky-500/20 space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-white">
                  Target Paste Column:
                </span>
                <select
                  value={selectedComponentId}
                  onChange={(e) => setSelectedComponentId(e.target.value)}
                  className="h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.weight}%, max {c.maxScore})
                    </option>
                  ))}
                  <option value="FINAL_SCORE">Full Final Score (100%)</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Copy a column of scores from Excel and paste it below. They will be mapped row-by-row to the students.
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="Paste numbers or rows from Excel/Sheets here (e.g. 18, 19.5, 20 or tab-separated column)..."
              value={pasteBuffer}
              onChange={(e) => setPasteBuffer(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPasteBox(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={handleApplyPastedText}
                disabled={!pasteBuffer.trim()}
              >
                Apply Marks to Roster
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Spreadsheet Table View */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading spreadsheet table...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Table className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No students enrolled in this grade & section
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">Student Name</th>
                  <th className="py-3 px-3 w-32">Admission / FAN</th>
                  
                  {/* Dynamic Columns for each assessment component */}
                  {components.length > 0 ? (
                    components.map((comp) => (
                      <th key={comp.id} className="py-3 px-3 text-center min-w-[120px] bg-slate-50 dark:bg-slate-800/90 border-l border-slate-200 dark:border-slate-700">
                        <div>{comp.name}</div>
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">
                          {comp.weight}% • Max {comp.maxScore}
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-3 px-3 text-center min-w-[120px]">
                      Score (Max: 100)
                    </th>
                  )}

                  <th className="py-3 px-3 text-center min-w-[130px] bg-emerald-50 dark:bg-emerald-950/20 border-l border-slate-200 dark:border-slate-700">
                    <div>Weighted Total</div>
                    <div className="text-[10px] text-emerald-600 font-normal">100% Final Score</div>
                  </th>
                  <th className="py-3 px-3 w-28 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {entries.map((stu, index) => {
                  const studentBreakdown = computeStudentSubjectResult(
                    stu.componentScores || {},
                    currentSubject || null
                  );
                  const displayTotal =
                    components.length > 0
                      ? studentBreakdown.finalPercentage
                      : stu.score;

                  return (
                    <tr
                      key={stu.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {stu.studentName}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {stu.admissionNo}
                      </td>

                      {/* Component Inputs */}
                      {components.length > 0 ? (
                        components.map((comp) => {
                          const currentVal = stu.componentScores?.[comp.id];
                          const isOver = currentVal !== null && currentVal !== undefined && currentVal > comp.maxScore;

                          return (
                            <td
                              key={comp.id}
                              className="py-2 px-2 text-center border-l border-slate-100 dark:border-slate-800"
                            >
                              <input
                                type="number"
                                min="0"
                                max={comp.maxScore}
                                step="0.5"
                                placeholder="—"
                                value={currentVal !== null && currentVal !== undefined ? currentVal : ''}
                                onChange={(e) =>
                                  handleUpdateComponentScore(stu.studentId, comp.id, e.target.value)
                                }
                                className={`w-20 h-8 text-center font-bold text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                                  isOver
                                    ? 'border-rose-500 text-rose-600 bg-rose-50'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-sky-500/20'
                                }`}
                              />
                            </td>
                          );
                        })
                      ) : (
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="—"
                            value={stu.score !== null && stu.score !== undefined ? stu.score : ''}
                            onChange={(e) => handleUpdateFinalScore(stu.studentId, e.target.value)}
                            className="w-20 h-8 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </td>
                      )}

                      {/* Total Calculation */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/10">
                        {displayTotal !== null && displayTotal !== undefined ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {displayTotal}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Incomplete</span>
                        )}
                      </td>

                      {/* Grade Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {displayTotal !== null && displayTotal !== undefined ? (
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                            {studentBreakdown.gradeLetter}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            {entries.length > 0 && (
              <span>
                All changes auto-calculate live. Click <strong>Save All Marks</strong> to store in database.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel / Close
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              isLoading={saving}
              onClick={handleSaveAll}
              disabled={entries.length === 0}
            >
              Save All Marks to Database
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
