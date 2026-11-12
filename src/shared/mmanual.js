/* mmanual.js — the logic of the manual editor (no 3D, no page): the list of parts a manual may use, a first reading of a
   spoken or typed step by rules, the checks of a manual against the parts list, and the outputs (step data, printable manual).
   A step is {id,text,u,ok,by}; u (what was understood) is {title,parts:[[key,qty]],joins:[{a,b,with,qty,pa,pb}],flip,repeat,tool,warn[],ask[]}.
   A point (pa, pb) is {kind:'hole'|'corner'|'edge'|'face',i,name,p:[x,y,z],n?:[x,y,z]} in the part's own frame, centimetres. */
(function(root){
const D={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
function cn(s){s=String(s).trim();if(/^[\d.]+$/.test(s))return parseFloat(s);let n=0,cur=0,any=false;for(const c of s){if(c in D){cur=D[c];any=true}else if(c==='十'){n+=(cur||1)*10;cur=0;any=true}else if(c==='百'){n+=(cur||1)*100;cur=0;any=true}else return NaN}return any?n+cur:NaN}
const NUM='(\\d+|[零〇一二两三四五六七八九十百]+)',UNIT='(?:个|颗|块|根|片|只|条|套|把|张|枚|件|对|扇)';
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),html=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MM={
  cn,
  /* what a manual may use: numbered hardware (quantity from the client's parts list) and named parts of the model */
  library(M,rows){const H=(rows&&rows[0])||[],ci=H.indexOf('code'),ni=H.indexOf('name'),qi=H.indexOf('qty'),csv={};if(ci>=0)(rows||[]).slice(1).forEach(r=>{csv[r[ci]]={name:ni>=0?r[ni]:'',qty:qi>=0?+r[qi]||0:0}});
    const by=new Map(),add=(key,o,p)=>{if(!by.has(key))by.set(key,Object.assign({key,nodes:[],scene:p.scene},o));by.get(key).nodes.push(p.node)};
    (M.parts||[]).filter(p=>!p.removed&&p.kind!=='tool').forEach(p=>{if(p.kind==='group'){if(p.name)add('n:'+p.name,{name:p.name,hw:false,group:true},p)}else if(p.code)add(p.code,{code:p.code,name:(csv[p.code]&&csv[p.code].name)||p.name||p.code,hw:true},p);else if(p.name)add('n:'+p.name,{name:p.name,hw:false},p)});
    const L=[...by.values()];L.forEach(it=>{it.node=it.nodes[0];it.qty=it.code&&csv[it.code]&&csv[it.code].qty?csv[it.code].qty:it.nodes.length});
    Object.entries(csv).forEach(([c,v])=>{if(!by.has(c))L.push({key:c,code:c,name:v.name||c,hw:true,nodes:[],node:null,qty:v.qty,no3d:true})});
    return L.sort((a,b)=>(a.hw?1:0)-(b.hw?1:0)||a.name.localeCompare(b.name,'zh'))},
  item:(lib,key)=>lib.find(x=>x.key===key),
  label:(lib,key)=>{const it=lib.find(x=>x.key===key);return it?it.name+(it.code&&it.name!==it.code?'（'+it.code+'）':''):key||'？'},
  tag:(it,pt)=>'【'+it.name+(pt?'·'+pt.name:'')+'】',
  /* a first reading by rules; the page shows it for the person to confirm or correct */
  understand(text,lib){const t0=String(text||''),t=t0.replace(/\s+/g,''),u={title:'',parts:[],joins:[],flip:'',repeat:1,tool:'',warn:[],ask:[]};if(!t)return u;
    /* mentions: tags first, then names (longest first) and codes */
    const men=[],taken=[],free=(a,b)=>!taken.some(x=>a<x[1]&&b>x[0]),put=(i,j,it,pt)=>{if(!free(i,j))return;taken.push([i,j]);men.push({i,j,it,pt})};
    t.replace(/【([^】·]+)(?:·([^】]+))?】/g,(m,n,pn,i)=>{const it=lib.find(x=>x.name===n);if(it)put(i,i+m.length,it,pn||null);return m});
    lib.slice().sort((a,b)=>b.name.length-a.name.length).forEach(it=>{[...new Set([it.name,it.name.replace(/[（(].*?[）)]/g,''),it.code])].filter(w=>w&&w.length>1).forEach(w=>{let i=-1;while((i=t.indexOf(w,i+1))>=0)put(i,i+w.length,it,null)})});
    men.sort((a,b)=>a.i-b.i);
    men.forEach(m=>{const pre=t.slice(Math.max(0,m.i-8),m.i).match(new RegExp(NUM+UNIT+'?(?:的)?$')),post=t.slice(m.j,m.j+8).match(new RegExp('^(?:各|共|一共)?'+NUM+UNIT));let q=pre?cn(pre[1]):post?cn(post[1]):NaN;m.q=isNaN(q)?null:q});
    const tot=new Map();men.forEach(m=>{const k=m.it.key;if(!tot.has(k))tot.set(k,{q:0,known:false});if(m.q!=null){tot.get(k).q+=m.q;tot.get(k).known=true}});
    tot.forEach((v,k)=>{const it=MM.item(lib,k);u.parts.push([k,v.known?v.q:1]);if(!v.known&&it.hw)u.ask.push('“'+it.name+'”这一步用几个？我先按 1 个记。')});
    /* "用 … 把 A 装到 B": what comes right after 用 is what it is fastened with; the rest are the parts joined, in the order said */
    men.forEach((m,k)=>{const from=k?men[k-1].j:0,gap=t.slice(Math.max(from,m.i-14),m.i);m.w=/(用|拿|靠)[^把将]*$/.test(gap)&&!/(把|将)/.test(gap);m.ba=/(把|将)[^，,。；;]*$/.test(gap)});
    let body=men.filter(m=>!m.w),hw=men.filter(m=>m.w);if(!hw.length&&body.filter(m=>!m.it.hw).length>=2){hw=body.filter(m=>m.it.hw&&!m.ba);body=body.filter(m=>!m.it.hw||m.ba)}
    if(body.length>=2){for(let k=1;k<body.length;k++){const a=body[0],b=body[k];if(a.it.key===b.it.key&&!a.pt&&!b.pt)continue;const w=hw[0];u.joins.push({a:a.it.key,b:b.it.key,with:w?w.it.key:'',qty:w&&w.q!=null?w.q:w?1:0,pa:null,pb:null,pan:a.pt||'',pbn:b.pt||''})}}
    else if(body.length===1&&hw.length)u.joins.push({a:hw[0].it.key,b:body[0].it.key,with:'',qty:0,pa:null,pb:null,pan:hw[0].pt||'',pbn:body[0].pt||''});
    if(!u.joins.length)u.ask.push(men.length?'没有听出这一步是把哪个零件装到哪个零件上。':'这句话里没有认出材料清单里的零件。可以在右边点一下零件，把它插进句子里。');
    if(/翻面|翻过来|倒扣|倒过来|反过来|底朝上|朝下放/.test(t))u.flip='翻面';else if(/立起来|竖起来|立着|竖着/.test(t))u.flip='立起';else if(/放平|平放|躺下/.test(t))u.flip='放平';else if(/翻回|正过来|翻正/.test(t))u.flip='翻回正面';
    let m=t.match(new RegExp('(?:同样|一共|总共|共|再)?(?:做|装|重复)'+NUM+'(?:个|次|遍|套|组)'));if(m&&!isNaN(cn(m[1]))&&cn(m[1])>1&&!men.some(x=>x.i>=m.index&&x.i<m.index+m[0].length+6))u.repeat=cn(m[1]);else if(/另一(边|侧|面|头)(也)?(同样|一样|照样)|两(边|侧|头)(都)?(一样|同样)/.test(t))u.repeat=2;
    u.tool=/锤|榔头|敲/.test(t)?'锤子':/一字/.test(t)?'一字螺丝刀':/内六角|扳手/.test(t)?'内六角扳手':/十字/.test(t)?'十字螺丝刀':/螺丝刀|起子|拧/.test(t)?'螺丝刀':'';
    t0.split(/[。；;！!\n]/).map(s=>s.trim()).filter(s=>/注意|小心|不要|别(?!的)|两人|两个人|务必|千万|当心/.test(s)).forEach(s=>u.warn.push(s.replace(/^(注意|小心)[:：，,]?/,'')||s));
    u.title=t.replace(/【([^】·]+)(?:·[^】]+)?】/g,'$1').split(/[。；;，,！!]/)[0].slice(0,18);return u},
  /* one sentence that says what was understood, always built from the structure itself */
  restate(u,lib){const L=k=>MM.label(lib,k),out=[];(u.joins||[]).forEach(j=>{out.push((j.with?'用 '+(j.qty||1)+' 个 '+L(j.with)+' ':'')+'把 '+L(j.a)+(j.pa?' 的'+j.pa.name:'')+' 接到 '+L(j.b)+(j.pb?' 的'+j.pb.name:''))});
    if(!out.length&&(u.parts||[]).length)out.push('用到 '+u.parts.map(p=>p[1]+' 个 '+L(p[0])).join('、'));const more=[];if(u.flip)more.push('先把整体'+u.flip);if(u.repeat>1)more.push('同样做 '+u.repeat+' 次');if(u.tool)more.push('用'+u.tool);(u.warn||[]).forEach(w=>more.push('注意：'+w));
    return(out.join('；')||'还没有内容')+(more.length?'。'+more.join('；'):'')+'。'},
  /* the manual against the parts list */
  check(steps,lib){const used={},R={used,over:[],under:[],todo:0,noJoin:[],noPoint:[],ask:[]};steps.forEach((s,i)=>{if(!s.ok){R.todo++;return}const u=s.u;(u.parts||[]).forEach(([k,q])=>{used[k]=(used[k]||0)+q*(u.repeat||1)});if(!(u.joins||[]).length)R.noJoin.push(i+1);else if(u.joins.some(j=>!j.pa||!j.pb))R.noPoint.push(i+1)});
    lib.forEach(it=>{const n=used[it.key]||0;if(n>it.qty)R.over.push({key:it.key,name:it.name,used:n,qty:it.qty});else if(n<it.qty)R.under.push({key:it.key,name:it.name,used:n,qty:it.qty})});R.done=!R.todo&&!R.over.length&&!R.under.length&&steps.length>0;return R},
  /* the step data the platform works from */
  toDraft(steps,lib){return steps.filter(s=>s.ok).map((s,i)=>{const u=s.u,o={id:String(i+1),title:u.title||('第 '+(i+1)+' 步'),do:[MM.restate(u,lib)],parts:(u.parts||[]).filter(p=>{const it=MM.item(lib,p[0]);return it&&it.code}).map(p=>[p[0],p[1]]),warn:(u.warn||[]).slice(),unsure:[]};if(u.repeat>1)o.repeat=u.repeat;if(u.tool)o.tool=u.tool;if(u.flip)o.flip=u.flip;
      o.joins=(u.joins||[]).map(j=>({a:j.a,b:j.b,with:j.with||null,qty:j.qty||0,pa:j.pa||null,pb:j.pb||null}));o.said=s.text;return o})},
  printHTML(man,lib){const L=k=>MM.label(lib,k),S=man.steps.filter(s=>s.ok);return'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>'+html(man.title||'装配手册')+'</title><style>body{font:14px/1.6 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#1b2420}h1{font-size:22px}h2{font-size:16px;margin:22px 0 4px;border-top:1px solid #ccd;padding-top:12px}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:3px 8px;text-align:left;font-size:13px}.w{border-left:3px solid #a85b00;padding-left:8px;margin:4px 0}.m{color:#5d6963;font-size:12px}@media print{h2{break-after:avoid}section{break-inside:avoid}}</style></head><body><h1>'+html(man.title||'装配手册')+'</h1><p class="m">共 '+S.length+' 步。本手册在装配助手平台的手册编辑器里编写，零件和数量以材料清单为准。</p><h2>材料清单</h2><table><tr><th>名称</th><th>编号</th><th>数量</th></tr>'+lib.map(it=>'<tr><td>'+html(it.name)+'</td><td>'+html(it.code||'')+'</td><td>'+it.qty+'</td></tr>').join('')+'</table>'+
      S.map((s,i)=>{const u=s.u;return'<section><h2>第 '+(i+1)+' 步　'+html(u.title||'')+(u.repeat>1?'（同样做 '+u.repeat+' 次）':'')+'</h2><p>'+html(MM.restate(u,lib))+'</p>'+((u.parts||[]).length?'<table><tr><th>零件</th><th>数量</th></tr>'+u.parts.map(p=>'<tr><td>'+html(L(p[0]))+'</td><td>'+p[1]+'</td></tr>').join('')+'</table>':'')+(u.joins||[]).filter(j=>j.pa&&j.pb).map(j=>'<p class="m">结合点：'+html(L(j.a))+' 的'+html(j.pa.name)+' 对 '+html(L(j.b))+' 的'+html(j.pb.name)+'</p>').join('')+(u.warn||[]).map(w=>'<p class="w">'+html(w)+'</p>').join('')+'</section>'}).join('')+'</body></html>'},
  /* what the AI is asked, and how its answer is taken */
  prompt(text,lib,steps){return'你在帮客户编写一份装配手册的一个步骤。把他说的这一步整理成结构化内容。只输出一个 JSON 对象，不要别的字：\n{"title":"不超过 12 个字的步骤名","parts":[["零件key",数量]],"joins":[{"a":"被装上去的零件key","b":"装到哪个零件key","with":"紧固件key或空字符串","qty":紧固件数量}],"flip":"" 或 "翻面" 或 "立起" 或 "放平" 或 "翻回正面","repeat":重复次数,"tool":"" 或 "锤子" 或 "十字螺丝刀" 或 "一字螺丝刀" 或 "内六角扳手" 或 "螺丝刀","warn":["注意事项"],"ask":["你拿不准、需要客户回答的问题"]}\n规则：只能用下面清单里的 key；数量、尺寸、安全要求只按客户说的写，他没说的不要自己补，拿不准就写进 ask；句子里的【名称】或【名称·点】是客户用鼠标指明的零件和结合点，以它为准。\n材料清单（key｜名称｜总数）：\n'+lib.map(it=>it.key+'｜'+it.name+'｜'+it.qty).join('\n')+'\n前面已经确认的步骤：'+(steps.filter(s=>s.ok).map((s,i)=>(i+1)+'. '+MM.restate(s.u,lib)).join(' ')||'无')+'\n客户说：'+text},
  fromAI(o,lib,text){const has=k=>lib.some(x=>x.key===k),u={title:String(o.title||'').slice(0,18),parts:[],joins:[],flip:['翻面','立起','放平','翻回正面'].includes(o.flip)?o.flip:'',repeat:Math.max(1,Math.min(50,Math.round(+o.repeat)||1)),tool:['锤子','十字螺丝刀','一字螺丝刀','内六角扳手','螺丝刀'].includes(o.tool)?o.tool:'',warn:(o.warn||[]).map(String).slice(0,6),ask:(o.ask||[]).map(String).slice(0,6)};
    (o.parts||[]).forEach(p=>{if(Array.isArray(p)&&has(p[0])&&+p[1]>0)u.parts.push([p[0],Math.round(+p[1])]);else if(Array.isArray(p))u.ask.push('AI 提到了清单里没有的零件“'+p[0]+'”，已略去。')});
    (o.joins||[]).forEach(j=>{if(j&&has(j.a)&&has(j.b))u.joins.push({a:j.a,b:j.b,with:has(j.with)?j.with:'',qty:Math.max(0,Math.round(+j.qty)||0),pa:null,pb:null,pan:'',pbn:''})});
    /* points the person tagged in the sentence are kept */
    const r=MM.understand(text,lib);r.joins.forEach(x=>{const j=u.joins.find(y=>y.a===x.a&&y.b===x.b);if(j){j.pan=x.pan;j.pbn=x.pbn}});return u}};
root.MManual=MM;if(typeof module!=='undefined')module.exports=MM;
})(typeof window!=='undefined'?window:globalThis);
