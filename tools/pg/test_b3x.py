import json
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html';OUT='/workspace/pirate-game/screenshots-b3/'
errs=[]
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(f'[{tag}] pageerror: {e}'))
E=lambda pg,js: pg.evaluate(js)
def sim(pg,secs): pg.evaluate(f"(()=>{{for(let i=0;i<{int(secs*20)};i++)__game.step(0.05)}})()")
def place_merchant(pg,lvl=1,dist=200):
    # put a merchant abeam (right side) of the player, both heading east, player away from ports
    return E(pg,f"""(()=>{{const g=__game;g.P.x=12000;g.P.y=12700;g.P.h=0;g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;
      for(let i=g.enemies.length-1;i>=0;i--)g.enemies.splice(i,1);
      const e=g.makeEnemy("merchant",12000,12700+{dist},{lvl});e.h=0;g.enemies.push(e);return [e.maxHp,e.gold,g.inAnyIsland(12000,12700,60)?1:0];}})()""")
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- portrait new game ----------
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=ctx.new_page();hook(pg,'portrait');pg.goto(URL);pg.wait_for_timeout(400)
    pg.screenshot(path=OUT+'01-title-pirate-copy.png')
    pg.tap('#startBtn');pg.tap('#tutSkip');pg.tap('#tutSkip');pg.wait_for_timeout(300)
    print('ports haven:',E(pg,"__game.PORTS.map(p=>p.name+(p.haven?'*':'')).join(', ')"))
    print('merchant placed [hp,gold,island]:',place_merchant(pg))
    pg.wait_for_timeout(1200)
    print('merchant tip shown:',E(pg,"!document.getElementById('tipBox').classList.contains('hidden')"),'| auto target before attack:',E(pg,"__game.autoTgt&&__game.autoTgt.kind"))
    pg.screenshot(path=OUT+'02-merchant-tip-jolly-roger.png')
    for k in range(5):
        E(pg,"(()=>{const g=__game,e=g.enemies[0];e.x=g.P.x;e.y=g.P.y+200;e.vx=e.vy=0;e.speed=0;e.h=0;})()");E(pg,"__game.P.rr=0");E(pg,"__game.fire(1)");sim(pg,0.6)
        if E(pg,'__game.enemies[0].angry'):break
        print('   miss dbg',E(pg,"(()=>{const g=__game,e=g.enemies[0];return {state:g.state,dead:g.P.dead,P:[Math.round(g.P.x),Math.round(g.P.y),g.P.h.toFixed(2)],e:[e.kind,Math.round(e.x),Math.round(e.y),e.sinking,e.hp],n:g.enemies.length,tut:g.T.on}})()"))
    print('after manual shot: heat',round(E(pg,'__game.S.heat'),2),'merchant hp',E(pg,"Math.round(__game.enemies[0].hp)"),'angry',E(pg,'__game.enemies[0].angry'))
    # keep merchant abeam & let AUTO finish the job until surrender
    for i in range(40):
        st=E(pg,"(()=>{const g=__game,e=g.enemies.find(x=>x.kind==='merchant');if(!e)return 'gone';e.x=g.P.x;e.y=g.P.y+200;e.h=0;e.vx=e.vy=0;return e.surr?'surr':e.sinking?'sunk':Math.round(e.hp)})()")
        if st in('surr','sunk','gone'):break
        sim(pg,0.5)
    print('merchant state:',st,'| auto ignores surrendered:',E(pg,"!__game.autoTgt||__game.autoTgt.kind!=='merchant'"))
    E(pg,"(()=>{const g=__game,e=g.enemies.find(x=>x.surr);if(e){g.P.x=e.x;g.P.y=e.y-90;}})()");sim(pg,0.2);pg.wait_for_timeout(300)
    print('board button visible:',E(pg,"!document.getElementById('boardBtn').classList.contains('hidden')"))
    pg.screenshot(path=OUT+'03-surrender-board-button.png')
    g0=E(pg,'__game.S.gold');pg.tap('#boardBtn',force=True);pg.wait_for_timeout(200)
    print('boarded: gold +',E(pg,'__game.S.gold')-g0,'cargo',E(pg,'JSON.stringify(__game.S.cargo)'),'heat',round(E(pg,'__game.S.heat'),2),'stars',E(pg,'__game.stars()'))
    # first sinking: stars should still be 0 (friendly early game)
    place_merchant(pg);E(pg,"(()=>{const e=__game.enemies[0];e.hp=1;})()");E(pg,"__game.P.rr=0");E(pg,"__game.fire(1)");sim(pg,1.5)
    print('after 1 board + 1 sink: heat',round(E(pg,'__game.S.heat'),2),'stars',E(pg,'__game.stars()'),'raids',E(pg,'__game.S.raids'))
    # one more raid -> wanted; navy should come
    place_merchant(pg);E(pg,"(()=>{const e=__game.enemies[0];e.hp=1;})()");E(pg,"__game.P.rr=0");E(pg,"__game.fire(1)");sim(pg,1.5)
    print('after 3 raids: heat',round(E(pg,'__game.S.heat'),2),'stars',E(pg,'__game.stars()'),'wanted tip',E(pg,"__game.S.tips.wanted"))
    sim(pg,32);navy=E(pg,"__game.enemies.filter(e=>e.kind==='navy').map(e=>[e.lvl,Math.round(e.maxHp),Math.round(e.dmg*10)/10,Math.round(e.maxSpeed),Math.round(Math.hypot(e.x-__game.P.x,e.y-__game.P.y))])")
    print('navy after 32s at 1 star [lvl,hp,dmg,speed,dist]:',navy)
    sim(pg,8);print('  navy distance after 8s more:',E(pg,"__game.enemies.filter(e=>e.kind==='navy').map(e=>Math.round(Math.hypot(e.x-__game.P.x,e.y-__game.P.y)))"))
    E(pg,"(()=>{const g=__game,e=g.enemies.find(x=>x.kind==='navy');if(e){e.x=g.P.x+260;e.y=g.P.y-120;}})()");sim(pg,0.3);pg.wait_for_timeout(400)
    pg.screenshot(path=OUT+'04-wanted-hud-navy.png')
    # 3 stars: lawful port refuses / bribe; haven pays off
    E(pg,"__game.addHeat(8-__game.S.heat+0.2)");print('stars now',E(pg,'__game.stars()'),'bounty',E(pg,"document.getElementById('hBounty').textContent"))
    nas=E(pg,"__game.PORTS.findIndex(p=>p.name==='Nassau')")
    E(pg,f"(()=>{{const g=__game,p=g.PORTS[{nas}].port;g.P.x=p.x;g.P.y=p.y;g.P.vx=g.P.vy=0;g.P.throttle=0;g.P.speed=0;g.S.gold=20;}})()");sim(pg,0.2);pg.wait_for_timeout(300)
    print('Nassau dock button:',pg.inner_text('#dockBtn'));pg.tap('#dockBtn',force=True);pg.wait_for_timeout(200)
    print('  refused with 20 gold -> state',E(pg,'__game.state'),'| toast:',pg.inner_text('#toast'))
    E(pg,"__game.S.gold=2000");pg.tap('#dockBtn',force=True);pg.wait_for_timeout(300);print('  with 2000 gold -> state',E(pg,'__game.state'),'gold',E(pg,'__game.S.gold'))
    pg.screenshot(path=OUT+'05-lawful-port-bribe.png')
    E(pg,"__game.setTab('ship')");print('  hull upgrade price at Nassau (3★, +45%):',E(pg,"document.querySelector('#pBody button[data-arg=\"hull\"]').textContent"))
    E(pg,"__game.setTab('dock')");pg.locator('#pBody button[data-act="bribe"]').tap();print('  after bribe stars',E(pg,'__game.stars()'))
    pg.tap('#pLeave');pg.wait_for_timeout(200)
    E(pg,"(()=>{const g=__game,p=g.PORTS[0].port;g.P.x=p.x;g.P.y=p.y;})()");sim(pg,0.1);pg.tap('#dockBtn',force=True);pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'06-haven-payoff.png')
    pg.locator('#pBody button[data-act="payoff"]').tap();print('HAVEN payoff: heat',E(pg,'__game.S.heat'),'stars',E(pg,'__game.stars()'))
    pg.tap('#pLeave');sim(pg,2)
    sv=json.loads(E(pg,"localStorage.getItem('pirateSeas_save_v1')"));print('saved heat',sv['heat'],'tips',sv['tips'],'raids',sv.get('raids'))
    ctx.close()
    # ---------- landscape, old save ----------
    old={"gold":900,"up":{"hull":1,"sails":1,"cannons":1,"cargo":0},"crew":12,"roles":{"gunner":0,"sailor":0,"carpenter":0,"navigator":1},
         "cargo":{"rum":0,"sugar":0,"spice":0,"silk":0,"gems":0},"quests":[],"offers":{},"qid":3,"x":4100,"y":3900,"h":1.0,"hp":180,"kills":5,"infamy":150,
         "lastPort":0,"playTime":900,"fog":"","earned":700,"muted":False,"seen":True,"autoFire":True,"bal":2}
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,is_mobile=True,has_touch=True)
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('pirateSeas_save_v1',{json.dumps(json.dumps(old))});sessionStorage.setItem('seeded','1');}}")
    pg=ctx.new_page();hook(pg,'landscape');pg.goto(URL);pg.wait_for_timeout(400);pg.tap('#startBtn');pg.wait_for_timeout(300)
    print('OLD SAVE landscape:',E(pg,"({gold:__game.S.gold,heat:__game.S.heat,tips:JSON.stringify(__game.S.tips),tut:__game.T.on,want:document.getElementById('hWant').className})"))
    place_merchant(pg,2);pg.wait_for_timeout(800);pg.screenshot(path=OUT+'07-landscape-merchant-tip.png')
    E(pg,"(()=>{const e=__game.enemies[0];e.hp=e.maxHp*0.3+5;})()");E(pg,"__game.P.rr=0");E(pg,"__game.fire(1)");sim(pg,1)
    E(pg,"(()=>{const g=__game,e=g.enemies.find(x=>x.surr);if(e){g.P.x=e.x;g.P.y=e.y-90;}})()");E(pg,"__game.addHeat(4.5)");sim(pg,0.2);pg.wait_for_timeout(400)
    pg.screenshot(path=OUT+'08-landscape-board-wanted.png')
    print('  landscape board visible',E(pg,"!document.getElementById('boardBtn').classList.contains('hidden')"),'stars',E(pg,'__game.stars()'))
    pg.keyboard.press('f');print('  F key boards: plundered',E(pg,"__game.enemies.some(e=>e.plundered)"))
    ov=E(pg,"""(()=>{const ids=['boostBtn','autoBtn','fireL','fireR','menuBtn','dockBtn','boardBtn','tipBox','hud'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width);const o=[];for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){const A=r[a][1],B=r[b][1];if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)o.push(r[a][0]+'/'+r[b][0]);}return o})()""")
    print('  overlaps:',ov)
    ctx.close();b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs]
