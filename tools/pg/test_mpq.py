# AI captains (module q) against the REAL Firebase project: 4 host-run bots per lobby, sync, combat both ways,
# bounties/kill feed, protections (newbie + haven), bot-vs-bot, boarding flag, profile card marker, counts, host migration, boss contest.
import sys,json,time,random,os
os.environ['BOTS']='1'
exec(open('/workspace/tools/pg/test_mp.py').read().split('with sync_playwright() as p:')[0])
G="__game.GRIND"
def sim_of(pg):return E(pg,G+".qbTest.sim()")
def hp(pg):return E(pg,"__game.P.hp")
def uid(pg):return E(pg,G+".MPX.uid")
def bots(pg):return E(pg,"Object.values(__game.GRIND.MPX.rem).filter(r=>r.bot).map(r=>({id:r.uid,n:r.n,l:r.l,hull:r.hull,c:r.c,vis:r.vis,x:r.x|0,y:r.y|0,fl:r.fl,hp:r.hpP,tg:r.tg}))")
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
    C=[client(b,i) for i in range(3)];A,B,Cc=[c[1] for c in C]
    seed([A,B],12);seed([Cc],3)
    lid=E(A,"async()=>{const G=__game.GRIND;G.MPX.name='Iron Anne';try{await G.mpApi.mpCreate(true,'Bot Test '+Math.floor(Math.random()*900+100));return G.MPX.lid}catch(e){return 'ERR '+e.message}}")
    chk(lid and lid[0]=='L',f'A created lobby {lid}');start(A,12);place(A,*SEA)
    ok=waitf(A,"__game.GRIND.QB.sim&&Object.values(__game.GRIND.MPX.rem).filter(r=>r.bot&&r.vis).length===4",15000)
    chk(ok,'host A runs 4 AI captains (visible as ships)')
    for i in range(4):E(A,f"{G}.qbTest.freeze({i},1)")
    S0=sim_of(A);print(json.dumps(S0))
    chk(all(9<=s['l']<=15 for s in S0),f"bot levels near lobby average Lv12: {[s['l'] for s in S0]}")
    chk(len(set(s['n'] for s in S0))==4 and all(len(s['n'])>=3 for s in S0),f"pirate names {[s['n'] for s in S0]}")
    chk(len(set(s['c'] for s in S0))>=2,f"varied cosmetics/hulls {[(s['hull'],s['c']) for s in S0]}")
    waitf(A,"document.getElementById('mpInfo').innerText.includes('+4 bots')",3000);pill=E(A,"document.getElementById('mpInfo').innerText");chk('1/20 +4 bots' in pill,f'pill shows humans/20 + bots: {pill[:60]!r}')
    # lobby browser on B (before joining)
    B.tap('#mpBtn');waitf(B,"document.querySelector('#mpList .mpLob')",20000);B.wait_for_timeout(500)
    row=E(B,f"(()=>{{const e=document.querySelector('#mpList .mpLob[data-lid=\"{lid}\"]');return e?e.innerText:''}})()")
    chk('1/20' in row and '+4 bots' in row,f'lobby list row: {row!r}');B.screenshot(path=OUT+'q1_lobby_list.png');E(B,"document.getElementById('mpLX').click()")
    for pg,n,l in ((B,'Black Jack',12),(Cc,'Calico Kate',3)):chk(join(pg,lid,n)=='ok',f'{n} joined');start(pg,l)
    place(B,SEA[0]+900,SEA[1]+900)
    ok=waitf(B,"Object.values(__game.GRIND.MPX.rem).filter(r=>r.bot&&r.n&&r.n!=='…').length===4",12000);chk(ok,'joiner B receives the 4 bot profiles')
    nb=sorted(x['n'] for x in bots(B));chk(nb==sorted(s['n'] for s in S0),f'B sees same bot captains {nb}')
    uA,uB,uC=uid(A),uid(B),uid(Cc)
    # ---------- bot attacks host A ----------
    E(A,f"{G}.qbTest.place(0,{SEA[0]+250},{SEA[1]},-Math.PI/2)");E(A,f"{G}.qbTest.tg(0,'{uA}')");E(A,f"{G}.qbTest.freeze(0,0)")
    h0=hp(A);ok=waitf(A,f"__game.P.hp<{h0}-1",20000);chk(ok,f'bot fires on host captain A: hp {h0:.0f} -> {hp(A):.0f}')
    lh=E(A,G+".MPX.lastHit&&__game.GRIND.MPX.lastHit.a");chk(lh=='B0','A last hit by B0')
    E(A,f"{G}.qbTest.freeze(0,1)");E(A,f"{G}.qbTest.place(0,{SEA[0]+5000},{SEA[1]+5000})");E(A,"__game.P.hp=__game.ST().maxHp")
    # ---------- bot attacks non-host B (normalized, rate capped) ----------
    bx,by=E(B,"[__game.P.x,__game.P.y]")
    E(A,f"{G}.qbTest.place(1,{bx+250},{by},-Math.PI/2)");E(A,f"{G}.qbTest.tg(1,'{uB}')");E(A,f"{G}.qbTest.freeze(1,0)")
    ok=waitf(B,"Object.values(__game.GRIND.MPX.rem).some(r=>r.uid==='B1'&&r.vis&&Math.hypot(r.x-__game.P.x,r.y-__game.P.y)<700)",10000);chk(ok,'B sees bot B1 alongside')
    E(B,"(()=>{const P=__game.P;window.__hl=[];let last=P.hp;setInterval(()=>{const d=last-P.hp;if(d>0)__hl.push([performance.now(),d/__game.ST().maxHp]);last=P.hp;},50);})()")
    h0=hp(B);ok=waitf(B,f"__game.P.hp<{h0}-1",20000);chk(ok,f'bot fires on joiner B: hp {h0:.0f} -> {hp(B):.0f}')
    B.wait_for_timeout(3000);burst=E(B,"(()=>{let m=0;for(const [t] of __hl){const s=__hl.filter(e=>e[0]>=t&&e[0]<t+1000).reduce((a,e)=>a+e[1],0);m=Math.max(m,s);}return m})()")
    chk(burst<=0.46,f'bot damage capped like PvP (max {burst*100:.0f}% hull per second)')
    # ---------- bot boards a crippled B ----------
    E(B,"__game.P.hp=__game.ST().maxHp*0.2;__game.P.speed=0;__game.P.throttle=0")
    ok=waitf(A,f"(()=>{{const s={G}.qbTest.sim()[1];return s.gr===1}})()",20000)
    chk(ok,'bot closes to board a crippled captain (grapple flag)')
    ok=waitf(B,"__game.P.dead>0||__game.state==='dead'",20000);chk(ok,'boarded B is sunk by the bot')
    ok=waitf(A,f"{G}.qbTest.sim()[1].k>=1",10000);chk(ok,f"bot credited with the sinking (k={sim_of(A)[1]['k']}, bounty {sim_of(A)[1]['b']})")
    feed=E(A,"document.getElementById('mpFeed').innerText");chk('sank' in feed and 'Black Jack' in feed,f'kill feed: {feed[-80:]!r}')
    E(A,f"{G}.qbTest.freeze(1,1)");E(A,f"{G}.qbTest.place(1,{SEA[0]-5000},{SEA[1]+5000})")
    B.wait_for_timeout(5000);E(B,"(()=>{if(__game.state!=='play'){const b=document.querySelector('#deadBtn,#respawnBtn');if(b)b.click();}})()");B.wait_for_timeout(1500)
    if E(B,"__game.state")!='play':
        E(B,"(()=>{for(const id of ['deadBtn','dRes','respawn','portLeave','leaveBtn']){const b=document.getElementById(id);if(b){b.click();}}})()");B.wait_for_timeout(1000)
    print('B state',E(B,"__game.state"))
    # ---------- human sinks a bot (bounty) ----------
    start(B,12) if E(B,"__game.state")=='title' else None
    place(B,SEA[0]+900,SEA[1]+900);bx,by=SEA[0]+900,SEA[1]+900
    E(A,f"{G}.qbTest.place(2,{bx+200},{by})");E(A,f"{G}.qbTest.hp(2,0.25)")
    ok=waitf(B,"Object.values(__game.GRIND.MPX.rem).some(r=>r.uid==='B2'&&r.vis&&Math.hypot(r.x-__game.P.x,r.y-__game.P.y)<500)",10000);chk(ok,'B sees bot B2 nearby')
    g0=E(B,"__game.S.gold");k0=E(B,"__game.S.mpK|0")
    for _ in range(4):
        E(B,"(()=>{const M=__game.GRIND.MPX;M.hits['B2']=__game.ST().maxHp*0.5;})()");B.wait_for_timeout(600)
    ok=waitf(A,f"{G}.qbTest.sim()[2].dead",8000);chk(ok,'host applies B\'s hits (bh) and the bot sinks')
    ok=waitf(B,f"(__game.S.mpK|0)>{k0}",10000);g1=E(B,"__game.S.gold");chk(ok and g1>g0,f'B claims the bot bounty: +{g1-g0} gold, captains sunk {E(B,"__game.S.mpK|0")}')
    nm=S0[2]['n'];ok=waitf(A,f"!{G}.qbTest.sim()[2].dead",15000);chk(ok and sim_of(A)[2]['n']==nm,f'bot respawns (same captain {nm}) after ~9s')
    # ---------- protections ----------
    havens=E(Cc,"__game.PORTS?__game.PORTS.filter(p=>p.haven).map(p=>[p.port.x,p.port.y]):null") or E(Cc,"(()=>{try{return PORTS.filter(p=>p.haven).map(p=>[p.port.x,p.port.y])}catch(e){return null}})()")
    hv=havens[0];place(Cc,hv[0]+1400,hv[1])
    fl=E(Cc,f"{G}.mpApi&&__game.GRIND.MPX.lfl");print('C flags',fl)
    E(A,f"{G}.qbTest.place(3,{hv[0]+1650},{hv[1]},-Math.PI/2)");E(A,f"{G}.qbTest.tg(3,'{uC}')");E(A,f"{G}.qbTest.freeze(3,0)")
    h0=hp(Cc);Cc.wait_for_timeout(9000)
    chk(abs(hp(Cc)-h0)<0.5,f'new captain (Lv3 near haven) untouched by a bot alongside: hp {h0:.0f} -> {hp(Cc):.0f}')
    tg3=sim_of(A)[3]['tg'];chk(tg3!=uC,f'bot drops protected target (tg={tg3!r})')
    E(A,f"{G}.qbTest.freeze(3,1)");E(A,f"{G}.qbTest.place(3,{SEA[0]+6000},{SEA[1]-4000})")
    # A sits in haven waters with a bot right next to it
    place(A,hv[0]+200,hv[1]);E(A,f"{G}.qbTest.place(0,{hv[0]+450},{hv[1]},-Math.PI/2)");E(A,f"{G}.qbTest.tg(0,'{uA}')");E(A,f"{G}.qbTest.freeze(0,0)")
    h0=hp(A);A.wait_for_timeout(6000);s0=sim_of(A)[0]
    d=((s0['x']-hv[0])**2+(s0['y']-hv[1])**2)**0.5
    chk(hp(A)>=h0-0.5 and d>600,f'haven safe zone respected: A hp {h0:.0f} -> {hp(A):.0f}, bot stays out ({d:.0f} from haven)')
    E(A,f"{G}.qbTest.freeze(0,1)");place(A,*SEA)
    # ---------- bot vs bot ----------
    fx,fy=SEA[0]-6000,SEA[1]-3000
    E(A,f"{G}.qbTest.place(0,{fx},{fy},-Math.PI/2)");E(A,f"{G}.qbTest.place(1,{fx+260},{fy},-Math.PI/2)")
    E(A,f"{G}.qbTest.tg(0,'B1')");E(A,f"{G}.qbTest.tg(1,'B0')");E(A,f"{G}.qbTest.freeze(0,0)");E(A,f"{G}.qbTest.freeze(1,0)")
    ok=waitf(A,f"(()=>{{const s={G}.qbTest.sim();return s[0].hp<s[0].max||s[1].hp<s[1].max||s[0].dead||s[1].dead}})()",20000)
    chk(ok,f"bots fight each other: {[(s['n'],s['hp'],s['max']) for s in sim_of(A)[:2]]}")
    for i in range(4):E(A,f"{G}.qbTest.freeze({i},1)")
    # ---------- profile card + panel ----------
    E(B,"__game.GRIND.qbCard?0:0");E(B,"(()=>{const r=Object.values(__game.GRIND.MPX.rem).find(r=>r.bot);__game.GRIND.mpApi.mpCardOpen.call(null,r.uid);})()");B.wait_for_timeout(300)
    E(B,"(()=>{const r=Object.values(__game.GRIND.MPX.rem).find(r=>r.bot);const t=document.querySelector('#mpPBody .mpPl[data-uid=\"'+r.uid+'\"]');})()")
    E(B,"__game.GRIND.mpApi.mpPanelOpen()");B.wait_for_timeout(400)
    head=E(B,"document.querySelector('#mpPBody h3')?document.querySelector('#mpPBody h3').innerText:''");chk('3/20 +4 bots' in head,f'lobby panel header: {head!r}')
    E(B,"(()=>{const e=[...document.querySelectorAll('#mpPBody .mpPl')].find(d=>d.dataset.uid&&/^B[0-3]$/.test(d.dataset.uid));if(e)e.click();})()");B.wait_for_timeout(500)
    card=E(B,"document.getElementById('mpCBody').innerText");chk('AI captain' in card,'bot profile card shows the small AI marker')
    chk(not E(B,"!!document.querySelector('#mpCBody #mpCInv')") and not E(B,"!!document.querySelector('#mpCBody [data-w]')"),'no crew invite / duel buttons on bots')
    B.screenshot(path=OUT+'q2_bot_card.png');E(B,"document.getElementById('mpCard').classList.add('hidden');document.getElementById('mpPanel').classList.add('hidden')")
    # ---------- boss contest (host A) ----------
    E(A,"__game.GRIND.nxApi.nxForce('boss',1000)")
    ok=waitf(A,"!!__game.GRIND.NX.e&&__game.GRIND.NX.e.k==='boss'&&__game.GRIND.mpApi&&Date.now()>0",10000)
    ex,ey=E(A,"[__game.GRIND.NX.e.x,__game.GRIND.NX.e.y]");A.wait_for_timeout(1500)
    E(A,f"{G}.qbTest.place(2,{ex+350},{ey},-Math.PI/2)");E(A,f"{G}.qbTest.tg(2,'boss')");E(A,f"{G}.qbTest.freeze(2,0)")
    ok=waitf(B,"(()=>{const N=__game.GRIND.NX;const e=N.e;return e&&N.wb[e.id]&&Object.keys(N.wb[e.id]).some(k=>/^B[0-3]$/.test(k))})()",25000)
    chk(ok,f"bot damage on the world boss shows in the shared pool on B: {E(B,'(()=>{const N=__game.GRIND.NX;return N.e&&N.wb[N.e.id]})()')}")
    E(A,f"{G}.qbTest.freeze(2,1)")
    # ---------- bandwidth ----------
    E(Cc,"__game.GRIND.MPX.stats.rx=0;__game.GRIND.MPX.stats.rxB=0;window.__bt0=performance.now()")
    t0=time.time();btn=[0];E(Cc,"window.__btn=0;")
    Cc.wait_for_timeout(10000)
    st=E(Cc,"(()=>{const s=__game.GRIND.MPX.stats;return [s.rx,s.rxB,(performance.now()-__bt0)/1000]})()");print('C rx in 10s (all lobby traffic):',st)
    # ---------- host migration ----------
    E(A,"__game.GRIND.mpApi.mpLeave(true)");t0=time.time()
    ok=waitf(B,"!!__game.GRIND.QB.sim",20000);chk(ok,f'B takes over the bots after host A leaves ({time.time()-t0:.1f}s)')
    nB=sorted(s['n'] for s in sim_of(B));chk(len(nB)==4 and len(set(nB)&set(s['n'] for s in S0))>=3,f'same captains continue under the new host {nB}')
    bt0=E(Cc,"__game.GRIND.QB.btT");Cc.wait_for_timeout(4000);bt1=E(Cc,"__game.GRIND.QB.btT")
    chk(bt1>bt0 and len([x for x in bots(Cc) if x['vis']])>=3,f'C keeps receiving bot state from the new host')
    waitf(B,"document.getElementById('mpInfo').innerText.includes('2/20 +4 bots')",3000);pill=E(B,"document.getElementById('mpInfo').innerText");chk('2/20 +4 bots' in pill and '👑' in pill,f'B pill {pill[:60]!r}')
    B.screenshot(path=OUT+'q3_after_migration.png')
    for pg in (B,Cc):E(pg,"__game.GRIND.mpApi.mpLeave(true)")
    B.wait_for_timeout(1500)
    unseed()
    chk(not errs,f'no page errors ({errs[:3]})')
    print('FAILS:',fails)
