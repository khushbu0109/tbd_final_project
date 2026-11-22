import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { STUDIO_MEDIA, formatINR } from '../../data/catalog';
import { ResilientImage } from '../../components/ResilientImage';
import type { Product, ProductCategory } from '../../types';

const DEFAULT_CATEGORY_OPTIONS: ProductCategory[] = [
  'Daily Vitality',
  'Energy & Stamina',
  'Cellular Health',
  'Adaptogens',
  'Multivitamins',
];

const MEDIA_PRESETS = [
  { label: 'COREAA Studio Box', url: STUDIO_MEDIA.coreaaBoxPrimary },
  { label: 'NAD+ Clinical Bottle', url: STUDIO_MEDIA.nadResveratrol },
  { label: "Men's Favor Complex", url: STUDIO_MEDIA.mensFavor },
  { label: 'Smart Biometric Tracker', url: STUDIO_MEDIA.smartTracker },
  { label: 'Ashwagandha Root', url: STUDIO_MEDIA.ingAshwagandha },
  { label: 'Astaxanthin Extract', url: STUDIO_MEDIA.ingAstaxanthin },
  { label: 'Multivitamin Softgels', url: STUDIO_MEDIA.ingMultivitamins },
];

export const AdminAddProductPage: React.FC = () => {
  const { addProduct, categories, setAdminRoute } = useStore();
  const categoryOptions = useMemo(
    () => (categories.length > 0 ? categories.map((c) => c.name) : DEFAULT_CATEGORY_OPTIONS),
    [categories]
  );

  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Daily Vitality');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [regularPrice, setRegularPrice] = useState(1499);
  const [salePrice, setSalePrice] = useState(1199);
  const [costPrice, setCostPrice] = useState(420);
  const [enableSub, setEnableSub] = useState(true);
  const [stock, setStock] = useState(80);
  const [lowStockThreshold, setLowStockThreshold] = useState(20);
  const [packSize, setPackSize] = useState('60 Coated Tablets');
  const [activesText, setActivesText] = useState('L-Citrulline 200mg, Astaxanthin 8mg, Piperine 95%');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  const [selectedImage, setSelectedImage] = useState(MEDIA_PRESETS[0].url);

  const generatedSlug = useMemo(() => {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'new-clinical-formulation'
    );
  }, [name]);

  const generatedSku = useMemo(() => {
    const prefix = name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase();
    return `TBD-${prefix || 'NEW'}-${String(Math.floor(100 + (name.length * 17) % 890))}`;
  }, [name]);

  const profitMarginPct = useMemo(() => {
    if (salePrice <= 0) return 0;
    return Math.round(((salePrice - costPrice) / salePrice) * 100);
  }, [salePrice, costPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const keyActives = activesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newProduct: Product = {
      id: `${generatedSlug}-${Date.now()}`,
      sku: generatedSku,
      name: name.trim(),
      subtitle: subtitle.trim() || 'Clinical Grade Nutraceutical',
      slug: generatedSlug,
      category,
      shortDescription:
        shortDescription.trim() ||
        'Standardized daily nutraceutical formulated for measurable bioavailability and clean cellular support.',
      fullDescription:
        fullDescription.trim() ||
        shortDescription.trim() ||
        'Formulated under cGMP protocols and independently assayed under ISO 17025 standards with zero proprietary fillers.',
      regularPrice: Math.max(1, Number(regularPrice)),
      salePrice: Math.max(1, Number(salePrice)),
      costPrice: Math.max(0, Number(costPrice)),
      subscriptionPrice: enableSub ? Math.round(Number(salePrice) * 0.85) : undefined,
      stock: Math.max(0, Number(stock)),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold)),
      status,
      rating: 4.9,
      reviewCount: 1,
      image: selectedImage,
      gallery: [selectedImage, STUDIO_MEDIA.clinicalLifestyle],
      packSize: packSize.trim() || '30 Servings',
      dosageNote: `${formatINR(Math.max(1, salePrice / 30))} / serving`,
      keyActives: keyActives.length > 0 ? keyActives : ['Standardized Active Complex'],
      biomarkers: ['Cellular NAD+', 'Nitric Oxide'],
      clinicalCertified: true,
      createdAt: 'Today',
    };

    await addProduct(newProduct);
    setAdminRoute('products');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAdminRoute('products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075CA8] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Products</span>
        </button>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStatus('Draft')}
            className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
              status === 'Draft'
                ? 'border-[#061B3A] bg-[#061B3A] text-white'
                : 'border-[#D8E2EA] bg-white text-[#465970]'
            }`}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#075CA8] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#004481]"
          >
            {status === 'Published' ? 'Publish Formulation' : 'Save Draft Formulation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Main Form Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Basic Info */}
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
            <h2 className="font-display text-base font-bold text-[#061B3A]">Basic Information</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="prod-name" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Product Name
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. COREAA™ Neuro-Focus Complex"
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
                <div className="mt-1.5 flex flex-wrap gap-4 font-mono text-[11px] text-[#5A6C82]">
                  <span>Slug: /{generatedSlug}</span>
                  <span>Auto SKU: {generatedSku}</span>
                </div>
              </div>

              <div>
                <label htmlFor="prod-sub" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Clinical Subtitle
                </label>
                <input
                  id="prod-sub"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Standardized Nootropic & Alpha-Wave Support"
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prod-short" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Short Summary
                </label>
                <textarea
                  id="prod-short"
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Concise two-line clinical summary displayed on storefront cards..."
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prod-full" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Full Clinical Dossier
                </label>
                <textarea
                  id="prod-full"
                  rows={3}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed bioavailability rationale, sourcing standards, and dosage timing..."
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prod-actives" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Key Standardized Actives (comma-separated)
                </label>
                <input
                  id="prod-actives"
                  type="text"
                  value={activesText}
                  onChange={(e) => setActivesText(e.target.value)}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Margin */}
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#061B3A]">Pricing &amp; Margin</h2>
              <span className="font-mono text-xs font-semibold text-[#075CA8] tabular-nums">
                Est. Gross Margin: {profitMarginPct}% ({formatINR(Math.max(0, salePrice - costPrice))})
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="prod-mrp" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Regular MRP (₹)
                </label>
                <input
                  id="prod-mrp"
                  type="number"
                  min={99}
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm text-[#061B3A] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prod-sale" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Selling Price (₹)
                </label>
                <input
                  id="prod-sale"
                  type="number"
                  min={99}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm text-[#061B3A] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prod-cost" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Unit COGS (₹)
                </label>
                <input
                  id="prod-cost"
                  type="number"
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm text-[#061B3A] tabular-nums"
                />
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] px-4 py-3 text-xs">
              <div>
                <p className="font-semibold text-[#061B3A]">Enable Auto-Replenish Subscription (15% Off)</p>
                <p className="text-[#5A6C82] tabular-nums">
                  Subscription price: {formatINR(Math.round(salePrice * 0.85))}
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableSub}
                onChange={(e) => setEnableSub(e.target.checked)}
                className="h-4 w-4 rounded accent-[#075CA8]"
              />
            </label>
          </div>
        </div>

        {/* Right Sidebar: Media & Organization */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
            <h2 className="font-display text-base font-bold text-[#061B3A]">Studio Media</h2>
            <div className="mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-[#E6EEF5] bg-[#F3F7FB]">
              <ResilientImage
                src={selectedImage}
                alt="Selected product preview"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
              Select Studio Asset
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {MEDIA_PRESETS.map((preset) => {
                const active = selectedImage === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedImage(preset.url)}
                    title={preset.label}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                      active ? 'border-[#075CA8]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <ResilientImage
                      src={preset.url}
                      alt={preset.label}
                      className="h-full w-full object-cover"
                    />
                    {active && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#075CA8] text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#061B3A]">
              Organization &amp; Inventory
            </h2>
            <div>
              <label htmlFor="prod-cat" className="mb-1 block text-xs font-semibold text-[#354B66]">
                Category
              </label>
              <select
                id="prod-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm text-[#061B3A]"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prod-status" className="mb-1 block text-xs font-semibold text-[#354B66]">
                Publishing Status
              </label>
              <select
                id="prod-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm text-[#061B3A]"
              >
                <option value="Published">Published (Visible on Storefront)</option>
                <option value="Draft">Draft (Hidden)</option>
              </select>
            </div>

            <div>
              <label htmlFor="prod-pack" className="mb-1 block text-xs font-semibold text-[#354B66]">
                Pack Format
              </label>
              <input
                id="prod-pack"
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prod-stock" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Opening Stock
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-sm text-[#061B3A] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="prod-low" className="mb-1 block text-xs font-semibold text-[#354B66]">
                  Low Alert At
                </label>
                <input
                  id="prod-low"
                  type="number"
                  min={1}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-sm text-[#061B3A] tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
