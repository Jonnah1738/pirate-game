import json
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html';OUT='/workspace/pirate-game/screenshots-b5/'
errs=[]
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(f'[{tag}] pageerror: {e}'))
E=lambda pg,js: pg.evaluate(js)
def sim(pg,secs): pg.evaluate(f"(()=>{{for(let i=0;i<{int(secs*20)};i++)__game.step(0.05)}})()")
def fps(pg,ms=4000):
    return E(pg,f"""new Promise(r=>{{let n=0,t0=performance.now(),worst=0,last=t0;function f(t){{n++;worst=Math.max(worst,t-last);last=t;if(t-t0<{ms})requestAnimationFrame(f);else r([Math.round(n/((t-t0)/1000)),Math.round(worst)]);}}requestAnimationFrame(f);}})""")
def accept(pg,typ,pi=0,extra=''):
    # generate a specific job at port pi, put it on the board and accept it through the UI
    E(pg,f"(()=>{{const g=__game;g.dock({pi});let q=null;for(let i=0;i<40&&!q;i++){{q=g.genQ('{typ}',{pi});{extra}}}g.S.offers[{pi}]=[q];g.setTab('quests');}})()")
    pg.wait_for_timeout(80);pg.locator('#pBody button[data-act="accept"]').first.tap();pg.wait_for_timeout(60)
    q=E(pg,"__game.S.quests[__game.S.quests.length-1]");pg.tap('#pLeave');pg.wait_for_timeout(60);return q
def tp(pg,x,y): E(pg,f"(()=>{{const g=__game;g.P.x={x};g.P.y={y};g.P.vx=g.P.vy=g.P.speed=0;g.P.throttle=0;}})()")
def calm(pg): E(pg,"(()=>{const g=__game;g.enemies.length=0;g.sharks.length=0;g.balls.length=0;g.P.hp=g.ST().maxHp;g.S.heat=0;})()")
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page();hook(pg,'portrait')
    pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(200)
    print('tutorial on new game:',E(pg,'__game.T.on'),'step',E(pg,'__game.TSTEPS[__game.T.i].id'))
    pg.tap('#tutSkip');pg.tap('#tutSkip');pg.wait_for_timeout(100)
    print('new captain: lvl',E(pg,'__game.S.clvl'),'xp',E(pg,'__game.S.xp'),'sp',E(pg,'__game.S.sp'),'ship',E(pg,'__game.S.ship'),'HUD',pg.inner_text('#hLvl'))
    # board variety at rank 0 vs high rank
    E(pg,"__game.dock(0)");E(pg,"__game.setTab('quests')");pg.wait_for_timeout(100)
    print('Port Royal board (Deckhand):',E(pg,"__game.offersFor(0).map(q=>q.type)"))
    pg.screenshot(path=OUT+'01-job-board-deckhand.png')
    E(pg,"(()=>{const g=__game;const c={};for(let i=0;i<300;i++){const q=g.genQuest(0);c[q.type]=(c[q.type]||0)+1;}window.__mix0=c;})()");print('  mix at Deckhand (300 rolls):',E(pg,'window.__mix0'))
    E(pg,"(()=>{const g=__game;g.S.infamy=1600;const c={};for(let i=0;i<400;i++){const q=g.genQuest(1);c[q.type+(q.mega?'(mega)':'')]=(c[q.type+(q.mega?'(mega)':'')]||0)+1;}window.__mix1=c;g.S.infamy=0;})()");print('  mix at Sea Wolf (400 rolls):',E(pg,'window.__mix1'))
    for typ in ['smuggle','treasure','rescue','convoy','shark','race','blockade']:
        print(f'  sample {typ}:',E(pg,f"(()=>{{let q=null;for(let i=0;i<30&&!q;i++)q=__game.genQ('{typ}',0);return q?q.title+' | reward '+q.reward+(q.cost?' | map '+q.cost:''):null}})()"))
    print('  reward scaling (rescue/treasure/convoy, Port Royal vs El Dorado):',E(pg,"(()=>{const g=__game,a=[];for(const t of ['rescue','treasure','convoy']){let s0=0,s8=0,n=0;for(let i=0;i<40;i++){const q0=g.genQ(t,0),q8=g.genQ(t,8);if(q0&&q8){s0+=q0.reward;s8+=q8.reward;n++;}}a.push(t+': '+Math.round(s0/n)+' vs '+Math.round(s8/n));}return a})()"))
    pg.tap('#pLeave')
    # ---------- XP / levels / skills ----------
    E(pg,"__game.S.infamy=0");calm(pg)
    E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x,g.P.y+100,1);g.enemies.push(e);for(let i=0;i<10&&!e.sinking;i++){e.hp=0.1;}})()")
    xp0=E(pg,'__game.S.xp');E(pg,"(()=>{const g=__game;const e=g.enemies[0];e.hp=1;g.balls.push({x:e.x,y:e.y,vx:0,vy:0,life:1,dmg:5,owner:'p'});})()");sim(pg,0.1)
    print('XP for sinking a Lv1 pirate:',E(pg,'__game.S.xp')-xp0)
    d0=E(pg,'__game.ST().dmg');E(pg,"__game.grantXP(400)");print('after +400 XP: lvl',E(pg,'__game.S.clvl'),'sp',E(pg,'__game.S.sp'),'menu badge',E(pg,"(__game.progTick(),document.getElementById('menuBtn').classList.contains('sp'))"))
    E(pg,"__game.openMenu();__game.setMView('skills')");pg.wait_for_timeout(100)
    pg.locator('#mBody button[data-act="learn"][data-arg="gun"]').first.tap();pg.locator('#mBody button[data-act="learn"][data-arg="gun"]').first.tap();pg.wait_for_timeout(60)
    print('Gunnery perks',E(pg,'__game.S.sk.gun'),'dmg',round(d0,2),'->',round(E(pg,'__game.ST().dmg'),2),'reload',round(E(pg,'__game.ST().reload'),2),'sp left',E(pg,'__game.S.sp'))
    pg.screenshot(path=OUT+'02-skills-tab.png')
    E(pg,"__game.setMView('trophies')");pg.wait_for_timeout(80);print('trophies unlocked:',E(pg,"Object.keys(__game.S.ach)"))
    pg.screenshot(path=OUT+'03-trophies-ranks.png');pg.tap('#mClose')
    # ---------- hulls ----------
    E(pg,"__game.S.gold=20000;__game.dock(0);__game.setTab('ship')");pg.wait_for_timeout(80)
    print('hull buttons @Deckhand:',pg.locator('#pBody button[data-act="hull"]').all_inner_texts())
    hp0=E(pg,'__game.ST().maxHp');c0=E(pg,'__game.ST().cannons');sp0=round(E(pg,'__game.ST().maxSpeed'))
    E(pg,"__game.S.infamy=320;__game.setTab('ship')");pg.locator('#pBody button[data-act="hull"][data-arg="brig"]').tap();pg.wait_for_timeout(60)
    print(f'bought brig: ship {E(pg,"__game.S.ship")} hp {hp0}->{E(pg,"__game.ST().maxHp")} guns {c0}->{E(pg,"__game.ST().cannons")} speed {sp0}->{round(E(pg,"__game.ST().maxSpeed"))} cargo {E(pg,"__game.ST().cargoCap")} gold {E(pg,"__game.S.gold")}')
    print('frigate locked?',pg.locator('#pBody button[data-act="hull"][data-arg="frigate"]').inner_text())
    pg.locator('#pBody button[data-act="hull"]').first.scroll_into_view_if_needed();pg.screenshot(path=OUT+'04-shipwright-hulls.png')
    E(pg,"__game.S.infamy=3100;__game.S.mat.iw=6;__game.S.mat.bp=2;__game.S.gold=Math.max(__game.S.gold,20000);__game.setTab('ship')");pg.locator('#pBody button[data-act="hull"][data-arg="galleon"]').tap()
    print('galleon:',E(pg,"[__game.S.ship,__game.ST().maxHp,__game.ST().cannons,Math.round(__game.ST().maxSpeed),Math.round(__game.ST().turn*100)/100,__game.ST().len]"))
    E(pg,"__game.S.ship='sloop';__game.S.infamy=0;__game.recalc();__game.S.gold=3000");pg.tap('#pLeave')
    # lawful port can't sell
    E(pg,"__game.S.infamy=320;__game.dock(2);__game.setTab('ship')");print('hull at lawful Nassau enabled?',E(pg,"[...document.querySelectorAll('#pBody button[data-act=hull]')].map(b=>!b.disabled)"));pg.tap('#pLeave');E(pg,"__game.S.infamy=0")
    # ---------- missions ----------
    # treasure
    calm(pg);g0=E(pg,'__game.S.gold');q=accept(pg,'treasure',0,"if(q&&q.lvl<3)q=null;");print('treasure accepted: cost',q['cost'],'gold',g0,'->',E(pg,'__game.S.gold'),'lvl',q['lvl'])
    tp(pg,q['x']-600,q['y']);sim(pg,1.2);print('  guards spawned:',E(pg,"__game.enemies.filter(e=>e.mq).length"))
    E(pg,"__game.enemies.length=0");tp(pg,q['x']+40,q['y']);sim(pg,0.2);pg.wait_for_timeout(250)
    print('  dig button:',pg.is_visible('#actBtn'),pg.inner_text('#actBtn'))
    pg.screenshot(path=OUT+'05-treasure-dig.png')
    gem0=E(pg,'__game.S.cargo.gems');g1=E(pg,'__game.S.gold');pg.tap('#actBtn',force=True);sim(pg,1);pg.wait_for_timeout(150);print('  while digging:',pg.inner_text('#actBtn'));sim(pg,1.5)
    print('  dug: quest gone',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'gold +',E(pg,'__game.S.gold')-g1,'gems +',E(pg,'__game.S.cargo.gems')-gem0,'st.dig',E(pg,'__game.S.st.dig'))
    # smuggle with customs search
    calm(pg);q=accept(pg,'smuggle',0);print('smuggle:',q['title'],'cargo used',E(pg,'(()=>{let n=0;for(const q of __game.S.quests)if(q.crates)n+=q.crates;return n})()'))
    E(pg,"__game.addHeat(5.5)");print('  stars',E(pg,'__game.stars()'))
    E(pg,f"(()=>{{const r=Math.random;Math.random=()=>0.01;__game.dockQuests({q['to']});Math.random=r;}})()");print('  searched at stars>=1: job gone',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'heat',round(E(pg,'__game.S.heat'),1))
    E(pg,"__game.S.heat=0");q=accept(pg,'smuggle',0);g1=E(pg,'__game.S.gold');E(pg,f"__game.dock({q['to']})");print('  delivered clean: +',E(pg,'__game.S.gold')-g1,'smug stat',E(pg,'__game.S.st.smug'));pg.tap('#pLeave')
    # rescue
    calm(pg);q=accept(pg,'rescue',0);tp(pg,q['x']-500,q['y']);sim(pg,1.2);print('rescue: castaways',E(pg,'__game.cways.length'),'need',q['need'])
    tp(pg,q['x']-220,q['y']+60);sim(pg,0.1);pg.wait_for_timeout(250);pg.screenshot(path=OUT+'06-rescue-castaways.png')
    for i in range(q['need']):
        E(pg,"(()=>{const c=__game.cways[0];if(c){__game.P.x=c.x;__game.P.y=c.y;}})()");sim(pg,0.1)
    print('  stage',E(pg,f"__game.S.quests.find(x=>x.id==={q['id']}).stage"),'tracker:',pg.inner_text('#mTrack').replace('\n',' | '))
    cr0=E(pg,'__game.S.crew');g1=E(pg,'__game.S.gold');E(pg,"__game.dock(0)");print('  returned: +',E(pg,'__game.S.gold')-g1,'gold, crew',cr0,'->',E(pg,'__game.S.crew'));pg.tap('#pLeave')
    # convoy
    calm(pg);E(pg,"__game.S.infamy=400");q=accept(pg,'convoy',0);tp(pg,q['x']-700,q['y']);sim(pg,1.2)
    print('convoy: merchants',E(pg,"__game.enemies.filter(e=>e.cid).length"),'escorts',E(pg,"__game.enemies.filter(e=>e.guard).length"),'escort angry before attack',E(pg,"__game.enemies.filter(e=>e.guard).some(e=>e.angry)"))
    E(pg,"(()=>{const g=__game;const m=g.enemies.find(e=>e.cid);g.P.x=m.x-250;g.P.y=m.y;g.balls.push({x:m.x,y:m.y,vx:0,vy:0,life:1,dmg:3,owner:'p'});})()");sim(pg,0.6)
    print('  escorts angry after attack:',E(pg,"__game.enemies.filter(e=>e.guard).every(e=>e.gAng&&e.angry)"))
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'07-convoy-raid.png')
    for i in range(2):
        E(pg,"(()=>{const g=__game;const m=g.enemies.find(e=>e.cid&&!e.cdone&&!e.sinking);if(m){m.hp=1;g.balls.push({x:m.x,y:m.y,vx:0,vy:0,life:1,dmg:5,owner:'p'});}})()");sim(pg,0.1)
    print('  convoy done:',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'stat',E(pg,'__game.S.st.convoy'))
    # shark hunt + megalodon
    calm(pg);q=accept(pg,'shark',0,"if(q&&q.mega)q=null;");z=E(pg,"__game.qTarget(__game.S.quests[__game.S.quests.length-1])")
    E(pg,"(()=>{const g=__game;for(let i=0;i<8;i++){const s=g.makeShark(g.P.x+50*i,g.P.y+200,5);g.sharks.push(s);g.balls.push({x:s.x,y:s.y,vx:0,vy:0,life:1,dmg:999,owner:'p'});}})()");sim(pg,0.1)
    print('shark hunt need',q['need'],'-> done',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'arrow target zone icon',z['icon'])
    calm(pg);E(pg,"__game.S.infamy=1600");q=accept(pg,'shark',0,"if(q&&!q.mega)q=null;");zz=E(pg,f"__game.SHARKZ[{q['zi']}]");tp(pg,zz['x']+200,zz['y']);sim(pg,1.2)
    print('megalodon hunt:',q['title'],'mega spawned',E(pg,"__game.sharks.some(s=>s.mega&&s.mq)"))
    E(pg,"(()=>{const g=__game;const m=g.sharks.find(s=>s.mega);g.balls.push({x:m.x,y:m.y,vx:0,vy:0,life:1,dmg:9999,owner:'p'});})()");sim(pg,0.1);print('  slain -> done',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'megas',E(pg,'__game.S.megas'))
    E(pg,"__game.S.infamy=0")
    # race
    calm(pg);q=accept(pg,'race',0);print('race:',q['title'],'buoys',len(q['pts']))
    sim(pg,0.5);tp(pg,q['pts'][0]['x']-250,q['pts'][0]['y']);sim(pg,0.05);pg.wait_for_timeout(250);pg.screenshot(path=OUT+'08-regatta.png')
    for pt in q['pts']:
        tp(pg,pt['x'],pt['y']);sim(pg,0.1)
    print('  regatta won:',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"),'stat',E(pg,'__game.S.st.race'))
    q=accept(pg,'race',0);sim(pg,q['tl']+1);print('  timeout fails:',not E(pg,f"__game.S.quests.some(x=>x.id==={q['id']})"))
    # blockade
    calm(pg);E(pg,"__game.S.infamy=400");q=accept(pg,'blockade',0);dest=E(pg,f"__game.PORTS[{q['to']}].port");print('blockade:',q['title'])
    tp(pg,dest['x']+1500,dest['y']);sim(pg,1.2);print('  blockaders',E(pg,"__game.enemies.filter(e=>e.mq&&e.kind==='navy').length"),'hostile at 0 stars',E(pg,"__game.enemies.filter(e=>e.mq).every(e=>e.angry)"),'stars',E(pg,'__game.stars()'))
    E(pg,"(()=>{const g=__game;const e=g.enemies.find(e=>e.mq);g.P.x=e.x+300;g.P.y=e.y;})()");sim(pg,3);print('  navy balls fired at us:',E(pg,"__game.balls.filter(b=>b.owner==='e').length")>0 or E(pg,'__game.P.hp<__game.ST().maxHp'))
    g1=E(pg,'__game.S.gold');E(pg,f"__game.dock({q['to']})");print('  docked in time: +',E(pg,'__game.S.gold')-g1,'stat',E(pg,'__game.S.st.block'));pg.tap('#pLeave');E(pg,"__game.S.infamy=0")
    # hunt (bounty contract) with escort
    calm(pg);q=accept(pg,'hunt',8,"if(q&&q.lvl<4)q=null;");tp(pg,q['x']-1000,q['y']);sim(pg,1.2);print('bounty contract:',q['title'],'enemies at spot',E(pg,"__game.enemies.filter(e=>e.home&&Math.hypot(e.home.x-%d,e.home.y-%d)<5).map(e=>e.kind)"%(q['x'],q['y'])))
    E(pg,f"__game.S.quests=__game.S.quests.filter(x=>x.id!=={q['id']})")
    # tracker with several jobs (portrait HUD)
    calm(pg);E(pg,"__game.S.quests.length=0");accept(pg,'treasure',0);accept(pg,'smuggle',0);accept(pg,'race',0);tp(pg,4300,4300);E(pg,"__game.P.h=-1");sim(pg,0.3);pg.wait_for_timeout(300)
    t1=pg.inner_text('#mTrack');pg.tap('#mTrack');pg.wait_for_timeout(250);t2=pg.inner_text('#mTrack');print('tracker:',t1.replace('\n',' | '),' --tap--> ',t2.replace('\n',' | '))
    pg.screenshot(path=OUT+'09-portrait-tracker-hud.png')
    # fleet shoots hunting sharks
    calm(pg);E(pg,"(()=>{const g=__game;g.S.quests.length=0;g.S.fleet.push({id:77,name:'Sea Wolf',type:'brig',lvl:1,maxHp:170,hp:170,cannons:3,dmg:8.5,wage:12,unpaid:0});g.syncFleet();const z=g.SHARKZ[1];g.P.x=z.x;g.P.y=z.y;g.P.hp=g.ST().maxHp*0.3;for(const f of g.fleet){f.x=g.P.x-120;f.y=g.P.y-60;}const s=g.makeShark(g.P.x+150,g.P.y+150,5);g.sharks.push(s);window.__sk=s;})()")
    sim(pg,0.5);tg=E(pg,"__game.fleet.map(f=>f.tgt&&f.tgt.kind)");sh0=E(pg,'window.__sk.hp')
    fb=0
    for i in range(16):
        sim(pg,0.5);fb=max(fb,E(pg,"__game.balls.filter(b=>b.owner==='f').length"))
    print('fleet vs hunting shark: target',tg,'fleet balls',fb,'shark hp',round(sh0),'->',round(E(pg,'window.__sk.hp')))
    perf=None
    E(pg,"(()=>{const g=__game;calmAll();function calmAll(){g.enemies.length=0;g.sharks.length=0;}g.P.hp=g.ST().maxHp;for(let i=0;i<10;i++)g.sharks.push(g.makeShark(g.P.x+Math.cos(i)*260,g.P.y+Math.sin(i)*260,6));for(let i=0;i<4;i++)g.enemies.push(g.makeEnemy('pirate',g.P.x+500+i*80,g.P.y-300,4));g.P.throttle=0.6;})()")
    accept(pg,'rescue',0);E(pg,"(()=>{const g=__game,q=g.S.quests[g.S.quests.length-1];g.P.x=q.x-200;g.P.y=q.y;})()");sim(pg,1.1)
    print('FPS portrait (missions+fleet+sharks) [avg, worst ms]:',fps(pg))
    code=E(pg,'__game.makeCode()');print('export code carries:',E(pg,f"(()=>{{const s=__game.parseCode({json.dumps(code)}).s;return {{xp:s.xp,clvl:s.clvl,sp:s.sp,sk:s.sk,ship:s.ship,ach:Object.keys(s.ach).length,st:s.st,quests:s.quests.map(q=>q.type)}}}})()"))
    pg.reload();pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(200);print('after reload: lvl',E(pg,'__game.S.clvl'),'sk',E(pg,'__game.S.sk'),'quests',E(pg,'__game.S.quests.map(q=>q.type)'))
    ctx.close()
    # ---------- landscape: old (batch 4) save ----------
    old={"gold":2400,"up":{"hull":2,"sails":2,"cannons":2,"cargo":1,"rigging":1,"command":1},"crew":16,"roles":{"gunner":1,"sailor":0,"carpenter":1,"navigator":1},
         "cargo":{"rum":2,"sugar":0,"spice":0,"silk":0,"gems":0,"teeth":3},"quests":[{"id":2,"from":0,"type":"deliver","to":2,"crates":3,"reward":120,"title":"Deliver 3 crates to Nassau","text":"x"}],"offers":{"0":[{"id":3,"from":0,"type":"bounty","target":"pirate","need":2,"have":0,"reward":150,"title":"Rivalry: sink 2 rival pirate ships","text":"x"}]},"qid":5,"x":4100,"y":3900,"h":1.0,"hp":200,"kills":40,"infamy":1800,
         "lastPort":0,"playTime":5000,"fog":"","earned":7000,"muted":False,"seen":True,"autoFire":True,"bal":2,"raids":12,"sharks":6,"heat":0,"tips":{"merchant":1,"board":1,"wanted":1,"shark":1},"tutDone":True,"fleet":[{"id":2,"name":"Sea Wolf","type":"sloop","lvl":1,"maxHp":90,"hp":90,"cannons":2,"dmg":6,"wage":6,"unpaid":0}],"fid":2}
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,is_mobile=True,has_touch=True)
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('pirateSeas_save_v1',{json.dumps(json.dumps(old))});sessionStorage.setItem('seeded','1');}}")
    pg=ctx.new_page();hook(pg,'landscape');pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(1300)
    print('OLD SAVE retro:',E(pg,"({xp:__game.S.xp,clvl:__game.S.clvl,sp:__game.S.sp,ship:__game.S.ship,ach:Object.keys(__game.S.ach),quests:__game.S.quests.map(q=>q.type),fleet:__game.S.fleet.length,tut:__game.T.on})"),'toast:',pg.inner_text('#toast'))
    pg.screenshot(path=OUT+'10-landscape-oldsave-retro-xp.png')
    E(pg,"__game.dock(0);__game.setTab('quests')");pg.wait_for_timeout(100);print('old save board:',E(pg,"__game.offersFor(0).map(q=>q.type)"),'max jobs label',pg.locator('#pBody h3').first.inner_text())
    pg.screenshot(path=OUT+'11-landscape-job-board.png');pg.tap('#pLeave')
    # label overlap: surrendered merchant under the buttons (landscape)
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.sharks.length=0;g.P.x=5600;g.P.y=4700;g.P.h=0;const e=g.makeEnemy('merchant',5600+330,4700+150,2);e.surr=true;e.surrT=0;e.h=0;g.enemies.push(e);window.__m=e;g.syncFleet();for(const f of g.fleet){f.x=g.P.x+300;f.y=g.P.y+120;}})()");sim(pg,0.3);pg.wait_for_timeout(700)
    print('label Y avoided:',E(pg,"(()=>{const r=document.getElementById('fireL').getBoundingClientRect();return {fireTop:Math.round(r.top)}})()"))
    pg.screenshot(path=OUT+'12-landscape-label-avoid.png')
    E(pg,"(()=>{const g=__game;g.enemies.length=0;g.S.quests.length=0;})()");accept(pg,'race',0);accept(pg,'rescue',0);sim(pg,0.3);pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'13-landscape-tracker.png')
    ov=E(pg,"""(()=>{const ids=['boostBtn','autoBtn','fireL','fireR','menuBtn','dockBtn','actBtn','boardBar','tipBox','hud'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width);const o=[];for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){const A=r[a][1],B=r[b][1];if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)o.push(r[a][0]+'/'+r[b][0]);}return o})()""")
    print('overlaps landscape:',ov,'hud bottom',E(pg,"Math.round(document.getElementById('hud').getBoundingClientRect().bottom)"))
    print('FPS landscape [avg, worst ms]:',fps(pg,3000))
    E(pg,"__game.openMenu()");pg.wait_for_timeout(100);pg.screenshot(path=OUT+'14-landscape-captains-log.png')
    E(pg,"__game.setState('map')");E(pg,"document.getElementById('menu').classList.add('hidden')");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'15-landscape-map-jobs.png')
    ctx.close();b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs]
