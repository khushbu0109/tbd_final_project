import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Boxes,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';

/* ============================================================================
 * 1. SALES REPORTS
 * ========================================================================== */
export const AdminSalesReportView: React.FC = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void api.getSalesAnalytics().then(setData);
  }, []);

  const summary = (data?.summary || {}) as Record<string, unknown>;
  const byStatus = (data?.byStatus || []) as Array<Record<string, unknown>>;
  const byPayment = (data?.byPayment || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Net Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {formatINR(Number(summary.net_revenue || 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Avg Order Value</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#075CA8] tabular-nums">
            {formatINR(Math.round(Number(summary.avg_order_value || 0)))}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Delivered Orders</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {Number(summary.delivered_orders || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Total Orders</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {Number(summary.total_orders || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-sm font-bold text-[#061B3A]">Revenue by Order Status</h2>
          </div>
          <div className="space-y-3">
            {byStatus.map((row) => (
              <div
                key={String(row.status)}
                className="flex items-center justify-between rounded-xl border border-[#EDF3F8] px-4 py-3 text-xs"
              >
                <span className="font-semibold text-[#061B3A]">{String(row.status)}</span>
                <span className="font-mono text-[#465970] tabular-nums">
                  {Number(row.count)} orders ·{' '}
                  <strong className="text-[#075CA8]">{formatINR(Number(row.revenue))}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
          <h2 className="font-display text-sm font-bold text-[#061B3A] mb-4">
            Revenue by Payment Method
          </h2>
          <div className="space-y-3">
            {byPayment.map((row) => (
              <div
                key={String(row.method)}
                className="flex items-center justify-between rounded-xl border border-[#EDF3F8] px-4 py-3 text-xs"
              >
                <span className="font-semibold text-[#061B3A]">{String(row.method)}</span>
                <span className="font-mono text-[#465970] tabular-nums">
                  {Number(row.count)} txns ·{' '}
                  <strong className="text-[#061B3A]">{formatINR(Number(row.revenue))}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. PRODUCT REPORTS
 * ========================================================================== */
export const AdminProductReportView: React.FC = () => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void api.getProductAnalytics().then(setRows);
  }, []);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E6EEF5] px-6 py-4">
        <BarChart3 className="h-4 w-4 text-[#075CA8]" />
        <h2 className="font-display text-base font-bold text-[#061B3A]">
          SKU Performance &amp; Margin Report
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Units Sold</th>
              <th className="px-5 py-3">Gross Revenue</th>
              <th className="px-5 py-3">Unit Margin</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF3F8]">
            {rows.map((p) => {
              const sale = Number(p.sale_price || 0);
              const cost = Number(p.cost_price || 0);
              const marginPct = sale > 0 ? Math.round(((sale - cost) / sale) * 100) : 0;
              return (
                <tr key={String(p.id)} className="hover:bg-[#F9F9FF]">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-[#061B3A]">{String(p.name)}</p>
                    <p className="font-mono text-[10px] text-[#5A6C82]">
                      {String(p.sku)} · {String(p.category_name || '')}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold tabular-nums">
                    {Number(p.units_sold || 0)}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-[#075CA8]">
                    {formatINR(Number(p.gross_revenue || 0))}
                  </td>
                  <td className="px-5 py-3.5 font-mono tabular-nums text-emerald-700">
                    {marginPct}%
                  </td>
                  <td className="px-5 py-3.5 font-mono tabular-nums">{Number(p.stock || 0)}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-amber-600">
                    {Number(p.rating || 4.9).toFixed(1)} ★
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

/* ============================================================================
 * 3. CUSTOMER REPORTS
 * ========================================================================== */
export const AdminCustomerReportView: React.FC = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void api.getCustomerAnalytics().then(setData);
  }, []);

  const summary = (data?.summary || {}) as Record<string, unknown>;
  const byCity = (data?.byCity || []) as Array<Record<string, unknown>>;
  const topCustomers = (data?.topCustomers || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Total Patients</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {Number(summary.total_customers || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Active Subscribers</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#075CA8] tabular-nums">
            {Number(summary.active_subscribers || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Cumulative LTV</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700 tabular-nums">
            {formatINR(Number(summary.total_ltv || 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Average LTV</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {formatINR(Math.round(Number(summary.avg_ltv || 0)))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-sm font-bold text-[#061B3A]">Spend by City</h2>
          </div>
          <div className="space-y-2.5">
            {byCity.map((c) => (
              <div
                key={String(c.city || 'Unknown')}
                className="flex items-center justify-between rounded-xl border border-[#EDF3F8] px-4 py-2.5 text-xs"
              >
                <span className="font-semibold text-[#061B3A]">{String(c.city || 'Unspecified')}</span>
                <span className="font-mono text-[#465970] tabular-nums">
                  {Number(c.customers)} · <strong className="text-[#075CA8]">{formatINR(Number(c.spend))}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-sm font-bold text-[#061B3A] mb-4">
            Top Lifetime Value Patients
          </h2>
          <div className="space-y-2.5">
            {topCustomers.map((c) => (
              <div
                key={String(c.id)}
                className="flex items-center justify-between rounded-xl border border-[#EDF3F8] px-4 py-2.5 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#061B3A]">{String(c.full_name)}</p>
                  <p className="text-[11px] text-[#5A6C82]">
                    {String(c.city || 'India')} · {String(c.group_name || 'Standard')}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums text-[#061B3A]">
                  {formatINR(Number(c.lifetime_spend))} ({Number(c.total_orders)} orders)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. INVENTORY REPORTS
 * ========================================================================== */
export const AdminInventoryReportView: React.FC = () => {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void api.getInventoryAnalytics().then(setData);
  }, []);

  const summary = (data?.summary || {}) as Record<string, unknown>;
  const byCategory = (data?.byCategory || []) as Array<Record<string, unknown>>;
  const lowStock = (data?.lowStockItems || []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Total SKUs</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {Number(summary.total_skus || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Cost Valuation</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#465970] tabular-nums">
            {formatINR(Number(summary.cost_valuation || 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Retail Valuation</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#075CA8] tabular-nums">
            {formatINR(Number(summary.retail_valuation || 0))}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase text-[#5A6C82]">Low-Stock SKUs</p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-600 tabular-nums">
            {Number(summary.low_stock_skus || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Boxes className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-sm font-bold text-[#061B3A]">Stock by Category</h2>
          </div>
          <div className="space-y-2.5">
            {byCategory.map((c) => (
              <div
                key={String(c.category_name)}
                className="flex items-center justify-between rounded-xl border border-[#EDF3F8] px-4 py-3 text-xs"
              >
                <span className="font-semibold text-[#061B3A]">{String(c.category_name)}</span>
                <span className="font-mono tabular-nums text-[#465970]">
                  {Number(c.total_units)} units ·{' '}
                  <strong className="text-[#075CA8]">{formatINR(Number(c.retail_value))}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6">
          <h2 className="font-display text-sm font-bold text-[#061B3A] mb-4">
            Replenishment Priority Queue
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-xs text-emerald-700">All SKUs are above low-stock thresholds.</p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map((item) => (
                <div
                  key={String(item.id)}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#061B3A]">{String(item.name)}</p>
                    <p className="font-mono text-[10px] text-[#5A6C82]">{String(item.sku)}</p>
                  </div>
                  <span className="font-mono font-bold text-amber-700 tabular-nums">
                    {Number(item.stock)} / min {Number(item.low_stock_threshold)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. ADMIN USERS
 * ========================================================================== */
export const AdminUsersView: React.FC = () => {
  const { showToast } = useStore();
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [roles, setRoles] = useState<Array<Record<string, unknown>>>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ClinicalVitality#2025');
  const [roleId, setRoleId] = useState(2);

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([api.getAdminUsers(), api.getRoles()]);
    setUsers(u);
    setRoles(r);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    try {
      await api.createAdminUser({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role_id: Number(roleId),
      });
      setFullName('');
      setEmail('');
      showToast('Admin user created in MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create admin');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Invite Admin User</h2>
        </div>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ops@tbdwellness.com"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary Password"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <select
          value={roleId}
          onChange={(e) => setRoleId(Number(e.target.value))}
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm"
        >
          {roles.map((r) => (
            <option key={String(r.id)} value={Number(r.id)}>
              {String(r.role_name)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Admin Account</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Admin Operators ({users.length})
          </h2>
        </div>
        <div className="divide-y divide-[#EDF3F8]">
          {users.map((u) => {
            const active = Boolean(u.is_active);
            return (
              <div key={String(u.id)} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-semibold text-sm text-[#061B3A]">{String(u.full_name)}</p>
                  <p className="text-xs text-[#5A6C82]">
                    {String(u.email)} · <span className="font-semibold text-[#075CA8]">{String(u.role_name)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await api.updateAdminUser(Number(u.id), { is_active: !active });
                      showToast('Operator status updated.');
                      await load();
                    }}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {active ? 'Active' : 'Suspended'}
                  </button>
                  {Number(u.id) !== 1 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteAdminUser(Number(u.id));
                        showToast('Admin user deleted.');
                        await load();
                      }}
                      className="rounded-lg p-1.5 text-[#5A6C82] hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. ROLES & PERMISSIONS
 * ========================================================================== */
export const AdminRolesView: React.FC = () => {
  const { showToast } = useStore();
  const [roles, setRoles] = useState<Array<Record<string, unknown>>>([]);
  const [roleKey, setRoleKey] = useState('');
  const [roleName, setRoleName] = useState('');
  const [perms, setPerms] = useState('orders.*, delivery.*');

  const load = useCallback(async () => {
    setRoles(await api.getRoles());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleKey.trim() || !roleName.trim()) return;
    await api.createRole({
      role_key: roleKey.trim().toLowerCase().replace(/\s+/g, '_'),
      role_name: roleName.trim(),
      permissions: perms,
    });
    setRoleKey('');
    setRoleName('');
    showToast('Role saved to MySQL.');
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">Create Role</h2>
        </div>
        <input
          type="text"
          required
          value={roleKey}
          onChange={(e) => setRoleKey(e.target.value)}
          placeholder="role_key (e.g. finance_auditor)"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 font-mono text-xs"
        />
        <input
          type="text"
          required
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="Display Role Name"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm"
        />
        <input
          type="text"
          value={perms}
          onChange={(e) => setPerms(e.target.value)}
          placeholder="Comma-separated scopes"
          className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2 font-mono text-xs"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
        >
          Save Role
        </button>
      </form>

      <div className="space-y-3 lg:col-span-8">
        {roles.map((r) => {
          const scopes = Array.isArray(r.permissions) ? (r.permissions as string[]) : [];
          return (
            <div key={String(r.id)} className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#061B3A]">
                    {String(r.role_name)}
                  </h3>
                  <p className="font-mono text-[11px] text-[#5A6C82]">{String(r.role_key)}</p>
                </div>
                <span className="font-mono text-xs text-[#075CA8]">
                  {Number(r.user_count || 0)} assigned
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scopes.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-[#F3F7FB] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#354B66]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * 7. ACTIVITY LOGS
 * ========================================================================== */
export const AdminActivityLogsView: React.FC = () => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const load = useCallback(async () => {
    setRows(await api.getActivityLogs());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            System Audit &amp; Activity Logs ({rows.length})
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
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Entity</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDF3F8]">
            {rows.map((l) => (
              <tr key={String(l.id)} className="hover:bg-[#F9F9FF]">
                <td className="px-5 py-3">
                  <span className="rounded bg-[#E9F6FD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#075CA8]">
                    {String(l.action_type)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-[#061B3A]">{String(l.actor_name)}</p>
                  <p className="text-[10px] text-[#5A6C82]">{String(l.actor_email)}</p>
                </td>
                <td className="px-5 py-3 font-mono text-[11px] text-[#465970]">
                  {String(l.entity_type)} {l.entity_id ? `#${String(l.entity_id)}` : ''}
                </td>
                <td className="px-5 py-3 text-[#354B66]">{String(l.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================================
 * 8. STORE SETTINGS
 * ========================================================================== */
export const AdminStoreSettingsView: React.FC = () => {
  const {
    products,
    heroStripMrp,
    homepageFeaturedProductId,
    refreshCoreData,
    showToast,
  } = useStore();
  const [settings, setSettings] = useState<Array<Record<string, unknown>>>([]);
  const [heroMrpInput, setHeroMrpInput] = useState<string>(String(heroStripMrp));
  const [featuredProductId, setFeaturedProductId] = useState<string>(homepageFeaturedProductId);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await api.getSettings();
    setSettings(rows);
    const mrpRow = rows.find((r) => r.setting_key === 'hero_strip_mrp');
    const prodRow = rows.find((r) => r.setting_key === 'homepage_featured_product_id');
    if (mrpRow && mrpRow.setting_value !== undefined) {
      setHeroMrpInput(String(mrpRow.setting_value));
    }
    if (prodRow && prodRow.setting_value !== undefined) {
      setFeaturedProductId(String(prodRow.setting_value));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generalSettings = settings.filter(
    (item) =>
      item.setting_key !== 'hero_strip_mrp' &&
      item.setting_key !== 'homepage_featured_product_id'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMrp = Number(heroMrpInput);
    if (!Number.isFinite(parsedMrp) || parsedMrp <= 0) {
      showToast('Hero Strip MRP must be a valid positive amount.');
      return;
    }
    setSaving(true);
    try {
      const payload: Array<Record<string, unknown>> = [
        ...generalSettings,
        {
          setting_key: 'hero_strip_mrp',
          setting_group: 'Homepage',
          label: 'Hero Strip MRP (₹)',
          setting_value: String(Math.round(parsedMrp)),
        },
        {
          setting_key: 'homepage_featured_product_id',
          setting_group: 'Homepage',
          label: 'Homepage Featured Product',
          setting_value: featuredProductId || 'coreaa-daily-vitality',
        },
      ];
      const updated = await api.saveSettings(payload);
      setSettings(updated);
      await refreshCoreData();
      showToast('Store & homepage settings saved to MySQL.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Homepage Hero MRP & Featured Product Control Card */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EEF5] pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#075CA8]" />
            <div>
              <h2 className="font-display text-base font-bold text-[#061B3A]">
                Homepage Hero &amp; Featured Product
              </h2>
              <p className="text-xs text-[#5A6C82]">
                Control the Hero strip MRP and which product appears in the Flagship Protocol section
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#075CA8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004481] disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="admin-hero-strip-mrp"
              className="mb-1 flex items-center justify-between text-xs font-semibold text-[#354B66]"
            >
              <span>Hero Strip MRP (₹)</span>
              <span className="font-mono text-[10px] font-normal text-[#8095AD]">
                From ₹{Number(heroMrpInput) > 0 ? Math.round(Number(heroMrpInput)) : 499} / strip
              </span>
            </label>
            <input
              id="admin-hero-strip-mrp"
              type="number"
              min={1}
              required
              value={heroMrpInput}
              onChange={(e) => setHeroMrpInput(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 font-mono text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#5A6C82]">
              Shown on the hero banner overlay: COREAA™ Daily Vitality · 1 × 10 Coated Tablets.
            </p>
          </div>

          <div>
            <label
              htmlFor="admin-homepage-featured-product"
              className="mb-1 flex items-center justify-between text-xs font-semibold text-[#354B66]"
            >
              <span>Featured Homepage Product</span>
              <span className="font-mono text-[10px] font-normal text-[#8095AD]">
                Live Price Sync
              </span>
            </label>
            <select
              id="admin-homepage-featured-product"
              value={featuredProductId}
              onChange={(e) => setFeaturedProductId(e.target.value)}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Sale ₹{p.salePrice} / MRP ₹{p.regularPrice}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#5A6C82]">
              Displayed in &ldquo;Support your everyday vitality in one calibrated tablet.&rdquo; using its live Admin price.
            </p>
          </div>
        </div>
      </div>

      {/* Global Store Settings */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-5">
        <div className="border-b border-[#E6EEF5] pb-3">
          <h3 className="font-display text-sm font-bold text-[#061B3A]">
            Global Store Configuration
          </h3>
          <p className="text-xs text-[#5A6C82]">Persisted in MySQL `store_settings`</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {generalSettings.map((item) => (
            <div key={String(item.setting_key)}>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-[#354B66]">
                <span>{String(item.label)}</span>
                <span className="font-mono text-[10px] font-normal text-[#8095AD]">
                  {String(item.setting_group)}
                </span>
              </label>
              <input
                type="text"
                value={String(item.setting_value ?? '')}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  const targetKey = item.setting_key;
                  setSettings((prev) =>
                    prev.map((row) =>
                      row.setting_key === targetKey ? { ...row, setting_value: nextVal } : row
                    )
                  );
                }}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
