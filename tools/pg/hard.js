// ================= HARDER & LONGER: scaling, upkeep, rare materials, war, legends, treasure, endgame =================
// ---- threat: enemies scale with captain level (0 at Lv10 → 1 at Lv60) and with the danger of the waters ----
function threat(){return clamp(((S.clvl|0)-10)/50,0,1);}
function scaleFoe(e){if(!e||e.tut||e._sc||e.eb)return e;e._sc=1;const T=threat();
 const zone=clamp((e.lvl-6)/7,0,1),k=e.kind==='merchant'?0.45:1,big=e.lead||e.lev||e.leg?0.8:1;
 if(T>0){e.maxHp=Math.round(e.maxHp*(1+(1.1+0.4*zone)*T*k*big));e.dmg*=1+(0.7+0.3*zone)*T*k*big;e.reload*=1-0.12*T*k;e.gold=Math.round(e.gold*(1+0.5*T));}
 if(e.forceCls)applyCls(e,e.forceCls);else if((e.kind==='pirate'||e.kind==='navy'||e.kind==='clan')&&!e.lead&&!e.lev&&!e.leg&&!e.eb&&!e.ebm&&!e.mq&&!e.qid&&!e.lbr&&!e.cid&&!e.guard){applyCls(e,pickCls(e));if((e.cls==='galleon'||e.cls==='iron')&&!e.atkF&&(regionAt(e.x,e.y)||havenDist(e.x,e.y)>5200||e.lvl>=11)&&Math.random()<0.35)e.sqd=1;}
 if(e.kind!=='merchant'&&!e.lead&&!e.lev&&!e.leg&&!e.mq&&!e.atkF&&!e.lbr&&!e.qid){const L=S.clvl|0,r=Math.random();if(L>=40&&r<0.05+0.12*T)e.elite=1;else if(L>=22&&r<0.12+0.2*T)e.vet=1;}
 if(e.elite){e.maxHp=Math.round(e.maxHp*2);e.dmg*=1.4;e.reload*=0.88;e.gold=Math.round(e.gold*2.5);e.maxSpeed=Math.min(215,e.maxSpeed*1.06);e.cannons+=1;}
 else if(e.vet){e.maxHp=Math.round(e.maxHp*1.45);e.dmg*=1.2;e.gold=Math.round(e.gold*1.7);}
 e.hp=e.maxHp;return e;}
const vetTag=e=>(e.elite?'☠ Elite ':e.vet?'⚔ Veteran ':'')+(e.cls?CLS[e.cls].n+' · ':'');
function foeCrewK(e,mode){const T=threat()*(mode==='fort'||!e||e.kind!=='merchant'?1:0.4);return{hp:(1+0.7*T)*(e&&e.elite?1.3:e&&e.vet?1.15:1)*(e&&e.cls==='iron'?0.8:1),dmg:(1+0.45*T)*(e&&e.cls==='iron'?0.85:1)};}

// ---- rare materials ----
const MATS={iw:['🪵','Ironwood'],ink:['🦑','Kraken ink'],bp:['📐','Navy blueprints'],rel:['🗿','Ancient relic']};
function matN(k){return(S.mat&&S.mat[k])|0;}
function matGain(k,n,x,y){if(!MATS[k]||!(n>0))return;S.mat[k]=matN(k)+n;S.matTot=(S.matTot|0)+n;if(x!=null)addText(x,y-80,`+${n} ${MATS[k][0]} ${MATS[k][1]}`,'#e6c98a',true);else toast(`${MATS[k][0]} +${n} ${MATS[k][1]} (${matN(k)} in the hold)`);showTip('mats');}
function matOk(req){if(!req)return true;for(const k in req)if(matN(k)<req[k])return false;return true;}
function matPay(req){if(!req)return;for(const k in req)S.mat[k]=matN(k)-req[k];}
function matTxt(req,plain){if(!req)return'';const s=Object.keys(req).map(k=>`${req[k]}${MATS[k][0]}`).join(' ');return plain?s:` + ${s}`;}
function matInv(){return Object.keys(MATS).map(k=>`${MATS[k][0]} ${MATS[k][1]} <b>${matN(k)}</b>`).join(' • ');}
// costs of the top tiers
HULLS.frigate.cost=6000;HULLS.galleon.cost=15000;
const HULLMAT={frigate:{iw:2},galleon:{iw:6,bp:2}};
for(const g of ['sw','pi','ar'])GEAR[g].forEach(it=>{if(it[2]>=20)it[3]=Math.round(it[3]*1.6/50)*50;});
function gearMat(g,i){const it=GEAR[g][i];if(!it||it[2]<20)return null;const k=g==='sw'?'ink':g==='pi'?'bp':'iw';return it[2]>=34?{[k]:3,rel:1}:{[k]:2};}
function crewgMat(k,l){return l>=4?(k==='cw'?{ink:2}:{iw:2}):l>=3?(k==='cw'?{ink:1}:{iw:1}):null;}
const UPMAT={hull:'iw',sails:'iw',cannons:'bp',cargo:'iw',rigging:'ink',command:'bp'};
function upMat(k,l){const d=UPG[k];if(!d)return null;if(l>=d.max-2&&d.max>=6)return{[UPMAT[k]]:l>=d.max-1?2:1};if(k==='rigging'&&l>=d.max-1)return{ink:1};if(k==='command'&&l>=d.max-1)return{bp:2};return null;}
const PERKMAT={gun:'bp',sea:'iw',plun:'ink',cmd:'bp',war:'iw'};
function perkCost(k,i){if(i<4)return null;const g=[1500,3000,4500][Math.min(2,i-4)],n=[1,2,3][Math.min(2,i-4)];return{gold:g,mat:{[PERKMAT[k]]:n}};}

// ---- upkeep: crew wages & hull wear accrue at sea, settled when you dock (or each sea-day by the purser) ----
const UPK={CREW:0.35,WEAR:{sloop:1,brig:3,frigate:7,galleon:14},UPW:0.6,DAY:600,FREE_INF:100};
function upkRates(){const up=S.up;let ul=0;for(const k in up)ul+=up[k]|0;const crew=S.crew*UPK.CREW,wear=((UPK.WEAR[S.ship]||1)+UPK.UPW*ul)*(1-0.08*(S.roles.carpenter|0));return{crew,wear,fleet:wagesTotal()};}
function upkOwed(){const u=S.upk;return Math.round((u.crew||0)+(u.wear||0));}
function upkTick(dt){if(T.on||S.infamy<UPK.FREE_INF||P.dead)return;const r=upkRates(),u=S.upk;u.crew+=r.crew*dt/60;if(Math.hypot(P.vx,P.vy)>15)u.wear+=r.wear*dt/60;u.t+=dt;if(u.t>=UPK.DAY)upkSettle('sea');}
function upkSettle(where){const u=S.upk,owed=upkOwed();u.t=0;if(owed<=0){u.crew=u.wear=0;return;}const pay=Math.min(S.gold,owed),short=owed-pay;S.gold-=pay;
 const rec={c:Math.round(u.crew),w:Math.round(u.wear),paid:pay,short,where,at:S.playTime};u.last=rec;u.paidTot=(u.paidTot|0)+pay;u.crew=u.wear=0;
 if(short>0){const lost=S.crew>6?Math.max(1,Math.round(S.crew*Math.min(0.15,0.04+short/Math.max(1,owed)*0.1))):0;S.crew-=lost;S.morale=Math.max(0,(S.morale|0)-18);recalc();
  setTimeout(()=>toast(`📒 Couldn't cover upkeep — short ${short}💰. Morale falls to ${S.morale}%${lost?` and ${lost} crew desert`:''}. Pay your crew and they'll stay loyal.`),where==='port'?2400:0);}
 else{S.morale=Math.min(100,(S.morale|0)+8);recalc();setTimeout(()=>toast(`📒 Purser settled ${pay}💰 — wages ${rec.c}, hull wear ${rec.w}. Morale ${S.morale}%.`),where==='port'?2400:0);}
 showTip('upkeep');}
function moraleApply(){const m=S.morale==null?80:S.morale;if(m<35){ST.maxSpeed*=0.93;ST.reload*=1.08;}else if(m>=85)ST.reload*=0.97;}
function ledgerHTML(){const r=upkRates(),u=S.upk,l=u.last;return`<div class="note">📒 <b>Ledger</b> — at sea: crew wages ${r.crew.toFixed(1)}💰/min (${S.crew} hands) • hull wear ${r.wear.toFixed(1)}💰/min while sailing${r.fleet?` • fleet wages ${r.fleet}💰/min`:''}.<br>Owed now: <b>${upkOwed()}💰</b> (settled on docking)${l?` • last: ${l.paid}💰 paid${l.short?`, <b style="color:#a12a1d">${l.short} short</b>`:''}`:''} • Morale <b>${S.morale|0}%</b>${(S.morale|0)<35?' (sluggish crew)':''}</div>`;}

// ---- death: lose half the cargo, 22% of carried gold, pay a repair bill. Gold in a haven vault is safe. ----
function deathRepair(){const bill=Math.round(ST.maxHp*0.45*(1+0.15*HORD.indexOf(S.ship)));const pay=Math.min(S.gold,bill);S.gold-=pay;if(bill>pay)S.upk.wear+=bill-pay;return bill;}
function vaultHTML(p){if(!p.haven)return'';const v=S.vault|0;return`<h3>🏦 Brethren's vault</h3>`+row(`🏦 Vault: ${v} 💰`,`Gold in the vault is safe if you're sunk (you lose 22% of the gold you carry). 2% fee on deposits; withdraw free at any haven.`,btn('vdep','Deposit all',S.gold>=10,'all')+btn('vdep','Half',S.gold>=20,'half')+btn('vwd','Withdraw',v>0,'all'));}

// ---- clan war: one counterattack at a time, with warnings; the war never quite ends ----
function warCan(f,s){const w=S.war;if(FORTS.some(g=>{const t=S.forts[g.id];return t&&t.o==='p'&&t.atk;}))return false;if(S.playTime<(w.next||0))return false;return true;}
function warStart(f,s){const w=S.war;w.next=S.playTime+(S.king?rand(900,1500):rand(300,540));w.n=(w.n|0)+1;const c=s.atk.c,C=CLANS[c];
 toast(S.king?`⚔️ ${C.short} rebels march on ${f.name}! They strike in 1:00 — sail there to defend (🛡️ on your map).`:`⚔️ The ${C.name} march on ${f.name}! Their fleet strikes in 1:00 — sail there to defend (🛡️ on your map).`);showTip('war');}
function warLost(f,s,c){S.war.lost=(S.war.lost|0)+1;if(!S.king)addRep(c,-4,true);}

// ---- legendary bounties: named, tough, multi-stage ----
const LEGENDS=[
 {id:'rook',name:'Black Annis Rook',lvl:24,x:6400,y:16800,tag:'Rook',col:'#3a2a2a',bio:'Burned Port Esperanza twice. Flies a black flag with a white crow.',hp:3600,guns:6,dmg:26,gold:4000,mat:{iw:2,ink:1}},
 {id:'widow',name:'The Widowmaker',lvl:30,x:17400,y:6400,tag:'Widowmaker',col:'#2b2b33',bio:'A silent frigate that leaves no survivors. Nobody knows who commands her.',hp:4800,guns:7,dmg:30,gold:5500,mat:{bp:2,ink:1}},
 {id:'esteban',name:'Don Esteban Cruz',lvl:36,x:6200,y:6600,tag:'Cruz',col:'#7a1b1b',bio:'A Spanish privateer with letters of marque from three kings — and loyal to none.',hp:6200,guns:8,dmg:34,gold:7000,mat:{bp:3,iw:1}},
 {id:'jack',name:'Hollow Jack',lvl:42,x:17600,y:17600,tag:'Hollow Jack',col:'#3d4a44',bio:'Hanged at Hangman\'s Cay in 1689. Still sailing.',hp:7800,guns:8,dmg:38,gold:9000,mat:{ink:3,rel:1},ghost:1},
 {id:'maiden',name:'The Iron Maiden',lvl:48,x:3800,y:12000,tag:'Iron Maiden',col:'#4a4a4a',bio:'An armoured gunboat built by Iron Gull deserters. Her hull turns round shot.',hp:9800,guns:9,dmg:42,gold:11000,mat:{iw:4,rel:1}},
 {id:'sable',name:'Lady Corvina Sable',lvl:55,x:12000,y:20500,tag:'Sable',col:'#1d1d2b',bio:'Queen of the smugglers\' courts. Owns half the harbour masters in the Republic.',hp:12000,guns:10,dmg:46,gold:15000,mat:{bp:3,ink:3,rel:2}}];
const LEGI={};LEGENDS.forEach((l,i)=>LEGI[l.id]=i);
const legDone=()=>LEGENDS.filter(l=>S.lb.done[l.id]).length;
function legStages(L){return[{t:'raid',need:3,txt:`Sink 3 of ${L.tag}'s raiders near ${L.tag}'s hunting grounds`},{t:'clue',txt:`Follow the trail — search the wreck the raiders came from`},{t:'hunt',txt:`Hunt down ${L.name}`}];}
function legPt(L,st){const a=(LEGI[L.id]+1)*1.7;return st===1?{x:L.x+Math.cos(a)*1700,y:L.y+Math.sin(a)*1700}:{x:L.x,y:L.y};}
function legAccept(id){const L=LEGENDS[LEGI[id]];if(!L||S.lb.cur||S.lb.done[id]||S.clvl<L.lvl)return;S.lb.cur=id;S.lb.st=0;S.lb.have=0;S.lb.sp=0;toast(`📜 Legendary bounty taken: ${L.name}. ${legStages(L)[0].txt} (☠️ on your map).`);showTip('legend');save();}
function legHTML(p){if(!p.haven)return'';let h=`<h3>📜 Legendary bounties</h3><div class="note">Named captains worth a fortune — and a chart fragment each. One hunt at a time. Bring a strong ship.</div>`;
 for(const L of LEGENDS){const done=!!S.lb.done[L.id],cur=S.lb.cur===L.id,ok=S.clvl>=L.lvl;
  h+=row(`${done?'✅':cur?'🎯':ok?'☠️':'🔒'} ${L.name} <small style="display:inline">Lv${L.lvl}+</small>`,`${L.bio}${cur?`<br><b>Stage ${S.lb.st+1}/3:</b> ${legStages(L)[S.lb.st].txt}${S.lb.st===0?` (${S.lb.have}/3)`:''}`:''}<br>Reward: ${L.gold}💰${matTxt(L.mat)} + 🗺️ chart fragment`,
   done||cur?'':btn('lbtake',ok?(S.lb.cur?'Busy':'Take'):`Lv${L.lvl}`,ok&&!S.lb.cur,L.id));}
 if(S.lb.cur)h+=row('Abandon the current hunt','Progress on it is lost.',btn('lbdrop','Abandon',true,'','red'));return h;}
function legTick(){const id=S.lb.cur;if(!id)return;const L=LEGENDS[LEGI[id]],st=S.lb.st,pt=legPt(L,st),d=Math.hypot(pt.x-P.x,pt.y-P.y);
 const mine=enemies.filter(e=>e.lb===id&&!e.sinking);
 for(const e of mine)if(Math.hypot(e.x-P.x,e.y-P.y)>5200){enemies.splice(enemies.indexOf(e),1);if(e.leg)S.lb.hp=e.hp/e.maxHp;}
 if(st===0&&d<2600&&!mine.length&&S.lb.have<3){const n=3-S.lb.have;for(let i=0;i<n;i++){const w=waterNear(pt.x,pt.y,200,600);enemies.push(makeEnemy('pirate',w.x,w.y,clamp(lvlAt(w.x,w.y)+1,6,14),{lb:id,lbr:1,keep:true,angry:true,aggro:1400,home:{x:pt.x,y:pt.y},name:L.tag+"'s raider"}));}toast(`☠️ ${L.tag}'s raiders are here — sink them!`);}
 if(st===1&&d<220){S.lb.st=2;S.lb.hp=1;chime();toast(`🔎 Among the wreckage: a logbook. ${L.name} lairs off the ☠️ mark — and won't be alone.`);save();}
 if(st===2&&d<2500&&!mine.some(e=>e.leg)){const lv=clamp(lvlAt(pt.x,pt.y)+2,10,14);const e=makeEnemy('boss',pt.x,pt.y,lv,{lb:id,leg:1,keep:true,angry:true,name:L.name,maxHp:L.hp,cannons:L.guns,dmg:L.dmg,reload:2.5,maxSpeed:170,aggro:1500,gold:L.gold,len:80,wid:27,range:440,legC:L.col,ghost:L.ghost,home:{x:pt.x,y:pt.y}});
  e.hp=Math.max(0.2,S.lb.hp||1)*e.maxHp;enemies.push(e);for(let i=0;i<2;i++){const w=waterNear(pt.x,pt.y,180,320);enemies.push(makeEnemy('pirate',w.x,w.y,lv-1,{lb:id,lbr:1,keep:true,angry:true,home:{x:pt.x,y:pt.y}}));}toast(`☠️ ${L.name} — "${L.ghost?'The dead don\'t hang twice.':'You\'ve chased me far enough.'}"`);}
 for(const e of mine)if(e.leg&&!e.ph2&&e.hp<e.maxHp*0.5){e.ph2=1;e.reload*=0.8;for(let i=0;i<2;i++){const w=waterNear(e.x,e.y,200,350);enemies.push(makeEnemy('pirate',w.x,w.y,e.lvl-1,{lb:id,lbr:1,keep:true,angry:true,home:{x:e.x,y:e.y}}));}toast(`☠️ ${L.name} signals for help — reinforcements!`);}}
function legSunk(e){const id=e.lb;if(!id||id!==S.lb.cur)return;const L=LEGENDS[LEGI[id]];
 if(e.lbr&&S.lb.st===0){S.lb.have++;if(S.lb.have>=3){S.lb.st=1;toast(`☠️ Raiders sunk. One of them limped in from the north-east… follow the trail (🔎 on your map).`);}}
 else if(e.leg){S.lb.done[id]=1;S.lb.cur='';S.lb.hp=1;S.gold+=L.gold;S.earned+=L.gold;S.infamy+=500+20*L.lvl;grantXP(800+40*L.lvl,e.x,e.y);for(const k in L.mat)matGain(k,L.mat[k]);fragGain(1,'from '+L.name+'\'s strongbox');
  for(const o of enemies)if(o.lb===id){o.keep=false;o.lb='';}setTimeout(()=>toast(`📜 ${L.name} is no more! +${L.gold}💰. Legends left: ${LEGENDS.length-legDone()}.`),400);storyEv('legend',{id});save();}}

// ---- the Lost Hoard: 8 chart fragments → one final dig ----
const FRAG_MAX=8;
function grandSpot(){const R=SREGP&&SREGP[0];const l=R&&R.lm&&R.lm[1];if(l){const a=0.8;return{x:l.x+Math.cos(a)*(l.r*1.3+70),y:l.y+Math.sin(a)*(l.r*1.3+70),isle:l.name};}return{x:2600,y:21200,isle:'the far south-west'};}
function fragGain(n,why){if((S.tr.frag|0)>=FRAG_MAX)return;S.tr.frag=Math.min(FRAG_MAX,(S.tr.frag|0)+n);toast(`🗺️ Chart fragment ${S.tr.frag}/${FRAG_MAX} ${why||''}!${S.tr.frag>=FRAG_MAX?' The chart is whole — the Lost Hoard is marked ❌ on your map!':''}`);if(S.tr.frag>=FRAG_MAX)grandQuest();save();}
function grandQuest(){if(S.tr.dug||S.quests.some(q=>q.grand))return;const sp=grandSpot();S.quests.push({id:S.qid++,from:S.lastPort|0,type:'treasure',grand:1,x:sp.x,y:sp.y,lvl:14,cost:0,guard:true,reward:20000,title:`The Lost Hoard of Avery (${sp.isle})`,text:`All eight fragments match: the Lost Hoard lies off ${sp.isle}. Expect company.`});}
function grandFound(q){S.tr.dug=1;matGain('rel',3);matGain('iw',3);matGain('ink',3);matGain('bp',3);S.cosU['flag:avery']=1;S.cosU['hull:hoard']=1;setTimeout(()=>toast('👑 THE LOST HOARD! Gold, relics and Avery\'s own colours — new 🎨 flag & hull paint unlocked.'),600);storyEv('grand',{});}

// ---- endgame bosses: need a fleet and several attempts (damage persists, slowly heals) ----
const EBOSS={admiral:{name:'The Drowned Admiral',sub:'HMS Erebus',reg:1,lvl:14,hp:60000,guns:11,dmg:30,len:104,wid:36,need:50},kraken:{name:'The Kraken',sub:'of the Maelstrom',reg:2,lvl:14,hp:80000,guns:0,dmg:0,len:150,wid:130,need:55}};
function ebPt(k){const R=SREGP&&SREGP[EBOSS[k].reg];if(!R||R.cx==null)return null;const l=R.lm[0]||{x:R.cx,y:R.cy,r:100};const a=Math.atan2(R.cy-l.y,R.cx-l.x)+Math.PI;return waterNearFixed(l.x+Math.cos(a)*(l.r*1.3+420),l.y+Math.sin(a)*(l.r*1.3+420));}
function waterNearFixed(x,y){for(let r=0;r<12;r++)for(let k=0;k<8;k++){const px=x+Math.cos(k/8*TAU)*r*60,py=y+Math.sin(k/8*TAU)*r*60;if(!inAnyIsland(px,py,140))return{x:px,y:py};}return{x,y};}
function ebTick(){for(const k in EBOSS){const B=EBOSS[k],st=S.eb[k];if(st.done)continue;const pt=ebPt(k);if(!pt)continue;const d=Math.hypot(pt.x-P.x,pt.y-P.y);const e=enemies.find(o=>o.eb===k&&!o.sinking);
  if(!e){if(st.hp<1)st.hp=Math.min(1,st.hp+(S.playTime-(st.t||S.playTime))/600*0.04);st.t=S.playTime;
   if(d<2300&&!P.dead){if(S.clvl<B.need){if(!st.warn||S.playTime-st.warn>120){st.warn=S.playTime;toast(`🌫️ Something vast stirs below… (${B.name} — captain level ${B.need}+)`);}continue;}
    if(S.fleet.length<2){if(!st.warn||S.playTime-st.warn>120){st.warn=S.playTime;toast(`🌫️ ${B.name} won't rise for a lone ship. Bring a fleet (2+ ships).`);}continue;}
    const o=makeEnemy('boss',pt.x,pt.y,B.lvl,{eb:k,keep:true,angry:true,name:B.name,maxHp:B.hp,cannons:B.guns,dmg:B.dmg,reload:2.6,maxSpeed:k==='kraken'?0:120,aggro:2400,gold:30000,len:B.len,wid:B.wid,range:470,ghost:k==='admiral',kraken:k==='kraken',home:{x:pt.x,y:pt.y}});o.hp=Math.max(0.05,st.hp)*o.maxHp;if(o.kraken){o.h=0;o.sub=0;o.subT=12;}enemies.push(o);st.tries=(st.tries|0)+1;
    toast(k==='kraken'?'🦑 THE KRAKEN RISES! Keep moving — dodge the tentacles. It only takes full damage with 2+ fleet ships nearby.':'⚓ The Drowned Admiral\'s HMS Erebus rises from the deep! Its ghost escorts return until it sinks.');}}
  else{if(d>4800){st.hp=e.hp/e.maxHp;st.t=S.playTime;enemies.splice(enemies.indexOf(e),1);for(const o of enemies)if(o.ebm===k)o.keep=false;toast(`🌫️ ${B.name} sinks back beneath the waves (${Math.round(st.hp*100)}% strength). It will be waiting.`);continue;}
   st.hp=e.hp/e.maxHp;const esc=enemies.filter(o=>o.ebm===k&&!o.sinking).length;e.escT=(e.escT||0)-1;if(esc<2&&e.escT<=0){e.escT=45;const w=waterNear(e.x,e.y,250,420);enemies.push(makeEnemy(k==='kraken'?'pirate':'navy',w.x,w.y,13,{ebm:k,keep:true,angry:true,gAng:true,ghost:k==='admiral',name:k==='kraken'?'Drowned crew':'Ghost of the line',home:{x:e.x,y:e.y}}));}}}}
function fleetNear(e,R){let n=0;for(const f of fleet)if(!f.sinking&&Math.hypot(f.x-e.x,f.y-e.y)<R)n++;return n;}
function hardDmgMod(e,dmg){if(e.eb){if(e.kraken&&e.sub)return 0;return dmg*(fleetNear(e,1000)>=2?1:0.45);}return dmg;}
// kraken: telegraphed tentacle slams, submerges between bouts (immune), ink cloud
const KT=[];
function krakenTick(dt){for(const e of enemies){if(!e.kraken||e.sinking)continue;e.vx=e.vy=0;e.speed=0;e.subT-=dt;if(e.subT<=0){e.sub=e.sub?0:1;e.subT=e.sub?6:12;if(e.sub)toast('🦑 The Kraken dives — it can\'t be hurt while submerged!');}
  if(e.sub)continue;e.slT=(e.slT||2)-dt;if(e.slT<=0){e.slT=rand(2.4,3.4);const tg=[P].concat(fleet.filter(f=>!f.sinking));for(const t of tg){if(Math.hypot(t.x-e.x,t.y-e.y)>720)continue;if(t!==P&&Math.random()<0.5)continue;KT.push({x:t.x+(t.vx||0)*0.8,y:t.y+(t.vy||0)*0.8,t:1.1,r:85,tgt:t===P?'p':t});}}}
 for(let i=KT.length-1;i>=0;i--){const k=KT[i];k.t-=dt;if(k.t<=0){if(Math.hypot(P.x-k.x,P.y-k.y)<k.r)damagePlayer(70+60*threat(),false);for(const f of fleet)if(!f.sinking&&Math.hypot(f.x-k.x,f.y-k.y)<k.r)damageFleet(f,90);for(let j=0;j<14;j++)addPart('splash',k.x+rand(-30,30),k.y+rand(-30,30),rand(-60,60),rand(-60,60),0.8,rand(6,12),null);boom(0.5,200);KT.splice(i,1);}}}
function drawKT(){for(const k of KT){const a=1-k.t/1.1;ctx.strokeStyle=`rgba(180,40,40,${0.35+0.5*a})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx(k.x),sy(k.y),k.r*zoom,0,TAU);ctx.stroke();ctx.fillStyle=`rgba(60,10,20,${0.15+0.3*a})`;ctx.beginPath();ctx.arc(sx(k.x),sy(k.y),k.r*zoom*a,0,TAU);ctx.fill();}}
function drawKraken(e,ts){ctx.save();ctx.translate(e.x,e.y);const s=e.sub?0.55:1,al=e.sub?0.35:1;ctx.globalAlpha=al;
 ctx.fillStyle='rgba(5,10,14,0.45)';ctx.beginPath();ctx.ellipse(6,10,95*s,80*s,0,0,TAU);ctx.fill();
 for(let i=0;i<8;i++){const a=i/8*TAU+Math.sin(ts*0.7+i)*0.15,L=(110+30*Math.sin(ts*1.3+i*2))*s;ctx.strokeStyle='#3a1f2b';ctx.lineWidth=16*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a+0.4)*L*0.6,Math.sin(a+0.4)*L*0.6,Math.cos(a)*L,Math.sin(a)*L);ctx.stroke();ctx.strokeStyle='#5c3242';ctx.lineWidth=6*s;ctx.stroke();}
 ctx.fillStyle='#2b1620';ctx.beginPath();ctx.ellipse(0,0,62*s,52*s,0,0,TAU);ctx.fill();ctx.fillStyle='#4a2735';ctx.beginPath();ctx.ellipse(-8,-8,40*s,30*s,0,0,TAU);ctx.fill();
 ctx.fillStyle='#d9b23a';for(const d of [-1,1]){ctx.beginPath();ctx.ellipse(d*22*s,6*s,7*s,4*s,0,0,TAU);ctx.fill();}ctx.restore();ctx.globalAlpha=1;}
function ebSunk(e){if(!e.eb)return;const k=e.eb,B=EBOSS[k];S.eb[k].done=1;S.eb[k].hp=0;matGain('rel',3);matGain(k==='kraken'?'ink':'bp',5);S.infamy+=3000;grantXP(5000,e.x,e.y);S.cosU[k==='kraken'?'sail:kraken':'sail:erebus']=1;
 for(const o of enemies)if(o.ebm===k)o.keep=false;setTimeout(()=>toast(`🏆 ${B.name} is destroyed after ${S.eb[k].tries|0} attempt(s)! +5000 XP, relics, and new 🎨 sails unlocked.`),500);storyEv('eboss',{id:k});save();}

// ---- loot: rare materials and fragments from dangerous foes ----
function hardSunk(e){if(e.tut)return;const x=e.x,y=e.y;legSunk(e);ebSunk(e);
 if(e.elite){matGain(e.kind==='navy'?'bp':e.kind==='clan'?'iw':pick(['ink','iw']),1+(Math.random()<0.4?1:0),x,y);if(Math.random()<0.05)fragGain(1,'tucked in an elite captain\'s coat');}
 else if(e.vet&&Math.random()<0.3)matGain(e.kind==='navy'?'bp':e.kind==='clan'?'iw':'ink',1,x,y);
 if(e.kind==='boss'&&!e.leg&&!e.eb&&!e.lbr&&Math.random()<0.6)matGain(pick(['ink','iw','bp']),1,x,y);
 if(e.lead){matGain('iw',e.rev?3:2,x,y);matGain('bp',e.rev?3:1);matGain('ink',e.rev?3:1);}
 if(e.lev)matGain('bp',5,x,y);
 if(e.kind==='navy'&&e.hunter&&Math.random()<0.35)matGain('bp',1,x,y);
 storyEv('sink',{e});}
function megaSunk(s){matGain('ink',2,s.x,s.y);if(Math.random()<0.25)fragGain(1,'in the Megalodon\'s belly');storyEv('mega',{});}
function fortTaken(f){matGain('iw',2);if(Math.random()<0.5)matGain('bp',1);if(Math.random()<0.1)fragGain(1,'in the fort\'s map room');storyEv('fort',{f});}

// ---- map targets & ticks ----
function hardTargets(out){if(S.lb.cur){const L=LEGENDS[LEGI[S.lb.cur]];const p=legPt(L,S.lb.st);out.push({x:p.x,y:p.y,icon:S.lb.st===1?'🔎':'☠️',c:'#e05a4a'});}
 for(const k in EBOSS){if(S.eb[k].done||S.clvl<EBOSS[k].need-5)continue;const p=ebPt(k);if(p&&S.vis.includes(SREGP[EBOSS[k].reg].pi))out.push({x:p.x,y:p.y,icon:k==='kraken'?'🦑':'⚓',c:'#b04aff'});}
 for(const f of FORTS){const s=S.forts[f.id];if(s&&s.o==='p'&&s.atk&&s.atk.w>0)out.push({x:f.x,y:f.y,icon:'⚔️',c:'#ff9a3d'});}
 storyTargets(out);}
let hardT=0;
function hardTick(dt){upkTick(dt);krakenTick(dt);ironTick(dt);hardT-=dt;if(hardT>0)return;hardT=1;squadTick();legTick();ebTick();storyTick();}
function hardMigrate(d){const def=defaultState();for(const k of ['mat','upk','war','lb','tr','eb','cosU'])S[k]=Object.assign(def[k],(d[k]&&typeof d[k]==='object')?d[k]:{});
 for(const k in MATS)S.mat[k]=Math.max(0,S.mat[k]|0);for(const k of ['crew','wear','t'])S.upk[k]=Math.max(0,+S.upk[k]||0);
 if(!S.lb.done||typeof S.lb.done!=='object')S.lb.done={};if(S.lb.cur&&LEGI[S.lb.cur]==null)S.lb.cur='';S.lb.st=clamp(S.lb.st|0,0,2);
 for(const k in EBOSS){S.eb[k]=Object.assign({hp:1,done:0,tries:0},(S.eb[k]&&typeof S.eb[k]==='object')?S.eb[k]:{});S.eb[k].hp=clamp(+S.eb[k].hp||0,0,1);if(!S.eb[k].done&&S.eb[k].hp<=0)S.eb[k].hp=1;}
 S.morale=clamp(d.morale==null?80:+d.morale||0,0,100);S.vault=Math.max(0,Math.floor(+d.vault||0));S.tr.frag=clamp(S.tr.frag|0,0,FRAG_MAX);
 S.war.next=Math.max(+S.war.next||0,(S.playTime||0)+240);for(const id in S.forts){const f=S.forts[id];if(f&&f.o==='p'&&!f.atk)f.nx=Math.max(+f.nx||0,(S.playTime||0)+240);}}
// new tips & trophies
Object.assign(TIPS,{upkeep:"📒 <b>Upkeep.</b> At sea your crew draws wages and your hull wears. The purser settles the bill when you dock (☰ Log ➜ Ledger). Can't pay? Morale drops and some hands desert — never worse.",
 mats:"🪵 <b>Rare materials!</b> Ironwood, Kraken ink, Navy blueprints and relics drop from elites, bosses, forts and Megalodons. Top hulls, perks and gear need them (☰ Log shows your stock).",
 war:"⚔️ <b>Counterattack!</b> Clans try to retake your forts. You get a minute's warning — sail there and sink the attackers, or the garrison may fall.",
 legend:"📜 <b>Legendary bounty.</b> Three stages: sink the raiders, follow the trail 🔎, then fight the legend (who calls for help at half hull). Each one drops a 🗺️ chart fragment — collect 8 for the Lost Hoard.",
 vault:"🏦 <b>Vault.</b> Sinking costs half your cargo, 22% of carried gold and a repair bill. Gold left in a haven's vault is safe."});
ACH.push(['vet10','⚔️','Veteran Hunter','Sink 10 veteran or elite ships',()=>(S.cst.vet|0)>=10],['mats25','🪵',"Shipwright's Hoard",'Gather 25 rare materials',()=>(S.matTot|0)>=25],
 ['legend1','📜','Bounty Hunter','Bring down a legendary bounty',()=>legDone()>=1],['legend6','💀','Hunter of Legends','Bring down all six legendary bounties',()=>legDone()>=6],
 ['frag8','🗺️','The Whole Chart','Assemble all 8 chart fragments',()=>(S.tr.frag|0)>=FRAG_MAX],['hoard','👑','The Lost Hoard','Dig up the Lost Hoard of Avery',()=>!!S.tr.dug],
 ['eb1','⚓','Admiral of the Deep','Sink the Drowned Admiral',()=>!!S.eb.admiral.done],['eb2','🦑','Krakenslayer','Slay the Kraken',()=>!!S.eb.kraken.done],
 ['war10','🛡️','Unyielding','Hold 10 forts against counterattacks',()=>(S.cst.def|0)>=10]);
COS.flag.push(['avery','Avery\'s Colours',999,'#5a0f0f','#e8c66a']);COS.hull.push(['hoard','Hoard Gilt',999,'#4a2c0a','#e0b84a']);COS.sail.push(['kraken','Kraken Hide',999,'#3a1f2b'],['erebus','Drowned Canvas',999,'rgba(160,200,190,0.6)']);
const cosOk=(cat,it)=>S.clvl>=it[2]||!!(S.cosU&&S.cosU[cat+':'+it[0]]);

// ---- enemy ship classes by distance from the pirate havens: sloops near home, frigates mid-sea, galleons & ironclads far out ----
const CLS={frigate:{n:'Frigate',paint:'#5a3a20',deck:'#9a6c40'},galleon:{n:'Galleon',paint:'#3e2614',deck:'#86603a'},iron:{n:'Ironclad',paint:'#34383c',deck:'#5d6266'}};
function havenDist(x,y){let b=1e9;for(const p of PORTS)if(p.haven){const d=Math.hypot(p.port.x-x,p.port.y-y);if(d<b)b=d;}return b;}
function pickCls(e){const d=havenDist(e.x,e.y),R=regionAt(e.x,e.y),far=R||d>5200||e.lvl>=11,mid=d>2600;const r=Math.random();
 if(far){if(r<0.3)return'iron';if(r<0.65)return'galleon';if(r<0.85)return'frigate';return'';}
 if(mid){if(r<0.04)return'galleon';if(r<0.07)return(S.clvl|0)>=8?'iron':'frigate';if(r<0.47)return'frigate';}return'';}
function applyCls(e,c){if(!c||!CLS[c])return;e.cls=c;e.paint=CLS[c].paint;e.deck=CLS[c].deck;
 if(c==='frigate'){e.maxSpeed=Math.min(232,e.maxSpeed*1.2);e.turnK=1.3;e.maxHp*=1.1;e.aggro=(e.aggro||600)*1.35;e.len*=1.04;e.wid*=0.9;}
 else if(c==='galleon'){e.maxSpeed*=0.76;e.turnK=0.75;e.range*=1.32;e.cannons+=2;e.dmg*=1.15;e.reload*=1.1;e.maxHp*=1.8;e.len*=1.3;e.wid*=1.28;e.gold*=1.5;}
 else if(c==='iron'){e.maxSpeed*=0.86;e.turnK=0.85;e.maxHp*=1.45;e.cannons=Math.max(1,e.cannons-1);e.len*=1.15;e.wid*=1.1;e.gold*=1.6;e.ramCd=rand(2,5);}
 e.maxHp=Math.round(e.maxHp);}
// iron plating: round shot glances off; fire shot & mortar bite. Ironclads also field fewer boarders.
function ironK(e,b){return e.cls!=='iron'?1:(b.am==='fire'||b.mort?1.15:0.45);}
function ironTick(dt){for(const e of enemies){if(e.cls!=='iron'||e.sinking||e.surr)continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);
  if(e.ramT>0){e.ramT-=dt;e.h=e.ramH;const v=360;e.x+=Math.cos(e.ramH)*v*dt;e.y+=Math.sin(e.ramH)*v*dt;if(inAnyIsland(e.x,e.y,20)){e.ramT=0;e.ramCd=6;continue;}
   const tg=[P].concat(fleet.filter(f=>!f.sinking));for(const t of tg){if(Math.hypot(t.x-e.x,t.y-e.y)<(e.len+(t.len||52))*0.48){const dm=(55+7*e.lvl)*(1+0.6*threat());if(t===P){if(!P.dead){damagePlayer(dm,false);P.vx+=Math.cos(e.ramH)*220;P.vy+=Math.sin(e.ramH)*220;cam.shake=Math.max(cam.shake,14);addText(P.x,P.y-50,'💥 RAMMED!','#ff7a5a',true);}}else damageFleet(t,dm*1.2);boom(0.7,160);e.ramT=0;e.ramCd=rand(7,9);break;}}
   if(e.ramT<=0&&!(e.ramCd>0))e.ramCd=6;continue;}
  if(e.ramW>0){e.ramW-=dt;e.speed*=0.9;e.ramH+=clamp(angDiff(Math.atan2(dy,dx),e.ramH),-1,1)*dt*0.25;e.h=e.ramH;if(e.ramW<=0){e.ramT=1.4;}continue;}
  e.ramCd-=dt;if(e.ramCd<=0&&e.angry&&!P.dead&&d<560&&d>90&&Math.abs(angDiff(Math.atan2(dy,dx),e.h))<0.55&&state==="play"&&!(T.on&&T.i<=TIDX.loot)){e.ramW=1.25;e.ramH=e.h;if(!S.tips.ram)showTip('ram');}}}
function clsOverlay(e,ts){if(!e.cls||e.sinking)return;const L=e.len,W=e.wid;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.h);
 if(e.cls==='iron'){ctx.fillStyle='rgba(30,32,35,0.85)';for(let i=0;i<5;i++){const x=-L*0.4+i*L*0.17;ctx.fillRect(x,-W/2-1,L*0.14,3);ctx.fillRect(x,W/2-2,L*0.14,3);}
  ctx.fillStyle='#9aa0a6';for(let i=0;i<8;i++){const x=-L*0.42+i*L*0.11;ctx.fillRect(x,-W/2,1.5,1.5);ctx.fillRect(x,W/2-1.5,1.5,1.5);}
  ctx.fillStyle='#2a2c2f';ctx.beginPath();ctx.moveTo(L/2+18,0);ctx.lineTo(L/2-6,-W*0.2);ctx.lineTo(L/2-6,W*0.2);ctx.closePath();ctx.fill();ctx.strokeStyle='#8d949a';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='rgba(60,62,60,0.35)';ctx.fillRect(-L*0.42,-W*0.9,L*0.75,W*1.8);
  ctx.fillStyle='#3a3e42';ctx.strokeStyle='#15171a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L*0.18,0);ctx.lineTo(L*0.08,-W*0.36);ctx.lineTo(-L*0.3,-W*0.36);ctx.lineTo(-L*0.36,0);ctx.lineTo(-L*0.3,W*0.36);ctx.lineTo(L*0.08,W*0.36);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(150,155,160,0.5)';ctx.lineWidth=1;ctx.beginPath();for(let i=1;i<4;i++){const x=L*0.08-i*L*0.1;ctx.moveTo(x,-W*0.34);ctx.lineTo(x,W*0.34);}ctx.stroke();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-L*0.08,0,W*0.17,0,TAU);ctx.fill();ctx.strokeStyle='#5d4a3a';ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<3;i++){const t=(ts*0.6+i/3)%1;ctx.fillStyle=`rgba(40,38,36,${0.45*(1-t)})`;ctx.beginPath();ctx.arc(-L*0.08-t*L*0.9,Math.sin(ts+i)*4,W*(0.18+0.35*t),0,TAU);ctx.fill();}}
 else if(e.cls==='galleon'){ctx.fillStyle='#3a2210';ctx.beginPath();ctx.moveTo(L*0.46,0);ctx.lineTo(L*0.3,-W*0.3);ctx.lineTo(L*0.24,-W*0.3);ctx.lineTo(L*0.24,W*0.3);ctx.lineTo(L*0.3,W*0.3);ctx.closePath();ctx.fill();ctx.strokeStyle='#c9a25a';ctx.lineWidth=1;ctx.stroke();ctx.strokeStyle='#2a170a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L/2,0);ctx.lineTo(L/2+22,0);ctx.stroke();ctx.fillStyle='#2e1b0c';ctx.fillRect(-L*0.5,-W*0.42,L*0.2,W*0.84);ctx.strokeStyle='#c9a25a';ctx.lineWidth=1;ctx.strokeRect(-L*0.5+1,-W*0.42+1,L*0.2-2,W*0.84-2);ctx.fillStyle='rgba(255,200,110,0.55)';for(let i=-1;i<=1;i++)ctx.fillRect(-L*0.49,i*W*0.22-1.5,2,3);}
 else if(e.cls==='frigate'){ctx.strokeStyle='rgba(20,10,5,0.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(L/2,0);ctx.lineTo(L/2+14,0);ctx.stroke();ctx.fillStyle='#8e1b1b';const w=Math.sin(ts*6)*2;ctx.beginPath();ctx.moveTo(L*0.22,0);ctx.lineTo(L*0.22-16,-2+w);ctx.lineTo(L*0.22-16,2+w);ctx.closePath();ctx.fill();}
 if(e.ramW>0||e.ramT>0){const k=e.ramT>0?1:1-e.ramW/1.25;ctx.fillStyle=`rgba(200,40,30,${0.12+0.3*k})`;ctx.beginPath();ctx.moveTo(L/2,-W*0.5);ctx.lineTo(L/2+430,-W*0.9);ctx.lineTo(L/2+430,W*0.9);ctx.lineTo(L/2,W*0.5);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(255,90,60,${0.4+0.5*k})`;ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();}
function squadTick(){for(const e of enemies){if(e.sqd!==1||e.sinking)continue;e.sqd=2;const n=e.cls==='galleon'?2:1;for(let i=0;i<n;i++){const w=waterNear(e.x,e.y,120,220);const o=makeEnemy(e.kind,w.x,w.y,Math.max(1,e.lvl-1),{clan:e.clan,forceCls:'frigate',sqd:2,home:e.home||{x:e.x,y:e.y}});enemies.push(o);}}}
Object.assign(TIPS,{ram:"⚠️ <b>Ironclad ram!</b> When the red wedge appears ahead of an ironclad, it's about to charge — turn or boost out of the way. Its plating shrugs off round shot: use 🔥 fire shot, 💣 mortar, or board it."});
