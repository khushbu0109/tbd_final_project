import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

// ---------------- COUPONS ----------------
router.get('/coupons', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons/validate', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal || 0);
    const rows = await query('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1', [
      code,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    const c = rows[0];
    if (c.max_uses != null && Number(c.used_count || 0) >= Number(c.max_uses)) {
      return res.status(400).json({ error: 'Coupon redemption limit reached' });
    }
    if (subtotal < Number(c.min_order_amount)) {
      return res
        .status(400)
        .json({ error: `Minimum order of ₹${Number(c.min_order_amount)} required` });
    }
    const discountAmount =
      c.discount_type === 'percent'
        ? Math.round((subtotal * Number(c.discount_value)) / 100)
        : Math.min(subtotal, Number(c.discount_value));
    res.json({ valid: true, code: c.code, discountType: c.discount_type, discountValue: Number(c.discount_value), discountAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', requireAdminAuth, async (req, res) => {
  try {
    const {
      code,
      discount_type = 'percent',
      discount_value,
      min_order_amount = 0,
      max_uses = null,
      is_active = 1,
    } = req.body;
    const result = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(code).trim().toUpperCase(),
        discount_type === 'fixed' ? 'fixed' : 'percent',
        Number(discount_value),
        Number(min_order_amount),
        max_uses ? Number(max_uses) : null,
        is_active ? 1 : 0,
      ]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'coupon',
      entityId: result.insertId,
      details: `Created coupon ${String(code).toUpperCase()}`,
    });
    const rows = await query('SELECT * FROM coupons WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/coupons/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM coupons WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Coupon not found' });
    const cur = existing[0];
    const {
      code = cur.code,
      discount_type = cur.discount_type,
      discount_value = cur.discount_value,
      min_order_amount = cur.min_order_amount,
      max_uses = cur.max_uses,
      is_active = cur.is_active,
    } = req.body;
    await query(
      `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_order_amount = ?, max_uses = ?, is_active = ? WHERE id = ?`,
      [
        String(code).trim().toUpperCase(),
        discount_type === 'fixed' ? 'fixed' : 'percent',
        Number(discount_value),
        Number(min_order_amount),
        max_uses != null && max_uses !== '' ? Number(max_uses) : null,
        is_active ? 1 : 0,
        req.params.id,
      ]
    );
    const rows = await query('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.message });
  }
});

router.patch('/coupons/:id', requireAdminAuth, async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE coupons SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    const rows = await query('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PROMOTIONAL CAMPAIGNS ----------------
router.get('/campaigns', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT pc.*, c.code AS coupon_code
       FROM promotional_campaigns pc
       LEFT JOIN coupons c ON c.id = pc.coupon_id
       ORDER BY pc.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      channel = 'Direct Storefront',
      coupon_id = null,
      budget = 0,
      attributed_revenue = 0,
      status = 'Active',
    } = req.body;
    const result = await query(
      `INSERT INTO promotional_campaigns (name, channel, coupon_id, budget, attributed_revenue, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, channel, coupon_id ? Number(coupon_id) : null, Number(budget), Number(attributed_revenue), status]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'campaign',
      entityId: result.insertId,
      details: `Created campaign "${name}"`,
    });
    const rows = await query('SELECT * FROM promotional_campaigns WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/campaigns/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM promotional_campaigns WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Campaign not found' });
    const cur = existing[0];
    const {
      name = cur.name,
      channel = cur.channel,
      coupon_id = cur.coupon_id,
      budget = cur.budget,
      attributed_revenue = cur.attributed_revenue,
      status = cur.status,
    } = req.body;
    await query(
      `UPDATE promotional_campaigns SET name = ?, channel = ?, coupon_id = ?, budget = ?, attributed_revenue = ?, status = ? WHERE id = ?`,
      [name, channel, coupon_id ? Number(coupon_id) : null, Number(budget), Number(attributed_revenue), status, req.params.id]
    );
    const rows = await query('SELECT * FROM promotional_campaigns WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/campaigns/:id', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE promotional_campaigns SET status = ? WHERE id = ?', [status, req.params.id]);
    const rows = await query('SELECT * FROM promotional_campaigns WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/campaigns/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM promotional_campaigns WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HOMEPAGE BANNERS ----------------
router.get('/banners', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM homepage_banners ORDER BY sort_order ASC, id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/banners', requireAdminAuth, async (req, res) => {
  try {
    const {
      title,
      subtitle,
      cta_label = 'Shop Now',
      cta_target = '#shop-protocol',
      image_url = '/images/coreaa-box-1.png',
      sort_order = 1,
      is_active = 1,
    } = req.body;
    const result = await query(
      `INSERT INTO homepage_banners (title, subtitle, cta_label, cta_target, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle, cta_label, cta_target, image_url, Number(sort_order), is_active ? 1 : 0]
    );
    const rows = await query('SELECT * FROM homepage_banners WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/banners/:id', requireAdminAuth, async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE homepage_banners SET is_active = ? WHERE id = ?', [
      is_active ? 1 : 0,
      req.params.id,
    ]);
    const rows = await query('SELECT * FROM homepage_banners WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/banners/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM homepage_banners WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Banner not found' });
    const cur = existing[0];
    const {
      title = cur.title,
      subtitle = cur.subtitle,
      cta_label = cur.cta_label,
      cta_target = cur.cta_target,
      image_url = cur.image_url,
      sort_order = cur.sort_order,
      is_active = cur.is_active,
    } = req.body;
    await query(
      `UPDATE homepage_banners SET title = ?, subtitle = ?, cta_label = ?, cta_target = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?`,
      [title, subtitle, cta_label, cta_target, image_url, Number(sort_order), is_active ? 1 : 0, req.params.id]
    );
    const rows = await query('SELECT * FROM homepage_banners WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/banners/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM homepage_banners WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- NEWSLETTER SUBSCRIBERS ----------------
router.get('/newsletter', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC, id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
