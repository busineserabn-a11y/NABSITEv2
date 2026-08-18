import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Company, Website, Product, ProductCategory, Review, Offer, Announcement } from '../../types';
import { WebsiteRenderer } from '../../components/website/WebsiteRenderer';
import { DigitalMenuRenderer } from '../../components/website/DigitalMenuRenderer';
import { Button } from '../../components/ui/Button';

export const CompanyWebsitePage: React.FC = () => {
  const { slug, page } = useParams<{ slug: string; page?: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    company: Company;
    website: Website;
    products?: Product[];
    productCategories?: ProductCategory[];
    reviews?: Review[];
    offers?: Offer[];
    announcements?: Announcement[];
    suspended?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getPublicCompany(slug)
      .then((res) => {
        setData(res);
        // Record visit event
        api.recordEvent({
          companyId: res.company?.id,
          websiteId: res.website?.id,
          eventType: 'PAGE_VIEW',
          path: page ? `/c/${slug}/${page}` : `/c/${slug}`,
        }).catch(console.error);
      })
      .catch((err) => {
        setError(err.message || 'Company website not found');
      })
      .finally(() => setLoading(false));
  }, [slug, page]);

  const handleNavigatePage = (targetPageSlug: string) => {
    if (!slug) return;
    if (targetPageSlug === 'home' || !targetPageSlug) {
      navigate(`/c/${slug}`);
    } else {
      navigate(`/c/${slug}/${targetPageSlug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="animate-spin w-10 h-10 border-4 border-slate-700 border-t-amber-400 rounded-full" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading verified NABSITE...</p>
      </div>
    );
  }

  if (data?.suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white text-center">
        <div className="max-w-md space-y-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">{data.company?.name || 'Company Website'}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This digital presence is temporarily inactive under administrative review. Please check back shortly.
          </p>
          <Link to="/">
            <Button variant="secondary" size="sm">Browse Verified Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data || !data.website) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white text-center">
        <div className="max-w-md space-y-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Company Website Not Available</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This digital storefront is currently in draft configuration or being updated.'}
          </p>
          <Link to="/">
            <Button variant="secondary" size="sm">Back to Platform Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { company, website, products, productCategories, reviews, offers, announcements } = data;
  const config = website.publishedConfig || website.draftConfig;

  if (page === 'menu' || page === 'digital-menu') {
    return (
      <DigitalMenuRenderer
        company={company}
        website={website}
        config={config}
        products={products}
        productCategories={productCategories}
      />
    );
  }

  return (
    <WebsiteRenderer
      company={company}
      website={website}
      config={config}
      themeId={website.themeId}
      products={products}
      productCategories={productCategories}
      reviews={reviews}
      offers={offers}
      announcements={announcements}
      activePageSlug={page || 'home'}
      onNavigatePage={handleNavigatePage}
      isStudioEditor={false}
      showVerificationBanner={true}
    />
  );
};
