import React, { useMemo, useState } from 'react';
import {
  Check,
  FlaskConical,
  Heart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../data/catalog';
import { ResilientImage } from '../components/ResilientImage';
import type { Product, ProductCategory } from '../types';

const CATEGORIES: Array<'All Products' | ProductCategory> = [
  'All Products',
  'Daily Vitality',
  'Energy & Stamina',
  'Cellular Health',
  'Adaptogens',
  'Multivitamins',
];

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc';

export const ProductsPage: React.FC = () => {
  const { products, addToCart, wishlist, toggleWishlist } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<'All Products' | ProductCategory>(
    'All Products'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [clinicalOnly, setClinicalOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(6500);
  const [sortBy, setSortBy] = useState<SortKey>('featured');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [modalPlan, setModalPlan] = useState<'sub' | 'once'>('sub');
  const [modalGalleryIdx, setModalGalleryIdx] = useState(0);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'Published'),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = publishedProducts.filter((product) => {
      if (selectedCategory !== 'All Products' && product.category !== selectedCategory) {
        return false;
      }
      if (inStockOnly && product.stock <= 0) return false;
      if (clinicalOnly && !product.clinicalCertified) return false;
      if (product.salePrice > maxPrice) return false;
      if (q) {
        const hay = `${product.name} ${product.subtitle} ${product.shortDescription} ${product.keyActives.join(' ')} ${product.biomarkers.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.salePrice - b.salePrice);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.salePrice - a.salePrice);
    if (sortBy === 'rating-desc') return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [publishedProducts, selectedCategory, inStockOnly, clinicalOnly, maxPrice, searchQuery, sortBy]);

  const openModal = (product: Product) => {
    setActiveProduct(product);
    setModalPlan(product.subscriptionPrice ? 'sub' : 'once');
    setModalGalleryIdx(0);
  };

  const resetFilters = () => {
    setSelectedCategory('All Products');
    setSearchQuery('');
    setInStockOnly(false);
    setClinicalOnly(false);
    setMaxPrice(6500);
    setSortBy('featured');
  };

  return (
    <div className="bg-[#F9F9FF] text-[#061B3A]">
      {/* Page Hero Header */}
      <section className="border-b border-[#D8E2EA] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#008FD3]">
            Clinical Formulations &amp; Diagnostics
          </p>
          <div className="mt-2 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#061B3A] sm:text-4xl">
                Precision Wellness Catalog
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#465970] sm:text-base">
                Every formulation is batch-assayed in ISO 17025 accredited facilities with disclosed
                milligram dosages, standardized botanicals, and zero proprietary fillers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#465970] tabular-nums">
              <span>{publishedProducts.length} Active Formulations</span>
              <span aria-hidden="true">·</span>
              <span>Free Shipping over ₹1,000</span>
              <span aria-hidden="true">·</span>
              <span>cGMP Certified</span>
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#E6EEF5] pt-6">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#061B3A] text-white'
                      : 'border border-[#D8E2EA] bg-white text-[#354B66] hover:border-[#075CA8] hover:text-[#061B3A]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Catalog Grid + Sidebar */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-[#D8E2EA] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#E6EEF5] pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#061B3A]">
                  <SlidersHorizontal className="h-4 w-4 text-[#075CA8]" />
                  <span>Refine Catalog</span>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-[#075CA8] hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Search */}
              <div>
                <label
                  htmlFor="catalog-search"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A6C82]"
                >
                  Search Ingredients or SKU
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    id="catalog-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Astaxanthin, NAD+, HRV..."
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] py-2 pl-9 pr-3 text-sm text-[#061B3A] placeholder:text-[#8A9BB0] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Ceiling Slider */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="price-range"
                    className="text-xs font-semibold uppercase tracking-wider text-[#5A6C82]"
                  >
                    Max Price
                  </label>
                  <span className="font-mono text-xs font-semibold text-[#061B3A] tabular-nums">
                    Up to {formatINR(maxPrice)}
                  </span>
                </div>
                <input
                  id="price-range"
                  type="range"
                  min={499}
                  max={6500}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-[#075CA8]"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-[#6E8096] tabular-nums">
                  <span>₹499</span>
                  <span>₹6,500</span>
                </div>
              </div>

              {/* Clinical Toggles */}
              <div className="space-y-3 border-t border-[#E6EEF5] pt-4">
                <label className="flex cursor-pointer items-center justify-between text-sm text-[#1E334D]">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between text-sm text-[#1E334D]">
                  <span>Clinical Assay Verified</span>
                  <input
                    type="checkbox"
                    checked={clinicalOnly}
                    onChange={(e) => setClinicalOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                  />
                </label>
              </div>

              {/* Assay Assurance Note */}
              <div className="rounded-xl bg-[#E9F6FD]/70 p-4 text-xs leading-relaxed text-[#1B3A5C]">
                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-[#061B3A]">
                  <ShieldCheck className="h-4 w-4 text-[#075CA8]" />
                  <span>Full Disclosure Guarantee</span>
                </div>
                Every bottle and Alu-Alu blister strip lists exact active weights and third-party
                heavy-metal clearance codes.
              </div>
            </div>
          </aside>

          {/* Product Results */}
          <div className="lg:col-span-9">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-[#465970] tabular-nums">
                Showing <span className="font-semibold text-[#061B3A]">{filteredProducts.length}</span>{' '}
                of {publishedProducts.length} clinical formulations
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort" className="text-xs font-medium text-[#5A6C82]">
                  Sort by
                </label>
                <select
                  id="catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                >
                  <option value="featured">Recommended Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-[#D8E2EA] bg-white p-12 text-center">
                <FlaskConical className="mx-auto h-8 w-8 text-[#008FD3]" />
                <h2 className="mt-3 font-display text-lg font-bold text-[#061B3A]">
                  No formulations match your filters
                </h2>
                <p className="mt-1 text-sm text-[#5A6C82]">
                  Adjust your price ceiling, category, or search term to explore the full clinical line.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-[#061B3A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#082B58]"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const isSaved = wishlist.includes(product.id);
                  const savings =
                    product.regularPrice > product.salePrice
                      ? Math.round(
                          ((product.regularPrice - product.salePrice) / product.regularPrice) * 100
                        )
                      : 0;
                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white transition-all hover:border-[#008FD3]/60 hover:shadow-[0_14px_34px_rgba(6,27,58,0.08)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7FB]">
                        <button
                          type="button"
                          onClick={() => openModal(product)}
                          className="block h-full w-full text-left"
                          aria-label={`Inspect ${product.name}`}
                        >
                          <ResilientImage
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          aria-label={isSaved ? 'Remove from saved' : 'Save formulation'}
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#061B3A] shadow-sm transition hover:bg-white"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              isSaved ? 'fill-[#075CA8] text-[#075CA8]' : 'text-[#465970]'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[#5A6C82]">
                          <span>{product.category}</span>
                          <span className="flex items-center gap-1 font-semibold text-[#061B3A] tabular-nums">
                            <Star className="h-3.5 w-3.5 fill-[#008FD3] text-[#008FD3]" />
                            {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString('en-IN')})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openModal(product)}
                          className="mt-2 text-left"
                        >
                          <h2 className="font-display text-lg font-bold leading-snug text-[#061B3A] group-hover:text-[#075CA8]">
                            {product.name}
                          </h2>
                          <p className="mt-0.5 text-xs font-medium text-[#008FD3]">
                            {product.subtitle}
                          </p>
                        </button>

                        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[#465970]">
                          {product.shortDescription}
                        </p>

                        <div className="mt-3 text-[11px] text-[#5A6C82]">
                          {product.packSize} · {product.dosageNote}
                          {product.stock <= product.lowStockThreshold && (
                            <span className="ml-1 font-semibold text-[#B45309]">
                              · Low Stock ({product.stock})
                            </span>
                          )}
                        </div>

                        <div className="mt-auto border-t border-[#EDF2F7] pt-4">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2 tabular-nums">
                              <span className="font-display text-xl font-bold text-[#061B3A]">
                                {formatINR(product.salePrice)}
                              </span>
                              {product.regularPrice > product.salePrice && (
                                <span className="text-xs text-[#8A9BB0] line-through">
                                  {formatINR(product.regularPrice)}
                                </span>
                              )}
                            </div>
                            {savings > 0 && (
                              <span className="font-mono text-xs font-semibold text-[#075CA8] tabular-nums">
                                Save {savings}%
                              </span>
                            )}
                          </div>

                          <div className="mt-3.5 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openModal(product)}
                              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2.5 text-xs font-semibold text-[#061B3A] transition hover:border-[#075CA8] hover:text-[#075CA8]"
                            >
                              Clinical Specs
                            </button>
                            <button
                              type="button"
                              disabled={product.stock <= 0}
                              onClick={() =>
                                addToCart(product, {
                                  quantity: 1,
                                  isSubscription: Boolean(product.subscriptionPrice),
                                  cadenceDays: 30,
                                })
                              }
                              className="rounded-xl bg-[#075CA8] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#004481] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={activeProduct.name}
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#D8E2EA] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
              <div className="text-xs font-medium text-[#5A6C82] tabular-nums">
                {activeProduct.category} · SKU {activeProduct.sku} · {activeProduct.packSize}
              </div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                aria-label="Close product modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#465970] hover:bg-[#F3F7FB] hover:text-[#061B3A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
              {/* Gallery */}
              <div>
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#E6EEF5] bg-[#F3F7FB]">
                  <ResilientImage
                    src={(activeProduct.gallery ?? [activeProduct.image])[modalGalleryIdx] ?? activeProduct.image}
                    alt={activeProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {activeProduct.gallery && activeProduct.gallery.length > 1 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {activeProduct.gallery.map((imgUrl, idx) => (
                      <button
                        key={imgUrl}
                        type="button"
                        onClick={() => setModalGalleryIdx(idx)}
                        className={`aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${
                          modalGalleryIdx === idx
                            ? 'border-[#075CA8]'
                            : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage
                          src={imgUrl}
                          alt={`${activeProduct.name} view ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinical Dossier */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#008FD3]">
                  <span>{activeProduct.subtitle}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[#061B3A] tabular-nums">
                    <Star className="h-3.5 w-3.5 fill-[#008FD3] text-[#008FD3]" />
                    {activeProduct.rating.toFixed(1)} ({activeProduct.reviewCount.toLocaleString('en-IN')})
                  </span>
                </div>
                <h2 className="mt-1.5 font-display text-2xl font-bold text-[#061B3A]">
                  {activeProduct.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#465970]">
                  {activeProduct.fullDescription}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl bg-[#F5F8FC] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
                      Key Standardized Actives
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#061B3A]">
                      {activeProduct.keyActives.map((active) => (
                        <li key={active} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#075CA8]" />
                          <span>{active}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
                      Target Biomarkers
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#061B3A]">
                      {activeProduct.biomarkers.map((marker) => (
                        <li key={marker} className="flex items-center gap-1.5">
                          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-[#008FD3]" />
                          <span>{marker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Purchase Plan Choice */}
                <div className="mt-5 space-y-2">
                  {activeProduct.subscriptionPrice && (
                    <button
                      type="button"
                      onClick={() => setModalPlan('sub')}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                        modalPlan === 'sub'
                          ? 'border-[#075CA8] bg-[#E9F6FD]/60'
                          : 'border-[#D8E2EA] bg-white hover:border-[#008FD3]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#061B3A]">
                          Auto-Replenish Every 30 Days
                        </p>
                        <p className="text-xs text-[#465970]">
                          Save 15% · Pause or skip any cycle online
                        </p>
                      </div>
                      <span className="font-display text-lg font-bold text-[#061B3A] tabular-nums">
                        {formatINR(activeProduct.subscriptionPrice)}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModalPlan('once')}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                      modalPlan === 'once'
                        ? 'border-[#075CA8] bg-[#E9F6FD]/60'
                        : 'border-[#D8E2EA] bg-white hover:border-[#008FD3]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#061B3A]">One-Time Purchase</p>
                      <p className="text-xs text-[#465970]">{activeProduct.packSize}</p>
                    </div>
                    <span className="font-display text-lg font-bold text-[#061B3A] tabular-nums">
                      {formatINR(
                        activeProduct.id === 'coreaa-daily-vitality'
                          ? activeProduct.regularPrice
                          : activeProduct.salePrice
                      )}
                    </span>
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(activeProduct, {
                        quantity: 1,
                        isSubscription: modalPlan === 'sub' && Boolean(activeProduct.subscriptionPrice),
                        cadenceDays: 30,
                      });
                      setActiveProduct(null);
                    }}
                    className="flex-1 rounded-xl bg-[#075CA8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#004481]"
                  >
                    Add Formulation to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(activeProduct.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D8E2EA] text-[#061B3A] hover:border-[#075CA8]"
                    aria-label="Toggle wishlist"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        wishlist.includes(activeProduct.id)
                          ? 'fill-[#075CA8] text-[#075CA8]'
                          : 'text-[#465970]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
