const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/debug/item?name=esp 32
router.get('/item', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ success: false, message: 'name query param required' });

  try {
    // find all items that match exactly or by LIKE
    const [exact] = await pool.execute('SELECT * FROM items WHERE LOWER(item_name) = LOWER(?)', [name]);
    const [like] = await pool.execute('SELECT * FROM items WHERE LOWER(item_name) LIKE LOWER(?)', ['%' + name + '%']);
    // merge unique items (by item_id)
    const itemsMap = new Map();
    for (const it of [...exact, ...like]) itemsMap.set(it.item_id, it);
    const items = Array.from(itemsMap.values());
    if (items.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });

    // For each matching item, fetch its requests and aggregates
    const details = [];
    for (const item of items) {
      const [requests] = await pool.execute('SELECT * FROM requests WHERE item_id = ? ORDER BY request_date DESC', [item.item_id]);
      const [agg] = await pool.execute(
        `SELECT status, SUM(quantity) AS total_qty, COUNT(*) AS count
         FROM requests WHERE item_id = ? GROUP BY status`,
        [item.item_id]
      );
      details.push({ item, requests, aggregates: agg });
    }

    return res.json({ success: true, matches: details });
  } catch (err) {
    console.error('[debugRoutes] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/debug/fix-negatives
// One-time helper to clamp negative item quantities to zero. Only available in non-production debug mode.
router.post('/fix-negatives', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });
  try {
    const [before] = await pool.execute('SELECT item_id, item_name, quantity FROM items WHERE quantity < 0');
    if (!before || before.length === 0) return res.json({ success: true, fixed: 0, items: [] });
    for (const it of before) {
      await pool.execute('UPDATE items SET quantity = 0 WHERE item_id = ?', [it.item_id]);
    }
    return res.json({ success: true, fixed: before.length, items: before });
  } catch (err) {
    console.error('[debugRoutes.fix-negatives] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// GET /api/debug/triggers - list triggers on the items table (non-production only)
router.get('/triggers', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });
  try {
    const dbName = process.env.DB_NAME || 'new_smart_inventory';
    const [rows] = await pool.execute(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_STATEMENT, CREATED
       FROM information_schema.TRIGGERS
       WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = ?`,
      [dbName, 'items']
    );
    return res.json({ success: true, triggers: rows });
  } catch (err) {
    console.error('[debugRoutes.triggers] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

