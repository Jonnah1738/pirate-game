// ================= GRIND I: shipwright tiers, ship mastery, named crew =================
const RES={wood:['🌲','Timber'],iron:['⛓️','Iron'],canvas:['🏳️','Canvas'],parts:['⚙️','Rare parts']};
const resN=k=>(S.res&&S.res[k])|0;
function resGain(k,n,x,y,quiet){if(!RES[k]||!(n>0))return;S.res[k]=resN(k)+n;if(x!=null&&!quiet)addText(x+rand(-20,20),y-60-rand(0,30),`+${n}${RES[k][0]}`,'#d8c9a0');}
const resTxt=c=>Object.keys(c).filter(k=>RES[k]&&c[k]).map(k=>`${c[k]}${RES[k][0]}`).join(' ');
const resOk=c=>Object.keys(c).every(k=>!RES[k]||resN(k)>=c[k]);
function resPay(c){for(const k in c)if(RES[k])S.res[k]=resN(k)-c[k];}
// ---- crafting tiers per ship & component ----
const CT=[['Common','#b9ad95'],['Fine','#8fc48a'],['Masterwork','#7fb2e6'],['Legendary','#e6a94a']];
const COMP={hull:['🛡️','Hull planking','HP'],sails:['⛵','Sails & rigging','speed & turning'],cannons:['💣','Gun deck','damage & reload'],ram:['🔱','Ram prow','ramming damage']};
const CMUL={hull:{wood:1.4,iron:0.8,canvas:0.4},sails:{wood:0.5,iron:0.4,canvas:1.6},cannons:{wood:0.6,iron:1.6,canvas:0.3},ram:{wood:1,iron:1.4,canvas:0.2}};
const CTIER=[null,{b:[6,4,5],parts:0,g:600,ch:1,lvl:1},{b:[14,10,10],parts:2,g:2500,mat:{iw:1},ch:0.7,lvl:20},{b:[30,24,24],parts:6,g:9000,mat:{rel:1,bp:1},ch:0.45,lvl:35}];
const CBON={hull:[1,1.08,1.16,1.26],sails:[1,1.04,1.08,1.13],cannons:[1,1.06,1.12,1.2],ram:[0,60,130,240]};
function cTier(c,ship){const o=S.craft&&S.craft[ship||S.ship];return(o&&o[c])|0;}
function craftCost(c,t){const d=CTIER[t];if(!d)return null;const m=CMUL[c];const cost={wood:Math.ceil(d.b[0]*m.wood),iron:Math.ceil(d.b[1]*m.iron),canvas:Math.ceil(d.b[2]*m.canvas),parts:d.parts};return{res:cost,g:d.g,mat:d.mat||null,ch:d.ch,lvl:d.lvl};}
function craftChance(c,t){const d=CTIER[t];let ch=d.ch+((S.cpity&&S.cpity[c])|0)*0.12+crewEff('carpenter')*0.01+(S.charm?0.2:0);return Math.min(1,ch);}
function craftTry(c){if(!COMP[c])return;const t=cTier(c)+1;const k=craftCost(c,t);if(!k)return;if(S.clvl<k.lvl||S.gold<k.g||!resOk(k.res)||!matOk(k.mat))return;
 const ch=craftChance(c,t);resPay(k.res);S.gold-=k.g;const ok=Math.random()<ch;S.charm=0;S.cst.craft=(S.cst.craft|0)+1;grindEv('craft',{ok});
 if(ok){matPay(k.mat);S.craft[S.ship]=S.craft[S.ship]||{};S.craft[S.ship][c]=t;S.cpity[c]=0;recalc();chime();toast(`🔨 ${CT[t][0]} ${COMP[c][1]} fitted to your ${HULLS[S.ship].name}!`);if(t===3)S.cst.leg=(S.cst.leg|0)+1;}
 else{S.cpity[c]=(S.cpity[c]|0)+1;S.gold+=Math.round(k.g*0.75);boom(0.3,0);toast(`💥 The ${CT[t][0].toLowerCase()} refit failed — the materials are ruined. Your shipwright refunds 75% of the fee. (+12% chance next time)`);}showTip('craft');}
// ---- ship mastery (XP per hull) ----
const MXP=[0,400,1200,2800,5500,9500,15000,23000,34000,50000,72000];
const MPERK={sloop:[[2,'+6% speed','spd',0.06],[4,'+10% turning','turn',0.1],[6,'Boost recharges 15% faster','bcd',0.15],[8,'Evasive: 10% less damage taken','eva',0.1],[10,'+1 gun per side','gun',1]],
 brig:[[2,'+10 cargo space','cargo',10],[4,'+6% hull','hp',0.06],[6,'5% faster reload','rel',0.05],[8,'+6% cannon damage','dmg',0.06],[10,'+1 gun per side','gun',1]],
 frigate:[[2,'+4% speed','spd',0.04],[4,'+6% cannon damage','dmg',0.06],[6,'6% faster reload','rel',0.06],[8,'+8% gun range','rng',0.08],[10,'+1 gun per side','gun',1]],
 galleon:[[2,'+8% hull','hp',0.08],[4,'+10% gun range','rng',0.1],[6,'+8% cannon damage','dmg',0.08],[8,'+10% turning','turn',0.1],[10,'+1 gun per side','gun',1]]};
function mastLvl(ship){const x=(S.mast&&S.mast[ship||S.ship])|0;let l=0;while(l<10&&x>=MXP[l+1])l++;return l;}
function mastGain(n){if(!S.mast||!(n>0))return;const b=mastLvl();S.mast[S.ship]=(S.mast[S.ship]|0)+Math.round(n);const a=mastLvl();if(a>b){recalc();const pk=(MPERK[S.ship]||[]).find(p=>p[0]===a);setTimeout(()=>toast(`⭐ ${HULLS[S.ship].name} mastery ${a}!${pk?' Perk: '+pk[1]:''}`),900);}}
// ---- named crew roster ----
const CREWR={gunner:['🎯','Gunner','+2% cannon damage per level'],navigator:['🧭','Navigator','+1.2% speed per level, wider sight'],surgeon:['🩺','Surgeon','repairs at sea, fewer injuries & deaths'],bosun:['📯','Bosun','boost recharges 2% faster per level'],
 carpenter:['🔨','Carpenter','+1.5% hull per level, better refit odds'],lookout:['🔭','Lookout','+2% gun range per level, sees through night & fog'],quartermaster:['💼','Quartermaster','+2% plunder gold per level'],angler:['🎣','Angler','better catches when fishing'],diver:['🤿','Diver','more air & finds when salvage diving']};
const TRAITS={steady:['Steady','+25% role effect'],lucky:['Lucky','+5% plunder gold'],brave:['Brave','half as likely to be hurt'],drunk:['Drunkard','−20% effect, but cheap'],sharp:['Quick study','levels 30% faster'],tough:['Tough as nails','never gravely wounded'],eagle:['Eagle-eyed','+25% effect at night & in fog'],greedy:['Greedy','+15% effect, +40% wage'],salt:['Old salt','starts two levels higher']};
const FN=['Jack','Ines','Tom','Mary','Diego','Abel','Rosa','Sam','Nell','Kofi','Bram','Lotte','Esteban','Will','Ada','Hugo','Mei','Ned','Yara','Oskar','Pip','Grace','Silas','Tamsin'];
const LN=['Harrow','Blackwood','Crane','Doyle','Mercer','Pike','Salt','Quill','Rook','Ashby','Fenn','Garrow','Hale','Kidd','Lowe','Marsh','Nye','Orme','Penn','Reyes','Stroud','Tull','Vance','Wren'];
const RARECREW=[{id:'ines',n:'One-Eyed Ines',r:'gunner',tr:'steady',l:5,p:'Tortuga',lvl:12,d:'Took a splinter in the eye at Cartagena and never missed again.'},
 {id:'calloway',n:'Brother Calloway',r:'surgeon',tr:'brave',l:5,p:'Saltgrave',lvl:30,d:'Defrocked, unflappable, sews like a saint.'},
 {id:'magda',n:'Magda Steelhands',r:'carpenter',tr:'tough',l:6,p:'Cinderhold',lvl:40,d:'Learned to rivet Kraken steel in the volcano forges.'},
 {id:'tiko',n:'Tiko Farsight',r:'lookout',tr:'eagle',l:6,p:'Last Light',lvl:50,d:'Grew up in the lighthouse. Sees ships in the dark before the stars do.'},
 {id:'nan',n:'Grandmother Nan',r:'angler',tr:'lucky',l:5,p:'Kraken\'s Reef',lvl:15,d:'Has fished the Reef for sixty years and never come home empty.'},
 {id:'quint',n:'Quint the Eel',r:'diver',tr:'salt',l:4,p:'Smuggler\'s Cove',lvl:18,d:'Holds his breath longer than a priest holds a grudge.'},
 {id:'merritt',n:'Old Merritt',r:'navigator',tr:'steady',l:6,p:'Freeport Libertalia',lvl:25,d:'Sailed with Avery. Or says he did.'},
 {id:'sabine',n:'Sabine Le Roux',r:'quartermaster',tr:'greedy',l:6,p:'Blacktide Hold',lvl:28,d:'Can smell a hidden purse through two decks.'}];
const RCI={};RARECREW.forEach(c=>RCI[c.id]=c);
function crewCap(){return 3+Math.max(0,HORD.indexOf(S.ship))+(codexSet('crew')?1:0);}
const cxNeed=l=>Math.round(120*Math.pow(l,1.6));
function crewOn(m){return !(m.inj>(S.playTime||0));}
function crewEff(role){let v=0;for(const m of S.roster||[]){if(m.r!==role||!crewOn(m))continue;let k=m.l;if(m.tr==='steady')k*=1.25;else if(m.tr==='drunk')k*=0.8;else if(m.tr==='greedy')k*=1.15;if(m.tr==='eagle'&&(wxNight()||wxFog()))k*=1.25;v+=k;}return v;}
function recruitsAt(pi){const p=PORTS[pi];if(!p)return[];const day=Math.floor((S.playTime||0)/600);const r=rng(pi*131+day*7919+17);const out=[];const n=p.haven?3:2;const roles=Object.keys(CREWR);const trs=Object.keys(TRAITS);
 for(let i=0;i<n;i++){const id='c'+pi+'_'+day+'_'+i;const tr=trs[(r()*trs.length)|0],lr=r(),fn=FN[(r()*FN.length)|0],ln=LN[(r()*LN.length)|0],ro=roles[(r()*roles.length)|0];if((S.hired||[]).includes(id))continue;const l=1+((lr*Math.min(5,1+S.clvl/10))|0)+(tr==='salt'?2:0);out.push({id,n:fn+' '+ln,r:ro,tr,l});}
 for(const c of RARECREW)if(c.p===p.name&&!(S.hired||[]).includes(c.id))out.push(Object.assign({rare:1},c));return out;}
function crewWage(m){return Math.round((2+m.l*1.2)*(m.rare?1.6:1)*(m.tr==='drunk'?0.6:m.tr==='greedy'?1.4:1));}
function crewHirePrice(m){return Math.round((150+m.l*m.l*60)*(m.rare?3:1));}
function crewHire(pi,id){const c=recruitsAt(pi).find(x=>x.id===id);if(!c)return;if(c.rare&&S.clvl<c.lvl)return;if(S.roster.length>=crewCap()){toast(`👥 No bunks free (${crewCap()}). Bigger hulls carry more named crew.`);return;}const pr=crewHirePrice(c);if(S.gold<pr)return;
 S.gold-=pr;S.hired.push(id);const m={id:++S.rid,n:c.n,r:c.r,tr:c.tr,l:c.l,xp:0,inj:0,rare:c.rare?c.id:0};S.roster.push(m);if(c.rare)codexAdd('crew',c.id);recalc();chime();toast(`👥 ${m.n} (${CREWR[m.r][1]}, ${TRAITS[m.tr][0]}) signs your articles.`);showTip('crew');grindEv('hire',{});}
function crewXP(n){for(const m of S.roster){if(!crewOn(m)||m.l>=10)continue;m.xp+=Math.round(n*(m.tr==='sharp'?1.3:1));while(m.l<10&&m.xp>=cxNeed(m.l)){m.xp-=cxNeed(m.l);m.l++;toast(`👥 ${m.n} is now a level ${m.l} ${CREWR[m.r][1].toLowerCase()}!`);recalc();}}}
function crewHurt(big){const ok=S.roster.filter(crewOn);if(!ok.length)return;const sg=crewEff('surgeon')+(S.off.sg?3:0);const now=S.playTime||0;
 if(!big){const m=pick(ok);if(Math.random()<(m.tr==='brave'?0.5:1)){m.inj=now+Math.round(300*(1-Math.min(0.6,sg*0.05)));toast(`🩸 ${m.n} is wounded — out of action for a while.`);recalc();}return;}
 const gr=[];for(const m of ok){const pk=m.tr==='tough'?0:0.07,pi=(m.tr==='brave'?0.15:0.3);const r=Math.random();if(r<pk){gr.push(m);m.grave=1;m.inj=now+graveT(sg);}else if(r<pk+pi)m.inj=now+Math.round(600*(1-Math.min(0.5,sg*0.05)));}
 if(gr.length){S.cst.grave=(S.cst.grave|0)+gr.length;setTimeout(()=>toast(`🩸 Gravely wounded: ${gr.map(m=>m.n).join(', ')} — laid up for ${Math.round(graveT(sg)/60)} min. ${sg>0?'Your surgeon is working on them.':'A surgeon would speed recovery.'}`),2600);}recalc();}
function graveT(sg){return Math.round(1500*(1-Math.min(0.5,sg*0.06)));}
// ---- stats ----
function grindRecalc(){if(!S.craft||!S.roster)return;const sh=S.ship;const t=c=>cTier(c,sh);
 ST.maxHp=Math.round(ST.maxHp*CBON.hull[t('hull')]);ST.maxSpeed*=CBON.sails[t('sails')];ST.turn*=CBON.sails[t('sails')];ST.dmg*=CBON.cannons[t('cannons')];ST.reload*=[1,0.97,0.94,0.9][t('cannons')];
 const ml=mastLvl(sh);ST.eva=0;for(const [l,,k,v] of (MPERK[sh]||[])){if(ml<l)continue;if(k==='spd')ST.maxSpeed*=1+v;else if(k==='turn')ST.turn*=1+v;else if(k==='bcd')ST.boostCd*=1-v;else if(k==='eva')ST.eva=v;else if(k==='gun')ST.cannons+=v;else if(k==='cargo')ST.cargoCap+=v;else if(k==='hp')ST.maxHp=Math.round(ST.maxHp*(1+v));else if(k==='rel')ST.reload*=1-v;else if(k==='dmg')ST.dmg*=1+v;else if(k==='rng')ST.range*=1+v;}
 ST.dmg*=1+0.02*crewEff('gunner');ST.maxSpeed*=1+0.012*crewEff('navigator');ST.regen+=0.15*crewEff('surgeon');ST.boostCd*=Math.max(0.6,1-0.02*crewEff('bosun'));ST.maxHp=Math.round(ST.maxHp*(1+0.015*crewEff('carpenter')));ST.range*=1+0.02*crewEff('lookout');ST.reveal+=60*crewEff('navigator');
 ST.ramDmg=CBON.ram[t('ram')];for(const f of GH.hud)f();}
function grindLootK(){return 1+0.02*crewEff('quartermaster')+0.05*(S.roster||[]).filter(m=>m.tr==='lucky'&&crewOn(m)).length;}
// player ram (needs a ram prow)
function ramTick(dt){if(!(ST.ramDmg>0)||P.dead)return;const sp=Math.hypot(P.vx,P.vy);if(sp<80)return;
 for(const e of enemies){if(e.sinking||e.surr||e.tut||e.kraken)continue;e.prc=(e.prc||0)-dt;if(e.prc>0)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>(ST.len+e.len)*0.42)continue;
  const dm=Math.round(ST.ramDmg*Math.min(1.3,sp/Math.max(60,ST.maxSpeed))*(1+0.8*threat()));e.prc=1.4;damageEnemy(e,dm);e.angry=true;const a=Math.atan2(e.y-P.y,e.x-P.x);e.vx+=Math.cos(a)*160;e.vy+=Math.sin(a)*160;
  if(!hullLocked())P.hp-=dm*0.08;P.vx*=0.55;P.vy*=0.55;cam.shake=Math.max(cam.shake,10);addText(e.x,e.y-50,`🔱 RAM -${dm}`,'#ffb35a',true);boom(0.5,120);grindEv('ram',{});}}
// ---- UI ----
function craftHTML(p){let h=`<h3>🔨 Shipwright — refit tiers</h3><div class="note">Each component of <b>this ship</b> can be refitted Common → Fine → Masterwork → Legendary. Higher tiers can <b>fail and ruin the materials</b> (failures raise the odds next time). Stock: ${Object.keys(RES).map(k=>`${RES[k][0]} ${resN(k)}`).join(' • ')}</div>`;
 for(const c in COMP){const t=cTier(c),nx=t+1,k=craftCost(c,nx);const col=CT[t][1];const eff=c==='ram'?(t?`${CBON.ram[t]} ram damage`:'no ram'):`+${Math.round((CBON[c][t]-1)*100)}% ${COMP[c][2]}`;
  if(!k){h+=row(`${COMP[c][0]} ${COMP[c][1]} <span style="color:${col}">● ${CT[t][0]}</span>`,`${eff} (MAX)`,'');continue;}
  const ok=S.clvl>=k.lvl&&S.gold>=k.g&&resOk(k.res)&&matOk(k.mat)&&p.haven;const ch=Math.round(craftChance(c,nx)*100);
  h+=row(`${COMP[c][0]} ${COMP[c][1]} <span style="color:${col}">● ${CT[t][0]}</span>`,`${eff} ➜ <b>${CT[nx][0]}</b>: ${c==='ram'?CBON.ram[nx]+' ram damage':'+'+Math.round((CBON[c][nx]-1)*100)+'% '+COMP[c][2]}<br>${resTxt(k.res)}${matTxt(k.mat)} + ${k.g}💰 • success <b>${ch}%</b>${S.clvl<k.lvl?` • needs Lv${k.lvl}`:''}${p.haven?'':' • havens only'}`,btn('craft',ch<100?`Refit (${ch}%)`:'Refit',ok,c));}
 if(p.haven){const pr={wood:45,iron:70,canvas:55};h+=row('🪵 Shipyard stores',`Buy basic materials (5 per bundle). Salvage, fishing nets and sunk ships give them free.`,Object.keys(pr).map(k=>btn('rbuy',`5${RES[k][0]} ${Math.round(pr[k]*5*mk())}💰`,S.gold>=Math.round(pr[k]*5*mk()),k)).join(''));}
 return h;}
function mastHTML(){const sh=S.ship,l=mastLvl(sh),x=(S.mast[sh]|0);let h=`<h3>⭐ ${HULLS[sh].name} mastery — ${l}/10</h3><div class="note">Captain XP earned while sailing this hull trains your crew on it. ${l<10?`${x}/${MXP[l+1]} XP to level ${l+1}.`:'Mastered!'}</div>`;
 h+=(MPERK[sh]||[]).map(([lv,txt])=>`<div class="note" style="padding:2px 6px">${l>=lv?'✅':'🔒'} Lv${lv}: ${txt}</div>`).join('');
 const other=HORD.filter(k=>k!==sh&&(S.mast[k]|0)>0).map(k=>`${HULLS[k].icon} ${HULLS[k].name} ${mastLvl(k)}/10`);if(other.length)h+=`<div class="note">Other hulls: ${other.join(' • ')}</div>`;return h;}
function rosterHTML(p){const pi=PORTS.indexOf(p);let h=`<h3>🧑‍🤝‍🧑 Named crew (${S.roster.length}/${crewCap()})</h3><div class="note">Specialists with roles, traits and levels. They earn XP from every ship you sink, draw wages, and can be <b>wounded</b> by heavy fire, or <b>gravely wounded</b> (out for ~25 min, less with a surgeon) when you sink. Nobody is lost for good.</div>`;
 for(const m of S.roster){const on=crewOn(m),R=CREWR[m.r];h+=row(`${R[0]} ${esc(m.n)} <small style="display:inline">Lv${m.l} ${R[1]}</small>${m.rare?' ⭐':''}`,`${TRAITS[m.tr][0]} (${TRAITS[m.tr][1]}) • ${R[2]} • wage ${crewWage(m)}💰/min${on?'':` • <b style="color:#a12a1d">${m.grave?'gravely wounded':'wounded'} (${Math.ceil((m.inj-S.playTime)/60)} min)</b>`}${m.l<10?` • XP ${m.xp}/${cxNeed(m.l)}`:''}`,btn('cdis','Dismiss',true,m.id,'red'));}
 const rec=recruitsAt(pi);if(rec.length){h+=`<div class="note">🍺 Looking for a berth here today:</div>`;for(const c of rec){const pr=crewHirePrice(c),R=CREWR[c.r],lk=c.rare&&S.clvl<c.lvl;h+=row(`${R[0]} ${esc(c.n)} <small style="display:inline">Lv${c.l} ${R[1]}</small>${c.rare?' ⭐ rare':''}`,`${TRAITS[c.tr][0]} — ${TRAITS[c.tr][1]}. ${R[2]}.${c.d?`<br><i>${c.d}</i>`:''} Wage ${crewWage(c)}💰/min.`,btn('chire',lk?`Lv${c.lvl}`:`${pr}💰`,!lk&&S.gold>=pr&&S.roster.length<crewCap(),c.id));}}
 return h;}
function grindPortAct(act,arg){if(act==='craft'){if(PORTS[curPort].haven)craftTry(arg);return true;}
 if(act==='rbuy'){const pr={wood:45,iron:70,canvas:55}[arg];if(!pr||!PORTS[curPort].haven)return true;const c=Math.round(pr*5*mk());if(S.gold>=c){S.gold-=c;resGain(arg,5);chime();}return true;}
 if(act==='chire'){crewHire(curPort,arg);return true;}if(act==='cdis'){const i=S.roster.findIndex(m=>m.id==arg);if(i>=0){const m=S.roster[i];S.roster.splice(i,1);toast(`👋 ${m.n} collects their pay and goes ashore.`);recalc();}return true;}
 for(const f of GPORT)if(f(act,arg))return true;return false;}
const GPORT=[];
// ---- loot hook & tick ----
function grindSunkA(e){if(e.tut)return;const x=e.x,y=e.y,big=e.kind==='boss'||e.lead||e.lev;
 if(Math.random()<0.75)resGain('wood',1+((Math.random()*(big?5:2))|0),x,y);if(Math.random()<(e.kind==='navy'||e.cls==='iron'?0.7:0.35))resGain('iron',1+((Math.random()*(big?4:2))|0),x,y);if(Math.random()<0.45)resGain('canvas',1+((Math.random()*(big?4:2))|0),x,y);
 if(e.elite||big||(e.vet&&Math.random()<0.25)||(e.cls==='iron'&&Math.random()<0.2)||(e.cls==='galleon'&&Math.random()<0.12))resGain('parts',big?2:1,x,y);
 crewXP(8+e.lvl*3);}
let gAT=0;
function grindTickA(dt){ramTick(dt);for(const m of S.roster)if(crewOn(m)&&S.upk&&S.infamy>=UPK.FREE_INF&&!T.on)S.upk.crew+=crewWage(m)*dt/60;gAT-=dt;if(gAT<=0){gAT=2;if(S.roster.some(m=>m.inj&&m.inj<=S.playTime)){for(const m of S.roster)if(m.inj&&m.inj<=S.playTime){m.inj=0;if(m.grave){m.grave=0;toast(`🩹 ${m.n} is back on their feet.`);}}recalc();}}}
function grindMigrateA(d){S.res=Object.assign({wood:0,iron:0,canvas:0,parts:0},(d.res&&typeof d.res==='object')?d.res:{});for(const k in RES)S.res[k]=Math.max(0,S.res[k]|0);
 S.craft=(d.craft&&typeof d.craft==='object')?d.craft:{};for(const sh in S.craft){if(!HULLS[sh]||typeof S.craft[sh]!=='object'){delete S.craft[sh];continue;}for(const c in S.craft[sh])S.craft[sh][c]=clamp(S.craft[sh][c]|0,0,3);}
 S.cpity=(d.cpity&&typeof d.cpity==='object')?d.cpity:{};S.mast=Object.assign({sloop:0,brig:0,frigate:0,galleon:0},(d.mast&&typeof d.mast==='object')?d.mast:{});for(const k in S.mast)S.mast[k]=Math.max(0,+S.mast[k]||0);
 S.roster=(Array.isArray(d.roster)?d.roster:[]).filter(m=>m&&CREWR[m.r]&&TRAITS[m.tr]).slice(0,8).map(m=>({id:+m.id||0,n:String(m.n||'Sailor').replace(/[<>&"]/g,'').slice(0,24),r:m.r,tr:m.tr,l:clamp(m.l|0,1,10),xp:Math.max(0,m.xp|0),inj:+m.inj||0,rare:m.rare||0,grave:m.grave?1:0}));
 S.rid=Math.max(S.rid|0,0,...S.roster.map(m=>m.id));S.hired=Array.isArray(d.hired)?d.hired.filter(x=>typeof x==='string').slice(-400):[];S.charm=d.charm?1:0;}
Object.assign(TIPS,{craft:"🔨 <b>Refit tiers.</b> Timber, iron, canvas and rare parts from sunk ships let the shipwright refit hull, sails, guns and a <b>ram prow</b>. Higher tiers can fail and burn the materials.",
 crew:"🧑‍🤝‍🧑 <b>Named crew.</b> Taverns offer specialists with roles and traits. They level up as you fight — heavy fire can wound them, and a sinking can leave them gravely wounded for a long while."});
ACH.push(['craft1','🔨','Shipwright','Fit a Masterwork refit',()=>Object.values(S.craft||{}).some(o=>Object.values(o).some(t=>t>=2))],['craft3','🏅','Legendary Refit','Fit a Legendary refit',()=>(S.cst.leg|0)>=1],
 ['mast10','⭐','Master of the Hull','Reach mastery 10 on any hull',()=>HORD.some(k=>mastLvl(k)>=10)],['crew6','🧑‍🤝‍🧑','Full Articles','Sail with 6 named crew',()=>(S.roster||[]).length>=6],['crewL','🎖️','Veteran Crew','Train a named crew member to level 10',()=>(S.roster||[]).some(m=>m.l>=10)]);
GH.tick.push(grindTickA);GH.sunk.push(grindSunkA);GH.mig.push(grindMigrateA);
