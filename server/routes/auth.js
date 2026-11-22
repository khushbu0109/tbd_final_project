import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAdminAuth, signAdminToken } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const rows = await query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active,
              r.role_key, r.role_name, r.permissions_json
       FROM admin_users u
       JOIN admin_roles r ON r.id = u.role_id
       WHERE LOWER(u.email) = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const admin = rows[0];
    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    let valid = false;
    if (admin.password_hash && admin.password_hash.startsWith('$2')) {
      valid = await bcrypt.compare(password, admin.password_hash);
    }

    // Allow seeded default demo password and upgrade its bcrypt hash in MySQL
    if (!valid && email === 'admin@tbdwellness.com' && password === 'ClinicalVitality#2025') {
      valid = true;
      const realHash = await bcrypt.hash(password, 10);
      await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [realHash, admin.id]);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    await query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [admin.id]);

    const token = signAdminToken(admin);

    await logActivity({
      actorName: admin.full_name,
      actorEmail: admin.email,
      actionType: 'LOGIN',
      entityType: 'auth',
      entityId: String(admin.id),
      details: `Signed in as ${admin.role_name}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.json({
      token,
      admin: {
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email,
        roleKey: admin.role_key,
        roleName: admin.role_name,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return res.status(500).json({ error: 'Authentication service failed', detail: err.message });
  }
});

router.get('/me', requireAdminAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT u.id, u.full_name, u.email, u.is_active, u.last_login_at,
              r.role_key, r.role_name
       FROM admin_users u
       JOIN admin_roles r ON r.id = u.role_id
       WHERE u.id = ? LIMIT 1`,
      [req.admin.sub]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    return res.json({ admin: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!currentPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: 'Current password and a new password of at least 8 characters are required' });
    }
    const rows = await query('SELECT id, full_name, email, password_hash FROM admin_users WHERE id = ? LIMIT 1', [
      req.admin.sub,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Admin account not found' });
    const admin = rows[0];
    const valid = admin.password_hash ? await bcrypt.compare(currentPassword, admin.password_hash) : false;
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const nextHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [nextHash, admin.id]);
    await logActivity({
      actorName: admin.full_name,
      actorEmail: admin.email,
      actionType: 'UPDATE',
      entityType: 'auth',
      entityId: String(admin.id),
      details: 'Updated admin account password',
      ipAddress: req.ip || '127.0.0.1',
    });
    return res.json({ updated: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
