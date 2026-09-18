/* Local still-asset renderer; can be replaced by SiGaCanvasScrub frame manifests. */
(()=>{'use strict';
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const shot=(file,from,to,text)=>({file,from,to,text});
const plans={
 watch:[
 shot('velora-gold',[.55,.5,1],[.61,.5,1.14],['Не измерваме времето.','We don’t measure time.','Wir messen keine Zeit.']),
 shot('velora-gold-dial',[.53,.5,1.1],[.6,.43,1.5],['Прецизност отблизо.','Precision, up close.','Präzision aus der Nähe.']),
 shot('velora-gold-movement',[.62,.38,1.45],[.69,.3,1.8],['Злато. Светлина. Механика.','Gold. Light. Mechanics.','Gold. Licht. Mechanik.'])],
 fire:[
 shot('noma-interior-new',[.5,.5,1],[.55,.52,1.12],['Вечерта започва тук.','The evening starts here.','Hier beginnt der Abend.']),
 shot('noma-interior-table',[.5,.61,1.02],[.57,.63,1.3],['Място за добра компания.','A place for good company.','Raum für gute Gesellschaft.']),
 shot('noma-interior-angle',[.25,.49,1.35],[.065,.44,3.1],['Открит огън. Истински характер.','Open fire. Real character.','Offenes Feuer. Echter Charakter.']),
 shot('noma-interior-wine',[.39,.6,1.3],[.47,.51,1.02],['Остани още малко.','Stay a little longer.','Bleib noch ein wenig.'])],
 tower:[
 shot('altura-villa',[.53,.49,1],[.61,.47,1.25],['Пространство с характер.','Space with character.','Räume mit Charakter.']),
 shot('altura-villa-terrace',[.55,.48,1.1],[.48,.41,1.38],['Камък. Дърво. Светлина.','Stone. Wood. Light.','Stein. Holz. Licht.']),
 shot('altura-villa-living',[.5,.5,1.22],[.64,.5,1],['Живот отвъд стените.','Life beyond the walls.','Leben jenseits der Wände.'])]
};
window.SiGaScrollPrototype=async function({root,host,key,signal,onProgress}){
 const shots=plans[key],images=new Map(),abort=new AbortController();
 const li=({bg:0,en:1,de:2})[document.documentElement.lang]||0;
 let dead=false,raf=0,progress=0,ready=false;
 const section=document.createElement('section');section.className='cinematic-sequence';
 const pin=document.createElement('div');pin.className='cinematic-pin';
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',(window.SIGA_PROJECTS[document.documentElement.lang]||window.SIGA_PROJECTS.en).projects[({watch:'watch',fire:'restaurant',tower:'architecture'})[key]].title);
 const meta=document.createElement('div');meta.className='cinematic-meta';
 const title=document.createElement('strong');title.textContent=canvas.getAttribute('aria-label');
 const caption=document.createElement('span');const count=document.createElement('span');count.className='cinematic-counter';
 const label=document.createElement('small');label.textContent=['ДЕМО КОНЦЕПЦИЯ · СКРОЛИРАЙ ЗА ДВИЖЕНИЕ','DEMO CONCEPT · SCROLL TO EXPLORE','DEMO-KONZEPT · SCROLLEN ZUM ENTDECKEN'][li];
 meta.append(title,caption,count,label);pin.append(canvas,meta);section.append(pin);
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
 async function load(s){try{const r=await fetch('assets/'+s.file+'.webp',{signal:abort.signal});if(!r.ok)throw Error(r.status);const bitmap=await createImageBitmap(await r.blob());if(dead)bitmap.close();else{images.set(s.file,bitmap);schedule();}}catch(e){if(!dead)console.error('Preview asset failed:',s.file,e);}}
 function layer(s,t,alpha=1,reveal=1){
  const im=images.get(s.file);if(!im)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)').matches?0:smooth(t);
  const x=mix(s.from[0],s.to[0],motion),y=mix(s.from[1],s.to[1],motion),zoom=mix(s.from[2],s.to[2],motion);
  const scale=Math.max(canvas.width/im.width,canvas.height/im.height)*zoom,w=im.width*scale,h=im.height*scale;
  // Focal point remains inside the viewport on tall mobile screens, including the hearth.
  const dx=Math.min(0,Math.max(canvas.width-w,canvas.width*.5-w*x));
  const dy=Math.min(0,Math.max(canvas.height-h,canvas.height*.5-h*y));
  ctx.save();ctx.globalAlpha=alpha;
  if(reveal<1){ctx.beginPath();ctx.rect(0,0,canvas.width*reveal,canvas.height);ctx.clip();}
  ctx.drawImage(im,dx,dy,w,h);ctx.restore();
 }
 function render(){raf=0;if(dead||!ready)return;
  const phase=progress*shots.length,index=Math.min(shots.length-1,Math.floor(phase)),local=Math.min(1,phase-index);
  ctx.fillStyle='#080807';ctx.fillRect(0,0,canvas.width,canvas.height);
  // Keep the preceding loaded shot visible on fast scroll while another asset loads.
  const available=images.has(shots[index].file)?index:[...shots.keys()].filter(i=>images.has(shots[i].file)).sort((a,b)=>Math.abs(a-index)-Math.abs(b-index))[0];
  layer(shots[available],local);
  const transition=smooth(clamp((local-.76)/.24));
  if(index<shots.length-1&&transition>0&&images.has(shots[index+1].file)){
   if(key==='tower')layer(shots[index+1],0,1,transition);else layer(shots[index+1],0,transition);
  }
  // A restrained light falloff moves independently of the photograph.
  if(key!=='tower'){
   const g=ctx.createLinearGradient(0,canvas.height,canvas.width*(.7+progress*.3),0);
   g.addColorStop(0,'rgba(0,0,0,.23)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.12)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  canvas.dataset.progress=progress.toFixed(5);canvas.dataset.scene=String(index);canvas.dataset.renderer='local-assets';
  caption.textContent=shots[index].text[li];count.textContent=String(index+1).padStart(2,'0')+' / '+String(shots.length).padStart(2,'0');onProgress?.(progress);
 }
 function schedule(){if(!dead&&!raf)raf=requestAnimationFrame(render);}
 function scroll(){const top=section.getBoundingClientRect().top-root.getBoundingClientRect().top;progress=clamp(-top/Math.max(1,section.offsetHeight-pin.offsetHeight));schedule();}
 function resize(){const old=progress;section.style.setProperty('--cinematic-height',root.clientHeight+'px');const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));root.scrollTop=old*(section.offsetHeight-pin.offsetHeight);schedule();}
 const ro=new ResizeObserver(resize);
 function destroy(){dead=true;abort.abort();cancelAnimationFrame(raf);ro.disconnect();root.removeEventListener('scroll',scroll);images.forEach(im=>im.close());images.clear();}
 signal.addEventListener('abort',destroy,{once:true});
 await load(shots[0]);if(dead||!images.size)return null;
 host.replaceChildren(section);root.scrollTop=0;ready=true;resize();ro.observe(root);root.addEventListener('scroll',scroll,{passive:true});schedule();
 // Only the open demo loads. First paint precedes progressive loading of its remaining shots.
 for(const s of shots.slice(1)){if(dead)break;await load(s);}
 return {destroy,canvas};
};
})();
