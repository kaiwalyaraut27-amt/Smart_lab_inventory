// backend/controllers/labsController.js
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// ✅ Get all labs for a subject
const getLabsBySubject = asyncHandler(async (req, res) => {
  const { subject_id } = req.params;

  // Debug: log incoming subject_id and query result count
  const [labs] = await pool.execute('SELECT * FROM labs WHERE subject_id = ?', [subject_id]);
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[labsController] getLabsBySubject subject_id=${subject_id}; labs_count=${labs.length}; lab_ids=${labs.map(l=>l.lab_id||l.id||l.labId).join(',')}`);
    } catch (e) {
      console.log('[labsController] debug log failed', e);
    }
  }

  res.json({ success: true, data: labs });
});

// ✅ Add new lab (teacher/admin only)
const addLab = asyncHandler(async (req, res) => {
  const { lab_name, subject_id } = req.body;

  if (!lab_name || !subject_id) {
    return res.status(400).json({ success: false, message: 'Please fill all fields' });
  }

  const created_by = req.user ? req.user.user_id : null; // ✅ fixed

  console.log('🧩 Debug:', { lab_name, subject_id, created_by }); // keep this for confirmation

  await pool.execute(
    'INSERT INTO labs (lab_name, subject_id, created_by) VALUES (?, ?, ?)',
    [lab_name, subject_id, created_by]
  );

  res.status(201).json({ success: true, message: 'Lab added successfully' });
});

// ✅ Delete lab (admin only)
const deleteLab = asyncHandler(async (req, res) => {
  const { lab_id } = req.params;

  await pool.execute('DELETE FROM labs WHERE lab_id = ?', [lab_id]);
  res.json({ success: true, message: 'Lab deleted successfully' });
});

module.exports = {
  getLabsBySubject,
  addLab,
  deleteLab
};
