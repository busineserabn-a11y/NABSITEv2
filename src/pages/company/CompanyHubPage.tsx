import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe,
  Utensils,
  Star,
  Tag,
  Clock,
  QrCode,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Website } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const CompanyHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [chartData, setChartData] = useState<{ date: string; views: number; scans: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCompanyWebsite(id).catch(async () => {
        const comp = await api.getCompany(id);
        return { company: comp, website: null };
      }),
      api.getAnalyticsTimeSeries(id).catch(() => ({ dailyViews: [] })),
    ])
      .then(([webData, series]) => {
        setCompany((webData as any).company || webData);
        setWebsite((webData as any).website || null);
        setChartData((series as any).dailyViews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !company) {
    return <div className="py-12 text-center text-slate-400">Loading Business Workspace Hub...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{company.name}</h1>
              <Badge variant={company.status === 'active' ? 'active' : 'suspended'} size="sm">
                {company.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{company.category} • /{company.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/company/${company.id}/wizard`}>
            <Button size="md" variant="outline" icon={Sparkles}>
              Website Wizard
            </Button>
          </Link>
          <Link to={`/studio/${company.id}`}>
            <Button size="md" variant="primary" icon={Globe}>
              Website Studio
            </Button>
          </Link>
          <Link to={`/c/${company.slug}`} target="_blank">
            <Button size="md" variant="outline" icon={ExternalLink}>
              View Live Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Engagement Graph */}
      <Card variant="bordered" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Live Visitor & QR Stand Traffic (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-500">Real-time page views and menu scans recorded for {company.name}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Page Views
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              QR Scans
            </span>
          </div>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="compViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="compScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#compViews)" />
              <Area type="monotone" dataKey="scans" name="QR Scans" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#compScans)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to={`/company/${company.id}/products`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Products & Menu Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage food items, prices in ETB, categories, and Telegram order routing.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/reviews`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                Customer Reviews
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Approve, reject, or reply directly to verified visitor reviews.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/offers`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Promotions & Announcements
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Display holiday specials, discounts, and flash announcements on your website banner.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/profile`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Business Hours & Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure daily opening & closing schedule, phone lines, and physical map coordinates.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/qr`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-slate-700 transition-colors">
                QR Studio & Stand Cards
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize branded table QR stands, download print files, and track camera scan logs.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/studio/${company.id}`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group bg-slate-900 text-white border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                Website Studio (24 Themes)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Switch themes, live preview desktop/tablet/mobile, and publish with 1-click validation.
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
