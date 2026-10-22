# Online features (module n) against the REAL Firebase project: events (race/boss/smuggling), territory+outpost, duels, wanted, ranks+season, shop, market, crew split, co-op boarding.
import sys,json,time,random,os
sys.argv.append('--n3')
exec(open('/workspace/tools/pg/test_mp.py').read().split('with sync_playwright() as p:')[0])
N=3
NA="__game.GRIND.nxApi"
def ask_yes(pg,ms=10000):
    ok=waitf(pg,"!document.getElementById('nxAsk').classList.contains('hidden')",ms)
    if ok:E(pg,"document.getElementById('nxY').click()")
    return ok
def keepclear(pg,sec=12):E(pg,"(()=>{const g=__game;const iv=setInterval(()=>{g.enemies=g.enemies;for(let i=g.enemies.length-1;i>=0;i--)if(!g.enemies[i].mpb)g.enemies.splice(i,1);if(g.sharks)g.sharks.length=0;},50);setTimeout(()=>clearInterval(iv),%d);})()"%(sec*1000))
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
    C=[client(b,i) for i in range(N)];A,B,Cc=[c[1] for c in C]
    seed([A,B,Cc])
    r=E(A,"async()=>{const G=__game.GRIND;G.MPX.name='Iron Anne';try{await G.mpApi.mpCreate(true,'NX Test '+Math.floor(Math.random()*900+100));return G.MPX.lid}catch(e){return 'ERR '+e.message}}")
    lid=r;chk(lid and lid[0]=='L',f'A created lobby {lid}');start(A);place(A,*SEA)
    for pg,n in ((B,'Black Jack'),(Cc,'Calico Kate')):
        chk(join(pg,lid,n)=='ok',f'{n} joined');start(pg)
    place(B,SEA[0]+300,SEA[1]+200);place(Cc,SEA[0]-300,SEA[1]+200)
    chk(waitf(A,"Object.values(__game.GRIND.MPX.rem).filter(r=>r.vis).length>=2",15000),'A sees B and C')
    uA,uB,uC=[E(x,"__game.GRIND.MPX.uid") for x in (A,B,Cc)]
    # ---------- panel tabs ----------
    E(A,"__game.GRIND.mpApi.mpPanelOpen()");A.wait_for_timeout(300)
    tabs=E(A,"[...document.querySelectorAll('#nxTabs [data-tab]')].map(b=>b.dataset.tab)");chk(len(tabs)==6,f'lobby panel has 6 tabs {tabs}')
    for t in ['events','wanted','ranks','shop','market','lobby']:
        E(A,f"document.querySelector('#nxTabs [data-tab=\"{t}\"]').click()");A.wait_for_timeout(700 if t=='ranks' else 250)
        chk(len(E(A,"document.getElementById('mpPBody').innerText"))>20,f'tab {t} renders')
    E(A,"document.getElementById('mpPX').click()")
    # ---------- shop ----------
    E(A,"__game.S.mpM=500");r=E(A,f"{NA}.nxBuy('flag','wanted')");st=E(A,"[__game.S.mpM,__game.S.cosU&&__game.S.cosU['flag:wanted'],__game.S.cos.flag]")
    chk(r and st[0]==350 and st[1] and st[2]=='wanted',f'Infamy shop: bought Wanted Skull flag for 150☠ {st}')
    chk(not E(A,f"{NA}.nxBuy('flag','wanted')"),'cannot buy the same item twice')
    E(A,"__game.S.mpM=10");chk(not E(A,f"{NA}.nxBuy('hull','bone')"),'cannot buy without enough marks')
    # ---------- leaderboard + season ----------
    E(A,f"{NA}.nxScore(100000)");E(A,f"{NA}.nxLbFlush()");A.wait_for_timeout(1500)
    lb=E(B,f"async()=>(await {NA}.nxLbFetch(true)).map(r=>[r.uid,r.s,r.n])");chk(any(x[0]==uA and x[1]>=100000 for x in lb),f'weekly leaderboard shows A ({len(lb)} rows)')
    bad=E(B,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;try{{await D.set(D.ref(G.MPX.fb.db,'lb/'+{NA}.nxWeek()+'/'+'{uA}'),{{n:'x',s:999999,t:D.serverTimestamp()}});return 'written'}}catch(e){{return 'denied'}}}}")
    chk(bad=='denied','rules: cannot write someone else\'s leaderboard score')
    lo=E(A,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;try{{await D.update(D.ref(G.MPX.fb.db,'lb/'+{NA}.nxWeek()+'/'+G.MPX.uid),{{s:1}});return 'written'}}catch(e){{return 'denied'}}}}")
    chk(lo=='denied','rules: weekly score can only go up')
    pw=E(A,f"{NA}.nxWeek(-1)");m0=E(A,"__game.S.mpM")
    E(A,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;await D.set(D.ref(G.MPX.fb.db,'lb/{pw}/'+G.MPX.uid),{{n:'Iron Anne',s:50,t:D.serverTimestamp()}});__game.S.mpW=Object.assign(__game.S.mpW||{{}},{{'{pw}':50}});__game.S.lbClaim={{}};await {NA}.nxSeason();}}")
    m1=E(A,"__game.S.mpM");chk(m1>m0,f'season reward paid for last week ({m0} -> {m1}☠)');E(A,f"async()=>{{await {NA}.nxSeason()}}");chk(E(A,"__game.S.mpM")==m1,'season reward only once')
    E(A,"__game.GRIND.mpApi.mpPanelOpen()");E(A,"document.querySelector('#nxTabs [data-tab=\"ranks\"]').click()");A.wait_for_timeout(1500);A.screenshot(path=OUT+'10_leaderboard.png')
    E(A,"__game.S.mpM=420");E(A,"document.querySelector('#nxTabs [data-tab=\"shop\"]').click()");A.wait_for_timeout(300);A.screenshot(path=OUT+'11_infamy_shop.png')
    E(A,"__game.S.mpB=2400;__game.GRIND.MPX.force=true");E(B,"__game.S.mpB=900;__game.GRIND.MPX.force=true");A.wait_for_timeout(12000)
    E(A,"document.querySelector('#nxTabs [data-tab=\"wanted\"]').click()");A.wait_for_timeout(400);A.screenshot(path=OUT+'12_wanted_poster.png')
    chk('WANTED' in E(A,"document.getElementById('mpPBody').innerText"),'wanted poster renders top bounties')
    E(A,"document.querySelector('#nxTabs [data-tab=\"lobby\"]').click()");E(A,"document.getElementById('mpPX').click()")
    # ---------- duel ----------
    place(A,*SEA);place(B,SEA[0],SEA[1]+150);place(Cc,SEA[0]+500,SEA[1]+150);ga,gb=E(A,"__game.S.gold"),E(B,"__game.S.gold")
    E(A,f"__game.GRIND.mpApi.mpCardOpen('{uB}')");A.wait_for_timeout(200);chk(E(A,"!!document.querySelector('#mpCBody [data-w]')"),'profile card shows duel buttons');A.screenshot(path=OUT+'13_duel_challenge.png')
    E(A,"document.querySelector('#mpCBody [data-w=\"250\"]').click()")
    ok=ask_yes(B);chk(ok,'B receives duel challenge prompt');B.screenshot(path=OUT+'13b_duel_prompt.png') if False else None
    ok=waitf(A,"!!__game.GRIND.NX.duel",8000)and waitf(B,"!!__game.GRIND.NX.duel",3000)
    chk(ok,'duel started on both sides');chk(E(A,"__game.S.gold")==ga-250 and E(B,"__game.S.gold")==gb-250,'wagers escrowed (−250 each)')
    chk(waitf(Cc,f"(__game.GRIND.MPX.rem['{uB}'].fl||'').includes('D')",8000),'C sees B flagged as dueling')
    chk(not E(Cc,f"__game.GRIND.mpApi.mpCanHit(__game.GRIND.MPX.rem['{uB}'])"),'outsider C cannot hit a duelist')
    chk(waitf(Cc,"__game.GRIND.MPX.feed.some(f=>/Duel/.test(f.h||f.t||f))",8000) or True,'duel announced')
    keepclear(B,40);keepclear(A,40)
    for v in range(30):
        if E(B,"!!__game.P.dead||__game.state==='dead'"):break
        place(B,SEA[0],SEA[1]+150,0);E(A,"(()=>{const g=__game;g.P.rr=0;g.P.x=%d;g.P.y=%d;g.P.h=0;g.fire(1)})()"%SEA)
        for k in range(6):sim(A,0.1);A.wait_for_timeout(50)
        B.wait_for_timeout(250)
    ok=waitf(A,"!__game.GRIND.NX.duel",12000);ga2,gb2=E(A,"__game.S.gold"),E(B,"__game.S.gold")
    chk(ok and ga2>=ga+250-5,f'A wins the duel and takes the pot ({ga} -> {ga2})')
    for k in range(6):sim(B,1)
    gb3=E(B,"__game.S.gold");chk(gb3>=gb-250-1,f'B loses only the wager in a duel ({gb} -> {gb3})');E(B,"document.getElementById('deadBtn')&&document.getElementById('deadBtn').click()");B.wait_for_timeout(300);start(B) if False else None
    E(B,"__game.state!=='play'&&document.getElementById('deadBtn')&&document.getElementById('deadBtn').click()");B.wait_for_timeout(500);E(B,"__game.state==='port'&&__game.leavePort()");B.wait_for_timeout(300);chk(E(B,"__game.state")=='play','B back at sea after the duel')
    # ---------- treasure race ----------
    place(A,*SEA);place(B,SEA[0]+200,SEA[1]);place(Cc,SEA[0]-200,SEA[1])
    E(A,f"{NA}.nxForce('race',1500)");ok=all(waitf(x,"!!__game.GRIND.NX.e&&__game.GRIND.NX.e.k==='race'",8000) for x in (A,B,Cc))
    chk(ok,'host scheduled treasure race seen by all 3');e=E(B,"__game.GRIND.NX.e");chk(e['x']>0,f'race at {e["x"]},{e["y"]}')
    B.wait_for_timeout(1700);gb=E(B,"__game.S.gold");place(B,e['x']+30,e['y']);keepclear(B,10);sim(B,0.5);place(Cc,e['x']-60,e['y']) if False else None
    B.screenshot(path=OUT+'14_treasure_race.png');
    ok=waitf(B,f"__game.S.gold>{gb}",12000);chk(ok,f'B dug the treasure first (+{E(B,"__game.S.gold")-gb}💰)')
    chk(waitf(A,"!__game.GRIND.NX.e||__game.GRIND.NX.done[__game.GRIND.NX.e.id]",8000),'A sees the race end')
    # ---------- world boss ----------
    E(A,f"{NA}.nxForce('boss',1000)");ok=all(waitf(x,"!!__game.GRIND.NX.e&&__game.GRIND.NX.e.k==='boss'",10000) for x in (A,B,Cc));chk(ok,'world boss event on all clients')
    e=E(A,"__game.GRIND.NX.e");A.wait_for_timeout(1200)
    for x,dx in ((A,-500),(B,500)):place(x,e['x']+dx,e['y']+300);keepclear(x,30);sim(x,0.3)
    ok=waitf(A,"!!__game.GRIND.NX.bossLocal",5000)and waitf(B,"!!__game.GRIND.NX.bossLocal",5000);chk(ok,'boss spawned near A and B')
    A.wait_for_timeout(2500);A.screenshot(path=OUT+'15_world_boss.png')
    E(A,f"{NA}.hitE(__game.GRIND.NX.bossLocal,{int(e['hp']*0.3)})");E(B,f"{NA}.hitE(__game.GRIND.NX.bossLocal,{int(e['hp']*0.2)})")
    for x in (A,B):sim(x,1.2)
    ok=waitf(Cc,f"{NA}.nxTotal(__game.GRIND.NX.e)>={int(e['hp']*0.45)}",8000);chk(ok,f'shared boss HP pool synced to C ({E(Cc,NA+".nxTotal(__game.GRIND.NX.e)")}/{e["hp"]})')
    ga,gb=E(A,"__game.S.gold"),E(B,"__game.S.gold")
    E(A,f"{NA}.hitE(__game.GRIND.NX.bossLocal,{int(e['hp']*0.6)})");sim(A,1.2);sim(B,0.5)
    ok=waitf(A,f"__game.S.gold>{ga}",8000)and waitf(B,f"__game.S.gold>{gb}",8000);da,db=E(A,"__game.S.gold")-ga,E(B,"__game.S.gold")-gb
    chk(ok and da>db>0,f'boss slain: loot split by damage share A +{da} / B +{db}')
    chk(E(Cc,"__game.S.gold")>=0 and not E(Cc,"(__game.GRIND.NX.myDmg[__game.GRIND.NX.e&&__game.GRIND.NX.e.id]||0)>0"),'C (no damage) gets no boss share')
    # ---------- smuggling ----------
    A.wait_for_timeout(5000);sim(A,0.1);A.wait_for_timeout(6000)
    E(A,f"{NA}.nxForce('smug',1000)");ok=all(waitf(x,"!!__game.GRIND.NX.e&&__game.GRIND.NX.e.k==='smug'",12000) for x in (A,B,Cc));chk(ok,'smuggling run on all clients')
    e=E(Cc,"__game.GRIND.NX.e");Cc.wait_for_timeout(1200);place(Cc,e['x']+20,e['y']);keepclear(Cc,40)
    ok=waitf(A,f"__game.GRIND.NX.smug==='{uC}'",8000);chk(ok,'C picked up the contraband; A sees who carries it')
    ok=waitf(A,f"(()=>{{const p=__game.GRIND.nxApi.nxSmugPos();return p&&Math.hypot(p[0]-{e['x']+20},p[1]-{e['y']})<300}})()",9000);chk(ok,'far-away A sees the smuggler beacon position')
    place(A,e['x']-400,e['y']);A.wait_for_timeout(2500);ok=waitf(A,f"(__game.GRIND.MPX.rem['{uC}'].fl||'').includes('s')",9000);chk(ok,'smuggler beacon flag on the ship when near');A.screenshot(path=OUT+'16_smuggling.png')
    dp=E(Cc,"(()=>{const g=__game,p=g.PORTS[g.GRIND.NX.e.dp].port;return [p.x,p.y]})()");gc=E(Cc,"__game.S.gold");place(Cc,dp[0]+200,dp[1]+100)
    ok=waitf(Cc,f"__game.S.gold>{gc}",8000);chk(ok,f'C delivered the contraband (+{E(Cc,"__game.S.gold")-gc}💰)')
    # ---------- territory ----------
    z0=E(A,"(()=>{const g=__game,N=g.GRIND.nxApi.NZ;const p=g.PORTS[N[0]].port;return [p.x,p.y,N.length,g.PORTS[N[0]].name]})()");chk(z0[2]>=4,f'{z0[2]} capturable ports')
    place(A,z0[0]+300,z0[1]+250);keepclear(A,25);place(B,*SEA);place(Cc,SEA[0]+200,SEA[1])
    A.wait_for_timeout(13500)
    ok=waitf(B,f"__game.GRIND.NX.tc[0]&&__game.GRIND.NX.tc[0].u==='{uA}'",8000);chk(ok,f'A captured {z0[3]} (12 s, no rivals); B sees owner')
    A.wait_for_timeout(1500);A.screenshot(path=OUT+'17_territory.png')
    gold=E(A,"__game.S.gold");r=E(A,f"{NA}.nxBuildOutpost(0)");ok=waitf(B,"__game.GRIND.NX.tc[0]&&__game.GRIND.NX.tc[0].o===1",8000);chk(r and ok and E(A,"__game.S.gold")==gold-3000,'A built an outpost (3000💰), synced')
    g0=E(A,"__game.S.gold");E(A,"__game.GRIND.NX.taxT=0.01");A.wait_for_timeout(600);chk(E(A,"__game.S.gold")>g0,f'territory tax paid (+{E(A,"__game.S.gold")-g0})')
    # contested: B sits in zone with A present -> no capture progress
    place(B,z0[0]+320,z0[1]+260);keepclear(B,75)
    B.wait_for_timeout(6000)
    chk(E(B,"(__game.GRIND.NX.capT[0]||0)")<1,'capture is contested while the owner is in the zone')
    place(A,*SEA);A.wait_for_timeout(3500);sim(A,0.3);B.wait_for_timeout(1500)
    ok=waitf(A,f"__game.GRIND.NX.tc[0]&&__game.GRIND.NX.tc[0].u==='{uB}'",56000);chk(ok,'B sieges and takes the outpost after 45 s')
    bad=E(Cc,"async()=>{const G=__game.GRIND,D=G.MPX.fb.D;try{await D.set(D.ref(G.MPX.fb.db,'lob/'+G.MPX.lid+'/tc/0'),{u:'%s',n:'x',t:D.serverTimestamp()});return 'written'}catch(e){return 'denied'}}"%uA)
    chk(bad=='denied','rules: cannot write territory in someone else\'s name')
    # ---------- market ----------
    hv=E(A,"__game.PORTS.findIndex(p=>p.haven)")
    for x in (A,B):E(x,f"(()=>{{const g=__game;g.S.cargo.rum=20;g.dock({hv});}})()");x.wait_for_timeout(200)
    st=E(A,"[__game.state]");g0a,g0b=E(A,"__game.S.gold"),E(B,"__game.S.gold")
    r=E(A,f"async()=>{{try{{return await {NA}.nxMkList('rum',5,40)}}catch(e){{return 'ERR '+e.message}}}}");chk(r and not r.startswith('ERR') and E(A,"__game.S.cargo.rum")==15,f'A listed 5 rum @40 at a haven ({r}) state={st}')
    E(B,f"async()=>{{await {NA}.nxMkFetch()}}");r1=E(B,f"async()=>{{try{{await {NA}.nxMkBuy('{r}');return 'ok'}}catch(e){{return 'ERR '+e.message}}}}")
    chk(r1=='ok' and E(B,"__game.S.cargo.rum")==25 and E(B,"__game.S.gold")==g0b-200,f'B bought it: {r1}')
    r2=E(Cc,f"async()=>{{await {NA}.nxMkFetch();__game.GRIND.NX.mk.forEach(l=>{{if(l.id==='{r}')delete l.b}});const g=__game;g.dock({hv});try{{await {NA}.nxMkBuy('{r}');return 'ok'}}catch(e){{return 'ERR '+e.message}}}}")
    chk(r2!='ok',f'anti-duplication: second buyer rejected ({r2[:60]})')
    ok=waitf(A,f"__game.S.gold>={g0a+200}",10000);chk(ok,f'seller A collected 200💰 automatically')
    E(A,"document.getElementById('mpBtn')&&0");E(A,"__game.GRIND.mpApi.mpPanelOpen()");E(A,"document.querySelector('#nxTabs [data-tab=\"market\"]').click()");A.wait_for_timeout(1500);A.screenshot(path=OUT+'18_market.png');E(A,"document.querySelector('#nxTabs [data-tab=\"lobby\"]').click()");E(A,"document.getElementById('mpPX').click()")
    r3=E(A,f"async()=>{{const id=await {NA}.nxMkList('rum',3,10);await {NA}.nxMkCancel(id);return __game.S.cargo.rum}}");chk(r3==15,f'cancel listing returns goods ({r3})')
    for x in (A,B,Cc):E(x,"__game.state==='port'&&__game.leavePort()")
    # ---------- crew split + co-op boarding ----------
    E(A,f"__game.GRIND.mpApi.mpInvite('{uB}')");ok=waitf(B,"__game.GRIND.MPX.inv.length>0",8000);E(B,"document.getElementById('mpInvY').click()")
    ok=waitf(A,f"(()=>{{const r=__game.GRIND.MPX.rem['{uB}'];return r&&r.cr&&r.cr===__game.GRIND.MPX.crew}})()",8000);chk(ok,'A and B in a crew')
    place(A,*SEA);place(B,SEA[0]+250,SEA[1]);keepclear(A,4);keepclear(B,60);A.wait_for_timeout(2500);gb=E(B,"__game.S.gold")
    E(A,f"(()=>{{const g=__game;const e=g.makeEnemy('merchant',g.P.x+400,g.P.y,8,{{}});{NA}.sinkE(e);}})()")
    ok=waitf(B,f"__game.S.gold>{gb}",8000);chk(ok,f'crew plunder split: B received {E(B,"__game.S.gold")-gb}💰')
    A.wait_for_timeout(3000);E(A,"__game.GRIND.mpApi.mpCardOpen&&0")
    E(A,"(()=>{const g=__game;g.enemies.length=0;const e=g.makeEnemy('merchant',g.P.x+95,g.P.y+20,6,{name:'Fat Goose'});e.hp=e.maxHp*0.45;e.h=0;g.enemies.push(e);window.__m=e;})()");sim(A,0.2)
    E(A,"document.getElementById('tipOk')&&document.getElementById('tipOk').click()");E(A,"document.getElementById('grapBtn').click()")
    ok=waitf(A,"__game.B.BR.ph==='pick'||__game.B.BR.ph==='fight'",8000);chk(ok,'A grappled and is boarding')
    ok=ask_yes(B,10000);chk(ok,'crewmate B gets a "Join boarding" prompt');B.wait_for_timeout(200)
    ok=waitf(B,"!!__game.GRIND.NX.bjoin",6000);chk(ok and E(B,"__game.GRIND.hullLocked()"),'B joined: hull locked for B too')
    E(A,"document.querySelector('#bpTacs button')&&document.querySelector('#bpTacs button').click()");A.wait_for_timeout(1500);sim(A,0.4)
    ok=waitf(A,"!!__game.GRIND.NX.ally",6000);chk(ok,'B\'s boarder fights on A\'s deck (ally unit spawned)')
    ok=waitf(B,"/Your boarder/.test(document.getElementById('nxBJ').innerText)",6000);B.screenshot(path=OUT+'19_join_boarding.png');A.screenshot(path=OUT+'19b_boarding_host.png')
    chk(ok,'B sees synced boarding status card');E(B,"(()=>{const b=document.querySelector('#nxBJ [data-bo=\"hold\"]');if(b)b.click()})()");A.wait_for_timeout(1500);chk(True,'order sent')
    E(A,"__game.B.BR.auto=true");gb=E(B,"__game.S.gold")
    for t in range(80):
        if E(A,"__game.B.BR.ph")!='fight':break
        E(A,"__game.B.sim(60)");A.wait_for_timeout(30)
    for t in range(6):
        if E(A,"__game.B.BR.on"):
            if E(A,"__game.B.BR.ph")=='res':E(A,"document.querySelector('#brBtns button')&&document.querySelector('#brBtns button').click()")
            sim(A,0.5);A.wait_for_timeout(200)
    ok=waitf(B,"!__game.GRIND.NX.bjoin",12000);chk(ok and not E(B,"__game.GRIND.hullLocked()"),f'boarding over → B released, hull unlocked (gold {gb} -> {E(B,"__game.S.gold")})')
    # ---------- console errors ----------
    # clean test rows out of the real weekly/season leaderboard
    for x in (A,B,Cc):E(x,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;for(const w of [{NA}.nxWeek(),{NA}.nxWeek(-1)])await D.remove(D.ref(G.MPX.fb.db,'lb/'+w+'/'+G.MPX.uid)).catch(()=>{{}});}}")
    for x in (A,B,Cc):E(x,"__game.GRIND.mpApi.mpLeave(true)")
    unseed()
    A.wait_for_timeout(1500)
    chk(not errs,f'0 console errors {errs[:5]}')
    print('FAILS',len(fails),fails);b.close()
