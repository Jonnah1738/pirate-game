from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8765/index.html');pg.wait_for_timeout(300);pg.click('#startBtn');pg.click('#tutSkip');pg.click('#tutSkip')
    E=pg.evaluate
    E("(()=>{const g=__game;g.S.fleet.push({id:5,name:'A',type:'brig',lvl:1,maxHp:170,hp:170,cannons:3,dmg:8.5,wage:12,unpaid:0},{id:6,name:'B',type:'sloop',lvl:1,maxHp:90,hp:90,cannons:2,dmg:6,wage:6,unpaid:0});g.P.x=5200;g.P.y=4600;g.syncFleet();for(const f of g.fleet){f.x=g.P.x-90;f.y=g.P.y+(f===g.fleet[0]?-80:80);}g.enemies.length=0;const e=g.makeEnemy('pirate',5450,4600,3);g.enemies.push(e);window.__e=e;})()")
    for i in range(12):
        E("(()=>{for(let i=0;i<20;i++)__game.step(0.05)})()")
        print(E("(()=>{const g=__game,e=window.__e;return [Math.round(e.hp),e.angry,Math.round(Math.hypot(e.x-g.P.x,e.y-g.P.y)),g.fleet.map(f=>(f.tgt?'T':'-')+Math.round(Math.hypot(f.x-e.x,f.y-e.y))).join(','),g.autoTgt===e, g.nearSafePort(g.P.x,g.P.y)]})()"))
    b.close()
