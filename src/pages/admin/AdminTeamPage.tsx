import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { User, Company, SubAdminPermission } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const AdminTeamPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'SUB_ADMIN' as const,
    companyId: '',
    permissions: ['manage_products', 'edit_website', 'manage_hours', 'moderate_reviews'] as SubAdminPermission[],
  });

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.companyId) return;
    try {
      await api.inviteUser(form);
      setInviteModalOpen(false);
      setForm({
        name: '',
        email: '',
        role: 'SUB_ADMIN',
        companyId: companies[0]?.id || '',
        permissions: ['manage_products', 'edit_website', 'manage_hours', 'moderate_reviews'],
      });
      fetchData();
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Team & Delegated Sub-Admins
          </h1>
          <p className="text-xs text-slate-500">
            Invite restaurant managers, store operators, and assign granular permissions per company.
          </p>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={() => setInviteModalOpen(true)}>
          Invite Team Member
        </Button>
      </div>

      <Table<User>
        isLoading={loading}
        data={users}
        keyExtractor={(item: User) => item.id}
        columns={[
          {
            key: 'name',
            header: 'User Identity',
            render: (u: User) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                  {u.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">{u.name}</span>
                  <span className="text-[11px] text-slate-500">{u.email}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u: User) => (
              <Badge variant={u.role === 'ADMIN' ? 'info' : 'neutral'} size="sm">
                {u.role}
              </Badge>
            ),
          },
          {
            key: 'assignedCompanyId',
            header: 'Assigned Company',
            render: (u: User) => {
              const comp = companies.find((c: Company) => c.id === u.assignedCompanyId);
              return <span className="text-xs font-medium">{comp?.name || 'All Assigned'}</span>;
            },
          },
          {
            key: 'permissions',
            header: 'Granted Permissions',
            render: (u: User) => (
              <div className="flex flex-wrap gap-1 max-w-xs">
                {u.permissions && u.permissions.length > 0 ? (
                  u.permissions.map((p) => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {p.replace('manage_', '').replace('edit_', '')}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">Full Authority</span>
                )}
              </div>
            ),
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
        ]}
      />

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Sub-Admin Team Member"
        description="Delegate specific business management features for a company."
      >
        <form onSubmit={handleInvite} className="space-y-4">
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

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Assign to Company *
            </label>
            <select
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Granular Permission Scopes
            </label>
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
              {availablePermissions.map((p) => {
                const isChecked = form.permissions.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(p.key)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{p.label}</p>
                      <p className="text-[10px] text-slate-500">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Send Team Invitation
          </Button>
        </form>
      </Modal>
    </div>
  );
};
