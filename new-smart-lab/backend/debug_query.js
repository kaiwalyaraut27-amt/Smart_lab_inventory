const pool = require('./config/db');

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node debug_query.js <item_id|item_name>');
    process.exit(1);
  }

  let itemRows;
  if (/^\d+$/.test(arg)) {
    // numeric -> treat as id
    [itemRows] = await pool.execute('SELECT * FROM items WHERE item_id = ?', [arg]);
  } else {
    [itemRows] = await pool.execute('SELECT * FROM items WHERE LOWER(item_name) = LOWER(?)', [arg]);
    if (itemRows.length === 0) {
      // try LIKE match
      [itemRows] = await pool.execute('SELECT * FROM items WHERE LOWER(item_name) LIKE LOWER(?)', ['%' + arg + '%']);
    }
  }

  if (!itemRows || itemRows.length === 0) {
    console.error('Item not found for', arg);
    process.exit(2);
  }

  const item = itemRows[0];
  console.log('== Item ==');
  console.log(item);

  // Fetch requests for this item
  const [requests] = await pool.execute('SELECT * FROM requests WHERE item_id = ? ORDER BY request_date DESC', [item.item_id]);
  console.log('\n== Requests for item_id=' + item.item_id + ' (latest first) ==');
  console.log(requests);

  // Aggregate quantities by status
  const [agg] = await pool.execute(
    `SELECT status, SUM(quantity) AS total_qty, COUNT(*) AS count
     FROM requests WHERE item_id = ? GROUP BY status`,
    [item.item_id]
  );
  console.log('\n== Aggregates by status ==');
  console.log(agg);

  // Compute effective available if we assume stock = item.quantity and approved reduces it
  // Show current DB item.quantity and what it would be if we subtracted all approved quantities
  const approved = agg.find(a => a.status === 'approved')?.total_qty || 0;
  const pending = agg.find(a => a.status === 'pending')?.total_qty || 0;
  console.log(`\nCurrent item.quantity = ${item.quantity}`);
  console.log(`Sum approved requests = ${approved}`);
  console.log(`Sum pending requests = ${pending}`);
  console.log(`If you subtract only approved: available = ${item.quantity}`);
  console.log(`(Note: DB item.quantity should already reflect approved deductions.)`);

  process.exit(0);
}

main().catch(err => {
  console.error('debug_query error:', err);
  process.exit(99);
});
