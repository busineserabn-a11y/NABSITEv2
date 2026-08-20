import React, { useState, useEffect } from 'react';
import {
  Plus,
  Shield,
  UserCheck,
  KeyRound,
  Ban,
  CheckCircle2,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Lock,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { User, Company, SubAdminPermission, Role } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const AdminTeamPage: React.FC = () => {
  const { user: currentUser, resetPassword } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'SUB_ADMIN'>('ALL');

  // Password Generator Helper
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Nab#${randomPart}!${Math.floor(10 + Math.random() * 90)}`;
  };

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: Role;
    companyName?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SUB_ADMIN' as Role,
    companyId: '',
    permissions: ['manage_products', 'edit_website', 'manage_hours', 'moderate_reviews'] as SubAdminPermission[],
  });

  const isOwner = currentUser?.role === 'OWNER';

  const availablePermissions: { key: SubAdminPermission; label: string; desc: string }[] = [
    { key: 'manage_products', label: 'Manage Products & Menu', desc: 'Can add, edit, price, and toggle products' },
    { key: 'edit_website', label: 'Edit Website Draft', desc: 'Can customize theme and sections in Studio' },
    { key: 'manage_hours', label: 'Manage Operating Hours', desc: 'Can edit daily opening and closing hours' },
    { key: 'moderate_reviews', label: 'Moderate Customer Reviews', desc: 'Can approve, reject, or reply to reviews' },
    { key: 'manage_offers', label: 'Create Offers & News', desc: 'Can publish promotions and announcements' },
    { key: 'manage_qr', label: 'Download QR Stands', desc: 'Can configure and print physical stand QRs' },
    { key: 'view_analytics', label: 'View Traffic Analytics', desc: 'Can view visit metrics for the company' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, c] = await Promise.all([api.getUsers(), api.getCompanies()]);
      setUsers(u || []);
      setCompanies(c || []);
      if (c && c.length > 0 && !form.companyId) {
        setForm((prev) => ({ ...prev, companyId: c[0].id }));
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    const initialPass = generateSecurePassword();
    setForm({
      name: '',
      email: '',
      password: initialPass,
      role: isOwner ? 'ADMIN' : 'SUB_ADMIN',
      companyId: companies[0]?.id || '',
      permissions: ['manage_products', 'edit_website', 'manage_hours', 'moderate_reviews'],
    });
    setShowPassword(true);
    setCreateModalOpen(true);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (!form.password || form.password.trim().length < 6) {
      setFeedback({ type: 'error', message: 'Please provide a password of at least 6 characters.' });
      return;
    }
    if (form.role === 'SUB_ADMIN' && !form.companyId) {
      setFeedback({ type: 'error', message: 'Please select a company to assign to the Sub-Admin.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const targetCompany = companies.find((c) => c.id === form.companyId);
      const createdUser = await api.createUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        role: form.role,
        assignedCompanyId: form.role === 'SUB_ADMIN' ? form.companyId : '',
        assignedCompanyIds: form.role === 'SUB_ADMIN' && form.companyId ? [form.companyId] : [],
        permissions: form.role === 'ADMIN' ? (['all'] as any) : form.permissions,
        status: 'active',
      });

      setCreateModalOpen(false);
      setCreatedCredentials({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        role: form.role,
        companyName: targetCompany?.name,
      });

      setFeedback({
        type: 'success',
        message: `Account created for ${form.name} (${form.role}) with Firebase Authentication password credentials.`,
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create user account.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setActionLoading(true);
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await api.updateUser(user.id, { status: newStatus as any });
      setFeedback({
        type: 'success',
        message: `User ${user.name} has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change user status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReset = async (user: User) => {
    setActionLoading(true);
    try {
      await resetPassword(user.email);
      setFeedback({
        type: 'success',
        message: `Password reset email sent to ${user.email}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send password reset.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Revoke all platform access and delete account for ${user.name}?`)) return;
    setActionLoading(true);
    try {
      await api.deleteUser(user.id);
      setFeedback({
        type: 'success',
        message: `Account for ${user.name} has been revoked.`,
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user account.' });
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (perm: SubAdminPermission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const text = `🔐 NABSITE Staff Login Credentials
-----------------------------------
Name: ${createdCredentials.name}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}
Role: ${createdCredentials.role === 'ADMIN' ? 'Platform Admin' : 'Company Sub-Admin'}${
      createdCredentials.companyName ? `\nAssigned Business: ${createdCredentials.companyName}` : ''
    }
Login URL: ${window.location.origin}/login
-----------------------------------
Please sign in and change your password in settings upon first login.`;
    copyToClipboard(text, 'all');
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'ALL') return true;
    return u.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Staff & Team Management
          </h1>
          <p className="text-xs text-slate-500">
            Authorized account provisioning with Firebase Auth credentials for platform administrators and company managers.
          </p>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={openCreateModal}>
          Create Authorized Account
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setRoleFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            roleFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          All Accounts ({users.length})
        </button>
        <button
          onClick={() => setRoleFilter('ADMIN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            roleFilter === 'ADMIN'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Admins ({users.filter((u) => u.role === 'ADMIN').length})
        </button>
        <button
          onClick={() => setRoleFilter('SUB_ADMIN')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            roleFilter === 'SUB_ADMIN'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Sub-Admins ({users.filter((u) => u.role === 'SUB_ADMIN').length})
        </button>
      </div>

      <Table<User>
        isLoading={loading}
        data={filteredUsers}
        keyExtractor={(item: User) => item.id}
        columns={[
          {
            key: 'name',
            header: 'User Identity',
            render: (u: User) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {u.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <span className="font-bold text-slate-100 block text-xs">{u.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u: User) => (
              <Badge
                variant={u.role === 'OWNER' ? 'warning' : u.role === 'ADMIN' ? 'info' : 'neutral'}
                size="sm"
              >
                {u.role}
              </Badge>
            ),
          },
          {
            key: 'assignedCompanyId',
            header: 'Assigned Company',
            render: (u: User) => {
              if (u.role === 'OWNER' || u.role === 'ADMIN') {
                return <span className="text-xs text-amber-400 font-medium">All Companies</span>;
              }
              const comp = companies.find((c: Company) => c.id === u.assignedCompanyId);
              return <span className="text-xs font-medium text-slate-300">{comp?.name || 'Unassigned'}</span>;
            },
          },
          {
            key: 'status',
            header: 'Status',
            render: (u: User) => (
              <Badge variant={u.status === 'active' ? 'active' : 'pending'} size="sm">
                {u.status}
              </Badge>
            ),
          },
          {
            key: 'lastLoginAt',
            header: 'Last Active',
            render: (u: User) => (
              <span className="text-[11px] text-slate-400">
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never logged in'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (u: User) => {
              if (u.role === 'OWNER') {
                return <span className="text-[10px] text-slate-500">Root Account</span>;
              }
              return (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSendReset(u)}
                    disabled={actionLoading}
                    title="Send Password Reset Email"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(u)}
                    disabled={actionLoading}
                    title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      u.status === 'active'
                        ? 'bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300'
                        : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300'
                    }`}
                  >
                    {u.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDelete(u)}
                    disabled={actionLoading}
                    title="Revoke & Delete Account"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            },
          },
        ]}
      />

      {/* Create Account Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Authorized Staff Account"
        description="Provision an administrative or company manager account with direct Firebase Auth credentials."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="Full Name *"
            required
            placeholder="e.g. Bethlehem Assefa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            label="Email Address *"
            type="email"
            required
            placeholder="e.g. manager@restaurant.et"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* Password Input & Generator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Initial Password *
              </label>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, password: generateSecurePassword() }))}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter strong password (min 6 characters)"
                className="w-full text-xs font-mono rounded-xl border border-slate-700 py-2.5 pl-3 pr-20 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(form.password, 'form-pass')}
                  className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                  title="Copy Password"
                >
                  {copiedField === 'form-pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              The user can immediately log in with this password and will be prompted to manage credentials.
            </p>
          </div>

          {isOwner && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Staff Role *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'ADMIN' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.role === 'ADMIN'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-white">Platform Admin</p>
                  <p className="text-[10px] text-slate-400">Full access to manage companies and websites</p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'SUB_ADMIN' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.role === 'SUB_ADMIN'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs text-white">Company Sub-Admin</p>
                  <p className="text-[10px] text-slate-400">Scoped to single assigned business</p>
                </button>
              </div>
            </div>
          )}

          {form.role === 'SUB_ADMIN' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Assign to Company *
              </label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-900 text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.role === 'SUB_ADMIN' && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Granular Permission Scopes
              </label>
              <div className="space-y-2 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto bg-slate-900/50">
                {availablePermissions.map((p) => {
                  const isChecked = form.permissions.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.key)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-200">{p.label}</p>
                        <p className="text-[10px] text-slate-400">{p.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" size="md" disabled={actionLoading} className="w-full">
            {actionLoading ? 'Provisioning Account in Firebase...' : 'Provision Staff Account with Credentials'}
          </Button>
        </form>
      </Modal>

      {/* Handover & Credentials Confirmation Modal */}
      <Modal
        isOpen={Boolean(createdCredentials)}
        onClose={() => setCreatedCredentials(null)}
        title="Account Provisioned Successfully"
        description="Share these login credentials with the newly assigned staff member."
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Account has been created in Firebase Auth and registered to the system database.
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-white">{createdCredentials.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Assigned Role</span>
                <Badge variant={createdCredentials.role === 'ADMIN' ? 'warning' : 'neutral'} size="sm">
                  {createdCredentials.role === 'ADMIN' ? 'Platform Admin' : 'Company Sub-Admin'}
                </Badge>
              </div>

              {createdCredentials.companyName && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                  <span className="text-slate-400">Business Assignment</span>
                  <span className="font-bold text-amber-400">{createdCredentials.companyName}</span>
                </div>
              )}

              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Login Email</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-200">{createdCredentials.email}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.email, 'cred-email')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {copiedField === 'cred-email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Initial Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {createdCredentials.password}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.password, 'cred-pass')}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Copy Password"
                  >
                    {copiedField === 'cred-pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={copiedField === 'all' ? Check : Copy}
                onClick={copyAllCredentials}
              >
                {copiedField === 'all' ? 'Copied to Clipboard!' : 'Copy Full Login Package'}
              </Button>
              <Button
                variant="primary"
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
    </div>
  );
};
export default AdminTeamPage;
