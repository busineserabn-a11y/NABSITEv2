import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  DoorOpen,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Grade, Section, Student, Company } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SchoolGradesSectionsViewProps {
  company: Company;
  grades: Grade[];
  sections: Section[];
  students: Student[];
  onRefresh: () => void;
  onOpenMarklistForSection?: (gradeId: string, sectionId: string) => void;
}

export const SchoolGradesSectionsView: React.FC<SchoolGradesSectionsViewProps> = ({
  company,
  grades,
  sections,
  students,
  onRefresh,
  onOpenMarklistForSection,
}) => {
  const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id || '');

  // Grade Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeFormData, setGradeFormData] = useState({ name: '', level: 1, description: '' });

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ name: '', room: '', capacity: 40 });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Selected Grade
  const activeGrade = grades.find((g) => g.id === selectedGradeId) || grades[0] || null;
  const gradeSections = activeGrade ? sections.filter((s) => s.gradeId === activeGrade.id) : [];

  // Grade Handlers
  const openCreateGrade = () => {
    setEditingGrade(null);
    setGradeFormData({ name: '', level: grades.length + 1, description: '' });
    setError(null);
    setGradeModalOpen(true);
  };

  const openEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setGradeFormData({ name: grade.name, level: grade.level || 1, description: grade.description || '' });
    setError(null);
    setGradeModalOpen(true);
  };

  const handleDeleteGrade = async (grade: Grade) => {
    const attachedSections = sections.filter((s) => s.gradeId === grade.id);
    if (attachedSections.length > 0) {
      if (!window.confirm(`Grade "${grade.name}" has ${attachedSections.length} sections. Deleting it will also remove related sections. Proceed?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Delete "${grade.name}"?`)) return;
    }

    try {
      await api.deleteGrade(grade.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete grade:', err);
      alert('Failed to delete grade.');
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeFormData.name.trim()) {
      setError('Please provide a grade name (e.g. Grade 9)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingGrade) {
        await api.updateGrade(editingGrade.id, {
          companyId: company.id,
          name: gradeFormData.name,
          level: Number(gradeFormData.level),
          description: gradeFormData.description,
        });
      } else {
        const created = await api.createGrade({
          companyId: company.id,
          name: gradeFormData.name,
          level: Number(gradeFormData.level),
          description: gradeFormData.description,
        });
        setSelectedGradeId(created.id);
      }
      setGradeModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save grade:', err);
      setError(err.message || 'Failed to save grade.');
    } finally {
      setSaving(false);
    }
  };

  // Section Handlers
  const openCreateSection = () => {
    if (!activeGrade) return;
    setEditingSection(null);
    setSectionFormData({ name: `Section ${String.fromCharCode(65 + gradeSections.length)}`, room: '', capacity: 40 });
    setError(null);
    setSectionModalOpen(true);
  };

  const openEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionFormData({ name: section.name, room: section.room || '', capacity: section.capacity || 40 });
    setError(null);
    setSectionModalOpen(true);
  };

  const handleDeleteSection = async (section: Section) => {
    if (!window.confirm(`Delete section "${section.name}"?`)) return;
    try {
      await api.deleteSection(section.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      alert('Failed to delete section.');
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrade) return;
    if (!sectionFormData.name.trim()) {
      setError('Please provide a section name (e.g. Section A)');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingSection) {
        await api.updateSection(editingSection.id, {
          companyId: company.id,
          gradeId: activeGrade.id,
          name: sectionFormData.name,
          room: sectionFormData.room,
          capacity: Number(sectionFormData.capacity),
        });
      } else {
        await api.createSection({
          companyId: company.id,
          gradeId: activeGrade.id,
          name: sectionFormData.name,
          room: sectionFormData.room,
          capacity: Number(sectionFormData.capacity),
        });
      }
      setSectionModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save section:', err);
      setError(err.message || 'Failed to save section.');
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
            <Layers className="w-5 h-5 text-indigo-500" />
            Grades & Classroom Sections
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain curriculum levels, streams, room assignments, and student rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" icon={Plus} onClick={openCreateGrade}>
            Add Grade Level
          </Button>
        </div>
      </div>

      {/* Main Layout: Left Grade Tabs / List + Right Sections & Classroom Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Grade Levels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Grade Levels ({grades.length})
            </span>
          </div>

          <div className="space-y-2">
            {grades.map((grade) => {
              const countSec = sections.filter((s) => s.gradeId === grade.id).length;
              const countStudents = students.filter((stu) => stu.gradeId === grade.id).length;
              const isSelected = activeGrade?.id === grade.id;

              return (
                <div
                  key={grade.id}
                  onClick={() => setSelectedGradeId(grade.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {grade.level || grade.name.replace(/\D/g, '') || '#'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{grade.name}</h4>
                      <p
                        className={`text-xs mt-0.5 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {countSec} Sections • {countStudents} Enrolled
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditGrade(grade);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'text-indigo-200 hover:text-white hover:bg-white/10'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Edit Grade"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrade(grade);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'text-indigo-200 hover:text-rose-200 hover:bg-rose-500/20'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      }`}
                      title="Delete Grade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Sections in Selected Grade */}
        <div className="lg:col-span-2 space-y-4">
          {activeGrade ? (
            <Card variant="bordered" padding="lg" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeGrade.name} Sections
                    </h3>
                    <Badge variant="info" size="sm">
                      Level {activeGrade.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Classrooms and streams assigned to {activeGrade.name}.
                  </p>
                </div>

                <Button variant="primary" size="sm" icon={Plus} onClick={openCreateSection}>
                  Add Section to {activeGrade.name}
                </Button>
              </div>

              {gradeSections.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No Sections in {activeGrade.name}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create section streams (e.g. Section A, Section B) to organize enrolled students.
                  </p>
                  <Button variant="primary" size="sm" icon={Plus} onClick={openCreateSection}>
                    Create Section
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gradeSections.map((sec) => {
                    const sectionStudents = students.filter(
                      (s) => s.gradeId === activeGrade.id && s.sectionId === sec.id
                    );

                    return (
                      <div
                        key={sec.id}
                        className="bg-slate-50/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {sec.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              {sec.room && <span>Room: {sec.room}</span>}
                              <span>• Capacity: {sec.capacity || 40}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditSection(sec)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Student Count Badge & Progress */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                              {sectionStudents.length} Students Enrolled
                            </span>
                            <span className="text-slate-400">
                              Max: {sec.capacity || 40}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (sectionStudents.length / (sec.capacity || 40)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Quick Marklist Launch */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={FileCheck2}
                            onClick={() => onOpenMarklistForSection && onOpenMarklistForSection(activeGrade.id, sec.id)}
                            className="text-xs w-full bg-white dark:bg-slate-800"
                          >
                            Open {sec.name} Marklist
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : (
            <Card variant="bordered" padding="lg" className="text-center py-12">
              <p className="text-slate-400">Please create a grade level first.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Grade Modal */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                {editingGrade ? 'Edit Grade Level' : 'Add New Grade Level'}
              </h3>
              <button onClick={() => setGradeModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Grade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 9, Grade 10, Grade 11, Grade 12"
                  value={gradeFormData.name}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Level Number (Sorting Order)
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={gradeFormData.level}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, level: parseInt(e.target.value) || 1 })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Description / Curriculum Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Secondary Education First Cycle"
                  value={gradeFormData.description}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, description: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setGradeModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" isLoading={saving} type="submit">
                  {editingGrade ? 'Update Grade' : 'Create Grade'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {sectionModalOpen && activeGrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-indigo-500" />
                {editingSection ? 'Edit Section' : `Add Section to ${activeGrade.name}`}
              </h3>
              <button onClick={() => setSectionModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Section Stream Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section A, Section B, 9-A"
                  value={sectionFormData.name}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={sectionFormData.room}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, room: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={sectionFormData.capacity}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: parseInt(e.target.value) || 40 })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setSectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" isLoading={saving} type="submit">
                  {editingSection ? 'Update Section' : 'Create Section'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
