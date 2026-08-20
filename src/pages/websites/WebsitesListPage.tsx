import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Check,
  X,
  FileCode,
  Layout,
  Database,
  Radio,
  RadioTower,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { Website, Company, WebsitePage } from '../../types';
import { THEME_REGISTRY } from '../../data/themes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { CompanyName } from '../../components/ui/CompanyName';

export const WebsitesListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [websites, setWebsites] = useState<Website[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'suspended'>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');

  // Action / Mutation States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCompanyId, setCreateCompanyId] = useState<string>('');
  const [createThemeId, setCreateThemeId] = useState<string>('theme_restaurant_classic');
  const [isCreating, setIsCreating] = useState(false);

  const [deleteTargetWebsite, setDeleteTargetWebsite] = useState<Website | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear notification messages automatically
  useEffect(() => {
    if (actionSuccessMsg) {
      const t = setTimeout(() => setActionSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccessMsg]);

  useEffect(() => {
    if (actionErrorMsg) {
      const t = setTimeout(() => setActionErrorMsg(null), 6000);
      return () => clearTimeout(t);
    }
  }, [actionErrorMsg]);

  // Load Real Firestore Data with Active Snapshot & Fallback
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [comps, webs] = await Promise.all([
        api.getCompanies(),
        api.getWebsites(),
      ]);
      setCompanies(comps);
      setWebsites(webs);
      setLastRefreshedAt(new Date().toLocaleTimeString());
      setIsFromCache(false);
    } catch (err: any) {
      console.error('Failed to load websites from Firestore:', err);
      const code = err.code || (err instanceof ApiError ? `ERR_${err.status}` : 'FIRESTORE_ERROR');
      setError({
        message: err.message || 'Failed to query real Firestore websites collection.',
        code,
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener with clean unsubscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      // First load companies
      api.getCompanies().then(setCompanies).catch(() => {});

      unsubscribe = api.subscribeWebsites(
        (updatedWebsites, fromCache) => {
          setWebsites(updatedWebsites);
          setIsFromCache(fromCache);
          setLoading(false);
          setError(null);
          setLastRefreshedAt(new Date().toLocaleTimeString());
        },
        (err, code) => {
          console.warn('Realtime subscription issue:', err);
          setError({
            message: err.message || 'Realtime subscription disconnected.',
            code,
          });
          setLoading(false);
        }
      );
    } catch (e: any) {
      console.error('Failed to subscribe to websites:', e);
      loadData();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Filter websites by User Authorization & Permissions
  const authorizedWebsites = useMemo(() => {
    if (!user) return [];

    let list = websites;

    // Sub-Admin role strictly restricted to assigned companies
    if (user.role === 'SUB_ADMIN') {
      const allowedCompanyIds = [
        user.assignedCompanyId,
        ...(user.assignedCompanyIds || []),
      ].filter(Boolean);
      list = list.filter((w) => allowedCompanyIds.includes(w.companyId));
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((w) => w.status === statusFilter);
    }

    // Theme filter
    if (themeFilter !== 'all') {
      list = list.filter((w) => w.themeId === themeFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((w) => {
        const comp = companies.find((c) => c.id === w.companyId);
        const compNameMatch = comp?.name?.toLowerCase().includes(q);
        const compSlugMatch = comp?.slug?.toLowerCase().includes(q);
        const webIdMatch = w.id.toLowerCase().includes(q);
        const themeMatch = w.themeId.toLowerCase().includes(q);
        return compNameMatch || compSlugMatch || webIdMatch || themeMatch;
      });
    }

    return list;
  }, [websites, companies, user, statusFilter, themeFilter, searchQuery]);

  // Companies without a website (candidates for quick website creation)
  const companiesWithoutWebsite = useMemo(() => {
    const existingWebCompIds = new Set(websites.map((w) => w.companyId));
    return companies.filter((c) => !existingWebCompIds.has(c.id));
  }, [companies, websites]);

  // Handle Quick Website Creation
  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCompanyId || isCreating) return;

    setIsCreating(true);
    setActionErrorMsg(null);
    try {
      const created = await api.createWebsite({
        companyId: createCompanyId,
        themeId: createThemeId,
        status: 'draft',
      });

      setIsCreateModalOpen(false);
      setCreateCompanyId('');
      setActionSuccessMsg(`Website for "${companies.find((c) => c.id === createCompanyId)?.name || 'Company'}" verified & created in Firestore!`);

      // Optionally navigate directly to studio
      navigate(`/studio/${created.companyId || created.id}`);
    } catch (err: any) {
      console.error('Website creation failed:', err);
      setActionErrorMsg(`Write failed: ${err.message || 'Unknown Firestore error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Publish / Unpublish Toggle with Read-After-Write Verification
  const handleTogglePublish = async (website: Website) => {
    setActionLoadingId(website.id);
    setActionErrorMsg(null);
    try {
      if (website.status === 'published') {
        await api.unpublishWebsite(website.id);
        setActionSuccessMsg(`Website "${website.id}" unpublished to draft.`);
      } else {
        await api.publishWebsite(website.id);
        setActionSuccessMsg(`Website "${website.id}" published to live network!`);
      }
    } catch (err: any) {
      console.error('Publish toggle error:', err);
      setActionErrorMsg(`Operation failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Real Firestore Document Deletion
  const handleDeleteWebsite = async () => {
    if (!deleteTargetWebsite || isDeleting) return;

    setIsDeleting(true);
    setActionErrorMsg(null);
    try {
      await api.deleteWebsite(deleteTargetWebsite.id);
      setActionSuccessMsg(`Website "${deleteTargetWebsite.id}" deleted from Firestore.`);
      setDeleteTargetWebsite(null);
    } catch (err: any) {
      console.error('Delete website error:', err);
      setActionErrorMsg(`Failed to delete website: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Websites Registry & Engine
                </h1>
                <Badge variant={isFromCache ? 'draft' : 'active'} size="sm">
                  {isFromCache ? '⚡ Cached Sync' : '🟢 Real Firestore'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Persistent website configurations mapped to verified enterprise companies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            icon={RefreshCw}
            className={loading ? 'animate-spin' : ''}
          >
            Refresh
          </Button>

          {user?.role !== 'SUB_ADMIN' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                if (companiesWithoutWebsite.length > 0) {
                  setCreateCompanyId(companiesWithoutWebsite[0].id);
                } else if (companies.length > 0) {
                  setCreateCompanyId(companies[0].id);
                }
                setIsCreateModalOpen(true);
              }}
            >
              Create Website
            </Button>
          )}
        </div>
      </div>

      {/* 2. Notifications & Status Alerts */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-[#0E131F] p-3.5 rounded-2xl border border-[#1E293B]">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company name, slug, website ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 text-xs rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses ({websites.length})</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Template Filter */}
        <div>
          <select
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-200 focus:outline-none focus:border-emerald-500 truncate"
          >
            <option value="all">All Templates (24 Archetypes)</option>
            {THEME_REGISTRY.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Main State Container (Loading / Error / Empty / Loaded) */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-[#0E131F] border border-[#1E293B] text-center space-y-4">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-200">Querying Firestore Websites...</p>
            <p className="text-xs text-slate-500">Establishing real-time snapshot connection with Google Cloud Firestore.</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-10 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-rose-200">Firestore Read Error</h3>
            <p className="text-xs font-mono text-rose-300/80 bg-rose-950/50 p-2.5 rounded-xl border border-rose-900/50 break-words">
              [{error.code}]: {error.message}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={loadData} icon={RefreshCw}>
            Retry Connection
          </Button>
        </div>
      ) : authorizedWebsites.length === 0 ? (
        <div className="p-14 rounded-3xl bg-[#0E131F] border border-[#1E293B] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#161F30] border border-[#1E293B] flex items-center justify-center text-slate-400 mx-auto">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Websites Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery || statusFilter !== 'all' || themeFilter !== 'all'
                ? 'No websites matched your active search and filter criteria.'
                : 'There are no active website documents configured in Firestore yet.'}
            </p>
          </div>
          {companies.length > 0 && user?.role !== 'SUB_ADMIN' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                if (companiesWithoutWebsite.length > 0) {
                  setCreateCompanyId(companiesWithoutWebsite[0].id);
                } else {
                  setCreateCompanyId(companies[0].id);
                }
                setIsCreateModalOpen(true);
              }}
            >
              Provision First Website
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {authorizedWebsites.map((web) => {
            const comp = companies.find((c) => c.id === web.companyId);
            const theme = THEME_REGISTRY.find((t) => t.id === web.themeId) || THEME_REGISTRY[0];
            const activeConfig = web.draftConfig || web.publishedConfig;
            const pagesCount = activeConfig?.pages?.length || 1;
            const featuresCount = activeConfig?.installedFeatures?.length || 0;
            const isActionLoading = actionLoadingId === web.id;

            return (
              <div
                key={web.id}
                className="rounded-3xl bg-[#0E131F] border border-[#1E293B] hover:border-slate-700 transition-all duration-200 p-5 flex flex-col justify-between space-y-5 group relative overflow-hidden"
              >
                {/* Header: Company Info & Status */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {comp?.logo ? (
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          className="w-10 h-10 rounded-xl object-cover bg-white shrink-0 border border-[#1E293B]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#161F30] border border-[#1E293B] flex items-center justify-center font-black text-xs text-slate-300 shrink-0">
                          {comp?.name?.charAt(0) || 'W'}
                        </div>
                      )}
                      <div className="truncate">
                        <h3 className="font-extrabold text-sm text-white truncate">
                          <CompanyName name={comp?.name || 'Unlinked Enterprise'} maxWidth="max-w-[200px]" />
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {comp ? `/c/${comp.slug}` : `ID: ${web.id}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge
                        variant={
                          web.status === 'published'
                            ? 'active'
                            : web.status === 'suspended'
                            ? 'danger'
                            : 'draft'
                        }
                        size="sm"
                      >
                        {web.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Template & Metadata Card */}
                  <div className="p-3 rounded-2xl bg-[#121826] border border-[#1E293B] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Template Theme
                      </span>
                      <span className="font-bold text-emerald-400 text-xs truncate max-w-[140px]">
                        {theme.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1E293B]/60 text-center">
                      <div className="p-1.5 rounded-xl bg-[#161F30]/60">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Pages</span>
                        <span className="text-xs font-black text-white">{pagesCount}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-[#161F30]/60">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Features</span>
                        <span className="text-xs font-black text-amber-400">{featuresCount}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-[#161F30]/60">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Version</span>
                        <span className="text-xs font-black text-cyan-400">v{web.version || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Open Studio */}
                    <Link to={`/studio/${web.companyId || web.id}`} className="w-full">
                      <Button variant="primary" size="sm" className="w-full" icon={Edit3}>
                        Studio Editor
                      </Button>
                    </Link>

                    {/* Live Preview */}
                    {comp?.slug ? (
                      <Link to={`/c/${comp.slug}`} target="_blank" className="w-full">
                        <Button variant="secondary" size="sm" className="w-full" icon={ExternalLink}>
                          View Live
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" size="sm" disabled className="w-full">
                        No Slug
                      </Button>
                    )}
                  </div>

                  {/* Secondary Operations */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleTogglePublish(web)}
                      disabled={isActionLoading}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors ${
                        web.status === 'published'
                          ? 'text-amber-400 hover:bg-amber-950/30'
                          : 'text-emerald-400 hover:bg-emerald-950/30'
                      }`}
                    >
                      {isActionLoading
                        ? 'Updating...'
                        : web.status === 'published'
                        ? 'Unpublish to Draft'
                        : 'Publish to Live'}
                    </button>

                    {user?.role === 'OWNER' && (
                      <button
                        onClick={() => setDeleteTargetWebsite(web)}
                        title="Delete Website"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create Website Modal with Read-After-Write Safety */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isCreating && setIsCreateModalOpen(false)}
        title="Provision Website Configuration"
      >
        <form onSubmit={handleCreateWebsite} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Attach a persistent Firestore website document to an existing enterprise profile.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Select Enterprise Company *
            </label>
            {companies.length === 0 ? (
              <p className="text-xs text-rose-400">No companies available. Please register a company first.</p>
            ) : (
              <select
                value={createCompanyId}
                onChange={(e) => setCreateCompanyId(e.target.value)}
                disabled={isCreating}
                required
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category}) - /c/{c.slug}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Initial Template Theme Archetype *
            </label>
            <select
              value={createThemeId}
              onChange={(e) => setCreateThemeId(e.target.value)}
              disabled={isCreating}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-[#161F30] border border-[#1E293B] text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {THEME_REGISTRY.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-[#121826] border border-[#1E293B] space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Included Default Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Includes 4 pre-configured core pages (Home, Menu & Offerings, About Us, Contact) with complete responsive sections and Firestore security validation.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isCreating || !createCompanyId}
              icon={Plus}
            >
              {isCreating ? 'Writing to Firestore...' : 'Create & Open Studio'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetWebsite}
        onClose={() => !isDeleting && setDeleteTargetWebsite(null)}
        title="Confirm Website Deletion"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
            Are you sure you want to permanently delete website <strong className="font-mono text-white">{deleteTargetWebsite?.id}</strong> from Firestore? This action will remove the website draft and published configuration.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTargetWebsite(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteWebsite}
              disabled={isDeleting}
              icon={Trash2}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
