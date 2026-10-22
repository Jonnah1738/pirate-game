import json
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html';OUT='/workspace/pirate-game/screenshots-b4/'
errs=[]
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(f'[{tag}] pageerror: {e}'))
E=lambda pg,js: pg.evaluate(js)
def sim(pg,secs): pg.evaluate(f"(()=>{{for(let i=0;i<{int(secs*20)};i++)__game.step(0.05)}})()")
def fps(pg,ms=4000):
    return E(pg,f"""new Promise(r=>{{let n=0,t0=performance.now(),worst=0,last=t0;function f(t){{n++;worst=Math.max(worst,t-last);last=t;if(t-t0<{ms})requestAnimationFrame(f);else r([Math.round(n/((t-t0)/1000)),Math.round(worst)]);}}requestAnimationFrame(f);}})""")
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page();hook(pg,'portrait');pg.on('dialog',lambda d: d.accept('Dread Revenge'))
    pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#startBtn');pg.tap('#tutSkip');pg.tap('#tutSkip');pg.wait_for_timeout(200)
    print('shark zones:',E(pg,"__game.SHARKZ.map(z=>[Math.round(z.x),Math.round(z.y),Math.round(z.r)])"))
    sim(pg,3);print('sharks near Port Royal (lvl1):',E(pg,"__game.sharks.length"))
    # ---- fleet: hire at haven ----
    E(pg,"__game.S.gold=3000");E(pg,"__game.dock(0)");E(pg,"__game.setTab('fleet')");pg.wait_for_timeout(200)
    pg.locator('#pBody button[data-act="fhire"][data-arg="sloop"]').tap();pg.wait_for_timeout(100)
    print('after hiring sloop: fleet',E(pg,"__game.S.fleet.map(d=>d.name+':'+d.type)"),'brig button:',pg.locator('#pBody button[data-arg="brig"]').inner_text())
    E(pg,"__game.setTab('ship')");pg.locator('#pBody button[data-arg="command"]').tap();print('command lvl',E(pg,'__game.S.up.command'),'gold',E(pg,'__game.S.gold'))
    E(pg,"__game.setTab('fleet')");pg.locator('#pBody button[data-act="fhire"][data-arg="brig"]').tap()
    pg.locator('#pBody button[data-act="fren"]').first.tap();pg.wait_for_timeout(100)
    pg.screenshot(path=OUT+'01-port-fleet-tab.png')
    print('fleet:',E(pg,"__game.S.fleet.map(d=>[d.name,d.type,d.maxHp,d.cannons,d.dmg,d.wage])"))
    pg.tap('#pLeave');pg.wait_for_timeout(200)
    E(pg,"(()=>{const g=__game;g.P.throttle=0.8;})()");sim(pg,6);pg.wait_for_timeout(300)
    print('formation distances:',E(pg,"__game.fleet.map(f=>Math.round(Math.hypot(f.x-__game.P.x,f.y-__game.P.y)))"))
    pg.screenshot(path=OUT+'02-fleet-formation.png')
    # ---- fleet fights a rival pirate ----
    E(pg,"(()=>{const g=__game;g.P.x=5200;g.P.y=4600;g.P.throttle=0;g.P.vx=g.P.vy=g.P.speed=0;g.syncFleet();for(const f of g.fleet){f.x=g.P.x-90;f.y=g.P.y+(f===g.fleet[0]?-80:80);} g.enemies.length=0;const e=g.makeEnemy('pirate',5450,4600,3);g.enemies.push(e);})()")
    fb=0
    for i in range(30):
        sim(pg,0.5);fb=max(fb,E(pg,"__game.balls.filter(b=>b.owner==='f').length"))
        if E(pg,"!__game.enemies.some(e=>e.kind==='pirate'&&!e.sinking)"):break
    print('fleet cannonballs seen:',fb,'| rival sunk:',E(pg,"!__game.enemies.some(e=>e.kind==='pirate'&&!e.sinking)"),'| fleet hp',E(pg,"__game.S.fleet.map(d=>Math.round(d.hp)+'/'+d.maxHp)"))
    # ---- sharks in deep water ----
    z=E(pg,"__game.SHARKZ[0]")
    E(pg,f"(()=>{{const g=__game;g.P.x={z['x']};g.P.y={z['y']};g.enemies.length=0;g.syncFleet();for(const f of g.fleet){{f.x=g.P.x-100;f.y=g.P.y;}}}})()");sim(pg,12)
    print('in shark zone lvl',E(pg,"__game.lvlAt(__game.P.x,__game.P.y)"),'sharks',E(pg,"__game.sharks.length"),'shark tip',E(pg,"__game.S.tips.shark"))
    E(pg,"(()=>{const g=__game;g.P.hp=g.ST().maxHp*0.3;for(const s of g.sharks.slice(0,3)){s.x=g.P.x+rand(150);s.y=g.P.y+120;}function rand(a){return Math.random()*a;}})()")
    hp0=E(pg,'__game.P.hp');crew0=E(pg,'__game.S.crew');sim(pg,8)
    print(f'low hull: hp {round(hp0)} -> {round(E(pg,"__game.P.hp"))}, crew {crew0} -> {E(pg,"__game.S.crew")}, chasing',E(pg,"__game.sharks.filter(s=>s.chase).length"))
    pg.wait_for_timeout(300);pg.screenshot(path=OUT+'03-sharks-low-hull.png')
    # shoot a shark
    E(pg,"(()=>{const g=__game;g.P.hp=g.ST().maxHp;g.P.h=0;const s=g.makeShark(g.P.x,g.P.y+150,6);s.speed=0;g.sharks.length=0;g.sharks.push(s);})()")
    for k in range(6):
        E(pg,"(()=>{const g=__game,s=g.sharks[0];if(!s)return;s.x=g.P.x;s.y=g.P.y+150;s.cx=s.x;s.cy=s.y;s.speed=0;g.P.rr=0;g.fire(1);})()");sim(pg,0.6)
        if E(pg,"!__game.sharks.length||__game.sharks[0].sinking"):break
    sim(pg,1);lt=E(pg,"__game.loot.map(l=>JSON.stringify(l.goods))");print('shark killed, loot:',lt,'kills',E(pg,'__game.S.sharks'))
    E(pg,"(()=>{const g=__game,l=g.loot[g.loot.length-1];if(l){g.P.x=l.x;g.P.y=l.y;}})()");sim(pg,0.3);print('teeth in hold',E(pg,'__game.S.cargo.teeth'))
    # megalodon
    E(pg,"(()=>{const g=__game;const m=g.makeShark(g.P.x+500,g.P.y,9,true);g.sharks.push(m);})()");sim(pg,4);pg.wait_for_timeout(300)
    print('megalodon: hp',E(pg,"__game.sharks.find(s=>s.mega).maxHp"),'chasing',E(pg,"__game.sharks.find(s=>s.mega).chase"),'auto-target is mega',E(pg,"!!(__game.autoTgt&&__game.autoTgt.mega)"))
    pg.screenshot(path=OUT+'04-megalodon.png')
    E(pg,"(()=>{const g=__game;g.sharks.length=0;g.P.hp=g.ST().maxHp;})()")
    # ---- seize a merchant ----
    def surrender():
        E(pg,"(()=>{const g=__game;g.P.x=4000;g.P.y=4700;g.P.h=0;g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;g.enemies.length=0;const e=g.makeEnemy('merchant',4000,4790,3);e.surr=true;e.surrT=0;e.hp=e.maxHp*0.25;e.h=0;g.enemies.push(e);})()");sim(pg,0.2);pg.wait_for_timeout(200)
    surrender();print('STATE',E(pg,'__game.state'),E(pg,'document.getElementById("boardBar").className'));print('fleet full label:',pg.inner_text('#seizeBtn'));E(pg,'document.getElementById("seizeBtn").click()');print('  seize when full -> fleet',E(pg,'__game.S.fleet.length'))
    E(pg,"__game.dock(0)");E(pg,"__game.setTab('ship')");pg.locator('#pBody button[data-arg="command"]').tap();pg.tap('#pLeave');pg.wait_for_timeout(100)
    surrender();pg.screenshot(path=OUT+'05-plunder-or-seize.png');E(pg,'document.getElementById("seizeBtn").click()');pg.wait_for_timeout(100)
    print('seized: fleet',E(pg,"__game.S.fleet.map(d=>d.name+':'+d.type+':'+d.hp+'/'+d.maxHp)"),'heat',round(E(pg,'__game.S.heat'),2))
    # wages / desertion
    w=E(pg,"(()=>{const g=__game;let w=0;for(const d of g.S.fleet)w+=d.wage;return w})()");E(pg,"__game.S.gold=0");E(pg,"__game.payWages();__game.payWages();__game.payWages()")
    print('wages/min',w,'-> after 3 unpaid, fleet',E(pg,'__game.S.fleet.length'))
    E(pg,"__game.S.gold=2000");E(pg,"__game.dock(0)");E(pg,"__game.setTab('fleet')");pg.locator('#pBody button[data-arg="sloop"]').tap();pg.locator('#pBody button[data-arg="brig"]').tap()
    E(pg,"__game.S.fleet.forEach(d=>{d.rep=0;d.hp=d.maxHp;})");E(pg,"__game.S.fleet[0].hp=20");E(pg,"__game.setTab('fleet')");pg.locator('#pBody button[data-act="frep"]').first.tap();print('repaired hp',E(pg,"__game.S.fleet[0].hp"),'/',E(pg,"__game.S.fleet[0].maxHp"))
    pg.locator('#pBody button[data-act="fdis"]').last.tap();pg.locator('#pBody button[data-act="fdis"]').last.tap();print('after dismiss fleet',E(pg,'__game.S.fleet.length'))
    pg.tap('#pLeave');sim(pg,1)
    code=E(pg,'__game.makeCode()');print('export code fleet:',E(pg,f"__game.parseCode({json.dumps(code)}).s.fleet.length"))
    # perf with fleet + many sharks in view
    E(pg,"(()=>{const g=__game;g.S.fleet.push({id:99,name:'Extra',type:'sloop',lvl:1,maxHp:90,hp:90,cannons:2,dmg:6,wage:6,unpaid:0});g.syncFleet();for(let i=0;i<14;i++){const s=g.makeShark(g.P.x+Math.cos(i)*250,g.P.y+Math.sin(i)*250,6);g.sharks.push(s);}for(let i=0;i<4;i++)g.enemies.push(g.makeEnemy('pirate',g.P.x+500+i*80,g.P.y-300,4));g.P.throttle=0.6;})()")
    print('FPS portrait (fleet',E(pg,'__game.fleet.length'),'sharks',E(pg,'__game.sharks.length'),') [avg fps, worst frame ms]:',fps(pg))
    pg.screenshot(path=OUT+'06-portrait-battle-fleet-sharks.png')
    pg.reload();pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(300);print('after reload fleet ents',E(pg,'__game.fleet.length'),'saved',E(pg,'__game.S.fleet.length'))
    ctx.close()
    # ---- landscape old save ----
    old={"gold":900,"up":{"hull":1,"sails":1,"cannons":1,"cargo":0},"crew":12,"roles":{"gunner":0,"sailor":0,"carpenter":0,"navigator":1},
         "cargo":{"rum":2,"sugar":0,"spice":0,"silk":0,"gems":0},"quests":[],"offers":{},"qid":3,"x":4100,"y":3900,"h":1.0,"hp":180,"kills":5,"infamy":150,
         "lastPort":0,"playTime":900,"fog":"","earned":700,"muted":False,"seen":True,"autoFire":True,"bal":2}
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,is_mobile=True,has_touch=True)
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('pirateSeas_save_v1',{json.dumps(json.dumps(old))});sessionStorage.setItem('seeded','1');}}")
    pg=ctx.new_page();hook(pg,'landscape');pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(300)
    print('OLD SAVE:',E(pg,"({fleet:__game.S.fleet.length,teeth:__game.S.cargo.teeth,command:__game.S.up.command,gold:__game.S.gold,tut:__game.T.on})"))
    E(pg,"(()=>{const g=__game;g.S.fleet.push({id:5,name:'Sea Wolf',type:'brig',lvl:1,maxHp:170,hp:120,cannons:3,dmg:8.5,wage:12,unpaid:0});g.syncFleet();g.P.x=5600;g.P.y=4700;g.P.h=0;g.enemies.length=0;const e=g.makeEnemy('merchant',5600,4790,2);e.surr=true;e.surrT=0;e.h=0;g.enemies.push(e);for(let i=0;i<6;i++)g.sharks.push(g.makeShark(5600+Math.cos(i)*220,4700+Math.sin(i)*160,5));for(const f of g.fleet){f.x=g.P.x-100;f.y=g.P.y-80;}})()");sim(pg,0.5);pg.wait_for_timeout(400)
    pg.screenshot(path=OUT+'07-landscape-fleet-sharks-seize.png')
    print('FPS landscape [avg, worst ms]:',fps(pg,3000))
    E(pg,"__game.setState('map')");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'08-landscape-map-shark-zones.png');E(pg,"__game.setState('play')")
    ov=E(pg,"""(()=>{const ids=['boostBtn','autoBtn','fireL','fireR','menuBtn','dockBtn','boardBar','tipBox','hud'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width);const o=[];for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){const A=r[a][1],B=r[b][1];if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)o.push(r[a][0]+'/'+r[b][0]);}return o})()""")
    print('overlaps landscape:',ov)
    ctx.close();b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs]
