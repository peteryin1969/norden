/* Open-source Chinese speech in the page: espeak phonemes + Piper VITS voice (huayan) on ONNX Runtime WASM. */
importScripts('ort.min.js','piper_phonemize.js');
ort.env.wasm.wasmPaths='./';ort.env.wasm.numThreads=1;
const FILE='voice.onnx';let session=null;
async function model(){let c=null;try{c=await caches.open('norden-tts-1');const hit=await c.match(FILE);if(hit)return new Uint8Array(await hit.arrayBuffer())}catch(e){}
  const r=await fetch(FILE);if(!r.ok)throw new Error('model '+r.status);const total=+r.headers.get('content-length')||63201423,rd=r.body.getReader(),parts=[];let got=0;for(;;){const{done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;postMessage({type:'progress',pct:Math.min(99,Math.round(got/total*100))})}
  const all=new Uint8Array(got);let o=0;for(const p of parts){all.set(p,o);o+=p.length}try{if(c)await c.put(FILE,new Response(all.slice(0)))}catch(e){}return all}
function ids(text){return new Promise(async(res,rej)=>{const m=await createPiperPhonemize({print:d=>res(JSON.parse(d).phoneme_ids),printErr:e=>rej(new Error(e)),locateFile:u=>u.endsWith('.wasm')?'piper_phonemize.wasm':u.endsWith('.data')?'piper_phonemize.data':u});m.callMain(['-l','cmn','--input',JSON.stringify([{text}]),'--espeak_data','/espeak-ng-data'])})}
onmessage=async({data:d})=>{try{if(d.type==='init'){const b=await model();postMessage({type:'progress',pct:100});session=await ort.InferenceSession.create(b,{executionProviders:['wasm']});postMessage({type:'ready'})}
  else if(d.type==='say'){const p=await ids(d.text),t=performance.now(),o=await session.run({input:new ort.Tensor('int64',BigInt64Array.from(p.map(BigInt)),[1,p.length]),input_lengths:new ort.Tensor('int64',BigInt64Array.from([BigInt(p.length)])),scales:new ort.Tensor('float32',Float32Array.from([.667,1,.8]))});const pcm=o.output.data;postMessage({type:'pcm',id:d.id,pcm,ms:performance.now()-t},[pcm.buffer])}}
  catch(e){postMessage({type:'error',id:d.id,message:String(e&&e.message||e)})}};
