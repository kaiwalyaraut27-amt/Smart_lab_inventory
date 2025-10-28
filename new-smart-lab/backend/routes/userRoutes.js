// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getUsers, getUserById } = require('../controllers/usersController');

router.get('/', auth, roleMiddleware(['admin']), getUsers);
router.get('/:id', auth, roleMiddleware(['admin']), getUserById);

module.exports = router;
