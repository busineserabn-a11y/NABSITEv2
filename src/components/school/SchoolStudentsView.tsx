import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  Layers,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, Grade, Section, AcademicYear, Company } from '../../types';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StudentUploadModal } from './StudentUploadModal';

interface SchoolStudentsViewProps {
  company: Company;
  students: Student[];
  grades: Grade[];
  sections: Section[];
  academicYears: AcademicYear[];
  onRefresh: () => void;
  onOpenMarklistForStudent?: (gradeId: string, sectionId: string) => void;
}

export const SchoolStudentsView: React.FC<SchoolStudentsViewProps> = ({
  company,
  students,
  grades,
  sections,
  academicYears,
  onRefresh,
}) => {
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNo: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    gradeId: grades[0]?.id || '',
    sectionId: sections[0]?.id || '',
    academicYearId: academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sections for current form grade
  const formGradeSections = useMemo(() => {
    return sections.filter((s) => s.gradeId === formData.gradeId);
  }, [sections, formData.gradeId]);

  // Sync form section when form grade changes
  const handleFormGradeChange = (newGradeId: string) => {
    const matchingSections = sections.filter((s) => s.gradeId === newGradeId);
    setFormData((prev) => ({
      ...prev,
      gradeId: newGradeId,
      sectionId: matchingSections[0]?.id || '',
    }));
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    const initialGradeId = grades[0]?.id || '';
    const initialSections = sections.filter((s) => s.gradeId === initialGradeId);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    setFormData({
      fullName: '',
      admissionNo: `FAN-${new Date().getFullYear()}-${randomSuffix}`,
      gender: 'male',
      dateOfBirth: '',
      gradeId: initialGradeId,
      sectionId: initialSections[0]?.id || '',
      academicYearId: academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      notes: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setFormData({
      fullName: stu.fullName,
      admissionNo: stu.admissionNo,
      gender: (stu.gender as 'male' | 'female' | 'other') || 'male',
      dateOfBirth: stu.dateOfBirth || '',
      gradeId: stu.gradeId,
      sectionId: stu.sectionId,
      academicYearId: stu.academicYearId || '',
      guardianName: stu.guardianName || '',
      guardianPhone: stu.guardianPhone || '',
      guardianEmail: stu.guardianEmail || '',
      notes: stu.notes || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleDelete = async (stu: Student) => {
    if (!window.confirm(`Are you sure you want to remove student "${stu.fullName}"?`)) return;
    try {
      await api.deleteStudent(stu.id);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      alert('Failed to remove student.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Please provide student full name.');
      return;
    }
    if (!formData.gradeId || !formData.sectionId) {
      setError('Please assign a grade and section.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          companyId: company.id,
          fullName: formData.fullName,
          admissionNo: formData.admissionNo,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          gradeId: formData.gradeId,
          sectionId: formData.sectionId,
          academicYearId: formData.academicYearId,
          guardianName: formData.guardianName,
          guardianPhone: formData.guardianPhone,
          guardianEmail: formData.guardianEmail,
          notes: formData.notes,
        });
      } else {
        await api.createStudent({
          companyId: company.id,
          fullName: formData.fullName,
          admissionNo: formData.admissionNo,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          gradeId: formData.gradeId,
          sectionId: formData.sectionId,
          academicYearId: formData.academicYearId,
          guardianName: formData.guardianName,
          guardianPhone: formData.guardianPhone,
          guardianEmail: formData.guardianEmail,
          notes: formData.notes,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save student:', err);
      setError(err.message || 'Failed to save student record.');
    } finally {
      setSaving(false);
    }
  };

  // Filter sections by grade filter
  const availableFilterSections = useMemo(() => {
    if (gradeFilter === 'ALL') return sections;
    return sections.filter((s) => s.gradeId === gradeFilter);
  }, [sections, gradeFilter]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((stu) => {
      if (gradeFilter !== 'ALL' && stu.gradeId !== gradeFilter) return false;
      if (sectionFilter !== 'ALL' && stu.sectionId !== sectionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          stu.fullName.toLowerCase().includes(q) ||
          stu.admissionNo.toLowerCase().includes(q) ||
          stu.id.toLowerCase().includes(q) ||
          (stu.guardianName && stu.guardianName.toLowerCase().includes(q)) ||
          (stu.guardianPhone && stu.guardianPhone.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Students Roster & Profiles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled student profiles with long system IDs, admission numbers, and grade placements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="md"
            icon={Upload}
            onClick={() => setUploadModalOpen(true)}
            className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
          >
            Upload Students (CSV / Excel)
          </Button>

          <Button variant="primary" size="md" icon={Plus} onClick={openCreateModal}>
            Register Student
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Grade Dropdown */}
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setSectionFilter('ALL');
            }}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Grade Levels</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Section Dropdown */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={availableFilterSections.length === 0}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="ALL">All Sections</option>
            {availableFilterSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredStudents.length} of {students.length} students
        </span>
      </div>

      {/* Students Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Students Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No student records matched the active filter or search query.
            </p>
            <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
              Register New Student
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Grade & Section</th>
                  <th className="py-3.5 px-4">FAN / Admission No</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredStudents.map((stu, index) => {
                  const gradeName = grades.find((g) => g.id === stu.gradeId)?.name || 'Grade';
                  const sectionName = sections.find((s) => s.id === stu.sectionId)?.name || 'Section';

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {stu.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {stu.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {stu.gender === 'female' ? 'Female' : 'Male'} • ID: <span className="font-mono text-slate-400">{stu.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="info" size="sm">
                          {gradeName} • {sectionName}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                          {stu.admissionNo || stu.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {stu.guardianName ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {stu.guardianName}
                            </div>
                            {stu.guardianPhone && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {stu.guardianPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not listed</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(stu)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(stu)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dawit Haile"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                      FAN / Admission No. *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, admissionNo: `FAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` })}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                      Generate FAN
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAN-2025-4821"
                    value={formData.admissionNo}
                    onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Permanent student ID required to access results on "About the Student" portal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Grade Level *
                  </label>
                  <select
                    value={formData.gradeId}
                    onChange={(e) => handleFormGradeChange(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Section Stream *
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    disabled={formGradeSections.length === 0}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {formGradeSections.length === 0 ? (
                      <option value="">No sections</option>
                    ) : (
                      formGradeSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Guardian / Parent Contact Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Haile Gebremariam"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full h-9 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+251 91 100 0000"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full h-9 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" isLoading={saving} type="submit">
                  {editingStudent ? 'Update Profile' : 'Register Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Bulk Upload Modal */}
      <StudentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        company={company}
        academicYears={academicYears}
        grades={grades}
        sections={sections}
        onUploadSuccess={onRefresh}
      />
    </div>
  );
};
