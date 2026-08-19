import React, { useState, useEffect } from 'react';
import { Plus, Shield, UserCheck, KeyRound, Ban, CheckCircle2, Trash2, Filter } from 'lucide-react';
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

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (form.role === 'SUB_ADMIN' && !form.companyId) {
      setFeedback({ type: 'error', message: 'Please select a company to assign to the Sub-Admin.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await api.createUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        assignedCompanyId: form.role === 'SUB_ADMIN' ? form.companyId : '',
        assignedCompanyIds: form.role === 'SUB_ADMIN' && form.companyId ? [form.companyId] : [],
        permissions: form.role === 'ADMIN' ? (['all'] as any) : form.permissions,
        status: 'active',
      });

      // Optionally send welcome password reset trigger
      try {
        await resetPassword(form.email.trim().toLowerCase());
      } catch {
        // Safe ignore if user auth not yet initialized in firebase auth
      }

      setCreateModalOpen(false);
      setForm({
        name: '',
        email: '',
        role: isOwner ? 'ADMIN' : 'SUB_ADMIN',
        companyId: companies[0]?.id || '',
        permissions: ['manage_products', 'edit_website', 'manage_hours', 'moderate_reviews'],
      });
      setFeedback({
        type: 'success',
        message: `Account created for ${form.name} (${form.role}). An initial password setup email has been dispatched.`,
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
            Authorized account provisioning for NABSITE platform administrators and delegated company managers.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          icon={Plus}
          onClick={() => {
            setForm((prev) => ({ ...prev, role: isOwner ? 'ADMIN' : 'SUB_ADMIN' }));
            setCreateModalOpen(true);
          }}
        >
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
        description="Provision a verified administrative or company manager account."
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
                className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-900 text-slate-200"
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
            {actionLoading ? 'Creating Account...' : 'Provision Staff Account'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
