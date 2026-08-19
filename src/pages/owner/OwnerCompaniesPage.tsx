import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Archive,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Sliders,
  Building2,
  Globe,
  Trash2,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Layers,
  ChevronRight,
  Phone,
  Mail,
  Send,
  MapPin,
  Clock,
  Palette,
  Eye,
  Check,
  Shield,
  Layout,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Category, User } from '../../types';
import { BUSINESS_CATEGORIES, getTemplatesByCategory } from '../../data/themes';
import { FEATURE_REGISTRY } from '../../data/features';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { CompanyName, getSmartShortName } from '../../components/ui/CompanyName';

export const OwnerCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<Company | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    variant?: 'danger' | 'warning' | 'primary';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // Multi-section Structured Form State for new company
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    category: 'Restaurant',
    shortDescription: '',
    phone: '+251 911 000 000',
    email: '',
    telegram: '',
    websiteUrl: '',
    address: 'Bole Road, Mega Building 4th Floor',
    city: 'Addis Ababa',
    mapLink: 'https://maps.google.com/?q=Addis+Ababa',
    openingHours: 'Mon - Sun: 8:00 AM - 10:00 PM',
    templateId: 'tpl_restaurant_signature',
    websiteType: 'menu_and_showcase',
    features: ['feature_store', 'feature_reviews', 'feature_hours', 'feature_location', 'feature_call', 'feature_telegram'],
    assignedAdminId: '',
    status: 'active' as 'active' | 'draft',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comps, cats, users] = await Promise.all([
        api.getCompanies(),
        api.getCategories(),
        api.getUsers(),
      ]);
      setCompanies(comps || []);
      setCategories(cats || []);
      setAdmins((users || []).filter((u: User) => u.role === 'ADMIN'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update shortName and suggested template whenever name or category changes
  const handleNameChange = (newName: string) => {
    const autoShort = getSmartShortName(newName);
    setForm((prev) => ({
      ...prev,
      name: newName,
      shortName: prev.shortName ? prev.shortName : autoShort,
      email: prev.email || `${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.et`,
    }));
  };

  const handleCategoryChange = (newCat: string) => {
    const categoryTemplates = getTemplatesByCategory(newCat);
    const suggestedTpl = categoryTemplates[0]?.id || 'tpl_restaurant_signature';
    setForm((prev) => ({
      ...prev,
      category: newCat,
      templateId: suggestedTpl,
    }));
  };

  const toggleFeature = (featId: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(featId)
        ? prev.features.filter((f) => f !== featId)
        : [...prev.features, featId],
    }));
  };

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateCompanyStatus(companyId, newStatus);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    setActionLoading(true);
    try {
      await api.deleteCompany(companyId);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const resetCreateForm = () => {
    setForm({
      name: '',
      shortName: '',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
      category: 'Restaurant',
      shortDescription: '',
      phone: '+251 911 000 000',
      email: '',
      telegram: '',
      websiteUrl: '',
      address: 'Bole Road, Mega Building 4th Floor',
      city: 'Addis Ababa',
      mapLink: 'https://maps.google.com/?q=Addis+Ababa',
      openingHours: 'Mon - Sun: 8:00 AM - 10:00 PM',
      templateId: 'tpl_restaurant_signature',
      websiteType: 'menu_and_showcase',
      features: ['feature_store', 'feature_reviews', 'feature_hours', 'feature_location', 'feature_call', 'feature_telegram'],
      assignedAdminId: '',
      status: 'active',
    });
    setCreatedResult(null);
    setCreateError(null);
    setCreateStep(1);
  };

  const handleCreateCompany = async (e: React.FormEvent, initialStatus: 'active' | 'draft' = 'active') => {
    if (e) e.preventDefault();
    if (!form.name || !form.category) return;
    setActionLoading(true);
    setCreateError(null);
    try {
      const created = await api.createCompany({
        ...form,
        status: initialStatus,
      });
      setCreatedResult(created);
      await fetchData();
    } catch (err: any) {
      console.error('Company creation failed:', err);
      setCreateError(err.message || 'Failed to create company. Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c: Company) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = companies.length;
  const activeCount = companies.filter((c) => c.status === 'active').length;
  const draftCount = companies.filter((c) => c.status === 'draft').length;
  const suspendedCount = companies.filter((c) => c.status === 'suspended').length;
  const publishedSitesCount = companies.filter((c) => c.websiteStatus === 'published').length;

  const currentCategoryTemplates = getTemplatesByCategory(form.category);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              NABSITE Master Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Companies Vault & Provisioning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage multi-tenant entities, launch websites, configure QR stands, and monitor commercial lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/owner/qr">
            <Button size="sm" variant="outline" icon={QrCode}>
              QR Studio
            </Button>
          </Link>
          <Button
            size="sm"
            variant="gold"
            icon={Plus}
            onClick={() => {
              setCreateStep(1);
              setCreateModalOpen(true);
            }}
            className="font-bold shadow-md"
          >
            Provision Company
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Entities
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Active Commercial
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Published Sites
          </span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{publishedSitesCount}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
            Draft Onboarding
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">{draftCount}</div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
            Suspended
          </span>
          <div className="text-2xl font-black text-rose-500 mt-1">{suspendedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, category, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'active', 'draft', 'suspended', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Master Table */}
      <Table<Company>
        isLoading={loading}
        data={filteredCompanies}
        keyExtractor={(item: Company) => item.id}
        columns={[
          {
            key: 'name',
            header: 'Company & Brand',
            render: (c: Company) => (
              <div className="flex items-center gap-3">
                <img
                  src={c.logo}
                  alt={c.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 max-w-[240px]">
                  <Link
                    to={`/owner/companies/${c.id}`}
                    className="font-bold text-xs text-slate-900 dark:text-white hover:text-amber-500 block truncate"
                  >
                    <CompanyName name={c.name} maxWidth="max-w-[200px]" />
                  </Link>
                  <a
                    href={`/c/${c.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono truncate"
                  >
                    /c/{c.slug} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Industry',
            render: (c: Company) => (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap">
                {c.category}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Lifecycle State',
            render: (c: Company) => (
              <Badge variant={c.status as any} size="sm">
                {c.status}
              </Badge>
            ),
          },
          {
            key: 'websiteStatus',
            header: 'Website Engine',
            render: (c: Company) => (
              <span className="text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.websiteStatus === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className={c.websiteStatus === 'published' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                  {c.websiteStatus}
                </span>
              </span>
            ),
          },
          {
            key: 'assignedAdminId',
            header: 'Assigned Admin',
            render: (c: Company) => {
              const admin = admins.find((a: User) => a.id === c.assignedAdminId);
              return (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate block max-w-[140px]">
                  {admin?.name || 'Unassigned'}
                </span>
              );
            },
          },
          {
            key: 'actions',
            header: 'Governance Controls',
            align: 'right',
            render: (c: Company) => (
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <Link to={`/owner/companies/${c.id}`}>
                  <Button size="sm" variant="gold" className="text-xs font-bold px-2.5 py-1 shadow-2xs">
                    Control
                  </Button>
                </Link>

                <Link to={`/studio/${c.id}`}>
                  <Button size="sm" variant="secondary" icon={Sparkles} className="text-xs px-2.5 py-1">
                    Studio
                  </Button>
                </Link>

                {c.status === 'active' && (
                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Suspend Commercial Company',
                        description: `Suspend ${c.name}?`,
                        variant: 'warning',
                        action: () => handleStatusChange(c.id, 'suspended'),
                      })
                    }
                    className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-bold transition-colors"
                    title="Suspend Company"
                    aria-label="Suspend Company"
                  >
                    Suspend
                  </button>
                )}

                {c.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'active')}
                    className="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold transition-colors"
                    title="Activate Company"
                    aria-label="Activate Company"
                  >
                    Activate
                  </button>
                )}

                {c.status !== 'archived' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'archived')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                    title="Archive Company"
                    aria-label="Archive Company"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}

                {c.status === 'archived' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'active')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 font-bold"
                    title="Restore Company"
                    aria-label="Restore Company"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Company Record',
                      description: `Permanently delete "${c.name}"? This action cannot be undone.`,
                      variant: 'danger',
                      action: () => handleDeleteCompany(c.id),
                    })
                  }
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 text-xs transition-colors"
                  title="Delete Company"
                  aria-label="Delete Company"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Structured Multi-Section Provision Company Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          if (createdResult) resetCreateForm();
        }}
        maxWidth="3xl"
        title={createdResult ? "Company Provisioned Successfully" : "Provision New Commercial Company"}
        description={
          createdResult
            ? "Your company entity, website layout, and QR system are now persisted in Cloud Firestore."
            : "Configure identity, communications, location, website template, and assign administrative control in one cohesive workflow."
        }
      >
        {createdResult ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {createdResult.name}
                    </h3>
                    <Badge variant="emerald" size="sm">
                      {createdResult.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Category: <span className="font-bold text-slate-700 dark:text-slate-200">{createdResult.category}</span> | Slug: <span className="font-mono text-amber-500">{createdResult.slug}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Live Website URL:</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    /c/{createdResult.slug}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Firestore Entity ID:</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {createdResult.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to={`/c/${createdResult.slug}`} className="w-full">
                <Button variant="primary" size="md" className="w-full font-bold flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>View Live Site</span>
                </Button>
              </Link>

              <Link to={`/studio/${createdResult.websiteId || createdResult.id}`} className="w-full">
                <Button variant="outline" size="md" className="w-full font-bold flex items-center justify-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Studio Customizer</span>
                </Button>
              </Link>

              <Link to={`/mastermind/companies/${createdResult.id}`} className="w-full">
                <Button variant="secondary" size="md" className="w-full font-bold flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Manage Entity</span>
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  resetCreateForm();
                  setCreateModalOpen(false);
                }}
              >
                Close Window
              </Button>
              <Button
                variant="gold"
                size="md"
                onClick={resetCreateForm}
                icon={Plus}
                className="font-bold shadow-md"
              >
                Provision Another Company
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {createError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Provisioning Failed</p>
                  <p className="mt-0.5 text-rose-300/80">{createError}</p>
                </div>
              </div>
            )}

            {/* Step Navigation Pills */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              {[
                { num: 1, title: 'Identity', icon: Building2 },
                { num: 2, title: 'Contact & Location', icon: MapPin },
                { num: 3, title: 'Template & Features', icon: Layout },
                { num: 4, title: 'Publishing', icon: Shield },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCreateStep(s.num)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    createStep === s.num
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <s.icon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] uppercase font-mono opacity-70">Step {s.num}</p>
                    <p className="truncate leading-none">{s.title}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Section 1: Company Identity */}
            {createStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Building2 className="w-4 h-4" /> 1. Company Identity & Branding
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Company Full Legal Name"
                      required
                      placeholder="e.g. Lucy Ethiopian Coffee Roastery & Lounge"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                    <Input
                      label="Short Name (for buttons & stands)"
                      placeholder="e.g. Lucy Coffee"
                      value={form.shortName}
                      onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                      helperText="Displayed in compact headers, badges, and QR stand cards."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Dropdown using rich Select component */}
                    <Select
                      label="Primary Business Category"
                      required
                      options={BUSINESS_CATEGORIES.map((cat) => ({
                        value: cat,
                        label: cat,
                        description: `Category templates and features for ${cat}`,
                      }))}
                      value={form.category}
                      onChange={handleCategoryChange}
                    />

                    <Input
                      label="Logo Image URL"
                      placeholder="https://... logo.png"
                      value={form.logo}
                      onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Cover Hero Banner URL"
                    placeholder="https://... cover.jpg"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  />

                  <Textarea
                    label="Description / Tagline"
                    rows={2}
                    placeholder="e.g. Specialty single-origin beans, traditional Ethiopian coffee roasting, and artisanal cafe experience."
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => setCreateStep(2)}
                    disabled={!form.name}
                    className="font-bold"
                  >
                    Continue to Contact & Location <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Section 2: Contact & Location */}
            {createStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Phone className="w-4 h-4" /> 2. Contact & Connectivity
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      icon={Phone}
                      placeholder="+251 911 000 000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <Input
                      label="Direct Email"
                      icon={Mail}
                      placeholder="contact@company.et"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Telegram Handle / Channel"
                      icon={Send}
                      placeholder="@company_et"
                      value={form.telegram}
                      onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                    />
                    <Input
                      label="Custom Domain (Optional)"
                      icon={Globe}
                      placeholder="company.et or company.com"
                      value={form.websiteUrl}
                      onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <MapPin className="w-4 h-4" /> Physical Location & Operating Hours
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Street Address / Building"
                      icon={MapPin}
                      placeholder="Bole Road, Mega Building 4th Floor"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    <Input
                      label="City / Region"
                      placeholder="Addis Ababa, Ethiopia"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Google Maps Direct Link"
                      placeholder="https://maps.google.com/?q=..."
                      value={form.mapLink}
                      onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
                    />
                    <Input
                      label="Operating Hours"
                      icon={Clock}
                      placeholder="Mon - Sun: 8:00 AM - 10:00 PM"
                      value={form.openingHours}
                      onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(1)}>
                    Back
                  </Button>
                  <Button variant="gold" size="md" onClick={() => setCreateStep(3)} className="font-bold">
                    Continue to Template & Features <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Section 3: Website Template & Features */}
            {createStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                      <Layout className="w-4 h-4" /> 3. Website Template Selection ({form.category})
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {currentCategoryTemplates.length} Bespoke Templates Available
                    </span>
                  </div>

                  {/* Template Selector Dropdown & Grid */}
                  <Select
                    label="Active Template Binding"
                    options={currentCategoryTemplates.map((t) => ({
                      value: t.id,
                      label: t.name,
                      description: t.description,
                    }))}
                    value={form.templateId}
                    onChange={(val) => setForm({ ...form, templateId: val })}
                  />

                  {/* Selected Template Preview Snapshot */}
                  {(() => {
                    const selectedTpl = currentCategoryTemplates.find((t) => t.id === form.templateId) || currentCategoryTemplates[0];
                    return (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs border border-slate-700">
                          {selectedTpl?.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {selectedTpl?.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {selectedTpl?.description}
                          </p>
                        </div>
                        <Badge variant="emerald" size="sm">
                          Default Palette
                        </Badge>
                      </div>
                    );
                  })()}
                </div>

                {/* Feature Modules Toggles */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Active Interactive Modules
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FEATURE_REGISTRY.map((feat) => {
                      const isChecked = form.features.includes(feat.id);
                      return (
                        <button
                          key={feat.id}
                          type="button"
                          onClick={() => toggleFeature(feat.id)}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-900 dark:text-amber-300 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                              isChecked
                                ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                : 'border-slate-300 dark:border-slate-600 bg-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate">{feat.name}</p>
                            <p className="text-[10px] opacity-70 line-clamp-1">{feat.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(2)}>
                    Back
                  </Button>
                  <Button variant="gold" size="md" onClick={() => setCreateStep(4)} className="font-bold">
                    Continue to Governance <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Section 4: Governance & Publishing */}
            {createStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                    <Shield className="w-4 h-4" /> 4. Platform Administration & Role Governance
                  </div>

                  <Select
                    label="Assign Platform Administrator"
                    options={[
                      { value: '', label: 'Unassigned (Mastermind Super-Admin only)' },
                      ...admins.map((a) => ({
                        value: a.id,
                        label: `${a.name} (${a.email})`,
                        description: `Role: ${a.role}`,
                      })),
                    ]}
                    value={form.assignedAdminId}
                    onChange={(val) => setForm({ ...form, assignedAdminId: val })}
                    helperText="The assigned administrator can edit products, reviews, and company settings."
                  />

                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Provision Summary
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Entity:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{form.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Category:</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{form.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Template:</span>{' '}
                        <span className="font-bold text-amber-500">{form.templateId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Modules:</span>{' '}
                        <span className="font-bold text-emerald-500">{form.features.length} enabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Save Draft vs Publish Live */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(3)}>
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={actionLoading}
                      onClick={(e) => handleCreateCompany(e, 'draft')}
                      className="font-bold"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      variant="gold"
                      size="md"
                      disabled={actionLoading}
                      onClick={(e) => handleCreateCompany(e, 'active')}
                      className="font-black shadow-md"
                    >
                      {actionLoading ? 'Provisioning in Firestore...' : 'Provision & Publish Live'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        description={confirmModal.description}
      >
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
            Cancel
          </Button>
          <Button
            variant={confirmModal.variant === 'danger' ? 'danger' : 'gold'}
            size="sm"
            onClick={confirmModal.action}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

