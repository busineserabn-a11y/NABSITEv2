import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, Sparkles, Building2, User, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const authUser = await login(email, password);
      if (authUser?.role === 'OWNER') {
        navigate('/mastermind');
        return;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
            N
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            NABSITE Business Portal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Authorized sign in for company administrators and assigned managers.
          </p>
        </div>

        {/* Login Card */}
        <Card variant="bordered" padding="lg" className="space-y-6 shadow-xl">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Business Email"
              type="email"
              required
              placeholder="e.g. admin@nabsite.et"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@nabsite.io')}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Admin</p>
                </div>
                <p className="text-[10px] text-slate-500">Full Workspace Access</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('manager@addisgourmet.com')}
                className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Sub-Admin</p>
                </div>
                <p className="text-[10px] text-slate-500">Addis Gourmet Store</p>
              </button>
            </div>
          </div>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
            ← Return to Discovery Platform
          </Link>
        </div>
      </div>
    </div>
  );
};
