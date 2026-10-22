// ---------- SHARKS ----------
const sharks=[],attract=[];
const SHARKZ=[];(function(){const r=rng(777);let t=0;while(SHARKZ.length<5&&t<400){t++;const x=500+r()*(WORLD-1000),y=500+r()*(WORLD-1000),rad=330+r()*250;
 if(Math.hypot(x-START.x,y-START.y)<2400)continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<rad+320))continue;if(SHARKZ.some(z=>Math.hypot(z.x-x,z.y-y)<z.r+rad+400))continue;SHARKZ.push({x,y,r:rad});}})();
function inSharkZone(x,y){for(const z of SHARKZ){const dx=x-z.x,dy=y-z.y;if(dx*dx+dy*dy<z.r*z.r)return z;}return null;}
function sharkWant(){const L=lvlAt(P.x,P.y);let n=L<=1?0:L<=2?2:L<=4?4:L<=6?5:7;if(inSharkZone(P.x,P.y))n+=5;return n;}
function makeShark(x,y,lvl,mega){const hp=mega?520:16+5*lvl;return{kind:'shark',x,y,h:rand(0,TAU),vx:0,vy:0,speed:0,cx:x,cy:y,orb:mega?220:rand(60,140),dir:Math.random()<0.5?1:-1,ph:rand(0,TAU),lvl,mega:!!mega,
 hp,maxHp:hp,len:mega?100:34,wid:mega?30:12,chase:false,angry:false,biteT:rand(1,3),hitT:0,sinking:0,harmless:lvl<=2&&!mega};}
function sharkSpawnTick(){
 for(let i=sharks.length-1;i>=0;i--){const s=sharks[i];if(Math.hypot(s.x-P.x,s.y-P.y)>(s.mega?2600:1900))sharks.splice(i,1);}
 const want=sharkWant();let n=0,mega=null;for(const s of sharks){if(s.mega)mega=s;else n++;}
 if(n<want){for(let k=0;k<8;k++){const a=Math.random()*TAU,d=rand(450,1100);const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
  if(x<100||y<100||x>WORLD-100||y>WORLD-100||inAnyIsland(x,y,40)||PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<420))continue;sharks.push(makeShark(x,y,lvlAt(x,y)));break;}}
 if(!mega&&!tutPeace&&lvlAt(P.x,P.y)>=7&&Math.random()<(inSharkZone(P.x,P.y)?1/60:1/200)){const pt=randomWater(P.x,P.y,900,1300);if(pt){sharks.push(makeShark(pt.x,pt.y,9,true));toast('🦈 Something HUGE is circling out there… a MEGALODON!');}}
 if(!S.tips.shark&&!T.on)for(const s of sharks)if(Math.hypot(s.x-P.x,s.y-P.y)<650){showTip('shark');break;}
 const z=inSharkZone(P.x,P.y);if(z&&z!==lastZone)toast('🦈 Shark-infested waters! Keep your hull patched…');lastZone=z;}
let lastZone=null;
function chum(x,y,t){if(attract.length>6)attract.shift();attract.push({x,y,t:t||18});}
function updateShark(s,dt){if(s.sinking){s.sinking+=dt;return;}
 s.hitT-=dt;s.biteT-=dt;const d=Math.hypot(P.x-s.x,P.y-s.y);let a=null;
 for(const t of attract){const dx=t.x-s.x,dy=t.y-s.y;if(dx*dx+dy*dy<1e6){a=t;break;}}
 const low=P.hp<ST.maxHp*0.35;
 s.chase=!s.harmless&&!P.dead&&(s.mega?d<650:((low&&d<480)||(s.angry&&d<520)));
 let tx,ty,spd;
 if(s.chase){tx=P.x;ty=P.y;spd=s.mega?165:125;}
 else{if(a){const k=Math.min(1,dt*0.8);s.cx+=(a.x-s.cx)*k;s.cy+=(a.y-s.cy)*k;}s.ph+=s.dir*dt*(70/s.orb)*(a?1.6:1);tx=s.cx+Math.cos(s.ph)*s.orb;ty=s.cy+Math.sin(s.ph)*s.orb;spd=a?95:55;}
 s.h+=clamp(angDiff(s.h,Math.atan2(ty-s.y,tx-s.x)),-2.4*dt,2.4*dt);s.speed+=(spd-s.speed)*Math.min(1,dt*1.5);
 s.vx=Math.cos(s.h)*s.speed;s.vy=Math.sin(s.h)*s.speed;const nx=s.x+s.vx*dt,ny=s.y+s.vy*dt;
 if(inAnyIsland(nx,ny,12)){s.ph+=0.8;s.h+=Math.PI*0.6;s.cx=s.x;s.cy=s.y;}else{s.x=nx;s.y=ny;}
 if(s.chase&&state==='play'&&d<(s.mega?75:44)&&s.biteT<=0){s.biteT=s.mega?2:rand(2.5,4);damagePlayer(s.mega?16+0.8*lvlAt(P.x,P.y):2+s.lvl*0.6,true);addText(s.x,s.y-20,s.mega?'💥 CHOMP!!':'🦈 Chomp!','#ff9a9a',true);
  if(S.crew>4&&Math.random()<(s.mega?0.5:0.22)){S.crew--;recalc();addText(P.x-20,P.y-46,'-1 crew 🦈','#ffb3b3');}}}
function damageShark(s,dmg){s.hp-=dmg;s.hitT=0.25;if(!s.harmless)s.angry=true;addText(s.x,s.y-18,'-'+Math.round(dmg),'#ffd27a');
 if(s.hp<=0&&!s.sinking){s.sinking=0.001;const L=s.mega?{gold:Math.round(rand(380,520)),goods:{teeth:10,gems:2}}:{gold:4+3*s.lvl,goods:{teeth:Math.random()<0.3?2:1}};
  loot.push({x:s.x,y:s.y,gold:L.gold,goods:L.goods,t:0});S.infamy+=s.mega?120:2;S.sharks=(S.sharks||0)+1;chum(s.x,s.y,10);
  addText(s.x,s.y-36,s.mega?'🦈 MEGALODON SLAIN!':'🦈 Shark!','#ffd27a',true);if(s.mega){toast('🦈 You slew the Megalodon! Its teeth are worth a fortune.');chime();}save();}}
function drawSharks(x0,x1,y0,y1,ts){for(const s of sharks){if(s.x<x0-60||s.x>x1+60||s.y<y0-60||s.y>y1+60)continue;const k=s.mega?3:1;const a=s.sinking?clamp(1-s.sinking/1.2,0,1):1;
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.h);ctx.globalAlpha=0.3*a;ctx.fillStyle=s.sinking?'#7a1010':'#13232f';ctx.beginPath();ctx.ellipse(0,0,17*k,5.5*k,0,0,TAU);ctx.fill();
  const tw=Math.sin(ts*8+s.ph)*3*k;ctx.beginPath();ctx.moveTo(-15*k,0);ctx.lineTo(-25*k,-6*k+tw);ctx.lineTo(-22*k,tw*0.3);ctx.lineTo(-25*k,6*k+tw);ctx.closePath();ctx.fill();
  if(!s.sinking&&s.speed>30){ctx.globalAlpha=0.45*a;ctx.strokeStyle='#e8f6ff';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(6*k,0);ctx.lineTo(-9*k,-7*k);ctx.moveTo(6*k,0);ctx.lineTo(-9*k,7*k);ctx.stroke();}
  ctx.restore();if(s.sinking){ctx.globalAlpha=1;continue;}
  // fin standing out of the water (drawn upright so it reads as a fin from above)
  const back=Math.cos(s.h)>=0?-1:1;ctx.globalAlpha=a;ctx.fillStyle=s.hitT>0?'#b33':s.chase?'#4a3036':'#33414c';ctx.beginPath();ctx.moveTo(s.x-6*k,s.y+2);ctx.lineTo(s.x+6*k,s.y+2);ctx.quadraticCurveTo(s.x+back*2*k,s.y-6*k,s.x+back*5*k,s.y-13*k);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s.x-9*k,s.y+3);ctx.quadraticCurveTo(s.x,s.y+6,s.x+9*k,s.y+3);ctx.stroke();ctx.globalAlpha=1;}}
// ---------- FLEET ----------
const FTYPES={sloop:{name:'Sloop',icon:'⛵',hp:90,cannons:2,dmg:6,spd:1.12,cost:250,wage:6,len:44,wid:16},brig:{name:'Brigantine',icon:'🚢',hp:170,cannons:3,dmg:8.5,spd:1.05,cost:650,wage:12,len:56,wid:20},prize:{name:'Prize merchant',icon:'📦',spd:1,len:54,wid:20}};
const FNAMES=['Sea Wolf','Black Gull','Red Tide','Salty Dog','Storm Crow','Lucky Meg','Grim Tern',"Kraken's Kiss",'Silver Eel','Night Heron','Rusty Hook','Jolly Jenny'];
const FOFF=[[-95,-80],[-95,80],[-190,-135],[-190,135]];
const fleet=[];
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fleetCap(){return 1+(S.up.command||0);}
function wagesTotal(){let w=0;for(const d of S.fleet)w+=d.wage||0;return w;}
function freeName(){const used=new Set(S.fleet.map(d=>d.name));const n=FNAMES.filter(x=>!used.has(x));return n.length?pick(n):'Ship '+((S.fid||1));}
function cleanFleet(arr){if(!Array.isArray(arr))return[];const out=[];for(const d of arr){if(!d||!FTYPES[d.type])continue;const mh=Math.max(20,+d.maxHp||60);
 out.push({id:+d.id||0,name:String(d.name||'Ship').replace(/[<>&"]/g,'').slice(0,18),type:d.type,lvl:clamp(+d.lvl||1,1,10),maxHp:mh,hp:clamp(+d.hp||mh,0,mh),cannons:clamp(+d.cannons||1,1,6),dmg:clamp(+d.dmg||5,1,40),wage:clamp(+d.wage||4,0,99),unpaid:+d.unpaid||0});if(out.length>=4)break;}return out;}
function fleetEnt(d,x,y,h){const t=FTYPES[d.type];return{kind:'fleet',d,x,y,h,vx:0,vy:0,speed:0,len:t.len,wid:t.wid,cannons:d.cannons,rl:rand(0,1.5),rr:rand(0,1.5),hitT:0,sinking:0,wakeT:0,tgt:null,scanT:0,side:Math.random()<0.5?1:-1};}
function slotPos(i){const o=FOFF[i%4],c=Math.cos(P.h),s=Math.sin(P.h);return{x:P.x+c*o[0]-s*o[1],y:P.y+s*o[0]+c*o[1]};}
function syncFleet(){const old=new Map(fleet.map(f=>[f.d,f]));fleet.length=0;S.fleet.forEach((d,i)=>{let f=old.get(d);if(!f||f.sinking){const p=slotPos(i);f=fleetEnt(d,p.x,p.y,P.h);}fleet.push(f);});}
function placeFleet(){fleet.length=0;syncFleet();}
function updateFleet(dt){const safe=nearSafePort(P.x,P.y);
 for(let i=fleet.length-1;i>=0;i--){const f=fleet[i];if(f.sinking){f.sinking+=dt;f.x+=f.vx*dt*0.3;f.y+=f.vy*dt*0.3;if(f.sinking>2.5)fleet.splice(i,1);continue;}}
 let slot=0;
 for(const f of fleet){if(f.sinking)continue;const i=slot++;f.rl-=dt;f.rr-=dt;f.hitT-=dt;const t=FTYPES[f.d.type];const ms=ST.maxSpeed*t.spd;
  f.scanT-=dt;if(f.scanT<=0){f.scanT=0.3;f.tgt=null;if(!safe&&!P.dead){let bd=540;for(const e of enemies){if(!isHostile(e)||e.tut)continue;const d=Math.hypot(e.x-f.x,e.y-f.y);if(d<bd&&Math.hypot(e.x-P.x,e.y-P.y)<900){bd=d;f.tgt=e;}}}}
  if(f.tgt&&!isHostile(f.tgt))f.tgt=null;
  let desired=f.h,thr=0.5;
  if(f.tgt){const e=f.tgt,dx=e.x-f.x,dy=e.y-f.y,d=Math.hypot(dx,dy),toE=Math.atan2(dy,dx);thr=1;desired=d>300?toE+f.side*0.3:toE-f.side*Math.PI/2;
   if(d<370){const rel=angDiff(f.h,toE);
    if(Math.abs(rel-Math.PI/2)<0.35&&f.rr<=0){f.rr=3.2;fireBroadside(f,1,f.d.cannons,f.d.dmg,'f',370);}
    else if(Math.abs(rel+Math.PI/2)<0.35&&f.rl<=0){f.rl=3.2;fireBroadside(f,-1,f.d.cannons,f.d.dmg,'f',370);}}}
  else{const p=slotPos(i),dx=p.x-f.x,dy=p.y-f.y,dist=Math.hypot(dx,dy);
   if(dist>1600){f.x=p.x;f.y=p.y;f.h=P.h;f.vx=P.vx;f.vy=P.vy;f.speed=P.speed;}
   if(dist>35){desired=Math.atan2(dy,dx);thr=clamp(dist/170,0.25,1);}else{desired=P.h;thr=clamp(Math.hypot(P.vx,P.vy)/(ms*0.95),0,1);}}
  const ca=Math.cos(f.h),sa=Math.sin(f.h);for(const look of LOOKS){const o=inAnyIsland(f.x+ca*look,f.y+sa*look,30);if(o){const ai=Math.atan2(o.y-f.y,o.x-f.x);desired=f.h+(angDiff(ai,f.h)>=0?1:-1)*1.4;break;}}
  moveShip(f,desired,thr,ms,ST.turn*1.1,dt);
  // keep a little distance from the flagship and each other
  const pdx=f.x-P.x,pdy=f.y-P.y,pd=Math.hypot(pdx,pdy),md=(f.len+P.len)*0.45;if(pd<md&&pd>0.01){f.x+=pdx/pd*(md-pd)*0.5;f.y+=pdy/pd*(md-pd)*0.5;}
  for(const g of fleet){if(g===f||g.sinking)continue;const gx=f.x-g.x,gy=f.y-g.y,gd=Math.hypot(gx,gy),mg=(f.len+g.len)*0.42;if(gd<mg&&gd>0.01){f.x+=gx/gd*(mg-gd)*0.5;f.y+=gy/gd*(mg-gd)*0.5;}}
  if(P.calm>6&&f.d.hp<f.d.maxHp*0.6)f.d.hp=Math.min(f.d.maxHp*0.6,f.d.hp+dt);}
 S.upkT=(S.upkT||0)+dt;if(S.upkT>=60){S.upkT=0;payWages();}}
function damageFleet(f,dmg){f.d.hp-=dmg;f.hitT=0.25;addText(f.x,f.y-22,'-'+Math.round(dmg),'#ff9a6b');
 if(f.d.hp<=0&&!f.sinking){f.d.hp=0;f.sinking=0.001;S.fleet=S.fleet.filter(x=>x!==f.d);chum(f.x,f.y,22);toast(`💀 Your ship ${f.d.name} was sunk!`);boom(0.6,380);save();}}
function payWages(){const w=wagesTotal();if(!w)return;
 if(S.gold>=w){S.gold-=w;for(const d of S.fleet)d.unpaid=0;toast(`⛵ Fleet wages paid: -${w} 💰`);}
 else{for(const d of S.fleet)d.unpaid=(d.unpaid||0)+1;const gone=S.fleet.filter(d=>d.unpaid>=3);
  if(gone.length){S.fleet=S.fleet.filter(d=>d.unpaid<3);syncFleet();toast(`😠 Unpaid crews deserted: ${gone.map(d=>d.name).join(', ')}`);}
  else toast(`⚠️ Can't pay fleet wages (${w} 💰)! Unpaid crews will desert.`);}
 save();}
function seize(e){if(!e||!e.surr||e.sinking||state!=='play'||P.dead)return;if(S.fleet.length>=fleetCap()){toast(`⛵ Fleet full (${fleetCap()}). Upgrade Fleet Command in a shipyard.`);return;}
 const d={id:S.fid=(S.fid||1)+1,name:freeName(),type:'prize',lvl:e.lvl,maxHp:Math.round(e.maxHp),hp:Math.round(Math.max(e.hp,e.maxHp*0.4)),cannons:1+Math.floor(e.lvl/3),dmg:+(4+1.2*e.lvl).toFixed(1),wage:3+e.lvl,unpaid:0};
 S.fleet.push(d);const k=enemies.indexOf(e);if(k>=0)enemies.splice(k,1);fleet.push(fleetEnt(d,e.x,e.y,e.h));
 S.infamy+=Math.round(e.lvl*6);S.raids=(S.raids||0)+1;addHeat(0.8);
 for(const q of S.quests)if(q.type==='bounty'&&q.target==='merchant'&&q.have<q.need){q.have++;if(q.have>=q.need)completeQuest(q);}
 if(sharkBoarding())toast(`⛓ Seized! A boarder fell to the sharks 🦈 — ${d.name} joins your fleet.`);else toast(`⛓ Prize seized! The ${d.name} joins your fleet.`);
 addText(e.x,e.y-40,'⛓ Seized!','#9dffa8',true);chime();save();}
function sharkBoarding(){let near=!!inSharkZone(P.x,P.y);if(!near)for(const s of sharks)if(!s.harmless&&!s.sinking&&Math.hypot(s.x-P.x,s.y-P.y)<350){near=true;break;}
 if(near&&S.crew>4&&Math.random()<0.35){S.crew--;recalc();addText(P.x,P.y-60,'-1 crew 🦈','#ffb3b3');return true;}return false;}
