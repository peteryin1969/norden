/* Stage 3 automatic review of one step's animation, for the platform engine (window.__audit(step)). Geometry only: parts present, fasteners land on a hole,
   parts end touching a board, boards stop before fasteners move, labels once each with a number, and the step's parts inside the camera view. */
function audit(s){if(!ready||!cur||cur!==s)return null;const C=typeof CELLS!=='undefined'?CELLS:[],dr=IDS.includes(s),L=dr?parts:CP,st=byId[s]||{parts:[]},R={};
  const codeP=p=>{let c=p.code||codeOf(p.m);if(!c&&p.m.userData.hr&&typeof SCREW!=='undefined')c=SCREW[s]||SCREW[Object.keys(p.keys)[0]];if(!c&&p.m===(FR.chains||[])[0])c='10102070';return c},nm=c=>(C.find(x=>x.code===c)||{name:c}).name;
  const FAST=/螺丝|螺栓|木销|横销|连接件|锁扣|凸轮锁|偏心|塞|膨胀|插销|连接杆|联锁杆/,inList=c=>C.some(x=>x.code===c),walls=[FR.wall,FR.wa,FR.wb].filter(Boolean).map(o=>new T3.Box3().setFromObject(o));
  poseAt(1);const sc=curScene();sc.updateMatrixWorld(true);
  const mv=L.filter(p=>p.keys[s]),codes=new Set(mv.map(codeP).filter(Boolean));
  const miss=(st.parts||[]).map(x=>x[0]).filter(c=>!codes.has(c)&&!L.some(p=>codeP(p)===c&&(()=>{for(let q=p.m;q;q=q.parent)if(!q.visible)return false;return true})()));
  R.parts={ok:!miss.length,note:miss.length?'动画里没有：'+miss.map(nm).join('、'):''};
  const holes=MARKS.filter(h=>h.steps.includes(s)).map(h=>h.d.getWorldPosition(new T3.Vector3()));
  const onWall=o=>{const b=new T3.Box3().setFromObject(o).expandByScalar(.5);return walls.some(w=>w.intersectsBox(b))};
  const fast=mv.filter(p=>{const c=codeP(p);return c&&inList(c)&&FAST.test(nm(c))&&!/钉/.test(nm(c))&&!p.quiet&&!onWall(p.m)});
  const noHole=[];if(fast.length){fast.forEach(p=>{const b=new T3.Box3().setFromObject(p.m).expandByScalar(1.5);if(!holes.some(h=>b.containsPoint(h)))noHole.push(nm(codeP(p)))})}
  const nh=[...new Set(noHole)];R.holes={ok:!nh.length,note:nh.length?'落点附近没有孔：'+nh.map(n=>n+' '+noHole.filter(x=>x===n).length+' 个').join('、'):'',n:fast.length};
  const tools=[FR.ham&&FR.ham.root,FR.ham2,hammer,FR.key,FR.drill,FR.pencil].filter(Boolean),inT=o=>{for(let q=o;q;q=q.parent)if(tools.includes(q))return true;return false};
  const meshes=[];sc.traverseVisible(o=>{if(o.isMesh&&!o.material.isMeshBasicMaterial&&!inT(o))meshes.push(o)});const MB=new Map(meshes.map(o=>[o,new T3.Box3().setFromObject(o)]));
  const fl=[];mv.forEach(p=>{const c=codeP(p);if(!c||!inList(c)||!p.m.visible)return;const own=new Set();p.m.traverse(q=>own.add(q));const b=new T3.Box3().setFromObject(p.m);if(b.isEmpty())return;b.expandByScalar(.6);let hit=false;for(const[o,x]of MB){if(own.has(o)||x.isEmpty())continue;if(x.intersectsBox(b)){hit=true;break}}if(!hit)fl.push(nm(c))});
  const fu=[...new Set(fl)];R.float={ok:!fu.length,note:fu.length?'装好后没贴着板件：'+fu.join('、'):''};
  let pend=0;if(!dr)GS.forEach(G=>{const q=G.seq[s];if(q&&q[1]!==0&&q[0]!==q[1])pend=Math.max(pend,(G.moveAt&&G.moveAt[s])||G.move||1)});
  const early=fast.filter(p=>{const w=p.tap||p.win||[0,1];return w[0]<pend-.05});
  R.order={ok:!early.length,note:early.length?'板件 '+Math.round(pend*100)+'% 才到位，'+[...new Set(early.map(p=>nm(codeP(p))))].join('、')+' 在那之前就开始装，请人工确认是否符合说明书':''};
  const lb=[...document.querySelectorAll('#animLabels .alabel')].filter(d=>d.style.opacity==='1'&&!d.classList.contains('foc')).map(d=>d.textContent),dup=lb.filter((x,i)=>lb.indexOf(x)!==i),unn=lb.filter(x=>!/\d+号/.test(x)&&!/自备|另购|拨片|固定件|墙螺丝|^抽屉$|带警示标签的抽屉/.test(x));
  R.labels={ok:!dup.length&&!unn.length,note:(dup.length?'重复：'+[...new Set(dup)].join('、')+'。':'')+(unn.length?'没有编号：'+unn.join('、'):''),list:lb};
  const objs=(mv.length?mv.map(p=>p.m):dr?parts.map(p=>p.m):GS.filter(G=>G.g.visible).map(G=>G.g)).filter(o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true});
  let inV=0;const v=new T3.Vector3();objs.forEach(o=>{new T3.Box3().setFromObject(o).getCenter(v);v.project(cam);if(v.z<1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1)inV++});
  R.visible={ok:!objs.length||inV>0,note:objs.length&&!inV?'镜头里看不到这一步的零件（'+objs.length+' 个都在画面外）':'',n:objs.length,inView:inV};
  poseAt(Math.min(t,1));return R}
/* Path check: while a part travels to its place it must not pass through anything. Every mesh is taken as its own oriented box (shrunk a little, so touching does not count).
   What the part rests against or goes into at the end (its mates) may overlap it only over the last stretch, as long as the part itself is in the direction of travel; anything else it meets on the way is a collision. */
function obbOf(m,eps){const g=m.geometry;if(!g)return null;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;if(!b||b.isEmpty())return null;const c=b.getCenter(new T3.Vector3()),h=b.getSize(new T3.Vector3()).multiplyScalar(.5),M=m.matrixWorld,ax=[new T3.Vector3(),new T3.Vector3(),new T3.Vector3()];M.extractBasis(ax[0],ax[1],ax[2]);const sc=ax.map(a=>a.length());ax.forEach(a=>a.normalize());
  return{c:c.applyMatrix4(M),ax,h:[Math.max(h.x*sc[0]-eps,.01),Math.max(h.y*sc[1]-eps,.01),Math.max(h.z*sc[2]-eps,.01)]}}
function obbHit(A,B){const d=B.c.clone().sub(A.c),R=[],AR=[];for(let i=0;i<3;i++){R[i]=[];AR[i]=[];for(let j=0;j<3;j++){R[i][j]=A.ax[i].dot(B.ax[j]);AR[i][j]=Math.abs(R[i][j])+1e-6}}const t=[d.dot(A.ax[0]),d.dot(A.ax[1]),d.dot(A.ax[2])];
  for(let i=0;i<3;i++)if(Math.abs(t[i])>A.h[i]+B.h[0]*AR[i][0]+B.h[1]*AR[i][1]+B.h[2]*AR[i][2])return false;
  for(let j=0;j<3;j++)if(Math.abs(t[0]*R[0][j]+t[1]*R[1][j]+t[2]*R[2][j])>A.h[0]*AR[0][j]+A.h[1]*AR[1][j]+A.h[2]*AR[2][j]+B.h[j])return false;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){const i1=(i+1)%3,i2=(i+2)%3,j1=(j+1)%3,j2=(j+2)%3;if(Math.abs(t[i2]*R[i1][j]-t[i1]*R[i2][j])>A.h[i1]*AR[i2][j]+A.h[i2]*AR[i1][j]+B.h[j1]*AR[i][j2]+B.h[j2]*AR[i][j1])return false}return true}
/* how much of box A lies inside box B, measured along B's own axes */
function obbVol(A,B){const d=A.c.clone().sub(B.c);let v=1;for(let j=0;j<3;j++){const hA=A.h[0]*Math.abs(A.ax[0].dot(B.ax[j]))+A.h[1]*Math.abs(A.ax[1].dot(B.ax[j]))+A.h[2]*Math.abs(A.ax[2].dot(B.ax[j])),o=Math.min(hA+B.h[j]-Math.abs(d.dot(B.ax[j])),2*Math.min(hA,B.h[j]));if(o<=0)return 0;v*=o}return v}
const gname=G=>(typeof PANEL!=='undefined'&&PANEL[G.name])||G.label||G.name;
function pathCheck(s,only){if(!ready||!cur||cur!==s||IDS.includes(s))return{ok:true,note:'',hits:[]};const C=typeof CELLS!=='undefined'?CELLS:[],nm=c=>(C.find(x=>x.code===c)||{name:c}).name,sc=curScene(),EPS=.3,N=14;
  const tools=[FR.ham&&FR.ham.root,FR.ham2,typeof hammer!=='undefined'?hammer:null,FR.key,FR.drill,FR.pencil].filter(Boolean),inT=o=>{for(let q=o;q;q=q.parent)if(tools.includes(q))return true;return false},vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
  const movers=[];CP.forEach((p,i)=>{if(p.keys[s]&&!p.key)movers.push({key:'cp'+i,o:p.m,w:p.tap||p.win||[0,1],name:p.lbl||nm(p.code||codeOf(p.m)||'')||'零件'})});GS.forEach(G=>{const q=G.seq[s];if(q&&q[1]!==0&&q[0]!==q[1])movers.push({key:'gs:'+G.name,o:G.g,w:[(G.startAt&&G.startAt[s])||0,(G.moveAt&&G.moveAt[s])||G.move||1],name:gname(G)})});const okd=(typeof OV!=='undefined'&&OV.pathOk&&OV.pathOk[s])||{};
  const own=new Map(movers.map(m=>{const S=new Set();m.o.traverse(q=>S.add(q));return [m,S]})),moving=new Set();own.forEach(S=>S.forEach(q=>moving.add(q)));
  const meshes=()=>{const L=[];sc.traverseVisible(o=>{if(o.isMesh&&o.geometry&&!o.material.isMeshBasicMaterial&&!o.isLineSegments&&!inT(o))L.push(o)});return L};
  const boxes=(L)=>L.map(o=>({o,b:obbOf(o,EPS)})).filter(x=>x.b);
  const centre=m=>new T3.Box3().setFromObject(m.o).getCenter(new T3.Vector3());
  /* the end of each mover's own travel (the whole assembly may go on moving afterwards, so the end of the step is not it): its mates there, its place in its parent's frame, its size */
  const lp=m=>m.o.position.clone(),end=new Map();movers.forEach(m=>{poseAt(Math.min(m.w[1],1));sc.updateMatrixWorld(true);if(!vis(m.o))return;const all=meshes(),mine=all.filter(o=>own.get(m).has(o)),rest=all.filter(o=>!own.get(m).has(o)),mates=new Map();/* touching counts as a mate (boxes grown a little); how deep the part sits in each mate at the end is kept, a part may not go deeper than that on its way */mine.forEach(a=>{const A=obbOf(a,-.4),A0=obbOf(a,EPS);if(!A)return;rest.forEach(r=>{const B=obbOf(r,-.4),B0=obbOf(r,EPS);if(B&&obbHit(A,B))mates.set(r,(mates.get(r)||0)+(A0&&B0?obbVol(A0,B0):0))})});const bb=new T3.Box3().setFromObject(m.o);end.set(m,{mates,p:lp(m),size:bb.getSize(new T3.Vector3())})});
  const hits=[];movers.forEach(m=>{if(only&&!only.includes(m.key))return;if(okd[m.key])return;const E=end.get(m);if(!E)return;const seen=new Map();
    for(let i=0;i<N;i++){const tt=m.w[0]+(Math.min(m.w[1],1)-m.w[0])*(i/N);poseAt(tt);sc.updateMatrixWorld(true);if(!vis(m.o))continue;const rem=lp(m).sub(E.p),r=rem.length();if(r<.2)continue;if(m.o.parent)rem.applyQuaternion(m.o.parent.getWorldQuaternion(new T3.Quaternion()));const dir=rem.clone().normalize(),ext=Math.abs(dir.x)*E.size.x+Math.abs(dir.y)*E.size.y+Math.abs(dir.z)*E.size.z;
      const all=boxes(meshes()),mine=all.filter(x=>own.get(m).has(x.o)),rest=all.filter(x=>!own.get(m).has(x.o)&&!moving.has(x.o));
      rest.forEach(b=>{if(seen.has(b.o))return;let hit=false,vol=0;mine.forEach(a=>{if(obbHit(a.b,b.b)){hit=true;vol+=obbVol(a.b,b.b)}});if(!hit)return;const mate=E.mates.has(b.o);if(mate&&r<=ext+1&&vol<=E.mates.get(b.o)*1.3+.5)return;seen.set(b.o,{t:Math.round(tt*100),mate})})}
    seen.forEach((v,o)=>{let n='';for(let q=o;q&&!n;q=q.parent){const p=CP.find(x=>x.m===q),G=GS.find(x=>x.g===q);if(p)n=p.lbl||nm(p.code||codeOf(p.m)||'')||'零件';else if(G)n=gname(G)}hits.push({key:m.key,part:m.name,with:n||'别的零件',at:v.t,mate:v.mate})})});
  poseAt(Math.min(t,1));const g={};hits.forEach(h=>{const k=h.part+' 穿过 '+h.with;g[k]=g[k]||h});const L=Object.keys(g);return{ok:!L.length,note:L.length?L.slice(0,4).join('；')+(L.length>4?' 等 '+L.length+' 处':''):'',hits,n:movers.length}}
window.__path=(s,only)=>pathCheck(s,only);
window.__audit=s=>{const R=audit(s);if(R){try{R.path=pathCheck(s);delete R.path.hits}catch(e){R.path={ok:true,note:'',error:String(e.message||e)}}}return R};
/* for the platform's model export: the assembled scene and how its parts are named */
window.__model=()=>({scene:sc2,CP,GS,PANEL,codeOf,T3});
