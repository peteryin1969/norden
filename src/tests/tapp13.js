/* studio: mate two parts by points with stop on interference; suggestions of what was meant; a wish in words done after confirmation */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8890);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{localStorage.setItem('norden-key','k');Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
let aiReply='',aiSeen='';await p.route('https://api.anthropic.com/**',r=>{aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
await p.goto('http://localhost:8890/app/');await p.click('#goS');await p.waitForURL(/project\.html/);await ready();await p.click('#wSample');await p.waitForURL(/run=1/);await ready();
await p.click('#tEditor');await p.waitForSelector('#stStore .stitem',{timeout:60000});await p.click('.ststep[data-step="10"]');await p.waitForTimeout(2500);
const F=()=>p.frames().find(f=>/\/norden\/$/.test(f.url())),fr=await (await p.$('#edFrame')).boundingBox(),layer=()=>F().evaluate(()=>__edit.get().parts);
/* screen position of a named corner of a part, worked out inside the frame */
const K=await F().evaluate(()=>{const L=__edit.list('10');return{notch:L.find(x=>/有缺口端板/.test(x.name)).keys[0],bottom:L.find(x=>/抽屉底板/.test(x.name)).keys[0],plain:L.find(x=>/无缺口端板/.test(x.name)).keys[0]}});
const scr=async k=>{const s=await F().evaluate(k=>__studio.screen(k),k);return{x:fr.x+s.x,y:fr.y+s.y}};
/* 1. mate: lift the notched board away first, then bring one of its points to a point of the plain end board; the drawer is in between */
await p.click('#stStore .stitem:has-text("有缺口端板")');await p.fill('#edPz','30');await p.dispatchEvent('#edPz','change');await p.waitForTimeout(400);await p.keyboard.press('Escape');
await p.click('#edTool_mate');ck('the mate tool says what to do first',/第 1 步/.test(await p.textContent('#edMsg')));
let a=await scr(K.notch);await p.mouse.move(a.x,a.y);await p.waitForTimeout(200);await p.mouse.click(a.x,a.y);await p.waitForTimeout(400);ck('first point taken on the part, with the kind of point named',/第 2 步/.test(await p.textContent('#edMsg'))&&/有缺口端板.*的(角|边的中点|面的中心)/.test(await p.textContent('#edMsg')),await p.textContent('#edMsg'));
let t=await scr(K.plain);await p.mouse.click(t.x,t.y);await p.waitForTimeout(900);let cd=await p.textContent('#edCard');
ck('on the way it runs into another part, stops short and says which',/途中被挡住了/.test(cd)&&/离目标还差 [\d.]+ 厘米时碰到“/.test(cd),cd.slice(0,160));await p.screenshot({path:'a4/st_mate.png'});
const stopped=(await layer())[K.notch].off[2];ck('it stopped between the start and the target',stopped<30&&stopped>-40&&Math.abs(stopped-30)>1,stopped);
await p.click('#edMateBack');await p.waitForTimeout(300);ck('“put it back” returns it to where it was',(await layer())[K.notch].off[2]===30);
/* the same again, this time accepted where it stopped; then undo */
await p.click('#edTool_mate');a=await scr(K.notch);await p.mouse.click(a.x,a.y);await p.waitForTimeout(300);t=await scr(K.plain);await p.mouse.click(t.x,t.y);await p.waitForTimeout(900);await p.click('#edMateStop');await p.waitForTimeout(300);ck('“stop here” keeps the stopped place',Math.abs((await layer())[K.notch].off[2]-stopped)<.01);
await p.keyboard.press('Control+z');await p.waitForTimeout(300);ck('undo',(await layer())[K.notch].off[2]===30);
/* 2. a free mate: from where it is back to a point on a part it does not have to pass through — moving the notched board up to nothing in the way */
/* 3. suggestions: leave the board a little short of the long board's end and a little turned */
await p.keyboard.press('w');await p.click('#stStore .stitem:has-text("有缺口端板")');await p.fill('#edPz','0');await p.dispatchEvent('#edPz','change');await p.waitForTimeout(400);ck('at rest nothing is suggested',await p.evaluate(()=>document.getElementById('edCard').hidden),await p.textContent('#edCard'));
await p.fill('#edPx','0.8');await p.dispatchEvent('#edPx','change');await p.waitForTimeout(500);cd=await p.textContent('#edCard');ck('nudged a little out of its seat: going back to the old fit is offered, once',/看起来你想/.test(cd)&&(cd.match(/回到和“.+?”原来贴合的位置（右偏了 0\.8 厘米）/g)||[]).length===1,cd.slice(0,200));
await p.click('#edCard [data-sg="back0"]');await p.waitForTimeout(400);ck('one click does it',!(await layer())[K.notch],JSON.stringify(await layer()));
await p.fill('#edPx','0');await p.dispatchEvent('#edPx','change');await p.waitForTimeout(300);
await p.fill('#edRy','6');await p.dispatchEvent('#edRy','change');await p.waitForTimeout(500);cd=await p.textContent('#edCard');ck('a part left a few degrees off is offered to be squared',/把它转正（现在差 6°）/.test(cd),cd.slice(0,120));
await p.click('#edCard [data-sg="square"]');await p.waitForTimeout(400);ck('one click squares it',(await F().evaluate(k=>__studio.info(k).deg,K.notch)).every(v=>Math.abs(v)<.05));
/* 4. a wish in words, with a stand-in for the AI: shown first, done only when confirmed */
await p.fill('#edPz','0');await p.dispatchEvent('#edPz','change');await p.waitForTimeout(300);await p.evaluate(()=>{document.getElementById('edCard').hidden=true});
aiReply='{"say":"把有缺口端板往上抬 2 厘米，再绕竖直轴转 90 度","actions":[{"type":"move","d":[0,2,0]},{"type":"turn","axis":"y","deg":90}]}';await p.fill('#edWish','往上抬两厘米，再转九十度');await p.click('#edWishGo');await p.waitForTimeout(800);cd=await p.textContent('#edCard');
ck('the assistant is told what is selected and what is around it',/有缺口端板/.test(aiSeen)&&/周围的零件/.test(aiSeen)&&/往上抬两厘米/.test(aiSeen));
ck('its reading is shown before anything moves',/AI 理解为：把有缺口端板往上抬 2 厘米/.test(cd)&&/移动：上 2 厘米/.test(cd)&&/绕竖直轴转 90°/.test(cd)&&!(await layer())[K.notch],cd.slice(0,160));
await p.click('#edAiDo');await p.waitForTimeout(500);const inf=await F().evaluate(k=>__studio.info(k),K.notch);ck('confirmed: both actions done',inf.off[1]===2&&Math.abs(inf.deg[1]-90)<.1,JSON.stringify(inf));
aiReply='{"say":"没听明白你想动哪个零件，能再说具体一点吗？","actions":[]}';await p.fill('#edWish','弄好它');await p.keyboard.press('Enter');await p.waitForTimeout(800);ck('when it does not understand it asks instead of acting',/没听明白/.test(await p.textContent('#edCard')));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
