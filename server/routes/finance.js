import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';
import { buildEnrichedOrderDetail } from './sales.js';

const router = express.Router();

router.get('/payments', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, o.customer_name, o.customer_email, o.fulfillment_status
       FROM payments p
       LEFT JOIN orders o ON o.id = p.order_id
       ORDER BY p.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/payments/:id', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE payments SET status = ? WHERE id = ?', [status, req.params.id]);
    const rows = await query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (rows.length) {
      await query('UPDATE orders SET payment_status = ? WHERE id = ?', [status, rows[0].order_id]);
    }
    await logActivity({
      ...getActor(req),
      actionType: 'UPDATE',
      entityType: 'payment',
      entityId: req.params.id,
      details: `Updated payment #${req.params.id} status to ${status}`,
    });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT t.*, o.customer_name, p.method AS payment_method
       FROM transactions t
       LEFT JOIN orders o ON o.id = t.order_id
       LEFT JOIN payments p ON p.id = t.payment_id
       ORDER BY t.created_at DESC, t.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transactions', requireAdminAuth, async (req, res) => {
  try {
    const { order_id, txn_type = 'Settlement', gateway_txn_id, amount, notes = '' } = req.body;
    const result = await query(
      `INSERT INTO transactions (order_id, txn_type, gateway_txn_id, amount, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, txn_type, gateway_txn_id || `txn_${Date.now()}`, Number(amount), notes]
    );
    const rows = await query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/transactions/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'transaction',
      entityId: req.params.id,
      details: `Deleted transaction #${req.params.id}`,
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT i.*, o.customer_name, o.customer_email, o.customer_city, o.payment_status
       FROM invoices i
       LEFT JOIN orders o ON o.id = i.order_id
       ORDER BY i.issued_at DESC, i.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices/:id', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT i.id, i.invoice_number, i.order_id
       FROM invoices i
       WHERE i.id = ? OR i.invoice_number = ? OR i.order_id = ?
       LIMIT 1`,
      [req.params.id, req.params.id, decodeURIComponent(req.params.id)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    const detail = await buildEnrichedOrderDetail(rows[0].order_id);
    if (!detail) return res.status(404).json({ error: 'Order for invoice not found' });
    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/refund-history', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT r.*, o.customer_name, o.customer_email, o.payment_method, p.provider_reference
       FROM refunds r
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN payments p ON p.id = r.payment_id
       ORDER BY r.created_at DESC, r.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
