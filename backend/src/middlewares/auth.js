

const jwt=require("jsonwebtoken")
module.exports = (req, res, next) => {

  const token = req.cookies.adminToken

console.log(token,"token coming")
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded
    next()

  } catch (err) {
    console.log(err,"error")
    res.status(401).json({ message: 'Invalid token' })
  }
}