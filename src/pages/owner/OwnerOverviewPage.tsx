import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
  QrCode,
  AlertTriangle,
  FileCheck,
  Layers,
  Database,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Sliders,
  Store,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Lead, AuditLog } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CompanyName } from '../../components/ui/CompanyName';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const OwnerOverviewPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telemetry, setTelemetry] = useState<{ totalViews: number; totalScans: number; totalLeads: number }>({
    totalViews: 0,
    totalScans: 0,
    totalLeads: 0,
  });
  const [chartData, setChartData] = useState<{
    dailyViews: { date: string; views: number; scans: number }[];
    categoryBreakdown: { category: string; count: number }[];
    deviceBreakdown: { name: string; value: number }[];
  }>({
    dailyViews: [],
    categoryBreakdown: [],
    deviceBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  // Filter state for company table
  const [companyTab, setCompanyTab] = useState<'all' | 'published' | 'draft' | 'suspended' | 'archived'>('all');
  const [companySearch, setCompanySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Add Company Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    slug: '',
    category: 'Restaurant',
    phone: '',
    address: 'Addis Ababa, Ethiopia',
  });
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, lds, logs, tele, series] = await Promise.all([
        api.getCompanies().catch(() => []),
        api.getLeads().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getAnalyticsSummary().catch(() => ({ totalViews: 0, totalScans: 0, totalLeads: 0 })),
        api.getAnalyticsTimeSeries().catch(() => ({ dailyViews: [], categoryBreakdown: [], deviceBreakdown: [] })),
      ]);
      setCompanies(comps || []);
      setLeads(lds || []);
      setAuditLogs((logs || []).slice(0, 10));
      setTelemetry(tele);
      setChartData(series);
    } catch (err) {
      console.error('Failed to load owner overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.name || !newCompanyForm.slug) return;
    setCreating(true);
    try {
      const newComp = await api.createCompany({
        name: newCompanyForm.name,
        slug: newCompanyForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        category: newCompanyForm.category,
        phone: newCompanyForm.phone,
        address: newCompanyForm.address,
        status: 'draft',
      });
      setAddModalOpen(false);
      setNewCompanyForm({ name: '', slug: '', category: 'Restaurant', phone: '', address: 'Addis Ababa, Ethiopia' });
      await loadData();
      if (newComp?.id) {
        navigate(`/owner/companies/${newComp.id}`);
      }
    } catch (err) {
      console.error('Failed to create company:', err);
    } finally {
      setCreating(false);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    if (companyTab === 'published' && c.status !== 'published') return false;
    if (companyTab === 'draft' && c.status !== 'draft') return false;
    if (companyTab === 'suspended' && c.status !== 'suspended') return false;
    if (companyTab === 'archived' && c.status !== 'archived') return false;
    if (companySearch) {
      const q = companySearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Real KPI calculations from Firestore
  const totalCompsCount = companies.length;
  const publishedCount = companies.filter((c) => c.status === 'published').length;
  const draftCount = companies.filter((c) => c.status === 'draft').length;
  const leadsCount = leads.length;

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-400 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Loading NABSITE Platform Command Center...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Platform Overview</span>
            <Badge variant="gold" size="sm">
              OWNER AUTHORITY
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live multi-tenant telemetry and database state from Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={loadData}
            className="text-xs"
          >
            Sync State
          </Button>

          <Button
            size="sm"
            variant="gold"
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
            className="font-bold shadow-lg shadow-amber-950/40 text-slate-950"
          >
            Add Company
          </Button>
        </div>
      </div>

      {/* 2. FOUR REAL METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Companies */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Companies</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">{totalCompsCount}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              {publishedCount} Published • {draftCount} Draft
            </p>
          </div>
        </div>

        {/* Card 2: Live Published Presences */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live Websites</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">{publishedCount}</p>
            <p className="text-[11px] font-medium text-emerald-400 mt-1">
              Active in Discovery Directory
            </p>
          </div>
        </div>

        {/* Card 3: Inquiries / Leads */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lead Applications</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">{leadsCount}</p>
            <p className="text-[11px] font-medium text-cyan-400 mt-1">
              Verified business inquiries
            </p>
          </div>
        </div>

        {/* Card 4: Telemetry Events */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Telemetry Events</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">{telemetry.totalViews}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Recorded page & menu views
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 REAL ANALYTICS & TELEMETRY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real 7-Day Traffic & QR Scans Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Live Platform Engagement (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time page views and physical QR stand scans recorded in Firestore
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Page Views
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                QR Scans
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.dailyViews} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Page Views"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  name="QR Scans"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Company Categories
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of registered commercial enterprises
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.categoryBreakdown.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#64748B" fontSize={10} tickLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Companies" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Active Sector Types</span>
            <span className="font-bold text-emerald-400">{chartData.categoryBreakdown.length} Sectors</span>
          </div>
        </div>
      </div>

      {/* 3. COMPANIES DIRECTORY MANAGEMENT TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Registered Companies</h2>
            <p className="text-xs text-slate-400">Manage digital websites, status, and studio access.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'published', 'draft', 'suspended'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setCompanyTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                    companyTab === tab ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search company..."
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {paginatedCompanies.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No companies match this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Direct URL</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80'}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.city || 'Addis Ababa'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300">{c.category}</td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          c.status === 'published'
                            ? 'success'
                            : c.status === 'draft'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5">
                      <a
                        href={`/c/${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        /c/{c.slug}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link to={`/studio/${c.websiteId || c.id}`}>
                        <Button size="xs" variant="secondary">
                          Studio
                        </Button>
                      </Link>
                      <Link to={`/owner/companies/${c.id}`}>
                        <Button size="xs" variant="primary">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                size="xs"
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. RECENT AUDIT LOGS */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">System Audit Trail</h2>
            <p className="text-xs text-slate-400">Immutable records of administrative mutations.</p>
          </div>
          <Link to="/owner/audit" className="text-xs text-amber-400 hover:underline">
            View All Logs →
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No audit logs recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {log.action}
                  </span>
                  <span className="text-slate-300">
                    {log.resource} ({log.resourceId})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD COMPANY MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Company"
        description="Creates a company record and initializes a website in Firestore."
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name"
            required
            placeholder="e.g. Blue Nile Bistro"
            value={newCompanyForm.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              setNewCompanyForm((prev) => ({ ...prev, name, slug }));
            }}
          />

          <Input
            label="URL Slug"
            required
            placeholder="e.g. blue-nile-bistro"
            value={newCompanyForm.slug}
            onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, slug: e.target.value }))}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Category</label>
            <select
              value={newCompanyForm.category}
              onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-amber-400"
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Café">Café</option>
              <option value="Hotel">Hotel</option>
              <option value="Bakery">Bakery</option>
              <option value="Retail">Retail</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>

          <Input
            label="Phone Number"
            placeholder="+251 91 123 4567"
            value={newCompanyForm.phone}
            onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, phone: e.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={creating} className="font-bold text-slate-950">
              {creating ? 'Registering...' : 'Create Company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
