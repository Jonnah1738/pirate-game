import json,sys,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OUT='/workspace/pirate-game/screenshots-fleet/'+('live_' if LIVE else '')
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
G="const g=__game,G=g.GRIND,S=g.S;"
OLDF=dict(OLD);OLDF.update({"up":dict(OLD["up"],command=3),"fleet":[{"id":2,"name":"Salty Dog","type":"sloop","lvl":1,"maxHp":90,"hp":60,"cannons":2,"dmg":6,"wage":6,"unpaid":0},{"id":3,"name":"Fat Goose","type":"prize","lvl":9,"maxHp":300,"hp":300,"cannons":4,"dmg":14.8,"wage":12,"unpaid":0}],"fid":3,
  "roster":[{"id":1,"n":"Ines","r":"gunner","tr":"steady","l":5,"xp":0,"inj":0,"rare":"ines"}],"rid":1})
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    # old save with a fleet migrates
    ctx,pg=page(b,OLDF,'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E(HIDE)
    m=E("(()=>{"+G+"return S.fleet.map(d=>({n:d.name,hp:d.hp,mx:d.maxHp,b:d.b,fu:d.fu,can:d.cannons,dmg:d.dmg}));})()")
    print(m)
    chk(len(m)==2 and m[0]['mx']==90 and m[0]['hp']==60 and m[1]['mx']==300 and m[1]['dmg']==14.8 and m[0]['b']['hp']==90,'old fleet migrates: stats and damage kept, upgrade fields defaulted')
    code=E("__game.makeCode()");ok=E("(c=>{try{const r=__game.parseCode(c);return r.s.fleet.length===2&&!!r.s.fleet[0].fu}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and ok is True,'PSEAS1 round-trips fleet upgrades')
    # upgrades
    up=E("""(()=>{"""+G+"""S.gold=500000;S.clvl=40;S.res={wood:500,iron:500,canvas:500,parts:60};S.mat={iw:9,ink:9,bp:9,rel:9};g.dock(0);const d=S.fleet[0];const h0=d.maxHp,c0=d.cannons,d0=d.dmg,s0=G.fSpd(d);const g0=S.gold;
      for(let i=0;i<5;i++){G.fUpgrade(d.id,'hull');G.fUpgrade(d.id,'guns');G.fUpgrade(d.id,'sails');}return {h0,h1:d.maxHp,c0,c1:d.cannons,d0,d1:d.dmg,s0,s1:G.fSpd(d),spent:g0-S.gold,fu:d.fu};})()""")
    print(up)
    chk(up['h1']==round(90*1.6) and up['c1']==up['c0']+2 and abs(up['d1']-6*1.4)<0.05 and abs(up['s1']/up['s0']-1.15)<0.01,'Lv5 hull/guns/sails: HP %d→%d, guns %d→%d, dmg %.1f→%.1f, speed +15%% (%d💰)'%(up['h0'],up['h1'],up['c0'],up['c1'],up['d0'],up['d1'],up['spent']))
    rf=E("(()=>{"+G+"const d=S.fleet[1];const R=Math.random;Math.random=()=>0.99;G.fRefit(d.id,'hull');const f1=d.ft.hull;G.fRefit(d.id,'hull');const fpA=d.fp.hull,fA=d.ft.hull;Math.random=()=>0;G.fRefit(d.id,'hull');const f2=d.ft.hull;G.fRefit(d.id,'hull');Math.random=R;return {f1,fA,fpA,f2,ft:d.ft.hull,h1:d.maxHp};})()")
    print(rf)
    chk(rf['f1']==1 and rf['fA']==1 and rf['fpA']==1 and rf['f2']==2 and rf['ft']==3 and rf['h1']==round(300*1.26),'fleet refit tiers: Fine always lands, Masterwork can fail (pity), Legendary hull 300→%d HP'%rf['h1'])
    E("(()=>{const g=__game;g.setTab('fleet');})()");pg.wait_for_timeout(400);pg.screenshot(path=OUT+'fleet_screen.png')
    E("(()=>{const S=__game.S;S.fleet[1].fu.guns=2;__game.GRIND.fRecalc(S.fleet[1]);__game.setTab('fleet');})()");pg.wait_for_timeout(200)
    pg.locator('#pBody button[data-act=fsel][data-arg="%d"]'%E("__game.S.fleet[1].id")).tap();pg.wait_for_timeout(400)
    E("(()=>{const h=[...document.querySelectorAll('#pBody .item')].find(x=>x.innerText.includes('Fat Goose'));h&&h.scrollIntoView();})()");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'fleet_upgrades.png')
    E("(()=>{__game.GRIND&&0;})()")
    # veterancy
    vt=E("(()=>{"+G+"g.leavePort();g.P.hp=g.ST().maxHp;const ents=G.fleetEnts;ents.forEach(f=>{f.x=g.P.x+60;f.y=g.P.y+60;});const d=S.fleet[0];const d0=d.dmg;let k=0;while(G.fvl(d)<2&&k<200){k++;G.grindSunk(g.makeEnemy('pirate',g.P.x+300,g.P.y,10));}return {k,v:G.fvl(d),name:G.VN[G.fvl(d)],d0,d1:d.dmg,fx:d.fx};})()")
    chk(vt['v']==2 and vt['d1']>vt['d0'],'fleet veterancy: %d sinks nearby → %s, dmg %.1f→%.1f'%(vt['k'],vt['name'],vt['d0'],vt['d1']))
    # sinking -> lay-up, not lost
    E("(()=>{"+G+"const f=G.fleetEnts.find(f=>f.d===S.fleet[0]);G.damageFleet(f,f.d.hp+5);})()")
    pg.wait_for_timeout(3000)
    lay=E("(()=>{"+G+"const d=S.fleet[0];return {n:S.fleet.length,rep:G.fRep(d),mins:(d.rep-Date.now())/60000,ents:G.fleetEnts.filter(f=>!f.sinking).length,hp:d.hp,min:G.fRepMin(d)};})()")
    print(lay)
    chk(lay['n']==2 and lay['rep'] and 5<=lay['min']<=10 and lay['ents']==1,'sunk fleet ship is laid up (%.1f min), stays in the fleet, not sailing'%lay['mins'])
    E("(()=>{const g=__game;g.dock(0);g.setTab('fleet');})()");pg.wait_for_timeout(1300)
    t1=E("document.querySelector('[data-frep]').textContent");pg.wait_for_timeout(2100);t2=E("document.querySelector('[data-frep]').textContent")
    chk(t1!=t2,'Fleet screen countdown ticks (%s → %s)'%(t1,t2))
    pg.screenshot(path=OUT+'fleet_under_repair.png')
    ru=E("(()=>{"+G+"const d=S.fleet[0];const c=G.fRushCost(d);const g0=S.gold,w0=S.res.wood;G.fRush(d.id);return {c,paid:g0-S.gold,wood:w0-S.res.wood,rep:G.fRep(d),hp:d.hp,mx:d.maxHp};})()")
    chk(not ru['rep'] and ru['hp']==ru['mx'] and ru['paid']>0 and ru['wood']>0,'rush repair: %d💰 + %s → back at full hull'%(ru['paid'],ru['c']['res']))
    # natural expiry
    ex=E("(()=>{"+G+"const d=S.fleet[1];G.fleetLayUp(d);d.rep=Date.now()-5;G.fleetTickD();return {rep:G.fRep(d),hp:d.hp,mx:d.maxHp,r:d.rep};})()")
    chk(not ex['rep'] and ex['hp']==ex['mx'] and ex['r']==0,'repair timer expiry returns the ship at full hull')
    # crew grave wound
    cg=E("(()=>{"+G+"g.leavePort();const m=S.roster[0];m.tr='steady';const R=Math.random;Math.random=()=>0.01;G.crewHurt(true);Math.random=R;return {n:S.roster.length,grave:m.grave,min:Math.round((m.inj-S.playTime)/60)};})()")
    chk(cg['n']==1 and cg['grave']==1 and cg['min']>=20,'crew "death" is now a grave wound (%d min), roster intact'%cg['min'])
    cs=E("(()=>{"+G+"const m=S.roster[0];m.inj=0;m.grave=0;S.roster.push({id:9,n:'Doc',r:'surgeon',tr:'steady',l:6,xp:0,inj:0,rare:0});const R=Math.random;Math.random=()=>0.01;G.crewHurt(true);Math.random=R;return Math.round((m.inj-S.playTime)/60);})()")
    chk(cs<cg['min'],'surgeon shortens grave wounds (%d → %d min)'%(cg['min'],cs))
    hl=E("(()=>{"+G+"const m=S.roster[0];m.inj=S.playTime-1;G.grindTick(2.1);return {inj:m.inj,grave:m.grave};})()")
    chk(hl['inj']==0 and hl['grave']==0,'gravely wounded crew recover')
    E("(()=>{"+G+"g.dock(0);g.setTab('crew');S.roster[0].inj=S.playTime+1200;S.roster[0].grave=1;g.setTab('crew');})()");pg.wait_for_timeout(300)
    E("(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('Named crew'));h&&h.scrollIntoView();})()");pg.wait_for_timeout(300)
    rt=E("document.getElementById('pBody').innerText")
    chk('gravely wounded' in rt and 'killed' not in rt,'roster text: grave wounds, no permanent death')
    pg.screenshot(path=OUT+'crew_grave_wound.png')
    ctx.close();b.close()
chk(not errs,'0 console errors %s'%errs[:5])
print('FAILS:',fails);sys.exit(1 if fails else 0)
