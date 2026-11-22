import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

// ---------------- ADMIN USERS ----------------
router.get('/admin-users', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.is_active, u.last_login_at, u.created_at,
              r.role_key, r.role_name
       FROM admin_users u
       JOIN admin_roles r ON r.id = u.role_id
       ORDER BY u.id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin-users', requireAdminAuth, async (req, res) => {
  try {
    const { role_id = 2, full_name, email, password = 'ClinicalVitality#2025' } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO admin_users (role_id, full_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, 1)',
      [Number(role_id), full_name, email, hash]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'admin_user',
      entityId: result.insertId,
      details: `Added admin user ${full_name} (${email})`,
    });
    const rows = await query(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.is_active, u.created_at, r.role_name
       FROM admin_users u JOIN admin_roles r ON r.id = u.role_id WHERE u.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin-users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { is_active, role_id } = req.body;
    if (role_id != null) {
      await query('UPDATE admin_users SET role_id = ? WHERE id = ?', [Number(role_id), req.params.id]);
    }
    if (is_active != null) {
      await query('UPDATE admin_users SET is_active = ? WHERE id = ?', [
        is_active ? 1 : 0,
        req.params.id,
      ]);
    }
    const rows = await query(
      `SELECT u.id, u.role_id, u.full_name, u.email, u.is_active, r.role_name
       FROM admin_users u JOIN admin_roles r ON r.id = u.role_id WHERE u.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin-users/:id', requireAdminAuth, async (req, res) => {
  try {
    if (Number(req.params.id) === 1) {
      return res.status(400).json({ error: 'Primary Executive Super Admin cannot be deleted' });
    }
    await query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ROLES & PERMISSIONS ----------------
router.get('/roles', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query(
      `SELECT r.*, COUNT(u.id) AS user_count
       FROM admin_roles r
       LEFT JOIN admin_users u ON u.role_id = r.id
       GROUP BY r.id
       ORDER BY r.id ASC`
    );
    res.json(
      rows.map((r) => ({
        ...r,
        permissions:
          typeof r.permissions_json === 'string'
            ? JSON.parse(r.permissions_json)
            : r.permissions_json || [],
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/roles', requireAdminAuth, async (req, res) => {
  try {
    const { role_key, role_name, permissions = [] } = req.body;
    const permList = Array.isArray(permissions)
      ? permissions
      : String(permissions)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const result = await query(
      'INSERT INTO admin_roles (role_key, role_name, permissions_json) VALUES (?, ?, ?)',
      [role_key, role_name, JSON.stringify(permList)]
    );
    const rows = await query('SELECT * FROM admin_roles WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], permissions: permList });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.message });
  }
});

router.put('/roles/:id', requireAdminAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM admin_roles WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Role not found' });
    const cur = existing[0];
    const { role_key = cur.role_key, role_name = cur.role_name, permissions } = req.body;
    const permList =
      permissions === undefined
        ? typeof cur.permissions_json === 'string'
          ? JSON.parse(cur.permissions_json)
          : cur.permissions_json || []
        : Array.isArray(permissions)
        ? permissions
        : String(permissions)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    await query('UPDATE admin_roles SET role_key = ?, role_name = ?, permissions_json = ? WHERE id = ?', [
      role_key,
      role_name,
      JSON.stringify(permList),
      req.params.id,
    ]);
    await logActivity({
      ...getActor(req),
      actionType: 'UPDATE',
      entityType: 'role',
      entityId: req.params.id,
      details: `Updated role "${role_name}"`,
    });
    const rows = await query('SELECT * FROM admin_roles WHERE id = ?', [req.params.id]);
    res.json({ ...rows[0], permissions: permList });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: err.message });
  }
});

router.delete('/roles/:id', requireAdminAuth, async (req, res) => {
  try {
    if (Number(req.params.id) === 1) {
      return res.status(400).json({ error: 'Primary Executive Super Admin role cannot be deleted' });
    }
    const assigned = await query('SELECT COUNT(*) AS cnt FROM admin_users WHERE role_id = ?', [req.params.id]);
    if (Number(assigned[0]?.cnt || 0) > 0) {
      return res.status(400).json({ error: 'Reassign admin users before deleting this role' });
    }
    await query('DELETE FROM admin_roles WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ACTIVITY LOGS ----------------
router.get('/activity-logs', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM activity_logs ORDER BY created_at DESC, id DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- STORE SETTINGS ----------------
router.get('/settings', requireAdminAuth, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM store_settings ORDER BY setting_group ASC, setting_key ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', requireAdminAuth, async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.settings) ? req.body.settings : [];
    for (const item of updates) {
      await query(
        `INSERT INTO store_settings (setting_key, setting_group, label, setting_value)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), label = VALUES(label)`,
        [
          item.setting_key,
          item.setting_group || 'General',
          item.label || item.setting_key,
          String(item.setting_value ?? ''),
        ]
      );
    }
    await logActivity({
      ...getActor(req),
      actionType: 'UPDATE',
      entityType: 'settings',
      details: `Updated ${updates.length} store setting(s)`,
    });
    const rows = await query('SELECT * FROM store_settings ORDER BY setting_group ASC, setting_key ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
