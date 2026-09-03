import React from 'react';
import {
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Sparkles,
  Plus,
  CalendarCheck,
  Megaphone,
} from 'lucide-react';
import { SchoolDashboardStats, AcademicYear, Company } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolDashboardViewProps {
  company: Company;
  stats: SchoolDashboardStats | null;
  loading: boolean;
  onNavigateTab: (tab: 'dashboard' | 'marklist' | 'academic-years' | 'grades' | 'subjects' | 'students' | 'teachers' | 'attendance' | 'announcements' | 'search') => void;
  onSelectMarklistForEdit?: (gradeId: string, sectionId: string, subjectId: string, academicYearId: string) => void;
}

export const SchoolDashboardView: React.FC<SchoolDashboardViewProps> = ({
  company,
  stats,
  loading,
  onNavigateTab,
}) => {
  if (loading || !stats) {
    return (
      <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading Academic Dashboard & Statistics...</p>
      </div>
    );
  }

  const activeYear = stats.activeAcademicYear;

  return (
    <div className="space-y-8">
      {/* Top Welcome / Academic Year Alert Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Operations Hub
              </span>
              {activeYear && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Year: {activeYear.name} ({activeYear.calendarType === 'ETHIOPIAN' ? 'Ethiopian Calendar' : 'Gregorian Calendar'})
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {company.name} Academic Management
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Centralized administration for academic years, curriculum grades, sections, subject catalogues, and real-time student evaluation marklists.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="md"
              icon={FileCheck2}
              onClick={() => onNavigateTab('marklist')}
              className="shadow-sm"
            >
              Open Marklist Sheet
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={Users}
              onClick={() => onNavigateTab('students')}
              className="bg-slate-800/80 text-slate-200 border-slate-600 hover:bg-slate-700"
            >
              Students Roster
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigateTab('academic-years')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Year</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {activeYear ? activeYear.name : 'Not Configured'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeYear?.calendarType === 'ETHIOPIAN' ? 'Ethiopian' : 'Gregorian'}
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('grades')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Classes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.gradesCount}G <span className="text-xs font-normal text-slate-500">/ {stats.sectionsCount}S</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Grades & Secs</p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('subjects')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Courses</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.subjectsCount}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Active Subjects</p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.studentsCount}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled Roster</p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('teachers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faculty</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.teachersCount || 5}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Active Teachers</p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.attendanceTodayCount || 0}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Marked Today</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Marklists & Academic Quick Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Evaluated Marklists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-500" />
                Saved Marklists & Evaluations
              </h3>
              <p className="text-xs text-slate-500">Direct access to grade sheets recorded in the database</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => onNavigateTab('marklist')}
            >
              Enter New Marklist
            </Button>
          </div>

          {stats.recentMarklists && stats.recentMarklists.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMarklists.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab('marklist')}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                      {item.gradeName.replace('Grade ', 'G')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                          {item.subjectName}
                        </h4>
                        <Badge variant="info" size="sm">
                          {item.gradeName} • {item.sectionName}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Academic Year: {item.academicYearName} • Last modified {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.filledCount} / {item.totalCount} Evaluated
                      </span>
                      <div className="w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${item.totalCount > 0 ? (item.filledCount / item.totalCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card variant="bordered" padding="lg" className="text-center py-10 space-y-3">
              <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Marklists Saved Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Start entering subject evaluation marks by selecting an Academic Year, Grade, Section, and Subject.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => onNavigateTab('marklist')}
              >
                Create First Marklist
              </Button>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Quick Feature Navigation & Core Structure */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Academic Engine Navigation
            </h3>
            <p className="text-xs text-slate-500">Direct shortcuts to maintain school entities</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('academic-years')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600">
                    Academic Year Setup
                  </h4>
                  <p className="text-xs text-slate-500">Ethiopian & Gregorian calendars, active toggles</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('grades')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Grades & Sections
                  </h4>
                  <p className="text-xs text-slate-500">Class levels, sections, rooms & student capacity</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('subjects')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600">
                    Subjects Catalogue
                  </h4>
                  <p className="text-xs text-slate-500">Subject codes, max scores, grade associations</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('students')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
                    Students Directory
                  </h4>
                  <p className="text-xs text-slate-500">Unique student IDs, section rosters & profiles</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                    Daily Attendance Register
                  </h4>
                  <p className="text-xs text-slate-500">Record present, absent, tardy and excuses</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('teachers')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600">
                    Staff & Teacher Directory
                  </h4>
                  <p className="text-xs text-slate-500">Departments, instructor profiles & courses</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('announcements')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600">
                    Notice Board & Circulars
                  </h4>
                  <p className="text-xs text-slate-500">Broadcast official school communications</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('search')}
              className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    Academic Global Search
                  </h4>
                  <p className="text-xs text-slate-500">Instant lookup across students, grades, subjects</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
