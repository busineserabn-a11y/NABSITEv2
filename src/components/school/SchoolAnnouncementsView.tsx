import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Calendar,
  AlertTriangle,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Check,
  Tag,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, SchoolAnnouncement } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface SchoolAnnouncementsViewProps {
  company: Company;
  onRefresh?: () => void;
}

export const SchoolAnnouncementsView: React.FC<SchoolAnnouncementsViewProps> = ({
  company,
  onRefresh,
}) => {
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SchoolAnnouncement[] | any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [category, setCategory] = useState<'academic' | 'exam' | 'holiday' | 'event' | 'general'>('general');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().substring(0, 10));

  // Delete Loading
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await api.getSchoolAnnouncements(company.id);
      setAnnouncements(list);
    } catch (err) {
      console.error('Failed to load school announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [company.id]);

  const openAddModal = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setTargetAudience('all');
    setCategory('academic');
    setPriority('normal');
    setIsPinned(false);
    setAuthorName('School Administration');
    setPublishDate(new Date().toISOString().substring(0, 10));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (notice: SchoolAnnouncement) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setTargetAudience(notice.targetAudience);
    setCategory(notice.category);
    setPriority(notice.priority);
    setIsPinned(notice.isPinned);
    setAuthorName(notice.authorName || 'School Administration');
    setPublishDate(notice.publishDate || new Date().toISOString().substring(0, 10));
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Both title and announcement content are required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload: Partial<SchoolAnnouncement> = {
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      category,
      priority,
      isPinned,
      authorName: authorName.trim(),
      publishDate,
      status: 'published',
    };

    try {
      if (editingNotice) {
        await api.updateSchoolAnnouncement(editingNotice.id, payload);
      } else {
        await api.createSchoolAnnouncement(company.id, payload);
      }
      setModalOpen(false);
      await fetchAnnouncements();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    setDeletingId(id);
    try {
      await api.deleteSchoolAnnouncement(id);
      await fetchAnnouncements();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (notice: SchoolAnnouncement) => {
    try {
      await api.updateSchoolAnnouncement(notice.id, { isPinned: !notice.isPinned });
      await fetchAnnouncements();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((notice) => {
      const matchesSearch =
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notice.authorName && notice.authorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAudience = audienceFilter === 'all' || notice.targetAudience === audienceFilter || notice.targetAudience === 'all';
      const matchesCategory = categoryFilter === 'ALL' || notice.category === categoryFilter;

      return matchesSearch && matchesAudience && matchesCategory;
    });
  }, [announcements, searchQuery, audienceFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Megaphone className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Notice Board & Announcements
            </h2>
            <Badge variant="info" size="sm">
              {announcements.length} Published
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Broadcast official circulars, examination schedules, academic deadlines, and parent meeting notices for Gara Guri Secondary School.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={openAddModal}
          className="shadow-sm font-bold"
        >
          Publish New Notice
        </Button>
      </div>

      {/* 2. Search & Audience Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Audience Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['all', 'students', 'teachers', 'parents'] as const).map((aud) => (
            <button
              key={aud}
              onClick={() => setAudienceFilter(aud)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                audienceFilter === aud
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {aud === 'all' ? 'All Audiences' : aud}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Categories</option>
            <option value="academic">Academic</option>
            <option value="exam">Examinations</option>
            <option value="event">Events</option>
            <option value="holiday">Holidays</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* 3. Announcements List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading announcements...</span>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Megaphone className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No notices found.</p>
          <p className="text-xs text-slate-400">Click "Publish New Notice" to post an announcement on the school board.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map((notice) => {
            return (
              <div
                key={notice.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  notice.isPinned
                    ? 'border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {notice.isPinned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-amber-500" />
                          Pinned Notice
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          notice.priority === 'urgent'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : notice.priority === 'important'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                        }`}
                      >
                        {notice.priority}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {notice.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{notice.publishDate}</span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audience: <strong className="text-slate-700 dark:text-slate-200 capitalize">{notice.targetAudience}</strong></span>
                    </div>
                    <span>By: <strong className="text-slate-700 dark:text-slate-200">{notice.authorName || 'Administration'}</strong></span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(notice)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={notice.isPinned ? 'Unpin notice' : 'Pin to top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${notice.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={Edit2}
                    onClick={() => openEditModal(notice)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    isLoading={deletingId === notice.id}
                    onClick={() => handleDeleteNotice(notice.id)}
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

      {/* 4. Add / Edit Notice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingNotice ? 'Edit School Notice' : 'Publish New Notice'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveNotice} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Notice Title *"
            required
            placeholder="e.g. Schedule for Midterm Examination 2016 E.C."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Content *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Write the detailed circular or announcement message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers & Staff</option>
                <option value="parents">Parents</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="academic">Academic</option>
                <option value="exam">Examination</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Author / Office Name"
              placeholder="e.g. Academic Directorate"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Publish Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              Pin this notice to top of notice board
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              {editingNotice ? 'Save Changes' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
