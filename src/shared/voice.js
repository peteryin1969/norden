/* Conversational voice mode, in the style of a chat app's voice mode. Browser speech for ears and mouth, Claude for the talking. Typing always works if the mic is blocked. */
const Voice=(()=>{
const PRD=window.PRODUCT||{},SAY=PRD.say||{},PNAME=PRD.name||'这件家具',TOTAL=PRD.steps||STEPS.length;
const syn=window.speechSynthesis||null,SR=window.SpeechRecognition||window.webkitSpeechRecognition||null,IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),HALF=IOS||/Android/i.test(navigator.userAgent);
const blocked=!!(window.NORDEN_TTS?false:(()=>{try{return localStorage.getItem('norden-mic')==='no'}catch(e){return false}})());
let silent=false,noted=false,lastErr='',started=false,dict=0,chat=false,state='idle',voice=null,rec=null,recOn=false,micOK=!!SR,fast=0,paused=false,hist=[],q=[],playing=false,streamDone=true,ctl=null,turnId=0,spoken='',guard=0,live=null,alive=0;
const $v=id=>document.getElementById(id);
const pickV=()=>{if(!syn)return;const l=syn.getVoices();voice=l.find(v=>/^zh[-_]CN/i.test(v.lang))||l.find(v=>/^zh/i.test(v.lang))||null};
if(syn){pickV();syn.onvoiceschanged=pickV}
const LABEL={listen:'在听，直接说',think:'思考中',speak:'正在说',pause:'已暂停，点一下继续',type:window.NORDEN_TTS?'麦克风断开，点圆球重试':'点圆球，再点键盘话筒说话',idle:''};
function setS(s){state=s;const o=$v('vOrb');o.className='orb '+s;$v('vState').textContent=LABEL[s]||'';$v('vInt').hidden=s!=='speak'&&s!=='think';$v('vKb').hidden=!$v('vInt').hidden}
function bubble(who,text){const d=document.createElement('div');d.className='msg '+who;d.textContent=text;if(who==='ai')d.onclick=()=>{if(chat&&syn){const m=alive+1;stopSpeech();streamDone=true;if(m)sayAll(d.textContent)}};const l=$v('vLog');l.append(d);l.scrollTop=l.scrollHeight;return d}
const scroll=()=>{const l=$v('vLog');l.scrollTop=l.scrollHeight};
function here(){const c=P[st.pos],s=byId[c.id];return{c,s}}
function info(){const{c,s}=here();return{step:s.id,title:s.title,drawer:c.d?c.d+'/6':null,guide:SAY[s.id]||s.do.join(''),warn:s.warn,parts:s.parts.map(([k,n])=>{const x=CELLS.find(y=>y.code===k);return{name:x?x.name:k,code:k,qty:n,cell:x?x.n:null}})}}
function stepLine(){const i=info();return (i.drawer?'第 '+i.drawer.split('/')[0]+' 个抽屉，':'')+'第 '+i.step+' 步，'+i.title+'。'+i.guide}
function partsLine(){const i=info();if(!i.parts.length)return '这一步不需要新零件。';return '这一步要用'+i.parts.map(p=>p.name+' '+p.qty+' 个'+(p.cell?'，在 '+p.cell+' 格':'')).join('；')+'。'}
/* speech out */
let pace=1.35;try{pace=+localStorage.getItem('norden-pace')||1.35}catch(e){}
function setPace(d){pace=Math.max(.9,Math.min(2,Math.round((pace+d)*100)/100));nMemo.clear();try{localStorage.setItem('norden-pace',pace)}catch(e){}}
let actx=null,nReady=false,nW=null,nId=0,cur=null,nChain=Promise.resolve();const nWait=new Map(),nMemo=new Map();
function unlock(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const s=actx.createBufferSource();s.buffer=actx.createBuffer(1,1,22050);s.connect(actx.destination);s.start()}catch(e){}}
function initN(){if(nW||!window.NORDEN_TTS||!window.Worker)return;try{nW=new Worker(window.NORDEN_TTS+'worker.js');nW.onerror=()=>tr('语音模型加载失败');nW.onmessage=({data:d})=>{if(d.type==='progress')tr('首次下载语音模型 '+d.pct+'%');else if(d.type==='ready'){nReady=true;tr('语音模型已就绪')}else if(d.type==='pcm'){const f=nWait.get(d.id);nWait.delete(d.id);f&&f.res(d.pcm)}else if(d.type==='error'){if(d.id){const f=nWait.get(d.id);nWait.delete(d.id);f&&f.rej(new Error(d.message))}else tr('语音模型错误：'+d.message)}};nW.postMessage({type:'init'})}catch(e){tr('语音模型无法启动')}}
const ZD='零一二三四五六七八九';
function zn(n){if(n<10)return ZD[n];if(n<20)return '十'+(n%10?ZD[n%10]:'');if(n<100)return ZD[n/10|0]+'十'+(n%10?ZD[n%10]:'');return String(n).split('').map(c=>ZD[+c]).join('')}
function norm(t){return t.replace(/\d+/g,m=>m.length>3?m.split('').map(c=>ZD[+c]).join(''):zn(+m)).replace(/[A-Za-z]+/g,' ').replace(/[“”"'（）()]/g,'').replace(/\s+/g,'')}
function synth(t){if(nMemo.has(t))return nMemo.get(t);const p=nChain.then(()=>new Promise((res,rej)=>{const id=++nId;nWait.set(id,{res,rej});nW.postMessage({type:'say',id,text:norm(t),len:pace})}));nChain=p.catch(()=>{});nMemo.set(t,p);if(nMemo.size>40)nMemo.delete(nMemo.keys().next().value);return p}
async function playN(txt,my,n){const next=()=>{if(my!==alive)return;cur=null;playing=false;pump()};tr('朗读 '+n+'：合成中');try{const pcm=await synth(txt);if(my!==alive)return;unlock();const b=actx.createBuffer(1,pcm.length,22050);b.copyToChannel(pcm,0);const s=actx.createBufferSource();s.buffer=b;s.connect(actx.destination);s.onended=()=>{tr('朗读 '+n+'：结束');next()};cur=s;tr('朗读 '+n+'：播放中');s.start()}catch(e){tr('朗读 '+n+'：错误 '+(e&&e.message));nMemo.delete(txt);next()}}function ding(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;g.gain.value=.35;o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.35)}catch(e){}}
let barge=false;try{barge=localStorage.getItem('norden-barge')==='1'}catch(e){}
let listenTok=0,recEnd=0,lastCancel=0,uCount=0,trace='';const tr=t=>{trace=t;$v('vTrace').textContent=t};
function stopSpeech(){alive++;q=[];playing=false;clearTimeout(guard);if(cur){try{cur.onended=null;cur.stop()}catch(e){}cur=null}if(syn&&(syn.speaking||syn.pending)){syn.cancel();lastCancel=Date.now()}}
function pump(){if(playing)return;if(!q.length){if(streamDone&&(state==='speak'||state==='think'))doneTalking();return}if(!syn){noSound();q=[];if(streamDone)doneTalking();return}
  const w=250-(Date.now()-lastCancel);if(w>0){const m1=alive;setTimeout(()=>{if(m1===alive)pump()},w);return}
  if(HALF&&!barge){if(recOn){stopRec();recEnd=Date.now()}const w2=(nReady?350:1500)-(Date.now()-recEnd);if(w2>0){setS('speak');tr('等麦克风释放…');const m0=alive;setTimeout(()=>{if(m0===alive)pump()},w2);return}}
  const my=alive,txt=q.shift();playing=true;setS('speak');const n=++uCount;if(nReady){playN(txt,my,n);return}
  const go=(retry)=>{const u=new SpeechSynthesisUtterance(txt);u.lang='zh-CN';if(voice)u.voice=voice;let began=false;tr('朗读 '+n+'：已发出'+(retry?'（重试）':'')+' speaking='+(syn.speaking?1:0));
    const next=()=>{if(my!==alive)return;clearTimeout(guard);playing=false;pump()};
    u.onstart=()=>{began=true;started=true;tr('朗读 '+n+'：开始')};u.onend=()=>{tr('朗读 '+n+'：结束'+(began?'':'（未开始）'));next()};
    u.onerror=e=>{lastErr=e&&e.error||'';tr('朗读 '+n+'：错误 '+lastErr);if(lastErr&&lastErr!=='interrupted'&&lastErr!=='canceled'&&!began)noSound();next()};
    window._u=u;guard=setTimeout(()=>{if(syn)syn.cancel();lastCancel=Date.now();tr('朗读 '+n+'：超时');next()},txt.length*420+12000);
    setTimeout(()=>{if(my!==alive||began||!playing)return;clearTimeout(guard);if(!retry){syn.cancel();lastCancel=Date.now();tr('朗读 '+n+'：1.5 秒未开始，重试');setTimeout(()=>{if(my===alive)go(true)},300)}else{tr('朗读 '+n+'：重试后仍未开始');noSound();syn.cancel();lastCancel=Date.now();next()}},retry?4000:1500);
    try{syn.resume()}catch(e){}syn.speak(u)};go(false)}
function noSound(){if(noted)return;noted=true;bubble('ai note','这一句没有读出来，后面会继续尝试。诊断：语音引擎'+(syn?'有':'无')+'，可用声音 '+(syn?syn.getVoices().length:0)+' 个'+(lastErr?'，错误 '+lastErr:'，朗读未开始')+'。')}
function testSound(){if(!syn){bubble('ai note','测试：这个页面没有语音引擎。');return}const l=syn.getVoices(),zh=l.filter(x=>/^zh/i.test(x.lang)),log=[];stopSpeech();stopRec();paused=true;setS('pause');const d=bubble('ai note','测试中…');
  const show=()=>{d.textContent='声音 '+l.length+' 个，中文 '+zh.length+' 个'+(zh[0]?'（'+zh[0].name+'）':'')+'。'+log.join('；')+'。听到后点圆球继续。';scroll()};
  const one=(t,lang,tag,then)=>{const u=new SpeechSynthesisUtterance(t);u.lang=lang;if(lang==='zh-CN'&&zh[0])u.voice=zh[0];let fin=false;const f=x=>{if(fin)return;fin=true;log.push(tag+x);show();then&&setTimeout(then,300)};u.onstart=()=>{log.push(tag+'开始');show()};u.onend=()=>f('结束');u.onerror=e=>f('错误 '+(e&&e.error));syn.speak(u);setTimeout(()=>f('超时'),9000)};
  setTimeout(()=>one('测试声音，一二三。','zh-CN','中文',()=>one('Testing sound, one two three.','en-US','英文')),300)}
function feed(t){q.push(t);if(nReady)synth(t);pump()}
function sayAll(t){streamDone=false;spoken=t;(t.match(/[^。！？!?；]+[。！？!?；]?/g)||[t]).forEach(feed);streamDone=true;pump()}
let lastSaid='',lastEnd=0;
function doneTalking(){if(spoken){lastSaid=spoken;lastEnd=Date.now()}spoken='';if(!chat)return;if(paused){setS('pause');return}setS(micOK?'listen':'type');const m=++listenTok;setTimeout(()=>{if(m===listenTok&&state==='listen')startRec()},HALF?1000:0)}
/* tools the model can use */
const TOOLS=[{name:'go_step',description:'翻到下一步或上一步。用户说做好了、要继续时用 next。',inputSchema:{type:'object',properties:{direction:{type:'string',enum:['next','prev']}},required:['direction']},execute:({direction})=>{const b=st.pos;goStep(direction==='prev'?-1:1);return st.pos===b?{note:'已经到头了',...info()}:info()}},
 {name:'jump_step',description:'跳到说明书的第几步。',inputSchema:{type:'object',properties:{step:{type:'number'}},required:['step']},execute:({step})=>{if(!byId[String(step)])throw new Error('没有这一步');jump(String(step));return info()}},
 {name:'animation',description:'控制屏幕上的组装动画：replay 重播，pause 暂停，play 继续，slow 慢放，normal 正常速度。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['replay','pause','play','slow','normal']}},required:['action']},execute:({action})=>{anim(action);return{ok:true}}}];
function anim(a){const c=id=>$v(id).click(),pl=$v('animPlay').textContent,sl=$v('animSlow').textContent;if(a==='replay')c('animRe');if(a==='pause'&&pl==='暂停')c('animPlay');if(a==='play'&&pl==='播放')c('animPlay');if(a==='slow'&&sl==='慢放')c('animSlow');if(a==='normal'&&sl!=='慢放')c('animSlow')}
const CN1={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};const cnNum=s=>{if(/^\d+$/.test(s))return +s;if(s==='十')return 10;const m=s.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);if(m)return (m[1]?CN1[m[1]]:1)*10+(m[2]?CN1[m[2]]:0);return CN1[s]||0};
/* short exact commands answer at once, without waiting for the model */
function quick(raw){const t=raw.toLowerCase().replace(/[\s，。！？、,.!?]/g,'').replace(/^(返回到?|回到|跳到|去|到|转到)/,'').replace(/^(第.{1,3}|下一|上一)[部布不]$/,'$1步'),m=t.match(/^第(\d+|[一二两三四五六七八九十]{1,3})步$/);
  if(/说?(慢一点|慢点)说?$|说得?太快|语速.*慢/.test(t)){setPace(.2);return '好，我说慢一点。'}
  if(/说?(快一点|快点)说?$|说得?太慢|语速.*快/.test(t)){setPace(-.2);return '好，我说快一点。'}
  if(/^(下一步|继续下一步|做完了|好了|做好了|好的|装好了|完成了|接下来|然后呢|下一个|next)$/.test(t)){const b=st.pos;goStep(1);return st.pos===b?'已经是最后一步了。':stepLine()}
  if(/^(上一步|back)$/.test(t)||raw.trim()==='返回'){goStep(-1);return stepLine()}
  if(m){const n=cnNum(m[1]);if(!byId[String(n)])return '没有这一步。';jump(String(n));return stepLine()}
  if(/^(再说一遍|重复|再讲一遍|没听清|怎么做|怎么装|这一?步怎么(做|装)|这一?步做什么|repeat)$/.test(t))return stepLine();
  if(/注意什么|要注意|有什么注意/.test(t)){const w=info().warn;return w.length?w.join(''):'这一步没有特别的注意事项。'}
  if(/第几步|到哪了|进度/.test(t)){const i=info();return '现在是第 '+i.step+' 步，'+i.title+(i.drawer?'，第 '+i.drawer.split('/')[0]+' 个抽屉':'')+'。'}
  if(/^(再演示一遍|重播|再看一遍|replay)$/.test(t)){anim('replay');return '好，再看一遍。'}
  if(/^(暂停|pause)$/.test(t)){anim('pause');return '好。'}
  if(/^(继续|播放|play)$/.test(t)){anim('play');return '好。'}
  if(/^(动画慢放|慢放|slow)$/.test(t)){anim('slow');return '好，慢放。'}
  if(/什么零件|哪些零件|要什么|用什么|几个零件|零件/.test(t))return partsLine();
  return null}
const PROMPT=()=>`你是陪用户组装 ${PNAME} 的语音助手，语气像身边有经验的朋友。
你的话会被朗读：用口语短句，一般不超过 50 字，不用列表、编号、符号和括号，不提“图片”或“数据”这类词。一次只说一件事。用户说英文就用英文答，否则用简体中文。
只依据随附的说明书原图和下面的内容回答，不确定就直说并建议对照说明书，不要猜。翻转大件、防倾倒和墙体固定要提醒注意安全。
用户的话已经转成文字给你了，不要说没听见、没听清或没听懂。语音转文字可能有错字或只有半句，请结合这一步推断最可能的意思并直接回答，开头可以用一句话说你的理解。只有几种理解的答案差别很大时，才问一句，并说出你想到的具体选项让用户选。用户打断你时，你上一句会标着“被用户打断”，此时不要重复或继续原来的话，先按用户的新说法修正理解。
用户说做好了或想继续时调用 go_step，再用返回的 guide 口语化地讲下一步；想回看时调用 jump_step；想再看动作时调用 animation。
现在：${JSON.stringify(info())}
全部步骤：${JSON.stringify(STEPS.map(x=>({id:x.id,title:x.title})))}`;
async function turn(text){const q0=text.trim();if(!q0||!chat)return;const my=++turnId;if(ctl)ctl.abort();stopSpeech();streamDone=true;paused=false;bubble('me',q0);hist.push({role:'user',content:q0});
  const fastA=quick(q0);if(fastA!==null){bubble('ai',fastA);hist.push({role:'assistant',content:fastA});sayAll(fastA);return}
  if(!sample){const x='这句要设置密钥后才能回答。现在可以说下一步、上一步、第三步、再说一遍、要什么零件、注意什么。';bubble('ai',x);hist.push({role:'assistant',content:x});sayAll(x);return}
  setS('think');startRec();streamDone=false;ctl=new AbortController();let all='',buf='';const b=bubble('ai','');
  const take=d=>{all+=d;spoken=all;buf+=d;b.textContent=all;scroll();let m;while((m=buf.match(/^[\s\S]*?[。！？!?；\n]/))){buf=buf.slice(m[0].length);if(m[0].trim())feed(m[0].trim())}};
  try{let images;try{images=[await stepImage()]}catch(e){}const r=await sample([{role:'user',content:PROMPT()},...hist.slice(-12)],{tools:TOOLS,images,modelTier:'quick',cache:false,signal:ctl.signal,onText:({text:t,delta})=>{if(my===turnId)take(delta!=null?delta:t.slice(all.length))}});
    if(my!==turnId)return;if(!all&&r.text)take(r.text);if(buf.trim())feed(buf.trim());buf='';hist.push({role:'assistant',content:all||'好。'});streamDone=true;pump()}
  catch(e){if(my!==turnId||(e&&e.code==='cancelled'))return;const x=all?'':(msg(e&&e.code));if(x)b.textContent=x;if(!all)hist.pop();streamDone=true;if(x)sayAll(x);else pump()}}
/* speech in */
let pend='',sendT=0;
function flushSpeech(){clearTimeout(sendT);const t=pend;pend='';if(live){live.remove();live=null}if(t)turn(t)}
function stopRec(){if(rec&&recOn){try{rec.abort()}catch(e){}}recOn=false}
function startRec(){if(!chat||!micOK||paused||recOn)return;if(HALF&&!barge&&(state!=='listen'||playing||q.length))return;rec=new SR();rec.lang='zh-CN';rec.interimResults=true;rec.maxAlternatives=1;const t0=Date.now(),me=rec;
  rec.onresult=e=>{if(me!==rec)return;let t='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}
    if(HALF&&!barge&&state!=='listen')return;
    if(Date.now()-lastEnd<8000&&t.replace(/\s/g,'').length>=4&&isEcho(t,lastSaid)){if(live){live.remove();live=null}tr('已忽略回声');return}
    if((state==='speak'||state==='think')&&isEcho(t))return;
    if(state==='speak'||state==='think'){if(t.replace(/\s/g,'').length<2)return;interrupt(true)}
    clearTimeout(sendT);const shown=(pend+t).trim();if(!live)live=bubble('me live','');live.textContent=shown;scroll();if(fin){pend=shown;if(pend.length<=5&&/(步|遍|了|停|播放|暂停|重播|零件)$/.test(pend))flushSpeech();else sendT=setTimeout(flushSpeech,1500)}};
  rec.onerror=e=>{tr('麦克风：'+e.error);if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){if(!window.NORDEN_TTS){try{localStorage.setItem('norden-mic','no')}catch(x){}}micOff()}};
  rec.onend=()=>{recEnd=Date.now();if(me!==rec)return;recOn=false;if(!micOK||!chat||paused)return;if(Date.now()-t0<400){if(++fast>5){if(!window.NORDEN_TTS){micOff();return}fast=0;setTimeout(startRec,2500);return}}else fast=0;setTimeout(startRec,350)};
  try{rec.start();recOn=true}catch(e){recOn=false}}
function micOff(){micOK=false;$v('vChat').classList.add('kb');if(state==='listen')setS('type');$v('vChat').classList.add('dictate');$v('vTxt').placeholder='点这里，再点键盘上的话筒说话'}
function isEcho(t,src){const a=t.replace(/[\s，。！？、,.!?；]/g,''),b=(src==null?spoken:src).replace(/[\s，。！？、,.!?；]/g,'');if(!a)return true;if(!b)return false;if(a.length<2)return b.includes(a);let n=0;for(let i=0;i<a.length-1;i++)if(b.includes(a.slice(i,i+2)))n++;return n/(a.length-1)>.45}
function interrupt(keepRec){clearTimeout(sendT);const said=spoken;turnId++;if(ctl)ctl.abort();stopSpeech();streamDone=true;spoken='';lastEnd=0;lastSaid='';if(said){const l=hist[hist.length-1];if(l&&l.role==='assistant')l.content=said+'（说到这里被用户打断）';else hist.push({role:'assistant',content:said+'（说到这里被用户打断）'})}setS(micOK?'listen':'type');$v('vState').textContent=micOK?'已打断，请说':'已打断，请打字';if(micOK&&!keepRec){stopRec();setTimeout(startRec,120)}}
function orb(){if(state==='speak'||state==='think')interrupt();else if(state==='listen'){paused=true;stopRec();setS('pause')}else if(state==='pause'){paused=false;doneTalking()}else if(state==='type'){if(SR&&window.NORDEN_TTS){micOK=true;$v('vChat').classList.remove('dictate');$v('vTxt').placeholder='也可以打字';setS('listen');startRec()}else $v('vTxt').focus()}}
function open(){unlock();initN();chat=true;paused=false;hist=[];fast=0;micOK=!!SR&&!blocked;$v('vLog').replaceChildren();if(!micOK)micOff();$v('anim').classList.add('vc');if(!$v('anim').classList.contains('full'))$v('animFull').click();if($v('fMode').textContent==='看整体')$v('fMode').click();setTimeout(()=>window.dispatchEvent(new Event('resize')),200);setS('speak');const g='我在。'+stepLine()+'有问题随时说，做好了就告诉我。';bubble('ai',g);hist.push({role:'assistant',content:g});if(!micOK)$v('vTxt').focus();sayAll(g)}
function close(){clearTimeout(sendT);pend='';chat=false;turnId++;if(ctl)ctl.abort();stopSpeech();stopRec();setS('idle');if(live){live.remove();live=null}const a=$v('anim');a.classList.remove('vc');if(a.classList.contains('full'))$v('animFull').click()}
function ui(){$v('vStart').onclick=open;$v('vInt').onclick=()=>interrupt();const bb=$v('vBarge'),bs=()=>{bb.textContent=barge?'开口打断：开':'开口打断：关';bb.classList.toggle('primary',barge)};bs();bb.onclick=()=>{barge=!barge;try{localStorage.setItem('norden-barge',barge?'1':'0')}catch(e){}bs();if(barge&&(state==='speak'||state==='think'))startRec()};$v('vKb').onclick=()=>{const c=$v('vChat');c.classList.toggle('kb');if(c.classList.contains('kb'))$v('vTxt').focus()};$v('vEnd').onclick=close;$v('vOrb').onclick=orb;if($v('vTest'))$v('vTest').onclick=testSound;
  const send=()=>{const i=$v('vTxt'),t=i.value;i.value='';if(!micOK){i.blur();recEnd=Date.now()}turn(t)};$v('vSend').onclick=()=>{clearTimeout(dict);send()};$v('vTxt').oninput=()=>{if(micOK)return;clearTimeout(dict);if(state==='speak'||state==='think'){turnId++;if(ctl)ctl.abort();stopSpeech();streamDone=true;setS('type')}if($v('vTxt').value.trim())dict=setTimeout(send,1800)};$v('vTxt').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(dict);send()}};
  document.addEventListener('fullscreenchange',()=>{if(chat&&!document.fullscreenElement&&!$v('anim').classList.contains('full'))close()})}
return{ui,onStep(){},_s:()=>({chat,state,micOK,hist})}})();
