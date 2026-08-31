import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Layers,
  BookOpen,
  Megaphone,
  Sparkles,
  ArrowRight,
  User,
  GraduationCap,
  DoorOpen,
  Calendar,
  X,
  FileCheck2,
} from 'lucide-react';
import { SchoolSearchResult, Company } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolGlobalSearchViewProps {
  company: Company;
  initialQuery?: string;
  onNavigateTab: (tab: 'dashboard' | 'marklist' | 'academic-years' | 'grades' | 'subjects' | 'students' | 'search') => void;
  onSelectStudentDetails?: (student: any) => void;
}

export const SchoolGlobalSearchView: React.FC<SchoolGlobalSearchViewProps> = ({
  company,
  initialQuery = '',
  onNavigateTab,
  onSelectStudentDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<SchoolSearchResult | null>(null);

  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSchoolSearch(company.id, searchTerm);
        setResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [company.id, searchTerm]);

  // Filtered by category
  const filteredResults = results.filter((r) => {
    if (activeCategory === 'ALL') return true;
    return r.type === activeCategory;
  });

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <Users className="w-5 h-5 text-emerald-500" />;
      case 'grade':
        return <Layers className="w-5 h-5 text-indigo-500" />;
      case 'section':
        return <DoorOpen className="w-5 h-5 text-amber-500" />;
      case 'subject':
        return <BookOpen className="w-5 h-5 text-sky-500" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-rose-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const counts = {
    all: results.length,
    student: results.filter((r) => r.type === 'student').length,
    grade: results.filter((r) => r.type === 'grade').length,
    section: results.filter((r) => r.type === 'section').length,
    subject: results.filter((r) => r.type === 'subject').length,
    announcement: results.filter((r) => r.type === 'announcement').length,
  };

  return (
    <div className="space-y-6">
      {/* Search Bar Input */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Global Academic Search
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time search across students, unique IDs, grades, sections, subjects, and notices.
          </p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Type student name (e.g. Dawit), student ID (e.g. GG_STU_...), grade, section, or subject code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-10 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {results.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeCategory === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Results ({counts.all})
            </button>
            {counts.student > 0 && (
              <button
                onClick={() => setActiveCategory('student')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === 'student'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Students ({counts.student})
              </button>
            )}
            {counts.subject > 0 && (
              <button
                onClick={() => setActiveCategory('subject')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === 'subject'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Subjects ({counts.subject})
              </button>
            )}
            {counts.grade > 0 && (
              <button
                onClick={() => setActiveCategory('grade')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === 'grade'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Grades ({counts.grade})
              </button>
            )}
            {counts.section > 0 && (
              <button
                onClick={() => setActiveCategory('section')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === 'section'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Sections ({counts.section})
              </button>
            )}
            {counts.announcement > 0 && (
              <button
                onClick={() => setActiveCategory('announcement')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  activeCategory === 'announcement'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Announcements ({counts.announcement})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Searching academic records across the database...</p>
        </div>
      ) : !searchTerm.trim() ? (
        <Card variant="bordered" padding="lg" className="text-center py-16 space-y-3">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
            Instant Academic Search
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Search for student names, unique admission codes, subjects (e.g. Physics, Math), grade levels, or section classrooms.
          </p>
        </Card>
      ) : filteredResults.length === 0 ? (
        <Card variant="bordered" padding="lg" className="text-center py-16 space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No Records Found for "{searchTerm}"
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try searching by partial name, grade number, or subject code.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((item) => (
            <div
              key={`${item.type}_${item.id}`}
              onClick={() => {
                setSelectedResult(item);
                if (item.linkTab) {
                  onNavigateTab(item.linkTab as any);
                }
              }}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  {getResultIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View in {item.badge} Tab
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
