// ===================== Module Q: AI captains (4 per online lobby, run by the lobby host) =====================
// Lobby = up to 20 humans + 4 AI captains (24 ships). The host client simulates the 4 bots and publishes ONE compact
// string (lob/{lid}/bt, ~300 bytes, 0.6s when someone is near a bot, 2s otherwise) + a rarely-changing profile node (bp).
// Every client renders bots through the normal remote-ship path (mpMot), so nameplates, map dots, kill feed, PvP hit
// detection and bounties all work as for players. Damage rules mirror human PvP exactly:
//  - human -> bot: the shooter's normalized per-mille hit goes to lob/bh (same rate limit as ev), host applies it
//  - bot -> human: the victim's own client applies hits from bot cannonballs, normalized like human hits, rate capped,
//    and never in haven waters / under new-captain protection / while docked or boarding (same as mpEv)
//  - bot -> bot: resolved by the host. Host migration: the next host picks up positions/HP from the last bt.
const QB_N=4,QB_IDS=['B0','B1','B2','B3'];
const QBN=['Salty Mae','Red Corwin','Black Tamsin','Iron Jack','One-Eye Ned','Gully Brask','Mad Morrow','Silas Vane','Ruby Kett','Grim Hollis','Cutlass Kai','Bonny Rook','Dread Ivo','Ash Calloway','Peg Darrow','Widow Skye','Scurvy Bart','Lady Fenwick','Hook Marlow','Crow Delaney'];
const QB={sim:null,lid:'',jt:0,chkT:1,sendT:0,prT:0,prDirty:0,bp:{},btT:0,btStr:'',seq:0,rate:{},wb:{},wbT:2,wbDirty:0,pend:[],hsub:[],cells:{},meRate:{},bToastT:0,locT:0,off:false,force:0};
function qbIs(id){return typeof id==='string'&&/^B[0-3]$/.test(id);}
function qbOffNow(){try{return localStorage.getItem('pirateSeas_qbOff')==='1';}catch(e){return false;}}
function qbStats(l,hull){const C=HULLS[hull]||HULLS.sloop;const u=Math.min(12,Math.floor((l|0)/3));
 return {maxHp:Math.round((150+45*u)*C.hp),spd:(135+18*u)*C.spd*0.94,turn:(1.45+0.07*u)*C.turn,g:Math.min(12,2+Math.min(4,Math.floor(u/2))+C.guns),dmg:(10+1.5*u)*C.dmg,reload:2.7,rg:420,len:52+3*u+C.len,wid:18+1.2*u+C.wid};}
function qbHullFor(l){const r=Math.random();return l<5?'sloop':l<12?(r<0.7?'brig':'sloop'):l<22?(r<0.6?'frigate':'brig'):(r<0.55?'galleon':'frigate');}
function qbAvgLv(){let s=S.clvl|0,n=1;for(const id in MPX.rem){const r=MPX.rem[id];if(r.bot||r.stale||!r.j)continue;s+=r.l|0;n++;}return Math.max(1,Math.round(s/n));}
function qbPm(l,hull,vl){const st=qbStats(l,hull);const lf=clamp(1+0.015*((l|0)-(vl|0)),0.85,1.15);return clamp(Math.round(1000*st.dmg/Math.max(1,st.maxHp)*0.9*lf),1,300);}
function qbHumans(){const a=[{id:MPX.uid,x:P.x,y:P.y,l:S.clvl|0,fl:MPX.lfl||mpFlags(),b:S.mpB|0,hpP:clamp(P.hp/ST.maxHp*100,0,100),vis:1}];
 for(const id in MPX.rem){const r=MPX.rem[id];if(r.bot||r.stale||!r.j)continue;const p=r.vis?[r.x,r.y]:r.xy;if(!p)continue;a.push({id,x:p[0],y:p[1],l:r.l|0,fl:r.vis?(r.fl||''):'p',b:r.b|0,hpP:r.vis?r.hpP:100,vis:r.vis});}return a;}
function qbHumOk(h){return !/[zpnbd]/.test(h.fl||'')&&!mpSafeAt(h.x,h.y);}
function qbHavenNear(x,y,R){for(const p of PORTS)if(p.haven&&Math.hypot(p.port.x-x,p.port.y-y)<R)return p.port;return null;}
function qbSpawnPt(){const H=qbHumans();for(let k=0;k<40;k++){const h=H[(Math.random()*H.length)|0];const q=randomWater(h.x,h.y,2400,4600);if(!q)continue;
  if(qbHavenNear(q.x,q.y,NEWB_R+300))continue;if(H.some(o=>Math.hypot(o.x-q.x,o.y-q.y)<1500))continue;return q;}
 return randomWater(WORLD/2,WORLD/2,0,6000)||{x:WORLD/2,y:WORLD/2};}
function qbMake(i,keep){keep=keep||{};const l=keep.l||clamp(Math.round(qbAvgLv()*rand(0.85,1.15)+rand(-1,1)),1,60);const hull=keep.hull||qbHullFor(l);const st=qbStats(l,hull);
 let n=keep.n;if(!n){const used=new Set([MPX.name].concat(Object.values(MPX.rem).map(r=>r.n)).concat((QB.sim||[]).map(b=>b&&b.n)));const pool=QBN.filter(x=>!used.has(x));n=pool[(Math.random()*pool.length)|0]||('Captain '+(i+1));}
 const pk=cat=>{const a=COS[cat].filter(x=>x[2]<=l+8);return a[(Math.random()*a.length)|0][0];};
 const p=keep.x!=null?keep:qbSpawnPt();
 return {id:QB_IDS[i],i,n,l,hull,st,c:keep.c||[pk('sail'),pk('flag'),pk('hull'),pk('fx')].join('|'),x:p.x,y:p.y,h:keep.h!=null?keep.h:Math.random()*TAU,vx:0,vy:0,speed:0,boost:0,wakeT:1e9,len:st.len,wid:st.wid,
  hp:keep.hpP!=null?st.maxHp*keep.hpP/100:st.maxHp,fcL:keep.fcL|0,fcR:keep.fcR|0,rl:1.5,rr:2,tg:'',tgT:0,wp:null,wpT:0,dead:keep.dead?performance.now():0,b:keep.b|0,k:keep.k|0,last:null,ag:'',agT:0,gr:0,side:Math.random()<0.5?1:-1,hurtT:0};}
function qbProf(b){return {n:b.n,l:b.l,h:((HCODE[b.hull]||'s')+Math.round(b.len)+'x'+Math.round(b.wid)).slice(0,10),c:b.c,g:b.st.g,rg:b.st.rg,b:clamp(b.b|0,0,1000000),k:clamp(b.k|0,0,1000000)};}
// ---------- host: take over / release ----------
function qbTakeover(){const {D}=MPX.fb;QB.sim=[];
 for(let i=0;i<QB_N;i++){const id=QB_IDS[i],r=MPX.rem[id],p=QB.bp[id];
  if(r&&p&&r.vis&&performance.now()-r.seenT<15000)QB.sim.push(qbMake(i,{n:r.n,l:r.l,hull:r.hull,c:p.c,k:p.k,b:p.b,x:r.x,y:r.y,h:r.h,hpP:r.hpP,fcL:r.fcL,fcR:r.fcR,dead:r.deadF}));
  else QB.sim.push(qbMake(i,p?{n:p.n,k:p.k,c:p.c}:null));}
 QB.prDirty=1;QB.prT=0;QB.sendT=0;QB.pend=[];QB.rate={};
 QB.hsub.forEach(f=>f());QB.hsub=[D.onChildAdded(mpR(mpL('bh')),qbBh)];}
function qbRelease(){QB.hsub.forEach(f=>f());QB.hsub=[];for(const k in QB.cells)QB.cells[k].forEach(f=>f());QB.cells={};QB.sim=null;}
// host also listens to the motion cells around its bots so it knows where nearby humans really are
function qbResub(){const want=new Set();if(QB.sim)for(const b of QB.sim){if(b.dead)continue;const [ci,cj]=mpCellOf(b.x,b.y).split('_').map(Number);
  for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++)if(i>=0&&j>=0&&i<MCN&&j<MCN){const k=i+'_'+j;if(!MPX.cells.has(k))want.add(k);}}
 for(const k in QB.cells)if(!want.has(k)){QB.cells[k].forEach(f=>f());delete QB.cells[k];}
 const {D}=MPX.fb;for(const k of want)if(!QB.cells[k]){const q=mpR(mpL('c/'+k));QB.cells[k]=[D.onChildAdded(q,s=>mpMot(s.key,s.val(),k)),D.onChildChanged(q,s=>mpMot(s.key,s.val(),k))];}}
// ---------- host: hits from humans on bots ----------
function qbBh(snap){const v=snap.val();MPX.fb.D.remove(snap.ref).catch(()=>{});if(!v||!QB.sim)return;const b=QB.sim.find(x=>x.id===v.v);if(!b||b.dead)return;
 if(Math.abs(mpNow()-(v.t||0))>6000)return;if(v.a!==MPX.uid){const r=MPX.rem[v.a];if(!r||r.bot||r.stale)return;}
 const ap=mpPosOf(v.a);if(!ap||Math.hypot(ap[0]-b.x,ap[1]-b.y)>1900)return;if(mpSafeAt(b.x,b.y))return;
 const now=performance.now();const q=QB.rate[v.a]=(QB.rate[v.a]||[]).filter(e=>now-e.t<1000);const sum=q.reduce((s,e)=>s+e.d,0);const d=Math.min(clamp(v.d|0,0,300),450-sum);if(d<=0)return;q.push({t:now,d});
 qbDmg(b,d,v.a);}
function qbDmg(b,pm,from){if(!b||b.dead)return;const now=performance.now();b.hp-=pm/1000*b.st.maxHp;b.hurtT=now;b.last={a:from,t:now};if(from&&from!==b.id){b.ag=from;b.agT=now;if(b.tg!==from&&Math.random()<0.6)b.tgT=0;}
 if(b.hp<=0)qbSink(b);}
function qbName(id){if(id===MPX.uid)return MPX.name;if(qbIs(id)){const o=QB.sim&&QB.sim.find(x=>x.id===id);return o?o.n:'?';}const r=MPX.rem[id];return r?r.n:'?';}
function qbSink(b){const now=performance.now();b.dead=now;b.hp=0;b.gr=0;QB.force=1;const ka=b.last&&now-b.last.t<10000?b.last.a:null;
 const bounty=Math.round((b.b|0)+120+12*b.l);
 if(ka){mpPush('k',{a:ka,v:b.id,an:String(qbName(ka)).slice(0,16),vn:b.n,b:clamp(bounty,0,1000000),xy:`${b.x|0},${b.y|0}`,t:mpTS()});
  if(qbIs(ka)){const kb=QB.sim.find(x=>x.id===ka);if(kb){kb.k++;kb.b+=100+Math.round(bounty*0.2);}}}
 b.b=0;QB.prDirty=1;}
function qbRespawn(b){const nb=qbMake(b.i,{n:b.n,k:b.k,c:b.c});nb.fcL=b.fcL;nb.fcR=b.fcR;QB.sim[b.i]=nb;QB.prDirty=1;QB.force=1;}
// bots credited for sinking players (the victim writes k with a=botId)
{const _mk=mpKill;mpKill=function(snap){const v=snap.val();const seen=MPX.seenK[snap.key];_mk(snap);
 if(!seen&&v&&QB.sim&&qbIs(v.a)&&!qbIs(v.v)&&(v.t||0)>=MPX.joinT-5000){const kb=QB.sim.find(x=>x.id===v.a);if(kb){kb.k++;kb.b+=100+Math.round((v.b|0)*0.2);QB.prDirty=1;}}};}
// ---------- host: AI ----------
function qbEvt(){const e=NX&&NX.e;if(!e)return null;const now=mpNow();if(now<e.at||now>e.end||NX.done[e.id])return null;return e;}
function qbPick(b,H){const now=performance.now();let best=null,bs=-1e9;b.tgT=rand(2,3.2);
 for(const h of H){if(!qbHumOk(h))continue;const d=Math.hypot(h.x-b.x,h.y-b.y);if(d>5200)continue;
  let s=6000-d+900+Math.min(1500,h.b*0.5)+(100-(h.hpP==null?100:h.hpP))*6+(/r/.test(h.fl)?400:0)-(/w/.test(h.fl)?1500:0)+(b.ag===h.id&&now-b.agT<12000?1600:0)+rand(0,450);
  if(s>bs){bs=s;best=h.id;}}
 for(const o of QB.sim){if(o===b||o.dead||mpSafeAt(o.x,o.y))continue;const d=Math.hypot(o.x-b.x,o.y-b.y);if(d>2600)continue;const s=6000-d+Math.min(800,o.b*0.4)+(b.ag===o.id&&now-b.agT<12000?1600:0)+rand(0,450);if(s>bs){bs=s;best=o.id;}}
 const e=qbEvt();if(e&&e.k==='boss'){const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<6500){const s=6000-d+700+rand(0,300);if(s>bs){bs=s;best='boss';}}}
 if(best!==b.tg){b.tg=best||'';if(Math.random()<0.5)b.side=-b.side;}}
function qbTgt(b,H){const t=b.tg;if(!t)return null;if(t==='boss'){const e=qbEvt();if(!e||e.k!=='boss')return null;return {kind:'boss',x:e.x,y:e.y,hpP:100,l:e.lv|0};}
 if(qbIs(t)){const o=QB.sim.find(x=>x.id===t);if(!o||o.dead||mpSafeAt(o.x,o.y))return null;return {kind:'bot',id:t,o,x:o.x,y:o.y,hpP:100*o.hp/o.st.maxHp,l:o.l,len:o.len};}
 const h=H.find(x=>x.id===t);if(!h||!qbHumOk(h)||Math.hypot(h.x-b.x,h.y-b.y)>6000)return null;const r=MPX.rem[t];return {kind:'hum',id:t,x:h.x,y:h.y,hpP:h.hpP==null?100:h.hpP,l:h.l,len:t===MPX.uid?P.len:(r?r.len:52)};}
function qbRoam(b,H,dt){b.wpT-=dt;if(b.wp&&b.wpT>0&&Math.hypot(b.wp.x-b.x,b.wp.y-b.y)>260)return;b.wpT=30;const e=qbEvt();const ok=H.filter(h=>qbHumOk(h)||(!h.vis&&!qbHavenNear(h.x,h.y,SAFE_R+300)));const r=Math.random();let p=null;
 if(e&&r<0.45)p=randomWater(e.x,e.y,150,700);
 else if(r<0.7&&NX&&NX.tc){const zs=Object.keys(NX.tc).filter(z=>NX.tc[z]&&NZ[z]!=null);if(zs.length){const pp=PORTS[NZ[zs[(Math.random()*zs.length)|0]]].port;p=randomWater(pp.x,pp.y,SAFE_R+200,NX_ZR);}}
 if(!p&&ok.length){const h=ok[(Math.random()*ok.length)|0];p=randomWater(h.x,h.y,200,900);}
 b.wp=p||randomWater(b.x,b.y,800,2600)||{x:WORLD/2,y:WORLD/2};}
function qbFire(b,side,T,d){const now=performance.now();if(side>0){b.fcR++;b.rr=b.st.reload*rand(0.9,1.25);}else{b.fcL++;b.rl=b.st.reload*rand(0.9,1.25);}QB.force=1;
 if(T.kind==='bot'){const p=clamp(1.05-0.6*d/b.st.rg,0.35,0.85);let n=0;for(let i=0;i<b.st.g;i++)if(Math.random()<p)n++;if(n)QB.pend.push({at:now+d/440*1000,to:T.id,from:b.id,pm:n*qbPm(b.l,b.hull,T.l)});}
 else if(T.kind==='boss'){const e=qbEvt();if(e){const w=QB.wb[e.id]=QB.wb[e.id]||{};w[b.id]=(w[b.id]||0)+b.st.g*b.st.dmg*0.55;QB.wbDirty=1;}}}
function qbSimBot(b,dt,H){const now=performance.now();
 if(b.dead){if(now-b.dead>9000)qbRespawn(b);return;}
 if(b.frz)return;
 if(now-b.hurtT>9000)b.hp=Math.min(b.st.maxHp,b.hp+b.st.maxHp*0.02*dt);
 b.rl-=dt;b.rr-=dt;b.tgT-=dt;if(b.tgT<=0)qbPick(b,H);
 const T=qbTgt(b,H);if(!T&&b.tg)b.tg='';
 let desired=b.h,thr=0.7;b.gr=0;let d=0,tto=0;
 if(T){d=Math.hypot(T.x-b.x,T.y-b.y);tto=Math.atan2(T.y-b.y,T.x-b.x);thr=1;
  const board=T.kind!=='boss'&&T.hpP<25;
  if(board){desired=tto;if(d<(b.len+(T.len||52))*0.5+55){b.gr=1;thr=0.25;}}
  else if(T.kind==='boss'){desired=d>520?tto+b.side*0.25:tto-b.side*Math.PI/2;if(d<700)b.hp-=b.st.maxHp*0.012*dt;}
  else if(d>330)desired=tto+b.side*0.3;else{desired=tto-b.side*Math.PI/2;thr=d<220?0.6:1;}}
 else{qbRoam(b,H,dt);desired=Math.atan2(b.wp.y-b.y,b.wp.x-b.x);thr=0.75;}
 const hv=qbHavenNear(b.x,b.y,SAFE_R+320);if(hv){desired=Math.atan2(b.y-hv.y,b.x-hv.x);thr=1;b.gr=0;}
 const ca=Math.cos(b.h),sa=Math.sin(b.h);for(const look of LOOKS){const o=inAnyIsland(b.x+ca*look,b.y+sa*look,35);if(o){const ai=Math.atan2(o.y-b.y,o.x-b.x);desired=b.h+(angDiff(ai,b.h)>=0?1:-1)*1.4;break;}}
 moveShip(b,desired,thr,b.st.spd,b.st.turn,dt);b.wakeT=1e9;
 if(T&&!b.gr&&!hv&&d<b.st.rg*0.95){const rel=angDiff(b.h,tto);if(Math.abs(rel-Math.PI/2)<0.32&&b.rr<=0)qbFire(b,1,T,d);else if(Math.abs(rel+Math.PI/2)<0.32&&b.rl<=0)qbFire(b,-1,T,d);}
 if(b.gr&&T&&T.kind==='bot')qbDmg(T.o,90*dt,b.id);
 if(b.hp<=0&&!b.dead)qbSink(b);}
function qbStr(b){const hh=((b.h%TAU)+TAU)%TAU;const fl=(b.dead?'d':'')+(mpSafeAt(b.x,b.y)?'z':'')+(b.gr?'g':'');
 return `${b.x|0},${b.y|0},${Math.round(hh*100)},${Math.round(Math.abs(b.speed||0))},${Math.round(clamp(b.hp/b.st.maxHp,0,1)*100)},${fl},${b.fcL},${b.fcR},${b.gr?b.tg:''}`;}
function qbSim(dt){const H=qbHumans();const now=performance.now();
 for(const b of QB.sim)qbSimBot(b,dt,H);
 for(let i=QB.pend.length-1;i>=0;i--){const p=QB.pend[i];if(now<p.at)continue;QB.pend.splice(i,1);const o=QB.sim.find(x=>x.id===p.to);if(o&&!mpSafeAt(o.x,o.y))qbDmg(o,p.pm,p.from);}
 // local render (host): feed own sim through the normal remote path every 0.1s
 QB.locT-=dt;if(QB.locT<=0||QB.force){QB.locT=0.1;for(const b of QB.sim)qbShow(b.id,qbStr(b),false);}
 if(QB.prDirty){QB.prT-=dt;if(QB.prT<=0){QB.prT=3;QB.prDirty=0;const o={};for(const b of QB.sim)o[b.id]=qbProf(b);MPX.stats.tx++;MPX.stats.txB+=JSON.stringify(o).length+60;MPX.fb.D.set(mpR(mpL('bp')),o).catch(mpErr);}}
 const near=QB.sim.some(b=>!b.dead&&H.some(h=>Math.abs(h.x-b.x)+Math.abs(h.y-b.y)<MP_NEAR*2.2));
 QB.sendT-=dt;if(QB.sendT<=0||(QB.force&&QB.sendT<(near?0.35:1.6))){QB.sendT=near?0.6:2;QB.force=0;
  const str=MPX.uid+'|'+QB.sim.map(b=>b.id+':'+qbStr(b)).join(';');if(str!==QB.btStr||near){QB.btStr=str;MPX.stats.tx++;MPX.stats.txB+=str.length+80;MPX.fb.D.set(mpR(mpL('bt')),str).catch(mpErr);}}
 QB.wbT-=dt;if(QB.wbT<=0&&QB.wbDirty){QB.wbT=2;QB.wbDirty=0;const e=qbEvt();if(e&&QB.wb[e.id]){const up={};for(const id in QB.wb[e.id])up[mpL(`wb/${e.id}/${id}`)]=Math.round(QB.wb[e.id][id]);nxUp(up).catch(mpErr);}}}
// ---------- every client: render bots + take bot hits ----------
function qbShow(id,s,lag){const sr=MPX.stats.rx,sb=MPX.stats.rxB;mpMot(id,s,'bot');if(!lag){MPX.stats.rx=sr;MPX.stats.rxB=sb;}const r=MPX.rem[id];if(!r)return;r.bot=1;r.uid=id;r.hb=mpNow();r.stale=false;r.j=0;r.tg=s.split(',')[8]||'';
 if(lag&&r.buf.length){const L=r.buf[r.buf.length-1];L.t+=350;}}
function qbBt(v){if(typeof v!=='string')return;QB.btT=performance.now();MPX.stats.rx++;MPX.stats.rxB+=v.length+60;if(QB.sim)return;const i=v.indexOf('|');
 for(const part of v.slice(i+1).split(';')){const j=part.indexOf(':');if(j<0)continue;const id=part.slice(0,j);if(qbIs(id))qbShow(id,part.slice(j+1),true);}}
function qbBp(v){QB.bp=v&&typeof v==='object'?v:{};for(const id of QB_IDS){const p=QB.bp[id];if(!p)continue;mpApplyP(id,Object.assign({},p,{hb:mpTS(),j:0}));const r=MPX.rem[id];if(r){r.bot=1;r.j=0;}}}
function qbHurtMe(id,pm){if(!MPX.on||P.dead||state!=='play')return;if(mpSafeAt(P.x,P.y)||mpNewb()||hullLocked())return;const r=MPX.rem[id];if(!r||/[znp]/.test(r.fl||''))return;
 const now=performance.now();const q=MPX.inRate[id]=(MPX.inRate[id]||[]).filter(e=>now-e.t<1000);const sum=q.reduce((s,e)=>s+e.d,0);const d=Math.min(clamp(pm,0,300),450-sum);if(!(d>0))return;q.push({t:now,d});
 MPX.lastHit={a:id,t:now};const was=P.dead;damagePlayer(d/1000*ST.maxHp);if(!was&&P.dead)MPX.killer={a:id,t:now};}
{const _xh=mpXHit;mpXHit=function(b){if(qbIs(b.src)&&!P.dead&&hitTest(P,b,2)){const r=MPX.rem[b.src];if(r)qbHurtMe(b.src,qbPm(r.l,r.hull,S.clvl|0));return true;}return _xh(b);};}
// human hits on bots go to lob/bh (host applies), same normalization + rate limit field as ev
mpFlushHits=function(){const ids=Object.keys(MPX.hits);if(!ids.length)return;const {D,db}=MPX.fb;const up={};let n=0;
 for(const id of ids){const r=MPX.rem[id],raw=MPX.hits[id];if(!r)continue;const lf=clamp(1+0.015*((S.clvl|0)-(r.l|0)),0.85,1.15);const pm=clamp(Math.round(1000*raw/Math.max(1,ST.maxHp)*0.9*lf),1,300);
  if(qbIs(id)){const k=D.push(mpR(mpL('bh'))).key;up[mpL('bh/'+k)]={a:MPX.uid,v:id,d:pm,t:mpTS()};}
  else{const k=D.push(mpR(mpL('ev/'+id))).key;up[mpL(`ev/${id}/${k}`)]={a:MPX.uid,d:pm,k:'b',t:mpTS()};}n++;}
 MPX.hits={};if(!n)return;up[mpL('hr/'+MPX.uid)]=mpTS();MPX.stats.tx++;MPX.stats.txB+=120*n;D.update(D.ref(db),up).catch(mpErr);};
function qbBoardMe(dt){if(P.dead||state!=='play')return;QB.bToastT-=dt;for(const id of QB_IDS){const r=MPX.rem[id];if(!r||!r.vis||r.deadF||!(r.fl||'').includes('g')||r.tg!==MPX.uid)continue;
  if(Math.hypot(r.x-P.x,r.y-P.y)>(r.len+P.len)*0.5+110)continue;qbHurtMe(id,90*dt);
  if(QB.bToastT<=0){QB.bToastT=6;toast(`⚔️ ${r.n}'s crew is boarding you — sail clear or sink them!`);}}}
function qbFrame(dt){if(!MPX.on||!MPX.fb){if(QB.sim||QB.hsub.length)qbRelease();QB.lid='';return;}
 if(QB.lid!==MPX.lid||QB.jt!==MPX.joinT){qbRelease();QB.lid=MPX.lid;QB.jt=MPX.joinT;QB.bp={};QB.btStr='';QB.off=qbOffNow();const {D}=MPX.fb;
  MPX.subs.push(D.onValue(mpR(mpL('bt')),s=>qbBt(s.val())));MPX.subs.push(D.onValue(mpR(mpL('bp')),s=>qbBp(s.val())));}
 if(!MPX.conn||MPX.rejoining)return;
 QB.chkT-=dt;if(QB.chkT<=0){QB.chkT=1;const h=!QB.off&&mpNow()-MPX.joinT>4000&&mpHostId()===MPX.uid;if(h&&!QB.sim)qbTakeover();else if(!h&&QB.sim)qbRelease();if(QB.sim)qbResub();}
 if(QB.sim)qbSim(dt);
 qbBoardMe(dt);}
{const _qf=mpFrame;mpFrame=function(dt){_qf(dt);try{qbFrame(dt);}catch(e){console.warn('bots',e);}};}
// profile card: small AI marker, no crew invite / duel / gift for bots
{const _qc=mpCardOpen;mpCardOpen=function(uid){_qc(uid);const r=MPX.rem[uid];if(!r||!r.bot)return;const body=$('mpCBody');if(!body)return;
 body.querySelectorAll('#mpCInv,[data-w],#mpCGift,.nxGift').forEach(e=>e.remove());body.querySelectorAll('div').forEach(d=>{if(/Duel:|Gift/.test(d.textContent)&&!d.querySelector('button'))d.remove();});
 const s=body.querySelector('.mpSec');if(s)s.insertAdjacentHTML('beforeend','<div class="qbTag">🤖 AI captain · sails for this lobby</div>');};}
(function(){const st=document.createElement('style');st.textContent='.qbTag{margin-top:4px;font-size:11px;opacity:.75;font-style:italic}';document.head.appendChild(st);})();
function qbCount(){let n=0;for(const id of QB_IDS){const r=MPX.rem[id];if(r&&!r.stale&&performance.now()-r.seenT<15000)n++;}return n;}
// test hooks
const qbTest={place(i,x,y,h){if(!QB.sim)return false;const b=QB.sim[i];b.x=x;b.y=y;b.vx=b.vy=0;b.speed=0;if(h!=null)b.h=h;b.wp=null;QB.force=1;return true;},
 hp(i,f){if(!QB.sim)return false;const b=QB.sim[i];b.hp=b.st.maxHp*f;return true;},tg(i,t){if(!QB.sim)return false;QB.sim[i].tg=t;QB.sim[i].tgT=30;return true;},
 freeze(i,on){if(!QB.sim)return;QB.sim[i].frz=on;},sim:()=>QB.sim&&QB.sim.map(b=>({id:b.id,n:b.n,l:b.l,hull:b.hull,hp:Math.round(b.hp),max:b.st.maxHp,x:b.x|0,y:b.y|0,tg:b.tg,dead:!!b.dead,k:b.k,b:b.b,c:b.c,gr:b.gr}))};
