(async()=>{
  try{
    const signup=await fetch('http://localhost:5050/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Auto Test',email:'autotest+2@example.com',password:'password',role:'student'})});
    console.log('SIGNUP_STATUS',signup.status);
    console.log(await signup.text());
    const login=await fetch('http://localhost:5050/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'autotest+2@example.com',password:'password'})});
    console.log('LOGIN_STATUS',login.status);
    console.log(await login.text());
  }catch(e){console.error('ERR',e.message)}
})();
