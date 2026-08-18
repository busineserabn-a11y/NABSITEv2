import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const AccessDeniedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = () => {
    logout();
    navigate('/platform-access');
  };

  const getReturnPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'SUB_ADMIN') return `/company/${user.assignedCompanyId || ''}`;
    return '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase tracking-widest">
            <span>403 FORBIDDEN</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Access Denied
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            The requested platform management area requires Owner clearance. Your current account ({user?.email || 'Guest'}) does not have permission to view this section.
          </p>
        </div>

        <Card variant="bordered" padding="lg" className="bg-slate-900/90 border-slate-800 space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-1">
            <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Active Session</div>
            <div className="text-slate-200 font-bold truncate">{user?.name || 'Not logged in'}</div>
            <div className="text-slate-400 text-[11px] font-mono">Role: {user?.role || 'ANONYMOUS'}</div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link to={getReturnPath()} className="w-full">
              <Button variant="primary" size="md" className="w-full" icon={ArrowLeft}>
                Return to Workspace
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              className="w-full text-slate-300"
              onClick={handleSwitchAccount}
              icon={Lock}
            >
              Sign In with Authorized Account
            </Button>
          </div>
        </Card>

        <p className="text-[11px] text-slate-600">
          NABSITE Security Gateway • Violation events are logged
        </p>
      </div>
    </div>
  );
};
