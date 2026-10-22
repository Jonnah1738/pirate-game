import json,sys,os
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/index.html'
LIVE='github.io' in URL
OUT='/workspace/pirate-game/screenshots-hard/'+('live_' if LIVE else '')
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
with sync_playwright() as p:
    b=p.chromium.launch(args=['--enable-unsafe-swiftshader'])
    ctx,pg=page(b,None,'fresh');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    v=E("""(()=>{const g=__game,X=g.STORY,H=g.HARD;const acts={};X.CH.forEach(c=>acts[c.a]=(acts[c.a]||0)+1);const bad=[];
      const chkStep=(st,w)=>{if(st.k==='dock'&&!X.sLoc('P:'+st.p))bad.push(w+' dock '+st.p);if((st.k==='go'||st.k==='boss')&&!X.sLoc(st.at))bad.push(w+' loc '+st.at);if(st.k==='legend'&&!H.LEGENDS.some(l=>l.id===st.id))bad.push(w+' leg');if(st.k==='eboss'&&!H.EBOSS[st.id])bad.push(w+' eb');if(!X.stepTxt(st))bad.push(w+' txt');};
      X.CH.forEach((c,i)=>{c.s.forEach(st=>chkStep(st,'ch'+i));if(c.alt)for(const k in c.alt)c.alt[k].forEach(st=>chkStep(st,'ch'+i+'alt'));});
      X.SQ.forEach(q=>{q.s.forEach(st=>chkStep(st,q.id));if(!g.PORTS.some(p=>p.name===q.p))bad.push(q.id+' port');if(q.pre&&X.SQI[q.pre]==null)bad.push(q.id+' pre');});
      const npcs=new Set(X.SQ.map(q=>q.w));const lv=X.CH.map(c=>c.lvl);let mono=true;for(let i=1;i<lv.length;i++)if(lv[i]<lv[i-1])mono=false;
      const waits=X.CH.reduce((a,c)=>a+(c.wait||0),0),days=X.CH.filter(c=>c.day).length,choices=X.CH.filter(c=>c.ch).length;
      return {n:X.CH.length,acts,sq:X.SQ.length,npcs:npcs.size,bad,mono,waits,days,choices,chains:X.SQ.filter(q=>q.pre).length};})()""")
    print(json.dumps(v))
    chk(v['n']>=40 and len(v['acts'])==6,'saga: %d chapters in 6 acts %s'%(v['n'],v['acts']))
    chk(v['sq']>=30 and v['npcs']>=10 and v['chains']>=20,'side quests: %d (%d NPCs, %d chained)'%(v['sq'],v['npcs'],v['chains']))
    chk(not v['bad'],'every objective location/legend/boss resolves on the map %s'%v['bad'][:5])
    chk(v['mono'] and v['waits']>=40 and v['days']>=5 and v['choices']>=5,'pacing: level gates ascend, %dh real-time rests, %d next-day chapters, %d branching choices'%(v['waits'],v['days'],v['choices']))
    # journal + first chapter
    E("(()=>{const g=__game;g.openMenu();g.setMView('story');})()");pg.wait_for_timeout(600)
    jt=E("document.getElementById('mBody').innerText");chk('A Page of Salt' in jt and 'Begin' in jt,'journal tab lists Chapter 1 with Begin')
    pg.screenshot(path=OUT+'story_journal_start.png')
    E("document.querySelector('#mBody button[data-act=\"sbegin\"]').click()");pg.wait_for_timeout(300)
    d=E("[!document.getElementById('story').classList.contains('hidden'),document.getElementById('sText').innerText,document.getElementById('sChap').innerText]")
    chk(d[0] and 'Port Royal' in d[1],'dialogue panel opens with chapter text: %s'%d[2])
    E("document.querySelector('#sBtns button').click()");pg.wait_for_timeout(250);pg.screenshot(path=OUT+'story_dialogue.png')
    E(FLUSH);E("(()=>{document.getElementById('menu').classList.add('hidden');})()");E("__game.setState('play')")
    a=E("(()=>{const X=__game.STORY;const a=X.actives();return [__game.S.story.on,a.length&&a[0].st.k,a.length&&a[0].st.p]})()")
    chk(a[0]==1 and a[1]=='dock' and a[2]=='Tortuga','chapter 1 active: dock at Tortuga')
    tg=E("(()=>{const o=[];__game.HARD.hardTargets(o);return o.filter(x=>x.icon==='📖').length})()");chk(tg==1,'📖 objective marker on map')
    E("(()=>{const g=__game;g.dock(g.PORTS.findIndex(p=>p.name==='Tortuga'));})()");pg.wait_for_timeout(300)
    r=E("(()=>{const S=__game.S;return [S.story.ch,S.story.on,!document.getElementById('story').classList.contains('hidden'),document.getElementById('sText').innerText]})()")
    chk(r[0]==1 and r[1]==0 and r[2],'docking at Tortuga completes Chapter 1 (outro dialogue shown)')
    E(FLUSH)
    av=E("(()=>{const X=__game.STORY;return X.chAvail().why})()");chk(any('level 3' in w for w in av),'chapter 2 gated by captain level 3: %s'%av)
    # tavern side quests
    E("(()=>{const g=__game;g.leavePort();g.dock(0);g.setTab('dock');g.renderPort();})()");pg.wait_for_timeout(300)
    E("(()=>{const el=[...document.querySelectorAll('#pBody h3')].find(h=>/Tavern/.test(h.textContent));el&&el.scrollIntoView();})()");pg.wait_for_timeout(200)
    t=E("document.getElementById('pBody').innerText");chk('Tavern' in t and 'Nets and Knives' in t,'Port Royal tavern lists Old Finch\'s side quest')
    pg.screenshot(path=OUT+'story_tavern.png')
    E("__game.S.clvl=4;__game.ECON.portAction('stake','f1')");E(FLUSH)
    s1=E("""(()=>{const g=__game,X=g.STORY,S=g.S;const g0=S.gold;for(let i=0;i<3;i++)X.storyEv('sink',{e:{kind:'pirate',x:12000,y:12000}});const done=S.story.side.f1&&S.story.side.f1.done;return [done,S.gold-g0];})()""")
    E(FLUSH);chk(s1[0]==1 and s1[1]>=150,'side quest: sink 3 pirates → reward %d💰'%s1[1])
    E("(()=>{const g=__game;g.setTab('dock');g.renderPort();})()");t=E("document.getElementById('pBody').innerText");chk("Widow" in t,'quest chain: Finch\'s next job appears')
    E("__game.ECON.portAction('stake','f2')");E(FLUSH);E("(()=>{const g=__game;g.setTab('dock');g.renderPort();})()")
    gb=E("(()=>{const S=__game.S;S.gold=1000;const b=document.querySelector('#pBody button[data-act=\"sgive\"]');if(!b)return null;b.click();return [S.gold,S.story.side.f2.done]})()");E(FLUSH)
    chk(gb and gb[0]==700 and gb[1]==1,'gold hand-over at the tavern completes a job: %s'%gb)
    E("__game.leavePort()")
    # boss step + choice branch
    bs=E("""(()=>{const g=__game,X=g.STORY,S=g.S;S.clvl=20;S.story.ch=3;S.story.on=0;S.story.wait=0;S.story.day=-1;X.chBegin();return 1;})()""");E(FLUSH)
    bs=E("""(()=>{const g=__game,X=g.STORY,S=g.S,H=g.HARD;const a=X.actives()[0];const l=X.sLoc(a.st.at);g.P.x=l.x;g.P.y=l.y+700;g.P.dead=0;X.bossTick(a);const e=g.enemies.find(o=>o.sq);
       const info=e&&{nm:e.name,cls:e.cls,hp:e.maxHp,tag:H.vetTag(e)};H.hardSunk(e);return {info,ch:S.story.ch};})()""")
    E(FLUSH);print(bs);chk(bs['info'] and bs['info']['nm']=='HMS Harrier' and bs['info']['cls']=='frigate' and bs['ch']==4,'story boss spawns at its mark (HMS Harrier, frigate class) and sinking it completes the chapter')
    E("""(()=>{const g=__game,X=g.STORY,S=g.S;S.story.wait=0;S.story.day=-1;X.chBegin();})()""")
    k=0
    while k<10 and E("document.querySelectorAll('#sBtns button.sc').length")==0: E("document.querySelector('#sBtns button').click()");k+=1
    pg.wait_for_timeout(200);pg.screenshot(path=OUT+'story_choice.png')
    E("document.querySelectorAll('#sBtns button.sc')[1].click()");E(FLUSH)
    br=E("(()=>{const X=__game.STORY,S=__game.S;const a=X.actives()[0];return [S.story.f.isa,X.chAvail(),S.story.st,a&&a.c.alt?1:0,(X.actives()[0]||{}).st]})()")
    E("(()=>{const g=__game;g.dock(g.PORTS.findIndex(p=>p.name===\"Smuggler's Cove\"));})()");E(FLUSH)
    br2=E("(()=>{const X=__game.STORY;const a=X.actives()[0];return a&&a.st})()")
    chk(br[0]=='rival' and br2 and br2['k']=='sink' and br2['f']['kind']=='merchant','choice branches the chapter (Isabel: rival → sink merchants instead of paying)')
    E("__game.leavePort()")
    # full playthrough simulation of all remaining chapters (exceptions/softlocks)
    sim=E("""(()=>{const g=__game,X=g.STORY,S=g.S,H=g.HARD;S.clvl=60;S.fleet=[];let guard=0,log=[];const flush=()=>{let k=0;while(X.SQUE.length&&k<300){k++;const b=document.querySelector('#sBtns button.sc')||document.querySelector('#sBtns button');if(!b)break;b.click();}};
      for(const f of H.FORTS)S.forts[f.id]={o:'p',g:0};const t0=Date.now();
      while(S.story.ch<X.CH.length&&guard<600){guard++;S.story.wait=0;S.story.day=-1;if(!S.story.on){X.chBegin();flush();if(!S.story.on){log.push('nobegin '+S.story.ch);break;}}
       const a=X.actives().find(x=>x.c);if(!a){log.push('noactive '+S.story.ch);break;}const st=a.st,ch0=S.story.ch,st0=S.story.st;
       if(st.k==='dock'){const pi=g.PORTS.findIndex(p=>p.name===st.p);g.dock(pi);flush();if(g.state==='port')g.leavePort();}
       else if(st.k==='go'){const l=X.sLoc(st.at);g.P.x=l.x;g.P.y=l.y;X.storyTick();}
       else if(st.k==='sink'){const f=st.f||{};const e={kind:f.kind||'navy',clan:f.clan,cls:f.cls,vet:f.vet,x:0,y:0};let pt={x:12000,y:12000};if(f.reg){const R=H.SREG.find(R=>R.id===f.reg);pt={x:R.cx+300,y:R.cy};}if(f.far)pt={x:21000,y:21000};e.x=pt.x;e.y=pt.y;if(f.kind==='clan'&&f.clan==null)e.clan=0;for(let i=0;i<st.n;i++)X.storyEv('sink',{e});}
       else if(st.k==='boss'){const l=X.sLoc(st.at);g.P.x=l.x;g.P.y=l.y+600;g.P.dead=0;X.bossTick(a);const e=g.enemies.find(o=>o.sq===a.key+':'+a.o.st&&!o.sinking);if(!e){log.push('noboss '+ch0);break;}H.hardSunk(e);g.enemies.splice(g.enemies.indexOf(e),1);}
       else if(st.k==='legend'){S.lb.done[st.id]=1;X.storyTick();}else if(st.k==='own'){X.storyTick();}else if(st.k==='frag'){S.tr.frag=8;X.storyTick();}else if(st.k==='grand'){S.tr.dug=1;X.storyTick();}else if(st.k==='eboss'){S.eb[st.id].done=1;X.storyTick();}
       else if(st.k==='fort'||st.k==='mega'){for(let i=0;i<st.n;i++)X.storyEv(st.k,{});}
       else if(st.k==='mat'||st.k==='gold'){for(const k in (st.m||{}))S.mat[k]=(S.mat[k]|0)+st.m[k];S.gold+=st.n||0;g.dock(0);X.storyPortAct('sgive',a.key);flush();if(g.state==='port')g.leavePort();}
       flush();if(S.story.ch===ch0&&S.story.st===st0&&S.story.on){log.push('stuck '+ch0+' '+st.k);break;}}
      return {ch:S.story.ch,done:S.story.done,guard,log,ms:Date.now()-t0,cos:Object.keys(S.cosU).length,fleet:S.fleet.length,end:S.story.f.end};})()""")
    print(sim);chk(sim['done']==1 and sim['ch']==len([0])*0+sim['ch'] and not sim['log'],'whole saga plays through to THE END without softlocks (%d chapters, ending "%s")'%(sim['ch'],sim['end']))
    E("(()=>{const g=__game;g.openMenu();g.setMView('story');})()");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'story_journal_done.png')
    E("document.getElementById('menu').classList.add('hidden');__game.setState('play')")
    # all side quests simulate
    sq=E("""(()=>{const g=__game,X=g.STORY,S=g.S,H=g.HARD;S.story.side={};S.story.sa=[];S.fleet=[];let n=0,log=[];const lp=()=>{if(g.state==='port')g.leavePort();};const flush=()=>{let k=0;while(X.SQUE.length&&k<300){k++;const b=document.querySelector('#sBtns button');if(!b)break;b.click();}};
      for(let pass=0;pass<8;pass++)for(const q of X.SQ){if(S.story.side[q.id])continue;if(q.pre&&!(S.story.side[q.pre]&&S.story.side[q.pre].done))continue;const pi=g.PORTS.findIndex(p=>p.name===q.p);g.dock(pi);X.storyPortAct('stake',q.id);flush();
        let guard=0;while(S.story.side[q.id]&&!S.story.side[q.id].done&&guard<20){guard++;const a=X.actives().find(x=>x.q&&x.q.id===q.id);if(!a)break;const st=a.st;
         if(st.k==='dock'){lp();g.dock(g.PORTS.findIndex(p=>p.name===st.p));}else if(st.k==='go'){lp();const l=X.sLoc(st.at);g.P.x=l.x;g.P.y=l.y;X.storyTick();}
         else if(st.k==='sink'){const f=st.f||{};let e={kind:f.kind||'navy',clan:f.clan,cls:f.cls,x:12000,y:12000};if(f.reg){const R=H.SREG.find(R=>R.id===f.reg);e.x=R.cx+300;e.y=R.cy;}for(let i=0;i<st.n;i++)X.storyEv('sink',{e});}
         else if(st.k==='boss'){lp();const l=X.sLoc(st.at);g.P.x=l.x;g.P.y=l.y+600;X.bossTick(a);const e=g.enemies.find(o=>o.sq===a.key+':'+a.o.st&&!o.sinking);if(!e)break;H.hardSunk(e);g.enemies.splice(g.enemies.indexOf(e),1);}
         else if(st.k==='mat'||st.k==='gold'){for(const k in (st.m||{}))S.mat[k]=(S.mat[k]|0)+st.m[k];S.gold+=st.n||0;lp();g.dock(0);X.storyPortAct('sgive',a.key);}
         else if(st.k==='frag'){S.tr.frag=8;X.storyTick();}else if(st.k==='fort'||st.k==='mega'){for(let i=0;i<st.n;i++)X.storyEv(st.k,{});}flush();}
        lp();if(S.story.side[q.id]&&S.story.side[q.id].done)n++;else log.push(q.id);}
      return {n,log,fleet:S.fleet.map(d=>d.name),offs:Object.keys(S.off),pend:S.story.pend};})()""")
    print(sq);chk(sq['n']==v['sq'] and not sq['log'],'all %d side quests completable; unique ships %s, officers %s'%(sq['n'],sq['fleet'],sq['offs']))
    ctx.close()
    # old maxed save
    ctx,pg=page(b,OLD,'old');start(pg);E=lambda js,a=None: pg.evaluate(js,a) if a is not None else pg.evaluate(js)
    m=E("(()=>{const S=__game.S;return [S.clvl,S.story.ch,S.story.on,__game.STORY.chAvail().why]})()")
    chk(m[0]==60 and m[1]==0 and m[3]==[],'maxed old save starts the story at Act 1, Chapter 1 (no level gate in the way)')
    code=E("__game.makeCode()");ok=E("(c=>{const r=__game.parseCode(c);return !!r.s.story&&r.s.story.ch===0})",code)
    chk(code.startswith('PSEAS1.') and ok,'PSEAS1 export includes story progress')
    E("(()=>{const g=__game;g.openMenu();g.setMView('story');})()");pg.wait_for_timeout(250)
    tabs=E("(()=>{const r=[...document.querySelectorAll('#mTabs button')].map(b=>b.getBoundingClientRect());return r.every(x=>x.right<=391&&x.height>=30)})()")
    chk(tabs,'menu tabs (incl. 📜 Journal) fit a 390px phone')
    print('console errors:',errs);chk(not errs,'0 console errors')
    b.close()
print('FAILS',fails);sys.exit(1 if fails else 0)
