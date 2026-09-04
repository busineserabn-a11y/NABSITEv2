import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
  Check,
  X,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Company, SchoolFaq } from '../../types';
import { api } from '../../lib/api';
import { can } from '../../lib/permissions';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface SchoolFaqViewProps {
  company: Company;
  onRefresh?: () => void;
}

export const SchoolFaqView: React.FC<SchoolFaqViewProps> = ({ company, onRefresh }) => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<SchoolFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'published' | 'draft'>('All');

  // Permissions
  const canCreate = can(user, 'school_faq', company.id, 'create');
  const canEdit = can(user, 'school_faq', company.id, 'edit');
  const canDelete = can(user, 'school_faq', company.id, 'delete');
  const canReorder = can(user, 'school_faq', company.id, 'reorder');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [activeFaq, setActiveFaq] = useState<SchoolFaq | null>(null);

  // Form State
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formPublished, setFormPublished] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetched = await api.getSchoolFaqs(company.id);
      setFaqs(fetched);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  // Open Create
  const handleOpenAddModal = () => {
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('General');
    const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.displayOrder || 1)) + 1 : 1;
    setFormDisplayOrder(nextOrder);
    setFormPublished(true);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit
  const handleOpenEditModal = (faq: SchoolFaq) => {
    setActiveFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category || 'General');
    setFormDisplayOrder(faq.displayOrder ?? 1);
    setFormPublished(faq.published);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open View
  const handleOpenViewModal = (faq: SchoolFaq) => {
    setActiveFaq(faq);
    setIsViewModalOpen(true);
  };

  // Open Delete
  const handleOpenDeleteModal = (faq: SchoolFaq) => {
    setActiveFaq(faq);
    setIsDeleteModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      setFormError('Question is required.');
      return;
    }
    if (!formAnswer.trim()) {
      setFormError('Answer is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.createSchoolFaq(
        company.id,
        {
          question: formQuestion,
          answer: formAnswer,
          category: formCategory,
          displayOrder: Number(formDisplayOrder) || 1,
          published: formPublished,
        },
        {
          id: user?.id || 'staff',
          name: user?.name || 'School Administrator',
        }
      );

      setIsAddModalOpen(false);
      showToast('FAQ saved.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save FAQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFaq) return;
    if (!formQuestion.trim()) {
      setFormError('Question is required.');
      return;
    }
    if (!formAnswer.trim()) {
      setFormError('Answer is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await api.updateSchoolFaq(activeFaq.id, {
        question: formQuestion,
        answer: formAnswer,
        category: formCategory,
        displayOrder: Number(formDisplayOrder) || 1,
        published: formPublished,
      });

      setIsEditModalOpen(false);
      showToast('FAQ updated.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update FAQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Published direct action
  const handleTogglePublished = async (faq: SchoolFaq) => {
    if (!canEdit) return;
    try {
      await api.updateSchoolFaq(faq.id, {
        published: !faq.published,
      });
      showToast(faq.published ? 'FAQ set to draft.' : 'FAQ published to live site.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to change FAQ status.');
    }
  };

  // Reorder Move Up
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || !canReorder) return;
    const currentList = [...faqs];
    const prevIndex = index - 1;

    // Swap items
    const temp = currentList[index];
    currentList[index] = currentList[prevIndex];
    currentList[prevIndex] = temp;

    // Reassign sequential orders
    const updates = currentList.map((item, idx) => ({
      id: item.id,
      displayOrder: idx + 1,
    }));

    try {
      await api.reorderSchoolFaqs(company.id, updates);
      showToast('FAQ order updated.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update FAQ order.');
    }
  };

  // Reorder Move Down
  const handleMoveDown = async (index: number) => {
    if (index >= faqs.length - 1 || !canReorder) return;
    const currentList = [...faqs];
    const nextIndex = index + 1;

    // Swap items
    const temp = currentList[index];
    currentList[index] = currentList[nextIndex];
    currentList[nextIndex] = temp;

    // Reassign sequential orders
    const updates = currentList.map((item, idx) => ({
      id: item.id,
      displayOrder: idx + 1,
    }));

    try {
      await api.reorderSchoolFaqs(company.id, updates);
      showToast('FAQ order updated.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update FAQ order.');
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!activeFaq) return;
    setIsSubmitting(true);
    try {
      await api.deleteSchoolFaq(activeFaq.id, company.id);
      setIsDeleteModalOpen(false);
      showToast('FAQ deleted.');
      await loadData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (statusFilter === 'published' && !item.published) return false;
      if (statusFilter === 'draft' && item.published) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        (item.category && item.category.toLowerCase().includes(term))
      );
    });
  }, [faqs, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              School FAQ Management
            </h2>
            <Badge variant="info" size="sm">
              {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage frequently asked questions displayed publicly on the school website. Published questions automatically appear on the public portal for parents, students, and prospective families.
          </p>
        </div>

        <div>
          {canCreate ? (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenAddModal}
            >
              Add School FAQ
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              title="You lack create permission for the School FAQ module"
            >
              Add FAQ (Restricted)
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions, answers, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Visibility</option>
            <option value="published">Published on Website</option>
            <option value="draft">Internal Draft Only</option>
          </select>
        </div>
      </div>

      {/* Main FAQ List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading FAQs...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {faqs.length === 0 ? 'No FAQs have been created yet.' : 'No FAQs match your search.'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {faqs.length === 0
                  ? 'Add questions and helpful answers about admissions, academic policies, or school life.'
                  : 'Try clearing your search query or selecting a different category filter.'}
              </p>
            </div>
            {faqs.length === 0 && canCreate && (
              <Button variant="primary" icon={Plus} size="sm" onClick={handleOpenAddModal}>
                Create First FAQ
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      #{faq.displayOrder ?? index + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {faq.category || 'General'}
                    </span>
                    {faq.published ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Globe className="w-3 h-3" />
                        Live on Website
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                        <Lock className="w-3 h-3" />
                        Draft (Hidden)
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {faq.question}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {faq.answer}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>Added by: {faq.createdBy || 'Staff'}</span>
                    <span>Updated: {new Date(faq.updatedAt || faq.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions & Reorder */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  {canReorder && (
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move FAQ Up"
                        className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredFaqs.length - 1}
                        title="Move FAQ Down"
                        className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenViewModal(faq)}
                    title="Preview FAQ"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(faq)}
                        title={faq.published ? 'Click to unpublish' : 'Click to publish'}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                          faq.published
                            ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {faq.published ? 'Hide' : 'Publish'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(faq)}
                        title="Edit FAQ"
                        className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(faq)}
                      title="Delete FAQ"
                      className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Delete permission required"
                      className="p-2 rounded-xl text-slate-300 dark:text-slate-700 cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL: Add FAQ --- */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add School FAQ"
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
              Question <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. What are the school admission deadlines for Grade 9?"
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Admissions, Academics, Tuition, Campus Life"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Answer <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Write a clear, comprehensive answer for parents and students..."
              value={formAnswer}
              onChange={(e) => setFormAnswer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={formDisplayOrder}
                onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Publish to Public Website</span>
              </label>
            </div>
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
              {isSubmitting ? 'Saving FAQ...' : 'Save FAQ'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: Edit FAQ --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit School FAQ"
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
              Question <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Category
            </label>
            <input
              type="text"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Answer <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formAnswer}
              onChange={(e) => setFormAnswer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={formDisplayOrder}
                onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                <input
                  type="checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Publish to Public Website</span>
              </label>
            </div>
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
              {isSubmitting ? 'Updating...' : 'Update FAQ'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: View FAQ Details --- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="FAQ Preview"
      >
        {activeFaq && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {activeFaq.category || 'General'}
              </span>
              <div>
                {activeFaq.published ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <Globe className="w-3.5 h-3.5" /> Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                    <Lock className="w-3.5 h-3.5" /> Draft
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeFaq.question}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {activeFaq.answer}
            </div>

            <div className="text-[10px] text-slate-400 pt-2 flex items-center justify-between">
              <span>Display Order: #{activeFaq.displayOrder}</span>
              <span>Last Modified: {new Date(activeFaq.updatedAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL: Delete FAQ Confirmation --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Confirm FAQ Deletion"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Are you sure you want to delete this FAQ?</p>
              <p className="text-xs mt-1 text-rose-700 dark:text-rose-300">
                This question and answer will be permanently deleted from the database and will no longer appear on your public school website.
              </p>
            </div>
          </div>

          {activeFaq && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">{activeFaq.question}</p>
              <p className="line-clamp-2 mt-1 text-slate-500">{activeFaq.answer}</p>
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
              Delete FAQ Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
