import shutil,os,re,json
os.makedirs('site',exist_ok=True);shutil.rmtree('site');os.makedirs('site')
shutil.copy('shim.js','site/shim.js');shutil.copytree('../tts/tts','site/tts');open('site/.nojekyll','w').close()
import hashlib
ver=hashlib.md5(open('shim.js','rb').read()).hexdigest()[:8]
base=open('norden.html',encoding='utf8').read()
vbtn=base[base.index('<button class="btn primary vstart"'):base.index('<div class="fullnav">')]
css=base[base.index('.vstart{margin-top'):base.index('</style>')]
code=base[base.index('/* Conversational voice mode'):base.index('window.VoiceReady=true;\n')+len('window.VoiceReady=true;\n')]
say=open('say.js',encoding='utf8').read()
def page(h,slug,name,steps,sayjs,imgdir,voice,loop,loops=None):
    if voice:
        h=h.replace('<div class="fullnav">',vbtn+'<div class="fullnav">',1).replace('</style>',css+'</style>',1)
        h=h.replace('Anim.ui();\n','Anim.ui();\n'+code,1).replace('  save();\n}\nfunction thumb','  save();if(window.VoiceReady)Voice.onStep();\n}\nfunction thumb',1)
    h=h.replace('Anim.setNext(()=>{','Anim.setNext(()=>{if(window.Voice&&Voice.hold())return false;',1).replace('Anim.stopAuto();return true','Anim.stopAuto();if(window.Voice)Voice.autoEnd();return true',1)
    pre='<meta name="robots" content="noindex">'
    h=h.replace('<title>',pre+'<title>',1)
    h=h.replace('<script>','<script>window.PRODUCT={name:%s,steps:%d,say:%s,loopEnd:%s,loops:%s}</script>\n<script src="../shim.js?v=%s"></script>\n<script>'%(json.dumps(name,ensure_ascii=False),steps,sayjs,json.dumps(loop),json.dumps(loops or {},ensure_ascii=False),ver),1)
    h=h.replace('<header>','<header><a href="../" style="font-size:13px">‹ 选择产品</a>',1)
    os.makedirs('site/'+slug);open('site/%s/index.html'%slug,'w',encoding='utf8').write(h);shutil.copytree(imgdir,'site/%s/img'%slug)
page(base,'norden','IKEA NORDEN 折叠桌',11,say,'img',False,'10')
st=open('../stork/storklinta.html',encoding='utf8').read()
page(st,'storklinta','IKEA STORKLINTA 六斗柜',45,'{}','../stork/img',True,'43')
by=open('../billy/billy.html',encoding='utf8').read()
page(by,'billy-corner','IKEA BILLY 转角书柜',31,open('../billy/say.js',encoding='utf8').read(),'../billy/img',True,'',{'B14':'一共做三个书柜，两个八十宽，一个四十宽，都做好了再说下一步。','E9':'一共做三个加高单元，都做到这里再说下一步。','E12':'这三步每个书柜都做一次。'})
shutil.copy('voices.html','site/voices.html');shutil.copytree('../tts/cmpmp3','site/voices')
P=[('norden','NORDEN','折叠桌 · 11 步 · 6 个抽屉','AA-2580705-1'),('storklinta','STORKLINTA','六斗柜 · 45 步 · 6 个抽屉','AA-2413736-7'),('billy-corner','BILLY 转角','转角书柜 · 31 步 · 3 柜 + 3 加高','AA-1823127-9')]
cards=''.join(f'<a class="c" href="{s}/"><b>{n}</b><span>{d}</span><small>{a}</small></a>' for s,n,d,a in P)
open('site/index.html','w',encoding='utf8').write(f'''<!doctype html><html lang="zh"><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>组装助手</title><style>:root{{--bg:#f4f5f2;--ink:#17201c;--mut:#5d6a63;--c:#fff;--ac:#25624b}}@media (prefers-color-scheme:dark){{:root{{--bg:#141815;--ink:#e9ede9;--mut:#a3aea7;--c:#1e2420;--ac:#7fcfae}}}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px system-ui,sans-serif}}main{{max-width:560px;margin:0 auto;padding:28px 16px}}h1{{font-size:26px;margin:0 0 4px}}p{{color:var(--mut);margin:0 0 20px}}.c{{display:grid;gap:3px;padding:16px;margin-bottom:10px;border-radius:10px;background:var(--c);color:inherit;text-decoration:none;border:1px solid transparent}}.c:active{{border-color:var(--ac)}}.c b{{font-size:19px;color:var(--ac)}}.c span{{font-size:15px}}.c small{{color:var(--mut)}}</style></head><body><main><h1>组装助手</h1><p>选择要组装的产品</p>{cards}<p style="margin-top:18px"><a href="voices.html" style="color:var(--ac)">声音对比</a></p></main></body></html>''')
