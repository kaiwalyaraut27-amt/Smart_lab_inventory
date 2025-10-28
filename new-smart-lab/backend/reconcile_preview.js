// Reconciliation preview (read-only)
// Prints for each item: current quantity, total_approved, total_returned, net_approved, computed_initial
// computed_initial = current + total_approved - total_returned

const pool = require('./config/db');

async function run() {
  try {
    const [items] = await pool.execute('SELECT item_id, item_name, quantity FROM items');
    console.log('Found', items.length, 'items');

    for (const it of items) {
      const itemId = it.item_id;
      const [approvedRows] = await pool.execute(
        "SELECT IFNULL(SUM(quantity),0) AS total_approved FROM requests WHERE item_id = ? AND status = 'approved'",
        [itemId]
      );
      const [returnedRows] = await pool.execute(
        "SELECT IFNULL(SUM(quantity),0) AS total_returned FROM requests WHERE item_id = ? AND status = 'returned'",
        [itemId]
      );

      const totalApproved = Number(approvedRows[0]?.total_approved || 0);
      const totalReturned = Number(returnedRows[0]?.total_returned || 0);
      const net = totalApproved - totalReturned;
      const current = Number(it.quantity || 0);
      const computedInitial = current + totalApproved - totalReturned; // solve initial = current + approved - returned

      const inconsistent = computedInitial < 0 || current < 0 || totalReturned < 0 || totalApproved < 0;

      console.log('------------------------------------------------------------');
      console.log(`Item ${itemId} - ${it.item_name}`);
      console.log(`  current_quantity: ${current}`);
      console.log(`  total_approved:   ${totalApproved}`);
      console.log(`  total_returned:   ${totalReturned}`);
      console.log(`  net (approved - returned): ${net}`);
      console.log(`  computed_initial (current + approved - returned): ${computedInitial}`);
      console.log(`  inconsistent?: ${inconsistent ? 'YES' : 'no'}`);

      // Provide suggested correction heuristics (read-only):
      // If computedInitial >= 0, we can suggest that initial stock was computedInitial and current should be initial - (approved-after-baseline)
      // But without timeline, a safe suggestion is to set current to Math.max(0, computedInitial) only if inconsistency detected and admin confirms.
      if (inconsistent) {
        console.log('  SUGGESTION: Data inconsistent. Review request history for this item.');
      } else {
        console.log('  SUGGESTION: No obvious inconsistency detected.');
      }
    }

    console.log('------------------------------------------------------------');
    console.log('Preview complete. No data was modified.');
  } catch (err) {
    console.error('Error during reconcile preview:', err);
  } finally {
    try { await pool.end(); } catch(e){}
    process.exit(0);
  }
}

run();
