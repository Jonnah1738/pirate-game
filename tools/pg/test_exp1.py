import json,sys,math
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OLD='http://127.0.0.1:8765/old_exp.html'
OUT='/workspace/pirate-game/screenshots-exp1/'+('live_' if LIVE else '')
E=lambda pg,js: pg.evaluate(js)
errs=[]
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
def sim(pg,sec,dt=1/60): E(pg,f"(()=>{{for(let i=0;i<{int(sec/dt)};i++)__game.step({dt});}})()")
def tp(pg,x,y): E(pg,f"(()=>{{const g=__game;g.P.x={x};g.P.y={y};g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;}})()")
def fps(pg,ms=4000):
    return E(pg,f"""new Promise(r=>{{let n=0,t0=performance.now(),worst=0,last=t0,ws=[];function f(t){{n++;const d=t-last;ws.push(d);worst=Math.max(worst,d);last=t;if(t-t0<{ms})requestAnimationFrame(f);else{{ws.sort((a,b)=>b-a);r([Math.round(n*1000/(t-t0)),Math.round(worst),ws.slice(0,5).map(Math.round)])}}}}requestAnimationFrame(f);}})""")
SAVE0={"gold":5000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":2000,"xp":0,"ship":"frigate","up":{"hull":8,"sails":6,"cannons":8,"cargo":4,"rigging":2,"command":1},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2}}
def inject(ctx,pg,saveobj,url=URL,tag='x',raw=False):
    if pg: pg.close()
    pg=ctx.new_page();hook(pg,tag)
    js=json.dumps(saveobj) if not raw else saveobj
    pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%js)
    pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(600);return pg
def fresh(b,w,h,save=None,url=URL,tag=''):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2)
    if save is not None: return ctx,inject(ctx,None,save,url,tag or f'{w}x{h}')
    pg=ctx.new_page();hook(pg,tag or f'{w}x{h}');pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(300)
    return ctx,pg
def start(pg):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    E(pg,"(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tips={republic:1,fort:1,ammo:1,merchant:1,shark:1,wanted:1,board:1};})()")
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    if not LIVE:
        # ---------- 1. old save + old PSEAS1 code migrate ----------
        ctx,pg=fresh(b,390,844,{"gold":777,"crew":20,"tutDone":True,"seen":True,"bal":2,"infamy":900,"xp":3000,"clvl":12,"sp":11,"lastPort":2},OLD,'old');start(pg)
        E(pg,"(()=>{const g=__game;g.P.x=5000;g.P.y=3500;g.step(0.4);g.S.quests.push({id:900,from:0,type:'treasure',x:3300,y:3300,lvl:3,cost:0,guard:false,reward:300,title:'Old map',text:''});g.S.quests.push({id:901,from:0,type:'race',pts:[{x:4100,y:4100},{x:4400,y:4400}],i:0,tl:60,t:60,started:false,reward:90,title:'Old race',text:''});})()")
        sim(pg,1.0)
        old=E(pg,"(()=>{const g=__game;g.S.x=g.P.x;g.save&&g.save();let n=0;return {x:g.P.x,y:g.P.y,isl:!!g.inAnyIsland(g.P.x,g.P.y,0),code:g.makeCode(),core:[]}})()")
        E(pg,"window.dispatchEvent(new Event('pagehide'))");pg.wait_for_timeout(200)
        oldIsl=E(pg,"(()=>{const r=[];for(let x=300;x<8000;x+=500)for(let y=300;y<8000;y+=500)r.push(__game.inAnyIsland(x,y,0)?1:0);return r})()")
        oldLv=E(pg,"(()=>{const r=[];for(let x=300;x<8000;x+=900)for(let y=300;y<8000;y+=900)r.push(__game.lvlAt(x,y));return r})()")
        rawOld=E(pg,"localStorage.getItem('pirateSeas_save_v1')")
        oldFog=json.loads(rawOld)['fog'].count('1')
        pg.goto(URL+'?t=2');pg.wait_for_timeout(700)
        new=E(pg,"(()=>{const g=__game,S=g.S;let f=0;const fog=[];return {x:g.P.x,y:g.P.y,gold:S.gold,wv:S.wv,q:S.quests.map(q=>[q.type,q.x,q.y,q.pts?q.pts[0].x:null]),lastPort:S.lastPort,explored:g.X.explored()}})()")
        newIsl=E(pg,"(()=>{const r=[];for(let x=300;x<8000;x+=500)for(let y=300;y<8000;y+=500)r.push(__game.inAnyIsland(x+8000,y+8000,0)?1:0);return r})()")
        newLv=E(pg,"(()=>{const r=[];for(let x=300;x<8000;x+=900)for(let y=300;y<8000;y+=900)r.push(__game.lvlAt(x+8000,y+8000));return r})()")
        print('  old gold',json.loads(rawOld)['gold']);print('MIGRATION old pos',[round(old['x']),round(old['y'])],'-> new',[round(new['x']),round(new['y'])],'wv',new['wv'],'gold',new['gold'],'quests',new['q'])
        print('  core islands identical:',oldIsl==newIsl,'danger levels identical:',oldLv==newLv,'fog cells old',oldFog,'new explored frac',round(new['explored'],5),'(=',round(new['explored']*240*240),'cells)')
        assert abs(new['x']-old['x']-8000)<1 and new['wv']==2 and oldIsl==newIsl and abs(new['explored']*57600-oldFog)<2
        start(pg);pg.screenshot(path=OUT+'01_migrated_old_save_portrait.png')
        # old export code
        ds=E(pg,f"JSON.stringify(__game.parseCode({json.dumps(old['code'])}).s)");pg=inject(ctx,pg,ds,URL,'imp-old',raw=True)
        imp=E(pg,"(()=>{const g=__game;return {x:g.P.x,y:g.P.y,gold:g.S.gold,ex:Math.round(g.X.explored()*57600),wv:g.S.wv}})()")
        print('OLD PSEAS1 import ->',imp);assert abs(imp['x']-old['x']-8000)<1 and imp['wv']==2
        ctx.close()
    # ---------- 2. Republic systems (portrait) ----------
    ctx,pg=fresh(b,390,844,SAVE0,tag='portrait');start(pg)
    info=E(pg,"(()=>{const g=__game,X=g.X;return{ports:g.PORTS.length,outerPorts:g.PORTS.filter(p=>p.outer).map(p=>p.name),islands:X.ISL.length,forts:X.FORTS.length,sharkZones:X.SHARKZ.length,lv:[g.lvlAt(12000,12000),g.lvlAt(16000,12000),g.lvlAt(20000,12000),g.lvlAt(23500,23500)]}})()")
    print('WORLD',info)
    # minimap in outer waters
    f0=E(pg,"(()=>{const f=__game.X.FORTS[0];return{x:f.x,y:f.y,a:f.a,name:f.name,clan:f.clan,lvl:f.lvl}})()")
    tp(pg,f0['x']+math.cos(f0['a'])*700,f0['y']+math.sin(f0['a'])*700);sim(pg,1.5)
    terr=E(pg,"__game.X.clanAt(__game.P.x,__game.P.y)")
    print('fort0',f0['name'],'clan',f0['clan'],'lvl',f0['lvl'],'player territory',terr)
    # rep: hit a neutral clan ship
    r=E(pg,"(()=>{const g=__game;g.enemies.length=0;const e=g.makeEnemy('clan',g.P.x+300,g.P.y,8,{clan:1});g.enemies.push(e);const h0=g.X.clanHostile(1);const r0=g.S.rep[1];const host0=e.angry;g.balls.push({x:e.x,y:e.y,vx:0,vy:0,life:0.5,dmg:5,owner:'p'});g.step(1/60);return [r0,g.S.rep[1],h0,e.angry]})()")
    print('REP hit neutral Black Tide ship: rep',r[0],'->',r[1],'angry',r[3])
    # skirmish
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.X.spawnSkirmish(true);})()");
    sk0=E(pg,"__game.enemies.filter(e=>e.kind==='clan').map(e=>[e.clan,Math.round(e.hp)])")
    E(pg,"(()=>{const g=__game;const cl=g.enemies.filter(e=>e.kind==='clan');const c=cl.reduce((a,e)=>a+e.x,0)/cl.length,d=cl.reduce((a,e)=>a+e.y,0)/cl.length;g.P.x=c;g.P.y=d+700;})()")
    sim(pg,2.0);pg.wait_for_timeout(200);pg.screenshot(path=OUT+'02_skirmish_portrait.png')
    sim(pg,18)
    sk1=E(pg,"(()=>{const g=__game;return {ships:g.enemies.filter(e=>e.kind==='clan').map(e=>[e.clan,Math.round(e.hp),e.sinking?1:0]),cballs:g.balls.filter(b=>b.owner==='c').length,loot:g.loot.length}})()")
    print('SKIRMISH before',sk0,'after 20s',sk1)
    # fort siege
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.balls.length=0;g.S.rep[0]=0;g.P.hp=g.ST().maxHp;if(g.sharks)g.sharks.length=0;})()")
    tp(pg,f0['x']+math.cos(f0['a'])*450,f0['y']+math.sin(f0['a'])*450);sim(pg,0.5)
    rt=E(pg,"(()=>{const g=__game,X=g.X,f=X.FORTS[0];const rt=X.fortRT(f);return {guns:rt.guns.length,wall:rt.wall,act:X.fortAct&&X.fortAct.kind}})()")
    E(pg,"__game.X.FRT[0].angry=true")
    sim(pg,6)
    hp6=E(pg,"[Math.round(__game.P.hp),__game.ST().maxHp,__game.balls.filter(b=>b.owner==='c').length]");E(pg,"(()=>{const g=__game;g.P.dead=0;g.P.hp=g.ST().maxHp;g.setState('play');document.getElementById('dead').classList.add('hidden');})()")
    pg.wait_for_timeout(100);pg.screenshot(path=OUT+'03_fort_battle_portrait.png')
    E(pg,"(()=>{const g=__game,X=g.X,f=X.FORTS[0],rt=X.FRT[0];for(const gun of rt.guns){g.balls.push({x:gun.x,y:gun.y,vx:0,vy:0,life:0.2,dmg:9999,owner:'p'});}})()");sim(pg,0.1)
    for i in range(6):
        E(pg,"(()=>{const g=__game,f=g.X.FORTS[0];g.balls.push({x:f.x,y:f.y,vx:0,vy:0,life:0.2,dmg:500,owner:'p'});})()");sim(pg,0.05)
    br=E(pg,"(()=>{const X=__game.X,rt=X.FRT[0];return{guns:rt.guns.filter(g=>g.hp>0).length,wall:rt.wall,act:X.fortAct&&X.fortAct.kind,label:document.getElementById('actBtn').textContent}})()")
    E(pg,"__game.P.hp=__game.ST().maxHp");pg.wait_for_timeout(250)
    lbl=E(pg,"document.getElementById('actBtn').textContent");pg.screenshot(path=OUT+'04_fort_breached_portrait.png')
    E(pg,"__game.X.actTap()");sim(pg,3.3)
    own=E(pg,"(()=>{const g=__game,X=g.X;return{owner:X.fortOwner(X.FORTS[0]),forts:X.ownedForts(),rep0:g.S.rep[0],ach:!!g.S.ach.fort1||null}})()")
    print('FORT siege: start',rt,'player hp after 6s of fire',hp6,'breached',br,'btn',lbl,'-> captured',own)
    assert own['owner']=='p'
    E(pg,"__game.S.forts[0].nx=1e9");tp(pg,f0['x']+math.cos(f0['a'])*900,f0['y']+math.sin(f0['a'])*900)
    for _ in range(12): E(pg,"(()=>{const g=__game;g.P.hp=g.ST().maxHp;if(g.sharks)g.sharks.length=0;g.enemies.length=0;})()");sim(pg,5)
    g60=E(pg,"Math.round(__game.S.forts[0].g||0)");tp(pg,f0['x']+math.cos(f0['a'])*300,f0['y']+math.sin(f0['a'])*300)
    gold0=E(pg,"__game.S.gold");E(pg,"__game.S.forts[0].g=200");sim(pg,1.2);gold1=E(pg,"__game.S.gold")
    print('  dist after tp',E(pg,"Math.round(Math.hypot(__game.X.FORTS[0].x-__game.P.x,__game.X.FORTS[0].y-__game.P.y))"));print('FORT income/min',g60,'collect on approach +',gold1-gold0)
    pre=E(pg,"(()=>{const g=__game;const r={dead:g.P.dead,hp:Math.round(g.P.hp),act:g.X.fortAct&&g.X.fortAct.kind,sharks:g.sharks?g.sharks.length:-1,state:g.state};g.enemies.length=0;if(g.sharks)g.sharks.length=0;g.P.dead=0;g.P.hp=g.ST().maxHp;return r})()");print('  pre-manage',pre);sim(pg,0.1)
    E(pg,"__game.X.actTap()");pg.wait_for_timeout(300);st=E(pg,"__game.state");pg.screenshot(path=OUT+'05_fort_manage_portrait.png')
    pg.locator('#fBody button[data-act="fug"]').tap();pg.wait_for_timeout(200);ug=E(pg,"__game.S.forts[0].ug");pg.tap('#fClose');pg.wait_for_timeout(200)
    print('FORT manage state',st,'upgrade cannons ->',ug,'guns now',E(pg,"__game.X.fortRT(__game.X.FORTS[0]).guns.length"))
    # defend event
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.S.forts[0].nx=0;})()");sim(pg,1.5)
    atk=E(pg,"(()=>{const g=__game;return{atk:!!g.S.forts[0].atk,attackers:g.enemies.filter(e=>e.atkF===0).length,hostile:g.enemies.filter(e=>e.atkF===0).every(e=>g.X.clanHostile(e.clan)||e.atkF!=null)}})()")
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'06_fort_defend_portrait.png')
    E(pg,"(()=>{const g=__game;for(const e of g.enemies)if(e.atkF===0){e.hp=1;g.balls.push({x:e.x,y:e.y,vx:0,vy:0,life:0.2,dmg:50,owner:'p'});}})()");sim(pg,2.5)
    print('DEFEND event',atk,'-> after beating attackers: def',E(pg,"__game.S.cst.def"),'atk cleared',E(pg,"!__game.S.forts[0].atk"))
    # stronghold docking at war
    E(pg,"__game.S.rep[1]=-60");pi=E(pg,"__game.PORTS.findIndex(p=>p.clan===1)");E(pg,f"__game.tryDock({pi})");print('DOCK at war stronghold ->',E(pg,"__game.state"),E(pg,"document.getElementById('toast').textContent"))
    # leader boss
    E(pg,"__game.S.rep[1]=0");pp=E(pg,f"__game.PORTS[{pi}].port");E(pg,"__game.enemies.length=0");tp(pg,pp['x']+400,pp['y']+900);sim(pg,1.5)
    ld=E(pg,"(()=>{const e=__game.enemies.find(e=>e.lead);return e?{name:e.name,hp:e.maxHp,lvl:e.lvl,guns:e.cannons}:null})()")
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'07_leader_boss_portrait.png')
    E(pg,"(()=>{const g=__game;const e=g.enemies.find(e=>e.lead);e.hp=1;g.balls.push({x:e.x,y:e.y,vx:0,vy:0,life:0.2,dmg:50,owner:'p'});})()");sim(pg,0.5)
    print('LEADER',ld,'-> leaders down',E(pg,"__game.X.leadersDown()"),'rep',E(pg,"__game.S.rep"))
    # contracts
    E(pg,"__game.S.rep[1]=30");E(pg,f"__game.dock({pi})");cq=E(pg,f"(()=>{{const g=__game;const c={{}};for(let i=0;i<300;i++){{const q=g.genQuest({pi});c[q.type+(q.clan!=null?'(clan)':'')]=(c[q.type+(q.clan!=null?'(clan)':'')]||0)+1;}}return c}})()")
    print('JOB BOARD at stronghold (300 rolls):',cq)
    q=E(pg,f"(()=>{{const g=__game;let q=null;for(let i=0;i<200&&!q;i++){{const x=g.X.genClanQ({pi});if(x&&x.type==='clanhunt')q=x;}}g.S.quests=[q];return q}})()")
    E(pg,"__game.leavePort()");r0=E(pg,f"__game.S.rep[{q['clan']}]")
    E(pg,f"(()=>{{const g=__game;g.enemies.length=0;for(let i=0;i<{q['need']};i++){{const e=g.makeEnemy('clan',g.P.x+200,g.P.y+i*60,9,{{clan:{q['tc']},angry:true}});e.hp=1;g.enemies.push(e);g.balls.push({{x:e.x,y:e.y,vx:0,vy:0,life:0.1,dmg:20,owner:'p'}});}}}})()");sim(pg,0.3)
    print('CLAN CONTRACT',q['title'],'-> done',E(pg,"__game.S.quests.length===0"),'issuer rep',r0,'->',E(pg,f"__game.S.rep[{q['clan']}]"),'cj',E(pg,"__game.S.cst.cj"))
    # fast travel
    E(pg,"(()=>{const g=__game;g.S.vis=[0,1,5,13,14];g.S.gold=5000;})()");E(pg,"__game.dock(0)");pg.wait_for_timeout(200)
    nft=E(pg,"document.querySelectorAll('#pBody button[data-act=\"ft\"]').length");pg.screenshot(path=OUT+'08_fast_travel_portrait.png')
    g0=E(pg,"__game.S.gold");pg.locator('#pBody button[data-act="ft"]').last.tap();pg.wait_for_timeout(300)
    print('FAST TRAVEL options',nft,'-> now docked at',E(pg,"__game.PORTS[__game.S.lastPort].name"),'cost',g0-E(pg,"__game.S.gold"))
    # ammo / levels / cosmetics / officers
    E(pg,"__game.leavePort()")
    lu=E(pg,"(()=>{const g=__game;g.S.xp=0;g.S.clvl=1;g.S.sp=0;g.S.unl=1;const out=[];let last='';for(let l=2;l<=60;l++){let need=0;for(let k=1;k<l;k++)need+=g.X.xpNeed(k);g.grantXP(need-g.S.xp);const t=document.getElementById('toast').textContent;if(l===8||l===14||l===20||l===30||l===60)out.push(t);}return {lvl:g.S.clvl,sp:g.S.sp,ammo:JSON.stringify(g.S.ammo),msgs:out,totalXp:g.S.xp}})()")
    print('LEVELS: reached',lu['lvl'],'sp',lu['sp'],'total xp',lu['totalXp'],'gift ammo',lu['ammo']);[print('   ',m) for m in lu['msgs']]
    E(pg,"(()=>{const g=__game;g.enemies.length=0;if(g.sharks)g.sharks.length=0;for(let k=0;k<400;k++){const x=12000+Math.cos(k)*k*20,y=8000+Math.sin(k)*k*20;let ok=true;for(let dx=-200;dx<=800;dx+=50)for(let dy=-200;dy<=200;dy+=50)if(g.inAnyIsland(x+dx,y+dy,0))ok=false;if(ok){g.P.x=x;g.P.y=y;break;}}const e=g.makeEnemy('pirate',g.P.x+250,g.P.y,8);e.maxSpeed=0;g.enemies.push(e);g.P.h=-Math.PI/2;g.S.asel='chain';g.P.rr=0;g.fire(1);})()");sim(pg,1.0)
    ch=E(pg,"(()=>{const e=__game.enemies[0];return{slow:+(e.slowT||0).toFixed(2),ammo:__game.S.ammo.chain}})()")
    E(pg,"(()=>{const g=__game;g.enemies.length=0;const e=g.makeEnemy('pirate',g.P.x+250,g.P.y,8);g.enemies.push(e);e.keep=true;e.maxHp=e.hp=5000;window.__pin=[e.x,e.y];g.S.asel='fire';g.P.rr=0;g.fire(1);})()")
    def pinsim(sec):
        for _ in range(int(sec/0.1)): E(pg,"(()=>{const g=__game;g.enemies.splice(1);if(g.sharks)g.sharks.length=0;const e=g.enemies[0];e.x=__pin[0];e.y=__pin[1];e.vx=e.vy=0;e.speed=0;})()");sim(pg,0.1)
    pinsim(0.8);hpA=E(pg,"__game.enemies[0].hp");burn=E(pg,"[__game.enemies[0].burn,__game.enemies[0].burnD]");pinsim(3);hpB=E(pg,"__game.enemies[0].hp");print('  fire burn state',burn)
    E(pg,"(()=>{const g=__game;const e=g.enemies[0];e.hp=e.maxHp;e.x=g.P.x+560;e.y=g.P.y;window.__pin=[e.x,e.y];e.vx=e.vy=0;e.speed=0;g.S.asel='mortar';g.P.rr=0;g.fire(1);})()");sh=E(pg,"__game.X.shells.length");pg.wait_for_timeout(150);pinsim(0.5);pg.screenshot(path=OUT+'09_mortar_portrait.png');hpM0=E(pg,"__game.enemies[0].hp");pinsim(1.6);hpM1=E(pg,"__game.enemies[0].hp")
    print('AMMO chain',ch,'| fire burn hp',round(hpA),'->',round(hpB),'| mortar shells',sh,'enemy hp',round(hpM0),'->',round(hpM1))
    pg.wait_for_timeout(200);E(pg,"__game.S.asel='chain'");pg.wait_for_timeout(200);ab=E(pg,"(()=>{const r=document.getElementById('ammoBtn').getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),getComputedStyle(document.getElementById('ammoBtn')).display]})()")
    pg.tap('#ammoBtn');pg.wait_for_timeout(150);print('AMMO button rect',ab,'tap cycles to',E(pg,"__game.S.asel"))
    for c in ["sail:gold","flag:kraken","hull:navy","fx:ember"]: E(pg,f"__game.X.equipCos('{c}')")
    E(pg,"(()=>{const g=__game;g.S.gold=50000;})()");E(pg,"__game.dock(0)");E(pg,"__game.setTab('crew')");pg.wait_for_timeout(150)
    nb=E(pg,"document.querySelectorAll('#pBody button[data-act=\"off\"]:not([disabled])').length")
    for k in ['fm','sg','qm','mg','bo']: pg.locator(f'#pBody button[data-act="off"][data-arg="{k}"]').tap();pg.wait_for_timeout(80)
    pg.screenshot(path=OUT+'10_officers_portrait.png')
    E(pg,"__game.setTab('ship')");pg.wait_for_timeout(100);pg.locator('#pBody button[data-act="ammo"][data-arg="fire:5"]').tap();E(pg,"__game.leavePort()")
    E(pg,"__game.openMenu()");pg.wait_for_timeout(500);pg.tap('#mTabs button[data-m="style"]');pg.wait_for_timeout(200);pg.screenshot(path=OUT+'11_wardrobe_portrait.png')
    pg.tap('#mTabs button[data-m="skills"]');pg.wait_for_timeout(200);E(pg,"document.getElementById('mBody').scrollTop=99999");pg.wait_for_timeout(100);pg.screenshot(path=OUT+'12_skills_warlord_portrait.png')
    pg.tap('#mTabs button[data-m="rep"]');pg.wait_for_timeout(200);pg.screenshot(path=OUT+'13_republic_tab_portrait.png');pg.tap('#mClose');pg.wait_for_timeout(150)
    sim(pg,0.2);pg.wait_for_timeout(200);pg.screenshot(path=OUT+'14_cosmetics_ship_portrait.png')
    # king
    E(pg,"(()=>{const g=__game,X=g.X;for(const f of X.FORTS.slice(0,8))g.S.forts[f.id]={o:'p',g:0,ug:0,uw:0,nx:1e9};g.S.leaders={0:1,1:1,2:1,3:1};X.checkKing();})()")
    print('PIRATE KING',E(pg,"__game.S.king"),'reps',E(pg,"__game.S.rep"))
    # export / import carries new state
    code=E(pg,"__game.makeCode()")
    ctx2,pg2=fresh(b,390,844,None,tag='import');ds=E(pg2,f"JSON.stringify(__game.parseCode({json.dumps(code)}).s)");pg2=inject(ctx2,pg2,ds,URL,'import',raw=True)
    im=E(pg2,"(()=>{const S=__game.S;return{king:S.king,forts:Object.keys(S.forts).length,leaders:Object.keys(S.leaders).length,cos:S.cos,ammo:S.ammo,off:Object.keys(S.off),clvl:S.clvl,rep:S.rep,vis:S.vis.length,wv:S.wv,explored:+__game.X.explored().toFixed(4),cst:S.cst}})()")
    print('PSEAS1 round-trip:',im);ctx2.close()
    print('TROPHIES now',E(pg,"(()=>{__game.progTick();return __game.ACH.filter(a=>__game.S.ach[a[0]]).length+'/'+__game.ACH.length})()"))
    # big map: open, drag, pinch, buttons, close
    E(pg,"__game.setState('map')");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'15_bigmap_full_portrait.png')
    cdp=ctx.new_cdp_session(pg);send=lambda t,pts: cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':pts})
    send('touchStart',[{'x':150,'y':420,'id':1},{'x':240,'y':420,'id':2}])
    for k in range(1,11): send('touchMove',[{'x':150-k*8,'y':420,'id':1},{'x':240+k*8,'y':420,'id':2}]);pg.wait_for_timeout(16)
    send('touchEnd',[]);pg.wait_for_timeout(150);z=E(pg,"__game.X.MV.z")
    send('touchStart',[{'x':200,'y':400,'id':3}])
    for k in range(1,11): send('touchMove',[{'x':200+k*10,'y':400+k*6,'id':3}]);pg.wait_for_timeout(16)
    send('touchEnd',[]);pg.wait_for_timeout(150);mv=E(pg,"[Math.round(__game.X.MV.cx),Math.round(__game.X.MV.cy),__game.state]")
    pg.screenshot(path=OUT+'16_bigmap_zoomed_portrait.png')
    pg.tap('canvas',position={'x':195,'y':300});pg.wait_for_timeout(150)
    print('BIG MAP pinch zoom ->',round(z,2),'drag pan -> centre',mv[:2],'state',mv[2],'| tap ->',E(pg,"__game.state"))
    # perf portrait: outer waters battle
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.P.hp=g.ST().maxHp;g.S.forts={};})()");tp(pg,f0['x']+math.cos(f0['a'])*600,f0['y']+math.sin(f0['a'])*600);E(pg,"(()=>{__game.X.spawnSkirmish(true);__game.X.FRT[0]&&(__game.X.FRT[0].angry=true);})()")
    sim(pg,1);E(pg,"__game.P.throttle=0.6")
    print('FPS portrait (outer waters: fort + skirmish) [avg, worst, top5]:',fps(pg,5000),'entities',E(pg,"[__game.enemies.length,__game.sharks.length,__game.balls.length,__game.X.islCached.length]"))
    pg.screenshot(path=OUT+'17_outer_battle_portrait.png');ctx.close()
    # ---------- 3. landscape ----------
    ctx,pg=fresh(b,844,390,dict(SAVE0,clvl=25,xp=40000),tag='landscape');start(pg)
    tp(pg,f0['x']+math.cos(f0['a'])*650,f0['y']+math.sin(f0['a'])*650);E(pg,"(()=>{__game.X.spawnSkirmish(true);})()");sim(pg,1.5);pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'18_outer_landscape.png')
    ov=E(pg,"""(()=>{const ids=['ammoBtn','fireL','fireR','autoBtn','boostBtn','menuBtn'];const R=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width>0);const o=[];for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i][1],b=R[j][1];if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)o.push(R[i][0]+'/'+R[j][0]);}return o})()""")
    print('landscape button overlaps:',ov)
    E(pg,"__game.setState('map')");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'19_bigmap_landscape.png');pg.tap('canvas',position={'x':422,'y':200});pg.wait_for_timeout(100)
    E(pg,"__game.P.throttle=0.7")
    print('FPS landscape (outer waters skirmish) [avg, worst, top5]:',fps(pg,5000))
    # long sail across the world: island cache + spawning
    E(pg,"(()=>{const g=__game;g.P.x=1500;g.P.y=12000;g.P.h=0;})()")
    stats=E(pg,"(()=>{const g=__game;let maxE=0,maxC=0;for(let i=0;i<60*200;i++){g.P.throttle=1;g.P.h=0;g.step(1/60);if(g.P.dead){g.P.dead=0;g.P.hp=g.ST().maxHp;}if(i%60===0){maxE=Math.max(maxE,g.enemies.length);}}return{x:Math.round(g.P.x),maxEnemies:maxE,cached:g.X.islCached.length}})()")
    print('LONG SAIL 200s eastward:',stats)
    E(pg,"__game.setState('play')");print('FPS landscape after long sail:',fps(pg,3000))
    ctx.close()
    b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs[:15]]
