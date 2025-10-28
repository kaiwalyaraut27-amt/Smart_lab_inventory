// Simple reproducible flow to test approve/return behavior via HTTP API
// Usage: node repro_sequence.js
const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res) {
  try { return await res.json(); } catch(e){ return { success: false, status: res.status, text: await res.text() } }
}

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
    const studentEmail = 'repro_student@example.com';
    const adminEmail = 'repro_admin@example.com';
    const password = 'Password1!';

    console.log('Ensuring users...');
    const studentToken = await signupOrLogin(studentEmail, password, 'Repro Student', 'student');
    const adminToken = await signupOrLogin(adminEmail, password, 'Repro Admin', 'admin');
    console.log('Tokens obtained. studentToken length=', studentToken?.length, 'adminToken length=', adminToken?.length);

    // 1) Create a request for item_id=8 quantity=5
    console.log('\nCreating request (student) for item_id=8 qty=5');
    let res = await fetch(`${API}/requests`, { method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${studentToken}`}, body: JSON.stringify({ item_id: 8, quantity: 5 }) });
    let data = await safeJson(res);
    console.log('createRequest ->', data);

    // 2) Admin: get all requests and find latest for item_id=8
    res = await fetch(`${API}/requests`, { method: 'GET', headers: {'Content-Type':'application/json','Authorization':`Bearer ${adminToken}`} });
    data = await safeJson(res);
    console.log('\ngetAllRequests -> count=', data.data?.length || 0);
    const created = (data.data || []).find(r => Number(r.item_id) === 8 && Number(r.quantity) === 5 && (r.status === 'pending' || r.status === 'approved')) || (data.data && data.data[0]);
    if (!created) {
      console.log('No created request found in getAllRequests; listing all requests might require different filters.');
    }
    const reqId = created?.request_id;
    console.log('Using request_id =', reqId);

    if (!reqId) {
      console.log('Cannot find request_id to approve; exiting.');
      return;
    }

    // 3) Admin approves it
    console.log('\nApproving request id=', reqId);
    res = await fetch(`${API}/requests/${reqId}/approve`, { method: 'PUT', headers: {'Authorization':`Bearer ${adminToken}`} });
    data = await safeJson(res);
    console.log('approve ->', data);

    // 4) Student fetch items for lab 3 (where ESP 32 sits) to see quantity
    console.log('\nFetching items for lab 3 as student');
    res = await fetch(`${API}/items/3`, { method: 'GET', headers: {'Authorization':`Bearer ${studentToken}`} });
    data = await safeJson(res);
    console.log('items/3 ->', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('repro error:', err);
  }
}

main();
