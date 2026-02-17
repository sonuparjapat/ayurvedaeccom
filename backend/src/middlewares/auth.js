const jwt = require("jsonwebtoken")

exports.auth = (req, res, next) => {
console.log(req.cookies.userToken,"request coming")
  const token =
    req.cookies.adminToken ||
    req.cookies.userToken

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