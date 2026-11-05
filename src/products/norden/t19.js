const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/';
(async()=>{const srv=require('http').createServer((q,s)=>{const f=d+(q.url==='/'?'norden.html':q.url.slice(1));fs.readFile(f,(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':f.endsWith('.png')?'image/png':'text/html;charset=utf8'});s.end(c)}})}).listen(8791);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const branch of ['none']){const p=await b.newPage({viewport:{width:390,height:800}});const er=[];p.on('pageerror',e=>er.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/font|ERR_FAILED/.test(m.text()))er.push(m.text())});
await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
await p.goto('http://localhost:8791/');await p.waitForTimeout(1000);
const out=await p.evaluate(async branch=>{const wait=n=>new Promise(r=>setTimeout(r,n));st.pos=0;render();await wait(300);const seen=[];const miss=[];
 for(let i=0;i<P.length;i++){st.pos=i;render();const id=P[i].id;for(const v of [0,.5,1]){Anim._set(id,v);await wait(30)}if(document.getElementById('anim').hidden)miss.push(id);if(!document.getElementById('animCap').textContent)miss.push('cap'+id);if(!seen.includes(id))seen.push(id)}
 return{n:P.length,uniq:seen.length,miss,last:P[P.length-1].id}},branch);console.log(branch,JSON.stringify(out),'err',er);await p.close()}
await b.close();srv.close()})();
