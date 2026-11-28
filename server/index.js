import express from 'express';
import { mountApiRoutes } from './app.js';
import { testConnection } from './db.js';
import { ensureRazorpayInvoiceSchema } from './initDb.js';

const PORT = Number(process.env.API_PORT || process.env.PORT || 4000);
const app = express();

mountApiRoutes(app);

app.listen(PORT, '0.0.0.0', async () => {
  const status = await testConnection();
  if (status.connected) {
    try {
      await ensureRazorpayInvoiceSchema();
    } catch (migErr) {
      console.error('[TBD Wellness API] Schema migration warning:', migErr?.message || migErr);
    }
  }
  console.log(
    `[TBD Wellness API] Standalone Express server on http://0.0.0.0:${PORT} | MySQL: ${
      status.connected ? `connected (${status.database})` : `offline (${status.error})`
    }`
  );
});
