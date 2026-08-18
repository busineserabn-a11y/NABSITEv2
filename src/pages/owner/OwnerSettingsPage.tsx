import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Save, CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { PlatformSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export const OwnerSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOwnerSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateOwnerSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.getOwnerExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nabsite-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Platform Settings & Authority
        </h1>
        <p className="text-xs text-slate-500">
          Global branding parameters, developer attribution toggles, and system emergency controls.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding */}
        <Card variant="bordered">
          <CardHeader>
            <div>
              <CardTitle>Platform Branding & Directory Information</CardTitle>
              <CardDescription>Displayed in headers, meta tags, and global footers</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platform Brand Name"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
              <Input
                label="Contact Email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>

            <Input
              label="Platform Tagline / Description"
              value={settings.platformDescription}
              onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Telephone"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
              <Input
                label="Footer Copyright Text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Developer Attribution */}
        <Card variant="bordered">
          <CardHeader>
            <div>
              <CardTitle>Developer Attribution Credit</CardTitle>
              <CardDescription>Subtle engineering credit in footer</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showCredit"
                checked={settings.showDeveloperCredit}
                onChange={(e) => setSettings({ ...settings, showDeveloperCredit: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="showCredit" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Display "Managed & Engineered by" Credit in Platform Footer
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Developer / Agency Name"
                value={settings.developerName}
                onChange={(e) => setSettings({ ...settings, developerName: e.target.value })}
              />
              <Input
                label="Developer URL"
                value={settings.developerUrl}
                onChange={(e) => setSettings({ ...settings, developerUrl: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Landing Page Hero & Motion UI Settings */}
        <Card variant="bordered">
          <CardHeader>
            <div>
              <CardTitle>Landing Page Hero &amp; Motion Background</CardTitle>
              <CardDescription>Configure background media (Image / Video / Gradient) and interactive floating motion UI</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Hero Background Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'gradient', label: '🎨 Dynamic Mesh Gradient' },
                  { id: 'image', label: '🖼️ Custom Image Background' },
                  { id: 'video', label: '🎬 Cinematic Video Loop' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        heroSettings: {
                          ...(settings.heroSettings || { backgroundType: 'gradient', bgType: 'gradient', overlayOpacity: 60, showMotionElements: true }),
                          backgroundType: bg.id as any,
                          bgType: bg.id as any,
                        },
                      })
                    }
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      (settings.heroSettings?.bgType || settings.heroSettings?.backgroundType || 'gradient') === bg.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {(settings.heroSettings?.bgType === 'image' || settings.heroSettings?.backgroundType === 'image') && (
              <Input
                label="Custom Hero Background Image URL"
                placeholder="https://images.unsplash.com/photo-..."
                value={settings.heroSettings?.imageUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    heroSettings: {
                      ...(settings.heroSettings || { backgroundType: 'image', bgType: 'image' }),
                      imageUrl: e.target.value,
                    },
                  })
                }
              />
            )}

            {(settings.heroSettings?.bgType === 'video' || settings.heroSettings?.backgroundType === 'video') && (
              <Input
                label="Hero Background Video Direct MP4 / WebM URL"
                placeholder="https://assets.mixkit.co/videos/preview/..."
                value={settings.heroSettings?.videoUrl || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    heroSettings: {
                      ...(settings.heroSettings || { backgroundType: 'video', bgType: 'video' }),
                      videoUrl: e.target.value,
                    },
                  })
                }
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dark Overlay Dimmer: {settings.heroSettings?.overlayOpacity ?? 60}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.heroSettings?.overlayOpacity ?? 60}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      heroSettings: {
                        ...(settings.heroSettings || { backgroundType: 'gradient', bgType: 'gradient' }),
                        overlayOpacity: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="showMotion"
                  checked={settings.heroSettings?.showMotionElements ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      heroSettings: {
                        ...(settings.heroSettings || { backgroundType: 'gradient', bgType: 'gradient' }),
                        showMotionElements: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="showMotion" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Enable Interactive Floating Motion Cards &amp; Badges
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Emergency & Maintenance Controls */}
        <Card variant="bordered" className="border-amber-200 bg-amber-50/20 dark:bg-amber-950/10">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>Emergency Maintenance Mode</CardTitle>
            </div>
          </CardHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="maintenanceMode" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Enable Global Maintenance Mode (Blocks public access except God Mode)
              </label>
            </div>
            <p className="text-xs text-slate-500">
              When active, public visitors will see a dignified maintenance notice while administrators can continue managing data.
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export Full Database Backup (.JSON)
          </Button>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Platform settings updated!
              </span>
            )}
            <Button type="submit" variant="gold" size="lg" icon={Save}>
              Save Platform Configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
