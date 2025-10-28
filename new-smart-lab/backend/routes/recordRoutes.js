// backend/routes/recordRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getAllRecords } = require('../controllers/recordsController');

// ✅ GET all transaction records (admin or teacher)
router.get('/', auth, roleMiddleware(['admin', 'teacher']), getAllRecords);

module.exports = router;
