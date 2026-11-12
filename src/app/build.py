"""Build the working app into <out>/app: pages, the portal script wrapped for use inside the app, the Python engine, the vendored libraries and the NORDEN sample packages."""
import os, re, sys, json, shutil, zipfile, datetime
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(H); PL = S + '/plat'
OUT = os.path.join(sys.argv[1] if len(sys.argv) > 1 else S + '/nord/site', 'app')
BUILD = datetime.datetime.now(datetime.timezone.utc).strftime('%m-%d %H:%M') + ' UTC'
src = open(PL + '/portal.py', encoding='utf8').read()
CSS = re.search(r'CSS = """(.*?)"""', src, re.S).group(1); JS = re.search(r'JS = r"""(.*?)\n"""', src, re.S).group(1)
CSS += """
.tools{max-width:880px;margin:0 auto;padding:14px 16px 0}.tools .card{margin:8px 0}.boot{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:20;padding:16px}.boot .card{max-width:420px;width:100%}
label{display:block;margin:8px 0;font-size:14px}label>span{display:block;margin-bottom:2px}label.chk{display:flex;gap:6px;align-items:center}label.chk input{width:auto}input[type=date]{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--ln);background:var(--bg);color:inherit}
.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0;align-items:center}.row5{display:grid;grid-template-columns:1.4fr 1fr 1.2fr auto auto auto;gap:6px;margin:6px 0;align-items:center}.tabs{display:flex;gap:6px;margin:8px 0}
a.btn{display:inline-block;padding:6px 12px;border-radius:8px;border:1px solid var(--ac);text-decoration:none}.stu{position:fixed;inset:0;z-index:30;display:grid;grid-template:"top top top" auto "left view right" minmax(0,1fr) "bottom bottom right" auto / 240px minmax(0,1fr) 340px;font-size:14px;--bg:#161b1e;--c:#232c30;--ln:#34404a;--ink:#e9ede9;--mut:#9fb0a8;--ac:#7fcfae;--ok:#7fd49c;--okb:#1e3326;--bad:#ff8a80;--badb:#3a2020;--wn:#f0c36a;--wnb:#3a3020;--td:#8cbcf2;background:var(--bg);color:var(--ink)}.stu button{background:#232c30;border-color:#3f5a4f;color:#cfe9dc;padding:5px 10px}.stu button.on{background:#2f8f6b;border-color:#2f8f6b;color:#fff}.stu kbd{font:10px system-ui;opacity:.6;margin-left:5px;border:1px solid currentColor;border-radius:3px;padding:0 3px}.sttop{grid-area:top;display:flex;gap:8px;align-items:center;padding:6px 10px;background:#20272b;border-bottom:1px solid var(--ln);flex-wrap:wrap}.stgrp{display:inline-flex;gap:4px;padding-left:8px;border-left:1px solid var(--ln);flex-wrap:wrap}.stleft{grid-area:left;overflow:auto;background:#1b2125;border-right:1px solid var(--ln)}.stright{grid-area:right;overflow:auto;background:#1b2125;border-left:1px solid var(--ln);padding:10px}.stright .card{background:#232c30}.stview{grid-area:view;position:relative;min-width:0;min-height:0;background:#1d2327}.stview iframe{width:100%;height:100%;border:0;display:block}.stbottom{grid-area:bottom;background:#20272b;border-top:1px solid var(--ln);padding:6px 10px;min-width:0}.ststeps{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}.stu button.ststep{flex:0 0 auto;text-align:left;padding:4px 8px}.ststep b{margin-right:6px}.ststep span{font-size:12px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;max-width:110px;vertical-align:bottom}.sttime{display:flex;gap:8px;align-items:center}.sttime input{flex:1}.stitem{display:flex;gap:6px;align-items:center;padding:7px 10px;cursor:pointer;border-bottom:1px solid #252d32;user-select:none}.stitem:hover{background:#263036}.stitem.on{background:#2b4a3e}.stitem.gone .stn{text-decoration:line-through;opacity:.6}.stdot{width:8px;height:8px;border-radius:50%;background:#55626a;flex:0 0 auto}.stdot.mv{background:#3fd08f}.stn{flex:1;min-width:0}.stq{opacity:.7;font-size:12px}.stbadge{font-size:11px;padding:0 5px;border-radius:8px;background:#7a5a12;color:#ffe9b0}.stbadge.bad{background:#7a2a22;color:#ffd0c8}.sth{font-weight:700;padding:8px 10px}.stsub{font-size:12px;opacity:.7;padding:8px 10px 2px}.stmsg{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:rgba(0,0,0,.65);padding:4px 12px;border-radius:14px;font-size:13px;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90%}.stmsg.on{opacity:1}.stcover{position:fixed;inset:0;z-index:5;background:#161b1e;display:flex;align-items:center;justify-content:center;font-size:18px}.stcover[hidden]{display:none}.stcard{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);background:rgba(27,33,37,.96);border:1px solid #f0c36a;border-radius:10px;padding:10px 12px;max-width:min(560px,92%);z-index:3;box-shadow:0 6px 24px rgba(0,0,0,.4)}.stcard[hidden]{display:none}.stcard .ans{margin-top:8px}.stwish{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;z-index:2}.stwish input{flex:1;background:rgba(27,33,37,.92);border:1px solid var(--ln);color:var(--ink);border-radius:8px;padding:7px 10px;font:inherit;min-width:0}.edgrp{border-top:1px dashed var(--ln);margin-top:8px;padding-top:6px}.stu .row3{grid-template-columns:repeat(3,1fr)}.stu label{margin:4px 0;font-size:13px}@media (max-width:900px){.stu{grid-template:"top" auto "view" 48vh "bottom" auto "left" auto "right" auto / minmax(0,1fr);overflow:auto}.stleft,.stright{border:0;overflow:visible}}button:disabled{opacity:.5;cursor:default}@media (max-width:560px){.row3{grid-template-columns:1fr}.row5{grid-template-columns:1fr 1fr}}"""
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/engine'); os.makedirs(OUT + '/vendor/pyodide'); os.makedirs(OUT + '/vendor/pdfjs'); os.makedirs(OUT + '/samples')
page = lambda title, body: f'<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>{title}</title><style>{CSS}</style><script>window.APPBUILD="{BUILD}"</script></head><body>{body}</body></html>'
open(OUT + '/index.html', 'w', encoding='utf8').write(page('装配助手平台 · 工作台', open(H + '/index.body.html', encoding='utf8').read()))
open(OUT + '/project.html', 'w', encoding='utf8').write(page('项目 · 装配助手平台', open(H + '/project.body.html', encoding='utf8').read()))
open(OUT + '/portal.js', 'w', encoding='utf8').write('(function(){' + JS + '\n})();')
shutil.copy(H + '/app.js', OUT + '/app.js'); shutil.copy(H + '/model.html', OUT + '/model.html'); shutil.copy(H + '/workshop.html', OUT + '/workshop.html'); shutil.copy(S + '/nord/medit.js', OUT + '/medit.js'); shutil.copy(S + '/nord/mvoice.js', OUT + '/mvoice.js'); shutil.copy(H + '/manual.html', OUT + '/manual.html'); shutil.copy(S + '/nord/mmanual.js', OUT + '/mmanual.js'); shutil.copy(S + '/nord/mplay.js', OUT + '/mplay.js'); shutil.copy(S + '/nord/tv/node_modules/three/build/three.min.js', OUT + '/vendor/three.min.js'); shutil.copy(H + '/editor.js', OUT + '/editor.js'); shutil.copy(S + '/nord/tv/node_modules/three/examples/js/controls/TransformControls.js', OUT + '/vendor/TransformControls.js')
for f in ['engine.py', 'stage45.py', 'fixes.py']: shutil.copy(PL + '/engine/' + f, OUT + '/engine/' + f)
N = H + '/npm/node_modules'
for f in ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']: shutil.copy(N + '/pyodide/' + f, OUT + '/vendor/pyodide/' + f)
for f in ['pdf.min.mjs', 'pdf.worker.min.mjs']: shutil.copy(N + '/pdfjs-dist/build/' + f, OUT + '/vendor/pdfjs/' + f)
shutil.copy(N + '/jszip/dist/jszip.min.js', OUT + '/vendor/jszip.min.js'); shutil.copy(N + '/qrcode-generator/qrcode.js', OUT + '/vendor/qrcode.js')
# sample packages: the simulated NORDEN data split into what a client hands in and what the platform delivers
A = PL + '/packages/norden-new'; O = PL + '/out/norden-new'
PLATFORM = {'steps.draft.json', 'release.json', 'testers.json'}
pk = json.load(open(A + '/package.json', encoding='utf8')); patch = {k: pk.pop(k) for k in ['units', 'alternatives', 'stage4', 'stage5'] if k in pk}
pk.pop('site', None); pk.pop('package_zip', None); pk['units'] = []; pk['alternatives'] = []; pk['name'] = 'NORDEN 折叠桌（模拟资料）'; pk['note'] = '模拟资料：尺寸、规格、授权书都是模拟的，仅用于平台内部测试。'
with zipfile.ZipFile(OUT + '/samples/norden-client.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, fs in os.walk(A):
        for f in fs:
            rel = os.path.relpath(os.path.join(root, f), A)
            if rel in PLATFORM or rel.startswith('generated') or rel == 'package.json' or rel in ('answers.json', 'signoff.json', 'fixes.json', 'ai_review.json', 'ai_photo.json'): continue
            z.write(os.path.join(root, f), rel)
    z.writestr('package.json', json.dumps(pk, ensure_ascii=False, indent=1))
# test 2: the same client package with one planted problem, and the corrected file to hand in afterwards
import io
src_parts = open(A + '/parts.csv', encoding='utf8').read(); bad = src_parts.replace('110733,短螺丝,42,', '110733,短螺丝,40,'); assert bad != src_parts
zin = zipfile.ZipFile(OUT + '/samples/norden-client.zip')
with zipfile.ZipFile(OUT + '/samples/norden-client-test2.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for n in zin.namelist():
        d = zin.read(n)
        if n == 'parts.csv': d = bad.encode()
        if n == 'package.json': j = json.loads(d); j['name'] = 'NORDEN 折叠桌（模拟资料 · 测试 2）'; d = json.dumps(j, ensure_ascii=False, indent=1).encode()
        z.writestr(n, d)
os.makedirs(OUT + '/samples/test2-fix'); open(OUT + '/samples/test2-fix/parts.csv', 'w', encoding='utf8').write(src_parts)
rel_ = json.load(open(A + '/release.json', encoding='utf8')); rel_.pop('approved_by', None); rel_.pop('approved_at', None); rel_.pop('qr_location', None)
with zipfile.ZipFile(OUT + '/samples/norden-delivery.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('delivery.json', json.dumps({'product': 'NORDEN 折叠桌', 'delivery': 1, 'date': BUILD, 'by': '平台（代管）', 'assistant_url': rel_.get('url'), 'simulated': True, 'note': '步骤、讲解、问答、分镜图和测试结果由平台制作；试装记录是模拟的。'}, ensure_ascii=False, indent=1))
    z.writestr('package.patch.json', json.dumps(patch, ensure_ascii=False, indent=1)); z.writestr('release.json', json.dumps(rel_, ensure_ascii=False, indent=1))
    z.write(A + '/steps.draft.json', 'steps.draft.json'); z.write(A + '/testers.json', 'testers.json')
    for f in os.listdir(A + '/generated'): z.write(A + '/generated/' + f, 'generated/' + f)
    z.write(O + '/auto.json', 'auto.json'); z.write(O + '/tests.json', 'tests.json')
    for f in sorted(os.listdir(O + '/frames')): z.write(O + '/frames/' + f, 'frames/' + f)
    I = S + '/nord/site/norden/img'
    for f in sorted(os.listdir(I)):
        if re.fullmatch(r's\w+\.png', f): z.write(I + '/' + f, 'img/' + f)
# test 3: the client's data is clean; the platform's first delivery has two mistakes in the step data (a quantity in one step, a repeat count), the second delivery (the normal one) has them right
def variant(name, src_zip, edit):
    zin = zipfile.ZipFile(src_zip)
    with zipfile.ZipFile(OUT + '/samples/' + name, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in zin.namelist():
            d = zin.read(n); d2 = edit(n, d); z.writestr(n, d if d2 is None else d2)
def e_client3(n, d):
    if n == 'package.json': j = json.loads(d); j['name'] = 'NORDEN 折叠桌（模拟资料 · 测试 3）'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
def e_deliv3(n, d):
    if n == 'steps.draft.json':
        j = json.loads(d); s6 = next(x for x in j if x['id'] == '6'); assert s6['parts'] == [['110733', 6]]; s6['parts'] = [['110733', 4]]; return json.dumps(j, ensure_ascii=False, indent=1).encode()
    if n == 'package.patch.json':
        j = json.loads(d); assert j['units'][0]['repeat'] == {'9': 6, '10': 6}; j['units'][0]['repeat'] = {'9': 5, '10': 5}; return json.dumps(j, ensure_ascii=False, indent=1).encode()
    if n == 'delivery.json': j = json.loads(d); j['note'] = '测试 3 的第一次交付：步骤数据里有两处错。'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
variant('norden-client-test3.zip', OUT + '/samples/norden-client.zip', e_client3); variant('norden-delivery-test3.zip', OUT + '/samples/norden-delivery.zip', e_deliv3)
# test 4: problems that only a new delivery can put right: a step left out, two steps in the wrong order, an animation that fails the self-check
def e_client4(n, d):
    if n == 'package.json': j = json.loads(d); j['name'] = 'NORDEN 折叠桌（模拟资料 · 测试 4）'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
def e_deliv4(n, d):
    if n.startswith('frames/7_'): return False
    if n == 'steps.draft.json':
        j = [x for x in json.loads(d) if x['id'] != '7']; i5 = next(i for i, x in enumerate(j) if x['id'] == '5'); j[i5], j[i5 + 1] = j[i5 + 1], j[i5]; return json.dumps(j, ensure_ascii=False, indent=1).encode()
    if n in ('generated/narration.json', 'generated/qa.json'): j = json.loads(d); j.pop('7', None); return json.dumps(j, ensure_ascii=False).encode()
    if n == 'auto.json':
        j = json.loads(d); j['steps'] = [x for x in j['steps'] if x['id'] != '7']; next(x for x in j['steps'] if x['id'] == '5')['checks']['holes'].update(ok=False, note='横销落点处没有孔（4 处）'); return json.dumps(j, ensure_ascii=False).encode()
    if n == 'delivery.json': j = json.loads(d); j['note'] = '测试 4 的第一次交付：少一步、两步顺序反了、一步的模型缺孔（缺孔是加在自检结果里的，分镜图仍是正常的）。'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
def variant2(name, src_zip, edit):
    zin = zipfile.ZipFile(src_zip)
    with zipfile.ZipFile(OUT + '/samples/' + name, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in zin.namelist():
            d = zin.read(n); d2 = edit(n, d)
            if d2 is False: continue
            z.writestr(n, d if d2 is None else d2)
variant2('norden-client-test4.zip', OUT + '/samples/norden-client.zip', e_client4); variant2('norden-delivery-test4.zip', OUT + '/samples/norden-delivery.zip', e_deliv4)
# test 5: a real modelling error that the geometry checks cannot see (the notched end board of the drawer is upside down in step 10): the storyboard of that step comes from a build with the error (nord/mkv5.sh)
def e_client5(n, d):
    if n == 'package.json': j = json.loads(d); j['name'] = 'NORDEN 折叠桌（模拟资料 · 测试 5）'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
def e_deliv5(n, d):
    if n.startswith('frames/10_'): return open(H + '/v5fix/' + n.split('/')[1], 'rb').read()
    if n == 'delivery.json': j = json.loads(d); j['note'] = '测试 5 的第一次交付：第 10 步的动画里有一处真实的建模错误，机器自检查不出来。'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
variant2('norden-client-test5.zip', OUT + '/samples/norden-client.zip', e_client5); variant2('norden-delivery-test5.zip', OUT + '/samples/norden-delivery.zip', e_deliv5)
# the delivered model of test 5 is the NORDEN model with the notched end board turned over: stated as an edit layer, so the model editor opens on the model as delivered
with zipfile.ZipFile(OUT + '/samples/norden-delivery-test5.zip', 'a', zipfile.ZIP_DEFLATED) as z: z.writestr('model/overrides.json', json.dumps({'note': '测试 5：交付的模型里，有缺口端板装反了', 'parts': {'cp85': {'rot': [0, 0, 2], 'off': [0, 0, 0]}}}, ensure_ascii=False))
# test 6: the drawer bottom of step 10 travels in through a side board (a route laid on the delivered model); the self-check result and the storyboard of that step come from that model (nord/mergepath.js)
def e_client6(n, d):
    if n == 'package.json': j = json.loads(d); j['name'] = 'NORDEN 折叠桌（模拟资料 · 测试 6）'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
def e_deliv6(n, d):
    if n.startswith('frames/10_'): return open(H + '/v6fix/' + n.split('/')[1], 'rb').read()
    if n == 'auto.json': return open(H + '/v6fix/auto.json', 'rb').read()
    if n == 'delivery.json': j = json.loads(d); j['note'] = '测试 6 的第一次交付：第 10 步有一个零件的移动路线穿过了别的零件。'; return json.dumps(j, ensure_ascii=False, indent=1).encode()
variant2('norden-client-test6.zip', OUT + '/samples/norden-client.zip', e_client6); variant2('norden-delivery-test6.zip', OUT + '/samples/norden-delivery.zip', e_deliv6)
with zipfile.ZipFile(OUT + '/samples/norden-delivery-test6.zip', 'a', zipfile.ZIP_DEFLATED) as z: z.write(H + '/v6fix/overrides.json', 'model/overrides.json')
print('app', OUT, BUILD, {f: os.path.getsize(OUT + '/samples/' + f) // 1024 for f in os.listdir(OUT + '/samples')}, 'KB')
