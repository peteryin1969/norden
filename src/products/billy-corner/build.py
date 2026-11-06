import json,re,os,warnings
warnings.filterwarnings("ignore")
from PIL import Image,ImageChops
N='../nord/'
S=json.load(open('steps.json',encoding='utf8'));ids=[s['id'] for s in S];byid={s['id']:s for s in S}
def crop(src,pg,cr,out):
    i=Image.open(f"p/{src}-{pg:02d}.png" if src!='cn' else f"p/cn-{pg}.png").convert('L');w,h=i.size;x0,y0,x1,y1=cr;c=i.crop((int(x0*w),int(y0*h),int(x1*w),int(y1*h)));b=ImageChops.invert(c).point(lambda v:255 if v>40 else 0).getbbox();c=c.crop((max(b[0]-12,0),max(b[1]-12,0),min(b[2]+12,c.width),min(b[3]+12,c.height)));c.quantize(16).save(out,optimize=True)
os.makedirs('img/c',exist_ok=True)
for s in S:crop(s['src'],s['page'],s['crop'],f"img/s{s['id']}.png")
crop('bk',6,(0,.2,1,.56),'img/parts3.png');crop('ex',7,(0,.03,1,.48),'img/parts4.png');crop('cn',2,(0,.48,1,.86),'img/parts2.png')
# manual parts lists. B12 stays counted even though the corner set leaves the bookcase wall kits spare:
# reconciliation checks the steps against each manual's printed list, not what this combination ends up using.
BK={'118331':12,'101351':16,'101201':18,'119081':12,'131372':16,'109041':2,'100823':4,'106989':2}
EX={'118331':6,'101351':4,'114667':1,'101345':4,'108001':2,'119081':6,'103114':2,'109041':2,'100823':4,'106989':2}
CN={'100362':4,'115257':2,'109534':2,'102715':1}
def used(p):
    u={}
    for s in S:
        if s['id'][0]==p:
            for c,q in s['parts']:u[c]=u.get(c,0)+q
    return u
for p,m in (('B',BK),('E',EX),('C',CN)):
    u=used(p);bad={k:(m.get(k),u.get(k)) for k in set(m)|set(u) if m.get(k)!=u.get(k)};print(p,'mismatch',bad or 'none');assert not bad
QTY={}
for m,n in ((BK,3),(EX,3),(CN,1)):
    for k,v in m.items():QTY[k]=QTY.get(k,0)+v*n
print('total',sum(QTY.values()),QTY)
s=open(N+'base.js',encoding='utf8').read()
a=s.index('/* Cabinet animation, steps 1-34');b=s.index('function load(){');s=s[:a]+open('cab.js',encoding='utf8').read().replace('STEPS_ORDER',json.dumps(ids))+'\n'+s[b:]
a=s.index('  // step 35:');b=s.index("  const v=document.getElementById('animView');let drag=null;");s=s[:a]+s[b:]
OAK=r'''function oakTex(){const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');let seed=31;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;x.fillStyle='rgb(190,165,138)';x.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){const y=rnd()*H,h=20+rnd()*90,g=rnd();x.fillStyle=g<.5?'rgba(150,124,98,.3)':'rgba(214,192,168,.26)';x.fillRect(0,y,W,h)}
  for(let i=0;i<1500;i++){x.strokeStyle=rnd()<.7?'rgb(118,94,72)':'rgb(222,202,178)';x.globalAlpha=.05+rnd()*.17;x.lineWidth=.5+rnd()*1.7;const y=rnd()*H,a=rnd()*7,am=1+rnd()*7,f=300+rnd()*700;x.beginPath();for(let k=0;k<=W;k+=48)x.lineTo(k,y+Math.sin(k/f+a)*am);x.stroke()}
  x.globalAlpha=.3;x.fillStyle='rgb(112,88,68)';for(let i=0;i<2600;i++)x.fillRect(rnd()*W,rnd()*H,10+rnd()*46,.9);x.globalAlpha=1;
  const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=4;return t}
'''
Rs=[("const DUR={'21':1.5,'33':2.4,'45':2.6};","const DUR={B1:1.6,B2:1.7,B7:1.5,B8:1.5,B9:1.7,B10:1.2,B11:4.2,B12:3,B13:2,B14:1.5,E9:1.8,E10:1.7,E12:2,C2:2,C4:1.8,C5:2.4};"),
("const IDS=['35','36','37','38','39','40','41','42','43','44'];","const IDS=[];"),("dowel=wc(dowel,'101345')","dowel=wc(dowel,'101351')"),
("const SCREW={'1':'146114','43':'146114','7':'151931','8':'151931','17':'105248','18':'105248','32':'109572','34':'109572'};","const SCREW={};"),
("const PANEL={sideA:'外侧板',sideB:'外侧板',mid:'中隔板',botA:'底板',botB:'底板',pA:'脚线',pB:'脚线',back:'背板',top:'顶板'};","const PANEL={panL:'侧板',panR:'侧板',bot:'底板',mid:'中间固定板',top:'顶板',plinth:'脚线',back:'背板',s0:'活动搁板',s1:'活动搁板',s2:'活动搁板',s3:'活动搁板',eL:'侧板',eR:'侧板',eT:'顶板（粗木销）',eB:'背板（细木销）'};"),
("const PAIR={sideA:'sideB',sideB:'sideA',botA:'botB',botB:'botA',pA:'pB',pB:'pA'};","const PAIR={panL:'panR',panR:'panL',eL:'eR',eR:'eL'};"),
("turn=['24','26','33','43','44','45']","turn=['B8','B12','E9','C1','C2']"),("cur==='33'||cur==='45'){FIT=null;return}","false){FIT=null;return}"),
("function activeObjs(){if(cur==='21')return[FR.back.g,FR.fold];","function activeObjs(){"),("  if(cur==='45'){put(FR.lv,'联锁拨片',[.56,.9]);put(FR.drs[1].g,'抽屉',[0,.55])}if(cur==='44')put(root,'带警示标签的抽屉',[0,1])}","}"),
("if(cur==='45')FR.drs.forEach(d=>o.push(d.g));",""),("k==='c'?'120076':k==='b'?'110126':'119252/119250'","k==='b'?'103114':'119081'"),
("birch:birchTex()","birch:oakTex()"),("function birchTex(){",OAK+"function birchTex(){"),
("const box0=o.geometry.type==='BoxGeometry';","const box0=o.geometry.type==='BoxGeometry'||o.userData.uvOak;"),("o.material.color.setHex(real?0xa98a60:0x1b2420)","o.material.color.setHex(real?0x7a6450:0x1b2420)"),
("nw=new T3.MeshPhongMaterial({color:0xf0d9bc,shininess:18,specular:0x2a2620})","nw=new T3.MeshPhongMaterial({color:0xbea58a,shininess:18,specular:0x2a2620})"),
("new T3.PerspectiveCamera(32,1.5,1,600)","new T3.PerspectiveCamera(32,1.5,1,1200)"),("new T3.PerspectiveCamera(32,1,.5,600)","new T3.PerspectiveCamera(32,1,.5,1200)"),("h=big?1.5:1.15","h=big?1.5:1.45"),("tag=Math.abs(dx)>=Math.abs(dy)*.8?(dx<0?'左':'右'):(dy>0?'前':'后')","tag=(cur==='B6'||cur==='E4'||cur==='E5')?(dy>0?'下':'上'):Math.abs(dx)>=Math.abs(dy)*.8?(dx<0?'左':'右'):(dy>0?'前':'后')"),
("(dr?parts:CP).forEach(p=>{const k=p.keys[cur];if(!k)return;","(dr?parts:CP).forEach(p=>{const k=p.keys[cur];if(!k||p.quiet)return;"),
("if(c===WOOD){const box0","if(c===WOOD||c===GREY){const box0"),("ax=[0,1,2].filter(k=>k!==skip).sort((q,w)=>d[w]-d[q]),v=","ax=[0,1,2].filter(k=>k!==skip).sort((q,w)=>m.userData.vert?(q===1?-1:w===1?1:0):d[w]-d[q]),v=")]
for x,y in Rs:
    assert x in s,x; s=s.replace(x,y)
open('anim.js','w',encoding='utf8').write(s)
h=open(N+'page.html',encoding='utf8').read()
for a,b in [('<title>STORKLINTA 组装助手</title>','<title>BILLY 转角书柜组装助手</title>'),('AA-2413736-7 · 32 页 · 45 步 · 6 个抽屉','AA-1823127-9 · AA-982217-8 · AA-197501-5 · 31 步 · 3 个书柜 + 3 个加高单元'),('<h1>STORKLINTA 组装助手</h1>','<h1>BILLY 转角书柜组装助手</h1>'),("const KEY='storklinta-v1';","const KEY='billy-v1';"),('IKEA STORKLINTA 六斗柜','IKEA BILLY 转角书柜'),('IKEA STORKLINTA','IKEA BILLY')]:h=h.replace(a,b)
a=h.index('function path(){');b=h.index('let P=path();');h=h[:a]+"function path(){return "+json.dumps([{'id':i} for i in ids])+"}\nconst MUL=id=>id[0]==='C'?1:3;\n"+h[b:]
h=re.sub(r"const BAG=\{.*?\};","const BAG=new Proxy({},{get:()=>'五金袋'});",h,1,re.S)
h=re.sub(r"const QTY=\{.*?\};","const QTY="+json.dumps(QTY)+";",h,1,re.S)
h=re.sub(r"const OPEN=\[.*?\}\}\];","const OPEN=[{at:'B1',q:{...QTY}}];",h,1,re.S)
h=re.sub(r"const OPENNAME=\{.*?\};","const OPENNAME={'B1':'五金袋'};",h,1,re.S)
h=h.replace("const RAILS={'1':6,'7':3,'8':3,'43':2};","const RAILS={};")
FEAT={'118331':'连接件，上方圆头十字，中段六角，下方粗牙','101351':'粗圆柱木销，斜纹','101345':'较细的圆柱木销，斜纹','101201':'细长钉，小圆头','119081':'圆柱锁扣，顶面一字槽，侧面开口','103114':'圆柱锁扣，顶面十字加一字槽，较短','131372':'小金属搁板销，带圆托','109041':'短木螺丝，圆头十字','100823':'圆垫圈','106989':'L 形钢支架，两条长孔','114667':'长螺丝，宽圆头，尖尾','108001':'短螺栓，圆头十字，下方粗牙','100362':'粗短螺丝，宽圆头十字','115257':'弯折钢片，两端带孔','109534':'沉头十字小木螺丝','102715':'小 L 形角码，两个沉孔'}
h=re.sub(r"const FEAT=\{.*?\};","const FEAT="+json.dumps(FEAT,ensure_ascii=False)+";",h,1,re.S)
h=re.sub(r"const SIM=\{.*?\};","const SIM={'101351':['101345'],'101345':['101351'],'118331':['108001'],'108001':['118331'],'119081':['103114'],'103114':['119081'],'109041':['109534','100362'],'109534':['109041'],'100362':['109041']};",h,1,re.S)
h=h.replace("const SCREWS=new Set(['146114','151931','105248','109572']);","const SCREWS=new Set(['109041','109534','100362','114667']);")
h=h.replace("if(i<pos)need(id).forEach(([k,q])=>m[k]-=q)","if(i<pos)need(id).forEach(([k,q])=>m[k]-=q*MUL(id))")
h=h.replace("c.id==='43'&&c.d===1?P.findIndex(x=>x.id==='44'):st.pos+1","st.pos+1").replace("if(c.id==='32w'&&!st.branch)return false;","").replace("jump('35')","jump('B1')")
h=h.replace("if(id==='32')st.branch='none';else if(id==='33'||id==='34')st.branch='skirt';","")
h=h.replace("function nextLabel(c){return c.id==='43'&&c.d<6?'做下一个抽屉':'下一步'}","function nextLabel(c){return c.id==='B14'?'3 个书柜都做好，下一步':c.id==='E9'?'3 个单元都做好，下一步':'下一步'}")
h=h.replace('<div class="figure"><img src="img/parts5.png" alt="说明书第 5 页零件图"></div>','<div class="figure"><img src="img/parts3.png" alt="书柜说明书零件图"></div><div class="figure"><img src="img/parts4.png" alt="加高单元说明书零件图"></div>').replace('<div class="figure"><img src="img/parts6.png" alt="说明书第 6 页零件图"></div>','').replace('<div class="figure"><img src="img/parts4.png" alt="说明书第 4 页墙面固定零件图"></div>','').replace('<div class="figure"><img src="img/parts3.png" alt="说明书第 3 页工具图"></div>','<div class="figure"><img src="img/parts2.png" alt="转角配件说明书零件图"></div>').replace("['parts5','parts6']","['parts3','parts2']")
a=h.index('<section id="v-safe" class="card" hidden>');b=h.index('</section>',a)
h=h[:a]+'<section id="v-safe" class="card" hidden>\n    <h2>开工前先看</h2>\n    <div class="flag warn">这个转角组合靠加高单元的支架固定到墙上，否则会倾倒。墙螺丝不随货提供，要按墙体另买。</div>\n    <ul class="safety"><li>工具：十字螺丝刀、一字螺丝刀、锥子、锤子、铅笔、尺。</li><li>在软垫上操作，避免板面损伤。</li><li>全程不要用电钻拧连接件和锁扣。</li><li>侧板很长，翻动和立起柜子时两人配合。</li><li>加高单元每个柜只放一层，说明书打叉了两层。</li></ul>\n    <div class="flag unsure"><b>需要留意</b>转角底板没有列在零件清单里；连接片只有一套，用在书柜顶或加高单元顶，二选一；3 套书柜墙面支架这个组合不用，留作备用。详见对应步骤。</div>\n    <div class="hint">本工具不是宜家官方产品，也不能替代随货说明书。</div>\n  '+h[b:]
h=h.replace('STORKLINTA','BILLY')
assert "st.branch='skirt'" not in h
html=h.replace('/*STEPS*/[]',json.dumps(S,ensure_ascii=False,separators=(',',':'))).replace('/*CELLS*/[]',open('cells.json',encoding='utf8').read()).replace('/*ANIM*/',s)
open('billy.html','w',encoding='utf8').write(html);print('ok',len(html)//1024,'KB')
