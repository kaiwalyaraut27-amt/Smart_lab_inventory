// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import the controller correctly
const { registerUser, loginUser } = require('../controllers/authController');

// ✅ Define the routes
router.post('/signup', registerUser);
router.post('/login', loginUser);

module.exports = router;
