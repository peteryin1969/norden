/* test 2: one planted problem in the client's data; the review finds it; the corrected file handed in at the check clears it */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8879);
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:800},acceptDownloads:true})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept()});
const ck=(n,ok,x)=>console.log(ok?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,260));
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(400)},g=()=>p.evaluate(()=>[...document.querySelectorAll('.pipe a .g')].map(x=>x.textContent).join(' ')),fails=()=>p.evaluate(()=>[...document.querySelectorAll('#s1 .ck.fail')].map(x=>x.textContent.slice(0,120)));
await p.goto('http://localhost:8879/app/');await p.click('#goS2');await p.waitForURL(/project\.html/);await ready();let f=await fails();
ck('exactly one problem found, and it is the planted one',f.length===1&&/110733：清单 40，说明书 42/.test(f[0])&&await g()==='退回补充',f.join(' ;; '));
ck('the fix button sits at the failed check',await p.evaluate(()=>{const b=document.querySelector('#s1 .ck.fail [data-fix]');return b&&b.textContent})==='上传改好的零件清单');
await p.evaluate(()=>document.querySelector('#s1 .ck.fail').scrollIntoView());await p.screenshot({path:'a4/app_t2.png'});
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#s1 .ck.fail button:has-text("下载现在的文件")')]);ck('the current file can be downloaded to correct it',/parts\.csv/.test(dl.suggestedFilename()),dl.suggestedFilename());
const [ch]=await Promise.all([p.waitForEvent('filechooser'),p.click('#s1 .ck.fail [data-fix]')]);await ch.setFiles(d+'app/samples/test2-fix/parts.csv');await p.waitForURL(/run=1/);await ready();f=await fails();
ck('after handing in the corrected file stage 1 passes',f.length===0&&await g()==='通过',f.join(' ;; ')+' '+await g());
ck('the old version is on record',await p.evaluate(async()=>{const x=await DB.file(APP.pid,'pkg/parts.csv');return x.ver===2&&x.hist.length===1}));
console.log('err',er);await b.close();srv.close()})();
