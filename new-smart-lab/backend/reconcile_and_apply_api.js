const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res){ try { return await res.json(); } catch(e){ return { success:false, status: res.status, text: await res.text() }; } }

async function signupOrLogin(email, password, name, role){
  let res = await fetch(`${API}/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
  let data = await safeJson(res);
  if (data && data.success) return data.token;
  res = await fetch(`${API}/auth/signup`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, role }) });
  data = await safeJson(res);
  if (data && data.success) return data.token;
  throw new Error('Could not signup/login: ' + JSON.stringify(data));
}

async function run(){
  try {
    console.log('Getting admin token...');
    const token = await signupOrLogin('repro_admin@example.com','Password1!','Repro Admin','admin');
    console.log('token length=', token?.length);

    // Fetch requests and derive the item ids to check (safer and works with existing endpoints)
    console.log('Fetching all requests to derive item IDs...');
    const reqsRes = await fetch(`${API}/requests`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    const reqsData = await safeJson(reqsRes);
    if (!reqsData || !reqsData.success) throw new Error('Could not fetch requests');
    const ids = [...new Set(reqsData.data.map(r => Number(r.item_id)))];
    const items = [];
    for (const id of ids) {
      const r = await fetch(`${API}/items/id/${id}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJson(r);
      items.push(d && d.success ? d.data : { item_id: id, item_name: `(id:${id})`, quantity: null });
    }

    console.log('Total items to check=', items.length);

    const changes = [];
    for (const it of items) {
      const iid = Number(it.item_id);
      const itemName = it.item_name || `(id:${iid})`;
      const current = Number(it.quantity ?? 0);

      // fetch requests for this item
      const r = await fetch(`${API}/requests`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
      const rdata = await safeJson(r);
      const allReqs = rdata && rdata.success ? rdata.data : [];
      const reqsForItem = allReqs.filter(x => Number(x.item_id) === iid);
      const totalApproved = reqsForItem.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.quantity || 0), 0);
      const totalReturned = reqsForItem.filter(r => r.status === 'returned').reduce((s, r) => s + Number(r.quantity || 0), 0);
      const net = totalApproved - totalReturned;
      const computedInitial = current + totalApproved - totalReturned;

      const inconsistent = computedInitial < 0 || current < 0 || totalReturned < 0 || totalApproved < 0;
      if (!inconsistent) continue;

      // compute safe newQty: set current so that computedInitial becomes 0 => current = totalReturned - totalApproved
      let newQty = Math.max(0, totalReturned - totalApproved);

      console.log(`Item ${iid} (${itemName}) inconsistent. current=${current} approved=${totalApproved} returned=${totalReturned} computedInitial=${computedInitial} -> setting ${newQty}`);

      // call API to set quantity
      const upd = await fetch(`${API}/items/${iid}`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ quantity: newQty }) });
      const updData = await safeJson(upd);
      if (updData && updData.success) {
        changes.push({ item_id: iid, item_name: itemName, old: current, new: newQty });
        console.log(`  -> updated item ${iid} to ${newQty}`);
      } else {
        console.error(`  -> failed to update item ${iid}:`, updData);
      }
    }

    console.log('Reconcile-and-apply complete. Changes:', changes);
    process.exit(0);
  } catch (err) {
    console.error('Error during reconcile-and-apply:', err);
    process.exit(2);
  }
}

run();
