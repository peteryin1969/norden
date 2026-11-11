/* mplay.js — plays an "assembly-model" v1 data file. No product code: everything comes from the data.
   const P=new ModelPlayer(THREE,model); await P.ready; P.pose(stepId,t) -> THREE.Scene; P.camera(stepId,t,cam) */
(function(root){
function ModelPlayer(T3,M){const me=this;me.M=M;me.T3=T3;const N=M.samples,wait=[];
  const dec=(s,C)=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new C(u.buffer)};
  const G=[];const geom=i=>{if(G[i])return G[i];const r=M.geoms[i];let g;
    if(r.k==='box')g=new T3.BoxGeometry(...r.a);else if(r.k==='cyl')g=new T3.CylinderGeometry(...r.a.map(x=>x===null?undefined:x));else if(r.k==='edges')g=new T3.EdgesGeometry(geom(r.g),r.a===null?undefined:r.a);
    else{g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(dec(r.pos,Float32Array),3));if(r.nor)g.setAttribute('normal',new T3.BufferAttribute(dec(r.nor,Float32Array),3));if(r.uv)g.setAttribute('uv',new T3.BufferAttribute(dec(r.uv,Float32Array),2));if(r.idx)g.setIndex(new T3.BufferAttribute(dec(r.idx,r.i32?Uint32Array:Uint16Array),1));if(r.grp)r.grp.forEach(x=>g.addGroup(x[0],x[1],x[2]))}
    return G[i]=g};
  const tex=r=>{const im=new Image(),x=new T3.Texture(im);x.flipY=r.flipY;if(r.rep)x.repeat.set(...r.rep);if(r.off)x.offset.set(...r.off);if(r.rot)x.rotation=r.rot;if(r.ctr)x.center.set(...r.ctr);if(r.wrap){x.wrapS=r.wrap[0];x.wrapT=r.wrap[1]}if(r.f){x.minFilter=r.f[0];x.magFilter=r.f[1]}if(r.an)x.anisotropy=r.an;if(r.enc!=null)x.encoding=r.enc;
    wait.push(new Promise(res=>{im.onload=()=>{x.needsUpdate=true;res()};im.onerror=()=>res();im.src=r.src}));return x};
  const TX=(M.texs||[]).map(tex);
  me.mats=[];M.mats.map((r,i)=>[r.ord===undefined?i:r.ord,i]).sort((a,b)=>a[0]-b[0]).forEach(([o,i])=>{me.mats[i]=mk(M.mats[i])});
  function mk(r){const C=T3[r.k]||T3.MeshLambertMaterial,m=new C();if(r.c!==undefined&&m.color)m.color.setHex(r.c);if(r.e&&m.emissive)m.emissive.setHex(r.e);if(r.o!==undefined)m.opacity=r.o;if(r.tr)m.transparent=true;if(r.sd)m.side=r.sd;if(r.dt===0)m.depthTest=false;if(r.dw===0)m.depthWrite=false;
    if(r.po){m.polygonOffset=true;m.polygonOffsetFactor=r.po[0];m.polygonOffsetUnits=r.po[1]}if(r.fs)m.flatShading=true;if(r.wf)m.wireframe=true;if(r.vc)m.vertexColors=true;if(r.hid)m.visible=false;if(r.tm===0)m.toneMapped=false;if(r.at)m.alphaTest=r.at;if(r.bl!==undefined)m.blending=r.bl;
    if(r.ro!==undefined){m.roughness=r.ro;m.metalness=r.me}if(r.sh!==undefined){m.shininess=r.sh;m.specular.setHex(r.sp)}if(r.sa===0)m.sizeAttenuation=false;if(r.rot&&m.isSpriteMaterial)m.rotation=r.rot;if(r.ds){m.dashSize=r.ds[0];m.gapSize=r.ds[1];m.scale=r.ds[2]}if(r.map!==undefined)m.map=TX[r.map];return m}
  const mat=x=>Array.isArray(x)?x.map(i=>me.mats[i]):me.mats[x];
  me.scenes=M.scenes.map(S=>{const sc=new T3.Scene();if(S.bg!==undefined)sc.background=new T3.Color(S.bg);const objs=[];
    S.nodes.forEach((n,i)=>{let o;
      if(n.t==='M'&&n.inst){o=new T3.InstancedMesh(geom(n.g),mat(n.m),n.cnt);o.instanceMatrix.array.set(dec(n.inst,Float32Array));o.instanceMatrix.needsUpdate=true;if(n.icol){o.instanceColor=new T3.BufferAttribute(dec(n.icol,Float32Array),3)}}else if(n.t==='M')o=new T3.Mesh(geom(n.g),mat(n.m));else if(n.t==='L')o=new T3.LineSegments(geom(n.g),mat(n.m));else if(n.t==='l'){o=new T3.Line(geom(n.g),mat(n.m));if(n.ld)o.computeLineDistances()}else if(n.t==='P')o=new T3.Points(geom(n.g),mat(n.m));
      else if(n.t==='S'){o=new T3.Sprite(mat(n.m));if(n.ctr)o.center.set(...n.ctr)}else if(n.t==='A')o=new T3.AmbientLight(n.c,n.i);
      else if(n.t==='D'){o=new T3.DirectionalLight(n.c,n.i);if(n.sh){o.castShadow=true;o.shadow.mapSize.set(...n.sh.ms);const c=o.shadow.camera;[c.left,c.right,c.top,c.bottom,c.near,c.far]=n.sh.cam;c.updateProjectionMatrix();o.shadow.bias=n.sh.bias;if(n.sh.nb)o.shadow.normalBias=n.sh.nb;o.shadow.radius=n.sh.rad}if(n.tg){o.target.position.set(...n.tg);sc.add(o.target)}}
      else if(n.t==='H')o=new T3.HemisphereLight(n.c,n.c2,n.i);else if(n.t==='Q')o=new T3.PointLight(n.c,n.i,n.d[0],n.d[1]);else o=new T3.Group();
      if(n.n)o.name=n.n;if(n.cs)o.castShadow=true;if(n.rs)o.receiveShadow=true;if(n.ro)o.renderOrder=n.ro;if(n.fc===0)o.frustumCulled=false;o.userData.node=i;if(n.code)o.userData.code=n.code;
      objs.push(o);(n.p<0?sc:objs[n.p]).add(o)});
    S.nodes.forEach((n,i)=>{if(n.tgn!==undefined)objs[i].target=objs[n.tgn]});
    return{sc,objs,nodes:S.nodes,dirty:[]}});
  const rest=(X,i)=>{const o=X.objs[i],x=X.nodes[i].x;o.position.set(x[0],x[1],x[2]);o.quaternion.set(x[3],x[4],x[5],x[6]);o.scale.set(x[7],x[8],x[9]);o.visible=!X.nodes[i].h};
  me.scenes.forEach(X=>X.objs.forEach((o,i)=>rest(X,i)));
  me.steps=M.steps.map(s=>s.id);const byId={};M.steps.forEach(s=>byId[s.id]=s);me.step=id=>byId[id];
  /* key lookup in a flat [i,v..,i,v..] list with d values per key */
  const seg=(f,d,x)=>{const w=d+1,n=f.length/w;let lo=0,hi=n-1;if(x<=f[0])return[0,0,0];if(x>=f[hi*w])return[hi,hi,0];while(hi-lo>1){const m=(lo+hi)>>1;if(f[m*w]<=x)lo=m;else hi=m}const a=f[lo*w],b=f[hi*w];return[lo,hi,(x-a)/(b-a)]};
  const flags=(m,f)=>{const tr=!!(f&1);if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true}m.depthWrite=!!(f&2);m.visible=!!(f&4)};
  function qmix(A,B,f){let bx=B[0],by=B[1],bz=B[2],bw=B[3],d=A[0]*bx+A[1]*by+A[2]*bz+A[3]*bw;if(d<0){d=-d;bx=-bx;by=-by;bz=-bz;bw=-bw}let ka=1-f,kb=f;if(d<.9995){const th=Math.acos(Math.min(1,d)),sn=Math.sin(th);ka=Math.sin((1-f)*th)/sn;kb=Math.sin(f*th)/sn}return[A[0]*ka+bx*kb,A[1]*ka+by*kb,A[2]*ka+bz*kb,A[3]*ka+bw*kb]}
  const qa=new T3.Quaternion(),qb=new T3.Quaternion();let matDirty=[];
  me.pose=(id,t)=>{const s=byId[id];if(!s)return null;const X=me.scenes[s.scene],x=Math.max(0,Math.min(1,t))*N;
    X.dirty.forEach(i=>rest(X,i));X.dirty=[];matDirty.forEach(i=>{const m=me.mats[i],r=M.mats[i];if(m.color&&r.c!==undefined)m.color.setHex(r.c);if(m.emissive)m.emissive.setHex(r.e||0);m.opacity=r.o===undefined?1:r.o;flags(m,(r.tr?1:0)|(r.dw===0?0:2)|(r.hid?0:4))});matDirty=[];
    for(const k in s.nodes){const i=+k,o=X.objs[i],ch=s.nodes[k];X.dirty.push(i);
      if(ch.p){const f=ch.p,[a,b,u]=seg(f,3,x);o.position.set(f[a*4+1]+(f[b*4+1]-f[a*4+1])*u,f[a*4+2]+(f[b*4+2]-f[a*4+2])*u,f[a*4+3]+(f[b*4+3]-f[a*4+3])*u)}
      if(ch.q){const f=ch.q,[a,b,u]=seg(f,4,x);if(u>0){const r=qmix([f[a*5+1],f[a*5+2],f[a*5+3],f[a*5+4]],[f[b*5+1],f[b*5+2],f[b*5+3],f[b*5+4]],u);o.quaternion.set(r[0],r[1],r[2],r[3])}else o.quaternion.set(f[a*5+1],f[a*5+2],f[a*5+3],f[a*5+4])}
      if(ch.s){const f=ch.s,[a,b,u]=seg(f,3,x);o.scale.set(f[a*4+1]+(f[b*4+1]-f[a*4+1])*u,f[a*4+2]+(f[b*4+2]-f[a*4+2])*u,f[a*4+3]+(f[b*4+3]-f[a*4+3])*u)}
      if(ch.v){const f=ch.v;let v=f[1];for(let j=0;j<f.length;j+=2)if(f[j]<=x+1e-6)v=f[j+1];else break;o.visible=!!v}}
    for(const k in s.mats){const i=+k,m=me.mats[i],ch=s.mats[k];matDirty.push(i);const hold=f=>{let v=f[1];for(let j=0;j<f.length;j+=2)if(f[j]<=x+1e-6)v=f[j+1];else break;return v};
      if(ch.c&&m.color)m.color.setHex(hold(ch.c));if(ch.e&&m.emissive)m.emissive.setHex(hold(ch.e));if(ch.o)m.opacity=hold(ch.o);if(ch.f)flags(m,hold(ch.f))}
    X.sc.updateMatrixWorld(true);return X.sc};
  me.camera=(id,t,cam)=>{const s=byId[id];if(!s||!s.cam.length)return null;const f=s.cam,[a,b,u]=seg(f,8,Math.max(0,Math.min(1,t))*N),g=k=>f[a*9+k]+(f[b*9+k]-f[a*9+k])*u;
    const pos=new T3.Vector3(g(1),g(2),g(3));const qr=qmix([f[a*9+4],f[a*9+5],f[a*9+6],f[a*9+7]],[f[b*9+4],f[b*9+5],f[b*9+6],f[b*9+7]],u),q=new T3.Quaternion(qr[0],qr[1],qr[2],qr[3]).normalize(),dist=g(8);
    if(cam){cam.position.copy(pos);cam.quaternion.copy(q)}return{pos,quat:q,dist,target:pos.clone().add(new T3.Vector3(0,0,-1).applyQuaternion(q).multiplyScalar(dist))}};
  me.sceneOf=id=>me.scenes[byId[id].scene].sc;me.node=(sc,i)=>me.scenes[sc].objs[i];
  me.ready=Promise.all(wait).then(()=>me)}
root.ModelPlayer=ModelPlayer;if(typeof module!=='undefined')module.exports=ModelPlayer;
})(typeof window!=='undefined'?window:globalThis);
