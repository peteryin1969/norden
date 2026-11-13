"""Build app/assist-full.html: the NORDEN assistant page and its voice layer with the product's own engine and data taken out.
The animation, the step and parts data and the pictures come from model data through manim.js. The editor fills in three.js,
the player and the model. Usage: python3 mkfull.py <site dir>"""
import re,sys,os,hashlib
D=os.path.dirname(os.path.abspath(__file__));out=sys.argv[1]
h=open(D+'/norden.html',encoding='utf8').read()
def rep(a,b,n=1):
    global h
    assert h.count(a)==n,(h.count(a),a[:80]);h=h.replace(a,b)
def rex(p,b,flags=re.S):
    global h
    m=re.search(p,h,flags);assert m,p[:60];h=h[:m.start()]+b+h[m.end():]
# 1. the engine goes, the model-driven one comes in
i=h.index('<script>')+len('<script>');j=h.index('const STEPS=')
h=h[:i]+'\n/*@MANIM@*/\n'+h[j:]
# 2. product data -> from the model
rex(r'const STEPS=\[.*?\];\n','const STEPS=GEN.STEPS;\n')
rex(r"const BAG=new Proxy\(\{\},\{get:\(\)=>'五金袋'\}\);","const BAG=new Proxy({},{get:()=>'包装'});")
rex(r'const QTY=\{[^}]*\};','const QTY=GEN.QTY;')
rex(r'const CELLS=\[.*?\];\n','const CELLS=GEN.CELLS;\n')
rep("const OPEN=[{at:'1',q:{...QTY}}];","const OPEN=[{at:STEPS[0].id,q:{...QTY}}];")
rep("const OPENNAME={'1':'五金袋'};","const OPENNAME={[STEPS[0].id]:'包装'};")
rep("const KEY='norden-v1';","const KEY='asm-'+GEN.key;")
rex(r"function path\(\)\{.*?return p\}","function path(){return STEPS.map(s=>({id:s.id}))}")
rex(r"function go\(d\)\{const c0=P\[st\.pos\];let n=st\.pos\+d;.*?if\(n<0\|\|n>=P\.length\)return;","function go(d){let n=st.pos+d;if(n<0||n>=P.length)return;")
rep("$('meta').textContent='说明书第 '+s.page+' 页'+(c.d?' · 这样做 6 个抽屉':'');","$('meta').textContent='共 '+GEN.big+' 步';")
rep("$('img').src='img/s'+s.id+'.png';","$('img').src=IMG.step(s.id);")
rep("$('img').alt='说明书第 '+s.page+' 页，'+s.title;","$('img').alt='这一步的示意图，'+s.title;")
rep("i.src='img/c/'+n+'.png'","i.src=IMG.cell(n)")
rep("fetch('img/c/'+cellOf(k).n+'.png')","fetch(IMG.cell(cellOf(k).n))")
rep("fetch('img/s'+P[st.pos].id+'.png')","fetch(IMG.step(P[st.pos].id))")
rep("img=st0?'img/s'+st0+'.png':null","img=st0?IMG.step(st0):null")
rep("src=\"img/c/'+cellBy(c).n+'.png\"","src=\"'+IMG.cell(cellBy(c).n)+'\"")
rex(r"const SIM=\{[^}]*\};","const SIM={};")
rex(r"const FEAT=\{[^}]*\};","const FEAT=new Proxy({},{get:(o,k)=>{const c=CELLS.find(x=>x.code===k);return c?c.name:''}});")
rex(r"const SCREWS=new Set\(\[[^\]]*\]\);","const SCREWS=new Set();")
rep("你是 IKEA NORDEN 折叠餐桌组装助手","你是“${GEN.name}”的组装助手")
rep("只依据随附的说明书原图和下面的步骤数据回答。","只依据随附的这一步的三维示意图和下面的步骤数据回答。资料里没有的尺寸、力度、承重和安全要求不要编造，请用户以厂家的说明为准。")
rep("你在核对 IKEA NORDEN 的零件。","你在核对“${GEN.name}”的零件。")
rep("$('toAnim').onclick=()=>jump('9');","")
rep("st.pos=c.id==='10'&&c.d===1?P.findIndex(x=>x.id==='11'):st.pos+1;","st.pos=st.pos+1;")
rep("Anim.setNext(()=>{","Anim.setNext(()=>{if(window.Voice&&Voice.hold())return false;")
rep("Anim.stopAuto();return true","Anim.stopAuto();if(window.Voice)Voice.autoEnd();return true")
print('still naming the old product:',sorted(set(re.findall(r'NORDEN[^_\'"`<]{0,12}|抽屉[^\'"`<]{0,10}|宜家[^\'"`<]{0,8}',h)))[:40])
# 3. the page's own words
rex(r'<div class="sub">.*?</div>\s*<h1>.*?</h1>','<div class="sub" id="gSub"></div>\n    <h1 id="gName"></h1><div class="flag unsure" id="gDraft" hidden></div>')
rep('<button class="btn" id="toAnim">跳到抽屉</button>','')
rex(r'<div class="hint">示意动画，比例为估算.*?</div>','<div class="hint">动画由厂家的三维数据生成。拖动画面可旋转，双指或滚轮缩放，点零件可以问它。</div>')
rex(r'<div class="hint">数量来自说明书第 4–6 页.*?</div>','<div class="hint">数量来自厂家的三维数据。勾选后保存在这台设备上。</div>')
rex(r'<div class="figure"><img src="img/parts3\.png"[^>]*></div>\s*<div class="figure"><img src="img/parts2\.png"[^>]*></div>','')
rex(r'(<section id="v-safe" class="card" hidden>).*?(</section>)',r'''<section id="v-safe" class="card" hidden>
    <h2>开工前先看</h2>
    <div class="flag warn">安全要求、工具、承重和是否需要固定到墙上，请以厂家随货的说明为准。这个助手只演示装配顺序和零件位置。</div>
    <div class="hint" id="gSrc"></div>
  </section>''')
rep("['parts3','parts2'].map(n=>fetch('img/'","[].map(n=>fetch('img/'")
rep("前两张图是 IKEA NORDEN 说明书的零件页，第三张是用户摆放的零件照片。","这张图是用户摆放的零件照片。")
rex(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>','')
rep("fetch('faq.json')","fetch('data:application/json,{}')")
rep('<title>','<meta name="robots" content="noindex,nofollow"><title>')
rex(r'<title>.*?</title>','<title>组装助手</title>')
# 4. what the page needs before its script: three.js, the player, the model (filled in by the editor), the AI shim
shim=open(D+'/shim.js',encoding='utf8').read()
code=h[h.index('/* Conversational voice mode'):h.index('window.VoiceReady=true;')];ver=hashlib.md5(code.encode('utf8')).hexdigest()[:8]
pre='<script>/*@THREE@*/</script>\n<script>/*@MPLAY@*/</script>\n<script>window.__MODEL=/*@MODEL@*/null;window.PRODUCT={ver:"%s"}</script>\n<script>%s</script>\n<script>if(location.origin==="https://peteryin1969.github.io")window.NORDEN_TTS="https://peteryin1969.github.io/norden/tts/";else delete window.NORDEN_TTS;</script>\n'%(ver,shim.replace('</script','<\\/script'))
i=h.index('<script>');h=h[:i]+pre+h[i:]
# 5. fill the page's own words once the data is there
rep("render();renderParts();","document.getElementById('gName').textContent=GEN.name+' 组装助手';document.title=GEN.name+' 组装助手';document.getElementById('gSub').textContent='共 '+GEN.big+' 步 · '+GEN.parts.filter(p=>p.step).length+' 个零件';if(GEN.draft){const d=document.getElementById('gDraft');d.hidden=false;d.textContent=GEN.draft}document.getElementById('gSrc').textContent=(GEN.A&&GEN.A.copyright?'三维数据：'+GEN.A.copyright+'。':'')+'画面由三维数据自动生成。';\nrender();renderParts();")
assert h.count('/*@MANIM@*/')==1;h=h.replace('/*@MANIM@*/',open(D+'/manim.js',encoding='utf8').read())
os.makedirs(out+'/app',exist_ok=True);open(out+'/app/assist-full.html','w',encoding='utf8').write(h);print('assist-full.html',len(h)//1024,'KB')
