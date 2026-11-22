import React, { useMemo, useState } from 'react';
import { Copy, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../data/catalog';
import { ResilientImage } from '../../components/ResilientImage';
import type { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const {
    products,
    categories,
    setAdminRoute,
    updateProduct,
    updateProductStatus,
    deleteProducts,
    duplicateProduct,
  } = useStore();

  const categoryOptions = useMemo(
    () => ['All', ...categories.map((c) => c.name)],
    [categories]
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Healthy'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-desc' | 'stock-asc'>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSaving(true);
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        packSize: editingProduct.packSize,
        regularPrice: editingProduct.regularPrice,
        salePrice: editingProduct.salePrice,
        subscriptionPrice: editingProduct.subscriptionPrice,
        stock: editingProduct.stock,
        lowStockThreshold: editingProduct.lowStockThreshold,
        status: editingProduct.status,
        shortDescription: editingProduct.shortDescription,
      });
      setEditingProduct(null);
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (stockFilter === 'Low' && p.stock > p.lowStockThreshold) return false;
      if (stockFilter === 'Healthy' && p.stock <= p.lowStockThreshold) return false;
      if (q && !`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.salePrice - a.salePrice);
    if (sortBy === 'stock-asc') return [...list].sort((a, b) => a.stock - b.stock);
    return list;
  }, [products, search, categoryFilter, statusFilter, stockFilter, sortBy]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'publish' | 'draft' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'publish') updateProductStatus(selectedIds, 'Published');
    if (action === 'draft') updateProductStatus(selectedIds, 'Draft');
    if (action === 'delete') deleteProducts(selectedIds);
    setSelectedIds([]);
  };

  const metrics = [
    { label: 'Total SKUs', value: String(products.length) },
    {
      label: 'Published Live',
      value: String(products.filter((p) => p.status === 'Published').length),
    },
    {
      label: 'Draft Formulations',
      value: String(products.filter((p) => p.status === 'Draft').length),
    },
    {
      label: 'Low Stock Alerts',
      value: String(products.filter((p) => p.stock <= p.lowStockThreshold).length),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Catalog Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
            <p className="text-xs font-semibold text-[#5A6C82]">{m.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-[#061B3A] tabular-nums">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters & Bulk Toolbar */}
      <div className="rounded-2xl border border-[#D8E2EA] bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="w-full rounded-xl border border-[#D8E2EA] bg-[#F9F9FF] py-2 pl-9 pr-3 text-xs text-[#061B3A] focus:border-[#008FD3] focus:bg-white focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Published' | 'Draft')}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value="All">Status: All</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              aria-label="Filter stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'All' | 'Low' | 'Healthy')}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value="All">Stock: All</option>
              <option value="Low">Low Stock</option>
              <option value="Healthy">Healthy Stock</option>
            </select>

            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-desc' | 'stock-asc')}
              className="rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-xs font-semibold text-[#061B3A]"
            >
              <option value="newest">Sort: Default</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setAdminRoute('add-product')}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#075CA8] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004481]"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#E9F6FD] px-4 py-2.5 text-xs">
            <span className="font-semibold text-[#061B3A] tabular-nums">
              {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkAction('publish')}
                className="rounded-lg bg-[#075CA8] px-3 py-1.5 font-semibold text-white hover:bg-[#004481]"
              >
                Bulk Publish
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('draft')}
                className="rounded-lg border border-[#075CA8] bg-white px-3 py-1.5 font-semibold text-[#075CA8]"
              >
                Bulk Unpublish
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('delete')}
                className="rounded-lg border border-[#DC2626] bg-white px-3 py-1.5 font-semibold text-[#DC2626]"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Data Table */}
      <div className="overflow-hidden rounded-2xl border border-[#D8E2EA] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6EEF5] bg-[#F9F9FF] text-[11px] font-semibold uppercase tracking-wider text-[#5A6C82]">
                <th className="w-10 px-5 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all products"
                    className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                  />
                </th>
                <th className="px-4 py-3.5">Formulation</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF2F7] tabular-nums">
              {filtered.map((product) => {
                const isLow = product.stock <= product.lowStockThreshold;
                return (
                  <tr key={product.id} className="hover:bg-[#F9FBFF]">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 rounded border-[#CBD5E1] accent-[#075CA8]"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <ResilientImage
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-lg border border-[#E6EEF5] object-cover"
                        />
                        <div>
                          <p className="font-semibold text-[#061B3A]">{product.name}</p>
                          <p className="text-[11px] text-[#5A6C82]">{product.packSize}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#465970]">{product.sku}</td>
                    <td className="px-4 py-3.5 text-[#465970]">{product.category}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[#061B3A]">{formatINR(product.salePrice)}</p>
                      {product.regularPrice > product.salePrice && (
                        <p className="text-[11px] text-[#8A9BB0] line-through">
                          {formatINR(product.regularPrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-mono font-semibold ${
                          isLow ? 'text-[#B45309]' : 'text-[#061B3A]'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateProductStatus(
                            [product.id],
                            product.status === 'Published' ? 'Draft' : 'Published'
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          product.status === 'Published'
                            ? 'bg-[#E9F6FD] text-[#075CA8] hover:bg-[#D5EEFA]'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {product.status}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...product })}
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                          className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-[#E9F6FD] hover:text-[#075CA8]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateProduct(product.id)}
                          aria-label={`Duplicate ${product.name}`}
                          title="Duplicate as Draft"
                          className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-[#F3F7FB] hover:text-[#061B3A]"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProducts([product.id])}
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                          className="rounded-lg p-1.5 text-[#8A9BB0] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061B3A]/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#D8E2EA] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6EEF5] pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#061B3A]">
                  Edit Formulation
                </h3>
                <p className="text-xs text-[#5A6C82]">
                  Updates persist immediately to MySQL (`products` table)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#5A6C82] hover:bg-[#F3F7FB] hover:text-[#061B3A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Product Name</span>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">SKU</span>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 font-mono text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Category</span>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as Product['category'],
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Pack Size</span>
                  <input
                    type="text"
                    value={editingProduct.packSize}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, packSize: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Status</span>
                  <select
                    value={editingProduct.status}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        status: e.target.value as 'Published' | 'Draft',
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] bg-white px-3 py-2 text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Regular (₹)</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProduct.regularPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        regularPrice: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 font-mono text-[#061B3A]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Sale (₹)</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProduct.salePrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        salePrice: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 font-mono text-[#061B3A]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Stock</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 font-mono text-[#061B3A]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold text-[#061B3A]">Low Alert</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingProduct.lowStockThreshold}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 font-mono text-[#061B3A]"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="font-semibold text-[#061B3A]">Short Description</span>
                <textarea
                  rows={3}
                  value={editingProduct.shortDescription}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      shortDescription: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#D8E2EA] px-3 py-2 text-[#061B3A] focus:border-[#008FD3] focus:outline-none"
                />
              </label>

              <div className="flex items-center justify-end gap-2 border-t border-[#E6EEF5] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-[#D8E2EA] px-4 py-2 font-semibold text-[#465970] hover:bg-[#F3F7FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-xl bg-[#075CA8] px-5 py-2 font-semibold text-white transition hover:bg-[#004481] disabled:opacity-50"
                >
                  {editSaving ? 'Saving to MySQL...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
