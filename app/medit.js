/* medit.js — edits an "assembly-model" v1 data file directly (no product code, no 3D library).
   Parts made here carry made:1, the step they are fitted in, and the way they come in (approach); their motion is written
   as ordinary keyframes, so mplay.js plays an edited file exactly like a baked one. */
(function(root){
const ease=x=>x*x*(3-2*x),r4=v=>Math.round(v*1e4)/1e4,r7=v=>Math.round(v*1e7)/1e7;
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const b64=a=>{const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);if(typeof Buffer!=='undefined')return Buffer.from(u).toString('base64');let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
function qmix(A,B,f){let bx=B[0],by=B[1],bz=B[2],bw=B[3],d=A[0]*bx+A[1]*by+A[2]*bz+A[3]*bw;if(d<0){d=-d;bx=-bx;by=-by;bz=-bz;bw=-bw}let ka=1-f,kb=f;if(d<.9995){const th=Math.acos(Math.min(1,d)),sn=Math.sin(th);ka=Math.sin((1-f)*th)/sn;kb=Math.sin(f*th)/sn}return[A[0]*ka+bx*kb,A[1]*ka+by*kb,A[2]*ka+bz*kb,A[3]*ka+bw*kb]}
const qaa=(ax,an)=>{const s=Math.sin(an/2);return[ax[0]*s,ax[1]*s,ax[2]*s,Math.cos(an/2)]};
const ME={qmul,qmix,qaa,
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
  /* keys of a move through points [x,y,z,qx,qy,qz,qw], eased over the window win=[from,to] (0..1 of the step) */
  pathKeys(M,pts,win){const N=M.samples,w0=win[0],w1=Math.max(win[1],win[0]+1/N),L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+(Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2])||1e-3));
    const tot=L[L.length-1],U=Math.max(16,12*(pts.length-1)),p=[],q=[];let turn=false;for(let i=1;i<pts.length;i++)for(let k=3;k<7;k++)if(Math.abs(pts[i][k]-pts[0][k])>1e-6)turn=true;
    const at=d=>{let i=1;while(i<pts.length-1&&L[i]<d)i++;const f=Math.min(1,Math.max(0,(d-L[i-1])/(L[i]-L[i-1]))),A=pts[i-1],B=pts[i];return[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f,...qmix(A.slice(3,7),B.slice(3,7),f)]};
    const put=(j,v)=>{if(p.length&&p[p.length-4]===j){p.length-=4;q.length-=5}p.push(j,r4(v[0]),r4(v[1]),r4(v[2]));q.push(j,r7(v[3]),r7(v[4]),r7(v[5]),r7(v[6]))};
    if(pts.length<2){put(0,pts[0]);return{p,q:null}}put(0,pts[0]);for(let k=0;k<=U;k++){const u=k/U;put(Math.round(N*(w0+(w1-w0)*u)),at(ease(u)*tot))}return{p,q:turn?q:null}},
  winOf:(part,stepId)=>(part.path&&part.path[stepId]&&part.path[stepId].win)||part.win||[.15,.8],
  /* write the motion of a made part: hidden before its step, comes in during it (along its approach, or along a recorded path), stays afterwards */
  retrack(M,part){if(part.kind==='tool')return ME.toolTrack(M,part);const nd=M.scenes[part.scene].nodes[part.node],F=nd.x,A=part.approach||[0,0,0],fin=F.slice(0,7);nd.h=1;let seen=false;
    const rec=part.path&&part.path[part.step],pts=rec&&rec.pts.length?[...rec.pts,fin]:(A[0]||A[1]||A[2])?[[F[0]+A[0],F[1]+A[1],F[2]+A[2],F[3],F[4],F[5],F[6]],fin]:[fin];
    M.steps.forEach(s=>{delete s.nodes[part.node];if(s.scene!==part.scene)return;
      if(s.id===part.step){seen=true;const ch={v:[0,1]};if(pts.length>1){const k=ME.pathKeys(M,pts,ME.winOf(part,part.step));ch.p=k.p;if(k.q)ch.q=k.q}s.nodes[part.node]=ch}
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
  shift(M,part,dp,Rl){const nd=M.scenes[part.scene].nodes[part.node],x=nd.x;if(part.tool&&dp)part.tool.at=part.tool.at.map((v,i)=>r4(v+dp[i]));if(dp){x[0]=r4(x[0]+dp[0]);x[1]=r4(x[1]+dp[1]);x[2]=r4(x[2]+dp[2])}if(Rl){const q=qmul(Rl,[x[3],x[4],x[5],x[6]]);x[3]=r7(q[0]);x[4]=r7(q[1]);x[5]=r7(q[2]);x[6]=r7(q[3])}
    M.steps.forEach(s=>{if(s.scene!==part.scene)return;const ch=s.nodes[part.node];if(!ch)return;if(dp&&ch.p)for(let i=0;i<ch.p.length;i+=4){ch.p[i+1]=r4(ch.p[i+1]+dp[0]);ch.p[i+2]=r4(ch.p[i+2]+dp[1]);ch.p[i+3]=r4(ch.p[i+3]+dp[2])}
      if(Rl&&ch.q)for(let i=0;i<ch.q.length;i+=5){const q=qmul(Rl,[ch.q[i+1],ch.q[i+2],ch.q[i+3],ch.q[i+4]]);ch.q[i+1]=r7(q[0]);ch.q[i+2]=r7(q[1]);ch.q[i+3]=r7(q[2]);ch.q[i+4]=r7(q[3])}})},
  /* fix a made part onto another node so that it follows it; x is its pose in that node's frame */
  attach(M,part,parentNode,x){const nd=M.scenes[part.scene].nodes[part.node];if(parentNode>=part.node)return false;nd.p=parentNode;nd.x=x.map((v,i)=>i<3||i>6?r4(v):r7(v));part.on=parentNode;ME.retrack(M,part);return true},
  setStep(M,part,step){if(!part.made||part.step===step)return;if(part.path){delete part.path}ME.bill(M,part.step,part.code,-1);ME.bill(M,step,part.code,1);ME.log(M,'“'+part.name+'”改到 '+ME.label(M,step)+' 安装（原来在 '+ME.label(M,part.step)+'）');part.step=step;ME.retrack(M,part)},
  setCode(M,part,code){code=String(code||'').trim();if((part.code||'')===code)return;const st=ME.stepOf(part);ME.bill(M,st,part.code,-1);ME.bill(M,st,code,1);ME.log(M,'“'+part.name+'”的编号由 '+(part.code||'无')+' 改为 '+(code||'无'));if(code)part.code=code;else delete part.code;const nd=M.scenes[part.scene].nodes[part.node];if(code)nd.code=code;else delete nd.code},
  remove(M,part){const nd=M.scenes[part.scene].nodes[part.node];nd.h=1;M.steps.forEach(s=>{if(s.scene!==part.scene)return;const ch=s.nodes[part.node];if(!ch)return;if(part.made)delete s.nodes[part.node];else{delete ch.v;if(!Object.keys(ch).length)delete s.nodes[part.node]}});
    part.removed=1;const st=ME.stepOf(part);if(part.kind!=='group')ME.bill(M,st,part.code,-1);ME.log(M,'删除零件“'+(part.name||part.code||part.id)+'”'+(part.code&&part.kind!=='group'?'（'+part.code+'，'+ME.label(M,st)+' 的清单减 1）':''))},
  /* a recorded move: the part goes through pts and ends where it is fitted. For a part of the original model the old keys are kept so they can be put back. */
  lastOf(nd,ch){const p=ch&&ch.p?ch.p.slice(-3):nd.x.slice(0,3),q=ch&&ch.q?ch.q.slice(-4):nd.x.slice(3,7);return[...p,...q]},
  setPath(M,part,stepId,pts,win){part.path=part.path||{};if(part.made){part.path={[stepId]:{pts,win:win||ME.winOf(part,stepId)}};ME.retrack(M,part)}
    else{const s=M.steps.find(x=>x.id===stepId),nd=M.scenes[part.scene].nodes[part.node],ch=s.nodes[part.node]||{},old=part.path[stepId];part.orig=part.orig||{};if(!part.orig[stepId])part.orig[stepId]={p:ch.p||null,q:ch.q||null};const fin=old?old.fin:ME.lastOf(nd,ch);win=win||(old&&old.win)||[.15,.8];
      part.path[stepId]={pts,win,fin};const k=ME.pathKeys(M,[...pts,fin],win);ch.p=k.p;if(k.q)ch.q=k.q;else if(part.orig[stepId].q)ch.q=[0,...fin.slice(3,7)];else delete ch.q;s.nodes[part.node]=ch}
    ME.log(M,'给“'+(part.name||part.code||part.id)+'”录制了 '+ME.label(M,stepId)+' 的动作（'+pts.length+' 个点）')},
  clearPath(M,part,stepId){if(!part.path||!part.path[stepId])return;if(part.made){delete part.path;ME.retrack(M,part)}else{const s=M.steps.find(x=>x.id===stepId),ch=s.nodes[part.node]||{},o=part.orig&&part.orig[stepId];if(o){if(o.p)ch.p=o.p;else delete ch.p;if(o.q)ch.q=o.q;else delete ch.q;delete part.orig[stepId]}if(Object.keys(ch).length)s.nodes[part.node]=ch;else delete s.nodes[part.node];delete part.path[stepId]}
    ME.log(M,'“'+(part.name||part.code||part.id)+'”在 '+ME.label(M,stepId)+' 恢复为原来的动作')},
  /* when a part moves within a step: [from,to] as 0..1, and how it is known */
  span(M,part,stepId){const s=M.steps.find(x=>x.id===stepId);if(!s||s.scene!==part.scene||part.removed)return null;const N=M.samples;
    if(part.kind==='tool')return part.step===stepId?{a:part.tool.win[0],b:part.tool.win[1],kind:'tool'}:null;
    if(part.made){if(part.step!==stepId)return null;const ch=s.nodes[part.node];if(!ch||!ch.p)return null;const w=ME.winOf(part,stepId);return{a:w[0],b:w[1],kind:part.path&&part.path[stepId]?'rec':'made'}}
    if(part.path&&part.path[stepId]){const w=part.path[stepId].win;return{a:w[0],b:w[1],kind:'rec'}}
    const ch=s.nodes[part.node];if(!ch)return null;let a=1e9,b=-1;[['p',3,2e-3],['q',4,2e-5]].forEach(([n,d,eps])=>{const f=ch[n];if(!f)return;const w=d+1,m=f.length/w,same=(i,k)=>{for(let c=1;c<=d;c++)if(Math.abs(f[i*w+c]-f[k*w+c])>eps)return false;return true};if(m<2)return;let i=0;while(i+1<m&&same(i,i+1))i++;let k=m-1;while(k>0&&same(k-1,k))k--;if(i>=k)return;a=Math.min(a,f[i*w]);b=Math.max(b,f[k*w])});
    return b<0?null:{a:a/N,b:b/N,kind:'orig'}},
  retime(M,part,stepId,a,b){const N=M.samples;a=Math.max(0,Math.min(a,1-2/N));b=Math.max(a+2/N,Math.min(1,b));const sp=ME.span(M,part,stepId);if(!sp)return false;
    if(sp.kind==='tool'){part.tool.win=[a,b];ME.toolTrack(M,part)}else if(sp.kind==='made'){part.win=[a,b];ME.retrack(M,part)}else if(sp.kind==='rec'){if(part.made){part.path[stepId].win=[a,b];ME.retrack(M,part)}else ME.setPath0(M,part,stepId,[a,b])}
    else{const s=M.steps.find(x=>x.id===stepId),ch=s.nodes[part.node],a0=Math.round(sp.a*N),b0=Math.round(sp.b*N),a1=Math.round(a*N),b1=Math.round(b*N),map=j=>j<=a0?(a0?Math.round(j*a1/a0):a1):j>=b0?(b0<N?Math.round(b1+(j-b0)*(N-b1)/(N-b0)):b1):Math.round(a1+(j-a0)*(b1-a1)/(b0-a0));
      [['p',4],['q',5],['s',4]].forEach(([n,w])=>{const f=ch[n];if(!f)return;const out=[];for(let i=0;i<f.length;i+=w){const j=map(f[i]);if(out.length&&out[out.length-w]>=j)out.length-=w;out.push(j,...f.slice(i+1,i+w))}ch[n]=out})}return true},
  setPath0(M,part,stepId,win){const r=part.path[stepId],s=M.steps.find(x=>x.id===stepId),ch=s.nodes[part.node];r.win=win;const k=ME.pathKeys(M,[...r.pts,r.fin],win);ch.p=k.p;if(k.q)ch.q=k.q},
  /* ---- tools: made of simple shapes, tip at the origin, working towards -y. They are shown only while they work and are not on the parts list. */
  TOOLS:{hammer:{name:'锤子',verb:'敲',n:3,shapes:[['cyl',[1.5,1.5,5,18],0x8a8f93,[0,2.5,0]],['cyl',[.75,.75,22,14],0xc9a46a,[12.5,2.5,0],'z'],['cyl',[.9,.9,8,14],0x3a4246,[20,2.5,0],'z']]},
    phillips:{name:'十字螺丝刀',verb:'拧',n:3,shapes:[['cyl',[.28,.12,1.2,10],0x8a8f93,[0,.6,0]],['cyl',[.28,.28,9,10],0x8a8f93,[0,5.7,0]],['cyl',[1.25,1.1,9,16],0xc8452b,[0,14.7,0]]]},
    flat:{name:'一字螺丝刀',verb:'拧',n:3,shapes:[['box',[.9,1.2,.16],0x8a8f93,[0,.6,0]],['cyl',[.28,.28,9,10],0x8a8f93,[0,5.7,0]],['cyl',[1.25,1.1,9,16],0xd9a520,[0,14.7,0]]]},
    hex:{name:'内六角扳手',verb:'拧',n:2,shapes:[['cyl',[.3,.3,3.2,6],0x3a4246,[0,1.6,0]],['cyl',[.3,.3,9,6],0x3a4246,[4.35,3.2,0],'z']]}},
  DIRS:{down:[0,-1,0],up:[0,1,0],left:[-1,0,0],right:[1,0,0],back:[0,0,-1],front:[0,0,1]},
  dirQuat(d){const dot=-d[1];if(dot>.9999)return[0,0,0,1];if(dot<-.9999)return[1,0,0,0];const ax=[d[2],0,-d[0]],L=Math.hypot(...ax);return qaa(ax.map(v=>v/L),Math.acos(dot))},
  addTool(M,o){const T=ME.TOOLS[o.type],S=M.scenes[o.scene].nodes,n=S.length;S.push({p:-1,t:'G',x:[...o.at.map(r4),0,0,0,1,1,1,1],h:1});
    T.shapes.forEach(([k,a,c,pos,rot])=>{M.geoms.push({k,a});const g=M.geoms.length-1;M.mats.push({k:'MeshLambertMaterial',c,ord:1e6+M.mats.length});const q=rot==='z'?qaa([0,0,1],Math.PI/2):[0,0,0,1],i=S.length;S.push({p:n,t:'M',g,m:M.mats.length-1,x:[...pos,...q.map(r7),1,1,1]});
      M.geoms.push({k:'edges',g,a:25});M.mats.push({k:'LineBasicMaterial',c:0x1b2420,ord:1e6+M.mats.length});S.push({p:i,t:'L',g:M.geoms.length-1,m:M.mats.length-1,x:[0,0,0,0,0,0,1,1,1,1]})});
    const part={id:ME.newId(M),scene:o.scene,node:n,name:T.name,kind:'tool',made:1,step:o.step,steps:[o.step],tool:{type:o.type,at:o.at.map(r4),dir:o.dir||'down',win:o.win||[.45,.9],n:o.n||T.n}};if(o.on)part.tool.on=o.on;
    M.parts.push(part);ME.toolTrack(M,part);ME.log(M,ME.label(M,o.step)+' 加入工具“'+T.name+'”'+(o.onName?'，用在“'+o.onName+'”上':''));return part},
  toolTrack(M,part){const t=part.tool,T=ME.TOOLS[t.type],nd=M.scenes[part.scene].nodes[part.node],N=M.samples,d=ME.DIRS[t.dir]||ME.DIRS.down,q0=ME.dirQuat(d),a=Math.round(t.win[0]*N),b=Math.max(a+2,Math.round(t.win[1]*N)),p=[],q=[];nd.h=1;nd.x=[...t.at,...q0.map(r7),1,1,1];
    const K=t.type==='hammer'?Math.max(8,t.n*8):Math.max(8,t.n*8);for(let k=0;k<=K;k++){const u=k/K,j=Math.round(a+(b-a)*u);if(p.length&&p[p.length-4]===j)continue;
      if(t.type==='hammer'){const h=7*(1-Math.abs(Math.sin(t.n*Math.PI*u)));p.push(j,r4(t.at[0]-d[0]*h),r4(t.at[1]-d[1]*h),r4(t.at[2]-d[2]*h))}
      else{const h=1.5*(1-u),s=qmul(qaa(d,-t.n*2*Math.PI*u),q0);p.push(j,r4(t.at[0]-d[0]*h),r4(t.at[1]-d[1]*h),r4(t.at[2]-d[2]*h));q.push(j,...s.map(r7))}}
    M.steps.forEach(s=>{delete s.nodes[part.node];if(s.scene!==part.scene||s.id!==part.step)return;const v=a>0?[0,0,a,1]:[0,1];if(b<N)v.push(Math.min(N,b+3),0);const ch={v,p};if(q.length)ch.q=q;s.nodes[part.node]=ch});part.steps=[part.step]},
  toolsOf:(M,stepId)=>M.parts.filter(p=>p.kind==='tool'&&!p.removed&&p.step===stepId).map(p=>p.name),
  /* ---- steps: a new step starts as a still picture of the end of the one before it */
  addStep(M,afterId,title){const i=M.steps.findIndex(s=>s.id===afterId),prev=M.steps[i],N=M.samples;let n=1;while(M.steps.some(s=>s.id==='N'+n))n++;const nodes={},mats={};
    Object.entries(prev.nodes).forEach(([k,ch])=>{const o={};if(ch.p)o.p=[0,...ch.p.slice(-3)];if(ch.q)o.q=[0,...ch.q.slice(-4)];if(ch.s)o.s=[0,...ch.s.slice(-3)];if(ch.v)o.v=[0,ch.v[ch.v.length-1]];if(Object.keys(o).length)nodes[k]=o});
    Object.entries(prev.mats).forEach(([k,ch])=>{const o={};['c','e','o','f'].forEach(c=>{if(ch[c])o[c]=[0,ch[c][ch[c].length-1]]});if(Object.keys(o).length)mats[k]=o});
    const c=prev.cam.slice(-9),st={id:'N'+n,title:title||'新增的步骤',label:'新增步骤 '+n,scene:prev.scene,dur:1,parts:[],nodes,mats,cam:[0,...c.slice(1),N,...c.slice(1)],made:1};M.steps.splice(i+1,0,st);
    M.parts.filter(p=>p.made&&!p.removed&&p.scene===st.scene).forEach(p=>ME.retrack(M,p));ME.log(M,'在 '+prev.label+' 后面加了一步“'+st.title+'”（只在数据模型里）');return st},
  removeStep(M,id){const s=M.steps.find(x=>x.id===id);if(!s||!s.made)return'只能删除在工坊里新增的步骤。';if(M.parts.some(p=>p.made&&!p.removed&&p.step===id))return'这一步里还有零件或工具，请先把它们删除或改到别的步骤。';if(M.parts.some(p=>p.path&&p.path[id]))return'这一步里有录制的动作，请先恢复原来的动作。';M.steps.splice(M.steps.indexOf(s),1);ME.log(M,'删除了步骤“'+s.title+'”');return''},
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
