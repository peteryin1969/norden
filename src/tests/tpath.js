/* survey: what the path check reports on every step of a product */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';const slug=process.argv[2]||'norden';
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':u.endsWith('.json')?'application/json':'text/html;charset=utf8'});s.end(c)}})}).listen(0);await new Promise(r=>srv.once('listening',r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await (await b.newContext({viewport:{width:900,height:820}})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});await p.goto('http://localhost:'+srv.address().port+'/'+slug+'/');await p.waitForTimeout(1500);
const steps=await p.evaluate(()=>[...new Set(P.map(x=>x.id))]);let bad=0;const t0=Date.now();
for(const id of steps){const on=await p.evaluate(async id=>{jump(id);await new Promise(r=>setTimeout(r,350));return !document.getElementById('anim').hidden},id);if(!on)continue;const r=await p.evaluate(id=>{const x=window.__path(id);return{ok:x.ok,n:x.n,hits:x.hits.map(h=>h.part+' ✕ '+h.with+' @'+h.at+'%'+(h.mate?' (mate, too early)':''))}},id);
  if(!r.ok){bad++;console.log(id,'movers',r.n,'::',[...new Set(r.hits)].slice(0,6).join(' | '))}}
console.log(slug,steps.length,'steps,',bad,'with hits,',Date.now()-t0,'ms','err',er.slice(0,2));await b.close();srv.close()})();
