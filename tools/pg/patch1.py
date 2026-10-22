import re
p='/workspace/pirate-game/index.html'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,(n,old[:80])
    s=s.replace(old,new)

# ---------- CSS ----------
rep("#menuBtn{position:fixed;width:42px;height:42px;font-size:20px;","#menuBtn{position:fixed;width:50px;height:50px;font-size:22px;")
rep(".tabs button{flex:1;min-width:0;padding:8px 2px;",".tabs button{flex:1;min-width:0;min-height:48px;padding:8px 2px;")
rep("button.b{border:none;border-radius:9px;padding:9px 10px;","button.b{border:none;border-radius:9px;padding:9px 10px;min-height:48px;min-width:48px;")
rep("button.big{border:none;border-radius:12px;padding:12px 18px;","button.big{border:none;border-radius:12px;padding:12px 18px;min-height:48px;")
rep("#dockBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(110px + env(safe-area-inset-bottom));padding:12px 20px;",
    "#dockBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(110px + env(safe-area-inset-bottom));padding:12px 20px;min-height:52px;touch-action:none;")
rep("touch-action:manipulation;animation:pulse 1.2s infinite}","animation:pulse 1.2s infinite}")
rep("#xferTitleBtn{background:#7a4e1d;font-size:15px;padding:10px 16px}",
"""#xferTitleBtn{background:#7a4e1d;font-size:15px;padding:10px 16px}
#tutBtn{background:#2b6c8f;font-size:15px;padding:10px 16px}
.steerb{width:66px;height:66px;font-size:28px;bottom:calc(18px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center}
#turnL{left:calc(12px + env(safe-area-inset-left))}
#turnR{left:calc(88px + env(safe-area-inset-left))}
.sailb{width:54px;height:54px;font-size:14px;bottom:calc(94px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center}
#sailDn{left:calc(18px + env(safe-area-inset-left))}
#sailUp{left:calc(94px + env(safe-area-inset-left))}
.btnr.held{background:rgba(60,120,180,.85)}
body:not(.steer-btns) .steerctl{display:none!important}
body.steer-btns #autoBtn{right:calc(108px + env(safe-area-inset-right));bottom:calc(104px + env(safe-area-inset-bottom))}
#tut{position:fixed;inset:0;z-index:30;pointer-events:none}
#tutRing{position:absolute;left:0;top:0;border-radius:16px;border:3px solid #ffd34d;box-shadow:0 0 16px 4px rgba(255,211,77,.85);animation:tutPulse 1s infinite;pointer-events:none}
#tutRing.dim{box-shadow:0 0 0 200vmax rgba(0,0,0,.38),0 0 16px 4px rgba(255,211,77,.85)}
@keyframes tutPulse{50%{border-color:#fff}}
#tutArrow{position:absolute;left:0;top:0;width:44px;height:40px;margin-left:-22px;font-size:36px;line-height:40px;text-align:center;color:#ffd34d;text-shadow:0 0 3px #000,0 2px 4px #000;pointer-events:none}
#tutArrow i{display:block;font-style:normal;animation:tutBob .6s ease-in-out infinite alternate}
#tutArrow.up i{animation-name:tutBobUp}
@keyframes tutBob{to{transform:translateY(9px)}}
@keyframes tutBobUp{to{transform:translateY(-9px)}}
#tutBub{position:absolute;left:0;top:0;width:min(340px,calc(100vw - 16px));background:linear-gradient(#f4e4c1,#e3cc9b);color:#3b2306;border:3px solid #7a4e1d;border-radius:14px;padding:8px 12px 8px;box-shadow:0 6px 20px rgba(0,0,0,.55);font-size:15px;line-height:1.35;pointer-events:none}
#tutBub .tt{font-weight:800;font-size:12px;opacity:.7;display:flex;justify-content:space-between;margin-bottom:2px}
#tutBub small{opacity:.75}
#tutProg{height:7px;background:rgba(0,0,0,.15);border-radius:4px;margin-top:6px;overflow:hidden}
#tutBar{height:100%;width:0;background:#2f7d3b;transition:width .2s}
#tutBub .tb{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:6px}
#tutBub button{pointer-events:auto;touch-action:manipulation}
#tutSkip{background:#9c7a4a;font-size:12px}
""")

# ---------- HTML ----------
rep('<button id="dockBtn" class="hidden">⚓ Dock</button>',
'''<button id="dockBtn" class="hidden">⚓ Dock</button>
<button id="turnL" class="btnr steerb steerctl" aria-label="Turn left">⟲</button>
<button id="turnR" class="btnr steerb steerctl" aria-label="Turn right">⟳</button>
<button id="sailDn" class="btnr sailb steerctl" aria-label="Lower sails">⛵−</button>
<button id="sailUp" class="btnr sailb steerctl" aria-label="Raise sails">⛵+</button>''')
rep('<div id="toast"></div>\n','''<div id="toast"></div>
<div id="tut" class="hidden"><div id="tutRing" class="hidden"></div><div id="tutArrow" class="hidden"><i>▼</i></div>
  <div id="tutBub"><div class="tt"><span id="tutCount"></span><span>🎓 Tutorial</span></div><div id="tutTxt"></div><div id="tutProg"><div id="tutBar"></div></div>
  <div class="tb"><button class="b" id="tutSkip">Skip tutorial</button><button class="b" id="tutNext">Next ▶</button></div></div></div>
''')
rep('''  🕹️ <b>Steer:</b> drag anywhere on the sea (a short drag slows down). Sails stay set when you let go.<br>''',
'''  🎓 New here? The guided <b>Tutorial</b> starts automatically on a new game (replay it any time).<br>
  🕹️ <b>Steer:</b> drag anywhere on the sea (a short drag slows down). Sails stay set when you let go. Prefer buttons? Turn on ◀ ▶ steering buttons in ☰ Captain's Log.<br>''')
rep('''  <button class="big" id="xferTitleBtn">💾 Save Transfer</button>''','''  <button class="big" id="tutBtn">🎓 Tutorial</button>
  <button class="big" id="xferTitleBtn">💾 Save Transfer</button>''')

# ---------- STATE ----------
rep("muted:false,seen:false,autoFire:true,bal:2};}","muted:false,seen:false,autoFire:true,bal:2,tutDone:false,tutStep:0,steer:'drag'};}")
rep(" S=Object.assign(def,d);if(!(d.bal>=2))S.bal=0;"," S=Object.assign(def,d);if(!(d.bal>=2))S.bal=0;if(d.tutDone===undefined){S.tutDone=true;S.tutStep=0;}if(S.steer!=='buttons')S.steer='drag';")

# ---------- CANVAS / RESIZE ----------
rep("let vw=0,vh=0,dpr=1,zoom=0.6;\nfunction resize(){dpr=Math.min(window.devicePixelRatio||1,2);",
    "let vw=0,vh=0,dpr=1,zoom=0.6,dprCap=2;\nfunction resize(){dpr=Math.min(window.devicePixelRatio||1,dprCap);")
rep("window.addEventListener('resize',()=>{resize();readSafe();});window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();readSafe();},250));resize();",
"""const onResize=()=>{resize();readSafe();};window.addEventListener('resize',onResize);if(window.visualViewport)window.visualViewport.addEventListener('resize',onResize);
window.addEventListener('orientationchange',()=>{releaseInput();setTimeout(onResize,250);setTimeout(onResize,700);});resize();""")

# ---------- INPUT ----------
rep("const joy={id:null,bx:0,by:0,x:0,y:0};","const joy={id:null,bx:0,by:0,x:0,y:0};const JR=60,JFOLLOW=78;\nconst hold={L:0,R:0,U:0,D:0,tU:0,tD:0};const holdBtns=[];\nfunction releaseInput(){joy.id=null;for(const k in keys)keys[k]=false;hold.L=hold.R=hold.U=hold.D=0;for(const f of holdBtns)f();}")
rep("const safeProbe=document.createElement('div');safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right)';document.body.appendChild(safeProbe);\nlet safe={t:0,r:0};function readSafe(){const cs=getComputedStyle(safeProbe);safe.t=parseFloat(cs.paddingTop)||0;safe.r=parseFloat(cs.paddingRight)||0;",
"const safeProbe=document.createElement('div');safeProbe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)';document.body.appendChild(safeProbe);\nlet safe={t:0,r:0,b:0,l:0};function readSafe(){const cs=getComputedStyle(safeProbe);safe.t=parseFloat(cs.paddingTop)||0;safe.r=parseFloat(cs.paddingRight)||0;safe.b=parseFloat(cs.paddingBottom)||0;safe.l=parseFloat(cs.paddingLeft)||0;")
rep("cv.addEventListener('pointermove',e=>{if(e.pointerId!==joy.id)return;joy.x=e.clientX;joy.y=e.clientY;});\nconst endJoy=e=>{if(e.pointerId===joy.id)joy.id=null;};\ncv.addEventListener('pointerup',endJoy);cv.addEventListener('pointercancel',endJoy);",
"""cv.addEventListener('pointermove',e=>{if(e.pointerId!==joy.id)return;joy.x=e.clientX;joy.y=e.clientY;
 // floating base: follows the thumb when dragged past the ring, so reversing direction is instant
 const dx=joy.x-joy.bx,dy=joy.y-joy.by,l=Math.hypot(dx,dy);if(l>JFOLLOW){const k=(l-JFOLLOW)/l;joy.bx+=dx*k;joy.by+=dy*k;}});
const endJoy=e=>{if(e.pointerId===joy.id)joy.id=null;};
cv.addEventListener('pointerup',endJoy);cv.addEventListener('pointercancel',endJoy);cv.addEventListener('lostpointercapture',endJoy);
window.addEventListener('blur',releaseInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInput();});""")
rep("""window.addEventListener('keydown',e=>{if(isTyping(e.target)||!$('xfer').classList.contains('hidden'))return;const k=(e.key||'').toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(state==='play'){""","""const NOSCROLL_KEYS={arrowup:1,arrowdown:1,arrowleft:1,arrowright:1,' ':1};
window.addEventListener('keydown',e=>{if(isTyping(e.target)||!$('xfer').classList.contains('hidden'))return;const k=(e.key||'').toLowerCase();keys[k]=true;if(NOSCROLL_KEYS[k])e.preventDefault();
 if(k==='enter'&&T.on&&!$('tutNext').classList.contains('hidden')){$('tutNext').click();return;}
 if(state==='play'){""")
rep("""$('dockBtn').addEventListener('click',()=>{if(state==='play'&&nearPort>=0)dock(nearPort);});
$('menuBtn').addEventListener('click',()=>{initAudio();if(state==='play'||state==='map')openMenu();});""",
"""// tap = pointerdown+pointerup on the same element (works with a second finger while steering; no click delay)
function tapBtn(id,fn){const b=$(id);let pid=null;b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;initAudio();});
 b.addEventListener('pointerup',e=>{if(e.pointerId!==pid)return;pid=null;e.preventDefault();e.stopPropagation();fn();});b.addEventListener('pointercancel',()=>{pid=null;});
 b.addEventListener('click',e=>{if(e.detail===0)fn();});}
tapBtn('dockBtn',()=>{if(state==='play'&&nearPort>=0)dock(nearPort);});
tapBtn('menuBtn',()=>{if(state==='play'||state==='map')openMenu();});
// optional steering buttons (hold to turn / tap to set sails in 25% steps, hold to keep adjusting)
function bindHold(id,k,onDown){const b=$(id);const ids=new Set();
 b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();initAudio();ids.add(e.pointerId);try{b.setPointerCapture(e.pointerId);}catch(_){}if(!hold[k]&&onDown&&state==='play')onDown();hold[k]=1;b.classList.add('held');});
 const up=e=>{if(!ids.delete(e.pointerId))return;if(!ids.size){hold[k]=0;b.classList.remove('held');}};
 b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
 holdBtns.push(()=>{ids.clear();b.classList.remove('held');});}
bindHold('turnL','L');bindHold('turnR','R');
bindHold('sailUp','U',()=>{P.throttle=clamp(Math.floor(P.throttle*4+1e-6)/4+0.25,0,1);hold.tU=0;});
bindHold('sailDn','D',()=>{P.throttle=clamp(Math.ceil(P.throttle*4-1e-6)/4-0.25,0,1);hold.tD=0;});
function applySteerMode(){document.body.classList.toggle('steer-btns',S.steer==='buttons');}""")

# ---------- COMBAT hooks ----------
rep(" if(!scanned)scanTargets();fireBroadside(P,side,ST.cannons,ST.dmg,'p',ST.range,autoAim[side]);cam.shake=Math.max(cam.shake,3);}",
    " if(!scanned){scanTargets();tutEv('shots');tutEv(side<0?'sl':'sr');}fireBroadside(P,side,ST.cannons,ST.dmg,'p',ST.range,autoAim[side]);cam.shake=Math.max(cam.shake,3);}")
rep("function toggleAuto(){S.autoFire=!S.autoFire;","function toggleAuto(){S.autoFire=!S.autoFire;tutEv('toggle');")
rep("const TRAIN=0.42,BOW=0.6;","const TRAIN=0.42,BOW=0.6;const SIDES=[-1,1];")
rep("  const pri=d*(e.kind==='boss'?0.7:1)*(e.angry?0.85:1)*(e.qid?0.9:1);","  const pri=d*(e.kind==='boss'?0.7:1)*(e.angry?0.85:1)*(e.qid?0.9:1)*(e.tut?0.3:1);")
rep("  for(const sd of [-1,1])if(Math.abs(angDiff(sd*Math.PI/2,rel))<TRAIN","  for(const sd of SIDES)if(Math.abs(angDiff(sd*Math.PI/2,rel))<TRAIN")
rep(" for(const sd of [-1,1]){const a=P.h+sd*Math.PI/2,on=!!autoSide[sd];"," for(const sd of SIDES){const a=P.h+sd*Math.PI/2,on=!!autoSide[sd];")
rep(" else if(Math.random()<0.4){const gi="," else if(!e.tut&&Math.random()<0.4){const gi=")
rep(" loot.push({x:e.x,y:e.y,gold,goods,t:0});\n addText(e.x,e.y-40,e.kind==='boss'?`☠ ${e.name} sunk!`:'Sunk!','#ff8a5c',true);",
    " const lt={x:e.x,y:e.y,gold,goods,t:0,tut:!!e.tut};loot.push(lt);if(e.tut)T.loot=lt;\n addText(e.x,e.y-40,e.kind==='boss'?`☠ ${e.name} sunk!`:e.tut?'Target sunk!':'Sunk!','#ff8a5c',true);")

# ---------- PORT hooks ----------
rep(" if(act==='repair'){const miss=ST.maxHp-P.hp;let cost=repairCost(miss);if(S.gold>=cost){S.gold-=cost;P.hp=ST.maxHp;}else{const hp=S.gold/(0.9*(1-0.1*S.roles.carpenter));P.hp=Math.min(ST.maxHp,P.hp+hp);S.gold=0;}chime();}",
    " if(act==='repair'){const miss=ST.maxHp-P.hp;let cost=repairCost(miss);if(S.gold>=cost){S.gold-=cost;P.hp=ST.maxHp;}else{const hp=S.gold/(0.9*(1-0.1*S.roles.carpenter));P.hp=Math.min(ST.maxHp,P.hp+hp);S.gold=0;}chime();tutEv('repair');}")
rep("if(arg==='hull')P.hp+=ST.maxHp-old;chime();toast(","if(arg==='hull')P.hp+=ST.maxHp-old;chime();tutEv('buy');toast(")
rep("S.roles[arg]++;recalc();chime();toast(","S.roles[arg]++;recalc();chime();tutEv('buy');toast(")
rep("$('pTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;renderPort();});",
    "$('pTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;renderPort();$('pBody').scrollTop=0;});")

# ---------- MENU ----------
rep(" h+=row('🗺️ Map','See the whole sea',btn('map','Open',true));",
""" h+=row('🗺️ Map','See the whole sea',btn('map','Open',true));
 h+=row('💾 Save game','Progress also saves automatically every few seconds.',btn('savenow','💾 Save now',true));
 h+=row('🕹️ Steering',S.steer==='buttons'?'Drag on the sea <b>and</b> on-screen ⟲ ⟳ turn / ⛵± sail buttons':'Drag anywhere on the sea (floating joystick)',btn('steer',S.steer==='buttons'?'Drag only':'Add buttons',true));
 h+=row('🎓 Tutorial',S.tutDone?'Replay the guided tutorial.':'Tutorial in progress.',btn('tut',T.on?'Restart':'Replay',true));""")
rep("h+=`<div class=\"help\">🕹️ Drag on the sea to steer (short drag = slow).<br>",
    "h+=`<div class=\"help\">🕹️ Drag on the sea to steer (short drag = slow). Steer and fire at the same time with two thumbs.<br>")
rep(" else if(a==='map'){$('menu').classList.add('hidden');state='map';}",
""" else if(a==='map'){$('menu').classList.add('hidden');state='map';}
 else if(a==='savenow'){save();toast('💾 Game saved');tutEv('save');}
 else if(a==='steer'){S.steer=S.steer==='buttons'?'drag':'buttons';applySteerMode();save();renderMenu();}
 else if(a==='tut'){$('menu').classList.add('hidden');state='play';tutStart(0);}""")
rep("resetAll();$('menu').classList.add('hidden');state='play';toast('New game! Fair winds, Captain.');}});",
    "resetAll();$('menu').classList.add('hidden');state='play';toast('New game! Fair winds, Captain.');tutStart(0);}});")
rep("function resetAll(){localStorage.removeItem(SAVEKEY);","function resetAll(){localStorage.removeItem(SAVEKEY);T.on=false;T.dummy=T.loot=null;")

# ---------- UPDATE ----------
rep(" const safe=nearSafePort(P.x,P.y)||P.dead;\n if(e.kind==='merchant'){",
    " if(e.tut){e.hitT-=dt;e.h+=dt*0.12;return;}\n const safe=nearSafePort(P.x,P.y)||P.dead||tutPeace;\n if(e.kind==='merchant'){")
rep(" for(const look of [90,190]){"," for(const look of LOOKS){")
rep("function nearSafePort(x,y){","const LOOKS=[90,190];\nfunction nearSafePort(x,y){")
rep("  if(joy.id!==null){const dx=joy.x-joy.bx,dy=joy.y-joy.by,l=Math.hypot(dx,dy);if(l>10){desired=Math.atan2(dy,dx);P.throttle=clamp((l-12)/48,0,1);}}\n  const turn=(keys['arrowright']||keys['d']?1:0)-(keys['arrowleft']||keys['a']?1:0);if(turn)desired=P.h+turn*0.8;\n  if(keys['arrowup']||keys['w'])P.throttle=clamp(P.throttle+dt*1.2,0,1);if(keys['arrowdown']||keys['s'])P.throttle=clamp(P.throttle-dt*1.2,0,1);",
"""  if(joy.id!==null){const dx=joy.x-joy.bx,dy=joy.y-joy.by,l=Math.hypot(dx,dy);if(l>10){desired=Math.atan2(dy,dx);P.throttle=clamp((l-12)/48,0,1);}}
  const turn=(keys['arrowright']||keys['d']||hold.R?1:0)-(keys['arrowleft']||keys['a']||hold.L?1:0);if(turn)desired=P.h+turn*0.8;
  if(keys['arrowup']||keys['w'])P.throttle=clamp(P.throttle+dt*1.2,0,1);if(keys['arrowdown']||keys['s'])P.throttle=clamp(P.throttle-dt*1.2,0,1);
  if(hold.U){hold.tU+=dt;if(hold.tU>0.4)P.throttle=clamp(P.throttle+dt*0.9,0,1);}if(hold.D){hold.tD+=dt;if(hold.tD>0.4)P.throttle=clamp(P.throttle-dt*0.9,0,1);}""")
rep(" for(let i=loot.length-1;i>=0;i--){const l=loot[i];l.t+=dt;if(l.t>90){loot.splice(i,1);continue;}",
    " for(let i=loot.length-1;i>=0;i--){const l=loot[i];l.t+=dt;if(l.t>90&&!l.tut){loot.splice(i,1);continue;}")
rep("chime();loot.splice(i,1);save();}}","chime();loot.splice(i,1);tutEv('loot');save();}}")

# ---------- RENDER ----------
rep("function seaColor(){const t=clamp(Math.hypot(cam.x-START.x,cam.y-START.y)/5000,0,1);return `rgb(",
    "let seaK=-1,seaC='';function seaColor(){const t=clamp(Math.hypot(cam.x-START.x,cam.y-START.y)/5000,0,1);const k=Math.round(t*200);if(k===seaK)return seaC;seaK=k;return seaC=`rgb(")
rep("  if(e.kind==='merchant')drawShip(e,'#f4ead2','#2b5fb5',0.6);else if(e.kind==='boss')","  if(e.tut)drawShip(e,'#f3e2b0','#ffd34d',0.3);else if(e.kind==='merchant')drawShip(e,'#f4ead2','#2b5fb5',0.6);else if(e.kind==='boss')")
rep("  const bw=38;if(e.hp<e.maxHp||e.kind==='boss'){","  const bw=38;if(e.hp<e.maxHp||e.kind==='boss'||e.tut){")
rep("ctx.fillText(e.kind==='boss'?`☠ ${e.name} Lv${e.lvl}`:(e.kind==='merchant'","ctx.fillText(e.tut?'🎯 Training Target':e.kind==='boss'?`☠ ${e.name} Lv${e.lvl}`:(e.kind==='merchant'")
rep(" for(const q of questTargets()){const X=sx(q.x),Y=sy(q.y);"," for(const q of QT){const X=sx(q.x),Y=sy(q.y);")
rep(" for(const q of questTargets()){ctx.font=(big?18:11)+'px serif';"," for(const q of QT){ctx.font=(big?18:11)+'px serif';")
rep("function questTargets(){","let QT=[];\nfunction questTargets(){")
rep(" // joystick\n if(joy.id!==null){ctx.globalAlpha=0.5;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(joy.bx,joy.by,60,0,TAU);ctx.stroke();let dx=joy.x-joy.bx,dy=joy.y-joy.by;const l=Math.hypot(dx,dy);if(l>60){dx*=60/l;dy*=60/l;}\n  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(joy.bx+dx,joy.by+dy,24,0,TAU);ctx.fill();ctx.globalAlpha=1;}\n else if(state==='play'&&S.playTime<25){",
""" drawTut(ts);
 // joystick (floating): ring = full sails, inner arc shows sail %
 if(joy.id!==null){ctx.globalAlpha=0.55;ctx.fillStyle='rgba(10,25,40,0.35)';ctx.beginPath();ctx.arc(joy.bx,joy.by,JR,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
  let dx=joy.x-joy.bx,dy=joy.y-joy.by;const l=Math.hypot(dx,dy);if(l>JR){dx*=JR/l;dy*=JR/l;}
  if(P.throttle>0.01){ctx.strokeStyle='#ffd34d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(joy.bx,joy.by,JR+5,-Math.PI/2,-Math.PI/2+TAU*P.throttle);ctx.stroke();}
  ctx.globalAlpha=0.85;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(joy.bx+dx,joy.by+dy,24,0,TAU);ctx.fill();ctx.globalAlpha=1;}
 else if(state==='play'&&S.playTime<25&&!T.on&&S.steer!=='buttons'){""")

# ---------- HUD / LOOP ----------
rep("function updateHUD(){setTxt('hGold',","function updateHUD(){QT=questTargets();setTxt('hGold',")
rep("""function frame(t){requestAnimationFrame(frame);let dt=(t-last)/1000;last=t;if(dt>0.05)dt=0.05;if(dt<0)dt=0;""",
"""let perfAcc=0,perfN=0;
function frame(t){requestAnimationFrame(frame);let dt=(t-last)/1000;last=t;
 // adaptive resolution: if the device can't hold ~40fps, drop the canvas pixel ratio a step (never below 1)
 if(dt>0&&dt<0.1&&!document.hidden){perfAcc+=dt;perfN++;if(perfN>=150){if(perfAcc/perfN>0.027&&dprCap>1&&(window.devicePixelRatio||1)>1){dprCap=Math.max(1,dprCap-0.5);resize();}perfAcc=0;perfN=0;}}
 if(dt>0.05)dt=0.05;if(dt<0)dt=0;""")
rep(" render(t);hudT-=dt;if(hudT<=0){hudT=0.1;updateHUD();}}"," render(t);tutTick(dt);hudT-=dt;if(hudT<=0){hudT=0.1;updateHUD();}}")

# ---------- BOOT ----------
rep("$('startBtn').addEventListener('click',()=>{initAudio();$('title').classList.add('hidden');state='play';S.seen=true;save();});",
"""$('startBtn').addEventListener('click',()=>{initAudio();$('title').classList.add('hidden');state='play';S.seen=true;if(!S.tutDone)tutStart(hadSave?tutResumeIdx(S.tutStep|0):0);save();});
$('tutBtn').addEventListener('click',()=>{initAudio();$('title').classList.add('hidden');state='play';S.seen=true;tutStart(0);save();});
applySteerMode();""")
rep("balls,parseCode,openXfer,setState:s=>state=s};","balls,parseCode,openXfer,setState:s=>state=s,T,TSTEPS,tutStart,loot,get tab(){return tab},get nearPort(){return nearPort}};")

open(p,'w').write(s)
print('ok')
