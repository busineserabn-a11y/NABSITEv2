import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { SchoolFaq, Company } from '../../types';
import { api } from '../../lib/api';

interface SchoolPublicFaqViewProps {
  company: Company;
  design?: any;
}

export const SchoolPublicFaqView: React.FC<SchoolPublicFaqViewProps> = ({
  company,
  design = {},
}) => {
  const [faqs, setFaqs] = useState<SchoolFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const loadFaqs = async () => {
      setLoading(true);
      try {
        const data = await api.getSchoolFaqs(company.id, { publishedOnly: true });
        if (isMounted) {
          setFaqs(data);
          // Automatically expand the first FAQ for immediate clarity
          if (data.length > 0) {
            setExpandedIds({ [data[0].id]: true });
          }
        }
      } catch (err) {
        console.error('Failed to load published FAQs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFaqs();
    return () => {
      isMounted = false;
    };
  }, [company.id]);

  // Extract unique categories from loaded FAQs
  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category && f.category.trim()) {
        set.add(f.category.trim());
      }
    });
    return Array.from(set);
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      if (selectedCategory !== 'ALL' && faq.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = faq.question.toLowerCase().includes(q);
        const matchesA = faq.answer.toLowerCase().includes(q);
        const matchesC = faq.category?.toLowerCase().includes(q);
        if (!matchesQ && !matchesA && !matchesC) return false;
      }
      return true;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Gaaffiilee Yeroo Baay’ee Gaafataman • Frequently Asked Questions</span>
        </div>
        <h2
          className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white"
          style={{ fontFamily: `"${design.headingFont || 'Outfit'}", sans-serif` }}
        >
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Official answers to prospective parent inquiries, student registration procedures, academic programs, and campus guidelines at {company.name}.
        </p>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs by question or keywords (e.g. registration, Arabic, uniform)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            All Questions ({faqs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading school FAQs...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No FAQs available at this time.
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No questions matched your search query or selected category filter.'
              : 'School administrators have not published any public FAQ entries yet. Please contact the school office directly.'}
          </p>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Reset search filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = !!expandedIds[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white group hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <div className="space-y-1">
                    {faq.category && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {faq.category}
                      </span>
                    )}
                    <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {faq.question}
                    </div>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform shrink-0 mt-0.5 ${
                      isOpen ? 'rotate-180 bg-amber-500 text-slate-950' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* School Contact Footer helper */}
      <div className="p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-center space-y-2">
        <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          Have an unaddressed question or specific inquiry?
        </h4>
        <p className="text-xs text-amber-800 dark:text-amber-300/80 max-w-md mx-auto">
          Contact our administrative desk at{' '}
          <span className="font-bold">{company.phone || 'our official phone line'}</span> or visit the school during registrar working hours.
        </p>
      </div>
    </div>
  );
};
