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
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,None,'fresh');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E(HIDE)
    # resource drops from sinking
    r=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;for(let i=0;i<40;i++){const e=g.makeEnemy('navy',g.P.x+300,g.P.y,5);G.grindSunk(e);}return Object.assign({},S.res);})()""")
    chk(r['wood']>10 and r['iron']>3 and r['canvas']>3,'sunk ships drop timber/iron/canvas %s'%r)
    # Fine refit
    f=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;S.gold=999999;S.clvl=20;S.res={wood:400,iron:400,canvas:400,parts:40};S.mat={iw:5,ink:5,bp:5,rel:5};g.recalc();const h0=g.ST().maxHp;
       g.dock(0);G.craftTry('hull');return {h0,h1:g.ST().maxHp,t:G.cTier('hull')};})()""")
    chk(f['t']==1 and f['h1']>f['h0'],'Fine hull refit raises HP %d→%d'%(f['h0'],f['h1']))
    # Masterwork failure burns materials
    m=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;const w0=S.res.wood,p0=S.res.parts,i0=S.mat.iw;const R=Math.random;Math.random=()=>0.99;G.craftTry('hull');Math.random=R;
       return {t:G.cTier('hull'),dw:w0-S.res.wood,dp:p0-S.res.parts,iw:i0-S.mat.iw,nx:G.craftChance('hull',2)};})()""")
    chk(m['t']==1 and m['dw']>0 and m['dp']==2 and m['iw']==0 and m['nx']>0.8,'Masterwork failure burns %d timber + %d parts, keeps ironwood, next odds %.0f%%'%(m['dw'],m['dp'],m['nx']*100))
    l=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;S.clvl=40;const R=Math.random;Math.random=()=>0.0;G.craftTry('hull');G.craftTry('hull');G.craftTry('ram');G.craftTry('ram');Math.random=R;g.recalc();
       return {t:G.cTier('hull'),ram:g.ST().ramDmg,brig:G.cTier('hull','brig')};})()""")
    chk(l['t']==3 and l['ram']==130 and l['brig']==0,'Legendary hull, ram tier 2 = %s dmg, tiers are per ship'%l['ram'])
    rm=E("""(()=>{const g=__game,G=g.GRIND;g.leavePort&&g.state==='port'&&g.leavePort();const e=g.makeEnemy('navy',g.P.x+20,g.P.y,5);e.hp=e.maxHp=5000;g.enemies.push(e);g.P.vx=g.ST().maxSpeed;g.P.vy=0;G.ramTick(0.016);return 5000-e.hp;})()""")
    chk(rm>50,'ramming at speed deals %s damage'%rm)
    pg.wait_for_timeout(300)
    E("(()=>{const g=__game;g.dock(0);g.setTab('ship');})()");pg.wait_for_timeout(500)
    E("(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('refit tiers'));h&&h.scrollIntoView();})()");pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'craft_tiers.png')
    # mastery
    ms=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;g.recalc();const s0=g.ST().maxSpeed;G.mastGain(500);g.recalc();return {l:G.mastLvl(),k:g.ST().maxSpeed/s0};})()""")
    chk(ms['l']==1,'mastery level 1 after 500 XP')
    ms=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;g.recalc();const s0=g.ST().maxSpeed;G.mastGain(1000);g.recalc();return {l:G.mastLvl(),k:g.ST().maxSpeed/s0};})()""")
    chk(ms['l']==2 and abs(ms['k']-1.06)<0.01,'sloop mastery 2 perk: +6%% speed (×%.3f)'%ms['k'])
    E("(()=>{const g=__game;g.setTab('ship');})()");pg.wait_for_timeout(300)
    E("(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('mastery'));h&&h.scrollIntoView();})()");pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'ship_mastery.png')
    # roster: rare crew only at their tavern
    rc=E("""(()=>{const g=__game,G=g.GRIND;const ti=g.PORTS.findIndex(p=>p.name==='Tortuga'),pr=g.PORTS.findIndex(p=>p.name==='Port Royal');return {t:G.recruitsAt(ti).some(c=>c.id==='ines'),o:G.recruitsAt(pr).some(c=>c.id==='ines'),ti};})()""")
    chk(rc['t'] and not rc['o'],'rare crew One-Eyed Ines is only at Tortuga')
    gh=E("""(ti=>{const g=__game,G=g.GRIND,S=g.S;g.dock(ti);g.recalc();const d0=g.ST().dmg;G.crewHire(ti,'ines');const n1=S.roster.length;const recs=G.recruitsAt(ti).filter(c=>!c.rare);G.crewHire(ti,recs[0].id);
       const names=G.recruitsAt(ti).map(c=>c.n);return {n:S.roster.length,n1,d0,d1:g.ST().dmg,dup:names.includes(S.roster[1].n)&&false};})""",rc['ti'])
    chk(gh['n1']==1 and gh['n']==2 and gh['d1']>gh['d0'],'hired Ines + a tavern recruit; gunner raises damage %.2f→%.2f'%(gh['d0'],gh['d1']))
    st=E("""(ti=>{const g=__game,G=g.GRIND,S=g.S;const b=G.recruitsAt(ti).length;const before=JSON.stringify(G.recruitsAt(ti).map(c=>c.n));return {b,before};})""",rc['ti'])
    lv=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;const l0=S.roster[0].l;G.crewXP(3000);return {l0,l1:S.roster[0].l};})()""")
    chk(lv['l1']>lv['l0'],'crew level up from XP %d→%d'%(lv['l0'],lv['l1']))
    E("(()=>{const g=__game;g.setTab('crew');})()");pg.wait_for_timeout(300)
    E("(()=>{const h=[...document.querySelectorAll('h3')].find(x=>x.textContent.includes('Named crew'));h&&h.scrollIntoView();})()");pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+'crew_roster.png')
    hu=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;for(let i=0;i<4;i++)S.roster.push({id:90+i,n:'Test '+i,r:'gunner',tr:'drunk',l:1,xp:0,inj:0,rare:0});const n0=S.roster.length;let grave=0,inj=0,lost=0;
       for(let k=0;k<60&&!(grave&&inj);k++){S.roster.forEach(m=>{m.inj=0;m.grave=0;});const before=S.roster.length;G.crewHurt(true);lost+=before-S.roster.length;grave+=S.roster.filter(m=>m.grave).length;inj+=S.roster.filter(m=>m.inj>0&&!m.grave).length;}
       const gm=S.roster.find(m=>m.grave);return {grave,inj,lost,mins:gm?Math.round((gm.inj-S.playTime)/60):0};})()""")
    chk(hu['grave']>0 and hu['inj']>0 and hu['lost']==0,'sinkings gravely wound (%d, ~%d min) or wound (%d) crew — nobody is lost'%(hu['grave'],hu['mins'],hu['inj']))
    wg=E("""(()=>{const g=__game,G=g.GRIND,S=g.S;g.leavePort();S.infamy=Math.max(S.infamy,99999);S.roster.forEach(m=>m.inj=0);const c0=S.upk.crew;G.grindTick(60);return S.upk.crew-c0;})()""")
    chk(wg>5,'named crew wages flow into upkeep (+%.1f/min)'%wg)
    ctx.close()
    # old save migration
    old=dict(OLD);ctx,pg=page(b,old,'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    mg=E("(()=>{const S=__game.S;return {clvl:S.clvl,ship:S.ship,gold:S.gold,res:S.res,craft:S.craft,roster:S.roster,mast:S.mast,hp:__game.ST().maxHp};})()")
    print(mg);chk(mg["clvl"]==60 and mg["ship"]=="galleon" and mg["gold"]==50000 and mg["res"]=={'wood':0,'iron':0,'canvas':0,'parts':0} and mg['roster']==[] and mg['mast']['sloop']==0,'old maxed save migrates with new defaults')
    code=E("__game.makeCode()");ok=E("(c=>{try{const r=__game.parseCode(c);return r.s.clvl===60&&!!r.s.res&&Array.isArray(r.s.roster)}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and ok is True,'PSEAS1 export round-trips with grind fields')
    ctx.close();b.close()
chk(not errs,'0 console errors %s'%errs[:5])
print('FAILS:',fails);sys.exit(1 if fails else 0)
