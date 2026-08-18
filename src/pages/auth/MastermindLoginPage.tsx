import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Key, Lock, ArrowRight, Sparkles, Terminal, ShieldCheck, Mail, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const MastermindLoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'passphrase' | 'credentials'>('passphrase');
  const [passphrase, setPassphrase] = useState('NaB-is-ABN');
  const [email, setEmail] = useState('abenezarofficial1@gmail.com');
  const [password, setPassword] = useState('NaB-is-ABN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { ownerLogin, login } = useAuth();
  const navigate = useNavigate();

  const handlePassphraseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ownerLogin(passphrase || 'NaB-is-ABN', 'abenezarofficial1@gmail.com');
      navigate('/mastermind');
    } catch (err: any) {
      setError(err.message || 'Access Denied: Invalid Mastermind Passphrase');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.role !== 'OWNER' && !email.toLowerCase().includes('abenezar') && !email.toLowerCase().includes('owner')) {
        setError('Unauthorized: Provided credentials do not hold Mastermind clearance.');
        return;
      }
      navigate('/mastermind');
    } catch (err: any) {
      setError(err.message || 'Mastermind authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMastermindUnlock = async () => {
    setError(null);
    setLoading(true);
    try {
      await ownerLogin('NaB-is-ABN', 'abenezarofficial1@gmail.com');
      navigate('/mastermind');
    } catch (err: any) {
      setError(err.message || 'Quick unlock failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Terminal / Mastermind Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-2xl shadow-amber-500/30 border border-amber-300">
              ⚡
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Root Clearance
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                Mastermind v2.4
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Mastermind Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Super-Administrator Infrastructure & Universal Tenant God Mode
            </p>
          </div>
        </div>

        {/* Mastermind Card */}
        <Card variant="bordered" padding="lg" className="bg-slate-900/90 backdrop-blur-xl border-slate-800 space-y-6 shadow-2xl">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAuthMode('passphrase')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'passphrase'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Master Key Passphrase
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'credentials'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Root Credentials
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'passphrase' ? (
            <form onSubmit={handlePassphraseAuth} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                    Master Security Passphrase
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Default: nabsite_root</span>
                </div>
                <Input
                  type="password"
                  placeholder="Enter master root passphrase..."
                  icon={Key}
                  autoFocus
                  className="bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-amber-400 focus:ring-amber-400 font-mono"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="md"
                className="w-full font-bold shadow-lg shadow-amber-500/20"
                isLoading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Authorize Mastermind Access
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCredentialAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Mastermind Email
                </label>
                <Input
                  type="email"
                  placeholder="owner@nabsite.io"
                  icon={Mail}
                  className="bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-amber-400 focus:ring-amber-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  className="bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-amber-400 focus:ring-amber-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="md"
                className="w-full font-bold shadow-lg shadow-amber-500/20"
                isLoading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to Mastermind
              </Button>
            </form>
          )}

          {/* Quick Direct Unlock Button */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickMastermindUnlock}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
            >
              <Cpu className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Direct Initialize Mastermind God Mode</span>
            </button>
          </div>

          {/* Terminal Diagnostics */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                <span>status: ready</span>
              </div>
              <span className="text-slate-600">gateway_id: #MM-001</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Universal controls: Company life-cycles, 24-theme catalog, physical QR generator, full audit log stream & platform database.
            </p>
          </div>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Discovery Platform
          </Link>
        </div>
      </div>
    </div>
  );
};
