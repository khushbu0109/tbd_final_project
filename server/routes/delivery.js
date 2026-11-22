import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

// ---------------- SHIPPING METHODS ----------------
router.get('/shipping-methods', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM shipping_methods ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shipping-methods', requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      code,
      rate = 0,
      free_above = 1000,
      estimated_days = '2-4 Business Days',
      is_active = 1,
    } = req.body;
    const result = await query(
      `INSERT INTO shipping_methods (name, code, rate, free_above, estimated_days, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, String(code).toUpperCase(), Number(rate), Number(free_above), estimated_days, is_active ? 1 : 0]
    );
    const rows = await query('SELECT * FROM shipping_methods WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/shipping-methods/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM shipping_methods WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Shipping method not found' });
    const cur = existing[0];
    const {
      name = cur.name,
      code = cur.code,
      rate = cur.rate,
      free_above = cur.free_above,
      estimated_days = cur.estimated_days,
      is_active = cur.is_active,
    } = req.body;
    await query(
      `UPDATE shipping_methods SET name = ?, code = ?, rate = ?, free_above = ?, estimated_days = ?, is_active = ? WHERE id = ?`,
      [name, String(code).toUpperCase(), Number(rate), Number(free_above), estimated_days, is_active ? 1 : 0, req.params.id]
    );
    const rows = await query('SELECT * FROM shipping_methods WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/shipping-methods/:id', requireAdminAuth, async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE shipping_methods SET is_active = ? WHERE id = ?', [
      is_active ? 1 : 0,
      req.params.id,
    ]);
    const rows = await query('SELECT * FROM shipping_methods WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shipping-methods/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM shipping_methods WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- COURIERS ----------------
router.get('/couriers', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM couriers ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/couriers', requireAdminAuth, async (req, res) => {
  try {
    const { name, tracking_url_template, cold_chain_supported = 1, is_active = 1 } = req.body;
    const result = await query(
      'INSERT INTO couriers (name, tracking_url_template, cold_chain_supported, is_active) VALUES (?, ?, ?, ?)',
      [name, tracking_url_template, cold_chain_supported ? 1 : 0, is_active ? 1 : 0]
    );
    const rows = await query('SELECT * FROM couriers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/couriers/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM couriers WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Courier not found' });
    const cur = existing[0];
    const {
      name = cur.name,
      tracking_url_template = cur.tracking_url_template,
      cold_chain_supported = cur.cold_chain_supported,
      is_active = cur.is_active,
    } = req.body;
    await query(
      'UPDATE couriers SET name = ?, tracking_url_template = ?, cold_chain_supported = ?, is_active = ? WHERE id = ?',
      [name, tracking_url_template, cold_chain_supported ? 1 : 0, is_active ? 1 : 0, req.params.id]
    );
    const rows = await query('SELECT * FROM couriers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/couriers/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM couriers WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SHIPMENT TRACKING ----------------
router.get('/shipments', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT s.*, c.name AS courier_name, c.tracking_url_template,
              m.name AS shipping_method_name, o.customer_name, o.customer_city
       FROM shipment_tracking s
       LEFT JOIN couriers c ON c.id = s.courier_id
       LEFT JOIN shipping_methods m ON m.id = s.shipping_method_id
       LEFT JOIN orders o ON o.id = s.order_id
       ORDER BY s.updated_at DESC, s.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shipments', requireAdminAuth, async (req, res) => {
  try {
    const {
      order_id,
      courier_id = 1,
      shipping_method_id = 1,
      awb_number,
      current_status = 'Label Created',
      last_location = 'Haridwar Dispatch Facility',
    } = req.body;
    const result = await query(
      `INSERT INTO shipment_tracking (order_id, courier_id, shipping_method_id, awb_number, current_status, last_location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, Number(courier_id), Number(shipping_method_id), awb_number, current_status, last_location]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'shipment',
      entityId: result.insertId,
      details: `Assigned AWB ${awb_number} to ${order_id}`,
    });
    const rows = await query('SELECT * FROM shipment_tracking WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/shipments/:id', requireAdminAuth, async (req, res) => {
  try {
    const { current_status, last_location } = req.body;
    await query(
      'UPDATE shipment_tracking SET current_status = ?, last_location = COALESCE(?, last_location) WHERE id = ?',
      [current_status, last_location ?? null, req.params.id]
    );
    const rows = await query('SELECT * FROM shipment_tracking WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shipments/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM shipment_tracking WHERE id = ?', [req.params.id]);
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'shipment',
      entityId: req.params.id,
      details: `Deleted shipment tracking #${req.params.id}`,
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
