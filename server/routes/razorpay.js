import crypto from 'crypto';
import express from 'express';
import { query, withTransaction } from '../db.js';
import { ensureRazorpayInvoiceSchema } from '../initDb.js';
import { logActivity } from '../utils/logger.js';
import { buildEnrichedOrderDetail } from './sales.js';

const router = express.Router();

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_FEE = 99;

// Authoritative server-side definitions for storefront companion add-ons
const ADDON_CATALOG = {
  'addon-cellular-hydration': {
    name: 'Cellular Hydration Electrolytes',
    sku: 'TBD-ADD-HYD15',
    regularPrice: 799,
    salePrice: 799,
    image: '/images/ing-multiminerals.png',
  },
  'addon-deep-rest': {
    name: 'Deep Stage Rest Matrix',
    sku: 'TBD-ADD-RST30',
    regularPrice: 949,
    salePrice: 949,
    image: '/images/ing-multiminerals.png',
  },
};

function getRazorpayCredentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  return { keyId, keySecret };
}

async function createRazorpayGatewayOrder({ amountPaise, currency = 'INR', receipt, notes }) {
  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) {
    const err = new Error(
      'Razorpay credentials are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.'
    );
    err.status = 500;
    throw err;
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt: String(receipt).slice(0, 40),
      payment_capture: 1,
      notes,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.id) {
    const msg =
      payload?.error?.description ||
      payload?.error?.reason ||
      `Razorpay gateway rejected order creation (${response.status})`;
    const err = new Error(msg);
    err.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw err;
  }

  return payload;
}

// Public non-secret config (NEVER exposes RAZORPAY_KEY_SECRET)
router.get('/payments/razorpay/config', (_req, res) => {
  const { keyId, keySecret } = getRazorpayCredentials();
  res.json({
    configured: Boolean(keyId && keySecret),
    keyId: keyId || null,
    mode: keyId.startsWith('rzp_test_') ? 'test' : keyId ? 'live' : 'unconfigured',
    currency: 'INR',
  });
});

// Step 1: Authoritatively calculate totals, create Razorpay order, persist Pending order in MySQL
router.post('/payments/razorpay/create-order', async (req, res) => {
  try {
    await ensureRazorpayInvoiceSchema();

    const { keyId, keySecret } = getRazorpayCredentials();
    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: 'Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env.',
      });
    }

    const {
      customerName,
      customerEmail,
      customerPhone = '',
      customerCity,
      billingAddress = '',
      shippingAddress = '',
      orderNotes = '',
      couponCode = null,
      items = [],
    } = req.body || {};

    const cleanName = String(customerName || '').trim();
    const cleanEmail = String(customerEmail || '').trim().toLowerCase();
    const cleanPhone = String(customerPhone || '').trim();
    const cleanCity = String(customerCity || '').trim();
    const cleanBilling = String(billingAddress || '').trim() || `${cleanCity}, India`;
    const cleanShipping = String(shippingAddress || '').trim() || cleanBilling;
    const cleanNotes = String(orderNotes || '').trim() || null;

    if (!cleanName || !cleanEmail || !cleanCity) {
      return res.status(400).json({ error: 'Patient name, email, and city are required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add at least one product before checkout.' });
    }

    // Resolve authoritative pricing & metadata from MySQL products table
    const resolvedItems = [];
    for (const raw of items) {
      const qty = Math.max(1, Math.min(20, Number(raw.quantity || raw.qty || 1)));
      const isSub = Boolean(raw.isSubscription);
      const cadenceDays = isSub ? Number(raw.cadenceDays || 30) : null;
      const productId = raw.productId ? String(raw.productId) : null;

      if (productId && ADDON_CATALOG[productId]) {
        const addon = ADDON_CATALOG[productId];
        const unitPrice = isSub ? Math.round(addon.salePrice * 0.85) : addon.salePrice;
        const originalUnitPrice = addon.regularPrice;
        const lineTotal = Number((unitPrice * qty).toFixed(2));
        const discountAmount = Math.max(0, Number(((originalUnitPrice - unitPrice) * qty).toFixed(2)));
        resolvedItems.push({
          productId: null,
          sku: addon.sku,
          name: addon.name,
          image: raw.image || addon.image,
          qty,
          originalUnitPrice,
          unitPrice,
          discountAmount,
          lineTotal,
          isSubscription: isSub,
          cadenceDays,
        });
        continue;
      }

      if (productId) {
        const prodRows = await query(
          'SELECT id, sku, name, regular_price, sale_price, subscription_price, image_url, stock FROM products WHERE id = ? LIMIT 1',
          [productId]
        );
        if (prodRows.length) {
          const p = prodRows[0];
          const regularPrice = Number(p.regular_price || p.sale_price || 0);
          const salePrice = Number(p.sale_price || regularPrice);
          const subPrice =
            p.subscription_price != null
              ? Number(p.subscription_price)
              : Math.round(salePrice * 0.85);

          // Match storefront pricing logic exactly:
          // COREAA one-time = regularPrice (599), subscription = subscriptionPrice (499)
          const unitPrice = isSub
            ? subPrice
            : p.id === 'coreaa-daily-vitality'
            ? regularPrice
            : salePrice;
          const originalUnitPrice = Math.max(regularPrice, unitPrice);
          const lineTotal = Number((unitPrice * qty).toFixed(2));
          const discountAmount = Math.max(
            0,
            Number(((originalUnitPrice - unitPrice) * qty).toFixed(2))
          );

          resolvedItems.push({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            image: raw.image || p.image_url,
            qty,
            originalUnitPrice,
            unitPrice,
            discountAmount,
            lineTotal,
            isSubscription: isSub,
            cadenceDays,
          });
          continue;
        }
      }

      // Fallback only if custom non-catalog item
      const unitPrice = Math.max(1, Number(raw.unitPrice || raw.price || 0));
      const originalUnitPrice = Math.max(unitPrice, Number(raw.regularPrice || unitPrice));
      const lineTotal = Number((unitPrice * qty).toFixed(2));
      const discountAmount = Math.max(0, Number(((originalUnitPrice - unitPrice) * qty).toFixed(2)));
      resolvedItems.push({
        productId: null,
        sku: 'TBD-CUSTOM',
        name: String(raw.name || 'TBD Formulation'),
        image: raw.image || null,
        qty,
        originalUnitPrice,
        unitPrice,
        discountAmount,
        lineTotal,
        isSubscription: isSub,
        cadenceDays,
      });
    }

    const originalSubtotal = Number(
      resolvedItems.reduce((sum, it) => sum + it.originalUnitPrice * it.qty, 0).toFixed(2)
    );
    const saleSubtotal = Number(
      resolvedItems.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2)
    );
    const productDiscount = Number(
      resolvedItems.reduce((sum, it) => sum + it.discountAmount, 0).toFixed(2)
    );

    // Server-side coupon re-validation against MySQL coupons
    let validatedCouponCode = null;
    let couponDiscount = 0;
    if (couponCode && String(couponCode).trim()) {
      const normalizedCode = String(couponCode).trim().toUpperCase();
      const cRows = await query(
        'SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1',
        [normalizedCode]
      );
      if (cRows.length) {
        const c = cRows[0];
        const underUseLimit =
          c.max_uses == null || Number(c.used_count || 0) < Number(c.max_uses);
        const meetsMinOrder = saleSubtotal >= Number(c.min_order_amount || 0);
        if (underUseLimit && meetsMinOrder) {
          validatedCouponCode = c.code;
          couponDiscount =
            c.discount_type === 'percent'
              ? Math.round((saleSubtotal * Number(c.discount_value)) / 100)
              : Math.min(saleSubtotal, Number(c.discount_value));
        }
      }
    }

    const shippingAmount =
      saleSubtotal === 0 || saleSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const otherCharges = 0;
    const grandTotal = Math.max(
      1,
      Number((saleSubtotal - couponDiscount + shippingAmount + otherCharges).toFixed(2))
    );
    const amountPaise = Math.round(grandTotal * 100);
    const taxableValue = Number((grandTotal / 1.18).toFixed(2));
    const gstAmount = Number((grandTotal - taxableValue).toFixed(2));

    // Generate unique Order ID before calling Razorpay so receipt maps 1:1
    const countRows = await query('SELECT COUNT(*) AS cnt FROM orders');
    const randSalt = Math.floor(10 + Math.random() * 89);
    const baseNum = 10500 + Number(countRows[0]?.cnt || 0);
    let orderId = `#TBD-${baseNum}`;
    const existingCheck = await query('SELECT id FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (existingCheck.length) {
      orderId = `#TBD-${Date.now().toString().slice(-5)}${randSalt}`;
    }
    const invSuffix = orderId.replace('#TBD-', '');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${invSuffix}`;
    const dateLabel = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Call Razorpay TEST/LIVE Orders API from backend
    const rzpOrder = await createRazorpayGatewayOrder({
      amountPaise,
      currency: 'INR',
      receipt: orderId.replace('#', ''),
      notes: {
        order_id: orderId,
        invoice_number: invoiceNumber,
        customer_email: cleanEmail,
      },
    });

    // Persist Pending order, items, pending payment, and invoice atomically in MySQL
    await withTransaction(async (txQuery) => {
      let customerId = null;
      const existingCustomer = await txQuery(
        'SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1 FOR UPDATE',
        [cleanEmail]
      );
      if (existingCustomer.length) {
        customerId = existingCustomer[0].id;
        await txQuery(
          'UPDATE customers SET full_name = ?, phone = COALESCE(NULLIF(?, ""), phone), city = ? WHERE id = ?',
          [cleanName, cleanPhone, cleanCity, customerId]
        );
      } else {
        const custRes = await txQuery(
          `INSERT INTO customers (group_id, full_name, email, phone, city, total_orders, lifetime_spend, is_subscriber)
           VALUES (3, ?, ?, ?, ?, 0, 0.00, 0)`,
          [cleanName, cleanEmail, cleanPhone, cleanCity]
        );
        customerId = custRes.insertId;
      }

      await txQuery(
        `INSERT INTO orders (
          id, customer_id, customer_name, customer_email, customer_phone, customer_city,
          billing_address, shipping_address, order_notes,
          coupon_code, original_subtotal, product_discount, subtotal, discount_amount,
          shipping_amount, other_charges, total_amount,
          payment_method, payment_status, fulfillment_status,
          razorpay_order_id, order_date_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Razorpay', 'Pending', 'Pending', ?, ?)`,
        [
          orderId,
          customerId,
          cleanName,
          cleanEmail,
          cleanPhone || null,
          cleanCity,
          cleanBilling,
          cleanShipping,
          cleanNotes,
          validatedCouponCode,
          originalSubtotal,
          productDiscount,
          saleSubtotal,
          couponDiscount,
          shippingAmount,
          otherCharges,
          grandTotal,
          rzpOrder.id,
          dateLabel,
        ]
      );

      for (const it of resolvedItems) {
        await txQuery(
          `INSERT INTO order_items (
            order_id, product_id, sku, product_name, product_image, quantity,
            original_unit_price, discount_amount, unit_price, line_total, is_subscription, cadence_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            it.productId,
            it.sku,
            it.name,
            it.image,
            it.qty,
            it.originalUnitPrice,
            it.discountAmount,
            it.unitPrice,
            it.lineTotal,
            it.isSubscription ? 1 : 0,
            it.cadenceDays,
          ]
        );
      }

      await txQuery(
        `INSERT INTO payments (
          order_id, provider, provider_reference, razorpay_order_id, method, amount, currency, status, paid_at
        ) VALUES (?, 'Razorpay', ?, ?, 'Razorpay', ?, 'INR', 'Pending', NULL)`,
        [orderId, rzpOrder.id, rzpOrder.id, grandTotal]
      );

      await txQuery(
        `INSERT INTO invoices (invoice_number, order_id, taxable_value, gst_amount, grand_total)
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceNumber, orderId, taxableValue, gstAmount, grandTotal]
      );
    });

    await logActivity({
      actorName: cleanName,
      actorEmail: cleanEmail,
      actionType: 'RAZORPAY_ORDER_CREATED',
      entityType: 'order',
      entityId: orderId,
      details: `Initiated Razorpay order ${rzpOrder.id} for ${orderId} (₹${grandTotal})`,
    });

    return res.status(201).json({
      keyId,
      mode: keyId.startsWith('rzp_test_') ? 'test' : 'live',
      orderId,
      invoiceNumber,
      razorpayOrderId: rzpOrder.id,
      amount: grandTotal,
      amountPaise,
      currency: 'INR',
      breakdown: {
        originalSubtotal,
        productDiscount,
        subtotal: saleSubtotal,
        couponCode: validatedCouponCode,
        couponDiscount,
        shippingAmount,
        otherCharges,
        taxableValue,
        gstAmount,
        totalSavings: Number((productDiscount + couponDiscount).toFixed(2)),
        grandTotal,
      },
      customer: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
      },
    });
  } catch (err) {
    console.error('[POST /api/payments/razorpay/create-order]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Failed to initiate Razorpay order' });
  }
});

// Step 2: Cryptographically verify Razorpay payment signature on backend and finalize order atomically
router.post('/payments/razorpay/verify', async (req, res) => {
  try {
    const { keySecret } = getRazorpayCredentials();
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay secret is not configured on the server.' });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing required Razorpay verification fields (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature).',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const sigBuf = Buffer.from(String(razorpay_signature), 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!signatureValid) {
      await withTransaction(async (txQuery) => {
        const rows = await txQuery(
          'SELECT id, payment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
          [orderId]
        );
        if (rows.length && rows[0].payment_status !== 'Paid') {
          await txQuery(
            "UPDATE orders SET payment_status = 'Failed', fulfillment_status = 'Cancelled' WHERE id = ?",
            [orderId]
          );
          await txQuery("UPDATE payments SET status = 'Failed' WHERE order_id = ?", [orderId]);
        }
      });

      await logActivity({
        actorName: 'Razorpay Security',
        actorEmail: 'security@tbdwellness.com',
        actionType: 'PAYMENT_SIGNATURE_FAILED',
        entityType: 'order',
        entityId: orderId,
        details: `Rejected invalid Razorpay signature for ${orderId} (${razorpay_payment_id})`,
      });

      return res.status(400).json({
        verified: false,
        error: 'Payment signature verification failed. Order was not marked as paid.',
      });
    }

    // Valid signature: finalize order idempotently inside ACID transaction
    const outcome = await withTransaction(async (txQuery) => {
      const orderRows = await txQuery(
        'SELECT * FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
        [orderId]
      );
      if (!orderRows.length) {
        const err = new Error('Order not found for verification');
        err.status = 404;
        throw err;
      }

      const order = orderRows[0];

      // Prevent cross-order replay
      if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
        const err = new Error('Razorpay order ID mismatch');
        err.status = 400;
        throw err;
      }

      // Idempotent duplicate check: if already verified & paid, do NOT double-process
      if (order.payment_status === 'Paid') {
        return { alreadyVerified: true, orderId: order.id };
      }

      // Prevent same payment_id from being reused across different orders
      const dupPay = await txQuery(
        'SELECT id FROM orders WHERE razorpay_payment_id = ? AND id <> ? LIMIT 1',
        [razorpay_payment_id, orderId]
      );
      if (dupPay.length) {
        const err = new Error('Duplicate payment reference detected');
        err.status = 409;
        throw err;
      }

      // Mark order Paid & Processing
      await txQuery(
        `UPDATE orders
         SET payment_method = 'Razorpay',
             payment_status = 'Paid',
             fulfillment_status = 'Processing',
             razorpay_payment_id = ?,
             razorpay_signature = ?
         WHERE id = ?`,
        [razorpay_payment_id, razorpay_signature, orderId]
      );

      // Update payment row to Paid
      const payRows = await txQuery(
        'SELECT id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
        [orderId]
      );
      let paymentDbId = null;
      if (payRows.length) {
        paymentDbId = payRows[0].id;
        await txQuery(
          `UPDATE payments
           SET provider = 'Razorpay',
               provider_reference = ?,
               razorpay_order_id = ?,
               razorpay_payment_id = ?,
               method = 'Razorpay',
               status = 'Paid',
               paid_at = NOW()
           WHERE id = ?`,
          [razorpay_payment_id, razorpay_order_id, razorpay_payment_id, paymentDbId]
        );
      } else {
        const payRes = await txQuery(
          `INSERT INTO payments (
            order_id, provider, provider_reference, razorpay_order_id, razorpay_payment_id,
            method, amount, currency, status, paid_at
          ) VALUES (?, 'Razorpay', ?, ?, ?, 'Razorpay', ?, 'INR', 'Paid', NOW())`,
          [orderId, razorpay_payment_id, razorpay_order_id, razorpay_payment_id, Number(order.total_amount)]
        );
        paymentDbId = payRes.insertId;
      }

      // Insert Capture transaction (idempotent guard on gateway_txn_id)
      const existingTxn = await txQuery(
        'SELECT id FROM transactions WHERE order_id = ? AND gateway_txn_id = ? LIMIT 1',
        [orderId, razorpay_payment_id]
      );
      if (!existingTxn.length) {
        await txQuery(
          `INSERT INTO transactions (payment_id, order_id, txn_type, gateway_txn_id, amount, notes)
           VALUES (?, ?, 'Capture', ?, ?, 'Verified Razorpay checkout payment')`,
          [paymentDbId, orderId, razorpay_payment_id, Number(order.total_amount)]
        );
      }

      // Update customer spend & order count ONLY after verified payment
      const itemRows = await txQuery(
        'SELECT product_id, quantity, is_subscription FROM order_items WHERE order_id = ?',
        [orderId]
      );
      const hasSubscription = itemRows.some((i) => Boolean(i.is_subscription));
      if (order.customer_id) {
        await txQuery(
          `UPDATE customers
           SET total_orders = total_orders + 1,
               lifetime_spend = lifetime_spend + ?,
               is_subscriber = IF(? = 1, 1, is_subscriber)
           WHERE id = ?`,
          [Number(order.total_amount), hasSubscription ? 1 : 0, order.customer_id]
        );
      }

      // Increment coupon usage ONLY after verified payment
      if (order.coupon_code) {
        await txQuery('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = ?', [
          String(order.coupon_code).trim().toUpperCase(),
        ]);
      }

      // Decrement product inventory atomically with FOR UPDATE locking
      for (const it of itemRows) {
        if (!it.product_id) continue;
        const prodRows = await txQuery(
          'SELECT id, sku, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
          [it.product_id]
        );
        if (prodRows.length) {
          const prevStock = Number(prodRows[0].stock);
          const qty = Number(it.quantity || 1);
          const nextStock = Math.max(0, prevStock - qty);
          await txQuery('UPDATE products SET stock = ? WHERE id = ?', [nextStock, it.product_id]);
          await txQuery(
            `INSERT INTO inventory_logs (product_id, sku, change_qty, previous_stock, new_stock, reason, actor_email)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              it.product_id,
              prodRows[0].sku,
              nextStock - prevStock,
              prevStock,
              nextStock,
              `Razorpay Verified Order ${orderId}`,
              order.customer_email,
            ]
          );
        }
      }

      // Create shipment tracking entry if not already created
      const existingShip = await txQuery(
        'SELECT id FROM shipment_tracking WHERE order_id = ? LIMIT 1',
        [orderId]
      );
      if (!existingShip.length) {
        const awbSuffix = String(orderId).replace(/[^A-Z0-9]/gi, '');
        await txQuery(
          `INSERT INTO shipment_tracking (order_id, courier_id, shipping_method_id, awb_number, current_status, last_location)
           VALUES (?, 1, 1, ?, 'Label Created', 'Haridwar Cold-Chain Dispatch')`,
          [orderId, `BD${awbSuffix}IN`]
        );
      }

      return { alreadyVerified: false, orderId: order.id, customerName: order.customer_name, customerEmail: order.customer_email, amount: Number(order.total_amount) };
    });

    if (!outcome.alreadyVerified) {
      await logActivity({
        actorName: outcome.customerName,
        actorEmail: outcome.customerEmail,
        actionType: 'ORDER_PAID',
        entityType: 'order',
        entityId: outcome.orderId,
        details: `Verified Razorpay payment ${razorpay_payment_id} for ${outcome.orderId} (₹${outcome.amount})`,
      });
    }

    const detail = await buildEnrichedOrderDetail(orderId);
    return res.json({
      verified: true,
      alreadyVerified: outcome.alreadyVerified,
      order: detail,
    });
  } catch (err) {
    console.error('[POST /api/payments/razorpay/verify]', err);
    return res.status(err.status || 500).json({ error: err.message || 'Payment verification failed' });
  }
});

// Step 3: Record failed or cancelled Razorpay checkout attempts without marking paid
router.post('/payments/razorpay/failed', async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id = null,
      razorpay_payment_id = null,
      reason = 'failed',
      errorDescription = '',
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const isFailed = reason === 'failed';
    const nextPaymentStatus = isFailed ? 'Failed' : 'Pending';
    const nextFulfillmentStatus = 'Cancelled';

    const result = await withTransaction(async (txQuery) => {
      const rows = await txQuery(
        'SELECT id, customer_name, customer_email, payment_status, fulfillment_status FROM orders WHERE id = ? LIMIT 1 FOR UPDATE',
        [orderId]
      );
      if (!rows.length) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
      }

      const cur = rows[0];
      // Never downgrade an already verified Paid order
      if (cur.payment_status === 'Paid') {
        return {
          ignored: true,
          paymentStatus: cur.payment_status,
          fulfillmentStatus: cur.fulfillment_status,
          customerName: cur.customer_name,
          customerEmail: cur.customer_email,
        };
      }

      await txQuery(
        'UPDATE orders SET payment_status = ?, fulfillment_status = ? WHERE id = ?',
        [nextPaymentStatus, nextFulfillmentStatus, orderId]
      );
      await txQuery(
        `UPDATE payments
         SET status = ?,
             razorpay_order_id = COALESCE(?, razorpay_order_id),
             razorpay_payment_id = COALESCE(?, razorpay_payment_id)
         WHERE order_id = ?`,
        [nextPaymentStatus, razorpay_order_id, razorpay_payment_id, orderId]
      );

      return {
        ignored: false,
        paymentStatus: nextPaymentStatus,
        fulfillmentStatus: nextFulfillmentStatus,
        customerName: cur.customer_name,
        customerEmail: cur.customer_email,
      };
    });

    if (!result.ignored) {
      await logActivity({
        actorName: result.customerName,
        actorEmail: result.customerEmail,
        actionType: isFailed ? 'PAYMENT_FAILED' : 'PAYMENT_CANCELLED',
        entityType: 'order',
        entityId: orderId,
        details: `${isFailed ? 'Razorpay payment failed' : 'Patient cancelled Razorpay checkout'} for ${orderId}${
          errorDescription ? ` (${errorDescription})` : ''
        }`,
      });
    }

    return res.json({
      recorded: true,
      orderId,
      paymentStatus: result.paymentStatus,
      fulfillmentStatus: result.fulfillmentStatus,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
