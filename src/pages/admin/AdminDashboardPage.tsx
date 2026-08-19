import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  Users,
  QrCode,
  ArrowRight,
  Plus,
  Store,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Company, Lead } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CompanyName } from '../../components/ui/CompanyName';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const { user, setSelectedCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chartData, setChartData] = useState<{ date: string; views: number; scans: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCompanies(),
      api.getLeads(),
      api.getAnalyticsTimeSeries(),
    ])
      .then(([comps, lds, series]) => {
        setCompanies(comps);
        setLeads(lds);
        setChartData(series.dailyViews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <Badge variant="info" size="sm">Admin Workspace</Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Manage assigned company digital presence, onboard new businesses, and configure physical QR stands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/companies">
            <Button size="sm" variant="primary" icon={Plus}>
              Onboard Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Companies</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{companies.length}</p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Sites</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {companies.filter((c) => c.websiteStatus === 'published').length}
          </p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Leads</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {leads.filter((l) => l.status === 'new').length}
          </p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">QR Stands Active</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{companies.length}</p>
        </Card>
      </div>

      {/* Real Engagement Graph */}
      <Card variant="bordered" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Visitor Traffic & Stand Scans (Last 7 Days)
            </h3>
            <p className="text-xs text-slate-500">Real-time aggregate engagement from customer devices</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Page Views
            </span>
            <span className="flex items-center gap-1.5 text-sky-600">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              QR Scans
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="adminScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
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
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#adminViews)" />
              <Area type="monotone" dataKey="scans" name="QR Scans" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#adminScans)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Companies List */}
      <Card variant="bordered">
        <CardHeader>
          <div>
            <CardTitle>My Managed Companies</CardTitle>
            <CardDescription>Click any company to open its business hub, menu catalog, and website studio</CardDescription>
          </div>
          <Link to="/admin/companies">
            <Button size="sm" variant="ghost" icon={ArrowRight} iconPosition="right">
              View All
            </Button>
          </Link>
        </CardHeader>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {companies.map((comp) => (
            <div key={comp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={comp.logo}
                  alt={comp.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    <CompanyName name={comp.name} maxWidth="max-w-[220px]" />
                  </h3>
                  <p className="text-xs text-slate-500">{comp.category} • /{comp.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={comp.websiteStatus === 'published' ? 'published' : 'draft'} size="sm">
                  {comp.websiteStatus}
                </Badge>
                <Link
                  to={`/company/${comp.id}`}
                  onClick={() => setSelectedCompanyId(comp.id)}
                >
                  <Button size="sm" variant="primary" className="text-xs">
                    Open Hub
                  </Button>
                </Link>
                <Link to={`/studio/${comp.id}`}>
                  <Button size="sm" variant="outline" className="text-xs" icon={Globe}>
                    Studio
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
