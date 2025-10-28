// backend/controllers/recordsController.js
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// ✅ Get all item records (admin/teacher)
const getAllRecords = asyncHandler(async (req, res) => {
  const [records] = await pool.execute(`
    SELECT 
      r.record_id,
      u.name AS user_name,
      u.email AS user_email,
      i.item_name,
      i.item_code,
      i.quantity AS current_stock,
      r.quantity AS quantity_issued,
      r.issue_date,
      r.return_date,
      r.notes,
      issued_by.name AS issued_by_name,
      returned_by.name AS returned_by_name
    FROM records r
    JOIN users u ON r.user_id = u.user_id
    JOIN items i ON r.item_id = i.item_id
    LEFT JOIN users issued_by ON r.issued_by = issued_by.user_id
    LEFT JOIN users returned_by ON r.returned_by = returned_by.user_id
    ORDER BY r.issue_date DESC, r.return_date DESC
  `);

  res.json({
    success: true,
    count: records.length,
    data: records,
  });
});

module.exports = { getAllRecords };
