# Multiplayer test against the REAL Firebase project (pirate-seas-jonnah). 6 headless clients by default; --stress = 16 (+1 overflow).
import sys,json,time,random
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8765/index.html';OUT='/workspace/pirate-game/screenshots-mp/'
STRESS='--stress' in sys.argv;N=16 if STRESS else 6
fails=[];errs=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m,flush=True)
    if not c:fails.append(m)
def E(pg,js,arg=None):return pg.evaluate(js,arg) if arg is not None else pg.evaluate(js)
def sim(pg,sec,dt=1/60):E(pg,f"(()=>{{for(let i=0;i<{int(sec/dt)};i++)__game.step({dt});}})()")
SAVE={"gold":6000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":3000,"ship":"brig","up":{"hull":4,"sails":3,"cannons":4,"cargo":2,"rigging":1,"command":1},"roles":{"gunner":2,"sailor":1,"carpenter":1,"navigator":1},"wv":2,"unl":60,"tips":{"ammo":1,"board":1,"codex":1,"craft":1,"crew":1,"dive":1,"event":1,"fish":1,"fog":1,"fort":1,"grapple":1,"layup":1,"legend":1,"mats":1,"merchant":1,"mp":1,"night":1,"ram":1,"republic":1,"sail":1,"shark":1,"storm":1,"story":1,"upkeep":1,"vault":1,"wanted":1,"war":1,"boardnews":1}}
LEVEL="(l=>{const g=__game;let need=0;for(let k=1;k<l;k++)need+=g.X.xpNeed(k);g.S.xp=need;g.S.clvl=l;g.S.sp=0;g.S.unl=l;g.recalc();g.P.hp=g.ST().maxHp;})"
SEA=(12000,9500)
def client(b,i,touch=True):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=touch,has_touch=touch,device_scale_factor=1)
    pg=ctx.new_page();tag=f'c{i}'
    pg.on('pageerror',lambda e,t=tag:errs.append(f'{t} pageerror {e}'))
    pg.on('console',lambda m,t=tag:(m.type=='error' and errs.append(f'{t} console {m.text[:160]}')))
    s=dict(SAVE);pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%json.dumps(s))
    pg.goto(URL+'?t=1');pg.wait_for_timeout(500);return ctx,pg
def start(pg,lvl=12):
    E(pg,"document.getElementById('startBtn').click()");pg.wait_for_timeout(150);E(pg,LEVEL+f"({lvl})")
    E(pg,"(()=>{const g=__game;g.enemies.length=0;if(g.sharks)g.sharks.length=0;})()")
def place(pg,x,y,h=0):E(pg,f"(()=>{{const g=__game;g.P.x={x};g.P.y={y};g.P.h={h};g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;g.enemies.length=0;g.GRIND.MPX.force=true;}})()")
def M(pg):return "__game.GRIND"
def join(pg,lid,name):
    return E(pg,"async([lid,n])=>{const G=__game.GRIND;G.MPX.name=n;try{await G.mpApi.mpJoin(lid);return 'ok';}catch(e){return 'ERR '+e.message;}}",[lid,name])
def waitf(pg,js,ms=12000):
    try:pg.wait_for_function(js,timeout=ms);return True
    except Exception:return False
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
    C=[client(b,i) for i in range(N)];pgs=[c[1] for c in C]
    A=pgs[0]
    # --- lobby browser UI on A ---
    A.tap('#mpBtn');ok=waitf(A,"document.getElementById('mpLSt')&&/Signed in/.test(document.getElementById('mpLSt').textContent)",20000)
    chk(ok,'A: Play Online opens lobby browser and signs in anonymously')
    A.wait_for_timeout(1500);A.fill('#mpName','Fuck Face');A.tap('#mpCreate');A.wait_for_timeout(300)
    chk('flagged' in E(A,"document.getElementById('mpLSt').textContent"),'profane captain name rejected')
    A.fill('#mpName','Iron Anne');A.fill('#mpLName','Test Waters '+str(random.randint(100,999)))
    t0=time.time();A.tap('#mpCreate');ok=waitf(A,"__game.GRIND.MPX.on&&__game.state==='play'",20000)
    lid=E(A,"__game.GRIND.MPX.lid");chk(ok and lid and lid[0]=='L',f'A created public lobby {lid} ({time.time()-t0:.1f}s)')
    start(A);place(A,SEA[0],SEA[1])
    # --- others join (list, then quick join should pick this lobby) ---
    lst=E(pgs[1],"async()=>{const G=__game.GRIND;return (await G.mpApi.mpList()).map(l=>[l.lid,l.n])}")
    chk(any(l[0]==lid for l in lst),f'lobby listed in browser for B: {[l for l in lst if l[0]==lid]}')
    pgs[1].tap('#mpBtn');waitf(pgs[1],"document.querySelector('#mpList .mpLob')",15000);pgs[1].fill('#mpName','Black Jack');pgs[1].wait_for_timeout(300);pgs[1].screenshot(path=OUT+'01_lobby_browser.png');E(pgs[1],"document.getElementById('mpLX').click()")
    names=['Iron Anne','Black Jack','Calico Kate','Salty Pete','Mad Meg','Long Tom','Red Ned','Grey Ghost','Bloody Mary','Scurvy Sam','Gent Ned','Barnacle Bill','Rum Rosa','One Eye','Hook Hal','Sea Wolf','Overflow']
    for i in range(1,N):
        r=join(pgs[i],lid,names[i]);start(pgs[i]);
        if i<6:place(pgs[i],SEA[0]+i*40,SEA[1]+400+i*30)
        else:place(pgs[i],SEA[0]-1500+(i%4)*250,SEA[1]-1500+(i//4)*250)
        if r!='ok':chk(False,f'{names[i]} join: {r}')
    chk(True,f'{N-1} more clients joined')
    n_ok=waitf(A,f"Object.values(__game.GRIND.MPX.rem).filter(r=>!r.stale&&r.j).length>={N-1}",25000)
    chk(n_ok,f'A sees all {N-1} other captains in the lobby list ({E(A,"Object.keys(__game.GRIND.MPX.rem).length")})')
    slots=E(A,"async()=>{const G=__game.GRIND,D=G.MPX.fb.D;const s=(await D.get(D.ref(G.MPX.fb.db,'lob/'+G.MPX.lid+'/s'))).val()||{};return Object.values(s).filter(Boolean).length}")
    chk(slots==N,f'server slots used = {slots}')
    if STRESS:
        r=join(pgs[0].context.new_page() if False else pgs[1],lid,'Overflow') if False else None
        ctx17,p17=client(b,99);r=join(p17,lid,'Overflow')
        chk('FULL' in str(r),f'17th captain rejected from full lobby: {r}')
        q=E(p17,"async()=>{const G=__game.GRIND;await G.mpApi.mpQuick();return G.MPX.lid}")
        chk(q!=lid,f'Quick Join with the lobby full auto-creates/joins another lobby ({q})')
        E(p17,"__game.GRIND.mpApi.mpLeave(true)");p17.wait_for_timeout(800);ctx17.close()
    # --- position sync ---
    B=pgs[1];place(B,SEA[0]+300,SEA[1]+220,1.0);
    ok=waitf(A,f"(()=>{{const r=Object.values(__game.GRIND.MPX.rem).find(r=>r.n==='Black Jack');return r&&r.vis&&Math.hypot(r.x-{SEA[0]+300},r.y-{SEA[1]+220})<40}})()",8000)
    chk(ok,'position sync: A sees B where B moved (<40px)')
    # moving ship interpolation smoothness
    E(B,"(()=>{const g=__game;g.P.throttle=1;g.S.sail=1;})()")
    samples=[]
    for k in range(12):
        sim(B,0.1);A.wait_for_timeout(100);samples.append(E(A,"(()=>{const r=Object.values(__game.GRIND.MPX.rem).find(r=>r.n==='Black Jack');return [r.x,r.y]})()"))
    bx=E(B,"[__game.P.x,__game.P.y]");lag=((samples[-1][0]-bx[0])**2+(samples[-1][1]-bx[1])**2)**.5
    jumps=max(((samples[i][0]-samples[i-1][0])**2+(samples[i][1]-samples[i-1][1])**2)**.5 for i in range(1,len(samples)))
    chk(lag<150,f'interpolated remote trails real position by {lag:.0f}px (max step {jumps:.0f}px/100ms)')
    E(B,"(()=>{const g=__game;g.P.throttle=0;g.P.speed=0;g.P.vx=g.P.vy=0;})()")
    # --- chat + profanity + emote ---
    E(B,"__game.GRIND.mpApi.mpSay('Ahoy Anne, nice brig!')");pgs[2].wait_for_timeout(1600);E(pgs[2],"__game.GRIND.mpApi.mpSay('you shit captain')")
    ok=waitf(A,"__game.GRIND.MPX.chat.some(m=>m.m==='Ahoy Anne, nice brig!')&&__game.GRIND.MPX.chat.some(m=>/✶/.test(m.m))",8000)
    ch=E(A,"__game.GRIND.MPX.chat.map(m=>m.n+': '+m.m)");chk(ok,f'chat delivered + profanity masked: {ch[-2:]}')
    E(B,"__game.GRIND.mpApi.mpSay('spam')");rl=E(B,"__game.GRIND.mpApi.mpSay('spam2')");chk(rl is False,'client chat rate limit')
    B.wait_for_timeout(1700);em=E(B,"__game.GRIND.mpApi.mpEmote('wave'),!!__game.GRIND.MPX.myEmo")
    ok=waitf(A,"(()=>{const r=Object.values(__game.GRIND.MPX.rem).find(r=>r.n==='Black Jack');return r&&r.emo&&r.emo.s==='👋'})()",6000);chk(ok,f'emote bubble shows over B on A (sent={em})')
    # screenshot: several players + chat open
    for i in range(1,min(6,N)):place(pgs[i],SEA[0]+[0,160,-170,60,-60,200][i],SEA[1]+[0,170,140,-190,-200,-40][i],[0,0.6,2.4,4,1.2,3][i])
    A.wait_for_timeout(1800);E(A,"__game.GRIND.MPX.uiT=0");A.wait_for_timeout(400);A.screenshot(path=OUT+'02_several_players.png')
    A.tap('#mpChatBtn');A.wait_for_timeout(300);A.fill('#mpMsg','Ahoy all — meet at Tortuga');A.tap('#mpSend');A.wait_for_timeout(1500);A.screenshot(path=OUT+'03_chat.png')
    chk(E(A,"__game.GRIND.MPX.chat.some(m=>m.m==='Ahoy all — meet at Tortuga')"),'chat UI send works');A.tap('#mpChatX')
    # --- PvP: A shoots B (B on A's right side) ---
    place(A,SEA[0],SEA[1],0);place(B,SEA[0],SEA[1]+150,0);A.wait_for_timeout(1500)
    hp0=E(B,"__game.P.hp");g0=E(A,"__game.S.gold");bg0=E(B,"__game.S.gold")
    E(A,"(()=>{const g=__game;g.P.rr=0;g.fire(1)})()");sim(A,0.12);A.screenshot(path=OUT+'04_pvp_volley.png')
    for k in range(10):sim(A,0.1);A.wait_for_timeout(60)
    ok=waitf(B,f"__game.P.hp<{hp0}-1",6000);hp1=E(B,"__game.P.hp")
    chk(ok,f'PvP hit: B hull {hp0:.0f} -> {hp1:.0f}');A.wait_for_timeout(400);A.screenshot(path=OUT+'04b_pvp_hit.png')
    # sink B
    for v in range(30):
        if E(B,"!!__game.P.dead||__game.state==='dead'"):break
        place(B,SEA[0],SEA[1]+150,0);E(A,"(()=>{const g=__game;g.P.rr=0;g.P.x=%d;g.P.y=%d;g.P.h=0;g.fire(1)})()"%SEA)
        for k in range(6):sim(A,0.1);A.wait_for_timeout(50)
        B.wait_for_timeout(250)
    dead=waitf(B,"!!__game.P.dead||__game.state==='dead'",6000);chk(dead,f'B sunk by PvP after {v+1} volleys')
    B.wait_for_timeout(600);kc=E(B,"[!!__game.GRIND.MPX.killer,document.getElementById('mpKCB').className,document.getElementById('mpKCB').textContent]")
    A.wait_for_timeout(300)
    chk(kc[0] and 'hidden' not in kc[1] and 'Iron Anne' in kc[2],f'kill cam on B: {kc[2]!r}');B.screenshot(path=OUT+'05_killcam.png')
    for k in range(6):sim(B,1)
    ok=waitf(B,"__game.state==='dead'",8000);chk(ok,'B gets the sunk screen')
    ok=waitf(A,f"__game.S.gold>{g0}",10000);g1=E(A,"__game.S.gold");chk(ok,f'A claims bounty: gold {g0} -> {g1}; pvp kills {E(A,"__game.S.mpK")}')
    E(B,"document.getElementById('deadBtn').click()");B.wait_for_timeout(300)
    hv=E(B,"(()=>{const g=__game;return [g.GRIND.mpApi.mpSafeAt(g.P.x,g.P.y),g.state,g.PORTS[g.S.lastPort].haven]})()");chk(hv[0] and hv[2],f'B respawned at a haven (safe zone) {hv}')
    # --- safe zone: shoot C sitting in haven waters ---
    Cp=pgs[2];port=E(Cp,"(()=>{const g=__game;const p=g.PORTS.find(p=>p.haven);return [p.port.x,p.port.y]})()")
    place(Cp,port[0]+100,port[1]+120,0);place(A,port[0]+100,port[1]-30,0);E(Cp,"(()=>{const g=__game;const iv=setInterval(()=>{g.enemies.length=0;if(g.sharks)g.sharks.length=0;},50);setTimeout(()=>clearInterval(iv),9000);})()");A.wait_for_timeout(1500);c0=E(Cp,"__game.P.hp")
    for v in range(3):
        E(A,"(()=>{const g=__game;g.P.rr=0;g.P.x=%d;g.P.y=%d;g.P.h=0;g.fire(1)})()"%(port[0]+100,port[1]-30))
        for k in range(6):sim(A,0.1)
    Cp.wait_for_timeout(1500);c1=E(Cp,"[__game.P.hp,__game.ST().maxHp,__game.state,__game.GRIND.MPX.lfl,__game.enemies.length,__game.P.x|0,__game.P.y|0]");chk(c1[0]>=c0,f'haven safe zone: no PvP damage {c0} -> {c1}')
    # --- crew: A invites D; D accepts; A cannot hurt D ---
    Dp=pgs[3];duid=E(Dp,"__game.GRIND.MPX.uid");E(A,"(u=>__game.GRIND.mpApi.mpInvite(u))",duid)
    ok=waitf(Dp,"__game.GRIND.MPX.inv.length>0",8000);Dp.wait_for_timeout(200);Dp.screenshot(path=OUT+'06_crew_invite.png')
    chk(ok and 'hidden' not in E(Dp,"document.getElementById('mpInvP').className"),'crew invite prompt shown to D')
    Dp.tap('#mpInvY');ok=waitf(A,f"(()=>{{const r=__game.GRIND.MPX.rem['{duid}'];return r&&r.cr===__game.GRIND.MPX.crew&&!!r.cr}})()",8000)
    chk(ok,f'D joined A\'s crew ({E(Dp,"__game.GRIND.MPX.crewName")})')
    place(A,SEA[0],SEA[1],0);place(Dp,SEA[0],SEA[1]+150,0);E(Dp,"(()=>{const g=__game;const iv=setInterval(()=>{g.enemies.length=0;if(g.sharks)g.sharks.length=0;},50);setTimeout(()=>clearInterval(iv),9000);})()");A.wait_for_timeout(1500);d0=E(Dp,"__game.P.hp")
    for v in range(2):
        E(A,"(()=>{const g=__game;g.P.rr=0;g.P.x=%d;g.P.y=%d;g.P.h=0;g.fire(1)})()"%SEA)
        for k in range(6):sim(A,0.1)
    Dp.wait_for_timeout(1500);d1=E(Dp,"[__game.P.hp,__game.state,__game.GRIND.MPX.crew,__game.enemies.length,__game.P.x|0,__game.P.y|0]");chk(d1[0]>=d0,f'no friendly fire between crewmates {d0} -> {d1}')
    # --- profile card + lobby panel ---
    E(A,f"__game.GRIND.mpApi.mpCardOpen('{E(B,'__game.GRIND.MPX.uid')}')");A.wait_for_timeout(200);A.screenshot(path=OUT+'07_profile_card.png')
    chk('Black Jack' in E(A,"document.getElementById('mpCT').textContent"),'captain profile card opens');E(A,"document.getElementById('mpCX').click()")
    E(A,"__game.GRIND.mpApi.mpPanelOpen()");A.wait_for_timeout(300);A.screenshot(path=OUT+'08_lobby_panel.png');E(A,"document.getElementById('mpPX').click()")
    # --- rules reject writing another player's node from the real client SDK ---
    rej=E(B,"async(u)=>{const G=__game.GRIND,D=G.MPX.fb.D;try{await D.set(D.ref(G.MPX.fb.db,'lob/'+G.MPX.lid+'/p/'+u+'/n'),'Hacked');return 'accepted'}catch(e){return 'rejected '+e.code}}",E(A,"__game.GRIND.MPX.uid"))
    chk(rej.startswith('rejected'),f"rules: B writing A's profile -> {rej}")
    rej2=E(B,"async(u)=>{const G=__game.GRIND,D=G.MPX.fb.D;try{await D.update(D.ref(G.MPX.fb.db),{['lob/'+G.MPX.lid+'/ev/'+u+'/x1']:{a:u,d:400,t:D.serverTimestamp()},['lob/'+G.MPX.lid+'/hr/'+G.MPX.uid]:D.serverTimestamp()});return 'accepted'}catch(e){return 'rejected '+e.code}}",E(A,"__game.GRIND.MPX.uid"))
    chk(rej2.startswith('rejected'),f'rules: forged hit (attacker=victim) -> {rej2}')
    # --- private lobby + code join ---
    Ep,Fp=pgs[4],pgs[5]
    code=E(Ep,"async()=>{const G=__game.GRIND;await G.mpApi.mpCreate(false,'Secret Cove');return G.MPX.code}")
    chk(len(code)==6,f'E created private lobby with code {code}')
    lst=E(Fp,"async()=>(await __game.GRIND.mpApi.mpList()).map(l=>l.lid)");chk(('P'+code) not in lst,'private lobby is not listed')
    r=E(Fp,"async(c)=>{try{await __game.GRIND.mpApi.mpJoinCode(c);return __game.GRIND.MPX.lid}catch(e){return 'ERR '+e.message}}",code.lower())
    chk(r=='P'+code,f'F joined by code (lower-case typed): {r}')
    ok=waitf(Ep,"Object.values(__game.GRIND.MPX.rem).some(r=>r.n==='Long Tom'&&!r.stale)",10000);chk(ok,'E sees F in private lobby')
    bad=E(Fp,"async()=>{try{await __game.GRIND.mpApi.mpJoinCode('ZZZZZZ');return 'joined?'}catch(e){return e.message}}");chk('NOLOBBY' in bad,'wrong code -> no lobby')
    # --- disconnect cleanup: close C's tab; A should drop C ---
    cuid=E(Cp,"__game.GRIND.MPX.uid");C[2][0].close()
    ok=waitf(A,f"!__game.GRIND.MPX.rem['{cuid}']",20000);chk(ok,'disconnect: closed tab removed from lobby (onDisconnect)')
    gone=E(A,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;const db=G.MPX.fb.db;const a=(await D.get(D.ref(db,'lob/'+G.MPX.lid+'/p/{cuid}'))).exists();const u=(await D.get(D.ref(db,'lob/'+G.MPX.lid+'/u/{cuid}'))).exists();return [a,u]}}")
    chk(gone==[False,False],f'server nodes for C removed {gone}')
    # --- reconnect: B goes offline then online ---
    E(B,"__game.GRIND.MPX.fb.D.goOffline(__game.GRIND.MPX.fb.db)");B.wait_for_timeout(1500);E(B,"__game.GRIND.MPX.fb.D.goOnline(__game.GRIND.MPX.fb.db)")
    buid=E(B,"__game.GRIND.MPX.uid");ok=waitf(A,f"(()=>{{const r=__game.GRIND.MPX.rem['{buid}'];return r&&!r.stale&&r.vis}})()",15000);chk(ok,'reconnect: B back in lobby after network drop')
    # --- bandwidth sample: 20s with everyone sailing around near each other ---
    for pg in pgs:
        if pg.is_closed():continue
        E(pg,"(()=>{const M=__game.GRIND.MPX;M.stats={tx:0,rx:0,txB:0,rxB:0,t0:performance.now()};})()")
    live=[pg for pg in pgs if not pg.is_closed() and E(pg,"__game.GRIND.MPX.on&&__game.GRIND.MPX.lid")==lid]
    for k,pg in enumerate(live):place(pg,SEA[0]+(k%4)*220,SEA[1]+(k//4)*220,k);E(pg,"(()=>{const g=__game;g.P.throttle=1;g.S.sail=0.5;g.P.speed=60;})()")
    cdp=A.context.new_cdp_session(A);cdp.send('Network.enable');WS={'rx':0,'tx':0,'nr':0,'nt':0}
    def _r(e):WS['rx']+=len(e['response']['payloadData']);WS['nr']+=1
    def _t(e):WS['tx']+=len(e['response']['payloadData']);WS['nt']+=1
    cdp.on('Network.webSocketFrameReceived',_r);cdp.on('Network.webSocketFrameSent',_t)
    t1=time.time()
    while time.time()-t1<20:
        for pg in live:E(pg,"(()=>{const g=__game;g.P.h+=0.3;g.P.speed=60;g.P.x+=Math.cos(g.P.h)*12;g.P.y+=Math.sin(g.P.h)*12;})()")
        live[0].wait_for_timeout(200)
    st=E(A,"(()=>{const s=__game.GRIND.MPX.stats;return {tx:s.tx,rx:s.rx,txB:s.txB,rxB:s.rxB,sec:(performance.now()-s.t0)/1000}})()")
    print('BANDWIDTH (A, %d captains clustered):'%len(live),st,'=> down %.2f KB/s, up %.2f KB/s'%(st['rxB']/st['sec']/1024,st['txB']/st['sec']/1024))
    el=time.time()-t1;print('WEBSOCKET bytes on A over %.0fs: down %d B (%d frames) = %.2f KB/s, up %d B (%d frames) = %.2f KB/s'%(el,WS['rx'],WS['nr'],WS['rx']/el/1024,WS['tx'],WS['nt'],WS['tx']/el/1024))
    st['wsRx']=WS['rx'];st['wsTx']=WS['tx'];st['wsSec']=el
    json.dump({'n':len(live),'stats':st},open('/tmp/mp_bw_%d.json'%N,'w'))
    # fps check with everyone on screen
    fps=E(A,"new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(n/3)}requestAnimationFrame(f)})")
    print('fps on A with',len(live)-1,'remote ships nearby:',round(fps,1))
    A.screenshot(path=OUT+('09_stress16.png' if STRESS else '09_cluster.png'))
    # --- leave + lobby GC ---
    for pg in pgs:
        if not pg.is_closed():E(pg,"__game.GRIND.mpApi.mpLeave(true)")
    A.wait_for_timeout(2500)
    ex=E(A,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;const db=G.MPX.fb.db;return [(await D.get(D.ref(db,'lob/{lid}/s'))).exists(),(await D.get(D.ref(db,'idx/{lid}'))).exists()]}}")
    chk(ex==[False,False],f'lobby emptied + garbage-collected after everyone left {ex}')
    real=[e for e in errs if 'favicon' not in e]
    chk(not real,f'console errors: {real[:5]}')
    b.close()
print('FAILS:',fails);sys.exit(1 if fails else 0)
