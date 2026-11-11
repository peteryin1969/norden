/* data model: the studio turns the edited model into a data file kept in the project; the player page plays it with no product code, from the project and from a published file */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8893);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{localStorage.setItem('norden-key','k');Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
let aiReply='',aiSeen='';await p.route('https://api.anthropic.com/**',r=>{aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
await p.goto('http://localhost:8893/app/');await p.click('#goS');await p.waitForURL(/project\.html/);await ready();await p.click('#wSample');await p.waitForURL(/run=1/);await ready();
await p.click('#tEditor');await p.waitForSelector('#stStore .stitem',{timeout:60000});await p.click('.ststep[data-step="10"]');await p.waitForTimeout(2500);
const F=()=>p.frames().find(f=>/\/norden\/$/.test(f.url()));
/* an edit first, so the data must carry it: lift the notched end board 5 cm at its final place */
await p.click('#stStore .stitem:has-text("有缺口端板")');await p.fill('#edPy','5');await p.dispatchEvent('#edPy','change');await p.waitForTimeout(500);
const want=await F().evaluate(()=>{const L=__edit.list('10'),k=L.find(x=>/有缺口端板/.test(x.name)).keys[0];return{k,off:__edit.get().parts[k]&&__edit.get().parts[k].off}});
ck('the edit is in the layer',!!want.off&&Math.abs(want.off[1])>1,JSON.stringify(want));
ck('the studio has a button for the data model',await p.isVisible('#edBake'));
await p.click('#edBake');await p.waitForSelector('#edBakeOpen',{timeout:120000});
ck('it says what was made',/数据模型已生成/.test(await p.textContent('#edMsg'))&&/11 步/.test(await p.textContent('#edMsg')),await p.textContent('#edMsg'));
ck('the studio is back on afterwards (handles, camera)',await F().evaluate(()=>!!__studio.info&&document.querySelectorAll('canvas').length>0)&&await p.isVisible('#stStore .stitem'));
const pid=new URL(p.url()).searchParams.get('id');const saved=await p.evaluate(async pid=>{const f=await DB.file(pid,'pkg/model/model.json');if(!f)return null;const t=typeof f.data==='string'?f.data:new TextDecoder().decode(f.data),M=JSON.parse(t);return{bytes:t.length,fmt:M.format,steps:M.steps.length,parts:M.parts.length,aids:M.scenes[0].nodes.length}},pid);
ck('model/model.json is in the project',!!saved&&saved.fmt==='assembly-model'&&saved.steps===11&&saved.parts>50,JSON.stringify(saved));
/* the player, opened for the project */
const [v]=await Promise.all([ctx.waitForEvent('page'),p.click('#edBakeOpen')]);v.on('pageerror',e=>er.push('viewer '+e.message));await v.waitForFunction(()=>window.__viewer&&__viewer.state().ready,null,{timeout:60000});
ck('player opens the project model: title, 11 steps, facts table',/NORDEN.*数据模型/.test(await v.textContent('#ttl'))&&(await v.$$('#steps button')).length===11&&/assembly-model/.test(await v.textContent('#info')),await v.textContent('#ttl'));
const shot=async()=>{const b=await v.locator('#view').screenshot();return{len:b.length,h:require('crypto').createHash('md5').update(b).digest('hex')}};
await v.evaluate(()=>__viewer.set('10',0));await v.waitForTimeout(500);const a0=await shot();await v.evaluate(()=>__viewer.set('10',1));await v.waitForTimeout(500);const a1=await shot();
ck('it draws the model and the picture changes along the step',a0.len>8000&&a1.len>8000&&a0.h!==a1.h,JSON.stringify([a0,a1]));
/* the edit is in the data: the notched board ends 5 cm higher than in the published model */
const y=await v.evaluate(async()=>{const M=JSON.parse(new TextDecoder().decode((await DB.file(new URLSearchParams(location.search).get('pid'),'pkg/model/model.json')).data)),P=new ModelPlayer(THREE,M);await P.ready;const p=M.parts.find(x=>/有缺口端板/.test(x.name||''));P.pose('10',1);const a=new THREE.Vector3();P.node(p.scene,p.node).getWorldPosition(a);
  const M0=await (await fetch('../norden/model.json')).json(),P0=new ModelPlayer(THREE,M0);await P0.ready;const p0=M0.parts.find(x=>/有缺口端板/.test(x.name||''));P0.pose('10',1);const b=new THREE.Vector3();P0.node(p0.scene,p0.node).getWorldPosition(b);return{a:a.y,b:b.y}});
ck('the edit made in the studio is carried by the data (same shift as in the layer)',Math.abs(y.a-y.b-want.off[1])<.01,JSON.stringify(y)+' layer '+want.off[1]);
await v.click('#moving .tag');await v.waitForTimeout(300);ck('a moving part can be boxed in the picture',await v.evaluate(()=>!!document.querySelector('#moving .tag.on')));
await v.click('#play');await v.waitForTimeout(1200);ck('play moves the slider',+(await v.inputValue('#t'))>0);
/* the player with a published file, and with a wrong file */
await v.goto('http://localhost:8893/app/model.html?src=../norden/model.json');await v.waitForFunction(()=>window.__viewer&&__viewer.state().ready,null,{timeout:60000});ck('player opens a published model.json',(await v.$$('#steps button')).length===11);
await v.goto('http://localhost:8893/app/model.html?src=../norden/faq.json');await v.waitForTimeout(1500);ck('a file that is not a model is refused in words',/打不开这份数据/.test(await v.textContent('#err')),await v.textContent('#err'));
await v.goto('http://localhost:8893/');ck('the product list links to the four data models',(await v.$$('a[href*="model.html?src="]')).length===4);
await p.bringToFront();await p.click('#edClose');await p.waitForTimeout(600);ck('the project tools have a button to play the data model',await p.isVisible('#tModel'));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
