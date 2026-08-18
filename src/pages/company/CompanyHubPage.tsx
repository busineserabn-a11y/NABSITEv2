import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Globe,
  Utensils,
  Star,
  Tag,
  Clock,
  QrCode,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Website } from '../../types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const CompanyHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getCompany(id), api.getCompanyWebsite(id)])
      .then(([compData, siteData]) => {
        setCompany(compData.company);
        setWebsite(siteData.website || compData.website);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !company) {
    return <div className="py-12 text-center text-slate-400">Loading Business Workspace Hub...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{company.name}</h1>
              <Badge variant={company.status === 'active' ? 'active' : 'suspended'} size="sm">
                {company.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{company.category} • /{company.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/company/${company.id}/wizard`}>
            <Button size="md" variant="outline" icon={Sparkles}>
              Website Wizard
            </Button>
          </Link>
          <Link to={`/studio/${company.id}`}>
            <Button size="md" variant="primary" icon={Globe}>
              Website Studio
            </Button>
          </Link>
          <Link to={`/c/${company.slug}`} target="_blank">
            <Button size="md" variant="outline" icon={ExternalLink}>
              View Live Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to={`/company/${company.id}/products`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Products & Menu Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage food items, prices in ETB, categories, and Telegram order routing.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/reviews`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                Customer Reviews
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Approve, reject, or reply directly to verified visitor reviews.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/offers`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Promotions & Announcements
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Display holiday specials, discounts, and flash announcements on your website banner.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/profile`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Business Hours & Profile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure daily opening & closing schedule, phone lines, and physical map coordinates.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/company/${company.id}/qr`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-slate-700 transition-colors">
                QR Studio & Stand Cards
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize branded table QR stands, download print files, and track camera scan logs.
              </p>
            </div>
          </Card>
        </Link>

        <Link to={`/studio/${company.id}`}>
          <Card variant="bordered" className="hover:border-slate-400 transition-all space-y-3 cursor-pointer group bg-slate-900 text-white border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                Website Studio (24 Themes)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Switch themes, live preview desktop/tablet/mobile, and publish with 1-click validation.
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
