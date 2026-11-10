"""A complete, simulated client package built from NORDEN, for walking the platform's stages end to end.
Everything marked 模拟 is made up for the test: dimensions and hardware specs are estimates from the animation model, the authorization is a dummy,
and the manual PDF is re-typeset from our step data. None of it is IKEA data."""
import json, csv, os, shutil, base64, html
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.dirname(H)
D = os.path.join(H, 'packages', 'norden-sim'); shutil.rmtree(D, ignore_errors=True); os.makedirs(D + '/manual'); os.makedirs(D + '/model'); os.makedirs(D + '/photos'); os.makedirs(D + '/_src')
SIM = '模拟数据，仅用于平台测试，不是 IKEA 官方数据'
steps = json.load(open(S + '/nord/steps.json', encoding='utf8')); cells = json.load(open(S + '/nord/cells.json', encoding='utf8')); name = {c['code']: c['name'] for c in cells}
bag = {'107271':4,'10005601':4,'156508':2,'120139':2,'105330':4,'116546':48,'101352':8,'117494':4,'110733':42,'121121':4}
# parts list; the hex key ships in the box but is a tool, listed separately
with open(D + '/parts.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['code', 'name', 'qty', 'list'])
    for c, q in bag.items(): w.writerow([c, name[c], q, '五金袋'])
# hardware specs (mm), estimated from the model
HW = {'110733': ('螺丝', 12, 4, '沉头十字', '镀锌钢'), '117494': ('螺丝', 22, 3.5, '圆头十字带垫圈', '镀锌钢'), '116546': ('螺栓', 30, 4.4, '圆头十字', '镀锌钢'),
      '105330': ('螺栓', 104, 6, '内六角圆头', '镀锌钢'), '121121': ('横销', 26, 11, '一字槽圆柱，侧面螺纹孔', '镀锌钢'), '101352': ('木销', 32, 9, '平头，表面竖纹', '山毛榉木'),
      '107271': ('脚垫', 9, 30, '圆帽，十字插脚', '塑料'), '156508': ('止动垫', 38, 17, '长条，两个圆柱插脚', '塑料'), '120139': ('钢条', 194, 18, '三个沉孔，两端小孔', '钢，厚 2.5'),
      '10005601': ('铰链', 72, 50, '两片各四个沉孔', '钢'), '10083377': ('工具', 70, 4, 'L 形内六角扳手 4 毫米', '钢')}
with open(D + '/hardware.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['code', 'name', 'type', 'length_mm', 'diameter_mm', 'head', 'material', 'description'])
    for c in cells:
        t = HW[c['code']]; w.writerow([c['code'], c['name'], t[0], t[1], t[2], t[3], t[4], SIM])
# panel sizes (mm): length, width, thickness
DIM = [('框架', 712, 720, 36), ('支撑腿', 699, 522, 22), ('连接木块', 156, 50, 30), ('垫块', 50, 40, 13), ('中段桌板', 800, 260, 25), ('桌板', 800, 630, 25),
       ('抽屉长板', 300, 120, 12), ('无缺口端板', 136, 120, 12), ('有缺口端板', 136, 120, 12), ('抽屉底板', 290, 124, 3)]
with open(D + '/dimensions.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['part', 'length_mm', 'width_mm', 'thickness_mm'])
    for r in DIM: w.writerow(r)
json.dump({'items': ['说明书建议两人组装。', '翻转桌子（第 8 步）必须两人操作。', '放下桌板前，先确认支撑腿到位。', '在软垫上操作，避免桌面和木件损伤。', '这件产品不需要墙面固定：说明书没有防倾倒装置。', '桌面承重以产品页为准，助手不说具体承重数值。'],
           'two_person_steps': ['8'], 'anti_tip': False, 'anti_tip_note': '桌子，说明书无墙面固定', 'load_limits': [], 'simulated': True},
          open(D + '/safety.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
# optional items: FAQ, terms, step times
faq = json.load(open(S + '/nord/faq.json', encoding='utf8'))
with open(D + '/faq.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['step', 'question', 'answer'])
    for k, v in faq.items():
        if k == 'syn': continue
        for e in v: w.writerow([k, (e.get('q') or [''])[0], e['a']])
with open(D + '/terms.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['official', 'common_names'])
    for k, v in faq['syn'].items(): w.writerow([k, '、'.join(v)])
with open(D + '/step_times.csv', 'w', newline='', encoding='utf8') as f:
    w = csv.writer(f); w.writerow(['step', 'minutes'])
    for s in steps: w.writerow([s['id'], s.get('est_min', '')])
# sources the print script turns into PDFs: the authorization and a re-typeset manual with a text layer
css = "@page{size:A4;margin:16mm}body{font-family:'Noto Sans CJK SC',sans-serif;font-size:11pt;color:#111}h1{font-size:20pt}h2{font-size:15pt;margin:0 0 6px}.pg{page-break-after:always}.wm{color:#b3261e;font-weight:700}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:3px 6px;font-size:10pt}img{max-width:100%;max-height:150mm;display:block;margin:6px 0}"
auth = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body><h1>使用授权书（模拟）</h1><p class="wm">模拟文件：仅用于装配助手平台的内部测试，无任何法律效力。</p>
<p>授权方：示例家具公司（虚构）</p><p>被授权方：装配助手制作平台</p><p>授权范围：产品“NORDEN 折叠桌（测试用）”的装配说明书 AA-2580705-1、说明书图片、零件图，用于制作和发布装配助手。</p>
<p>期限：2026 年 11 月 10 日至 2027 年 11 月 9 日</p><p>签字：＿＿＿＿（模拟）　　盖章：（模拟）</p></body></html>"""
open(D + '/_src/auth.html', 'w', encoding='utf8').write(auth)
def img64(p): return 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
pages = [f'<div class="pg"><h1>NORDEN 折叠桌 装配说明书（模拟重排版）</h1><p>文档编号 AA-2580705-1 · 版本 1 · 11 步</p><p class="wm">{SIM}。按原说明书的步骤重新排版，带文字层，供引擎读取。</p><img src="{img64(S + "/nord/hi/p-01.png")}"></div>',
         '<div class="pg"><h2>零件清单</h2><table><tr><th>编号</th><th>名称</th><th>数量</th></tr>' + ''.join(f'<tr><td>{c}</td><td>{name[c]}</td><td>{q}</td></tr>' for c, q in bag.items()) + '<tr><td>10083377</td><td>内六角扳手（工具）</td><td>1</td></tr></table>'
         + '<h2 style="margin-top:14px">板件</h2><table><tr><th>名称</th><th>长×宽×厚（毫米）</th></tr>' + ''.join(f'<tr><td>{a}</td><td>{b}×{c}×{d}</td></tr>' for a, b, c, d in DIM) + '</table></div>']
for s in steps:
    rep = '（重复 6 次，每个抽屉一次）' if s['id'] in ('9', '10') else ''
    pages.append(f'<div class="pg"><h2>第 {s["id"]} 步　{html.escape(s["title"])}{rep}</h2><img src="{img64(S + "/nord/img/s" + s["id"] + ".png")}"><ol>' + ''.join(f'<li>{html.escape(x)}</li>' for x in s['do']) + '</ol><p>零件：' + '，'.join(f'{c} × {q}' for c, q in s['parts']) + '</p>' + ''.join(f'<p>注意：{html.escape(x)}</p>' for x in s.get('warn', [])) + '</div>')
open(D + '/_src/manual.html', 'w', encoding='utf8').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(pages)}</body></html>')
# steps with the client's confirmations folded in: no inferred notes left
pkg = {'slug': 'norden-sim', 'site': 'norden', 'package_zip': 'package.zip', 'stage4': {'replay_threshold': .95}, 'stage5': {'photo_steps': ['2', '7', '10']}, 'name': 'NORDEN 折叠桌（模拟资料包）', 'entry': 'A',
       'manuals': [{'doc': 'AA-2580705-1', 'title': 'NORDEN 装配说明书（模拟重排版）', 'pdf': 'manual/NORDEN_manual_sim.pdf', 'pages_dir': None, 'pages': len(pages)}],
       'overall_mm': {'w': 800, 'd': 1520, 'h': 740, 'confirmed': True, 'src': '模拟：桌板全部展开 152 厘米，宽 80 厘米，高 74 厘米'},
       'units': [{'list': '五金袋', 'steps': '*', 'repeat': {'9': 6, '10': 6}}], 'alternatives': [],
       'similar': {'110733': ['117494'], '117494': ['110733'], '116546': ['105330'], '105330': ['116546']},
       'files': {'parts': 'parts.csv', 'hardware': 'hardware.csv', 'dimensions': 'dimensions.csv', 'safety': 'safety.json'},
       'optional': {'model3d': ['model/norden_table.obj', 'model/norden_drawer.obj'], 'photos': 'photos', 'faq': 'faq.csv', 'terms': 'terms.csv', 'est_min': 'step_times.csv'},
       'authorization': {'file': 'authorization_sim.pdf', 'scope': '说明书、图片、零件图', 'valid_to': '2027-11-09', 'simulated': True},
       'note': '模拟资料包：用 NORDEN 的数据补齐了全部资料，尺寸和规格是按动画模型估算的，授权书是虚构的。只用于演示平台流程。'}
json.dump(pkg, open(D + '/package.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
# stage 4: what the engine generated for the assistant (here: the NORDEN assistant's own narration, Q&A and part list), and the client's banned phrases
os.makedirs(D + '/generated')
shutil.copy(S + '/nord/say.js', D + '/generated/narration.json')  # after the stage 4 fixes: step 6 names the screws; shutil.copy(S + '/nord/faq.json', D + '/generated/qa.json'); shutil.copy(S + '/nord/cells.json', D + '/generated/cells.json')
json.dump([{'pattern': r'承重.{0,6}\d+|最多.{0,4}\d+\s*(公斤|千克|kg)', 'rule': '不得说具体承重数值'}, {'pattern': r'不需要两个人|一个人就能(翻|搬)', 'rule': '不得说翻桌不需要两人'},
           {'pattern': r'保证|绝对(安全|不会)', 'rule': '不得做绝对化承诺'}, {'pattern': r'宜家客服', 'rule': '不得替厂家承诺客服服务'}],
          open(D + '/banned.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
# stage 5: simulated tester records and release decision
json.dump({'simulated': True, 'steps': len(steps), 'testers': [
    {'name': '测试员 A（模拟）', 'role': '专职测试员', 'completed_alone': True, 'photo_checks': len(steps), 'signed': True},
    {'name': '试装者 1（模拟）', 'role': '试装者', 'completed_alone': True, 'photo_checks': len(steps), 'minutes': 68},
    {'name': '试装者 2（模拟）', 'role': '试装者', 'completed_alone': True, 'photo_checks': len(steps), 'minutes': 81},
    {'name': '试装者 3（模拟）', 'role': '试装者', 'completed_alone': True, 'photo_checks': len(steps), 'minutes': 74}],
  'issues': [{'severity': '一般', 'step': '5', 'text': '“横销”两次被听成“红销”，已加进俗称表', 'closed': True},
             {'severity': '轻微', 'step': '9', 'text': '抽屉长板的标签挡住了一点凸条', 'closed': False, 'recorded': True}]},
  open(D + '/testers.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
json.dump({'simulated': True, 'model': '模拟', 'time': '2026-11-10', 'cases': [{'step': s_, 'kind': k, 'expect': e, 'got': e, 'say': '模拟结果'} for s_ in ['2', '7', '10'] for k, e in [('装好了', 'pass'), ('没装好', 'fail')]]},
          open(D + '/ai_photo.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
json.dump({'simulated': True, 'version': 1, 'url': 'https://peteryin1969.github.io/norden/norden/', 'qr_location': '说明书封面右下角', 'approved_by': '示例家具公司 产品经理（模拟）', 'approved_at': '2026-11-10'},
          open(D + '/release.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)

json.dump(steps, open(D + '/steps.draft.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('package', D)
