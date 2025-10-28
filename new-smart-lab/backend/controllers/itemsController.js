// backend/controllers/itemsController.js
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// ✅ Get all items in a lab
const getItemsByLab = asyncHandler(async (req, res) => {
  const { lab_id } = req.params;
  const [items] = await pool.execute('SELECT * FROM items WHERE lab_id = ?', [lab_id]);
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[itemsController] getItemsByLab lab_id=${lab_id}; items_count=${items.length}; item_ids=${items.map(i=>i.item_id||i.id||i.itemId).join(',')}`);
    } catch (e) {
      console.log('[itemsController] debug log failed', e);
    }
  }

  res.json({ success: true, data: items });
});

// ✅ Add new item
const addItem = asyncHandler(async (req, res) => {
  const { item_name, quantity, lab_id } = req.body;

  if (!item_name || !quantity) {
    return res.status(400).json({ success: false, message: 'Please fill item_name and quantity' });
  }

  // If lab_id provided (truthy), include it, otherwise insert without lab_id (allow NULL lab association)
  if (lab_id) {
    await pool.execute(
      'INSERT INTO items (item_name, quantity, lab_id) VALUES (?, ?, ?)',
      [item_name, quantity, lab_id]
    );
  } else {
    // Some schemas may not allow lab_id null; this tries to insert without lab_id column when not provided.
    await pool.execute(
      'INSERT INTO items (item_name, quantity) VALUES (?, ?)',
      [item_name, quantity]
    );
  }

  res.status(201).json({ success: true, message: 'Item added successfully' });
});
// ✅ Get items by subject (via labs)
const getItemsBySubject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.execute(
    `SELECT i.item_id, i.item_name, i.quantity, l.lab_name, s.subject_name
     FROM items i
     JOIN labs l ON i.lab_id = l.lab_id
     JOIN subjects s ON l.subject_id = s.subject_id
     WHERE s.subject_id = ?`,
    [id]
  );

  res.json({ success: true, data: rows });
});


// ✅ Update item quantity
const updateItem = asyncHandler(async (req, res) => {
  const { item_id } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ success: false, message: 'Please provide a valid quantity' });
  }

  await pool.execute('UPDATE items SET quantity = ? WHERE item_id = ?', [quantity, item_id]);
  res.json({ success: true, message: 'Item quantity updated successfully' });
});

// ✅ Delete item
const deleteItem = asyncHandler(async (req, res) => {
  const { item_id } = req.params;
  await pool.execute('DELETE FROM items WHERE item_id = ?', [item_id]);
  res.json({ success: true, message: 'Item deleted successfully' });
});

// ✅ Increase or decrease item quantity (Admin only)
const updateItemStock = asyncHandler(async (req, res) => {
  const { item_id, amount } = req.body;

  if (!item_id || amount === undefined) {
    return res.status(400).json({
      success: false,
      message: "item_id and amount are required",
    });
  }

  // Update the item quantity safely
  await pool.execute(
    "UPDATE items SET quantity = quantity + ?, updated_at = NOW() WHERE item_id = ?",
    [amount, item_id]
  );

  res.json({ success: true, message: "Item stock updated successfully" });
});

// ✅ Get single item by ID
const getItemById = asyncHandler(async (req, res) => {
  const { item_id } = req.params;
  if (!item_id) return res.status(400).json({ success: false, message: 'item_id required' });
  const [rows] = await pool.execute('SELECT * FROM items WHERE item_id = ?', [item_id]);
  if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
  res.json({ success: true, data: rows[0] });
});

module.exports = {
  getItemsByLab,
  addItem,
  updateItem,
  deleteItem,
  updateItemStock, // ✅ add export
  getItemsBySubject,
  getItemById,
};
