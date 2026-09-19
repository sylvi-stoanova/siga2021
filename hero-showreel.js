/* Decorative copies only: original portfolio nodes and demo behaviour are untouched. */
(()=>{'use strict';const hero=document.querySelector('body.c .hero>.hero-copy');if(!hero)return;
const stage=document.createElement('div');stage.className='hero-showreel';stage.setAttribute('aria-hidden','true');stage.inert=true;
document.querySelectorAll('.showcase-panel .browser-mockup').forEach((source,i)=>{const layer=document.createElement('div');layer.className='hero-preview-layer layer-'+i;const surface=document.createElement('div');surface.className='hero-preview-surface';for(const selector of ['.browser-chrome','.mini-site']){const original=source.querySelector(selector);if(original)surface.append(original.cloneNode(true));}surface.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));surface.querySelectorAll('img').forEach(img=>{img.loading='eager';img.decoding='async';img.alt='';});layer.append(surface);stage.append(layer);});hero.prepend(stage);
const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');let rect,x=0,y=0,tx=0,ty=0,raf=0,visible=true;
function frame(){raf=0;if(reduce.matches||!visible)return;x+=(tx-x)*.09;y+=(ty-y)*.09;stage.style.setProperty('--pointer-x',x.toFixed(3));stage.style.setProperty('--pointer-y',y.toFixed(3));if(Math.abs(tx-x)+Math.abs(ty-y)>.002)raf=requestAnimationFrame(frame);}
function request(){if(!raf&&!reduce.matches&&visible)raf=requestAnimationFrame(frame);}
function reset(){cancelAnimationFrame(raf);raf=0;x=y=tx=ty=0;stage.style.setProperty('--pointer-x',0);stage.style.setProperty('--pointer-y',0);stage.style.setProperty('--scroll-shift','0px');rect=hero.getBoundingClientRect();}
hero.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches||e.pointerType==='touch')return;rect=hero.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-rect.left)/rect.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-rect.top)/rect.height*2-1));request();},{passive:true});hero.addEventListener('pointerleave',()=>{tx=ty=0;request();});
let scrollRAF=0;function scroll(){if(scrollRAF||reduce.matches||!fine.matches||!visible)return;scrollRAF=requestAnimationFrame(()=>{scrollRAF=0;const r=hero.getBoundingClientRect();stage.style.setProperty('--scroll-shift',Math.min(24,Math.max(0,-r.top/(innerHeight*.3)*24))+'px');});}
addEventListener('scroll',scroll,{passive:true});addEventListener('resize',reset,{passive:true});fine.addEventListener('change',reset);reduce.addEventListener('change',()=>{cancelAnimationFrame(scrollRAF);scrollRAF=0;reset();});

// Only decorative hero copies participate; the interactive demos stay untouched.
const shots=[
 ['velora-gold','velora-gold-dial','velora-gold-movement'],
 ['noma-interior-new','fire','fire-dish','noma-interior-table'],
 ['altura-villa','altura-villa-living','altura-villa-terrace']
];
const layers=[...stage.children], galleries=layers.map(layer=>{
 const first=layer.querySelector('.mini-site-content img');
 const frame=document.createElement('div');frame.className='showreel-gallery';
 first.replaceWith(frame);frame.append(first);first.classList.add('shot-visible');
 const next=first.cloneNode();next.classList.remove('shot-visible');frame.append(next);
 return {frame,images:[first,next],front:0};
});
let concept=0,shotIndex=0,timer=0,generation=0;
function focusConcept(){layers.forEach((layer,i)=>layer.classList.toggle('showreel-featured',i===concept));stage.dataset.concept=String(concept);}
async function advance(){
 timer=0;const token=++generation;
 let nextConcept=concept,nextShot=shotIndex+1;
 if(nextShot>=shots[concept].length){nextConcept=(concept+1)%layers.length;nextShot=0;}
 const gallery=galleries[nextConcept],image=gallery.images[1-gallery.front];
 image.src='assets/'+shots[nextConcept][nextShot]+'.webp';
 try{await image.decode();}catch{syncTour();return;}
 if(token!==generation||reduce.matches||!visible||document.hidden)return;
 concept=nextConcept;shotIndex=nextShot;
 gallery.frame.classList.toggle('showreel-fire-detail',concept===1&&shotIndex===1);
 image.classList.add('shot-visible');gallery.images[gallery.front].classList.remove('shot-visible');gallery.front=1-gallery.front;
 focusConcept();syncTour();
}
function syncTour(){clearTimeout(timer);timer=0;generation++;
 if(!reduce.matches&&visible&&!document.hidden)timer=setTimeout(advance,4200);
}
reduce.addEventListener('change',syncTour);
document.addEventListener('visibilitychange',()=>{stage.classList.toggle('showreel-paused',document.hidden||!visible);syncTour();});
focusConcept();syncTour();

new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;stage.classList.toggle('showreel-paused',!visible);if(!visible){cancelAnimationFrame(raf);raf=0;}else request();syncTour();},{threshold:0}).observe(hero);reset();
})();
