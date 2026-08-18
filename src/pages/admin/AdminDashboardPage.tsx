import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  Users,
  QrCode,
  ArrowRight,
  Plus,
  Store,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Company, Lead } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CompanyName } from '../../components/ui/CompanyName';

export const AdminDashboardPage: React.FC = () => {
  const { user, setSelectedCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCompanies(), api.getLeads()])
      .then(([comps, lds]) => {
        setCompanies(comps);
        setLeads(lds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <Badge variant="info" size="sm">Admin Workspace</Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500">
            Manage assigned company digital presence, onboard new businesses, and configure physical QR stands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/companies">
            <Button size="sm" variant="primary" icon={Plus}>
              Onboard Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Companies</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{companies.length}</p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Published Sites</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {companies.filter((c) => c.websiteStatus === 'published').length}
          </p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Leads</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {leads.filter((l) => l.status === 'new').length}
          </p>
        </Card>

        <Card variant="bordered" padding="sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">QR Stands Active</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{companies.length}</p>
        </Card>
      </div>

      {/* Companies List */}
      <Card variant="bordered">
        <CardHeader>
          <div>
            <CardTitle>My Managed Companies</CardTitle>
            <CardDescription>Click any company to open its business hub, menu catalog, and website studio</CardDescription>
          </div>
          <Link to="/admin/companies">
            <Button size="sm" variant="ghost" icon={ArrowRight} iconPosition="right">
              View All
            </Button>
          </Link>
        </CardHeader>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {companies.map((comp) => (
            <div key={comp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={comp.logo}
                  alt={comp.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    <CompanyName name={comp.name} maxWidth="max-w-[220px]" />
                  </h3>
                  <p className="text-xs text-slate-500">{comp.category} • /{comp.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={comp.websiteStatus === 'published' ? 'published' : 'draft'} size="sm">
                  {comp.websiteStatus}
                </Badge>
                <Link
                  to={`/company/${comp.id}`}
                  onClick={() => setSelectedCompanyId(comp.id)}
                >
                  <Button size="sm" variant="primary" className="text-xs">
                    Open Hub
                  </Button>
                </Link>
                <Link to={`/studio/${comp.id}`}>
                  <Button size="sm" variant="outline" className="text-xs" icon={Globe}>
                    Studio
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
