import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  QrCode,
  Download,
  Printer,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Sliders,
  Check,
  Copy,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Company, QrConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const CompanyQrPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [caption, setCaption] = useState('SCAN WITH CAMERA FOR MENU & STORE');
  const [fgColor, setFgColor] = useState('#0F172A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(400);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [normalizedUrl, setNormalizedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.getCompany(id);
      const comp = res?.company || res;
      if (comp) {
        setCompany(comp);
        const pubUrl = `https://nabsite.et/c/${comp.slug}`;
        setTargetUrl(pubUrl);
        setCaption(`SCAN WITH CAMERA FOR ${comp.name.toUpperCase()}`);
        await generateCode(pubUrl, fgColor, bgColor);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const generateCode = async (url: string, fg: string, bg: string) => {
    if (!url) return;
    setGenerating(true);
    try {
      const res = await api.generateQr({
        url,
        size: qrSize,
        fgColor: fg,
        bgColor: bg,
      });
      setQrDataUrl(res.dataUrl);
      setNormalizedUrl(res.normalizedUrl);
    } catch (err: any) {
      console.error('Company QR generation notice:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${company?.slug || 'company'}-nabsite-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!normalizedUrl) return;
    navigator.clipboard.writeText(normalizedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !company) {
    return (
      <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Loading QR Stand Studio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/company/${id}`}>
            <Button size="sm" variant="ghost" icon={ArrowLeft}>
              Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              QR Studio & Physical Table Stands
            </h1>
            <p className="text-xs text-slate-500">
              Generate print-ready QR stand badges and encode custom URLs in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/c/${company.slug}/qr`} target="_blank">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              Printable Stand Card
            </Button>
          </Link>
          <Button size="sm" variant="gold" icon={Download} onClick={handleDownload} className="font-bold">
            Download PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Customizer Controls */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="bordered" className="p-6 space-y-5">
            <CardHeader>
              <CardTitle>QR Generator Controls</CardTitle>
              <CardDescription>Customize the destination URL and physical stand visual style.</CardDescription>
            </CardHeader>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Web Address / URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. https://nabsite.et/c/slug or yourlink.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <Button
                  size="sm"
                  variant="gold"
                  icon={RefreshCw}
                  onClick={() => generateCode(targetUrl, fgColor, bgColor)}
                  disabled={generating || !targetUrl}
                  className="font-bold shrink-0"
                >
                  {generating ? 'Encoding...' : 'Encode'}
                </Button>
              </div>
            </div>

            <Input
              label="Stand Action Caption"
              placeholder="e.g. SCAN WITH PHONE FOR MENU"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pattern Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => {
                      setFgColor(e.target.value);
                      generateCode(targetUrl, e.target.value, bgColor);
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      generateCode(targetUrl, fgColor, e.target.value);
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

            <Button
              size="md"
              variant="gold"
              icon={RefreshCw}
              onClick={() => generateCode(targetUrl, fgColor, bgColor)}
              disabled={generating || !targetUrl}
              className="w-full font-bold"
            >
              {generating ? 'Regenerating QR Code...' : 'Regenerate QR Stand'}
            </Button>
          </Card>
        </div>

        {/* Live Preview Frame */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="bordered" className="flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Preview</span>
              <Badge variant="gold" size="sm">Camera Scannable</Badge>
            </div>

            {/* Stand Render */}
            <div className="p-6 bg-white rounded-3xl border-4 border-slate-900 shadow-xl space-y-3 max-w-[280px]">
              <div className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
                VERIFIED STOREFRONT
              </div>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Generated QR" className="w-52 h-52 mx-auto rounded-lg" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                  <QrCode className="w-16 h-16 animate-pulse" />
                </div>
              )}
              <div className="font-extrabold text-xs text-slate-900 truncate">
                {company.name}
              </div>
              <div className="text-[10px] text-amber-600 font-mono font-bold tracking-wider uppercase">
                {caption}
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2 pt-2">
              <Button size="md" variant="primary" icon={Download} onClick={handleDownload} className="w-full font-bold">
                Download Print-Ready PNG
              </Button>

              <div className="flex items-center gap-2">
                <a href={normalizedUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button size="sm" variant="outline" icon={ExternalLink} className="w-full text-xs">
                    Test Target Link
                  </Button>
                </a>
                <Button size="sm" variant="ghost" icon={copied ? Check : Copy} onClick={handleCopy} className="text-xs">
                  {copied ? 'Copied' : 'Copy URL'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
