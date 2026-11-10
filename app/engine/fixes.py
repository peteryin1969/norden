"""AI-assisted fixes for review findings. Three tiers:
1 改稿: the engine (or the AI in the portal) writes the corrected text; the client's data owner accepts or returns it.
2 起草: a draft from the manual's own content, each item with its basis; the client's technical person checks and signs.
3 待填: facts only the client has (sizes, specs, safety, authorization). Never guessed: a form to fill, nothing more.
Accepted fixes (fixes.json, exported from the portal) are applied to the data and every affected check runs again. Each applied fix is kept on record."""
import re, hashlib

def hid(*a): return hashlib.md5('|'.join(map(str, a)).encode()).hexdigest()[:8]
def names_for(t, cells):
    def rep(m):
        a = m.group(1)
        for c in cells:
            if c['code'] == a or a in c['code'].split('/') or c['code'] == m.group(0).strip(): return c['name']
        return m.group(0)
    return re.sub(r'\s*(\d{5,})(?:/\d{5,})?\s*', rep, t)

def apply(P, steps, gen, fixes):
    """overlay accepted fixes; returns the record of what was applied"""
    done = []
    for fid, f in (fixes or {}).items():
        if f.get('status') != 'accepted' or not f.get('after'): continue
        k = f.get('kind'); t = f.get('target') or {}
        if k == 'narration' and gen: gen['narration'][t['step']] = f['after']
        elif k == 'qa' and gen: gen['faq'].setdefault(t['step'], []).append({'k': [['注意', '小心', '当心', '要紧', '危险'] if t.get('warn') else [t.get('kw', '')]], 'q': [t.get('q', '这一步要注意什么')], 'a': f['after']})
        elif k == 'safety2':
            sf = P.get('_safety') or {}; sf.setdefault('two_person_steps', [])
            if t['step'] not in sf['two_person_steps']: sf['two_person_steps'].append(t['step']); sf.setdefault('items', []).append(f['after'])
            P['_safety'] = sf
        else: continue
        done.append({'id': fid, 'kind': k, 'target': t, 'after': f['after'], 'by': f.get('by', ''), 'at': f.get('at', '')})
    return done

def propose(P, steps, gen, stages):
    """attach fix proposals to the checks that did not pass"""
    cells = (gen or {}).get('cells') or []; byid = {s['id']: s for s in steps}
    for st in stages:
        raw = st.pop('_raw', {}) if isinstance(st, dict) else {}
        for c in st['checks']:
            if c['status'] == 'pass': continue
            F = None
            if c['id'] == '4.1' and gen:
                items = [{'id': 'nar-' + i, 'kind': 'narration', 'target': {'step': i}, 'label': f'第 {i} 步讲解', 'before': gen['narration'].get(i, ''), 'after': names_for(gen['narration'].get(i, ''), cells), 'basis': '把零件编号换成零件清单里的名称，其余不动'} for i in raw.get('codes', [])]
                items += [{'id': 'nar-' + i, 'kind': 'narration', 'target': {'step': i}, 'label': f'第 {i} 步讲解', 'before': '（没有讲解）', 'after': names_for(''.join(byid[i]['do']), cells), 'basis': '用已确认的步骤文字，编号换成名称', 'ai': '把这段步骤文字改写成口语讲解：短句、大白话，零件只说名称不说编号，不增加原文没有的信息。'} for i in raw.get('miss', [])]
                for it in items: it.setdefault('ai', '把这段讲解改得更口语：短句、大白话，每句不超过 15 个字，零件只说名称不说编号，不增加原文没有的信息，不改数量和方向。')
                F = {'tier': 1, 'title': 'AI 改稿：讲解里的零件编号换成名称', 'who': '客户的资料负责人', 'items': items}
            elif c['id'] == '4.2' and gen:
                by = {}
                skip = set(raw.get('codes', [])) | set(raw.get('miss', []))  # those steps get their names from the 4.1 fix
                for i, n in raw.get('unnamed', []):
                    if i not in skip: by.setdefault(i, []).append(n)
                F = {'tier': 1, 'title': 'AI 改稿：讲解里补上用到的五金', 'who': '客户的资料负责人', 'items': [{'id': 'nar-' + i, 'kind': 'narration', 'target': {'step': i}, 'label': f'第 {i} 步讲解', 'before': gen['narration'].get(i, ''), 'after': gen['narration'].get(i, '').rstrip() + '这一步用' + '、'.join(ns) + '。', 'basis': '步骤数据里这一步的零件', 'ai': '把“这一步用到的零件名”自然地融进这段讲解里，其余意思不变，不增加别的信息。'} for i, ns in by.items()]}
            elif c['id'] == '4.3' and gen:
                items = [{'id': 'qa-' + i + '-' + hid(w), 'kind': 'qa', 'target': {'step': i, 'warn': True}, 'label': f'第 {i} 步新增问答：这一步要注意什么', 'before': '（没有对应问答）', 'after': names_for(w, cells), 'basis': '说明书这一步的注意事项原文'} for i, w in raw.get('unc', [])]
                items += [{'id': 'qa-all-' + hid(w), 'kind': 'qa', 'target': {'step': '*', 'kw': re.sub(r'[，。：；].*', '', w)[:6], 'q': w[:14] + '吗'}, 'label': '新增通用问答', 'before': '（没有对应问答）', 'after': w, 'basis': '客户的安全要求原文'} for w in raw.get('uns', [])]
                F = {'tier': 1, 'title': 'AI 改稿：为没覆盖的注意事项和安全要求各加一条问答', 'who': '客户的资料负责人', 'items': items}
            elif c['id'] == '1.10':
                two = sorted({s['id'] for s in steps if re.search(r'两人|两个人|二人', s['title'] + ''.join(s['do']) + ''.join(s.get('warn', [])))})
                have = (P.get('_safety') or {}).get('two_person_steps') or []
                items = [{'id': 'safe2-' + i, 'kind': 'safety2', 'target': {'step': i}, 'label': f'安全要求新增一条', 'before': '（没有列出）', 'after': f'第 {i} 步（{byid[i]["title"]}）必须两人操作。', 'basis': f'说明书第 {i} 步的两人图示和文字：' + ''.join(byid[i]['do'])[:40]} for i in two if i not in have]
                if items: F = {'tier': 2, 'title': 'AI 起草：按说明书补上需要两人的步骤', 'who': '客户的技术或安全负责人（逐条核对后签字）', 'items': items}
            elif c['id'] in ('1.6', '1.7', '1.5', '1.8'):
                if c['id'] == '1.6': rows = [['板件', '长（毫米）', '宽（毫米）', '厚（毫米）']] + [[r['part'], r['length_mm'], r['width_mm'], r['thickness_mm']] for r in (P['_dims'] or []) if not (r['length_mm'] and r['width_mm'] and r['thickness_mm'])]; fn = '板件尺寸_待填.csv'
                elif c['id'] == '1.5': rows = [['项目', '宽（毫米）', '深（毫米）', '高（毫米）', '数据来源'], ['产品外形', '', '', '', '']]; fn = '外形尺寸_待填.csv'
                else: rows = [['编号', '名称', '长度（毫米）', '直径（毫米）', '头型', '材质']] + [[r['code'], r['name'], r['length_mm'], r['diameter_mm'], r['head'], r['material']] for r in (P['_hw'] or []) if r['type'] in ('螺丝', '螺栓', '木销', '钉子', '连接件') and not (r['length_mm'] and r['diameter_mm'])]; fn = '五金规格_待填.csv'
                F = {'tier': 3, 'title': '待填表格：这些数据只有厂家有，AI 不代填', 'who': '客户的设计或采购部门', 'form': {'name': fn, 'rows': rows}, 'hint': {'1.6': '数据在产品图纸或板件下料清单里。', '1.5': '数据在产品规格书里。'}.get(c['id'], '数据在五金供应商的规格书或采购清单里。')}
            if F and (F.get('items') or F.get('form')): c['fixes'] = F
