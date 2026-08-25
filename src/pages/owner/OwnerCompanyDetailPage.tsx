import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Sparkles,
  Palette,
  Users,
  BarChart3,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  Edit3,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Download,
  Trash2,
  Archive,
  Power,
  Layers,
  ShoppingBag,
  Star,
  Tag,
  Clock,
  Phone,
  Mail,
  MapPin,
  Send,
  Plus,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Code2,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SubModuleImportModal, SubModuleType } from '../../components/company/SubModuleImportModal';
import {
  Company,
  Website,
  Category,
  User,
  Product,
  Review,
  Offer,
  Announcement,
  AuditLog,
  ThemeDefinition,
  FeatureDefinition,
  QrConfig,
} from '../../types';
import { THEME_REGISTRY } from '../../data/themes';
import { FEATURE_REGISTRY } from '../../data/features';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';

export const OwnerCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [qrConfigs, setQrConfigs] = useState<QrConfig[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sub-module Import Modal State
  const [subImportModal, setSubImportModal] = useState<{
    isOpen: boolean;
    type: SubModuleType;
  }>({ isOpen: false, type: 'menu' });
  const [importMenuDropdownOpen, setImportMenuDropdownOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'info' | 'website' | 'features' | 'themes' | 'subadmins' | 'analytics' | 'audit' | 'qr'
  >('overview');

  // Form for company info editing
  const [infoForm, setInfoForm] = useState({
    name: '',
    slug: '',
    logo: '',
    coverImage: '',
    category: '',
    shortDescription: '',
    fullDescription: '',
    phone: '',
    email: '',
    address: '',
    mapLink: '',
    telegramUsername: '',
    telegramPhone: '',
    assignedAdminId: '',
    hours: [
      { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '14:00' },
      { day: 'Sunday', isOpen: false, openTime: '00:00', closeTime: '00:00' },
    ],
  });

  // QR Modal / Generator state inside detail page
  const [qrUrlInput, setQrUrlInput] = useState('');
  const [qrGeneratedData, setQrGeneratedData] = useState<{ dataUrl: string; normalizedUrl: string } | null>(null);
  const [qrGenerating, setQrGenerating] = useState(false);

  // Invite Sub-Admin Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteShowPassword, setInviteShowPassword] = useState(true);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    companyName: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Nab#${randomPart}!${Math.floor(10 + Math.random() * 90)}`;
  };

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    password: '',
    permissions: ['edit_business_info', 'manage_products', 'moderate_reviews'],
  });

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

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [compRes, cats, allUsers, prods, revs, offs, anns, allAudits, qrs] = await Promise.all([
        api.getCompany(id),
        api.getCategories(),
        api.getUsers(),
        api.getProducts(id).catch(() => []),
        api.getReviews(id).catch(() => []),
        api.getOffers(id).catch(() => []),
        api.getAnnouncements(id).catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getQrs(id).catch(() => []),
      ]);

      const comp: any = (compRes as any)?.company || compRes;
      if (comp) {
        setCompany(comp);
        setInfoForm({
          name: comp.name || '',
          slug: comp.slug || '',
          logo: comp.logo || '',
          coverImage: comp.coverImage || '',
          category: comp.category || 'General Business',
          shortDescription: comp.shortDescription || '',
          fullDescription: comp.fullDescription || '',
          phone: comp.phone || '',
          email: comp.email || '',
          address: comp.address || '',
          mapLink: comp.mapLink || '',
          telegramUsername: comp.telegramUsername || '',
          telegramPhone: comp.telegramPhone || '',
          assignedAdminId: comp.assignedAdminId || '',
          hours: comp.hours && comp.hours.length > 0 ? comp.hours : infoForm.hours,
        });

        // Initialize QR input
        const pubUrl = `https://nabsite.et/c/${comp.slug}`;
        setQrUrlInput(pubUrl);
      }

      if ((compRes as any)?.website) {
        setWebsite((compRes as any).website);
      } else if (comp?.websiteId) {
        api.getWebsite(comp.websiteId).then(setWebsite).catch(() => {});
      }

      setCategories(cats || []);
      setUsers(allUsers || []);
      setProducts(prods || []);
      setReviews(revs || []);
      setOffers(offs || []);
      setAnnouncements(anns || []);
      setQrConfigs(qrs || []);

      // Filter audit logs for this company
      const filteredAudits = (allAudits || []).filter(
        (a: AuditLog) => a.companyId === id || a.resourceId === id || (comp && a.metadata?.companyId === comp.id)
      );
      setAuditLogs(filteredAudits);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load company details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setActionLoading(true);
    try {
      const res: any = await api.updateCompany(company.id, infoForm);
      if (res) setCompany(res?.company || res);
      showNotification('Company information saved successfully.');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save company information.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!company) return;
    setActionLoading(true);
    try {
      const res: any = await api.updateCompanyStatus(company.id, newStatus);
      if (res) setCompany(res?.company || res);
      showNotification(`Company status transitioned to ${newStatus.toUpperCase()}.`);
    } catch (err: any) {
      showNotification(err.message || 'Failed to change company status.', true);
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleDeleteCompany = async () => {
    if (!company) return;
    setActionLoading(true);
    try {
      await api.deleteCompany(company.id);
      showNotification('Company deleted successfully.');
      setTimeout(() => {
        navigate('/owner/companies');
      }, 1000);
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete company.', true);
    } finally {
      setActionLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handlePublishWebsite = async () => {
    if (!website && !company) return;
    setActionLoading(true);
    try {
      const targetId = website?.id || company!.websiteId || company!.id;
      const res: any = await api.publishWebsite(targetId);
      if (res) setWebsite(res?.website || res);
      if (company) setCompany({ ...company, websiteStatus: 'published', status: company.status === 'draft' ? 'active' : company.status });
      showNotification('Website published successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish website.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublishWebsite = async () => {
    if (!website && !company) return;
    setActionLoading(true);
    try {
      const targetId = website?.id || company!.websiteId || company!.id;
      const res: any = await api.unpublishWebsite(targetId);
      if (res) setWebsite(res?.website || res);
      if (company) setCompany({ ...company, websiteStatus: 'unpublished' });
      showNotification('Website unpublished.');
    } catch (err: any) {
      showNotification(err.message || 'Failed to unpublish website.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyTheme = async (theme: ThemeDefinition) => {
    if (!website && !company) return;
    setActionLoading(true);
    try {
      const currentDraft = website?.draftConfig || (website as any)?.publishedConfig;
      const targetId = website?.id || company!.websiteId || company!.id;
      const updatedDraft = {
        ...(currentDraft || {}),
        design: {
          ...(currentDraft?.design || {}),
          primaryColor: theme.defaultPalette.primary,
          secondaryColor: theme.defaultPalette.secondary,
          accentColor: theme.defaultPalette.accent,
          bgColor: theme.defaultPalette.bg,
          surfaceColor: theme.defaultPalette.surface,
          textColor: theme.defaultPalette.text,
          mutedTextColor: theme.defaultPalette.muted,
          headingFont: theme.typography.headingFont,
          bodyFont: theme.typography.bodyFont,
        },
      };
      const res: any = await api.saveDraft(targetId, updatedDraft);
      if (res) setWebsite(res?.website || res);
      showNotification(`Applied archetype theme "${theme.name}" to website draft.`);
    } catch (err: any) {
      showNotification(err.message || 'Failed to apply theme.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeature = async (featureId: string, enabled: boolean) => {
    if (!website && !company) return;
    setActionLoading(true);
    try {
      const targetId = website?.id || company!.websiteId || company!.id;
      const currentDraft = website?.draftConfig || (website as any)?.publishedConfig || {};
      const installed = Array.isArray(currentDraft.installedFeatures) ? [...currentDraft.installedFeatures] : [];
      const existingIdx = installed.findIndex((f: any) => f.featureId === featureId);

      if (existingIdx >= 0) {
        installed[existingIdx].enabled = enabled;
      } else {
        installed.push({ featureId, enabled, installedAt: new Date().toISOString() });
      }

      const updatedDraft = { ...currentDraft, installedFeatures: installed };
      const res: any = await api.saveDraft(targetId, updatedDraft);
      if (res) setWebsite(res?.website || res);
      showNotification(`Feature ${enabled ? 'enabled' : 'disabled'} in website.`);
    } catch (err: any) {
      showNotification(err.message || 'Failed to update feature state.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!qrUrlInput) return;
    setQrGenerating(true);
    try {
      const res = await api.generateQr({
        url: qrUrlInput,
        size: 400,
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
      });
      setQrGeneratedData(res);
      showNotification('QR Code generated successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to generate QR Code.', true);
    } finally {
      setQrGenerating(false);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrGeneratedData?.dataUrl) return;
    const link = document.createElement('a');
    link.href = qrGeneratedData.dataUrl;
    link.download = `nabsite-qr-${company?.slug || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInviteSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !inviteForm.email || !inviteForm.name) return;
    if (!inviteForm.password || inviteForm.password.trim().length < 6) {
      showNotification('Please enter a password of at least 6 characters.', true);
      return;
    }
    setActionLoading(true);
    try {
      await api.createUser({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        password: inviteForm.password.trim(),
        role: 'SUB_ADMIN',
        assignedCompanyId: company.id,
        assignedCompanyIds: [company.id],
        permissions: inviteForm.permissions as any,
        status: 'active',
      });
      setInviteModalOpen(false);
      setCreatedCredentials({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        password: inviteForm.password.trim(),
        companyName: company.name,
      });
      setInviteForm({ name: '', email: '', password: '', permissions: ['edit_business_info', 'manage_products', 'moderate_reviews'] });
      showNotification(`Sub-Admin account created for ${inviteForm.email}`);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create sub-admin.', true);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
          <p className="text-sm font-semibold">Loading Company Command Center...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Company Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested company ID could not be loaded or was removed.</p>
        <Link to="/owner/companies">
          <Button size="sm" variant="primary">
            Return to Companies Vault
          </Button>
        </Link>
      </div>
    );
  }

  const subAdmins = users.filter((u) => u.role === 'SUB_ADMIN' && u.assignedCompanyId === company.id);
  const assignedAdmin = users.find((u) => u.id === company.assignedAdminId);
  const currentTheme = THEME_REGISTRY.find((t) => t.id === website?.themeId) || THEME_REGISTRY[0];
  const installedFeaturesList = website?.draftConfig?.installedFeatures || [];

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link to="/owner/companies">
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Vault
            </Button>
          </Link>
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{company.name}</h1>
              <Badge variant={company.status as any} size="sm">
                {company.status}
              </Badge>
              <Badge variant={website?.status === 'published' ? 'active' : 'draft'} size="sm">
                Site: {website?.status || company.websiteStatus}
              </Badge>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {company.category}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>ID: <code className="text-slate-700 dark:text-slate-300">{company.id}</code></span>
              <span>•</span>
              <Link to={`/c/${company.slug}`} target="_blank" className="text-amber-500 hover:underline flex items-center gap-1 font-semibold">
                /c/{company.slug} <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Action Buttons Cluster */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-module Bulk Ingestion Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              icon={FileSpreadsheet}
              onClick={() => setImportMenuDropdownOpen(!importMenuDropdownOpen)}
              className="text-xs font-bold"
            >
              Import Data ▾
            </Button>
            {importMenuDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                {[
                  { type: 'menu' as SubModuleType, label: 'Digital Menu Items' },
                  { type: 'pages' as SubModuleType, label: 'Website Custom Pages' },
                  { type: 'offers' as SubModuleType, label: 'Promotional Offers' },
                  { type: 'announcements' as SubModuleType, label: 'Announcements' },
                  { type: 'qr' as SubModuleType, label: 'QR Stand Configurations' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      setImportMenuDropdownOpen(false);
                      setSubImportModal({ isOpen: true, type: item.type });
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-amber-500/10 hover:text-amber-500 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to={`/c/${company.slug}`} target="_blank">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              View Site
            </Button>
          </Link>

          <Link to={`/studio/${company.id}`}>
            <Button size="sm" variant="gold" icon={Sparkles}>
              Open Studio
            </Button>
          </Link>

          {website?.status === 'published' ? (
            <Button size="sm" variant="outline" icon={Power} onClick={handleUnpublishWebsite} disabled={actionLoading}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" variant="primary" icon={CheckCircle} onClick={handlePublishWebsite} disabled={actionLoading}>
              Publish
            </Button>
          )}

          {company.status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  title: 'Suspend Commercial Company',
                  description: `Are you sure you want to suspend "${company.name}"? Their public website will display a maintenance/suspension notice.`,
                  variant: 'warning',
                  action: () => handleStatusChange('suspended'),
                })
              }
            >
              Suspend
            </Button>
          ) : company.status === 'suspended' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              onClick={() => handleStatusChange('active')}
            >
              Activate
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600 hover:bg-rose-50"
            icon={Trash2}
            onClick={() =>
              setConfirmModal({
                isOpen: true,
                title: 'Delete Company Record',
                description: `Permanently delete "${company.name}" and all associated products, websites, and QR configs? This action is irreversible.`,
                variant: 'danger',
                action: handleDeleteCompany,
              })
            }
          />
        </div>
      </div>

      {/* 8 High-Power Command Center Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
          { id: 'info', label: 'Company Info', icon: Edit3 },
          { id: 'website', label: 'Website Engine', icon: Globe },
          { id: 'features', label: 'Features (13+)', icon: Layers },
          { id: 'themes', label: 'Themes (24)', icon: Palette },
          { id: 'subadmins', label: `Sub-Admins (${subAdmins.length})`, icon: Users },
          { id: 'qr', label: 'QR Generator', icon: QrCode },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Products', value: products.length, icon: ShoppingBag, color: 'text-blue-500' },
              { label: 'Reviews', value: reviews.length, icon: Star, color: 'text-amber-500' },
              { label: 'Offers', value: offers.length, icon: Tag, color: 'text-purple-500' },
              { label: 'Announce', value: announcements.length, icon: Sparkles, color: 'text-rose-500' },
              { label: 'QR Scans', value: qrConfigs.reduce((s, q) => s + (q.scanCount || 0), 0), icon: QrCode, color: 'text-emerald-500' },
              { label: 'Sub-Admins', value: subAdmins.length, icon: Users, color: 'text-indigo-500' },
              { label: 'Features', value: installedFeaturesList.filter((f: any) => f.enabled).length, icon: Layers, color: 'text-cyan-500' },
              { label: 'Version', value: `v${website?.version || 1}`, icon: Globe, color: 'text-slate-500' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Icon className={`w-4 h-4 ${stat.color} mb-1`} />
                  <div className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Status Overview */}
            <Card variant="bordered" className="lg:col-span-2 space-y-4">
              <CardHeader>
                <CardTitle>Company Infrastructure & Governance</CardTitle>
                <CardDescription>Multi-tenant configuration, platform administrative mapping, and active theme.</CardDescription>
              </CardHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Design Archetype</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white">{currentTheme.name}</span>
                    <Badge variant="gold" size="sm">{currentTheme.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: currentTheme.defaultPalette.primary }} />
                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: currentTheme.defaultPalette.secondary }} />
                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: currentTheme.defaultPalette.accent }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Platform Admin Assignment</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {assignedAdmin ? `${assignedAdmin.name} (${assignedAdmin.email})` : 'Unassigned Platform Authority'}
                  </div>
                  <p className="text-[11px] text-slate-500">Owner maintains root supervisor access over all company mutations.</p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Primary Contact Methods</span>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {company.phone || 'No phone set'}</div>
                    <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {company.email || 'No email set'}</div>
                    <div className="flex items-center gap-1.5"><Send className="w-3 h-3 text-slate-400" /> @{company.telegramUsername || 'No telegram'}</div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Physical Stand QR</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {qrConfigs.length > 0 ? `${qrConfigs.length} QR Stand(s) configured` : 'Default QR ready for export'}
                  </div>
                  <Link to={`/company/${company.id}/qr`}>
                    <span className="text-amber-500 hover:underline font-semibold block mt-1">Open QR Stand Studio →</span>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Quick Action Panel */}
            <Card variant="bordered" className="space-y-4">
              <CardHeader>
                <CardTitle>Direct Actions</CardTitle>
                <CardDescription>Rapid company controls.</CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <Link to={`/studio/${company.id}`} className="block">
                  <Button variant="gold" size="sm" icon={Sparkles} className="w-full justify-start font-bold">
                    Customize in Website Studio
                  </Button>
                </Link>
                <Link to={`/c/${company.slug}`} target="_blank" className="block">
                  <Button variant="outline" size="sm" icon={ExternalLink} className="w-full justify-start">
                    Open Public Storefront
                  </Button>
                </Link>
                <Link to={`/company/${company.id}/wizard`} className="block">
                  <Button variant="secondary" size="sm" icon={Layers} className="w-full justify-start">
                    Launch Setup Wizard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" icon={QrCode} className="w-full justify-start" onClick={() => setActiveTab('qr')}>
                  Generate Custom QR Code
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY INFO */}
      {activeTab === 'info' && (
        <Card variant="bordered" className="p-6">
          <form onSubmit={handleSaveInfo} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Company Identity & Metadata</h3>
                <p className="text-xs text-slate-500">Update company credentials, logo, descriptions, and contact channels.</p>
              </div>
              <Button type="submit" variant="gold" size="sm" icon={Save} disabled={actionLoading}>
                Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                required
                value={infoForm.name}
                onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Business Category *
                </label>
                <select
                  value={infoForm.category}
                  onChange={(e) => setInfoForm({ ...infoForm, category: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Logo Image URL"
                value={infoForm.logo}
                onChange={(e) => setInfoForm({ ...infoForm, logo: e.target.value })}
              />
              <Input
                label="Cover Hero Banner Image URL"
                value={infoForm.coverImage}
                onChange={(e) => setInfoForm({ ...infoForm, coverImage: e.target.value })}
              />
            </div>

            <Input
              label="Short Tagline / Slogan"
              value={infoForm.shortDescription}
              onChange={(e) => setInfoForm({ ...infoForm, shortDescription: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Detailed Business Description
              </label>
              <textarea
                rows={3}
                value={infoForm.fullDescription}
                onChange={(e) => setInfoForm({ ...infoForm, fullDescription: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Direct Phone"
                value={infoForm.phone}
                onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
              />
              <Input
                label="Email Address"
                value={infoForm.email}
                onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
              />
              <Input
                label="Telegram Username (@)"
                value={infoForm.telegramUsername}
                onChange={(e) => setInfoForm({ ...infoForm, telegramUsername: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Physical Address"
                value={infoForm.address}
                onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
              />
              <Input
                label="Google Maps URL"
                value={infoForm.mapLink}
                onChange={(e) => setInfoForm({ ...infoForm, mapLink: e.target.value })}
              />
            </div>

            {/* Assigned Admin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Assigned Platform Administrator
              </label>
              <select
                value={infoForm.assignedAdminId}
                onChange={(e) => setInfoForm({ ...infoForm, assignedAdminId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Unassigned</option>
                {users
                  .filter((u) => u.role === 'ADMIN')
                  .map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} ({adm.email})
                    </option>
                  ))}
              </select>
            </div>

            <Button type="submit" variant="gold" size="md" icon={Save} disabled={actionLoading} className="font-bold">
              Save Company Info
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 3: WEBSITE ENGINE */}
      {activeTab === 'website' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Responsive Website State</h3>
                <Badge variant={website?.status === 'published' ? 'active' : 'draft'} size="sm">
                  {website?.status || 'draft'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Theme: <strong className="text-slate-800 dark:text-slate-200">{currentTheme.name}</strong> • Version: <strong>v{website?.version || 1}</strong>
                {website?.publishedAt && ` • Published: ${new Date(website.publishedAt).toLocaleDateString()}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/studio/${company.id}`}>
                <Button size="sm" variant="gold" icon={Sparkles}>
                  Open Full Studio
                </Button>
              </Link>
              {website?.status === 'published' ? (
                <Button size="sm" variant="outline" onClick={handleUnpublishWebsite} disabled={actionLoading}>
                  Unpublish
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={handlePublishWebsite} disabled={actionLoading}>
                  Publish Live
                </Button>
              )}
            </div>
          </div>

          {/* Pages in website */}
          <Card variant="bordered" className="p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Configured Website Pages</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(website?.draftConfig?.pages || []).map((p: any) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                    {p.isHome && <Badge variant="gold" size="sm">Home</Badge>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Slug: /{p.slug} • Sections: {p.sections?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: FEATURES */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Business Features Registry</h3>
              <p className="text-xs text-slate-500">Enable or disable modular functional capabilities for this company's website.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_REGISTRY.map((feat) => {
              const isEnabled = installedFeaturesList.some((f: any) => f.featureId === feat.id && f.enabled);
              return (
                <div
                  key={feat.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{feat.name}</h4>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 min-h-[36px]">{feat.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold">{feat.category}</span>
                    <button
                      onClick={() => handleToggleFeature(feat.id, !isEnabled)}
                      disabled={actionLoading}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        isEnabled
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                      }`}
                    >
                      {isEnabled ? 'Disable' : 'Enable Feature'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: THEMES */}
      {activeTab === 'themes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">24 Global Theme Archetypes</h3>
              <p className="text-xs text-slate-500">Select any archetype to immediately apply verified color palettes and typography.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {THEME_REGISTRY.map((thm) => {
              const isCurrent = website?.themeId === thm.id;
              return (
                <div
                  key={thm.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-900 border-amber-500 ring-2 ring-amber-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{thm.name}</h4>
                    {isCurrent && <Badge variant="gold" size="sm">Current</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px]">{thm.description}</p>

                  <div className="flex items-center gap-1.5 my-3">
                    <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: thm.defaultPalette.primary }} />
                    <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: thm.defaultPalette.secondary }} />
                    <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: thm.defaultPalette.accent }} />
                    <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: thm.defaultPalette.bg }} />
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div>Font: {thm.typography.headingFont} / {thm.typography.bodyFont}</div>
                  </div>

                  <Button
                    size="sm"
                    variant={isCurrent ? 'secondary' : 'gold'}
                    className="w-full mt-3 text-xs font-bold"
                    onClick={() => handleApplyTheme(thm)}
                    disabled={isCurrent || actionLoading}
                  >
                    {isCurrent ? 'Active Theme' : 'Apply Theme'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: SUB-ADMINS */}
      {activeTab === 'subadmins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Assigned Sub-Administrators</h3>
              <p className="text-xs text-slate-500">Business managers with granular scoped permissions for this company.</p>
            </div>
            <Button
              size="sm"
              variant="gold"
              icon={Plus}
              onClick={() => {
                setInviteForm({
                  name: '',
                  email: '',
                  password: generateSecurePassword(),
                  permissions: ['edit_business_info', 'manage_products', 'moderate_reviews'],
                });
                setInviteShowPassword(true);
                setInviteModalOpen(true);
              }}
            >
              Create Sub-Admin Account
            </Button>
          </div>

          <Table<User>
            data={subAdmins}
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'name',
                header: 'Sub-Admin Name & Email',
                render: (u) => (
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </div>
                ),
              },
              {
                key: 'permissions',
                header: 'Assigned Permissions',
                render: (u) => (
                  <div className="flex items-center gap-1 flex-wrap">
                    {(u.permissions || []).map((perm: string) => (
                      <span key={perm} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        {perm}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Account Status',
                render: (u) => (
                  <Badge variant={u.status === 'active' ? 'active' : 'draft'} size="sm">
                    {u.status || 'active'}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 7: REAL QR GENERATOR */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card variant="bordered" className="p-6 space-y-4">
            <CardHeader>
              <CardTitle>Real QR Code Generator & Stand</CardTitle>
              <CardDescription>
                Input any target URL to instantly generate a scannable, high-resolution QR code.
              </CardDescription>
            </CardHeader>

            <div className="space-y-3">
              <Input
                label="Target Web Address / URL *"
                placeholder="e.g. https://nabsite.et/c/lucy-coffee or yourcustomsite.com"
                value={qrUrlInput}
                onChange={(e) => setQrUrlInput(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="gold"
                  icon={QrCode}
                  onClick={handleGenerateQr}
                  disabled={!qrUrlInput || qrGenerating}
                  className="font-bold"
                >
                  {qrGenerating ? 'Encoding...' : 'Generate Real QR Code'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQrUrlInput(`https://nabsite.et/c/${company.slug}`)}
                >
                  Use Company URL
                </Button>
              </div>
            </div>

            {qrGeneratedData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-600 font-bold">
                  <span>✓ Encoded URL:</span>
                  <a href={qrGeneratedData.normalizedUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    {qrGeneratedData.normalizedUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </Card>

          {/* QR Stand Live Render */}
          <Card variant="bordered" className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            {qrGeneratedData ? (
              <div className="p-5 bg-white rounded-3xl border-4 border-slate-900 shadow-xl space-y-3 max-w-[280px]">
                <div className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
                  VERIFIED DIGITAL STOREFRONT
                </div>
                <img src={qrGeneratedData.dataUrl} alt="Generated QR" className="w-56 h-56 mx-auto rounded-lg" />
                <div className="font-extrabold text-xs text-slate-900 truncate">
                  {company.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  SCAN WITH CAMERA
                </div>
              </div>
            ) : (
              <div className="p-12 text-slate-400 space-y-2">
                <QrCode className="w-16 h-16 mx-auto opacity-40" />
                <p className="text-xs">Enter a URL and click Generate to preview QR stand badge.</p>
              </div>
            )}

            {qrGeneratedData && (
              <Button size="sm" variant="primary" icon={Download} onClick={handleDownloadQrPng} className="font-bold">
                Download High-Res PNG
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* TAB 8: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Total Scans</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {qrConfigs.reduce((acc, q) => acc + (q.scanCount || 0), 0)}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Reviews Received</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{reviews.length}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Products Listed</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Offers Active</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{offers.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Company Audit Trail</h3>
              <p className="text-xs text-slate-500">Tamper-evident log stream of all administrative events for {company.name}.</p>
            </div>
          </div>

          <Table<AuditLog>
            data={auditLogs}
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'timestamp',
                header: 'Timestamp',
                render: (log) => <span className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>,
              },
              {
                key: 'actor',
                header: 'Actor & Role',
                render: (log) => (
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">{log.actorName}</span>
                    <Badge variant={log.actorRole === 'OWNER' ? 'gold' : 'active'} size="sm">{log.actorRole}</Badge>
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Action',
                render: (log) => <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{log.action}</span>,
              },
              {
                key: 'result',
                header: 'Result',
                render: (log) => (
                  <Badge variant={log.result === 'SUCCESS' ? 'active' : 'suspended'} size="sm">
                    {log.result}
                  </Badge>
                ),
              },
            ]}
          />
        </div>
      )}

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
            variant={confirmModal.variant === 'danger' ? 'primary' : 'gold'}
            size="sm"
            onClick={confirmModal.action}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </div>
      </Modal>

      {/* Create / Invite Sub-Admin Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Create Sub-Administrator Account"
        description={`Grant scoped management access for ${company.name} with Firebase Auth login credentials.`}
      >
        <form onSubmit={handleInviteSubAdmin} className="space-y-4">
          <Input
            label="Sub-Admin Full Name *"
            required
            placeholder="e.g. Abebe Kebede"
            value={inviteForm.name}
            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
          />
          <Input
            label="Sub-Admin Email Address *"
            type="email"
            required
            placeholder="abebe@example.et"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          />

          {/* Initial Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Initial Password *
              </label>
              <button
                type="button"
                onClick={() => setInviteForm((prev) => ({ ...prev, password: generateSecurePassword() }))}
                className="text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <input
                type={inviteShowPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                placeholder="Enter password (min 6 characters)"
                className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 pl-3 pr-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInviteShowPassword(!inviteShowPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={inviteShowPassword ? 'Hide Password' : 'Show Password'}
                >
                  {inviteShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteForm.password);
                    setCopiedField('invite-pass');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-amber-500"
                  title="Copy Password"
                >
                  {copiedField === 'invite-pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              The sub-admin will use this password to sign in immediately.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assigned Scoped Permissions
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'edit_business_info', label: 'Edit Info' },
                { id: 'edit_website', label: 'Edit Website' },
                { id: 'manage_products', label: 'Manage Products' },
                { id: 'moderate_reviews', label: 'Moderate Reviews' },
                { id: 'manage_offers', label: 'Manage Offers' },
                { id: 'manage_announcements', label: 'Manage Announcements' },
                { id: 'view_analytics', label: 'View Analytics' },
                { id: 'manage_qr', label: 'Manage QR Stand' },
              ].map((p) => {
                const checked = inviteForm.permissions.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInviteForm({ ...inviteForm, permissions: [...inviteForm.permissions, p.id] });
                        } else {
                          setInviteForm({ ...inviteForm, permissions: inviteForm.permissions.filter((x) => x !== p.id) });
                        }
                      }}
                      className="rounded text-amber-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="gold" size="md" className="w-full font-bold" disabled={actionLoading}>
            {actionLoading ? 'Creating Account in Firebase...' : 'Create Sub-Admin Account'}
          </Button>
        </form>
      </Modal>

      {/* Handover & Credentials Confirmation Modal */}
      <Modal
        isOpen={Boolean(createdCredentials)}
        onClose={() => setCreatedCredentials(null)}
        title="Sub-Admin Account Created"
        description="Share these login credentials with the company manager."
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Account has been created in Firebase Auth and registered to {createdCredentials.companyName}.
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">Sub-Admin Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{createdCredentials.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">Business Assignment</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{createdCredentials.companyName}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500">Login Email</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-800 dark:text-slate-200">{createdCredentials.email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.email);
                      setCopiedField('sub-cred-email');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {copiedField === 'sub-cred-email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Initial Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-slate-950 px-2 py-1 rounded border border-amber-200 dark:border-slate-800">
                    {createdCredentials.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.password);
                      setCopiedField('sub-cred-pass');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    title="Copy Password"
                  >
                    {copiedField === 'sub-cred-pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={copiedField === 'sub-all' ? Check : Copy}
                onClick={() => {
                  const text = `🔐 NABSITE Sub-Admin Credentials
-----------------------------------
Company: ${createdCredentials.companyName}
Name: ${createdCredentials.name}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}
Login URL: ${window.location.origin}/login
-----------------------------------`;
                  navigator.clipboard.writeText(text);
                  setCopiedField('sub-all');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
              >
                {copiedField === 'sub-all' ? 'Copied to Clipboard!' : 'Copy Login Details'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="flex-1"
                onClick={() => setCreatedCredentials(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sub-Module Bulk Ingestion Modal */}
      {company && (
        <SubModuleImportModal
          isOpen={subImportModal.isOpen}
          onClose={() => setSubImportModal({ ...subImportModal, isOpen: false })}
          moduleType={subImportModal.type}
          companyId={company.id}
          companyName={company.name}
          companyKey={company.id.slice(0, 8)}
          onSuccess={() => {
            fetchData();
            showNotification(`Bulk ingestion for ${subImportModal.type} completed successfully.`);
          }}
        />
      )}
    </div>
  );
};
