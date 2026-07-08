const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid Token"
    });
  }
};

exports.optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies.token;
if (!token && req.headers.authorization) {
  token = req.headers.authorization.replace('Bearer ', '');
}
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

  } catch (err) {
    req.user = null;
  }

  next();
};