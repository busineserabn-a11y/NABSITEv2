import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Download,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Trash2,
  AlertTriangle,
  Sliders,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, QrConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';

export const OwnerQrPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [savedQrs, setSavedQrs] = useState<QrConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Customizer Form State
  const [targetUrl, setTargetUrl] = useState('https://nabsite.et');
  const [title, setTitle] = useState('Official Digital Stand');
  const [caption, setCaption] = useState('SCAN WITH PHONE CAMERA');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [frameStyle, setFrameStyle] = useState<'standard' | 'badge' | 'minimal' | 'table_stand'>('badge');
  const [fgColor, setFgColor] = useState('#0F172A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(400);
  const [margin, setMargin] = useState<number>(2);

  // Result state
  const [generatedData, setGeneratedData] = useState<{ dataUrl: string; normalizedUrl: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; isError?: boolean } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comps, qrs] = await Promise.all([
        api.getCompanies(),
        api.getQrs(),
      ]);
      setCompanies(comps || []);
      setSavedQrs(qrs || []);
      if (comps && comps.length > 0) {
        setSelectedCompanyId(comps[0].id);
        const compUrl = `https://nabsite.et/c/${comps[0].slug}`;
        setTargetUrl(compUrl);
        setTitle(comps[0].name);
        handleGenerate(compUrl);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleGenerate = async (urlToEncode?: string) => {
    const url = (urlToEncode || targetUrl).trim();
    if (!url) {
      showNotification('Please enter a target URL.', true);
      return;
    }

    setGenerating(true);
    try {
      const res = await api.generateQr({
        url,
        size: qrSize,
        fgColor,
        bgColor,
        margin,
      });
      setGeneratedData(res);
    } catch (err: any) {
      showNotification(err.message || 'Failed to encode QR Code. Please check the URL format.', true);
    } finally {
      setGenerating(false);
    }
  };

  const handleCompanySelect = (comp: Company) => {
    setSelectedCompanyId(comp.id);
    const pubUrl = `https://nabsite.et/c/${comp.slug}`;
    setTargetUrl(pubUrl);
    setTitle(comp.name);
    setCaption(`SCAN TO VISIT ${comp.name.toUpperCase()}`);
    handleGenerate(pubUrl);
  };

  const handleDownload = () => {
    if (!generatedData?.dataUrl) return;
    const link = document.createElement('a');
    link.href = generatedData.dataUrl;
    const cleanName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `nabsite-qr-${cleanName || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('High-resolution QR Stand PNG downloaded.');
  };

  const handleSaveToVault = async () => {
    if (!selectedCompanyId || !targetUrl) {
      showNotification('Please select a company to associate this QR code with.', true);
      return;
    }
    setSaving(true);
    try {
      const newQr = await api.createQr({
        companyId: selectedCompanyId,
        name: title,
        targetUrl,
        targetType: 'website',
        frame: (frameStyle === 'badge' ? 'badge' : frameStyle === 'table_stand' ? 'card' : frameStyle === 'minimal' ? 'simple' : 'none') as any,
        frameStyle,
        caption,
        style: 'squares',
        fgColor,
        bgColor,
        size: qrSize,
      });
      setSavedQrs([newQr, ...savedQrs]);
      showNotification('QR Configuration saved to company vault!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save QR configuration.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSavedQr = async (qrId: string) => {
    try {
      await api.deleteQr(qrId);
      setSavedQrs(savedQrs.filter((q) => q.id !== qrId));
      showNotification('QR configuration removed.');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete QR.', true);
    }
  };

  const handleCopyUrl = () => {
    if (!generatedData?.normalizedUrl) return;
    navigator.clipboard.writeText(generatedData.normalizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('URL copied to clipboard.');
  };

  // Contrast check
  const isLowContrast = fgColor.toLowerCase() === bgColor.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notification.isError
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-300 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertTriangle className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Universal QR Stand Studio & Generator
          </h1>
          <p className="text-xs text-slate-500">
            Generate verified physical table stands, custom link badges, and track customer scan conversions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="bordered" className="p-6 space-y-5">
            <CardHeader>
              <CardTitle>QR Configuration & Encoding</CardTitle>
              <CardDescription>Input any target URL or select an existing company storefront.</CardDescription>
            </CardHeader>

            {/* Quick Company Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Preset from Verified Company Storefront
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  const comp = companies.find((c) => c.id === e.target.value);
                  if (comp) handleCompanySelect(comp);
                }}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Custom Web URL --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (nabsite.et/c/{c.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* Target URL Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Web Address / URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. example.com or https://nabsite.et/c/lucy-coffee"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <Button
                  size="sm"
                  variant="gold"
                  icon={RefreshCw}
                  onClick={() => handleGenerate()}
                  disabled={generating || !targetUrl}
                  className="font-bold shrink-0"
                >
                  {generating ? 'Encoding...' : 'Encode'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Accepts domain names or full URLs. Automatic HTTP/HTTPS normalization applied.
              </p>
            </div>

            {/* Stand Caption & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Stand Heading Title"
                placeholder="e.g. Lucy Coffee Roastery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Action Caption / Instructions"
                placeholder="e.g. SCAN FOR MENU & DIRECT ORDER"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            {/* Visual Customization */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-amber-500" /> Stand Appearance & Styling
              </div>

              {/* Frame Presets */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Frame Archetype</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'badge', label: 'Table Stand Badge' },
                    { id: 'standard', label: 'Clean Box' },
                    { id: 'table_stand', label: 'Acrylic Plaque' },
                    { id: 'minimal', label: 'Borderless' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFrameStyle(st.id as any)}
                      className={`p-2 rounded-xl text-center text-xs font-bold transition-all ${
                        frameStyle === st.id
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Foreground Pattern</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                      }}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Background Canvas</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                      }}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                    />
                  </div>
                </div>
              </div>

              {isLowContrast && (
                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="w-4 h-4" /> Foreground and background colors are identical. Camera scanners will fail to read this QR code.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="gold"
                size="md"
                icon={RefreshCw}
                onClick={() => handleGenerate()}
                disabled={generating || !targetUrl}
                className="font-bold flex-1"
              >
                {generating ? 'Regenerating...' : 'Regenerate QR Stand'}
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={Sparkles}
                onClick={handleSaveToVault}
                disabled={saving || !selectedCompanyId}
              >
                {saving ? 'Saving...' : 'Save to Vault'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="bordered" className="p-6 flex flex-col items-center justify-center text-center space-y-5 sticky top-20">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Print Preview</span>
              <Badge variant="gold" size="sm">Scannable</Badge>
            </div>

            {/* Stand Render Frame */}
            {generatedData?.dataUrl ? (
              <div
                className={`w-full max-w-[320px] p-6 rounded-3xl transition-all shadow-xl space-y-4 ${
                  frameStyle === 'badge'
                    ? 'bg-white border-4 border-slate-900 text-slate-900'
                    : frameStyle === 'table_stand'
                    ? 'bg-gradient-to-b from-amber-50 to-white border-4 border-amber-500 text-slate-900'
                    : frameStyle === 'minimal'
                    ? 'bg-transparent text-slate-900 dark:text-white'
                    : 'bg-white border border-slate-300 text-slate-900'
                }`}
              >
                <div className="text-[11px] font-black tracking-widest uppercase opacity-80">
                  {title}
                </div>

                <div className="p-2 bg-white rounded-2xl border border-slate-200 inline-block shadow-xs">
                  <img
                    src={generatedData.dataUrl}
                    alt="Scannable QR"
                    className="w-52 h-52 mx-auto rounded-lg object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[10px] tracking-wider uppercase font-bold text-amber-600 dark:text-amber-500">
                    {caption}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {generatedData.normalizedUrl}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-slate-400 space-y-3">
                <QrCode className="w-16 h-16 mx-auto opacity-30 animate-pulse" />
                <p className="text-xs">Generating your high-resolution QR stand...</p>
              </div>
            )}

            {/* Test Link & Download Cluster */}
            {generatedData && (
              <div className="w-full space-y-2 pt-2">
                <Button size="md" variant="primary" icon={Download} onClick={handleDownload} className="w-full font-bold">
                  Download High-Res Stand PNG
                </Button>

                <div className="flex items-center gap-2">
                  <a
                    href={generatedData.normalizedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" icon={ExternalLink} className="w-full text-xs">
                      Test Target Link
                    </Button>
                  </a>

                  <Button size="sm" variant="ghost" icon={copied ? Check : Copy} onClick={handleCopyUrl} className="text-xs">
                    {copied ? 'Copied' : 'Copy URL'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Saved QR Codes Table */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Saved QR Stand Configurations Vault
          </h2>
          <p className="text-xs text-slate-500">
            All generated and active physical QR stands across registered commercial companies.
          </p>
        </div>

        <Table<QrConfig>
          data={savedQrs}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'name',
              header: 'Stand Name & Company',
              render: (q) => {
                const comp = companies.find((c) => c.id === q.companyId);
                return (
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">{q.name}</span>
                    <span className="text-[11px] text-slate-500">{comp?.name || q.companyId}</span>
                  </div>
                );
              },
            },
            {
              key: 'targetUrl',
              header: 'Target Destination',
              render: (q) => (
                <a
                  href={q.targetUrl.startsWith('http') ? q.targetUrl : `https://nabsite.et${q.targetUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-mono"
                >
                  {q.targetUrl} <ExternalLink className="w-3 h-3" />
                </a>
              ),
            },
            {
              key: 'frame',
              header: 'Frame Archetype',
              render: (q) => <Badge variant="gold" size="sm">{q.frame}</Badge>,
            },
            {
              key: 'scanCount',
              header: 'Total Camera Scans',
              render: (q) => <span className="text-xs font-black text-slate-900 dark:text-white">{q.scanCount || 0} scans</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (q) => (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Eye}
                    onClick={() => {
                      setTargetUrl(q.targetUrl.startsWith('http') ? q.targetUrl : `https://nabsite.et${q.targetUrl}`);
                      setTitle(q.name);
                      setCaption(q.caption || '');
                      setFrameStyle(q.frame as any || 'badge');
                      setFgColor(q.fgColor || '#0F172A');
                      setBgColor(q.bgColor || '#FFFFFF');
                      handleGenerate(q.targetUrl.startsWith('http') ? q.targetUrl : `https://nabsite.et${q.targetUrl}`);
                    }}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDeleteSavedQr(q.id)}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};
