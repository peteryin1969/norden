/* manual editor: part detail (numbered holes, mark points) and the state of the assembly after the confirmed steps */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8903);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{window.__sr=[];window.SpeechRecognition=window.webkitSpeechRecognition=function(){window.__sr.push(this);this.start=()=>{this.on=true};this.abort=()=>{this.on=false;this.onend&&this.onend()}};Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
let aiReply='',aiSeen='';await p.route('https://api.anthropic.com/**',r=>{aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
const U='http://localhost:8903/app/manual.html?src=../norden/model.json&parts=samples/test2-fix/parts.csv';
await p.goto(U);await p.waitForFunction(()=>window.__man&&__man.state().ready,null,{timeout:60000});await p.waitForTimeout(400);
const W=f=>p.evaluate(f),ST=()=>p.evaluate(()=>__man.state()),MAN=()=>p.evaluate(()=>__man.man()),msg=()=>p.textContent('#msg'),cap=()=>p.textContent('#bcap');
const clickPt=async(key,name)=>{const s=await p.evaluate(([k,n])=>__man.screen(k,n),[key,name]);await p.mouse.move(s.x,s.y);await p.waitForTimeout(120);await p.mouse.click(s.x,s.y);await p.waitForTimeout(300)};
const step=async t=>{await p.click('#addStep');await p.fill('#sText',t);await p.click('#ask');await p.waitForSelector('#uCard');await p.waitForTimeout(200)};
const pick=async(j,side,key,name)=>{await p.click('.join[data-j="'+j+'"] .jPick[data-side="'+side+'"]');await p.waitForTimeout(300);await clickPt(key,name)};
const d3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
/* 1. the detail of a part: every hole numbered, far-side holes dimmed, boards shown lying flat */
await p.click('#lib .li[data-key="n:中间桌板"]');await p.waitForTimeout(400);const nl=await p.$$eval('#lbls .plb',L=>({n:L.length,shown:L.filter(x=>x.style.display==='block').length}));await p.evaluate(()=>__man.turn(.6,-.6));await p.waitForTimeout(200);const nl2=await p.$$eval('#lbls .plb',L=>L.filter(x=>x.style.display==='block').length);
ck('each hole carries its number; seen from above the holes underneath are dimmed and unnumbered, from below they show',nl.n===22&&nl.shown<nl.n&&nl2>nl.shown,JSON.stringify(nl)+' below '+nl2);
const lp=await W(()=>__man.points('n:左桌板')),ys=lp.filter(x=>x.kind==='corner').map(x=>x.p[1]),xs=lp.filter(x=>x.kind==='corner').map(x=>x.p[0]);await p.click('#lib .li[data-key="n:左桌板"]');await p.waitForTimeout(300);
const flat=await p.evaluate(()=>{const s=__man.screen('n:左桌板','角1'),t=__man.screen('n:左桌板','角8');return Math.abs(s.y-t.y)});ck('a board is shown lying flat, as in the open product',flat<260,'corner spread on screen '+flat.toFixed(0)+' px');
/* 2. a part without hole data: a mark point anywhere on its surface */
await p.click('#lib .li[data-key="n:抽屉底板"]');await p.waitForTimeout(300);ck('a part with no hole data says so and offers mark points',/没有孔位数据/.test(await cap()));
await p.click('#bMark');const sf0=await W(()=>__man.surf('n:抽屉底板')),cn0=await W(()=>__man.screen('n:抽屉底板','角8')),sf={x:sf0.x*.6+cn0.x*.4,y:sf0.y*.6+cn0.y*.4};await p.mouse.move(sf.x,sf.y);await p.waitForTimeout(150);const tp=await p.textContent('#tip');await p.mouse.click(sf.x,sf.y);await p.waitForTimeout(300);let M=await MAN();
ck('“加标记点” then a click on the surface puts a point there that can be grabbed like a hole',(M.marks['n:抽屉底板']||[]).length===1&&M.marks['n:抽屉底板'][0].name==='标记1'&&M.marks['n:抽屉底板'][0].p.length===3&&(await ST()).grab.pt==='标记1'&&/1 个标记点/.test(await cap())&&/点这里加一个标记点/.test(tp),JSON.stringify(M.marks['n:抽屉底板'][0]));
/* 3. the state of the assembly follows the confirmed steps */
await p.click('#vState');await p.waitForTimeout(200);ck('before any step is understood the state view says so',/还没有理解过的步骤/.test(await cap()));
await step('把抽屉底板放到地面上');await step('把无缺口端板放到地面上');await p.click('#uOk');await p.waitForTimeout(400);let Ip=await W(()=>__man.insts());
ck('steps that are understood but not yet confirmed are shown too, in grey, and named',Ip.length===2&&Ip.find(x=>x.key==='n:抽屉底板').pend===true&&Ip.find(x=>x.key==='n:无缺口端板').pend===false&&/灰色的来自还没确认的步骤（第 1 步）/.test(await cap())&&/第 1 步还没有确认：点开它/.test(await p.textContent('#chk')),await cap());
await p.click('#addStep');const rm=await msg();ck('adding a step reminds of steps still waiting for confirmation',/提醒：第 1 步 AI 已经理解，但还没有点/.test(rm),rm);
for(let k=0;k<3;k++){await p.click('.st[data-i="0"]');await p.click('#sDelStep');await p.waitForTimeout(200)}
await step('把抽屉长板放到地面上');await p.click('#uOk');await p.waitForTimeout(400);let I0=await W(()=>__man.insts());
ck('a step that only puts a part down already shows it in the assembly state, and is not reported as missing a join',(await ST()).view==='state'&&I0.length===1&&I0[0].key==='n:抽屉长板（凸条朝外）'&&/装配状态（到第 1 步）：抽屉长板/.test(await cap())&&/只是摆放/.test(await cap())&&!/没有写明谁装到谁上/.test(await p.textContent('#chk'))&&/摆放好/.test(await p.textContent('#uSay')),await cap());
await p.click('#sDelStep');await p.waitForTimeout(300);
await step('用两颗木螺丝把垫块装到左桌板下面');const hL=lp.filter(x=>x.kind==='hole');await pick(0,'a','n:垫块','孔1');await pick(0,'b','n:左桌板',hL[0].name);await p.click('#uOk');await p.waitForTimeout(400);let I=await W(()=>__man.insts());
const pa=await p.evaluate(()=>__man.instPoint('n:垫块','孔1').w),pb=await p.evaluate(n=>__man.instPoint('n:左桌板',n).w,hL[0].name);
ck('after confirming a step the bench shows what is assembled so far, the part sitting exactly on the chosen points',(await ST()).view==='state'&&I.filter(x=>!x.fast).map(x=>x.key).sort().join()==='n:垫块,n:左桌板'&&d3(pa,pb)<.01&&/装配状态（到第 1 步）：/.test(await cap())&&/垫块/.test(await cap()),(await cap())+' gap '+d3(pa,pb).toFixed(3));
ck('the fastener is shown at the joint',I.some(x=>x.fast&&x.key==='117494'&&d3(x.p,pb)<.01));
/* 4. the next step is designed on that state: a hole of an assembled part is picked right there */
await step('把钢条装到左桌板上');await p.click('.join[data-j="0"] .jPick[data-side="b"]');await p.waitForTimeout(300);ck('asking for a point of a part that is already assembled keeps the assembly in view',(await ST()).view==='state'&&(await ST()).pick.side==='b');
const ip=await p.evaluate(n=>__man.instPoint('n:左桌板',n),hL[3].name);await p.evaluate(()=>__man.turn(.6,-.7));await p.waitForTimeout(200);const ip2=await p.evaluate(n=>__man.instPoint('n:左桌板',n),hL[3].name);await p.mouse.move(ip2.x,ip2.y);await p.waitForTimeout(150);const tip2=await p.textContent('#tip');await p.mouse.click(ip2.x,ip2.y);await p.waitForTimeout(300);M=await MAN();
ck('the hole is picked on the assembled part (the tip names part and hole)',M.steps[1].u.joins[0].pb&&M.steps[1].u.joins[0].pb.name===hL[3].name&&new RegExp('左桌板 · 孔 ').test(tip2),tip2);
await p.click('.join[data-j="0"] .jPick[data-side="a"]');await p.waitForTimeout(300);ck('a part not yet assembled is shown alone for picking',(await ST()).view==='one'&&(await ST()).key==='120139');await clickPt('120139','孔1');
await p.click('#uOk');await p.waitForTimeout(400);I=await W(()=>__man.insts());const qa=await p.evaluate(()=>__man.instPoint('120139','孔1').w),qb=await p.evaluate(n=>__man.instPoint('n:左桌板',n).w,hL[3].name);
ck('the state now has three parts, the new one on its hole',I.filter(x=>!x.fast).length===3&&d3(qa,qb)<.01&&/到第 2 步/.test(await cap()),await cap());
/* 5. a join without points is shown as not yet placed; turning over is shown */
await step('先翻面，再把右桌板接到左桌板上');await p.click('#uOk');await p.waitForTimeout(400);I=await W(()=>__man.insts());ck('a part joined without points is shown beside, in orange, and said to be only indicative; the turn-over is said',I.some(x=>x.key==='n:右桌板'&&x.loose)&&/橙色的 1 个还没指明结合点/.test(await cap())&&/翻面放置/.test(await cap())&&/第 3 步还没有指明结合点/.test(await p.textContent('#chk')),await cap());
/* 6. two sub-assemblies joined: everything already on the moved part comes with it */
await step('把左桌板装到中间桌板上');const hC=(await W(()=>__man.points('n:中间桌板'))).filter(x=>x.kind==='hole');await pick(0,'b','n:中间桌板',hC[0].name);await p.click('.join[data-j="0"] .jPick[data-side="a"]');await p.waitForTimeout(300);
const ia=await p.evaluate(n=>__man.instPoint('n:左桌板',n),hL[6].name);await p.mouse.click(ia.x,ia.y);await p.waitForTimeout(300);M=await MAN();const ja=M.steps[3].u.joins[0].pa;await p.click('#uOk');await p.waitForTimeout(400);
const r1=await p.evaluate(()=>__man.instPoint('n:垫块','孔1').w),r2=await p.evaluate(n=>__man.instPoint('n:左桌板',n).w,hL[0].name),r3=await p.evaluate(n=>__man.instPoint('n:左桌板',n).w,ja.name),r4=await p.evaluate(n=>__man.instPoint('n:中间桌板',n).w,hC[0].name);
ck('joining the board that already carries parts moves them together',!!ja&&d3(r3,r4)<.01&&d3(r1,r2)<.01,'pa '+(ja&&ja.name));
ck('a board named in several steps is counted once: it is the one already assembled',/左桌板 1\/1/.test(await p.textContent('#lib .li[data-key="n:左桌板"]'))&&!/“左桌板”写了/.test(await p.textContent('#chk'))&&/垫块 1\/2/.test(await p.textContent('#lib .li[data-key="n:垫块"]')),await p.textContent('#lib .li[data-key="n:左桌板"]'));
await p.click('.st[data-i="0"]');await p.waitForTimeout(300);ck('choosing an earlier step shows the state as it was then',/到第 1 步/.test(await cap())&&(await W(()=>__man.insts())).filter(x=>!x.fast).length===2);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);const saved=JSON.parse(require('fs').readFileSync(await dl.path(),'utf8'));ck('mark points are saved with the manual',saved.marks['n:抽屉底板'][0].name==='标记1');
await p.click('.st[data-i="3"]');await p.waitForTimeout(400);await p.evaluate(()=>{document.getElementById('msg').classList.remove('on');__man.turn(.7,-.5)});await p.waitForTimeout(200);await p.screenshot({path:'/tmp/man2.png'});await p.evaluate(()=>{window.onbeforeunload=null});
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
