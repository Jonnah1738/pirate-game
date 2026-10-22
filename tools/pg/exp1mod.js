// ---------- PIRATE REPUBLIC WARS (expansion) ----------
const CLANS=[
 {name:'Crimson Brotherhood',short:'Crimson',col:'#e0413a',lc:'#ffb3a8',sail:'#8e2420',icon:'🩸',leader:'Captain Scarlet Vane',ship:'Bloodmoon'},
 {name:'Black Tide Syndicate',short:'Black Tide',col:'#9b59b6',lc:'#e2c2f0',sail:'#2e2238',icon:'🌑',leader:'Mordecai Black',ship:'Nightfall'},
 {name:'Iron Gull Confederacy',short:'Iron Gull',col:'#1abc9c',lc:'#b5f5e6',sail:'#c9ddd8',icon:'⚙️',leader:'Admiral Gullet Hale',ship:'Ironclad Gull'},
 {name:'Golden Serpent Armada',short:'Golden Serpent',col:'#f1c40f',lc:'#fff0a8',sail:'#e8cf6a',icon:'🐍',leader:'Queen Sabra Coil',ship:'Gilded Fang'}];
const REP_ALLY=25,REP_HOST=-25,KING_FORTS=8;
const rep=c=>(S.rep&&S.rep[c])|0;
function repTxt(c){const v=rep(c);return S.king?'👑 United':v>=REP_ALLY?'🤝 Allied':v<=REP_HOST?'⚔️ At war':'😐 Neutral';}
function clanHostile(c){return !S.king&&rep(c)<=REP_HOST;}
function addRep(c,v,quiet){if(c==null||c<0||c>3||S.king)return;if(v>0)v*=(sk('war')>=4?1.5:1)*(S.off.sp?1.25:1);else v*=(sk('war')>=4?0.7:1);
 const b=rep(c),a=clamp(Math.round(b+v),-100,100);S.rep[c]=a;if(quiet)return;const n=CLANS[c].name;
 if(b>REP_HOST&&a<=REP_HOST)toast(`⚔️ The ${n} declare war on you! Their ships and forts attack on sight.`);
 else if(b<REP_ALLY&&a>=REP_ALLY)toast(`🤝 The ${n} now count you as an ally! Discounts at their stronghold.`);
 else if(b<=REP_HOST&&a>REP_HOST)toast(`🕊️ The ${n} have made peace with you.`);}
function hexA(h,a){const n=parseInt(h.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
function nearPorts(x,y,R){const o=PORTS.filter(p=>Math.hypot(p.port.x-x,p.port.y-y)<R);if(o.length)return o;let b=PORTS[0],bd=1e18;for(const p of PORTS){const d=Math.hypot(p.port.x-x,p.port.y-y);if(d<bd){bd=d;b=p;}}return[b];}
// ---- forts ----
const FRT={};let fortAct=null,stormF=null,lastTerr=-2,skT=20,levT=0;
const FORT_RANGE=560;
function fortOwner(f){const s=S.forts[f.id];return s&&s.o!=null?s.o:f.clan;}
const ownedForts=()=>FORTS.filter(f=>fortOwner(f)==='p').length;
const leadersDown=()=>[0,1,2,3].filter(c=>S.leaders[c]).length;
function fortRT(f){let rt=FRT[f.id];if(rt)return rt;const own=fortOwner(f),s=S.forts[f.id]||{},ug=s.ug|0,uw=s.uw|0,L=f.lvl,mine=own==='p';
 const n=mine?2+ug+(sk('war')>=3?1:0):2+Math.floor(L/4);const gm=Math.round((60+12*L)*(mine?1+0.4*uw:1));rt=FRT[f.id]={guns:[],wall:0,wallMax:0,angry:false,own};
 for(let i=0;i<n;i++){const a=f.a+(i-(n-1)/2)*0.62;rt.guns.push({x:f.x+Math.cos(a)*38,y:f.y+Math.sin(a)*38,hp:gm,max:gm,rl:rand(0.5,2.5),aim:a});}
 rt.wallMax=rt.wall=Math.round((300+60*L)*(mine?(1+0.5*uw)*(sk('war')>=3?1.25:1):1));return rt;}
const gunsUp=rt=>rt.guns.filter(g=>g.hp>0).length;
function fortShot(f,g,t,own,host){const dx=t.x-g.x,dy=t.y-g.y,d=Math.hypot(dx,dy),tt=d/420;const ax=t.x+(t.vx||0)*tt,ay=t.y+(t.vy||0)*tt;const a=Math.atan2(ay-g.y,ax-g.x)+(Math.random()-0.5)*0.06;g.aim=a;
 const mine=own==='p',s=S.forts[f.id]||{};const dmg=mine?(8+2*f.lvl)*(1+0.2*(s.ug|0)):(6+2*f.lvl);
 balls.push({x:g.x+Math.cos(a)*12,y:g.y+Math.sin(a)*12,vx:Math.cos(a)*420,vy:Math.sin(a)*420,life:FORT_RANGE*1.12/420,dmg:dmg*(0.85+Math.random()*0.3),owner:mine?'f':'c',clan:mine?-9:own,pl:!!host,ig:0.45});
 for(let k=0;k<3;k++)addPart('smoke',g.x+Math.cos(a)*14,g.y+Math.sin(a)*14,Math.cos(a)*rand(20,50),Math.sin(a)*rand(20,50),rand(0.6,1),rand(7,11),null);addPart('flash',g.x+Math.cos(a)*14,g.y+Math.sin(a)*14,0,0,0.12,10,null);
 boom(clamp(0.45*(1-Math.hypot(g.x-P.x,g.y-P.y)/1300),0,0.4),420);}
function fortTick(dt){fortAct=null;let bd=470;
 for(const f of FORTS){const d=Math.hypot(f.x-P.x,f.y-P.y);if(d>3000){if(FRT[f.id]&&d>4200)delete FRT[f.id];continue;}
  const rt=fortRT(f),own=fortOwner(f);if(rt.own!==own){delete FRT[f.id];continue;}
  if(d<bd&&!P.dead){if(own==='p'){bd=d;fortAct={f,kind:'manage'};}else if(gunsUp(rt)===0&&rt.wall<=0){bd=d;fortAct={f,kind:'storm'};}}
  if(d>2000)continue;const host=own!=='p'&&(rt.angry||clanHostile(own))&&!tutPeace&&!P.dead;
  for(const g of rt.guns){if(g.hp<=0)continue;g.rl-=dt;if(g.rl>0)continue;let t=null,b2=FORT_RANGE;
   if(own==='p'){for(const e of enemies){if(e.sinking||e.tut||e.surr)continue;if(!(e.kind==='pirate'||e.kind==='boss'||(e.kind==='clan'&&isHostile(e))||(e.kind==='navy'&&e.angry&&stars()>0)))continue;const dd=Math.hypot(e.x-g.x,e.y-g.y);if(dd<b2){b2=dd;t=e;}}}
   else{if(host&&!nearSafePort(P.x,P.y)){const dd=Math.hypot(P.x-g.x,P.y-g.y);if(dd<b2){b2=dd;t=P;}for(const fl of fleet){if(fl.sinking)continue;const d2=Math.hypot(fl.x-g.x,fl.y-g.y);if(d2<b2*0.8){b2=d2;t=fl;}}}
    for(const e of enemies){if(e.kind!=='clan'||e.sinking||e.clan===own)continue;const dd=Math.hypot(e.x-g.x,e.y-g.y);if(dd<b2*0.9){b2=dd;t=e;}}}
   if(!t){g.rl=0.6;continue;}fortShot(f,g,t,own,host&&(t===P||t.kind==='fleet'));g.rl=(own==='p'?3:3.6)*rand(0.85,1.15);}}
 if(stormF){const f=stormF.f;if(Math.hypot(f.x-P.x,f.y-P.y)>540||P.dead||fortOwner(f)==='p'){stormF=null;toast('🏴‍☠️ Assault called off — stay close to the fort.');}
  else{stormF.t+=dt*(sk('war')>=2?2:1);if(stormF.t>=3)captureFort(f);}}}
function fortBallHit(b,aoe){for(const id in FRT){const f=FORTS[id],rt=FRT[id];if(rt.own==='p')continue;const R=aoe?aoe+60:62;if(Math.abs(b.x-f.x)>R+40||Math.abs(b.y-f.y)>R+40)continue;
  const mult=(b.mort?2:1)*(sk('war')>=1?1.5:1);let hit=false;
  for(const g of rt.guns){if(g.hp<=0)continue;const dd=Math.hypot(b.x-g.x,b.y-g.y);if(dd<(aoe||22)){g.hp-=b.dmg*mult*(aoe?1-dd/(aoe*2):1);hit=true;addText(g.x,g.y-16,'-'+Math.round(b.dmg*mult),'#ffd27a');
    if(g.hp<=0){for(let k=0;k<16;k++)addPart('fire',g.x+rand(-12,12),g.y+rand(-12,12),rand(-60,60),rand(-60,60),rand(0.5,1.1),rand(6,12),null);boom(0.5,350);const n=gunsUp(rt);toast(n?`💥 Fort cannon destroyed — ${n} left!`:`💥 All of ${f.name}'s cannons are silenced! Now batter the walls.`);}
    if(!aoe)break;}}
  if(!hit||aoe){const dd=Math.hypot(b.x-f.x,b.y-f.y);if(dd<R){hit=true;if(rt.wall>0){const before=rt.wall;rt.wall=Math.max(0,rt.wall-b.dmg*mult*(gunsUp(rt)?0.35:1));if(Math.random()<0.4)addPart('dust',b.x,b.y,0,0,0.6,12,null);
     if(before>0&&rt.wall<=0&&!gunsUp(rt))toast(`🏰 ${f.name}'s walls are breached! Sail close and tap 🏴‍☠️ Storm.`);}}}
  if(hit){if(!rt.angry){rt.angry=true;if(!clanHostile(rt.own)){addRep(rt.own,-10,true);toast(`🏰 You fired on ${f.name}! The ${CLANS[rt.own].name} won't forget that.`);}}return true;}}
 return false;}
function captureFort(f){stormF=null;const prev=fortOwner(f);if(prev==='p')return;if(rankIdx()<3){toast('🔒 Storming forts needs the rank of Captain (700 infamy).');return;}
 const loss=Math.max(1,Math.round((2+f.lvl/3)*(sk('war')>=2?0.5:1)));if(S.crew-loss<4){toast(`👥 Not enough crew to storm the fort (need ${loss+4}).`);return;}
 S.crew-=loss;recalc();S.forts[f.id]={o:'p',g:0,ug:0,uw:0,nx:S.playTime+rand(300,480)};delete FRT[f.id];S.cst.fort++;S.infamy+=100+20*f.lvl;grantXP(150+25*f.lvl,f.x,f.y);
 addRep(prev,-15);for(let c=0;c<4;c++)if(c!==prev)addRep(c,3,true);
 for(let k=0;k<30;k++)addPart('fire',f.x+rand(-30,30),f.y+rand(-30,30),rand(-80,80),rand(-80,80),rand(0.5,1.3),rand(6,14),null);chime();
 for(const q of S.quests.slice())if(q.type==='fortraid'&&q.fid===f.id)completeQuest(q);
 setTimeout(()=>toast(`🏴‍☠️ ${f.name} is yours! (−${loss} crew) It earns gold for you — tap 🏰 Manage to upgrade it.`),200);showTip('fort');checkKing();save();}
function fortRate(s){return(25+12*((s.ug|0)+(s.uw|0)))*(sk('plun')>=5?1.3:1)*(S.off.qm?1.1:1);}
function fortCap(s){return 500+250*((s.ug|0)+(s.uw|0));}
let econT=0;
function fortEconomy(dt){econT-=dt;if(econT>0)return;econT=1;
 for(const f of FORTS){const s=S.forts[f.id];if(!s||s.o!=='p')continue;s.g=Math.min(fortCap(s),(s.g||0)+fortRate(s)/60);
  if(Math.hypot(f.x-P.x,f.y-P.y)<520&&s.g>=1&&!P.dead){const g=Math.floor(s.g);s.g-=g;S.gold+=g;S.earned+=g;S.cst.trib+=g;if(g>=5){addText(P.x,P.y-60,`🏰 +${g} 💰 tribute`,'#ffe066',true);}}
  // counter-attacks
  if(S.king)continue;
  if(!s.atk&&S.playTime>=(s.nx||0)){s.atk={t:150,c:f.clan,sp:0};toast(`🛡️ The ${CLANS[f.clan].name} are attacking ${f.name}! Defend it within 2:30 — 🛡️ on your map.`);}
  if(s.atk){const a=s.atk;a.t-=1;
   if(!a.sp&&Math.hypot(f.x-P.x,f.y-P.y)<2400){a.sp=1;const n=2+(f.lvl>=10?1:0);for(let i=0;i<n;i++){const w=waterNear(f.x+Math.cos(f.a)*500,f.y+Math.sin(f.a)*500,100,350);const e=makeEnemy('clan',w.x,w.y,f.lvl,{clan:a.c,atkF:f.id,angry:true,keep:true,home:{x:f.x,y:f.y}});enemies.push(e);}toast(`🛡️ ${n} ${CLANS[a.c].short} warships are assaulting ${f.name}!`);}
   const alive=a.sp?enemies.filter(e=>e.atkF===f.id&&!e.sinking).length:-1;
   if(a.sp&&alive===0){s.atk=null;s.nx=S.playTime+rand(360,600);S.cst.def++;const r=150+25*f.lvl;S.gold+=r;S.earned+=r;grantXP(120,P.x,P.y);chime();toast(`🛡️ ${f.name} holds! The attackers are beaten (+${r} 💰).`);}
   else if(a.t<=0){const lose=Math.random()<(a.sp?0.6:Math.max(0.1,0.45-0.1*(s.uw|0)-0.05*(s.ug|0)-(sk('war')>=3?0.1:0)));
    for(const e of enemies)if(e.atkF===f.id){e.atkF=null;e.keep=false;}
    if(lose){S.forts[f.id]={o:a.c};delete FRT[f.id];toast(`🏳️ ${f.name} fell to the ${CLANS[a.c].name}! Retake it to win it back.`);}
    else{s.atk=null;s.nx=S.playTime+rand(360,600);toast(`🛡️ ${f.name}'s garrison held off the ${CLANS[a.c].short} attack.`);}}}}}
function defendTargets(out){for(const f of FORTS){const s=S.forts[f.id];if(s&&s.o==='p'&&s.atk)out.push({x:f.x,y:f.y,icon:'🛡️',c:'#7fd3ff'});}}
function fortUpCost(f,k){const s=S.forts[f.id]||{};const l=k==='g'?s.ug|0:s.uw|0;return Math.round((k==='g'?600:500)*(l+1)*(1+f.lvl/10));}
let curFort=null;
function openFort(f){curFort=f;state='fort';joy.id=null;P.vx*=0.3;P.vy*=0.3;$('fortUI').classList.remove('hidden');renderFort();}
function renderFort(){const f=curFort,s=S.forts[f.id];if(!s||s.o!=='p'){closeFort();return;}$('fName').textContent='🏰 '+f.name;
 let h=`<div class="note">Your fort in ${CLANS[f.clan].short} waters (Lv${f.lvl}). Its cannons fire at hostile ships nearby. Tribute: <b>${Math.round(fortRate(s))} 💰/min</b>, stores up to <b>${fortCap(s)} 💰</b> — collected when you sail close, or by courier (−20%) whenever you dock at a 🏴‍☠️ haven.</div>`;
 h+=`<div class="note">💰 Stored now: <b>${Math.floor(s.g||0)}</b> • ${s.atk?`🛡️ <b>Under attack!</b> ${Math.max(0,Math.ceil(s.atk.t))}s left`:`Next clan raid expected in ~${Math.max(0,Math.round(((s.nx||0)-S.playTime)/60))} min`}</div>`;
 const cg=fortUpCost(f,'g'),cw=fortUpCost(f,'w');
 h+=row(`💣 Cannons ${pips(s.ug|0,3)}`,`${2+(s.ug|0)+(sk('war')>=3?1:0)} guns, +${20*(s.ug|0)}% damage. +1 gun & +12 💰/min per level.`,btn('fug',(s.ug|0)>=3?'MAX':`${cg} 💰`,(s.ug|0)<3&&S.gold>=cg,f.id));
 h+=row(`🧱 Walls ${pips(s.uw|0,3)}`,`Stronger walls & guns, and raids are less likely to take the fort. +12 💰/min per level.`,btn('fuw',(s.uw|0)>=3?'MAX':`${cw} 💰`,(s.uw|0)<3&&S.gold>=cw,f.id));
 $('fBody').innerHTML=h;}
function closeFort(){$('fortUI').classList.add('hidden');if(state==='fort')state='play';curFort=null;}
// ---- clans at sea ----
function clanAI(e,dt,d,safe){
 e.scT=(e.scT||0)-dt;if(e.scT<=0){e.scT=0.5;e.rv=null;let bd=e.lead?1000:850;for(const o of enemies){if(o===e||o.kind!=='clan'||o.sinking||o.clan===e.clan)continue;const dd=Math.hypot(o.x-e.x,o.y-e.y);if(dd<bd){bd=dd;e.rv=o;}}}
 if(e.rv&&(e.rv.sinking||e.rv.hp<=0))e.rv=null;
 const hostP=!P.dead&&!tutPeace&&!safe&&(e.angry||clanHostile(e.clan)||e.atkF!=null);e._hostP=hostP;
 if(e.angry&&d>e.aggro*2.2&&e.atkF==null&&!e.lead&&!clanHostile(e.clan))e.angry=false;
 const wantP=hostP&&(d<e.aggro||(e.angry&&d<e.aggro*1.8)||(e.atkF!=null&&d<2600));
 if(wantP&&(!e.rv||d<Math.hypot(e.rv.x-e.x,e.rv.y-e.y)*1.2)){let td=d,tto=Math.atan2(P.y-e.y,P.x-e.x);for(const f of fleet){if(f.sinking)continue;const fd=Math.hypot(f.x-e.x,f.y-e.y);if(fd<td*0.75){td=fd;tto=Math.atan2(f.y-e.y,f.x-e.x);}}e._td=td;e._tto=tto;e.fireOk=true;}
 else if(e.rv){e._td=Math.hypot(e.rv.x-e.x,e.rv.y-e.y);e._tto=Math.atan2(e.rv.y-e.y,e.rv.x-e.x);e.fireOk=true;e._hostP=false;}
 else{e.fireOk=false;e._td=d;e._tto=Math.atan2(P.y-e.y,P.x-e.x);}
 if(e.fireOk){e._thr=1;e._des=e._td>330?e._tto+e.side*0.3:e._tto-e.side*Math.PI/2;}
 else{e._thr=0.55;e.wpT-=dt;if(!e.wp||e.wpT<=0||Math.hypot(e.wp.x-e.x,e.wp.y-e.y)<200){const c=e.home||e;e.wp=randomWater(c.x,c.y,200,e.home?700:1200)||{x:START.x,y:START.y};e.wpT=25;}e._des=Math.atan2(e.wp.y-e.y,e.wp.x-e.x);}}
function efire(e,side){const n0=balls.length;fireBroadside(e,side,e.cannons,e.dmg,e.kind==='clan'?'c':'e',e.range);if(e.kind==='clan')for(let i=n0;i<balls.length;i++){balls[i].clan=e.clan;balls[i].pl=!!e._hostP;}}
function clanBallHit(b){for(const e of enemies){if(e.kind!=='clan'||e.sinking||e.clan===b.clan)continue;if(hitTest(e,b,5)){npcDamage(e,b.dmg);return true;}}return false;}
function npcDamage(e,dmg){e.hp-=dmg;e.hitT=0.25;if(e.hp<=0&&!e.sinking){e.sinking=0.001;loot.push({x:e.x,y:e.y,gold:Math.round(e.gold*0.35),goods:{},t:0});chum(e.x,e.y,15);for(let k=0;k<10;k++)addPart('fire',e.x+rand(-15,15),e.y+rand(-10,10),rand(-40,40),rand(-40,40),rand(0.5,1.2),rand(6,14),null);boom(clamp(0.5*(1-Math.hypot(e.x-P.x,e.y-P.y)/1400),0,0.4),400);}}
function clanDmg(e,was){if(e.kind!=='clan'||was)return;if(!clanHostile(e.clan)&&e.atkF==null)addRep(e.clan,-5);for(const o of enemies)if(o.kind==='clan'&&o.clan===e.clan&&Math.hypot(o.x-e.x,o.y-e.y)<1000)o.angry=true;}
function clanSunk(e){if(e.kind!=='clan')return;S.cst.sk++;if(e.atkF!=null)addRep(e.clan,-2,true);else{addRep(e.clan,-7);for(let c=0;c<4;c++)if(c!==e.clan)addRep(c,2,true);}
 for(const q of S.quests.slice())if(q.type==='clanhunt'&&q.tc===e.clan&&q.have<q.need){q.have++;if(q.have>=q.need)completeQuest(q);}
 if(e.dread)grantXP(60+8*e.lvl);
 if(e.lead){loot.push({x:e.x+20,y:e.y,gold:0,goods:{gems:4+e.lvl},t:0});
  if(e.rev){S.cst.rev++;grantXP(900,e.x,e.y);S.infamy+=800;S.lrev[e.clan]=S.playTime+1800;toast(`👻 The Revenant ${CLANS[e.clan].ship} sinks back into the deep! (+900 XP)`);}
  else{S.leaders[e.clan]=1;S.cst.lead++;S.lrev[e.clan]=S.playTime+1200;grantXP(600,e.x,e.y);S.infamy+=600;addRep(e.clan,-20,true);for(let c=0;c<4;c++)if(c!==e.clan)addRep(c,8,true);
   setTimeout(()=>toast(`👑 You sank the ${CLANS[e.clan].ship}! ${CLANS[e.clan].leader} is defeated (${leadersDown()}/4 clan leaders).`),300);checkKing();}}}
function clanLabel(e){const c=CLANS[e.clan];return(e.lead?(e.rev?'👻 ':'👑 ')+e.name:(e.dread?'💀 Dread ':c.icon+' ')+c.short)+` Lv${e.lvl}`+(e.lead?'':isHostile(e)?' ⚔️':rep(e.clan)>=REP_ALLY?' 🤝':'');}
function makeClan(c,x,y,lvl,extra){const e=makeEnemy('clan',x,y,lvl,Object.assign({clan:c},extra||{}));
 if(e.dread){e.maxHp=e.hp=Math.round(e.maxHp*1.7);e.dmg*=1.3;e.gold*=2;}return e;}
function outerSpawn(pt,lvl){const r=Math.random(),cc=clanSector(pt.x,pt.y);let nc=0;for(const e of enemies)if(e.kind==='clan')nc++;
 if(r<0.5&&nc<8){const c=Math.random()<0.8?cc:(Math.random()*4)|0;enemies.push(makeClan(c,pt.x,pt.y,lvl,{home:{x:pt.x,y:pt.y},dread:lvl>=11&&S.clvl>=30&&Math.random()<0.3}));return;}
 if(r<0.84||!spawnMerchant(1000,2000))enemies.push(makeEnemy('pirate',pt.x,pt.y,lvl));}
function spawnSkirmish(force){const a=clanAt(P.x,P.y);const c1=a>=0?a:(Math.random()*4)|0;let c2=(c1+1+((Math.random()*3)|0))%4;
 const pt=randomWater(P.x,P.y,800,1200);if(!pt)return false;const L=clamp(lvlAt(pt.x,pt.y),6,12);
 for(let i=0;i<2;i++){const w=waterNear(pt.x-120,pt.y,0,130);enemies.push(makeClan(c1,w.x,w.y,L,{home:{x:pt.x,y:pt.y},skir:1}));}
 for(let i=0;i<2;i++){const w=waterNear(pt.x+220,pt.y,0,130);enemies.push(makeClan(c2,w.x,w.y,L,{home:{x:pt.x,y:pt.y},skir:1}));}
 if(S.cst.sk<30||force)toast(`⚔️ Clan skirmish: ${CLANS[c1].short} vs ${CLANS[c2].short}! Pick a side — or loot the wrecks.`);return true;}
function leaderHome(c){const p=PORTS.find(q=>q.clan===c);const a=Math.atan2(START.y-p.y,START.x-p.x);return waterNear(p.port.x+Math.cos(a)*700,p.port.y+Math.sin(a)*700,0,150);}
function spawnLeader(c,rev){const h=leaderHome(c),L=clamp(lvlAt(h.x,h.y)+(rev?3:1),9,14);const C=CLANS[c];
 const e=makeClan(c,h.x,h.y,L,{lead:true,rev:!!rev,keep:true,name:rev?`${C.leader} the Revenant`:C.leader,maxHp:Math.round((520+80*L)*(rev?1.6:1)),cannons:5+Math.floor(L/3)+(rev?1:0),dmg:(8+2.2*L)*(rev?1.25:1),maxSpeed:165,reload:2.6,aggro:900,gold:(900+100*L)*(rev?2:1),len:84,wid:28,range:430,home:{x:h.x,y:h.y}});enemies.push(e);
 for(let i=0;i<2;i++){const w=waterNear(h.x,h.y,120,240);enemies.push(makeClan(c,w.x,w.y,L-1,{home:{x:h.x,y:h.y},dread:!!rev}));}
 toast(rev?`👻 A ghostly ${C.ship} rises — ${e.name} has returned for revenge!`:`👑 Flagship sighted: the ${C.ship}, ${C.leader}'s ship (${C.name} leader). Sink it to break the clan!`);return e;}
function clanTick(){const c=clanAt(P.x,P.y);
 if(c!==lastTerr){if(lastTerr!==-2){if(c>=0)toast(`${CLANS[c].icon} Entering ${CLANS[c].name} waters — ${repTxt(c)}`);else toast('⚖️ Back in the Crown\'s core waters.');}if(c>=0)showTip('republic');lastTerr=c;}
 if(c>=0&&!tutPeace){skT-=1;if(skT<=0){skT=rand(40,70);let nc=0;for(const e of enemies)if(e.kind==='clan')nc++;if(nc<7&&Math.random()<0.6)spawnSkirmish();}}
 for(let k=0;k<4;k++){const ld=enemies.find(e=>e.lead&&e.clan===k&&!e.sinking);const p=PORTS.find(q=>q.clan===k);const d=Math.hypot(p.port.x-P.x,p.port.y-P.y);
  if(ld){if(Math.hypot(ld.x-P.x,ld.y-P.y)>4200){enemies.splice(enemies.indexOf(ld),1);}continue;}
  if(d<2600&&!S.king){if(!S.leaders[k])spawnLeader(k,false);else if(S.clvl>=30&&S.playTime>=(S.lrev[k]||0))spawnLeader(k,true);}}
 // the Crown's last armada (endgame)
 if((S.king||S.infamy>=20000)&&!inCore(P.x,P.y)&&!tutPeace){levT+=1;if(levT>=(S.cst.lev?1500:600)&&!enemies.some(e=>e.lev)){levT=0;const pt=randomWater(P.x,P.y,1500,1900);if(pt){const L=14;
   enemies.push(makeEnemy('navy',pt.x,pt.y,L,{lev:1,name:'HMS Leviathan',gAng:true,keep:true,maxHp:2600,cannons:9,dmg:30,maxSpeed:150,reload:2.4,aggro:3000,gold:6000,len:96,wid:32,range:450}));
   for(let i=0;i<3;i++){const w=waterNear(pt.x,pt.y,150,260);enemies.push(makeEnemy('navy',w.x,w.y,12,{gAng:true,keep:true,home:{x:pt.x,y:pt.y}}));}
   toast('🐋 The Crown sends HMS Leviathan, its mightiest man-o\'-war, to crush the Republic! Sink it!');}}}}
function levSunk(e){if(!e.lev)return;S.cst.lev++;grantXP(1500,e.x,e.y);S.infamy+=2000;loot.push({x:e.x+25,y:e.y,gold:0,goods:{gems:12},t:0});toast('🐋 HMS Leviathan is sunk! The Crown\'s armada is broken. (+1500 XP)');}
function checkKing(){if(S.king||ownedForts()<KING_FORTS||leadersDown()<4)return;S.king=1;S.gold+=5000;S.earned+=5000;S.infamy+=3000;grantXP(2000);for(let c=0;c<4;c++)S.rep[c]=60;
 for(const id in S.forts)if(S.forts[id].atk)S.forts[id].atk=null;
 setTimeout(()=>toast('👑 The four clans kneel! You are PIRATE KING OF THE REPUBLIC! +5000 💰 — but the Crown will send its armada…'),600);chime();save();}
// ---- clan contracts ----
function genClanQ(pi,avoid){const p=PORTS[pi],pp=p.port;if(!p.haven)return null;const ic=p.clan!=null?p.clan:clanSector(pp.x,pp.y);if(clanHostile(ic))return null;const L=lvlAt(pp.x,pp.y),C=CLANS[ic];
 const types=['clanhunt','fortraid','clansupply'].filter(t=>!(avoid&&avoid.includes(t==='clansupply'?'deliver':t)));if(!types.length)return null;const type=pick(types);const id=S.qid++;
 if(type==='clanhunt'){let tc=(ic+1+((Math.random()*3)|0))%4;const need=3+((Math.random()*3)|0);
  return{id,from:pi,type,clan:ic,tc,need,have:0,reward:need*(90+18*L),title:`${C.icon} ${C.short} contract: sink ${need} ${CLANS[tc].short} ships`,text:`The ${C.name} pay for every ${CLANS[tc].name} ship you sink (their waters lie ${['east','north','west','south'][tc]}). +rep with ${C.short}, −rep with ${CLANS[tc].short}.`};}
 if(type==='fortraid'){if(rankIdx()<3){S.qid--;return null;}const fs=FORTS.filter(f=>{const o=fortOwner(f);return o!=='p'&&o!==ic&&Math.hypot(f.x-pp.x,f.y-pp.y)<9000;}).sort((a,b)=>Math.hypot(a.x-pp.x,a.y-pp.y)-Math.hypot(b.x-pp.x,b.y-pp.y));if(!fs.length){S.qid--;return null;}
  const f=fs[Math.min(fs.length-1,(Math.random()*2)|0)];const o=fortOwner(f);return{id,from:pi,type,clan:ic,tc:o,fid:f.id,reward:700+120*f.lvl,title:`${C.icon} ${C.short} contract: take ${f.name} (Lv${f.lvl})`,text:`Silence the cannons, breach the walls and 🏴‍☠️ Storm the ${CLANS[o].short} fort. It stays yours.`};}
 const cands=PORTS.map((x,i)=>i).filter(i=>i!==pi&&PORTS[i].outer&&(PORTS[i].clan==null||!clanHostile(PORTS[i].clan))&&Math.hypot(PORTS[i].port.x-pp.x,PORTS[i].port.y-pp.y)<9000);if(!cands.length){S.qid--;return null;}
 const to=p.clan==null&&PORTS.findIndex(q=>q.clan===ic)!==pi&&!clanHostile(ic)?PORTS.findIndex(q=>q.clan===ic):pick(cands);const crates=3+((Math.random()*3)|0),dist=Math.hypot(PORTS[to].port.x-pp.x,PORTS[to].port.y-pp.y);
 return{id,from:pi,type:'deliver',clan:ic,to,crates,reward:Math.round((60+dist/1000*55*(1+crates/5))*(1+0.12*L)),title:`${C.icon} ${C.short} supply run: ${crates} crates to ${PORTS[to].name}`,text:`War supplies for the ${C.name}. Takes ${crates} cargo space. +rep with ${C.short}.`};}
function clanJobDone(q){if(q.clan==null)return;S.cst.cj++;addRep(q.clan,q.type==='deliver'?8:12);if(q.tc!=null&&q.tc!=='p')addRep(q.tc,-5,true);}
function clanQTarget(q){if(q.type==='fortraid'){const f=FORTS[q.fid];return f?{x:f.x,y:f.y,icon:'🏰',c:CLANS[f.clan].col}:null;}
 if(q.type==='clanhunt'){let b=null,bd=1e18;for(const e of enemies)if(e.kind==='clan'&&e.clan===q.tc&&!e.sinking){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e;}}if(b&&bd<2500)return{x:b.x,y:b.y,icon:'🏴',c:CLANS[q.tc].col};
  for(const f of FORTS)if(f.clan===q.tc){const d=Math.hypot(f.x-P.x,f.y-P.y);if(d<bd){bd=d;b=f;}}return b?{x:b.x,y:b.y,icon:'🏴',c:CLANS[q.tc].col}:null;}return null;}
// ---- fast travel / docking extras ----
function ftCost(pi){const a=PORTS[curPort].port,b=PORTS[pi].port;return Math.round((30+Math.hypot(a.x-b.x,a.y-b.y)/60)*(S.off.ca?0.7:1));}
function ftOk(){return!S.quests.some(q=>(q.type==='race'||q.type==='blockade')&&q.started);}
function fastTravel(pi){const c=ftCost(pi);if(!PORTS[curPort]||!PORTS[curPort].haven||!PORTS[pi].haven||!S.vis.includes(pi)||S.gold<c||!ftOk())return;if(PORTS[pi].clan!=null&&clanHostile(PORTS[pi].clan))return;
 S.gold-=c;$('port').classList.add('hidden');const p=PORTS[pi];P.x=p.port.x;P.y=p.port.y;P.vx=P.vy=0;cam.x=P.x;cam.y=P.y;
 for(let i=enemies.length-1;i>=0;i--)if(!enemies[i].keep||enemies[i].lead)enemies.splice(i,1);sharks.length=0;balls.length=0;shells.length=0;loot.length=0;populate();placeFleet();
 dock(pi);setTimeout(()=>toast(`⛵ Your crew sailed you to ${p.name} (−${c} 💰).`),80);}
function exDock(pi){if(!S.vis.includes(pi))S.vis.push(pi);const p=PORTS[pi];if(!p.haven)return;let t=0;for(const id in S.forts){const s=S.forts[id];if(s.o==='p'&&s.g>=1){t+=Math.floor(s.g);s.g-=Math.floor(s.g);}}
 if(t>0){const n=Math.round(t*0.8);S.gold+=n;S.earned+=n;S.cst.trib+=n;setTimeout(()=>toast(`🏰 Couriers brought ${n} 💰 of fort tribute (20% fee).`),2700);}}
function dockExtraHTML(p){let h='';
 if(p.clan!=null){const c=CLANS[p.clan];h+=`<div class="note">${c.icon} <b>Stronghold of the ${c.name}</b> — you are <b>${repTxt(p.clan)}</b> (${rep(p.clan)}).${rep(p.clan)>=REP_ALLY?' Allies pay 15% less here.':''} Their leader: ${S.leaders[p.clan]?'sunk ✅':c.leader+' (flagship the '+c.ship+')'}.</div>`;}
 if(p.haven){const hv=S.vis.filter(i=>i!==curPort&&PORTS[i]&&PORTS[i].haven&&!(PORTS[i].clan!=null&&clanHostile(PORTS[i].clan)));
  h+=`<h3>⛵ Fast travel</h3>`;if(!hv.length)h+=`<div class="note">Hire a crew to sail you to any 🏴‍☠️ haven you've already visited. Visit more havens to unlock routes.</div>`;
  else{const ok=ftOk();if(!ok)h+=`<div class="note">Not during a timed job (regatta / blockade run).</div>`;
   hv.sort((a,b)=>ftCost(a)-ftCost(b));for(const i of hv){const c=ftCost(i);h+=row(`${PORTS[i].clan!=null?CLANS[PORTS[i].clan].icon:'🏴‍☠️'} ${PORTS[i].name}`,`${Math.round(Math.hypot(PORTS[i].port.x-p.port.x,PORTS[i].port.y-p.port.y)/10)*10}m • Waters Lv${lvlAt(PORTS[i].port.x,PORTS[i].port.y)}`,btn('ft',`${c} 💰`,ok&&S.gold>=c,i));}}}
 return h;}
// ---- ammo ----
const AMMO={ball:{name:'Round shot',icon:'⚫',lvl:1,cost:0,desc:'Standard iron balls.'},
 chain:{name:'Chain shot',icon:'⛓️',lvl:8,cost:10,desc:'Shreds rigging: hit ships are slowed (−45% speed, −40% turning) for 4s. −25% damage.'},
 fire:{name:'Fire shot',icon:'🔥',lvl:14,cost:16,desc:'Heated shot sets ships ablaze: extra burn damage over 4s. −15% hit damage.'},
 mortar:{name:'Mortar',icon:'💣',lvl:20,cost:26,desc:'One heavy arcing shell per volley: 1.6× range, splash damage, ×2 vs forts. Slower reload.'}};
const AMMO_CAP=40,AORD=['ball','chain','fire','mortar'];const shells=[];
const ammoCost=k=>Math.round(AMMO[k].cost*(S.off.mg?0.8:1));
function ammoUnl(){return AORD.filter(k=>S.clvl>=AMMO[k].lvl);}
function updAmmoBtn(){const b=$('ammoBtn');const u=ammoUnl();const show=u.length>1&&(state==='play'||state==='map');if(hudCache.ammoS!==show){hudCache.ammoS=show;b.classList.toggle('hidden',!show);}if(!show)return;
 const k=S.asel,v=k==='ball'?'∞':String(S.ammo[k]|0);const key=k+v;if(hudCache.ammo!==key){hudCache.ammo=key;$('ammoIc').textContent=AMMO[k].icon;$('ammoN').textContent=v;b.classList.toggle('on',k!=='ball');}}
function cycleAmmo(){const u=ammoUnl();if(u.length<2)return;let i=u.indexOf(S.asel);for(let t=0;t<u.length;t++){i=(i+1)%u.length;const k=u[i];if(k==='ball'||S.ammo[k]>0){S.asel=k;break;}}
 toast(`${AMMO[S.asel].icon} ${AMMO[S.asel].name}${S.asel==='ball'?'':` (${S.ammo[S.asel]} volleys)`}${u.some(k=>k!=='ball'&&!(S.ammo[k]>0))?' — buy more in port (🛠️ Ship tab)':''}`);updAmmoBtn();}
function playerVolley(side,aim){let k=S.asel;if(k!=='ball'&&!(S.ammo[k]>0)){toast(`${AMMO[k].icon} Out of ${AMMO[k].name} — back to round shot.`);S.asel=k='ball';}
 if(k==='mortar'){S.ammo.mortar--;fireMortar(side,aim);if(side<0)P.rl=ST.reload*1.7;else P.rr=ST.reload*1.7;updAmmoBtn();return;}
 const n0=balls.length;fireBroadside(P,side,ST.cannons,ST.dmg*(k==='chain'?0.75:k==='fire'?0.85:1),'p',ST.range,aim);
 if(k!=='ball'){S.ammo[k]--;updAmmoBtn();}for(let i=n0;i<balls.length;i++){if(k!=='ball')balls[i].am=k;if(S.cos.fx!=='def')balls[i].fx=S.cos.fx;}}
function ammoHit(e,b){if(b.am==='chain'){e.slowT=4;}else if(b.am==='fire'&&e.kind!=='shark'){e.burn=4;e.burnD=Math.min((e.burnD||0)+b.dmg*0.0375,b.dmg*0.15);}}
function burnTick(e,dt){if(e.slowT>0)e.slowT-=dt;if(!(e.burn>0))return;e.burn-=dt;e.burnT=(e.burnT||0)-dt;if(Math.random()<0.5)addPart('fire',e.x+rand(-e.len*0.3,e.len*0.3),e.y+rand(-8,8),rand(-10,10),rand(-30,-5),rand(0.3,0.7),rand(4,8),null);
 if(e.burnT<=0){e.burnT=0.5;damageEnemy(e,e.burnD);}if(e.burn<=0)e.burnD=0;}
function fireMortar(side,aim){const R=ST.range*1.6,dir=aim!=null?aim:P.h+side*Math.PI/2;let t=null,bd=1e9;
 for(const e of enemies){if(!isHostile(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>R||d<120)continue;if(Math.abs(angDiff(dir,Math.atan2(e.y-P.y,e.x-P.x)))>1.0)continue;if(d<bd){bd=d;t=e;}}
 if(!t)for(const id in FRT){const rt=FRT[id];if(rt.own==='p')continue;for(const g of rt.guns){if(g.hp<=0&&rt.wall<=0)continue;const d=Math.hypot(g.x-P.x,g.y-P.y);if(d>R)continue;if(Math.abs(angDiff(dir,Math.atan2(g.y-P.y,g.x-P.x)))>1.0)continue;if(d<bd){bd=d;t=g.hp>0?g:FORTS[id];}}}
 let tx,ty;if(t){const T0=1+bd/700;tx=t.x+(t.vx||0)*T0;ty=t.y+(t.vy||0)*T0;}else{tx=P.x+Math.cos(dir)*R*0.85;ty=P.y+Math.sin(dir)*R*0.85;}
 const d=Math.hypot(tx-P.x,ty-P.y);shells.push({x0:P.x,y0:P.y,tx,ty,x:P.x,y:P.y,t:0,T:1+d/700,dmg:ST.dmg*ST.cannons*0.55,fx:S.cos.fx});
 const ox=Math.cos(dir),oy=Math.sin(dir);for(let k=0;k<6;k++)addPart('smoke',P.x+ox*P.wid*0.6,P.y+oy*P.wid*0.6,ox*rand(20,60),oy*rand(20,60),rand(0.8,1.3),rand(8,13),smokeC());addPart('flash',P.x+ox*P.wid*0.6,P.y+oy*P.wid*0.6,0,0,0.15,13,null);boom(0.7,300);cam.shake=Math.max(cam.shake,5);}
function shellTick(dt){for(let i=shells.length-1;i>=0;i--){const s=shells[i];s.t+=dt;const k=Math.min(1,s.t/s.T);s.x=s.x0+(s.tx-s.x0)*k;s.y=s.y0+(s.ty-s.y0)*k;if(s.fx&&s.fx!=='def'&&Math.random()<0.5)addPart('fire',s.x,s.y-Math.sin(Math.PI*k)*120,0,0,0.3,4,null);
  if(k<1)continue;shells.splice(i,1);const A=85;
  for(const e of enemies){if(e.sinking||e.tut)continue;const d=Math.hypot(e.x-s.x,e.y-s.y);if(d<A+e.len*0.4){if(e.kind==='merchant'&&!e.angry&&!e.surr)continue;damageEnemy(e,s.dmg*(1-0.5*d/(A+e.len*0.4)));}}
  for(const sh of sharks){if(!sh.sinking&&Math.hypot(sh.x-s.x,sh.y-s.y)<A)damageShark(sh,s.dmg*0.6);}
  fortBallHit({x:s.x,y:s.y,dmg:s.dmg,mort:1},A);
  const land=inAnyIsland(s.x,s.y,0);for(let k=0;k<22;k++)addPart(land?'dust':'fire',s.x+rand(-20,20),s.y+rand(-20,20),rand(-90,90),rand(-90,90),rand(0.4,1),rand(6,14),null);if(!land)for(let k=0;k<3;k++)addPart('splash',s.x+rand(-25,25),s.y+rand(-25,25),0,0,0.8,10,null);
  boom(clamp(0.7*(1-Math.hypot(s.x-P.x,s.y-P.y)/1500),0.1,0.6),250);cam.shake=Math.max(cam.shake,3);}}
function drawShells(){for(const s of shells){const k=Math.min(1,s.t/s.T),hgt=Math.sin(Math.PI*k)*120;ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.arc(s.x,s.y,5,0,TAU);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(s.x,s.y-hgt,6+hgt/60,0,TAU);ctx.fill();if(k>0.8){ctx.strokeStyle='rgba(255,80,40,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.tx,s.ty,85*(k-0.8)*5,0,TAU);ctx.stroke();}}}
function armoryHTML(){const u=ammoUnl().filter(k=>k!=='ball');let h=`<h3>🧨 Armory — special ammo</h3>`;
 if(!u.length)return h+`<div class="note">⛓️ Chain shot unlocks at captain level ${AMMO.chain.lvl}, 🔥 fire shot at ${AMMO.fire.lvl}, 💣 mortar shells at ${AMMO.mortar.lvl}.</div>`;
 h+=`<div class="note">Pick ammo with the ammo button next to your fire buttons (key R). One volley = one broadside. Holds up to ${AMMO_CAP} of each.</div>`;
 for(const k of AORD){if(k==='ball')continue;const a=AMMO[k],ok=S.clvl>=a.lvl,c=ammoCost(k),n=S.ammo[k]|0,m5=Math.min(5,AMMO_CAP-n),m20=Math.min(20,AMMO_CAP-n);
  h+=row(`${a.icon} ${a.name} (${n}/${AMMO_CAP})`,ok?a.desc:`🔒 Unlocks at captain level ${a.lvl}`,ok?btn('ammo',`+${Math.max(m5,0)} • ${c*Math.max(m5,0)}💰`,m5>0&&S.gold>=c*m5,k+':5')+btn('ammo',`+${Math.max(m20,0)}`,m20>0&&S.gold>=c*m20,k+':20','sell'):'');}
 return h;}
// ---- officers ----
const OFFICERS=[['fm','🧑‍✈️','First Mate',3,250,'+4% speed, +6% turning'],['sg','🩺',"Ship's Surgeon",6,400,'+0.6 HP/s repairs at sea; half as many crew lost to cannon fire'],
 ['qm','💼','Quartermaster',10,700,'+8% cargo sell prices, +10% fort tribute'],['mg','🎯','Master Gunner',15,1100,'+8% cannon damage, special ammo 20% cheaper'],
 ['bo','📯','Bosun',22,1600,'Boost recharges 12% faster'],['ca','🧭','Cartographer',28,2200,'Reveals 30% more map, fast travel 30% cheaper'],
 ['sp','🕵️','Spymaster',40,3500,'Clan reputation gains +25%; clan ships always on your mini-map'],['ad','⚓','Flag Admiral',50,5000,'Fleet ships deal +20% damage']];
function officersHTML(p){let h=`<h3>🎩 Ship's officers</h3><div class="note">Veteran officers sign on at 🏴‍☠️ havens once you're a famous enough captain. One-time fee, permanent bonus.</div>`;
 for(const [k,ic,nm,l,c,d] of OFFICERS){const own=!!S.off[k],ok=S.clvl>=l;h+=row(`${own?'✅':ok?ic:'🔒'} ${nm}`,`${d}${ok?'':` • unlocks at captain level ${l}`}`,own?'':btn('off',p.haven?`${c} 💰`:'Havens only',ok&&p.haven&&S.gold>=c,k));}return h;}
function exPortAction(act,arg){if(act==='ft'){fastTravel(+arg);return true;}
 if(act==='ammo'){const [k,m]=String(arg).split(':');if(!AMMO[k]||S.clvl<AMMO[k].lvl)return true;const c=ammoCost(k),n=Math.min(+m,AMMO_CAP-(S.ammo[k]|0),Math.floor(S.gold/Math.max(1,c)));if(n>0){S.gold-=n*c;S.ammo[k]=(S.ammo[k]|0)+n;chime();toast(`${AMMO[k].icon} +${n} ${AMMO[k].name} volleys`);}return true;}
 if(act==='off'){const o=OFFICERS.find(x=>x[0]===arg);if(o&&!S.off[arg]&&S.clvl>=o[3]&&PORTS[curPort].haven&&S.gold>=o[4]){S.gold-=o[4];S.off[arg]=1;recalc();chime();toast(`${o[1]} ${o[2]} signed on: ${o[5]}`);}return true;}
 return false;}
// ---- cosmetics ----
const COS={sail:[['def','Canvas',0,'#fff8e7'],['crimson','Crimson',4,'#c0392b'],['midnight','Midnight',12,'#2c3e70'],['emerald','Emerald',18,'#2e8b57'],['royal','Royal Purple',26,'#7d3c98'],['gold','Gold Leaf',36,'#ffd54a'],['ghost','Ghost Silk',50,'rgba(225,245,255,0.55)']],
 flag:[['def','Jolly Roger',0,'#111','#fff'],['cutlass','Red Cutlass',7,'#8e1b1b','#fff'],['burning','Burning Skull',16,'#d35400','#ffe08a'],['kraken','Kraken',30,'#4a235a','#9fe2bf'],['crown','Imperial Crown',45,'#b8860b','#fff']],
 hull:[['def','Oak',0,'#7b4a23','#b07b45'],['ebony','Ebony',10,'#2a1a0e','#5a4030'],['navy','Navy Blue',22,'#24384f','#6a7f96'],['blood','Blood Red',34,'#6e1a14','#a0523d'],['gilded','Gilded',55,'#8a6a1c','#d8b55a']],
 fx:[['def','Grey smoke',0],['black','Black Powder',9],['ember','Ember Trails',24],['spectral','Spectral Green',40],['royal','Royal Sparks',60]]};
const COSN={sail:'⛵ Sails',flag:'🏴 Flags',hull:'🎨 Hull paint',fx:'💨 Cannon smoke & trails'};
const FXC={black:'#4a4a4a',ember:'#ffb36b',spectral:'#8fffb0',royal:'#ffd86b'};
const cosItem=(cat,id)=>COS[cat].find(x=>x[0]===id)||COS[cat][0];
function smokeC(){return FXC[S.cos.fx]||null;}
function playerSail(){const c=S.cos.sail;return c==='def'?(S.infamy>=6000?'#ffe08a':'#fff8e7'):cosItem('sail',c)[3];}
function applyCos(){const h=cosItem('hull',S.cos.hull),f=cosItem('flag',S.cos.flag);P.paint=h[3];P.deck=h[4];P.flagC=f[3];P.flagS=f[4];}
function equipCos(arg){const [cat,id]=String(arg).split(':');const it=COS[cat]&&COS[cat].find(x=>x[0]===id);if(!it||S.clvl<it[2])return;S.cos[cat]=id;applyCos();chime();save();}
function styleHTML(){let h=`<div class="note">🎨 <b>Wardrobe</b> — new styles unlock as you level up (you're level ${S.clvl}). Tap to equip.</div>`;
 for(const cat in COS){h+=`<h3>${COSN[cat]}</h3>`;for(const it of COS[cat]){const ok=S.clvl>=it[2],on=S.cos[cat]===it[0];const sw=it[3]?`<span style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:4px;border:1px solid #0006;background:${it[3]}"></span>`:(FXC[it[0]]?`<span style="color:${FXC[it[0]]};text-shadow:0 0 2px #000">●</span> `:'');
  h+=row(`${ok?sw:'🔒 '}${it[1]}`,ok?(on?'Equipped':'Unlocked'):`Unlocks at captain level ${it[2]}`,ok?btn('cos',on?'✓ On':'Equip',!on,cat+':'+it[0],on?'sell':''):'');}}
 return h;}
// ---- level unlocks ----
const PERK_GATE=[0,0,0,0,25,35];const warGate=i=>20+5*i;
const perkLvl=(k,i)=>k==='war'?warGate(i):PERK_GATE[i]||0;
const LEG_MAX=30;
function unlocksAt(l){const out=[];for(const k of AORD)if(AMMO[k].lvl===l&&k!=='ball')out.push(AMMO[k].icon+' '+AMMO[k].name);
 for(const cat in COS)for(const it of COS[cat])if(it[2]===l&&it[2]>0)out.push(`🎨 ${it[1]} ${COSN[cat].split(' ').slice(1).join(' ').toLowerCase()}`);
 for(const o of OFFICERS)if(o[3]===l)out.push(`${o[1]} ${o[2]} (hire at havens)`);
 for(const k in SKILLS)SKILLS[k].p.forEach((pp,i)=>{if(perkLvl(k,i)===l)out.push(`${SKILLS[k].icon} perk ${pp[0]}`);});
 if(l===30)out.push('⭐ Renown points');return out;}
function unlockTable(){const t=[];for(let l=2;l<=MAXLVL;l++){const u=unlocksAt(l);if(u.length)t.push([l,u]);}return t;}
function giftAmmo(from,to){for(const k of AORD)if(k!=='ball'&&AMMO[k].lvl>from&&AMMO[k].lvl<=to)S.ammo[k]=Math.min(AMMO_CAP,(S.ammo[k]|0)+10);}
function lvlUpMsg(l){const u=unlocksAt(l);giftAmmo(l-1,l);S.unl=Math.max(S.unl|0,l);if(u.some(x=>x.includes('Chain shot')))showTip('ammo');return`🎖️ Level up! Lv${l} (+1 skill point)`+(u.length?` • Unlocked: ${u.join(', ')}`:'');}
function retroUnlocks(){if(T.on||state!=='play'||(S.unl|0)>=S.clvl)return;const from=S.unl|0;let n=0;const cats=[];for(let l=Math.max(2,from+1);l<=S.clvl;l++){const u=unlocksAt(l);n+=u.length;}giftAmmo(from,S.clvl);S.unl=S.clvl;
 if(n)toast(`🎁 New unlocks for a level ${S.clvl} captain: ${n} rewards — ammo (🛠️ Ship tab), officers (👥 Crew tab), styles (☰ ➜ 🎨 Style)${S.clvl>=20?' and new Warlord perks':''}!`);}
function learnLeg(){if((S.sp|0)<1||S.clvl<30||(S.leg|0)>=LEG_MAX)return;S.sp--;S.leg=(S.leg|0)+1;const old=ST.maxHp;recalc();P.hp+=Math.max(0,ST.maxHp-old);chime();toast(`⭐ Renown ${S.leg}: +${(1.5*S.leg).toFixed(1)}% damage & hull`);save();}
function expRecalc(){const g=sk('gun'),se=sk('sea'),L=S.leg|0,o=S.off||{};
 if(g>=5)ST.dmg*=1.1;if(g>=6)ST.reload*=0.9;if(se>=5)ST.maxSpeed*=1.05;if(se>=6)ST.maxHp=Math.round(ST.maxHp*1.15);
 ST.dmg*=1+0.015*L;ST.maxHp=Math.round(ST.maxHp*(1+0.015*L));
 if(o.fm){ST.maxSpeed*=1.04;ST.turn*=1.06;}if(o.mg)ST.dmg*=1.08;if(o.sg)ST.regen+=0.6;if(o.bo)ST.boostCd*=0.88;if(o.ca)ST.reveal*=1.3;if(o.sp)ST.radar=Math.max(ST.radar,1400);applyCos();}
// ---- republic tab ----
function repHTML(){const of=ownedForts(),ld=leadersDown();
 let h=`<div class="note">⚔️ <b>Pirate Republic Wars</b> — the outer waters beyond the Crown's core belong to four rival clans. Attack a clan and it goes to war with you; work its contracts (havens & strongholds out there) and it becomes an ally. 🏰 Forts: silence the cannons, breach the walls, then 🏴‍☠️ Storm (rank Captain).</div>`;
 h+=`<h3>👑 Unite the Republic</h3>`+(S.king?`<div class="note">👑 <b>You are Pirate King of the Republic!</b> The clans serve you. Beware the Crown's armada…</div>`:`<div class="note">Hold <b>${KING_FORTS} forts</b> (${of}/${KING_FORTS}) and sink all <b>4 clan leaders</b> (${ld}/4) to become Pirate King of the Republic.<div class="xpb"><i style="width:${Math.round((Math.min(of,KING_FORTS)/KING_FORTS*0.5+ld/8)*100)}%"></i></div></div>`);
 h+=`<h3>🏴 Clans</h3>`;
 CLANS.forEach((c,i)=>{const v=rep(i),nf=FORTS.filter(f=>fortOwner(f)===i).length;h+=row(`<span style="color:${c.col};text-shadow:0 0 2px #000">■</span> ${c.icon} ${c.name}`,`${repTxt(i)} (${v>0?'+':''}${v}) • ${nf} forts • ${['East','North','West','South'][i]} waters • leader ${S.leaders[i]?'sunk ✅':c.leader}<div class="xpb"><i style="width:${Math.round((v+100)/2)}%;background:${v>=REP_ALLY?'#2c9c3a':v<=REP_HOST?'#b8281a':'#d99a1a'}"></i></div>`,'');});
 h+=`<h3>🏰 Your forts (${of})</h3>`;if(!of)h+=`<div class="note">None yet.</div>`;
 for(const f of FORTS){const s=S.forts[f.id];if(!s||s.o!=='p')continue;h+=row(`🏰 ${f.name}`,`Lv${f.lvl} • 💰 ${Math.floor(s.g||0)}/${fortCap(s)} stored • ${Math.round(fortRate(s))}/min${s.atk?' • 🛡️ UNDER ATTACK':''}`,'');}
 h+=`<div class="note">🗺️ Explored: ${Math.round(explored()*100)}% • 🏴 ${S.cst.sk} clan ships sunk • 📜 ${S.cst.cj} clan contracts • 🛡️ ${S.cst.def} raids repelled • 💰 ${S.cst.trib} tribute</div>`;return h;}
let expC=0,expT=-1e9;function explored(){if(performance.now()-expT<3000)return expC;expT=performance.now();let n=0;for(let i=0;i<fog.length;i++)n+=fog[i];return expC=n/fog.length;}
// ---- world drawing: forts ----
function drawForts(x0,x1,y0,y1,ts){for(const f of FORTS){if(f.x<x0-120||f.x>x1+120||f.y<y0-120||f.y>y1+120)continue;const rt=FRT[f.id],own=fortOwner(f),col=own==='p'?'#5be36a':CLANS[own].col;
 const wallOk=!rt||rt.wall>0;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);
 ctx.fillStyle=wallOk?'#8d8d8d':'#6a5a4a';ctx.strokeStyle='#4a4a4a';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU,r=i%2?40:52;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle=wallOk?'#a9a9a9':'#7d6b58';ctx.fillRect(-20,-20,40,40);
 if(!wallOk){ctx.fillStyle='#4a3a2a';for(let i=0;i<5;i++)ctx.fillRect(-26+i*11,-30+((i*37)%50),8,6);}ctx.restore();
 ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-46);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(f.x,f.y-46);ctx.lineTo(f.x+24,f.y-40+Math.sin(ts*3+f.id)*2);ctx.lineTo(f.x,f.y-32);ctx.closePath();ctx.fill();
 const guns=rt?rt.guns:null;if(guns)for(const g of guns){ctx.save();ctx.translate(g.x,g.y);if(g.hp>0){ctx.rotate(g.aim);ctx.fillStyle='#333';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.fillStyle='#111';ctx.fillRect(0,-3.5,18,7);}else{ctx.fillStyle='rgba(40,30,20,0.8)';ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();if(Math.random()<0.05)addPart('smoke',g.x,g.y,0,-15,1,7,null);}ctx.restore();}
 const s=S.forts[f.id];if(s&&s.atk){ctx.strokeStyle=`rgba(127,211,255,${0.4+0.4*Math.sin(ts*5)})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,80,0,TAU);ctx.stroke();}}}
function drawFortLabels(){for(const f of FORTS){const X=sx(f.x),Y=sy(f.y-72);if(X<-120||X>vw+120||Y<-40||Y>vh+60)continue;const own=fortOwner(f),rt=FRT[f.id];
 const nm=(own==='p'?'🏰 ':'🏯 ')+f.name+(own==='p'?' (yours)':` • ${CLANS[own].short}`);ctx.font='bold 12px sans-serif';const w=ctx.measureText(nm).width+12;ctx.fillStyle='rgba(20,12,4,0.55)';ctx.fillRect(X-w/2,Y-9,w,18);ctx.fillStyle=own==='p'?'#b8ffbf':CLANS[own].lc;ctx.fillText(nm,X,Y);
 if(rt&&own!=='p'&&(rt.wall<rt.wallMax||rt.guns.some(g=>g.hp<g.max))){const n=gunsUp(rt);ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(X-30,Y+11,60,5);ctx.fillStyle='#c9b57a';ctx.fillRect(X-30,Y+11,60*clamp(rt.wall/rt.wallMax,0,1),5);ctx.font='bold 11px sans-serif';ctx.fillStyle='#fff';ctx.fillText(rt.wall<=0&&!n?'🏴‍☠️ Breached — storm it!':`💣 ${n}/${rt.guns.length}`,X,Y+24);}}}
// ---- maps ----
const MV={cx:WORLD/2,cy:WORLD/2,z:1};const mapPtr=new Map();let mapPinch=null,mapMoved=0,mapDownT=0,mapOpen=false;
function bigMapRect(){const s=Math.max(160,Math.min(vw-16,vh-70));return{x:(vw-s)/2,y:(vh-s)/2+8,s};}
function mapView(big){if(big){const sp=WORLD/MV.z;return{x0:clamp(MV.cx-sp/2,0,WORLD-sp),y0:clamp(MV.cy-sp/2,0,WORLD-sp),span:sp};}const sp=7000;return{x0:clamp(P.x-sp/2,0,WORLD-sp),y0:clamp(P.y-sp/2,0,WORLD-sp),span:sp};}
function clampMV(){const sp=WORLD/MV.z;MV.cx=clamp(MV.cx,sp/2,WORLD-sp/2);MV.cy=clamp(MV.cy,sp/2,WORLD-sp/2);}
function setZoom(z,fx,fy){const R=bigMapRect(),v=mapView(true);const u=clamp((fx-R.x)/R.s,0,1),w=clamp((fy-R.y)/R.s,0,1);const wx=v.x0+u*v.span,wy=v.y0+w*v.span;MV.z=clamp(z,1,8);const sp=WORLD/MV.z;MV.cx=wx-u*sp+sp/2;MV.cy=wy-w*sp+sp/2;clampMV();}
function mapBtns(){const R=bigMapRect();const y=R.y+R.s-30;return[{x:R.x+R.s-30,y,t:'＋',f:()=>setZoom(MV.z*1.6,R.x+R.s/2,R.y+R.s/2)},{x:R.x+R.s-84,y,t:'－',f:()=>setZoom(MV.z/1.6,R.x+R.s/2,R.y+R.s/2)},{x:R.x+R.s-138,y,t:'⌖',f:()=>{MV.cx=P.x;MV.cy=P.y;if(MV.z<2.5)MV.z=2.5;clampMV();}}];}
function mapDown(e){mapPtr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(mapPtr.size===1){mapMoved=0;mapDownT=performance.now();}else mapMoved=99;try{cv.setPointerCapture(e.pointerId);}catch(_){}
 if(mapPtr.size===2){const [a,b]=[...mapPtr.values()];mapPinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:MV.z};}e.preventDefault();}
function mapMove(e){if(state!=='map'||!mapPtr.has(e.pointerId))return;const p=mapPtr.get(e.pointerId);const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;const R=bigMapRect();
 if(mapPtr.size>=2&&mapPinch){const [a,b]=[...mapPtr.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);setZoom(mapPinch.z*d/Math.max(20,mapPinch.d),(a.x+b.x)/2,(a.y+b.y)/2);}
 else{mapMoved+=Math.abs(dx)+Math.abs(dy);if(mapMoved>8){const sp=WORLD/MV.z;MV.cx-=dx/R.s*sp;MV.cy-=dy/R.s*sp;clampMV();}}}
function mapUp(e){if(!mapPtr.has(e.pointerId))return;mapPtr.delete(e.pointerId);if(mapPtr.size<2)mapPinch=null;if(state!=='map')return;
 if(mapPtr.size===0&&mapMoved<10&&performance.now()-mapDownT<600){for(const b of mapBtns())if(Math.hypot(e.clientX-b.x,e.clientY-b.y)<26){b.f();return;}state='play';}}
function drawMap(X,Y,s,big){const v=mapView(big),k=s/v.span;const mx=x=>X+(x-v.x0)*k,my=y=>Y+(y-v.y0)*k;const z=big?MV.z:1;
 ctx.save();ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(X-2,Y-2,s+4,s+4);ctx.beginPath();ctx.rect(X,Y,s,s);ctx.clip();
 const bk=MAPRES/WORLD;ctx.imageSmoothingEnabled=true;ctx.drawImage(mapBase,v.x0*bk,v.y0*bk,v.span*bk,v.span*bk,X,Y,s,s);
 const fk=FOGN/WORLD;ctx.globalAlpha=0.92;ctx.drawImage(fogCv,v.x0*fk,v.y0*fk,v.span*fk,v.span*fk,X,Y,s,s);ctx.globalAlpha=1;
 // territory overlay
 for(const f of FORTS){const o=fortOwner(f);const X2=mx(f.x),Y2=my(f.y),r=1500*k;if(X2<X-r||X2>X+s+r||Y2<Y-r||Y2>Y+s+r)continue;ctx.fillStyle=o==='p'?'rgba(90,230,110,0.2)':hexA(CLANS[o].col,0.17);ctx.beginPath();ctx.arc(X2,Y2,r,0,TAU);ctx.fill();}
 if(big){ctx.strokeStyle='rgba(255,230,150,0.45)';ctx.lineWidth=1.5;ctx.setLineDash([6,5]);ctx.strokeRect(mx(START.x-CORE_R),my(START.y-CORE_R),2*CORE_R*k,2*CORE_R*k);
  ctx.beginPath();for(const [a,b] of [[[-1,-1],[0,0]],[[1,-1],[WORLD,0]],[[1,1],[WORLD,WORLD]],[[-1,1],[0,WORLD]]]){ctx.moveTo(mx(START.x+a[0]*CORE_R),my(START.y+a[1]*CORE_R));ctx.lineTo(mx(b[0]),my(b[1]));}ctx.stroke();ctx.setLineDash([]);}
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(const zz of SHARKZ){ctx.fillStyle='rgba(200,40,50,0.22)';ctx.beginPath();ctx.arc(mx(zz.x),my(zz.y),zz.r*k,0,TAU);ctx.fill();if(big&&z>=1.5){ctx.font='14px serif';ctx.fillText('🦈',mx(zz.x),my(zz.y));}}
 for(const f of FORTS){const o=fortOwner(f);const X2=mx(f.x),Y2=my(f.y);if(X2<X-10||X2>X+s+10||Y2<Y-10||Y2>Y+s+10)continue;const r=big?3+z:2;ctx.fillStyle=o==='p'?'#5be36a':CLANS[o].col;ctx.fillRect(X2-r,Y2-r,r*2,r*2);ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(X2-r,Y2-r,r*2,r*2);
  if(big&&z>=2.5){ctx.font='bold 10px sans-serif';ctx.fillStyle='#fff';ctx.fillText(f.name,X2,Y2+12);}const st=S.forts[f.id];if(st&&st.atk){ctx.strokeStyle='#7fd3ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X2,Y2,r+5+Math.sin(perfT*0.008)*2,0,TAU);ctx.stroke();}}
 PORTS.forEach((p,i)=>{const X2=mx(p.port.x),Y2=my(p.port.y);if(X2<X-60||X2>X+s+60||Y2<Y-20||Y2>Y+s+20)return;ctx.fillStyle=p.clan!=null?CLANS[p.clan].col:p.haven?'#ff8a6a':'#ffd34d';ctx.beginPath();ctx.arc(X2,Y2,big?4+Math.min(z,3):2.5,0,TAU);ctx.fill();
  if(big&&(z>=1.8||p.clan!=null||i===0)){ctx.font='bold '+(z>=1.8?12:11)+'px sans-serif';ctx.fillStyle='#fff';ctx.fillText((p.clan!=null?CLANS[p.clan].icon+' ':p.haven?'🏴‍☠️ ':'')+p.name+(S.vis.includes(i)&&p.haven?' ⚓':''),X2,Y2-12);}});
 for(const f of fleet){if(f.sinking)continue;ctx.fillStyle='#5be36a';ctx.fillRect(mx(f.x)-2,my(f.y)-2,big?5:3.5,big?5:3.5);}
 for(const e of enemies){if(e.sinking)continue;const lead=e.lead||e.lev;if(!lead&&!(ST.radar&&Math.hypot(e.x-P.x,e.y-P.y)<=ST.radar))continue;if(lead&&big){ctx.font='14px serif';ctx.fillText(e.lev?'🐋':'👑',mx(e.x),my(e.y));continue;}
  ctx.fillStyle=e.kind==='clan'?CLANS[e.clan].col:e.kind==='merchant'?'#9fd8ff':e.kind==='navy'?'#ffffff':'#ff4a4a';ctx.fillRect(mx(e.x)-1.5,my(e.y)-1.5,big?4:3,big?4:3);}
 for(const q of QT){ctx.font=(big?18:11)+'px serif';ctx.fillText(q.icon,mx(q.x),my(q.y));}
 ctx.save();ctx.translate(mx(P.x),my(P.y));ctx.rotate(P.h);ctx.fillStyle='#fff';ctx.beginPath();const zz=big?8:5;ctx.moveTo(zz,0);ctx.lineTo(-zz*0.7,-zz*0.6);ctx.lineTo(-zz*0.7,zz*0.6);ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();ctx.restore();
 ctx.restore();ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1.5;ctx.strokeRect(X,Y,s,s);}
function drawBigMap(){if(!mapOpen){mapOpen=true;MV.z=1;MV.cx=MV.cy=WORLD/2;mapPtr.clear();mapPinch=null;}ctx.fillStyle='rgba(5,10,20,0.78)';ctx.fillRect(0,0,vw,vh);const R=bigMapRect();drawMap(R.x,R.y,R.s,true);
 ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🗺️ Sea chart — drag to pan • pinch / ＋－ to zoom • tap to close',vw/2,R.y-14,vw-12);
 for(const b of mapBtns()){ctx.fillStyle='rgba(10,25,40,0.8)';ctx.beginPath();ctx.arc(b.x,b.y,22,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.fillText(b.t,b.x,b.y+1);}
 // legend
 const items=[['#5be36a','You']].concat(CLANS.map(c=>[c.col,c.short]));ctx.font='bold 11px sans-serif';let tw=0;for(const it of items)tw+=ctx.measureText(it[1]).width+22;let x=vw/2-tw/2;const y=Math.min(vh-8,R.y+R.s+14);
 ctx.textAlign='left';for(const it of items){ctx.fillStyle=it[0];ctx.fillRect(x,y-5,10,10);ctx.fillStyle='#fff';ctx.fillText(it[1],x+13,y);x+=ctx.measureText(it[1]).width+22;}ctx.textAlign='center';
 if(MV.z<1.8){ctx.font='11px sans-serif';ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillText('Dashed box = Crown core waters • outside: the Pirate Republic (zoom in for names)',vw/2,R.y+12,R.s-10);}}
// ---- island sprite cache ----
const islCached=[];let islEvT=0;
function ensureIsl(o){if(!o.canvas){renderIsland(o);islCached.push(o);}}
function islCacheTick(){if(islCached.length<=22)return;islCached.sort((a,b)=>Math.hypot(b.x-cam.x,b.y-cam.y)-Math.hypot(a.x-cam.x,a.y-cam.y));while(islCached.length>22){const o=islCached[0];if(Math.hypot(o.x-cam.x,o.y-cam.y)<3800)break;o.canvas=null;islCached.shift();}}
function drawIslands(x0,x1,y0,y1){let pre=1;const M=1100;for(const o of ISL){const h=o.half;if(o.x+h<x0||o.x-h>x1||o.y+h<y0||o.y-h>y1){if(!o.canvas&&pre>0&&o.x+h>x0-M&&o.x-h<x1+M&&o.y+h>y0-M&&o.y-h<y1+M){pre--;ensureIsl(o);}continue;}ensureIsl(o);ctx.drawImage(o.canvas,o.x-o.half,o.y-o.half);}}
function drawBallsX(){for(const b of balls){if(b.fx&&FXC[b.fx]&&b.fx!=='black'){ctx.strokeStyle=FXC[b.fx];ctx.lineWidth=3;ctx.globalAlpha=0.7;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*0.05,b.y-b.vy*0.05);ctx.stroke();ctx.globalAlpha=1;}
  ctx.fillStyle=b.am==='fire'?'#ff7a2a':'#111';if(b.am==='chain'){ctx.strokeStyle='#222';ctx.lineWidth=1.5;const a=perfT*0.03;ctx.beginPath();ctx.moveTo(b.x-Math.cos(a)*5,b.y-Math.sin(a)*5);ctx.lineTo(b.x+Math.cos(a)*5,b.y+Math.sin(a)*5);ctx.stroke();ctx.beginPath();ctx.arc(b.x-Math.cos(a)*5,b.y-Math.sin(a)*5,2.6,0,TAU);ctx.arc(b.x+Math.cos(a)*5,b.y+Math.sin(a)*5,2.6,0,TAU);ctx.fill();continue;}
  ctx.beginPath();ctx.arc(b.x,b.y,3.6,0,TAU);ctx.fill();}}
// actions
function actLabel(){if(actQ)return digQ?`⛏ Digging… ${Math.min(99,Math.round(digT/2.2*100))}%`:'⛏ Dig for treasure';if(stormF)return`🏴‍☠️ Storming… ${Math.min(99,Math.round(stormF.t/3*100))}%`;
 if(fortAct)return fortAct.kind==='storm'?`🏴‍☠️ Storm ${fortAct.f.name}`:`🏰 Manage ${fortAct.f.name}`;return null;}
function actTap(){if(state!=='play')return;if(actQ){startDig();return;}if(!fortAct||stormF)return;const f=fortAct.f;
 if(fortAct.kind==='manage'){openFort(f);return;}if(rankIdx()<3){toast('🔒 Storming forts needs the rank of Captain (700 infamy).');return;}if(S.crew<8){toast('👥 You need at least 8 crew to storm a fort.');return;}stormF={f,t:0};toast('🏴‍☠️ Boarding parties ashore! Hold position…');}
function expTick(dt){fortTick(dt);fortEconomy(dt);shellTick(dt);}
function expSlowTick(){clanTick();islCacheTick();retroUnlocks();}
const EXP={get FORTS(){return FORTS},CLANS,FRT,fortOwner,fortRT,captureFort,ownedForts,leadersDown,spawnSkirmish,spawnLeader,clanAt,inCore,ISL,OFF,WORLD,MV,setZoom,mapView,fastTravel,shells,cycleAmmo,
 unlockTable,unlocksAt,equipCos,openFort,closeFort,get fortAct(){return fortAct},actTap,addRep,clanHostile,genClanQ,explored,checkKing,OFFICERS,AMMO,COS,islCached,SHARKZ,fogBits:()=>fogBits(),get stormF(){return stormF},xpNeed,MAXLVL,learnLeg};
