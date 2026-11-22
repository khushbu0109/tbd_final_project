import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

router.get('/customers', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, g.group_name, g.discount_percent
       FROM customers c
       LEFT JOIN customer_groups g ON g.id = c.group_id
       ORDER BY c.lifetime_spend DESC, c.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, g.group_name, g.discount_percent
       FROM customers c
       LEFT JOIN customer_groups g ON g.id = c.group_id
       WHERE c.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    const orders = await query(
      'SELECT id, total_amount, payment_method, payment_status, fulfillment_status, order_date_label, created_at FROM orders WHERE customer_id = ? OR LOWER(customer_email) = LOWER(?) ORDER BY created_at DESC',
      [rows[0].id, rows[0].email]
    );
    res.json({ ...rows[0], orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', requireAdminAuth, async (req, res) => {
  try {
    const {
      group_id = 3,
      full_name,
      email,
      phone = '',
      city = '',
      state = '',
      is_subscriber = 0,
    } = req.body;
    const result = await query(
      `INSERT INTO customers (group_id, full_name, email, phone, city, state, is_subscriber)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [group_id ? Number(group_id) : null, full_name, email, phone, city, state, is_subscriber ? 1 : 0]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'customer',
      entityId: result.insertId,
      details: `Added customer ${full_name} (${email})`,
    });
    const rows = await query(
      `SELECT c.*, g.group_name FROM customers c LEFT JOIN customer_groups g ON g.id = c.group_id WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', requireAdminAuth, async (req, res) => {
  try {
    const { group_id, full_name, phone, city, state, is_subscriber } = req.body;
    await query(
      `UPDATE customers SET group_id = ?, full_name = ?, phone = ?, city = ?, state = ?, is_subscriber = ?
       WHERE id = ?`,
      [
        group_id ? Number(group_id) : null,
        full_name,
        phone || '',
        city || '',
        state || '',
        is_subscriber ? 1 : 0,
        req.params.id,
      ]
    );
    const rows = await query(
      `SELECT c.*, g.group_name FROM customers c LEFT JOIN customer_groups g ON g.id = c.group_id WHERE c.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customers/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CUSTOMER GROUPS ----------------
router.get('/customer-groups', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT g.*, COUNT(c.id) AS member_count, COALESCE(SUM(c.lifetime_spend), 0) AS group_spend
       FROM customer_groups g
       LEFT JOIN customers c ON c.group_id = g.id
       GROUP BY g.id
       ORDER BY g.id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customer-groups', requireAdminAuth, async (req, res) => {
  try {
    const { group_name, discount_percent = 0, description = '' } = req.body;
    const result = await query(
      'INSERT INTO customer_groups (group_name, discount_percent, description) VALUES (?, ?, ?)',
      [group_name, Number(discount_percent), description]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'customer_group',
      entityId: result.insertId,
      details: `Created customer group "${group_name}" (${discount_percent}% off)`,
    });
    const rows = await query('SELECT * FROM customer_groups WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customer-groups/:id', requireAdminAuth, async (req, res) => {
  try {
    const { group_name, discount_percent = 0, description = '' } = req.body;
    await query(
      'UPDATE customer_groups SET group_name = ?, discount_percent = ?, description = ? WHERE id = ?',
      [group_name, Number(discount_percent), description, req.params.id]
    );
    const rows = await query('SELECT * FROM customer_groups WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Customer group not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customer-groups/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM customer_groups WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
