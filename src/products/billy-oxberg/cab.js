/* BILLY with OXBERG doors. Real sizes: 80 wide, 28 deep, 202 high, door pack 40 x 211 x 3. Board thickness, hole positions, door height and rail sizes are estimates from the drawings and photos. */
const CIDS=STEPS_ORDER;
const ORD=id=>CIDS.indexOf(id);
let sc2,GS=[],CP=[],FR={},cabReady=false;
const PI=Math.PI,F={f:[0,0,0]},UW=80,UD=28,UH=202,TK=2,BDP=26,BZ=.75,BKZ=-12.4,BKH=195.3,BKY=104.15,PLH=6.5,FIXY=101,YBOT=PLH+1,YTOP=UH-1,SHY=[39.6,65.2,138.8,164.4],CZ=9,DZ=4,CAMIN=2.8,GRV=.4;
const DOORW=39.8,DH=192,DY0=9,DT=2,STL=5.6,RAIL=6,MIDY=105,MIDH=5,PX=38.6,PZ=14.3,HY=[188.4,92.4,22],HZ=10.25,KNOB='131386',COVER='121043',GLASS=0xbcd3d3,KNX=1.3-DOORW+STL/2+.2,BUMPS=[[-31.4,199.8],[-31.4,102.6],[-31.4,12]];
function grp(name,body,final,seq,opt={}){const g=new T3.Group();if(body)g.add(body);sc2.add(g);const G={g,name,body,final,seq,...opt};GS.push(G);FR[name]=G;return G}
function pt(G,m,pos,keys,o={}){m.position.set(...pos);(G?G.g:sc2).add(m);CP.push({m,pos,keys,G,...o});return m}
const hl=(m,p,n,r,s)=>drill(m,new T3.Vector3(...p),new T3.Vector3(...n),r,s);
function frameOf(id,t){const I=new T3.Quaternion(),S=lazyQ(0,0,1,-PI/2).get(),B=lazyQ(1,0,0,PI/2).get();let q=I,x=0,y=0,z=0;const n=ORD(id),o=k=>ORD(k);const sideB=[-UH/2,UW/2,0],backB=[0,14,-UH/2];
  const mix=(qa,qb,a,b,k)=>{q=qa.clone().slerp(qb,k);x=lerp(a[0],b[0],k);y=lerp(a[1],b[1],k)+Math.sin(k*PI)*(id==='B10'?30:36);z=lerp(a[2],b[2],k)};
  if(n>=o('B2')&&n<=o('B7')){q=S;[x,y,z]=sideB}else if(id==='B8')mix(S,B,sideB,backB,ease(clamp(t/.26)));else if(id==='B9'){q=B;[x,y,z]=backB}else if(id==='B10')mix(B,I,backB,[0,0,0],ease(clamp(t/.3)));
  return{q,t:new T3.Vector3(x,y,z)}}
const lazyQ=(x,y,z,a)=>({get:()=>new T3.Quaternion().setFromAxisAngle(new T3.Vector3(x,y,z),a)});
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
function brkW(G,top,yT,zR,xs,s,bw,tw){xs.forEach((x,i)=>{hl(top,[x,yT,zR+4.4],[0,1,0],.32,[s]);const k=i*(tw[1]-tw[0])/xs.length,b0=bw[0]+i*(bw[1]-bw[0])/xs.length,bl=(bw[1]-bw[0])/xs.length,tl=(tw[1]-tw[0])/xs.length;pt(G,lbrk(),[x,yT,zR],{[s]:[[0,9,0],[0,0,0]]},{win:[b0,b0+bl]});pt(G,washer('y',1),[x,yT+.31,zR+4.4],{[s]:[[0,7,0],[0,0,0]]},{win:[tw[0]+k,tw[0]+k+tl*.4]});pt(G,sc('109041',{r:.22,len:1.7}),[x,yT+.37-.85,zR+4.4],{[s]:[[0,8,0],[0,0,0]]},{win:[tw[0]+k+tl*.4,tw[0]+k+tl],spin:'y'})})}
function wallFix(G,x,y,zR,s,win){const[a,b]=win;pt(G,washer('z',1),[x,y,zR+.31],{[s]:[[0,0,7],[0,0,0]]},{win:[a,a+(b-a)*.4]});pt(G,sc('墙螺丝',{r:.28,len:3.2}, 'z',1),[x,y,zR+.38-1.6-.21],{[s]:[[0,0,9],[0,0,0]]},{win:[a+(b-a)*.4,b],spin:'z',lbl:'墙螺丝（另购）'})}
function plug(){const g=new T3.Group();g.add(at(pm(cg(.42,.42,.12,14),0x7d8488),0,.06,0),at(pm(cg(.2,.2,.07,10),DARK),0,.13,0),at(pm(cg(.2,.14,1.7,8),PLAST),0,-.85,0));const o=point(g,'z',-1);o.userData.code='151706';return o}
function cap(){const g=new T3.Group();g.add(at(pm(cg(.52,.52,.12,16),0x7d8488),0,.06,0),at(pm(cg(.12,.1,1.5,8),PLAST),0,-.75,0));const o=point(g,'z',-1);o.userData.code='151705';return o}
function plate109(){const g=new T3.Group();g.add(at(pm(bg(.14,4.6,3.4),ZINC),0,0,0),at(pm(bg(.3,.5,5.4),ZINC),-.2,0,-.4),at(pm(bg(.16,.7,.9),DARK),-.05,-1.6,1.1),at(pm(bg(.16,.7,.9),DARK),-.05,1.6,1.1));g.userData.code='109221';return g}
function armP(a){const g=new T3.Group();g.add(at(pm(bg(.8,1.9,7.4),STEEL),0,0,0),at(pm(bg(.84,.5,2.4),DARK),0,0,1.6));const b=pm(cg(.36,.36,.5,12),ZINC);b.rotation.z=PI/2;g.add(at(b,-.55,0,0));g.userData.code='109336';return g}
function hingeD(){const g=new T3.Group(),cup=pm(cg(1.75,1.75,.14,22),STEEL);cup.rotation.x=PI/2;g.add(at(cup,0,0,-.07));g.add(at(pm(bg(1.7,4.4,.16),ZINC),0,0,-.1));[-1.65,1.65].forEach(y=>{const h=pm(cg(.3,.3,.18,12),DARK);h.rotation.x=PI/2;g.add(at(h,0,y,-.13))});g.userData.code='109336';return g}
function cover(){const g=new T3.Group(),c=pm(cg(1.65,1.65,.9,18),PLAST);c.rotation.x=PI/2;g.add(at(c,0,0,.45),at(pm(bg(3.1,3.9,.14),PLAST),0,0,-.07));g.userData.code=COVER;return g}
function knob(){const g=new T3.Group(),c=pm(cg(.75,.75,2.3,18),0x8b684c);c.rotation.x=PI/2;g.add(at(c,0,0,0));const h=pm(cg(.3,.3,.04,12),DARK);h.rotation.x=PI/2;g.add(at(h,0,0,-1.17));g.userData.code=KNOB;return g}
function bump(){const g=new T3.Group(),c=pm(cg(.65,.65,.26,16),0xe8e8e0);c.rotation.x=PI/2;g.add(at(c,0,0,-.13));g.userData.code='102384';return g}
function door(){const g=new T3.Group(),x0=-DOORW+1.3,x1=1.3,y1=DY0+DH,mx=(x0+x1)/2,lg=DH,inW=DOORW-2*STL;const hs=box(STL,lg,DT,WOOD),os=box(STL,lg,DT,WOOD);hs.position.set(x1-STL/2,DY0+lg/2,DT/2);os.position.set(x0+STL/2,DY0+lg/2,DT/2);g.add(hs,os);[y1-RAIL/2,DY0+RAIL/2].forEach(y=>g.add(at(box(inW,RAIL,DT,WOOD),mx,y,DT/2)));const mr=box(inW,MIDH,DT,WOOD);g.add(at(mr,mx,MIDY,DT/2));
  const ph=MIDY-MIDH/2-DY0-RAIL,pn=box(inW,ph,1,WOOD);g.add(at(pn,mx,DY0+RAIL+ph/2,.9));const gh=y1-RAIL-MIDY-MIDH/2,gl=new T3.Mesh(new T3.BoxGeometry(inW,gh,.3),new T3.MeshPhongMaterial({color:GLASS,transparent:true,opacity:.24,shininess:90,specular:0xffffff,depthWrite:false}));g.add(at(gl,mx,MIDY+MIDH/2+gh/2,1));
  const k=pm(cg(.03,.03,14,4),0xffffff);k.rotation.z=.45;k.material.transparent=true;k.material.opacity=.7;g.add(at(k,mx+4,150,1.2));g.userData={hs,os,mr,gl};return g}
function buildCab(){
  sc2=new T3.Scene();sc2.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(120,300,260);d.target.position.set(40,80,0);sc2.add(d.target);d.castShadow=true;d.shadow.mapSize.set(2048,2048);Object.assign(d.shadow.camera,{left:-230,right:230,top:230,bottom:-230,near:10,far:700});d.shadow.bias=-.0012;d.shadow.radius=4;sc2.add(d);FR.sun=d;
  FR.floor=box(1600,1,1600,0xdfe2dd);FR.floor.position.set(0,-.5,0);FR.floor.remove(FR.floor.children[0]);sc2.add(FR.floor);
  const b=UW-2*TK,xP=UW/2-TK/2;
  const pR=panel(UH,true,1),pL=panel(UH,true,-1);dots(pR,1,UH);dots(pL,-1,UH);
  const gpR=grp('panR',pR,[xP,UH/2,0],{B2:[{f:[0,0,-17]},0],B3:[{f:[0,0,-17]},F]},{a:'B2',z:'D7',moveAt:{B3:.15},anchor:[0,50,8]});
  const gpL=grp('panL',pL,[-xP,UH/2,0],{B2:[{f:[UW-TK,0,17],ry:PI},0],B3:null,B4:null,B5:null,B6:[{f:[-26,0,0]},F]},{a:'B2',z:'D7',startAt:{B6:.1},moveAt:{B6:.8},anchor:[0,50,8]});
  const BB=[['bot',YBOT,'B3',.15,.55],['mid',FIXY,'B3',.55,.95],['top',YTOP,'B5',0,.45]];const bo={};
  BB.forEach(([n,y,s,a,c],i)=>{const m=box(b,TK,BDP,WOOD);bo[n]=m;const seq={B1:[{f:[0,1-y,(i-1.5)*34-BZ],rx:n==='top'?PI:0},0],B2:null,B3:null,B4:null,[s]:[{f:[-26,0,0]},F]};if(n!=='top')delete seq.B4;if(n==='top')delete seq.B4,seq.B3=null,seq.B4=null;grp(n,m,[0,y,BZ],seq,{a:'B1',z:'D7',startAt:{[s]:a},moveAt:{[s]:c},anchor:[-20,TK/2,0]})});
  const plM=box(b,PLH,TK,WOOD);grp('plinth',plM,[0,PLH/2,BZ+12],{B1:[{f:[0,1-PLH/2+2.25,1.5*34-BZ-12]},0],B2:null,B3:[{f:[-26,0,0]},F]},{a:'B1',z:'D7',startAt:{B3:.15},moveAt:{B3:.55},anchor:[-20,PLH/2,0]});
  let di=0;const DW=(G,m,y,z,a,s0,sR,sL)=>{const end=a*b/2;hl(m,[end,y,z],[a,0,0],.45,['B1',a>0?sR:sL]);pt(G,dw(a,.4,'101351'),[a*(b/2-.1),y,z],{B1:[[a*9,0,0],[0,0,0]]},{i:di++,of:16,win:[.04,1]})};
  [['bot','B3'],['mid','B3'],['top','B5']].forEach(([n,s])=>[-1,1].forEach(a=>{const G=FR[n],m=bo[n],Y=FR[n].final[1];[-DZ,DZ].forEach(z=>{DW(G,m,0,z,a,0,s,'B6');const P=a>0?pR:pL;hl(P,[-a*TK/2,Y-UH/2,z+BZ],[-a,0,0],.45,[a>0?s:'B6'])})}));
  [-1,1].forEach(a=>[-1.6,1.6].forEach(y=>{DW(FR.plinth,plM,y,0,a,0,'B3','B6');const P=a>0?pR:pL;hl(P,[-a*TK/2,PLH/2+y-UH/2,BZ+12],[-a,0,0],.45,[a>0?'B3':'B6'])}));
  let ci=0;[[YBOT,'bot'],[FIXY,'mid'],[YTOP,'top']].forEach(([y,n])=>[-1,1].forEach(a=>[-CZ,CZ].forEach(z=>{const G=a>0?gpR:gpL,P=a>0?pR:pL;hl(P,[-a*TK/2,y-UH/2,z+BZ],[-a,0,0],.5,['B2']);pt(G,conn('x',-a),[-a*(TK/2+.28),y-UH/2,z+BZ],{B2:[[-a*8,0,0],[0,0,0]]},{i:ci++,of:12,win:[.03,1],spin:'x'});G.g.children[G.g.children.length-1].scale.setScalar(.8);hl(bo[n],[a*b/2,0,z],[a,0,0],.5,[n==='top'?(a>0?'B5':'B6'):(a>0?'B3':'B6')])})));
  const CAM=[[ 'bot',-1,1,'B4',0,4],['mid',-1,1,'B4',2,4],['top',1,1,'B5',0,2],['bot',-1,-1,'B7',0,6],['mid',-1,-1,'B7',2,6],['top',1,-1,'B7',4,6]];
  CAM.forEach(([n,sg,a,s,i0,of])=>[-CZ,CZ].forEach((z,j)=>{const x=a*(b/2-CAMIN);hl(bo[n],[x,sg*TK/2,z],[0,sg,0],.8,[s]);Object.assign(MARKS[MARKS.length-1],{after:s,tt:.96});const m=lock('y',sg,'a');m.scale.setScalar(.8);pt(FR[n],m,[x,sg*(TK/2-.58),z],{[s]:[[0,sg*7,0],[0,0,0]]},{i:i0+j,of,win:s==='B5'?[.5,1]:[.03,1],spin:'y',seq:1,cam:1})}));
  /* back sheet: three strips, slides in from the foot end, 18 plugs and 18 caps */
  const SW=25.6,bkC=box(SW,BKH,.3,GREY),bkG=new T3.Group();bkG.add(bkC);FR.fold=[-1,1].map(k=>{const q=new T3.Group(),st=box(SW,BKH,.3,GREY);st.position.x=k*SW/2;q.position.x=k*SW/2;q.add(st);bkG.add(q);return q});
  const gBack=grp('back',bkG,[0,BKY,BKZ],{B8:[{f:[0,-(UH+14),0]},F]},{a:'B8',z:'D7',startAt:{B8:.5},anchor:[0,0,-.2]});
  let ni=0;[YTOP,FIXY,YBOT].forEach(y=>[-.5,-.3,-.1,.1,.3,.5].forEach(k=>{const i=ni++,x=k*b*.94,ly=y-BKY;hl(gBack.g,[x,ly,-.16],[0,0,-1],.26,['B9']);Object.assign(MARKS[MARKS.length-1],{after:'B9',tt:.96});pt(gBack,plug(),[x,ly,-.15],{B9:[[0,0,-4],[0,0,0]]},{i,of:18,win:[.02,.52],seq:1});pt(gBack,cap(),[x,ly,-.27],{B9:[[0,0,-4],[0,0,0]]},{i,of:18,win:[.52,1],seq:1})}));
  /* wall */
  brkW(FR.top,bo.top,TK/2,-14-BZ,[-UW/4,UW/4],'B10',[.34,.46],[.63,1]);
  [-UW/4,UW/4].forEach((x,i)=>wallFix(FR.top,x,3.2,-14-BZ,'B10',[.46+i*.085,.545+i*.085]));
  let pi=0;SHY.forEach(y=>[-1,1].forEach(a=>[-9.5,9.5].forEach(z=>{const G=a>0?gpR:gpL,P=a>0?pR:pL;hl(P,[-a*TK/2,y-UH/2,z+BZ],[-a,0,0],.3,['B11']);pt(G,pin131(a),[-a*(TK/2),y-UH/2,z+BZ],{B11:[[-a*6,0,0],[0,0,0]]},{i:pi++,of:16,win:[.03,1],seq:1})})));
  SHY.forEach((y,i)=>{grp('s'+i,box(b-.2,TK,BDP-1,WOOD),[0,y+1.62,BZ],{B12:[{f:[0,5,34]},F]},{a:'B12',z:'D7',startAt:{B12:i*.22},moveAt:{B12:i*.22+.3},anchor:[0,TK/2,6]})});
  FR.wall=box(520,290,1,0xeceee9);FR.wall.position.set(40,145,-14.6);sc2.add(FR.wall);
  /* D1 door wall bracket, kit code 122576 */
  const n0=CP.length;brkW(FR.top,bo.top,TK/2,-14-BZ,[30],'D1',[.1,.46],[.63,1]);wallFix(FR.top,30,3.2,-14-BZ,'D1',[.46,.63]);CP.slice(n0).forEach(p=>{if(p.m.userData.code!=='墙螺丝')p.m.userData.code='122576'});
  /* D2 mounting plates on the hinge-side panel */
  HY.forEach((y,i)=>{const ly=y-UH/2;[-1.6,1.6].forEach(k=>hl(pR,[-TK/2,ly+k,HZ],[-1,0,0],.3,['D2']));pt(gpR,plate109(),[-TK/2-.07,ly,HZ-1.1],{D2:[[-6,0,0],[0,0,0]]},{i,of:3,win:[.02,.5],seq:1});[-1.6,1.6].forEach((k,j)=>pt(gpR,sc('113287',{r:.17,len:1.1,wide:true},'x',-1),[-TK/2-.14+.55+.05,ly+k,HZ],{D2:[[-6,0,0],[0,0,0]]},{i:i*2+j,of:6,win:[.5,1],seq:1,spin:'x'}))});
  /* door, its pivot is the origin */
  const dm=door(),DR={g:new T3.Group(),name:'DR',seq:{},final:[0,0,0],corner:1};DR.g.add(dm);sc2.add(DR.g);GS.push(DR);FR.DR=DR;const hsx=STL/2-.2;
  HY.forEach((y,i)=>{const yl=y-DY0-DH/2;
    hl(dm.userData.hs,[-.4,yl,-DT/2],[0,0,-1],1.75,['D3']);[-1.65,1.65].forEach(k=>hl(dm.userData.hs,[-.4,yl+k,-DT/2],[0,0,-1],.26,['D3']));
    hl(dm.userData.os,[.4,yl,-DT/2],[0,0,-1],1.75,['D3']);Object.assign(MARKS[MARKS.length-1],{after:'D3',tt:.5});
    pt(DR,cover(),[1.3-DOORW+STL/2+.4,y,-.0],{D3:[[0,0,-7],[0,0,0]]},{i,of:3,win:[.02,.4],seq:1});
    pt(DR,hingeD(),[1.3-STL/2-.4,y,0],{D3:[[0,0,-7],[0,0,0]]},{i,of:3,win:[.4,.7],seq:1});
    const ar=new T3.Group(),am=armP();am.rotation.y=PI/2;am.rotation.x=PI;ar.add(at(am,0,0,0));ar.userData.code='109336';FR['ad'+i]=at(ar,5.45,y,-1.3);ar.visible=false;DR.g.add(ar);const lk=pm(bg(3.9,1.6,.4),STEEL);FR['lk'+i]=at(lk,.05,y,-1);lk.visible=false;DR.g.add(lk);
    [-1.65,1.65].forEach((k,j)=>pt(DR,sc('100349',{r:.17,len:1,wide:false},'z',-1),[1.3-STL/2-.4,y+k,.32],{D3:[[0,0,-7],[0,0,0]]},{i:i*2+j,of:6,win:[.7,1],seq:1,spin:'z'}));
    const ap=armP();pt(gpR,ap,[-TK/2-.7,y-UH/2,HZ-1.6+1.6],{D4:[[0,0,0],[0,0,0]]},{quiet:1,after4:1});pt(gpR,sc('锁紧螺丝',{r:.2,len:.7}, 'x',-1),[-TK/2-.75,y-UH/2,HZ+.4],{D4:[[-1.4,0,0],[0,0,0]]},{i,of:3,win:[.62,1],seq:1,spin:'x',lbl:'锁紧螺丝'})});
  {const yk=MIDY-DY0-DH/2;hl(dm.userData.os,[.2,yk,-DT/2],[0,0,-1],.2,['D5']);hl(dm.userData.os,[.2,yk,DT/2],[0,0,1],.3,['D5'])}
  pt(DR,knob(),[KNX,MIDY,DT+1.15],{D5:[[0,0,6],[0,0,0]]},{win:[.02,.45]});pt(DR,sc('114667',{r:.2,len:3.9},'z',-1),[KNX,MIDY,1.95],{D5:[[0,0,-9],[0,0,0]]},{win:[.45,1],spin:'z'});
  BUMPS.forEach(([x,y],i)=>pt(DR,bump(),[x,y,0],{D6:[[0,0,-5],[0,0,0]]},{i,of:3,win:[.02,.72],seq:1}));
  /* the rest of the set appears at the end of D7 */
  const mkS=(o,x,y,z)=>{const G={g:new T3.Group(),name:'st',seq:{},final:[0,0,0],corner:1,pos:[x,y,z]};G.g.add(o);G.g.position.set(x,y,z);sc2.add(G.g);GS.push(G);return G};
  const ub=new T3.Group(),mk=()=>{const pl=panel(UH,true,-1),pr=panel(UH,true,1);pl.position.set(-UW/2+TK/2,UH/2,0);pr.position.set(UW/2-TK/2,UH/2,0);dots(pl,-1,UH);dots(pr,1,UH);ub.add(pl,pr);[YBOT,FIXY,YTOP].forEach(y=>ub.add(at(box(b,TK,BDP,WOOD),0,y,BZ)));ub.add(at(box(b,PLH,TK,WOOD),0,PLH/2,BZ+12),at(box(b+.8,BKH,.3,GREY),0,BKY,BKZ));SHY.forEach(y=>ub.add(at(box(b-.2,TK,BDP-1,WOOD),0,y+1.62,BZ)))};mk();
  FR.UB=mkS(ub,UW,0,0);const dS=(x,mir)=>{const m=door();m.add(at(knob(),KNX,MIDY,DT+1.15));BUMPS.forEach(([a,y])=>m.add(at(bump(),a,y,0)));if(mir)m.scale.x=-1;return mkS(m,x,0,PZ)};FR.REST=[dS(-PX,true),dS(UW-PX,true),dS(UW+PX,false)];
  brkSet(FR.UB,null,UH,-14,[-30,-20,20,30],'D7',0,0,'D7');brkSet(FR.top,null,TK/2,-14-BZ,[-30],'D7',0,0,'D7');
  /* one screw per adjustment on the middle hinge */
  FR.adj=[[-TK/2-.2,HY[1]-UH/2+1.6,HZ],[-TK/2-.75,HY[1]-UH/2,HZ+2.8],[-TK/2-.75,HY[1]-UH/2,HZ+.4]].map(p=>{const m=sc('',{r:.22,len:.7},'x',-1);m.userData.code='';at(m,...p);gpR.g.add(m);return m});
  sc2.updateMatrixWorld(true);cabReady=true;
}
const CC={sd:[[-24,150,225],[0,30,0]],sd2:[[-24,175,280],[0,30,0]],l:[[-170,84,120],[-34,30,0]],r:[[175,90,125],[60,30,0]],l2:[[-235,120,170],[-25,36,0]],r2:[[235,125,170],[35,36,0]],sheet:[[470,300,-70],[0,14,-90]],nT:[[60,120,190],[0,14,90]],nM:[[60,120,100],[0,14,0]],nB:[[60,120,10],[0,14,-90]],stand:[[150,170,520],[0,101,0]],pins:[[60,120,215],[0,102,0]],topv:[[100,290,200],[0,190,-4]],lay:[[-34,118,120],[0,0,0]],pl:[[-100,135,130],[34,110,6]],plc:[[-40,205,60],[30,186,8]],dl:[[95,185,297],[0,4,132]],dh:[[-120,120,110],[28,100,30]],hg:[[-30,100,90],[30,95,12]],kn:[[150,125,120],[40,105,50]],ab:[[-90,150,190],[34,100,50]],cl:[[70,150,300],[30,100,8]],cu:[[-50,120,110],[32,95,10]],all:[[215,175,415],[40,100,0]]};
const tri=(t,a,b)=>Math.min(2,Math.floor(clamp((t-a)/(b-a))*3));
function camFor(id,t=0){if(id==='B7'){const i=tri(t,.03,1),x=[-93,0,100][i],d=i===2?85:-85;return[[x+d,122,95],[x,76,0]]}if(id==='B8')return CC.sheet;if(id==='B9')return t<.36?CC.nT:t<.69?CC.nM:CC.nB;if(id==='B10')return t>.3?CC.topv:CC.stand;
  if(id==='D2'){const i=t<.5?tri(t,.02,.5):tri(t,.5,1),y=HY[i];return[[-55,y+26,88],[34,y,8]]}if(id==='D4'){if(t<.62)return CC.dh;const y=HY[tri(t,.62,1)];return[[-50,y+24,92],[34,y,10]]}if(id==='D6'&&t<.74){const y=BUMPS[tri(t,.02,.72)][1];return[[-62,y+22,110],[37,y,47]]}if(id==='D7')return t>.62?CC.all:CC.cu;
  if(id==='D5'&&t>.45)return[[-70,125,120],[34,105,50]];const m={B1:'lay',B2:'sd',B3:'sd2',B4:'l',B5:'r',B6:'sd',B11:'pins',B12:'stand',D1:'topv',D3:'dl',D5:'kn',D6:'ab'};return CC[m[id]]||CC.stand}
let lastStage='';const STG={B8:[[.26,'把柜子转成后面朝上'],[.5,'展开三折的背板'],[2,'从柜脚那头沿两侧的槽滑入']],B9:[[.52,'先按入 18 个 151706'],[2,'再按入 18 个 151705']],B10:[[.34,'把柜子立起来靠墙'],[.46,'把 2 个支架放到柜顶'],[.63,'先用墙螺丝固定到墙上'],[2,'再用木螺丝拧到柜顶']],D1:[[.46,'把支架放到柜顶'],[.63,'先用墙螺丝固定到墙上'],[2,'再用木螺丝拧到柜顶']],D3:[[.4,'3 个盖片按入没有铰链的那侧'],[.7,'3 个铰链放入杯孔'],[2,'每个铰链 2 颗 100349']],D4:[[.6,'铰链挂到底板上，推到位'],[2,'拧紧 3 个铰链的锁紧螺丝']],D5:[[.45,'旋钮放到门外侧'],[2,'从门内拧入 114667']],D6:[[.74,'贴 3 个缓冲垫'],[2,'关上门']],D7:[[.2,'调高度：松开底板螺丝，上下移动，再拧紧'],[.4,'调左右：松开后面的螺丝，转前面的螺丝，再拧紧后面的螺丝'],[.62,'调前后：松开后面的螺丝，前后移动，再拧紧'],[2,'第二个书柜和其余三扇门同样装好']]};
function stage(s,tt){const list=STG[s];let txt='';if(list)txt=list.find(x=>tt<x[0])[1];const key=s+txt;if(key!==lastStage){lastStage=key;document.getElementById('animCap').textContent=(byId[s].label||s)+' · '+(txt||byId[s].title)}}
function applyCab(s,tt){
  mark(s);MARKS.forEach(h=>{const g=h.d.parent;if(h.after)g.visible=ORD(s)<ORD(h.after)||(s===h.after&&tt<h.tt);if(g.userData.sx==null)g.userData.sx=g.scale.x;const k=h.steps.includes(s)?1.35:1;g.scale.set(g.userData.sx*k,1,k)});const fr=frameOf(s,tt),n=ORD(s);CENTER=fr.t.clone().setY(36);
  GS.forEach(G=>{if(G.corner)return;let spec=G.seq[s];
    if(n<ORD(G.a)||n>ORD(G.z)||spec===null||(spec===undefined&&Object.keys(G.seq).some(k=>ORD(k)>n&&G.seq[k]!==null&&!Object.keys(G.seq).some(q=>ORD(q)<n&&G.seq[q]!==null)))){G.g.visible=false;return}
    if(spec===undefined)spec=[F,F];
    G.g.visible=true;G.start=G.startAt&&G.startAt[s]||0;const mv=(G.moveAt&&G.moveAt[s])||1,a=spec[0],b=spec[1]===0?a:spec[1],k=ease(clamp((tt-G.start)/(mv-G.start))),A1=resolve(G,a,fr),B1=resolve(G,b,fr);
    G.g.position.copy(A1.v).lerp(B1.v,k);G.g.quaternion.copy(A1.q).slerp(B1.q,k);if(G.g.children[0])tint(G.g.children[0],spec[1]!==0&&spec[0]!==spec[1]&&k>0&&k<1)});
  const ease2=(a,b)=>ease(clamp((tt-a)/(b-a))),DRg=FR.DR,dn=ORD('D3');DRg.g.visible=n>=dn;if(DRg.g.visible){let th=PI/2,dz=0,dx=0,dy=0;if(s==='D4')dz=22*(1-ease2(.03,.58));if(s==='D6')th=PI/2*(1-ease2(.76,1));if(s==='D7'){th=PI/2*(1-ease2(.56,.62));dy=tt<.2?Math.sin(tt/.2*PI*2)*.5:0;dx=tt>=.2&&tt<.4?Math.sin((tt-.2)/.2*PI*2)*.4:0;dz=tt>=.4&&tt<.62?Math.sin((tt-.4)/.22*PI*2)*.35:0}
    if(s==='D3'){const q=lazyQ(1,0,0,PI/2).get(),c=new T3.Vector3(-18.6,DY0+DH/2,0).applyQuaternion(q);DRg.g.quaternion.copy(q);DRg.g.position.set(-c.x,2-c.y,122-c.z)}else{DRg.g.quaternion.setFromAxisAngle(new T3.Vector3(0,1,0),th);DRg.g.position.set(PX+dx,dy,PZ+1.4*Math.sin(th)+dz)}tint(DRg.g.children[0],s==='D4'&&tt<.6||s==='D6'&&tt>.76)}
  const armOn=s==='D3'&&tt>=.7||s==='D4'&&tt<.6;const dth=n<dn?0:s==='D3'?(tt>=.7?PI/2:0):s==='D4'||s==='D5'?PI/2:s==='D6'?PI/2*(1-ease2(.76,1)):s==='D7'?PI/2*(1-ease2(.56,.62)):0;[0,1,2].forEach(i=>{FR['ad'+i].visible=armOn;FR['lk'+i].visible=dth>1.5});
  [[0,.2],[.2,.4],[.4,.62]].forEach(([a,b],i)=>{const m=FR.adj[i],on=s==='D7'&&tt>=a&&tt<b;m.visible=on;if(on){m.rotation.x=-Math.sin((tt-a)/(b-a)*PI*2)*PI;tint(m,true)}});
  FR.back.g.visible=FR.back.g.visible&&(s!=='B8'||tt>=.26);
  const show=s==='D7'&&tt>=.62;[FR.UB,...FR.REST].forEach((G,i)=>{const k=show?ease2(.62+i*.08,.72+i*.08):0;G.g.visible=show&&tt>=.62+i*.08;G.g.position.set(G.pos[0],G.pos[1],G.pos[2]+(1-k)*26);tint(G.g.children[0],k>0&&k<1)});
  FR.wall.visible=n>=ORD('B10')&&(s!=='B10'||tt>.28);{const q=s==='B8'?PI*.96*(1-ease2(.28,.48)):0;FR.fold.forEach(f=>f.rotation.y=q)}
  CP.forEach(p=>{const ks=Object.keys(p.keys),first=ORD(ks[0]);if(n<first||(p.onlyS&&!p.onlyS.includes(s))||(p.after4&&(s==='D4'&&tt<.6))){p.m.visible=false;return}
    if(s==='B3'&&0)return;p.m.visible=true;const k=p.keys[s];let L=tt;
    if(k){const [a,b]=p.win||[0,1];L=clamp((tt-a)/(b-a));if(p.of>1){const gap=(p.seq?1:.5)/p.of;L=clamp((L-p.i*gap)/(1-(p.of-1)*gap))}const raw=L;L=p.cam?ease(clamp(raw/.55)):ease(L);if(p.tap)L=tapL(p,tt);if(p.back)L*=1-ease(clamp((tt-p.back[0])/(p.back[1]-p.back[0])));
      if(raw===0&&!p.tap&&k[0].some(v=>v)&&!(p.keep)||false)p.m.visible=false;p._L=L;p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],L),p.pos[1]+lerp(k[0][1],k[1][1],L),p.pos[2]+lerp(k[0][2],k[1][2],L));tint(p.m,L<1&&L>0||(p.cam&&raw>0&&raw<1));if(p.back&&tt>=p.back[1])p.m.visible=false;
      if(p.spin){const off=k[0]['xyz'.indexOf(p.spin)],sg=-(off<0?-1:1);p.m.rotation[p.spin]=p.cam?sg*clamp((raw-.55)/.45)*PI:sg*L*PI*3}}
    else{p.m.position.set(...p.pos);tint(p.m,false)}});
  stage(s,tt);
  const c=camFor(s,tt),tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.14):want.clone();camTgt=camTgt?camTgt.lerp(tp,.14):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}
