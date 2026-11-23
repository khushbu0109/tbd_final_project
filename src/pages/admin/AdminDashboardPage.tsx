import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Download,
  IndianRupee,
  Package,
  Printer,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';
import { api } from '../../services/api';
import { FullPageInvoice } from '../../components/FullPageInvoice';
import type { FullInvoiceData, OrderRecord } from '../../types';

type ChartTimeframe = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export const AdminDashboardPage: React.FC = () => {
  const { orders, products, setAdminRoute, showToast, refreshCoreData } = useStore();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('Monthly');
  const [dateRange, setDateRange] = useState('Live MySQL');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<FullInvoiceData | null>(null);

  const handleOpenInvoice = async (orderId: string) => {
    setSelectedOrder(null);
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

  const [salesReport, setSalesReport] = useState<Record<string, unknown> | null>(null);
  const [productReport, setProductReport] = useState<Array<Record<string, unknown>>>([]);
  const [customerReport, setCustomerReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      api.getSalesAnalytics().catch(() => null),
      api.getProductAnalytics().catch(() => []),
      api.getCustomerAnalytics().catch(() => null),
    ]).then(([sales, prods, custs]) => {
      setSalesReport(sales);
      setProductReport(Array.isArray(prods) ? prods : []);
      setCustomerReport(custs);
    });
  }, [orders.length, products.length]);

  const salesSummary = (salesReport?.summary || {}) as Record<string, unknown>;
  const customerSummary = (customerReport?.summary || {}) as Record<string, unknown>;
  const topCustomers = (customerReport?.topCustomers || []) as Array<Record<string, unknown>>;

  const liveOrderTotal = useMemo(() => {
    const dbRev = Number(salesSummary.net_revenue);
    if (Number.isFinite(dbRev) && dbRev > 0) return dbRev;
    return orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.amount, 0);
  }, [salesSummary.net_revenue, orders]);

  const avgOrderValue = useMemo(() => {
    const dbAvg = Number(salesSummary.avg_order_value);
    if (Number.isFinite(dbAvg) && dbAvg > 0) return dbAvg;
    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    return liveOrderTotal / Math.max(1, activeOrders.length);
  }, [salesSummary.avg_order_value, orders, liveOrderTotal]);

  const publishedCount = useMemo(
    () => products.filter((p) => p.status === 'Published').length,
    [products]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockThreshold).length,
    [products]
  );

  const activeSubscribers = Number(customerSummary.active_subscribers || 0);
  const totalCustomers = Math.max(1, Number(customerSummary.total_customers || 0));
  const returningCustomersCount = topCustomers.filter((c) => Number(c.total_orders || 0) > 1).length;
  const returningPct = Math.round((returningCustomersCount / totalCustomers) * 100);
  const firstTimePct = Math.max(0, 100 - returningPct);

  // Live Sales by Formulation from MySQL order_items + products
  const productSalesShare = useMemo(() => {
    const top = productReport.slice(0, 5).map((p) => ({
      name: String(p.name),
      revenue: Number(p.gross_revenue || 0),
      units: Number(p.units_sold || 0),
    }));
    const totalRev = Math.max(1, top.reduce((s, x) => s + x.revenue, 0));
    return top.map((item) => ({
      ...item,
      pct: Math.round((item.revenue / totalRev) * 100),
    }));
  }, [productReport]);

  // Dynamic Revenue Chart derived from MySQL orders ledger
  const chartSeries = useMemo(() => {
    const sortedOrders = [...orders]
      .filter((o) => o.status !== 'Cancelled')
      .reverse();

    if (sortedOrders.length === 0) {
      return { labels: ['No Data'], values: [0] };
    }

    const bucketMap = new Map<string, number>();
    sortedOrders.forEach((o, idx) => {
      const label =
        timeframe === 'Daily'
          ? o.date.slice(0, 6)
          : timeframe === 'Weekly'
          ? `O#${idx + 1}`
          : timeframe === 'Yearly'
          ? o.date.slice(-4) || '2025'
          : o.id.replace('#TBD-', '#');
      bucketMap.set(label, (bucketMap.get(label) || 0) + o.amount);
    });

    const entries = Array.from(bucketMap.entries()).slice(-7);
    return {
      labels: entries.map(([k]) => k),
      values: entries.map(([, v]) => v),
    };
  }, [orders, timeframe]);

  const paymentSplit = useMemo(() => {
    const total = Math.max(1, orders.length);
    const isRazorpay = (method: string) => method === 'Razorpay' || method === 'Razorpay Card';
    const rzpPaid = Math.round(
      (orders.filter((o) => isRazorpay(o.paymentMethod) && o.paymentStatus === 'Paid').length /
        total) *
        100
    );
    const rzpPendingFailed = Math.round(
      (orders.filter((o) => isRazorpay(o.paymentMethod) && o.paymentStatus !== 'Paid').length /
        total) *
        100
    );
    const refunded = Math.round(
      (orders.filter((o) => !isRazorpay(o.paymentMethod) && o.paymentStatus === 'Refunded').length /
        total) *
        100
    );
    const legacy = Math.max(0, 100 - rzpPaid - rzpPendingFailed - refunded);
    return [
      { label: 'Razorpay Verified', pct: rzpPaid, color: '#075CA8' },
      { label: 'Razorpay Pending/Failed', pct: rzpPendingFailed, color: '#008FD3' },
      { label: 'Legacy Historical', pct: legacy, color: '#16B5E6' },
      { label: 'Refunded', pct: refunded, color: '#94A3B8' },
    ];
  }, [orders]);

  const maxVal = Math.max(1, ...chartSeries.values);
  const chartPoints = chartSeries.values.map((val, idx) => {
    const denom = Math.max(1, chartSeries.values.length - 1);
    const x = chartSeries.values.length === 1 ? 300 : 40 + (idx * 520) / denom;
    const y = 175 - (val / maxVal) * 135;
    return { x, y, val, label: chartSeries.labels[idx] };
  });
  const linePath = chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    chartPoints.length > 1
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 190 L ${chartPoints[0].x} 190 Z`
      : '';

  const handleExportSummary = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Source', 'Hostinger MySQL Live'],
      ['Net Revenue (INR)', String(liveOrderTotal)],
      ['Orders in Ledger', String(orders.length)],
      ['Active Subscribers', String(activeSubscribers)],
      ['Published SKUs', String(publishedCount)],
      ['Low Stock Alerts', String(lowStockCount)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tbd-wellness-mysql-executive-summary.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported live MySQL KPI summary CSV');
  };

  const kpis = [
    {
      label: 'Net MySQL Revenue',
      value: formatINR(liveOrderTotal),
      delta: `${orders.filter((o) => o.status !== 'Cancelled').length} active orders`,
      icon: IndianRupee,
    },
    {
      label: 'Orders in Ledger',
      value: String(orders.length),
      delta: `${orders.filter((o) => o.status === 'Delivered').length} delivered`,
      icon: ShoppingCart,
    },
    {
      label: 'Avg. Order Value',
      value: formatINR(Math.round(avgOrderValue)),
      delta: 'Live MySQL calculation',
      icon: TrendingUp,
    },
    {
      label: 'Active Subscribers',
      value: String(activeSubscribers),
      delta: `${totalCustomers} total customers in DB`,
      icon: RefreshCw,
    },
    {
      label: 'Published Formulations',
      value: `${publishedCount} / ${products.length}`,
      delta: `${lowStockCount} low-stock watch`,
      icon: Package,
    },
    {
      label: 'Returning Customers',
      value: `${returningPct}%`,
      delta: `${returningCustomersCount} repeat buyers`,
      icon: Users,
    },
  ];

  const strokeDashoffset = Math.round(289 * (1 - returningPct / 100));

  return (
    <div className="space-y-6">
      {/* Executive Header Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-[#5A6C82]">
            Live sync with Hostinger MySQL (`u375814358_tbd_ai_studio`)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select date range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-[#D8E2EA] bg-white px-3.5 py-2 text-xs font-semibold text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
          >
            <option>Live MySQL</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
          <button
            type="button"
            onClick={() => {
              void refreshCoreData();
              showToast('Synced latest records from MySQL');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8E2EA] bg-white px-3.5 py-2 text-xs font-semibold text-[#061B3A] transition hover:border-[#075CA8] hover:text-[#075CA8] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync DB</span>
          </button>
          <button
            type="button"
            onClick={handleExportSummary}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8E2EA] bg-white px-3.5 py-2 text-xs font-semibold text-[#061B3A] transition hover:border-[#075CA8] hover:text-[#075CA8] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#5A6C82]">{kpi.label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9F6FD] text-[#075CA8]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs font-medium text-[#075CA8]">{kpi.delta}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Overview Chart + Sales by Product */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#061B3A]">Revenue Overview</h2>
              <p className="text-xs text-[#5A6C82]">
                Live order revenue from MySQL ({timeframe.toLowerCase()} view)
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] p-1">
              {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as ChartTimeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    timeframe === tf
                      ? 'bg-[#061B3A] text-white'
                      : 'text-[#465970] hover:text-[#061B3A]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <svg viewBox="0 0 600 220" className="h-56 w-full" role="img" aria-label="Revenue trend chart">
              <defs>
                <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#008FD3" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#008FD3" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[50, 100, 150, 190].map((y) => (
                <line
                  key={y}
                  x1="35"
                  x2="570"
                  y1={y}
                  y2={y}
                  stroke="#E6EEF5"
                  strokeDasharray="3 3"
                />
              ))}
              {areaPath && <path d={areaPath} fill="url(#revGrad)" />}
              {chartPoints.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#075CA8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {chartPoints.map((pt) => (
                <g key={`${pt.label}-${pt.x}`}>
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#075CA8" strokeWidth="2.5" />
                  <text
                    x={pt.x}
                    y="208"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#5A6C82"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Sales by Product (Live MySQL) */}
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-base font-bold text-[#061B3A]">Sales by Formulation</h2>
          <p className="text-xs text-[#5A6C82]">Live revenue share from MySQL `order_items`</p>

          <div className="mt-5 space-y-4">
            {productSalesShare.map((row) => (
              <div key={row.name}>
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="font-semibold text-[#061B3A] truncate pr-2">{row.name}</span>
                  <span className="font-mono text-[#465970] shrink-0">
                    {formatINR(row.revenue)} ({row.pct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E9F6FD]">
                  <div
                    className="h-full rounded-full bg-[#075CA8]"
                    style={{ width: `${Math.max(row.pct, row.revenue > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Split Donut + Payment Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            New vs Returning Customers
          </h2>
          <div className="mt-5 flex items-center gap-6">
            <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="46" fill="none" stroke="#E9F6FD" strokeWidth="14" />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#075CA8"
                strokeWidth="14"
                strokeDasharray="289"
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-[#061B3A] tabular-nums">
                  {returningPct}% Returning Cohort
                </p>
                <p className="text-[#5A6C82]">Customers with 2+ orders in MySQL</p>
              </div>
              <div>
                <p className="font-semibold text-[#008FD3] tabular-nums">
                  {firstTimePct}% First-Time Buyers
                </p>
                <p className="text-[#5A6C82]">Single-order storefront customers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Razorpay Gateway &amp; Order Settlement Split
          </h2>
          <p className="text-xs text-[#5A6C82]">
            Razorpay is the exclusive checkout payment gateway · Calculated live from MySQL
          </p>

          <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-[#E9F6FD]">
            {paymentSplit.map((seg) => (
              <div
                key={seg.label}
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${seg.pct}%`}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {paymentSplit.map((seg) => (
              <div
                key={seg.label}
                className="rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] p-3"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#465970]">
                  <span
                    className="h-2.5 w-2.5 rounded-xs"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.label}</span>
                </div>
                <p className="mt-1.5 font-display text-lg font-bold text-[#061B3A] tabular-nums">
                  {seg.pct}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#061B3A]">Recent Orders</h2>
            <p className="text-xs text-[#5A6C82]">Latest transactions synced from MySQL</p>
          </div>
          <button
            type="button"
            onClick={() => setAdminRoute('orders')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#075CA8] hover:underline cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6EEF5] bg-[#F9F9FF] text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
                <th className="px-6 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF2F7] tabular-nums">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-[#F9FBFF]">
                  <td className="px-6 py-3.5 font-mono font-semibold text-[#075CA8]">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="hover:underline cursor-pointer"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#061B3A]">{order.customerName}</p>
                    <p className="text-[11px] text-[#5A6C82]">{order.customerCity}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[#465970]">{order.date}</td>
                  <td className="px-4 py-3.5 text-[#465970]">
                    {order.paymentMethod} · {order.paymentStatus}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-[#061B3A]">{order.status}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-[#061B3A]">
                    {formatINR(order.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Order Preview Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/60 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#D8E2EA] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6EEF5] pb-3">
              <h3 className="font-display text-base font-bold text-[#061B3A]">
                Order {selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close modal"
                className="rounded-lg p-1 text-[#5A6C82] hover:bg-[#F3F7FB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-[#465970]">
              <p>
                <span className="font-semibold text-[#061B3A]">Customer:</span>{' '}
                {selectedOrder.customerName} ({selectedOrder.customerEmail})
              </p>
              <p>
                <span className="font-semibold text-[#061B3A]">City:</span> {selectedOrder.customerCity} ·{' '}
                <span className="font-semibold text-[#061B3A]">Status:</span> {selectedOrder.status}
              </p>
            </div>
            <ul className="mt-4 divide-y divide-[#EDF2F7] rounded-xl border border-[#E6EEF5] bg-[#F9F9FF] px-4 py-2 text-xs tabular-nums">
              {selectedOrder.items.map((item) => (
                <li key={item.name} className="flex justify-between py-2">
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-semibold text-[#061B3A]">{formatINR(item.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-[#E6EEF5] pt-4">
              <button
                type="button"
                onClick={() => void handleOpenInvoice(selectedOrder.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#075CA8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#064A88] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Full-Page Invoice</span>
              </button>
              <div className="text-right font-display text-base font-bold text-[#061B3A] tabular-nums">
                <span className="mr-2 text-xs font-medium text-[#5A6C82]">Total</span>
                <span>{formatINR(selectedOrder.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
