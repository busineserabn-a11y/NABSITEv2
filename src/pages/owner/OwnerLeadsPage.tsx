import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Lead } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';

export const OwnerLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads();
      setLeads(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      await api.updateLeadStatus(leadId, newStatus);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    try {
      await api.convertLead(leadId);
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeads = leads.filter((l: Lead) => {
    if (activeTab === 'all') return true;
    return l.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lead Pipeline & Conversion CRM
          </h1>
          <p className="text-xs text-slate-500">
            Incoming business applications submitted via public platform portal. One-click company provisioning.
          </p>
        </div>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'new', 'contacted', 'approved', 'company_created', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setActiveTab(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              activeTab === st
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {st.replace('_', ' ')} (
            {st === 'all' ? leads.length : leads.filter((l: Lead) => l.status === st).length})
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <Table<Lead>
        isLoading={loading}
        data={filteredLeads}
        keyExtractor={(item: Lead) => item.id}
        columns={[
          {
            key: 'companyName',
            header: 'Applicant & Business',
            render: (l: Lead) => (
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{l.companyName}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">{l.fullName} • {l.category}</span>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Direct Channels',
            render: (l: Lead) => (
              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                <p>📞 {l.phone}</p>
                {l.email && <p>✉️ {l.email}</p>}
                {l.telegramUsername && <p className="text-sky-500">✈️ @{l.telegramUsername}</p>}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Pipeline Stage',
            render: (l: Lead) => (
              <Badge variant={l.status as any} size="sm">
                {l.status.replace('_', ' ')}
              </Badge>
            ),
          },
          {
            key: 'createdAt',
            header: 'Date Submitted',
            render: (l: Lead) => (
              <span className="text-xs text-slate-500">
                {new Date(l.createdAt).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Conversion Actions',
            align: 'right',
            render: (l: Lead) => (
              <div className="flex items-center justify-end gap-2">
                {l.status === 'new' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleStatusUpdate(l.id, 'contacted')}
                  >
                    Mark Contacted
                  </Button>
                )}

                {l.status === 'contacted' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleStatusUpdate(l.id, 'approved')}
                  >
                    Approve
                  </Button>
                )}

                {l.status !== 'company_created' && l.status !== 'rejected' && (
                  <Button
                    size="sm"
                    variant="gold"
                    className="text-xs font-bold"
                    icon={Building2}
                    onClick={() => handleConvertLead(l.id)}
                  >
                    Convert to Company
                  </Button>
                )}

                {l.status === 'company_created' && l.convertedCompanyId && (
                  <Link to={`/company/${l.convertedCompanyId}`}>
                    <Button size="sm" variant="outline" className="text-xs" icon={ArrowRight} iconPosition="right">
                      View Company Hub
                    </Button>
                  </Link>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
