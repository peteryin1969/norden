"""Turn a regression run's output into the engine's tests.json: one entry per suite, and the real-log replay (ts14) as the stage 4 replay result.
usage: python3 tests_from_reg.py <reg.out> <tests.json> [suite ...]   (suites default to all)"""
import json, re, sys, datetime
src, out, only = sys.argv[1], sys.argv[2], set(sys.argv[3:])
suites, cur = {}, None
for line in open(src, encoding='utf8'):
    m = re.match(r'## (.+)', line)
    if m: cur = m.group(1).strip().replace(' ', ':'); continue
    m = re.match(r'PASS (\d+)/(\d+)', line)
    if m and cur and (not only or cur in only): suites[cur] = {'pass': int(m.group(1)), 'total': int(m.group(2))}
    m = re.match(r'none \{.*"miss":\[\]', line)
    if m and cur and (not only or cur in only): suites[cur] = {'pass': 1, 'total': 1}
r = {'time': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC'), 'suites': suites}
if 'ts14' in suites: r['replay'] = {**suites['ts14'], 'source': '以往真实使用记录（一次完整的 NORDEN 语音组装）'}
json.dump(r, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(len(suites), 'suites', 'replay' in r)
