import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ExternalLink,
  Sliders,
  Star,
  Play,
  Pause,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Category, ShowcaseItem, LandingHeroSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { CompanyName } from '../../components/ui/CompanyName';
import { HeroMotionVisual } from '../../components/public/HeroMotionVisual';

export const HomePage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    category: 'Restaurant & Dining',
    message: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Rotating Showcase Carousel State
  const showcaseScrollRef = useRef<HTMLDivElement>(null);
  const [showcaseSettings, setShowcaseSettings] = useState<{
    autoplay: boolean;
    direction: 'left' | 'right';
    speed: number;
    pauseOnHover: boolean;
  }>({
    autoplay: true,
    direction: 'left',
    speed: 3500,
    pauseOnHover: true,
  });
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollInterval = useRef<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.discoverCompanies(),
      api.getCategories(),
      api.getShowcase(),
      api.getSettings().catch(() => null),
    ])
      .then(([comps, cats, shows, sets]) => {
        setCompanies(comps);
        setCategories(cats);
        setShowcase(shows);
        if (sets?.showcaseSettings) {
          setShowcaseSettings(sets.showcaseSettings);
          setIsAutoScrolling(sets.showcaseSettings.autoplay ?? true);
        }
        if (sets?.heroSettings) {
          setHeroSettings(sets.heroSettings);
        }
      })
      .catch(console.error);
  }, []);

  // Continuous / Auto-rotating Carousel Effect controlled by Owner settings
  useEffect(() => {
    if (isAutoScrolling && companies.length > 0) {
      const speed = showcaseSettings.speed || 3500;
      const direction = showcaseSettings.direction || 'left';

      autoScrollInterval.current = setInterval(() => {
        if (showcaseScrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = showcaseScrollRef.current;
          if (direction === 'left') {
            if (scrollLeft + clientWidth >= scrollWidth - 15) {
              showcaseScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              showcaseScrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
            }
          } else {
            // Move Right
            if (scrollLeft <= 15) {
              showcaseScrollRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
            } else {
              showcaseScrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
            }
          }
        }
      }, speed);
    }
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [isAutoScrolling, companies, showcaseSettings]);

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (showcaseScrollRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      showcaseScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

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

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* 1. HERO SECTION WITH CINEMATIC MOTION & OWNER CONTROLS */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden min-h-[640px] flex flex-col items-center justify-center">
        {/* Dynamic Background: Video, Image, Solid, or Mesh Gradient */}
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
            <picture>
              {heroSettings.mobileImageUrl && (
                <source media="(max-width: 640px)" srcSet={heroSettings.mobileImageUrl} />
              )}
              <img
                src={heroSettings.imageUrl}
                alt="Hero Background"
                className="w-full h-full object-cover scale-105"
                referrerPolicy="no-referrer"
              />
            </picture>
            <div
              className="absolute inset-0 bg-slate-950"
              style={{ opacity: (heroSettings.overlayOpacity ?? 70) / 100 }}
            />
          </div>
        ) : heroSettings.bgType === 'solid' ? (
          <div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: heroSettings.solidColor || '#020617' }}
          />
        ) : (
          /* Dynamic Mesh Gradient Background */
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 right-1/4 w-[450px] h-[300px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
          </div>
        )}

        {/* HERO MAIN CONTENT & TYPOGRAPHY */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 text-center space-y-6 pt-4">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 text-white border border-amber-500/30 text-xs font-semibold shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">
              {heroSettings.badgeText || 'NABSITE Commercial Digital Network • Verified Stand Directory'}
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md">
              {heroSettings.title || heroSettings.headline || 'The Verified Digital Home for Top Ethiopian Businesses.'}
            </h1>
            <p className="text-base sm:text-xl text-slate-200 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              {heroSettings.subtitle ||
                'Discover verified restaurants, cafés, boutique hotels, and stores — with instant digital menus, live product storefronts, and table QR stands.'}
            </p>
          </div>

          {/* Interactive Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <form
              onSubmit={handleSearch}
              className="p-2 bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
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
              <Button type="submit" size="md" variant="gold" className="w-full sm:w-auto rounded-xl sm:rounded-full px-6 shadow-md">
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

        {/* Quick Metrics */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20 w-full pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto border-t border-slate-800/80 pt-6">
            <div className="text-center p-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/60">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Verified Live</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/60">
              <p className="text-2xl font-black text-white">324</p>
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Bespoke Layouts</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/60">
              <p className="text-2xl font-black text-white">&lt; 40ms</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">QR Mobile Stand</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/60">
              <p className="text-2xl font-black text-white">Zero</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Tech Setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONTINUOUS UNLIMITED ROTATING COMPANY SHOWCASE */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
        onMouseEnter={() => {
          if (showcaseSettings.pauseOnHover) setIsAutoScrolling(false);
        }}
        onMouseLeave={() => {
          if (showcaseSettings.pauseOnHover && (showcaseSettings.autoplay ?? true)) setIsAutoScrolling(true);
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Featured Platform Showcase
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-1">
              Top Verified Businesses on NABSITE
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Continuous rotating showcase of live commercial storefronts, digital menus, and QR table stands.
            </p>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              title={isAutoScrolling ? 'Pause rotation' : 'Resume auto-rotation'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              {isAutoScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleManualScroll('left')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleManualScroll('right')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Carousel Track */}
        <div
          ref={showcaseScrollRef}
          className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth"
        >
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="w-80 sm:w-96 shrink-0 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Image & Badge */}
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <img
                  src={comp.coverImage || comp.logo}
                  alt={comp.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge variant="published" size="sm">
                    ✓ Verified Live
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                  <img
                    src={comp.logo}
                    alt={comp.name}
                    className="w-12 h-12 rounded-2xl border-2 border-white bg-white object-cover shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-white truncate">
                    <h3 className="font-extrabold text-base leading-tight truncate">
                      <CompanyName name={comp.name} maxWidth="max-w-[200px]" />
                    </h3>
                    <p className="text-xs text-amber-300">{comp.category}</p>
                  </div>
                </div>
              </div>

              {/* Description & Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {comp.shortDescription || `Experience the premier digital presence of ${comp.name}.`}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">4.9</span>
                    </div>
                    <span>•</span>
                    <span className="truncate">📍 {comp.address.split(',')[0]}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Link to={`/c/${comp.slug}`} className="flex-1">
                    <Button size="sm" variant="primary" className="w-full text-xs font-bold truncate">
                      View Site
                    </Button>
                  </Link>
                  <Link to={`/c/${comp.slug}/menu`}>
                    <Button size="sm" variant="outline" className="text-xs font-bold">
                      Menu
                    </Button>
                  </Link>
                  <Link to={`/c/${comp.slug}/qr`} title="Digital QR Stand">
                    <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                      <QrCode className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CATEGORY DIRECTORY & BROWSER */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Browse by Industry
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a category to view active certified company digital stands.
            </p>
          </div>
          <Link to="/discover" className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:underline flex items-center gap-1">
            <span>View All Directory</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            All Verified ({companies.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === cat.name
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat.name}
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
              className="group overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Cover Image / Logo Banner */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={company.coverImage || company.logo}
                    alt={company.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="published" size="sm">
                      ✓ Verified Live
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-12 h-12 rounded-xl border-2 border-white bg-white object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-white truncate">
                      <h3 className="font-bold text-base leading-tight drop-shadow-xs truncate">
                        <CompanyName name={company.name} maxWidth="max-w-[200px]" />
                      </h3>
                      <p className="text-xs text-slate-200 drop-shadow-xs">{company.category}</p>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {company.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      📍 {company.address.split(',')[0]}
                    </span>
                    {company.phone && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        📞 {company.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <Link to={`/c/${company.slug}`} className="flex-1">
                  <Button size="sm" variant="primary" className="w-full text-xs">
                    View Website
                  </Button>
                </Link>
                <Link to={`/c/${company.slug}/qr`} title="Digital QR Stand">
                  <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                    <QrCode className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. WHY NABSITE PLATFORM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Why Leading Businesses Choose NABSITE
          </h2>
          <p className="text-sm text-slate-500">
            A comprehensive managed digital solution replacing slow, fragile standalone websites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="bordered" className="space-y-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Managed Website</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No complex hosting or broken plugins. We configure, publish, and host your responsive site on blazing fast CDN infrastructure.
            </p>
          </Card>

          <Card variant="bordered" className="space-y-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Physical QR Stand & Card</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Place branded QR stands on your tables, reception, or packaging. Customers scan and instantly view your menu, products, and direct contact.
            </p>
          </Card>

          <Card variant="bordered" className="space-y-4 p-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct Telegram & Phone Orders</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Seamlessly channel customers directly to your Telegram or Phone without high commission delivery app fees.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. LEAD APPLICATION FORM */}
      <section id="get-started" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="bordered" padding="lg" className="bg-slate-950 text-white border-slate-800 shadow-2xl p-8 sm:p-12">
          {leadSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold">Application Received!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Thank you for applying for a NABSITE managed digital identity. Our onboarding administrator will contact you within 24 hours to review your theme and prepare your live digital platform.
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
                    category: 'Restaurant & Dining',
                    message: '',
                  });
                }}
              >
                Submit Another Application
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Apply for Verification
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Launch Your Managed Digital Hub
                </h3>
                <p className="text-xs text-slate-400">
                  Join Addis Ababa&apos;s leading commercial digital platform with custom theme design and QR stand packages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  required
                  placeholder="e.g. Dawit Haile"
                  value={leadForm.fullName}
                  onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                />
                <Input
                  label="Business / Company Name *"
                  required
                  placeholder="e.g. Haile Grand Bistro"
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  required
                  placeholder="+251 911 000 000"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="contact@company.com"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Business Industry / Category *
                </label>
                <select
                  value={leadForm.category}
                  onChange={(e) => setLeadForm({ ...leadForm, category: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-900 text-white p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Restaurant & Dining">Restaurant & Dining</option>
                  <option value="Hotels & Hospitality">Hotels & Hospitality</option>
                  <option value="Medical & Healthcare">Medical & Healthcare</option>
                  <option value="Technology & Telecom">Technology & Telecom</option>
                  <option value="Financial & Banking">Financial & Banking</option>
                  <option value="Retail & Boutique">Retail & Boutique</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Additional Information (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your current digital presence, menu items, or requirements..."
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-700 bg-slate-900 text-white p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={leadLoading}
                className="w-full font-bold text-slate-950"
              >
                {leadLoading ? 'Submitting Application...' : 'Submit Commercial Application'}
              </Button>
            </form>
          )}
        </Card>
      </section>
    </div>
  );
};
