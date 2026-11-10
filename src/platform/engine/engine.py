"""Assembly-assistant platform engine, entry A (the client already has an assembly plan), stages 1-3.
Each stage returns a report: a list of checks and a gate result.
A check has: id, level (必需/建议/可选), status (pass/fail/warn/todo/na), title, detail, and when not passing: why it is needed and how to fix it.
Gate: 通过 when every 必需 check passes; 退回补充 when one fails; 待客户确认 when only client answers or sign-offs are missing.
Stages 2 and 3 can run as 预审 before stage 1 has passed: they report, but do not count toward the gate."""
import json, csv, os, re, subprocess, datetime
from collections import defaultdict

def load(pkg_dir):
    P = json.load(open(os.path.join(pkg_dir, 'package.json'), encoding='utf8'))
    rd = lambda f: list(csv.DictReader(open(os.path.join(pkg_dir, f), encoding='utf8'))) if f and os.path.exists(os.path.join(pkg_dir, f)) else None
    P['_parts'] = rd(P['files'].get('parts')); P['_hw'] = rd(P['files'].get('hardware')); P['_dims'] = rd(P['files'].get('dimensions'))
    sf = os.path.join(pkg_dir, P['files'].get('safety') or '')
    P['_safety'] = json.load(open(sf, encoding='utf8')) if os.path.isfile(sf) else None
    P['_dir'] = pkg_dir
    return P

def C(id, level, status, title, detail='', why='', fix='', example=''):
    return {k: v for k, v in dict(id=id, level=level, status=status, title=title, detail=detail, why=why, fix=fix, example=example).items() if v != ''}

def gate(checks, stage, preview=False, waiting=None):
    must_fail = [c for c in checks if c['level'] == '必需' and c['status'] == 'fail']
    todo = [c for c in checks if c['status'] == 'todo']
    if must_fail: g = '退回补充'
    elif todo: g = '待客户确认'
    else: g = '通过'
    return {'stage': stage, 'gate': g, 'preview': preview, 'counts': {s: sum(c['status'] == s for c in checks) for s in ['pass', 'fail', 'warn', 'todo', 'na']}, 'checks': checks,
            'time': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

def pdf_kind(path):
    """vector: text and drawing operators; raster: whole pages are images (scans or print-to-PDF)"""
    try:
        fonts = subprocess.run(['pdffonts', path], capture_output=True, text=True, timeout=60).stdout.strip().splitlines()[2:]
        imgs = subprocess.run(['pdfimages', '-list', path], capture_output=True, text=True, timeout=60).stdout.strip().splitlines()[2:]
        pages = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', path], capture_output=True, text=True, timeout=60).stdout).group(1))
        big = [l for l in imgs if l.split() and int(l.split()[3]) > 1500]
        return {'pages': pages, 'fonts': len(fonts), 'page_images': len(big), 'kind': 'raster' if not fonts and len(big) >= pages * .8 else 'outline' if not fonts else 'vector'}
    except Exception as e:
        return {'error': str(e)}

# ---------------- stage 1: product data package ----------------
def stage1(P, steps):
    K = []
    a = P.get('authorization')
    K.append(C('1.0', '必需', 'pass' if a and os.path.exists(os.path.join(P['_dir'], a.get('file', ''))) else 'fail', '使用授权（阶段 0）', (f'已登记授权书，范围：{a.get("scope")}，有效期至 {a.get("valid_to")}。' + ('（模拟授权书，无法律效力）' if a.get('simulated') else '')) if a else '没有登记授权书。' + P.get('note', ''),
               '平台只能使用客户有权使用的说明书、图片和商标。', '上传签字盖章的授权书 PDF，写明可使用的资料范围和期限。'))
    # manuals
    for i, m in enumerate(P['manuals'], 1):
        pages_ok = m['pages'] > 0
        K.append(C(f'1.1.{i}', '必需', 'pass' if pages_ok else 'fail', f'说明书 {m["doc"]} 可读取', f'{m["title"]}，{m["pages"]} 页。' if pages_ok else '没有收到这份说明书。',
                   '说明书是步骤、零件和图示的唯一依据。', '上传这份说明书的全部页面。'))
        if m.get('pdf'):
            k = pdf_kind(os.path.join(P['_dir'], m['pdf']))
            ok = k.get('kind') == 'vector'
            K.append(C(f'1.2.{i}', '必需', 'pass' if ok else 'fail', f'说明书 {m["doc"]} 是原始矢量 PDF',
                       f'PDF {k.get("pages","?")} 页，内嵌字体 {k.get("fonts","?")} 个，整页图片 {k.get("page_images","?")} 张。' + {'vector': '是带文字层的矢量文件。', 'outline': '图形是矢量的，但没有文字层：文字和编号被转成了线条（通常是“打印成 PDF”造成的），引擎读不出零件编号。', 'raster': '是图片版（扫描件或打印成图片）。'}.get(k.get('kind'), '无法读取：' + str(k.get('error'))),
                       '没有文字层，零件编号、数量和尺寸只能靠识图读取，容易读错。', '请提供设计部门导出的原始 PDF，不要扫描或用“打印成 PDF”另存。',
                       '从排版软件（InDesign 等）直接导出的 PDF，可以选中文字。'))
        else:
            K.append(C(f'1.2.{i}', '必需', 'fail', f'说明书 {m["doc"]} 是原始矢量 PDF', '只有逐页图片，没有 PDF 文件。',
                       '图片版里的文字、编号和线条无法可靠读取。', '请提供设计部门导出的原始 PDF。'))
    # parts list
    parts = P['_parts']
    if not parts:
        K.append(C('1.3', '必需', 'fail', '零件清单', '没有收到零件清单。', '零件核对、零件格和编号都以它为准。', '上传 Excel 或 CSV：零件编号、名称、数量、所属包装袋。'))
    else:
        bad = [r for r in parts if not r['code'] or not r['name'] or not re.fullmatch(r'\d+', str(r['qty']).strip() or 'x')]
        K.append(C('1.3', '必需', 'fail' if bad else 'pass', '零件清单格式', f'{len(parts)} 行，' + (f'{len(bad)} 行缺编号、名称或数量：' + '、'.join(r['code'] or '?' for r in bad[:8]) if bad else '每行都有编号、名称和数量。'),
                   '缺项的零件无法核对。', '补齐这些行。'))
        drawn = {c for s in steps for c, q in s['parts']}
        listed = {r['code'] for r in parts}
        miss_in_list = sorted(drawn - listed); miss_in_steps = sorted(listed - drawn)
        txt = ''
        for m in P['manuals']:
            if m.get('pdf') and pdf_kind(os.path.join(P['_dir'], m['pdf'])).get('kind') == 'vector':
                txt += subprocess.run(['pdftotext', '-layout', os.path.join(P['_dir'], m['pdf']), '-'], capture_output=True, text=True).stdout
        in_pdf = set(re.findall(r'(?<![\d-])\d{5,8}(?![\d-])', txt)) if txt else None
        if in_pdf is not None:
            q_pdf = {}
            for r in parts:
                mm = re.search(re.escape(r['code']) + r'\s+\S+\s+(\d+)', txt)
                if mm: q_pdf[r['code']] = int(mm.group(1))
            qbad = [f'{c}：清单 {next(int(r["qty"]) for r in parts if r["code"]==c)}，说明书 {q}' for c, q in q_pdf.items() if q != next(int(r['qty']) for r in parts if r['code'] == c)]
            not_found = sorted(listed - in_pdf); extra = sorted(in_pdf - listed - drawn)
            st = 'fail' if (not_found or qbad) else 'pass'
            K.append(C('1.4', '必需', st, '零件清单与说明书零件页一致', ('清单里有、说明书文字里找不到：' + '、'.join(not_found) + '。' if not_found else '') + ('数量不一致：' + '；'.join(qbad) + '。' if qbad else '') + (f'清单 {len(listed)} 个编号都能在说明书里找到，读到数量的 {len(q_pdf)} 个全部一致。' if st == 'pass' else '') + ('说明书里另有编号 ' + '、'.join(extra) + '（不在清单，请确认是否为工具或另售件）。' if extra else ''),
                       '清单和说明书对不上，零件格和用量提示就会错。', '核对零件页，补上缺的编号，或改正数量。'))
            miss_in_list = None
        st = 'fail' if miss_in_list else 'pass'
        if miss_in_list is not None: K.append(C('1.4', '必需', st, '零件清单与说明书一致',
                   ('说明书步骤里出现、清单里没有：' + '、'.join(miss_in_list) + '。' if miss_in_list else '说明书步骤里的编号都在清单里。') +
                   ('清单里有、步骤里没用到：' + '、'.join(miss_in_steps) + '（在阶段 2 确认是否备用）。' if miss_in_steps else '') +
                   ' 说明书为图片版，零件页无法自动读取，这一项改为与步骤图中的编号核对。',
                   '清单和说明书对不上，零件格和用量提示就会错。', '核对零件页，补上缺的编号，或说明它为什么不在清单里。'))
    # dimensions
    o = P.get('overall_mm') or {}
    has_o = all(o.get(k) for k in ('w', 'd', 'h'))
    K.append(C('1.5', '必需', 'pass' if has_o and o.get('confirmed') else 'fail', '产品外形尺寸',
               (f'{o.get("w")}×{o.get("d")}×{o.get("h")} 毫米。' if has_o else '外形尺寸不完整。') + ('' if o.get('confirmed') else '来源：' + (o.get('src') or '无') + '。客户尚未确认。'),
               '三维模型的比例以它为准。', '提供宽、深、高（毫米），并确认数值来自产品设计数据。'))
    dims = P['_dims'] or []
    nod = [r['part'] for r in dims if not (r['length_mm'] and r['width_mm'] and r['thickness_mm'])]
    over = []
    if has_o:
        mx = max(o['w'], o['d'], o['h'])
        over = [r['part'] for r in dims if r['length_mm'] and float(r['length_mm']) > mx + 1]
    K.append(C('1.6', '必需', 'fail' if (not dims or nod or over) else 'pass', '每块板件的尺寸',
               ('没有板件尺寸表。' if not dims else '') + (f'{len(nod)} 个板件缺长、宽或厚：' + '、'.join(nod) + '。' if nod else '') + (f'比整体还长：{"、".join(over)}。' if over else '') + ('每块板件都有尺寸，且不超过外形。' if dims and not nod and not over else ''),
               '没有板件尺寸，动画只能按线稿估算比例，孔位和遮挡关系可能出错。', '按“板件、长、宽、厚（毫米）”逐块填写，误差不超过 1 毫米。', '侧板 2020 × 280 × 15'))
    # hardware specs
    hw = P['_hw'] or []
    no_spec = [r['name'] or r['code'] for r in hw if r['type'] in ('螺丝', '螺栓', '木销', '钉子', '连接件') and not (r['length_mm'] and r['diameter_mm'])]
    no_head = [r['name'] or r['code'] for r in hw if r['type'] in ('螺丝', '螺栓') and not r['head']]
    K.append(C('1.7', '必需', 'fail' if (not hw or no_spec or no_head) else 'pass', '五金规格',
               (f'{len(no_spec)} 种缺长度或直径：' + '、'.join(no_spec) + '。' if no_spec else '') + (f'缺头型：{"、".join(no_head)}。' if no_head else '') + ('' if no_spec or no_head else '每种五金都有长度、直径和头型。'),
               '零件卡片、三维模型和“别拿错”的提醒都靠这些数据。', '每种五金填长度、直径（毫米）、头型和材质。', '146114：长 12，直径 4，沉头十字，镀锌钢'))
    byc = {r['code']: r for r in hw}
    pairs, undiff = set(), []
    for a_, bs in (P.get('similar') or {}).items():
        for b_ in bs:
            k = tuple(sorted((a_, b_)))
            if k in pairs: continue
            pairs.add(k); A, B = byc.get(k[0]), byc.get(k[1])
            if not A or not B: continue
            same = all(A[f] == B[f] for f in ('length_mm', 'diameter_mm', 'head'))
            if same: undiff.append(f'{A["name"]} 和 {B["name"]}')
    K.append(C('1.8', '必需', 'fail' if undiff else 'pass', '相近的五金能用数据区分', ('这些相近的零件，规格数据完全一样或都没填，无法区分：' + '；'.join(undiff) + '。') if undiff else '相近的零件都有能区分的规格。',
               '用户最常拿错的就是长短、粗细相近的螺丝和木销，提示要说出具体差别。', '补上长度、直径或头型，让每一对至少有一项不同。'))
    # 3D model, safety and optional items
    mods = P['optional'].get('model3d'); mods = [mods] if isinstance(mods, str) else (mods or [])
    mnote, mst = '没有提供。动画会按说明书线稿和尺寸估算建模，周期更长，比例在界面上注明为估算。', 'warn'
    if mods:
        names, mx = set(), 0
        for f in mods:
            fp = os.path.join(P['_dir'], f)
            if not os.path.exists(fp): continue
            xs = [[], [], []]
            for line in open(fp, encoding='utf8'):
                if line.startswith('o '): names.add(re.sub(r'_[0-9A-Za-z]+$', '', line[2:].strip()))
                elif line.startswith('v '):
                    v = line.split()[1:4]; [xs[i].append(float(v[i])) for i in range(3)]
            if xs[0]: mx = max(mx, max(max(a_) - min(a_) for a_ in xs))
        codes = {r['code'] for r in (P['_parts'] or [])}; panels = {r['part'] for r in (P['_dims'] or [])}
        mc = sorted(codes - names); mp = sorted(panels - names)
        om = max([v for v in (P.get('overall_mm') or {}).values() if isinstance(v, (int, float))] or [0])
        unit_ok = not om or .4 * om <= mx <= 1.6 * om
        mst = 'pass' if not mc and not mp and unit_ok else 'fail'
        mnote = f'{len(mods)} 个文件，{len(names)} 种零件。' + ('缺少零件：' + '、'.join(mc + mp) + '。' if mc or mp else '清单里的每个编号和每块板件都能在模型里找到。') + (f'模型最大尺寸 {mx:.0f}，与外形尺寸 {om} 毫米不在同一量级，单位可能不是毫米。' if not unit_ok else f'最大尺寸 {mx:.0f} 毫米，单位正确。')
    K.append(C('1.9', '建议', mst, '三维模型', mnote,
               '有三维模型可以大幅提高动画准确度。', '提供 STEP、glTF 或 OBJ，每个零件独立并以零件编号命名，单位毫米，含孔位。'))
    sf = P['_safety']
    two = sorted({s['id'] for s in steps if re.search(r'两人|两个人|二人', s['title'] + ''.join(s['do']) + ''.join(s.get('warn', [])))})
    tip = any(re.search(r'倾倒|固定到墙|墙面', s['title'] + ''.join(s['do']) + ''.join(s.get('warn', []))) for s in steps)
    gaps = []
    if not sf or not sf.get('items'): gaps.append('没有安全要求')
    else:
        txt = ''.join(sf['items'])
        if two and not (sf.get('two_person_steps') or re.search(r'两人|两个人', txt)): gaps.append('说明书第 ' + '、'.join(two) + ' 步需要两人，安全要求里没写')
        if tip and not (sf.get('anti_tip') or re.search(r'倾倒|墙', txt)): gaps.append('说明书有防倾倒或墙面固定，安全要求里没写')
        if two and not sf.get('two_person_steps'): gaps.append('没有逐步列出需要两人的步骤（说明书图示涉及第 ' + '、'.join(two) + ' 步）')
    K.append(C('1.10', '必需', 'fail' if gaps else 'pass', '安全要求', '；'.join(gaps) + '。' if gaps else f'{len(sf["items"])} 条。两人操作：' + ('第 ' + '、'.join(sf.get('two_person_steps') or []) + ' 步' if sf.get('two_person_steps') else '见条目') + '；防倾倒：' + ('要求墙面固定' if sf.get('anti_tip') else '不需要（' + (sf.get('anti_tip_note') or '无') + '）') + ('；承重：' + '、'.join(sf['load_limits']) if sf.get('load_limits') else '') + '。',
               '安全提醒必须来自厂家，平台不能自己推断。', '写明需要两人的步骤、防倾倒固定方法、承重限制。'))
    for k, t, lvl in [('photos', '实物照片', '建议'), ('faq', '客服常见问题', '建议'), ('terms', '术语与俗称', '建议'), ('est_min', '每步预计用时', '可选')]:
        K.append(C('1.11.' + k, lvl, 'pass' if P['optional'].get(k) else 'warn', t, '已提供。' if P['optional'].get(k) else '没有提供。'))
    return gate(K, 1)

# ---------------- stage 2: steps and parts ----------------
def recon(P, steps):
    """steps × repeats per parts list, compared with the client's parts list"""
    lists = defaultdict(dict)
    for r in P['_parts'] or []: lists[r['list']][r['code']] = lists[r['list']].get(r['code'], 0) + int(r['qty'])
    alts = P.get('alternatives') or []
    skip, extra = set(), {}
    for a in alts:  # count the first path; a code used only on the other path is counted from that path
        prim = set(a['steps'][0].split('+'))
        pc = {c for s in steps if s['id'] in prim for c, q in s['parts']}
        for alt in a['steps'][1:]:
            for sid in alt.split('+'):
                skip.add(sid); extra[sid] = pc
    rows = []
    for u in P['units']:
        if u['list'] == '*': L = defaultdict(int); [L.__setitem__(c, L[c] + q) for m in lists.values() for c, q in m.items()]
        else: L = lists.get(u['list'], {})
        used = defaultdict(int); per = defaultdict(list)
        for s in steps:
            if u['steps'] != '*' and not s['id'].startswith(u['steps']): continue
            mult = u['repeat'].get(s['id'], 1) if isinstance(u['repeat'], dict) else 1
            for c, q in s['parts']:
                if s['id'] in skip and c in extra[s['id']]: continue
                used[c] += q * mult; per[c].append(f'{s["id"]}:{q}{"×" + str(mult) if mult > 1 else ""}')
        for c in sorted(set(L) | set(used)):
            rows.append({'list': u['list'], 'code': c, 'listed': L.get(c, 0), 'used': used.get(c, 0), 'steps': per.get(c, []), 'unit_repeat': u['repeat'] if not isinstance(u['repeat'], dict) else None})
    return rows

def questions(P, steps):
    Q = []
    def q(id, step, kind, text, suggest, basis): Q.append(dict(id=id, step=step, kind=kind, q=text, suggest=suggest, basis=basis))
    for u in P['units']:
        if isinstance(u['repeat'], int) and u['repeat'] > 1:
            q(f'rep-{u["steps"]}', None, '重复次数', f'“{u["list"]}”这部分一共做几次？', f'{u["repeat"]} 次', '按产品组合推断')
        if isinstance(u['repeat'], dict) and u['repeat']:
            ids = sorted(u['repeat'], key=lambda x: int(re.sub(r'\D', '', x) or 0)); n = list(u['repeat'].values())[0]
            q('rep-' + ids[0], ids[0], '重复次数', f'第 {ids[0]}–{ids[-1]} 步要重复几次？', f'{n} 次', '说明书图示的数量')
    for a in P.get('alternatives') or []:
        q('alt-' + a['steps'][0], a['steps'][0], '分支', f'第 {" / ".join(a["steps"])} 步是二选一吗？（{a["note"]}）', '是，二选一，用户按现场情况选', '说明书图示')
    for s in steps:
        for i, u in enumerate(s.get('unsure', [])):
            q(f'u-{s["id"]}-{i+1}', s['id'], '说明书未明确', f'第 {s["id"]} 步：{u} 请确认或更正。', '确认，按目前的处理', '引擎从图示推断')
        txt = ''.join(s['do']) + ''.join(s.get('warn', []))
        OR = r'朝(上|下|外|内|前|后|左|右|墙)|正反|反面|内面|外面|毛边|缺口|左右|内外|CL|CR|有孔的面|带孔的一面'
        sent = [x for x in re.split(r'(?<=[。；])', txt) if re.search(OR, x)]
        if sent and not any(x['step'] == s['id'] and x['kind'] == '朝向' for x in Q):
            q(f'o-{s["id"]}', s['id'], '朝向', f'第 {s["id"]} 步的朝向这样写对吗？“{"".join(dict.fromkeys(sent)).strip()}”', '对', '说明书图示')
        if re.search(r'两人|两个人', s['title'] + txt):
            q(f'two-{s["id"]}', s['id'], '两人操作', f'第 {s["id"]} 步需要两个人吗？', '需要', '说明书两人图示')
    return Q

def stage2(P, steps, answers, preview):
    K = []
    rows = recon(P, steps)
    diff = [r for r in rows if r['listed'] != r['used']]
    K.append(C('2.1', '必需', 'fail' if diff else 'pass', '零件核对：每步用量 × 重复次数 = 清单数量',
               ('不一致：' + '；'.join(f'{r["code"]}（{r["list"]}）清单 {r["listed"]}，步骤合计 {r["used"]}' for r in diff[:10]) + '。') if diff else f'{len(rows)} 项全部一致，零差异。',
               '有差异说明步骤或清单有一处错了，用户会少零件或多零件。', '核对有差异的编号：步骤里的数量、重复次数或清单数量。'))
    bad = [s['id'] for s in steps if not s.get('do') or s.get('parts') is None]
    K.append(C('2.2', '必需', 'fail' if bad else 'pass', '每一步都有“做什么”和“用哪些零件”', f'缺内容的步骤：{"、".join(bad)}。' if bad else f'{len(steps)} 步都有。'))
    order_bad = []
    last = {}
    for s in steps:
        src = s.get('src', '_'); pg = s.get('page', 0)
        if src in last and pg < last[src][1]: order_bad.append(s['id'])
        last[src] = (s['id'], pg)
    K.append(C('2.3', '必需', 'fail' if order_bad else 'pass', '步骤顺序与说明书一致', f'页码倒退的步骤：{"、".join(order_bad)}。' if order_bad else '每份说明书内页码顺序递增。'))
    Q = questions(P, steps)
    ans = answers or {}
    open_q = [x for x in Q if x['id'] not in ans]
    contra = [x for x in Q if x['id'] in ans and ans[x['id']].get('status') == 'contradicts']
    K.append(C('2.4', '必需', 'todo' if open_q else 'pass', '待确认问题全部有答案', f'{len(Q)} 个问题，{len(open_q)} 个还没有回答。' if open_q else f'{len(Q)} 个问题都已回答。',
               '说明书没写清的地方，必须由厂家确认，不能带着推断进入建模。', '在门户的“待确认问题”里逐条确认或修改。'))
    if contra: K.append(C('2.5', '必需', 'fail', '客户答案与说明书图示不矛盾', '矛盾：' + '、'.join(x['id'] for x in contra)))
    unsure = [s['id'] for s in steps if s.get('unsure')]
    K.append(C('2.6', '必需', 'pass' if not open_q else 'todo', '推断内容已全部确认', f'{len(unsure)} 步含推断内容：{"、".join(unsure)}。确认后转为“已确认”。' if unsure and open_q else '没有未确认的推断。'))
    r = gate(K, 2, preview)
    r['recon'] = rows; r['questions'] = Q
    return r

# ---------------- stage 3: model and animation ----------------
def stage3(P, auto, signoff, preview):
    """auto comes from stage3.js: per step storyboard frames and runtime checks on the animation"""
    K = []
    steps = auto['steps']
    def agg(key, title, why, fix, level='必需'):
        bad = [s for s in steps if s['checks'].get(key, {}).get('ok') is False]
        det = '；'.join(f'第 {s["id"]} 步：{s["checks"][key].get("note","")}' for s in bad[:12])
        K.append(C('3.' + key, level, ('fail' if level == '必需' else 'warn') if bad else 'pass', title, (f'{len(bad)} 步有问题。' + det) if bad else f'{len(steps)} 步全部通过。', why, fix))
    agg('parts', '说明书里每步的零件都在动画里出现', '动画少了零件，用户会以为这一步不用它。', '在动画里补上这个零件和它的动作。')
    agg('holes', '每个紧固件落点处都有孔', '紧固件必须装进孔里，孔在正确的面上。', '在落点所在的板件上补孔，或修正落点坐标。')
    agg('float', '零件装好后贴着板件，不悬空', '悬空说明落点或模型尺寸有错。', '修正落点坐标或板件尺寸。')
    agg('order', '大件到位后才上紧固件', '整体还在移动时拧紧固件，与说明书不符。', '把紧固件的动作移到大件停稳之后。', '建议')
    agg('labels', '每种零件标一次且带编号', '标签太多会乱，没编号用户说不出是哪个。', '去掉重复标签，补编号。')
    agg('visible', '画面里能看到这一步的零件', '镜头没对准，用户会说“什么都看不到”。', '调整这一步的镜头。')
    alt = [x for a in (P.get('alternatives') or []) for x in a['steps'][1:]]
    if alt: K.append(C('3.alt', '可选', 'na', '分支步骤说明', '第 ' + '、'.join(alt) + ' 步是二选一里不走的那条路，动画演示完会把零件收回，所以落点和孔位检查对它们只作参考。'))
    K.append(C('3.ai', '必需', 'todo', '独立 AI 对照说明书逐步审核', '这一版还没接入独立审核（需要调用 AI 服务看说明书图和分镜图）。', '自动检查只看得到几何问题，看不出方向、顺序是否和图示一致。', '接入后自动运行。'))
    so = signoff or {}
    left = [s['id'] for s in steps if (so.get(s['id']) or {}).get('status') != 'ok']
    probs = [s['id'] for s in steps if (so.get(s['id']) or {}).get('status') == 'issue']
    K.append(C('3.sign', '必需', 'fail' if probs else ('todo' if left else 'pass'), '客户逐步确认分镜图',
               (f'客户标了问题：第 {"、".join(probs)} 步。' if probs else '') + (f'还有 {len(left)} 步没确认。' if left else '全部确认。'),
               '动画是否忠实于说明书，最终要由厂家确认。', '在门户的“分镜确认”里逐步看开始、中间、结束三张图，确认或写下问题。'))
    r = gate(K, 3, preview)
    r['frames'] = [{'id': s['id'], 'title': s['title'], 'frames': s['frames']} for s in steps]
    return r

def run(pkg_dir, out_dir, auto=None):
    P = load(pkg_dir)
    steps = json.load(open(os.path.join(pkg_dir, 'steps.draft.json'), encoding='utf8'))
    rj = lambda f: json.load(open(os.path.join(pkg_dir, f), encoding='utf8')) if os.path.exists(os.path.join(pkg_dir, f)) else None
    r1 = stage1(P, steps)
    pre = r1['gate'] != '通过'
    r2 = stage2(P, steps, rj('answers.json'), pre)
    r3 = stage3(P, auto, rj('signoff.json'), pre or r2['gate'] != '通过') if auto else None
    os.makedirs(out_dir, exist_ok=True)
    rep = {'product': P['name'], 'slug': P['slug'], 'site': P.get('site', P['slug']), 'answers': rj('answers.json') or {}, 'signoff': rj('signoff.json') or {}, 'package_zip': P.get('package_zip'), 'entry': P['entry'], 'manuals': [{k: m[k] for k in ('doc', 'title', 'pages')} for m in P['manuals']], 'note': P.get('note'),
           'stages': [r1, r2] + ([r3] if r3 else []), 'steps': [{'id': s['id'], 'label': s.get('label'), 'title': s['title'], 'do': s['do'], 'parts': s['parts'], 'page': s.get('page')} for s in steps]}
    json.dump(rep, open(os.path.join(out_dir, 'report.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    return rep

if __name__ == '__main__':
    import sys
    pk, out = sys.argv[1], sys.argv[2]; auto = json.load(open(sys.argv[3], encoding='utf8')) if len(sys.argv) > 3 else None
    r = run(pk, out, auto)
    for s in r['stages']: print(r['slug'], '阶段', s['stage'], s['gate'], '(预审)' if s['preview'] else '', s['counts'])
