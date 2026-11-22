import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first, then fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST || '193.203.184.92',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'u375814358_vishant',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u375814358_tbd_ai_studio',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 8000,
};

let pool = mysql.createPool(poolConfig);
let dbConnected = false;
let lastDbError = null;

function attachPoolListeners(activePool) {
  activePool.on('connection', (conn) => {
    conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", () => {});
  });
  activePool.on('error', (err) => {
    dbConnected = false;
    lastDbError = err.message;
    console.error('[MySQL Pool Error]', err.code || err.message);
    if (
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET' ||
      err.code === 'ETIMEDOUT'
    ) {
      try {
        pool = mysql.createPool(poolConfig);
        attachPoolListeners(pool);
      } catch (recreateErr) {
        console.error('[MySQL Reconnect Failed]', recreateErr.message);
      }
    }
  });
}

attachPoolListeners(pool);

export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbConnected = true;
    lastDbError = null;
    return { connected: true, host: poolConfig.host, database: poolConfig.database };
  } catch (err) {
    dbConnected = false;
    lastDbError = err.message;
    return { connected: false, host: poolConfig.host, database: poolConfig.database, error: err.message };
  }
}

export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    dbConnected = true;
    lastDbError = null;
    return rows;
  } catch (err) {
    // Retry once on transient lost-connection errors
    if (
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET' ||
      err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
    ) {
      pool = mysql.createPool(poolConfig);
      attachPoolListeners(pool);
      const [rows] = await pool.execute(sql, params);
      dbConnected = true;
      lastDbError = null;
      return rows;
    }
    dbConnected = false;
    lastDbError = err.message;
    throw err;
  }
}

export async function withTransaction(callback) {
  let conn;
  try {
    conn = await pool.getConnection();
  } catch (err) {
    if (
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET' ||
      err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'
    ) {
      pool = mysql.createPool(poolConfig);
      attachPoolListeners(pool);
      conn = await pool.getConnection();
    } else {
      dbConnected = false;
      lastDbError = err.message;
      throw err;
    }
  }

  try {
    await conn.beginTransaction();
    const txQuery = async (sql, params = []) => {
      const [rows] = await conn.execute(sql, params);
      return rows;
    };
    const result = await callback(txQuery, conn);
    await conn.commit();
    dbConnected = true;
    lastDbError = null;
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rbErr) {
      console.error('[MySQL Rollback Error]', rbErr.message);
    }
    throw err;
  } finally {
    conn.release();
  }
}

export function getPool() {
  return pool;
}

export function getDbStatus() {
  return {
    connected: dbConnected,
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    error: lastDbError,
  };
}

export default pool;
