import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Globe,
  Palette,
  QrCode,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
  Store,
  MessageSquare,
  Megaphone,
  Clock,
  Activity,
  UserCheck,
  Zap,
  Sparkles,
  BarChart3,
  FileText,
  Search,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Company, Lead, AuditLog } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CompanyName } from '../ui/CompanyName';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string | number;
  badgeColor?: string;
  permission?: string;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, selectedCompanyId, setSelectedCompanyId, hasRole, hasPermission } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Company Registered', time: '2m ago', desc: 'Bole Luxe Bistro joined NABSITE', read: false },
    { id: '2', title: 'Lead Captured', time: '12m ago', desc: 'Inquiry from Haile Grand Hotel', read: false },
    { id: '3', title: 'System Health Optimal', time: '1h ago', desc: 'All 24 theme templates loaded', read: true },
  ]);

  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getCompanies().catch(() => []),
        api.getLeads().catch(() => []),
      ]).then(([comps, lds]) => {
        setCompanies(comps);
        setLeads(lds);
        if (!selectedCompanyId && comps.length > 0) {
          if (user.assignedCompanyId) {
            setSelectedCompanyId(user.assignedCompanyId);
          } else {
            setSelectedCompanyId(comps[0].id);
          }
        }
      });
    }
  }, [user]);

  // Global Keyboard Shortcut (CMD+K / CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const pendingLeadsCount = leads.filter((l) => l.status === 'new').length;

  // Navigation Items per Role
  const getNavItems = (): { section: string; items: NavItem[] }[] => {
    if (!user) return [];

    if (user.role === 'OWNER') {
      return [
        {
          section: 'PLATFORM',
          items: [
            { label: 'Overview', href: '/owner', icon: LayoutDashboard },
            { label: 'Companies', href: '/owner/companies', icon: Building2, badge: companies.length },
            { label: 'Websites', href: '/owner/websites', icon: Globe },
            { label: 'Leads', href: '/owner/leads', icon: UserCheck, badge: pendingLeadsCount > 0 ? pendingLeadsCount : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-400' },
            { label: 'Showcase', href: '/owner/showcase', icon: Sparkles },
          ],
        },
        {
          section: 'MANAGEMENT',
          items: [
            { label: 'Admins', href: '/owner/admins', icon: Users },
            { label: 'Sub-Admins', href: '/owner/sub-admins', icon: Shield },
            { label: 'Categories', href: '/owner/categories', icon: FolderTree },
            { label: 'Themes', href: '/owner/themes', icon: Palette, badge: '24' },
            { label: 'Features', href: '/owner/features', icon: Zap },
          ],
        },
        {
          section: 'ANALYTICS',
          items: [
            { label: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
            { label: 'Reports', href: '/owner/reports', icon: FileText },
            { label: 'Traffic Sources', href: '/owner/traffic', icon: Activity },
            { label: 'Events Engine', href: '/owner/events', icon: Terminal },
          ],
        },
        {
          section: 'PLATFORM CONTROL',
          items: [
            { label: 'Platform Settings', href: '/owner/settings', icon: Settings },
            { label: 'Security & Matrix', href: '/owner/verify', icon: ShieldAlert },
            { label: 'Audit Logs', href: '/owner/audit', icon: FileText },
            { label: 'System Health', href: '/owner/health', icon: Activity },
            { label: 'Data Export', href: '/owner/export', icon: Sliders },
          ],
        },
        {
          section: 'QUICK TOOLS',
          items: [
            { label: 'Universal QR Studio', href: '/owner/qr', icon: QrCode },
            { label: 'Active Studio', href: `/studio/${activeCompany?.id || ''}`, icon: Globe },
            { label: 'Company Workstation', href: `/company/${selectedCompanyId || ''}`, icon: Store },
          ],
        },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        {
          section: 'Admin Workspace',
          items: [
            { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { label: 'My Companies', href: '/admin/companies', icon: Building2 },
            { label: 'Universal QR Studio', href: '/admin/qr', icon: QrCode },
            { label: 'Lead Conversion', href: '/admin/leads', icon: UserCheck, badge: pendingLeadsCount > 0 ? pendingLeadsCount : undefined },
            { label: 'Team & Invitations', href: '/admin/team', icon: Users },
          ],
        },
        {
          section: 'Active Company Hub',
          items: [
            { label: 'Overview & Info', href: `/company/${selectedCompanyId || ''}`, icon: Store },
            { label: 'Website Studio', href: `/studio/${activeCompany?.id || ''}`, icon: Globe },
            { label: 'Products & Store', href: `/company/${selectedCompanyId || ''}/products`, icon: Store },
            { label: 'Reviews & Feedback', href: `/company/${selectedCompanyId || ''}/reviews`, icon: MessageSquare },
            { label: 'Offers & Updates', href: `/company/${selectedCompanyId || ''}/offers`, icon: Megaphone },
            { label: 'QR & Digital Stand', href: `/company/${selectedCompanyId || ''}/qr`, icon: QrCode },
          ],
        },
      ];
    }

    // SUB_ADMIN Role
    const subAdminItems: NavItem[] = [
      { label: 'Company Overview', href: `/company/${user.assignedCompanyId || ''}`, icon: Store },
    ];

    if (hasPermission('edit_website')) {
      subAdminItems.push({ label: 'Website Studio', href: `/studio/${user.assignedCompanyId || ''}`, icon: Globe });
    }
    if (hasPermission('manage_products')) {
      subAdminItems.push({ label: 'Products & Menu', href: `/company/${user.assignedCompanyId || ''}/products`, icon: Store });
    }
    if (hasPermission('moderate_reviews')) {
      subAdminItems.push({ label: 'Reviews Moderation', href: `/company/${user.assignedCompanyId || ''}/reviews`, icon: MessageSquare });
    }
    if (hasPermission('manage_offers')) {
      subAdminItems.push({ label: 'Offers & News', href: `/company/${user.assignedCompanyId || ''}/offers`, icon: Megaphone });
    }
    if (hasPermission('manage_hours') || hasPermission('edit_business_info')) {
      subAdminItems.push({ label: 'Business Profile & Hours', href: `/company/${user.assignedCompanyId || ''}/profile`, icon: Clock });
    }
    if (hasPermission('manage_qr')) {
      subAdminItems.push({ label: 'QR Codes', href: `/company/${user.assignedCompanyId || ''}/qr`, icon: QrCode });
    }
    if (hasPermission('view_analytics')) {
      subAdminItems.push({ label: 'Traffic Analytics', href: `/company/${user.assignedCompanyId || ''}/analytics`, icon: BarChart3 });
    }

    return [
      {
        section: 'Assigned Workstation',
        items: subAdminItems,
      },
    ];
  };

  const navSections = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Search filtering
  const filteredSearchCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17] text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Authenticating Command Center...</p>
        </div>
      </div>
    );
  }

  const isOwner = user.role === 'OWNER';

  return (
    <div className="min-h-screen flex bg-[#0B0F17] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* 1. DESKTOP SLEEK SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col border-r border-[#1E293B] bg-[#0E131F] transition-all duration-300 z-30 shrink-0 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <Link to={isOwner ? '/mastermind' : '/dashboard'} className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <span className="text-base tracking-tighter">N</span>
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-wider text-white">NABSITE</span>
                  {isOwner && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      MASTERMIND
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Command Center</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Multi-Tenant Company Quick Selector (if not collapsed) */}
        {!sidebarCollapsed && user.role !== 'SUB_ADMIN' && companies.length > 0 && (
          <div className="p-3 border-b border-[#1E293B] bg-[#121826]/70">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Active Company Scope
            </label>
            <div className="relative">
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  navigate(`/company/${e.target.value}`);
                }}
                className="w-full text-xs font-semibold rounded-xl border border-[#1E293B] bg-[#161F30] text-slate-200 py-2 pl-2.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              {!sidebarCollapsed && (
                <h4 className="px-3 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                  {sec.section}
                </h4>
              )}
              {sec.items.map((item, i) => {
                const Icon = item.icon;
                const normalizedPath = location.pathname.replace(/^\/mastermind/, '/owner');
                const normalizedHref = item.href.replace(/^\/mastermind/, '/owner');
                const isActive = location.pathname === item.href ||
                  normalizedPath === normalizedHref ||
                  (normalizedHref !== '/owner' && normalizedPath.startsWith(normalizedHref));
                return (
                  <Link
                    key={i}
                    to={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                        : 'text-slate-400 hover:bg-[#161F30] hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Upgrade / Platform Engine Card */}
        {!sidebarCollapsed && (
          <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-[#161F30] to-[#121826] border border-[#1E293B] space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>NABSITE Engine v2.4</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              24 Active Archetypes & High-Speed Distributed Runtime.
            </p>
            <Link to="/owner/verify" className="block">
              <button className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors shadow-md shadow-emerald-950/40">
                Run Verification
              </button>
            </Link>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0E131F]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {user.name.charAt(0)}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-emerald-400 font-medium truncate">{user.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F17]">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0E131F]/90 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Left: Mobile trigger & Greeting */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-slate-400 rounded-lg hover:bg-slate-800"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">Welcome back, {user.name.split(' ')[0]}</span>
                {isOwner && <span className="text-xs">👑</span>}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Here&apos;s what&apos;s happening with your platform today.
              </p>
            </div>
          </div>

          {/* Center / Right: Global Command Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#161F30] border border-[#1E293B] hover:border-slate-600 text-slate-400 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search companies, websites, leads, themes...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#121826] border border-[#1E293B] shadow-2xl p-4 space-y-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">System Notifications</span>
                    <span className="text-[10px] text-emerald-400 font-bold">3 New</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-xl bg-[#161F30] hover:bg-[#1A2438] transition-colors cursor-pointer text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{n.title}</span>
                          <span className="text-[9px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Public Site Link */}
            <Link
              to="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#1E293B] bg-[#161F30] text-slate-300 hover:text-white hover:border-emerald-500/50 transition-colors"
            >
              <span>Public Directory</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Quick Actions Dropdown / Profile */}
            <Link to={isOwner ? '/owner/settings' : '/admin'}>
              <div className="w-8 h-8 rounded-xl bg-[#161F30] border border-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#0E131F] border-b border-[#1E293B] p-4 space-y-4">
            {companies.length > 0 && user.role !== 'SUB_ADMIN' && (
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setMobileNavOpen(false);
                  navigate(`/company/${e.target.value}`);
                }}
                className="w-full text-xs font-semibold rounded-xl border border-[#1E293B] bg-[#161F30] text-slate-200 p-2.5"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {navSections.flatMap((s) => s.items).map((item, i) => (
                <Link
                  key={i}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl text-slate-300 hover:bg-[#161F30] hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal (CMD+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-xl bg-[#121826] rounded-3xl border border-[#1E293B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#1E293B] flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search companies, pages, websites, themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 space-y-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/owner/companies"
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161F30] hover:bg-[#1E293B] text-xs font-semibold text-slate-200"
                >
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Companies Vault</span>
                </Link>
                <Link
                  to="/owner/qr"
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161F30] hover:bg-[#1E293B] text-xs font-semibold text-slate-200"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Universal QR Studio</span>
                </Link>
                <Link
                  to="/owner/themes"
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161F30] hover:bg-[#1E293B] text-xs font-semibold text-slate-200"
                >
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Global Themes (24)</span>
                </Link>
                <Link
                  to="/owner/leads"
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161F30] hover:bg-[#1E293B] text-xs font-semibold text-slate-200"
                >
                  <UserCheck className="w-4 h-4 text-rose-400" />
                  <span>Lead Pipeline</span>
                </Link>
              </div>

              {searchQuery && (
                <div className="pt-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Companies Matching &quot;{searchQuery}&quot; ({filteredSearchCompanies.length})
                  </div>
                  {filteredSearchCompanies.slice(0, 6).map((c) => (
                    <Link
                      key={c.id}
                      to={`/owner/companies/${c.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#161F30] text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img src={c.logo} alt={c.name} className="w-6 h-6 rounded-lg object-cover bg-white" />
                        <div>
                          <span className="font-bold text-white">
                            <CompanyName name={c.name} maxWidth="max-w-[200px]" />
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">/c/{c.slug}</span>
                        </div>
                      </div>
                      <Badge variant={c.status === 'active' ? 'active' : 'draft'} size="sm">
                        {c.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
