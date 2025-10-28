const express = require('express');
const router = express.Router();
const { getMonthlyReport } = require('../controllers/reportsController');
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');

router.get('/monthly', auth, role(['admin','teacher']), getMonthlyReport);

module.exports = router;
