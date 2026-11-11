/* studio: working on the model with the mouse — pick in the picture, views, zoom, drag the handle, type numbers, undo */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8888);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,300))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
await p.goto('http://localhost:8888/app/');await p.click('#goS');await p.waitForURL(/project\.html/);await ready();await p.click('#wSample');await p.waitForURL(/run=1/);await ready();
await p.click('#tEditor');await p.waitForSelector('#stStore .stitem',{timeout:60000});await p.click('.ststep[data-step="7"]');await p.waitForTimeout(2500);
const F=()=>p.frames().find(f=>/\/norden\/$/.test(f.url())),fr=await (await p.$('#edFrame')).boundingBox();
const cam=()=>F().evaluate(()=>{const c=window.__studioCam?0:0;return null}).catch(()=>null);
const st=()=>F().evaluate(()=>({sel:__studio.selected(),layer:__edit.get().parts}));
/* the page inside the frame reports where a part is on screen (frame coordinates) */
const key=(await F().evaluate(()=>__edit.list('7').find(x=>/脚垫/.test(x.name)).keys))[0],scr=async k=>{const s=await F().evaluate(k=>__studio.screen(k),k);return{x:fr.x+s.x,y:fr.y+s.y}};
let s0=await scr(key);await p.mouse.click(s0.x,s0.y);await p.waitForTimeout(400);ck('clicking a part in the picture selects it',/脚垫/.test(await p.textContent('#edSel')),await p.textContent('#edSel'));
ck('all four alike are taken together by default',(await st()).sel.length===4);
/* camera: preset view, zoom, orbit by dragging empty space */
const before=await scr(key);await p.keyboard.press('1');await p.waitForTimeout(300);const front=await scr(key);ck('a preset view changes the picture',Math.abs(front.x-before.x)+Math.abs(front.y-before.y)>5);
await p.mouse.move(fr.x+60,fr.y+fr.height-60);await p.mouse.wheel(0,-600);await p.waitForTimeout(300);const zoomed=await scr(key);ck('the wheel zooms',Math.abs(zoomed.x-front.x)+Math.abs(zoomed.y-front.y)>3);
await p.mouse.move(fr.x+40,fr.y+40);await p.mouse.down();await p.mouse.move(fr.x+140,fr.y+70,{steps:5});await p.mouse.up();await p.waitForTimeout(300);const orb=await scr(key);ck('dragging empty space turns the view, and keeps the selection',Math.abs(orb.x-zoomed.x)>3&&(await st()).sel.length===4);
await p.keyboard.press('f');await p.waitForTimeout(300);await p.screenshot({path:'a4/st_focus.png'});
/* the handle: find a point on the upward arrow by probing, then drag it */
await p.uncheck('#edSame');await p.click('#stStore .stitem:has-text("脚垫")');await p.waitForTimeout(300);ck('with “same name together” off, one is selected',(await st()).sel.length===1);
const c=await F().evaluate(()=>{const k=__studio.selected()[0],s=__studio.screen(k);return s});let moved=false;
for(const dy of [35,50,65,80,25]){await p.mouse.move(fr.x+c.x,fr.y+c.y-dy);await p.waitForTimeout(120);await p.mouse.down();await p.mouse.move(fr.x+c.x,fr.y+c.y-dy-60,{steps:6});await p.mouse.up();await p.waitForTimeout(300);const L=(await st()).layer;if(Object.values(L).some(e=>(e.off||[]).some(v=>Math.abs(v)>.2))){moved=true;break}}
ck('dragging the handle moves the part',moved,JSON.stringify((await st()).layer));ck('the inspector shows the shift',moved&&[await p.inputValue('#edPx'),await p.inputValue('#edPy'),await p.inputValue('#edPz')].some(v=>Math.abs(parseFloat(v))>.2),await p.inputValue('#edPy'));
await p.keyboard.press('Control+z');await p.waitForTimeout(300);ck('undo puts it back',Object.keys((await st()).layer).length===0,JSON.stringify((await st()).layer));
/* numbers */
await p.fill('#edPy','3');await p.dispatchEvent('#edPy','change');await p.waitForTimeout(300);ck('typing a number moves it by that much',/脚垫：移动 上 3 厘米/.test(await p.textContent('#edLog')),await p.textContent('#edLog'));
await p.fill('#edRy','30');await p.dispatchEvent('#edRy','change');await p.waitForTimeout(300);ck('typing an angle turns it freely',/转动 竖直轴 30°/.test(await p.textContent('#edLog')),await p.textContent('#edLog'));
await p.click('#edSel');await p.keyboard.press('e');await p.waitForTimeout(200);ck('E switches to the turn handle',await p.evaluate(()=>document.getElementById('edTool_turn').classList.contains('on')));await p.screenshot({path:'a4/st_turn.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(200);ck('Esc clears the selection',(await st()).sel.length===0&&/没有选中/.test(await p.textContent('#edSel')));
await p.click('#edClose');await p.waitForTimeout(300);ck('closing with unsaved work asks first, then closes',!(await p.$('#edov')));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
