/* Conversational voice mode, in the style of a chat app's voice mode. Browser speech for ears and mouth, Claude for the talking. Typing always works if the mic is blocked. */
const Voice=(()=>{
const PRD=window.PRODUCT||{},SAY=PRD.say||{},PNAME=PRD.name||'这件家具',TOTAL=PRD.steps||STEPS.length;
const syn=window.speechSynthesis||null,SR=window.SpeechRecognition||window.webkitSpeechRecognition||null,IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),HALF=true;
const blocked=!!(window.NORDEN_TTS?false:(()=>{try{return localStorage.getItem('norden-mic')==='no'}catch(e){return false}})());
let offT=0,recLive=false,silent=false,noted=false,lastErr='',started=false,dict=0,chat=false,state='idle',voice=null,rec=null,recOn=false,micOK=!!SR,fast=0,paused=false,hist=[],q=[],playing=false,streamDone=true,ctl=null,turnId=0,spoken='',guard=0,live=null,alive=0;
const $v=id=>document.getElementById(id);
const pickV=()=>{if(!syn)return;const l=syn.getVoices();voice=l.find(v=>/^zh[-_]CN/i.test(v.lang))||l.find(v=>/^zh/i.test(v.lang))||null};
if(syn){pickV();syn.onvoiceschanged=pickV}
const LABEL={listen:'稍等，马上听你说',think:'思考中',speak:'正在说',pause:'已暂停，点一下继续',type:window.NORDEN_TTS?'麦克风断开，点圆球重试':'点圆球，再点键盘话筒说话',idle:''};
function setS(s){state=s;const o=$v('vOrb');o.className='orb '+s;$v('vState').textContent=LABEL[s]||'';$v('vInt').hidden=s!=='speak'&&s!=='think';$v('vKb').hidden=!$v('vInt').hidden;if(s==='listen')paintListen()}
function paintListen(){$v('vOrb').classList.toggle('ready',recLive);$v('vState').textContent=recLive?'红色，现在请说':LABEL.listen}
function bubble(who,text){const d=document.createElement('div');d.className='msg '+who;d.textContent=text;if(who==='ai')d.onclick=()=>{if(chat&&syn){const m=alive+1;stopSpeech();streamDone=true;if(m)sayAll(d.textContent)}};const l=$v('vLog');l.append(d);l.scrollTop=l.scrollHeight;return d}
const scroll=()=>{const l=$v('vLog');l.scrollTop=l.scrollHeight};
function here(pos=st.pos){const c=P[pos],s=byId[c.id];return{c,s}}
function info(pos){const{c,s}=here(pos);return{step:s.id,title:s.title,drawer:c.d?c.d+'/6':null,guide:SAY[s.id]||s.do.join(''),warn:s.warn,parts:s.parts.map(([k,n])=>{const x=CELLS.find(y=>y.code===k);return{name:x?x.name:k,code:k,qty:n,cell:x?x.n:null}})}}
function stepName(i){const s=byId[i.step];return s&&s.label?s.label:'第 '+i.step+' 步'}
function stepLine(pos){const i=info(pos),m=PRD.loops&&PRD.loops[i.step];return '好，'+stepName(i)+'。'+i.guide+(m||(i.step===PRD.loopEnd?'一共要做六个抽屉，都做好了再说下一步。':''))}
function stepOf(v){const t=String(v).toUpperCase();if(byId[t])return t;const n=+t;return n&&STEPS[n-1]?STEPS[n-1].id:null}
/* per-step FAQ answered on the device, and answers shown on the 3D view */
let FAQ=null,SYR=null,SYM={},qLayer='';try{fetch('faq.json').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.syn)return;for(const[c,vs]of Object.entries(j.syn))vs.forEach(v=>SYM[v]=c);const ks=Object.keys(SYM).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));SYR=ks.length?new RegExp(ks.join('|'),'g'):null;FAQ=j;for(const k in j)if(k!=='syn')j[k].forEach(e=>e._q=(e.q||[]).map(fnorm))}).catch(()=>{})}catch(e){}
const bare=t=>String(t).toLowerCase().replace(/[\s，。！？、,.!?；;：:“”"'（）()]/g,''),fnorm=t=>{const s=bare(t);return SYR?s.replace(SYR,m=>SYM[m]):s};
const big=s=>{const o=new Set();for(let i=0;i<s.length-1;i++)o.add(s.slice(i,i+2));return o},dice=(a,b)=>{const A=big(a),B=big(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>{if(B.has(x))n++});return 2*n/(A.size+B.size)};
function fscore(e,s){if(e.x&&e.x.some(w=>s.includes(w)))return 0;const k=e.k||[],hit=k.filter(g=>g.some(w=>s.includes(w))).length;if(!hit)return 0;return .6*hit/k.length+.4*Math.max(0,...e._q.map(q=>dice(s,q)))}
const TROUBLE=/卡住|卡死|坏了|断了|裂|滑丝|不进去|不进|不上|不住|不动|松了|晃|歪|弯|丢了|少了|不够|多了|怎么办|为什么|为啥|干嘛用/;
function faqFind(raw){if(!FAQ||TROUBLE.test(raw))return null;const cur=here().s.id,m=raw.match(/第\s*(\d+|[一二两三四五六七八九十]{1,3})\s*[步部布不]/);let sid=cur;if(m){const id=stepOf(cnNum(m[1]));if(id)sid=id}const s=fnorm(raw),L=[...(FAQ[sid]||[]).map(e=>[e,fscore(e,s)]),...(FAQ['*']||[]).map(e=>[e,fscore(e,s)-.02])].sort((a,b)=>b[1]-a[1]),[a,b]=L;
  if(!a||a[1]<.55||b&&b[1]>a[1]-.05&&b[0].a!==a[0].a)return null;return{e:a[0],sid,other:sid!==cur,score:+a[1].toFixed(2)}}
function faqAns(raw){const f=faqFind(raw);if(!f)return null;qLayer='faq';tr('FAQ '+f.sid+' · '+f.score);if(!f.other&&f.e.show)show(f.e.show.part,f.e.show.win);return (f.other?'第 '+f.sid+' 步，':'')+f.e.a}
const hasAnim=()=>typeof Anim!=='undefined'&&!!Anim.focus;
function show(part,win){try{return hasAnim()?Anim.focus(part,win):null}catch(e){return null}}
function unshow(){try{if(hasAnim()&&Anim._foc())Anim.unfocus()}catch(e){}}
const VK='vstats:'+PNAME;let VS=[],vLine='',curQ=null,speechEnd=0;try{VS=JSON.parse(localStorage.getItem(VK)||'[]')}catch(e){}
function vstats(){const by={},med=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return s[s.length>>1]};VS.forEach(r=>{const b=by[r.layer]=by[r.layer]||{n:0,ms:[]};b.n++;if(r.ms!=null)b.ms.push(r.ms)});const layers={};for(const k in by)layers[k]={n:by[k].n,medianMs:med(by[k].ms)};return{n:VS.length,repeats:VS.filter(r=>r.rep).length,layers,cueToResultMs:med(VS.filter(r=>r.cue!=null).map(r=>r.cue)),recent:VS.slice(-20)}}
window.voiceStats=vstats;
function saveVS(){if(VS.length>300)VS=VS.slice(-300);try{localStorage.setItem(VK,JSON.stringify(VS))}catch(e){}const s=vstats(),f=k=>{const L=s.layers[k];return L?L.n+(L.medianMs!=null?'/'+L.medianMs+'ms':''):'0'};vLine=s.n?'统计 '+s.n+' 问：本地 '+f('cmd')+'，FAQ '+f('faq')+'，AI '+f('ai')+'，重复 '+s.repeats+(s.cueToResultMs!=null?'，提示音到识别 '+s.cueToResultMs+'ms':''):''}
function qStart(text){const now=Date.now(),n=bare(text).slice(0,40),rep=VS.some(r=>now-r.t<60000&&dice(r.n,n)>=.7);curQ={t:now,t0:speechEnd&&now-speechEnd<5000?speechEnd:now,q:text.slice(0,40),n,layer:'ai',rep,ms:null,cue:cueRes};VS.push(curQ);speechEnd=0;cueRes=null}
function heard(){if(curQ&&curQ.ms==null){curQ.ms=Date.now()-curQ.t0;saveVS();tr(trace)}}
const ACK='我看看。',SENT=/[^。！？!?；]+[。！？!?；]?/g;
function preNext(){if(!nReady||!chat)return;const c=P[st.pos];((FAQ&&FAQ[c.id])||[]).forEach(e=>{const x=(e.a.match(SENT)||[e.a]).flatMap(clauses)[0];if(x)synth(x,1)});const n=c.id===PRD.loopEnd?P.findIndex((x,i)=>i>st.pos&&x.id!==c.id&&!x.d):st.pos+1;if(n<0||!P[n])return;const t=stepLine(n);(t.match(SENT)||[t]).flatMap(clauses).slice(0,3).forEach(x=>synth(x,1))}
function partsLine(){const i=info();if(!i.parts.length)return '这一步不需要新零件。';return '这一步要用'+i.parts.map(p=>p.name+' '+p.qty+' 个'+(p.cell?'，在 '+p.cell+' 格':'')).join('；')+'。'}
/* speech out */
let pace=1.45;try{pace=+localStorage.getItem('norden-pace4')||1.45}catch(e){}
function setPace(d){pace=Math.max(.9,Math.min(2,Math.round((pace+d)*100)/100));nMemo.clear();try{localStorage.setItem('norden-pace4',pace)}catch(e){}}
let actx=null,nReady=false,nW=null,nId=0,cur=null,nChain=Promise.resolve();const nWait=new Map(),nMemo=new Map();
function unlock(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const s=actx.createBufferSource();s.buffer=actx.createBuffer(1,1,22050);s.connect(actx.destination);s.start()}catch(e){}}
function initN(){if(nW||!window.NORDEN_TTS||!window.Worker)return;try{nW=new Worker(window.NORDEN_TTS+'worker.js');nW.onerror=()=>tr('语音模型加载失败');nW.onmessage=({data:d})=>{if(d.type==='progress')tr('首次下载语音模型 '+d.pct+'%');else if(d.type==='ready'){nReady=true;tr('语音模型已就绪');synth(ACK)}else if(d.type==='pcm'){const f=nWait.get(d.id);nWait.delete(d.id);f&&f.res(d.pcm)}else if(d.type==='error'){if(d.id){const f=nWait.get(d.id);nWait.delete(d.id);f&&f.rej(new Error(d.message))}else tr('语音模型错误：'+d.message)}};nW.postMessage({type:'init'})}catch(e){tr('语音模型无法启动')}}
const ZD='零一二三四五六七八九';
function zn(n){if(n<10)return ZD[n];if(n<20)return '十'+(n%10?ZD[n%10]:'');if(n<100)return ZD[n/10|0]+'十'+(n%10?ZD[n%10]:'');return String(n).split('').map(c=>ZD[+c]).join('')}
function norm(t){return t.replace(/第\s*(\d+)/g,(m,n)=>'第'+zn(+n)).replace(/\d{5,}/g,'').replace(/(^|[^\d.])2\s*(?=[根颗个块条次张片格])/g,'$1两').replace(/\d+/g,m=>m.length>3?m.split('').map(c=>ZD[+c]).join(''):zn(+m)).replace(/[A-Za-z]+/g,' ').replace(/[“”"'（）()]/g,'').replace(/\s+/g,'')}
/* one job at a time; spoken text goes before low-priority warm-ups, and stopSpeech drops jobs not yet started */
const nQ=[];let nBusy=false;
function nRun(){if(nBusy||!nQ.length)return;const j=nQ.shift(),id=++nId;nBusy=true;const fin=f=>x=>{nBusy=false;f(x);nRun()};nWait.set(id,{res:fin(j.res),rej:fin(j.rej)});nW.postMessage({type:'say',id,text:norm(j.t),len:pace})}
function nPut(j){const i=nQ.findIndex(x=>x.low);if(j.low||i<0)nQ.push(j);else nQ.splice(i,0,j)}
function synth(t,low){if(nMemo.has(t)){const j=!low&&nQ.find(x=>x.t===t&&x.low);if(j){nQ.splice(nQ.indexOf(j),1);j.low=false;nPut(j)}return nMemo.get(t)}const j={t,low:!!low};const p=new Promise((a,b)=>{j.res=a;j.rej=b});p.catch(()=>{});nPut(j);nMemo.set(t,p);if(nMemo.size>40)nMemo.delete(nMemo.keys().next().value);nRun();return p}
function nDrop(){for(const j of nQ.splice(0)){nMemo.delete(j.t);j.rej(new Error('dropped'))}}
function softOut(s,dur){const hi=actx.createBiquadFilter(),lp=actx.createBiquadFilter(),lo=actx.createBiquadFilter(),cp=actx.createDynamicsCompressor(),g=actx.createGain(),t=actx.currentTime;hi.type='highshelf';hi.frequency.value=3500;hi.gain.value=-5;lp.type='lowpass';lp.frequency.value=7500;lo.type='lowshelf';lo.frequency.value=250;lo.gain.value=1.5;cp.threshold.value=-20;cp.ratio.value=2.5;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.95,t+.02);g.gain.setValueAtTime(.95,t+Math.max(.03,dur-.03));g.gain.linearRampToValueAtTime(0,t+dur);s.connect(hi);hi.connect(lp);lp.connect(lo);lo.connect(cp);cp.connect(g);g.connect(actx.destination)}
async function playN(txt,my,n){const next=()=>{if(my!==alive)return;cur=null;playing=false;pump()};tr('朗读 '+n+'：合成中');try{const pcm=await synth(txt);if(my!==alive)return;unlock();const b=actx.createBuffer(1,pcm.length,22050);b.copyToChannel(pcm,0);const s=actx.createBufferSource();s.buffer=b;s.playbackRate.value=.97;softOut(s,b.duration/.97);const gap=/[。！？!?]$/.test(txt)?.5:.22;s.onended=()=>{tr('朗读 '+n+'：结束');setTimeout(next,gap*1000)};cur=s;tr('朗读 '+n+'：播放中');s.start();heard()}catch(e){tr('朗读 '+n+'：错误 '+(e&&e.message));nMemo.delete(txt);next()}}function cue(){cueT=Date.now();cueRes=null;if(window.__vlog)window.__vlog.push('[cue]');try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;o.type='sine';o.frequency.setValueAtTime(620,t);o.frequency.linearRampToValueAtTime(880,t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.02);g.gain.linearRampToValueAtTime(0,t+.16);o.connect(g).connect(actx.destination);o.start(t);o.stop(t+.18)}catch(e){}}
let cueT=0,cueRes=null;
function ding(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;g.gain.value=.35;o.connect(g).connect(actx.destination);o.start();o.stop(actx.currentTime+.35)}catch(e){}}
let barge=false;try{barge=localStorage.getItem('norden-barge2')==='1'}catch(e){}
let listenTok=0,recEnd=0,lastCancel=0,uCount=0,trace='';const tr=t=>{trace=t;$v('vTrace').textContent=t+(vLine?' ｜ '+vLine:'')};
function stopSpeech(){alive++;q=[];nDrop();playing=false;clearTimeout(guard);if(cur){try{cur.onended=null;cur.stop()}catch(e){}cur=null}if(syn&&(syn.speaking||syn.pending)){syn.cancel();lastCancel=Date.now()}}
function pump(){if(playing)return;if(!q.length){if(streamDone&&(state==='speak'||state==='think'))doneTalking();return}if(!syn){noSound();q=[];if(streamDone)doneTalking();return}
  const w=250-(Date.now()-lastCancel);if(w>0){const m1=alive;setTimeout(()=>{if(m1===alive)pump()},w);return}
  if(HALF&&!barge){if(recOn){stopRec();recEnd=Date.now()}const w2=(nReady?350:1500)-(Date.now()-recEnd);if(w2>0){setS('speak');tr('等麦克风释放…');const m0=alive;setTimeout(()=>{if(m0===alive)pump()},w2);return}}
  const my=alive,txt=q.shift();playing=true;if(window.__vlog)window.__vlog.push(txt);setS('speak');const n=++uCount;if(nReady){playN(txt,my,n);return}
  const go=(retry)=>{const u=new SpeechSynthesisUtterance(txt);u.lang='zh-CN';if(voice)u.voice=voice;let began=false;tr('朗读 '+n+'：已发出'+(retry?'（重试）':'')+' speaking='+(syn.speaking?1:0));
    const next=()=>{if(my!==alive)return;clearTimeout(guard);playing=false;pump()};
    u.onstart=()=>{began=true;started=true;heard();tr('朗读 '+n+'：开始')};u.onend=()=>{tr('朗读 '+n+'：结束'+(began?'':'（未开始）'));next()};
    u.onerror=e=>{lastErr=e&&e.error||'';tr('朗读 '+n+'：错误 '+lastErr);if(lastErr&&lastErr!=='interrupted'&&lastErr!=='canceled'&&!began)noSound();next()};
    window._u=u;guard=setTimeout(()=>{if(syn)syn.cancel();lastCancel=Date.now();tr('朗读 '+n+'：超时');next()},txt.length*420+12000);
    setTimeout(()=>{if(my!==alive||began||!playing)return;clearTimeout(guard);if(!retry){syn.cancel();lastCancel=Date.now();tr('朗读 '+n+'：1.5 秒未开始，重试');setTimeout(()=>{if(my===alive)go(true)},300)}else{tr('朗读 '+n+'：重试后仍未开始');noSound();syn.cancel();lastCancel=Date.now();next()}},retry?4000:1500);
    try{syn.resume()}catch(e){}syn.speak(u)};go(false)}
function noSound(){if(noted)return;noted=true;bubble('ai note','这一句没有读出来，后面会继续尝试。诊断：语音引擎'+(syn?'有':'无')+'，可用声音 '+(syn?syn.getVoices().length:0)+' 个'+(lastErr?'，错误 '+lastErr:'，朗读未开始')+'。')}
function testSound(){if(!syn){bubble('ai note','测试：这个页面没有语音引擎。');return}const l=syn.getVoices(),zh=l.filter(x=>/^zh/i.test(x.lang)),log=[];stopSpeech();stopRec();paused=true;setS('pause');const d=bubble('ai note','测试中…');
  const show=()=>{d.textContent='声音 '+l.length+' 个，中文 '+zh.length+' 个'+(zh[0]?'（'+zh[0].name+'）':'')+'。'+log.join('；')+'。听到后点圆球继续。';scroll()};
  const one=(t,lang,tag,then)=>{const u=new SpeechSynthesisUtterance(t);u.lang=lang;if(lang==='zh-CN'&&zh[0])u.voice=zh[0];let fin=false;const f=x=>{if(fin)return;fin=true;log.push(tag+x);show();then&&setTimeout(then,300)};u.onstart=()=>{log.push(tag+'开始');show()};u.onend=()=>f('结束');u.onerror=e=>f('错误 '+(e&&e.error));syn.speak(u);setTimeout(()=>f('超时'),9000)};
  setTimeout(()=>one('测试声音，一二三。','zh-CN','中文',()=>one('Testing sound, one two three.','en-US','英文')),300)}
function clauses(t){if(!nReady||t.length<=12)return [t];const out=[];let cur='';for(const p of t.split(/(?<=[，、,：:])/)){if(cur&&(cur+p).length>18){out.push(cur);cur=p}else cur+=p}if(cur)out.push(cur);return out}
function feed(t){for(const c of clauses(t)){q.push(c);if(nReady)synth(c)}pump()}
function sayAll(t){streamDone=false;spoken=t;(t.match(SENT)||[t]).forEach(feed);streamDone=true;pump()}
let lastSaid='',lastEnd=0;
const autoOn=()=>$v('animAuto').textContent==='停止连续';let narrPos=-1,narrating=-1;
function narrate(){narrating=st.pos;sayAll(stepLine())}
function doneTalking(){if(spoken){lastSaid=spoken;lastEnd=Date.now()}spoken='';if(!chat)return;
  if(autoOn()&&!paused){if(narrating===st.pos){narrPos=st.pos;narrating=-1;setS('speak');$v('vState').textContent='连续播放中';return}if(narrPos!==st.pos){setTimeout(()=>{if(chat&&autoOn())narrate()},0);setS('speak');return}setS('speak');return}if(paused){setS('pause');return}setS(micOK?'listen':'type');setTimeout(preNext,300);const m=++listenTok;setTimeout(()=>{if(m===listenTok&&state==='listen')startRec()},HALF?500:0)}
/* tools the model can use */
const TOOLS=[{name:'go_step',description:'翻到下一步或上一步。用户说做好了、要继续时用 next。',inputSchema:{type:'object',properties:{direction:{type:'string',enum:['next','prev']}},required:['direction']},execute:({direction})=>{const b=st.pos;goStep(direction==='prev'?-1:1);return st.pos===b?{note:'已经到头了',...info()}:info()}},
 {name:'jump_step',description:'跳到说明书的第几步。步骤编号可以是数字，也可以是 B3、E2、C4 这样的编号。',inputSchema:{type:'object',properties:{step:{type:['number','string']}},required:['step']},execute:({step})=>{const id=stepOf(step);if(!id)throw new Error('没有这一步');jump(id);return info()}},
 {name:'animation',description:'控制屏幕上的组装动画：replay 重播，pause 暂停，play 继续，slow 慢放，normal 正常速度，continuous 从当前步开始连续播放后面的步骤。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['replay','pause','play','slow','normal','continuous']}},required:['action']},execute:({action})=>{anim(action);return{ok:true}}},
 {name:'show',description:'在屏幕上把镜头对准一个零件并高亮，可同时重播这一步动画的一段。part 用零件名或编号，比如 短螺丝、钢条、支撑腿、横销、110733。start、end 是这一步动画里的时间，零到一。用户问在哪、哪个、朝哪时配合回答使用。',inputSchema:{type:'object',properties:{part:{type:'string'},start:{type:'number'},end:{type:'number'}},required:['part']},execute:({part,start,end})=>{const r=show(part,start!=null&&end!=null?[start,end]:null);return r?{ok:true,...r}:{ok:false,note:'这一步的画面里找不到这个零件'}}},
 {name:'view',description:'控制屏幕上的三维画面，用户双手忙时用语音操作。action：left/right 左右转，rotate 按 amount 度旋转（负数向左），up/down 抬高压低视角，back 转到后面，front 正面，top 从上面看，bottom 从下面看，side_left/side_right 看侧面，zoom_in/zoom_out 放大缩小（amount 是倍数），pan_left/pan_right/pan_up/pan_down 平移，reset 复位，all 看整体，full_on 全屏，labels_on/labels_off 标签，real_on/real_off 真实材质或线稿，play/pause/replay/slow/normal/continuous 播放控制。要放大某个零件用 show。',inputSchema:{type:'object',properties:{action:{type:'string',enum:['left','right','rotate','up','down','back','front','top','bottom','side_left','side_right','zoom_in','zoom_out','pan_left','pan_right','pan_up','pan_down','reset','all','full_on','labels_on','labels_off','real_on','real_off','play','pause','replay','slow','normal','continuous']},amount:{type:'number'}},required:['action']},execute:({action,amount})=>{const r=viewDo(action,amount);if(!r)throw new Error('这个画面不支持');return{ok:r.ok,done:action,note:r.note}}},
 {name:'look_at_manual',description:'查看这一步的说明书原图。只在问外观、方向或位置，而步骤信息和已知问答答不了时才用。',inputSchema:{type:'object',properties:{}},execute:async()=>({image:await stepImage(),text:'第 '+here().s.id+' 步的说明书图'})}];
const hasView=()=>typeof Anim!=='undefined'&&!!Anim.view;
function viewDo(a,n){try{return hasView()?Anim.view(a,n):null}catch(e){return null}}
const VIEWCMD=[[/退出全屏|关闭全屏|取消全屏|不要全屏|小屏/,'full_off'],[/全屏|满屏|放到最大屏/,'full_on'],[/(隐藏|关掉|关闭|去掉|不要|不显示|收起)(标签|文字|标注)/,'labels_off'],[/(显示|打开|开|加上|要)(标签|文字|标注)|标签(打开|显示)/,'labels_on'],[/线稿|线条|线框|简笔|黑白/,'real_off'],[/真实材质|真实|实物|材质|真实效果/,'real_on'],
 [/复位|还原|重置|恢复(视角|画面|原样)?|回到原来|原来的样子|摆正|回正/,'reset'],[/看全部|看整体|看全貌|全部显示|整体|全景/,'all'],[/放大|大一点|大点|拉近|近一点|近点|凑近|看清楚|看细/,'zoom_in'],[/缩小|小一点|小点|拉远|远一点|远点/,'zoom_out'],
 [/(往|向|朝)?左(边)?(移|挪|平移|拖|拉)|画面左移|看左边/,'pan_left'],[/(往|向|朝)?右(边)?(移|挪|平移|拖|拉)|画面右移|看右边/,'pan_right'],[/(往|向|朝)?上(边|面)?(移|挪|平移|拖)/,'pan_up'],[/(往|向|朝)?下(边|面)?(移|挪|平移|拖)/,'pan_down'],
 [/转到?(后面|背面|背后)|看(后面|背面|背后)|转过来|转个身|掉个头|转半圈/,'back'],[/转到?(前面|正面)|看(前面|正面)/,'front'],[/从?(上面|上边|顶上|顶部|上方)(往下)?看|俯视|往下看|看(上面|顶上|顶部)|鸟瞰/,'top'],[/从?(下面|下边|底下|底部|下方)(往上)?看|仰视|往上看|看(下面|底下|底部)/,'bottom'],
 [/看左侧|左侧面|从左边看/,'side_left'],[/看右侧|右侧面|从右边看/,'side_right'],[/(往|向|朝)?左(边)?(转|旋转|扭|拧)|左转/,'left'],[/(往|向|朝)?右(边)?(转|旋转|扭|拧)|右转/,'right'],[/(抬高|高一点|高点|往上一点|上一点|抬一点|抬头)/,'up'],[/(低一点|低点|往下一点|下一点|压低|低头)/,'down'],[/转一下|转一转|转转|旋转|转一圈|换个角度|转个角度|再转|转一点|转.{1,5}度/,'rotate']];
const VIEWSAY={full_off:'语音对话时画面要保持全屏，说结束就退出。',full_on:'好，全屏。',labels_off:'好，标签藏起来了。',labels_on:'好，显示标签。',real_off:'好，换成线稿。',real_on:'好，换成真实材质。',reset:'好，复位了。',all:'好，看整体。',zoom_in:'好，放大。',zoom_out:'好，缩小。',pan_left:'好，往左看。',pan_right:'好，往右看。',pan_up:'好，往上看。',pan_down:'好，往下看。',back:'好，转到后面。',front:'好，转回正面。',top:'好，从上面看。',bottom:'好，从下面看。',side_left:'好，看左侧。',side_right:'好，看右侧。',left:'好，往左转。',right:'好，往右转。',up:'好，抬高一点。',down:'好，压低一点。',rotate:'好，转一下。'};
let lastView='';
function viewCmd(raw){if(!hasView())return null;const v=raw.replace(/[\s，。！？、,.!?；]/g,'');if(!v||v.length>12&&!/画面|视角|镜头|模型|动画|屏幕|视图/.test(v)||/螺丝|螺栓|拧紧|扳手|横销|木销|零件|孔|哪|吗|怎么|什么|为什么|几/.test(v))return null;
  if(/^(再来|再一次|再来一次|还要|继续转|再转一点)$/.test(v)&&lastView)return viewSay(lastView,null);const deg=v.match(/(\d+|[一二两三四五六七八九十百]+)度/);
  for(const[re,a]of VIEWCMD)if(re.test(v)){if(a==='full_off'&&chat)return VIEWSAY.full_off;let n=null;if(deg&&/^(left|right|rotate|up|down)$/.test(a))n=+deg[1]||cnNum(deg[1])||(deg[1]==='一百八十'?180:0);return viewSay(a,n)}return null}
function viewSay(a,n){const r=viewDo(a,n);if(!r)return null;lastView=a;return r.note?'好，'+r.note+'。':VIEWSAY[a]}
function anim(a){const c=id=>$v(id).click(),pl=$v('animPlay').textContent,sl=$v('animSlow').textContent;if(a==='replay')c('animRe');if(a==='continuous'&&$v('animAuto').textContent==='连续播放')c('animAuto');if(a==='pause'&&pl==='暂停')c('animPlay');if(a==='play'&&pl==='播放')c('animPlay');if(a==='slow'&&sl==='慢放')c('animSlow');if(a==='normal'&&sl!=='慢放')c('animSlow')}
const CN1={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};const cnNum=s=>{if(/^\d+$/.test(s))return +s;if(s==='十')return 10;const m=s.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);if(m)return (m[1]?CN1[m[1]]:1)*10+(m[2]?CN1[m[2]]:0);return CN1[s]||0};
/* short exact commands answer at once, without waiting for the model */
function quick(raw){const t=raw.toLowerCase().replace(/[\s，。！？、,.!?]/g,'').replace(/^(返回到?|回到|跳到|去到?|到|转到|进行|开始|进入|做|看)/,'').replace(/^(第[\d一二两三四五六七八九十]{1,3})$/,'$1步').replace(/^(第.{1,3}|下一|上一)[部布不]$/,'$1步'),m=t.match(/^第(\d+|[一二两三四五六七八九十]{1,3})步$/);
  if(/说?(慢一点|慢点)说?$|说得?太快|语速.*慢/.test(t)){setPace(.2);return '好，我说慢一点。'}
  if(/说?(快一点|快点)说?$|说得?太慢|语速.*快/.test(t)){setPace(-.2);return '好，我说快一点。'}
  if(here().c.id==='32w'&&typeof pick==='function'&&!st.branch){if(/没有踢脚线|无踢脚线|^没有$/.test(t)){pick('none');return stepLine()}if(/有踢脚线|^有$/.test(t)){pick('skirt');return stepLine()}if(/下一步|做好了|做完了|好了/.test(t))return '这里要先选一下：墙边有踢脚线吗？说有，或者没有。'}
  if(/^(下一步|继续下一步|做完了|好了|做好了|好的|装好了|完成了|接下来|然后呢|下一个|next)$/.test(t)){const b=st.pos;goStep(1);return st.pos===b?'已经是最后一步了。':stepLine()}
  if(/^(上一步|back)$/.test(t)||raw.trim()==='返回'){goStep(-1);return stepLine()}
  const pf=t.match(/^(书柜|加高|转角|门)(?:单元)?第?(\d+|[一二两三四五六七八九十]{1,3})[步部布不]$/);if(pf){const id={书柜:'B',加高:'E',转角:'C',门:'D'}[pf[1]]+cnNum(pf[2]);if(!byId[id])return '没有这一步。';jump(id);return stepLine()}
  if(m){const id=stepOf(cnNum(m[1]));if(!id)return '没有这一步。';jump(id);return stepLine()}
  if(/^(再说一遍|重复|再讲一遍|没听清|怎么做|怎么装|这一?步怎么(做|装)|这一?步做什么|repeat)$/.test(t))return stepLine();
  const vc=viewCmd(raw);if(vc){qLayer='cmd';return vc}
  const fa=faqAns(raw);if(fa)return fa;
  if(/注意什么|要注意|有什么注意/.test(t)){const w=info().warn;return w.length?w.join(''):'这一步没有特别的注意事项。'}
  if(/第几步|到哪了|进度/.test(t)){const i=info();return '现在是第 '+i.step+' 步，'+i.title+(i.drawer?'，第 '+i.drawer.split('/')[0]+' 个抽屉':'')+'。'}
  if(/^(再演示一遍|重播|再看一遍|replay)$/.test(t)){anim('replay');return '好，再看一遍。'}
  if(/^(暂停|pause)$/.test(t)){anim('pause');return '好。'}
  if(/^(继续|播放|play)$/.test(t)){anim('play');return '好。'}
  if(/^(连续播放|自动播放|一直播放|continuous)$/.test(t)){anim('continuous');return '好，我们一步一步来，想停就点打断。'}
  if(/^(动画慢放|慢放|slow)$/.test(t)){anim('slow');return '好，慢放。'}
  if(/什么零件|哪些零件|要什么|用什么|几个零件|零件/.test(t))return partsLine();
  return null}
function ctx(){const i=info(),s=here().s,f=FAQ&&FAQ[s.id]||[],a=hasAnim()&&Anim._t?{t:+Math.min(1,Anim._t()).toFixed(2),focus:Anim._foc()?Anim._foc().name:null}:null;return{step:i.step,title:i.title,drawer:i.drawer,parts:i.parts.map(p=>p.name+' '+p.qty+' 个'+(p.cell?'，'+p.cell+' 格':'')),guide:i.guide,warn:i.warn,unsure:s.unsure||[],faq:f.map(e=>e.q[0]+'：'+e.a),anim:a}}
const PROMPT=()=>`你是陪用户组装 ${PNAME} 的语音助手，语气像身边有经验的朋友。
你的话会被朗读，要像朋友站在旁边说话：用短句和大白话，每句不超过 15 字，多用逗号断句，可以用“好”“对”“先”“然后”“别急”这样的词。一次回答一般不超过 50 字，不用列表、编号、符号和括号，不提“图片”或“数据”这类词，不读零件编号，数字用汉字写，比如两根、四颗。一次只说一件事。用户说英文就用英文答，否则用简体中文。
只依据下面的步骤信息和已知问答回答，不确定就直说并建议对照说明书，不要猜。墙面固定、翻转桌子、要不要两个人这类安全问题，不要自己推断，只说说明书怎么画的，并建议对照说明书。
用户的话已经转成文字给你了，不要说没听见、没听清或没听懂。语音转文字可能有错字或只有半句，请结合这一步推断最可能的意思并直接回答，开头可以用一句话说你的理解。只有几种理解的答案差别很大时，才问一句，并说出你想到的具体选项让用户选。用户打断你时，你上一句会标着“被用户打断”，此时不要重复或继续原来的话，先按用户的新说法修正理解。
用户说做好了或想继续时调用 go_step，再用返回的 guide 口语化地讲下一步；想回看时调用 jump_step；想再看动作时调用 animation。${hasAnim()?'说到某个零件在哪、朝哪时，调用 show 在屏幕上指给用户看。':''}${hasView()?'你能控制屏幕画面：旋转、从上面看、放大缩小、平移、复位、全屏、标签、真实材质和播放，用户要求时调用 view 去做，不要说做不到。':''}${sample&&sample.toolImages?'问外观、方向或位置，而下面的信息答不了时，才调用 look_at_manual 看这一步的说明书图。':''}
现在：${JSON.stringify(ctx())}
全部步骤：${JSON.stringify(STEPS.map(x=>({id:x.id,title:x.title})))}`;
async function turn(text){const q0=text.trim();if(!q0||!chat)return;const my=++turnId;if(ctl)ctl.abort();stopSpeech();streamDone=true;paused=false;bubble('me',q0);hist.push({role:'user',content:q0});unshow();qStart(q0);
  qLayer='';const fastA=quick(q0);if(fastA!==null){curQ.layer=qLayer||'cmd';saveVS();bubble('ai',fastA);hist.push({role:'assistant',content:fastA});sayAll(fastA);return}
  if(!sample){const x='这句要设置密钥后才能回答。现在可以说下一步、上一步、第三步、再说一遍、要什么零件、注意什么。';bubble('ai',x);hist.push({role:'assistant',content:x});sayAll(x);return}
  setS('think');startRec();streamDone=false;ctl=new AbortController();let all='',buf='';const b=bubble('ai','');
  let moved=false,acted=false,fed=false;const tools=TOOLS.filter(t=>t.name==='view'?hasView():t.name==='show'?hasAnim():t.name==='look_at_manual'?!!sample.toolImages:true).map(t=>({...t,execute:async i=>{const r=await t.execute(i);acted=true;if(!/^(animation|show|look_at_manual|view)$/.test(t.name))moved=true;return r}}));const ack=setTimeout(()=>{if(my===turnId&&!all){tr('先回应：'+ACK);feed(ACK)}},600);
  const take=d=>{all+=d;spoken=all;buf+=d;b.textContent=all;scroll();let m;while((m=buf.match(/^[\s\S]*?[。！？!?；\n]/))){buf=buf.slice(m[0].length);if(m[0].trim()){fed=true;feed(m[0].trim())}}if(!fed&&(m=buf.match(/^[\s\S]{4,}?[，,、：:]/))){buf=buf.slice(m[0].length);fed=true;feed(m[0].trim())}};
  try{let images;if(!sample.toolImages)try{images=[await stepImage()]}catch(e){}const r=await sample([{role:'user',content:PROMPT()},...hist.slice(-6)],{tools,images,modelTier:'quick',cache:false,signal:ctl.signal,onText:({text:t,delta})=>{if(my===turnId)take(delta!=null?delta:t.slice(all.length))}});
    clearTimeout(ack);if(my!==turnId)return;if(!all&&r.text)take(r.text);if(buf.trim())feed(buf.trim());buf='';hist.push({role:'assistant',content:all||'好。'});streamDone=true;pump()}
  catch(e){clearTimeout(ack);if(my!==turnId||(e&&e.code==='cancelled'))return;const x=all?'':moved?stepLine():acted?'好。':(e&&e.code==='overloaded'?'服务器现在太忙，请再说一次。':msg(e&&e.code));tr('接口错误：'+(e&&(e.message||e.code)));if(x)b.textContent=x+(!acted&&e&&e.message?'（'+e.message+'）':'');if(!all)hist.pop();streamDone=true;if(x)sayAll(x);else pump()}}
/* speech in */
let pend='',sendT=0;
function flushSpeech(){clearTimeout(sendT);const t=pend;pend='';if(live){live.remove();live=null}if(t)turn(t)}
function stopRec(){if(rec&&recOn){try{rec.abort()}catch(e){}}recOn=false;clearTimeout(offT);recLive=false}
function startRec(){if(!chat||!micOK||paused||recOn)return;if(HALF&&!barge&&(state!=='listen'||playing||q.length))return;rec=new SR();rec.lang='zh-CN';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;const t0=Date.now(),me=rec;
  const ready=on=>{if(me!==rec)return;clearTimeout(offT);if(on){if(!recLive&&state==='listen')cue();recLive=true;if(state==='listen')paintListen()}else offT=setTimeout(()=>{recLive=false;if(state==='listen')paintListen()},1800)};rec.onstart=()=>ready(true);rec.onresult=e=>{if(me!==rec)return;if(cueT&&cueRes==null&&state==='listen')cueRes=Date.now()-cueT;let t='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}
    if(HALF&&!barge&&state!=='listen')return;
    if(Date.now()-lastEnd<8000&&t.replace(/\s/g,'').length>=4&&isEcho(t,lastSaid)){if(live){live.remove();live=null}tr('已忽略回声');return}
    if((state==='speak'||state==='think')&&isEcho(t))return;
    if(state==='speak'||state==='think'){if(!/(等等|等一下|停一下|停下|打断|不对|不是)/.test(t))return;interrupt(true);return}
    clearTimeout(sendT);const shown=(pend+t).trim();if(!live)live=bubble('me live','');live.textContent=shown;scroll();if(fin){pend=shown;speechEnd=Date.now();if(pend.length<=5&&/(步|遍|了|停|播放|暂停|重播|零件)$/.test(pend))flushSpeech();else sendT=setTimeout(flushSpeech,1500)}};
  rec.onerror=e=>{tr('麦克风：'+e.error);if(e.error==='not-allowed'||e.error==='service-not-allowed'||e.error==='audio-capture'){if(!window.NORDEN_TTS){try{localStorage.setItem('norden-mic','no')}catch(x){}}micOff()}if(e.error==='no-speech')fast=0};
  rec.onend=()=>{recEnd=Date.now();ready(false);if(me!==rec)return;recOn=false;if(!micOK||!chat||paused)return;if(Date.now()-t0<400){if(++fast>5){if(!window.NORDEN_TTS){micOff();return}fast=0;setTimeout(startRec,2500);return}}else fast=0;setTimeout(startRec,0)};
  try{rec.start();recOn=true}catch(e){recOn=false}}
function micOff(){micOK=false;$v('vChat').classList.add('kb');if(state==='listen')setS('type');$v('vChat').classList.add('dictate');$v('vTxt').placeholder='点这里，再点键盘上的话筒说话'}
function isEcho(t,src){const a=t.replace(/[\s，。！？、,.!?；]/g,''),b=(src==null?spoken:src).replace(/[\s，。！？、,.!?；]/g,'');if(!a)return true;if(!b)return false;if(a.length<2)return b.includes(a);let n=0;for(let i=0;i<a.length-1;i++)if(b.includes(a.slice(i,i+2)))n++;return n/(a.length-1)>.45}
function interrupt(keepRec){clearTimeout(sendT);if(autoOn())Anim.stopAuto();narrating=-1;narrPos=-1;const said=spoken;turnId++;if(ctl)ctl.abort();stopSpeech();streamDone=true;spoken='';lastEnd=0;lastSaid='';if(said){const l=hist[hist.length-1];if(l&&l.role==='assistant')l.content=said+'（说到这里被用户打断）';else hist.push({role:'assistant',content:said+'（说到这里被用户打断）'})}setS(micOK?'listen':'type');$v('vState').textContent=micOK?'已打断，请说':'已打断，请打字';if(micOK&&!keepRec){stopRec();setTimeout(startRec,120)}}
function orb(){if(state==='speak'||state==='think')interrupt();else if(state==='listen'){paused=true;stopRec();setS('pause')}else if(state==='pause'){paused=false;doneTalking()}else if(state==='type'){if(SR&&window.NORDEN_TTS){micOK=true;$v('vChat').classList.remove('dictate');$v('vTxt').placeholder='也可以打字';setS('listen');startRec()}else $v('vTxt').focus()}}
function open(){unlock();initN();chat=true;paused=false;hist=[];fast=0;micOK=!!SR&&!blocked;$v('vLog').replaceChildren();if(!micOK)micOff();$v('anim').classList.add('vc');if(!$v('anim').classList.contains('full'))$v('animFull').click();if($v('fMode').textContent==='看整体')$v('fMode').click();setTimeout(()=>window.dispatchEvent(new Event('resize')),200);setS('speak');const g='你好，我们开始吧。'+stepLine()+'有问题随时问我，做好了就说一声。';bubble('ai',g);hist.push({role:'assistant',content:g});if(!micOK)$v('vTxt').focus();sayAll(g)}
function close(){clearTimeout(sendT);pend='';if(autoOn())Anim.stopAuto();narrPos=-1;narrating=-1;chat=false;turnId++;if(ctl)ctl.abort();stopSpeech();stopRec();setS('idle');if(live){live.remove();live=null}const a=$v('anim');a.classList.remove('vc');if(a.classList.contains('full'))$v('animFull').click()}
let aRec=null;
function askVoice(btn){const q=$v('q'),idle=()=>{btn.textContent='语音提问';btn.classList.remove('primary');aRec=null};if(aRec){aRec.abort();idle();return}if(!SR||!window.NORDEN_TTS){btn.textContent='这里不能用麦克风，请打字';return}unlock();initN();stopSpeech();const r=aRec=new SR();r.lang='zh-CN';r.interimResults=true;let done='',timer=0;btn.textContent='红灯：现在请说，点此取消';btn.classList.add('primary');
  const fire=()=>{const t=q.value.trim();try{r.abort()}catch(e){}idle();if(!t)return;$v('send').click();btn.textContent='思考中…';const w=setInterval(()=>{if($v('send').disabled)return;clearInterval(w);btn.textContent='语音提问';const x=$v('ans').textContent;if(x&&x!=='思考中…')sayAll(x)},200)};
  r.onresult=e=>{clearTimeout(timer);let t='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){t+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}q.value=(done+t).trim();if(fin){done=q.value;timer=setTimeout(fire,1500)}};
  r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){idle();btn.textContent='麦克风被拒绝，请打字'}};r.onend=()=>{if(aRec===r&&!timer&&!done)idle();else if(aRec===r&&done&&timer){try{const n=aRec=new SR();n.lang='zh-CN';n.interimResults=true;n.onresult=r.onresult;n.onerror=r.onerror;n.onend=r.onend;n.start()}catch(x){}}};
  try{r.start()}catch(e){idle()}}
function ui(){$v('vStart').onclick=open;const ar=$v('send')&&$v('send').closest('.askrow');if(ar&&window.NORDEN_TTS){const b=document.createElement('button');b.className='btn';b.id='askVoice';b.style.cssText='width:100%;margin-top:8px';b.textContent='语音提问';b.onclick=()=>askVoice(b);ar.after(b)}$v('vInt').onclick=()=>interrupt();const bb=$v('vBarge'),bs=()=>{bb.textContent=barge?'开口打断：开':'开口打断：关';bb.classList.toggle('primary',barge)};bs();bb.onclick=()=>{barge=!barge;try{localStorage.setItem('norden-barge2',barge?'1':'0')}catch(e){}bs();if(barge&&(state==='speak'||state==='think'))startRec()};$v('vKb').onclick=()=>{const c=$v('vChat');c.classList.toggle('kb');if(c.classList.contains('kb'))$v('vTxt').focus()};$v('vEnd').onclick=close;$v('vOrb').onclick=orb;if($v('vTest'))$v('vTest').onclick=testSound;
  const send=()=>{const i=$v('vTxt'),t=i.value;i.value='';if(!micOK){i.blur();recEnd=Date.now()}turn(t)};$v('vSend').onclick=()=>{clearTimeout(dict);send()};$v('vTxt').oninput=()=>{if(micOK)return;clearTimeout(dict);if(state==='speak'||state==='think'){turnId++;if(ctl)ctl.abort();stopSpeech();streamDone=true;setS('type')}if($v('vTxt').value.trim())dict=setTimeout(send,1800)};$v('vTxt').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(dict);send()}};
  document.addEventListener('fullscreenchange',()=>{if(chat&&!document.fullscreenElement&&!$v('anim').classList.contains('full'))close()})}
return{ui,hold:()=>chat&&autoOn()&&narrPos!==st.pos,autoEnd(){if(chat&&!playing&&!q.length){narrating=-1;narrPos=-1;doneTalking()}},onStep(){if(chat)setTimeout(preNext,400);if(chat&&autoOn()&&narrPos!==st.pos&&narrating!==st.pos&&streamDone&&!playing&&!q.length)setTimeout(()=>{if(chat&&autoOn()&&narrating!==st.pos&&narrPos!==st.pos&&!playing&&!q.length)narrate()},120)},_s:()=>({chat,state,micOK,hist,faq:!!FAQ}),_faq:t=>faqFind(t),show,stats:vstats}})();
