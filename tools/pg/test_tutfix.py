import json,sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
OUT='/workspace/pirate-game/screenshots-tutfix/'+('live_' if 'github.io' in URL else '')
VPS=[(390,844),(360,740),(844,390),(740,360)]
bad=0
with sync_playwright() as p:
  b=p.chromium.launch()
  for (w,h) in VPS:
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL+('&' if '?' in URL else '?')+'nc=1');pg.wait_for_timeout(500);pg.click('#tutBtn');pg.wait_for_timeout(400)
    n=pg.evaluate('__game.TSTEPS.length');rects=[]
    for i in range(n):
      st=pg.evaluate(f"(()=>{{const g=__game;const st=g.TSTEPS[{i}];if(st.port||st.menu)return 'skip';g.T.i={i};g.T.c={{}};g.T.html='';return 'ok'}})()")
      if st=='skip':continue
      pg.wait_for_timeout(250)
      r=pg.evaluate("""(()=>{const b=document.getElementById('tutBub').getBoundingClientRect();const hud=document.getElementById('hud').getBoundingClientRect();
        const ship={x:innerWidth/2,y:innerHeight/2};return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height),hudB:Math.round(hud.bottom),hudR:Math.round(hud.right),
        shipCovered:ship.x>b.left&&ship.x<b.right&&ship.y>b.top-20&&ship.y<b.bottom+20,id:__game.TSTEPS[__game.T.i].id}})()""")
      rects.append(r)
      if i in (0,2,5,9) or r['id'] in ('fireL','map','auto','boost'):pg.screenshot(path=f"{OUT}{w}x{h}_step{i+1:02d}_{r['id']}.png")
    xs={(r['x'],r['y'],r['w']) for r in rects}
    cov=[r['id'] for r in rects if r['shipCovered']]
    land=w>h
    overHud=[r['id'] for r in rects if (not land and r['y']<r['hudB']) or (land and r['x']<r['hudR'] and r['y']<r['hudB'])]
    hs=[r['h'] for r in rects]
    print(f"{w}x{h}: steps={len(rects)} positions={sorted(xs)} maxH={max(hs)} shipCovered={cov} overHUD={overHud} errors={len(errs)} {errs[:2]}")
    if len({(r['x'],r['y']) for r in rects})>1 or cov or overHud or errs:bad+=1
    # tip box
    pg.evaluate("__game.T.on=false;document.getElementById('tut').classList.add('hidden');__game.S.tips={};")
    pg.evaluate("(()=>{const g=__game;g.setState('play');})()")
    pg.evaluate("document.getElementById('tipTxt').innerHTML='🦈 <b>Sharks!</b> test tip text that is about as long as a real tip in the game, two or three lines.';document.getElementById('tipBox').classList.remove('hidden')")
    pg.wait_for_timeout(400)
    t=pg.evaluate("(()=>{const b=document.getElementById('tipBox').getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)]})()")
    print('   tip',t);pg.screenshot(path=f"{OUT}{w}x{h}_tip.png")
    ctx.close()
  b.close()
print('RESULT', 'PASS' if not bad else 'FAIL')
