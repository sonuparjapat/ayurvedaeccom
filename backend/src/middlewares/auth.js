const jwt = require("jsonwebtoken")

exports.auth = (req, res, next) => {

  const token =
    req.cookies.token

  if (!token)
    return res.status(401).json({ message: "Unauthorized" })

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.user = decoded

    next()

  } catch (err) {

    return res.status(401).json({ message: "Invalid Token" })
  }
}

exports.optionalAuth = (req, res, next) => {

  const token = req.cookies.token;

  // If no token → continue as guest
  if (!token) {
    req.user = null;
    return next();
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

  } catch (err) {

    // Invalid token → treat as guest
    req.user = null;
  }

  next();
};