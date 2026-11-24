
/* ── FEATURE FLAGS ── */
const SHOW_REELS = false; // true — показати розділ «Відгуки», false — приховати

if(!SHOW_REELS){
  document.getElementById('reels').style.display='none';
  document.querySelectorAll('[data-target="reels"]').forEach(b=>b.style.display='none');
}

/* ── SCROLL & HEADER ── */
const hdr = document.getElementById('hdr');
function updateMobileHeader(){
  const hero=document.getElementById('hero');
  hdr.classList.toggle('is-compact',window.innerWidth<768&&hero.getBoundingClientRect().bottom<=104);
}
updateMobileHeader();
window.addEventListener('resize',updateMobileHeader);
const sections = ['hero','results','combat-system','combat-path','commanders','reels','jobs','faq','contacts'].filter(s=>SHOW_REELS||s!=='reels');
const navBtns = document.querySelectorAll('.nav-btn');
let mobileSectionTransitionTimer=0;
function beginMobileSectionTransition(){
  if(window.innerWidth>=768)return;
  const root=document.documentElement;
  root.classList.add('is-section-transitioning');
  window.clearTimeout(mobileSectionTransitionTimer);
  mobileSectionTransitionTimer=window.setTimeout(()=>root.classList.remove('is-section-transitioning'),760);
}

function goTo(id){
  const alignedHeading=window.innerWidth<768&&['commanders','jobs'].includes(id);
  const el = alignedHeading?document.querySelector(id==='commanders'?'#commanders .cmd-head':'#jobs .car-title-block'):document.getElementById(id);
  if(!el) return;
  const elTop = el.getBoundingClientRect().top + window.scrollY;
  const inset=window.innerWidth<768?(alignedHeading?72:64):Math.round((window.visualViewport?.height||window.innerHeight)*.12);
  const top=Math.max(0,elTop-inset);
  beginMobileSectionTransition();
  /* iOS Safari may still be finishing native momentum on touchend. Starting on
     the next frame keeps that momentum from fighting the intended section move. */
  window.requestAnimationFrame(()=>window.scrollTo({top,behavior:'smooth'}));
}

navBtns.forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.target)));

/* A clear vertical swipe moves between the first two full-screen entry sections.
   Native scrolling remains available; this only settles an intentional gesture. */
function addEntrySectionSwipe(fromId,fingerDirection,toId){
  const section=document.getElementById(fromId);
  if(!section)return;
  let swipe=null;
  let locked=false;
  const isFocused=()=>{
    const rect=section.getBoundingClientRect();
    const viewportHeight=window.visualViewport?.height||window.innerHeight;
    return rect.top<=112&&rect.bottom>=viewportHeight*.55;
  };
  section.addEventListener('touchstart',event=>{
    if(window.innerWidth>=768||event.touches.length!==1||locked)return;
    if(event.target.closest('a,button,input,textarea,select,[contenteditable="true"]'))return;
    const touch=event.touches[0];
    swipe={id:touch.identifier,x:touch.clientX,y:touch.clientY,focused:isFocused(),claimed:false};
  },{passive:true});
  section.addEventListener('touchmove',event=>{
    if(!swipe||!swipe.focused||window.innerWidth>=768)return;
    const touch=[...event.touches].find(item=>item.identifier===swipe.id);
    if(!touch)return;
    const dx=touch.clientX-swipe.x;
    const dy=touch.clientY-swipe.y;
    const rightDirection=(fingerDirection==='up'&&dy<0)||(fingerDirection==='down'&&dy>0);
    if(Math.abs(dy)>=120&&Math.abs(dy)>=Math.abs(dx)*1.25&&rightDirection){
      swipe.claimed=true;
      /* Stop WebKit's page momentum once this is a deliberate section swipe. */
      event.preventDefault();
    }
  },{passive:false});
  section.addEventListener('touchend',event=>{
    if(!swipe||window.innerWidth>=768)return;
    const gesture=swipe;swipe=null;
    const touch=[...event.changedTouches].find(item=>item.identifier===gesture.id);
    if(!touch||!gesture.focused)return;
    const dx=touch.clientX-gesture.x;
    const dy=touch.clientY-gesture.y;
    if(Math.abs(dy)<120||Math.abs(dy)<Math.abs(dx)*1.25)return;
    if((fingerDirection==='up'&&dy>=0)||(fingerDirection==='down'&&dy<=0))return;
    locked=true;
    goTo(toId);
    window.setTimeout(()=>{locked=false;},650);
  },{passive:true});
  section.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
}
addEntrySectionSwipe('hero','up','results');
addEntrySectionSwipe('results','down','hero');

window.addEventListener('scroll',()=>{
  hdr.classList.toggle('solid',scrollY>60);
  updateMobileHeader();

  // Active nav state
  let active='';
  sections.forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    const rect=el.getBoundingClientRect();
    if(rect.top<=120 && rect.bottom>120) active=id;
  });
  navBtns.forEach(b=>{
    b.classList.toggle('active', b.dataset.target===active);
  });
},{passive:true});

/* Repeat identical content groups for a seamless ticker, including short text. */
function initTicker(){
  const track=document.querySelector('.ticker-track');
  const wrap=track.parentElement;
  const sources=[...track.children];
  const half=sources.length/2;
  let previous='';
  let frame=0;
  function rebuild(){
    frame=0;
    if(!wrap.clientWidth)return;
    const values=[];
    for(let i=0;i<half;i+=2){
      const primary=sources[i]?.textContent||'';
      const backup=sources[i+half]?.textContent||'';
      const value=/^\[.*\]$/.test(primary.trim())&&!/^\[.*\]$/.test(backup.trim())?backup:primary;
      if(value.trim()&&!values.some(existing=>existing.trim()===value.trim()))values.push(value);
    }
    const signature=JSON.stringify([values,wrap.clientWidth]);
    if(signature===previous)return;
    previous=signature;
    const group=document.createElement('div');
    group.className='ticker-group';
    values.forEach(value=>{
      const node=sources[0].cloneNode(false);
      node.textContent=value;
      group.append(node);
      group.append(sources[1].cloneNode(true));
    });
    track.replaceChildren(group);
    const baseWidth=group.getBoundingClientRect().width;
    if(baseWidth>0){
      const base=[...group.children];
      const repeats=Math.max(2,Math.ceil((wrap.clientWidth*2)/baseWidth));
      for(let i=1;i<repeats;i++)base.forEach(node=>group.append(node.cloneNode(true)));
    }
    track.append(group.cloneNode(true));
    const distance=group.getBoundingClientRect().width;
    track.style.setProperty('--ticker-shift',`-${distance}px`);
    track.style.setProperty('--ticker-duration',`${Math.max(18,distance/30).toFixed(1)}s`);
    track.style.animation='none';
    void track.offsetWidth;
    track.style.animation='';
  }
  window.refreshTicker=()=>{
    if(!frame)frame=requestAnimationFrame(rebuild);
  };
  new ResizeObserver(window.refreshTicker).observe(wrap);
  document.fonts.ready.then(()=>{previous='';window.refreshTicker();});
  window.refreshTicker();
}
initTicker();

/* ── CAROUSEL FACTORY ── */
function splitMobileSlides(trackId){
  if(window.innerWidth>=768)return;
  const track=document.getElementById(trackId);
  Array.from(track.querySelectorAll('.c-slide')).forEach(slide=>{
    const imgs=Array.from(slide.querySelectorAll('img'));
    imgs.slice(1).forEach(img=>{
      const ns=document.createElement('div');
      ns.className='c-slide';
      ns.appendChild(img);
      slide.parentNode.insertBefore(ns,slide.nextSibling);
    });
  });
}
function mkCarousel(trackId,dotsId,prevId,nextId,mDotsId,dragLabel=''){
  let cur=0;
  const track=document.getElementById(trackId);
  const dotsEl=document.getElementById(dotsId);
  const mDotsEl=mDotsId?document.getElementById(mDotsId):null;
  const prev=document.getElementById(prevId);
  const next=document.getElementById(nextId);
  const n=track.querySelectorAll('.c-slide').length;
  [dotsEl,mDotsEl].forEach(el=>{
    if(!el)return;
    for(let i=0;i<n;i++){
      const d=document.createElement(dragLabel?'button':'div');
      if(dragLabel){d.type='button';d.setAttribute('aria-label',`Слайд ${i+1} з ${n}`);d.setAttribute('aria-current',i===0?'true':'false');}
      d.className='cdot'+(i===0?' on':'');
      d.onclick=()=>go(i);
      el.appendChild(d);
    }
  });
  function go(i){
    const newCur=Math.max(0,Math.min(n-1,i));
    const moved=newCur!==cur;
    cur=newCur;
    track.style.transform=`translateX(-${cur*100}%)`;
    [dotsEl,mDotsEl].forEach(el=>{
      if(!el)return;
      el.querySelectorAll('.cdot').forEach((d,k)=>{d.classList.toggle('on',k===cur);if(dragLabel)d.setAttribute('aria-current',k===cur?'true':'false');});
    });
    prev.classList.toggle('off',cur===0);
    next.classList.toggle('off',cur===n-1);
    return moved;
  }
  if(dragLabel){
    const viewport=track.closest('.carousel');
    viewport.tabIndex=0;
    viewport.setAttribute('role','region');
    viewport.setAttribute('aria-label',dragLabel);
    viewport.setAttribute('aria-roledescription','карусель');
    let drag=null;
    viewport.addEventListener('dragstart',event=>event.preventDefault());
    viewport.addEventListener('pointerdown',event=>{
      if(event.pointerType==='touch'||!event.isPrimary||event.button!==0)return;
      event.preventDefault();
      viewport.focus({preventScroll:true});
      drag={id:event.pointerId,x:event.clientX,dx:0,width:viewport.clientWidth};
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
      track.style.transition='none';
    });
    viewport.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      drag.dx=event.clientX-drag.x;
      const atEdge=(cur===0&&drag.dx>0)||(cur===n-1&&drag.dx<0);
      const offset=atEdge?drag.dx*.2:drag.dx;
      track.style.transform=`translateX(calc(-${cur*100}% + ${offset}px))`;
    });
    function finishDrag(event,cancel=false){
      if(!drag||(event&&event.pointerId!==drag.id))return;
      const ended=drag;drag=null;
      viewport.classList.remove('is-dragging');
      track.style.transition='';
      const threshold=Math.min(80,Math.max(40,ended.width*.12));
      go(cur+(!cancel&&Math.abs(ended.dx)>threshold?(ended.dx<0?1:-1):0));
      if(viewport.hasPointerCapture(ended.id))viewport.releasePointerCapture(ended.id);
    }
    viewport.addEventListener('pointerup',event=>finishDrag(event));
    viewport.addEventListener('pointercancel',event=>finishDrag(event,true));
    viewport.addEventListener('lostpointercapture',event=>finishDrag(event,true));
    window.addEventListener('resize',()=>finishDrag(null,true));
    viewport.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      go(event.key==='Home'?0:event.key==='End'?n-1:cur+(event.key==='ArrowRight'?1:-1));
    });
    let wheelTotal=0;
    let wheelLocked=false;
    viewport.addEventListener('wheel',event=>{
      const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
      if(!delta)return;
      event.preventDefault();
      const dir=delta>0?1:-1;
      const canMove=(dir>0&&cur<n-1)||(dir<0&&cur>0);
      if(!canMove)return;
      if(wheelLocked)return;
      wheelTotal+=delta;
      if(Math.abs(wheelTotal)<24)return;
      go(cur+(wheelTotal>0?1:-1));
      wheelTotal=0;
      wheelLocked=true;
      window.setTimeout(()=>{wheelLocked=false;},700);
    },{passive:false});
  }
  const fn=dir=>go(cur+dir);
  fn.reset=()=>{cur=-1;go(0)};
  return fn;
}
splitMobileSlides('cs-track');
splitMobileSlides('cp-track');
const csMove=mkCarousel('cs-track','cs-dots','cs-prev','cs-next','cs-dots-m','Фотогалерея «Єдина система бою»');
const cpMove=mkCarousel('cp-track','cp-dots','cp-prev','cp-next','cp-dots-m','Фотогалерея «Бойовий шлях»');
/* ── Commanders carousel (mobile only) ── */
function mkCmdCarousel(){
  let cur=0;
  let settlingTarget=null;
  const list=document.getElementById('cmd-list');
  const cards=list.querySelectorAll('.cmd-card');
  const n=cards.length;
  const prev=document.getElementById('cmd-prev');
  const next=document.getElementById('cmd-next');
  const dotsEl=document.getElementById('cmd-dots-m');
  const subtitle=document.getElementById('cmd-subtitle');
  if(dotsEl){
    for(let i=0;i<n;i++){
      const d=document.createElement('button');
      d.type='button';
      d.setAttribute('aria-label',`Командир ${i+1} з ${n}`);
      d.className='cdot'+(i===0?' on':'');
      d.onclick=()=>go(i);
      dotsEl.appendChild(d);
    }
  }
  function update(i){
    const newCur=Math.max(0,Math.min(n-1,i));
    const didMove=newCur!==cur;
    cur=newCur;
    prev.classList.toggle('off',cur===0);
    next.classList.toggle('off',cur===n-1);
    if(dotsEl)dotsEl.querySelectorAll('.cdot').forEach((d,k)=>{
      d.classList.toggle('on',k===cur);
      d.setAttribute('aria-pressed',String(k===cur));
    });
    if(subtitle){
      if(didMove){subtitle.classList.remove('subtitle-in');void subtitle.offsetWidth;subtitle.textContent=cards[cur].dataset.rank||'';subtitle.classList.add('subtitle-in');}
      else{subtitle.textContent=cards[cur].dataset.rank||'';}
    }
    return didMove;
  }
  function go(i){
    if(window.innerWidth>=768)return false;
    const target=Math.max(0,Math.min(n-1,i));
    settlingTarget=target;
    const moved=update(target);
    list.scrollTo({left:cards[target].offsetLeft-cards[0].offsetLeft,behavior:'smooth'});
    return moved;
  }
  list.addEventListener('scroll',()=>{
    if(window.innerWidth>=768)return;
    if(settlingTarget!==null){
      const targetLeft=cards[settlingTarget].offsetLeft-cards[0].offsetLeft;
      if(Math.abs(list.scrollLeft-targetLeft)<2)settlingTarget=null;
      return;
    }
    update(Math.round(list.scrollLeft/list.clientWidth));
  },{passive:true});
  list.addEventListener('wheel',()=>{settlingTarget=null;},{passive:true});
  let swipe=null;
  list.addEventListener('touchstart',event=>{
    swipe=null;
    if(window.innerWidth>=768||event.touches.length!==1)return;
    const touch=event.touches[0];
    swipe={id:touch.identifier,x:touch.clientX,y:touch.clientY,index:cur,direction:null};
  },{passive:true});
  list.addEventListener('touchmove',event=>{
    if(!swipe)return;
    if(event.touches.length!==1){swipe=null;return;}
    const touch=event.touches[0];
    const dx=touch.clientX-swipe.x;
    const dy=touch.clientY-swipe.y;
    if(swipe.direction===null&&(Math.abs(dx)>6||Math.abs(dy)>6)){
      swipe.direction=Math.abs(dx)>Math.abs(dy)*1.25?'horizontal':'vertical';
    }
    if(swipe.direction==='horizontal')event.preventDefault();
  },{passive:false});
  list.addEventListener('touchend',event=>{
    const gesture=swipe;
    swipe=null;
    if(!gesture||gesture.direction!=='horizontal'||window.innerWidth>=768)return;
    const touch=[...event.changedTouches].find(item=>item.identifier===gesture.id);
    if(!touch)return;
    const dx=touch.clientX-gesture.x;
    if(Math.abs(dx)<=48)return;
    const target=gesture.index+(dx<0?1:-1);
    if(target>=0&&target<n){go(target);return;}
    const nextSection=SHOW_REELS?'reels':'jobs';
    goTo(target<0?'combat-path':nextSection);
  },{passive:true});
  list.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
  update(0);
  const fn=dir=>go(cur+dir);
  fn.reset=()=>{cur=-1;go(0)};
  return fn;
}
const cmdMove=mkCmdCarousel();
/* ── Swipe support ── */
function addSwipe(el,moveFn,onEdge){
  let sx=0,sy=0,dir=null;
  el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;dir=null;},{passive:true});
  el.addEventListener('touchmove',e=>{
    if(dir===null){
      const dx=Math.abs(e.touches[0].clientX-sx);
      const dy=Math.abs(e.touches[0].clientY-sy);
      if(dx>5||dy>5)dir=dx>dy?'h':'v';
    }
    if(dir==='h')e.preventDefault();
  },{passive:false});
  el.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-sx;
    if(dir==='h'&&Math.abs(dx)>40){
      const d=dx<0?1:-1;
      const moved=moveFn(d);
      if(!moved&&onEdge)onEdge(d);
    }
    dir=null;
  },{passive:true});
}
/* ── Reels carousel (mobile only) ── */
function mkReelCarousel(){
  if(window.innerWidth>=768)return()=>{};
  let cur=0;
  const grid=document.getElementById('rl-grid');
  const n=grid.querySelectorAll('.reel-card').length;
  const prev=document.getElementById('rl-prev');
  const next=document.getElementById('rl-next');
  function go(i){
    const newCur=Math.max(0,Math.min(n-1,i));
    if(newCur===cur)return false;
    cur=newCur;
    grid.style.transform=`translateX(-${cur*100}%)`;
    prev.classList.toggle('off',cur===0);
    next.classList.toggle('off',cur===n-1);
    return true;
  }
  go(0);
  const fn=dir=>go(cur+dir);
  fn.reset=()=>{cur=-1;go(0)};
  return fn;
}
const rlMove=mkReelCarousel();
/* ── Reset carousels when section leaves viewport ── */
(function(){
  function watchReset(sectionId,moveFn){
    const sec=document.getElementById(sectionId);
    if(!sec||!moveFn.reset)return;
    new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(!e.isIntersecting)moveFn.reset()});
    },{threshold:0}).observe(sec);
  }
  watchReset('combat-system',csMove);
  watchReset('combat-path',cpMove);
  watchReset('reels',rlMove);
})();
/* ── Section navigation helper ── */
const MOBILE_SECTIONS=['hero','results','combat-system','combat-path','commanders','reels','jobs','faq','contacts'].filter(s=>SHOW_REELS||s!=='reels');
const SECTION_CAROUSELS={'combat-system':csMove,'combat-path':cpMove,'commanders':cmdMove,'reels':rlMove};
function carouselEdgeBtn(moveFn,sectionId,dir){
  if(sectionId==='commanders'){moveFn(dir);return;}
  if(window.innerWidth>=768){moveFn(dir);return;}
  const moved=moveFn(dir);
  if(!moved)mobileSecNav(sectionId,dir);
}
function mobileSecNav(fromId,dir){
  if(window.innerWidth>=768)return;
  setTimeout(()=>SECTION_CAROUSELS[fromId]?.reset?.(),500);
  const i=MOBILE_SECTIONS.indexOf(fromId);
  const nextId=MOBILE_SECTIONS[i+dir];
  if(nextId)goTo(nextId);
}
addSwipe(document.getElementById('reels'),rlMove,d=>mobileSecNav('reels',d));
addSwipe(document.querySelector('#cs-track').closest('.carousel'),csMove,d=>mobileSecNav('combat-system',d));
addSwipe(document.querySelector('#cp-track').closest('.carousel'),cpMove,d=>mobileSecNav('combat-path',d));

/* ── RESULTS COUNTER ANIMATION ── */
function animateResults(){
  document.querySelectorAll('.stat-label').forEach((el,i)=>{
    setTimeout(()=>el.classList.add('vis'),i*120);
  });
  document.querySelectorAll('.stat-destroyed').forEach((el,i)=>{
    setTimeout(()=>el.classList.add('vis'),i*120+80);
  });
  // Slot-machine for numbers
  document.querySelectorAll('.stat-num-inner').forEach((el,i)=>{
    const final=el.dataset.target;
    let val=0;
    const num=parseInt(final);
    if (!Number.isFinite(num)) { el.textContent=final; el.classList.add("vis"); return; }
    let step=0;
    const interval=setInterval(()=>{
      step++;
      const random=Math.floor(Math.random()*num);
      el.textContent=step<10?random:final;
      if(step>=10){clearInterval(interval);el.classList.add('vis')}
    },80);
    setTimeout(()=>{clearInterval(interval);el.textContent=final;el.classList.add('vis')},i*200+1200);
  });
  document.querySelectorAll('.stat-inf').forEach((el,i)=>{
    setTimeout(()=>el.classList.add('vis'),(i+4)*200+400);
  });
}

/* ── INTERSECTION OBSERVER ── */
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')});
},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal,.cmd-card').forEach(el=>io.observe(el));

// Results
const resultsIO=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){animateResults();resultsIO.disconnect()}});
},{threshold:.2});
const rg=document.getElementById('results-grid');
if(rg)resultsIO.observe(rg);

// Timeline stagger
const tlIO=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.tl-item').forEach((el,i)=>setTimeout(()=>el.classList.add('vis'),i*150));
      tlIO.unobserve(e.target);
    }
  });
},{threshold:.3});
const tl=document.getElementById('timeline-scroll');
if(tl)tlIO.observe(tl);

/* ── Horizontal event timeline ── */
function initTimelineScroll(){
  const viewport=document.getElementById('timeline-scroll');
  if(!viewport)return;
  let autoFrame=0;
  let autoTimer=0;
  let autoStarted=false;
  let wheelFrame=0;
  let wheelTarget=viewport.scrollLeft;
  function cancelWheel(){
    if(wheelFrame)window.cancelAnimationFrame(wheelFrame);
    wheelFrame=0;
    wheelTarget=viewport.scrollLeft;
  }
  function glideWheel(){
    const distance=wheelTarget-viewport.scrollLeft;
    if(Math.abs(distance)<.35){
      viewport.scrollLeft=wheelTarget;
      wheelFrame=0;
      return;
    }
    viewport.scrollLeft+=distance*.18;
    wheelFrame=window.requestAnimationFrame(glideWheel);
  }
  function cancelAuto(){
    if(autoTimer)window.clearTimeout(autoTimer);
    if(autoFrame)window.cancelAnimationFrame(autoFrame);
    autoTimer=0;
    autoFrame=0;
    viewport.classList.remove('is-auto-scrolling');
  }
  function startAuto(){
    if(autoStarted)return;
    autoStarted=true;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    cancelWheel();
    const end=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
    if(end<=1)return;
    autoTimer=window.setTimeout(()=>{
      const from=viewport.scrollLeft;
      const distance=end-from;
      if(distance<=1)return;
      const duration=Math.max(14000,Math.min(30000,distance*18));
      const started=window.performance.now();
      viewport.classList.add('is-auto-scrolling');
      function step(now){
        const progress=Math.min(1,(now-started)/duration);
        viewport.scrollLeft=from+distance*progress;
        if(progress<1)autoFrame=window.requestAnimationFrame(step);
        else cancelAuto();
      }
      autoFrame=window.requestAnimationFrame(step);
    },1100);
  }
  let edgesFrame=0;
  let lastBefore=null;
  let lastAfter=null;
  function updateEdges(){
    edgesFrame=0;
    const before=viewport.scrollLeft>1;
    const after=viewport.scrollLeft+viewport.clientWidth<viewport.scrollWidth-1;
    if(before!==lastBefore){
      viewport.classList.toggle('has-before',before);
      lastBefore=before;
    }
    if(after!==lastAfter){
      viewport.classList.toggle('has-after',after);
      lastAfter=after;
    }
  }
  function scheduleEdges(){
    if(!edgesFrame)edgesFrame=window.requestAnimationFrame(updateEdges);
  }
  function updateLayout(){
    const track=document.getElementById("tl-items");
    const dot=track?.querySelector(".tl-dot");
    const line=track?.querySelector(".tl-line");
    if(dot&&line)line.style.top=`${dot.offsetTop+2.5}px`;
    updateEdges();
  }
  function move(direction){
    const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
    viewport.scrollBy({left:direction*viewport.clientWidth*.75,behavior});
  }
  viewport.addEventListener('scroll',scheduleEdges,{passive:true});
  viewport.addEventListener('wheel',event=>{
    const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
    if(!delta)return;
    event.preventDefault();
    cancelAuto();
    const unit=event.deltaMode===1?28:event.deltaMode===2?viewport.clientWidth:1;
    const end=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
    wheelTarget=Math.max(0,Math.min(end,(wheelFrame?wheelTarget:viewport.scrollLeft)+delta*unit));
    if(!wheelFrame)wheelFrame=window.requestAnimationFrame(glideWheel);
  },{passive:false});
  let drag=null;
  viewport.addEventListener('dragstart',event=>event.preventDefault());
  viewport.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'){cancelAuto();cancelWheel();return;}
    if(!event.isPrimary||event.button!==0)return;
    const rect=viewport.getBoundingClientRect();
    if(event.clientY>rect.top+viewport.clientHeight)return;
    cancelAuto();
    cancelWheel();
    event.preventDefault();
    viewport.focus({preventScroll:true});
    drag={id:event.pointerId,x:event.clientX,left:viewport.scrollLeft};
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    viewport.scrollLeft=drag.left-(event.clientX-drag.x);
  });
  function finishDrag(event){
    if(!drag||(event&&event.pointerId!==drag.id))return;
    const id=drag.id;
    drag=null;
    viewport.classList.remove('is-dragging');
    if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);
  }
  viewport.addEventListener('pointerup',finishDrag);
  viewport.addEventListener('pointercancel',finishDrag);
  viewport.addEventListener('lostpointercapture',finishDrag);
  viewport.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      cancelAuto();
      cancelWheel();
      event.preventDefault();move(event.key==='ArrowLeft'?-1:1);
    }else if(event.key==='Home'||event.key==='End'){
      cancelAuto();
      cancelWheel();
      event.preventDefault();viewport.scrollTo({left:event.key==='Home'?0:viewport.scrollWidth,behavior:'instant'});
    }
  });
  const timelineResize=new ResizeObserver(updateLayout);
  timelineResize.observe(viewport);
  const timelineTrack=document.getElementById('tl-items');
  if(timelineTrack)timelineResize.observe(timelineTrack);
  const timelineReveal=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){
      timelineReveal.disconnect();
      startAuto();
    }
  },{threshold:.55});
  timelineReveal.observe(viewport);
  updateLayout();
}
initTimelineScroll();

// Reels stagger
const reelsIO=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.querySelectorAll('.reel-card').forEach((el,i)=>setTimeout(()=>el.classList.add('vis'),i*100));
  });
},{threshold:.1});
const reelsG=document.getElementById('rl-grid');
if(reelsG)reelsIO.observe(reelsG);

// Jobs stagger
const jobsIO=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.querySelectorAll('.job-card').forEach((el,i)=>setTimeout(()=>el.classList.add('vis'),i*120));
  });
},{threshold:.1});
const jobsG=document.getElementById('jobs-grid');
if(jobsG)jobsIO.observe(jobsG);

/* ── REELS YOUTUBE ── */
document.querySelectorAll('.reel-card').forEach(card=>{
  const ytId=card.dataset.yt;
  const iframe=card.querySelector('iframe');
  let loaded=false;
  card.addEventListener('mouseenter',()=>{
    if(!loaded&&ytId){
      iframe.src=`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1`;
      loaded=true;
    }
  });
  card.addEventListener('mouseleave',()=>{
    iframe.src='';
    loaded=false;
  });
});

/* ── FAQ ACCORDION ── */
function toggleFaq(item){
  item.classList.toggle('open');
}

/* ── MODAL ── */
let _modalScrollY=0;
function escapeContent(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let vacancyTrigger=null;
function openVacancy(job,trigger){
  vacancyTrigger=trigger;
  document.getElementById('modal-title').textContent=job.title;
  document.getElementById('modal-sub').textContent=job.unit;
  for(const [id,value] of [['modal-duties-list',job.duties],['modal-reqs-list',job.requirements]]){
    const list=document.getElementById(id);
    const rows=value.split('\n').map(line=>line.trim()).filter(Boolean);
    list.replaceChildren(...rows.map(text=>Object.assign(document.createElement('li'),{textContent:text})));
    list.parentElement.hidden=!rows.length;
  }
  const link=document.querySelector('#modal .modal-anketa-btn');
  const usable=/^https?:\/\//i.test(job.url.trim());
  link.setAttribute('href',usable?job.url.trim():'#');
  link.toggleAttribute('data-pending-link',!usable);
  link.setAttribute('aria-disabled',String(!usable));
  link.closest('.modal-footer').hidden=!usable;
  document.querySelector('#modal .modal-anketa-hint').hidden=true;
  document.getElementById('modal').classList.add('open');
  document.getElementById('modal-scroll').scrollTop=0;
  _modalScrollY=window.scrollY;
  document.body.style.overflow='hidden';
  document.body.style.position='fixed';
  document.body.style.top=`-${_modalScrollY}px`;
  document.body.style.width='100%';
  document.querySelector('#modal .modal-close').focus({preventScroll:true});
}
function closeModal(){
  document.getElementById('modal').classList.remove('open');
  document.body.style.position='';
  document.body.style.top='';
  document.body.style.overflow='';
  document.body.style.width='';
  window.scrollTo(0,_modalScrollY);
  if(vacancyTrigger?.isConnected)vacancyTrigger.focus({preventScroll:true});
  vacancyTrigger=null;
}
function closeModalOutside(e){if(e.target===document.getElementById('modal'))closeModal()}

let _cmdModalScrollY=0;
function openCmdModal(key){
  const cmd=CMD_BIOS[key];
  if(!cmd)return;
  document.getElementById('cmd-modal-name').textContent=cmd.name;
  document.getElementById('cmd-modal-rank').textContent=cmd.rank;
  document.getElementById('cmd-modal-name-m').textContent=cmd.name;
  document.getElementById('cmd-modal-rank-m').textContent=cmd.rank;
  const photoWrap=document.getElementById('cmd-modal-photo-wrap');
  photoWrap.innerHTML=cmd.photo?`<img class="cmd-modal-photo" src="${escapeContent(cmd.photo)}" alt="${escapeContent(cmd.name)}">`:'';
  const bioEl=document.getElementById('cmd-modal-bio');
  bioEl.innerHTML=cmd.bio.split('\n\n').map(p=>`<p>${escapeContent(p.trim())}</p>`).join('');
  bioEl.classList.toggle('two-col',!!cmd.twoCol);
  document.querySelector('#cmd-modal .modal-box').classList.toggle('wide',!!cmd.twoCol);
  document.getElementById('cmd-modal').classList.add('open');
  const _cb=document.querySelector('.cmd-modal-body');
  _cb.scrollTop=0;
  _cb.querySelector('.cmd-modal-fade').style.opacity='0';
  _cmdModalScrollY=window.scrollY;
  document.body.style.overflow='hidden';
  document.body.style.position='fixed';
  document.body.style.top=`-${_cmdModalScrollY}px`;
  document.body.style.width='100%';
}
function closeCmdModal(){
  document.getElementById('cmd-modal').classList.remove('open');
  document.body.style.position='';
  document.body.style.top='';
  document.body.style.overflow='';
  document.body.style.width='';
  window.scrollTo(0,_cmdModalScrollY);
}
function closeCmdModalOutside(e){if(e.target===document.getElementById('cmd-modal'))closeCmdModal()}

document.querySelector('.cmd-modal-body').addEventListener('scroll',function(){
  const photoH=document.getElementById('cmd-modal-photo-wrap').offsetHeight||0;
  const progress=Math.max(0,this.scrollTop-photoH);
  this.querySelector('.cmd-modal-fade').style.opacity=Math.min(1,progress/36);
},{passive:true});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeCmdModal();closeBurger()}});

/* ── CMD QUOTE CENTERING ── */
function updateCmdQuotes(){
  document.querySelectorAll('.cmd-card').forEach(card=>{
    const info=card.querySelector('.cmd-info');
    const quote=card.querySelector('.cmd-quote');
    if(!info||!quote)return;
    if(window.innerWidth<768){
      const maxOverlap=36;
      const overlap=Math.max(0,Math.min(quote.offsetHeight/2-20,maxOverlap));
      const nameHeight=card.querySelector('.cmd-name')?.offsetHeight||0;
      const rankHeight=card.querySelector('.cmd-rank')?.offsetHeight||0;
      info.style.marginTop=`-${overlap+nameHeight+rankHeight}px`;
    }else{
      info.style.removeProperty('margin-top');
    }
  });
}
updateCmdQuotes();
window.addEventListener('resize',updateCmdQuotes);
const quoteResize=new ResizeObserver(updateCmdQuotes);
document.querySelectorAll('.cmd-quote,.cmd-name,.cmd-rank').forEach(element=>quoteResize.observe(element));

/* ── BURGER ── */
const burgerBtn=document.getElementById('burger');
const burgerPanel=document.getElementById('burger-panel');
const burgerOverlayEl=document.getElementById('burger-overlay');
function openBurger(){
  burgerBtn.classList.add('open');
  burgerPanel.classList.add('open');
  burgerOverlayEl.classList.add('open');
}
function closeBurger(){
  burgerBtn.classList.remove('open');
  burgerPanel.classList.remove('open');
  burgerOverlayEl.classList.remove('open');
}
burgerBtn.addEventListener('click',()=>{burgerBtn.classList.contains('open')?closeBurger():openBurger()});
document.addEventListener('click',e=>{
  if(burgerPanel.classList.contains('open')&&!burgerPanel.contains(e.target)&&!burgerBtn.contains(e.target))closeBurger();
});
let burgerNavScrollTimer=null;
let burgerNavScrolling=false;
window.addEventListener('scroll',()=>{
  if(burgerPanel.classList.contains('open')&&!burgerNavScrolling)closeBurger();
},{passive:true});
function burgerNav(btn){
  const target=btn.dataset.target;
  burgerNavScrolling=true;
  clearTimeout(burgerNavScrollTimer);
  burgerNavScrollTimer=setTimeout(()=>{burgerNavScrolling=false;},1000);
  document.getElementById(target)?.querySelectorAll('.reveal').forEach(el=>el.classList.add('vis'));
  goTo(target);
}

// Незаповнені посилання не ведуть на сторінки вихідного підрозділу.
document.addEventListener("click", e => { if(e.target.closest("[data-pending-link]")) e.preventDefault(); });
