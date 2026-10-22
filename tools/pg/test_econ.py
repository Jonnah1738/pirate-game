import json,sys,math,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OLD='http://127.0.0.1:8765/old_econ_t.html'
OUT='/workspace/pirate-game/screenshots-econ/'+('live_' if LIVE else '');os.makedirs('/workspace/pirate-game/screenshots-econ',exist_ok=True)
E=lambda pg,js,arg=None: pg.evaluate(js,arg) if arg is not None else pg.evaluate(js)
errs=[];fails=[]
def chk(c,msg):
    print(('PASS ' if c else 'FAIL ')+msg)
    if not c: fails.append(msg)
def hook(pg,tag):
    pg.on('console',lambda m: errs.append(f'[{tag}] {m.type}: {m.text}') if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(f'[{tag}] {e}'))
SAVE={"gold":200000,"crew":60,"tutDone":True,"seen":True,"bal":2,"infamy":9000,"xp":0,"clvl":1,"ship":"galleon","up":{"hull":8,"sails":6,"cannons":8,"cargo":8,"rigging":2,"command":1},"roles":{"gunner":3,"sailor":2,"carpenter":3,"navigator":2},"wv":2,"tips":{"republic":1,"fort":1,"ammo":1,"merchant":1,"shark":1,"wanted":1,"board":1,"boardnews":1}}
def page(b,url,save,tag,w=390,h=844):
    ctx=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page();hook(pg,tag)
    if save is not None: pg.add_init_script("if(!sessionStorage.getItem('inj')){sessionStorage.setItem('inj','1');localStorage.setItem('pirateSeas_save_v1',%s);}"%json.dumps(json.dumps(save)))
    pg.goto(url+('&' if '?' in url else '?')+'t=1');pg.wait_for_timeout(500);return ctx,pg
def start(pg):
    pg.click('#startBtn');pg.wait_for_timeout(300)
    E(pg,"(()=>{const g=__game;if(g.T.on){g.T.on=false;document.getElementById('tut').classList.add('hidden');}})()")
ANALYTIC="""(()=>{const g=__game,X=g.ECON,S=g.S,NEW=!!X.ECO;const P=g.PORTS;S.vis=P.map((p,i)=>i);S.gold=1e7;S.off=Object.assign(S.off||{},{qm:1,ca:1});S.sk.plun=9;S.rep=[0,0,0,0];S.heat=0;
 for(const k in S.cargo)S.cargo[k]=0;S.quests=[];const cap=g.ST().cargoCap;const hav=P.map((p,i)=>i).filter(i=>P[i].haven);const G=['rum','sugar','spice','silk','gems','teeth'];
 const hop={},hopG={},hopE={};
 for(const A of hav){g.dock(A);const mk=X.mk();for(let pt=0;pt<565;pt+=70){S.playTime=pt;
  for(const B of hav){if(B===A)continue;const key=A+'>'+B;const empty=-X.ftCost(B);hopE[key]=Math.max(hopE[key]??-1e9,empty);if(hop[key]==null||hop[key].p<empty)hop[key]={p:empty,gi:-1,n:0,pt};
   for(let gi=0;gi<6;gi++){if(NEW){S.eco.p={};S.eco.q={};S.eco.hot=X.hotOk(gi,B)?[{g:gi,p:B,u:1e12}]:[];}
    const capB=NEW?X.capOf(B,gi):1e9;let bs=0,ss=0;
    for(let n=1;n<=cap;n++){bs+=Math.ceil(X.price(A,gi,n-1)*mk);if(n<=capB)ss+=X.sellPrice(B,gi,n-1);S.cargo[G[gi]]=n;const t=X.ftCost(B);S.cargo[G[gi]]=0;const pr=ss-bs-t;
     if(hop[key].p<pr)hop[key]={p:pr,gi,n,pt};if(gi===4&&(hopG[key]==null||hopG[key].p<pr))hopG[key]={p:pr,n,pt};}}
   if(NEW){S.eco.hot=[];}}}}
 let best=null,bestG=null,bestHop=null,bestHopG=null;
 for(const k in hop){if(!bestHop||hop[k].p>bestHop.p)bestHop=Object.assign({k},hop[k]);if(!bestHopG||hopG[k].p>bestHopG.p)bestHopG=Object.assign({k},hopG[k]);
  const [a,b]=k.split('>');const back=hop[b+'>'+a];const lp=hop[k].p+back.p;if(!best||lp>best.p)best={p:lp,k,out:hop[k],back};
  const bg=Math.max(hopG[b+'>'+a].p,hopE[b+'>'+a]);const lg2=hopG[k].p+bg;if(!bestG||lg2>bestG.p)bestG={p:lg2,k,out:hopG[k],back:bg};}
 const nm=k=>k.split('>').map(i=>P[+i].name).join(' → ');
 return {NEW,cap,bestLoop:{p:best.p,route:nm(best.k),out:best.out,back:best.back},bestGemLoop:{p:bestG.p,route:nm(bestG.k),out:bestG.out,back:bestG.back},bestHop:{p:bestHop.p,route:nm(bestHop.k),gi:bestHop.gi,n:bestHop.n},bestGemHop:{p:bestHopG.p,route:nm(bestHopG.k),n:bestHopG.n,k:bestHopG.k}};})()"""
REAL="""((a)=>{const g=__game,X=g.ECON,S=g.S,NEW=!!X.ECO;const [A,B]=a.k.split('>').map(Number);S.vis=g.PORTS.map((p,i)=>i);S.gold=100000;for(const k in S.cargo)S.cargo[k]=0;
 if(NEW){S.eco.p={};S.eco.q={};S.eco.hot=[];S.ftT=0;}const g0=S.gold;const log=[];g.dock(A);
 for(let i=0;i<a.loops;i++){X.portAction('buy','4:'+a.n);const nb=S.cargo.gems;if(NEW)X.ecoTick(a.wait/2);X.fastTravel(B);if(X.curPort!==B){log.push('ft fail');break;}X.portAction('sell','4:all');const left=S.cargo.gems;if(NEW)X.ecoTick(a.wait);
  X.fastTravel(A);if(X.curPort!==A){log.push('ft back fail');break;}if(NEW)X.ecoTick(a.wait/2);log.push([nb,left,S.gold-g0]);}
 return {net:S.gold-g0,log};})"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    res={}
    if not LIVE:
        ctx,pg=page(b,OLD,SAVE,'old');start(pg)
        old=E(pg,ANALYTIC);print('OLD analytic',json.dumps(old))
        oldReal=E(pg,REAL,{'k':old['bestGemHop']['k'],'n':999,'loops':3,'wait':0});print('OLD real gem loop (3 round trips, buy full hold)',json.dumps(oldReal))
        res['old']=old;res['oldReal']=oldReal;ctx.close()
    ctx,pg=page(b,URL,SAVE,'new');start(pg)
    new=E(pg,ANALYTIC);print('NEW analytic',json.dumps(new))
    cd=E(pg,"__game.ECON.ECO.FT_CD")
    chk(new['bestGemLoop']['p']<=0,f"haven<->haven gem loop unprofitable: best round trip {new['bestGemLoop']['p']} ({new['bestGemLoop']['route']})")
    chk(new['bestGemHop']['p']<=0,f"best single gem fast-travel hop {new['bestGemHop']['p']}")
    perH=new['bestLoop']['p']/(2*cd)*3600
    print(f"best ANY-good FT round trip (worst-case hot spot at destination): {new['bestLoop']['p']} per {2*cd}s => {round(perH)}/h ; route {new['bestLoop']['route']} out={new['bestLoop']['out']} back={new['bestLoop']['back']}")
    for n in (4,12,999):
        r=E(pg,REAL,{'k':new['bestGemHop']['k'],'n':n,'loops':3,'wait':cd});print(f'NEW real gem loop buy {n}:',json.dumps(r))
        chk(r['net']<0,f'real in-game gem FT loop (buy {n}) loses money: {r["net"]}')
    res['new']=new
    E(pg,"(()=>{const g=__game,S=g.S;S.eco.p={};S.eco.q={};S.eco.hot=[];g.dock(0);for(const k in S.cargo)S.cargo[k]=0;S.cargo.gems=40;})()")
    pr=E(pg,"""(()=>{const g=__game,X=g.ECON,S=g.S,c=X.curPort;const r={};r.s0=X.sellPrice(c,4);X.portAction('sell','4');r.s1=X.sellPrice(c,4);for(let i=0;i<5;i++)X.portAction('sell','4');r.s6=X.sellPrice(c,4);
     X.portAction('sell','4:all');r.sFloor=X.sellPrice(c,4);r.floorRatio=r.sFloor/r.s0;r.sold=40-S.cargo.gems;X.ecoTick(110);r.s110=X.sellPrice(c,4);X.ecoTick(190);r.s300=X.sellPrice(c,4);X.ecoTick(300);r.s600=X.sellPrice(c,4);
     r.b0=X.price(c,0);X.portAction('buy','0:8');r.b8=X.price(c,0);X.ecoTick(300);r.b300=X.price(c,0);return r;})()""")
    print('prices',pr)
    chk(abs(pr['s1']/pr['s0']-0.92)<0.02,f"one gem sale drops price ~8%: {pr['s0']}->{pr['s1']}")
    chk(pr['s6']<pr['s0']*0.65,f"six gem sales: {pr['s6']}")
    chk(0.34<=pr['floorRatio']<=0.42,f"floor ratio {pr['floorRatio']:.2f}")
    chk(pr['s110']>pr['sFloor'] and pr['s300']>pr['s110'] and pr['s600']>=pr['s0']*0.95,f"recovery {pr['sFloor']}->{pr['s110']}(110s)->{pr['s300']}(5m)->{pr['s600']}(10m)")
    chk(pr['b8']>pr['b0']*1.12 and pr['b300']<pr['b8'],f"buying 8 rum raises buy {pr['b0']}->{pr['b8']}, recovers to {pr['b300']}")
    cp=E(pg,"""(()=>{const g=__game,X=g.ECON,S=g.S;S.eco.p={};S.eco.q={};S.eco.hot=[];S.eco.t=Math.floor(S.eco.t/600)*600+5;S.eco.d=Math.floor(S.eco.t/600);g.dock(2);const c=X.curPort;S.cargo.gems=30;const r={cap:X.capOf(c,4)};
     X.portAction('sell','4:all');r.left1=X.capLeft(c,4);r.gemsLeft=S.cargo.gems;r.toast1=document.getElementById('toast').textContent;X.portAction('sell','4');r.toast2=document.getElementById('toast').textContent;r.gemsAfter=S.cargo.gems;
     g.setTab('market');r.html=document.getElementById('pBody').innerHTML.includes('Full up today');X.ecoTick(X.dayLeft()+1);r.leftNewDay=X.capLeft(c,4);return r;})()""")
    print('caps',{k:v for k,v in cp.items() if k!='html'})
    chk(cp['gemsLeft']==30-cp['cap'] and cp['left1']==0,f"port bought only {cp['cap']} gems then stopped")
    chk("full up, captain" in cp['toast2'] and cp['gemsAfter']==cp['gemsLeft'],"refuses with \"We're full up, captain\"")
    chk(cp['html'] and cp['leftNewDay']==cp['cap'],"market shows 'Full up today'; resets next day")
    ft=E(pg,"""(()=>{const g=__game,X=g.ECON,S=g.S;S.vis=g.PORTS.map((p,i)=>i);S.ftT=0;S.off={};for(const k in S.cargo)S.cargo[k]=0;g.dock(0);const r={};r.e1=X.ftCost(1);S.cargo.gems=50;r.f1=X.ftCost(1);r.e4=(S.cargo.gems=0,X.ftCost(4));S.cargo.gems=50;
     const g0=S.gold;X.fastTravel(1);r.port=X.curPort;r.paid=g0-S.gold;r.wait=X.ftWait();const b=[...document.querySelectorAll('#pBody button')].find(x=>x.hasAttribute('data-ftcd'));r.btn=b?b.textContent:'';r.btnDis=b?b.disabled:null;
     r.note=/Crew resting/.test(document.getElementById('pBody').innerHTML);X.fastTravel(0);r.port2=X.curPort;X.ecoTick(60);r.wait60=X.ftWait();X.ecoTick(46);X.renderPort();X.fastTravel(0);r.port3=X.curPort;return r;})()""")
    print('fasttravel',ft)
    chk(ft['f1']>ft['e1']+400,f"toll grows with cargo: empty {ft['e1']} vs 50 gems {ft['f1']}")
    chk(ft['e4']!=ft['e1'],f"toll scales with distance: {ft['e1']} vs {ft['e4']}")
    chk(ft['port']==1 and ft['paid']==ft['f1'] and abs(ft['wait']-cd)<0.5,f"travel charged {ft['paid']}, cooldown {ft['wait']}s")
    chk(ft['btn'].startswith('⏳') and ft['btnDis'] and ft['note'],f"button shows cooldown '{ft['btn']}'")
    chk(ft['port2']==1 and ft['port3']==0,f"blocked during cooldown, allowed after (ports {ft['port2']},{ft['port3']})")
    hs=E(pg,"""(()=>{const g=__game,X=g.ECON,S=g.S,P=g.PORTS;S.eco.hot=[];X.ecoTick(0.1);const r={n:S.eco.hot.length,moves:0,gemPorts:{},gemHaven:0,durs:[],samePort:0};
     let last=S.eco.hot.map(h=>({...h,s:S.eco.t}));for(let i=0;i<1440*2;i++){g.P.x=P[(i/200|0)%P.length].port.x;g.P.y=P[(i/200|0)%P.length].port.y;X.ecoTick(2.5);
      S.eco.hot.forEach((h,j)=>{const o=last[j];if(o.u!==h.u){r.moves++;r.durs.push(Math.round(o.u-o.s));if(h.g===o.g&&h.p===o.p)r.samePort++;last[j]={...h,s:S.eco.t};}if(h.g===4){r.gemPorts[P[h.p].name]=1;if(P[h.p].haven)r.gemHaven++;}});}
     r.gemPorts=Object.keys(r.gemPorts);r.minD=Math.min(...r.durs);r.maxD=Math.max(...r.durs);r.durs=r.durs.length;
     g.dock(3);g.setTab('market');const h=document.getElementById('pBody').innerHTML;r.rumour=S.eco.hot.slice(0,3).every(x=>h.includes(P[x.p].name));r.hot=S.eco.hot.map(x=>[x.g,P[x.p].name]);return r;})()""")
    print('hot spots',hs)
    chk(hs['n']==3 and hs['moves']>=20 and hs['samePort']==0,f"3 hot spots, moved {hs['moves']}x in 2h sim, never to the same port")
    chk(240<=hs['minD'] and hs['maxD']<=425,f"durations {hs['minD']}-{hs['maxD']}s")
    chk(hs['gemHaven']==0 and len(hs['gemPorts'])>=3,f"gem demand never at a haven; visited {hs['gemPorts']}")
    chk(hs['rumour'],"tavern rumours name every current hot spot")
    E(pg,"""(()=>{const g=__game,X=g.ECON,S=g.S;S.eco.p={};S.eco.q={};S.eco.hot=[{g:2,p:9,u:S.eco.t+300},{g:4,p:2,u:S.eco.t+100},{g:1,p:14,u:S.eco.t+380}];S.ftT=0;g.dock(1);for(const k in S.cargo)S.cargo[k]=0;S.cargo.gems=16;S.cargo.spice=20;S.cargo.rum=30;
      X.portAction('sell','0:all');X.portAction('sell','4:all');X.portAction('sell','2');X.portAction('sell','2');X.portAction('buy','1:12');X.ecoTick(20);g.setTab('market');})()""")
    pg.wait_for_timeout(250);pg.screenshot(path=OUT+'market_trends_caps.png')
    E(pg,"(()=>{const hs=[...document.querySelectorAll('#pBody h3')];const h=hs.find(x=>/rumour/i.test(x.textContent));h&&h.scrollIntoView();})()");pg.wait_for_timeout(150);pg.screenshot(path=OUT+'market_rumours.png')
    E(pg,"(()=>{const g=__game,S=g.S;S.cargo.silk=10;S.cargo.gems=0;S.ftT=0;g.setTab('dock');const h=[...document.querySelectorAll('#pBody h3')].find(x=>/Fast travel/.test(x.textContent));h&&h.scrollIntoView();})()")
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'fasttravel_toll.png')
    E(pg,"(()=>{const g=__game,X=g.ECON,S=g.S;X.fastTravel(g.PORTS.findIndex(p=>p.name.startsWith(`Smuggler`)));g.setTab('dock');const h=[...document.querySelectorAll('#pBody h3')].find(x=>/Fast travel/.test(x.textContent));h&&h.scrollIntoView();})()")
    pg.wait_for_timeout(1500);pg.screenshot(path=OUT+'fasttravel_cooldown.png')
    ticked=E(pg,"(document.querySelector('#pBody [data-ftcd]')||{}).textContent");print('live countdown text',ticked)
    chk(bool(ticked) and ticked!='⏳ 1:45',f"countdown ticks live in port: {ticked}")
    E(pg,"(()=>{__game.leavePort();__game.setState('map');})()");pg.wait_for_timeout(400);pg.screenshot(path=OUT+'map_cooldown.png')
    E(pg,"__game.setState('play')");pg.wait_for_timeout(200)
    f=E(pg,"""new Promise(r=>{let n=0,t0=performance.now(),last=t0,ws=[];function f(t){n++;ws.push(t-last);last=t;if(t-t0<3000)requestAnimationFrame(f);else{ws.sort((a,b)=>b-a);r([Math.round(n*1000/(t-t0)),Math.round(ws[0])]);}}requestAnimationFrame(f);})""")
    print('FPS portrait sailing [avg,worst]',f);ctx.close()
    ctx,pg=page(b,URL,None,'xp');xp=E(pg,"""(()=>{const X=__game.ECON;const r={};r.to30_old=X.xpTot(30,X.xpNeedV1);r.to30_new=X.xpTot(30,X.xpNeed);r.to60_old=X.xpTot(60,X.xpNeedV1);r.to60_new=X.xpTot(60,X.xpNeed);
      r.need={};for(const l of [10,29,30,35,40,45,50,55,59])r.need[l]=[X.xpNeedV1(l),X.xpNeed(l)];return r;})()""");ctx.close()
    print('XP',json.dumps(xp))
    chk(xp['to30_old']==xp['to30_new'],f"Lv1->30 unchanged ({xp['to30_new']} XP)")
    r30o=xp['to60_old']-xp['to30_old'];r30n=xp['to60_new']-xp['to30_new']
    chk(r30n>=2.5*r30o,f"Lv30->60 needs {r30n} XP vs {r30o} before (x{r30n/r30o:.2f})")
    if not LIVE:
        T60=xp['to60_old'];T45=sum(60+40*l+(8*(l-29)**2 if l>=30 else 0) for l in range(1,45))
        cases=[('maxed',{**SAVE,"xp":T60+5000,"clvl":60,"sp":59},60),('lv45',{**SAVE,"xp":T45+int(0.5*(60+40*45+8*16*16)),"clvl":45,"sp":44},45),('lv20',{**SAVE,"xp":9000,"clvl":20,"sp":19},20)]
        for nm,sv,lv in cases:
            ctx,pg=page(b,URL,sv,'mig-'+nm);start(pg)
            m=E(pg,"""(()=>{const g=__game,S=g.S;const L=g.lvlFromXp(S.xp);g.dock(1);g.setTab('market');const ok=document.getElementById('pBody').innerHTML.includes('Buys');return {clvl:S.clvl,sp:S.sp,xl:L.l,rem:L.rem,need:L.need,xpv:S.xpv,eco:!!S.eco&&typeof S.eco.t==='number',ok};})()""")
            print('migrate',nm,m)
            chk(m['clvl']==lv and m['xl']==lv and m['xpv']==2 and m['eco'] and m['ok'],f"old save '{nm}' keeps Lv{lv} (xp-level {m['xl']}, skill pts {m['sp']}), eco defaults, market renders")
            if nm=='lv45': chk(abs(m['rem']/m['need']-0.5)<0.06,f"progress within level preserved ({m['rem']}/{m['need']})")
            E(pg,"__game.leavePort()");E(pg,"__game.grantXP(50)");chk(E(pg,"__game.S.clvl")==lv,f"'{nm}' level stable after XP gain")
            ctx.close()
        ctx,pg=page(b,OLD,{**SAVE,"xp":T45+100,"clvl":45,"sp":44,"gold":4321},'oldcode');start(pg);code=E(pg,"__game.makeCode()");ctx.close()
        ctx,pg=page(b,URL,None,'imp');E(pg,"((c)=>{__game.openXfer();document.getElementById('xIn').value=c;document.getElementById('xLoad').click();document.getElementById('xYes').click();return 1;})",code);pg.wait_for_timeout(2500);start(pg)
        m=E(pg,"(()=>{const S=__game.S;return {clvl:S.clvl,gold:S.gold,xl:__game.lvlFromXp(S.xp).l,code:__game.makeCode().slice(0,7)}})()");print('old PSEAS1 import',m)
        chk(code.startswith('PSEAS1.') and m['clvl']==45 and m['xl']==45 and m['gold']==4321 and m['code']=='PSEAS1.',"old PSEAS1 code imports into new build, keeps Lv45 & gold, re-exports as PSEAS1")
        r2=E(pg,"(()=>{const c=__game.makeCode();const d=__game.parseCode(c);return !!(d.s.eco&&d.s.xpv===2)})()");chk(r2,"new export code carries eco + xpv");ctx.close()
    print('ERRORS:',len(errs),errs[:5]);print('FAILS:',len(fails),fails)
    json.dump(res,open('/tmp/econ_res.json','w'))
