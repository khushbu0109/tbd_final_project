import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vishant_gts_tbd';
const JWT_EXPIRES_IN = '24h';

export function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role_key || 'super_admin',
      name: admin.full_name || 'Executive Admin',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}
