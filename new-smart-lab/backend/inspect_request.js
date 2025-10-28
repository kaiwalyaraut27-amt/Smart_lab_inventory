const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res){ try { return await res.json(); } catch(e){ return { success:false, text: await res.text() } } }

async function run(){
  const adminEmail = 'repro_admin2@example.com';
  const password = 'Password1!';
  // login
  let res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: adminEmail, password }) });
  const data = await safeJson(res);
  if (!data.success) { console.error('admin login failed', data); return; }
  const token = data.token;
  res = await fetch(`${API}/requests`, { method:'GET', headers:{ 'Authorization': `Bearer ${token}` } });
  const list = await safeJson(res);
  console.log(JSON.stringify(list.data.slice(0,20), null, 2));
}
run();
