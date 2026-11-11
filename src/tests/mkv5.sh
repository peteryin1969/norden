#!/bin/bash
# test 5 material: NORDEN with the notched end board upside down, storyboard captured, then everything restored
cd "$(dirname "$0")"; cp cab.js cab.js.good
python3 - <<'PY'
s=open('cab.js',encoding='utf8').read()
a="pt(null,fr,[0,1,dd/2-th/2],{10:[[0,-3,12],[0,0,0]]}"
assert s.count(a)==1
s=s.replace(a,"fr.children[0].rotation.z=PI;fr.children[0].position.y=dh;"+a);open('cab.js','w',encoding='utf8').write(s)
PY
python3 build.py >/dev/null && python3 site.py >/dev/null 2>&1
rm -rf ../app/v5; mkdir -p ../app/v5
PW=$(node -e "console.log(require.resolve('playwright'))") node ../plat/engine/stage3.js site norden ../app/v5 tv/node_modules/three/build/three.min.js 2>&1 | tail -3
cp cab.js.good cab.js; python3 build.py >/dev/null && python3 site.py >/dev/null 2>&1; echo restored
