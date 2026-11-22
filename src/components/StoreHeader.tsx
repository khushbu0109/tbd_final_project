import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { TbdLogo } from './TbdLogo';
import type { StoreRoute } from '../types';

const NAV_ITEMS: Array<{ label: string; route?: StoreRoute; isAdmin?: boolean }> = [
  { label: 'Products', route: 'products' },
  { label: 'About', route: 'about' },
  { label: 'Journal', route: 'journal' },
  { label: 'Reviews', route: 'reviews' },
  { label: 'Admin', isAdmin: true },
];

export const StoreHeader: React.FC = () => {
  const { storeRoute, setStoreRoute, enterAdmin, cartCount, setCartOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    setMobileMenuOpen(false);
    if (item.isAdmin) {
      enterAdmin();
    } else if (item.route) {
      setStoreRoute(item.route);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/92 backdrop-blur-md border-b border-[#D8E2EA]">
        <div className="max-w-[1320px] mx-auto px-5 lg:px-10 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Logo */}
          <button
            type="button"
            onClick={() => setStoreRoute('home')}
            aria-label="TBD Wellness Home"
            className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008FD3]"
          >
            <TbdLogo variant="light" size="md" />
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#414751]"
          >
            {NAV_ITEMS.map((item) => {
              const active = !item.isAdmin && storeRoute === item.route;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#008FD3] ${
                    active
                      ? 'text-[#075CA8] font-semibold'
                      : 'text-[#414751] hover:text-[#061B3A]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#075CA8] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${cartCount} items`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#075CA8] hover:bg-[#082B58] text-white text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008FD3]"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={2} />
              <span className="tabular-nums">Cart ({cartCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#D8E2EA] text-[#061B3A] hover:bg-[#E9F6FD] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[#061B3A]/45 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-[300px] max-w-[85vw] h-full bg-white border-r border-[#D8E2EA] flex flex-col justify-between p-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#D8E2EA]">
                <TbdLogo variant="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[#414751] hover:bg-[#F5F7FA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-5 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setStoreRoute('home');
                  }}
                  className={`text-left px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                    storeRoute === 'home'
                      ? 'bg-[#E9F6FD] text-[#075CA8] font-semibold'
                      : 'text-[#061B3A] hover:bg-[#F5F7FA]'
                  }`}
                >
                  Home
                </button>
                {NAV_ITEMS.map((item) => {
                  const active = !item.isAdmin && storeRoute === item.route;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`text-left px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                        active
                          ? 'bg-[#E9F6FD] text-[#075CA8] font-semibold'
                          : 'text-[#061B3A] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setStoreRoute('cart');
              }}
              className="w-full h-11 rounded-full bg-[#075CA8] text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="tabular-nums">View Full Cart ({cartCount})</span>
            </button>
          </aside>
        </div>
      )}
    </>
  );
};
