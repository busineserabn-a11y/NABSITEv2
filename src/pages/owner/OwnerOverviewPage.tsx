import React, { useState, useEffect, useRef } from 'react';
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
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Sliders,
  Store,
  RefreshCw,
  Star,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Lead, AuditLog } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CompanyName } from '../../components/ui/CompanyName';

export const OwnerOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state for company table
  const [companyTab, setCompanyTab] = useState<'all' | 'active' | 'draft' | 'suspended' | 'archived'>('all');
  const [companySearch, setCompanySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Time range filter for charts
  const [timeRange, setTimeRange] = useState<'monthly' | 'weekly'>('monthly');

  // Add Company Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    slug: '',
    category: 'Restaurant & Dining',
    phone: '+251 911 000 111',
    address: 'Bole Medhanealem, Addis Ababa',
    themeId: 'theme_culinary',
  });
  const [creating, setCreating] = useState(false);

  // Horizontal Showcase Auto-Rotation Ref & Effect
  const showcaseScrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (showcaseScrollRef.current) {
        const el = showcaseScrollRef.current;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: 240, behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getOwnerAnalytics().catch(() => null),
      api.getCompanies().catch(() => []),
      api.getLeads().catch(() => []),
      api.getAuditLogs().catch(() => []),
    ])
      .then(([analytics, comps, lds, logs]) => {
        setSummary(analytics);
        setCompanies(comps);
        setLeads(lds);
        setAuditLogs(logs.slice(0, 8));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.name || !newCompanyForm.slug) return;
    setCreating(true);
    try {
      const res = await api.createCompany({
        name: newCompanyForm.name,
        slug: newCompanyForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        category: newCompanyForm.category,
        phone: newCompanyForm.phone,
        address: newCompanyForm.address,
        themeId: newCompanyForm.themeId,
      });
      setAddModalOpen(false);
      loadData();
      if (res?.company?.id) {
        navigate(`/owner/companies/${res.company.id}`);
      }
    } catch (err) {
      console.error('Failed to create company', err);
    } finally {
      setCreating(false);
    }
  };

  const scrollShowcase = (direction: 'left' | 'right') => {
    if (showcaseScrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      showcaseScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    if (companyTab === 'active' && c.status !== 'active') return false;
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

  // Recent leads mock / real synthesis
  const recentOrders = [
    { id: '1', name: 'Olivia Rhye', email: 'olivia@luxebistro.et', amount: '$1,299.00', status: 'Completed', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: '2', name: 'Phoenix Baker', email: 'phoenix@ethiohealth.et', amount: '$899.00', status: 'Completed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: '3', name: 'Lana Steiner', email: 'lana@hailehotel.et', amount: '$599.00', status: 'Pending', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    { id: '4', name: 'Demi Wilkinson', email: 'demi@shegerbrew.et', amount: '$1,299.00', status: 'Completed', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { id: '5', name: 'Candice Wu', email: 'candice@habeshatech.et', amount: '$399.00', status: 'Cancelled', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-emerald-400 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading NABSITE Command Center...</p>
      </div>
    );
  }

  const totalComps = summary?.totalCompanies || companies.length || 25;
  const activeComps = summary?.activeCompanies || companies.filter((c) => c.status === 'active').length || 18;
  const publishedSites = summary?.publishedWebsites || 22;
  const totalLeadsCount = leads.length || 24;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Platform Overview</span>
            <Badge variant="gold" size="sm">
              GOD MODE
            </Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant telemetry, subscription lifecycle, and traffic engines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTimeRange(timeRange === 'monthly' ? 'weekly' : 'monthly')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161F30] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-300 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{timeRange} View</span>
          </button>

          <Button
            size="sm"
            variant="gold"
            icon={Plus}
            onClick={() => setAddModalOpen(true)}
            className="font-bold shadow-lg shadow-amber-950/40"
          >
            Add Company
          </Button>
        </div>
      </div>

      {/* 2. FOUR TOP GLOWING KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1E293B] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Value</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">$128,430</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4%</span>
                <span className="text-slate-500 font-normal text-[10px] ml-1">vs last mo</span>
              </div>
            </div>

            {/* Sparkline Graphic (SVG) */}
            <div className="w-24 h-10">
              <svg viewBox="0 0 100 40" className="w-full h-full stroke-emerald-400 fill-none stroke-[2.5]">
                <path d="M0 35 Q 25 30, 45 20 T 75 18 T 100 5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: New Customers / Companies */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1E293B] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Companies</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{totalComps}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+8.7%</span>
                <span className="text-slate-500 font-normal text-[10px] ml-1">{activeComps} Active</span>
              </div>
            </div>

            {/* Sparkline Graphic (SVG) */}
            <div className="w-24 h-10">
              <svg viewBox="0 0 100 40" className="w-full h-full stroke-cyan-400 fill-none stroke-[2.5]">
                <path d="M0 32 Q 30 35, 55 18 T 80 22 T 100 8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Active Subscriptions / Live Sites */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1E293B] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xs">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Live Websites</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{publishedSites}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+15.3%</span>
                <span className="text-slate-500 font-normal text-[10px] ml-1">24 Themes</span>
              </div>
            </div>

            {/* Sparkline Graphic (SVG) */}
            <div className="w-24 h-10">
              <svg viewBox="0 0 100 40" className="w-full h-full stroke-amber-400 fill-none stroke-[2.5]">
                <path d="M0 28 Q 20 32, 40 25 T 70 12 T 100 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Lead Flow & Conversion */}
        <div className="p-5 rounded-2xl bg-[#121826] border border-[#1E293B] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lead Inquiries</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{totalLeadsCount}</p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-400 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>94.2%</span>
                <span className="text-slate-500 font-normal text-[10px] ml-1">Conversion</span>
              </div>
            </div>

            {/* Sparkline Graphic (SVG) */}
            <div className="w-24 h-10">
              <svg viewBox="0 0 100 40" className="w-full h-full stroke-purple-400 fill-none stroke-[2.5]">
                <path d="M0 25 Q 35 15, 60 22 T 85 10 T 100 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS ROW: REVENUE OVERVIEW & TRAFFIC SOURCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): Revenue Overview Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div>
              <h2 className="text-base font-bold text-white">Revenue & Traffic Performance</h2>
              <p className="text-xs text-slate-400">Monthly aggregate business volume & visitor requests</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#161F30] p-1 rounded-xl border border-[#1E293B] text-[11px]">
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  timeRange === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  timeRange === 'weekly' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Area Chart Simulation Graphic */}
          <div className="relative pt-6 pb-2">
            <div className="h-56 w-full flex items-end">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="#1E293B" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="#1E293B" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#1E293B" strokeDasharray="4 4" />
                <line x1="0" y1="190" x2="600" y2="190" stroke="#1E293B" />

                {/* Gradient Fill Area */}
                <path
                  d="M 20 160 Q 120 140, 220 110 T 420 80 T 580 30 L 580 190 L 20 190 Z"
                  fill="url(#chartGrad)"
                />

                {/* Main Stroke Line */}
                <path
                  d="M 20 160 Q 120 140, 220 110 T 420 80 T 580 30"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                />

                {/* Data Points */}
                <circle cx="20" cy="160" r="4" fill="#10B981" className="drop-shadow-md" />
                <circle cx="140" cy="135" r="4" fill="#10B981" />
                <circle cx="260" cy="105" r="4" fill="#10B981" />
                <circle cx="380" cy="85" r="4" fill="#10B981" />
                <circle cx="500" cy="55" r="4" fill="#10B981" />
                <circle cx="580" cy="30" r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            {/* Tooltip callout */}
            <div className="absolute right-6 top-8 bg-[#161F30] border border-emerald-500/40 p-2.5 rounded-xl shadow-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">May 2026 Peak</span>
              <p className="text-xs font-black text-emerald-400">$128,430 Volume</p>
            </div>

            {/* Month Labels */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-[#1E293B]">
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span className="text-emerald-400 font-bold">May</span>
            </div>
          </div>
        </div>

        {/* Right (5 Cols): Traffic Sources Donut Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div>
              <h2 className="text-base font-bold text-white">Traffic Sources</h2>
              <p className="text-xs text-slate-400">Visitor acquisition distribution</p>
            </div>
            <span className="text-xs text-slate-400 font-semibold">This Month</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Donut graphic */}
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1E293B" strokeWidth="12" />
                {/* Organic Search 42.3% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="100 138"
                  strokeDashoffset="0"
                />
                {/* Direct 24.8% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="12"
                  strokeDasharray="60 178"
                  strokeDashoffset="-100"
                />
                {/* Social Media 16.7% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="12"
                  strokeDasharray="40 198"
                  strokeDashoffset="-160"
                />
                {/* Referral 9.3% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeDasharray="22 216"
                  strokeDashoffset="-200"
                />
              </svg>
              {/* Donut Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white leading-none">36,854</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Visits</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Organic Search</span>
                </div>
                <span className="font-bold text-white">42.3%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300 font-medium">Direct / QR</span>
                </div>
                <span className="font-bold text-white">24.8%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span className="text-slate-300 font-medium">Telegram / Social</span>
                </div>
                <span className="font-bold text-white">16.7%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300 font-medium">Referral</span>
                </div>
                <span className="font-bold text-white">9.3%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-slate-300 font-medium">Direct Phone Call</span>
                </div>
                <span className="font-bold text-white">6.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS & ACTIVITY FEEDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders / Commercial Inquiries (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div>
              <h2 className="text-base font-bold text-white">Recent Conversions & Leads</h2>
              <p className="text-xs text-slate-400">Incoming inquiries from verified commercial storefronts</p>
            </div>
            <Link to="/owner/leads" className="text-xs font-bold text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#161F30] hover:bg-[#1A2438] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={ord.avatar} alt={ord.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                  <div>
                    <p className="text-xs font-bold text-white">{ord.name}</p>
                    <p className="text-[10px] text-slate-400">{ord.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-white">{ord.amount}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ord.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : ord.status === 'Pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity Timeline (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <div>
              <h2 className="text-base font-bold text-white">Recent System Activity</h2>
              <p className="text-xs text-slate-400">Real-time tamper-evident events log</p>
            </div>
            <Link to="/owner/audit" className="text-xs font-bold text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161F30]">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-white">New company registered</p>
                <p className="text-[10px] text-slate-400">Bole Luxe Bistro • Culinary Theme</p>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">2 min ago</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161F30]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-white">Subscription activated</p>
                <p className="text-[10px] text-slate-400">Growth Plan • Digital Menu Stand</p>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">5 min ago</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161F30]">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-white">Website published live</p>
                <p className="text-[10px] text-slate-400">Sheger Coffee Roasters • 4 Pages</p>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">18 min ago</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#161F30]">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-bold text-white">Commercial lead converted</p>
                <p className="text-[10px] text-slate-400">$1,299.00 Enterprise Stand</p>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">25 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. COMPANY MANAGEMENT TABLE CARD (EXACTLY AS IN REFERENCE IMAGE) */}
      <div className="p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">Company Management</h2>
            <p className="text-xs text-slate-400">Platform-wide multi-tenant commercial directory</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#161F30] border border-[#1E293B] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64"
              />
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setAddModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-950/40"
            >
              Add Company
            </Button>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 overflow-x-auto">
          {(['all', 'active', 'draft', 'suspended', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setCompanyTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                companyTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab === 'all' ? 'All Companies' : tab}
            </button>
          ))}
        </div>

        {/* Rich Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Company</th>
                <th className="pb-3 px-3">Owner / Admin</th>
                <th className="pb-3 px-3">Plan</th>
                <th className="pb-3 px-3">Traffic / Volume</th>
                <th className="pb-3 px-3">Users</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {paginatedCompanies.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#161F30]/60 transition-colors group">
                  {/* Company info */}
                  <td className="py-3 px-3">
                    <Link to={`/owner/companies/${c.id}`} className="flex items-center gap-3">
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="w-8 h-8 rounded-xl object-cover border border-slate-700 bg-white"
                      />
                      <div>
                        <p className="font-black text-white group-hover:text-emerald-400 transition-colors">
                          <CompanyName name={c.name} maxWidth="max-w-[180px]" />
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">nabsite.et/c/{c.slug}</p>
                      </div>
                    </Link>
                  </td>

                  {/* Owner */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{c.name.split(' ')[0]} Admin</p>
                        <p className="text-[10px] text-slate-400">admin@{c.slug}.et</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan Badge */}
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-extrabold text-[10px] uppercase tracking-wider">
                      {idx % 3 === 0 ? 'Enterprise' : idx % 2 === 0 ? 'Growth' : 'Pro'}
                    </span>
                  </td>

                  {/* Revenue / Traffic */}
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-white">
                      ${(1200 + idx * 850).toLocaleString()}
                    </span>
                  </td>

                  {/* Users */}
                  <td className="py-3 px-3 text-slate-300 font-semibold">
                    {6 + idx * 2}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : c.status === 'draft'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/owner/companies/${c.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-slate-300 hover:text-white">
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/studio/${c.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-emerald-400 border-emerald-500/30">
                          Studio
                        </Button>
                      </Link>
                      <a href={`/c/${c.slug}`} target="_blank" rel="noreferrer">
                        <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1E293B] text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCompanies.length)} of {filteredCompanies.length} companies
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#161F30] disabled:opacity-40 text-white hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg font-bold text-xs ${
                  currentPage === i + 1
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-[#161F30] border border-[#1E293B] text-slate-300 hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#161F30] disabled:opacity-40 text-white hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. FEATURED COMPANIES HORIZONTAL ROTATING SHOWCASE */}
      <div className="p-6 rounded-3xl bg-[#121826] border border-[#1E293B] shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Featured Companies Showcase</span>
            </h2>
            <p className="text-xs text-slate-400">Showcasing top verified businesses operating on NABSITE</p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/owner/showcase" className="text-xs font-bold text-emerald-400 hover:underline mr-2 hidden sm:inline">
              View All Showcase
            </Link>
            <button
              onClick={() => scrollShowcase('left')}
              className="p-2 rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollShowcase('right')}
              className="p-2 rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Container with Smooth Auto-Rotation */}
        <div
          ref={showcaseScrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
        >
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="w-72 shrink-0 rounded-2xl bg-[#161F30] border border-[#1E293B] overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300"
            >
              <div className="relative h-36 bg-slate-950 overflow-hidden">
                <img
                  src={comp.coverImage || comp.logo}
                  alt={comp.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161F30] via-transparent to-transparent" />
                <div className="absolute top-2.5 right-2.5">
                  <Badge variant="published" size="sm">
                    Live
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    <CompanyName name={comp.name} maxWidth="max-w-[200px]" />
                  </h3>
                  <p className="text-xs text-slate-400">{comp.category}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-black">4.9</span>
                  <span className="text-slate-500 text-[10px]">(128 reviews)</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a href={`/c/${comp.slug}`} target="_blank" rel="noreferrer" className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full text-xs font-bold h-8">
                      Visit Website
                    </Button>
                  </a>
                  <Link to={`/owner/companies/${comp.id}`}>
                    <Button size="sm" variant="gold" className="text-xs font-bold h-8 px-2.5">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. BOTTOM BRANDED PLATFORM FOOTER (MATCHING REFERENCE IMAGE) */}
      <footer className="pt-12 pb-6 border-t border-[#1E293B] space-y-8 text-xs text-slate-400">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white">
                N
              </div>
              <span className="font-black text-base text-white tracking-tight">NABSITE</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              The all-in-one platform for managing verified digital commercial presences, digital menus, QR stands, and multi-tenant storefronts.
            </p>
            <p className="text-[11px] text-slate-500">© 2026 NABSITE Platform Inc. All rights reserved.</p>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Platform</h4>
            <ul className="space-y-1.5">
              <li><Link to="/owner/companies" className="hover:text-white">Companies Vault</Link></li>
              <li><Link to="/owner/themes" className="hover:text-white">Theme Engine (24)</Link></li>
              <li><Link to="/owner/qr" className="hover:text-white">Universal QR Studio</Link></li>
              <li><Link to="/owner/verify" className="hover:text-white">Security Matrix</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">Company</h4>
            <ul className="space-y-1.5">
              <li><Link to="/" className="hover:text-white">Public Directory</Link></li>
              <li><Link to="/discover" className="hover:text-white">Commercial Network</Link></li>
              <li><Link to="/owner/audit" className="hover:text-white">Audit Logs</Link></li>
              <li><Link to="/owner/health" className="hover:text-white">System Diagnostics</Link></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="col-span-2 md:col-span-1 space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider">System Status</h4>
            <div className="p-3 rounded-2xl bg-[#161F30] border border-[#1E293B] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Operational</span>
              </div>
              <p className="text-[10px] text-slate-400">Response time: 42ms</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Add Company Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Commercial Company"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name *"
            placeholder="e.g. Bole Coffee Roasters"
            value={newCompanyForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setNewCompanyForm((prev) => ({
                ...prev,
                name,
                slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              }));
            }}
          />

          <Input
            label="URL Slug (nabsite.et/c/slug) *"
            placeholder="e.g. bole-coffee"
            value={newCompanyForm.slug}
            onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, slug: e.target.value }))}
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-300 uppercase">Category *</label>
            <select
              value={newCompanyForm.category}
              onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full text-xs font-semibold rounded-xl border border-[#1E293B] bg-[#161F30] text-white p-2.5"
            >
              <option value="Restaurant & Dining">Restaurant & Dining</option>
              <option value="Hotels & Hospitality">Hotels & Hospitality</option>
              <option value="Medical & Healthcare">Medical & Healthcare</option>
              <option value="Technology & Telecom">Technology & Telecom</option>
              <option value="Financial & Banking">Financial & Banking</option>
              <option value="Retail & Boutique">Retail & Boutique</option>
            </select>
          </div>

          <Input
            label="Phone Contact *"
            placeholder="+251 911 ..."
            value={newCompanyForm.phone}
            onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, phone: e.target.value }))}
          />

          <Input
            label="Address / Location"
            placeholder="Addis Ababa, Ethiopia"
            value={newCompanyForm.address}
            onChange={(e) => setNewCompanyForm((prev) => ({ ...prev, address: e.target.value }))}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button size="sm" variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="gold" type="submit" disabled={creating} className="font-bold">
              {creating ? 'Creating Company...' : 'Create Company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
