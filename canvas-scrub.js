/* Scroll-driven image sequences. No video, autoplay or generated camera transforms. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
window.SiGaCanvasScrub=async function({root,host,manifest,signal,brand,labels,onProgress}){
 if(!manifest||!Array.isArray(manifest.frames)||manifest.frames.length<2)return null;
 const frames=manifest.frames, count=frames.length, controller=new AbortController();
 let dead=false,raf=0,wanted=0,shown=-1,decoding=false,workers=0,initial=true;
 const blobs=new Map(),decoded=new Map(),failed=new Set(),pending=new Set();
 const focal=manifest.focal||[.5,.5];
 const section=document.createElement('section');section.className='cinematic-sequence';
 const pin=document.createElement('div');pin.className='cinematic-pin';
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',brand+' — '+labels.demo);
 const meta=document.createElement('div');meta.className='cinematic-meta';
 const title=document.createElement('strong');title.textContent=brand;
 const caption=document.createElement('span');caption.textContent=labels.scroll;
 const counter=document.createElement('span');counter.className='cinematic-counter';
 const demo=document.createElement('small');demo.textContent=labels.demo;
 meta.append(title,caption,counter,demo);pin.append(canvas,meta);section.append(pin);
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)return null;
 const cleanup=()=>{if(dead)return;dead=true;controller.abort();cancelAnimationFrame(raf);ro.disconnect();root.removeEventListener('scroll',schedule);for(const b of decoded.values())b.close();decoded.clear();blobs.clear();};
 signal?.addEventListener('abort',cleanup,{once:true});
 const getURL=i=>new URL(frames[i],manifest.baseURL||document.baseURI).href;
 async function fetchFrame(i){
  if(blobs.has(i)||failed.has(i)||pending.has(i)||dead)return;
  pending.add(i);
  try{const response=await fetch(getURL(i),{signal:controller.signal});if(!response.ok)throw Error('Frame '+i+': '+response.status);const blob=await response.blob();if(!dead)blobs.set(i,blob);}
  catch(e){if(!dead)failed.add(i);}finally{pending.delete(i);}
 }
 function pump(){
  if(dead)return;
  const order=Array.from({length:count},(_,i)=>i).sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted));
  while(workers<2){const i=order.find(i=>!blobs.has(i)&&!pending.has(i)&&!failed.has(i));if(i===undefined)break;workers++;fetchFrame(i).finally(()=>{workers--;schedule();pump();});}
 }
 function paint(bitmap,index){
  const mobile=root.clientWidth<700, f=mobile?(manifest.mobileFocal||focal):focal;
  const scale=Math.max(canvas.width/bitmap.width,canvas.height/bitmap.height);
  const width=bitmap.width*scale,height=bitmap.height*scale;
  ctx.drawImage(bitmap,(canvas.width-width)*clamp(f[0],0,1),(canvas.height-height)*clamp(f[1],0,1),width,height);
  shown=index;canvas.dataset.frame=String(index);canvas.dataset.progress=String(wanted/(count-1));
  counter.textContent=String(index+1).padStart(2,'0')+' / '+count;
  const scene=(manifest.scenes||[]).find(s=>wanted>=s.start&&wanted<=s.end);
  caption.textContent=scene?.text?.[document.documentElement.lang]||scene?.text?.en||labels.scroll;
 }
 async function draw(){
  raf=0;if(dead||decoding)return;
  const index=wanted;
  if(decoded.has(index)){paint(decoded.get(index),index);return;}
  if(!blobs.has(index)){pump();return;}
  decoding=true;
  try{
   const bitmap=await createImageBitmap(blobs.get(index));
   if(dead){bitmap.close();return;}
   decoded.set(index,bitmap);
   if(index===wanted)paint(bitmap,index);
   while(decoded.size>10){const evict=[...decoded.keys()].filter(i=>i!==wanted).sort((a,b)=>Math.abs(b-wanted)-Math.abs(a-wanted))[0];decoded.get(evict).close();decoded.delete(evict);}
  }catch(e){failed.add(index);blobs.delete(index);}finally{decoding=false;if(!dead&&index!==wanted)schedule();}
 }
 function schedule(){
  if(dead)return;
  if(!initial){const top=section.getBoundingClientRect().top-root.getBoundingClientRect().top;const distance=Math.max(1,section.offsetHeight-pin.offsetHeight);wanted=Math.round(clamp(-top/distance,0,1)*(count-1));}
  onProgress?.(wanted/(count-1));if(!raf)raf=requestAnimationFrame(draw);
 }
 function resize(){
  const height=Math.max(200,root.clientHeight);section.style.setProperty('--cinematic-height',height+'px');
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
  canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
  if(decoded.has(shown))paint(decoded.get(shown),shown);schedule();
 }
 const ro=new ResizeObserver(resize);
 await fetchFrame(0);
 if(dead||!blobs.has(0)){cleanup();return null;}
 try{decoded.set(0,await createImageBitmap(blobs.get(0)));}catch(e){cleanup();return null;}
 if(dead){decoded.get(0)?.close();return null;}
 host.replaceChildren(section);root.scrollTop=0;resize();paint(decoded.get(0),0);initial=false;
 root.addEventListener('scroll',schedule,{passive:true});ro.observe(root);pump();
 return {destroy:cleanup,canvas,section,get state(){return {wanted,shown,count,loaded:blobs.size,decoded:decoded.size,failed:failed.size};}};
};
})();
