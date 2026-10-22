p='/workspace/pirate-game/index.html';s=open(p).read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(n,a[:120]);s=s.replace(a,b)
CSS="""
#grapBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(240px + env(safe-area-inset-bottom));padding:12px 18px;min-height:52px;border-radius:24px;border:none;font-size:17px;font-weight:800;background:#7a3e12;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,220,150,.7);touch-action:none;white-space:nowrap;animation:pulse 1s infinite}
#brCtl .btnr{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:24px;line-height:1}#brCtl .btnr b{font-size:10px;margin-top:2px}
#bSlash{width:86px;height:86px;right:calc(16px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));background:rgba(170,40,30,.85)!important;font-size:32px!important}
#bBlock{width:68px;height:68px;right:calc(114px + env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom));background:rgba(40,90,160,.85)!important}
#bPistol{width:60px;height:60px;right:calc(28px + env(safe-area-inset-right));bottom:calc(124px + env(safe-area-inset-bottom));background:rgba(90,70,40,.85)!important}
#bDodge{width:58px;height:58px;right:calc(116px + env(safe-area-inset-right));bottom:calc(98px + env(safe-area-inset-bottom));background:rgba(40,120,90,.85)!important}
#brCtl .btnr.held{filter:brightness(1.4)}#brCtl .btnr.dim{opacity:.45}
#bCut{position:fixed;top:calc(10px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));min-height:40px;padding:6px 12px;border:none;border-radius:18px;background:rgba(120,30,20,.82);color:#fff;font-weight:800;font-size:13px;touch-action:none;z-index:6}
body.brawl #fireL,body.brawl #fireR,body.brawl #autoBtn,body.brawl #boostBtn,body.brawl #ammoBtn,body.brawl #actBtn,body.brawl #boardBar,body.brawl #dockBtn,body.brawl #menuBtn,body.brawl .steerctl,body.brawl #mTrack,body.brawl #grapBtn{display:none!important}
#brPick .panel,#brRes .panel{width:min(430px,100%);padding:12px 14px;overflow:auto;gap:4px}#brPick h2,#brRes h2{margin:2px 0 6px;font-size:19px}
#brPick .tac{display:block;width:100%;text-align:left;margin:6px 0;min-height:52px;white-space:normal}#brPick .tac small{display:block;font-weight:500;font-size:12px;opacity:.9}
#brPick .help{font-size:12px;margin-top:6px}#brPick .tb,#brBtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}#brBtns button{min-height:48px;flex:1}
@media (max-height:520px) and (orientation:landscape){#grapBtn{bottom:calc(18px + env(safe-area-inset-bottom))}#bPistol{bottom:calc(112px + env(safe-area-inset-bottom))}}
</style>"""
rep("\n</style>",CSS)
rep('<div id="boardBar" class="hidden">','''<button id="grapBtn" class="hidden">🪝 Board her!</button>
<div id="brCtl" class="hidden"><button id="bSlash" class="btnr" aria-label="Slash">⚔️<b>SLASH</b></button><button id="bBlock" class="btnr" aria-label="Block or parry">🛡️<b>BLOCK</b></button><button id="bPistol" class="btnr" aria-label="Pistol">🔫<b id="bPn">2</b></button><button id="bDodge" class="btnr" aria-label="Dodge roll">💨<b>DODGE</b></button></div>
<button id="bCut" class="hidden">✂️ Cut ropes</button>
<div id="brPick" class="overlay hidden"><div class="panel"><h2 id="bpTitle"></h2><div id="bpInfo" class="note"></div><div id="bpTacs"></div><div id="bpHelp" class="help"></div><div class="tb"><button id="bpCut" class="b red">✂️ Cut the ropes</button></div></div></div>
<div id="brRes" class="overlay hidden"><div class="panel"><h2 id="brTitle"></h2><div id="brTxt" class="note"></div><div id="brBtns"></div></div></div>
<div id="boardBar" class="hidden">''')
rep('<button data-tab="crew">👥 Crew</button>','<button data-tab="crew">👥 Crew</button><button data-tab="arms">⚔️ Arms</button>')
rep("off:{},unl:1};}","off:{},unl:1,cap:{sw:0,pi:0,ar:0,sty:'',cw:0,ca:0,tr:0},bst:{win:0,loss:0,duel:0,repel:0,raid:0,parry:0,ko:0,ret:0,feed:0}};}")
rep(" migrateExp(d);\n"," migrateExp(d);migrateBoard(d);\n")
rep("function isHostile(e){if(e.kind==='shark')","function isHostile(e){if(e.grap)return false;if(e.kind==='shark')")
rep(" e.rl-=dt;e.rr-=dt;e.hitT-=dt;burnTick(e,dt);if(e.sinking)return;\n"," e.rl-=dt;e.rr-=dt;e.hitT-=dt;burnTick(e,dt);if(e.sinking)return;\n if(e.grap){grapPin(e,dt);return;}if(repelTry(e,dt))return;\n")
rep(" else{\n  let desired=P.h;"," else if(state==='brawl'){P.speed*=0.9;P.vx*=0.9;P.vy*=0.9;P.throttle=0;P.rl=Math.max(0,P.rl-dt);P.rr=Math.max(0,P.rr-dt);autoFire();if(ST.regen>0&&P.hp<ST.maxHp)P.hp=Math.min(ST.maxHp,P.hp+ST.regen*dt);}\n else{\n  let desired=P.h;")
rep(" if(state==='play')update(dt);\n"," if(state==='play')update(dt);\n else if(state==='brawl')brawlFrame(dt);\n")
rep(" render(t);tutTick(dt);"," if(state==='brawl'&&BR.on)brawlRender(t);else render(t);tutTick(dt);")
rep(""" if(state!=='play')return;
 const m=miniRect();if(e.clientX>=m.x""",""" if(state!=='play'&&!(state==='brawl'&&BR.ph==='fight'))return;
 const m=miniRect();if(state==='play'&&e.clientX>=m.x""")
rep(" if(state==='play'){if(k==='q'||k==='j')fire(-1);"," if(state==='brawl'){brawlKey(k,true);return;}\n if(state==='play'&&(k==='g'||((k==='f'||k==='enter')&&!boardTgt&&!actQ&&!fortAct&&nearPort<0))&&grapTgt){grappleStart(grapTgt);return;}\n if(state==='play'){if(k==='q'||k==='j')fire(-1);")
rep("window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});","window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(state==='brawl')brawlKey(e.key.toLowerCase(),false);});")
rep("if(show)setTxt('actBtn',a);}updAmmoBtn();","if(show)setTxt('actBtn',a);}updAmmoBtn();brawlHUD();")
rep("function damagePlayer(dmg,bite){if(P.dead)return;","function damagePlayer(dmg,bite){if(P.dead)return;if(BR.on&&!bite){brawlShipHit(dmg);dmg*=0.4;}")
rep("function damageEnemy(e,dmg){const was=e.angry;","function damageEnemy(e,dmg){if(e.grap&&BR.on)return;const was=e.angry;")
rep("function npcDamage(e,dmg){","function npcDamage(e,dmg){if(e.grap&&BR.on)return;")
rep("else if(gunsUp(rt)===0&&rt.wall<=0){bd=d;fortAct={f,kind:'storm'};}}","else if(gunsUp(rt)===0&&rt.wall<=0){bd=d;fortAct={f,kind:'storm'};}else if(rt.wall<=rt.wallMax*0.6){bd=d;fortAct={f,kind:'raid'};}}")
rep("if(fortAct)return fortAct.kind==='storm'?","if(fortAct)return fortAct.kind==='raid'?`⚔️ Raid the gate of ${fortAct.f.name}`:fortAct.kind==='storm'?")
rep(" if(fortAct.kind==='manage'){openFort(f);return;}"," if(fortAct.kind==='manage'){openFort(f);return;}if(fortAct.kind==='raid'){raidStart(f);return;}")
rep("const loss=Math.max(1,Math.round((2+f.lvl/3)","const loss=raidCap?0:Math.max(1,Math.round((2+f.lvl/3)")
rep(" else if(tab==='market'){"," else if(tab==='arms'){h+=armsHTML(p);}\n else if(tab==='market'){")
rep("function exPortAction(act,arg){if(act==='ft')","function exPortAction(act,arg){if(armsAction(act,arg))return true;if(act==='ft')")
rep("()=>Object.keys(S.off).length>=5]];","""()=>Object.keys(S.off).length>=5],
 ['board1','🪝','Boarding Party','Win your first boarding brawl',()=>(S.bst.win|0)>=1],['board25','⚔️','Deck Master','Win 25 boarding brawls',()=>(S.bst.win|0)>=25],
 ['duel1','🤺','Duelist','Beat a boss or clan leader in a captain duel',()=>(S.bst.duel|0)>=1],['duel4','🗡️','Blade of the Republic','Win 4 captain duels',()=>(S.bst.duel|0)>=4],
 ['repel5','🛡️','Repel Boarders!','Throw off 5 enemy boarding parties',()=>(S.bst.repel|0)>=5],['raid1','🚪','Gatecrasher','Take a fort by storming its gate',()=>(S.bst.raid|0)>=1],
 ['parry50','✨','Parry Master','Parry 50 attacks',()=>(S.bst.parry|0)>=50],['ko100','💪','Brawler of the Seas','Knock out 100 enemy fighters',()=>(S.bst.ko|0)>=100],
 ['feed','🦈','Walk the Plank','Knock an enemy overboard to the sharks',()=>(S.bst.feed|0)>=1]];""")
rep(" if(l===30)out.push('⭐ Renown points');return out;}"," if(l===30)out.push('⭐ Renown points');out.push(...boardUnlocks(l));return out;}")
rep("'+4% speed, +6% turning']","'+4% speed, +6% turning; +1 boarding fighter, +10% crew HP']")
rep("half as many crew lost to cannon fire']","half as many crew lost to cannon fire; 35% fewer boarding casualties']")
rep("'+8% cannon damage, special ammo 20% cheaper']","'+8% cannon damage, special ammo 20% cheaper, +1 pistol shot']")
rep("'Boost recharges 12% faster']","'Boost recharges 12% faster; +12% crew melee, hooks cut less often']")
rep(" h+=row('🏴 Pirate Republic',"," h+=row('⚔️ Captain',capSummary(),'');\n h+=row('🏴 Pirate Republic',")
rep(' board:"🏳️ <b>They surrendered!</b>',''' grapple:"🪝 <b>Boarding!</b> Pull alongside an enemy (best below half hull) and tap <b>🪝 Board</b>. On deck: drag to move, ⚔️ slash (tap for combos), 🛡️ block — tap just before a hit to <b>parry</b>, 🔫 pistol, 💨 dodge red attacks.",
 board:"🏳️ <b>They surrendered!</b>''')
rep("drawBallsX();drawShells();","drawBallsX();drawShells();drawGrapple();")
rep("function expTick(dt){fortTick(dt);","function expTick(dt){boardTick(dt);grapScan();fortTick(dt);")
mod=open('/workspace/tools/pg/boardmod.js').read()
rep("const EXP={",mod+"""
// brawl controls
(function(){const B=(id,fn)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();initAudio();if(BR.on&&BR.ph==='fight'&&BR.me)fn(BR.me.inp);});};
 B('bSlash',i=>{i.slash=1;});B('bPistol',i=>{i.pistol=1;});B('bDodge',i=>{i.dodge=1;});
 const bb=$('bBlock'),ids=new Set();bb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ids.add(e.pointerId);try{bb.setPointerCapture(e.pointerId);}catch(_){}BR.blockHeld=1;bb.classList.add('held');});
 const up=e=>{if(!ids.delete(e.pointerId))return;if(!ids.size){BR.blockHeld=0;bb.classList.remove('held');}};bb.addEventListener('pointerup',up);bb.addEventListener('pointercancel',up);bb.addEventListener('lostpointercapture',up);holdBtns.push(()=>{ids.clear();BR.blockHeld=0;bb.classList.remove('held');});
 tapBtn('bCut',cutRopes);tapBtn('grapBtn',()=>{if(state==='play'&&grapTgt)grappleStart(grapTgt);});tapBtn('bpCut',cutRopes);
 $('bpTacs').addEventListener('click',e=>{const b=e.target.closest('button[data-tac]');if(b)chooseTactic(b.dataset.tac);});
 $('brBtns').addEventListener('click',e=>{const b=e.target.closest('button[data-br]');if(b&&!b.disabled)resChoice(b.dataset.br);});})();
const BRAPI={BR,GR,startBrawl,grappleStart,chooseTactic,resChoice,cutRopes,capStats,crewStats,raidStart,endBrawl,armsAction,SWORDS,PISTOLS,ARMORS,STYLES,CREWG,get grapTgt(){return grapTgt},set grapCd(v){grapCd=v},foeTotal,boardUnlocks,spawnFighter,sim:(n,dt)=>{for(let i=0;i<n&&BR.on;i++)brawlFrame(dt||1/60);}};
const EXP={""")
rep("window.__game={","window.__game={B:BRAPI,")
open(p,'w').write(s);print('patched',len(s))
