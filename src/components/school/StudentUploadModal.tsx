import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Trash2,
  Users,
  Layers,
  GraduationCap,
  Calendar,
  Check,
  RotateCcw,
  Info,
} from 'lucide-react';
import { AcademicYear, Grade, Section, Student, Company } from '../../types';
import { api } from '../../lib/api';
import { parseSpreadsheetPastedText } from '../../lib/academicUtils';

interface StudentUploadItem {
  id: string;
  fullName: string;
  admissionNo: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  gradeId: string;
  sectionId: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  isValid: boolean;
  validationError?: string;
}

interface StudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  academicYears: AcademicYear[];
  grades: Grade[];
  sections: Section[];
  onUploadSuccess: () => void;
}

export const StudentUploadModal: React.FC<StudentUploadModalProps> = ({
  isOpen,
  onClose,
  company,
  academicYears,
  grades,
  sections,
  onUploadSuccess,
}) => {
  if (!isOpen) return null;

  // Class assignment defaults
  const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(activeYear?.id || '');
  const [defaultGradeId, setDefaultGradeId] = useState<string>(grades[0]?.id || '');
  
  // Available sections for the default grade
  const availableDefaultSections = useMemo(() => {
    return sections.filter((s) => s.gradeId === defaultGradeId);
  }, [sections, defaultGradeId]);

  const [defaultSectionId, setDefaultSectionId] = useState<string>(
    availableDefaultSections[0]?.id || ''
  );

  // Update default section when grade changes
  const handleDefaultGradeChange = (gradeId: string) => {
    setDefaultGradeId(gradeId);
    const matching = sections.filter((s) => s.gradeId === gradeId);
    setDefaultSectionId(matching[0]?.id || '');
  };

  // Upload/Paste state
  const [parsedStudents, setParsedStudents] = useState<StudentUploadItem[]>([]);
  const [rawTextBuffer, setRawTextBuffer] = useState<string>('');
  const [showPasteArea, setShowPasteArea] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookup maps for fast Grade and Section name matching
  const gradeMap = useMemo(() => {
    const map = new Map<string, string>(); // lowercase name -> id
    grades.forEach((g) => {
      map.set(g.name.toLowerCase().trim(), g.id);
      map.set(`grade ${g.level}`.toLowerCase().trim(), g.id);
      map.set(String(g.level), g.id);
    });
    return map;
  }, [grades]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, { id: string; gradeId: string }>();
    sections.forEach((s) => {
      map.set(s.name.toLowerCase().trim(), { id: s.id, gradeId: s.gradeId });
      map.set(`section ${s.name}`.toLowerCase().trim(), { id: s.id, gradeId: s.gradeId });
    });
    return map;
  }, [sections]);

  // Helper to resolve Grade ID from input text
  const resolveGradeId = (input?: string): string => {
    if (!input || !input.trim()) return defaultGradeId;
    const clean = input.toLowerCase().trim();
    if (gradeMap.has(clean)) return gradeMap.get(clean)!;
    // Check if ID matches directly
    const directMatch = grades.find((g) => g.id === input.trim());
    if (directMatch) return directMatch.id;
    return defaultGradeId;
  };

  // Helper to resolve Section ID from input text & target grade
  const resolveSectionId = (inputGradeId: string, inputSection?: string): string => {
    const matchingSections = sections.filter((s) => s.gradeId === inputGradeId);
    if (!inputSection || !inputSection.trim()) {
      return matchingSections[0]?.id || defaultSectionId;
    }
    const clean = inputSection.toLowerCase().trim();
    const found = matchingSections.find(
      (s) =>
        s.name.toLowerCase().trim() === clean ||
        s.name.toLowerCase().trim() === `section ${clean}` ||
        `section ${s.name.toLowerCase().trim()}` === clean
    );
    if (found) return found.id;
    return matchingSections[0]?.id || defaultSectionId;
  };

  // Process rows of parsed text into StudentUploadItem[]
  const parseRowsToStudents = (rows: string[][]) => {
    if (rows.length === 0) return;

    // Detect if first row is a header
    let startIdx = 0;
    const firstRowCombined = rows[0].join(' ').toLowerCase();
    if (
      firstRowCombined.includes('name') ||
      firstRowCombined.includes('student') ||
      firstRowCombined.includes('admission') ||
      firstRowCombined.includes('fan') ||
      firstRowCombined.includes('grade') ||
      firstRowCombined.includes('gender')
    ) {
      startIdx = 1;
    }

    const newItems: StudentUploadItem[] = [];

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every((c) => !c || c.trim() === '')) continue;

      let fullName = '';
      let admissionNo = '';
      let gender: 'male' | 'female' | 'other' = 'male';
      let gradeNameOrId = '';
      let sectionNameOrId = '';
      let guardianName = '';
      let guardianPhone = '';
      let guardianEmail = '';

      // Standard Column mapping heuristics
      // Format 1: Full Name, FAN/AdmissionNo, Gender, Grade, Section, Guardian Name, Phone
      // Format 2: AdmissionNo, Full Name, Gender, Guardian Phone
      // Or just a single list of names: 1 name per line!

      if (row.length === 1) {
        // Just names!
        fullName = row[0].trim();
      } else if (row.length === 2) {
        // Check which one is admissionNo
        if (row[0].includes('-') || row[0].includes('/') || /^\d+$/.test(row[0].trim())) {
          admissionNo = row[0].trim();
          fullName = row[1].trim();
        } else {
          fullName = row[0].trim();
          admissionNo = row[1].trim();
        }
      } else {
        // Multi-column
        // Check if row[0] is numeric index or admission no
        let nameColIdx = 0;
        let admColIdx = 1;

        if (/^\d+$/.test(row[0].trim()) && row[0].trim().length <= 3) {
          // It's a row number # (1, 2, 3...)
          nameColIdx = 1;
          admColIdx = 2;
        }

        fullName = (row[nameColIdx] || '').trim();
        admissionNo = (row[admColIdx] || '').trim();

        // Check if admissionNo looks like a name instead
        if (admissionNo && !fullName) {
          fullName = admissionNo;
          admissionNo = '';
        }

        // Search other columns
        for (let col = admColIdx + 1; col < row.length; col++) {
          const val = (row[col] || '').trim();
          if (!val) continue;

          const valLower = val.toLowerCase();
          if (valLower === 'male' || valLower === 'm') {
            gender = 'male';
          } else if (valLower === 'female' || valLower === 'f') {
            gender = 'female';
          } else if (valLower.includes('grade') || /^(9|10|11|12)$/.test(valLower)) {
            gradeNameOrId = val;
          } else if (
            valLower.startsWith('section') ||
            (val.length <= 2 && /^[a-zA-Z]$/.test(val))
          ) {
            sectionNameOrId = val;
          } else if (val.includes('@')) {
            guardianEmail = val;
          } else if (/\+?\d{8,15}/.test(val.replace(/\s+/g, ''))) {
            guardianPhone = val;
          } else if (!guardianName && val.length > 2 && !val.includes('Grade')) {
            guardianName = val;
          }
        }
      }

      if (!fullName) continue;

      const targetGradeId = resolveGradeId(gradeNameOrId);
      const targetSectionId = resolveSectionId(targetGradeId, sectionNameOrId);

      const generatedAdmission =
        admissionNo ||
        `FAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const isValid = Boolean(fullName.trim() && targetGradeId && targetSectionId);

      newItems.push({
        id: `temp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        fullName,
        admissionNo: generatedAdmission,
        gender,
        gradeId: targetGradeId,
        sectionId: targetSectionId,
        guardianName,
        guardianPhone,
        guardianEmail,
        isValid,
        validationError: !targetGradeId
          ? 'Grade not assigned'
          : !targetSectionId
          ? 'Section not assigned'
          : undefined,
      });
    }

    setParsedStudents((prev) => [...prev, ...newItems]);
    setFeedback({
      type: 'success',
      message: `Parsed ${newItems.length} student records! Review or edit below before uploading to database.`,
    });
    setShowPasteArea(false);
  };

  // Direct paste handler from clipboard text
  const handleParsePastedText = () => {
    if (!rawTextBuffer.trim()) {
      setFeedback({ type: 'error', message: 'Please paste student rows into the text area first.' });
      return;
    }
    const matrix = parseSpreadsheetPastedText(rawTextBuffer);
    parseRowsToStudents(matrix);
    setRawTextBuffer('');
  };

  // Handle CSV / Excel file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setFeedback({ type: 'error', message: 'The uploaded file is empty.' });
        return;
      }
      const matrix = parseSpreadsheetPastedText(text);
      parseRowsToStudents(matrix);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Failed to read file.' });
    };
    reader.readAsText(file);

    if (e.target) e.target.value = '';
  };

  // Sample student generator for quick testing
  const handleLoadSampleStudents = () => {
    const sampleNames = [
      { name: 'Almaz Bekele', gender: 'female' as const, phone: '+251 91 123 4567' },
      { name: 'Dawit Yohannes', gender: 'male' as const, phone: '+251 92 234 5678' },
      { name: 'Selamawit Tadesse', gender: 'female' as const, phone: '+251 93 345 6789' },
      { name: 'Kassahun Desta', gender: 'male' as const, phone: '+251 94 456 7890' },
      { name: 'Hana Hailemariam', gender: 'female' as const, phone: '+251 95 567 8901' },
      { name: 'Yonas Gebre', gender: 'male' as const, phone: '+251 96 678 9012' },
      { name: 'Marta Alemayehu', gender: 'female' as const, phone: '+251 97 789 0123' },
      { name: 'Natnael Girma', gender: 'male' as const, phone: '+251 98 890 1234' },
    ];

    const currentYear = new Date().getFullYear();
    const items: StudentUploadItem[] = sampleNames.map((s, idx) => ({
      id: `sample_${Date.now()}_${idx}`,
      fullName: s.name,
      admissionNo: `FAN-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: s.gender,
      gradeId: defaultGradeId,
      sectionId: defaultSectionId,
      guardianName: `${s.name.split(' ')[1]} Family`,
      guardianPhone: s.phone,
      isValid: true,
    }));

    setParsedStudents((prev) => [...prev, ...items]);
    setShowPasteArea(false);
    setFeedback({
      type: 'success',
      message: `Loaded ${items.length} sample student profiles! Click "Upload All to Database" to enroll them.`,
    });
  };

  // Download Empty Student CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Full Name',
      'Admission No / FAN',
      'Gender (male/female)',
      'Grade Level',
      'Section Name',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
    ];

    const targetGrade = grades.find((g) => g.id === defaultGradeId);
    const targetSection = sections.find((s) => s.id === defaultSectionId);

    const sampleRow1 = [
      'Dawit Haile',
      `FAN-${new Date().getFullYear()}-1042`,
      'male',
      targetGrade?.name || 'Grade 9',
      targetSection?.name || 'Section A',
      'Haile Yohannes',
      '+251 91 234 5678',
      'haile@example.com',
    ];

    const sampleRow2 = [
      'Bethlehem Abebe',
      `FAN-${new Date().getFullYear()}-1043`,
      'female',
      targetGrade?.name || 'Grade 9',
      targetSection?.name || 'Section A',
      'Abebe Kebede',
      '+251 92 345 6789',
      'abebe@example.com',
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        sampleRow1.map((c) => `"${c}"`).join(','),
        sampleRow2.map((c) => `"${c}"`).join(','),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Roster_Upload_Template_${company.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: 'Downloaded CSV template with formatted header columns ready for student rosters.',
    });
  };

  // Edit parsed student item
  const handleUpdateItem = (id: string, updates: Partial<StudentUploadItem>) => {
    setParsedStudents((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.isValid = Boolean(updated.fullName.trim() && updated.gradeId && updated.sectionId);
        return updated;
      })
    );
  };

  // Remove parsed student item
  const handleRemoveItem = (id: string) => {
    setParsedStudents((prev) => prev.filter((item) => item.id !== id));
  };

  // Batch assign Grade or Section to all staged students
  const handleApplyGradeToAll = (gradeId: string) => {
    const matchingSections = sections.filter((s) => s.gradeId === gradeId);
    const secId = matchingSections[0]?.id || '';
    setParsedStudents((prev) =>
      prev.map((item) => ({
        ...item,
        gradeId,
        sectionId: secId,
        isValid: Boolean(item.fullName.trim() && gradeId && secId),
      }))
    );
  };

  const handleApplySectionToAll = (sectionId: string) => {
    setParsedStudents((prev) =>
      prev.map((item) => ({
        ...item,
        sectionId,
        isValid: Boolean(item.fullName.trim() && item.gradeId && sectionId),
      }))
    );
  };

  // Final Commit to Database
  const handleCommitUpload = async () => {
    if (parsedStudents.length === 0) return;

    const invalidItems = parsedStudents.filter((s) => !s.isValid);
    if (invalidItems.length > 0) {
      setFeedback({
        type: 'error',
        message: `${invalidItems.length} student records have missing names or class assignments. Please correct them before uploading.`,
      });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const payload = parsedStudents.map((s) => ({
        fullName: s.fullName.trim(),
        admissionNo: s.admissionNo.trim(),
        gradeId: s.gradeId,
        sectionId: s.sectionId,
        academicYearId: selectedYearId,
        gender: s.gender,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianEmail: s.guardianEmail,
      }));

      const res = await api.bulkCreateStudents(company.id, payload);

      setFeedback({
        type: 'success',
        message: `Successfully registered ${res.addedCount} students into the school roster!`,
      });

      setParsedStudents([]);
      onUploadSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Bulk student registration error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload students to database. Please check connection.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Student Bulk Upload System
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload CSV/Excel rosters or paste multi-student lists directly into the school database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Download formatted CSV template for student registration"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Template</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Default Class Assignment Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Enrollment Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} {ay.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Grade Level (Default)
            </label>
            <select
              value={defaultGradeId}
              onChange={(e) => handleDefaultGradeChange(e.target.value)}
              className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Section (Default)
            </label>
            <select
              value={defaultSectionId}
              onChange={(e) => setDefaultSectionId(e.target.value)}
              disabled={availableDefaultSections.length === 0}
              className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {availableDefaultSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Methods Toolbar */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Upload File Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import CSV / Text File</span>
            </button>

            {/* 2. Toggle Paste Box */}
            <button
              type="button"
              onClick={() => setShowPasteArea(!showPasteArea)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-colors ${
                showPasteArea
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{showPasteArea ? 'Hide Paste Box' : 'Paste from Excel / Clipboard'}</span>
            </button>

            {/* 3. Load Sample Students */}
            <button
              type="button"
              onClick={handleLoadSampleStudents}
              className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-100 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Add 8 Sample Students</span>
            </button>
          </div>

          {parsedStudents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                Staged: {parsedStudents.length} Students
              </span>
              <button
                type="button"
                onClick={() => setParsedStudents([])}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Direct Paste Textarea */}
        {showPasteArea && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-emerald-600" />
                Copy rows from Excel or Google Sheets, then paste below:
              </span>
              <span className="text-[11px] text-slate-400">
                Accepts: "Full Name", "FAN", "Gender", "Phone" or simple list of names
              </span>
            </div>

            <textarea
              rows={4}
              placeholder="Paste spreadsheet cells here...&#10;e.g.&#10;Dawit Haile	FAN-2025-001	male	Grade 9	Section A&#10;Bethlehem Abebe	FAN-2025-002	female	Grade 9	Section A"
              value={rawTextBuffer}
              onChange={(e) => setRawTextBuffer(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500 italic">
                Tip: If your table has no Grade or Section columns, they will automatically be assigned to{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {grades.find((g) => g.id === defaultGradeId)?.name} —{' '}
                  {sections.find((s) => s.id === defaultSectionId)?.name}
                </strong>
                .
              </p>
              <button
                type="button"
                onClick={handleParsePastedText}
                disabled={!rawTextBuffer.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                Parse & Add to Table
              </button>
            </div>
          </div>
        )}

        {/* Staged Students Preview Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {parsedStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Students Staged for Upload
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Paste names from your spreadsheet, upload a CSV file, or click "Add 8 Sample Students" to preview the registration flow.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteArea(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Open Paste Area
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleStudents}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-xs"
                >
                  Try Sample Students
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Batch Assignment Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Bulk Re-assign Staged Students:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">All to Grade:</span>
                    <select
                      onChange={(e) => handleApplyGradeToAll(e.target.value)}
                      className="h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Grade</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">All to Section:</span>
                    <select
                      onChange={(e) => handleApplySectionToAll(e.target.value)}
                      className="h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Section</option>
                      {sections.map((s) => {
                        const gName = grades.find((g) => g.id === s.gradeId)?.name;
                        return (
                          <option key={s.id} value={s.id}>
                            {gName ? `${gName} - ` : ''}
                            {s.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Full Name *</th>
                      <th className="py-2.5 px-3 min-w-[130px]">FAN / Admission No.</th>
                      <th className="py-2.5 px-3 w-28">Gender</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Grade *</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Section *</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Guardian Contact</th>
                      <th className="py-2.5 px-3 w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {parsedStudents.map((item, idx) => {
                      const gradeSections = sections.filter((s) => s.gradeId === item.gradeId);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            !item.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Full Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.fullName}
                              onChange={(e) => handleUpdateItem(item.id, { fullName: e.target.value })}
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Admission No / FAN */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.admissionNo}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { admissionNo: e.target.value })
                              }
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>

                          {/* Gender */}
                          <td className="py-2 px-3">
                            <select
                              value={item.gender}
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  gender: e.target.value as 'male' | 'female' | 'other',
                                })
                              }
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </td>

                          {/* Grade */}
                          <td className="py-2 px-3">
                            <select
                              value={item.gradeId}
                              onChange={(e) => {
                                const newGId = e.target.value;
                                const matchSec = sections.filter((s) => s.gradeId === newGId);
                                handleUpdateItem(item.id, {
                                  gradeId: newGId,
                                  sectionId: matchSec[0]?.id || '',
                                });
                              }}
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            >
                              {grades.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Section */}
                          <td className="py-2 px-3">
                            <select
                              value={item.sectionId}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { sectionId: e.target.value })
                              }
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                            >
                              {gradeSections.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Guardian Contact */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Phone / Guardian"
                              value={item.guardianPhone || item.guardianName || ''}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { guardianPhone: e.target.value })
                              }
                              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400"
                            />
                          </td>

                          {/* Remove */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedStudents.length > 0 ? (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Ready to enroll {parsedStudents.length} students into{' '}
                {grades.find((g) => g.id === defaultGradeId)?.name || 'classes'}
              </span>
            ) : (
              <span>Ready for import. Supports CSV files and spreadsheet copy-paste.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCommitUpload}
              disabled={parsedStudents.length === 0 || isUploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-xs transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Students...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Upload All to Database ({parsedStudents.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
