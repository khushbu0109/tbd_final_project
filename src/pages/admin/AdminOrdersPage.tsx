import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, RotateCcw, Search, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../types';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

interface AdminOrdersPageProps {
  presetStatus?: 'All' | OrderStatus;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ presetStatus = 'All' }) => {
  const { orders, updateOrderStatus, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentStatus>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>(presetStatus);
  const [minAmount, setMinAmount] = useState<number>(0);
  const [invoiceOrder, setInvoiceOrder] = useState<OrderRecord | null>(null);

  React.useEffect(() => {
    setStatusFilter(presetStatus);
  }, [presetStatus]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (paymentFilter !== 'All' && order.paymentStatus !== paymentFilter) return false;
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
      if (order.amount < minAmount) return false;
      if (q) {
        const hay = `${order.id} ${order.customerName} ${order.customerEmail} ${order.customerCity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, paymentFilter, statusFilter, minAmount]);

  const resetFilters = () => {
    setSearch('');
    setPaymentFilter('All');
    setStatusFilter('All');
    setMinAmount(0);
  };

  const handleExportCsv = () => {
    const header = ['Order ID', 'Customer', 'Email', 'City', 'Date', 'Payment Method', 'Payment Status', 'Fulfillment Status', 'Amount (INR)'];
    const rows = filtered.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.customerEmail,
      `"${o.customerCity}"`,
      `"${o.date}"`,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      String(o.amount),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tbd-wellness-orders-${filtered.length}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} orders to CSV`);
  };

  const kpis = [
    { label: 'Total Orders', value: String(orders.length) },
    {
      label: 'Awaiting Fulfillment',
      value: String(orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length),
    },
    {
      label: 'Delivered',
      value: String(orders.filter((o) => o.status === 'Delivered').length),
    },
    {
      label: 'Net Order Value',
      value: formatINR(
        orders.filter((o) => o.status !== 'Cancelled').reduce((acc, o) => acc + o.amount, 0)
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Fulfillment KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
            <p className="text-xs font-semibold text-[#5A6C82]">{k.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID, customer, city..."
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] py-2 pl-9 pr-3 text-xs text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter payment status"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'All' | PaymentStatus)}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value="All">Payment: All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              aria-label="Filter fulfillment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | OrderStatus)}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value="All">Status: All</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter minimum order amount"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value={0}>Amount: Any</option>
              <option value={2000}>Above ₹2,000</option>
              <option value={4000}>Above ₹4,000</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D8E2EA] px-3 py-2 text-xs font-semibold text-[#465970] hover:border-[#075CA8] hover:text-[#061B3A]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#061B3A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#082B58]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6EEF5] bg-[#F9F9FF] text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Fulfillment</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF2F7] tabular-nums">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9FBFF]">
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#075CA8]">{order.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#061B3A]">{order.customerName}</p>
                    <p className="text-[11px] text-[#5A6C82]">
                      {order.customerEmail} · {order.customerCity}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-[#465970]">{order.date}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#061B3A]">{order.paymentMethod}</p>
                    <p className="text-[11px] text-[#5A6C82]">{order.paymentStatus}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      aria-label={`Update status for ${order.id}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs font-semibold text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-[#061B3A]">
                    {formatINR(order.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(order)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D8E2EA] px-2.5 py-1.5 text-[11px] font-semibold text-[#061B3A] hover:border-[#075CA8] hover:text-[#075CA8]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice & Order Detail Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Invoice ${invoiceOrder.id}`}
          onClick={() => setInvoiceOrder(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#D8E2EA] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E6EEF5] pb-4">
              <div>
                <p className="font-mono text-xs font-semibold text-[#008FD3]">
                  TBD WELLNESS TAX INVOICE
                </p>
                <h2 className="mt-0.5 font-display text-xl font-bold text-[#061B3A]">
                  Order {invoiceOrder.id}
                </h2>
                <p className="text-xs text-[#5A6C82]">{invoiceOrder.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                aria-label="Close invoice"
                className="rounded-lg p-1 text-[#5A6C82] hover:bg-[#F3F7FB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-[#5A6C82]">Billed &amp; Shipped To</p>
                <p className="mt-1 font-semibold text-[#061B3A]">{invoiceOrder.customerName}</p>
                <p className="text-[#465970]">{invoiceOrder.customerEmail}</p>
                <p className="text-[#465970]">{invoiceOrder.customerCity}, India</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#5A6C82]">Settlement Details</p>
                <p className="mt-1 font-semibold text-[#061B3A]">{invoiceOrder.paymentMethod}</p>
                <p className="text-[#465970]">Payment: {invoiceOrder.paymentStatus}</p>
                <p className="font-semibold text-[#075CA8]">Fulfillment: {invoiceOrder.status}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#E6EEF5]">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-[#F9F9FF] text-[11px] font-semibold text-[#5A6C82]">
                  <tr>
                    <th className="px-4 py-2.5">Formulation</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2F7]">
                  {invoiceOrder.items.map((item) => (
                    <tr key={item.name}>
                      <td className="px-4 py-2.5 font-medium text-[#061B3A]">{item.name}</td>
                      <td className="px-3 py-2.5 text-center text-[#465970]">{item.qty}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#061B3A]">
                        {formatINR(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#E6EEF5] pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8E2EA] px-4 py-2 text-xs font-semibold text-[#061B3A] hover:border-[#075CA8]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Invoice</span>
              </button>
              <div className="text-right tabular-nums">
                <p className="text-[11px] text-[#5A6C82]">Total Charged (Incl. GST)</p>
                <p className="font-display text-lg font-bold text-[#061B3A]">
                  {formatINR(invoiceOrder.amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
