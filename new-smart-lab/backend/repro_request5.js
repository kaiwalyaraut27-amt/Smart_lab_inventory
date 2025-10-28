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

async function main(){
  try {
    const studentEmail = 'repro_student5@example.com';
    const adminEmail = 'repro_admin5@example.com';
    const password = 'Password1!';

    const studentToken = await signupOrLogin(studentEmail, password, 'Repro Student5', 'student');
    const adminToken = await signupOrLogin(adminEmail, password, 'Repro Admin5', 'admin');

    console.log('Tokens OK');

    // 1) Admin: create new item with quantity 10
    const newItemName = 'REPRO_ITEM5_' + Date.now();
    console.log('Creating item', newItemName);
    let res = await fetch(`${API}/items`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${adminToken}`}, body: JSON.stringify({ item_name: newItemName, quantity: 10 }) });
    let data = await safeJson(res);
    console.log('create item ->', data);

    // 2) Find created item
    res = await fetch(`${API}/debug/item?name=${encodeURIComponent(newItemName)}`, { method: 'GET' });
    data = await safeJson(res);
    console.log('debug find ->', JSON.stringify(data, null, 2));
    const match = data.matches && data.matches[0] && data.matches[0].item;
    if (!match) { console.error('Could not find created item'); return; }
    const itemId = match.item_id;
    console.log('Created itemId=', itemId);

    // 3) Student: create request quantity 5
    res = await fetch(`${API}/requests`, { method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${studentToken}`}, body: JSON.stringify({ item_id: itemId, quantity: 5 }) });
    data = await safeJson(res);
    console.log('createRequest ->', data);

    // 4) Admin: get all requests and find ours
    res = await fetch(`${API}/requests`, { method: 'GET', headers: {'Authorization': `Bearer ${adminToken}`} });
    data = await safeJson(res);
    const created = (data.data || []).find(r => Number(r.item_id) === itemId && Number(r.quantity) === 5 && (r.status === 'pending' || r.status === 'approved')) || (data.data && data.data[0]);
    const reqId = created?.request_id;
    console.log('Found request id=', reqId);

    if (!reqId) { console.log('No request id to approve'); return; }

    // 5) Admin: approve
    res = await fetch(`${API}/requests/${reqId}/approve`, { method: 'PUT', headers: {'Authorization': `Bearer ${adminToken}`} });
    data = await safeJson(res);
    console.log('approve ->', data);

    // 6) Student: fetch item row
    res = await fetch(`${API}/items/id/${itemId}`, { method: 'GET', headers: {'Authorization': `Bearer ${studentToken}`} });
    data = await safeJson(res);
    console.log('item row after approve ->', JSON.stringify(data, null, 2));

    // 7) Simulate dropdown fetch for lab (if lab exists)
    const labId = data.data?.lab_id || 1;
    res = await fetch(`${API}/items/${labId}`, { method: 'GET', headers: {'Authorization': `Bearer ${studentToken}`} });
    data = await safeJson(res);
    console.log('items/'+labId+' ->', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('repro error:', err);
  }
}

main();
