// backend/routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getMyRequests } = require('../controllers/requestsController');

// Use the `auth` middleware exported from authMiddleware.js (not a named `protect` export)
router.get('/mine', auth, getMyRequests);

const {
  createRequest,
  getAllRequests,
  approveRequest,
  denyRequest,
  returnItem
  , resetAllRequests
} = require('../controllers/requestsController');

// 🧩 Student can create a new request
router.post('/', auth, roleMiddleware(['student']), createRequest);

// 🧩 Admin/Teacher can view all requests
router.get('/', auth, roleMiddleware(['teacher', 'admin']), getAllRequests);

// 🧩 Approve request
router.put('/:id/approve', auth, roleMiddleware(['teacher', 'admin']), approveRequest);

// 🧩 Deny request
router.put('/:id/deny', auth, roleMiddleware(['teacher', 'admin']), denyRequest);

// 🧩 Mark returned (students may return their own approved requests; teachers/admins may mark returns too)
router.put('/:id/return', auth, roleMiddleware(['student', 'teacher', 'admin']), returnItem);

// 🧹 Admin: reset all requests (mass return + clear)
router.put('/reset', auth, roleMiddleware(['admin']), resetAllRequests);

module.exports = router;
