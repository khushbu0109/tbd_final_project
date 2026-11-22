import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics/sales', requireAdminAuth, async (_req, res) => {
  try {
    const [summary] = await query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(CASE WHEN fulfillment_status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS net_revenue,
         COALESCE(AVG(CASE WHEN fulfillment_status != 'Cancelled' THEN total_amount ELSE NULL END), 0) AS avg_order_value,
         SUM(CASE WHEN fulfillment_status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_orders,
         SUM(CASE WHEN fulfillment_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
       FROM orders`
    );
    const byStatus = await query(
      `SELECT fulfillment_status AS status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders GROUP BY fulfillment_status`
    );
    const byPayment = await query(
      `SELECT payment_method AS method, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders GROUP BY payment_method`
    );
    res.json({ summary, byStatus, byPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics/products', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT p.id, p.sku, p.name, c.name AS category_name, p.sale_price, p.cost_price, p.stock, p.rating,
              COALESCE(SUM(oi.quantity), 0) AS units_sold,
              COALESCE(SUM(oi.line_total), 0) AS gross_revenue
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       GROUP BY p.id
       ORDER BY gross_revenue DESC, p.rating DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics/customers', requireAdminAuth, async (_req, res) => {
  try {
    const [summary] = await query(
      `SELECT COUNT(*) AS total_customers,
              SUM(CASE WHEN is_subscriber = 1 THEN 1 ELSE 0 END) AS active_subscribers,
              COALESCE(SUM(lifetime_spend), 0) AS total_ltv,
              COALESCE(AVG(lifetime_spend), 0) AS avg_ltv
       FROM customers`
    );
    const byCity = await query(
      `SELECT city, COUNT(*) AS customers, COALESCE(SUM(lifetime_spend), 0) AS spend
       FROM customers GROUP BY city ORDER BY spend DESC`
    );
    const topCustomers = await query(
      `SELECT c.id, c.full_name, c.email, c.city, c.total_orders, c.lifetime_spend, g.group_name
       FROM customers c LEFT JOIN customer_groups g ON g.id = c.group_id
       ORDER BY c.lifetime_spend DESC LIMIT 10`
    );
    res.json({ summary, byCity, topCustomers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics/inventory', requireAdminAuth, async (_req, res) => {
  try {
    const [summary] = await query(
      `SELECT COUNT(*) AS total_skus,
              COALESCE(SUM(stock), 0) AS total_units,
              SUM(CASE WHEN stock <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock_skus,
              COALESCE(SUM(stock * cost_price), 0) AS cost_valuation,
              COALESCE(SUM(stock * sale_price), 0) AS retail_valuation
       FROM products`
    );
    const byCategory = await query(
      `SELECT c.name AS category_name, COUNT(p.id) AS skus,
              COALESCE(SUM(p.stock), 0) AS total_units,
              COALESCE(SUM(p.stock * p.sale_price), 0) AS retail_value
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id ORDER BY retail_value DESC`
    );
    const lowStockItems = await query(
      `SELECT id, sku, name, stock, low_stock_threshold, sale_price
       FROM products WHERE stock <= low_stock_threshold ORDER BY stock ASC`
    );
    res.json({ summary, byCategory, lowStockItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
