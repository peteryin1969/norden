/* engine edit hooks on the built assistant: flip the notched end board in step 10, check the picture and the self-check */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';const slug=process.argv[2]||'norden';
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':u.endsWith('.json')?'application/json':'text/html;charset=utf8'});s.end(c)}})}).listen(8884);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await (await b.newContext({viewport:{width:900,height:820}})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});await p.goto('http://localhost:8884/'+slug+'/');await p.waitForTimeout(1500);
const steps=await p.evaluate(()=>[...new Set(P.map(x=>x.id))]);const sid=process.argv[3]||'10';
await p.evaluate(id=>{jump(id)},sid);await p.waitForTimeout(600);if(!await p.evaluate(()=>document.getElementById('anim').classList.contains('full')))await p.click('#animFull').catch(()=>{});await p.waitForTimeout(500);
console.log('ready',await p.evaluate(()=>!!window.__edit&&__edit.ready()),'steps',steps.length);
const L=await p.evaluate(id=>__edit.list(id),sid);console.log(L.map(x=>x.name+(x.moving?'*':'')+'['+x.keys.join(',')+']').join(' | '));
const snap=async(t,f)=>{await p.evaluate(([id,t])=>Anim._set(id,t),[sid,t]);await p.waitForTimeout(700);const u=await p.evaluate(()=>__edit.snap(720));fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'))};
await snap(1,'a4/ed_before.jpg');
if(slug==='norden'){const tgt=L.find(x=>/缺口/.test(x.name));await p.evaluate(k=>__edit.set(k,{rot:[0,0,2]}),tgt.keys);await snap(1,'a4/ed_flip.jpg');console.log('audit flipped',JSON.stringify(await p.evaluate(id=>{const a=__audit(id);return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v.ok]))},sid)));
  await p.evaluate(k=>__edit.set(k,{rot:[0,0,2]}),tgt.keys);await snap(1,'a4/ed_back.jpg');console.log('layer after flipping back',JSON.stringify(await p.evaluate(()=>__edit.get())));
  await p.evaluate(k=>__edit.set(k,{off:[0,6,0],lbl:'有缺口端板（测试改名）'}),tgt.keys);await snap(.7,'a4/ed_move.jpg');await p.evaluate(k=>__edit.clear(k),tgt.keys)}
console.log('err',er);await b.close();srv.close()})();
