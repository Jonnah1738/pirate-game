# Playwright test: 2D "Try Pirate Seas 3D" link + shared 2D/3D vote prompt. Desktop + phone.
import json,sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
ORIG=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8771/index.html'
OUT='/workspace/pirate-game/screenshots-vote/'
import os; os.makedirs(OUT,exist_ok=True)
errs=[];fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
def mk(b,tag,w,h,mob,url=URL):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob,device_scale_factor=2 if mob else 1)
    ctx.route('https://jonnah1738.github.io/pirate-seas-3d/**',lambda r:r.fulfill(status=200,content_type='text/html',body='<title>3D stub</title>'))
    pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
    pg.goto(url);pg.wait_for_timeout(700);return ctx,pg
def start(pg,keepTut=False):
    pg.click('#startBtn');pg.wait_for_timeout(500)
    if not keepTut: pg.evaluate("(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tutDone=true;})()")
CALM="(()=>{const g=__game;if(!window.__cl)window.__cl=setInterval(()=>{g.enemies.length=0;},100);g.P.hp=g.ST().maxHp;})()"
VIS="(()=>{const e=document.getElementById('psvPrompt');return !!e&&e.getBoundingClientRect().width>0})()"
RD="JSON.parse(localStorage.getItem('pseas_pref_vote_v1')||'{}')"
def rect(pg,sel): return pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height}}",sel)
def ov(a,b): return a and b and a['l']<b['r'] and b['l']<a['r'] and a['t']<b['b'] and b['t']<a['b']
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    for tag,w,h,mob in [('desk',1280,800,False),('phone',390,844,True),('land',844,390,True)]:
        ctx,pg=mk(b,tag,w,h,mob);E=pg.evaluate
        # --- title banner
        r=rect(pg,'#psv3d');chk(r and r['w']>0 and r['l']>=0 and r['r']<=w and r['b']<=h,f'{tag}: Try-3D banner visible in viewport {r}')
        a=E("(()=>{const a=document.querySelector('#psv3d a');return [a.href,a.target,a.rel,a.textContent]})()")
        chk(a[0]=='https://jonnah1738.github.io/pirate-seas-3d/' and a[1]=='_blank' and 'noopener' in a[2],f'{tag}: link -> {a}')
        for bid in ['startBtn','tutBtn','xferTitleBtn']:
            chk(not ov(r,rect(pg,'#'+bid)),f'{tag}: banner does not overlap #{bid}')
        btnh=rect(pg,'#psv3d button');chk(btnh['h']>=32,f'{tag}: dismiss target {btnh["w"]:.0f}x{btnh["h"]:.0f}')
        pg.screenshot(path=OUT+f'{tag}_title.png')
        if tag!='land':
            with ctx.expect_page() as pi: pg.click('#psv3d a')
            np=pi.value;np.wait_for_load_state();chk(np.url=='https://jonnah1738.github.io/pirate-seas-3d/',f'{tag}: opened new tab {np.url}');np.close()
            chk(E("!document.getElementById('title').classList.contains('hidden')"),f'{tag}: clicking link did not start/close the title')
            pg.click('#psv3d button');pg.wait_for_timeout(200)
            chk(rect(pg,'#psv3d') is None and E("localStorage.getItem('pseas_try3d_off_v1')")=='1',f'{tag}: banner dismissed')
            pg.reload();pg.wait_for_timeout(700);chk(rect(pg,'#psv3d') is None,f'{tag}: dismissal persists after reload')
            chk(E("!document.getElementById('title').classList.contains('hidden')"),f'{tag}: dismiss did not start the game')
        # --- tutorial running: no prompt even after 5 min
        start(pg,keepTut=(tag=='phone'))
        if tag=='phone':
            chk(E("__game.T.on"),'phone: tutorial on');E("PSEASVote._setPlay(400)");pg.wait_for_timeout(2500)
            chk(not E(VIS),'phone: no prompt while tutorial bubble is up')
            E("(()=>{const g=__game;g.T.on=false;document.getElementById('tut').classList.add('hidden');g.S.tutDone=true;})()")
        E(CALM);E("PSEASVote._setPlay(10)");pg.wait_for_timeout(2500);chk(not E(VIS),f'{tag}: no prompt before 5 minutes')
        t0=E(RD)['play'];pg.wait_for_timeout(3200);t1=E("PSEASVote.read().play");chk(t1-t0>=2,f'{tag}: play time accumulates while sailing ({t0}->{t1})')
        E("PSEASVote._setPlay(297)");pg.wait_for_timeout(5000);chk(E(VIS),f'{tag}: prompt appears after ~5 min of play')
        txt=E("document.getElementById('psvPrompt').innerText");chk('Which do you prefer' in txt and '2D' in txt and '3D' in txt and 'tried' in txt and 'later' in txt,f'{tag}: prompt text ok')
        chk(not any(c.isdigit() for c in txt.replace('2D','').replace('3D','')),f'{tag}: prompt shows no numbers/tallies')
        pr=rect(pg,'.psv-card');chk(pr['l']>=0 and pr['r']<=w and pr['t']>=0 and pr['b']<=h,f'{tag}: prompt card fits viewport {pr}')
        pg.screenshot(path=OUT+f'{tag}_prompt.png')
        hp0=E("__game.P.x");pg.keyboard.press('ArrowUp')
        pg.click('.psv-l');pg.wait_for_timeout(200);d=E(RD)
        chk(not E(VIS) and d.get('sn')==1 and d['next']>=d['play']+590 and not d.get('v'),f'{tag}: ask-later snoozes ~10 min (play={d["play"]} next={d["next"]})')
        E("PSEASVote._setPlay(%d)"%(d['next']-1));pg.wait_for_timeout(3000);chk(E(VIS),f'{tag}: asked again after snooze')
        choice={'desk':'3d','phone':'not-tried','land':'2d'}[tag]
        pg.click(f'[data-psv="{choice}"]');pg.wait_for_timeout(300);d=E(RD)
        chk(d.get('v')==choice and d.get('g')=='2d',f'{tag}: vote stored {d.get("v")}')
        chk(E("PSEASVote.log.join(',')")=='vote-'+choice,f'{tag}: would hit vote-{choice} (local: not sent) -> {E("PSEASVote.log")}')
        pg.screenshot(path=OUT+f'{tag}_thanks.png')
        if choice=='not-tried': chk(E("!!document.querySelector('[data-psv=\"try\"]')"),'phone: thanks offers Try 3D')
        pg.wait_for_timeout(9500 if choice=='not-tried' else 3000);chk(not E(VIS),f'{tag}: thanks card auto-closes')
        E("PSEASVote._setPlay(5000)");pg.wait_for_timeout(2500);chk(not E(VIS),f'{tag}: never re-prompts after voting')
        # --- Captain's Log: link + change vote
        E("__game.openMenu()");pg.wait_for_timeout(400)
        rows=E("[...document.querySelectorAll('#mBody .item')].map(e=>e.querySelector('b').textContent)")
        gi=[i for i,x in enumerate(rows) if 'Graphics' in x]
        chk(gi and rows[gi[0]+1].endswith('Pirate Seas 3D') and '2D or 3D' in rows[gi[0]+2],f'{tag}: log rows after Graphics {rows[gi[0]:gi[0]+4] if gi else rows}')
        rt=E("document.querySelectorAll('.psv-mrow')[1].innerText");chk('Your vote' in rt and 'Change' in rt,f'{tag}: settings row shows own vote only: {rt!r}')
        la=E("document.querySelector('.psv-mrow a').href");chk(la=='https://jonnah1738.github.io/pirate-seas-3d/','%s: log link %s'%(tag,la))
        pg.locator('.psv-mrow [data-pv="vote"]').scroll_into_view_if_needed();pg.screenshot(path=OUT+f'{tag}_log.png')
        pg.click('.psv-mrow [data-pv="vote"]');pg.wait_for_timeout(300);chk(E(VIS) and 'Cancel' in E("document.getElementById('psvPrompt').innerText"),f'{tag}: change-vote dialog opens')
        chk(E("!document.getElementById('menu').classList.contains('hidden')") and E("__game.state")=='menu',f'{tag}: menu still open under dialog')
        pg.screenshot(path=OUT+f'{tag}_change.png')
        new={'3d':'2d','not-tried':'3d','2d':'not-tried'}[choice]
        pg.click(f'#psvPrompt [data-psv="{new}"]');pg.wait_for_timeout(300)
        chk(E("PSEASVote.log.join(',')")==f'vote-{choice},unvote-{choice},vote-{new}' and E(RD)['v']==new,f'{tag}: change -> {E("PSEASVote.log")}')
        pg.click('#psvPrompt [data-psv="ok"]') if E(VIS) and E("!!document.querySelector('#psvPrompt [data-psv=\"ok\"]')") else None
        pg.wait_for_timeout(300);rt=E("document.querySelectorAll('.psv-mrow')[1].innerText");chk(('3D' if new=='3d' else '2D' if new=='2d' else 'tried') in rt,f'{tag}: row refreshed {rt!r}')
        pg.click('.psv-mrow [data-pv="vote"]');pg.wait_for_timeout(200);pg.click('#psvPrompt .psv-l');pg.wait_for_timeout(200)
        chk(len(E("PSEASVote.log"))==3 and not E(VIS),f'{tag}: cancel changes nothing')
        ctx.close()
    # --- save format: same flow on original vs patched, compare keys
    def flow(url):
        ctx,pg=mk(b,'fmt',390,844,True,url);start(pg);pg.evaluate(CALM);pg.wait_for_timeout(3000)
        pg.evaluate("__game.openMenu()");pg.wait_for_timeout(300);pg.evaluate("document.querySelector('#menu .phead button, #mClose').click()");pg.wait_for_timeout(300)
        pg.evaluate("window.dispatchEvent(new Event('pagehide'))");pg.wait_for_timeout(300)
        r=pg.evaluate("(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k);}return o})()");ctx.close();return r
    A=flow(ORIG);B=flow(URL)
    ka=set(A);kb=set(B)
    chk(kb-ka<= {'pseas_pref_vote_v1'} and ka<=kb,f'localStorage keys: orig={sorted(ka)} new-only={sorted(kb-ka)}')
    sa=json.loads(A['pirateSeas_save_v1']);sb=json.loads(B['pirateSeas_save_v1'])
    chk(sorted(sa)==sorted(sb),f'save JSON has identical key set ({len(sa)} keys)')
    chk(all(type(sa[k])==type(sb[k]) for k in sa),'save field types identical')
    chk(not any('pseas' in k or 'vote' in k for k in sb),'no vote data inside the save')
    b.close()
bad=[e for e in errs if 'favicon' not in e]
chk(not bad,f'no console errors {bad[:5]}')
print('FAILS',len(fails));sys.exit(1 if fails else 0)
