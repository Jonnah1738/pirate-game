# Online-profile separation + cloud persistence test (module o) against the real Firebase project.
import sys,json,time,os
from playwright.sync_api import sync_playwright
sys.path.insert(0,'/workspace/tools/pg');import mpclean  # removes this run's own oc/ou/lb test records at exit
URL=os.environ.get('MPURL','http://127.0.0.1:8765/index.html');OUT='/workspace/pirate-game/screenshots-mp/'
fails=[];errs=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m,flush=True)
    if not c:fails.append(m)
def E(pg,js,arg=None):return pg.evaluate(js,arg) if arg is not None else pg.evaluate(js)
def waitf(pg,js,ms=15000):
    try:pg.wait_for_function(js,timeout=ms);return True
    except Exception:return False
OFF={"gold":6000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":3000,"ship":"brig","xp":5000,"clvl":14,"xpv":2,"up":{"hull":4,"sails":3,"cannons":4,"cargo":2,"rigging":1,"command":1},"fleet":[{"id":2,"name":"Test","type":"sloop","lvl":1,"maxHp":90,"hp":90}],"tips":{"ammo":1,"board":1}}
def ctx(b,tag,inject=True):
    c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mpclean.attach(c)
    pg=c.new_page()
    pg.on('pageerror',lambda e:errs.append(f'{tag} pageerror {e}'))
    pg.on('console',lambda m:(m.type=='error' and errs.append(f'{tag} console {m.text[:160]}')))
    if inject:pg.add_init_script("if(!localStorage.getItem('inj')){localStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%json.dumps(OFF))
    pg.goto(URL+'?t=1');pg.wait_for_timeout(600);return c,pg
OCK='pirateSeas_online_v1';OFK='pirateSeas_save_v1'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
    cA,A=ctx(b,'A')
    chk(E(A,"__game.GRIND.ONLINE")==False,'default boot is offline mode')
    t=E(A,"[document.getElementById('startBtn').textContent,document.getElementById('mpBtn').textContent]")
    chk('Offline (Solo)' in t[0] and 'Play Online' in t[1],f'title buttons: {t}')
    chk(E(A,"__game.S.clvl")>=14 and E(A,"__game.S.ship")=='brig','offline captain loaded (Lv14 brig)')
    lvOff=E(A,"__game.S.clvl")
    chk(E(A,f"localStorage.getItem('{OCK}')") is None,'no online profile yet')
    # --- switch to online ---
    A.tap('#mpBtn');A.wait_for_load_state();ok=waitf(A,"window.__game&&__game.GRIND.ONLINE&&!document.getElementById('mpL').classList.contains('hidden')",15000)
    chk(ok,'Play Online reloads into online mode and opens the lobby browser')
    KF="(k=>{const s=JSON.parse(localStorage.getItem(k)||'null');return s&&[s.clvl,Math.round(s.gold),Math.round(s.xp),s.ship,(s.fleet||[]).length]})"
    off0=E(A,KF+f"('{OFK}')")
    chk(E(A,"!!document.getElementById('oNote')")and 'start fresh' in E(A,"document.getElementById('oNote').textContent"),'one-time notice shown')
    A.screenshot(path=OUT+'20_online_fresh_notice.png')
    s=E(A,"(()=>{const S=__game.S;return {lv:S.clvl,g:S.gold,ship:S.ship,fl:S.fleet.length,up:Object.values(S.up).reduce((a,b)=>a+b,0),tut:S.tutDone,xp:S.xp,inf:S.infamy,cos:Object.keys(S.cosU||{}).length,res:Object.values(S.res).reduce((a,b)=>a+b,0)}})()")
    chk(s['lv']==1 and s['g']==150 and s['ship']=='sloop' and s['fl']==0 and s['up']==0 and s['xp']==0 and s['inf']==0 and s['cos']==0 and s['res']==0,f'online captain starts fresh: {s}')
    chk(s['tut']==True,'online skips the long tutorial')
    chk(not E(A,"!!__game.S.founder"),'captain who never played online is not a Founding Captain')
    E(A,"document.getElementById('oNoteOk').click()")
    ok=waitf(A,"__game.GRIND.OC.ready&&__game.GRIND.OC.ups>=1&&document.getElementById('mpOC')",20000)
    code=E(A,"__game.GRIND.OC.k");chk(ok and len(code)==24,f'online profile saved to cloud, recovery code shown ({code})')
    A.screenshot(path=OUT+'21_online_lobby_profile.png')
    ec=E(A,"(()=>{const G=__game,X=G.X;return {xp1:X.xpNeed(1),brig:G.HULLS?G.HULLS.brig.cost:null,ch:G.GRIND.craftChance('hull',1)}})()")
    # --- join a lobby and play ---
    A.fill('#mpName','Test Online');A.fill('#mpLName','Fresh Test');A.tap('#mpCreate')
    ok=waitf(A,"__game.GRIND.MPX.on&&__game.state==='play'",20000);chk(ok,'online captain joins a lobby')
    A.wait_for_timeout(1500)
    chk(E(A,"!!document.getElementById('oTag')&&getComputedStyle(document.getElementById('oTag')).display!=='none'"),'HUD shows ONLINE tag')
    A.wait_for_timeout(1200);A.screenshot(path=OUT+'22_online_hud_intro.png')
    E(A,"document.getElementById('tipBox').classList.add('hidden')");ok=waitf(A,"!document.getElementById('tipBox').classList.contains('hidden')&&/online captain/i.test(document.getElementById('tipTxt').textContent)",12000)
    A.screenshot(path=OUT+'22b_online_intro_tip.png');chk(ok,'short new-captain intro tip shown (after the online tip)')
    E(A,"(()=>{const g=__game;g.grantXP(700);g.S.gold+=500;})()")
    lv=E(A,"__game.S.clvl");chk(lv==3,f'online XP: 700 XP -> Lv{lv} (offline would be Lv{E(A,"(()=>{let x=700,l=1;while(x>=60+40*l){x-=60+40*l;l++;}return l})()")})')
    ok=waitf(A,"__game.GRIND.OC.lv===3",20000);chk(ok,'level-up uploads profile to cloud right away')
    pl=E(A,"async()=>{const G=__game.GRIND,D=G.MPX.fb.D;await new Promise(r=>setTimeout(r,1500));return (await D.get(D.ref(G.MPX.fb.db,'lob/'+G.MPX.lid+'/p/'+G.MPX.uid+'/l'))).val()}")
    chk(pl==3,f'presence shows online level {pl}')
    # cheat attempt: local level edit is not reflected in presence, cloud rejects jump
    E(A,"(()=>{const g=__game;g.S.clvl=40;g.S.xp+=900000;})()")
    r=E(A,"async()=>{const G=__game.GRIND;return [await G.ocUp(true),G.OC.lv]}")
    chk(r[0]==False and r[1]==3,f'cloud rejects a cheated level jump {r}')
    pl=E(A,"async()=>{const G=__game.GRIND;await G.mpApi.mpUpdP?.();return G.OC.lv}")
    E(A,"(()=>{const g=__game;g.S.clvl=3;g.S.xp-=900000;})()")
    E(A,"async()=>{const G=__game.GRIND;G.OC.failT=0;await G.ocUp(true)}")
    gA=E(A,"__game.S.gold");xA=E(A,"__game.S.xp")
    chk(E(A,KF+f"('{OFK}')")==off0,'offline save untouched while playing online')
    # leave -> back to online lobby browser; then switch to offline
    E(A,"__game.GRIND.mpApi.mpLeave()");A.wait_for_timeout(500);A.wait_for_load_state()
    ok=waitf(A,"window.__game&&__game.GRIND.ONLINE&&!document.getElementById('mpL').classList.contains('hidden')",15000)
    chk(ok and E(A,"__game.S.clvl")==3,'leaving the lobby returns to the online lobby browser (Lv3 kept)')
    chk(not E(A,"!!document.getElementById('oNote')"),'notice is one-time only')
    E(A,"document.getElementById('mpOff').click()");A.wait_for_timeout(500);A.wait_for_load_state();waitf(A,"window.__game&&__game.GRIND.ONLINE===false",15000)
    s=E(A,"[__game.S.clvl,__game.S.gold,__game.S.ship,__game.S.fleet.length]")
    chk(s==[lvOff,6000,'brig',1],f'offline captain unaffected after online play {s}')
    onl=E(A,KF+f"('{OCK}')")
    E(A,"document.getElementById('startBtn').click()");E(A,"(()=>{const g=__game;g.S.gold+=1234;g.grantXP(3000);})()")
    E(A,"document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'))")
    chk(E(A,KF+f"('{OCK}')")==onl and E(A,KF+f"('{OFK}')")[1]==7234,f'online profile untouched while playing offline {onl}')
    chk(E(A,"__game.GRIND.MPX.fb==null"),'offline mode never connects to Firebase')
    # back online: local cache
    E(A,"__game.GRIND.oSetMode('online',true)");A.wait_for_timeout(500);A.wait_for_load_state();waitf(A,"window.__game&&__game.GRIND.ONLINE",15000)
    s=E(A,"[__game.S.clvl,__game.S.gold,__game.S.ship]");chk(s[0]==3 and s[1]==gA and s[2]=='sloop',f'online profile persists across reload (local cache) {s}')
    # --- new browser: restore via recovery code ---
    cB,B=ctx(b,'B',inject=False)
    B.tap('#mpBtn');B.wait_for_load_state();waitf(B,"window.__game&&__game.GRIND.ONLINE",15000)
    ok=waitf(B,"__game.GRIND.OC.ready&&document.getElementById('mpORIn')",20000)
    kB=E(B,"__game.GRIND.OC.k");chk(E(B,"__game.S.clvl")==1,'new browser starts a fresh online captain')
    if E(B,"!!document.getElementById('oNoteOk')"):E(B,"document.getElementById('oNoteOk').click()")
    B.wait_for_timeout(1500);B.fill('#mpORIn',code);B.tap('#mpORGo');ok=waitf(B,"document.getElementById('mpORYes')",15000);chk(ok,'recovery code found: '+E(B,"document.getElementById('mpORSt').textContent")[:80])
    B.screenshot(path=OUT+'23_online_restore.png')
    B.tap('#mpORYes');B.wait_for_timeout(800);B.wait_for_load_state();waitf(B,"window.__game&&__game.GRIND.ONLINE",15000)
    s=E(B,"[__game.S.clvl,__game.S.gold,__game.S.xp]");chk(s==[3,gA,xA],f'online captain restored in a new browser via recovery code {s}')
    ok=waitf(B,"__game.GRIND.OC.ready",20000)
    own=E(B,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;const v=(await D.get(D.ref(G.MPX.fb.db,'oc/{code}'))).val();return [v.u===G.MPX.uid,G.OC.k]}}")
    chk(own==[True,code],f'profile now owned by the new browser {own}')
    chk((E(B,KF+f"('{OFK}')") or [1,150])[:2]==[1,150],'restore did not touch the offline save in the new browser')
    # --- Founding Captain: offline save that played online before the change ---
    cF=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);mpclean.attach(cF);F=cF.new_page()
    F.on('pageerror',lambda e:errs.append(f'F pageerror {e}'))
    OLD=dict(OFF);OLD.update({'mpName':'Old Salt','mpK':3,'mpM':40})
    F.add_init_script("if(!localStorage.getItem('inj')){localStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%json.dumps(OLD))
    F.goto(URL+'?t=1');F.wait_for_timeout(600);offF=E(F,"localStorage.getItem('pirateSeas_save_v1')")
    F.tap('#mpBtn');F.wait_for_load_state();waitf(F,"window.__game&&__game.GRIND.ONLINE&&document.getElementById('oNote')",15000)
    r=E(F,"(()=>{const S=__game.S;return [S.clvl,S.founder,S.mpM,S.cos.sail,S.cos.flag,!!(S.cosU['sail:founder']&&S.cosU['flag:founder'])]})()")
    chk(r==[1,1,100,'founder','founder',True],f'early online player: fresh Lv1 + Founding Captain flag/sails + 100 Infamy {r}')
    chk('Founding Captain' in E(F,"document.getElementById('oNote').textContent"),'Founding Captain gift shown in the one-time notice')
    F.screenshot(path=OUT+'24_founding_captain_notice.png')
    o=json.loads(E(F,"localStorage.getItem('pirateSeas_save_v1')"));chk(o.get('mpName')=='Old Salt' and o.get('clvl')>=14,'founder: offline save untouched')
    waitf(F,"__game.GRIND.OC.ready",20000);E(F,"async()=>{const G=__game.GRIND,D=G.MPX.fb.D,db=G.MPX.fb.db;await D.remove(D.ref(db,'oc/'+G.OC.k)).catch(()=>{});await D.remove(D.ref(db,'ou/'+G.MPX.uid)).catch(()=>{});}")
    E(F,"localStorage.removeItem('pirateSeas_online_v1');Storage.prototype.setItem=function(){};location.reload()")
    F.wait_for_timeout(500);F.wait_for_load_state();waitf(F,"window.__game&&__game.GRIND.ONLINE",15000)
    chk(not E(F,"!!__game.S.founder"),'founder gift is one-time (not re-granted to a new online profile)')
    cF.close()
    # cleanup (owner deletes)
    E(B,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D,db=G.MPX.fb.db;await D.remove(D.ref(db,'oc/{code}'));await D.remove(D.ref(db,'ou/'+G.MPX.uid));}}")
    try:E(B,f"async()=>{{const G=__game.GRIND,D=G.MPX.fb.D;await D.remove(D.ref(G.MPX.fb.db,'oc/{kB}'))}}")
    except Exception as e:pass
    E(A,"async()=>{const G=__game.GRIND;await G.ocSync().catch(()=>{});const D=G.MPX.fb.D;await D.remove(D.ref(G.MPX.fb.db,'ou/'+G.MPX.uid)).catch(()=>{})}")
    b.close()
real=[e for e in errs if 'permission_denied' not in e.lower()]
chk(not real,f'no page/console errors {real[:4]}')
print('FAILS:',fails);sys.exit(1 if fails else 0)
