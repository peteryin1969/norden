/* masm.js — from an assembled 3D file (GLB, one node per part) to an assembly-model: the positions are the file's,
   a person only says which parts belong to which step. MAsm.parseGLB -> MAsm.base -> (edit M.asm.steps) -> MAsm.steps */
(function(root){
const KEY=n=>String(n||'').replace(/​/g,'').trim().replace(/_blk$/i,'').replace(/\s*\(\d+\)$/,'').replace(/[_-]\d{1,3}$/,'').trim()||'零件';
const GREEN=0x7fd3ab,WORLD={U:[0,1,0],D:[0,-1,0],R:[1,0,0],L:[-1,0,0],F:[0,0,1],B:[0,0,-1]},DIRNAME={U:'从上往下',D:'从下往上',R:'从右边',L:'从左边',F:'从前面',B:'从后面'};
const POSES={up:'原样放',front:'向前倒（前面朝下）',back:'向后倒（后面朝下）',left:'向左倒',right:'向右倒',over:'倒过来'};
function Q(T3,pose){const q=new T3.Quaternion(),X=new T3.Vector3(1,0,0),Z=new T3.Vector3(0,0,1),h=Math.PI/2;
  return pose==='front'?q.setFromAxisAngle(Z,-h):pose==='back'?q.setFromAxisAngle(Z,h):pose==='left'?q.setFromAxisAngle(X,-h):pose==='right'?q.setFromAxisAngle(X,h):pose==='over'?q.setFromAxisAngle(X,Math.PI):q}
const b64=a=>{const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(typeof Buffer!=='undefined')return Buffer.from(u).toString('base64');let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
const hex=c=>{const f=v=>Math.round(255*Math.pow(Math.max(0,Math.min(1,v)),1/2.2));return f(c[0])<<16|f(c[1])<<8|f(c[2])};
/* GLB -> parts: vertices in centimetres about each part's own box centre, welded; the assembly's centre is the origin */
function parseGLB(buf,T3){const dv=new DataView(buf);if(dv.byteLength<20||dv.getUint32(0,true)!==0x46546C67)throw new Error('这不是 GLB 文件。请导出为 .glb（二进制 glTF）。');
  const jl=dv.getUint32(12,true),J=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),b0=20+jl+8;if(b0>dv.byteLength)throw new Error('这个 GLB 里没有几何数据。');
  const acc=i=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],C={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array}[a.componentType],sz=C.BYTES_PER_ELEMENT,off=b0+(v.byteOffset||0)+(a.byteOffset||0),st=v.byteStride||n*sz,out=new C(a.count*n);
    for(let k=0;k<a.count;k++)for(let c=0;c<n;c++){const p=off+k*st+c*sz;out[k*n+c]=C===Float32Array?dv.getFloat32(p,true):C===Uint16Array?dv.getUint16(p,true):C===Uint32Array?dv.getUint32(p,true):dv.getUint8(p)}return out};
  const world=[];const walk=(i,pm)=>{const n=J.nodes[i],m=new T3.Matrix4();if(n.matrix)m.fromArray(n.matrix);else m.compose(new T3.Vector3(...(n.translation||[0,0,0])),new T3.Quaternion(...(n.rotation||[0,0,0,1])),new T3.Vector3(...(n.scale||[1,1,1])));const w=pm.clone().multiply(m);world[i]=w;(n.children||[]).forEach(c=>walk(c,w))};
  ((J.scenes||[])[J.scene||0]||{nodes:J.nodes.map((n,i)=>i)}).nodes.forEach(r=>walk(r,new T3.Matrix4()));
  const parts=[];J.nodes.forEach((n,i)=>{if(n.mesh===undefined||!world[i])return;const W=world[i],flip=W.determinant()<0,map=new Map(),pos=[],idx=[],v=new T3.Vector3(),bb=new T3.Box3();let col=null;
    J.meshes[n.mesh].primitives.forEach(pr=>{if(pr.mode!==undefined&&pr.mode!==4)return;const P=acc(pr.attributes.POSITION),I=pr.indices!==undefined?acc(pr.indices):null,cnt=I?I.length:P.length/3,loc=new Int32Array(P.length/3).fill(-1);
      if(!col&&pr.material!==undefined){const m=J.materials[pr.material],f=m&&m.pbrMetallicRoughness&&m.pbrMetallicRoughness.baseColorFactor;if(f)col=hex(f)}
      for(let t=0;t+2<cnt;t+=3){const tri=I?[I[t],I[t+1],I[t+2]]:[t,t+1,t+2];if(flip)tri.reverse();const o=tri.map(k=>{if(loc[k]>=0)return loc[k];v.set(P[k*3],P[k*3+1],P[k*3+2]).applyMatrix4(W).multiplyScalar(100);const key=Math.round(v.x*500)+','+Math.round(v.y*500)+','+Math.round(v.z*500);let q=map.get(key);if(q===undefined){q=pos.length/3;pos.push(v.x,v.y,v.z);map.set(key,q);bb.expandByPoint(v)}return loc[k]=q});if(o[0]!==o[1]&&o[1]!==o[2]&&o[0]!==o[2])idx.push(o[0],o[1],o[2])}});
    if(!idx.length)return;const c=bb.getCenter(new T3.Vector3());for(let k=0;k<pos.length;k+=3){pos[k]-=c.x;pos[k+1]-=c.y;pos[k+2]-=c.z}const s=bb.getSize(new T3.Vector3());
    parts.push({src:String(n.name||('part'+i)).replace(/​/g,''),c,size:[s.x,s.y,s.z],pos:new Float32Array(pos),idx:new Uint32Array(idx),col})});
  if(!parts.length)throw new Error('这个文件里没有找到零件的形状。');
  const all=new T3.Box3();parts.forEach(p=>{const h=new T3.Vector3(...p.size).multiplyScalar(.5);all.expandByPoint(p.c.clone().add(h)).expandByPoint(p.c.clone().sub(h))});const ctr=all.getCenter(new T3.Vector3()),S=all.getSize(new T3.Vector3());
  parts.forEach(p=>{p.c.sub(ctr);p.c=[p.c.x,p.c.y,p.c.z];p.kind=KEY(p.src)});
  const big=Math.max(S.x,S.y,S.z);parts.forEach(p=>{const m=Math.max(...p.size),white=p.col==null||((p.col>>16&255)>225&&(p.col>>8&255)>225&&(p.col&255)>225);p.col=m<big*.22?(white?0xaeb4ba:p.col):(white?0xf4f4f0:p.col)});
  return{parts,size:[S.x,S.y,S.z],gen:(J.asset&&J.asset.generator)||'',copyright:(J.asset&&J.asset.copyright)||''}}
/* the model without steps; M.asm keeps what the editor needs to carry on later */
function base(G,name,from){const I7=[0,0,0,1,1,1,1],r=v=>+v.toFixed(3),M={format:'assembly-model',version:1,unit:'cm',up:'y',product:name||'未命名产品',samples:120,render:{shadow:false,fov:32,near:1,far:2000},scenes:[{bg:0xc3cfcc,nodes:[]}],geoms:[],texs:[],mats:[],steps:[],parts:[],holes:[],warn:[],
    asm:{v:1,from:from||'',copyright:G.copyright||'',size:G.size.map(r),parts:[],kinds:{},steps:[]}},N=M.scenes[0].nodes;
  N.push({p:-1,t:'H',c:0xffffff,c2:0x8a8f8c,i:.95,x:[0,1,0,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.55,x:[60,90,80,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.25,x:[-70,40,-60,...I7]});
  M.asm.root=N.length;N.push({p:-1,t:'G',n:'assembly',x:[0,G.size[1]/2,0,...I7]});const LM=M.mats.length;M.mats.push({k:'LineBasicMaterial',c:0x3a4144});
  G.parts.forEach((p,i)=>{const g=M.geoms.length;M.geoms.push({k:'raw',pos:b64(p.pos),idx:b64(p.idx),i32:1});M.geoms.push({k:'edges',g,a:32});const m=M.mats.length;M.mats.push({k:'MeshStandardMaterial',c:p.col,ro:.75,me:0,fs:1,sd:2});const node=N.length;
    N.push({p:M.asm.root,t:'M',g,m,n:p.src,x:[...p.c.map(r),...I7]});N.push({p:node,t:'L',g:g+1,m:LM,x:[0,0,0,...I7]});
    M.asm.parts.push({node,mat:m,kind:p.kind,src:p.src,c:p.c.map(r),size:p.size.map(r),col:p.col});if(!M.asm.kinds[p.kind])M.asm.kinds[p.kind]={name:p.kind,code:/^\d{5,9}$/.test(p.kind)?p.kind:''}});
  return M}
const kname=(M,k)=>{const K=M.asm.kinds[k]||{};return K.name||k};
function travel(part,d){const e=Math.abs(d[0])*part.size[0]+Math.abs(d[1])*part.size[1]+Math.abs(d[2])*part.size[2];return Math.max(6,Math.min(60,e*1.1+4))}
/* points spread evenly over a part's surface (the same ones every time) */
function samples(T3,geo,c,N){const P=geo.attributes.position,I=geo.index,n=I.count/3,ar=new Float64Array(n),a=new T3.Vector3(),b=new T3.Vector3(),e=new T3.Vector3();let tot=0;for(let k=0;k<n;k++){a.fromBufferAttribute(P,I.getX(k*3));b.fromBufferAttribute(P,I.getX(k*3+1));e.fromBufferAttribute(P,I.getX(k*3+2));tot+=ar[k]=b.sub(a).cross(e.sub(a)).length()/2}
  const O=[];let s=12345,acc=0,k=0;const rnd=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;for(let q=0;q<N;q++){const tg=(q+.5)*tot/N;while(k<n-1&&acc+ar[k]<tg){acc+=ar[k];k++}a.fromBufferAttribute(P,I.getX(k*3));b.fromBufferAttribute(P,I.getX(k*3+1));e.fromBufferAttribute(P,I.getX(k*3+2));let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v}O.push(new T3.Vector3(a.x+(b.x-a.x)*u+(e.x-a.x)*v+c[0],a.y+(b.y-a.y)*u+(e.y-a.y)*v+c[1],a.z+(b.z-a.z)*u+(e.z-a.z)*v+c[2]))}return O}
/* which way a part can come in. For each of the six axis directions, the share of its surface points that would have to pass
   through more than 1 cm of a part already there. Free directions first (small snap-in hardware is allowed a little overlap);
   among them: from above for big parts, and leading away from the rest. rc[i] = a mesh of part i at its place. */
function autoDir(T3,M,rc,i,obst,pose){const PA=M.asm.parts,p=PA[i];if(!obst.length)return{d:[0,0,0],base:1};const inv=Q(T3,pose).invert(),up=new T3.Vector3(0,1,0).applyQuaternion(inv),O=samples(T3,rc[i].geometry,p.c,180);
  const oc=new T3.Vector3();obst.forEach(j=>oc.add(new T3.Vector3(...PA[j].c)));oc.multiplyScalar(1/obst.length);const away=new T3.Vector3(...p.c).sub(oc);if(away.length()>1e-6)away.normalize();
  const small=Math.max(...p.size)<Math.max(...M.asm.size)*.22,tol=small?.05:.005,near=obst.map(j=>rc[j]),ray=new T3.Raycaster(),o2=new T3.Vector3(),all={};let best=null;
  [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(d=>{const D=new T3.Vector3(...d),far=travel(p,d);let deep=0;for(const o of O){ray.set(o2.copy(o).addScaledVector(D,-.05),D);ray.near=0;ray.far=far;const h=ray.intersectObjects(near,false);if(!h.length)continue;let ins=0;const ent=new Map();
      for(const x of h){const f=x.face.normal.dot(D);if(f<-.05){if(!ent.has(x.object))ent.set(x.object,x.distance)}else if(f>.05&&ent.has(x.object)){ins+=x.distance-ent.get(x.object);ent.delete(x.object)}}ent.forEach(v=>ins+=far-v);if(ins>1)deep++}
    const ratio=deep/O.length,u=D.dot(up);all[d.join()]=+ratio.toFixed(3);const sc=(ratio<=tol?100:-ratio*100)+(small?.5:3)*u+1.5*D.dot(away)-(u<-.9?10:0);if(!best||sc>best.sc)best={d,sc,ratio}});
  return{d:best.d,blocked:best.ratio>Math.max(tol,.1)?1:0,ratio:+best.ratio.toFixed(3),small:small?1:0,all}}
/* M.asm.steps -> M.steps (motion, tint, camera). Deterministic: uses the directions kept in each step. */
function steps(M,T3){const A=M.asm,N=M.samples,PA=A.parts,SZ=A.size,r4=v=>+v.toFixed(4),placed=new Set(),out=[];let prev='up';M.warn=[];M.parts=PA.map((p,i)=>({id:'cp'+i,scene:0,node:p.node,name:kname(M,p.kind),...(A.kinds[p.kind]&&A.kinds[p.kind].code?{code:A.kinds[p.kind].code}:{}),src:p.src,size:p.size,steps:[]}));
  const H=q=>{const e=new T3.Matrix4().makeRotationFromQuaternion(q).elements;return Math.abs(e[1])*SZ[0]/2+Math.abs(e[5])*SZ[1]/2+Math.abs(e[9])*SZ[2]/2};
  A.steps.forEach((s,si)=>{const id=String(si+1),pose=s.pose||'up',q1=Q(T3,pose),q0=Q(T3,prev),turn=pose!==prev,mine=(s.parts||[]).filter(i=>PA[i]&&!placed.has(i)),tEnd=turn?(mine.length?44:104):0,h1=H(q1);
    const st={id,title:s.title||'',label:'第 '+id+' 步',say:s.say||'',scene:0,dur:1.6,parts:[],nodes:{},mats:{},cam:[]};
    if(turn){const pk=[],qk=[],a=4;for(let k=0;k<=10;k++){const f=k/10,e=f*f*(3-2*f),q=q0.clone().slerp(q1,e),x=Math.round(a+(tEnd-a)*f);pk.push(x,0,r4(H(q)+Math.sin(Math.PI*f)*2),0);qk.push(x,r4(q.x),r4(q.y),r4(q.z),r4(q.w))}st.nodes[A.root]={p:pk,q:qk}}
    else if(pose!=='up')st.nodes[A.root]={p:[0,0,r4(h1),0],q:[0,r4(q1.x),r4(q1.y),r4(q1.z),r4(q1.w)]};
    PA.forEach((p,i)=>{if(!placed.has(i)&&!mine.includes(i))st.nodes[p.node]={v:[0,0]}});
    const kinds=[];mine.forEach(i=>{if(!kinds.includes(PA[i].kind))kinds.push(PA[i].kind)});const a0=tEnd?tEnd+6:6,L=(110-a0)/Math.max(1,kinds.length),inv=q1.clone().invert(),box=new T3.Box3(),aW=new T3.Vector3(),cnt={};
    const grow=(c,sz)=>{box.expandByPoint(new T3.Vector3(c[0]-sz[0]/2,c[1]-sz[1]/2,c[2]-sz[2]/2));box.expandByPoint(new T3.Vector3(c[0]+sz[0]/2,c[1]+sz[1]/2,c[2]+sz[2]/2))};placed.forEach(i=>grow(PA[i].c,PA[i].size));
    mine.forEach(i=>{const p=PA[i],k=kinds.indexOf(p.kind),a=Math.round(a0+k*L),b=Math.round(a0+(k+1)*L-(kinds.length>1?2:0)),w=s.dir&&s.dir[p.kind];let d=w&&WORLD[w]?new T3.Vector3(...WORLD[w]).applyQuaternion(inv).toArray():((s.auto&&s.auto[i]&&s.auto[i].d)||[0,0,0]);
      grow(p.c,p.size);const key=(A.kinds[p.kind]&&A.kinds[p.kind].code)||kname(M,p.kind);cnt[key]=(cnt[key]||0)+1;M.parts[i].steps.push(id);
      if(!d[0]&&!d[1]&&!d[2]){st.nodes[p.node]=tEnd?{v:[0,0,a,1]}:{v:[0,1]};st.mats[p.mat]={c:[0,GREEN,100,p.col]}}
      else{const t=travel(p,d),from=p.c.map((v,x)=>r4(v+d[x]*t));grow(from,p.size);st.nodes[p.node]={p:[a,...from,b,...p.c.map(r4)],v:a>0?[0,0,a,1]:[0,1]};st.mats[p.mat]={c:[0,GREEN,Math.min(119,b+6),p.col]};aW.add(new T3.Vector3(...d).applyQuaternion(q1));if(!w&&s.auto&&s.auto[i]&&s.auto[i].blocked)M.warn.push('第 '+id+' 步：“'+kname(M,p.kind)+'”没有找到不被挡住的装入方向，请指定方向或把它放到别的步骤。')}
      placed.add(i)});
    st.parts=Object.entries(cnt);if(box.isEmpty())grow([0,0,0],SZ);
    const tg=box.getCenter(new T3.Vector3()).applyQuaternion(q1).add(new T3.Vector3(0,h1,0)),rad=box.getSize(new T3.Vector3()).length()/2;let v,dist=Math.max(45,rad*2.9);
    if(s.cam&&s.cam.v){v=new T3.Vector3(...s.cam.v).normalize();dist=s.cam.dist||dist}else{if(aW.length()>1e-6)aW.normalize();const ah=new T3.Vector3(aW.x,0,aW.z);if(ah.length()>.35){ah.normalize();v=ah.clone().add(new T3.Vector3(0,.55,0)).add(new T3.Vector3(-ah.z,0,ah.x).multiplyScalar(.7))}else v=new T3.Vector3(.5,aW.y<-.5?.12:.6,1);v.normalize()}
    const pos=tg.clone().addScaledVector(v,dist),cq=new T3.Quaternion().setFromRotationMatrix(new T3.Matrix4().lookAt(pos,tg,new T3.Vector3(0,1,0)));st.cam=[0,r4(pos.x),r4(pos.y),r4(pos.z),r4(cq.x),r4(cq.y),r4(cq.z),r4(cq.w),r4(dist)];
    if(!mine.length&&!turn&&!(s.say||'').trim())M.warn.push('第 '+id+' 步既没有零件，也没有说明。');out.push(st);prev=pose});
  const left=PA.map((p,i)=>i).filter(i=>!placed.has(i));if(left.length){const c={};left.forEach(i=>{const n=kname(M,PA[i].kind);c[n]=(c[n]||0)+1});M.warn.unshift('还有 '+left.length+' 个零件没有排进任何一步：'+Object.entries(c).map(([n,v])=>n+(v>1?' ×'+v:'')).join('、')+'。')}
  M.steps=out;return M}
const autoTitle=(M,s)=>{const PA=M.asm.parts,c=[];(s.parts||[]).forEach(i=>{const n=kname(M,PA[i].kind);if(!c.includes(n))c.push(n)});return c.length?'装'+c.slice(0,3).join('、')+(c.length>3?'等':''):(s.pose&&s.pose!=='up'?'':'')};
root.MAsm={KEY,parseGLB,base,steps,autoDir,travel,Q,POSES,WORLD,DIRNAME,kname,autoTitle,GREEN};if(typeof module!=='undefined')module.exports=root.MAsm;
})(typeof window!=='undefined'?window:globalThis);
