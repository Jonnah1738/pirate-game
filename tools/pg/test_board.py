import json,sys,math,re
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OLD='http://127.0.0.1:8765/old_board.html'
OUT='/workspace/pirate-game/screenshots-board/'+('live_' if LIVE else '')
E=lambda pg,js: pg.evaluate(js)
errs=[];R={}
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
def sim(pg,sec,dt=1/60): E(pg,f"(()=>{{for(let i=0;i<{int(sec/dt)};i++)__game.step({dt});}})()")
def bsim(pg,sec): E(pg,f"__game.B.sim({int(sec*60)})")
def fps(pg,ms=4000):
    return E(pg,f"""new Promise(r=>{{let n=0,t0=performance.now(),worst=0,last=t0,ws=[];function f(t){{n++;const d=t-last;ws.push(d);worst=Math.max(worst,d);last=t;if(t-t0<{ms})requestAnimationFrame(f);else{{ws.sort((a,b)=>b-a);r([Math.round(n*1000/(t-t0)),Math.round(worst),ws.slice(0,5).map(Math.round)]);}}}}requestAnimationFrame(f);}})""")
SAVE0={"gold":20000,"crew":40,"tutDone":True,"seen":True,"bal":2,"infamy":3000,"xp":0,"clvl":1,"ship":"frigate","up":{"hull":8,"sails":6,"cannons":8,"cargo":4,"rigging":2,"command":2},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,"unl":60}
def inject(ctx,pg,saveobj,url=URL,tag='x',raw=False):
    if pg: pg.close()
    pg=ctx.new_page();hook(pg,tag)
    js=json.dumps(saveobj) if not raw else saveobj
    pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',JSON.stringify(%s));}"%js)
    pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(700);return pg
def fresh(b,w,h,save=None,url=URL,tag='',touch=True):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=touch,has_touch=touch,device_scale_factor=2 if touch else 1)
    if save is not None: return ctx,inject(ctx,None,save,url,tag or f'{w}x{h}')
    pg=ctx.new_page();hook(pg,tag or f'{w}x{h}');pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(400);return ctx,pg
def start(pg,tips=True):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    E(pg,"(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tips=Object.assign({republic:1,fort:1,ammo:1,merchant:1,shark:1,wanted:1,board:1,boardnews:1},g.S.tips);})()")
def level(pg,l): E(pg,f"(()=>{{const g=__game;let need=0;for(let k=1;k<{l};k++)need+=g.X.xpNeed(k);g.S.xp=need;g.S.clvl={l};g.S.sp=0;g.S.unl={l};g.recalc();g.P.hp=g.ST().maxHp;}})()")
WATER="(()=>{const g=__game;g.enemies.length=0;if(g.sharks)g.sharks.length=0;for(let k=0;k<600;k++){const x=12000+Math.cos(k)*k*25,y=9500+Math.sin(k)*k*25;let ok=!g.nearSafePort(x,y);for(let dx=-300;dx<=300&&ok;dx+=50)for(let dy=-300;dy<=300;dy+=50)if(g.inAnyIsland(x+dx,y+dy,0)){ok=false;break;}if(ok){g.P.x=x;g.P.y=y;g.P.vx=g.P.vy=0;g.P.speed=0;g.P.throttle=0;g.P.h=0;return [x,y];}}})()"
def touch_drag(cdp,x0,y0,dx,dy,hold_ms,pg):
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0,'id':7}]})
    for k in range(1,8):cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+dx*k/7,'y':y0+dy*k/7,'id':7}]});pg.wait_for_timeout(16)
    pg.wait_for_timeout(hold_ms);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
def rect(pg,sel): return E(pg,f"(()=>{{const r=document.querySelector('{sel}').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}})()")
def ctap(pg,cdp,sel):
    r=rect(pg,sel);x,y=(r[0]+r[2])/2,(r[1]+r[3])/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':3}]});pg.wait_for_timeout(40);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
def waitph(pg,ph,ms=6000):
    pg.wait_for_function(f"__game.B.BR.ph==='{ph}'",timeout=ms)
def overlap(a,b): return not(a[2]<=b[0] or b[2]<=a[0] or a[3]<=b[1] or b[3]<=a[1])
def finish(pg,maxs=120):
    E(pg,"__game.B.BR.auto=true");t=0
    while E(pg,"__game.B.BR.ph")=='fight' and t<maxs: bsim(pg,1);t+=1
    bsim(pg,1.5);return t
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    if not LIVE:
        # 1. migration: old build save + code
        ctx,pg=fresh(b,390,844,{"gold":4321,"crew":33,"tutDone":True,"seen":True,"bal":2,"infamy":5200,"xp":60000,"clvl":40,"sp":2,"wv":2,"unl":40,"forts":{"3":{"o":"p","g":10,"ug":1,"uw":0,"nx":999}},"cos":{"sail":"gold","flag":"def","hull":"def","fx":"def"},"off":{"fm":1,"bo":1}},OLD,'old');start(pg)
        sim(pg,0.3);code=E(pg,"__game.makeCode()");ov=E(pg,"(()=>{const S=__game.S;return{gold:S.gold,crew:S.crew,clvl:S.clvl}})()");E(pg,"__game.X&&0");pg.evaluate("dispatchEvent(new Event('pagehide'))");pg.close()
        pg=inject(ctx,None,"localStorage.getItem('x')",URL,'mig',raw=True) if False else None
        ctx2,pg=fresh(b,390,844,None,tag='mig');pg.close()
        # reuse old origin storage: same origin (127.0.0.1:8765) => new build reads the old save
        pg=ctx.new_page();hook(pg,'mig');pg.goto(URL+'?t=1');pg.wait_for_timeout(700)
        m=E(pg,"(()=>{const g=__game,S=g.S;return{gold:S.gold,crew:S.crew,clvl:S.clvl,fort3:S.forts[3]&&S.forts[3].o,sail:S.cos.sail,off:Object.keys(S.off),cap:S.cap,bst:S.bst,cs:g.B.capStats()}})()")
        print('MIGRATION old save ->',m);print('  old build values',ov);assert m['gold']==ov['gold'] and m['crew']==ov['crew'] and m['clvl']==ov['clvl'] and m['fort3']=='p' and m['cap']['sw']==0 and m['bst']['win']==0
        ds=E(pg,f"JSON.stringify(__game.parseCode({json.dumps(code)}).s)");pg=inject(ctx2,None,ds,URL,'migcode',raw=True)
        mc=E(pg,"(()=>{const S=__game.S;return{gold:S.gold,clvl:S.clvl,cap:S.cap,bst:!!S.bst}})()");print('OLD PSEAS1 code ->',mc);assert mc['gold']==4321 and mc['cap']['pi']==0
        ctx.close();ctx2.close()
    # 2. world: grapple button + tip (portrait)
    ctx,pg=fresh(b,390,844,SAVE0,tag='portrait');start(pg);level(pg,12)
    E(pg,"__game.S.tips.grapple=0");E(pg,WATER)
    E(pg,"(()=>{const g=__game;const e=g.makeEnemy('merchant',g.P.x+95,g.P.y+20,4,{name:'Fat Goose'});e.hp=e.maxHp*0.45;e.h=0;g.enemies.push(e);window.__m=e;})()")
    sim(pg,0.2);pg.wait_for_timeout(350)
    gb=E(pg,"[document.getElementById('grapBtn').className,document.getElementById('grapBtn').textContent,document.getElementById('tipBox').className,document.getElementById('tipTxt').textContent.slice(0,40)]")
    print('GRAPPLE button',gb);assert gb[0]=='' and 'Board' in gb[1] and 'hidden' not in gb[2]
    tipr=rect(pg,'#tipBox');print('  tip box rect',[round(v) for v in tipr])
    pg.screenshot(path=OUT+'01_grapple_button_tip_portrait.png')
    E(pg,"document.getElementById('tipOk').click()");cdp=ctx.new_cdp_session(pg)
    ctap(pg,cdp,'#grapBtn');waitph(pg,'pick');pg.wait_for_timeout(200)
    st=E(pg,"[__game.state,__game.B.BR.ph,__game.B.BR.mode,!!__m.grap]");print('after tap grapple ->',st);assert st[1]=='pick'
    pg.screenshot(path=OUT+'02_tactic_pick_portrait.png')
    pg.locator('#bpTacs button[data-tac="charge"]').tap();pg.wait_for_timeout(300)
    me0=E(pg,"[__game.B.BR.me.x,__game.B.BR.me.y]")
    touch_drag(cdp,120,600,0,-60,700,pg)
    me1=E(pg,"[__game.B.BR.me.x,__game.B.BR.me.y]");print('JOYSTICK move captain',[round(v) for v in me0],'->',[round(v) for v in me1]);assert me1[1]<me0[1]-30
    E(pg,"(()=>{const B=__game.B.BR,me=B.me;const f=B.u.find(u=>u.side===1&&!u.cap&&!u.dead);f.x=me.x;f.y=me.y-30;f.ai.rt=9;window.__f=f;window.__fh=f.hp;})()")
    E(pg,"(()=>{const me=__game.B.BR.me;me.stun=0;me.dash=null;me.hp=me.max;})()")
    for i in range(3): ctap(pg,cdp,'#bSlash');pg.wait_for_timeout(260)
    sl=E(pg,"[Math.round(__fh),Math.round(__f.hp),__f.dead]");print('SLASH x3 (combo) on adjacent foe hp',sl)
    E(pg,"(()=>{const me=__game.B.BR.me;me.stun=0;me.pcd=0;me.blk=0;})()");shots0=E(pg,"__game.B.BR.me.shots");ctap(pg,cdp,'#bPistol');pg.wait_for_timeout(200);shots1=E(pg,"__game.B.BR.me.shots");print('PISTOL shots',shots0,'->',shots1,'button label',E(pg,"document.getElementById('bPn').textContent"))
    E(pg,"(()=>{const me=__game.B.BR.me;me.stun=0;me.dodgeCd=0;})()");ctap(pg,cdp,'#bDodge');pg.wait_for_timeout(50);dg=E(pg,"[__game.B.BR.me.dodge>0||__game.B.BR.me.inv>0,__game.B.BR.me.dodgeCd>0]");print('DODGE',dg)
    pg.wait_for_timeout(500)
    # block / parry: hold the block button while a foe swings
    r=rect(pg,'#bBlock');cx,cy=(r[0]+r[2])/2,(r[1]+r[3])/2
    E(pg,"(()=>{const B=__game.B.BR,me=B.me;for(const u of B.u)if(u.side===1&&!u.cap&&!u.dead&&Math.hypot(u.x-me.x,u.y-me.y)<90){u.x=me.x+(u.x<me.x?-120:120);}let f=B.u.find(u=>u.side===1&&!u.dead&&!u.over);if(!f){__game.B.spawnFighter(1,false);f=B.u[B.u.length-1];}me.inv=0;me.stun=0;me.dodge=0;me.face=-Math.PI/2;f.x=me.x;f.y=me.y-28;f.face=Math.PI/2;f.ai.rt=9;window.__pf=f;window.__p0=__game.S.bst.parry;})()")
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cx,'y':cy,'id':9}]})
    E(pg,"(()=>{const B=__game.B.BR,me=B.me,f=__pf;me.face=-Math.PI/2;f.x=me.x;f.y=me.y-28;f.face=Math.PI/2;f.stun=0;f.cd=0;f.dash=null;f.swing=0.0001;f.sw0=0.1;})()")
    pg.wait_for_timeout(300);blk=E(pg,"[__game.B.BR.me.blk,__game.S.bst.parry-__p0,__pf.stun>0]");cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    print('BLOCK held / parry',blk);pg.screenshot(path=OUT+'03_deck_brawl_portrait.png')
    # hazards: cannon fire from other ships while locked; overboard to sharks
    E(pg,"(()=>{const g=__game;window.__tg=g.B.BR.tg.length;g.P.hp=g.ST().maxHp;})()");E(pg,"__game.X&&0");
    E(pg,"(()=>{const g=__game;g.balls.push({x:g.P.x,y:g.P.y,vx:0,vy:0,life:0.2,dmg:30,owner:'e'});})()");pg.wait_for_timeout(150)
    shiphit=E(pg,"__game.B.BR.tg.some(t=>t.ship)");print('SHIP HIT while locked -> deck impact telegraph',shiphit)
    E(pg,"(()=>{const g=__game,B=g.B.BR;g.sharks.length=0;g.sharks.push(g.makeShark(g.P.x+200,g.P.y+80,6));let f=B.u.find(u=>u.side===1&&!u.cap&&!u.dead&&!u.over);if(!f){g.B.spawnFighter(1,false);f=B.u[B.u.length-1];}f.x=160;f.y=-150;f.inv=0;window.__ob=f;window.__feed=g.S.bst.feed;const me={side:0,x:120,y:-150,face:0,r:10};const R=Math.random;Math.random=()=>0.01;try{g.B.applyHit(me,f,1,900,{});g.B.sim(15);}finally{Math.random=R;}window.__obs=[f.over>0,!!f.eaten];})()")
    pg.wait_for_timeout(1400);ob=E(pg,"[__obs,__ob.dead,__game.S.bst.feed-__feed]");print('OVERBOARD foe (sharks near): over/dead',ob)
    t=finish(pg);pg.wait_for_timeout(300)
    res=E(pg,"[__game.B.BR.ph,__game.B.BR.out,document.getElementById('brTitle').textContent,document.getElementById('brTxt').innerText,[...document.querySelectorAll('#brBtns button')].map(b=>b.textContent+(b.disabled?'(x)':''))]")
    print('RESULT after',t,'s:',res)
    pg.screenshot(path=OUT+'04_result_portrait.png')
    f0=E(pg,"__game.S.fleet.length");crew=E(pg,"__game.S.crew")
    if res[1]=='win':
        pg.locator('#brBtns button[data-br="seize"]').tap();pg.wait_for_timeout(900)
        print('SEIZE -> fleet',f0,'->',E(pg,"__game.S.fleet.length"),'state',E(pg,"__game.state"),'bst',E(pg,"__game.S.bst"))
    else:
        pg.locator('#brBtns button').first.tap();pg.wait_for_timeout(900)
    assert E(pg,"__game.state")=='play'
    # 3. surrender flow still works (plunder)
    E(pg,WATER);E(pg,"(()=>{const g=__game;const e=g.makeEnemy('merchant',g.P.x+300,g.P.y,3);g.enemies.push(e);window.__s=e;})()")
    E(pg,"(()=>{const g=__game,e=__s;g.B.grapCd=0;e.angry=true;e.hp=e.maxHp*0.32;g.balls.push({x:e.x,y:e.y,vx:0,vy:0,life:0.2,dmg:5,owner:'p'});})()");sim(pg,0.1)
    E(pg,"(()=>{const g=__game;__s.x=g.P.x+80;__s.y=g.P.y;})()");sim(pg,0.2);pg.wait_for_timeout(300)
    sb=E(pg,"[!!__s.surr,document.getElementById('boardBar').className,document.getElementById('grapBtn').className]");print('SURRENDER: surr / boardBar / grapBtn',sb)
    g0=E(pg,"__game.S.gold");ctap(pg,cdp,'#boardBtn');pg.wait_for_timeout(200);print('  Plunder tap gold',g0,'->',E(pg,"__game.S.gold"))
    # 4. duel vs clan leader (Mordecai Black, Black Tide)
    level(pg,35);E(pg,"(()=>{const g=__game;g.S.cap.sw=3;g.S.cap.ar=3;g.S.cap.pi=2;g.S.rep[1]=-60;})()");E(pg,WATER)
    E(pg,"(()=>{const g=__game;const e=g.X.spawnLeader(1);g.enemies.length=0;g.enemies.push(e);e.x=g.P.x+90;e.y=g.P.y;e.hp=e.maxHp*0.4;window.__L=e;g.B.grapCd=0;})()");sim(pg,0.2)
    E(pg,"__game.B.grappleStart(__L)");bsim(pg,0.1);sim(pg,1.5);E(pg,"__game.B.sim(40)")
    print('DUEL pick:',E(pg,"[__game.B.BR.mode,document.getElementById('bpTitle').textContent,document.getElementById('bpInfo').textContent.slice(0,90)]"))
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'05_duel_pick_portrait.png')
    pg.locator('#bpTacs button').first.tap();pg.wait_for_timeout(200)
    E(pg,"(()=>{const B=__game.B.BR;B.boss.ai.pt=0;})()")
    for i in range(30):
        bsim(pg,0.1)
        if E(pg,"__game.B.BR.tg.length>0"):break
    pg.wait_for_timeout(120);pg.screenshot(path=OUT+'06_duel_telegraph_portrait.png')
    print('  telegraphs seen',E(pg,"__game.B.BR.tg.map(t=>t.k+(t.ub?'!':''))"),'boss style',E(pg,"__game.B.BR.boss.boss"))
    ld0=E(pg,"__game.X.leadersDown()");t=finish(pg);pg.wait_for_timeout(300);dres=E(pg,"[__game.B.BR.out,document.getElementById('brTitle').textContent]");print('DUEL result',t,'s',dres)
    pg.locator('#brBtns button').first.tap();pg.wait_for_timeout(900);sim(pg,3)
    print('  leaders down',ld0,'->',E(pg,"__game.X.leadersDown()"),'duels won',E(pg,"__game.S.bst.duel"))
    # boss styles: quick render of each pattern
    styles=[]
    for clan in [0,2,3]:
        E(pg,WATER);E(pg,f"(()=>{{const g=__game;const e=g.makeEnemy('clan',g.P.x+90,g.P.y,11,{{clan:{clan},lead:1,name:'X'}});e.hp=e.maxHp*0.4;g.enemies.push(e);window.__L=e;g.B.startBrawl(e,'duel');g.B.sim(40);g.B.chooseTactic('charge');g.B.BR.boss.ai.pt=0;}})()")
        seen=set()
        for i in range(40):
            bsim(pg,0.1);seen|=set(E(pg,"__game.B.BR.tg.map(t=>t.k)"))
        if clan==2: pg.wait_for_timeout(100);pg.screenshot(path=OUT+'07_duel_iron_gull_portrait.png')
        styles.append([E(pg,"__game.B.BR.boss.boss"),sorted(seen)]);finish(pg);E(pg,"__game.B.resChoice('scuttle')");bsim(pg,1)
    print('BOSS STYLES telegraphs',styles)
    # 5. repel boarders (enemy grapples you)
    level(pg,15);E(pg,WATER)
    E(pg,"(()=>{const g=__game;g.B.BR.repT=0;g.B.grapCd=0;const e=g.makeEnemy('pirate',g.P.x+100,g.P.y,8);e.angry=true;g.enemies.push(e);window.__r=e;const R=Math.random;Math.random=()=>0.0;try{g.step(1/60);}finally{Math.random=R;}})()")
    sim(pg,1.0);bsim(pg,0.8);E(pg,"__game.B.sim(40)")
    rp=E(pg,"[__game.state,__game.B.BR.mode,__game.B.BR.ph,document.getElementById('bpTitle').textContent]");print('REPEL trigger ->',rp)
    E(pg,"__game.B.chooseTactic('hold')");bsim(pg,2);pg.wait_for_timeout(120);pg.screenshot(path=OUT+'08_repel_boarders_portrait.png')
    t=finish(pg);print('  repel result',E(pg,"[__game.B.BR.out,document.getElementById('brTitle').textContent]"),t,'s');E(pg,"__game.B.resChoice('scuttle')");bsim(pg,1);print('  repelled count',E(pg,"__game.S.bst.repel"))
    # 6. fort gate raid
    level(pg,30);f=E(pg,"(()=>{const g=__game,X=g.X;const f=X.FORTS.find(f=>X.fortOwner(f)!=='p'&&f.lvl<=10)||X.FORTS[1];return{id:f.id,x:f.x,y:f.y,a:f.a,name:f.name,lvl:f.lvl}})()")
    E(pg,f"(()=>{{const g=__game,X=g.X;g.enemies.length=0;g.sharks.length=0;g.P.x={f['x']}+Math.cos({f['a']})*420;g.P.y={f['y']}+Math.sin({f['a']})*420;g.P.hp=g.ST().maxHp;g.S.crew=40;g.S.infamy=5000;const rt=X.fortRT(X.FORTS[{f['id']}]);rt.wall=rt.wallMax*0.5;rt.guns[0].hp=0;}})()")
    sim(pg,0.3);pg.wait_for_timeout(300);al=E(pg,"[document.getElementById('actBtn').className,document.getElementById('actBtn').textContent]");print('FORT RAID button',al);assert 'Raid' in al[1]
    ctap(pg,cdp,'#actBtn');waitph(pg,'pick')
    print('  raid pick',E(pg,"[__game.B.BR.mode,document.getElementById('bpTitle').textContent]"))
    pg.locator('#bpTacs button[data-tac="pistols"]').tap();bsim(pg,2.5);pg.wait_for_timeout(150);pg.screenshot(path=OUT+'09_fort_raid_courtyard_portrait.png')
    t=finish(pg);fr=E(pg,"[__game.B.BR.out,document.getElementById('brTitle').textContent]");print('  raid result',fr,t,'s')
    pg.locator('#brBtns button').first.tap();pg.wait_for_timeout(900)
    print('  fort owner ->',E(pg,f"__game.X.fortOwner(__game.X.FORTS[{f['id']}])"),'gates stormed',E(pg,"__game.S.bst.raid"))
    # 7. arms tab at a haven + lawful port
    hv=E(pg,"__game.PORTS.findIndex(p=>p.haven&&!p.outer)");E(pg,f"__game.dock({hv})");pg.wait_for_timeout(200)
    pg.locator('#pTabs button[data-tab="arms"]').tap();pg.wait_for_timeout(200);pg.screenshot(path=OUT+'10_arms_tab_portrait.png')
    cs0=E(pg,"__game.B.capStats()");E(pg,"(()=>{const g=__game;g.S.cap.sty='';g.S.cap.sw=1;g.S.cap.cw=0;g.setTab('arms');})()")
    for sel in ['button[data-act="sty"][data-arg="duel"]','button[data-act="gear"][data-arg="sw:2"]','button[data-act="crewg"][data-arg="tr"]','button[data-act="crewg"][data-arg="cw"]']:
        pg.locator('#pBody '+sel).first.tap();pg.wait_for_timeout(120)
    cs1=E(pg,"[__game.S.cap,__game.B.capStats(),__game.B.crewStats()]");print('ARMS buy: style/sword/training/weapons ->',cs1[0],'dmg',round(cs0['dmg'],1),'->',round(cs1[1]['dmg'],1),'parry',cs1[1]['parry'])
    lw=E(pg,"__game.PORTS.findIndex(p=>!p.haven&&!p.outer)");E(pg,"__game.leavePort()");E(pg,f"__game.dock({lw})");E(pg,"__game.setTab('arms')");print('  lawful port arms note:',E(pg,"document.getElementById('pBody').textContent.includes('Havens only')"))
    E(pg,"__game.leavePort()")
    # 8. level-up messages, unlock table, trophies, log row, PSEAS1 round-trip
    lv=E(pg,"(()=>{const g=__game;const u=g.X.unlockTable().filter(r=>r[1].some(x=>/styles|Saber|Cutlass|Rapier|Kraken Blade|Pistol|Double|Jerkin|Coat|Cuirass|Plate/.test(x)));return u})()");print('UNLOCKS (boarding):',lv)
    E(pg,"(()=>{const g=__game;g.S.xp=0;g.S.clvl=1;g.S.sp=0;let need=0;for(let k=1;k<5;k++)need+=g.X.xpNeed(k);g.grantXP(need);})()");print('LEVEL 5 toast:',E(pg,"document.getElementById('toast').textContent"))
    level(pg,35);E(pg,"__game.S.ach={}");E(pg,"__game.progTick()")
    tro=E(pg,"['board1','duel1','repel5','raid1','parry50','ko100','feed'].map(k=>k+':'+(__game.S.ach[k]?1:0))");print('TROPHIES',tro,'bst',E(pg,"__game.S.bst"))
    E(pg,"__game.S.bst.parry=50;__game.S.bst.ko=100;__game.S.bst.repel=5;");E(pg,"__game.progTick()")
    print('  after counters',E(pg,"['parry50','ko100','repel5'].map(k=>k+':'+(__game.S.ach[k]?1:0))"),'total trophies',E(pg,"Object.keys(__game.S.ach).length"))
    E(pg,"document.getElementById('menuBtn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.getElementById('menuBtn').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))");pg.wait_for_timeout(250)
    print('LOG captain row:',E(pg,"(document.getElementById('mBody').textContent.match(/⚔️ Captain[^🏴]*/)||[''])[0].slice(0,140)"));E(pg,"document.getElementById('mClose').click()");pg.wait_for_timeout(150)
    code=E(pg,"__game.makeCode()");rt=E(pg,f"(()=>{{const d=__game.parseCode({json.dumps(code)}).s;return{{cap:d.cap,bst:d.bst}}}})()");print('PSEAS1 round-trip:',rt);assert rt['cap']==E(pg,"__game.S.cap")
    ctx2,pg2=fresh(b,390,844,None,tag='import');ds=E(pg2,f"JSON.stringify(__game.parseCode({json.dumps(code)}).s)");pg2=inject(ctx2,pg2,ds,URL,'import',raw=True)
    print('  imported in fresh browser:',E(pg2,"[JSON.stringify(__game.S.cap),__game.S.bst.win,__game.S.bst.duel]"));ctx2.close()
    # 8b. risky grapple fail / success at full HP, then a lost fight
    level(pg,20);E(pg,WATER);E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x+90,g.P.y,7);g.enemies.push(e);window.__q=e;g.B.grapCd=0;})()");sim(pg,0.1)
    rk=E(pg,"(()=>{const g=__game,R=Math.random;Math.random=()=>0.01;let r;try{g.B.grappleStart(__q);}finally{Math.random=R;}return 1})()");sim(pg,0.6);rk=E(pg,"[__game.state,!!__q.grap,document.getElementById('toast').textContent.slice(0,40)]")
    print('RISKY grapple (full HP) forced fail ->',rk,'| grapCd blocks retry:',E(pg,"(()=>{__game.B.grappleStart(__q);return __game.state})()"))
    E(pg,"__game.B.grapCd=0;__q.x=__game.P.x+90;__q.y=__game.P.y;__q.vx=__q.vy=0;");E(pg,"(()=>{const g=__game,R=Math.random;Math.random=()=>0.99;try{g.B.grappleStart(__q);}finally{Math.random=R;}})()");sim(pg,1.4);E(pg,"__game.B.sim(40)")
    print('  forced success ->',E(pg,"[__game.state,__game.B.BR.ph,__game.B.BR.sides[1].pool]"))
    E(pg,"__game.B.chooseTactic('charge')");c0=E(pg,"__game.S.crew");E(pg,"(()=>{const me=__game.B.BR.me;me.hp=0;})()");bsim(pg,0.3);E(pg,"(()=>{const me=__game.B.BR.me;if(!me.dead){me.hp=-1;}})()");bsim(pg,2.5)
    print('  LOSS ->',E(pg,"[__game.B.BR.out,document.getElementById('brTitle').textContent]"),'crew',c0,'->',E(pg,"__game.S.crew"),'losses',E(pg,"__game.S.bst.loss"))
    E(pg,"__game.B.resChoice('ok')");pg.locator('#brBtns button').first.tap() if E(pg,"__game.B.BR.ph")=='res' else None;pg.wait_for_timeout(900);print('  state after loss',E(pg,"__game.state"),'hull',E(pg,"Math.round(__game.P.hp)"))
    # 9. FPS portrait: brawl in real time
    level(pg,25);E(pg,WATER);E(pg,"(()=>{const g=__game;g.B.grapCd=0;const e=g.makeEnemy('clan',g.P.x+90,g.P.y,9,{clan:0});e.hp=e.maxHp;g.enemies.push(e);g.B.startBrawl(e,'deck');})()");pg.wait_for_timeout(900)
    E(pg,"__game.B.chooseTactic('charge');__game.B.BR.auto=true");fp=fps(pg,4000);ent=E(pg,"[__game.B.BR.u.filter(u=>!u.dead).length,__game.B.BR.fx.length,__game.enemies.length]");print('FPS portrait brawl [avg, worst, top5]:',fp,'units/fx/world enemies',ent)
    finish(pg);E(pg,"__game.B.resChoice('scuttle')");pg.wait_for_timeout(800)
    fps2=fps(pg,3000);print('FPS portrait sailing after brawl:',fps2)
    ctx.close()
    # 10. landscape: brawl + controls layout + desktop keyboard
    ctx,pg=fresh(b,844,390,SAVE0,tag='landscape');start(pg);level(pg,20);E(pg,WATER)
    E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x+90,g.P.y,7);e.hp=e.maxHp*0.4;g.enemies.push(e);window.__e=e;})()");sim(pg,0.2);pg.wait_for_timeout(300)
    print('LANDSCAPE grapple button',[round(v) for v in rect(pg,'#grapBtn')],E(pg,"document.getElementById('grapBtn').className"))
    cdp=ctx.new_cdp_session(pg);ctap(pg,cdp,'#grapBtn');waitph(pg,'pick');pg.wait_for_timeout(200);pg.screenshot(path=OUT+'11_pick_landscape.png')
    pk=E(pg,"(()=>{const p=document.querySelector('#brPick .panel');return[p.scrollHeight,p.clientHeight,innerHeight]})()");print('  pick panel scroll/client/vh',pk)
    pg.locator('#bpTacs button[data-tac="hold"]').tap();pg.wait_for_timeout(1500);pg.screenshot(path=OUT+'12_deck_brawl_landscape.png')
    ids=['#bSlash','#bBlock','#bPistol','#bDodge','#bCut','#hud'];rs={i:rect(pg,i) for i in ids};ov=[(a,c) for i,a in enumerate(ids) for c in ids[i+1:] if overlap(rs[a],rs[c])]
    vis=E(pg,"['fireL','fireR','boostBtn','autoBtn','menuBtn','ammoBtn'].filter(i=>getComputedStyle(document.getElementById(i)).display!=='none')")
    print('  landscape brawl button overlaps',ov,'| sea buttons still visible:',vis,'| in-screen',all(0<=rs[i][0] and rs[i][2]<=844 and 0<=rs[i][1] and rs[i][3]<=390 for i in ids))
    fp=fps(pg,4000);print('FPS landscape brawl [avg, worst, top5]:',fp)
    finish(pg);E(pg,"__game.B.resChoice('scuttle')");pg.wait_for_timeout(800);ctx.close()
    # portrait button overlap check
    ctx,pg=fresh(b,360,740,SAVE0,tag='p360');start(pg);level(pg,10);E(pg,WATER);E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x+90,g.P.y,4);e.hp=e.maxHp*0.4;g.enemies.push(e);g.B.startBrawl(e,'deck');})()");pg.wait_for_timeout(900)
    E(pg,"__game.B.chooseTactic('charge')");pg.wait_for_timeout(300);ids=['#bSlash','#bBlock','#bPistol','#bDodge','#bCut','#hud'];rs={i:rect(pg,i) for i in ids}
    print('PORTRAIT 360x740 brawl overlaps',[(a,c) for i,a in enumerate(ids) for c in ids[i+1:] if overlap(rs[a],rs[c])]);pg.screenshot(path=OUT+'13_deck_brawl_360x740.png');ctx.close()
    # desktop keyboard
    ctx,pg=fresh(b,1280,800,SAVE0,tag='desktop',touch=False);start(pg);level(pg,20);E(pg,WATER)
    E(pg,"(()=>{const g=__game;const e=g.makeEnemy('pirate',g.P.x+90,g.P.y,7);e.hp=e.maxHp*0.4;g.enemies.push(e);})()");sim(pg,0.2);pg.wait_for_timeout(200)
    pg.keyboard.press('g');waitph(pg,'pick');ph=E(pg,"__game.B.BR.ph");pg.keyboard.press('1');pg.wait_for_timeout(200)
    y0=E(pg,"__game.B.BR.me.y");pg.keyboard.down('w');pg.wait_for_timeout(500);pg.keyboard.up('w');y1=E(pg,"__game.B.BR.me.y")
    E(pg,"(()=>{const me=__game.B.BR.me;me.stun=0;me.dash=null;me.cd=0;})()");pg.keyboard.press('j');pg.wait_for_timeout(50);sw=E(pg,"__game.B.BR.me.swing>0||__game.B.BR.me.comboT>0")
    pg.keyboard.down('k');pg.wait_for_timeout(120);bk=E(pg,"__game.B.BR.me.blk");pg.keyboard.up('k')
    s0=E(pg,"__game.B.BR.me.shots");pg.keyboard.press('l');pg.wait_for_timeout(80);s1=E(pg,"__game.B.BR.me.shots")
    pg.wait_for_timeout(400);pg.keyboard.press('Shift');pg.wait_for_timeout(60);dd=E(pg,"__game.B.BR.me.dodgeCd>0")
    pg.screenshot(path=OUT+'14_desktop_brawl.png')
    pg.keyboard.press('x');pg.wait_for_timeout(100);pg.keyboard.press('x');pg.wait_for_timeout(1600);out=E(pg,"[__game.B.BR.out,document.getElementById('brTitle').textContent]")
    print('KEYBOARD: G grapple->',ph,'| W moved',round(y0-y1),'| J swing',sw,'| K block',bk,'| L shots',s0,'->',s1,'| Shift dodge',dd,'| X X ->',out)
    pg.keyboard.press('Enter');pg.wait_for_timeout(800);print('  Enter closes result -> state',E(pg,"__game.state"));ctx.close()
    print('ERRORS:',len(errs),errs[:6])
