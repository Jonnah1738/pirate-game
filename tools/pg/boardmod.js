// ================= BOARDING, DECK BRAWLS, DUELS & CAPTAIN GEAR =================
// Design note (future PvP): every fighter is a plain data unit driven by an input struct {mx,my,slash,block,pistol,dodge}.
// The local player writes its captain's input; NPC brains (aiThink/bossThink) write the others. A remote player could
// later drive any unit by sending the same input struct; the simulation (brawlStep) never reads devices directly.
const SWORDS=[['🗡️','Rusty Cutlass',1,0,12],['⚔️','Fine Saber',6,350,16],['🗡️','Damascus Cutlass',14,1000,21],['🤺','Toledo Rapier',24,2400,27],['🔱','Kraken Blade',38,5200,34]];
const PISTOLS=[['🔫','Flintlock',1,0,2,22,4.5],['🔫','Double-barrel',10,650,3,26,4],['🔫','Duck-foot Pistol',20,1700,4,31,3.6],['🐉','Dragon Pistol',34,4200,5,40,3.2]];
const ARMORS=[['👕','Linen Shirt',1,0,0,0],['🧥','Leather Jerkin',4,260,0.08,15],['🧥','Buff Coat',12,850,0.15,30],['🛡️','Steel Cuirass',24,2100,0.22,45],['👑',"Admiral's Plate",36,4600,0.3,60]];
const GEAR={sw:SWORDS,pi:PISTOLS,ar:ARMORS};const GEARN={sw:'Swords',pi:'Pistols',ar:'Armour'};
const STYLES={duel:['🤺','Duelist','Wider parry window, 20% critical hits (×1.8); every parry sets up a guaranteed crit'],brawl:['💪','Brawler','+30% captain HP, +10% slash damage, heavy knockback (send them overboard!)'],gun:['🔫','Gunslinger','+2 pistol shots, 40% faster reload, +25% pistol damage']};
const STYLE_LVL=5;
const CREWG={cw:['⚔️','Crew weapons',['Belaying pins','Boarding axes','Cutlasses','Sabres','Kraken steel'],[0,400,1100,2400,4800],'+15% crew damage per level'],
 ca:['🛡️','Crew armour',['Rags','Padded vests','Leather','Mail shirts','Steel'],[0,350,1000,2200,4400],'+12% crew HP and +5% damage reduction per level'],
 tr:['🏋️','Crew training',['Green','Drilled','Seasoned','Veteran','Elite','Legendary'],[0,300,800,1700,3200,5500],'Tougher, harder-hitting boarders']};
const BOSS_STYLE=['flame','shadow','iron','serpent'];
const BOSS_INFO={flame:'throws fire bombs (red circles) and sweeps flame (cone) — dodge out of the red',shadow:'dashes along a dark line, vanishes and strikes from behind — watch for the circle at your back',
 iron:'his shield blocks attacks from the front; after a hammer slam (ring) he is staggered — strike then!',serpent:'fires pistol fans (lines) and lashes a long whip — sidestep the lines',
 brute:'lunges (arrow) and smashes the ground (circle) — dodge, then punish',admiral:'aimed pistol shots and calls marines — keep moving and take him down fast'};
function capStats(){const c=S.cap,L=S.clvl|0,sw=SWORDS[c.sw]||SWORDS[0],pi=PISTOLS[c.pi]||PISTOLS[0],ar=ARMORS[c.ar]||ARMORS[0],st=c.sty,o=S.off||{};
 return{hp:Math.round((120+6*L+ar[5])*(st==='brawl'?1.3:1)*(1+0.01*(S.leg|0))),dmg:sw[4]*(1+0.012*L)*(st==='brawl'?1.1:1),red:ar[4],
  shots:pi[4]+(st==='gun'?2:0)+(o.mg?1:0)+(sk('gun')>=4?1:0),pdmg:pi[5]*(1+0.01*L)*(st==='gun'?1.25:1),prl:pi[6]*(st==='gun'?0.6:1),parry:st==='duel'?0.3:0.18,crit:st==='duel'?0.2:0.05,kb:st==='brawl'?1.7:1};}
function crewStats(){const c=S.cap,o=S.off||{};const cl=2+(S.clvl|0)*0.2+(c.tr|0)*1.1;return{hp:(26+5.5*cl)*(1+0.12*(c.ca|0))*(o.fm?1.1:1),dmg:(3.8+1.4*cl)*(1+0.15*(c.cw|0))*(o.bo?1.12:1),red:0.05*(c.ca|0),lvl:cl};}
function foeLvl(e){return Math.max(1,e.lvl+(e.kind==='merchant'?-1.5:e.kind==='navy'||e.kind==='clan'?1:e.kind==='boss'||e.lead?2:e.lev?3:0));}
function foeTotal(e){const L=e.lvl;let n=e.kind==='merchant'?4+1.5*L:e.kind==='navy'||e.kind==='clan'?8+2.5*L:(e.kind==='boss'||e.lead||e.lev)?10+3*L:6+2*L;n*=0.5+0.5*clamp(e.hp/e.maxHp,0,1);return Math.max(3,Math.round(n));}
function isDuelFoe(e){return e.kind==='boss'||!!e.lead||!!e.lev;}
// ---------------- world side: grappling ----------------
const GRAP_R=150;let grapTgt=null,grapCd=0,raidCap=false;const GR={e:null,t:0,ph:'',ok:true,mode:'deck',side:1};
function canGrap(e){return e&&!e.sinking&&!e.surr&&!e.tut&&!e.grap&&e.hp>0&&e.kind!=='fleet';}
function grapRisky(e){return e.hp>=e.maxHp*0.5;}
function grapScan(){grapTgt=null;if(state!=='play'||P.dead||T.on||tutPeace||GR.e||BR.on||grapCd>0||boardTgt||nearSafePort(P.x,P.y))return;let bd=GRAP_R;
 for(const e of enemies){if(!canGrap(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-e.len*0.3;if(d<bd){bd=d;grapTgt=e;}}
 if(grapTgt&&!S.tips.grapple)showTip('grapple');}
function grappleStart(e){if(!e||!canGrap(e)||state!=='play'||GR.e||BR.on||P.dead)return;initAudio();
 const risky=grapRisky(e);let fail=risky?(isDuelFoe(e)?0.55:0.35)*(S.off.bo?0.75:1):0;GR.e=e;GR.t=0;GR.ph='throw';GR.ok=Math.random()>=fail;GR.mode=isDuelFoe(e)?'duel':'deck';
 GR.side=((e.x-P.x)*Math.sin(P.h)-(e.y-P.y)*Math.cos(P.h))<0?1:-1;
 const was=e.angry;e.angry=true;if(e.kind==='merchant'&&!was)addHeat(0.3);else if(e.kind==='navy')addHeat(0.5);clanDmg(e,was);convoyAlarm(e);
 toast(risky?'🪝 Hooks away! They are still fighting fit — this could fail…':'🪝 Hooks away!');boom(0.2,600);}
function repelTry(e,dt){if(!(e.kind==='pirate'||e.kind==='clan')||e.lead||e.surr||e.lvl<6||(S.clvl|0)<8||state!=='play'||BR.on||GR.e||T.on||tutPeace||P.dead||grapCd>0||S.playTime<(BR.repT||0))return false;
 if(!isHostile(e)||e.hp<e.maxHp*0.45||nearSafePort(P.x,P.y))return false;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>125||Math.random()>dt*0.12)return false;
 GR.e=e;GR.t=0;GR.ph='pull';GR.ok=true;GR.mode='repel';GR.side=((e.x-P.x)*Math.sin(P.h)-(e.y-P.y)*Math.cos(P.h))<0?1:-1;e.grap=true;
 toast(`🪝 The ${e.kind==='clan'?CLANS[e.clan].short+' ship':'pirates'} throw grappling hooks — REPEL BOARDERS!`);boom(0.4,500);return true;}
function grapSpot(e){const c=Math.cos(P.h),s=Math.sin(P.h),off=(P.wid||20)/2+(e.wid||18)/2+6;return{x:P.x-s*off*GR.side,y:P.y+c*off*GR.side};}
function grapPin(e,dt){const sp=grapSpot(e);if(GR.e===e&&GR.ph==='pull'){const k=Math.min(1,dt*4);e.x+=(sp.x-e.x)*k;e.y+=(sp.y-e.y)*k;e.h+=angDiff(e.h,P.h)*k;}else{e.x=sp.x;e.y=sp.y;e.h=P.h;}e.vx=e.vy=0;e.speed=0;}
function boardTick(dt){if(grapCd>0)grapCd-=dt;
 if(GR.e){const e=GR.e;GR.t+=dt;if(e.sinking||!enemies.includes(e)||P.dead){e.grap=false;GR.e=null;}
  else if(GR.ph==='throw'){P.throttle*=0.95;if(GR.t>=0.45){if(!GR.ok||Math.hypot(e.x-P.x,e.y-P.y)>GRAP_R+80){GR.e=null;grapCd=4;toast('✂️ They cut your grappling lines! Batter her hull first (below half) for a sure grab.');}else{GR.ph='pull';GR.t=0;e.grap=true;}}}
  else if(GR.ph==='pull'){P.throttle*=0.9;if(GR.t>=0.8){const m=GR.mode;GR.e=null;startBrawl(e,m);}}}
 if(state==='play'&&!T.on&&S.tips&&!S.tips.boardnews&&(S.clvl|0)>=STYLE_LVL&&S.playTime>8){S.tips.boardnews=1;toast('⚔️ NEW: grappling & boarding! Pull alongside a damaged ship and tap 🪝 Board. Gear up in the ⚔️ Arms tab at any 🏴‍☠️ haven.');}}
function drawGrapple(){const e=GR.e||(BR.on&&BR.e);if(!e)return;const k=GR.e&&GR.ph==='throw'?Math.min(1,GR.t/0.45):1;ctx.strokeStyle='#e8d5a0';ctx.lineWidth=2;
 for(let i=-1;i<=1;i++){const c=Math.cos(P.h),s=Math.sin(P.h);const ax=P.x+c*i*P.len*0.3,ay=P.y+s*i*P.len*0.3,bx=e.x+c*i*e.len*0.3,by=e.y+s*i*e.len*0.3;
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+(bx-ax)*k,ay+(by-ay)*k);ctx.stroke();ctx.fillStyle='#555';ctx.beginPath();ctx.arc(ax+(bx-ax)*k,ay+(by-ay)*k,2.5,0,TAU);ctx.fill();}}
// ---------------- fort gate raid ----------------
function raidStart(f){if(state!=='play'||BR.on)return;if(rankIdx()<3){toast('🔒 Raiding forts needs the rank of Captain (700 infamy).');return;}if(S.crew<8){toast('👥 You need at least 8 crew for a landing party.');return;}startBrawl(null,'fort',f);}
// ---------------- brawl core ----------------
const BR={on:false,ph:'',mode:'',e:null,f:null,u:[],tg:[],fx:[],deco:[],t:0,zt:0,tac:'',sides:[],me:null,foeCap:null,cam:{x:0,y:0},bg:null,shk:0,repT:0,msg:'',msgT:0,uid:0,endT:0,out:'',auto:false,blockHeld:0,res:null,hint:0,fires:[]};
const AREAS={deck:{a:[[-170,170,30,250],[-170,170,-250,-30],[-130,-90,-52,52],[-20,20,-52,52],[90,130,-52,52]],obs:[[-80,140,13],[80,140,13],[-80,-140,13],[80,-140,13]],fall:true,b:[-230,230,-290,290]},
 fort:{a:[[-190,190,30,190],[-210,210,-300,-30],[-48,48,-52,52]],obs:[[-140,-200,16],[140,-210,16],[-60,-250,14]],fall:false,b:[-240,240,-320,230]}};
function arena(){return AREAS[BR.mode==='fort'?'fort':'deck'];}
function walk(x,y,r){for(const a of arena().a)if(x>=a[0]+r*0.6&&x<=a[1]-r*0.6&&y>=a[2]+r*0.6&&y<=a[3]-r*0.6)return true;return false;}
function onSide(y,side){return side===0?y>0:y<0;}
function mkUnit(side,o){return Object.assign({id:++BR.uid,side,x:0,y:0,vx:0,vy:0,face:side?Math.PI/2:-Math.PI/2,hp:50,max:50,dmg:5,red:0,spd:95,r:10,cap:false,boss:'',t:0,cd:rand(0.2,0.9),stun:0,inv:0,dodge:0,dodgeCd:0,ddx:0,ddy:0,blk:0,blkT:9,combo:0,comboT:0,swing:0,swT:0.35,shots:0,maxShots:0,rl:0,prl:5,pdmg:10,pcd:0,over:0,dead:0,crit:0,kb:1,rip:0,parry:0.18,
 ai:{tgt:null,rt:0,blk:0,pt:2,act:null,mar:0},inp:{mx:0,my:0,slash:0,block:0,pistol:0,dodge:0},hitT:0,col:'#888',hat:'band',hc:'#c0392b',name:'',fade:0,dash:null,flinch:0,anim:Math.random()*6},o);}
function foeLook(e){if(!e)return{col:'#6b5a46',hat:'helm',hc:'#7f8c8d',hull:'#7d7d7d',trim:'#555'};if(e.kind==='navy'||e.lev)return{col:'#2b4a8a',hat:'bicorne',hc:'#1b2a4a',hull:'#8a6a45',trim:'#2b4a8a'};
 if(e.kind==='merchant')return{col:'#d8cfb8',hat:'cap',hc:'#7a6a4a',hull:'#c49a5c',trim:'#8a6a3a'};if(e.kind==='clan'||e.lead)return{col:CLANS[e.clan|0].col,hat:'band',hc:CLANS[e.clan|0].sail,hull:'#6b4a2a',trim:CLANS[e.clan|0].col};
 if(e.kind==='boss')return{col:'#3a3a3a',hat:'tricorn',hc:'#111',hull:'#3a2a1e',trim:'#d4a017'};return{col:'#8e2a22',hat:'band',hc:'#222',hull:'#6b4a2a',trim:'#a33'};}
function startBrawl(e,mode,f){if(BR.on)return;if(e)e.grap=true;releaseInput();hideTip();const cs=capStats(),cr=crewStats(),o=S.off||{};
 Object.assign(BR,{on:true,ph:'zoom',mode,e,f:f||null,u:[],tg:[],fx:[],deco:[],fires:[],t:0,zt:0,tac:'',me:null,foeCap:null,shk:0,msg:'',msgT:0,endT:0,out:'',res:null,blockHeld:0,hint:6,boss:null});
 const L=mode==='fort'?f.lvl+2:foeLvl(e),look=foeLook(e);BR.look=look;BR.L=L;
 const vis0=Math.min(8,6+(o.fm?1:0)+(sk('cmd')>=4?1:0));const pool0=Math.max(0,S.crew-1);
 let pool1=mode==='fort'?Math.round((8+2.2*f.lvl)*(0.6+0.4*gunsUp(fortRT(f))/Math.max(1,fortRT(f).guns.length))):foeTotal(e);if(mode==='repel')pool1=Math.round(pool1*0.6);if(mode!=='fort'&&e&&grapRisky(e))pool1=Math.round(pool1*1.25);
 const mk0=(n)=>({pool:n,pool0:n,w:Math.max(1,n/(vis0*1.6)),vis:vis0,spT:0,deaths:0,tac:'charge'});
 BR.sides=[mk0(pool0),{pool:pool1,pool0:pool1,w:Math.max(1,pool1/(8*1.6)),vis:8,spT:0,deaths:0,tac:mode==='fort'?'hold':e&&e.kind==='merchant'?'hold':e&&(e.kind==='navy'||e.lev)?'pistols':'charge'}];
 {const w=Math.max(1,Math.max(pool0,pool1)/(vis0*1.6));BR.sides[0].w=w;BR.sides[1].w=w;}
 BR.cs0=cr;BR.cs1={hp:24+5*L,dmg:3.5+1.3*L,red:0};
 const me=mkUnit(0,{cap:true,x:0,y:mode==='repel'?150:mode==='fort'?120:95,hp:cs.hp,max:cs.hp,dmg:cs.dmg,red:cs.red,spd:128,r:12,shots:cs.shots,maxShots:cs.shots,prl:cs.prl,pdmg:cs.pdmg,crit:cs.crit,kb:cs.kb,parry:cs.parry,swT:0.15,col:'#7b2d26',hat:'tricorn',hc:'#111',name:'You'});
 BR.me=me;BR.u.push(me);
 if(mode==='duel'){const st=e.lead?BOSS_STYLE[e.clan|0]:e.lev?'admiral':'brute';const nm=e.lead?CLANS[e.clan|0].leader:e.lev?'Admiral Thorne':(e.name||'The Captain');
  const b=mkUnit(1,{cap:true,boss:st,x:0,y:-150,hp:Math.round((300+70*L)*(e.lev?1.5:1)),dmg:7+2.1*L,red:0.1,spd:118,r:15,swT:0.3,col:look.col,hat:st==='iron'?'helm':'tricorn',hc:st==='flame'?'#8e1b1b':look.hc,name:nm,shots:99,maxShots:99,prl:3,pdmg:10+2*L});b.max=b.hp;BR.foeCap=b;BR.boss=b;BR.u.push(b);
  for(let i=0;i<7;i++){BR.deco.push({x:-150+i*50,y:236,side:0,col:'#4a6b8a',hc:'#c0392b',ph:Math.random()*6});BR.deco.push({x:-150+i*50,y:-236,side:1,col:look.col,hc:look.hc,ph:Math.random()*6});}
  BR.sides[0].pool=BR.sides[0].pool0;BR.sides[1].pool=0;}
 else{const capNm=mode==='fort'?'Fort Commander':e.kind==='merchant'?'Merchant Captain':e.kind==='navy'?'Navy Lieutenant':e.kind==='clan'?CLANS[e.clan|0].short+' Captain':'Pirate Captain';
  const c=mkUnit(1,{cap:true,x:0,y:mode==='fort'?-250:-175,hp:Math.round((120+30*L)*(e&&e.kind==='merchant'?0.7:1)),dmg:5+1.8*L,red:0.08,spd:110,r:13,swT:0.3,col:look.col,hat:mode==='fort'||e.kind==='navy'?'bicorne':'tricorn',hc:look.hc,name:capNm,shots:2,maxShots:2,prl:6,pdmg:8+2*L});c.max=c.hp;BR.foeCap=c;BR.u.push(c);
  for(let s=0;s<2;s++){const sd=BR.sides[s];const n=Math.min(sd.vis,Math.ceil(sd.pool/sd.w));for(let i=0;i<n;i++)spawnFighter(s,true);}}
 BR.cam.x=me.x;BR.cam.y=me.y-30;buildArenaBg();document.body.classList.add('brawl');state='brawl';
 if(T.on===false&&!S.tips.brawl)S.tips.brawl=1;}
function spawnFighter(s,initial){const sd=BR.sides[s],cs=s?BR.cs1:BR.cs0,m=BR.mode,look=BR.look;let x,y;
 if(m==='repel'&&s===1){x=rand(-140,140);y=initial?rand(-25,-110):-200;if(initial&&Math.random()<0.5){const pk=[-110,0,110][(Math.random()*3)|0];x=pk+rand(-10,10);y=rand(-20,20);}}
 else if(m==='fort'){x=rand(-160,160);y=s?(initial?rand(-260,-90):-285):(initial?rand(70,170):178);}
 else{x=rand(-150,150);y=s?(initial?rand(-215,-60):-232):(initial?rand(60,215):232);}
 const navy=s===1&&BR.e&&(BR.e.kind==='navy'||BR.e.lev);const gun=s===1?Math.random()<(navy?0.45:0.15):Math.random()<0.2;
 const u=mkUnit(s,{x,y,hp:cs.hp*rand(0.9,1.1),dmg:cs.dmg*rand(0.9,1.1),red:cs.red,spd:rand(88,102)*(s===0&&BR.tac==='charge'?1.12:1),r:10,swT:rand(0.32,0.42),
  col:s?look.col:(Math.random()<0.5?'#3d5a80':'#6b4f2a'),hat:s?(look.hat==='bicorne'?'cap':look.hat==='cap'?'cap':look.hat==='helm'?'helm':'band'):'band',hc:s?look.hc:pick(['#c0392b','#e67e22','#2c3e50','#8e44ad']),
  shots:gun?1:0,maxShots:gun?1:0,prl:7,pdmg:(s?7+1.6*BR.L:12+(S.clvl|0)*0.5)});u.max=u.hp;if(!initial){u.inv=0.5;}BR.u.push(u);return u;}
function aliveSide(s,capToo){let n=0;for(const u of BR.u)if(u.side===s&&!u.dead&&!u.over&&(capToo||!u.cap))n++;return n;}
function chooseTactic(t){if(BR.ph!=='pick')return;BR.tac=t;BR.sides[0].tac=t;$('brPick').classList.add('hidden');BR.ph='fight';BR.t=0;
 if(t==='charge')for(const u of BR.u)if(u.side===0&&!u.cap)u.spd*=1.12;
 if(BR.mode==='duel')say(`⚔️ ${BR.boss.name}: "${pick(['Your blood will feed the tide!','Let us settle this, blade to blade.','I have sunk better captains than you.','Kneel, and I may let you live.'])}"`,3);
 else say(t==='pistols'?'🔫 Pistols first — FIRE!':t==='hold'?'🛡️ Hold the line, lads!':'⚔️ CHARGE!',1.6);boom(0.5,300);}
function say(m,t){BR.msg=m;BR.msgT=t||2;}
function addFx(k,x,y,o){if(BR.fx.length>160)BR.fx.shift();BR.fx.push(Object.assign({k,x,y,t:0,T:0.4},o||{}));}
function foesOf(u){return BR.u.filter(v=>v.side!==u.side&&!v.dead&&!v.over&&!(v.fade>0.5));}
function nearestFoe(u,maxD,cone){let b=null,bd=maxD||1e9;for(const v of BR.u){if(v.side===u.side||v.dead||v.over||v.fade>0.5)continue;const d=Math.hypot(v.x-u.x,v.y-u.y);if(d>=bd)continue;if(cone&&Math.abs(angDiff(u.face,Math.atan2(v.y-u.y,v.x-u.x)))>cone)continue;bd=d;b=v;}return b;}
function startSwing(u){if(u.swing>0||u.cd>0||u.stun>0||u.dodge>0||u.over||u.dash)return;const t=nearestFoe(u,90);if(t)u.face=Math.atan2(t.y-u.y,t.x-u.x);
 if(u.comboT>0&&u.combo<3)u.combo++;else u.combo=1;u.swing=0.0001;u.sw0=u.swT*(u.combo===3?1.4:1);}
function resolveSwing(u){const heavy=u.combo===3;let dm=u.dmg*(heavy?1.6:1);let crit=false;if(u.rip||Math.random()<u.crit){dm*=1.8;crit=true;u.rip=0;}
 const R=u.r+26+(u.cap?6:0);let hits=0;const maxH=u.cap?3:1;const cand=[];
 for(const v of BR.u){if(v.side===u.side||v.dead||v.over)continue;const d=Math.hypot(v.x-u.x,v.y-u.y);if(d>R+v.r)continue;if(Math.abs(angDiff(u.face,Math.atan2(v.y-u.y,v.x-u.x)))>1.3)continue;cand.push([d,v]);}
 cand.sort((a,b)=>a[0]-b[0]);for(const [,v] of cand){if(hits>=maxH)break;hits++;applyHit(u,v,dm,(heavy?240:90)*u.kb,{crit});}
 addFx('arc',u.x,u.y,{a:u.face,r:R,T:0.15,heavy,col:u.side?'#ffd0c0':'#ffffff'});u.comboT=0.55;u.cd=u===BR.me?(heavy?0.7:0.38):(u.cap?rand(0.5,0.9):rand(0.7,1.3))*(u.side===0&&BR.tac==='charge'?0.88:1);if(heavy)u.combo=0;}
function applyHit(src,v,dmg,kb,o){o=o||{};if(v.dead||v.over)return false;if(v.inv>0||v.fade>0.5){if(v===BR.me)addFx('txt',v.x,v.y-24,{s:'dodge!',c:'#bde3ff'});return false;}
 const ang=src?Math.atan2(src.y-v.y,src.x-v.x):Math.atan2((o.y||0)-v.y,(o.x||0)-v.x);const front=Math.abs(angDiff(v.face,ang))<1.45;
 if(v.boss==='iron'&&front&&v.stun<=0&&!o.ub){dmg*=0.25;kb*=0.2;addFx('spark',v.x+Math.cos(ang)*v.r,v.y+Math.sin(ang)*v.r,{T:0.25});if(src===BR.me&&Math.random()<0.3)say('🛡️ His shield holds! Wait for the slam, then strike.',1.4);}
 else if(v.blk&&front&&!o.ub){if(v.blkT<v.parry&&!o.proj&&src){src.stun=src.boss?0.8:1.1;src.swing=0;src.dash=null;v.rip=v===BR.me&&S.cap.sty==='duel'?1:v.rip;addFx('spark',v.x+Math.cos(ang)*v.r,v.y+Math.sin(ang)*v.r,{T:0.35,big:1});addFx('txt',v.x,v.y-26,{s:'✨ PARRY!',c:'#ffe066'});
   if(v===BR.me){S.bst.parry=(S.bst.parry|0)+1;chime();}boom(0.15,1200);return false;}
  dmg*=src&&src.boss?0.3:0.2;kb*=0.3;addFx('spark',v.x+Math.cos(ang)*v.r,v.y+Math.sin(ang)*v.r,{T:0.2});}
 if(v.side===0&&!v.cap&&BR.tac==='hold'&&v.y>-31)dmg*=0.75;dmg*=1-v.red;v.hp-=dmg;v.hitT=0.15;
 addFx('txt',v.x,v.y-22,{s:(o.crit?'💥':'')+Math.round(dmg),c:v.side?'#ffd27a':'#ff8080'});if(v===BR.me){BR.shk=Math.max(BR.shk,5);}
 const kk=kb*(v.boss?0.3:v.cap?0.6:1);v.vx-=Math.cos(ang)*kk;v.vy-=Math.sin(ang)*kk;if(!v.cap&&!v.boss){if(dmg>4)v.swing=0;v.flinch=0.15;}
 if(v.hp<=0)killUnit(v,src);return true;}
function killUnit(v,src){if(v.dead)return;v.dead=1;v.hp=0;addFx('poof',v.x,v.y,{T:0.5});const sd=BR.sides[v.side];
 if(!v.cap){sd.pool=Math.max(0,sd.pool-sd.w);sd.deaths++;if(v.side===1&&src===BR.me)S.bst.ko=(S.bst.ko|0)+1;else if(v.side===1)S.bst.ko=(S.bst.ko|0)+0.34;}
 else if(v.side===1){say(BR.mode==='duel'?`☠ ${v.name} falls!`:`☠ The ${v.name} is down!`,2);}}
function firePistol(u){if(u.shots<=0||u.pcd>0||u.stun>0||u.over||u.dodge>0)return;let t=nearestFoe(u,300,0.9)||nearestFoe(u,300);if(!t){if(u===BR.me)addFx('txt',u.x,u.y-26,{s:'no target',c:'#ddd'});return;}
 u.face=Math.atan2(t.y-u.y,t.x-u.x);u.shots--;u.pcd=0.35;if(u.shots<u.maxShots&&u.rl<=0)u.rl=0.0001;
 addFx('shot',u.x,u.y,{x2:t.x,y2:t.y,T:0.18});addFx('smoke',u.x+Math.cos(u.face)*14,u.y+Math.sin(u.face)*14,{T:0.6});boom(0.25,900);
 const miss=u!==BR.me&&Math.random()<0.25;if(!miss)applyHit(u,t,u.pdmg,60,{proj:true});}
function npcShoot(u,t){// telegraphed NPC pistol shot along a line (dodge or block it)
 const a=Math.atan2(t.y-u.y,t.x-u.x);u.face=a;u.shots--;u.rl=0.0001;u.pcd=1.2;BR.tg.push({k:'line',src:u,x:u.x,y:u.y,a,len:320,w:9,t:0,T:0.6,dmg:u.pdmg,kb:70,proj:1,follow:1});}
// ---- AI ----
function holdOK(u){const sd=BR.sides[u.side];return sd.tac!=='hold'||BR.t>12||(u.side===1&&BR.mode==='fort'&&BR.t>8);}
// path helper: crossing between decks (or through the fort gate) only works over the gangplanks
const PLANKS={deck:[-110,0,110],fort:[0]};
function moveTo(u,tx,ty){const inp=u.inp;let gx=tx,gy=ty;const gap=BR.mode==='fort'?31:31;
 if(Math.sign(u.y)!==Math.sign(ty)&&(Math.abs(ty)>gap-4||Math.abs(u.y)>gap-4)){const xs=PLANKS[BR.mode==='fort'?'fort':'deck'],hw=BR.mode==='fort'?30:8;let px=xs[0],bd=1e9;for(const x of xs){const d=Math.abs(u.x-x)+Math.abs(tx-x);if(d<bd){bd=d;px=x;}}
  if(Math.abs(u.x-px)>hw){gx=px;gy=Math.sign(u.y||1)*(gap+16);if(Math.abs(u.y)<gap+20)gy=u.y;}else{gx=px+clamp(u.x-px,-hw*0.5,hw*0.5);gy=ty;}}
 const dx=gx-u.x,dy=gy-u.y,l=Math.hypot(dx,dy);if(l>2){inp.mx=dx/l;inp.my=dy/l;}}
function pickTarget(u){let best=null,bd=1e9;const me=BR.me;for(const v of BR.u){if(v.side===u.side||v.dead||v.over||v.fade>0.5)continue;let d=Math.hypot(v.x-u.x,v.y-u.y);
  if(u.side===1&&v===me&&(u.cap||u.id%3===0))d*=0.8;if(u.side===0&&me.hp<me.max*0.4&&Math.hypot(v.x-me.x,v.y-me.y)<90)d*=0.5;
  if(!holdOK(u)&&!onSide(v.y,u.side)&&Math.abs(v.y)>31)d+=400;if(d<bd){bd=d;best=v;}}return best;}
function aiThink(u,dt){const a=u.ai,inp=u.inp;inp.mx=inp.my=0;inp.slash=0;inp.pistol=0;inp.dodge=0;
 if(a.blk>0){a.blk-=dt;inp.block=1;}else inp.block=0;
 a.rt-=dt;if(a.rt<=0||!a.tgt||a.tgt.dead||a.tgt.over){a.rt=rand(0.4,0.8);a.tgt=pickTarget(u);}
 const t=a.tgt;
 if(u.cap&&u.side===1&&BR.mode!=='duel'&&BR.t<6&&BR.sides[1].pool>BR.sides[1].pool0*0.5&&!(t&&Math.hypot(t.x-u.x,t.y-u.y)<70)){if(t)u.face=Math.atan2(t.y-u.y,t.x-u.x);
  if(t&&u.shots>0&&u.pcd<=0&&Math.hypot(t.x-u.x,t.y-u.y)<300&&Math.random()<dt*0.5)npcShoot(u,t);return;}
 if(!t)return;const dx=t.x-u.x,dy=t.y-u.y,d=Math.hypot(dx,dy);
 const hold=!holdOK(u)&&!onSide(t.y,u.side)&&Math.abs(t.y)>31;
 if(u.maxShots>0&&u.shots>0&&u.pcd<=0&&d>70&&d<300&&Math.random()<dt*(BR.sides[u.side].tac==='pistols'?1.5:0.35)){if(u.side===1)npcShoot(u,t);else firePistol(u);return;}
 if(hold){const ay=u.side===0?58:-58;const ax=clamp(u.x,-150,150);if(Math.hypot(ax-u.x,ay-u.y)>8)moveTo(u,ax,ay);u.face=Math.atan2(dy,dx);return;}
 const reach=u.r+t.r+16;if(d>reach){moveTo(u,t.x,t.y);}else{u.face=Math.atan2(dy,dx);if(u.cd<=0&&u.swing<=0)inp.slash=1;}
 // react to an incoming swing: sometimes raise the guard
 if(t.swing>0&&d<reach+20&&a.blk<=0&&Math.random()<(u.cap?0.35:0.18)*(t===BR.me?1:0.6))a.blk=0.45;}
function bossThink(u,dt){const a=u.ai,inp=u.inp,me=BR.me;inp.mx=inp.my=0;inp.slash=0;inp.block=0;inp.pistol=0;inp.dodge=0;if(u.stun>0||u.dash||me.dead)return;
 const dx=me.x-u.x,dy=me.y-u.y,d=Math.hypot(dx,dy),aim=Math.atan2(dy,dx);
 if(a.act){a.act.t-=dt;if(a.act.t<=0)a.act=null;else{if(a.act.lock)return;}}
 a.pt-=dt;const rage=u.hp<u.max*0.5?1.35:1;
 if(a.pt<=0&&!a.act&&BR.tg.filter(g=>g.src===u).length===0){a.pt=rand(1.6,2.6)/rage;bossMove(u,me,aim,d,rage);return;}
 if(u.fade>0)return;
 const reach=u.r+me.r+16;if(d>reach){moveTo(u,me.x,me.y);}else{u.face=aim;if(u.cd<=0&&u.swing<=0)inp.slash=1;}
 if(u.boss==='serpent'&&d<60&&Math.random()<dt*0.6){const s=Math.random()<0.5?1:-1;u.vx+=Math.cos(aim+s*1.57)*260;u.vy+=Math.sin(aim+s*1.57)*260;}}
function bossMove(u,me,aim,d,rage){const st=u.boss,D=u.dmg;u.face=aim;
 const tg=(o)=>BR.tg.push(Object.assign({src:u,t:0},o));
 if(st==='shadow'){const r=Math.random();
  if(r<0.4){tg({k:'line',x:u.x,y:u.y,a:aim,len:Math.min(320,d+90),w:26,T:0.65/rage,dmg:D*1.4,kb:200,ub:1,follow:1,after:()=>{u.dash={vx:Math.cos(u.face)*620,vy:Math.sin(u.face)*620,t:Math.min(0.5,(d+90)/620),hit:{}};}});u.ai.act={t:0.9,lock:1};}
  else if(r<0.7){u.fade=1;u.inv=1.3;u.ai.act={t:1.3,lock:1};const bx=me.x-Math.cos(me.face)*42,by=me.y-Math.sin(me.face)*42;
   tg({k:'circle',x:bx,y:by,r:30,T:0.8,dmg:D*1.2,kb:150,after:()=>{u.x=clamp(bx,-160,160);u.y=clamp(by,-240,240);u.fade=0;u.inv=0;u.face=Math.atan2(me.y-u.y,me.x-u.x);u.swing=0;u.cd=0;startSwing(u);}});}
  else{u.ai.act={t:1.2,lock:0};u.swT=0.2;u.cd=0;u.combo=0;setTimeout(()=>{if(BR.on)u.swT=0.3;},1300);say('🌑 Triple slash — block or parry!',1);} }
 else if(st==='flame'){if(Math.random()<0.55){for(let i=0;i<3;i++){const bx=clamp(me.x+(i?rand(-70,70):0),-160,160),by=clamp(me.y+(i?rand(-70,70):0),-240,240);tg({k:'circle',x:bx,y:by,r:40,T:1.0+i*0.15,dmg:D*1.1,kb:160,ub:1,fire:1});}u.ai.act={t:0.8,lock:1};}
  else{tg({k:'cone',x:u.x,y:u.y,a:aim,r:125,sp:0.85,T:0.7/rage,dmg:D*1.25,kb:170,ub:1,follow:1,fire:1});u.ai.act={t:0.9,lock:1};}}
 else if(st==='iron'){if(Math.random()<0.55||d<110){tg({k:'ring',x:u.x,y:u.y,r:100,T:0.95/rage,dmg:D*1.5,kb:340,ub:1,follow:1,after:()=>{u.stun=1.7;say('⚙️ Staggered — STRIKE NOW!',1.4);BR.shk=8;}});u.ai.act={t:1.1,lock:1};}
  else{tg({k:'line',x:u.x,y:u.y,a:aim,len:Math.min(300,d+60),w:30,T:0.7/rage,dmg:D*1.2,kb:260,ub:1,follow:1,after:()=>{u.dash={vx:Math.cos(u.face)*460,vy:Math.sin(u.face)*460,t:Math.min(0.6,(d+60)/460),hit:{}};}});u.ai.act={t:1.0,lock:1};}}
 else if(st==='serpent'){if(Math.random()<0.55){const n=rage>1?7:5;for(let i=0;i<n;i++)tg({k:'line',x:u.x,y:u.y,a:aim+(i-(n-1)/2)*0.2,len:320,w:9,T:0.75/rage,dmg:D*0.7,kb:60,proj:1,follow:1});u.ai.act={t:0.9,lock:1};}
  else{tg({k:'line',x:u.x,y:u.y,a:aim,len:175,w:18,T:0.45/rage,dmg:D*1.0,kb:-160,follow:1});u.ai.act={t:0.6,lock:1};}}
 else if(st==='admiral'){const marines=BR.u.filter(v=>v.side===1&&!v.cap&&!v.dead).length;
  if(Math.random()<0.3&&marines<3&&u.ai.mar<=S.playTime){u.ai.mar=S.playTime+12;for(let i=0;i<2;i++){const m=spawnFighter(1,false);m.x=rand(-120,120);m.y=-230;}say('⚓ "Marines, to me!"',1.4);}
  else{tg({k:'line',x:u.x,y:u.y,a:aim,len:340,w:10,T:0.6/rage,dmg:D*1.1,kb:80,proj:1,follow:1});u.ai.act={t:0.7,lock:1};}}
 else{if(Math.random()<0.5){tg({k:'line',x:u.x,y:u.y,a:aim,len:Math.min(220,d+40),w:28,T:0.6/rage,dmg:D*1.3,kb:220,ub:1,follow:1,after:()=>{u.dash={vx:Math.cos(u.face)*520,vy:Math.sin(u.face)*520,t:Math.min(0.42,(d+40)/520),hit:{}};}});u.ai.act={t:0.9,lock:1};}
  else{tg({k:'circle',x:me.x,y:me.y,r:52,T:0.75/rage,dmg:D*1.6,kb:260,ub:1,after:()=>{u.x+=(me.x-u.x)*0.3;u.y+=(me.y-u.y)*0.3;}});u.ai.act={t:0.9,lock:1};}}}
function tgHits(g,v){if(g.k==='circle')return Math.hypot(v.x-g.x,v.y-g.y)<g.r+v.r*0.5;if(g.k==='ring')return Math.hypot(v.x-g.x,v.y-g.y)<g.r+v.r*0.5;
 if(g.k==='cone'){const d=Math.hypot(v.x-g.x,v.y-g.y);return d<g.r+v.r&&Math.abs(angDiff(g.a,Math.atan2(v.y-g.y,v.x-g.x)))<g.sp;}
 if(g.k==='line'){const c=Math.cos(g.a),s=Math.sin(g.a),rx=v.x-g.x,ry=v.y-g.y,along=rx*c+ry*s,perp=Math.abs(-rx*s+ry*c);return along>-v.r&&along<g.len&&perp<g.w/2+v.r*0.7;}return false;}
function tgTick(dt){for(let i=BR.tg.length-1;i>=0;i--){const g=BR.tg[i];g.t+=dt;if(g.follow&&g.src&&!g.src.dead&&g.t<g.T*0.6){g.x=g.src.x;g.y=g.src.y;}
  if(g.src&&(g.src.dead||g.src.stun>0)&&!g.ship){BR.tg.splice(i,1);continue;}
  if(g.t<g.T)continue;BR.tg.splice(i,1);
  if(g.k==='line'&&g.proj){// bullets: first victim along the line
   let best=null,bd=1e9;for(const v of BR.u){if(v.dead||v.over||(g.src&&v.side===g.src.side))continue;if(!tgHits(g,v))continue;const d=Math.hypot(v.x-g.x,v.y-g.y);if(d<bd){bd=d;best=v;}}
   addFx('shot',g.x,g.y,{x2:g.x+Math.cos(g.a)*(best?bd:g.len),y2:g.y+Math.sin(g.a)*(best?bd:g.len),T:0.15});addFx('smoke',g.x,g.y,{T:0.5});boom(0.2,900);if(best)applyHit(g.src,best,g.dmg,g.kb,{proj:1});}
  else if(!(g.k==='line'&&g.after)){for(const v of BR.u){if(v.dead||v.over)continue;if(g.src&&v.side===g.src.side)continue;if(tgHits(g,v))applyHit(g.src,v,g.dmg,g.kb,{ub:g.ub,x:g.x,y:g.y});}
   if(g.k==='circle'||g.k==='ring'){addFx('boom',g.x,g.y,{r:g.r,T:0.35});BR.shk=Math.max(BR.shk,g.ship?7:4);boom(0.35,250);}
   if(g.k==='cone')addFx('cone',g.x,g.y,{a:g.a,r:g.r,sp:g.sp,T:0.3});
   if(g.fire)BR.fires.push({r:g.k==='cone'?40:g.r*0.8,t:2.5,cx:g.k==='cone'?g.x+Math.cos(g.a)*g.r*0.6:g.x,cy:g.k==='cone'?g.y+Math.sin(g.a)*g.r*0.6:g.y,src:g.src});}
  if(g.after)g.after();}}
function brawlShipHit(dmg){if(!BR.on||BR.ph!=='fight')return;const A=arena().a[0];const x=rand(A[0]+30,A[1]-30),y=rand(A[2]+20,A[3]-20);BR.tg.push({k:'circle',x,y,r:36,t:0,T:0.55,dmg:10+dmg*0.5,kb:200,ub:1,ship:1,src:null});say('💣 Incoming cannon fire on our deck!',1);}
function sharksNear(){if(inSharkZone(P.x,P.y))return true;for(const s of sharks)if(!s.harmless&&!s.sinking&&Math.hypot(s.x-P.x,s.y-P.y)<650)return true;return false;}
function goOverboard(u){u.over=0.001;u.swing=0;u.dash=null;u.vx=u.vy=0;addFx('splash',u.x,u.y,{T:0.7});boom(0.15,500);u.eaten=!u.cap&&sharksNear()&&Math.random()<0.7;
 if(u===BR.me)say(sharksNear()?'🦈 Overboard — with SHARKS! Climb back!':'🌊 Overboard! Climbing back aboard…',1.6);else if(u.side===1&&u.eaten)S.bst.feed=(S.bst.feed|0)+1;}
function overTick(u,dt){u.over+=dt;if(u.eaten&&u.over>0.9&&!u.dead){addFx('fin',u.x,u.y,{T:1});killUnit(u,null);u.over=0;u.dead=1;return;}
 if(u.cap&&sharksNear())u.hp-=dt*u.max*0.12;if(u.hp<=0){u.over=0;killUnit(u,null);return;}
 const T0=u.cap?2.4:4.5;if(u.over>=T0){u.over=0;const A=arena().a[u.side];u.x=clamp(u.x,A[0]+20,A[1]-20);u.y=u.side===0?A[3]-25:A[2]+25;u.inv=1;if(u.cap)u.hp=Math.max(1,u.hp-u.max*0.12);}}
function stepUnit(u,dt){if(u.dead)return;if(u.over){overTick(u,dt);return;}
 u.anim+=dt;u.hitT-=dt;u.inv=Math.max(0,u.inv-dt);u.cd-=dt;u.comboT-=dt;u.pcd-=dt;u.dodgeCd-=dt;u.flinch-=dt;if(u.stun>0)u.stun-=dt;
 if(u.rl>0&&u.shots<u.maxShots){u.rl+=dt;if(u.rl>=u.prl){u.shots++;u.rl=u.shots<u.maxShots?0.0001:0;}}
 const inp=u.inp;
 // block
 if(inp.block&&u.stun<=0&&u.dodge<=0&&!u.dash){if(!u.blk){u.blk=1;u.blkT=0;}else u.blkT+=dt;}else{u.blk=0;}
 if(u.stun<=0&&!u.dash){if(inp.slash&&!u.blk)startSwing(u);if(inp.pistol)firePistol(u);
  if(inp.dodge&&u.dodgeCd<=0&&u.dodge<=0){let dx=inp.mx,dy=inp.my;if(Math.hypot(dx,dy)<0.2){dx=-Math.cos(u.face);dy=-Math.sin(u.face);}const l=Math.hypot(dx,dy)||1;u.ddx=dx/l;u.ddy=dy/l;u.dodge=0.3;u.inv=0.32;u.dodgeCd=0.85;u.swing=0;addFx('puff',u.x,u.y,{T:0.3});}}
 inp.slash=0;inp.pistol=0;inp.dodge=0;
 if(u.swing>0){u.swing+=dt;if(u.swing>=u.sw0){u.swing=0;resolveSwing(u);}}
 let mvx=0,mvy=0;
 if(u.dash){const D=u.dash;D.t-=dt;mvx=D.vx;mvy=D.vy;for(const v of BR.u){if(v.side===u.side||v.dead||v.over||D.hit[v.id])continue;if(Math.hypot(v.x-u.x,v.y-u.y)<u.r+v.r+4){D.hit[v.id]=1;applyHit(u,v,u.dmg*1.3,240,{ub:1});}}if(D.t<=0)u.dash=null;}
 else if(u.dodge>0){u.dodge-=dt;mvx=u.ddx*330;mvy=u.ddy*330;}
 else if(u.stun<=0){const l=Math.hypot(inp.mx,inp.my);if(l>0.05){const k=Math.min(1,l);const sp=u.spd*(u.blk?0.45:1)*(u.swing>0?0.35:1)*(u.flinch>0?0.4:1);mvx=inp.mx/l*sp*k;mvy=inp.my/l*sp*k;if(u.swing<=0&&!(u===BR.me&&u.blk))u.face=Math.atan2(inp.my,inp.mx);}}
 for(const f of BR.fires){if(Math.hypot(u.x-f.cx,u.y-f.cy)<f.r&&(!f.src||f.src.side!==u.side)){u.hp-=dt*6;u.hitT=0.05;if(u.hp<=0){killUnit(u,f.src);return;}}}
 const vx=mvx+u.vx,vy=mvy+u.vy;const sp=Math.hypot(u.vx,u.vy);u.vx*=Math.pow(0.02,dt);u.vy*=Math.pow(0.02,dt);
 const nx=u.x+vx*dt,ny=u.y+vy*dt;
 if(walk(nx,ny,u.r)){u.x=nx;u.y=ny;}
 else if(arena().fall&&sp>150&&!u.boss){u.x=nx;u.y=ny;goOverboard(u);return;}
 else{if(walk(nx,u.y,u.r))u.x=nx;else u.vx*=-0.3;if(walk(u.x,ny,u.r))u.y=ny;else u.vy*=-0.3;if(u.dash)u.dash=null;}
 for(const o of arena().obs){const dx=u.x-o[0],dy=u.y-o[1],d=Math.hypot(dx,dy),m=o[2]+u.r;if(d<m&&d>0.01){u.x=o[0]+dx/d*m;u.y=o[1]+dy/d*m;}}}
function separate(){const U=BR.u;for(let i=0;i<U.length;i++){const a=U[i];if(a.dead||a.over)continue;for(let j=i+1;j<U.length;j++){const b=U[j];if(b.dead||b.over)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;
  if(d<m&&d>0.01){const p=(m-d)/2,ux=dx/d,uy=dy/d;const wa=a.boss?0.1:a.cap?0.4:0.5,wb=b.boss?0.1:b.cap?0.4:0.5;const ax=a.x-ux*p*wa*2,ay=a.y-uy*p*wa*2,bx=b.x+ux*p*wb*2,by=b.y+uy*p*wb*2;if(walk(ax,ay,a.r)){a.x=ax;a.y=ay;}if(walk(bx,by,b.r)){b.x=bx;b.y=by;}}}}}
function readLocalInput(){const me=BR.me,inp=me.inp;if(BR.auto){aiThink(me,1/60);for(const g of BR.tg){if(g.src&&g.src.side===0)continue;if(g.t>g.T-0.4&&tgHits(g,me)&&me.dodgeCd<=0){const a=g.k==='line'?g.a+Math.PI/2:Math.atan2(me.y-g.y,me.x-g.x);inp.mx=Math.cos(a);inp.my=Math.sin(a);inp.dodge=1;break;}}return;}inp.mx=0;inp.my=0;
 if(joy.id!==null){const dx=joy.x-joy.bx,dy=joy.y-joy.by,l=Math.hypot(dx,dy);if(l>6){const k=clamp((l-6)/40,0,1);inp.mx=dx/l*k;inp.my=dy/l*k;}}
 const kx=(keys['arrowright']||keys['d']?1:0)-(keys['arrowleft']||keys['a']?1:0),ky=(keys['arrowdown']||keys['s']?1:0)-(keys['arrowup']||keys['w']?1:0);if(kx||ky){const l=Math.hypot(kx,ky);inp.mx=kx/l;inp.my=ky/l;}
 inp.block=BR.blockHeld||keys['k']?1:0;}
function brawlStep(dt){BR.t+=dt;if(BR.msgT>0)BR.msgT-=dt;if(BR.hint>0)BR.hint-=dt;BR.shk=Math.max(0,BR.shk-dt*20);
 readLocalInput();
 if(BR.tac==='pistols'&&!BR.volley&&BR.t>0.5){BR.volley=1;for(const u of BR.u){if(u.side!==0||u.cap||u.dead)continue;const t=pick(foesOf(u));if(t&&Math.random()<0.75){addFx('shot',u.x,u.y,{x2:t.x,y2:t.y,T:0.2});applyHit(u,t,(BR.cs0.hp*0.55),50,{proj:1});}addFx('smoke',u.x,u.y-8,{T:0.7});}boom(0.6,700);for(const u of BR.u)if(u.side===0&&!u.cap)u.dmg*=0.9;}
 if(BR.sides[1].tac==='pistols'&&!BR.evolley&&BR.t>1.2&&BR.mode!=='duel'){BR.evolley=1;for(const u of BR.u){if(u.side!==1||u.cap||u.dead)continue;const t=pick(foesOf(u));if(t)BR.tg.push({k:'line',src:u,x:u.x,y:u.y,a:Math.atan2(t.y-u.y,t.x-u.x),len:300,w:9,t:0,T:0.7,dmg:BR.cs1.dmg*1.4,kb:50,proj:1});}say('🔫 They are aiming — dodge or block!',1.2);}
 for(const u of BR.u){if(u===BR.me||u.dead||u.over)continue;if(u.boss)bossThink(u,dt);else aiThink(u,dt);}
 for(const u of BR.u)stepUnit(u,dt);separate();tgTick(dt);
 for(let i=BR.fires.length-1;i>=0;i--){const f=BR.fires[i];f.t-=dt;if(f.t<=0)BR.fires.splice(i,1);}
 for(let i=BR.fx.length-1;i>=0;i--){const f=BR.fx[i];f.t+=dt;if(f.t>=f.T)BR.fx.splice(i,1);}
 // reinforcements from the hold (the crowd beyond the visible fighters)
 if(BR.mode!=='duel')for(let s=0;s<2;s++){const sd=BR.sides[s];const want=Math.min(sd.vis,Math.ceil(sd.pool/sd.w-1e-6));const have=aliveSide(s,false)+BR.u.filter(u=>u.side===s&&u.over&&!u.cap).length;
  if(have<want){sd.spT-=dt;if(sd.spT<=0){sd.spT=1.1;spawnFighter(s,false);}}}
 if(BR.u.length>60)BR.u=BR.u.filter(u=>!u.dead||u.cap||u===BR.me);
 // outcome
 const me=BR.me,fc=BR.foeCap;
 if(BR.e&&(BR.e.sinking||!enemies.includes(BR.e))){endBrawl('sunk');return;}if(P.dead){endBrawl('ship');return;}
 if(me.dead||me.hp<=0){endBrawl('lose');return;}
 if(fc&&fc.dead){endBrawl('win');return;}
 if(BR.mode!=='duel'&&BR.sides[1].pool<=0.01&&aliveSide(1,false)===0&&BR.t>1){if(fc&&!fc.dead){say(`🏳️ The ${fc.name} throws down his sword!`,2);fc.dead=1;}endBrawl('win');}}
function endBrawl(kind){if(BR.ph!=='fight'&&BR.ph!=='pick')return;BR.ph='end';BR.endT=kind==='retreat'?0.2:1.1;BR.out=kind;$('brPick').classList.add('hidden');
 if(kind==='win')say(BR.mode==='duel'?'🏆 VICTORY!':'🏴‍☠️ The deck is ours!',2);else if(kind==='lose')say('💀 You fall…',2);else if(kind==='retreat')say('✂️ Cut the ropes!',1);boom(0.5,300);}
function brawlFrame(dt){if(!BR.on){state='play';return;}
 if(BR.ph==='zoom'){BR.zt=Math.min(1,BR.zt+dt/0.55);if(BR.zt>=1){BR.ph='pick';showPick();}return;}
 if(BR.ph==='pick')return;
 if(BR.ph==='fight'){update(dt);if(state!=='brawl')return;brawlStep(dt);return;}
 if(BR.ph==='end'){BR.endT-=dt;for(let i=BR.fx.length-1;i>=0;i--){const f=BR.fx[i];f.t+=dt;if(f.t>=f.T)BR.fx.splice(i,1);}if(BR.endT<=0){BR.ph='res';showResult();}return;}
 if(BR.ph==='out'){BR.zt=Math.max(0,BR.zt-dt/0.4);if(BR.zt<=0)finishOut();return;}}
function crewLoss(extra){const sd=BR.sides[0];let lost=(sd.pool0-sd.pool)*0.65*(S.off.sg?0.65:1)+(extra||0);if(BR.mode==='fort'&&sk('war')>=2)lost*=0.5;return Math.max(0,Math.round(lost));}
function lootGoods(e,mult){const goods={};if(!e)return goods;if(e.kind==='merchant'){const n=Math.round((3+Math.random()*4+e.lvl*1.5)*mult),gi=Math.min(4,(Math.random()*(1+e.lvl/2.2))|0);goods[GOODS[gi].id]=n;}
 else if(Math.random()<0.6){const gi=Math.min(4,(Math.random()*(1+e.lvl/2))|0);goods[GOODS[gi].id]=(2+Math.random()*4)|0;}if(isDuelFoe(e))goods.gems=(goods.gems||0)+2+(e.lvl>>1);return goods;}
function addGoods(goods){let s='';for(const k in goods){const n=Math.min(goods[k],Math.max(0,ST.cargoCap-cargoUsed()));if(n>0){S.cargo[k]+=n;const g=GOODS.find(x=>x.id===k);s+=` +${n}${g?g.icon:''}`;}}return s;}
function showResult(){const e=BR.e,k=BR.out,L=BR.L,me=BR.me,o=[];let title='',btns=[];
 const unitsAcross=BR.u.filter(u=>u.side===0&&!u.cap&&!u.dead&&!u.over&&!onSide(u.y,0)).length;
 let lost=crewLoss(k==='retreat'?unitsAcross*BR.sides[0].w*0.5:k==='lose'?1+Math.random()*2:0);lost=Math.min(lost,Math.max(0,S.crew-2));S.crew-=lost;recalc();
 if(k==='win'){S.bst.win=(S.bst.win|0)+1;const pm=(sk('plun')>=1?1.12:1)*(sk('plun')>=6?1.15:1);
  if(BR.mode==='fort'){S.bst.raid=(S.bst.raid|0)+1;const g=Math.round((150+60*BR.f.lvl)*pm);S.gold+=g;S.earned+=g;grantXP((25+12*L)*2);title=`🚪 ${BR.f.name}'s gate is broken!`;o.push(`Your landing party storms the courtyard and the garrison yields.`,`💰 +${g} from the fort's strongbox`);btns=[['fortwin','🏴‍☠️ Raise your flag!']];}
  else{const dm=BR.mode==='duel'?1.8:1.3;const g=Math.round(e.gold*dm*pm);S.gold+=g;S.earned+=g;const gs=addGoods(lootGoods(e,1));
   let rec=0;if(e.kind!=='navy'&&!e.lev){const room=Math.max(0,ST.maxCrew-S.crew);rec=Math.min(room,Math.round((BR.sides[1].pool0*0.25)*rand(0.5,1.1)*(BR.mode==='duel'?0.5:1)));}else if(Math.random()<0.3&&ST.maxCrew>S.crew)rec=1;S.crew+=rec;recalc();
   if(e.kind==='navy'||e.lev)addHeat(1);S.infamy+=Math.round(e.lvl*8*(BR.mode==='duel'?3:1));grantXP((25+12*L)*(BR.mode==='duel'?3:1));if(BR.mode==='repel')S.bst.repel=(S.bst.repel|0)+1;if(BR.mode==='duel')S.bst.duel=(S.bst.duel|0)+1;
   title=BR.mode==='duel'?`🏆 You defeated ${BR.boss.name}!`:BR.mode==='repel'?'🛡️ Boarders repelled — and their ship is yours for the taking!':`🏴‍☠️ You took the ${e.name||'ship'}!`;
   o.push(`💰 +${g} gold${gs}`);if(rec)o.push(`👥 ${rec} of their crew join you`);
   const can=!isDuelFoe(e),full=S.fleet.length>=fleetCap();
   btns=can?[['seize',full?`⛓ Fleet full (${fleetCap()})`:'⛓ Seize her for your fleet',!full],['scuttle','🔥 Scuttle & loot her',true]]:[['scuttle','🔥 Send her to the bottom!',true]];}}
 else if(k==='lose'){S.bst.loss=(S.bst.loss|0)+1;title='💀 Your captain was beaten!';o.push('Your crew drag you back aboard and cut the ropes.');
  if(BR.mode==='repel'){const g=Math.round(S.gold*0.12);S.gold-=g;let c=0;for(const gg of GOODS){const n=Math.ceil(S.cargo[gg.id]*0.5);c+=n;S.cargo[gg.id]-=n;}o.push(`The boarders loot ${g} 💰${c?` and ${c} crates`:''}.`);}
  grantXP(5+L);btns=[['ok','Continue',true]];}
 else if(k==='retreat'){S.bst.ret=(S.bst.ret|0)+1;title='✂️ You cut the ropes and pulled away';btns=[['ok','Continue',true]];}
 else if(k==='sunk'){title='🌊 The enemy ship went down under your feet!';o.push('Your crew scramble back aboard.');btns=[['ok','Continue',true]];}
 else{title='💥 Your ship is sinking!';btns=[['ok','Continue',true]];}
 if(lost)o.push(`☠ Crew lost: ${lost} (${S.crew} left${S.off.sg?' — your surgeon saved many':''})`);
 o.push(`⚔️ Your captain: ${Math.max(0,Math.ceil(me.hp))}/${me.max} HP`);
 BR.res={k};$('brTitle').textContent=title;$('brTxt').innerHTML=o.join('<br>');
 $('brBtns').innerHTML=btns.map(b=>`<button class="b${b[0]==='scuttle'?' red':''}" data-br="${b[0]}"${b[2]===false?' disabled':''}>${b[1]}</button>`).join('');$('brRes').classList.remove('hidden');save();}
function resChoice(c){if(BR.ph!=='res')return;$('brRes').classList.add('hidden');BR.choice=c;BR.ph='out';}
function finishOut(){const e=BR.e,c=BR.choice||'ok',k=BR.out;BR.on=false;BR.ph='';document.body.classList.remove('brawl');state='play';releaseInput();BR.blockHeld=0;
 BR.repT=S.playTime+90;grapCd=5;
 if(e){e.grap=false;}
 if(k==='win'&&BR.mode==='fort'){raidCap=true;try{captureFort(BR.f);}finally{raidCap=false;}}
 else if(k==='win'&&e&&!e.sinking){if(c==='seize'&&!isDuelFoe(e)&&S.fleet.length<fleetCap()){e.surr=true;e.hp=Math.max(e.hp,e.maxHp*0.4);if(e.kind==='clan')clanSunk(e);seize(e);}
  else{const n=loot.length;damageEnemy(e,e.hp+99999);for(let i=n;i<loot.length;i++){loot[i].x=P.x;loot[i].y=P.y;}}}
 else if(e&&!e.sinking){const c2=Math.cos(P.h),s2=Math.sin(P.h);e.x+=-s2*GR.side*40;e.y+=c2*GR.side*40;e.angry=true;if(BR.mode==='repel'&&k==='lose'){e.flee=8;}}
 if(P.dead&&P.dead<2.2)P.dead=2.21;
 BR.e=null;BR.u=[];BR.tg=[];BR.fx=[];BR.bg=null;save();}
function cutRopes(){if(!BR.on)return;if(BR.ph==='pick'){BR.ph='fight';BR.t=0;$('brPick').classList.add('hidden');if(BR.mode==='repel'&&Math.random()<0.45){say('✂️ The hooks hold! FIGHT!',1.6);BR.tac='hold';BR.sides[0].tac='hold';return;}endBrawl('retreat');return;}
 if(BR.ph==='fight'){if(!BR.cutArm||BR.t-BR.cutArm>2.5){BR.cutArm=BR.t;say('✂️ Tap again to cut the ropes and retreat',1.5);return;}endBrawl('retreat');}}
function showPick(){const m=BR.mode,e=BR.e,sd=BR.sides;let t,info;const L=Math.round(BR.L);
 if(m==='duel'){t=`⚔️ Duel! ${BR.boss.name}`;info=`${BR.boss.name} faces you alone, blade to blade (Lv${L}). ${BOSS_INFO[BR.boss.boss]}.`;}
 else if(m==='repel'){t='🪝 Boarders! Repel them!';info=`About <b>${Math.round(sd[1].pool0)}</b> boarders (Lv${L}) are swarming over the rail. Your crew: <b>${Math.round(sd[0].pool0)}</b>. Beat their captain or clear the deck.`;}
 else if(m==='fort'){t=`🚪 Storm the gate — ${BR.f.name}`;info=`Garrison of about <b>${Math.round(sd[1].pool0)}</b> (Lv${L}) behind the broken gate. Your landing party: <b>${Math.round(sd[0].pool0)}</b>. Beat the commander or clear the courtyard. Remaining fort cannons will shell your beach!`;}
 else{t=`🪝 Boarding the ${e.name||(e.kind==='merchant'?'merchantman':e.kind==='navy'?'navy ship':'enemy ship')}!`;info=`Enemy crew about <b>${Math.round(sd[1].pool0)}</b> (Lv${L})${grapRisky(e)?' — fresh and fighting fit (+25%)':''}. Your crew: <b>${Math.round(sd[0].pool0)}</b>. Win by beating their captain or clearing the deck.`;}
 $('bpTitle').textContent=t;$('bpInfo').innerHTML=info;
 const T3=[['charge','⚔️ Charge!','Crew rush across fast and hit hard (+12% speed, quicker swings)'],['hold','🛡️ Hold the Line','Crew guard your deck (−25% damage taken), then advance'],['pistols','🔫 Pistols First','Opening volley wounds their front rank; slightly weaker blades after']];
 $('bpTacs').innerHTML=m==='duel'?`<button class="b" data-tac="charge">⚔️ Fight! (key 1)</button>`:T3.map((x,i)=>`<button class="b tac" data-tac="${x[0]}"><b>${x[1]}</b><small>${x[2]}</small></button>`).join('');
 $('bpHelp').innerHTML=IS_TOUCH?'🕹️ Drag anywhere to move • ⚔️ tap to slash (3-hit combo) • 🛡️ hold to block — tap it just before a hit to <b>parry</b> • 🔫 pistol • 💨 dodge roll (dodges red attacks)':'⌨️ WASD/arrows move • J/Space slash • K block (tap just before a hit = parry) • L pistol • Shift/I dodge • X cut ropes';
 $('bpCut').textContent=m==='repel'?'✂️ Try to cut their ropes':'✂️ Cut the ropes';$('brPick').classList.remove('hidden');}
// ---------------- rendering ----------------
function buildArenaBg(){const c=document.createElement('canvas'),K=2,b=arena().b,W=b[1]-b[0],H=b[3]-b[2];c.width=W*K;c.height=H*K;const g=c.getContext('2d');g.scale(K,K);g.translate(-b[0],-b[2]);
 const plank=(x0,x1,y0,y1,base,line)=>{g.fillStyle=base;g.fillRect(x0,y0,x1-x0,y1-y0);g.strokeStyle=line;g.lineWidth=1;for(let y=y0+7;y<y1;y+=14){g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke();}
  for(let y=y0;y<y1;y+=14){const off=((y/14)|0)%2?40:0;for(let x=x0+off;x<x1;x+=80){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+7);g.stroke();}}};
 const hull=(y0,y1,flip,col,trim)=>{g.fillStyle=col;g.beginPath();g.moveTo(-205,y0);g.lineTo(175,y0);g.quadraticCurveTo(232,(y0+y1)/2,175,y1);g.lineTo(-205,y1);g.quadraticCurveTo(-222,(y0+y1)/2,-205,y0);g.fill();g.strokeStyle=trim;g.lineWidth=5;g.stroke();};
 if(BR.mode!=='fort'){const L=BR.look;
  hull(18,262,0,'#5a3a1a','#c9a227');plank(-176,176,26,254,'#a8743a','rgba(60,35,10,.45)');
  hull(-262,-18,1,L.hull,L.trim);plank(-176,176,-254,-26,L.hull==='#c49a5c'?'#d4ac70':'#9a6a38','rgba(60,35,10,.45)');
  for(const [x0,x1] of [[-128,-92],[-18,18],[92,128]]){g.fillStyle='#c79a5a';g.fillRect(x0,-34,x1-x0,68);g.strokeStyle='#6b4a22';g.lineWidth=2;g.strokeRect(x0,-34,x1-x0,68);for(let y=-30;y<34;y+=9){g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke();}}
  for(const [x,y] of AREAS.deck.obs){g.fillStyle='#4a2c12';g.beginPath();g.arc(x,y,13,0,TAU);g.fill();g.fillStyle='#6b4423';g.beginPath();g.arc(x,y,8,0,TAU);g.fill();}
  for(const s of [1,-1]){for(let x=-150;x<=150;x+=50){g.fillStyle='#222';g.fillRect(x-9,s*256-4,18,8);}g.fillStyle='#6b4a22';g.fillRect(-30,s*190-14,60,28);g.strokeStyle='#3b2306';g.strokeRect(-30,s*190-14,60,28);
   for(const bx of [-150,150]){g.fillStyle='#7b5230';g.beginPath();g.arc(bx,s*85,11,0,TAU);g.fill();g.strokeStyle='#3b2306';g.lineWidth=2;g.stroke();}}}
 else{const col=BR.f?(CLANS[BR.f.clan]||{col:'#999'}).col:'#999';
  g.fillStyle='#d9c08a';g.fillRect(-240,24,480,170);g.fillStyle='#c2a66d';for(let i=0;i<60;i++){g.beginPath();g.arc(rand(-230,230),rand(30,190),rand(1,3),0,TAU);g.fill();}
  g.fillStyle='#8a8a8a';g.fillRect(-240,-320,480,290);g.strokeStyle='rgba(40,40,40,.35)';g.lineWidth=1;for(let y=-320;y<-30;y+=24)for(let x=-240+((y/24)&1)*20;x<240;x+=40)g.strokeRect(x,y,40,24);
  g.fillStyle='#5d5d5d';g.fillRect(-240,-44,192,26);g.fillRect(48,-44,192,26);g.fillStyle='#4a4a4a';for(const x of [-235,-48,48,215])g.fillRect(x-12,-58,32,44);
  g.fillStyle='#3a2a1a';g.save();g.translate(-48,-31);g.rotate(-0.5);g.fillRect(0,-4,40,8);g.restore();g.save();g.translate(48,-31);g.rotate(3.6);g.fillRect(0,-4,40,8);g.restore();
  g.fillStyle='#9c8a6a';g.fillRect(-46,-30,92,58);g.strokeStyle='rgba(60,45,25,.5)';g.lineWidth=1.5;for(let y=-26;y<28;y+=12)for(let x=-46+((y/12)&1)*12;x<46;x+=24)g.strokeRect(x,y,24,12);g.fillStyle='#5d4a32';g.fillRect(-50,-30,5,58);g.fillRect(45,-30,5,58);
  g.fillStyle=col;g.fillRect(-6,-300,12,40);g.fillRect(6,-300,30,18);
  for(const [x,y,r] of AREAS.fort.obs){g.fillStyle='#6b4423';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.strokeStyle='#3b2306';g.lineWidth=2;g.stroke();}
  g.fillStyle='#6b4a22';g.save();g.translate(-150,165);g.rotate(0.2);g.fillRect(-26,-10,52,20);g.restore();g.save();g.translate(150,168);g.rotate(-0.2);g.fillRect(-26,-10,52,20);g.restore();}
 BR.bg=c;}
function brSc(){return clamp(Math.min(vw,vh)/400,0.85,1.6);}
function drawUnit(g,u,ts){if(u.dead)return;const r=u.r;
 if(u.over){g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(u.x,u.y,r+4+Math.sin(ts*6)*2,0,TAU);g.fill();g.fillStyle='#e0b48a';g.beginPath();g.arc(u.x,u.y,r*0.6,0,TAU);g.fill();return;}
 if(u.fade>0)g.globalAlpha=0.18;
 g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(u.x+2,u.y+4,r*1.05,r*0.7,0,0,TAU);g.fill();
 const bob=Math.sin(u.anim*10)*(Math.hypot(u.inp.mx,u.inp.my)>0.1?1.2:0);
 // sword
 let sa=u.face+0.9;if(u.swing>0){sa=u.face-1.3*(u.combo%2?1:-1);}else if(u.comboT>0.35){sa=u.face+1.1*(u.combo%2?1:-1);}
 g.strokeStyle=u.boss==='iron'?'#666':'#dfe6ee';g.lineWidth=u.cap?3.2:2.4;const hx=u.x+Math.cos(u.face+0.9)*r*0.8,hy=u.y+Math.sin(u.face+0.9)*r*0.8+bob;g.beginPath();g.moveTo(hx,hy);g.lineTo(hx+Math.cos(sa)*(u.boss==='iron'?20:18+(u.cap?4:0)),hy+Math.sin(sa)*(u.boss==='iron'?20:18+(u.cap?4:0)));g.stroke();
 if(u.boss==='iron'){g.fillStyle='#7f8c8d';g.beginPath();g.arc(u.x+Math.cos(u.face)*r*0.9,u.y+Math.sin(u.face)*r*0.9,r*0.65,u.face-1.3,u.face+1.3);g.fill();}
 g.fillStyle=u.hitT>0?'#fff':u.col;g.beginPath();g.arc(u.x,u.y+bob,r,0,TAU);g.fill();g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1.2;g.stroke();
 g.fillStyle='#e0b48a';g.beginPath();g.arc(u.x+Math.cos(u.face)*r*0.25,u.y+Math.sin(u.face)*r*0.25+bob,r*0.58,0,TAU);g.fill();
 g.fillStyle=u.hc;const hx2=u.x+Math.cos(u.face)*r*0.2,hy2=u.y+Math.sin(u.face)*r*0.2+bob;
 if(u.hat==='tricorn'){g.beginPath();for(let i=0;i<3;i++){const a=u.face+Math.PI+i*TAU/3;g.lineTo(hx2+Math.cos(a)*r*0.95,hy2+Math.sin(a)*r*0.95);}g.closePath();g.fill();if(u===BR.me){g.fillStyle='#ffd34d';g.beginPath();g.arc(hx2,hy2,2.4,0,TAU);g.fill();}}
 else if(u.hat==='bicorne'){g.save();g.translate(hx2,hy2);g.rotate(u.face+Math.PI/2);g.fillRect(-r*0.95,-r*0.3,r*1.9,r*0.6);g.restore();}
 else if(u.hat==='helm'){g.beginPath();g.arc(hx2,hy2,r*0.62,0,TAU);g.fill();}
 else if(u.hat==='cap'){g.beginPath();g.arc(hx2,hy2,r*0.5,0,TAU);g.fill();}
 else{g.beginPath();g.arc(hx2,hy2,r*0.55,u.face+Math.PI*0.6,u.face+Math.PI*1.4);g.fill();}
 if(u.blk){g.strokeStyle='rgba(120,190,255,.9)';g.lineWidth=3;g.beginPath();g.arc(u.x,u.y,r+5,u.face-1.1,u.face+1.1);g.stroke();}
 if(u.swing>0&&u!==BR.me){g.strokeStyle=u.side?'rgba(255,90,60,.85)':'rgba(255,255,255,.6)';g.lineWidth=2;g.beginPath();g.arc(u.x,u.y,r+12,u.face-0.9,u.face+0.9);g.stroke();}
 if(u.stun>0){g.fillStyle='#ffe066';g.font='bold 10px sans-serif';g.textAlign='center';g.fillText('★ ★',u.x+Math.sin(ts*8)*4,u.y-r-8);}
 if(u===BR.me){g.strokeStyle='#ffd34d';g.lineWidth=2;g.beginPath();g.arc(u.x,u.y+r*0.4,r+4,0.3,Math.PI-0.3);g.stroke();}
 if(u.cap||u.hp<u.max*0.98){const w=u.cap?30:18;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(u.x-w/2,u.y-r-7,w,3.5);g.fillStyle=u.side?'#e74c3c':'#2ecc71';g.fillRect(u.x-w/2,u.y-r-7,w*clamp(u.hp/u.max,0,1),3.5);}
 g.globalAlpha=1;}
function drawTg(g,tg,ts){const k=clamp(tg.t/tg.T,0,1);const red=tg.ub?'255,40,30':'255,170,40';g.lineWidth=2;
 if(tg.k==='circle'||tg.k==='ring'){g.fillStyle=`rgba(${red},${0.12+0.25*k})`;g.strokeStyle=`rgba(${red},.9)`;g.beginPath();g.arc(tg.x,tg.y,tg.r,0,TAU);g.fill();g.stroke();g.beginPath();g.arc(tg.x,tg.y,tg.r*k,0,TAU);g.stroke();}
 else if(tg.k==='cone'){g.fillStyle=`rgba(${red},${0.12+0.25*k})`;g.beginPath();g.moveTo(tg.x,tg.y);g.arc(tg.x,tg.y,tg.r,tg.a-tg.sp,tg.a+tg.sp);g.closePath();g.fill();g.strokeStyle=`rgba(${red},.9)`;g.stroke();}
 else if(tg.k==='line'){g.save();g.translate(tg.x,tg.y);g.rotate(tg.a);g.fillStyle=`rgba(${red},${0.1+0.25*k})`;g.fillRect(0,-tg.w/2,tg.len,tg.w);g.fillStyle=`rgba(${red},.85)`;g.fillRect(0,-1,tg.len*k,2);g.restore();}}
function drawFx(g,f,ts){const k=f.t/f.T;
 if(f.k==='arc'){g.strokeStyle=f.col;g.globalAlpha=1-k;g.lineWidth=f.heavy?5:3;g.beginPath();g.arc(f.x,f.y,f.r,f.a-1.1,f.a+1.1);g.stroke();g.globalAlpha=1;}
 else if(f.k==='spark'){g.strokeStyle='#ffe066';g.lineWidth=2;for(let i=0;i<(f.big?8:5);i++){const a=i*1.3+f.x;const l=(f.big?16:9)*(0.4+k);g.beginPath();g.moveTo(f.x,f.y);g.lineTo(f.x+Math.cos(a)*l,f.y+Math.sin(a)*l);g.stroke();}}
 else if(f.k==='txt'){g.globalAlpha=1-k;g.fillStyle=f.c;g.font='bold 12px sans-serif';g.textAlign='center';g.strokeStyle='rgba(0,0,0,.7)';g.lineWidth=3;g.strokeText(f.s,f.x,f.y-k*18);g.fillText(f.s,f.x,f.y-k*18);g.globalAlpha=1;}
 else if(f.k==='shot'){g.strokeStyle=`rgba(255,240,180,${1-k})`;g.lineWidth=2;g.beginPath();g.moveTo(f.x,f.y);g.lineTo(f.x2,f.y2);g.stroke();}
 else if(f.k==='smoke'||f.k==='puff'){g.fillStyle=`rgba(220,220,220,${0.5*(1-k)})`;g.beginPath();g.arc(f.x,f.y-k*8,6+k*10,0,TAU);g.fill();}
 else if(f.k==='poof'){g.fillStyle=`rgba(255,255,255,${0.7*(1-k)})`;for(let i=0;i<5;i++){const a=i*1.256;g.beginPath();g.arc(f.x+Math.cos(a)*k*16,f.y+Math.sin(a)*k*16,5*(1-k)+2,0,TAU);g.fill();}}
 else if(f.k==='boom'){g.fillStyle=`rgba(255,140,40,${0.6*(1-k)})`;g.beginPath();g.arc(f.x,f.y,f.r*(0.6+0.5*k),0,TAU);g.fill();}
 else if(f.k==='cone'){g.fillStyle=`rgba(255,120,30,${0.5*(1-k)})`;g.beginPath();g.moveTo(f.x,f.y);g.arc(f.x,f.y,f.r,f.a-f.sp,f.a+f.sp);g.closePath();g.fill();}
 else if(f.k==='splash'){g.strokeStyle=`rgba(255,255,255,${1-k})`;g.lineWidth=2;g.beginPath();g.arc(f.x,f.y,6+k*22,0,TAU);g.stroke();}
 else if(f.k==='fin'){g.fillStyle='#4a5a6a';g.beginPath();const x=f.x+Math.sin(k*6)*14;g.moveTo(x-8,f.y+6);g.lineTo(x,f.y-12);g.lineTo(x+8,f.y+6);g.fill();}}
function brawlRender(t){const ts=t/1000;
 if(BR.ph==='zoom'||(BR.ph==='out'&&BR.zt<1)){const z0=zoom;zoom=z0*(1+BR.zt*1.8);try{render(t);}finally{zoom=z0;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=`rgba(8,20,35,${BR.zt*0.9})`;ctx.fillRect(0,0,vw,vh);if(BR.zt<0.65)return;ctx.globalAlpha=(BR.zt-0.65)/0.35;}
 const g=ctx,me=BR.me;if(!me){g.globalAlpha=1;return;}const sc=brSc();const b=arena().b;
 const tx=me.x,ty=me.y-20;BR.cam.x+=(tx-BR.cam.x)*0.12;BR.cam.y+=(ty-BR.cam.y)*0.12;const hw=vw/2/sc,hh=vh/2/sc;
 BR.cam.x=b[1]-b[0]<=hw*2?(b[0]+b[1])/2:clamp(BR.cam.x,b[0]+hw,b[1]-hw);BR.cam.y=b[3]-b[2]<=hh*2?(b[2]+b[3])/2:clamp(BR.cam.y,b[2]+hh-60,b[3]-hh+40);
 const sh=BR.shk>0?rand(-BR.shk,BR.shk):0;
 g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle=BR.mode==='fort'?'#1f5f86':'#174a72';g.fillRect(0,0,vw,vh);
 g.setTransform(dpr*sc,0,0,dpr*sc,dpr*(vw/2-(BR.cam.x+sh)*sc),dpr*(vh/2-(BR.cam.y+sh)*sc));
 g.strokeStyle='rgba(255,255,255,.12)';g.lineWidth=2;for(let i=0;i<14;i++){const y=b[2]-40+i*((b[3]-b[2]+80)/14),x=((ts*18+i*97)%(b[1]-b[0]+200))+b[0]-100;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+12,y-5,x+24,y);g.stroke();}
 if(BR.bg)g.drawImage(BR.bg,b[0],b[2],b[1]-b[0],b[3]-b[2]);
 if(BR.mode!=='fort'){g.strokeStyle='#e8d5a0';g.lineWidth=2;for(const x of [-160,-55,55,160]){g.beginPath();g.moveTo(x,20);g.quadraticCurveTo(x+6,0,x,-20);g.stroke();}}
 for(const f of BR.fires){g.fillStyle=`rgba(255,${100+Math.sin(ts*12+f.cx)*40|0},20,${0.35*Math.min(1,f.t)})`;g.beginPath();g.arc(f.cx,f.cy,f.r,0,TAU);g.fill();}
 for(const tg of BR.tg)drawTg(g,tg,ts);
 for(const d of BR.deco){const j=Math.abs(Math.sin(ts*5+d.ph))*3;g.fillStyle=d.col;g.beginPath();g.arc(d.x,d.y-j,9,0,TAU);g.fill();g.fillStyle='#e0b48a';g.beginPath();g.arc(d.x,d.y-j-1,5,0,TAU);g.fill();g.fillStyle=d.hc;g.beginPath();g.arc(d.x,d.y-j-3,4,Math.PI,TAU);g.fill();}
 const us=BR.u.filter(u=>!u.dead).sort((a,b)=>a.y-b.y);for(const u of us)drawUnit(g,u,ts);
 for(const f of BR.fx)drawFx(g,f,ts);
 // screen-space HUD
 g.setTransform(dpr,0,0,dpr,0,0);const slot=topSlot();const W=Math.min(300,vw*0.72),x0=(vw-W)/2,y0=slot.land?slot.y:slot.y-4;
 g.fillStyle='rgba(10,20,35,.72)';rr(g,x0,y0,W,BR.mode==='duel'?48:52,10);g.fill();
 g.font='bold 12px sans-serif';g.textAlign='left';g.fillStyle='#fff';
 const my=Math.round(BR.sides[0].pool)+(me.dead?0:1),fo=Math.round(BR.sides[1].pool)+(BR.foeCap&&!BR.foeCap.dead?1:0);
 g.fillText(BR.mode==='duel'?'⚔️ Duel':`👥 ${my}  vs  ${fo} ☠`,x0+8,y0+15);g.textAlign='right';g.fillText(BR.mode==='duel'?BR.boss.name:(BR.tac==='hold'?'🛡️ Hold':BR.tac==='pistols'?'🔫 Pistols':BR.tac?'⚔️ Charge':''),x0+W-8,y0+15);
 const bar=(y,v,m,c,label)=>{g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x0+8,y,W-16,10);g.fillStyle=c;g.fillRect(x0+8,y,(W-16)*clamp(v/m,0,1),10);g.fillStyle='#fff';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText(label,x0+W/2,y+8.5);};
 bar(y0+21,me.hp,me.max,'#2ecc71',`You ${Math.max(0,Math.ceil(me.hp))}/${me.max}`);if(BR.foeCap)bar(y0+35,BR.foeCap.hp,BR.foeCap.max,'#e74c3c',`${BR.foeCap.name} ${Math.max(0,Math.ceil(BR.foeCap.hp))}`);
 if(BR.msgT>0&&BR.msg){g.font='bold 15px sans-serif';g.textAlign='center';const mw=Math.min(vw-20,g.measureText(BR.msg).width+24);g.fillStyle=`rgba(0,0,0,${Math.min(0.6,BR.msgT)})`;rr(g,(vw-mw)/2,y0+60,mw,26,8);g.fill();g.fillStyle='#ffe066';g.fillText(BR.msg,vw/2,y0+78,vw-30);}
 if(BR.ph==='fight'&&BR.hint>0&&IS_TOUCH){g.font='12px sans-serif';g.fillStyle=`rgba(255,255,255,${Math.min(0.85,BR.hint)})`;g.textAlign='center';g.fillText('Drag to move • ⚔️ slash • hold 🛡️ (tap just before a hit = parry) • 💨 dodge',vw/2,vh*0.62,vw-20);}
 if(joy.id!==null&&BR.ph==='fight'){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;g.beginPath();g.arc(joy.bx,joy.by,46,0,TAU);g.stroke();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(joy.bx+clamp(joy.x-joy.bx,-46,46),joy.by+clamp(joy.y-joy.by,-46,46),18,0,TAU);g.fill();}
 g.globalAlpha=1;}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function brawlHUD(){const show=state==='play'&&!!grapTgt&&!boardTgt&&!actLabel();const gb=$('grapBtn');gb.classList.toggle('hidden',!show);if(show){const t=grapRisky(grapTgt)?'🪝 Board (risky ⚠️)':isDuelFoe(grapTgt)?'🪝 Board & duel!':'🪝 Board her!';if(gb.textContent!==t)gb.textContent=t;}
 const on=state==='brawl'&&BR.ph==='fight';$('brCtl').classList.toggle('hidden',!on);$('bCut').classList.toggle('hidden',!on);if(on&&BR.me){const t=`${BR.me.shots}`;if($('bPn').textContent!==t)$('bPn').textContent=t;$('bPistol').classList.toggle('dim',BR.me.shots<=0);$('bDodge').classList.toggle('dim',BR.me.dodgeCd>0);}}
function brawlKey(k,down){if(!BR.on)return;if(BR.ph==='pick'){if(down&&(k==='1'||k==='enter'))chooseTactic('charge');else if(down&&k==='2'&&BR.mode!=='duel')chooseTactic('hold');else if(down&&k==='3'&&BR.mode!=='duel')chooseTactic('pistols');return;}
 if(BR.ph==='res'){if(down&&k==='enter'){const b=$('brBtns').querySelector('button:not([disabled])');if(b)b.click();}return;}
 if(BR.ph!=='fight'||!BR.me)return;const i=BR.me.inp;if(!down)return;if(k==='j'||k===' ')i.slash=1;else if(k==='l')i.pistol=1;else if(k==='shift'||k==='i')i.dodge=1;else if(k==='x')cutRopes();}
// ---------------- port: ⚔️ Arms ----------------
function capSummary(){const c=capStats(),s=S.cap;return `❤️ ${c.hp} HP • ${SWORDS[s.sw][1]} (${Math.round(c.dmg)} dmg) • ${PISTOLS[s.pi][1]} ×${c.shots} • ${ARMORS[s.ar][1]}${c.red?` (−${Math.round(c.red*100)}%)`:''}${s.sty?` • ${STYLES[s.sty][0]} ${STYLES[s.sty][1]}`:''} • 🏴‍☠️ ${S.bst.win|0} boardings won`;}
function armsHTML(p){const hv=p.haven,c=capStats(),cr=crewStats(),s=S.cap;let h=`<div class="note">⚔️ <b>Captain & boarding crew.</b> ${capSummary()}<br>Crew fighters: ❤️ ${Math.round(cr.hp)} • ⚔️ ${cr.dmg.toFixed(1)} dmg${cr.red?` • −${Math.round(cr.red*100)}% dmg taken`:''}.${hv?'':' <b>Arms dealers only trade at 🏴‍☠️ havens.</b>'}</div>`;
 h+=`<h3>🎭 Fighting style</h3>`;if(S.clvl<STYLE_LVL)h+=`<div class="note">🔒 Choose a fighting style at captain level ${STYLE_LVL}.</div>`;
 else for(const k in STYLES){const st=STYLES[k],own=s.sty===k,cost=s.sty?250:0;h+=row(`${st[0]} ${st[1]}${own?' ✅':''}`,st[2],own?'':btn('sty',hv?(cost?`Switch ${cost}💰`:'Choose (free)'):'Havens only',hv&&S.gold>=cost,k));}
 for(const g of ['sw','pi','ar']){const list=GEAR[g];h+=`<h3>${list[1][0]} ${GEARN[g]}</h3>`;const cur=s[g]|0;
  list.forEach((it,i)=>{if(i<cur||i>cur+2)return;const own=i===cur;const ok=S.clvl>=it[2];const d=g==='sw'?`${it[4]} base damage`:g==='pi'?`${it[4]} shots • ${it[5]} dmg • reload ${it[6]}s`:`−${Math.round(it[4]*100)}% damage, +${it[5]} HP`;
   h+=row(`${own?'✅':ok?it[0]:'🔒'} ${it[1]}`,d+(ok?'':` • unlocks at captain level ${it[2]}`),own?'':btn('gear',hv?`${it[3]} 💰`:'Havens only',hv&&ok&&i===cur+1&&S.gold>=it[3],g+':'+i));});}
 h+=`<h3>👥 Boarding crew</h3><div class="note">Your crew fight beside you on deck. Officers help too: 🧑‍✈️ First Mate (+1 fighter, +10% crew HP), 📯 Bosun (+12% crew damage, fewer cut hooks), 🩺 Surgeon (−35% casualties), 🎯 Master Gunner (+1 pistol shot).</div>`;
 for(const k in CREWG){const d=CREWG[k],l=s[k]|0,max=d[2].length-1;const c=d[3][l+1];h+=row(`${d[0]} ${d[1]}: ${d[2][l]} ${pips(l,max)}`,l>=max?d[4]+' (MAX)':`${d[4]} ➜ ${d[2][l+1]}`,btn('crewg',l>=max?'MAX':hv?`${c} 💰`:'Havens only',hv&&l<max&&S.gold>=c,k));}
 h+=`<div class="note">📊 Boardings won ${S.bst.win|0} • duels ${S.bst.duel|0} • boarders repelled ${S.bst.repel|0} • gates stormed ${S.bst.raid|0} • parries ${S.bst.parry|0}</div>`;return h;}
function armsAction(act,arg){const p=PORTS[curPort];if(!p)return false;
 if(act==='sty'){if(!p.haven||S.clvl<STYLE_LVL||!STYLES[arg]||S.cap.sty===arg)return true;const cost=S.cap.sty?250:0;if(S.gold<cost)return true;S.gold-=cost;S.cap.sty=arg;chime();toast(`${STYLES[arg][0]} You fight as a ${STYLES[arg][1]} now!`);return true;}
 if(act==='gear'){const [g,i]=String(arg).split(':');const L=GEAR[g],n=+i;if(!L||!p.haven||n!==(S.cap[g]|0)+1||!L[n]||S.clvl<L[n][2]||S.gold<L[n][3])return true;S.gold-=L[n][3];S.cap[g]=n;chime();toast(`${L[n][0]} ${L[n][1]} acquired!`);return true;}
 if(act==='crewg'){const d=CREWG[arg];if(!d||!p.haven)return true;const l=S.cap[arg]|0;if(l>=d[2].length-1||S.gold<d[3][l+1])return true;S.gold-=d[3][l+1];S.cap[arg]=l+1;chime();toast(`${d[0]} ${d[1]}: ${d[2][l+1]}!`);return true;}
 return false;}
function migrateBoard(d){const def=defaultState();S.cap=Object.assign(def.cap,(d.cap&&typeof d.cap==='object')?d.cap:{});S.bst=Object.assign(def.bst,(d.bst&&typeof d.bst==='object')?d.bst:{});
 S.cap.sw=clamp(S.cap.sw|0,0,SWORDS.length-1);S.cap.pi=clamp(S.cap.pi|0,0,PISTOLS.length-1);S.cap.ar=clamp(S.cap.ar|0,0,ARMORS.length-1);for(const k in CREWG)S.cap[k]=clamp(S.cap[k]|0,0,CREWG[k][2].length-1);if(!STYLES[S.cap.sty])S.cap.sty='';
 for(const k in S.bst)S.bst[k]=Math.max(0,+S.bst[k]||0);}
function boardUnlocks(l){const out=[];if(l===STYLE_LVL)out.push('🎭 Fighting styles (⚔️ Arms tab)');for(const g of ['sw','pi','ar'])for(const it of GEAR[g])if(it[2]===l&&it[2]>1)out.push(`${it[0]} ${it[1]}`);return out;}
