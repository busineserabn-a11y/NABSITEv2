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
  HelpCircle,
  ArrowLeft,
  Copy,
  DoorOpen,
  Sliders,
  Settings2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../lib/permissions';
import {
  Company,
  AcademicYear,
  Grade,
  Section,
  Subject,
  Student,
  SchoolDashboardStats,
  SchoolFeatureKey,
  DEFAULT_SCHOOL_FEATURES,
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
import { SchoolDisciplineView } from '../../components/school/SchoolDisciplineView';
import { SchoolFaqView } from '../../components/school/SchoolFaqView';
import { SchoolFeaturesConfigView } from '../../components/school/SchoolFeaturesConfigView';
import { FeatureDisabledNotice } from '../../components/school/FeatureDisabledNotice';
import { DuplicateWebsiteModal } from '../../components/company/DuplicateWebsiteModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export type AcademicTab =
  | 'dashboard'
  | 'marklist'
  | 'academic-years'
  | 'grades'
  | 'sections'
  | 'subjects'
  | 'students'
  | 'discipline'
  | 'attendance'
  | 'teachers'
  | 'announcements'
  | 'faq'
  | 'search'
  | 'features';

export const SchoolAcademicHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  // Tab initialization from URL query parameter
  const tabFromUrl = searchParams.get('tab') as AcademicTab | null;
  const validTabs: AcademicTab[] = [
    'dashboard',
    'marklist',
    'academic-years',
    'grades',
    'sections',
    'subjects',
    'students',
    'discipline',
    'attendance',
    'teachers',
    'announcements',
    'faq',
    'search',
    'features',
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

  // =========================================================================
  // 1. DYNAMIC SCHOOL MANAGER ACCESS
  // =========================================================================
  // Managers are ONLY:
  // 1. OWNER
  // 2. SUB_ADMIN assigned to this specific school/company
  // Determined dynamically from authenticated user's real account data (no hardcoded emails or IDs)
  const isOwner = user?.role === 'OWNER';
  const isAssignedSubAdmin =
    user?.role === 'SUB_ADMIN' &&
    (user.assignedCompanyId === company.id || user.assignedCompanyIds?.includes(company.id));

  const isAuthorizedManager = isOwner || isAssignedSubAdmin;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            This private school management workstation is strictly accessible by the school Owner or authorized assigned Sub-Admin. Public visitors cannot view private academic management records.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to="/login">
              <Button variant="primary">Sign In as School Manager</Button>
            </Link>
            <Link to={`/c/${company.slug}`}>
              <Button variant="outline">View Public School Website</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorizedManager) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-8 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            School Manager Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {user.role === 'SUB_ADMIN'
              ? `You are not assigned to manage ${company.name}. Sub-Admin staff can only manage the specific school or company assigned to them.`
              : `Your account role (${user.role}) is not authorized to manage school academic operations for ${company.name}.`}
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1 font-mono">
            <p><span className="font-bold text-slate-500 font-sans">User:</span> {user.name} ({user.email})</p>
            <p><span className="font-bold text-slate-500 font-sans">Role:</span> {user.role}</p>
            <p><span className="font-bold text-slate-500 font-sans">Assigned Company ID:</span> {user.assignedCompanyId || 'None'}</p>
            <p><span className="font-bold text-slate-500 font-sans">Target School ID:</span> {company.id}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link to={user.assignedCompanyId ? `/company/${user.assignedCompanyId}` : '/'}>
              <Button variant="primary" icon={ArrowLeft}>
                Return to My Assigned Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Feature Configuration Checker
  const isFeatureEnabled = (key: SchoolFeatureKey): boolean => {
    if (!company.schoolFeatures) {
      return DEFAULT_SCHOOL_FEATURES[key] ?? true;
    }
    return company.schoolFeatures[key] !== false;
  };

  const activeAcademicYear = academicYears.find((y) => y.isActive) || academicYears[0];
  const canViewDiscipline = can(user, 'discipline', company.id, 'view');
  const canViewFaq = can(user, 'school_faq', company.id, 'view');

  return (
    <div className="space-y-6">
      {/* 1. Header with School Branding & Quick Links */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-sm">
              {company.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {company.name}
              </h1>
              <Badge variant="gold" size="sm">
                School Manager
              </Badge>
              {activeAcademicYear && isFeatureEnabled('academic_years') && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {activeAcademicYear.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {company.category} • /c/{company.slug} • Ethiopian & General Academic Curriculum
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

          {/* Duplicate School Website Trigger (Owner & Authorized Managers) */}
          <Button
            variant="outline"
            size="sm"
            icon={Copy}
            onClick={() => setDuplicateModalOpen(true)}
            title="Duplicate School Website with Selected Features"
          >
            Duplicate School
          </Button>

          {isOwner && (
            <Button
              variant={activeTab === 'features' ? 'primary' : 'outline'}
              size="sm"
              icon={Settings2}
              onClick={() => handleTabChange('features')}
            >
              Feature Config
            </Button>
          )}

          <Link to={`/company/${company.id}`}>
            <Button size="sm" variant="outline" icon={Building2}>
              Business Hub
            </Button>
          </Link>
          <Link to={`/studio/${company.id}`}>
            <Button size="sm" variant="outline" icon={Globe}>
              Website Studio
            </Button>
          </Link>
          <Link to={`/c/${company.slug}`} target="_blank">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              Live Site
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

        {/* Feature: Marklist */}
        {(isFeatureEnabled('marklist') || isOwner) && (
          <button
            onClick={() => handleTabChange('marklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'marklist'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('marklist') ? 'opacity-60' : ''}`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Marklist Sheet</span>
            {!isFeatureEnabled('marklist') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Student Roster */}
        {(isFeatureEnabled('student_roster') || isOwner) && (
          <button
            onClick={() => handleTabChange('students')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('student_roster') ? 'opacity-60' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>Students Roster ({students.length})</span>
            {!isFeatureEnabled('student_roster') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Class Attendance */}
        {(isFeatureEnabled('class_attendance') || isOwner) && (
          <button
            onClick={() => handleTabChange('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('class_attendance') ? 'opacity-60' : ''}`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance</span>
            {!isFeatureEnabled('class_attendance') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Discipline */}
        {(isFeatureEnabled('discipline_behavior') || isOwner) && canViewDiscipline && (
          <button
            onClick={() => handleTabChange('discipline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'discipline'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('discipline_behavior') ? 'opacity-60' : ''}`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Discipline</span>
            {!isFeatureEnabled('discipline_behavior') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Academic Years */}
        {(isFeatureEnabled('academic_years') || isOwner) && (
          <button
            onClick={() => handleTabChange('academic-years')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'academic-years'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('academic_years') ? 'opacity-60' : ''}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Academic Years</span>
            {!isFeatureEnabled('academic_years') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Grades */}
        {(isFeatureEnabled('grades') || isOwner) && (
          <button
            onClick={() => handleTabChange('grades')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'grades'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('grades') ? 'opacity-60' : ''}`}
          >
            <Layers className="w-4 h-4" />
            <span>Grades ({grades.length})</span>
            {!isFeatureEnabled('grades') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Sections */}
        {(isFeatureEnabled('sections') || isOwner) && (
          <button
            onClick={() => handleTabChange('sections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('sections') ? 'opacity-60' : ''}`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Sections ({sections.length})</span>
            {!isFeatureEnabled('sections') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Curriculum Subjects */}
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

        {/* Staff & Teachers */}
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

        {/* Feature: Announcements */}
        {(isFeatureEnabled('announcements') || isOwner) && (
          <button
            onClick={() => handleTabChange('announcements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('announcements') ? 'opacity-60' : ''}`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcements</span>
            {!isFeatureEnabled('announcements') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: School FAQ */}
        {(isFeatureEnabled('school_faq') || isOwner) && canViewFaq && (
          <button
            onClick={() => handleTabChange('faq')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('school_faq') ? 'opacity-60' : ''}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>School FAQ</span>
            {!isFeatureEnabled('school_faq') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Feature: Global Search */}
        {(isFeatureEnabled('global_search') || isOwner) && (
          <button
            onClick={() => handleTabChange('search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } ${!isFeatureEnabled('global_search') ? 'opacity-60' : ''}`}
          >
            <Search className="w-4 h-4" />
            <span>Global Search</span>
            {!isFeatureEnabled('global_search') && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">
                Off
              </span>
            )}
          </button>
        )}

        {/* Owner Only: Feature Configuration */}
        {isOwner && (
          <button
            onClick={() => handleTabChange('features')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Features Config</span>
          </button>
        )}
      </div>

      {/* 3. Active Tab View Render with Dynamic Feature Guards */}
      <div className="pt-2">
        {activeTab === 'dashboard' && (
          <SchoolDashboardView
            company={company}
            stats={stats}
            loading={loading}
            onNavigateTab={(tab) => handleTabChange(tab as AcademicTab)}
          />
        )}

        {/* Features Config Tab (Owner only) */}
        {activeTab === 'features' && (
          isOwner ? (
            <SchoolFeaturesConfigView
              company={company}
              onFeaturesUpdated={(updated) => setCompany(updated)}
              onNavigateTab={(tab) => handleTabChange(tab as AcademicTab)}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="academic_years"
              featureName="Feature Configuration"
              isOwner={false}
            />
          )
        )}

        {/* Feature 1: Academic Years */}
        {activeTab === 'academic-years' && (
          isFeatureEnabled('academic_years') ? (
            <SchoolAcademicYearsView
              company={company}
              academicYears={academicYears}
              onRefresh={handleRefresh}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="academic_years"
              featureName="Academic Years"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 2: Grades */}
        {activeTab === 'grades' && (
          isFeatureEnabled('grades') ? (
            <SchoolGradesSectionsView
              company={company}
              grades={grades}
              sections={sections}
              students={students}
              onRefresh={handleRefresh}
              onOpenMarklistForSection={handleOpenMarklistForSection}
              defaultFocus="grades"
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="grades"
              featureName="Grades"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 3: Sections */}
        {activeTab === 'sections' && (
          isFeatureEnabled('sections') ? (
            <SchoolGradesSectionsView
              company={company}
              grades={grades}
              sections={sections}
              students={students}
              onRefresh={handleRefresh}
              onOpenMarklistForSection={handleOpenMarklistForSection}
              defaultFocus="sections"
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="sections"
              featureName="Sections"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 4: Global Search */}
        {activeTab === 'search' && (
          isFeatureEnabled('global_search') ? (
            <SchoolGlobalSearchView
              company={company}
              onNavigateTab={(tab) => handleTabChange(tab as AcademicTab)}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="global_search"
              featureName="Global Search"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 5: Student Roster / Registration */}
        {activeTab === 'students' && (
          isFeatureEnabled('student_roster') ? (
            <SchoolStudentsView
              company={company}
              students={students}
              grades={grades}
              sections={sections}
              academicYears={academicYears}
              onRefresh={handleRefresh}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="student_roster"
              featureName="Student Roster / Registration"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 6: Marklist */}
        {activeTab === 'marklist' && (
          isFeatureEnabled('marklist') ? (
            <SchoolMarklistView
              company={company}
              academicYears={academicYears}
              grades={grades}
              sections={sections}
              subjects={subjects}
              initialSelection={marklistInitialSelection}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="marklist"
              featureName="Marklist Sheet"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 7: Class Attendance */}
        {activeTab === 'attendance' && (
          isFeatureEnabled('class_attendance') ? (
            <SchoolAttendanceView
              company={company}
              grades={grades}
              sections={sections}
              students={students}
              academicYears={academicYears}
              onRefresh={handleRefresh}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="class_attendance"
              featureName="Class Attendance"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Feature 8: Discipline / Behavior */}
        {activeTab === 'discipline' && (
          !isFeatureEnabled('discipline_behavior') ? (
            <FeatureDisabledNotice
              company={company}
              featureKey="discipline_behavior"
              featureName="Discipline & Behavior"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          ) : canViewDiscipline ? (
            <SchoolDisciplineView
              company={company}
              students={students}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold">Access Restricted</p>
              <p className="text-xs text-slate-500 mt-1">
                You do not have permission to view Discipline records for this school.
              </p>
            </div>
          )
        )}

        {/* Feature 9: School FAQ */}
        {activeTab === 'faq' && (
          !isFeatureEnabled('school_faq') ? (
            <FeatureDisabledNotice
              company={company}
              featureKey="school_faq"
              featureName="School FAQ"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          ) : canViewFaq ? (
            <SchoolFaqView
              company={company}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold">Access Restricted</p>
              <p className="text-xs text-slate-500 mt-1">
                You do not have permission to view the School FAQ module for this school.
              </p>
            </div>
          )
        )}

        {/* Feature 10: Announcements */}
        {activeTab === 'announcements' && (
          isFeatureEnabled('announcements') ? (
            <SchoolAnnouncementsView
              company={company}
              onRefresh={handleRefresh}
            />
          ) : (
            <FeatureDisabledNotice
              company={company}
              featureKey="announcements"
              featureName="Announcements & Bulletins"
              isOwner={isOwner}
              onFeatureEnabled={(updated) => setCompany(updated)}
              onNavigateFeatures={() => handleTabChange('features')}
            />
          )
        )}

        {/* Subjects (Academic Foundation) */}
        {activeTab === 'subjects' && (
          <SchoolSubjectsView
            company={company}
            subjects={subjects}
            grades={grades}
            onRefresh={handleRefresh}
            onOpenMarklistForSubject={handleOpenMarklistForSubject}
          />
        )}

        {/* Staff & Teachers */}
        {activeTab === 'teachers' && (
          <SchoolTeachersView
            company={company}
            subjects={subjects}
            grades={grades}
            sections={sections}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* Duplicate School Website Modal */}
      <DuplicateWebsiteModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        sourceCompany={company}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};
