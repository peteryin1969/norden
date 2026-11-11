/* test 3: clean client data, a first delivery with two mistakes in the step data; stage 2 finds them; cause, re-delivery, questions asked again */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8880);
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:800},acceptDownloads:true})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept()});
const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(400)},g=()=>p.evaluate(()=>[...document.querySelectorAll('.pipe a .g')].map(x=>x.textContent).join(' ')),ckt=(sec,t)=>p.evaluate(([sec,t])=>{const e=[...document.querySelectorAll(sec+' .ck')].find(x=>x.querySelector('.t').textContent.includes(t));return e?e.querySelector('.st').textContent+'|'+e.textContent.slice(0,330):''},[sec,t]);
const eng=()=>p.evaluate(async()=>{const r=JSON.parse(new TextDecoder().decode((await DB.file(APP.pid,'out/report.json')).data));return r.stages[1].checks.map(c=>c.id+':'+c.status).join(' ')});
await p.goto('http://localhost:8880/app/');await p.click('#goS3');await p.waitForURL(/project\.html/);await ready();ck('client data is clean: stage 1 passes',await g()==='通过',await g());
await p.click('#wSample');await p.waitForURL(/run=1/);await ready();let t=await ckt('#s2','零件核对');
ck('stage 2 finds both mistakes, with the steps they come from',/^不通过/.test(t)&&/110733（五金袋）清单 42，步骤合计 40/.test(t)&&/116546（五金袋）清单 48，步骤合计 40/.test(t)&&/第 6 步 4/.test(t)&&/第 9 步 4×5/.test(t),t);
ck('and says the list was already checked against the manual',/问题更可能在步骤数据里/.test(t));
ck('recon table marks the two rows',await p.evaluate(()=>document.querySelectorAll('#s2 tr.bad').length)===2);
/* the client answers: the repeat question is wrong as suggested, so it is corrected */
await p.evaluate(()=>{[...document.querySelectorAll('#s2 .card.q')].forEach(c=>{const ok=[...c.querySelectorAll('button')].find(b=>/^确认：/.test(b.textContent)),fx=[...c.querySelectorAll('button')].find(b=>b.textContent==='更正');if(/重复几次/.test(c.textContent)){fx.click();const i=c.querySelector('input[type=text]');i.value='6 次，一共 6 个抽屉';i.dispatchEvent(new Event('input'))}else ok.click()})});
ck('the suggested repeat count shown is the wrong one',await p.evaluate(()=>/确认：5 次/.test(document.querySelector('#s2').textContent)));
await p.click('.bar button:has-text("保存并重新计算")');await ready();t=await ckt('#s2','待确认问题全部有答案');ck('the correction keeps stage 2 open and says who acts',/^待确认/.test(t)&&/写了更正/.test(t)&&/导出项目 zip/.test(t),t);
/* who puts the parts mismatch right */
ck('no way forward offered before the cause is chosen',!(await p.$('#s2 .ck.fail [data-prow]')));ck('the correction itself has the hand-over beside it',!!(await p.$('#s2 .ck.todo [data-prow]')));
await p.click('#s2 button:has-text("步骤数据有误（平台改）")');await p.fill('#s2 .ck.fail input[type=text]','第 6 步应是 6 颗；抽屉是 6 个');
ck('platform side chosen: export and import offered',!!(await p.$('#s2 .ck.fail [data-prow]'))&&!!(await p.$('#s2 .ck.fail [data-sample]')));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#s2 .ck.fail button:has-text("导出项目 zip")')]);const zp=process.cwd()+'/../app/cli/t3.zip';await dl.saveAs(zp);
const JSZip=require('../app/npm/node_modules/jszip');const z=await JSZip.loadAsync(fs.readFileSync(zp));const ans=JSON.parse(await z.file('资料包/answers.json').async('string')),rec=JSON.parse(await z.file('资料包/records/resubmit.json').async('string'));
ck('the exported project carries the correction and the cause for the platform',Object.values(ans).some(a=>a.status==='fix'&&/6 次/.test(a.text))&&rec.stage2.who==='platform'&&/第 6 步/.test(rec.stage2.text),JSON.stringify(rec.stage2));
await p.click('#s2 .ck.fail [data-sample]');await p.waitForURL(/run=1/);await ready();t=await ckt('#s2','零件核对');ck('after the second delivery the parts agree',/^通过/.test(t),t);
ck('the corrected question is asked again with the new suggestion',await p.evaluate(()=>{const c=[...document.querySelectorAll('#s2 .card.q')].find(c=>/重复几次/.test(c.textContent));return /确认：6 次/.test(c.textContent)&&/建议答案变了/.test(c.textContent)&&/6 次，一共 6 个抽屉/.test(c.textContent)&&!c.querySelector('button.on')}));
t=await ckt('#s2','待确认问题全部有答案');ck('stage 2 waits for that one question only',/1 个还没有回答/.test(t)&&/重新问的/.test(t),t);
await p.click('#nextBtn');await p.waitForTimeout(300);ck('next step points at that question',await p.evaluate(()=>{const c=[...document.querySelectorAll('#s2 .card.q')].find(c=>/重复几次/.test(c.textContent)).getBoundingClientRect();return c.top>=0&&c.top<300}));
await p.evaluate(()=>{const c=[...document.querySelectorAll('#s2 .card.q')].find(c=>/重复几次/.test(c.textContent));[...c.querySelectorAll('button')].find(b=>/^确认：/.test(b.textContent)).click()});await p.click('.bar button:has-text("保存并重新计算")');await ready();
ck('stage 2 passes',(await g()).startsWith('通过 通过'),await g());
await p.click('#tRun');await p.waitForURL(/run=1/);await ready();ck('the engine report agrees',/^2\.1:pass 2\.2:pass 2\.3:pass 2\.4:pass 2\.6:pass$/.test(await eng()),await eng());
ck('two deliveries on record',await p.evaluate(async()=>(await DB.project(APP.pid)).delivery)===2);
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
