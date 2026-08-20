import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, KeyRound, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const { login, resetPassword, isConfigured, missingConfigKeys } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      setSuccessMsg('Authentication successful! Redirecting...');

      // Fast role-based redirect
      setTimeout(() => {
        if (loggedUser.role === 'OWNER') {
          navigate('/mastermind');
        } else if (loggedUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (loggedUser.role === 'SUB_ADMIN') {
          navigate(`/company/${loggedUser.assignedCompanyId || ''}`);
        } else {
          navigate('/');
        }
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(
        `A password reset link has been dispatched to ${resetEmail}. Please check your inbox.`
      );
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md">
            N
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign in to NABSITE
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Authorized portal access for platform administrators and company managers.
          </p>
        </div>

        {/* Configuration Notice for Environment Setup */}
        {!isConfigured && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Firebase Environment Required</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Firebase credentials are not detected in environment variables. Please add{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[11px] text-amber-300">
                {missingConfigKeys.join(', ') || 'VITE_FIREBASE_API_KEY'}
              </code>{' '}
              in your environment deployment settings.
            </p>
          </div>
        )}

        {/* Auth Card */}
        <Card variant="bordered" padding="lg" className="space-y-5 shadow-xl bg-slate-900 border-slate-800">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl leading-relaxed flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-medium rounded-xl leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. name@company.et"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetError(null);
                  setResetSuccess(null);
                  setForgotModalOpen(true);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading}
              className="w-full font-bold text-slate-950 shadow-md transition-all active:scale-[0.99]"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Password"
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-400">
            Enter your registered NABSITE account email address. We will send a secure password reset link directly to your inbox.
          </p>

          {resetSuccess ? (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Reset Email Sent</span>
              </div>
              <p>{resetSuccess}</p>
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={() => setForgotModalOpen(false)} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              {resetError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl">
                  {resetError}
                </div>
              )}

              <Input
                label="Registered Email"
                type="email"
                required
                placeholder="e.g. staff@company.et"
                icon={Mail}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />

              <div className="flex items-center gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotModalOpen(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={resetLoading || !resetEmail}
                  icon={KeyRound}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
