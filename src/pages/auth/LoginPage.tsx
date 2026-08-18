import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setError('Please provide your full name');
          setLoading(false);
          return;
        }
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {isRegisterMode ? 'Create NABSITE Account' : 'NABSITE Business Portal'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isRegisterMode
              ? 'Register your account to manage your company and digital presence.'
              : 'Sign in to access your company dashboard, digital menu, and website.'}
          </p>
        </div>

        {/* Login Card */}
        <Card variant="bordered" padding="lg" className="space-y-6 shadow-xl bg-slate-900 border-slate-800">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="e.g. Dawit Haile"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

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
              className="w-full font-bold text-slate-950"
            >
              {loading ? 'Authenticating...' : isRegisterMode ? 'Register Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              {isRegisterMode
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
