// ✅ backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const pool = require("../config/db");

// ✅ Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ✅ User registration
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Debug: log incoming payload (avoid logging passwords in production)
  console.log('[authController] registerUser payload:', { name, email, role });

  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all fields" });
  }

  // Check if user already exists
  let existing;
  try {
    [existing] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
  } catch (dbErr) {
    console.error('[authController] DB error during user lookup:', dbErr);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
  if (existing.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  let result;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user
    [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );
  } catch (dbErr) {
    console.error('[authController] DB error during insert:', dbErr);
    return res.status(500).json({ success: false, message: 'Database error' });
  }

  // ✅ Define user properly *after* insert
  const user = {
    user_id: result.insertId,
    name,
    email,
    role,
  };

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: "Signup successful!",
    token,
    user,
  });
});

// ✅ Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all fields" });
  }

  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  const user = rows[0];

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: "Login successful!",
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = { registerUser, loginUser };
