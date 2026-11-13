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
function parseGLB(buf,T3,unit){const dv=new DataView(buf);if(dv.byteLength<20||dv.getUint32(0,true)!==0x46546C67)throw new Error('这不是 GLB 文件。请导出为 .glb（二进制 glTF）。');
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
    parts.push({src:String(n.name||'').replace(/\u200b/g,'').trim(),mesh:n.mesh,c,size:[s.x,s.y,s.z],pos:new Float32Array(pos),idx:new Uint32Array(idx),col})});
  if(!parts.length)throw new Error('这个文件里没有找到零件的形状。');
  const all=new T3.Box3();parts.forEach(p=>{const h=new T3.Vector3(...p.size).multiplyScalar(.5);all.expandByPoint(p.c.clone().add(h)).expandByPoint(p.c.clone().sub(h))});const ctr=all.getCenter(new T3.Vector3()),S=all.getSize(new T3.Vector3());
  /* glTF says metres, but files made from drawings in millimetres, centimetres or inches often keep their numbers. When the product
     comes out more than 10 m big, the unit that gives a believable size (20 cm to 4 m) is taken; the person can set it by hand. */
  const UN={m:1,cm:.01,mm:.001,inch:.0254},big0=Math.max(S.x,S.y,S.z);let u=UN[unit]?unit:'m';if(!UN[unit]&&big0>1000)u=['mm','cm','inch'].find(x=>big0*UN[x]>=20&&big0*UN[x]<=400)||'mm';
  if(u!=='m'){const k=UN[u];parts.forEach(p=>{p.c.multiplyScalar(k);p.size=p.size.map(v=>v*k);for(let q=0;q<p.pos.length;q++)p.pos[q]*=k});ctr.multiplyScalar(k);S.multiplyScalar(k)}
  /* parts without a name are told apart by their shape: the same mesh used again is the same kind of part */
  const named=parts.filter(p=>p.src).length>=parts.length*.5,seen=new Map();parts.forEach(p=>{p.c.sub(ctr);p.c=[p.c.x,p.c.y,p.c.z];if(named&&p.src)p.kind=KEY(p.src);else{if(!seen.has(p.mesh))seen.set(p.mesh,seen.size+1);p.kind='零件 '+seen.get(p.mesh);if(!p.src)p.src=p.kind}});
  const big=Math.max(S.x,S.y,S.z);parts.forEach(p=>{const m=Math.max(...p.size),white=p.col==null||((p.col>>16&255)>225&&(p.col>>8&255)>225&&(p.col&255)>225);p.col=m<big*.22?(white?0xaeb4ba:p.col):(white?0xf4f4f0:p.col)});
  return{parts,size:[S.x,S.y,S.z],unit:u,guessed:!UN[unit]&&u!=='m',named,gen:(J.asset&&J.asset.generator)||'',copyright:(J.asset&&J.asset.copyright)||''}}
/* the model without steps; M.asm keeps what the editor needs to carry on later */
function base(G,name,from){const I7=[0,0,0,1,1,1,1],r=v=>+v.toFixed(3),M={format:'assembly-model',version:1,unit:'cm',up:'y',product:name||'未命名产品',samples:120,render:{shadow:false,fov:32,near:1,far:2000},scenes:[{bg:0xc3cfcc,nodes:[]}],geoms:[],texs:[],mats:[],steps:[],parts:[],holes:[],warn:[],
    asm:{v:1,unit:G.unit||'m',from:from||'',copyright:G.copyright||'',size:G.size.map(r),parts:[],kinds:{},steps:[]}},N=M.scenes[0].nodes;
  N.push({p:-1,t:'H',c:0xffffff,c2:0x8a8f8c,i:.95,x:[0,1,0,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.55,x:[60,90,80,...I7]});N.push({p:-1,t:'D',c:0xffffff,i:.25,x:[-70,40,-60,...I7]});
  M.asm.root=N.length;N.push({p:-1,t:'G',n:'assembly',x:[0,G.size[1]/2,0,...I7]});const LM=M.mats.length;M.mats.push({k:'LineBasicMaterial',c:0x3a4144});
  G.parts.forEach((p,i)=>{const g=M.geoms.length;M.geoms.push({k:'raw',pos:b64(p.pos),idx:b64(p.idx),i32:1});M.geoms.push({k:'edges',g,a:32});const m=M.mats.length;M.mats.push({k:'MeshStandardMaterial',c:p.col,ro:.75,me:0,fs:1,sd:2});const node=N.length;
    N.push({p:M.asm.root,t:'M',g,m,n:p.src,x:[...p.c.map(r),...I7]});N.push({p:node,t:'L',g:g+1,m:LM,x:[0,0,0,...I7]});
    M.asm.parts.push({node,mat:m,kind:p.kind,src:p.src,c:p.c.map(r),size:p.size.map(r),col:p.col});if(!M.asm.kinds[p.kind])M.asm.kinds[p.kind]={name:p.kind,code:/^\d{5,9}$/.test(p.kind)?p.kind:''}});
  return M}
/* a model that was read in the wrong unit is brought to size as it stands: shapes, places and sizes are scaled, the steps stay */
const UNITS={m:1,cm:.01,mm:.001,inch:.0254};
function guessUnit(big){return big>1000?(['mm','cm','inch'].find(x=>big*UNITS[x]>=20&&big*UNITS[x]<=400)||'mm'):'m'}
function rescale(M,k){const A=M.asm,r=v=>+(v*k).toFixed(3),dec=s=>{if(typeof Buffer!=='undefined'){const b=Buffer.from(s,'base64');return new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))}const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Float32Array(u.buffer)};
  M.geoms.forEach(g=>{if(g.k==='raw'&&g.pos){const a=dec(g.pos);for(let i=0;i<a.length;i++)a[i]*=k;g.pos=b64(a)}});const N=M.scenes[0].nodes;[A.root,...A.parts.map(p=>p.node)].forEach(i=>{const x=N[i].x;x[0]=r(x[0]);x[1]=r(x[1]);x[2]=r(x[2])});
  A.parts.forEach(p=>{p.c=p.c.map(r);p.size=p.size.map(r)});A.size=A.size.map(r);A.steps.forEach(s=>{if(s.cam&&s.cam.dist)s.cam.dist=r(s.cam.dist);s.auto={};s.det={};s.man={}});A.rv=0;return M}
const kname=(M,k)=>{const K=M.asm.kinds[k]||{};return K.name||k};
function travel(part,d){const e=Math.abs(d[0])*part.size[0]+Math.abs(d[1])*part.size[1]+Math.abs(d[2])*part.size[2];return Math.max(6,Math.min(60,e*1.1+4))}
/* points spread evenly over a part's surface (the same ones every time), set a little way in under the surface: parts drawn as a
   tight or pressed fit overlap by a hair in the file, and a point exactly on the surface would count that hair as a wall */
const INSET={v:.05};
function samples(T3,geo,c,N,inset){if(inset===undefined)inset=INSET.v;const P=geo.attributes.position,I=geo.index,n=I.count/3,ar=new Float64Array(n),a=new T3.Vector3(),b=new T3.Vector3(),e=new T3.Vector3();let tot=0;for(let k=0;k<n;k++){a.fromBufferAttribute(P,I.getX(k*3));b.fromBufferAttribute(P,I.getX(k*3+1));e.fromBufferAttribute(P,I.getX(k*3+2));tot+=ar[k]=b.sub(a).cross(e.sub(a)).length()/2}
  const O=[];let s=12345,acc=0,k=0;const rnd=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;for(let q=0;q<N;q++){const tg=(q+.5)*tot/N;while(k<n-1&&acc+ar[k]<tg){acc+=ar[k];k++}a.fromBufferAttribute(P,I.getX(k*3));b.fromBufferAttribute(P,I.getX(k*3+1));e.fromBufferAttribute(P,I.getX(k*3+2));let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v}const px=a.x+(b.x-a.x)*u+(e.x-a.x)*v,py=a.y+(b.y-a.y)*u+(e.y-a.y)*v,pz=a.z+(b.z-a.z)*u+(e.z-a.z)*v;let nx=0,ny=0,nz=0;if(inset){const e1x=b.x-a.x,e1y=b.y-a.y,e1z=b.z-a.z,e2x=e.x-a.x,e2y=e.y-a.y,e2z=e.z-a.z;nx=e1y*e2z-e1z*e2y;ny=e1z*e2x-e1x*e2z;nz=e1x*e2y-e1y*e2x;const l=Math.hypot(nx,ny,nz)||1;nx*=inset/l;ny*=inset/l;nz*=inset/l}O.push(new T3.Vector3(px-nx+c[0],py-ny+c[1],pz-nz+c[2]))}return O}
/* triangles of a mesh in world coordinates, with each one's box, kept on the mesh (parts only ever sit at a position, unturned) */
function tris(T3,mesh){const u=mesh.userData;if(u.tri)return u.tri;const g=mesh.geometry,P=g.attributes.position,I=g.index,n=I?I.count/3:P.count/3,ox=mesh.position.x,oy=mesh.position.y,oz=mesh.position.z,V=new Float32Array(n*9),B=new Float32Array(n*6),N=new Float32Array(n*3);
  for(let k=0;k<n;k++){for(let c=0;c<3;c++){const v=I?I.getX(k*3+c):k*3+c;V[k*9+c*3]=P.getX(v)+ox;V[k*9+c*3+1]=P.getY(v)+oy;V[k*9+c*3+2]=P.getZ(v)+oz}
    const a=k*9,e1x=V[a+3]-V[a],e1y=V[a+4]-V[a+1],e1z=V[a+5]-V[a+2],e2x=V[a+6]-V[a],e2y=V[a+7]-V[a+1],e2z=V[a+8]-V[a+2];let nx=e1y*e2z-e1z*e2y,ny=e1z*e2x-e1x*e2z,nz=e1x*e2y-e1y*e2x;const l=Math.hypot(nx,ny,nz)||1;N[k*3]=nx/l;N[k*3+1]=ny/l;N[k*3+2]=nz/l;
    for(let c=0;c<3;c++){B[k*6+c]=Math.min(V[a+c],V[a+3+c],V[a+6+c]);B[k*6+3+c]=Math.max(V[a+c],V[a+3+c],V[a+6+c])}}
  const bb=[1e9,1e9,1e9,-1e9,-1e9,-1e9];for(let k=0;k<n;k++)for(let c=0;c<3;c++){if(B[k*6+c]<bb[c])bb[c]=B[k*6+c];if(B[k*6+3+c]>bb[3+c])bb[3+c]=B[k*6+3+c]}return u.tri={n,V,B,N,bb}}
/* share of the points O that, going the way D for the length far, pass through more than `thick` cm of the meshes in near.
   Only the triangles inside the box swept by the points are looked at, which is what keeps this fast on detailed parts. */
function ratioAlong(T3,O,near,D,far,off,thick){if(thick==null)thick=1;const dx=D.x,dy=D.y,dz=D.z,ox=off?off.x:0,oy=off?off.y:0,oz=off?off.z:0,sw=[1e9,1e9,1e9,-1e9,-1e9,-1e9],S=new Float32Array(O.length*3);
  O.forEach((o,q)=>{const x=o.x-dx*.05+ox,y=o.y-dy*.05+oy,z=o.z-dz*.05+oz;S[q*3]=x;S[q*3+1]=y;S[q*3+2]=z;const e=[x,y,z,x+dx*far,y+dy*far,z+dz*far];for(let c=0;c<3;c++){const lo=Math.min(e[c],e[3+c]),hi=Math.max(e[c],e[3+c]);if(lo<sw[c])sw[c]=lo;if(hi>sw[3+c])sw[3+c]=hi}});for(let c=0;c<3;c++){sw[c]-=.01;sw[3+c]+=.01}
  const C=[];near.forEach(m=>{const tr=tris(T3,m),b=tr.bb;if(b[0]>sw[3]||b[3]<sw[0]||b[1]>sw[4]||b[4]<sw[1]||b[2]>sw[5]||b[5]<sw[2])return;const L=[],B=tr.B;for(let k=0;k<tr.n;k++){const a=k*6;if(B[a]>sw[3]||B[a+3]<sw[0]||B[a+1]>sw[4]||B[a+4]<sw[1]||B[a+2]>sw[5]||B[a+5]<sw[2])continue;L.push(k)}if(L.length)C.push({tr,L,f:L.map(k=>tr.N[k*3]*dx+tr.N[k*3+1]*dy+tr.N[k*3+2]*dz)})});
  if(!C.length)return 0;let deep=0,any=0;const H=[];
  for(let q=0;q<O.length;q++){const px=S[q*3],py=S[q*3+1],pz=S[q*3+2];let ins=0;
    for(const c of C){const V=c.tr.V;H.length=0;for(let j=0;j<c.L.length;j++){const f=c.f[j];if(f>-.05&&f<.05)continue;const a=c.L[j]*9,e1x=V[a+3]-V[a],e1y=V[a+4]-V[a+1],e1z=V[a+5]-V[a+2],e2x=V[a+6]-V[a],e2y=V[a+7]-V[a+1],e2z=V[a+8]-V[a+2],hx=dy*e2z-dz*e2y,hy=dz*e2x-dx*e2z,hz=dx*e2y-dy*e2x,det=e1x*hx+e1y*hy+e1z*hz;if(det>-1e-9&&det<1e-9)continue;
        const inv=1/det,sx=px-V[a],sy=py-V[a+1],sz=pz-V[a+2],u=(sx*hx+sy*hy+sz*hz)*inv;if(u<0||u>1)continue;const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)continue;const tt=(e2x*qx+e2y*qy+e2z*qz)*inv;if(tt<0||tt>far)continue;H.push(tt,f)}
      if(!H.length)continue;const idx=[];for(let k=0;k<H.length;k+=2)idx.push(k);idx.sort((x,y)=>H[x]-H[y]);let ent=-1;for(const k of idx){if(H[k+1]<0){if(ent<0)ent=H[k]}else if(ent>=0){ins+=H[k]-ent;ent=-1}}if(ent>=0)ins+=far-ent}
    if(ins>thick)deep++;if(ins>.05)any++}
  /* a thin sheet (a back panel of 3 mm) is thinner than what is forgiven for snap fits, but a part cannot go through it: when most of the part would cross something, however thin, the way is closed */
  return any/O.length>=.7?Math.max(deep,any)/O.length:deep/O.length}
/* how far a part (its points O) has to go along d to be clear of everything in near. A way in only counts as free when the part can
   come all the way from outside; a hand's width of free room inside a housing is not a way in. */
function clearFar(T3,O,near,d){let hi=-1e9,lo=1e9;for(const m of near){const b=tris(T3,m).bb;for(let c=0;c<8;c++){const v=(c&1?b[3]:b[0])*d[0]+(c&2?b[4]:b[1])*d[1]+(c&4?b[5]:b[2])*d[2];if(v>hi)hi=v}}for(const o of O){const v=o.x*d[0]+o.y*d[1]+o.z*d[2];if(v<lo)lo=v}return Math.max(6,Math.min(150,hi-lo+1))}
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
    const sc=(ratio<=tol?100:-ratio*100)+(small?.5:3)*u+1.5*D.dot(away)-(u<-.9?10:0)+(along?2.5:0)-(reach>.2?1:0);/* little room outside only tips the balance between otherwise equal ways; it is reported, not forbidden */if(!best||sc>best.sc)best={d,sc,ratio,reach,along,under:u<-.9}});
  /* room to move a little is not yet a way in: if neither this way nor any other leads clear out of everything that is there, the part is shut in */
  let shut=0;if(best.ratio<=Math.max(tol,.1)){const out=d=>ratioAlong(T3,O,near,new T3.Vector3(...d),clearFar(T3,O,near,d))<=Math.max(tol,.1);if(!out(best.d)&&!dirs.some(d=>d!==best.d&&out(d)))shut=1}
  return{...(shut?{shut:1}:{}),d:best.d,blocked:best.ratio>Math.max(tol,.1)?1:0,ratio:+best.ratio.toFixed(3),small:small?1:0,all,...(best.along?{axis:1}:{}),...(best.under?{under:1}:{}),...(best.reach>.2?{tight:+best.reach.toFixed(2)}:{})}}
/* looking closer at a way in (A): does the part brush anything on the way (more than 3 mm of it)? If so, look for a way round:
   come in along A a little to one side, then slide the last bit (B) into place — the smallest sidestep that is clear on both stretches. */
function detour(T3,M,rc,i,obst,A){const p=M.asm.parts[i];if(!obst.length||(!A[0]&&!A[1]&&!A[2]))return null;const O=samples(T3,rc[i].geometry,p.c,180),near=obst.map(j=>rc[j]),small=isSmall(M,p),tol=small?.05:.02,vA=new T3.Vector3(...A),ta=travel(p,A),fine=ratioAlong(T3,O,near,vA,ta,null,.3);
  if(fine<=.05)return null;const ax=small?axisOf(T3,rc[i].geometry):null,dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].filter(d=>Math.abs(vA.dot(new T3.Vector3(...d)))<.5);let best=null;
  for(const tb of[1.5,3,5,8]){for(const B of dirs){const vB=new T3.Vector3(...B),r2=ratioAlong(T3,O,near,vB,tb,null,.3);if(r2>tol)continue;const r1=ratioAlong(T3,O,near,vA,ta,vB.clone().multiplyScalar(tb),.3);if(r1>tol)continue;if(!best||r1+r2<best.r-1e-9)best={b:B,tb,r:r1+r2}}if(best)break}
  return best?{b:best.b,tb:best.tb,fine:+fine.toFixed(3)}:{fine:+fine.toFixed(3),none:1}}
/* a way in chosen by a person (one stretch, or two: first from A, then from B into place): does it pass through anything? */
function pathCheck(T3,M,rc,i,obst,A,B,tb0){const p=M.asm.parts[i];if(!obst.length)return{ratio:0};const O=samples(T3,rc[i].geometry,p.c,180),near=obst.map(j=>rc[j]),z=v=>!v||(!v[0]&&!v[1]&&!v[2]);let r=0;
  if(B&&!z(B)){const tb=tb0||push(p,B),vb=new T3.Vector3(...B);r=ratioAlong(T3,O,near,vb,tb);if(!z(A))r=Math.max(r,ratioAlong(T3,O,near,new T3.Vector3(...A),travel(p,A),vb.clone().multiplyScalar(tb)))}else if(!z(A))r=ratioAlong(T3,O,near,new T3.Vector3(...A),travel(p,A));
  const last=B&&!z(B)?B:A,reach=isSmall(M,p)&&!z(last)?ratioAlong(T3,O,near,new T3.Vector3(...last),M.asm.tool||20):0;return{ratio:+r.toFixed(3),blocked:r>(isSmall(M,p)?.1:.03)?1:0,...(reach>.2?{tight:+reach.toFixed(2)}:{})}}
/* which of the parts already there stand in a part's way along d: the worst three, with the share of the part each one blocks */
function blockers(T3,M,rc,i,obst,d){const p=M.asm.parts[i],O=samples(T3,rc[i].geometry,p.c,180),D=new T3.Vector3(...d),far=travel(p,d),out=[];obst.forEach(j=>{const r=ratioAlong(T3,O,[rc[j]],D,far);if(r>.02)out.push([j,+r.toFixed(2)])});return out.sort((a,b)=>b[1]-a[1]).slice(0,3)}
/* ---- ways in that need a turn ----
   a part as a block of small cells, each knowing how deep inside the solid it lies (cm; 0 = outside). Sweeping along a line cannot say
   whether a part fits while it is being turned; looking up where its points are, pose after pose, can. Inside is decided by counting
   crossings along each of the three axes and taking the majority, so a crack in the mesh does not flip a whole column. */
function vox(T3,mesh){const u=mesh.userData;if(u.vox)return u.vox;const tr=tris(T3,mesh),bb=tr.bb,dim=[bb[3]-bb[0],bb[4]-bb[1],bb[5]-bb[2]],h=(Math.max(...dim)/56)||1,n=dim.map(d=>Math.max(4,Math.min(56,Math.ceil(d/h)))),c=dim.map((d,a)=>(d||1e-6)/n[a]),N=n[0]*n[1]*n[2],votes=new Uint8Array(N),V=tr.V,J=[.5003,.5007,.5011];
  for(let ax=0;ax<3;ax++){const b=(ax+1)%3,e=(ax+2)%3,cols=new Array(n[b]*n[e]),st=[1,n[0],n[0]*n[1]];
    for(let k=0;k<tr.n;k++){const o=k*9,p0b=V[o+b],p0e=V[o+e],p1b=V[o+3+b],p1e=V[o+3+e],p2b=V[o+6+b],p2e=V[o+6+e],den=(p1b-p0b)*(p2e-p0e)-(p2b-p0b)*(p1e-p0e);if(den>-1e-12&&den<1e-12)continue;
      const lb=Math.max(0,Math.floor((Math.min(p0b,p1b,p2b)-bb[b])/c[b]-1)),hb=Math.min(n[b]-1,Math.ceil((Math.max(p0b,p1b,p2b)-bb[b])/c[b])),le=Math.max(0,Math.floor((Math.min(p0e,p1e,p2e)-bb[e])/c[e]-1)),he=Math.min(n[e]-1,Math.ceil((Math.max(p0e,p1e,p2e)-bb[e])/c[e]));
      for(let j=lb;j<=hb;j++){const yb=bb[b]+(j+J[b])*c[b];for(let m=le;m<=he;m++){const ye=bb[e]+(m+J[e])*c[e],w1=((yb-p0b)*(p2e-p0e)-(p2b-p0b)*(ye-p0e))/den,w2=((p1b-p0b)*(ye-p0e)-(yb-p0b)*(p1e-p0e))/den;if(w1<0||w2<0||w1+w2>1)continue;(cols[j+m*n[b]]||(cols[j+m*n[b]]=[])).push(V[o+ax]+(V[o+3+ax]-V[o+ax])*w1+(V[o+6+ax]-V[o+ax])*w2)}}}
    for(let j=0;j<n[b];j++)for(let m=0;m<n[e];m++){const L=cols[j+m*n[b]];if(!L||L.length<2)continue;L.sort((x,y)=>x-y);for(let q=0;q+1<L.length;q+=2){const i0=Math.max(0,Math.ceil((L[q]-bb[ax])/c[ax]-J[ax])),i1=Math.min(n[ax]-1,Math.floor((L[q+1]-bb[ax])/c[ax]-J[ax]));for(let i=i0;i<=i1;i++)votes[i*st[ax]+j*st[b]+m*st[e]]++}}}
  const d=new Float32Array(N),s1=n[0],s2=n[0]*n[1];for(let i=0;i<N;i++)d[i]=votes[i]>=2?1e6:0;
  for(let z=0;z<n[2];z++)for(let y=0;y<n[1];y++)for(let x=0;x<n[0];x++){const i=x+s1*y+s2*z;if(!d[i])continue;const a=(x?d[i-1]:0)+c[0],b=(y?d[i-s1]:0)+c[1],e=(z?d[i-s2]:0)+c[2];d[i]=Math.min(d[i],a,b,e)}
  for(let z=n[2]-1;z>=0;z--)for(let y=n[1]-1;y>=0;y--)for(let x=n[0]-1;x>=0;x--){const i=x+s1*y+s2*z;if(!d[i])continue;const a=(x<n[0]-1?d[i+1]:0)+c[0],b=(y<n[1]-1?d[i+s1]:0)+c[1],e=(z<n[2]-1?d[i+s2]:0)+c[2];d[i]=Math.min(d[i],a,b,e)}
  const half=Math.min(...c)/2;for(let i=0;i<N;i++)if(d[i])d[i]=Math.max(1e-3,d[i]-half);return u.vox={o:[bb[0],bb[1],bb[2]],c,n,d}}
/* of the points pts (a part in some pose): the share lying deeper than `thick` inside one of the meshes, and the share inside at all */
function poseShare(T3,pts,near,thick){if(thick==null)thick=.3;const n=pts.length,lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const p of pts){if(p.x<lo[0])lo[0]=p.x;if(p.y<lo[1])lo[1]=p.y;if(p.z<lo[2])lo[2]=p.z;if(p.x>hi[0])hi[0]=p.x;if(p.y>hi[1])hi[1]=p.y;if(p.z>hi[2])hi[2]=p.z}
  const dep=new Float32Array(n);for(const m of near){const b=tris(T3,m).bb;if(b[0]>hi[0]||b[3]<lo[0]||b[1]>hi[1]||b[4]<lo[1]||b[2]>hi[2]||b[5]<lo[2])continue;const v=vox(T3,m),o=v.o,c=v.c,N=v.n,d=v.d;for(let q=0;q<n;q++){const p=pts[q],i=Math.floor((p.x-o[0])/c[0]),j=Math.floor((p.y-o[1])/c[1]),k=Math.floor((p.z-o[2])/c[2]);if(i<0||j<0||k<0||i>=N[0]||j>=N[1]||k>=N[2])continue;const x=d[i+N[0]*(j+N[1]*k)];if(x>dep[q])dep[q]=x}}
  let deep=0,any=0;for(let q=0;q<n;q++){if(dep[q]>thick)deep++;if(dep[q]>0)any++}return{deep:deep/n,any:any/n}}
/* a way in for a part that no straight way reaches. Looked for backwards, from its place outwards, simplest first:
   1. back out a little one way (A), then leave another way (C) — a way round a corner;
   2. turn on the spot about one of the axes, a little more each time, and try to leave after each turn;
   3. back out a little, then turn, then leave.
   Straight stretches are swept exactly (with the part's points as they are turned); turns are checked pose by pose. Played forwards:
   come in along C, turned; straighten up; push home along A. -> {a,al,u,th,c,cl} or null. `budget` = ms after which it gives up. */
function findPath(T3,M,rc,i,obst,budget){const PA=M.asm.parts,p=PA[i];if(!obst.length)return null;const t0=Date.now(),lim=budget||25000,small=isSmall(M,p),tol=small?.05:.02,O=samples(T3,rc[i].geometry,p.c,110),ctr=new T3.Vector3(...p.c),near=obst.map(j=>rc[j]);
  let rmax=0;O.forEach(o=>{rmax=Math.max(rmax,o.distanceTo(ctr))});const D6=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]],ax=axisOf(T3,rc[i].geometry),AX=[[0,1,0],[1,0,0],[0,0,1]].filter(u=>!ax||Math.abs(u[0]*ax[0]+u[1]*ax[1]+u[2]*ax[2])<.97);/* turning a round part about its own axis changes nothing */
  const shift=(pts,d,l)=>pts.map(o=>new T3.Vector3(o.x+d[0]*l,o.y+d[1]*l,o.z+d[2]*l)),turn=(pts,c,u,deg)=>{const q=new T3.Quaternion().setFromAxisAngle(new T3.Vector3(...u).normalize(),deg*Math.PI/180);return pts.map(o=>o.clone().sub(c).applyQuaternion(q).add(c))};
  const sweep=(pts,d,far)=>ratioAlong(T3,pts,near,new T3.Vector3(...d),far),exit=(pts,d)=>clearFar(T3,pts,near,d);
  /* the same seen from the small parts that stay: brought into the moving part's own frame, would they have to pass through it? s = how far
     it has been backed out, q = how it is turned (or null) */
  const vol=q=>q.size[0]*q.size[1]*q.size[2],sm=obst.filter(j=>vol(PA[j])<=vol(p)/PLANK.v),me=[rc[i]],OJ={},tj=j=>isSmall(M,PA[j])?.05:.02,inMe=(j,s,qi)=>(OJ[j]||(OJ[j]=samples(T3,rc[j].geometry,PA[j].c,60))).map(o=>{const v=o.clone().sub(ctr);if(s)v.sub(s);if(qi)v.applyQuaternion(qi);return v.add(ctr)});
  const backLine=(s,q,d,far)=>{const qi=q?q.clone().invert():null,dir=new T3.Vector3(-d[0],-d[1],-d[2]);if(qi)dir.applyQuaternion(qi);for(const j of sm)if(ratioAlong(T3,inMe(j,s,qi),me,dir,far)>tj(j))return false;return true};
  const backPose=(s,q)=>{const qi=q.clone().invert();for(const j of sm){const r=poseShare(T3,inMe(j,s,qi),me);if(r.deep>tj(j)||r.any>=.7)return false}return true};
  /* leaving: any of the six ways, and when turned also the part's own (turned) axes */
  const leave=(pts,q,skip,sh)=>{const L=D6.slice();if(q)for(const d of D6){const v=new T3.Vector3(...d).applyQuaternion(q);if(Math.max(Math.abs(v.x),Math.abs(v.y),Math.abs(v.z))<.99)L.push([+v.x.toFixed(5),+v.y.toFixed(5),+v.z.toFixed(5)])}for(const d of L){if(skip&&Math.abs(d[0]*skip[0]+d[1]*skip[1]+d[2]*skip[2])>.99)continue;const far=exit(pts,d);if(sweep(pts,d,far)<=tol&&backLine(sh,q,d,far))return{d,far:Math.min(far,70)}}return null};
  /* 1. round a corner */
  const alive=[];for(const dA of D6){for(const al of[2,4,8,15,25]){if(Date.now()-t0>lim)return null;/* the last push home has to be clean (3 mm), or two stretches would forgive what one straight way does not */if(ratioAlong(T3,O,near,new T3.Vector3(...dA),al,null,.3)>tol||!backLine(null,null,dA,al))break;alive.push([dA,al]);const pts=shift(O,dA,al),out=leave(pts,null,dA,new T3.Vector3(...dA).multiplyScalar(al));if(out)return{a:dA,al,th:0,c:out.d,cl:+out.far.toFixed(2)}}}
  /* 2. and 3. with a turn */
  const starts=[[null,0]].concat(alive.filter(x=>x[1]<=8));
  for(const[dA,al]of starts){const sh=dA?new T3.Vector3(...dA).multiplyScalar(al):null,base=dA?shift(O,dA,al):O,c2=dA?ctr.clone().add(sh):ctr,qa=(u,deg)=>new T3.Quaternion().setFromAxisAngle(new T3.Vector3(...u).normalize(),deg*Math.PI/180);
    for(const u of AX)for(const sg of[1,-1]){let prev=0;for(const th of[15,30,45,60,90]){if(Date.now()-t0>lim)return null;const n=Math.max(2,Math.min(40,Math.ceil((th-prev)*Math.PI/180*rmax/.25)));let ok=true;for(let k=1;k<=n&&ok;k++){const ang=sg*(prev+(th-prev)*k/n),s=poseShare(T3,turn(base,c2,u,ang),near);if(s.deep>tol||s.any>=.7||!backPose(sh,qa(u,ang)))ok=false}if(!ok)break;prev=th;
        const q=new T3.Quaternion().setFromAxisAngle(new T3.Vector3(...u).normalize(),sg*th*Math.PI/180),out=leave(turn(base,c2,u,sg*th),q,null,sh);if(out)return{...(dA?{a:dA,al}:{}),u,th:sg*th,c:out.d,cl:+out.far.toFixed(2)}}}}
  return null}
/* an assembly order found by taking the finished product apart: in each round every part that has a straight way out, clear of all
   that is still there, comes off. Fitting them in the reverse order cannot collide. What never comes off is locked together.
   planStart gives the state, planRound takes one round off and says whether there may be more. */
function planStart(M){return{rem:new Set(M.asm.parts.map((p,i)=>i)),layers:[],done:false}}
/* seen from the other side: would any part that stays have to pass through the one that leaves? (a small pin through a big panel hardly
   shows in the panel's own points, but all of the pin's points go through the panel.) mesh = the leaving part or body, d its way out. */
const PLANK={v:8};
function planBack(T3,M,rc,st,mesh,d,far,rest){const PA=M.asm.parts,vd=new T3.Vector3(-d[0],-d[1],-d[2]),O=st.O=st.O||{},bad=[],bs=mesh.geometry.boundingBox.getSize(new T3.Vector3()),bv=bs.x*bs.y*bs.z;for(const j of rest){const p=PA[j];if(p.size[0]*p.size[1]*p.size[2]>bv/PLANK.v)continue;const o=O[j]||(O[j]=samples(T3,rc[j].geometry,p.c,120));if(ratioAlong(T3,o,[mesh],vd,far)>(isSmall(M,p)?.05:.02))bad.push(j)}return bad}
function planRound(T3,M,rc,st,flat){const D=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]],out=[];if(st.rem.size<=1){st.done=true;return false}
  for(const i of st.rem){const p=M.asm.parts[i],o=[...st.rem].filter(j=>j!==i),near=o.map(j=>rc[j]),O=samples(T3,rc[i].geometry,p.c,180),tol=isSmall(M,p)?.05:.02;for(const d of D){const far=travel(p,d),r=ratioAlong(T3,O,near,new T3.Vector3(...d),far);if(r<=tol&&!planBack(T3,M,rc,st,rc[i],d,far,o).length){out.push({i,d,r});break}}}
  if(!out.length){const g=flat?null:planGroup(T3,M,rc,st);if(g){st.layers.push([g]);g.u.forEach(x=>st.rem.delete(x));return true}
    if(st.rem.size<=14)for(const i of st.rem){const o=[...st.rem].filter(j=>j!==i).sort((a,b)=>a-b),pt=findPath(T3,M,rc,i,o,12000);if(pt){pt.k=o.join(',');st.layers.push([{i,d:pt.c,r:0,pt}]);st.rem.delete(i);return true}}st.done=true;return false}
  if(out.length===st.rem.size){st.done=true;const vl=x=>{const s=M.asm.parts[x.i].size;return s[0]*s[1]*s[2]};out.sort((a,b)=>vl(a)-vl(b));out.pop();st.layers.push(out);out.forEach(x=>st.rem.delete(x.i));return false}
  st.layers.push(out);out.forEach(x=>st.rem.delete(x.i));return true}
/* several parts as one body: all their triangles in one mesh, standing as one more part at the end of the list */
function body(T3,M,rc,L){const PA=M.asm.parts,b=new T3.Box3();L.forEach(j=>{const p=PA[j];b.expandByPoint(new T3.Vector3(p.c[0]-p.size[0]/2,p.c[1]-p.size[1]/2,p.c[2]-p.size[2]/2));b.expandByPoint(new T3.Vector3(p.c[0]+p.size[0]/2,p.c[1]+p.size[1]/2,p.c[2]+p.size[2]/2))});
  const C=b.getCenter(new T3.Vector3()),sz=b.getSize(new T3.Vector3());let nv=0,ni=0;L.forEach(j=>{const g=rc[j].geometry;nv+=g.attributes.position.count;ni+=g.index.count});const pos=new Float32Array(nv*3),idx=new Uint32Array(ni);let vo=0,io=0;
  L.forEach(j=>{const g=rc[j].geometry,V=g.attributes.position,I=g.index,p=PA[j];for(let q=0;q<V.count;q++){pos[(vo+q)*3]=V.getX(q)+p.c[0]-C.x;pos[(vo+q)*3+1]=V.getY(q)+p.c[1]-C.y;pos[(vo+q)*3+2]=V.getZ(q)+p.c[2]-C.z}for(let q=0;q<I.count;q++)idx[io+q]=I.getX(q)+vo;vo+=V.count;io+=I.count});
  const g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(pos,3));g.setIndex(new T3.BufferAttribute(idx,1));g.computeBoundingBox();g.computeBoundingSphere();const o=new T3.Mesh(g,rc[L[0]].material);o.position.copy(C);o.updateMatrixWorld(true);
  return{M:{asm:Object.assign({},M.asm,{parts:PA.concat([{c:C.toArray(),size:sz.toArray(),kind:'@'}])})},rc:rc.concat([o]),i:PA.length}}
/* when no single part comes off: a few parts that only come off together. For a part and a way out, whatever stands in its way has to
   come along, and whatever stands in their way too; if what is gathered like that comes away clear, and is not everything, it is a
   component. The smallest one found is taken; how it is put together itself is found the same way, on its own. */
function planGroup(T3,M,rc,st){const D=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]],rem=[...st.rem];if(rem.length<3||rem.length>40)return null;const seen=new Set();let best=null;
  for(const d of D){const vd=new T3.Vector3(...d);for(const seed of rem){let S=[seed];for(let it=0;it<8;it++){const key=d.join()+'|'+S.slice().sort((a,b)=>a-b).join();if(seen.has(key))break;seen.add(key);const rest=rem.filter(j=>!S.includes(j));if(!rest.length||(best&&S.length>=best.u.length))break;
        let MM=M,RC=rc,i=S[0];if(S.length>1){const B=body(T3,M,rc,S);MM=B.M;RC=B.rc;i=B.i}const p=MM.asm.parts[i],O=samples(T3,RC[i].geometry,p.c,S.length>1?260:180),far=travel(p,d),by=rest.filter(j=>ratioAlong(T3,O,[rc[j]],vd,far)>.02);planBack(T3,M,rc,st,RC[i],d,far,rest).forEach(j=>{if(!by.includes(j))by.push(j)});
        if(!by.length){if(S.length>1&&ratioAlong(T3,O,rest.map(j=>rc[j]),vd,far)<=.02)best={u:S.slice(),d};break}S=S.concat(by)}}}
  if(best){const sub={rem:new Set(best.u),layers:[],done:false};let n=0;while(!sub.done&&n++<60)planRound(T3,M,rc,sub,true);best.sub=sub}return best}
/* the rounds turned into steps: what is locked together (or the last part left) is the base; each round, taken backwards, is one big
   step, with a sub-step for each kind of part, big parts first. A component gets its own steps first, then one step that fits it. */
function planSteps(M,st){const A=M.asm,vol=i=>A.parts[i].size[0]*A.parts[i].size[1]*A.parts[i].size[2],steps=[],mk=(parts,x)=>Object.assign({title:'',tAuto:true,say:'',parts,pose:'up',move:{},auto:{},by:'plan'},x||{});let gn=0;A.groups={};const PT={},note=L=>L.forEach(x=>{if(x.pt)PT[x.i]=x.pt;if(x.sub)x.sub.layers.forEach(note)});st.layers.forEach(note);const withPt=s=>{s.parts.forEach(i=>{if(PT[i])(s.path=s.path||{})[i]=PT[i]});return s};
  const lay=(L,x)=>{const ks=[];L.slice().sort((a,b)=>vol(b)-vol(a)).forEach(i=>{const k=A.parts[i].kind;let g=ks.find(y=>y.k===k);if(!g)ks.push(g={k,parts:[]});g.parts.push(i)});ks.forEach((g,n)=>steps.push(mk(g.parts,Object.assign(n>0?{sub:true}:{},x||{}))))};
  const base=[...st.rem].sort((a,b)=>vol(b)-vol(a));steps.push(mk(base,base.length>1?{fixed:true}:{}));
  st.layers.slice().reverse().forEach(L=>{L.filter(x=>x.u).forEach(x=>{const id='g'+(++gn);A.groups[id]={name:'组件 '+String.fromCharCode(65+(gn-1)%26)+(gn>26?Math.ceil(gn/26):'')};const b=[...x.sub.rem].sort((a,b)=>vol(b)-vol(a));steps.push(mk(b,Object.assign({grp:id},b.length>1?{fixed:true}:{})));x.sub.layers.slice().reverse().forEach(l=>lay(l.map(y=>y.i),{grp:id}));steps.push(mk([],{unit:id}))});
    const s=L.filter(x=>!x.u).map(x=>x.i);if(s.length)lay(s)});if(!gn)delete A.groups;return steps.map(withPt)}
/* one sentence about how the parts of a step go in -> {kinds:[key…], a, b, spin, say}. Rules only, no AI. */
const SAYDIR=[['U',/从上|往下|向下|朝下|下推|下压|放下|按下|落下/],['D',/从下|往上|向上|朝上|上推|托上|抬上/],['L',/从左|往右|向右|朝右/],['R',/从右|往左|向左|朝左/],['F',/从前|往后|向后|朝后|往里|向里|朝里/],['B',/从后|往前|向前|朝前|往外|向外/],['auto',/按进|靠上|贴上|对准|扣上|插进|放进|装上|卡进|推进|靠近|对上/]];
function parseSay(text,kinds){const x=String(text||'').replace(/\s+/g,'');if(!x)return null;const hit=kinds.filter(k=>k.name&&x.includes(k.name)),tg=(hit.length?hit:kinds),mv=[];x.split(/[，,。；;、]|然后|接着|之后|再/).forEach(c=>{if(!c)return;const m=SAYDIR.find(d=>d[1].test(c));if(m)mv.push(m[0])});
  const spin=/拧|旋|转紧|转动|转进/.test(x),noSpin=/不用拧|不拧|不要转|不转/.test(x);if(!mv.length&&!spin&&!noSpin)return null;const o={kinds:tg.map(k=>k.key)};if(mv.length===1)o.a=mv[0];else if(mv.length>1){o.a=mv[0];o.b=mv[mv.length-1];if(o.b==='auto'){o.b=undefined}}if(spin&&!noSpin)o.spin=true;if(noSpin)o.spin=false;
  const w=d=>d==='auto'?'按程序找到的方向靠上':DIRNAME[d];o.say='好：'+tg.map(k=>'“'+k.name+'”').join('、')+(o.a?(o.b?'先'+w(o.a)+'，再'+DIRNAME[o.b]+'推到位':w(o.a)+(o.a==='auto'?'':'装入')):'')+(o.spin?(o.a?'，':'')+'边进边拧':o.spin===false?(o.a?'，':'')+'不拧':'')+'。';return o}
/* how the steps are numbered for people: a step marked sub carries on the big step before it (7-1, 7-2 …) */
function labels(A){const S=A.steps,out=[];let b=0,k=0;S.forEach((s,i)=>{if(i>0&&s.sub)k++;else{b++;k=1}const grp=k>1||(S[i+1]&&S[i+1].sub);out.push(grp?b+'-'+k:String(b))});return out}
/* M.asm.steps -> M.steps (motion, tint, camera). Deterministic: uses the directions kept in each step. */
/* components: steps marked grp build a component on its own, beside the product; a step with unit fits the whole component into
   the product in one go. For every step: what is there before it (and can be in the way), which parts it moves, and its role. */
const gname=(A,g)=>(A.groups&&A.groups[g]&&A.groups[g].name)||g;
function ctx(A){const main=[],bench={},fit=new Set(),out=[];A.steps.forEach(s=>{const u=s.unit&&!fit.has(s.unit)?s.unit:null,g=!u&&!s.unit&&s.grp&&!fit.has(s.grp)?s.grp:null,ps=s.unit?[]:(s.parts||[]).slice();
  if(u){const m=(bench[u]||[]).slice();out.push({before:main.slice(),mine:m,unit:u});main.push(...m);fit.add(u)}
  else if(g){const b=bench[g]=bench[g]||[];out.push({before:b.slice(),mine:ps,grp:g});b.push(...ps)}
  else{out.push({before:main.slice(),mine:ps});main.push(...ps)}});return out}
function steps(M,T3){const A=M.asm,A_=A,N=M.samples,PA=A.parts,SZ=A.size,r4=v=>+v.toFixed(4),placed=new Set(),out=[],LB=labels(A),CX=ctx(A);let prev=(A.steps[0]&&A.steps[0].pose)||'up';/* the first step simply starts the way it lies */M.warn=[];M.parts=PA.map((p,i)=>({id:'cp'+i,scene:0,node:p.node,name:kname(M,p.kind),...(A.kinds[p.kind]&&A.kinds[p.kind].code?{code:A.kinds[p.kind].code}:{}),src:p.src,size:p.size,steps:[]}));
  const H=q=>{const e=new T3.Matrix4().makeRotationFromQuaternion(q).elements;return Math.abs(e[1])*SZ[0]/2+Math.abs(e[5])*SZ[1]/2+Math.abs(e[9])*SZ[2]/2};
  A.steps.forEach((s,si)=>{const id=String(si+1),pose=s.pose||'up',q1=Q(T3,pose),q0=Q(T3,prev),turn=pose!==prev,cx=CX[si],unit=cx.unit||null,before=new Set(cx.before),mine=cx.mine.filter(i=>PA[i]&&(unit||!placed.has(i))),gn=unit||cx.grp?gname(A,unit||cx.grp):'',tEnd=turn?(mine.length?44:104):0,h1=H(q1);
    const lab=LB[si],st={id,title:s.title||'',label:'第 '+lab+' 步',...(s.sub&&si>0?{sub:1}:{}),...(cx.grp?{group:gn}:{}),...(unit?{unit:gn}:{}),say:s.say||'',scene:0,dur:1.6,parts:[],nodes:{},mats:{},cam:[]};
    if(turn){const pk=[],qk=[],a=4;for(let k=0;k<=10;k++){const f=k/10,e=f*f*(3-2*f),q=q0.clone().slerp(q1,e),x=Math.round(a+(tEnd-a)*f);pk.push(x,0,r4(H(q)+Math.sin(Math.PI*f)*2),0);qk.push(x,r4(q.x),r4(q.y),r4(q.z),r4(q.w))}st.nodes[A.root]={p:pk,q:qk}}
    else if(pose!=='up')st.nodes[A.root]={p:[0,0,r4(h1),0],q:[0,r4(q1.x),r4(q1.y),r4(q1.z),r4(q1.w)]};
    PA.forEach((p,i)=>{if(!before.has(i)&&!mine.includes(i))st.nodes[p.node]={v:[0,0]}});
    const kinds=[];if(unit)kinds.push('@');else mine.forEach(i=>{if(!kinds.includes(PA[i].kind))kinds.push(PA[i].kind)});let U=null;if(unit&&mine.length){const ub=new T3.Box3();mine.forEach(i=>{const p=PA[i];ub.expandByPoint(new T3.Vector3(p.c[0]-p.size[0]/2,p.c[1]-p.size[1]/2,p.c[2]-p.size[2]/2));ub.expandByPoint(new T3.Vector3(p.c[0]+p.size[0]/2,p.c[1]+p.size[1]/2,p.c[2]+p.size[2]/2))});U={size:ub.getSize(new T3.Vector3()).toArray()}}const a0=tEnd?tEnd+6:6,L=(110-a0)/Math.max(1,kinds.length),inv=q1.clone().invert(),box=new T3.Box3(),aW=new T3.Vector3(),cnt={};
    const grow=(c,sz)=>{box.expandByPoint(new T3.Vector3(c[0]-sz[0]/2,c[1]-sz[1]/2,c[2]-sz[2]/2));box.expandByPoint(new T3.Vector3(c[0]+sz[0]/2,c[1]+sz[1]/2,c[2]+sz[2]/2))};before.forEach(i=>grow(PA[i].c,PA[i].size));
    const loc=w=>new T3.Vector3(...WORLD[w]).applyQuaternion(inv).toArray().map(v=>Math.abs(v)<1e-9?0:+v.toFixed(6)),zero=v=>!v[0]&&!v[1]&&!v[2];
    mine.forEach(i=>{const p=PA[i],sl=unit?'@':i,pp=unit?U:p,nm=unit?'组件“'+gn+'”':'“'+kname(M,p.kind)+'”',k=unit?0:kinds.indexOf(p.kind),a=Math.round(a0+k*L),b=Math.round(a0+(k+1)*L-(kinds.length>1?2:0)),mv=(s.move&&s.move[unit?'@':p.kind])||(s.dir&&s.dir[p.kind]?{a:s.dir[p.kind]}:{}),au=(s.auto&&s.auto[sl]&&s.auto[sl].d)||[0,0,0],byHand=!!((mv.a&&WORLD[mv.a])||(mv.b&&WORLD[mv.b]));
      const dt=s.det&&s.det[sl];let A=mv.a&&WORLD[mv.a]?loc(mv.a):au,B=mv.b&&WORLD[mv.b]?loc(mv.b):(mv.b!=='none'&&dt&&dt.b?dt.b:null),tbA=!(mv.b&&WORLD[mv.b])&&B?dt.tb:0;if(B&&zero(A)){A=B;B=null}if(B&&A.join()===B.join())B=null;
      grow(p.c,p.size);const key=unit?'组件“'+gn+'”':(A_.kinds[p.kind]&&A_.kinds[p.kind].code)||kname(M,p.kind);cnt[key]=unit?1:(cnt[key]||0)+1;M.parts[i].steps.push(id);
      const pt=!unit&&!byHand&&s.path&&s.path[i]&&s.path[i].c?s.path[i]:null;
      if(pt){/* a way found with a corner or a turn: in along C (turned), straighten, home along A */const A1=pt.a||[0,0,0],al=pt.a?pt.al||0:0,hasR=!!pt.th,hasA=al>0,mid=p.c.map((v,x)=>r4(v+A1[x]*al)),from=mid.map((v,x)=>r4(v+pt.c[x]*pt.cl)),w=[.55,hasR?.25:0,hasA?.2:0],W=w[0]+w[1]+w[2],t1=hasR||hasA?Math.round(a+(b-a)*w[0]/W):b,t2=hasR&&hasA?Math.round(a+(b-a)*(w[0]+w[1])/W):b,keys=[a,...from,t1,...mid];
        if(hasR&&hasA)keys.push(t2,...mid);if(hasR||hasA)keys.push(b,...p.c.map(r4));grow(from,p.size);const nd={p:keys,v:a>0?[0,0,a,1]:[0,1]};
        if(hasR){const q=new T3.Quaternion().setFromAxisAngle(new T3.Vector3(...pt.u).normalize(),pt.th*Math.PI/180),Q4=[r4(q.x),r4(q.y),r4(q.z),r4(q.w)];nd.q=[a,...Q4,t1,...Q4,t2,0,0,0,1];if(hasA)nd.q.push(b,0,0,0,1);nd.tilt=1}
        st.nodes[p.node]=nd;st.mats[p.mat]={c:[0,GREEN,Math.min(119,b+6),p.col]};aW.add(new T3.Vector3(...pt.c).applyQuaternion(q1))}
      else if(zero(A)){st.nodes[p.node]=tEnd?{v:[0,0,a,1]}:{v:[0,1]};st.mats[p.mat]={c:[0,GREEN,100,p.col]}}
      else{const ta=travel(pp,A),tb=B?(tbA||push(pp,B)):0,mid=B?p.c.map((v,x)=>r4(v+B[x]*tb)):null,from=(mid||p.c).map((v,x)=>r4(v+A[x]*ta)),m=B?Math.round(a+(b-a)*.62):a,keys=[a,...from];if(B)keys.push(m,...mid);keys.push(b,...p.c.map(r4));grow(from,p.size);
        const nd={p:keys,v:a>0?[0,0,a,1]:[0,1]};if(mv.spin){const ax=new T3.Vector3(...(B||A)).normalize(),qk=[],n=12,q=new T3.Quaternion();for(let j=0;j<=n;j++){q.setFromAxisAngle(ax,-(1-j/n)*Math.PI*4);qk.push(r4(m+(b-m)*j/n),r4(q.x),r4(q.y),r4(q.z),r4(q.w))}nd.q=qk}
        st.nodes[p.node]=nd;st.mats[p.mat]={c:[0,GREEN,Math.min(119,b+6),p.col]};aW.add(new T3.Vector3(...A).applyQuaternion(q1));
        const tight=byHand?(s.man&&s.man[sl]&&s.man[sl].tight):(s.auto&&s.auto[sl]&&s.auto[sl].tight);if(tight){const w='第 '+lab+' 步：'+nm+'装入方向外侧 '+(A_.tool||20)+' 厘米内有别的零件，手或工具可能伸不进去。请确认，或换个方向、调整步骤顺序。';if(!M.warn.includes(w))M.warn.push(w)}
        if(dt&&dt.none&&dt.fine>.3&&mv.b!=='none'&&!(mv.b&&WORLD[mv.b])&&!(s.auto&&s.auto[sl]&&s.auto[sl].blocked)&&!(s.man&&s.man[sl]&&s.man[sl].blocked)){const w='第 '+lab+' 步：'+nm+'进去的途中会擦到别的零件，程序没有找到能绕开的走法。可以换个方向，或者自己分两段。';if(!M.warn.includes(w))M.warn.push(w)}
        if(byHand){if(s.man&&s.man[sl]&&s.man[sl].blocked)M.warn.push('第 '+lab+' 步：按你指定的装法，'+nm+'在路上会穿过别的零件，请换个方向或分两段。')}
        else if(s.auto&&s.auto[sl]&&s.auto[sl].under&&!s.auto[sl].blocked){const w='第 '+lab+' 步：按现在的摆法，'+nm+'只能从正下方装入，手够不着。请换一个摆法（比如把产品立起来），或者调整步骤顺序。';if(!M.warn.includes(w))M.warn.push(w)}
        if(!byHand&&s.auto&&s.auto[sl]&&s.auto[sl].shut){const tried=!unit&&s.path&&s.path[i]&&s.path[i].none,w='第 '+lab+' 步：'+nm+'旁边有空位，但四周被围住，沿直线从外面进不来。'+(tried?'程序试过拐弯和转动，也没有找到从外面进来的路。如果实际上手能把它送到位，可以不管这一条；否则请调整步骤顺序。':'可以点“给进不去的零件找路”，让程序找一条拐弯或转着进去的路；或者调整步骤顺序。');if(!M.warn.includes(w))M.warn.push(w)}
        else if(s.auto&&s.auto[sl]&&s.auto[sl].blocked){const by=(s.auto[sl].by||[]).map(([j])=>{const q=A_.steps.findIndex(x=>x.parts.includes(j));return'“'+kname(M,PA[j].kind)+'”（第 '+LB[q]+' 步）'}).filter((x,k,L)=>L.indexOf(x)===k),w='第 '+lab+' 步：'+nm+'没有找到不被挡住的装入方向'+(by.length?'，挡住它的是'+by.join('、')+'。可以让它排在这些零件之前装，或者把它们编成一个组件':'')+'。';if(!M.warn.includes(w))M.warn.push(w)}}
      placed.add(i)});
    st.parts=Object.entries(cnt);if(box.isEmpty())grow([0,0,0],SZ);
    const tg=box.getCenter(new T3.Vector3()).applyQuaternion(q1).add(new T3.Vector3(0,h1,0)),rad=box.getSize(new T3.Vector3()).length()/2;let v,dist=Math.max(45,rad*2.9);
    if(s.cam&&s.cam.v){v=new T3.Vector3(...s.cam.v).normalize();dist=s.cam.dist||dist}else{if(aW.length()>1e-6)aW.normalize();const ah=new T3.Vector3(aW.x,0,aW.z);if(ah.length()>.35){ah.normalize();v=ah.clone().add(new T3.Vector3(0,.55,0)).add(new T3.Vector3(-ah.z,0,ah.x).multiplyScalar(.7))}else v=new T3.Vector3(.5,aW.y<-.5?.12:.6,1);v.normalize()}
    const pos=tg.clone().addScaledVector(v,dist),cq=new T3.Quaternion().setFromRotationMatrix(new T3.Matrix4().lookAt(pos,tg,new T3.Vector3(0,1,0)));st.cam=[0,r4(pos.x),r4(pos.y),r4(pos.z),r4(cq.x),r4(cq.y),r4(cq.z),r4(cq.w),r4(dist)];
    if(s.fixed&&mine.length>1){M.warn.push('第 '+lab+' 步：这 '+mine.length+' 个零件互相套住或包住，沿直线怎么也拆不开，所以作为一个整体直接放好，没有演示它们之间怎么装。实际装配时它们需要先组成组件，或者要转着装。')}
    if(s.unit&&!mine.length)M.warn.push('第 '+lab+' 步要整体装入的组件“'+gname(A,s.unit)+'”'+(unit?'里还没有零件。请先排它自己的步骤。':'在前面已经装入过了。'));else if(!mine.length&&!turn&&!(s.say||'').trim())M.warn.push('第 '+lab+' 步既没有零件，也没有说明。');out.push(st);prev=pose});
  const un=A.steps.map((s,i)=>s.by==='ai'&&!s.ok?LB[i]:0).filter(Boolean);if(un.length)M.warn.push('有 '+un.length+' 步是 AI 排的，还没有人确认：第 '+un.join('、')+' 步。请逐步对照说明书核对后点“确认这一步”。');
  const left=PA.map((p,i)=>i).filter(i=>!placed.has(i));if(left.length){const c={};left.forEach(i=>{const n=kname(M,PA[i].kind);c[n]=(c[n]||0)+1});M.warn.unshift('还有 '+left.length+' 个零件没有排进任何一步：'+Object.entries(c).map(([n,v])=>n+(v>1?' ×'+v:'')).join('、')+'。')}
  {const gs=[],fit=new Set(CX.map(c=>c.unit).filter(Boolean));CX.forEach(c=>{if(c.grp&&!fit.has(c.grp)&&!gs.includes(c.grp))gs.push(c.grp)});gs.forEach(g=>M.warn.push('组件“'+gname(A,g)+'”还没有装到产品上。请在它的步骤后面加一步，选“把组件整体装入产品”。'))}
  M.steps=out;return M}
/* what is sent to the AI: every part with its number, kind, size and place; the manual goes along as a PDF when there is one */
function aiPrompt(M,hasManual,extra){const A=M.asm,f=v=>(+v).toFixed(1),L=A.parts.map((p,i)=>'#'+i+'　种类 '+p.kind+(A.kinds[p.kind]&&A.kinds[p.kind].name!==p.kind?'（'+A.kinds[p.kind].name+'）':'')+'　尺寸 '+p.size.map(f).join('×')+'　中心 ('+p.c.map(f).join(', ')+')').join('\n');
  return'你在帮一家厂商把一件产品的装配步骤排出来。零件的位置已经有了（取自装好状态的三维文件），你只需要决定：哪些零件在第几步装、这一步产品怎么摆、标题和讲解。\n\n'+
  '产品：'+(M.product||'')+'。整体尺寸 '+A.size.map(f).join('×')+' 厘米。坐标单位厘米，y 向上，原点在产品中心。\n全部零件（编号、种类、长宽高、中心位置）：\n'+L+'\n\n'+
  (hasManual?'附上的 PDF 是这件产品的安装说明书。请严格按说明书的步骤顺序来排，一步对应说明书的一步。\n':'这次没有说明书。请按常理排一个合理的顺序（先大件后小件、先里后外），并在 notes 里说明这是没有说明书时的推测。\n')+
  '规则：\n1. 每个零件编号最多出现一次。说明书里没有出现、你拿不准的零件不要硬排，写进 notes。\n2. title 不超过 14 个字。say 只写说明书图上表达出来的内容；不要编造尺寸、力度、工具型号和安全要求；说明书图上有的警告可以如实转述。\n'+
  '3. pose 表示这一步产品怎么摆（相对三维文件原样）：up 原样；front 让 +x 那一面朝下；back 让 −x 那一面朝下；left 让 −z 那一面朝下；right 让 +z 那一面朝下；over 上下颠倒。拿不准就用 up。\n'+
  '4. move 可以不写。只在说明书明确画出时才写：某种零件 {"b":"U"} 表示先靠上、再从上往下推到位；{"spin":true} 表示拧进去。键是零件的种类。\n5. page 是这一步在说明书里的页码，没有说明书就不写。\n6. kinds 里可以给零件种类起一个描述性的中文名（不是厂家的正式名称），键是种类。\n\n'+
  (extra?'厂商这次的额外要求（在不违反上面规则的前提下尽量满足；和规则冲突时以规则为准，并在 notes 里说明哪一条没有照做）：\n'+extra+'\n\n':'')+
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
root.MAsm={vox,poseShare,findPath,PLANK,INSET,RULES:4,ctx,gname,body,planGroup,blockers,planStart,planRound,planSteps,UNITS,guessUnit,rescale,labels,KEY,parseGLB,base,aiPrompt,aiApply,steps,autoDir,detour,axisOf,pathCheck,parseSay,push,travel,Q,POSES,WORLD,DIRNAME,kname,autoTitle,GREEN};if(typeof module!=='undefined')module.exports=root.MAsm;
})(typeof window!=='undefined'?window:globalThis);
