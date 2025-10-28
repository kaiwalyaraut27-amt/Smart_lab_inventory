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
    const studentEmail = 'repro_student2@example.com';
    const adminEmail = 'repro_admin2@example.com';
    const password = 'Password1!';

    const studentToken = await signupOrLogin(studentEmail, password, 'Repro Student2', 'student');
    const adminToken = await signupOrLogin(adminEmail, password, 'Repro Admin2', 'admin');

    console.log('Tokens OK');

    // 1) Admin: create new item with quantity 10
    const newItemName = 'REPRO_ITEM_' + Date.now();
    console.log('Creating item', newItemName);
    let res = await fetch(`${API}/items`, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${adminToken}`}, body: JSON.stringify({ item_name: newItemName, quantity: 10 }) });
    let data = await safeJson(res);
    console.log('create item ->', data);

    // 2) Fetch items list to find created item id
    res = await fetch(`${API}/items/0`, { method: 'GET', headers: {'Authorization': `Bearer ${adminToken}`} });
    // Note: some endpoints may not support /items/0; fallback to get all items via debug
    // We'll call debug to find our item by name
    res = await fetch(`${API}/debug/item?name=${encodeURIComponent(newItemName)}`, { method: 'GET' });
    data = await safeJson(res);
    console.log('debug find ->', JSON.stringify(data, null, 2));
    const match = data.matches && data.matches[0] && data.matches[0].item;
    if (!match) { console.error('Could not find created item'); return; }
    const itemId = match.item_id;
    console.log('Created itemId=', itemId);

    // 3) Student: create request quantity 2
    res = await fetch(`${API}/requests`, { method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${studentToken}`}, body: JSON.stringify({ item_id: itemId, quantity: 2 }) });
    data = await safeJson(res);
    console.log('createRequest ->', data);

    // 4) Admin: get all requests and find ours
    res = await fetch(`${API}/requests`, { method: 'GET', headers: {'Authorization': `Bearer ${adminToken}`} });
    data = await safeJson(res);
    const created = (data.data || []).find(r => Number(r.item_id) === itemId && Number(r.quantity) === 2 && r.status === 'pending');
    const reqId = created && created.request_id;
    console.log('Found request id=', reqId);

    // 5) Admin: approve
    res = await fetch(`${API}/requests/${reqId}/approve`, { method: 'PUT', headers: {'Authorization': `Bearer ${adminToken}`} });
    data = await safeJson(res);
    console.log('approve ->', data);

    // 6) Student: fetch item row
    res = await fetch(`${API}/items/id/${itemId}`, { method: 'GET', headers: {'Authorization': `Bearer ${studentToken}`} });
    data = await safeJson(res);
    console.log('item row after approve ->', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('repro error:', err);
  }
}

main();
