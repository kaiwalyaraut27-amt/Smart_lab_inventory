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

    console.log('Calling debug fix-negatives endpoint...');
    const res = await fetch(`${API}/debug/fix-negatives`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` } });
    const data = await safeJson(res);
    console.log('fix-negatives ->', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
