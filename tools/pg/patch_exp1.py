p='/workspace/pirate-game/index.html';s=open(p).read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(n,a[:100]);s=s.replace(a,b)
# ---------------- WORLD ----------------
rep("const WORLD=8000;\nconst START={x:4000,y:4000};",
"""const OLDW=8000,OFF=8000,WORLD=24000;
const START={x:12000,y:12000},CORE_R=4100;
function inCore(x,y){return Math.abs(x-START.x)<CORE_R&&Math.abs(y-START.y)<CORE_R;}""")
rep("Richest port on the sea.'}];","""Richest port on the sea.'}];
PORTDEFS.forEach(d=>{d.x+=OFF;d.y+=OFF;});
// Pirate Republic: clan strongholds, free havens and the Crown's frontier outposts in the outer waters
const PORTDEFS2=[
 {name:'Scarlet Keep',x:21300,y:11300,r:250,pa:Math.PI,cheap:'spice',want:'gems',haven:1,clan:0,desc:'Red-walled citadel of the Crimson Brotherhood. Allies drink free; enemies hang from the walls.'},
 {name:'Blacktide Hold',x:12700,y:2600,r:240,pa:Math.PI/2,cheap:'silk',want:'rum',haven:1,clan:1,desc:'Fog-shrouded harbour of the Black Tide Syndicate — smugglers, spies and silent knives.'},
 {name:'Gullrock Bastion',x:2700,y:12700,r:250,pa:0,cheap:'rum',want:'silk',haven:1,clan:2,desc:'Iron-plated fortress of the Iron Gull Confederacy, master shipwrights of the Republic.'},
 {name:"Serpent's Crown",x:11300,y:21400,r:260,pa:-Math.PI/2,cheap:'gems',want:'sugar',haven:1,clan:3,desc:'Golden seat of the Golden Serpent Armada, richest and proudest of the four clans.'},
 {name:'Freeport Libertalia',x:4600,y:4600,r:230,pa:Math.PI/4,cheap:'sugar',want:'spice',haven:1,desc:'The free city of the Pirate Republic. Neutral ground: every clan drinks here, none may fight.'},
 {name:"Rogue's Rest",x:19400,y:4500,r:200,pa:2.4,cheap:'rum',want:'gems',haven:1,desc:'A ramshackle haven of deserters and drifters on the northern frontier.'},
 {name:"Hangman's Cay",x:19500,y:19500,r:210,pa:-2.4,cheap:'spice',want:'silk',haven:1,desc:'They say the gallows here have not been empty for a hundred years. Pirates love it.'},
 {name:'Driftwood Harbor',x:4500,y:19400,r:200,pa:-0.8,cheap:'silk',want:'rum',haven:1,desc:'A haven built from the wrecks of a thousand ships.'},
 {name:'Fort Sovereign',x:18200,y:13800,r:220,pa:2.8,cheap:'sugar',want:'gems',desc:'The Crown\\'s newest bastion on the edge of the Republic.'},
 {name:'Port Regent',x:10200,y:18300,r:230,pa:-1.9,cheap:'rum',want:'spice',desc:'A Crown colony that trades with everyone and trusts no one.'},
 {name:'San Cristóbal',x:5800,y:10300,r:240,pa:0.3,cheap:'spice',want:'sugar',desc:'Spanish frontier city, its guns aimed at the Republic.'},
 {name:'New Albion',x:13800,y:5800,r:220,pa:1.9,cheap:'silk',want:'rum',desc:'The Crown\\'s northern outpost, home of the Admiralty\\'s frontier squadron.'}];""")
rep("const x=300+r()*(WORLD-600),y=300+r()*(WORLD-600),rad=45+r()*75;","const x=OFF+300+r()*(OLDW-600),y=OFF+300+r()*(OLDW-600),rad=45+r()*75;")
rep(" ISL.push(makeIsland({x,y,r:rad},9000+tries,false));}})();\nfunction inAnyIsland(x,y,m){for(const o of ISL)if(insideIsland(o,x,y,m))return o;return null;}",
""" ISL.push(makeIsland({x,y,r:rad},9000+tries,false));}})();
PORTDEFS2.forEach((d,i)=>{const o=makeIsland(d,5000+i*91,true);o.outer=true;if(d.clan!=null)o.clan=d.clan;ISL.push(o);PORTS.push(o);});
(function(){const r=rng(9090);let tries=0,n=0;while(n<74&&tries<4000){tries++;const x=400+r()*(WORLD-800),y=400+r()*(WORLD-800),rad=55+r()*150;
 if(Math.abs(x-START.x)<CORE_R+300&&Math.abs(y-START.y)<CORE_R+300)continue;if(ISL.some(o=>Math.hypot(o.x-x,o.y-y)<o.r*1.3+rad*1.3+300))continue;
 const o=makeIsland({x,y,r:rad},20000+tries,false);o.outer=true;ISL.push(o);n++;}})();
ISL.forEach(o=>{o.half=Math.ceil((o.r*1.3*1.25+30)*2)/2;});
// spatial grid for island collision / queries
const GRID=1000,GN=WORLD/GRID,IGRID=[];for(let i=0;i<GN*GN;i++)IGRID.push([]);
ISL.forEach(o=>{const R=o.r*1.3+220;for(let gy=Math.max(0,Math.floor((o.y-R)/GRID));gy<=Math.min(GN-1,Math.floor((o.y+R)/GRID));gy++)for(let gx=Math.max(0,Math.floor((o.x-R)/GRID));gx<=Math.min(GN-1,Math.floor((o.x+R)/GRID));gx++)IGRID[gy*GN+gx].push(o);});
const NOCELL=[];function islCell(x,y){const gx=Math.floor(x/GRID),gy=Math.floor(y/GRID);return gx<0||gy<0||gx>=GN||gy>=GN?NOCELL:IGRID[gy*GN+gx];}
function inAnyIsland(x,y,m){for(const o of islCell(x,y))if(insideIsland(o,x,y,m))return o;return null;}
function clanSector(x,y){const a=Math.atan2(y-START.y,x-START.x),q=Math.PI/4;return a>=-q&&a<q?0:a>=q&&a<3*q?3:a>=-3*q&&a<-q?1:2;}
function clanAt(x,y){return inCore(x,y)?-1:clanSector(x,y);}
const FORTN=[['Fort Ember','Redcliff Battery','Bloodrock','Cinder Point'],['Fort Umbra','Midnight Battery','Ravenspire','Gloomwater'],['Fort Anvil','Rivet Rock','Saltsteel Battery','Gullwatch'],['Fort Aurum','Fang Battery','Coil Redoubt','Sunscale']];
const FORTS=[];(function(){const r=rng(31337);const cand=ISL.filter(o=>o.outer&&!o.isPort&&o.r>=75);
 for(let c=0;c<4;c++){const mine=cand.filter(o=>clanSector(o.x,o.y)===c);for(let i=mine.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[mine[i],mine[j]]=[mine[j],mine[i]];}
  let k=0;for(const o of mine){if(k>=4)break;const a=Math.atan2(START.y-o.y,START.x-o.x)+(r()-0.5)*1.2;const rr=radiusAt(o,a)*0.82;const x=o.x+Math.cos(a)*rr,y=o.y+Math.sin(a)*rr;
   if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<1300))continue;if(FORTS.some(f=>Math.hypot(f.x-x,f.y-y)<1800))continue;if(Math.max(Math.abs(x-START.x),Math.abs(y-START.y))<CORE_R+700)continue;
   const f={id:FORTS.length,x,y,a,clan:c,name:FORTN[c][k],lvl:lvlAt(x,y)};FORTS.push(f);o.fort=f;k++;}}})();""")
rep("function lvlAt(x,y){return clamp(1+Math.floor(Math.hypot(x-START.x,y-START.y)/800),1,9);}",
    "function lvlAt(x,y){const d=Math.hypot(x-START.x,y-START.y);return d<5600?clamp(1+Math.floor(d/800),1,8):Math.min(12,8+Math.floor((d-5600)/1400));}")
rep("ISL.forEach(renderIsland);\n","// island sprites are rendered lazily near the camera (see drawIslands)\n")
rep("const MAPRES=200;","const MAPRES=1200;")
rep("g.fillStyle=o.isPort?'#7fbf5a':'#c9b57a';g.fill();}})();","g.fillStyle=o.isPort?(o.clan!=null?'#c7a04a':'#7fbf5a'):'#c9b57a';g.fill();}})();")
rep("const FOGN=80,FOGC=WORLD/FOGN;","const FOGN=240,FOGC=WORLD/FOGN;")
rep("function rebuildFog(){fogCtx.clearRect(0,0,FOGN,FOGN);fogCtx.fillStyle='#0a1626';for(let j=0;j<FOGN;j++)for(let i=0;i<FOGN;i++)if(!fog[j*FOGN+i])fogCtx.fillRect(i,j,1,1);}",
"""function rebuildFog(){const im=fogCtx.createImageData(FOGN,FOGN),d=im.data;for(let i=0;i<FOGN*FOGN;i++)if(!fog[i]){d[i*4]=10;d[i*4+1]=22;d[i*4+2]=38;d[i*4+3]=255;}fogCtx.putImageData(im,0,0);}
function fogBits(){const fb=new Uint8Array(Math.ceil(fog.length/8));for(let i=0;i<fog.length;i++)if(fog[i])fb[i>>3]|=1<<(i&7);return b64e(fb);}
function fogLoadBits(fb,n,off){for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;if((fb[k>>3]>>(k&7))&1){const x=i+off,y=j+off;if(x<FOGN&&y<FOGN)fog[y*FOGN+x]=1;}}}""")
# ---------------- SAVE ----------------
rep("megas:0,track:0,lastRank:''};}","megas:0,track:0,lastRank:'',wv:2,rep:[0,0,0,0],forts:{},leaders:{},lrev:{},vis:[0],king:0,cst:{fort:0,lead:0,cj:0,def:0,sk:0,trib:0,rev:0,lev:0},leg:0,cos:{sail:'def',flag:'def',hull:'def',fx:'def'},ammo:{chain:0,fire:0,mortar:0},asel:'ball',off:{},unl:1};}")
rep("sk:{gun:0,sea:0,plun:0,cmd:0}","sk:{gun:0,sea:0,plun:0,cmd:0,war:0}")
rep("for(const k in S.sk)S.sk[k]=clamp(S.sk[k]|0,0,4);","for(const k in S.sk)S.sk[k]=clamp(S.sk[k]|0,0,SKILLS[k]?SKILLS[k].p.length:0);")
rep(" if(typeof S.fog==='string'&&S.fog.length===FOGN*FOGN){for(let i=0;i<fog.length;i++)fog[i]=S.fog.charCodeAt(i)===49?1:0;}\n",
""" migrateExp(d);
 {const v2=d.wv>=2;if(typeof d.fogb==='string'&&d.fogb){try{fogLoadBits(b64d(d.fogb),v2?FOGN:80,v2?0:80);}catch(e){}}
  else if(typeof d.fog==='string'&&d.fog.length===6400&&!v2){for(let j=0;j<80;j++)for(let i=0;i<80;i++)if(d.fog.charCodeAt(j*80+i)===49)fog[(j+80)*FOGN+i+80]=1;}S.fog='';S.fogb='';}
""")
rep("function save(){if(importing)return;try{S.x=P.x;S.y=P.y;S.h=P.h;S.hp=P.hp;let f='';for(let i=0;i<fog.length;i++)f+=fog[i]?'1':'0';S.fog=f;localStorage.setItem(SAVEKEY,JSON.stringify(S));}catch(e){}}",
"""function save(){if(importing)return;try{S.x=P.x;S.y=P.y;S.h=P.h;S.hp=P.hp;S.fog='';S.fogb=fogBits();localStorage.setItem(SAVEKEY,JSON.stringify(S));S.fogb='';}catch(e){}}
function migrateExp(d){
 if(!(d.wv>=2)){if(typeof d.x==='number'&&typeof d.y==='number'){S.x=d.x+OFF;S.y=d.y+OFF;}else{S.x=PORTS[0].port.x;S.y=PORTS[0].port.y+40;}
  for(const q of S.quests){if(typeof q.x==='number'){q.x+=OFF;q.y+=OFF;}if(Array.isArray(q.pts))for(const p of q.pts){p.x+=OFF;p.y+=OFF;}}S.offers={};S.wv=2;}
 if(!Array.isArray(S.rep)||S.rep.length!==4)S.rep=[0,0,0,0];S.rep=S.rep.map(v=>clamp(Math.round(+v||0),-100,100));
 for(const k of ['forts','leaders','lrev','off'])if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={};
 for(const id in S.forts){const f=S.forts[id];if(!FORTS[id]||!f||typeof f!=='object'||!(f.o==='p'||(f.o>=0&&f.o<4)))delete S.forts[id];}
 if(!Array.isArray(S.vis))S.vis=[];S.vis=S.vis.filter(i=>PORTS[i]);if(!(S.lastPort>=0&&S.lastPort<PORTS.length))S.lastPort=0;if(!S.vis.includes(S.lastPort|0))S.vis.push(S.lastPort|0);
 const def=defaultState();for(const k of ['cst','cos','ammo'])S[k]=Object.assign(def[k],(d[k]&&typeof d[k]==='object')?d[k]:{});
 for(const k in S.ammo)S.ammo[k]=clamp(S.ammo[k]|0,0,AMMO_CAP);if(!AMMO[S.asel])S.asel='ball';for(const c in COS)if(!COS[c].some(x=>x[0]===S.cos[c]))S.cos[c]='def';
 S.leg=clamp(S.leg|0,0,LEG_MAX);S.king=S.king?1:0;if(d.unl===undefined)S.unl=0;
 S.x=clamp(+S.x||PORTS[0].port.x,100,WORLD-100);S.y=clamp(+S.y||PORTS[0].port.y,100,WORLD-100);}""")
rep("""const sh=new Uint8Array(0);""","""const sh=new Uint8Array(0);""",0) if False else None
rep(" if(typeof s.fogb==='string'){try{const fb=b64d(s.fogb);let f='';for(let i=0;i<FOGN*FOGN;i++)f+=(fb[i>>3]>>(i&7))&1?'1':'0';s.fog=f;}catch(e){s.fog='';}}\n delete s.fogb;return {s,t:d.t};}",
    " return {s,t:d.t};}")
rep("const fb=new Uint8Array(Math.ceil(fog.length/8));for(let i=0;i<fog.length;i++)if(fog[i])fb[i>>3]|=1<<(i&7);o.fog='';o.fogb=b64e(fb);return o;}","o.fog='';o.fogb=fogBits();return o;}")
rep("S=defaultState();fog=new Uint8Array(FOGN*FOGN);rebuildFog();","S=defaultState();fog=new Uint8Array(FOGN*FOGN);rebuildFog();for(const k in FRT)delete FRT[k];shells.length=0;stormF=null;")
# ---------------- STATS / SKILLS / LEVELS ----------------
rep(" if(S.crew>ST.maxCrew)S.crew=ST.maxCrew;}"," expRecalc();\n if(S.crew>ST.maxCrew)S.crew=ST.maxCrew;}")
rep("const RANKS=[[0,'Deckhand'],[100,'Swabbie'],[300,'Buccaneer'],[700,'Captain'],[1500,'Sea Wolf'],[3000,'Commodore'],[6000,'Pirate Lord'],[12000,'Pirate King']];",
    "const RANKS=[[0,'Deckhand'],[100,'Swabbie'],[300,'Buccaneer'],[700,'Captain'],[1500,'Sea Wolf'],[3000,'Commodore'],[6000,'Pirate Lord'],[12000,'Pirate King'],[20000,'Pirate Emperor'],[35000,'Sovereign of the Seas']];")
rep("const sellPrice=(pi,gi)=>Math.max(1,Math.round(price(pi,gi)*0.82*(sk('plun')>=3?1.1:1)));","const sellPrice=(pi,gi)=>Math.max(1,Math.round(price(pi,gi)*0.82*(sk('plun')>=3?1.1:1)*(S.off&&S.off.qm?1.08:1)));")
rep("const MAXLVL=30;\nfunction xpNeed(l){return 60+40*l;}","const MAXLVL=60;\nfunction xpNeed(l){return 60+40*l+(l>=30?8*(l-29)*(l-29):0);}")
rep("""cmd:{name:'Command',icon:'⚓',p:[['Drill','Fleet ships deal +15% damage'],['Loyal Crews','Fleet wages −25%'],['Low Profile','Wanted level fades 50% faster'],['Admiral','Fleet ships take 20% less damage and heal to 80% when calm']]}};""",
"""cmd:{name:'Command',icon:'⚓',p:[['Drill','Fleet ships deal +15% damage'],['Loyal Crews','Fleet wages −25%'],['Low Profile','Wanted level fades 50% faster'],['Admiral','Fleet ships take 20% less damage and heal to 80% when calm'],['Veteran Crews','Fleet ships +15% damage, −15% damage taken'],['Grand Fleet','+1 fleet slot']]},
 war:{name:'Warlord',icon:'🏰',p:[['Siege Master','+50% damage to forts'],['Boarding Axes','Storm forts twice as fast, lose half the crew'],['Garrison','Your forts get +1 cannon and +25% walls; raids fail more often'],['Diplomat','Clan reputation gains +50%, losses −30%'],['Dread Captain','Take 12% less cannon damage'],["Sovereign's Due",'+25% XP from everything']]}};
SKILLS.gun.p.push(['Heated Shot','+10% cannon damage'],['Broadside Master','−10% reload time']);SKILLS.sea.p.push(['Storm Rider','+5% top speed'],['Iron Keel','+15% max hull']);
SKILLS.plun.p.push(['Tribute','Fort tribute +30%'],["King's Ransom",'+15% gold from sinking & plundering']);""")
rep("function learn(k){const l=sk(k);if(!SKILLS[k]||l>=4||(S.sp|0)<1)return;","function learn(k){const l=sk(k);if(!SKILLS[k]||l>=SKILLS[k].p.length||(S.sp|0)<1||S.clvl<perkLvl(k,l))return;")
rep("const can=n>0&&Object.keys(SKILLS).some(k=>sk(k)<4);","const can=n>0&&(Object.keys(SKILLS).some(k=>sk(k)<SKILLS[k].p.length&&S.clvl>=perkLvl(k,sk(k)))||(S.clvl>=30&&(S.leg|0)<LEG_MAX));")
rep("""for(const k in SKILLS){const d=SKILLS[k],l=sk(k);h+=`<h3>${d.icon} ${d.name} ${pips(l,4)}</h3>`;
  d.p.forEach((pp,i)=>{const own=i<l,next=i===l;h+=row(`${own?'✅':next?'⬜':'🔒'} ${pp[0]}`,pp[1]+(next||own?'':' (learn the one above first)'),own?'':btn('learn',next?'Learn (1 SP)':'Locked',next&&(S.sp|0)>0,k));});}
 return h;}""",
"""for(const k in SKILLS){const d=SKILLS[k],l=sk(k);h+=`<h3>${d.icon} ${d.name} ${pips(l,d.p.length)}</h3>`;
  d.p.forEach((pp,i)=>{const own=i<l,next=i===l,g=perkLvl(k,i),lv=S.clvl>=g;h+=row(`${own?'✅':next&&lv?'⬜':'🔒'} ${pp[0]}`,pp[1]+(own?'':!lv?` (captain level ${g})`:next?'':' (learn the one above first)'),own?'':btn('learn',next&&lv?'Learn (1 SP)':'Locked',next&&lv&&(S.sp|0)>0,k));});}
 h+=`<h3>⭐ Renown ${pips(Math.min(10,Math.round((S.leg|0)/3)),10)}</h3>`+row(`⭐ Renown ${S.leg|0}/${LEG_MAX}`,S.clvl>=30?`Each point: +1.5% cannon damage and hull (now +${(1.5*(S.leg|0)).toFixed(1)}%).`:'Unlocks at captain level 30 — spend spare skill points here.',btn('leg','+1 (1 SP)',S.clvl>=30&&(S.sp|0)>0&&(S.leg|0)<LEG_MAX));
 return h;}""")
rep("function grantXP(n,x,y){n=Math.round(n);","function grantXP(n,x,y){n=Math.round(n*(sk('war')>=6?1.25:1));")
rep("toast(`🎖️ Captain level ${S.clvl}! +1 skill point — spend it in ☰ ➜ 🎖️ Skills`);chime();}}","toast(lvlUpMsg(S.clvl));chime();}}")
rep("Captain:'Hold 4 jobs at once',","Captain:'Hold 4 jobs at once & storm clan forts',")
rep("'Pirate King':'A crown over your flagship 👑'};","'Pirate King':'A crown over your flagship 👑','Pirate Emperor':'The Crown sends HMS Leviathan after you','Sovereign of the Seas':'Eternal glory — the last rank'};")
rep(" ['lord','👑','Pirate Lord','Reach the rank of Pirate Lord',()=>S.infamy>=6000]];",""" ['lord','👑','Pirate Lord','Reach the rank of Pirate Lord',()=>S.infamy>=6000],
 ['fort1','🏰','Fortress Taker','Capture a clan fort',()=>(S.cst.fort|0)>=1],['fort8','🏯','Warlord','Hold 8 forts at once',()=>ownedForts()>=8],
 ['leader','⚔️','Kingslayer',"Sink a clan leader's flagship",()=>(S.cst.lead|0)>=1],['leaders4','💀','Breaker of Clans','Defeat all four clan leaders',()=>leadersDown()>=4],
 ['king','👑','Pirate King of the Republic','Unite the Pirate Republic',()=>!!S.king],['ally','🤝','Sworn Brother','Become allied with a clan',()=>S.rep.some(v=>v>=REP_ALLY)],
 ['defend3','🛡️','Holdfast','Fight off 3 raids on your forts',()=>(S.cst.def|0)>=3],['cjob5','📜','Clan Mercenary','Finish 5 clan contracts',()=>(S.cst.cj|0)>=5],
 ['skirm25','🏴','Opportunist','Sink 25 clan ships',()=>(S.cst.sk|0)>=25],['trib','💰','Tribute Lord','Collect 10,000 gold of fort tribute',()=>(S.cst.trib|0)>=10000],
 ['map50','🗺️','Cartographer','Explore half of the sea chart',()=>explored()>=0.5],['lvl30','🎖️','Legend','Reach captain level 30',()=>S.clvl>=30],
 ['lvl45','🌟','Living Legend','Reach captain level 45',()=>S.clvl>=45],['lvl60','💫','Immortal','Reach captain level 60',()=>S.clvl>=60],
 ['rev','👻','Unbreakable','Sink a Revenant flagship',()=>(S.cst.rev|0)>=1],['lev','🐋',"Leviathan's Bane",'Sink HMS Leviathan',()=>(S.cst.lev|0)>=1],
 ['emperor','💠','Pirate Emperor','Reach the rank of Pirate Emperor',()=>S.infamy>=20000],['style','🎨','Dandy','Equip 3 cosmetics',()=>['sail','flag','hull','fx'].filter(k=>S.cos[k]!=='def').length>=3],
 ['officers','🎩','Full Wardroom','Hire 5 officers',()=>Object.keys(S.off).length>=5]];""")
rep("function fleetCap(){return 1+(S.up.command||0);}","function fleetCap(){return 1+(S.up.command||0)+(sk('cmd')>=6?1:0);}")
rep("function damageFleet(f,dmg){if(sk('cmd')>=4)dmg*=0.8;","function damageFleet(f,dmg){if(sk('cmd')>=4)dmg*=0.8;if(sk('cmd')>=5)dmg*=0.85;")
rep("f.d.dmg*(sk('cmd')>=1?1.15:1)","f.d.dmg*(sk('cmd')>=1?1.15:1)*(sk('cmd')>=5?1.15:1)*(S.off.ad?1.2:1)",2)
rep("(sk('plun')>=1?1.12:1)","(sk('plun')>=1?1.12:1)*(sk('plun')>=6?1.15:1)",2)
rep("function damagePlayer(dmg,bite){if(P.dead)return;","function damagePlayer(dmg,bite){if(P.dead)return;if(!bite&&sk('war')>=5)dmg*=0.88;")
rep("if(!bite&&Math.random()<0.07&&S.crew>4)","if(!bite&&Math.random()<(S.off.sg?0.035:0.07)&&S.crew>4)")
# ---------------- ENTITIES / AI ----------------
rep(" else {const soft=lvl<=2;Object.assign(e,{maxHp:(soft?26:30)",
    " else if(kind==='clan'){Object.assign(e,{maxHp:44+25*lvl,cannons:1+Math.ceil(lvl/2),dmg:4.8+1.9*lvl,maxSpeed:Math.min(200,98+9*lvl),reload:Math.max(2.2,3.6-0.12*lvl),aggro:620+40*lvl,gold:20+22*lvl,len:52+lvl*1.4,wid:18+lvl*0.4,range:390,clan:0});}\n else {const soft=lvl<=2;Object.assign(e,{maxHp:(soft?26:30)")
rep("if(x<200||y<200||x>WORLD-200||y>WORLD-200)continue;if(inAnyIsland(x,y,90))continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<450))continue;return{x,y};}return null;}",
    "if(x<200||y<200||x>WORLD-200||y>WORLD-200)continue;if(inAnyIsland(x,y,90))continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<450))continue;if(FORTS.some(f=>Math.hypot(f.x-x,f.y-y)<350))continue;return{x,y};}return null;}")
rep("function spawnNear(dmin,dmax){const pt=randomWater(P.x,P.y,dmin,dmax);if(!pt)return;const lvl=clamp(lvlAt(pt.x,pt.y)+(Math.random()<0.2?1:0),1,10);",
    "function spawnNear(dmin,dmax){const pt=randomWater(P.x,P.y,dmin,dmax);if(!pt)return;const lvl=clamp(lvlAt(pt.x,pt.y)+(Math.random()<0.2?1:0),1,13);if(!inCore(pt.x,pt.y)){outerSpawn(pt,lvl);return;}")
rep("function spawnMerchant(dmin,dmax){for(let t=0;t<14;t++){const a=PORTS[(Math.random()*PORTS.length)|0],b=PORTS[(Math.random()*PORTS.length)|0];if(a===b)continue;",
    "function spawnMerchant(dmin,dmax){const near=nearPorts(P.x,P.y,7500);if(near.length<2)return false;for(let t=0;t<14;t++){const a=pick(near),b=pick(near);if(a===b)continue;")
rep("const lvl=clamp(lvlAt(x,y)+(Math.random()<0.2?1:0),1,10);const e=makeEnemy('merchant'","const lvl=clamp(lvlAt(x,y)+(Math.random()<0.2?1:0),1,13);const e=makeEnemy('merchant'")
rep("const pp=pick(PORTS).port;e.wp={x:pp.x,y:pp.y};","const pp=pick(nearPorts(e.x,e.y,7000)).port;e.wp={x:pp.x,y:pp.y};")
rep("function isHostile(e){if(e.kind==='shark')return !e.sinking&&e.hp>0&&e.chase;",
    "function isHostile(e){if(e.kind==='shark')return !e.sinking&&e.hp>0&&e.chase;if(e.kind==='clan')return !e.sinking&&e.hp>0&&(e.angry||clanHostile(e.clan)||e.atkF!=null);")
rep("function damageEnemy(e,dmg){const was=e.angry;convoyAlarm(e);","function damageEnemy(e,dmg){const was=e.angry;convoyAlarm(e);clanDmg(e,was);")
rep("for(const q of S.quests){if(q.type==='bounty'&&(e.kind===q.target||(q.target==='pirate'&&e.kind==='boss'))&&q.have<q.need)",
    "clanSunk(e);levSunk(e);\n for(const q of S.quests.slice()){if(q.type==='bounty'&&(e.kind===q.target||(q.target==='pirate'&&(e.kind==='boss'||e.kind==='clan')))&&q.have<q.need)")
rep("S.infamy+=Math.round(e.lvl*10*(e.kind==='boss'?4:1)","S.infamy+=Math.round(e.lvl*10*(e.kind==='boss'||e.lead?4:1)")
rep("grantXP(e.tut?15:(8+6*e.lvl)*(e.kind==='boss'?3:1),e.x,e.y);","grantXP(e.tut?15:(8+6*e.lvl)*(e.kind==='boss'?3:e.kind==='clan'?1.25:1),e.x,e.y);")
rep("addText(e.x,e.y-40,e.kind==='boss'?`☠ ${e.name} sunk!`","addText(e.x,e.y-40,e.kind==='boss'||e.lead||e.lev?`☠ ${e.name} sunk!`")
rep("function nearSafePort(x,y){const w=stars()>0;for(const p of PORTS)if((p.haven||!w)&&Math.hypot(p.port.x-x,p.port.y-y)<420)return true;return false;}",
    "function nearSafePort(x,y){const w=stars()>0;for(const p of PORTS){const ok=p.clan!=null?!clanHostile(p.clan):(p.haven||!w);if(ok&&Math.hypot(p.port.x-x,p.port.y-y)<420)return true;}return false;}")
rep(" e.rl-=dt;e.rr-=dt;e.hitT-=dt;\n"," e.rl-=dt;e.rr-=dt;e.hitT-=dt;burnTick(e,dt);if(e.sinking)return;\n")
rep(" }else{\n  if(e.kind==='boss'&&!e.angry&&d<e.aggro)e.angry=true;"," }else if(e.kind==='clan'){clanAI(e,dt,d,safe);desired=e._des;thr=e._thr;td=e._td;tto=e._tto;\n }else{\n  if(e.kind==='boss'&&!e.angry&&d<e.aggro)e.angry=true;")
rep(" moveShip(e,desired,thr,e.maxSpeed,1.3,dt);"," moveShip(e,desired,thr,e.maxSpeed*(e.slowT>0?0.55:1),1.3*(e.slowT>0?0.6:1),dt);")
rep("(e.angry||e.kind!=='merchant')&&!safe){","(e.angry||e.kind!=='merchant')&&!safe&&(e.kind!=='clan'||e.fireOk)){")
rep("fireBroadside(e,1,e.cannons,e.dmg,'e',e.range);}","efire(e,1);}")
rep("fireBroadside(e,-1,e.cannons,e.dmg,'e',e.range);}}","efire(e,-1);}}")
rep(" for(const o of ISL){const m=s.wid*0.7;if(insideIsland(o,s.x,s.y,m))"," for(const o of islCell(s.x,s.y)){const m=s.wid*0.7;if(insideIsland(o,s.x,s.y,m))")
# navy mostly in the core
rep("if(n>=1&&!tutPeace){navyT-=dt;if(navyT<=0){","if(n>=1&&!tutPeace){const core=inCore(P.x,P.y);navyT-=dt*(core?1:0.3);if(navyT<=0){")
rep("if(c<NAVYMAX[n]+(fc>=2?1:0))spawnNavy(n);","if(c<(core?NAVYMAX[n]+(fc>=2?1:0):Math.min(2,NAVYMAX[n])))spawnNavy(n);")
# ---------------- player fire / ammo ----------------
rep("fireBroadside(P,side,ST.cannons,ST.dmg,'p',ST.range,autoAim[side]);cam.shake","playerVolley(side,autoAim[side]);cam.shake")
rep("for(let k=0;k<3;k++)addPart('smoke',px+ox*6,py+oy*6,ox*rand(20,60)+rand(-15,15),oy*rand(20,60)+rand(-15,15),rand(0.6,1.1),rand(6,11),null);",
    "for(let k=0;k<3;k++)addPart('smoke',px+ox*6,py+oy*6,ox*rand(20,60)+rand(-15,15),oy*rand(20,60)+rand(-15,15),rand(0.6,1.1),rand(6,11),owner==='p'?smokeC():null);")
rep("if(p.type==='smoke'){ctx.globalAlpha=a*0.5;ctx.fillStyle='#ddd';","if(p.type==='smoke'){ctx.globalAlpha=a*0.5;ctx.fillStyle=p.color||'#ddd';")
# ---------------- balls ----------------
rep("  if(b.owner==='p'||b.owner==='f'){for(const e of enemies){if(!e.sinking&&hitTest(e,b,5)){damageEnemy(e,b.dmg);hit=true;break;}}\n   if(!hit)for(const sk of sharks){if(!sk.sinking&&hitTest(sk,b,5)){damageShark(sk,b.dmg);hit=true;break;}}}\n  else if(!P.dead&&hitTest(P,b,2)){damagePlayer(b.dmg);hit=true;}",
    "  if(b.ig>0)b.ig-=dt;\n  if(b.owner==='p'||b.owner==='f'){for(const e of enemies){if(!e.sinking&&hitTest(e,b,5)){damageEnemy(e,b.dmg);if(b.am)ammoHit(e,b);hit=true;break;}}\n   if(!hit)for(const sk of sharks){if(!sk.sinking&&hitTest(sk,b,5)){damageShark(sk,b.dmg);hit=true;break;}}\n   if(!hit&&b.owner==='p')hit=fortBallHit(b);}\n  else if(b.owner==='c'&&clanBallHit(b))hit=true;\n  else if(b.owner==='c'&&!b.pl){}\n  else if(!P.dead&&hitTest(P,b,2)){damagePlayer(b.dmg);hit=true;}")
rep("  if(!hit&&inAnyIsland(b.x,b.y,0)){hit=true;","  if(!hit&&!(b.ig>0)&&inAnyIsland(b.x,b.y,0)){hit=true;")
# ---------------- update hooks ----------------
rep("  sharkSpawnTick();\n","  sharkSpawnTick();expSlowTick();\n")
rep(" updateFleet(dt);missionTick(dt);"," updateFleet(dt);missionTick(dt);expTick(dt);")
rep("if(enemies.filter(e=>e.kind!=='boss').length<14)spawnNear(1000,2000);","if(enemies.filter(e=>e.kind!=='boss'&&!e.lead).length<14)spawnNear(1000,2000);")
rep("if(!e.keep&&((e.kind!=='boss'&&d>2800)","if(!e.keep&&((e.kind!=='boss'&&d>(e.kind==='clan'?3200:2800))")
# ---------------- render ----------------
rep(" for(const o of ISL){if(o.x+o.half<x0||o.x-o.half>x1||o.y+o.half<y0||o.y-o.half>y1)continue;ctx.drawImage(o.canvas,o.x-o.half,o.y-o.half);}"," drawIslands(x0,x1,y0,y1);drawForts(x0,x1,y0,y1,ts);")
rep("else if(e.kind==='boss')drawShip(e,'#8c1c26','#111',1);","else if(e.kind==='clan')drawShip(e,e.rev?'rgba(200,255,230,0.55)':CLANS[e.clan].sail,CLANS[e.clan].col,1);else if(e.kind==='boss')drawShip(e,'#8c1c26','#111',1);")
rep("else drawShip(P,S.infamy>=6000?'#ffe08a':'#fff8e7','#111',P.throttle);","else drawShip(P,playerSail(),'#111',P.throttle);")
rep(" ctx.fillStyle='#111';for(const b of balls){ctx.beginPath();ctx.arc(b.x,b.y,3.6,0,TAU);ctx.fill();}"," drawBallsX();drawShells();")
rep("ctx.fillStyle=s.hitT>0?'#c0503a':'#7b4a23';","ctx.fillStyle=s.hitT>0?'#c0503a':(s.paint||'#7b4a23');")
rep("ctx.fillStyle='#b07b45';ctx.fill();","ctx.fillStyle=s.deck||'#b07b45';ctx.fill();")
rep("ctx.fillStyle='#111';ctx.beginPath();ctx.moveTo(fm,-7)","ctx.fillStyle=(s.kind==='player'&&s.flagC)||'#111';ctx.beginPath();ctx.moveTo(fm,-7)")
rep("ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fm-10","ctx.fillStyle=(s.kind==='player'&&s.flagS)||'#fff';ctx.beginPath();ctx.arc(fm-10")
rep("if(e.hp<e.maxHp||e.kind==='boss'||e.tut){","if(e.hp<e.maxHp||e.kind==='boss'||e.tut||e.lead||e.lev){")
rep("ctx.font='bold 11px sans-serif';ctx.fillStyle=e.kind==='merchant'?","ctx.font='bold 11px sans-serif';ctx.fillStyle=e.kind==='clan'?CLANS[e.clan].lc:e.lev?'#ffd0d0':e.kind==='merchant'?")
rep("ctx.fillText(e.tut?'🎯 Training Target':","ctx.fillText(e.kind==='clan'?clanLabel(e):e.lev?`🐋 HMS Leviathan Lv${e.lvl}`:e.tut?'🎯 Training Target':")
rep(" for(const tx of texts){const a=clamp(tx.life/tx.max*1.5,0,1);"," drawFortLabels();\n for(const tx of texts){const a=clamp(tx.life/tx.max*1.5,0,1);")
rep(" if(state==='map'){drawBigMap();}\n}"," if(state==='map'){drawBigMap();}else mapOpen=false;\n}")
# old drawMap/drawBigMap removed (new versions in module)
a=s.index("function drawMap(X,Y,s,big){const k=s/WORLD;");b=s.index("// ---------- HUD ----------")
s=s[:a]+s[b:]
# ---------------- input ----------------
rep(" if(state==='map'){state='play';return;}\n if(state!=='play')return;"," if(state==='map'){mapDown(e);return;}\n if(state!=='play')return;")
rep("const endJoy=e=>{","cv.addEventListener('pointermove',mapMove);cv.addEventListener('pointerup',mapUp);cv.addEventListener('pointercancel',e=>{mapPtr.delete(e.pointerId);mapPinch=null;});\ncv.addEventListener('wheel',e=>{if(state!=='map')return;e.preventDefault();setZoom(MV.z*(e.deltaY<0?1.25:0.8),e.clientX,e.clientY);},{passive:false});\nconst endJoy=e=>{")
rep("else if((k==='f'||k==='enter')&&actQ)startDig();","else if((k==='f'||k==='enter')&&(actQ||fortAct))actTap();else if(k==='r')cycleAmmo();")
rep("tapBtn('actBtn',()=>startDig());","tapBtn('actBtn',()=>actTap());tapBtn('ammoBtn',()=>{if(state==='play'||state==='map')cycleAmmo();});")
rep(" {const show=state==='play'&&!!actQ&&!boardTgt;$('actBtn').classList.toggle('hidden',!show);if(show)setTxt('actBtn',digQ?`⛏ Digging… ${Math.min(99,Math.round(digT/2.2*100))}%`:'⛏ Dig for treasure');}",
    " {const a=actLabel();const show=state==='play'&&!!a&&!boardTgt;$('actBtn').classList.toggle('hidden',!show);if(show)setTxt('actBtn',a);}updAmmoBtn();")
rep("setTxt('hRank','⭐ '+rankOf(S.infamy));","setTxt('hRank',(S.king?'👑 ':'⭐ ')+rankOf(S.infamy));")
rep("for(const id of ['fireL','fireR','autoBtn','boostBtn',","for(const id of ['fireL','fireR','autoBtn','boostBtn','ammoBtn',")
# ---------------- HTML / CSS ----------------
rep('<button id="actBtn" class="hidden">⛏ Dig for treasure</button>','<button id="actBtn" class="hidden">⛏ Dig for treasure</button>\n<button id="ammoBtn" class="btnr hidden" aria-label="Switch ammo"><span id="ammoIc">⚫</span><b id="ammoN">∞</b></button>')
rep('<button data-m="trophies">🏆 Trophies</button></div>','<button data-m="trophies">🏆 Trophies</button><button data-m="style">🎨 Style</button><button data-m="rep">🏴 Republic</button></div>')
rep('<div id="dead" class="overlay hidden">','''<div id="fortUI" class="overlay hidden"><div class="panel">
  <div class="phead"><h2 id="fName">🏰 Fort</h2><button class="big" id="fClose">⛵ To sea</button></div>
  <div class="scroll" id="fBody"></div>
</div></div>

<div id="dead" class="overlay hidden">''')
rep("#boostBtn.tip{animation:btip .8s infinite alternate}","""#boostBtn.tip{animation:btip .8s infinite alternate}
#ammoBtn{width:52px;height:52px;right:calc(118px + env(safe-area-inset-right));bottom:calc(108px + env(safe-area-inset-bottom));font-size:12px;line-height:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
#ammoBtn span{font-size:19px}#ammoBtn.on{background:rgba(150,60,20,.85);box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,200,140,.9)}
body.steer-btns #ammoBtn{right:calc(178px + env(safe-area-inset-right));bottom:calc(108px + env(safe-area-inset-bottom))}""")
# ---------------- port / menu ----------------
rep("function portAction(act,arg){if(act==='xfer'){openXfer();return;}","function portAction(act,arg){if(act==='xfer'){openXfer();return;}if(exPortAction(act,arg)){if(state==='port')renderPort();save();return;}")
rep("  h+=row('🔧 Repair hull',","  h+=dockExtraHTML(p);h+=row('🔧 Repair hull',")
rep("h+=hullShopHTML(p);}","h+=hullShopHTML(p);h+=armoryHTML();}")
rep(",!max&&S.gold>=c,k));}}\n else if(tab==='market')",",!max&&S.gold>=c,k));}h+=officersHTML(p);}\n else if(tab==='market')")
rep(" dockQuests(pi);\n"," dockQuests(pi);exDock(pi);\n")
rep("function mk(){const p=PORTS[curPort];return p&&!p.haven?1+0.15*stars():1;}","function mk(){const p=PORTS[curPort];return p&&!p.haven?1+0.15*stars():(p&&p.clan!=null&&rep(p.clan)>=REP_ALLY?0.85:1);}")
rep("function tryDock(pi){const p=PORTS[pi];","function tryDock(pi){const p=PORTS[pi];if(p.clan!=null&&clanHostile(p.clan)){toast(`⛔ ${p.name} bars its harbour — you are at war with the ${CLANS[p.clan].name}.`);return;}")
rep("setTxt('dockBtn',!pp.haven&&stars()>=3?","setTxt('dockBtn',pp.clan!=null&&clanHostile(pp.clan)?`⛔ ${pp.name} (at war)`:!pp.haven&&stars()>=3?")
rep("if(mView==='trophies'){$('mBody').innerHTML=trophiesHTML();return;}","if(mView==='trophies'){$('mBody').innerHTML=trophiesHTML();return;}if(mView==='style'){$('mBody').innerHTML=styleHTML();return;}if(mView==='rep'){$('mBody').innerHTML=repHTML();return;}")
rep(" if(a==='learn'){learn(b.dataset.arg);renderMenu();}"," if(a==='cos'){equipCos(b.dataset.arg);renderMenu();return;}if(a==='leg'){learnLeg();renderMenu();return;}\n if(a==='learn'){learn(b.dataset.arg);renderMenu();}")
rep(" h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');"," h+=row('🏴 Pirate Republic',`${ownedForts()} forts • ${leadersDown()}/4 clan leaders sunk${S.king?' • 👑 Pirate King':''}`,btn('mv','Open',true,'rep'));\n h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');")
rep("$('mClose').addEventListener('click',()=>{","$('fClose').addEventListener('click',closeFort);$('fBody').addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled||!curFort)return;const f=curFort,s=S.forts[f.id];if(!s)return;const k=b.dataset.act==='fug'?'g':'w';const c=fortUpCost(f,k);const key=k==='g'?'ug':'uw';if((s[key]|0)<3&&S.gold>=c){S.gold-=c;s[key]=(s[key]|0)+1;delete FRT[f.id];chime();toast(`🏰 ${f.name} upgraded!`);save();}renderFort();});\n$('mClose').addEventListener('click',()=>{")
rep(" board:\"🏳️ <b>They surrendered!</b>",""" republic:"⚔️ <b>Pirate Republic Wars!</b> Four pirate clans fight over these outer waters. Attack a clan and it goes to war with you; do its contracts and it becomes an ally (☰ ➜ 🏴 Republic). 🏰 <b>Forts</b> shoot hostile ships — silence the cannons, breach the walls, then <b>Storm</b> them.",
 fort:"🏰 <b>Your first fort!</b> It pays tribute over time (collected when you sail by, or by courier at havens), shoots your enemies, and can be upgraded (tap 🏰 Manage nearby). The clan will try to take it back — defend it when the 🛡️ appears!",
 ammo:"⛓️ <b>Special ammo!</b> Tap the ammo button beside your fire buttons (key R) to switch shot. Chain shot slows ships; fire and mortar come later. Buy more volleys in port (🛠️ Ship tab).",
 board:\"🏳️ <b>They surrendered!</b>""")
# ---------------- quests ----------------
rep("function genQuest(pi,avoid){const ri=rankIdx();","function genQuest(pi,avoid){if(PORTS[pi].outer&&Math.random()<0.5){let cq=null;try{cq=genClanQ(pi,avoid);}catch(e){console.warn(e);}if(cq)return cq;}const ri=rankIdx();")
rep(" let to=pi;while(to===pi)to=(Math.random()*PORTS.length)|0;"," const cand=PORTS.map((x,i)=>i).filter(i=>i!==pi&&Math.hypot(PORTS[i].port.x-p.port.x,PORTS[i].port.y-p.port.y)<7000);let to=cand.length?pick(cand):(pi?0:1);")
rep("const law=PORTS.map((x,i)=>i).filter(i=>!PORTS[i].haven&&i!==pi);","const law=PORTS.map((x,i)=>i).filter(i=>!PORTS[i].haven&&i!==pi&&Math.hypot(PORTS[i].port.x-pp.x,PORTS[i].port.y-pp.y)<7000);",2)
rep("if(a===b||b.haven)continue;","if(a===b||b.haven||Math.hypot(a.port.x-pp.x,a.port.y-pp.y)>6500||Math.hypot(b.port.x-pp.x,b.port.y-pp.y)>7500)continue;")
rep("const zi=(Math.random()*SHARKZ.length)|0,z=SHARKZ[zi];","const zs=SHARKZ.map((z,i)=>i).filter(i=>Math.hypot(SHARKZ[i].x-pp.x,SHARKZ[i].y-pp.y)<7000),zi=zs.length?pick(zs):0,z=SHARKZ[zi];")
s=s.replace("zi%5","zi%ZONE_NAMES.length")
rep("const ZONE_NAMES=['Bloody Shoals','Jaws Reef','Red Water','Dead Man\\'s Deep','Grey Fin Bank'];","const ZONE_NAMES=['Bloody Shoals','Jaws Reef','Red Water','Dead Man\\'s Deep','Grey Fin Bank','The Maw','Widowmaker Deep','Crimson Tide','Bone Gardens','The Churn','Leviathan Trench','Gutter Reef','Blackfin Abyss','Serpent Shallows'];")
rep(",2,10)",",2,13)",None) if False else None
s=s.replace("clamp(lvlAt(x,y)+1,2,10)","clamp(lvlAt(x,y)+1,2,13)").replace("clamp(lvlAt(pt.x,pt.y)+1,2,10)","clamp(lvlAt(pt.x,pt.y)+1,2,13)").replace("clamp(lvlAt(tp.x,tp.y)+1,2,10)","clamp(lvlAt(tp.x,tp.y)+1,2,13)")
rep("S.st.jobs=(S.st.jobs|0)+1;statFor(q);","S.st.jobs=(S.st.jobs|0)+1;statFor(q);clanJobDone(q);")
rep("case 'treasure':return digQ===q?'digging…':'dig at the ❌';default:return'';}}","case 'treasure':return digQ===q?'digging…':'dig at the ❌';case 'clanhunt':return`${q.have}/${q.need}`;case 'fortraid':return fortOwner(FORTS[q.fid])==='p'?'captured':'capture the fort';default:return'';}}")
rep("case 'shark':{const z=q.mega?SHARKZ[q.zi]||SHARKZ[0]:nearestZone();return{x:z.x,y:z.y,icon:'🦈',c:'#ff6b6b'};}}return null;}","case 'shark':{const z=q.mega?SHARKZ[q.zi]||SHARKZ[0]:nearestZone();return{x:z.x,y:z.y,icon:'🦈',c:'#ff6b6b'};}case 'clanhunt':case 'fortraid':return clanQTarget(q);}return null;}")
rep("const QICON={bounty:'⚔️',","const QICON={clanhunt:'🏴',fortraid:'🏰',bounty:'⚔️',")
rep("function questTargets(){const out=[];for(const q of S.quests){const t=qTarget(q);if(t)out.push(t);}return out;}","function questTargets(){const out=[];for(const q of S.quests){const t=qTarget(q);if(t)out.push(t);}defendTargets(out);return out;}")
# shark zones: outer zones after the core ones
rep("SHARKZ.push({x,y,r:rad});}})();","SHARKZ.push({x,y,r:rad});}})();\n(function(){const r=rng(5150);let t=0;while(SHARKZ.length<14&&t<600){t++;const x=600+r()*(WORLD-1200),y=600+r()*(WORLD-1200),rad=380+r()*270;if(Math.abs(x-START.x)<CORE_R+400&&Math.abs(y-START.y)<CORE_R+400)continue;\n if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<rad+500))continue;if(FORTS.some(f=>Math.hypot(f.x-x,f.y-y)<rad+300))continue;if(SHARKZ.some(z=>Math.hypot(z.x-x,z.y-y)<z.r+rad+600))continue;SHARKZ.push({x,y,r:rad});}})();")
rep("const x=500+r()*(WORLD-1000),y=500+r()*(WORLD-1000),rad=330+r()*250;","const x=OFF+500+r()*(OLDW-1000),y=OFF+500+r()*(OLDW-1000),rad=330+r()*250;")
rep("if(!mega&&!tutPeace&&lvlAt(P.x,P.y)>=7&&","if(!mega&&!tutPeace&&lvlAt(P.x,P.y)>=7&&sharks.length<14&&")
# ---------------- module + test hook ----------------
mod=open('/workspace/tools/pg/exp1mod.js').read()
rep("// ---------- BOOT ----------",mod+"\n// ---------- BOOT ----------")
rep("sharkKillQuest,makeTreasureQ,load};","sharkKillQuest,makeTreasureQ,load,X:EXP};")
rep("cam.x=P.x;cam.y=P.y;lastCam.x=cam.x;lastCam.y=cam.y;rebuildFog();populate();placeFleet();","cam.x=P.x;cam.y=P.y;lastCam.x=cam.x;lastCam.y=cam.y;rebuildFog();applyCos();populate();placeFleet();")
open(p,'w').write(s);print('patched',len(s))
