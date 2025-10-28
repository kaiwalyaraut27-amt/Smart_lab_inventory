const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res) { try { return await res.json(); } catch(e){ return { success: false, status: res.status, text: await res.text() } } }

async function run(){
  try{
    const adminEmail = 'repro_admin2@example.com';
    const password = 'Password1!';
    let res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: adminEmail, password }) });
    const data = await safeJson(res);
    if (!data.success) { console.error('login failed', data); return; }
    const token = data.token;
    res = await fetch(`${API}/debug/triggers`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    const out = await safeJson(res);
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('err', err);
  }
}
run();
