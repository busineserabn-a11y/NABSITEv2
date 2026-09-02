import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileCheck2,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  Printer,
  Sparkles,
  Search,
  RotateCcw,
  BarChart2,
  Info,
  ChevronDown,
  Calculator,
  Lock,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import {
  AcademicYear,
  Grade,
  Section,
  Subject,
  Student,
  Marklist,
  MarklistEntry,
  Company,
  AssessmentComponent,
} from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BulkSpreadsheetMarkInputModal } from './BulkSpreadsheetMarkInputModal';
import { MarklistSpreadsheet } from './MarklistSpreadsheet';
import { computeStudentSubjectResult } from '../../lib/academicUtils';

interface SchoolMarklistViewProps {
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
}

export const SchoolMarklistView: React.FC<SchoolMarklistViewProps> = ({
  company,
  academicYears,
  grades,
  sections,
  subjects,
  initialSelection,
}) => {
  // 1. Selector State
  const defaultYearId =
    initialSelection?.academicYearId ||
    academicYears.find((y) => y.isActive)?.id ||
    academicYears[0]?.id ||
    '';

  const [selectedYearId, setSelectedYearId] = useState<string>(defaultYearId);
  const [selectedGradeId, setSelectedGradeId] = useState<string>(initialSelection?.gradeId || grades[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSelection?.sectionId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSelection?.subjectId || '');

  // 2. Marklist Data State
  const [marklist, setMarklist] = useState<Marklist | null>(null);
  const [entries, setEntries] = useState<MarklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'spreadsheet2'>('standard');

  // Filter sections by selected grade
  const availableSections = useMemo(() => {
    if (!selectedGradeId) return [];
    return sections.filter((s) => s.gradeId === selectedGradeId);
  }, [sections, selectedGradeId]);

  // Filter subjects by selected grade
  const availableSubjects = useMemo(() => {
    if (!selectedGradeId) return subjects;
    return subjects.filter((s) => s.isCommon || (s.gradeIds && s.gradeIds.includes(selectedGradeId)));
  }, [subjects, selectedGradeId]);

  // Sync default section when grade changes
  useEffect(() => {
    if (availableSections.length > 0) {
      if (!selectedSectionId || !availableSections.some((s) => s.id === selectedSectionId)) {
        setSelectedSectionId(availableSections[0].id);
      }
    } else {
      setSelectedSectionId('');
    }
  }, [availableSections, selectedSectionId]);

  // Sync default subject when grade changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubjectId || !availableSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [availableSubjects, selectedSubjectId]);

  // Fetch or initialize Marklist whenever the 4 keys are selected
  const fetchMarklist = useCallback(async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      setMarklist(null);
      setEntries([]);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getMarklist(
        company.id,
        selectedYearId,
        selectedGradeId,
        selectedSectionId,
        selectedSubjectId
      );
      setMarklist(data);
      setEntries(data.entries || []);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load marklist:', err);
      setErrorMessage('Could not load marklist for the selected criteria. Please verify connection.');
    } finally {
      setLoading(false);
    }
  }, [company.id, selectedYearId, selectedGradeId, selectedSectionId, selectedSubjectId]);

  useEffect(() => {
    fetchMarklist();
  }, [fetchMarklist]);

  // Active Subject & Max Score & Assessment Components
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentGrade = grades.find((g) => g.id === selectedGradeId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);
  const currentYear = academicYears.find((y) => y.id === selectedYearId);
  const components: AssessmentComponent[] = currentSubject?.assessmentComponents || [];
  const maxScore = currentSubject?.maxScore || marklist?.maxScore || 100;

  // Handle Score Change for Simple Score
  const handleScoreChange = (studentId: string, value: string) => {
    const numeric = value === '' ? null : parseFloat(value);
    if (numeric !== null && (isNaN(numeric) || numeric < 0 || numeric > maxScore)) {
      return;
    }

    setEntries((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? { ...item, score: numeric, weightedTotal: numeric }
          : item
      )
    );
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Handle Component Score Change
  const handleComponentScoreChange = (studentId: string, compId: string, value: string) => {
    const numeric = value === '' ? null : parseFloat(value);
    const comp = components.find((c) => c.id === compId);
    const compMax = comp?.maxScore || 100;

    if (numeric !== null && (isNaN(numeric) || numeric < 0 || numeric > compMax)) {
      return;
    }

    setEntries((prev) =>
      prev.map((item) => {
        if (item.studentId !== studentId) return item;
        const nextCompScores = {
          ...(item.componentScores || {}),
          [compId]: numeric,
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
    setSaveSuccess(false);
  };

  // Handle Notes/Remarks Change
  const handleNotesChange = (studentId: string, notes: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, notes } : item))
    );
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  // Save Marklist to Database
  const handleSaveMarklist = async () => {
    if (!company.id || !selectedYearId || !selectedGradeId || !selectedSectionId || !selectedSubjectId) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const saved = await api.saveMarklist({
        companyId: company.id,
        academicYearId: selectedYearId,
        gradeId: selectedGradeId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        maxScore,
        status: 'submitted',
        entries,
        lastUpdatedBy: 'School Faculty / Admin',
      });

      setMarklist(saved);
      setEntries(saved.entries);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save marklist:', err);
      setErrorMessage(err.message || 'Failed to save marklist to database. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // Quick helper: Compute grade letter from score & max
  const getLetterGrade = (score: number | null, max: number) => {
    if (score === null || score === undefined) return { label: '—', color: 'text-slate-400' };
    const pct = (score / max) * 100;
    if (pct >= 90) return { label: 'A+ (Excellent)', color: 'text-emerald-600 dark:text-emerald-400 font-bold' };
    if (pct >= 80) return { label: 'A (Very Good)', color: 'text-emerald-500 font-bold' };
    if (pct >= 70) return { label: 'B (Good)', color: 'text-sky-600 dark:text-sky-400 font-semibold' };
    if (pct >= 60) return { label: 'C (Satisfactory)', color: 'text-amber-600 dark:text-amber-400 font-semibold' };
    if (pct >= 50) return { label: 'D (Pass)', color: 'text-orange-600 dark:text-orange-400 font-medium' };
    return { label: 'F (Needs Improvement)', color: 'text-rose-600 dark:text-rose-400 font-bold' };
  };

  // Computed Class Statistics
  const stats = useMemo(() => {
    const scoredList = entries
      .map((e) => (e.weightedTotal !== null && e.weightedTotal !== undefined ? e.weightedTotal : e.score))
      .filter((s) => s !== null && s !== undefined) as number[];

    if (scoredList.length === 0) {
      return {
        count: entries.length,
        evaluated: 0,
        average: 0,
        averagePct: 0,
        highest: 0,
        lowest: 0,
        passCount: 0,
        passRate: 0,
      };
    }

    const sum = scoredList.reduce((acc, val) => acc + val, 0);
    const avg = sum / scoredList.length;
    const high = Math.max(...scoredList);
    const low = Math.min(...scoredList);
    const pass = scoredList.filter((s) => s >= 50).length;

    return {
      count: entries.length,
      evaluated: scoredList.length,
      average: parseFloat(avg.toFixed(1)),
      averagePct: parseFloat(avg.toFixed(1)),
      highest: high,
      lowest: low,
      passCount: pass,
      passRate: parseFloat(((pass / scoredList.length) * 100).toFixed(1)),
    };
  }, [entries]);

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!searchFilter.trim()) return entries;
    const term = searchFilter.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.studentName.toLowerCase().includes(term) ||
        e.admissionNo.toLowerCase().includes(term) ||
        e.studentId.toLowerCase().includes(term)
    );
  }, [entries, searchFilter]);

  // Export CSV
  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const baseHeaders = ['Student ID', 'Admission No', 'Full Name', 'Grade', 'Section', 'Subject', 'Academic Year'];
    if (components.length > 0) {
      components.forEach((c) => baseHeaders.push(`${c.name} (${c.weight}%, max ${c.maxScore})`));
    }
    baseHeaders.push('Final Score (%)', 'Letter Grade', 'Remarks');

    const rows = entries.map((e) => {
      const calc = computeStudentSubjectResult(e.componentScores || {}, currentSubject || null);
      const finalVal = components.length > 0 ? calc.finalPercentage : e.score;
      const row = [
        `"${e.studentId}"`,
        `"${e.admissionNo}"`,
        `"${e.studentName}"`,
        `"${currentGrade?.name || ''}"`,
        `"${currentSection?.name || ''}"`,
        `"${currentSubject?.name || ''}"`,
        `"${currentYear?.name || ''}"`,
      ];

      if (components.length > 0) {
        components.forEach((c) => row.push(e.componentScores?.[c.id] !== undefined ? `${e.componentScores[c.id]}` : ''));
      }

      row.push(
        finalVal !== null ? `${finalVal}%` : '',
        `"${calc.gradeLetter}"`,
        `"${e.notes || ''}"`
      );

      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [baseHeaders.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Marklist_${currentGrade?.name || 'Grade'}_${currentSection?.name || 'Sec'}_${currentSubject?.name || 'Subject'}_${currentYear?.name || 'Year'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Marklist
  const handlePrint = () => {
    window.print();
  };

  if (viewMode === 'spreadsheet2') {
    return (
      <MarklistSpreadsheet
        company={company}
        academicYears={academicYears}
        grades={grades}
        sections={sections}
        subjects={subjects}
        initialSelection={{
          academicYearId: selectedYearId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
        }}
        onBackToStandardView={() => {
          setViewMode('standard');
          fetchMarklist();
        }}
        onSaved={() => {
          fetchMarklist();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Control Bar: Selectors for Academic Year, Grade, Section, Subject */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Marklist Evaluation Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select class criteria to load enrolled students and enter curriculum scores or weighted assessment parts.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="md"
              icon={FileSpreadsheet}
              onClick={() => setViewMode('spreadsheet2')}
              className="text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-100 font-bold"
            >
              Spreadsheet 2.0 Mode
            </Button>

            <Button
              variant="outline"
              size="md"
              icon={FileSpreadsheet}
              onClick={() => setBulkModalOpen(true)}
              className="text-xs text-slate-600 dark:text-slate-300"
            >
              Quick Modal
            </Button>

            {hasUnsavedChanges && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                Unsaved Marks
              </span>
            )}
            {saveSuccess && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved to Database
              </span>
            )}
            <Button
              variant="primary"
              size="md"
              icon={Save}
              isLoading={saving}
              onClick={handleSaveMarklist}
              disabled={entries.length === 0}
              className="shadow-xs"
            >
              Save Marklist
            </Button>
          </div>
        </div>

        {/* The 4 Core Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
              1. Academic Year *
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Grade */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
              2. Grade Level *
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Section */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
              3. Section / Stream *
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={availableSections.length === 0}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {availableSections.length === 0 ? (
                <option value="">No sections in this grade</option>
              ) : (
                availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} {sec.room ? `(Room: ${sec.room})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 4. Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
              4. Subject Course *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={availableSubjects.length === 0}
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {availableSubjects.length === 0 ? (
                <option value="">No subjects assigned</option>
              ) : (
                availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code || 'CODE'}) {sub.assessmentComponents?.length ? `• ${sub.assessmentComponents.length} Parts` : '• 100%'}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Metadata Context Strip */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Active Mark Sheet:
          </span>
          <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold text-slate-900 dark:text-white">
            {currentGrade?.name || 'Grade'} • {currentSection?.name || 'Section'}
          </span>
          <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold text-slate-900 dark:text-white">
            {currentSubject?.name || 'Subject'}{' '}
            {components.length > 0 ? `(${components.length} Weighted Parts)` : `(Max: ${maxScore} pts)`}
          </span>
          <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-500/30 text-slate-600 dark:text-slate-300">
            Year: {currentYear?.name || 'Year'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="text-xs bg-white dark:bg-slate-800"
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            disabled={entries.length === 0}
            className="text-xs bg-white dark:bg-slate-800"
          >
            Print Sheet
          </Button>
        </div>
      </div>

      {/* 3. Class Performance Analytics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Roster Evaluated</span>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
            {stats.evaluated} <span className="text-xs font-normal text-slate-400">/ {stats.count} students</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Class Average</span>
          <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats.evaluated > 0 ? `${stats.average}%` : '—'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Highest Score</span>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.evaluated > 0 ? `${stats.highest}%` : '—'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Lowest Score</span>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {stats.evaluated > 0 ? `${stats.lowest}%` : '—'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Passing Rate (≥50%)</span>
          <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400 mt-1">
            {stats.evaluated > 0 ? `${stats.passRate}%` : '—'}
            {stats.evaluated > 0 && <span className="text-xs font-normal text-slate-400 ml-1">({stats.passCount} passed)</span>}
          </p>
        </div>
      </div>

      {/* 4. Filter & Search In Roster */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, ID or admission no..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full h-10 pl-9 pr-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredEntries.length} of {entries.length} students
        </span>
      </div>

      {/* 5. The Marklist Table with Assessment Columns */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading class marklist & student records...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Enrolled Students Found in this Section
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No students are currently assigned to {currentGrade?.name || 'this grade'} • {currentSection?.name || 'this section'}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Student Details</th>
                  <th className="py-3.5 px-4">FAN / Unique ID</th>

                  {/* Component Breakdown Columns */}
                  {components.length > 0 ? (
                    components.map((comp) => (
                      <th
                        key={comp.id}
                        className="py-3.5 px-3 text-center min-w-[110px] bg-slate-100/60 dark:bg-slate-800/90 border-l border-slate-200 dark:border-slate-700"
                      >
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{comp.name}</div>
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">
                          {comp.weight}% • Max {comp.maxScore}
                        </div>
                      </th>
                    ))
                  ) : (
                    <th className="py-3.5 px-4 w-40 text-center">
                      Score (Max: {maxScore})
                    </th>
                  )}

                  <th className="py-3.5 px-4 text-center w-32 bg-emerald-50/50 dark:bg-emerald-950/20 border-l border-slate-200 dark:border-slate-700">
                    <div>Weighted Total</div>
                    <div className="text-[10px] text-emerald-600 font-normal">100% Score</div>
                  </th>
                  <th className="py-3.5 px-4 w-32">Grade / Status</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredEntries.map((item, index) => {
                  const studentBreakdown = computeStudentSubjectResult(
                    item.componentScores || {},
                    currentSubject || null
                  );
                  const effectiveScore =
                    components.length > 0
                      ? studentBreakdown.finalPercentage
                      : item.score;
                  const letterGrade = getLetterGrade(effectiveScore, 100);

                  return (
                    <tr
                      key={item.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Rank / Number */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* 2. Student Name & Admission */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Adm: {item.admissionNo}
                        </div>
                      </td>

                      {/* 3. Unique Student ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                        <span title={item.studentId} className="hover:text-slate-800 dark:text-slate-400">
                          {item.admissionNo}
                        </span>
                      </td>

                      {/* 4. Assessment Components inputs or single score input */}
                      {components.length > 0 ? (
                        components.map((comp) => {
                          const val = item.componentScores?.[comp.id];
                          const isExceeded = val !== null && val !== undefined && val > comp.maxScore;

                          return (
                            <td
                              key={comp.id}
                              className="py-3 px-2 text-center border-l border-slate-100 dark:border-slate-800"
                            >
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxScore}
                                  step="0.5"
                                  placeholder="—"
                                  value={val !== null && val !== undefined ? val : ''}
                                  onChange={(e) =>
                                    handleComponentScoreChange(item.studentId, comp.id, e.target.value)
                                  }
                                  className={`w-16 h-8 text-center bg-white dark:bg-slate-800 border-2 rounded-lg text-xs font-extrabold focus:outline-none ${
                                    isExceeded
                                      ? 'border-rose-500 text-rose-600'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
                                  }`}
                                />
                                <span className="text-[10px] text-slate-400 font-bold">/{comp.maxScore}</span>
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={maxScore}
                              step="0.5"
                              placeholder="—"
                              value={item.score !== null && item.score !== undefined ? item.score : ''}
                              onChange={(e) => handleScoreChange(item.studentId, e.target.value)}
                              className="w-20 h-9 text-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                            <span className="text-slate-400 font-bold text-xs">/ {maxScore}</span>
                          </div>
                        </td>
                      )}

                      {/* 5. Weighted Total */}
                      <td className="py-3.5 px-4 text-center border-l border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {effectiveScore !== null && effectiveScore !== undefined ? (
                          <div>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                              {effectiveScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </td>

                      {/* 6. Grade / Evaluation */}
                      <td className="py-3.5 px-4">
                        {effectiveScore !== null && effectiveScore !== undefined ? (
                          <div>
                            <span className={letterGrade.color}>{studentBreakdown.gradeLetter || letterGrade.label}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      {/* 7. Remarks */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={item.notes || ''}
                          onChange={(e) => handleNotesChange(item.studentId, e.target.value)}
                          className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        {entries.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Target Sheet ID:{' '}
              <code className="font-mono text-slate-700 dark:text-slate-300">
                marklist_{selectedYearId}_{selectedGradeId}_{selectedSectionId}_{selectedSubjectId}
              </code>
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
                size="sm"
                icon={Save}
                isLoading={saving}
                onClick={handleSaveMarklist}
                className="shadow-xs"
              >
                Save All Marks
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bulk Spreadsheet Input Modal */}
      <BulkSpreadsheetMarkInputModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        company={company}
        academicYears={academicYears}
        grades={grades}
        sections={sections}
        subjects={subjects}
        initialSelection={{
          academicYearId: selectedYearId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
        }}
        onSuccessSave={() => {
          fetchMarklist();
        }}
      />
    </div>
  );
};
