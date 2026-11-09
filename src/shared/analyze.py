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
        print('\n每步的话（不是指令或提问的随口说的话）：')
        print(f'{"步":>4} {"不顺":>4} {"困惑":>4} {"顺利":>4} {"中性":>4} {"对别人说":>6} {"反馈":>4}  帮助提议（接受/拒绝/标出/其他）  完成时回答')
        for k in sorted(steps,key=num):
            R=steps[k];rm=[x for r in R for x in r.get('remarks',[])];c=Counter(x['s'] for x in rm);fb=sum(len(r.get('feedback',[])) for r in R)
            hp=[p for r in R for p in r.get('prompts',[]) if p['kind']=='help'];hc=Counter('接受' if p.get('cls') in('yes','reason') else '拒绝' if p.get('cls') in('no','ok','skip') else '标出' if p.get('cls')=='shown' else '其他' for p in hp)
            cp=Counter(p.get('cls') for r in R for p in r.get('prompts',[]) if p['kind'] in('complete','mid'))
            if rm or fb or hp or cp:print(f'{k:>4} {c["neg"]:>4} {c["confused"]:>4} {c["pos"]:>4} {c["neutral"]:>4} {sum(1 for x in rm if x.get("to")):>6} {fb:>4}  {hc["接受"]}/{hc["拒绝"]}/{hc["标出"]}/{hc["其他"]:<22} {dict(cp) if cp else ""}')
        neg=sorted([(s.get('id','')[:6],k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('remarks',[]) if x['s'] in('neg','confused')],key=lambda z:(z[0],num(z[1]),z[2]['at']))
        print('\n不顺和困惑的时间线：')
        for sid,k,x in neg:print(f'  {sid} 第 {k} 步 {x["at"]//60}:{x["at"]%60:02d} [{x["s"]}] {x.get("t") or "（未记文字）"}')
        if not neg:print('  无')
        ap=[(k,x.get('q') or x.get('t')) for s in P for k,r in s.get('steps',{}).items() for x in r.get('qs',[])+r.get('remarks',[]) if x.get('s')=='app']
        print('\n对助手本身的抱怨（听不清、没回答、太慢）：')
        for k,t in ap:print(f'  第 {k} 步：“{t or "（未记文字）"}”')
        if not ap:print('  无')
        ms=[(k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('remarks',[]) if x.get('missed')]
        print('\n被当成随口说、用户追问后才回答的话：')
        for k,x in ms:print(f'  第 {k} 步：“{x.get("t")}”')
        if not ms:print('  无')
        cds=Counter((k,x.get('name') or x.get('code'),x.get('src')) for s in P for k,r in s.get('steps',{}).items() for x in r.get('cards',[]))
        print('\n查看零件卡片（用户想确认零件长什么样、在哪格）：')
        for (k,n,src),c in sorted(cds.items(),key=lambda z:(num(z[0][0]),-z[1])):print(f'  第 {k} 步：{n} ×{c}（{"语音" if src=="local" else "AI"}）')
        if not cds:print('  无')
        imp=sorted([(k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('feedback',[]) if x.get('kind')=='improve'],key=lambda z:num(z[0]))
        cpl=[p for s in P for r in s.get('steps',{}).values() for p in r.get('prompts',[]) if p['kind'] in ('complete','done')]
        cc=Counter(p.get('cls') for p in cpl)
        print(f'\n每步结束问“有要改进的地方吗”：问了 {len(cpl)} 次，提了建议 {sum(1 for p in cpl if p.get("improve"))} 次，说没有 {cc["none"]} 次，没回答 {cc["timeout"]+cc["unanswered"]} 次，跳过 {cc["skip"]} 次')
        for k,x in imp:print(f'  第 {k} 步 [{x.get("s")}]：“{x.get("t") or "（未记文字）"}”')
        ds=[(s.get('id','')[:6],x) for s in P for x in (s.get('design') or [])]
        print('\n整体设计改进建议（组装完成后）：')
        for sid,x in ds:print(f'  {sid}：“{x.get("t") or "（未记文字）"}”')
        if not ds:print('  无')
        qm=sorted(m for s in P for r in s.get('steps',{}).values() for m in r.get('cap',{}).get('qms',[]))
        xm=sorted(m for s in P for r in s.get('steps',{}).values() for m in r.get('cap',{}).get('xms',[]))
        eng=Counter(s.get('asr','chrome') for s in P);fb=[s.get('asrFallback') for s in P if s.get('asrFallback')]
        print(f'\n语音识别：{dict(eng)}'+(f'；千问每句耗时中位 {qm[len(qm)//2]} 毫秒（{len(qm)} 句）' if qm else '')+(f'；讯飞每句（开口到出结果）中位 {xm[len(xm)//2]} 毫秒（{len(xm)} 句）' if xm else '')+(f'；换回手机识别 {len(fb)} 次：{fb[:3]}' if fb else ''))
        pk=Counter((k,x.get('name'),a) for s in P for k,r in s.get('steps',{}).items() for x in r.get('picks',[]) for a in (x.get('acts') or ['-']))
        print('\n点选零件（点了哪个、接着做了什么）：')
        for (k,n,a),c in sorted(pk.items(),key=lambda z:(num(z[0][0]),-z[1])):print(f'  第 {k} 步：{n} ×{c}（{ {"look":"看样子","where":"在哪","how":"怎么装","ask":"提问","-":"只点选"}.get(a,a)}）')
        if not pk:print('  无')
        qa=[(k,x.get('layer'),x.get('q'),x.get('a')) for s in P for k,r in s.get('steps',{}).items() for x in r.get('qs',[]) if x.get('a') and x.get('layer')=='ai']
        print('\nAI 问答（问 → 答）：')
        for k,l,q,a in qa:print(f'  第 {k} 步：“{q}” → “{a}”')
        if not qa:print('  无（旧版本记录没有存回答）')
        ch=[(k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('checks',[])]
        cc=Counter(x.get('verdict') for k,x in ch)
        print(f'\n拍照检查：{len(ch)} 次 {dict(cc)}')
        for k,x in ch:
            if x.get('verdict') in ('fail','unsure'):print(f'  第 {k} 步 [{x["verdict"]}] {x.get("say") or ""} '+'；'.join(x.get('issues') or [])+(f' 补拍：{x["need"]}' if x.get('need') else ''))
        fbs=[(k,x) for s in P for k,r in s.get('steps',{}).items() for x in r.get('feedback',[]) if x.get('kind')!='improve']
        print('\n用户反馈原话：')
        for k,x in fbs:print(f'  第 {k} 步：“{x.get("t") or "（未记文字）"}”'+(f'（{ {"remark":"随口说的建议","asked":"让助手记下","said":"说出建议","ai":"AI 记下"}.get(x.get("src"),"")}）' if x.get('src') else ''))
        if not fbs:print('  无')
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
        cf=[x for s in P for r in s.get('steps',{}).values() for x in r.get('confirms',[])];learn=Counter()
        for x in cf:
            if x['answer']=='yes':learn[(x['heard'],x['offered'])]+=1
            elif x['answer'].startswith('word:'):learn[(x['heard'],x['answer'][5:])]+=1
        users=defaultdict(set)
        for s in P:
            for r in s.get('steps',{}).values():
                for x in r.get('confirms',[]):
                    w=x['offered'] if x['answer']=='yes' else x['answer'][5:] if x['answer'].startswith('word:') else None
                    if w:users[(x['heard'],w)].add(s.get('id'))
        print('\n读音确认：',Counter(x['answer'].split(':')[0] for x in cf) or '无','，自动纠正',sum(1 for x in cf if x['answer']=='auto'),'次')
        print('学到的别名（确认过的，按人数排序，建议加进 faq.json 的 syn）：')
        for (h,w),n in sorted(learn.items(),key=lambda kv:(-len(users[kv[0]]),-kv[1])):print(f'  {h} → {w}  {n} 次，{len(users[(h,w)])} 人')
        if not learn:print('  无')
        rt=[s['rating'] for s in P if s.get('rating')];hd=Counter((s.get('hardest') or {}).get('step') for s in P if s.get('hardest'))
        print('评分：',dict(sorted(Counter(rt).items())),f'平均 {statistics.mean(rt):.1f}' if rt else '无')
        print('最难的步骤：',{('第 '+k+' 步' if k else '没说清'):n for k,n in hd.most_common()} or '无')

if __name__=='__main__':
    if len(sys.argv)<2:sys.exit(__doc__)
    report(load(sys.argv[1:]))
