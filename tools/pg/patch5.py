p='/workspace/pirate-game/index.html'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:120]); s=s.replace(old,new)
# ---- CSS
rep("#tut{position:fixed;inset:0;z-index:30;pointer-events:none}",
"""#hXpRow{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;margin-top:2px}#hLvl{color:#e2ccff;white-space:nowrap}
.xpbar{flex:1;height:6px;background:rgba(0,0,0,.45);border-radius:3px;overflow:hidden}#hXp{height:100%;width:0;background:linear-gradient(90deg,#9b6bff,#d6b8ff);transition:width .3s}
#mTrack{pointer-events:auto;display:flex;align-items:center;gap:7px;margin-top:5px;padding:5px 6px;min-height:44px;background:rgba(0,0,0,.35);border-radius:9px;border:1px solid rgba(255,211,77,.45);touch-action:manipulation}
#mTrack.hot{border-color:#ff6b5b;background:rgba(120,20,10,.45)}
#mtArrow{flex:none;width:24px;height:24px;line-height:24px;text-align:center;font-size:19px;color:#ffd34d;transition:transform .2s}
.mtt{min-width:0;flex:1}#mtTitle{font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#mtSub{font-size:11px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#actBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(176px + env(safe-area-inset-bottom));padding:12px 20px;min-height:52px;touch-action:none;border-radius:24px;border:none;font-size:17px;font-weight:800;background:#c0392b;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,255,255,.5);animation:pulse 1.2s infinite;white-space:nowrap}
#menuBtn.sp::after{content:attr(data-sp);position:absolute;top:2px;right:2px;min-width:16px;height:16px;line-height:16px;border-radius:8px;background:#e8342a;color:#fff;font-size:10.5px;font-weight:800;text-align:center}
.xpb{height:8px;background:rgba(0,0,0,.18);border-radius:4px;overflow:hidden;margin:4px 0}.xpb i{display:block;height:100%;background:linear-gradient(90deg,#7b4bdf,#b48cff)}
.item.lock{opacity:.6}
#tut{position:fixed;inset:0;z-index:30;pointer-events:none}""")
# ---- HTML
rep('<div id="hWant" class="hidden"><span id="hStars"></span><span id="hBounty"></span></div>\n</div>',
'<div id="hXpRow"><b id="hLvl">🎖️ Lv1</b><div class="xpbar"><div id="hXp"></div></div></div>\n  <div id="hWant" class="hidden"><span id="hStars"></span><span id="hBounty"></span></div>\n  <div id="mTrack" class="hidden"><span id="mtArrow">➤</span><div class="mtt"><div id="mtTitle"></div><div id="mtSub"></div></div></div>\n</div>')
rep('<button id="dockBtn" class="hidden">⚓ Dock</button>','<button id="dockBtn" class="hidden">⚓ Dock</button>\n<button id="actBtn" class="hidden">⛏ Dig for treasure</button>')
rep("""<div class="phead"><h2>☰ Captain's Log</h2><button class="big" id="mClose">▶ Resume</button></div>""",
"""<div class="phead"><h2>☰ Captain's Log</h2><button class="big" id="mClose">▶ Resume</button></div>
  <div class="tabs" id="mTabs"><button data-m="log">📖 Log</button><button data-m="skills">🎖️ Skills</button><button data-m="trophies">🏆 Trophies</button></div>""")
rep("  🔧 Your hull slowly repairs itself when no enemies are near.<br>",
"""  📜 <b>Jobs:</b> treasure maps, smuggling, rescues, convoy raids, shark hunts, regattas, blockade runs and bounty contracts. Track the active one under your HUD (tap it to switch).<br>
  🎖️ <b>Level up:</b> earn XP to gain skill points (☰ ➜ Skills). Higher pirate ranks unlock bigger hulls at havens: Sloop ➜ Brig ➜ Frigate ➜ Galleon.<br>
  🔧 Your hull slowly repairs itself when no enemies are near.<br>""")
# ---- state
rep("upkT:0,sharks:0};}","upkT:0,sharks:0,xp:0,clvl:1,sp:0,sk:{gun:0,sea:0,plun:0,cmd:0},ship:'sloop',ach:{},st:{dig:0,resc:0,smug:0,race:0,convoy:0,block:0,jobs:0},megas:0,track:0,lastRank:''};}")
rep("S.fleet=cleanFleet(d.fleet);",
"""S.fleet=cleanFleet(d.fleet);
 S.sk=Object.assign(defaultState().sk,d.sk||{});for(const k in S.sk)S.sk[k]=clamp(S.sk[k]|0,0,4);S.st=Object.assign(defaultState().st,(d.st&&typeof d.st==='object')?d.st:{});if(!HULLS[S.ship])S.ship='sloop';if(!S.ach||typeof S.ach!=='object')S.ach={};
 if(!(d.xp>=0)){S.xp=Math.round((S.kills|0)*14+(S.raids|0)*10+(S.sharks|0)*4+(S.infamy|0)*0.3);const L=lvlFromXp(S.xp).l;S.clvl=L;S.sp=L-1;S.retro=L>1?L:0;achSilent=true;}
 S.clvl=clamp((S.clvl|0)||1,1,MAXLVL);S.sp=Math.max(0,S.sp|0);if(!Array.isArray(S.quests))S.quests=[];S.quests=S.quests.filter(q=>q&&typeof q==='object'&&q.type);""")
rep("enemies.length=0;balls.length=0;loot.length=0;fleet.length=0;","enemies.length=0;balls.length=0;loot.length=0;fleet.length=0;cways.length=0;digQ=null;actQ=null;")
# ---- hulls + recalc
rep("const upCost=(def,l)=>Math.round(def.base*Math.pow(def.g,l));",
"""const HULLS={sloop:{name:'Sloop',icon:'⛵',rank:0,cost:0,hp:1,guns:0,cargo:0,crew:0,spd:1,turn:1,dmg:1,len:0,wid:0,desc:'Quick and nimble starter ship.'},
 brig:{name:'Brig',icon:'🚢',rank:300,cost:1200,hp:1.3,guns:1,cargo:10,crew:6,spd:0.98,turn:0.94,dmg:1,len:8,wid:3,desc:'Two masts, an extra gun per side and a bigger hold.'},
 frigate:{name:'Frigate',icon:'⚔️',rank:1500,cost:3600,hp:1.65,guns:2,cargo:20,crew:12,spd:0.97,turn:0.88,dmg:1.08,len:16,wid:5,desc:'A fast warship with heavy broadsides.'},
 galleon:{name:'Galleon',icon:'👑',rank:3000,cost:8000,hp:2.1,guns:3,cargo:40,crew:20,spd:0.9,turn:0.78,dmg:1.12,len:26,wid:8,desc:'A floating fortress with a huge hold — slow to turn.'}};
const HORD=['sloop','brig','frigate','galleon'];const hullC=()=>HULLS[S.ship]||HULLS.sloop;
const upCost=(def,l)=>Math.round(def.base*Math.pow(def.g,l));""")
rep("desc:l=>`Max HP ${150+45*l} • crew space ${12+6*l}`}","desc:l=>`Max HP ${Math.round((150+45*l)*hullC().hp)} • crew space ${12+6*l+hullC().crew}`}")
rep("desc:l=>`${2+l} guns per side • dmg ${(10+1.5*l).toFixed(1)}`}","desc:l=>`${2+l+hullC().guns} guns per side • dmg ${(10+1.5*l).toFixed(1)}`}")
import re
i=s.index("function recalc(){");j=s.index("if(S.crew>ST.maxCrew)S.crew=ST.maxCrew;}",i)
s=s[:i]+"""function recalc(){const u=S.up,r=S.roles,C=hullC(),g=sk('gun'),se=sk('sea');const cannons=2+u.cannons+C.guns+(g>=4?1:0);const need=4+cannons*2;const eff=clamp(0.25+0.75*S.crew/need,0.5,1);
 ST={maxHp:Math.round((150+45*u.hull)*C.hp),maxSpeed:(135+18*u.sails)*(1+0.06*r.sailor)*(0.7+0.3*eff)*C.spd*(se>=1?1.05:1),turn:(1.45+0.07*u.sails)*(1+0.06*r.sailor)*C.turn*(se>=2?1.1:1),cannons,dmg:(10+1.5*u.cannons)*(1+0.15*r.gunner)*C.dmg*(g>=1?1.08:1),
 reload:2.5*(1-0.09*r.gunner)/eff*(g>=2?0.92:1),cargoCap:20+12*u.cargo+C.cargo,boostDur:7+0.5*(u.rigging||0),boostCd:(22-1.5*(u.rigging||0))*(se>=3?0.8:1),maxCrew:12+6*u.hull+C.crew,crewNeed:need,eff,regen:0.8*r.carpenter+(se>=4?1:0),reveal:450+220*r.navigator,radar:r.navigator>=1?1400+500*r.navigator:0,len:52+3*u.hull+C.len,wid:18+1.2*u.hull+C.wid,range:420*(g>=3?1.12:1)};
 """+s[j:]
rep("for(const q of S.quests)if(q.type==='deliver')n+=q.crates;return n;}","for(const q of S.quests)if(q.crates)n+=q.crates;return n;}")
rep("const sellPrice=(pi,gi)=>Math.max(1,Math.round(price(pi,gi)*0.82));","const sellPrice=(pi,gi)=>Math.max(1,Math.round(price(pi,gi)*0.82*(sk('plun')>=3?1.1:1)));")
# ---- rewards / XP
rep("const gold=Math.round(e.gold*rand(0.8,1.25)*(law?1+0.15*st:1));const goods={};","const gold=Math.round(e.gold*rand(0.8,1.25)*(law?1+0.15*st:1)*(sk('plun')>=1?1.12:1));const goods={};")
rep(" chum(e.x,e.y,20);\n for(let k=0;k<14;k++)",
""" grantXP(e.tut?15:(8+6*e.lvl)*(e.kind==='boss'?3:1),e.x,e.y);convoyHit(e);
 if(e.kind==='boss'&&!e.tut&&Math.random()<0.35&&S.quests.length<maxJobs()){const tq=makeTreasureQ(S.lastPort|0,true);if(tq){S.quests.push(tq);setTimeout(()=>toast(`📜 You found a treasure map on ${e.name}'s ship! Check the ❌ on your map.`),900);}}
 chum(e.x,e.y,20);
 for(let k=0;k<14;k++)""")
rep("if(!e.surr&&!e.plundered&&e.hp>0&&e.hp<e.maxHp*0.3){","if(!e.surr&&!e.plundered&&e.hp>0&&e.hp<e.maxHp*(sk('plun')>=2?0.4:0.3)){")
rep("function damageEnemy(e,dmg){const was=e.angry;","function damageEnemy(e,dmg){const was=e.angry;convoyAlarm(e);")
rep("const gold=Math.round(e.gold*1.6*(1+0.15*n));S.gold+=gold;","const gold=Math.round(e.gold*1.6*(1+0.15*n)*(sk('plun')>=1?1.12:1));S.gold+=gold;")
rep(" if(sharkBoarding())msg+=' — a boarder fell to the sharks 🦈';"," grantXP(6+5*e.lvl,e.x,e.y);convoyHit(e);\n if(sharkBoarding())msg+=' — a boarder fell to the sharks 🦈';")
rep(" S.infamy+=Math.round(e.lvl*6);S.raids=(S.raids||0)+1;addHeat(0.8);"," S.infamy+=Math.round(e.lvl*6);S.raids=(S.raids||0)+1;addHeat(0.8);grantXP(10+5*e.lvl,e.x,e.y);convoyHit(e);")
rep("S.infamy+=s.mega?120:2;S.sharks=(S.sharks||0)+1;","S.infamy+=s.mega?120:2;S.sharks=(S.sharks||0)+1;if(s.mega)S.megas=(S.megas|0)+1;grantXP(s.mega?250:2+2*s.lvl,s.x,s.y);sharkKillQuest(s);")
# ---- quests
rep("function genQuest(pi){const p=PORTS[pi];","function genQuestOld(pi){const p=PORTS[pi];")
rep("title:`Rival captain: ${name} (Lv${lvl})`,text:'Settle the score at the ☠ marked on your map.'}","title:`Bounty contract: ☠ ${name} (Lv${lvl})`,text:'Hunt down the rival captain at the ☠ marked on your map'+(lvl>=4?' — he sails with an escort.':'.')}")
rep("while(o.length<2)o.push(genQuest(pi));","while(o.length<4)o.push(genQuest(pi,o.map(q=>q.type)));")
rep("function completeQuest(q){S.quests=S.quests.filter(x=>x!==q);S.gold+=q.reward;S.earned+=q.reward;S.infamy+=Math.round(q.reward/5);toast(`📜 Job done: ${q.title} — +${q.reward} 💰`);chime();save();}",
"function completeQuest(q){if(!S.quests.includes(q))return;S.quests=S.quests.filter(x=>x!==q);const r=Math.round(q.reward*(sk('plun')>=4?1.2:1)*(S.infamy>=6000?1.1:1));S.gold+=r;S.earned+=r;S.infamy+=Math.round(r/5);S.st.jobs=(S.st.jobs|0)+1;statFor(q);questCleanup(q.id);if(digQ===q)digQ=null;grantXP(25+r/4,P.x,P.y);toast(`📜 Job done: ${q.title} — +${r} 💰`);chime();save();}")
i=s.index("function questTargets(){");j=s.index("\n",i)
s=s[:i]+"function questTargets(){const out=[];for(const q of S.quests){const t=qTarget(q);if(t)out.push(t);}return out;}"+s[j:]
rep(" for(const q of S.quests.slice()){if(q.type==='deliver'&&q.to===pi)completeQuest(q);}"," dockQuests(pi);")
rep("const act=S.quests.length?S.quests.map(q=>`• ${q.title}${q.type==='bounty'?` (${q.have}/${q.need})`:''}`).join('<br>'):'None — check the Jobs tab.';",
    "const act=S.quests.length?S.quests.map(q=>`• ${q.title}${qProg(q)?` (${qProg(q)})`:''}`).join('<br>'):'None — check the Jobs tab.';")
rep("h+=row('Crew',`${S.crew} aboard, ${ST.crewNeed} needed","h+=row('Hull',`${hullC().icon} ${hullC().name} — bigger hulls are sold at 🏴‍☠️ havens (🛠️ Ship tab)`,'');h+=row('Crew',`${S.crew} aboard, ${ST.crewNeed} needed")
rep("h+=row(`${d.icon} ${d.name} ${pips(l,d.max)}`,max?d.desc(l)+' (MAX)':`${d.desc(l)}<br>➜ ${d.desc(l+1)}`,btn('up',max?'MAX':`${c} 💰`,!max&&S.gold>=c,k));}}",
    "h+=row(`${d.icon} ${d.name} ${pips(l,d.max)}`,max?d.desc(l)+' (MAX)':`${d.desc(l)}<br>➜ ${d.desc(l+1)}`,btn('up',max?'MAX':`${c} 💰`,!max&&S.gold>=c,k));}\n  h+=hullShopHTML(p);}")
rep("else if(tab==='quests'){h+=`<h3>Your jobs (${S.quests.length}/3)</h3>`;","else if(tab==='quests'){const mj=maxJobs();h+=`<h3>Your jobs (${S.quests.length}/${mj})</h3>`;")
rep("for(const q of S.quests)h+=row(q.title,(q.type==='bounty'?`Progress ${q.have}/${q.need}. `:'')+`Reward ${q.reward} 💰`,btn('abandon','Drop',true,q.id,'red'));",
    "for(const q of S.quests)h+=row(`${QICON[q.type]||'📜'} ${q.title}`,(qProg(q)?`Progress: ${qProg(q)}. `:'')+`Reward ${q.reward} 💰`,btn('track',S.track===q.id?'📍 Tracked':'📍 Track',S.track!==q.id,q.id,'sell')+btn('abandon','Drop',true,q.id,'red'));")
rep("for(const q of offersFor(curPort)){const can=S.quests.length<3&&(q.type!=='deliver'||cargoUsed()+q.crates<=ST.cargoCap);\n   h+=row(q.title,`${q.text}<br>Reward <b>${q.reward} 💰</b>`,btn('accept','Accept',can,q.id));}",
    "for(const q of offersFor(curPort)){const can=S.quests.length<mj&&(!q.crates||cargoUsed()+q.crates<=ST.cargoCap)&&(!q.cost||S.gold>=q.cost);\n   h+=row(`${QICON[q.type]||'📜'} ${q.title}`,`${q.text}<br>Reward <b>${q.reward} 💰</b>${q.crates&&cargoUsed()+q.crates>ST.cargoCap?' • <b>not enough hold space</b>':''}`,btn('accept',q.cost?`Buy map ${q.cost}💰`:'Accept',can,q.id));}")
rep("if(S.quests.length>=3)h+=`<div class=\"note\">You can hold 3 jobs at a time.</div>`;}","if(S.quests.length>=mj)h+=`<div class=\"note\">You can hold ${mj} jobs at a time${mj<4?' (4 at the rank of Captain)':''}.</div>`;}")
rep("if(i>=0&&S.quests.length<3){const q=o.splice(i,1)[0];S.quests.push(q);",
    "if(i>=0&&S.quests.length<maxJobs()&&!(o[i].cost&&S.gold<o[i].cost)){const q=o.splice(i,1)[0];if(q.cost)S.gold-=q.cost;S.quests.push(q);S.track=q.id;")
rep("else if(act==='abandon'){S.quests=S.quests.filter(q=>q.id!=arg);enemies.forEach(e=>{if(e.qid==arg)e.qid=0;});}",
    "else if(act==='abandon'){S.quests=S.quests.filter(q=>q.id!=arg);enemies.forEach(e=>{if(e.qid==arg)e.qid=0;});questCleanup(+arg);if(digQ&&digQ.id==arg)digQ=null;}\n else if(act==='track'){S.track=+arg;}\n else if(act==='hull'){buyHull(arg);}")
rep("const failed=S.quests.filter(q=>q.type==='deliver');S.quests=S.quests.filter(q=>q.type!=='deliver');","const failed=S.quests.filter(q=>q.crates);S.quests=S.quests.filter(q=>!q.crates);failed.forEach(q=>questCleanup(q.id));")
rep("and ${failed.length} delivery job(s)","and ${failed.length} cargo job(s)")
# ---- menu
rep("let resetArm=false;\nfunction openMenu(){state='menu';resetArm=false;","let resetArm=false,mView='log';\nfunction openMenu(){state='menu';resetArm=false;mView='log';")
rep("function renderMenu(){const used=cargoUsed();",
    "function renderMenu(){[...$('mTabs').children].forEach(b=>b.classList.toggle('on',b.dataset.m===mView));if(mView==='skills'){$('mBody').innerHTML=skillsHTML();return;}if(mView==='trophies'){$('mBody').innerHTML=trophiesHTML();return;}const used=cargoUsed();")
rep(" h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');",
    " {const X=lvlFromXp(S.xp||0);h+=row(`🎖️ Captain level ${S.clvl}`,`${X.rem}/${X.need} XP • ${S.sp|0} skill point${(S.sp|0)===1?'':'s'} • ${hullC().icon} ${hullC().name} • 🏆 ${ACH.filter(a=>S.ach[a[0]]).length}/${ACH.length}`,btn('mv',S.sp>0?'Spend points':'Skills',true,'skills'));}\n h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');")
rep(" h+=row('📜 Jobs',S.quests.length?S.quests.map(q=>q.title+(q.type==='bounty'?` (${q.have}/${q.need})`:'')).join('<br>'):'none','');",
    " h+=row('📜 Jobs',S.quests.length?S.quests.map(q=>q.title+(qProg(q)?` (${qProg(q)})`:'')).join('<br>'):'none','');")
rep("$('mBody').addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b)return;const a=b.dataset.act;\n if(a==='xfer'){openXfer();}",
    "$('mBody').addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;\n if(a==='learn'){learn(b.dataset.arg);renderMenu();}\n else if(a==='mv'){mView=b.dataset.arg;renderMenu();$('mBody').scrollTop=0;}\n else if(a==='xfer'){openXfer();}")
rep("$('mClose').addEventListener('click',","$('mTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-m]');if(!b)return;mView=b.dataset.m;renderMenu();$('mBody').scrollTop=0;});\n$('mClose').addEventListener('click',")
rep("<br>🚀 BOOST = +25% speed","<br>📜 Jobs: track one under the HUD (tap to switch); ⛏ Dig at ❌ treasure spots. 🎖️ XP ➜ skill points (Skills tab).<br>🚀 BOOST = +25% speed")
# ---- HUD
rep("setTxt('hRank','⭐ '+rankOf(S.infamy));","setTxt('hRank','⭐ '+rankOf(S.infamy));{const X=lvlFromXp(S.xp||0);setTxt('hLvl','🎖️ Lv'+S.clvl);const w=Math.round(X.rem/X.need*100)+'%';if(hudCache.xpw!==w){hudCache.xpw=w;$('hXp').style.width=w;}}")
rep(" if(state!=='play'&&state!=='map'&&!$('tipBox').classList.contains('hidden'))hideTip();",
""" {const show=state==='play'&&!!actQ&&!boardTgt;$('actBtn').classList.toggle('hidden',!show);if(show)setTxt('actBtn',digQ?`⛏ Digging… ${Math.min(99,Math.round(digT/2.2*100))}%`:'⛏ Dig for treasure');}
 trackHUD();progT-=0.1;if(progT<=0){progT=1;progTick();}ctrlT-=0.1;if(ctrlT<=0){ctrlT=0.5;updCtrlRects();}
 if(state!=='play'&&state!=='map'&&!$('tipBox').classList.contains('hidden'))hideTip();""")
rep("tapBtn('boardBtn',()=>{if(state==='play')board(boardTgt);});","tapBtn('boardBtn',()=>{if(state==='play')board(boardTgt);});tapBtn('actBtn',()=>startDig());")
rep("if((k==='f'||k==='enter')&&boardTgt)board(boardTgt);else if((k==='f'||k==='enter')&&nearPort>=0)","if((k==='f'||k==='enter')&&boardTgt)board(boardTgt);else if((k==='f'||k==='enter')&&actQ)startDig();else if((k==='f'||k==='enter')&&nearPort>=0)")
# ---- update hooks
rep(" updateFleet(dt);\n saveT-=dt;"," updateFleet(dt);missionTick(dt);\n saveT-=dt;")
rep("if((e.kind!=='boss'&&d>2800)||(e.kind==='navy'&&st0===0&&d>1400&&!e.sinking))enemies.splice(i,1);","if(!e.keep&&((e.kind!=='boss'&&d>2800)||(e.kind==='navy'&&st0===0&&d>1400&&!e.sinking)))enemies.splice(i,1);")
rep("q.spawned=true;enemies.push(makeEnemy('boss',q.x,q.y,q.lvl,{name:q.name,qid:q.id,home:{x:q.x,y:q.y}}));}",
    "q.spawned=true;enemies.push(makeEnemy('boss',q.x,q.y,q.lvl,{name:q.name,qid:q.id,home:{x:q.x,y:q.y}}));if(q.lvl>=4)enemies.push(makeEnemy('pirate',q.x+90,q.y+70,q.lvl-1,{home:{x:q.x,y:q.y}}));}")
rep("if(e.kind==='navy'){if(stars()===0){e.angry=false;e.aggro=0;}else{e.aggro=2600;e.angry=true;}}",
    "if(e.kind==='navy'){if(e.gAng){e.angry=true;if(!stars()&&!e.mq)e.aggro=900;else if(stars())e.aggro=2600;}else if(stars()===0){e.angry=false;e.aggro=0;}else{e.aggro=2600;e.angry=true;}}")
rep("S.heat=Math.max(0,S.heat-dt*0.02);","S.heat=Math.max(0,S.heat-dt*0.02*(sk('cmd')>=3?1.5:1));")
# ---- fleet
rep("if(d<bd&&Math.hypot(e.x-P.x,e.y-P.y)<900){bd=d;f.tgt=e;}}}}",
    "if(d<bd&&Math.hypot(e.x-P.x,e.y-P.y)<900){bd=d;f.tgt=e;}}\n   for(const sh of sharks){if(!isHostile(sh))continue;const d=Math.hypot(sh.x-f.x,sh.y-f.y);if(d<bd){bd=d;f.tgt=sh;}}}}")
rep("fireBroadside(f,1,f.d.cannons,f.d.dmg,'f',370);","fireBroadside(f,1,f.d.cannons,f.d.dmg*(sk('cmd')>=1?1.15:1),'f',370);")
rep("fireBroadside(f,-1,f.d.cannons,f.d.dmg,'f',370);","fireBroadside(f,-1,f.d.cannons,f.d.dmg*(sk('cmd')>=1?1.15:1),'f',370);")
rep("function wagesTotal(){let w=0;for(const d of S.fleet)w+=d.wage||0;return w;}","function wagesTotal(){let w=0;for(const d of S.fleet)w+=d.wage||0;return Math.round(w*(sk('cmd')>=2?0.75:1));}")
rep("function damageFleet(f,dmg){f.d.hp-=dmg;","function damageFleet(f,dmg){if(sk('cmd')>=4)dmg*=0.8;f.d.hp-=dmg;")
rep("if(P.calm>6&&f.d.hp<f.d.maxHp*0.6)f.d.hp=Math.min(f.d.maxHp*0.6,f.d.hp+dt);}","{const hc=sk('cmd')>=4?0.8:0.6;if(P.calm>6&&f.d.hp<f.d.maxHp*hc)f.d.hp=Math.min(f.d.maxHp*hc,f.d.hp+dt);}}")
# ---- render
rep(" drawSharks(x0,x1,y0,y1,ts);\n"," drawSharks(x0,x1,y0,y1,ts);drawMissions(x0,x1,y0,y1,ts);\n")
rep(" else drawShip(P,'#fff8e7','#111',P.throttle);"," else drawShip(P,S.infamy>=6000?'#ffe08a':'#fff8e7','#111',P.throttle);")
rep("for(const f of fleet){if(f.sinking)continue;const X=sx(f.x),Y=sy(f.y)-f.len*zoom*0.6-8;","if(S.infamy>=12000&&!P.dead){ctx.font='22px serif';ctx.fillText('👑',sx(P.x),sy(P.y)-P.len*zoom*0.6-22);}\n for(const f of fleet){if(f.sinking)continue;const X=sx(f.x),Y=avoidY(sx(f.x),sy(f.y)-f.len*zoom*0.6-8);")
rep("for(const e of enemies){if(e.sinking)continue;const X=sx(e.x),Y=sy(e.y)-e.len*zoom*0.6-8;","for(const e of enemies){if(e.sinking)continue;const X=sx(e.x),Y=avoidY(sx(e.x),sy(e.y)-e.len*zoom*0.6-8);")
rep("(e.surr?'🏳️ Surrendered — Board!':","(e.surr?(e===boardTgt?'🏳️ Surrendered':'🏳️ Surrendered — Board!'):")
rep("e.kind==='navy'?(e.hunter?`🎯 Bounty Hunter Lv${e.lvl}`:`⚓ Navy Lv${e.lvl}`)","e.kind==='navy'?(e.hunter?`🎯 Bounty Hunter Lv${e.lvl}`:e.mq?`🧨 Blockade Lv${e.lvl}`:e.guard?`⚓ Convoy Escort Lv${e.lvl}`:`⚓ Navy Lv${e.lvl}`)")
rep("`💰 Merchant Lv${e.lvl}`)","(e.cid?`💰 Convoy Lv${e.lvl}`:`💰 Merchant Lv${e.lvl}`))")
# ---- module + hook
mod=open('/workspace/tools/pg/b5mod.js').read()
rep("// ---------- SAVE TRANSFER ----------",mod+"\n// ---------- SAVE TRANSFER ----------")
rep("tapBtn('actBtn',()=>startDig());","tapBtn('actBtn',()=>startDig());tapBtn('mTrack',()=>{if(S.quests.length<2)return;const i=S.quests.findIndex(q=>q.id===S.track);const q=S.quests[(i+1)%S.quests.length];S.track=q.id;hudCache.mt=null;toast('📍 Tracking: '+q.title);});")
rep("get tab(){return tab},get nearPort(){return nearPort}};","get tab(){return tab},get nearPort(){return nearPort},genQuest,genQ,grantXP,learn,lvlFromXp,HULLS,buyHull,missionTick,cways,get actQ(){return actQ},startDig,dockQuests,completeQuest,qTarget,progTick,ACH,renderPort,offersFor,trackHUD,renderMenu,openMenu,setMView:v=>{mView=v;renderMenu();},sharkKillQuest,makeTreasureQ,load};")
open(p,'w').write(s)
print('patched')
