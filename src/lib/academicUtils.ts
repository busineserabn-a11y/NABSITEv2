import { AssessmentComponent, AssessmentBreakdown, Subject } from '../types';

/**
 * Calculates student achievement percentage for a single assessment:
 * achievement % = (score / maxScore) * 100
 */
export function calculateAchievement(score: number | null | undefined, maxScore: number): number | null {
  if (score === null || score === undefined || isNaN(score) || maxScore <= 0) return null;
  const clamped = Math.max(0, Math.min(score, maxScore));
  return Number(((clamped / maxScore) * 100).toFixed(2));
}

/**
 * Calculates weighted contribution towards the subject's final 100%:
 * contribution % = (score / maxScore) * weight %
 * Example: Score 40/50 (80%), Weight 20% -> 16.0% contribution
 */
export function calculateContribution(
  score: number | null | undefined,
  maxScore: number,
  weight: number
): number | null {
  if (score === null || score === undefined || isNaN(score) || maxScore <= 0 || weight <= 0) return null;
  const clamped = Math.max(0, Math.min(score, maxScore));
  const achievement = clamped / maxScore;
  return Number((achievement * weight).toFixed(2));
}

/**
 * Computes full breakdown and final subject result for a student given their component scores and subject assessment components
 */
export function computeStudentSubjectResult(
  componentScores: Record<string, number | null | undefined> | undefined,
  componentsOrSubject?: AssessmentComponent[] | Subject | null,
  directScore?: number | null
): {
  finalResult: number | null;
  finalPercentage: number | null;
  breakdowns: AssessmentBreakdown[];
  hasAnyScore: boolean;
  isComplete: boolean;
  letterGrade: string;
  gradeLetter: string;
} {
  const components: AssessmentComponent[] = Array.isArray(componentsOrSubject)
    ? componentsOrSubject
    : (componentsOrSubject as Subject)?.assessmentComponents || [];

  if (!components || components.length === 0) {
    const s = directScore !== undefined && directScore !== null ? Number(directScore) : null;
    const lGrade = getLetterGrade(s);
    return {
      finalResult: s,
      finalPercentage: s,
      breakdowns: [],
      hasAnyScore: s !== null,
      isComplete: s !== null,
      letterGrade: lGrade,
      gradeLetter: lGrade,
    };
  }

  let totalContribution = 0;
  let hasAnyScore = false;
  let enteredComponentsCount = 0;

  const breakdowns: AssessmentBreakdown[] = components.map((comp) => {
    const raw = componentScores ? componentScores[comp.id] : undefined;
    const score = raw !== undefined && raw !== null ? Number(raw) : null;

    if (score !== null && !isNaN(score)) {
      hasAnyScore = true;
      enteredComponentsCount++;
      const achievement = calculateAchievement(score, comp.maxScore);
      const contribution = calculateContribution(score, comp.maxScore, comp.weight);
      if (contribution !== null) {
        totalContribution += contribution;
      }
      return {
        componentId: comp.id,
        componentName: comp.name,
        score,
        maxScore: comp.maxScore,
        achievementPercentage: achievement,
        weight: comp.weight,
        weightedContribution: contribution,
      };
    }

    return {
      componentId: comp.id,
      componentName: comp.name,
      score: null,
      maxScore: comp.maxScore,
      achievementPercentage: null,
      weight: comp.weight,
      weightedContribution: null,
    };
  });

  const finalResult = hasAnyScore ? Number(totalContribution.toFixed(2)) : null;
  const isComplete = enteredComponentsCount === components.length && components.length > 0;
  const lGrade = getLetterGrade(finalResult);

  return {
    finalResult,
    finalPercentage: finalResult,
    breakdowns,
    hasAnyScore,
    isComplete,
    letterGrade: lGrade,
    gradeLetter: lGrade,
  };
}

/**
 * Returns letter grade scale
 */
export function getLetterGrade(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined || isNaN(percentage)) return '—';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * Validates whether sum of assessment components equals exactly 100%
 */
export function validateAssessmentComponentsTotal(components: AssessmentComponent[]): {
  total: number;
  isValid: boolean;
  remaining: number;
  message: string;
} {
  const total = components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const roundedTotal = Number(total.toFixed(2));
  const remaining = Number((100 - roundedTotal).toFixed(2));

  if (roundedTotal === 100) {
    return {
      total: 100,
      isValid: true,
      remaining: 0,
      message: 'Valid 100% assessment structure.',
    };
  }

  if (roundedTotal < 100) {
    return {
      total: roundedTotal,
      isValid: false,
      remaining,
      message: `${remaining}% remaining to reach 100%.`,
    };
  }

  return {
    total: roundedTotal,
    isValid: false,
    remaining,
    message: `Total ${roundedTotal}% exceeds 100% by ${Math.abs(remaining)}%.`,
  };
}

/**
 * Parses tab/newline separated spreadsheet text into a 2D matrix of numbers or nulls
 */
export function parseSpreadsheetPastedText(pastedText: string): Array<Array<string>> {
  if (!pastedText) return [];
  // Normalize newlines and clean quotes
  const lines = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  // Filter trailing empty line often added by clipboard
  const nonEmptyLines = lines.filter((line, idx) => idx < lines.length - 1 || line.trim() !== '');

  return nonEmptyLines.map((line) => {
    // If line contains tabs, split by tab; otherwise split by comma or whitespace if single values
    if (line.includes('\t')) {
      return line.split('\t').map((cell) => cell.trim());
    }
    if (line.includes(',')) {
      return line.split(',').map((cell) => cell.trim());
    }
    return [line.trim()];
  });
}
