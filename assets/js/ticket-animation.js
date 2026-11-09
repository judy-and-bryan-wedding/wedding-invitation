(function(){
const $=s=>document.querySelector(s),T=$('#ticket'),S=$('#stage'),FX=$('#fx'),FL=$('#flash'),F=$('#fit'),btn=$('#btn'),SHN=$('#shine');
let sc=1;
function fit(){sc=Math.max(.5,Math.min(1.35,T.offsetWidth/534));S.style.transform='';F.style.height=''}
fit();addEventListener('resize',fit);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.random()*(b-a);
const R=(sx,sy,x=0,y=0,r=0)=>`translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`;
let fxPad=100;
const ticketRect=()=>({left:fxPad,top:fxPad,width:T.offsetWidth,height:T.offsetHeight,bottom:fxPad+T.offsetHeight});
const localRect=e=>({left:fxPad+e.offsetLeft,top:fxPad+e.offsetTop,width:e.offsetWidth,height:e.offsetHeight,bottom:fxPad+e.offsetTop+e.offsetHeight});
const SM=document.createElement('canvas');SM.style.cssText='position:absolute;inset:0;width:100%;height:100%';FX.appendChild(SM);
const sx=SM.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);
function rs(){fxPad=Math.min(120,Math.max(70,T.offsetWidth*.17));FX.style.setProperty('--fx-pad',`${fxPad}px`);SM.width=FX.offsetWidth*dpr;SM.height=FX.offsetHeight*dpr}rs();addEventListener('resize',rs);
if(typeof ResizeObserver!=='undefined') new ResizeObserver(()=>{fit();rs()}).observe(T);
const sprites=[];
for(let k=0;k<4;k++){
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 for(let pass=0;pass<2;pass++){
  for(let i=0;i<34;i++){
   const a=Math.random()*6.283,d=Math.random()*70,o=pass?0:12,x=128+Math.cos(a)*d+o,y=128+Math.sin(a)*d+o,r=28+Math.random()*42;
   const gr=g.createRadialGradient(x,y,0,x,y,r),col=pass?'255,255,255':'176,196,222';
   gr.addColorStop(0,`rgba(${col},${pass?.2:.16})`);gr.addColorStop(1,`rgba(${col},0)`);
   g.fillStyle=gr;g.fillRect(0,0,256,256);
  }
 }
 g.globalCompositeOperation='destination-in';
 const m=g.createRadialGradient(128,128,20,128,128,126);m.addColorStop(0,'#fff');m.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=m;g.fillRect(0,0,256,256);
 sprites.push(c);
}
const parts=[];
function mkPuff(x,y,size,dx,dy,dur){
 for(let k=0;k<2;k++){
  parts.push({x:x+rnd(-.25,.25)*size,y:y+rnd(-.25,.25)*size,vx:dx/dur*1000*rnd(.8,1.2),vy:dy/dur*1000*rnd(.8,1.2),s:size*2.4*rnd(.7,1),gr:rnd(.5,1.1),rot:rnd(0,6.283),vr:rnd(-.7,.7),age:0,life:dur*rnd(1.1,1.8)/1000,al:rnd(.55,.9),sp:sprites[(Math.random()*4)|0],ph:rnd(0,6.283)});
 }
}
let lastT=0;
function drawSmoke(t){
 const dt=Math.min((t-lastT)/1000||.016,.05);lastT=t;
 sx.setTransform(dpr,0,0,dpr,0,0);sx.clearRect(0,0,FX.offsetWidth,FX.offsetHeight);
 for(let i=parts.length-1;i>=0;i--){
  const p=parts[i];p.age+=dt;const u=p.age/p.life;
  if(u>=1){parts.splice(i,1);continue}
  const drag=Math.pow(.45,dt);p.vx*=drag;p.vy*=drag;
  p.vy-=26*sc*dt;p.vx+=Math.sin(p.age*2.2+p.ph)*30*sc*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;
  const size=p.s*(.35+p.gr*Math.sqrt(u)*1.3),a=p.al*Math.min(1,u*8)*Math.pow(1-u,1.4);
  sx.globalAlpha=a;sx.save();sx.translate(p.x,p.y);sx.rotate(p.rot);sx.drawImage(p.sp,-size/2,-size/2,size,size);sx.restore();
 }
 sx.globalAlpha=1;
}
function landPuffs(){
 const r=ticketRect();
 for(let i=0;i<12;i++){
  const side=i%2?1:-1,x=r.left+r.width*(.5+side*rnd(.1,.48));
  mkPuff(x,r.bottom-8,rnd(40,90)*sc,side*rnd(60,220)*sc,rnd(-60,-10)*sc,rnd(700,1100));
 }
}
function aroundPuffs(n){
 const r=ticketRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 for(let i=0;i<n;i++){
  const a=rnd(0,6.283),ex=r.width/2*rnd(.8,1.05),ey=r.height/2*rnd(.8,1.1);
  mkPuff(cx+Math.cos(a)*ex,cy+Math.sin(a)*ey,rnd(50,110)*sc,Math.cos(a)*rnd(80,260)*sc,Math.sin(a)*rnd(60,180)*sc-40*sc,rnd(800,1300));
 }
}
let trail=false,last=0;
(function loop(t){
 if(trail&&t-last>45){last=t;const r=ticketRect();
  mkPuff(r.left+rnd(.1,.9)*r.width,r.bottom-rnd(0,r.height*.25),rnd(30,70)*sc,rnd(-40,40)*sc,rnd(-50,-10)*sc,rnd(500,800))}
 drawSmoke(t);requestAnimationFrame(loop)})(0);
function ring(gold){const e=document.createElement('div');e.className='ring';if(gold){e.style.borderColor='#ffd34d';e.style.boxShadow='0 0 30px #ffb81c,inset 0 0 30px #ffd34d'}S.appendChild(e);
 const endScale=gold?1.2:1.05;
 e.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.82,transform:'translate(-50%,-50%) scale(.38)',offset:.16},{opacity:0,transform:`translate(-50%,-50%) scale(${endScale})`}],{duration:680,easing:'cubic-bezier(.16,1,.3,1)'}).onfinish=()=>e.remove()}
function drum(){ring();
 FL.animate([{opacity:0},{opacity:.28,offset:.12},{opacity:0}],{duration:420})}
const G0='drop-shadow(0 12px 12px rgba(30,60,100,.22))';
const G1=G0;
const G2=G0;
function goldSparks(n){
 const r=ticketRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 for(let i=0;i<n;i++){
  const p=document.createElement('div');p.className='gs';
  const a=rnd(0,6.283),sz=rnd(14,36)*sc;
  const x=cx+Math.cos(a)*r.width*.5*rnd(.7,1.05),y=cy+Math.sin(a)*r.height*.5*rnd(.7,1.1);
  p.style.cssText+=`width:${sz}px;height:${sz}px;left:${x-sz/2}px;top:${y-sz/2}px`;FX.appendChild(p);
  const dx=Math.cos(a)*rnd(60,220)*sc,dy=Math.sin(a)*rnd(60,170)*sc;
  p.animate([{opacity:0,transform:'scale(0) rotate(0deg)'},{opacity:1,transform:`translate(${dx*.4}px,${dy*.4}px) scale(1.1) rotate(90deg)`,offset:.3},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(0) rotate(240deg)`}],{duration:rnd(600,1000)}).onfinish=()=>p.remove();
 }
}
const STP=$('#stamp'),STP2=$('#stamp2'),rsv=$('#rsv'),dcl=$('#dcl'),RSVPFORM=$('#rsvpForm');
const RSVP=[...document.querySelectorAll('input[name="rsvpStatus"]')];
const hasRSVPChoice=()=>RSVP.some(control=>control.checked);
const lockRSVP=locked=>RSVP.forEach(control=>{control.disabled=locked});
const afterTwoFrames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function revealChosenTicket(){
 T.getAnimations().forEach(animation=>animation.cancel());
 $('#card').getAnimations().forEach(animation=>animation.cancel());
 T.style.opacity=1;T.style.transform='none';T.style.willChange='auto';
 const isFinal=RSVPFORM?.dataset.final==='true';
 btn.disabled=false;rsv.disabled=false;dcl.disabled=false;lockRSVP(isFinal);
}
function playOrRevealChoice(){
 if(hasRSVPChoice()){revealChosenTicket();return}
 play();
}
window.syncTicketToRsvpChoice=revealChosenTicket;
window.setWitnessTicketState=()=>$('#card')?.classList.add('witness-infected');
async function settleTicket(){
 T.style.transform='none';
 T.getAnimations().forEach(animation=>animation.cancel());
 T.style.willChange='auto';
 await afterTwoFrames();
}
async function reserve(){
 rsv.disabled=true;dcl.disabled=true;btn.disabled=true;lockRSVP(true);
 T.getAnimations().forEach(animation=>animation.cancel());T.style.transform='none';T.style.willChange='transform';
 STP.getAnimations().forEach(a=>a.cancel());
 const impact=wait(330).then(async()=>{
  const r=localRect(STP),cx=r.left+r.width/2,cy=r.top+r.height/2;
  for(let i=0;i<10;i++){const a=rnd(0,6.283);mkPuff(cx+Math.cos(a)*r.width*.3,cy+Math.sin(a)*r.height*.3,rnd(40,80)*sc,Math.cos(a)*rnd(100,240)*sc,Math.sin(a)*rnd(60,140)*sc,rnd(700,1100))}
  goldSparks(14);ring(true);
  FL.animate([{opacity:0},{opacity:.35,offset:.1},{opacity:0}],{duration:350});
  await T.animate([{transform:R(1,1)},{transform:R(1,1,0,4),offset:.32},{transform:R(1,1,0,-2),offset:.68},{transform:R(1,1)}],{duration:620,easing:'cubic-bezier(.22,1,.36,1)'}).finished;
 });
 const stamp=STP.animate([
  {opacity:0,transform:'translateY(-55px) rotate(-24deg) scale(2.2)',easing:'ease-in'},
  {opacity:1,transform:'translateY(0) rotate(-11deg) scale(.98)',offset:.58,easing:'ease-out'},
  {transform:'rotate(-12.5deg) scale(1.025)',offset:.78},
  {opacity:1,transform:'rotate(-12deg) scale(1)'}
 ],{duration:680,fill:'forwards'});
 await Promise.all([stamp.finished,impact]);
 await settleTicket();
 rsv.textContent='RESERVED';btn.disabled=false;
}
async function decline(){
 rsv.disabled=true;dcl.disabled=true;btn.disabled=true;lockRSVP(true);
 T.getAnimations().forEach(animation=>animation.cancel());T.style.transform='none';T.style.willChange='transform';
 STP2.getAnimations().forEach(a=>a.cancel());
 await T.animate([
  {transform:R(1,1)},{transform:R(1,1,-26,0,-2)},{transform:R(1,1,24,0,2)},{transform:R(1,1,-20,0,-1.5)},{transform:R(1,1,16,0,1)},{transform:R(1,1,-8,0,-.5)},{transform:R(1,1)}
 ],{duration:700,easing:'ease-in-out'}).finished;
 $('#card').animate([{filter:'grayscale(0) brightness(1)'},{filter:'grayscale(.9) brightness(.92)'}],{duration:500,fill:'forwards'});
 setTimeout(()=>{
  const e=document.createElement('div');e.className='ring';e.style.borderColor='#8b97a3';e.style.boxShadow='0 0 30px #8b97a3,inset 0 0 30px #8b97a3';S.appendChild(e);
  e.animate([{opacity:.9,transform:'translate(-50%,-50%) scale(.25)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.15)'}],{duration:700,easing:'ease-out'}).onfinish=()=>e.remove();
  F.animate([{transform:'translate(0,0)'},{transform:'translate(-10px,6px)'},{transform:'translate(8px,-4px)'},{transform:'translate(-4px,0)'},{transform:'translate(0,0)'}],{duration:350});
 },325);
 await STP2.animate([
  {opacity:0,transform:'translateX(420px) rotate(34deg) scale(1.8)',easing:'cubic-bezier(.5,0,.9,.4)'},
  {opacity:1,transform:'translateX(0) rotate(8deg) scale(.98)',offset:.56,easing:'ease-out'},
  {transform:'rotate(10.5deg) scale(1.02)',offset:.78},
  {opacity:1,transform:'rotate(10deg) scale(1)'}
 ],{duration:700,fill:'forwards'}).finished;
 await T.animate([{transform:R(1,1)},{transform:R(1,1,0,4,.5),offset:.38},{transform:R(1,1,0,-1,-.2),offset:.7},{transform:R(1,1)}],{duration:560,easing:'cubic-bezier(.22,1,.36,1)'}).finished;
 await settleTicket();
 dcl.textContent='DECLINED';btn.disabled=false;
}
async function play(){
 const CARD=$('#card'),GT=$('#gtint'),GB=$('#gband');
 btn.disabled=true;rsv.disabled=true;dcl.disabled=true;lockRSVP(true);rsv.textContent='RESERVE';dcl.textContent='DECLINE';STP.getAnimations().forEach(a=>a.cancel());STP2.getAnimations().forEach(a=>a.cancel());$('#card').getAnimations().forEach(a=>a.cancel());
 T.getAnimations().forEach(a=>a.cancel());
 T.style.willChange='transform';CARD.style.willChange='transform';
 T.style.opacity=0;
 // 1. heartbeat drums
 await wait(300);drum();
 await wait(700);drum();
 FL.animate([{opacity:0},{opacity:.95,offset:.25},{opacity:0}],{duration:700});
 await wait(250);
 // 2. rubber ball drops in and bounces
 const reservations=document.getElementById('reservations');
 const sectionTop=reservations?.getBoundingClientRect().top??S.getBoundingClientRect().top;
 const fy=sectionTop-S.getBoundingClientRect().top+18;T.style.opacity=1;trail=true;
 const D=1700;
 [.3,.6,.8,1].forEach(o=>setTimeout(()=>{landPuffs();F.animate([{transform:'translateY(0)'},{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:200})},D*o));
 await T.animate([
  {transform:R(.3,.3,0,fy,-35),easing:'ease-in',offset:0},
  {transform:R(.85,1.28,0,-20,4),easing:'ease-in',offset:.27},
  {transform:R(1.08,.88,0,20,2),easing:'ease-out',offset:.3},
  {transform:R(.94,1.09,0,-150,-3),easing:'ease-in',offset:.45},
  {transform:R(1.06,.92,0,16),easing:'ease-out',offset:.6},
  {transform:R(.98,1.03,0,-70,2),easing:'ease-in',offset:.7},
  {transform:R(1.09,.93,0,12),easing:'ease-out',offset:.8},
  {transform:R(1,1,0,-26),easing:'ease-in',offset:.9},
  {transform:R(1,1),offset:1}
 ],{duration:D,fill:'forwards'}).finished;
 trail=false;
 // 3. inflate with glow, joyful jiggle
 T.animate([{filter:G0},{filter:G1}],{duration:500,fill:'forwards'});
 setTimeout(()=>{drum();aroundPuffs(14)},260);
 setTimeout(()=>{drum();aroundPuffs(10)},900);
 await T.animate([
  {transform:R(1,1),offset:0},
  {transform:R(1.08,.88,0,6),offset:.1},
  {transform:R(1.07,1.07,0,-14),easing:'ease-out',offset:.28},
  {transform:R(1.04,1.08,0,-17,-2.5),offset:.4},
  {transform:R(1.08,1.04,0,-12,2.5),offset:.52},
  {transform:R(1.05,1.07,0,-16,-2),offset:.64},
  {transform:R(1.03,1.03,0,-9,1.2),offset:.76},
  {transform:R(1.01,1.01,0,-4,-.5),offset:.88},
  {transform:R(1,1),offset:1}
 ],{duration:1600,fill:'forwards',easing:'ease-in-out'}).finished;
 // 3b. 360 spin with gold lighting
 T.animate([{filter:G1},{filter:G2}],{duration:350,fill:'forwards'});
 ring(true);
 const spark=setInterval(()=>goldSparks(5),60);
 GT.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0}],{duration:1500});
 GB.animate([{transform:'skewX(-20deg) translateX(-120%)'},{transform:'skewX(-20deg) translateX(330%)'}],{duration:750,iterations:2,easing:'ease-in-out'});
 const spin=CARD.animate([
  {transform:'perspective(1400px) rotateY(0deg)',easing:'ease-out',offset:0},
  {transform:'perspective(1400px) rotateY(-22deg)',easing:'cubic-bezier(.5,0,.25,1)',offset:.14},
  {transform:'perspective(1400px) rotateY(-360deg)',easing:'ease-in-out',offset:.82},
  {transform:'perspective(1400px) rotateY(-360deg)',offset:1}
 ],{duration:1500});
 const lift=T.animate([
  {transform:R(1,1),easing:'ease-out'},
  {transform:R(1,1,0,-8),offset:.35,easing:'ease-in-out'},
  {transform:R(1,1),offset:.82,easing:'ease-in-out'},
  {transform:R(1,1)}
 ],{duration:1500,fill:'forwards'});
 await Promise.all([spin.finished,lift.finished]);
 clearInterval(spark);
 CARD.style.transform='none';
 T.style.transform='none';
 spin.cancel();
 T.getAnimations().forEach(a=>a.cancel());
 CARD.style.willChange='auto';T.style.willChange='auto';T.style.opacity=1;
 await afterTwoFrames();
 goldSparks(26);
 FL.animate([{opacity:0},{opacity:.45,offset:.15},{opacity:0}],{duration:450});
 // 4. finish effects with the ticket already at its exact resting position
 trail=false;
 const finalShine=SHN.animate([{transform:'skewX(-20deg) translateX(-200%)'},{transform:'skewX(-20deg) translateX(1100%)'}],{duration:800,easing:'ease-in-out'});
 await finalShine.finished;
 await wait(120);
 btn.disabled=false;rsv.disabled=false;dcl.disabled=false;lockRSVP(false);
}
dcl.onclick=decline;rsv.onclick=reserve;btn.onclick=()=>{if(!hasRSVPChoice())play()};T.onclick=()=>{if(!hasRSVPChoice()&&!btn.disabled)play()};
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.6)){observer.disconnect();playOrRevealChoice()}},{threshold:[.6]});
 observer.observe(T);
}else{
 const playInReservations=()=>{
  const r=T.getBoundingClientRect();
  if(r.top<innerHeight*.8&&r.bottom>innerHeight*.2){removeEventListener('scroll',playInReservations);playOrRevealChoice()}
 };
 addEventListener('scroll',playInReservations,{passive:true});playInReservations();
}
})();
