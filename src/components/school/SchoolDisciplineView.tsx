import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  Check,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Company, Student, DisciplineRecord, DisciplineFollowUpStatus } from '../../types';
import { api } from '../../lib/api';
import { can } from '../../lib/permissions';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface SchoolDisciplineViewProps {
  company: Company;
  students: Student[];
  onRefresh?: () => void;
}

export const SchoolDisciplineView: React.FC<SchoolDisciplineViewProps> = ({
  company,
  students: initialStudents,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [students, setStudents] = useState<Student[]>(initialStudents || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DisciplineFollowUpStatus>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Permission Checks
  const canCreate = can(user, 'discipline', company.id, 'create');
  const canEdit = can(user, 'discipline', company.id, 'edit');
  const canDelete = can(user, 'discipline', company.id, 'delete');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeRecord, setActiveRecord] = useState<DisciplineRecord | null>(null);

  // Form state
  const [formStudentId, setFormStudentId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formDescription, setFormDescription] = useState('');
  const [formActionTaken, setFormActionTaken] = useState('');
  const [formStatus, setFormStatus] = useState<DisciplineFollowUpStatus>('Pending');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load records and students
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedRecords, fetchedStudents] = await Promise.all([
        api.getDisciplineRecords(company.id),
        students.length > 0 ? Promise.resolve(students) : api.getStudents(company.id),
      ]);
      setRecords(fetchedRecords);
      if (fetchedStudents.length > 0) {
        setStudents(fetchedStudents);
      }
    } catch (err) {
      console.error('Failed to load discipline records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormStudentId(students[0]?.id || '');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormDescription('');
    setFormActionTaken('');
    setFormStatus('Pending');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (record: DisciplineRecord) => {
    setActiveRecord(record);
    setFormStudentId(record.studentId);
    setFormDate(record.incidentDate);
    setFormDescription(record.description);
    setFormActionTaken(record.actionTaken);
    setFormStatus(record.followUpStatus);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (record: DisciplineRecord) => {
    setActiveRecord(record);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (record: DisciplineRecord) => {
    setActiveRecord(record);
    setIsDeleteModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!formDate) {
      setFormError('Please provide an incident date.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Please describe the behavior incident.');
      return;
    }
    if (!formActionTaken.trim()) {
      setFormError('Please state the corrective action taken.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.createDisciplineRecord(
        company.id,
        {
          studentId: formStudentId,
          incidentDate: formDate,
          description: formDescription,
          actionTaken: formActionTaken,
          followUpStatus: formStatus,
        },
        {
          id: user?.id || 'staff',
          name: user?.name || 'School Administrator',
        }
      );

      setIsAddModalOpen(false);
      showToast('Discipline record saved.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save discipline record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;
    if (!formStudentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!formDate) {
      setFormError('Please provide an incident date.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Please describe the behavior incident.');
      return;
    }
    if (!formActionTaken.trim()) {
      setFormError('Please state the corrective action taken.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.updateDisciplineRecord(activeRecord.id, {
        studentId: formStudentId,
        incidentDate: formDate,
        description: formDescription,
        actionTaken: formActionTaken,
        followUpStatus: formStatus,
      });

      setIsEditModalOpen(false);
      showToast('Discipline record updated.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update discipline record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!activeRecord) return;
    setIsSubmitting(true);
    try {
      await api.deleteDisciplineRecord(activeRecord.id, company.id);
      setIsDeleteModalOpen(false);
      showToast('Discipline record deleted.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete discipline record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map student helper
  const getStudentInfo = (studentId: string) => {
    const s = students.find((item) => item.id === studentId);
    return {
      name: s ? s.fullName : 'Unknown Student',
      admissionNo: s ? s.admissionNo : studentId,
      gender: s?.gender || 'N/A',
    };
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        if (statusFilter !== 'All' && rec.followUpStatus !== statusFilter) return false;
        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const stu = getStudentInfo(rec.studentId);
        return (
          stu.name.toLowerCase().includes(term) ||
          stu.admissionNo.toLowerCase().includes(term) ||
          rec.description.toLowerCase().includes(term) ||
          rec.actionTaken.toLowerCase().includes(term) ||
          (rec.createdBy && rec.createdBy.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.incidentDate).getTime();
        const timeB = new Date(b.incidentDate).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [records, searchTerm, statusFilter, sortOrder, students]);

  const getStatusBadge = (status: DisciplineFollowUpStatus) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top action header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Discipline & Behavior Records
            </h2>
            <Badge variant="pending" size="sm">
              {records.length} {records.length === 1 ? 'Record' : 'Records'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track student behavioral incidents, documented disciplinary actions, follow-up status, and resolution history with complete tenant isolation.
          </p>
        </div>

        <div>
          {canCreate ? (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenAddModal}
            >
              Add Discipline Record
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              title="You lack create permission for the Discipline module"
            >
              Add Incident (Restricted)
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, admission ID, incident, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Follow-up Statuses</option>
            <option value="Pending">Pending Status</option>
            <option value="In Progress">In Progress Status</option>
            <option value="Resolved">Resolved Status</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="newest">Sort: Newest Incident First</option>
            <option value="oldest">Sort: Oldest Incident First</option>
          </select>
        </div>
      </div>

      {/* Main Records Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading discipline records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {records.length === 0 ? 'No discipline records yet.' : 'No records match your filters.'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {records.length === 0
                  ? 'Use the button above to record the first student behavior incident for this school.'
                  : 'Try adjusting your search keywords or status filter.'}
              </p>
            </div>
            {records.length === 0 && canCreate && (
              <Button variant="primary" icon={Plus} size="sm" onClick={handleOpenAddModal}>
                Record First Incident
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-3">Incident Date</th>
                  <th className="py-3.5 px-4">Description & Incident</th>
                  <th className="py-3.5 px-4">Action Taken</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3">Logged By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredRecords.map((rec) => {
                  const studentInfo = getStudentInfo(rec.studentId);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {studentInfo.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {studentInfo.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              ID: {studentInfo.admissionNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rec.incidentDate}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                          {rec.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                          {rec.actionTaken}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(rec.followUpStatus)}
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        <div className="text-[11px]">
                          <div>{rec.createdBy}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(rec)}
                            title="View full record details"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(rec)}
                              title="Edit record"
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(rec)}
                              title="Delete record"
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Delete permission required"
                              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: Add Discipline Record --- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Record Behavior Incident"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={formStudentId}
              onChange={(e) => setFormStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            >
              <option value="" disabled>
                -- Choose enrolled student --
              </option>
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.fullName} ({stu.admissionNo}) - Grade {stu.gradeId || 'Standard'}
                </option>
              ))}
            </select>
            {students.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No students enrolled in this school. Please register students in the Students Roster first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Incident Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Behavior Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe the behavioral incident, location, witnesses, or circumstance..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Corrective Action Taken <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detail the disciplinary measure, counsel given, parent notification, or detention..."
              value={formActionTaken}
              onChange={(e) => setFormActionTaken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Follow-up Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as DisciplineFollowUpStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Pending">Pending (Requires further evaluation or parent meeting)</option>
              <option value="In Progress">In Progress (Active counseling or monitoring period)</option>
              <option value="Resolved">Resolved (Matter fully handled and completed)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Saving discipline record...' : 'Save Discipline Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: Edit Discipline Record --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Discipline Record"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Student
            </label>
            <select
              value={formStudentId}
              onChange={(e) => setFormStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.fullName} ({stu.admissionNo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Incident Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Behavior Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Corrective Action Taken <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formActionTaken}
              onChange={(e) => setFormActionTaken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Follow-up Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as DisciplineFollowUpStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: View Details --- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Incident Record Details"
      >
        {activeRecord && (
          <div className="space-y-4 text-xs">
            {(() => {
              const student = getStudentInfo(activeRecord.studentId);
              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Admission ID: {student.admissionNo}
                      </div>
                    </div>
                    <div>{getStatusBadge(activeRecord.followUpStatus)}</div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-semibold">Incident Date:</span> {activeRecord.incidentDate}
                    </div>
                    <div>
                      <span className="font-semibold">Logged By:</span> {activeRecord.createdBy}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300">
                Incident Description:
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activeRecord.description}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-slate-700 dark:text-slate-300">
                Corrective Action Taken:
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activeRecord.actionTaken}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-2 flex items-center justify-between">
              <span>Record ID: {activeRecord.id}</span>
              <span>Last Modified: {new Date(activeRecord.updatedAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL: Delete Confirmation --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Confirm Record Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Are you sure you want to delete this discipline record?</p>
              <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                This action cannot be undone and will permanently remove this incident record from the school's Firestore database.
              </p>
            </div>
          </div>

          {activeRecord && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <p><span className="font-semibold">Student:</span> {getStudentInfo(activeRecord.studentId).name}</p>
              <p><span className="font-semibold">Date:</span> {activeRecord.incidentDate}</p>
              <p className="line-clamp-2 mt-1"><span className="font-semibold">Incident:</span> {activeRecord.description}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleDeleteConfirm}
            >
              Delete Record Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
