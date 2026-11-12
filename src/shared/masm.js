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
/* share of the points O that, going the way D for the length far, pass through more than 1 cm of the meshes in near */
function ratioAlong(T3,O,near,D,far,off){const ray=new T3.Raycaster(),o2=new T3.Vector3();let deep=0;for(const o of O){o2.copy(o).addScaledVector(D,-.05);if(off)o2.add(off);ray.set(o2,D);ray.near=0;ray.far=far;const h=ray.intersectObjects(near,false);if(!h.length)continue;let ins=0;const ent=new Map();
    for(const x of h){const f=x.face.normal.dot(D);if(f<-.05){if(!ent.has(x.object))ent.set(x.object,x.distance)}else if(f>.05&&ent.has(x.object)){ins+=x.distance-ent.get(x.object);ent.delete(x.object)}}ent.forEach(v=>ins+=far-v);if(ins>1)deep++}return deep/O.length}
/* the axis a part is round about (a screw, a dowel, a knob, a washer), from the spread of its surface points; null if it has none */
function axisOf(T3,geo){if(geo.userData&&geo.userData.axis!==undefined)return geo.userData.axis;const O=samples(T3,geo,[0,0,0],400),m=new T3.Vector3();O.forEach(o=>m.add(o));m.multiplyScalar(1/O.length);const C=[[0,0,0],[0,0,0],[0,0,0]];O.forEach(o=>{const d=[o.x-m.x,o.y-m.y,o.z-m.z];for(let a=0;a<3;a++)for(let b=0;b<3;b++)C[a][b]+=d[a]*d[b]/O.length});
  const V=[[1,0,0],[0,1,0],[0,0,1]];for(let it=0;it<40;it++){let p=0,q=1,mx=Math.abs(C[0][1]);if(Math.abs(C[0][2])>mx){mx=Math.abs(C[0][2]);p=0;q=2}if(Math.abs(C[1][2])>mx){mx=Math.abs(C[1][2]);p=1;q=2}if(mx<1e-10)break;const th=.5*Math.atan2(2*C[p][q],C[q][q]-C[p][p]),c=Math.cos(th),s=Math.sin(th);
    for(let k=0;k<3;k++){const a=C[k][p],b=C[k][q];C[k][p]=c*a-s*b;C[k][q]=s*a+c*b}for(let k=0;k<3;k++){const a=C[p][k],b=C[q][k];C[p][k]=c*a-s*b;C[q][k]=s*a+c*b}for(let k=0;k<3;k++){const a=V[k][p],b=V[k][q];V[k][p]=c*a-s*b;V[k][q]=s*a+c*b}}
  const e=[0,1,2].map(i=>({v:Math.sqrt(Math.max(0,C[i][i])),x:[V[0][i],V[1][i],V[2][i]]})).sort((a,b)=>a.v-b.v),near=(a,b)=>Math.abs(a-b)<=.12*Math.max(a,b);let ax=null;
  if(near(e[1].v,e[2].v)&&!near(e[0].v,e[1].v))ax=e[0].x;else if(near(e[0].v,e[1].v)&&!near(e[1].v,e[2].v))ax=e[2].x;
  if(ax){const big=Math.max(...ax.map(Math.abs));if(big>.985)ax=ax.map(v=>Math.abs(v)===big?Math.sign(v):0);else{const l=Math.hypot(...ax);ax=ax.map(v=>+(v/l).toFixed(5))}}(geo.userData=geo.userData||{}).axis=ax;return ax}
const isSmall=(M,p)=>Math.max(...p.size)<Math.max(...M.asm.size)*.22;
function push(part,d){const e=Math.abs(d[0])*part.size[0]+Math.abs(d[1])*part.size[1]+Math.abs(d[2])*part.size[2];return Math.max(3,Math.min(10,e*.25))}
/* which way a part can come in. For each of the six axis directions, the share of its surface points that would have to pass
   through more than 1 cm of a part already there. Free directions first (small snap-in hardware is allowed a little overlap);
   among them: from above for big parts, and leading away from the rest. rc[i] = a mesh of part i at its place. */
function autoDir(T3,M,rc,i,obst,pose){const PA=M.asm.parts,p=PA[i];if(!obst.length)return{d:[0,0,0],base:1};const inv=Q(T3,pose).invert(),up=new T3.Vector3(0,1,0).applyQuaternion(inv),O=samples(T3,rc[i].geometry,p.c,180);
  const oc=new T3.Vector3();obst.forEach(j=>oc.add(new T3.Vector3(...PA[j].c)));oc.multiplyScalar(1/obst.length);const away=new T3.Vector3(...p.c).sub(oc);if(away.length()>1e-6)away.normalize();
  const small=isSmall(M,p),tol=small?.05:.005,near=obst.map(j=>rc[j]),all={},ax=small?axisOf(T3,rc[i].geometry):null,tool=M.asm.tool||20,dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];let best=null;
  if(ax&&Math.max(...ax.map(Math.abs))<.99)dirs.push(ax,ax.map(v=>-v));/* a fastener that sits at an angle goes in along its own axis */
  dirs.forEach(d=>{const D=new T3.Vector3(...d),ratio=ratioAlong(T3,O,near,D,travel(p,d)),u=D.dot(up),along=ax&&Math.abs(D.dot(new T3.Vector3(...ax)))>.97,reach=small&&ratio<=tol?ratioAlong(T3,O,near,D,tool):0;all[d.join()]=+ratio.toFixed(3);
    const sc=(ratio<=tol?100:-ratio*100)+(small?.5:3)*u+1.5*D.dot(away)-(u<-.9?10:0)+(along?2.5:0)-(reach>.2?1:0);/* little room outside only tips the balance between otherwise equal ways; it is reported, not forbidden */if(!best||sc>best.sc)best={d,sc,ratio,reach,along}});
  return{d:best.d,blocked:best.ratio>Math.max(tol,.1)?1:0,ratio:+best.ratio.toFixed(3),small:small?1:0,all,...(best.along?{axis:1}:{}),...(best.reach>.2?{tight:+best.reach.toFixed(2)}:{})}}
/* a way in chosen by a person (one stretch, or two: first from A, then from B into place): does it pass through anything? */
function pathCheck(T3,M,rc,i,obst,A,B){const p=M.asm.parts[i];if(!obst.length)return{ratio:0};const O=samples(T3,rc[i].geometry,p.c,180),near=obst.map(j=>rc[j]),z=v=>!v||(!v[0]&&!v[1]&&!v[2]);let r=0;
  if(B&&!z(B)){const tb=push(p,B),vb=new T3.Vector3(...B);r=ratioAlong(T3,O,near,vb,tb);if(!z(A))r=Math.max(r,ratioAlong(T3,O,near,new T3.Vector3(...A),travel(p,A),vb.clone().multiplyScalar(tb)))}else if(!z(A))r=ratioAlong(T3,O,near,new T3.Vector3(...A),travel(p,A));
  const last=B&&!z(B)?B:A,reach=isSmall(M,p)&&!z(last)?ratioAlong(T3,O,near,new T3.Vector3(...last),M.asm.tool||20):0;return{ratio:+r.toFixed(3),blocked:r>(isSmall(M,p)?.1:.03)?1:0,...(reach>.2?{tight:+reach.toFixed(2)}:{})}}
/* one sentence about how the parts of a step go in -> {kinds:[key…], a, b, spin, say}. Rules only, no AI. */
const SAYDIR=[['U',/从上|往下|向下|朝下|下推|下压|放下|按下|落下/],['D',/从下|往上|向上|朝上|上推|托上|抬上/],['L',/从左|往右|向右|朝右/],['R',/从右|往左|向左|朝左/],['F',/从前|往后|向后|朝后|往里|向里|朝里/],['B',/从后|往前|向前|朝前|往外|向外/],['auto',/按进|靠上|贴上|对准|扣上|插进|放进|装上|卡进|推进|靠近|对上/]];
function parseSay(text,kinds){const x=String(text||'').replace(/\s+/g,'');if(!x)return null;const hit=kinds.filter(k=>k.name&&x.includes(k.name)),tg=(hit.length?hit:kinds),mv=[];x.split(/[，,。；;、]|然后|接着|之后|再/).forEach(c=>{if(!c)return;const m=SAYDIR.find(d=>d[1].test(c));if(m)mv.push(m[0])});
  const spin=/拧|旋|转紧|转动|转进/.test(x),noSpin=/不用拧|不拧|不要转|不转/.test(x);if(!mv.length&&!spin&&!noSpin)return null;const o={kinds:tg.map(k=>k.key)};if(mv.length===1)o.a=mv[0];else if(mv.length>1){o.a=mv[0];o.b=mv[mv.length-1];if(o.b==='auto'){o.b=undefined}}if(spin&&!noSpin)o.spin=true;if(noSpin)o.spin=false;
  const w=d=>d==='auto'?'按程序找到的方向靠上':DIRNAME[d];o.say='好：'+tg.map(k=>'“'+k.name+'”').join('、')+(o.a?(o.b?'先'+w(o.a)+'，再'+DIRNAME[o.b]+'推到位':w(o.a)+(o.a==='auto'?'':'装入')):'')+(o.spin?(o.a?'，':'')+'边进边拧':o.spin===false?(o.a?'，':'')+'不拧':'')+'。';return o}
/* M.asm.steps -> M.steps (motion, tint, camera). Deterministic: uses the directions kept in each step. */
function steps(M,T3){const A=M.asm,A_=A,N=M.samples,PA=A.parts,SZ=A.size,r4=v=>+v.toFixed(4),placed=new Set(),out=[];let prev=(A.steps[0]&&A.steps[0].pose)||'up';/* the first step simply starts the way it lies */M.warn=[];M.parts=PA.map((p,i)=>({id:'cp'+i,scene:0,node:p.node,name:kname(M,p.kind),...(A.kinds[p.kind]&&A.kinds[p.kind].code?{code:A.kinds[p.kind].code}:{}),src:p.src,size:p.size,steps:[]}));
  const H=q=>{const e=new T3.Matrix4().makeRotationFromQuaternion(q).elements;return Math.abs(e[1])*SZ[0]/2+Math.abs(e[5])*SZ[1]/2+Math.abs(e[9])*SZ[2]/2};
  A.steps.forEach((s,si)=>{const id=String(si+1),pose=s.pose||'up',q1=Q(T3,pose),q0=Q(T3,prev),turn=pose!==prev,mine=(s.parts||[]).filter(i=>PA[i]&&!placed.has(i)),tEnd=turn?(mine.length?44:104):0,h1=H(q1);
    const st={id,title:s.title||'',label:'第 '+id+' 步',say:s.say||'',scene:0,dur:1.6,parts:[],nodes:{},mats:{},cam:[]};
    if(turn){const pk=[],qk=[],a=4;for(let k=0;k<=10;k++){const f=k/10,e=f*f*(3-2*f),q=q0.clone().slerp(q1,e),x=Math.round(a+(tEnd-a)*f);pk.push(x,0,r4(H(q)+Math.sin(Math.PI*f)*2),0);qk.push(x,r4(q.x),r4(q.y),r4(q.z),r4(q.w))}st.nodes[A.root]={p:pk,q:qk}}
    else if(pose!=='up')st.nodes[A.root]={p:[0,0,r4(h1),0],q:[0,r4(q1.x),r4(q1.y),r4(q1.z),r4(q1.w)]};
    PA.forEach((p,i)=>{if(!placed.has(i)&&!mine.includes(i))st.nodes[p.node]={v:[0,0]}});
    const kinds=[];mine.forEach(i=>{if(!kinds.includes(PA[i].kind))kinds.push(PA[i].kind)});const a0=tEnd?tEnd+6:6,L=(110-a0)/Math.max(1,kinds.length),inv=q1.clone().invert(),box=new T3.Box3(),aW=new T3.Vector3(),cnt={};
    const grow=(c,sz)=>{box.expandByPoint(new T3.Vector3(c[0]-sz[0]/2,c[1]-sz[1]/2,c[2]-sz[2]/2));box.expandByPoint(new T3.Vector3(c[0]+sz[0]/2,c[1]+sz[1]/2,c[2]+sz[2]/2))};placed.forEach(i=>grow(PA[i].c,PA[i].size));
    const loc=w=>new T3.Vector3(...WORLD[w]).applyQuaternion(inv).toArray().map(v=>Math.abs(v)<1e-9?0:+v.toFixed(6)),zero=v=>!v[0]&&!v[1]&&!v[2];
    mine.forEach(i=>{const p=PA[i],k=kinds.indexOf(p.kind),a=Math.round(a0+k*L),b=Math.round(a0+(k+1)*L-(kinds.length>1?2:0)),mv=(s.move&&s.move[p.kind])||(s.dir&&s.dir[p.kind]?{a:s.dir[p.kind]}:{}),au=(s.auto&&s.auto[i]&&s.auto[i].d)||[0,0,0],byHand=!!((mv.a&&WORLD[mv.a])||(mv.b&&WORLD[mv.b]));
      let A=mv.a&&WORLD[mv.a]?loc(mv.a):au,B=mv.b&&WORLD[mv.b]?loc(mv.b):null;if(B&&zero(A)){A=B;B=null}if(B&&A.join()===B.join())B=null;
      grow(p.c,p.size);const key=(A_.kinds[p.kind]&&A_.kinds[p.kind].code)||kname(M,p.kind);cnt[key]=(cnt[key]||0)+1;M.parts[i].steps.push(id);
      if(zero(A)){st.nodes[p.node]=tEnd?{v:[0,0,a,1]}:{v:[0,1]};st.mats[p.mat]={c:[0,GREEN,100,p.col]}}
      else{const ta=travel(p,A),tb=B?push(p,B):0,mid=B?p.c.map((v,x)=>r4(v+B[x]*tb)):null,from=(mid||p.c).map((v,x)=>r4(v+A[x]*ta)),m=B?Math.round(a+(b-a)*.62):a,keys=[a,...from];if(B)keys.push(m,...mid);keys.push(b,...p.c.map(r4));grow(from,p.size);
        const nd={p:keys,v:a>0?[0,0,a,1]:[0,1]};if(mv.spin){const ax=new T3.Vector3(...(B||A)).normalize(),qk=[],n=12,q=new T3.Quaternion();for(let j=0;j<=n;j++){q.setFromAxisAngle(ax,-(1-j/n)*Math.PI*4);qk.push(r4(m+(b-m)*j/n),r4(q.x),r4(q.y),r4(q.z),r4(q.w))}nd.q=qk}
        st.nodes[p.node]=nd;st.mats[p.mat]={c:[0,GREEN,Math.min(119,b+6),p.col]};aW.add(new T3.Vector3(...A).applyQuaternion(q1));
        const tight=byHand?(s.man&&s.man[i]&&s.man[i].tight):(s.auto&&s.auto[i]&&s.auto[i].tight);if(tight){const w='第 '+id+' 步：“'+kname(M,p.kind)+'”装入方向外侧 '+(A_.tool||20)+' 厘米内有别的零件，手或工具可能伸不进去。请确认，或换个方向、调整步骤顺序。';if(!M.warn.includes(w))M.warn.push(w)}
        if(byHand){if(s.man&&s.man[i]&&s.man[i].blocked)M.warn.push('第 '+id+' 步：按你指定的装法，“'+kname(M,p.kind)+'”在路上会穿过别的零件，请换个方向或分两段。')}
        else if(s.auto&&s.auto[i]&&s.auto[i].blocked)M.warn.push('第 '+id+' 步：“'+kname(M,p.kind)+'”没有找到不被挡住的装入方向，请指定方向或把它放到别的步骤。')}
      placed.add(i)});
    st.parts=Object.entries(cnt);if(box.isEmpty())grow([0,0,0],SZ);
    const tg=box.getCenter(new T3.Vector3()).applyQuaternion(q1).add(new T3.Vector3(0,h1,0)),rad=box.getSize(new T3.Vector3()).length()/2;let v,dist=Math.max(45,rad*2.9);
    if(s.cam&&s.cam.v){v=new T3.Vector3(...s.cam.v).normalize();dist=s.cam.dist||dist}else{if(aW.length()>1e-6)aW.normalize();const ah=new T3.Vector3(aW.x,0,aW.z);if(ah.length()>.35){ah.normalize();v=ah.clone().add(new T3.Vector3(0,.55,0)).add(new T3.Vector3(-ah.z,0,ah.x).multiplyScalar(.7))}else v=new T3.Vector3(.5,aW.y<-.5?.12:.6,1);v.normalize()}
    const pos=tg.clone().addScaledVector(v,dist),cq=new T3.Quaternion().setFromRotationMatrix(new T3.Matrix4().lookAt(pos,tg,new T3.Vector3(0,1,0)));st.cam=[0,r4(pos.x),r4(pos.y),r4(pos.z),r4(cq.x),r4(cq.y),r4(cq.z),r4(cq.w),r4(dist)];
    if(!mine.length&&!turn&&!(s.say||'').trim())M.warn.push('第 '+id+' 步既没有零件，也没有说明。');out.push(st);prev=pose});
  const un=A.steps.map((s,i)=>s.by==='ai'&&!s.ok?i+1:0).filter(Boolean);if(un.length)M.warn.push('有 '+un.length+' 步是 AI 排的，还没有人确认：第 '+un.join('、')+' 步。请逐步对照说明书核对后点“确认这一步”。');
  const left=PA.map((p,i)=>i).filter(i=>!placed.has(i));if(left.length){const c={};left.forEach(i=>{const n=kname(M,PA[i].kind);c[n]=(c[n]||0)+1});M.warn.unshift('还有 '+left.length+' 个零件没有排进任何一步：'+Object.entries(c).map(([n,v])=>n+(v>1?' ×'+v:'')).join('、')+'。')}
  M.steps=out;return M}
/* what is sent to the AI: every part with its number, kind, size and place; the manual goes along as a PDF when there is one */
function aiPrompt(M,hasManual){const A=M.asm,f=v=>(+v).toFixed(1),L=A.parts.map((p,i)=>'#'+i+'　种类 '+p.kind+(A.kinds[p.kind]&&A.kinds[p.kind].name!==p.kind?'（'+A.kinds[p.kind].name+'）':'')+'　尺寸 '+p.size.map(f).join('×')+'　中心 ('+p.c.map(f).join(', ')+')').join('\n');
  return'你在帮一家厂商把一件产品的装配步骤排出来。零件的位置已经有了（取自装好状态的三维文件），你只需要决定：哪些零件在第几步装、这一步产品怎么摆、标题和讲解。\n\n'+
  '产品：'+(M.product||'')+'。整体尺寸 '+A.size.map(f).join('×')+' 厘米。坐标单位厘米，y 向上，原点在产品中心。\n全部零件（编号、种类、长宽高、中心位置）：\n'+L+'\n\n'+
  (hasManual?'附上的 PDF 是这件产品的安装说明书。请严格按说明书的步骤顺序来排，一步对应说明书的一步。\n':'这次没有说明书。请按常理排一个合理的顺序（先大件后小件、先里后外），并在 notes 里说明这是没有说明书时的推测。\n')+
  '规则：\n1. 每个零件编号最多出现一次。说明书里没有出现、你拿不准的零件不要硬排，写进 notes。\n2. title 不超过 14 个字。say 只写说明书图上表达出来的内容；不要编造尺寸、力度、工具型号和安全要求；说明书图上有的警告可以如实转述。\n'+
  '3. pose 表示这一步产品怎么摆（相对三维文件原样）：up 原样；front 让 +x 那一面朝下；back 让 −x 那一面朝下；left 让 −z 那一面朝下；right 让 +z 那一面朝下；over 上下颠倒。拿不准就用 up。\n'+
  '4. move 可以不写。只在说明书明确画出时才写：某种零件 {"b":"U"} 表示先靠上、再从上往下推到位；{"spin":true} 表示拧进去。键是零件的种类。\n5. page 是这一步在说明书里的页码，没有说明书就不写。\n6. kinds 里可以给零件种类起一个描述性的中文名（不是厂家的正式名称），键是种类。\n\n'+
  '只输出一个 JSON，不要别的文字：{"steps":[{"title":"","say":"","pose":"up","parts":[0,1],"move":{},"page":1}],"kinds":{},"notes":[]}'}
/* the AI's answer is taken as a proposal only: checked against the real parts, nothing is trusted that the file does not have */
function aiApply(M,o){const A=M.asm,n=A.parts.length,used=new Set(),notes=[],steps=[];if(!o||!Array.isArray(o.steps))throw new Error('AI 的回答里没有步骤。');let prev='up',dup=0,bad=0;
  o.steps.forEach(s=>{if(!s||typeof s!=='object')return;const parts=[];(Array.isArray(s.parts)?s.parts:[]).forEach(v=>{const i=typeof v==='string'?parseInt(v.replace('#',''),10):v;if(!Number.isInteger(i)||i<0||i>=n){bad++;return}if(used.has(i)){dup++;return}used.add(i);parts.push(i)});
    const pose=POSES[s.pose]?s.pose:prev,move={};if(s.move&&typeof s.move==='object')Object.entries(s.move).forEach(([k,m])=>{if(!m||typeof m!=='object'||!parts.some(i=>A.parts[i].kind===k))return;const r={};if(m.a==='U'||m.a==='D')r.a=m.a;if(m.b==='U'||m.b==='D')r.b=m.b;if(m.spin===true)r.spin=true;if(Object.keys(r).length)move[k]=r});
    const title=String(s.title||'').trim().slice(0,30),say=String(s.say||'').trim().slice(0,500);if(!parts.length&&!say&&pose===prev)return;const st={title,tAuto:!title,say,parts,pose,move,auto:{},by:'ai',ok:false};if(Number.isInteger(s.page)&&s.page>0)st.page=s.page;steps.push(st);prev=pose});
  if(!steps.length)throw new Error('AI 的回答里没有可用的步骤。');if(dup)notes.push('AI 把 '+dup+' 个零件排了不止一次，只保留了第一次。');if(bad)notes.push('AI 提到了 '+bad+' 个不存在的零件编号，已经忽略。');
  const left=n-used.size;if(left)notes.push('AI 没有排进去的零件有 '+left+' 个，采用后会在“检查”里列出来。');const kinds={};if(o.kinds&&typeof o.kinds==='object')Object.entries(o.kinds).forEach(([k,v])=>{if(A.kinds[k]&&typeof v==='string'&&v.trim())kinds[k]=v.trim().slice(0,24)});
  (Array.isArray(o.notes)?o.notes:[]).forEach(x=>{if(typeof x==='string'&&x.trim())notes.push('AI 说：'+x.trim().slice(0,300))});return{steps,kinds,notes}}
const autoTitle=(M,s)=>{const PA=M.asm.parts,c=[];(s.parts||[]).forEach(i=>{const n=kname(M,PA[i].kind);if(!c.includes(n))c.push(n)});return c.length?'装'+c.slice(0,3).join('、')+(c.length>3?'等':''):(s.pose&&s.pose!=='up'?'':'')};
root.MAsm={KEY,parseGLB,base,aiPrompt,aiApply,steps,autoDir,axisOf,pathCheck,parseSay,push,travel,Q,POSES,WORLD,DIRNAME,kname,autoTitle,GREEN};if(typeof module!=='undefined')module.exports=root.MAsm;
})(typeof window!=='undefined'?window:globalThis);
