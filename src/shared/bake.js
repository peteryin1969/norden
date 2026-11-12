/* bake.js — turns the product's model into data. Runs inside the Anim closure, after edit.js.
   Output ("assembly-model" v1): scenes of nodes (parts with geometry and material), and per step the motion of every
   node as keyframes, so the model plays in mplay.js with no product code. Boards and cylinders keep their real sizes. */
function bkB64(a){const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
const bkR=(v,k)=>Math.round(v*k)/k;
function bkSame(g,h,all){const A=all?['position','normal','uv']:['position'];for(const n of A){const a=g.attributes[n],b=h.attributes[n];if(!a&&!b)continue;if(!a||!b||a.count!==b.count)return false;for(let i=0;i<a.array.length;i++)if(Math.abs(a.array[i]-b.array[i])>1e-5)return false}
  if(!!g.index!==!!h.index)return false;if(g.index){if(g.index.count!==h.index.count)return false;for(let i=0;i<g.index.count;i++)if(g.index.array[i]!==h.index.array[i])return false}return true}
function bkGeom(g,M){if(M.gid.has(g.uuid))return M.gid.get(g.uuid);let rec=null;const P=g.parameters;
  try{if(g.type==='BoxGeometry'&&P){const h=new T3.BoxGeometry(P.width,P.height,P.depth,P.widthSegments,P.heightSegments,P.depthSegments);if(bkSame(g,h,true)){rec={k:'box',a:[P.width,P.height,P.depth]};if((P.widthSegments||1)>1||(P.heightSegments||1)>1||(P.depthSegments||1)>1)rec.a.push(P.widthSegments||1,P.heightSegments||1,P.depthSegments||1)}h.dispose()}
    else if(g.type==='CylinderGeometry'&&P){const a=[P.radiusTop,P.radiusBottom,P.height,P.radialSegments,P.heightSegments,P.openEnded,P.thetaStart,P.thetaLength],h=new T3.CylinderGeometry(...a);if(bkSame(g,h,true)){rec={k:'cyl',a:a.map(x=>x===undefined?null:x)};while(rec.a.length>3&&rec.a[rec.a.length-1]===null)rec.a.pop()}h.dispose()}
    else if(g.type==='EdgesGeometry'&&P&&P.geometry){const src=bkGeom(P.geometry,M),h=new T3.EdgesGeometry(P.geometry,P.thresholdAngle);if(bkSame(g,h,false))rec={k:'edges',g:src,a:P.thresholdAngle===undefined?null:P.thresholdAngle};h.dispose()}}catch(e){rec=null}
  if(!rec){rec={k:'raw',pos:bkB64(g.attributes.position.array),n:g.attributes.position.count};if(g.attributes.normal)rec.nor=bkB64(g.attributes.normal.array);if(g.attributes.uv)rec.uv=bkB64(g.attributes.uv.array);
    if(g.index){const big=g.index.array.BYTES_PER_ELEMENT>2||g.attributes.position.count>65535,ar=big?(g.index.array instanceof Uint32Array?g.index.array:Uint32Array.from(g.index.array)):(g.index.array instanceof Uint16Array?g.index.array:Uint16Array.from(g.index.array));rec.idx=bkB64(ar);if(big)rec.i32=1}
    if(g.groups&&g.groups.length)rec.grp=g.groups.map(x=>[x.start,x.count,x.materialIndex||0])}
  const key=JSON.stringify(rec);let id=M.gkey.get(key);if(id===undefined){id=M.out.geoms.length;M.out.geoms.push(rec);M.gkey.set(key,id)}M.gid.set(g.uuid,id);return id}
function bkTex(x){let src='';try{const im=x.image;if(im&&im.toDataURL)src=im.toDataURL('image/png');else if(im&&im.src)src=im.src}catch(e){}const r={src,flipY:x.flipY};
  if(x.repeat.x!==1||x.repeat.y!==1)r.rep=[x.repeat.x,x.repeat.y];if(x.offset.x||x.offset.y)r.off=[x.offset.x,x.offset.y];if(x.rotation)r.rot=x.rotation;if(x.center.x||x.center.y)r.ctr=[x.center.x,x.center.y];
  if(x.wrapS!==1001||x.wrapT!==1001)r.wrap=[x.wrapS,x.wrapT];r.f=[x.minFilter,x.magFilter];if(x.anisotropy>1)r.an=x.anisotropy;r.enc=x.encoding;return r}
function bkMat(m,M){if(M.mid.has(m.uuid))return M.mid.get(m.uuid);const r={k:m.type};r.ord=m.id;/* drawing order among coplanar faces follows the order materials were made in */if(m.color)r.c=m.color.getHex();if(m.emissive&&m.emissive.getHex())r.e=m.emissive.getHex();
  if(m.opacity!==1)r.o=m.opacity;if(m.transparent)r.tr=1;if(m.side!==0)r.sd=m.side;if(!m.depthTest)r.dt=0;if(!m.depthWrite)r.dw=0;if(m.polygonOffset)r.po=[m.polygonOffsetFactor,m.polygonOffsetUnits];
  if(m.flatShading)r.fs=1;if(m.wireframe)r.wf=1;if(m.vertexColors)r.vc=1;if(m.visible===false)r.hid=1;if(m.toneMapped===false)r.tm=0;if(m.alphaTest)r.at=m.alphaTest;if(m.blending!==1)r.bl=m.blending;
  if(m.isMeshStandardMaterial){r.ro=m.roughness;r.me=m.metalness}if(m.isMeshPhongMaterial){r.sh=m.shininess;r.sp=m.specular.getHex()}if(m.isSpriteMaterial){if(m.sizeAttenuation===false)r.sa=0;if(m.rotation)r.rot=m.rotation}
  if(m.isLineDashedMaterial){r.ds=[m.dashSize,m.gapSize,m.scale]}if(m.map){const tr=bkTex(m.map),key=JSON.stringify(tr);let ti=M.tkey.get(key);if(ti===undefined){ti=M.out.texs.length;M.out.texs.push(tr);M.tkey.set(key,ti)}r.map=ti}
  const id=M.out.mats.length;M.out.mats.push(r);M.mid.set(m.uuid,id);M.mobj.push(m);return id}
function bkScene(sc,M){const S={nodes:[]},objs=[];if(sc.background&&sc.background.isColor)S.bg=sc.background.getHex();
  /* editing aids are not part of the model */
  const aid=o=>o.type==='BoxHelper'||o.isTransformControls||o.type==='GridHelper'||(typeof ST!=='undefined'&&ST&&(o===ST.proxy||o===ST.hov||o===ST.grid||(ST.marks||[]).includes(o)));
  const walk=(o,p)=>{if(aid(o))return;const i=objs.length;objs.push(o);const n={p};S.nodes.push(n);
    if(o.isMesh||o.isLineSegments||o.isLine||o.isPoints){n.t=o.isMesh?'M':o.isLineSegments?'L':o.isLine?'l':'P';n.g=bkGeom(o.geometry,M);n.m=Array.isArray(o.material)?o.material.map(x=>bkMat(x,M)):bkMat(o.material,M);if(o.isInstancedMesh){n.inst=bkB64(o.instanceMatrix.array.subarray(0,o.count*16));n.cnt=o.count;if(o.instanceColor)n.icol=bkB64(o.instanceColor.array.subarray(0,o.count*3))}if(o.isLine&&!o.isLineSegments&&o.material.isLineDashedMaterial)n.ld=1}
    else if(o.isSprite){n.t='S';n.m=bkMat(o.material,M);if(o.center.x!==.5||o.center.y!==.5)n.ctr=[o.center.x,o.center.y]}
    else if(o.isAmbientLight){n.t='A';n.c=o.color.getHex();n.i=o.intensity}
    else if(o.isDirectionalLight){n.t='D';n.c=o.color.getHex();n.i=o.intensity;if(o.castShadow){const s=o.shadow,c=s.camera;n.sh={ms:[s.mapSize.x,s.mapSize.y],cam:[c.left,c.right,c.top,c.bottom,c.near,c.far],bias:s.bias,nb:s.normalBias,rad:s.radius}}const tp=o.target.position;if(o.target.parent)n._tg=o.target;else if(tp.x||tp.y||tp.z)n.tg=tp.toArray()}
    else if(o.isHemisphereLight){n.t='H';n.c=o.color.getHex();n.c2=o.groundColor.getHex();n.i=o.intensity}
    else if(o.isPointLight){n.t='Q';n.c=o.color.getHex();n.i=o.intensity;n.d=[o.distance,o.decay]}
    else{n.t='G';if(!(o.isGroup||o.type==='Object3D'))M.out.warn.push('node type '+o.type)}
    if(o.name)n.n=o.name;if(o.castShadow&&!o.isLight)n.cs=1;if(o.receiveShadow)n.rs=1;if(o.renderOrder)n.ro=o.renderOrder;if(o.frustumCulled===false)n.fc=0;if(o.userData&&o.userData.code)n.code=String(o.userData.code);
    o.children.forEach(c=>walk(c,i))};
  sc.children.forEach(c=>walk(c,-1));S.nodes.forEach(n=>{if(n._tg){const k=objs.indexOf(n._tg);if(k>=0)n.tgn=k;delete n._tg}});return{S,objs}}
function bkState(objs,mats){const n=objs.length,a=new Float32Array(n*11);for(let i=0;i<n;i++){const o=objs[i],k=i*11;a[k]=o.position.x;a[k+1]=o.position.y;a[k+2]=o.position.z;a[k+3]=o.quaternion.x;a[k+4]=o.quaternion.y;a[k+5]=o.quaternion.z;a[k+6]=o.quaternion.w;a[k+7]=o.scale.x;a[k+8]=o.scale.y;a[k+9]=o.scale.z;a[k+10]=o.visible?1:0}
  const m=new Float64Array(mats.length*4);for(let i=0;i<mats.length;i++){const x=mats[i];m[i*4]=x.color?x.color.getHex():0;m[i*4+1]=x.emissive?x.emissive.getHex():0;m[i*4+2]=x.opacity;m[i*4+3]=(x.transparent?1:0)|(x.depthWrite?2:0)|(x.visible?4:0)}return{a,m}}
/* turning between two keys; the same rule is in mplay.js (three's own slerp gives up when two rounded keys are nearly equal) */
function bkQmix(A,B,f){let bx=B[0],by=B[1],bz=B[2],bw=B[3],d=A[0]*bx+A[1]*by+A[2]*bz+A[3]*bw;if(d<0){d=-d;bx=-bx;by=-by;bz=-bz;bw=-bw}let ka=1-f,kb=f;if(d<.9995){const th=Math.acos(Math.min(1,d)),sn=Math.sin(th);ka=Math.sin((1-f)*th)/sn;kb=Math.sin(f*th)/sn}return[A[0]*ka+bx*kb,A[1]*ka+by*kb,A[2]*ka+bz*kb,A[3]*ka+bw*kb]}
/* keep only the keys that straight-line interpolation needs to stay within eps of every sample */
function bkKeys(get,N,dim,eps,quat){const rk=quat?1e7:1e4,out=[],raw=i=>get(i),v=i=>get(i).map(x=>Math.round(x*rk)/rk),near=(a,b)=>{for(let k=0;k<dim;k++)if(Math.abs(a[k]-b[k])>eps)return false;return true};
  const mid=(A,B,f)=>quat?bkQmix(A,B,f):A.map((x,k)=>x+(B[k]-x)*f);
  let a=0;out.push(a);while(a<N){let b=a+1,best=b;for(;b<=N;b++){const A=v(a),B=v(b);let ok=true;for(let j=a+1;j<b&&ok;j++){let w=mid(A,B,(j-a)/(b-a));if(quat){const s=raw(j);if(w[0]*s[0]+w[1]*s[1]+w[2]*s[2]+w[3]*s[3]<0)w=w.map(x=>-x)}if(!near(w,raw(j)))ok=false}if(ok)best=b;else break}out.push(best);a=best}
  return out}
/* the data holds the drawing look (plain colours and outlines); the wood-grain look is a display style on top */
function bkLook(real){const ls=window.localStorage,set=ls&&ls.setItem;try{if(ls)Storage.prototype.setItem=function(){}}catch(e){}try{setLook(real)}finally{try{if(ls)Storage.prototype.setItem=set}catch(e){}}}
function bakeModel(opt){opt=opt||{};const keepLook=typeof realLook!=='undefined'&&realLook;if(keepLook)bkLook(false);const N=opt.n||120,CN=opt.camEvery||10,keepCur=cur,keepT=t,keepAz=az,keepEl=el,keepPlay=playing;playing=false;az=0;el=0;
  const out={format:'assembly-model',version:1,unit:'cm',up:'y',product:document.title.replace(/\s*组装助手.*/,''),samples:N,render:{shadow:!!ren.shadowMap.enabled,shadowType:ren.shadowMap.type,tone:ren.toneMapping,enc:ren.outputEncoding,fov:32,near:cam.near,far:cam.far},scenes:[],geoms:[],texs:[],mats:[],steps:[],parts:[],holes:[],warn:[]};
  const M={out,gid:new Map(),gkey:new Map(),tkey:new Map(),mid:new Map(),mobj:[]};
  const ids=Object.keys(byId).filter(s=>CIDS.includes(s)||IDS.includes(s)),only=opt.steps?ids.filter(s=>opt.steps.includes(s)):ids;
  const SC=[];const scOf=s=>{const sc=IDS.includes(s)?scene:sc2;let k=SC.findIndex(x=>x.sc===sc);if(k<0){const r=bkScene(sc,M);k=SC.length;SC.push({sc,objs:r.objs,rest:null});out.scenes.push(r.S);r.objs.forEach((o,i)=>{o.userData._bid=i;o.userData._bsc=k})}return k};
  const pose=(s,x)=>{cur=s;t=x;if(IDS.includes(s))apply();else applyCab(s,x)};
  /* some rigs are only created the first time their step is shown: show every step once before listing the nodes */
  only.forEach(s=>{for(let i=0;i<=8;i++)pose(s,i/8)});
  only.forEach(s=>scOf(s));
  only.forEach(s=>{const k=scOf(s),X=SC[k],objs=X.objs,nO=objs.length,nM=M.mobj.length,St=[],cams=[];
    for(let i=0;i<=N;i++){pose(s,i/N);St.push(bkState(objs,M.mobj))}
    for(let i=0;i<=N;i+=CN){for(let r=0;r<45;r++){pose(s,i/N);if(typeof camFit==='function')camFit()}cam.updateMatrixWorld(true);const p=cam.position,q=cam.quaternion,tg=typeof camTgt!=='undefined'&&camTgt?p.distanceTo(camTgt):p.length();cams.push(i,bkR(p.x,100),bkR(p.y,100),bkR(p.z,100),bkR(q.x,1e5),bkR(q.y,1e5),bkR(q.z,1e5),bkR(q.w,1e5),bkR(tg,10))}
    if(!X.rest){X.rest=St[0];const R=X.rest.a;out.scenes[k].nodes.forEach((n,i)=>{const b=i*11;n.x=[bkR(R[b],1e4),bkR(R[b+1],1e4),bkR(R[b+2],1e4),bkR(R[b+3],1e6),bkR(R[b+4],1e6),bkR(R[b+5],1e6),bkR(R[b+6],1e6),bkR(R[b+7],1e4),bkR(R[b+8],1e4),bkR(R[b+9],1e4)];if(!R[b+10])n.h=1})}
    const R=X.rest.a,tr={},mt={};
    for(let i=0;i<nO;i++){const b=i*11,ch={};[['p',0,3,2e-4,false,1e4],['q',3,4,2e-6,true,1e7],['s',7,3,2e-4,false,1e4]].forEach(([nm,o,d,eps,qt,rk])=>{let diff=false;for(let j=0;j<=N&&!diff;j++)for(let c=0;c<d;c++)if(Math.abs(St[j].a[b+o+c]-R[b+o+c])>eps){diff=true;break}if(!diff)return;
        const get=j=>{const r=[];for(let c=0;c<d;c++)r.push(St[j].a[b+o+c]);return r};const ks=bkKeys(get,N,d,eps,qt),flat=[];ks.forEach(j=>{flat.push(j);get(j).forEach(v=>flat.push(bkR(v,rk)))});ch[nm]=flat});
      let dv=false;for(let j=0;j<=N;j++)if(St[j].a[b+10]!==R[b+10]){dv=true;break}if(dv){const f=[];let last=-1;for(let j=0;j<=N;j++){const v=St[j].a[b+10];if(v!==last){f.push(j,v);last=v}}ch.v=f}
      if(Object.keys(ch).length)tr[i]=ch}
    /* materials: colour, glow and opacity change in steps, held until the next change. Reference is the model's first state. */
    if(!M.mrest)M.mrest=St[0].m;const MR=M.mrest;
    for(let i=0;i<nM;i++){const ch={};[['c',0],['e',1],['o',2],['f',3]].forEach(([nm,o])=>{let diff=false;for(let j=0;j<=N;j++)if(St[j].m[i*4+o]!==MR[i*4+o]){diff=true;break}if(!diff)return;const f=[];let last=NaN;for(let j=0;j<=N;j++){const v=St[j].m[i*4+o];if(v!==last){f.push(j,nm==='o'?bkR(v,1e3):v);last=v}}ch[nm]=f});if(Object.keys(ch).length)mt[i]=ch}
    const sd=byId[s]||{};out.steps.push({id:s,title:sd.title||'',label:sd.label||('第 '+s+' 步'),scene:k,dur:(typeof DUR!=='undefined'&&DUR[s])||1,parts:(sd.parts||[]).map(p=>[String(p[0]),p[1]]),nodes:tr,mats:mt,cam:cams})});
  /* what the nodes mean: parts with code and name, groups, holes */
  const bid=o=>o&&o.userData&&o.userData._bid!=null?[o.userData._bsc,o.userData._bid]:null;
  if(typeof CP!=='undefined')CP.forEach((p,i)=>{const b=bid(p.m);if(!b)return;const r={id:'cp'+i,scene:b[0],node:b[1],steps:Object.keys(p.keys||{})};const c=p.code||(p.m.userData&&p.m.userData.code);if(c)r.code=String(c);if(p.lbl)r.name=p.lbl;if(p.G&&p.G.name)r.group=p.G.name;out.parts.push(r)});
  if(typeof GS!=='undefined')GS.forEach(G=>{const b=bid(G.g);if(!b)return;const r={id:'gs:'+G.name,scene:b[0],node:b[1],kind:'group',steps:Object.keys(G.seq||{}).filter(k=>G.seq[k]!==null)},nm=(window.PART_NAMES||{})['gs:'+G.name];if(nm)r.name=nm;out.parts.push(r)});
  if(typeof parts!=='undefined'&&Array.isArray(parts))parts.forEach((p,i)=>{const b=bid(p.m||p.g||p);if(!b)return;const r={id:'dp'+i,scene:b[0],node:b[1]};if(p.code)r.code=String(p.code);if(p.lbl)r.name=p.lbl;out.parts.push(r)});
  if(typeof MARKS!=='undefined')MARKS.forEach(h=>{const b=bid(h.d);if(b)out.holes.push({scene:b[0],node:b[1],steps:(h.steps||[]).slice()})});
  SC.forEach(X=>X.objs.forEach(o=>{delete o.userData._bid;delete o.userData._bsc}));
  out.mats.forEach((r,i)=>{const c=M.mrest[i*4],e=M.mrest[i*4+1],o=M.mrest[i*4+2],f=M.mrest[i*4+3];if(r.c!==undefined)r.c=c;if(e)r.e=e;else delete r.e;if(o!==1)r.o=bkR(o,1e3);else delete r.o;if(f&1)r.tr=1;else delete r.tr;if(f&2)delete r.dw;else r.dw=0;if(f&4)delete r.hid;else r.hid=1});
  if(keepLook)bkLook(true);cur=keepCur;t=keepT;az=keepAz;el=keepEl;playing=keepPlay;if(cur){if(IDS.includes(cur))apply();else applyCab(cur,Math.min(t,1))}
  return out}
window.__bake={bake:bakeModel,look:r=>bkLook(r),isReal:()=>typeof realLook!=='undefined'&&realLook,
  /* for checking a baked model against the engine: pose the engine, hand over its scene, camera and renderer */
  pose:(s,x)=>{cur=s;t=x;playing=false;if(IDS.includes(s))apply();else applyCab(s,x);curScene().updateMatrixWorld(true);return IDS.includes(s)?scene:sc2},
  kit:()=>({ren,cam,T3}),steps:()=>Object.keys(byId).filter(s=>CIDS.includes(s)||IDS.includes(s))};
