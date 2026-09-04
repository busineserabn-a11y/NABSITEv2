import { CompanyCreationRow, createEmptyCompanyRow } from '../types/companyCreation';
import { generateSlug } from './api';
import { BUSINESS_CATEGORIES } from '../data/themes';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_REGEX = /^[+0-9\s\-()]{6,25}$/;

export function validateCompanyRow(
  row: CompanyCreationRow,
  allRows: CompanyCreationRow[]
): { isValid: boolean; errors: Record<string, string>; warnings: string[] } {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // 1. Company Name is required
  if (!row.name || !row.name.trim()) {
    errors.name = 'Company Name is required.';
  } else if (row.name.trim().length < 2) {
    errors.name = 'Company Name must be at least 2 characters.';
  }

  // 2. Slug check
  const slug = row.slug ? row.slug.trim().toLowerCase() : generateSlug(row.name || '');
  if (!slug) {
    errors.slug = 'Valid URL slug is required.';
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens.';
  } else {
    // Check uniqueness across the working batch
    const duplicateSlug = allRows.find(
      (r) => r.tempId !== row.tempId && (r.slug || generateSlug(r.name || '')).trim().toLowerCase() === slug
    );
    if (duplicateSlug) {
      errors.slug = `Slug "${slug}" is duplicated in another row. Slugs must be unique.`;
    }
  }

  // 3. Category validation
  if (!row.category || !row.category.trim()) {
    errors.category = 'Category is required.';
  }

  // 4. Email format check
  if (row.email && row.email.trim() && !EMAIL_REGEX.test(row.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (row.contactEmail && row.contactEmail.trim() && !EMAIL_REGEX.test(row.contactEmail.trim())) {
    errors.contactEmail = 'Contact email format is invalid.';
  }

  // 5. Phone format check (warning or error)
  if (row.phone && row.phone.trim() && !PHONE_CHARS_REGEX.test(row.phone.trim())) {
    warnings.push('Phone number format appears unusual. Recommended: +251 911 000 000');
  }

  // 6. Address recommendation
  if (!row.address || !row.address.trim()) {
    warnings.push('Physical address is blank; will use default city location.');
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Parses tab-separated text (from Excel, Google Sheets, or Numbers clipboard)
 * and populates company creation rows.
 */
export function parseSpreadsheetPaste(
  rawText: string,
  startRowIndex: number,
  existingRows: CompanyCreationRow[]
): CompanyCreationRow[] {
  const lines = rawText
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return existingRows;

  const newRows = [...existingRows];

  // Column order for standard sequential TSV paste
  // Name | Slug | Category | Phone | Email | Address | City | Short Description
  lines.forEach((line, offset) => {
    const cells = line.split('\t').map((c) => c.trim());
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) return;

    const targetIdx = startRowIndex + offset;
    let targetRow: CompanyCreationRow;

    if (targetIdx < newRows.length) {
      targetRow = { ...newRows[targetIdx] };
    } else {
      targetRow = createEmptyCompanyRow(targetIdx + 1);
    }

    // Populate columns
    if (cells[0]) {
      targetRow.name = cells[0];
      if (!targetRow.slug) targetRow.slug = generateSlug(cells[0]);
    }
    if (cells[1]) {
      // If second cell looks like a slug
      if (/^[a-z0-9-]+$/i.test(cells[1])) {
        targetRow.slug = cells[1].toLowerCase();
      } else if (BUSINESS_CATEGORIES.some((cat) => cat.toLowerCase() === cells[1].toLowerCase())) {
        targetRow.category = cells[1];
      }
    }
    if (cells[2]) {
      if (BUSINESS_CATEGORIES.some((cat) => cat.toLowerCase() === cells[2].toLowerCase())) {
        targetRow.category = cells[2];
      } else if (!targetRow.phone && /^[+0-9\s\-()]+$/.test(cells[2])) {
        targetRow.phone = cells[2];
      }
    }
    if (cells[3]) {
      if (/^[+0-9\s\-()]+$/.test(cells[3])) {
        targetRow.phone = cells[3];
      } else if (cells[3].includes('@')) {
        targetRow.email = cells[3];
      }
    }
    if (cells[4]) {
      if (cells[4].includes('@')) {
        targetRow.email = cells[4];
      } else if (!targetRow.city) {
        targetRow.city = cells[4];
      }
    }
    if (cells[5]) targetRow.address = cells[5];
    if (cells[6]) targetRow.city = cells[6];
    if (cells[7]) targetRow.shortDescription = cells[7];

    const validation = validateCompanyRow(targetRow, newRows);
    targetRow.isValid = validation.isValid;
    targetRow.errors = validation.errors;
    targetRow.warnings = validation.warnings;

    if (targetIdx < newRows.length) {
      newRows[targetIdx] = targetRow;
    } else {
      newRows.push(targetRow);
    }
  });

  return newRows;
}
