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
G="const g=__game,G=g.GRIND,S=g.S;"
def openTab(pg,E,m):
    E("(()=>{const g=__game;g.openMenu();})()");pg.wait_for_timeout(650);E("document.querySelector('#mTabs button[data-m=%s]').click()"%m);pg.wait_for_timeout(300)
def closeMenu(pg,E):
    E("(()=>{const b=document.getElementById('mClose');if(b)b.click();})()");pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,None,'fresh');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E(HIDE);E("(()=>{"+G+"S.clvl=25;S.gold=50000;S.tips=Object.assign(S.tips||{},{night:1,fog:1,storm:1,fish:1,dive:1,codex:1,event:1});g.enemies.length=0;G.wxSet('clear',999);S.playTime=100;g.recalc();})()")
    # event active today (real clock: 2026-10-22) and calendar window
    ev=E("(()=>{"+G+"const a=G.evActive();G.setDate('2026-11-02T23:30:00');const b=G.evActive();G.setDate('2026-11-03T00:10:00');const c=G.evActive(),n=G.evNext();G.setDate('2026-12-20T12:00:00');const d=G.evActive();G.setDate(null);return {a:a&&a.id,b:b&&b.id,c:c&&c.id,n:n&&n.id,d:d&&d.id,now:new Date().toString()};})()")
    print(ev)
    chk(ev['a']=='ghost26' and ev['b']=='ghost26' and ev['c'] is None and ev['n']=='frost26' and ev['d']=='frost26','Ghost Fleet active now through Nov 2; framework schedules Frostwake (Dec 18) next')
    # contracts
    E("(()=>{"+G+"G.setDate('2026-10-22T10:00:00');G.ctrRoll();})()")
    c=E("(()=>{"+G+"return {d:S.ctr.list.length,w:S.ctr.wl.length,dk:S.ctr.d,wk:S.ctr.w,list:S.ctr.list.map(c=>c.t+':'+c.n)};})()")
    chk(c['d']==3 and c['w']==2 and c['wk']=='W2026-10-19','3 daily + 2 weekly contracts %s'%c['list'])
    pr=E("(()=>{"+G+"const c=S.ctr.list[0];const t=G.CTPL.find(x=>x[0]===c.t);let k=0;while(c.p<c.n&&k<400){k++;if(t[2]==='sink'){const e=g.makeEnemy(c.t==='merch'?'merchant':c.t==='clan'?'clan':'navy',g.P.x+400,g.P.y,12,{forceCls:c.t==='frig'?'frigate':c.t==='gall'?'galleon':undefined,vet:c.t==='vet'?1:undefined});if(c.t==='night')S.playTime=G.DAYLEN*0.75;G.grindSunk(e);S.playTime=100;}else G.grindEv(t[2],{r:3});}const m0=G.marks();G.ctrClaim(0,false);return {p:c.p,n:c.n,c:c.c,dm:G.marks()-m0};})()")
    chk(pr['c']==1 and pr['dm']>=2,'contract progress %d/%d via real events, claimed for %d Black Marks'%(pr['p'],pr['n'],pr['dm']))
    rl=E("(()=>{"+G+"const a=JSON.stringify(S.ctr.list.map(c=>c.t));G.setDate('2026-10-23T09:00:00');G.ctrRoll();const b=S.ctr.list.every(c=>!c.c&&c.p===0);G.setDate('2026-10-22T10:00:00');return {b,d:S.ctr.d};})()")
    chk(rl['b'],'daily contracts roll over at local midnight')
    # black market
    bm=E("(()=>{"+G+"G.markGain(60,true);const m0=G.marks();G.bmBuy('helm');G.bmBuy('helm');G.bmBuy('cos:flag:blackmark');return {spent:m0-G.marks(),helm:!!S.bmb.helm,cos:!!S.cosU['flag:blackmark']};})()")
    chk(bm['spent']==43 and bm['helm'] and bm['cos'],'Black Market: one-time items, exclusive cosmetics (spent %d)'%bm['spent'])
    openTab(pg,E,'board');bt=E("document.getElementById('mBody').innerText")
    chk('Ghost Fleet' in bt and 'Daily contracts' in bt and 'Black Market' in bt and 'Frostwake' in bt,'Board tab shows event, contracts, market, next season')
    tw=E("(()=>{const t=document.getElementById('mTabs');return [t.scrollWidth,t.clientWidth]})()")
    chk(tw[0]<=tw[1]+1,'8 menu tabs fit on a 390px phone %s'%tw)
    pg.screenshot(path=OUT+'board_contracts.png')
    E("document.getElementById('mBody').scrollTop=1e5");pg.wait_for_timeout(200);pg.screenshot(path=OUT+'black_market.png')
    closeMenu(pg,E)
    # ghost spawns
    gs=E("(()=>{"+G+"S.playTime=G.DAYLEN*0.75;const w=g.HARD.waterNear(9000,9000,0,400);g.P.x=w.x;g.P.y=w.y;g.enemies.length=0;let k=0;while(!g.enemies.some(e=>e.evg)&&k<300){k++;G.evTick(6.1);}const e=g.enemies.find(e=>e.evg);return {k,n:g.enemies.filter(e=>e.evg).length,name:e&&e.name};})()")
    chk(gs['n']>=1 and gs['name']=='Ghost Fleet Wraith','ghost ships spawn during the event (%s)'%gs)
    E("(()=>{"+G+"const e=g.enemies.find(e=>e.evg);e.x=g.P.x+230;e.y=g.P.y-120;e.vx=e.vy=0;e.angry=false;e.aggro=0;})()")
    pg.wait_for_timeout(1300);pg.screenshot(path=OUT+'ghost_fleet.png')
    ls=E("(()=>{"+G+"const E=G.evActive();const s=G.evS(E);const t0=s.tot;const e=g.enemies.find(e=>e.evg);G.grindSunk(e);return {d:s.tot-t0};})()")
    chk(ls['d']>=2,'sinking a ghost at night yields %d Soul Lanterns'%ls['d'])
    ms=E("(()=>{"+G+"const E=G.evActive();const s=G.evS(E);s.tot=s.c=125;for(let i=0;i<4;i++)G.evClaim(i);return {ms:Object.keys(s.ms).length,sail:!!S.cosU['sail:wraith'],flag:!!S.cosU['flag:lantern']};})()")
    chk(ms['ms']==4 and ms['sail'] and ms['flag'],'event milestones grant exclusive Wraith sails + Lantern Skull flag')
    bs=E("(()=>{"+G+"const E=G.evActive();const s=G.evS(E);s.tot=170;g.enemies.length=0;G.evSummon(E);const o=g.enemies.find(e=>e.evb);return {hp:o&&o.maxHp,esc:g.enemies.filter(e=>e.evg).length,name:o&&o.name};})()")
    chk(bs['hp'] and bs['hp']>8000 and bs['esc']==2,'event boss %s summoned (%s HP, 2 escorts)'%(bs['name'],bs['hp']))
    E("(()=>{"+G+"const o=g.enemies.find(e=>e.evb);o.x=g.P.x+260;o.y=g.P.y+60;o.vx=o.vy=0;o.angry=false;o.aggro=0;})()")
    pg.wait_for_timeout(1300);pg.screenshot(path=OUT+'event_boss.png')
    bk=E("(()=>{"+G+"const o=g.enemies.find(e=>e.evb);const m0=G.marks();G.grindSunk(o);const E=G.evActive();return {boss:G.evS(E).boss,hull:!!S.cosU['hull:bone'],dm:G.marks()-m0,tr:!!S.evT.ghost26};})()")
    chk(bk['boss']==2 and bk['hull'] and bk['dm']==12 and bk['tr'],'sinking the Hollow Commodore: Bone-white hull, 12 Black Marks, trophy')
    ctx.close()
    # migration
    ctx,pg=page(b,dict(OLD),'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    mg=E("(()=>{const S=__game.S;return {clvl:S.clvl,gold:S.gold,marks:S.marks,ev:S.ev,n:(S.ctr.list||[]).length};})()")
    chk(mg['clvl']==60 and mg['gold']==50000 and mg['marks']==0 and mg['ev']=={} and mg['n']==3,'old save migrates (0 Marks, fresh contracts)')
    code=E("__game.makeCode()");ok=E("(c=>{try{const r=__game.parseCode(c);return r.s.clvl===60&&Array.isArray(r.s.ctr.list)}catch(e){return String(e)}})",code)
    chk(code.startswith('PSEAS1.') and ok is True,'PSEAS1 export round-trips with contracts/event state')
    ctx.close();b.close()
chk(not errs,'0 console errors %s'%errs[:5])
print('FAILS:',fails);sys.exit(1 if fails else 0)
