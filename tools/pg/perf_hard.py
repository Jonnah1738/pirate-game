import os
from playwright.sync_api import sync_playwright
import sys
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader']);ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(URL+'?t=1');pg.wait_for_timeout(600);pg.click('#startBtn');pg.wait_for_timeout(300)
    cdp=ctx.new_cdp_session(pg);cdp.send('Emulation.setCPUThrottlingRate',{'rate':int(os.environ.get('RATE','4'))})
    pg.evaluate("""(()=>{const PLAIN=%s;const g=__game,H=g.HARD,S=g.S;g.T.on=false;document.getElementById('tut').classList.add('hidden');S.tutDone=true;S.clvl=50;const R=H.SREG[1];const w=H.waterNear(R.cx-1800,R.cy+1500,0,400);g.P.x=w.x;g.P.y=w.y;g.P.maxHp=g.P.hp=1e6;g.enemies.length=0;
      for(let i=0;i<9;i++){const c=['frigate','galleon','iron'][i%%3];const q=H.waterNear(w.x+Math.cos(i)*350,w.y+Math.sin(i)*350,0,200);const e=g.makeEnemy('navy',q.x,q.y,14,{forceCls:PLAIN?undefined:c});if(PLAIN){e.cls='';e.paint=e.deck=undefined;}e.angry=true;g.enemies.push(e);}})()"""%("true" if len(sys.argv)>2 else "false"))
    import os
    WXM=os.environ.get('WX','')
    if WXM: pg.evaluate("(m=>{const G=__game.GRIND,S=__game.S;if(m.includes('night'))S.playTime=__game.GRIND.DAYLEN*0.75;if(m.includes('storm')){G.wxSet('storm',200);G.WX.t=150;}if(m.includes('fog')){G.wxSet('fog',200);G.WX.t=150;}})",WXM)
    pg.evaluate('m=>__game.GRIND.gfxSet&&__game.GRIND.gfxSet(m)',os.environ.get('GFX','high'))
    if os.environ.get('RSDBG'): pg.evaluate('d=>{__game.GRIND.RS.dbg=d}',int(os.environ['RSDBG']))
    pg.wait_for_timeout(int(os.environ.get('WARM','1500')))
    r=pg.evaluate("new Promise(r=>{let n=0,w=0,l=performance.now();const t0=l;function f(t){n++;w=Math.max(w,t-l);l=t;if(t-t0<5000)requestAnimationFrame(f);else r([Math.round(n/5),Math.round(w)])}requestAnimationFrame(f)})")
    print('dpr',pg.evaluate('window.devicePixelRatio'),'low',pg.evaluate('__game.GRIND.RS.low'));print('FPS (4x CPU throttle, 9 class ships in combat'+(' + '+WXM if WXM else '')+') [avg, worst ms]:',r,'errors',errs)
