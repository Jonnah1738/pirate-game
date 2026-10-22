import json,sys,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OUT='/workspace/pirate-game/screenshots-grind/'+('live_' if LIVE else '')
errs=[];fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
OLD={"gold":50000,"crew":60,"tutDone":True,"seen":True,"bal":2,"infamy":90000,"xp":0,"clvl":60,"ship":"galleon","up":{"hull":10,"sails":8,"cannons":10,"cargo":8,"rigging":3,"command":3},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,
     "tips":{"republic":1,"fort":1,"ammo":1,"merchant":1,"shark":1,"wanted":1,"board":1,"boardnews":1}}
def page(b,save,tag):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
    if save is not None: pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',%s);}"%json.dumps(json.dumps(save)))
    pg.goto(URL+('&' if '?' in URL else '?')+'t=1');pg.wait_for_timeout(600);return ctx,pg
def start(pg):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tutDone=true;})()")
FLUSH="(()=>{const g=__game,X=g.STORY;let k=0;while(X.SQUE.length&&k<400){k++;const b=document.querySelector('#sBtns button');if(!b)break;b.click();}return k;})()"
HIDE="(()=>{const s=document.createElement('style');s.textContent='#tipBox,#toast{display:none!important}';document.head.appendChild(s);})()"
SETUP="""(()=>{const g=__game,S=g.S;S.clvl=25;S.gold=50000;S.tips=Object.assign(S.tips||{},{night:1,fog:1,storm:1,fish:1,dive:1,codex:1});g.enemies.length=0;g.recalc();})()"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,None,'fresh');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E(HIDE);E(SETUP)
    G="const g=__game,G=g.GRIND,S=g.S;"
    # day/night
    d=E("(()=>{"+G+"G.wxSet('clear',999);S.playTime=100;const day=G.wxNight(),lk0=G.grindLootK();S.playTime=G.DAYLEN*0.75;return {day,night:G.wxNight(),lk0,lk1:G.grindLootK()};})()")
    chk(not d['day'] and d['night'] and abs(d['lk1']/d['lk0']-1.25)<0.01,'8-min day cycle: night at 75%% of the cycle, loot ×%.2f'%(d['lk1']/d['lk0']))
    a=E("(()=>{"+G+"const e=g.makeEnemy('pirate',g.P.x+1500,g.P.y,8);g.enemies.push(e);const a0=e.aggro;G.wxTick(0.016);return {a0,a1:e.aggro};})()")
    chk(a['a1']<a['a0']*0.75,'night shrinks enemy detection %d→%d'%(a['a0'],a['a1']))
    E("(()=>{const g=__game;g.enemies.length=0;for(let i=0;i<3;i++){const e=g.makeEnemy('pirate',g.P.x+180+i*90,g.P.y-140+i*120,8);g.enemies.push(e);}})()")
    pg.wait_for_timeout(1200);pg.screenshot(path=OUT+'night.png')
    # fog
    f=E("(()=>{"+G+"S.playTime=100;G.wxSet('fog',100);G.WX.t=90;return {fog:G.wxFog()};})()")
    chk(f['fog'],'fog state active')
    pg.wait_for_timeout(1000);pg.screenshot(path=OUT+'fog.png')
    # storm + rogue wave: bow-in vs broadside
    def wave(face):
        return E("(f=>{"+G+"g.enemies.length=0;S.playTime=100;G.wxSet('storm',100);G.WX.t=90;g.P.hp=g.ST().maxHp;g.P.vx=g.P.vy=0;G.WX.wave=null;G.WX.wt=0;G.wxTick(0.016);const w=G.WX.wave;if(!w)return null;g.P.h=f==='bow'?w.a+Math.PI:w.a+Math.PI/2;const h0=g.P.hp;let k=0;while(G.WX.wave&&!G.WX.wave.hit.p&&k<800){g.P.vx=g.P.vy=0;G.wxTick(0.02);k++;}return {dmg:h0-g.P.hp,mx:g.ST().maxHp,t:k*0.02};})",face)
    w1=wave('bow');w2=wave('side')
    print(w1,w2)
    chk(w1 and w2 and w2['dmg']>w1['dmg']*3 and w1['t']>2.5,'rogue wave telegraphed %.1fs ahead; bow-in %.0f vs broadside %.0f dmg'%(w1['t'] if w1 else 0,w1['dmg'] if w1 else 0,w2['dmg'] if w2 else 0))
    E("(()=>{"+G+"g.P.hp=g.ST().maxHp;G.WX.wave=null;G.WX.wt=0;G.wxTick(0.016);for(let i=0;i<60;i++)G.wxTick(0.02);})()")
    pg.wait_for_timeout(500);pg.screenshot(path=OUT+'storm_rogue_wave.png')
    E("(()=>{"+G+"G.WX.wave=null;G.wxSet('clear',999);S.playTime=100;})()")
    # fishing
    fl=E("(()=>{"+G+"g.enemies.length=0;const w=g.HARD.waterNear(9000,9000,0,400);g.P.x=w.x;g.P.y=w.y;g.P.vx=g.P.vy=0;g.P.speed=0;return G.grindActLabel();})()")
    chk(fl=='🎣 Cast a line','stopped in open water: action button offers fishing (%s)'%fl)
    pg.wait_for_timeout(400);btn=E("(()=>{const b=document.getElementById('actBtn');return b.classList.contains('hidden')?null:b.textContent})()")
    chk(btn and 'Cast' in btn,'action button visible: %s'%btn)
    E("document.getElementById('actBtn').click()");pg.wait_for_timeout(200)
    st=E("__game.state")
    chk(st=='mini','fishing minigame opens (state=%s)'%st)
    # hold reel to show play then screenshot
    pg.dispatch_event('#mgB button[data-a=reel]','pointerdown');pg.wait_for_timeout(700)
    pg.screenshot(path=OUT+'fishing.png')
    E("(()=>{"+G+"const m=G.MG;m.prog=0.995;m.z=0;m.w=1;m.fx=0.5;m.tx=0.5;})()");pg.wait_for_timeout(400)
    fc=E("(()=>{"+G+"return {st:g.state,n:G.cxHave('fish'),fish:S.cst.fish|0};})()")
    chk(fc['st']=='play' and fc['n']==1 and fc['fish']==1,'catch lands a fish into the Codex %s'%fc)
    # escape
    E("(()=>{"+G+"G.fishStart&&0;})()")
    # all fish -> set bonus
    sb=E("(()=>{"+G+"g.recalc();const s0=g.ST().maxSpeed;for(const f of G.FISH)G.codexAdd('fish',f[0]);g.recalc();return {set:G.codexSet('fish'),k:g.ST().maxSpeed/s0};})()")
    chk(sb['set'] and abs(sb['k']-1.05)<0.01,'fish collection set bonus +5%% speed (×%.3f)'%sb['k'])
    cc=E("(()=>{"+G+"const c0=G.crewCap();for(const c of G.CXCAT.crew[2])G.codexAdd('crew',c[0]);return {c0,c1:G.crewCap()};})()")
    chk(cc['c1']==cc['c0']+1,'legendary-crew collection gives +1 bunk')
    # ships codex via sinking
    sh=E("(()=>{"+G+"const e=g.makeEnemy('navy',g.P.x+300,g.P.y,12,{forceCls:'iron'});G.grindSunk(e);return S.codex.ships;})()")
    chk(sh.get('iron')==1,'sinking an ironclad fills its Codex page')
    # diving
    dv=E("(()=>{"+G+"g.enemies.length=0;const r=G.wrecks()[0];g.P.x=r.x+40;g.P.y=r.y;g.P.vx=g.P.vy=0;fishCd=0;return {n:G.wrecks().length,lab:G.grindActLabel(),deep:G.wrecks().filter(w=>w.deep).length};})()".replace('fishCd=0;',''))
    chk(dv['n']>=12 and dv['lab']=='🤿 Dive the wreck','%d wrecks (%d deep); stopped over one offers a dive'%(dv['n'],dv['deep']))
    E("document.getElementById('actBtn').click()");pg.wait_for_timeout(300)
    # tap mounds via real taps on the canvas
    sp=E("(()=>{const m=__game.GRIND.MG;const c=document.getElementById('mgC').getBoundingClientRect();return m.spots.map(s=>[c.left+s.x/640*c.width,c.top+s.y/300*c.height]);})()")
    for x,y in sp[:4]: pg.mouse.click(x,y);pg.wait_for_timeout(120)
    pg.wait_for_timeout(700);pg.screenshot(path=OUT+'salvage_dive.png')
    E("(()=>{const m=__game.GRIND.MG;m.spots.forEach(s=>{s.it={e:'🪙',t:'Doubloon',art:'coin'};});m.spots[0].o=1;m.got.push({e:'🪙',t:'x',art:'coin'});m.got.push({g:300,e:'💰',t:'+300'});})()")
    g0=E("__game.S.gold");E("document.querySelector('#mgB button[data-a=close]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))");pg.wait_for_timeout(200)
    dr=E("(()=>{"+G+"const r=G.wrecks()[0];return {st:g.state,art:S.codex.art.coin|0,fresh:G.diveFresh(r),gold:S.gold,lab:G.grindActLabel()};})()")
    chk(dr['st']=='play' and dr['art']==1 and dr['gold']>g0 and not dr['fresh'],'surfacing hauls salvage + artifact; wreck is picked clean until next sea-day')
    ref=E("(()=>{"+G+"S.playTime+=600;return G.diveFresh(G.wrecks()[0]);})()")
    chk(ref,'wreck refills next sea-day')
    # codex tab
    E("(()=>{const g=__game;g.openMenu();})()");pg.wait_for_timeout(650)
    E("document.querySelector('#mTabs button[data-m=codex]').click()");pg.wait_for_timeout(300)
    ct=E("document.getElementById('mBody').innerText")
    chk('Codex' in ct and 'Fish — 12/12' in ct and 'Artifacts' in ct,'Codex tab lists collections')
    tw=E("(()=>{const t=document.getElementById('mTabs');return t.scrollWidth<=t.clientWidth+1})()")
    chk(tw,'7 menu tabs fit on a 390px phone')
    pg.screenshot(path=OUT+'codex.png')
    ctx.close()
    # old save migration
    ctx,pg=page(b,dict(OLD),'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    mg=E("(()=>{const S=__game.S;return {clvl:S.clvl,gold:S.gold,codex:S.codex,dive:S.dive,res:S.res};})()")
    chk(mg['clvl']==60 and mg['gold']==50000 and mg['codex']=={'ships':{},'fish':{},'art':{},'crew':{}} and mg['dive']=={},'old save migrates with Codex/dive defaults')
    code=E("__game.makeCode()");ok=E("(c=>{try{const r=__game.parseCode(c);return r.s.clvl===60&&!!r.s.codex}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and ok is True,'PSEAS1 export round-trips with Codex')
    ctx.close();b.close()
chk(not errs,'0 console errors %s'%errs[:5])
print('FAILS:',fails);sys.exit(1 if fails else 0)
