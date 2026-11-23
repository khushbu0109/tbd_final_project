import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

async function ensureColumn(conn, dbName, table, column, definitionSql) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column]
  );
  if (!rows.length) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definitionSql}`);
  }
}

async function ensureIndex(conn, dbName, table, indexName, indexSql) {
  const [rows] = await conn.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [dbName, table, indexName]
  );
  if (!rows.length) {
    await conn.query(`ALTER TABLE \`${table}\` ADD ${indexSql}`);
  }
}

export async function applyIncrementalMigrations(conn, dbName) {
  // Expand payment_method / method from legacy narrow ENUM to VARCHAR(40) so 'Razorpay' persists cleanly
  await conn.query(
    `ALTER TABLE orders MODIFY COLUMN payment_method VARCHAR(40) NOT NULL DEFAULT 'Razorpay'`
  );
  await conn.query(
    `ALTER TABLE payments MODIFY COLUMN method VARCHAR(40) NOT NULL DEFAULT 'Razorpay'`
  );

  // Orders columns for Razorpay & full-page invoice breakdown
  await ensureColumn(conn, dbName, 'orders', 'customer_phone', 'VARCHAR(30) NULL AFTER customer_email');
  await ensureColumn(conn, dbName, 'orders', 'billing_address', 'TEXT NULL AFTER customer_city');
  await ensureColumn(conn, dbName, 'orders', 'shipping_address', 'TEXT NULL AFTER billing_address');
  await ensureColumn(conn, dbName, 'orders', 'order_notes', 'TEXT NULL AFTER shipping_address');
  await ensureColumn(conn, dbName, 'orders', 'original_subtotal', 'DECIMAL(10,2) NULL AFTER coupon_code');
  await ensureColumn(
    conn,
    dbName,
    'orders',
    'product_discount',
    'DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER original_subtotal'
  );
  await ensureColumn(
    conn,
    dbName,
    'orders',
    'other_charges',
    'DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER shipping_amount'
  );
  await ensureColumn(
    conn,
    dbName,
    'orders',
    'razorpay_order_id',
    'VARCHAR(120) NULL AFTER fulfillment_status'
  );
  await ensureColumn(
    conn,
    dbName,
    'orders',
    'razorpay_payment_id',
    'VARCHAR(120) NULL AFTER razorpay_order_id'
  );
  await ensureColumn(
    conn,
    dbName,
    'orders',
    'razorpay_signature',
    'VARCHAR(255) NULL AFTER razorpay_payment_id'
  );

  await ensureIndex(
    conn,
    dbName,
    'orders',
    'uq_orders_razorpay_order_id',
    'UNIQUE INDEX uq_orders_razorpay_order_id (razorpay_order_id)'
  );
  await ensureIndex(
    conn,
    dbName,
    'orders',
    'uq_orders_razorpay_payment_id',
    'UNIQUE INDEX uq_orders_razorpay_payment_id (razorpay_payment_id)'
  );

  // Order items columns for rich invoice line-item table
  await ensureColumn(conn, dbName, 'order_items', 'sku', 'VARCHAR(64) NULL AFTER product_id');
  await ensureColumn(
    conn,
    dbName,
    'order_items',
    'product_image',
    'VARCHAR(255) NULL AFTER product_name'
  );
  await ensureColumn(
    conn,
    dbName,
    'order_items',
    'original_unit_price',
    'DECIMAL(10,2) NULL AFTER quantity'
  );
  await ensureColumn(
    conn,
    dbName,
    'order_items',
    'discount_amount',
    'DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER original_unit_price'
  );

  // Payments columns for Razorpay reconciliation
  await ensureColumn(
    conn,
    dbName,
    'payments',
    'razorpay_order_id',
    'VARCHAR(120) NULL AFTER provider_reference'
  );
  await ensureColumn(
    conn,
    dbName,
    'payments',
    'razorpay_payment_id',
    'VARCHAR(120) NULL AFTER razorpay_order_id'
  );
}

export async function ensureDatabaseSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const dbName = process.env.DB_NAME || 'u375814358_tbd_ai_studio';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.184.92',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'u375814358_vishant',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    charset: 'utf8mb4',
    multipleStatements: true,
    connectTimeout: 10000,
  });

  try {
    await conn.query(sql);
    await applyIncrementalMigrations(conn, dbName);
    return { ok: true };
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  ensureDatabaseSchema()
    .then(() => {
      console.log('MySQL schema.sql & Razorpay/Invoice migrations applied successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to apply schema.sql:', err.message);
      process.exit(1);
    });
}
