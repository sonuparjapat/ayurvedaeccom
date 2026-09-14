const jwt  = require("jsonwebtoken");
const pool = require("../config/db");

/* One DB query: checks password invalidation + session revocation together */
async function _validateToken(decoded) {
  try {
    let query, params;
    if (decoded.sessionId) {
      query = `SELECT u.password_changed_at, s.revoked
                 FROM users u
                 LEFT JOIN user_sessions s ON s.id = $2::uuid AND s.user_id = u.id
                WHERE u.id = $1 LIMIT 1`;
      params = [decoded.id, decoded.sessionId];
    } else {
      query = 'SELECT password_changed_at FROM users WHERE id = $1 LIMIT 1';
      params = [decoded.id];
    }
    const r = await pool.query(query, params);
    if (!r.rows.length) return 'USER_DELETED';
    const row = r.rows[0];
    if (row.password_changed_at) {
      if (Math.floor(new Date(row.password_changed_at).getTime() / 1000) > decoded.iat)
        return 'PASSWORD_CHANGED';
    }
    if (row.revoked === true) return 'SESSION_REVOKED';
    return null; // valid
  } catch {
    return null; // DB error — don't block
  }
}

exports.auth = async (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reason  = await _validateToken(decoded);
    if (reason) {
      const msg = reason === 'SESSION_REVOKED'
        ? 'This session has been signed out. Please log in again.'
        : 'Session expired. Please log in again.';
      return res.status(401).json({ message: msg, code: reason });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }
    if (!token) { req.user = null; return next(); }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const reason  = await _validateToken(decoded);
    req.user = reason ? null : decoded;
  } catch {
    req.user = null;
  }
  next();
};