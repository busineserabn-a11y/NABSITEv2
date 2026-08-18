import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  Phone,
  Send,
  QrCode,
  CheckCircle2,
  Layers,
  Zap,
  Globe2,
  TrendingUp,
  Store,
  ChevronRight,
  ExternalLink,
  Star,
  Smartphone,
  Laptop,
  Check,
  Clock,
  MapPin,
  Flame,
  Coffee,
  UtensilsCrossed,
  Wine,
  Cake,
  Palette,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Category, ShowcaseItem, LandingHeroSettings } from '../../types';
import { BUSINESS_CATEGORIES } from '../../data/themes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CompanyName } from '../../components/ui/CompanyName';
import { HeroMotionVisual } from '../../components/public/HeroMotionVisual';

export const HomePage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMenuTab, setActiveMenuTab] = useState<string>('mains');
  const [heroSettings, setHeroSettings] = useState<LandingHeroSettings>({
    backgroundType: 'animated',
    bgType: 'animated',
    overlayOpacity: 70,
    showMotionElements: true,
    enableHandAnimation: true,
    enableParticles: true,
    enableFloatingCards: true,
    enableParallax: true,
    enableGlow: true,
    motionIntensity: 'medium',
  });
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    category: 'Restaurant',
    message: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.discoverCompanies(),
      api.getCategories(),
      api.getShowcase(),
      api.getSettings().catch(() => null),
    ])
      .then(([comps, cats, shows, sets]) => {
        setCompanies(comps || []);
        setCategories(cats || []);
        setShowcase(shows || []);
        if (sets?.heroSettings) {
          setHeroSettings(sets.heroSettings);
        }
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName || !leadForm.companyName || !leadForm.phone) return;
    setLeadLoading(true);
    try {
      await api.submitLead(leadForm);
      setLeadSubmitted(true);
    } catch (err) {
      console.error('Lead submission failed', err);
    } finally {
      setLeadLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (selectedCategory !== 'all') {
      return c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    }
    return true;
  });

  const isAnimatedHero =
    heroSettings.backgroundType === 'animated' ||
    heroSettings.bgType === 'animated' ||
    (!heroSettings.bgType && !heroSettings.backgroundType) ||
    (heroSettings.bgType !== 'video' && heroSettings.bgType !== 'image' && heroSettings.bgType !== 'solid');

  // Showcase list: duplicate to achieve smooth infinite marquee loop
  const showcaseList = companies.length > 0 ? [...companies, ...companies] : [];

  // Simulated digital menu items for interactive QR demo
  const sampleMenuItems = {
    mains: [
      {
        id: 'm1',
        name: 'Special Tibs Sizzling Platter',
        desc: 'Tender prime beef sauteed with rosemary, Ethiopian clarified butter (niter kibbeh), garlic, and jalapeño peppers.',
        price: '480 ETB',
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'm2',
        name: 'Doro Wat Heritage Stew',
        desc: 'Slow-simmered organic chicken in rich berbere spiced sauce with slow-cooked red onions and hard-boiled farm egg.',
        price: '550 ETB',
        badge: 'Chef Signature',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'm3',
        name: 'Bayenetu Vegan Feast',
        desc: 'Vibrant spread of misir wot, kik alicha, gomen, atkilt wot, and beetroot salad over fresh teff injera.',
        price: '380 ETB',
        badge: '100% Vegan',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80',
      },
    ],
    drinks: [
      {
        id: 'd1',
        name: 'Yirgacheffe Single-Origin Pour Over',
        desc: 'Floral and citrus notes roasted to light-medium profile, brewed fresh by master baristas.',
        price: '120 ETB',
        badge: 'Single Origin',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'd2',
        name: 'Fresh Avocado Mango Spritzer',
        desc: 'Layered fresh tropical avocado puree, mango nectar, and fresh lime zest.',
        price: '160 ETB',
        badge: 'Fresh Daily',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
      },
    ],
    desserts: [
      {
        id: 'ds1',
        name: 'Spiced Cardamom Baklava Platter',
        desc: 'Crispy phyllo pastry layered with chopped pistachios, wild Ethiopian honey, and clove-infused syrup.',
        price: '220 ETB',
        badge: 'House Made',
        image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&auto=format&fit=crop&q=80',
      },
    ],
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      {/* 1. HERO SECTION WITH CINEMATIC MOTION */}
      <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden min-h-[660px] flex flex-col items-center justify-center">
        {/* Dynamic Background */}
        {heroSettings.bgType === 'video' && heroSettings.videoUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              autoPlay={heroSettings.videoAutoplay ?? true}
              loop={heroSettings.videoLoop ?? true}
              muted={heroSettings.videoMuted ?? true}
              playsInline
              className="w-full h-full object-cover scale-105"
            >
              <source src={heroSettings.videoUrl} type="video/mp4" />
            </video>
            <div
              className="absolute inset-0 bg-slate-950"
              style={{ opacity: (heroSettings.overlayOpacity ?? 70) / 100 }}
            />
          </div>
        ) : heroSettings.bgType === 'image' && heroSettings.imageUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={heroSettings.imageUrl}
              alt="Hero Background"
              className="w-full h-full object-cover scale-105"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0 bg-slate-950"
              style={{ opacity: (heroSettings.overlayOpacity ?? 70) / 100 }}
            />
          </div>
        ) : heroSettings.bgType === 'solid' ? (
          <div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: heroSettings.solidColor || '#080d1a' }}
          />
        ) : (
          /* Dynamic Mesh Gradient Background */
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#080d1a] via-[#0e172a] to-[#080d1a]">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 left-1/4 w-[450px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
          </div>
        )}

        {/* HERO MAIN CONTENT */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 text-center space-y-6 pt-2">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 text-white border border-amber-500/30 text-xs font-semibold shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide text-slate-200">
              {heroSettings.badgeText || 'NABSITE Commercial Digital Network • Verified Stand Directory'}
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md">
              {heroSettings.title || heroSettings.headline || 'The Verified Digital Home for Top Ethiopian Businesses.'}
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              {heroSettings.subtitle ||
                'Discover verified restaurants, cafés, boutique hotels, and stores — with instant digital menus, live storefronts, and acrylic table QR stands.'}
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-2xl mx-auto pt-2">
            <form
              onSubmit={handleSearch}
              className="p-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex items-center gap-3 pl-4 w-full sm:w-auto flex-1">
                <Search className="w-5 h-5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search restaurants, cafes, hotels, clinics, boutiques..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm bg-transparent text-white placeholder-slate-400 focus:outline-none py-2"
                />
              </div>
              <Button
                type="submit"
                size="md"
                variant="gold"
                className="w-full sm:w-auto rounded-xl sm:rounded-full px-6 shadow-md font-bold"
              >
                Search Directory
              </Button>
            </form>
          </div>
        </div>

        {/* CINEMATIC INTERACTIVE MOTION HERO VISUAL */}
        {isAnimatedHero && (
          <div className="w-full max-w-7xl mx-auto px-2 relative z-10 -mt-6 sm:-mt-2">
            <HeroMotionVisual
              motionIntensity={(heroSettings.motionIntensity as any) || 'medium'}
              enableHandAnimation={heroSettings.enableHandAnimation ?? true}
              enableParticles={heroSettings.enableParticles ?? true}
              enableFloatingCards={heroSettings.enableFloatingCards ?? true}
              enableParallax={heroSettings.enableParallax ?? true}
              enableGlow={heroSettings.enableGlow ?? true}
            />
          </div>
        )}

        {/* Quick Metrics Bar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 w-full pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto border-t border-slate-800/80 pt-6">
            <div className="text-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xs">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Verified Live</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xs">
              <p className="text-2xl font-black text-white">324</p>
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mt-0.5">Bespoke Layouts</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xs">
              <p className="text-2xl font-black text-white">&lt; 40ms</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">QR Mobile Stand</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 shadow-2xs">
              <p className="text-2xl font-black text-white">Zero</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Tech Setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE COMPANY SHOWCASE (ZERO PUBLIC CONTROLS - SEAMLESS CONTINUOUS MARQUEE) */}
      <section className="space-y-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Featured Platform Network
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Top Verified Businesses on NABSITE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Explore live commercial websites, digital menus, and table stands deployed on our high-speed engine.
          </p>
        </div>

        {/* Marquee Track Container with subtle gradient edge fades */}
        <div className="relative w-full overflow-hidden py-4">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#080d1a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#080d1a] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-infinite gap-6 pl-4">
            {showcaseList.map((comp, idx) => (
              <div
                key={`${comp.id}-${idx}`}
                className="w-80 sm:w-96 shrink-0 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Cover & Brand */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={comp.coverImage || comp.logo}
                    alt={comp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="published" size="sm">
                      ✓ Verified Live
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-900 object-cover shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-white truncate">
                      <h3 className="font-extrabold text-sm leading-tight truncate">
                        <CompanyName name={comp.name} maxWidth="max-w-[200px]" />
                      </h3>
                      <p className="text-[11px] text-amber-400 font-medium">{comp.category}</p>
                    </div>
                  </div>
                </div>

                {/* Description & Links */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {comp.shortDescription || `Experience the premier digital presence of ${comp.name}.`}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-bold text-white">4.9</span>
                      </div>
                      <span>•</span>
                      <span className="truncate">📍 {comp.address.split(',')[0]}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <Link to={`/c/${comp.slug}`} className="flex-1">
                      <Button size="sm" variant="gold" className="w-full text-xs font-bold truncate">
                        View Website
                      </Button>
                    </Link>
                    <Link to={`/c/${comp.slug}/menu`}>
                      <Button size="sm" variant="outline" className="text-xs font-bold">
                        Menu
                      </Button>
                    </Link>
                    <Link to={`/c/${comp.slug}/qr`} title="Digital QR Stand">
                      <button className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors">
                        <QrCode className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DISCOVER BUSINESSES (SPOTLIGHT WITH CATEGORY FILTER) */}
      <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              <Store className="w-3.5 h-3.5" /> Commercial Directory
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1">
              Discover Local Businesses
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Filter by industry to explore verified menus, store catalogs, and physical locations.
            </p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start md:self-end"
          >
            <span>Explore All 300+ Stands</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            All Categories ({companies.length})
          </button>
          {BUSINESS_CATEGORIES.slice(0, 10).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verified Companies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              variant="bordered"
              padding="none"
              className="bg-slate-900/90 border-slate-800 hover:border-amber-500/40 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Cover Image / Logo Banner */}
                <div className="relative h-44 bg-slate-950 overflow-hidden">
                  <img
                    src={company.coverImage || company.logo}
                    alt={company.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="published" size="sm">
                      ✓ Verified Live
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-900 object-cover shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-white truncate">
                      <h3 className="font-extrabold text-sm leading-tight truncate">
                        <CompanyName name={company.name} maxWidth="max-w-[200px]" />
                      </h3>
                      <p className="text-[11px] text-amber-400">{company.category}</p>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {company.shortDescription || `Explore verified offerings and store updates from ${company.name}.`}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      📍 {company.address.split(',')[0]}
                    </span>
                    {company.phone && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                        📞 {company.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <Link to={`/c/${company.slug}`} className="flex-1">
                  <Button size="sm" variant="gold" className="w-full text-xs font-bold">
                    View Website
                  </Button>
                </Link>
                <Link to={`/c/${company.slug}/menu`}>
                  <Button size="sm" variant="outline" className="text-xs font-bold">
                    Menu
                  </Button>
                </Link>
                <Link to={`/c/${company.slug}/qr`} title="Digital QR Stand">
                  <button className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors">
                    <QrCode className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. HOW NABSITE WORKS (3-STEP STORY) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/20">
            <Zap className="w-3.5 h-3.5" /> Frictionless Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            How NABSITE Powers Your Business
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            From physical tables to lightning-fast cloud websites in 3 simple stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative space-y-5 hover:border-amber-500/30 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xl border border-amber-500/20">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Instant Provisioning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your business entity is provisioned with zero server configuration. Automatic subdomain routing, SSL encryption, and high-performance database binding are configured out of the box.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-amber-400 flex items-center gap-1">
              ✓ Database + Subpath Engine Ready
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative space-y-5 hover:border-cyan-500/30 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-xl border border-cyan-500/20">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Dynamic Studio Customizer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from 324 curated templates across 18 business categories. Effortlessly upload food items, prices, high-res photos, brand palettes, and contact channels in real time.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              ✓ Real-time Live Preview Editor
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative space-y-5 hover:border-emerald-500/30 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/20">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">Live Site & QR Table Stand</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive customized acrylic QR table stands and cards for your physical establishment. Customers scan and instantly view your digital menu and store on any mobile browser.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              ✓ High-Resolution Table QR Stands
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIGITAL MENU & QR STAND LIVE EXPERIENCE (INTERACTIVE SMARTPHONE MOCKUP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Explanatory Copy & QR Stand Visual */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
              <QrCode className="w-3.5 h-3.5" /> High-Speed Digital Menu Engine
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Interactive Table Stands. Instant Mobile Menus.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Eliminate expensive paper printing and outdated menus. When guests sit down at your tables, they scan the branded NABSITE QR stand and view an ultra-responsive, photo-rich digital menu in under 40 milliseconds.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Zero App Download', desc: 'Runs instantly in Safari, Chrome, and Telegram webviews without friction.' },
                { title: 'Live Price & Stock Updates', desc: 'Mark items sold out or update seasonal pricing in 2 clicks.' },
                { title: 'Direct Order via Telegram & Phone', desc: 'Send customized order requests straight to your staff.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Link to="/discover">
                <Button variant="gold" size="md" className="font-bold">
                  Try Live Digital Menu <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/owner/qr">
                <Button variant="outline" size="md" icon={QrCode}>
                  View QR Print Engine
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Interactive Simulated Smartphone Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[360px] rounded-[42px] p-3.5 bg-slate-950 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

              {/* Inside Phone Screen */}
              <div className="rounded-[30px] bg-slate-900 text-slate-100 overflow-hidden border border-slate-800 space-y-4 pb-4">
                {/* Mock Header */}
                <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white space-y-1">
                  <div className="flex items-center justify-between text-[10px] opacity-80 uppercase tracking-widest font-mono">
                    <span>Table #04 • QR Stand</span>
                    <span className="flex items-center gap-1">● Live</span>
                  </div>
                  <h4 className="text-base font-black truncate">Lucy Single Origin Bistro</h4>
                  <p className="text-[11px] text-amber-100 line-clamp-1">Specialty roastery & culinary kitchen</p>
                </div>

                {/* Tab Switcher */}
                <div className="px-3 flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl mx-3 border border-slate-800">
                  <button
                    onClick={() => setActiveMenuTab('mains')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      activeMenuTab === 'mains'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mains
                  </button>
                  <button
                    onClick={() => setActiveMenuTab('drinks')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      activeMenuTab === 'drinks'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Coffee & Drinks
                  </button>
                  <button
                    onClick={() => setActiveMenuTab('desserts')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      activeMenuTab === 'desserts'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dessert
                  </button>
                </div>

                {/* Items List */}
                <div className="px-3 space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-none">
                  {(sampleMenuItems as any)[activeMenuTab]?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3 hover:border-slate-700 transition-all"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                          <span className="text-[11px] font-black text-amber-400 shrink-0">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.desc}</p>
                        <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Bar */}
                <div className="px-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Ready to order?</span>
                    <button className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1">
                      <Send className="w-3 h-3" /> Call Waiter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WEBSITE ENGINE EXPERIENCE (DESKTOP + MOBILE RESPONSIVE PREVIEW) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
            <Laptop className="w-3.5 h-3.5" /> High-Performance Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Desktop Elegance Meets Mobile Precision
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Every NABSITE template is mathematically balanced for touch devices, tablets, and wide screens.
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs font-mono text-slate-400 ml-2">https://nabsite.et/c/lucy-roastery</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80"
                  alt="Desktop Preview"
                  className="w-full h-64 sm:h-80 object-cover opacity-90"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Production Performance</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Core Web Vitals</span>
                  <span className="text-xs font-black text-emerald-400">Score 99/100</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Global Uptime</span>
                  <span className="text-xs font-black text-emerald-400">99.98% SLA</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Automated SSL</span>
                  <span className="text-xs font-black text-sky-400">Zero Configuration</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-300">Search Engine Indexing</span>
                  <span className="text-xs font-black text-amber-400">Instant Meta Tags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLATFORM CORE CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <Layers className="w-3.5 h-3.5" /> Comprehensive Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Built for Serious Commercial Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to govern websites, physical stands, and lead funnels in one unified ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: QrCode,
              title: 'Dynamic QR Stand Studio',
              desc: 'Generate, customize, and print high-resolution acrylic QR stand cards with live analytics.',
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
            {
              icon: Sparkles,
              title: 'Live Website Studio',
              desc: '324 bespoke templates across 18 business categories with visual theme and typography customizers.',
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10',
            },
            {
              icon: Building2,
              title: 'Multi-Tenant Governance',
              desc: 'Complete company vault with distinct administrator assignment, status transitions, and audit logs.',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              icon: TrendingUp,
              title: 'Real-Time Telemetry',
              desc: 'Live scan counters, website view statistics, and customer interaction logs updated seamlessly.',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
            },
            {
              icon: Send,
              title: 'Direct Telegram Orders',
              desc: 'Bypass commission-heavy food apps by connecting customers directly to your kitchen or reception.',
              color: 'text-sky-400',
              bg: 'bg-sky-500/10',
            },
            {
              icon: ShieldCheck,
              title: 'Verified Commercial Badge',
              desc: 'Build trust with a verified digital identity seal confirming physical address and contact authenticity.',
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              variant="bordered"
              className="p-6 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-bold`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 8. BUSINESS CATEGORIES DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            18 Curated Industry Verticals
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered specifically for every Ethiopian business category with custom layouts and features.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {BUSINESS_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedCategory(cat);
                const el = document.getElementById('discover');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-center space-y-2 transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{cat}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 9. SIMPLIFIED GET YOUR NABSITE CTA */}
      <section id="get-started" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Direct Application
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Give Your Business a Verified Digital Home
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Give your business a professional website, digital menu, QR code, and online presence — all managed in one place.
            </p>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-amber-400 pt-2">
              <span>✓ Instant Setup</span>
              <span>•</span>
              <span>✓ Custom QR Stand</span>
              <span>•</span>
              <span>✓ Mobile-First Menu</span>
              <span>•</span>
              <span>✓ No Coding Required</span>
            </div>
          </div>

          {leadSubmitted ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Application Received</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Our onboarding team will contact you within 24 hours to review your template selection and prepare your custom QR stand package.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLeadSubmitted(false);
                  setLeadForm({
                    fullName: '',
                    companyName: '',
                    phone: '',
                    email: '',
                    category: 'Restaurant',
                    message: '',
                  });
                }}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Dawit Haile"
                  value={leadForm.fullName}
                  onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                />
                <Input
                  label="Business / Company Name"
                  required
                  placeholder="e.g. Haile Grand Bistro"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  required
                  placeholder="+251 911 000 000"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                />
                <Input
                  label="Email (Optional)"
                  type="email"
                  placeholder="contact@company.et"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                />
              </div>

              <Select
                label="Primary Business Category"
                required
                options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
                value={leadForm.category}
                onChange={(val) => setLeadForm({ ...leadForm, category: val })}
              />

              <Textarea
                label="Additional Requirements (Optional)"
                rows={2}
                placeholder="Tell us about your menu, current website, or table count..."
                value={leadForm.message}
                onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={leadLoading}
                className="w-full font-black text-slate-950 shadow-xl"
              >
                {leadLoading ? 'Submitting Application...' : 'Claim Your NABSITE Presence'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
