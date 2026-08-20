import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';

export const PlatformAccessPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const { ownerLogin, resetPassword, isConfigured, missingConfigKeys } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const user = await ownerLogin(email, password);
      if (user?.role === 'OWNER') {
        setSuccessMsg('Owner credentials verified. Access granted.');
        setTimeout(() => navigate('/mastermind'), 250);
      } else {
        setError('Access Denied: This account is not authorized for NABSITE Platform Access.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify owner credentials.');
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
        `A password recovery link has been dispatched to ${resetEmail}. Follow the instructions in your email.`
      );
    } catch (err: any) {
      setResetError(err.message || 'Failed to send recovery link.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Mastermind Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              NABSITE Platform Access
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Secure authentication for verified platform management.
            </p>
          </div>
        </div>

        {/* Configuration Notice */}
        {!isConfigured && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Firebase Environment Required</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Missing Firebase configuration variables: {missingConfigKeys.join(', ')}. Please configure them in your environment settings.
            </p>
          </div>
        )}

        {/* Auth Card */}
        <Card variant="bordered" padding="lg" className="space-y-5 bg-slate-900 border-slate-800 shadow-2xl">
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

          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="owner@domain.com"
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

            <div className="flex items-center justify-end pt-1">
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
              className="w-full font-black text-slate-950 shadow-md transition-all active:scale-[0.99]"
            >
              {loading ? 'Authenticating...' : 'Sign In as Owner'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Owner Password Recovery"
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-400">
            Enter your platform owner email address. A secure recovery link will be sent to reset your password.
          </p>

          {resetSuccess ? (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Recovery Link Sent</span>
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
                label="Owner Email"
                type="email"
                required
                placeholder="owner@domain.com"
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
                  {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
