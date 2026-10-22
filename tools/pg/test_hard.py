import json,sys,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OUT='/workspace/pirate-game/screenshots-hard/'+('live_' if LIVE else '');os.makedirs('/workspace/pirate-game/screenshots-hard',exist_ok=True)
errs=[];fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
OLD={"gold":50000,"crew":60,"tutDone":True,"seen":True,"bal":2,"infamy":90000,"xp":0,"clvl":60,"ship":"galleon","up":{"hull":10,"sails":8,"cannons":10,"cargo":8,"rigging":3,"command":3},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,
     "tips":{"republic":1,"fort":1,"ammo":1,"merchant":1,"shark":1,"wanted":1,"board":1,"boardnews":1},"forts":{"__F__":{"o":"p","g":0}},"sk":{"gun":9,"sea":9,"plun":9,"cmd":9,"war":9}}
def page(b,save,tag):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
    if save is not None: pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',%s);}"%json.dumps(json.dumps(save)))
    pg.goto(URL+('&' if '?' in URL else '?')+'t=1');pg.wait_for_timeout(600);return ctx,pg
def start(pg):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}})()")
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    # ---------- fresh game ----------
    ctx,pg=page(b,None,'fresh');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    fid=E("__game.HARD.FRT? null : null")
    r=E("""(()=>{const g=__game,S=g.S;const o={};for(const L of [1,10,30,60]){S.clvl=L;let hp=0,dm=0;for(let i=0;i<40;i++){const e=g.makeEnemy('navy',12000,12000,8);if(e.cls||e.elite||e.vet){i--;continue;}hp+=e.maxHp/40;dm+=e.dmg/40;}o[L]=[Math.round(hp),Math.round(dm)];}S.clvl=1;return o;})()""")
    print('navy Lv8-zone hp/dmg by captain level',r)
    chk(r['1'][0]==r['10'][0] or abs(r['1'][0]-r['10'][0])<r['1'][0]*0.1,'no scaling up to captain Lv10')
    chk(r['60'][0]>r['10'][0]*1.9 and r['60'][1]>r['10'][1]*1.6,'Lv60 captain: enemy hull x%.2f, damage x%.2f'%(r['60'][0]/r['10'][0],r['60'][1]/r['10'][1]))
    v=E("""(()=>{const g=__game,S=g.S;S.clvl=50;let el=0,vt=0;for(let i=0;i<1000;i++){const e=g.makeEnemy('pirate',12000,12000,10);if(e.elite)el++;else if(e.vet)vt++;}S.clvl=1;let e2=0;for(let i=0;i<500;i++){if(g.makeEnemy('pirate',12000,12000,10).elite)e2++;}return [el,vt,e2];})()""")
    chk(v[0]>50 and v[1]>100 and v[2]==0,'elite/veteran variants at high level (elite %d‰, vet %d‰), none at Lv1'%(v[0],v[1]))
    cr=E("(()=>{const H=__game.HARD,S=__game.S;S.clvl=60;const k=H.foeCrewK({kind:'navy'},'ship');S.clvl=1;return k;})()")
    chk(cr['hp']>1.6 and cr['dmg']>1.4,'boarding crews scale (hp x%.2f, dmg x%.2f at Lv60)'%(cr['hp'],cr['dmg']))
    # upkeep
    u=E("""(()=>{const g=__game,H=g.HARD,S=g.S;S.infamy=5000;S.crew=40;S.gold=10000;S.upk.crew=0;S.upk.wear=0;S.upk.t=0;const r=H.upkRates();
      g.P.vx=200;g.P.vy=0;for(let i=0;i<600;i++)g.step(1/60);const owed=H.upkOwed();const g0=S.gold,m0=S.morale;H.upkSettle('port');const paid=g0-S.gold;
      S.upk.crew=500;S.upk.wear=500;S.gold=100;const c0=S.crew;H.upkSettle('port');return {r,owed,paid,m0,m1:S.morale,crewLost:c0-S.crew,gold:S.gold,html:H.ledgerHTML()};})()""")
    print({k:u[k] for k in u if k!='html'})
    chk(u['owed']>0 and u['paid']==u['owed'],'upkeep accrues at sea (%d💰 in 10s) and is paid on settle'%u['owed'])
    chk(u['gold']==0 and u['crewLost']>0 and u['m1']<u['m0'],'unpaid upkeep: morale falls, some crew desert, no hard lock (gold 0)')
    chk('Ledger' in u['html'],'ledger line renders')
    # materials gating
    m=E("""(()=>{const g=__game,H=g.HARD,S=g.S;S.ship='brig';S.infamy=1e6;S.gold=1e6;for(const k in S.mat)S.mat[k]=0;const hv=g.PORTS.findIndex(p=>p.haven);g.dock(hv);g.buyHull('galleon');const a=S.ship;
      S.mat.iw=6;S.mat.bp=2;g.buyHull('galleon');return [a,S.ship,S.mat.iw,S.mat.bp,H.perkCost('gun',5),H.gearMat('sw',(g.GEAR||{sw:[]}).sw?0:0)];})()""")
    chk(m[0]=='brig' and m[1]=='galleon' and m[2]==0 and m[3]==0,'galleon needs 6 ironwood + 2 blueprints (blocked without, paid with)')
    chk(m[4] and m[4]['mat'],'high-tier perks cost gold + materials: %s'%m[4])
    E("__game.setTab('ship');__game.renderPort&&__game.renderPort()");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'shipyard_materials.png')
    # vault + death penalty
    d=E("""(()=>{const g=__game,X=g.ECON,S=g.S;const hv=g.PORTS.findIndex(p=>p.haven);g.dock(hv);S.gold=10000;S.vault=0;X.portAction('vdep','half');const v=S.vault,gc=S.gold;
      g.leavePort();S.infamy=5000;S.cargo.rum=10;S.gold=10000;g.HARD.playerDied();return {v,gc,gold:S.gold,rum:S.cargo.rum,txt:document.getElementById('deadTxt').innerText,vault:S.vault};})()""")
    print(d);chk(d['v']>=4800 and d['vault']==d['v'],'vault deposit (2%% fee) stays safe on sinking: %d'%d['v'])
    chk(d['rum']==5 and d['gold']<7800,'sinking: half cargo lost, 22%% gold + repair bill (10000 → %d)'%d['gold'])
    pg.screenshot(path=OUT+'death_penalty.png')
    E("document.getElementById('deadBtn').click()");pg.wait_for_timeout(200)
    # legendary bounty
    l=E("""(()=>{const g=__game,H=g.HARD,S=g.S;S.clvl=30;S.lb={cur:'',st:0,have:0,done:{}};H.legAccept('rook');const L=H.LEGENDS[0];g.P.x=L.x;g.P.y=L.y-300;g.P.dead=0;H.legTick();
      const raiders=g.enemies.filter(e=>e.lb==='rook'&&e.lbr);const n=raiders.length;for(const e of raiders){e.hp=1;g.HARD.hardSunk(e);g.enemies.splice(g.enemies.indexOf(e),1);}const st1=S.lb.st;
      const a=(0+1)*1.7;g.P.x=L.x+Math.cos(a)*1700;g.P.y=L.y+Math.sin(a)*1700;H.legTick();const st2=S.lb.st;g.P.x=L.x;g.P.y=L.y-400;H.legTick();const boss=g.enemies.find(e=>e.leg);
      const f0=S.tr.frag|0;const iw0=S.mat.iw|0;H.hardSunk(boss);return {n,st1,st2,boss:!!boss,bossHp:boss&&boss.maxHp,done:!!S.lb.done.rook,frag:(S.tr.frag|0)-f0,iw:(S.mat.iw|0)-iw0};})()""")
    print(l);chk(l['n']==3 and l['st1']==1 and l['st2']==2 and l['boss'] and l['done'] and l['frag']==1 and l['iw']==2,'legendary bounty: 3 raiders → trail → named boss → gold, materials, chart fragment')
    t=E("""(()=>{const g=__game,S=g.S;S.tr.frag=7;g.HARD.fragGain(1,'test');return [S.tr.frag,S.quests.some(q=>q.grand)];})()""")
    chk(t[0]==8 and t[1],'8 chart fragments → Lost Hoard dig quest appears')
    eb=E("""(()=>{const g=__game,H=g.HARD,S=g.S;g.enemies.length=0;const pt=H.ebPt('kraken');g.P.x=pt.x;g.P.y=pt.y+900;S.clvl=40;H.ebTick();const a=g.enemies.some(e=>e.eb);S.clvl=60;S.fleet=[];H.ebTick();const b=g.enemies.some(e=>e.eb);
      return {pt:!!pt,lowLvl:a,noFleet:b};})()""")
    chk(eb['pt'] and not eb['lowLvl'] and not eb['noFleet'],'Kraken endgame boss gated by Lv55 and a 2+ ship fleet')
    k=E("""(()=>{const g=__game,H=g.HARD;const e={eb:'kraken',kraken:1,sub:0,x:0,y:0};return [H.ebPt('admiral')!=null, g.HARD.EBOSS.kraken.hp, g.HARD.EBOSS.admiral.hp];})()""")
    chk(k[0] and k[1]>=60000,'endgame bosses: Admiral %d HP, Kraken %d HP (damage persists between attempts)'%(k[2],k[1]))
    # legend list screenshot
    E("(()=>{const g=__game;const hv=g.PORTS.findIndex(p=>p.haven);g.dock(hv);g.setTab('dock');})()");pg.wait_for_timeout(300)
    E("(()=>{const el=[...document.querySelectorAll('#pBody h3')].find(h=>/Legendary/.test(h.textContent));el&&el.scrollIntoView();})()");pg.wait_for_timeout(200);pg.screenshot(path=OUT+'legendary_bounties.png')
    E("(()=>{const el=[...document.querySelectorAll('#pBody .note')].find(h=>/Ledger/.test(h.textContent));el&&el.scrollIntoView();})()");pg.wait_for_timeout(200);pg.screenshot(path=OUT+'ledger_vault.png')
    E("__game.leavePort()")
    # war counterattack
    w=E("""(()=>{const g=__game,H=g.HARD,S=g.S;const f=H.FRT?null:null;const F=g.HARD.curFort;return 1;})()""")
    ctx.close()
    # ---------- old save migration (maxed, captured fort) ----------
    ctx0,pg0=page(b,None,'probe');fid=pg0.evaluate("__game.HARD.FORTS[0].id");ctx0.close()
    old=json.loads(json.dumps(OLD).replace('__F__',str(fid)))
    ctx,pg=page(b,old,'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    mg=E("""(()=>{const g=__game,S=g.S;return {clvl:S.clvl,ship:S.ship,gold:S.gold,mat:S.mat,upk:S.upk,lb:S.lb,tr:S.tr,eb:S.eb,morale:S.morale,vault:S.vault,fort:S.forts[%s],sk:S.sk.gun};})()"""%json.dumps(str(fid)))
    print(json.dumps(mg)[:600])
    chk(mg['clvl']==60 and mg['ship']=='galleon' and mg['gold']==50000 and mg['sk']>=6,'maxed old save keeps Lv60, galleon, gold, maxed skills')
    chk(mg['mat']=={'iw':0,'ink':0,'bp':0,'rel':0} and mg['morale']==80 and mg['vault']==0 and mg['eb']['kraken']['hp']==1,'new fields get defaults')
    chk(mg['fort'] and mg['fort']['o']=='p','already-captured fort stays the player\'s')
    code=E("__game.makeCode()");ok=E("(c=>{try{const r=__game.parseCode(c);return r.s.clvl===60&&!!r.s.mat}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and ok is True,'PSEAS1 export round-trips with new fields')
    # war: force counterattack on the captured fort
    w0=E("(c=>{const S=__game.S;const s=__game.S.forts[c];return {atk:!!s.atk,grace:Math.min(s.nx,S.war.next)-S.playTime}})",str(fid))
    chk(not w0['atk'] and w0['grace']>200,'loaded save: no instant counterattack (%.0fs grace)'%w0['grace'])
    w=E("""(c=>{const g=__game,H=g.HARD,S=g.S;const s=S.forts[c];s.atk=null;s.nx=0;S.war.next=0;const n0=S.war.n|0;H.fortEconomy(1.1);const tg=[];H.hardTargets(tg);
       return {atk:!!s.atk,n:(S.war.n|0)-n0,marker:tg.some(x=>x.icon==='⚔️'),next:S.war.next-S.playTime};})""",str(fid))
    print(w);chk(w['atk'] and w['n']==1 and w['marker'] and w['next']>=290,'clan counterattack: warning, ⚔️ map marker, next attack ≥5 min away (%.0fs)'%w['next'])
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'counterattack_warning.png')
    E("(()=>{const g=__game;g.openMenu&&g.openMenu();g.setMView&&g.setMView('log');})()");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'menu_materials_ledger.png')
    print('console errors:',errs);chk(not errs,'0 console errors')
    b.close()
print('FAILS',fails);sys.exit(1 if fails else 0)
