import json, time, sys
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html'
OUT='/workspace/pirate-game/screenshots-b2/'
errs=[]
OVJS="""(()=>{const ids=['boostBtn','autoBtn','fireL','fireR','turnL','turnR','sailUp','sailDn','menuBtn','dockBtn'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width);const o=[];for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){const A=r[a][1],B=r[b][1];if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)o.push(r[a][0]+'/'+r[b][0]);}return o})()"""
def hook(page,tag):
    page.on('console', lambda m: errs.append(f'[{tag}] console.{m.type}: {m.text}') if m.type in ('error','warning') else None)
    page.on('pageerror', lambda e: errs.append(f'[{tag}] pageerror: {e}'))
def step(page): return page.evaluate('__game.T.i')
def sid(page): return page.evaluate('__game.TSTEPS[__game.T.i].id')
def wait_step(page,id_,t=20000):
    page.wait_for_function(f"__game.T.on && __game.TSTEPS[__game.T.i].id==='{id_}'",timeout=t)
    print('  -> step',id_)
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- 1. brand-new game, full tutorial on a phone ----------
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    page=ctx.new_page();hook(page,'new')
    page.goto(URL);page.wait_for_timeout(500)
    page.tap('#startBtn');wait_step(page,'hello')
    page.screenshot(path=OUT+'01-tutorial-welcome.png')
    print('  overlaps portrait drag-mode (dock visible):',page.evaluate(OVJS))
    page.tap('#tutNext');wait_step(page,'sail')
    cdp=ctx.new_cdp_session(page)
    def touch(type_,pts): cdp.send('Input.dispatchTouchEvent',{'type':type_,'touchPoints':[{'x':x,'y':y,'id':i} for (i,x,y) in pts]})
    # finger 0 drags on the sea for full sails heading north
    touch('touchStart',[(0,195,470)])
    for k in range(1,9): touch('touchMove',[(0,195,470+k*10)]);page.wait_for_timeout(30)
    page.wait_for_timeout(500)
    page.screenshot(path=OUT+'02-joystick-drag.png')
    page.wait_for_timeout(100);print('  sail dist',page.evaluate('[__game.T.c.dist,__game.T.c.maxThr]'));wait_step(page,'turn',15000)
    # steer left then right while still holding
    for k in range(14): touch('touchMove',[(0,195-k*9,560)]);page.wait_for_timeout(30)
    page.wait_for_timeout(1800)
    for k in range(20): touch('touchMove',[(0,115+k*8,540)]);page.wait_for_timeout(30)
    print('  turn counters',page.evaluate('[__game.T.c.L,__game.T.c.R,__game.P.h]'))
    page.wait_for_timeout(1500);print('  turn counters',page.evaluate('[__game.T.c.L,__game.T.c.R,__game.P.h]'));wait_step(page,'fire',15000)
    # multi-touch: keep steering with finger 0 while finger 1 taps the fire buttons
    fl=page.locator('#fireL').bounding_box();fr=page.locator('#fireR').bounding_box()
    c=lambda bb:(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
    page.screenshot(path=OUT+'03-tutorial-fire-step.png')
    shots0=page.evaluate('__game.T.c.shots||0')
    touch('touchStart',[(0,275,540)])
    for n,bb in enumerate((fl,fr,fl)):
        x,y=c(bb);touch('touchStart',[(0,275,540),(n+1,x,y)]);page.wait_for_timeout(60);touch('touchMove',[(0,276+n,540)]);print('   tap',n,x,y,page.evaluate('[__game.P.rl,__game.P.rr,__game.T.c.shots,document.elementFromPoint(%d,%d).closest("button")?.id]'%(x,y)));page.wait_for_timeout(2700)
    print('  shots while steering (multi-touch):',page.evaluate('__game.T.c.shots||0'),'sides',page.evaluate('[__game.T.c.sl,__game.T.c.sr]'),'throttle',page.evaluate('__game.P.throttle'))
    touch('touchEnd',[])
    wait_step(page,'auto',8000)
    page.tap('#autoBtn');page.wait_for_timeout(300);page.tap('#autoBtn')
    wait_step(page,'enemy')
    # sail-assist for the test: place ship beside the dummy, beam-on
    page.evaluate("""(()=>{const g=__game,d=g.T.dummy;g.P.x=d.x;g.P.y=d.y+230;g.P.h=0;g.P.vx=g.P.vy=0;g.P.throttle=0;g.P.speed=0;})()""")
    page.wait_for_timeout(300);page.screenshot(path=OUT+'04-tutorial-training-target.png')
    wait_step(page,'loot',20000)
    page.evaluate("""(()=>{const g=__game,l=g.T.loot;g.P.x=l.x;g.P.y=l.y+20;})()""")
    wait_step(page,'map',8000)
    mm=page.evaluate('(()=>{const r=__game;return 1})()')
    # minimap is top-right; tap its centre
    page.touchscreen.tap(390-10-109/2,10+109/2)
    wait_step(page,'mapClose',5000);page.screenshot(path=OUT+'05-tutorial-map.png')
    page.touchscreen.tap(195,420)
    wait_step(page,'dock',5000)
    page.evaluate("""(()=>{const g=__game,p=g.PORTS[0].port;g.P.x=p.x;g.P.y=p.y+60;g.P.vx=g.P.vy=0;g.P.throttle=0;g.P.speed=0;})()""")
    page.wait_for_selector('#dockBtn:not(.hidden)');page.wait_for_timeout(300);page.tap('#dockBtn',force=True)
    wait_step(page,'shipTab',5000);page.tap('#pTabs button[data-tab="ship"]')
    wait_step(page,'buy',5000);page.wait_for_timeout(300);page.screenshot(path=OUT+'06-tutorial-buy-upgrade.png')
    gold=page.evaluate('__game.S.gold');print('  gold at shop',gold)
    page.locator('#pBody button[data-act="up"]:not([disabled])').first.tap()
    wait_step(page,'leave',5000);page.tap('#pLeave')
    wait_step(page,'boost',5000);page.wait_for_timeout(300);page.screenshot(path=OUT+'b2-01-tutorial-boost-step.png');page.tap('#boostBtn')
    page.wait_for_timeout(1500);print('  boost active',page.evaluate('[__game.P.boost,__game.P.boostCd,Math.hypot(__game.P.vx,__game.P.vy),__game.ST().maxSpeed]'))
    page.screenshot(path=OUT+'b2-02-boost-active-portrait.png')
    wait_step(page,'log',5000);page.tap('#menuBtn')
    wait_step(page,'save',5000);page.locator('#mBody button[data-act="savenow"]').tap()
    wait_step(page,'finish',5000);page.screenshot(path=OUT+'07-tutorial-finish.png');page.tap('#tutNext')
    page.wait_for_function("!__game.T.on && __game.state==='play'")
    saved=json.loads(page.evaluate("localStorage.getItem('pirateSeas_save_v1')"))
    print('NEW GAME: tutDone',saved['tutDone'],'kills',saved['kills'],'up',saved['up'],'gold',saved['gold'])
    assert saved['tutDone'] is True
    # export code still works and carries the flag
    code=page.evaluate('__game.makeCode()');assert code.startswith('PSEAS1.');print('  export code ok, len',len(code))
    r=page.evaluate(f'__game.parseCode({json.dumps(code)}).s.tutDone');print('  parsed tutDone',r)
    # reload: tutorial must not come back
    page.reload();page.wait_for_timeout(400);page.tap('#startBtn');page.wait_for_timeout(400)
    print('  after reload T.on =',page.evaluate('__game.T.on'))
    ctx.close()

    # ---------- 2. old save (pre-tutorial) on a phone, landscape, button steering ----------
    old={"gold":1234,"up":{"hull":2,"sails":1,"cannons":1,"cargo":0},"crew":14,"roles":{"gunner":1,"sailor":0,"carpenter":0,"navigator":1},
         "cargo":{"rum":3,"sugar":0,"spice":0,"silk":0,"gems":0},"quests":[],"offers":{},"qid":5,"x":4100,"y":3900,"h":1.0,"hp":200,"kills":12,"infamy":420,
         "lastPort":0,"playTime":3000,"fog":"","earned":2000,"muted":False,"seen":True,"autoFire":True,"bal":2}
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=3,is_mobile=True,has_touch=True)
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('pirateSeas_save_v1',{json.dumps(json.dumps(old))});sessionStorage.setItem('seeded','1');}}")
    page=ctx.new_page();hook(page,'old')
    page.goto(URL);page.wait_for_timeout(500)
    print('OLD SAVE: start button =',page.inner_text('#startBtn'))
    page.tap('#startBtn');page.wait_for_timeout(500)
    st=page.evaluate('({on:__game.T.on,state:__game.state,gold:__game.S.gold,done:__game.S.tutDone,kills:__game.S.kills,hull:__game.S.up.hull})')
    print('  ',st);assert not st['on'] and st['gold']==1234 and st['done'] is True
    print('  overlaps landscape drag-mode:',page.evaluate(OVJS))
    # enable steering buttons via Captain's Log
    page.tap('#menuBtn');page.wait_for_timeout(200);page.locator('#mBody button[data-act="steer"]').tap();page.tap('#mClose');page.wait_for_timeout(200)
    print('  overlaps landscape buttons-mode:',page.evaluate(OVJS))
    h0=page.evaluate('__game.P.h')
    page.tap('#sailUp');page.tap('#sailUp');thr=page.evaluate('__game.P.throttle')
    cdp=ctx.new_cdp_session(page)
    tl=page.locator('#turnR').bounding_box();fr=page.locator('#fireR').bounding_box()
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':tl['x']+30,'y':tl['y']+30,'id':0}]})
    page.wait_for_timeout(700)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':tl['x']+30,'y':tl['y']+30,'id':0},{'x':fr['x']+30,'y':fr['y']+30,'id':1}]})
    page.wait_for_timeout(80)
    rr=page.evaluate('__game.P.rr')
    page.screenshot(path=OUT+'08-landscape-steer-buttons.png')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    page.wait_for_timeout(200)
    print(f'  buttons mode: throttle {thr}, heading change {page.evaluate("__game.P.h")-h0:.2f} rad, fired right while turning: {rr>0}')
    print('  old save rigging lvl',page.evaluate('__game.S.up.rigging'),'tip class',page.evaluate("document.getElementById('boostBtn').className"))
    # turn-rate comparison: 1s hard right turn, normal vs boosted
    def turn1(boosted):
        page.evaluate("(()=>{const g=__game;g.P.boost=0;g.P.boostCd=0;g.P.h=0;g.P.throttle=1;g.P.speed=g.ST().maxSpeed;g.P.x=4000;g.P.y=4300})()")
        if boosted: page.evaluate('__game.boost()')
        h0=page.evaluate('__game.P.h');page.keyboard.down('d');page.wait_for_timeout(1000);page.keyboard.up('d');return page.evaluate('__game.P.h')-h0
    tn=turn1(False);tb=turn1(True);print(f'  turn in 1s: normal {tn:.2f} rad, boosted {tb:.2f} rad')
    page.evaluate("(()=>{const g=__game;g.P.boost=0;g.P.boostCd=0;})()");page.keyboard.press('b');page.wait_for_timeout(2500)
    print('  key B -> boost',round(page.evaluate('__game.P.boost'),2),'speed',round(page.evaluate('Math.hypot(__game.P.vx,__game.P.vy)')),'max',round(page.evaluate('__game.ST().maxSpeed')))
    page.screenshot(path=OUT+'b2-03-landscape-buttons-boost-active.png')
    page.evaluate("__game.P.boost=0.01");page.wait_for_timeout(1500);page.screenshot(path=OUT+'b2-04-landscape-boost-cooldown.png')
    print('  cooldown label',page.inner_text('#boostLbl'),'--p',page.evaluate("document.getElementById('boostBtn').style.getPropertyValue('--p')"))
    page.evaluate("(()=>{const g=__game;g.dock(0);g.setTab('ship')})()");page.wait_for_timeout(200)
    page.locator('#pBody button[data-arg="rigging"]').tap();print('  rigging after buy',page.evaluate('[__game.S.up.rigging,__game.ST().boostDur,__game.ST().boostCd]'))
    page.screenshot(path=OUT+'b2-05-shipyard-rigging.png');page.tap('#pLeave');page.wait_for_timeout(200)
    # replay tutorial from the Captain's Log
    page.tap('#menuBtn');page.wait_for_timeout(200);page.locator('#mBody button[data-act="tut"]').tap();page.wait_for_timeout(300)
    print('  replay from log: T.on',page.evaluate('__game.T.on'),'step',sid(page))
    page.tap('#tutNext');page.wait_for_timeout(300);page.screenshot(path=OUT+'09-landscape-tutorial-sail-buttons.png')
    page.tap('#tutSkip');page.tap('#tutSkip');page.wait_for_timeout(200)
    print('  skip: T.on',page.evaluate('__game.T.on'),'tutDone',page.evaluate('__game.S.tutDone'))
    # rotate to portrait
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400)
    page.screenshot(path=OUT+'b2-06-portrait-buttons-mode.png')
    ov=page.evaluate('''(()=>{const ids=['boostBtn','autoBtn','fireL','fireR','turnL','turnR','sailUp','sailDn','menuBtn'];const r=ids.map(i=>[i,document.getElementById(i).getBoundingClientRect()]).filter(x=>x[1].width);const o=[];for(let a=0;a<r.length;a++)for(let b=a+1;b<r.length;b++){const A=r[a][1],B=r[b][1];if(A.left<B.right&&B.left<A.right&&A.top<B.bottom&&B.top<A.bottom)o.push(r[a][0]+'/'+r[b][0]);}return o})()''');print('  overlaps portrait buttons-mode:',ov)
    print('  after rotate canvas',page.evaluate('[document.getElementById("c").width,document.getElementById("c").height]'))
    ctx.close()

    # ---------- 3. desktop keyboard ----------
    ctx=b.new_context(viewport={'width':1280,'height':800})
    page=ctx.new_page();hook(page,'desk')
    page.goto(URL);page.wait_for_timeout(300);page.click('#startBtn');page.click('#tutNext')
    page.keyboard.down('w');page.wait_for_timeout(900);page.keyboard.up('w')
    page.keyboard.down('d');page.wait_for_timeout(800);page.keyboard.up('d')
    page.keyboard.press('q')
    print('DESKTOP: throttle',round(page.evaluate('__game.P.throttle'),2),'rl',round(page.evaluate('__game.P.rl'),2),'step',sid(page))
    sizes=page.evaluate("""[...document.querySelectorAll('.btnr')].filter(b=>b.offsetParent!==null||getComputedStyle(b).display!=='none').map(b=>b.id+':'+Math.round(b.getBoundingClientRect().width)+'x'+Math.round(b.getBoundingClientRect().height))""")
    print('  button sizes',sizes)
    ctx.close();b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs]
