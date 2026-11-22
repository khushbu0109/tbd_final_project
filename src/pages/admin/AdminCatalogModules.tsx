import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  FolderTree,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';

/* ============================================================================
 * 1. CATEGORIES
 * ========================================================================== */
export const AdminCategoriesView: React.FC = () => {
  const { showToast, refreshCoreData } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.createCategory({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        sort_order: Number(sortOrder),
        is_active: 1,
      });
      setName('');
      setSlug('');
      setDescription('');
      setSortOrder((prev) => prev + 1);
      showToast('Category saved to MySQL.');
      await load();
      await refreshCoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, label: string) => {
    try {
      await api.deleteCategory(id);
      showToast(`Deleted category "${label}".`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-base font-bold text-[#061B3A]">Add Category</h2>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Longevity & NAD+"
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#354B66]">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-xs font-mono text-[#061B3A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#354B66]">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 text-sm font-mono tabular-nums text-[#061B3A]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clinical positioning & formulation scope..."
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#004481] disabled:opacity-60 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{submitting ? 'Saving...' : 'Create Category'}</span>
          </button>
        </form>

        <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#061B3A]">
                Catalog Categories ({rows.length})
              </h2>
              <p className="text-xs text-[#5A6C82]">Live MySQL `categories` taxonomy</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2EA] px-3 py-1.5 text-xs font-semibold text-[#354B66] hover:bg-[#F3F7FB] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>
          {error && <p className="p-4 text-xs text-red-600">{error}</p>}
          {loading ? (
            <p className="p-6 text-xs text-[#5A6C82]">Loading categories...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                  <tr>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Slug</th>
                    <th className="px-5 py-3">Products</th>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF3F8]">
                  {rows.map((r) => (
                    <tr key={String(r.id)} className="hover:bg-[#F9F9FF]">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#061B3A]">{String(r.name)}</p>
                        {Boolean(r.description) && (
                          <p className="text-[11px] text-[#5A6C82] line-clamp-1">
                            {String(r.description)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#465970]">
                        /{String(r.slug)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#075CA8] tabular-nums">
                        {Number(r.product_count ?? 0)}
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[#465970]">
                        {Number(r.sort_order ?? 0)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDelete(Number(r.id), String(r.name))}
                          className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Delete category"
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
    </div>
  );
};

/* ============================================================================
 * 2. PRODUCT VARIANTS
 * ========================================================================== */
export const AdminVariantsView: React.FC = () => {
  const { products, showToast } = useStore();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantLabel, setVariantLabel] = useState('');
  const [cadenceDays, setCadenceDays] = useState('');
  const [unitPrice, setUnitPrice] = useState(499);
  const [compareAt, setCompareAt] = useState(699);
  const [stock, setStock] = useState(50);

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getVariants();
      setRows(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !variantSku.trim() || !variantLabel.trim()) return;
    try {
      await api.createVariant({
        product_id: productId,
        variant_sku: variantSku.trim().toUpperCase(),
        variant_label: variantLabel.trim(),
        cadence_days: cadenceDays ? Number(cadenceDays) : null,
        unit_price: Number(unitPrice),
        compare_at_price: compareAt ? Number(compareAt) : null,
        stock: Number(stock),
      });
      setVariantSku('');
      setVariantLabel('');
      setCadenceDays('');
      showToast('Product variant created in MySQL.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create variant');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteVariant(id);
      showToast('Variant removed.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete variant');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-[#D8E2EA] bg-white p-6 space-y-4 lg:col-span-4 h-fit"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#075CA8]" />
          <h2 className="font-display text-base font-bold text-[#061B3A]">New Product Variant</h2>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Parent Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2.5 text-sm text-[#061B3A]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Variant SKU</label>
            <input
              type="text"
              required
              value={variantSku}
              onChange={(e) => setVariantSku(e.target.value)}
              placeholder="TBD-COR-30T"
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs text-[#061B3A]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#354B66]">Cadence (Days)</label>
            <input
              type="number"
              value={cadenceDays}
              onChange={(e) => setCadenceDays(e.target.value)}
              placeholder="30 / blank"
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3 py-2 font-mono text-xs text-[#061B3A]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#354B66]">Variant Label</label>
          <input
            type="text"
            required
            value={variantLabel}
            onChange={(e) => setVariantLabel(e.target.value)}
            placeholder="e.g. 3 × 10 Coated Tablets (30-Day Pack)"
            className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-3.5 py-2.5 text-sm text-[#061B3A]"
          />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#354B66]">Price (₹)</label>
            <input
              type="number"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-2.5 py-2 font-mono text-xs tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#354B66]">MRP (₹)</label>
            <input
              type="number"
              value={compareAt}
              onChange={(e) => setCompareAt(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-2.5 py-2 font-mono text-xs tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-[#354B66]">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] px-2.5 py-2 font-mono text-xs tabular-nums"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#075CA8] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004481] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Variant</span>
        </button>
      </form>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden lg:col-span-8">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#061B3A]">
            Active Pack &amp; Subscription Variants ({rows.length})
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
          <p className="p-6 text-xs text-[#5A6C82]">Loading product variants...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">Variant / Parent</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Cadence</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {rows.map((v) => (
                  <tr key={String(v.id)} className="hover:bg-[#F9F9FF]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#061B3A]">{String(v.variant_label)}</p>
                      <p className="text-[11px] text-[#5A6C82]">{String(v.product_name)}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#465970]">
                      {String(v.variant_sku)}
                    </td>
                    <td className="px-5 py-3.5 text-[#465970]">
                      {v.cadence_days ? `Every ${v.cadence_days}d` : 'One-Time'}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#061B3A] tabular-nums">
                      {formatINR(Number(v.unit_price))}
                    </td>
                    <td className="px-5 py-3.5 font-mono tabular-nums text-[#354B66]">
                      {Number(v.stock)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(Number(v.id))}
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
 * 3. INVENTORY MANAGEMENT
 * ========================================================================== */
export const AdminInventoryView: React.FC = () => {
  const { showToast, refreshCoreData } = useStore();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [deltaMap, setDeltaMap] = useState<Record<string, number>>({});
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      setItems(data.items || []);
      setLogs(data.logs || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdjust = async (productId: string, changeQty: number) => {
    if (!changeQty) return;
    setAdjustingId(productId);
    try {
      await api.adjustInventory({
        product_id: productId,
        change_qty: changeQty,
        reason: reasonMap[productId]?.trim() || (changeQty > 0 ? 'Batch restock' : 'Stock audit adjustment'),
      });
      setDeltaMap((prev) => ({ ...prev, [productId]: 0 }));
      setReasonMap((prev) => ({ ...prev, [productId]: '' }));
      showToast('Inventory updated and logged in MySQL.');
      await load();
      await refreshCoreData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Adjustment failed');
    } finally {
      setAdjustingId(null);
    }
  };

  const lowCount = items.filter((i) => Number(i.stock) <= Number(i.low_stock_threshold)).length;
  const totalUnits = items.reduce((sum, i) => sum + Number(i.stock || 0), 0);
  const retailValue = items.reduce(
    (sum, i) => sum + Number(i.stock || 0) * Number(i.sale_price || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Total Units On Hand
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
            {totalUnits.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Low-Stock Alert SKUs
          </p>
          <p className="mt-2 flex items-center gap-2 font-display text-2xl font-bold text-amber-600 tabular-nums">
            <AlertTriangle className="h-5 w-5" />
            <span>{lowCount}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
            Retail Inventory Valuation
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#075CA8] tabular-nums">
            {formatINR(retailValue)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6EEF5] px-6 py-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#075CA8]" />
            <h2 className="font-display text-base font-bold text-[#061B3A]">
              Live Stock Ledger &amp; Batch Adjustments
            </h2>
          </div>
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
          <p className="p-6 text-xs text-[#5A6C82]">Loading live inventory...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
                <tr>
                  <th className="px-5 py-3">SKU &amp; Formulation</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Alert Level</th>
                  <th className="px-5 py-3">Quick Restock / Delta</th>
                  <th className="px-5 py-3">Audit Reason</th>
                  <th className="px-5 py-3 text-right">Apply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8]">
                {items.map((item) => {
                  const id = String(item.id);
                  const low = Number(item.stock) <= Number(item.low_stock_threshold);
                  const delta = deltaMap[id] ?? 25;
                  return (
                    <tr key={id} className="hover:bg-[#F9F9FF]">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#061B3A]">{String(item.name)}</p>
                        <p className="font-mono text-[10px] text-[#5A6C82]">
                          {String(item.sku)} · {String(item.category_name || 'Catalog')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 font-mono font-bold tabular-nums ${
                            low ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {Number(item.stock)} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[#5A6C82]">
                        &le; {Number(item.low_stock_threshold)}
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="number"
                          value={delta}
                          onChange={(e) =>
                            setDeltaMap((prev) => ({ ...prev, [id]: Number(e.target.value) }))
                          }
                          className="w-24 rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          value={reasonMap[id] ?? ''}
                          onChange={(e) =>
                            setReasonMap((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          placeholder="Batch replenishment / QC"
                          className="w-44 rounded-lg border border-[#D8E2EA] bg-white px-2.5 py-1.5 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={adjustingId === id || !delta}
                          onClick={() => void handleAdjust(id, delta)}
                          className="rounded-lg bg-[#075CA8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004481] disabled:opacity-50 cursor-pointer"
                        >
                          {adjustingId === id ? 'Saving...' : 'Update'}
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

      {/* Recent Inventory Audit Trail */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white overflow-hidden">
        <div className="border-b border-[#E6EEF5] px-6 py-4">
          <h3 className="font-display text-sm font-bold text-[#061B3A]">
            Recent Stock Movement Log ({logs.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F9FF] font-mono text-[10px] uppercase tracking-wider text-[#5A6C82]">
              <tr>
                <th className="px-5 py-2.5">SKU</th>
                <th className="px-5 py-2.5">Change</th>
                <th className="px-5 py-2.5">Stock Transition</th>
                <th className="px-5 py-2.5">Reason</th>
                <th className="px-5 py-2.5">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF3F8]">
              {logs.map((l) => (
                <tr key={String(l.id)}>
                  <td className="px-5 py-2.5 font-mono text-[11px] font-semibold text-[#061B3A]">
                    {String(l.sku)}
                  </td>
                  <td
                    className={`px-5 py-2.5 font-mono font-bold tabular-nums ${
                      Number(l.change_qty) >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {Number(l.change_qty) >= 0 ? `+${l.change_qty}` : String(l.change_qty)}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-[11px] tabular-nums text-[#465970]">
                    {Number(l.previous_stock)} &rarr; {Number(l.new_stock)}
                  </td>
                  <td className="px-5 py-2.5 text-[#354B66]">{String(l.reason)}</td>
                  <td className="px-5 py-2.5 text-[#5A6C82]">{String(l.actor_email || 'System')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
