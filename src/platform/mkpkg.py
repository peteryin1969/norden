"""Assemble the four IKEA test products as client packages, in the format of the process doc's section 3.
Only data we actually hold goes in. Anything we do not have is left empty so the stage 1 review reports it."""
import json, csv, os, re, shutil, glob
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(H)
OUT = os.path.join(H, 'packages')

def feat(html):
    s = open(html, encoding='utf8').read(); t = re.search(r"const FEAT=(\{.*?\});", s, re.S).group(1)
    try: return json.loads(t)
    except Exception: return json.loads(t.replace("'", '"'))
def sim(html):
    s = open(html, encoding='utf8').read(); t = re.search(r"const SIM=(\{.*?\});", s, re.S).group(1)
    return json.loads(t.replace("'", '"'))
def safety_text(html):
    s = open(html, encoding='utf8').read(); i = s.index('<section id="v-safe"'); j = s.index('</section>', i); sec = s[i:j]
    flags = [re.sub(r'<[^>]+>', '', x).strip() for x in re.findall(r'<div class="flag warn">(.*?)</div>', sec, re.S)]
    lis = [re.sub(r'<[^>]+>', '', x).strip() for x in re.findall(r'<li>(.*?)</li>', sec, re.S)]
    return [x for x in flags + lis if x]
def head_of(desc):
    for k in ['沉头', '圆头', '宽头', '大头', '宽圆头', '圆帽']:
        if k in desc: return k
    return ''
def kind_of(name, desc):
    for k, v in [('螺丝', '螺丝'), ('螺栓', '螺栓'), ('木销', '木销'), ('钉', '钉子'), ('锁', '偏心锁'), ('连接件', '连接件'), ('铰链', '铰链'), ('支架', '支架'), ('垫圈', '垫圈')]:
        if k in name or k in desc: return v
    return '其他'

P = {
 'norden': dict(name='IKEA NORDEN 折叠桌', src='nord', html='nord/norden.html', manuals=[dict(doc='AA-2580705-1', title='NORDEN 装配说明书', pages=sorted(glob.glob(S + '/nord/hi/p-*.png')), pdf='6361b50f-01.pdf')],
   lists={'五金袋': {'107271':4,'10005601':4,'156508':2,'120139':2,'105330':4,'116546':48,'101352':8,'117494':4,'110733':42,'121121':4}},
   units=[dict(list='五金袋', steps='*', repeat={'9': 6, '10': 6})], alternatives=[], overall=None,
   panels=['框架', '支撑腿', '连接木块', '垫块', '中段桌板', '桌板', '抽屉长板', '无缺口端板', '有缺口端板', '抽屉底板']),
 'storklinta': dict(name='IKEA STORKLINTA 六斗柜', src='stork', html='stork/storklinta.html', manuals=[dict(doc='AA-2413736-7', title='STORKLINTA 装配说明书', pages=sorted(glob.glob(S + '/stork/hi/p-*.png')), pdf=None)],
   lists={'1 号袋': {'118331':14,'119252/119250':12,'110126':2,'101345':14,'102553':4,'105248':8,'146114':18,'151707':7,'151708':7,'10093081':6,'10093082':6,'10101849':4,'158568':3,'151931':12},
          '2 号袋（抽屉）': {'120076':48,'118331':24,'146114':36,'145718':24,'101345':24,'10040242':6}, '墙面固定件': {'109572':2,'10087223':2,'10102070':2}},
   units=[dict(list='*', steps='*', repeat={str(i): 6 for i in range(35, 44)})], alternatives=[dict(steps=['32', '33+34'], note='墙边有没有踢脚线，二选一')], overall=dict(w=1400, d=480, h=740, confirmed=False, src='动画模型里的尺寸，按产品页搭建'),
   panels=['外侧板', '中隔板', '底板', '脚线', '背板', '顶板', '抽屉前板', '抽屉侧板', '抽屉底板', '抽屉后板']),
 'billy-corner': dict(name='IKEA BILLY 转角书柜', src='billy', html='billy/billy.html', manuals=[dict(doc='AA-1823127-9', title='BILLY 书柜', pages=sorted(glob.glob(S + '/billy/p/bk-*.png')), pdf='af5b3d54-Billy_Bookcase.pdf'), dict(doc='AA-982217-8', title='BILLY 加高单元', pages=sorted(glob.glob(S + '/billy/p/ex-*.png')), pdf='983446f8-Billy_Height_Extention_Units.pdf'), dict(doc='AA-197501-5', title='BILLY 转角配件', pages=sorted(glob.glob(S + '/billy/p/cn-*.png')), pdf='eee42e5e-Billy_Corner_Fitting.pdf')],
   lists={'书柜（每个）': {'118331':12,'101351':16,'101201':18,'119081':12,'131372':16,'109041':2,'100823':4,'106989':2}, '加高单元（每个）': {'118331':6,'101351':4,'114667':1,'101345':4,'108001':2,'119081':6,'103114':2,'109041':2,'100823':4,'106989':2}, '转角配件': {'100362':4,'115257':2,'109534':2,'102715':1}},
   units=[dict(list='书柜（每个）', steps='B', repeat=3), dict(list='加高单元（每个）', steps='E', repeat=3), dict(list='转角配件', steps='C', repeat=1)], alternatives=[dict(steps=['C4', 'C3'], note='连接片用在加高单元顶（这个组合）或书柜顶（不加高时），二选一')],
   overall=dict(w=None, d=None, h=None, confirmed=False, src='产品图：书柜 80 或 40 宽、28 深、202 高，加高 35 高；组合外形没有给出'),
   panels=['侧板', '底板', '中间固定板', '顶板', '脚线', '背板', '活动搁板', '转角底板']),
 'billy-oxberg': dict(name='IKEA BILLY OXBERG 书柜', src='billy-oxberg', html='billy-oxberg/billy-oxberg.html', manuals=[dict(doc='AA-2289108-3', title='BILLY 书柜（塞子固定背板版）', pages=sorted(glob.glob(S + '/billy-oxberg/p/nb-*.png')), pdf=None), dict(doc='（OXBERG）', title='OXBERG 门', pages=sorted(glob.glob(S + '/billy-oxberg/p/ox-*.png')), pdf='b1003974-OXBERG305.087.09.pdf')],
   lists={'书柜（每个）': {'118331':12,'101351':16,'151705':18,'151706':18,'119081':12,'131372':16,'109041':2,'100823':4,'106989':2}, '门（每扇）': {'114667':1,'113287':6,'100349':6,'131386':1,'102384':2,'109221':3,'109336':3,'122576':1,'121043':3}},
   units=[dict(list='书柜（每个）', steps='B', repeat=2), dict(list='门（每扇）', steps='D', repeat=4)], alternatives=[],
   overall=dict(w=800, d=280, h=2020, confirmed=False, src='产品图：80 宽、28 深、202 高（每个书柜）'),
   panels=['侧板', '柜底板', '中间固定板', '顶板', '脚线', '背板', '活动搁板', '门']),
}
ATT = '/mnt/user-data/attachments/7ab5884c-0d84-5527-a4d8-3db1827036cb/'
for slug, p in P.items():
    d = os.path.join(OUT, slug); shutil.rmtree(d, ignore_errors=True); os.makedirs(d + '/manual')
    cells = json.load(open(f"{S}/{p['src']}/cells.json", encoding='utf8')); name = {c['code']: c['name'] for c in cells}
    F = feat(S + '/' + p['html'])
    with open(d + '/parts.csv', 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f); w.writerow(['code', 'name', 'qty', 'list'])
        for lst, m in p['lists'].items():
            for c, q in m.items(): w.writerow([c, name.get(c, ''), q, lst])
    with open(d + '/hardware.csv', 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f); w.writerow(['code', 'name', 'type', 'length_mm', 'diameter_mm', 'head', 'material', 'description'])
        for c in cells: w.writerow([c['code'], c['name'], kind_of(c['name'], F.get(c['code'], '')), '', '', head_of(F.get(c['code'], '')), '', F.get(c['code'], '')])
    with open(d + '/dimensions.csv', 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f); w.writerow(['part', 'length_mm', 'width_mm', 'thickness_mm'])
        for n in p['panels']: w.writerow([n, '', '', ''])
    safety = safety_text(S + '/' + p['html'])
    json.dump({'items': safety, 'two_person_steps': [], 'anti_tip': any('倾倒' in x or '墙' in x for x in safety), 'load_limits': [x for x in safety if '公斤' in x]}, open(d + '/safety.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    mans = []
    for m in p['manuals']:
        pd = os.path.join('manual', re.sub(r'\W+', '_', m['doc']).strip('_') or 'doc'); os.makedirs(os.path.join(d, pd), exist_ok=True)
        for i, src in enumerate(m['pages'], 1): shutil.copy(src, os.path.join(d, pd, f'p-{i:02d}.png'))
        pdf = None
        if m['pdf'] and os.path.exists(ATT + m['pdf']): pdf = os.path.join('manual', os.path.basename(m['pdf']).split('-', 1)[1]); shutil.copy(ATT + m['pdf'], os.path.join(d, pdf))
        mans.append({'doc': m['doc'], 'title': m['title'], 'pdf': pdf, 'pages_dir': pd, 'pages': len(m['pages'])})
    steps = json.load(open(f"{S}/{p['src']}/steps.json", encoding='utf8'))
    pkg = {'slug': slug, 'name': p['name'], 'entry': 'A', 'manuals': mans, 'overall_mm': p['overall'], 'units': p['units'], 'alternatives': p['alternatives'],
           'similar': sim(S + '/' + p['html']), 'files': {'parts': 'parts.csv', 'hardware': 'hardware.csv', 'dimensions': 'dimensions.csv', 'safety': 'safety.json'},
           'optional': {'model3d': None, 'photos': None, 'faq': None, 'terms': None, 'est_min': None}, 'authorization': None,
           'note': 'IKEA 产品仅用于平台内部测试，未取得授权。'}
    json.dump(pkg, open(d + '/package.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(steps, open(d + '/steps.draft.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(slug, len(mans), 'manuals', sum(m['pages'] for m in mans), 'pages', len(cells), 'hardware', len(steps), 'steps')
