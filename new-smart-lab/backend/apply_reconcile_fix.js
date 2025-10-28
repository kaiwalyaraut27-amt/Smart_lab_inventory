const pool = require('./config/db');

async function run() {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node apply_reconcile_fix.js <item_id> <new_quantity> [admin_user_id]');
      process.exit(1);
    }
    const item_id = Number(args[0]);
    const newQty = Number(args[1]);
    const adminId = args[2] ? Number(args[2]) : null;

    console.log('Applying reconcile fix for item_id=', item_id, ' -> newQty=', newQty);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute('SELECT quantity FROM items WHERE item_id = ?', [item_id]);
      if (!rows || rows.length === 0) {
        throw new Error('Item not found: ' + item_id);
      }
      const oldQty = rows[0].quantity;

      await conn.execute('UPDATE items SET quantity = ? WHERE item_id = ?', [newQty, item_id]);

      // Try to write an audit/repair record into records table. Use NULL for request_id/user_id if not available.
      try {
        await conn.execute(
          `INSERT INTO records (request_id, user_id, item_id, quantity, return_date, returned_by, notes)
           VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
          [null, adminId, item_id, (newQty - oldQty), adminId, `Reconcile fix applied: ${oldQty} -> ${newQty}`]
        );
      } catch (e) {
        // If the records insert fails, still proceed but log warning.
        console.warn('Warning: could not insert records entry for reconciliation:', e.message);
      }

      // Append to approve_audit.log for traceability
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, 'logs', 'approve_audit.log');
        const entry = `[${new Date().toISOString()}] RECONCILE_FIX item_id=${item_id} old_qty=${oldQty} new_qty=${newQty} applied_by=${adminId}\n`;
        fs.appendFileSync(logPath, entry);
      } catch (e) {
        console.warn('Could not write to approve_audit.log:', e.message);
      }

      await conn.commit();
      console.log('Reconcile fix applied successfully. oldQty=', oldQty, ' newQty=', newQty);
    } catch (err) {
      await conn.rollback();
      console.error('Error applying reconcile fix:', err.message);
      process.exit(2);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(3);
  } finally {
    // allow process to exit
  }
}

run();
