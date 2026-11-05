import json, os
from PIL import Image, ImageChops
R = os.path.dirname(os.path.abspath(__file__))
steps = json.load(open(f'{R}/steps.json', encoding='utf8'))
out = f'{R}/img'; os.makedirs(out, exist_ok=True)
for s in steps:
    i = Image.open(f"{R}/hi/p-{s['page']:02d}.png").convert('L')
    w, h = i.size; x0, y0, x1, y1 = s['crop']
    for m in s.get('mask', []): i.paste(255, (int(m[0]*w), int(m[1]*h), int(m[2]*w), int(m[3]*h)))
    c = i.crop((int(x0*w), int(y0*h), int(x1*w), int(y1*h)))
    box = ImageChops.invert(c).point(lambda v: 255 if v > 40 else 0).getbbox()
    if box: c = c.crop((max(box[0]-12, 0), max(box[1]-12, 0), min(box[2]+12, c.width), min(box[3]+12, c.height)))
    c.quantize(16).save(f"{out}/s{s['id']}.png", optimize=True)
for p in (3, 4, 5, 6):
    Image.open(f'{R}/hi/p-{p:02d}.png').convert('L').quantize(16).save(f'{out}/parts{p}.png', optimize=True)

bags = {'118331':14,'119252/119250':12,'110126':2,'101345':14,'102553':4,'105248':8,'146114':18,'151707':7,'151708':7,'10093081':6,'10093082':6,'10101849':4,'158568':3,'151931':12}
bag2 = {'120076':48,'118331':24,'146114':36,'145718':24,'101345':24,'10040242':6}
wall = {'109572':2,'10087223':2,'10102070':2}
need = {}
for k, v in list(bags.items()) + list(bag2.items()) + list(wall.items()):
    need[k] = need.get(k, 0) + v
used = {}
ids = [s['id'] for s in steps]
for s in steps:
    n = int(s['id']) if s['id'].isdigit() else 0
    mult = 6 if 35 <= n <= 43 else 1
    for code, q in s['parts']:
        # steps 32 and 34 are alternatives: count one path only
        if s['id'] == '34': continue
        used[code] = used.get(code, 0) + q * mult
bad = {k: (need.get(k), used.get(k)) for k in set(need) | set(used) if need.get(k) != used.get(k)}
print('mismatch:', bad or 'none'); assert not bad

parts = []
for k, q in need.items():
    bag = '1 号袋' if k in bags else ('A 号袋' if k == '151931' else '')
    parts.append({'code': k, 'qty': q})
tpl = open(f'{R}/page.html', encoding='utf8').read()
html = tpl.replace('/*STEPS*/[]', json.dumps(steps, ensure_ascii=False, separators=(',', ':')))
html = html.replace('/*CELLS*/[]', open(f'{R}/cells.json', encoding='utf8').read())
html = html.replace('/*ANIM*/', open(f'{R}/anim.js', encoding='utf8').read())
open(f'{R}/storklinta.html', 'w', encoding='utf8').write(html)
print(len(steps), 'steps;', sum(os.path.getsize(f'{out}/{f}') for f in os.listdir(out))//1024, 'KB images')
