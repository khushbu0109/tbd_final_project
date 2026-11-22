import express from 'express';
import { query, withTransaction } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

const VALID_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

router.get('/orders', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const orderRows =
      status && VALID_STATUSES.includes(status)
        ? await query(
            'SELECT * FROM orders WHERE fulfillment_status = ? ORDER BY created_at DESC',
            [status]
          )
        : await query('SELECT * FROM orders ORDER BY created_at DESC');

    const itemRows = await query('SELECT * FROM order_items ORDER BY id ASC');
    const itemsByOrder = new Map();
    for (const item of itemRows) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push({
        name: item.product_name,
        qty: Number(item.quantity),
        price: Number(item.line_total),
      });
    }

    const mapped = orderRows.map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerCity: o.customer_city,
      date:
        o.order_date_label ||
        new Date(o.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      amount: Number(o.total_amount),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      status: o.fulfillment_status,
      items: itemsByOrder.get(o.id) || [],
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.id);
    const rows = await query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const o = rows[0];

    const [items, payments, invoices, shipments, refunds] = await Promise.all([
      query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]),
      query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [orderId]),
      query('SELECT * FROM invoices WHERE order_id = ? LIMIT 1', [orderId]),
      query(
        `SELECT s.*, c.name AS courier_name, m.name AS shipping_method_name
         FROM shipment_tracking s
         LEFT JOIN couriers c ON c.id = s.courier_id
         LEFT JOIN shipping_methods m ON m.id = s.shipping_method_id
         WHERE s.order_id = ?
         ORDER BY s.id DESC`,
        [orderId]
      ),
      query('SELECT * FROM refunds WHERE order_id = ? ORDER BY id DESC', [orderId]),
    ]);

    res.json({
      id: o.id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerCity: o.customer_city,
      couponCode: o.coupon_code,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discount_amount),
      shippingAmount: Number(o.shipping_amount),
      amount: Number(o.total_amount),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      status: o.fulfillment_status,
      date:
        o.order_date_label ||
        new Date(o.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      createdAt: o.created_at,
      items: items.map((it) => ({
        id: it.id,
        productId: it.product_id,
        name: it.product_name,
        qty: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        price: Number(it.line_total),
        isSubscription: Boolean(it.is_subscription),
        cadenceDays: it.cadence_days,
      })),
      payments,
      invoice: invoices[0] || null,
      shipment: shipments[0] || null,
      refunds,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerCity,
      paymentMethod = 'UPI',
      totalAmount,
      subtotal = totalAmount,
      discountAmount = 0,
      shippingAmount = 0,
      couponCode = null,
      items = [],
    } = req.body;

    if (!customerName || !customerEmail || !customerCity) {
      return res.status(400).json({ error: 'Customer name, email, and city are required' });
    }

    const paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';
    const dateLabel = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const created = await withTransaction(async (txQuery) => {
      const countRows = await txQuery('SELECT COUNT(*) AS cnt FROM orders');
      const nextNum = 10493 + Number(countRows[0].cnt || 0) + Math.floor(Math.random() * 5);
      let orderId = `#TBD-${nextNum}`;
      const dupCheck = await txQuery('SELECT id FROM orders WHERE id = ? LIMIT 1', [orderId]);
      if (dupCheck.length) {
        orderId = `#TBD-${Date.now().toString().slice(-6)}`;
      }
      const invSuffix = orderId.replace('#TBD-', '');

      // Upsert customer record
      let customerId = null;
      const existingCustomer = await txQuery(
        'SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1 FOR UPDATE',
        [customerEmail.toLowerCase()]
      );
      if (existingCustomer.length) {
        customerId = existingCustomer[0].id;
        await txQuery(
          `UPDATE customers SET full_name = ?, city = ?, total_orders = total_orders + 1,
           lifetime_spend = lifetime_spend + ? WHERE id = ?`,
          [customerName, customerCity, Number(totalAmount), customerId]
        );
      } else {
        const custRes = await txQuery(
          `INSERT INTO customers (group_id, full_name, email, city, total_orders, lifetime_spend, is_subscriber)
           VALUES (3, ?, ?, ?, 1, ?, 0)`,
          [customerName, customerEmail, customerCity, Number(totalAmount)]
        );
        customerId = custRes.insertId;
      }

      await txQuery(
        `INSERT INTO orders (
          id, customer_id, customer_name, customer_email, customer_city, coupon_code,
          subtotal, discount_amount, shipping_amount, total_amount,
          payment_method, payment_status, fulfillment_status, order_date_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', ?)`,
        [
          orderId,
          customerId,
          customerName,
          customerEmail,
          customerCity,
          couponCode,
          Number(subtotal),
          Number(discountAmount),
          Number(shippingAmount),
          Number(totalAmount),
          paymentMethod,
          paymentStatus,
          dateLabel,
        ]
      );

      if (couponCode) {
        await txQuery('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = ?', [
          String(couponCode).trim().toUpperCase(),
        ]);
      }

      const mappedItems = [];
      for (const item of items) {
        const qty = Math.max(1, Number(item.qty || item.quantity || 1));
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const lineTotal = item.lineTotal != null ? Number(item.lineTotal) : unitPrice * qty;
        const productId = item.productId || null;

        await txQuery(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total, is_subscription, cadence_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            productId,
            item.name,
            qty,
            unitPrice,
            lineTotal,
            item.isSubscription ? 1 : 0,
            item.cadenceDays || null,
          ]
        );

        if (productId) {
          const prodRows = await txQuery(
            'SELECT id, sku, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
            [productId]
          );
          if (prodRows.length) {
            const prevStock = Number(prodRows[0].stock);
            const nextStock = Math.max(0, prevStock - qty);
            await txQuery('UPDATE products SET stock = ? WHERE id = ?', [nextStock, productId]);
            await txQuery(
              `INSERT INTO inventory_logs (product_id, sku, change_qty, previous_stock, new_stock, reason, actor_email)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [productId, prodRows[0].sku, nextStock - prevStock, prevStock, nextStock, `Order ${orderId}`, customerEmail]
            );
          }
        }

        mappedItems.push({ name: item.name, qty, price: lineTotal });
      }

      const payRes = await txQuery(
        `INSERT INTO payments (order_id, provider, provider_reference, method, amount, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          paymentMethod === 'COD' ? 'COD' : 'Razorpay',
          `${paymentMethod === 'COD' ? 'cod' : 'pay'}_${orderId.replace('#', '')}`,
          paymentMethod,
          Number(totalAmount),
          paymentStatus,
        ]
      );

      if (paymentStatus === 'Paid') {
        await txQuery(
          `INSERT INTO transactions (payment_id, order_id, txn_type, gateway_txn_id, amount, notes)
           VALUES (?, ?, 'Capture', ?, ?, 'Storefront checkout capture')`,
          [payRes.insertId, orderId, `txn_${Date.now()}`, Number(totalAmount)]
        );
      }

      const taxable = Number((Number(totalAmount) / 1.18).toFixed(2));
      const gst = Number((Number(totalAmount) - taxable).toFixed(2));
      await txQuery(
        `INSERT INTO invoices (invoice_number, order_id, taxable_value, gst_amount, grand_total)
         VALUES (?, ?, ?, ?, ?)`,
        [`INV-2025-${invSuffix}`, orderId, taxable, gst, Number(totalAmount)]
      );

      await txQuery(
        `INSERT INTO shipment_tracking (order_id, courier_id, shipping_method_id, awb_number, current_status, last_location)
         VALUES (?, 1, 1, ?, 'Label Created', 'Haridwar Cold-Chain Dispatch')`,
        [orderId, `BD${invSuffix}IN`]
      );

      return {
        id: orderId,
        customerName,
        customerEmail,
        customerCity,
        date: dateLabel,
        amount: Number(totalAmount),
        paymentMethod,
        paymentStatus,
        status: 'Processing',
        items: mappedItems,
      };
    });

    await logActivity({
      actorName: customerName,
      actorEmail: customerEmail,
      actionType: 'ORDER_PLACED',
      entityType: 'order',
      entityId: created.id,
      details: `Placed storefront order ${created.id} for ₹${totalAmount}`,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /api/orders]', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/orders/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.id);
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid fulfillment status' });
    }
    const actor = getActor(req);

    await withTransaction(async (txQuery) => {
      const existing = await txQuery(
        'SELECT id, fulfillment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
        [orderId]
      );
      if (!existing.length) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
      }
      const prevStatus = existing[0].fulfillment_status;
      await txQuery('UPDATE orders SET fulfillment_status = ? WHERE id = ?', [status, orderId]);

      if (status === 'Shipped') {
        await txQuery(
          "UPDATE shipment_tracking SET current_status = 'In Transit', last_location = 'Regional Cold-Chain Hub' WHERE order_id = ?",
          [orderId]
        );
      } else if (status === 'Delivered') {
        await txQuery(
          "UPDATE shipment_tracking SET current_status = 'Delivered', last_location = 'Delivered to Customer' WHERE order_id = ?",
          [orderId]
        );
      } else if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
        const items = await txQuery(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL',
          [orderId]
        );
        for (const it of items) {
          const prodRows = await txQuery(
            'SELECT id, sku, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
            [it.product_id]
          );
          if (prodRows.length) {
            const prevStock = Number(prodRows[0].stock);
            const qty = Number(it.quantity || 0);
            const nextStock = prevStock + qty;
            await txQuery('UPDATE products SET stock = ? WHERE id = ?', [nextStock, it.product_id]);
            await txQuery(
              `INSERT INTO inventory_logs (product_id, sku, change_qty, previous_stock, new_stock, reason, actor_email)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [it.product_id, prodRows[0].sku, qty, prevStock, nextStock, `Restock from cancelled ${orderId}`, actor.actorEmail]
            );
          }
        }
      }
    });

    await logActivity({
      ...actor,
      actionType: 'UPDATE',
      entityType: 'order',
      entityId: orderId,
      details: `Updated order ${orderId} fulfillment status to ${status}`,
    });
    res.json({ id: orderId, status });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/orders/:id', requireAdminAuth, async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.id);
    await withTransaction(async (txQuery) => {
      const existing = await txQuery('SELECT id FROM orders WHERE id = ? LIMIT 1', [orderId]);
      if (!existing.length) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
      }
      await txQuery('DELETE FROM refunds WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM transactions WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM payments WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM invoices WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM shipment_tracking WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await txQuery('DELETE FROM orders WHERE id = ?', [orderId]);
    });
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'order',
      entityId: orderId,
      details: `Deleted order ${orderId}`,
    });
    res.json({ deleted: true, id: orderId });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ---------------- RETURNS & REFUNDS ----------------
router.get('/returns', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT r.*, o.customer_name, o.customer_email, o.payment_method, o.fulfillment_status
       FROM refunds r
       LEFT JOIN orders o ON o.id = r.order_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/returns', requireAdminAuth, async (req, res) => {
  try {
    const { order_id, amount, reason, status = 'Requested' } = req.body;
    const created = await withTransaction(async (txQuery) => {
      const payRows = await txQuery('SELECT id FROM payments WHERE order_id = ? LIMIT 1', [order_id]);
      const paymentId = payRows.length ? payRows[0].id : null;
      const result = await txQuery(
        'INSERT INTO refunds (order_id, payment_id, amount, reason, status) VALUES (?, ?, ?, ?, ?)',
        [order_id, paymentId, Number(amount), reason, status]
      );
      if (status === 'Processed') {
        await txQuery(
          "UPDATE orders SET payment_status = 'Refunded', fulfillment_status = 'Cancelled' WHERE id = ?",
          [order_id]
        );
        await txQuery("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [order_id]);
        await txQuery(
          `INSERT INTO transactions (payment_id, order_id, txn_type, gateway_txn_id, amount, notes)
           VALUES (?, ?, 'Refund', ?, ?, ?)`,
          [paymentId, order_id, `rfd_${Date.now()}`, Number(amount), reason]
        );
      }
      const rows = await txQuery(
        `SELECT r.*, o.customer_name FROM refunds r LEFT JOIN orders o ON o.id = r.order_id WHERE r.id = ?`,
        [result.insertId]
      );
      return rows[0];
    });

    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'refund',
      entityId: created.id,
      details: `Logged return/refund for ${order_id} (₹${amount}, ${status})`,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/returns/:id', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await withTransaction(async (txQuery) => {
      const existing = await txQuery('SELECT * FROM refunds WHERE id = ? LIMIT 1 FOR UPDATE', [
        req.params.id,
      ]);
      if (!existing.length) {
        const err = new Error('Refund record not found');
        err.status = 404;
        throw err;
      }
      const prev = existing[0];
      await txQuery('UPDATE refunds SET status = ? WHERE id = ?', [status, req.params.id]);
      if (status === 'Processed' && prev.status !== 'Processed') {
        await txQuery("UPDATE orders SET payment_status = 'Refunded' WHERE id = ?", [prev.order_id]);
        await txQuery("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [prev.order_id]);
        await txQuery(
          `INSERT INTO transactions (payment_id, order_id, txn_type, gateway_txn_id, amount, notes)
           VALUES (?, ?, 'Refund', ?, ?, ?)`,
          [prev.payment_id, prev.order_id, `rfd_${Date.now()}`, Number(prev.amount), prev.reason || 'Refund processed']
        );
      }
      const rows = await txQuery('SELECT * FROM refunds WHERE id = ?', [req.params.id]);
      return rows[0];
    });
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/returns/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM refunds WHERE id = ?', [req.params.id]);
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'refund',
      entityId: req.params.id,
      details: `Deleted return/refund #${req.params.id}`,
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
