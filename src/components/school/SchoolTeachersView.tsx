import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  BookOpen,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  Filter,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Teacher, Subject, Grade, Section } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface SchoolTeachersViewProps {
  company: Company;
  subjects: Subject[];
  grades: Grade[];
  sections: Section[];
  onRefresh?: () => void;
}

export const SchoolTeachersView: React.FC<SchoolTeachersViewProps> = ({
  company,
  subjects,
  grades,
  sections,
  onRefresh,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [qualification, setQualification] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const list = await api.getTeachers(company.id);
      setTeachers(list);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [company.id]);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setEmployeeId(`GG/TCH/${String(teachers.length + 1).padStart(3, '0')}`);
    setEmail('');
    setPhone('');
    setGender('male');
    setQualification('');
    setDepartment('General Academic');
    setStatus('active');
    setSelectedSubjectIds([]);
    setSelectedGradeIds([]);
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFullName(t.fullName);
    setEmployeeId(t.employeeId);
    setEmail(t.email || '');
    setPhone(t.phone || '');
    setGender(t.gender || 'male');
    setQualification(t.qualification || '');
    setDepartment(t.department || 'General Academic');
    setStatus(t.status);
    setSelectedSubjectIds(t.subjectIds || []);
    setSelectedGradeIds(t.gradeIds || []);
    setNotes(t.notes || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload: Partial<Teacher> = {
      fullName: fullName.trim(),
      employeeId: employeeId.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender,
      qualification: qualification.trim(),
      department: department.trim(),
      status,
      subjectIds: selectedSubjectIds,
      gradeIds: selectedGradeIds,
      notes: notes.trim(),
    };

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, payload);
      } else {
        await api.createTeacher(company.id, payload);
      }
      setModalOpen(false);
      await fetchTeachers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save teacher details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this teacher from the school directory?')) return;
    setDeletingId(id);
    try {
      await api.deleteTeacher(id);
      await fetchTeachers();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete teacher:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.qualification && t.qualification.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = departmentFilter === 'ALL' || t.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Staff & Teacher Directory
            </h2>
            <Badge variant="info" size="sm">
              {teachers.length} Instructors
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage academic faculty, department assignments, qualifications, and curriculum subjects for Gara Guri Secondary School.
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={openAddModal}
          className="shadow-sm font-bold"
        >
          Add Faculty Member
        </Button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by teacher name, ID, qualification, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Departments ({teachers.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Teachers Cards / Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading teacher directory...</span>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No teachers found matching your search.</p>
          <p className="text-xs text-slate-400">Click "Add Faculty Member" above to create a new teacher record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const assignedSubjects = subjects.filter((s) => teacher.subjectIds?.includes(s.id));
            const assignedGrades = grades.filter((g) => teacher.gradeIds?.includes(g.id));

            return (
              <div
                key={teacher.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Line */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        {teacher.employeeId}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                        {teacher.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>{teacher.department || 'General Academic'}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        teacher.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : teacher.status === 'on_leave'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}
                    >
                      {teacher.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Qualification */}
                  {teacher.qualification && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{teacher.qualification}</span>
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{teacher.phone}</span>
                      </div>
                    )}
                    {teacher.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Subjects & Grades */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Subjects:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assignedSubjects.length > 0 ? (
                        assignedSubjects.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11px] font-semibold border border-sky-500/20"
                          >
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Grades */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Grades:
                    </span>
                    {assignedGrades.length > 0 ? (
                      assignedGrades.map((g) => (
                        <span
                          key={g.id}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold"
                        >
                          {g.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit2}
                    onClick={() => openEditModal(teacher)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    isLoading={deletingId === teacher.id}
                    onClick={() => handleDeleteTeacher(teacher.id)}
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add / Edit Teacher Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeacher ? 'Edit Faculty Details' : 'Register New Faculty Member'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              required
              placeholder="e.g. Ustaz Mahaammad Saalah Jamaal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Employee / Staff ID *"
              required
              placeholder="e.g. GG/TCH/006"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="+251 91 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="teacher@garagurischool.edu.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Arabic Curriculum, Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <Input
            label="Academic Qualification & Certifications"
            placeholder="e.g. M.A. Arabic Linguistics, B.Ed Afaan Oromoo"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          />

          {/* Subjects Assignment Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Subjects
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {subjects.map((sub) => {
                const checked = selectedSubjectIds.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                        } else {
                          setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== sub.id));
                        }
                      }}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="truncate">{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Grades Assignment Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Grades
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {grades.map((g) => {
                const checked = selectedGradeIds.includes(g.id);
                return (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGradeIds([...selectedGradeIds, g.id]);
                        } else {
                          setSelectedGradeIds(selectedGradeIds.filter((id) => id !== g.id));
                        }
                      }}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>{g.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Notes / Homeroom Assignment
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Section 9A Homeroom supervisor, debate club advisor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saving}
              icon={CheckCircle2}
            >
              {editingTeacher ? 'Update Teacher' : 'Register Faculty Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
