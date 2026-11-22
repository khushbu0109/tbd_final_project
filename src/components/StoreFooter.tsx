import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { TbdLogo } from './TbdLogo';

export const StoreFooter: React.FC = () => {
  const { setStoreRoute, enterAdmin, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await api.subscribeNewsletter(email.trim(), 'Footer Bulletin');
      setSubscribed(true);
      setEmail('');
      showToast('Enrolled in TBD Wellness Clinical Bulletin (saved to MySQL)');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed');
    }
  };

  return (
    <footer className="w-full bg-[#061B3A] text-white border-t border-[#D8E2EA]/15">
      <div className="max-w-[1320px] mx-auto px-5 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Summary */}
          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => setStoreRoute('home')}
              aria-label="TBD Wellness Home"
              className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-85"
            >
              <TbdLogo variant="dark" size="lg" />
            </button>
            <p className="text-sm text-[#D7E2FF] leading-relaxed max-w-sm">
              Clinical-grade cellular nutrition, standardized botanicals, and transparent milligram
              dosing formulated for sustained everyday vitality.
            </p>
            <div className="text-xs text-[#90CDFF] font-mono tracking-wide">
              GMP Validated · ISO 17025 Third-Party Assayed
            </div>
          </div>

          {/* Ecosystem Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-[#90CDFF] tracking-wider">Storefront</h3>
            <ul className="space-y-2.5 text-sm text-[#D7E2FF]">
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  COREAA™ Flagship
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('products')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Formulations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('reviews')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Verified Reviews
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('journal')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Wellness Journal
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Operations */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-[#90CDFF] tracking-wider">Company</h3>
            <ul className="space-y-2.5 text-sm text-[#D7E2FF]">
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About TBD Wellness
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setStoreRoute('cart')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shopping Cart
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={enterAdmin}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Executive Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#90CDFF] tracking-wider">
              Clinical Bulletin
            </h3>
            <p className="text-sm text-[#D7E2FF] leading-relaxed">
              Receive synthesized clinical assays, ingredient standardization briefs, and new
              formulation releases.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 pt-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
                className="flex-1 h-11 px-4 rounded-full bg-white text-[#061B3A] text-sm placeholder:text-[#414751]/70 focus:outline-none focus:ring-2 focus:ring-[#16B5E6]"
              />
              <button
                type="submit"
                className="h-11 px-5 rounded-full bg-[#008FD3] hover:bg-[#16B5E6] text-[#061B3A] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {subscribed ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Joined</span>
                  </>
                ) : (
                  'Join'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 space-y-3 text-xs text-[#90CDFF]/80">
          <p className="leading-relaxed">
            *These statements have not been evaluated by regulatory food &amp; drug authorities.
            Nutraceutical products are not intended to diagnose, treat, cure, or prevent any
            disease. Consult a qualified healthcare professional before starting any new
            supplementation routine.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[#D7E2FF]/75">
            <span>© 2025 TBD Wellness. All rights reserved.</span>
            <span>Helpline: +91 1800-TBD-WELL · Cold-Chain Pan-India Dispatch</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
