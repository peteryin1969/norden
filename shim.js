/* Standalone site: replaces the Claude viewer's sample function with direct API calls using the owner's own key, kept only in this browser. */
window.NORDEN_TTS='tts/';
(()=>{let key='';try{key=localStorage.getItem('norden-key')||''}catch(e){}
const M={quick:'claude-haiku-5-5',default:'claude-sonnet-5-5'};
async function b64(blob){let bmp=null;if(blob.size>900000&&blob.type!=='image/png'){try{const im=await createImageBitmap(blob),s=Math.min(1,1568/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);bmp=await new Promise(r=>c.toBlob(r,'image/jpeg',.85))}catch(e){}}const b=bmp||blob,a=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return{type:'image',source:{type:'base64',media_type:b.type||'image/png',data:btoa(s)}}}
const err=(code,message,text)=>({code,message,text});
async function round(body,signal,onDelta){let r;try{r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal,headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({...body,stream:true})})}catch(e){if(e&&e.name==='AbortError')throw err('cancelled','cancelled');throw err('network',String(e))}
  if(!r.ok){const t=await r.text().catch(()=>'');throw err(r.status===401||r.status===403?'not_granted':r.status===429?'rate_limited':'failed',t.slice(0,300))}
  const rd=r.body.getReader(),dec=new TextDecoder();let buf='',blocks=[],stop=null;
  try{for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;while((i=buf.indexOf('\n'))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!line.startsWith('data:'))continue;let e;try{e=JSON.parse(line.slice(5))}catch(x){continue}
    if(e.type==='content_block_start')blocks[e.index]={...e.content_block,json:''};
    else if(e.type==='content_block_delta'){const b=blocks[e.index];if(e.delta.type==='text_delta'){b.text=(b.text||'')+e.delta.text;onDelta(e.delta.text)}else if(e.delta.type==='input_json_delta')b.json+=e.delta.partial_json}
    else if(e.type==='message_delta')stop=e.delta.stop_reason;else if(e.type==='error')throw err('failed',e.error&&e.error.message)}}}
  catch(e){if(e&&e.name==='AbortError')throw err('cancelled','cancelled');throw e}
  return{blocks:blocks.filter(Boolean),stop}}
async function sample(input,o={}){const msgs=(typeof input==='string'?[{role:'user',content:input}]:input).map(m=>({role:m.role,content:m.content})).reduce((a,m)=>{const l=a[a.length-1];if(l&&l.role===m.role)l.content+='\n\n'+m.content;else a.push({...m});return a},[]);
  if(o.images&&o.images.length){const l=msgs[msgs.length-1],im=await Promise.all(o.images.map(b64));l.content=[...im,{type:'text',text:l.content}]}
  const tools=(o.tools||[]).map(t=>({name:t.name,description:t.description,input_schema:t.inputSchema||{type:'object',properties:{}}}));let all='';
  for(let n=0;n<6;n++){const body={model:M[o.modelTier]||M.default,max_tokens:1024,messages:msgs};if(tools.length)body.tools=tools;
    const{blocks,stop}=await round(body,o.signal,d=>{all+=d;o.onText&&o.onText({text:all,delta:d})});
    if(stop!=='tool_use')return{text:all,truncated:stop==='max_tokens'};
    const content=blocks.map(b=>b.type==='text'?{type:'text',text:b.text||''}:{type:'tool_use',id:b.id,name:b.name,input:b.json?JSON.parse(b.json):{}}).filter(b=>b.type!=='text'||b.text);msgs.push({role:'assistant',content});
    const res=[];for(const b of content){if(b.type!=='tool_use')continue;const t=o.tools.find(x=>x.name===b.name);try{res.push({type:'tool_result',tool_use_id:b.id,content:JSON.stringify(await t.execute(b.input))})}catch(e){res.push({type:'tool_result',tool_use_id:b.id,is_error:true,content:String(e&&e.message||e)})}}msgs.push({role:'user',content:res})}
  return{text:all,truncated:true}}
sample.json=async(input,o={})=>{const r=await sample(typeof input==='string'?input+'\n只输出 JSON，不要其他文字。':input,o),m=r.text.match(/[\[{][\s\S]*[\]}]/);if(!m)throw err('failed','no json');return JSON.parse(m[0])};
sample.limits=async()=>({images:true});
window.claude={use:async n=>n==='sample'&&key?sample:null};
window.addEventListener('DOMContentLoaded',()=>{const h=document.querySelector('header');if(!h)return;const b=document.createElement('button');b.className='btn';b.style.cssText='min-height:36px;font-size:13px;margin-top:6px';b.textContent=key?'AI 已设置，点击更改':'设置 AI 密钥（语音控制不需要）';b.onclick=()=>{const v=prompt('粘贴你的 Anthropic API 密钥。只保存在这台手机的浏览器里。留空则删除。',key);if(v===null)return;try{if(v.trim())localStorage.setItem('norden-key',v.trim());else localStorage.removeItem('norden-key')}catch(e){}location.reload()};h.append(b)})})();
