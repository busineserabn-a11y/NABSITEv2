import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Printer,
  Utensils,
  ShoppingBag,
  Phone,
  Globe,
  Palette,
} from 'lucide-react';
import { Company } from '../../types';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StudioQrPanelProps {
  company: Company;
}

export const StudioQrPanel: React.FC<StudioQrPanelProps> = ({ company }) => {
  const [preset, setPreset] = useState<'website' | 'menu' | 'store' | 'contact' | 'custom'>('menu');
  const [customUrl, setCustomUrl] = useState('');
  const [qrSize, setQrSize] = useState(360);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [frameStyle, setFrameStyle] = useState<'stand' | 'badge' | 'minimal'>('stand');
  const [caption, setCaption] = useState('SCAN FOR DIGITAL MENU');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute final Target URL
  const baseUrl = window.location.origin;
  const getTargetUrl = () => {
    switch (preset) {
      case 'menu':
        return `${baseUrl}/c/${company.slug}/menu`;
      case 'store':
        return `${baseUrl}/c/${company.slug}/store`;
      case 'contact':
        return `${baseUrl}/c/${company.slug}/contact`;
      case 'custom':
        return customUrl || `${baseUrl}/c/${company.slug}`;
      case 'website':
      default:
        return `${baseUrl}/c/${company.slug}`;
    }
  };

  const finalUrl = getTargetUrl();

  useEffect(() => {
    // Set appropriate caption based on preset
    if (preset === 'menu') setCaption('SCAN FOR DIGITAL MENU');
    else if (preset === 'store') setCaption('SCAN FOR PRODUCT STORE');
    else if (preset === 'contact') setCaption('SCAN TO CONTACT US');
    else setCaption(`SCAN TO VISIT ${company.name.toUpperCase()}`);
  }, [preset, company.name]);

  useEffect(() => {
    if (!finalUrl) return;
    setLoading(true);
    api.generateQr({
      url: finalUrl,
      size: qrSize,
      fgColor,
      bgColor,
    })
      .then((res) => {
        if (res?.dataUrl) {
          setQrDataUrl(res.dataUrl);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [finalUrl, qrSize, fgColor, bgColor]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${company.slug}-${preset}-qr-code.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            QR Studio & Table Stand Maker
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Generate high-resolution printable QR codes for tables, counters, and storefronts
        </p>
      </div>

      {/* Body Controls & Preview */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
            Select Destination Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('menu')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                preset === 'menu'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Digital Menu QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('website')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                preset === 'website'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Main Website QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('store')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                preset === 'store'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Store Catalog QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('contact')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                preset === 'contact'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Contact QR</span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                preset === 'custom'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Custom URL QR</span>
            </button>
          </div>
        </div>

        {preset === 'custom' && (
          <Input
            label="Target Custom URL *"
            placeholder="https://example.com/promo"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
        )}

        {/* Live URL Display & Copy */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Destination</span>
            <p className="text-xs font-mono text-amber-300 truncate">{finalUrl}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* QR Styling Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400">Foreground Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2 py-1"
              />
            </div>
          </div>
        </div>

        <Input
          label="Badge Stand Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. SCAN FOR DIGITAL MENU"
        />

        {/* Printable Stand Card Preview */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Table Stand Preview
          </span>

          <div className="max-w-xs mx-auto bg-white text-slate-950 p-6 rounded-3xl border-4 border-amber-400 shadow-2xl space-y-4 text-center">
            {/* Header */}
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[9px] font-mono font-black uppercase tracking-widest">
                VERIFIED DIGITAL NABSITE
              </span>
              <h4 className="text-base font-black text-slate-950 tracking-tight">{company.name}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{caption}</p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 inline-block shadow-inner">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-amber-500 rounded-full" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="pt-1">
              <p className="text-[9px] text-slate-600 font-bold">
                Point your mobile camera to view live digital menu & order
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Copy}
            onClick={handleCopyLink}
          >
            {copied ? 'Copied URL!' : 'Copy Destination URL'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownloadPng}
            disabled={!qrDataUrl}
          >
            Download PNG QR
          </Button>
        </div>
      </div>
    </div>
  );
};
