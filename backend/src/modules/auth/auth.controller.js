const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");

exports.register = async (req, res) => {

  const { name, email, password } = req.body;

  try {

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users VALUES($1,$2,$3,$4,$5)`,
      [uuid(), name, email, hash, "USER"]
    );

    res.json({ message: "Registered Successfully" });

  } catch {
    res.status(400).json({ error: "Email already exists" });
  }
};


exports.login = async (req, res) => {

  const { email, password } = req.body;

  const result = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  if (!result.rows.length)
    return res.status(401).json({ error: "Invalid Credentials" });

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ error: "Invalid Credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });

};