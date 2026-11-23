import express from 'express';
import cors from 'cors';
import { getDbStatus, testConnection } from './db.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import salesRoutes from './routes/sales.js';
import customersRoutes from './routes/customers.js';
import marketingRoutes from './routes/marketing.js';
import cmsRoutes from './routes/cms.js';
import financeRoutes from './routes/finance.js';
import deliveryRoutes from './routes/delivery.js';
import analyticsRoutes from './routes/analytics.js';
import systemRoutes from './routes/system.js';
import razorpayRoutes from './routes/razorpay.js';

export function mountApiRoutes(app) {
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', async (_req, res) => {
    const live = await testConnection();
    res.json({ ok: live.connected, db: { ...getDbStatus(), ...live } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', razorpayRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', salesRoutes);
  app.use('/api', customersRoutes);
  app.use('/api', marketingRoutes);
  app.use('/api', cmsRoutes);
  app.use('/api', financeRoutes);
  app.use('/api', deliveryRoutes);
  app.use('/api', analyticsRoutes);
  app.use('/api', systemRoutes);

  // Return JSON 404 for unmatched /api/* endpoints instead of falling through to SPA HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Centralized MySQL & Express error handler
  app.use((err, _req, res, _next) => {
    console.error('[API Error]', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A record with this unique value already exists', detail: err.message });
    }
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Record is referenced by other data and cannot be deleted', detail: err.message });
    }
    if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ error: 'Invalid or missing required relational field', detail: err.message });
    }
    return res.status(err?.status || 500).json({ error: err?.message || 'Internal server error' });
  });
}
