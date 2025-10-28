// backend/controllers/requestsController.js
const asyncHandler = require('express-async-handler');
const pool = require('../config/db');

// ✅ Create a new item request (student)
const createRequest = asyncHandler(async (req, res) => {
  const { item_id, quantity } = req.body;
  if (!item_id || !quantity)
    return res.status(400).json({ success: false, message: 'item_id and quantity are required' });

  const user_id = req.user.user_id;

  await pool.execute(
    'INSERT INTO requests (user_id, item_id, quantity, status) VALUES (?, ?, ?, ?)',
    [user_id, item_id, quantity, 'pending']
  );

  res.status(201).json({ success: true, message: 'Request submitted successfully' });
});

// ✅ View all requests (admin/teacher)
const getAllRequests = asyncHandler(async (req, res) => {
  const [requests] = await pool.execute(`
    SELECT r.request_id, r.item_id, u.name AS student_name, i.item_name, r.quantity, r.status, r.request_date
    FROM requests r
    JOIN users u ON r.user_id = u.user_id
    JOIN items i ON r.item_id = i.item_id
    ORDER BY r.request_date DESC
  `);

  res.json({ success: true, data: requests });
});

/// ✅ Final & Safe: Approve Request with correct stock handling
const approveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, message: 'Request ID is required' });

  const user = req.user;
  if (!user)
    return res.status(401).json({ success: false, message: 'User not authenticated' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 🔒 Lock the request row
    const [reqRows] = await conn.execute(
      'SELECT * FROM requests WHERE request_id = ? FOR UPDATE',
      [id]
    );
    if (reqRows.length === 0)
      throw new Error('Request not found');
    const request = reqRows[0];

    // 🧩 Prevent double approval
    if (request.status === 'approved')
      throw new Error('Request already approved');

    // 🔒 Lock the item row
    const [itemRows] = await conn.execute(
      'SELECT * FROM items WHERE item_id = ? FOR UPDATE',
      [request.item_id]
    );
    if (itemRows.length === 0)
      throw new Error('Item not found');

    // ✅ Parse numbers safely
    const currentStock = parseInt(itemRows[0].quantity, 10);
    const reqQty = parseInt(request.quantity, 10);

    if (isNaN(currentStock) || isNaN(reqQty)) {
      throw new Error(`Invalid stock values (current: ${itemRows[0].quantity}, req: ${request.quantity})`);
    }

    if (currentStock < reqQty) {
      throw new Error(`Not enough stock. Available: ${currentStock}`);
    }

    // ✅ Compute exact new stock manually
    const newStock = currentStock - reqQty;

    console.log(`🧮 Approving request ${id}: ${currentStock} - ${reqQty} = ${newStock}`);

    // ✅ Explicitly set new quantity (no math in SQL)
    await conn.execute(
      'UPDATE items SET quantity = ? WHERE item_id = ?',
      [newStock, request.item_id]
    );

    // ✅ Update request status
    await conn.execute(
      'UPDATE requests SET status = ?, processed_by = ? WHERE request_id = ?',
      ['approved', user.user_id, id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: `Request approved successfully. Stock: ${currentStock} → ${newStock}`,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[approveRequest] error:', err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});


// ✅ Deny request
const denyRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, message: 'Request ID is required' });

  await pool.execute('UPDATE requests SET status = ? WHERE request_id = ?', ['denied', id]);
  res.json({ success: true, message: 'Request denied' });
});

// ✅ Return Item → Increase stock back
const returnItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, message: 'Request ID is required' });

  const processed_by = req.user?.user_id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Lock and get request info (FOR UPDATE protects against concurrent processing)
    const [reqRows] = await conn.execute('SELECT * FROM requests WHERE request_id = ? FOR UPDATE', [id]);
    const request = reqRows[0];
    if (!request) throw new Error('Request not found');

    if (request.status === 'returned')
      throw new Error('Request already returned');

    // Only allow returns for previously approved requests. Returning a pending/denied request
    // would incorrectly increase stock that was never decremented.
    if (request.status !== 'approved')
      throw new Error('Only approved requests can be returned');

    // 2️⃣ Lock and fetch the item row
    const [itemRows] = await conn.execute('SELECT * FROM items WHERE item_id = ? FOR UPDATE', [request.item_id]);
    if (itemRows.length === 0) throw new Error('Item not found');
    const item = itemRows[0];

    // Debug: log quantities before returning
    console.log(`[returnItem] request_id=${id} item_id=${request.item_id} current_item_qty=${item.quantity} return_qty=${request.quantity}`);

    // 3️⃣ Update request status
    await conn.execute(
      'UPDATE requests SET status = ?, processed_by = ? WHERE request_id = ?',
      ['returned', processed_by ?? null, id]
    );

    // 4️⃣ Increase stock
    await conn.execute(
      'UPDATE items SET quantity = quantity + ? WHERE item_id = ?',
      [request.quantity, request.item_id]
    );

    // 5️⃣ Log record
    await conn.execute(
      `INSERT INTO records (request_id, user_id, item_id, quantity, return_date, returned_by, notes)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
      [id, request.user_id, request.item_id, request.quantity, processed_by ?? null, 'Returned by student']
    );

    // Log after update
    const [afterRows] = await conn.execute('SELECT quantity FROM items WHERE item_id = ?', [request.item_id]);
    console.log(`[returnItem] after update item_id=${request.item_id} new_qty=${afterRows[0]?.quantity}`);

    await conn.commit();
    res.json({ success: true, message: `Item returned. Stock increased by ${request.quantity}.` });
  } catch (err) {
    await conn.rollback();
    console.error('[returnItem] error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// ✅ Get student's requests
async function getMyRequests(req, res) {
  try {
    const user_id = req.user?.user_id;
    if (!user_id)
      return res.status(401).json({ success: false, message: 'Not authenticated' });

    const [requests] = await pool.execute(
      `SELECT r.request_id, i.item_name, r.quantity, r.status, r.request_date
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       WHERE r.user_id = ?
       ORDER BY r.request_date DESC`,
      [user_id]
    );

    return res.json({ success: true, data: requests });
  } catch (err) {
    console.error('[getMyRequests] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ✅ Reset all requests (admin)
async function resetAllRequests(req, res) {
  const adminId = req.user?.user_id || null;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [requests] = await conn.execute('SELECT * FROM requests WHERE status != ?', ['returned']);

    for (const r of requests) {
      await conn.execute('UPDATE items SET quantity = quantity + ? WHERE item_id = ?', [
        r.quantity,
        r.item_id,
      ]);

      await conn.execute(
        `INSERT INTO records (request_id, user_id, item_id, quantity, return_date, returned_by, notes)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [r.request_id, r.user_id, r.item_id, r.quantity, adminId, 'Admin reset return']
      );
    }

    await conn.execute('DELETE FROM requests');
    await conn.commit();

    res.json({ success: true, message: 'All requests reset and stock restored' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[resetAllRequests] error:', err);
    res.status(500).json({ success: false, message: 'Server error while resetting requests' });
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  denyRequest,
  returnItem,
  resetAllRequests,
};
