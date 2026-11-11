"""Add the shared part kit (focus, part numbers, tap-to-pick, part-card models) to an anim built on the cabinet engine."""
import os
D=os.path.dirname(os.path.abspath(__file__))
EXP="return{focus,unfocus:()=>unfocus(),names,vocab,where,showable,canon:(n)=>canon(n,cur),_foc:()=>FOC&&{name:FOC.name,n:FOC.objs.length,D:FOC.D,w:FOC.w,ct:FOC.ct.toArray(),hot:FOC.objs.some(o=>{let h=false;o.traverse(q=>{if(q.isMesh&&q.material&&q.material.userData.hon)h=true});return h})||FOC.name==='孔',boxes:FOC.box.length,banner:!!(FOC.bn&&FOC.bn.isConnected),vis:FOC.objs.filter(fkVis).length},_cam:()=>cam&&cam.position.toArray(),_t:()=>t,_fit:"
def addkit(s,fk):
    kit=open(os.path.join(D,'focuskit.js'),encoding='utf8').read()
    i=s.index('function load(){');s=s[:i]+'const FK='+fk.strip().rstrip(';')+';\n'+kit+'\n'+open(os.path.join(D,'audit.js'),encoding='utf8').read()+'\n'+open(os.path.join(D,'edit.js'),encoding='utf8').read()+'\n'+s[i:]
    for x,y in [("function camFit(){if(!FIT)return;","function camFit(){if(FOC)return focCam();if(!FIT)return;"),
                ("if(playing){t+=dt*speed/4/(DUR[cur]||1);","if(playing){t+=dt*speed/4/(DUR[cur]||1);focLoop();"),
                ("camFit();ren.render(curScene(),cam);","focPulse();camFit();ren.render(curScene(),cam);"),
                ("closeZoom();const lb=byId[id].label","unfocus(1);closeZoom();const lb=byId[id].label"),
                ("return{_fit:",EXP)]:
        assert s.count(x)==1,x; s=s.replace(x,y)
    return s
