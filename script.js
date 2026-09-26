/* Анимации и галерея работают автономно, без сторонних библиотек. */
(() => {
'use strict';
const body=document.body, media=matchMedia('(prefers-reduced-motion: reduce)'), motion=document.getElementById('motion');
let paused=media.matches, scrollQueued=false;
const progress=document.querySelector('.reading-progress'), composition=document.querySelector('.photo-composition'), statement=[...document.querySelectorAll('.love-statement>span')];
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
function scrollFrame(){scrollQueued=false;const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?clamp(scrollY/max):0})`;if(!paused){const box=composition.getBoundingClientRect();const p=clamp((innerHeight-box.top)/Math.max(innerHeight,1));composition.style.setProperty('--spread',String(p));composition.style.setProperty('--photoY',`${-p*16}px`);}statement.forEach(line=>line.classList.toggle('lit',paused||line.getBoundingClientRect().top<innerHeight*.79));}
function schedule(){if(!scrollQueued){scrollQueued=true;requestAnimationFrame(scrollFrame);}}
function setMotion(){body.classList.toggle('paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Включить анимации':'Приостановить анимации');motion.textContent=paused?'▷':'Ⅱ';if(paused){document.getAnimations().forEach(a=>{try{a.finish();}catch{a.cancel();}});}schedule();}
motion.addEventListener('click',()=>{paused=!paused;setMotion();});media.addEventListener('change',e=>{paused=e.matches;setMotion();});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}},{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});

const slides=[
{src:'assets/gallery-1.webp',title:'Счастье быть рядом',alt:'Пара смеётся, гуляя по цветущему саду'},
{src:'assets/gallery-2.webp',title:'Одно прикосновение',alt:'Нежное прикосновение рук с обручальными кольцами'},
{src:'assets/gallery-3.webp',title:'Предвкушение праздника',alt:'Свадебный стол с цветами и бокалами в солнечном свете'},
{src:'assets/gallery-4.webp',title:'Танцевать вдвоём',alt:'Пара танцует среди цветущих деревьев'}];
const stage=document.getElementById('gallery-stage'),thumbs=[...document.querySelectorAll('[data-slide]')],status=document.getElementById('gallery-status');
const dialog=document.getElementById('lightbox'),lightImage=document.getElementById('lightbox-image'),caption=document.getElementById('gallery-caption'),number=document.getElementById('gallery-number');
let current=0,requested=0,sequence=0,activeAnimations=[];
const cached=new Map();
function preload(index){if(cached.has(index))return cached.get(index);const task=new Promise((resolve,reject)=>{const image=new Image();image.onload=async()=>{try{await image.decode();}catch{}resolve(image);};image.onerror=()=>{cached.delete(index);reject(new Error('image unavailable'));};image.src=slides[index].src;});cached.set(index,task);return task;}
function sync(){const s=slides[current],count=`${String(current+1).padStart(2,'0')} / 04`;caption.textContent=s.title;number.textContent=count;thumbs.forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));lightImage.src=s.src;lightImage.alt=s.alt;document.getElementById('lightbox-caption').textContent=s.title;document.getElementById('lightbox-count').textContent=count;}
function settle(){activeAnimations.forEach(a=>a.cancel());activeAnimations=[];stage.querySelectorAll('.incoming').forEach(el=>el.remove());const image=document.getElementById('gallery-image');image.src=slides[current].src;image.alt=slides[current].alt;image.style.opacity='';image.style.transform='';}
async function show(index,direction=1){
 const target=(index+slides.length)%slides.length;requested=target;const token=++sequence;
 if(target===current){settle();status.textContent='';stage.removeAttribute('aria-busy');return;}
 status.textContent='';stage.setAttribute('aria-busy','true');
 try{await preload(target);}catch{if(token===sequence){settle();requested=current;stage.removeAttribute('aria-busy');status.textContent='Не удалось загрузить фото. Попробуйте выбрать его ещё раз.';}return;}
 if(token!==sequence)return;
 settle();const base=document.getElementById('gallery-image'),s=slides[target];
 if(paused||!base.animate){base.src=s.src;base.alt=s.alt;current=target;sync();stage.removeAttribute('aria-busy');return;}
 const incoming=document.createElement('img');incoming.src=s.src;incoming.alt='';incoming.setAttribute('aria-hidden','true');incoming.className='incoming';incoming.draggable=false;stage.insertBefore(incoming,stage.querySelector('.gallery-overlay'));
 const ease='cubic-bezier(.22,1,.36,1)';
 const a=incoming.animate([{clipPath:direction>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)',transform:`translateX(${direction*20}px) scale(1.05)`},{clipPath:'inset(0 0 0 0)',transform:'translateX(0) scale(1)'}],{duration:720,easing:ease,fill:'both'});
 const b=base.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.025)',opacity:.5}],{duration:720,easing:ease,fill:'both'});
 activeAnimations=[a,b];current=target;sync();
 try{await a.finished;}catch{}
 if(token!==sequence)return;
 base.src=s.src;base.alt=s.alt;settle();stage.removeAttribute('aria-busy');
 preload((current+1)%4).catch(()=>{});
}
function step(delta){show(requested+delta,delta);}
thumbs.forEach((button,index)=>{button.addEventListener('click',()=>show(index,index>=current?1:-1));button.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=(index+(e.key==='ArrowRight'?1:3))%4;thumbs[next].focus();show(next,e.key==='ArrowRight'?1:-1);}});});
document.getElementById('previous').addEventListener('click',()=>step(-1));document.getElementById('next').addEventListener('click',()=>step(1));document.getElementById('lightbox-prev').addEventListener('click',()=>step(-1));document.getElementById('lightbox-next').addEventListener('click',()=>step(1));
function keys(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}}
stage.addEventListener('keydown',keys);dialog.addEventListener('keydown',keys);
function swipe(el){let start=null;el.addEventListener('pointerdown',e=>{if(e.target.closest('button')||!e.isPrimary)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};});el.addEventListener('pointerup',e=>{if(!start||e.pointerId!==start.id)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)step(dx<0?1:-1);});el.addEventListener('pointercancel',()=>{start=null;});el.addEventListener('pointerleave',()=>{start=null;});}
swipe(stage);swipe(document.getElementById('lightbox-stage'));
const expand=document.getElementById('expand');if(typeof dialog.showModal==='function'){expand.hidden=false;expand.addEventListener('click',()=>{sync();dialog.showModal();body.classList.add('modal-open');document.getElementById('close-lightbox').focus();});}
document.getElementById('close-lightbox').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{body.classList.remove('modal-open');expand.focus({preventScroll:true});});
document.getElementById('gallery-arrows').hidden=false;
// Подгружаем большие кадры, только когда галерея приближается к экрану.
if('IntersectionObserver'in window){const loader=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){slides.forEach((_,i)=>preload(i).catch(()=>{}));loader.disconnect();}},{rootMargin:'400px'});loader.observe(stage);}
body.classList.add('js');motion.hidden=false;setMotion();sync();
})();
