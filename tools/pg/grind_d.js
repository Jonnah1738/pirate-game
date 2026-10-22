// ================= GRIND IV: fleet upgrades, veterancy, refits & shipyard lay-ups (no permanent loss) =================
const FSZ={sloop:0,prize:1,brig:1.5,corsair:2,wraith:2.5,ironside:3};
const fsz=d=>FSZ[d.type]!=null?FSZ[d.type]:1;
const FUP={hull:['🛡️','Hull planking','wood',250,'+12% HP'],guns:['💣','Gun deck','iron',300,'+8% damage, +1 gun at Lv2 & Lv4'],sails:['⛵','Sails & rigging','canvas',200,'+3% speed']};
const FCMAP={hull:'hull',guns:'cannons',sails:'sails'};
const FUMAX=5;
const VT=[0,250,800,1800,3600],VN=['Green','Blooded','Seasoned','Veteran','Elite'];
function fvl(d){let l=0;while(l<4&&(d.fx|0)>=VT[l+1])l++;return l;}
function fRep(d){return d.rep>0&&d.rep>Date.now();}
function fBase(d){if(!d.b||!(d.b.hp>0))d.b={hp:Math.max(20,+d.maxHp||60),can:clamp(+d.cannons||1,1,6),dmg:clamp(+d.dmg||5,1,40)};d.fu=Object.assign({hull:0,guns:0,sails:0},d.fu||{});d.ft=Object.assign({hull:0,guns:0,sails:0},d.ft||{});d.fp=Object.assign({},d.fp||{});
 for(const k in FUP){d.fu[k]=clamp(d.fu[k]|0,0,FUMAX);d.ft[k]=clamp(d.ft[k]|0,0,3);}d.fx=Math.max(0,+d.fx||0);d.rep=+d.rep||0;d.rept=+d.rept||0;}
function fRecalc(d){fBase(d);const v=fvl(d),u=d.fu,t=d.ft;const r=d.maxHp>0?d.hp/d.maxHp:1;
 d.maxHp=Math.round(d.b.hp*(1+0.12*u.hull)*CBON.hull[t.hull]*(1+0.04*v));d.cannons=Math.min(9,d.b.can+(u.guns>=2?1:0)+(u.guns>=4?1:0)+(t.guns>=3?1:0));
 d.dmg=+(d.b.dmg*(1+0.08*u.guns)*CBON.cannons[t.guns]*(1+0.05*v)).toFixed(1);d.hp=fRep(d)?0:clamp(Math.round(r*d.maxHp),0,d.maxHp);}
function fSpd(d){const t=FTYPES[d.type];return t.spd*(1+0.03*((d.fu&&d.fu.sails)|0))*CBON.sails[(d.ft&&d.ft.sails)|0];}
function fRel(d){return 3.2*(1-0.04*fvl(d))*[1,0.97,0.94,0.9][(d.ft&&d.ft.guns)|0];}
function fRepMin(d){fBase(d);let t=0,u=0;for(const k in FUP){t+=d.ft[k];u+=d.fu[k];}return clamp(5+fsz(d)+0.4*t+0.15*u,5,10);}
function fUpCost(d,k){const L=d.fu[k];if(L>=FUMAX)return null;const sk=1+0.35*fsz(d);return{g:Math.round(FUP[k][3]*sk*Math.pow(1.6,L)),res:{[FUP[k][2]]:3*(L+1)},lvl:L>=3?20:1};}
function fRefitCost(d,k){const t=d.ft[k]+1;const c=craftCost(FCMAP[k],t);if(!c)return null;const res={};for(const r in c.res)res[r]=Math.ceil(c.res[r]*0.6);return{t,res,g:Math.round(c.g*0.5),mat:c.mat,lvl:c.lvl};}
function fRefitCh(d,k){const t=d.ft[k]+1;if(!CTIER[t])return 0;return Math.min(1,CTIER[t].ch+((d.fp[k]|0)*0.12)+crewEff('carpenter')*0.01);}
function fRushCost(d){if(!fRep(d))return null;const left=(d.rep-Date.now())/((d.rept||fRepMin(d)*60000));const z=fsz(d);return{g:Math.ceil((200+0.8*d.maxHp)*clamp(left,0.15,1)*mk()),res:{wood:2+Math.ceil(2*z),iron:1+Math.ceil(2*z)}};}
function fleetLayUp(d){fBase(d);const ms=Math.round(fRepMin(d)*60000);d.rep=Date.now()+ms;d.rept=ms;d.hp=0;d.unpaid=0;S.cst.layup=(S.cst.layup|0)+1;
 toast(`⚓ ${d.name} went down — her crew is fished out and she's towed to the shipyard. Under repair for ${Math.round(ms/60000)} min.`);showTip('layup');}
function fUpgrade(id,k){const d=S.fleet.find(x=>x.id==id);if(!d||!FUP[k]||fRep(d))return;fBase(d);const c=fUpCost(d,k);if(!c||S.gold<c.g||!resOk(c.res)||S.clvl<c.lvl)return;
 S.gold-=c.g;resPay(c.res);d.fu[k]++;fRecalc(d);chime();toast(`🔧 ${d.name}: ${FUP[k][1]} Lv${d.fu[k]}`);}
function fRefit(id,k){const d=S.fleet.find(x=>x.id==id);if(!d||!FUP[k]||fRep(d)||!PORTS[curPort]||!PORTS[curPort].haven)return;fBase(d);const c=fRefitCost(d,k);if(!c||S.gold<c.g||!resOk(c.res)||!matOk(c.mat)||S.clvl<c.lvl)return;
 const ch=fRefitCh(d,k);S.gold-=c.g;resPay(c.res);if(Math.random()<ch){matPay(c.mat);d.ft[k]=c.t;d.fp[k]=0;fRecalc(d);chime();toast(`🔨 ${d.name}: ${CT[c.t][0]} ${FUP[k][1].toLowerCase()} fitted!`);}
 else{d.fp[k]=(d.fp[k]|0)+1;S.gold+=Math.round(c.g*0.75);boom(0.3,0);toast(`💥 ${d.name}'s ${CT[c.t][0].toLowerCase()} refit failed — materials ruined, 75% of the fee refunded. (+12% next time)`);}}
function fRush(id){const d=S.fleet.find(x=>x.id==id);if(!d)return;const c=fRushCost(d);if(!c||S.gold<c.g||!resOk(c.res))return;S.gold-=c.g;resPay(c.res);fDone(d);chime();}
function fDone(d){d.rep=0;d.rept=0;fRecalc(d);d.hp=d.maxHp;if(state==='play'||state==='port')syncFleet();toast(`⚓ ${d.name} is repaired and rejoins your fleet.`);}
function fleetTickD(){if(!S||!Array.isArray(S.fleet))return;for(const d of S.fleet)if(d.rep>0&&!fRep(d)){fDone(d);if(state==='port'&&tab==='fleet')renderPort();}
 if(state==='port'&&tab==='fleet')for(const el of document.querySelectorAll('[data-frep]')){const d=S.fleet.find(x=>x.id==el.dataset.frep);if(d)el.textContent=fRepTxt(d);}}
setInterval(()=>{try{fleetTickD();}catch(e){}},1000);
function fRepTxt(d){const s=Math.max(0,Math.ceil((d.rep-Date.now())/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function fleetSunkD(e){if(e.tut)return;const xp=6+e.lvl*2*(e.kind==='boss'||e.lead?3:1);let up=0;for(const f of fleet){if(f.sinking||!f.d||fRep(f.d))continue;if(Math.hypot(f.x-P.x,f.y-P.y)>1100)continue;const d=f.d;const v0=fvl(d);d.fx=(d.fx||0)+xp;if(fvl(d)>v0){fRecalc(d);up=1;toast(`🎖️ ${d.name} is now ${VN[fvl(d)]} (+${fvl(d)*4}% hull, +${fvl(d)*5}% damage).`);}}}
function fleetMigrateD(d){for(const x of S.fleet){fBase(x);fRecalc(x);}}
let fSel=0;
function fleetCards(p){if(!S.fleet.length)return'';if(!S.fleet.some(d=>d.id===fSel))fSel=S.fleet[0].id;let h='';
 for(const d of S.fleet){fBase(d);const t=FTYPES[d.type],v=fvl(d),rep=fRep(d),sel=d.id===fSel;const hpP=rep?0:Math.round(d.hp/d.maxHp*100);
  const st=rep?`<b style="color:#a12a1d">🔧 Under repair — <span data-frep="${d.id}">${fRepTxt(d)}</span></b>`:d.hp<d.maxHp?`<b style="color:#8a5a12">Damaged ${hpP}%</b>`:`<b style="color:#2f6b2a">Ready</b>`;
  const tiers=Object.keys(FUP).map(k=>d.ft[k]?`<span style="color:${CT[d.ft[k]][1]}">●</span>`:'').join('');
  h+=`<div class="item" style="flex-direction:column;align-items:stretch;gap:4px;${sel?'border:1.5px solid #8a6a2a':''}"><div style="display:flex;align-items:center;gap:6px"><div style="flex:1;min-width:0" data-act="fsel" data-arg="${d.id}"><b>${t.icon} ${esc(d.name)}</b> <small style="display:inline">${t.name} • ${VN[v]}${tiers?' '+tiers:''}</small><br><small>${st}</small></div>${sel?'':btn('fsel','▾',true,d.id,'sell')}</div>`;
  h+=`<div style="height:6px;background:rgba(0,0,0,.18);border-radius:3px;overflow:hidden"><div style="height:100%;width:${hpP}%;background:${hpP>60?'#5f8f4a':hpP>30?'#c08a2a':'#a33a2a'}"></div></div>`;
  h+=`<small>❤️ ${rep?0:Math.ceil(d.hp)}/${d.maxHp} • 💣 ${d.cannons}/side • dmg ${d.dmg} • reload ${fRel(d).toFixed(1)}s • speed ${Math.round(fSpd(d)*100)}% • wage ${d.wage}💰/min${rep?' (paused)':''}</small>`;
  if(sel){h+=`<small>🎖️ ${VN[v]}${v<4?` — ${Math.floor(d.fx)}/${VT[v+1]} XP to ${VN[v+1]}`:' (max)'} • earns XP when ships are sunk near her</small>`;
   const miss=Math.max(0,d.maxHp-Math.ceil(d.hp)),c=Math.ceil(miss*0.6*mk());let b='';
   if(rep){const r=fRushCost(d);b+=btn('frush',`⚡ Rush ${r.g}💰 ${resTxt(r.res)}`,S.gold>=r.g&&resOk(r.res),d.id);}else b+=btn('frep',miss>0?`Repair ${c}💰`:'✓ Fit',miss>0&&S.gold>=c,d.id);
   b+=btn('fren','✏️',true,d.id,'sell')+btn('fdis',fDisArm===d.id?'Sure?':'Dismiss',true,d.id,'red');h+=`<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${b}</div>`;
   for(const k in FUP){const u=d.fu[k],c=fUpCost(d,k);const dots='▰'.repeat(u)+'▱'.repeat(FUMAX-u);
    h+=row(`${FUP[k][0]} ${FUP[k][1]} <small style="display:inline">${dots}</small>`,`${FUP[k][4]} per level${c?` • next: ${c.g}💰 ${resTxt(c.res)}${S.clvl<c.lvl?` • needs Lv${c.lvl}`:''}`:' • MAX'}`,c?btn('fup','Upgrade',!rep&&S.gold>=c.g&&resOk(c.res)&&S.clvl>=c.lvl,d.id+':'+k):'');
    const r=fRefitCost(d,k),tt=d.ft[k];
    h+=row(`&nbsp;&nbsp;↳ Refit <span style="color:${CT[tt][1]}">● ${CT[tt][0]}</span>`,r?`➜ <b>${CT[r.t][0]}</b>: ${resTxt(r.res)}${matTxt(r.mat)} + ${r.g}💰 • success <b>${Math.round(fRefitCh(d,k)*100)}%</b>${S.clvl<r.lvl?` • needs Lv${r.lvl}`:''}${p.haven?'':' • havens only'}`:'Legendary (MAX)',r?btn('fref','Refit',!rep&&p.haven&&S.gold>=r.g&&resOk(r.res)&&matOk(r.mat)&&S.clvl>=r.lvl,d.id+':'+k):'');}}
  h+='</div>';}return h;}
GPORT.push((act,arg)=>{if(act==='fsel'){fSel=+arg;return true;}if(act==='fup'){const [i,k]=String(arg).split(':');fUpgrade(i,k);return true;}if(act==='fref'){const [i,k]=String(arg).split(':');fRefit(i,k);return true;}if(act==='frush'){fRush(arg);return true;}return false;});
Object.assign(TIPS,{layup:"⚓ <b>Ships aren't lost.</b> A fleet ship that sinks is towed to the shipyard and laid up for a few minutes. Check the ⛵ Fleet tab in port — you can pay to rush the repair."});
ACH.push(['fleetElite','🎖️','Old Salts','Raise a fleet ship to Elite veterancy',()=>(S.fleet||[]).some(d=>fvl(d)>=4)],['fleetLeg','🏅','Flagship\'s Pride','Give a fleet ship a Legendary refit',()=>(S.fleet||[]).some(d=>d.ft&&Object.values(d.ft).some(t=>t>=3))]);
GH.sunk.push(fleetSunkD);GH.mig.push(fleetMigrateD);
