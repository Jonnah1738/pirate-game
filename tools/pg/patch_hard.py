import sys
P='/workspace/pirate-game/index.html';T='/workspace/tools/pg/'
s=open(P).read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a)
    if n!=cnt: sys.exit(f'count {n} for: {a[:100]}')
    s=s.replace(a,b)
STUB='story_stub.js' if '--stub' in sys.argv else None
# regions after forts
rep("   const f={id:FORTS.length,x,y,a,clan:c,name:FORTN[c][k],lvl:lvlAt(x,y)};FORTS.push(f);o.fort=f;k++;}}})();",
    "   const f={id:FORTS.length,x,y,a,clan:c,name:FORTN[c][k],lvl:lvlAt(x,y)};FORTS.push(f);o.fort=f;k++;}}})();\n"+open(T+'hard_regions.js').read())
rep("function lvlAt(x,y){const d=Math.hypot(x-START.x,y-START.y);return d<5600?clamp(1+Math.floor(d/800),1,8):Math.min(12,8+Math.floor((d-5600)/1400));}",
    "function lvlAt0(x,y){const d=Math.hypot(x-START.x,y-START.y);return d<5600?clamp(1+Math.floor(d/800),1,8):Math.min(12,8+Math.floor((d-5600)/1400));}\nfunction lvlAt(x,y){const R=regionAt(x,y);return R?Math.min(14,lvlAt0(x,y)+R.bonus):lvlAt0(x,y);}")
# scaling
rep(" Object.assign(e,extra||{});e.hp=e.maxHp;return e;}"," Object.assign(e,extra||{});e.hp=e.maxHp;return scaleFoe(e);}")
rep("ctx.fillText(e.kind==='clan'?clanLabel(e):e.lev?","ctx.fillText(vetTag(e)+(e.kind==='clan'?clanLabel(e):e.lev?")
rep(":`☠ Rival Pirate Lv${e.lvl}`,X,Y-8);}",":`☠ Rival Pirate Lv${e.lvl}`),X,Y-8);}")
rep(" drawFortLabels();"," drawFortLabels();drawKT();")
rep("else drawShip(e,'#3b3b42','#111',0.9);}","else drawShip(e,'#3b3b42','#111',0.9);clsOverlay(e,ts);}")
rep("damageEnemy(e,b.dmg);if(b.am)ammoHit(e,b);","damageEnemy(e,b.dmg*ironK(e,b));if(b.am)ammoHit(e,b);")
rep("moveShip(e,desired,thr,e.maxSpeed*(e.slowT>0?0.55:1),1.3*(e.slowT>0?0.6:1),dt);","moveShip(e,desired,thr,e.maxSpeed*(e.slowT>0?0.55:1)*(e.ramW>0?0.4:1),1.3*(e.turnK||1)*(e.slowT>0?0.6:1),dt);")
rep("else if(e.kind==='boss')drawShip(e,'#8c1c26','#111',1);","else if(e.kind==='boss'){if(e.kraken)drawKraken(e,ts);else drawShip(e,e.ghost?'rgba(190,230,220,0.5)':e.legC||'#8c1c26','#111',1);}")
rep("const gm=Math.round((60+12*L)*(mine?1+0.4*uw:1));","const gm=Math.round((60+12*L)*(mine?1+0.4*uw:1+threat()));")
rep("rt.wallMax=rt.wall=Math.round((300+60*L)*(mine?(1+0.5*uw)*(sk('war')>=3?1.25:1):1));","rt.wallMax=rt.wall=Math.round((300+60*L)*(mine?(1+0.5*uw)*(sk('war')>=3?1.25:1):1+threat()));")
rep("const dmg=mine?(8+2*f.lvl)*(1+0.2*(s.ug|0)):(6+2*f.lvl);","const dmg=mine?(8+2*f.lvl)*(1+0.2*(s.ug|0)):(6+2*f.lvl)*(1+0.6*threat());")
rep(" BR.cs0=cr;BR.cs1={hp:24+5*L,dmg:3.5+1.3*L,red:0};"," BR.cs0=cr;{const K=foeCrewK(e,mode);BR.cs1={hp:(24+5*L)*K.hp,dmg:(3.5+1.3*L)*K.dmg,red:0};}")
rep("hp:Math.round((300+70*L)*(e.lev?1.5:1)),","hp:Math.round((300+70*L)*(e.lev?1.5:1)*(1+0.8*threat())),")
rep("hp:Math.round((120+30*L)*(e&&e.kind==='merchant'?0.7:1)),","hp:Math.round((120+30*L)*(e&&e.kind==='merchant'?0.7:1)*(1+0.8*threat()*(e&&e.kind==='merchant'?0.4:1))),")
rep("function damageEnemy(e,dmg){if(e.grap&&BR.on)return;","function damageEnemy(e,dmg){if(e.grap&&BR.on)return;dmg=hardDmgMod(e,dmg);if(!(dmg>0))return;")
rep(" clanSunk(e);levSunk(e);"," clanSunk(e);levSunk(e);if(e.vet||e.elite)S.cst.vet=(S.cst.vet|0)+1;hardSunk(e);")
rep("if(s.mega)S.megas=(S.megas|0)+1;","if(s.mega){S.megas=(S.megas|0)+1;megaSunk(s);}")
rep("S.cst.fort++;S.infamy+=100+20*f.lvl;","S.cst.fort++;fortTaken(f);S.infamy+=100+20*f.lvl;")
rep("S.cst.def++;const r=150+25*f.lvl;","S.cst.def++;matGain('iw',1);const r=150+25*f.lvl;")
# clan war
rep("""  if(S.king)continue;
  if(!s.atk&&S.playTime>=(s.nx||0)){s.atk={t:150,c:f.clan,sp:0};toast(`🛡️ The ${CLANS[f.clan].name} are attacking ${f.name}! Defend it within 2:30 — 🛡️ on your map.`);}
  if(s.atk){const a=s.atk;a.t-=1;""","""  if(!s.atk&&S.playTime>=(s.nx||0)){if(!warCan(f,s)){s.nx=S.playTime+60;continue;}s.atk={t:150,w:60,c:f.clan,sp:0};warStart(f,s);}
  if(s.atk){const a=s.atk;if(a.w>0)a.w-=1;else a.t-=1;""")
rep("const n=2+(f.lvl>=10?1:0);for(let i=0;i<n;i++){","const n=2+(f.lvl>=10?1:0)+(S.clvl>=35?1:0)+(S.king?1:0);for(let i=0;i<n;i++){")
rep("if(lose){S.forts[f.id]={o:a.c};delete FRT[f.id];","if(lose){S.forts[f.id]={o:a.c};delete FRT[f.id];warLost(f,s,a.c);")
rep("${s.atk?`🛡️ <b>Under attack!</b> ${Math.max(0,Math.ceil(s.atk.t))}s left`","${s.atk?(s.atk.w>0?`⚔️ <b>Attack incoming</b> in ${Math.ceil(s.atk.w)}s`:`🛡️ <b>Under attack!</b> ${Math.max(0,Math.ceil(s.atk.t))}s left`)")
# ticks, targets
rep("function expTick(dt){","function expTick(dt){hardTick(dt);")
rep("defendTargets(out);return out;}","defendTargets(out);hardTargets(out);return out;}")
rep("function statFor(q){const st=S.st;","function statFor(q){const st=S.st;if(q.grand)grandFound(q);")
# death
rep("const lostG=Math.round(S.gold*(early?0.1:0.25));","const lostG=Math.round(S.gold*(early?0.1:0.22));")
rep("const n=early?Math.ceil(S.cargo[g.id]/2):S.cargo[g.id];","const n=Math.ceil((S.cargo[g.id]|0)/2);")
rep("$('deadTxt').innerHTML=`You lost ${lostG} 💰${lostC?`, ${lostC} crates of cargo`:''}","const rb=early?0:deathRepair();$('deadTxt').innerHTML=`You lost ${lostG} 💰${lostC?`, ${lostC} crates of cargo (half your hold)`:''}${rb?` and paid a ${rb}💰 repair bill`:''}")
rep("<br>Some of your crew swam to ${PORTS[S.lastPort].name}.`;","<br>Some of your crew swam to ${PORTS[S.lastPort].name}.${early?'':' Keep spare gold in a 🏴‍☠️ haven vault — it can\\'t sink.'}`;showTip('vault');")
# docking / ui
rep("dockQuests(pi);exDock(pi);","dockQuests(pi);exDock(pi);upkSettle('port');")
rep("range:420*(g>=3?1.12:1)};\n expRecalc();","range:420*(g>=3?1.12:1)};\n expRecalc();moraleApply();")
rep("function dockExtraHTML(p){let h='';","function dockExtraHTML(p){hEns();let h=ledgerHTML()+vaultHTML(p)+legHTML(p);")
rep("function exPortAction(act,arg){if(armsAction(act,arg))return true;",
"""function exPortAction(act,arg){if(armsAction(act,arg))return true;
 if(act==='vdep'){if(!PORTS[curPort].haven)return true;const n=arg==='half'?Math.floor(S.gold/2):S.gold;if(n>0){const fee=Math.ceil(n*0.02);S.gold-=n;S.vault=(S.vault|0)+n-fee;chime();toast(`🏦 Deposited ${n-fee}💰 (fee ${fee}). Vault: ${S.vault}💰`);}return true;}
 if(act==='vwd'){if(!PORTS[curPort].haven)return true;const n=S.vault|0;if(n>0){S.vault=0;S.gold+=n;chime();toast(`🏦 Withdrew ${n}💰.`);}return true;}
 if(act==='lbtake'){legAccept(arg);return true;}if(act==='lbdrop'){for(const o of enemies)if(o.lb===S.lb.cur){o.keep=false;o.lb='';}S.lb.cur='';toast('📜 Hunt abandoned.');return true;}""")
rep("function tryDock(pi){const p=PORTS[pi];","function tryDock(pi){const p=PORTS[pi];if(p.story&&!portOpen(p)){toast(`🌫️ ${p.name}: fog and uncharted reefs turn you back. (Story Act ${p.story}, or captain level ${p.reqL})`);return;}")
rep("function hotOk(gi,pi){const p=PORTS[pi],g=GOODS[gi].id;","function hotOk(gi,pi){const p=PORTS[pi],g=GOODS[gi].id;if(p.story&&!portOpen(p))return false;")
# pricier progression
rep("btn('hull',ok?`${price}💰`:'🔒 Locked',ok&&p.haven&&S.gold>=price,k)","btn('hull',ok?`${price}💰${matTxt(HULLMAT[k])}`:'🔒 Locked',ok&&p.haven&&S.gold>=price&&matOk(HULLMAT[k]),k)")
rep("const price=Math.max(0,c.cost-Math.round(cur.cost*0.4));if(S.gold<price)return;\n S.gold-=price;","const price=Math.max(0,c.cost-Math.round(cur.cost*0.4));if(S.gold<price||!matOk(HULLMAT[k]))return;\n matPay(HULLMAT[k]);S.gold-=price;")
rep("btn('gear',hv?`${it[3]} 💰`:'Havens only',hv&&ok&&i===cur+1&&S.gold>=it[3],g+':'+i)","btn('gear',hv?`${it[3]} 💰${matTxt(gearMat(g,i))}`:'Havens only',hv&&ok&&i===cur+1&&S.gold>=it[3]&&matOk(gearMat(g,i)),g+':'+i)")
rep("||S.clvl<L[n][2]||S.gold<L[n][3])return true;S.gold-=L[n][3];","||S.clvl<L[n][2]||S.gold<L[n][3]||!matOk(gearMat(g,n)))return true;matPay(gearMat(g,n));S.gold-=L[n][3];")
rep("btn('crewg',l>=max?'MAX':hv?`${c} 💰`:'Havens only',hv&&l<max&&S.gold>=c,k)","btn('crewg',l>=max?'MAX':hv?`${c} 💰${matTxt(crewgMat(k,l+1))}`:'Havens only',hv&&l<max&&S.gold>=c&&matOk(crewgMat(k,l+1)),k)")
rep("if(l>=d[2].length-1||S.gold<d[3][l+1])return true;S.gold-=d[3][l+1];","if(l>=d[2].length-1||S.gold<d[3][l+1]||!matOk(crewgMat(arg,l+1)))return true;matPay(crewgMat(arg,l+1));S.gold-=d[3][l+1];")
rep("btn('up',max?'MAX':`${c} 💰`,!max&&S.gold>=c,k)","btn('up',max?'MAX':`${c} 💰${matTxt(upMat(k,l))}`,!max&&S.gold>=c&&matOk(upMat(k,l)),k)")
rep("if(S.gold>=c&&S.up[arg]<d.max){S.gold-=c;S.up[arg]++;","if(S.gold>=c&&S.up[arg]<d.max&&matOk(upMat(arg,S.up[arg]))){matPay(upMat(arg,S.up[arg]));S.gold-=c;S.up[arg]++;")
rep("if(!SKILLS[k]||l>=SKILLS[k].p.length||(S.sp|0)<1||S.clvl<perkLvl(k,l))return;S.sp--;","if(!SKILLS[k]||l>=SKILLS[k].p.length||(S.sp|0)<1||S.clvl<perkLvl(k,l))return;{const pc=perkCost(k,l);if(pc&&(S.gold<pc.gold||!matOk(pc.mat))){toast(`🔒 ${SKILLS[k].p[l][0]} needs ${pc.gold}💰${matTxt(pc.mat)}.`);return;}if(pc){S.gold-=pc.gold;matPay(pc.mat);}}S.sp--;")
rep("btn('learn',next&&lv?'Learn (1 SP)':'Locked',next&&lv&&(S.sp|0)>0,k)","btn('learn',next&&lv?(perkCost(k,i)?`1 SP + ${perkCost(k,i).gold}💰${matTxt(perkCost(k,i).mat)}`:'Learn (1 SP)'):'Locked',next&&lv&&(S.sp|0)>0&&(!perkCost(k,i)||S.gold>=perkCost(k,i).gold&&matOk(perkCost(k,i).mat)),k)")
rep("if(!it||S.clvl<it[2])return;S.cos[cat]=id;","if(!it||!cosOk(cat,it))return;S.cos[cat]=id;")
rep("for(const it of COS[cat]){const ok=S.clvl>=it[2],on=S.cos[cat]===it[0];","for(const it of COS[cat]){if(it[2]>=999&&!cosOk(cat,it))continue;const ok=cosOk(cat,it),on=S.cos[cat]===it[0];")
# menu
rep(" h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');"," h+=row('📦 Cargo',`${used}/${ST.cargoCap}: ${cg}`,'');hEns();h+=row('🪵 Rare materials',matInv()+` • 🗺️ chart fragments <b>${S.tr.frag|0}/${FRAG_MAX}</b>`,'');h+=ledgerHTML();")
# save
rep("function defaultState(){return{eco:ecoDef(),","function defaultState(){return{mat:{iw:0,ink:0,bp:0,rel:0},matTot:0,upk:{crew:0,wear:0,t:0,last:null,paidTot:0},morale:80,vault:0,war:{next:0,n:0,lost:0},lb:{cur:'',st:0,have:0,done:{},hp:1},tr:{frag:0,dug:0},eb:{admiral:{hp:1,done:0,tries:0},kraken:{hp:1,done:0,tries:0}},cosU:{},eco:ecoDef(),")
rep(" migrateExp(d);migrateBoard(d);migrateEco(d);migrateXp(d);"," migrateExp(d);migrateBoard(d);migrateEco(d);migrateXp(d);hardMigrate(d);")
HARD=open(T+'hard.js').read()+"\nfunction hEns(){if(!S.upk||!S.mat||!S.lb||!S.eb||!S.tr||!S.war||!S.cosU)hardMigrate(Object.assign({},S));}\nfunction portOpen(p){return !p.story||storyAct()>=p.story||S.clvl>=p.reqL;}\n"
if STUB: HARD+=open(T+STUB).read()
rep("readSafe();const hadSave=load();",HARD+"\nreadSafe();const hadSave=load();")
rep("window.__game={ECON:{","window.__game={HARD:{FORTS,vetTag,waterNear:(x,y,a,b)=>waterNear(x,y,a,b),applyCls,pickCls,havenDist,ironK,ironTick,squadTick,CLS,foeCrewK,hardSunk,megaSunk,hardTargets,get FRT(){return FRT},fortRT,ledgerHTML,threat,scaleFoe,matGain,matN,upkRates,upkSettle,upkOwed,LEGENDS,legAccept,legTick,ebTick,EBOSS,ebPt,fragGain,grandSpot,SREG:SREGP,regionAt,warCan,KT,krakenTick,perkCost,gearMat,upMat,HULLMAT,deathRepair,portOpen,playerDied:()=>playerDied(),captureFort,fortEconomy:dt=>fortEconomy(dt),get curFort(){return curFort}},ECON:{")
open(P,'w').write(s);print('patched',len(s))
