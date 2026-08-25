import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Trash2,
  ArrowLeft,
  Bell,
  Calendar,
  Sparkles,
  Megaphone,
  Edit2,
  AlertCircle,
  FileText,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
import { Offer, Announcement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export const CompanyOffersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'announcements' | 'offers'>('announcements');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountPercent: 15,
    validUntil: '2026-12-31',
    ctaText: 'Claim Special Offer',
    ctaUrl: '',
    isActive: true,
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    category: 'Academic' as Announcement['category'],
    description: '',
    content: '',
    priority: 'normal' as Announcement['priority'],
    pinned: false,
    author: 'Principal / Administration',
    date: new Date().toISOString().split('T')[0],
    tags: 'Registration, 2026, Semester 1',
    attachmentUrl: '',
  });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [o, a] = await Promise.all([api.getOffers(id), api.getAnnouncements(id)]);
      setOffers(o);
      setAnnouncements(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Offer handlers
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !offerForm.title) return;
    try {
      await api.createOffer({ ...offerForm, companyId: id });
      setOfferModalOpen(false);
      setOfferForm({
        title: '',
        description: '',
        discountPercent: 15,
        validUntil: '2026-12-31',
        ctaText: 'Claim Special Offer',
        ctaUrl: '',
        isActive: true,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!id) return;
    try {
      await api.deleteOffer(offerId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Announcement handlers
  const handleOpenCreateAnnouncement = () => {
    setEditingAnnouncementId(null);
    setAnnouncementForm({
      title: '',
      category: 'Academic',
      description: '',
      content: '',
      priority: 'normal',
      pinned: false,
      author: 'Principal / Administration',
      date: new Date().toISOString().split('T')[0],
      tags: 'General, Notice',
      attachmentUrl: '',
    });
    setAnnouncementModalOpen(true);
  };

  const handleOpenEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncementId(ann.id);
    setAnnouncementForm({
      title: ann.title,
      category: ann.category,
      description: ann.description || '',
      content: ann.content || '',
      priority: ann.priority || 'normal',
      pinned: !!ann.pinned,
      author: ann.author || 'School Administration',
      date: ann.date || new Date().toISOString().split('T')[0],
      tags: ann.tags ? ann.tags.join(', ') : '',
      attachmentUrl: ann.attachmentUrl || '',
    });
    setAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !announcementForm.title) return;

    const payload = {
      companyId: id,
      title: announcementForm.title,
      category: announcementForm.category,
      description: announcementForm.description,
      content: announcementForm.content,
      priority: announcementForm.priority,
      pinned: announcementForm.pinned,
      author: announcementForm.author,
      date: announcementForm.date,
      tags: announcementForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      attachmentUrl: announcementForm.attachmentUrl || undefined,
    };

    try {
      if (editingAnnouncementId) {
        await api.updateAnnouncement(editingAnnouncementId, payload);
      } else {
        await api.createAnnouncement(payload);
      }
      setAnnouncementModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!id) return;
    try {
      await api.deleteAnnouncement(annId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/company/${id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Announcements & Promotions
            </h1>
            <p className="text-xs text-slate-500">
              Manage live school notices, bulletins, circulars, and promotional banners for your website.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'announcements' ? (
            <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreateAnnouncement}>
              New Announcement
            </Button>
          ) : (
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setOfferModalOpen(true)}>
              Create Promotion
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'announcements'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          📢 Announcements Board ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'offers'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          🏷️ Promotional Offers ({offers.length})
        </button>
      </div>

      {/* Tab 1: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length === 0 && !loading && (
            <Card variant="bordered" className="p-8 text-center space-y-3">
              <Megaphone className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white">No announcements published yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Post official academic news, exam timetables, event reminders, or administration notices.
              </p>
              <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreateAnnouncement}>
                Post First Announcement
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <Card
                key={ann.id}
                variant="bordered"
                className={`space-y-3 border-l-4 ${
                  ann.priority === 'urgent'
                    ? 'border-l-rose-500'
                    : ann.pinned
                    ? 'border-l-amber-500'
                    : 'border-l-cyan-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ann.category}
                      </span>
                      {ann.pinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                          <Bookmark className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {ann.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{ann.title}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleOpenEditAnnouncement(ann)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1.5 text-rose-500 hover:text-rose-700"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {ann.description || ann.content}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By {ann.author || 'Administration'}</span>
                  <span>{ann.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Offers */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} variant="bordered" className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{offer.title}</h3>
                    <span className="text-[10px] text-slate-500">Valid until {offer.validUntil}</span>
                  </div>
                </div>
                <Badge variant={offer.isActive ? 'active' : 'neutral'} size="sm">
                  {offer.isActive ? 'Active on Storefront' : 'Draft'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{offer.description}</p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600">
                  {offer.discountPercent ? `${offer.discountPercent}% Discount` : 'Special Promo'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700 text-xs"
                  onClick={() => handleDeleteOffer(offer.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Announcement Modal */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title={editingAnnouncementId ? 'Edit Announcement' : 'Publish Announcement'}
        description="Share official news, events, academic notices, and circulars directly to the website."
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <Input
            label="Announcement Headline *"
            required
            placeholder="e.g. 2026/27 Academic Year Registration & Placement"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={announcementForm.category}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, category: e.target.value as Announcement['category'] })
                }
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white"
              >
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Holiday">Holiday</option>
                <option value="General">General</option>
                <option value="Arabic">Arabic Department</option>
                <option value="PTA">PTA / Parents</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={announcementForm.priority}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, priority: e.target.value as Announcement['priority'] })
                }
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Author / Department"
              placeholder="e.g. Office of the Principal"
              value={announcementForm.author}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, author: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={announcementForm.date}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Brief Summary (1-2 sentences)
            </label>
            <textarea
              rows={2}
              placeholder="A short summary displayed on the card..."
              value={announcementForm.description}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Detailed Notice / Body Text
            </label>
            <textarea
              rows={4}
              placeholder="Full announcement text, instructions for students/parents, room allocations..."
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={announcementForm.pinned}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              Pin to Top of Website
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            {editingAnnouncementId ? 'Save Announcement Changes' : 'Publish Announcement'}
          </Button>
        </form>
      </Modal>

      {/* Create Offer Modal */}
      <Modal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="Create Promotional Offer"
        description="This will display prominently on your website header and hero section."
      >
        <form onSubmit={handleCreateOffer} className="space-y-4">
          <Input
            label="Offer Title *"
            required
            placeholder="e.g. 20% Off Weekend Lunch Buffet"
            value={offerForm.title}
            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Discount % (Optional)"
              type="number"
              value={offerForm.discountPercent}
              onChange={(e) => setOfferForm({ ...offerForm, discountPercent: Number(e.target.value) })}
            />
            <Input
              label="Expiry Date *"
              type="date"
              required
              value={offerForm.validUntil}
              onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Offer Description
            </label>
            <textarea
              rows={3}
              placeholder="Valid on all dining orders every Saturday and Sunday afternoon..."
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CTA Button Text"
              value={offerForm.ctaText}
              onChange={(e) => setOfferForm({ ...offerForm, ctaText: e.target.value })}
            />
            <Input
              label="CTA Link (Optional)"
              placeholder="https://t.me/..."
              value={offerForm.ctaUrl}
              onChange={(e) => setOfferForm({ ...offerForm, ctaUrl: e.target.value })}
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Publish Promotion
          </Button>
        </form>
      </Modal>
    </div>
  );
};
