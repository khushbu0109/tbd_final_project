import express from 'express';
import { query, withTransaction } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

const VALID_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export async function buildEnrichedOrderDetail(orderId) {
  const rows = await query(
    `SELECT o.*, c.phone AS customer_profile_phone, c.state AS customer_profile_state
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ? LIMIT 1`,
    [orderId]
  );
  if (!rows.length) return null;
  const o = rows[0];

  const [rawItems, payments, invoices, shipments, refunds, settingsRows] = await Promise.all([
    query(
      `SELECT oi.*, p.sku AS prod_sku, p.image_url AS prod_image, p.regular_price AS prod_regular_price, p.pack_size AS prod_pack_size
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderId]
    ),
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
    query('SELECT setting_key, setting_value FROM store_settings'),
  ]);

  const settings = {};
  for (const s of settingsRows) {
    settings[s.setting_key] = s.setting_value;
  }

  const items = rawItems.map((it) => {
    const qty = Math.max(1, Number(it.quantity || 1));
    const unitPrice = Number(it.unit_price || 0);
    const lineTotal = Number(it.line_total != null ? it.line_total : unitPrice * qty);
    const rawOriginal =
      it.original_unit_price != null
        ? Number(it.original_unit_price)
        : it.prod_regular_price != null && Number(it.prod_regular_price) >= unitPrice
        ? Number(it.prod_regular_price)
        : unitPrice;
    const originalUnitPrice = Math.max(unitPrice, rawOriginal);
    const computedDiscount = Math.max(0, Number(((originalUnitPrice - unitPrice) * qty).toFixed(2)));
    const itemDiscount =
      it.discount_amount != null && Number(it.discount_amount) > 0
        ? Number(it.discount_amount)
        : computedDiscount;

    return {
      id: it.id,
      productId: it.product_id,
      sku: it.sku || it.prod_sku || 'TBD-FORM',
      name: it.product_name,
      packSize: it.prod_pack_size || null,
      image: it.product_image || it.prod_image || null,
      qty,
      originalUnitPrice,
      discountAmount: itemDiscount,
      unitPrice,
      price: lineTotal,
      isSubscription: Boolean(it.is_subscription),
      cadenceDays: it.cadence_days,
    };
  });

  const computedOriginalSubtotal = Number(
    items.reduce((acc, it) => acc + it.originalUnitPrice * it.qty, 0).toFixed(2)
  );
  const computedLineSubtotal = Number(
    items.reduce((acc, it) => acc + it.price, 0).toFixed(2)
  );
  const computedProductDiscount = Number(
    items.reduce((acc, it) => acc + it.discountAmount, 0).toFixed(2)
  );

  const originalSubtotal =
    o.original_subtotal != null && Number(o.original_subtotal) > 0
      ? Number(o.original_subtotal)
      : computedOriginalSubtotal > 0
      ? computedOriginalSubtotal
      : Number(o.subtotal || o.total_amount);

  const productDiscount =
    o.product_discount != null && Number(o.product_discount) > 0
      ? Number(o.product_discount)
      : computedProductDiscount;

  const subtotalAfterProductDiscount =
    Number(o.subtotal || 0) > 0 ? Number(o.subtotal) : computedLineSubtotal || Number(o.total_amount);
  const couponDiscount = Number(o.discount_amount || 0);
  const shippingAmount = Number(o.shipping_amount || 0);
  const otherCharges = Number(o.other_charges || 0);
  const grandTotal = Number(o.total_amount || 0);

  const inv = invoices[0] || null;
  const taxableAmount = inv
    ? Number(inv.taxable_value)
    : Number((grandTotal / 1.18).toFixed(2));
  const gstAmount = inv
    ? Number(inv.gst_amount)
    : Number((grandTotal - taxableAmount).toFixed(2));
  const totalSavings = Number((productDiscount + couponDiscount).toFixed(2));
  const amountPaid = o.payment_status === 'Paid' ? grandTotal : 0;
  const balanceDue =
    o.payment_status === 'Paid' || o.payment_status === 'Refunded'
      ? 0
      : Number(Math.max(0, grandTotal - amountPaid).toFixed(2));

  const latestPayment = payments[0] || null;
  const transactionId =
    o.razorpay_payment_id ||
    latestPayment?.razorpay_payment_id ||
    latestPayment?.provider_reference ||
    null;
  const razorpayOrderId = o.razorpay_order_id || latestPayment?.razorpay_order_id || null;

  const invoiceNumber =
    inv?.invoice_number || `INV-${String(o.id).replace(/[^A-Z0-9]/gi, '')}`;
  const invoiceDate = inv?.issued_at
    ? new Date(inv.issued_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : o.order_date_label ||
      new Date(o.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return {
    id: o.id,
    invoiceNumber,
    invoiceDate,
    customerId: o.customer_id,
    customerName: o.customer_name,
    customerEmail: o.customer_email,
    customerPhone: o.customer_phone || o.customer_profile_phone || null,
    customerCity: o.customer_city,
    billingAddress: o.billing_address || `${o.customer_city}, India`,
    shippingAddress: o.shipping_address || o.billing_address || `${o.customer_city}, India`,
    orderNotes: o.order_notes || null,
    couponCode: o.coupon_code || null,
    originalSubtotal,
    productDiscount,
    subtotal: subtotalAfterProductDiscount,
    discountAmount: couponDiscount,
    shippingAmount,
    otherCharges,
    taxableAmount,
    gstAmount,
    totalSavings,
    amount: grandTotal,
    amountPaid,
    balanceDue,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    status: o.fulfillment_status,
    razorpayOrderId,
    razorpayPaymentId: transactionId,
    date:
      o.order_date_label ||
      new Date(o.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    createdAt: o.created_at,
    items,
    payments,
    invoice: inv,
    shipment: shipments[0] || null,
    refunds,
    company: {
      name: settings.store_name || 'TBD Wellness Pvt. Ltd.',
      email: settings.support_email || 'care@tbdwellness.com',
      phone: settings.support_phone || '+91 1800-120-8230',
      address:
        settings.warehouse_address ||
        'Plot 14, Clinical Nutraceutical Park, SIDCUL, Haridwar, Uttarakhand 249403, India',
      gstin: settings.gstin || '05AABCT4829K1Z4',
      website: settings.store_url || 'www.tbdwellness.com',
    },
  };
}

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
        sku: item.sku || undefined,
        image: item.product_image || undefined,
        originalUnitPrice: item.original_unit_price != null ? Number(item.original_unit_price) : undefined,
        unitPrice: Number(item.unit_price),
        discountAmount: Number(item.discount_amount || 0),
      });
    }

    const mapped = orderRows.map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone || undefined,
      customerCity: o.customer_city,
      billingAddress: o.billing_address || undefined,
      shippingAddress: o.shipping_address || undefined,
      orderNotes: o.order_notes || undefined,
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
      razorpayOrderId: o.razorpay_order_id || undefined,
      razorpayPaymentId: o.razorpay_payment_id || undefined,
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
    const detail = await buildEnrichedOrderDetail(orderId);
    if (!detail) return res.status(404).json({ error: 'Order not found' });
    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storefront customer invoice lookup (requires matching email or razorpay payment_id)
router.get('/orders/:id/invoice', async (req, res) => {
  try {
    const orderId = decodeURIComponent(req.params.id);
    const email = String(req.query.email || '').trim().toLowerCase();
    const paymentId = String(req.query.payment_id || '').trim();
    const detail = await buildEnrichedOrderDetail(orderId);
    if (!detail) return res.status(404).json({ error: 'Invoice not found' });

    const matchesEmail = email && detail.customerEmail.toLowerCase() === email;
    const matchesPayment = paymentId && detail.razorpayPaymentId === paymentId;
    if (!matchesEmail && !matchesPayment) {
      return res.status(403).json({ error: 'Invoice access verification required' });
    }
    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct storefront checkout bypass is disabled: Razorpay Checkout + signature verification is mandatory
router.post('/orders', (_req, res) => {
  return res.status(400).json({
    error:
      'Direct order submission is disabled. Please complete payment securely through Razorpay Checkout.',
  });
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
        'SELECT id, fulfillment_status, payment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
        [orderId]
      );
      if (!existing.length) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
      }
      const prevStatus = existing[0].fulfillment_status;
      const wasPaid = existing[0].payment_status === 'Paid';
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
      } else if (status === 'Cancelled' && prevStatus !== 'Cancelled' && wasPaid) {
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
              [
                it.product_id,
                prodRows[0].sku,
                qty,
                prevStock,
                nextStock,
                `Restock from cancelled ${orderId}`,
                actor.actorEmail,
              ]
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
          [
            prev.payment_id,
            prev.order_id,
            `rfd_${Date.now()}`,
            Number(prev.amount),
            prev.reason || 'Refund processed',
          ]
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
