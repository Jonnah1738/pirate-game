from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    page=ctx.new_page();page.on('pageerror',lambda e:print('ERR',e))
    page.goto('http://127.0.0.1:8765/index.html');page.wait_for_timeout(300);page.tap('#startBtn');page.tap('#tutNext')
    cdp=ctx.new_cdp_session(page)
    T=lambda t,pts:cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y,'id':i} for i,x,y in pts]})
    fl=page.locator('#fireL').bounding_box();fr=page.locator('#fireR').bounding_box()
    L=(fl['x']+37,fl['y']+37);R=(fr['x']+37,fr['y']+37)
    T('touchStart',[(0,195,620)]);T('touchMove',[(0,195,540)]);page.wait_for_timeout(200)
    for n,pt in enumerate((L,R)):
        T('touchStart',[(0,195,540),(n+1,*pt)]);page.wait_for_timeout(80)
        T('touchEnd',[(n+1,*pt)]) if False else None
        T('touchMove',[(0,190+n,540)]);page.wait_for_timeout(80)   # finger 1 lifted
        print('joy',page.evaluate('__game.P.throttle'),'rl',page.evaluate('__game.P.rl'),'rr',page.evaluate('__game.P.rr'),'shots',page.evaluate('__game.T.c.shots'))
    T('touchEnd',[]);b.close()
