p='/workspace/pirate-game/index.html'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:90]); s=s.replace(old,new)
# CSS
rep("#dockBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(110px + env(safe-area-inset-bottom));",
    "#dockBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(176px + env(safe-area-inset-bottom));")
rep("#tut{position:fixed;inset:0;z-index:30;pointer-events:none}",
"""#boostBtn{width:60px;height:60px;right:calc(23px + env(safe-area-inset-right));bottom:calc(104px + env(safe-area-inset-bottom));font-size:10.5px;line-height:1.05;display:flex;flex-direction:column;align-items:center;justify-content:center}
#boostBtn .bi{font-size:22px;position:relative;z-index:2}#boostBtn b{position:relative;z-index:2}
#boostBtn .cd{position:absolute;inset:0;border-radius:50%;background:conic-gradient(rgba(0,0,0,.62) var(--p,0%),transparent 0);z-index:1;pointer-events:none}
#boostBtn.ready{background:rgba(200,110,20,.8);box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,220,140,.9)}
#boostBtn.on{background:rgba(255,150,30,.95);box-shadow:0 0 14px 4px rgba(255,190,60,.9),inset 0 0 0 2px #fff;animation:bpulse .5s infinite alternate}
#boostBtn.tip{animation:btip .8s infinite alternate}
@keyframes bpulse{to{box-shadow:0 0 22px 8px rgba(255,210,80,.95),inset 0 0 0 2px #fff}}
@keyframes btip{to{box-shadow:0 0 0 6px rgba(255,211,77,.9),0 0 18px 6px rgba(255,211,77,.8)}}
#tut{position:fixed;inset:0;z-index:30;pointer-events:none}""")
# HTML
rep('<button id="dockBtn" class="hidden">⚓ Dock</button>','<button id="dockBtn" class="hidden">⚓ Dock</button>\n<button id="boostBtn" class="btnr ready" aria-label="Speed boost"><div class="cd"></div><span class="bi">🚀</span><b id="boostLbl">BOOST</b></button>')
rep("  ⌨️ Keyboard: WASD/arrows, Q/E fire, Space both, F dock, M map, T auto-fire.",
    "  🚀 <b>BOOST:</b> +25% speed for a few seconds, but the ship turns sluggishly. Then it recharges.<br>\n  ⌨️ Keyboard: WASD/arrows, Q/E fire, Space both, B or Shift boost, F dock, M map, T auto-fire.")
rep("<br>⌨️ WASD/arrows • Q/E fire • Space both • F dock • M map</div>`;","<br>🚀 BOOST = +25% speed, but harder turning, then recharge.<br>⌨️ WASD/arrows • Q/E fire • Space both • B/Shift boost • F dock • M map • T auto</div>`;")
# state / stats
rep("up:{hull:0,sails:0,cannons:0,cargo:0}","up:{hull:0,sails:0,cannons:0,cargo:0,rigging:0}")
rep("autoFire:true,bal:2,tutDone:false,","autoFire:true,bal:2,boostTip:false,tutDone:false,")
rep(" cargo:{name:'Cargo Hold',icon:'📦',base:90,g:1.6,max:8,desc:l=>`Holds ${20+12*l} crates`}};",
    " cargo:{name:'Cargo Hold',icon:'📦',base:90,g:1.6,max:8,desc:l=>`Holds ${20+12*l} crates`},\n rigging:{name:'Racing Rigging',icon:'🚀',base:160,g:1.8,max:4,desc:l=>`Boost lasts ${(7+0.5*l).toFixed(1)}s • recharge ${22-1.5*l}s`}};")
rep("cargoCap:20+12*u.cargo,","cargoCap:20+12*u.cargo,boostDur:7+0.5*(u.rigging||0),boostCd:22-1.5*(u.rigging||0),")
rep("const P={x:0,y:0,vx:0,vy:0,h:0,speed:0,throttle:0,","const P={x:0,y:0,vx:0,vy:0,h:0,speed:0,throttle:0,boost:0,boostCd:0,")
# movement
rep("function moveShip(s,desired,thr,maxSpeed,turn,dt){","function moveShip(s,desired,thr,maxSpeed,turn,dt,acc){")
rep("s.speed+=clamp(target-s.speed,-70*dt,50*dt);","s.speed+=clamp(target-s.speed,-70*dt,50*(acc||1)*dt);")
rep(" s.wakeT-=dt;if(s.wakeT<=0&&Math.abs(s.speed)>25){s.wakeT=0.07;",
    " s.wakeT-=dt;if(s.wakeT<=0&&Math.abs(s.speed)>25){s.wakeT=s.boost>0?0.035:0.07;if(s.boost>0)for(let k=-1;k<=1;k+=2)addPart('foam',s.x-Math.cos(s.h)*s.len*0.4-Math.sin(s.h)*k*s.wid*0.5,s.y-Math.sin(s.h)*s.len*0.4+Math.cos(s.h)*k*s.wid*0.5,-Math.sin(s.h)*k*30-s.vx*0.15,Math.cos(s.h)*k*30-s.vy*0.15,0.9,rand(3,6),null);")
rep("  P.len=ST.len;P.wid=ST.wid;moveShip(P,desired,P.throttle,ST.maxSpeed,ST.turn,dt);",
"""  if(P.boostCd>0)P.boostCd=Math.max(0,P.boostCd-dt);
  if(P.boost>0){P.boost=Math.max(0,P.boost-dt);if(P.boost===0)toast('🚀 Boost over — recharging');}
  const bo=P.boost>0;
  P.len=ST.len;P.wid=ST.wid;moveShip(P,desired,bo?1:P.throttle,ST.maxSpeed*(bo?BOOST_SPEED:1),ST.turn*(bo?BOOST_TURN:1),dt,bo?2:1);""")
rep("function nearSafePort(x,y){","""// ---------- SPEED BOOST ----------
const BOOST_SPEED=1.25,BOOST_TURN=0.6;
function boost(){if(state!=='play'||P.dead||P.boost>0||P.boostCd>0)return;P.boost=ST.boostDur;P.boostCd=ST.boostDur+ST.boostCd;P.speed+=25;cam.shake=Math.max(cam.shake,2);
 tutEv('boost');if(!S.boostTip){S.boostTip=true;$('boostBtn').classList.remove('tip');}
 if(actx&&!S.muted)boom(0.25,1400);toast(`🚀 Boost! +25% speed for ${ST.boostDur}s — turning is harder`);}
function nearSafePort(x,y){""")
# particles
rep("  else if(p.type==='drop'){","  else if(p.type==='foam'){ctx.globalAlpha=a*0.85;ctx.fillStyle='#f4fbff';ctx.beginPath();ctx.arc(p.x,p.y,p.size*(1.6-a),0,TAU);ctx.fill();}\n  else if(p.type==='drop'){")
# sail glow
rep(" if(state!=='title'||true)drawShip(P,'#fff8e7','#111',P.throttle);",
    " if(P.boost>0&&!P.dead){const g=0.35+0.2*Math.sin(ts*14);ctx.fillStyle=`rgba(255,190,60,${g})`;ctx.beginPath();ctx.ellipse(P.x,P.y,P.len*0.8,P.len*0.8,0,0,TAU);ctx.fill();drawShip(P,'#ffd27a','#111',1.4);}\n else drawShip(P,'#fff8e7','#111',P.throttle);")
# HUD gauge timer
rep("ctx.fillText(`${Math.round(Math.hypot(P.vx,P.vy))}kn  ⛵${Math.round(P.throttle*100)}%`,m.x+26,wy);",
    "ctx.fillText(P.boost>0?`${Math.round(Math.hypot(P.vx,P.vy))}kn  🚀${P.boost.toFixed(1)}s`:`${Math.round(Math.hypot(P.vx,P.vy))}kn  ⛵${Math.round(P.throttle*100)}%`,m.x+26,wy);")
rep(" for(const [id,r] of [['fireL',P.rl],['fireR',P.rr]]){",
""" {const b=$('boostBtn');const on=P.boost>0,rdy=!on&&P.boostCd<=0;const p=on?0:Math.round(clamp(P.boostCd/ST.boostCd,0,1)*100);
  const lbl=on?P.boost.toFixed(1)+'s':rdy?'BOOST':Math.ceil(P.boostCd)+'s';const k=(on?'a':rdy?'r':'c')+p+lbl;
  if(hudCache.boost!==k){hudCache.boost=k;b.style.setProperty('--p',p+'%');b.classList.toggle('on',on);b.classList.toggle('ready',rdy);$('boostLbl').textContent=lbl;}}
 if(!S.boostTip&&state==='play'&&!T.on&&!boostTipShown){boostTipShown=true;$('boostBtn').classList.add('tip');toast(IS_TOUCH?'🚀 New: tap BOOST for a burst of speed (turning gets harder)!':'🚀 New: press B / Shift (or BOOST) for a burst of speed — turning gets harder!');}
 for(const [id,r] of [['fireL',P.rl],['fireR',P.rr]]){""")
rep("const hudCache={};","const hudCache={};let boostTipShown=false;")
# input
rep("bindBtn('fireL',()=>{if(state==='play')fire(-1);});","bindBtn('fireL',()=>{if(state==='play')fire(-1);});bindBtn('boostBtn',boost);")
rep("if(k==='t')toggleAuto();if(k==='escape')openMenu();}","if(k==='t')toggleAuto();if(k==='b'||k==='shift')boost();if(k==='escape')openMenu();}")
# reset on death/port
rep("P.vx=P.vy=P.speed=0;P.throttle=0;P.hp=ST.maxHp;P.dead=0;\n balls.length=0;","P.vx=P.vy=P.speed=0;P.throttle=0;P.hp=ST.maxHp;P.dead=0;P.boost=0;\n balls.length=0;")
rep("function dock(pi){curPort=pi;state='port';P.vx=P.vy=P.speed=0;P.throttle=0;","function dock(pi){curPort=pi;state='port';P.vx=P.vy=P.speed=0;P.throttle=0;P.boost=0;")
# tutorial step after Set Sail
rep(" {id:'log',text:()=>`Tap <b>☰</b>",""" {id:'boost',text:()=>`One more trick: tap <b>🚀 BOOST</b> for <b>+25% speed</b> for a few seconds. Careful — the ship <b>turns slower</b> while boosting, then it needs to recharge.`+kb('B / Shift'),
  target:()=>({el:'boostBtn'}),done:c=>(c.boost||0)>=1,nextIf:()=>P.boostCd>0&&!T.c.boost},
 {id:'log',text:()=>`Tap <b>☰</b>""")
rep("$('tutNext').addEventListener('click',()=>{if(!T.on)return;const st=TSTEPS[T.i];","$('tutNext').addEventListener('click',()=>{if(!T.on)return;const st=TSTEPS[T.i];if(st.id==='boost')S.boostTip=true;")
rep("function tutEnd(finished){","function tutEnd(finished){if(finished)S.boostTip=true;")
rep("setState:s=>state=s,T,","setState:s=>state=s,boost,T,")
open(p,'w').write(s);print('ok')
