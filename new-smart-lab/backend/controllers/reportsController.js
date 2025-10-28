const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// GET /api/reports/monthly?year=2025&month=10
const getMonthlyReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!year || !month) {
    res.status(400);
    throw new Error('year and month are required query params, e.g. ?year=2025&month=10');
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('CALL sp_get_monthly_report(?, ?)', [year, month]);
    // Note: mysql2 returns an array: [ [rows], [other], ... ] so the first element is our resultset
    // If using pool.execute may return different shape; ensure we return the first result set
    const resultRows = Array.isArray(rows) && rows.length ? rows[0] || rows : rows;
    // But mysql2 sometimes returns [ [rows], [meta] ], when using conn.query with CALL it's [ [rows], [meta] ]
    // To be safe:
    let actual = rows;
    if (Array.isArray(rows) && Array.isArray(rows[0])) actual = rows[0];

    res.json({ success: true, data: actual });
  } finally {
    conn.release();
  }
});

module.exports = { getMonthlyReport };
