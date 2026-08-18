import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  MoveHorizontal,
  RotateCw,
  Gauge,
  HelpCircle,
  Save,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ShowcaseItem, PlatformSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const OwnerShowcasePage: React.FC = () => {
  const [showcase, setShowcase] = useState<ShowcaseItem[]>([]);
  const [settings, setSettings] = useState<Partial<PlatformSettings>>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Showcase rotation parameters
  const [autoplay, setAutoplay] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [speed, setSpeed] = useState(3500);
  const [pauseOnHover, setPauseOnHover] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resShowcase, resSettings] = await Promise.all([
        api.getShowcase(),
        api.getSettings().catch(() => null),
      ]);
      setShowcase(resShowcase);
      if (resSettings) {
        setSettings(resSettings);
        if (resSettings.showcaseSettings) {
          setAutoplay(resSettings.showcaseSettings.autoplay ?? true);
          setDirection(resSettings.showcaseSettings.direction ?? 'left');
          setSpeed(resSettings.showcaseSettings.speed ?? 3500);
          setPauseOnHover(resSettings.showcaseSettings.pauseOnHover ?? true);
        }
      }
    } catch (err) {
      console.error('Failed to load showcase data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleVisibility = async (id: string) => {
    const updated = showcase.map((item) =>
      item.id === id ? { ...item, isVisible: !item.isVisible } : item
    );
    setShowcase(updated);
    await api.updateShowcase(updated);
  };

  const handleSaveShowcaseSettings = async () => {
    setSavingSettings(true);
    try {
      const showcaseSettings = {
        autoplay,
        direction,
        speed,
        pauseOnHover,
      };
      await api.updateSettings({
        showcaseSettings,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save showcase settings', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Icon-led Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Showcase Command Studio
              <Badge variant="published" size="sm" className="font-mono">LIVE ENGINE</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Configure horizontal auto-rotation motion, direction, speed, and featured enterprise visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-medium animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> Motion Settings Saved
            </span>
          )}
          <Button
            size="sm"
            variant="primary"
            icon={Save}
            isLoading={savingSettings}
            onClick={handleSaveShowcaseSettings}
            className="shadow-lg shadow-cyan-500/20"
          >
            Save Showcase Motion
          </Button>
        </div>
      </div>

      {/* Showcase Motion & Direction Control Panel (Requested by User) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCw className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <h2 className="text-base font-bold text-white tracking-wide">Automated Rotation & Direction Controller</h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              Owner God Mode Control
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Direction Controller */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MoveHorizontal className="w-4 h-4 text-cyan-400" /> Movement Direction
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  {direction === 'left' ? '◀ Moving Left' : 'Moving Right ▶'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('left')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    direction === 'left'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Move Left
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('right')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    direction === 'right'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Move Right <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Autoplay Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  {autoplay ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />} Auto Rotation
                </span>
                <Badge variant={autoplay ? 'published' : 'neutral'} size="sm">
                  {autoplay ? 'Enabled' : 'Paused'}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setAutoplay(!autoplay)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  autoplay
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {autoplay ? 'Auto Continuous Loop Active' : 'Click to Enable Auto-Loop'}
              </button>
            </div>

            {/* 3. Speed Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-purple-400" /> Rotation Speed
                </span>
                <span className="text-[10px] font-mono text-purple-300">{(speed / 1000).toFixed(1)}s interval</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '2.5s', val: 2500 },
                  { label: '3.5s', val: 3500 },
                  { label: '5.0s', val: 5000 },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setSpeed(s.val)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      speed === s.val
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Pause On Hover */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Hover Interaction
                </span>
                <span className="text-[10px] font-mono text-slate-400">Visitor Safe</span>
              </div>
              <button
                type="button"
                onClick={() => setPauseOnHover(!pauseOnHover)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  pauseOnHover
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pauseOnHover ? 'Pause on Cursor Hover: ON' : 'Pause on Cursor Hover: OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Showcase Items Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Featured Companies & Stand Cards ({showcase.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcase.map((item) => (
            <Card
              key={item.id}
              variant="bordered"
              padding="none"
              className="overflow-hidden space-y-0 flex flex-col justify-between bg-slate-900/80 border-slate-800/90 hover:border-cyan-500/30 transition-all group"
            >
              <div>
                <div className="h-44 relative bg-slate-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant={item.isVisible ? 'published' : 'neutral'} size="sm">
                      {item.isVisible ? '✓ Live on Homepage' : 'Hidden'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-800/80 flex items-center justify-between mt-3">
                <span className="text-[11px] font-mono text-slate-500">Display Order #{item.order}</span>
                <Button
                  size="sm"
                  variant={item.isVisible ? 'secondary' : 'primary'}
                  className="text-xs"
                  icon={item.isVisible ? EyeOff : Eye}
                  onClick={() => toggleVisibility(item.id)}
                >
                  {item.isVisible ? 'Hide from Showcase' : 'Feature on Homepage'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
