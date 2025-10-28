const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res){ try { return await res.json(); } catch(e){ return { success:false, status: res.status, text: await res.text() }; } }

async function signupOrLogin(email, password, name, role){
  // try login
  let res = await fetch(`${API}/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
  let data = await safeJson(res);
  if (data && data.success) return data.token;

  // else signup
  res = await fetch(`${API}/auth/signup`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, role }) });
  data = await safeJson(res);
  if (data && data.success) return data.token;
  throw new Error('Could not signup/login: ' + JSON.stringify(data));
}

async function run(){
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.error('Usage: node apply_reconcile_api_fix.js <item_id> <new_quantity>');
      process.exit(1);
    }
    const item_id = Number(args[0]);
    const newQty = Number(args[1]);

    const adminEmail = 'repro_admin@example.com';
    const password = 'Password1!';

    console.log('Getting admin token...');
    const token = await signupOrLogin(adminEmail, password, 'Repro Admin', 'admin');
    console.log('token length=', token?.length);

    console.log('Updating item via API...');
    const res = await fetch(`${API}/items/${item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ quantity: newQty })
    });
    const data = await safeJson(res);
    console.log('update response:', data);

    if (!data || !data.success) {
      throw new Error('Failed to update item: ' + JSON.stringify(data));
    }

    console.log(`Item ${item_id} set to quantity=${newQty} successfully.`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  }
}

run();
