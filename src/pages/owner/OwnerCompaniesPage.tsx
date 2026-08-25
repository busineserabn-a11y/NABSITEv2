import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ChevronDown,
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
  FileSpreadsheet,
  Upload,
  Utensils,
  Share2,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api, generateSlug } from '../../lib/api';
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
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Company Dropdown State
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  // Create One Company Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<number>(1);
  const [createProgressPhase, setCreateProgressPhase] = useState<
    'idle' | 'validating' | 'writing' | 'provisioning' | 'verifying' | 'success' | 'error'
  >('idle');
  const [createProgressText, setCreateProgressText] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<Company | null>(null);

  // Confirmation Modal
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

  // Comprehensive Single Company Form
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    category: 'Restaurant',
    shortDescription: '',
    fullDescription: '',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    phone: '+251 911 000 000',
    whatsapp: '+251 911 000 000',
    email: '',
    telegram: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    address: 'Bole Road, Next to Mega Building',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    mapLink: 'https://maps.google.com/?q=Bole+Addis+Ababa',
    openingHours: 'Mon - Sun: 8:00 AM - 10:00 PM',
    templateId: 'tpl_restaurant_signature',
    websiteType: 'menu_and_showcase',
    features: ['feature_store', 'feature_reviews', 'feature_hours', 'feature_location', 'feature_call', 'feature_telegram'],
    assignedAdminId: '',
    status: 'active' as 'active' | 'draft',
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      category: 'Restaurant',
      shortDescription: '',
      fullDescription: '',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
      phone: '+251 911 000 000',
      whatsapp: '+251 911 000 000',
      email: '',
      telegram: '',
      websiteUrl: '',
      facebookUrl: '',
      instagramUrl: '',
      tiktokUrl: '',
      address: 'Bole Road, Next to Mega Building',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      mapLink: 'https://maps.google.com/?q=Bole+Addis+Ababa',
      openingHours: 'Mon - Sun: 8:00 AM - 10:00 PM',
      templateId: 'tpl_restaurant_signature',
      websiteType: 'menu_and_showcase',
      features: ['feature_store', 'feature_reviews', 'feature_hours', 'feature_location', 'feature_call', 'feature_telegram'],
      assignedAdminId: '',
      status: 'active',
    });
    setCreatedResult(null);
    setCreateError(null);
    setCreateProgressPhase('idle');
    setCreateProgressText('');
    setCreateStep(1);
  };

  // Step-by-Step Robust Firestore Creation Flow
  const handleCreateCompany = async (e: React.FormEvent, initialStatus: 'active' | 'draft' = 'active') => {
    if (e) e.preventDefault();
    if (!form.name || !form.category) return;

    setActionLoading(true);
    setCreateError(null);
    setCreateProgressPhase('validating');
    setCreateProgressText('1. Validating company information and slug availability...');

    try {
      await new Promise((r) => setTimeout(r, 250));

      setCreateProgressPhase('writing');
      setCreateProgressText('2. Creating durable company record in Firestore...');

      const created = await api.createCompany({
        ...form,
        status: initialStatus,
      });

      setCreateProgressPhase('provisioning');
      setCreateProgressText('3. Provisioning website layout, digital menu, and QR stand...');
      await new Promise((r) => setTimeout(r, 300));

      setCreateProgressPhase('verifying');
      setCreateProgressText('4. Verifying database persistence...');

      // Real read verification
      const verified = await api.getCompany(created.id);
      setCreatedResult(verified);
      setCreateProgressPhase('success');
      setCreateProgressText('Company created successfully ✓');

      await fetchData();
    } catch (err: any) {
      console.error('Company creation failed:', err);
      setCreateProgressPhase('error');
      setCreateError(err.message || 'Failed to create company in Firestore. Please check your connection and retry.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c: Company) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.shortName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase());
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
      {/* Top Header & Primary Action Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              NABSITE Master Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Companies Vault & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Single company creation, bulk spreadsheet importing, and multi-tenant commercial lifecycle governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/owner/qr">
            <Button size="sm" variant="outline" icon={QrCode}>
              QR Studio
            </Button>
          </Link>

          {/* Primary Action: Add Company ▾ Dropdown */}
          <div className="relative" ref={addDropdownRef}>
            <button
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Company</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {addDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <button
                  onClick={() => {
                    setAddDropdownOpen(false);
                    resetCreateForm();
                    setCreateModalOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-500/10 text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Create One Company</div>
                    <div className="text-[10px] text-slate-400">Interactive multi-field creation form</div>
                  </div>
                </button>

                <Link
                  to="/owner/companies/import"
                  onClick={() => setAddDropdownOpen(false)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-500/10 text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-3 group block"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Import Many Companies</div>
                    <div className="text-[10px] text-slate-400">Excel / CSV bulk spreadsheet importer</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
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
            placeholder="Search by company name, short name, category, or slug..."
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
                  src={c.logo || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'}
                  alt={c.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 max-w-[220px]">
                  <Link
                    to={`/owner/companies/${c.id}`}
                    className="font-bold text-xs text-slate-900 dark:text-white hover:text-amber-500 block truncate"
                    title={c.name}
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
            key: 'shortName',
            header: 'Short Name',
            render: (c: Company) => {
              const short = c.shortName || getSmartShortName(c.name);
              return (
                <div className="group relative inline-block">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                    {short}
                  </span>
                  {/* Tooltip with full legal name */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 left-0 z-20 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                    Full Name: {c.name}
                  </div>
                </div>
              );
            },
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
            header: 'Status',
            render: (c: Company) => (
              <Badge variant={c.status as any} size="sm">
                {c.status}
              </Badge>
            ),
          },
          {
            key: 'websiteStatus',
            header: 'Website',
            render: (c: Company) => (
              <span className="text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.websiteStatus === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className={c.websiteStatus === 'published' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                  {c.websiteStatus || 'draft'}
                </span>
              </span>
            ),
          },
          {
            key: 'menuStatus',
            header: 'Digital Menu',
            render: (c: Company) => (
              <Link
                to={`/owner/companies/${c.id}?tab=menu`}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-500" />
                <span>Manage Menu</span>
              </Link>
            ),
          },
          {
            key: 'qrStatus',
            header: 'QR Stand',
            render: (c: Company) => (
              <Link
                to={`/owner/companies/${c.id}?tab=qr`}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-500 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-500" />
                <span>View QR</span>
              </Link>
            ),
          },
          {
            key: 'updatedAt',
            header: 'Last Updated',
            render: (c: Company) => (
              <span className="text-[11px] text-slate-400">
                {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'Recent'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Governance Controls',
            align: 'right',
            render: (c: Company) => (
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <Link to={`/owner/companies/${c.id}`}>
                  <Button size="sm" variant="gold" className="text-xs font-bold px-2.5 py-1 shadow-2xs">
                    Hub
                  </Button>
                </Link>

                <Link to={`/studio/${c.id}`}>
                  <Button size="sm" variant="secondary" icon={Sparkles} className="text-xs px-2.5 py-1">
                    Studio
                  </Button>
                </Link>

                {c.status === 'active' ? (
                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Suspend Commercial Company',
                        description: `Suspend ${c.name}? This will mark its status as suspended.`,
                        variant: 'warning',
                        action: () => handleStatusChange(c.id, 'suspended'),
                      })
                    }
                    className="px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-bold transition-colors"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(c.id, 'active')}
                    className="px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold transition-colors"
                  >
                    Activate
                  </button>
                )}

                <button
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Company & Associated Records',
                      description: `Are you sure you want to permanently delete "${c.name}"? This action cannot be undone.`,
                      variant: 'danger',
                      action: () => handleDeleteCompany(c.id),
                    })
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete Company"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* ========================================================================= */}
      {/* SINGLE COMPANY CREATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (!actionLoading) setCreateModalOpen(false);
        }}
        title="Create One Company"
        description="Comprehensive enterprise creation with instant Website, Digital Menu, and QR Stand initialization."
        maxWidth="3xl"
      >
        {/* Creation Progress or Success States */}
        {createProgressPhase === 'success' && createdResult ? (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Company Created Successfully ✓
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {createdResult.name} is permanently provisioned in Firestore with active web and QR capabilities.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Company ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{createdResult.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Public URL:</span>
                <a
                  href={`/c/${createdResult.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-amber-500 hover:underline flex items-center gap-1"
                >
                  /c/{createdResult.slug} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold">{createdResult.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to={`/owner/companies/${createdResult.id}`}>
                <Button variant="gold" size="md" icon={Building2} className="font-bold">
                  Open Company Hub
                </Button>
              </Link>
              <Link to={`/studio/${createdResult.id}`}>
                <Button variant="secondary" size="md" icon={Sparkles}>
                  Open Website Studio
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCreateForm();
                }}
              >
                Close & View Vault
              </Button>
            </div>
          </div>
        ) : actionLoading ? (
          <div className="space-y-6 text-center py-10">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Provisioning Company in Firestore...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {createProgressText || 'Processing database writes...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {createError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Company Creation Failed</p>
                  <p className="mt-0.5">{createError}</p>
                </div>
              </div>
            )}

            {/* Step Navigation Tabs */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              {[
                { num: 1, title: 'Identity & Brand', icon: Building2 },
                { num: 2, title: 'Contact & Location', icon: MapPin },
                { num: 3, title: 'Social & Media', icon: Share2 },
                { num: 4, title: 'Governance', icon: Shield },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCreateStep(s.num)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    createStep === s.num
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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

            {/* STEP 1: IDENTITY */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Full Name"
                    required
                    placeholder="e.g. Addis Gourmet Restaurant"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  <Input
                    label="Short Name (for stand cards & badges)"
                    placeholder="e.g. Addis Gourmet"
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    helperText="Displayed in compact headers, badges, and QR stand cards."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Business Category"
                    required
                    options={BUSINESS_CATEGORIES.map((cat) => ({
                      value: cat,
                      label: cat,
                      description: `Category templates and configurations for ${cat}`,
                    }))}
                    value={form.category}
                    onChange={handleCategoryChange}
                  />

                  <Input
                    label="Logo Image URL"
                    placeholder="https://... logo.jpg"
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  />
                </div>

                <Input
                  label="Cover / Hero Backdrop Image URL"
                  placeholder="https://... cover.jpg"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                />

                <Textarea
                  label="Short Description / Tagline"
                  rows={2}
                  placeholder="e.g. Fine Ethiopian and international dining experience in the heart of Bole."
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />

                <div className="flex justify-end pt-2">
                  <Button
                    variant="gold"
                    size="md"
                    onClick={() => setCreateStep(2)}
                    disabled={!form.name || !form.category}
                    className="font-bold"
                  >
                    Continue to Contact & Location <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & LOCATION */}
            {createStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    icon={Phone}
                    placeholder="+251 911 000 000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    label="WhatsApp Number"
                    icon={Phone}
                    placeholder="+251 911 000 000"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Official Email"
                    icon={Mail}
                    placeholder="contact@company.et"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    label="Operating Hours"
                    icon={Clock}
                    placeholder="Mon - Sun: 8:00 AM - 10:00 PM"
                    value={form.openingHours}
                    onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Street Address / Location"
                    icon={MapPin}
                    placeholder="Bole Road, Next to Mega Building"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="City"
                      placeholder="Addis Ababa"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <Input
                      label="Country"
                      placeholder="Ethiopia"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                </div>

                <Input
                  label="Google Maps URL"
                  placeholder="https://maps.google.com/?q=..."
                  value={form.mapLink}
                  onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
                />

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(1)}>
                    Back
                  </Button>
                  <Button variant="gold" size="md" onClick={() => setCreateStep(3)} className="font-bold">
                    Continue to Social & Media <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SOCIAL & ONLINE PRESENCE */}
            {createStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Telegram Handle / Channel"
                    icon={Send}
                    placeholder="https://t.me/company_et or @company"
                    value={form.telegram}
                    onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                  />
                  <Input
                    label="External Website URL (Optional)"
                    icon={Globe}
                    placeholder="https://company.et"
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Facebook URL"
                    placeholder="https://facebook.com/..."
                    value={form.facebookUrl}
                    onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                  />
                  <Input
                    label="Instagram URL"
                    placeholder="https://instagram.com/..."
                    value={form.instagramUrl}
                    onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                  />
                  <Input
                    label="TikTok URL"
                    placeholder="https://tiktok.com/@..."
                    value={form.tiktokUrl}
                    onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                  />
                </div>

                {/* Template Preset Selection */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Initial Website Template Preset ({form.category})
                    </span>
                    <span className="text-xs text-amber-500 font-bold">
                      {currentCategoryTemplates.length} Available
                    </span>
                  </div>

                  <Select
                    label="Select Template"
                    options={currentCategoryTemplates.map((t) => ({
                      value: t.id,
                      label: t.name,
                      description: t.description,
                    }))}
                    value={form.templateId}
                    onChange={(val) => setForm({ ...form, templateId: val })}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(2)}>
                    Back
                  </Button>
                  <Button variant="gold" size="md" onClick={() => setCreateStep(4)} className="font-bold">
                    Continue to Governance <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: GOVERNANCE & CREATION */}
            {createStep === 4 && (
              <div className="space-y-4">
                <Select
                  label="Assign Platform Administrator (Optional)"
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
                />

                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="font-bold uppercase text-slate-400 tracking-wider">
                    Creation Summary
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400">Entity:</span>{' '}
                      <span className="font-bold text-slate-900 dark:text-white">{form.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Short Name:</span>{' '}
                      <span className="font-bold font-mono text-amber-500">{form.shortName || getSmartShortName(form.name)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Category:</span>{' '}
                      <span className="font-bold">{form.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span>{' '}
                      <span className="font-bold">{form.city}, {form.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" size="md" onClick={() => setCreateStep(3)}>
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={(e) => handleCreateCompany(e, 'draft')}
                      disabled={actionLoading}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      variant="gold"
                      size="md"
                      onClick={(e) => handleCreateCompany(e, 'active')}
                      disabled={actionLoading}
                      className="font-black shadow-md"
                    >
                      Provision & Create in Firestore
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
