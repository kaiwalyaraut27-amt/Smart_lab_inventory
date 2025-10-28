const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

const auth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    console.log('🔑 Token received:', token);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🧩 Decoded token:', decoded);

      // ✅ Validate the token payload
      if (!decoded || !decoded.user_id) {
        console.log('❌ Invalid token payload:', decoded);
        return res.status(401).json({ success: false, message: 'Invalid token payload' });
      }

      // ✅ Fetch user from database safely
      const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [decoded.user_id || null]);

      if (rows.length === 0) {
        console.log('❌ No user found for ID:', decoded.user_id);
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = rows[0];
      console.log('✅ Authenticated user:', req.user.user_id, req.user.email);
      next();
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } else {
    console.log('❌ No Authorization header found');
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
});

module.exports = auth;
