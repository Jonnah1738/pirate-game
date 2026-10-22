from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8765/index.html');pg.wait_for_timeout(300);pg.click('#startBtn');pg.click('#tutSkip');pg.click('#tutSkip')
    E=pg.evaluate
    print(E("""(()=>{const g=__game,z=g.SHARKZ[0];g.P.x=z.x;g.P.y=z.y;g.enemies.length=0;g.S.crew=12;g.recalc();let bites=0,crewLost=0,ticks=0;
     for(let r=0;r<5;r++){g.P.hp=g.ST().maxHp*0.3;g.sharks.length=0;for(let i=0;i<4;i++){const s=g.makeShark(g.P.x+60*i,g.P.y+100,5);g.sharks.push(s);}
      for(let i=0;i<160;i++){const hp=g.P.hp,c=g.S.crew;g.step(0.05);if(g.P.hp<hp)bites++;if(g.S.crew<c)crewLost+=c-g.S.crew;g.S.crew=12;g.S.playTime+=0;g.P.hp=Math.max(g.P.hp,10);}}
     return {bites,crewLost,secs:40}})()"""))
    b.close()
