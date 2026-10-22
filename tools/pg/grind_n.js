// ================= N: ONLINE FEATURES — lobby events (world boss / treasure race / smuggling), territory & outposts, duels,
// wanted poster, weekly leaderboard + seasons, Infamy marks shop, global market, crew plunder split, co-op join-boarding =================
const NXK={boss:['🐙','World boss'],race:['💰','Treasure race'],smug:['📦','Smuggling run']};
const NX={tab:'lobby',e:null,nx:0,subE:null,wb:{},myDmg:{},wbDirty:0,wbT:0,done:{},wn:{},dig:0,tc:{},capT:{},taxT:60,sgT:0,duel:null,chal:{},ask:[],lb:null,lbT:0,lbPrev:null,lbDirty:0,lbFlushT:5,
 mk:null,mkT:0,mkMine:{},bd:{},bdHost:null,bjoin:null,ally:null,stT:0,evT:0,lastK:'',wantedTop:'',bossLocal:null,first:180000,hostT:2,uiT:0,zone:-1};
const NX_ZR=750,NX_SAFE_SPAWN=1200;
const nxWeek=(o)=>'W'+(Math.floor((mpNow()+3*864e5)/6048e5)+(o|0));
function nxMarks(n,x,y){n=Math.round(n);if(!(n>0))return;S.mpM=(S.mpM|0)+n;if(x!=null)addText(x,y-70,`+${n}☠`,'#d7b8ff');}
function nxScore(n){n=Math.round(n);if(!(n>0))return;const w=nxWeek();S.mpW=S.mpW&&typeof S.mpW==='object'?S.mpW:{};S.mpW[w]=(S.mpW[w]|0)+n;for(const k in S.mpW)if(k<nxWeek(-3))delete S.mpW[k];NX.lbDirty=1;}
function nxGold(n,why){n=Math.round(n);if(!(n>0))return;S.gold+=n;S.earned=(S.earned||0)+n;}
function nxSmugPos(){if(!NX.smug)return null;if(NX.smug===MPX.uid)return[P.x,P.y];const r=MPX.rem[NX.smug];if(r&&r.vis&&!r.stale&&performance.now()-(r.seenT||0)<4000)return mpPosOf(NX.smug);return NX.sp&&isFinite(NX.sp[0])?NX.sp:null;}
const nxD=()=>MPX.fb.D,nxDb=()=>MPX.fb.db;
function nxUp(o){return nxD().update(nxD().ref(nxDb()),o);}
function nxSys(txt){if(!MPX.on)return;const D=nxD();const k=D.push(mpR(mpL('ch'))).key;nxUp({[mpL('ch/'+k)]:{u:MPX.uid,n:MPX.name,m:mpClean(txt).slice(0,120),e:'sys',t:mpTS()},[mpL('rl/'+MPX.uid)]:mpTS()}).catch(()=>{});}
// ---------- shop (Infamy marks) ----------
const NSHOP=[['sail','tattered','Tattered Black',120,'#26211c'],['flag','wanted','Wanted Skull',150,'#5a1010','#ffd34d'],['hull','krakenink','Kraken Ink',200,'#1d2638','#4a5d7a'],['fx','cursed','Cursed Violet',220],
 ['sail','bloodmoon','Blood Moon',260,'#7a1414'],['flag','seawolf','Sea Wolf',300,'#123a4a','#cfe8ff'],['hull','bone','Bone White',350,'#cfc6b0','#8a7f66'],['sail','champion','Season Champion',99999,'#ffcc33']];
for(const it of NSHOP){const row=[it[1],it[2],999].concat(it.slice(4));if(!COS[it[0]].some(x=>x[0]===it[1]))COS[it[0]].push(row);}
FXC.cursed='#b06bff';
function nxBuy(cat,id){const it=NSHOP.find(x=>x[0]===cat&&x[1]===id);if(!it||it[3]>=99999)return false;S.cosU=S.cosU||{};if(S.cosU[cat+':'+id])return false;if((S.mpM|0)<it[3]){toast(`☠ Need ${it[3]} Infamy marks.`);return false;}
 S.mpM-=it[3];S.cosU[cat+':'+id]=1;equipCos(cat+':'+id);toast(`🎨 ${it[2]} unlocked & equipped!`);save();mpPanelRender();return true;}
// ---------- territory zones (non-haven ports) ----------
const NZ=[];{const c=PORTS.map((p,i)=>[p,i]).filter(([p])=>!p.haven&&!p.story);for(const [p,i] of c){if(NZ.length>=6)break;if(NZ.every(z=>Math.hypot(PORTS[z].port.x-p.port.x,PORTS[z].port.y-p.port.y)>3500))NZ.push(i);}}
function nxZoneAt(x,y){for(let z=0;z<NZ.length;z++){const p=PORTS[NZ[z]].port;if(Math.hypot(p.x-x,p.y-y)<NX_ZR)return z;}return -1;}
function nxOwnerHere(t){if(!t)return false;return t.u===MPX.uid||!!MPX.rem[t.u]&&!MPX.rem[t.u].stale;}
function nxMine(t){return !!t&&(t.u===MPX.uid||(MPX.crew&&t.cr===MPX.crew));}
// ---------- events: host scheduling ----------
function nxHost(){if(!MPX.host||!MPX.on)return;const now=mpNow(),e=NX.e,up={};
 if(e&&(now>e.end+4000||NX.done[e.id]==='over')){up[mpL('w/e')]=null;up[mpL('w/sp')]=null;}
 else if(!e){if(!NX.nx){up[mpL('w/nx')]=now+NX.first;}else if(now>=NX.nx){const k=nxPickK();Object.assign(up,nxMake(k,now));}}
 if(Object.keys(up).length)nxUp(up).catch(mpErr);}
function nxPickK(){const ks=Object.keys(NXK).filter(k=>k!==NX.lastK);return ks[(Math.random()*ks.length)|0];}
function nxMake(k,now,lead){let sx=P.x,sy=P.y,n=1,lv=S.clvl|0;for(const id in MPX.rem){const r=MPX.rem[id];if(r.stale)continue;const p=mpPosOf(id);if(p){sx+=p[0];sy+=p[1];n++;}lv+=r.l|0;}
 sx/=n;sy/=n;lv=Math.round(lv/n);let pt=null;for(let i=0;i<12&&!pt;i++){const q=randomWater(sx,sy,1400,4200);if(q&&!mpSafeAt(q.x,q.y)&&PORTS.every(p=>!p.haven||Math.hypot(p.port.x-q.x,p.port.y-q.y)>NX_SAFE_SPAWN+600))pt=q;}
 if(!pt)pt=randomWater(sx,sy,800,6000)||{x:clamp(sx+2000,500,WORLD-500),y:clamp(sy,500,WORLD-500)};
 const at=now+(lead==null?45000:lead),dur=k==='boss'?600000:k==='race'?360000:480000;
 const e={id:'E'+Math.floor(now/1000).toString(36)+mpGen(3),k,x:Math.round(pt.x),y:Math.round(pt.y),at,end:at+dur,lv:clamp(lv+2,6,40)};
 if(k==='boss')e.hp=Math.round(2600+1100*n+120*lv);
 if(k==='smug'){let best=-1,bd=0;PORTS.forEach((p,i)=>{if(p.story)return;const d=Math.hypot(p.port.x-pt.x,p.port.y-pt.y);if(d>4500&&d<9000&&(best<0||Math.abs(d-6000)<bd)){best=i;bd=Math.abs(d-6000);}});if(best<0)best=mpNearHaven();e.dp=best;}
 return{[mpL('w/e')]:e,[mpL('w/nx')]:at+(20+Math.random()*10)*60000};}
function nxForce(k,lead){if(!MPX.on)return Promise.reject(new Error('offline'));return nxUp(nxMake(k||nxPickK(),mpNow(),lead==null?3000:lead));}
// ---------- events: everyone ----------
function nxOnW(v){v=v||{};NX.nx=v.nx||0;NX.sp=typeof v.sp==='string'?v.sp.split(',').map(Number):null;const e=v.e&&v.e.id?v.e:null;const old=NX.e;NX.e=e;
 if(e&&(!old||old.id!==e.id)){NX.lastK=e.k;NX.dig=0;nxSubEv(e);const K=NXK[e.k]||['⭐','Event'];const secs=Math.max(0,Math.round((e.at-mpNow())/1000));
  const where=nxDirTxt(e.x,e.y);mpFeed(`${K[0]} <b>${K[1]}</b>${secs>2?` in ${secs}s`:' now'} — ${where}${e.k==='smug'?` → deliver to <b>${mpEsc(PORTS[e.dp].name)}</b>`:''}`);if(state==='play')toast(`${K[0]} Lobby event: ${K[1]} — ${where}`);}
 if(!e&&old){nxSubEv(null);if(NX.bossLocal){const b=NX.bossLocal;if(!b.sinking){const i=enemies.indexOf(b);if(i>=0)enemies.splice(i,1);}NX.bossLocal=null;}if(NX.smug)NX.smug=null;}}
function nxDirTxt(x,y){const d=Math.hypot(x-P.x,y-P.y),a=Math.atan2(y-P.y,x-P.x);const dirs=['E','SE','S','SW','W','NW','N','NE'];return `${(d/1000).toFixed(1)}k ${dirs[((Math.round(a/(Math.PI/4))%8)+8)%8]}`;}
function nxSubEv(e){if(NX.subE){NX.subE.forEach(f=>f());NX.subE=null;}if(!e||!MPX.on)return;const D=nxD();const s=[];
 if(e.k==='boss')s.push(D.onValue(mpR(mpL('wb/'+e.id)),sn=>{NX.wb[e.id]=sn.val()||{};MPX.stats.rx++;MPX.stats.rxB+=60+JSON.stringify(NX.wb[e.id]).length;nxBossCheck(e);}));
 s.push(D.onValue(mpR(mpL('wn/'+e.id)),sn=>nxWin(e,sn.val(),'p')));
 if(e.k==='smug')s.push(D.onValue(mpR(mpL('wn/'+e.id+'d')),sn=>nxWin(e,sn.val(),'d')));
 NX.subE=s;}
function nxTotal(e){const w=NX.wb[e.id]||{};let t=0;for(const u in w)if(u!==MPX.uid)t+=+w[u]||0;return t+(NX.myDmg[e.id]||0);}
function nxBossCheck(e){if(NX.done[e.id]||!(e.hp>0))return;const tot=nxTotal(e);if(tot<e.hp)return;NX.done[e.id]='over';
 const b=NX.bossLocal;if(b&&!b.sinking){b.hp=0;b.sinking=0.001;for(let k=0;k<30;k++)addPart('fire',b.x+rand(-60,60),b.y+rand(-40,40),rand(-90,90),rand(-90,90),rand(0.5,1.1),rand(6,12),null);boom(1,200);}
 const w=Object.assign({},NX.wb[e.id]||{},{[MPX.uid]:NX.myDmg[e.id]||0});const parts=Object.keys(w).filter(u=>(+w[u]||0)>0);const my=NX.myDmg[e.id]||0;
 mpFeed(`🐙 <b>The Dread Leviathan</b> is slain! ${parts.length} captain${parts.length>1?'s':''} split the hoard.`);
 if(my>0){const sh=Math.min(1,my/Math.max(1,tot));const pool=4000+1500*parts.length+150*e.lv;const g=Math.round(pool*Math.max(sh,0.08));nxGold(g);nxMarks(20+40*sh,P.x,P.y);nxScore(100+300*sh);grantXP(Math.round(150+500*sh),P.x,P.y);
  toast(`🐙 Leviathan slain! Your damage share ${Math.round(sh*100)}% → +${g}💰 +${Math.round(20+40*sh)}☠`);chime();save();}}
function nxWin(e,v,kind){if(!v)return;const key=e.id+kind;if(NX.wn[key])return;NX.wn[key]=v;const me=v.u===MPX.uid;
 if(e.k==='race'){NX.done[e.id]='over';mpFeed(`💰 <b>${mpEsc(mpClean(v.n))}</b> dug up the treasure!`);if(me){const g=2500+180*e.lv;nxGold(g);nxMarks(30,P.x,P.y);nxScore(150);grantXP(200,P.x,P.y);toast(`💰 Treasure is yours! +${g}💰 +30☠`);chime();save();}}
 if(e.k==='smug'&&kind==='p'){NX.smug=v.u;mpFeed(`📦 <b>${mpEsc(mpClean(v.n))}</b> grabbed the contraband — beacon lit! Sink them to steal the reward.`);if(me)toast(`📦 Contraband aboard! Deliver to ${PORTS[e.dp].name} — everyone can see your beacon.`);}
 if(e.k==='smug'&&kind==='d'){NX.done[e.id]='over';NX.smug=null;mpFeed(`📦 <b>${mpEsc(mpClean(v.n))}</b> delivered the contraband!`);if(me){const g=5000+200*e.lv;nxGold(g);nxMarks(40,P.x,P.y);nxScore(200);grantXP(250,P.x,P.y);toast(`📦 Smuggling run complete! +${g}💰 +40☠`);chime();save();}}}
function nxClaim(e,suffix,r){if(NX.claiming)return;NX.claiming=1;const p=mpL('wn/'+e.id+(suffix||''));
 nxUp({[p]:{u:MPX.uid,n:MPX.name,t:mpTS(),r}}).catch(()=>{if(r==='win')toast('💨 Too late — someone beat you to it!');}).finally(()=>{NX.claiming=0;});}
function nxEvTick(dt){const e=NX.e;if(!e)return;const now=mpNow();if(now<e.at||now>e.end)return;const d=Math.hypot(e.x-P.x,e.y-P.y);
 if(e.k==='boss'&&!NX.done[e.id]){if(!NX.bossLocal&&d<3600){const b=makeEnemy('boss',e.x,e.y,clamp(e.lv,1,40),{name:'The Dread Leviathan',home:{x:e.x,y:e.y}});b.keep=true;b.mpb=e.id;b.maxHp=e.hp;b.hp=Math.max(1,e.hp-nxTotal(e));b.gold=0;b.len=(b.len||70)*1.25;b.wid=(b.wid||26)*1.25;enemies.push(b);NX.bossLocal=b;}
  const b=NX.bossLocal;if(b){if(!enemies.includes(b)&&!b.sinking){NX.bossLocal=null;}else if(!b.sinking){b.maxHp=e.hp;b.hp=Math.max(1,e.hp-nxTotal(e));}}
  NX.wbT-=dt;if(NX.wbT<=0&&NX.wbDirty){NX.wbT=1;NX.wbDirty=0;nxUp({[mpL('wb/'+e.id+'/'+MPX.uid)]:Math.round(NX.myDmg[e.id]||0)}).catch(mpErr);MPX.stats.tx++;MPX.stats.txB+=90;nxBossCheck(e);}}
 const canAct=state==='play'&&!P.dead;
 if((e.k==='race'||(e.k==='smug'&&!NX.wn[e.id+'p']))&&!NX.done[e.id]&&!NX.wn[e.id+'p']){if(canAct&&d<170){NX.dig+=dt;const need=e.k==='race'?3:2;if(NX.dig>=need){NX.dig=0;nxClaim(e,'',e.k==='race'?'win':'pick');}}else NX.dig=Math.max(0,NX.dig-dt*2);}
 if(e.k==='smug'&&NX.smug===MPX.uid&&!NX.wn[e.id+'d']){NX.spT=(NX.spT||0)-dt;if(NX.spT<=0){NX.spT=3;nxUp({[mpL('w/sp')]:`${P.x|0},${P.y|0}`}).catch(()=>{});MPX.stats.tx++;MPX.stats.txB+=90;}}
 if(e.k==='smug'&&NX.smug===MPX.uid&&!NX.wn[e.id+'d']&&canAct){const p=PORTS[e.dp].port;if(Math.hypot(p.x-P.x,p.y-P.y)<420)nxClaim(e,'d','done');}}
// boss damage is pooled: your hits count toward the shared health bar instead of the local copy
{const _de=damageEnemy;damageEnemy=function(e,dmg){if(e&&e.mpb){if(e.sinking||!(dmg>0))return;let d=dmg;try{d=hardDmgMod(e,dmg);}catch(_){}if(!(d>0))return;NX.myDmg[e.mpb]=(NX.myDmg[e.mpb]||0)+d;NX.wbDirty=1;e.hitT=0.25;e.angry=true;addText(e.x,e.y-20,'-'+Math.round(d),'#ffd27a');return;}return _de(e,dmg);};}
// ---------- territory ----------
function nxTerrTick(dt){const z=nxZoneAt(P.x,P.y);NX.zone=z;const now=mpNow();
 for(let i=0;i<NZ.length;i++)if(i!==z)NX.capT[i]=0;
 if(z>=0&&state==='play'&&!P.dead){const t=NX.tc[z];const p=PORTS[NZ[z]].port;
  if(!nxMine(t)){let rival=false;for(const id in MPX.rem){const r=MPX.rem[id];if(!r.vis||r.stale||r.deadF)continue;if(MPX.crew&&r.cr===MPX.crew)continue;if(Math.hypot(r.x-p.x,r.y-p.y)<NX_ZR){rival=true;break;}}
   const need=!t||!nxOwnerHere(t)?12:t.o?45:25;if(rival){NX.capT[z]=Math.max(0,(NX.capT[z]||0)-dt);}else NX.capT[z]=(NX.capT[z]||0)+dt;
   if(NX.capT[z]>=need){NX.capT[z]=0;const cw=MPX.crew&&MPX.cw[MPX.crew];nxUp({[mpL('tc/'+z)]:{u:MPX.uid,n:MPX.name,cr:MPX.crew||'',cn:(MPX.crewName||'').slice(0,20),t:mpTS(),o:0,f:String(S.cos.flag||'def').slice(0,12)}}).then(()=>{nxSys(`🏴 ${MPX.name} seized ${PORTS[NZ[z]].name}!`);nxScore(25);nxMarks(5,P.x,P.y);toast(`🏴 ${PORTS[NZ[z]].name} is yours — it pays you tax every minute.`);}).catch(mpErr);}}
  else NX.capT[z]=0;}
 // owners: tax + refresh + siege warnings
 NX.taxT-=dt;if(NX.taxT<=0){NX.taxT=60;let g=0,n=0;for(let i=0;i<NZ.length;i++){const t=NX.tc[i];if(!t||t.u!==MPX.uid)continue;const p=PORTS[NZ[i]].port;g+=Math.round((120+30*lvlAt(p.x,p.y))*(t.o?1.5:1));n++;
   if(now-(t.t||0)>300000)nxUp({[mpL('tc/'+i)]:Object.assign({},t,{t:mpTS()})}).catch(()=>{});}
  if(g>0){nxGold(g);nxMarks(n);nxScore(5*n);mpFeed(`🏴 Territory tax: +${g}💰 from ${n} port${n>1?'s':''}`);save();}}
 NX.sgT-=dt;if(NX.sgT<=0){NX.sgT=20;for(let i=0;i<NZ.length;i++){const t=NX.tc[i];if(!nxMine(t))continue;const p=PORTS[NZ[i]].port;for(const id in MPX.rem){const r=MPX.rem[id];if(!r.vis||r.stale||(MPX.crew&&r.cr===MPX.crew))continue;if(Math.hypot(r.x-p.x,r.y-p.y)<NX_ZR){mpFeed(`⚠️ <b>${mpEsc(r.n)}</b> is besieging your ${t.o?'outpost':'port'} at ${mpEsc(PORTS[NZ[i]].name)}!`);break;}}}}}
function nxBuildOutpost(z){const t=NX.tc[z];if(!t||t.u!==MPX.uid||t.o){return false;}if(S.gold<3000){toast('🏰 An outpost costs 3000💰.');return false;}
 S.gold-=3000;nxUp({[mpL('tc/'+z)]:Object.assign({},t,{o:1,t:mpTS()})}).then(()=>{toast(`🏰 Outpost built at ${PORTS[NZ[z]].name}: respawn point, +50% tax, 45s siege.`);nxSys(`🏰 ${MPX.name} fortified ${PORTS[NZ[z]].name}`);save();}).catch(e=>{S.gold+=3000;mpErr(e);});return true;}
function nxOutpostPort(){let best=-1,bd=1e18;for(let i=0;i<NZ.length;i++){const t=NX.tc[i];if(!t||!t.o||!nxMine(t))continue;const p=PORTS[NZ[i]].port;const d=Math.hypot(p.x-P.x,p.y-P.y);if(d<bd){bd=d;best=NZ[i];}}return best;}
// ---------- duels ----------
function nxChallenge(uid,w){const r=MPX.rem[uid];if(!r||NX.duel)return false;w=Math.max(0,Math.round(w|0));if(w>S.gold){toast('💰 Not enough gold for that wager.');return false;}
 NX.chal[uid]={w,t:Date.now()};nxUp({[mpL(`du/${uid}/${MPX.uid}`)]:{n:MPX.name,w,t:mpTS()}}).then(()=>toast(`⚔️ Challenge sent to ${r.n} (${w}💰 wager)`)).catch(mpErr);return true;}
function nxDuIn(s){const v=s.val(),from=s.key;nxD().remove(s.ref).catch(()=>{});if(!v||mpNow()-(v.t||0)>60000)return;const r=MPX.rem[from];if(!r)return;
 if(v.ok){const c=NX.chal[from];delete NX.chal[from];if(!c||NX.duel)return;nxDuelStart(from,c.w);return;}
 nxAsk(`⚔️ <b>${mpEsc(r.n)}</b> (Lv${r.l}) challenges you to a duel${v.w?` for <b>${v.w|0}💰</b>`:''}!`,'Accept','Decline',()=>{if(NX.duel)return;if((v.w|0)>S.gold){toast('💰 Not enough gold to match the wager.');return;}
  nxUp({[mpL(`du/${from}/${MPX.uid}`)]:{n:MPX.name,w:v.w|0,t:mpTS(),ok:1}}).then(()=>{nxDuelStart(from,v.w|0);nxSys(`⚔️ Duel: ${r.n} vs ${MPX.name}${v.w?` — ${v.w|0} gold on the line`:''}! Tap either captain → Watch.`);}).catch(mpErr);});}
function nxDuelStart(o,w){const r=MPX.rem[o];if(!r)return;S.gold-=w;NX.duel={o,n:r.n,w,end:mpNow()+240000};MPX.force=true;toast(`⚔️ Duel with ${r.n}! Only you two can hit each other. 4 minutes.`);chime();save();}
function nxDuelEnd(res){const d=NX.duel;if(!d)return;NX.duel=null;MPX.force=true;
 if(res==='win'){nxGold(d.w*2);nxMarks(15,P.x,P.y);nxScore(50);S.mpDu=(S.mpDu|0)+1;toast(`🏆 You won the duel against ${d.n}!${d.w?` +${d.w*2}💰`:''}`);chime();}
 else if(res==='draw'){S.gold+=d.w;toast(`⚔️ Duel with ${d.n} ended in a draw — wager returned.`);}
 else toast(`💀 ${d.n} won the duel.`);save();}
// ---------- prompts ----------
function nxAsk(html,yes,no,onYes,onNo){NX.ask.push({html,yes,no,onYes,onNo});if(NX.ask.length===1)nxAskShow();}
function nxAskShow(){const p=$('nxAsk');const a=NX.ask[0];if(!a){p.classList.add('hidden');return;}p.innerHTML=`${a.html}<div style="display:flex;gap:6px;margin-top:6px"><button class="mpB" id="nxY" style="flex:1">${a.yes}</button><button class="mpB" id="nxN" style="flex:1">${a.no}</button></div>`;p.classList.remove('hidden');
 const done=f=>{NX.ask.shift();clearTimeout(a.to);try{f&&f();}catch(e){console.warn(e);}nxAskShow();};$('nxY').onclick=()=>done(a.onYes);$('nxN').onclick=()=>done(a.onNo);a.to=setTimeout(()=>{if(NX.ask[0]===a)done(a.onNo);},25000);}
// ---------- crew plunder split + gifts ----------
function nxMates(R){const out=[];if(!MPX.crew)return out;for(const id in MPX.rem){const r=MPX.rem[id];if(r.cr===MPX.crew&&!r.stale&&r.vis&&!r.deadF&&Math.hypot(r.x-P.x,r.y-P.y)<(R||2500))out.push(id);}return out;}
function nxSplit(gain,why){if(!MPX.on||!(gain>0))return;const m=nxMates();if(!m.length)return;const sh=Math.floor(gain/(m.length+1));if(sh<1)return;const D=nxD();const up={};
 for(const id of m){const k=D.push(mpR(mpL('gf/'+id))).key;up[mpL(`gf/${id}/${k}`)]={a:MPX.uid,g:Math.min(20000,sh),n:MPX.name,why:why||'plunder',t:mpTS()};}
 S.gold-=sh*m.length;nxUp(up).then(()=>mpFeed(`🤝 Plunder split with ${m.length} crewmate${m.length>1?'s':''}: ${sh}💰 each`)).catch(e=>{S.gold+=sh*m.length;mpErr(e);});}
function nxGift(s){const v=s.val();nxD().remove(s.ref).catch(()=>{});if(!v)return;const r=MPX.rem[v.a];if(!r||!(MPX.crew&&r.cr===MPX.crew))return;const g=clamp(v.g|0,0,20000);if(!g)return;
 nxGold(g);toast(`🤝 ${mpClean(v.n||r.n)} shared ${g}💰 ${v.why==='boarding'?'boarding loot':'plunder'}`);addText(P.x,P.y-50,`+${g} 💰`,'#ffe066',true);save();}
{const _sr=sinkRewards;sinkRewards=function(e){const n0=loot.length;_sr(e);const lt=loot.length>n0?loot[loot.length-1]:null;if(e&&!e.mpb&&lt&&lt.gold>0&&MPX.on){const m=nxMates().length;if(m){const sh=Math.floor(lt.gold/(m+1));lt.gold-=sh*m;S.gold+=sh*m;nxSplit(sh*(m+1),'plunder');}}};}
{const _bo=board;board=function(e){const g0=S.gold;_bo(e);nxSplit(S.gold-g0,'plunder');};}
// ---------- co-op boarding (host = initiator) ----------
function nxBdTick(dt){const D=nxD();const me=MPX.uid;
 if(BR.on&&(BR.mode==='deck'||BR.mode==='duel')&&BR.e&&!NX.bdHost){NX.bdHost={t0:performance.now(),g0:S.gold,j:null};const e=BR.e;
  nxUp({[mpL('bd/'+me)]:{n:String(e.name||(e.kind==='merchant'?'merchantman':e.kind==='navy'?'navy warship':'pirate ship')).slice(0,24),hn:MPX.name,x:P.x|0,y:P.y|0,t:mpTS(),st:'pick'}}).catch(mpErr);D.onDisconnect(mpR(mpL('bd/'+me))).remove().catch(()=>{});
  NX.bdSub=D.onChildAdded(mpR(mpL('bd/'+me+'/j')),s=>{const v=s.val();if(!v||NX.bdHost.j)return;NX.bdHost.j={uid:s.key,n:mpClean(v.n||'?'),l:v.l|0};mpFeed(`⚔️ <b>${mpEsc(NX.bdHost.j.n)}</b> leaps aboard to fight beside you!`);nxAlly();});
  NX.bdOSub=D.onChildChanged(mpR(mpL('bd/'+me+'/j')),s=>{const v=s.val();if(v&&NX.ally)nxOrder(NX.ally,v.o);});}
 if(NX.bdHost){const H=NX.bdHost;if(BR.on){if(H.j&&!NX.ally&&BR.ph==='fight')nxAlly();NX.stT-=dt;if(NX.stT<=0){NX.stT=0.3;const st=[BR.ph,aliveSide(0),aliveSide(1),NX.ally?Math.max(0,NX.ally.hp|0):0,NX.ally?NX.ally.max|0:0,Math.round(BR.sides[1].pool),Math.round(BR.t)].join(',');
    if(st!==H.lst){H.lst=st;nxUp({[mpL('bd/'+me+'/st')]:st}).catch(()=>{});MPX.stats.tx++;MPX.stats.txB+=st.length+70;}}}
  else{const r=BR.out||'end';const gain=Math.max(0,S.gold-H.g0);let g=0;if(H.j&&r==='win'&&gain>0){g=Math.floor(gain*0.4);const k=D.push(mpR(mpL('gf/'+H.j.uid))).key;S.gold-=g;nxUp({[mpL(`gf/${H.j.uid}/${k}`)]:{a:me,g:Math.min(20000,Math.max(1,g)),n:MPX.name,why:'boarding',t:mpTS()}}).catch(e=>{S.gold+=g;mpErr(e);});}
   nxUp({[mpL('bd/'+me+'/r')]:String(r).slice(0,12),[mpL('bd/'+me+'/g')]:g}).catch(()=>{});setTimeout(()=>{if(!BR.on)D.remove(mpR(mpL('bd/'+me))).catch(()=>{});},6000);
   if(NX.bdSub){NX.bdSub();NX.bdSub=null;}if(NX.bdOSub){NX.bdOSub();NX.bdOSub=null;}NX.bdHost=null;NX.ally=null;}}
 // joiner
 const J=NX.bjoin;if(J){const b=NX.bd[J.host];P.speed=0;P.throttle=0;P.vx*=0.9;P.vy*=0.9;
  if(!b||(performance.now()-J.seen>9000)){NX.bjoin=null;$('nxBJ').classList.add('hidden');toast(b?'⚔️ Lost sight of the boarding — back to your ship.':'⚔️ The boarding host is gone — back to your ship.');MPX.force=true;}
  else nxBJRender(b);}}
function nxAlly(){const H=NX.bdHost;if(!H||!H.j||NX.ally||!BR.on||BR.ph!=='fight')return;const u=spawnFighter(0,true);if(!u)return;u.name=H.j.n;u.hc='#5bff7a';u.col='#2f6d3a';const k=1.4+Math.min(0.8,(H.j.l||1)/60);u.hp*=k;u.max=u.hp;u.dmg*=1.25;u.mpAlly=1;NX.ally=u;BR.mpHold=0;}
function nxOrder(u,o){if(!u||u.dead)return;if(o==='hold'){u.spd=Math.min(u.spd,60);}else if(o==='pistols'){u.shots=Math.max(u.shots,2);u.maxShots=2;u.spd=Math.max(u.spd,95);}else u.spd=Math.max(u.spd,105);}
function nxBdOn(s){const v=s.val();const host=s.key;if(!v){delete NX.bd[host];return;}const was=NX.bd[host];NX.bd[host]=v;if(NX.bjoin&&NX.bjoin.host===host)NX.bjoin.seen=performance.now();
 if(!was&&host!==MPX.uid&&mpNow()-(v.t||0)<30000){const r=MPX.rem[host];const crew=r&&MPX.crew&&r.cr===MPX.crew;mpFeed(`⚔️ <b>${mpEsc(mpClean(v.hn))}</b> is boarding a ${mpEsc(v.n)}${crew?' — <b>crewmate! Join the fight</b>':''}`);
  const p=mpPosOf(host);if(crew&&p&&Math.hypot(p[0]-P.x,p[1]-P.y)<1600&&state==='play'&&!P.dead&&!BR.on&&!NX.bjoin)nxAsk(`⚔️ Crewmate <b>${mpEsc(mpClean(v.hn))}</b> is boarding a ${mpEsc(v.n)}. Join the boarding?`,'⚔️ Join boarding','Stay',()=>nxJoinBd(host));}
 if(v.r&&NX.bjoin&&NX.bjoin.host===host){const r=v.r;NX.bjoin=null;$('nxBJ').classList.add('hidden');MPX.force=true;
  if(r==='win'){grantXP(90,P.x,P.y);nxScore(30);nxMarks(5,P.x,P.y);toast(`🏴‍☠️ Boarding won with ${mpClean(v.hn)}!${v.g?` Your share ${v.g|0}💰 arrives now.`:''}`);}else toast(r==='lose'?'💀 The boarding failed.':'✂️ Ropes cut — boarding over.');save();}}
function nxJoinBd(host){const b=NX.bd[host];if(!b||b.r||NX.bjoin||BR.on)return;const p=mpPosOf(host);if(!p||Math.hypot(p[0]-P.x,p[1]-P.y)>1800){toast('⚔️ Too far away to join.');return;}
 if(b.j&&Object.keys(b.j).length>=1){toast('⚔️ Boarding is full (2 per side).');return;}
 nxUp({[mpL(`bd/${host}/j/${MPX.uid}`)]:{n:MPX.name,t:mpTS(),l:clamp(S.clvl|0,1,999),o:'charge'}}).then(()=>{NX.bjoin={host,seen:performance.now(),o:'charge'};MPX.force=true;$('nxBJ').classList.remove('hidden');nxBJRender(b);toast('⚔️ You leap aboard! Your hull is locked while you fight.');}).catch(mpErr);}
function nxBJRender(b){const el=$('nxBJ');const a=String(b.st||'pick').split(',');const ph=a[0];const h=`<div class="nxH">⚔️ Boarding with <b>${mpEsc(mpClean(b.hn))}</b> — ${mpEsc(b.n)}</div>
 ${ph==='fight'||ph==='end'||ph==='res'?`<div>🗡️ Your boarder: <b>${a[3]|0}/${a[4]|0}</b> ❤️ · 🏴‍☠️ Ours ${a[1]|0} · ☠️ Theirs ${a[2]|0} (+${a[5]|0} below) · ⏱️ ${a[6]|0}s</div>
 <div class="nxBar"><i style="width:${Math.round(100*(a[3]|0)/Math.max(1,a[4]|0))}%"></i></div>`:'<div>⏳ Grappling… fight starts in a moment.</div>'}
 <div style="display:flex;gap:5px;margin-top:5px">${['charge','hold','pistols'].map(o=>`<button class="mpB${NX.bjoin&&NX.bjoin.o===o?' on':''}" data-bo="${o}" style="flex:1">${o==='charge'?'⚔️ Charge':o==='hold'?'🛡️ Hold':'🔫 Pistols'}</button>`).join('')}</div>`;
 if(el._h!==h){el._h=h;el.innerHTML=h;}}
// ---------- leaderboard & seasons ----------
async function nxLbFetch(force){if(!MPX.fb)return null;if(!force&&NX.lb&&performance.now()-NX.lbT<30000)return NX.lb;const D=nxD();const w=nxWeek();
 const sn=await D.get(D.query(mpR('lb/'+w),D.orderByChild('s'),D.limitToLast(10)));const out=[];sn.forEach(c=>{out.push(Object.assign({uid:c.key},c.val()));});out.sort((a,b)=>b.s-a.s);NX.lb=out;NX.lbT=performance.now();return out;}
function nxLbFlush(){const w=nxWeek();const s=(S.mpW&&S.mpW[w])|0;if(!s||!MPX.fb)return;NX.lbDirty=0;nxUp({['lb/'+w+'/'+MPX.uid]:{n:MPX.name||S.mpName||'Captain',s,k:clamp(S.mpK|0,0,1e6),b:clamp(Math.round(S.mpB||0),0,1e8),l:clamp(S.clvl|0,1,999),t:mpTS()}}).catch(mpErr);}
async function nxSeason(){const pw=nxWeek(-1);S.lbClaim=S.lbClaim&&typeof S.lbClaim==='object'?S.lbClaim:{};const my=(S.mpW&&S.mpW[pw])|0;if(!my||S.lbClaim[pw])return;const D=nxD();
 try{const sn=await D.get(D.query(mpR('lb/'+pw),D.orderByChild('s'),D.startAt(my),D.limitToFirst(60)));let rank=0;sn.forEach(c=>{if((c.val().s|0)>my||c.key===MPX.uid)rank++;});if(!rank)rank=61;
  S.lbClaim[pw]=1;let m=20,t='took part';if(rank===1){m=300;t='#1 — Season Champion';S.cosU=S.cosU||{};S.cosU['sail:champion']=1;}else if(rank<=3){m=150;t='top 3';}else if(rank<=10){m=75;t='top 10';}
  nxMarks(m);toast(`🏆 Last week's season: you ranked #${rank>60?'60+':rank} (${t}) → +${m}☠ Infamy marks${rank===1?' + Season Champion sails!':''}`);chime();save();}catch(e){console.warn('season',e);}}
// ---------- global market (havens) ----------
function nxAtHaven(){return state==='port'&&typeof curPort==='number'&&PORTS[curPort]&&!!PORTS[curPort].haven;}
async function nxMkFetch(){if(!MPX.fb)return[];const D=nxD();const sn=await D.get(D.query(mpR('mk'),D.orderByChild('t'),D.limitToLast(40)));const out=[];const now=mpNow();
 sn.forEach(c=>{const v=c.val();if(!v||now-(v.t||0)>172800000)return;out.push(Object.assign({id:c.key},v));});out.sort((a,b)=>b.t-a.t);NX.mk=out;NX.mkT=performance.now();return out;}
async function nxMkList(g,q,p){if(!nxAtHaven())throw new Error('Trade only at a haven.');g=String(g);q=Math.round(q);p=Math.round(p);if(!GOODS.some(x=>x.id===g))throw new Error('Unknown good.');
 if(!(q>=1&&q<=500)||!(p>=1&&p<=100000))throw new Error('Bad amount or price.');if((S.cargo[g]|0)<q)throw new Error('You don\'t have that many.');
 const mine=Object.values(NX.mkMine).filter(v=>!v.b).length;if(mine>=5)throw new Error('Max 5 active listings.');
 const D=nxD();const id=D.push(mpR('mk')).key;S.cargo[g]-=q;save();
 try{await D.set(mpR('mk/'+id),{s:MPX.uid,n:MPX.name||S.mpName||'Captain',g,q,p,t:mpTS(),h:curPort});}catch(e){S.cargo[g]+=q;save();throw e;}return id;}
async function nxMkBuy(id){if(!nxAtHaven())throw new Error('Trade only at a haven.');const L=(NX.mk||[]).find(x=>x.id===id);if(!L||L.b)throw new Error('Already sold.');if(L.s===MPX.uid)throw new Error('That is your own listing.');
 const cost=L.q*L.p;if(S.gold<cost)throw new Error('Not enough gold.');if(cargoUsed()+L.q>ST.cargoCap)throw new Error('Not enough hold space.');
 await nxUp({['mk/'+id+'/b']:MPX.uid,['mk/'+id+'/bn']:(MPX.name||'Captain').slice(0,16)});
 S.gold-=cost;S.cargo[L.g]=(S.cargo[L.g]|0)+L.q;S.mkDone=S.mkDone||{};S.mkDone['b'+id]=1;L.b=MPX.uid;save();return L;}
async function nxMkCancel(id){const D=nxD();let got=null;const r=await D.runTransaction(mpR('mk/'+id),cur=>{if(!cur)return cur;if(cur.b||cur.s!==MPX.uid)return;got=cur;return null;});
 if(!r.committed||!got)throw new Error('Already sold — collect your gold instead.');S.cargo[got.g]=(S.cargo[got.g]|0)+got.q;save();return got;}
function nxMkMine(sn){const v=sn.val()||{};NX.mkMine=v;S.mkDone=S.mkDone&&typeof S.mkDone==='object'?S.mkDone:{};
 for(const id in v){const L=v[id];if(!L||!L.b)continue;if(!S.mkDone[id]){S.mkDone[id]=1;const g=L.q*L.p;nxGold(g);toast(`🏪 Market: ${mpClean(L.bn||'a captain')} bought ${L.q} ${GOODS.find(x=>x.id===L.g).icon} → +${g}💰`);chime();save();}
  nxD().remove(mpR('mk/'+id)).catch(()=>{});}
 const ks=Object.keys(S.mkDone);if(ks.length>200)for(const k of ks.slice(0,ks.length-200))delete S.mkDone[k];}
// ---------- wrappers into the core online module ----------
{const _cf=mpFlags;mpFlags=function(){let f=_cf();if(NX.duel)f+='D';if(NX.smug&&NX.smug===MPX.uid)f+='s';if(NX.bjoin&&!f.includes('b'))f+='b';return f;};}
{const _ch=mpCanHit;mpCanHit=function(r){if(NX.duel)return r.uid===NX.duel.o&&r.vis&&!r.stale&&!r.deadF&&!r.sinking;if(r.fl&&r.fl.includes('D'))return false;return _ch(r);};}
{const _hl=hullLocked;hullLocked=function(){return _hl()||!!NX.bjoin;};}
{const _ev=mpEv;mpEv=function(s){const v=s.val();if(v&&NX.duel&&v.a!==NX.duel.o){nxD().remove(s.ref).catch(()=>{});return;}if(v&&!NX.duel){const r=MPX.rem[v.a];if(r&&r.fl&&r.fl.includes('D')){nxD().remove(s.ref).catch(()=>{});return;}}return _ev(s);};}
{const _md=mpDied;mpDied=function(){if(!MPX.on)return _md();const d=NX.duel;const k=MPX.killer||MPX.lastHit;
 if(d&&k&&k.a===d.o){MPX.killer=null;MPX.lastHit=null;S.lastPort=mpNearHaven();NX.duelLost=1;mpPush('k',{a:d.o,v:MPX.uid,an:String(d.n).slice(0,16),vn:MPX.name,b:0,du:d.w,xy:`${P.x|0},${P.y|0}`,t:mpTS()});nxDuelEnd('lose');return;}
 const smug=NX.smug===MPX.uid&&k;_md();if(smug){NX.smugLost=1;}const op=nxOutpostPort();if(op>=0){S.lastPort=op;setTimeout(()=>{const t=$('deadTxt');if(t)t.innerHTML+=`<br>🏰 Respawning at your outpost: <b>${mpEsc(PORTS[op].name)}</b>.`;},0);}};}
{const _pd=playerDied;playerDied=function(){const g=S.gold;_pd();if(NX.duelLost){NX.duelLost=0;S.gold=g;save();}};}
{const _mp=mpPush;mpPush=function(path,val){if(path==='k'&&NX.smugLost&&val&&val.du==null){NX.smugLost=0;val.sm=1;}return _mp(path,val);};}
{const _mk=mpKill;mpKill=function(snap){const v=snap.val();if(v&&v.du!=null){if(MPX.seenK[snap.key])return;MPX.seenK[snap.key]=1;if((v.t||0)<MPX.joinT-5000)return;mpFeed(`⚔️ <b>${mpEsc(mpClean(v.an))}</b> won the duel against <b>${mpEsc(mpClean(v.vn))}</b>`);
  if(v.a===MPX.uid&&NX.duel&&NX.duel.o===v.v)nxDuelEnd('win');return;}
 _mk(snap);if(v&&v.sm&&v.a===MPX.uid&&(v.t||0)>=MPX.joinT-5000){nxGold(1500);nxMarks(15,P.x,P.y);nxScore(60);toast('📦 You sank the smuggler! +1500💰 +15☠');}
 if(v&&v.a===MPX.uid&&(v.t||0)>=MPX.joinT-5000){nxMarks(10,P.x,P.y);nxScore(100);}
 if(v&&NX.smug===v.v){NX.smug=null;mpFeed('📦 The contraband went down with the ship.');if(NX.e&&NX.e.k==='smug')NX.done[NX.e.id]='over';}};}
{const _j=mpJoin;mpJoin=async function(lid,meta,idx){const r=await _j(lid,meta,idx);const D=nxD();const sub=f=>MPX.subs.push(f);const q=p=>mpR(mpL(p));
 Object.assign(NX,{e:null,nx:0,wb:{},myDmg:{},done:{},wn:{},tc:{},capT:{},duel:null,chal:{},bd:{},bjoin:null,smug:null,bossLocal:null,bdHost:null,ally:null});
 sub(D.onValue(q('w'),s=>{MPX.stats.rx++;MPX.stats.rxB+=200;nxOnW(s.val());}));
 sub(D.onValue(q('tc'),s=>{MPX.stats.rx++;MPX.stats.rxB+=300;const v=s.val()||{};const o={};for(const k in v)o[+k]=v[k];NX.tc=o;}));
 sub(D.onChildAdded(q('du/'+MPX.uid),nxDuIn));sub(D.onChildAdded(q('gf/'+MPX.uid),nxGift));
 sub(D.onChildAdded(q('bd'),nxBdOn));sub(D.onChildChanged(q('bd'),nxBdOn));sub(D.onChildRemoved(q('bd'),s=>{delete NX.bd[s.key];}));
 sub(D.onValue(D.query(mpR('mk'),D.orderByChild('s'),D.equalTo(MPX.uid)),nxMkMine));
 sub(()=>nxSubEv(null));nxSeason();return r;};}
{const _lv=mpLeave;mpLeave=async function(s){if(NX.duel)nxDuelEnd('draw');NX.bjoin=null;if(NX.bossLocal){const i=enemies.indexOf(NX.bossLocal);if(i>=0)enemies.splice(i,1);NX.bossLocal=null;}
 if(MPX.on&&NX.lbDirty)nxLbFlush();NX.e=null;NX.tc={};['nxEv','nxAsk','nxBJ'].forEach(i=>$(i)&&$(i).classList.add('hidden'));NX.ask=[];return _lv(s);};}
{const _fr=mpFrame;mpFrame=function(dt){_fr(dt);if(!MPX.on||!MPX.fb)return;if(!MPX.conn||MPX.rejoining)return;
 NX.hostT-=dt;if(NX.hostT<=0){NX.hostT=5;MPX.host=mpHostId()===MPX.uid;nxHost();}
 nxEvTick(dt);nxTerrTick(dt);nxBdTick(dt);
 if(NX.duel&&mpNow()>NX.duel.end)nxDuelEnd('draw');if(NX.duel&&!MPX.rem[NX.duel.o])nxDuelEnd('draw');
 NX.lbFlushT-=dt;if(NX.lbFlushT<=0){NX.lbFlushT=20;if(NX.lbDirty)nxLbFlush();}
 NX.uiT-=dt;if(NX.uiT<=0){NX.uiT=0.3;nxUI();}};}
// ---------- drawing ----------
{const _dr=mpDraw;mpDraw=function(ts){_dr(ts);if(!MPX.on)return;const z=1/zoom,e=NX.e,now=mpNow();
 for(let i=0;i<NZ.length;i++){const t=NX.tc[i];const p=PORTS[NZ[i]].port;if(Math.abs(p.x-cam.x)>vw/zoom||Math.abs(p.y-cam.y)>vh/zoom)continue;
  ctx.strokeStyle=t?(nxMine(t)?'rgba(91,255,122,.35)':'rgba(255,120,60,.35)'):'rgba(240,220,170,.25)';ctx.lineWidth=3*z;ctx.setLineDash([14*z,10*z]);ctx.beginPath();ctx.arc(p.x,p.y,NX_ZR,0,TAU);ctx.stroke();ctx.setLineDash([]);
  if(t){const f=cosItem('flag',t.f||'def');nxFlag(p.x+60,p.y-90,f[3],f[4],z);ctx.font=`bold ${Math.round(12*z)}px Georgia`;ctx.textAlign='center';ctx.fillStyle='#000a';ctx.fillText((t.cn||t.n)+(t.o?' 🏰':''),p.x+61,p.y-121*1+1);ctx.fillStyle=nxMine(t)?'#8dffa0':'#ffcf8a';ctx.fillText((t.cn||t.n)+(t.o?' 🏰':''),p.x+60,p.y-121);}
  if(i===NX.zone&&(NX.capT[i]||0)>0){const need=!t||!nxOwnerHere(t)?12:t.o?45:25;nxRing(P.x,P.y,P.len*0.9,(NX.capT[i]||0)/need,'#ffd34d',z);}}
 if(e&&now<=e.end&&!NX.done[e.id]){const live=now>=e.at;
  if(e.k!=='boss'&&!(e.k==='smug'&&NX.wn[e.id+'p'])){const pul=1+0.15*Math.sin(ts/200);ctx.strokeStyle=live?'#ffd34d':'rgba(255,211,77,.5)';ctx.lineWidth=4*z;ctx.beginPath();ctx.arc(e.x,e.y,170*pul,0,TAU);ctx.stroke();ctx.font=`${Math.round(34*z)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.k==='race'?'❌':'📦',e.x,e.y);ctx.textBaseline='alphabetic';
   if(NX.dig>0)nxRing(P.x,P.y,P.len*0.9,NX.dig/(e.k==='race'?3:2),'#7dff8a',z);}
  if(e.k==='smug'&&NX.smug){const p=nxSmugPos();if(p){ctx.strokeStyle=`rgba(255,80,60,${0.5+0.4*Math.sin(ts/150)})`;ctx.lineWidth=5*z;ctx.beginPath();ctx.arc(p[0],p[1],90+25*Math.sin(ts/220),0,TAU);ctx.stroke();}
   const d=PORTS[e.dp].port;if(NX.smug===MPX.uid){ctx.strokeStyle='#7dff8a';ctx.lineWidth=4*z;ctx.setLineDash([12*z,10*z]);ctx.beginPath();ctx.arc(d.x,d.y,420,0,TAU);ctx.stroke();ctx.setLineDash([]);}}
  // off-screen arrow toward the event
  const tx=e.k==='smug'&&NX.smug&&NX.smug!==MPX.uid?(nxSmugPos()||[e.x,e.y]):e.k==='smug'&&NX.smug===MPX.uid?[PORTS[e.dp].port.x,PORTS[e.dp].port.y]:[e.x,e.y];
  const dx=tx[0]-cam.x,dy=tx[1]-cam.y,hx=vw/2/zoom-46*z,hy=vh/2/zoom-150*z;if(Math.abs(dx)>vw/2/zoom-30*z||Math.abs(dy)>vh/2/zoom-30*z){const a=Math.atan2(dy,dx);const k=Math.min(hx/Math.max(1e-6,Math.abs(dx)),hy/Math.max(1e-6,Math.abs(dy)));const ax=cam.x+dx*k,ay=cam.y+dy*k;
   ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle='rgba(255,211,77,.9)';ctx.strokeStyle='#000';ctx.lineWidth=2*z;ctx.beginPath();ctx.moveTo(18*z,0);ctx.lineTo(-10*z,-11*z);ctx.lineTo(-4*z,0);ctx.lineTo(-10*z,11*z);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   ctx.font=`${Math.round(16*z)}px serif`;ctx.textAlign='center';ctx.fillText((NXK[e.k]||['⭐'])[0],ax-Math.cos(a)*26*z,ay-Math.sin(a)*26*z+5*z);}}};}
function nxFlag(x,y,c1,c2,z){ctx.strokeStyle='#3a2a18';ctx.lineWidth=3*z;ctx.beginPath();ctx.moveTo(x,y+40*z);ctx.lineTo(x,y-14*z);ctx.stroke();ctx.fillStyle=c1||'#111';ctx.fillRect(x,y-14*z,26*z,17*z);ctx.fillStyle=c2||'#fff';ctx.beginPath();ctx.arc(x+13*z,y-6*z,4*z,0,TAU);ctx.fill();}
function nxRing(x,y,r,f,c,z){ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=7*z;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=5*z;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*clamp(f,0,1));ctx.stroke();}
{const _mm=mpMap;mpMap=function(mx,my,big){_mm(mx,my,big);if(!MPX.on)return;
 for(let i=0;i<NZ.length;i++){const t=NX.tc[i];if(!t)continue;const p=PORTS[NZ[i]].port;const f=cosItem('flag',t.f||'def');const X=mx(p.x),Y=my(p.y);const s=big?1:0.6;
  ctx.fillStyle=nxMine(t)?'#5bff7a':'#ff9a3c';ctx.fillRect(X-1,Y-16*s,2,16*s);ctx.fillStyle=f[3];ctx.fillRect(X+1,Y-16*s,11*s,7*s);if(t.o&&big){ctx.font='12px serif';ctx.textAlign='center';ctx.fillText('🏰',X,Y+12);}}
 const e=NX.e;if(e&&!NX.done[e.id]&&mpNow()<=e.end){const X=mx(e.x),Y=my(e.y);ctx.font=(big?20:12)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((NXK[e.k]||['⭐'])[0],X,Y);
  if(e.k==='smug'){const d=PORTS[e.dp].port;ctx.fillText('🎯',mx(d.x),my(d.y));if(NX.smug){const p=nxSmugPos();if(p){ctx.fillText('📡',mx(p[0]),my(p[1])-(big?14:9));}}}ctx.textBaseline='alphabetic';}};}
// ---------- UI ----------
function nxUI(){const el=$('nxEv');const e=NX.e;const now=mpNow();let h='';
 if(e&&now<=e.end&&!NX.done[e.id]){const K=NXK[e.k]||['⭐','Event'];const live=now>=e.at;const left=Math.max(0,Math.round(((live?e.end:e.at)-now)/1000));const mm=`${(left/60)|0}:${String(left%60).padStart(2,'0')}`;
  let sub='';if(e.k==='boss'&&e.hp){const hp=Math.max(0,e.hp-nxTotal(e));sub=` · ❤️ ${Math.round(100*hp/e.hp)}% · you ${Math.round(NX.myDmg[e.id]||0)}`;}
  if(e.k==='smug'){sub=NX.smug?(NX.smug===MPX.uid?` · deliver → ${PORTS[e.dp].name} ${nxDirTxt(PORTS[e.dp].port.x,PORTS[e.dp].port.y)}`:` · 📡 ${mpEsc((MPX.rem[NX.smug]||{n:'?'}).n)} has it`):' · grab the crate';}
  h=`${K[0]} <b>${K[1]}</b> ${live?'ends':'starts'} ${mm} · ${nxDirTxt(e.x,e.y)}${sub}`;}
 if(NX.duel){const r=MPX.rem[NX.duel.o];const left=Math.max(0,Math.round((NX.duel.end-now)/1000));h+=(h?'<br>':'')+`⚔️ Duel vs <b>${mpEsc(NX.duel.n)}</b> ${(left/60)|0}:${String(left%60).padStart(2,'0')}${r&&r.vis?' · '+nxDirTxt(r.x,r.y):''}`;}
 if(NX.zone>=0){const t=NX.tc[NX.zone];const nm=PORTS[NZ[NX.zone]].name;h+=(h?'<br>':'')+(nxMine(t)?`🏴 ${mpEsc(nm)}: yours${t.o?' 🏰':''}`:`🏴 ${mpEsc(nm)}: ${t?'held by '+mpEsc(t.cn||t.n)+(t.o?' 🏰':''):'unclaimed'} — stay to capture`);}
 const show=!!h&&MPX.on&&(state==='play'||state==='dead');el.classList.toggle('hidden',!show);if(el._h!==h){el._h=h;el.innerHTML=h;}
 nxPos();
 const w=$('nxWanted');const top=nxWantedList()[0];const meTop=top&&top.me&&(top.b|0)>=500;if(meTop&&!NX.wantTold){NX.wantTold=1;toast('📜 You top the WANTED poster — every captain in the lobby is hunting you!');}if(!meTop)NX.wantTold=0;
 if(!$('mpPanel').classList.contains('hidden')&&NX.tab!=='lobby')mpPanelRender();}
function nxPos(){const el=$('nxEv'),pl=$('mpPill');if(!el||!pl)return;const hb=pl.getBoundingClientRect();const show=!el.classList.contains('hidden');el.style.top=Math.round(hb.bottom+4)+'px';el.style.maxWidth=Math.max(180,Math.round(hb.width))+'px';if(show&&MPX.on)$('mpFeed').style.top=Math.round(hb.bottom+el.getBoundingClientRect().height+8)+'px';}
{const _u=mpUI;mpUI=function(dt){_u(dt);nxPos();};}
function nxWantedList(){const L=[{uid:MPX.uid,n:MPX.name,l:S.clvl|0,b:Math.round(S.mpB||0),k:S.mpK|0,me:1,flagC:P.flagC}];for(const id in MPX.rem){const r=MPX.rem[id];if(!r.stale)L.push(r);}return L.filter(r=>(r.b|0)>0).sort((a,b)=>(b.b|0)-(a.b|0)).slice(0,3);}
function nxTabHTML(){const t=NX.tab;const e=NX.e,now=mpNow();let h='';
 if(t==='events'){h+=`<div class="mpSec"><h3>🎯 Lobby event</h3>${e&&now<=e.end&&!NX.done[e.id]?`${NXK[e.k][0]} <b>${NXK[e.k][1]}</b> — ${now<e.at?'starts in '+Math.round((e.at-now)/1000)+'s':'live!'} · ${nxDirTxt(e.x,e.y)}<br><small>${e.k==='boss'?'Everyone\'s damage pools into one health bar. Loot is split by damage share.':e.k==='race'?'First captain to sit on the ❌ for 3 s digs it up.':`Grab the crate, then deliver it to ${mpEsc(PORTS[e.dp].name)}. Your ship glows on everyone's map — sink the smuggler to steal a reward.`}</small>`:`Next event ${NX.nx?'in ~'+Math.max(0,Math.round((NX.nx-now)/60000))+' min':'soon'} (world boss · treasure race · smuggling run, every 20–30 min).`}</div>`;
  h+=`<div class="mpSec"><h3>🏴 Territory</h3><small>Sit inside a port's ring with no rivals to capture it (12 s, 25 s if the owner is online, 45 s for an outpost). Owners earn tax every minute.</small>${NZ.map((pi,z)=>{const tt=NX.tc[z];const p=PORTS[pi];const can=tt&&tt.u===MPX.uid&&!tt.o&&NX.zone===z;
   return `<div class="mpPl"><span style="flex:1">${tt?(nxMine(tt)?'🟢':'🟠'):'⚪'} <b>${mpEsc(p.name)}</b> ${tt?'— '+mpEsc(tt.cn||tt.n)+(tt.o?' 🏰':''):'— unclaimed'}</span><small>${nxDirTxt(p.port.x,p.port.y)}</small>${can?`<button class="mpB" data-nx="op" data-z="${z}">🏰 Outpost 3000💰</button>`:''}</div>`;}).join('')}</div>`;
  const du=[];for(const id in MPX.rem){const r=MPX.rem[id];if(r.fl&&r.fl.includes('D')&&!r.stale)du.push(r);}
  h+=`<div class="mpSec"><h3>⚔️ Duels</h3>${du.length?du.map(r=>`<div class="mpPl"><span style="flex:1">⚔️ <b>${mpEsc(r.n)}</b> is dueling</span><button class="mpB" data-nx="watch" data-u="${mpEsc(r.uid)}">👁️ Watch</button></div>`).join(''):'<small>Tap a captain → ⚔️ Duel to challenge them. Winner takes both wagers; nobody else can interfere.</small>'}</div>`;}
 if(t==='wanted'){const W=nxWantedList();h+=`<div class="nxPosters">${W.length?W.map((r,i)=>`<div class="nxPoster"><div class="nxW">WANTED</div><div class="nxDA">${i===0?'DEAD OR ALIVE':'#'+(i+1)}</div><div class="nxPN">${mpSw(r)} ${mpEsc(r.n)}</div><div>Lv${r.l|0} · ☠️ ${r.k|0} sunk</div><div class="nxRw">${(r.b|0).toLocaleString()} 💰</div><small>REWARD</small></div>`).join(''):'<div class="mpSt">No bounties yet. Sink a rival captain to start one.</div>'}</div>
  <div class="mpSt" style="font-size:12px">Bounty skulls ☠️ mark wanted captains on the map. Sinking them pays their bounty plus 60% of the gold they carried. Gold in your haven vault is always safe.</div>`;}
 if(t==='ranks'){const w=nxWeek();const my=(S.mpW&&S.mpW[w])|0;const L=NX.lb;h+=`<div class="mpSec"><h3>🏆 This week's leaderboard</h3><small>Season ${w.slice(1)} · resets Monday 00:00 UTC (Sunday 7 PM CDT). Your score: <b>${my}</b></small>
  ${L?L.length?L.map((r,i)=>`<div class="mpPl"><span style="flex:1">${['🥇','🥈','🥉'][i]||'#'+(i+1)} <b style="color:${r.uid===MPX.uid?'#8a5a00':'#3b2306'}">${mpEsc(mpClean(r.n))}</b> Lv${r.l|0}</span><small>${r.s|0} pts</small></div>`).join(''):'<div class="mpSt">No scores yet this week — be the first!</div>':'<div class="mpSt">Loading…</div>'}
  <button class="mpB" data-nx="lbr" style="margin-top:6px">↻ Refresh</button></div>
  <div class="mpSec"><h3>🎁 Season rewards</h3><small>Paid when you next play online after the week ends: #1 → 300☠ + Season Champion sails · top 3 → 150☠ · top 10 → 75☠ · everyone who scored → 20☠.<br>Points: PvP sink 100 · boss up to 400 · treasure 150 · smuggling 200 · duel win 50 · boarding 30 · territory 25 + 5/min.</small></div>`;
  if(!L||performance.now()-NX.lbT>30000){NX.lbT=performance.now();nxLbFetch(true).then(()=>mpPanelRender()).catch(()=>{});}}
 if(t==='shop'){S.cosU=S.cosU||{};h+=`<div class="mpSec"><h3>☠ Infamy marks: <b>${S.mpM|0}</b></h3><small>Earned online: sinking captains, bosses, treasure, smuggling, duels, territory, season rewards. Spend them on exclusive styles.</small></div>`;
  h+=NSHOP.filter(it=>it[3]<99999||S.cosU[it[0]+':'+it[1]]).map(it=>{const own=!!S.cosU[it[0]+':'+it[1]];const on=S.cos[it[0]]===it[1];const sw=it[4]?`<span style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:4px;border:1px solid #0006;background:${it[4]}"></span>`:`<span style="color:${FXC[it[1]]}">●</span> `;
   return `<div class="mpPl"><span style="flex:1">${sw}<b>${it[2]}</b> <small>${COSN[it[0]]}</small></span>${own?(on?'<small>✔ equipped</small>':`<button class="mpB" data-nx="eq" data-c="${it[0]}" data-i="${it[1]}">Equip</button>`):`<button class="mpB" data-nx="buy" data-c="${it[0]}" data-i="${it[1]}" ${(S.mpM|0)<it[3]?'disabled':''}>${it[3]}☠</button>`}</div>`;}).join('');}
 if(t==='market'){const at=nxAtHaven();const M=NX.mk;h+=`<div class="mpSec"><h3>🏪 Captains' market</h3><small>Shared by every online captain. List cargo at any haven; buyers pay when they collect. Goods are held in escrow, so nothing can be sold twice.</small>${at?'':'<div class="mpSt" style="color:#8e1b1b">⚓ Dock at a haven to buy or sell.</div>'}</div>`;
  if(at){const have=GOODS.filter(g=>(S.cargo[g.id]|0)>0);h+=`<div class="mpSec"><h3>Sell</h3>${have.length?`<div style="display:flex;gap:4px;flex-wrap:wrap"><select id="nxMg" class="mpIn" style="flex:2;min-width:120px">${have.map(g=>`<option value="${g.id}">${g.icon} ${g.name} (${S.cargo[g.id]|0})</option>`).join('')}</select><input id="nxMq" class="mpIn" type="number" min="1" value="5" style="flex:1;min-width:60px" placeholder="qty"><input id="nxMp" class="mpIn" type="number" min="1" style="flex:1;min-width:70px" placeholder="💰 each"></div><button class="mpB" data-nx="list" style="margin-top:6px;width:100%">List for sale</button><div class="mpSt" id="nxMs"></div>`:'<small>Your hold is empty.</small>'}</div>`;}
  h+=`<div class="mpSec"><h3>Listings <button class="mpB" data-nx="mkr" style="float:right;min-height:30px;padding:2px 10px">↻</button></h3>${M?M.length?M.map(L=>{const g=GOODS.find(x=>x.id===L.g)||{icon:'?',name:L.g};const mine=L.s===MPX.uid;
   return `<div class="mpPl"><span style="flex:1">${g.icon} <b>${L.q|0} ${g.name}</b> @ ${L.p|0}💰 <small>by ${mpEsc(mpClean(L.n))}${L.h!=null&&PORTS[L.h]?' · '+mpEsc(PORTS[L.h].name):''}</small></span>${L.b?`<small>sold</small>`:mine?`<button class="mpB" data-nx="cancel" data-id="${L.id}">Cancel</button>`:`<button class="mpB" data-nx="mbuy" data-id="${L.id}" ${!at||S.gold<L.q*L.p?'disabled':''}>Buy ${(L.q*L.p)|0}💰</button>`}</div>`;}).join(''):'<div class="mpSt">No listings yet.</div>':'<div class="mpSt">Loading…</div>'}</div>`;
  if(!M||performance.now()-NX.mkT>20000){NX.mkT=performance.now();nxMkFetch().then(()=>mpPanelRender()).catch(()=>{});}}
 return h;}
{const _pr=mpPanelRender;mpPanelRender=function(){if(NX.tab==='lobby'){_pr();}else{const b=$('mpPBody');const h=nxTabHTML();if(b._h!==h){const sv={};b.querySelectorAll('input,select').forEach(i=>{if(i.id)sv[i.id]=i.value;});b._h=h;b.innerHTML=h;for(const k in sv){const i=$(k);if(i&&sv[k]!=='')i.value=sv[k];}}}
 const tb=$('nxTabs');if(tb)tb.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x.dataset.tab===NX.tab));};}
{const _co=mpCardOpen;mpCardOpen=function(uid){_co(uid);const r=MPX.rem[uid];if(!r)return;const row=$('mpCBody').querySelector('.mpRow');if(!row)return;
 const crew=MPX.crew&&r.cr===MPX.crew;if(!crew&&!NX.duel&&!(r.fl||'').includes('D')){const d=document.createElement('div');d.style.cssText='width:100%;display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-top:4px';
  d.innerHTML=`<b style="font-size:13px">⚔️ Duel:</b>`+[0,250,1000,5000].map(w=>`<button class="mpB" data-w="${w}" ${w>S.gold?'disabled':''}>${w?w+'💰':'no wager'}</button>`).join('');row.appendChild(d);
  d.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{nxChallenge(uid,+b.dataset.w);$('mpCard').classList.add('hidden');});}};}
// ---------- DOM ----------
(function(){const st=document.createElement('style');st.textContent=`
#nxTabs{display:flex;flex-wrap:wrap;gap:4px;padding:0 12px 8px}#nxTabs button{flex:1 1 30%;min-height:34px;padding:2px 4px;font:700 12.5px Georgia,serif;border-radius:8px;border:1px solid #5a3a12;background:#e9d7a5;color:#3b2306}
#nxTabs button.on{background:#5a3a12;color:#ffe9b0}
#nxEv{position:fixed;left:calc(8px + env(safe-area-inset-left));z-index:7;max-width:min(300px,72vw);padding:4px 8px;border-radius:9px;background:rgba(20,14,8,.78);border:1px solid #b08a4a;color:#f3e2b0;font:12px Georgia,serif;line-height:1.35}
#nxAsk{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:30;width:min(340px,88vw);padding:10px;border-radius:12px;background:linear-gradient(#f3e3bb,#e0c88f);border:2px solid #5a3a12;color:#3b2306;font:14px Georgia,serif;box-shadow:0 6px 18px rgba(0,0,0,.55)}
#nxBJ{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:29;width:min(350px,90vw);padding:9px;border-radius:12px;background:rgba(24,16,9,.92);border:2px solid #b08a4a;color:#f3e2b0;font:13px Georgia,serif}
#nxBJ .nxH{font-weight:700;margin-bottom:3px}.nxBar{height:7px;border-radius:4px;background:#3a2a18;margin-top:4px;overflow:hidden}.nxBar i{display:block;height:100%;background:linear-gradient(90deg,#c0392b,#7dff8a)}
#nxBJ .mpB{background:#e9d7a5;color:#3b2306}#nxBJ .mpB.on{background:#ffd34d}
.nxPosters{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:4px 0 8px}.nxPoster{flex:1 1 30%;min-width:100px;max-width:150px;background:linear-gradient(#f4e2b4,#d9bd83);border:2px solid #6b4a1e;box-shadow:inset 0 0 14px rgba(90,58,18,.55),0 3px 8px rgba(0,0,0,.35);padding:6px 4px;text-align:center;color:#3b2306;font-family:Georgia,serif;transform:rotate(-1deg)}
.nxPoster:nth-child(2){transform:rotate(1.2deg)}.nxW{font:900 20px Georgia,serif;letter-spacing:2px}.nxDA{font-size:10px;letter-spacing:1px}.nxPN{font-weight:700;margin:3px 0}.nxRw{font:900 15px Georgia,serif;color:#7a1414;margin-top:2px}
`;document.head.appendChild(st);
 const mk=(id,cls)=>{const d=document.createElement('div');d.id=id;d.className=cls||'';document.body.appendChild(d);return d;};mk('nxEv','hidden');mk('nxAsk','hidden');mk('nxBJ','hidden');mk('nxWanted','hidden');
 const pb=$('mpPBody');if(pb){const t=document.createElement('div');t.id='nxTabs';t.innerHTML=[['lobby','⚓ Lobby'],['events','🎯 Events'],['wanted','📜 Wanted'],['ranks','🏆 Ranks'],['shop','☠ Shop'],['market','🏪 Market']].map(([k,l])=>`<button data-tab="${k}">${l}</button>`).join('');pb.parentNode.insertBefore(t,pb);
  t.onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;NX.tab=b.dataset.tab;$('mpPBody')._h='';mpPanelRender();$('mpPBody').scrollTop=0;};
  pb.addEventListener('click',async e=>{const b=e.target.closest('[data-nx]');if(!b)return;const a=b.dataset.nx;
   try{if(a==='op')nxBuildOutpost(+b.dataset.z);else if(a==='watch'){MPX.spec={uid:b.dataset.u,t:8};$('mpPanel').classList.add('hidden');}
    else if(a==='lbr'){NX.lb=null;await nxLbFetch(true);}else if(a==='buy')nxBuy(b.dataset.c,b.dataset.i);else if(a==='eq')equipCos(b.dataset.c+':'+b.dataset.i);
    else if(a==='mkr'){NX.mk=null;await nxMkFetch();}
    else if(a==='list'){const g=$('nxMg').value,q=+$('nxMq').value,p=+$('nxMp').value;await nxMkList(g,q,p);toast('🏪 Listed!');await nxMkFetch();}
    else if(a==='mbuy'){const L=await nxMkBuy(b.dataset.id);toast(`🏪 Bought ${L.q} ${GOODS.find(x=>x.id===L.g).name} for ${L.q*L.p}💰`);chime();await nxMkFetch();}
    else if(a==='cancel'){await nxMkCancel(b.dataset.id);toast('🏪 Listing cancelled — goods back in your hold.');await nxMkFetch();}}
   catch(err){const m=String(err&&err.message||err);toast('⚠️ '+(/permission/i.test(m)?'Someone got there first.':m));if(a==='mbuy'){await nxMkFetch().catch(()=>{});}}
   $('mpPBody')._h='';mpPanelRender();});
  pb.addEventListener('keydown',e=>e.stopPropagation());}
 $('nxBJ').addEventListener('click',e=>{const b=e.target.closest('[data-bo]');if(!b||!NX.bjoin)return;NX.bjoin.o=b.dataset.bo;nxUp({[mpL(`bd/${NX.bjoin.host}/j/${MPX.uid}/o`)]:b.dataset.bo}).catch(mpErr);$('nxBJ')._h='';});
 $('nxEv').style.pointerEvents='auto';$('nxEv').onclick=()=>{NX.tab='events';mpPanelOpen();};})();
const nxApi={NX,NZ,NSHOP,nxForce,nxWeek,nxBuy,nxChallenge,nxBuildOutpost,nxMkList,nxMkBuy,nxMkCancel,nxMkFetch,nxLbFetch,nxLbFlush,nxJoinBd,nxSplit,nxTotal,nxSeason,nxScore,nxMarks,nxSmugPos,hitE:(e,d)=>damageEnemy(e,d),sinkE:e=>sinkRewards(e)};

Object.assign(mpApi,{mpJoin,mpLeave,mpCardOpen,mpPanelRender,mpCanHit,mpFlags,mpDraw,mpMap});
