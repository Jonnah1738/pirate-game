import json,sys,math,re
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OLD='http://127.0.0.1:8765/old_board.html'
OUT='/workspace/pirate-game/screenshots-board/'+('live_' if LIVE else '')
E=lambda pg,js: pg.evaluate(js)
errs=[];R={}
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
def sim(pg,sec,dt=1/60): E(pg,f"(()=>{{for(let i=0;i<{int(sec/dt)};i++)__game.step({dt});}})()")
def bsim(pg,sec): E(pg,f"__game.B.sim({int(sec*60)})")
def fps(pg,ms=4000):
    return E(pg,f"""new Promise(r=>{{let n=0,t0=performance.now(),worst=0,last=t0,ws=[];function f(t){{n++;const d=t-last;ws.push(d);worst=Math.max(worst,d);last=t;if(t-t0<{ms})requestAnimationFrame(f);else{{ws.sort((a,b)=>b-a);r([Math.round(n*1000/(t-t0)),Math.round(worst),ws.slice(0,5).map(Math.round)]);}}}}requestAnimationFrame(f);}})""")
SAVE0={"gold":20000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":3000,"xp":0,"clvl":1,"ship":"frigate","up":{"hull":8,"sails":6,"cannons":8,"cargo":4,"rigging":2,"command":2},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,"unl":60}
def inject(ctx,pg,saveobj,url=URL,tag='x',raw=False):
    if pg: pg.close()
    pg=ctx.new_page();hook(pg,tag)
    js=json.dumps(saveobj) if not raw else saveobj
    pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%js)
    pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(700);return pg
def fresh(b,w,h,save=None,url=URL,tag='',touch=True):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=2 if touch else 1)
    if save is not None: return ctx,inject(ctx,None,save,url,tag or f'{w}x{h}')
    pg=ctx.new_page();hook(pg,tag or f'{w}x{h}');pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(400);return ctx,pg
def start(pg,tips=True):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    E(pg,"(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tips=Object.assign({republic:1,fort:1,ammo:1,merchant:1,shark:1,wanted:1,board:1,boardnews:1},g.S.tips);})()")
def level(pg,l): E(pg,f"(()=>{{const g=__game;let need=0;for(let k=1;k<{l};k++)need+=g.X.xpNeed(k);g.S.xp=need;g.S.clvl={l};g.S.sp=0;g.S.unl={l};g.recalc();g.P.hp=g.ST().maxHp;}})()")
WATER="(()=>{const g=__game;g.enemies.length=0;if(g.sharks)g.sharks.length=0;for(let k=0;k<600;k++){const x=12000+Math.cos(k)*k*25,y=9500+Math.sin(k)*k*25;let ok=!g.nearSafePort(x,y);for(let dx=-300;dx<=300&&ok;dx+=50)for(let dy=-300;dy<=300;dy+=50)if(g.inAnyIsland(x+dx,y+dy,0)){ok=false;break;}if(ok){g.P.x=x;g.P.y=y;g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;g.P.h=0;return [x,y];}}})()"
def touch_drag(cdp,x0,y0,dx,dy,hold_ms,pg):
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0,'id':7}]})
    for k in range(1,8):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+dx*k/7,'y':y0+dy*k/7,'id':7}]});pg.wait_for_timeout(16)
    pg.wait_for_timeout(hold_ms);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
def rect(pg,sel): return E(pg,f"(()=>{{const r=document.querySelector('{sel}').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}})()")
def ctap(pg,cdp,sel):
    r=rect(pg,sel);x,y=(r[0]+r[2])/2,(r[1]+r[3])/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':3}]});pg.wait_for_timeout(40);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
def waitph(pg,ph,ms=6000):
    pg.wait_for_function(f"__game.B.BR.ph==='{ph}'",timeout=ms)
def overlap(a,b): return not(a[2]<=b[0] or b[2]<=a[0] or a[3]<=b[1] or b[3]<=a[1])
def finish(pg,maxs=120):
    E(pg,"__game.B.BR.auto=true");t=0
    while E(pg,"__game.B.BR.ph")=='fight' and t<maxs: bsim(pg,1);t+=1
    bsim(pg,1.5);return t

fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
def BALL(t,d): return "(()=>{const g=__game,P=g.P,t=%s;g.balls.push({x:t.x,y:t.y,vx:0,vy:0,life:1,dmg:%d,owner:'%s'});})()"%("P" if t=='p' else "__m",d,"e" if t=='p' else "p")
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=fresh(b,390,844,SAVE0,tag='lock');start(pg);level(pg,12);E(pg,WATER)
    E(pg,"(()=>{const g=__game;const e=g.makeEnemy('merchant',g.P.x+95,g.P.y+20,4,{name:'Fat Goose'});e.hp=e.maxHp*0.45;e.h=0;g.enemies.push(e);window.__m=e;})()")
    sim(pg,0.2);pg.wait_for_timeout(350);cdp=ctx.new_cdp_session(pg)
    E(pg,"document.getElementById('tipOk').click()");ctap(pg,cdp,'#grapBtn');waitph(pg,'pick');pg.wait_for_timeout(200)
    E(pg,"document.querySelector('#bpTacs button').click()");waitph(pg,'fight')
    h0=E(pg,"[__game.P.hp,__m.hp]")
    for k in range(3):
        E(pg,BALL('p',80));E(pg,BALL('e',80));bsim(pg,0.3)
    h1=E(pg,"[__game.P.hp,__m.hp,document.getElementById('hullLock').className,document.getElementById('hullLock').textContent,__game.GRIND.hullLocked()]")
    print(h0,h1)
    chk(h1[0]==h0[0] and h1[1]==h0[1] and h1[4],'boarding: both hulls take no damage (player %.0f, foe %.0f)'%(h1[0],h1[1]))
    pg.wait_for_timeout(400);ind=E(pg,"[document.getElementById('hullLock').className,document.getElementById('hullLock').textContent]")
    chk(ind[0]=='' and 'hulls locked' in ind[1],'indicator shown: %s'%ind[1])
    pg.screenshot(path='/workspace/pirate-game/screenshots-mp/boarding_hulls_locked.png')
    E(pg,"__game.B.BR.t=__game.GRIND.BRMAX+0.5");bsim(pg,0.2);ph=E(pg,"__game.B.BR.ph");bsim(pg,3)
    chk(ph=='end','boarding ends at the %ss max duration'%E(pg,"__game.GRIND.BRMAX"))
    pg.wait_for_timeout(300)
    for k in range(40):
        if E(pg,"__game.B.BR.on"):
            if E(pg,"__game.B.BR.ph")=='res': pg.locator('#brBtns button').first.tap();pg.wait_for_timeout(900)
            else: bsim(pg,0.5)
    st=E(pg,"[__game.state,__game.B.BR.on,__game.GRIND.hullLocked()]")
    print('after',st)
    E(pg,"(()=>{const g=__game;__m.x=g.P.x+95;__m.y=g.P.y+20;__m.hp=__m.maxHp*0.4;})()");sim(pg,1.0)
    gt=E(pg,"!!__game.B.grapTgt");hp0=E(pg,"__game.P.hp");E(pg,BALL('p',30));sim(pg,0.2);hp1=E(pg,"__game.P.hp")
    chk(not st[1] and not st[2] and not gt,'after boarding: hull lock off, re-grapple on cooldown (no grapple target)')
    chk(hp1<hp0,'hull damage resumes after boarding (%.0f→%.0f)'%(hp0,hp1))
    ctx.close();b.close()
print('FAILS:',fails);import sys;sys.exit(1 if fails else 0)
