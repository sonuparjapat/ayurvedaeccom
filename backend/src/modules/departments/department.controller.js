const pool = require('../../config/db');

/* ─── GET /admin/my-permissions ──────────────────────────────────────────────
   Returns the current admin user's permissions array.
   Superadmin (role 1) gets a special '*' marker in addition to all keys.
*/
exports.getMyPermissions = async (req, res) => {
  try {
    if (req.user.role === 1) {
      // Superadmin: fetch every permission key in the system
      const all = await pool.query(`SELECT key FROM permissions ORDER BY group_name, key`);
      return res.json({
        success: true,
        isSuperAdmin: true,
        permissions: all.rows.map(r => r.key),
        department: null,
      });
    }

    const result = await pool.query(
      `SELECT p.key, p.label, p.group_name,
              d.id AS dept_id, d.name AS dept_name
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN department_permissions dp ON dp.department_id = d.id
       LEFT JOIN permissions p ON p.id = dp.permission_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const permissions = result.rows
      .filter(r => r.key)
      .map(r => r.key);

    const dept = result.rows[0]?.dept_id
      ? { id: result.rows[0].dept_id, name: result.rows[0].dept_name }
      : null;

    res.json({ success: true, isSuperAdmin: false, permissions, department: dept });
  } catch (err) {
    console.error('[getMyPermissions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── GET /admin/departments ─────────────────────────────────────────────── */
exports.listDepartments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
             COUNT(dp.permission_id) AS permission_count,
             COUNT(u.id) AS user_count
      FROM departments d
      LEFT JOIN department_permissions dp ON dp.department_id = d.id
      LEFT JOIN users u ON u.department_id = d.id AND u.role = 2
      GROUP BY d.id
      ORDER BY d.created_at ASC
    `);
    res.json({ success: true, departments: result.rows });
  } catch (err) {
    console.error('[listDepartments]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── POST /admin/departments ────────────────────────────────────────────── */
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const deptRes = await client.query(
        `INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *`,
        [name.trim(), description?.trim() || null]
      );
      const dept = deptRes.rows[0];

      if (permissions.length > 0) {
        const permRes = await client.query(
          `SELECT id FROM permissions WHERE key = ANY($1)`,
          [permissions]
        );
        for (const p of permRes.rows) {
          await client.query(
            `INSERT INTO department_permissions (department_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [dept.id, p.id]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, department: dept });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Department name already exists' });
    console.error('[createDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── PUT /admin/departments/:id ─────────────────────────────────────────── */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const result = await pool.query(
      `UPDATE departments SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         is_active = COALESCE($3, is_active),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name?.trim() || null, description?.trim() || null, is_active, id]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, department: result.rows[0] });
  } catch (err) {
    console.error('[updateDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── DELETE /admin/departments/:id ──────────────────────────────────────── */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Unlink users from this department first (set to null)
    await pool.query(`UPDATE users SET department_id = NULL WHERE department_id = $1`, [id]);

    const result = await pool.query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Department not found' });

    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    console.error('[deleteDepartment]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── GET /admin/departments/:id/permissions ─────────────────────────────── */
exports.getDepartmentPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const [allPerms, deptPerms] = await Promise.all([
      pool.query(`SELECT * FROM permissions ORDER BY group_name, label`),
      pool.query(
        `SELECT p.key FROM permissions p
         JOIN department_permissions dp ON dp.permission_id = p.id
         WHERE dp.department_id = $1`,
        [id]
      ),
    ]);

    const assigned = new Set(deptPerms.rows.map(r => r.key));

    // Group all permissions
    const grouped = {};
    for (const p of allPerms.rows) {
      if (!grouped[p.group_name]) grouped[p.group_name] = [];
      grouped[p.group_name].push({ ...p, assigned: assigned.has(p.key) });
    }

    res.json({ success: true, grouped, assignedKeys: [...assigned] });
  } catch (err) {
    console.error('[getDepartmentPermissions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── PUT /admin/departments/:id/permissions ─────────────────────────────── */
exports.setDepartmentPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions = [] } = req.body; // array of permission keys

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Wipe existing permissions for this department
      await client.query(`DELETE FROM department_permissions WHERE department_id = $1`, [id]);

      if (permissions.length > 0) {
        const permRes = await client.query(
          `SELECT id FROM permissions WHERE key = ANY($1)`,
          [permissions]
        );
        for (const p of permRes.rows) {
          await client.query(
            `INSERT INTO department_permissions (department_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, p.id]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Permissions updated', count: permissions.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[setDepartmentPermissions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── PUT /admin/users/:id/department ───────────────────────────────────── */
exports.assignUserDepartment = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const { department_id } = req.body; // null to remove

    const result = await pool.query(
      `UPDATE users SET department_id = $1 WHERE id = $2 AND role = 2 RETURNING id, name, email, department_id`,
      [department_id || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('[assignUserDepartment]', err.message);
    if (err.code === '23503') {
      return res.status(400).json({ success: false, message: 'Department does not exist' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── GET /admin/permissions/all ─────────────────────────────────────────── */
exports.getAllPermissions = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM permissions ORDER BY group_name, label`);

    const grouped = {};
    for (const p of result.rows) {
      if (!grouped[p.group_name]) grouped[p.group_name] = [];
      grouped[p.group_name].push(p);
    }

    res.json({ success: true, permissions: result.rows, grouped });
  } catch (err) {
    console.error('[getAllPermissions]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── POST /admin/permissions ─────────────────────────────────────────────── */
exports.createPermission = async (req, res) => {
  try {
    const { key, label, group_name, description } = req.body;
    if (!key?.trim() || !label?.trim() || !group_name?.trim()) {
      return res.status(400).json({ success: false, message: 'key, label, and group_name are required' });
    }
    const result = await pool.query(
      `INSERT INTO permissions (key, label, group_name, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [key.trim().toLowerCase(), label.trim(), group_name.trim(), description?.trim() || null]
    );
    res.status(201).json({ success: true, permission: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Permission key already exists' });
    console.error('[createPermission]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── PUT /admin/permissions/:id ──────────────────────────────────────────── */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, group_name, description } = req.body;
    const result = await pool.query(
      `UPDATE permissions SET
         label = COALESCE($1, label),
         group_name = COALESCE($2, group_name),
         description = COALESCE($3, description)
       WHERE id = $4 RETURNING *`,
      [label?.trim() || null, group_name?.trim() || null, description?.trim() || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Permission not found' });
    res.json({ success: true, permission: result.rows[0] });
  } catch (err) {
    console.error('[updatePermission]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ─── DELETE /admin/permissions/:id ──────────────────────────────────────── */
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await pool.query(
      `SELECT COUNT(*) FROM department_permissions WHERE permission_id = $1`, [id]
    );
    if (Number(inUse.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Permission is assigned to departments. Remove it from all departments first.' });
    }
    const result = await pool.query(`DELETE FROM permissions WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Permission not found' });
    res.json({ success: true, message: 'Permission deleted' });
  } catch (err) {
    console.error('[deletePermission]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
