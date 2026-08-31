import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
import { AcademicYear, Company } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolAcademicYearsViewProps {
  company: Company;
  academicYears: AcademicYear[];
  onRefresh: () => void;
}

export const SchoolAcademicYearsView: React.FC<SchoolAcademicYearsViewProps> = ({
  company,
  academicYears,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calendarType: 'ETHIOPIAN' as 'ETHIOPIAN' | 'GREGORIAN',
    startDate: '',
    endDate: '',
    isActive: false,
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingYear(null);
    setFormData({
      name: '',
      calendarType: 'ETHIOPIAN',
      startDate: '',
      endDate: '',
      isActive: academicYears.length === 0,
      description: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      calendarType: year.calendarType,
      startDate: year.startDate || '',
      endDate: year.endDate || '',
      isActive: year.isActive,
      description: year.description || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSetActive = async (year: AcademicYear) => {
    if (year.isActive) return;
    try {
      await api.setActiveAcademicYear(company.id, year.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to set active year:', err);
      alert('Failed to set active academic year. Please retry.');
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (!window.confirm(`Are you sure you want to delete academic year "${year.name}"?`)) return;
    try {
      await api.deleteAcademicYear(year.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete year:', err);
      alert('Failed to delete academic year.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide an academic year name (e.g. 2017 E.C. or 2024-2025)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingYear) {
        await api.updateAcademicYear(editingYear.id, {
          companyId: company.id,
          name: formData.name,
          calendarType: formData.calendarType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          description: formData.description,
        });
      } else {
        await api.createAcademicYear({
          companyId: company.id,
          name: formData.name,
          calendarType: formData.calendarType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          description: formData.description,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save academic year:', err);
      setError(err.message || 'Failed to save academic year.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Academic Years Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure school sessions, Ethiopian and Gregorian calendars, and active terms.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={openCreateModal}>
          New Academic Year
        </Button>
      </div>

      {/* Grid of Academic Years */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {academicYears.map((year) => (
          <Card
            key={year.id}
            variant="bordered"
            padding="lg"
            className={`space-y-4 relative transition-all ${
              year.isActive
                ? 'border-amber-500/70 bg-gradient-to-b from-amber-500/5 to-transparent ring-2 ring-amber-500/20'
                : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{year.name}</h3>
                  {year.isActive && (
                    <Badge variant="active" size="sm">
                      Active Year
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {year.calendarType === 'ETHIOPIAN' ? '🇪🇹 Ethiopian Calendar' : '🌐 Gregorian Calendar'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(year)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(year)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Session Start:</span>
                <span className="font-semibold">{year.startDate || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Session End:</span>
                <span className="font-semibold">{year.endDate || 'Not specified'}</span>
              </div>
            </div>

            {year.description && (
              <p className="text-xs text-slate-500 line-clamp-2">{year.description}</p>
            )}

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(year.createdAt || Date.now()).toLocaleDateString()}
              </span>

              {!year.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActive(year)}
                  className="text-xs"
                >
                  Set as Active
                </Button>
              ) : (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Currently Selected
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                {editingYear ? 'Edit Academic Year' : 'Register New Academic Year'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Academic Year Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2017 E.C. (2024/2025)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Calendar System
                </label>
                <select
                  value={formData.calendarType}
                  onChange={(e) => setFormData({ ...formData, calendarType: e.target.value as any })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ETHIOPIAN">Ethiopian Calendar (E.C.)</option>
                  <option value="GREGORIAN">Gregorian Calendar (G.C.)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes regarding this school academic calendar..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded-sm border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Set as Active Academic Year (Default for Marklists & Roster)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" isLoading={saving} type="submit">
                  {editingYear ? 'Update Year' : 'Create Year'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
