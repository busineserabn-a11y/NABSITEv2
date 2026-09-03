import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  FileCheck2,
  Calendar,
  Layers,
  BookOpen,
  Users,
  Search,
  ChevronRight,
  ExternalLink,
  Globe,
  Building2,
  Sparkles,
  RefreshCw,
  CalendarCheck,
  Megaphone,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Company,
  AcademicYear,
  Grade,
  Section,
  Subject,
  Student,
  SchoolDashboardStats,
} from '../../types';
import { SchoolDashboardView } from '../../components/school/SchoolDashboardView';
import { SchoolMarklistView } from '../../components/school/SchoolMarklistView';
import { SchoolAcademicYearsView } from '../../components/school/SchoolAcademicYearsView';
import { SchoolGradesSectionsView } from '../../components/school/SchoolGradesSectionsView';
import { SchoolSubjectsView } from '../../components/school/SchoolSubjectsView';
import { SchoolStudentsView } from '../../components/school/SchoolStudentsView';
import { SchoolAttendanceView } from '../../components/school/SchoolAttendanceView';
import { SchoolTeachersView } from '../../components/school/SchoolTeachersView';
import { SchoolAnnouncementsView } from '../../components/school/SchoolAnnouncementsView';
import { SchoolGlobalSearchView } from '../../components/school/SchoolGlobalSearchView';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

type AcademicTab =
  | 'dashboard'
  | 'marklist'
  | 'academic-years'
  | 'grades'
  | 'subjects'
  | 'students'
  | 'attendance'
  | 'teachers'
  | 'announcements'
  | 'search';

export const SchoolAcademicHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);

  // Tab initialization from URL query parameter
  const tabFromUrl = searchParams.get('tab') as AcademicTab | null;
  const validTabs: AcademicTab[] = [
    'dashboard',
    'marklist',
    'academic-years',
    'grades',
    'subjects',
    'students',
    'attendance',
    'teachers',
    'announcements',
    'search',
  ];
  const initialTab: AcademicTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'dashboard';

  const [activeTab, setActiveTab] = useState<AcademicTab>(initialTab);

  // Update URL search params whenever activeTab changes
  const handleTabChange = (tab: AcademicTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Sync if URL param changes externally
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Academic Entities
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<SchoolDashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Target selection for Marklist quick-jump
  const [marklistInitialSelection, setMarklistInitialSelection] = useState<{
    academicYearId?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
  }>({});

  const loadSchoolData = useCallback(async (comp: Company) => {
    try {
      const [ayList, gList, secList, subList, stuList, dashStats] = await Promise.all([
        api.getAcademicYears(comp.id),
        api.getGrades(comp.id),
        api.getSections(comp.id),
        api.getSubjects(comp.id),
        api.getStudents(comp.id),
        api.getSchoolDashboardStats(comp.id),
      ]);

      setAcademicYears(ayList);
      setGrades(gList);
      setSections(secList);
      setSubjects(subList);
      setStudents(stuList);
      setStats(dashStats);
    } catch (err) {
      console.error('Failed to load school academic data:', err);
    }
  }, []);

  const init = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const comp = await api.getCompany(id);
      setCompany(comp);
      await loadSchoolData(comp);
    } catch (err) {
      console.error('Failed to load company info:', err);
    } finally {
      setLoading(false);
    }
  }, [id, loadSchoolData]);

  useEffect(() => {
    init();
  }, [init]);

  const handleRefresh = async () => {
    if (!company) return;
    setRefreshing(true);
    await loadSchoolData(company);
    setRefreshing(false);
  };

  const handleOpenMarklistForSection = (gradeId: string, sectionId: string) => {
    setMarklistInitialSelection((prev) => ({ ...prev, gradeId, sectionId }));
    handleTabChange('marklist');
  };

  const handleOpenMarklistForSubject = (subjectId: string) => {
    setMarklistInitialSelection((prev) => ({ ...prev, subjectId }));
    handleTabChange('marklist');
  };

  if (loading || !company) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Loading Academic Management Workstation...</p>
      </div>
    );
  }

  // Strict Tenant & Sub-Admin Isolation Check
  const isGaraGuriSchool =
    company.id === 'comp_gara_guri' ||
    company.slug === 'gara-guri-school' ||
    company.name.toLowerCase().includes('gara guri');

  if (user && user.role === 'SUB_ADMIN') {
    const isAssigned =
      user.assignedCompanyId === company.id ||
      user.assignedCompanyIds?.includes(company.id);

    if (!isAssigned || !isGaraGuriSchool) {
      return (
        <div className="max-w-2xl mx-auto py-16 px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-8 text-center space-y-5 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Academic Hub Access Restricted
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-lg mx-auto">
                The School Academic Hub is reserved exclusively for authenticated <strong>SUB_ADMIN</strong> staff assigned to <strong>Gara Guri Secondary School</strong>.
              </p>
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1">
                <p><span className="font-bold text-slate-500">Your User ID:</span> <span className="font-mono">{user.id}</span></p>
                <p><span className="font-bold text-slate-500">Your Role:</span> <span className="font-mono">{user.role}</span></p>
                <p><span className="font-bold text-slate-500">Assigned Company:</span> <span className="font-mono">{user.assignedCompanyId || 'None'}</span></p>
                <p><span className="font-bold text-slate-500">Requested Hub:</span> <span className="font-mono">{company.name} ({company.id})</span></p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link to={user.assignedCompanyId ? `/company/${user.assignedCompanyId}` : '/login'}>
                <Button variant="primary" icon={ArrowLeft}>
                  Return to My Assigned Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const activeAcademicYear = academicYears.find((y) => y.isActive) || academicYears[0];

  return (
    <div className="space-y-6">
      {/* 1. Header with School Branding & Quick Links */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {company.name}
              </h1>
              <Badge variant="info" size="sm">
                Academic Hub
              </Badge>
              {activeAcademicYear && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {activeAcademicYear.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {company.category} • /{company.slug} • Ethiopian & General Curriculum Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={refreshing}
            onClick={handleRefresh}
            title="Reload Academic Data from Database"
          >
            Refresh
          </Button>
          <Link to={`/company/${company.id}`}>
            <Button size="sm" variant="outline" icon={Building2}>
              Business Hub
            </Button>
          </Link>
          <Link to={`/studio/${company.id}`}>
            <Button size="sm" variant="primary" icon={Globe}>
              Website Studio
            </Button>
          </Link>
          <Link to={`/c/${company.slug}`} target="_blank">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              View Live Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleTabChange('marklist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'marklist'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Marklist Sheet (2.0)</span>
        </button>

        <button
          onClick={() => handleTabChange('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students Roster ({students.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Class Attendance</span>
        </button>

        <button
          onClick={() => handleTabChange('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'teachers'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Staff & Teachers</span>
        </button>

        <button
          onClick={() => handleTabChange('announcements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Notice Board</span>
        </button>

        <button
          onClick={() => handleTabChange('academic-years')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'academic-years'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Year ({academicYears.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'grades'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Grades & Sections ({grades.length}G / {sections.length}S)</span>
        </button>

        <button
          onClick={() => handleTabChange('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('search')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'search'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Global Search</span>
        </button>
      </div>

      {/* 3. Active Tab View Render */}
      <div className="pt-2">
        {activeTab === 'dashboard' && (
          <SchoolDashboardView
            company={company}
            stats={stats}
            loading={loading}
            onNavigateTab={(tab) => handleTabChange(tab)}
          />
        )}

        {activeTab === 'marklist' && (
          <SchoolMarklistView
            company={company}
            academicYears={academicYears}
            grades={grades}
            sections={sections}
            subjects={subjects}
            initialSelection={marklistInitialSelection}
          />
        )}

        {activeTab === 'students' && (
          <SchoolStudentsView
            company={company}
            students={students}
            grades={grades}
            sections={sections}
            academicYears={academicYears}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'attendance' && (
          <SchoolAttendanceView
            company={company}
            grades={grades}
            sections={sections}
            students={students}
            academicYears={academicYears}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'teachers' && (
          <SchoolTeachersView
            company={company}
            subjects={subjects}
            grades={grades}
            sections={sections}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'announcements' && (
          <SchoolAnnouncementsView
            company={company}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'academic-years' && (
          <SchoolAcademicYearsView
            company={company}
            academicYears={academicYears}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'grades' && (
          <SchoolGradesSectionsView
            company={company}
            grades={grades}
            sections={sections}
            students={students}
            onRefresh={handleRefresh}
            onOpenMarklistForSection={handleOpenMarklistForSection}
          />
        )}

        {activeTab === 'subjects' && (
          <SchoolSubjectsView
            company={company}
            subjects={subjects}
            grades={grades}
            onRefresh={handleRefresh}
            onOpenMarklistForSubject={handleOpenMarklistForSubject}
          />
        )}

        {activeTab === 'search' && (
          <SchoolGlobalSearchView
            company={company}
            onNavigateTab={(tab) => handleTabChange(tab)}
          />
        )}
      </div>
    </div>
  );
};

