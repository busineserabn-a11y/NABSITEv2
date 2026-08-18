import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Printer, Download, ArrowLeft, ShieldCheck, Sparkles, Send, Phone } from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Website, QrConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const CompanyQrPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getPublicCompany(slug)
      .then(async (res) => {
        setCompany(res.company);
        setWebsite(res.website);

        // Record QR scan / view event
        api.recordEvent({
          companyId: res.company.id,
          websiteId: res.website?.id,
          eventType: 'QR_VISIT',
          path: `/c/${slug}/qr`,
        }).catch(console.error);

        // Fetch or generate QR image
        try {
          const qrs = await api.getQrs(res.company.id);
          if (qrs.length > 0) {
            const qrImage = await api.getQrImage(qrs[0].id);
            setQrDataUrl(qrImage.dataUrl);
          }
        } catch (qrErr) {
          console.warn('QR image generation fallback', qrErr);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${company?.slug || 'nabsite'}-qr-stand.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-xs font-semibold">Generating physical QR digital stand...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between no-print">
          <Link to={`/c/${company.slug}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {company.name} Digital Stand</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={Download} onClick={handleDownload}>
              Download QR
            </Button>
            <Button size="sm" variant="primary" icon={Printer} onClick={handlePrint}>
              Print Stand Card
            </Button>
          </div>
        </div>

        {/* Printable Physical Stand Card */}
        <div
          id="qr-printable-card"
          className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-slate-950 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6 relative overflow-hidden"
        >
          {/* Top Stand Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-extrabold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Digital Stand</span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <img
                src={company.logo}
                alt={company.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-900 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white leading-tight">
                  {company.name}
                </h2>
                <p className="text-xs font-semibold text-slate-500">{company.category}</p>
              </div>
            </div>
          </div>

          {/* QR Code Container with Scanner Frame */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 inline-block shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${company.name}`}
                className="w-56 h-56 mx-auto rounded-xl shadow-xs"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <QrCode className="w-16 h-16" />
              </div>
            )}
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-3">
              SCAN WITH YOUR PHONE CAMERA
            </p>
          </div>

          {/* Value props on Stand */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p>📖 View Menu</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p>⚡ Fast Orders</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <p>⭐ Leave Review</p>
            </div>
          </div>

          {/* Footer branding on Stand */}
          <div className="pt-2 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span>Powered by NABSITE</span>
            <span>nabsite.et/c/{company.slug}</span>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs text-center text-slate-500 no-print">
          Tip: Place this high-resolution QR card on your restaurant tables, cash counter, or reception desk to instantly connect customers to your digital menu and orders.
        </p>
      </div>
    </div>
  );
};
