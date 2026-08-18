import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, Phone, Mail, Send, Save, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Company, BusinessHour } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getCompany(id)
      .then((res: any) => {
        const comp = res?.company || res;
        if (comp) {
          setCompany(comp);
          setHours(comp.hours || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !company) return;
    try {
      await api.updateCompany(id, {
        ...company,
        hours,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const updateHour = (index: number, field: keyof BusinessHour, value: any) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  if (loading || !company) {
    return <div className="py-12 text-center text-slate-400">Loading business profile...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/company/${id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Business Profile & Operating Hours
            </h1>
            <p className="text-xs text-slate-500">
              Manage verified contact channels, physical coordinates, and day-by-day timetable.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Info */}
        <Card variant="bordered">
          <CardHeader>
            <div>
              <CardTitle>Business Information & Identity</CardTitle>
              <CardDescription>Public contact details shown to customers</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
              <Input
                label="Category"
                value={company.category}
                onChange={(e) => setCompany({ ...company, category: e.target.value })}
              />
            </div>

            <Input
              label="Short Tagline"
              value={company.shortDescription || ''}
              onChange={(e) => setCompany({ ...company, shortDescription: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Full Description / About Story
              </label>
              <textarea
                rows={3}
                value={company.fullDescription || ''}
                onChange={(e) => setCompany({ ...company, fullDescription: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Telephone"
                value={company.phone || ''}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              />
              <Input
                label="Email"
                value={company.email || ''}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
              />
              <Input
                label="Telegram Username"
                placeholder="without @"
                value={company.telegramUsername || ''}
                onChange={(e) => setCompany({ ...company, telegramUsername: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Physical Address"
                value={company.address || ''}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
              <Input
                label="Google Maps URL"
                value={company.mapLink || ''}
                onChange={(e) => setCompany({ ...company, mapLink: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Operating Hours Timetable */}
        <Card variant="bordered">
          <CardHeader>
            <div>
              <CardTitle>Daily Operating Schedule</CardTitle>
              <CardDescription>Powers the live "Open Now" / "Closed" indicators across NABSITE</CardDescription>
            </div>
          </CardHeader>

          <div className="divide-y divide-slate-100">
            {hours.map((h, idx) => (
              <div key={h.day} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-36">
                  <input
                    type="checkbox"
                    id={`open-${h.day}`}
                    checked={h.isOpen}
                    onChange={(e) => updateHour(idx, 'isOpen', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900"
                  />
                  <label htmlFor={`open-${h.day}`} className="text-xs font-bold text-slate-800">
                    {h.day}
                  </label>
                </div>

                {h.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateHour(idx, 'openTime', e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-900"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateHour(idx, 'closeTime', e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-900"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-rose-600">Closed All Day</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Profile changes saved!
            </span>
          )}
          <Button type="submit" variant="primary" size="lg" icon={Save}>
            Save Profile & Hours
          </Button>
        </div>
      </form>
    </div>
  );
};
