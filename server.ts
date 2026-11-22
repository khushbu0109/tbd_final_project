import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { mountApiRoutes } from './server/app.js';
import { testConnection } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Mount all Node.js + MySQL /api/* routes
  mountApiRoutes(app);

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    const dbStatus = await testConnection();
    console.log(
      `[TBD Wellness] Server listening on http://0.0.0.0:${PORT} | MySQL: ${
        dbStatus.connected ? `connected (${dbStatus.database})` : `offline (${dbStatus.error})`
      }`
    );
  });
}

startServer().catch((err) => {
  console.error('[TBD Wellness] Failed to start server:', err);
  process.exit(1);
});
