import re,sys
P='/workspace/pirate-game/index.html'
s=open(P).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a)
    if n!=cnt: sys.exit(f'count {n} for: {a[:90]}')
    s=s.replace(a,b)

# static "want" no longer a permanent goldmine (dynamic hot spots replace it)
rep("o.mult=GOODS.map(g=>g.id===d.cheap?0.55:g.id===d.want?1.6:0.8+r()*0.45);",
    "o.mult=GOODS.map(g=>g.id===d.cheap?0.55:g.id===d.want?(d.haven?1:1.2):0.8+r()*0.45);")

ECO_JS=r"""
// ---------- DYNAMIC ECONOMY: gluts, shifting demand, daily caps, fast-travel tolls ----------
const ECO={TAU:110,DROP:0.92,RISE:1.08,FLOOR:0.38,BCAP:2.2,DAY:600,HOTX:1.8,NHOT:3,HOTMIN:240,HOTMAX:420,
 LOT:{rum:4,sugar:4,spice:3,silk:2,gems:1,teeth:2},CAP:{rum:60,sugar:50,spice:36,silk:24,gems:12,teeth:30},HOTCAP:1.5,
 FT_BASE:90,FT_DIST:32,FT_PCT:0.12,FT_CD:105};
function ecoDef(){return{t:0,p:{},d:0,q:{},hot:[],pr:0};}
function migrateEco(d){const E=(d.eco&&typeof d.eco==='object')?d.eco:{};const o=ecoDef();o.t=E.t>=0?+E.t:0;o.d=Math.floor(o.t/ECO.DAY);
 if(E.p&&typeof E.p==='object')for(const k in E.p){const v=E.p[k];if(Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&isFinite(x)))o.p[k]=v;}
 if(E.q&&typeof E.q==='object'&&E.d===o.d)for(const k in E.q)o.q[k]=Math.max(0,E.q[k]|0);
 if(Array.isArray(E.hot))o.hot=E.hot.filter(h=>h&&GOODS[h.g]&&PORTS[h.p]&&h.u>=0).slice(0,ECO.NHOT).map(h=>({g:h.g|0,p:h.p|0,u:+h.u}));
 S.eco=o;S.ftT=(d.ftT>=0&&d.ftT<=o.t+ECO.FT_CD)?+d.ftT:0;}
function ecoS(){const E=S.eco;if(E&&E.p&&E.q&&Array.isArray(E.hot)&&E.t>=0)return E;return S.eco=ecoDef();}
const ekey=(pi,gi)=>pi*8+gi;
const lotOf=gi=>ECO.LOT[GOODS[gi].id]||1;
function pres(pi,gi){const E=ecoS(),o=E.p[ekey(pi,gi)];if(!o)return{s:0,b:0};const k=Math.exp(-Math.max(0,E.t-o[2])/ECO.TAU);return{s:o[0]*k,b:o[1]*k};}
function addPres(pi,gi,ds,db){const p=pres(pi,gi),a=p.s+ds,b=p.b+db;if(a<0.01&&b<0.01){delete S.eco.p[ekey(pi,gi)];return;}S.eco.p[ekey(pi,gi)]=[Math.round(a*1000)/1000,Math.round(b*1000)/1000,S.eco.t];}
function hotAt(pi,gi){for(const h of ecoS().hot)if(h.p===pi&&h.g===gi)return h;return null;}
// valuable goods only boom at lawful ports (no fast travel there); never where they're cheap or at war with you
function hotOk(gi,pi){const p=PORTS[pi],g=GOODS[gi].id;if(p.cheap===g)return false;if(p.haven&&!(g==='rum'||g==='sugar'||g==='teeth'))return false;if(p.clan!=null&&clanHostile(p.clan))return false;return true;}
function pickHot(gi,prev){const c=[],far=[];for(let pi=0;pi<PORTS.length;pi++){if(pi===prev||!hotOk(gi,pi))continue;(Math.hypot(PORTS[pi].port.x-P.x,PORTS[pi].port.y-P.y)<9000?c:far).push(pi);}const L=c.length?c:far;return L.length?L[(Math.random()*L.length)|0]:-1;}
function ecoTick(dt){const E=ecoS();E.t+=dt;const day=Math.floor(E.t/ECO.DAY);if(day!==E.d){E.d=day;E.q={};}
 while(E.hot.length<ECO.NHOT){const used=E.hot.map(h=>h.g),free=GOODS.map((g,i)=>i).filter(i=>!used.includes(i));const gi=free[(Math.random()*free.length)|0];const pi=pickHot(gi,-1);if(pi<0)break;E.hot.push({g:gi,p:pi,u:E.t+rand(ECO.HOTMIN,ECO.HOTMAX)});}
 for(let i=0;i<E.hot.length;i++){const h=E.hot[i];if(E.t<h.u)continue;const used=E.hot.map(x=>x.g),pool=GOODS.map((g,j)=>j).filter(j=>j===h.g||!used.includes(j));const gi=pool[(Math.random()*pool.length)|0];const pi=pickHot(gi,gi===h.g?h.p:-1);
  if(pi<0){h.u=E.t+60;continue;}E.hot[i]={g:gi,p:pi,u:E.t+rand(ECO.HOTMIN,ECO.HOTMAX)};
  if(state==='play'&&S.tutDone&&!T.on)toast(`📯 Trade winds shift — a new port is paying top coin for ${GOODS[gi].name}. Ask in any tavern.`);}
 if((E.pr+=dt)>5){E.pr=0;for(const k in E.p){const o=E.p[k];if(Math.max(o[0],o[1])*Math.exp(-(E.t-o[2])/ECO.TAU)<0.02)delete E.p[k];}}}
function basePrice(pi,gi){const p=PORTS[pi];return GOODS[gi].base*p.mult[gi]*(hotAt(pi,gi)?ECO.HOTX:1)*(1+0.12*Math.sin(S.playTime/90+pi*1.7+gi*2.3));}
const buyMul=(pi,gi,ex)=>Math.min(ECO.BCAP,Math.pow(ECO.RISE,pres(pi,gi).b+(ex||0)/lotOf(gi)));
const sellMul=(pi,gi,ex)=>Math.max(ECO.FLOOR,Math.pow(ECO.DROP,pres(pi,gi).s+(ex||0)/lotOf(gi)));
function capOf(pi,gi){return Math.round((ECO.CAP[GOODS[gi].id]||20)*(hotAt(pi,gi)?ECO.HOTCAP:1));}
function capLeft(pi,gi){return Math.max(0,capOf(pi,gi)-(ecoS().q[ekey(pi,gi)]|0));}
function sellTotal(pi,gi,n){let t=0;for(let k=0;k<n;k++)t+=sellPrice(pi,gi,k);return t;}
function dayLeft(){return ECO.DAY-(ecoS().t%ECO.DAY);}
function mmss(t){t=Math.max(0,Math.ceil(t));return `${(t/60)|0}:${String(t%60).padStart(2,'0')}`;}
function cargoVal(){let v=0;for(const g of GOODS)v+=(S.cargo[g.id]||0)*g.base;return v;}
function ftWait(){return Math.max(0,(S.ftT||0)-ecoS().t);}
"""
rep("function price(pi,gi){const p=PORTS[pi];return Math.max(1,Math.round(GOODS[gi].base*p.mult[gi]*(1+0.12*Math.sin(S.playTime/90+pi*1.7+gi*2.3))));}\nconst sellPrice=(pi,gi)=>Math.max(1,Math.round(price(pi,gi)*0.82*(sk('plun')>=3?1.1:1)*(S.off&&S.off.qm?1.08:1)));",
    ECO_JS+"function price(pi,gi,ex){return Math.max(1,Math.round(basePrice(pi,gi)*buyMul(pi,gi,ex)));}\nconst sellPrice=(pi,gi,ex)=>Math.max(1,Math.round(basePrice(pi,gi)*0.82*(sk('plun')>=3?1.1:1)*(S.off&&S.off.qm?1.08:1)*sellMul(pi,gi,ex)));")

# save defaults + migration
rep("function defaultState(){return{gold:150,","function defaultState(){return{eco:ecoDef(),ftT:0,xpv:2,gold:150,")
rep(" migrateExp(d);migrateBoard(d);"," migrateExp(d);migrateBoard(d);migrateEco(d);migrateXp(d);")

# XP curve: unchanged to Lv30, much steeper after
rep("function xpNeed(l){return 60+40*l+(l>=30?8*(l-29)*(l-29):0);}",
"""function xpNeed(l){return 60+40*l+(l>=30?26*(l-29)*(l-29):0)+(l>=45?60*(l-44)*(l-44):0);}
function xpNeedV1(l){return 60+40*l+(l>=30?8*(l-29)*(l-29):0);}
function xpTot(l,f){let t=0;for(let i=1;i<l;i++)t+=f(i);return t;}
// old saves keep their level & unlocks; XP is re-based onto the new curve keeping progress within the level
function migrateXp(d){if(d.xpv>=2){S.xpv=2;return;}S.xpv=2;const L=S.clvl|0;if(L<30||!(S.xp>=0))return;
 let rem=S.xp-xpTot(L,xpNeedV1);const fr=L>=MAXLVL?0:clamp(rem/xpNeedV1(L),0,0.999);const nx=Math.round(xpTot(L,xpNeed)+(L>=MAXLVL?Math.max(0,rem):fr*xpNeed(L)));if(nx>S.xp)S.xp=nx;}""")

# econ clock ticks in every non-title state (port/map/menu/brawl too)
rep(" if(state==='play')update(dt);\n else if(state==='brawl')brawlFrame(dt);",
    " if(state!=='title')ecoTick(dt);if(state==='port'){ftUiT-=dt;if(ftUiT<=0){ftUiT=0.5;ftUi();}}\n if(state==='play')update(dt);\n else if(state==='brawl')brawlFrame(dt);")
rep("function frame(t){requestAnimationFrame(frame);","let ftUiT=0,ftWasWait=false;\nfunction ftUi(){const w=ftWait();const els=document.querySelectorAll('#pBody [data-ftcd]');for(const el of els)el.textContent=(el.dataset.ftcd==='n'?'':'⏳ ')+mmss(w);if(ftWasWait&&w<=0&&els.length)renderPort();ftWasWait=w>0&&els.length>0;}\nfunction frame(t){requestAnimationFrame(frame);")

# market UI
old_mk="""h+=`<div class="note">Hold: ${used}/${ST.cargoCap} crates. Buy low, sell high in another port. Prices drift over time.</div>`;
  GOODS.forEach((g,gi)=>{const b=Math.ceil(price(curPort,gi)*mk()),s=sellPrice(curPort,gi);const own=S.cargo[g.id];const tag=p.cheap===g.id?' <small style="display:inline;color:#2f7d3b">▼ cheap here</small>':p.want===g.id?' <small style="display:inline;color:#a12a1d">▲ in demand</small>':'';
   h+=row(`${g.icon} ${g.name}${tag}`,`Buy ${b} • Sell ${s} • You have ${own}`,btn('buy','Buy',S.gold>=b&&used<ST.cargoCap,gi)+btn('buy','×5',S.gold>=b*5&&used+5<=ST.cargoCap,gi+':5')+btn('sell','Sell',own>0,gi,'sell')+btn('sell','All',own>0,gi+':all','sell'));});"""
new_mk="""h+=`<div class="note">Hold: ${used}/${ST.cargoCap} crates. Buy low, sell high elsewhere. <b>Markets react:</b> each load you sell gluts the port (−8%), each load you buy makes it dearer (+8%); prices recover over a few minutes. Each port only buys so much of a good per day (new day in ${mmss(dayLeft())}).</div>`;
  GOODS.forEach((g,gi)=>{const b=Math.ceil(price(curPort,gi)*mk()),s=sellPrice(curPort,gi);const own=S.cargo[g.id];const hot=hotAt(curPort,gi);const sm=sellMul(curPort,gi),bm=buyMul(curPort,gi);const left=capLeft(curPort,gi),cap=capOf(curPort,gi);
   const tg=(c,t)=>` <small style="display:inline;color:${c}">${t}</small>`;const tag=hot?tg('#a12a1d','🔥 high demand'):p.cheap===g.id?tg('#2f7d3b','▼ cheap here'):p.want===g.id&&!p.haven?tg('#8a5a1a','▲ steady demand'):'';
   const tr=[];if(sm<0.97)tr.push(`<span style="color:#a12a1d">▼ glutted −${Math.round((1-sm)*100)}%${sm<=ECO.FLOOR+0.001?' (floor)':''}</span>`);if(bm>1.03)tr.push(`<span style="color:#8a5a1a">▲ dearer +${Math.round((bm-1)*100)}%</span>`);if(tr.length)tr.push('<i>recovering</i>');
   const ns=Math.min(own,left),tot=ns?sellTotal(curPort,gi,ns):0;
   const capT=left<=0?`<b style="color:#a12a1d">Full up today</b>`:`Buys ${left}/${cap} more today`;
   h+=row(`${g.icon} ${g.name}${tag}`,`Buy ${b}${bm>1.03?'▲':''} • Sell ${s}${sm<0.97?'▼':''} • You have ${own}<br>${capT}${ns>1?` • all ${ns} ≈ ${tot}💰`:''}${tr.length?'<br>'+tr.join(' · '):''}`,btn('buy','Buy',S.gold>=b&&used<ST.cargoCap,gi)+btn('buy','×5',S.gold>=b*5&&used+5<=ST.cargoCap,gi+':5')+btn('sell','Sell',own>0&&left>0,gi,'sell')+btn('sell','All',own>0&&left>0,gi+':all','sell'));});"""
rep(old_mk,new_mk)

# rumours: point to the live hot spots, then live best prices
old_ru="""h+=`<h3>🗣️ Tavern rumours</h3><div class="note">`;const nr=S.roles.navigator>=2?GOODS.length:2;
  for(let gi=0;gi<nr;gi++){const gg=(gi+curPort)%GOODS.length;let best=0,bp=0;PORTS.forEach((pp,pi)=>{const v=sellPrice(pi,gg);if(v>bp){bp=v;best=pi;}});h+=`• ${GOODS[gg].icon} ${GOODS[gg].name} sells for ~${bp} in ${PORTS[best].name}.<br>`;}"""
new_ru="""h+=`<h3>🗣️ Tavern rumours</h3><div class="note">`;const nav2=S.roles.navigator>=2,nr=nav2?GOODS.length:2;
  {const hs=S.eco.hot.slice(0,nav2?ECO.NHOT:2);for(const hh of hs){const left=hh.u-S.eco.t;h+=`• 🔥 <b>${PORTS[hh.p].name}</b> is paying top coin for ${GOODS[hh.g].icon} ${GOODS[hh.g].name} (~${sellPrice(hh.p,hh.g)}) — ${left>150?'for now':'but not for long'}.<br>`;}}
  for(let gi=0;gi<nr;gi++){const gg=(gi+curPort)%GOODS.length;if(S.eco.hot.some(x=>x.g===gg))continue;let best=0,bp=0;PORTS.forEach((pp,pi)=>{if(pi===curPort)return;const v=sellPrice(pi,gg);if(v>bp){bp=v;best=pi;}});h+=`• ${GOODS[gg].icon} ${GOODS[gg].name} sells for ~${bp} in ${PORTS[best].name}.<br>`;}"""
rep(old_ru,new_ru)

# buy / sell actions with per-crate price movement and daily caps
rep("""else if(act==='buy'){const [gi,m]=String(arg).split(':');const g=GOODS[+gi];const pr=Math.ceil(price(curPort,+gi)*mk());let n=Math.min(+(m||1),ST.cargoCap-cargoUsed(),Math.floor(S.gold/pr));if(n>0){S.gold-=n*pr;S.cargo[g.id]+=n;}}""",
"""else if(act==='buy'){const [g0,m]=String(arg).split(':');const gi=+g0,g=GOODS[gi];if(!g)return;const want=Math.min(Math.max(1,+(m||1)|0),ST.cargoCap-cargoUsed());let n=0,cost=0;while(n<want){const pr=Math.ceil(price(curPort,gi,n)*mk());if(S.gold-cost<pr)break;cost+=pr;n++;}if(n>0){S.gold-=cost;S.cargo[g.id]+=n;addPres(curPort,gi,0,n/lotOf(gi));}}""")
rep("""else if(act==='sell'){const [gi,m]=String(arg).split(':');const g=GOODS[+gi];const pr=sellPrice(curPort,+gi);const n=m==='all'?S.cargo[g.id]:Math.min(1,S.cargo[g.id]);if(n>0){S.cargo[g.id]-=n;S.gold+=n*pr;S.earned+=n*pr;chime();}}""",
"""else if(act==='sell'){const [g0,m]=String(arg).split(':');const gi=+g0,g=GOODS[gi];if(!g)return;const own=S.cargo[g.id]|0,left=capLeft(curPort,gi);let n=m==='all'?own:Math.min(1,own);
  if(n>0&&left<=0)toast(`🚫 "We're full up, captain." ${PORTS[curPort].name} won't take more ${g.name} today (new day in ${mmss(dayLeft())}).`);
  else if(n>0){const k=Math.min(n,left),tot=sellTotal(curPort,gi,k);S.cargo[g.id]-=k;S.gold+=tot;S.earned+=tot;addPres(curPort,gi,k/lotOf(gi),0);S.eco.q[ekey(curPort,gi)]=(S.eco.q[ekey(curPort,gi)]|0)+k;chime();
   if(k<n)toast(`"That's all the ${g.name} we'll take today, captain." Sold ${k} for ${tot} 💰.`);}}""")

# fast travel: toll + cooldown
rep("function ftCost(pi){const a=PORTS[curPort].port,b=PORTS[pi].port;return Math.round((30+Math.hypot(a.x-b.x,a.y-b.y)/60)*(S.off.ca?0.7:1));}",
    "function ftCost(pi){const a=PORTS[curPort].port,b=PORTS[pi].port;return Math.round((ECO.FT_BASE+Math.hypot(a.x-b.x,a.y-b.y)/ECO.FT_DIST)*(S.off.ca?0.7:1)+ECO.FT_PCT*cargoVal());}")
rep("function fastTravel(pi){const c=ftCost(pi);if(!PORTS[curPort]||!PORTS[curPort].haven||!PORTS[pi].haven||!S.vis.includes(pi)||S.gold<c||!ftOk())return;",
    "function fastTravel(pi){if(!PORTS[curPort]||!PORTS[pi])return;const c=ftCost(pi);if(!PORTS[curPort].haven||!PORTS[pi].haven||pi===curPort||!S.vis.includes(pi)||S.gold<c||!ftOk()||ftWait()>0)return;")
rep(" S.gold-=c;$('port').classList.add('hidden');const p=PORTS[pi];P.x=p.port.x;"," S.gold-=c;S.ftT=S.eco.t+ECO.FT_CD;$('port').classList.add('hidden');const p=PORTS[pi];P.x=p.port.x;")
rep("dock(pi);setTimeout(()=>toast(`⛵ Your crew sailed you to ${p.name} (−${c} 💰).`),80);}",
    "dock(pi);setTimeout(()=>toast(`⛵ Your crew sailed you to ${p.name} (toll −${c} 💰). They'll need ${mmss(ECO.FT_CD)} ashore before the next voyage.`),80);}")
rep("""else{const ok=ftOk();if(!ok)h+=`<div class="note">Not during a timed job (regatta / blockade run).</div>`;
   hv.sort((a,b)=>ftCost(a)-ftCost(b));for(const i of hv){const c=ftCost(i);h+=row(`${PORTS[i].clan!=null?CLANS[PORTS[i].clan].icon:'🏴‍☠️'} ${PORTS[i].name}`,`${Math.round(Math.hypot(PORTS[i].port.x-p.port.x,PORTS[i].port.y-p.port.y)/10)*10}m • Waters Lv${lvlAt(PORTS[i].port.x,PORTS[i].port.y)}`,btn('ft',`${c} 💰`,ok&&S.gold>=c,i));}}}""",
"""else{const ok=ftOk(),w=ftWait(),cv=cargoVal();if(!ok)h+=`<div class="note">Not during a timed job (regatta / blockade run).</div>`;
   h+=`<div class="note">Hired crews charge a toll: ${ECO.FT_BASE}💰 + distance${S.off.ca?' (−30% Cartographer)':''} + <b>${Math.round(ECO.FT_PCT*100)}% of cargo value</b> (${cv}💰 aboard → +${Math.round(ECO.FT_PCT*cv)}💰). They rest ${mmss(ECO.FT_CD)} between voyages. Sailing yourself is free.${w>0?`<br><b>⏳ Crew resting — next voyage in <span data-ftcd="n">${mmss(w)}</span></b>`:''}</div>`;
   hv.sort((a,b)=>ftCost(a)-ftCost(b));for(const i of hv){const c=ftCost(i);h+=row(`${PORTS[i].clan!=null?CLANS[PORTS[i].clan].icon:'🏴‍☠️'} ${PORTS[i].name}`,`${Math.round(Math.hypot(PORTS[i].port.x-p.port.x,PORTS[i].port.y-p.port.y)/10)*10}m • Waters Lv${lvlAt(PORTS[i].port.x,PORTS[i].port.y)} • toll ${c}💰`,w>0?`<button class="b" disabled data-ftcd>⏳ ${mmss(w)}</button>`:btn('ft',`${c} 💰`,ok&&S.gold>=c,i));}}}""")

# big map: fast-travel cooldown
rep("ctx.fillText('🗺️ Sea chart — drag to pan • pinch / ＋－ to zoom • tap to close',vw/2,R.y-14,vw-12);",
    "ctx.fillText('🗺️ Sea chart — drag to pan • pinch / ＋－ to zoom • tap to close',vw/2,R.y-14,vw-12);\n {const w=ftWait(),t=w>0?`⏳ Fast travel in ${mmss(w)}`:'⛵ Fast travel ready (at havens)';ctx.font='600 12px Georgia,serif';const tw=ctx.measureText(t).width+16;ctx.fillStyle='rgba(16,13,10,.82)';const by=R.y+R.s-36;ctx.fillRect(R.x+6,by,tw,22);ctx.strokeStyle='rgba(176,140,80,.7)';ctx.lineWidth=1;ctx.strokeRect(R.x+6.5,by+0.5,tw-1,21);ctx.fillStyle=w>0?'#e3b86a':'#cfe3b0';ctx.textAlign='left';ctx.fillText(t,R.x+14,by+11);ctx.textAlign='center';ctx.font='bold 14px sans-serif';}")

# test hooks
rep("window.__game={B:BRAPI,","window.__game={ECON:{ECO,ecoTick,hotOk,mk:()=>mk(),dayLeft,price,sellPrice,basePrice,pres,capLeft,capOf,hotAt,ftCost,ftWait,cargoVal,xpNeed,xpNeedV1,xpTot,sellTotal,get curPort(){return curPort},portAction:(a,b)=>portAction(a,b),fastTravel,renderPort},B:BRAPI,")
open(P,'w').write(s);print('patched',len(s))
