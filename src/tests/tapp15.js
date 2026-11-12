/* data workshop (studio phase 2): real parts store, new parts by size, client model import, parts list follows, save to the project */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8895);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{localStorage.setItem('norden-key','k');Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
let aiReply='',aiSeen='';await p.route('https://api.anthropic.com/**',r=>{aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
await p.goto('http://localhost:8895/app/');await p.click('#goS');await p.waitForURL(/project\.html/);await ready();await p.click('#wSample');await p.waitForURL(/run=1/);await ready();
await p.click('#tEditor');await p.waitForSelector('#stStore .stitem',{timeout:60000});await p.click('.ststep[data-step="10"]');await p.waitForTimeout(2500);
/* the data workshop: edits the model data directly */
await p.click('#edBake');await p.waitForSelector('#edBakeOpen',{timeout:120000});const pid=new URL(p.url()).searchParams.get('id');
ck('after generating, the studio offers the data workshop',await p.isVisible('#edBakeWork'));
await p.goto('http://localhost:8895/app/workshop.html?pid='+pid);await p.waitForFunction(()=>window.__ws&&__ws.state().ready,null,{timeout:60000});await p.waitForTimeout(600);
const W=f=>p.evaluate(f),MM=()=>p.evaluate(()=>__ws.M()),st=()=>p.evaluate(()=>__ws.state()),msg=()=>p.textContent('#msg');
const world=(id,step,t)=>p.evaluate(([id,step,t])=>{__ws.set(step,t);return __ws.world(id)},[id,step,t]);
/* 1. the store shows the real parts */
const items=await p.$$eval('#list .item',L=>L.map(x=>({name:x.dataset.name,code:x.dataset.code,txt:x.textContent})));
ck('store lists the real parts with codes and counts',items.length>10&&items.some(x=>x.code==='117494'&&x.name==='木螺丝'&&/4 个/.test(x.txt))&&items.some(x=>/垫块/.test(x.name)),items.length+' kinds; '+(items.find(x=>x.code==='117494')||{}).txt);
await p.fill('#find','117494');await p.waitForTimeout(200);ck('search narrows the store',(await p.$$('#list .item')).length===1);await p.fill('#find','');
await p.click('#list .item[data-code="117494"] .bLoc');await p.waitForTimeout(400);const s1=await st();ck('“定位” selects a real part and goes to its step',!!s1.sel&&s1.cur==='3'&&/原模型的零件/.test(await p.textContent('#iKind')),JSON.stringify(s1));
/* 2. a new board by size */
await p.click('#steps button[data-s="3"]');await p.click('.tabs button[data-tab="new"]');await p.fill('#nName','加固板');await p.fill('#nCode','T100');await p.fill('#nA','50');await p.fill('#nB','20');await p.fill('#nC','1.8');await p.click('#nAdd');await p.waitForTimeout(600);
let M=await MM();const brd=M.parts.find(x=>x.name==='加固板');const g=brd&&M.geoms[M.scenes[0].nodes[brd.node].g];
ck('new board is in the data with its real size, fitted in the current step',!!brd&&brd.made===1&&brd.step==='3'&&g.k==='box'&&g.a.join()==='50,1.8,20',JSON.stringify(g));
const v2=await world(brd.id,'2',1),v3a=await world(brd.id,'3',0),v3=await world(brd.id,'3',1),v4=await world(brd.id,'4',1);
ck('it is hidden before its step, comes in from above during it, and stays afterwards',!v2.vis&&v3a.vis&&v3.vis&&v4.vis&&Math.abs(v3a.p[1]-v3.p[1]-12)<.01&&Math.abs(v4.p[1]-v3.p[1])<.01,JSON.stringify([v2.vis,v3a.p,v3.p,v4.p]));
ck('the parts list of the step follows and says so',/第 3 步：T100 由 0 个改为 1 个/.test(await p.textContent('#bill'))&&/T100 0 → 1/.test(await p.textContent('#billNote'))&&/新增零件“加固板”/.test(await p.textContent('#log')),await p.textContent('#bill'));
/* 3. moving and turning by numbers and buttons */
await W(()=>__ws.set('3',1));await p.fill('#pX',String(+(v3.p[0]+10).toFixed(2)));await p.dispatchEvent('#pX','change');await p.waitForTimeout(400);const m1=await world(brd.id,'3',1),m1b=await world(brd.id,'6',1);
ck('typing a position moves it, in this and later steps',Math.abs(m1.p[0]-v3.p[0]-10)<.02&&Math.abs(m1b.p[0]-m1.p[0])<.02,JSON.stringify([m1.p,m1b.p]));
await W(()=>__ws.set('3',1));await p.selectOption('#pStep','5');await p.click('.nud:has-text("上")');await p.waitForTimeout(300);const m2=await world(brd.id,'3',1);ck('nudge buttons move by the chosen distance',Math.abs(m2.p[1]-m1.p[1]-5)<.02);
await p.click('.rot:has-text("平转 ↺")');await p.waitForTimeout(300);M=await MM();const qy=M.scenes[0].nodes[brd.node].x.slice(3,7);ck('turn buttons turn it 90 degrees',Math.abs(Math.abs(qy[1])-.7071)<.001&&Math.abs(qy[3]-.7071)<.001,JSON.stringify(qy));
/* 4. dragging the arrow with the mouse */
await W(()=>__ws.set('3',1));await p.waitForTimeout(300);const c0=await W(()=>__ws.screen(__ws.state().sel));let ax=null,hx=0,hy=0;for(let d=14;d<=170&&!ax;d+=7){for(let k=0;k<16&&!ax;k++){const an=k*Math.PI/8,x=Math.cos(an)*d,y=-Math.sin(an)*d;await p.mouse.move(c0.x+x,c0.y+y);await p.waitForTimeout(25);const a=await W(()=>__ws.axis());if(a==='X'||a==='Z'||a==='Y'){ax=a;hx=x;hy=y}}}
await p.screenshot({path:'/tmp/ws1.png'});const b4=await world(brd.id,'3',1);if(ax){await p.mouse.move(c0.x+hx,c0.y+hy);await p.mouse.down();await p.mouse.move(c0.x+hx*1.6,c0.y+hy*1.6,{steps:6});await p.mouse.up();await p.waitForTimeout(400)}const a4=await world(brd.id,'3',1),dv=a4.p.map((v,i)=>v-b4.p[i]),ai={X:0,Y:1,Z:2}[ax];
ck('dragging an arrow moves the part along that axis only',!!ax&&Math.abs(dv[ai])>1&&dv.every((v,i)=>i===ai||Math.abs(v)<.01),ax+' '+JSON.stringify(dv.map(v=>+v.toFixed(2))));
/* 5. size, approach */
await p.fill('#sA','60');await p.dispatchEvent('#sA','change');await p.waitForTimeout(400);M=await MM();const nd=M.scenes[0].nodes[brd.node],eg=M.scenes[0].nodes.find(n=>n.p===brd.node&&n.t==='L');
ck('changing the size changes the board and its outline',M.geoms[nd.g].a[0]===60&&M.geoms[eg.g].g===nd.g,JSON.stringify(M.geoms[nd.g]));
await p.selectOption('#aDir','left');await p.waitForTimeout(500);await p.fill('#aDist','20');await p.dispatchEvent('#aDist','change');await p.waitForTimeout(500);const e0=await world(brd.id,'3',0),e1=await world(brd.id,'3',1);
ck('the way it comes in can be chosen (from the left, 20 cm)',Math.abs(e0.p[0]-e1.p[0]+20)<.05&&Math.abs(e0.p[1]-e1.p[1])<.05,JSON.stringify([e0.p,e1.p]));
/* 6. fix it onto a part of the model, so that it follows when the table is turned over */
const pad=M.parts.find(x=>/垫块/.test(x.name||''));await W(()=>__ws.set('3',1));await p.waitForTimeout(300);await p.click('#pAttach');const ps=await p.evaluate(id=>__ws.screen(id),pad.id);await p.mouse.click(ps.x,ps.y);await p.waitForTimeout(600);
const onTxt=await p.textContent('#pOn');const d3=await p.evaluate(([a,b])=>{__ws.set('3',1);const x=__ws.world(a).p,y=__ws.world(b).p;__ws.set('11',1);const x2=__ws.world(a).p,y2=__ws.world(b).p;return{d1:Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]),d2:Math.hypot(x2[0]-y2[0],x2[1]-y2[1],x2[2]-y2[2]),moved:Math.hypot(x[0]-x2[0],x[1]-x2[1],x[2]-x2[2])}},[brd.id,pad.id]);
ck('fixed onto a model part: it keeps its place on it while the table is turned over',/上，跟着它一起动/.test(onTxt)&&Math.abs(d3.d1-d3.d2)<.05&&d3.moved>5,onTxt+' '+JSON.stringify(d3));
/* 7. one more from the store; deleting */
await p.click('#steps button[data-s="3"]');await p.click('.tabs button[data-tab="have"]');await p.click('#list .item[data-code="117494"] .bTake');await p.waitForTimeout(600);M=await MM();const cl=M.parts.filter(x=>x.made&&x.code==='117494');
ck('“再取一个” adds a copy of the real part and the list goes 4 → 5',cl.length===1&&M.steps.find(s=>s.id==='3').parts.find(x=>x[0]==='117494')[1]===5&&(await world(cl[0].id,'3',1)).vis&&/117494 由 4 个改为 5 个/.test(await p.textContent('#bill')),await p.textContent('#bill'));
await p.click('#pDel');await p.waitForTimeout(400);M=await MM();ck('deleting it puts the list back',M.steps.find(s=>s.id==='3').parts.find(x=>x[0]==='117494')[1]===4&&!/117494/.test(await p.textContent('#bill')));
const real=M.parts.find(x=>!x.made&&x.code==='110733'&&x.steps[0]==='2');await W(()=>__ws.set('2',1));await p.evaluate(id=>__ws.select(id),real.id);await p.waitForTimeout(300);await p.click('#pDel');await p.waitForTimeout(400);M=await MM();const gone=[await world(real.id,'2',1),await world(real.id,'6',1)];
ck('deleting a part of the model hides it everywhere and takes 1 off its step',!gone[0].vis&&!gone[1].vis&&M.steps.find(s=>s.id==='2').parts.find(x=>x[0]==='110733')[1]===3&&/110733 由 4 个改为 3 个/.test(await p.textContent('#bill')),await p.textContent('#bill'));
await p.click('#undo');await p.waitForTimeout(400);M=await MM();ck('undo brings it back',M.steps.find(s=>s.id==='2').parts.find(x=>x[0]==='110733')[1]===4&&(await world(real.id,'2',1)).vis);await p.click('#redo');await p.waitForTimeout(400);
/* 8. a client model file */
const cube='v 0 0 0\nv 100 0 0\nv 100 100 0\nv 0 100 0\nv 0 0 50\nv 100 0 50\nv 100 100 50\nv 0 100 50\nf 1 2 3 4\nf 5 6 7 8\nf 1 2 6 5\nf 2 3 7 6\nf 3 4 8 7\nf 4 1 5 8\n';
await p.click('#steps button[data-s="5"]');await p.click('.tabs button[data-tab="imp"]');await p.setInputFiles('#iFile',{name:'支架.obj',mimeType:'text/plain',buffer:Buffer.from(cube)});await p.selectOption('#iUnit','100');await p.click('#iAdd');await p.waitForTimeout(400);
ck('a wrong unit is caught by the size and said in words',/看起来不对/.test(await p.textContent('#iInfo')),await p.textContent('#iInfo'));
await p.selectOption('#iUnit','0.1');await p.selectOption('#iUp','z');await p.fill('#iCode','K-01');await p.click('#iAdd');await p.waitForTimeout(700);M=await MM();const imp=M.parts.find(x=>x.name==='支架');
ck('OBJ imported in centimetres with Z up, as a part of step 5',!!imp&&imp.kind==='mesh'&&imp.size.join()==='10,5,10'&&imp.step==='5'&&(await world(imp.id,'5',1)).vis&&/12 个三角面/.test(await p.textContent('#iInfo')),JSON.stringify(imp&&imp.size)+' '+await p.textContent('#iInfo'));
/* 9. saving: the model, and the project's own lists */
await p.click('#save');await p.waitForFunction(()=>/已保存到项目/.test(document.getElementById('msg').textContent),null,{timeout:30000});const sv=await p.evaluate(async pid=>{const d=x=>typeof x==='string'?x:new TextDecoder().decode(x);const m=JSON.parse(d((await DB.file(pid,'pkg/model/model.json')).data)),S=JSON.parse(d((await DB.file(pid,'pkg/steps.draft.json')).data)),pk=JSON.parse(d((await DB.file(pid,'pkg/package.json')).data)),csv=d((await DB.file(pid,'pkg/'+pk.files.parts)).data);return{made:m.parts.filter(x=>x.made&&!x.removed).map(x=>x.name),s3:S.find(x=>x.id==='3').parts,s2:S.find(x=>x.id==='2').parts,s5:S.find(x=>x.id==='5').parts,csv}},pid);
ck('saved: model in the project; step data and parts list follow',sv.made.join()==='加固板,支架'&&sv.s3.some(x=>x[0]==='T100'&&x[1]===1)&&sv.s2.find(x=>x[0]==='110733')[1]===3&&sv.s5.some(x=>x[0]==='K-01')&&/T100,加固板,1/.test(sv.csv)&&/K-01,支架,1/.test(sv.csv)&&/110733,短螺丝,41/.test(sv.csv),JSON.stringify([sv.made,sv.s3,sv.s2])+' '+sv.csv.replace(/\n/g,' | ').slice(-120));
ck('it says what was changed and that the published assistant is not changed',/步骤数据和材料清单/.test(await msg())&&/已发布的助手仍按原模型运行/.test(await msg()),await msg());
/* 10. the player plays the edited data; the project opens the workshop */
await p.goto('http://localhost:8895/app/model.html?pid='+pid);await p.waitForFunction(()=>window.__viewer&&__viewer.state().ready,null,{timeout:60000});const pv=await p.evaluate(async()=>{const M=JSON.parse(new TextDecoder().decode((await DB.file(new URLSearchParams(location.search).get('pid'),'pkg/model/model.json')).data)),P=new ModelPlayer(THREE,M);await P.ready;const vis=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true};const b=M.parts.find(x=>x.name==='加固板');P.pose('2',1);const a=vis(P.node(0,b.node));P.pose('7',.5);return[a,vis(P.node(0,b.node))]});
ck('the player plays the edited data (new board hidden in step 2, there in step 7)',pv[0]===false&&pv[1]===true&&await p.isVisible('#toWork'));
await p.goto('http://localhost:8895/app/project.html?id='+pid);await ready();ck('the project has a button for the data workshop',await p.isVisible('#tWork'));
await p.goto('http://localhost:8895/app/workshop.html?src=../storklinta/model.json');await p.waitForFunction(()=>window.__ws&&__ws.state().ready,null,{timeout:60000});ck('a published model opens too (two scenes, 46 steps); saving becomes a download',(await p.$$('#steps button')).length===46&&/下载/.test(await p.textContent('#save')));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
