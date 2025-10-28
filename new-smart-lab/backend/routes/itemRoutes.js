const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const auth = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const {
  getItemsByLab,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  updateItemStock,
  getItemsBySubject,
} = itemsController;

// Routes
router.get('/:lab_id', auth, getItemsByLab);
router.get('/id/:item_id', auth, getItemById);
router.post('/', auth, roleMiddleware(['teacher', 'admin']), addItem);
router.put('/:item_id', auth, roleMiddleware(['teacher', 'admin']), updateItem);
router.delete('/:item_id', auth, roleMiddleware(['admin']), deleteItem);
router.get('/by-subject/:id', auth, getItemsBySubject);

// Admin: update stock
if (typeof updateItemStock === 'function') {
  router.put('/stock/update', auth, roleMiddleware(['admin']), updateItemStock);
}

module.exports = router;

