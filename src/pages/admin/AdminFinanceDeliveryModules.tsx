import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  CreditCard,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';

/* ============================================================================
 * 1. PAYMENTS
 * ========================================================================== */
export const AdminPaymentsView: React.FC = () => {
  const { showToast, refreshCoreData } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getPayments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const paidTotal = rows
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Captured Payments
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {formatINR(paidTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Total Payment Records
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#075CA8] tabular-nums">
            {rows.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Pending COD / Settlement
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-600 tabular-nums">
            {rows.filter((r) => r.status === 'Pending').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-base font-bold text-[#061B3A]">Payment Gateway Ledger</h2>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2EA] px-3 py-1.5 text-xs font-semibold text-[#354B66] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-xs text-[#5A6C82]">Loading payments...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Order &amp; Customer</th>
                  <th className="px-5 py-3">Provider / Ref</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((p) => (
                  <tr key={String(p.id)} className="hover:bg-[#F9F9FF]">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-[#075CA8]">{String(p.order_id)}</p>
                      <p className="text-[11px] text-[#5A6C82]">{String(p.customer_name || '—')}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#061B3A]">{String(p.provider)}</p>
                      <p className="font-mono text-[10px] text-[#5A6C82]">
                        {String(p.provider_reference || '—')}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[#354B66]">{String(p.method)}</td>
                    <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-[#061B3A]">
                      {formatINR(Number(p.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={String(p.status)}
                        onChange={async (e) => {
                          await api.updatePaymentStatus(Number(p.id), e.target.value);
                          showToast('Payment status synced to MySQL.');
                          await load();
                          await refreshCoreData();
                        }}
                        className="rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs font-semibold"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. TRANSACTIONS
 * ========================================================================== */
export const AdminTransactionsView: React.FC = () => {
  const { orders, showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [orderId, setOrderId] = useState('');
  const [txnType, setTxnType] = useState('Settlement');
  const [amount, setAmount] = useState(499);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!orderId && orders.length > 0) setOrderId(orders[0].id);
  }, [orders, orderId]);

  const load = useCallback(async () => {
    setRows(await api.getTransactions());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    await api.createTransaction({
      order_id: orderId,
      txn_type: txnType,
      amount: Number(amount),
      notes: notes.trim(),
    });
    setNotes('');
    showToast('Transaction entry recorded in MySQL.');
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Record Transaction</h2>
        </div>
        <select
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} — {o.customerName}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={txnType}
            onChange={(e) => setTxnType(e.target.value)}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
          >
            <option value="Capture">Capture</option>
            <option value="Settlement">Settlement</option>
            <option value="Refund">Refund</option>
            <option value="Chargeback">Chargeback</option>
          </select>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs tabular-nums"
          />
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bank UTR or settlement note"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
        >
          Post Ledger Entry
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Financial Transactions ({rows.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
              <tr>
                <th className="px-5 py-3">Gateway Txn ID</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F8]">
              {rows.map((t) => (
                <tr key={String(t.id)} className="hover:bg-[#F9F9FF]">
                  <td className="px-5 py-3 font-mono text-[11px] font-semibold text-[#061B3A]">
                    {String(t.gateway_txn_id)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#075CA8]">{String(t.order_id)}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-[#E9F6FD] px-2 py-0.5 text-[10px] font-semibold text-[#075CA8]">
                      {String(t.txn_type)}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono font-bold tabular-nums">
                    {formatINR(Number(t.amount))}
                  </td>
                  <td className="px-5 py-3 text-[#5A6C82]">{String(t.notes || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. INVOICES
 * ========================================================================== */
export const AdminInvoicesView: React.FC = () => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void api.getInvoices().then(setRows);
  }, []);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E6EEF5] px-6 py-4">
        <Receipt className="h-4 w-4 text-[#075CA8]" />
        <h2 className="font-display text-base font-bold text-[#061B3A]">
          GST Tax Invoices ({rows.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            <tr>
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-5 py-3">Order &amp; Customer</th>
              <th className="px-5 py-3">Taxable Value</th>
              <th className="px-5 py-3">GST (18%)</th>
              <th className="px-5 py-3">Grand Total</th>
              <th className="px-5 py-3">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF3F8]">
            {rows.map((inv) => (
              <tr key={String(inv.id)} className="hover:bg-[#F9F9FF]">
                <td className="px-5 py-3.5 font-mono font-bold text-[#061B3A]">
                  {String(inv.invoice_number)}
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-mono text-[#075CA8]">{String(inv.order_id)}</p>
                  <p className="text-[11px] text-[#5A6C82]">
                    {String(inv.customer_name)} · {String(inv.customer_city || '')}
                  </p>
                </td>
                <td className="px-5 py-3.5 font-mono tabular-nums">
                  {formatINR(Number(inv.taxable_value))}
                </td>
                <td className="px-5 py-3.5 font-mono tabular-nums text-[#5A6C82]">
                  {formatINR(Number(inv.gst_amount))}
                </td>
                <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-[#061B3A]">
                  {formatINR(Number(inv.grand_total))}
                </td>
                <td className="px-5 py-3.5 font-semibold text-emerald-700">
                  {String(inv.payment_status || 'Paid')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. REFUND HISTORY
 * ========================================================================== */
export const AdminRefundHistoryView: React.FC = () => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void api.getRefundHistory().then(setRows);
  }, []);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E6EEF5] px-6 py-4">
        <RotateCcw className="h-4 w-4 text-[#075CA8]" />
        <h2 className="font-display text-base font-bold text-[#061B3A]">
          Refund Audit History ({rows.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Provider Ref</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF3F8]">
            {rows.map((r) => (
              <tr key={String(r.id)} className="hover:bg-[#F9F9FF]">
                <td className="px-5 py-3.5 font-mono font-bold text-[#075CA8]">{String(r.order_id)}</td>
                <td className="px-5 py-3.5">{String(r.customer_name || '—')}</td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-[#5A6C82]">
                  {String(r.provider_reference || '—')}
                </td>
                <td className="px-5 py-3.5 text-[#354B66]">{String(r.reason)}</td>
                <td className="px-5 py-3.5 font-mono font-bold tabular-nums">
                  {formatINR(Number(r.amount))}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded bg-[#E9F6FD] px-2 py-0.5 font-semibold text-[#075CA8]">
                    {String(r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. SHIPPING METHODS
 * ========================================================================== */
export const AdminShippingMethodsView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rate, setRate] = useState(99);
  const [freeAbove, setFreeAbove] = useState(1499);
  const [estimatedDays, setEstimatedDays] = useState('2-3 Business Days');

  const load = useCallback(async () => {
    setRows(await api.getShippingMethods());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    await api.createShippingMethod({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      rate: Number(rate),
      free_above: Number(freeAbove),
      estimated_days: estimatedDays.trim(),
    });
    setName('');
    setCode('');
    showToast('Shipping method added to MySQL.');
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Add Shipping Tier</h2>
        </div>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Same-Day Metro Courier"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <input
          type="text"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="METRO_SAMEDAY"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 font-mono text-xs uppercase"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            placeholder="Rate ₹"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs"
          />
          <input
            type="number"
            value={freeAbove}
            onChange={(e) => setFreeAbove(Number(e.target.value))}
            placeholder="Free Above ₹"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs"
          />
        </div>
        <input
          type="text"
          value={estimatedDays}
          onChange={(e) => setEstimatedDays(e.target.value)}
          placeholder="Estimated ETA"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 text-xs"
        />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Save Method</span>
        </button>
      </form>

      <div className="space-y-3 lg:col-span-8">
        {rows.map((m) => {
          const active = Boolean(m.is_active);
          return (
            <div
              key={String(m.id)}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8E2EA] bg-white p-5"
            >
              <div>
                <p className="font-display text-sm font-bold text-[#061B3A]">{String(m.name)}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[#5A6C82]">
                  {String(m.code)} · {formatINR(Number(m.rate))} (Free above {formatINR(Number(m.free_above))}) ·{' '}
                  {String(m.estimated_days)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await api.toggleShippingMethod(Number(m.id), !active);
                    showToast('Shipping tier updated.');
                    await load();
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {active ? 'Active' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await api.deleteShippingMethod(Number(m.id));
                    showToast('Shipping method deleted.');
                    await load();
                  }}
                  className="rounded-lg p-1.5 text-[#5A6C82] hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. COURIER MANAGEMENT
 * ========================================================================== */
export const AdminCouriersView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [name, setName] = useState('');
  const [trackingTemplate, setTrackingTemplate] = useState('https://track.example.in/{awb}');
  const [coldChain, setColdChain] = useState(true);

  const load = useCallback(async () => {
    setRows(await api.getCouriers());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createCourier({
      name: name.trim(),
      tracking_url_template: trackingTemplate.trim(),
      cold_chain_supported: coldChain ? 1 : 0,
    });
    setName('');
    showToast('Courier partner added to MySQL.');
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Add Courier Partner</h2>
        </div>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="DTDC Clinical Express"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <input
          type="text"
          required
          value={trackingTemplate}
          onChange={(e) => setTrackingTemplate(e.target.value)}
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 font-mono text-xs"
        />
        <label className="flex items-center gap-2 text-xs font-medium text-[#354B66] cursor-pointer">
          <input
            type="checkbox"
            checked={coldChain}
            onChange={(e) => setColdChain(e.target.checked)}
            className="h-4 w-4 accent-[#075CA8]"
          />
          <span>Temperature-Controlled Cold Chain Capable</span>
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
        >
          Save Courier
        </button>
      </form>

      <div className="space-y-3 lg:col-span-8">
        {rows.map((c) => (
          <div
            key={String(c.id)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8E2EA] bg-white p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-bold text-[#061B3A]">{String(c.name)}</p>
                {Boolean(c.cold_chain_supported) && (
                  <span className="rounded bg-[#E9F6FD] px-2 py-0.5 text-[10px] font-semibold text-[#075CA8]">
                    Cold-Chain Ready
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#5A6C82]">
                {String(c.tracking_url_template)}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await api.deleteCourier(Number(c.id));
                showToast('Courier removed.');
                await load();
              }}
              className="rounded-lg p-1.5 text-[#5A6C82] hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 7. SHIPMENT TRACKING
 * ========================================================================== */
export const AdminShipmentTrackingView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [locMap, setLocMap] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setRows(await api.getShipments());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Live Shipment &amp; AWB Tracking ({rows.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2EA] px-3 py-1.5 text-xs font-semibold text-[#354B66] cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            <tr>
              <th className="px-5 py-3">Order &amp; AWB</th>
              <th className="px-5 py-3">Courier</th>
              <th className="px-5 py-3">Last Hub / Scan</th>
              <th className="px-5 py-3">Shipment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF3F8]">
            {rows.map((s) => {
              const id = Number(s.id);
              return (
                <tr key={id} className="hover:bg-[#F9F9FF]">
                  <td className="px-5 py-3.5">
                    <p className="font-mono font-bold text-[#075CA8]">{String(s.order_id)}</p>
                    <p className="font-mono text-[11px] text-[#465970]">AWB: {String(s.awb_number)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-[#061B3A]">{String(s.courier_name || 'Courier')}</p>
                    <p className="text-[11px] text-[#5A6C82]">{String(s.customer_city || '')}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <input
                      type="text"
                      value={locMap[id] ?? String(s.last_location || '')}
                      onChange={(e) => setLocMap((prev) => ({ ...prev, [id]: e.target.value }))}
                      className="w-56 rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs"
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={String(s.current_status)}
                      onChange={async (e) => {
                        await api.updateShipment(id, {
                          current_status: e.target.value,
                          last_location: locMap[id] ?? String(s.last_location || ''),
                        });
                        showToast('Shipment checkpoint saved to MySQL.');
                        await load();
                      }}
                      className="rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs font-semibold"
                    >
                      <option value="Label Created">Label Created</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Exception">Exception</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
