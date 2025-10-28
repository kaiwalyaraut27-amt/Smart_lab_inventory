(async()=>{
  const base='http://localhost:5050/api';
  try{
    console.log('Signing up user...');
    let r=await fetch(base+'/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'FE Test',email:'fe_test@example.com',password:'password',role:'student'})});
    console.log('signup status',r.status);
    console.log(await r.text());
  }catch(e){console.error('signup err',e.message)}
  try{
    console.log('Logging in...');
    let r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'fe_test@example.com',password:'password'})});
    console.log('login status',r.status);
    const body=await r.json().catch(()=>null);
    console.log('login body',body);
    const token=body?.token;
    if(!token) return console.log('no token, abort');
    console.log('token obtained');
    console.log('GET /subjects');
    r=await fetch(base+'/subjects',{method:'GET',headers:{Authorization:`Bearer ${token}`}});
    console.log('/subjects',r.status,await r.text());
    console.log('GET /requests/mine');
    r=await fetch(base+'/requests/mine',{method:'GET',headers:{Authorization:`Bearer ${token}`}});
    console.log('/requests/mine',r.status,await r.text());
  }catch(e){console.error('flow err',e.message)}
})();
