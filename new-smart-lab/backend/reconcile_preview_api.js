// Reconciliation preview via API (safe, read-only)
// Uses admin login to fetch all requests and item rows via API endpoints, then computes aggregates per item.

const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res) { try { return await res.json(); } catch(e){ return { success: false, status: res.status, text: await res.text() } } }

async function signupOrLogin(email, password, name, role) {
  // try login
  let res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password })
  });
  let data = await safeJson(res);
  if (data && data.success) return data.token;

  // else signup
  res = await fetch(`${API}/auth/signup`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, role })
  });
  data = await safeJson(res);
  if (data && data.success) return data.token;
  throw new Error('Could not signup/login: ' + JSON.stringify(data));
}

async function run() {
  try {
    const adminEmail = 'repro_admin@example.com';
    const password = 'Password1!';
    console.log('Getting admin token...');
    const adminToken = await signupOrLogin(adminEmail, password, 'Repro Admin', 'admin');
    console.log('admin token length=', adminToken?.length);

    console.log('Fetching all requests...');
    let res = await fetch(`${API}/requests`, { method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` } });
    let data = await safeJson(res);
    if (!data || !data.success) {
      console.error('Failed to fetch requests:', data);
      return;
    }
    const requests = data.data || [];
    console.log('Total requests fetched=', requests.length);

    // group by item_id
    const byItem = {};
    const itemIds = new Set();
    for (const r of requests) {
      const iid = Number(r.item_id);
      itemIds.add(iid);
      if (!byItem[iid]) byItem[iid] = [];
      byItem[iid].push(r);
    }

    for (const iid of Array.from(itemIds)) {
      // fetch item row
      res = await fetch(`${API}/items/id/${iid}`, { method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` } });
      const itemResp = await safeJson(res);
      const item = (itemResp && itemResp.success && itemResp.data) ? itemResp.data : { item_id: iid, item_name: `(id:${iid})`, quantity: null };

      const reqs = byItem[iid] || [];
      const totalApproved = reqs.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.quantity || 0), 0);
      const totalReturned = reqs.filter(r => r.status === 'returned').reduce((s, r) => s + Number(r.quantity || 0), 0);
      const net = totalApproved - totalReturned;
      const current = Number(item.quantity ?? 0);
      const computedInitial = current + totalApproved - totalReturned;

      const inconsistent = computedInitial < 0 || current < 0;

      console.log('------------------------------------------------------------');
      console.log(`Item ${iid} - ${item.item_name}`);
      console.log(`  current_quantity: ${current}`);
      console.log(`  total_approved:   ${totalApproved}`);
      console.log(`  total_returned:   ${totalReturned}`);
      console.log(`  net (approved - returned): ${net}`);
      console.log(`  computed_initial (current + approved - returned): ${computedInitial}`);
      console.log(`  inconsistent?: ${inconsistent ? 'YES' : 'no'}`);
      if (inconsistent) console.log('  SUGGESTION: review request history and consider reconciling this item.');
    }

    console.log('------------------------------------------------------------');
    console.log('API-based preview complete. No data modified.');
  } catch (err) {
    console.error('Error during API reconcile preview:', err);
  }
}

run();
