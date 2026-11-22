import express from 'express';
import { query, withTransaction } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

function parseJsonSafe(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapProductRow(r) {
  const created = r.created_at
    ? new Date(r.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';
  return {
    id: r.id,
    sku: r.sku,
    categoryId: r.category_id,
    name: r.name,
    subtitle: r.subtitle || '',
    slug: r.slug,
    category: r.category_name || 'Daily Vitality',
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    regularPrice: Number(r.regular_price),
    salePrice: Number(r.sale_price),
    costPrice: Number(r.cost_price || 0),
    subscriptionPrice: r.subscription_price != null ? Number(r.subscription_price) : undefined,
    stock: Number(r.stock),
    lowStockThreshold: Number(r.low_stock_threshold),
    status: r.status,
    rating: Number(r.rating || 4.9),
    reviewCount: Number(r.review_count || 0),
    image: r.image_url,
    gallery: parseJsonSafe(r.gallery_json, [r.image_url]),
    packSize: r.pack_size,
    dosageNote: r.dosage_note || '',
    keyActives: parseJsonSafe(r.key_actives_json, []),
    biomarkers: parseJsonSafe(r.biomarkers_json, []),
    clinicalCertified: Boolean(r.clinical_certified),
    createdAt: created,
    featuredTag: r.featured_tag || undefined,
  };
}

// ---------------- PRODUCTS ----------------
router.get('/products', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows.map(mapProductRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? OR p.slug = ?
       LIMIT 1`,
      [req.params.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    const product = mapProductRow(rows[0]);
    const variants = await query(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY is_default DESC, id ASC',
      [product.id]
    );
    res.json({ ...product, variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Product not found' });
    const cur = existing[0];
    const p = req.body;

    let categoryId = cur.category_id;
    if (p.categoryId != null) {
      categoryId = Number(p.categoryId);
    } else if (p.category) {
      const catRows = await query('SELECT id FROM categories WHERE name = ? LIMIT 1', [p.category]);
      if (catRows.length) categoryId = catRows[0].id;
    }

    await query(
      `UPDATE products SET
        sku = ?, category_id = ?, name = ?, subtitle = ?, slug = ?,
        short_description = ?, full_description = ?,
        regular_price = ?, sale_price = ?, cost_price = ?, subscription_price = ?,
        stock = ?, low_stock_threshold = ?, status = ?,
        image_url = ?, gallery_json = ?, pack_size = ?, dosage_note = ?,
        key_actives_json = ?, biomarkers_json = ?, clinical_certified = ?, featured_tag = ?
       WHERE id = ?`,
      [
        p.sku ?? cur.sku,
        categoryId,
        p.name ?? cur.name,
        p.subtitle ?? cur.subtitle,
        p.slug ?? cur.slug,
        p.shortDescription ?? cur.short_description,
        p.fullDescription ?? cur.full_description,
        p.regularPrice != null ? Number(p.regularPrice) : Number(cur.regular_price),
        p.salePrice != null ? Number(p.salePrice) : Number(cur.sale_price),
        p.costPrice != null ? Number(p.costPrice) : Number(cur.cost_price),
        p.subscriptionPrice !== undefined
          ? p.subscriptionPrice == null || p.subscriptionPrice === ''
            ? null
            : Number(p.subscriptionPrice)
          : cur.subscription_price,
        p.stock != null ? Math.max(0, Number(p.stock)) : Number(cur.stock),
        p.lowStockThreshold != null ? Number(p.lowStockThreshold) : Number(cur.low_stock_threshold),
        p.status ? (p.status === 'Draft' ? 'Draft' : 'Published') : cur.status,
        p.image ?? cur.image_url,
        p.gallery ? JSON.stringify(p.gallery) : typeof cur.gallery_json === 'string' ? cur.gallery_json : JSON.stringify(cur.gallery_json || []),
        p.packSize ?? cur.pack_size,
        p.dosageNote ?? cur.dosage_note,
        p.keyActives ? JSON.stringify(p.keyActives) : typeof cur.key_actives_json === 'string' ? cur.key_actives_json : JSON.stringify(cur.key_actives_json || []),
        p.biomarkers ? JSON.stringify(p.biomarkers) : typeof cur.biomarkers_json === 'string' ? cur.biomarkers_json : JSON.stringify(cur.biomarkers_json || []),
        p.clinicalCertified !== undefined ? (p.clinicalCertified ? 1 : 0) : cur.clinical_certified,
        p.featuredTag !== undefined ? p.featuredTag || null : cur.featured_tag,
        req.params.id,
      ]
    );

    const updatedRows = await query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
      [req.params.id]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'UPDATE',
      entityType: 'product',
      entityId: req.params.id,
      details: `Updated product "${updatedRows[0].name}" (${updatedRows[0].sku})`,
    });
    res.json(mapProductRow(updatedRows[0]));
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.message });
  }
});

router.post('/products', requireAdminAuth, async (req, res) => {
  try {
    const p = req.body;
    const catRows = await query('SELECT id FROM categories WHERE name = ? LIMIT 1', [
      p.category || 'Daily Vitality',
    ]);
    const categoryId = catRows.length ? catRows[0].id : 1;
    const id = p.id || `${(p.slug || 'product').slice(0, 45)}-${Date.now()}`;
    const slug = p.slug || id;

    await query(
      `INSERT INTO products (
        id, sku, category_id, name, subtitle, slug, short_description, full_description,
        regular_price, sale_price, cost_price, subscription_price, stock, low_stock_threshold,
        status, rating, review_count, image_url, gallery_json, pack_size, dosage_note,
        key_actives_json, biomarkers_json, clinical_certified, featured_tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        p.sku,
        categoryId,
        p.name,
        p.subtitle || '',
        slug,
        p.shortDescription || '',
        p.fullDescription || '',
        Number(p.regularPrice || 0),
        Number(p.salePrice || 0),
        Number(p.costPrice || 0),
        p.subscriptionPrice != null ? Number(p.subscriptionPrice) : null,
        Number(p.stock || 0),
        Number(p.lowStockThreshold || 20),
        p.status === 'Draft' ? 'Draft' : 'Published',
        Number(p.rating || 4.9),
        Number(p.reviewCount || 0),
        p.image || '/images/coreaa-box-1.png',
        JSON.stringify(p.gallery || [p.image || '/images/coreaa-box-1.png']),
        p.packSize || '1 × 10 Coated Tablets',
        p.dosageNote || '',
        JSON.stringify(p.keyActives || []),
        JSON.stringify(p.biomarkers || []),
        p.clinicalCertified === false ? 0 : 1,
        p.featuredTag || null,
      ]
    );

    const createdRows = await query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
      [id]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'product',
      entityId: id,
      details: `Created product "${p.name}" (${p.sku})`,
    });
    res.status(201).json(mapProductRow(createdRows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/products/bulk-status', requireAdminAuth, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'Product IDs required' });
    }
    const safeStatus = status === 'Draft' ? 'Draft' : 'Published';
    const placeholders = ids.map(() => '?').join(',');
    await query(`UPDATE products SET status = ? WHERE id IN (${placeholders})`, [
      safeStatus,
      ...ids,
    ]);
    await logActivity({
      ...getActor(req),
      actionType: 'BULK_UPDATE',
      entityType: 'product',
      entityId: ids.join(','),
      details: `Updated ${ids.length} product(s) to ${safeStatus}`,
    });
    res.json({ updated: ids.length, status: safeStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/duplicate', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    const src = rows[0];
    const ts = Date.now();
    const newId = `${src.id.slice(0, 50)}-copy-${ts}`;
    const newSku = `${src.sku.slice(0, 40)}-${String(ts).slice(-4)}`;
    const newSlug = `${src.slug.slice(0, 120)}-copy-${String(ts).slice(-4)}`;

    await query(
      `INSERT INTO products (
        id, sku, category_id, name, subtitle, slug, short_description, full_description,
        regular_price, sale_price, cost_price, subscription_price, stock, low_stock_threshold,
        status, rating, review_count, image_url, gallery_json, pack_size, dosage_note,
        key_actives_json, biomarkers_json, clinical_certified, featured_tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        newSku,
        src.category_id,
        `${src.name} (Copy)`,
        src.subtitle,
        newSlug,
        src.short_description,
        src.full_description,
        src.regular_price,
        src.sale_price,
        src.cost_price,
        src.subscription_price,
        src.stock,
        src.low_stock_threshold,
        src.rating,
        src.image_url,
        typeof src.gallery_json === 'string' ? src.gallery_json : JSON.stringify(src.gallery_json || []),
        src.pack_size,
        src.dosage_note,
        typeof src.key_actives_json === 'string'
          ? src.key_actives_json
          : JSON.stringify(src.key_actives_json || []),
        typeof src.biomarkers_json === 'string'
          ? src.biomarkers_json
          : JSON.stringify(src.biomarkers_json || []),
        src.clinical_certified,
        src.featured_tag,
      ]
    );
    const created = await query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
      [newId]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'DUPLICATE',
      entityType: 'product',
      entityId: newId,
      details: `Duplicated "${src.name}" as Draft`,
    });
    res.status(201).json(mapProductRow(created[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/bulk-delete', requireAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'Product IDs required' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'product',
      entityId: ids.join(','),
      details: `Deleted ${ids.length} product(s)`,
    });
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CATEGORIES ----------------
router.get('/categories', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAdminAuth, async (req, res) => {
  try {
    const { name, slug, description = '', sort_order = 0, is_active = 1 } = req.body;
    const finalSlug =
      slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      'INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, finalSlug, description, Number(sort_order), is_active ? 1 : 0]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'category',
      entityId: result.insertId,
      details: `Created category "${name}"`,
    });
    const rows = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    const { name, slug, description = '', sort_order = 0, is_active = 1 } = req.body;
    await query(
      'UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, slug, description, Number(sort_order), is_active ? 1 : 0, req.params.id]
    );
    const rows = await query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(400).json({ error: 'Cannot delete category with assigned products', detail: err.message });
  }
});

// ---------------- PRODUCT VARIANTS ----------------
router.get('/variants', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT v.*, p.name AS product_name, p.sku AS product_sku
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       ORDER BY v.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/variants', requireAdminAuth, async (req, res) => {
  try {
    const {
      product_id,
      variant_sku,
      variant_label,
      cadence_days = null,
      unit_price,
      compare_at_price = null,
      stock = 50,
      is_default = 0,
    } = req.body;
    const result = await query(
      `INSERT INTO product_variants (product_id, variant_sku, variant_label, cadence_days, unit_price, compare_at_price, stock, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        variant_sku,
        variant_label,
        cadence_days ? Number(cadence_days) : null,
        Number(unit_price),
        compare_at_price ? Number(compare_at_price) : null,
        Number(stock),
        is_default ? 1 : 0,
      ]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'variant',
      entityId: result.insertId,
      details: `Added variant "${variant_label}" (${variant_sku})`,
    });
    const rows = await query(
      `SELECT v.*, p.name AS product_name FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/variants/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM product_variants WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Variant not found' });
    const cur = existing[0];
    const {
      variant_sku = cur.variant_sku,
      variant_label = cur.variant_label,
      cadence_days = cur.cadence_days,
      unit_price = cur.unit_price,
      compare_at_price = cur.compare_at_price,
      stock = cur.stock,
      is_default = cur.is_default,
    } = req.body;
    await query(
      `UPDATE product_variants
       SET variant_sku = ?, variant_label = ?, cadence_days = ?, unit_price = ?, compare_at_price = ?, stock = ?, is_default = ?
       WHERE id = ?`,
      [
        variant_sku,
        variant_label,
        cadence_days ? Number(cadence_days) : null,
        Number(unit_price),
        compare_at_price ? Number(compare_at_price) : null,
        Math.max(0, Number(stock)),
        is_default ? 1 : 0,
        req.params.id,
      ]
    );
    const rows = await query(
      `SELECT v.*, p.name AS product_name FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.message });
  }
});

router.delete('/variants/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM product_variants WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- INVENTORY MANAGEMENT ----------------
router.get('/inventory', requireAdminAuth, async (_req, res) => {
  try {
    const items = await query(
      `SELECT p.id, p.sku, p.name, p.pack_size, p.stock, p.low_stock_threshold,
              p.cost_price, p.sale_price, p.status, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY (p.stock <= p.low_stock_threshold) DESC, p.stock ASC`
    );
    const logs = await query(
      `SELECT l.*, p.name AS product_name
       FROM inventory_logs l
       LEFT JOIN products p ON p.id = l.product_id
       ORDER BY l.created_at DESC LIMIT 50`
    );
    res.json({ items, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/adjust', requireAdminAuth, async (req, res) => {
  try {
    const { product_id, change_qty, new_stock, low_stock_threshold, reason = 'Manual adjustment' } =
      req.body;
    const actor = getActor(req);

    const outcome = await withTransaction(async (txQuery) => {
      const rows = await txQuery(
        'SELECT id, sku, name, stock, low_stock_threshold FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );
      if (!rows.length) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
      }
      const prod = rows[0];
      const prevStock = Number(prod.stock);
      const targetStock =
        new_stock != null
          ? Math.max(0, Number(new_stock))
          : Math.max(0, prevStock + Number(change_qty || 0));
      const delta = targetStock - prevStock;
      const nextThreshold =
        low_stock_threshold != null ? Number(low_stock_threshold) : Number(prod.low_stock_threshold);

      await txQuery('UPDATE products SET stock = ?, low_stock_threshold = ? WHERE id = ?', [
        targetStock,
        nextThreshold,
        product_id,
      ]);

      await txQuery(
        `INSERT INTO inventory_logs (product_id, sku, change_qty, previous_stock, new_stock, reason, actor_email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product_id, prod.sku, delta, prevStock, targetStock, reason, actor.actorEmail]
      );

      return { id: product_id, sku: prod.sku, previousStock: prevStock, newStock: targetStock, delta };
    });

    await logActivity({
      ...actor,
      actionType: 'STOCK_ADJUST',
      entityType: 'inventory',
      entityId: product_id,
      details: `Adjusted ${outcome.sku} stock ${outcome.previousStock} -> ${outcome.newStock} (${reason})`,
    });

    res.json({
      id: outcome.id,
      previousStock: outcome.previousStock,
      newStock: outcome.newStock,
      delta: outcome.delta,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
