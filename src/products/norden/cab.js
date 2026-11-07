/* NORDEN gateleg table. Built upright (steps 1-2), table top inverted (3-4), frame inverted (5-8), flipped, drawers (9-11). Proportions are estimates. */
const CIDS=['1','2','3','4','5','6','7','8','9','10','11'];
const ORD=id=>CIDS.indexOf(id);
let sc2,GS=[],CP=[],FR={},cabReady=false;
const PI=Math.PI,F={f:[0,0,0]},H0=71.2,BW=15.6,LZ=72,PS=3.6,TK=2.5,CW=26,LW=63,GX=10.3,GZ=33,GL=52.2,BZ=33;

function grp(name,body,final,seq,opt={}){const g=new T3.Group();if(body)g.add(body);sc2.add(g);const G={g,name,body,final,seq,...opt};GS.push(G);FR[name]=G;return G}
function pt(G,m,pos,keys,o={}){m.position.set(...pos);(G?G.g:sc2).add(m);CP.push({m,pos,keys,G,...o});return m}
function frameOf(id,t){const inv=new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0,0,1),PI),up=new T3.Quaternion();let q=up,y=0;
  const n=+id;if(n>=3&&n<=7){q=inv;y=H0+TK}else if(id==='8'){const k=ease(clamp((t-.62)/.38));q=inv.clone().slerp(up,k);y=lerp(H0+TK,.3,k)+Math.sin(k*PI)*34}else if(n===11)y=.3;
  return{q,t:new T3.Vector3(0,y,0)}}
function resolve(G,spec,fr){const v=new T3.Vector3(),q=new T3.Quaternion();
  if(spec.p){v.set(...spec.p);q.setFromEuler(new T3.Euler(...spec.r));return{v,q,arc:spec.arc||0}}
  const o=spec.f||[0,0,0];v.set(G.final[0]+o[0],G.final[1]+o[1],G.final[2]+o[2]).applyQuaternion(fr.q).add(fr.t);q.copy(fr.q);if(spec.ry)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0,1,0),spec.ry));if(spec.rz)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0,0,1),spec.rz));return{v,q,arc:0}}
function bolt116(axis,sign){const g=new T3.Group();g.add(at(pm(cg(.62,.5,.28),STEEL),0,.95,0),at(pm(cg(.3,.3,.45),STEEL),0,.6,0),at(pm(cg(.22,.22,2.3),STEEL),0,-.75,0),at(pm(helix(.36,1.7,8,.09),STEEL),0,-.15,0));cross(g,.42,1.1);return tag(point(g,axis,sign),.36)}
function longBolt(axis,sign){const g=new T3.Group();g.add(at(pm(cg(.8,.8,.3),STEEL),0,5.2,0),at(pm(cg(.3,.3,.36,6),DARK),0,5.2,0),at(pm(cg(.33,.33,6.2),STEEL),0,2,0),at(pm(cg(.33,.33,3.6),STEEL),0,-3,0),at(pm(helix(.42,3.4,14,.09),STEEL),0,-1.3,0),at(pm(cg(.33,.02,.7,10),STEEL),0,-5.15,0));return tag(point(g,axis,sign),.45)}
function barrel(axis,sign){const g=new T3.Group();g.add(pm(cg(.55,.55,2.6,16),STEEL));const sl=pm(bg(.9,.1,.16),DARK);g.add(at(sl,0,1.31,0));const h=pm(cg(.26,.26,1.15,12),DARK);h.rotation.z=PI/2;g.add(h);return tag(point(g,axis,sign),.6)}
function foot(axis,sign){const g=new T3.Group();g.add(at(pm(cg(1.5,1.5,.26,22),PLAST),0,.8,0));g.add(at(pm(bg(.35,1.4,.9),PLAST),0,0,0),at(pm(bg(.9,1.4,.35),PLAST),0,0,0));return tag(point(g,axis,sign),.5)}
function pad(axis,sign){const g=new T3.Group();g.add(at(pm(bg(3.8,.3,1.7),PLAST),0,.8,0));[-.9,.9].forEach(x=>g.add(at(pm(cg(.42,.42,1.3,12),PLAST),x,0,0)));return tag(point(g,axis,sign),0)}
function bar(){const g=new T3.Group(),pl=pm(bg(19.4,.25,1.8),ZINC);g.add(pl);[-8.4,8.4].forEach(x=>drill(pl,new T3.Vector3(x,.13,0),new T3.Vector3(0,1,0),.5,['2']));[-5.5,0,5.5].forEach(x=>{drill(pl,new T3.Vector3(x,-.13,0),new T3.Vector3(0,-1,0),.56,['6']);if(x)MARKS[MARKS.length-1].d.parent.scale.x=1.5});[-5.5,0,5.5].forEach(x=>{const h=at(pm(cg(.62,.62,.28,14),DARK),x,0,0);if(x)h.scale.x=1.6;g.add(h)});[-8.4,8.4].forEach(x=>{g.add(at(pm(cg(.32,.32,.28,10),DARK),x,0,0));g.add(at(pm(cg(.6,.32,.1,14),DARK),x,.1,0))});g.userData.code='120139';return g}
function hingeP(a,knuckle){const g=new T3.Group(),pl=pm(bg(3.6,.22,5),ZINC);g.add(at(pl,a*2,0,0));[-1.8,1.8].forEach(z=>[.9,3].forEach(x=>{g.add(at(pm(cg(.3,.3,.26,10),DARK),a*x,0,z));drill(pl,new T3.Vector3(a*(x-2),-.11,z),new T3.Vector3(0,-1,0),.34,['4'])}));if(knuckle){const k=pm(cg(.35,.35,5,10),STEEL);k.rotation.x=PI/2;g.add(at(k,0,-.14,0))}g.userData.code='10005601';return g}
function keyL(){const g=new T3.Group();[[0,0,0,5,'x'],[2.4,0,1.2,3,'z']].forEach(([x,y,z,l,a])=>{const m=pm(bg(a==='x'?l:.35,.35,a==='x'?.35:l),STEEL);g.add(at(m,x,y,z))});g.userData.code='10083377';return g}
const rail2=(l,y,zc,x)=>{const m=box(2.6,3,l,WOOD);return at(m,x,y,zc)};
function frameBody(a){const g=new T3.Group();[-1,1].forEach(z=>{g.add(at(box(PS,H0,PS,WOOD),0,0,z*(LZ/2)))});[H0/2-1.7,14,-6,-26].forEach(y=>g.add(at(box(1.4,3.4,LZ-PS,WOOD),-a*1.2,y,0)));g.userData.posts=g.children.slice(0,2);g.userData.top=g.children[2];return g}
function gateBody(s){const g=new T3.Group();g.add(at(box(3.4,H0-1.3,2.2,WOOD),s*GL,-.65,0));[H0/2-4,-H0/2+8].forEach(y=>g.add(at(box(GL-.7,3.4,2.2,WOOD),s*(GL-2.7)/2,y,0)));return g}
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
function hammerAt(s,tt,fr){const list=CP.filter(p=>p.tap&&p.keys[s]);const H=FR.ham;H.root.visible=false;if(!list.length)return;const p=list.find(q=>tt<q.tap[1]);if(!p||tt<p.tap[0])return;const[a,b]=p.tap,n=p.taps||3,u=clamp((tt-a)/(b-a));if(u<.08)return;H.root.visible=true;
  const A=.85,v=clamp((u-.3)/.7)*n,f=v%1,ang=u<.3||v>=n?A:f<.45?A*(1-(f/.45)**2):A*ease((f-.45)/.55);
  p.m.updateWorldMatrix(true,true);const bx=new T3.Box3().setFromObject(p.m);let X,Y,Z;
  if(s==='9'||s==='10'){const sd=p.side;X=new T3.Vector3(0,.92,-.38).normalize();Y=new T3.Vector3(sd,0,0);Z=X.clone().cross(Y);const hit=new T3.Vector3(sd>0?bx.max.x:bx.min.x,(bx.min.y+bx.max.y)/2,(bx.min.z+bx.max.z)/2);H.root.position.copy(hit).add(Y.clone().multiplyScalar(3.15)).sub(X.clone().multiplyScalar(H.L))}
  else{const sx=p.side;X=new T3.Vector3(-sx,0,0);Y=new T3.Vector3(0,1,0);Z=X.clone().cross(Y);const hit=new T3.Vector3((bx.min.x+bx.max.x)/2,bx.max.y,(bx.min.z+bx.max.z)/2);H.root.position.copy(hit).add(Y.clone().multiplyScalar(3.15)).sub(X.clone().multiplyScalar(H.L))}
  H.root.quaternion.setFromRotationMatrix(new T3.Matrix4().makeBasis(X,Y,Z));H.sw.rotation.z=ang}
function buildCab(){
  sc2=new T3.Scene();sc2.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(60,150,90);d.castShadow=true;d.shadow.mapSize.set(1536,1536);Object.assign(d.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:10,far:330});d.shadow.bias=-.0012;d.shadow.radius=4;sc2.add(d);FR.sun=d;
  FR.floor=box(420,1,300,0xdfe2dd);FR.floor.position.set(0,-.5,0);FR.floor.children[0].visible=false;sc2.add(FR.floor);
  const hideT={3:null,4:null},hideD={9:null,10:null};
  const fy=H0/2,fL=grp('frameL',null,[-BW/2-PS/2,fy,0],{1:[{f:[-6,0,0]},F],2:[F,0],...hideT,5:[F,0],6:[{f:[0,-34,0]},F],...hideD},{startAt:{1:.45},moveAt:{6:.5},anchor:[0,16,0]});
  const fR=grp('frameR',null,[BW/2+PS/2,fy,0],{1:[{f:[6,0,0]},F],2:[F,0],...hideT,5:[F,0],6:[{f:[0,-34,0]},F],...hideD},{startAt:{1:.45},moveAt:{6:.5},anchor:[0,16,0]});
  fL.g.add(frameBody(-1));fR.g.add(frameBody(1));
  const gt=grp('gateL',null,[-GX,fy,GZ],{1:[{f:[-6,0,0]},F],2:[F,0],...hideT,5:[F,{ry:-PI*.5}],6:[{f:[0,-34,0],ry:-PI*.5},{ry:-PI*.5}],7:[{ry:-PI*.5},0],8:[{ry:-PI*.5},0],...hideD,11:[{ry:-PI*.5},0]},{startAt:{1:.45},moveAt:{5:.2,6:.5},anchor:[-GL,0,0]});gt.g.add(gateBody(-1));
  const gr=grp('gateR',null,[GX,fy,-GZ],{1:[{f:[6,0,0]},F],2:[F,0],...hideT,5:[F,{ry:-PI*.5}],6:[{f:[0,-34,0],ry:-PI*.5},{ry:-PI*.5}],7:[{ry:-PI*.5},0],8:[{ry:-PI*.5},0],...hideD,11:[{ry:-PI*.5},F]},{startAt:{1:.45,11:.72},moveAt:{5:.2,6:.5,11:.86},anchor:[GL,0,0]});gr.g.add(gateBody(1));const peg=cyl(.5,2.4,PLAST);peg.position.set(GL,H0/2-1.6,0);gr.g.add(peg);FR.peg=peg;const pegL=cyl(.5,2.4,PLAST);pegL.position.set(-GL,H0/2-1.6,0);gt.g.add(pegL);
  const ties=grp('ties',null,[0,fy,0],{1:[F,0],2:[F,0],...hideT,5:[F,0],6:[{f:[0,-34,0]},F],...hideD},{moveAt:{6:.5}});const YB=-26.85;FR.bolts=[];
  [-1,1].forEach((z,i)=>{const bk=box(BW,5,3,WOOD);pt(ties,bk,[0,YB,z*(LZ/2)],{1:[[0,0,z*14],[0,0,0]]},{i,of:2,win:[.2,.45],lbl:'连接木块'});
    [-1,1].forEach(a=>{drill(bk,new T3.Vector3(a*BW/2,0,0),new T3.Vector3(a,0,0),.42,['5']);[-1.5,1.5].forEach(y=>pt(ties,dowel('x',a,.4,3),[a*(BW/2-.1),YB+y,z*(LZ/2)],{1:[[0,0,z*14],[0,0,0]]},{i,of:2,win:[.2,.45],ins:a*5}));
      const fg=(a<0?fL:fR).g.children[0],post=fg.userData.posts[z<0?0:1];[-1.5,1.5].forEach(y=>drill(post,new T3.Vector3(-a*PS/2,YB+y,0),new T3.Vector3(-a,0,0),.45,['1']));drill(post,new T3.Vector3(a*PS/2,YB,0),new T3.Vector3(a,0,0),.5,['5']);
      pt(ties,barrel('y',-1),[a*(BW/2-3.2),YB,z*(LZ/2)],{5:[[0,-9,0],[0,0,0]]},{i:(z+1)+(a+1)/2,of:4,win:[.2,.5],spin:'y',on:bk,code:'121121'});
      const blt=pt(ties,longBolt('x',a),[a*(BW/2+PS-5.35),YB,z*(LZ/2)],{5:[[a*12,0,0],[0,0,0]]},{i:(z+1)+(a+1)/2,of:4,win:[.5,1],spin:'x',nohole:1,seq:1,code:'105330'});FR.bolts.push(blt)})});
  const ky=keyL();ky.position.set(0,0,0);sc2.add(ky);FR.key=ky;
  // steel bars on the top rails
  [[fL,-1],[fR,1]].forEach(([G,a])=>[-24,24].forEach(z=>drill(G.g.children[0].userData.top,new T3.Vector3(0,1.7,z),new T3.Vector3(0,1,0),.3,['2'])));
  [-1,1].forEach((z,i)=>{const b=bar();pt(fL,b,[BW/2+PS/2,H0/2-.125,z*24],{2:[[0,10,0],[0,0,0]]},{i,of:2,win:[0,.5]});[-1,1].forEach((a,j)=>pt(fL,screw('y',1,{r:.3,len:1.1}),[BW/2+PS/2+a*8.4,H0/2-.83,z*24],{2:[[0,9,0],[0,0,0]]},{i:i*2+j,of:4,win:[.5,1],spin:'y',nohole:1,code:'110733'}));
    [-5.5,0,5.5].forEach((x,j)=>pt(fL,screw('y',-1,{r:.34,len:1.2}),[BW/2+PS/2+x,H0/2+.62,z*24],{6:[[0,-14,0],[0,0,0]]},{i:x===0?i:i*2+(x>0?1:0),of:x===0?2:4,win:x===0?[.55,.72]:[.72,1],spin:'y',nohole:1,code:'110733'}))});
  // table top, built upright then shown inverted
  const cP=box(CW-.24,TK,LZ+8,WOOD),lP=box(LW,TK,LZ+8,WOOD),rP=box(LW,TK,LZ+8,WOOD);
  const seq={1:null,2:null,3:[F,0],4:[F,0],5:null,6:[F,0],7:[F,0],9:null,10:null};
  const ct=grp('topC',cP,[0,H0+TK/2,0],{...seq,8:[F,0]});
  const bendL={rz:PI/2},bendR={rz:-PI/2};
  const lf=grp('leafL',null,[-CW/2,H0+TK/2,0],{...seq,8:[F,bendL],11:[bendL,0]},{startAt:{8:.28},move:.6,piv:[0,-TK/2-.2,0],anchor:[-LW/2,0,0]});lf.g.add(at(lP,-LW/2,0,0));
  const rf=grp('leafR',null,[CW/2,H0+TK/2,0],{...seq,8:[F,bendR],11:[bendR,{rz:.04}]},{startAt:{8:.28,11:.55},moveAt:{8:.6,11:.7},drop:{11:[.88,1]},piv:[0,-TK/2-.2,0],anchor:[LW/2,0,0]});rf.g.add(at(rP,LW/2,0,0));
  [-1,1].forEach(z=>[-5.5,0,5.5].forEach(x=>drill(cP,new T3.Vector3(x,-TK/2,z*24),new T3.Vector3(0,-1,0),.42,['6'])));
  [[lf,-1,lP],[rf,1,rP]].forEach(([G,a,P])=>{[-1,1].forEach(z=>drill(P,new T3.Vector3(a*18.5,-TK/2,z*.9),new T3.Vector3(0,-1,0),.34,['3']));[-BZ,BZ].forEach(z=>{const r=box(LW-9,1.3,2.6,WOOD);r.position.set(a*(LW/2+1.5),-TK/2-.65,z);[1].forEach(()=>{if(!((G===rf&&z<0)||(G===lf&&z>0)))drill(r,new T3.Vector3(a*16.5,-.65,0),new T3.Vector3(0,-1,0),.62,[])});G.g.add(r);if(G===rf&&z<0)drill(r,new T3.Vector3(16.5,-.65,0),new T3.Vector3(0,-1,0),.62,['11']);if(G===lf&&z>0)drill(r,new T3.Vector3(-16.5,-.65,0),new T3.Vector3(0,-1,0),.62,['11'])});const bl=box(5,1.3,4,WOOD);[-1,1].forEach(z=>drill(bl,new T3.Vector3(0,-.65,z*.9),new T3.Vector3(0,-1,0),.5,['3']));pt(G,bl,[a*50,-TK/2-.65,0],{3:[[0,-10,0],[0,0,0]]},{win:[0,.5],lbl:'垫块'});
    [-1,1].forEach((z,i)=>pt(G,screw('y',-1,{r:.3,len:2.2}),[a*50,-TK/2+.005,z*.9],{3:[[0,-9,0],[0,0,0]]},{i,of:2,win:[.5,1],spin:'y',nohole:1,code:'117494'}))});
  [[-1,lf,lP],[1,rf,rP]].forEach(([a,LF,P],i)=>[-31,31].forEach((z,j)=>{
    pt(ct,hingeP(-a,true),[a*CW/2,-TK/2-.14,z],{4:[[0,-9,0],[0,0,0]]},{i:i*2+j,of:4,win:[0,.45]});pt(LF,hingeP(a,false),[0,-TK/2-.14,z],{4:[[0,-9,0],[0,0,0]]},{i:i*2+j,of:4,win:[0,.45]});
    for(let k=0;k<8;k++){const sx=(k%4<2?-1:1)*(k%2?3:.9),sz=k<4?-1.8:1.8,inner=sx*a<0;drill(inner?cP:P,new T3.Vector3(inner?a*CW/2+sx:sx-a*LW/2,-TK/2,z+sz),new T3.Vector3(0,-1,0),.3,['4']);pt(inner?ct:LF,screw('y',-1,{r:.26,len:1.2}),[inner?a*CW/2+sx:sx,-TK/2+.55,z+sz],{4:[[0,-8,0],[0,0,0]]},{i:i*2+j,of:4,win:[.45,1],nohole:1,code:'110733'})}}));
  // feet and pads on leg ends
  [[fL,-1,-1],[fL,-1,1],[fR,1,-1],[fR,1,1]].forEach(([G,a,z],i)=>drill(G.g.children[0].userData.posts[z<0?0:1],new T3.Vector3(0,-H0/2,0),new T3.Vector3(0,-1,0),.75,['7']));
  [[fL,-1,-1],[fL,-1,1],[fR,1,-1],[fR,1,1]].forEach(([G,a,z],i)=>pt(G,foot('y',-1),[0,-H0/2+.67,z*(LZ/2)],{7:[[0,-10,0],[0,0,0]]},{tap:[i/4,(i+1)/4],taps:3,side:a,code:'107271'}));
  [gt,gr].forEach((G,i)=>{const s=i?1:-1;[-.9,.9].forEach(x=>drill(G.g.children[0].children[0]||G.g.children[0],new T3.Vector3(x,-(H0-1.3)/2,0),new T3.Vector3(0,-1,0),.45,['8']));pt(G,pad('y',-1),[s*GL,-H0/2+.65,0],{8:[[0,-9,0],[0,0,0]]},{tap:[i*.135,(i+1)*.135],taps:2,side:s,code:'156508'});if(i===0)FR.padObj=G.g.children[G.g.children.length-1]});
  // drawer parts for steps 9-10, one drawer at the origin
  const dw=14.8,dh=16.4,dd=30,th=1.8;const D={};
  const dg=grp('drawer',null,[0,0,0],{},{});sc2.remove(dg.g);GS.pop();
  const m=(name,w,h,d0,c=WOOD)=>{const b=box(w,h,d0,c);return b};
  [-1,1].forEach((a,i)=>{const sd=m('s',th,dh,dd);D['s'+a]=sd;[3,14.7].forEach(y=>[[-1,'9'],[1,'10']].forEach(([zs,st])=>drill(sd,new T3.Vector3(a*th/2,y-dh/2,zs*(dd/2-th/2)),new T3.Vector3(a,0,0),.32,[st])));sd.add(at(new T3.Mesh(bg(.12,.7,dd-.5),mat(0x3a4246)),-a*(th/2+.03),-dh/2+1.6,0));sd.add(at(box(.3,1,dd-.5,WOOD),a*(th/2+.15),dh/2-3.3,0));pt(null,sd,[a*(dw/2-th/2),dh/2+1,0],{9:[[a*8,0,0],[0,0,0]]},{i,of:2,win:[0,.25],lbl:'抽屉长板（凸条朝外）',only2:1,side:a,anchor:[0,dh/2,0]})});{const q=CP.filter(p=>p.lbl==='抽屉长板（凸条朝外）');q[0].pairM=q[1].m;q[1].pairM=q[0].m}
  const endP=(ntc)=>{const g=new T3.Group();const s=new T3.Shape();const W2=dw/2-th,H2=dh;s.moveTo(-W2,0);s.lineTo(W2,0);s.lineTo(W2,H2);if(ntc){s.lineTo(1.4,H2);s.lineTo(1.4,H2-4);s.absarc(0,H2-4,1.4,0,-PI,true);s.lineTo(-1.4,H2)}s.lineTo(-W2,H2);s.closePath();const ge=new T3.ExtrudeGeometry(s,{depth:th,bevelEnabled:false});ge.translate(0,0,-th/2);const me=new T3.Mesh(ge,mat(WOOD));me.add(new T3.LineSegments(new T3.EdgesGeometry(ge,20),EDGE()));g.add(me);return g};
  const be=endP(false);[-1,1].forEach(a=>[3,14.7].forEach(y=>drill(be.children[0],new T3.Vector3(a*(dw/2-th),y,0),new T3.Vector3(a,0,0),.3,['9'])));pt(null,be,[0,1,-dd/2+th/2],{9:[[0,0,-9],[0,0,0]]},{win:[.2,.5],lbl:'无缺口端板',only2:1,anchor:[0,dh-.5,0]});
  const fr=endP(true);[-1,1].forEach(a=>[3,14.7].forEach(y=>drill(fr.children[0],new T3.Vector3(a*(dw/2-th),y,0),new T3.Vector3(a,0,0),.3,['10'])));pt(null,fr,[0,1,dd/2-th/2],{10:[[0,-3,12],[0,0,0]]},{win:[.3,.6],lbl:'有缺口端板（缺口朝上）',only2:1,anchor:[-5,dh*.55,th/2],tiltX:{10:[.9,0]}});
  pt(null,m('b',dw-2*th+.6,.5,dd-1.6,GREY),[0,2.6,-.4],{10:[[0,0,dd+8],[0,0,0]]},{win:[0,.3],lbl:'抽屉底板',only2:1});
  [-1,1].forEach((a,i)=>[3,14.7].forEach((y,j)=>{pt(null,bolt116('x',a),[a*(dw/2-1),y+1,-dd/2+th/2],{9:[[a*9,0,0],[0,0,0]]},{tap:[.5+(i*2+j)*.125,.5+(i*2+j+1)*.125],taps:2,side:a,only2:1,nohole:1,code:'116546'});pt(null,bolt116('x',a),[a*(dw/2-1),y+1,dd/2-th/2],{10:[[a*9,0,0],[0,0,0]]},{tap:[.6+(i*2+j)*.1,.6+(i*2+j+1)*.1],taps:2,side:a,only2:1,nohole:1,code:'116546'})}));
  FR.ham=hammerRig();sc2.add(FR.ham.root);
  const drs=[];[-1,1].forEach(z=>[58.1,38.2,18.2].forEach((y,r)=>{const g=new T3.Group(),f=endP(true);f.position.set(0,1.5,z*14.9);if(z<0)f.rotation.y=0;const bd=box(13.6,16.2,30,WOOD);bd.position.set(0,9.7,0);g.add(bd,f);g.position.set(0,y-8,z*21.8);g.userData.z=z*21.8;sc2.add(g);drs.push({g,z,r})}));FR.drs=drs;
  GS.forEach(G=>{G.g.position.set(0,0,0);G.g.quaternion.identity();G.g.position.set(...G.final)});
  sc2.updateMatrixWorld(true);
  CP.forEach(p=>{const r=p.m.userData.hr;if(!r||!p.on)return;const k=Object.keys(p.keys)[0];const off=p.keys[k][0];const start=new T3.Vector3(...p.pos).add(new T3.Vector3(...off));p.m.parent.localToWorld(start);const dir=new T3.Vector3(-off[0],-off[1],-off[2]).normalize().transformDirection(p.m.parent.matrixWorld),ry=new T3.Raycaster(start,dir),hit=ry.intersectObject(p.on,false)[0];if(!hit)return;const nW=hit.face.normal.clone().transformDirection(p.on.matrixWorld),inv=new T3.Matrix4().copy(p.on.matrixWorld).invert();drill(p.on,hit.point.clone().applyMatrix4(inv),nW.clone().transformDirection(inv).normalize(),r,[k])});
  cabReady=true;
}
const CC={def:[[120,110,190],[10,36,0]],low:[[110,120,170],[0,14,0]],dr:[[52,44,72],[0,9,0]],gate:[[150,70,170],[30,44,-10]],back:[[-110,90,190],[0,44,0]],peg:[[105,50,-85],[62,68,-33]]};
function camFor(id,t=0){if(id==='9'||id==='10')return CC.dr;if(id==='11')return t>.8?CC.peg:t>.52?CC.gate:CC.def;if(id==='3'||id==='4')return CC.low;return CC.def}
let lastStage='';const STG={'8':[[.27,'把 2 个止动垫敲入支撑腿底端'],[.6,'两侧桌板向框架折起'],[2,'两人把桌子翻回正面']],'11':[[.52,'把 6 个抽屉从两端推入'],[.71,'抬起桌板，略高于水平'],[.88,'转出支撑腿'],[2,'放下桌板，定位销进入桌板下的孔']],'5':[[.2,'把两片支撑腿收进框架两侧'],[.5,'把 4 个 121121 放入连接木块'],[2,'用内六角扳手拧入 4 根长螺栓']],'6':[[.55,'把框架放到桌面中段'],[.72,'先拧每根钢条中间的孔'],[2,'再拧两端的椭圆孔']]};
function stage(s,tt){const list=STG[s];let txt='';if(list)txt=list.find(x=>tt<x[0])[1];const key=s+txt;if(key!==lastStage){lastStage=key;document.getElementById('animCap').textContent='第 '+s+' 步 · '+(txt||byId[s].title)}}
function applyCab(s,tt){
  mark(s);MARKS.forEach(h=>{const g=h.d.parent;if(g.userData.sx==null)g.userData.sx=g.scale.x;const k=h.steps.includes(s)?1.35:1;g.scale.set(g.userData.sx*k,1,k)});const fr=frameOf(s,tt),n=ORD(s);CENTER=fr.t.clone().setY(36);
  GS.forEach(G=>{let spec=G.seq[s];const keys=Object.keys(G.seq).filter(k=>G.seq[k]!==null).map(k=>ORD(k));
    if(spec===undefined){if(n<Math.min(...keys)){G.g.visible=false;return}spec=[F,F]}
    if(spec===null){G.g.visible=false;return}
    G.g.visible=true;G.start=G.startAt&&G.startAt[s]||0;const mv=(G.moveAt&&G.moveAt[s])||G.move||1,a=spec[0],b=spec[1]===0?a:spec[1],k=ease(clamp((tt-G.start)/(mv-G.start))),A1=resolve(G,a,fr),B1=resolve(G,b,fr);
    G.g.position.copy(A1.v).lerp(B1.v,k);G.g.quaternion.copy(A1.q).slerp(B1.q,k);const dp=G.drop&&G.drop[s];if(dp){const d=ease(clamp((tt-dp[0])/(dp[1]-dp[0]))),E=resolve(G,F,fr);G.g.position.lerp(E.v,d);G.g.quaternion.slerp(E.q,d)}if(G.piv){const p0=new T3.Vector3(...G.piv),w=new T3.Vector3(G.final[0],G.final[1],G.final[2]).add(p0).applyQuaternion(fr.q).add(fr.t);G.g.position.copy(w).sub(p0.applyQuaternion(G.g.quaternion))}});
  CP.forEach(p=>{const ks=Object.keys(p.keys),first=ORD(ks[0]);if(p.key){p.m.visible=false;return}
    if(n<first||(p.only2&&s!=='9'&&s!=='10')){p.m.visible=false;return}
    if(s==='9'&&p.keys[10]&&!p.keys[9]){p.m.visible=false;return}
    p.m.visible=true;const k=p.keys[s];let L=tt;
    if(k){const [a,b]=p.win||[0,1];L=clamp((tt-a)/(b-a));if(p.of>1){const gap=(p.seq?1:.5)/p.of;L=clamp((L-p.i*gap)/(1-(p.of-1)*gap))}L=ease(L);if(p.tap)L=tapL(p,tt);
      p._L=L;p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],L),p.pos[1]+lerp(k[0][1],k[1][1],L),p.pos[2]+lerp(k[0][2],k[1][2],L));tint(p.m,L<1&&L>0)
    }else{p.m.position.set(...p.pos);tint(p.m,false)}
    if(p.ins&&s==='1')p.m.position.x+=p.ins*(1-ease(clamp(tt/.2)));if(p.spin&&k){const off=k[0]['xyz'.indexOf(p.spin)];p.m.rotation[p.spin]=-(off<0?-1:1)*L*PI*3}if(p.tiltX&&p.tiltX[s]&&k)p.m.rotation.x=lerp(p.tiltX[s][0],p.tiltX[s][1],L)});
  hammerAt(s,tt,fr);if(FOC)FOC.objs.forEach(o=>hl(o,true));
  FR.key.visible=s==='5'&&tt>=.5;if(FR.key.visible){const i=Math.min(3,Math.floor((tt-.5)/.125)),q=FR.bolts[i],o=new T3.Vector3();q.getWorldPosition(o);const a=i%2?1:-1;FR.key.scale.x=o.x<0?-1:1;FR.key.position.copy(o).add(new T3.Vector3(a*7.5,0,0).applyQuaternion(fr.q));FR.key.rotation.x=a*tt*40}
  FR.floor.visible=s!=='9'&&s!=='10';
  FR.drs.forEach((d,i)=>{d.g.visible=s==='11';const L=ease(clamp((tt-i*.06)/.14));d.g.position.z=lerp(d.g.userData.z+d.z*44,d.g.userData.z,L)});
  stage(s,tt);
  const c=camFor(s,tt),tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.14):want.clone();camTgt=camTgt?camTgt.lerp(tp,.14):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}

/* Answer visuals: focus the camera on a named part, highlight it, replay a window of the step. Names match part codes, cell names, labels and group names. */
let FOC=null;const GN={'框架':['frameL','frameR'],'支撑腿':['gateL','gateR'],'桌板':['leafL','leafR'],'活动桌板':['leafL','leafR'],'中段桌板':['topC'],'桌面':['topC','leafL','leafR']};
const vis=o=>{let v=o.visible;o.traverseAncestors(a=>{if(!a.visible)v=false});return v};
function findObjs(name){const s=String(name||'').replace(/[\s，。]/g,'');if(!s)return[];const cell=(typeof CELLS!=='undefined'?CELLS:[]).find(x=>x.code===s||x.name===s)||(typeof CELLS!=='undefined'?CELLS:[]).find(x=>s.includes(x.name));const code=cell?cell.code:/^\d{5,}$/.test(s)?s:null;
  const L=CP.filter(p=>{const c=p.code||codeOf(p.m);if(code)return c===code;return p.lbl&&(p.lbl.includes(s)||s.includes(p.lbl.replace(/（.*$/,'')))});const now=L.filter(p=>p.keys[cur]);let o=(now.length?now:L).map(p=>p.m);
  if(!o.length&&!code){const g=GN[s]||Object.keys(GN).filter(k=>s.includes(k)).map(k=>GN[k]).flat();o=g.map(n=>FR[n]&&FR[n].g).filter(Boolean);
    if(/抽屉/.test(s)&&cur==='11')o=FR.drs.map(d=>d.g);if(/定位销/.test(s))o=[FR.peg];if(/扳手/.test(s))o=[FR.key];if(/锤/.test(s))o=[FR.ham.root];if(code==='120139'||/钢条/.test(s))o=CP.filter(p=>codeOf(p.m)==='120139').map(p=>p.m)}
  if(!o.length&&code==='10083377')o=[FR.key];return o}
function hl(m,on){m.traverse(o=>{const M=o.material;if(!o.isMesh||!M||!M.color||M.isMeshBasicMaterial)return;if(M.map){if(M.emissive)M.emissive.setHex(on?0x8a3a00:0);return}if(on){if(M.color.getHex()!==HOT)M.userData.hb=M.color.getHex();M.color.setHex(HOT)}else if(M.userData.hb!=null)M.color.setHex(M.userData.hb)})}
function focus(name,w){unfocus(1);if(!cabReady||!cur||IDS.includes(cur))return null;const L=findObjs(name);if(!L.length)return null;const w0=Array.isArray(w)&&w.length===2&&w.every(x=>isFinite(+x))?[clamp(+w[0]),clamp(Math.max(+w[0]+.05,+w[1]))]:null;
  poseAt(w0?w0[1]:Math.min(t,1));const objs=L.filter(vis);if(!objs.length){poseAt(Math.min(t,1));return null}const box=new T3.Box3();objs.forEach(o=>box.expandByObject(o));poseAt(Math.min(t,1));
  const ct=box.getCenter(new T3.Vector3()),r=box.getSize(new T3.Vector3()).length()/2,vt=Math.tan(cam.fov*PI/360)*Math.min(1,cam.aspect);
  FOC={objs,w:w0,ct,D:Math.max(r/vt*1.25,16),d:viewDir(),n:0,name:String(name),stop:false};if(window._resetView)window._resetView();
  if(w0){t=w0[0];playing=true;const p=document.getElementById('animPlay');if(p)p.textContent='暂停'}
  const d=document.createElement('div');d.className='alabel foc';d.textContent=(cell=>cell?cell.n+' 格 · '+cell.name:String(name))((typeof CELLS!=='undefined'?CELLS:[]).find(x=>x.code===name||x.name===name));d.style.cssText='background:#f07a22;color:#fff;border-color:#f07a22';document.getElementById('animLabels').append(d);const ln=document.createElementNS('http://www.w3.org/2000/svg','line');document.getElementById('animLines').append(ln);FOC.lbl={obj:objs[0],win:[-1,2],d,line:ln,text:d.textContent,dir:false};LBL.push(FOC.lbl);
  return{part:FOC.name,count:objs.length,window:w0}}
function focLoop(){if(!FOC||!FOC.w||!playing)return;if(t>FOC.w[1]+.08){if(++FOC.n>=3){t=Math.min(FOC.w[1],.97);playing=false;FOC.stop=true;const p=document.getElementById('animPlay');if(p)p.textContent='播放'}else t=FOC.w[0]}}
function focCam(){const th=Math.atan2(FOC.d.x,FOC.d.z)+az,ph=clamp(Math.asin(FOC.d.y)+el,-.3,1.35),v=new T3.Vector3(Math.sin(th)*Math.cos(ph),Math.sin(ph),Math.cos(th)*Math.cos(ph)).multiplyScalar(FOC.D).add(FOC.ct);if(!FOC.cp){FOC.cp=camPos.clone();FOC.ctg=camTgt.clone()}FOC.cp.lerp(v,.2);FOC.ctg.lerp(FOC.ct,.2);camPos.copy(FOC.cp);camTgt.copy(FOC.ctg);cam.position.copy(camPos);cam.lookAt(camTgt)}
function unfocus(quiet){if(!FOC)return;const f=FOC;FOC=null;f.objs.forEach(o=>hl(o,false));if(f.lbl){f.lbl.d.remove();f.lbl.line.remove();LBL=LBL.filter(x=>x!==f.lbl)}if(f.stop&&!quiet){playing=true;const p=document.getElementById('animPlay');if(p)p.textContent='暂停'}if(!quiet)computeFit()}
