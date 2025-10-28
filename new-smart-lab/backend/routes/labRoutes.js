// backend/routes/labRoutes.js
const express = require('express');
const router = express.Router();

const labsController = require('../controllers/labsController');
const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// ✅ Everyone (with login) can view labs of a subject
router.get('/:subject_id', auth, labsController.getLabsBySubject);

// ✅ Only teacher or admin can add a lab
router.post('/', auth, roleMiddleware(['teacher', 'admin']), labsController.addLab);

// ✅ Only admin can delete a lab
router.delete('/:lab_id', auth, roleMiddleware(['admin']), labsController.deleteLab);

module.exports = router;
