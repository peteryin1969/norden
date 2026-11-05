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
  if(id==='31')z=lerp(0,55,ease(t));if(id==='32w')z=55;if(id==='32')z=lerp(55,0,ease(clamp(t/.4)));if(id==='33')z=lerp(55,2.5,ease(clamp(t/.5)));if(id==='34')z=2.5;
  return{q,t:new T3.Vector3(0,y,z)}}
function resolve(G,spec,fr){const v=new T3.Vector3(),q=new T3.Quaternion();
  if(spec.p){v.set(...spec.p);q.setFromEuler(new T3.Euler(...spec.r));return{v,q,arc:spec.arc||0}}
  const o=spec.f||[0,0,0];v.set(G.final[0]+o[0],G.final[1]+o[1]-CH/2,G.final[2]+o[2]).applyQuaternion(fr.q).add(fr.t);q.copy(fr.q);if(spec.rx)q.multiply(new T3.Quaternion().setFromAxisAngle(new T3.Vector3(1,0,0),spec.rx));return{v,q,arc:0}}
function buildCab(){
  sc2=new T3.Scene();sc2.add(new T3.AmbientLight(0xffffff,.85));const d=new T3.DirectionalLight(0xffffff,.45);d.position.set(30,70,-40);sc2.add(d);
  const carcHide={...range(7,9,null),17:null,25:null};
  const A=grp('sideA',box(TK,CH,CD,WOOD),[-SX,CH/2,0],{1:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],2:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],3:[FLAT([-46,TK/2,0],[0,0,PI/2]),0],4:null,5:[F,F],...carcHide});
  const Bb=grp('sideB',box(TK,CH,CD,WOOD),[SX,CH/2,0],{1:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],2:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],3:[FLAT([46,TK/2,0],[0,0,-PI/2]),0],...range(4,14,null),15:[{f:[34,0,0]},F],16:[F,F],17:null,25:null});
  const M1=FLAT([0,TK/2,0],[0,0,PI/2]),M2=FLAT([0,TK/2,0],[0,0,-PI/2]);
  const Mid=grp('mid',box(TK,CH,CD,WOOD),[0,CH/2,0],{7:[M1,0],8:[M1,{...M2,arc:32}],9:[M2,0],10:[{f:[34,0,0]},F],17:null,25:null});
  const ba=grp('botA',box(B,TK,CD,WOOD),[-BX,PH+TK/2,0],{4:[FLAT([-46,TK/2,0],[0,0,0]),0],5:[{f:[34,0,0]},F],...carcHide});
  const bb=grp('botB',box(B,TK,CD,WOOD),[BX,PH+TK/2,0],{4:[FLAT([46,TK/2,0],[0,0,0]),0],...range(5,12,null),13:[{f:[34,0,0]},F],17:null,25:null});
  // runners and screws on the side panels and divider
  const levels=[17,41,65];
  [[A,1],[Bb,-1]].forEach(([G,a])=>levels.forEach((y,li)=>{pt(G,box(1.1,1.6,CD-5,METAL),[a*1.4,y-CH/2,0],{1:[[a*10,0,0],[0,0,0]]},{i:li,of:3,win:[0,.45]});
    [-18,0,18].forEach((z,i)=>pt(G,cyl(.42,1.5,0x333b3f,'x'),[a*2.3,y-CH/2,z],{1:[[a*10,0,0],[0,0,0]]},{i,of:3,win:[.45,1],spin:'x'}));
    const lv=box(.5,3.6,2.4,GREY);pt(G,lv,[a*1.2,y-CH/2+3,-CD/2+3],{2:[[0,0,0],[0,0,0]]},{i:li,of:3,swing:'x'})}));
  [[A,1],[Bb,-1]].forEach(([G,a])=>[-12,12].forEach((z,i)=>pt(G,cyl(.5,5.5,METAL,'x'),[a*3.2,PH+1-CH/2,z],{3:[[a*12,0,0],[0,0,0]]},{i,of:2,spin:'x'})));
  [[ba],[bb]].forEach(([G])=>[-1,1].forEach(a=>[-16,16].forEach((z,i)=>pt(G,cyl(.45,5,DOW,'x'),[a*(B/2+1.2),0,z],{4:[[a*11,0,0],[0,0,0]]},{i,of:2}))));
  [[Mid,1,7],[Mid,-1,8]].forEach(([G,a,s])=>levels.forEach((y,li)=>{pt(G,box(1.1,1.6,CD-5,METAL),[a*1.4,y-CH/2,0],{[s]:[[a*10,0,0],[0,0,0]]},{i:li,of:3,win:[s===8?.5:0,s===8?.75:.5]});
    [-18,18].forEach((z,i)=>pt(G,cyl(.42,2,0x333b3f,'x'),[a*2.5,y-CH/2,z],{[s]:[[a*10,0,0],[0,0,0]]},{i,of:2,win:[s===8?.75:.5,1],spin:'x'}))}));
  [-12,12].forEach((z,i)=>{pt(Mid,cyl(.5,5.5,METAL,'x'),[-3.2,PH+1-CH/2,z],{9:[[-12,0,0],[0,0,0]]},{i,of:2,spin:'x'});pt(Mid,cyl(.5,5.5,METAL,'x'),[3.2,PH+1-CH/2,z],{12:[[12,0,0],[0,0,0]]},{i,of:2,spin:'x'})});
  const cam=(G,x,z,k)=>pt(G,cyl(.8,1,METAL),[x,-.9,z],{[k]:[[0,-11,0],[0,0,0]]},{i:z>0?1:0,of:2,spin:'y'});
  [-12,12].forEach(z=>{cam(ba,-B/2+3,z,6);cam(ba,B/2-3,z,11);cam(bb,-B/2+3,z,14);cam(bb,B/2-3,z,16)});
  // plinths
  [[-BX,'pA',-13],[BX,'pB',13]].forEach(([x,n,zz])=>{const P0=FLAT([0,PH/2,zz],[0,0,0]);const G=grp(n,box(B,PH,TK,WOOD),[x,PH/2,CD/2-3],{17:[P0,0],18:[{f:[0,-16,0]},F]});
    [-1,1].forEach((a,i)=>{pt(G,box(2.4,.4,2.4,METAL),[a*(B/2-4),PH/2+.2,0],{17:[[0,9,0],[0,0,0]]},{i,of:2,win:[0,.5]});pt(G,box(2.4,2.6,.4,METAL),[a*(B/2-4),PH/2+1.4,-1.2],{17:[[0,9,0],[0,0,0]]},{i,of:2,win:[0,.5]});
      pt(G,cyl(.5,1.3,0x333b3f),[a*(B/2-4),PH/2+.7,0],{17:[[0,9,0],[0,0,0]]},{i,of:2,win:[.5,1],spin:'y'});pt(G,cyl(.5,1.3,0x333b3f,'z'),[a*(B/2-4),PH/2+1.6,-2],{18:[[0,0,-10],[0,0,0]]},{i,of:2,win:[.5,1],spin:'z'});
      pt(G,box(2.4,PH+.6,TK+1,0xe8eae6),[a*(B/2-.6),0,0],{19:[[0,0,10],[0,0,0]]},{i,of:2})});carc.push(G)});
  [[A],[Mid],[Bb]].forEach(([G],i)=>pt(G,box(TK+.8,1.2,CD*.45,0xe8eae6),[0,-CH/2-.5,CD/2-14],{20:[[0,-10,0],[0,0,0]]},{i:0,of:1,delay:i*.22}));
  // back panel
  const Bk=grp('back',box(2*SX,CH-3,.5,GREY),[0,CH/2+.5,-CD/2+.9],{21:[{f:[0,-CH*.95,0]},F],25:null});
  const fold=new T3.Mesh(new T3.BoxGeometry(2*SX,.25,.6),mat(0x777b78));fold.position.set(0,0,0);Bk.g.add(fold);
  [[-60,-34],[-20,-34],[20,-34],[60,-34],[-60,34],[0,34],[60,34]].forEach(([x,y],i)=>{pt(Bk,cyl(.8,1.4,0xf0f0ea,'z'),[x,y,-.6],{22:[[0,0,-10],[0,0,0]]},{i,of:7})});
  [[-40,12],[-40,-12],[40,12],[40,-12]].forEach(([x,y],i)=>pt(Bk,box(2.2,1.6,1.4,0xf0f0ea),[x,y,-.8],{23:[[0,0,-10],[0,0,0]]},{i,of:4}));
  [[-40,26],[40,26]].forEach(([x,y],i)=>pt(Bk,box(2.2,1.6,1.4,0xf0f0ea),[x,y,-.8],{29:[[0,0,-10],[0,0,0]]},{i,of:2}));
  // top
  const Tp=grp('top',box(2*SX+TK+2,TK,CD+2,WOOD),[0,CH+TK/2,0],{25:[FLAT([0,TK/2,0],[PI,0,0]),0],26:[{f:[0,36,0],rx:-.22},F]});
  [[-SX,-15],[-SX,15],[0,-15],[0,15],[SX,-15],[SX,15]].forEach(([x,z],i)=>pt(Tp,cyl(.5,5.5,METAL),[x,-3,z],{25:[[0,-12,0],[0,0,0]]},{i,of:6,spin:'y'}));
  [[A,0,-1],[A,0,1],[Mid,0,1],[Mid,0,-1],[Bb,0,-1],[Bb,0,1]].forEach(([G,x,s],i)=>pt(G,cyl(.45,5,DOW),[x,CH/2+1.5,s*8],{24:[[0,12,0],[0,0,0]]},{i,of:6,win:[.6,1]}));
  [[-SX+1.4,1],[-SX+1.4,-1],[SX-1.4,1],[SX-1.4,-1]].forEach(([x,s],i)=>pt(Tp,cyl(.8,1,METAL,'x'),[x+(x<0?1.5:-1.5),-1.7,s*15],{27:[[x<0?12:-12,0,0],[0,0,0]]},{i,of:4,spin:'x'}));
  [-1,1].forEach((s,i)=>pt(Tp,cyl(1,1.3,METAL,'x'),[3,-1.7,s*15],{28:[[12,0,0],[0,0,0]]},{i,of:2,spin:'x'}));
  // wall, floor, fittings
  const wall=box(330,130,1,0xe6e9e6);wall.position.set(0,65,WZ-.5);const wg=new T3.Group();wg.add(wall);sc2.add(wg);FR.wall=wg;
  const skirt=box(330,8,2.5,0xd3d6d2);skirt.position.set(0,4,WZ+1.25);sc2.add(skirt);FR.skirt=skirt;
  [-1,1].forEach((a,i)=>{const G=a<0?A:Bb;const pl=box(.3,3.2,3.6,METAL);pt(G,pl,[-a*2,CH/2-6,-CD/2+.4],{30:[[0,0,3],[0,0,0]]},{i:0,of:1,win:[0,.35]});
    const m1=box(4,.4,.4,0x222222),m2=box(4,.4,.4,0x222222);m1.rotation.z=.8;m2.rotation.z=-.8;[m1,m2].forEach(m=>pt(null,m,[a*(SX-2),CH-6,WZ+.1],{30:[[0,0,0],[0,0,0]]},{win:[.5,.95],until:'34'}));
    pt(null,cyl(1.1,.5,0xf4f4ef,'z'),[a*(SX-2),CH-6,WZ+.25],{'32w':[[0,0,12],[0,0,0]]},{win:[.55,1],until:'34'});
    const sc=cyl(.5,7,0x333b3f,'z');pt(G,sc,[-a*2,CH/2-6,-CD/2-1],{32:[[0,0,12],[0,0,0]]},{win:[.45,.8],spin:'z',only:'32'});
    const sc3=cyl(.5,7,0x333b3f,'z');pt(G,sc3,[-a*2,CH/2-6,-CD/2-2],{34:[[0,0,14],[0,0,0]]},{win:[0,.55],spin:'z',from2:1});
    pt(G,box(3.2,3.2,2,0xf0f0ea),[-a*2,CH/2-6,-CD/2-.9],{33:[[0,0,14],[0,0,0]]},{win:[.5,1],from2:1});
    pt(G,cyl(.6,1.2,0xc33),[-a*4.5,CH/2-3,-CD/2+3],{32:[[0,-4,6],[0,0,0]]},{win:[.8,1],only:'32'});
    pt(G,cyl(.6,1.2,0xc33),[-a*4.5,CH/2-3,-CD/2+3],{34:[[0,-4,6],[0,0,0]]},{win:[.6,1],from2:1});
    if(i===0){const drill=new T3.Group();const dc=box(5,5,13,0x45604f),bit=cyl(.4,11,METAL,'z');bit.position.z=-11;drill.add(dc,bit);drill.position.set(a*(SX-2),CH-6,WZ+20);sc2.add(drill);FR.drill=drill}});
  FR.pencil=(()=>{const c=new T3.Mesh(new T3.CylinderGeometry(.5,.1,14,10),mat(0xd8a02f));c.rotation.x=1;sc2.add(c);return c})();
  // drawers for step 45
  const drs=[];[-BX,BX].forEach((x,col)=>[60,36,12].forEach((y,row)=>{const g=new T3.Group();const f=box(B-1,21,TK,WOOD);f.position.z=CD/2+1;const bd=box(B-5,17,CD-4,0xeef0ec);g.add(f,bd);g.position.set(x,y+4,0);sc2.add(g);drs.push({g,col,row})}));FR.drs=drs;
  FR.floor=box(420,1,300,0xdfe2dd);FR.floor.position.set(0,-.5,60);sc2.add(FR.floor);
  cabReady=true;
}
const CC={def:[[62,112,-178],[0,20,-8]],flat:[[50,120,-150],[0,0,0]],front:[[110,95,215],[0,40,0]],back:[[120,100,-215],[0,38,0]],wall:[[170,105,190],[0,40,30]]};
function camFor(id){const n=+id;if(id==='45')return CC.front;if(id==='29')return CC.back;if(['30','31','32w','32','33','34'].includes(id))return CC.wall;if(n<=4||(n>=7&&n<=9)||n===17)return CC.flat;if(n>=24)return n===25?CC.flat:CC.front;return CC.def}
function applyCab(s,tt){
  const fr=frameOf(s,tt),n=ORD(s);
  GS.forEach(G=>{let spec=G.seq[s];const keys=Object.keys(G.seq).map(k=>ORD(k)).filter(k=>k>=0);
    if(spec===undefined){if(n<Math.min(...keys)){G.g.visible=false;return}spec=[F,F]}
    if(spec===null){G.g.visible=false;return}
    G.g.visible=true;const a=spec[0],b=spec[1]===0?a:spec[1],k=ease(tt),A1=resolve(G,a,fr),B1=resolve(G,b,fr);
    G.g.position.copy(A1.v).lerp(B1.v,k);G.g.position.y+=Math.sin(k*PI)*(B1.arc||0);G.g.quaternion.copy(A1.q).slerp(B1.q,k);
    if(G.body&&G.body.material)G.body.material.color.setHex(a!==b&&(a.f||b.f||b.arc)&&tt<1?ACC:G.base)});
  if(s==='45'){}
  CP.forEach(p=>{const ks=Object.keys(p.keys),first=ORD(ks[0]);
    if(n<first||(p.until&&n>ORD(p.until))||(p.only&&!(s===p.only||(s==='45'&&false)))&&n>=first&&s!==p.only&&ORD(s)<ORD('45')){p.m.visible=false;return}
    if(p.from2&&s!=='34'&&s!=='33'&&s!=='45'){p.m.visible=false;return}
    p.m.visible=!(s==='45'&&!p.G);
    const k=p.keys[s];const col=p.m.material;let L=tt;
    if(k){const [a,b]=p.win||[0,1];L=clamp((tt-a-(p.delay||0))/(b-a-(p.delay||0)));if(p.of>1){const gap=.5/p.of;L=clamp((L-p.i*gap)/(1-(p.of-1)*gap))}L=ease(L);
      p.m.position.set(p.pos[0]+lerp(k[0][0],k[1][0],L),p.pos[1]+lerp(k[0][1],k[1][1],L),p.pos[2]+lerp(k[0][2],k[1][2],L));
      if(col&&col.color)col.color.setHex(L<1&&L>0?ACC:p.base)
    }else{p.m.position.set(...p.pos);if(col&&col.color)col.color.setHex(p.base)}
    const rz=p.m.rotation.z,base=p.m.rotation;if(p.spin&&k)base[p.spin]=L*PI*3;if(p.swing&&k)base.x=Math.sin(L*PI)*-1.3});
  const wallOn=n>=ORD('30')&&s!=='45';FR.wall.visible=wallOn;FR.skirt.visible=s==='33'||s==='34';FR.floor.visible=n>=ORD('24')&&s!=='25';
  FR.drill.visible=s==='32w';if(s==='32w')FR.drill.position.z=WZ+lerp(24,9,ease(clamp(tt/.5)));
  FR.pencil.visible=s==='30';if(s==='30')FR.pencil.position.set(-(SX-2)+Math.sin(tt*30)*.8,CH-1,WZ+7);
  FR.drs.forEach((d,i)=>{d.g.visible=s==='45';const done=d.col===1&&d.row===0;const ord=[0,1,2,3,4,5].indexOf(i);const seq=[1,2,3,0,4,5][i];const L=done?1:ease(clamp((tt-(seq-1)*.19)/.22));d.g.position.z=lerp(62,0,L)});
  const c=camFor(s),tp=new T3.Vector3(...c[1]),base=new T3.Vector3(...c[0]).sub(tp),r=base.length(),th=Math.atan2(base.x,base.z)+az,ph=clamp(Math.asin(base.y/r)+el,-.3,1.3);
  const want=new T3.Vector3(Math.sin(th)*Math.cos(ph)*r,Math.sin(ph)*r,Math.cos(th)*Math.cos(ph)*r).add(tp);
  camPos=camPos?camPos.lerp(want,.14):want.clone();camTgt=camTgt?camTgt.lerp(tp,.14):tp.clone();cam.position.copy(camPos);cam.lookAt(camTgt);
}
