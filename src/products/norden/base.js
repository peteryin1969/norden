/* Drawer animation, steps 35-44. Proportions are estimates: the manual gives no panel sizes. */
const Anim=(()=>{
const DUR={'21':1.5,'33':2.4,'45':2.6};
const IDS=['35','36','37','38','39','40','41','42','43','44'];
const W=76,H=14,D=46,T=1.6;
let T3,ren,scene,cam,root,inner,parts=[],hammer,table,cab,ready=false,failed=false,loading=null,cur=null,t=0,playing=true,speed=1,last=0,raf=0,az=0,el=0,camPos=null,camTgt=null;
const lerp=(a,b,k)=>a+(b-a)*k,ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const CAMS={def:[[62,78,-144],[0,-2,-10]],'43':[[-70,82,-135],[0,-4,0]],'44':[[130,74,190],[34,-2,-22]]};
/* Detailed part models. Each is built along +Y with its working end (head or slot) at the top, then pointed along axis*sign. */
const GC={};const geo=(k,f)=>GC[k]||(GC[k]=f());
const DARK=0x20282a,STEEL=0xa9b2b6,ZINC=0xc8ccc8,PLAST=0xf1f1ea,WOODP=0xd9b77e;
const pm=(g,c)=>new T3.Mesh(g,new T3.MeshPhongMaterial({color:c,shininess:60}));
const cg=(r1,r2,h,n=16)=>geo(`c${r1}_${r2}_${h}_${n}`,()=>new T3.CylinderGeometry(r1,r2,h,n));
const bg=(a,b,c)=>geo(`b${a}_${b}_${c}`,()=>new T3.BoxGeometry(a,b,c));
function at(m,x,y,z){m.position.set(x,y,z);return m}
function helix(r,len,turns,tube){return geo(`h${r}_${len}_${turns}`,()=>{const P=[],N=turns*10;for(let i=0;i<=N;i++){const a=i/10*Math.PI*2;P.push(new T3.Vector3(Math.cos(a)*r,-i/N*len,Math.sin(a)*r))}return new T3.TubeGeometry(new T3.CatmullRomCurve3(P),N,tube,5)})}
const tag=(o,r)=>{o.userData.hr=r;return o};
function point(inner,axis,sign){const o=new T3.Group();o.add(inner);if(axis==='x')inner.rotation.z=-sign*Math.PI/2;else if(axis==='z')inner.rotation.x=sign*Math.PI/2;else if(sign<0)inner.rotation.x=Math.PI;return o}
function cross(g,r,y){g.add(at(pm(bg(r*1.5,r*.25,r*.3),DARK),0,y,0),at(pm(bg(r*.3,r*.25,r*1.5),DARK),0,y,0))}
function screw(axis='y',sign=1,o={}){const{r=.34,len=2.4,c=0x4a5256,wide=false,nohole=false,pan=false,flat=false}=o,g=new T3.Group(),hr=pan?r*2.6:wide?r*2.5:r*1.9,hh=r*.75;
  if(pan){g.add(at(pm(cg(hr,hr,hh*.45,20),c),0,len/2+hh*.22,0),at(pm(cg(hr*.7,hr*.92,hh*.55,20),c),0,len/2+hh*.72,0))}else g.add(at(pm(cg(hr,r*1.05,hh),c),0,len/2+hh/2,0));cross(g,(pan?hr*.6:hr)*.75,len/2+hh);g.add(pm(cg(r*.8,r*.8,len),c));
  g.add(at(pm(helix(r*1.1,len*.92,Math.round(len/(r*.55)),r*.17),c),0,len/2,0));if(flat)g.add(at(pm(cg(r*.8,r*.62,r*.3,10),c),0,-len/2-r*.15,0));else g.add(at(pm(cg(r*.8,.02,r*1.3,10),c),0,-len/2-r*.6,0));return tag(point(g,axis,sign),nohole?0:.42)}
function conn(axis='y',sign=1){const g=new T3.Group();g.add(at(pm(cg(.62,.5,.5),STEEL),0,2.9,0));cross(g,.5,3.17);g.add(at(pm(cg(.42,.42,.6),STEEL),0,2.35,0),at(pm(cg(.72,.72,2.3,6),ZINC),0,.95,0),at(pm(cg(.85,.85,.28),ZINC),0,-.35,0),at(pm(cg(.45,.45,2.2),STEEL),0,-1.6,0),at(pm(helix(.58,2,5,.13),STEEL),0,-.55,0));return tag(point(g,axis,sign),.62)}
function dowel(axis='y',sign=1,r=.45,l=3.2){const g=new T3.Group();g.add(pm(cg(r,r,l,10),WOODP),at(pm(cg(r*.72,r,.35,10),WOODP),0,l/2+.17,0),at(pm(cg(r,r*.72,.35,10),WOODP),0,-l/2-.17,0));for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.add(at(pm(bg(.05,l,.05),0x9a7747),Math.cos(a)*r*.98,0,Math.sin(a)*r*.98))}return tag(point(g,axis,sign),.52)}
function lock(axis='y',sign=1,kind='a'){const g=new T3.Group(),big=kind==='b',r=big?1.15:.95,h=big?1.5:1.15,c=big?ZINC:STEEL;g.add(pm(cg(r,r,h,22),c));
  if(big){cross(g,r*.72,h/2+.01);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;g.add(at(pm(bg(.22,h*.75,.32),DARK),Math.cos(a)*r*.98,0,Math.sin(a)*r*.98))}}
  else{const sl=pm(bg(r*1.45,.1,.22),DARK);sl.rotation.y=.5;g.add(at(sl,0,h/2+.01,0));g.add(at(pm(bg(r*.7,.32,.2),DARK),r*.55,-h*.28,r*.72));if(kind==='a')g.add(at(pm(bg(.2,.34,.7),DARK),r*.96,.05,0));for(let i=0;i<7;i++)g.add(at(pm(bg(.14,.16,.14),DARK),Math.cos(i*.3-1)*r*.97,-h/2+.1,Math.sin(i*.3-1)*r*.97))}return tag(point(g,axis,sign),r*1.08)}
function pin145(axis='y',sign=1){const g=new T3.Group();g.add(at(pm(cg(.76,.76,.32,20),PLAST),0,3.2,0),at(pm(cg(.62,.42,4.6,8),PLAST),0,.7,0),at(pm(cg(.42,.42,.5),DARK),0,-1.7,0),at(pm(cg(.62,.62,.7),STEEL),0,-2.3,0));for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;g.add(at(pm(bg(.1,3.7,.1),DARK),Math.cos(a)*.5,1,Math.sin(a)*.5))}return tag(point(g,axis,sign),.72)}
function rail(len,axis='z',flip=1){const g=new T3.Group(),plate=pm(bg(.25,1.8,len),STEEL);g.add(plate,at(pm(bg(.95,.22,len),STEEL),.48*flip,.8,0),at(pm(bg(.95,.22,len*.9),STEEL),.48*flip,-.8,0));
  const w=pm(cg(.92,.92,.5,22),0x2a2f31);w.rotation.z=Math.PI/2;g.add(at(w,.42*flip,0,len/2-.6));const hub=pm(cg(.3,.3,.56,12),ZINC);hub.rotation.z=Math.PI/2;g.add(at(hub,.42*flip,0,len/2-.6));
  g.add(at(pm(bg(.25,1.8,1.4),ZINC),0,0,-len/2-.7),at(pm(bg(.7,.45,.35),ZINC),.3*flip,.7,-len/2-1.3));
  let o=g;if(axis==='y'){o=new T3.Group();g.rotation.x=-Math.PI/2;o.add(g)}o.userData.plate=plate;return o}
function lever(){const s=new T3.Shape();s.moveTo(-1.2,-1.8);s.lineTo(.3,-1.8);s.lineTo(.3,-.2);s.lineTo(.8,-.2);s.lineTo(.8,-1.8);s.lineTo(1.3,-1.8);s.lineTo(1.3,.9);s.quadraticCurveTo(.4,2,-.8,1.6);s.quadraticCurveTo(-1.5,1.1,-1.2,.2);s.closePath();const m=pm(geo('lev',()=>new T3.ExtrudeGeometry(s,{depth:.35,bevelEnabled:false})),GREY);m.rotation.y=Math.PI/2;const o=new T3.Group();o.add(m);return o}
function bracket(){const g=new T3.Group();g.add(at(pm(bg(2.4,.35,2.4),ZINC),0,.18,0),at(pm(bg(2.4,2.4,.35),ZINC),0,1.5,-1.03));const t=pm(cg(1.2,1.2,.35,20),ZINC);t.rotation.x=Math.PI/2;g.add(at(t,0,2.7,-1.03));const a=pm(cg(.5,.5,.42,14),DARK);g.add(at(a,0,.18,0));const b=pm(cg(.5,.5,.42,14),DARK);b.rotation.x=Math.PI/2;g.add(at(b,0,2.5,-1.03));return g}
function plug151(axis,sign){const g=new T3.Group();g.add(at(pm(cg(.95,.95,.25,18),PLAST),0,.9,0),pm(cg(.45,.3,1.7,8),PLAST));cross(g,.5,1.04);[-.4,0,.4].forEach(y=>g.add(at(pm(cg(.55,.42,.2,10),PLAST),0,y-.1,0)));return tag(point(g,axis,sign),.5)}
function clip(axis,sign){const g=new T3.Group();const c=pm(cg(1.05,1.05,.3,20,),PLAST);g.add(at(c,0,.75,0),pm(bg(1.5,1.2,.9),PLAST),at(pm(bg(1,.8,.4),DARK),0,-.1,.3));return tag(point(g,axis,sign),.8)}
function spacer(){const g=new T3.Group();[-1.05,0,1.05].forEach(x=>{g.add(at(pm(bg(.95,3.2,2),PLAST),x,0,0),at(pm(bg(.55,2.2,.12),DARK),x,0,1.02),at(pm(bg(.55,2.2,.12),DARK),x,0,-1.02))});const h=pm(cg(.7,.7,2.1,14),STEEL);h.rotation.x=Math.PI/2;g.add(h);return g}
function coverL(){const s=new T3.Shape();s.moveTo(0,0);s.lineTo(1.4,0);s.lineTo(1.4,4);s.lineTo(4.4,4);s.lineTo(4.4,5.4);s.lineTo(0,5.4);s.closePath();const m=pm(geo('cvL',()=>new T3.ExtrudeGeometry(s,{depth:.7,bevelEnabled:true,bevelSize:.14,bevelThickness:.14,bevelSegments:2})),PLAST);m.scale.set(.55,.55,1);m.position.set(-1.2,-1.5,-.3);const o=new T3.Group();o.add(m);return o}

const hd=(r,h)=>geo(`hd${r}_${h}`,()=>new T3.CylinderGeometry(r,r,h,20,1,false,0,Math.PI));
function plug708(axis,sign){const g=new T3.Group();g.add(at(pm(cg(1,1,.24,20),PLAST),0,1.1,0));cross(g,.55,1.24);[0,1,2,3].forEach(i=>{const a=i*Math.PI/2+.5,l=pm(bg(.24,2.1,.3),PLAST);l.rotation.z=Math.cos(a)*.1;l.rotation.x=-Math.sin(a)*.1;g.add(at(l,Math.cos(a)*.33,0,Math.sin(a)*.33));[-.6,-.1,.4].forEach(y=>g.add(at(pm(bg(.2,.16,.34),PLAST),Math.cos(a)*.5,y,Math.sin(a)*.5)))});return tag(point(g,axis,sign),.55)}
function pin707(axis,sign){const g=new T3.Group();g.add(at(pm(cg(1.15,1.15,.2,22),PLAST),0,1.6,0),at(pm(cg(.38,.26,3,10),PLAST),0,0,0),at(pm(bg(.08,1.6,.82),DARK),0,-.4,0),at(pm(cg(.12,.12,.8,8),DARK),.12,-.95,0));return point(g,axis,sign)}
function clipB(axis,sign){const g=new T3.Group();const d=pm(hd(1.1,.32),PLAST);d.rotation.y=Math.PI/2;g.add(at(d,0,1,0),at(pm(bg(1.6,1.5,.16),PLAST),0,0,.55),at(pm(bg(.16,1.5,1.1),PLAST),.72,0,0),at(pm(bg(.16,1.5,1.1),PLAST),-.72,0,0),at(pm(bg(1.8,.2,1.2),PLAST),0,-.8,0));for(let i=0;i<6;i++)g.add(at(pm(bg(.1,.26,.2),DARK),-.9+i*.1,.7-i*.26,-.55));return tag(point(g,axis,sign),.85)}
function clipC(axis,sign){const g=new T3.Group();const d=pm(hd(1.1,.32),PLAST);d.rotation.y=Math.PI/2;g.add(at(d,0,1.05,0),at(pm(cg(.5,.32,1.7,4),PLAST),0,0,0));g.add(at(pm(bg(.06,1.6,.3),DARK),.22,0,.1),at(pm(bg(.06,1.6,.3),DARK),-.22,0,.1));return point(g,axis,sign)}
function peg(){const g=new T3.Group();const c=pm(cg(.3,.3,1,10),GREY);g.add(c,at(pm(cg(.36,.36,.14,10),GREY),0,-.2,0));return g}
function coverL(){const s=new T3.Shape();s.moveTo(0,0);s.lineTo(1.2,0);s.quadraticCurveTo(1.5,0,1.5,.3);s.lineTo(1.5,3.2);s.lineTo(4.2,3.2);s.quadraticCurveTo(4.6,3.2,4.6,3.6);s.lineTo(4.6,4.5);s.lineTo(.5,4.5);s.quadraticCurveTo(0,4.5,0,4);s.closePath();const m=pm(geo('cvL2',()=>new T3.ExtrudeGeometry(s,{depth:.7,bevelEnabled:true,bevelSize:.15,bevelThickness:.15,bevelSegments:3})),PLAST);m.scale.set(.6,.6,1);const o=new T3.Group();o.add(m);const a=peg(),b=peg();a.rotation.x=-Math.PI/2;b.rotation.x=-Math.PI/2;o.add(at(a,.45,.4,-.45),at(b,2.3,2.3,-.45));o.children[0].position.set(0,0,0);const w=new T3.Group();o.position.set(-1.2,-1.4,0);w.add(o);return w}
function coverS(l){const s=new T3.Shape(),r=.75,w=1.5;s.moveTo(0,0);s.lineTo(l-r,0);s.absarc(l-r,r,r,-Math.PI/2,Math.PI/2);s.lineTo(r,w);s.absarc(r,r,r,Math.PI/2,Math.PI*1.5);const m=pm(geo('cvS'+l,()=>new T3.ExtrudeGeometry(s,{depth:.8,bevelEnabled:true,bevelSize:.14,bevelThickness:.14,bevelSegments:3})),PLAST);m.rotation.y=-Math.PI/2;m.rotation.x=Math.PI/2;const g=new T3.Group();m.position.set(.8,0,l/2);m.rotation.set(Math.PI/2,0,-Math.PI/2);g.add(m);[-l*.25,l*.25].forEach(z=>{const p=peg();p.rotation.x=0;g.add(at(p,0,1,z))});return g}
function plugW(axis,sign){const g=new T3.Group();g.add(at(pm(cg(1.3,1.3,.3,20),PLAST),0,2.2,0));[0,1].forEach(i=>{const a=pm(bg(.34,4,.9),PLAST);a.position.x=i?.45:-.45;a.rotation.z=i?-.06:.06;g.add(a);[-1.2,-.3,.6].forEach(y=>g.add(at(pm(bg(.2,.3,.95),PLAST),i?.72:-.72,y,0)))});g.add(at(pm(cg(.5,.5,.1,14),DARK),0,2.36,0));return point(g,axis,sign)}
function fix(){const g=new T3.Group(),s=new T3.Shape();s.moveTo(-1.8,-1.2);s.lineTo(1.2,-1.8);s.lineTo(1.8,-1.8);s.lineTo(1.8,1.8);s.lineTo(1.2,1.8);s.lineTo(-1.8,1.2);s.closePath();const m=pm(geo('fx',()=>new T3.ExtrudeGeometry(s,{depth:.25,bevelEnabled:false})),STEEL);g.add(m);const sl=pm(bg(.7,2,.3),DARK);g.add(at(sl,-.2,0,.05));[-1,1].forEach(a=>{const b=pm(cg(.3,.3,1,10),ZINC);g.add(at(b,1.9,a*1.3,.1))});return g}
function hole(r,axis,dark=DARK){const m=new T3.Mesh(cg(r,r,.12,14),mat(dark));if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m}
function tint(m,on){m.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&!o.material.isMeshBasicMaterial){if(o.material.map){o.material.emissive.setHex(on?0x23835c:0);return}if(o.userData.b==null)o.userData.b=o.material.color.getHex();const c=o.userData.b,lum=((c>>16&255)+(c>>8&255)+(c&255))/3;o.material.color.setHex(on&&lum>90?ACC:c)}})}
const HOLE=0x1d2426,HOT=0xf07a22;let MARKS=[];
function drill(target,pLocal,nLocal,r,steps){const g=new T3.Group();const d=new T3.Mesh(new T3.CircleGeometry(r,20),new T3.MeshBasicMaterial({color:HOLE}));d.rotation.x=-Math.PI/2;
  const rim=new T3.Mesh(new T3.RingGeometry(r,r*1.3,28),new T3.MeshBasicMaterial({color:0x8b928d,side:T3.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.y=.01;g.add(d,rim);
  g.position.copy(pLocal).add(nLocal.clone().multiplyScalar(.05));g.quaternion.setFromUnitVectors(new T3.Vector3(0,1,0),nLocal);target.add(g);MARKS.push({d,rim,steps})}
const RAD=o=>{let r=0;o.traverse(q=>{if(q.userData.hr)r=q.userData.hr});return r};
function autoHoles(list,sceneObj,bodyOf,firstKey){sceneObj.updateMatrixWorld(true);const ray=new T3.Raycaster();
  list.forEach(p=>{const r=p.m.userData.hr;if(!r)return;const body=bodyOf(p);if(!body)return;const k=firstKey(p);if(!k)return;const off=k[1][0];const o=new T3.Vector3(off[0],off[1],off[2]);if(o.lengthSq()<1)return;
    const par=p.m.parent,start=new T3.Vector3(...p.pos).add(o);par.localToWorld(start);const dirW=new T3.Vector3(-off[0],-off[1],-off[2]).normalize().transformDirection(par.matrixWorld);
    ray.set(start,dirW);const hit=ray.intersectObject(body,false)[0];if(!hit)return;const nW=hit.face.normal.clone().transformDirection(body.matrixWorld);
    const inv=new T3.Matrix4().copy(body.matrixWorld).invert();const pL=hit.point.clone().applyMatrix4(inv),nL=nW.clone().transformDirection(inv).normalize();drill(body,pL,nL,r,[k[0]])})}
function mark(step){MARKS.forEach(h=>{const on=h.steps.includes(step);h.d.material.color.setHex(HOLE);h.rim.material.color.setHex(on?HOT:0x8b928d)})}
function holes(obj,list){list.forEach(([x,y,z,r,a])=>obj.add(at(hole(r,a),x,y,z)))}

const wc=(fn,c)=>(...a)=>{const o=fn(...a);o.userData.code=typeof c==='function'?c(...a):c;return o};
conn=wc(conn,'118331');dowel=wc(dowel,'101345');pin145=wc(pin145,'145718');rail=wc(rail,'10102042');lever=wc(lever,'联锁拨片');bracket=wc(bracket,'102553');plug708=wc(plug708,'151708');pin707=wc(pin707,'151707');clipB=wc(clipB,'10093081');clipC=wc(clipC,'10093082');coverL=wc(coverL,'10101849');coverS=wc(coverS,'158568');plugW=wc(plugW,'10087223');fix=wc(fix,'防倾倒固定件');lock=wc(lock,(x,y,k)=>k==='c'?'120076':k==='b'?'110126':'119252/119250');
const SCREW={'1':'146114','43':'146114','7':'151931','8':'151931','17':'105248','18':'105248','32':'109572','34':'109572'};
const PANEL={sideA:'外侧板',sideB:'外侧板',mid:'中隔板',botA:'底板',botB:'底板',pA:'脚线',pB:'脚线',back:'背板',top:'顶板'};
let LBL=[],showLbl=true;try{showLbl=localStorage.getItem('stork-labels')!=='off'}catch(e){}
function codeOf(o){let c=null;o.traverse(q=>{if(!c&&q.userData.code)c=q.userData.code});return c}
function labelText(code){const id=cur,cell=typeof CELLS!=='undefined'&&CELLS.find(x=>x.code===code);if(!cell)return code;const n=need(id).find(x=>x[0]===code);return cell.n+'号 '+cell.name+(n?' × '+n[1]:'')}
const pno=n=>{const k=window.PARTNO&&PARTNO.of(n);return k?k+'号 ':''},wvis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};
const PAIR={sideA:'sideB',sideB:'sideA',botA:'botB',botB:'botA',pA:'pB',pB:'pA'};let CENTER=null;
function buildLabels(){const box0=document.getElementById('animLabels');box0.replaceChildren();LBL=[];const seen=new Set(),grpL={};
  const put=(obj,text,win,o={})=>{const key=o.key||text;if(!text||seen.has(key))return;seen.add(key);const d=document.createElement('div');d.className='alabel';d.textContent=text;box0.append(d);const line=document.createElementNS('http://www.w3.org/2000/svg','line');document.getElementById('animLines').append(line);LBL.push({obj,win,d,line,text,dir:o.dir||false,pair:o.pair||null,sep:o.sep||'',anchor:o.anchor||null})};
  document.getElementById('animLines').replaceChildren();const dr=IDS.includes(cur);
  (dr?parts:CP).forEach(p=>{const k=p.keys[cur];if(!k)return;let code=p.code||codeOf(p.m);if(!code&&p.m.userData.hr)code=SCREW[cur];if(!code&&p.m===(FR.chains||[])[0])code='10102070';let txt=code?labelText(code):p.lbl?pno(p.lbl.replace(/（.*$/,''))+p.lbl:null;if(!txt||!(code||k[0].join()!==k[1].join()))return;const W0=p.win||[0,1];p.win=undefined;const pw=[W0[0],2];
    p.win=W0;if(p.tag)put(p.m,txt.replace(/ × \d+$/,'')+' '+p.tag+' × 3',pw,{key:txt+p.tag});
    else if(p.pairM)put(p.m,code?txt.replace(/ × \d+$/,' × 1'):txt,pw,{key:code?txt+p.side:p.lbl.replace(/（.*$/,''),dir:true,pair:p.pairM,sep:' · '});
    else put(p.m,txt,pw,{anchor:p.anchor,key:code?txt:p.lbl.replace(/（.*$/,'')});
    if(code&&!p.pairM&&!p.tag)(grpL[txt]=grpL[txt]||[]).push(p)});
  LBL.forEach(l=>{const g=grpL[l.text];if(g&&g.length>1){l.follow=g;const w=g.map(p=>p.tap||p.win||[0,1]);l.win=[Math.min(...w.map(x=>x[0])),2]}});
  if(!dr)GS.forEach(G=>{const q=G.seq[cur];if(q&&q[1]!==0&&q[0]!==q[1]&&PANEL[G.name]){const m=FR[PAIR[G.name]];put(G.g,pno(PANEL[G.name])+PANEL[G.name],[(G.startAt&&G.startAt[cur])||0,2],{key:PANEL[G.name],dir:!!m,pair:m?m.g:null,anchor:G.anchor,sep:' · '})}});
  /* every other large part in view, once per kind */
  if(!dr){const cand=[];GS.forEach(G=>{const nm=PANEL[G.name];if(nm)cand.push({o:G.g,nm,anchor:G.anchor})});CP.forEach(p=>{if(!p.lbl||p.code||codeOf(p.m)||p.m.userData.hr)return;if(p.keys[cur])cand.push({o:p.m,nm:p.lbl.replace(/（.*$/,''),anchor:p.anchor})});cand.sort((x,y)=>wvis(y.o)-wvis(x.o)).forEach(c=>put(c.o,pno(c.nm)+c.nm,[0,2],{key:c.nm,anchor:c.anchor}))}
  if(cur==='45'){put(FR.lv,'联锁拨片',[.56,.9]);put(FR.drs[1].g,'抽屉',[0,.55])}if(cur==='44')put(root,'带警示标签的抽屉',[0,1])}
function drawLabels(){const v=document.getElementById('animView'),w=v.clientWidth,h=v.clientHeight,pv=new T3.Vector3(),on=[];
  document.getElementById('animLabels').hidden=!showLbl;document.getElementById('animLines').style.display=showLbl?'':'none';if(!showLbl)return;
  const tt=Math.min(t,1);LBL.forEach(l=>{const a=l.win[0]-.1,b=l.win[1]+.06,vis=(l.win[1]>1.5?wvis(l.obj):l.obj.visible)&&tt>=a&&(l.win[1]>1.5||tt<=Math.min(b,.985));l.d.style.opacity=vis?1:0;l.line.style.display=vis?'':'none';if(!vis)return;
    if(l.follow){const q=l.follow.find(p=>p._L>0&&p._L<1);if(q)l.obj=q.m}if(l.anchor){l.obj.updateWorldMatrix(true,false);pv.set(...l.anchor).applyMatrix4(l.obj.matrixWorld)}else l.obj.getWorldPosition(pv);pv.project(cam);const x=(pv.x+1)/2*w,y=(1-pv.y)/2*h;if(pv.z>1||x<-20||y<-20||x>w+20||y>h+20){l.d.style.opacity=0;l.line.style.display='none';return}on.push({l,x,y})});
  on.forEach(o=>{const l=o.l;if(!l.dir)return;const c=new T3.Vector3();if(l.pair&&l.pair.visible)l.pair.getWorldPosition(c);else if(CENTER)c.copy(CENTER);else return;c.project(cam);const rx=(c.x+1)/2*w,ry=(1-c.y)/2*h,dx=o.x-rx,dy=o.y-ry,tag=Math.abs(dx)>=Math.abs(dy)*.8?(dx<0?'左':'右'):(dy>0?'前':'后'),txt=tag+l.sep+l.text;if(l.d.textContent!==txt)l.d.textContent=txt});
  on.sort((a,b)=>a.y-b.y);let lastB=-99;const pad=6;on.forEach(o=>{const dw=o.l.d.offsetWidth,dh=o.l.d.offsetHeight;let lx=o.x+16,ly=o.y-dh-20;if(lx+dw>w-pad)lx=o.x-dw-16;if(lx<pad)lx=pad;if(ly<pad)ly=pad;if(ly<lastB+4)ly=lastB+4;if(ly+dh>h-pad)ly=h-dh-pad;lastB=ly+dh;
    o.l.d.style.transform=`translate(${Math.round(lx)}px,${Math.round(ly)}px)`;const ln=o.l.line;ln.setAttribute('x1',o.x);ln.setAttribute('y1',o.y);ln.setAttribute('x2',lx+dw/2);ln.setAttribute('y2',ly+dh/2)})}
/* Realistic look: procedural wood, matcap metal, gloss plastic. Line look stays available. */
let realLook=false;try{realLook=localStorage.getItem('norden-look')==='real'}catch(e){}
function birchTex(){const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');let seed=23;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const tone=()=>{const t=rnd(),l=234+rnd()*8+t*3;return [l,l-24-rnd()*3,l-54-rnd()*6]},css=(q,a=1)=>`rgba(${q[0]|0},${q[1]|0},${q[2]|0},${a})`;
  for(let y=0;y<H;){const h=72+rnd()*40|0;for(let u=-rnd()*500;u<W;){const w=420+rnd()*760|0,t=tone();const g=x.createLinearGradient(u,0,u+w,0);g.addColorStop(0,css(t));g.addColorStop(.5,css([t[0]+3,t[1]+3,t[2]+4]));g.addColorStop(1,css([t[0]-3,t[1]-3,t[2]-4]));x.fillStyle=g;x.fillRect(u,y,w,h);x.save();x.beginPath();x.rect(u,y,w,h);x.clip();
      for(let i=0;i<7;i++){const by=y+rnd()*h,bh=6+rnd()*26;x.fillStyle=css(rnd()<.5?[150,108,66]:[250,236,205],.025+rnd()*.03);x.fillRect(u,by,w,bh)}
      for(let i=0;i<34;i++){x.strokeStyle='rgb(140,102,62)';x.globalAlpha=.012+rnd()*.03;x.lineWidth=.5+rnd()*.9;const yy=y+rnd()*h,a=rnd()*7,am=.5+rnd()*2;x.beginPath();for(let k=0;k<=w;k+=60)x.lineTo(u+k,yy+Math.sin(k/260+a)*am);x.stroke()}
      for(let i=0;i<w/5;i++){x.fillStyle='rgb(120,85,50)';x.globalAlpha=.05+rnd()*.05;x.fillRect(u+rnd()*w,y+rnd()*h,6+rnd()*26,.8)}
      if(rnd()<.16){const cx=u+rnd()*w,cy=y+rnd()*h,l=130+rnd()*200,g2=x.createRadialGradient(0,0,1,0,0,1);g2.addColorStop(0,'rgba(176,126,84,.26)');g2.addColorStop(1,'rgba(180,130,90,0)');x.save();x.globalAlpha=1;x.translate(cx,cy);x.scale(l,5+rnd()*6);x.fillStyle=g2;x.beginPath();x.arc(0,0,1,0,7);x.fill();x.restore()}
      if(rnd()<.05){x.globalAlpha=.55;x.fillStyle='#5f4028';x.beginPath();x.ellipse(u+rnd()*w,y+rnd()*h,3+rnd()*6,.8+rnd()*1.1,0,0,7);x.fill()}
      x.restore();x.globalAlpha=.07;x.fillStyle='#7c5c38';x.fillRect(u+w-1,y,1.2,h);x.globalAlpha=1;u+=w}x.globalAlpha=.08;x.fillStyle='#7c5c38';x.fillRect(0,y+h-1,W,1.2);x.globalAlpha=1;y+=h}
  const d=x.getImageData(0,0,W,H),p=d.data;for(let i=0;i<p.length;i+=4){const n=(rnd()-.5)*3.2;p[i]+=n;p[i+1]+=n;p[i+2]+=n}x.putImageData(d,0,0);
  const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=4;return t}
function woodTex(base,dark,lines){const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,1024,256);let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<lines;i++){x.strokeStyle=dark;x.globalAlpha=.04+rnd()*.2;x.lineWidth=.5+rnd()*2.2;const y=rnd()*256,a=rnd()*7,b=rnd()*9;x.beginPath();for(let u=0;u<=1024;u+=32){const k=u/1024*Math.PI*2;x.lineTo(u,y+Math.sin(k+a)*b+Math.sin(k*2+b)*b*.4)}x.stroke()}
  x.globalAlpha=.14;x.fillStyle=dark;for(let i=0;i<500;i++)x.fillRect(rnd()*1024,rnd()*256,6+rnd()*40,1);x.globalAlpha=1;const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;return t}
function matcapTex(hi,mid,lo){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(46,38,6,64,64,78);g.addColorStop(0,hi);g.addColorStop(.45,mid);g.addColorStop(.85,lo);g.addColorStop(1,mid);x.fillStyle=g;x.fillRect(0,0,128,128);return new T3.CanvasTexture(c)}
function planarUV(m){const g=m.geometry;if(!g.parameters||g.type!=='BoxGeometry')return;const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,d=[g.parameters.width,g.parameters.height,g.parameters.depth];for(let i=0;i<p.count;i++){const a=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],skip=a.indexOf(Math.max(...a)),ax=[0,1,2].filter(k=>k!==skip).sort((q,w)=>d[w]-d[q]),v=[p.getX(i),p.getY(i),p.getZ(i)];uv.setXY(i,v[ax[0]]*.0065+skip*.31,v[ax[1]]*.024+skip*.17)}uv.needsUpdate=true}
let LOOK=null;const inCover=o=>{let c=false;o.traverseAncestors(q=>{if(q.userData.code==='10101849'||q.userData.code==='158568')c=true});return c};
function makeLook(sceneObj){if(!LOOK)LOOK={oak:woodTex('#4d3628','#241510',900),beech:woodTex('#c9a26b','#8d6838',260),birch:birchTex(),steel:matcapTex('#ffffff','#a8b0b4','#3b4246'),black:matcapTex('#8c9296','#34383b','#0d0f10')};
  sceneObj.traverse(o=>{if(!o.isMesh||!o.material||o.material.isMeshBasicMaterial||o.userData.lineM)return;const old=o.material,c=(o.userData.b!=null?o.userData.b:old.color.getHex());let nw;
    if(c===WOOD){const box0=o.geometry.type==='BoxGeometry';if(box0){planarUV(o);nw=new T3.MeshPhongMaterial({map:LOOK.birch,shininess:18,specular:0x2a2620})}else nw=new T3.MeshPhongMaterial({color:0xf0d9bc,shininess:18,specular:0x2a2620});o.userData.birch=true}
    else if(c===DOW||c===WOODP){nw=new T3.MeshPhongMaterial({map:LOOK.beech,shininess:10})}
    else if(c===METAL||c===STEEL||c===ZINC||c===0x6d7478){nw=new T3.MeshMatcapMaterial({matcap:LOOK.steel,color:0xffffff})}
    else if(c===0x4a5256||c===0x333b3f||c===0x2a2f31||c===DARK||c===0x3a4246||c===0x2a3033){nw=new T3.MeshMatcapMaterial({matcap:LOOK.black,color:0xffffff})}
    else if(c===PLAST||c===0xf4f4ef||c===0xf0f0ea){nw=new T3.MeshPhongMaterial({color:0xe9e6dc,shininess:80,specular:0x555555})}
    else return;
    o.userData.lineM=old;o.userData.realM=nw;o.userData.lb=c});}
function setLook(real){realLook=real;[scene,sc2].forEach(sc=>{if(!sc)return;sc.traverse(o=>{if(o.isLineSegments){o.visible=!real||!o.parent.userData.realM||!!o.parent.userData.birch;if(o.parent.userData.birch)o.material.color.setHex(real?0xa98a60:0x1b2420)}if(o.isMesh&&o.userData.realM){const m=real?o.userData.realM:o.userData.lineM;if(o.material!==m){o.material=m;o.userData.b=m.map?0xffffff:m.color.getHex()}}});sc.children.forEach(q=>{if(q.isAmbientLight)q.intensity=real?.9:.85;if(q.isDirectionalLight)q.intensity=real?.2:.45});sc.traverse(o=>{if(o.isMesh){o.castShadow=real&&!o.material.isMeshBasicMaterial;o.receiveShadow=real&&!!o.material.map||real&&o===FR.floor}})});if(FR.floor)FR.floor.material.color.setHex(real?0xffffff:0xdfe2dd);if(ren){ren.shadowMap.enabled=real;ren.shadowMap.type=T3.PCFSoftShadowMap;[scene,sc2].forEach(sc=>sc&&sc.traverse(o=>{if(o.isMesh&&o.material)o.material.needsUpdate=true}))}const b=document.getElementById('animLook');if(b)b.textContent=real?'线稿模式':'真实材质';try{localStorage.setItem('norden-look',real?'real':'line')}catch(e){}}
/* Cabinet animation, steps 1-34 and 45. Follows the manual's order: built lying on its front, stood up at step 24. Proportions are estimates. */
const CIDS=[...Array.from({length:31},(_,i)=>String(i+1)),'32w','32','33','34','45'];
const ORD=id=>CIDS.indexOf(id);
let sc2,GS=[],CP=[],carc=[],FR={},cabReady=false;
const B=78,TK=1.8,CD=46,CH=76,PH=6,SX=B+TK,BX=(B+TK)/2,WZ=-CD/2-1;
const PI=Math.PI,FLAT=(p,r)=>({p,r}),F={f:[0,0,0]};
const range=(a,b,v)=>{const o={};for(let i=a;i<=b;i++)o[i]=v;return o};
function grp(name,body,final,seq,opt={}){const g=new T3.Group();if(body)g.add(body);sc2.add(g);const G={g,name,body,final,seq,base:body&&body.material?body.material.color.getHex():null,...opt};GS.push(G);FR[name]=G;return G}
function pt(G,m,pos,keys,o={}){m.position.set(...pos);(G?G.g:sc2).add(m);CP.push({m,pos,keys,G,base:m.material&&m.material.color?m.material.color.getHex():null,...o});return m}
function ybox(w,h,d,c){return box(w,h,d,c)}
function frameOf(id,t){const lying=new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),PI/2),up=new T3.Quaternion();const n=ORD(id);let q,y,z=0;
  if(n<ORD('24')){q=lying;y=CD/2}else if(id==='24'){const k=ease(clamp(t/.55));q=lying.clone().slerp(up,k);y=lerp(CD/2,CH/2,k)+Math.sin(k*PI)*26}else{q=up;y=CH/2}
  if(id==='31')z=lerp(0,55,ease(t));if(id==='32w')z=55;if(id==='32')z=lerp(55,0,ease(clamp(t/.4)));if(id==='33')z=lerp(55,2.5,ease(clamp((t-.58)/.42)));if(id==='34')z=2.5;
  return{q,t:new T3.Vector3(0,y,z)}}
function resolve(G,spec,fr){const v=new T3.Vector3(),q=new T3.Quaternion();
  if(spec.p){v.set(...spec.p);q.setFromEuler(new T3.Euler(...spec.r));return{v,q,arc:spec.arc||0}}
  const o=spec.f||[0,0,0];v.set(G.final[0]+o[0],G.final[1]+o[1]-CH/2,G.final[2]+o[2]).applyQuaternion(fr.q).add(fr.t);q.copy(fr.q);if(spec.rx)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),spec.rx));return{v,q,arc:0}}
function buildCab(){
  sc2=new T3.Scene();sc2.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(30,70,-40);sc2.add(d);
  const carcHide={...range(7,9,null),17:null,25:null};
  const A=grp('sideA',box(TK,CH,CD,WOOD),[-SX,CH/2,0],{1:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],2:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],3:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],4:null,5:[F,F],...carcHide});
  const Bb=grp('sideB',box(TK,CH,CD,WOOD),[SX,CH/2,0],{1:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],2:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],3:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],...range(4,14,null),15:[{f:[34,0,0]},F],16:[F,F],17:null,25:null});
  const M1=FLAT([0,TK/2,0],[0,0,PI/2]),M2=FLAT([0,TK/2,0],[PI,0,PI/2]);
  const Mid=grp('mid',at(box(TK,CH,CD-2.2,WOOD),0,0,1.1),[0,CH/2,0],{7:[M1,0],8:[M1,{...M2,arc:12}],9:[M2,0],10:[{f:[34,0,0]},F],17:null,25:null});
  const ba=grp('botA',box(B,TK,CD,WOOD),[-BX,PH+TK/2,0],{4:[FLAT([-46,TK/2,0],[0,0,0]),0],5:[{f:[34,0,0]},F],...carcHide});
  const bb=grp('botB',box(B,TK,CD,WOOD),[BX,PH+TK/2,0],{4:[FLAT([46,TK/2,0],[0,0,0]),0],...range(5,12,null),13:[{f:[34,0,0]},F],17:null,25:null});
  [A,Bb,Mid].forEach((G,i)=>{[-1,1].forEach(sg=>G.body.add(at(new T3.Mesh(bg(.15,CH-1,.7),mat(0x3a4246)),sg*(TK/2+.05),0,-CD/2+1.6)))});
  // runners and screws on the side panels and divider
  const levels=[17,41,65];
  [[A,1],[Bb,-1]].forEach(([G,a])=>levels.forEach((y,li)=>{const rl=pt(G,rail(CD-5,'z',a),[a*1.03,y-CH/2,0],{1:[[a*10,0,0],[0,0,0]]},{i:li,of:3,win:[0,.45],tag:G===A?'CL':'CR'});
    [18,-18,0].forEach((z,i)=>pt(G,screw('x',a,{len:1}),[a*.65,y-CH/2,z],{1:[[a*9,0,0],[0,0,0]]},{i,of:3,win:[.45,1],spin:'x',on:rl.userData.plate}));
    const lv=lever();if(G===A&&li===2)FR.lv=lv;pt(G,lv,[a*1.1,y-CH/2+3,-CD/2+3],{2:[[0,0,0],[0,0,0]]},{i:li,of:3,swing:'x'})}));
  [[A,1],[Bb,-1]].forEach(([G,a])=>[-12,12].forEach((z,i)=>pt(G,conn('x',a),[a*2.8,PH+1-CH/2,z],{3:[[a*12,0,0],[0,0,0]]},{i,of:2,spin:'x'})));
  [[ba],[bb]].forEach(([G])=>[-1,1].forEach(a=>[-16,16].forEach((z,i)=>pt(G,dowel('x',a),[a*(B/2-.87),0,z],{4:[[a*11,0,0],[0,0,0]]},{i,of:2}))));
  [[Mid,1,7],[Mid,-1,8]].forEach(([G,a,s])=>levels.forEach((y,li)=>{const rl=pt(G,rail(CD-5,'z',a),[a*1.03,y-CH/2,0],{[s]:[[a*10,0,0],[0,0,0]]},{i:li,of:3,win:[s===8?.5:0,s===8?.75:.5],tag:s===7?'CL':'CR'});
    [-18,18].forEach((z,i)=>pt(G,screw('x',a,{len:1.4}),[a*.45,y-CH/2,z],{[s]:[[a*9,0,0],[0,0,0]]},{i,of:2,win:[s===8?.75:.5,1],spin:'x',on:rl.userData.plate}))}));
  [-12,12].forEach((z,i)=>{pt(Mid,conn('x',-1),[-2.8,PH+1-CH/2,z],{9:[[-12,0,0],[0,0,0]]},{i,of:2,spin:'x'});pt(Mid,conn('x',1),[2.8,PH+1-CH/2,z],{12:[[12,0,0],[0,0,0]]},{i,of:2,spin:'x'})});
  const cam=(G,x,z,k)=>pt(G,lock('y',-1,'a'),[x,-.4,z],{[k]:[[0,-11,0],[0,0,0]]},{i:z>0?1:0,of:2,spin:'y'});
  [-12,12].forEach(z=>{cam(ba,-B/2+3,z,6);cam(ba,B/2-3,z,11);cam(bb,-B/2+3,z,14);cam(bb,B/2-3,z,16)});
  // plinths
  [[-BX,'pA',-13],[BX,'pB',13]].forEach(([x,n,zz])=>{const P0=FLAT([0,TK/2,zz],[PI/2,0,0]);const G=grp(n,box(B,PH,TK,WOOD),[x,PH/2,CD/2-3],{17:[P0,0],18:[{f:[0,-16,0]},F]},{move:.5});
    [-1,1].forEach(a=>[-.45,.45].forEach(z=>drill(G.body,new T3.Vector3(a*(B/2-2.5),-PH/2,z),new T3.Vector3(0,-1,0),.34,['19'])));[-1,1].forEach((a,i)=>{const br=new T3.Group(),bi=bracket();bi.rotation.y=PI;br.add(bi);br.rotation.x=-PI/2;const by=PH/2-1.205,bz=-TK/2,mx=a*(B/2-4);
      pt(G,br,[mx,by,bz],{17:[[0,0,-9],[0,0,0]]},{i,of:2,win:[0,.5]});
      pt(G,screw('z',-1,{wide:true,len:1}),[mx,by,bz+.15],{17:[[0,0,-9],[0,0,0]]},{i,of:2,win:[.5,1],spin:'z',on:G.body});
      pt(G,screw('y',-1,{wide:true,len:1}),[mx,PH/2+.15,bz-2.5],{18:[[0,-9,0],[0,0,0]]},{i,of:2,win:[.5,1],spin:'y',nohole:1});
      {const lw=new T3.Group(),lc=coverL();lc.scale.x=a>0?-1:1;lw.add(lc);lw.rotation.x=PI/2;pt(G,lw,[a*(B/2-.2),-PH/2-.5,0],{19:[[0,-10,0],[0,0,0]]},{i,of:2})}});carc.push(G)});
  [[A],[Mid],[Bb]].forEach(([G],i)=>pt(G,coverS(14),[0,-CH/2-1.1,-CD/2+14],{20:[[0,-10,0],[0,0,0]]},{i:0,of:1,delay:i*.22}));
  // back panel
  const bs=new T3.Shape(),bw=SX,bh=(CH-3)/2;bs.moveTo(-bw,-bh);bs.lineTo(bw,-bh);bs.lineTo(bw,bh-13);bs.lineTo(bw-15,bh-13);bs.lineTo(bw-15,bh);bs.lineTo(8,bh);bs.absarc(0,bh,8,0,-Math.PI,true);bs.lineTo(-bw+15,bh);bs.lineTo(-bw+15,bh-13);bs.lineTo(-bw,bh-13);bs.closePath();
  const bg0=new T3.ExtrudeGeometry(bs,{depth:.5,bevelEnabled:false});bg0.translate(0,0,-.25);const bm=new T3.Mesh(bg0,mat(GREY));bm.add(new T3.LineSegments(new T3.EdgesGeometry(bg0,20),EDGE()));
  const Bk=grp('back',bm,[0,CH/2+.5,-CD/2+.9],{21:[{f:[0,-CH*.95,0]},F],25:null,26:[{f:[6,-1.5,0]},F]},{move:.45,startAt:{21:.42}});
  const h=(CH-3)/2,bw2=SX,us=new T3.Shape();us.moveTo(-bw2,0);us.lineTo(bw2,0);us.lineTo(bw2,h-13);us.lineTo(bw2-15,h-13);us.lineTo(bw2-15,h);us.lineTo(8,h);us.absarc(0,h,8,0,-Math.PI,true);us.lineTo(-bw2+15,h);us.lineTo(-bw2+15,h-13);us.lineTo(-bw2,h-13);us.closePath();
  const ug=new T3.ExtrudeGeometry(us,{depth:.5,bevelEnabled:false});ug.translate(0,0,-.25);const up=new T3.Mesh(ug,mat(GREY));up.add(new T3.LineSegments(new T3.EdgesGeometry(ug,20),EDGE()));
  const lo=box(2*bw2,h,.5,GREY);lo.position.y=-h/2;const piv=new T3.Group();piv.add(lo);const fg=new T3.Group();fg.add(up,piv);sc2.add(fg);FR.fold=fg;FR.foldP=piv;
  const fold=new T3.Mesh(new T3.BoxGeometry(2*SX,.25,.6),mat(0x777b78));fold.position.set(0,0,0);Bk.g.add(fold);
  [[-60,-30.5],[-20,-30.5],[20,-30.5],[60,-30.5],[0,-14],[0,10],[0,30]].forEach(([x,y],i)=>{pt(Bk,plug708('z',-1),[x,y,-1.1],{22:[[0,0,-10],[0,0,0]]},{i,of:7,win:[0,.5]});pt(Bk,pin707('z',-1),[x,y,-1.6],{22:[[0,0,-10],[0,0,0]]},{i,of:7,win:[.5,1]})});
  [[A,1],[Bb,-1]].forEach(([G,a])=>[12,-14].forEach((y,i)=>{pt(G,clipB('x',a),[a*1.7,y,-CD/2+.25],{23:[[a*10,0,0],[0,0,0]]},{i,of:2,win:[0,.5]});pt(G,clipC('x',a),[a*2.2,y,-CD/2+.25],{23:[[a*10,0,0],[0,0,0]]},{i,of:2,win:[.5,1]})}));
    // top
  const Tp=grp('top',box(2*SX+TK+2,TK,CD+2,WOOD),[0,CH+TK/2,0],{25:[FLAT([0,TK/2,0],[PI,0,0]),0],26:[{f:[0,36,0],rx:-.22},F]},{startAt:{26:.48}});
  [[-SX,-15],[-SX,15],[0,-15],[0,15],[SX,-15],[SX,15]].forEach(([x,z],i)=>pt(Tp,conn('y',-1),[x,-3,z],{25:[[0,-12,0],[0,0,0]]},{i,of:6,spin:'y'}));
  [-40,40].forEach((x,i)=>{pt(Tp,clipB('y',-1),[x,-1.8,-CD/2+.3],{29:[[0,-10,0],[0,0,0]]},{i,of:2,win:[0,.5]});pt(Tp,clipC('y',-1),[x,-2.3,-CD/2+.3],{29:[[0,-10,0],[0,0,0]]},{i,of:2,win:[.5,1]})});
  [[A,0,-1],[A,0,1],[Mid,0,1],[Mid,0,-1],[Bb,0,-1],[Bb,0,1]].forEach(([G,x,s],i)=>pt(G,dowel('y',1),[x,CH/2-.87,s*8],{24:[[0,12,0],[0,0,0]]},{i,of:6,win:[.6,1]}));
  [[A,1],[Bb,-1]].forEach(([G,a])=>[-15,15].forEach((z,i)=>pt(G,lock('x',a,'a'),[a*.4,CH/2-3,z],{27:[[a*12,0,0],[0,0,0]]},{i,of:2,spin:'x'})));
  [-1,1].forEach((s,i)=>pt(Mid,lock('x',1,'b'),[.22,CH/2-3,s*15],{28:[[12,0,0],[0,0,0]]},{i,of:2,spin:'x'}));
  // wall, floor, fittings
  const wall=box(330,130,1,0xe6e9e6);wall.position.set(0,65,WZ-.5);const wg=new T3.Group();wg.add(wall);sc2.add(wg);FR.wall=wg;
  const skirt=box(330,8,2.5,0xd3d6d2);skirt.position.set(0,4,WZ+1.25);sc2.add(skirt);FR.skirt=skirt;
  [-1,1].forEach((a,i)=>{const G=a<0?A:Bb;const pl=new T3.Group(),fi=fix();fi.position.x=-1.9;fi.position.z=-.12;pl.add(fi);pl.scale.x=a<0?-1:1;pt(G,pl,[-a*.9,CH/2-6,-CD/2-.25],{30:[[0,0,0],[0,0,0]]},{win:[0,.4],hinge:[a<0?-PI/2:PI/2,0]});
    const m1=box(6,.7,.5,0x222222),m2=box(6,.7,.5,0x222222);m1.rotation.z=.8;m2.rotation.z=-.8;[m1,m2].forEach(m=>pt(null,m,[a*(SX-2.8),CH-6,WZ+.1],{30:[[0,0,0],[0,0,0]]},{win:[.5,.95],until:'34'}));
    pt(null,plugW('z',1),[a*(SX-2.8),CH-6,WZ-1.8],{'32w':[[0,0,16],[0,0,0]]},{win:[a<0?.65:.825,a<0?.8:.98],until:'34'});
    const sc=screw('z',1,{r:.42,len:7,c:0x8d979c,nohole:true});pt(G,sc,[-a*2.8,CH/2-6,-CD/2-3.9],{32:[[0,0,12],[0,0,0]]},{win:[.45,.8],spin:'z',only:'32'});
    const sc3=screw('z',1,{r:.42,len:7,c:0x8d979c,nohole:true});pt(G,sc3,[-a*2.8,CH/2-6,-CD/2-3.9],{34:[[0,0,14],[0,0,0]]},{win:[0,.55],spin:'z',from2:1});
    const ch=new T3.Group();ch.userData.b=[];[0,1,2,3].forEach(n=>{const q=box(3,3,.62,PLAST);q.add(at(hole(.65,'z'),0,0,.32),at(hole(.65,'z'),0,0,-.32));ch.add(q);ch.userData.b.push(q)});pt(G,ch,[-a*2.8,CH/2-6,-CD/2-1],{33:[[0,0,-12],[0,0,0]]},{win:[.36,.55],from2:1});(FR.chains=FR.chains||[]).push(ch);
    const sp=box(.3,6,7,0xdde0dd),sl=new T3.Mesh(bg(.34,.8,6),mat(0x2a3033));sl.rotation.x=-.75;sp.add(sl);pt(G,sp,[-a*1.05,CH/2-13,-CD/2+7],{30:[[0,0,0],[0,0,0]]},{win:[0,.01]});
    pt(G,cyl(.6,1.4,0xc33,'x'),[-a*1.5,CH/2-11.2,-CD/2+9.2],{32:[[0,-3.6,-4.4],[0,0,0]]},{win:[.8,1],only:'32'});
    pt(G,cyl(.6,1.4,0xc33,'x'),[-a*1.5,CH/2-11.2,-CD/2+9.2],{34:[[0,-3.6,-4.4],[0,0,0]]},{win:[.6,1],from2:1});
    if(i===0){const drill=new T3.Group();const dc=box(5,5,13,0x45604f),bit=cyl(.4,11,METAL,'z');bit.position.z=-11;drill.add(dc,bit);drill.position.set(a*(SX-2.8),CH-6,WZ+20);sc2.add(drill);FR.drill=drill}});
  const hm=new T3.Group(),hh=box(3,3,6,0x6d7478),hn2=cyl(.55,14,0xa77c4f);hn2.position.y=-7;hm.add(hh,hn2);sc2.add(hm);FR.ham2=hm;
  FR.pencil=(()=>{const c=new T3.Mesh(new T3.CylinderGeometry(.5,.1,14,10),mat(0xd8a02f));c.rotation.x=1;sc2.add(c);return c})();
  // drawers for step 45
  const drs=[];[-BX,BX].forEach((x,col)=>[60,36,12].forEach((y,row)=>{const g=new T3.Group();const f=box(B-1,21,TK,WOOD);f.position.z=CD/2+1;const bd=box(B-5,17,CD-4,0xeef0ec);g.add(f,bd);g.position.set(x,y+4,0);sc2.add(g);drs.push({g,col,row})}));FR.drs=drs;
  FR.floor=box(420,1,300,0xdfe2dd);FR.floor.position.set(0,-.5,60);FR.floor.children[0].visible=false;sc2.add(FR.floor);
  const Yv=new T3.Vector3(0,1,0),nY2=new T3.Vector3(0,-1,0),Xv=new T3.Vector3(1,0,0),nX2=new T3.Vector3(-1,0,0),yB=PH+TK/2-CH/2;
  [ba,bb].forEach(G=>[-1,1].forEach(a=>drill(G.body,new T3.Vector3(a*(B/2-4),-TK/2,CD/2-3-TK/2-2.5),nY2,.42,['18'])));
  [[A,Xv,'5'],[Mid,nX2,'10'],[Mid,Xv,'13'],[Bb,nX2,'15']].forEach(([G,n,st])=>[-16,16].forEach(z=>drill(G.body,new T3.Vector3(n.x*(TK/2),yB,z),n,.52,[st])));
  [[ba,nX2,'5'],[ba,Xv,'10'],[bb,nX2,'13'],[bb,Xv,'15']].forEach(([G,n,st])=>[-12,12].forEach(z=>drill(G.body,new T3.Vector3(n.x*(B/2),0,z),n,.62,[st])));
  [[-SX],[0],[SX]].forEach(([x])=>[-8,8].forEach(z=>drill(Tp.body,new T3.Vector3(x,-TK/2,z),nY2,.52,['26'])));
  [[A],[Mid],[Bb]].forEach(([G])=>[-15,15].forEach(z=>drill(G.body,new T3.Vector3(0,CH/2,z),Yv,.62,['26'])));
  GS.forEach(G=>{G.g.position.set(0,0,0);G.g.quaternion.identity()});
  autoHoles(CP,sc2,p=>p.on||(p.G&&p.G.body),p=>{const k=Object.keys(p.keys)[0];return[k,p.keys[k]]});
  cabReady=true;
}
const CC={def:[[92,152,-262],[0,16,-6]],flat:[[62,175,-225],[0,0,0]],front:[[110,95,215],[0,40,0]],back:[[120,100,-215],[0,38,0]],wall:[[170,105,190],[0,40,30]],low:[[70,6,170],[0,66,-8]],corner:[[-44,52,70],[-70,68,-20]],lowL:[[-38,12,118],[-62,74,10]],lowM:[[22,12,118],[2,74,10]],high:[[170,185,165],[0,58,-6]],gap:[[-120,CH+26,-16],[-70,CH-6,34]],lever:[[-235,64,26],[-40,48,6]]};
function camFor(id,t=0){const n=+id;if(id==='33'&&t<.58)return CC.gap;if(id==='45'&&t>.56)return CC.lever;if(id==='45')return CC.front;if(id==='29')return CC.back;if(id==='27')return CC.lowL;if(id==='28')return CC.lowM;if(id==='31'||id==='32w'||id==='33')return CC.high;if(['30','32','34'].includes(id))return CC.corner;if(n<=4||(n>=7&&n<=9)||n===17)return CC.flat;if(n>=24)return n===25?CC.flat:CC.front;return CC.def}
let lastStage='';const STG={'21':[[.42,'先把折叠的背板展开'],[2,'再把背板推入板槽']],'33':[[.14,'把垫块掰开'],[.36,'叠到与踢脚线相同的厚度'],[.58,'从墙侧装到固定件后方'],[2,'把柜体移回墙边']],'45':[[.56,'装入其余 5 个抽屉'],[.7,'拆卸时：先拉出上层抽屉'],[.84,'把该层拨片向下转'],[2,'再拉出下一层抽屉']]};
function stage(s,tt){if(s==='21'){const on=tt<.42;FR.fold.visible=on;FR.back.g.visible=!on;if(on){FR.fold.position.copy(FR.back.g.position);FR.fold.quaternion.copy(FR.back.g.quaternion);FR.foldP.rotation.x=lerp(Math.PI*.98,0,ease(clamp(tt/.38)))}}else FR.fold.visible=false;
  const list=STG[s];let txt='';if(list)txt=list.find(x=>tt<x[0])[1];const key=s+txt;if(key!==lastStage){lastStage=key;const lb=byId[s].label||('第 '+s+' 步');document.getElementById('animCap').textContent=lb+' · '+(txt||byId[s].title)}}
function applyCab(s,tt){
  mark(s);
  CENTER=frameOf(s,tt).t;
  const fr=frameOf(s,tt),n=ORD(s);
  GS.forEach(G=>{let spec=G.seq[s];const keys=Object.keys(G.seq).map(k=>ORD(k)).filter(k=>k>=0);
    if(spec===undefined){if(n<Math.min(...keys)){G.g.visible=false;return}spec=[F,F]}
    if(spec===null){G.g.visible=false;return}
    if(G.name==='back'&&s==='26')spec=[{f:[lerp(6,0,ease(clamp(tt/.45))),-1.5*(1-ease(clamp((tt-.86)/.14))),0]},0];
    G.g.visible=true;if(G.name==='top')G.move=s==='26'?.85:1;G.start=G.startAt&&G.startAt[s]||0;if(G.name==='back')G.move=s==='21'?1:.45;const a=spec[0],b=spec[1]===0?a:spec[1],k=ease(clamp((tt-(G.start||0))/((G.move||1)-(G.start||0)))),A1=resolve(G,a,fr),B1=resolve(G,b,fr);
    G.g.position.copy(A1.v).lerp(B1.v,k);G.g.position.y+=Math.sin(k*PI)*(B1.arc||0);G.g.quaternion.copy(A1.q).slerp(B1.q,k);
    if(G.body&&G.body.material)tint(G.body,a!==b&&(a.f||b.f||b.arc)&&tt<(G.move||1))});
  if(s==='45'){}
  CP.forEach(p=>{const ks=Object.keys(p.keys),first=ORD(ks[0]);
    if(n<first||(p.until&&n>ORD(p.until))||(p.only&&!(s===p.only||(s==='45'&&false)))&&n>=first&&s!==p.only&&ORD(s)<ORD('45')){p.m.visible=false;return}
    if(p.from2&&s!=='34'&&s!=='33'&&s!=='45'){p.m.visible=false;return}
    p.m.visible=!(s==='45'&&!p.G);
    const k=p.keys[s];const col=p.m.material;let L=tt;
    if(k){const [a,b]=p.win||[0,1];L=clamp((tt-a-(p.delay||0))/(b-a-(p.delay||0)));if(p.of>1){const gap=.5/p.of;L=clamp((L-p.i*gap)/(1-(p.of-1)*gap))}L=ease(L);
      p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],L),p.pos[1]+lerp(k[0][1],k[1][1],L),p.pos[2]+lerp(k[0][2],k[1][2],L));
      tint(p.m,L<1&&L>0)
    }else{p.m.position.set(...p.pos);tint(p.m,false)}
    const rz=p.m.rotation.z,base=p.m.rotation;if(p.hinge)base.y=lerp(p.hinge[0],p.hinge[1],k?L:1);if(p.spin&&k)base[p.spin]=L*PI*3;if(p.swing&&k)base.x=Math.sin(L*PI)*-1.3});
  const wallOn=n>=ORD('30')&&s!=='45';FR.wall.visible=wallOn;FR.skirt.visible=s==='33'||s==='34';FR.floor.visible=n>=ORD('24')&&s!=='25';
  FR.drill.visible=s==='32w'&&tt<.62;if(s==='32w'){const m=tt<.31?0:1,l=m?(tt-.31)/.3:tt/.3,dz=l<.6?lerp(24,9,ease(l/.6)):lerp(9,30,ease((l-.6)/.4));FR.drill.position.x=(m?1:-1)*(SX-2.8);FR.drill.position.z=WZ+dz}
  FR.ham2.visible=s==='32w'&&tt>=.65;if(s==='32w'){const m=tt<.825?-1:1,k=(tt*18)%1;FR.ham2.position.set(m*(SX-2.8)+m*0,CH-6,WZ+6+Math.abs(Math.sin(k*PI))*7)}
  FR.pencil.visible=s==='30';if(s==='30'){const k=clamp((tt-.42)/.5);FR.pencil.visible=tt>.4;FR.pencil.position.set(-(SX-2.8)+Math.sin(tt*30)*.5,CH-1,WZ+6+lerp(4,0,Math.min(k*2,1)))}
  FR.drs.forEach((d,i)=>{d.g.visible=s==='45';const done=d.col===0&&d.row===0;const seq=[0,1,2,3,4,5][i];const L=done?1:ease(clamp((tt-(seq-1)*.09)/.1));let z=lerp(62,0,L);if(d.col===0&&d.row===0)z=lerp(0,42,ease(clamp((tt-.56)/.13)));if(d.col===0&&d.row===1)z=lerp(z,42,ease(clamp((tt-.84)/.13)));d.g.position.z=z});
  if(s==='45')FR.lv.rotation.x=-1.2*ease(clamp((tt-.56)/.13))*(1-ease(clamp((tt-.7)/.12)));else if(s!=='2')FR.lv.rotation.x=0;
  (FR.chains||[]).forEach(ch=>{const g=s==='33'?ease(clamp(tt/.14)):1,k2=s==='33'?ease(clamp((tt-.14)/.2)):1;ch.userData.b.forEach((q,n)=>{const rx=(n-1.5)*(3.1+g*1.2),sz=(n-1.5)*.66;q.position.set(lerp(rx,0,k2),0,lerp(0,sz,k2))})});
  {const bm=FR.sideA.body.material,cut=s==='45'&&tt>.56;bm.transparent=cut;bm.opacity=cut?.16:1;bm.depthWrite=!cut;FR.sideA.body.children[0].visible=!cut;tint(FR.lv,s==='45'&&tt>.7&&tt<.84)}
  stage(s,tt);
  if(FR.notes)0;const c=camFor(s,tt),tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.14):want.clone();camTgt=camTgt?camTgt.lerp(tp,.14):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}

function load(){return loading||(loading=new Promise((ok,no)=>{if(window.THREE)return ok();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=ok;s.onerror=no;document.head.append(s)}))}
function mat(c){return new T3.MeshLambertMaterial({color:c})}
const EDGE=()=>new T3.LineBasicMaterial({color:0x1b2420});
function box(w,h,d,c){const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),mat(c));m.add(new T3.LineSegments(new T3.EdgesGeometry(m.geometry),EDGE()));return m}
function cyl(r,l,c,axis){const g=new T3.CylinderGeometry(r,r,l,14);if(axis==='x')g.rotateZ(Math.PI/2);if(axis==='z')g.rotateX(Math.PI/2);return new T3.Mesh(g,mat(c))}
const ACC=0x2f8f6b,WOOD=0xf4f5f2,GREY=0xc9cdc9,METAL=0x8d979c,DOW=0xd9b77e;
function add(m,pos,keys,opt={}){m.position.set(...pos);inner.add(m);parts.push({m,pos,keys,base:m.material&&m.material.color?m.material.color.getHex():null,...opt});return m}
function build(){
  T3=window.THREE;const box0=document.getElementById('animView');
  ren=new T3.WebGLRenderer({antialias:true,alpha:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));box0.append(ren.domElement);
  scene=new T3.Scene();cam=new T3.PerspectiveCamera(32,1.5,1,600);
  scene.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(30,70,-40);scene.add(d);
  root=new T3.Group();inner=new T3.Group();inner.position.y=-D/2;root.add(inner);scene.add(root);
  const yTop=T+D;
  // step 35: drawer front, flat, four connectors
  const fm=add(box(W,T,H,WOOD),[0,T/2,0],{35:[[0,0,0],[0,0,0]]},{name:'front'});const SB={};
  const lip=box(W+2,T*1.3,3,WOOD);add(lip,[0,T*.65,H/2+1.5],{35:[[0,0,0],[0,0,0]]});
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([a,b],i)=>add(conn('y',1),[a*(W/2-1),T+2.2,b*4],{35:[[0,12,0],[0,0,0]]},{i,of:4,spin:'y'}));
  // step 36-37: sides with dowels
  [-1,1].forEach(a=>{SB[a]=add(box(T,D+T,H,WOOD),[a*(W/2-T/2),T+(D+T)/2,0],{36:[[0,26,0],[0,26,0]],37:[[0,26,0],[0,0,0]]});SB[a].add(at(new T3.Mesh(bg(.14,D+T-1,.7),mat(0x3a4246)),-a*(T/2+.05),0,-H/2+1.5));
    [-1,1].forEach(b=>add(dowel('y',-1),[a*(W/2-.8),T+.87,b*2.5],{36:[[0,15,0],[0,26,0]],37:[[0,26,0],[0,0,0]]},{i:b>0?1:0,of:2}))});
  // step 38: cams through the side faces near the front board
  [-1,1].forEach(a=>[-1,1].forEach((b,i)=>add(lock('x',a,'c'),[a*(W/2-.5),T+3,b*4],{38:[[a*12,0,0],[0,0,0]]},{i,of:2,spin:'x'})));
  // step 39: grey base slides down the grooves
  add(box(W-2*T+1,D,.5,GREY),[0,T+D/2,-H/2+1.5],{39:[[0,D+8,0],[0,0,0]]});
  // step 40-41: back panel, wire, then lowered onto the sides
  const rO=[0,-yTop+.1,-44];
  const rm=add(box(W-2*T,T,H-1,WOOD),[0,yTop+T/2,-.5],{40:[rO,rO],41:[[0,13,-9],[0,0,0]]},{tilt:{40:[PI,PI],41:[-.75,0]},name:'rear'});rm.add(at(new T3.Mesh(bg(W-2*T-1,.14,.7),mat(0x3a4246)),0,-T/2-.05,-5));
  const wire=new T3.Group();const wm=new T3.TubeGeometry(new T3.CatmullRomCurve3([[-9,-1.4,0],[-9,.5,0],[-8.4,1.1,-.8],[-5,1.1,-.8],[-2,.6,-.8],[2,1.2,-.8],[6,.8,-.8],[8.4,1.1,-.8],[9,.5,0],[9,-1.4,0]].map(p=>new T3.Vector3(...p))),60,.22,6);
  const wmesh=new T3.Mesh(wm,mat(METAL));wire.add(wmesh);[-9,9].forEach(x=>[-.3,-.9].forEach(y=>wire.add(at(pm(cg(.34,.22,.28,10),METAL),x,y,0))));
    wire.rotation.x=PI;rm.add(wire);wire.position.set(0,-T/2-1.1,-5.9);parts.push({m:wire,pos:[0,-T/2-1.1,-5.9],keys:{40:[[0,-9,0],[0,0,0]]},mesh:wmesh,base:METAL,noRot:1});
  // step 42: long connectors through the sides, cams from the top
  [-1,1].forEach(a=>[-1,1].forEach((b,i)=>{add(pin145('x',a),[a*(W/2-3.56),yTop+.8,b*3.4+1],{42:[[a*14,0,0],[0,0,0]]},{i,of:2,win:[0,.5]});
    add(lock('y',1,'c'),[a*(W/2-5),yTop+T-.49,b*3.4+1],{42:[[0,12,0],[0,0,0]]},{i,of:2,win:[.45,1],spin:'y'})}));
  // step 43: rails and six screws
  [-1,1].forEach(a=>{const rl=add(rail(D-2,'y',a),[a*(W/2+.13),T+D/2,-H/2+1.6],{43:[[0,0,-7],[0,0,0]]},{win:[.35,.7]});
    [8,23,38].forEach((y,i)=>add(screw('x',a,{len:1}),[a*(W/2-.25),T+y,-H/2+1.6],{43:[[a*7,0,0],[0,0,0]]},{i,of:3,win:[.65,1],spin:'x',on:rl.userData.plate}))});
  const Y=new T3.Vector3(0,1,0),nY=new T3.Vector3(0,-1,0),X=new T3.Vector3(1,0,0),nX=new T3.Vector3(-1,0,0);
  fm.add(at(new T3.Mesh(bg(W-1,.14,.7),mat(0x3a4246)),0,T/2+.05,-H/2+1.5));
  parts.forEach(p=>{const k=Object.keys(p.keys)[0];if(p.m.userData.hr)p.tgt=k==='35'?fm:(k==='36'||k==='38')?SB[Math.sign(p.pos[0])]:k==='43'?(p.on||null):k==='42'&&Math.abs(p.keys[42][0][0])>0?SB[Math.sign(p.pos[0])]:k==='42'?rm:null});
  [-1,1].forEach(a=>[-1,1].forEach(b=>{drill(fm,new T3.Vector3(a*(W/2-.8),T/2,b*2.5),Y,.52,['37']);drill(SB[a],new T3.Vector3(0,-(D+T)/2,b*4),nY,.62,['37']);drill(rm,new T3.Vector3(a*(W/2-T),0,b*3.4+1.5),a>0?X:nX,.68,['42'])}));
  [-9,9].forEach(x=>drill(rm,new T3.Vector3(x,-T/2,-5.9),nY,.3,['40']));
  const rls={};parts.forEach(p=>{if(p.keys[43]&&p.m.userData.code==='10102042')rls[Math.sign(p.pos[0])]=p.m});parts.forEach(p=>{if(p.m===SB[1]||p.m===SB[-1]){p.side=Math.sign(p.pos[0]);p.pairM=SB[-p.side]}else if(p.keys[43]&&p.m.userData.code==='10102042'){p.side=Math.sign(p.pos[0]);p.pairM=rls[-p.side]}});
  parts.forEach(p=>{if(p.m===fm)p.lbl='抽屉前板';else if(p.m===rm)p.lbl='抽屉后板';else if(p.m===SB[1]||p.m===SB[-1])p.lbl='抽屉侧板';else if(p.keys[39])p.lbl='抽屉底板'});
  autoHoles(parts,scene,p=>p.tgt,p=>{const k=Object.keys(p.keys)[0];return[k,p.keys[k]]});
  hammer=new T3.Group();const hd=box(5,2.4,2.4,0x6d7478),hn=cyl(.55,14,0xa77c4f,'x');hn.position.x=8;hammer.add(hd,hn);scene.add(hammer);
  table=box(120,3,80,0xe1e4df);scene.add(table);table.position.set(0,-H/2-.9-T,21);
  cab=new T3.Group();const PX=W+4,SW=2*PX+W+0;[-W/2-2,W/2+2,W/2+2+PX].forEach(x=>{const q=box(2,68,70,WOOD);q.position.set(x,-1,-48);cab.add(q)});
  [0,PX].forEach(ox=>[-1,1].forEach(a=>[13,-8,-29].forEach(y=>{const r=box(.8,1.1,62,METAL);r.position.set(ox+a*(W/2+.8),y,-48);cab.add(r)})));
  const cw=2*PX+2,top=box(cw,2,70,WOOD);top.position.set(PX/2,33,-48);const base=box(cw,2,70,WOOD);base.position.set(PX/2,-35,-48);const bk=box(cw,68,1,GREY);bk.position.set(PX/2,-1,-83);cab.add(top,base,bk);
  const lv44=lever();lv44.position.set(-W/2-.8,29,-78);lv44.rotation.x=-1.1;cab.add(lv44);
  const ar=new T3.Mesh(new T3.TorusGeometry(7,.4,8,24,Math.PI*1.1),new T3.MeshBasicMaterial({color:0x2f8f6b}));ar.rotation.y=Math.PI/2;ar.position.set(-W/2+4,24,-72);const tip=new T3.Mesh(new T3.ConeGeometry(1.1,2.4,10),new T3.MeshBasicMaterial({color:0x2f8f6b}));tip.position.set(7,0,0);tip.rotation.z=Math.PI;ar.add(tip);cab.add(ar);window.__ar=ar;[ar,tip].forEach(m=>{m.material.depthTest=false;m.renderOrder=20});lv44.traverse(m=>{if(m.isMesh){m.material.depthTest=false;m.renderOrder=19}});window.__lv44=lv44;scene.add(cab);
  const lab=new T3.Mesh(new T3.PlaneGeometry(9,5),new T3.MeshBasicMaterial({color:0xf2c200,side:T3.DoubleSide}));lab.rotation.y=PI/2;lab.position.set(-W/2+T+.1,T+D/2,0);inner.add(lab);window.__lab=lab;scene.add(cab);
  const v=document.getElementById('animView');let drag=null;
  let vz=1,ox=0,oy=0,pinch=null;
  const applyView=()=>{if(!cam)return;const w=v.clientWidth,h=v.clientHeight;vz=Math.max(1,vz);ox=Math.max(-w*.6,Math.min(w-w/vz+w*.6,ox));oy=Math.max(-h*.6,Math.min(h-h/vz+h*.6,oy));if(vz<=1.001&&Math.abs(ox)<1&&Math.abs(oy)<1){vz=1;ox=oy=0;cam.clearViewOffset()}else cam.setViewOffset(w,h,ox,oy,w/vz,h/vz)};
  const zoomAt=(mx,my,nz)=>{nz=Math.max(1,Math.min(8,nz));ox+=mx/vz-mx/nz;oy+=my/vz-my/nz;vz=nz;applyView()};window._resetView=()=>{vz=1;ox=oy=0;applyView()};let panOn=false,pan=null;const pb=document.getElementById('animPan');if(pb)pb.onclick=()=>{panOn=!panOn;pb.textContent=panOn?'平移：开':'平移';pb.classList.toggle('primary',panOn);v.style.cursor=panOn?'grab':''};v.addEventListener('contextmenu',e=>e.preventDefault());
  v.addEventListener('wheel',e=>{e.preventDefault();const r=v.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,vz*Math.exp(-e.deltaY*.0016))},{passive:false});
  v.addEventListener('touchstart',e=>{if(e.touches.length===2){const[a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),z:vz,mx:(a.clientX+b.clientX)/2,my:(a.clientY+b.clientY)/2};drag=null;pan=null}},{passive:true});
  v.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){e.preventDefault();const[a,b]=e.touches,r=v.getBoundingClientRect();const mx=(a.clientX+b.clientX)/2,my=(a.clientY+b.clientY)/2;ox-=(mx-pinch.mx)/vz;oy-=(my-pinch.my)/vz;pinch.mx=mx;pinch.my=my;zoomAt(mx-r.left,my-r.top,pinch.z*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.d)}},{passive:false});
  v.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null});
  v.addEventListener('pointerdown',e=>{if(pinch)return;if(panOn||e.button!==0||e.shiftKey){pan=[e.clientX,e.clientY,ox,oy];v.setPointerCapture(e.pointerId);return}drag=[e.clientX,e.clientY,az,el,performance.now()];v.setPointerCapture(e.pointerId)});
  v.addEventListener('pointermove',e=>{if(pan){ox=pan[2]-(e.clientX-pan[0])/vz;oy=pan[3]-(e.clientY-pan[1])/vz;applyView();return}if(drag){az=drag[2]+(e.clientX-drag[0])*.008;el=clamp(drag[3]+(e.clientY-drag[1])*.006,-.6,.8)}});
  v.addEventListener('pointerup',e=>{if(pan){const m=Math.hypot(e.clientX-pan[0],e.clientY-pan[1]);pan=null;if(m>2)return}if(drag&&Math.hypot(e.clientX-drag[0],e.clientY-drag[1])<7&&performance.now()-drag[4]<450){const nm=window.PARTPICK&&PARTPICK(e);if(nm)window.dispatchEvent(new CustomEvent('partpick',{detail:{name:nm,src:'tap'}}));else openZoom(e)}drag=null});
  v.addEventListener('pointercancel',()=>drag=null);
  new ResizeObserver(size).observe(v);size();ready=true;
}
let auto=false,nextAuto=()=>false;
let ren2=null,cam2=null,zoomPt=null,zoomK=.3;
function curScene(){return IDS.includes(cur)?scene:sc2}
function openZoom(e){const v=document.getElementById('animView'),r=v.getBoundingClientRect(),m=new T3.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new T3.Raycaster();ray.setFromCamera(m,cam);
  const list=[];curScene().traverseVisible(o=>{if(o.isMesh)list.push(o)});const hit=ray.intersectObjects(list,false)[0];
  zoomPt=hit?hit.point.clone():ray.ray.at(cam.position.distanceTo(camTgt),new T3.Vector3());
  const box=document.getElementById('zoomBox');box.hidden=false;document.getElementById('zoomPlay').textContent=playing?'暂停':'播放';
  if(!ren2){ren2=new T3.WebGLRenderer({antialias:true,alpha:true});ren2.setPixelRatio(Math.min(devicePixelRatio,2));document.getElementById('zoomView').append(ren2.domElement);cam2=new T3.PerspectiveCamera(32,1,.5,600)}
  sizeZoom()}
function sizeZoom(){const z=document.getElementById('zoomView');if(!ren2||!z.clientWidth)return;ren2.setSize(z.clientWidth,z.clientHeight);cam2.aspect=z.clientWidth/z.clientHeight;cam2.updateProjectionMatrix()}
let full=false,fitMode='detail',FIT=null;
function poseAt(x){const k=t;t=x;if(IDS.includes(cur))apply();else applyCab(cur,x);curScene().updateMatrixWorld(true);t=k}
function activeObjs(){if(cur==='21')return[FR.back.g,FR.fold];if(IDS.includes(cur))return parts.filter(p=>{const k=p.keys[cur];return k&&(k[0].join()!==k[1].join())}).map(p=>p.m);
  const a=CP.filter(p=>p.keys[cur]).map(p=>p.m);GS.forEach(G=>{const q=G.seq[cur];if(q&&q[1]!==0&&q[0]!==q[1])a.push(G.g)});return a}
function allObjs(){if(IDS.includes(cur)){const o=parts.filter(p=>p.m.visible).map(p=>p.m);if(cur==='44')o.push(cab);return o}
  const o=GS.filter(G=>G.g.visible).map(G=>G.g);if(cur==='45')FR.drs.forEach(d=>o.push(d.g));return o}
function viewDir(){const c=IDS.includes(cur)?(CAMS[cur]||CAMS.def):camFor(cur);return new T3.Vector3(...c[0]).sub(new T3.Vector3(...c[1])).normalize()}
function computeFit(){if(!full||!cur||!ready||cur==='33'||cur==='45'){FIT=null;return}
  const box=new T3.Box3(),turn=['24','26','33','43','44','45'].includes(cur),samples=turn?[1]:[0,1];let list=fitMode==='detail'?activeObjs():[];
  if(!list.length||turn&&fitMode==='detail'&&cur!=='43'&&cur!=='24')list=null;
  poseAt(1);
  if(list&&list.length>1){const w=new T3.Vector3(),p0=new T3.Vector3();list[0].getWorldPosition(p0);const bigR=38;list=list.filter(o=>{o.getWorldPosition(w);return w.distanceTo(p0)<bigR})}
  samples.forEach(x=>{poseAt(x);(list||allObjs()).forEach(o=>{if(o.visible)box.expandByObject(o)})});
  poseAt(Math.min(t,1));
  if(box.isEmpty())return void(FIT=null);
  const ct=box.getCenter(new T3.Vector3()),d=viewDir(),up=new T3.Vector3(0,1,0),rt=new T3.Vector3().crossVectors(up,d).normalize(),u=new T3.Vector3().crossVectors(d,rt).normalize(),vt=Math.tan(cam.fov*Math.PI/360),ht=vt*cam.aspect;let D=0;
  for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const r=new T3.Vector3(x,y,z).sub(ct),a=Math.abs(r.dot(rt)),b=Math.abs(r.dot(u)),c=r.dot(d);D=Math.max(D,a/ht+c,b/vt+c)}
  FIT={ct,d,D:Math.max(D*1.14,26)}}
function camFit(){if(!FIT)return;const th=Math.atan2(FIT.d.x,FIT.d.z)+az,ph=clamp(Math.asin(FIT.d.y)+el,-.3,1.35),v=new T3.Vector3(Math.sin(th)*Math.cos(ph),Math.sin(ph),Math.cos(th)*Math.cos(ph)).multiplyScalar(FIT.D).add(FIT.ct);
  camPos.lerp(v,.16);camTgt.lerp(FIT.ct,.16);cam.position.copy(camPos);cam.lookAt(camTgt)}
function setFull(on){const box0=document.getElementById('anim'),b=document.getElementById('animFull');full=on;box0.classList.toggle('full',on);document.documentElement.classList.toggle('noscroll',on);b.textContent=on?'退出全屏':'全屏';
  if(on){const q=box0.requestFullscreen&&box0.requestFullscreen();if(q&&q.catch)q.catch(()=>{})}else if(document.fullscreenElement){const q=document.exitFullscreen();if(q&&q.catch)q.catch(()=>{})}setTimeout(()=>{size();computeFit()},80)}
function closeZoom(){document.getElementById('zoomBox').hidden=true;zoomPt=null}
function drawZoom(){if(!zoomPt||!ren2)return;const dir=cam.position.clone().sub(zoomPt),d=dir.length();cam2.position.copy(zoomPt).add(dir.normalize().multiplyScalar(d*zoomK));cam2.lookAt(zoomPt);ren2.render(curScene(),cam2)}
function size(){const v=document.getElementById('animView'),w=v.clientWidth,h=v.clientHeight;if(!w||!ren)return;ren.setSize(w,h);const as=w/h;cam.aspect=as;cam.fov=as<1.5?2*Math.atan(Math.tan(16*Math.PI/180)*1.5/as)*180/Math.PI:32;cam.updateProjectionMatrix()}
function apply(){
  mark(cur);
  CENTER=root.position;
  const n=IDS.indexOf(cur);
  parts.forEach(p=>{const ks=Object.keys(p.keys),first=+ks[0],lastK=+ks[ks.length-1],s=+cur;
    if(s<first){p.m.visible=false;return}p.m.visible=true;
    let k=p.keys[s],local=t;
    const col=(p.mesh||p.m).material;
    if(k){const [a,b]=p.win||[0,1];local=clamp((t-a)/(b-a));if(p.of){const gap=.5/p.of;local=clamp((local-p.i*gap)/(1-(p.of-1)*gap))}local=ease(local);
      p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],local),p.pos[1]+lerp(k[0][1],k[1][1],local),p.pos[2]+lerp(k[0][2],k[1][2],local));
      tint(p.mesh||p.m,k[0].join()!==k[1].join()&&local<1&&t<1);
    }else{p.m.position.set(...p.pos);tint(p.mesh||p.m,false)}
    if(!p.noRot)p.m.rotation.set(0,0,0);if(p.tilt&&p.tilt[s]&&k){const r=lerp(p.tilt[s][0],p.tilt[s][1],local);p.m.rotation[s==='41'?'z':'x']=r}
    if(p.spin&&k){const a=local*Math.PI*3;p.m.rotation[p.spin]=a}
  });
  const q0=new T3.Quaternion(),q1=new T3.Quaternion().setFromEuler(new T3.Euler(Math.PI/2,0,0)),q2=new T3.Quaternion().setFromEuler(new T3.Euler(-Math.PI/2,0,0));
  const ok=ease(clamp(t/.35)),s=cur;
  if(s==='43'){T3.Quaternion.slerp?T3.Quaternion.slerp(q0,q1,root.quaternion,ok):root.quaternion.copy(q0).slerp(q1,ok);root.position.set(0,lerp(0,0,ok),0)}
  else if(s==='44'){const k1=ease(clamp(t/.4)),k2=ease(clamp((t-.4)/.6));root.quaternion.copy(q1).slerp(q2,k1);root.position.set(0,lerp(0,21,k1)+Math.max(0,.9-k2)*6,lerp(0,58,k1)+lerp(0,-94,k2));root.quaternion.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),clamp((1-k2)*3)*.0+(k2>.75?(1-k2)*.5:0)));}
  else{root.quaternion.copy(q0);root.position.set(0,0,0)}
  table.visible=s==='43';cab.visible=s==='44';if(window.__ar){window.__ar.visible=s==='44'&&t>.72;window.__lv44.visible=s==='44'&&t>.6}if(window.__lab)window.__lab.visible=s==='44';
  hammer.visible=s==='40';if(s==='40'){const k=(t*5)%1;hammer.position.set(13,5+Math.abs(Math.sin(k*Math.PI))*7-D/2-T,-44);hammer.rotation.z=-.15}
  const c=CAMS[s]||CAMS.def;const tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.12):want.clone();camTgt=camTgt?camTgt.lerp(tp,.12):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}
function frame(ts){raf=requestAnimationFrame(frame);if(!ready||!cur)return;const dt=Math.min(.05,(ts-last)/1000||0);last=ts;
  if(playing){t+=dt*speed/4/(DUR[cur]||1);if(auto&&t>=1.12){if(zoomPt||!nextAuto())t=1.12}else if(t>=1.15)t=0}
  const sl=document.getElementById('animT');if(sl&&document.activeElement!==sl)sl.value=Math.round(Math.min(t,1)*100);
  const keep=t;t=Math.min(t,1);if(IDS.includes(cur))apply();else applyCab(cur,t);camFit();ren.render(curScene(),cam);drawLabels();drawZoom();t=keep}
const CAP={'35':'4 个 118331 拧入前板','36':'每块侧板插 2 根木销','37':'两块侧板插到前板上','38':'4 个 120076 放入并转动锁紧','39':'灰色底板沿槽插入','40':'用锤子敲入 1 根联锁杆','41':'后板盖到两块侧板上','42':'先插 4 个 145718，再锁 4 个 120076','43':'抽屉倒扣放桌面，装滑轨并拧 6 颗螺丝','44':'翻回正面，沿滑轨推入柜体'};
function fail(){failed=true;document.getElementById('anim').hidden=true}
async function show(id){const box0=document.getElementById('anim');if(window._resetView)window._resetView();const on=IDS.includes(id)||CIDS.includes(id);box0.hidden=!on||failed;
  if(!on){if(full)setFull(false);cur=null;cancelAnimationFrame(raf);raf=0;return}
  closeZoom();const lb=byId[id].label||('第 '+id+' 步');document.getElementById('animCap').textContent=lb+' · '+(CAP[id]||byId[id].title);cur=id;t=0;az=0;el=0;
  try{await load();if(!ready){build();buildCab();makeLook(scene);makeLook(sc2);setLook(realLook)}computeFit();buildLabels();if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}}catch(e){fail()}}
const mq=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;if(mq)playing=false;
function ui(){const p=document.getElementById('animPlay');p.textContent=playing?'暂停':'播放';
  p.onclick=()=>{playing=!playing;if(playing&&t>=1)t=0;p.textContent=playing?'暂停':'播放'};
  const s=document.getElementById('animSlow');s.onclick=()=>{speed=speed===1?.45:1;s.textContent=speed===1?'慢放':'正常速度'};
  document.getElementById('animT').oninput=e=>{t=e.target.value/100;playing=false;p.textContent='播放'};
  const ab=document.getElementById('animAuto');ab.onclick=()=>{auto=!auto;ab.textContent=auto?'停止连续':'连续播放';ab.classList.toggle('primary',auto);if(auto){playing=true;p.textContent='暂停'}};
  const lb=document.getElementById('animLbl');lb.textContent=showLbl?'隐藏标签':'显示标签';lb.onclick=()=>{showLbl=!showLbl;lb.textContent=showLbl?'隐藏标签':'显示标签';try{localStorage.setItem('stork-labels',showLbl?'on':'off')}catch(e){}};
  document.getElementById('animLook').onclick=()=>setLook(!realLook);
  document.getElementById('animFull').onclick=()=>setFull(!full);
  document.getElementById('fMode').onclick=e=>{fitMode=fitMode==='detail'?'all':'detail';e.target.textContent=fitMode==='detail'?'看整体':'看细节';computeFit()};
  new ResizeObserver(()=>{if(full)computeFit()}).observe(document.getElementById('animView'));
  document.getElementById('fPrev').onclick=()=>window.goStep(-1);document.getElementById('fNext').onclick=()=>window.goStep(1);
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&full)setFull(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&full)setFull(false)});
  document.getElementById('zoomClose').onclick=closeZoom;
  document.getElementById('zoomIn').onclick=()=>{zoomK=Math.max(.12,zoomK*.75)};
  document.getElementById('zoomOut').onclick=()=>{zoomK=Math.min(.7,zoomK/.75)};
  document.getElementById('zoomPlay').onclick=()=>{p.onclick();document.getElementById('zoomPlay').textContent=p.textContent};
  addEventListener('resize',sizeZoom);
  document.getElementById('animRe').onclick=()=>{t=0;playing=true;p.textContent='暂停'}}
return{_fit:()=>FIT&&{D:FIT.D},setNext:f=>{nextAuto=f},stopAuto:()=>{auto=false;const a=document.getElementById('animAuto');a.textContent='连续播放';a.classList.remove('primary');const p=document.getElementById('animPlay');playing=false;p.textContent='播放'},show,ui,_zoom:()=>!!zoomPt,_set:(id,v)=>{cur=id;t=v;playing=false}};
})();
