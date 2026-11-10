"""norden-new: the simulated NORDEN package as the client first hands it in — no answers, no storyboard sign-off, no AI results, no release approval.
For walking every stage from the start in the portal."""
import json, os, shutil
H = os.path.dirname(os.path.abspath(__file__)); A = H + '/packages/norden-sim'; B = H + '/packages/norden-new'
shutil.rmtree(B, ignore_errors=True); shutil.copytree(A, B, ignore=shutil.ignore_patterns('_src'))
for f in ['answers.json', 'signoff.json', 'ai_photo.json', 'ai_review.json', 'fixes.json']:
    if os.path.exists(B + '/' + f): os.remove(B + '/' + f)
j = json.load(open(B + '/package.json', encoding='utf8')); j['slug'] = 'norden-new'; j['name'] = 'NORDEN 折叠桌（模拟资料包 · 从头开始）'
j['note'] = '和模拟资料包是同一套资料，但客户还没有回答问题、确认分镜、批准发布。用来从头走一遍流程。尺寸、规格、授权书、测试人员记录都是模拟的。'
json.dump(j, open(B + '/package.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
r = json.load(open(B + '/release.json', encoding='utf8')); r.pop('approved_by', None); r.pop('approved_at', None); json.dump(r, open(B + '/release.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
O = H + '/out/norden-new'; shutil.rmtree(O, ignore_errors=True); os.makedirs(O)
shutil.copytree(H + '/out/norden-sim/frames', O + '/frames'); shutil.copy(H + '/out/norden-sim/auto.json', O + '/auto.json'); shutil.copy(H + '/out/norden-sim/tests.json', O + '/tests.json')
shutil.make_archive(O + '/package', 'zip', H + '/packages', 'norden-new')
print('norden-new ready')
