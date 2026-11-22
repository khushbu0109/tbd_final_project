import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../data/catalog';
import { api } from '../services/api';
import { ResilientImage } from '../components/ResilientImage';
import type { OrderRecord, PaymentMethod } from '../types';

const FREE_SHIPPING_THRESHOLD = 1000;

const CROSS_SELL_ADDONS = [
  {
    id: 'addon-cellular-hydration',
    name: 'Cellular Hydration Electrolytes',
    subtitle: 'Sodium, Potassium & Magnesium Malate Sachets',
    packSize: '15 Travel Sachets',
    price: 799,
  },
  {
    id: 'addon-deep-rest',
    name: 'Deep Stage Rest Matrix',
    subtitle: 'Magnesium Glycinate + L-Theanine Night Complex',
    packSize: '30 Evening Capsules',
    price: 949,
  },
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Razorpay Card', 'NetBanking', 'COD'];

export const CartPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    toggleCartSubscription,
    removeFromCart,
    addCustomAddon,
    placeOrder,
    setStoreRoute,
    enterAdmin,
    showToast,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const shippingFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0 ? 0 : 99;
  const grandTotal = Math.max(0, cartSubtotal - discount + shippingFee);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const progressPct = Math.min(100, Math.round((cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await api.validateCoupon(code, cartSubtotal);
      setAppliedPromo({ code: res.code, discountAmount: res.discountAmount });
      setPromoError(null);
      showToast(`Promo code ${res.code} verified in MySQL — ${formatINR(res.discountAmount)} off`);
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Invalid coupon code.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerEmail.trim() || !customerCity.trim()) return;
    try {
      const order = await placeOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerCity: customerCity.trim(),
        paymentMethod,
        totalAmount: grandTotal,
        discountAmount: discount,
        shippingAmount: shippingFee,
        couponCode: appliedPromo?.code ?? null,
      });
      setConfirmedOrder(order);
      setAppliedPromo(null);
      setPromoInput('');
    } catch (err) {
      showToast(`Checkout error: ${(err as Error).message}`);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-[#F9F9FF] py-14 text-[#061B3A]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-8 shadow-[0_18px_40px_rgba(6,27,58,0.06)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F6FD] text-[#075CA8]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-[#008FD3]">
              Order Confirmed · {confirmedOrder.id}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-[#061B3A] sm:text-3xl">
              Your Clinical Protocol Is Preparing for Dispatch
            </h1>
            <p className="mt-2 text-sm text-[#465970]">
              Confirmation sent to <span className="font-semibold text-[#061B3A]">{confirmedOrder.customerEmail}</span>.
              This order has also synced live into the Admin Orders Ledger.
            </p>

            <div className="mt-6 rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] p-5 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-[#E6EEF5] pb-4 text-xs">
                <div>
                  <p className="text-[#5A6C82]">Recipient</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    {confirmedOrder.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-[#5A6C82]">Destination City</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    {confirmedOrder.customerCity}
                  </p>
                </div>
                <div>
                  <p className="text-[#5A6C82]">Payment Method</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
                  </p>
                </div>
                <div>
                  <p className="text-[#5A6C82]">Fulfillment Status</p>
                  <p className="mt-0.5 font-semibold text-[#075CA8]">{confirmedOrder.status}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {confirmedOrder.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between text-xs text-[#354B66] tabular-nums"
                  >
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-semibold text-[#061B3A]">{formatINR(item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-[#E6EEF5] pt-3 font-display text-base font-bold text-[#061B3A] tabular-nums">
                <span>Total Charged</span>
                <span>{formatINR(confirmedOrder.amount)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStoreRoute('products')}
                className="rounded-xl bg-[#075CA8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004481]"
              >
                Continue Exploring Formulations
              </button>
              <button
                type="button"
                onClick={enterAdmin}
                className="rounded-xl border border-[#D8E2EA] bg-white px-5 py-2.5 text-sm font-semibold text-[#061B3A] hover:border-[#075CA8]"
              >
                Inspect in Admin Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F9FF] text-[#061B3A]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#008FD3]">
              Direct-to-Door Cold-Chain Fulfillment
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#061B3A]">
              Shopping Cart &amp; Checkout
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setStoreRoute('products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075CA8] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalog</span>
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="mb-8 rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="flex items-center gap-2 text-[#061B3A]">
              <Truck className="h-4 w-4 text-[#075CA8]" />
              {remainingForFreeShipping === 0
                ? 'Priority Cold-Chain Free Shipping Unlocked'
                : `Add ${formatINR(remainingForFreeShipping)} more to unlock free priority shipping`}
            </span>
            <span className="font-mono text-[#075CA8] tabular-nums">{progressPct}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E9F6FD]">
            <div
              className="h-full rounded-full bg-[#075CA8] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-14 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-[#008FD3]" />
            <h2 className="mt-4 font-display text-xl font-bold text-[#061B3A]">
              Your clinical cart is empty
            </h2>
            <p className="mt-1 text-sm text-[#5A6C82]">
              Explore COREAA™ Daily Vitality and our ISO 17025 verified formulations to build your protocol.
            </p>
            <button
              type="button"
              onClick={() => setStoreRoute('products')}
              className="mt-6 rounded-xl bg-[#075CA8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004481]"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Cart Line Items + Cross-Sells */}
            <div className="space-y-6 lg:col-span-7">
              <div className="divide-y divide-[#E6EEF5] rounded-2xl border border-[#D8E2EA] bg-white">
                {cart.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 shrink-0 rounded-xl border border-[#E6EEF5] bg-[#F3F7FB] object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display text-base font-bold text-[#061B3A]">
                            {item.name}
                          </h2>
                          <p className="text-xs text-[#5A6C82]">
                            {item.subtitle} · {item.packSize}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="rounded-lg p-1.5 text-[#8A9BB0] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        {/* Subscription Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleCartSubscription(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                            item.isSubscription
                              ? 'border-[#075CA8] bg-[#E9F6FD] text-[#075CA8]'
                              : 'border-[#D8E2EA] bg-white text-[#465970] hover:border-[#075CA8]'
                          }`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>
                            {item.isSubscription
                              ? `Subscribed (${item.cadenceDays}-day) · Saving 15%`
                              : 'Switch to Subscription & Save 15%'}
                          </span>
                        </button>

                        {/* Stepper + Line Price */}
                        <div className="flex items-center gap-4">
                          <div className="inline-flex items-center rounded-xl border border-[#D8E2EA] bg-[#F9F9FF]">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="px-2.5 py-1.5 text-[#061B3A] hover:text-[#075CA8]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-semibold text-[#061B3A] tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="px-2.5 py-1.5 text-[#061B3A] hover:text-[#075CA8]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-display text-base font-bold text-[#061B3A] tabular-nums">
                            {formatINR(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clinical Companion Add-Ons */}
              <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#008FD3]">
                  Synergistic Protocol Add-Ons
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {CROSS_SELL_ADDONS.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex flex-col justify-between rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] p-4"
                    >
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#061B3A]">
                          {addon.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#5A6C82]">{addon.subtitle}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-[#061B3A] tabular-nums">
                          {formatINR(addon.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addCustomAddon(addon)}
                          className="rounded-lg border border-[#075CA8] px-3 py-1.5 text-xs font-semibold text-[#075CA8] transition hover:bg-[#075CA8] hover:text-white"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Inline Checkout */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-5 rounded-2xl border border-[#D8E2EA] bg-white p-6">
                <h2 className="font-display text-lg font-bold text-[#061B3A]">Order Summary</h2>

                {/* Promo Code */}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code (try DRTBD)"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] py-2 pl-9 pr-3 text-xs uppercase text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl border border-[#061B3A] px-4 py-2 text-xs font-semibold text-[#061B3A] hover:bg-[#061B3A] hover:text-white"
                  >
                    Apply
                  </button>
                </form>
                {promoError && <p className="text-xs text-[#B45309]">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-xs font-medium text-[#075CA8]">
                    Code {appliedPromo.code} active — {formatINR(appliedPromo.discountAmount)} savings applied.
                  </p>
                )}

                {/* Totals */}
                <div className="space-y-2 border-y border-[#E6EEF5] py-4 text-sm tabular-nums">
                  <div className="flex justify-between text-[#465970]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#061B3A]">{formatINR(cartSubtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#075CA8]">
                      <span>Clinical Promo ({appliedPromo?.code})</span>
                      <span className="font-semibold">-{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#465970]">
                    <span>Cold-Chain Shipping</span>
                    <span className="font-semibold text-[#061B3A]">
                      {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-display text-lg font-bold text-[#061B3A]">
                    <span>Total Payable</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                {/* Express Checkout Form */}
                <form onSubmit={handleCheckout} className="space-y-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6C82]">
                    Express Dispatch Details
                  </p>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="City (e.g. Bengaluru)"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-[#354B66]">Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            paymentMethod === method
                              ? 'border-[#075CA8] bg-[#E9F6FD] text-[#075CA8]'
                              : 'border-[#D8E2EA] bg-white text-[#465970] hover:border-[#075CA8]'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#004481]"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Complete Order · {formatINR(grandTotal)}</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#5A6C82]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#008FD3]" />
                    <span>256-bit Encrypted · Batch-Sealed Guarantee</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
