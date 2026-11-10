"""Client portal: one page per product with each stage's result, what to fix, the open questions and the storyboard sign-off.
Answers and sign-offs are saved on the device and exported as answers.json / signoff.json for the engine to read back."""
import json, os, shutil, sys
H = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(H, 'site', 'platform')
SL = ['norden-sim', 'norden', 'storklinta', 'billy-corner', 'billy-oxberg']
CSS = """:root{--bg:#f4f5f2;--ink:#17201c;--mut:#5d6a63;--c:#fff;--ln:#dfe3dd;--ac:#25624b;--ok:#2f7d4f;--okb:#e5f4e4;--bad:#b3261e;--badb:#fbebeb;--wn:#8a5a00;--wnb:#f9eeda;--td:#2b5f9e;--tdb:#e7f1fb}
@media (prefers-color-scheme:dark){:root{--bg:#141815;--ink:#e9ede9;--mut:#a3aea7;--c:#1e2420;--ln:#2e3631;--ac:#7fcfae;--ok:#7fd49c;--okb:#1e3326;--bad:#ff8a80;--badb:#3a2020;--wn:#f0c36a;--wnb:#3a3020;--td:#8cbcf2;--tdb:#1d2b3d}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}main{max-width:880px;margin:0 auto;padding:20px 16px 60px}
a{color:var(--ac)}h1{font-size:24px;margin:6px 0 2px}h2{font-size:19px;margin:28px 0 8px}h3{font-size:16px;margin:16px 0 6px}.mut{color:var(--mut)}.card{background:var(--c);border:1px solid var(--ln);border-radius:10px;padding:14px;margin:10px 0}
.pipe{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:14px 0}.pipe a{display:block;text-decoration:none;color:inherit;background:var(--c);border:1px solid var(--ln);border-radius:10px;padding:10px}.pipe b{display:block;font-size:13px;color:var(--mut);font-weight:500}
.g{display:inline-block;font-weight:600;font-size:13px;padding:1px 9px;border-radius:11px}.g.通过{background:var(--okb);color:var(--ok)}.g.退回补充{background:var(--badb);color:var(--bad)}.g.待客户确认{background:var(--tdb);color:var(--td)}.pre{font-size:12px;color:var(--mut);margin-left:4px}
.ck{border-left:4px solid var(--ln);padding:8px 10px;margin:8px 0;background:var(--c);border-radius:0 8px 8px 0}.ck.fail{border-color:var(--bad)}.ck.pass{border-color:var(--ok)}.ck.warn{border-color:var(--wn)}.ck.todo{border-color:var(--td)}.ck.na{border-color:var(--ln)}
.ck .t{font-weight:600}.st{font-size:12px;font-weight:600;margin-right:6px}.st.fail{color:var(--bad)}.st.pass{color:var(--ok)}.st.warn{color:var(--wn)}.st.todo{color:var(--td)}.st.na{color:var(--mut)}.lv{font-size:12px;color:var(--mut)}
.ck dl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;gap:2px 10px}.ck dt{color:var(--mut);font-size:13px}.ck dd{margin:0}
details>summary{cursor:pointer;color:var(--ac)}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid var(--ln);padding:4px 6px;text-align:left;vertical-align:top}tr.bad td{color:var(--bad)}
.q{display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:start}.q img{width:110px;border-radius:6px;border:1px solid var(--ln);background:#fff}.q .k{font-size:12px;color:var(--mut)}.ans{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid var(--ac);background:transparent;color:var(--ac);cursor:pointer}button.on{background:var(--ac);color:var(--c)}button.iss.on{background:var(--bad);border-color:var(--bad)}
input[type=text],textarea{font:inherit;width:100%;padding:6px 8px;border-radius:8px;border:1px solid var(--ln);background:var(--bg);color:inherit}
.sb{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.sb img{width:100%;border-radius:6px;border:1px solid var(--ln);background:#fff;cursor:zoom-in}.sb .cap{font-size:11px;color:var(--mut);text-align:center}
.bar{position:sticky;bottom:0;background:var(--bg);padding:10px 0;border-top:1px solid var(--ln);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.zoom{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9}.zoom img{max-width:96vw;max-height:92vh;background:#fff;border-radius:6px}
@media (max-width:560px){.sb{grid-template-columns:repeat(2,1fr)}.q{grid-template-columns:80px 1fr}.q img{width:80px}}"""
JS = r"""
const R=REPORT,S=R.stages,KEY='plat:'+R.slug,LS={get(k){try{return JSON.parse(localStorage.getItem(KEY+k)||'{}')}catch(e){return {}}},set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}};
const $=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null?'':x)));return e};
const SN={pass:'通过',fail:'不通过',warn:'提醒',todo:'待确认',na:'说明'};const STG=['','资料审核','步骤与零件确认','三维模型与动画'];
const main=document.querySelector('main');const img=id=>'../../'+(R.site||R.slug)+'/img/s'+id+'.png';
(()=>{const a=LS.get('ans'),g=LS.get('sign');if(!Object.keys(a).length&&R.answers&&Object.keys(R.answers).length)LS.set('ans',R.answers);if(!Object.keys(g).length&&R.signoff&&Object.keys(R.signoff).length)LS.set('sign',R.signoff)})();
function zoom(src){const z=$('div',{class:'zoom',onclick:()=>z.remove()},$('img',{src}));document.body.append(z)}
function dl(name,obj){const b=new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}),a=$('a',{href:URL.createObjectURL(b),download:name});document.body.append(a);a.click();a.remove()}
main.append($('p',{},$('a',{href:'../'},'‹ 所有产品')),$('h1',{},R.product),$('div',{class:'mut'},'入口 A：客户已有装配方案 · 说明书 '+R.manuals.map(m=>m.doc+'（'+m.pages+' 页）').join('、')),R.note?$('div',{class:'card',style:'margin-top:10px'},'⚠ '+R.note):'',R.package_zip?$('p',{},$('a',{href:R.package_zip,download:''},'下载这个资料包（zip）')):'');
const pipe=$('div',{class:'pipe'});S.forEach(s=>pipe.append($('a',{href:'#s'+s.stage},$('b',{},'阶段 '+s.stage+' · '+STG[s.stage]),$('span',{class:'g '+s.gate},s.gate),s.preview?$('span',{class:'pre'},'预审'):'')));main.append(pipe);
main.append($('p',{class:'mut'},'阶段 1 没通过时，阶段 2、3 以“预审”方式照常运行，让你提前看到后面会问什么、会查什么，结果不计入关卡。'));
function checks(s){const box=$('div');const order={fail:0,todo:1,warn:2,na:3,pass:4};[...s.checks].sort((a,b)=>order[a.status]-order[b.status]).forEach(c=>{const d=$('div',{class:'ck '+c.status},$('div',{},$('span',{class:'st '+c.status},SN[c.status]),$('span',{class:'t'},c.title),' ',$('span',{class:'lv'},c.level)),c.detail?$('div',{},c.detail):'');
  if(c.status!=='pass'&&(c.why||c.fix)){const l=$('dl');if(c.why)l.append($('dt',{},'为什么'),$('dd',{},c.why));if(c.fix)l.append($('dt',{},'怎么补'),$('dd',{},c.fix));if(c.example)l.append($('dt',{},'示例'),$('dd',{},c.example));d.append(l)}box.append(d)});return box}
S.forEach(s=>{const sec=$('section',{id:'s'+s.stage},$('h2',{},'阶段 '+s.stage+'：'+STG[s.stage]+' ',$('span',{class:'g '+s.gate},s.gate),s.preview?$('span',{class:'pre'},'预审'):''),$('div',{class:'mut'},'审核时间 '+s.time));
  sec.append(checks(s));
  if(s.stage===2){const t=$('table',{},$('tr',{},$('th',{},'编号'),$('th',{},'清单'),$('th',{},'清单数量'),$('th',{},'步骤合计'),$('th',{},'用在')));s.recon.forEach(r=>t.append($('tr',{class:r.listed!==r.used?'bad':''},$('td',{},r.code),$('td',{},r.list),$('td',{},r.listed),$('td',{},r.used),$('td',{},r.steps.join(' ')))));sec.append($('details',{},$('summary',{},'零件核对明细（'+s.recon.length+' 项）'),t));
    const A=LS.get('ans');sec.append($('h3',{},'待确认问题（'+s.questions.length+'）'),$('p',{class:'mut'},'每个问题附了引擎的建议答案。对就点“确认”，不对就点“更正”并写下正确做法。全部答完后点底部的“导出答案”，把 answers.json 交回平台。'));
    s.questions.forEach(q=>{const st=A[q.id]||{};const note=$('input',{type:'text',placeholder:'正确的做法是……',value:st.text||''});note.style.display=st.status==='fix'?'':'none';
      const ok=$('button',{class:st.status==='ok'?'on':''},'确认：'+q.suggest),fx=$('button',{class:'iss'+(st.status==='fix'?' on':'')},'更正');
      const save=()=>{const a=LS.get('ans');a[q.id]={status:ok.classList.contains('on')?'ok':fx.classList.contains('on')?'fix':undefined,text:note.value,answer:ok.classList.contains('on')?q.suggest:note.value};LS.set('ans',a);prog()};
      ok.onclick=()=>{ok.classList.toggle('on');fx.classList.remove('on');note.style.display='none';save()};fx.onclick=()=>{fx.classList.toggle('on');ok.classList.remove('on');note.style.display=fx.classList.contains('on')?'':'none';save()};note.oninput=save;
      sec.append($('div',{class:'card q'},q.step?$('img',{src:img(q.step),loading:'lazy',onclick:e=>zoom(e.target.src),alt:'说明书第 '+q.step+' 步'}):$('div'),$('div',{},$('div',{class:'k'},(q.step?'第 '+q.step+' 步 · ':'')+q.kind+' · 依据：'+q.basis),$('div',{},q.q),$('div',{class:'ans'},ok,fx),note)))})}
  if(s.stage===3){const G=LS.get('sign');sec.append($('h3',{},'分镜确认（'+s.frames.length+' 步）'),$('p',{class:'mut'},'每步四张图：说明书原图，动画开始、中间、结束。和说明书一致就点“确认”，不一致就点“有问题”并写下哪里不对。'));
    s.frames.forEach(f=>{const st=G[f.id]||{};const note=$('input',{type:'text',placeholder:'哪里和说明书不一致……',value:st.text||''});note.style.display=st.status==='issue'?'':'none';
      const ok=$('button',{class:st.status==='ok'?'on':''},'确认'),is=$('button',{class:'iss'+(st.status==='issue'?' on':'')},'有问题');
      const save=()=>{const g=LS.get('sign');g[f.id]={status:ok.classList.contains('on')?'ok':is.classList.contains('on')?'issue':undefined,text:note.value};LS.set('sign',g);prog()};
      ok.onclick=()=>{ok.classList.toggle('on');is.classList.remove('on');note.style.display='none';save()};is.onclick=()=>{is.classList.toggle('on');ok.classList.remove('on');note.style.display=is.classList.contains('on')?'':'none';save()};note.oninput=save;
      const grid=$('div',{class:'sb'});[[img(f.id),'说明书'],...f.frames.map((x,i)=>[x,['开始','中间','结束'][i]])].forEach(([src,c])=>grid.append($('div',{},$('img',{src,loading:'lazy',onclick:e=>zoom(e.target.src),alt:c}),$('div',{class:'cap'},c))));
      sec.append($('div',{class:'card'},$('div',{style:'font-weight:600;margin-bottom:6px'},'第 '+f.id+' 步 · '+f.title),grid,$('div',{class:'ans'},ok,is),note))})}
  main.append(sec)});
const pg=$('span',{class:'mut'});const bar=$('div',{class:'bar'},$('button',{onclick:()=>dl('answers.json',LS.get('ans'))},'导出答案'),$('button',{onclick:()=>dl('signoff.json',LS.get('sign'))},'导出分镜确认'),pg);main.append(bar);
function prog(){const s2=S.find(s=>s.stage===2),s3=S.find(s=>s.stage===3),a=LS.get('ans'),g=LS.get('sign');pg.textContent='问题已答 '+(s2?s2.questions.filter(q=>a[q.id]&&a[q.id].status).length+'/'+s2.questions.length:'-')+'，分镜已确认 '+(s3?s3.frames.filter(f=>g[f.id]&&g[f.id].status).length+'/'+s3.frames.length:'-')}prog();
"""
def page(title, body, css=CSS):
    return f'<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>{title}</title><style>{css}</style></head><body><main></main>{body}</body></html>'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
rows = []
for sl in SL:
    rep = json.load(open(os.path.join(H, 'out', sl, 'report.json'), encoding='utf8'))
    d = os.path.join(OUT, sl); os.makedirs(d)
    if os.path.isdir(os.path.join(H, 'out', sl, 'frames')): shutil.copytree(os.path.join(H, 'out', sl, 'frames'), os.path.join(d, 'frames'))
    if rep.get('package_zip') and os.path.exists(os.path.join(H, 'out', sl, rep['package_zip'])): shutil.copy(os.path.join(H, 'out', sl, rep['package_zip']), os.path.join(d, rep['package_zip']))
    open(os.path.join(d, 'index.html'), 'w', encoding='utf8').write(page(rep['product'] + ' · 审核', '<script>const REPORT=' + json.dumps(rep, ensure_ascii=False) + ';' + JS + '</script>'))
    rows.append((sl, rep))
cards = ''.join(f'<a class="card" style="display:block;text-decoration:none;color:inherit" href="{sl}/"><b style="font-size:17px">{r["product"]}</b><div class="pipe" style="margin:8px 0 0">' +
                ''.join(f'<div><b>阶段 {s["stage"]}</b><span class="g {s["gate"]}">{s["gate"]}</span>{"<span class=pre>预审</span>" if s["preview"] else ""}</div>' for s in r['stages']) + '</div></a>' for sl, r in rows)
idx = f"""<script>document.querySelector('main').innerHTML=`<p><a href="../">‹ 组装助手</a></p><h1>装配助手制作平台 · 审核</h1><p class="mut">入口 A（客户已有装配方案），阶段 1–3。第一个是用 NORDEN 数据补齐的模拟资料包，用来演示全部通过的流程；其余四个是按我们手上真实资料审核的结果。IKEA 产品只用于内部测试。</p>{cards}
<div class="card"><b>怎么用</b><ol style="margin:6px 0 0;padding-left:20px"><li>每个产品页列出各阶段的检查结果；不通过的项写明缺什么、为什么需要、怎么补。</li><li>阶段 2 的待确认问题和阶段 3 的分镜，在页面上逐条确认或更正，再导出 answers.json、signoff.json 交回平台。</li><li>平台重新审核后，这里的结果会更新。</li></ol></div>`</script>"""
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(page('装配平台审核', idx, CSS + '.pipe div{background:var(--bg);border-radius:8px;padding:6px 8px}'))
print('portal', OUT)
