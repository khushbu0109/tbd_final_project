import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  FlaskConical,
  Lock,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  COREAA_HERO_IMAGES,
  COREAA_INGREDIENTS,
  formatINR,
  getValidHeroImages,
  STUDIO_MEDIA,
} from '../data/catalog';
import { ResilientImage } from '../components/ResilientImage';
import { CoaCarouselSection } from '../components/CoaCarouselSection';
import { HeroProductMediaPanel } from '../components/HeroProductMediaPanel';

const ACCORDIONS = [
  {
    id: 'inside',
    title: "What's Inside?",
    content:
      '10 blister-sealed coated tablets fortified with L-Arginine (100mg), L-Citrulline (100mg), L-Theanine (100mg), Taurine (100mg), Panax Ginseng (100mg), Withania Somnifera Ashwagandha (200mg), Lycopene (10mg), Astaxanthin (8mg), Piperine 95% (3mg), plus complete Multivitamin, Zinc, Selenium, and Magnesium (Bisglycinate) spectrum.',
  },
  {
    id: 'use',
    title: 'How to Use?',
    content:
      'Take one coated tablet daily after your morning meal or 45 minutes pre-training with a tall glass of water. Designed for steady absorption without empty-stomach irritation.',
  },
  {
    id: 'transparency',
    title: 'Ingredient Transparency',
    content:
      'Manufactured under strict cGMP clinical protocols. Non-GMO, soy-free, zero added sugars, and formulated without synthetic colorants or proprietary blend masking.',
  },
  {
    id: 'delivery',
    title: 'Delivery & Cold-Chain Information',
    content:
      'Dispatched within 24 hours in insulated bio-protective packaging. Express Pan-India delivery arrives in 2–4 business days with free shipping above ₹1,000.',
  },
];

type IngredientFilter = 'All' | 'Amino Acids' | 'Botanicals' | 'Antioxidants' | 'Micros & Bio-Enhancer';

export const HomePage: React.FC = () => {
  const {
    products,
    heroStripMrp,
    homepageFeaturedProductId,
    addToCart,
    setStoreRoute,
    reviews,
  } = useStore();
  const featuredProduct =
    products.find((p) => p.id === homepageFeaturedProductId) ??
    products.find((p) => p.id === 'coreaa-daily-vitality') ??
    products[0];

  const [qty, setQty] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string>('inside');
  const [ingredientFilter, setIngredientFilter] = useState<IngredientFilter>('All');
  const [labelZoomOpen, setLabelZoomOpen] = useState(false);

  const featuredUnitPrice = featuredProduct
    ? featuredProduct.salePrice > 0
      ? featuredProduct.salePrice
      : featuredProduct.regularPrice
    : heroStripMrp;
  const featuredRegularPrice = featuredProduct?.regularPrice ?? featuredUnitPrice;
  const filteredIngredients =
    ingredientFilter === 'All'
      ? COREAA_INGREDIENTS
      : COREAA_INGREDIENTS.filter((i) => i.category === ingredientFilter);

  const handleAddFeatured = (goToCheckout = false) => {
    if (!featuredProduct) return;
    addToCart(featuredProduct, {
      quantity: qty,
      isSubscription: false,
      openDrawer: !goToCheckout,
    });
    if (goToCheckout) {
      setStoreRoute('cart');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* SECTION 1: CINEMATIC HERO */}
      <section className="relative w-full bg-gradient-to-br from-[#03132D] via-[#06234C] to-[#083B77] text-white overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 py-10 sm:py-14 lg:py-20">
          {(() => {
            const heroImages = getValidHeroImages(COREAA_HERO_IMAGES);
            const hasHeroMedia = heroImages.length > 0;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                {/* Hero Copy */}
                <div
                  className={`${
                    hasHeroMedia
                      ? 'order-2 lg:order-1 lg:col-span-5'
                      : 'lg:col-span-12 max-w-2xl'
                  } flex flex-col justify-center space-y-6`}
                >
                  <div className="text-xs font-mono tracking-wider text-[#90CDFF]">
                    COREAA™ Flagship Nutraceutical · Batch #CR-2025B
                  </div>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.06] text-white">
                    Daily Vitality.{' '}
                    <span className="text-[#52B9FF]">Elevated.</span>
                  </h1>
                  <p className="text-base sm:text-lg text-[#D7E2FF] leading-relaxed max-w-lg">
                    Meet COREAA™ Daily Vitality—a thoughtfully calibrated 11-compound formula uniting
                    nitric-oxide amino acids, adaptogenic botanicals, marine Astaxanthin, and chelated
                    micronutrients in one pocket blister strip.
                  </p>

                  <div className="space-y-2.5 text-sm text-[#E9F6FD]">
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#16B5E6] shrink-0" />
                      <span>Sustained cellular stamina with zero stimulant crash</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#16B5E6] shrink-0" />
                      <span>1 × 10 Alu-Alu blister tablets · ISO 17025 lab verified</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => scrollToSection('shop-protocol')}
                      className="h-12 px-7 rounded-full bg-[#16B5E6] hover:bg-[#52B9FF] text-[#061B3A] font-display text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Shop COREAA Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('formula-ingredients')}
                      className="h-12 px-6 rounded-full border border-white/25 hover:bg-white/10 text-white font-display text-sm font-semibold inline-flex items-center justify-center transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      See 11 Ingredients
                    </button>
                  </div>
                </div>

                {/* Hero Studio Podium Product Image Panel (static for 1 image, carousel for 2+, hidden for 0) */}
                {hasHeroMedia && (
                  <div className="order-1 lg:order-2 lg:col-span-7 flex">
                    <HeroProductMediaPanel
                      images={heroImages}
                      overlayTitle="COREAA™ Daily Vitality · 1 × 10 Coated Tablets"
                      overlayPrice={`From ${formatINR(heroStripMrp)} / strip`}
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* CERTIFICATE OF ANALYSIS (COA) VERIFICATION CAROUSEL */}
      <CoaCarouselSection />

      {/* SECTION 2: 4-PILLAR BRAND VALUES STRIP */}
      <section className="w-full bg-white border-b border-[#D8E2EA]">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FlaskConical,
                title: 'Thoughtful Ingredients',
                desc: 'Standardized dual-action amino and botanical extracts with exact dosages.',
              },
              {
                icon: Sun,
                title: 'Daily Wellness',
                desc: 'Smooth cellular energy and stress resilience with zero afternoon crash.',
              },
              {
                icon: Package,
                title: 'Convenient Routine',
                desc: 'Hermetic 1 × 10 Alu-Alu pocket blister strips built for daily travel.',
              },
              {
                icon: ShieldCheck,
                title: 'Batch Transparency',
                desc: 'Independent HPLC purity assays and open milligram disclosure.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-5 rounded-2xl bg-[#F9F9FF] border border-[#D8E2EA] flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#E9F6FD] text-[#075CA8] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-[15px] font-bold text-[#061B3A]">
                      {item.title}
                    </h2>
                    <p className="text-[13px] text-[#414751] mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE SHOP COREAA PROTOCOL */}
      <section id="shop-protocol" className="w-full py-20 bg-[#F9F9FF] scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Narrative + Supplement Facts Accordions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-mono font-semibold text-[#075CA8]">
                  Flagship Protocol · COREAA™
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#061B3A] tracking-tight">
                  Support your everyday vitality in one calibrated tablet.
                </h2>
                <p className="text-[15px] text-[#414751] leading-relaxed">
                  Crafted for professionals, athletes, and active adults who want reliable clarity,
                  balanced endurance, and complete micronutrient coverage without juggling six
                  separate bottles.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#075CA8]">
                <span>11 Active Compounds</span>
                <span aria-hidden="true">·</span>
                <span>4-in-1 Synergy Matrix</span>
                <span aria-hidden="true">·</span>
                <span>1 × 10 Blister Strip</span>
              </div>

              <div className="divide-y divide-[#D8E2EA] border-y border-[#D8E2EA]">
                {ACCORDIONS.map((acc) => {
                  const isOpen = openAccordion === acc.id;
                  return (
                    <div key={acc.id} className="py-4">
                      <button
                        type="button"
                        onClick={() => setOpenAccordion(isOpen ? '' : acc.id)}
                        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                      >
                        <span className="font-display text-[15px] font-semibold text-[#061B3A]">
                          {acc.title}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#075CA8] transition-transform duration-200 shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2.5 text-sm text-[#414751] leading-relaxed">
                          {acc.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Contiguous Purchase Module (Admin-selectable product + live Admin price) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D8E2EA] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pb-6 border-b border-[#D8E2EA]">
                <div className="sm:col-span-5 rounded-xl bg-[#F4F8FC] border border-[#D8E2EA] overflow-hidden flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setLabelZoomOpen(true)}
                    className="w-full h-full cursor-pointer group"
                    aria-label={`Inspect ${featuredProduct?.name ?? 'COREAA Daily Vitality'} product packshot`}
                    title="Click to inspect full-size Nutrition Facts label"
                  >
                    <ResilientImage
                      src={featuredProduct?.image || STUDIO_MEDIA.coreaaBoxPrimary}
                      alt={featuredProduct?.name || 'COREAA Daily Vitality front and back studio packshot'}
                      className="w-full h-44 sm:h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                </div>
                <div className="sm:col-span-7 flex flex-col justify-center space-y-2">
                  <div className="text-xs font-mono text-[#075CA8] font-medium">
                    {featuredProduct?.category ?? 'COREAA™ Nutraceutical'} ·{' '}
                    {featuredProduct?.packSize ?? '1 × 10 Tablets Strip'}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#061B3A]">
                    {featuredProduct?.name ?? 'COREAA™ Daily Vitality'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center text-[#E5A800]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="font-semibold text-[#061B3A] tabular-nums">
                      {(featuredProduct?.rating ?? 4.9).toFixed(1)} / 5
                    </span>
                    <span className="text-[#414751]">
                      ({(featuredProduct?.reviewCount ?? 3420).toLocaleString('en-IN')}+ verified reviews)
                    </span>
                  </div>
                  <p className="text-xs text-[#414751]">
                    Batch-tested authenticity · Cold-chain sealed dispatch within 24h
                  </p>
                </div>
              </div>

              {/* Purchase Plan Selector */}
              <div className="p-4 rounded-xl border border-[#075CA8] bg-[#E9F6FD]/60 ring-1 ring-[#075CA8]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="purchase-mode"
                      checked
                      readOnly
                      aria-label="One-Time Purchase"
                      className="mt-1 w-4 h-4 accent-[#075CA8]"
                    />
                    <div>
                      <span className="font-display text-base font-bold text-[#061B3A]">
                        One-Time Purchase
                      </span>
                      <p className="text-xs text-[#414751] mt-0.5">
                        {featuredProduct?.packSize
                          ? `${featuredProduct.packSize} · ${featuredProduct.subtitle}`
                          : 'Single strip of 10 blister-sealed coated tablets'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-xl font-bold text-[#061B3A] tabular-nums">
                      {formatINR(featuredUnitPrice)}
                    </div>
                    {featuredRegularPrice > featuredUnitPrice && (
                      <div className="text-xs text-[#414751] line-through tabular-nums">
                        {formatINR(featuredRegularPrice)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity & CTA Row */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="inline-flex items-center justify-between sm:justify-center rounded-full border border-[#D8E2EA] bg-[#F5F7FA] px-2 h-12 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#061B3A] hover:bg-white cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-display text-base font-bold text-[#061B3A] tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((prev) => Math.min(10, prev + 1))}
                      aria-label="Increase quantity"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#061B3A] hover:bg-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddFeatured(false)}
                    className="w-full sm:w-auto sm:flex-1 h-12 min-h-12 px-6 py-3 rounded-full bg-[#075CA8] hover:bg-[#082B58] text-white font-display text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="tabular-nums">
                      Add to Cart — {formatINR(featuredUnitPrice * qty)}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddFeatured(true)}
                  className="w-full h-12 min-h-12 px-6 py-3 rounded-full bg-[#061B3A] hover:bg-[#082B58] text-white font-display text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#16B5E6] shrink-0" />
                  <span>Instant Checkout</span>
                </button>
              </div>

              {/* Quiet Clinical Trust Row */}
              <div className="pt-4 border-t border-[#D8E2EA] grid grid-cols-3 gap-3 text-center text-xs">
                <div className="flex flex-col items-center gap-1">
                  <Lock className="w-4 h-4 text-[#075CA8]" />
                  <span className="font-semibold text-[#061B3A]">256-Bit SSL</span>
                  <span className="text-[#414751]">Encrypted Checkout</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-[#075CA8]" />
                  <span className="font-semibold text-[#061B3A]">24h Dispatch</span>
                  <span className="text-[#414751]">Cold-Chain Sealed</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#075CA8]" />
                  <span className="font-semibold text-[#061B3A]">Batch Verified</span>
                  <span className="text-[#414751]">HPLC Lab Tested</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CLINICAL COMPOSITION DARK BAND */}
      <section className="w-full bg-[#061B3A] text-white py-20">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-2">
              <p className="text-xs font-mono text-[#16B5E6]">Clinical Formulation Architecture</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Four Synergistic Pillars of Daily Vitality
              </h2>
            </div>
            <p className="text-sm text-[#D7E2FF] max-w-md leading-relaxed">
              Engineered to align vascular circulation, adaptogenic resilience, mitochondrial
              protection, and foundational micronutrient coverage in a single routine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                index: '01.',
                title: 'Amino Acid Complex',
                body: 'L-Arginine, L-Citrulline, Taurine, and L-Theanine calibrated to promote clean microvascular circulation and calm focus without lethargy.',
                outcome: 'Circulation & Tone',
              },
              {
                index: '02.',
                title: 'Botanical Adaptogens',
                body: 'Standardized Panax Ginseng and Withania Somnifera (Ashwagandha) support steady stress equilibrium and sustained stamina.',
                outcome: 'Stress & Stamina',
              },
              {
                index: '03.',
                title: 'Antioxidant Shield',
                body: 'Marine Astaxanthin and vine Lycopene paired with 95% Piperine extract to elevate cellular defense and intestinal bio-absorption.',
                outcome: 'Mitochondrial Defense',
              },
              {
                index: '04.',
                title: 'Zinc',
                body: 'An essential trace mineral that supports immune function, cellular repair, healthy skin, and normal metabolic processes.',
                outcome: 'Immune & Cellular Support',
              },
              {
                index: '05.',
                title: 'Selenium (SPE)',
                body: 'An essential trace mineral that supports antioxidant enzyme activity, cellular protection, and normal thyroid function.',
                outcome: 'Antioxidant Defense',
              },
              {
                index: '06.',
                title: 'Magnesium Bisglycinate',
                body: 'A chelated form of magnesium known for its good absorption and gentle digestive profile, supporting energy metabolism, muscle relaxation, and everyday wellness.',
                outcome: 'Relaxation & Recovery',
              },
            ].map((pillar) => (
              <div
                key={pillar.index}
                className="p-6 rounded-2xl bg-[#082B58]/70 border border-white/10 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-2.5">
                  <span className="font-mono text-xs text-[#52B9FF]">{pillar.index}</span>
                  <h3 className="font-display text-lg font-bold text-white">{pillar.title}</h3>
                  <p className="text-sm text-[#D7E2FF] leading-relaxed">{pillar.body}</p>
                </div>
                <div className="pt-4 border-t border-white/10 text-xs font-medium text-[#90CDFF]">
                  {pillar.outcome}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: 11 ACTIVE INGREDIENTS DOSSIER (ALL LOCAL STUDIO PHOTOS) */}
      <section id="formula-ingredients" className="w-full py-20 bg-white scroll-mt-20">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-mono font-semibold text-[#075CA8]">
                Complete Milligram Disclosure
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#061B3A] tracking-tight">
                What&apos;s Inside COREAA™?
              </h2>
              <p className="text-[15px] text-[#414751] leading-relaxed">
                Inspect all 11 studio-assayed compounds formulated inside every coated tablet.
              </p>
            </div>

            {/* Interactive Category Filter Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F7FA] border border-[#D8E2EA] overflow-x-auto no-scrollbar">
              {(
                ['All', 'Amino Acids', 'Botanicals', 'Antioxidants', 'Micros & Bio-Enhancer'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIngredientFilter(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ingredientFilter === cat
                      ? 'bg-[#075CA8] text-white shadow-xs'
                      : 'text-[#414751] hover:text-[#061B3A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredIngredients.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#D8E2EA] bg-[#F9F9FF] overflow-hidden flex flex-col justify-between hover:border-[#075CA8]/40 transition-colors group"
              >
                <div>
                  <div className="aspect-[4/3] w-full bg-[#E9F6FD]/40 overflow-hidden">
                    <ResilientImage
                      src={item.image}
                      alt={item.imageAlt ?? `${item.name} raw clinical ingredient photography`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                      <h3 className="font-display text-[17px] font-bold text-[#061B3A] leading-snug break-words min-w-0">
                        {item.name}
                      </h3>
                      <span className="font-mono text-xs font-semibold text-[#075CA8] tabular-nums shrink-0 text-right">
                        {item.dosage}
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-[13px] text-[#414751]">
                      {item.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#075CA8] shrink-0 mt-1" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-[#D8E2EA]/80 text-[12px] text-[#414751] bg-white">
                  {item.clinicalNote}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: FEATURED CATALOG PREVIEW + VERIFIED COHORT PROOF */}
      <section className="w-full py-20 bg-[#F9F9FF] border-t border-[#D8E2EA]">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 space-y-16">
          {/* Featured Lineup */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-mono font-semibold text-[#075CA8]">
                  Precision Formulations
                </p>
                <h2 className="font-display text-3xl font-bold text-[#061B3A] tracking-tight">
                  Complete the TBD Wellness System
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStoreRoute('products')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#075CA8] hover:text-[#082B58] cursor-pointer whitespace-nowrap"
              >
                <span>View Full Catalog ({products.filter((p) => p.status === 'Published').length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products
                .filter((p) => p.status === 'Published')
                .slice(0, 3)
                .map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl bg-white border border-[#D8E2EA] overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-[#F5F7FA] p-4 flex items-center justify-center overflow-hidden">
                        <ResilientImage
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full ${
                            product.id === 'coreaa-daily-vitality'
                              ? 'object-contain'
                              : 'object-cover rounded-xl'
                          } group-hover:scale-103 transition-transform duration-500`}
                        />
                      </div>
                      <div className="p-6 space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#414751]">
                          <span className="font-medium text-[#075CA8]">{product.category}</span>
                          <span className="tabular-nums font-medium">
                            {product.rating.toFixed(1)} ★ ({product.reviewCount.toLocaleString('en-IN')})
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#061B3A]">
                          {product.name}
                        </h3>
                        <p className="text-sm text-[#414751] line-clamp-2 leading-relaxed">
                          {product.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-3 flex items-center justify-between gap-4 border-t border-[#D8E2EA]/70">
                      <div>
                        <div className="font-display text-xl font-bold text-[#061B3A] tabular-nums">
                          {formatINR(product.salePrice)}
                        </div>
                        {product.regularPrice > product.salePrice && (
                          <div className="text-xs text-[#414751] line-through tabular-nums">
                            {formatINR(product.regularPrice)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="h-10 px-5 rounded-full bg-[#075CA8] hover:bg-[#082B58] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </div>

          {/* Lifestyle Assurance Split + Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch pt-6 border-t border-[#D8E2EA]">
            <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-[#D8E2EA] min-h-[340px]">
              <ResilientImage
                src={STUDIO_MEDIA.clinicalLifestyle}
                alt="Morning hydration glass paired with COREAA Daily Vitality tablet blister pack"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#075CA8]">
                  Verified Patient &amp; Athlete Cohort
                </p>
                <h2 className="font-display text-3xl font-bold text-[#061B3A] tracking-tight">
                  Wellness built on empirical transparency.
                </h2>
              </div>

              <div className="space-y-4">
                {reviews.slice(0, 2).map((rev) => (
                  <blockquote
                    key={rev.id}
                    className="p-5 rounded-2xl bg-white border border-[#D8E2EA] space-y-3"
                  >
                    <p className="text-sm text-[#061B3A] leading-relaxed">“{rev.quote}”</p>
                    <footer className="flex items-center justify-between text-xs text-[#414751]">
                      <span className="font-semibold text-[#061B3A]">
                        {rev.author} · {rev.role}
                      </span>
                      <span className="font-mono text-[#075CA8]">{rev.productName}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStoreRoute('reviews')}
                  className="h-11 px-6 rounded-full bg-[#075CA8] hover:bg-[#082B58] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Read All {reviews.length + 2836} Reviews</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoreRoute('about')}
                  className="h-11 px-5 rounded-full border border-[#D8E2EA] bg-white hover:bg-[#E9F6FD] text-[#061B3A] text-sm font-semibold transition-colors cursor-pointer"
                >
                  Our Clinical Standards
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Full-Resolution Back Label Inspection Lightbox */}
      {labelZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="COREAA Daily Vitality Back Package Label"
          onClick={() => setLabelZoomOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#D8E2EA] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E6EEF5] bg-white/95 px-5 py-3.5 backdrop-blur-xs">
              <div>
                <p className="font-display text-sm font-bold text-[#061B3A]">
                  COREAA™ Daily Vitality — Back of Pack Label
                </p>
                <p className="text-[11px] font-mono text-[#5A6C82]">
                  1 × 10 Reddish-Brown Film Coated Tablets · WHO GMP &amp; FSSAI Verified
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLabelZoomOpen(false)}
                aria-label="Close back label viewer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#465970] hover:bg-[#F3F7FB] hover:text-[#061B3A] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-[#F5F7FA]">
              <ResilientImage
                src={STUDIO_MEDIA.coreaaBoxBack}
                alt="Full resolution COREAA Daily Vitality back package nutritional information and FSSAI details"
                className="w-full h-auto rounded-lg border border-[#D8E2EA] bg-white shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
