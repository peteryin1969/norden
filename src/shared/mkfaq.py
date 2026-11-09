"""Build faq.json for a product from its audited data: steps.json (parts, warnings), cells.json (grid numbers), FEAT (part descriptions),
plus hand-written general questions. Answers only restate what the step data already says."""
import json, re, sys

CN = '零一二三四五六七八九'
def cn(n):
    n = int(n)
    if n == 2: return '两'
    if n < 10: return CN[n]
    if n < 20: return '十' + (CN[n % 10] if n % 10 else '')
    if n < 100: return CN[n // 10] + '十' + (CN[n % 10] if n % 10 else '')
    return str(n)
def cno(n):
    n = int(n); return '二' if n == 2 else cn(n)
def clean(t, cell, steps):
    lab = {x['id']: x.get('label') or ('第 ' + x['id'] + ' 步') for x in steps}
    t = re.sub(r'\d{5,}(?:/\d{5,})?', lambda m: cell[m.group(0)]['name'] if m.group(0) in cell else (cell.get(m.group(0).split('/')[0]) or {'name': '这个零件'})['name'], t)
    t = re.sub(r'(?<![A-Za-z])([BCDE]\d{1,2}|\d{1,2}w?)(?=[，。；、 ]|$)', lambda m: lab.get(m.group(1), m.group(1)), t) if steps and not steps[0]['id'].isdigit() else t
    t = re.sub(r'\s+(?=[\u4e00-\u9fff])|(?<=[\u4e00-\u9fff])\s+', '', t)
    return t
def mw(name):
    if re.search(r'销|钉|杆|轨', name): return '根' if re.search(r'销|杆|轨', name) else '颗'
    if re.search(r'螺丝|螺栓', name): return '颗'
    if re.search(r'板|片', name): return '块' if '板' in name else '片'
    return '个'
STEMS = ['木销', '锁扣', '凸轮锁', '螺丝', '螺栓', '支架', '盖件', '卡扣']
BASE_SYN = {"起子": ["螺丝起子", "螺丝刀", "改锥", "改刀", "罗丝刀", "螺丝批"], "螺丝": ["罗丝钉", "螺丝钉", "罗丝", "罗斯", "镙丝", "螺钉", "洛丝"],
            "孔": ["窟窿", "眼儿", "洞"], "木销": ["木头棍", "木钉", "木棍", "木棒", "木塞", "销子", "木削", "木消", "木萧", "木肖"],
            "连接件": ["联接件", "连接剑", "连接键", "连结件", "连接见"], "锁扣": ["索扣", "锁口", "所扣", "锁靠"], "锤子": ["榔头", "锤头", "垂子"]}

def build(steps, cells, feat, unit, general, syn_extra=None, stem_extra=()):
    cell = {c['code']: c for c in cells}
    out = {'syn': {**BASE_SYN, **(syn_extra or {})}, '*': general}
    for s in steps:
        E = []
        steps_ = steps
        names = [cell[c]['name'] for c, q in s['parts'] if c in cell]
        u = unit(s['id'])
        for c, q in s['parts']:
            if c not in cell: continue
            n, no = cell[c]['name'], cell[c]['n']
            kw = [n]
            for st in list(STEMS) + list(stem_extra):
                if st in n and st != n and sum(st in x for x in names) == 1: kw.append(st)
            m = mw(n)
            E.append({'k': [kw, ['几', '多少']], 'q': [f'要几{m}{n}', f'{n}一共几{m}', f'几{m}{n}', f'{n}要几{m}'],
                      'a': f'{u}用{cn(q)}{m}{n}，在{cno(no)}号格。', 'show': {'part': n}})
            if c in feat:
                E.append({'k': [kw, ['哪个', '什么样', '长什么', '哪种', '哪一种', '格']], 'x': ['几', '孔'],
                          'q': [f'{n}是哪个', f'{n}长什么样', f'哪个是{n}', f'{n}在哪一格'],
                          'a': clean(f'{n}是{feat[c]}，在{cno(no)}号格。', cell, steps), 'show': {'part': n}})
        if s.get('warn'):
            w = clean('；'.join(x.rstrip('。') for x in s['warn'][:2]) + '。', cell, steps)
            E.append({'k': [['注意', '小心', '当心', '要紧', '危险']], 'q': ['这一步要注意什么', '有什么要注意的', '要小心什么'], 'a': w})
        if E: out[s['id']] = E
    return out

if __name__ == '__main__':
    print(cn(16), cn(2), cn(36), mw('木销'), mw('短螺丝'), mw('底板'))
