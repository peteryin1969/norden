'''Per-step report from exported assembly logs (the JSON that 导出记录 downloads).
Usage: python3 analyze.py export1.json [export2.json ...]'''
import json,sys,statistics,re
from collections import Counter,defaultdict

def load(paths):
    out=[]
    for p in paths:
        d=json.load(open(p,encoding='utf8'))
        L=d.get('sessions',d) if isinstance(d,dict) else d
        out+=[L] if isinstance(L,dict) else L
    seen=set();return [s for s in out if s.get('id') not in seen and not seen.add(s.get('id'))]

def bare(t):return re.sub(r'[\s，。！？、,.!?；;：:]','',t.lower())
def dice(a,b):
    A={a[i:i+2] for i in range(len(a)-1)};B={b[i:i+2] for i in range(len(b)-1)}
    return 2*len(A&B)/(len(A)+len(B)) if A and B else float(a==b)
def cluster(qs):
    '''group similar question texts; biggest groups are the best FAQ candidates'''
    G=[]
    for q in qs:
        for g in G:
            if dice(bare(q),bare(g[0]))>=.5:g.append(q);break
        else:G.append([q])
    return sorted(G,key=len,reverse=True)
def num(k):
    try:return (0,int(k))
    except ValueError:return (1,k)

def report(S):
    for prod in sorted({s.get('product','?') for s in S}):
        P=[s for s in S if s.get('product')==prod];steps=defaultdict(list)
        for s in P:
            for k,r in s.get('steps',{}).items():steps[k].append(r)
        print(f'\n== {prod}: {len(P)} 次组装，版本 {", ".join(sorted({s.get("version","?") for s in P}))}')
        print(f'{"步":>4} {"次数":>4} {"中位分钟":>8} {"卡住率":>6} {"重播":>4} {"提问 本地/FAQ/AI":>16} {"AI重复":>6} {"顺/不顺/其他":>12}  安全确认')
        for k in sorted(steps,key=num):
            R=steps[k];ms=[r['ms'] for r in R if r.get('ms',0)>0];qs=[q for r in R for q in r.get('qs',[])];c=Counter(q['layer'] for q in qs)
            ai=[a for r in R for a in r.get('ai',[])]
            # the after-step question is asked during the next step, so collect it by the step it was about
            pr=[p for s in P for r in s.get('steps',{}).values() for p in r.get('prompts',[]) if p['kind']=='done' and str(p.get('about'))==k];sc=Counter(p.get('cls') for p in pr)
            sf=Counter(r.get('safety') for r in R if r.get('safety'))
            print(f'{k:>4} {len(R):>4} {statistics.median(ms)/60000 if ms else 0:>8.1f} {sum(1 for r in R if r.get("stuck"))/len(R):>6.0%} {sum(r.get("replays",0) for r in R):>4} {c["cmd"]:>6}/{c["faq"]}/{c["ai"]:<6} {sum(1 for a in ai if a.get("rep")):>6} {sc["pos"]:>5}/{sc["neg"]}/{sc["other"]+sc["skip"]+sc[None]:<4}  {dict(sf) if sf else ""}')
        ai=[(k,a['q']) for s in P for k,r in s.get('steps',{}).items() for a in r.get('ai',[])]
        print('\n未解决的问题（AI 兜底且重复问过）：')
        for k,a in [(k,a['q']) for s in P for k,r in s.get('steps',{}).items() for a in r.get('ai',[]) if a.get('rep')] or [('-','无')]:print(f'  第 {k} 步：{a}')
        print('\nFAQ 缺口（AI 回答过的问题，按相似合并，建议加进 faq.json）：')
        by=defaultdict(list)
        for k,q in ai:by[k].append(q)
        for k in sorted(by,key=num):
            for g in cluster(by[k]):print(f'  第 {k} 步 ×{len(g)}：{g[0]}'+(f'（另有 {len(g)-1} 种说法）' if len(g)>1 else ''))
        if not ai:print('  无')
        reasons=[(k,p['a']) for s in P for k,r in s.get('steps',{}).items() for p in r.get('prompts',[]) if p.get('cls') in ('neg','reason') and p.get('a')]
        print('\n不顺的原因：');[print(f'  第 {k} 步：{a}') for k,a in reasons] or print('  无')
        cap=Counter();why=Counter();drop=[]
        for s in P:
            for k,r in s.get('steps',{}).items():
                c=r.get('cap',{});cap.update({x:v for x,v in c.items() if isinstance(v,int)});why.update(c.get('why',{}));drop+=[(k,x['why'],x['t']) for x in c.get('dropped',[])]
        print('\n识别问题：空结果',cap['empty'],'，识别错误',cap['err'],'，用户纠正',cap['corrected'],'| 原因',dict(why) or '无')
        for k,w,x in drop[-10:]:print(f'  第 {k} 步 丢弃（{w}）：{x}')
        sh=[(k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('shows',[])]
        print('标出零件：',len(sh),'次，失败',sum(1 for _,x in sh if not x['ok']),'次',''.join(f'\n  第 {k} 步 标不出：{x["name"]}（{x["src"]}）' for k,x in sh if not x['ok']))
        rt=[s['rating'] for s in P if s.get('rating')];hd=Counter((s.get('hardest') or {}).get('step') for s in P if s.get('hardest'))
        print('评分：',dict(sorted(Counter(rt).items())),f'平均 {statistics.mean(rt):.1f}' if rt else '无')
        print('最难的步骤：',{('第 '+k+' 步' if k else '没说清'):n for k,n in hd.most_common()} or '无')

if __name__=='__main__':
    if len(sys.argv)<2:sys.exit(__doc__)
    report(load(sys.argv[1:]))
