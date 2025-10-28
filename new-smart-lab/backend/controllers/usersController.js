// backend/controllers/usersController.js
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// GET /api/users  →  list all users
const getUsers = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT user_id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
});

// GET /api/users/:id  →  single user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.execute(
    'SELECT user_id, name, email, role, phone, created_at FROM users WHERE user_id = ?',
    [id]
  );

  if (!rows.length) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(rows[0]);
});

// ✅  correct export
module.exports = {
  getUsers,
  getUserById,
};
