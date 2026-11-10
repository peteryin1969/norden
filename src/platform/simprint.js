/* Prints the simulated package's PDFs, exports the assembled NORDEN model as OBJ (millimetres, one object per part, named by part code or board name),
   and renders three product views as stand-in photos. usage: node simprint.js <package dir> <site dir> <three.min.js> */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');const [D,SITE,THREE]=process.argv.slice(2);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const pp=await b.newPage();
  for(const [src,out] of [['auth.html','authorization_sim.pdf'],['manual.html','manual/NORDEN_manual_sim.pdf']]){await pp.goto('file://'+path.resolve(D,'_src',src));await pp.waitForTimeout(400);await pp.pdf({path:path.join(D,out),format:'A4',printBackground:true})}
  const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(path.join(SITE,u),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':'text/html;charset=utf8'});s.end(c)}})}).listen(8879);
  const p=await (await b.newContext({viewport:{width:800,height:900}})).newPage();await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync(THREE),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
  await p.goto('http://localhost:8879/norden/');await p.waitForTimeout(1500);let tot='';
  for(const [st,fn] of [['8','norden_table.obj'],['10','norden_drawer.obj']]){await p.evaluate(async st=>{jump(st);await new Promise(r=>setTimeout(r,500));Anim._set(st,1)},st);await p.waitForTimeout(900);
  const obj=await p.evaluate(()=>{const M=window.__model(),T3=M.T3,C=typeof CELLS!=='undefined'?CELLS:[];M.scene.updateMatrixWorld(true);const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
    const own=new Map();M.CP.forEach((p,i)=>{const c=p.lbl&&!p.code?null:(p.code||M.codeOf(p.m));const nm=c&&C.find(x=>x.code===c)?c:(p.lbl||'').replace(/（.*$/,'');if(nm&&vis(p.m))own.set(p.m,nm+'_'+i)});
    M.GS.forEach((G,i)=>{if(M.PANEL[G.name]&&vis(G.g))own.set(G.g,M.PANEL[G.name]+'_'+G.name)});
    let out='# NORDEN simulated model (模拟), millimetres, one object per part\n',vo=1;const v=new T3.Vector3();const seen=new Set();
    const emit=(root,name)=>{const meshes=[];root.traverse(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&vis(o)&&!seen.has(o)){if(o!==root){let q=o.parent;while(q&&q!==root){if(own.has(q))return;q=q.parent}}meshes.push(o)}});if(!meshes.length)return;out+='o '+name+'\n';
      meshes.forEach(m=>{seen.add(m);const g=m.geometry,pos=g.attributes.position;for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld).multiplyScalar(10);out+='v '+v.x.toFixed(2)+' '+v.y.toFixed(2)+' '+v.z.toFixed(2)+'\n'}
        const idx=g.index;if(idx){for(let i=0;i<idx.count;i+=3)out+='f '+(vo+idx.getX(i))+' '+(vo+idx.getX(i+1))+' '+(vo+idx.getX(i+2))+'\n'}else{for(let i=0;i<pos.count;i+=3)out+='f '+(vo+i)+' '+(vo+i+1)+' '+(vo+i+2)+'\n'}vo+=pos.count})};
    [...own].filter(([o])=>M.CP.some(p=>p.m===o)).forEach(([o,n])=>emit(o,n));[...own].filter(([o])=>!M.CP.some(p=>p.m===o)).forEach(([o,n])=>emit(o,n));return out});
  fs.writeFileSync(path.join(D,'model',fn),obj);tot+=obj}
  await p.evaluate(async()=>{jump('11');await new Promise(r=>setTimeout(r,500))});const obj=tot;
  for(const [i,az] of [[1,0],[2,1.2],[3,-2.2]]){await p.evaluate(a=>{Anim._set('11',1);if(Anim.view)Anim.view('reset')},az);await p.waitForTimeout(300);if(az){await p.evaluate(a=>{const v=document.getElementById('animView'),r=v.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;const e=(t,dx)=>v.dispatchEvent(new PointerEvent(t,{clientX:x+dx,clientY:y,bubbles:true,pointerId:1,button:0,buttons:t==='pointerup'?0:1}));e('pointerdown',0);e('pointermove',a*80);e('pointerup',a*80)},az);await p.waitForTimeout(700)}await (await p.$('#animView')).screenshot({path:path.join(D,'photos',`product_${i}_render_sim.jpg`),type:'jpeg',quality:80})}
  console.log('obj bytes',obj.length,'objects',(obj.match(/^o /gm)||[]).length);await b.close();srv.close()})();
