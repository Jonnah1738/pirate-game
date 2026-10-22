// ---------- PROGRESSION: captain XP, skills, ranks, trophies ----------
const MAXLVL=30;
function xpNeed(l){return 60+40*l;}
function lvlFromXp(x){let l=1;x=Math.max(0,x||0);while(l<MAXLVL&&x>=xpNeed(l)){x-=xpNeed(l);l++;}return{l,rem:Math.floor(x),need:xpNeed(l)};}
function sk(k){return(S.sk&&S.sk[k])|0;}
function grantXP(n,x,y){n=Math.round(n);if(!(n>0))return;S.xp=(S.xp||0)+n;if(x!=null)addText(x,y-62,'+'+n+' XP','#d6b8ff');
 const L=lvlFromXp(S.xp).l;while((S.clvl||1)<L){S.clvl=(S.clvl||1)+1;S.sp=(S.sp||0)+1;
  addText(P.x,P.y-90,'🎖️ LEVEL UP!','#ffd34d',true);for(let k=0;k<18;k++){const a=k/18*TAU;addPart('fire',P.x,P.y,Math.cos(a)*110,Math.sin(a)*110,0.8,7,null);}
  toast(`🎖️ Captain level ${S.clvl}! +1 skill point — spend it in ☰ ➜ 🎖️ Skills`);chime();}}
const SKILLS={
 gun:{name:'Gunnery',icon:'💥',p:[['Steady Hands','+8% cannon damage'],['Quick Crews','−8% reload time'],['Long Nines','+12% cannon range'],['Double Shot','+1 gun per side']]},
 sea:{name:'Seamanship',icon:'🧭',p:[['Trim the Sails','+5% top speed'],['Hard Over','+10% turning'],['Second Wind','Boost recharges 20% faster'],["Ship's Surgeon",'Hull repairs +1 HP/s at sea']]},
 plun:{name:'Plunder',icon:'💰',p:[['Sharp Eyes','+12% gold from sinking & plundering'],['Fearsome Flag','Merchants surrender at 40% hull (not 30%)'],['Fence','+10% cargo sell prices'],['Treasure Nose','+20% job rewards']]},
 cmd:{name:'Command',icon:'⚓',p:[['Drill','Fleet ships deal +15% damage'],['Loyal Crews','Fleet wages −25%'],['Low Profile','Wanted level fades 50% faster'],['Admiral','Fleet ships take 20% less damage and heal to 80% when calm']]}};
function learn(k){const l=sk(k);if(!SKILLS[k]||l>=4||(S.sp|0)<1)return;S.sp--;S.sk[k]=l+1;const old=ST.maxHp;recalc();if(ST.maxHp>old)P.hp+=ST.maxHp-old;chime();toast(`${SKILLS[k].icon} Learned ${SKILLS[k].p[l][0]}!`);save();}
function rankIdx(){let i=0;RANKS.forEach(([t],k)=>{if(S.infamy>=t)i=k;});return i;}
const RANK_UNLOCK={Swabbie:'Treasure-map, smuggling & shark-hunt jobs',Buccaneer:'🚢 Brig hulls, convoy raids & blockade runs',Captain:'Hold 4 jobs at once','Sea Wolf':'⚔️ Frigate hulls & Megalodon hunts',Commodore:'👑 Galleon hulls','Pirate Lord':'Golden sails & +10% job pay','Pirate King':'A crown over your flagship 👑'};
function maxJobs(){return rankIdx()>=3?4:3;}
const ACH=[
 ['first','⚔️','First Blood','Sink your first ship',()=>S.kills>=1],
 ['sink50','☠️','Scourge of the Seas','Sink 50 ships',()=>S.kills>=50],
 ['raid10','💰','Raider','Plunder, seize or sink 10 merchants',()=>(S.raids|0)>=10],
 ['shark10','🦈','Shark Bait','Kill 10 sharks',()=>(S.sharks|0)>=10],
 ['mega','🦷','Megalodon Slayer','Slay a Megalodon',()=>(S.megas|0)>=1],
 ['fleet3','⛵','Flotilla','Sail with 3 fleet ships',()=>S.fleet.length>=3],
 ['dig','🗝️','X Marks the Spot','Dig up a buried treasure',()=>(S.st.dig|0)>=1],
 ['rescue10','🆘','Lifeline','Rescue 10 castaways',()=>(S.st.resc|0)>=10],
 ['smug3','🍾','Smuggler','Finish 3 smuggling runs',()=>(S.st.smug|0)>=3],
 ['race','🚩','Regatta Champion','Win a regatta',()=>(S.st.race|0)>=1],
 ['convoy','📦','Convoy Breaker','Raid a convoy',()=>(S.st.convoy|0)>=1],
 ['block','🧨','Blockade Runner','Run a blockade',()=>(S.st.block|0)>=1],
 ['jobs10','📜','Reliable','Finish 10 jobs',()=>(S.st.jobs|0)>=10],
 ['wanted5','🚨','Most Wanted','Reach ★★★★★',()=>stars()>=5],
 ['rich','💎','Treasure Hoard','Hold 5,000 gold at once',()=>S.gold>=5000],
 ['frigate','🛳️',"Man-o'-War",'Captain a Frigate or Galleon',()=>HORD.indexOf(S.ship)>=2],
 ['lvl10','🎖️','Veteran','Reach captain level 10',()=>(S.clvl|0)>=10],
 ['lord','👑','Pirate Lord','Reach the rank of Pirate Lord',()=>S.infamy>=6000]];
let achSilent=false,progT=0;
function progTick(){
 for(const [id,ic,name,,cond] of ACH){if(S.ach[id])continue;let ok=false;try{ok=cond();}catch(e){}if(ok){S.ach[id]=Date.now();if(!achSilent){toast(`🏆 Trophy unlocked: ${ic} ${name}! (+50 XP)`);grantXP(50);chime();}}}
 achSilent=false;
 const r=rankOf(S.infamy);if(!S.lastRank)S.lastRank=r;else if(r!==S.lastRank){S.lastRank=r;const u=RANK_UNLOCK[r];toast(`🏴‍☠️ New rank: ${r}!`+(u?` Unlocked: ${u}`:''));chime();}
 if(S.retro&&state==='play'&&!T.on){toast(`🎖️ Your past deeds made you a level ${S.retro} captain — ${S.retro-1} skill point${S.retro>2?'s':''} to spend (☰ ➜ 🎖️ Skills)!`);S.retro=0;}
 const b=$('menuBtn');const n=S.sp|0;const can=n>0&&Object.keys(SKILLS).some(k=>sk(k)<4);if(hudCache.sp!==(can?n:0)){hudCache.sp=can?n:0;b.classList.toggle('sp',can);b.dataset.sp=n;}}
function skillsHTML(){const X=lvlFromXp(S.xp||0);
 let h=`<div class="note">🎖️ <b>Captain level ${S.clvl}</b> — ${X.rem}/${X.need} XP to the next level<div class="xpb"><i style="width:${Math.round(X.rem/X.need*100)}%"></i></div>Skill points: <b>${S.sp|0}</b>. Earn XP by sinking ships, raiding merchants, hunting sharks, finishing jobs and winning trophies. Each level gives 1 skill point.</div>`;
 for(const k in SKILLS){const d=SKILLS[k],l=sk(k);h+=`<h3>${d.icon} ${d.name} ${pips(l,4)}</h3>`;
  d.p.forEach((pp,i)=>{const own=i<l,next=i===l;h+=row(`${own?'✅':next?'⬜':'🔒'} ${pp[0]}`,pp[1]+(next||own?'':' (learn the one above first)'),own?'':btn('learn',next?'Learn (1 SP)':'Locked',next&&(S.sp|0)>0,k));});}
 return h;}
function trophiesHTML(){const got=ACH.filter(a=>S.ach[a[0]]).length;
 let h=`<div class="note">🏆 <b>${got}/${ACH.length}</b> trophies. Each one is worth +50 XP.</div>`;
 for(const [id,ic,name,desc] of ACH){const ok=!!S.ach[id];h+=`<div class="item${ok?'':' lock'}"><div class="it"><b>${ok?ic:'🔒'} ${name}</b><small>${desc}${ok?' — ✅ done':''}</small></div></div>`;}
 h+=`<h3>🏴‍☠️ Pirate ranks (infamy)</h3>`;const ri=rankIdx();
 RANKS.forEach(([t,n],i)=>{h+=row(`${i<=ri?'✅':'🔒'} ${n}${i===ri?' ⬅ you':''}`,`${t} infamy${RANK_UNLOCK[n]?' • Unlocks: '+RANK_UNLOCK[n]:''}`,'');});
 h+=`<div class="note">Lifetime: ☠️ ${S.kills} sunk • 💰 ${S.raids|0} merchants raided • 🦈 ${S.sharks|0} sharks • 📜 ${S.st.jobs|0} jobs • 🗝️ ${S.st.dig|0} treasures • 🆘 ${S.st.resc|0} rescued</div>`;
 return h;}

// ---------- MISSIONS (extra job types) ----------
const ISLE_NAMES=['Gull Rock','Bone Key','Parrot Cay','Rum Isle','Coral Tooth','Lantern Key','Widow\'s Cay','Turtle Back','Cutlass Key','Pelican Isle','Ghost Cay','Mermaid Rock','Cannon Key','Sable Isle'];
const ZONE_NAMES=['Bloody Shoals','Jaws Reef','Red Water','Dead Man\'s Deep','Grey Fin Bank'];
const QTYPES=[['bounty',0,3],['hunt',0,3],['deliver',0,3],['rescue',0,3],['race',0,2],['treasure',1,3],['smuggle',1,3],['shark',1,2],['convoy',2,3],['blockade',2,2]];
const qScale=(dist,L)=>(1+dist/2500)*(1+0.15*L);
function segClear(a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/60);for(let i=1;i<n;i++){const t=i/n;if(inAnyIsland(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,45))return false;}return true;}
function treasureSpot(pi){const p=PORTS[pi].port;const isl=ISL.filter(o=>!o.isPort);
 for(let t=0;t<40;t++){const k=(Math.random()*isl.length)|0,o=isl[k];const dd=Math.hypot(o.x-p.x,o.y-p.y);if(dd<900||dd>3400)continue;
  const a=Math.random()*TAU;let d=o.r*0.6;while(d<o.r*3&&inAnyIsland(o.x+Math.cos(a)*d,o.y+Math.sin(a)*d,28))d+=15;
  const x=o.x+Math.cos(a)*(d+10),y=o.y+Math.sin(a)*(d+10);if(x<250||y<250||x>WORLD-250||y>WORLD-250)continue;if(PORTS.some(q=>Math.hypot(q.port.x-x,q.port.y-y)<600))continue;
  return{x,y,isle:ISLE_NAMES[ISL.indexOf(o)%ISLE_NAMES.length]};}return null;}
function makeTreasureQ(pi,free){const sp=treasureSpot(pi);if(!sp)return null;const p=PORTS[pi].port;const lvl=lvlAt(sp.x,sp.y);const dist=Math.hypot(sp.x-p.x,sp.y-p.y);
 return{id:S.qid++,from:pi,type:'treasure',x:sp.x,y:sp.y,lvl,cost:free?0:30+12*lvl,guard:lvl>=3,reward:Math.round((140+85*lvl)*(1+dist/4000)),
  title:`Treasure map: ${sp.isle} (Lv${lvl})`,text:`${free?'A map piece you found. ':''}Sail to the ❌ off ${sp.isle} and tap ⛏ Dig.${lvl>=3?' Pirates guard the spot!':''}`};}
function genQuest(pi,avoid){const ri=rankIdx();let pool=QTYPES.filter(t=>ri>=t[1]&&!(avoid&&avoid.includes(t[0])));if(!pool.length)pool=QTYPES.filter(t=>ri>=t[1]);
 let tot=0;for(const t of pool)tot+=t[2];let r=Math.random()*tot,type=pool[0][0];for(const t of pool){r-=t[2];if(r<=0){type=t[0];break;}}
 let q=null;try{q=genQ(type,pi);}catch(e){console.warn(e);q=null;}
 if(!q){for(let i=0;i<20;i++){q=genQuestOld(pi);if(!avoid||!avoid.includes(q.type))break;}}return q;}
function genQ(type,pi){const p=PORTS[pi],pp=p.port;const L=lvlAt(pp.x,pp.y);
 if(type==='bounty'||type==='hunt'||type==='deliver'){for(let i=0;i<30;i++){const q=genQuestOld(pi);if(q.type===type)return q;S.qid--;}return null;}
 const id=S.qid++;
 if(type==='smuggle'){const law=PORTS.map((x,i)=>i).filter(i=>!PORTS[i].haven&&i!==pi);if(!law.length)return null;const to=pick(law),tp=PORTS[to].port;
  const crates=2+((Math.random()*4)|0),dist=Math.hypot(tp.x-pp.x,tp.y-pp.y),Ld=lvlAt(tp.x,tp.y);
  return{id,from:pi,type,to,crates,reward:Math.round((90+dist/1000*80)*(1+crates/4)*(1+0.15*Ld)),title:`Smuggle ${crates} crates of contraband to ${PORTS[to].name}`,
   text:`⚖️ Lawful port: if you're Wanted ★ when you dock at any lawful port, customs may search your hold (more ★ = more searches). Takes ${crates} cargo space.`};}
 if(type==='treasure'){S.qid--;return makeTreasureQ(pi,false);}
 if(type==='rescue'){const pt=randomWater(pp.x,pp.y,900,2200);if(!pt)return null;const lvl=lvlAt(pt.x,pt.y),n=3+((Math.random()*3)|0),dist=Math.hypot(pt.x-pp.x,pt.y-pp.y);
  return{id,from:pi,type,x:pt.x,y:pt.y,lvl,need:n,got:0,stage:1,reward:Math.round((70+40*lvl)*(1+dist/2500)+n*12),title:`Rescue ${n} castaways from the wreck of the ${pick(FNAMES)}`,
   text:`Sail over the 🆘 survivors near the wreck, then bring them back here to ${p.name}. Some may join your crew. ${lvl>=3?'Sharks are circling!':''}`};}
 if(type==='convoy'){for(let t=0;t<20;t++){const a=PORTS[(Math.random()*PORTS.length)|0],b=PORTS[(Math.random()*PORTS.length)|0];if(a===b||b.haven)continue;
   const f=rand(0.25,0.45),x=a.port.x+(b.port.x-a.port.x)*f,y=a.port.y+(b.port.y-a.port.y)*f;if(inAnyIsland(x,y,120)||PORTS.some(o=>Math.hypot(o.port.x-x,o.port.y-y)<600))continue;
   const lvl=clamp(lvlAt(x,y)+1,2,10),g=lvl>=5?2:1,dist=Math.hypot(x-pp.x,y-pp.y);
   return{id,from:pi,type,x,y,to:PORTS.indexOf(b),lvl,guards:g,need:2,have:0,reward:Math.round((240+110*lvl)*(1+dist/5000)),title:`Raid the convoy bound for ${b.name} (Lv${lvl})`,
    text:`3 merchant ships with ${g} Navy escort${g>1?'s':''}. Plunder, seize or sink 2 of them. Raiding raises your Wanted level!`};}return null;}
 if(type==='shark'){if(rankIdx()>=4&&Math.random()<0.45){const zi=(Math.random()*SHARKZ.length)|0,z=SHARKZ[zi];const dist=Math.hypot(z.x-pp.x,z.y-pp.y);
   return{id,from:pi,type,mega:true,zi,need:1,have:0,reward:Math.round(800*(1+dist/8000)),title:`Slay the Megalodon of ${ZONE_NAMES[zi%5]}`,text:`A monster shark haunts the 🦈 ${ZONE_NAMES[zi%5]}. Sail there and kill it. Bring a strong hull!`};}
  const need=4+((Math.random()*3)|0);return{id,from:pi,type,need,have:0,reward:need*(45+8*L)+60,title:`Shark hunt: kill ${need} sharks`,text:`Sharks lurk in Lv3+ waters and the red 🦈 zones on your map (the arrow points to the nearest zone). Harmless pups near Port Royal don't count.`};}
 if(type==='race'){for(let t=0;t<25;t++){const n=4;const pts=[];let prev=pp,ok=true,len=0;
   for(let i=0;i<n;i++){const c=randomWater(prev.x,prev.y,i?420:520,i?650:800);if(!c||!segClear(prev,c)){ok=false;break;}len+=Math.hypot(c.x-prev.x,c.y-prev.y);pts.push({x:Math.round(c.x),y:Math.round(c.y)});prev=c;}
   if(!ok)continue;const tl=Math.ceil((len/((ST.maxSpeed||135)*0.78)+14)/5)*5;
   return{id,from:pi,type,pts,i:0,tl,t:tl,started:false,reward:Math.round((70+len/1000*75)*(1+0.1*L)),title:`Regatta: sail through ${n} buoys in ${tl}s`,text:`The clock starts when you set sail. Follow the 🚩 flags in order. 🚀 Boost helps!`};}return null;}
 if(type==='blockade'){const law=PORTS.map((x,i)=>i).filter(i=>!PORTS[i].haven&&i!==pi);if(!law.length)return null;law.sort((a,b)=>Math.hypot(PORTS[b].port.x-pp.x,PORTS[b].port.y-pp.y)-Math.hypot(PORTS[a].port.x-pp.x,PORTS[a].port.y-pp.y));
  const to=Math.random()<0.6?law[law.length-1]:pick(law),tp=PORTS[to].port,dist=Math.hypot(tp.x-pp.x,tp.y-pp.y),lvl=clamp(lvlAt(tp.x,tp.y)+1,2,10),crates=3;
  const tl=Math.ceil((dist/((ST.maxSpeed||135)*0.72)+45)/5)*5;
  return{id,from:pi,type,to,crates,lvl,guards:lvl>=5?3:2,tl,t:tl,started:false,reward:Math.round(180+dist/1000*110+lvl*35),title:`Run the blockade: powder to ${PORTS[to].name} in ${tl}s`,
   text:`${crates} crates of gunpowder for the rebels. Navy ships blockade ${PORTS[to].name} and will open fire on sight. Dock before the clock runs out.`};}
 return null;}
function qProg(q){switch(q.type){case 'bounty':return`${q.have}/${q.need}`;case 'convoy':return`${q.have}/${q.need} ships`;case 'shark':return`${q.have}/${q.need}`;
 case 'rescue':return q.stage===1?`${q.got}/${q.need} rescued`:`return to ${PORTS[q.from].name}`;case 'race':return q.started?`🚩 ${q.i}/${q.pts.length} • ⏱ ${Math.max(0,Math.ceil(q.t))}s`:`⏱ ${q.tl}s once you sail`;
 case 'blockade':return q.started?`⏱ ${Math.max(0,Math.ceil(q.t))}s left`:`⏱ ${q.tl}s once you sail`;case 'treasure':return digQ===q?'digging…':'dig at the ❌';default:return'';}}
const QICON={bounty:'⚔️',hunt:'☠️',deliver:'📦',smuggle:'🍾',treasure:'❌',rescue:'🆘',convoy:'💰',shark:'🦈',race:'🚩',blockade:'🧨'};
function nearestZone(){let b=SHARKZ[0],bd=1e18;for(const z of SHARKZ){const d=Math.hypot(z.x-P.x,z.y-P.y);if(d<bd){bd=d;b=z;}}return b;}
function qTarget(q){const port=i=>PORTS[i].port;
 switch(q.type){case 'hunt':return{x:q.x,y:q.y,icon:'☠️',c:'#ff5050'};case 'deliver':return{...port(q.to),icon:'📦',c:'#ffd24a'};
  case 'smuggle':return{...port(q.to),icon:'🍾',c:'#c58cff'};case 'blockade':return{...port(q.to),icon:'🧨',c:'#ff8a3d'};
  case 'treasure':return{x:q.x,y:q.y,icon:'❌',c:'#ff3b3b'};case 'rescue':return q.stage===1?{x:q.x,y:q.y,icon:'🆘',c:'#ffffff'}:{...port(q.from),icon:'⚓',c:'#7fd3ff'};
  case 'convoy':return{x:q.x,y:q.y,icon:'💰',c:'#8fd0ff'};case 'race':{const p=q.pts[Math.min(q.i,q.pts.length-1)];return{x:p.x,y:p.y,icon:'🚩',c:'#ffd34d'};}
  case 'shark':{const z=q.mega?SHARKZ[q.zi]||SHARKZ[0]:nearestZone();return{x:z.x,y:z.y,icon:'🦈',c:'#ff6b6b'};}}return null;}
function failQuest(q,msg){if(!S.quests.includes(q))return;S.quests=S.quests.filter(x=>x!==q);questCleanup(q.id);if(digQ===q)digQ=null;toast(msg);save();}
function questCleanup(id){for(const e of enemies){if(e.mq==id||e.cid==id||e.guard==id){e.keep=false;e.mq=0;}}for(const s of sharks)if(s.mq==id)s.mq=0;for(let i=cways.length-1;i>=0;i--)if(cways[i].q==id)cways.splice(i,1);}
function statFor(q){const st=S.st;if(q.type==='smuggle')st.smug++;else if(q.type==='race')st.race++;else if(q.type==='convoy')st.convoy++;else if(q.type==='blockade')st.block++;}
function dockQuests(pi){const p=PORTS[pi];
 const contra=S.quests.filter(q=>q.type==='smuggle');const n=stars();
 if(contra.length&&!p.haven&&n>=1&&Math.random()<Math.min(0.85,0.22*n)){const fine=Math.min(S.gold,40+30*n);S.gold-=fine;for(const q of contra){S.quests=S.quests.filter(x=>x!==q);questCleanup(q.id);}addHeat(1);
  setTimeout(()=>toast(`🔍 Customs searched your hold! Contraband seized and you were fined ${fine}💰.`),80);}
 for(const q of S.quests.slice()){if((q.type==='deliver'||q.type==='smuggle')&&q.to===pi)completeQuest(q);
  else if(q.type==='blockade'&&q.to===pi&&q.t>0)completeQuest(q);
  else if(q.type==='rescue'&&q.stage===2&&q.from===pi){const room=Math.max(0,ST.maxCrew-S.crew),j=Math.min(room,q.need>=4?2:1);S.crew+=j;recalc();S.st.resc+=q.need;completeQuest(q);if(j)setTimeout(()=>toast(`👥 ${j} grateful castaway${j>1?'s':''} joined your crew!`),2700);}}}
// runtime mission objects (rebuilt after load)
const cways=[];let actQ=null,digQ=null,digT=0,missT=0;
function startDig(){if(actQ&&!digQ&&state==='play'){digQ=actQ;digT=0;toast('⛏ Digging… stay close!');}}
function finishDig(q){digQ=null;S.st.dig++;const gems=1+Math.floor(q.lvl/3),free=Math.max(0,ST.cargoCap-cargoUsed()),g=Math.min(free,gems);S.cargo.gems+=g;
 addText(q.x,q.y-40,`🗝️ TREASURE! ${g?'+'+g+'💎':''}`,'#ffe066',true);for(let k=0;k<20;k++)addPart('fire',q.x+rand(-20,20),q.y+rand(-20,20),rand(-70,70),rand(-90,10),rand(0.5,1),rand(5,9),null);completeQuest(q);}
function spawnGuarded(kind,x,y,lvl,extra){const e=makeEnemy(kind,x,y,lvl,extra);enemies.push(e);return e;}
function waterNear(x,y,dmin,dmax){for(let i=0;i<20;i++){const a=Math.random()*TAU,d=rand(dmin,dmax),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(!inAnyIsland(px,py,60)&&px>150&&py>150&&px<WORLD-150&&py<WORLD-150)return{x:px,y:py};}return{x,y};}
function missionTick(dt){
 // timers
 for(const q of S.quests.slice()){if(q.type==='race'||q.type==='blockade'){if(!q.started){q.started=true;toast(q.type==='race'?`🚩 Regatta started! ⏱ ${q.tl}s — follow the flags!`:`🧨 Blockade run started! ⏱ ${q.tl}s to reach ${PORTS[q.to].name}.`);}
   q.t-=dt;if(q.t<=0){failQuest(q,q.type==='race'?'⏱ Time\'s up — you lost the regatta.':'⏱ Too late! The rebels gave up on your powder (job failed).');if(q.type==='blockade')continue;}}
  if(q.type==='race'&&S.quests.includes(q)){const p=q.pts[q.i];if(p&&Math.hypot(p.x-P.x,p.y-P.y)<80){q.i++;chime();addText(P.x,P.y-60,`🚩 ${q.i}/${q.pts.length}`,'#ffd34d',true);if(q.i>=q.pts.length){addText(P.x,P.y-90,'🏆 Regatta won!','#ffe066',true);completeQuest(q);}}}
  if(q.type==='rescue'&&q.stage===1){for(let i=cways.length-1;i>=0;i--){const c=cways[i];if(c.q!==q.id)continue;if(Math.hypot(c.x-P.x,c.y-P.y)<55){cways.splice(i,1);q.got++;addText(P.x,P.y-50,`🆘 +1 rescued (${q.got}/${q.need})`,'#ffffff',true);chime();
     if(q.got>=q.need){q.stage=2;toast(`🆘 All ${q.need} castaways aboard! Bring them back to ${PORTS[q.from].name}.`);}}}}}
 // digging
 actQ=null;if(state==='play'&&!P.dead){let bd=130;for(const q of S.quests)if(q.type==='treasure'){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;actQ=q;}}}
 if(digQ){if(!S.quests.includes(digQ)||Math.hypot(digQ.x-P.x,digQ.y-P.y)>160){digQ=null;toast('⛏ Digging stopped — stay near the ❌.');}else{digT+=dt;if(digT>=2.2)finishDig(digQ);}}
 missT-=dt;if(missT>0)return;missT=1;
 for(const q of S.quests){
  if(q.type==='treasure'&&q.guard&&!q.spawned&&Math.hypot(q.x-P.x,q.y-P.y)<1400){q.spawned=true;const n=q.lvl>=6?2:1;for(let i=0;i<n;i++){const w=waterNear(q.x,q.y,150,300);spawnGuarded('pirate',w.x,w.y,q.lvl,{home:{x:q.x,y:q.y},mq:q.id});}}
  else if(q.type==='rescue'&&q.stage===1&&!q.spawned&&Math.hypot(q.x-P.x,q.y-P.y)<1500){q.spawned=true;for(let i=0;i<q.need-q.got;i++){const w=waterNear(q.x,q.y,60,170);cways.push({q:q.id,x:w.x,y:w.y,ph:rand(0,TAU)});}
   if(q.lvl>=3)for(let i=0;i<2;i++){const w=waterNear(q.x,q.y,200,320);sharks.push(makeShark(w.x,w.y,q.lvl));}}
  else if(q.type==='convoy'){
   if(!q.spawned&&Math.hypot(q.x-P.x,q.y-P.y)<1700){q.spawned=true;const to=PORTS[q.to].port,h=Math.atan2(to.y-q.y,to.x-q.x);
    for(let i=0;i<3;i++){const ox=Math.cos(h)*(i-1)*-110+Math.cos(h+Math.PI/2)*(i===1?0:70),oy=Math.sin(h)*(i-1)*-110+Math.sin(h+Math.PI/2)*(i===1?0:70);
     const e=makeEnemy('merchant',q.x+ox,q.y+oy,q.lvl,{wp:{x:to.x,y:to.y},cid:q.id,keep:true});e.maxSpeed*=0.8;e.h=h;e.gold=Math.round(e.gold*1.3);enemies.push(e);}
    for(let i=0;i<q.guards;i++){const w=waterNear(q.x,q.y,140,220);const g=makeEnemy('navy',w.x,w.y,q.lvl,{guard:q.id,keep:true,angry:false});g.h=h;enemies.push(g);}
    toast('💰 Convoy sighted! Merchants with a Navy escort.');}
   if(q.spawned){const live=enemies.filter(e=>e.cid===q.id&&!e.sinking&&!e.cdone);if(live.length+q.have<q.need){failQuest(q,'💨 The convoy escaped — job failed.');continue;}
    if(live.length){let cx=0,cy=0;for(const e of live){cx+=e.x;cy+=e.y;}q.x=cx/live.length;q.y=cy/live.length;
     for(const g of enemies)if(g.guard===q.id&&!g.gAng&&!g.sinking){g.home={x:q.x,y:q.y};g.wp=waterNear(q.x,q.y,60,140);g.wpT=3;}}}}
  else if(q.type==='blockade'&&!q.spawned){const tp=PORTS[q.to].port;if(Math.hypot(tp.x-P.x,tp.y-P.y)<1900){q.spawned=true;const a0=Math.atan2(P.y-tp.y,P.x-tp.x);
    for(let i=0;i<q.guards;i++){const a=a0+(i-(q.guards-1)/2)*0.55;let x=tp.x+Math.cos(a)*620,y=tp.y+Math.sin(a)*620;if(inAnyIsland(x,y,60)){const w=waterNear(x,y,50,250);x=w.x;y=w.y;}
     const g=makeEnemy('navy',x,y,q.lvl,{gAng:true,keep:true,mq:q.id,home:{x,y}});g.aggro=750;enemies.push(g);}toast(`🧨 Navy blockade ahead at ${PORTS[q.to].name}! Run it!`);}}
  else if(q.type==='shark'&&q.mega){const z=SHARKZ[q.zi];if(z&&Math.hypot(z.x-P.x,z.y-P.y)<1300&&!sharks.some(s=>s.mega&&!s.sinking)){const w=waterNear(z.x,z.y,0,150);const m=makeShark(w.x,w.y,9,true);m.mq=q.id;sharks.push(m);toast('🦈 The Megalodon rises from the deep!');}}}}
function convoyHit(e){if(!e.cid||e.cdone)return;e.cdone=true;const q=S.quests.find(x=>x.id===e.cid&&x.type==='convoy');if(!q)return;q.have++;addText(e.x,e.y-60,`💰 Convoy ${q.have}/${q.need}`,'#8fd0ff',true);if(q.have>=q.need)completeQuest(q);}
function convoyAlarm(e){if(!e.cid)return;for(const g of enemies)if(g.guard===e.cid&&!g.gAng){g.gAng=true;g.angry=true;}}
function sharkKillQuest(s){for(const q of S.quests.slice())if(q.type==='shark'&&(q.mega?s.mega:!s.harmless)){q.have++;if(q.have>=q.need)completeQuest(q);}}
function drawMissions(x0,x1,y0,y1,ts){const vis=(x,y,m)=>x>x0-m&&x<x1+m&&y>y0-m&&y<y1+m;
 for(const q of S.quests){
  if(q.type==='treasure'&&vis(q.x,q.y,140)){const pu=0.5+0.5*Math.sin(ts*3);ctx.strokeStyle=`rgba(255,230,120,${0.35+0.3*pu})`;ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(q.x,q.y,120,0,TAU);ctx.stroke();ctx.setLineDash([]);
   ctx.strokeStyle='#d8261c';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(q.x-18,q.y-18);ctx.lineTo(q.x+18,q.y+18);ctx.moveTo(q.x+18,q.y-18);ctx.lineTo(q.x-18,q.y+18);ctx.stroke();ctx.lineCap='butt';
   if(digQ===q){ctx.fillStyle='#c9a86a';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(q.x+rand(-14,14),q.y+rand(-14,14),rand(3,6),0,TAU);ctx.fill();}}}
  else if(q.type==='rescue'&&q.stage===1&&vis(q.x,q.y,200)){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(0.5);ctx.fillStyle='#5a3a1c';ctx.fillRect(-34,-9,44,18);ctx.fillStyle='#43290f';ctx.fillRect(16,-7,20,14);
   ctx.strokeStyle='#3a2410';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-40,-34);ctx.stroke();ctx.fillStyle='rgba(240,230,210,0.8)';ctx.beginPath();ctx.moveTo(-40,-34);ctx.lineTo(-22,-26);ctx.lineTo(-30,-14);ctx.closePath();ctx.fill();ctx.restore();}
  else if(q.type==='race'){q.pts.forEach((p,i)=>{if(i<q.i||!vis(p.x,p.y,100))return;const cur=i===q.i;ctx.strokeStyle=cur?`rgba(255,211,77,${0.6+0.4*Math.sin(ts*5)})`:'rgba(255,255,255,0.35)';ctx.lineWidth=cur?5:3;ctx.beginPath();ctx.arc(p.x,p.y,cur?80:50,0,TAU);ctx.stroke();
   ctx.fillStyle='#c0392b';ctx.beginPath();ctx.arc(p.x,p.y,9,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-36);ctx.stroke();ctx.fillStyle=cur?'#ffd34d':'#ddd';ctx.beginPath();ctx.moveTo(p.x,p.y-36);ctx.lineTo(p.x+20,p.y-30);ctx.lineTo(p.x,p.y-24);ctx.closePath();ctx.fill();
   ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText(String(i+1),p.x-12,p.y-30);});}}
 for(const c of cways){if(!vis(c.x,c.y,40))continue;const b=Math.sin(ts*3+c.ph)*2;ctx.strokeStyle='#ff5a3c';ctx.lineWidth=5;ctx.beginPath();ctx.arc(c.x,c.y+b,11,0,TAU);ctx.stroke();
  ctx.fillStyle='#f1c27d';ctx.beginPath();ctx.arc(c.x,c.y+b-2,6,0,TAU);ctx.fill();ctx.strokeStyle='#f1c27d';ctx.lineWidth=3;const w=Math.sin(ts*8+c.ph)*6;ctx.beginPath();ctx.moveTo(c.x+4,c.y+b-2);ctx.lineTo(c.x+12+w*0.3,c.y+b-16-Math.abs(w));ctx.stroke();
  ctx.font='16px serif';ctx.fillText('🆘',c.x,c.y+b-28);}}
// HUD mission tracker
function trackHUD(){const el=$('mTrack');const show=state==='play'&&S.quests.length>0&&!T.on;if(hudCache.mt!==show){hudCache.mt=show;el.classList.toggle('hidden',!show);}if(!show)return;
 let q=S.quests.find(x=>x.id===S.track);if(!q){q=S.quests[0];S.track=q.id;}const t=qTarget(q);const pr=qProg(q);
 setTxt('mtTitle',(QICON[q.type]||'📜')+' '+q.title);let line=pr;if(t){const d=Math.hypot(t.x-P.x,t.y-P.y);line=(pr?pr+' • ':'')+Math.round(d/10)*10+'m';}
 setTxt('mtSub',line+(S.quests.length>1?`  (${S.quests.indexOf(q)+1}/${S.quests.length} ▸)`:''));const a=$('mtArrow');
 if(t){const ang=Math.round(Math.atan2(t.y-P.y,t.x-P.x)*180/Math.PI/5)*5;if(hudCache.mta!==ang){hudCache.mta=ang;a.style.transform=`rotate(${ang}deg)`;}a.style.visibility='visible';}else a.style.visibility='hidden';
 const timed=(q.type==='race'||q.type==='blockade')&&q.started&&q.t<20;el.classList.toggle('hot',!!timed);}
// hull classes shop (Ship tab)
function hullShopHTML(p){const cur=HULLS[S.ship]||HULLS.sloop,ti=Math.round(cur.cost*0.4);let h=`<h3>🏗️ Shipwright — new hulls</h3>`;
 h+=`<div class="note">Your ship: <b>${cur.icon} ${cur.name}</b>. A bigger hull keeps all your upgrades, officers and crew. ${p.haven?`Trade-in for your ${cur.name}: <b>${ti} 💰</b>.`:'Only 🏴‍☠️ pirate havens sell hulls.'}</div>`;
 for(const k of HORD){if(HORD.indexOf(k)<=HORD.indexOf(S.ship))continue;const c=HULLS[k],price=Math.max(0,c.cost-ti),ok=S.infamy>=c.rank;
  h+=row(`${c.icon} ${c.name}`,`${c.desc}<br>HP ×${c.hp} • +${c.guns} gun${c.guns>1?'s':''}/side • +${c.cargo} hold • +${c.crew} crew space • speed ×${c.spd} • turning ×${c.turn}${c.dmg>1?` • dmg ×${c.dmg}`:''}${ok?'':`<br>🔒 Requires rank <b>${rankOf(c.rank)}</b> (${c.rank} infamy)`}`,
   btn('hull',ok?`${price}💰`:'🔒 Locked',ok&&p.haven&&S.gold>=price,k));}
 if(S.ship==='galleon')h+=`<div class="note">👑 You command the mightiest hull on the sea.</div>`;return h;}
function buyHull(k){const p=PORTS[curPort],c=HULLS[k],cur=HULLS[S.ship]||HULLS.sloop;if(!c||!p||!p.haven||HORD.indexOf(k)<=HORD.indexOf(S.ship)||S.infamy<c.rank)return;const price=Math.max(0,c.cost-Math.round(cur.cost*0.4));if(S.gold<price)return;
 S.gold-=price;S.ship=k;recalc();P.hp=ST.maxHp;chime();toast(`${c.icon} Your new ${c.name} is ready, Captain! (${ST.cannons} guns per side, ${ST.maxHp} HP)`);
 if(S.crew<ST.crewNeed)setTimeout(()=>toast(`👥 Your ${c.name} needs ${ST.crewNeed} crew for full efficiency — hire more in the Crew tab.`),2700);}
// keep world labels from hiding under the on-screen buttons
let ctrlR=[],ctrlT=0;
function updCtrlRects(){ctrlR=[];for(const id of ['fireL','fireR','autoBtn','boostBtn','boardBar','dockBtn','actBtn','turnL','turnR','sailUp','sailDn','menuBtn']){const el=$(id);if(!el||el.classList.contains('hidden'))continue;const r=el.getBoundingClientRect();if(r.width)ctrlR.push(r);}}
function avoidY(X,Y){for(let k=0;k<2;k++){let moved=false;for(const r of ctrlR){if(X>r.left-50&&X<r.right+50&&Y>r.top-12&&Y<r.bottom+8){Y=r.top-16;moved=true;}}if(!moved)break;}return Y;}
