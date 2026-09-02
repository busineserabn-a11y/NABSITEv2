import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Download,
  Upload,
  Save,
  Trash2,
  ArrowLeft,
  Search,
  Sliders,
  Percent,
  Check,
  Zap,
  RotateCcw,
  Layers,
  FileText,
  Table,
} from 'lucide-react';
import {
  AcademicYear,
  Grade,
  Section,
  Subject,
  Company,
  Marklist,
  MarklistEntry,
  AssessmentComponent,
} from '../../types';
import { api } from '../../lib/api';
import { parseSpreadsheetPastedText, computeStudentSubjectResult, getLetterGrade } from '../../lib/academicUtils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface MarklistSpreadsheetProps {
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
  onBackToStandardView?: () => void;
  onSaved?: () => void;
}

export const MarklistSpreadsheet: React.FC<MarklistSpreadsheetProps> = ({
  company,
  academicYears,
  grades,
  sections,
  subjects,
  initialSelection,
  onBackToStandardView,
  onSaved,
}) => {
  // 1. Core Selection Keys
  const defaultYearId =
    initialSelection?.academicYearId ||
    academicYears.find((y) => y.isActive)?.id ||
    academicYears[0]?.id ||
    '';

  const [selectedYearId, setSelectedYearId] = useState<string>(defaultYearId);
  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    initialSelection?.gradeId || grades[0]?.id || ''
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    initialSelection?.sectionId || ''
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSelection?.subjectId || ''
  );

  // 2. Filtered Sections & Subjects for Cascading Dropdowns
  const availableSections = useMemo(() => {
    if (!selectedGradeId) return [];
    return sections.filter((s) => s.gradeId === selectedGradeId);
  }, [sections, selectedGradeId]);

  const availableSubjects = useMemo(() => {
    if (!selectedGradeId) return subjects;
    return subjects.filter((s) => s.isCommon || (s.gradeIds && s.gradeIds.includes(selectedGradeId)));
  }, [subjects, selectedGradeId]);

  // Keep section & subject in sync when grade changes
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

  // 3. Active Context Details
  const currentGrade = grades.find((g) => g.id === selectedGradeId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentYear = academicYears.find((y) => y.id === selectedYearId);

  // 4. Assessment Components
  const [localComponents, setLocalComponents] = useState<AssessmentComponent[]>([]);
  const [showWeightAdjuster, setShowWeightAdjuster] = useState<boolean>(false);
  const [savingWeights, setSavingWeights] = useState<boolean>(false);

  useEffect(() => {
    if (currentSubject?.assessmentComponents && currentSubject.assessmentComponents.length > 0) {
      setLocalComponents(currentSubject.assessmentComponents);
    } else {
      setLocalComponents([
        { id: 'comp_assign_1', name: 'Assignment 1', weight: 10, maxScore: 20 },
        { id: 'comp_quiz_1', name: 'Quiz 1', weight: 10, maxScore: 20 },
        { id: 'comp_test_1', name: 'Test 1', weight: 20, maxScore: 50 },
        { id: 'comp_mid_1', name: 'Midterm Exam', weight: 20, maxScore: 50 },
        { id: 'comp_final_1', name: 'Final Exam', weight: 40, maxScore: 100 },
      ]);
    }
  }, [currentSubject?.id, currentSubject?.assessmentComponents]);

  const components: AssessmentComponent[] = localComponents;
  const totalWeight = useMemo(() => {
    return components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  }, [components]);

  // 5. Data & Spreadsheet State
  const [entries, setEntries] = useState<MarklistEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colIdx: number } | null>({ rowIdx: 0, colIdx: 0 });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Quick Column Batch Menu popover
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);

  // Paste drawer buffer & CSV Upload ref
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [pasteBuffer, setPasteBuffer] = useState<string>('');
  const [selectedPasteTarget, setSelectedPasteTarget] = useState<string>('ALL_COMPONENTS');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 6. Fetch Marklist whenever the 4 keys change
  const fetchMarklist = useCallback(async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      setEntries([]);
      setLoading(false);
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
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load marklist in spreadsheet:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load enrolled students.' });
    } finally {
      setLoading(false);
    }
  }, [company.id, selectedYearId, selectedGradeId, selectedSectionId, selectedSubjectId]);

  useEffect(() => {
    fetchMarklist();
  }, [fetchMarklist]);

  // 7. Dynamic Columns definition
  // Columns order:
  // index 0 -> Student ID / FAN (Read-only reference)
  // index 1 -> Student Full Name (Read-only reference)
  // index 2 -> Admission Number (Read-only reference)
  // if components > 0: index 3 .. 3 + components.length - 1 -> Component Score Inputs
  // else: index 3 -> Score (Max 100)
  // then: Weighted Total (Auto calculated)
  // then: Grade Letter (Auto calculated)
  // then: Teacher Remarks
  const editableColStartIdx = 3;
  const numEditableCols = components.length > 0 ? components.length : 1;

  // 8. Cell Focus Helper
  const focusCell = (rowIdx: number, colIdx: number) => {
    const input = document.getElementById(`mark-cell-${rowIdx}-${colIdx}`);
    if (input) {
      input.focus();
      if ((input as HTMLInputElement).select) {
        (input as HTMLInputElement).select();
      }
    }
  };

  // 9. Score Updates
  const updateComponentScore = (studentId: string, compId: string, rawVal: string) => {
    const numeric = rawVal === '' ? null : Math.max(0, parseFloat(rawVal) || 0);
    const targetComp = components.find((c) => c.id === compId);
    const max = targetComp?.maxScore || 100;
    const clamped = numeric !== null ? Math.min(max, numeric) : null;

    setEntries((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;
        const nextCompScores = {
          ...(item.componentScores || {}),
          [compId]: clamped,
        };
        const calc = computeStudentSubjectResult(nextCompScores, currentSubject || null);
        return {
          ...item,
          componentScores: nextCompScores,
          score: calc.finalPercentage !== null ? calc.finalPercentage : item.score,
          weightedTotal: calc.finalPercentage,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const updateSingleScore = (studentId: string, rawVal: string) => {
    const numeric = rawVal === '' ? null : Math.max(0, Math.min(100, parseFloat(rawVal) || 0));
    setEntries((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;
        return {
          ...item,
          score: numeric,
          weightedTotal: numeric,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const updateRemarks = (studentId: string, notes: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, notes } : item))
    );
    setHasUnsavedChanges(true);
  };

  // 10. Bulk Paste Matrix Handler (2.0 Spreadsheet Engine)
  const handlePasteClipboardMatrix = (
    clipboardText: string,
    startRowIdx: number = 0,
    startColIdx: number = 0
  ) => {
    if (!clipboardText || entries.length === 0) {
      setFeedback({ type: 'error', message: 'No enrolled students loaded or empty clipboard.' });
      return;
    }

    const parsedMatrix = parseSpreadsheetPastedText(clipboardText);
    if (parsedMatrix.length === 0) {
      setFeedback({ type: 'error', message: 'Could not parse pasted data.' });
      return;
    }

    // Determine how many editable columns
    const effectiveComps = components;
    let appliedCount = 0;

    setEntries((prev) => {
      const next = [...prev];

      parsedMatrix.forEach((pRow, rOffset) => {
        const targetRowIdx = startRowIdx + rOffset;
        if (targetRowIdx >= next.length) return; // Student roster is bounded by enrolled students

        const rowCopy = { ...next[targetRowIdx] };
        const currentCompScores = { ...(rowCopy.componentScores || {}) };
        let modified = false;

        // Check if pasted data matches column sequence
        pRow.forEach((cellRaw, cOffset) => {
          // If startColIdx is 0 or 1 or 2 (meta columns), allow pasting starting at component 0
          let targetCompIdx = startColIdx - editableColStartIdx + cOffset;
          if (startColIdx < editableColStartIdx) {
            targetCompIdx = cOffset;
          }

          if (effectiveComps.length > 0) {
            if (targetCompIdx >= 0 && targetCompIdx < effectiveComps.length) {
              const comp = effectiveComps[targetCompIdx];
              const cleanedNumber = parseFloat(cellRaw.replace(/[^0-9.-]/g, ''));
              if (!isNaN(cleanedNumber)) {
                const clamped = Math.max(0, Math.min(comp.maxScore, cleanedNumber));
                currentCompScores[comp.id] = clamped;
                modified = true;
              }
            }
          } else {
            // Single score column
            if (targetCompIdx === 0) {
              const cleanedNumber = parseFloat(cellRaw.replace(/[^0-9.-]/g, ''));
              if (!isNaN(cleanedNumber)) {
                const clamped = Math.max(0, Math.min(100, cleanedNumber));
                rowCopy.score = clamped;
                rowCopy.weightedTotal = clamped;
                modified = true;
              }
            }
          }
        });

        if (modified) {
          if (effectiveComps.length > 0) {
            rowCopy.componentScores = currentCompScores;
            const res = computeStudentSubjectResult(currentCompScores, currentSubject || null);
            rowCopy.score = res.finalPercentage !== null ? res.finalPercentage : rowCopy.score;
            rowCopy.weightedTotal = res.finalPercentage;
          }
          next[targetRowIdx] = rowCopy;
          appliedCount++;
        }
      });

      return next;
    });

    setHasUnsavedChanges(true);
    setFeedback({
      type: 'success',
      message: `Successfully pasted and applied scores for ${appliedCount} students starting at row ${startRowIdx + 1}!`,
    });
  };

  // 11. Container Native Paste Event
  const handleContainerPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    // Check if user is typing normally inside an input without newlines or tabs
    if (!text.includes('\n') && !text.includes('\t') && !text.includes(',')) {
      return; // allow single value typing
    }

    e.preventDefault();
    const startRow = activeCell?.rowIdx ?? 0;
    const startCol = activeCell?.colIdx ?? editableColStartIdx;
    handlePasteClipboardMatrix(text, startRow, startCol);
  };

  // 12. Keyboard Navigation across Cells (Enter, Tab, Arrow keys)
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    const maxRow = filteredEntries.length - 1;
    const maxCol = editableColStartIdx + numEditableCols; // including remarks

    if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      const nextR = Math.min(maxRow, rowIdx + 1);
      setActiveCell({ rowIdx: nextR, colIdx });
      focusCell(nextR, colIdx);
    } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      const prevR = Math.max(0, rowIdx - 1);
      setActiveCell({ rowIdx: prevR, colIdx });
      focusCell(prevR, colIdx);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (colIdx < maxCol) {
        e.preventDefault();
        setActiveCell({ rowIdx, colIdx: colIdx + 1 });
        focusCell(rowIdx, colIdx + 1);
      } else if (rowIdx < maxRow) {
        e.preventDefault();
        setActiveCell({ rowIdx: rowIdx + 1, colIdx: editableColStartIdx });
        focusCell(rowIdx + 1, editableColStartIdx);
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (colIdx > editableColStartIdx) {
        e.preventDefault();
        setActiveCell({ rowIdx, colIdx: colIdx - 1 });
        focusCell(rowIdx, colIdx - 1);
      } else if (rowIdx > 0) {
        e.preventDefault();
        setActiveCell({ rowIdx: rowIdx - 1, colIdx: maxCol });
        focusCell(rowIdx - 1, maxCol);
      }
    }
  };

  // 13. Save Marklist to Backend Firestore Database
  const handleSaveAll = async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      setFeedback({ type: 'error', message: 'Missing required class criteria.' });
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
        lastUpdatedBy: 'Faculty / Admin (Spreadsheet 2.0)',
      });

      setHasUnsavedChanges(false);
      setFeedback({
        type: 'success',
        message: `Saved ${entries.length} student marks to database successfully!`,
      });
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Failed to save marklist:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save marklist.' });
    } finally {
      setSaving(false);
    }
  };

  // 14. Batch Tools: Fill Realistic Marks for Quick Testing
  const handleAutoFillRealisticMarks = () => {
    if (entries.length === 0) return;
    setEntries((prev) =>
      prev.map((stu) => {
        if (components.length > 0) {
          const compScores: Record<string, number> = {};
          components.forEach((comp) => {
            const ratio = 0.72 + Math.random() * 0.26;
            compScores[comp.id] = Math.round(comp.maxScore * ratio * 2) / 2;
          });
          const result = computeStudentSubjectResult(compScores, currentSubject || null);
          return {
            ...stu,
            componentScores: compScores,
            score: result.finalPercentage !== null ? result.finalPercentage : stu.score,
            weightedTotal: result.finalPercentage,
          };
        } else {
          const randomScore = Math.floor(65 + Math.random() * 32);
          return {
            ...stu,
            score: randomScore,
            weightedTotal: randomScore,
          };
        }
      })
    );
    setHasUnsavedChanges(true);
    setFeedback({
      type: 'success',
      message: `Auto-populated realistic marks for all ${entries.length} students!`,
    });
  };

  // 15. Clear Column / Clear All
  const handleClearColumn = (targetCompId: string) => {
    setEntries((prev) =>
      prev.map((stu) => {
        if (targetCompId === 'FINAL_SCORE' || components.length === 0) {
          return { ...stu, score: null, weightedTotal: null };
        }
        const nextComps = { ...(stu.componentScores || {}) };
        delete nextComps[targetCompId];
        const res = computeStudentSubjectResult(nextComps, currentSubject || null);
        return {
          ...stu,
          componentScores: nextComps,
          score: res.finalPercentage !== null ? res.finalPercentage : null,
          weightedTotal: res.finalPercentage,
        };
      })
    );
    setOpenColumnMenuId(null);
    setHasUnsavedChanges(true);
    setFeedback({ type: 'info', message: 'Cleared column scores.' });
  };

  const handleBatchFillColumn = (targetCompId: string, percentage: number) => {
    setEntries((prev) =>
      prev.map((stu) => {
        if (targetCompId === 'FINAL_SCORE' || components.length === 0) {
          return { ...stu, score: percentage, weightedTotal: percentage };
        }
        const comp = components.find((c) => c.id === targetCompId);
        const scoreVal = comp ? Math.round((comp.maxScore * percentage) / 100) : percentage;
        const nextComps = {
          ...(stu.componentScores || {}),
          [targetCompId]: scoreVal,
        };
        const res = computeStudentSubjectResult(nextComps, currentSubject || null);
        return {
          ...stu,
          componentScores: nextComps,
          score: res.finalPercentage !== null ? res.finalPercentage : null,
          weightedTotal: res.finalPercentage,
        };
      })
    );
    setOpenColumnMenuId(null);
    setHasUnsavedChanges(true);
    setFeedback({ type: 'success', message: `Applied ${percentage}% to all rows for this column.` });
  };

  // 16. Weight Adjuster Handlers
  const handleSetComponentWeight = (compId: string, newWeight: number) => {
    const nextComps = localComponents.map((c) =>
      c.id === compId ? { ...c, weight: Math.max(0, Math.min(100, newWeight)) } : c
    );
    setLocalComponents(nextComps);
    if (!currentSubject) return;
    const dummySubject: Subject = { ...currentSubject, assessmentComponents: nextComps };
    setEntries((prev) =>
      prev.map((entry) => {
        const result = computeStudentSubjectResult(entry.componentScores || {}, dummySubject);
        return {
          ...entry,
          score: result.finalPercentage !== null ? result.finalPercentage : entry.score,
          weightedTotal: result.finalPercentage,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveWeightsToSubject = async () => {
    if (!currentSubject) return;
    setSavingWeights(true);
    try {
      await api.updateSubject(currentSubject.id, {
        companyId: company.id,
        assessmentComponents: localComponents,
      });
      if (currentSubject) {
        currentSubject.assessmentComponents = localComponents;
      }
      setFeedback({
        type: 'success',
        message: `Saved ${localComponents.length} assessment weights to ${currentSubject.name}!`,
      });
    } catch (err: any) {
      console.error('Failed to save subject components:', err);
      setFeedback({ type: 'error', message: 'Failed to save assessment weights.' });
    } finally {
      setSavingWeights(false);
    }
  };

  // 17. CSV Download & Import
  const handleDownloadCsv = (blankOnly: boolean = false) => {
    if (entries.length === 0) {
      setFeedback({ type: 'error', message: 'No students available to export.' });
      return;
    }

    const headers: string[] = ['Student ID', 'Admission No / FAN', 'Full Name'];
    if (components.length > 0) {
      components.forEach((c) => {
        headers.push(`${c.name} [Weight:${c.weight}% Max:${c.maxScore}]`);
      });
      if (!blankOnly) {
        headers.push('Weighted Total (100%)');
        headers.push('Grade Letter');
      }
    } else {
      headers.push('Score (Max 100)');
      if (!blankOnly) {
        headers.push('Grade Letter');
      }
    }

    const rows = entries.map((e) => {
      const row = [
        `"${e.studentId}"`,
        `"${e.admissionNo || ''}"`,
        `"${e.studentName.replace(/"/g, '""')}"`,
      ];

      if (components.length > 0) {
        components.forEach((c) => {
          const val = blankOnly ? '' : (e.componentScores?.[c.id] ?? '');
          row.push(val !== '' ? String(val) : '');
        });
        if (!blankOnly) {
          const res = computeStudentSubjectResult(e.componentScores || {}, currentSubject || null);
          row.push(res.finalPercentage !== null ? String(res.finalPercentage) : '');
          row.push(res.letterGrade || '');
        }
      } else {
        const val = blankOnly ? '' : (e.score ?? '');
        row.push(val !== '' ? String(val) : '');
        if (!blankOnly) {
          row.push(getLetterGrade(e.score) || '');
        }
      }

      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanGrade = (currentGrade?.name || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSection = (currentSection?.name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSubject = (currentSubject?.name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = blankOnly ? 'Template' : 'Marks';

    link.setAttribute('href', url);
    link.setAttribute('download', `Marklist_${prefix}_${cleanGrade}_${cleanSection}_${cleanSubject}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: blankOnly ? 'Downloaded clean template CSV!' : 'Exported marks CSV successfully!',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handlePasteClipboardMatrix(content, 0, editableColStartIdx);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 18. Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.studentName.toLowerCase().includes(q) ||
        (e.admissionNo && e.admissionNo.toLowerCase().includes(q)) ||
        e.studentId.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Statistics
  const gradedStudentsCount = useMemo(() => {
    return entries.filter((e) => {
      if (components.length > 0) {
        return Object.keys(e.componentScores || {}).length > 0;
      }
      return e.score !== null && e.score !== undefined;
    }).length;
  }, [entries, components]);

  return (
    <div className="space-y-4">
      {/* Hidden file input for CSV upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv, .tsv, .txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. Header & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToStandardView && (
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (!window.confirm('You have unsaved marks. Switch view anyway?')) return;
                }
                onBackToStandardView();
              }}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              title="Return to standard view"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-500" />
                Bulk Marklist Spreadsheet
              </h2>
              <Badge variant="info" size="sm">
                Spreadsheet 2.0 Engine
              </Badge>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {entries.length} students enrolled
              </span>
              {hasUnsavedChanges && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select class criteria (Grade, Section, Subject) to load the roster. Paste entire tables or columns directly from Excel / Google Sheets (<kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border">Ctrl+V</kbd>).
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Copy}
            onClick={() => setShowPasteBox(!showPasteBox)}
            className="text-xs"
          >
            {showPasteBox ? 'Hide Paste Box' : 'Paste from Excel / Sheets'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleDownloadCsv(true)}
            title="Download blank CSV template with enrolled student IDs and names"
            className="text-xs"
          >
            Template CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            title="Import scores from a CSV or Excel export"
            className="text-xs"
          >
            Import File
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={saving}
            onClick={handleSaveAll}
            disabled={entries.length === 0}
            className="shadow-xs text-xs"
          >
            Save All Marks
          </Button>
        </div>
      </div>

      {/* 2. Four Core Criteria Selectors: Academic Year, Grade, Section, Subject */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              1. Academic Year *
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              2. Grade Level *
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section / Stream */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              3. Section / Stream *
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={availableSections.length === 0}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
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

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              4. Curriculum Subject *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjects.length === 0}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {availableSubjects.length === 0 ? (
                <option value="">No subjects found</option>
              ) : (
                availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code || 'SUB'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Filter, Search & Weight Adjuster Toggle Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter student name, ID or FAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60 h-9 pl-9 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
            <span>Graded:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold text-[11px]">
              {gradedStudentsCount} / {entries.length} students
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              totalWeight === 100
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>Weight: {totalWeight}% {totalWeight === 100 ? 'Balanced (100%)' : '(Target 100%)'}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAutoFillRealisticMarks}
            className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 shadow-xs transition-colors"
            title="Auto-fill sample realistic continuous assessment marks (70%-95%)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fill Realistic Marks</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWeightAdjuster(!showWeightAdjuster)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
              showWeightAdjuster
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showWeightAdjuster ? 'Hide Weights' : 'Adjust Weights (%)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all entered marks for this marklist?')) {
                setEntries((prev) =>
                  prev.map((e) => ({
                    ...e,
                    score: null,
                    weightedTotal: null,
                    componentScores: {},
                  }))
                );
                setHasUnsavedChanges(true);
                setFeedback({ type: 'info', message: 'Cleared all marks from the sheet.' });
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Clear all scores"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Weight Adjuster Drawer */}
      {showWeightAdjuster && (
        <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Assessment Component Breakdown & Weights for {currentSubject?.name}</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Adjust the percentage weight of each assessment part. Scores will dynamically sum up to a 100% total.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={savingWeights}
                onClick={handleSaveWeightsToSubject}
                className="text-xs"
              >
                Save Weights to Subject
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            {localComponents.map((comp) => (
              <div
                key={comp.id}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {comp.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[11px]">
                    {comp.weight}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Max: {comp.maxScore} pts</div>
                <div className="flex items-center gap-1 pt-1">
                  {[10, 20, 30, 40, 50].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleSetComponentWeight(comp.id, w)}
                      className={`flex-1 py-0.5 rounded text-[9px] font-bold ${
                        comp.weight === w
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {w}%
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Paste Box Drawer */}
      {showPasteBox && (
        <div className="p-4 bg-sky-500/5 dark:bg-sky-950/20 rounded-2xl border border-sky-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800 dark:text-white">
                Target Column Mode:
              </span>
              <select
                value={selectedPasteTarget}
                onChange={(e) => setSelectedPasteTarget(e.target.value)}
                className="h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="ALL_COMPONENTS">All Component Columns (Grid Paste)</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.weight}%, max {c.maxScore})
                  </option>
                ))}
                <option value="FINAL_SCORE">Full Final Score (100%)</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Copy numbers or columns from Excel or Google Sheets, then click &quot;Apply Marks to Roster&quot;.
            </p>
          </div>

          <textarea
            rows={3}
            placeholder="Paste cells copied from Excel/Sheets (e.g. 18, 19.5, 20 or multiple tab-separated columns)..."
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
              onClick={() => {
                const targetCompIdx =
                  selectedPasteTarget === 'ALL_COMPONENTS'
                    ? editableColStartIdx
                    : selectedPasteTarget === 'FINAL_SCORE'
                    ? editableColStartIdx
                    : editableColStartIdx + components.findIndex((c) => c.id === selectedPasteTarget);
                handlePasteClipboardMatrix(pasteBuffer, 0, Math.max(editableColStartIdx, targetCompIdx));
                setPasteBuffer('');
                setShowPasteBox(false);
              }}
              disabled={!pasteBuffer.trim()}
            >
              Apply Marks to Roster
            </Button>
          </div>
        </div>
      )}

      {/* 7. Spreadsheet 2.0 Grid Table View */}
      <div
        ref={tableContainerRef}
        onPaste={handleContainerPaste}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col"
      >
        {/* Table Top Metadata Strip */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-wrap font-semibold text-slate-700 dark:text-slate-300">
            <span className="font-extrabold uppercase text-[10px] text-sky-600 dark:text-sky-400">Class:</span>
            <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
              {currentGrade?.name || 'Grade'} • {currentSection?.name || 'Section'}
            </span>
            <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
              {currentSubject?.name || 'Subject'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            Showing {filteredEntries.length} of {entries.length} students
          </span>
        </div>

        {/* Scrollable Spreadsheet Table Container */}
        <div className="overflow-x-auto max-h-[620px]">
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Loading student roster and mark records...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Table className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchQuery ? `No students found matching "${searchQuery}"` : 'No students enrolled in this grade & section.'}
              </p>
              <p className="text-xs text-slate-500">
                Ensure students are enrolled in {currentGrade?.name || 'this grade'} and {currentSection?.name || 'this section'}.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-mono select-none">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {/* Row # */}
                  <th className="py-2.5 px-3 w-12 text-center sticky left-0 z-30 bg-slate-200 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                    #
                  </th>

                  {/* Student Details */}
                  <th className="py-2.5 px-3 min-w-[190px] border-r border-slate-200 dark:border-slate-700 font-extrabold whitespace-nowrap bg-slate-100 dark:bg-slate-800">
                    Student Full Name
                  </th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200 dark:border-slate-700 font-extrabold whitespace-nowrap bg-slate-100 dark:bg-slate-800">
                    Admission / FAN
                  </th>

                  {/* Dynamic Assessment Component Columns */}
                  {components.length > 0 ? (
                    components.map((comp, compIdx) => (
                      <th
                        key={comp.id}
                        className="py-2.5 px-3 text-center min-w-[130px] border-r border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/20 relative"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white">{comp.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenColumnMenuId(openColumnMenuId === comp.id ? null : comp.id)
                            }
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-sky-600"
                            title="Column Quick Actions"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">
                          {comp.weight}% • Max {comp.maxScore}
                        </div>

                        {/* Column Quick Popover Menu */}
                        {openColumnMenuId === comp.id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-40 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 text-left normal-case space-y-1">
                            <button
                              type="button"
                              onClick={() => handleBatchFillColumn(comp.id, 100)}
                              className="w-full text-left px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-sky-50"
                            >
                              Fill 100% ({comp.maxScore})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBatchFillColumn(comp.id, 85)}
                              className="w-full text-left px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-sky-50"
                            >
                              Fill 85%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearColumn(comp.id)}
                              className="w-full text-left px-2 py-1 rounded text-xs text-rose-600 hover:bg-rose-50"
                            >
                              Clear Column
                            </button>
                          </div>
                        )}
                      </th>
                    ))
                  ) : (
                    <th className="py-2.5 px-3 text-center min-w-[130px] border-r border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/20">
                      Score (Max: 100)
                    </th>
                  )}

                  {/* Weighted Total */}
                  <th className="py-2.5 px-3 text-center min-w-[120px] bg-emerald-50 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-700">
                    <div>Weighted Total</div>
                    <div className="text-[10px] text-emerald-600 font-normal">100% Score</div>
                  </th>

                  {/* Letter Grade */}
                  <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200 dark:border-slate-700">
                    Grade
                  </th>

                  {/* Remarks */}
                  <th className="py-2.5 px-3 min-w-[160px]">Teacher Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                {filteredEntries.map((stu, index) => {
                  const studentBreakdown = computeStudentSubjectResult(
                    stu.componentScores || {},
                    currentSubject || null
                  );
                  const displayTotal =
                    components.length > 0 ? studentBreakdown.finalPercentage : stu.score;
                  const letterGrade = studentBreakdown.letterGrade || getLetterGrade(displayTotal);

                  return (
                    <tr
                      key={stu.studentId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Row # */}
                      <td className="py-1 px-2 text-center text-slate-400 font-mono text-[10px] sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 font-bold">
                        {index + 1}
                      </td>

                      {/* Student Full Name */}
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {stu.studentName}
                        </div>
                      </td>

                      {/* Admission / FAN */}
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-200 dark:border-slate-800">
                        {stu.admissionNo || stu.studentId}
                      </td>

                      {/* Assessment Component Input Cells */}
                      {components.length > 0 ? (
                        components.map((comp, compIdx) => {
                          const currentVal = stu.componentScores?.[comp.id];
                          const isOver =
                            currentVal !== null && currentVal !== undefined && currentVal > comp.maxScore;
                          const cellColIdx = editableColStartIdx + compIdx;
                          const isFocused =
                            activeCell?.rowIdx === index && activeCell?.colIdx === cellColIdx;

                          return (
                            <td
                              key={comp.id}
                              onClick={() => setActiveCell({ rowIdx: index, colIdx: cellColIdx })}
                              className={`p-0 border-r border-slate-200 dark:border-slate-800 relative transition-all ${
                                isFocused ? 'ring-2 ring-sky-500 z-10' : ''
                              }`}
                            >
                              <input
                                id={`mark-cell-${index}-${cellColIdx}`}
                                type="number"
                                min="0"
                                max={comp.maxScore}
                                step="0.5"
                                placeholder="—"
                                value={currentVal !== null && currentVal !== undefined ? currentVal : ''}
                                onChange={(e) =>
                                  updateComponentScore(stu.studentId, comp.id, e.target.value)
                                }
                                onFocus={() => setActiveCell({ rowIdx: index, colIdx: cellColIdx })}
                                onKeyDown={(e) => handleCellKeyDown(e, index, cellColIdx)}
                                className={`w-full h-9 px-2 text-center text-xs font-mono font-bold border-0 focus:outline-none focus:bg-sky-500/10 ${
                                  isOver
                                    ? 'bg-rose-50 text-rose-600 font-black'
                                    : currentVal !== null && currentVal !== undefined
                                    ? 'text-slate-900 dark:text-white font-extrabold'
                                    : 'text-slate-400'
                                }`}
                              />
                            </td>
                          );
                        })
                      ) : (
                        <td
                          onClick={() =>
                            setActiveCell({ rowIdx: index, colIdx: editableColStartIdx })
                          }
                          className={`p-0 border-r border-slate-200 dark:border-slate-800 relative transition-all ${
                            activeCell?.rowIdx === index && activeCell?.colIdx === editableColStartIdx
                              ? 'ring-2 ring-sky-500 z-10'
                              : ''
                          }`}
                        >
                          <input
                            id={`mark-cell-${index}-${editableColStartIdx}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="—"
                            value={stu.score !== null && stu.score !== undefined ? stu.score : ''}
                            onChange={(e) => updateSingleScore(stu.studentId, e.target.value)}
                            onFocus={() =>
                              setActiveCell({ rowIdx: index, colIdx: editableColStartIdx })
                            }
                            onKeyDown={(e) => handleCellKeyDown(e, index, editableColStartIdx)}
                            className="w-full h-9 px-2 text-center text-xs font-mono font-bold border-0 focus:outline-none focus:bg-sky-500/10 text-slate-900 dark:text-white"
                          />
                        </td>
                      )}

                      {/* Weighted Total Display */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/10">
                        {displayTotal !== null && displayTotal !== undefined ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                            {displayTotal}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Letter Grade */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                        {displayTotal !== null && displayTotal !== undefined ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              displayTotal >= 70
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : displayTotal >= 50
                                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                : displayTotal >= 40
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {letterGrade}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Teacher Remarks Input */}
                      <td
                        onClick={() =>
                          setActiveCell({
                            rowIdx: index,
                            colIdx: editableColStartIdx + numEditableCols,
                          })
                        }
                        className={`p-0 relative transition-all ${
                          activeCell?.rowIdx === index &&
                          activeCell?.colIdx === editableColStartIdx + numEditableCols
                            ? 'ring-2 ring-sky-500 z-10'
                            : ''
                        }`}
                      >
                        <input
                          id={`mark-cell-${index}-${editableColStartIdx + numEditableCols}`}
                          type="text"
                          placeholder="Add teacher remarks..."
                          value={stu.notes || ''}
                          onChange={(e) => updateRemarks(stu.studentId, e.target.value)}
                          onFocus={() =>
                            setActiveCell({
                              rowIdx: index,
                              colIdx: editableColStartIdx + numEditableCols,
                            })
                          }
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, index, editableColStartIdx + numEditableCols)
                          }
                          className="w-full h-9 px-2.5 text-xs text-slate-800 dark:text-slate-200 border-0 focus:outline-none focus:bg-sky-500/10"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Toolbar & Save Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <span>Tip: Select any score cell and press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border">Ctrl+V</kbd> to paste multi-row / multi-column grades from Excel.</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={fetchMarklist}
              disabled={loading || saving}
            >
              Reset / Reload
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              isLoading={saving}
              onClick={handleSaveAll}
              disabled={entries.length === 0}
              className="shadow-xs"
            >
              Save All Marks to Database
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
