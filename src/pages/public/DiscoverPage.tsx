import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Building2,
  Phone,
  Send,
  QrCode,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Category } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const currentQuery = searchParams.get('query') || '';
  const currentCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.discoverCompanies(currentQuery, currentCategory === 'all' ? undefined : currentCategory),
      api.getCategories(),
    ])
      .then(([comps, cats]) => {
        setCompanies(comps);
        setCategories(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentQuery, currentCategory]);

  const handleCategoryChange = (catName: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (catName === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catName);
    }
    setSearchParams(newParams);
  };

  const handleQueryChange = (q: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (!q) {
      newParams.delete('query');
    } else {
      newParams.set('query', q);
    }
    setSearchParams(newParams);
  };

  // Helper to check if company is open right now
  const isCompanyOpenNow = (company: Company): boolean => {
    if (!company.hours || company.hours.length === 0) return true;
    try {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      const todayHour = company.hours.find((h) => h.day === currentDay);
      if (!todayHour || !todayHour.isOpen || !todayHour.openTime || !todayHour.closeTime) return false;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = (todayHour.openTime || '08:00').split(':').map(Number);
      const [closeH, closeM] = (todayHour.closeTime || '22:00').split(':').map(Number);
      const openMinutes = (openH || 0) * 60 + (openM || 0);
      const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch {
      return true;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Verified Commercial Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Browse verified enterprises, restaurants, medical centers, and digital service providers in Addis Ababa.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, menu item, or location..."
            value={currentQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {currentQuery && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown on Mobile / Pills on Desktop */}
        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              currentCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent hover:bg-slate-200'
            }`}
          >
            All Industries
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                currentCategory === cat.name
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {companies.length} verified companies</span>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full mx-auto" />
          <p className="text-xs font-semibold">Searching NABSITE commercial network...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No matching businesses found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <Button size="sm" variant="secondary" onClick={() => { handleQueryChange(''); handleCategoryChange('all'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const isOpen = isCompanyOpenNow(company);
            return (
              <Card
                key={company.id}
                variant="bordered"
                padding="none"
                className="overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 bg-slate-900">
                    <img
                      src={company.coverImage || company.logo}
                      alt={company.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 flex items-center gap-3">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-12 h-12 rounded-xl border-2 border-white bg-white object-cover shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-white">
                        <h3 className="font-bold text-base leading-tight drop-shadow-xs">{company.name}</h3>
                        <p className="text-xs text-slate-200 drop-shadow-xs">{company.category}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {company.shortDescription}
                    </p>

                    <div className="space-y-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{company.address}</span>
                      </div>
                      {company.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.telegramUsername && (
                        <div className="flex items-center gap-1.5 text-sky-500">
                          <Send className="w-3.5 h-3.5 shrink-0" />
                          <span>@{company.telegramUsername}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <Link to={`/c/${company.slug}`} className="flex-1">
                    <Button size="sm" variant="primary" className="w-full text-xs">
                      View Digital Stand
                    </Button>
                  </Link>
                  <Link to={`/c/${company.slug}/qr`} title="Digital QR Stand">
                    <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <QrCode className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
