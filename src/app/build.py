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
a.btn{display:inline-block;padding:6px 12px;border-radius:8px;border:1px solid var(--ac);text-decoration:none}button:disabled{opacity:.5;cursor:default}@media (max-width:560px){.row3{grid-template-columns:1fr}.row5{grid-template-columns:1fr 1fr}}"""
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/engine'); os.makedirs(OUT + '/vendor/pyodide'); os.makedirs(OUT + '/vendor/pdfjs'); os.makedirs(OUT + '/samples')
page = lambda title, body: f'<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>{title}</title><style>{CSS}</style><script>window.APPBUILD="{BUILD}"</script></head><body>{body}</body></html>'
open(OUT + '/index.html', 'w', encoding='utf8').write(page('装配助手平台 · 工作台', open(H + '/index.body.html', encoding='utf8').read()))
open(OUT + '/project.html', 'w', encoding='utf8').write(page('项目 · 装配助手平台', open(H + '/project.body.html', encoding='utf8').read()))
open(OUT + '/portal.js', 'w', encoding='utf8').write('(function(){' + JS + '\n})();')
shutil.copy(H + '/app.js', OUT + '/app.js')
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
print('app', OUT, BUILD, {f: os.path.getsize(OUT + '/samples/' + f) // 1024 for f in os.listdir(OUT + '/samples')}, 'KB')
