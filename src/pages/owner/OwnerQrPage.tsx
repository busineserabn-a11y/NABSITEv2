import React, { useState, useEffect, useRef } from 'react';
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
  Calendar,
  Layers,
  Globe,
  Printer,
  ShieldCheck,
  Palette,
  FileText,
  Clock,
  ArrowRight,
  Maximize2,
  Image as ImageIcon,
  Flame,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, QrConfig, Website } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';

interface PageOption {
  id: string;
  name: string;
  urlPath: string;
  type: 'section' | 'page' | 'utility';
}

export const OwnerQrPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [savedQrs, setSavedQrs] = useState<QrConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Company & Page Selection
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedPageType, setSelectedPageType] = useState<string>('home');
  const [customPath, setCustomPath] = useState<string>('');

  // 🟢 2. Destination URL & Branding
  const [targetUrl, setTargetUrl] = useState('https://nabsite.et');
  const [title, setTitle] = useState('Official Digital Stand');
  const [caption, setCaption] = useState('SCAN WITH PHONE CAMERA');
  const [showCenterLogo, setShowCenterLogo] = useState<boolean>(true);

  // 🟢 3. Appearance & Colors
  const [fgColor, setFgColor] = useState('#0F172A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(400);
  const [margin, setMargin] = useState<number>(2);
  const [frameStyle, setFrameStyle] = useState<'badge' | 'table_stand' | 'standard' | 'minimal'>('badge');

  // 🟢 4. Date Duration & Expiry
  const [durationPreset, setDurationPreset] = useState<'permanent' | '30' | '60' | '90' | '180' | '365' | 'custom'>('permanent');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');

  // 🟢 5. Generation Results & Actions
  const [generatedData, setGeneratedData] = useState<{ dataUrl: string; normalizedUrl: string; svgString?: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; isError?: boolean } | null>(null);

  const previewCardRef = useRef<HTMLDivElement>(null);

  // Fetch initial Firestore data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [comps, webs, qrs] = await Promise.all([
        api.getCompanies().catch(() => []),
        api.getWebsites().catch(() => []),
        api.getQrs().catch(() => []),
      ]);

      const validComps = comps || [];
      setCompanies(validComps);
      setWebsites(webs || []);
      setSavedQrs(qrs || []);

      if (validComps.length > 0) {
        const firstComp = validComps[0];
        setSelectedCompanyId(firstComp.id);
        const compUrl = `https://nabsite.et/c/${firstComp.slug}`;
        setTargetUrl(compUrl);
        setTitle(firstComp.name);
        setCaption(`SCAN FOR ${firstComp.name.toUpperCase()}`);
        handleGenerate(compUrl, 400, '#0F172A', '#FFFFFF', 2);
      } else {
        handleGenerate('https://nabsite.et', 400, '#0F172A', '#FFFFFF', 2);
      }
    } catch (err: any) {
      console.error('Failed to load initial QR studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // Selected company object
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || null;

  // Selected company website
  const selectedWebsite = selectedCompany
    ? websites.find((w) => w.companyId === selectedCompany.id || w.id === selectedCompany.websiteId)
    : null;

  // Dynamic available pages for the selected company
  const availablePages: PageOption[] = React.useMemo(() => {
    if (!selectedCompany) return [{ id: 'home', name: 'Main Landing Page', urlPath: '', type: 'page' }];

    const pages: PageOption[] = [
      { id: 'home', name: '🏠 Main Storefront / Home', urlPath: '', type: 'page' },
      { id: 'menu', name: '📋 Menu & Product Catalog', urlPath: '#menu', type: 'section' },
      { id: 'offers', name: '🏷️ Deals & Special Offers', urlPath: '#offers', type: 'section' },
      { id: 'reviews', name: '⭐ Verified Reviews & Feedback', urlPath: '#reviews', type: 'section' },
      { id: 'contact', name: '📍 Contact, Location & Hours', urlPath: '#contact', type: 'section' },
      { id: 'qr_stand', name: '🪧 Printable Stand Card Display', urlPath: '/qr', type: 'utility' },
    ];

    // Include custom configured pages if any
    const customConfigPages = selectedWebsite?.draftConfig?.pages || selectedWebsite?.publishedConfig?.pages;
    if (customConfigPages && Array.isArray(customConfigPages)) {
      customConfigPages.forEach((p) => {
        if (p.slug && p.slug !== 'home') {
          pages.push({
            id: `page_${p.slug}`,
            name: `📄 Page: ${p.title || p.name || p.slug}`,
            urlPath: `/${p.slug}`,
            type: 'page',
          });
        }
      });
    }

    pages.push({ id: 'custom', name: '🔗 Custom Path / URL Query', urlPath: '', type: 'utility' });
    return pages;
  }, [selectedCompany, selectedWebsite]);

  // Compute destination URL from company & page selection
  const computeDestinationUrl = (compId: string, pageType: string, customP: string) => {
    const comp = companies.find((c) => c.id === compId);
    if (!comp) return targetUrl;

    const base = `https://nabsite.et/c/${comp.slug}`;
    if (pageType === 'home') return base;
    if (pageType === 'custom') {
      const cleanCustom = customP.startsWith('/') || customP.startsWith('#') || customP.startsWith('?') ? customP : `/${customP}`;
      return `${base}${cleanCustom}`;
    }

    const matchedPage = availablePages.find((p) => p.id === pageType);
    if (matchedPage) {
      return `${base}${matchedPage.urlPath}`;
    }
    return base;
  };

  // Handle Company Dropdown Change
  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    const comp = companies.find((c) => c.id === newCompanyId);
    if (comp) {
      setTitle(comp.name);
      setCaption(`SCAN FOR ${comp.name.toUpperCase()}`);
      setSelectedPageType('home');
      setCustomPath('');
      const newUrl = `https://nabsite.et/c/${comp.slug}`;
      setTargetUrl(newUrl);
      handleGenerate(newUrl);
    } else {
      setSelectedPageType('custom');
    }
  };

  // Handle Page Dropdown Change
  const handlePageChange = (newPageId: string) => {
    setSelectedPageType(newPageId);
    if (selectedCompanyId) {
      const newUrl = computeDestinationUrl(selectedCompanyId, newPageId, customPath);
      setTargetUrl(newUrl);
      handleGenerate(newUrl);
    }
  };

  // Handle Custom Path Input Change
  const handleCustomPathChange = (val: string) => {
    setCustomPath(val);
    if (selectedCompanyId && selectedPageType === 'custom') {
      const newUrl = computeDestinationUrl(selectedCompanyId, 'custom', val);
      setTargetUrl(newUrl);
      handleGenerate(newUrl);
    }
  };

  // Duration preset handler
  const handleDurationPresetChange = (preset: 'permanent' | '30' | '60' | '90' | '180' | '365' | 'custom') => {
    setDurationPreset(preset);
    const now = new Date();
    setStartDate(now.toISOString().split('T')[0]);

    if (preset === 'permanent') {
      setExpiryDate('');
    } else if (preset === 'custom') {
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setExpiryDate(future.toISOString().split('T')[0]);
    } else {
      const days = parseInt(preset, 10);
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      setExpiryDate(future.toISOString().split('T')[0]);
    }
  };

  // QR Generation Worker
  const handleGenerate = async (
    urlToEncode?: string,
    sizeOverride?: number,
    fgOverride?: string,
    bgOverride?: string,
    marginOverride?: number
  ) => {
    const rawUrl = (urlToEncode || targetUrl).trim();
    if (!rawUrl) {
      showNotification('Please enter a destination URL.', true);
      return;
    }

    setGenerating(true);
    try {
      const res = await api.generateQr({
        url: rawUrl,
        size: sizeOverride || qrSize,
        fgColor: fgOverride || fgColor,
        bgColor: bgOverride || bgColor,
        margin: marginOverride ?? margin,
      });
      setGeneratedData(res);
    } catch (err: any) {
      showNotification(err.message || 'Failed to generate QR Code. Check URL format.', true);
    } finally {
      setGenerating(false);
    }
  };

  // Download Standard / High-Res PNG
  const handleDownloadPng = async (highDpi = false) => {
    if (!targetUrl) return;
    try {
      const downloadSize = highDpi ? 2048 : qrSize;
      const res = await api.generateQr({
        url: targetUrl,
        size: downloadSize,
        fgColor,
        bgColor,
        margin,
      });

      const link = document.createElement('a');
      link.href = res.dataUrl;
      const cleanName = (title || 'nabsite-qr').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `nabsite-qr-${cleanName}-${highDpi ? '2048px-print' : `${qrSize}px`}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`${highDpi ? '2048px Ultra-HD Print PNG' : 'PNG QR Code'} downloaded successfully!`);
    } catch (err: any) {
      showNotification('Download failed: ' + err.message, true);
    }
  };

  // Download Vector SVG
  const handleDownloadSvg = async () => {
    if (!targetUrl) return;
    try {
      const svg = await api.generateQrSvg({
        url: targetUrl,
        fgColor,
        bgColor,
        margin,
      });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (title || 'nabsite-qr').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `nabsite-qr-${cleanName}-vector.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Vector SVG QR code downloaded for professional printing.');
    } catch (err: any) {
      showNotification('SVG generation failed: ' + err.message, true);
    }
  };

  // Direct Print Acrylic Table Stand
  const handlePrintStand = () => {
    if (!generatedData?.dataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotification('Please allow popups to open the print layout.', true);
      return;
    }

    const companyLogo = showCenterLogo && selectedCompany?.logo ? selectedCompany.logo : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NABSITE QR Stand - ${title}</title>
          <style>
            @page { size: A5 portrait; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              background: #f8fafc;
              color: #0f172a;
            }
            .stand-card {
              width: 100%;
              max-width: 380px;
              background: #ffffff;
              border: 3px solid #0f172a;
              border-radius: 28px;
              padding: 36px 24px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .stand-logo {
              width: 54px;
              height: 54px;
              border-radius: 14px;
              object-fit: cover;
              margin: 0 auto 12px;
              border: 1.5px solid #e2e8f0;
            }
            .stand-title {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: -0.5px;
              margin: 0 0 6px;
              text-transform: uppercase;
            }
            .stand-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              font-size: 10px;
              font-weight: 800;
              padding: 4px 12px;
              border-radius: 999px;
              margin-bottom: 20px;
              letter-spacing: 0.5px;
            }
            .qr-wrapper {
              background: #ffffff;
              padding: 14px;
              border-radius: 20px;
              border: 2px solid #e2e8f0;
              display: inline-block;
              margin: 0 auto 20px;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .stand-caption {
              font-size: 12px;
              font-weight: 800;
              color: #d97706;
              letter-spacing: 1px;
              margin: 0 0 8px;
              text-transform: uppercase;
            }
            .stand-url {
              font-size: 11px;
              color: #64748b;
              font-family: monospace;
              word-break: break-all;
            }
            .stand-footer {
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              font-size: 9px;
              color: #94a3b8;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            @media print {
              body { background: #ffffff; padding: 0; }
              .stand-card { box-shadow: none; border: 3px solid #000000; }
            }
          </style>
        </head>
        <body>
          <div class="stand-card">
            ${companyLogo ? `<img src="${companyLogo}" class="stand-logo" />` : ''}
            <div class="stand-title">${title}</div>
            <div class="stand-badge">Official Verified NABSITE Digital Touchpoint</div>
            <div class="qr-wrapper">
              <img src="${generatedData.dataUrl}" class="qr-img" />
            </div>
            <div class="stand-caption">${caption}</div>
            <div class="stand-url">${generatedData.normalizedUrl}</div>
            <div class="stand-footer">
              Powered by NABSITE Enterprise Platform &bull; Scannable with any smartphone camera
            </div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save QR to Firestore Vault
  const handleSaveToVault = async () => {
    if (!selectedCompanyId || !targetUrl) {
      showNotification('Please select a company to associate this QR code with.', true);
      return;
    }
    setSaving(true);
    try {
      const newQr = await api.saveQrConfig({
        companyId: selectedCompanyId,
        name: title,
        title,
        targetUrl,
        targetType: selectedPageType === 'home' ? 'website' : selectedPageType === 'menu' ? 'menu' : selectedPageType === 'offers' ? 'offer' : 'custom_page',
        pageSlug: selectedPageType,
        frame: (frameStyle === 'badge' ? 'badge' : frameStyle === 'table_stand' ? 'card' : frameStyle === 'minimal' ? 'none' : 'simple') as any,
        frameStyle,
        caption,
        style: 'squares',
        fgColor,
        bgColor,
        size: qrSize,
        margin,
        startDate,
        expiryDate,
        duration: durationPreset,
      });

      setSavedQrs([newQr, ...savedQrs.filter((q) => q.id !== newQr.id)]);
      showNotification('QR Stand configuration saved to Firestore company vault!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save QR configuration.', true);
    } finally {
      setSaving(false);
    }
  };

  // Test Scan Simulation
  const handleSimulateScan = async () => {
    setSimulatingScan(true);
    try {
      // If saved in vault, increment count
      const existing = savedQrs.find((q) => q.companyId === selectedCompanyId && q.targetUrl === targetUrl);
      if (existing) {
        const updated = await api.saveQrConfig({
          ...existing,
          scanCount: (existing.scanCount || 0) + 1,
        });
        setSavedQrs(savedQrs.map((q) => (q.id === updated.id ? updated : q)));
      }
      showNotification('Scan simulated! Target destination verified and scan metric recorded.');
      window.open(generatedData?.normalizedUrl || targetUrl, '_blank');
    } catch (err) {
      window.open(generatedData?.normalizedUrl || targetUrl, '_blank');
    } finally {
      setSimulatingScan(false);
    }
  };

  // Delete saved QR
  const handleDeleteSavedQr = async (qrId: string) => {
    try {
      await api.deleteQr(qrId);
      setSavedQrs(savedQrs.filter((q) => q.id !== qrId));
      showNotification('QR configuration removed from vault.');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete QR.', true);
    }
  };

  // Copy scannable URL
  const handleCopyUrl = () => {
    if (!generatedData?.normalizedUrl) return;
    navigator.clipboard.writeText(generatedData.normalizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('Target URL copied to clipboard.');
  };

  // Check Expiry calculation
  const getDurationStatus = () => {
    if (durationPreset === 'permanent' || !expiryDate) {
      return { label: 'Permanent &bull; No Expiration', color: 'emerald', isExpired: false };
    }
    const today = new Date().setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate).setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired on ${expiryDate}`, color: 'rose', isExpired: true };
    }
    if (diffDays <= 7) {
      return { label: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${expiryDate})`, color: 'amber', isExpired: false };
    }
    return { label: `Active &bull; ${diffDays} days remaining (${expiryDate})`, color: 'emerald', isExpired: false };
  };

  const durationStatus = getDurationStatus();
  const isLowContrast = fgColor.toLowerCase() === bgColor.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.isError
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Universal QR Stand Studio & Generator
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create customized commercial table stands, target verified company pages, configure duration validity, and download print-ready formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Printer}
            onClick={handlePrintStand}
            disabled={!generatedData}
          >
            Print Stand Card
          </Button>
          <Button
            size="sm"
            variant="gold"
            icon={Download}
            onClick={() => handleDownloadPng(false)}
            disabled={!generatedData}
            className="font-bold shadow-md"
          >
            Download PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Customizer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="bordered" className="p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black">
                  🟢
                </span>
                <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                  Basic & Advanced QR Controls
                </CardTitle>
              </div>
              <Badge variant="gold" size="sm">
                Instant Real-Time Sync
              </Badge>
            </div>

            {/* 1. Select NABSITE Company */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  Select NABSITE Company
                </span>
                {selectedCompany && (
                  <span className="text-[11px] text-emerald-500 font-semibold font-mono">
                    nabsite.et/c/{selectedCompany.slug}
                  </span>
                )}
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs"
              >
                <option value="">-- Custom Web URL (No Company Preset) --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} &bull; {c.category || 'Business'} (slug: {c.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Select Website Page */}
            {selectedCompany && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    Select Website Page / Deep Link
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-routes phone camera</span>
                </label>
                <select
                  value={selectedPageType}
                  onChange={(e) => handlePageChange(e.target.value)}
                  className="w-full text-xs rounded-xl border border-amber-300/50 dark:border-amber-700/50 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                >
                  {availablePages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>

                {selectedPageType === 'custom' && (
                  <div className="pt-2">
                    <Input
                      label="Custom Subpage Path or Query"
                      placeholder="e.g. /special-menu or #booking"
                      value={customPath}
                      onChange={(e) => handleCustomPathChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 3. Destination URL */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <span>Destination URL *</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-normalizes http:// and https://</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://nabsite.et/c/your-company"
                  value={targetUrl}
                  onChange={(e) => {
                    setTargetUrl(e.target.value);
                  }}
                  onBlur={() => handleGenerate()}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono shadow-xs focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  size="sm"
                  variant="gold"
                  icon={RefreshCw}
                  onClick={() => handleGenerate()}
                  disabled={generating || !targetUrl}
                  className="font-bold shrink-0 shadow-xs"
                >
                  {generating ? 'Generating...' : 'Generate QR'}
                </Button>
              </div>
            </div>

            {/* 4. Stand Heading Title & Action Caption */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Stand Heading Title"
                placeholder="e.g. Lucy Coffee Roastery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Action Caption / Instructions"
                placeholder="e.g. SCAN WITH CAMERA FOR MENU"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            {/* 5. Visual Styling & Appearance */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <Palette className="w-4 h-4 text-amber-500" />
                  QR Color Palette & Sizing
                </div>
                {selectedCompany?.logo && (
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showCenterLogo}
                      onChange={(e) => setShowCenterLogo(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    Include Company Logo
                  </label>
                )}
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foreground Color */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    QR Foreground Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                        handleGenerate(undefined, qrSize, e.target.value, bgColor, margin);
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          handleGenerate(undefined, qrSize, e.target.value, bgColor, margin);
                        }
                      }}
                      className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                    />
                  </div>

                  {/* Quick Color Swatches */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { hex: '#0F172A', label: 'Slate' },
                      { hex: '#D97706', label: 'Gold' },
                      { hex: '#059669', label: 'Emerald' },
                      { hex: '#2563EB', label: 'Sapphire' },
                      { hex: '#E11D48', label: 'Crimson' },
                      { hex: '#020617', label: 'Black' },
                    ].map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => {
                          setFgColor(swatch.hex);
                          handleGenerate(undefined, qrSize, swatch.hex, bgColor, margin);
                        }}
                        style={{ backgroundColor: swatch.hex }}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          fgColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'scale-125 border-white ring-2 ring-amber-500 shadow-xs'
                            : 'border-slate-400/30 hover:scale-110'
                        }`}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    QR Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        handleGenerate(undefined, qrSize, fgColor, e.target.value, margin);
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 shrink-0 shadow-xs"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          handleGenerate(undefined, qrSize, fgColor, e.target.value, margin);
                        }
                      }}
                      className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                    />
                  </div>

                  {/* Quick Background Swatches */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { hex: '#FFFFFF', label: 'White' },
                      { hex: '#FDFBF7', label: 'Cream' },
                      { hex: '#F1F5F9', label: 'Slate 100' },
                      { hex: '#FEF3C7', label: 'Amber 100' },
                      { hex: '#0B1120', label: 'Dark' },
                    ].map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => {
                          setBgColor(swatch.hex);
                          handleGenerate(undefined, qrSize, fgColor, swatch.hex, margin);
                        }}
                        style={{ backgroundColor: swatch.hex }}
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          bgColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'scale-125 border-slate-900 ring-2 ring-amber-500 shadow-xs'
                            : 'border-slate-400/30 hover:scale-110'
                        }`}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* QR Size & Margin Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>QR Size</span>
                    <span className="font-mono text-amber-600">{qrSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="180"
                    max="1024"
                    step="20"
                    value={qrSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setQrSize(newSize);
                      handleGenerate(undefined, newSize, fgColor, bgColor, margin);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>200px (Mobile)</span>
                    <span>400px (Stand)</span>
                    <span>1024px (HD)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Quiet Zone (Margin)</span>
                    <span className="font-mono text-amber-600">{margin} blocks</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={margin}
                    onChange={(e) => {
                      const newMargin = Number(e.target.value);
                      setMargin(newMargin);
                      handleGenerate(undefined, qrSize, fgColor, bgColor, newMargin);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 (Tight)</span>
                    <span>2 (Standard)</span>
                    <span>6 (Wide)</span>
                  </div>
                </div>
              </div>

              {isLowContrast && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>
                    <strong>Contrast Warning:</strong> Foreground and background colors are too similar. Phone camera scanners may fail to recognize this QR code.
                  </span>
                </div>
              )}
            </div>

            {/* 6. Date Duration & Campaign Validity */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Date Duration & Active Validity
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    durationStatus.color === 'emerald'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : durationStatus.color === 'amber'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                  dangerouslySetInnerHTML={{ __html: durationStatus.label }}
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'permanent', label: 'Permanent' },
                  { id: '30', label: '30 Days' },
                  { id: '60', label: '60 Days' },
                  { id: '90', label: '90 Days' },
                  { id: '180', label: '6 Months' },
                  { id: 'custom', label: 'Custom' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleDurationPresetChange(preset.id as any)}
                    className={`p-2 rounded-xl text-center text-xs font-bold transition-all ${
                      durationPreset === preset.id
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Pickers */}
              {durationPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Campaign Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Frame Style Archetypes */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                Stand Frame Archetype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'badge', label: 'Table Stand Badge' },
                  { id: 'table_stand', label: 'Acrylic Gold Plaque' },
                  { id: 'standard', label: 'Clean Box' },
                  { id: 'minimal', label: 'Borderless Minimal' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFrameStyle(st.id as any)}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all ${
                      frameStyle === st.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Generate & Save */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="gold"
                size="md"
                icon={RefreshCw}
                onClick={() => handleGenerate()}
                disabled={generating || !targetUrl}
                className="font-bold w-full sm:flex-1 shadow-md"
              >
                {generating ? 'Regenerating QR...' : 'Generate & Refresh QR'}
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={Sparkles}
                onClick={handleSaveToVault}
                disabled={saving || !selectedCompanyId}
                className="w-full sm:w-auto font-bold"
              >
                {saving ? 'Saving...' : 'Save to Vault'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            variant="bordered"
            className="p-6 flex flex-col items-center justify-center text-center space-y-5 sticky top-20 shadow-sm"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Stand Preview
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Badge variant="gold" size="sm">
                  Camera Ready
                </Badge>
              </div>
            </div>

            {/* Stand Render Frame */}
            {generatedData?.dataUrl ? (
              <div
                ref={previewCardRef}
                className={`w-full max-w-[340px] p-6 rounded-3xl transition-all shadow-xl space-y-4 ${
                  frameStyle === 'badge'
                    ? 'bg-white border-4 border-slate-900 text-slate-900'
                    : frameStyle === 'table_stand'
                    ? 'bg-gradient-to-b from-amber-50 to-white border-4 border-amber-500 text-slate-900'
                    : frameStyle === 'minimal'
                    ? 'bg-transparent text-slate-900 dark:text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-900'
                }`}
              >
                {/* Stand Header with optional company logo */}
                <div className="space-y-1.5">
                  {showCenterLogo && selectedCompany?.logo && (
                    <img
                      src={selectedCompany.logo}
                      alt={selectedCompany.name}
                      className="w-10 h-10 rounded-xl object-cover mx-auto border border-slate-200 shadow-xs"
                    />
                  )}
                  <div className="text-xs font-black tracking-wider uppercase opacity-90 truncate">
                    {title}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Official Verified Touchpoint
                  </div>
                </div>

                {/* QR Container */}
                <div className="relative p-2.5 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner">
                  <img
                    src={generatedData.dataUrl}
                    alt="Scannable QR Code"
                    className="w-56 h-56 mx-auto rounded-lg object-contain"
                  />
                  {showCenterLogo && selectedCompany?.logo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-slate-200 flex items-center justify-center">
                        <img
                          src={selectedCompany.logo}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Stand Footer */}
                <div className="space-y-1">
                  <div className="font-mono text-[11px] tracking-wider uppercase font-black text-amber-600">
                    {caption}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono px-2">
                    {generatedData.normalizedUrl}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-slate-400 space-y-3">
                <QrCode className="w-16 h-16 mx-auto opacity-30 animate-pulse text-amber-500" />
                <p className="text-xs font-semibold">Generating your high-resolution QR stand...</p>
              </div>
            )}

            {/* Test QR & Download Suite */}
            {generatedData && (
              <div className="w-full space-y-3 pt-2">
                {/* Primary Download Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Download}
                    onClick={() => handleDownloadPng(false)}
                    className="font-bold text-xs"
                  >
                    PNG ({qrSize}px)
                  </Button>
                  <Button
                    size="sm"
                    variant="gold"
                    icon={Download}
                    onClick={() => handleDownloadPng(true)}
                    className="font-bold text-xs"
                  >
                    Ultra-HD (2048px)
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Layers}
                    onClick={handleDownloadSvg}
                    className="text-xs"
                  >
                    Vector SVG
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Printer}
                    onClick={handlePrintStand}
                    className="text-xs"
                  >
                    Print Stand
                  </Button>
                </div>

                {/* Test QR Controls */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                    <span>Test & Verify Link</span>
                    <span className="text-emerald-500 font-mono">Live</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={ExternalLink}
                      onClick={handleSimulateScan}
                      disabled={simulatingScan}
                      className="flex-1 text-xs font-bold"
                    >
                      {simulatingScan ? 'Testing...' : 'Test Destination URL'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      icon={copied ? Check : Copy}
                      onClick={handleCopyUrl}
                      className="text-xs shrink-0"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Saved QR Codes Table in Firestore */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Saved QR Stand Configurations Vault
            </h2>
            <p className="text-xs text-slate-500">
              Active commercial touchpoints stored in Firestore with scan conversion tracking.
            </p>
          </div>
          <Badge variant="gold" size="sm">
            {savedQrs.length} Saved Stands
          </Badge>
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
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      {q.name || q.title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {comp?.name || q.companyId}
                    </span>
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
                  className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-mono max-w-[240px] truncate"
                >
                  {q.targetUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ),
            },
            {
              key: 'frame',
              header: 'Frame Archetype',
              render: (q) => <Badge variant="gold" size="sm">{q.frame || q.frameStyle || 'badge'}</Badge>,
            },
            {
              key: 'duration',
              header: 'Validity / Duration',
              render: (q) => {
                if (q.duration === 'permanent' || !q.expiryDate) {
                  return <span className="text-[11px] text-emerald-500 font-semibold font-mono">Permanent</span>;
                }
                const isExp = new Date(q.expiryDate).getTime() < Date.now();
                return (
                  <span className={`text-[11px] font-mono font-semibold ${isExp ? 'text-rose-500' : 'text-slate-400'}`}>
                    {isExp ? 'Expired' : `Until ${q.expiryDate}`}
                  </span>
                );
              },
            },
            {
              key: 'scanCount',
              header: 'Scans',
              render: (q) => (
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {q.scanCount || 0}
                </span>
              ),
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
                      if (q.companyId) {
                        setSelectedCompanyId(q.companyId);
                      }
                      if (q.pageSlug) {
                        setSelectedPageType(q.pageSlug);
                      }
                      const loadUrl = q.targetUrl.startsWith('http')
                        ? q.targetUrl
                        : `https://nabsite.et${q.targetUrl}`;
                      setTargetUrl(loadUrl);
                      setTitle(q.name || q.title || 'Official Digital Stand');
                      setCaption(q.caption || '');
                      setFrameStyle((q.frameStyle || q.frame || 'badge') as any);
                      setFgColor(q.fgColor || '#0F172A');
                      setBgColor(q.bgColor || '#FFFFFF');
                      setQrSize(q.size || 400);
                      setMargin(q.margin ?? 2);
                      if (q.duration) setDurationPreset(q.duration as any);
                      if (q.expiryDate) setExpiryDate(q.expiryDate);
                      handleGenerate(loadUrl, q.size || 400, q.fgColor || '#0F172A', q.bgColor || '#FFFFFF', q.margin ?? 2);
                      showNotification(`Loaded QR configuration for ${q.name || q.title}.`);
                    }}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
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
