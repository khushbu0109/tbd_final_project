import React from 'react';
import { Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../data/catalog';
import { ResilientImage } from './ResilientImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    setStoreRoute,
  } = useStore();

  if (!cartOpen) return null;

  const freeShippingThreshold = 1000;
  const remaining = Math.max(0, freeShippingThreshold - cartSubtotal);
  const shippingFee = cartSubtotal === 0 || cartSubtotal >= freeShippingThreshold ? 0 : 99;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-[#061B3A]/45 backdrop-blur-xs"
        onClick={() => setCartOpen(false)}
      />
      <aside
        aria-label="Shopping cart drawer"
        className="relative w-full sm:w-[430px] h-full bg-white shadow-2xl border-l border-[#D8E2EA] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D8E2EA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#075CA8]" />
            <h2 className="font-display text-lg font-bold text-[#061B3A]">
              Your Vitality Cart <span className="text-[#414751] font-medium tabular-nums">({cartCount})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#414751] hover:bg-[#F5F7FA] hover:text-[#061B3A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="px-6 py-3.5 bg-[#F5F7FA] border-b border-[#D8E2EA]">
          <div className="flex items-center justify-between text-xs font-medium text-[#061B3A] mb-2">
            <span>
              {remaining === 0 && cartSubtotal > 0
                ? 'Free cold-chain express shipping unlocked'
                : `Add ${formatINR(remaining)} more for free express shipping`}
            </span>
            <span className="tabular-nums text-[#075CA8]">
              {Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100))}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#D8E2EA] overflow-hidden">
            <div
              className="h-full bg-[#075CA8] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#E9F6FD] text-[#075CA8] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-semibold text-[#061B3A]">
                  Your cart is currently empty
                </p>
                <p className="text-sm text-[#414751]">
                  Explore clinically verified formulations to begin your daily routine.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  setStoreRoute('products');
                }}
                className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#075CA8] text-white text-sm font-semibold hover:bg-[#082B58] transition-colors cursor-pointer"
              >
                Browse Formulations
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#D8E2EA] bg-[#F9F9FF] flex gap-4"
                >
                  <div className="w-20 h-22 rounded-xl bg-white border border-[#D8E2EA]/80 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[15px] font-bold text-[#061B3A] leading-snug truncate">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#414751] hover:text-[#BA1A1A] transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#414751] mt-0.5">
                      {item.isSubscription
                        ? `Subscribe & Save (${item.cadenceDays}-day cadence)`
                        : 'One-Time Purchase'}{' '}
                      · {item.packSize}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[#D8E2EA] bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#061B3A] hover:bg-[#F5F7FA] rounded-l-full cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-[#061B3A] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-[#061B3A] hover:bg-[#F5F7FA] rounded-r-full cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-base font-bold text-[#061B3A] tabular-nums">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-[#E9F6FD]/80 border border-[#075CA8]/15 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#075CA8] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#075CA8]">
                    Temperature-Controlled Cold Chain
                  </p>
                  <p className="text-xs text-[#414751] mt-0.5">
                    Direct pharmaceutical dispatch within 24 hours with batch COA verification.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#D8E2EA] bg-white space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#414751]">
                <span>Subtotal</span>
                <span className="font-medium text-[#061B3A] tabular-nums">
                  {formatINR(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#414751]">
                <span>Cold-Chain Courier</span>
                <span className="font-semibold text-[#075CA8] tabular-nums">
                  {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-[#D8E2EA] font-display text-base font-bold text-[#061B3A]">
                <span>Total Due</span>
                <span className="tabular-nums">{formatINR(cartSubtotal + shippingFee)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                setStoreRoute('cart');
              }}
              className="w-full h-12 rounded-full bg-[#075CA8] hover:bg-[#082B58] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="w-full text-center text-xs font-medium text-[#075CA8] hover:underline cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
