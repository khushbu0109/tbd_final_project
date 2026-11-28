import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Megaphone,
  Plus,
  RefreshCw,
  RotateCcw,
  TicketPercent,
  Trash2,
  Users,
  UsersRound,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';

/* ============================================================================
 * 1. RETURNS & REFUNDS
 * ========================================================================== */
export const AdminReturnsView: React.FC = () => {
  const { orders, showToast, refreshCoreData } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(499);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('Requested');

  useEffect(() => {
    if (!orderId && orders.length > 0) {
      setOrderId(orders[0].id);
      setAmount(orders[0].amount);
    }
  }, [orders, orderId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getReturns());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !reason.trim()) return;
    try {
      await api.createReturn({
        order_id: orderId,
        amount: Number(amount),
        reason: reason.trim(),
        status,
      });
      setReason('');
      showToast('Return / refund logged in MySQL.');
      await load();
      await refreshCoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to log refund');
    }
  };

  const handleStatusChange = async (id: number, nextStatus: string) => {
    try {
      await api.updateReturnStatus(id, nextStatus);
      showToast(`Refund status updated to ${nextStatus}.`);
      await load();
      await refreshCoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Log Return / Refund</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Order ID</label>
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              const found = orders.find((o) => o.id === e.target.value);
              if (found) setAmount(found.amount);
            }}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm text-[#061B3A]"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} — {o.customerName} ({formatINR(o.amount)})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Refund (₹)</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            >
              <option value="Requested">Requested</option>
              <option value="Approved">Approved</option>
              <option value="Processed">Processed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Reason</label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Damaged blister strip, patient cancellation, etc."
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Refund Case</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Returns &amp; Refund Requests ({rows.length})
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2EA] px-3 py-1.5 text-xs font-semibold text-[#354B66] hover:bg-[#F3F7FB] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-xs text-[#5A6C82]">Loading returns...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Order &amp; Patient</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((r) => (
                  <tr key={String(r.id)} className="hover:bg-[#F9F9FF]">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-[#075CA8]">{String(r.order_id)}</p>
                      <p className="text-[11px] text-[#5A6C82]">{String(r.customer_name || 'Patient')}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[#354B66] max-w-xs">{String(r.reason)}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold tabular-nums text-[#061B3A]">
                      {formatINR(Number(r.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={String(r.status)}
                        onChange={(e) => void handleStatusChange(Number(r.id), e.target.value)}
                        className="rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs font-semibold text-[#061B3A]"
                      >
                        <option value="Requested">Requested</option>
                        <option value="Approved">Approved</option>
                        <option value="Processed">Processed</option>
                        <option value="Rejected">Rejected</option>
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
 * 2. ALL CUSTOMERS
 * ========================================================================== */
export const AdminCustomersView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [groups, setGroups] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [groupId, setGroupId] = useState(3);
  const [isSubscriber, setIsSubscriber] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custData, grpData] = await Promise.all([api.getCustomers(), api.getCustomerGroups()]);
      setRows(custData);
      setGroups(grpData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    try {
      await api.createCustomer({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        group_id: Number(groupId),
        is_subscriber: isSubscriber ? 1 : 0,
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setCity('');
      showToast('Patient profile added to MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add patient');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteCustomer(id);
      showToast('Patient deleted.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete patient');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Add Patient</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Kabir Nair"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kabir@example.in"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98..."
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Patient Group</label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(Number(e.target.value))}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm"
          >
            {groups.map((g) => (
              <option key={String(g.id)} value={Number(g.id)}>
                {String(g.group_name)} ({Number(g.discount_percent)}% off)
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-[#354B66] cursor-pointer">
          <input
            type="checkbox"
            checked={isSubscriber}
            onChange={(e) => setIsSubscriber(e.target.checked)}
            className="h-4 w-4 accent-[#075CA8]"
          />
          <span>Active Auto-Replenish Subscriber</span>
        </label>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Save Patient</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Patient Directory ({rows.length})
          </h2>
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
          <p className="p-6 text-xs text-[#5A6C82]">Loading patients...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Segment</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Lifetime Spend</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((c) => (
                  <tr key={String(c.id)} className="hover:bg-[#F9F9FF]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#061B3A]">{String(c.full_name)}</p>
                      <p className="text-[11px] text-[#5A6C82]">{String(c.email)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-[#E9F6FD] px-2 py-0.5 text-[11px] font-semibold text-[#075CA8]">
                        {String(c.group_name || 'Standard')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#465970]">{String(c.city || '—')}</td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-[#061B3A]">
                      {Number(c.total_orders || 0)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-[#061B3A]">
                      {formatINR(Number(c.lifetime_spend || 0))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(Number(c.id))}
                        className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
 * 3. CUSTOMER GROUPS
 * ========================================================================== */
export const AdminCustomerGroupsView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getCustomerGroups());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await api.createCustomerGroup({
        group_name: groupName.trim(),
        discount_percent: Number(discountPercent),
        description: description.trim(),
      });
      setGroupName('');
      setDescription('');
      showToast('Patient group saved to MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Create Segment</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Group Name</label>
          <input
            type="text"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Corporate Wellness Tier"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Default Discount (%)</label>
          <input
            type="number"
            min={0}
            max={60}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8 h-fit">
        {loading ? (
          <p className="text-xs text-[#5A6C82]">Loading groups...</p>
        ) : (
          rows.map((g) => (
            <div
              key={String(g.id)}
              className="rounded-2xl border border-[#D8E2EA] bg-white p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#061B3A]">
                    {String(g.group_name)}
                  </h3>
                  <span className="rounded-md bg-[#E9F6FD] px-2 py-0.5 font-mono text-xs font-bold text-[#075CA8]">
                    {Number(g.discount_percent)}% OFF
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#5A6C82]">
                  {String(g.description || 'Custom pricing & loyalty segment.')}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-[#EDF3F8] pt-3 text-xs">
                <span className="font-mono text-[#465970] tabular-nums">
                  {Number(g.member_count || 0)} members · {formatINR(Number(g.group_spend || 0))} LTV
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await api.deleteCustomerGroup(Number(g.id));
                    showToast('Group removed.');
                    await load();
                  }}
                  className="rounded-lg p-1 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. COUPONS & DISCOUNTS
 * ========================================================================== */
export const AdminCouponsView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(15);
  const [minOrder, setMinOrder] = useState(499);
  const [maxUses, setMaxUses] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getCoupons());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      await api.createCoupon({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrder),
        max_uses: maxUses ? Number(maxUses) : null,
      });
      setCode('');
      showToast('Coupon saved to MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create coupon');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <TicketPercent className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Create Coupon</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Coupon Code</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VITALITY20"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm uppercase"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Value</label>
            <input
              type="number"
              required
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-sm tabular-nums"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Min Order (₹)</label>
            <input
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Max Uses</label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Coupon</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Active &amp; Archived Coupons ({rows.length})
          </h2>
        </div>
        {loading ? (
          <p className="p-6 text-xs text-[#5A6C82]">Loading coupons...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Benefit</th>
                  <th className="px-5 py-3">Min Order</th>
                  <th className="px-5 py-3">Redemptions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((c) => {
                  const active = Boolean(c.is_active);
                  return (
                    <tr key={String(c.id)} className="hover:bg-[#F9F9FF]">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#075CA8]">
                        {String(c.code)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#061B3A]">
                        {c.discount_type === 'percent'
                          ? `${Number(c.discount_value)}% Off`
                          : `${formatINR(Number(c.discount_value))} Off`}
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[#465970]">
                        {formatINR(Number(c.min_order_amount))}
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[#465970]">
                        {Number(c.used_count || 0)}
                        {c.max_uses ? ` / ${Number(c.max_uses)}` : ''}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await api.toggleCoupon(Number(c.id), !active);
                            showToast(`Coupon ${String(c.code)} ${!active ? 'activated' : 'paused'}.`);
                            await load();
                          }}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                            active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {active ? 'Active' : 'Paused'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            await api.deleteCoupon(Number(c.id));
                            showToast('Coupon deleted.');
                            await load();
                          }}
                          className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. PROMOTIONAL CAMPAIGNS
 * ========================================================================== */
export const AdminCampaignsView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Direct Storefront');
  const [budget, setBudget] = useState(50000);
  const [status, setStatus] = useState('Active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getCampaigns());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createCampaign({
        name: name.trim(),
        channel,
        budget: Number(budget),
        status,
      });
      setName('');
      showToast('Campaign created in MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create campaign');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Launch Campaign</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Campaign Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monsoon Immunity Protocol"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Acquisition Channel</label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Budget (₹)</label>
            <input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            >
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Save Campaign</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Promotional Campaigns ({rows.length})
          </h2>
        </div>
        {loading ? (
          <p className="p-6 text-xs text-[#5A6C82]">Loading campaigns...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Budget</th>
                  <th className="px-5 py-3">Attributed Rev.</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((c) => (
                  <tr key={String(c.id)} className="hover:bg-[#F9F9FF]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#061B3A]">{String(c.name)}</p>
                      <p className="text-[11px] text-[#5A6C82]">
                        {String(c.channel)}
                        {c.coupon_code ? ` · Code: ${String(c.coupon_code)}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-[#465970]">
                      {formatINR(Number(c.budget || 0))}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-[#075CA8]">
                      {formatINR(Number(c.attributed_revenue || 0))}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={String(c.status)}
                        onChange={async (e) => {
                          await api.updateCampaignStatus(Number(c.id), e.target.value);
                          showToast('Campaign status updated.');
                          await load();
                        }}
                        className="rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1 text-xs font-semibold"
                      >
                        <option value="Active">Active</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Paused">Paused</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteCampaign(Number(c.id));
                          showToast('Campaign deleted.');
                          await load();
                        }}
                        className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
 * 6. HOMEPAGE BANNERS
 * ========================================================================== */
export const AdminBannersView: React.FC = () => {
  const { showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Shop COREAA™');
  const [ctaTarget, setCtaTarget] = useState('#shop-protocol');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getBanners());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subtitle.trim()) return;
    try {
      await api.createBanner({
        title: title.trim(),
        subtitle: subtitle.trim(),
        cta_label: ctaLabel.trim(),
        cta_target: ctaTarget.trim(),
      });
      setTitle('');
      setSubtitle('');
      showToast('Homepage banner saved to MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create banner');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Add Homepage Banner</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Headline</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Daily Vitality. Clinically Engineered."
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Subheadline</label>
          <textarea
            rows={2}
            required
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">CTA Label</label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">CTA Target</label>
            <input
              type="text"
              value={ctaTarget}
              onChange={(e) => setCtaTarget(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Banner</span>
        </button>
      </form>

      <div className="space-y-3 lg:col-span-8">
        {loading ? (
          <p className="text-xs text-[#5A6C82]">Loading banners...</p>
        ) : (
          rows.map((b) => {
            const active = Boolean(b.is_active);
            return (
              <div
                key={String(b.id)}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D8E2EA] bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-[#061B3A]">{String(b.title)}</p>
                  <p className="mt-1 text-xs text-[#5A6C82]">{String(b.subtitle)}</p>
                  <p className="mt-2 font-mono text-[11px] text-[#075CA8]">
                    CTA: {String(b.cta_label)} &rarr; {String(b.cta_target)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await api.toggleBanner(Number(b.id), !active);
                      showToast(`Banner ${!active ? 'activated' : 'hidden'}.`);
                      await load();
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {active ? 'Live' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.deleteBanner(Number(b.id));
                      showToast('Banner deleted.');
                      await load();
                    }}
                    className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
