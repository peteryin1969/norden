/* manual editor: say or write a step, have it read back for confirmation, grab parts and exact points with the mouse, check against the parts list, save */
const {chromium}=require('playwright');const fs=require('fs');const d=process.cwd()+'/site/';
const MIME={'.html':'text/html;charset=utf8','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip','.py':'text/plain;charset=utf8','.csv':'text/csv','.png':'image/png'};
(async()=>{const srv=require('http').createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';fs.readFile(d+u.slice(1),(e,c)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'content-type':MIME[u.slice(u.lastIndexOf('.'))]||'application/octet-stream'});s.end(c)}})}).listen(8899);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const R=[],ck=(n,ok,x)=>{R.push(ok===true);console.log(ok===true?'ok  ':'FAIL',n,x==null?'':String(x).slice(0,330))};const er=[];
const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));p.on('dialog',d=>d.accept());
await ctx.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('tv/node_modules/three/build/three.min.js'),contentType:'text/javascript'}));await ctx.route('**fonts.g**',r=>r.abort());await p.addInitScript(()=>{window.__sr=[];window.SpeechRecognition=window.webkitSpeechRecognition=function(){window.__sr.push(this);this.start=()=>{this.on=true};this.abort=()=>{this.on=false;this.onend&&this.onend()}};Element.prototype.requestFullscreen=()=>Promise.reject(new Error('no'))});
let aiReply='',aiSeen='';await p.route('https://api.anthropic.com/**',r=>{aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
const ready=async()=>{await p.waitForSelector('#boot',{state:'detached',timeout:120000});await p.waitForSelector('main h1');await p.waitForTimeout(500)};
let aiN=0;const U='http://localhost:8899/app/manual.html?src=../norden/model.json&parts=samples/test2-fix/parts.csv';
await p.goto(U);await p.waitForFunction(()=>window.__man&&__man.state().ready,null,{timeout:60000});await p.waitForTimeout(500);
const W=f=>p.evaluate(f),ST=()=>p.evaluate(()=>__man.state()),MAN=()=>p.evaluate(()=>__man.man()),msg=()=>p.textContent('#msg');
const clickPt=async(key,name)=>{const s=await p.evaluate(([k,n])=>__man.screen(k,n),[key,name]);await p.mouse.move(s.x,s.y);await p.waitForTimeout(120);await p.mouse.click(s.x,s.y);await p.waitForTimeout(300)};
/* 1. what there is to write a manual from */
const lib=await W(()=>__man.lib());ck('the parts list and the 3D parts come together: numbered hardware with its quantity, named boards',lib.length===23&&lib.find(x=>x.key==='117494').name==='木螺丝'&&lib.find(x=>x.key==='110733').qty===42&&lib.some(x=>x.name==='左桌板'&&!x.hw&&x.has),lib.length+' kinds');
ck('before any step it explains how to write one',/怎样编一份手册/.test(await p.textContent('#ed'))&&await p.isDisabled('#bIns'));
/* 2. a step in plain words, read back for confirmation */
await p.click('#addStep');await p.fill('#sText','先把桌板翻面，用四颗木螺丝把两块垫块装到左桌板和右桌板下面。注意不要拧太紧');await p.click('#ask');await p.waitForSelector('#uCard');let M=await MAN(),u=M.steps[0].u;
ck('the step is read back as structure: parts with numbers, who goes onto whom, turning over, tool, caution',u.parts.map(x=>x.join(':')).join()==='117494:4,n:垫块:2,n:左桌板:1,n:右桌板:1'&&u.joins.length===2&&u.joins[0].a==='n:垫块'&&u.joins[0].b==='n:左桌板'&&u.joins[0].with==='117494'&&u.flip==='翻面'&&u.tool==='螺丝刀'&&u.warn[0]==='不要拧太紧',JSON.stringify(u.parts));
ck('it says so in one sentence and waits; without a key it says the reading is by rules',/用 4 个 木螺丝（117494） 把 垫块 接到 左桌板/.test(await p.textContent('#uSay'))&&/本机规则的理解/.test(await p.textContent('#uCard'))&&/没有填 Claude key/.test(await msg())&&M.steps[0].ok===false&&/待确认/.test(await p.textContent('#steps')),await p.textContent('#uSay'));
/* 3. grabbing the exact points */
await p.click('.join[data-j="0"] .jPick[data-side="a"]');await p.waitForTimeout(300);let st=await ST();ck('“抓取” shows that part alone with its points',st.view==='one'&&st.key==='n:垫块'&&st.pick.side==='a'&&/请在右边点一个点/.test(await p.textContent('.join[data-j="0"]'))&&/垫块 · 2 个孔/.test(await p.textContent('#bcap')),await p.textContent('#bcap'));
await p.click('#lib .li[data-key="n:左桌板"]');await p.waitForTimeout(300);ck('picking on the wrong part is caught and it goes back to the right one',/现在要抓的是“垫块”上的点/.test(await msg())&&(await ST()).key==='n:垫块');
await clickPt('n:垫块','孔1');M=await MAN();ck('a click on a hole takes it as the point of A',M.steps[0].u.joins[0].pa&&M.steps[0].u.joins[0].pa.name==='孔1'&&M.steps[0].u.joins[0].pa.kind==='hole'&&M.steps[0].u.joins[0].pa.p.length===3&&/接着请抓取另一个零件的点/.test(await msg()),JSON.stringify(M.steps[0].u.joins[0].pa));
ck('preview waits until both points are there',await p.isDisabled('.join[data-j="0"] .jPrev'));
await p.click('.join[data-j="0"] .jPick[data-side="b"]');await p.waitForTimeout(300);const lp=await W(()=>__man.points('n:左桌板'));const hb=lp.filter(x=>x.kind==='hole');await clickPt('n:左桌板',hb[0].name);M=await MAN();const j0=M.steps[0].u.joins[0];
ck('the same for B; the sentence now names both points',j0.pb&&j0.pb.name===hb[0].name&&new RegExp('把 垫块 的孔1 接到 左桌板 的'+hb[0].name).test(await p.textContent('#uSay')),await p.textContent('#uSay'));
await p.click('.join[data-j="0"] .jPrev');await p.waitForTimeout(300);ck('“预览结合” shows the two parts brought together at those points',(await ST()).view==='mate'&&/预览：垫块 的孔1 对到 左桌板 的/.test(await p.textContent('#bcap'))&&(await W(()=>__man.mateGap()))>=2,await p.textContent('#bcap'));
/* 4. confirm; the parts list is followed */
await p.click('#uOk');await p.waitForTimeout(200);M=await MAN();ck('“理解对了” confirms the step',M.steps[0].ok===true&&/已确认/.test(await p.textContent('#steps'))&&/out/.test(await p.getAttribute('#lib .li[data-key="117494"]','class'))&&/木螺丝 4\/4/.test(await p.textContent('#lib .li[data-key="117494"]')));
ck('the check lists what is still unused and which steps lack points',/清单里还没用完的：/.test(await p.textContent('#chk'))&&/第 1 步还没有指明结合点/.test(await p.textContent('#chk')),(await p.textContent('#chk')).slice(0,80));
await p.fill('#uParts tr:nth-child(2) .pQty','5');await p.dispatchEvent('#uParts tr:nth-child(2) .pQty','change');await p.waitForTimeout(200);ck('changing something un-confirms the step',(await MAN()).steps[0].ok===false);await p.click('#uOk');await p.waitForTimeout(200);
ck('more than the parts list has is pointed out',/“木螺丝”写了 5 个，清单只有 4 个/.test(await p.textContent('#chk'))&&/over/.test(await p.getAttribute('#lib .li[data-key="117494"]','class')),await p.textContent('#chk'));
await p.fill('#uParts tr:nth-child(2) .pQty','4');await p.dispatchEvent('#uParts tr:nth-child(2) .pQty','change');await p.click('#uOk');
/* 5. pointing while writing: tags in the sentence */
await p.click('#addStep');await p.fill('#sText','用 4 根长螺栓把');await p.click('#lib .li[data-key="n:左框架"]');await p.waitForTimeout(300);const fp=(await W(()=>__man.points('n:左框架'))).filter(x=>x.kind==='hole');await clickPt('n:左框架',fp[2].name);
ck('a clicked point is “grabbed” and can be put into the sentence',(await ST()).grab.pt===fp[2].name&&/已抓取：左框架 · /.test(await p.textContent('#grab'))&&await p.isEnabled('#bIns'));
await p.click('#bIns');const tx=await p.inputValue('#sText');ck('it goes in as a tag',tx==='用 4 根长螺栓把【左框架·'+fp[2].name+'】',tx);
await p.fill('#sText',tx+'和【连接木块·孔1】连接起来，用内六角扳手');await p.click('#ask');await p.waitForTimeout(400);M=await MAN();const j1=M.steps[1].u.joins[0];
ck('tags tell which part and which point: both points are filled in from the sentence',j1.a==='n:左框架'&&j1.b==='n:连接木块'&&j1.with==='105330'&&j1.qty===4&&j1.pa&&j1.pa.name===fp[2].name&&j1.pb&&j1.pb.name==='孔1'&&M.steps[1].u.tool==='内六角扳手',JSON.stringify([j1.pa&&j1.pa.name,j1.pb&&j1.pb.name]));
/* 6. pointing at the assembled product */
await p.click('#vAll');await p.waitForTimeout(400);const ps=await p.evaluate(()=>__man.partScreen('n:中间桌板'));await p.mouse.move(ps.x,ps.y);await p.waitForTimeout(150);const tip=await p.textContent('#tip');await p.mouse.click(ps.x,ps.y);await p.waitForTimeout(300);st=await ST();
ck('in the view of the whole product a click on a part grabs it',!!st.grab&&st.view==='one'&&st.key===st.grab.key&&tip.length>1,tip+' → '+st.key);
/* 7. speaking: words go into the box and wait */
await p.click('#addStep');await p.click('#mic');await p.waitForTimeout(200);const say2=(t,fin)=>p.evaluate(([t,fin])=>{const r=window.__sr[window.__sr.length-1];r.onresult({resultIndex:0,results:[Object.assign([{transcript:t}],{isFinal:fin})]})},[t,fin]);
await say2('把四个脚',false);const h1=await p.textContent('#heard');await say2('把四个脚垫敲到左框架和右框架的腿底',true);await p.waitForTimeout(200);M=await MAN();
ck('spoken words become text in the box, can be edited, and nothing is understood until asked',/听到：把四个脚/.test(h1)&&(await p.inputValue('#sText'))==='把四个脚垫敲到左框架和右框架的腿底'&&M.steps[2].u===null&&/谷歌/.test(await msg()),h1);
await p.click('#mic');await p.fill('#sText','把四个脚垫敲进左框架和右框架的腿底');
/* 8. with a key the AI reads it; what it adds beyond the list is dropped and said */
await p.route('https://api.anthropic.com/**',r=>{aiN++;aiSeen=JSON.parse(r.request().postData()).messages[0].content;r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({content:[{type:'text',text:aiReply}]})})});
await p.evaluate(()=>localStorage.setItem('norden-key','k'));aiReply='{"title":"敲入脚垫","parts":[["107271",4],["n:左框架",1],["n:右框架",1],["胶水",1]],"joins":[{"a":"107271","b":"n:左框架","with":"","qty":0},{"a":"107271","b":"n:右框架","with":"","qty":0}],"flip":"","repeat":1,"tool":"锤子","warn":[],"ask":["每条腿各敲几下？"]}';
await p.click('#ask');await p.waitForFunction(()=>/AI 的理解/.test((document.getElementById('uCard')||{}).textContent||''),null,{timeout:15000});M=await MAN();const u3=M.steps[2].u;
ck('the AI gets the sentence, the parts list and the confirmed steps',aiN===1&&/把四个脚垫敲进左框架/.test(aiSeen)&&/107271｜脚垫｜4/.test(aiSeen)&&/前面已经确认的步骤：1\. /.test(aiSeen)&&/他没说的不要自己补/.test(aiSeen));
ck('its reading is shown for confirmation with its question; a part that is not on the list is dropped and said',M.steps[2].by==='ai'&&u3.title==='敲入脚垫'&&u3.parts.length===3&&u3.tool==='锤子'&&(await p.$$('.uAsk')).length===2&&/每条腿各敲几下/.test(await p.textContent('#uCard'))&&/清单里没有的零件“胶水”/.test(await p.textContent('#uCard'))&&M.steps[2].ok===false,(await p.textContent('#uSay')));
/* 8b. answering the AI's questions, by typing or by speaking, and handing the answers back */
ck('each question has an answer button',(await p.$$('.uAsk .qBtn')).length===2&&await p.$('#qSend')===null);
await p.click('.uAsk:has-text("每条腿各敲几下") .qBtn');await p.waitForSelector('#aText');await p.fill('#aText','每条腿敲三下');await p.click('#aMic');await p.waitForTimeout(200);await say2('直到',false);const ah=await p.textContent('#aHeard');await say2('，直到敲平',true);await p.waitForTimeout(200);
ck('the answer box takes typing and speech',(await p.inputValue('#aText'))==='每条腿敲三下，直到敲平'&&/听到：直到/.test(ah)&&/正在听/.test(await p.textContent('#aMic')),await p.inputValue('#aText'));
ck('while answering, the grab button puts parts into the answer',/插入到回答里/.test(await p.textContent('#bIns')));await p.click('#lib .li[data-key="n:左框架"]');await p.waitForTimeout(300);const tq=(await W(()=>__man.points('n:左框架'))).filter(x=>x.kind==='hole')[0];await clickPt('n:左框架',tq.name);await p.click('#bIns');await p.waitForTimeout(200);
ck('a clicked part and point go into the answer as a tag; the step sentence is left alone',(await p.inputValue('#aText'))==='每条腿敲三下，直到敲平【左框架·'+tq.name+'】'&&(await p.inputValue('#sText'))==='把四个脚垫敲进左框架和右框架的腿底'&&/到回答里/.test(await msg()),await p.inputValue('#aText'));
await p.fill('#aText','每条腿敲三下，直到敲平');
await p.click('#aOk');await p.waitForTimeout(200);M=await MAN();ck('the answer is kept with its question and shown',M.steps[2].qa.length===1&&M.steps[2].qa[0].a==='每条腿敲三下，直到敲平'&&/你的回答：每条腿敲三下，直到敲平/.test(await p.textContent('#uCard'))&&/修改回答/.test(await p.textContent('#uCard'))&&/已回答 1 \/ 2 个问题/.test(await p.textContent('#uCard'))&&await p.evaluate(()=>window.__sr[window.__sr.length-1].on===false));
aiReply='{"title":"敲入脚垫","parts":[["107271",4],["n:左框架",1],["n:右框架",1]],"joins":[{"a":"107271","b":"n:左框架","with":"","qty":0},{"a":"107271","b":"n:右框架","with":"","qty":0}],"act":"","flip":"","repeat":1,"tool":"锤子","warn":["每条腿敲三下，直到敲平"],"ask":[]}';
await p.click('#qSend');await p.waitForFunction(()=>document.querySelectorAll('.uAsk').length===0,null,{timeout:15000});M=await MAN();ck('after answering, the button is for the sentence again',/插入到句子里/.test(await p.textContent('#bIns')));
ck('“带着回答重新交给 AI 理解” sends question and answer; the new reading has no open question',aiN===2&&/回答里的【名称】/.test(aiSeen)&&/问：每条腿各敲几下？\n答：每条腿敲三下，直到敲平/.test(aiSeen)&&/不要再问同样的问题/.test(aiSeen)&&M.steps[2].u.warn[0]==='每条腿敲三下，直到敲平'&&M.steps[2].u.ask.length===0,aiSeen.slice(-90));
/* 9. order of steps, deleting, output */
await p.click('#uOk');await p.click('.st[data-i="2"] .up');await p.waitForTimeout(200);M=await MAN();ck('steps can be moved up and down',M.steps[1].u.title==='敲入脚垫'&&(await ST()).cur===1);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#save')]);const saved=JSON.parse(require('fs').readFileSync(await dl.path(),'utf8'));
ck('without a project, saving gives the manual as a file with the points in it',dl.suggestedFilename()==='manual.json'&&saved.format==='assembly-manual'&&saved.steps.length===3&&saved.steps[0].u.joins[0].pa.name==='孔1');
await p.evaluate(()=>{window.onbeforeunload=null});
await p.goto('http://localhost:8899/app/');await p.click('#goS');await p.waitForURL(/project\.html/);await ready();await p.click('#wSample');await p.waitForURL(/run=1/);await ready();
await p.click('#tEditor');await p.waitForSelector('#stStore .stitem',{timeout:60000});await p.click('.ststep[data-step="10"]');await p.waitForTimeout(2500);
/* 10. in a project: names and numbers from the client's list, saved next to the other files, and found again */
await p.evaluate(()=>localStorage.removeItem('norden-key'));await p.click('#edBake');await p.waitForSelector('#edBakeOpen',{timeout:120000});const pid=new URL(p.url()).searchParams.get('id');await p.click('#edClose');await p.waitForTimeout(500);ck('the project has a button for the manual editor',await p.isVisible('#tManual'));
await p.goto('http://localhost:8899/app/manual.html?pid='+pid);await p.waitForFunction(()=>window.__man&&__man.state().ready,null,{timeout:60000});
ck('opened from a project it takes the project\'s parts list and name',(await W(()=>__man.lib())).find(x=>x.key==='110733').qty===42&&/NORDEN/.test(await p.inputValue('#mTitle')));
await p.click('#addStep');await p.fill('#sText','用两颗短螺丝把钢条装到左框架上');await p.click('#ask');await p.waitForSelector('#uCard');await p.click('#uOk');await p.click('#save');await p.waitForFunction(()=>/已保存到项目/.test(document.getElementById('msg').textContent),null,{timeout:20000});
const sv=await p.evaluate(async pid=>{const d=x=>typeof x==='string'?x:new TextDecoder().decode(x),g=async f=>{const r=await DB.file(pid,f);return r?d(r.data):null};return{m:JSON.parse(await g('pkg/manual/manual.json')),h:await g('pkg/manual/manual.html'),s:JSON.parse(await g('pkg/manual/steps.from-manual.json'))}},pid);
ck('saved in the project: the manual, a printable manual, and step data for the platform',sv.m.steps.length===1&&/<h2>第 1 步/.test(sv.h)&&/短螺丝（110733）/.test(sv.h)&&sv.s[0].parts.join()==='110733,2,120139,1'&&sv.s[0].joins[0].b==='n:左框架'&&sv.s[0].joins[0].with==='110733'&&sv.s[0].joins[0].a==='120139'&&sv.s[0].said==='用两颗短螺丝把钢条装到左框架上'&&/还有零件没用完/.test(await msg()),JSON.stringify(sv.s[0]).slice(0,160));
await p.reload();await p.waitForFunction(()=>window.__man&&__man.state().ready,null,{timeout:60000});ck('opened again, the manual is there',(await MAN()).steps.length===1&&(await MAN()).steps[0].ok===true);
await p.screenshot({path:'/tmp/man1.png'});
console.log('PASS',R.filter(Boolean).length+'/'+R.length,'err',er);await b.close();srv.close()})();
