// One-time fix script: set any negative item.quantity to 0
// Usage: node fix_negative_quantities.js

const pool = require('./config/db');

async function run() {
  try {
    const [negatives] = await pool.execute('SELECT item_id, item_name, quantity FROM items WHERE quantity < 0');
    if (negatives.length === 0) {
      console.log('No negative quantities found.');
      return;
    }
    console.log('Items with negative quantities:', negatives.length);
    for (const it of negatives) {
      console.log(`  Fixing item_id=${it.item_id} (${it.item_name}) quantity=${it.quantity} -> 0`);
      await pool.execute('UPDATE items SET quantity = 0 WHERE item_id = ?', [it.item_id]);
    }
    console.log('Done fixing negative quantities.');
  } catch (err) {
    console.error('Error fixing negatives:', err);
  } finally {
    try { await pool.end(); } catch (e) {}
    process.exit(0);
  }
}

run();
