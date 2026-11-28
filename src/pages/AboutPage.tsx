import React from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FlaskConical,
  Microscope,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { STUDIO_MEDIA } from '../data/catalog';
import { ResilientImage } from '../components/ResilientImage';

const PILLARS = [
  {
    icon: FlaskConical,
    title: 'Disclosed Clinical Dosages',
    body: 'Zero proprietary blends. Every milligram of amino acid, adaptogenic root, and carotenoid is listed alongside its assay standardization.',
  },
  {
    icon: Microscope,
    title: 'ISO 17025 Batch Verification',
    body: 'Independent accredited labs screen each production lot for active potency, dissolution rate, heavy metals, and microbiological purity.',
  },
  {
    icon: ShieldCheck,
    title: 'Alu-Alu Moisture Barrier',
    body: 'Instead of bulk jars exposed to humid air daily, COREAA™ tablets are individually sealed to protect oxidation-sensitive Astaxanthin and Lycopene.',
  },
  {
    icon: Award,
    title: 'Bio-Enhanced Uptake',
    body: 'Standardized 95% Piperine and chelated trace minerals are paired intentionally to maximize cellular absorption without gastric irritation.',
  },
];

const ASSAY_CHECKS = [
  { label: 'HPLC Active Potency Assay', value: '99.4% – 101.2% Target Spec' },
  { label: 'Heavy Metals (Pb, As, Cd, Hg)', value: 'Below USP <2232> Detection Limits' },
  { label: 'Disintegration & Dissolution', value: '< 28 Minutes Gastric Release' },
  { label: 'Excipient Transparency', value: 'Zero Titanium Dioxide · Zero Synthetic Dyes' },
];

export const AboutPage: React.FC = () => {
  const { setStoreRoute } = useStore();

  return (
    <div className="bg-[#F9F9FF] text-[#061B3A]">
      {/* Clinical Narrative Hero */}
      <section className="border-b border-[#D8E2EA] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008FD3]">
                Our Clinical Narrative
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-[#061B3A] sm:text-5xl">
                Engineered for Measurable Human Vitality.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[#465970]">
                TBD Wellness was founded to replace vague, under-dosed lifestyle supplements with
                transparent, evidence-led nutraceuticals. We work alongside biochemists, clinical
                nutritionists, and certified pharmaceutical manufacturers to craft daily regimens
                built for sustained physical and cognitive performance.
              </p>

              {/* 3 Clinical Proof Metrics */}
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#E6EEF5] pt-7">
                <div>
                  <p className="font-display text-2xl font-bold text-[#075CA8] tabular-nums sm:text-3xl">
                    100%
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#465970]">Bioavailable Core</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#061B3A] tabular-nums sm:text-3xl">
                    0.00
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#465970]">Synthetic Fillers</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#008FD3] tabular-nums sm:text-3xl">
                    ISO 17025
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#465970]">Third-Party Tested</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-[#D8E2EA] bg-[#F3F7FB] shadow-[0_20px_50px_rgba(6,27,58,0.08)]">
                <ResilientImage
                  src={STUDIO_MEDIA.clinicalLifestyle}
                  alt="Morning hydration glass paired with COREAA Daily Vitality tablet blister pack"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Commitment Split */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FD3]">
              Our Vision
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#061B3A]">
              Clarity Over Hype in Everyday Nutrition
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#465970]">
              Wellness should never rely on opaque marketing claims or megadose stimulants that mask
              fatigue. We envision a standard where every adult can inspect the exact biochemical
              rationale, source standardization, and safety profile behind what they take each morning.
            </p>
          </div>
          <div className="rounded-2xl bg-[#061B3A] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#16B5E6]">
              Our Commitment
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Pharmaceutical Rigor, Daily Usability
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#B8CDE4]">
              From sourcing standardized Panax Ginseng and Haematococcus pluvialis Astaxanthin to
              moisture-sealed Alu-Alu blister packaging, every operational step is designed so your
              10th tablet delivers the exact same potency as your first.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column Why Choose TBD Wellness */}
      <section className="border-y border-[#D8E2EA] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FD3]">
              Formulation Standards
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#061B3A]">
              Why High-Performers Choose TBD Wellness
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-[#D8E2EA] bg-[#F9F9FF] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9F6FD] text-[#075CA8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#061B3A]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#465970]">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Laboratory Assay Verification */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white p-6">
              <ResilientImage
                src={STUDIO_MEDIA.coreaaBoxSecondary}
                alt="COREAA Daily Vitality packaging and batch seal"
                className="aspect-square w-full rounded-xl object-contain bg-[#F4F8FC]"
              />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FD3]">
              Laboratory Assay Verification
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#061B3A]">
              Verified Lot-by-Lot Before Cold-Chain Dispatch
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#465970]">
              Every production batch undergoes four independent analytical checkpoints before release
              to our fulfillment center. Batch verification codes are printed directly on every carton
              and blister foil.
            </p>

            <div className="mt-6 divide-y divide-[#E6EEF5] rounded-2xl border border-[#D8E2EA] bg-white">
              {ASSAY_CHECKS.map((check) => (
                <div
                  key={check.label}
                  className="flex flex-col justify-between gap-1 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-[#061B3A]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#075CA8]" />
                    <span>{check.label}</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-[#465970] tabular-nums">
                    {check.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setStoreRoute('products')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#075CA8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#004481]"
              >
                <span>Explore Clinical Formulations</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStoreRoute('journal')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D8E2EA] bg-white px-6 py-3 text-sm font-semibold text-[#061B3A] transition hover:border-[#075CA8] hover:text-[#075CA8]"
              >
                <Sparkles className="h-4 w-4 text-[#008FD3]" />
                <span>Read Research Journal</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
