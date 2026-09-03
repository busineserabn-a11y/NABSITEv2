import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Save,
  Check,
  RotateCcw,
  Search,
  Filter,
  History,
  Users,
  AlertCircle,
  Download,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Company,
  Grade,
  Section,
  Student,
  AcademicYear,
  AttendanceSession,
  StudentAttendanceEntry,
  AttendanceStatus,
} from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolAttendanceViewProps {
  company: Company;
  grades: Grade[];
  sections: Section[];
  students: Student[];
  academicYears: AcademicYear[];
  onRefresh?: () => void;
}

export const SchoolAttendanceView: React.FC<SchoolAttendanceViewProps> = ({
  company,
  grades,
  sections,
  students,
  academicYears,
  onRefresh,
}) => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [activeYearId, setActiveYearId] = useState<string>('');

  // Attendance Records State for the active session
  const [attendanceEntries, setAttendanceEntries] = useState<Record<string, { status: AttendanceStatus; remark: string }>>({});
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Historical Attendance Log state
  const [viewMode, setViewMode] = useState<'entry' | 'history'>('entry');
  const [historySessions, setHistorySessions] = useState<AttendanceSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Initialize grade and section defaults
  useEffect(() => {
    const activeY = academicYears.find((y) => y.isActive) || academicYears[0];
    if (activeY && !activeYearId) {
      setActiveYearId(activeY.id);
    }

    if (grades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(grades[0].id);
    }
  }, [grades, academicYears, activeYearId, selectedGradeId]);

  // When grade changes, choose the first section of that grade
  useEffect(() => {
    if (selectedGradeId) {
      const availSections = sections.filter((s) => s.gradeId === selectedGradeId);
      if (availSections.length > 0) {
        if (!selectedSectionId || !availSections.some((s) => s.id === selectedSectionId)) {
          setSelectedSectionId(availSections[0].id);
        }
      } else {
        setSelectedSectionId('');
      }
    }
  }, [selectedGradeId, sections, selectedSectionId]);

  // Filter students belonging to this grade and section
  const sectionStudents = useMemo(() => {
    return students.filter(
      (s) => s.gradeId === selectedGradeId && s.sectionId === selectedSectionId
    );
  }, [students, selectedGradeId, selectedSectionId]);

  // Load existing attendance session if already saved for this date & section
  useEffect(() => {
    if (!company.id || !selectedGradeId || !selectedSectionId || !selectedDate) return;

    let isMounted = true;
    const fetchExistingSession = async () => {
      setLoadingSession(true);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
      try {
        const session = await api.getAttendanceSession(
          company.id,
          selectedGradeId,
          selectedSectionId,
          selectedDate
        );

        if (!isMounted) return;

        if (session && session.records && session.records.length > 0) {
          const map: Record<string, { status: AttendanceStatus; remark: string }> = {};
          session.records.forEach((rec) => {
            map[rec.studentId] = {
              status: rec.status,
              remark: rec.remark || '',
            };
          });
          setAttendanceEntries(map);
        } else {
          // Default all students to present if first time opening
          const initialMap: Record<string, { status: AttendanceStatus; remark: string }> = {};
          sectionStudents.forEach((stu) => {
            initialMap[stu.id] = { status: 'present', remark: '' };
          });
          setAttendanceEntries(initialMap);
        }
      } catch (err) {
        console.error('Error fetching attendance session:', err);
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    };

    fetchExistingSession();

    return () => {
      isMounted = false;
    };
  }, [company.id, selectedGradeId, selectedSectionId, selectedDate, sectionStudents]);

  // Fetch History Sessions when tab is active
  useEffect(() => {
    if (viewMode === 'history' && company.id) {
      setLoadingHistory(true);
      api.getAttendanceHistory(company.id, selectedGradeId || undefined, selectedSectionId || undefined)
        .then((sessions) => setHistorySessions(sessions))
        .catch((err) => console.error('Failed to load attendance history', err))
        .finally(() => setLoadingHistory(false));
    }
  }, [viewMode, company.id, selectedGradeId, selectedSectionId]);

  // Compute status metrics
  const totalCount = sectionStudents.length;
  const presentCount = sectionStudents.filter(
    (s) => (attendanceEntries[s.id]?.status || 'present') === 'present'
  ).length;
  const absentCount = sectionStudents.filter(
    (s) => attendanceEntries[s.id]?.status === 'absent'
  ).length;
  const lateCount = sectionStudents.filter(
    (s) => attendanceEntries[s.id]?.status === 'late'
  ).length;
  const excusedCount = sectionStudents.filter(
    (s) => attendanceEntries[s.id]?.status === 'excused'
  ).length;

  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  // Single student status toggle
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remark: prev[studentId]?.remark || '',
      },
    }));
  };

  // Remark change
  const handleRemarkChange = (studentId: string, remark: string) => {
    setAttendanceEntries((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        remark,
      },
    }));
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remark: string }> = {};
    sectionStudents.forEach((stu) => {
      updated[stu.id] = {
        status,
        remark: attendanceEntries[stu.id]?.remark || '',
      };
    });
    setAttendanceEntries(updated);
  };

  // Save session to Firestore
  const handleSaveAttendance = async () => {
    if (!selectedGradeId || !selectedSectionId || !selectedDate) {
      setSaveErrorMsg('Please select a valid grade, section, and date.');
      return;
    }

    setSavingSession(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const records: StudentAttendanceEntry[] = sectionStudents.map((stu) => ({
      studentId: stu.id,
      studentName: stu.fullName,
      admissionNo: stu.admissionNo,
      status: attendanceEntries[stu.id]?.status || 'present',
      remark: attendanceEntries[stu.id]?.remark || '',
    }));

    const sessionPayload: AttendanceSession = {
      id: `att_${company.id}_${selectedGradeId}_${selectedSectionId}_${selectedDate}`,
      companyId: company.id,
      academicYearId: activeYearId,
      gradeId: selectedGradeId,
      sectionId: selectedSectionId,
      date: selectedDate,
      records,
      totalStudents: totalCount,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await api.saveAttendanceSession(sessionPayload);
      setSaveSuccessMsg(`Attendance saved successfully for ${selectedDate}! (${presentCount}/${totalCount} Present)`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save attendance record to Firestore.');
    } finally {
      setSavingSession(false);
    }
  };

  // Filtered student list for search
  const filteredStudents = sectionStudents.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGradeObj = grades.find((g) => g.id === selectedGradeId);
  const selectedSectionObj = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="space-y-6">
      {/* 1. Header & View Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Class Attendance Management
            </h2>
            <Badge variant="success" size="sm">
              Live Firestore Sync
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track daily classroom attendance, record tardiness or excused absences, and archive session records for Gara Guri Secondary School.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('entry')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              viewMode === 'entry'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Attendance Register
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historical Logs
          </button>
        </div>
      </div>

      {viewMode === 'entry' ? (
        <>
          {/* 2. Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Grade Level
                </label>
                <select
                  value={selectedGradeId}
                  onChange={(e) => setSelectedGradeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Level {g.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Class Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  {sections
                    .filter((s) => s.gradeId === selectedGradeId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.room ? `• Room ${s.room}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Year
                </label>
                <select
                  value={activeYearId}
                  onChange={(e) => setActiveYearId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} {ay.isActive ? '★ Active' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Bulk Marking Actions & Save */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Quick Mark:</span>
                <Button
                  size="sm"
                  variant="outline"
                  icon={CheckCircle2}
                  onClick={() => handleMarkAll('present')}
                  className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={XCircle}
                  onClick={() => handleMarkAll('absent')}
                  className="text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  All Absent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => handleMarkAll('present')}
                  className="text-slate-600 dark:text-slate-400"
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="md"
                  variant="primary"
                  icon={Save}
                  isLoading={savingSession}
                  onClick={handleSaveAttendance}
                  className="shadow-sm font-bold"
                >
                  Save Attendance Session
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {saveErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* 3. Live Stats Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {totalCount}
              </p>
              <span className="text-[11px] text-slate-400">{selectedGradeObj?.name} - {selectedSectionObj?.name}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-950/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {presentCount}
              </p>
              <span className="text-[11px] text-slate-400">In Classroom</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-950/40 shadow-xs">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {absentCount}
              </p>
              <span className="text-[11px] text-slate-400">Unexcused</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-950/40 shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Late</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {lateCount}
              </p>
              <span className="text-[11px] text-slate-400">Tardy Arrival</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-sky-200 dark:border-sky-950/40 shadow-xs">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Excused</span>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
                {excusedCount}
              </p>
              <span className="text-[11px] text-slate-400">Official Permission</span>
            </div>
          </div>

          {/* 4. Student Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Student Register ({filteredStudents.length} Students)
                </span>
              </div>
              <div className="w-full sm:w-64 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter student or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden"
                />
              </div>
            </div>

            {loadingSession ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading classroom attendance register...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No students registered in this section.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use the Student Registration tab to enroll students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Full Student Name</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4 min-w-[280px]">Attendance Status</th>
                      <th className="py-3 px-4">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((student, idx) => {
                      const entry = attendanceEntries[student.id] || { status: 'present', remark: '' };
                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-200">
                            {student.admissionNo}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {student.fullName}
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-500 dark:text-slate-400">
                            {student.gender || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'present')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  entry.status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'absent')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  entry.status === 'absent'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'late')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  entry.status === 'late'
                                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Late
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetStatus(student.id, 'excused')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  entry.status === 'excused'
                                    ? 'bg-sky-500 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Excused
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={entry.remark}
                              placeholder="Reason / note..."
                              onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-hidden"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Historical Attendance Log */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Archived Attendance Sessions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited attendance logs recorded for Gara Guri Secondary School
              </p>
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Fetching attendance history...</span>
            </div>
          ) : historySessions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attendance sessions saved yet.</p>
              <p className="text-xs text-slate-400">Take attendance on the register tab and click "Save Attendance Session".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Present</th>
                    <th className="py-3 px-4">Absent</th>
                    <th className="py-3 px-4">Late</th>
                    <th className="py-3 px-4">Attendance Rate</th>
                    <th className="py-3 px-4">Last Saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historySessions.map((session) => {
                    const gradeName = grades.find((g) => g.id === session.gradeId)?.name || 'Grade';
                    const secName = sections.find((s) => s.id === session.sectionId)?.name || 'Section';
                    const rate = session.totalStudents > 0 ? Math.round((session.presentCount / session.totalStudents) * 100) : 0;
                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {session.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {gradeName} • {secName}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {session.totalStudents}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {session.presentCount}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                          {session.absentCount}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                          {session.lateCount}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            rate >= 90 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            rate >= 75 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
