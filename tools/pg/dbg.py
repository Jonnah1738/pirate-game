from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
    page=ctx.new_page();page.goto('http://127.0.0.1:8765/index.html');page.wait_for_timeout(300);page.tap('#startBtn')
    page.evaluate("__game.T.i=0");page.evaluate("(()=>{const g=__game;g.tutStart(3)})()");page.wait_for_timeout(300)
    for id in ['fireL','fireR','autoBtn']:
        bb=page.locator('#'+id).bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2
        print(id,bb,page.evaluate(f"(()=>{{const e=document.elementFromPoint({x},{y});return e.id||e.className||e.tagName}})()"))
    print(page.evaluate("document.getElementById('tutBub').getBoundingClientRect().toJSON()"))
    page.screenshot(path='/tmp/dbg.png');b.close()
