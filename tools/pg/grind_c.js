// ================= GRIND III: daily/weekly contracts, Black Marks & Black Market, seasonal events =================
let DOV=null;const nowD=()=>DOV?new Date(DOV):new Date();
const dKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function wKey(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return'W'+dKey(x);}
function untilTxt(ms){ms=Math.max(0,ms);const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h>=48?`${Math.floor(h/24)}d ${h%24}h`:h?`${h}h ${m}m`:`${m}m`;}
const MK=['⚫','Black Marks'];
const marks=()=>S.marks|0;
function markGain(n,quiet){if(!(n>0))return;S.marks=marks()+n;S.cst.marks=(S.cst.marks|0)+n;if(!quiet)toast(`⚫ +${n} Black Mark${n>1?'s':''} (${marks()})`);}
// contract templates: [id, text(n), event, test, base n, weekly n]
const CTPL=[['sink','Sink {n} ships','sink',e=>true,8,45],['frig','Sink {n} frigates','sink',e=>e.cls==='frigate',3,15,8],['gall','Sink {n} galleons or ironclads','sink',e=>e.cls==='galleon'||e.cls==='iron',2,10,12],
 ['merch','Plunder {n} merchantmen','sink',e=>e.kind==='merchant',4,20],['clan','Sink {n} clan raiders','sink',e=>e.kind==='clan',3,15,6],['night','Sink {n} ships at night','sink',e=>wxNight(),3,15,5],
 ['vet','Sink {n} veteran or elite captains','sink',e=>e.vet||e.elite,2,8,10],['fish','Catch {n} fish','fish',null,4,20],['rare','Catch {n} rare fish','fish',d=>d.r>=2,1,5,6],['dive','Make {n} salvage dives','dive',null,2,10,4],
 ['craft','Attempt {n} shipwright refits','craft',null,1,4,3],['wave','Ride out {n} rogue waves','wave',null,1,5,8]];
const CTI={};CTPL.forEach(t=>CTI[t[0]]=t);
function ctrGen(seed,n,weekly){const r=rng(seed);const pool=CTPL.filter(t=>!t[6]||S.clvl>=t[6]);const out=[];const used=new Set();let k=0;while(out.length<n&&k<60){k++;const t=pool[(r()*pool.length)|0];if(used.has(t[0]))continue;used.add(t[0]);
 const need=Math.max(1,Math.round((weekly?t[5]:t[4])*(1+Math.min(1,S.clvl/60)*0.5)));const mk=weekly?10+((r()*5)|0):2+((r()*2)|0);
 const rw={mk,res:{}};const rk=['wood','iron','canvas'][(r()*3)|0];rw.res[rk]=weekly?24:6+((r()*5)|0);if(weekly||r()<0.35)rw.res.parts=weekly?3:1;if(weekly)rw.mat=['iw','bp','ink'][(r()*3)|0];out.push({t:t[0],n:need,p:0,c:0,rw});}return out;}
function seedOf(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function ctrRoll(){const d=nowD(),dk=dKey(d),wk=wKey(d);if(!S.ctr)S.ctr={};const C=S.ctr;
 if(C.d!==dk){C.d=dk;C.list=ctrGen(seedOf(dk+':'+(S.rid|0)%7),3,false);C.bonus=0;}if(C.w!==wk){C.w=wk;C.wl=ctrGen(seedOf(wk),2,true);}}
function ctrEv(kind,arg){if(!S.ctr||!S.ctr.list||!wxOn())return;for(const c of [...S.ctr.list,...(S.ctr.wl||[])]){if(c.p>=c.n)continue;const t=CTI[c.t];if(!t||t[2]!==kind)continue;if(t[3]&&!t[3](arg||{}))continue;c.p++;
 if(c.p>=c.n)toast(`📋 Contract complete: ${t[1].replace('{n}',c.n)} — claim it on the Board (☰ ➜ Board).`);}}
function rwTxt(rw){let s=`${rw.mk}${MK[0]}`;for(const k in rw.res)s+=` ${rw.res[k]}${RES[k][0]}`;if(rw.mat)s+=` 1${MATS[rw.mat][0]}`;return s;}
function ctrClaim(i,wk){const L=wk?S.ctr.wl:S.ctr.list;const c=L&&L[i];if(!c||c.c||c.p<c.n)return;c.c=1;markGain(c.rw.mk,true);for(const k in c.rw.res)resGain(k,c.rw.res[k],null,null,true);if(c.rw.mat)matGain(c.rw.mat,1);
 S.cst.ctr=(S.cst.ctr|0)+1;let msg=`📋 Contract paid: ${rwTxt(c.rw)}`;if(!wk&&!S.ctr.bonus&&S.ctr.list.every(x=>x.c)){S.ctr.bonus=1;markGain(3,true);msg+=' + daily set bonus 3⚫';}chime();toast(msg);}
// ---- Black Market (exclusive, Black Marks only) ----
COS.sail.push(['marked','Black Mark Canvas',999,'#1d1a17'],['wraith','Wraith Canvas',999,'rgba(170,255,210,0.5)'],['frost','Frostwake Sails',999,'#cfe6f2']);
COS.flag.push(['blackmark','The Black Mark',999,'#0b0b0b','#c9a14a'],['lantern','Lantern Skull',999,'#1b2a24','#9cffc8']);
COS.hull.push(['tarred','Tarred Oak',999,'#1a1410','#3a2e22'],['bone','Bone-white',999,'#cfc6b0','#efe8d6']);
const BMI=[['charm','🍀','Shipwright\'s charm','+20% success on your next refit',6,0],['parts3','⚙️','Smuggled parts ×3','Rare parts for refits',8,0],['iw','🪵','Ironwood','Rare hull timber',10,0],['bp','📐','Navy blueprints','Stolen plans for big hulls',12,0],['rel','🗿','Ancient relic','For Legendary refits',15,0],
 ['helm','🤿','Brass diving helmet','Salvage dives: +35% air (permanent)',18,1],['rod','🎣','Greenheart rod','Fishing: wider catch band (permanent)',16,1],['cos:sail:marked','🏴','Black Mark Canvas','Exclusive sails',20,1],['cos:flag:blackmark','🏴','The Black Mark','Exclusive flag',25,1],['cos:hull:tarred','🛶','Tarred Oak hull','Exclusive hull paint',30,1],
 ['morwen','🔭','Morwen the Sea-Witch','Legendary lookout (Lv8, Eagle-eyed) — joins your roster',40,1]];
function bmOk(it){if(it[5]&&(S.bmb||{})[it[0]])return false;if(it[0]==='charm'&&S.charm)return false;if(it[0]==='morwen'&&S.roster.length>=crewCap())return false;return marks()>=it[4];}
function bmBuy(id){const it=BMI.find(x=>x[0]===id);if(!it||!bmOk(it))return;S.marks-=it[4];if(it[5]){S.bmb=S.bmb||{};S.bmb[id]=1;}
 if(id==='charm')S.charm=1;else if(id==='parts3')resGain('parts',3,null,null,true);else if(MATS[id])matGain(id,1);else if(id.startsWith('cos:')){const c=id.slice(4);S.cosU[c]=1;}
 else if(id==='morwen'){S.roster.push({id:++S.rid,n:'Morwen the Sea-Witch',r:'lookout',tr:'eagle',l:8,xp:0,inj:0,rare:0});recalc();}chime();toast(`⚫ Bought: ${it[2]}`);grindEv('bm',{});}
// ---- seasonal event framework ----
// To add a season: push a config. Everything (spawns, currency, milestones, boss, board panel) is data-driven.
const EVENTS=[
 {id:'ghost26',name:'The Ghost Fleet',icon:'👻',start:'2026-10-22',end:'2026-11-03',cur:['🕯️','Soul Lanterns'],
  blurb:'All Hallows\' tide: drowned crews rise in spectral hulls. Sink them for Soul Lanterns — they come thicker at night and in fog.',
  foe:{name:'Ghost Fleet Wraith',paint:'rgba(170,255,210,0.5)',glow:'#9cffc8',hpK:1.25,night:2.2,fog:1.6},
  ms:[[15,{mk:3,res:{canvas:6}}],[40,{cos:'sail:wraith'}],[80,{cos:'flag:lantern'}],[120,{mk:6,m:{rel:1},res:{parts:2}}],[160,{boss:1}]],
  boss:{name:'The Hollow Commodore',hp:5000,hpL:260,guns:9,dmg:30,esc:2,rw:{cos:'hull:bone',mk:12,trophy:'ghost26'}}},
 {id:'frost26',name:'Frostwake',icon:'❄️',start:'2026-12-18',end:'2027-01-05',cur:['❄️','Frost Shards'],
  blurb:'Ice raiders sail down from the north with frozen holds. Sink them for Frost Shards.',
  foe:{name:'Frostwake Raider',paint:'#d7ecf5',glow:'#cfeaff',hpK:1.2,night:1.4,fog:1.3},
  ms:[[15,{mk:3,res:{iron:6}}],[60,{cos:'sail:frost'}],[120,{mk:8,res:{parts:3}}],[160,{boss:1}]],
  boss:{name:'The Rime Admiral',hp:5200,hpL:260,guns:9,dmg:30,esc:2,rw:{mk:12,trophy:'frost26'}}}];
const evT=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).getTime();};
function evActive(){const t=nowD().getTime();return EVENTS.find(e=>t>=evT(e.start)&&t<evT(e.end))||null;}
function evNext(){const t=nowD().getTime();return EVENTS.filter(e=>evT(e.start)>t).sort((a,b)=>evT(a.start)-evT(b.start))[0]||null;}
function evS(E){S.ev=S.ev||{};return S.ev[E.id]=S.ev[E.id]||{c:0,tot:0,ms:{},boss:0};}
let evT0=4,evAnn=0;
function evTick(dt){const E=evActive();if(!E||!wxOn()||state!=='play')return;if(!evAnn){evAnn=1;setTimeout(()=>{toast(`${E.icon} ${E.name} is live until ${new Date(evT(E.end)-1).toLocaleDateString(undefined,{month:'short',day:'numeric'})}! See ☰ ➜ Board.`);showTip('event');},2500);}
 evT0-=dt;if(evT0>0)return;evT0=6;const n=enemies.filter(e=>e.evg&&!e.sinking).length;const cap=wxNight()?3:2;if(n>=cap)return;
 const ch=0.16*(wxNight()?E.foe.night:1)*(wxFog()?E.foe.fog:1);if(Math.random()>ch)return;const pt=randomWater(P.x,P.y,1000,1700);if(!pt)return;
 const lv=clamp(lvlAt(pt.x,pt.y)+1,2,14);const e=makeEnemy('pirate',pt.x,pt.y,lv,{evg:E.id,name:E.foe.name,angry:wxNight()});e.maxHp=Math.round(e.maxHp*E.foe.hpK);e.hp=e.maxHp;e.gold=Math.round(e.gold*1.2);enemies.push(e);}
function evSunk(e){if(!e.evg&&!e.evb)return;const E=EVENTS.find(x=>x.id===(e.evg||e.evb));if(!E)return;const s=evS(E);
 if(e.evb){s.boss=2;const r=E.boss.rw;if(r.cos)S.cosU[r.cos]=1;if(r.mk)markGain(r.mk,true);if(r.trophy)S.evT=Object.assign(S.evT||{},{[r.trophy]:1});s.c+=40;s.tot+=40;setTimeout(()=>toast(`${E.icon} ${E.boss.name} is sunk! Exclusive rewards claimed: ${r.cos?'🎨 '+r.cos.split(':')[1]+' ':''}${r.mk}⚫ +40${E.cur[0]}`),1200);grindEv('evboss',{});return;}
 const n=1+((Math.random()*2)|0)+(wxNight()?1:0);s.c+=n;s.tot+=n;addText(e.x,e.y-70,`+${n}${E.cur[0]}`,E.foe.glow,true);S.cst.evk=(S.cst.evk|0)+1;}
function evClaim(i){const E=evActive();if(!E)return;const s=evS(E);const m=E.ms[i];if(!m||s.ms[i]||s.tot<m[0])return;const r=m[1];
 if(r.boss){evSummon(E);return;}s.ms[i]=1;const out=[];if(r.mk){markGain(r.mk,true);out.push(r.mk+'⚫');}if(r.res)for(const k in r.res){resGain(k,r.res[k],null,null,true);out.push(r.res[k]+RES[k][0]);}if(r.m)for(const k in r.m){matGain(k,r.m[k]);}
 if(r.cos){S.cosU[r.cos]=1;const [c,id]=r.cos.split(':');out.push('🎨 '+COS[c].find(x=>x[0]===id)[1]);}chime();toast(`${E.icon} Event reward: ${out.join(' ')}`);}
function evSummon(E){const s=evS(E);if(s.boss===2)return;if(enemies.some(e=>e.evb===E.id&&!e.sinking)){toast(`${E.icon} ${E.boss.name} is already hunting you!`);return;}if(state!=='play'&&state!=='menu'){toast('Put to sea first.');return;}
 const pt=randomWater(P.x,P.y,700,1000)||{x:P.x+800,y:P.y};const L=clamp(S.clvl,10,60),B=E.boss;s.boss=1;
 const o=makeEnemy('boss',pt.x,pt.y,clamp(lvlAt(pt.x,pt.y)+2,6,14),{evb:E.id,keep:true,angry:true,name:B.name,ghost:E.id==='ghost26',legC:E.foe.paint,maxHp:B.hp+B.hpL*L,cannons:B.guns,dmg:B.dmg*(1+L/60),reload:2.5,maxSpeed:150,aggro:2400,gold:8000+200*L,len:90,wid:30,range:450,home:{x:pt.x,y:pt.y}});o.hp=o.maxHp;enemies.push(o);
 for(let i=0;i<B.esc;i++){const w=waterNear(pt.x,pt.y,150,260);const e=makeEnemy('pirate',w.x,w.y,clamp(lvlAt(w.x,w.y)+1,4,14),{evg:E.id,name:E.foe.name,angry:true,keep:true});enemies.push(e);}
 toast(`${E.icon} ${B.name} rises from the deep! Sink it for exclusive rewards.`);boom(0.5,30);}
function evExchange(){const E=evActive();if(!E)return;const s=evS(E);if(s.c<10)return;s.c-=10;markGain(1);}
function evDraw(ts){if(!evActive()&&!enemies.some(e=>e.evg||e.evb))return;for(const e of enemies){if(!(e.evg||e.evb)||e.sinking)continue;const E=EVENTS.find(x=>x.id===(e.evg||e.evb));const x=WSX(e.x),y=WSY(e.y);if(x<-60||y<-60||x>vw+60||y>vh+60)continue;
 const r=(e.len*0.75)*zoom*(e.evb?1.3:1);ctx.globalAlpha=0.16+0.06*Math.sin(ts*3+e.x);ctx.fillStyle=E?E.foe.glow:'#9cffc8';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(x+Math.cos(e.h)*e.len*0.3*zoom,y+Math.sin(e.h)*e.len*0.3*zoom,2.6,0,TAU);ctx.fill();ctx.globalAlpha=1;}}
// ---- Board UI (menu tab) ----
function boardHTML(){ctrRoll();const C=S.ctr,d=nowD();const tom=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime();const wkEnd=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(7-((d.getDay()+6)%7))).getTime();
 let h=`<div class="note">⚫ <b>${marks()} Black Marks</b> — earned only from contracts and events. Spend them at the Black Market below.</div>`;
 const E=evActive();if(E){const s=evS(E);h+=`<h3>${E.icon} Event: ${E.name} — ends in ${untilTxt(evT(E.end)-d.getTime())}</h3><div class="note">${E.blurb}<br>${E.cur[0]} <b>${s.c}</b> ${E.cur[1]} (total ${s.tot})</div>`;
  E.ms.forEach((m,i)=>{const r=m[1],got=!!s.ms[i]||(r.boss&&s.boss===2);const txt=r.boss?`Summon <b>${E.boss.name}</b> (exclusive: ${E.boss.rw.cos?'🎨 '+COS[E.boss.rw.cos.split(':')[0]].find(x=>x[0]===E.boss.rw.cos.split(':')[1])[1]+', ':''}${E.boss.rw.mk}⚫, trophy)`:r.cos?'🎨 '+COS[r.cos.split(':')[0]].find(x=>x[0]===r.cos.split(':')[1])[1]+' (exclusive)':rwTxt(Object.assign({mk:0,res:{}},r));
   h+=row(`${got?'✅':s.tot>=m[0]?'🎁':'🔒'} ${m[0]}${E.cur[0]}`,txt,got?'':btn('evc',r.boss?(s.boss===1?'Re-summon':'Summon'):'Claim',s.tot>=m[0],i));});
  h+=row(`${E.cur[0]} Exchange`,`Trade 10 ${E.cur[1]} for 1 Black Mark (spent lanterns don't lower your total).`,btn('evx','10➜1⚫',s.c>=10));}
 const nx=evNext();h+=`<div class="note">📅 ${nx?`Next season: ${nx.icon} <b>${nx.name}</b> — starts ${new Date(evT(nx.start)).toLocaleDateString(undefined,{month:'short',day:'numeric'})}.`:'More seasons coming.'}</div>`;
 h+=`<h3>📋 Daily contracts — reset in ${untilTxt(tom-d.getTime())}</h3>`;C.list.forEach((c,i)=>{const t=CTI[c.t];h+=row(`${c.c?'✅':c.p>=c.n?'🎁':'📋'} ${t[1].replace('{n}',c.n)}`,`${Math.min(c.p,c.n)}/${c.n} • reward ${rwTxt(c.rw)}`,c.c?'':btn('ctc','Claim',c.p>=c.n,i));});
 h+=`<div class="note">Finish all three dailies for a bonus 3⚫ ${C.bonus?'✅':''}</div><h3>🗓️ Weekly contracts — reset in ${untilTxt(wkEnd-d.getTime())}</h3>`;
 C.wl.forEach((c,i)=>{const t=CTI[c.t];h+=row(`${c.c?'✅':c.p>=c.n?'🎁':'🗓️'} ${t[1].replace('{n}',c.n)}`,`${Math.min(c.p,c.n)}/${c.n} • reward ${rwTxt(c.rw)}`,c.c?'':btn('ctw','Claim',c.p>=c.n,i));});
 h+=`<h3>🕯️ Black Market</h3><div class="note">Exclusive goods — Black Marks only.</div>`;for(const it of BMI){const own=it[5]&&(S.bmb||{})[it[0]];h+=row(`${it[1]} ${it[2]}`,it[3]+(own?' — ✅ owned':''),own?'':btn('bmb',`${it[4]}⚫`,bmOk(it),it[0]));}return h;}
function boardAct(a,arg){if(a==='ctc'){ctrClaim(+arg,false);return true;}if(a==='ctw'){ctrClaim(+arg,true);return true;}if(a==='bmb'){bmBuy(arg);return true;}if(a==='evc'){const E=evActive();if(E&&E.ms[+arg]&&E.ms[+arg][1].boss){evSummon(E);if(state==='menu'&&enemies.some(e=>e.evb))closeMenuSafe();}else evClaim(+arg);return true;}if(a==='evx'){evExchange();return true;}return false;}
function closeMenuSafe(){const b=$('mClose')||document.querySelector('#menu .phead button');if(b)b.click();}
// ---- hooks ----
GH.ev.push((t,d)=>{if(t==='fish')ctrEv('fish',d);else if(t==='dive')ctrEv('dive',d);else if(t==='craft')ctrEv('craft',d);else if(t==='wave')ctrEv('wave',d);});
GH.sunk.push(e=>{if(e.tut)return;ctrEv('sink',e);evSunk(e);});
GH.tick.push(dt=>{evTick(dt);});GH.draw.push(evDraw);
GH.mig.push(d=>{S.marks=Math.max(0,d.marks|0);S.bmb=(d.bmb&&typeof d.bmb==='object')?d.bmb:{};S.ctr=(d.ctr&&typeof d.ctr==='object'&&Array.isArray(d.ctr.list)&&Array.isArray(d.ctr.wl))?d.ctr:{};
 S.ev=(d.ev&&typeof d.ev==='object')?d.ev:{};for(const k in S.ev){const v=S.ev[k];if(!v||typeof v!=='object'){delete S.ev[k];continue;}v.c=Math.max(0,v.c|0);v.tot=Math.max(0,v.tot|0);v.ms=v.ms||{};if(v.boss===1)v.boss=0;}S.evT=(d.evT&&typeof d.evT==='object')?d.evT:{};ctrRoll();});
Object.assign(TIPS,{event:"👻 <b>Seasonal event!</b> Spectral ships roam the seas for a limited time. Sink them for event currency and claim exclusive rewards on the Board (☰ ➜ Board).",
 board:"📋 <b>Contracts.</b> New daily and weekly contracts pay materials and <b>Black Marks</b> — spend them at the Black Market."});
ACH.push(['ctr25','📋','Contractor','Complete 25 contracts',()=>(S.cst.ctr|0)>=25],['ghost26','👻','Ghost Fleet 2026','Sink the Hollow Commodore during the Ghost Fleet',()=>!!(S.evT||{}).ghost26]);
