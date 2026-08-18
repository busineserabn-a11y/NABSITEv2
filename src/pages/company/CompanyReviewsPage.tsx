import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Review } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';

export const CompanyReviewsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getReviews(id);
      setReviews(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const handleStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await api.moderateReview(reviewId, status);
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview || !replyText) return;
    try {
      await api.moderateReview(activeReview.id, activeReview.status || 'approved', replyText);
      setReplyModalOpen(false);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/company/${id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Customer Reviews Moderation
            </h1>
            <p className="text-xs text-slate-500">
              Review feedback left by customers, approve for public display, or respond directly.
            </p>
          </div>
        </div>
      </div>

      <Table<Review>
        isLoading={loading}
        data={reviews}
        keyExtractor={(r: Review) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Customer',
            render: (r: Review) => (
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-xs">{r.name}</span>
                <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ),
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (r: Review) => (
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            ),
          },
          {
            key: 'text',
            header: 'Review & Response',
            render: (r: Review) => (
              <div className="space-y-1 max-w-md">
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{r.text}"</p>
                {r.reply && (
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ↪ Reply: "{r.reply}"
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r: Review) => (
              <Badge
                variant={r.status === 'approved' ? 'active' : r.status === 'rejected' ? 'suspended' : 'pending'}
                size="sm"
              >
                {r.status}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (r: Review) => (
              <div className="flex items-center justify-end gap-2">
                {r.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs"
                      onClick={() => handleStatus(r.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-rose-600"
                      onClick={() => handleStatus(r.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setActiveReview(r);
                    setReplyText(r.reply || '');
                    setReplyModalOpen(true);
                  }}
                >
                  {r.reply ? 'Edit Reply' : 'Reply'}
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Reply Modal */}
      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title="Reply to Customer Review"
        description="Your response will appear publicly beneath the customer's review on your digital storefront."
      >
        <form onSubmit={handleReplySubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-900">{activeReview?.name} wrote:</p>
            <p className="text-slate-600 italic">"{activeReview?.text}"</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Your Public Response *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Thank you for visiting us! We are thrilled you enjoyed the food and look forward to serving you again..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Save Public Reply
          </Button>
        </form>
      </Modal>
    </div>
  );
};
