'''Insert the shared voice view API (view.js) into an Anim engine source or a built product page. Idempotent.'''
import os
V=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'view.js'),encoding='utf8').read()
def addview(s):
    if 'function vState(' in s:return s
    for a,b in [("window._resetView=()=>{vz=1;ox=oy=0;applyView()};","window._resetView=()=>{vz=1;ox=oy=0;applyView()};VZ={get:()=>[vz,ox,oy],set:(z,x,y)=>{vz=z;ox=x;oy=y;applyView()},zoomAt:(x,y,z)=>zoomAt(x,y,z),w:()=>v.clientWidth,h:()=>v.clientHeight};"),
                ("function ui(){const p=document.getElementById('animPlay')",V+"\nfunction ui(){const p=document.getElementById('animPlay')"),
                ("cur=id;t=0;az=0;el=0;","cur=id;t=0;az=0;el=0;vKeep();"),
                ("_fit:()=>FIT&&{D:FIT.D}","view,_view:()=>vState(),_vcam:()=>cam&&cam.position.toArray(),_fit:()=>FIT&&{D:FIT.D}")]:
        assert s.count(a)==1,a;s=s.replace(a,b)
    return s
