// ================= GRIND II: weather & day/night, fishing & salvage diving, codex =================
const DAYLEN=480;
function wxOn(){return S.clvl>=3&&!T.on;}
function dayPhase(){return((S.playTime||0)%DAYLEN)/DAYLEN;}
function wxDark(){if(!wxOn())return 0;const p=dayPhase();if(p<0.55)return 0;if(p<0.65)return(p-0.55)/0.1;if(p<0.92)return 1;return 1-(p-0.92)/0.08;}
function wxNight(){return wxDark()>0.6;}
const WX={k:'clear',t:150,dur:150,wave:null,wt:12,lt:0,ltT:6,rain:null};
function wxI(){if(WX.k==='clear'||!wxOn())return 0;return clamp(Math.min((WX.dur-WX.t)/6,WX.t/6),0,1);}
function wxFog(){return WX.k==='fog'&&wxI()>0.5;}
function wxStorm(){return WX.k==='storm'&&wxI()>0.3;}
function wxSet(k,d){WX.k=k;WX.dur=WX.t=d||(k==='clear'?rand(100,200):k==='fog'?rand(80,140):rand(70,120));WX.wave=null;WX.wt=k==='storm'?rand(8,14):99;
 if(k==='fog'){toast('🌫️ Fog rolls in — foes spot you later, but you see less.');showTip('fog');}else if(k==='storm'){toast('⛈️ A storm is brewing! Rogue waves — turn your bow into them.');showTip('storm');}}
const CMP=['E','SE','S','SW','W','NW','N','NE'];const cmpOf=a=>CMP[((Math.round(((a%TAU)+TAU)%TAU/(TAU/8)))%8)];
function wxTick(dt){if(!wxOn()){return;}WX.t-=dt;
 if(WX.t<=0){if(WX.k!=='clear')wxSet('clear');else{const far=havenDist(P.x,P.y)>2600||!!regionAt(P.x,P.y);const r=Math.random();wxSet(r<(far?0.32:0.14)?'storm':r<(far?0.55:0.36)?'fog':'clear');}}
 const dk=wxDark();if(dk>0.6&&!S.tips.night)showTip('night');
 // stealth: night and fog shrink how far hostile ships notice you
 const vk=clamp(1-0.3*dk-(WX.k==='fog'?0.35*wxI():0)-(WX.k==='storm'?0.1*wxI():0),0.45,1);
 for(const e of enemies){if(e.kind==='navy'||e.kind==='merchant'||e.tut)continue;if(e.ag0==null)e.ag0=e.aggro||0;e.aggro=e.ag0*vk;}
 if(WX.k==='storm'&&state==='play'){const i=wxI();const g=28*i*dt*(typeof thrEff==='function'&&thrEff()<0.05&&P.boost<=0?0.12:1);P.vx+=Math.cos(wind.dir)*g;P.vy+=Math.sin(wind.dir)*g;
  WX.ltT-=dt;if(WX.ltT<=0){WX.ltT=rand(6,14);WX.lt=1;setTimeout(()=>boom(0.18*i,40),400+Math.random()*900);}
  if(!WX.wave&&i>0.6){WX.wt-=dt;if(WX.wt<=0){WX.wt=rand(16,28);const a=wind.dir+rand(-0.4,0.4);WX.wave={a,x:P.x-Math.cos(a)*1050,y:P.y-Math.sin(a)*1050,v:300,life:9,hit:{}};
   toast(`🌊 Rogue wave from the ${cmpOf(a+Math.PI)}! Turn your bow into it!`);boom(0.25,30);}}}
 WX.lt=Math.max(0,WX.lt-dt*2.5);
 const w=WX.wave;if(w){const c=Math.cos(w.a),s=Math.sin(w.a);const step=w.v*dt;
  const hitTest=(o)=>{const d=(o.x-w.x)*c+(o.y-w.y)*s,pp=Math.abs(-(o.x-w.x)*s+(o.y-w.y)*c);return d>0&&d<=step&&pp<720;};
  if(!P.dead&&state==='play'&&!w.hit.p&&hitTest(P)){w.hit.p=1;const ad=Math.abs(angDiff(P.h,w.a+Math.PI)),as=Math.abs(angDiff(P.h,w.a));let k,msg;
   if(ad<0.7){k=0.03;msg='🌊 Bow into the wave — she rides it out!';S.cst.waveOk=(S.cst.waveOk|0)+1;}else if(as<0.7){k=0.07;msg='🌊 The wave lifts your stern and surfs you forward.';P.vx+=c*160;P.vy+=s*160;}
   else{k=0.15;msg='🌊 Broadside! The rogue wave smashes over your deck!';P.vx+=c*240;P.vy+=s*240;P.h+=angDiff(P.h,w.a)*0.4;if(S.roster&&Math.random()<0.35)crewHurt(false);}
   damagePlayer(ST.maxHp*k*(1+0.4*threat()));cam.shake=Math.max(cam.shake,k>0.1?16:6);toast(msg);grindEv('wave',{k});}
  for(const e of enemies){if(e.sinking||e.tut||w.hit[e.id||(e.id='w'+Math.random())])continue;if(hitTest(e)){w.hit[e.id]=1;const dm=e.maxHp*(e.keep||e.kind==='boss'?0.04:0.12);damageEnemy(e,Math.min(dm,Math.max(1,e.hp-1)));e.vx+=c*200;e.vy+=s*200;}}
  w.x+=c*step;w.y+=s*step;w.life-=dt;if(w.life<=0)WX.wave=null;}}
function grindLootW(){return(wxNight()?1.25:1)*(wxStorm()?1.1:1)*(codexSet('art')?1.1:1);}
{const _lk=grindLootK;grindLootK=function(){return _lk()*grindLootW();};}
// ---- drawing (screen space; cheap: a few gradients + one batched path) ----
const WSX=x=>(x-cam.x)*zoom+vw/2,WSY=y=>(y-cam.y)*zoom+vh/2;
function wxDraw(ts){if(state==='title')return;const dk=wxDark(),i=wxI(),px=WSX(P.x),py=WSY(P.y);
 if(WX.k==='storm'&&i>0){ctx.fillStyle=`rgba(16,20,26,${0.3*i})`;ctx.fillRect(0,0,vw,vh);
  ctx.strokeStyle=`rgba(190,200,212,${0.32*i})`;ctx.lineWidth=1.1;ctx.beginPath();const n=Math.round(70*i),wx=Math.cos(wind.dir)*7;
  for(let k=0;k<n;k++){const h=hash(k,7)>>>0;const x=((h%997)/997*vw+ts*60*(1+k%3))%vw,y=(((h>>>10)%991)/991*vh+ts*(520+(k%5)*60))%vh;ctx.moveTo(x,y);ctx.lineTo(x+wx,y+16);}ctx.stroke();}
 if(WX.k==='fog'&&i>0){const R=(300+16*crewEff('lookout'))*zoom;const g=ctx.createRadialGradient(px,py,R*0.35,px,py,R*1.55);g.addColorStop(0,'rgba(178,186,192,0)');g.addColorStop(1,`rgba(170,178,186,${0.82*i})`);ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);
  ctx.fillStyle=`rgba(200,206,212,${0.07*i})`;for(let k=0;k<2;k++){const x=(vw*0.5+Math.sin(ts*0.05+k*1.7)*vw*0.6),y=vh*(0.3+0.4*k)+Math.cos(ts*0.07+k)*40;ctx.beginPath();ctx.ellipse(x,y,vw*0.55,90,0,0,TAU);ctx.fill();}}
 if(dk>0.01){const R=(250+14*crewEff('lookout'))*zoom;
  ctx.fillStyle='rgba(255,186,96,0.85)';for(const e of enemies){if(e.sinking)continue;const x=WSX(e.x),y=WSY(e.y);if(x<-20||y<-20||x>vw+20||y>vh+20)continue;const bx=x-Math.cos(e.h)*e.len*0.38*zoom,by=y-Math.sin(e.h)*e.len*0.38*zoom;ctx.globalAlpha=0.25*dk;ctx.beginPath();ctx.arc(bx,by,9,0,TAU);ctx.fill();ctx.globalAlpha=0.9*dk;ctx.beginPath();ctx.arc(bx,by,2.4,0,TAU);ctx.fill();}ctx.globalAlpha=1;
  const g=ctx.createRadialGradient(px,py,R*0.25,px,py,R*1.5);g.addColorStop(0,`rgba(4,9,26,${0.28*dk})`);g.addColorStop(1,`rgba(2,5,16,${0.86*dk})`);ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);
  ctx.fillStyle='rgba(255,196,110,0.9)';const bx=px-Math.cos(P.h)*ST.len*0.38*zoom,by=py-Math.sin(P.h)*ST.len*0.38*zoom;ctx.globalAlpha=0.3*dk;ctx.beginPath();ctx.arc(bx,by,14,0,TAU);ctx.fill();ctx.globalAlpha=1;}
 if(WX.lt>0){ctx.fillStyle=`rgba(225,232,255,${0.42*WX.lt*WX.lt})`;ctx.fillRect(0,0,vw,vh);}
 const w=WX.wave;if(w){const c=Math.cos(w.a),s=Math.sin(w.a);const ax=WSX(w.x-s*720),ay=WSY(w.y+c*720),bx=WSX(w.x+s*720),by=WSY(w.y-c*720);
  ctx.lineCap='round';ctx.strokeStyle='rgba(20,34,44,0.55)';ctx.lineWidth=26*zoom;ctx.beginPath();ctx.moveTo(ax-c*14*zoom,ay-s*14*zoom);ctx.lineTo(bx-c*14*zoom,by-s*14*zoom);ctx.stroke();
  ctx.strokeStyle='rgba(226,236,240,0.85)';ctx.lineWidth=9*zoom;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.lineCap='butt';
  const d=(P.x-w.x)*c+(P.y-w.y)*s;if(d>0&&!w.hit.p){const blink=0.55+0.45*Math.sin(ts*12);const a=w.a+Math.PI;const ex=vw/2+Math.cos(a)*Math.min(vw*0.42,170),ey=vh/2+Math.sin(a)*Math.min(vh*0.3,200);
   ctx.save();ctx.globalAlpha=blink;ctx.translate(ex,ey);ctx.rotate(w.a);ctx.fillStyle='#e8eef2';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-8,-11);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.restore();
   ctx.font='bold 12px sans-serif';ctx.fillStyle=`rgba(232,238,242,${blink})`;ctx.fillText(`🌊 ${Math.max(0,Math.round(d/w.v*10)/10).toFixed(1)}s`,ex,ey+24);}}
 // wrecks: bubbles over salvage sites near you
 if(state==='play'||state==='mini'){for(const r of wrecks()){const d=Math.hypot(r.x-P.x,r.y-P.y);if(d>1100)continue;const x=WSX(r.x),y=WSY(r.y);if(x<-30||y<-30||x>vw+30||y>vh+30)continue;const fresh=diveFresh(r);
  ctx.fillStyle=fresh?'rgba(220,240,248,0.75)':'rgba(220,240,248,0.25)';for(let k=0;k<5;k++){const ph=(ts*0.6+k*0.2)%1;ctx.beginPath();ctx.arc(x+Math.sin(ts*2+k*2)*6+(k-2)*5,y-ph*26*zoom,1.4+2*(1-ph),0,TAU);ctx.fill();}
  if(fresh&&d<700){ctx.font='14px serif';ctx.globalAlpha=0.8;ctx.fillText('⚓',x,y+12);ctx.globalAlpha=1;}}}
 // HUD chip: time of day & weather (under the wind gauge)
 if(state==='play'&&wxOn()){const m=miniRect();const p=dayPhase();const tod=dk>0.6?'🌙 Night':p>=0.55&&p<0.65?'🌇 Dusk':p>=0.92?'🌅 Dawn':'☀️ Day';const wk=WX.k==='storm'?' ⛈️':WX.k==='fog'?' 🌫️':'';
  ctx.fillStyle='rgba(10,25,40,0.55)';ctx.fillRect(m.x,m.y+m.s+30,m.s,18);ctx.font='bold 10.5px sans-serif';ctx.fillStyle='#e9e2cf';ctx.fillText(tod+wk+(dk>0.6?' +25%💰':''),m.x+m.s/2,m.y+m.s+43);}}
// ---- codex ----
const SHIPCX=[['pirate','🏴‍☠️','Pirate sloop',e=>e.kind==='pirate'&&!e.cls],['merchant','⚖️','Merchantman',e=>e.kind==='merchant'],['navy','⚓','Navy cutter',e=>e.kind==='navy'&&!e.cls&&!e.lev],['clan','🏴','Clan raider',e=>e.kind==='clan'],
 ['frigate','⛵','Frigate',e=>e.cls==='frigate'],['galleon','🚢','Galleon',e=>e.cls==='galleon'],['iron','🛡️','Ironclad',e=>e.cls==='iron'],['vet','🎖️','Veteran captain',e=>e.vet&&!e.elite],['elite','💀','Elite captain',e=>e.elite],
 ['boss','☠️','Wanted captain',e=>e.kind==='boss'&&!e.leg&&!e.eb],['leg','🐉','Legendary bounty',e=>e.leg],['admiral','👻','The Drowned Admiral',e=>e.eb==='admiral'],['kraken','🐙','The Kraken',e=>e.eb==='kraken']];
const FISH=[['sardine','🐟','Silver sardine',0,'any',12],['mackerel','🐟','Spotted mackerel',0,'any',18],['snapper','🐠','Red snapper',1,'any',40],['grouper','🐡','Reef grouper',1,'near',55],
 ['tuna','🐟','Bluefin tuna',2,'far',140,{canvas:2}],['marlin','🗡️','Blue marlin',2,'far',220,{parts:1}],['eel','🐍','Moray eel',1,'night',70],['squid','🦑','Giant squid',2,'night',180,{ink:1}],
 ['lantern','🏮','Lanternfish',2,'night',160,{parts:1}],['ray','⚡','Stormray',3,'storm',420,{parts:2}],['ghost','👻','Ghost carp',3,'fog',380,{rel:1}],['spawn','🐙','Kraken spawn',3,'far',600,{iw:1}]];
const ART=[['coin','🪙','Cursed doubloon',0],['comp','🧭','Conquistador compass',0],['bell','🔔','Brass ship\'s bell',0],['idol','🗿','Jade idol',0],['spy','🔭','Admiral\'s spyglass',0],['pistol','🔫','Silver flintlock',0],['astro','✴️','Brass astrolabe',0],['chal','🏆','Golden chalice',0],
 ['skull','💀','Crystal skull',1],['crown','👑','Drowned crown',1],['map','🗺️','Map of the Abyss',1],['pearl','⚫','Black pearl',1]];
const CXCAT={ships:['⚔️','Ships sunk',SHIPCX,'+5% cannon damage'],fish:['🎣','Fish',FISH,'+5% sailing speed'],art:['🏺','Artifacts',ART,'+10% plunder gold'],crew:['🧑‍🤝‍🧑','Legendary crew',RARECREW.map(c=>[c.id,CREWR[c.r][0],c.n]),'+1 crew bunk']};
const cxList=c=>CXCAT[c][2];
function cxHave(c){const o=S.codex&&S.codex[c];if(!o)return 0;return cxList(c).filter(x=>o[x[0]||x.id]).length;}
function codexSet(c){return !!(S.codex&&CXCAT[c]&&cxHave(c)>=cxList(c).length);}
function codexAdd(c,id,n){if(!S.codex||!S.codex[c]||!cxList(c).some(x=>(x[0]||x.id)===id))return;const o=S.codex[c];const was=codexSet(c);const first=!o[id];o[id]=(o[id]|0)+(n||1);
 if(first){const it=cxList(c).find(x=>(x[0]||x.id)===id);setTimeout(()=>toast(`📚 New codex entry: ${it[1]} ${it[2]} (${cxHave(c)}/${cxList(c).length} ${CXCAT[c][1].toLowerCase()})`),1500);showTip('codex');}
 if(!was&&codexSet(c)){setTimeout(()=>toast(`📚 Collection complete — ${CXCAT[c][1]}! Set bonus: ${CXCAT[c][3]}`),3200);recalc();}}
function codexRecalc(){if(!S.codex)return;if(codexSet('ships'))ST.dmg*=1.05;if(codexSet('fish'))ST.maxSpeed*=1.05;}
function codexHTML(){let tot=0,have=0;for(const c in CXCAT){tot+=cxList(c).length;have+=cxHave(c);}
 let h=`<div class="note">📚 <b>Captain's Codex</b> — ${have}/${tot} entries. Complete a whole collection for a permanent set bonus.</div>`;
 for(const c in CXCAT){const C=CXCAT[c],n=cxHave(c),L=cxList(c),done=n>=L.length;
  h+=`<h3>${C[0]} ${C[1]} — ${n}/${L.length}</h3><div class="note">Set bonus: <b>${C[3]}</b> ${done?'✅ active':'🔒'}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:4px 0 10px">`;
  for(const x of L){const id=x[0]||x.id,k=(S.codex[c]||{})[id]|0;const hint=c==='fish'?({any:'any water',near:'near the havens',far:'outer waters',night:'at night',storm:'in storms',fog:'in fog'})[x[4]]:c==='art'?(x[3]?'deep wrecks':'wrecks'):c==='crew'?RCI[id].p:'sink one';
   h+=`<div style="background:${k?'rgba(255,248,230,.75)':'rgba(60,50,40,.12)'};border:1px solid rgba(90,70,40,.25);border-radius:5px;padding:5px 3px;text-align:center;font-size:11px;line-height:1.25">${k?`<div style="font-size:20px">${x[1]}</div><b>${esc(x[2])}</b>${c!=='crew'?`<br>×${k}`:''}`:`<div style="font-size:20px;opacity:.35">❔</div><span style="opacity:.6">${hint}</span>`}</div>`;}
  h+='</div>';}return h;}
// ---- minigame panel ----
let MG=null;
(function(){const st=document.createElement('style');st.textContent=`#mini{position:fixed;inset:0;z-index:44;display:flex;align-items:flex-end;justify-content:center;background:linear-gradient(rgba(0,0,0,0) 20%,rgba(0,0,0,.7));touch-action:none;user-select:none;-webkit-user-select:none}
#mini.hidden{display:none}#mini .mbox{width:min(520px,calc(100vw - 16px));margin:0 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#22303a,#10181e);border:1px solid rgba(150,170,180,.45);border-radius:6px;box-shadow:0 10px 34px rgba(0,0,0,.75);color:#dfe6e8;padding:10px 12px;font-family:Georgia,serif}
#mini h4{margin:0 0 4px;font-size:15px;color:#e9dcc0}#mini .mt{font-size:12.5px;opacity:.85;min-height:34px}#mini canvas{width:100%;display:block;border-radius:4px;margin:6px 0;background:#0b141a}
#mini .mb{display:flex;gap:8px}#mini button{flex:1;font:bold 15px sans-serif;padding:13px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:#3b5560;color:#fff}#mini button.hl{background:#7a5a2a}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='mini';d.className='hidden';d.innerHTML='<div class="mbox"><h4 id="mgT"></h4><div class="mt" id="mgD"></div><canvas id="mgC" width="640" height="300"></canvas><div class="mb" id="mgB"></div></div>';document.body.appendChild(d);
 const C=d.querySelector('#mgC');const down=ev=>{if(!MG)return;ev.preventDefault();MG.hold=true;if(MG.k==='dive'){const r=C.getBoundingClientRect();const t=ev.touches?ev.touches[0]:ev;diveTap((t.clientX-r.left)/r.width*640,(t.clientY-r.top)/r.height*300);}};const up=()=>{if(MG)MG.hold=false;};
 C.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
 d.querySelector('#mgB').addEventListener('pointerdown',ev=>{const b=ev.target.closest('button');if(!b||!MG)return;ev.preventDefault();if(b.dataset.a==='reel'){MG.hold=true;}else if(b.dataset.a==='close')mgEnd(true);});})();
function mgOpen(o){MG=o;MG.last=performance.now();state='mini';P.throttle=0;$('mini').classList.remove('hidden');mgUI();requestAnimationFrame(mgLoop);}
function mgEnd(user){if(!MG)return;const m=MG;MG=null;$('mini').classList.add('hidden');if(state==='mini')state='play';if(m.k==='dive')diveFinish(m,user);}
function mgUI(){const m=MG;if(!m)return;if(m.k==='fish'){$('mgT').textContent='🎣 Fishing';$('mgB').innerHTML='<button data-a="reel" class="hl">🎣 Hold to reel</button><button data-a="close">Cut line</button>';}
 else{$('mgT').textContent=`🤿 Salvage dive — ${m.r.deep?'deep wreck':'wreck'}`;$('mgB').innerHTML='<button data-a="close" class="hl">⬆️ Surface</button>';}}
function mgLoop(t){if(!MG)return;const dt=Math.min(0.05,(t-MG.last)/1000);MG.last=t;if(MG.k==='fish')fishStep(dt);else diveStep(dt);if(MG)mgDraw();if(MG)requestAnimationFrame(mgLoop);}
function mgDraw(){const c=$('mgC').getContext('2d');const m=MG;c.clearRect(0,0,640,300);
 if(m.k==='fish'){const g=c.createLinearGradient(0,0,0,300);g.addColorStop(0,'#16303b');g.addColorStop(1,'#071015');c.fillStyle=g;c.fillRect(0,0,640,300);
  c.strokeStyle='rgba(180,210,220,.12)';c.lineWidth=2;for(let i=0;i<6;i++){c.beginPath();c.moveTo(0,40+i*40+Math.sin(m.t+i)*4);c.bezierCurveTo(200,30+i*40,420,52+i*40,640,40+i*40+Math.cos(m.t+i)*4);c.stroke();}
  const X=v=>30+v*580;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(30,120,580,60);c.fillStyle=m.over?'rgba(160,210,150,.45)':'rgba(220,210,180,.32)';c.fillRect(X(m.z),116,m.w*580,68);c.strokeStyle='rgba(240,230,200,.7)';c.strokeRect(X(m.z),116,m.w*580,68);
  c.font='40px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(m.f[3]>=2?'🐟':'🐟',X(m.fx),150+Math.sin(m.t*7)*4);
  c.fillStyle='rgba(0,0,0,.4)';c.fillRect(30,220,580,18);c.fillStyle=m.prog>0.66?'#8fc48a':m.prog>0.33?'#d8b45a':'#c0563f';c.fillRect(30,220,580*clamp(m.prog,0,1),18);
  c.font='bold 22px sans-serif';c.fillStyle='#e9dcc0';c.fillText(m.f[3]>=3?'Something huge is on the line!':m.f[3]>=2?'A strong fish!':'A bite!',320,60);c.font='18px sans-serif';c.fillStyle='rgba(233,220,192,.75)';c.fillText('Keep the fish inside the pale band',320,270);}
 else{const g=c.createLinearGradient(0,0,0,300);g.addColorStop(0,'#123039');g.addColorStop(1,'#05090b');c.fillStyle=g;c.fillRect(0,0,640,300);
  c.fillStyle='rgba(200,230,240,.05)';for(let i=0;i<5;i++){c.beginPath();c.moveTo(80+i*130+Math.sin(m.t*0.5+i)*20,0);c.lineTo(40+i*130,300);c.lineTo(110+i*130,300);c.fill();}
  c.fillStyle='#2a2a22';c.beginPath();c.moveTo(0,250);for(let x=0;x<=640;x+=40)c.lineTo(x,246+Math.sin(x*0.05)*8);c.lineTo(640,300);c.lineTo(0,300);c.fill();
  c.save();c.translate(330,150);c.rotate(-0.15);c.fillStyle='#3a2c1e';c.fillRect(-170,40,300,46);c.fillStyle='#2b2016';c.fillRect(-60,-70,10,112);c.restore();
  c.textAlign='center';c.textBaseline='middle';for(const s of m.spots){if(s.o){c.font='30px serif';c.fillText(s.it.e,s.x,s.y-8);c.font='bold 15px sans-serif';c.fillStyle='#e9dcc0';c.fillText(s.it.t,s.x,s.y+22);}
   else{c.fillStyle=s.d>0?'#6b5a3a':'#544631';c.beginPath();c.ellipse(s.x,s.y,34,15,0,0,TAU);c.fill();c.fillStyle='rgba(220,240,248,.5)';c.beginPath();c.arc(s.x+Math.sin(m.t*3+s.x)*8,s.y-22-((m.t*30+s.x)%30),3,0,TAU);c.fill();if(s.d>0){c.fillStyle='#e9dcc0';c.fillRect(s.x-30,s.y+20,60*(1-s.d/0.5),5);}}}
  c.fillStyle='rgba(0,0,0,.5)';c.fillRect(20,16,600,16);c.fillStyle=m.air>40?'#7fb2e6':m.air>20?'#d8b45a':'#c0563f';c.fillRect(20,16,Math.min(600,6*Math.max(0,m.air)),16);c.font='bold 13px sans-serif';c.fillStyle='#fff';c.fillText(`AIR ${Math.max(0,Math.round(m.air))}%`,320,25);}}
// ---- fishing ----
let fishCd=0;
function fishPool(){const far=havenDist(P.x,P.y)>2600||!!regionAt(P.x,P.y),near=havenDist(P.x,P.y)<1800;const nt=wxNight(),fg=wxFog(),sm=wxStorm();
 return FISH.filter(f=>f[4]==='any'||(f[4]==='near'&&near)||(f[4]==='far'&&far)||(f[4]==='night'&&nt)||(f[4]==='fog'&&fg)||(f[4]==='storm'&&sm));}
function fishRoll(){const pool=fishPool(),ang=crewEff('angler')+(S.off&&S.off.ca?1:0);const W=[60,28,10,4];let tot=0;const ws=pool.map(f=>{const w=W[f[3]]*(f[3]>=2?1+0.1*ang:1);tot+=w;return w;});let r=Math.random()*tot;for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i];}return pool[0];}
function fishStart(){if(fishCd>0)return;const f=fishRoll();const ang=crewEff('angler');mgOpen({k:'fish',f,t:0,z:0.35,zv:0,w:clamp(0.24-f[3]*0.035+ang*0.008+((S.bmb&&S.bmb.rod)?0.05:0),0.1,0.34),fx:0.5,ft:0,tx:0.5,prog:0.3,hold:false,over:false});
 $('mgD').innerHTML=`Hold <b>Reel</b> (or press on the water) to lift the band, release to let it drift back. ${ang?'Your angler steadies the line.':''}`;showTip('fish');}
function fishStep(dt){const m=MG;m.t+=dt;const r=m.f[3];m.zv+=(m.hold?1.9:-1.5)*dt;m.zv*=Math.pow(0.35,dt);m.z+=m.zv*dt;if(m.z<0){m.z=0;m.zv=Math.max(0,m.zv)*0.3;}if(m.z>1-m.w){m.z=1-m.w;m.zv=Math.min(0,m.zv)*0.3;}
 m.ft-=dt;if(m.ft<=0){m.ft=rand(0.5,1.6)/(1+r*0.35);m.tx=rand(0.03,0.97);}m.fx+=(m.tx-m.fx)*Math.min(1,dt*(1.1+r*0.8));
 m.over=m.fx>=m.z&&m.fx<=m.z+m.w;m.prog+=m.over?dt*0.26:-dt*(0.16+0.05*r);if(m.prog>=1)fishCatch(m.f);else if(m.prog<=0){mgEnd();fishCd=3;toast('🎣 It slipped the hook…');}}
function fishCatch(f){mgEnd();fishCd=3;const day=Math.floor((S.playTime||0)/600);if(!S.fishN||S.fishN.d!==day)S.fishN={d:day,n:0};S.fishN.n++;const tired=S.fishN.n>30?0.4:1;
 const g=Math.round(f[5]*(1+0.04*crewEff('angler'))*tired*(1+0.02*S.clvl));S.gold+=g;S.earned+=g;codexAdd('fish',f[0]);S.cst.fish=(S.cst.fish|0)+1;let extra='';
 if(f[6])for(const k in f[6]){if(RES[k])resGain(k,f[6][k],null,null,true);else matGain(k,f[6][k]);extra+=` +${f[6][k]}${(RES[k]||MATS[k])[0]}`;}
 if(Math.random()<0.12){const k=pick(['wood','canvas']);resGain(k,2,null,null,true);extra+=` +2${RES[k][0]} (tangled net)`;}
 for(const m of S.roster||[])if(m.r==='angler'&&crewOn(m))m.xp+=10+f[3]*15;chime();toast(`🎣 Caught a ${f[1]} ${f[2]}! +${g}💰${extra}${tired<1?' (the fish are wary today)':''}`);grindEv('fish',{f:f[0],r:f[3]});}
// ---- salvage diving ----
let WRK=null;
function wrecks(){if(WRK)return WRK;WRK=[];const r=rng(424242);let n=0;while(WRK.length<20&&n<600){n++;const x=600+r()*(WORLD-1200),y=600+r()*(WORLD-1200);if(inAnyIsland(x,y,160))continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<600))continue;if(WRK.some(w=>Math.hypot(w.x-x,w.y-y)<1400))continue;WRK.push({id:WRK.length,x,y,deep:havenDist(x,y)>2800||!!regionAt(x,y)});}return WRK;}
function diveFresh(r){return((S.dive||{})[r.id]|0)!==Math.floor((S.playTime||0)/600)+1;}
function wreckNear(){for(const r of wrecks())if(Math.hypot(r.x-P.x,r.y-P.y)<170)return r;return null;}
function diveLoot(r){const R=Math.random(),dv=crewEff('diver');const lv=1+S.clvl/12;const a=ART.filter(x=>r.deep||!x[3]);
 if(R<(r.deep?0.16:0.08)+dv*0.006){const x=pick(a);return{e:x[1],t:x[2].split(' ').pop(),art:x[0]};}if(R<0.3){const k=pick(['wood','iron','canvas']);const n=2+((Math.random()*4)|0);return{e:RES[k][0],t:'+'+n,res:k,n};}
 if(R<0.42&&r.deep||R<0.36)return{e:'⚙️',t:'+1',res:'parts',n:1};if(R<0.52)return{e:'🐍',t:'Eel!',eel:1};if(R<0.62)return{e:'🫧',t:'silt',none:1};const g=Math.round(rand(60,220)*lv*(r.deep?1.6:1));return{e:'💰',t:'+'+g,g};}
function diveStart(r){if(!diveFresh(r)){toast('🤿 This wreck is picked clean. The currents will uncover more next sea-day.');return;}const dv=crewEff('diver');const sp=[];
 for(let i=0;i<7;i++){let x,y,k=0;do{x=rand(60,580);y=rand(90,235);k++;}while(k<40&&sp.some(s=>Math.hypot(s.x-x,s.y-y)<84));sp.push({x,y,o:0,d:0,it:diveLoot(r)});}
 mgOpen({k:'dive',r,t:0,air:(S.bmb&&S.bmb.helm)?135:100,drain:6/(1+0.08*dv),spots:sp,got:[]});$('mgD').innerHTML=`Tap the silt mounds to dig. Digging costs air — <b>surface before you run out</b>. ${dv?'Your diver knows these waters.':''}`;showTip('dive');}
function diveTap(x,y){const m=MG;if(!m||m.k!=='dive')return;for(const s of m.spots){if(s.o||s.d>0)continue;if(Math.hypot(s.x-x,(s.y-y)*1.6)<46){s.d=0.5;m.air-=9/(1+0.06*crewEff('diver'));return;}}}
function diveStep(dt){const m=MG;m.t+=dt;m.air-=m.drain*dt;for(const s of m.spots)if(s.d>0){s.d-=dt;if(s.d<=0){s.d=0;s.o=1;if(s.it.eel){m.air-=18;toast('🐍 A moray eel lunges from the wreck!');}else if(!s.it.none)m.got.push(s.it);}}
 if(m.air<=0){toast('🫁 Out of air — your crew hauls you up!');mgEnd();}}
function diveFinish(m,user){S.dive=S.dive||{};S.dive[m.r.id]=Math.floor((S.playTime||0)/600)+1;S.cst.dives=(S.cst.dives|0)+1;let g=0;const parts=[];
 for(const it of m.got){if(it.g)g+=it.g;else if(it.res){resGain(it.res,it.n,null,null,true);parts.push(`+${it.n}${RES[it.res][0]}`);}else if(it.art){const had=(S.codex.art[it.art]|0)>0;codexAdd('art',it.art);if(had){g+=400+S.clvl*20;}parts.push(`${it.e} ${ART.find(a=>a[0]===it.art)[2]}${had?' (duplicate sold)':''}`);}}
 if(g){S.gold+=g;S.earned+=g;parts.unshift(`+${g}💰`);}for(const x of S.roster||[])if(x.r==='diver'&&crewOn(x))x.xp+=25;
 toast(m.got.length?`🤿 Salvage hauled aboard: ${parts.join(' ')}`:'🤿 Nothing but silt this time.');grindEv('dive',{n:m.got.length});}
// ---- action button ----
function grindActLabel(){if(state!=='play'||P.dead||!wxOn())return null;if(grapTgt||boardTgt)return null;for(const e of enemies)if(!e.sinking&&Math.hypot(e.x-P.x,e.y-P.y)<450)return null;const sp=Math.hypot(P.vx,P.vy);const r=wreckNear();if(r&&sp<60)return diveFresh(r)?'🤿 Dive the wreck':null;
 if(sp>18||fishCd>0)return null;for(const e of enemies)if(e.angry&&!e.sinking&&Math.hypot(e.x-P.x,e.y-P.y)<900)return null;if(nearSafePort(P.x,P.y))return null;return'🎣 Cast a line';}
function grindActTap(){const l=grindActLabel();if(!l)return;if(l.startsWith('🤿'))diveStart(wreckNear());else fishStart();}
// ---- hooks ----
function grindTickB(dt){wxTick(dt);if(fishCd>0)fishCd-=dt;}
function grindSunkB(e){if(e.tut)return;for(const x of SHIPCX)if(x[3](e))codexAdd('ships',x[0]);
 if(wxNight()&&Math.random()<0.6){const k=pick(['wood','iron','canvas']);resGain(k,1+((Math.random()*2)|0),e.x,e.y);if(Math.random()<0.12)resGain('parts',1,e.x,e.y);}}
function grindMigrateB(d){const c=(d.codex&&typeof d.codex==='object')?d.codex:{};S.codex={};for(const k in CXCAT){S.codex[k]={};const o=c[k]&&typeof c[k]==='object'?c[k]:{};for(const x of cxList(k)){const id=x[0]||x.id;if(o[id]>0)S.codex[k][id]=o[id]|0;}}
 for(const m of S.roster||[])if(m.rare&&RCI[m.rare])S.codex.crew[m.rare]=1;
 S.dive=(d.dive&&typeof d.dive==='object')?d.dive:{};S.fishN=(d.fishN&&typeof d.fishN==='object')?{d:d.fishN.d|0,n:d.fishN.n|0}:{d:0,n:0};}
Object.assign(TIPS,{night:"🌙 <b>Night falls.</b> Ships see you later and plunder pays <b>+25%</b> — but you see less too. Lookouts widen your sight.",
 fog:"🌫️ <b>Fog.</b> Enemies notice you much later. Rare fish bite in fog.",storm:"⛈️ <b>Storm.</b> Wind shoves your ship and <b>rogue waves</b> roll in — the arrow shows where from. Turn your bow into a wave to ride it out.",
 fish:"🎣 <b>Fishing.</b> Stop your ship in open water to cast a line. Rare fish bite at night, in fog, storms and far waters.",dive:"🤿 <b>Salvage diving.</b> Bubbles mark sunken wrecks. Stop over one to dive; each wreck refills every sea-day.",
 codex:"📚 <b>Codex.</b> New ships, fish, artifacts and legendary crew fill your Codex (menu ➜ Codex). Complete a collection for a set bonus."});
ACH.push(['fish12','🎣','Old Man and the Sea','Catch every kind of fish',()=>codexSet('fish')],['wave10','🌊','Bow to the Storm','Ride out 10 rogue waves bow-first',()=>(S.cst.waveOk|0)>=10],
 ['dive20','🤿','Wreck Diver','Make 20 salvage dives',()=>(S.cst.dives|0)>=20],['cxall','📚','Collector','Complete every Codex collection',()=>Object.keys(CXCAT).every(codexSet)]);
GH.tick.push(grindTickB);GH.sunk.push(grindSunkB);GH.mig.push(grindMigrateB);GH.hud.push(codexRecalc);GH.draw.push(wxDraw);
