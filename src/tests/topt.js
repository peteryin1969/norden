/* route finding on the steps the survey flagged */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';const slug=process.argv[2]||'norden',ids=process.argv.slice(3);
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':u.endsWith('.json')?'application/json':'text/html;charset=utf8'});s.end(c)}})}).listen(0);await new Promise(r=>srv.once('listening',r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await (await b.newContext({viewport:{width:900,height:820}})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});await p.goto('http://localhost:'+srv.address().port+'/'+slug+'/');await p.waitForTimeout(1500);
for(const id of ids){await p.evaluate(async id=>{jump(id);await new Promise(r=>setTimeout(r,500))},id);if(!await p.evaluate(()=>document.getElementById('anim').classList.contains('full'))){await p.click('#animFull').catch(()=>{});await p.waitForTimeout(400)}
  const shot=async(n,tt)=>{await p.evaluate(([id,t])=>Anim._set(id,t),[id,tt]);await p.waitForTimeout(500);const u=await p.evaluate(()=>__edit.snap(720));fs.writeFileSync('a4/opt_'+slug+'_'+id+'_'+n+'.jpg',Buffer.from(u.split(',')[1],'base64'))};
  const c0=await p.evaluate(id=>__edit.collide(id).hits.map(h=>h.part+'✕'+h.with+'@'+h.at),id);const at=(c0[0]||'@20').split('@')[1]/100;await shot('before',at);
  const t0=Date.now(),r=await p.evaluate(id=>__edit.optimise(id),id);await shot('after',at);
  console.log(slug,id,'hits',c0.join(' | '),'=>',JSON.stringify(r),'left',await p.evaluate(id=>__edit.collide(id).hits.length,id),Date.now()-t0,'ms','audit',JSON.stringify(await p.evaluate(id=>{const a=__audit(id);return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.ok]))},id)))}
console.log('err',er.slice(0,3));await b.close();srv.close()})();
