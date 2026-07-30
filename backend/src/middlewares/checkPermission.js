const pool = require('../config/db');

/**
 * Permission-based access control middleware.
 *
 * Usage: router.get('/route', auth, admin, checkPermission('orders.view'), handler)
 *
 * - Role 1 (superadmin) bypasses all permission checks.
 * - Role 2 (admin) with no department assigned → 403 (must be placed in a department).
 * - Role 2 with a department → passes only if the department has the required permission.
 *
 * Permissions are cached on req.adminPermissions for the lifetime of the request
 * to avoid repeated DB round-trips when multiple checkPermission calls chain.
 */
const checkPermission = (permissionKey) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  // Superadmin bypasses all permission checks
  if (req.user.role === 1) return next();

  try {
    // Load and cache user's permissions on the request object
    if (!req.adminPermissions) {
      const result = await pool.query(
        `SELECT p.key
         FROM permissions p
         JOIN department_permissions dp ON dp.permission_id = p.id
         JOIN users u ON u.department_id = dp.department_id
         WHERE u.id = $1`,
        [req.user.id]
      );

      // If user has no department, result will be empty
      req.adminPermissions = new Set(result.rows.map(r => r.key));
      req.adminDeptLoaded = true;
    }

    if (!req.adminPermissions.has(permissionKey)) {
      return res.status(403).json({
        message: 'Permission denied',
        required: permissionKey,
        hint: 'Contact your super-admin to grant this permission to your department.',
      });
    }

    next();
  } catch (err) {
    console.error('[checkPermission]', err.message);
    res.status(500).json({ message: 'Server error checking permissions' });
  }
};

module.exports = checkPermission;
