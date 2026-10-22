import json,sys,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
OUT='/workspace/pirate-game/screenshots-hard/'
errs=[];fails=[]
def chk(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL+'?t=1');pg.wait_for_timeout(600);pg.click('#startBtn');pg.wait_for_timeout(300)
    E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    E("(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}g.S.tutDone=true;g.S.clvl=30;})()")
    # distribution by distance from havens
    d=E("""(()=>{const g=__game,H=g.HARD;const hv=g.PORTS.find(p=>p.haven);const R=H.SREG[1];
     const bands={near:[hv.port.x+900,hv.port.y],mid:null,far:[R.cx+900,R.cy]};
     // find a mid-water point 3000-5000 from every haven
     for(let x=600;x<24000&&!bands.mid;x+=400)for(let y=600;y<24000;y+=400){const dd=H.havenDist(x,y);if(dd>3200&&dd<4800&&!H.regionAt(x,y)){bands.mid=[x,y];break;}}
     window.__mid=bands.mid;const out={};for(const k in bands){const [x,y]=bands[k];const c={'':0,frigate:0,galleon:0,iron:0};for(let i=0;i<400;i++){const e=g.makeEnemy('navy',x,y,k==='near'?3:k==='mid'?8:14);c[e.cls||'']++;}out[k]=c;}return out;})()""")
    print(json.dumps(d));MID=E('window.__mid')
    chk(d['near']['']==400,'near havens: only plain sloops (no frigates/galleons/ironclads)')
    mh=d['mid']['galleon']+d['mid']['iron'];chk(d['mid']['frigate']>120 and 8<=mh<=52 and d['mid']['iron']>0,'mid waters: frigates the staple, rare galleon/ironclad sprinkle (%.1f%%)'%(mh/4))
    sq=E("""(()=>{const g=__game,H=g.HARD;let n=0;for(let i=0;i<300;i++){const e=g.makeEnemy('navy',%d,%d,8,{forceCls:'galleon'});if(e.sqd)n++;}return n;})()"""%tuple(MID))
    chk(sq==0,'no squadrons (swarms) in mid waters')
    chk(d['far']['galleon']+d['far']['iron']>220 and d['far']['frigate']>40,'outer/story waters: galleons & ironclads OFTEN (%.0f%%), frigates mixed in'%((d['far']['galleon']+d['far']['iron'])/4))
    s=E("""(()=>{const g=__game,H=g.HARD;const mk=c=>{const e=g.makeEnemy('navy',5000,5000,14,{forceCls:c||undefined});return e;};
     const r={};for(const c of ['','frigate','galleon','iron']){let a={hp:0,sp:0,rg:0,dm:0,can:0,turn:0};for(let i=0;i<60;i++){const e=c?mk(c):(()=>{const e=g.makeEnemy('navy',5000,5000,14);return e.cls?null:e;})();if(!e){i--;continue;}a.hp+=e.maxHp/60;a.sp+=e.maxSpeed/60;a.rg+=e.range/60;a.dm+=e.dmg/60;a.can+=e.cannons/60;a.turn+=(e.turnK||1)/60;}r[c||'sloop']=a;}return r;})()""")
    print(json.dumps({k:{a:round(v,2) for a,v in s[k].items()} for k in s}))
    chk(s['frigate']['sp']>s['sloop']['sp']*1.1 and s['frigate']['turn']>1.2,'frigate faster & more agile than base')
    chk(s['galleon']['rg']>s['sloop']['rg']*1.25 and s['galleon']['hp']>s['sloop']['hp']*1.6 and s['galleon']['sp']<s['sloop']['sp'] and s['galleon']['can']>s['sloop']['can'],'galleon: long range, big hull, more guns, slower')
    chk(s['iron']['hp']>s['sloop']['hp']*1.3 and s['iron']['sp']<s['sloop']['sp'],'ironclad: tough & slow-ish')
    a=E("""(()=>{const H=__game.HARD,e={cls:'iron'};return [H.ironK(e,{}),H.ironK(e,{am:'fire'}),H.ironK(e,{mort:1}),H.ironK({cls:'galleon'},{}),H.foeCrewK({cls:'iron',kind:'navy'},'ship').hp/H.foeCrewK({kind:'navy'},'ship').hp];})()""")
    chk(a[0]<0.5 and a[1]>1 and a[2]>1 and a[3]==1 and a[4]<0.9,'iron armor: round shot x%.2f, fire x%.2f, mortar x%.2f; boarding crew x%.2f'%(a[0],a[1],a[2],a[4]))
    # ram: telegraph then charge then damage
    r=E("""(()=>{const g=__game,H=g.HARD;g.enemies.length=0;g.P.x=12000;g.P.y=12000;g.P.vx=g.P.vy=0;g.P.h=Math.PI/2;g.P.dead=0;g.P.hp=g.P.maxHp=3000;
      const e=g.makeEnemy('navy',12000-420,12000,14,{forceCls:'iron'});e.h=0;e.angry=true;e.ramCd=0;e.ai='x';g.enemies.push(e);const hp0=g.P.hp;
      H.ironTick(0.016);const w=e.ramW;let charged=false,hit=false,t=0;for(;t<4;t+=1/60){H.ironTick(1/60);if(e.ramT>0)charged=true;if(g.P.hp<hp0){hit=true;break;}}
      return {w,charged,hit,dmg:Math.round(hp0-g.P.hp),t,cd:e.ramCd,label:document.body?1:0};})()""")
    print(r);chk(r['w']>1 and r['charged'] and r['hit'] and r['dmg']>80,'ironclad ram: %.2fs wind-up telegraph, then charge hits for %d'%(r['w'],r['dmg']))
    r2=E("""(()=>{const g=__game,H=g.HARD;g.enemies.length=0;g.P.x=12000;g.P.y=12000;g.P.dead=0;g.P.maxHp=g.P.hp=3000;
      const e=g.makeEnemy('navy',12000-420,12000,14,{forceCls:'iron'});e.h=0;e.angry=true;e.ramCd=0;g.enemies.push(e);const hp0=g.P.hp;H.ironTick(0.016);
      g.P.y+=260; let hit=false;for(let t=0;t<4;t+=1/60){H.ironTick(1/60);if(g.P.hp<hp0){hit=true;break;}}return {hit,cd:e.ramCd,h:e.h,ex:e.x,ey:e.y,py:g.P.y,w:e.ramW,t:e.ramT};})()""")
    print(r2);chk(not r2['hit'] and r2['cd']>0,'dodging out of the telegraph avoids the ram (cooldown after)')
    q=E("""(()=>{const g=__game,H=g.HARD;g.enemies.length=0;const e=g.makeEnemy('navy',12000,12600,14,{forceCls:'galleon'});e.sqd=1;g.enemies.push(e);H.squadTick();return g.enemies.map(x=>x.cls);})()""")
    chk(len(q)==3 and q.count('frigate')==2,'galleon squadron spawns frigate escorts: %s'%q)
    # labels + screenshots of each class
    W=E("(()=>{const H=__game.HARD,R=H.SREG[1];return H.waterNear(R.cx-1800,R.cy+1500,0,400);})()")
    for c in ['frigate','galleon','iron']:
        lab=E("""(([c,x,y])=>{const g=__game,H=g.HARD;g.S.tips.ram=1;document.querySelectorAll('.toast,#tip').forEach(n=>n.style.display='none');g.enemies.length=0;g.balls.length=0;g.P.x=x;g.P.y=y+120;g.P.hp=g.P.maxHp;g.P.vx=g.P.vy=0;g.P.h=-Math.PI/2;
          const e=g.makeEnemy('navy',x+40,y-60,14,{forceCls:c});e.h=Math.PI*0.8;g.enemies.push(e);e.maxSpeed=8;e.ramCd=99;
          for(const o of g.enemies){o.reload=99;o.cool=99;}return H.vetTag(e);})""",[c,W['x'],W['y']])
        pg.add_style_tag(content='#tipBox,#toast{display:none!important}');pg.wait_for_timeout(1600)
        if c=='iron': E("(()=>{const e=__game.enemies[0];e.ramW=0.35;e.ramH=e.h;})()");pg.wait_for_timeout(120)
        pg.screenshot(path=OUT+'class_'+c+'.png')
        nm={'frigate':'Frigate','galleon':'Galleon','iron':'Ironclad'}[c]
        chk(nm in lab,'%s class name shown on target label (%s)'%(nm,lab))
    print('console errors:',errs);chk(not errs,'0 console errors')
    b.close()
print('FAILS',fails);sys.exit(1 if fails else 0)
