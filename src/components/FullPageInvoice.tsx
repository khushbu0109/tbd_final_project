import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Clock, Printer, ShieldCheck, X, XCircle } from 'lucide-react';
import { TbdLogo } from './TbdLogo';
import { ResilientImage } from './ResilientImage';
import type { FullInvoiceData } from '../types';

interface FullPageInvoiceProps {
  invoice: FullInvoiceData | null;
  loading?: boolean;
  onClose: () => void;
}

function formatMoney(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₹${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const FullPageInvoice: React.FC<FullPageInvoiceProps> = ({
  invoice,
  loading = false,
  onClose,
}) => {
  useEffect(() => {
    document.body.classList.add('printing-invoice');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('printing-invoice');
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = (status: string) => {
    if (status === 'Paid') {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    }
    if (status === 'Failed' || status === 'Refunded') {
      return {
        bg: 'bg-red-50 border-red-200 text-red-700',
        icon: <XCircle className="h-3.5 w-3.5" />,
      };
    }
    return {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: <Clock className="h-3.5 w-3.5" />,
    };
  };

  const content = (
    <div
      id="invoice-print-portal"
      role="dialog"
      aria-modal="true"
      aria-label={invoice ? `Tax Invoice ${invoice.invoiceNumber}` : 'Tax Invoice'}
      className="fixed inset-0 z-[100] flex flex-col bg-[#061B3A]/75 backdrop-blur-xs overflow-y-auto"
    >
      {/* Screen-only Action Toolbar */}
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 bg-[#061B3A] px-6 py-3.5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <TbdLogo variant="dark" size="sm" />
          <div className="border-l border-white/20 pl-3">
            <p className="font-display text-sm font-bold">
              {invoice ? `Tax Invoice · ${invoice.invoiceNumber}` : 'Loading Tax Invoice...'}
            </p>
            <p className="text-[11px] text-white/70">
              Full-Page A4 Print &amp; PDF Layout · All values synced live from MySQL
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={!invoice || loading}
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[#008FD3] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#16B5E6] disabled:opacity-50 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice preview"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Scrollable Screen Wrapper around Full-Page A4 Sheet */}
      <div className="flex-1 p-4 sm:p-8 print:p-0">
        {loading || !invoice ? (
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-12 text-center shadow-2xl">
            <p className="font-display text-base font-bold text-[#061B3A]">
              Preparing Full-Page Tax Invoice...
            </p>
            <p className="mt-1 text-xs text-[#5A6C82]">
              Loading verified order items, GST breakdown, and Razorpay payment details from MySQL.
            </p>
          </div>
        ) : (
          <article className="invoice-sheet mx-auto w-full max-w-[210mm] rounded-xl border border-[#D8E2EA] bg-white p-8 sm:p-10 text-[#061B3A] shadow-2xl print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <div>
              {/* A. HEADER */}
              <header className="flex flex-col justify-between gap-6 border-b-2 border-[#061B3A] pb-6 sm:flex-row sm:items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <TbdLogo variant="light" size="lg" />
                    <div className="border-l border-[#D8E2EA] pl-3">
                      <p className="font-display text-base font-extrabold tracking-tight text-[#061B3A]">
                        {invoice.company.name}
                      </p>
                      <p className="text-[11px] font-medium text-[#075CA8]">
                        Clinical Nutraceuticals · ISO 17025 Verified
                      </p>
                    </div>
                  </div>
                  <div className="max-w-md text-[11px] leading-relaxed text-[#465970]">
                    <p>{invoice.company.address}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#354B66]">
                      GSTIN: {invoice.company.gstin} · {invoice.company.email} · {invoice.company.phone}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#075CA8]">
                    Original For Recipient
                  </p>
                  <h1 className="mt-0.5 font-display text-3xl font-extrabold tracking-tight text-[#061B3A]">
                    TAX INVOICE
                  </h1>
                  <div className="mt-3 inline-flex flex-col gap-1 text-xs tabular-nums sm:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[#5A6C82]">Invoice No:</span>
                      <span className="font-mono font-bold text-[#061B3A]">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5A6C82]">Invoice Date:</span>
                      <span className="font-semibold text-[#061B3A]">{invoice.invoiceDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5A6C82]">Order Number:</span>
                      <span className="font-mono font-bold text-[#075CA8]">{invoice.id}</span>
                    </div>
                    <div className="mt-1">
                      {(() => {
                        const badge = statusBadge(invoice.paymentStatus);
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>Payment {invoice.paymentStatus}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </header>

              {/* B. CUSTOMER DETAILS */}
              <section className="invoice-avoid-break mt-6 grid grid-cols-1 gap-4 rounded-xl border border-[#D8E2EA] bg-[#F9FBFF] p-5 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#075CA8]">
                    Customer Details
                  </p>
                  <p className="mt-1.5 font-display text-sm font-bold text-[#061B3A]">
                    {invoice.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-[#354B66] break-all">{invoice.customerEmail}</p>
                  {invoice.customerPhone && (
                    <p className="mt-0.5 font-mono text-xs text-[#354B66]">
                      Tel: {invoice.customerPhone}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#075CA8]">
                    Billing Address
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#354B66] whitespace-pre-line">
                    {invoice.billingAddress}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#075CA8]">
                    Shipping Address
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#354B66] whitespace-pre-line">
                    {invoice.shippingAddress}
                  </p>
                </div>
              </section>

              {/* C. ORDER DETAILS TABLE */}
              <section className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#061B3A]">
                    Purchased Items ({invoice.items.length})
                  </h2>
                  <span className="font-mono text-[10px] text-[#5A6C82]">
                    Currency: INR (₹) · Prices inclusive of 18% GST
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#D8E2EA]">
                  <table className="invoice-table w-full text-left text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-[#D8E2EA] bg-[#061B3A] text-[10px] font-semibold uppercase tracking-wider text-white">
                        <th className="w-12 px-3 py-3">Item</th>
                        <th className="px-3 py-3">Product Name</th>
                        <th className="px-3 py-3">SKU</th>
                        <th className="px-2.5 py-3 text-center">Qty</th>
                        <th className="px-3 py-3 text-right">Original Price</th>
                        <th className="px-3 py-3 text-right">Discount</th>
                        <th className="px-3 py-3 text-right">Final Unit Price</th>
                        <th className="px-3 py-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6EEF5] bg-white">
                      {invoice.items.map((item, idx) => (
                        <tr key={`${item.sku || item.name}-${idx}`} className="align-middle">
                          <td className="px-3 py-3">
                            {item.image ? (
                              <ResilientImage
                                src={item.image}
                                alt={item.name}
                                className="h-10 w-10 rounded-lg border border-[#E6EEF5] bg-[#F5F7FA] object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E6EEF5] bg-[#E9F6FD] font-mono text-[10px] font-bold text-[#075CA8]">
                                TBD
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-[#061B3A]">{item.name}</p>
                            {(item.packSize || item.isSubscription) && (
                              <p className="mt-0.5 text-[10px] text-[#5A6C82]">
                                {[
                                  item.packSize,
                                  item.isSubscription
                                    ? `Subscribe & Save (${item.cadenceDays || 30}-day)`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-[#465970]">
                            {item.sku || '—'}
                          </td>
                          <td className="px-2.5 py-3 text-center font-semibold text-[#061B3A]">
                            {item.qty}
                          </td>
                          <td className="px-3 py-3 text-right text-[#5A6C82]">
                            {formatMoney(item.originalUnitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-700">
                            {item.discountAmount > 0 ? `-${formatMoney(item.discountAmount)}` : '₹0.00'}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-[#061B3A]">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-[#061B3A]">
                            {formatMoney(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* D. COMPLETE PRICE BREAKDOWN & E. PAYMENT / NOTES */}
              <section className="invoice-avoid-break mt-6 grid grid-cols-1 gap-6 sm:grid-cols-12">
                {/* Left: Payment & Additional Info */}
                <div className="space-y-4 sm:col-span-6">
                  <div className="rounded-xl border border-[#D8E2EA] bg-[#F9FBFF] p-4 text-xs">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#075CA8]">
                      Payment &amp; Gateway Verification
                    </p>
                    <dl className="mt-2.5 space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6C82]">Payment Method</dt>
                        <dd className="font-bold text-[#061B3A]">{invoice.paymentMethod}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6C82]">Payment Status</dt>
                        <dd className="font-semibold text-[#061B3A]">{invoice.paymentStatus}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6C82]">Fulfillment Status</dt>
                        <dd className="font-semibold text-[#075CA8]">{invoice.status}</dd>
                      </div>
                      {invoice.razorpayPaymentId && (
                        <div className="flex justify-between gap-2 border-t border-[#E6EEF5] pt-1.5">
                          <dt className="text-[#5A6C82]">Transaction / Payment ID</dt>
                          <dd className="font-mono text-[11px] font-semibold text-[#061B3A] break-all text-right">
                            {invoice.razorpayPaymentId}
                          </dd>
                        </div>
                      )}
                      {invoice.razorpayOrderId && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#5A6C82]">Razorpay Order ID</dt>
                          <dd className="font-mono text-[11px] text-[#465970] break-all text-right">
                            {invoice.razorpayOrderId}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {invoice.orderNotes && (
                    <div className="rounded-xl border border-[#D8E2EA] bg-white p-4 text-xs">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5A6C82]">
                        Order Notes
                      </p>
                      <p className="mt-1.5 leading-relaxed text-[#354B66] whitespace-pre-line">
                        {invoice.orderNotes}
                      </p>
                    </div>
                  )}

                  {invoice.totalSavings > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-800">
                      <span className="font-bold">Total Savings on This Order: </span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatMoney(invoice.totalSavings)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Complete Dynamic Price Breakdown */}
                <div className="sm:col-span-6">
                  <div className="rounded-xl border border-[#D8E2EA] bg-white p-5 text-xs tabular-nums">
                    <p className="border-b border-[#E6EEF5] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#075CA8]">
                      Complete Price Breakdown
                    </p>

                    <dl className="mt-3 space-y-2">
                      <div className="flex justify-between text-[#354B66]">
                        <dt>Subtotal (Before Discounts)</dt>
                        <dd className="font-semibold text-[#061B3A]">
                          {formatMoney(invoice.originalSubtotal)}
                        </dd>
                      </div>

                      <div className="flex justify-between text-emerald-700">
                        <dt>Product &amp; Subscription Discounts</dt>
                        <dd className="font-semibold">
                          {invoice.productDiscount > 0
                            ? `-${formatMoney(invoice.productDiscount)}`
                            : formatMoney(0)}
                        </dd>
                      </div>

                      <div className="flex justify-between text-emerald-700">
                        <dt>
                          Coupon / Promotional Discount
                          {invoice.couponCode ? ` (${invoice.couponCode})` : ''}
                        </dt>
                        <dd className="font-semibold">
                          {invoice.discountAmount > 0
                            ? `-${formatMoney(invoice.discountAmount)}`
                            : formatMoney(0)}
                        </dd>
                      </div>

                      <div className="flex justify-between text-[#354B66]">
                        <dt>Shipping Charges</dt>
                        <dd className="font-semibold text-[#061B3A]">
                          {invoice.shippingAmount === 0
                            ? 'FREE (₹0.00)'
                            : formatMoney(invoice.shippingAmount)}
                        </dd>
                      </div>

                      <div className="flex justify-between text-[#354B66]">
                        <dt>Other Applicable Charges</dt>
                        <dd className="font-semibold text-[#061B3A]">
                          {formatMoney(invoice.otherCharges)}
                        </dd>
                      </div>

                      <div className="my-2 border-t border-dashed border-[#D8E2EA] pt-2 space-y-1.5 text-[11px] text-[#5A6C82]">
                        <div className="flex justify-between">
                          <dt>Taxable Amount (Excl. GST)</dt>
                          <dd className="font-mono">{formatMoney(invoice.taxableAmount)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>GST / Applicable Taxes (18% · CGST 9% + SGST 9%)</dt>
                          <dd className="font-mono">{formatMoney(invoice.gstAmount)}</dd>
                        </div>
                        <div className="flex justify-between font-semibold text-emerald-700">
                          <dt>Total Savings</dt>
                          <dd className="font-mono">{formatMoney(invoice.totalSavings)}</dd>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t-2 border-[#061B3A] pt-3 font-display text-base font-extrabold text-[#061B3A]">
                        <dt>Grand Total (Incl. GST)</dt>
                        <dd>{formatMoney(invoice.amount)}</dd>
                      </div>

                      <div className="flex justify-between pt-1 text-xs font-semibold text-emerald-700">
                        <dt>Amount Paid ({invoice.paymentMethod})</dt>
                        <dd className="font-mono">{formatMoney(invoice.amountPaid)}</dd>
                      </div>

                      <div className="flex justify-between text-xs font-bold text-[#061B3A]">
                        <dt>Balance Due</dt>
                        <dd className="font-mono">{formatMoney(invoice.balanceDue)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
            </div>

            {/* FOOTER / COMPANY CONTACT & THANK-YOU MESSAGE */}
            <footer className="invoice-avoid-break mt-8 border-t border-[#D8E2EA] pt-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="space-y-1 text-[11px] text-[#465970]">
                  <p className="font-display text-sm font-bold text-[#061B3A]">
                    Thank you for choosing TBD Wellness.
                  </p>
                  <p>
                    For batch COA verification, clinical protocol support, or invoice inquiries,
                    contact{' '}
                    <span className="font-semibold text-[#075CA8]">{invoice.company.email}</span> or
                    call <span className="font-mono">{invoice.company.phone}</span>.
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    {invoice.company.name} · {invoice.company.website} · GSTIN:{' '}
                    {invoice.company.gstin}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-[#5A6C82] sm:text-right">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#075CA8]" />
                  <span>
                    Computer-generated GST Tax Invoice · No physical signature required.
                  </span>
                </div>
              </div>
            </footer>
          </article>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
