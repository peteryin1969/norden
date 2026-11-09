/* Shared part kit for products built on the cabinet engine: resolve a spoken part name to what is on screen, highlight it,
   number every part once, tap-to-pick, and single-part models for the part card. Product data comes from FK (set by the product build):
   FK.AL aliases {canonical:[spoken...]}, FK.GN group names {name:[FR keys]}, FK.BO big-part number order, FK.extra(s,put) extra targets,
   FK.pickx(M) extra tap targets, FK.guess(text,s) default for a bare 螺丝/螺栓. */
let FOC=null;
const fkAL=FK.AL||{},fkGN=FK.GN||{};
const fkALK=Object.entries(fkAL).flatMap(([k,v])=>[k,...v].map(w=>[w,k])).sort((x,y)=>y[0].length-x[0].length);
const fkVis=o=>{let v=o.visible;o.traverseAncestors(a=>{if(!a.visible)v=false});return v};
const fkBi=(a,b)=>{const A=new Set(),B=new Set();for(let i=0;i<a.length-1;i++)A.add(a.slice(i,i+2));for(let i=0;i<b.length-1;i++)B.add(b.slice(i,i+2));let n=0;A.forEach(x=>{if(B.has(x))n++});return A.size&&B.size?2*n/(A.size+B.size):0};
const fkCN={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10},fkCELL=()=>typeof CELLS!=='undefined'?CELLS:[],fkCS=()=>fkCELL().slice().sort((a,b)=>b.name.length-a.name.length);
const fkCode=(p,s)=>{let c=p.code||codeOf(p.m);if(!c&&p.m.userData.hr&&typeof SCREW!=='undefined')c=SCREW[s]||SCREW[Object.keys(p.keys)[0]];if(!c&&FK.code)c=FK.code(p);return c&&fkCELL().some(x=>x.code===c)?c:null};
const fkAll=()=>[...CIDS,...IDS],fkDr=s=>IDS.includes(s),fkLbl=p=>p.lbl?p.lbl.replace(/（.*$/,''):null;
const fkNum=x=>{if(/^\d+$/.test(x))return +x;if(x.length===2&&x[0]==='十')return 10+fkCN[x[1]];if(x.length>=2&&x[1]==='十')return fkCN[x[0]]*10+(x[2]?fkCN[x[2]]:0);return fkCN[x]};
function canon(raw,s){let n=String(raw||'').replace(/[\s，。、！？“”"'（）()：:]/g,'').replace(/^(那个|这个|那|这|哪个是|哪个)/,'').replace(/(的位置|的地方|的细节|在哪里?|在哪儿)$/,'');
  const g=n.match(/第?(\d+|[一二两三四五六七八九十]{1,3})号?格/);if(g){const c=fkCELL().find(x=>x.n===fkNum(g[1]));if(c)return c.name}
  const code=n.match(/\d{5,}/);if(code){const c=fkCELL().find(x=>x.code===code[0]||x.code.split('/').includes(code[0]));if(c)return c.name}
  for(const c of fkCS())if(n.includes(c.name))return c.name;
  if(s){const T=targets(s,1).map(x=>x.name).sort((a,b)=>b.length-a.length);for(const x of T)if(x.length>1&&n.includes(x))return x}
  for(const[w,k]of fkALK)if(n.includes(w))return k;
  if(FK.guess){const q=FK.guess(n,s);if(q)return q}return n}
/* everything that can be pointed at in step s, with the time window where it moves */
function targets(s,ns){const T=[],put=(name,objs,win)=>{objs=objs.filter(Boolean);if(!name||!objs.length)return;const o=T.find(x=>x.name===name);if(o){o.objs.push(...objs);o.win=[Math.min(o.win[0],win[0]),Math.max(o.win[1],win[1])]}else T.push({name,objs,win:[...win]})};
  const dr=fkDr(s);(dr?parts:CP).forEach(p=>{if(!p.keys[s])return;const code=fkCode(p,s);const c=code&&fkCELL().find(x=>x.code===code),nm=c?c.name:fkLbl(p);if(nm)put(nm,[p.m],p.tap||p.win||[0,1])});
  if(!dr)GS.forEach(G=>{const q=G.seq[s];if(q&&q[1]!==0&&q[0]!==q[1]&&PANEL[G.name])put(PANEL[G.name].replace(/（.*$/,''),[G.g],[(G.startAt&&G.startAt[s])||0,(G.moveAt&&G.moveAt[s])||G.move||1])});
  if(FK.extra)FK.extra(s,put);
  if(s===cur&&!ns){const stat=[];if(dr)parts.forEach(p=>{const nm=fkLbl(p);if(nm&&!p.keys[s])stat.push([nm,p.m])});else GS.forEach(G=>{const nm=PANEL[G.name];if(nm)stat.push([nm.replace(/（.*$/,''),G.g])});stat.forEach(([nm,o])=>{if(!T.some(x=>x.name===nm)&&fkVis(o))put(nm,[o],[0,1])})}
  const h=MARKS.filter(m=>m.steps.includes(s)).map(m=>m.d.parent);if(h.length)put('孔',h,[0,1]);return T}
function names(s){return targets(s||cur).map(x=>x.name)}
function vocab(){if(!cabReady)return null;return [...new Set([...Object.keys(fkAL),...Object.values(fkAL).flat(),...fkCELL().map(c=>c.name),...CIDS.flatMap(s=>names(s))])]}
function fkPick(name,s){const c=canon(name,s),T=targets(s);let t=T.find(x=>x.name===c)||T.find(x=>x.name.includes(c)||c.length>1&&c.includes(x.name));if(!t){let best=0;T.forEach(x=>{const d=fkBi(c,x.name);if(d>best){best=d;t=x}});if(best<.5)t=null}return{t,c}}
/* static things on screen that do not move in this step */
function fkStill(c){const code=(fkCELL().find(x=>x.name===c)||{}).code,L=fkDr(cur)?parts:CP;let o=L.filter(p=>code?fkCode(p,cur)===code:fkLbl(p)&&fkLbl(p).includes(c)).map(p=>p.m);if(!o.length&&fkGN[c])o=fkGN[c].map(n=>FR[n]&&(FR[n].g||FR[n])).filter(Boolean);if(!o.length&&!fkDr(cur))o=GS.filter(G=>(PANEL[G.name]||'').replace(/（.*$/,'')===c).map(G=>G.g);return o}
function where(name){for(const s of fkAll()){if(fkPick(name,s).t)return s}return null}
function fkHl(m,on,k=0){m.traverse(o=>{const M=o.material;if(!o.isMesh||!M||!M.color||M.isMeshBasicMaterial)return;if(on&&!M.userData.hon){M.userData.hb=M.color.getHex();M.userData.he=M.emissive?M.emissive.getHex():0;M.userData.hon=1}
  if(!on){if(M.userData.hon){M.color.setHex(M.userData.hb);if(M.emissive)M.emissive.setHex(M.userData.he);M.userData.hon=0}return}if(M.map){if(M.emissive)M.emissive.setRGB(.55+.3*k,.22+.12*k,0);return}M.color.setRGB(.94+.06*k,.48+.3*k,.13+.25*k)})}
function focus(name,w){unfocus(1);if(!cabReady||!cur)return null;const{t:tg,c}=fkPick(name,cur);let L=tg?tg.objs:fkStill(c),note=null;if(!L.length)return null;
  const ok=a=>Array.isArray(a)&&a.length===2&&a.every(x=>isFinite(+x)),norm=a=>[clamp(+a[0]),clamp(Math.max(+a[0]+.05,+a[1]))];let w0=ok(w)?norm(w):tg?norm(tg.win):null;
  const at=x=>{poseAt(x);return L.filter(fkVis)};let objs=at(w0?w0[1]:Math.min(t,1));if(!objs.length&&tg){w0=norm(tg.win);objs=at(w0[1]);note='这个零件在动画 '+Math.round(w0[0]*100)+'% 到 '+Math.round(w0[1]*100)+'% 才出现，已跳到那一段'}
  if(!objs.length&&w0){objs=at(w0[0]);if(objs.length)w0=null}
  if(!objs.length){poseAt(Math.min(t,1));return null}const box=new T3.Box3(),cen=o=>new T3.Box3().setFromObject(o).getCenter(new T3.Vector3()),c0=cen(objs[0]),sz=new T3.Box3().setFromObject(objs[0]).getSize(new T3.Vector3()).length();const cl=objs.filter(o=>cen(o).distanceTo(c0)<Math.max(14,sz*.6));cl.forEach(o=>box.expandByObject(o));if(w0){poseAt(w0[0]);cl.forEach(o=>{if(fkVis(o))box.expandByObject(o)});poseAt(w0[1])}
  const ct=box.getCenter(new T3.Vector3()),r=Math.max(box.getSize(new T3.Vector3()).length()/2,1.2),vt=Math.tan(cam.fov*PI/360)*Math.min(1,cam.aspect),label=tg?tg.name:c,cell=fkCELL().find(x=>x.name===label);
  FOC={objs,w:w0,ct,D:Math.max(r/vt*1.35,9),d:viewDir(),n:0,name:label,stop:false,box:[],sc:curScene()};if(window._resetView)window._resetView();
  if(w0){t=w0[0];playing=true;const p=document.getElementById('animPlay');if(p)p.textContent='暂停'}else poseAt(Math.min(t,1));
  FOC.box=objs.slice(0,10).map(o=>{const b=new T3.BoxHelper(o,HOT);b.material.depthTest=false;b.renderOrder=9;FOC.sc.add(b);return b});
  const d=document.createElement('div');d.className='alabel foc';d.textContent=((window.PARTNO&&PARTNO.of(label))?PARTNO.of(label)+'号 ':cell?cell.n+'号 ':'')+label;d.style.cssText='background:#f07a22;color:#fff;border-color:#f07a22;font-weight:600';document.getElementById('animLabels').append(d);const ln=document.createElementNS('http://www.w3.org/2000/svg','line');ln.setAttribute('stroke','#f07a22');ln.setAttribute('stroke-width','2.5');document.getElementById('animLines').append(ln);FOC.lbl={obj:objs[0],win:[-1,2],d,line:ln,text:d.textContent,dir:false};LBL.push(FOC.lbl);
  const bn=document.createElement('div');bn.id='focBanner';bn.textContent='已标出：'+label;bn.style.cssText='position:absolute;left:50%;top:8px;transform:translateX(-50%);background:#f07a22;color:#fff;padding:4px 12px;border-radius:14px;font:600 14px system-ui,sans-serif;z-index:6;pointer-events:none;white-space:nowrap';const av=document.getElementById('animView');if(getComputedStyle(av).position==='static')av.style.position='relative';av.append(bn);FOC.bn=bn;
  focPulse();return{part:label,count:objs.length,window:w0,note}}
function focPulse(){if(!FOC)return;const k=.5+.5*Math.sin(performance.now()/170);FOC.objs.forEach(o=>fkHl(o,true,k));(FOC.box||[]).forEach(b=>{b.update();b.material.color.setRGB(.94,.48+.35*k,.13+.4*k)})}
function showable(text,s){const n=String(text||''),S=s||cur;let best=null;for(const c of fkCS())if(n.includes(c.name)&&(fkPick(c.name,S).t||where(c.name))){best=c.name;break}
  if(!best)for(const[w,k]of fkALK)if(n.includes(w)){if(fkPick(k,S).t||where(k)){best=k;break}}
  if(!best){const T=targets(S);for(const x of T)if(n.includes(x.name)){best=x.name;break}}
  if(!best&&/螺栓|螺丝|螺钉/.test(n)){const q=canon(n.match(/螺栓|螺丝|螺钉/)[0],S);if(q&&(fkPick(q,S).t||where(q)))best=q}
  if(!best){const g=n.match(/第?(\d+|[一二两三四五六七八九十]{1,3})号?格/);if(g)best=canon(g[0],S)}return best}
function focLoop(){if(!FOC||!FOC.w||!playing)return;if(t>FOC.w[1]+.08){if(++FOC.n>=3){t=Math.min(FOC.w[1],.97);playing=false;FOC.stop=true;const p=document.getElementById('animPlay');if(p)p.textContent='播放'}else t=FOC.w[0]}}
function focCam(){const th=Math.atan2(FOC.d.x,FOC.d.z)+az,ph=clamp(Math.asin(FOC.d.y)+el,-.3,1.35),v=new T3.Vector3(Math.sin(th)*Math.cos(ph),Math.sin(ph),Math.cos(th)*Math.cos(ph)).multiplyScalar(FOC.D).add(FOC.ct);if(!FOC.cp){FOC.cp=camPos.clone();FOC.ctg=camTgt.clone()}FOC.cp.lerp(v,.2);FOC.ctg.lerp(FOC.ct,.2);camPos.copy(FOC.cp);camTgt.copy(FOC.ctg);cam.position.copy(camPos);cam.lookAt(camTgt)}
function unfocus(quiet){if(!FOC)return;const f=FOC;FOC=null;f.objs.forEach(o=>fkHl(o,false));(f.box||[]).forEach(b=>{f.sc.remove(b);b.geometry.dispose()});if(f.bn)f.bn.remove();if(f.lbl){f.lbl.d.remove();f.lbl.line.remove();LBL=LBL.filter(x=>x!==f.lbl)}if(f.stop&&!quiet){playing=true;const p=document.getElementById('animPlay');if(p)p.textContent='暂停'}if(!quiet)computeFit()}
/* single-part models for the part card: a clean copy of the part as built in the scene, hole marks left out */
window.PART3D=(()=>{const allP=()=>[...CP,...parts],marks=()=>new Set(MARKS.map(h=>h.d.parent));
  function cl(o,skip){const c=o.clone(false);if(c.isMesh&&c.material){c.material=Array.isArray(c.material)?c.material.map(m=>m.clone()):c.material.clone();if(c.material.color&&c.material.color.getHex&&c.material.color.getHex()===HOT)c.material.color.setHex(HOLE);if(c.material.emissive)c.material.emissive.setHex(0);if(c.material.userData)c.material.userData.hon=0;if(o.userData.b!=null&&c.material.color&&!c.material.map)c.material.color.setHex(o.userData.b)}c.visible=true;o.children.forEach(k=>{if(skip.has(k))return;if(k.isSprite)return;c.add(cl(k,skip))});return c}
  function root(o,skip){const g=new T3.Group(),c=cl(o,skip);c.position.set(0,0,0);c.quaternion.copy(o.quaternion);c.scale.copy(o.scale);g.add(c);const b=new T3.Box3().setFromObject(g),m=b.getCenter(new T3.Vector3());c.position.sub(m);return g}
  const findHw=code=>{for(const p of allP()){if(fkCode(p)===code)return p.m}return null};
  function bigList(){const L=[];GS.forEach(G=>{const n=PANEL[G.name];if(n&&!L.includes(n.replace(/（.*$/,'')))L.push(n.replace(/（.*$/,''))});allP().forEach(p=>{const n=fkLbl(p);if(n&&!fkCode(p)&&!/自备|另购|螺丝|螺栓/.test(p.lbl)&&!L.includes(n))L.push(n)});return L}
  function bigFind(name){const gs=GS.filter(G=>(PANEL[G.name]||'').replace(/（.*$/,'')===name);if(gs.length)return{o:gs[0].g,n:gs.length};const cp=allP().filter(p=>fkLbl(p)===name);if(cp.length)return{o:cp[0].m,n:cp.length};return null}
  function makeBig(name){const f=bigFind(name);if(!f)return null;const sk=new Set([...allP().map(p=>p.m),...marks()]);sk.delete(f.o);return root(f.o,sk)}
  return{bigList,bigFind:n=>{const f=bigFind(n);return f&&{n:f.n,step:where(n)}},makeBig,has:c=>!!(cabReady&&findHw(c)),make:c=>{const o=findHw(c);if(!o)return null;return root(o,marks())}}})();
/* one part number for everything: hardware keeps its cell number, large parts continue after it in order of first use */
window.PARTNO=(()=>{let M=null;const build=()=>{if(M||!cabReady)return M;M={};const C=fkCELL();C.forEach(c=>{M[c.name]=c.n});let n=C.reduce((a,c)=>Math.max(a,+c.n||0),0);const BO=FK.BO||[],all=fkAll(),fs=x=>{for(let i=0;i<all.length;i++)if(targets(all[i],1).some(t=>t.name===x))return i;return 999},L=PART3D.bigList().map((x,i)=>({x,i,s:BO.includes(x)?BO.indexOf(x)/1000:1+fs(x)})).sort((a,b)=>a.s-b.s||a.i-b.i);L.forEach(o=>{if(!M[o.x])M[o.x]=++n});return M};
  return{of:name=>{const m=build();return m?m[name]||null:null},name:n=>{const m=build();if(!m)return null;for(const k in m)if(m[k]===+n)return k;return null},all:()=>build()}})();
/* tap or click a part on screen: small parts within a finger's reach win over the panel behind them */
window.PARTPICK=e=>{if(!cabReady||!cam||!cur)return null;const v=document.getElementById('animView'),r=v.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,C=fkCELL(),M=new Map(),dr=fkDr(cur),vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
  (dr?parts:CP).forEach(p=>{const code=fkCode(p,cur);const c=code&&C.find(x=>x.code===code),nm=c?c.name:fkLbl(p);if(nm)M.set(p.m,{nm,small:!!c&&!!p.keys[cur]})});if(!dr)GS.forEach(G=>{if(PANEL[G.name])M.set(G.g,{nm:PANEL[G.name].replace(/（.*$/,'')})});if(FK.pickx)FK.pickx(M,dr);
  let best=null,bd=24;const w=new T3.Vector3();M.forEach((x,o)=>{if(!x.small||!vis(o))return;o.getWorldPosition(w);w.project(cam);if(w.z>1)return;const d=Math.hypot((w.x+1)/2*r.width-px,(1-w.y)/2*r.height-py);if(d<bd){bd=d;best=x.nm}});if(best)return best;
  const ray=new T3.Raycaster();ray.setFromCamera(new T3.Vector2(px/r.width*2-1,-py/r.height*2+1),cam);const list=[];curScene().traverseVisible(o=>{if(o.isMesh)list.push(o)});
  for(const h of ray.intersectObjects(list,false))for(let o=h.object;o;o=o.parent){const x=M.get(o);if(x)return x.nm}return null};
