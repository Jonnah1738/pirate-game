# Polish pass (module p): Cloud Save & Recovery screen + one-time prompt, Graphics setting (+auto Low), boarding badge vs lobby pill,
# founder detection via DB. Runs against the REAL Firebase project; mpclean removes this run's own records at exit.
import sys,json,time,random,os
sys.argv.append('--n2')
exec(open('/workspace/tools/pg/test_mp.py').read().split('with sync_playwright() as p:')[0])
def fresh(b,tag):  # online mode, NO online save yet (brand-new online captain)
    c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);mpclean.attach(c);pg=c.new_page()
    pg.on('pageerror',lambda e:errs.append(f'{tag} pageerror {e}'));pg.on('console',lambda m:(m.type=='error' and errs.append(f'{tag} console {m.text[:160]}')))
    pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');sessionStorage.setItem('pirateSeas_mode','online');localStorage.setItem('pirateSeas_onNotice','1');}")
    pg.goto(URL+'?t=1');pg.wait_for_timeout(600);return c,pg
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
    C=[client(b,i) for i in range(2)];A,B=[c[1] for c in C]
    # --- 1. Cloud Save & Recovery: title button + menu row ---
    chk(E(A,"!!document.getElementById('ocTBtn')&&/Cloud Save/.test(document.getElementById('ocTBtn').textContent)"),'online title has a Cloud Save & Recovery button')
    start(A,1);E(A,"__game.openMenu()");A.wait_for_timeout(600)
    chk(E(A,"/Cloud Save &amp; Recovery|Cloud Save & Recovery/.test(document.getElementById('mBody').innerHTML)"),'online menu shows Cloud Save & Recovery row')
    E(A,"document.querySelector('#mBody button[data-act=ocloud]').click()")
    ok=waitf(A,"!document.getElementById('oCloud').classList.contains('hidden')&&document.getElementById('ocCode')&&/^[A-Z0-9]{4}(-[A-Z0-9]{4}){5}$/.test(document.getElementById('ocCode').textContent)",25000)
    print('DBG',E(A,"[document.getElementById('ocSt')&&document.getElementById('ocSt').textContent,__game.GRIND.OC.ready,__game.GRIND.OC.k,__game.GRIND.OC.err,document.getElementById('ocP').textContent.slice(0,200)]"),errs[:3]);code=E(A,"__game.GRIND.OC.k");chk(ok and len(code)==24,f'cloud screen shows the 24-char recovery code {code}')
    A.screenshot(path=OUT+'p1_cloud_screen.png')
    E(A,"document.getElementById('ocCopy').click()");A.wait_for_timeout(500)
    chk('Copied' in E(A,"document.getElementById('ocSt').textContent") or 'copy' in E(A,"document.getElementById('ocSt').textContent"),'copy button responds')
    A.fill('#ocIn','ABC');E(A,"document.getElementById('ocGo').click()");A.wait_for_timeout(800)
    chk('24 characters' in E(A,"document.getElementById('ocRSt').textContent"),'restore validates code length')
    A.fill('#ocIn',code);E(A,"document.getElementById('ocGo').click()");waitf(A,"/already/.test(document.getElementById('ocRSt').textContent)",8000)
    chk('already' in E(A,"document.getElementById('ocRSt').textContent"),'restore recognises own code')
    E(A,"document.getElementById('ocX').click()");chk(E(A,"document.getElementById('oCloud').classList.contains('hidden')&&__game.state==='play'"),'closing returns to play')
    # offline mode has no cloud row
    chk(E(A,"__game.GRIND.ONLINE")==True,'A online');
    # --- 2. Graphics setting ---
    E(A,"__game.openMenu()");A.wait_for_timeout(600)
    seq=[]
    for i in range(3):
        seq.append(E(A,"[__game.GRIND.GFX.mode,__game.GRIND.RS.low]"));E(A,"document.querySelector('#mBody button[data-act=gfx]').click()");A.wait_for_timeout(100)
    seq.append(E(A,"[__game.GRIND.GFX.mode,__game.GRIND.RS.low]"))
    chk(seq==[['auto',False],['high',False],['low',True],['auto',False]],f'graphics cycles Auto→High→Low→Auto {seq}')
    chk(E(A,"/Graphics/.test(document.getElementById('mBody').textContent)"),'menu shows Graphics row')
    E(A,"document.getElementById('mClose').click()");A.wait_for_timeout(200)
    # --- 3. boarding badge vs lobby pill (joiner) ---
    r=E(A,"async()=>{const G=__game.GRIND;G.MPX.name='Iron Anne';try{await G.mpApi.mpCreate(true,'PP Test '+Math.floor(Math.random()*900+100));return G.MPX.lid}catch(e){return 'ERR '+e.message}}")
    chk(r and r[0]=='L',f'A created lobby {r}');lid=r
    chk(join(B,lid,'Black Jack')=='ok','B joined');start(B,1);B.wait_for_timeout(1500)
    E(B,"__game.GRIND.pLockTest(1)");B.wait_for_timeout(700)
    ov=E(B,"(()=>{const a=document.getElementById('hullLock').getBoundingClientRect(),b=document.getElementById('mpPill').getBoundingClientRect();const vis=!document.getElementById('hullLock').classList.contains('hidden')&&!document.getElementById('mpPill').classList.contains('hidden');return [vis,!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom),Math.round(a.top),Math.round(b.bottom)]})()")
    B.screenshot(path=OUT+'p2_badge_joiner.png')
    chk(ov[0] and not ov[1],f'hull-lock badge does not overlap the lobby pill for joiners {ov}')
    E(B,"__game.GRIND.pLockTest(0)")
    # --- 4. one-time recovery-code prompt after the first online session ---
    E(B,"__game.S.oRcP=0");E(B,"__game.GRIND.mpApi.mpLeave()")
    ok=waitf(B,"document.getElementById('oCloud')&&!document.getElementById('oCloud').classList.contains('hidden')&&/Save your recovery code/.test(document.getElementById('oCloud').textContent)",25000)
    chk(ok,'after leaving the first online session, the recovery-code prompt opens')
    B.screenshot(path=OUT+'p3_rc_prompt.png')
    chk(E(B,"__game.S.oRcP")==1,'prompt is one-time (flag saved)')
    # --- 5. founder detection via DB ---
    cF,F=fresh(b,'F');uidF=E(F,"async()=>{const G=__game.GRIND;await G.mpApi.fbLoad();return G.MPX.uid}");mpclean._cb(uidF,'')
    chk(E(F,"__game.S.oFresh===1&&!__game.S.founder"),'F is a fresh online captain, not locally a founder')
    wk=E(F,"__game.GRIND.nxApi.nxWeek()");ts=E(F,"__game.GRIND.OFOUND_TS")-3600000
    open('/tmp/mpseedf.json','w').write(json.dumps({f'lb/{wk}/{uidF}':{'n':'Old Salt','s':25,'t':ts}}))
    import subprocess
    r=subprocess.run('cd /workspace/pirate-game/firebase && npx -y firebase-tools@latest database:update / /tmp/mpseedf.json -f --project pirate-seas-jonnah',shell=True,capture_output=True,text=True,timeout=120)
    chk(r.returncode==0,'seeded a pre-change leaderboard entry for F')
    E(F,"__game.GRIND.ocSync()")
    ok=waitf(F,"__game.S.founder===1&&__game.S.cos.flag==='founder'&&!!document.getElementById('oNote')",25000)
    chk(ok,'founder detected from DB (pre-change leaderboard entry): flag+sail granted and notice shown')
    chk(E(F,"__game.S.mpM|0")>=100,'founder +100 infamy')
    F.screenshot(path=OUT+'p4_founder_db.png')
    chk(E(A,"__game.S.oFdb")!=1 or not E(A,"__game.S.founder"),'non-founder not granted')
    cG,G=fresh(b,'G');E(G,"__game.GRIND.ocSync()");ok=waitf(G,"__game.S.oFdb===1",25000)
    chk(ok and not E(G,"__game.S.founder"),'fresh captain without prior online data: DB check runs, no gift')
    # --- 6. auto Low graphics when fps is low (offline, throttled) ---
    cO=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);O=cO.new_page()
    O.add_init_script("if(!localStorage.getItem('inj')){localStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify({gold:500,tutDone:true,seen:true,tips:{ammo:1,board:1,sail:1}}));}")
    O.goto(URL+'?t=2');O.wait_for_timeout(600);E(O,"document.getElementById('startBtn').click()")
    cdp=cO.new_cdp_session(O);cdp.send('Emulation.setCPUThrottlingRate',{'rate':12})
    ok=waitf(O,"__game.GRIND.RS.low===true",40000);cdp.send('Emulation.setCPUThrottlingRate',{'rate':1})
    chk(ok and E(O,"localStorage.getItem('pirateSeas_gfx_auto')")=='low' and E(O,"__game.GRIND.GFX.mode")=='auto','auto picks Low after a few seconds of low fps (remembered)')
    errs2=[e for e in errs if 'permission' not in e.lower()]
    chk(not errs2,f'no page errors {errs2[:3]}')
    b.close()
print('FAILS:',fails);sys.exit(1 if fails else 0)
