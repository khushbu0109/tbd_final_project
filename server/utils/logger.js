import { query } from '../db.js';

export async function logActivity({
  actorName = 'Executive Admin',
  actorEmail = 'admin@tbdwellness.com',
  actionType,
  entityType,
  entityId = null,
  details,
  ipAddress = null,
}) {
  try {
    await query(
      `INSERT INTO activity_logs (actor_name, actor_email, action_type, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorName,
        actorEmail,
        actionType,
        entityType,
        entityId ? String(entityId) : null,
        String(details).slice(0, 250),
        ipAddress,
      ]
    );
  } catch (err) {
    console.warn('[ActivityLog skipped]', err.message);
  }
}

export function getActor(req) {
  return {
    actorName: req.admin?.name || 'Executive Admin',
    actorEmail: req.admin?.email || 'admin@tbdwellness.com',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
  };
}
