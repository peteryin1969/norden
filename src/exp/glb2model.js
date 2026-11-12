/* glb2model.js — experiment: an assembled-state GLB (one node per part) + steps read from the manual -> assembly-model v1.
   Positions come from the file as they are; only the order and the way in are written here. */
const fs=require('fs'),T=require(process.argv[2]+'/build/three.js');
const buf=fs.readFileSync(process.argv[3]),jl=buf.readUInt32LE(12),J=JSON.parse(buf.slice(20,20+jl).toString('utf8')),BIN=buf.slice(20+jl+8);
const acc=i=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],C={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array}[a.componentType],off=(v.byteOffset||0)+(a.byteOffset||0),st=v.byteStride||n*C.BYTES_PER_ELEMENT,out=new C(a.count*n),dv=new DataView(BIN.buffer,BIN.byteOffset+off);
  for(let k=0;k<a.count;k++)for(let c=0;c<n;c++){const p=k*st+c*C.BYTES_PER_ELEMENT;out[k*n+c]=C===Float32Array?dv.getFloat32(p,true):C===Uint16Array?dv.getUint16(p,true):C===Uint32Array?dv.getUint32(p,true):dv.getUint8(p)}return out};
const world=[];const walk=(i,pm)=>{const n=J.nodes[i],m=new T.Matrix4();if(n.matrix)m.fromArray(n.matrix);else m.compose(new T.Vector3(...(n.translation||[0,0,0])),new T.Quaternion(...(n.rotation||[0,0,0,1])),new T.Vector3(...(n.scale||[1,1,1])));const w=pm.clone().multiply(m);world[i]=w;(n.children||[]).forEach(c=>walk(c,w))};J.scenes[J.scene||0].nodes.forEach(r=>walk(r,new T.Matrix4()));
const b64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
/* each part: vertices in world centimetres about the part's own box centre, welded, no normals (drawn flat-shaded) */
const parts=[];J.nodes.forEach((n,i)=>{if(n.mesh===undefined)return;const W=world[i],flip=W.determinant()<0,map=new Map(),pos=[],idx=[],v=new T.Vector3(),bb=new T.Box3();
  J.meshes[n.mesh].primitives.forEach(pr=>{const P=acc(pr.attributes.POSITION),I=pr.indices!==undefined?acc(pr.indices):Uint32Array.from({length:P.length/3},(_, k)=>k),loc=new Int32Array(P.length/3).fill(-1);
    for(let t=0;t<I.length;t+=3){const tri=[I[t],I[t+1],I[t+2]];if(flip)tri.reverse();const o=tri.map(k=>{if(loc[k]>=0)return loc[k];v.set(P[k*3],P[k*3+1],P[k*3+2]).applyMatrix4(W).multiplyScalar(100);const key=Math.round(v.x*500)+','+Math.round(v.y*500)+','+Math.round(v.z*500);let q=map.get(key);if(q===undefined){q=pos.length/3;pos.push(v.x,v.y,v.z);map.set(key,q);bb.expandByPoint(v)}return loc[k]=q});if(o[0]!==o[1]&&o[1]!==o[2]&&o[0]!==o[2])idx.push(...o)}});
  const c=bb.getCenter(new T.Vector3());for(let k=0;k<pos.length;k+=3){pos[k]-=c.x;pos[k+1]-=c.y;pos[k+2]-=c.z}
  parts.push({src:n.name.replace(/​/g,''),c,size:bb.getSize(new T.Vector3()),pos:new Float32Array(pos),idx:new Uint32Array(idx)})});
const all=new T.Box3();parts.forEach(p=>all.expandByPoint(p.c.clone().addScaledVector(p.size,.5)).expandByPoint(p.c.clone().addScaledVector(p.size,-.5)));const ctr=all.getCenter(new T.Vector3()),SZ=all.getSize(new T.Vector3());parts.forEach(p=>p.c.sub(ctr));
/* what each part is. The words are descriptions written for this experiment, not the maker's names. */
const KIND=[[/^top panel/,'top','顶板（板边标 1）',null,0xf4f4f0],[/^bottom panel/,'bottom','底板',null,0xf4f4f0],[/^side panel/,'side','侧板',null,0xf4f4f0],[/^back panel/,'back','背板',null,0xd8c7a3],[/^139434/,'139434','背板卡件 139434','139434',0xb9bdc2],[/^139435/,'139435','卡件锁销 139435','139435',0x8f959c],[/^141413/,'141413','挂墙件 141413','141413',0xb9bdc2],[/^141414/,'141414','调节旋钮 141414','141414',0x8f959c],[/^152651/,'152651','墙面固定座 152651','152651',0xb9bdc2],[/^152650/,'152650','盖帽 152650','152650',0xf4f4f0]];
parts.forEach(p=>{const k=KIND.find(k=>k[0].test(p.src));if(!k)throw new Error('unknown part '+p.src);p.kind=k[1];p.name=k[2];p.code=k[3];p.col=k[4]});
const M={format:'assembly-model',version:1,unit:'cm',up:'y',product:'EKET 35×25×35（试验：官方三维文件 + 说明书）',samples:120,render:{shadow:false,fov:32,near:1,far:900},scenes:[{bg:0xc3cfcc,nodes:[]}],geoms:[],texs:[],mats:[],steps:[],parts:[],holes:[],warn:[],
  source:{file:'IKEA 3D Assembly Dataset · EKET_70332124_35x25x35.glb',manual:'AA-1914763-5',licence:'CC BY-NC-SA 4.0 · © Inter IKEA Systems B.V. 2021 · 仅用于测试',note:'零件位置取自三维文件；步骤顺序和装入方向是对照说明书排的，尚未经人确认。'}};
const N=M.scenes[0].nodes,I7=[0,0,0,1,1,1,1];
N.push({p:-1,t:'H',c:0xffffff,c2:0x8a8f8c,i:.95,x:[0,1,0,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.55,x:[60,90,80,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.25,x:[-70,40,-60,...I7]});
const ROOT=N.length;N.push({p:-1,t:'G',n:'cabinet',x:[0,SZ.y/2,0,...I7]});
const LM=M.mats.length;M.mats.push({k:'LineBasicMaterial',c:0x3a4144});
parts.forEach((p,i)=>{const g=M.geoms.length;M.geoms.push({k:'raw',pos:b64(p.pos),idx:b64(p.idx),i32:1});M.geoms.push({k:'edges',g,a:32});const m=M.mats.length;M.mats.push({k:'MeshStandardMaterial',c:p.col,ro:.75,me:p.code&&p.col!==0xf4f4f0?.35:0,fs:1,sd:2});
  p.node=N.length;p.mat=m;N.push({p:ROOT,t:'M',g,m,n:p.src,x:[p.c.x,p.c.y,p.c.z,...I7],...(p.code?{code:p.code}:{})});N.push({p:p.node,t:'L',g:g+1,m:LM,x:[0,0,0,...I7]});
  M.parts.push({id:'cp'+i,scene:0,node:p.node,name:p.name,...(p.code?{code:p.code}:{}),src:p.src,size:[p.size.x,p.size.y,p.size.z].map(v=>+v.toFixed(2)),steps:[]})});
/* the cabinet's own axes in this file: x front(+)/back(−), y up, z left/right. Steps 1–4 are built lying on the front edges. */
const LIE=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-Math.PI/2),UP=new T.Quaternion(),lieY=SZ.x/2,upY=SZ.y/2;
const sideL=parts.filter(p=>p.kind==='side').sort((a,b)=>a.c.z-b.c.z);
const pick=k=>parts.filter(p=>p.kind===k);
const STEPS=[
 {t:'把顶板和一块侧板扣在一起',say:'先找出板边标着 1 的那块板（顶板），把一块侧板对准它的边，按进去再往下推到位。',lie:1,base:pick('top'),mv:[[sideL[0],[-14,0,-9],[-14,0,0]]],view:[.9,.75,1.1]},
 {t:'装上另一块侧板',say:'另一块侧板用同样的办法扣到顶板的另一边。',lie:1,mv:[[sideL[1],[-14,0,9],[-14,0,0]]],view:[.9,.75,1.1]},
 {t:'把背板推进槽里',say:'背板沿三块板上的槽平着推进去，一直推到顶板。注意背板的方向，贴警示标签的一面朝外。',lie:1,mv:pick('back').map(p=>[p,[0,-42,0]])  ,view:[.2,.9,1.3]},
 {t:'扣上底板',say:'最后一块板（底板）从上往下扣到两块侧板上，把背板夹住。',lie:1,mv:pick('bottom').map(p=>[p,[-14,-9,0],[-14,0,0]]),view:[.9,.75,1.1]},
 {t:'把柜子立起来',say:'把柜子翻过来立好，标着 1 的那条边在上面。检查背板是否完全进槽。',turn:1,view:[1,.55,1.15]},
 {t:'在背板四边装上 4 组卡件',say:'在背面四条边的中间各装一组：先按入 139434，再把 139435 推进去锁住。',mv:pick('139434').map(p=>[p,[-16,0,0],null,[0,55]]).concat(pick('139435').map(p=>[p,[-20,0,0],null,[50,110]])),view:[-1,.5,.9]},
 {t:'装上 2 个挂墙件（要挂墙时）',say:'在背面上方两个角各装一个 141413。',mv:pick('141413').map(p=>[p,[-16,0,0]]),view:[-1,.6,.8]},
 {t:'在墙上打孔（要挂墙时）',say:'说明书此处要求用 8 毫米钻头在墙上打孔。墙面螺丝和膨胀管不随产品提供，要按你家墙体的材料另配。',view:[-1,.6,.8]},
 {t:'装上 2 个调节旋钮',say:'把 141414 拧到两个 141413 上。',mv:pick('141414').map(p=>[p,[-14,0,0]]),view:[-1,.6,.8]},
 {t:'挂到墙上并调平',say:'把柜子挂上墙，转动旋钮调节，让柜子贴墙、放平。',view:[1,.4,1.2]},
 {t:'从柜内固定到墙上并盖上盖帽',say:'在柜内上方两处各放一个 152651，用螺丝穿过它拧进墙里，再盖上 152650。螺丝不在这份三维文件里，画面中没有画。',mv:pick('152651').map(p=>[p,[18,0,0],null,[0,55]]).concat(pick('152650').map(p=>[p,[22,0,0],null,[55,112]])),view:[1,.25,.35]}];
const placed=new Set(),r4=v=>+v.toFixed(4);
STEPS.forEach((s,si)=>{const id=String(si+1),st={id,title:s.t,label:'第 '+id+' 步',say:s.say,scene:0,dur:1.6,parts:[],nodes:{},mats:{},cam:[]};
  (s.base||[]).forEach(p=>placed.add(p));const now=(s.mv||[]).map(m=>m[0]);
  const q0=s.lie?LIE:s.turn?LIE:UP,y0=s.lie||s.turn?lieY:upY;
  if(s.lie)st.nodes[ROOT]={p:[0,0,y0,0],q:[0,LIE.x,LIE.y,LIE.z,LIE.w]};
  if(s.turn){const pk=[],qk=[];for(let k=0;k<=12;k++){const f=k/12,u=Math.min(1,Math.max(0,(f-.1)/.75)),e=u*u*(3-2*u),q=LIE.clone().slerp(UP,e),a=e*Math.PI/2,h=Math.abs(Math.sin(Math.PI/2-a))*SZ.x/2+Math.abs(Math.cos(Math.PI/2-a))*SZ.y/2;pk.push(k*10,0,r4(h),0);qk.push(k*10,r4(q.x),r4(q.y),r4(q.z),r4(q.w))}st.nodes[ROOT]={p:pk,q:qk}}
  parts.forEach(p=>{if(!placed.has(p)&&!now.includes(p)){st.nodes[p.node]={v:[0,0]}}});
  const cnt={};(s.mv||[]).forEach(([p,from,via,win])=>{const a=win?win[0]:8,b=win?win[1]:104,c=[p.c.x,p.c.y,p.c.z],P0=c.map((v,k)=>r4(v+from[k])),keys=[a,...P0];if(via){const m=Math.round(a+(b-a)*.55);keys.push(m,...c.map((v,k)=>r4(v+via[k])))}keys.push(b,...c.map(r4));st.nodes[p.node]={p:keys,v:a>0?[0,0,a,1]:[0,1]};
    st.mats[p.mat]={c:[0,0x7fd3ab,Math.min(119,b+8),p.col]};M.parts.find(x=>x.node===p.node).steps.push(id);const k=p.code||p.name;cnt[k]=(cnt[k]||0)+1;placed.add(p)});
  (s.base||[]).forEach(p=>{const k=p.code||p.name;cnt[k]=(cnt[k]||0)+1});st.parts=Object.entries(cnt);
  /* camera: looks at the cabinet's middle from the direction given, far enough to hold the parts on their way in */
  const tg=new T.Vector3(0,s.lie?lieY:upY,0),d=new T.Vector3(...s.view).normalize(),dist=s.view[2]<.5?100:s.lie||s.turn?135:118,o=new T.Object3D();o.position.copy(tg).addScaledVector(d,dist);o.up.set(0,1,0);o.lookAt(tg);const cq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(o.position,tg,o.up));
  st.cam=[0,r4(o.position.x),r4(o.position.y),r4(o.position.z),r4(cq.x),r4(cq.y),r4(cq.z),r4(cq.w),dist];M.steps.push(st)});
const left=parts.filter(p=>!placed.has(p));if(left.length)M.warn.push('没有排进任何一步的零件：'+left.map(p=>p.src).join('、'));
fs.writeFileSync(process.argv[4],JSON.stringify(M));console.log('parts',parts.length,'verts',parts.reduce((a,p)=>a+p.pos.length/3,0),'tris',parts.reduce((a,p)=>a+p.idx.length/3,0),'size cm',[SZ.x,SZ.y,SZ.z].map(v=>v.toFixed(1)).join('×'),'MB',(fs.statSync(process.argv[4]).size/1e6).toFixed(2),'warn',M.warn);
console.log(parts.map(p=>p.kind+':'+[p.size.x,p.size.y,p.size.z].map(v=>v.toFixed(1)).join('x')+'@'+[p.c.x,p.c.y,p.c.z].map(v=>v.toFixed(1)).join(',')).join('\n'));
