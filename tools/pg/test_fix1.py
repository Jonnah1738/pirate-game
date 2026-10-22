import json
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:8765/';OUT='/workspace/pirate-game/screenshots-fix1/'
errs=[]
E=lambda pg,js: pg.evaluate(js)
def swipe(pg,cdp,sel,dy=-380,steps=12,x=None):
    r=E(pg,f"(()=>{{const b=document.querySelector('{sel}').getBoundingClientRect();return [b.left+b.width/2,b.top+b.height*0.75,b.top+b.height*0.25]}})()")
    x0=x if x is not None else r[0];y0=r[1] if dy<0 else r[2]
    send=lambda t,pts: cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':pts})
    send('touchStart',[{'x':x0,'y':y0,'id':1}])
    for k in range(1,steps+1): send('touchMove',[{'x':x0,'y':y0+dy*k/steps,'id':1}]);pg.wait_for_timeout(16)
    send('touchEnd',[]);pg.wait_for_timeout(350)
def st(pg,sel): return E(pg,f"(()=>{{const e=document.querySelector('{sel}');return [Math.round(e.scrollTop),e.scrollHeight-e.clientHeight]}})()")
def inview(pg,ids,vh,vw):
    out={}
    for i in ids:
        r=E(pg,f"(()=>{{const b=document.getElementById('{i}').getBoundingClientRect();return [b.top,b.bottom,b.left,b.right,b.width,b.height]}})()")
        out[i]=(r[0]>=0 and r[1]<=vh and r[2]>=0 and r[3]<=vw, f"{round(r[4])}x{round(r[5])}")
    return out
with sync_playwright() as p:
    b=p.chromium.launch()
    # --- old build reproduces the bug ---
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True);pg=ctx.new_page();cdp=ctx.new_cdp_session(pg)
    pg.goto(BASE+'old_tmp.html');pg.wait_for_timeout(400);sb=E(pg,"document.getElementById('startBtn').getBoundingClientRect().bottom")
    swipe(pg,cdp,'#title .panel');print('OLD build 390x844: start button bottom',round(sb),'(viewport 844) panel scrollTop after swipe',E(pg,"document.querySelector('#title .panel').scrollTop"),'start btn bottom after',round(E(pg,"document.getElementById('startBtn').getBoundingClientRect().bottom")))
    ctx.close()
    for (w,h) in [(390,844),(360,740),(360,640),(844,390)]:
        tag=f'{w}x{h}'
        ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=3,is_mobile=True,has_touch=True);pg=ctx.new_page();cdp=ctx.new_cdp_session(pg)
        pg.on('console',lambda m,t=tag: errs.append(f'[{t}] {m.type}: {m.text}') if m.type in('error','warning') else None);pg.on('pageerror',lambda e,t=tag: errs.append(f'[{t}] {e}'))
        pg.goto(BASE+'index.html');pg.wait_for_timeout(400)
        print(f'== {tag}: collapsed card buttons in view:',inview(pg,['titleX','startBtn','tutBtn','xferTitleBtn'],h,w),'panel h',round(E(pg,"document.querySelector('#title .panel').getBoundingClientRect().height")))
        pg.screenshot(path=OUT+f'{tag}-1-title-collapsed.png')
        pg.tap('#howTo summary');pg.wait_for_timeout(200);print('   expanded: open',E(pg,"document.getElementById('howTo').open"),'scroll',st(pg,'#titleBody'),'buttons still in view',all(v[0] for v in inview(pg,['titleX','startBtn','tutBtn','xferTitleBtn'],h,w).values()))
        pg.screenshot(path=OUT+f'{tag}-2-howto-expanded.png')
        for k in range(8):
            swipe(pg,cdp,'#titleBody')
            s=st(pg,'#titleBody')
            if s[0]>=s[1]-1:break
        print('   after touch swipes:',s,'reached bottom',s[0]>=s[1]-1,'swipes',k+1)
        pg.screenshot(path=OUT+f'{tag}-3-scrolled-bottom.png')
        swipe(pg,cdp,'#titleBody',dy=500);print('   swipe back down -> scrollTop',st(pg,'#titleBody')[0])
        # ✕ closes and starts (new game -> tutorial)
        pg.tap('#titleX');pg.wait_for_timeout(300);print('   ✕ -> state',E(pg,'__game.state'),'tutorial on',E(pg,'__game.T.on'),'title hidden',E(pg,"document.getElementById('title').classList.contains('hidden')"))
        pg.tap('#tutSkip');pg.tap('#tutSkip');pg.wait_for_timeout(100)
        # gameplay drag steering still works
        h0=E(pg,'__game.P.h');x0,y0=w*0.5,h*0.55
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0,'id':3}]})
        for k in range(1,10):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0-k*9,'y':y0,'id':3}]});pg.wait_for_timeout(30)
        pg.wait_for_timeout(700);thr=E(pg,'__game.P.throttle');cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        print('   steering drag: throttle',round(thr,2),'heading change',round(abs(E(pg,'__game.P.h')-h0),2))
        # port + menu + save transfer scroll by touch
        E(pg,"__game.S.gold=99999;__game.dock(0);__game.setTab('ship')");pg.wait_for_timeout(200);swipe(pg,cdp,'#pBody');print('   port Ship tab scroll',st(pg,'#pBody'))
        pg.screenshot(path=OUT+f'{tag}-4-port-scrolled.png');pg.tap('#pLeave');pg.wait_for_timeout(200)
        pg.tap('#menuBtn');pg.wait_for_timeout(500);swipe(pg,cdp,'#mBody');a=st(pg,'#mBody');pg.tap('#mTabs button[data-m=skills]');pg.wait_for_timeout(150);swipe(pg,cdp,'#mBody');print('   menu Log scroll',a,'Skills scroll',st(pg,'#mBody'))
        pg.screenshot(path=OUT+f'{tag}-5-menu-skills-scrolled.png');pg.tap('#mClose');pg.wait_for_timeout(150)
        ctx.close()
    # existing save -> ✕ continues without tutorial (landscape short + small portrait)
    for (w,h) in [(360,640),(844,390)]:
        ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=3,is_mobile=True,has_touch=True)
        ctx.add_init_script("if(!sessionStorage.getItem('s')){localStorage.setItem('pirateSeas_save_v1',JSON.stringify({gold:500,up:{hull:1,sails:0,cannons:0,cargo:0},crew:12,roles:{gunner:0,sailor:0,carpenter:0,navigator:0},cargo:{},quests:[],offers:{},qid:2,x:4100,y:3900,h:1,hp:150,kills:3,infamy:120,lastPort:0,playTime:500,fog:'',earned:100,muted:false,seen:true,autoFire:true,bal:2,tutDone:true}));sessionStorage.setItem('s','1');}")
        pg=ctx.new_page();pg.on('pageerror',lambda e: errs.append(str(e)));pg.goto(BASE+'index.html');pg.wait_for_timeout(400)
        print(f'SAVE {w}x{h}: start label',pg.inner_text('#startBtn'));pg.screenshot(path=OUT+f'{w}x{h}-6-continue-title.png')
        pg.tap('#titleX');pg.wait_for_timeout(300);print('   ✕ -> state',E(pg,'__game.state'),'tutorial',E(pg,'__game.T.on'),'gold',E(pg,'__game.S.gold'))
        ctx.close()
    b.close()
print('ERRORS:',len(errs));[print(' ',e) for e in errs]
