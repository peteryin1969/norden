/* test 3 with the on-page editors: the platform corrects the step data in place; or the client changes the list and stage 1 objects */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8881);
const b=await chromium.launch();const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const open=async()=>{const p=await (await b.newContext({viewport:{width:390,height:800}})).newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept()});
  p.ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(400)};p.g=()=>p.evaluate(()=>[...document.querySelectorAll('.pipe a .g')].map(x=>x.textContent).join(' '));
  p.ckt=(sec,t)=>p.evaluate(([sec,t])=>{const e=[...document.querySelectorAll(sec+' .ck')].find(x=>x.querySelector('.t').textContent.includes(t));return e?e.querySelector('.st').textContent+'|'+e.textContent.slice(0,260):''},[sec,t]);
  await p.goto('http://localhost:8881/app/');await p.click('#goS3');await p.waitForURL(/project\.html/);await p.ready();await p.click('#wSample');await p.waitForURL(/run=1/);await p.ready();return p};
/* A: the platform corrects the step data on the page */
let p=await open();await p.click('#s2 button:has-text("步骤数据有误（平台改）")');await p.waitForSelector('#esSave');
const tot=()=>p.evaluate(()=>[...document.querySelectorAll('#s2 .ck.fail .card b')].map(x=>x.textContent).join(' | '));
ck('the rows behind both mismatches are laid out',/步骤合计 40，清单 42/.test(await tot())&&/步骤合计 40，清单 48/.test(await tot())&&await p.evaluate(()=>document.querySelectorAll('#s2 .ck.fail .card table tr').length)===7,await tot());
await p.evaluate(()=>document.querySelector('#s2 .ck.fail').scrollIntoView());await p.screenshot({path:'a4/app_edit.png',fullPage:false});
const setIn=(card,row,col,v)=>p.evaluate(([card,row,col,v])=>{const i=document.querySelectorAll('#s2 .ck.fail .card')[card].querySelectorAll('tr')[row].querySelectorAll('td')[col].querySelector('input');i.value=v;i.dispatchEvent(new Event('input'))},[card,row,col,v]);
await setIn(0,3,1,'6');ck('the total follows as you type',/步骤合计 42，清单 42\s+✓/.test(await tot()),await tot());
await setIn(1,1,2,'6');await setIn(1,2,2,'6');ck('repeat counts too',/步骤合计 48，清单 48\s+✓/.test(await tot()),await tot());
await p.click('#esSave');await p.waitForURL(/run=1/);await p.ready();let t=await p.ckt('#s2','零件核对');ck('saved: the engine finds the parts in agreement',/^通过/.test(t),t);
ck('the repeat question now suggests 6',await p.evaluate(()=>/确认：6 次/.test(document.querySelector('#s2').textContent)));
ck('the change is on record with who made it',await p.evaluate(async()=>{const L=JSON.parse(new TextDecoder().decode((await DB.file(APP.pid,'pkg/records/edits.json')).data));return L.length===1&&L[0].who==='平台'&&L[0].changes.length===3&&L[0].changes[0].before===4&&L[0].changes[0].after===6}));
ck('page came back to stage 2',await p.evaluate(()=>{const r=document.getElementById('s2').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}));
await p.context().close();
/* B: the client changes the list instead: stage 2 agrees, but stage 1 sees the list no longer matches the manual */
p=await open();await p.click('#s2 button:has-text("零件清单有误（客户改）")');await p.waitForSelector('#epSave');
ck('the two list rows are laid out with the step totals',await p.evaluate(()=>{const r=[...document.querySelectorAll('#s2 .ck.fail .card table tr')];return r.length===3&&/110733/.test(r[1].textContent)&&/40/.test(r[1].textContent)&&/✗/.test(r[1].textContent)}));
await p.evaluate(()=>{document.querySelectorAll('#s2 .ck.fail .card table input').forEach(i=>{i.value='40';i.dispatchEvent(new Event('input'))})});await p.click('#epSave');await p.waitForURL(/run=1/);await p.ready();
t=await p.ckt('#s2','零件核对');const t1=await p.ckt('#s1','零件清单与说明书零件页一致');ck('list changed to match the wrong steps: stage 2 agrees, stage 1 catches it',/^通过/.test(t)&&/^不通过/.test(t1)&&/110733：清单 40，说明书 42/.test(t1)&&/116546：清单 40，说明书 48/.test(t1),t1);
ck('the list file has a second version, the first is kept on record',await p.evaluate(async()=>{const f=await DB.file(APP.pid,'pkg/parts.csv');return f.ver===2&&f.hist.length===1}));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
