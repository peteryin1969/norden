/* mvoice.js — turns a spoken or typed sentence into workshop actions. Rules only, runs on the device.
   parse(text) -> {acts:[{k,...}], say, deix} or null when it does not understand (the page may then ask the AI).
   deix: the sentence pointed ("这个", "这里") — the page resolves that with the mouse. */
(function(root){
const D={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
function cn(s){if(s==null||s==='')return NaN;s=String(s).trim();if(/^[\d.]+$/.test(s))return parseFloat(s);if(s==='半')return .5;let m=s.match(/^(.*?)点(.+)$/);if(m){const a=m[1]?cn(m[1]):0,b=[...m[2]].map(c=>D[c]).filter(v=>v!==undefined).join('');return a+parseFloat('0.'+(b||'0'))}
  let half=0;if(/半$/.test(s)){half=.5;s=s.slice(0,-1)}let n=0,cur=0,any=false;for(const c of s){if(c in D){cur=D[c];any=true}else if(c==='十'){n+=(cur||1)*10;cur=0;any=true}else if(c==='百'){n+=(cur||1)*100;cur=0;any=true}else return NaN}return any?n+cur+half:NaN}
const NUM='([\\d.]+|[零〇一二两三四五六七八九十百点半]+)';
/* a length in centimetres found in the sentence */
function len(t){const m=t.match(new RegExp(NUM+'\\s*(厘米|公分|cm|毫米|mm|米|m|寸)?'));if(!m)return null;const v=cn(m[1]);if(isNaN(v))return null;const u=m[2]||'厘米';return+(v*(u==='毫米'||u==='mm'?.1:u==='米'||u==='m'?100:u==='寸'?3.33:1)).toFixed(3)}
function named(t,key){const m=t.match(new RegExp(key+'\\s*(?:是|为|:|：)?\\s*'+NUM+'\\s*(厘米|公分|cm|毫米|mm|米|m)?'));if(!m)return null;const v=cn(m[1]);if(isNaN(v))return null;const u=m[2]||'厘米';return+(v*(u==='毫米'||u==='mm'?.1:u==='米'||u==='m'?100:1)).toFixed(3)}
const TOOLN={hammer:'锤子',phillips:'十字螺丝刀',flat:'一字螺丝刀',hex:'内六角扳手'};
function parse(raw){let t=String(raw||'').replace(/[，。！？,!?\s]+/g,'').replace(/\.(?!\d)/g,'').replace(/^(请|麻烦|帮我|给我)+/,'');if(!t)return null;const deix=/这|那|它/.test(t),A=(acts,say)=>({acts:Array.isArray(acts)?acts:[acts],say,deix});
  if(/^(确认|确定|好的?|是的?|对的?|可以|行|这样做|就这样)$/.test(t))return A({k:'yes'},'确认');
  if(/^(取消|不用了?|不要了?|算了|不对|不是|别)$/.test(t))return A({k:'no'},'取消');
  if(/能说什么|怎么说|帮助|有哪些指令/.test(t))return A({k:'help'},'指令说明');
  if(/取消录制|不录了/.test(t))return A({k:'rec',op:'cancel'},'取消录制');
  if(/(录完|录好了?|完成录制|录制完成|结束录制)/.test(t))return A({k:'rec',op:'done'},'完成录制');
  if(/(开始录制|录制动作|录一下|录动作|开始录)/.test(t))return A({k:'rec',op:'start'},'开始录制动作');
  if(/^(撤销|撤回|反悔|退回去|回退)/.test(t)||/撤销(一下|刚才)?/.test(t))return A({k:'undo'},'撤销');
  if(/^(重做|恢复刚才)/.test(t))return A({k:'redo'},'重做');
  if(/保存/.test(t))return A({k:'save'},'保存');
  let m;
  if((m=t.match(new RegExp('(?:第|到|去|跳到)'+NUM+'步'))))return A({k:'step',to:String(cn(m[1]))},'到第 '+cn(m[1])+' 步');
  if(/下一步|下个步骤|往后一步/.test(t))return A({k:'step',to:'next'},'下一步');
  if(/上一步|前一步|往前一步/.test(t))return A({k:'step',to:'prev'},'上一步');
  if(/重播|从头(播|放|来)|再放一遍|再播一遍/.test(t))return A({k:'play',op:'replay'},'从头播放');
  if(/暂停|停一下|^停$|停下/.test(t))return A({k:'play',op:'pause'},'暂停');
  if(/播放|放一遍|演示一下|播一下/.test(t))return A({k:'play',op:'play'},'播放');
  if(/原镜头|视角复位|回到原来的视角|镜头复位/.test(t))return A({k:'view',to:'reset'},'回到原镜头');
  if(/俯视|从上(面|边|方)?(往下)?看|顶视/.test(t))return A({k:'view',to:'top'},'从上面看');
  if((m=t.match(/(?:从|转到|换到)?(左|右|后|背|正|前)(?:边|面|方|侧)?(?:看|视角|视图)/)))return A({k:'view',to:{左:'left',右:'right',后:'back',背:'back',正:'reset',前:'reset'}[m[1]]},'从'+m[1]+'面看');
  if(/放大|拉近|近一点/.test(t))return A({k:'zoom',f:.75},'拉近');
  if(/缩小|拉远|远一点/.test(t))return A({k:'zoom',f:1.33},'拉远');
  if(/(删除|删掉|去掉|拿掉|移除|不要这)/.test(t))return A({k:'del'},'删除这个零件');
  if(/再(取|拿|来|加|要)(一|1)?(个|颗|块|根|只)/.test(t)||/(多|加)(一|1)(个|颗|根)(一样|同样)/.test(t))return A({k:'take'},'从仓库再取一个');
  /* tools */
  if(/(用|拿|上|加)/.test(t)||/^(敲|拧)/.test(t)){const ty=/锤|榔头|敲/.test(t)?'hammer':/一字/.test(t)?'flat':/内六角|扳手/.test(t)?'hex':/十字|螺丝刀|起子|拧/.test(t)?'phillips':null;if(ty)return A({k:'tool',type:ty},'用'+TOOLN[ty]+(deix?'，对准指着的零件':''))}
  if(/(放|移|挪|搬|拿)(到|在|去)?这(里|儿|边|个位置|个地方)/.test(t))return A({k:'place'},'放到鼠标指着的地方');
  if(/(固定|装|贴|安|粘|钉)(到|在)(这|那|它)(个|块|根|颗)?(零件|板)?(上面?|上边)?/.test(t))return A({k:'attach'},'固定到鼠标指着的零件上');
  /* new parts by size */
  if(/(加|新建|来|做|放|要)(一|1)?(块|个|张).{0,6}板/.test(t)){const l=named(t,'长'),w=named(t,'宽'),th=named(t,'厚');return A({k:'board',l:l||60,w:w||30,t:th||1.8},'新建一块板：长 '+(l||60)+'、宽 '+(w||30)+'、厚 '+(th||1.8)+' 厘米')}
  if(/(加|新建|来|做|放|要)(一|1)?(根|个).{0,6}(圆柱|销|杆|管|棒)/.test(t)){const d=named(t,'直径')||named(t,'粗'),l=named(t,'长');return A({k:'cyl',d:d||.8,len:l||3},'新建一根圆柱件：直径 '+(d||.8)+'、长 '+(l||3)+' 厘米')}
  /* timing */
  if(/(提前|早一点|早点)/.test(t))return A({k:'retime',d:-.1},'动作提前一点');
  if(/(推后|延后|晚一点|晚点|推迟)/.test(t))return A({k:'retime',d:.1},'动作推后一点');
  /* turning */
  if(/(转|旋转|翻|掉头|调头)/.test(t)&&!/转到|视角/.test(t)){let deg=90;const dm=t.match(new RegExp(NUM+'度'));if(dm&&!isNaN(cn(dm[1])))deg=cn(dm[1]);else if(/掉头|调头|转过来|翻过来|翻面|翻个面|反过来/.test(t))deg=180;else if(/一点|稍微|稍稍/.test(t))deg=15;
    let ax='y',s=1,nm='平转';if(/翻/.test(t)){if(/左|右|侧/.test(t)){ax='z';nm='左右翻';s=/右/.test(t)?-1:1}else{ax='x';nm='前后翻';s=/后/.test(t)?-1:1}}else{s=/右|顺时针/.test(t)?-1:1;nm=s<0?'向右平转':'向左平转'}
    return A({k:'turn',axis:ax,deg:s*deg},nm+' '+deg+' 度')}
  /* moving */
  if(/(移|挪|推|拉|抬|升|降|放低|靠|往|向|朝|高一点|低一点)/.test(t)){const dir=/左/.test(t)?['左',[-1,0,0]]:/右/.test(t)?['右',[1,0,0]]:/(上|抬|升|高)/.test(t)?['上',[0,1,0]]:/(下|降|低)/.test(t)?['下',[0,-1,0]]:/(前|靠近我|外)/.test(t)?['前',[0,0,1]]:/(后|里|远离我)/.test(t)?['后',[0,0,-1]]:null;
    if(dir){const rest=t.replace(/[一1]点点|一丢丢/,'').replace(/一点|一些|一下|稍微|稍稍/g,'');let n=len(rest);if(n==null)n=/点点|一丢丢/.test(t)?.5:/很多|一大截|好多/.test(t)?10:1;return A({k:'move',d:dir[1].map(v=>v*n)},'往'+dir[0]+'移 '+n+' 厘米')}}
  if((m=t.match(/^(?:选中?|选择|找到?|定位到?|看看)(.+)$/))){const q=m[1].replace(/^(这个|那个|一下)/,'');if(q)return A({k:'find',q},'选中“'+q+'”')}
  if(/^(选中?|选择)(这|那)(个|块|颗|根)?$/.test(t)||/^(就)?(这|那)(个|块|颗|根)$/.test(t))return A({k:'pick'},'选中指着的零件');
  return null}
const HELP=['把这个往左移 5 厘米 / 抬高一点 / 往后挪两厘米','这个转 90 度 / 向右转 / 翻过来','放到这里（鼠标指着要放的地方）','固定到这个上（鼠标指着另一个零件）','用锤子敲这个 / 用十字螺丝刀拧这个','再拿一个 / 删除这个','加一块板，长 60 宽 30 厚 1.8','选中垫块 / 找 117494','下一步 / 上一步 / 到第 5 步 / 播放 / 暂停','从左边看 / 俯视 / 原镜头 / 放大 / 缩小','开始录制 / 录完了 / 提前一点 / 推后一点','撤销 / 重做 / 保存'];
root.MVoice={parse,cn,len,HELP};if(typeof module!=='undefined')module.exports=root.MVoice;
})(typeof window!=='undefined'?window:globalThis);
