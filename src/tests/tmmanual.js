/* rule-based first reading of a manual step, and the checks against the parts list */
const MM=require('./mmanual.js'),ME=require('./medit.js'),fs=require('fs');const M=JSON.parse(fs.readFileSync('site/norden/model.json','utf8'));const lib=MM.library(M,ME.csvParse(fs.readFileSync('../plat/packages/norden/parts.csv','utf8')));
let ok=0,n=0;const T=(t,want,f)=>{const u=MM.understand(t,lib),got=f?f(u):MM.restate(u,lib);n++;if(got===want)ok++;else console.log('FAIL',t,'\n  got ',got,'\n  want',want)};
T('用两颗短螺丝把钢条装到左框架上','用 2 个 短螺丝（110733） 把 钢条（120139） 接到 左框架。');
T('先把桌板翻面，用四颗木螺丝把两块垫块装到左桌板和右桌板下面','用 4 个 木螺丝（117494） 把 垫块 接到 左桌板；用 4 个 木螺丝（117494） 把 垫块 接到 右桌板。先把整体翻面。');
T('把抽屉长板装到无缺口端板上，用四个抽屉螺栓，同样做六个','用 4 个 抽屉螺栓（116546） 把 抽屉长板（凸条朝外） 接到 无缺口端板。同样做 6 次。');
T('把四个脚垫敲进左框架和右框架的腿底','把 脚垫（107271） 接到 左框架；把 脚垫（107271） 接到 右框架。用锤子。');
T('用 4 根长螺栓把【左框架·孔3】和【连接木块·孔1】连接起来，用内六角扳手','孔3/孔1',u=>u.joins[0].pan+'/'+u.joins[0].pbn);
T('把八个木销插进连接木块','把 木销（101352） 接到 连接木块。');
T('把八个木销插进连接木块','101352:8,n:连接木块:1',u=>u.parts.map(p=>p.join(':')).join());
T('装上脚垫','2',u=>String(u.ask.length));T('把抽屉长板绕【抽屉长板（凸条朝外）·孔3】顺时针旋转90度','y:-90:孔3',u=>u.moves.map(m=>m.axis+':'+m.deg+':'+m.about).join());T('把垫块往左移五厘米','-5,0,0',u=>u.moves[0].d.join());T('把无缺口端板翻过来','x:180',u=>u.moves[0].axis+':'+u.moves[0].deg);T('把垫块平转四十五度','把 垫块 平转 45 度（逆时针）',u=>MM.moveText(u.moves[0],lib));T('用两颗短螺丝把钢条装到左框架上','0',u=>String(u.moves.length));T('把抽屉长板绕【抽屉长板（凸条朝外）·孔3】顺时针旋转90度','把抽屉长板绕抽屉长板（凸条朝外）的孔3顺时针旋转90度。');T('把抽屉长板绕孔3顺时针旋转90度','0',u=>String(u.ask.length));T('今天先到这','0/1',u=>u.parts.length+'/'+u.ask.length);
T('把左桌板装到中间桌板上，用两个铰链和十六颗短螺丝。注意两个人抬','110733:16|10005601:2|两个人抬',u=>[u.parts.find(p=>p[0]==='110733').join(':'),u.parts.find(p=>p[0]==='10005601').join(':'),u.warn[0]].join('|'));
const steps=[{ok:true,u:MM.understand('用四颗木螺丝把两块垫块装到左桌板上',lib)},{ok:false,u:MM.understand('把八个木销插进连接木块',lib)},{ok:true,u:Object.assign(MM.understand('用五颗木螺丝把垫块装到右桌板上',lib),{repeat:1})}];const C=MM.check(steps,lib);
n++;if(C.todo===1&&C.over.length===2&&C.over[1].key==='117494'&&C.over[1].used===9&&C.used['n:垫块']===3&&!C.done)ok++;else console.log('FAIL check',JSON.stringify(C).slice(0,300));
const D=MM.toDraft(steps,lib);n++;if(D.length===2&&D[0].id==='1'&&D[0].parts.join()==='117494,4'&&D[0].joins[0].with==='117494')ok++;else console.log('FAIL draft',JSON.stringify(D[0]));
n++;if(/<h2>第 2 步/.test(MM.printHTML({title:'T',steps},lib))&&/材料清单/.test(MM.printHTML({title:'T',steps},lib)))ok++;else console.log('FAIL print');
console.log('PASS',ok+'/'+n);
