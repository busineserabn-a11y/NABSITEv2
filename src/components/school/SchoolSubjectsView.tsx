import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Subject, Grade, Company } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolSubjectsViewProps {
  company: Company;
  subjects: Subject[];
  grades: Grade[];
  onRefresh: () => void;
  onOpenMarklistForSubject?: (subjectId: string) => void;
}

export const SchoolSubjectsView: React.FC<SchoolSubjectsViewProps> = ({
  company,
  subjects,
  grades,
  onRefresh,
  onOpenMarklistForSubject,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    maxScore: 100,
    isCommon: true,
    gradeIds: [] as string[],
    description: '',
  });
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      maxScore: 100,
      isCommon: true,
      gradeIds: grades.map((g) => g.id),
      description: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      code: sub.code || '',
      maxScore: sub.maxScore || 100,
      isCommon: sub.isCommon ?? false,
      gradeIds: sub.gradeIds || [],
      description: sub.description || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (sub: Subject) => {
    if (!window.confirm(`Are you sure you want to delete subject "${sub.name}"?`)) return;
    try {
      await api.deleteSubject(sub.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete subject:', err);
      alert('Failed to delete subject.');
    }
  };

  const handleGradeCheckbox = (gradeId: string) => {
    setFormData((prev) => {
      const exists = prev.gradeIds.includes(gradeId);
      const nextIds = exists ? prev.gradeIds.filter((id) => id !== gradeId) : [...prev.gradeIds, gradeId];
      return { ...prev, gradeIds: nextIds };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a subject title (e.g. Mathematics)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          companyId: company.id,
          name: formData.name,
          code: formData.code,
          maxScore: Number(formData.maxScore),
          isCommon: formData.isCommon,
          gradeIds: formData.isCommon ? [] : formData.gradeIds,
          description: formData.description,
        });
      } else {
        await api.createSubject({
          companyId: company.id,
          name: formData.name,
          code: formData.code,
          maxScore: Number(formData.maxScore),
          isCommon: formData.isCommon,
          gradeIds: formData.isCommon ? [] : formData.gradeIds,
          description: formData.description,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save subject:', err);
      setError(err.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  // Filter subjects by grade tab
  const filteredSubjects = subjects.filter((sub) => {
    if (selectedGradeFilter === 'ALL') return true;
    return sub.isCommon || (sub.gradeIds && sub.gradeIds.includes(selectedGradeFilter));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-500" />
            Curriculum Subjects Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Course codes, maximum assessment scores, and grade-level curriculum associations.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={openCreateModal}>
          Add Subject Course
        </Button>
      </div>

      {/* Grade Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedGradeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            selectedGradeFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          All Subjects ({subjects.length})
        </button>
        {grades.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGradeFilter(g.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              selectedGradeFilter === g.id
                ? 'bg-sky-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((sub) => {
          const assignedGradeNames = grades
            .filter((g) => sub.gradeIds?.includes(g.id))
            .map((g) => g.name);

          return (
            <Card
              key={sub.id}
              variant="bordered"
              padding="lg"
              className="space-y-4 hover:border-sky-400 dark:hover:border-sky-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {sub.name}
                      </h3>
                      {sub.code && (
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold rounded-md">
                          {sub.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Max Evaluation Score: <span className="font-bold text-slate-800 dark:text-slate-200">{sub.maxScore || 100} pts</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grade Scope */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Applicable Grades:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sub.isCommon ? (
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold rounded-md text-[11px]">
                        Common (All School Grades)
                      </span>
                    ) : assignedGradeNames.length > 0 ? (
                      assignedGradeNames.map((gName) => (
                        <span
                          key={gName}
                          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-md text-[11px]"
                        >
                          {gName}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No specific grade attached</span>
                    )}
                  </div>
                </div>

                {sub.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{sub.description}</p>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  icon={FileCheck2}
                  onClick={() => onOpenMarklistForSubject && onOpenMarklistForSubject(sub.id)}
                  className="w-full text-xs bg-white dark:bg-slate-800"
                >
                  Enter Marklist for {sub.name}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-500" />
                {editingSubject ? 'Edit Subject Course' : 'Create Subject Course'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Physics, English"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MATH101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Max Assessment Score
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Grade Assignment */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isCommonSubject"
                    checked={formData.isCommon}
                    onChange={(e) => setFormData({ ...formData, isCommon: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded-sm border-slate-300 focus:ring-sky-500"
                  />
                  <label htmlFor="isCommonSubject" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Common Subject (Offered in all Grades)
                  </label>
                </div>

                {!formData.isCommon && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="block font-bold text-slate-600 dark:text-slate-400 uppercase text-[11px]">
                      Select Specific Grades:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {grades.map((g) => (
                        <label
                          key={g.id}
                          className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.gradeIds.includes(g.id)}
                            onChange={() => handleGradeCheckbox(g.id)}
                            className="w-3.5 h-3.5 text-sky-600 rounded-xs"
                          />
                          <span>{g.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Course Description / Syllabus Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional course objectives or outline..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" isLoading={saving} type="submit">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
