// ================= E: SAIL THROTTLE (lever 0-100%) =================
// S.sail = lever setting (cap, 0..1, default 1). P.throttle = joystick trim (0..1). Effective sail = trim x cap.
const THR_N=[0,0.25,0.5,0.75,1];let thrJoyT=0,thrWarnT=0,thrLastTap=0,thrDrag=null,thrKey='';
function thrCap(){return (S&&typeof S.sail==='number')?clamp(S.sail,0,1):1;}
function thrEff(){return clamp(P.throttle,0,1)*thrCap();}
function thrSet(v,snap){v=clamp(+v||0,0,1);if(snap)for(const n of THR_N)if(Math.abs(v-n)<0.045)v=n;S.sail=Math.round(v*100)/100;P.throttle=1;thrUI(true);}
function thrStep(d){const c=thrCap();thrSet(d>0?Math.floor(c*4+1e-6)/4+0.25:Math.ceil(c*4-1e-6)/4-0.25);}
function thrNudge(x){S.sail=clamp(thrCap()+x,0,1);P.throttle=1;}
function thrStop(){thrSet(0);toast('⚓ All stop — sails furled, she holds position');}
function thrFull(){thrSet(1);}
(function(){const st=document.createElement('style');st.textContent=`
#thr{position:fixed;left:calc(8px + env(safe-area-inset-left));bottom:calc(22px + env(safe-area-inset-bottom));width:60px;height:250px;z-index:12;display:flex;flex-direction:column;align-items:center;gap:4px;padding:5px 0;box-sizing:border-box;border-radius:14px;touch-action:none;user-select:none;-webkit-user-select:none;
 background:linear-gradient(90deg,#1d1915,#38312a 45%,#1a1612);border:2px solid rgba(178,142,82,.85);box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 0 0 2px rgba(0,0,0,.55),inset 0 2px 3px rgba(255,235,200,.12);font-family:Georgia,'Times New Roman',serif}
body.steer-btns #thr{bottom:calc(160px + env(safe-area-inset-bottom))}
@media (max-height:520px) and (orientation:landscape){body.steer-btns #thr{left:calc(162px + env(safe-area-inset-left));bottom:calc(14px + env(safe-area-inset-bottom))}}
#thr.hidden,body.brawl #thr{display:none!important}
#thr .thrb{width:48px;height:40px;flex:none;border-radius:10px;border:1px solid rgba(178,142,82,.8);background:radial-gradient(circle at 40% 30%,#4a423b,#1a1613 75%);color:#eadcbd;font-size:17px;line-height:1;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(0,0,0,.6)}
#thr .thrb b{font-size:8.5px;letter-spacing:.8px;color:#d8c69c;margin-top:2px}
#thr .thrb:active,#thr .thrb.on{filter:brightness(1.45)}
#thrRead{flex:none;min-width:48px;text-align:center;font-size:13px;font-weight:700;color:#f3dfa8;background:#0d0b09;border:1px solid rgba(178,142,82,.6);border-radius:5px;padding:1px 0;text-shadow:0 0 4px rgba(255,190,80,.35)}
#thrRead.stop{color:#ff9b7a}
#thrTrack{position:relative;flex:1 1 auto;width:56px;min-height:60px;touch-action:none;cursor:ns-resize}
#thrSlot{position:absolute;left:15px;top:9px;bottom:9px;width:10px;border-radius:5px;background:linear-gradient(90deg,#050403,#2b2520 50%,#050403);box-shadow:inset 0 0 3px #000,0 0 0 1px rgba(178,142,82,.45)}
#thrFill{position:absolute;left:1px;right:1px;bottom:1px;border-radius:4px;background:linear-gradient(#e9c77a,#9a6c26);opacity:.85;height:0}
#thrTrack i{position:absolute;left:8px;width:24px;height:2px;margin-top:-1px;background:rgba(200,165,100,.75)}
#thrTrack u{position:absolute;left:37px;font-size:8.5px;text-decoration:none;color:#cdb98d;margin-top:-6px;line-height:12px}
#thrKnob{position:absolute;left:5px;width:30px;height:20px;margin-top:-10px;border-radius:5px;pointer-events:none;background:linear-gradient(#f6dc98,#b8873a 55%,#7a531c);border:1px solid #3a2608;box-shadow:0 2px 4px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.5)}
#thrKnob::after{content:'';position:absolute;left:6px;right:6px;top:6px;height:6px;background:repeating-linear-gradient(#5a3c12 0 1px,transparent 1px 3px)}
#thr.short #thrTrack u{display:none}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='thr';d.className='hidden';d.setAttribute('aria-label','Sail throttle');
 let tk='';for(const n of THR_N){const y=(1-n)*100;tk+=`<i style="top:calc(9px + (100% - 18px)*${(1-n).toFixed(2)})"></i><u style="top:calc(9px + (100% - 18px)*${(1-n).toFixed(2)})">${Math.round(n*100)}</u>`;}
 d.innerHTML=`<button class="thrb" id="thrFull" aria-label="Full sail">⛵<b>FULL</b></button><div id="thrRead">100%</div><div id="thrTrack">${tk}<div id="thrSlot"><div id="thrFill"></div></div><div id="thrKnob"></div></div><button class="thrb" id="thrStop" aria-label="All stop">⚓<b>STOP</b></button>`;
 document.body.appendChild(d);
 const stopE=e=>{e.stopPropagation();};for(const ev of ['pointerdown','pointermove','pointerup','touchstart'])d.addEventListener(ev,stopE);
 $('thrFull').addEventListener('click',e=>{e.preventDefault();thrFull();});$('thrStop').addEventListener('click',e=>{e.preventDefault();thrStop();});
 const tr=$('thrTrack');const vAt=y=>{const r=tr.getBoundingClientRect();return 1-(y-r.top-9)/Math.max(1,r.height-18);};
 tr.addEventListener('pointerdown',e=>{e.preventDefault();const now=performance.now();
  if(now-thrLastTap<320){thrLastTap=0;thrDrag=null;if(thrCap()>0.01)thrStop();else thrFull();return;}thrLastTap=now;
  thrDrag=e.pointerId;try{tr.setPointerCapture(e.pointerId);}catch(_){}thrSet(vAt(e.clientY),true);});
 tr.addEventListener('pointermove',e=>{if(e.pointerId!==thrDrag)return;e.preventDefault();thrSet(vAt(e.clientY),true);});
 const up=e=>{if(e.pointerId===thrDrag)thrDrag=null;};tr.addEventListener('pointerup',up);tr.addEventListener('pointercancel',up);tr.addEventListener('lostpointercapture',up);
 window.addEventListener('keydown',e=>{if(state!=='play'||isTyping(e.target))return;const k=(e.key||'').toLowerCase();
  if(k==='x'){thrStop();}else if(k==='+'||k==='='||k==='add'){thrStep(1);}else if(k==='-'||k==='_'||k==='subtract'){thrStep(-1);}});
 setInterval(()=>thrUI(false),120);})();
function thrLayout(el){const hb=Math.round($('hud').getBoundingClientRect().bottom)||110;const bot=parseFloat(getComputedStyle(el).bottom)||22;
 const H=Math.round(clamp(vh-bot-hb-14,150,260));const k=H+':'+vh;if(el.dataset.k!==k){el.dataset.k=k;el.style.height=H+'px';el.classList.toggle('short',H<175);}}
function thrUI(force){const el=$('thr');if(!el)return;const on=state==='play'&&!P.dead;el.classList.toggle('hidden',!on);if(!on)return;
 thrLayout(el);const c=thrCap(),eff=thrEff(),bo=P.boost>0;
 const key=[c,Math.round(eff*100),bo?1:0].join(':');if(!force&&key===thrKey)return;thrKey=key;
 $('thrKnob').style.top=`calc(9px + (100% - 18px)*${(1-c).toFixed(3)})`;$('thrFill').style.height=Math.round(eff*100)+'%';
 const r=$('thrRead');r.textContent=bo?'🚀 BOOST':c<0.005?'STOP':Math.round(eff*100)+'%';r.classList.toggle('stop',!bo&&c<0.005);
 $('thrStop').classList.toggle('on',c<0.005);$('thrFull').classList.toggle('on',c>0.995&&P.throttle>0.995);}
function thrTick(dt){
 if(joy.id!==null&&thrCap()<0.01&&Math.hypot(joy.x-joy.bx,joy.y-joy.by)>30){thrJoyT+=dt;if(thrJoyT>1.4&&performance.now()-thrWarnT>15000){thrWarnT=performance.now();toast('⚓ Sails furled — she turns in place. Raise the sail lever (left) to get under way.');}}else thrJoyT=0;
 if(S.tutDone&&!T.on&&S.playTime>45)showTip('sail');}
GH.tick.push(thrTick);
GH.mig.push(d=>{S.sail=(typeof d.sail==='number'&&isFinite(d.sail))?clamp(d.sail,0,1):1;});
Object.assign(TIPS,{sail:"⛵ <b>Sail lever</b> (left edge): slide to set speed. <b>⚓ STOP</b> = all stop — she holds position and turns in place to line up broadsides. Keys: W/S, +/−, X."});
