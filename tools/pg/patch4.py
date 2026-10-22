p='/workspace/pirate-game/index.html'
s=open(p).read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old); assert n==cnt,(n,old[:100]); s=s.replace(old,new)
# CSS / HTML: board bar with Plunder + Seize
rep("#boardBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(240px + env(safe-area-inset-bottom));padding:12px 20px;",
    "#boardBar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(240px + env(safe-area-inset-bottom));display:flex;gap:8px;animation:pulse 1s infinite}\n#seizeBtn{background:#2f6d3b!important}\n#boardBtn,#seizeBtn{padding:12px 16px;")
rep("touch-action:none;animation:pulse 1s infinite;white-space:nowrap}","touch-action:none;white-space:nowrap}")
rep("#boardBtn{bottom:calc(18px + env(safe-area-inset-bottom))}","#boardBar{bottom:calc(18px + env(safe-area-inset-bottom))}")
rep('<button id="boardBtn" class="hidden">🏴‍☠️ Board &amp; plunder</button>','<div id="boardBar" class="hidden"><button id="boardBtn">🏴‍☠️ Plunder</button><button id="seizeBtn">⛓ Seize ship</button></div>')
rep('<button data-tab="quests">📜 Jobs</button>','<button data-tab="quests">📜 Jobs</button><button data-tab="fleet">⛵ Fleet</button>')
rep('.tabs button{flex:1;min-width:0;min-height:48px;padding:8px 2px;','.tabs button{flex:1;min-width:52px;min-height:48px;padding:8px 2px;')
# help copy
rep("  🔧 Your hull slowly repairs itself when no enemies are near.<br>","""  🦈 <b>Sharks</b> circle the deeper waters (harmless near Port Royal). They gather where ships sink and bite when your hull is low — shoot them for 🦷 shark teeth. Beware the Megalodon far out at sea!<br>
  ⛵ <b>Fleet:</b> seize surrendered merchants (⛓ Seize) or hire escorts at pirate havens. They follow and fight, but cost wages each minute. Manage them in port ➜ ⛵ Fleet.<br>
  🔧 Your hull slowly repairs itself when no enemies are near.<br>""")
rep("<br>🚀 BOOST = +25% speed","<br>🦈 Sharks bite when your hull is low; shoot them for teeth. ⛵ Seize prizes / hire escorts for your fleet.<br>🚀 BOOST = +25% speed")
# goods / state
rep(" {id:'gems',name:'Gems',icon:'💎',base:130}];"," {id:'gems',name:'Gems',icon:'💎',base:130},\n {id:'teeth',name:'Shark Teeth',icon:'🦷',base:26}];")
rep("cargo:{rum:0,sugar:0,spice:0,silk:0,gems:0},\n quests:[]","cargo:{rum:0,sugar:0,spice:0,silk:0,gems:0,teeth:0},\n quests:[]")
rep("up:{hull:0,sails:0,cannons:0,cargo:0,rigging:0}","up:{hull:0,sails:0,cannons:0,cargo:0,rigging:0,command:0}")
rep("tutDone:false,tutStep:0,steer:'drag'};}","tutDone:false,tutStep:0,steer:'drag',fleet:[],fid:1,upkT:0,sharks:0};}")
rep("S.cargo=Object.assign(defaultState().cargo,d.cargo||{});","S.cargo=Object.assign(defaultState().cargo,d.cargo||{});S.fleet=cleanFleet(d.fleet);")
rep(" rigging:{name:'Racing Rigging',"," command:{name:'Fleet Command',icon:'⚓',base:260,g:2.2,max:3,desc:l=>`Fleet size ${1+l} ship${l?'s':''}`},\n rigging:{name:'Racing Rigging',")
rep("enemies.length=0;balls.length=0;loot.length=0;","enemies.length=0;balls.length=0;loot.length=0;fleet.length=0;sharks.length=0;attract.length=0;")
# auto-target sharks that are hunting you
rep("function isHostile(e){return !e.sinking","function isHostile(e){if(e.kind==='shark')return !e.sinking&&e.hp>0&&e.chase;return !e.sinking")
rep(" for(const e of enemies){if(!isHostile(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>R*1.3)continue;",
    " for(let li=0;li<2;li++)for(const e of (li?sharks:enemies)){if(!isHostile(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>R*1.3)continue;")
# crew loss / sinking attract sharks
rep("function damagePlayer(dmg){if(P.dead)return;","function damagePlayer(dmg,bite){if(P.dead)return;")
rep(" if(Math.random()<0.07&&S.crew>4){S.crew--;recalc();addText(P.x+20,P.y-44,'-1 crew','#ffb3b3');}"," if(!bite&&Math.random()<0.07&&S.crew>4){S.crew--;recalc();addText(P.x+20,P.y-44,'-1 crew','#ffb3b3');chum(P.x,P.y,12);}")
rep(" for(let k=0;k<14;k++)addPart('fire',e.x+rand(-15,15)"," chum(e.x,e.y,20);\n for(let k=0;k<14;k++)addPart('fire',e.x+rand(-15,15)")
rep(" if(P.hp<=0){P.hp=0;P.dead=0.001;boom(0.7,300);}}"," if(P.hp<=0){P.hp=0;P.dead=0.001;boom(0.7,300);chum(P.x,P.y,25);}}")
# boarding: sharks may take a boarder
rep(" addText(P.x,P.y-50,msg,'#ffe066',true);toast(msg+(got<want?' (hold full)':''));"," if(sharkBoarding())msg+=' — a boarder fell to the sharks 🦈';\n addText(P.x,P.y-50,msg,'#ffe066',true);toast(msg+(got<want?' (hold full)':''));")
rep("tapBtn('boardBtn',()=>{if(state==='play')board(boardTgt);});","tapBtn('boardBtn',()=>{if(state==='play')board(boardTgt);});tapBtn('seizeBtn',()=>{if(state==='play')seize(boardTgt);});")
# navy pressure vs fleet size
rep("navyT=Math.max(18,40-5*n);let c=0;for(const e of enemies)if(e.kind==='navy'&&!e.sinking)c++;if(c<NAVYMAX[n])spawnNavy(n);",
    "const fc=S.fleet.length;navyT=Math.max(14,40-5*n-3*fc);let c=0;for(const e of enemies)if(e.kind==='navy'&&!e.sinking)c++;if(c<NAVYMAX[n]+(fc>=2?1:0))spawnNavy(n);")
# enemies may target fleet ships
rep(" const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);const toP=Math.atan2(dy,dx);let desired=e.h,thr=0.55;\n if(e.tut){",
""" const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);const toP=Math.atan2(dy,dx);let desired=e.h,thr=0.55;
 let td=d,tto=toP;if(e.kind!=='merchant'&&fleet.length){for(const f of fleet){if(f.sinking)continue;const fd=Math.hypot(f.x-e.x,f.y-e.y);if(fd<td*0.75){td=fd;tto=Math.atan2(f.y-e.y,f.x-e.x);}}}
 if(e.tut){""")
rep("   if(d>330)desired=toP+e.side*0.3;else desired=toP-e.side*Math.PI/2;}","   if(td>330)desired=tto+e.side*0.3;else desired=tto-e.side*Math.PI/2;}")
rep(" if(e.cannons>0&&!P.dead&&d<e.range&&(e.angry||e.kind!=='merchant')&&!safe){const rel=angDiff(e.h,toP);",
    " if(e.kind!=='merchant'){/* aim at whichever target (you or a fleet ship) is chosen */}\n if(e.cannons>0&&!P.dead&&(e.kind==='merchant'?d:td)<e.range&&(e.angry||e.kind!=='merchant')&&!safe){const rel=angDiff(e.h,e.kind==='merchant'?toP:tto);")
# balls
rep("  if(b.owner==='p'){for(const e of enemies){if(!e.sinking&&hitTest(e,b,5)){damageEnemy(e,b.dmg);hit=true;break;}}}\n  else if(!P.dead&&hitTest(P,b,2)){damagePlayer(b.dmg);hit=true;}",
"""  if(b.owner==='p'||b.owner==='f'){for(const e of enemies){if(!e.sinking&&hitTest(e,b,5)){damageEnemy(e,b.dmg);hit=true;break;}}
   if(!hit)for(const sk of sharks){if(!sk.sinking&&hitTest(sk,b,5)){damageShark(sk,b.dmg);hit=true;break;}}}
  else if(!P.dead&&hitTest(P,b,2)){damagePlayer(b.dmg);hit=true;}
  else{for(const f of fleet){if(!f.sinking&&hitTest(f,b,2)){damageFleet(f,b.dmg);hit=true;break;}}}""")
# update loop hooks
rep("  for(const q of S.quests)if(q.type==='hunt'&&!q.spawned","  sharkSpawnTick();\n  for(const q of S.quests)if(q.type==='hunt'&&!q.spawned")
rep(" saveT-=dt;if(saveT<=0){saveT=5;save();}",""" for(let i=sharks.length-1;i>=0;i--){const sk=sharks[i];updateShark(sk,dt);if(sk.sinking>1.2)sharks.splice(i,1);}
 for(let i=attract.length-1;i>=0;i--){attract[i].t-=dt;if(attract[i].t<=0)attract.splice(i,1);}
 updateFleet(dt);
 saveT-=dt;if(saveT<=0){saveT=5;save();}""")
# render
rep(" // ships\n for(const e of enemies){if(e.x<x0-80"," drawSharks(x0,x1,y0,y1,ts);\n // ships\n for(const f of fleet){if(f.x<x0-80||f.x>x1+80||f.y<y0-80||f.y>y1+80)continue;drawShip(f,f.d.type==='prize'?'#efe2c4':'#f6efe0','#111',clamp(f.speed/(ST.maxSpeed||1),0,1));}\n for(const e of enemies){if(e.x<x0-80")
rep(" if(s.kind==='player'){const wv"," if(s.kind==='player'||s.kind==='fleet'){const wv")
rep(" for(const e of enemies){if(e.sinking)continue;const X=sx(e.x),Y=sy(e.y)-e.len*zoom*0.6-8;",
""" for(const f of fleet){if(f.sinking)continue;const X=sx(f.x),Y=sy(f.y)-f.len*zoom*0.6-8;if(X<-40||X>vw+40||Y<-40||Y>vh+40)continue;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(X-19,Y,38,5);ctx.fillStyle='#5be36a';ctx.fillRect(X-19,Y,38*clamp(f.d.hp/f.d.maxHp,0,1),5);ctx.font='bold 11px sans-serif';ctx.fillStyle='#b8ffbf';ctx.fillText('⛵ '+f.d.name,X,Y-8);}
 for(const s2 of sharks){if(s2.sinking||!(s2.mega||s2.hp<s2.maxHp))continue;const X=sx(s2.x),Y=sy(s2.y)-(s2.mega?50:22)*zoom-6;if(X<-40||X>vw+40||Y<-40||Y>vh+40)continue;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(X-19,Y,38,4);ctx.fillStyle='#ff5a4a';ctx.fillRect(X-19,Y,38*clamp(s2.hp/s2.maxHp,0,1),4);if(s2.mega){ctx.font='bold 12px sans-serif';ctx.fillStyle='#ffb0b0';ctx.fillText('🦈 MEGALODON',X,Y-8);}}
 for(const e of enemies){if(e.sinking)continue;const X=sx(e.x),Y=sy(e.y)-e.len*zoom*0.6-8;""")
rep(" if(ST.radar){for(const e of enemies){",""" for(const z of SHARKZ){ctx.fillStyle='rgba(200,40,50,0.22)';ctx.beginPath();ctx.arc(X+z.x*k,Y+z.y*k,z.r*k,0,TAU);ctx.fill();if(big){ctx.font='16px serif';ctx.fillText('🦈',X+z.x*k,Y+z.y*k);}}
 for(const f of fleet){if(f.sinking)continue;ctx.fillStyle='#5be36a';ctx.fillRect(X+f.x*k-2,Y+f.y*k-2,big?5:3.5,big?5:3.5);}
 if(ST.radar){for(const e of enemies){""")
rep("'Red = rival pirates, white = Navy, blue = merchants • 🏴‍☠️ = pirate haven'","'Red = rivals, white = Navy, blue = merchants, green = your fleet • 🏴‍☠️ haven • 🦈 shark waters'")
rep("'🏴‍☠️ = pirate haven, others are lawful • Navigators reveal ships & map'","'🏴‍☠️ = pirate haven • 🦈 red = shark-infested • Navigators reveal ships & map'")
# HUD board bar
rep(" $('boardBtn').classList.toggle('hidden',!(state==='play'&&boardTgt));"," $('boardBar').classList.toggle('hidden',!(state==='play'&&boardTgt));if(boardTgt){const full=S.fleet.length>=fleetCap();setTxt('seizeBtn',full?`⛓ Fleet full (${fleetCap()})`:'⛓ Seize ship');}")
# tips
rep(" board:\"🏳️ <b>They surrendered!</b>"," shark:\"🦈 <b>Sharks!</b> Fins circle the deeper waters. They gather where ships sink and <b>bite when your hull is low</b> (below 35%). Shoot them for 🦷 shark teeth — and steer clear of red 🦈 waters on the map.\",\n board:\"🏳️ <b>They surrendered!</b>")
rep("Sail alongside and tap <b>Board</b> for extra loot — and a smaller bounty than sinking them.\"","Sail alongside and tap <b>Plunder</b> for extra loot (smaller bounty than sinking), or <b>⛓ Seize</b> the ship to join your fleet.\"")
# port: leave/dock fleet handling + fleet tab
rep("function leavePort(){const p=PORTS[curPort];$('port').classList.add('hidden');P.x=p.port.x;P.y=p.port.y;P.h=p.pa;P.throttle=0.35;state='play';curPort=-1;save();}",
    "function leavePort(){const p=PORTS[curPort];$('port').classList.add('hidden');P.x=p.port.x;P.y=p.port.y;P.h=p.pa;P.throttle=0.35;state='play';curPort=-1;placeFleet();save();}")
rep(" else if(tab==='quests'){h+=`<h3>Your jobs (${S.quests.length}/3)</h3>`;",""" else if(tab==='fleet'){const cap=fleetCap();
  h+=`<div class="note">Your fleet: <b>${S.fleet.length}/${cap}</b> ships • wages <b>${wagesTotal()} 💰/min</b> at sea. Fleet ships follow you and fight hostile ships (merchants only after you've attacked them). Unpaid crews desert after 3 missed wages. More slots: <b>⚓ Fleet Command</b> in the 🛠️ Ship tab. The Navy hunts bigger fleets harder.</div>`;
  if(!S.fleet.length)h+=`<div class="note">No ships yet. Seize a surrendered merchant at sea (⛓ Seize) or hire an escort at a 🏴‍☠️ pirate haven.</div>`;
  for(const d of S.fleet){const t=FTYPES[d.type];const miss=Math.max(0,d.maxHp-Math.ceil(d.hp));const c=Math.ceil(miss*0.6*mk());
   h+=row(`${t.icon} ${esc(d.name)}`,`${t.name} Lv${d.lvl} • ❤️ ${Math.ceil(d.hp)}/${d.maxHp} • ${d.cannons} guns/side • dmg ${d.dmg} • wage ${d.wage}💰/min`,
    btn('frep',miss>0?`Repair ${c}💰`:'✓ Fit',miss>0&&S.gold>=c,d.id)+btn('fren','✏️',true,d.id,'sell')+btn('fdis',fDisArm===d.id?'Sure?':'Dismiss',true,d.id,'red'));}
  h+=`<h3>⚓ Hire escorts</h3>`;
  if(p.haven){for(const k of ['sloop','brig']){const t=FTYPES[k];h+=row(`${t.icon} ${t.name}`,`❤️ ${t.hp} • ${t.cannons} guns/side • dmg ${t.dmg} • wage ${t.wage}💰/min`,btn('fhire',S.fleet.length>=cap?'Fleet full':`${t.cost}💰`,S.gold>=t.cost&&S.fleet.length<cap,k));}}
  else h+=`<div class="note">Only 🏴‍☠️ pirate havens hire out escort crews.</div>`;}
 else if(tab==='quests'){h+=`<h3>Your jobs (${S.quests.length}/3)</h3>`;""")
rep(" else if(act==='abandon'){",""" else if(act==='frep'){const d=S.fleet.find(x=>x.id==arg);if(d){const miss=Math.max(0,d.maxHp-Math.ceil(d.hp)),c=Math.ceil(miss*0.6*mk());if(S.gold>=c){S.gold-=c;d.hp=d.maxHp;chime();}}}
 else if(act==='fren'){const d=S.fleet.find(x=>x.id==arg);if(d){const n=prompt('Rename your ship:',d.name);if(n&&n.trim())d.name=n.replace(/[<>&"]/g,'').trim().slice(0,18);}}
 else if(act==='fdis'){if(fDisArm!==+arg){fDisArm=+arg;renderPort();return;}S.fleet=S.fleet.filter(x=>x.id!=arg);fDisArm=0;syncFleet();toast('⛵ Ship dismissed.');}
 else if(act==='fhire'){const t=FTYPES[arg];if(t&&PORTS[curPort].haven&&S.gold>=t.cost&&S.fleet.length<fleetCap()){S.gold-=t.cost;const d={id:S.fid=(S.fid||1)+1,name:freeName(),type:arg,lvl:1,maxHp:t.hp,hp:t.hp,cannons:t.cannons,dmg:t.dmg,wage:t.wage,unpaid:0};S.fleet.push(d);syncFleet();chime();toast(`⛵ The ${t.name} ${d.name} joins your fleet!`);}}
 else if(act==='abandon'){""")
rep("let curPort=-1,tab='dock';","let curPort=-1,tab='dock',fDisArm=0;")
# insert module before save transfer
mod=open('/workspace/tools/pg/b4mod.js').read()
rep("// ---------- SAVE TRANSFER ----------",mod+"// ---------- SAVE TRANSFER ----------")
rep("rebuildFog();populate();\n","rebuildFog();populate();placeFleet();\n")
rep("setState:s=>state=s,boost,","setState:s=>state=s,boost,sharks,fleet,seize,makeShark,SHARKZ,updateFleet,syncFleet,payWages,chum,")
open(p,'w').write(s);print('ok')
