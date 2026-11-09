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
  const noHole=[];if(fast.length){fast.forEach(p=>{const b=new T3.Box3().setFromObject(p.m).expandByScalar(.9);if(!holes.some(h=>b.containsPoint(h)))noHole.push(nm(codeP(p)))})}
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
window.__audit=s=>audit(s);
