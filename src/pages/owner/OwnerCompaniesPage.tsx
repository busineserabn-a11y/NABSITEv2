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
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Category, User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const OwnerCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Form State for new company
  const [form, setForm] = useState({
    name: '',
    category: 'Restaurant & Dining',
    shortDescription: '',
    phone: '',
    email: '',
    address: 'Addis Ababa, Ethiopia',
    assignedAdminId: '',
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

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category) return;
    setActionLoading(true);
    try {
      await api.createCompany(form);
      setCreateModalOpen(false);
      setForm({
        name: '',
        category: categories[0]?.name || 'General Business',
        shortDescription: '',
        phone: '',
        email: '',
        address: 'Addis Ababa, Ethiopia',
        assignedAdminId: '',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Companies Vault & Master Control Center
          </h1>
          <p className="text-xs text-slate-500">
            Multi-tenant governance, lifecycle state transitions, website engine bindings, and company provisioning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/owner/qr">
            <Button size="sm" variant="outline" icon={QrCode}>
              QR Studio
            </Button>
          </Link>
          <Button
            size="sm"
            variant="gold"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
            className="font-bold"
          >
            Provision Company
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Companies</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Active Commercial</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-blue-600 uppercase">Published Sites</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{publishedSitesCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-amber-500 uppercase">Draft Onboarding</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{draftCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-rose-500 uppercase">Suspended</span>
          <div className="text-2xl font-black text-rose-500 mt-1">{suspendedCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter companies by name, slug, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'draft', 'suspended', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <Table<Company>
        isLoading={loading}
        data={filteredCompanies}
        keyExtractor={(item: Company) => item.id}
        columns={[
          {
            key: 'name',
            header: 'Company & Identity',
            render: (c: Company) => (
              <div className="flex items-center gap-3">
                <img
                  src={c.logo}
                  alt={c.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <Link
                    to={`/owner/companies/${c.id}`}
                    className="font-bold text-xs text-slate-900 dark:text-white hover:text-amber-500 block"
                  >
                    {c.name}
                  </Link>
                  <a
                    href={`/c/${c.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    /c/{c.slug} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            render: (c: Company) => (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
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
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c.websiteStatus === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {c.websiteStatus}
              </span>
            ),
          },
          {
            key: 'assignedAdminId',
            header: 'Assigned Admin',
            render: (c: Company) => {
              const admin = admins.find((a: User) => a.id === c.assignedAdminId);
              return <span className="text-xs text-slate-600 dark:text-slate-400">{admin?.name || 'Unassigned'}</span>;
            },
          },
          {
            key: 'actions',
            header: 'Direct Controls',
            align: 'right',
            render: (c: Company) => (
              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                <Link to={`/owner/companies/${c.id}`}>
                  <Button size="sm" variant="gold" className="text-xs font-bold px-2.5 py-1">
                    Control Center
                  </Button>
                </Link>

                <Link to={`/studio/${c.id}`}>
                  <Button size="sm" variant="secondary" icon={Sparkles} className="text-xs px-2 py-1">
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
                    className="px-2 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-[11px] font-semibold"
                    title="Suspend Company"
                  >
                    Suspend
                  </button>
                )}

                {c.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'active')}
                    className="px-2 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold"
                    title="Activate Company"
                  >
                    Activate
                  </button>
                )}

                {c.status !== 'archived' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'archived')}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs"
                    title="Archive Company"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}

                {c.status === 'archived' && (
                  <button
                    onClick={() => handleStatusChange(c.id, 'active')}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3 h-3" /> Restore
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
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 text-xs"
                  title="Delete Company"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {/* Provision Company Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Commercial Company"
        description="Creates a new multi-tenant company entity and automatically initializes its default responsive draft website."
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name *"
            required
            placeholder="e.g. Lucy Ethiopian Coffee Roastery"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Primary Business Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Short Description / Tagline"
            placeholder="e.g. Specialty single-origin beans and artisanal roastery."
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+251 911 000 000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              placeholder="contact@company.et"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assign Platform Admin
            </label>
            <select
              value={form.assignedAdminId}
              onChange={(e) => setForm({ ...form, assignedAdminId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Select Platform Administrator...</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="gold" size="md" className="w-full font-bold" disabled={actionLoading}>
            {actionLoading ? 'Provisioning...' : 'Provision Company Entity'}
          </Button>
        </form>
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
            variant={confirmModal.variant === 'danger' ? 'primary' : 'gold'}
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
