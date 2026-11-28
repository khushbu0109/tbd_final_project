import React, { useMemo, useState } from 'react';
import { Download, FileText, RotateCcw, Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';
import { api } from '../../services/api';
import { FullPageInvoice } from '../../components/FullPageInvoice';
import type { FullInvoiceData, OrderStatus, PaymentStatus } from '../../types';

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
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<FullInvoiceData | null>(null);

  const handleOpenInvoice = async (orderId: string) => {
    setInvoiceOpen(true);
    setInvoiceLoading(true);
    setInvoiceDetail(null);
    try {
      const detail = await api.getOrderDetail(orderId);
      setInvoiceDetail(detail);
    } catch (err) {
      setInvoiceOpen(false);
      showToast(err instanceof Error ? err.message : 'Unable to load full invoice.');
    } finally {
      setInvoiceLoading(false);
    }
  };

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
    const header = ['Order ID', 'Patient', 'Email', 'City', 'Date', 'Payment Method', 'Payment Status', 'Fulfillment Status', 'Amount (INR)'];
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
                placeholder="Search Order ID, patient, city..."
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
              <option value="Failed">Failed</option>
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
                <th className="px-4 py-3.5">Patient</th>
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
                      onClick={() => void handleOpenInvoice(order.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D8E2EA] px-2.5 py-1.5 text-[11px] font-semibold text-[#061B3A] hover:border-[#075CA8] hover:text-[#075CA8] cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Page A4 Tax Invoice Viewer & Print Modal */}
      {invoiceOpen && (
        <FullPageInvoice
          invoice={invoiceDetail}
          loading={invoiceLoading}
          onClose={() => {
            setInvoiceOpen(false);
            setInvoiceDetail(null);
          }}
        />
      )}
    </div>
  );
};
