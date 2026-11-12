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
/* asm: {holes:[{id,p,n,r,used}], boxes:[…]}   part: {holes:[…], boxes:[…]}   -> candidates, best first */
function fit(asm,part,opt){opt=opt||{};const tol=opt.tol||.3,free=asm.holes.filter(h=>!h.used),V=Math.max(1,vol(part.boxes)),thr=Math.max(1,V*.02),seen=new Set(),out=[];
  R24.forEach((R,ri)=>{const H=part.holes.map(h=>({name:h.name,p:mv(R,h.p),n:mv(R,h.n),r:h.r}));H.forEach(h=>{free.forEach(a=>{const dd=dot(h.n,a.n);if(Math.abs(dd)<.98)return;const t=sub(a.p,h.p),key=ri+':'+t.map(v=>Math.round(v*4)).join(',');if(seen.has(key))return;seen.add(key);
      const pairs=[],takenA=new Set();let anti=0,rdiff=0,fresh=0;H.forEach(x=>{const w=add(x.p,t);let best=null,bd=tol;free.forEach(y=>{if(takenA.has(y.id))return;if(Math.abs(dot(x.n,y.n))<.98)return;const d=dist(w,y.p);if(d<bd){bd=d;best=y}});if(best){takenA.add(best.id);pairs.push({a:x.name,b:best.id,p:best.p.slice(),n:best.n.slice()});if(dot(x.n,best.n)<0)anti++;if(best.fresh)fresh++;rdiff+=Math.abs((x.r||0)-(best.r||0))}});
      if(!pairs.length)return;const B=part.boxes.map(b=>boxT(b,R,t)),pn=pen(B,asm.boxes,.12);/* how much surface rests on the assembly: a part lying flat on another is a better fit than one hanging by a hole */
      let area=0;for(const b of B)for(const c of asm.boxes){const d=[0,1,2].map(k=>Math.min(b.max[k],c.max[k])-Math.max(b.min[k],c.min[k]));for(let k=0;k<3;k++){const u=(k+1)%3,v=(k+2)%3;if(Math.abs(d[k])<=.25&&d[u]>.2&&d[v]>.2){area+=d[u]*d[v];break}}}const touch=area>0;
      out.push({R,ri,t,pairs,n:pairs.length,fresh,anti,pen:pn,clash:pn>thr,touch,area,rdiff:rdiff/pairs.length,boxes:B,thr})})})});
  /* the same resulting position reached by another turn of a symmetric part is one way, not several */
  const uniq=new Map();out.forEach(c=>{const k=c.pairs.map(p=>p.b).sort().join('|')+'#'+c.boxes.map(b=>b.min.concat(b.max).map(v=>Math.round(v*2)).join(',')).sort().join(';');const o=uniq.get(k);if(!o||c.ri<o.ri)uniq.set(k,c)});
  const L=[...uniq.values()];const amax=Math.max(1,...L.map(c=>c.area));/* holes of a part that was itself only just put in count a little less than holes of what stood there before */L.forEach(c=>{c.score=-c.fresh*3+c.n*10+(c.touch?3:0)+6*c.area/amax+(c.anti===c.n?1:0)-c.rdiff*4-(c.clash?50+c.pen:c.pen)});L.sort((a,b)=>b.score-a.score||a.ri-b.ri);
  const top=L.slice(0,opt.keep||12);top.forEach(c=>{const ax=c.pairs[0].n,dirs=[ax,[-ax[0],-ax[1],-ax[2]],...AX];c.way=c.clash?null:wayIn(c.boxes,asm.boxes,dirs,c.thr)});return top}
/* free holes that look like one set: same size, same facing — where a number of identical small parts would go */
function sets(asm){const g=new Map();asm.holes.filter(h=>!h.used).forEach(h=>{const k=Math.round((h.r||0)*20)+'|'+h.n.map(v=>Math.round(v)).join(',');if(!g.has(k))g.set(k,[]);g.get(k).push(h)});return[...g.values()]}
const quat=m=>{/* rotation matrix (row-major) to quaternion [x,y,z,w] */const t=m[0]+m[4]+m[8];let x,y,z,w;if(t>0){const s=Math.sqrt(t+1)*2;w=s/4;x=(m[7]-m[5])/s;y=(m[2]-m[6])/s;z=(m[3]-m[1])/s}else if(m[0]>m[4]&&m[0]>m[8]){const s=Math.sqrt(1+m[0]-m[4]-m[8])*2;w=(m[7]-m[5])/s;x=s/4;y=(m[1]+m[3])/s;z=(m[2]+m[6])/s}else if(m[4]>m[8]){const s=Math.sqrt(1+m[4]-m[0]-m[8])*2;w=(m[2]-m[6])/s;x=(m[1]+m[3])/s;y=s/4;z=(m[5]+m[7])/s}else{const s=Math.sqrt(1+m[8]-m[0]-m[4])*2;w=(m[3]-m[1])/s;x=(m[2]+m[6])/s;y=(m[5]+m[7])/s;z=s/4}return[x,y,z,w]};
const turn=(axis,deg)=>{const k=((Math.round(deg/90)%4)+4)%4,c=[1,0,-1,0][k],s=[0,1,0,-1][k];return axis==='x'?[1,0,0,0,c,-s,0,s,c]:axis==='z'?[c,-s,0,s,c,0,0,0,1]:[c,0,s,0,1,0,-s,0,c]};
root.MSolve={R24,fit,sets,pen,boxT,mv,mm,add,sub,dot,dist,quat,turn,vol,wayIn,I:[1,0,0,0,1,0,0,0,1]};if(typeof module!=='undefined')module.exports=root.MSolve;
})(typeof window!=='undefined'?window:globalThis);
