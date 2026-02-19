const jwt = require("jsonwebtoken")

exports.admin  = (req, res, next) => {

  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
console.log(decoded,"decoded")
    if (![1,2].includes(Number(decoded.role))) {
      return res.status(403).json({ message: "Access denied" })
    }

    req.admin = decoded
    next()

  } catch {
    return res.status(401).json({ message: "Invalid token" })
  }
}