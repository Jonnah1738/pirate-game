import re
p='/workspace/pirate-game/index.html'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
# ---------- CSS ----------
rep("#tut{position:fixed;inset:0;z-index:30;pointer-events:none}","""#boardBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(240px + env(safe-area-inset-bottom));padding:12px 20px;min-height:52px;border-radius:24px;border:none;font-size:17px;font-weight:800;background:#a12a1d;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,255,255,.5);touch-action:none;animation:pulse 1s infinite;white-space:nowrap}
#hWant{display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:#ffd34d;margin-top:2px}
#hWant.hot{color:#ff7b6b}
#tipBox{position:fixed;left:50%;transform:translateX(-50%);top:calc(212px + env(safe-area-inset-top));width:min(360px,calc(100vw - 16px));z-index:25;background:linear-gradient(#f4e4c1,#e3cc9b);color:#3b2306;border:3px solid #a12a1d;border-radius:14px;padding:8px 12px;box-shadow:0 6px 20px rgba(0,0,0,.55);font-size:14.5px;line-height:1.35;pointer-events:none}
#tipBox .tb{display:flex;justify-content:flex-end;margin-top:6px}#tipBox button{pointer-events:auto;touch-action:manipulation}
@media (max-height:520px) and (orientation:landscape){#tipBox{top:calc(8px + env(safe-area-inset-top))}}
#tut{position:fixed;inset:0;z-index:30;pointer-events:none}""")
# ---------- HTML ----------
rep('  <div id="hSub"><span id="hRank"></span><span id="hDanger"></span></div>','  <div id="hSub"><span id="hRank"></span><span id="hDanger"></span></div>\n  <div id="hWant" class="hidden"><span id="hStars"></span><span id="hBounty"></span></div>')
rep('<button id="dockBtn" class="hidden">⚓ Dock</button>','<button id="dockBtn" class="hidden">⚓ Dock</button>\n<button id="boardBtn" class="hidden">🏴‍☠️ Board &amp; plunder</button>\n<div id="tipBox" class="hidden"><div id="tipTxt"></div><div class="tb"><button class="b" id="tipOk">Got it</button></div></div>')
rep("  <p>Sail the open sea, sink rivals, trade cargo and build the most feared crew in the Caribbean.</p>",
    "  <p>You are a <b>pirate captain</b>. Plunder fat merchant ships, outgun rival pirates, outrun the Navy when your Wanted level climbs, and lie low in pirate havens.</p>")
rep("  🔧 Your hull slowly repairs itself when no enemies are near.<br>","""  💰 <b>Merchants:</b> fire on them yourself to raid them (AUTO joins in only after you've attacked one). Badly damaged merchants may <b>surrender</b> — sail close and tap <b>Board</b> for extra loot.<br>
  🚨 <b>Wanted:</b> raiding raises your Wanted ★ level and the Navy hunts you. It fades if you lie low; pay it off at 🏴‍☠️ pirate havens. ⚖️ Lawful ports charge wanted captains more and turn away ★★★+ unless bribed.<br>
  🔧 Your hull slowly repairs itself when no enemies are near.<br>""")
rep("<br>🚀 BOOST = +25% speed","<br>💰 Raid merchants by firing on them; tap Board when they surrender.<br>🚨 Wanted ★: the Navy hunts you. Pay it off at 🏴‍☠️ havens, bribe at ⚖️ lawful ports.<br>🚀 BOOST = +25% speed")
# ---------- PORTS ----------
rep("desc:'A bustling harbour, safe under the guns of the fort. Your home port.'}","haven:1,desc:'Wicked old Port Royal, your home port. The Brethren of the Coast drink here and no governor dares send the Navy in.'}")
rep("desc:'Haven of scoundrels. The rum flows cheap here.'}","haven:1,desc:'Haven of scoundrels and cut-throats. The rum flows cheap and nobody asks where your gold came from.'}")
rep("desc:'Spice merchants crowd the docks. Thirsty sailors pay well for rum.'}","desc:'A Crown colony. Spice merchants crowd the docks and the Navy keeps a close eye on wanted captains.'}")
rep("desc:'Grand colonial port. Nobles here crave gems.'}","desc:'Grand colonial port under the Spanish flag. Nobles crave gems; the governor hangs pirates.'}")
rep("desc:'Silk traders from the far east anchor here.'}","desc:'Lawful trading port where silk traders from the far east anchor.'}")
rep("desc:'Hidden cove. No questions asked. Dangerous waters.'}","haven:1,desc:'Hidden smugglers\\' cove. No questions asked. Dangerous waters.'}")
rep("desc:'Skull Island. Only the bravest captains drop anchor here.'}","haven:1,desc:'Skull Island, a pirate stronghold. Only the bravest captains drop anchor here.'}")
rep("desc:'Wreck-strewn reef. Locals whisper of the deep.'}","haven:1,desc:'Wreck-strewn reef full of wreckers and outlaws. Locals whisper of the deep.'}")
rep("desc:'The fabled city of gold. Richest port on the sea, fiercest pirates.'}","desc:'The fabled city of gold, guarded by the Crown\\'s finest. Richest port on the sea.'}")
rep("  o.desc=d.desc;o.cheap=d.cheap;","  o.desc=d.desc;o.haven=!!d.haven;o.cheap=d.cheap;")
# ---------- STATE ----------
rep("autoFire:true,bal:2,boostTip:false,","autoFire:true,bal:2,boostTip:false,heat:0,heatT:0,tips:{},")
rep("if(S.steer!=='buttons')S.steer='drag';","if(S.steer!=='buttons')S.steer='drag';if(!(S.heat>=0))S.heat=0;if(!S.tips||typeof S.tips!=='object')S.tips={};")
# ---------- ENEMIES ----------
rep("gold:25+22*lvl,len:54,wid:20,range:340});}","gold:35+28*lvl,len:54,wid:20,range:340});}\n else if(kind==='navy'){const soft=lvl<=2,k=1+0.1*stars();Object.assign(e,{maxHp:Math.round(((soft?30:36)+24*lvl)*k),cannons:1+Math.ceil(lvl/2),dmg:(4.2+1.8*lvl)*(soft?0.75:1),maxSpeed:Math.min(205,105+9*lvl),reload:Math.max(2.1,3.6-0.13*lvl)+(soft?0.5:0),aggro:2600,gold:20+20*lvl,len:52+lvl*1.5,wid:18+lvl*0.4,range:390,angry:true});}")
rep(" const nearStart=Math.hypot(pt.x-START.x,pt.y-START.y)<1300;const kind=Math.random()<(nearStart?0.5:0.33)?'merchant':'pirate';enemies.push(makeEnemy(kind,pt.x,pt.y,lvl));}",
""" const nearStart=Math.hypot(pt.x-START.x,pt.y-START.y)<1300;const kind=Math.random()<(nearStart?0.5:0.38)?'merchant':'pirate';if(kind==='merchant'&&spawnMerchant(dmin,dmax))return;enemies.push(makeEnemy(kind,pt.x,pt.y,lvl));}
// merchants sail trade routes between two ports
function spawnMerchant(dmin,dmax){for(let t=0;t<14;t++){const a=PORTS[(Math.random()*PORTS.length)|0],b=PORTS[(Math.random()*PORTS.length)|0];if(a===b)continue;
 const ax=a.port.x,ay=a.port.y,bx=b.port.x,by=b.port.y,f=rand(0.08,0.92);const x=ax+(bx-ax)*f+rand(-120,120),y=ay+(by-ay)*f+rand(-120,120);const d=Math.hypot(x-P.x,y-P.y);
 if(d<dmin||d>dmax||x<200||y<200||x>WORLD-200||y>WORLD-200||inAnyIsland(x,y,90))continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<450))continue;
 const lvl=clamp(lvlAt(x,y)+(Math.random()<0.2?1:0),1,10);const e=makeEnemy('merchant',x,y,lvl,{wp:{x:bx,y:by}});e.h=Math.atan2(by-y,bx-x);enemies.push(e);return true;}return false;}""")
rep("function isHostile(e){return !e.sinking&&e.hp>0&&(e.kind!=='merchant'||e.angry);}","function isHostile(e){return !e.sinking&&e.hp>0&&(e.kind!=='merchant'||(e.angry&&!e.surr));}")
rep("function damageEnemy(e,dmg){e.hp-=dmg;e.hitT=0.25;e.angry=true;addText(e.x,e.y-20,'-'+Math.round(dmg),'#ffd27a');",
"""function damageEnemy(e,dmg){const was=e.angry;e.hp-=dmg;e.hitT=0.25;e.angry=true;addText(e.x,e.y-20,'-'+Math.round(dmg),'#ffd27a');
 if(e.kind==='merchant'){if(!was&&!e.surr)addHeat(0.2);
  if(!e.surr&&!e.plundered&&e.hp>0&&e.hp<e.maxHp*0.3){e.surr=true;e.surrT=0;e.angry=false;addText(e.x,e.y-46,'🏳️ Surrenders!','#ffffff',true);showTip('board');}
  else if(e.surr)e.angry=false;}""")
rep("function sinkRewards(e){S.kills++;S.infamy+=e.lvl*10*(e.kind==='boss'?4:1);\n const gold=Math.round(e.gold*rand(0.8,1.25));const goods={};",
"""function sinkRewards(e){S.kills++;const st=stars(),law=e.kind==='merchant'||e.kind==='navy';S.infamy+=Math.round(e.lvl*10*(e.kind==='boss'?4:1)*(law?1+0.25*st:1));
 const gold=Math.round(e.gold*rand(0.8,1.25)*(law?1+0.15*st:1));const goods={};
 if(e.kind==='merchant'){S.raids=(S.raids||0)+1;addHeat(PORTS.some(p=>!p.haven&&Math.hypot(p.port.x-e.x,p.port.y-e.y)<900)?1.5:1);}else if(e.kind==='navy')addHeat(0.8);""")
rep(" const failed=S.quests.filter(q=>q.type==='deliver');"," S.heat=(S.heat||0)*0.5;\n const failed=S.quests.filter(q=>q.type==='deliver');")
rep("title:tgt==='pirate'?`Bounty: sink ${need} pirate ships`:`Raid: plunder ${need} merchant ships`","title:tgt==='pirate'?`Rivalry: sink ${need} rival pirate ships`:`Raid: plunder ${need} merchant ships`")
rep("title:`Wanted: ${name} (Lv${lvl})`,text:'Hunt them down at the ☠ marked on your map.'}","title:`Rival captain: ${name} (Lv${lvl})`,text:'Settle the score at the ☠ marked on your map.'}")
# ---------- WANTED module ----------
rep("let QT=[];","""// ---------- WANTED / BOUNTY ----------
const STAR_AT=[0,2,4,7,11,16],NAVYMAX=[0,1,2,2,3,4];
function stars(){const h=S.heat||0;let n=0;for(let i=1;i<6;i++)if(h>=STAR_AT[i])n=i;return n;}
const starStr=n=>'★'.repeat(n)+'☆'.repeat(5-n);
function bountyGold(){const h=S.heat||0;return Math.round(h*45+h*h*5);}
function bribeCost(){return Math.round(60+bountyGold()*0.35);}
function lowerCost(){return Math.round(50+bountyGold()*0.4);}
function mk(){const p=PORTS[curPort];return p&&!p.haven?1+0.15*stars():1;}
const pCost=(d,l)=>Math.ceil(upCost(d,l)*mk());
let lastStars=0,navyT=30,boardTgt=null;
function addHeat(v){const before=stars();S.heat=Math.min(24,(S.heat||0)+v);S.heatT=S.playTime;const now=stars();
 if(now>before){toast(`🚨 Wanted ${starStr(now)} — ${now>=4?'bounty hunters are after you!':now>=2?'Navy patrols are hunting you!':'the Navy is looking for you.'}`);if(before===0)navyT=Math.min(navyT,30);showTip('wanted');}}
function spawnNavy(n){const pt=randomWater(P.x,P.y,1300,1800);if(!pt)return;const lvl=clamp(lvlAt(P.x,P.y)+n-1,1,10);enemies.push(makeEnemy('navy',pt.x,pt.y,lvl,{hunter:n>=4}));}
function wantedTick(dt){if(S.heat>0&&S.playTime-(S.heatT||0)>40)S.heat=Math.max(0,S.heat-dt*0.02);
 const n=stars();if(n>=1&&!tutPeace){navyT-=dt;if(navyT<=0){navyT=Math.max(18,40-5*n);let c=0;for(const e of enemies)if(e.kind==='navy'&&!e.sinking)c++;if(c<NAVYMAX[n])spawnNavy(n);}}
 if(n===0&&lastStars>0)toast('✅ The Navy lost your trail — Wanted level cleared.');lastStars=n;
 boardTgt=null;let bd=150;for(const e of enemies){if(!e.surr||e.sinking)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;boardTgt=e;}}}
function board(e){if(!e||!e.surr||e.sinking||state!=='play'||P.dead)return;const n=stars();e.surr=false;e.plundered=true;e.angry=false;
 const gold=Math.round(e.gold*1.6*(1+0.15*n));S.gold+=gold;S.earned+=gold;let msg=`🏴‍☠️ Plundered! +${gold} 💰`;
 const want=(3+Math.random()*4+e.lvl*1.5)|0,gi=Math.min(4,(Math.random()*(1+e.lvl/2.2))|0);const got=Math.min(Math.max(0,ST.cargoCap-cargoUsed()),want);S.cargo[GOODS[gi].id]+=got;if(got)msg+=` +${got}${GOODS[gi].icon}`;
 S.infamy+=Math.round(e.lvl*8*(1+0.25*n));S.raids=(S.raids||0)+1;addHeat(0.6);
 for(const q of S.quests)if(q.type==='bounty'&&q.target==='merchant'&&q.have<q.need){q.have++;if(q.have>=q.need)completeQuest(q);}
 addText(P.x,P.y-50,msg,'#ffe066',true);toast(msg+(got<want?' (hold full)':''));chime();boom(0.3,900);save();}
function tryDock(pi){const p=PORTS[pi];if(!p.haven&&stars()>=3){const c=bribeCost();
  if(S.gold<c){toast(`⛔ ${p.name} turns away a ${stars()}★ wanted pirate! Bribe ${c}💰 or sail to a 🏴‍☠️ pirate haven.`);return;}
  S.gold-=c;setTimeout(()=>toast(`💰 You slipped the harbour master ${c}💰 to look the other way.`),60);}
 dock(pi);}
// one-time tips
const TIPS={merchant:"💰 <b>Merchant ship!</b> You're a pirate — fat merchants are yours to plunder. <b>Fire on one yourself</b> (AUTO only joins in once you've attacked it). Badly damaged merchants may <b>surrender</b> so you can board them.",
 wanted:"🚨 <b>You're Wanted!</b> Raiding merchants raises your Wanted ★ level (top left) and the <b>Navy</b> hunts you. Lie low and it fades, or pay it off at a 🏴‍☠️ pirate haven like Port Royal or Tortuga. ⚖️ Lawful ports charge more and turn away ★★★ pirates.",
 board:"🏳️ <b>They surrendered!</b> Sail alongside and tap <b>Board</b> for extra loot — and a smaller bounty than sinking them."};
let tipTO=0;function showTip(k){if(T.on||!S.tips||S.tips[k]||state==='title')return;S.tips[k]=1;$('tipTxt').innerHTML=TIPS[k];$('tipBox').classList.remove('hidden');clearTimeout(tipTO);tipTO=setTimeout(hideTip,15000);}
function hideTip(){$('tipBox').classList.add('hidden');}
$('tipOk').addEventListener('click',hideTip);
let QT=[];""")
rep("function nearSafePort(x,y){for(const p of PORTS)if(Math.hypot(p.port.x-x,p.port.y-y)<420)return true;return false;}",
    "// lawful ports stop protecting you once you're Wanted; pirate havens always do\nfunction nearSafePort(x,y){const w=stars()>0;for(const p of PORTS)if((p.haven||!w)&&Math.hypot(p.port.x-x,p.port.y-y)<420)return true;return false;}")
rep(" if(e.kind==='merchant'){\n  if(!P.dead&&(d<520||(e.angry&&d<900))){desired=toP+Math.PI;thr=1;}",
""" if(e.kind==='navy'){if(stars()===0){e.angry=false;e.aggro=0;}else{e.aggro=2600;e.angry=true;}}
 if(e.kind==='merchant'){
  if(e.surr){thr=0;desired=e.h;if(d>700){e.surrT+=dt;if(e.surrT>25){e.surr=false;e.angry=false;}}}
  else if(!P.dead&&(d<520||(e.angry&&d<900))){desired=toP+Math.PI;thr=1;}""")
rep("  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.kind!=='boss'&&Math.hypot(e.x-P.x,e.y-P.y)>2800)enemies.splice(i,1);}",
"""  const st0=stars();for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];const d=Math.hypot(e.x-P.x,e.y-P.y);if((e.kind!=='boss'&&d>2800)||(e.kind==='navy'&&st0===0&&d>1400&&!e.sinking))enemies.splice(i,1);}
  if(!S.tips.merchant&&!T.on){for(const e of enemies)if(e.kind==='merchant'&&!e.sinking&&Math.hypot(e.x-P.x,e.y-P.y)<750){showTip('merchant');break;}}""")
rep(" nearPort=-1;if(!P.dead)PORTS.forEach("," wantedTick(dt);\n nearPort=-1;if(!P.dead)PORTS.forEach(")
# ---------- INPUT ----------
rep("if((k==='f'||k==='enter')&&nearPort>=0)dock(nearPort);","if((k==='f'||k==='enter')&&boardTgt)board(boardTgt);else if((k==='f'||k==='enter')&&nearPort>=0)tryDock(nearPort);")
rep("tapBtn('dockBtn',()=>{if(state==='play'&&nearPort>=0)dock(nearPort);});","tapBtn('dockBtn',()=>{if(state==='play'&&nearPort>=0)tryDock(nearPort);});\ntapBtn('boardBtn',()=>{if(state==='play')board(boardTgt);});")
# ---------- PORT UI ----------
rep("function repairCost(hp){return Math.ceil(hp*0.9*(1-0.1*S.roles.carpenter));}","function repairCost(hp){return Math.ceil(hp*0.9*(1-0.1*S.roles.carpenter)*mk());}")
rep("const hp=S.gold/(0.9*(1-0.1*S.roles.carpenter));","const hp=S.gold/(0.9*(1-0.1*S.roles.carpenter)*mk());")
rep("  for(const k in UPG){const d=UPG[k],l=S.up[k];const c=upCost(d,l);","  for(const k in UPG){const d=UPG[k],l=S.up[k];const c=pCost(d,l);")
rep("  for(const k in ROLES){const d=ROLES[k],l=S.roles[k];const c=upCost(d,l);","  for(const k in ROLES){const d=ROLES[k],l=S.roles[k];const c=pCost(d,l);")
rep("const d=UPG[arg];const c=upCost(d,S.up[arg]);","const d=UPG[arg];const c=pCost(d,S.up[arg]);")
rep("const d=ROLES[arg];const c=upCost(d,S.roles[arg]);","const d=ROLES[arg];const c=pCost(d,S.roles[arg]);")
rep("const hire=15+2*S.up.hull;","const hire=Math.ceil((15+2*S.up.hull)*mk());",2)
rep("const b=price(curPort,gi),s=sellPrice(curPort,gi);","const b=Math.ceil(price(curPort,gi)*mk()),s=sellPrice(curPort,gi);")
rep("const pr=price(curPort,+gi);","const pr=Math.ceil(price(curPort,+gi)*mk());")
rep("  h+=`<div class=\"note\">${p.desc} <br>Danger nearby:","""  {const n=stars();h+=p.haven?`<div class="note">🏴‍☠️ <b>Pirate haven</b> — the law can't touch you here.</div>`:`<div class="note">⚖️ <b>Lawful port</b> — wanted captains pay +15% per ★ here${n?` (you pay <b>+${15*n}%</b>)`:''}, and ★★★+ must bribe their way in.</div>`;
   if((S.heat||0)>0.05){if(p.haven)h+=row('🚨 Pay off your bounty',`Wanted ${starStr(n)} • bounty ${bountyGold()} 💰. Pay the Brethren to make the Navy forget you.`,btn('payoff',`Pay ${bountyGold()}💰`,S.gold>=bountyGold()));
    else if(n>=1)h+=row('🤝 Bribe the governor',`Wanted ${starStr(n)}. Lower it by one ★ for ${lowerCost()} 💰.`,btn('bribe',`Bribe ${lowerCost()}💰`,S.gold>=lowerCost()));}}
  h+=`<div class="note">${p.desc} <br>Danger nearby:""")
rep("function portAction(act,arg){if(act==='xfer'){openXfer();return;}","""function portAction(act,arg){if(act==='xfer'){openXfer();return;}
 if(act==='payoff'){const c=bountyGold();if(S.gold>=c&&PORTS[curPort].haven){S.gold-=c;S.heat=0;lastStars=0;chime();toast('🏴‍☠️ Bounty paid off — the Navy forgets your face.');}}
 else if(act==='bribe'){const c=lowerCost(),n=stars();if(S.gold>=c&&n>=1){S.gold-=c;S.heat=STAR_AT[n]-0.5;S.heatT=S.playTime;chime();toast(`🤝 Bribe accepted — Wanted ${starStr(stars())}`);}}""")
rep(" else if(act==='repair'){"," if(act==='repair'){",0) if False else None
# ---------- RENDER ----------
rep("ctx.fillStyle=flag;ctx.beginPath();const fm=masts[masts.length-1];ctx.moveTo(fm,0);ctx.lineTo(fm-11,-3+Math.sin(perfT*0.008+s.x)*2);ctx.lineTo(fm-11,4);ctx.closePath();ctx.fill();",
"""const fm=masts[masts.length-1];
 if(s.kind==='player'){const wv=Math.sin(perfT*0.008)*1.5;ctx.fillStyle='#111';ctx.beginPath();ctx.moveTo(fm,-7);ctx.lineTo(fm-20,-7+wv);ctx.lineTo(fm-20,7+wv);ctx.lineTo(fm,7);ctx.closePath();ctx.fill();ctx.strokeStyle='#eee';ctx.lineWidth=0.8;ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fm-10,-1+wv*0.5,3.2,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(fm-15,2+wv*0.5);ctx.lineTo(fm-5,6+wv*0.5);ctx.moveTo(fm-15,6+wv*0.5);ctx.lineTo(fm-5,2+wv*0.5);ctx.stroke();
  ctx.fillStyle='#111';ctx.fillRect(fm-11.4,-1.6+wv*0.5,1.1,1.1);ctx.fillRect(fm-9.4,-1.6+wv*0.5,1.1,1.1);}
 else{ctx.fillStyle=flag;ctx.beginPath();ctx.moveTo(fm,0);ctx.lineTo(fm-11,-3+Math.sin(perfT*0.008+s.x)*2);ctx.lineTo(fm-11,4);ctx.closePath();ctx.fill();}""")
rep("  if(e.tut)drawShip(e,'#f3e2b0','#ffd34d',0.3);else if(e.kind==='merchant')drawShip(e,'#f4ead2','#2b5fb5',0.6);",
    "  if(e.tut)drawShip(e,'#f3e2b0','#ffd34d',0.3);else if(e.kind==='navy')drawShip(e,e.hunter?'#6b2a2a':'#eef3fb',e.hunter?'#c0392b':'#1d4fa8',1);else if(e.kind==='merchant')drawShip(e,'#f4ead2',e.surr?'#ffffff':'#2b5fb5',e.surr?0:0.6);")
rep("ctx.fillStyle=e.kind==='merchant'?'#cfe8ff':e.kind==='boss'?'#ffb0b0':'#ffd0c0';ctx.fillText(e.tut?'🎯 Training Target':e.kind==='boss'?`☠ ${e.name} Lv${e.lvl}`:(e.kind==='merchant'?`💰 Merchant Lv${e.lvl}`:`☠ Pirate Lv${e.lvl}`),X,Y-8);}",
    "ctx.fillStyle=e.kind==='merchant'?(e.surr?'#ffffff':'#cfe8ff'):e.kind==='navy'?'#bcd6ff':e.kind==='boss'?'#ffb0b0':'#ffd0c0';ctx.fillText(e.tut?'🎯 Training Target':e.kind==='boss'?`☠ ${e.name} Lv${e.lvl}`:e.kind==='navy'?(e.hunter?`🎯 Bounty Hunter Lv${e.lvl}`:`⚓ Navy Lv${e.lvl}`):e.kind==='merchant'?(e.surr?'🏳️ Surrendered — Board!':e.plundered?'💰 Merchant (plundered)':`💰 Merchant Lv${e.lvl}`):`☠ Rival Pirate Lv${e.lvl}`,X,Y-8);}")
rep("ctx.fillStyle='#ffe7a8';ctx.fillText('⚓ '+p.name,X,Y);}","ctx.fillStyle=p.haven?'#ffb0a0':'#ffe7a8';ctx.fillText((p.haven?'🏴‍☠️ ':'⚖️ ')+p.name,X,Y);}")
rep("ctx.fillText(p.name,X+p.port.x*k,Y+p.port.y*k-12);}}","ctx.fillText((p.haven?'🏴‍☠️ ':'')+p.name,X+p.port.x*k,Y+p.port.y*k-12);}}")
rep("ctx.fillStyle=e.kind==='merchant'?'#9fd8ff':'#ff4a4a';","ctx.fillStyle=e.kind==='merchant'?'#9fd8ff':e.kind==='navy'?'#ffffff':'#ff4a4a';")
rep("'Red = pirates, blue = merchants (navigator radar)'","'Red = rival pirates, white = Navy, blue = merchants • 🏴‍☠️ = pirate haven'")
rep("'Hire a Navigator to see ships and reveal more map'","'🏴‍☠️ = pirate haven, others are lawful • Navigators reveal ships & map'")
# ---------- HUD ----------
rep(" const showDock=state==='play'&&nearPort>=0;$('dockBtn').classList.toggle('hidden',!showDock);if(showDock)setTxt('dockBtn','⚓ Dock at '+PORTS[nearPort].name);",
""" const showDock=state==='play'&&nearPort>=0;$('dockBtn').classList.toggle('hidden',!showDock);if(showDock){const pp=PORTS[nearPort];setTxt('dockBtn',!pp.haven&&stars()>=3?`⚖️ Bribe & dock (${bribeCost()}💰)`:(pp.haven?'🏴‍☠️ Dock at ':'⚓ Dock at ')+pp.name);}
 $('boardBtn').classList.toggle('hidden',!(state==='play'&&boardTgt));
 {const h=S.heat||0,n=stars();const show=h>=0.05;if(hudCache.want!==show){hudCache.want=show;$('hWant').classList.toggle('hidden',!show);}
  if(show){setTxt('hStars','🚨 '+starStr(n));setTxt('hBounty','Bounty '+bountyGold()+'💰');$('hWant').classList.toggle('hot',n>=3);}}""")
rep("setState:s=>state=s,boost,","setState:s=>state=s,boost,stars,addHeat,board,tryDock,spawnNavy,spawnMerchant,get boardTgt(){return boardTgt},")
open(p,'w').write(s);print('ok')
