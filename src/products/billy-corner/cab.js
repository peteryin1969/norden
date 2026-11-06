/* BILLY corner bookcase. Real sizes from the product images: 80 and 40 wide, 28 deep, 202 high, extension 35 high, footprint 136 x 136. Thickness and hole positions are estimates from the line drawings. */
const CIDS=STEPS_ORDER;
const ORD=id=>CIDS.indexOf(id);
let sc2,GS=[],CP=[],FR={},cabReady=false;
const PI=Math.PI,F={f:[0,0,0]},UW=80,UM=40,UD=28,UH=202,EH=35,TK=2,BDP=26,BZ=.75,BKZ=-12.4,BKH=195.3,BKY=104.15,PLH=6.5,FIXY=101,FOOT=136,YBOT=PLH+1,YTOP=UH-1,SHY=[39.6,65.2,138.8,164.4],CZ=9,DZ=4,CAMIN=2.8,GRV=.4,MID=31.7,LIFT=.15,LIPGAP=5.5;
const lazyQ=(x,y,z,a)=>({get:()=>new T3.Quaternion().setFromAxisAngle(new T3.Vector3(x,y,z),a)}),qZ=lazyQ(0,0,1,-PI/2),qX=lazyQ(1,0,0,PI/2);
function grp(name,body,final,seq,opt={}){const g=new T3.Group();if(body)g.add(body);sc2.add(g);const G={g,name,body,final,seq,...opt};GS.push(G);FR[name]=G;return G}
function pt(G,m,pos,keys,o={}){m.position.set(...pos);(G?G.g:sc2).add(m);CP.push({m,pos,keys,G,...o});return m}
const hl=(m,p,n,r,s)=>drill(m,new T3.Vector3(...p),new T3.Vector3(...n),r,s);
function frameOf(id,t){const I=new T3.Quaternion(),S=qZ.get(),B=qX.get();let q=I,x=0,y=0,z=0;const n=ORD(id),o=k=>ORD(k);const sideB=[-UH/2,UW/2,0],backB=[0,14,-UH/2],sideE=[-EH/2,UW/2,0];
  const mix=(qa,qb,a,b,k)=>{q=qa.clone().slerp(qb,k);x=lerp(a[0],b[0],k);y=lerp(a[1],b[1],k)+Math.sin(k*PI)*(id==='B12'?30:36);z=lerp(a[2],b[2],k)};
  if(n>=o('B2')&&n<=o('B7')){q=S;[x,y,z]=sideB}else if(id==='B8')mix(S,B,sideB,backB,ease(clamp(t/.3)));else if(n>=o('B9')&&n<=o('B11')){q=B;[x,y,z]=backB}else if(id==='B12')mix(B,I,backB,[0,0,0],ease(clamp(t/.32)));
  else if(n>=o('E3')&&n<=o('E8')){q=S;[x,y,z]=sideE}else if(id==='E9')mix(S,I,sideE,[0,0,0],ease(clamp(t/.3)));
  return{q,t:new T3.Vector3(x,y,z)}}
function resolve(G,spec,fr){const v=new T3.Vector3(),q=new T3.Quaternion(),o=spec.f||[0,0,0];v.set(G.final[0]+o[0],G.final[1]+o[1],G.final[2]+o[2]).applyQuaternion(fr.q).add(fr.t);q.copy(fr.q);if(spec.ry)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0,1,0),spec.ry));if(spec.rx)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),spec.rx));return{v,q}}
function panel(h,foot,a){const D=UD/2,uvf=g=>{const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i)*.0065+.2,p.getZ(i)*.024+.1);return g};
  const mk=(sh,t,X)=>{const g=new T3.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false});g.applyMatrix4(new T3.Matrix4().set(0,0,-1,X,0,1,0,-h/2,1,0,0,0,0,0,0,1));uvf(g);const m=new T3.Mesh(g,mat(WOOD));m.userData.uvOak=true;m.add(new T3.LineSegments(new T3.EdgesGeometry(g,20),EDGE()));return m};
  const s=new T3.Shape();s.moveTo(D,0);if(foot){s.lineTo(-D+2.6,0);s.quadraticCurveTo(-D+1.6,1,-D+1.6,2.5);s.lineTo(-D+1.6,7);s.quadraticCurveTo(-D+1.6,8.6,-D,8.8)}else s.lineTo(-D,0);s.lineTo(-D,h);s.lineTo(D,h);s.closePath();
  if(!a)return mk(s,TK,TK/2);const rc=(z0,z1,y0)=>{const q=new T3.Shape();q.moveTo(z1,y0);q.lineTo(z0,y0);q.lineTo(z0,h);q.lineTo(z1,h);q.closePath();return q};
  const m=mk(s,TK-GRV,a>0?TK/2:TK/2-GRV),X=a>0?-TK/2+GRV:TK/2;m.add(mk(rc(BKZ+.15,D,0),GRV,X),mk(rc(-D,BKZ-.15,foot?8.8:0),GRV,X));return m}
function dots(m,a,h){const ys=[];for(let y=h<50?10.4:14;y<h-(h<50?5:8);y+=3.2)if(Math.abs(y-FIXY)>5)ys.push(y);const n=ys.length*2,im=new T3.InstancedMesh(new T3.CircleGeometry(.22,8),new T3.MeshBasicMaterial({color:HOLE}),n),o=new T3.Object3D();ys.forEach((y,i)=>[-9.5,9.5].forEach((z,j)=>{o.position.set(-a*(TK/2+.04),y-h/2,z+BZ);o.rotation.set(0,-a*PI/2,0);o.updateMatrix();im.setMatrixAt(i*2+j,o.matrix)}));m.add(im)}
function dot(m,p,n,r){const c=new T3.Mesh(new T3.CircleGeometry(r,16),new T3.MeshBasicMaterial({color:HOLE}));c.position.set(...p);c.quaternion.setFromUnitVectors(new T3.Vector3(0,0,1),new T3.Vector3(...n));m.add(c)}
function dw(a,r,code,l=2.4){const m=dowel('x',a,r,l);m.userData.code=code;return m}
function nail(){const g=new T3.Group();g.add(at(pm(cg(.12,.12,2,8),STEEL),0,0,0),at(pm(cg(.36,.28,.12,12),STEEL),0,1.05,0));const o=point(g,'z',-1);o.userData.code='101201';return o}
function pin131(a){const g=new T3.Group();g.add(at(pm(cg(.3,.3,1.2,10),STEEL),0,-.6,0),at(pm(cg(.62,.62,.2,14),STEEL),0,.1,0));const o=point(g,'x',-a);o.add(at(pm(bg(1,.14,1),STEEL),-a*.5,.55,0));o.userData.code='131372';return o}
function lbrk(){const g=new T3.Group();g.add(at(pm(bg(2.6,.25,7.4),ZINC),0,.13,3.82),at(pm(bg(2.6,5,.25),ZINC),0,2.5,.12),at(pm(bg(.7,.04,3.6),DARK),0,.27,4.6),at(pm(bg(.7,2.4,.04),DARK),0,3,.26));g.userData.code='106989';return g}
function washer(axis,sign){const g=new T3.Group();g.add(pm(cg(.95,.95,.12,20),ZINC),at(pm(cg(.3,.3,.14,12),DARK),0,0,0));const o=point(g,axis,sign);o.userData.code='100823';return o}
function sc(code,o,axis='y',sign=1){const m=screw(axis,sign,o);m.userData.hr=0;m.userData.code=code;return m}
function brkSet(G,top,yT,zR,xs,s,w,wall,static0){xs.forEach((x,i)=>{const a=w+i*.17,st=static0;
  if(!st)hl(top,[x,yT,zR+4.4],[0,1,0],.32,[s]);const go=(m,pos,off,win,o={})=>pt(G,m,pos,st?{[st]:[[0,0,0],[0,0,0]]}:{[s]:[off,[0,0,0]]},{win,...o,quiet:!!st,onlyS:s==='B12'?['B12']:undefined});
  go(lbrk(),[x,yT,zR],[0,9,0],[a,a+.05]);go(washer('y',1),[x,yT+.31,zR+4.4],[0,7,0],[a+.05,a+.08]);go(sc('109041',{r:.22,len:1.7}),[x,yT+.37-.85,zR+4.4],[0,8,0],[a+.08,a+.12],st?{}:{spin:'y'})})}
function wallFix(G,x,y,zR,s,win){const[a,b]=win;pt(G,washer('z',1),[x,y,zR+.31],{[s]:[[0,0,7],[0,0,0]]},{win:[a,a+(b-a)*.4]});pt(G,sc('墙螺丝',{r:.28,len:3.2}, 'z',1),[x,y,zR+.38-1.6-.21],{[s]:[[0,0,9],[0,0,0]]},{win:[a+(b-a)*.4,b],spin:'z',lbl:'墙螺丝（另购）'})}
function link(p1,p2){const g=new T3.Group(),L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),e=1.6;const ey=x=>{const m=pm(cg(1,1,.18,20),ZINC);g.add(at(m,x,0,0));g.add(at(pm(cg(.34,.34,.2,12),DARK),x,0,0))};ey(-L/2);ey(L/2);g.add(at(pm(bg(.9,.18,1.8),ZINC),-L/2+1.1,0,0),at(pm(bg(.9,.18,1.8),ZINC),L/2-1.1,0,0),at(pm(bg(L-2*e-.1,.18,1.5),ZINC),0,-.78,0),at(pm(bg(.16,.9,1.5),ZINC),-L/2+e,-.4,0),at(pm(bg(.16,.9,1.5),ZINC),L/2-e,-.4,0));const o=new T3.Group();g.rotation.y=-Math.atan2(p2[1]-p1[1],p2[0]-p1[0]);o.add(g);o.userData.code='115257';return o}
function angle(){const g=new T3.Group();g.add(at(pm(bg(2,.22,2.4),ZINC),0,.11,1.2),at(pm(bg(2,2.4,.22),ZINC),0,1.2,.11));const a=pm(cg(.34,.34,.26,12),DARK);g.add(at(a,0,.11,1.5));const b=pm(cg(.34,.34,.26,12),DARK);b.rotation.x=PI/2;g.add(at(b,0,1.5,.11));g.userData.code='102715';return g}
function vPlate(p){const g=new T3.Group(),arm=(a,b,w)=>{const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),o=new T3.Group();o.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2);o.rotation.y=Math.atan2(dx,dz);const LP=L-LIPGAP;o.add(at(pm(bg(w,.12,L),ZINC),0,.06,0),at(pm(bg(.12,1.3,LP),ZINC),-w/2,.65,LIPGAP/2),at(pm(bg(.12,1.3,LP),ZINC),w/2,.65,LIPGAP/2));g.add(o)};arm(p[0],p[1],2.5);arm(p[0],p[2],2.5);g.add(at(pm(bg(3.4,.12,3.4),ZINC),p[0][0],.06,p[0][1]));g.userData.code='转角底板';return g}
function unitS(w){const g=new T3.Group(),b=w-2*TK,pL=panel(UH,true,-1),pR=panel(UH,true,1);pL.position.set(-w/2+TK/2,UH/2,0);pR.position.set(w/2-TK/2,UH/2,0);dots(pL,-1,UH);dots(pR,1,UH);g.add(pL,pR);
  [YBOT,FIXY,YTOP].forEach(y=>g.add(at(box(b,TK,BDP,WOOD),0,y,BZ)));g.add(at(box(b,PLH,TK,WOOD),0,PLH/2,BZ+12),at(box(b+.8,BKH,.3,GREY),0,BKY,BKZ));SHY.forEach(y=>{g.add(at(box(b-.2,TK,BDP-1,WOOD),0,y+1.62,BZ));[-1,1].forEach(a=>[-9.5,9.5].forEach(z=>g.add(at(pm(bg(1,.14,1),STEEL),a*(b/2-.5),y+.55,z+BZ))))});
  [-1,1].forEach(a=>[-1,1].forEach(z=>dot(g,[a*(b/2-CAMIN),UH+.02,z*CZ+BZ],[0,0,1],.01)));[-1,1].forEach(a=>[-1,1].forEach(z=>{const c=at(pm(cg(.76,.76,.08,18),STEEL),a*(b/2-CAMIN),UH+.02,z*CZ+BZ);g.add(c)}));
  g.userData.pL=pL;g.userData.pR=pR;return g}
function extS(w,withB){const g=new T3.Group(),b=w-2*TK,pL=panel(EH,false),pR=panel(EH,false);pL.position.set(-w/2+TK/2,EH/2,0);pR.position.set(w/2-TK/2,EH/2,0);dots(pL,-1,EH);dots(pR,1,EH);g.add(pL,pR);const top=box(b,TK,25.6,WOOD);g.add(at(top,0,EH-1,.2));const bkv=box(b,EH,1.2,WOOD);bkv.userData.vert=true;g.add(at(bkv,0,EH/2,-13.2));
  [-1,1].forEach(a=>[-1,1].forEach(z=>g.add(at(pm(cg(.76,.76,.08,18),STEEL),a*(b/2-CAMIN),EH+.02,z*CZ+.2))));
  g.userData.pL=pL;g.userData.pR=pR;g.userData.top=top;return g}
function bolt108(){const g=new T3.Group();g.add(at(pm(cg(.3,.3,2,10),STEEL),0,-1,0),at(pm(helix(.4,1.9,6,.09),STEEL),0,0,0),at(pm(cg(.42,.42,1.6,12),ZINC),0,.8,0),at(pm(cg(.24,.24,.8,10),STEEL),0,2,0),at(pm(cg(.44,.44,.36,14),STEEL),0,2.6,0));cross(g,.34,2.8);g.userData.code='108001';return g}
function hammerRig(){const root=new T3.Group(),sw=new T3.Group();root.add(sw);const L=18,GL=0xeef0ec;
  const ed=(m,th=25)=>{m.add(new T3.LineSegments(new T3.EdgesGeometry(m.geometry,th),EDGE()));return m};
  const xc=(r0,r1,l,x,col,y=0)=>{const m=ed(pm(cg(r0,r1,l,18),col));m.rotation.z=-PI/2;m.position.set(x,y,0);return m};
  sw.add(xc(.42,.42,L,L/2,STEEL),xc(.78,.68,7,3.4,DARK));
  const n=ed(pm(cg(.95,.95,2.3,20),STEEL));n.position.set(L,-.75,0);sw.add(n);const fc=ed(pm(cg(1.2,1.05,.5,20),STEEL));fc.position.set(L,-2,0);sw.add(fc);const ck=ed(pm(bg(1.9,1.3,1.5),STEEL));ck.position.set(L,.45,0);sw.add(ck);
  const s=new T3.Shape();s.moveTo(.95,.5);s.quadraticCurveTo(1.1,3.1,-3,3.5);s.quadraticCurveTo(-.9,2.2,-.95,.5);s.closePath();
  [-.42,.42].forEach(z=>{const g=new T3.ExtrudeGeometry(s,{depth:.56,bevelEnabled:false});g.translate(L,0,z-.28);sw.add(ed(pm(g,STEEL),30))});
  const palm=ed(pm(bg(3.8,2.5,2.3),GL));palm.position.set(2.6,.25,0);sw.add(palm);for(let k=0;k<4;k++){const f=ed(pm(cg(.52,.52,2.5,10),GL));f.rotation.x=PI/2;f.position.set(1.15+k*.98,-1.05,0);sw.add(f)}const th=ed(pm(cg(.5,.42,2.6,10),GL));th.rotation.z=-PI/2+.35;th.position.set(3.2,1.1,.9);sw.add(th);
  root.add(xc(1.45,1.75,2.6,-.6,GL),xc(1.75,2.1,7,-5.4,GL));root.scale.setScalar(1.4);return{root,sw,L:L*1.4}}
function tapL(p,tt){const[a,b]=p.tap,n=p.taps||3,u=clamp((tt-a)/(b-a)),v=clamp((u-.3)/.7)*n,cnt=Math.min(n,Math.floor(v+.55));return .82*ease(clamp(u/.3))+.18*cnt/n}
function hammerAt(s,tt){const list=CP.filter(p=>p.tap&&p.keys[s]);const H=FR.ham;H.root.visible=false;if(!list.length)return;const p=list.find(q=>tt<q.tap[1]);if(!p||tt<p.tap[0])return;const[a,b]=p.tap,n=p.taps||3,u=clamp((tt-a)/(b-a));if(u<.08)return;H.root.visible=true;
  const A=.85,v=clamp((u-.3)/.7)*n,f=v%1,ang=u<.3||v>=n?A:f<.45?A*(1-(f/.45)**2):A*ease((f-.45)/.55);
  p.m.updateWorldMatrix(true,true);const bx=new T3.Box3().setFromObject(p.m);const X=new T3.Vector3(0,0,1),Y=new T3.Vector3(0,1,0),Z=X.clone().cross(Y);const hit=new T3.Vector3((bx.min.x+bx.max.x)/2,bx.max.y,(bx.min.z+bx.max.z)/2);H.root.position.copy(hit).add(Y.clone().multiplyScalar(3.15)).sub(X.clone().multiplyScalar(H.L));
  H.root.quaternion.setFromRotationMatrix(new T3.Matrix4().makeBasis(X,Y,Z));H.sw.rotation.z=ang}
function buildCab(){
  sc2=new T3.Scene();sc2.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(150,300,190);d.target.position.set(40,60,40);sc2.add(d.target);d.castShadow=true;d.shadow.mapSize.set(2048,2048);Object.assign(d.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:10,far:700});d.shadow.bias=-.0012;d.shadow.radius=4;sc2.add(d);FR.sun=d;
  FR.floor=box(1600,1,1600,0xdfe2dd);FR.floor.position.set(0,-.5,0);FR.floor.remove(FR.floor.children[0]);sc2.add(FR.floor);
  /* one bookcase, 80 wide; the 40 wide unit uses the same steps */
  const b=UW-2*TK,xP=UW/2-TK/2;
  const pR=panel(UH,true,1),pL=panel(UH,true,-1);dots(pR,1,UH);dots(pL,-1,UH);
  const gpR=grp('panR',pR,[xP,UH/2,0],{B2:[{f:[0,0,-17]},0],B3:[{f:[0,0,-17]},F]},{a:'B2',z:'B14',moveAt:{B3:.15},anchor:[0,50,8]});
  const gpL=grp('panL',pL,[-xP,UH/2,0],{B2:[{f:[UW-TK,0,17],ry:PI},0],B3:null,B4:null,B5:null,B6:[{f:[-26,0,0]},F]},{a:'B2',z:'B14',startAt:{B6:.1},moveAt:{B6:.8},anchor:[0,50,8]});
  const BB=[['bot',YBOT,'B3',.15,.55],['mid',FIXY,'B3',.55,.95],['top',YTOP,'B5',0,.45]];const bo={};
  BB.forEach(([n,y,s,a,c],i)=>{const m=box(b,TK,BDP,WOOD);bo[n]=m;const seq={B1:[{f:[0,1-y,(i-1.5)*34-BZ],rx:n==='top'?PI:0},0],B2:null,B3:null,B4:null,[s]:[{f:[-26,0,0]},F]};if(n!=='top')delete seq.B4;if(n==='top')delete seq.B4,seq.B3=null,seq.B4=null;grp(n,m,[0,y,BZ],seq,{a:'B1',z:'B14',startAt:{[s]:a},moveAt:{[s]:c},anchor:[-20,TK/2,0]})});
  const plM=box(b,PLH,TK,WOOD);grp('plinth',plM,[0,PLH/2,BZ+12],{B1:[{f:[0,1-PLH/2+2.25,1.5*34-BZ-12]},0],B2:null,B3:[{f:[-26,0,0]},F]},{a:'B1',z:'B14',startAt:{B3:.15},moveAt:{B3:.55},anchor:[-20,PLH/2,0]});
  let di=0;const DW=(G,m,y,z,a,s0,sR,sL)=>{const end=a*b/2;hl(m,[end,y,z],[a,0,0],.45,['B1',a>0?sR:sL]);pt(G,dw(a,.4,'101351'),[a*(b/2-.1),y,z],{B1:[[a*9,0,0],[0,0,0]]},{i:di++,of:16,win:[.04,1]})};
  [['bot','B3'],['mid','B3'],['top','B5']].forEach(([n,s])=>[-1,1].forEach(a=>{const G=FR[n],m=bo[n],Y=FR[n].final[1];[-DZ,DZ].forEach(z=>{DW(G,m,0,z,a,0,s,'B6');const P=a>0?pR:pL;hl(P,[-a*TK/2,Y-UH/2,z+BZ],[-a,0,0],.45,[a>0?s:'B6'])})}));
  [-1,1].forEach(a=>[-1.6,1.6].forEach(y=>{DW(FR.plinth,plM,y,0,a,0,'B3','B6');const P=a>0?pR:pL;hl(P,[-a*TK/2,PLH/2+y-UH/2,BZ+12],[-a,0,0],.45,[a>0?'B3':'B6'])}));
  let ci=0;[[YBOT,'bot'],[FIXY,'mid'],[YTOP,'top']].forEach(([y,n])=>[-1,1].forEach(a=>[-CZ,CZ].forEach(z=>{const G=a>0?gpR:gpL,P=a>0?pR:pL;hl(P,[-a*TK/2,y-UH/2,z+BZ],[-a,0,0],.5,['B2']);pt(G,conn('x',-a),[-a*(TK/2+.28),y-UH/2,z+BZ],{B2:[[-a*8,0,0],[0,0,0]]},{i:ci++,of:12,win:[.03,1],spin:'x'});G.g.children[G.g.children.length-1].scale.setScalar(.8);hl(bo[n],[a*b/2,0,z],[a,0,0],.5,[n==='top'?(a>0?'B5':'B6'):(a>0?'B3':'B6')])})));
  const CAM=[[ 'bot',-1,1,'B4',0,4],['mid',-1,1,'B4',2,4],['top',1,1,'B5',0,2],['bot',-1,-1,'B7',0,6],['mid',-1,-1,'B7',2,6],['top',1,-1,'B7',4,6]];
  CAM.forEach(([n,sg,a,s,i0,of])=>[-CZ,CZ].forEach((z,j)=>{const x=a*(b/2-CAMIN);hl(bo[n],[x,sg*TK/2,z],[0,sg,0],.8,[s]);Object.assign(MARKS[MARKS.length-1],{after:s,tt:.96});const m=lock('y',sg,'a');m.scale.setScalar(.8);pt(FR[n],m,[x,sg*(TK/2-.58),z],{[s]:[[0,sg*7,0],[0,0,0]]},{i:i0+j,of,win:s==='B5'?[.5,1]:[.03,1],spin:'y',seq:1,cam:1})}));
  FR.mk=[-1,1].map(a=>{const m=box(.9,.06,.25,DARK);m.position.set(a*xP,FIXY,-14.04);sc2.remove(m);return m});
  /* back sheet: folded in two until step 9 */
  const SW=25.6,bkC=box(SW,BKH,.3,GREY),bkG=new T3.Group();bkG.add(bkC);FR.fold=[-1,1].map(k=>{const q=new T3.Group(),st=box(SW,BKH,.3,GREY);st.position.x=k*SW/2;q.position.x=k*SW/2;q.add(st);bkG.add(q);return q});
  const gBack=grp('back',bkG,[0,BKY,BKZ],{B9:[{f:[0,-(UH+14),0]},F]},{a:'B9',z:'B14',startAt:{B9:.34},anchor:[0,0,-.2]});
  const YR=[YTOP,FIXY,YBOT];let ni=0;YR.forEach(y=>[-.5,-.3,-.1,.1,.3,.5].forEach(k=>{const i=ni++,x=k*b*.94;pt(gBack,nail(),[x,y-BKY,.85],{B11:[[0,0,-3],[0,0,0]]},{tap:[.03+i*.053,.03+(i+1)*.053],taps:2,side:1})}));
  FR.line=box(b,.05,.04,DARK);FR.line.position.set(0,FIXY-BKY,-.17);gBack.g.add(FR.line);
  pt(gBack,box(84,3.2,.25,0xe7c65a),[0,FIXY-BKY+1.8,-1.725],{B10:[[0,0,-12],[0,0,0]]},{win:[0,.3],onlyS:['B10'],lbl:'直尺（自备）'});
  const pc=new T3.Group();pc.add(at(pm(cg(.3,.3,8,10),0xe0b040),0,4.4,0),at(pm(cg(.3,.02,.8,10),0x333b3f),0,0,0));pc.rotation.z=.3;pc.rotation.x=-.3;sc2.add(pc);FR.pencil=pc;
  /* wall brackets and pins */
  brkSet(FR.top,bo.top,TK/2,-14-BZ,[-UW/4,UW/4],'B12',.36,1);
  let pi=0;SHY.forEach(y=>[-1,1].forEach(a=>[-9.5,9.5].forEach(z=>{const G=a>0?gpR:gpL,P=a>0?pR:pL;hl(P,[-a*TK/2,y-UH/2,z+BZ],[-a,0,0],.3,['B13']);pt(G,pin131(a),[-a*(TK/2),y-UH/2,z+BZ],{B13:[[-a*6,0,0],[0,0,0]]},{i:pi++,of:16,win:[.03,1],seq:1})})));
  SHY.forEach((y,i)=>{grp('s'+i,box(b-.2,TK,BDP-1,WOOD),[0,y+1.62,BZ],{B14:[{f:[0,5,34]},F]},{a:'B14',z:'B14',startAt:{B14:i*.22},moveAt:{B14:i*.22+.3},anchor:[0,TK/2,6]})});
  FR.wall=box(420,290,1,0xeceee9);FR.wall.position.set(0,145,-14.8);sc2.add(FR.wall);
  /* one extension, 80 wide */
  const eR=panel(EH,false),eL=panel(EH,false);dots(eR,1,EH);dots(eL,-1,EH);const egR=grp('eR',eR,[xP,EH/2,0],{E3:[{f:[0,0,-17]},0],E4:[{f:[0,0,-17]},F]},{a:'E3',z:'E9',moveAt:{E4:.15},anchor:[0,0,8]});
  const egL=grp('eL',eL,[-xP,EH/2,0],{E3:[{f:[UW-TK,0,17],ry:PI},0],E4:null,E5:[{f:[-26,0,0]},F]},{a:'E3',z:'E9',moveAt:{E5:.8},anchor:[0,0,8]});
  const eT=box(b,TK,25.6,WOOD),eB=box(b,EH,1.2,WOOD);eB.userData.vert=true;
  const egT=grp('eT',eT,[0,EH-1,.2],{E1:[{f:[0,2-EH,-18]},0],E2:null,E3:null,E4:[{f:[-26,0,0]},F]},{a:'E1',z:'E9',startAt:{E4:.15},moveAt:{E4:.55},anchor:[-20,1,0]});
  const egB=grp('eB',eB,[0,EH/2,-13.2],{E1:null,E2:[{f:[0,.6-EH/2,13.2],rx:PI/2},0],E3:null,E4:[{f:[-26,0,0]},F]},{a:'E2',z:'E9',startAt:{E4:.55},moveAt:{E4:.95},anchor:[-20,0,-.6]});eB.visible=true;
  egB.rotE2=true;
  let e1=0,e2=0;[-1,1].forEach(a=>[-DZ,DZ].forEach(z=>{hl(eT,[a*b/2,0,z],[a,0,0],.45,['E1','E4']);pt(egT,dw(a,.4,'101351'),[a*(b/2-.1),0,z],{E1:[[a*9,0,0],[0,0,0]]},{i:e1++,of:4,win:[.03,1]});const P=a>0?eR:eL;hl(P,[-a*TK/2,EH/2-1,z+.2],[-a,0,0],.45,[a>0?'E4':'E5'])}));
  [-1,1].forEach(a=>[-8,8].forEach(y=>{hl(eB,[a*b/2,y,0],[a,0,0],.3,['E2','E4']);pt(egB,dw(a,.27,'101345',2.2),[a*(b/2-.1),y,0],{E2:[[a*9,0,0],[0,0,0]]},{i:e2++,of:4,win:[.03,1]});const P=a>0?eR:eL;hl(P,[-a*TK/2,y,-13.2],[-a,0,0],.3,[a>0?'E4':'E5'])}));
  let ec=0;[-1,1].forEach(a=>{const G=a>0?egR:egL,P=a>0?eR:eL;[[EH/2-1,-CZ+.2],[EH/2-1,CZ+.2],[-13.8,-13.2]].forEach(([y,z],k)=>{hl(P,[-a*TK/2,y,z],[-a,0,0],.5,['E3']);pt(G,conn('x',-a),[-a*(TK/2+.28),y,z],{E3:[[-a*8,0,0],[0,0,0]]},{i:ec++,of:6,win:[.03,1],spin:'x'});G.g.children[G.g.children.length-1].scale.setScalar(.8);if(k<2)hl(eT,[a*b/2,0,z-.2],[a,0,0],.5,[a>0?'E4':'E5']);else hl(eB,[a*b/2,-13.8,0],[a,0,0],.5,[a>0?'E4':'E5'])})});
  [-1,1].forEach((a,i)=>{const x=a*(b/2-CAMIN);hl(eB,[x,-13.8,-.6],[0,0,-1],.8,['E6']);Object.assign(MARKS[MARKS.length-1],{after:'E6',tt:.96});const m=lock('z',-1,'b');m.scale.setScalar(.62);pt(egB,m,[x,-13.8,-.6+.38],{E6:[[0,0,-7],[0,0,0]]},{i,of:2,win:[.03,1],spin:'z',seq:1,cam:1});
    [-CZ,CZ].forEach((z,j)=>{hl(eT,[x,1,z],[0,1,0],.8,['E7']);Object.assign(MARKS[MARKS.length-1],{after:'E7',tt:.96});const c=lock('y',1,'a');c.scale.setScalar(.8);pt(egT,c,[x,.42,z],{E7:[[0,7,0],[0,0,0]]},{i:i*2+j,of:4,win:[.03,1],spin:'y',seq:1,cam:1})})});
  hl(eB,[0,EH/2-1,-.6],[0,0,-1],.3,['E8']);hl(eT,[0,0,-12.8],[0,0,-1],.26,['E8']);pt(egB,sc('114667',{r:.2,len:5},'z',-1),[0,EH/2-1,-.6+2.5+.2],{E8:[[0,0,-9],[0,0,0]]},{win:[.1,1],spin:'z'});
  brkSet(egT,eT,1,-14-.2,[-UW/4,UW/4],'E9',.34,0);
  /* corner room */
  FR.wa=box(160,262,1,0xeceee9);FR.wa.position.set(70,131,-.5);FR.wb=box(1,262,160,0xeceee9);FR.wb.position.set(-.5,131,70);sc2.add(FR.wa,FR.wb);
  const RY=[PI/2,PI/4,0],CX=[[UD/2,FOOT-UW/2],[MID,MID],[FOOT-UW/2,UD/2]],WS=[UW,UM,UW],NM=['A','M','B'];FR.U={};FR.X={};
  NM.forEach((n,i)=>{const u=unitS(WS[i]),x=extS(WS[i]);const mk=(nm,o,y)=>{const G={g:new T3.Group(),name:nm,seq:{},final:[0,0,0],corner:1};G.g.add(o);G.g.position.set(CX[i][0],y,CX[i][1]);G.g.rotation.y=RY[i];G.ry=RY[i];G.pos=[CX[i][0],y,CX[i][1]];sc2.add(G.g);GS.push(G);return G};FR.U[n]=mk('U'+n,u,LIFT);FR.X[n]=mk('X'+n,x,UH+LIFT);FR.U[n].o=u;FR.X[n].o=x;if(n!=='M')brkSet(FR.X[n],x.userData.top,EH,-14,[-WS[i]/4,WS[i]/4],'E9',0,0,'E9');});
  const worldOf=(i,lx,lz)=>{const c=Math.cos(RY[i]),s=Math.sin(RY[i]);return[CX[i][0]+lx*c+lz*s,CX[i][1]-lx*s+lz*c]};
  const J=[[0,39,1,-19,'pR','pL'],[2,-39,1,19,'pL','pR']];
  J.forEach(([iO,xO,iM,xM,pO,pM],k)=>{const far=worldOf(iO,xO,-10),fk=worldOf(iM,xM,-4);const P=vPlate([k===0?[30.13,57]:[57,30.13],far,fk]);pt(null,P,[0,0,0],k===0?{C1:[[0,16,0],[0,0,0]]}:{C2:[[0,16,0],[0,0,0]]},{win:k===0?[0,.3]:[.34,.5],lbl:'转角底板',room:1,anchor:k===0?[16,0,56]:[56,0,16]});
    [['C3','U',UH,.0],['C4','X',UH+EH,0]].forEach(([s,S,y,_])=>{const zL=8,a=worldOf(iO,xO,zL),c=worldOf(iM,xM,zL),m=[(a[0]+c[0])/2,(a[1]+c[1])/2];const W0=FR[S==='U'?'U':'X'];const oO=W0['ABM'[iO===0?0:1]].o,oM=W0.M.o;const hO=S==='U'?UH:EH;hl(oO.userData[pO],[0,hO/2,zL],[0,1,0],.32,[s]);hl(oM.userData[pM],[0,hO/2,zL],[0,1,0],.32,[s]);
      const yy=y+LIFT+.1,L0={win:[k*.5,k*.5+.2]},o=s==='C3'?{back:[.84,1],onlyS:['C3']}:{};pt(null,link(a,c),[m[0],yy,m[1]],{[s]:[[0,14,0],[0,0,0]]},{...L0,...o,room:1});[a,c].forEach((q,j)=>pt(null,sc('100362',{r:.26,len:1.6,c:STEEL,wide:true}),[q[0],yy+.09-.8,q[1]],{[s]:[[0,12,0],[0,0,0]]},{win:[k*.5+.2+j*.14,k*.5+.34+j*.14],spin:'y',...o,room:1}))})});
  /* step 10 and 11: fixing the first extension */
  const UA=FR.U.A,XA=FR.X.A;['A','M','B'].forEach((un,ui)=>{const U0=FR.U[un],X0=FR.X[un],hw=(WS[ui]-TK)/2,first=un==='A';[-1,1].forEach((a,i)=>{const P=U0.o.userData[a<0?'pL':'pR'],Q=X0.o.userData[a<0?'pL':'pR'];if(first){hl(P,[0,UH/2,8],[0,1,0],.32,['E10']);hl(Q,[0,-EH/2,8],[0,-1,0],.4,['E10']);hl(Q,[-a*TK/2,2.6-EH/2,8],[-a,0,0],.8,['E11'])}else{hl(P,[0,UH/2,8],[0,1,0],.32,[]);hl(Q,[-a*TK/2,2.6-EH/2,8],[-a,0,0],.8,[])}
    pt(U0,bolt108(),[a*hw,UH,8],first?{E10:[[0,9,0],[0,0,0]]}:{E12:[[0,0,0],[0,0,0]]},first?{i,of:2,win:[.03,.4],spin:'y'}:{quiet:1});const c=lock('x',-a,'a');c.scale.setScalar(.8);pt(X0,c,[a*(hw-1+.58),2.6,8],first?{E11:[[-a*7,0,0],[0,0,0]]}:{E12:[[0,0,0],[0,0,0]]},first?{i,of:2,win:[.03,1],spin:'x',seq:1,cam:1}:{quiet:1})})});
  [-UW/4,UW/4].forEach((x,i)=>{wallFix(XA,x,EH+3.2,-14,'E12',[.02+i*.28,.26+i*.28]);wallFix(FR.X.B,x,EH+3.2,-14,'E12',[.82+i*.08,.9+i*.08])});
  /* C5: angle bracket inside the middle extension */
  const XM=FR.X.M,UMm=FR.U.M;const ang=angle();const AZ=-12.6+.0;hl(UMm.o,[0,UH+.05,AZ+1.5],[0,1,0],.26,['C5']);hl(XM.o.children[3]||XM.o,[0,1.5-EH/2,.6],[0,0,1],.26,['C5']);
  pt(XM,ang,[0,.02,AZ],{C5:[[0,8,12],[0,0,0]]},{win:[0,.2]});const ak=new T3.Group();ak.add(at(pm(cg(.5,.5,7,12),0xc7a15a),0,7,0),at(pm(cg(.16,.01,3.2,10),STEEL),0,1.6,0));pt(XM,ak,[0,.3,AZ+1.5],{C5:[[0,6,0],[0,0,0]]},{win:[.2,.3],onlyS:['C5'],back:[.3,.33],lbl:'锥子（自备）'});
  const ak2=ak.clone();ak2.rotation.x=PI/2;pt(XM,ak2,[0,1.5,AZ+.3],{C5:[[0,0,6],[0,0,0]]},{win:[.33,.43],onlyS:['C5'],back:[.43,.46]});
  pt(XM,sc('109534',{r:.2,len:1.6},'y',1),[0,-.56,AZ+1.5],{C5:[[0,9,0],[0,0,0]]},{win:[.46,.7],spin:'y'});pt(XM,sc('109534',{r:.2,len:1},'z',1),[0,1.5,AZ+.22-.5],{C5:[[0,0,10],[0,0,0]]},{win:[.72,.98],spin:'z'});
  FR.ham=hammerRig();sc2.add(FR.ham.root);
  sc2.updateMatrixWorld(true);cabReady=true;
}
const CN=[[380,300,420],[60,118,60]],CC={sd:[[-24,150,225],[0,30,0]],sd2:[[-24,175,280],[0,30,0]],l:[[-170,84,120],[-34,30,0]],r:[[175,90,125],[60,30,0]],l2:[[-235,120,170],[-25,36,0]],r2:[[235,125,170],[35,36,0]],upB:[[50,250,330],[0,6,-6]],sheet:[[470,300,-70],[0,14,-90]],nT:[[60,120,190],[0,14,90]],nM:[[60,120,100],[0,14,0]],nB:[[60,120,10],[0,14,-90]],stand:[[150,170,520],[0,101,0]],pins:[[60,120,215],[0,102,0]],topv:[[100,290,200],[0,190,-4]],lay:[[-34,118,120],[0,0,0]],eside:[[-70,170,250],[0,36,0]],er:[[185,110,185],[14,38,0]],er2:[[120,85,115],[18,34,0]],eb:[[-60,105,-205],[0,38,0]],eup:[[90,100,140],[0,22,0]],a:[[270,300,210],[14,215,96]],a2:[[150,232,150],[22,205,96]],wl:[[150,292,130],[6,240,96]],wl2:[[130,292,150],[96,240,6]],ctop:[[175,320,175],[44,205,44]],lk:[[120,300,120],[30,232,52]],mid:[[135,262,135],[33,212,33]],p1:[[105,62,125],[22,4,62]],p2:[[125,62,105],[62,4,22]],cn:CN};
function camFor(id,t=0){const m={B1:'lay',B2:'sd',B3:'sd2',B4:'l',B5:'r',B6:'sd',B8:'upB',B10:'upB',B13:'pins',B14:'stand',E1:'eup',E2:'eup',E3:'eside',E4:'eside',E5:'eside',E6:'eb',E7:'er2',E8:'eb',E9:'eup',E10:'a',E11:'a2',C3:'ctop',C4:'lk',C5:'mid'};if(id==='B7')return t>.66?CC.r2:CC.l2;if(id==='B9')return CC.sheet;if(id==='B11')return t<.36?CC.nT:t<.68?CC.nM:CC.nB;if(id==='B12')return t>.33?CC.topv:CC.stand;if(id==='E12')return t>=.82&&t<.98?CC.wl2:t>.55?CN:CC.wl;if(id==='C1'&&(t<.34||t>.835))return CC.p1;if(id==='C2'&&t>=.24&&t<.34)return CC.p1;if(id==='C2'&&(t>=.34&&t<.5||t>.88))return CC.p2;return CC[m[id]]||CN}
let lastStage='';const STG={B8:[[.3,'把柜子转成后面朝上'],[2,'在两块侧板后边缘标记中线']],B9:[[.34,'展开三折的背板'],[2,'从柜脚那头沿两侧的槽滑入']],B12:[[.34,'把柜子立起来'],[.72,'说明书的单柜支架：这个组合不用做'],[2,'这是单柜的做法，这个组合不用做']],C1:[[.32,'把转角底板放到地上'],[2,'柜子放下，侧板落进长槽']],C2:[[.34,'把 40 厘米的柜子放下，落进叉口'],[.5,'另一侧再放一块底板'],[2,'放下另一个 80 厘米的柜子']],C3:[[.84,'不加高时的做法：连接片在这里'],[2,'本组合要加高，零件收回，留到 C4']],E10:[[.42,'在柜顶小孔拧入 2 个 108001'],[2,'把加高单元放上去，对准螺栓']],E12:[[.56,'用墙螺丝把支架固定到墙上'],[2,'另一侧单元同样固定，中间单元见说明']],C5:[[.2,'把角码放到中间单元内'],[.33,'用锥子透过向下的孔扎小孔'],[.46,'再透过向后的孔扎小孔'],[.72,'拧入向下那颗'],[2,'拧入向后那颗']]};
function stage(s,tt){const list=STG[s];let txt='';if(list)txt=list.find(x=>tt<x[0])[1];const key=s+txt;if(key!==lastStage){lastStage=key;document.getElementById('animCap').textContent=(byId[s].label||s)+' · '+(txt||byId[s].title)}}
function pose(G,vis,k){G.g.visible=vis;if(!vis)return;G.g.position.set(G.pos[0],G.pos[1]+(1-k)*26,G.pos[2]);G.g.quaternion.setFromAxisAngle(new T3.Vector3(0,1,0),G.ry);G.g.quaternion.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),(1-k)*.13));tint(G.g,k>0&&k<1)}
function applyCab(s,tt){
  mark(s);MARKS.forEach(h=>{const g=h.d.parent;if(h.after)g.visible=ORD(s)<ORD(h.after)||(s===h.after&&tt<h.tt);if(g.userData.sx==null)g.userData.sx=g.scale.x;const k=h.steps.includes(s)?1.35:1;g.scale.set(g.userData.sx*k,1,k)});const fr=frameOf(s,tt),n=ORD(s);CENTER=fr.t.clone().setY(36);
  GS.forEach(G=>{if(G.corner)return;let spec=G.seq[s];
    if(n<ORD(G.a)||n>ORD(G.z)||spec===null||(spec===undefined&&Object.keys(G.seq).some(k=>ORD(k)>n&&G.seq[k]!==null&&!Object.keys(G.seq).some(q=>ORD(q)<n&&G.seq[q]!==null)))){G.g.visible=false;return}
    if(spec===undefined)spec=[F,F];
    G.g.visible=true;G.start=G.startAt&&G.startAt[s]||0;const mv=(G.moveAt&&G.moveAt[s])||1,a=spec[0],b=spec[1]===0?a:spec[1],k=ease(clamp((tt-G.start)/(mv-G.start))),A1=resolve(G,a,fr),B1=resolve(G,b,fr);
    G.g.position.copy(A1.v).lerp(B1.v,k);G.g.quaternion.copy(A1.q).slerp(B1.q,k);if(G.g.children[0])tint(G.g.children[0],spec[1]!==0&&spec[0]!==spec[1]&&k>0&&k<1)});
  const ok=(a,b)=>n>=ORD(a)&&n<=ORD(b),post=ok('E10','C5'),cA=ok('C1','C3')||post,cM=(s==='C2'||s==='C3')||post;const ease2=(a,b)=>ease(clamp((tt-a)/(b-a)));
  pose(FR.U.A,cA,s==='C1'?ease2(.34,1):1);pose(FR.U.M,cM,s==='C2'?ease2(0,.32):1);pose(FR.U.B,cM&&(s!=='C2'||tt>=.52),s==='C2'?ease2(.52,1):1);
  pose(FR.X.A,post,s==='E10'?ease2(.5,1):1);const late=s==='E12'&&tt>=.56||ok('C4','C5');pose(FR.X.M,late,s==='E12'?ease2(.56,.72):1);pose(FR.X.B,late&&(s!=='E12'||tt>=.68),s==='E12'?ease2(.68,.8):1);
  FR.wa.visible=FR.wb.visible=cA;FR.floor.position.set(cA?70:0,-.5,cA?70:0);FR.wall.visible=s==='B12'&&tt>.3||s==='B13'||s==='B14';
  {const q=s==='B9'?PI*.96*(1-ease2(0,.32)):0;FR.fold.forEach(f=>f.rotation.y=q)}FR.line.visible=s==='B11'||s==='B12'||s==='B13'||s==='B14'||(s==='B10'&&tt>.62);if(s==='B10'){FR.line.scale.x=clamp((tt-.35)/.55)||.001;FR.line.position.x=(-1+FR.line.scale.x)*38}else FR.line.scale.x=1,FR.line.position.x=0;
  const pv=FR.pencil;pv.visible=s==='B8'&&tt>.3&&tt<.98||s==='B10'&&tt>.3&&tt<.92;if(pv.visible){const L=UH/2,o=new T3.Vector3();if(s==='B8'){const u=clamp((tt-.3)/.68),a=u<.5?-39:39;o.set(a,FIXY,-14);}else{o.set(-38+76*clamp((tt-.35)/.55),FIXY,BKZ-.2)}o.applyQuaternion(fr.q).add(fr.t);pv.position.copy(o)}
  FR.mk.forEach((m,i)=>{const on=(s==='B8'&&tt>.3+.34*(i?1.5:.6)||ok('B9','B10'));if(on&&!m.parent)sc2.add(m);m.visible=on;if(on){m.position.set(i?39:-39,FIXY,-14.04).applyQuaternion(fr.q).add(fr.t);m.quaternion.copy(fr.q)}});
  CP.forEach(p=>{const ks=Object.keys(p.keys),first=ORD(ks[0]);if(n<first||(p.onlyS&&!p.onlyS.includes(s))||(p.room&&!cA)){p.m.visible=false;return}
    if(s==='B3'&&0)return;p.m.visible=true;const k=p.keys[s];let L=tt;
    if(k){const [a,b]=p.win||[0,1];L=clamp((tt-a)/(b-a));if(p.of>1){const gap=(p.seq?1:.5)/p.of;L=clamp((L-p.i*gap)/(1-(p.of-1)*gap))}const raw=L;L=p.cam?ease(clamp(raw/.55)):ease(L);if(p.tap)L=tapL(p,tt);if(p.back)L*=1-ease(clamp((tt-p.back[0])/(p.back[1]-p.back[0])));
      if(raw===0&&!p.tap&&k[0].some(v=>v)&&!(p.keep)||(p.tap&&tt<p.tap[0]))p.m.visible=false;p._L=L;p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],L),p.pos[1]+lerp(k[0][1],k[1][1],L),p.pos[2]+lerp(k[0][2],k[1][2],L));tint(p.m,L<1&&L>0||(p.cam&&raw>0&&raw<1));if(p.back&&tt>=p.back[1])p.m.visible=false;
      if(p.spin){const off=k[0]['xyz'.indexOf(p.spin)],sg=-(off<0?-1:1);p.m.rotation[p.spin]=p.cam?sg*clamp((raw-.55)/.45)*PI:sg*L*PI*3}}
    else{p.m.position.set(...p.pos);tint(p.m,false)}});
  hammerAt(s,tt);stage(s,tt);
  const c=camFor(s,tt),tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.14):want.clone();camTgt=camTgt?camTgt.lerp(tp,.14):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}
