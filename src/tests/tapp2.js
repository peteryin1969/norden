/* the working app: create a project by filling the form, hand in missing files later, replace a file, reset, delete; phone width */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';const C=process.cwd()+'/../app/cli/c/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.png':'image/png','.jpg':'image/jpeg'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8877);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:800},acceptDownloads:true});const p=await ctx.newPage();const er=[];p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
const R=[],ck=(n,ok,x)=>{R.push(!!ok);console.log(ok?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,400))};
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1',{timeout:20000});await p.waitForTimeout(400)};
const st=id=>p.evaluate(id=>{const e=[...document.querySelectorAll('.ck')].find(x=>x.querySelector('.t')&&x.querySelector('.t').textContent.includes(id));return e?e.querySelector('.st').textContent+' | '+e.textContent.slice(0,140):''},id);
const over=()=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
await p.goto('http://localhost:8877/app/');await p.waitForTimeout(500);ck('index fits a phone',!(await over()));await p.screenshot({path:'a4/app_index.png',fullPage:true});
/* only a name and the manual: everything else is reported as missing, nothing blocks creation */
const lab=t=>p.locator('#formA label',{hasText:t}).first();
await lab('产品名称').locator('input').fill('测试柜（逐项填写）');await p.setInputFiles('#formA [data-k=pdf]',C+'manual/NORDEN_manual_sim.pdf');await p.fill('#formA [data-k=doc]','AA-TEST-1');
await p.click('#goA');await p.waitForURL(/project\.html/);await ready();
let g=await p.evaluate(()=>document.querySelector('.pipe a .g').textContent);ck('created with gaps: stage 1 returned',g==='退回补充',g);
ck('missing items are named',/不通过/.test(await st('使用授权'))&&/不通过/.test(await st('零件清单'))&&/不通过/.test(await st('安全要求'))&&/通过/.test(await st('是原始矢量 PDF')),[await st('使用授权'),await st('零件清单'),await st('是原始矢量 PDF')].join(' || '));
ck('project page fits a phone',!(await over()));
/* hand the files in through the file panel */
await p.click('#tFiles summary');
const add=async(kind,src,path)=>{await p.selectOption('#addKind',kind);if(path)await p.fill('#addPath',path);const [ch]=await Promise.all([p.waitForEvent('filechooser'),p.click('#tAdd')]);await ch.setFiles(src);await p.waitForURL(/run=1/);await ready();await p.click('#tFiles summary')};
await add('parts',C+'parts.csv');ck('a parts list handed in later is registered by itself',/通过/.test((await st('零件清单格式')).split('|')[0]),await st('零件清单格式'));
/* a CSV as Excel saves it in the local Chinese encoding, with different line ends */
const iconv=t=>{const {execSync}=require('child_process');const f='/tmp/claude-0/-home-claude/7ab5884c-0d84-5527-a4d8-3db1827036cb/scratchpad/app/cli/hw_gbk.csv';fs.writeFileSync(f+'.u',t.replace(/\n/g,'\r\n'));execSync('iconv -f utf-8 -t gbk '+f+'.u > '+f);return f};
await add('hardware',iconv(fs.readFileSync(C+'hardware.csv','utf8')));ck('a GBK CSV from Excel is read correctly',/每种五金都有长度/.test(await st('五金规格')),await st('五金规格'));
await add('dimensions',C+'dimensions.csv');await add('authorization',C+'authorization_sim.pdf');
await p.click('#tInfo summary');const il=t=>p.locator('#tInfo label',{hasText:t}).first();for(const [t,v] of [['宽（毫米）','800'],['深（毫米）','1520'],['高（毫米）','740'],['授权范围','说明书'],['安全要求','说明书建议两人组装。\n翻转桌子必须两人操作。'],['需要两人操作的步骤号','8'],['不需要防倾倒时','桌子']])await il(t).locator('input,textarea').fill(v);await il('授权有效期至').locator('input').fill('2027-01-01');await p.check('#tInfo label.chk input >> nth=0');await p.click('#tInfo button.on');await p.waitForURL(/run=1/);await ready();await p.click('#tFiles summary');
g=await p.evaluate(()=>document.querySelector('.pipe a .g').textContent);ck('after handing in the files stage 1 passes',g==='通过',g+' '+await p.evaluate(()=>[...document.querySelectorAll('.ck.fail .t')].map(x=>x.textContent).join(',')));
ck('versions are counted',await p.evaluate(async()=>(await DB.file(APP.pid,'pkg/package.json')).ver)>=2);
/* replace one file with a broken one: the engine notices */
fs.writeFileSync('/tmp/claude-0/-home-claude/7ab5884c-0d84-5527-a4d8-3db1827036cb/scratchpad/app/cli/hw_bad.csv',fs.readFileSync(C+'hardware.csv','utf8').split('\n').map((l,i)=>i===1?l.replace(/^(\d+,[^,]+,[^,]+),\d+/,'$1,'):l).join('\n'));
await add('hardware','/tmp/claude-0/-home-claude/7ab5884c-0d84-5527-a4d8-3db1827036cb/scratchpad/app/cli/hw_bad.csv');ck('a broken replacement is caught',/不通过/.test(await st('五金规格')),await st('五金规格'));
ck('the fix offers the form to fill, AI does not fill it',/待填，AI 不代填/.test(await p.textContent('#s1')));await p.screenshot({path:'a4/app_proj.png'});
/* delete */
await p.click('#tools details:last-of-type summary');await p.click('#tools details:last-of-type button');await p.waitForURL(/app\/$/);await p.waitForTimeout(500);ck('deleted',/还没有项目/.test(await p.textContent('#list')));
/* the full form */
await lab('产品名称').locator('input').fill('完整填写');for(const [t,v] of [['宽（毫米）','800'],['深（毫米）','1520'],['高（毫米）','740'],['授权范围','说明书、图片'],['安全要求（必填','说明书建议两人组装。\n翻转桌子必须两人操作。'],['需要两人操作的步骤号','8'],['不需要防倾倒时','桌子']])await lab(t).locator('input,textarea').fill(v);
await p.check('#formA label.chk input >> nth=0');await lab('有效期至').locator('input').fill('2027-11-09');await lab('授权书 PDF').locator('input').setInputFiles(C+'authorization_sim.pdf');await p.setInputFiles('#formA [data-k=pdf]',C+'manual/NORDEN_manual_sim.pdf');await p.fill('#formA [data-k=doc]','AA-2580705-1');
for(const [t,f] of [['零件清单 parts.csv','parts.csv'],['五金规格 hardware.csv','hardware.csv'],['板件尺寸 dimensions.csv','dimensions.csv'],['客服常见问题','faq.csv'],['术语与俗称','terms.csv'],['每步预计用时','step_times.csv']])await lab(t).locator('input').setInputFiles(C+f);
await lab('三维模型').locator('input').setInputFiles([C+'model/norden_table.obj',C+'model/norden_drawer.obj']);await lab('实物照片').locator('input').setInputFiles(fs.readdirSync(C+'photos').map(x=>C+'photos/'+x));
await p.click('#goA');await p.waitForURL(/project\.html/);await ready();g=await p.evaluate(()=>document.querySelector('.pipe a .g').textContent);
ck('full form: stage 1 passes with no file written by hand',g==='通过',g+' '+await p.evaluate(()=>[...document.querySelectorAll('.ck.fail,.ck.warn')].map(x=>x.textContent.slice(0,90)).join(' ;; ')));
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
