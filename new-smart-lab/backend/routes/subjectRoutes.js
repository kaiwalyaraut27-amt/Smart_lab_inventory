// backend/routes/subjectRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getSubjects, addSubject } = require('../controllers/subjectsController');

// ✅ DEBUG LOG
console.log('🧩 Route Handlers:', {
  auth: typeof auth,
  roleMiddleware: typeof roleMiddleware,
  getSubjects: typeof getSubjects,
  addSubject: typeof addSubject,
});

// Routes
router.get('/', auth, getSubjects);
router.post('/', auth, roleMiddleware(['admin', 'teacher']), addSubject);

// Alternate add route kept for compatibility (uses same auth + role middleware)
router.post('/add', auth, roleMiddleware(['admin', 'teacher']), addSubject);

module.exports = router;
