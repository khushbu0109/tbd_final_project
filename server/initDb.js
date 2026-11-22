import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

export async function ensureDatabaseSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.184.92',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'u375814358_vishant',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'u375814358_tbd_ai_studio',
    charset: 'utf8mb4',
    multipleStatements: true,
    connectTimeout: 10000,
  });

  try {
    await conn.query(sql);
    return { ok: true };
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  ensureDatabaseSchema()
    .then(() => {
      console.log('MySQL schema.sql applied successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to apply schema.sql:', err.message);
      process.exit(1);
    });
}
