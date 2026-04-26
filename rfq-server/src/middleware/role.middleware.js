/**
 * Usage: requireRole('buyer') or requireRole('supplier')
 * Must be used after authMiddleware (req.user must exist)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access restricted to: ${roles.join(', ')}` });
  }
  next();
};

export default requireRole;