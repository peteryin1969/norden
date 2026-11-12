/* medit.js — edits an "assembly-model" v1 data file directly (no product code, no 3D library).
   Parts made here carry made:1, the step they are fitted in, and the way they come in (approach); their motion is written
   as ordinary keyframes, so mplay.js plays an edited file exactly like a baked one. */
(function(root){
const ease=x=>x*x*(3-2*x),r4=v=>Math.round(v*1e4)/1e4,r7=v=>Math.round(v*1e7)/1e7;
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const b64=a=>{const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(typeof Buffer!=='undefined')return Buffer.from(u).toString('base64');let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const ME={qmul,
  part:(M,id)=>M.parts.find(p=>p.id===id),
  live:M=>M.parts.filter(p=>!p.removed),
  stepOf:p=>p.made?p.step:(p.steps||[])[0],
  log(M,text){(M.log=M.log||[]).push({at:new Date().toISOString(),text})},
  /* the parts list of a step follows parts being added and taken away */
  bill(M,stepId,code,d){if(!code||!d)return;const s=M.steps.find(x=>x.id===stepId);if(!s)return;const row=s.parts.find(p=>p[0]===code);if(row){row[1]+=d;if(row[1]<=0)s.parts.splice(s.parts.indexOf(row),1)}else if(d>0)s.parts.push([code,d])},
  billMap(M){const o={};M.steps.forEach(s=>{o[s.id]={};s.parts.forEach(p=>{o[s.id][p[0]]=p[1]})});return o},
  billDiff(before,M){const now=ME.billMap(M),out=[];M.steps.forEach(s=>{const a=before[s.id]||{},b=now[s.id]||{};[...new Set([...Object.keys(a),...Object.keys(b)])].forEach(c=>{if((a[c]||0)!==(b[c]||0))out.push({step:s.id,label:s.label,code:c,from:a[c]||0,to:b[c]||0})})});return out},
  totals(M){const t={};M.steps.forEach(s=>s.parts.forEach(p=>{t[p[0]]=(t[p[0]]||0)+p[1]}));return t},
  newId(M){let n=1;while(M.parts.some(p=>p.id==='u'+n))n++;return'u'+n},
  /* write the motion of a made part: hidden before its step, comes in along its approach during it, stays afterwards */
  retrack(M,part){const nd=M.scenes[part.scene].nodes[part.node],F=nd.x,N=M.samples,A=part.approach||[0,0,0],w0=.15,w1=.8,K=16;nd.h=1;let seen=false;
    M.steps.forEach(s=>{delete s.nodes[part.node];if(s.scene!==part.scene)return;
      if(s.id===part.step){seen=true;const ch={v:[0,1]};if(A[0]||A[1]||A[2]){const p=[0,r4(F[0]+A[0]),r4(F[1]+A[1]),r4(F[2]+A[2])];for(let k=0;k<=K;k++){const j=Math.round(N*(w0+(w1-w0)*k/K)),e=1-ease(k/K);p.push(j,r4(F[0]+A[0]*e),r4(F[1]+A[1]*e),r4(F[2]+A[2]*e))}ch.p=p}s.nodes[part.node]=ch}
      else if(seen)s.nodes[part.node]={v:[0,1]}});part.steps=[part.step]},
  /* a new part from a shape: o={scene,geom,color,name,code,kind,pos,quat?,step,edge?,size?} */
  addPart(M,o){const S=M.scenes[o.scene].nodes;M.geoms.push(o.geom);const g=M.geoms.length-1;M.mats.push({k:'MeshLambertMaterial',c:o.color==null?0xd9c8a5:o.color,ord:1e6+M.mats.length});const m=M.mats.length-1,n=S.length;
    const nd={p:-1,t:'M',g,m,x:[...o.pos.map(r4),...(o.quat||[0,0,0,1]).map(r7),1,1,1],h:1};if(o.code)nd.code=String(o.code);S.push(nd);
    M.geoms.push({k:'edges',g,a:o.edge==null?null:o.edge});M.mats.push({k:'LineBasicMaterial',c:0x1b2420,ord:1e6+M.mats.length});S.push({p:n,t:'L',g:M.geoms.length-1,m:M.mats.length-1,x:[0,0,0,0,0,0,1,1,1,1]});
    const part={id:ME.newId(M),scene:o.scene,node:n,name:o.name||'新零件',kind:o.kind||'mesh',made:1,step:o.step,approach:o.approach||[0,12,0],steps:[o.step]};if(o.code)part.code=String(o.code);if(o.size)part.size=o.size;
    M.parts.push(part);ME.retrack(M,part);ME.bill(M,part.step,part.code,1);ME.log(M,'新增零件“'+part.name+'”'+(part.code?'（'+part.code+'）':'（没有编号，不计入清单）')+'，装在 '+ME.label(M,part.step));return part},
  label:(M,id)=>{const s=M.steps.find(x=>x.id===id);return s?s.label:id},
  board:(l,w,t)=>({k:'box',a:[+l,+t,+w]}),cyl:(d,len)=>({k:'cyl',a:[d/2,d/2,+len,20]}),
  /* take one more of an existing part out of the store: a copy of its node and everything under it.
     poses: for the source root and each descendant, in node order, {x:[10 numbers], vis} as they stand when fitted */
  clone(M,src,poses,rootX,step){const S=M.scenes[src.scene].nodes,ids=[src.node],set=new Set(ids);for(let j=src.node+1;j<S.length;j++)if(set.has(S[j].p)){ids.push(j);set.add(j)}
    const map={},matOf=i=>{M.mats.push(Object.assign({},M.mats[i],{ord:1e6+M.mats.length}));return M.mats.length-1};
    ids.forEach((j,k)=>{const a=S[j],c=Object.assign({},a),po=poses&&poses[k];c.x=(k===0?rootX:(po?po.x:a.x)).slice();c.p=k===0?-1:map[a.p];if(k===0)c.h=1;else{delete c.h;if(po?!po.vis:a.h)c.h=1}if(a.m!==undefined)c.m=Array.isArray(a.m)?a.m.map(matOf):matOf(a.m);delete c.tgn;map[j]=S.length;S.push(c)});
    const part={id:ME.newId(M),scene:src.scene,node:map[src.node],name:src.name||src.code||'零件',kind:src.kind==='group'?'mesh':(src.kind||'copy'),made:1,step,approach:[0,12,0],steps:[step],from:src.id};if(src.code)part.code=src.code;if(src.size)part.size=src.size.slice();
    M.parts.push(part);ME.retrack(M,part);ME.bill(M,step,part.code,1);ME.log(M,'从仓库再取 1 个“'+part.name+'”'+(part.code?'（'+part.code+'）':'')+'，装在 '+ME.label(M,step));return part},
  /* move or turn a part everywhere it appears: dp in its parent's frame, Rl a turn applied in the parent's frame */
  shift(M,part,dp,Rl){const nd=M.scenes[part.scene].nodes[part.node],x=nd.x;if(dp){x[0]=r4(x[0]+dp[0]);x[1]=r4(x[1]+dp[1]);x[2]=r4(x[2]+dp[2])}if(Rl){const q=qmul(Rl,[x[3],x[4],x[5],x[6]]);x[3]=r7(q[0]);x[4]=r7(q[1]);x[5]=r7(q[2]);x[6]=r7(q[3])}
    M.steps.forEach(s=>{if(s.scene!==part.scene)return;const ch=s.nodes[part.node];if(!ch)return;if(dp&&ch.p)for(let i=0;i<ch.p.length;i+=4){ch.p[i+1]=r4(ch.p[i+1]+dp[0]);ch.p[i+2]=r4(ch.p[i+2]+dp[1]);ch.p[i+3]=r4(ch.p[i+3]+dp[2])}
      if(Rl&&ch.q)for(let i=0;i<ch.q.length;i+=5){const q=qmul(Rl,[ch.q[i+1],ch.q[i+2],ch.q[i+3],ch.q[i+4]]);ch.q[i+1]=r7(q[0]);ch.q[i+2]=r7(q[1]);ch.q[i+3]=r7(q[2]);ch.q[i+4]=r7(q[3])}})},
  /* fix a made part onto another node so that it follows it; x is its pose in that node's frame */
  attach(M,part,parentNode,x){const nd=M.scenes[part.scene].nodes[part.node];if(parentNode>=part.node)return false;nd.p=parentNode;nd.x=x.map((v,i)=>i<3||i>6?r4(v):r7(v));part.on=parentNode;ME.retrack(M,part);return true},
  setStep(M,part,step){if(!part.made||part.step===step)return;ME.bill(M,part.step,part.code,-1);ME.bill(M,step,part.code,1);ME.log(M,'“'+part.name+'”改到 '+ME.label(M,step)+' 安装（原来在 '+ME.label(M,part.step)+'）');part.step=step;ME.retrack(M,part)},
  setCode(M,part,code){code=String(code||'').trim();if((part.code||'')===code)return;const st=ME.stepOf(part);ME.bill(M,st,part.code,-1);ME.bill(M,st,code,1);ME.log(M,'“'+part.name+'”的编号由 '+(part.code||'无')+' 改为 '+(code||'无'));if(code)part.code=code;else delete part.code;const nd=M.scenes[part.scene].nodes[part.node];if(code)nd.code=code;else delete nd.code},
  remove(M,part){const nd=M.scenes[part.scene].nodes[part.node];nd.h=1;M.steps.forEach(s=>{if(s.scene!==part.scene)return;const ch=s.nodes[part.node];if(!ch)return;if(part.made)delete s.nodes[part.node];else{delete ch.v;if(!Object.keys(ch).length)delete s.nodes[part.node]}});
    part.removed=1;const st=ME.stepOf(part);if(part.kind!=='group')ME.bill(M,st,part.code,-1);ME.log(M,'删除零件“'+(part.name||part.code||part.id)+'”'+(part.code&&part.kind!=='group'?'（'+part.code+'，'+ME.label(M,st)+' 的清单减 1）':''))},
  /* a board's or cylinder's real size. Holes and neighbouring parts are not moved. */
  sizeOf(M,part){const g=M.geoms[M.scenes[part.scene].nodes[part.node].g];if(!g)return null;if(g.k==='box')return{kind:'board',l:g.a[0],t:g.a[1],w:g.a[2]};if(g.k==='cyl'&&g.a[0]===g.a[1])return{kind:'cyl',d:g.a[0]*2,len:g.a[2]};return null},
  resize(M,part,o){const S=M.scenes[part.scene].nodes,nd=S[part.node],old=nd.g,g=M.geoms[old];if(!g||(g.k!=='box'&&g.k!=='cyl'))return false;const before=ME.sizeOf(M,part),a=g.a.slice();
    if(g.k==='box'){a[0]=+o.l;a[1]=+o.t;a[2]=+o.w}else{a[0]=a[1]=o.d/2;a[2]=+o.len}if(a.slice(0,3).some(v=>!(v>0)))return false;M.geoms.push({k:g.k,a});nd.g=M.geoms.length-1;
    S.forEach(c=>{if(c.p===part.node&&c.t==='L'){const e=M.geoms[c.g];if(e&&e.k==='edges'&&e.g===old){M.geoms.push({k:'edges',g:nd.g,a:e.a});c.g=M.geoms.length-1}}});
    const txt=s=>s.kind==='board'?s.l+'×'+s.w+'×'+s.t:'直径 '+s.d+'、长 '+s.len;ME.log(M,'“'+(part.name||part.code||part.id)+'”的尺寸由 '+txt(before)+' 改为 '+txt(ME.sizeOf(M,part))+' 厘米（孔和相邻零件没有跟着动）');return true},
  /* client model files: triangles in centimetres, centred on the middle of the bottom face */
  parseOBJ(text){const v=[],out=[];text.split(/\r?\n/).forEach(l=>{const p=l.trim().split(/\s+/);if(p[0]==='v')v.push([+p[1],+p[2],+p[3]]);else if(p[0]==='f'){const ix=p.slice(1).map(s=>{const i=parseInt(s.split('/')[0],10);return i<0?v.length+i:i-1});for(let k=1;k<ix.length-1;k++)[ix[0],ix[k],ix[k+1]].forEach(i=>{const q=v[i];if(q)out.push(q[0],q[1],q[2])})}});return new Float32Array(out)},
  parseSTL(buf){const u=new Uint8Array(buf),dv=new DataView(u.buffer,u.byteOffset,u.byteLength),n=u.length>=84?dv.getUint32(80,true):0;if(u.length>=84&&84+n*50===u.length){const out=new Float32Array(n*9);for(let i=0;i<n;i++)for(let k=0;k<9;k++)out[i*9+k]=dv.getFloat32(84+i*50+12+k*4,true);return out}
    const t=(typeof TextDecoder!=='undefined'?new TextDecoder().decode(u):Buffer.from(u).toString()),out=[];t.replace(/vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g,(m,a,b,c)=>{out.push(+a,+b,+c)});return new Float32Array(out)},
  mesh(pos,scale,zUp){const n=pos.length/3,p=new Float32Array(pos.length),nor=new Float32Array(pos.length);let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
    for(let i=0;i<n;i++){let x=pos[i*3]*scale,y=pos[i*3+1]*scale,z=pos[i*3+2]*scale;if(zUp){const t=y;y=z;z=-t}p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z;[x,y,z].forEach((v,k)=>{if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v})}
    const c=[(mn[0]+mx[0])/2,mn[1],(mn[2]+mx[2])/2];for(let i=0;i<n;i++){p[i*3]-=c[0];p[i*3+1]-=c[1];p[i*3+2]-=c[2]}
    for(let i=0;i+2<n;i+=3){const a=i*3,ux=p[a+3]-p[a],uy=p[a+4]-p[a+1],uz=p[a+5]-p[a+2],vx=p[a+6]-p[a],vy=p[a+7]-p[a+1],vz=p[a+8]-p[a+2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const L=Math.hypot(nx,ny,nz)||1;nx/=L;ny/=L;nz/=L;for(let k=0;k<3;k++){nor[a+k*3]=nx;nor[a+k*3+1]=ny;nor[a+k*3+2]=nz}}
    return{geom:{k:'raw',pos:b64(p),nor:b64(nor),n},size:[r4(mx[0]-mn[0]),r4(mx[1]-mn[1]),r4(mx[2]-mn[2])],tris:Math.floor(n/3)}},
  csvParse(t){const rows=[];let row=[],cell='',q=false;t=t.replace(/^﻿/,'');for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}else if(c==='"')q=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x!==''))rows.push(row);row=[]}else cell+=c}row.push(cell);if(row.some(x=>x!==''))rows.push(row);return rows},
  csvText:rows=>rows.map(r=>r.map(c=>/[",\n]/.test(String(c))?'"'+String(c).replace(/"/g,'""')+'"':c).join(',')).join('\n')+'\n'};
root.MEdit=ME;if(typeof module!=='undefined')module.exports=ME;
})(typeof window!=='undefined'?window:globalThis);
