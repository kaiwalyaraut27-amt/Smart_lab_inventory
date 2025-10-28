// backend/controllers/subjectsController.js
const pool = require('../config/db');
const asyncHandler = require('express-async-handler');

// ✅ Controller: Get all subjects
const getSubjects = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM subjects');
  // Debug log to help diagnose empty responses in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const userInfo = req.user ? `${req.user.user_id}(${req.user.email}) role=${req.user.role}` : 'unauthenticated';
      console.log(`[subjectsController] request by: ${userInfo}; subjects_count=${rows.length}`);
    } catch (e) {
      console.log('[subjectsController] debug log failed', e);
    }
  }
  res.status(200).json({ success: true, subjects: rows });
});

// ✅ Controller: Add a new subject
const addSubject = asyncHandler(async (req, res) => {
  let { subject_id, subject_name, subject_code, description } = req.body;

  if (!subject_name) {
    return res.status(400).json({ success: false, message: 'Please provide subject_name' });
  }

  // Note: some deployments use a minimal `subjects` table without `subject_code`/`description` columns.
  // To remain compatible, insert only into columns that are guaranteed to exist: `subject_name` and optional `subject_id`.
  if (subject_id) {
    await pool.execute(
      'INSERT INTO subjects (subject_id, subject_name) VALUES (?, ?)',
      [subject_id, subject_name]
    );
  } else {
    await pool.execute(
      'INSERT INTO subjects (subject_name) VALUES (?)',
      [subject_name]
    );
  }

  res.status(201).json({ success: true, message: 'Subject added successfully' });
});

module.exports = {
  getSubjects,
  addSubject,
};
