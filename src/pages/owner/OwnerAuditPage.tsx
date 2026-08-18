import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

export const OwnerAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Security & Immutable Audit Vault
        </h1>
        <p className="text-xs text-slate-500">
          Full cryptographic record of all administrative operations, lifecycle updates, publications, and gateway access events.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action type, or target resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <Table<AuditLog>
        isLoading={loading}
        data={filteredLogs}
        keyExtractor={(item: AuditLog) => item.id}
        columns={[
          {
            key: 'timestamp',
            header: 'Timestamp',
            render: (l: AuditLog) => (
              <span className="text-xs font-mono text-slate-500">
                {new Date(l.timestamp).toLocaleString()}
              </span>
            ),
          },
          {
            key: 'actor',
            header: 'Actor & Role',
            render: (l: AuditLog) => (
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-xs">{l.actorName}</span>
                <Badge variant={l.actorRole === 'OWNER' ? 'gold' : 'neutral'} size="sm">
                  {l.actorRole}
                </Badge>
              </div>
            ),
          },
          {
            key: 'action',
            header: 'Executed Action',
            render: (l: AuditLog) => (
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {l.action}
              </span>
            ),
          },
          {
            key: 'resource',
            header: 'Resource Target',
            render: (l: AuditLog) => (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {l.resourceType} ({l.resourceId?.substring(0, 16) || ''}...)
              </span>
            ),
          },
          {
            key: 'result',
            header: 'Status',
            render: (l: AuditLog) => (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  l.result === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {l.result === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {l.result}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};
