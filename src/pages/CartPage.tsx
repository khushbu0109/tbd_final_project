import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Minus,
  Plus,
  Printer,
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
import { FullPageInvoice } from '../components/FullPageInvoice';
import type { FullInvoiceData } from '../types';

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_FEE = 99;

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

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureEvent {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (res: RazorpayFailureEvent) => void) => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
  handler: (response: RazorpaySuccessResponse) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      window.setTimeout(() => resolve(Boolean(window.Razorpay)), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const CartPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    toggleCartSubscription,
    removeFromCart,
    addCustomAddon,
    completeVerifiedOrder,
    setStoreRoute,
    enterAdmin,
    showToast,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(
    null
  );
  const [promoError, setPromoError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const [confirmedInvoice, setConfirmedInvoice] = useState<FullInvoiceData | null>(null);
  const [showFullInvoice, setShowFullInvoice] = useState(false);

  // Prevent duplicate submission / duplicate verification race conditions
  const activePaymentLockRef = useRef(false);
  const verifyingRef = useRef(false);

  const originalSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + Math.max(item.regularPrice, item.unitPrice) * item.quantity, 0),
    [cart]
  );
  const productSavings = Math.max(0, originalSubtotal - cartSubtotal);
  const discount = appliedPromo ? appliedPromo.discountAmount : 0;
  const shippingFee =
    cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const grandTotal = Math.max(0, cartSubtotal - discount + shippingFee);
  const taxablePreview = Number((grandTotal / 1.18).toFixed(2));
  const gstPreview = Number((grandTotal - taxablePreview).toFixed(2));
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
      showToast(`Promo code ${res.code} verified — ${formatINR(res.discountAmount)} off`);
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : 'Invalid coupon code.');
    }
  };

  const handleRazorpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || checkoutBusy || activePaymentLockRef.current) return;
    if (!customerName.trim() || !customerEmail.trim() || !customerCity.trim()) {
      setPaymentFeedback({
        type: 'error',
        message: 'Please fill in your name, email address, and city to continue.',
      });
      return;
    }

    activePaymentLockRef.current = true;
    setCheckoutBusy(true);
    setPaymentFeedback({
      type: 'info',
      message: 'Creating secure Razorpay order...',
    });

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error(
          'Unable to load Razorpay Checkout SDK. Please check your internet connection and try again.'
        );
      }

      const fullBilling = billingAddress.trim()
        ? `${billingAddress.trim()}, ${customerCity.trim()}, India`
        : `${customerCity.trim()}, India`;
      const fullShipping = sameAsBilling
        ? fullBilling
        : shippingAddress.trim()
        ? `${shippingAddress.trim()}, ${customerCity.trim()}, India`
        : fullBilling;

      // 1. Create authoritative Razorpay order + Pending MySQL order on backend
      const rzpOrder = await api.createRazorpayOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerCity: customerCity.trim(),
        billingAddress: fullBilling,
        shippingAddress: fullShipping,
        orderNotes: orderNotes.trim(),
        couponCode: appliedPromo?.code ?? null,
        items: cart.map((c) => ({
          productId: c.productId,
          name: c.name,
          image: c.image,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          regularPrice: c.regularPrice,
          isSubscription: c.isSubscription,
          cadenceDays: c.cadenceDays,
        })),
      });

      let paymentHandled = false;

      const options: RazorpayCheckoutOptions = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amountPaise,
        currency: rzpOrder.currency || 'INR',
        name: 'TBD Wellness',
        description: `Order ${rzpOrder.orderId} · Clinical Nutraceuticals`,
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: rzpOrder.customer.name,
          email: rzpOrder.customer.email,
          contact: rzpOrder.customer.phone || undefined,
        },
        notes: {
          order_id: rzpOrder.orderId,
          invoice_number: rzpOrder.invoiceNumber,
        },
        theme: {
          color: '#075CA8',
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (paymentHandled || verifyingRef.current) return;
            paymentHandled = true;
            void api
              .reportRazorpayFailure({
                orderId: rzpOrder.orderId,
                razorpay_order_id: rzpOrder.razorpayOrderId,
                reason: 'cancelled',
                errorDescription: 'Customer closed Razorpay Checkout before completing payment',
              })
              .catch(() => {});
            setPaymentFeedback({
              type: 'warning',
              message: `Payment cancelled for ${rzpOrder.orderId}. No charge was captured—your cart is preserved if you'd like to try again.`,
            });
            setCheckoutBusy(false);
            activePaymentLockRef.current = false;
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          if (verifyingRef.current) return;
          paymentHandled = true;
          verifyingRef.current = true;
          setPaymentFeedback({
            type: 'info',
            message: 'Verifying Razorpay payment signature on server...',
          });

          try {
            // 2. Cryptographically verify signature on backend before confirming order
            const verifiedRes = await api.verifyRazorpayPayment({
              orderId: rzpOrder.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifiedRes.verified || !verifiedRes.order) {
              throw new Error('Server could not verify payment signature.');
            }

            completeVerifiedOrder(verifiedRes.order);
            setConfirmedInvoice(verifiedRes.order);
            setAppliedPromo(null);
            setPromoInput('');
            setPaymentFeedback(null);
          } catch (verifyErr) {
            const msg =
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment verification failed on server.';
            setPaymentFeedback({
              type: 'error',
              message: `Verification failed: ${msg}`,
            });
            showToast(`Payment verification failed: ${msg}`);
          } finally {
            verifyingRef.current = false;
            setCheckoutBusy(false);
            activePaymentLockRef.current = false;
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (failureEvt: RazorpayFailureEvent) => {
        if (paymentHandled || verifyingRef.current) return;
        paymentHandled = true;
        const reasonText =
          failureEvt?.error?.description ||
          failureEvt?.error?.reason ||
          'Payment was declined by the gateway.';

        void api
          .reportRazorpayFailure({
            orderId: rzpOrder.orderId,
            razorpay_order_id:
              failureEvt?.error?.metadata?.order_id || rzpOrder.razorpayOrderId,
            razorpay_payment_id: failureEvt?.error?.metadata?.payment_id || null,
            reason: 'failed',
            errorDescription: reasonText,
          })
          .catch(() => {});

        setPaymentFeedback({
          type: 'error',
          message: `Razorpay payment failed (${reasonText}). Order ${rzpOrder.orderId} was not marked as paid—please try again.`,
        });
        showToast('Razorpay payment failed. Please try again.');
        setCheckoutBusy(false);
        activePaymentLockRef.current = false;
      });

      setPaymentFeedback({
        type: 'info',
        message: 'Razorpay Checkout opened — complete your test payment in the secure window.',
      });
      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to start Razorpay checkout.';
      setPaymentFeedback({ type: 'error', message: msg });
      showToast(`Checkout error: ${msg}`);
      setCheckoutBusy(false);
      activePaymentLockRef.current = false;
    }
  };

  if (confirmedInvoice) {
    return (
      <div className="bg-[#F9F9FF] py-14 text-[#061B3A]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#D8E2EA] bg-white p-8 shadow-[0_18px_40px_rgba(6,27,58,0.06)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F6FD] text-[#075CA8]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-[#008FD3]">
              Payment Verified via Razorpay · {confirmedInvoice.id}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-[#061B3A] sm:text-3xl">
              Your Clinical Protocol Is Confirmed for Dispatch
            </h1>
            <p className="mt-2 text-sm text-[#465970]">
              Tax Invoice <span className="font-mono font-semibold text-[#061B3A]">{confirmedInvoice.invoiceNumber}</span>{' '}
              has been issued for{' '}
              <span className="font-semibold text-[#061B3A]">{confirmedInvoice.customerEmail}</span>{' '}
              and synced live into MySQL.
            </p>

            <div className="mt-6 rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] p-5 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-[#E6EEF5] pb-4 text-xs">
                <div>
                  <p className="text-[#5A6C82]">Recipient</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    {confirmedInvoice.customerName}
                  </p>
                  {confirmedInvoice.customerPhone && (
                    <p className="font-mono text-[11px] text-[#5A6C82]">
                      {confirmedInvoice.customerPhone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[#5A6C82]">Shipping Destination</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    {confirmedInvoice.shippingAddress}
                  </p>
                </div>
                <div>
                  <p className="text-[#5A6C82]">Payment Gateway</p>
                  <p className="mt-0.5 font-semibold text-[#061B3A]">
                    Razorpay ({confirmedInvoice.paymentStatus})
                  </p>
                  {confirmedInvoice.razorpayPaymentId && (
                    <p className="mt-0.5 font-mono text-[11px] text-[#075CA8] break-all">
                      ID: {confirmedInvoice.razorpayPaymentId}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[#5A6C82]">Fulfillment Status</p>
                  <p className="mt-0.5 font-semibold text-[#075CA8]">{confirmedInvoice.status}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {confirmedInvoice.items.map((item, idx) => (
                  <li
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between text-xs text-[#354B66] tabular-nums"
                  >
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-semibold text-[#061B3A]">{formatINR(item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1 border-t border-[#E6EEF5] pt-3 text-xs tabular-nums">
                {confirmedInvoice.totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Total Savings</span>
                    <span className="font-semibold">-{formatINR(confirmedInvoice.totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5A6C82]">
                  <span>Shipping</span>
                  <span>
                    {confirmedInvoice.shippingAmount === 0
                      ? 'Free'
                      : formatINR(confirmedInvoice.shippingAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-display text-base font-bold text-[#061B3A]">
                  <span>Amount Paid (Incl. GST)</span>
                  <span>{formatINR(confirmedInvoice.amount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowFullInvoice(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#075CA8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#004481] cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>View &amp; Print Full-Page Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setStoreRoute('products')}
                className="rounded-xl border border-[#D8E2EA] bg-white px-5 py-2.5 text-sm font-semibold text-[#061B3A] hover:border-[#075CA8] cursor-pointer"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={enterAdmin}
                className="rounded-xl border border-[#D8E2EA] bg-white px-5 py-2.5 text-sm font-semibold text-[#465970] hover:border-[#075CA8] cursor-pointer"
              >
                Inspect in Admin Orders
              </button>
            </div>
          </div>
        </div>

        {showFullInvoice && (
          <FullPageInvoice
            invoice={confirmedInvoice}
            onClose={() => setShowFullInvoice(false)}
          />
        )}
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075CA8] hover:underline cursor-pointer"
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
              className="mt-6 rounded-xl bg-[#075CA8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004481] cursor-pointer"
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
                          className="rounded-lg p-1.5 text-[#8A9BB0] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        {/* Subscription Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleCartSubscription(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
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
                              className="px-2.5 py-1.5 text-[#061B3A] hover:text-[#075CA8] cursor-pointer"
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
                              className="px-2.5 py-1.5 text-[#061B3A] hover:text-[#075CA8] cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right tabular-nums">
                            <span className="font-display text-base font-bold text-[#061B3A]">
                              {formatINR(item.unitPrice * item.quantity)}
                            </span>
                            {item.regularPrice > item.unitPrice && (
                              <p className="text-[11px] text-[#8A9BB0] line-through">
                                {formatINR(item.regularPrice * item.quantity)}
                              </p>
                            )}
                          </div>
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
                          className="rounded-lg border border-[#075CA8] px-3 py-1.5 text-xs font-semibold text-[#075CA8] transition hover:bg-[#075CA8] hover:text-white cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary & Razorpay-Only Checkout */}
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
                    className="rounded-xl border border-[#061B3A] px-4 py-2 text-xs font-semibold text-[#061B3A] hover:bg-[#061B3A] hover:text-white cursor-pointer"
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
                    <span>Subtotal (Before Discounts)</span>
                    <span className="font-semibold text-[#061B3A]">
                      {formatINR(originalSubtotal)}
                    </span>
                  </div>
                  {productSavings > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Product / Subscription Savings</span>
                      <span className="font-semibold">-{formatINR(productSavings)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-[#075CA8]">
                      <span>Coupon Discount ({appliedPromo?.code})</span>
                      <span className="font-semibold">-{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#465970]">
                    <span>Cold-Chain Shipping</span>
                    <span className="font-semibold text-[#061B3A]">
                      {shippingFee === 0 ? 'Free' : formatINR(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>Included GST (18% on ₹{taxablePreview.toFixed(2)})</span>
                    <span>₹{gstPreview.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-display text-lg font-bold text-[#061B3A]">
                    <span>Total Payable</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleRazorpayCheckout} className="space-y-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6C82]">
                    Customer &amp; Dispatch Details
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
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone (+91...)"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="City & PIN Code (e.g. Bengaluru, 560001)"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    required
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Billing Address (House / Street / Area)"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />

                  <label className="flex items-center gap-2 text-xs font-medium text-[#354B66] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                    />
                    <span>Shipping address same as billing address</span>
                  </label>

                  {!sameAsBilling && (
                    <textarea
                      rows={2}
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Shipping Address (House / Street / Area / Landmark)"
                      className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                    />
                  )}

                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Order Notes / Delivery Instructions (Optional)"
                    className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 text-xs text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
                  />

                  {/* Sole Payment Gateway Display: Razorpay */}
                  <div className="rounded-xl border border-[#075CA8]/30 bg-[#E9F6FD]/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#061B3A]">
                          Razorpay Secure Checkout
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#465970]">
                          Only accepted payment gateway · Verified server-side before dispatch
                        </p>
                      </div>
                      <span className="rounded-md bg-[#061B3A] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                        Razorpay
                      </span>
                    </div>
                  </div>

                  {paymentFeedback && (
                    <div
                      role="alert"
                      className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                        paymentFeedback.type === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : paymentFeedback.type === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-[#075CA8]/25 bg-[#E9F6FD] text-[#075CA8]'
                      }`}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{paymentFeedback.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={checkoutBusy || grandTotal <= 0}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#004481] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {checkoutBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing Razorpay Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Pay Now with Razorpay · {formatINR(grandTotal)}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#5A6C82]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#008FD3]" />
                    <span>256-bit Razorpay Encrypted · Instant GST Tax Invoice</span>
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
