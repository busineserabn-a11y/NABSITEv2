import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight, Menu, X, Sparkles, Building2, Phone, Mail, Send, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { PlatformSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Partial<PlatformSettings>>({
    platformName: 'NABSITE',
    platformDescription: 'The Premier Managed Digital Identity & Website Platform for Ethiopian Businesses.',
    developerName: 'NABSITE Systems',
    developerUrl: '#',
    showDeveloperCredit: true,
    footerText: 'Empowering verified commercial enterprises with high-performance digital platforms.',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Platform Top Notification Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified Network
            </span>
            <span className="hidden sm:inline text-slate-400">Addis Ababa Commercial Directory & Instant Website Engine</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {user ? (
              <Link
                to={user.role === 'OWNER' ? '/mastermind' : user.role === 'ADMIN' ? '/admin' : `/company/${user.assignedCompanyId || ''}`}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Go to {user.role === 'OWNER' ? 'Mastermind Portal' : 'Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                Portal Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-extrabold text-xl tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {settings.platformName || 'NABSITE'}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Managed Identity</p>
            </div>
          </Link>

          {/* Quick Search on Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search verified companies, services, menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              to="/discover"
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${
                location.pathname === '/discover' ? 'text-slate-900 dark:text-white font-bold' : ''
              }`}
            >
              Discover
            </Link>
            <Link
              to="/#categories"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Categories
            </Link>
            <Link
              to="/#showcase"
              className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Showcase
            </Link>
            <Link
              to="/#get-started"
              className="text-slate-900 dark:text-white font-semibold hover:underline"
            >
              For Businesses
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/#get-started">
              <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
                Get Your NABSITE
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
            </form>
            <div className="flex flex-col gap-3 font-medium text-sm">
              <Link to="/discover" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-slate-800">
                Discover Companies
              </Link>
              <Link to="/#categories" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-slate-800">
                Browse Categories
              </Link>
              <Link to="/#showcase" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 dark:border-slate-800">
                Showcase & Top Digital Stands
              </Link>
              <Link to="/#get-started" onClick={() => setMobileMenuOpen(false)} className="py-2 text-amber-600 font-bold">
                Get Your NABSITE Platform
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-500">
                Sign In to Business Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Platform Brand */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white text-slate-950 flex items-center justify-center font-bold text-lg">
                  N
                </div>
                <span className="text-lg font-bold text-white tracking-tight">{settings.platformName}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{settings.platformDescription}</p>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" /> Official Commercial Directory
              </div>
            </div>

            {/* Quick Directory */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Discover</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/discover?category=Dining" className="hover:text-white transition-colors">
                    Dining & Restaurants
                  </Link>
                </li>
                <li>
                  <Link to="/discover?category=Technology" className="hover:text-white transition-colors">
                    Technology & Software
                  </Link>
                </li>
                <li>
                  <Link to="/discover?category=Hospitality" className="hover:text-white transition-colors">
                    Hotels & Hospitality
                  </Link>
                </li>
                <li>
                  <Link to="/discover?category=Healthcare" className="hover:text-white transition-colors">
                    Medical & Specialty Clinics
                  </Link>
                </li>
                <li>
                  <Link to="/discover?category=Retail" className="hover:text-white transition-colors">
                    Retail & Boutiques
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">For Businesses</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/#get-started" className="hover:text-white transition-colors">
                    Apply for Digital Presence
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Business Portal Login
                  </Link>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-white transition-colors">
                    Featured Theme Demos
                  </a>
                </li>
                <li>
                  <Link to="/#qr-stands" className="hover:text-white transition-colors">
                    QR Physical Stands & Cards
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500">24 Industry Themes Available</span>
                </li>
              </ul>
            </div>

            {/* Platform Help & Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Direct Contact</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>support@nabsite.et</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>+251 911 234567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <a href="https://t.me/nabsite" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    @nabsite_official (Telegram)
                  </a>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">Headquarters: Bole Road, Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </div>

          {/* Bottom attribution & copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {settings.platformName}. All Rights Reserved.</p>
            {settings.showDeveloperCredit && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Managed & Engineered by</span>
                <span className="font-semibold text-slate-200">
                  {settings.developerName || 'NABSITE Systems'}
                </span>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
