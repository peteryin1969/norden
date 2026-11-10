/* Assembly-assistant platform, working app (no accounts, no server): projects and their files live in this browser (IndexedDB),
   the review engine is the same Python as on the platform side and runs here through Pyodide. */
const $=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e[k]=a[k];else if(a[k]!==false&&a[k]!=null)e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null?'':x)));return e};
const enc=new TextEncoder(),dec=new TextDecoder();
const now=()=>new Date().toISOString().slice(0,16).replace('T',' ')+' UTC';
const kb=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':n>=1024?Math.round(n/1024)+' KB':n+' B';
const toBuf=async x=>x instanceof ArrayBuffer?x:x instanceof Uint8Array?x.buffer.slice(x.byteOffset,x.byteOffset+x.byteLength):typeof x==='string'?enc.encode(x).buffer:await x.arrayBuffer();
async function sha(buf){const h=await crypto.subtle.digest('SHA-1',buf);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,12)}
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('读不到 '+src));document.head.append(s)})}

const DB=(()=>{let dbp;const open=()=>dbp||(dbp=new Promise((ok,no)=>{const r=indexedDB.open('assembly-platform',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('projects',{keyPath:'id'});d.createObjectStore('files',{keyPath:['pid','path']}).createIndex('pid','pid')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
  const rq=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
  const st=async(name,mode)=>(await open()).transaction(name,mode).objectStore(name);
  return{
    async projects(){return (await rq((await st('projects','readonly')).getAll())).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''))},
    async project(id){return rq((await st('projects','readonly')).get(id))},
    async putProject(p){p.updated=now();await rq((await st('projects','readwrite')).put(p));return p},
    async delProject(id){const fs=await this.files(id);const s=await st('files','readwrite');await Promise.all(fs.map(f=>rq(s.delete([id,f.path]))));await rq((await st('projects','readwrite')).delete(id))},
    async files(pid){return rq((await st('files','readonly')).index('pid').getAll(pid))},
    async file(pid,path){return rq((await st('files','readonly')).get([pid,path]))},
    /* a file that changes gets a new version number; the earlier versions are kept on record by number, size and time */
    async put(pid,path,data,o={}){const buf=await toBuf(data),h=await sha(buf),old=await this.file(pid,path);if(old&&old.hash===h)return old;
      const rec={pid,path,data:buf,size:buf.byteLength,hash:h,ver:old?old.ver+1:1,at:now(),name:o.name||path.split('/').pop(),hist:old?[...(old.hist||[]),{ver:old.ver,at:old.at,size:old.size,name:old.name}]:[]};await rq((await st('files','readwrite')).put(rec));return rec},
    async del(pid,path){await rq((await st('files','readwrite')).delete([pid,path]))}}})();

/* ---- reading a manual PDF in the browser: page count, whether it has a text layer, the text itself (what the poppler tools give the engine on the platform side) ---- */
let pdfjs=null;async function pdfLib(){if(!pdfjs){pdfjs=await import('./vendor/pdfjs/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='vendor/pdfjs/pdf.worker.min.mjs'}return pdfjs}
/* pdf.js gives some characters as Kangxi radical code points (⽂ for 文): bring them back to the ordinary characters */
const RADX=(p=>{const m={};for(let i=0;i<p.length;i+=2)m[p[i]]=p[i+1];return m})('⻓长⻆角⻔门⻋车⻢马⻙韦⻛风⻜飞⻝食⻥鱼⻦鸟⻧卤⻨麦⻩黄⻬齐⻮齿⻰龙⻳龟⻅见⻉贝⻚页⻘青⻄西⺠民⺟母⻁虎⻊足⺮竹⺶羊⺼月⻑長⻤鬼⺌小⺧牛⺩王⺫目⺬示⻇言⻕雨⻡首⻣骨');
const radicals=t=>t.replace(/[\u2e80-\u2eff\u2f00-\u2fdf]/g,c=>RADX[c]||c.normalize('NFKC'));
async function pdfInfo(buf){const lib=await pdfLib(),doc=await lib.getDocument({data:new Uint8Array(buf.slice(0))}).promise;const fonts=new Set();let text='',big=0;
  for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n),tc=await pg.getTextContent(),rows={};let chars=0;
    tc.items.forEach(it=>{if(!it.str||!it.str.trim())return;chars+=it.str.trim().length;if(it.fontName)fonts.add(it.fontName);const y=Math.round(it.transform[5]/3)*3;(rows[y]=rows[y]||[]).push([it.transform[4],it.str,it.width||0,Math.abs(it.transform[0])||Math.abs(it.transform[3])||10])});
    /* glyphs that touch are one word; a gap is a space, a wide gap a column break (as pdftotext -layout does) */
    Object.keys(rows).map(Number).sort((a,b)=>b-a).forEach(y=>{let line='',end=null;rows[y].sort((a,b)=>a[0]-b[0]).forEach(([x,str,w,fs])=>{if(end!=null){const gap=x-end;line+=gap>fs*1.2?'   ':gap>fs*.18?' ':''}line+=str;end=x+w});text+=radicals(line)+'\n'});text+='\f';
    try{const ops=await pg.getOperatorList(),hasImg=ops.fnArray.some(f=>f===lib.OPS.paintImageXObject||f===lib.OPS.paintInlineImageXObject||f===lib.OPS.paintImageXObjectRepeat);if(hasImg&&chars<20)big++}catch(e){}}
  return{pages:doc.numPages,fonts:fonts.size,page_images:big,text}}

/* ---- projects ---- */
const STATE_FILES={ans:'answers.json',sign:'signoff.json',fix:'fixes.json'};
const SOFT=new Set(['pkg/answers.json','pkg/signoff.json','pkg/ai_review.json','pkg/ai_photo.json','pkg/records/resubmit.json']);
const isHidden=p=>p.endsWith('.info.json');
/* a CSV saved by Excel in the local Chinese encoding is turned into UTF-8 on the way in */
async function csvUtf8(data){const buf=await toBuf(data);try{new TextDecoder('utf-8',{fatal:true}).decode(buf);return buf}catch(e){try{return enc.encode(new TextDecoder('gb18030').decode(buf)).buffer}catch(x){return buf}}}
async function addPkgFile(pid,path,data,name){if(/\.csv$/i.test(path))data=await csvUtf8(data);const rec=await DB.put(pid,'pkg/'+path,data,{name});if(/\.pdf$/i.test(path)){try{await DB.put(pid,'pkg/'+path+'.info.json',JSON.stringify(await pdfInfo(rec.data)))}catch(e){await DB.put(pid,'pkg/'+path+'.info.json',JSON.stringify({pages:0,fonts:0,page_images:0,text:'',error:String(e.message||e)}))}}return rec}
async function readJSON(pid,path){const f=await DB.file(pid,path);if(!f)return null;try{return JSON.parse(dec.decode(f.data))}catch(e){return null}}
async function unzip(file){if(!window.JSZip)await loadScript('vendor/jszip.min.js');const z=await JSZip.loadAsync(await toBuf(file));let names=Object.keys(z.files).filter(n=>!z.files[n].dir&&!/(^|\/)(__MACOSX|\.DS_Store)/.test(n));
  /* a zip made from a folder has that folder as the top level: drop it */const top=new Set(names.map(n=>n.split('/')[0]));if(top.size===1&&names.every(n=>n.includes('/'))){const t=[...top][0]+'/';names=names.map(n=>[n,n.slice(t.length)])}else names=names.map(n=>[n,n]);
  const out=[];for(const [n,rel] of names)out.push([rel,await z.files[n].async('arraybuffer')]);return out}
async function newProject(name){const id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);return DB.putProject({id,name,created:now(),delivery:0})}
/* the client's package as a zip that already has package.json */
async function importClientZip(pid,file,onStep){const fs=await unzip(file);if(!fs.some(([p])=>p==='package.json'))throw new Error('压缩包里没有 package.json。请用“逐项填写”的方式新建，或者把 package.json 放在压缩包的最上层。');
  let n=0;for(const [p,buf] of fs){onStep&&onStep(++n,fs.length,p);await addPkgFile(pid,p,buf)}
  const pk=await readJSON(pid,'pkg/package.json');pk.slug='app-'+pid;delete pk.package_zip;await DB.put(pid,'pkg/package.json',JSON.stringify(pk,null,1));const pr=await DB.project(pid);pr.name=pr.name||pk.name;if(fs.some(([p])=>p==='steps.draft.json'))pr.delivery=Math.max(pr.delivery||0,1);await DB.putProject(pr);return pk}
/* what the platform hands over: steps, generated content, the storyboard frames with the self-check result, the test results. Each import is one more delivery. */
async function importDelivery(pid,file,onStep){const fs=await unzip(file);const has=p=>fs.some(([x])=>x===p);if(!has('steps.draft.json')&&!has('auto.json'))throw new Error('这不是平台交付包：里面没有 steps.draft.json，也没有 auto.json。');
  let n=0;for(const [p,buf] of fs){onStep&&onStep(++n,fs.length,p);
    if(p==='package.patch.json'){const pk=await readJSON(pid,'pkg/package.json'),patch=JSON.parse(dec.decode(buf));Object.assign(pk,patch);await DB.put(pid,'pkg/package.json',JSON.stringify(pk,null,1))}
    else if(p==='auto.json'||p==='tests.json'||p.startsWith('frames/'))await DB.put(pid,'out/'+p,buf);
    else if(p.startsWith('img/'))await DB.put(pid,'asset/'+p,buf);
    else if(p==='delivery.json')await DB.put(pid,'out/delivery.json',buf);
    else if(p==='release.json'){const cur=await readJSON(pid,'pkg/release.json')||{},nw=JSON.parse(dec.decode(buf));await DB.put(pid,'pkg/release.json',JSON.stringify(Object.assign({},nw,{qr_location:cur.qr_location||nw.qr_location,approved_by:cur.approved_by,approved_at:cur.approved_at}),null,1))}
    else await addPkgFile(pid,p,buf)}
  const pr=await DB.project(pid);pr.delivery=(pr.delivery||0)+1;pr.deliveredAt=now();await DB.putProject(pr);return pr}

/* ---- the engine ---- */
let PY=null;async function py(onMsg){if(PY)return PY;onMsg&&onMsg('正在加载审核引擎（第一次要十几秒，之后会快）…');await loadScript('vendor/pyodide/pyodide.js');const p=await loadPyodide({indexURL:'vendor/pyodide/'});p.FS.mkdirTree('/eng');
  for(const n of ['engine.py','stage45.py','fixes.py'])p.FS.writeFile('/eng/'+n,await (await fetch('engine/'+n+'?'+(window.APPBUILD||''))).text());PY=p;return p}
async function engineHash(pid){const fs=(await DB.files(pid)).filter(f=>(f.path.startsWith('pkg/')||f.path.startsWith('out/'))&&!SOFT.has(f.path)&&f.path!=='out/report.json'&&f.path!=='out/stage3_rounds.json').map(f=>f.path+':'+f.hash).sort().join('|');return sha(enc.encode(fs).buffer)}
async function runEngine(pid,onMsg){const p=await py(onMsg),fs=await DB.files(pid);onMsg&&onMsg('正在审核…');
  p.runPython("import shutil,os\nfor d in ('/pkg','/out'):\n    shutil.rmtree(d,ignore_errors=True); os.makedirs(d)");
  for(const f of fs){if(!(f.path.startsWith('pkg/')||f.path.startsWith('out/'))||f.path==='out/report.json')continue;const full='/'+f.path,dir=full.slice(0,full.lastIndexOf('/'));p.FS.mkdirTree(dir);p.FS.writeFile(full,new Uint8Array(f.data))}
  await p.runPythonAsync("import sys,json,os\nsys.path.insert(0,'/eng') if '/eng' not in sys.path else None\nimport engine\nauto=json.load(open('/out/auto.json',encoding='utf8')) if os.path.exists('/out/auto.json') else None\nengine.run('/pkg','/out',auto)");
  const rep=JSON.parse(p.FS.readFile('/out/report.json',{encoding:'utf8'}));await DB.put(pid,'out/report.json',JSON.stringify(rep));
  try{await DB.put(pid,'out/stage3_rounds.json',p.FS.readFile('/out/stage3_rounds.json',{encoding:'utf8'}))}catch(e){}
  const pr=await DB.project(pid);pr.engineHash=await engineHash(pid);pr.engineAt=now();pr.softAt=null;pr.gates=rep.stages.map(s=>s.gate);pr.name=pr.name||rep.product;await DB.putProject(pr);return rep}

async function exportZip(pid){if(!window.JSZip)await loadScript('vendor/jszip.min.js');const z=new JSZip(),fs=await DB.files(pid),pr=await DB.project(pid);
  fs.forEach(f=>{if(!isHidden(f.path))z.file(f.path.replace(/^pkg\//,'资料包/').replace(/^out\//,'审核结果/').replace(/^asset\//,'平台交付图片/'),f.data)});
  z.file('文件版本记录.json',JSON.stringify(fs.filter(f=>!isHidden(f.path)).map(f=>({path:f.path,ver:f.ver,at:f.at,size:f.size,earlier:f.hist})),null,1));
  const b=await z.generateAsync({type:'blob'});const a=$('a',{href:URL.createObjectURL(b),download:(pr.name||pid).replace(/[\\/:*?"<>|\s]+/g,'_')+'.zip'});document.body.append(a);a.click();a.remove()}
function download(name,data,type){const a=$('a',{href:URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:type||'application/octet-stream'})),download:name});document.body.append(a);a.click();a.remove()}

/* handing in one more piece of data: the file goes to its place and package.json is told what it is, so nobody edits JSON by hand */
const KINDS=[['parts','零件清单（CSV）','.csv'],['hardware','五金规格（CSV）','.csv'],['dimensions','板件尺寸（CSV）','.csv'],['authorization','授权书（PDF）','.pdf'],['manual','装配说明书（PDF）','.pdf'],['model','三维模型（可多选）','.obj,.step,.stp,.gltf,.glb'],['photos','实物照片（可多选）','image/*'],['faq','客服常见问题（CSV）','.csv'],['terms','术语与俗称（CSV）','.csv'],['est_min','每步预计用时（CSV）','.csv'],['other','其他文件（自己写路径）','']];
const safeName=n=>n.replace(/[^\w.\-\u4e00-\u9fff]+/g,'_');
async function registerFiles(pid,kind,list,otherPath){const pk=await readJSON(pid,'pkg/package.json');pk.files=pk.files||{};pk.optional=pk.optional||{};const fixed={parts:'parts.csv',hardware:'hardware.csv',dimensions:'dimensions.csv',faq:'faq.csv',terms:'terms.csv',est_min:'step_times.csv'};
  for(const f of list){
    if(fixed[kind]){const p=(kind in {parts:1,hardware:1,dimensions:1}?pk.files[kind]:pk.optional[kind])||fixed[kind];await addPkgFile(pid,p,f,f.name);if(kind in {parts:1,hardware:1,dimensions:1})pk.files[kind]=p;else pk.optional[kind]=p}
    else if(kind==='authorization'){const p=(pk.authorization&&pk.authorization.file)||'authorization/'+safeName(f.name);await addPkgFile(pid,p,f,f.name);pk.authorization=Object.assign({scope:'未填写',valid_to:'未填写'},pk.authorization,{file:p})}
    else if(kind==='manual'){const p='manual/'+safeName(f.name);await addPkgFile(pid,p,f,f.name);const info=await readJSON(pid,'pkg/'+p+'.info.json'),pages=info&&info.pages||0;const m=(pk.manuals||[]).find(m=>m.pdf===p)||(pk.manuals||[]).find(m=>!m.pdf);if(m){m.pdf=p;m.pages=pages}else(pk.manuals=pk.manuals||[]).push({doc:f.name.replace(/\.pdf$/i,''),title:pk.name+' 装配说明书',pdf:p,pages_dir:null,pages})}
    else if(kind==='model'){const p='model/'+safeName(f.name);await addPkgFile(pid,p,f,f.name);const L=Array.isArray(pk.optional.model3d)?pk.optional.model3d:pk.optional.model3d?[pk.optional.model3d]:[];if(!L.includes(p))L.push(p);pk.optional.model3d=L}
    else if(kind==='photos'){await addPkgFile(pid,'photos/'+safeName(f.name),f,f.name);pk.optional.photos='photos'}
    else{const p=(list.length===1&&otherPath?otherPath:(otherPath?otherPath.replace(/\/?$/,'/'):'')+f.name).replace(/^\/+/,'');await addPkgFile(pid,p,f,f.name)}}
  await DB.put(pid,'pkg/package.json',JSON.stringify(pk,null,1))}
