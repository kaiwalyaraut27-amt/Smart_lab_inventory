(async()=>{
  for(let p=5173;p<=5185;p++){
    try{
      const res=await fetch(`http://localhost:${p}/`,{method:'GET'});
      const text=await res.text();
      console.log('PORT',p,'STATUS',res.status,'LENGTH',text.length);
      return;
    }catch(e){/*console.log('no',p,e.message)*/}
  }
  console.log('No frontend found on ports 5173-5185');
})();
