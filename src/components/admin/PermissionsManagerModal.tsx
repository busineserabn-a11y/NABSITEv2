import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Check,
  X,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Lock,
  Layers,
  Utensils,
  Globe,
  Star,
  Tag,
  Megaphone,
  MessageSquare,
  QrCode,
  BarChart3,
  Image,
  Settings,
} from 'lucide-react';
import { User, Company, Role } from '../../types';
import {
  PERMISSION_MODULES,
  ACTION_LABELS,
  PermissionModule,
  PermissionAction,
  PermissionMatrix,
  normalizePermissionMatrix,
  DEFAULT_ADMIN_MATRIX,
  DEFAULT_SUB_ADMIN_MATRIX,
  READ_ONLY_MATRIX,
  CONTENT_CREATOR_MATRIX,
  countPermissions,
} from '../../lib/permissions';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface PermissionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  companies: Company[];
  onPermissionsUpdated: (updatedUser: User) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Building2,
  Globe,
  Sparkles,
  Utensils,
  ShoppingBag: Utensils,
  Star,
  Tag,
  Megaphone,
  MessageSquare,
  QrCode,
  BarChart3,
  Image,
  Settings,
};

export const PermissionsManagerModal: React.FC<PermissionsManagerModalProps> = ({
  isOpen,
  onClose,
  user,
  companies,
  onPermissionsUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [assignedAllCompanies, setAssignedAllCompanies] = useState(true);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'core' | 'content' | 'operations' | 'system'>('all');

  // Initialize state when user changes
  useEffect(() => {
    if (user) {
      setMatrix(normalizePermissionMatrix(user));
      setAssignedAllCompanies(
        user.assignedAllCompanies !== false && user.role !== 'SUB_ADMIN'
      );
      
      const compIds: string[] = [];
      if (user.assignedCompanyId) compIds.push(user.assignedCompanyId);
      if (user.assignedCompanyIds) {
        user.assignedCompanyIds.forEach((id) => {
          if (!compIds.includes(id)) compIds.push(id);
        });
      }
      setSelectedCompanyIds(compIds);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user]);

  if (!user) return null;

  const isOwnerViewing = currentUser?.role === 'OWNER';

  // Toggle single action for a module
  const toggleAction = (module: PermissionModule, action: PermissionAction) => {
    setMatrix((prev) => {
      const currentActions = prev[module] || [];
      const hasAction = currentActions.includes(action);
      let newActions: PermissionAction[];

      if (hasAction) {
        newActions = currentActions.filter((a) => a !== action);
      } else {
        newActions = [...currentActions, action];
      }

      return {
        ...prev,
        [module]: newActions,
      };
    });
  };

  // Toggle all actions for a given module
  const toggleAllModuleActions = (modDef: (typeof PERMISSION_MODULES)[0]) => {
    const currentActions = matrix[modDef.key] || [];
    const allSelected = modDef.supportedActions.every((a) => currentActions.includes(a));

    setMatrix((prev) => ({
      ...prev,
      [modDef.key]: allSelected ? [] : [...modDef.supportedActions],
    }));
  };

  // Toggle single action across all modules
  const toggleColumnAction = (action: PermissionAction) => {
    const applicableModules = PERMISSION_MODULES.filter((m) => m.supportedActions.includes(action));
    const allHaveIt = applicableModules.every((m) => (matrix[m.key] || []).includes(action));

    setMatrix((prev) => {
      const next = { ...prev };
      applicableModules.forEach((m) => {
        const current = next[m.key] || [];
        if (allHaveIt) {
          next[m.key] = current.filter((a) => a !== action);
        } else {
          if (!current.includes(action)) {
            next[m.key] = [...current, action];
          }
        }
      });
      return next;
    });
  };

  // Apply Presets
  const applyPreset = (type: 'full' | 'subadmin' | 'creator' | 'readonly') => {
    switch (type) {
      case 'full':
        setMatrix(DEFAULT_ADMIN_MATRIX);
        break;
      case 'subadmin':
        setMatrix(DEFAULT_SUB_ADMIN_MATRIX);
        break;
      case 'creator':
        setMatrix(CONTENT_CREATOR_MATRIX);
        break;
      case 'readonly':
        setMatrix(READ_ONLY_MATRIX);
        break;
    }
  };

  // Toggle company assignment
  const toggleCompany = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  // Save handler
  const handleSave = async () => {
    if (!isOwnerViewing) {
      setErrorMsg('Unauthorized: Only the platform Owner can modify permissions.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Convert matrix to legacy string array for backward compatibility
      const legacyPerms: string[] = [];
      if (matrix.studio?.includes('edit') || matrix.websites?.includes('edit')) {
        legacyPerms.push('edit_website');
      }
      if (matrix.products?.includes('edit') || matrix.menu?.includes('edit')) {
        legacyPerms.push('manage_products', 'manage_categories', 'manage_prices');
      }
      if (matrix.reviews?.includes('edit') || matrix.reviews?.includes('publish')) {
        legacyPerms.push('moderate_reviews');
      }
      if (matrix.offers?.includes('edit') || matrix.announcements?.includes('edit')) {
        legacyPerms.push('manage_offers', 'manage_announcements');
      }
      if (matrix.qr?.includes('edit') || matrix.qr?.includes('create')) {
        legacyPerms.push('manage_qr');
      }
      if (matrix.analytics?.includes('view')) {
        legacyPerms.push('view_analytics');
      }
      if (matrix.companies?.includes('edit')) {
        legacyPerms.push('edit_business_info', 'manage_hours');
      }

      const updatedUser = await api.updateUserPermissions(user.id, {
        permissionMatrix: matrix as any,
        permissions: legacyPerms as any,
        assignedCompanyIds: selectedCompanyIds,
        assignedAllCompanies: user.role === 'ADMIN' ? assignedAllCompanies : false,
        actor: {
          id: currentUser?.id || 'owner_master',
          name: currentUser?.name || 'Platform Owner',
          role: currentUser?.role || 'OWNER',
          email: currentUser?.email || 'owner@nabsite.io',
        },
      });

      setSuccessMsg('Permissions & access scopes updated and persisted successfully in Firestore.');
      onPermissionsUpdated(updatedUser);

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredModules = PERMISSION_MODULES.filter(
    (m) => activeCategoryFilter === 'all' || m.category === activeCategoryFilter
  );

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.category.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(companySearch.toLowerCase())
  );

  const totalPermsCount = countPermissions(matrix);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Owner Permissions & Scope Control
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  Owner Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configuring access matrix for <span className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</span> ({user.email}) • Role: <Badge variant="neutral">{user.role}</Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {totalPermsCount} Active Grants
              </div>
              <div className="text-[10px] text-slate-500">Live Granular Policy</div>
            </div>
          </div>
        </div>

        {/* Security Notices */}
        {!isOwnerViewing && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Only users with the verified <strong>OWNER</strong> role have authorization to update permissions.</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Presets & Category Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>Presets:</span>
            </span>
            <button
              type="button"
              onClick={() => applyPreset('full')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              Full Access
            </button>
            <button
              type="button"
              onClick={() => applyPreset('subadmin')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              Company Manager
            </button>
            <button
              type="button"
              onClick={() => applyPreset('creator')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              Content Creator
            </button>
            <button
              type="button"
              onClick={() => applyPreset('readonly')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              Read-Only
            </button>
          </div>

          <div className="flex items-center space-x-1 self-end sm:self-auto">
            {(['all', 'core', 'content', 'operations', 'system'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                  activeCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Company Scope Selector */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Assigned Company Scope</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determine which business storefronts this user is authorized to manage.
              </p>
            </div>

            {user.role === 'ADMIN' && (
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={assignedAllCompanies}
                  onChange={(e) => setAssignedAllCompanies(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
                <span>Unrestricted All Companies (Master Scope)</span>
              </label>
            )}
          </div>

          {(!assignedAllCompanies || user.role === 'SUB_ADMIN') && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search companies by name or category..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredCompanies.map((c) => {
                  const isSelected = selectedCompanyIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompany(c.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{c.category}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{selectedCompanyIds.length} companies specifically assigned</span>
                {selectedCompanyIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCompanyIds([])}
                    className="text-amber-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Granular Permission Matrix Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-900 dark:text-white w-1/3">
                    Module & Capability
                  </th>
                  {(['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'export', 'manage'] as PermissionAction[]).map(
                    (action) => (
                      <th
                        key={action}
                        className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => toggleColumnAction(action)}
                        title={`Click to toggle ${ACTION_LABELS[action].label} across all modules`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{ACTION_LABELS[action].label}</span>
                          <span className="text-[9px] text-slate-400 font-normal">Toggle</span>
                        </div>
                      </th>
                    )
                  )}
                  <th className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Row
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {filteredModules.map((mod) => {
                  const IconComp = ICON_MAP[mod.icon] || Layers;
                  const currentActions = matrix[mod.key] || [];
                  const isAllSelected = mod.supportedActions.every((a) => currentActions.includes(a));

                  return (
                    <tr
                      key={mod.key}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 mt-0.5">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                              <span>{mod.label}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono">
                                {mod.key}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {(['view', 'create', 'edit', 'delete', 'publish', 'unpublish', 'export', 'manage'] as PermissionAction[]).map(
                        (action) => {
                          const isSupported = mod.supportedActions.includes(action);
                          const isChecked = currentActions.includes(action);

                          if (!isSupported) {
                            return (
                              <td key={action} className="py-3 px-2 text-center text-slate-300 dark:text-slate-700">
                                •
                              </td>
                            );
                          }

                          return (
                            <td key={action} className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAction(mod.key, action)}
                                className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800 text-transparent hover:border-amber-400 border border-slate-200 dark:border-slate-700'
                                }`}
                                title={`${ACTION_LABELS[action].label} ${mod.label}`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            </td>
                          );
                        }
                      )}

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAllModuleActions(mod)}
                          className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                            isAllSelected
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {isAllSelected ? 'All' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Changes will be instantly logged in the zero-trust audit trail.</span>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!isOwnerViewing || isSaving}
              icon={Save}
            >
              Save Permissions & Scope
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
