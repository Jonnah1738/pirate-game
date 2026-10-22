import json,sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1];PFX=sys.argv[2]
OUT='/workspace/pirate-game/screenshots-board-v2/'+PFX
E=lambda pg,js: pg.evaluate(js)
errs=[]
SEED="(()=>{let a=1234567;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();"
SAVE0={"gold":20000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":3000,"xp":0,"clvl":1,"ship":"frigate","up":{"hull":8,"sails":6,"cannons":8,"cargo":4,"rigging":2,"command":2},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,"unl":60,"tips":{"republic":1,"fort":1,"ammo":1,"merchant":1,"shark":1,"wanted":1,"board":1,"boardnews":1,"grapple":1,"brawl":1}}
WATER="(()=>{const g=__game;g.enemies.length=0;if(g.sharks)g.sharks.length=0;for(let k=0;k<600;k++){const x=12000+Math.cos(k)*k*25,y=9500+Math.sin(k)*k*25;let ok=!g.nearSafePort(x,y);for(let dx=-300;dx<=300&&ok;dx+=50)for(let dy=-300;dy<=300;dy+=50)if(g.inAnyIsland(x+dx,y+dy,0)){ok=false;break;}if(ok){g.P.x=x;g.P.y=y;g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;g.P.h=0;return [x,y];}}})()"
def level(pg,l): E(pg,f"(()=>{{const g=__game;let need=0;for(let k=1;k<{l};k++)need+=g.X.xpNeed(k);g.S.xp=need;g.S.clvl={l};g.S.sp=0;g.S.unl={l};g.recalc();g.P.hp=g.ST().maxHp;g.S.cap.sw=3;g.S.cap.pi=2;g.S.cap.ar=3;}})()")
def page(b,w,h):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2)
    pg=ctx.new_page();pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.add_init_script(SEED+"if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%json.dumps(SAVE0))
    pg.goto(URL+'?t=1');pg.wait_for_timeout(600);pg.click('#startBtn');pg.wait_for_timeout(300)
    E(pg,"(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}})()");return ctx,pg
def deck(pg,kind,lvl,extra='{}',lead=None):
    E(pg,WATER)
    if lead is not None: E(pg,f"(()=>{{const g=__game;const e=g.X.spawnLeader({lead});g.enemies.length=0;g.enemies.push(e);e.x=g.P.x+90;e.y=g.P.y;e.hp=e.maxHp*0.4;g.B.startBrawl(e,'duel');}})()")
    else: E(pg,f"(()=>{{const g=__game;const e=g.makeEnemy('{kind}',g.P.x+90,g.P.y,{lvl},{extra});e.hp=e.maxHp*0.45;g.enemies.push(e);g.B.startBrawl(e,'deck');}})()")
    E(pg,"__game.B.sim(40)")
def close(pg):
    E(pg,"(()=>{const B=__game.B;if(B.BR.ph==='fight')B.endBrawl('retreat');B.sim(120);const b=document.querySelector('#brBtns button:not([disabled])');if(b)b.click();B.sim(200);})()")
    pg.wait_for_timeout(300)
def fight(pg,tac,sec,auto=True,name=None):
    E(pg,f"__game.B.chooseTactic('{tac}');__game.B.BR.auto={'true' if auto else 'false'};__game.B.sim({int(sec*60)})")
    E(pg,"document.getElementById('toast').style.visibility='hidden'");pg.wait_for_timeout(120);pg.screenshot(path=OUT+name+'.png')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,390,844);level(pg,14)
    deck(pg,'pirate',7);pg.wait_for_timeout(150);pg.screenshot(path=OUT+'pick_portrait.png')
    fight(pg,'charge',2.2,name='deck_pirate_portrait')
    E(pg,"__game.B.BR.auto=true;__game.B.sim(60*60)");pg.wait_for_timeout(250);pg.screenshot(path=OUT+'result_portrait.png');close(pg)
    deck(pg,'navy',8);fight(pg,'hold',2.5,name='deck_navy_portrait');close(pg)
    deck(pg,'merchant',5);fight(pg,'pistols',1.6,name='deck_merchant_portrait');close(pg)
    level(pg,35)
    for c,nm in [(1,'mordecai'),(0,'flame'),(2,'iron'),(3,'serpent')]:
        deck(pg,'',0,lead=c);E(pg,"__game.B.chooseTactic('charge');__game.B.BR.auto=true;__game.B.BR.boss.ai.pt=0")
        for i in range(40):
            E(pg,"__game.B.sim(6)")
            if E(pg,"__game.B.BR.tg.length>0&&__game.B.BR.tg[0].t>0.15"):break
        E(pg,"(()=>{const B=__game.B.BR;B.boss.x=0;B.boss.y=-70;B.boss.fade=0;B.me.x=25;B.me.y=40;B.me.face=-2;B.boss.face=1.2;B.cam.x=B.me.x;B.cam.y=B.me.y-20;})()");E(pg,"__game.B.sim(4)")
        E(pg,"document.getElementById('toast').style.visibility='hidden'");pg.wait_for_timeout(100);pg.screenshot(path=OUT+f'duel_{nm}_portrait.png');close(pg)
    level(pg,15);E(pg,WATER);E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x+100,g.P.y,8);e.angry=true;g.enemies.push(e);g.B.startBrawl(e,'repel');g.B.sim(40);})()")
    fight(pg,'hold',1.8,name='repel_portrait');close(pg)
    level(pg,30);E(pg,"(()=>{const g=__game,X=g.X;const f=X.FORTS.find(f=>X.fortOwner(f)!=='p'&&f.lvl<=10)||X.FORTS[1];g.enemies.length=0;g.B.startBrawl(null,'fort',f);g.B.sim(40);})()")
    fight(pg,'charge',2.4,name='fort_portrait');close(pg)
    ctx.close()
    ctx,pg=page(b,844,390);level(pg,14)
    deck(pg,'pirate',7);fight(pg,'charge',2.2,name='deck_pirate_landscape');close(pg)
    level(pg,35);deck(pg,'',0,lead=1);E(pg,"__game.B.chooseTactic('charge');__game.B.BR.auto=true;__game.B.sim(120);const B=__game.B.BR;B.boss.x=0;B.boss.y=-70;B.boss.fade=0;B.me.x=25;B.me.y=40;B.me.face=-2;B.boss.face=1.2;B.cam.x=B.me.x;B.cam.y=B.me.y-20;__game.B.sim(4)");E(pg,"document.getElementById('toast').style.visibility='hidden'");pg.wait_for_timeout(100);pg.screenshot(path=OUT+'duel_mordecai_landscape.png');close(pg)
    level(pg,30);E(pg,"(()=>{const g=__game,X=g.X;const f=X.FORTS.find(f=>X.fortOwner(f)!=='p'&&f.lvl<=10)||X.FORTS[1];g.enemies.length=0;g.B.startBrawl(null,'fort',f);g.B.sim(40);})()")
    fight(pg,'charge',2.4,name='fort_landscape')
    ctx.close()
    print('errors',errs)
