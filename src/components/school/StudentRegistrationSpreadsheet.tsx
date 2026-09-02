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
  RefreshCw,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Search,
  Filter,
  CheckCheck,
  Columns,
  Grid,
} from 'lucide-react';
import { AcademicYear, Grade, Section, Student, Company } from '../../types';
import { api } from '../../lib/api';
import { parseSpreadsheetPastedText } from '../../lib/academicUtils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface SpreadsheetStudentRow {
  uid: string; // unique internal row key
  dbId?: string; // existing Firestore ID if editing
  studentId: string; // e.g. ST001 or FAN-2026-102
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  gradeName: string;
  sectionName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  enrollmentDate: string;
  status: 'Active' | 'Inactive' | 'Transferred' | 'Graduated' | 'Withdrawn';
  // Extra columns added by user
  customFields?: Record<string, string>;
  // Validation cache
  errors?: Record<string, string>;
  isValid?: boolean;
}

export interface SpreadsheetColumnDef {
  key: keyof SpreadsheetStudentRow | string;
  title: string;
  width: number;
  required?: boolean;
  type: 'text' | 'date' | 'select';
  options?: string[];
  isCustom?: boolean;
}

interface StudentRegistrationSpreadsheetProps {
  company: Company;
  academicYears: AcademicYear[];
  grades: Grade[];
  sections: Section[];
  existingStudents: Student[];
  onBackToNormalView: () => void;
  onRefreshData: () => Promise<void>;
}

export const StudentRegistrationSpreadsheet: React.FC<StudentRegistrationSpreadsheetProps> = ({
  company,
  academicYears,
  grades,
  sections,
  existingStudents,
  onBackToNormalView,
  onRefreshData,
}) => {
  const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(activeYear?.id || '');

  // Master Column Definition based on Specification:
  // 1. Student ID
  // 2. First Name
  // 3. Middle Name
  // 4. Last Name
  // 5. Date of Birth
  // 6. Gender
  // 7. Grade
  // 8. Section
  // 9. Parent/Guardian Name
  // 10. Parent/Guardian Phone
  // 11. Parent/Guardian Email
  // 12. Address
  // 13. Enrollment Date
  // 14. Enrollment Status
  const gradeOptions = useMemo(() => grades.map((g) => g.name), [grades]);
  const sectionOptions = useMemo(() => {
    // Unique section names across the school
    const unique = Array.from(new Set(sections.map((s) => s.name)));
    return unique.length > 0 ? unique : ['A', 'B', 'C', 'D'];
  }, [sections]);

  const defaultColumns: SpreadsheetColumnDef[] = useMemo(
    () => [
      { key: 'studentId', title: 'Student ID', width: 140, required: true, type: 'text' },
      { key: 'firstName', title: 'First Name', width: 150, required: true, type: 'text' },
      { key: 'middleName', title: 'Middle Name', width: 130, required: false, type: 'text' },
      { key: 'lastName', title: 'Last Name', width: 150, required: true, type: 'text' },
      { key: 'dob', title: 'Date of Birth', width: 130, required: false, type: 'date' },
      { key: 'gender', title: 'Gender', width: 110, required: false, type: 'select', options: ['Male', 'Female', 'Other'] },
      { key: 'gradeName', title: 'Grade', width: 130, required: true, type: 'select', options: gradeOptions },
      { key: 'sectionName', title: 'Section', width: 110, required: true, type: 'select', options: sectionOptions },
      { key: 'guardianName', title: 'Parent/Guardian Name', width: 180, required: false, type: 'text' },
      { key: 'guardianPhone', title: 'Parent/Guardian Phone', width: 160, required: false, type: 'text' },
      { key: 'guardianEmail', title: 'Parent/Guardian Email', width: 180, required: false, type: 'text' },
      { key: 'address', title: 'Address', width: 160, required: false, type: 'text' },
      { key: 'enrollmentDate', title: 'Enrollment Date', width: 130, required: false, type: 'date' },
      {
        key: 'status',
        title: 'Enrollment Status',
        width: 140,
        required: false,
        type: 'select',
        options: ['Active', 'Inactive', 'Transferred', 'Graduated', 'Withdrawn'],
      },
    ],
    [gradeOptions, sectionOptions]
  );

  const [columns, setColumns] = useState<SpreadsheetColumnDef[]>(defaultColumns);
  const [rows, setRows] = useState<SpreadsheetStudentRow[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Active cell and Selection Range
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colIdx: number } | null>({
    rowIdx: 0,
    colIdx: 0,
  });
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterErrorsOnly, setFilterErrorsOnly] = useState<boolean>(false);

  // Validation Summary & State
  const [validationReport, setValidationReport] = useState<{
    total: number;
    validCount: number;
    errorCount: number;
    messages: string[];
  } | null>(null);

  // Saving stage states (Stage 1 to 5)
  const [savingStage, setSavingStage] = useState<{
    inProgress: boolean;
    stageNumber: number;
    stageName: string;
    progressText: string;
    isComplete: boolean;
    successCount?: number;
    failCount?: number;
    errorSummary?: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Initialize initial 10 blank rows or load existing school roster
  useEffect(() => {
    if (existingStudents.length > 0) {
      // Map existing students into spreadsheet rows
      const mapped: SpreadsheetStudentRow[] = existingStudents.map((stu, i) => {
        const matchingGrade = grades.find((g) => g.id === stu.gradeId);
        const matchingSection = sections.find((s) => s.id === stu.sectionId);

        // Split fullName if firstName/lastName not explicitly stored
        const parts = stu.fullName.trim().split(/\s+/);
        const fName = stu.firstName || parts[0] || '';
        const mName = stu.middleName || (parts.length > 2 ? parts.slice(1, -1).join(' ') : '');
        const lName = stu.lastName || (parts.length > 1 ? parts[parts.length - 1] : '');

        const statusMap: Record<string, SpreadsheetStudentRow['status']> = {
          active: 'Active',
          inactive: 'Inactive',
          transferred: 'Transferred',
          graduated: 'Graduated',
        };

        const genderMap: Record<string, SpreadsheetStudentRow['gender']> = {
          male: 'Male',
          female: 'Female',
          other: 'Other',
        };

        return {
          uid: `stu_row_${stu.id}_${i}`,
          dbId: stu.id,
          studentId: stu.admissionNo || `FAN-${new Date().getFullYear()}-${1000 + i}`,
          firstName: fName,
          middleName: mName,
          lastName: lName,
          dob: stu.dateOfBirth || '',
          gender: genderMap[stu.gender || 'male'] || 'Male',
          gradeName: matchingGrade ? matchingGrade.name : grades[0]?.name || 'Grade 1',
          sectionName: matchingSection ? matchingSection.name : sections[0]?.name || 'A',
          guardianName: stu.guardianName || '',
          guardianPhone: stu.guardianPhone || '',
          guardianEmail: stu.guardianEmail || '',
          address: stu.address || '',
          enrollmentDate: stu.enrollmentDate || '',
          status: statusMap[stu.status] || 'Active',
          errors: {},
          isValid: true,
        };
      });
      setRows(mapped);
    } else {
      // Create initial 10 clean blank rows
      generateBlankRows(10);
    }
  }, [existingStudents, grades, sections]);

  // Unsaved changes browser guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in the student registration spreadsheet. Leave without saving?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Generate blank template rows
  const generateBlankRows = (count: number) => {
    const currentYearNum = new Date().getFullYear();
    const defaultGrade = grades[0]?.name || 'Grade 9';
    const defaultSection = sections[0]?.name || 'A';

    const newRows: SpreadsheetStudentRow[] = Array.from({ length: count }, (_, i) => ({
      uid: `row_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      gender: 'Male',
      gradeName: defaultGrade,
      sectionName: defaultSection,
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      address: '',
      enrollmentDate: `${currentYearNum}-09-01`,
      status: 'Active',
      errors: {},
      isValid: true,
    }));

    setRows((prev) => [...prev, ...newRows]);
    setHasUnsavedChanges(true);
  };

  // -------------------------------------------------------------
  // CELL EDITING & VALUE RESOLUTION
  // -------------------------------------------------------------
  const getCellValue = (row: SpreadsheetStudentRow, key: string): string => {
    if (key in row) {
      const val = (row as any)[key];
      return val !== undefined && val !== null ? String(val) : '';
    }
    return row.customFields?.[key] || '';
  };

  const updateCellValue = (rowIdx: number, colKey: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      if (!next[rowIdx]) return prev;
      const targetRow = { ...next[rowIdx] };

      if (colKey in targetRow) {
        (targetRow as any)[colKey] = value;
      } else {
        targetRow.customFields = {
          ...(targetRow.customFields || {}),
          [colKey]: value,
        };
      }

      // If Grade changed, ensure valid Section
      if (colKey === 'gradeName') {
        const foundGrade = grades.find((g) => g.name.toLowerCase() === value.toLowerCase());
        if (foundGrade) {
          const matchingSections = sections.filter((s) => s.gradeId === foundGrade.id);
          if (matchingSections.length > 0 && !matchingSections.some((s) => s.name === targetRow.sectionName)) {
            targetRow.sectionName = matchingSections[0].name;
          }
        }
      }

      // Live validation on this row
      validateSingleRow(targetRow, next, rowIdx);

      next[rowIdx] = targetRow;
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // -------------------------------------------------------------
  // VALIDATION SYSTEM
  // -------------------------------------------------------------
  const validateSingleRow = (
    row: SpreadsheetStudentRow,
    allRows: SpreadsheetStudentRow[],
    rowIdx: number
  ): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Ignore completely empty rows
    const isCompletelyEmpty =
      !row.studentId.trim() &&
      !row.firstName.trim() &&
      !row.lastName.trim() &&
      !row.guardianName.trim() &&
      !row.guardianPhone.trim();

    if (isCompletelyEmpty) {
      row.errors = {};
      row.isValid = true;
      return { isValid: true, errors: {} };
    }

    // 1. Student ID Required
    if (!row.studentId || !row.studentId.trim()) {
      errors.studentId = 'Student ID is required.';
    } else {
      const cleanId = row.studentId.trim().toLowerCase();
      // Check duplicate within spreadsheet
      const dupInSheet = allRows.some(
        (r, idx) => idx !== rowIdx && r.studentId.trim().toLowerCase() === cleanId
      );
      if (dupInSheet) {
        errors.studentId = `Duplicate Student ID "${row.studentId}" in table.`;
      }
      // Check duplicate against existing Firestore database (unless it's the same record being edited)
      const dupInDb = existingStudents.some(
        (stu) =>
          stu.id !== row.dbId &&
          stu.admissionNo.toLowerCase() === cleanId
      );
      if (dupInDb) {
        errors.studentId = `Student ID "${row.studentId}" already exists in school database.`;
      }
    }

    // 2. First Name Required
    if (!row.firstName || !row.firstName.trim()) {
      errors.firstName = 'First Name is required.';
    }

    // 3. Last Name Required
    if (!row.lastName || !row.lastName.trim()) {
      errors.lastName = 'Last Name is required.';
    }

    // 4. Grade Validation (Must exist in school config)
    if (!row.gradeName || !row.gradeName.trim()) {
      errors.gradeName = 'Grade is required.';
    } else {
      const validGrade = grades.some(
        (g) =>
          g.name.toLowerCase() === row.gradeName.trim().toLowerCase() ||
          `grade ${g.level}`.toLowerCase() === row.gradeName.trim().toLowerCase() ||
          String(g.level) === row.gradeName.trim()
      );
      if (!validGrade) {
        errors.gradeName = `Grade "${row.gradeName}" does not exist in school configuration.`;
      }
    }

    // 5. Section Validation
    if (!row.sectionName || !row.sectionName.trim()) {
      errors.sectionName = 'Section is required.';
    } else {
      // Verify section belongs to this grade if grade is valid
      const targetGrade = grades.find(
        (g) => g.name.toLowerCase() === row.gradeName.trim().toLowerCase()
      );
      if (targetGrade) {
        const gradeSections = sections.filter((s) => s.gradeId === targetGrade.id);
        const validSection = gradeSections.some(
          (s) =>
            s.name.toLowerCase() === row.sectionName.trim().toLowerCase() ||
            `section ${s.name}`.toLowerCase() === row.sectionName.trim().toLowerCase()
        );
        if (!validSection && gradeSections.length > 0) {
          errors.sectionName = `Section "${row.sectionName}" does not exist for ${targetGrade.name}.`;
        }
      }
    }

    // 6. Date of Birth Format
    if (row.dob && row.dob.trim()) {
      const dateVal = row.dob.trim();
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateVal) && !isNaN(Date.parse(dateVal));
      if (!isValidDate) {
        errors.dob = 'Invalid date format. Use YYYY-MM-DD (e.g. 2012-04-10).';
      }
    }

    // 7. Guardian Email
    if (row.guardianEmail && row.guardianEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.guardianEmail.trim())) {
        errors.guardianEmail = 'Invalid email address format.';
      }
    }

    // 8. Guardian Phone
    if (row.guardianPhone && row.guardianPhone.trim()) {
      const digitsOnly = row.guardianPhone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors.guardianPhone = 'Phone number should be 8-15 digits.';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    row.errors = errors;
    row.isValid = isValid;
    return { isValid, errors };
  };

  // Run full validation across all rows
  const validateAllRows = () => {
    let validCount = 0;
    let errorCount = 0;
    const errorMessages: string[] = [];

    const validatedRows = rows.map((row, idx) => {
      const { isValid, errors } = validateSingleRow(row, rows, idx);
      const isCompletelyEmpty =
        !row.studentId.trim() &&
        !row.firstName.trim() &&
        !row.lastName.trim();

      if (isCompletelyEmpty) {
        return row;
      }

      if (isValid) {
        validCount++;
      } else {
        errorCount++;
        Object.entries(errors).forEach(([field, msg]) => {
          errorMessages.push(`Row ${idx + 1} (${row.studentId || 'No ID'}): ${msg}`);
        });
      }
      return { ...row, isValid, errors };
    });

    setRows(validatedRows);
    setValidationReport({
      total: validCount + errorCount,
      validCount,
      errorCount,
      messages: errorMessages,
    });

    return { validCount, errorCount, validatedRows };
  };

  // -------------------------------------------------------------
  // CLIPBOARD COPY & PASTE ENGINE (Ctrl+C & Ctrl+V)
  // -------------------------------------------------------------
  const handlePasteClipboardData = (pastedText: string, startRowIdx: number, startColIdx: number) => {
    if (!pastedText) return;

    const parsedMatrix = parseSpreadsheetPastedText(pastedText);
    if (parsedMatrix.length === 0) return;

    const rowCountToAdd = parsedMatrix.length;
    const colCountPasted = Math.max(...parsedMatrix.map((r) => r.length));

    setRows((prev) => {
      let next = [...prev];

      // Automatically create additional rows if paste exceeds current table height
      const requiredTotalRows = startRowIdx + rowCountToAdd;
      if (requiredTotalRows > next.length) {
        const rowsNeeded = requiredTotalRows - next.length;
        const currentYearNum = new Date().getFullYear();
        const defaultGrade = grades[0]?.name || 'Grade 9';
        const defaultSection = sections[0]?.name || 'A';

        for (let i = 0; i < rowsNeeded; i++) {
          next.push({
            uid: `pasted_row_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            studentId: '',
            firstName: '',
            middleName: '',
            lastName: '',
            dob: '',
            gender: 'Male',
            gradeName: defaultGrade,
            sectionName: defaultSection,
            guardianName: '',
            guardianPhone: '',
            guardianEmail: '',
            address: '',
            enrollmentDate: `${currentYearNum}-09-01`,
            status: 'Active',
            errors: {},
            isValid: true,
          });
        }
      }

      // Populate cells starting at startRowIdx & startColIdx
      parsedMatrix.forEach((pRow, rOffset) => {
        const targetRowIdx = startRowIdx + rOffset;
        if (targetRowIdx >= next.length) return;

        const rowCopy = { ...next[targetRowIdx] };

        pRow.forEach((cellVal, cOffset) => {
          const targetColIdx = startColIdx + cOffset;
          if (targetColIdx >= columns.length) return; // Only populate permitted schema columns

          const colDef = columns[targetColIdx];
          const colKey = colDef.key as string;
          const cleanVal = cellVal.trim();

          // Normalization for specific select types
          if (colKey === 'gender') {
            const lower = cleanVal.toLowerCase();
            if (lower === 'm' || lower === 'male') (rowCopy as any)[colKey] = 'Male';
            else if (lower === 'f' || lower === 'female') (rowCopy as any)[colKey] = 'Female';
            else (rowCopy as any)[colKey] = 'Male';
          } else if (colKey === 'status') {
            const lower = cleanVal.toLowerCase();
            if (lower.includes('active')) rowCopy.status = 'Active';
            else if (lower.includes('grad')) rowCopy.status = 'Graduated';
            else if (lower.includes('trans')) rowCopy.status = 'Transferred';
            else if (lower.includes('inact')) rowCopy.status = 'Inactive';
            else if (lower.includes('with')) rowCopy.status = 'Withdrawn';
            else rowCopy.status = 'Active';
          } else if (colKey === 'gradeName') {
            // Match against grade options
            const matchedGrade = grades.find(
              (g) =>
                g.name.toLowerCase() === cleanVal.toLowerCase() ||
                `grade ${g.level}`.toLowerCase() === cleanVal.toLowerCase() ||
                String(g.level) === cleanVal
            );
            rowCopy.gradeName = matchedGrade ? matchedGrade.name : cleanVal;
          } else if (colKey === 'sectionName') {
            const cleanSec = cleanVal.replace(/^section\s+/i, '').trim();
            rowCopy.sectionName = cleanSec || cleanVal;
          } else if (colKey in rowCopy) {
            (rowCopy as any)[colKey] = cleanVal;
          } else {
            rowCopy.customFields = {
              ...(rowCopy.customFields || {}),
              [colKey]: cleanVal,
            };
          }
        });

        // Run validation on modified row
        validateSingleRow(rowCopy, next, targetRowIdx);
        next[targetRowIdx] = rowCopy;
      });

      return next;
    });

    setHasUnsavedChanges(true);
    setFeedback({
      type: 'success',
      message: `Pasted ${rowCountToAdd} rows × ${colCountPasted} columns starting at ${columns[startColIdx]?.title || 'Col'} Row ${startRowIdx + 1}!`,
    });
  };

  // Native Paste listener for table container
  const handleContainerPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    // Determine target start row and column from activeCell
    const startRow = activeCell?.rowIdx ?? 0;
    const startCol = activeCell?.colIdx ?? 0;

    e.preventDefault();
    handlePasteClipboardData(text, startRow, startCol);
  };

  // Copy selected cells to clipboard (TSV format compatible with Excel & Google Sheets)
  const handleCopySelectedCells = () => {
    if (!selectionRange && !activeCell) return;

    const startR = selectionRange ? Math.min(selectionRange.startRow, selectionRange.endRow) : activeCell!.rowIdx;
    const endR = selectionRange ? Math.max(selectionRange.startRow, selectionRange.endRow) : activeCell!.rowIdx;
    const startC = selectionRange ? Math.min(selectionRange.startCol, selectionRange.endCol) : activeCell!.colIdx;
    const endC = selectionRange ? Math.max(selectionRange.startCol, selectionRange.endCol) : activeCell!.colIdx;

    const tsvLines: string[] = [];

    for (let r = startR; r <= endR; r++) {
      const rowData = rows[r];
      if (!rowData) continue;
      const lineCells: string[] = [];
      for (let c = startC; c <= endC; c++) {
        const colDef = columns[c];
        lineCells.push(colDef ? getCellValue(rowData, colDef.key as string) : '');
      }
      tsvLines.push(lineCells.join('\t'));
    }

    const tsvString = tsvLines.join('\n');
    navigator.clipboard.writeText(tsvString);

    setFeedback({
      type: 'success',
      message: `Copied ${endR - startR + 1} row(s) × ${endC - startC + 1} column(s) to clipboard in Excel/Google Sheets TSV format!`,
    });
  };

  // Keyboard navigation
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    const maxRow = rows.length - 1;
    const maxCol = columns.length - 1;

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
        setActiveCell({ rowIdx: rowIdx + 1, colIdx: 0 });
        focusCell(rowIdx + 1, 0);
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (colIdx > 0) {
        e.preventDefault();
        setActiveCell({ rowIdx, colIdx: colIdx - 1 });
        focusCell(rowIdx, colIdx - 1);
      } else if (rowIdx > 0) {
        e.preventDefault();
        setActiveCell({ rowIdx: rowIdx - 1, colIdx: maxCol });
        focusCell(rowIdx - 1, maxCol);
      }
    } else if (e.ctrlKey && e.key === 'c') {
      // Let handleCopySelectedCells work or trigger it
      handleCopySelectedCells();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // If entire cell selected and not actively typing in input, clear it
      if ((e.target as HTMLInputElement).selectionStart === 0 && (e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length) {
        updateCellValue(rowIdx, columns[colIdx].key as string, '');
      }
    }
  };

  const focusCell = (rowIdx: number, colIdx: number) => {
    const input = document.getElementById(`student-cell-${rowIdx}-${colIdx}`);
    if (input) {
      input.focus();
      if ((input as HTMLInputElement).select) {
        (input as HTMLInputElement).select();
      }
    }
  };

  // -------------------------------------------------------------
  // ROW & COLUMN CONTROLS
  // -------------------------------------------------------------
  const handleAddRow = (count = 1) => {
    generateBlankRows(count);
  };

  const handleDeleteRow = (targetIdx: number) => {
    if (rows.length <= 1) {
      setFeedback({ type: 'error', message: 'The spreadsheet must have at least one row.' });
      return;
    }
    setRows((prev) => prev.filter((_, idx) => idx !== targetIdx));
    setHasUnsavedChanges(true);
  };

  const handleClearTable = () => {
    if (!window.confirm('Are you sure you want to clear all rows in this spreadsheet?')) return;
    setRows([]);
    generateBlankRows(10);
    setValidationReport(null);
    setHasUnsavedChanges(true);
    setFeedback({ type: 'info', message: 'Table cleared. Added 10 fresh blank rows.' });
  };

  // -------------------------------------------------------------
  // TEMPLATE DOWNLOAD & EXCEL COMPATIBILITY
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const headers = columns.map((c) => c.title);
    const sampleRows = [
      [
        'ST001',
        'John',
        'Michael',
        'Smith',
        '2012-04-10',
        'Male',
        grades[0]?.name || 'Grade 9',
        sections[0]?.name || 'A',
        'Michael Smith',
        '+251911223344',
        'parent.smith@example.com',
        'Addis Ababa, Bole',
        '2026-09-01',
        'Active',
      ],
      [
        'ST002',
        'Sarah',
        'Anne',
        'Jones',
        '2012-08-21',
        'Female',
        grades[0]?.name || 'Grade 9',
        sections[0]?.name || 'A',
        'Anne Jones',
        '+251922334455',
        'parent.jones@example.com',
        'Addis Ababa, Kirkos',
        '2026-09-01',
        'Active',
      ],
      [
        'ST003',
        'David',
        'James',
        'Brown',
        '2011-12-02',
        'Male',
        grades[1]?.name || grades[0]?.name || 'Grade 10',
        sections[1]?.name || sections[0]?.name || 'B',
        'James Brown',
        '+251933445566',
        'parent.brown@example.com',
        'Addis Ababa, Yeka',
        '2026-09-01',
        'Active',
      ],
    ];

    const instructions = [
      '# NABSITE BULK STUDENT REGISTRATION TEMPLATE INSTRUCTIONS',
      '# 1. Required columns: Student ID, First Name, Last Name, Grade, Section.',
      `# 2. Configured Grades for this school: ${grades.map((g) => g.name).join(', ')}.`,
      `# 3. Configured Sections for this school: ${Array.from(new Set(sections.map((s) => s.name))).join(', ')}.`,
      '# 4. Gender options: Male, Female, Other.',
      '# 5. Date format: YYYY-MM-DD (e.g. 2012-04-10).',
      '# 6. Status options: Active, Inactive, Transferred, Graduated, Withdrawn.',
      '# 7. You can copy & paste directly between Excel, Google Sheets, and NABSITE with Ctrl+C / Ctrl+V.',
    ];

    const csvContent =
      '\uFEFF' +
      instructions.join('\r\n') +
      '\r\n\r\n' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Student_Registration_Template_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: 'Downloaded Excel-compatible Student Registration template with instructions & school configurations!',
    });
  };

  // Export current table to CSV
  const handleExportToExcel = () => {
    if (rows.length === 0) return;
    const headers = columns.map((c) => c.title);
    const dataRows = rows.map((r) =>
      columns.map((c) => `"${getCellValue(r, c.key as string).replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Students_Export_${company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // MULTI-STAGE HIGH PERFORMANCE BATCH SAVING TO FIRESTORE
  // -------------------------------------------------------------
  const handleSaveStudents = async (saveOnlyValid = false) => {
    // Stage 1: Validation
    setSavingStage({
      inProgress: true,
      stageNumber: 1,
      stageName: 'Validating Rows',
      progressText: `Validating ${rows.length} rows against school configuration & database uniqueness...`,
      isComplete: false,
    });

    const { validCount, errorCount, validatedRows } = validateAllRows();

    // Filter out completely blank rows
    const filledRows = validatedRows.filter(
      (r) => r.studentId.trim() || r.firstName.trim() || r.lastName.trim()
    );

    if (filledRows.length === 0) {
      setSavingStage(null);
      setFeedback({ type: 'error', message: 'No student data to save. Please enter or paste student rows.' });
      return;
    }

    if (errorCount > 0 && !saveOnlyValid) {
      setSavingStage(null);
      setFeedback({
        type: 'error',
        message: `${errorCount} row(s) contain validation errors. Click "Fix Errors" or "Save Valid Rows (${validCount})".`,
      });
      return;
    }

    const rowsToSave = saveOnlyValid ? filledRows.filter((r) => r.isValid) : filledRows;

    if (rowsToSave.length === 0) {
      setSavingStage(null);
      setFeedback({ type: 'error', message: 'No valid rows found to save.' });
      return;
    }

    // Stage 2: Preparation
    setSavingStage({
      inProgress: true,
      stageNumber: 2,
      stageName: 'Preparing Records',
      progressText: `Preparing ${rowsToSave.length} student documents for Firestore transaction batching...`,
      isComplete: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Map rows into Firestore Student payloads
    const studentListPayload = rowsToSave.map((r) => {
      // Resolve Grade ID
      const matchedGrade = grades.find(
        (g) =>
          g.name.toLowerCase() === r.gradeName.trim().toLowerCase() ||
          `grade ${g.level}`.toLowerCase() === r.gradeName.trim().toLowerCase() ||
          String(g.level) === r.gradeName.trim()
      );
      const gradeId = matchedGrade ? matchedGrade.id : grades[0]?.id || '';

      // Resolve Section ID
      const gradeSections = sections.filter((s) => s.gradeId === gradeId);
      const matchedSection = gradeSections.find(
        (s) =>
          s.name.toLowerCase() === r.sectionName.trim().toLowerCase() ||
          `section ${s.name}`.toLowerCase() === r.sectionName.trim().toLowerCase()
      );
      const sectionId = matchedSection ? matchedSection.id : gradeSections[0]?.id || sections[0]?.id || '';

      const fullName = `${r.firstName.trim()} ${r.middleName.trim()} ${r.lastName.trim()}`
        .replace(/\s+/g, ' ')
        .trim();

      const genderFormatted: 'male' | 'female' | 'other' =
        r.gender.toLowerCase() === 'female' ? 'female' : r.gender.toLowerCase() === 'other' ? 'other' : 'male';

      const statusFormatted: 'active' | 'graduated' | 'transferred' | 'inactive' =
        r.status.toLowerCase() === 'graduated'
          ? 'graduated'
          : r.status.toLowerCase() === 'transferred'
          ? 'transferred'
          : r.status.toLowerCase() === 'inactive' || r.status.toLowerCase() === 'withdrawn'
          ? 'inactive'
          : 'active';

      return {
        id: r.dbId, // if updating existing student
        fullName,
        firstName: r.firstName.trim(),
        middleName: r.middleName.trim(),
        lastName: r.lastName.trim(),
        admissionNo: r.studentId.trim(),
        gradeId,
        sectionId,
        academicYearId: selectedAcademicYearId,
        gender: genderFormatted,
        dateOfBirth: r.dob.trim(),
        guardianName: r.guardianName.trim(),
        guardianPhone: r.guardianPhone.trim(),
        guardianEmail: r.guardianEmail.trim(),
        address: r.address.trim(),
        enrollmentDate: r.enrollmentDate.trim(),
        status: statusFormatted,
        notes: r.customFields ? JSON.stringify(r.customFields) : '',
      };
    });

    // Stage 3: Saving to Firestore via bulk batch writes
    setSavingStage({
      inProgress: true,
      stageNumber: 3,
      stageName: 'Saving to Firestore',
      progressText: `Executing Firestore batch writes for ${studentListPayload.length} students...`,
      isComplete: false,
    });

    try {
      const result = await api.bulkCreateStudents(company.id, studentListPayload);

      // Stage 4: Verifying
      setSavingStage({
        inProgress: true,
        stageNumber: 4,
        stageName: 'Verifying Persistence',
        progressText: `Verifying database write persistence (${result.addedCount} added, ${result.updatedCount} updated)...`,
        isComplete: false,
      });

      await onRefreshData();

      // Stage 5: Complete
      setSavingStage({
        inProgress: false,
        stageNumber: 5,
        stageName: 'Registration Complete',
        progressText: `✓ ${result.addedCount + result.updatedCount} students successfully persisted to Firestore!`,
        isComplete: true,
        successCount: result.addedCount + result.updatedCount,
        failCount: errorCount,
      });

      setHasUnsavedChanges(false);
      setFeedback({
        type: 'success',
        message: `✓ Successfully saved ${result.addedCount + result.updatedCount} student profiles to Firestore!`,
      });
    } catch (err: any) {
      console.error('Save failed:', err);
      setSavingStage({
        inProgress: false,
        stageNumber: 3,
        stageName: 'Save Failed',
        progressText: 'Failed to write students to Firestore.',
        isComplete: false,
        errorSummary: err.message || 'Network or Firestore timeout error occurred.',
      });
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save students to Firestore. Please retry.',
      });
    }
  };

  // -------------------------------------------------------------
  // FILTERED ROWS FOR DISPLAY
  // -------------------------------------------------------------
  const displayRows = useMemo(() => {
    return rows.map((r, actualIndex) => ({ r, actualIndex })).filter(({ r }) => {
      if (filterErrorsOnly && r.isValid) return false;
      if (filterGrade !== 'ALL' && r.gradeName.toLowerCase() !== filterGrade.toLowerCase()) return false;
      if (filterSection !== 'ALL' && r.sectionName.toLowerCase() !== filterSection.toLowerCase()) return false;
      if (filterStatus !== 'ALL' && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.studentId.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.guardianName.toLowerCase().includes(q) ||
          r.guardianPhone.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, filterGrade, filterSection, filterStatus, filterErrorsOnly, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumb Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (!window.confirm('You have unsaved changes in the spreadsheet. Leave without saving?')) {
                  return;
                }
              }
              onBackToNormalView();
            }}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Return to standard students roster list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Bulk Student Registration
              </h2>
              <Badge variant="success" size="sm">
                Spreadsheet 2.0 Engine
              </Badge>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {rows.length} rows × {columns.length} columns
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add multiple students at once by entering data manually or copying data from Excel / Google Sheets.
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Copy}
            onClick={() => {
              // Trigger paste prompt or focus
              const samplePaste =
                'ST101\tAbebe\tKebede\tTadesse\t2012-05-12\tMale\tGrade 9\tA\tKebede Tadesse\t+251911000111\nST102\tFatima\tZehra\tAhmed\t2012-09-18\tFemale\tGrade 9\tA\tAhmed Mohammed\t+251922000222';
              navigator.clipboard.readText().then(
                (text) => {
                  if (text) {
                    handlePasteClipboardData(text, activeCell?.rowIdx ?? 0, activeCell?.colIdx ?? 0);
                  } else {
                    handlePasteClipboardData(samplePaste, activeCell?.rowIdx ?? 0, activeCell?.colIdx ?? 0);
                  }
                },
                () => {
                  // Fallback: paste sample
                  handlePasteClipboardData(samplePaste, activeCell?.rowIdx ?? 0, activeCell?.colIdx ?? 0);
                }
              );
            }}
            title="Paste tab-separated or Excel copied data at current active cell"
          >
            Paste from Excel / Google Sheets
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleDownloadTemplate}
            title="Download Excel-compatible template with school configured grades & sections"
          >
            Download Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={handleExportToExcel}
            title="Export all rows to Excel CSV"
          >
            Export to Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Trash2}
            onClick={handleClearTable}
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Clear Table
          </Button>
        </div>
      </div>

      {/* Target Academic Year & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Target Academic Year */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">Target Year:</span>
            <select
              value={selectedAcademicYearId}
              onChange={(e) => setSelectedAcademicYearId(e.target.value)}
              className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? '(Active Year)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Student ID, name, parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Grade */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Filter Section */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Sections</option>
            {sectionOptions.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>

          {/* Filter Errors toggle */}
          {validationReport && validationReport.errorCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterErrorsOnly(!filterErrorsOnly)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterErrorsOnly
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{filterErrorsOnly ? 'Showing Errors Only' : `Filter Errors (${validationReport.errorCount})`}</span>
            </button>
          )}
        </div>

        {/* Quick Row Count & Keyboard Tip */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <span>Tip: Click cell + <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border">Ctrl+V</kbd> to paste multi-column data</span>
        </div>
      </div>

      {/* Saving Stage Progress Banner */}
      {savingStage && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            savingStage.isComplete
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : savingStage.errorSummary
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {savingStage.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : savingStage.errorSummary ? (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              )}
              <div>
                <span className="font-extrabold text-sm uppercase tracking-wide mr-2">
                  Stage {savingStage.stageNumber}: {savingStage.stageName}
                </span>
                <span className="text-xs font-medium">{savingStage.progressText}</span>
              </div>
            </div>

            {savingStage.isComplete && (
              <button
                type="button"
                onClick={() => setSavingStage(null)}
                className="text-xs font-bold underline text-emerald-700"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Validation Summary Box */}
      {validationReport && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                {validationReport.total} rows detected
              </span>
              <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {validationReport.validCount} valid
              </span>
              {validationReport.errorCount > 0 && (
                <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationReport.errorCount} require correction
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {validationReport.errorCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterErrorsOnly(!filterErrorsOnly)}
                  className="text-xs text-rose-600"
                >
                  {filterErrorsOnly ? 'Show All Rows' : 'Fix Errors'}
                </Button>
              )}
              {validationReport.validCount > 0 && validationReport.errorCount > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveStudents(true)}
                  className="text-xs"
                >
                  Save Valid Rows ({validationReport.validCount})
                </Button>
              )}
            </div>
          </div>

          {validationReport.errorCount > 0 && validationReport.messages.length > 0 && (
            <div className="max-h-24 overflow-y-auto pt-1 space-y-1 text-[11px] text-rose-600 dark:text-rose-400 font-mono">
              {validationReport.messages.slice(0, 5).map((msg, i) => (
                <div key={i}>• {msg}</div>
              ))}
              {validationReport.messages.length > 5 && (
                <div>...and {validationReport.messages.length - 5} more error(s)</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
              : 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN SPREADSHEET GRID */}
      <div
        ref={tableContainerRef}
        onPaste={handleContainerPaste}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col"
        style={{ maxHeight: '72vh' }}
      >
        <div className="overflow-x-auto overflow-y-auto flex-1 focus:outline-none" tabIndex={0}>
          <table className="w-full text-left border-collapse text-xs select-none">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {/* Sticky Row Number Column */}
                <th className="py-2.5 px-3 w-12 text-center sticky left-0 z-40 bg-slate-200 dark:bg-slate-800/95 border-r border-slate-300 dark:border-slate-700 font-mono text-[10px]">
                  #
                </th>

                {columns.map((col, cIdx) => (
                  <th
                    key={col.key as string}
                    style={{ minWidth: col.width }}
                    className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 font-extrabold whitespace-nowrap bg-slate-100 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>
                        {col.title}
                        {col.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal lowercase">
                        {col.type}
                      </span>
                    </div>
                  </th>
                ))}

                {/* Actions Header */}
                <th className="py-2.5 px-2 w-12 text-center"></th>
              </tr>
            </thead>

            {/* Editable Spreadsheet Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {displayRows.map(({ r, actualIndex }) => {
                const hasRowError = Boolean(r.errors && Object.keys(r.errors).length > 0);

                return (
                  <tr
                    key={r.uid}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                      hasRowError ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Row Number (Sticky) */}
                    <td className="py-1 px-2 text-center text-slate-400 font-mono text-[10px] sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 font-bold">
                      {actualIndex + 1}
                    </td>

                    {/* Column Cells */}
                    {columns.map((col, colIdx) => {
                      const colKey = col.key as string;
                      const cellVal = getCellValue(r, colKey);
                      const isFocused =
                        activeCell?.rowIdx === actualIndex && activeCell?.colIdx === colIdx;
                      const fieldError = r.errors?.[colKey];

                      return (
                        <td
                          key={colKey}
                          onClick={() => setActiveCell({ rowIdx: actualIndex, colIdx })}
                          className={`p-0 border-r border-slate-200 dark:border-slate-800 relative transition-all ${
                            isFocused ? 'ring-2 ring-emerald-500 z-10' : ''
                          } ${fieldError ? 'bg-rose-50/80 dark:bg-rose-950/40' : ''}`}
                        >
                          {col.type === 'select' && col.options ? (
                            <select
                              id={`student-cell-${actualIndex}-${colIdx}`}
                              value={cellVal}
                              onChange={(e) => updateCellValue(actualIndex, colKey, e.target.value)}
                              onFocus={() => setActiveCell({ rowIdx: actualIndex, colIdx })}
                              onKeyDown={(e) => handleCellKeyDown(e, actualIndex, colIdx)}
                              className="w-full h-8 px-2 bg-transparent text-xs font-semibold text-slate-900 dark:text-white border-0 focus:outline-none focus:bg-emerald-500/10 cursor-pointer"
                            >
                              {col.options.map((opt) => (
                                <option key={opt} value={opt} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`student-cell-${actualIndex}-${colIdx}`}
                              type={col.type === 'date' ? 'date' : 'text'}
                              value={cellVal}
                              placeholder={col.required ? 'Required...' : ''}
                              onChange={(e) => updateCellValue(actualIndex, colKey, e.target.value)}
                              onFocus={() => setActiveCell({ rowIdx: actualIndex, colIdx })}
                              onKeyDown={(e) => handleCellKeyDown(e, actualIndex, colIdx)}
                              className={`w-full h-8 px-2.5 bg-transparent text-xs text-slate-900 dark:text-white border-0 focus:outline-none focus:bg-emerald-500/10 ${
                                col.key === 'studentId' ? 'font-mono font-bold text-sky-600 dark:text-sky-400' : ''
                              }`}
                            />
                          )}

                          {/* Field Error Tooltip Marker */}
                          {fieldError && (
                            <div
                              className="absolute right-1 top-1 w-2 h-2 rounded-full bg-rose-500"
                              title={fieldError}
                            />
                          )}
                        </td>
                      );
                    })}

                    {/* Delete Row Action */}
                    <td className="py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(actualIndex)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete this row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM TOOLBAR: ROW & SAVE CONTROLS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => handleAddRow(1)}
          >
            + Add Row
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => handleAddRow(10)}
            title="Add 10 blank rows"
          >
            + Add 10 Rows
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => handleAddRow(50)}
            title="Add 50 blank rows"
          >
            + Add 50 Rows
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={validateAllRows}
            title="Validate all rows without saving"
          >
            Import / Validate
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved Spreadsheet Data
            </span>
          )}

          <Button
            variant="primary"
            size="md"
            icon={Save}
            isLoading={savingStage?.inProgress}
            onClick={() => handleSaveStudents(false)}
            className="shadow-sm"
          >
            Save Students ({rows.filter((r) => r.studentId.trim() || r.firstName.trim()).length})
          </Button>
        </div>
      </div>
    </div>
  );
};
