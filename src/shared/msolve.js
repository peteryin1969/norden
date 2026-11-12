/* msolve.js — finds the ways a part can be fitted onto what is already assembled, from holes and outer shapes only.
   Parts are given in their design orientation: holes [{name,p,n,r}] and boxes [{min,max}] (centimetres).
   A way of fitting = one of the 24 right-angle turns of the part + a shift that brings one of its holes onto a free hole of the
   assembly, axis on axis. It is scored by how many holes then coincide, and checked for overlap with the assembly both in
   place and on the way in. Nothing here knows the product: no step numbers, no names. */
(function(root){
const R24=(()=>{const out=[],P=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];P.forEach(p=>{for(let s=0;s<8;s++){const sg=[s&1?-1:1,s&2?-1:1,s&4?-1:1],m=[0,0,0,0,0,0,0,0,0];for(let r=0;r<3;r++)m[r*3+p[r]]=sg[r];const det=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);if(det===1)out.push(m)}});out.sort((a,b)=>(b[0]+b[4]+b[8])-(a[0]+a[4]+a[8]));return out})();
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const mm=(a,b)=>{const o=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)o.push(a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c]);return o};
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function boxT(b,m,t){const c=[];for(let i=0;i<8;i++)c.push(add(mv(m,[i&1?b.max[0]:b.min[0],i&2?b.max[1]:b.min[1],i&4?b.max[2]:b.min[2]]),t));const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];c.forEach(p=>{for(let k=0;k<3;k++){if(p[k]<mn[k])mn[k]=p[k];if(p[k]>mx[k])mx[k]=p[k]}});return{min:mn,max:mx}}
function overlap(a,b,eps){let v=1;for(let k=0;k<3;k++){const d=Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])-eps;if(d<=0)return 0;v*=d}return v}
function pen(A,B,eps){let v=0;for(const a of A)for(const b of B)v+=overlap(a,b,eps);return v}
const vol=B=>B.reduce((s,b)=>s+(b.max[0]-b.min[0])*(b.max[1]-b.min[1])*(b.max[2]-b.min[2]),0);
/* is there a straight way in: back the part out along d and see that it never cuts into the assembly */
function wayIn(boxes,asmBoxes,dirs,thr){for(const d of dirs){let ok=true;for(let k=1;k<=40&&ok;k++){const s=k*.5,B=boxes.map(b=>({min:add(b.min,[d[0]*s,d[1]*s,d[2]*s]),max:add(b.max,[d[0]*s,d[1]*s,d[2]*s])}));if(pen(B,asmBoxes,.12)>thr)ok=false}if(ok)return d}return null}
const AX=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const union=B=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];B.forEach(b=>{for(let k=0;k<3;k++){if(b.min[k]<mn[k])mn[k]=b.min[k];if(b.max[k]>mx[k])mx[k]=b.max[k]}});return{min:mn,max:mx}};
/* what the outer shape says about a position: how much surface rests on the assembly, whether the part sits exactly between
   two others (its size equals the gap), and how many of its edges run flush with the parts it touches */
function shape(B,boxes){const U=union(B);let area=0,flush=0;const lo=[false,false,false],hi=[false,false,false],on=new Set(),fl=new Set();
  for(const c of boxes){for(const b of B){const d=[0,1,2].map(k=>Math.min(b.max[k],c.max[k])-Math.max(b.min[k],c.min[k]));for(let k=0;k<3;k++){const u=(k+1)%3,v=(k+2)%3;if(Math.abs(d[k])<=.25&&d[u]>.2&&d[v]>.2){area+=d[u]*d[v];on.add(c.inst);if(Math.abs(b.min[k]-c.max[k])<=.25&&Math.abs(b.min[k]-U.min[k])<=.25)lo[k]=true;if(Math.abs(b.max[k]-c.min[k])<=.25&&Math.abs(b.max[k]-U.max[k])<=.25)hi[k]=true;
          [u,v].forEach(w=>{if(Math.abs(U.min[w]-c.min[w])<=.15)fl.add(w+'-'+Math.round(c.min[w]*5));if(Math.abs(U.max[w]-c.max[w])<=.15)fl.add(w+'+'+Math.round(c.max[w]*5))});break}}}}
  flush=Math.min(4,fl.size);const between=[0,1,2].filter(k=>lo[k]&&hi[k]);return{area,flush,between,on:[...on],U}}
/* a slot is a narrow groove marked on a part: box (its outline on the surface) and n (pointing out of the surface) */
const slotAx=sl=>{const N=[0,1,2].reduce((a,k)=>Math.abs(sl.n[k])>Math.abs(sl.n[a])?k:a,0),o=[0,1,2].filter(k=>k!==N),e=o.map(k=>sl.max[k]-sl.min[k]),L=e[0]>=e[1]?o[0]:o[1],W=e[0]>=e[1]?o[1]:o[0];return{N,L,W,w:sl.max[W]-sl.min[W],len:sl.max[L]-sl.min[L],sg:sl.n[N]>0?1:-1,c:[0,1,2].map(k=>(sl.min[k]+sl.max[k])/2),plane:sl.n[N]>0?sl.max[N]:sl.min[N]}};
function inSlots(U,slots){const got=[];(slots||[]).forEach(sl=>{const a=slotAx(sl),t=U.max[a.W]-U.min[a.W];if(t>a.w+.12)return;if(Math.abs((U.min[a.W]+U.max[a.W])/2-a.c[a.W])>.25)return;const face=a.sg>0?U.min[a.N]:U.max[a.N],ins=(a.plane-face)*a.sg;if(ins<-.15||ins>.6)return;const lap=Math.min(U.max[a.L],sl.max[a.L])-Math.max(U.min[a.L],sl.min[a.L]);if(lap<.5*Math.min(a.len,U.max[a.L]-U.min[a.L]))return;got.push(sl)});return got}
/* asm: {holes:[{id,p,n,r,used,fresh}], boxes:[{min,max,inst}], slots:[{min,max,n,inst}]}   part: {holes, boxes}   -> candidates, best first */
function fit(asm,part,opt){opt=opt||{};const tol=opt.tol||.3,free=asm.holes.filter(h=>!h.used),V=Math.max(1,vol(part.boxes)),thr=Math.max(1,V*.02),seen=new Set(),out=[],slots=asm.slots||[];
  const AC=asm.boxes.length?(()=>{const u=union(asm.boxes);return[0,1,2].map(k=>(u.min[k]+u.max[k])/2)})():[0,0,0],twins=opt.twins||[],MC=opt.centre||AC;
  const judge=(R,ri,t,pairs,x)=>{const B=part.boxes.map(b=>boxT(b,R,t)),U=union(B),sl=inSlots(U,slots),own=new Set(sl.map(s=>s.inst)),solid=own.size?asm.boxes.filter(b=>!own.has(b.inst)):asm.boxes,pn=pen(B,solid,.12),sh=shape(B,asm.boxes);
    /* the part's own grooves should open towards the rest of the assembly, not away from it */
    let inw=0;(part.slots||[]).forEach(q=>{const w=boxT(q,R,t),n=mv(R,q.n),c=[0,1,2].map(k=>(w.min[k]+w.max[k])/2);inw+=dot(n,sub(AC,c))>0?1:-1});
    /* a second piece of the same part belongs where the first one is mirrored */
    let mir=false;twins.forEach(T=>{for(let k=0;k<3&&!mir;k++){const mn=T.min.slice(),mx=T.max.slice();mn[k]=2*MC[k]-T.max[k];mx[k]=2*MC[k]-T.min[k];if(Math.abs(mn[k]-T.min[k])<.5)continue;if([0,1,2].every(j=>Math.abs(U.min[j]-mn[j])<.35&&Math.abs(U.max[j]-mx[j])<.35))mir=true}});
    out.push(Object.assign({R,ri,t,pairs,n:pairs.length,inw,mir,pen:pn,clash:pn>thr,touch:sh.area>0||sl.length>0,area:sh.area,flush:sh.flush,between:sh.between,on:sh.on,slots:sl.length,slotOn:[...own],slotL:sl.length?slotAx(sl[0]).L:-1,boxes:B,thr,solid},x))};
  /* 1. by holes: every right-angle turn, every hole of the part on every free hole of the assembly, axis on axis */
  /* a screw goes through one part into the next, so two holes belong together when they lie on one axis; along that axis the
     part sits where its face meets the assembly (or hole on hole, when both are drilled in the meeting faces) */
  R24.forEach((R,ri)=>{const H=part.holes.map(h=>({name:h.name,p:mv(R,h.p),n:mv(R,h.n),r:h.r})),PB=part.boxes.map(b=>boxT(b,R,[0,0,0]));H.forEach(h=>{free.forEach(a=>{const dd=dot(h.n,a.n);if(Math.abs(dd)<.98)return;const t0=sub(a.p,h.p),k=[0,1,2].reduce((m,x)=>Math.abs(a.n[x])>Math.abs(a.n[m])?x:m,0),u=(k+1)%3,v=(k+2)%3,offs=new Set([0]);
      PB.forEach(b=>asm.boxes.forEach(c=>{if(Math.min(b.max[u]+t0[u],c.max[u])-Math.max(b.min[u]+t0[u],c.min[u])<.2||Math.min(b.max[v]+t0[v],c.max[v])-Math.max(b.min[v]+t0[v],c.min[v])<.2)return;[c.max[k]-(b.min[k]+t0[k]),c.min[k]-(b.max[k]+t0[k])].forEach(d=>{if(Math.abs(d)<=6&&Math.abs(d)>.05)offs.add(Math.round(d*20)/20)})}));
      offs.forEach(d=>{const t=t0.slice();t[k]+=d;const key=ri+':'+t.map(x=>Math.round(x*4)).join(',');if(seen.has(key))return;seen.add(key);
        const pairs=[],takenA=new Set();let anti=0,rdiff=0,fresh=0,thru=0;H.forEach(x=>{const w=add(x.p,t);let best=null,bd=tol;free.forEach(y=>{if(takenA.has(y.id))return;if(Math.abs(dot(x.n,y.n))<.98)return;const df=sub(w,y.p),al=dot(df,y.n),lat=Math.hypot(df[0]-al*y.n[0],df[1]-al*y.n[1],df[2]-al*y.n[2]);if(Math.abs(al)>6.5)return;if(lat<bd){bd=lat;best=y;best._al=al}});if(best){takenA.add(best.id);pairs.push({a:x.name,b:best.id,p:best.p.slice(),n:best.n.slice()});if(dot(x.n,best.n)<0)anti++;if(Math.abs(best._al)>.3)thru++;if(best.fresh)fresh++;rdiff+=Math.abs((x.r||0)-(best.r||0))}});
        if(pairs.length)judge(R,ri,t,pairs,{anti,fresh,thru,rdiff:rdiff/pairs.length,by:'hole'})})})})});
  const strong=out.some(c=>c.n>=2&&!c.clash);
  /* 2. by shape, when holes do not settle it: into a groove, or face on face with edges flush or centred */
  if(!strong&&asm.boxes.length){const P0=union(part.boxes);R24.forEach((R,ri)=>{const U0=boxT(P0,R,[0,0,0]),c0=[0,1,2].map(k=>(U0.min[k]+U0.max[k])/2),h0=[0,1,2].map(k=>(U0.max[k]-U0.min[k])/2),tried=new Set(),go=(ct,by)=>{const t=sub(ct,c0),key=t.map(v=>Math.round(v*4)).join(',');if(tried.has(key))return;tried.add(key);judge(R,ri,t,[],{anti:0,fresh:0,rdiff:0,by})};
      slots.forEach((sl,si)=>{const a=slotAx(sl);if(h0[a.W]*2>a.w+.12)return;const ct=[0,0,0];ct[a.W]=a.c[a.W];ct[a.L]=a.c[a.L];
        /* a groove facing this one on another part: the board sits between the two, pushed equally into both */
        let pair=null;slots.forEach((s2,j)=>{if(j===si||s2.inst===sl.inst)return;const b=Object.assign(slotAx(s2),{inst:s2.inst});if(b.N!==a.N||b.W!==a.W||b.sg===a.sg)return;if(Math.abs(b.c[a.W]-a.c[a.W])>.25||Math.abs(b.c[a.L]-a.c[a.L])>1)return;const gap=Math.abs(b.plane-a.plane),ex=h0[a.N]*2-gap;if(ex<-.3||ex>1.2)return;pair=b});
        if(pair)ct[a.N]=(a.plane+pair.plane)/2;else ct[a.N]=a.plane+a.sg*(h0[a.N]-.3);go(ct.slice(),'slot');
        /* pushed along the groove until its end meets whatever closes the groove */
        asm.boxes.forEach(c=>{if(c.inst===sl.inst||(pair&&c.inst===pair.inst))return;if(c.max[a.N]<ct[a.N]-h0[a.N]+.2||c.min[a.N]>ct[a.N]+h0[a.N]-.2||c.max[a.W]<ct[a.W]-h0[a.W]+.05||c.min[a.W]>ct[a.W]+h0[a.W]-.05)return;const x=ct.slice();x[a.L]=c.max[a.L]+h0[a.L];go(x,'slot');const y=ct.slice();y[a.L]=c.min[a.L]-h0[a.L];go(y,'slot')})});
      asm.boxes.forEach(c=>{for(let k=0;k<3;k++)for(const sg of[1,-1]){const u=(k+1)%3,v=(k+2)%3,al=w=>[c.min[w]+h0[w],(c.min[w]+c.max[w])/2,c.max[w]-h0[w]];al(u).forEach(pu=>al(v).forEach(pv=>{const ct=[0,0,0];ct[k]=sg>0?c.max[k]+h0[k]:c.min[k]-h0[k];ct[u]=pu;ct[v]=pv;go(ct,'face')}))}})})}
  /* the same resulting position reached by another turn of a symmetric part is one way, not several */
  const uniq=new Map();out.forEach(c=>{const k=c.pairs.map(p=>p.b).sort().join('|')+'#'+c.boxes.map(b=>b.min.concat(b.max).map(v=>Math.round(v*2)).join(',')).sort().join(';');const o=uniq.get(k);if(!o||c.ri<o.ri)uniq.set(k,c)});
  const L=[...uniq.values()].filter(c=>c.touch||c.n);const amax=Math.max(1,...L.map(c=>c.area));
  /* holes of a part that was itself only just put in count a little less than holes of what stood there before */
  /* holes that meet face to face are a stronger sign than holes that merely share an axis */L.forEach(c=>{c.score=-(c.thru||0)*2.5+c.inw*4+(c.mir?8:0)+c.n*10-c.fresh*3+c.slots*15+c.between.length*8+c.flush*1.5+(c.touch?3:0)+6*c.area/amax+(c.n&&c.anti===c.n?1:0)-c.rdiff*4-(c.clash?50+c.pen:c.pen)});L.sort((a,b)=>b.score-a.score||a.ri-b.ri);
  const top=L.slice(0,opt.keep||12);top.forEach(c=>{const ax=c.pairs.length?c.pairs[0].n:[0,1,0],sd=[0,0,0];if(c.slotL>=0)sd[c.slotL]=1;/* a board in a groove slides in along the groove */const dirs=(c.slotL>=0?[sd,sd.map(v=>-v)]:[]).concat([ax,[-ax[0],-ax[1],-ax[2]],...AX]);c.way=c.clash?null:wayIn(c.boxes,c.solid,dirs,c.thr);delete c.solid});return top}
/* free holes that look like one set: same size, same facing — where a number of identical small parts would go */
function sets(asm){const g=new Map();asm.holes.filter(h=>!h.used).forEach(h=>{const k=Math.round((h.r||0)*20)+'|'+h.n.map(v=>Math.round(v)).join(',');if(!g.has(k))g.set(k,[]);g.get(k).push(h)});return[...g.values()]}
const quat=m=>{/* rotation matrix (row-major) to quaternion [x,y,z,w] */const t=m[0]+m[4]+m[8];let x,y,z,w;if(t>0){const s=Math.sqrt(t+1)*2;w=s/4;x=(m[7]-m[5])/s;y=(m[2]-m[6])/s;z=(m[3]-m[1])/s}else if(m[0]>m[4]&&m[0]>m[8]){const s=Math.sqrt(1+m[0]-m[4]-m[8])*2;w=(m[7]-m[5])/s;x=s/4;y=(m[1]+m[3])/s;z=(m[2]+m[6])/s}else if(m[4]>m[8]){const s=Math.sqrt(1+m[4]-m[0]-m[8])*2;w=(m[2]-m[6])/s;x=(m[1]+m[3])/s;y=s/4;z=(m[5]+m[7])/s}else{const s=Math.sqrt(1+m[8]-m[0]-m[4])*2;w=(m[3]-m[1])/s;x=(m[2]+m[6])/s;y=(m[5]+m[7])/s;z=s/4}return[x,y,z,w]};
const turn=(axis,deg)=>{const k=((Math.round(deg/90)%4)+4)%4,c=[1,0,-1,0][k],s=[0,1,0,-1][k];return axis==='x'?[1,0,0,0,c,-s,0,s,c]:axis==='z'?[c,-s,0,s,c,0,0,0,1]:[c,0,s,0,1,0,-s,0,c]};
root.MSolve={R24,fit,sets,shape,union,inSlots,slotAx,pen,boxT,mv,mm,add,sub,dot,dist,quat,turn,vol,wayIn,I:[1,0,0,0,1,0,0,0,1]};if(typeof module!=='undefined')module.exports=root.MSolve;
})(typeof window!=='undefined'?window:globalThis);
