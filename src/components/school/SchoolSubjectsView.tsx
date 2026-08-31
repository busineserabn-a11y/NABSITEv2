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
  Percent,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { Subject, Grade, Company, AssessmentComponent } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { validateAssessmentComponentsTotal } from '../../lib/academicUtils';

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
    assessmentComponents: [] as AssessmentComponent[],
  });
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultStandardComponents: AssessmentComponent[] = [
    { id: 'comp_assign_1', name: 'Assignment 1', weight: 10, maxScore: 20, description: 'Homework & Problem Sets' },
    { id: 'comp_quiz_1', name: 'Quiz 1', weight: 10, maxScore: 20, description: 'Quick Assessment' },
    { id: 'comp_test_1', name: 'Test 1', weight: 20, maxScore: 50, description: 'Theory & Problem Solving' },
    { id: 'comp_mid_1', name: 'Midterm Exam', weight: 20, maxScore: 50, description: 'Mid-semester Evaluation' },
    { id: 'comp_final_1', name: 'Final Exam', weight: 40, maxScore: 100, description: 'Comprehensive Final Exam' },
  ];

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      maxScore: 100,
      isCommon: true,
      gradeIds: grades.map((g) => g.id),
      description: '',
      assessmentComponents: defaultStandardComponents,
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
      assessmentComponents:
        sub.assessmentComponents && sub.assessmentComponents.length > 0
          ? sub.assessmentComponents
          : defaultStandardComponents,
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

  // Assessment Component Management
  const handleAddComponent = () => {
    const newId = `comp_${Date.now().toString(36)}`;
    const compValidation = validateAssessmentComponentsTotal(formData.assessmentComponents);
    const suggestedWeight = compValidation.remaining > 0 ? Math.min(compValidation.remaining, 20) : 10;
    
    setFormData((prev) => ({
      ...prev,
      assessmentComponents: [
        ...prev.assessmentComponents,
        {
          id: newId,
          name: `Assessment ${prev.assessmentComponents.length + 1}`,
          weight: suggestedWeight,
          maxScore: 50,
          description: '',
        },
      ],
    }));
  };

  const handleRemoveComponent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assessmentComponents: prev.assessmentComponents.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateComponent = (id: string, field: keyof AssessmentComponent, value: any) => {
    setFormData((prev) => ({
      ...prev,
      assessmentComponents: prev.assessmentComponents.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleApplyPreset = (preset: 'standard5' | 'examHeavy3' | 'fourPart') => {
    if (preset === 'standard5') {
      setFormData((prev) => ({
        ...prev,
        assessmentComponents: [
          { id: 'comp_a1', name: 'Assignment 1', weight: 10, maxScore: 20 },
          { id: 'comp_q1', name: 'Quiz 1', weight: 10, maxScore: 20 },
          { id: 'comp_t1', name: 'Test 1', weight: 20, maxScore: 50 },
          { id: 'comp_mid', name: 'Midterm Exam', weight: 20, maxScore: 50 },
          { id: 'comp_fin', name: 'Final Exam', weight: 40, maxScore: 100 },
        ],
      }));
    } else if (preset === 'examHeavy3') {
      setFormData((prev) => ({
        ...prev,
        assessmentComponents: [
          { id: 'comp_a1', name: 'Assignment', weight: 10, maxScore: 20 },
          { id: 'comp_t1', name: 'Midterm Test', weight: 20, maxScore: 50 },
          { id: 'comp_fin', name: 'Final Exam', weight: 70, maxScore: 100 },
        ],
      }));
    } else if (preset === 'fourPart') {
      setFormData((prev) => ({
        ...prev,
        assessmentComponents: [
          { id: 'comp_a1', name: 'Assignments', weight: 15, maxScore: 30 },
          { id: 'comp_q1', name: 'Quizzes / Labs', weight: 15, maxScore: 30 },
          { id: 'comp_mid', name: 'Midterm Exam', weight: 30, maxScore: 60 },
          { id: 'comp_fin', name: 'Final Exam', weight: 40, maxScore: 100 },
        ],
      }));
    }
  };

  const validation = validateAssessmentComponentsTotal(formData.assessmentComponents);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a subject title (e.g. Mathematics)');
      return;
    }

    if (formData.assessmentComponents.length > 0 && !validation.isValid) {
      setError(`Cannot save subject: Assessment components total is ${validation.total}%. It must equal exactly 100%.`);
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
          assessmentComponents: formData.assessmentComponents,
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
          assessmentComponents: formData.assessmentComponents,
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
            Curriculum Subjects & Weighted Assessments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure flexible 100% assessment weight components (e.g. 10% Assignment, 20% Test, 70% Final Exam).
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

          const comps = sub.assessmentComponents || [];
          const totalWeight = comps.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);

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
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Max Total: <strong className="text-slate-800 dark:text-slate-200">100%</strong></span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{comps.length} Assessment Parts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Subject & Weightings"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weighted Assessment Components Breakdown */}
                {comps.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Assessment Parts</span>
                      <span className={totalWeight === 100 ? 'text-emerald-600' : 'text-amber-500'}>
                        {totalWeight}% Total
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {comps.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs py-1 px-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {c.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-400">max {c.maxScore}</span>
                            <span className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-md font-bold text-[11px]">
                              {c.weight}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {/* Subject Modal with Flexible Assessment Weighting Builder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                  {editingSubject ? `Edit ${editingSubject.name}` : 'Create Subject Course'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define title, grade association, and the 100% weighted assessment breakdown.
                </p>
              </div>
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

            <form onSubmit={handleSave} className="space-y-5 text-xs">
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

              {/* Assessment Components & 100% Weighting Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Percent className="w-4 h-4 text-amber-500" />
                      Subject Assessment Weighting (Must Equal 100%)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Divide this subject's 100% mark into assignments, tests, and exams.
                    </p>
                  </div>

                  {/* Validation Badge */}
                  <div className="flex items-center gap-1.5">
                    {validation.isValid ? (
                      <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        100% Total (Valid)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1 border border-amber-500/30">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {validation.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('standard5')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 transition-colors"
                  >
                    5-Part (10% + 10% + 20% + 20% + 40%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('examHeavy3')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 transition-colors"
                  >
                    3-Part (10% Assign + 20% Test + 70% Exam)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('fourPart')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 transition-colors"
                  >
                    4-Part (15% + 15% + 30% + 40%)
                  </button>
                </div>

                {/* Components Table / List */}
                <div className="space-y-2 pt-2">
                  {formData.assessmentComponents.map((comp, idx) => (
                    <div
                      key={comp.id}
                      className="grid grid-cols-12 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 items-center"
                    >
                      <div className="col-span-5 sm:col-span-5">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                          Part #{idx + 1} Name
                        </label>
                        <input
                          type="text"
                          required
                          value={comp.name}
                          onChange={(e) => handleUpdateComponent(comp.id, 'name', e.target.value)}
                          placeholder="e.g. Assignment 1"
                          className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                          Weight (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={comp.weight}
                            onChange={(e) =>
                              handleUpdateComponent(comp.id, 'weight', parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 pl-2.5 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      <div className="col-span-3 sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                          Max Raw Score
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          required
                          value={comp.maxScore}
                          onChange={(e) =>
                            handleUpdateComponent(comp.id, 'maxScore', parseInt(e.target.value) || 50)
                          }
                          className="w-full h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 flex items-end justify-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove Component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={handleAddComponent}
                    className="w-full text-xs border-dashed"
                  >
                    Add Another Assessment Component
                  </Button>
                </div>
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

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  {validation.isValid ? (
                    <span className="text-emerald-600 font-semibold">✓ Weight check passed (100%)</span>
                  ) : (
                    <span className="text-amber-500 font-semibold">⚠️ Must sum to 100% to finalize</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={saving}
                    type="submit"
                    disabled={!validation.isValid && formData.assessmentComponents.length > 0}
                  >
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
