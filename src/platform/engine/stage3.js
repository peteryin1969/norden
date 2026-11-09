/* Stage 3: storyboard frames (start, middle, end of every step) and the automatic animation review, run on the built assistant page.
   usage: node stage3.js <site dir> <product slug> <out dir> [three.min.js] */
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs'),path=require('path');
const [SITE,SLUG,OUT,THREE]=process.argv.slice(2);
(async()=>{const port=8890+Math.floor(Math.random()*90);const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(path.join(SITE,u),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':u.endsWith('.json')?'application/json':'text/html;charset=utf8'});s.end(c)}})}).listen(port);
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await (await b.newContext({viewport:{width:480,height:900}})).newPage();const er=[];p.on('pageerror',e=>er.push(e.message));
  if(THREE)await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(THREE),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
  await p.goto(`http://localhost:${port}/${SLUG}/`);await p.waitForTimeout(1500);
  const steps=await p.evaluate(()=>[...new Set(P.map(x=>x.id))].map(id=>({id,title:byId[id].title,label:byId[id].label||null})));fs.mkdirSync(path.join(OUT,'frames'),{recursive:true});const res=[];
  for(const s of steps){const on=await p.evaluate(async id=>{jump(id);await new Promise(r=>setTimeout(r,350));return !document.getElementById('anim').hidden},s.id);if(!on){res.push({...s,frames:[],checks:{}});continue}
    const frames=[];for(const [k,t] of [['a',.04],['b',.5],['c',1]]){await p.evaluate(([id,t])=>Anim._set(id,t),[s.id,t]);await p.waitForTimeout(650);const f=`frames/${s.id}_${k}.jpg`;await (await p.$('#animView')).screenshot({path:path.join(OUT,f),type:'jpeg',quality:72});frames.push(f)}
    const checks=await p.evaluate(id=>window.__audit?window.__audit(id):{},s.id);res.push({...s,frames,checks:checks||{}});process.stdout.write('.')}
  fs.writeFileSync(path.join(OUT,'auto.json'),JSON.stringify({slug:SLUG,errors:er,steps:res},null,1));console.log('\n'+SLUG,res.length,'steps',er.length?'errors '+er.join('; '):'');await b.close();srv.close()})();
