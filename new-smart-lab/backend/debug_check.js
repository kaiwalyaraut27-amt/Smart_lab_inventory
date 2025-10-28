const fetch = global.fetch || require('node-fetch');
const API = 'http://localhost:5050/api';

async function safeJson(res) { try { return await res.json(); } catch(e){ return { success: false, status: res.status, text: await res.text() } } }

async function main(){
  try {
    const name = 'ESP 32';
    console.log('Querying debug/item for', name);
    const res = await fetch(`${API}/debug/item?name=${encodeURIComponent(name)}`);
    const data = await safeJson(res);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('error', err);
  }
}

main();
