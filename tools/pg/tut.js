// ---------- TUTORIAL ----------
// Guided, Kingshot-style: each step highlights a target (UI element or something in the world), shows a short
// bubble, and only advances once the player has actually done it.
const T={on:false,i:0,c:{},dummy:null,loot:null,lastH:0,wait:0,txtT:0,skipArm:0,tg:null,html:'',lay:{}};
let tutPeace=false;
const IS_TOUCH=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
const kb=s=>IS_TOUCH?'':` <small>(keys: ${s})</small>`;
function tutEv(n){if(!T.on)return;T.c[n]=(T.c[n]||0)+1;}
function nearestPortIdx(){let bi=0,bd=1e18;for(let i=0;i<PORTS.length;i++){const p=PORTS[i].port;const d=(p.x-P.x)*(p.x-P.x)+(p.y-P.y)*(p.y-P.y);if(d<bd){bd=d;bi=i;}}return bi;}
function firstEnabled(sel){const n=document.querySelectorAll(sel);for(const b of n)if(!b.disabled)return b;return null;}
const btnMode=()=>S.steer==='buttons';
function spawnDummy(){let pt=null;
 for(let k=0;k<80&&!pt;k++){const a=P.h+(k<40?rand(-1.1,1.1):rand(-Math.PI,Math.PI)),d=rand(380,620)+(k>=60?500:0);const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
  if(x<200||y<200||x>WORLD-200||y>WORLD-200)continue;if(inAnyIsland(x,y,110))continue;if(PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<850))continue;pt={x,y};}
 if(!pt)pt=randomWater(P.x,P.y,500,1500)||{x:clamp(P.x+450,200,WORLD-200),y:P.y};
 const e=makeEnemy('pirate',pt.x,pt.y,1,{tut:true,maxHp:34,cannons:0,maxSpeed:0,aggro:0,gold:70,len:46,wid:17});e.h=rand(0,TAU);enemies.push(e);T.dummy=e;}
const TSTEPS=[
 {id:'hello',next:"Let's sail! ⛵",text:()=>`<b>Ahoy, Captain!</b> I'm your first mate. Let me show you the ropes — do each step to continue.`},
 {id:'sail',text:()=>btnMode()?`<b>Raise your sails!</b> Tap <b>⛵+</b> a couple of times (or drag on the sea) and sail ahead.`+kb('W / ↑')
   :`<b>Drag on the sea</b> to sail. Drag your thumb <b>farther</b> from where you touched for <b>full sails</b> — then let go, the sails stay set.`+kb('W / ↑'),
  target:()=>btnMode()?{el:'sailUp'}:{zone:'sail'},enter:c=>{c.dist=0;c.maxThr=0;},prog:c=>Math.min(c.dist/450,1)*(c.maxThr>=0.6?1:0.7),done:c=>c.dist>=450&&c.maxThr>=0.6},
 {id:'turn',text:c=>(btnMode()?`Now <b>turn</b>: hold <b>⟲</b> to turn left and <b>⟳</b> to turn right.`:`Now <b>steer</b>: drag toward where you want to go — try turning <b>left</b> and <b>right</b>.`)
   +`<br>${c.L>=1?'✅':'⬜'} Left &nbsp; ${c.R>=1?'✅':'⬜'} Right`+kb('A / D'),
  target:()=>btnMode()?{els:['turnL','turnR']}:{zone:'turn'},enter:c=>{c.L=0;c.R=0;T.lastH=P.h;},prog:c=>(Math.min(c.L,1)+Math.min(c.R,1))/2,done:c=>c.L>=1&&c.R>=1},
 {id:'fire',text:c=>`<b>Fire your cannons!</b> Tap <b>◀ LEFT</b> and <b>RIGHT ▶</b> to shoot broadsides out of each side of the ship. (${Math.min(c.shots||0,3)}/3, both sides)`+kb('Q / E, Space = both'),
  target:()=>({els:['fireL','fireR']}),prog:c=>(Math.min(c.shots||0,3)/3)*((c.sl&&c.sr)?1:0.67),done:c=>(c.shots||0)>=3&&c.sl&&c.sr},
 {id:'auto',text:c=>`The <b>🎯 AUTO</b> button lets your gunners aim &amp; fire at enemies by themselves. Tap it to turn auto-fire <b>off</b>, then <b>on</b> again. (${Math.min(c.toggle||0,2)}/2)`+kb('T'),
  target:()=>({el:'autoBtn'}),prog:c=>Math.min(c.toggle||0,2)/2,done:c=>(c.toggle||0)>=2&&S.autoFire!==false},
 {id:'enemy',text:()=>`A <b>training target</b> appeared! Follow the arrow, get close and turn your <b>side</b> toward it — AUTO fires for you (or tap LEFT / RIGHT). <b>Sink it!</b>`,
  enter:()=>{if(!T.dummy||T.dummy.sinking||!enemies.includes(T.dummy))spawnDummy();},
  tick:()=>{const d=T.dummy;if(d&&!d.sinking&&!enemies.includes(d))spawnDummy();},
  target:()=>T.dummy?{world:T.dummy,label:'🎯'}:null,prog:()=>T.dummy?clamp(1-T.dummy.hp/T.dummy.maxHp,0,1):0,done:()=>!!(T.dummy&&T.dummy.sinking)},
 {id:'loot',text:()=>`Sunk! 💥 Sail over the floating <b>💰 loot</b> to collect the gold.`,
  target:()=>T.loot&&loot.includes(T.loot)?{world:T.loot,label:'💰'}:null,done:c=>(c.loot||0)>=1||!(T.loot&&loot.includes(T.loot))},
 {id:'map',text:()=>`Tap the <b>mini-map</b> (top right) to open your sea chart.`+kb('M'),target:()=>{const m=miniRect();return{rect:{left:m.x,top:m.y,width:m.s,height:m.s}};},done:()=>state==='map'},
 {id:'mapClose',text:()=>`This is the whole sea. 🟡 dots are ports. Waters get <b>more dangerous</b> the farther you sail from Port Royal. <b>Tap anywhere</b> to close the chart.`+kb('M'),done:()=>state==='play'},
 {id:'dock',text:()=>nearPort>=0&&state==='play'?`Tap <b>⚓ Dock</b> to enter the port.`+kb('F'):`Sail back to <b>${PORTS[nearestPortIdx()].name}</b> — follow the arrow and get close to the pier.`,
  target:()=>nearPort>=0&&state==='play'?{el:'dockBtn'}:{world:PORTS[nearestPortIdx()].port,label:'⚓'},done:()=>state==='port'},
 {id:'shipTab',port:1,text:()=>`Welcome to port! Here you repair, upgrade, hire crew, trade cargo and take jobs. Open the <b>🛠️ Ship</b> tab.`,
  target:()=>({q:'#pTabs button[data-tab="ship"]'}),done:()=>tab==='ship'},
 {id:'buy',port:1,text:()=>firstEnabled('#pBody button[data-act="up"]')||tab!=='ship'?`<b>Buy an upgrade!</b> 🛡️ Hull = more HP, ⛵ Sails = speed, 💣 Cannons = firepower, 📦 Cargo = more trade goods. (Hull repairs are on the ⚓ Dock tab.)`
   :`You can't afford an upgrade right now — sink ships and trade to earn more gold. Tap <b>Next</b>.`,
  target:()=>tab!=='ship'?{q:'#pTabs button[data-tab="ship"]'}:(firstEnabled('#pBody button[data-act="up"]')?{node:firstEnabled('#pBody button[data-act="up"]'),scroll:1}:null),
  nextIf:()=>tab==='ship'&&!firstEnabled('#pBody button[data-act="up"]'),done:c=>(c.buy||0)>=1},
 {id:'leave',port:1,text:()=>`Nice refit, Captain! Tap <b>⛵ Set Sail</b> to head back out to sea.`,target:()=>({el:'pLeave'}),done:()=>state!=='port'},
 {id:'log',text:()=>`Tap <b>☰</b> to open the <b>Captain's Log</b> — sound, steering options, map and saves live here.`+kb('Esc'),target:()=>({el:'menuBtn'}),done:()=>state==='menu'},
 {id:'save',menu:1,text:()=>`Your progress <b>saves automatically</b> on this device. Tap <b>💾 Save now</b> to save by hand. (💾 Save Transfer moves it to another phone.)`,
  target:()=>({q:'#mBody button[data-act="savenow"]',scroll:1}),done:c=>(c.save||0)>=1},
 {id:'finish',menu:1,next:'Finish ✔',text:()=>`<b>You're ready, Captain!</b> 🏴‍☠️ Sink pirates, plunder merchants, trade cargo and take jobs in port. Replay this tutorial any time from here. Fair winds!`}
];
const TIDX={};TSTEPS.forEach((s,i)=>TIDX[s.id]=i);
function tutResumeIdx(i){const id=(TSTEPS[i]||TSTEPS[0]).id;
 if(id==='loot')return T.loot?i:TIDX.enemy;if(id==='mapClose')return TIDX.map;if(id==='shipTab'||id==='buy'||id==='leave')return TIDX.dock;if(id==='save'||id==='finish')return TIDX.log;return clamp(i,0,TSTEPS.length-1);}
function tutStart(i){T.on=true;S.tutDone=false;T.skipArm=0;$('tutSkip').textContent='Skip tutorial';$('tut').classList.remove('hidden');tutGo(i||0);}
function tutGo(i){T.i=i;T.c={};T.wait=0;T.html='';T.txtT=0;T.lay={};S.tutStep=i;const st=TSTEPS[i];if(st.enter)st.enter(T.c);T.scrolled=false;tutText();save();}
function tutEnd(finished){const d=T.dummy;if(d&&!d.sinking){const k=enemies.indexOf(d);if(k>=0)enemies.splice(k,1);}
 T.on=false;T.dummy=null;T.loot=null;tutPeace=false;S.tutDone=true;S.tutStep=0;$('tut').classList.add('hidden');save();
 toast(finished?'🎓 Tutorial complete — fair winds, Captain!':'Tutorial skipped. Replay it any time from ☰ Captain\'s Log.');}
function tutText(){const st=TSTEPS[T.i];const h=st.text(T.c);if(h!==T.html){T.html=h;$('tutTxt').innerHTML=h;}
 $('tutCount').textContent=`Step ${T.i+1}/${TSTEPS.length}`;
 const showNext=!!st.next||!!(st.nextIf&&st.nextIf());$('tutNext').classList.toggle('hidden',!showNext);if(showNext)$('tutNext').textContent=st.next||'Next ▶';
 const pr=st.prog?st.prog(T.c):null;$('tutProg').classList.toggle('hidden',pr==null);if(pr!=null)$('tutBar').style.width=Math.round(clamp(pr,0,1)*100)+'%';}
$('tutNext').addEventListener('click',()=>{if(!T.on)return;const st=TSTEPS[T.i];
 if(st.id==='finish'){tutEnd(true);if(state==='menu'){$('menu').classList.add('hidden');state='play';}return;}
 chime();tutGo(T.i+1);});
$('tutSkip').addEventListener('click',()=>{if(!T.on)return;if(!T.skipArm){T.skipArm=1;$('tutSkip').textContent='Tap again to skip';setTimeout(()=>{T.skipArm=0;if(T.on)$('tutSkip').textContent='Skip tutorial';},3000);return;}tutEnd(false);});
function rectOf(el){if(!el)return null;const r=el.getBoundingClientRect();if(!r.width&&!r.height)return null;return r;}
function tutTargetRect(tg){if(!tg)return null;
 if(tg.el)return rectOf($(tg.el));if(tg.q)return rectOf(document.querySelector(tg.q));if(tg.node)return rectOf(tg.node);if(tg.rect)return tg.rect;
 if(tg.els){let l=1e9,t=1e9,r=-1e9,b=-1e9,any=false;for(const id of tg.els){const q=rectOf($(id));if(!q)continue;any=true;l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom);}return any?{left:l,top:t,width:r-l,height:b-t}:null;}
 return null;}
function setBox(el,k,v){const L=T.lay;if(L[k]===v)return;L[k]=v;el.style.transform=v;}
function tutTick(dt){
 if(!T.on){return;}
 const st=TSTEPS[T.i];tutPeace=T.i<=TIDX.loot;
 if(state==='play'){const c=T.c;c.dist=(c.dist||0)+Math.hypot(P.vx,P.vy)*dt;c.maxThr=Math.max(c.maxThr||0,P.throttle);
  const dh=angDiff(T.lastH,P.h);T.lastH=P.h;if(dh>0)c.R=(c.R||0)+dh;else c.L=(c.L||0)-dh;}
 else T.lastH=P.h;
 // guards: steps that need the port / log open fall back if the player closed it
 if(st.port&&state!=='port'&&state!=='dead'){tutGo(TIDX.dock);return;}
 if(st.menu&&state!=='menu'&&state!=='title'){tutGo(TIDX.log);return;}
 if(st.tick)st.tick(T.c);
 if(T.wait>0){T.wait-=dt;if(T.wait<=0)tutGo(T.i+1);}
 else if(st.done&&st.done(T.c)){T.wait=0.45;chime();T.c.__done=1;}
 T.txtT-=dt;if(T.txtT<=0){T.txtT=0.1;tutText();}
 tutLayout();}
function tutLayout(){
 const root=$('tut');const hide=state==='title'||!$('xfer').classList.contains('hidden');root.classList.toggle('hidden',hide);if(hide)return;
 const st=TSTEPS[T.i];const tg=st.target?st.target(T.c):null;T.tg=tg;
 const r=tutTargetRect(tg);const ring=$('tutRing'),arr=$('tutArrow'),bub=$('tutBub');
 if(r&&tg.scroll&&!T.scrolled){T.scrolled=true;const node=tg.node||document.querySelector(tg.q);if(node&&node.scrollIntoView)node.scrollIntoView({block:'center'});}
 const bw=bub.offsetWidth,bh=bub.offsetHeight;let bx,by;
 if(r){const pad=6;ring.classList.remove('hidden');arr.classList.remove('hidden');
  const w=Math.round(r.width+pad*2),h=Math.round(r.height+pad*2);if(T.lay.rw!==w||T.lay.rh!==h){T.lay.rw=w;T.lay.rh=h;ring.style.width=w+'px';ring.style.height=h+'px';}
  setBox(ring,'ring',`translate(${Math.round(r.left-pad)}px,${Math.round(r.top-pad)}px)`);
  ring.classList.toggle('dim',!T.c.__done);
  const cx=r.left+r.width/2,cy=r.top+r.height/2;const below=cy<vh*0.5;let ay;
  if(below){ay=r.top+r.height+pad+2;by=ay+40;}else{ay=r.top-pad-42;by=ay-bh+2;}
  arr.classList.toggle('up',below);arr.firstChild.textContent=below?'▲':'▼';setBox(arr,'arr',`translate(${Math.round(cx)}px,${Math.round(ay)}px)`);
  bx=cx-bw/2;}
 else{ring.classList.add('hidden');arr.classList.add('hidden');
  const m=miniRect();const land=vw>vh&&vh<560;
  if(land){const L=8+safe.l+Math.min(215,vw*0.52)+8,R=m.x-8;bx=Math.max(L,(L+R)/2-bw/2);by=8+safe.t;}
  else{bx=(vw-bw)/2;by=m.y+m.s+92;}
  // keep a world target visible: if it sits under the bubble, move the bubble lower
  if(tg&&tg.world&&state==='play'){const X=sx(tg.world.x),Y=sy(tg.world.y);if(Y>by-30&&Y<by+bh+60&&X>bx-30&&X<bx+bw+30)by=Math.min(vh-bh-130-safe.b,Y+70);}}
 bx=clamp(bx,8+safe.l,Math.max(8,vw-bw-8-safe.r));by=clamp(by,8+safe.t,Math.max(8,vh-bh-8-safe.b));
 setBox(bub,'bub',`translate(${Math.round(bx)}px,${Math.round(by)}px)`);}
// canvas part: ring + bouncing arrow on world targets (or an edge arrow when off-screen), and a ghost joystick demo
function drawTut(ts){if(!T.on||state==='title'||state==='map')return;const tg=T.tg;if(!tg)return;
 ctx.textAlign='center';ctx.textBaseline='middle';
 if(tg.world){const X=sx(tg.world.x),Y=sy(tg.world.y);const mg=36;
  if(X>mg&&X<vw-mg&&Y>mg+40&&Y<vh-mg){const rr=40+Math.sin(ts*5)*4;ctx.strokeStyle='#ffd34d';ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.lineDashOffset=-ts*30;ctx.beginPath();ctx.arc(X,Y,rr,0,TAU);ctx.stroke();ctx.setLineDash([]);
   const bob=Math.abs(Math.sin(ts*4))*10;ctx.fillStyle='#ffd34d';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X,Y-rr-6-bob);ctx.lineTo(X-13,Y-rr-28-bob);ctx.lineTo(X+13,Y-rr-28-bob);ctx.closePath();ctx.fill();ctx.stroke();}
  else{const a=Math.atan2(Y-vh/2,X-vw/2);const mx=vw/2-46,my=vh/2-70;const k=Math.min(Math.abs(mx/Math.cos(a)),Math.abs(my/Math.sin(a)));const ax=vw/2+Math.cos(a)*k,ay=vh/2+Math.sin(a)*k;const pul=1+Math.sin(ts*6)*0.12;
   ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.scale(pul,pul);ctx.fillStyle='#ffd34d';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-8,-15);ctx.lineTo(-8,15);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   ctx.font='20px serif';ctx.fillText(tg.label||'⭐',ax-Math.cos(a)*30,ay-Math.sin(a)*30);ctx.font='bold 12px sans-serif';ctx.fillStyle='#fff';ctx.fillText(Math.round(Math.hypot(tg.world.x-P.x,tg.world.y-P.y)/10)*10+'m',ax-Math.cos(a)*30,ay-Math.sin(a)*30+18);}}
 else if((tg.zone==='sail'||tg.zone==='turn')&&joy.id===null&&state==='play'&&!T.c.__done){
  const bx=vw*0.5,by=Math.min(vh*0.7,vh-170-safe.b);let ang,dist;
  if(tg.zone==='sail'){ang=-Math.PI/2;dist=(ts*0.9%1)*JR*1.1;}else{ang=-Math.PI/2+Math.sin(ts*2)*1.1;dist=JR*0.9;}
  const kx=bx+Math.cos(ang)*dist,ky=by+Math.sin(ang)*dist;
  ctx.globalAlpha=0.5;ctx.strokeStyle='#ffd34d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(bx,by,JR,0,TAU);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(kx,ky,22,0,TAU);ctx.fill();ctx.globalAlpha=1;
  ctx.font='34px serif';ctx.fillText('👆',kx+6,ky+26);ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.fillText(tg.zone==='sail'?'drag far = full sails':'drag left / right',bx,by+JR+22);}}
