/* Bake a product's model into data and check the data against the engine, frame by frame.
   node tbake.js <product dir in site/> [out.json] */
const {chromium}=require('playwright');const fs=require('fs');const prod=process.argv[2]||'norden',outF=process.argv[3]||('model-'+prod+'.json');const d=process.cwd()+'/site/';
(async()=>{const port=8850+Math.floor(Math.random()*90);const srv=require('http').createServer((q,s)=>{const u=(q.url.split('?')[0].endsWith('/')?q.url.split('?')[0].slice(1)+'index.html':q.url.split('?')[0].slice(1));fs.readFile(d+u,(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':u.endsWith('.png')?'image/png':u.endsWith('.js')?'text/javascript':u.endsWith('.json')?'application/json':'text/html;charset=utf8'});s.end(c)}})}).listen(port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:900,height:700}});const er=[];p.on('pageerror',e=>er.push(e.message));
await p.addInitScript(()=>{window.speechSynthesis&&(window.speechSynthesis.speak=()=>{})});
await p.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await p.route('**fonts.g**',r=>r.abort());
await p.goto('http://localhost:'+port+'/'+prod+'/');await p.waitForTimeout(1200);
const steps0=await p.evaluate(()=>P.map(x=>x.id));await p.evaluate(s=>jump(s),steps0[0]);
for(let i=0;i<60;i++){if(await p.evaluate(()=>!!(window.__bake&&window.__edit&&__edit.ready())))break;await p.waitForTimeout(500)}
let steps=await p.evaluate(()=>__bake.steps());const ONLY=process.argv[4];const real=await p.evaluate(()=>{const r=__bake.isReal();return r});console.log(prod,'steps',steps.length);
const t0=Date.now();const info=await p.evaluate(()=>{const M=__bake.bake();const s=JSON.stringify(M);window.__MS=s;window.__M=JSON.parse(s);return{bytes:s.length,scenes:M.scenes.map(x=>x.nodes.length),geoms:M.geoms.length,kinds:M.geoms.reduce((a,g)=>(a[g.k]=(a[g.k]||0)+1,a),{}),mats:M.mats.length,parts:M.parts.length,holes:M.holes.length,warn:[...new Set(M.warn)],keys:M.steps.map(s=>Object.keys(s.nodes).length)}});
console.log('baked in',((Date.now()-t0)/1000).toFixed(1)+'s',JSON.stringify(info));
const str=await p.evaluate(()=>window.__MS);fs.writeFileSync(outF,str);
await p.evaluate(()=>__bake.look(false));await p.addScriptTag({content:fs.readFileSync('mplay.js','utf8')});await p.evaluate(async()=>{window.__P=new ModelPlayer(THREE,window.__M);await __P.ready});
if(ONLY)steps=steps.filter(x=>ONLY.split(',').includes(x));const R=[];let worst={pos:0,pix:0};
for(const s of steps){const r=await p.evaluate(async s=>{const M=window.__M,N=M.samples,{ren,cam,T3}=__bake.kit(),gl=ren.getContext(),W=gl.drawingBufferWidth,H=gl.drawingBufferHeight;
  const list=sc=>{const a=[];const w=o=>{a.push(o);o.children.forEach(w)};sc.children.forEach(w);return a};const vis=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true};
  const shot=sc=>{ren.render(sc,cam);const px=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px);return px};
  let mp=0,mv=0,mc=0,pix=0,pixAt=-1,frames=0,nz=0;
  for(let i=0;i<=N;i++){const sc=__bake.pose(s,i/N),A=list(sc),E=A.map(o=>({v:vis(o),m:o.matrixWorld.elements.slice(),c:o.material&&!Array.isArray(o.material)&&o.material.color?o.material.color.getHex():-1}));
    let pa=null;if(i%10===0){cam.updateMatrixWorld(true);pa=shot(sc)}
    const s2=__P.pose(s,i/N),B=list(s2);if(B.length!==A.length)return{err:'node count '+A.length+' vs '+B.length};
    for(let k=0;k<A.length;k++){const o=B[k],v=vis(o);if(v!==E[k].v){mv++;continue}if(!v)continue;const m=o.matrixWorld.elements;for(let j=0;j<16;j++){const dlt=Math.abs(m[j]-E[k].m[j]);if(dlt>mp){mp=dlt;window.__w={k,j,i,t:M.scenes[0].nodes[k]&&M.scenes[0].nodes[k].t,loc:[o.position.toArray(),A[k].position.toArray(),o.quaternion.toArray(),A[k].quaternion.toArray(),o.scale.toArray(),A[k].scale.toArray()],par:M.scenes[0].nodes[k].p}}}const c=o.material&&!Array.isArray(o.material)&&o.material.color?o.material.color.getHex():-1;if(c!==E[k].c)mc++}
    if(pa&&!window.__dg){const D=[];for(let k=0;k<A.length&&D.length<6;k++){const x=A[k],y=B[k];if(!E[k].v)continue;const mx=Array.isArray(x.material)?x.material[0]:x.material,my=Array.isArray(y.material)?y.material[0]:y.material;
      const im=z=>z.isInstancedMesh?z.count+':'+Array.prototype.reduce.call(z.instanceMatrix.array.subarray(0,z.count*16),(q,v)=>q+v,0).toFixed(2):'';const px={im:im(x),gn:x.geometry?x.geometry.attributes.position.count:0,gv:x.geometry?x.geometry.attributes.position.version:0,dr:x.geometry?JSON.stringify(x.geometry.drawRange):'',mt:mx?mx.type:'',op:mx?mx.opacity:0,tr:mx?mx.transparent:0,mp:mx?!!mx.map:0,mv:mx?mx.visible:0,em:mx&&mx.emissive?mx.emissive.getHex():0,in:x.isLight?x.intensity:0,ro:x.renderOrder,cs:x.castShadow,rs:x.receiveShadow,sd:mx?mx.side:0},
        py={im:im(y),gn:y.geometry?y.geometry.attributes.position.count:0,gv:px.gv,dr:y.geometry?JSON.stringify(y.geometry.drawRange):'',mt:my?my.type:'',op:my?my.opacity:0,tr:my?my.transparent:0,mp:my?!!my.map:0,mv:my?my.visible:0,em:my&&my.emissive?my.emissive.getHex():0,in:y.isLight?y.intensity:0,ro:y.renderOrder,cs:y.castShadow,rs:y.receiveShadow,sd:my?my.side:0};
      if(JSON.stringify(px)!==JSON.stringify(py))D.push([k,px,py])}if(D.length)window.__dg={i,D}}
    if(pa){const pb=shot(s2);let n=0,z=0;for(let q=0;q<pa.length;q+=4){if(pa[q+3])z++;if(Math.abs(pa[q]-pb[q])>24||Math.abs(pa[q+1]-pb[q+1])>24||Math.abs(pa[q+2]-pb[q+2])>24||Math.abs(pa[q+3]-pb[q+3])>24)n++}const f=n/(W*H);if(f>pix){pix=f;pixAt=i}frames++;nz+=z/(W*H)}}
  /* between samples: how far does interpolation drift */
  let mid=0;for(let i=0;i<N;i+=7){const x=(i+.5)/N,sc=__bake.pose(s,x),A=list(sc),E=A.map(o=>({v:vis(o),m:o.matrixWorld.elements.slice()}));const B=list(__P.pose(s,x));for(let k=0;k<A.length;k++){if(!E[k].v||!vis(B[k]))continue;const m=B[k].matrixWorld.elements;for(let j=12;j<15;j++){const dlt=Math.abs(m[j]-E[k].m[j]);if(dlt>mid)mid=dlt}}}
  __bake.pose(s,1);/* leave the engine as the bake left it: some parts keep a leftover turn from the last pose of their own step */
  const dg=window.__dg;window.__dg=null;return{s,dg,samples:N+1,w:window.__w,mp,mv,mc,pix,pixAt,frames,fill:nz/frames,mid}},s);
  R.push(r);if(r.err){console.log('FAIL',s,r.err);continue}worst.pos=Math.max(worst.pos,r.mp);worst.pix=Math.max(worst.pix,r.pix);
  const ok=r.mp<2e-3&&r.mv===0&&r.mc===0&&r.pix<.003;console.log((ok?'ok  ':'FAIL')+' step '+s+' | '+r.samples+' samples: matrix err '+r.mp.toExponential(1)+', vis mismatches '+r.mv+', colour mismatches '+r.mc+' | '+r.frames+' renders: worst differing pixels '+(r.pix*100).toFixed(3)+'%'+(r.pix?' @'+r.pixAt:'')+' (drawn '+(r.fill*100).toFixed(0)+'%) | between samples drift '+r.mid.toFixed(3)+' cm');r.ok=ok;if(!ok)console.log(JSON.stringify(r.w));if(r.dg)console.log('  props differ @'+r.dg.i+': '+JSON.stringify(r.dg.D).slice(0,900))}
const okN=R.filter(r=>r.ok).length;console.log('PASS',okN+'/'+R.length,'size',(str.length/1024).toFixed(0)+' KB','worst matrix',worst.pos.toExponential(1),'worst pixels',(worst.pix*100).toFixed(3)+'%','err',er.slice(0,3));
fs.writeFileSync('bake-'+prod+'.report.json',JSON.stringify({prod,info,R},null,0));await b.close();srv.close()})();
