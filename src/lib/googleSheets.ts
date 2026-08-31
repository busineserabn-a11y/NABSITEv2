import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from './firebase';
import { AssessmentComponent, Subject } from '../types';
import { computeStudentSubjectResult } from './academicUtils';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getGoogleUser = (): User | null => {
  return cachedUser;
};

/**
 * Sign in with Google and request Google Sheets & Drive scopes.
 */
export async function authenticateWithGoogleSheets(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  GOOGLE_SHEETS_SCOPES.forEach((scope) => {
    provider.addScope(scope);
  });
  // Prompt consent to ensure refreshed access token
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google OAuth access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sheets Sign-in Error:', error);
    throw error;
  }
}

export interface StudentRowData {
  studentId: string;
  admissionNo: string;
  studentName: string;
  componentScores?: Record<string, number | null | undefined>;
  score?: number | null;
  weightedTotal?: number | null;
}

export interface SpreadsheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates or overwrites a live Google Spreadsheet formatted specifically for this marklist.
 */
export async function createMarklistGoogleSpreadsheet(params: {
  schoolName: string;
  academicYearName: string;
  gradeName: string;
  sectionName: string;
  subject: Subject;
  entries: StudentRowData[];
  existingSpreadsheetId?: string | null;
}): Promise<SpreadsheetCreationResult> {
  let token = cachedAccessToken;
  if (!token) {
    const authResult = await authenticateWithGoogleSheets();
    token = authResult.accessToken;
  }

  const { schoolName, academicYearName, gradeName, sectionName, subject, entries } = params;
  const components = subject.assessmentComponents || [];
  const title = `[${gradeName} - ${sectionName}] ${subject.name} Marks (${academicYearName})`;

  let spreadsheetId = params.existingSpreadsheetId;
  let spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '';

  // 1. If no existing spreadsheet, create a new one
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Marklist Evaluation',
              gridProperties: {
                frozenRowCount: 4,
                frozenColumnCount: 3,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to create Google Spreadsheet (${createRes.status})`);
    }

    const createdData = await createRes.json();
    spreadsheetId = createdData.spreadsheetId;
    spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 2. Build rows structure for Google Sheet
  const headerRow1 = [
    schoolName ? `${schoolName.toUpperCase()} — ACADEMIC MARKLIST` : 'STUDENT ACADEMIC MARKLIST',
  ];
  const headerRow2 = [
    `Grade: ${gradeName}`,
    `Section: ${sectionName}`,
    `Subject: ${subject.name}`,
    `Academic Year: ${academicYearName}`,
    `Generated: ${new Date().toLocaleDateString()}`,
  ];
  const headerRow3 = [
    'INSTRUCTIONS: Enter student scores in the highlighted component columns. Return to the web app and click "Sync Marks from Google Sheet" to recalculate final marks and save.',
  ];

  // Column Headers
  const columnHeaders: string[] = ['Student ID', 'FAN / Admission No', 'Student Full Name'];

  if (components.length > 0) {
    components.forEach((comp) => {
      columnHeaders.push(`${comp.name} [Max: ${comp.maxScore}, Weight: ${comp.weight}%]`);
    });
  } else {
    columnHeaders.push(`Subject Score [Max: ${subject.maxScore || 100}]`);
  }
  columnHeaders.push('Calculated Total (%)', 'Status');

  const rows: any[][] = [headerRow1, headerRow2, headerRow3, columnHeaders];

  // Populate data rows for each student
  entries.forEach((stu, idx) => {
    const rowNum = 5 + idx; // 1-indexed row number in Google Sheets
    const row: any[] = [stu.studentId, stu.admissionNo || '', stu.studentName];

    if (components.length > 0) {
      components.forEach((comp) => {
        const val = stu.componentScores?.[comp.id];
        row.push(val !== undefined && val !== null ? val : '');
      });

      // Google Sheet Formula for Weighted Average Total
      const startColLetter = 'D';
      const formulaParts: string[] = [];
      components.forEach((comp, cIdx) => {
        const colLetter = String.fromCharCode(68 + cIdx); // D = 68, E = 69, ...
        const compMax = comp.maxScore || 100;
        const compWeight = comp.weight || 0;
        formulaParts.push(`(IF(ISNUMBER(${colLetter}${rowNum}), ${colLetter}${rowNum}, 0) / ${compMax} * ${compWeight})`);
      });
      const formula = `=ROUND(${formulaParts.join(' + ')}, 1)`;
      row.push(formula);
    } else {
      const val = stu.score;
      row.push(val !== undefined && val !== null ? val : '');
      const maxSc = subject.maxScore || 100;
      row.push(`=IF(ISNUMBER(D${rowNum}), ROUND((D${rowNum}/${maxSc})*100, 1), "")`);
    }

    const totalColLetter = String.fromCharCode(68 + (components.length > 0 ? components.length : 1));
    row.push(`=IF(${totalColLetter}${rowNum}>=50, "PASS", IF(${totalColLetter}${rowNum}="", "", "NEEDS IMPROVEMENT"))`);

    rows.push(row);
  });

  // 3. Write data to Google Sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Marklist Evaluation'!A1:Z${rows.length + 5}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Marklist Evaluation'!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to update spreadsheet data (${updateRes.status})`);
  }

  // 4. Format the Google Sheet (Header colors, bold styling, borders)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Format Title Banner Row 1
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.24, blue: 0.44 },
                  textFormat: { bold: true, fontSize: 13, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format Metadata Row 2
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 8 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.93, green: 0.95, blue: 0.98 },
                  textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 0.15, green: 0.25, blue: 0.35 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format Instructions Row 3
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 8 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.99, green: 0.98, blue: 0.9 },
                  textFormat: { italic: true, fontSize: 9, foregroundColor: { red: 0.45, green: 0.35, blue: 0.1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format Table Header Row 4
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: columnHeaders.length },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.45, blue: 0.72 },
                  textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: columnHeaders.length,
              },
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Optional batch formatting notice:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Reads back marks from a live Google Spreadsheet and updates local student entries.
 */
export async function syncMarksFromGoogleSpreadsheet(params: {
  spreadsheetId: string;
  subject: Subject;
  existingEntries: StudentRowData[];
}): Promise<{
  updatedEntries: StudentRowData[];
  syncedCount: number;
}> {
  let token = cachedAccessToken;
  if (!token) {
    const authResult = await authenticateWithGoogleSheets();
    token = authResult.accessToken;
  }

  const { spreadsheetId, subject, existingEntries } = params;
  const components = subject.assessmentComponents || [];

  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Marklist Evaluation'!A4:Z500`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!getRes.ok) {
    const errData = await getRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to read Google Spreadsheet (${getRes.status})`);
  }

  const data = await getRes.json();
  const rows: any[][] = data.values || [];
  if (rows.length <= 1) {
    throw new Error('Spreadsheet has no student data rows below headers.');
  }

  const headerRow = rows[0] || [];
  const dataRows = rows.slice(1);

  // Map students by ID, AdmissionNo, or Name
  const entryMapById = new Map<string, StudentRowData>();
  const entryMapByAdmission = new Map<string, StudentRowData>();
  const entryMapByName = new Map<string, StudentRowData>();

  existingEntries.forEach((e) => {
    if (e.studentId) entryMapById.set(e.studentId.trim().toLowerCase(), e);
    if (e.admissionNo) entryMapByAdmission.set(e.admissionNo.trim().toLowerCase(), e);
    if (e.studentName) entryMapByName.set(e.studentName.trim().toLowerCase(), e);
  });

  const updatedEntriesMap = new Map<string, StudentRowData>();
  // Initialize with clones of existing entries
  existingEntries.forEach((e) => {
    updatedEntriesMap.set(e.studentId, { ...e });
  });

  let syncedCount = 0;

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;
    const rawStudentId = String(row[0] || '').trim();
    const rawAdmissionNo = String(row[1] || '').trim();
    const rawStudentName = String(row[2] || '').trim();

    // Match student
    const match =
      (rawStudentId && entryMapById.get(rawStudentId.toLowerCase())) ||
      (rawAdmissionNo && entryMapByAdmission.get(rawAdmissionNo.toLowerCase())) ||
      (rawStudentName && entryMapByName.get(rawStudentName.toLowerCase()));

    if (!match) return;

    const currentStudent = updatedEntriesMap.get(match.studentId) || { ...match };

    if (components.length > 0) {
      const nextCompScores: Record<string, number | null> = { ...(currentStudent.componentScores || {}) };

      components.forEach((comp, idx) => {
        const colIdx = 3 + idx;
        const cellRaw = row[colIdx];
        if (cellRaw !== undefined && cellRaw !== null && String(cellRaw).trim() !== '') {
          const num = parseFloat(String(cellRaw).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            const clamped = Math.max(0, Math.min(comp.maxScore || 100, num));
            nextCompScores[comp.id] = clamped;
          }
        }
      });

      const calc = computeStudentSubjectResult(nextCompScores, subject);
      currentStudent.componentScores = nextCompScores;
      currentStudent.score = calc.finalPercentage !== null ? calc.finalPercentage : currentStudent.score;
      currentStudent.weightedTotal = calc.finalPercentage;
    } else {
      const cellRaw = row[3];
      if (cellRaw !== undefined && cellRaw !== null && String(cellRaw).trim() !== '') {
        const num = parseFloat(String(cellRaw).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          const maxSc = subject.maxScore || 100;
          const clamped = Math.max(0, Math.min(maxSc, num));
          const pct = Math.round((clamped / maxSc) * 100);
          currentStudent.score = clamped;
          currentStudent.weightedTotal = pct;
        }
      }
    }

    updatedEntriesMap.set(match.studentId, currentStudent);
    syncedCount++;
  });

  const finalUpdatedEntries = existingEntries.map((e) => updatedEntriesMap.get(e.studentId) || e);

  return {
    updatedEntries: finalUpdatedEntries,
    syncedCount,
  };
}
