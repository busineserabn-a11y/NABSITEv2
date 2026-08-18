import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Server, Database, ShieldCheck, QrCode, Palette, Layers, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const OwnerHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const systems = [
    { name: 'Multi-Tenant Database Engine', icon: Database, status: health?.database?.connected ? 'OPERATIONAL' : 'DEGRADED', detail: `${health?.database?.entityCount || 0} active companies in memory store` },
    { name: 'RBAC Authorization & Gateway Engine', icon: ShieldCheck, status: health?.auth?.operational ? 'OPERATIONAL' : 'DEGRADED', detail: `${health?.auth?.activeUsers || 0} authenticated users` },
    { name: 'Theme & Design Pipeline', icon: Palette, status: health?.themesEngine?.operational ? 'OPERATIONAL' : 'DEGRADED', detail: `${health?.themesEngine?.availableThemes || 24} curated themes loaded` },
    { name: 'QR Code Generation Engine', icon: QrCode, status: health?.qrEngine?.operational ? 'OPERATIONAL' : 'DEGRADED', detail: 'Native server-side rasterization active' },
    { name: 'Real-time Event Analytics Engine', icon: Activity, status: health?.analytics?.operational ? 'OPERATIONAL' : 'DEGRADED', detail: 'Instant in-memory event stream processor' },
    { name: 'Immutable Audit Vault', icon: Layers, status: health?.auditEngine?.operational ? 'OPERATIONAL' : 'DEGRADED', detail: `${health?.auditEngine?.logsCount || 0} cryptographic log entries` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Engine Health & Diagnostics
          </h1>
          <p className="text-xs text-slate-500">
            Real-time verification of all core NABSITE technical platform foundations.
          </p>
        </div>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchHealth}>
          Refresh Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {systems.map((sys, idx) => (
          <Card key={idx} variant="bordered" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
                <sys.icon className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {sys.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sys.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{sys.detail}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
