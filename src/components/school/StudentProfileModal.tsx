import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  Layers,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Student, Grade, Section, AcademicYear, Company, DisciplineRecord, DisciplineFollowUpStatus } from '../../types';
import { api } from '../../lib/api';
import { can } from '../../lib/permissions';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  company: Company;
  grade?: Grade;
  section?: Section;
  academicYear?: AcademicYear;
  onDisciplineRecordAdded?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  company,
  grade,
  section,
  academicYear,
  onDisciplineRecordAdded,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'discipline'>('info');
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>([]);
  const [loadingDiscipline, setLoadingDiscipline] = useState(false);

  // Add Incident Sub-modal state
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().substring(0, 10));
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentActionTaken, setIncidentActionTaken] = useState('');
  const [incidentStatus, setIncidentStatus] = useState<DisciplineFollowUpStatus>('Pending');
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission
  const canAddDiscipline = can(user, 'discipline', company.id, 'create');

  const loadDisciplineRecords = async () => {
    setLoadingDiscipline(true);
    try {
      const records = await api.getDisciplineRecords(company.id, student.id);
      setDisciplineRecords(records);
    } catch (err) {
      console.error('Failed to load student discipline records:', err);
    } finally {
      setLoadingDiscipline(false);
    }
  };

  useEffect(() => {
    if (isOpen && student?.id) {
      loadDisciplineRecords();
    }
  }, [isOpen, student?.id, company.id]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDate) {
      setIncidentError('Incident date is required.');
      return;
    }
    if (!incidentDescription.trim()) {
      setIncidentError('Description of incident is required.');
      return;
    }
    if (!incidentActionTaken.trim()) {
      setIncidentError('Corrective action taken is required.');
      return;
    }

    setIsSubmitting(true);
    setIncidentError(null);
    try {
      await api.createDisciplineRecord(
        company.id,
        {
          studentId: student.id,
          incidentDate,
          description: incidentDescription,
          actionTaken: incidentActionTaken,
          followUpStatus: incidentStatus,
        },
        {
          id: user?.id || 'staff',
          name: user?.name || 'School Administrator',
        }
      );

      setIsAddIncidentOpen(false);
      setIncidentDescription('');
      setIncidentActionTaken('');
      setIncidentStatus('Pending');
      await loadDisciplineRecords();
      if (onDisciplineRecordAdded) onDisciplineRecordAdded();
    } catch (err: any) {
      setIncidentError(err.message || 'Failed to record discipline incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-xl">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {student.fullName}
                </h3>
                <Badge variant={student.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {student.status || 'active'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Admission No: {student.admissionNo} • ID: {student.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Student Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discipline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'discipline'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Discipline Records</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/10 dark:bg-white/20 font-mono">
              {disciplineRecords.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Class / Grade</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {grade?.name || 'Grade ' + student.gradeId}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Assigned Section</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {section?.name || 'Section ' + student.sectionId}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Gender</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm capitalize">
                  {student.gender || 'Not specified'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Date of Birth</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {student.dateOfBirth || 'Not registered'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Academic Year</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {academicYear?.name || 'Current Year'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block font-medium">Enrolled Since</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Guardian & Contact Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Parent & Guardian Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Guardian Name</span>
                  <span className="font-semibold">{student.guardianName || 'None listed'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                  <span className="font-semibold">{student.guardianPhone || 'None listed'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-semibold">{student.guardianEmail || 'None listed'}</span>
                </div>
              </div>
            </div>

            {student.notes && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Administrative Notes</h4>
                <p className="text-slate-600 dark:text-slate-300">{student.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Discipline Records */}
        {activeTab === 'discipline' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Behavior & Incident History
                </h4>
                <p className="text-[11px] text-slate-500">
                  Documented corrective measures for {student.fullName}
                </p>
              </div>

              {canAddDiscipline && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => setIsAddIncidentOpen(true)}
                >
                  Record Incident
                </Button>
              )}
            </div>

            {loadingDiscipline ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading discipline records...</p>
              </div>
            ) : disciplineRecords.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No discipline records for this student.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  This student has a clean behavioral standing with no active or resolved disciplinary incidents logged.
                </p>
                {canAddDiscipline && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() => setIsAddIncidentOpen(true)}
                  >
                    Log First Incident
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {disciplineRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {rec.incidentDate}
                        </span>
                      </div>
                      {getStatusBadge(rec.followUpStatus)}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500 text-[11px] block">
                        Incident Description:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap mt-0.5">
                        {rec.description}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-semibold text-slate-500 text-[11px] block">
                        Action Taken:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-0.5">
                        {rec.actionTaken}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Logged by: {rec.createdBy}</span>
                      <span>Recorded: {new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </div>

      {/* Sub-modal: Record Incident Direct from Profile */}
      <Modal
        isOpen={isAddIncidentOpen}
        onClose={() => !isSubmitting && setIsAddIncidentOpen(false)}
        title={`Log Discipline Incident: ${student.fullName}`}
      >
        <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
          {incidentError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{incidentError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Incident Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
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
              placeholder="Detail the incident, infraction, or behavioral event..."
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Action Taken <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detail disciplinary action, parent notification, or counseling..."
              value={incidentActionTaken}
              onChange={(e) => setIncidentActionTaken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Follow-up Status
            </label>
            <select
              value={incidentStatus}
              onChange={(e) => setIncidentStatus(e.target.value as DisciplineFollowUpStatus)}
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
              onClick={() => setIsAddIncidentOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Incident'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
