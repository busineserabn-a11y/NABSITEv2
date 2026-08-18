import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Plus, Trash2, ArrowLeft, Bell, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { Offer, Announcement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export const CompanyOffersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountPercent: 15,
    validUntil: '2026-12-31',
    ctaText: 'Claim Special Offer',
    ctaUrl: '',
    isActive: true,
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
              Promotions & Announcements
            </h1>
            <p className="text-xs text-slate-500">
              Create promotional discount banners and alerts that appear directly on your digital storefront.
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={() => setOfferModalOpen(true)}>
          Create Promotion
        </Button>
      </div>

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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Offer Description
            </label>
            <textarea
              rows={3}
              placeholder="Valid on all dining orders every Saturday and Sunday afternoon..."
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
