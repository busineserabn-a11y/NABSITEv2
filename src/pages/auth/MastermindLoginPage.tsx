import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const MastermindLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.role !== 'OWNER' && email.toLowerCase() !== 'busineser.abn@gmail.com') {
        setError('Access restricted: This account does not have platform owner clearance.');
        return;
      }
      navigate('/mastermind');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify owner credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-hidden">
      {/* Background glow */}
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
              Platform Authority Access
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Secure authentication for verified platform administrators.
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card variant="bordered" padding="lg" className="space-y-5 bg-slate-900 border-slate-800 shadow-2xl">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label="Owner / Administrator Email"
              type="email"
              required
              placeholder="e.g. owner@domain.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading}
              className="w-full font-black text-slate-950 shadow-md"
            >
              {loading ? 'Authenticating...' : 'Sign In as Owner'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
