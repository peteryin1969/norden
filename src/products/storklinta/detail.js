/* Detailed part models. Each is built along +Y with its working end (head or slot) at the top, then pointed along axis*sign. */
const GC={};const geo=(k,f)=>GC[k]||(GC[k]=f());
const DARK=0x20282a,STEEL=0xa9b2b6,ZINC=0xc8ccc8,PLAST=0xf1f1ea,WOODP=0xd9b77e;
const pm=(g,c)=>new T3.Mesh(g,new T3.MeshPhongMaterial({color:c,shininess:60}));
const cg=(r1,r2,h,n=16)=>geo(`c${r1}_${r2}_${h}_${n}`,()=>new T3.CylinderGeometry(r1,r2,h,n));
const bg=(a,b,c)=>geo(`b${a}_${b}_${c}`,()=>new T3.BoxGeometry(a,b,c));
function at(m,x,y,z){m.position.set(x,y,z);return m}
function helix(r,len,turns,tube){return geo(`h${r}_${len}_${turns}`,()=>{const P=[],N=turns*10;for(let i=0;i<=N;i++){const a=i/10*Math.PI*2;P.push(new T3.Vector3(Math.cos(a)*r,-i/N*len,Math.sin(a)*r))}return new T3.TubeGeometry(new T3.CatmullRomCurve3(P),N,tube,5)})}
function point(inner,axis,sign){const o=new T3.Group();o.add(inner);if(axis==='x')inner.rotation.z=-sign*Math.PI/2;else if(axis==='z')inner.rotation.x=sign*Math.PI/2;else if(sign<0)inner.rotation.x=Math.PI;return o}
function cross(g,r,y){g.add(at(pm(bg(r*1.5,r*.25,r*.3),DARK),0,y,0),at(pm(bg(r*.3,r*.25,r*1.5),DARK),0,y,0))}
function screw(axis='y',sign=1,o={}){const{r=.34,len=2.4,c=0x4a5256,wide=false}=o,g=new T3.Group(),hr=wide?r*2.5:r*1.9,hh=r*.75;
  g.add(at(pm(cg(hr,r*1.05,hh),c),0,len/2+hh/2,0));cross(g,hr*.75,len/2+hh);g.add(pm(cg(r*.8,r*.8,len),c));
  g.add(at(pm(helix(r*1.1,len*.92,Math.round(len/(r*.55)),r*.17),c),0,len/2,0));g.add(at(pm(cg(r*.8,.02,r*1.3,10),c),0,-len/2-r*.6,0));return point(g,axis,sign)}
function conn(axis='y',sign=1){const g=new T3.Group();g.add(at(pm(cg(.62,.5,.5),STEEL),0,2.9,0));cross(g,.5,3.17);g.add(at(pm(cg(.42,.42,.6),STEEL),0,2.35,0),at(pm(cg(.72,.72,2.3,6),ZINC),0,.95,0),at(pm(cg(.85,.85,.28),ZINC),0,-.35,0),at(pm(cg(.45,.45,2.2),STEEL),0,-1.6,0),at(pm(helix(.58,2,5,.13),STEEL),0,-.55,0));return point(g,axis,sign)}
function dowel(axis='y',sign=1,r=.45,l=5){const g=new T3.Group();g.add(pm(cg(r,r,l,10),WOODP),at(pm(cg(r*.72,r,.35,10),WOODP),0,l/2+.17,0),at(pm(cg(r,r*.72,.35,10),WOODP),0,-l/2-.17,0));for(let i=0;i<10;i++){const a=i/10*Math.PI*2;g.add(at(pm(bg(.05,l,.05),0x9a7747),Math.cos(a)*r*.98,0,Math.sin(a)*r*.98))}return point(g,axis,sign)}
function cam(axis='y',sign=1,kind='a'){const g=new T3.Group(),big=kind==='b',r=big?1.15:.95,h=big?1.5:1.15,c=big?ZINC:STEEL;g.add(pm(cg(r,r,h,22),c));
  if(big){cross(g,r*.72,h/2+.01);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;g.add(at(pm(bg(.22,h*.75,.32),DARK),Math.cos(a)*r*.98,0,Math.sin(a)*r*.98))}}
  else{const sl=pm(bg(r*1.45,.1,.22),DARK);sl.rotation.y=.5;g.add(at(sl,0,h/2+.01,0));g.add(at(pm(bg(r*.7,.32,.2),DARK),r*.55,-h*.28,r*.72));if(kind==='a')g.add(at(pm(bg(.2,.34,.7),DARK),r*.96,.05,0));for(let i=0;i<7;i++)g.add(at(pm(bg(.14,.16,.14),DARK),Math.cos(i*.3-1)*r*.97,-h/2+.1,Math.sin(i*.3-1)*r*.97))}return point(g,axis,sign)}
function pin145(axis='y',sign=1){const g=new T3.Group();g.add(at(pm(cg(1.05,1.05,.32,20),PLAST),0,3.2,0),at(pm(cg(.62,.42,4.6,8),PLAST),0,.7,0),at(pm(cg(.42,.42,.5),DARK),0,-1.7,0),at(pm(cg(.62,.62,.7),STEEL),0,-2.3,0));for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;g.add(at(pm(bg(.1,3.7,.1),DARK),Math.cos(a)*.5,1,Math.sin(a)*.5))}return point(g,axis,sign)}
function rail(len,axis='z',flip=1){const g=new T3.Group();g.add(pm(bg(.25,1.8,len),STEEL),at(pm(bg(.95,.22,len),STEEL),-.48*flip,.8,0),at(pm(bg(.95,.22,len*.9),STEEL),-.48*flip,-.8,0));
  const w=pm(cg(.92,.92,.5,22),0x2a2f31);w.rotation.z=Math.PI/2;g.add(at(w,.42*flip,0,len/2-.6));const hub=pm(cg(.3,.3,.56,12),ZINC);hub.rotation.z=Math.PI/2;g.add(at(hub,.42*flip,0,len/2-.6));
  g.add(at(pm(bg(.25,1.8,1.4),ZINC),0,0,-len/2-.7));[-.3,0,.3].forEach(k=>{const h=pm(cg(.3,.3,.3,10),DARK);h.rotation.z=Math.PI/2;g.add(at(h,0,0,k*len))});if(axis==='y'){const o=new T3.Group();g.rotation.x=Math.PI/2;o.add(g);return o}return g}
function lever(){const s=new T3.Shape();s.moveTo(-1.2,-1.8);s.lineTo(.3,-1.8);s.lineTo(.3,-.2);s.lineTo(.8,-.2);s.lineTo(.8,-1.8);s.lineTo(1.3,-1.8);s.lineTo(1.3,.9);s.quadraticCurveTo(.4,2,-.8,1.6);s.quadraticCurveTo(-1.5,1.1,-1.2,.2);s.closePath();const m=pm(geo('lev',()=>new T3.ExtrudeGeometry(s,{depth:.35,bevelEnabled:false})),GREY);m.rotation.y=Math.PI/2;const o=new T3.Group();o.add(m);return o}
function bracket(){const g=new T3.Group();g.add(at(pm(bg(2.4,.35,2.4),ZINC),0,.18,0),at(pm(bg(2.4,2.4,.35),ZINC),0,1.5,-1.03));const t=pm(cg(1.2,1.2,.35,20),ZINC);t.rotation.x=Math.PI/2;g.add(at(t,0,2.7,-1.03));const a=pm(cg(.5,.5,.42,14),DARK);g.add(at(a,0,.18,0));const b=pm(cg(.5,.5,.42,14),DARK);b.rotation.x=Math.PI/2;g.add(at(b,0,2.5,-1.03));return g}
function plug151(axis,sign){const g=new T3.Group();g.add(at(pm(cg(.95,.95,.25,18),PLAST),0,.9,0),pm(cg(.45,.3,1.7,8),PLAST));cross(g,.5,1.04);[-.4,0,.4].forEach(y=>g.add(at(pm(cg(.55,.42,.2,10),PLAST),0,y-.1,0)));return point(g,axis,sign)}
function clip(axis,sign){const g=new T3.Group();const c=pm(cg(1.05,1.05,.3,20,),PLAST);g.add(at(c,0,.75,0),pm(bg(1.5,1.2,.9),PLAST),at(pm(bg(1,.8,.4),DARK),0,-.1,.3));return point(g,axis,sign)}
function spacer(){const g=new T3.Group();[-.65,.65].forEach(x=>{g.add(at(pm(bg(1.25,3.2,2),PLAST),x,0,0))});const h=pm(cg(.65,.65,2.1,14),DARK);h.rotation.x=Math.PI/2;g.add(h);return g}
function coverL(){const s=new T3.Shape();s.moveTo(0,0);s.lineTo(1.4,0);s.lineTo(1.4,4);s.lineTo(4.4,4);s.lineTo(4.4,5.4);s.lineTo(0,5.4);s.closePath();const m=pm(geo('cvL',()=>new T3.ExtrudeGeometry(s,{depth:.7,bevelEnabled:true,bevelSize:.14,bevelThickness:.14,bevelSegments:2})),PLAST);m.scale.set(.55,.55,1);m.position.set(-1.2,-1.5,-.3);const o=new T3.Group();o.add(m);return o}
function hole(r,axis,dark=DARK){const m=new T3.Mesh(cg(r,r,.12,14),mat(dark));if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m}
function tint(m,on){m.traverse(o=>{if(o.isMesh&&o.material&&o.material.color){if(o.userData.b==null)o.userData.b=o.material.color.getHex();o.material.color.setHex(on?ACC:o.userData.b)}})}
function holes(obj,list){list.forEach(([x,y,z,r,a])=>obj.add(at(hole(r,a),x,y,z)))}
