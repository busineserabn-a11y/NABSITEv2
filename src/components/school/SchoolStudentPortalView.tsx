import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Layers,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Hash,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Company, Student, Grade, Section, AcademicYear, Subject, Marklist, StudentScore } from '../../types';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { computeStudentSubjectResult } from '../../lib/academicUtils';

interface SchoolStudentPortalViewProps {
  company: Company;
  onNavigatePage?: (slug: string) => void;
}

export const SchoolStudentPortalView: React.FC<SchoolStudentPortalViewProps> = ({
  company,
  onNavigatePage,
}) => {
  // Input fields for dual-factor verification
  const [fullName, setFullName] = useState('');
  const [fanNumber, setFanNumber] = useState('');

  // Lookup state
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<{
    student: Student;
    grade: Grade | null;
    section: Section | null;
    academicYear: AcademicYear | null;
    report: Array<{
      subject: Subject;
      marklist: Marklist | null;
      entry: StudentScore | null;
      finalScore: number | null;
      weightedTotal: number | null;
    }>;
  } | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter the student\'s full registered name.');
      return;
    }
    if (!fanNumber.trim()) {
      setErrorMessage('Please enter the student\'s FAN or Unique ID Number.');
      return;
    }

    setSearching(true);
    setErrorMessage(null);

    try {
      // 1. Dual verification lookup
      const authResult = await api.verifyStudentForPortal(company.id, fullName, fanNumber);

      if (!authResult) {
        setErrorMessage(
          'No matching student record found. Please verify that the Full Name and FAN Number match the exact official school admission records.'
        );
        setVerifiedData(null);
        setSearching(false);
        return;
      }

      // 2. Fetch full academic report for this specific student only
      const report = await api.getStudentAcademicReport(company.id, authResult.student.id);

      setVerifiedData({
        student: authResult.student,
        grade: authResult.grade,
        section: authResult.section,
        academicYear: authResult.academicYear,
        report,
      });
    } catch (err: any) {
      console.error('Lookup error:', err);
      setErrorMessage(
        'An error occurred while verifying the student record. Please check your connection and try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setVerifiedData(null);
    setFullName('');
    setFanNumber('');
    setErrorMessage(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper letter grade
  const getLetterGrade = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (score >= 90) return { label: 'A+ (Excellent)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    if (score >= 80) return { label: 'A (Very Good)', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' };
    if (score >= 70) return { label: 'B (Good)', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' };
    if (score >= 60) return { label: 'C (Satisfactory)', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    if (score >= 50) return { label: 'D (Passing)', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' };
    return { label: 'F (Needs Improvement)', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' };
  };

  // Compute overall performance stats
  const evaluatedSubjects = verifiedData?.report.filter(
    (r) => r.finalScore !== null && r.finalScore !== undefined
  ) || [];

  const overallAverage =
    evaluatedSubjects.length > 0
      ? (
          evaluatedSubjects.reduce((acc, curr) => acc + (curr.finalScore || 0), 0) /
          evaluatedSubjects.length
        ).toFixed(1)
      : null;

  const passedSubjectsCount = evaluatedSubjects.filter((r) => (r.finalScore || 0) >= 50).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
          <GraduationCap className="w-4 h-4" />
          <span>{company.name} • Official Student Academic Portal</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Student Academic Record Lookup
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Verify individual curriculum marks, continuous assessment weights, and term evaluations securely using the student's registered Name and FAN Number.
        </p>
      </div>

      {!verifiedData ? (
        /* 1. Verification Lookup Form */
        <div className="max-w-xl mx-auto">
          <Card variant="bordered" className="p-6 sm:p-8 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <form onSubmit={handleLookup} className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Protected Dual-Factor Verification</span>
              </div>

              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Record Verification Failed</p>
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    1. Student Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the exact full name as listed on the school registration roster.
                  </p>
                </div>

                {/* 2. FAN Number / Unique ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    2. FAN (Fixed Academic Number) / Student ID *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. FAN-2024-001 or ADM/2024/001"
                      value={fanNumber}
                      onChange={(e) => setFanNumber(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your unique student identifier found on your admission slip or grade card.
                  </p>
                </div>
              </div>

              {/* Sample Hint Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <span className="font-bold">Privacy Guarantee:</span> Student marks and personal profiles are strictly private. The system requires both matching fields before displaying any academic evaluations.
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={Search}
                isLoading={searching}
                className="w-full shadow-lg"
              >
                Lookup Academic Record
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        /* 2. Verified Student Academic Report */
        <div className="space-y-6">
          {/* Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Verified Student Identity
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Record authenticated successfully
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={handlePrint}
                className="text-xs"
              >
                Print Slip
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={handleReset}
                className="text-xs"
              >
                Lookup Another Student
              </Button>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-2xl border border-amber-500/20">
                  {verifiedData.student.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {verifiedData.student.fullName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                      FAN: {verifiedData.student.admissionNo || verifiedData.student.id}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{verifiedData.student.gender || 'Student'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Grade & Stream</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {verifiedData.grade?.name || 'Grade'} • {verifiedData.section?.name || 'Section'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Academic Year</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {verifiedData.academicYear?.name || 'Current Year'}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Overall Average
                </span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {overallAverage !== null ? `${overallAverage}%` : '—'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Subjects Evaluated
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {evaluatedSubjects.length} <span className="text-xs font-normal text-slate-400">/ {verifiedData.report.length}</span>
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Passed Courses
                </span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {passedSubjectsCount}
                </p>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  Academic Status
                </span>
                <p className="text-base font-extrabold text-sky-700 dark:text-sky-300 mt-1">
                  {overallAverage !== null && Number(overallAverage) >= 50 ? 'Good Standing' : 'In Progress'}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Subject Evaluation Table */}
          <Card variant="bordered" padding="none" className="overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Curriculum Course Evaluations & Weighted Assessment Marks
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                100% Standard Scale
              </span>
            </div>

            {verifiedData.report.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No subjects assigned to this grade level yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[160px]">Subject / Course</th>
                      <th className="py-3 px-4 min-w-[220px]">Continuous Assessment Breakdown</th>
                      <th className="py-3 px-4 text-center w-28 bg-emerald-50/40 dark:bg-emerald-950/20">
                        Weighted Total (100%)
                      </th>
                      <th className="py-3 px-4 w-36 text-center">Grade & Standing</th>
                      <th className="py-3 px-4 min-w-[140px]">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {verifiedData.report.map((item, idx) => {
                      const components = item.subject.assessmentComponents || [];
                      const breakdown = computeStudentSubjectResult(
                        item.entry?.componentScores || {},
                        item.subject
                      );

                      const finalScore =
                        components.length > 0
                          ? breakdown.finalPercentage
                          : item.entry?.score;

                      const letter = getLetterGrade(finalScore);

                      return (
                        <tr
                          key={item.subject.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                            {idx + 1}
                          </td>

                          {/* Subject Name & Code */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {item.subject.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {item.subject.code || 'CODE'} • Max: {item.subject.maxScore || 100}
                            </div>
                          </td>

                          {/* Assessment Breakdown */}
                          <td className="py-3.5 px-4">
                            {components.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {components.map((comp) => {
                                  const compScore = item.entry?.componentScores?.[comp.id];
                                  return (
                                    <div
                                      key={comp.id}
                                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]"
                                    >
                                      <span className="text-slate-500 font-medium">{comp.name} ({comp.weight}%): </span>
                                      <span className="font-bold text-slate-900 dark:text-white ml-1">
                                        {compScore !== null && compScore !== undefined ? `${compScore}/${comp.maxScore}` : '—'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                Single Exam Evaluation (Score: {item.entry?.score !== null && item.entry?.score !== undefined ? `${item.entry.score}/${item.subject.maxScore || 100}` : 'Pending'})
                              </span>
                            )}
                          </td>

                          {/* Weighted Total */}
                          <td className="py-3.5 px-4 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                            {finalScore !== null && finalScore !== undefined ? (
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                {finalScore}%
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Pending</span>
                            )}
                          </td>

                          {/* Grade Standing */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${letter.bg} ${letter.color}`}>
                              {breakdown.gradeLetter || letter.label}
                            </span>
                          </td>

                          {/* Teacher Remarks */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                            {item.entry?.notes ? (
                              <span>{item.entry.notes}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Signature Footer for Print */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Issuing Institution</p>
                <p className="mt-1">{company.name}</p>
                <p className="text-[10px] text-slate-400">Official Student Record Verification</p>
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Verification Seal</p>
                <p className="mt-1 font-mono text-[11px]">FAN AUTHENTICATED</p>
                <p className="text-[10px] text-emerald-600 font-bold">✓ Dual-Factor Matched</p>
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Date Generated</p>
                <p className="mt-1">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-[10px] text-slate-400">NABSITE Managed Portal</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
