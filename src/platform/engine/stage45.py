"""Stages 4 (voice and Q&A) and 5 (trial run and release) of the platform engine, entry A.
Stage 4 reviews what the engine generated for the assistant (step narration, Q&A, part numbers, hotwords, photo angles) against the confirmed step data
and the client's own inputs (FAQ, terms, banned phrases), and replays real recordings or logs.
Stage 5 records the AI test rounds, the testers' acceptance, the QR code and the client's release approval."""
import json, os, re, datetime
from engine import C, gate

def bigr(a, b):
    a = re.sub(r'[^一-鿿\w]', '', a); b = re.sub(r'[^一-鿿\w]', '', b)
    A = {a[i:i + 2] for i in range(len(a) - 1)}; B = {b[i:i + 2] for i in range(len(b) - 1)}
    return len(A & B) / len(A) if A else 0

def photo_hints(s, cells):
    big = [cells[c]['name'] for c, q in s['parts'] if c in cells]
    H = ['离远一点拍整体，能看到这一步装好的部分']
    if big: H.append('近拍' + '和'.join(big[:2]) + '装好的位置')
    H.append('从另一侧或上方再拍一张')
    if re.search(r'朝|方向|正反|缺口|左右|内外|上下', ''.join(s.get('warn', [])) + ''.join(s['do'])): H.append('拍清楚朝向')
    return H

SAFEW = ['两人', '一人', '翻', '软垫', '墙', '倾倒', '承重', '方向', '朝', '支撑腿', '桌板', '长板', '端板', '沉孔', '抽屉', '电钻', '孩子', '儿童', '电视']
def names_all(gen): return [c['name'] for c in gen['cells']]
CMDS = ['下一步', '上一步', '再说一遍', '放大', '缩小', '复位', '返回原图', '往左转', '往右转', '逆时针', '顺时针', '从上面看', '长什么样', '标出来', '没有了', '还有吗', '别问了', '检查', '跳过']

def numbers_from(auto):
    M = {}
    for s in (auto or {}).get('steps', []):
        for l in (s.get('checks', {}).get('labels', {}) or {}).get('list', []):
            m = re.match(r'(?:[左右上下前后] · )?(\d+)号 ([^×]+?)(?: × \d+)?$', l.strip())
            if m: M.setdefault(re.sub(r'\s+C[LR]$', '', m.group(2).strip().replace('（', '(').split('(')[0]), set()).add(int(m.group(1)))
    return M

def stage4(P, steps, gen, tests, auto, preview):
    K = []; cells = {c['code']: c for c in gen['cells']}
    nar, faq = gen['narration'], gen['faq']
    RAW = {'unnamed': []}
    miss = [s['id'] for s in steps if not nar.get(s['id'])]
    codes = [s['id'] for s in steps if re.search(r'\d{5,}', nar.get(s['id'], ''))]; RAW['codes'] = codes; RAW['miss'] = miss
    K.append(C('4.1', '必需', 'fail' if miss or codes else 'pass', '每步都有讲解，且不读零件编号', (f'没有讲解：第 {"、".join(miss)} 步。' if miss else f'{len(steps)} 步都有讲解。') + (f'讲解里读了零件编号：第 {"、".join(codes)} 步。' if codes else ''),
               '用户看不懂编号，讲解只能说零件名称。', '补上缺的讲解，把编号换成零件名称。'))
    unnamed = []
    for s in steps:
        t = nar.get(s['id'], '')
        for c, q in s['parts']:
            n = cells.get(c, {}).get('name', '')
            stems = [n] + [x for x in ['木销', '螺丝', '螺栓', '横销', '钢条', '铰链', '脚垫', '止动垫'] if x in n] + [v for k, vs in faq.get('syn', {}).items() if k in n for v in vs]
            if n and not any(x in t for x in stems): unnamed.append(f'第 {s["id"]} 步的{n}'); RAW['unnamed'].append((s['id'], n))
    K.append(C('4.2', '建议', 'warn' if unnamed else 'pass', '讲解提到这一步用的每种五金', '没提到：' + '、'.join(unnamed) + '。' if unnamed else '每步讲解都提到了用到的五金。', '用户听讲解就知道拿哪个零件。', '在讲解里加一句零件名称。'))
    ans = [(k, e['a']) for k, v in faq.items() if k != 'syn' for e in v]
    qa = {}
    for k, v in faq.items():
        if k != 'syn': qa[k] = ' '.join((e.get('q') or [''])[0] + ' ' + e['a'] for e in v)
    vocab = set(names_all(gen)) | set(faq.get('syn', {}).keys()) | set(SAFEW)
    def kw(t):
        t = t.replace('两个人', '两人').replace('一个人', '一人')
        return {w for w in vocab if w in t}
    def covered(w, texts):
        from fixes import names_for
        w = names_for(w, gen['cells'])  # the assistant says part names, so compare by name
        if any(w.rstrip('。') in t for t in texts): return True
        k = kw(w)
        if not k: return any(bigr(w, t) >= .3 for t in texts)
        return any(len(k & kw(t)) >= max(1, round(.6 * len(k))) for t in texts)
    nwarn = [(s['id'], w) for s in steps for w in s.get('warn', [])]
    RAW['unc'] = [(i, w) for i, w in nwarn if not covered(w, [qa.get(i, ''), qa.get('*', ''), nar.get(i, '')])]
    unc = [f'第 {i} 步：{w}' for i, w in RAW['unc']]
    saf = (P.get('_safety') or {}).get('items', [])
    uns = [x for x in saf if not covered(x, list(qa.values()) + list(nar.values()))]; RAW['uns'] = uns
    K.append(C('4.3', '必需', 'fail' if unc or uns else 'pass', '每条注意事项和安全要求都有问答或讲解覆盖',
               (f'{len(nwarn)} 条注意事项、{len(saf)} 条安全要求都有覆盖。' if not unc and not uns else '') + ('没覆盖的注意事项：' + '；'.join(x.rstrip('。') for x in unc) + '。' if unc else '') + ('没覆盖的安全要求：' + '；'.join(x.rstrip('。') for x in uns) + '。' if uns else ''),
               '用户问到安全问题时，助手必须能用厂家的原话回答。', '为这些条目各加一条问答。'))
    var = {}
    for k, vs in faq.get('syn', {}).items():
        for v in vs: var.setdefault(v, set()).add(k)
    for r in gen.get('terms', []):
        for v in r['common']: var.setdefault(v, set()).add(r['official'])
    multi = {v: sorted(k) for v, k in var.items() if len(k) > 1}
    names = [c['name'] for c in gen['cells']]
    stem = {}
    for st in ['木销', '螺丝', '螺栓', '锁扣', '凸轮锁', '支架', '垫']:
        hit = [n for n in names if n.endswith(st) or n == st]
        if len(hit) > 1 and st not in names: stem[st] = hit
    K.append(C('4.4', '必需', 'fail' if multi else ('warn' if stem else 'pass'), '术语和俗称没有一词多指',
               ('一个说法指向多个零件：' + '；'.join(f'“{v}”→{"、".join(k)}' for v, k in multi.items()) + '。' if multi else '俗称和误听对照没有冲突。') + ('用户只说' + '、'.join(f'“{k}”（可能是{"或".join(v)}）' for k, v in stem.items()) + '时，助手要先问是哪一种。' if stem else ''),
               '一个词指向两个零件，助手就会拿错。', '去掉冲突的叫法，或在问答里写明要先问清楚。'))
    hot = sorted({w for w in names + list(faq.get('syn', {}).keys()) + CMDS + [r['official'] for r in gen.get('terms', [])] if re.fullmatch(r'[一-鿿]{2,7}', w)})
    badh = [w for w in names if not re.fullmatch(r'[一-鿿]{1,7}', w)]
    K.append(C('4.5', '必需', 'pass' if hot else 'fail', '语音识别热词表符合格式', f'{len(hot)} 个热词，全是 2–7 个汉字。' + (f'这些零件名不能直接做热词，已跳过：{"、".join(badh)}。' if badh else ''),
               '讯飞等识别服务只接受短的中文热词。', '零件名改用不超过 7 个汉字的叫法。'))
    banned = gen.get('banned', [])
    hits = []
    for b in banned:
        rx = re.compile(b['pattern'])
        for i, t in nar.items():
            if rx.search(t): hits.append(f'讲解第 {i} 步：{b["rule"]}')
        for k, a in ans:
            if rx.search(a): hits.append(f'问答（{k}）：{b["rule"]}')
    K.append(C('4.6', '必需', 'fail' if hits else 'pass', '没有用到禁止的说法', ('；'.join(hits[:8]) + '。') if hits else (f'按客户的 {len(banned)} 条禁用规则检查，讲解和问答都没有用到。' if banned else '客户没有提供禁用说法。'),
               '厂家不允许的说法（比如承诺承重数值）不能出现在助手的话里。', '改写这些句子。'))
    nums = numbers_from(auto)
    dup = {n: sorted(v) for n, v in nums.items() if len(v) > 1}
    byn = {}
    for n, v in nums.items():
        for x in v: byn.setdefault(x, set()).add(n)
    clash = {x: sorted(v) for x, v in byn.items() if len(v) > 1}
    unnum = [c['name'] for c in gen['cells'] if c['name'] not in nums]
    K.append(C('4.7', '必需', 'fail' if dup or clash else 'pass', '零件编号一号一件', (f'{len(nums)} 种零件有编号，一号对一件。' if not dup and not clash else '') + ('同一零件有两个编号：' + '；'.join(f'{n} {v}' for n, v in dup.items()) + '。' if dup else '') + ('同一编号给了两种零件：' + '；'.join(f'{x}号 {"、".join(v)}' for x, v in clash.items()) + '。' if clash else '') + (f'画面上没出现编号的五金：{"、".join(unnum)}（例如工具，可以接受）。' if unnum else ''),
               '用户说“几号”时必须只对应一个零件。', '修正重复的编号。'))
    ph = {s['id']: photo_hints(s, cells) for s in steps}
    K.append(C('4.8', '必需', 'pass' if all(len(v) >= 2 for v in ph.values()) else 'fail', '每步有拍照检查的拍摄角度', f'{len(ph)} 步，每步 {min(len(v) for v in ph.values())}–{max(len(v) for v in ph.values())} 个角度。'))
    rp = (tests or {}).get('replay')
    thr = (P.get('stage4') or {}).get('replay_threshold', .95)
    if not rp: K.append(C('4.9', '必需', 'todo', '录音或使用记录回放', '还没有回放结果。', '用真实说法测试本地指令识别，避免现场听不懂。', '提供真实录音或以往的使用记录，平台回放。'))
    else:
        rate = rp['pass'] / rp['total']
        K.append(C('4.9', '必需', 'pass' if rate >= thr else 'fail', '录音或使用记录回放', f'回放{rp["source"]}，{rp["total"]} 项检查通过 {rp["pass"]} 项（{rate:.0%}），约定标准 {thr:.0%}。',
                   '用真实说法测试本地指令识别，避免现场听不懂。', '把识别错的说法加进俗称表或热词，再回放。'))
    r = gate(K, 4, preview)
    r['_raw'] = RAW
    r['generated'] = {'narration': len(nar), 'faq': len(ans), 'numbers': len(nums), 'hotwords': len(hot), 'hotword_sample': hot[:24], 'photo': {k: v for k, v in list(ph.items())[:3]}}
    return r

def stage5(P, prior, tests, auto, pkg_dir, out_dir, preview):
    K = []
    rj = lambda f: json.load(open(os.path.join(pkg_dir, f), encoding='utf8')) if os.path.exists(os.path.join(pkg_dir, f)) else None
    T = (tests or {}).get('suites', {})
    ok = lambda names: [n for n in names if n in T and T[n]['pass'] == T[n]['total']]
    # A. AI internal test round
    data_ok = all(s['gate'] == '通过' or (s['stage'] == 3 and all(c['status'] in ('pass', 'warn', 'na') or c['id'] == '3.ai' for c in s['checks'])) for s in prior)
    K.append(C('5.A1', '必需', 'pass' if data_ok else 'fail', 'AI 测试 · 资料一致性复核', '阶段 1–4 的核对全部重跑，结果见上。' if data_ok else '前面阶段还有没通过的项。'))
    rend = auto and not auto.get('errors') and all(all(v.get('ok') is not False for k, v in s['checks'].items() if k != 'order') for s in auto['steps'])
    K.append(C('5.A2', '必需', 'pass' if rend else 'fail', 'AI 测试 · 渲染测试', f'{len(auto["steps"]) if auto else 0} 步各截 3 张图，页面无报错，零件不缺、不悬空，紧固件都在孔上。' if rend else '渲染检查有问题，见阶段 3。'))
    ai = rj('ai_review.json')
    sev = [x for st in (ai or {}).get('steps', {}).values() for x in st.get('issues', []) if x.get('severity') == '严重'] if ai else None
    K.append(C('5.A3', '必需', 'todo' if ai is None else ('fail' if sev else 'pass'), 'AI 测试 · 动画对照审核（独立 AI）',
               '还没运行。在门户的阶段 3 点“运行独立 AI 审核”。' if ai is None else (f'独立 AI 逐步对照说明书：{len(sev)} 个严重问题。' if sev else f'独立 AI 逐步对照说明书，{len(ai.get("steps", {}))} 步没有严重问题。'),
               '动画方向、顺序是否和说明书一致，几何检查看不出来。', '在门户里运行；有严重问题就修正动画再重跑。'))
    user = ['ts13', 'ts16', 'ts19', 'ts20', 'ts24', 'ts27']
    got = ok(user); have = [n for n in user if n in T]
    K.append(C('5.A4', '必需', 'pass' if have and len(got) == len(have) else ('todo' if not have else 'fail'), 'AI 测试 · 模拟用户测试',
               f'脚本化用户走完全程：提问、打断、说错零件名、拒绝拍照、提改进建议等，{len(have)} 组测试 ' + '、'.join(f'{n} {T[n]["pass"]}/{T[n]["total"]}' for n in have) + '。' if have else '还没运行。'))
    ph = rj('ai_photo.json')
    mock = ok(['ts25'])
    if ph is None: st, det = 'todo', ('拍照流程的脚本测试已通过（ts25，用模拟回复）。' if mock else '') + '用真实 AI 判断“装对”和“故意装错”的图片还没运行：点右边的“进入拍照检查测试”。'
    else:
        _d = ph.get('dispositions') or {}
        wrong = [x for i, x in enumerate(ph.get('cases', [])) if x['got'] != 'unsure' and x['expect'] != x['got'] and not ((_d.get(f'p:{i}') or {}).get('status') == 'false' and len(((_d.get(f'p:{i}') or {}).get('text') or '').strip()) >= 4)]
        st = 'pass' if not wrong and ph.get('cases') else 'fail'
        det = ('（模拟结果，没有调用真实 AI）' if ph.get('simulated') else '') + f'{len(ph.get("cases", []))} 张图，判对 {len(ph.get("cases", [])) - len(wrong)} 张。' + ('判错：' + '；'.join(f'第 {x["step"]} 步 {x["kind"]}' for x in wrong) + '。' if wrong else '装错的都识别出来了，装对的没有误判。')
    K.append(C('5.A5', '必需', st, 'AI 测试 · 拍照检查测试', det, '拍照检查要能认出装错，又不能把装对的判成错。', '在门户里运行；判错的步骤调整拍摄角度提示或审核规则。'))
    allt = [n for n in T]; bad = [n for n in allt if T[n]['pass'] != T[n]['total']]
    K.append(C('5.A6', '必需', 'pass' if allt and not bad else ('todo' if not allt else 'fail'), 'AI 测试 · 回归测试', (f'{len(allt)} 组已有测试全部重跑通过，共 {sum(T[n]["total"] for n in allt)} 项。' if not bad else '没通过：' + '、'.join(bad) + '。') if allt else '还没运行。'))
    # B. testers
    tr = rj('testers.json')
    if not tr:
        K.append(C('5.B', '必需', 'todo', '专职测试人员验收', '还没有测试记录。', '真人用真实零件装一遍，才能发现模型和说法上的问题。', '安排 1 名专职测试员和至少 3 名没接触过产品的试装者，按规程测试，记录自动上传。'))
    else:
        nov = [t for t in tr['testers'] if t['role'] == '试装者']; staff = [t for t in tr['testers'] if t['role'] == '专职测试员']
        probs = []
        if len(nov) < 3: probs.append(f'试装者只有 {len(nov)} 人，至少要 3 人')
        if not staff: probs.append('没有专职测试员')
        nd = [t['name'] for t in nov if not t.get('completed_alone')]
        if nd: probs.append('没有独立完成：' + '、'.join(nd))
        miss_ph = [t['name'] for t in tr['testers'] if t.get('photo_checks', 0) < tr.get('steps', 0)]
        if miss_ph: probs.append('没有每步都做拍照检查：' + '、'.join(miss_ph))
        sev_open = [i for i in tr.get('issues', []) if i['severity'] == '严重' and not i.get('closed')]
        gen_open = [i for i in tr.get('issues', []) if i['severity'] == '一般' and not i.get('closed') and not i.get('recorded')]
        if sev_open: probs.append(f'{len(sev_open)} 个严重问题没关闭')
        if gen_open: probs.append(f'{len(gen_open)} 个一般问题既没修复也没记录在案')
        if not all(t.get('signed') for t in staff): probs.append('专职测试员没签字')
        n_iss = {s: sum(1 for i in tr.get('issues', []) if i['severity'] == s) for s in ('严重', '一般', '轻微')}
        K.append(C('5.B', '必需', 'fail' if probs else 'pass', '专职测试人员验收', ('；'.join(probs) + '。') if probs else f'{len(staff)} 名专职测试员、{len(nov)} 名试装者，都独立装完，每步都做了拍照检查；发现问题 严重 {n_iss["严重"]}、一般 {n_iss["一般"]}、轻微 {n_iss["轻微"]}，严重和一般问题都已关闭或记录在案；测试员已签字。' + ('（模拟记录）' if tr.get('simulated') else ''),
                   '这是发布前最后一道真人检查。', '补齐人数和记录，关闭问题后复测。'))
    # C. QR code
    rel = rj('release.json') or {}
    url = rel.get('url')
    if url:
        import segno
        os.makedirs(out_dir, exist_ok=True); qr = segno.make(url + ('&' if '?' in url else '?') + 'v=' + str(rel.get('version', 1)), error='m'); qr.save(os.path.join(out_dir, 'qr.png'), scale=8, border=2)
    K.append(C('5.C', '必需', 'pass' if url and rel.get('qr_location') else 'todo', '二维码', f'已生成，指向第 {rel.get("version", 1)} 版，印在：{rel.get("qr_location")}。' if url and rel.get('qr_location') else '还没定二维码位置。', '用户扫码直接打开对应版本的装配助手。', '选择二维码印在哪里。'))
    # D. approval
    before = all(c['status'] == 'pass' for c in K)
    ap = rel.get('approved_by')
    K.append(C('5.D', '必需', 'pass' if ap and before else 'todo', '客户批准发布', (f'{ap} 于 {rel.get("approved_at")} 批准发布。' + ('（模拟）' if rel.get('simulated') else '')) if ap and before else ('上面各项全部通过后才能批准。' if not before else '等客户批准。')))
    r = gate(K, 5, preview)
    r['qr'] = 'qr.png' if url else None; r['url'] = url
    r['approval'] = {'by': ap, 'at': rel.get('approved_at'), 'simulated': rel.get('simulated')} if ap else None; r['qr_location'] = rel.get('qr_location')
    r['photo_cases'] = [{'step': s_['id'], 'title': s_['title']} for s_ in (auto or {}).get('steps', []) if s_['id'] in ((P.get('stage5') or {}).get('photo_steps') or [])]
    return r
