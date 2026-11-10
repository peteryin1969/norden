"""norden-loop: a simulation of the stage 3 loop when the machine self-check finds problems.
Three rounds are kept in one report: round 1 three problems injected into the self-check result, round 2 after the AI's own fixes, round 3 after the modeller's fix.
The storyboard frames are the normal animation; only the check results and the step versions are simulated."""
import json, os, shutil, sys, copy
H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H + '/engine'); import engine
A = H + '/packages/norden-sim'; B = H + '/packages/norden-loop'
shutil.rmtree(B, ignore_errors=True); shutil.copytree(A, B, ignore=shutil.ignore_patterns('_src'))
for f in ['signoff.json', 'ai_photo.json', 'ai_review.json', 'fixes.json']:
    if os.path.exists(B + '/' + f): os.remove(B + '/' + f)
j = json.load(open(B + '/package.json', encoding='utf8')); j['slug'] = 'norden-loop'; j['name'] = 'NORDEN 折叠桌（模拟：机器自检出问题）'
j['note'] = '模拟阶段 3 机器自检发现问题后的循环。三个问题是人为加进自检结果里的，分镜图仍是正常的动画；资料包本身也是模拟的。'
json.dump(j, open(B + '/package.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
r = json.load(open(B + '/release.json', encoding='utf8')); r.pop('approved_by', None); r.pop('approved_at', None); json.dump(r, open(B + '/release.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
O = H + '/out/norden-loop'; shutil.rmtree(O, ignore_errors=True); os.makedirs(O)
shutil.copytree(H + '/out/norden-sim/frames', O + '/frames'); shutil.copy(H + '/out/norden-sim/tests.json', O + '/tests.json')
base = json.load(open(H + '/out/norden-sim/auto.json', encoding='utf8'))
def variant(defects, revs):
    a = copy.deepcopy(base)
    for s in a['steps']:
        if s['id'] in revs: s['rev'] = revs[s['id']]
        for k, note in defects.get(s['id'], {}).items(): s['checks'][k].update(ok=False, note=note)
    return a
D = {'9': {'visible': '镜头里看不到这一步的零件（6 个都在画面外）'}, '3': {'labels': '“连接木块”标了两次'}, '5': {'holes': '横销落点处没有孔（4 处）'}}
ROUNDS = [
 dict(title='第 1 轮：首次自检', what='机器自检发现 3 个问题：第 9 步镜头看不到零件、第 3 步标签重复，这两个 AI 可以自己改；第 5 步横销落点没有孔，要建模人员处理。独立 AI 审核和客户确认都锁着。', next='AI 自动修改镜头和标签，然后重跑自检', auto=variant(D, {})),
 dict(title='第 2 轮：AI 自动修改后重跑', what='AI 已调整第 9 步镜头、去掉第 3 步重复的标签，没有人参与，自检自动重跑。这两项通过了。还剩第 5 步缺孔，等建模人员处理，所以仍然不能进入独立 AI 审核。', next='建模人员给第 5 步补孔，然后回到机器自检', auto=variant({'5': D['5']}, {'9': 2, '3': 2})),
 dict(title='第 3 轮：人工修改后重跑', what='建模人员给第 5 步补了横销孔，回到机器自检重跑，全部通过。独立 AI 审核现在解锁；它通过后，客户分镜确认才解锁。', next=None, auto=variant({}, {'9': 2, '3': 2, '5': 2})),
]
snaps = []
for R in ROUNDS:
    rep = engine.run(B, O, R['auto']); snaps.append({'title': R['title'], 'what': R['what'], 'next': R['next'], 'stages': rep['stages']})
rep['sim_rounds'] = snaps; rep['stages'] = snaps[0]['stages']
json.dump(rep, open(O + '/report.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
json.dump(ROUNDS[-1]['auto'], open(O + '/auto.json', 'w', encoding='utf8'), ensure_ascii=False)
for i, s in enumerate(snaps): print(i + 1, [(x['stage'], x['gate']) for x in s['stages']], [c['id'] for c in s['stages'][2]['checks'] if c['status'] == 'fail'])
