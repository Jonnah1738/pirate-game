import json,sys,os,math
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OUT='/workspace/pirate-game/screenshots-throttle/'+('live_' if LIVE else '')
errs=[];fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
OLD={"gold":50000,"crew":60,"tutDone":True,"seen":True,"bal":2,"infamy":90000,"xp":0,"clvl":60,"ship":"galleon","up":{"hull":10,"sails":8,"cannons":10,"cargo":8,"rigging":3,"command":3},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,
     "tips":{"republic":1,"fort":1,"ammo":1,"merchant":1,"shark":1,"wanted":1,"board":1,"boardnews":1},
     "fleet":[{"id":2,"name":"Salty Dog","type":"sloop","lvl":1,"maxHp":90,"hp":90,"cannons":2,"dmg":6,"wage":0,"unpaid":0},{"id":3,"name":"Fat Goose","type":"prize","lvl":9,"maxHp":300,"hp":300,"cannons":4,"dmg":14.8,"wage":0,"unpaid":0}],"fid":3}
def page(b,save,tag,w=390,h=844):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
    if save is not None: pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',%s);}"%json.dumps(json.dumps(save)))
    pg.goto(URL+('&' if '?' in URL else '?')+'t=1');pg.wait_for_timeout(600);return ctx,pg
def start(pg):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tutDone=true;})()")
G="const g=__game,G=g.GRIND,S=g.S,P=g.P;"
# open sea, no enemies, calm weather; keep it that way
SEA=G+"""const free=(x,y)=>{for(let a=0;a<6.3;a+=0.4)for(let r=0;r<=1500;r+=150)if(g.inAnyIsland(x+Math.cos(a)*r,y+Math.sin(a)*r,60))return false;return !g.nearSafePort(x,y);};
let pt=null;for(let k=0;k<4000&&!pt;k++){const x=3000+Math.random()*14000,y=3000+Math.random()*14000;if(free(x,y))pt={x,y};}
P.x=pt.x;P.y=pt.y;P.h=0;P.vx=P.vy=P.speed=0;P.boost=0;P.boostCd=0;G.wxSet('clear',9999);
if(!window.__cl)window.__cl=setInterval(()=>{g.enemies.length=0;g.sharks.length=0;if(G.WX)G.WX.wt=999;},100);"""
def W(pg,ms): pg.wait_for_timeout(ms)
def overlaps(pg,label):
    r=pg.evaluate("""(()=>{const R=el=>{const r=el.getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width}};const th=R(document.getElementById('thr'));
     const out=[];const ov=(a,b)=>a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b;
     for(const id of ['fireL','fireR','autoBtn','boostBtn','ammoBtn','grapBtn','actBtn','dockBtn','boardBar','menuBtn','turnL','turnR','sailUp','sailDn','hud','tutBub','tipBox']){const el=document.getElementById(id);if(!el)continue;
       const hid=el.classList.contains('hidden');if(hid)el.classList.remove('hidden');const cs=getComputedStyle(el);const r=R(el);if(hid)el.classList.add('hidden');
       if(cs.display==='none'||!r.w)continue;if(ov(th,r))out.push(id+JSON.stringify(r));}
     const s=Math.round(Math.min(Math.max(Math.min(innerWidth,innerHeight)*0.28,96),150));const m={l:innerWidth-s-10,t:10,r:innerWidth-10,b:10+s+30};if(ov(th,m))out.push('minimap');
     return {out,th,vw:innerWidth,vh:innerHeight};})()""")
    chk(not r['out'] and r['th']['w']>0 and r['th']['b']<=r['vh'] and r['th']['t']>=0,'%s: lever %dx%d at (%d,%d) overlaps nothing %s'%(label,r['th']['r']-r['th']['l'],r['th']['b']-r['th']['t'],r['th']['l'],r['th']['t'],r['out']))
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,OLD,'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E("(()=>{const s=document.createElement('style');s.textContent='#tipBox,#toast{display:none!important}';document.head.appendChild(s);})()")
    m=E("(()=>{"+G+"return {sail:S.sail,clvl:S.clvl,ship:S.ship,fl:S.fleet.length,vis:!document.getElementById('thr').classList.contains('hidden'),rd:document.getElementById('thrRead').textContent};})()")
    chk(m['sail']==1 and m['clvl']==60 and m['ship']=='galleon' and m['fl']==2,'old save migrates: lever defaults to 100%%, progress kept (%s)'%m)
    chk(m['vis'],'lever visible at sea (readout %s)'%m['rd'])
    E("__game.GRIND.thrSet(0.5)");code=E("__game.makeCode()");rt=E("(c=>{try{return __game.parseCode(c).s.sail}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and rt==0.5,'PSEAS1 export carries the sail setting (%s)'%rt)
    E("(()=>{__game.S.sail=0.75;localStorage.setItem('pirateSeas_save_v1',JSON.stringify(Object.assign({},JSON.parse(localStorage.getItem('pirateSeas_save_v1')||'{}'),{sail:0.75})));})()")
    # ---- partial speeds
    E("(()=>{"+SEA+"})()")
    sp={}
    for v in [1,0.5,0.25]:
        E("(v=>{"+G+"P.h=0;G.thrSet(v);})",v);W(pg,7000)
        sp[v]=E("(()=>{const P=__game.P;return {s:P.speed,v:Math.hypot(P.vx,P.vy),rd:document.getElementById('thrRead').textContent,eff:__game.GRIND.thrEff(),max:__game.ST().maxSpeed}})()")
    print(sp)
    chk(abs(sp[0.5]['s']/sp[1]['s']-0.5)<0.06 and abs(sp[0.25]['s']/sp[1]['s']-0.25)<0.05,'partial speeds: 100%%→%.0f, 50%%→%.0f, 25%%→%.0f kn'%(sp[1]['s'],sp[0.5]['s'],sp[0.25]['s']))
    chk(sp[0.5]['rd']=='50%' and sp[0.25]['rd']=='25%','readout shows the setting (%s/%s)'%(sp[0.5]['rd'],sp[0.25]['rd']))
    # joystick trim scales within the cap
    E("(()=>{"+G+"G.thrSet(0.5);P.throttle=0.5;})()");W(pg,6000)
    js=E("(()=>{const P=__game.P;return {s:P.speed,eff:__game.GRIND.thrEff()}})()")
    chk(abs(js['eff']-0.25)<1e-6 and abs(js['s']/sp[1]['s']-0.25)<0.05,'joystick half deflection under a 50%% cap → 25%% (%.0f kn)'%js['s'])
    # ---- all stop & hold
    E("(()=>{"+G+"G.thrSet(1);})()");W(pg,6000)
    E("(()=>{"+G+"P.vx0=P.speed;G.thrStop();window.__t0=performance.now();})()")
    W(pg,1500);mid=E("__game.P.speed");W(pg,4500)
    st=E("(()=>{const P=__game.P;window.__h0={x:P.x,y:P.y};return {s:P.speed,v:Math.hypot(P.vx,P.vy),rd:document.getElementById('thrRead').textContent}})()")
    chk(mid>5 and st['s']<1 and st['v']<2,'all stop decelerates smoothly (still %.0f kn after 1.5s) to a halt (%.2f kn after 6s), readout "%s"'%(mid,st['s'],st['rd']))
    W(pg,12000);dr=E("(()=>{const P=__game.P;return Math.hypot(P.x-__h0.x,P.y-__h0.y)})()")
    chk(dr<6,'holds position in calm water (drift %.1f px in 12s)'%dr)
    # storm: barely drifts
    E("(()=>{"+G+"G.wxSet('storm',9999);G.WX.t=G.WX.dur*0.5;G.WX.wt=999;window.__h0={x:P.x,y:P.y};})()");W(pg,12000)
    ds=E("(()=>{const P=__game.P;return Math.hypot(P.x-__h0.x,P.y-__h0.y)})()")
    chk(ds<40,'all stop in a storm: only slight drift (%.1f px in 12s)'%ds)
    E("__game.GRIND.wxSet('clear',9999)")
    pg.screenshot(path=OUT+'all_stop_portrait.png')
    # ---- turn in place
    E("(()=>{const P=__game.P;window.__h0={x:P.x,y:P.y,h:P.h};})()");pg.keyboard.down('d');W(pg,3000);pg.keyboard.up('d')
    tu=E("(()=>{const P=__game.P;return {dh:P.h-__h0.h,d:Math.hypot(P.x-__h0.x,P.y-__h0.y),s:P.speed}})()")
    chk(abs(tu['dh'])>0.6 and tu['d']<6,'rotates in place while stopped (%.0f° in 3s, moved %.1f px)'%(math.degrees(tu['dh']),tu['d']))
    # ---- boost on top, then back to the setting
    E("(()=>{"+G+"P.h=0;G.thrSet(0.5);})()");W(pg,6000);c50=E("__game.P.speed")
    E("(()=>{const g=__game;g.P.boostCd=0;g.boost();})()");W(pg,1500)
    bo=E("(()=>{const P=__game.P;return {s:P.speed,b:P.boost,rd:document.getElementById('thrRead').textContent}})()")
    E("(()=>{const P=__game.P;P.boost=Math.min(P.boost,0.05);})()");W(pg,7000)
    af=E("(()=>{const P=__game.P;return {s:P.speed,sail:__game.S.sail,rd:document.getElementById('thrRead').textContent}})()")
    chk(bo['b']>0 and bo['s']>sp[1]['s']*1.05 and 'BOOST' in bo['rd'],'boost adds on top at 50%% (%.0f kn > full sail %.0f, readout "%s")'%(bo['s'],sp[1]['s'],bo['rd']))
    chk(af['sail']==0.5 and abs(af['s']/c50-1)<0.08 and af['rd']=='50%','after boost she settles back to the 50%% setting (%.0f vs %.0f kn)'%(af['s'],c50))
    # ---- lever UI: buttons, drag, double tap
    pg.locator('#thrStop').tap();W(pg,200);a=E("__game.S.sail")
    pg.locator('#thrFull').tap();W(pg,200);bb=E("__game.S.sail")
    r=E("(()=>{const r=document.getElementById('thrTrack').getBoundingClientRect();return {x:r.left+20,t:r.top+9,h:r.height-18}})()")
    cdp=ctx.new_cdp_session(pg)
    def touch(t,pts): cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y} for x,y in pts]})
    touch('touchStart',[(r['x'],r['t']+r['h']*0.1)]);
    for k in range(1,11): touch('touchMove',[(r['x'],r['t']+r['h']*(0.1+0.052*k))])
    touch('touchEnd',[]);W(pg,200);dg=E("__game.S.sail")
    touch('touchStart',[(r['x'],r['t']+r['h']*0.73)]);touch('touchEnd',[]);W(pg,200);sn=E("__game.S.sail")
    W(pg,450);touch('touchStart',[(r['x'],r['t']+r['h']*0.4)]);touch('touchEnd',[]);W(pg,80);touch('touchStart',[(r['x'],r['t']+r['h']*0.4)]);touch('touchEnd',[]);W(pg,200);dt2=E("__game.S.sail")
    print(a,bb,dg,sn,dt2)
    chk(a==0 and bb==1,'⚓ STOP / ⛵ FULL quick buttons (0%% / 100%%)')
    chk(abs(dg-0.38)<0.04,'dragging the lever sets any value (%.2f)'%dg)
    chk(sn==0.25,'notch snap near 25%% (%.2f)'%sn)
    chk(dt2==0,'double-tap on the lever = all stop (%.2f)'%dt2)
    # ---- keyboard
    pg.keyboard.press('Equal');k1=E("__game.S.sail");pg.keyboard.press('Equal');k2=E("__game.S.sail");pg.keyboard.press('Minus');k3=E("__game.S.sail")
    pg.keyboard.down('w');W(pg,700);pg.keyboard.up('w');k4=E("__game.S.sail");pg.keyboard.press('x');k5=E("__game.S.sail")
    chk(k1==0.25 and k2==0.5 and k3==0.25 and k4>0.4 and k5==0,'keys: +/− step 25%% (%s,%s,%s), W raises (%.2f), X all stop'%(k1,k2,k3,k4))
    # ---- fleet holds position
    E("(()=>{"+SEA+"g.syncFleet();G.fleetEnts.forEach((f,i)=>{f.x=P.x-120-60*i;f.y=P.y+(i?80:-80);f.h=0;f.vx=f.vy=f.speed=0;});G.thrSet(1);})()");W(pg,9000)
    fm=E("(()=>{const G=__game.GRIND;return G.fleetEnts.map(f=>f.speed)})()")
    E("__game.GRIND.thrStop()");W(pg,14000)
    E("(()=>{window.__fh=__game.GRIND.fleetEnts.map(f=>({x:f.x,y:f.y}));})()");W(pg,10000)
    fh=E("(()=>{const g=__game,P=g.P;return g.GRIND.fleetEnts.map((f,i)=>({s:f.speed,d:Math.hypot(f.x-__fh[i].x,f.y-__fh[i].y),toP:Math.hypot(f.x-P.x,f.y-P.y)}))})()")
    print(fm,fh)
    chk(len(fh)==2 and min(fm)>40 and all(f['s']<3 and f['d']<20 and f['toP']<320 for f in fh),'escorts sail with her (%s kn) and hold station when she stops (moved %s px in 10s, %s px from flagship)'%([round(x) for x in fm],[round(f['d'],1) for f in fh],[round(f['toP']) for f in fh]))
    E("(()=>{"+G+"G.thrSet(0.5);P.throttle=1;})()");W(pg,2500)
    overlaps(pg,'portrait 390x844 drag mode')
    pg.screenshot(path=OUT+'throttle_portrait.png')
    E("(()=>{const g=__game;g.S.steer='buttons';document.body.classList.add('steer-btns');})()");W(pg,400);overlaps(pg,'portrait buttons mode')
    pg.screenshot(path=OUT+'throttle_portrait_buttons.png')
    E("(()=>{const g=__game;g.S.steer='drag';document.body.classList.remove('steer-btns');g.GRIND.thrSet(0.75);g.save&&g.save();})()")
    # landscape
    pg.set_viewport_size({'width':844,'height':390});W(pg,1200);overlaps(pg,'landscape 844x390 drag mode')
    pg.screenshot(path=OUT+'throttle_landscape.png')
    E("(()=>{document.body.classList.add('steer-btns');})()");W(pg,400);overlaps(pg,'landscape buttons mode');E("(()=>{document.body.classList.remove('steer-btns');})()")
    # small phone
    pg.set_viewport_size({'width':360,'height':640});W(pg,900);overlaps(pg,'small phone 360x640')
    pg.set_viewport_size({'width':640,'height':360});W(pg,900);overlaps(pg,'small landscape 640x360')
    pg.set_viewport_size({'width':390,'height':844});W(pg,600)
    # tutorial bubble pinned top-center: no overlap
    E("(()=>{const g=__game;g.tutStart(0);})()");W(pg,1200);overlaps(pg,'portrait with tutorial bubble')
    tsail=E("__game.S.sail");pg.screenshot(path=OUT+'throttle_tutorial_portrait.png')
    pg.set_viewport_size({'width':844,'height':390});W(pg,1000);overlaps(pg,'landscape with tutorial bubble');pg.screenshot(path=OUT+'throttle_tutorial_landscape.png')
    chk(tsail>=0.5,'tutorial starts with sails up (%.2f)'%tsail)
    ctx.close()
    # setting persists across reload (save)
    ctx,pg=page(b,None,'re');
    pg.evaluate("localStorage.setItem('pirateSeas_save_v1',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('pirateSeas_save_v1')||'{}'))))")
    ctx.close()
    ctx,pg=page(b,dict(OLD,sail=0.25),'sv');start(pg);sv=pg.evaluate("__game.S.sail");pg.evaluate("__game.GRIND.thrSet(0.5);");pg.evaluate("(()=>{const g=__game;g.dock(0);})()");W(pg,300)
    js=pg.evaluate("JSON.parse(localStorage.getItem('pirateSeas_save_v1')).sail");vis=pg.evaluate("document.getElementById('thr').classList.contains('hidden')")
    chk(sv==0.25 and js==0.5,'sail setting is saved and loaded (%s → saved %s)'%(sv,js))
    chk(vis,'lever hidden in port')
    ctx.close();b.close()
chk(not errs,'0 console errors %s'%errs[:5])
print('FAILS:',fails);sys.exit(1 if fails else 0)
