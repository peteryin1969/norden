import json,re,os,warnings
warnings.filterwarnings("ignore")
from PIL import Image,ImageChops
N='../nord/'
S=json.load(open('steps.json',encoding='utf8'));ids=[s['id'] for s in S];byid={s['id']:s for s in S}
def crop(src,pg,cr,out):
    i=Image.open(f"p/{src}-{pg:02d}.png").convert('L');w,h=i.size;x0,y0,x1,y1=cr;c=i.crop((int(x0*w),int(y0*h),int(x1*w),int(y1*h)));b=ImageChops.invert(c).point(lambda v:255 if v>40 else 0).getbbox();c=c.crop((max(b[0]-12,0),max(b[1]-12,0),min(b[2]+12,c.width),min(b[3]+12,c.height)));c.quantize(16).save(out,optimize=True)
os.makedirs('img/c',exist_ok=True)
for s in S:crop(s['src'],s['page'],s['crop'],f"img/s{s['id']}.png")
crop('nb',7,(0,.24,1,.56),'img/parts3.png');crop('ox',6,(0,.03,1,.72),'img/parts4.png');crop('ox',5,(0,.03,1,.26),'img/parts2.png')
# manual parts lists (AA-2289108-3 p7, AA-1003271-12 p6), multiplied for 2 bookcases and 4 doors
BK={'118331':12,'101351':16,'151705':18,'151706':18,'119081':12,'131372':16,'109041':2,'100823':4,'106989':2}
DR={'114667':1,'113287':6,'100349':6,'131386':1,'102384':2,'109221':3,'109336':3,'122576':1,'121043':3}
def used(p):
    u={}
    for s in S:
        if s['id'][0]==p:
            for c,q in s['parts']:u[c]=u.get(c,0)+q
    return u
for p,m in (('B',BK),('D',DR)):
    u=used(p);bad={k:(m.get(k),u.get(k)) for k in set(m)|set(u) if m.get(k)!=u.get(k)};print(p,'mismatch',bad or 'none');assert not bad
QTY={}
for m,n in ((BK,2),(DR,4)):
    for k,v in m.items():QTY[k]=QTY.get(k,0)+v*n
print('total',sum(QTY.values()),QTY)
s=open(N+'base.js',encoding='utf8').read()
a=s.index('/* Cabinet animation, steps 1-34');b=s.index('function load(){');s=s[:a]+open('cab.js',encoding='utf8').read().replace('STEPS_ORDER',json.dumps(ids))+'\n'+s[b:]
a=s.index('  // step 35:');b=s.index("  const v=document.getElementById('animView');let drag=null;");s=s[:a]+s[b:]
OAK=r'''function oakTex(){const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');let seed=31;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;x.fillStyle='rgb(139,104,76)';x.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){const y=rnd()*H,h=20+rnd()*90,g=rnd();x.fillStyle=g<.5?'rgba(102,74,52,.3)':'rgba(172,136,106,.24)';x.fillRect(0,y,W,h)}
  for(let i=0;i<1500;i++){x.strokeStyle=rnd()<.7?'rgb(82,58,40)':'rgb(176,140,110)';x.globalAlpha=.05+rnd()*.17;x.lineWidth=.5+rnd()*1.7;const y=rnd()*H,a=rnd()*7,am=1+rnd()*7,f=300+rnd()*700;x.beginPath();for(let k=0;k<=W;k+=48)x.lineTo(k,y+Math.sin(k/f+a)*am);x.stroke()}
  x.globalAlpha=.3;x.fillStyle='rgb(76,54,38)';for(let i=0;i<2600;i++)x.fillRect(rnd()*W,rnd()*H,10+rnd()*46,.9);x.globalAlpha=1;
  const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=4;return t}
'''
Rs=[("const DUR={'21':1.5,'33':2.4,'45':2.6};","const DUR={B1:1.6,B2:1.7,B7:1.5,B8:2,B9:3.6,B10:3,B11:2,B12:1.5,D1:1.8,D2:2,D3:2.2,D4:1.8,D5:1.4,D6:1.4,D7:3};"),
("const IDS=['35','36','37','38','39','40','41','42','43','44'];","const IDS=[];"),("dowel=wc(dowel,'101345')","dowel=wc(dowel,'101351')"),
("const SCREW={'1':'146114','43':'146114','7':'151931','8':'151931','17':'105248','18':'105248','32':'109572','34':'109572'};","const SCREW={};"),
("const PANEL={sideA:'外侧板',sideB:'外侧板',mid:'中隔板',botA:'底板',botB:'底板',pA:'脚线',pB:'脚线',back:'背板',top:'顶板'};","const PANEL={panL:'侧板',panR:'侧板',bot:'底板',mid:'中间固定板',top:'顶板',plinth:'脚线',back:'背板',s0:'活动搁板',s1:'活动搁板',s2:'活动搁板',s3:'活动搁板'};"),
("const PAIR={sideA:'sideB',sideB:'sideA',botA:'botB',botB:'botA',pA:'pB',pB:'pA'};","const PAIR={panL:'panR',panR:'panL'};"),
("turn=['24','26','33','43','44','45']","turn=['B8','B10']"),("cur==='33'||cur==='45'){FIT=null;return}","false){FIT=null;return}"),
("function activeObjs(){if(cur==='21')return[FR.back.g,FR.fold];","function activeObjs(){"),("  if(cur==='45'){put(FR.lv,'联锁拨片',[.56,.9]);put(FR.drs[1].g,'抽屉',[0,.55])}if(cur==='44')put(root,'带警示标签的抽屉',[0,1])}","}"),
("if(cur==='45')FR.drs.forEach(d=>o.push(d.g));",""),("k==='c'?'120076':k==='b'?'110126':'119252/119250'","k==='b'?'103114':'119081'"),
("birch:birchTex()","birch:oakTex()"),("function birchTex(){",OAK+"function birchTex(){"),
("const box0=o.geometry.type==='BoxGeometry';","const box0=o.geometry.type==='BoxGeometry'||o.userData.uvOak;"),("o.material.color.setHex(real?0xa98a60:0x1b2420)","o.material.color.setHex(real?0x4f3a2a:0x1b2420)"),
("nw=new T3.MeshPhongMaterial({color:0xf0d9bc,shininess:18,specular:0x2a2620})","nw=new T3.MeshPhongMaterial({color:0x8b684c,shininess:18,specular:0x2a2620})"),
("new T3.PerspectiveCamera(32,1.5,1,600)","new T3.PerspectiveCamera(32,1.5,1,1200)"),("new T3.PerspectiveCamera(32,1,.5,600)","new T3.PerspectiveCamera(32,1,.5,1200)"),("h=big?1.5:1.15","h=big?1.5:1.45"),("tag=Math.abs(dx)>=Math.abs(dy)*.8?(dx<0?'左':'右'):(dy>0?'前':'后')","tag=(cur==='B6')?(dy>0?'下':'上'):Math.abs(dx)>=Math.abs(dy)*.8?(dx<0?'左':'右'):(dy>0?'前':'后')"),
("(dr?parts:CP).forEach(p=>{const k=p.keys[cur];if(!k)return;","(dr?parts:CP).forEach(p=>{const k=p.keys[cur];if(!k||p.quiet)return;"),
("o.castShadow=real&&!o.material.isMeshBasicMaterial","o.castShadow=real&&!o.material.isMeshBasicMaterial&&!o.material.transparent"),("if(c===WOOD){const box0","if(c===WOOD||c===GREY){const box0"),("ax=[0,1,2].filter(k=>k!==skip).sort((q,w)=>d[w]-d[q]),v=","ax=[0,1,2].filter(k=>k!==skip).sort((q,w)=>m.userData.vert?(q===1?-1:w===1?1:0):d[w]-d[q]),v=")]
for x,y in Rs:
    assert x in s,x; s=s.replace(x,y)
open('anim.js','w',encoding='utf8').write(s)
h=open(N+'page.html',encoding='utf8').read()
for a,b in [('<title>STORKLINTA 组装助手</title>','<title>BILLY OXBERG 组装助手</title>'),('AA-2413736-7 · 32 页 · 45 步 · 6 个抽屉','AA-2289108-3 · AA-1003271-12 · 19 步 · 2 个书柜 + 4 扇门'),('<h1>STORKLINTA 组装助手</h1>','<h1>BILLY OXBERG 组装助手</h1>'),("const KEY='storklinta-v1';","const KEY='billyox-v1';"),('IKEA STORKLINTA 六斗柜','IKEA BILLY OXBERG 书柜'),('IKEA STORKLINTA','IKEA BILLY')]:h=h.replace(a,b)
a=h.index('function path(){');b=h.index('let P=path();');h=h[:a]+"function path(){return "+json.dumps([{'id':i} for i in ids])+"}\nconst MUL=id=>id[0]==='B'?2:4;\n"+h[b:]
h=re.sub(r"const BAG=\{.*?\};","const BAG=new Proxy({},{get:()=>'五金袋'});",h,1,re.S)
h=re.sub(r"const QTY=\{.*?\};","const QTY="+json.dumps(QTY)+";",h,1,re.S)
h=re.sub(r"const OPEN=\[.*?\}\}\];","const OPEN=[{at:'B1',q:{...QTY}}];",h,1,re.S)
h=re.sub(r"const OPENNAME=\{.*?\};","const OPENNAME={'B1':'五金袋'};",h,1,re.S)
h=h.replace("const RAILS={'1':6,'7':3,'8':3,'43':2};","const RAILS={};")
FEAT={'118331':'连接件，上方圆头十字，中段六角，下方粗牙','101351':'圆柱木销，斜纹','151705':'圆帽，下方两片细脚','151706':'塑料塞，顶部有孔，下方带倒刺','119081':'圆柱锁扣，顶面一字槽','131372':'小搁板销，带圆托','109041':'短木螺丝，圆头十字','100823':'圆垫圈','106989':'L 形钢支架，两条长孔','114667':'长螺丝，宽圆头','113287':'底板螺丝，宽头','100349':'短粗沉头螺丝','131386':'圆柱旋钮','102384':'两个透明小圆垫，贴在一张底纸上','109221':'十字形金属底板，刻 A 和 B','109336':'暗铰链，带圆杯和长臂','122576':'L 形钢支架，附垫圈和螺丝','121043':'带圆环的小盖片'}
h=re.sub(r"const FEAT=\{.*?\};","const FEAT="+json.dumps(FEAT,ensure_ascii=False)+";",h,1,re.S)
h=re.sub(r"const SIM=\{.*?\};","const SIM={'113287':['100349','109041'],'100349':['113287'],'109041':['113287'],'106989':['122576'],'122576':['106989'],'151705':['151706'],'151706':['151705']};",h,1,re.S)
h=h.replace("const SCREWS=new Set(['146114','151931','105248','109572']);","const SCREWS=new Set(['109041','113287','100349','114667']);")
h=h.replace("if(i<pos)need(id).forEach(([k,q])=>m[k]-=q)","if(i<pos)need(id).forEach(([k,q])=>m[k]-=q*MUL(id))")
h=h.replace("c.id==='43'&&c.d===1?P.findIndex(x=>x.id==='44'):st.pos+1","st.pos+1").replace("if(c.id==='32w'&&!st.branch)return false;","").replace("jump('35')","jump('B1')")
h=h.replace("if(id==='32')st.branch='none';else if(id==='33'||id==='34')st.branch='skirt';","")
h=h.replace("function nextLabel(c){return c.id==='43'&&c.d<6?'做下一个抽屉':'下一步'}","function nextLabel(c){return c.id==='B12'?'2 个书柜都做好，下一步':c.id==='D7'?'4 扇门都做好，完成':'下一步'}")
h=h.replace('<div class="figure"><img src="img/parts5.png" alt="说明书第 5 页零件图"></div>','<div class="figure"><img src="img/parts3.png" alt="书柜说明书零件图"></div><div class="figure"><img src="img/parts4.png" alt="加高单元说明书零件图"></div>').replace('<div class="figure"><img src="img/parts6.png" alt="说明书第 6 页零件图"></div>','').replace('<div class="figure"><img src="img/parts4.png" alt="说明书第 4 页墙面固定零件图"></div>','').replace('<div class="figure"><img src="img/parts3.png" alt="说明书第 3 页工具图"></div>','<div class="figure"><img src="img/parts2.png" alt="转角配件说明书零件图"></div>').replace("['parts5','parts6']","['parts3','parts2']")
a=h.index('<section id="v-safe" class="card" hidden>');b=h.index('</section>',a)
h=h[:a]+'<section id="v-safe" class="card" hidden>\n    <h2>开工前先看</h2>\n    <div class="flag warn">必须把每个书柜和每扇门的支架固定到墙上，否则会倾倒。墙螺丝不随货提供，要按墙体另买。</div>\n    <ul class="safety"><li>工具：一字螺丝刀、十字螺丝刀、铅笔、尺，说明书工具图上还有锤子。</li><li>在软垫上操作，避免板面和玻璃损伤。</li><li>全程不要用电钻拧连接件和锁扣。</li><li>每层搁板最大承重 30 公斤。</li></ul>\n    <div class="flag unsure"><b>需要留意</b>这份书柜说明书和转角组合用的不同：12 步，背板用塞子固定，不用钉子。两个书柜之间没有连接步骤。</div>\n    <div class="hint">本工具不是宜家官方产品，也不能替代随货说明书。</div>\n  '+h[b:]
h=h.replace('STORKLINTA','BILLY OXBERG')
assert "st.branch='skirt'" not in h
html=h.replace('/*STEPS*/[]',json.dumps(S,ensure_ascii=False,separators=(',',':'))).replace('/*CELLS*/[]',open('cells.json',encoding='utf8').read()).replace('/*ANIM*/',s)
open('billy-oxberg.html','w',encoding='utf8').write(html);print('ok',len(html)//1024,'KB')
