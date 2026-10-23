// ===== Visual restyle (gritty, matches the boarding art): sea, lighting, ships =====
const RS={dbg:0,tile:null,pat:null,pat2:null,vig:null,vk:'',ship:{},shipN:0};
function rsRng(s){let x=s|0||1;return()=>{x|=0;x=x+0x6D2B79F5|0;let t=Math.imul(x^x>>>15,1|x);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rsHex(c,k,to){// shade a #hex or rgb() colour toward 'to' (#000 default) by k
 let r,g,b;const m=/rgba?\(([^)]+)\)/.exec(c||'');if(m){[r,g,b]=m[1].split(',').map(Number);}else{let h=String(c||'#777').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;r=n>>16&255;g=n>>8&255;b=n&255;}
 const T=to||[0,0,0];return`rgb(${Math.round(r+(T[0]-r)*k)},${Math.round(g+(T[1]-g)*k)},${Math.round(b+(T[2]-b)*k)})`;}
// ---- sea: deep dark water, two drifting swell layers, soft lantern/ambient lighting
function rsTile(S,seed,lite){const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),R=rsRng(seed);
 const blob=(x,y,rx,ry,col)=>{for(const dx of [-S,0,S])for(const dy of [-S,0,S]){g.save();g.translate(x+dx,y+dy);g.scale(1,ry/rx);const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(-rx,-rx,rx*2,rx*2);g.restore();}};
 for(let i=0;i<46;i++)blob(R()*S,R()*S,30+R()*70,8+R()*16,R()<0.55?'rgba(0,8,16,0.22)':'rgba(120,165,175,0.07)');
 if(lite){g.lineCap='round';for(let i=0;i<70;i++){const x=R()*S,y=R()*S,w=6+R()*16,b=1.5+R()*2.5;g.strokeStyle=`rgba(190,215,220,${0.05+R()*0.09})`;g.lineWidth=0.8+R()*0.9;
  for(const dx of [-S,0,S])for(const dy of [-S,0,S]){g.beginPath();g.moveTo(x+dx-w,y+dy);g.quadraticCurveTo(x+dx,y+dy-b,x+dx+w,y+dy);g.stroke();}}
  for(let i=0;i<120;i++){g.fillStyle=`rgba(200,225,230,${0.04+R()*0.06})`;g.fillRect(R()*S,R()*S,1+R()*1.5,1);}}
 return c;}
function rsSeaBase(){const t=clamp(Math.hypot(cam.x-START.x,cam.y-START.y)/5000,0,1);return`rgb(${Math.round(lerp(20,9,t))},${Math.round(lerp(62,30,t))},${Math.round(lerp(78,46,t))})`;}
function rsVigC(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 let gr=g.createLinearGradient(0,0,w*0.6,h);gr.addColorStop(0,'rgba(255,196,120,0.10)');gr.addColorStop(0.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(8,14,30,0.22)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 gr=g.createRadialGradient(w/2,h*0.48,Math.min(w,h)*0.3,w/2,h*0.48,Math.hypot(w,h)*0.62);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(4,6,8,0.55)');g.fillStyle=gr;g.fillRect(0,0,w,h);return c;}
// The whole sea (base tone + two drifting swell layers + lantern/ambient light falloff) is composed in a small
// offscreen canvas and blitted once, so it costs about the same as the old flat fill.
function rsSea(t){const ts=t/1000;const Q=0.5,w=Math.max(2,Math.ceil(vw*Q)),h=Math.max(2,Math.ceil(vh*Q));
 if(!RS.sc||RS.sc.width!==w||RS.sc.height!==h){RS.sc=document.createElement('canvas');RS.sc.width=w;RS.sc.height=h;RS.sg=RS.sc.getContext('2d');RS.vig=rsVigC(w,h);}
 const g=RS.sg;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.fillStyle=rsSeaBase();g.fillRect(0,0,w,h);
 if(!(RS.dbg&1)){if(!RS.pat){RS.pat=g.createPattern(rsTile(256,77,false),'repeat');RS.pat2=g.createPattern(rsTile(256,191,true),'repeat');}
  const wdx=Math.cos(wind.dir),wdy=Math.sin(wind.dir);
  for(const [p,sc,sp,al] of (RS.low?[[RS.pat2,1.4,8,1]]:[[RS.pat,2.2,5,1],[RS.pat2,1,11,0.9]])){const z=zoom*sc*Q,T=256*z;
   let ox=((vw/2-cam.x*zoom-wdx*ts*sp*zoom)*Q)%T,oy=((vh/2-cam.y*zoom-wdy*ts*sp*zoom)*Q)%T;if(ox>0)ox-=T;if(oy>0)oy-=T;
   g.setTransform(z,0,0,z,ox,oy);g.globalAlpha=al;g.fillStyle=p;g.fillRect(0,0,(w-ox)/z+2,(h-oy)/z+2);}
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;}
 if(!(RS.dbg&2))g.drawImage(RS.vig,0,0);
 ctx.imageSmoothingEnabled=!(RS.dbg&8)&&!RS.low;ctx.drawImage(RS.sc,0,0,vw,vh);ctx.imageSmoothingEnabled=true;}
function rsLight(){}
// ---- ships: cached detailed hull sprite (planking, rails, cannons, rigging, wear) + shaded sails drawn live
function rsHull(g,L,W,d){g.beginPath();g.moveTo(L/2-d*1.4,0);g.quadraticCurveTo(L*0.28,-W/2+d,-L*0.32,-W/2+d);g.lineTo(-L/2+d,-W*0.36+d*0.5);g.lineTo(-L/2+d,W*0.36-d*0.5);g.lineTo(-L*0.32,W/2-d);g.quadraticCurveTo(L*0.28,W/2-d,L/2-d*1.4,0);g.closePath();}
function rsMasts(L){return L>58?[L*0.22,-L*0.02,-L*0.25]:[L*0.15,-L*0.18];}
function rsShipSprite(L,W,paint,deck,n){const key=L+'|'+W+'|'+paint+'|'+deck+'|'+n;let sp=RS.ship[key];if(sp)return sp;
 if(++RS.shipN>80){RS.ship={};RS.shipN=1;}
 const K=clamp(dpr*1.3,2,3.6),PADX=L*0.22+10,PADY=W*0.5+8,c=document.createElement('canvas');c.width=Math.ceil((L+PADX*2)*K);c.height=Math.ceil((W+PADY*2)*K);
 const g=c.getContext('2d');g.scale(K,K);g.translate(L/2+PADX,W/2+PADY);const R=rsRng((L*131+W*17+String(paint).length*7+n)|0);
 const hull=paint||'#7b4a23',dk=deck||'#b07b45',dark=rsHex(hull,0.62),wood=rsHex(dk,0.38),wood2=rsHex(dk,0.22,[200,170,120]);
 // soft drop shadow + waterline
 g.save();g.translate(2.5,3.5);g.filter='blur(2px)';rsHull(g,L*1.02,W*1.04,0);g.fillStyle='rgba(0,0,0,0.42)';g.fill();g.restore();g.filter='none';
 // bowsprit
 g.strokeStyle='#2a1c10';g.lineWidth=2.2;g.lineCap='round';g.beginPath();g.moveTo(L*0.4,0);g.lineTo(L*0.5+PADX*0.75,0);g.stroke();g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=0.6;g.beginPath();g.moveTo(L*0.5+PADX*0.7,0);g.lineTo(L*0.26,-W*0.42);g.moveTo(L*0.5+PADX*0.7,0);g.lineTo(L*0.26,W*0.42);g.stroke();
 // foam rim at the waterline (keeps ships readable on dark water)
 rsHull(g,L*1.04,W*1.1,0);g.strokeStyle='rgba(215,230,234,0.22)';g.lineWidth=2.4;g.stroke();
 // outer hull: dark strakes
 rsHull(g,L,W,0);g.fillStyle=dark;g.fill();g.save();rsHull(g,L,W,0);g.clip();
 for(let k=0;k<4;k++){const f=1-k*0.07;g.strokeStyle=k%2?'rgba(0,0,0,0.35)':'rgba(255,225,180,0.07)';g.lineWidth=0.7;rsHull(g,L*f,W*f,0);g.stroke();}
 g.fillStyle=rsHex(hull,0.25);rsHull(g,L*0.9,W*0.86,0);g.fill();g.restore();
 g.lineWidth=1.6;g.strokeStyle='#1a110a';rsHull(g,L,W,0);g.stroke();
 // gunports + cannons (iron barrels over the rail on carriages)
 const gp=[];for(let i=0;i<n;i++){const t=n===1?0:(i/(n-1)-0.5)*L*0.62;gp.push(t);}
 const hwAt=x=>{if(x<=-L*0.32)return W/2-(x<-L*0.45?(-L*0.45-x)/(L*0.05)*W*0.14:0);let best=0,bd=1e9;for(let i=0;i<=40;i++){const u=i/40,px=(1-u)*(1-u)*L/2+2*u*(1-u)*L*0.28+u*u*(-L*0.32);if(Math.abs(px-x)<bd){bd=Math.abs(px-x);best=(2*u*(1-u)+u*u)*W/2;}}return best;};
 for(const t of gp){const hw=hwAt(t);for(const sd of [-1,1]){g.save();g.translate(t,sd*hw);g.fillStyle='#141210';g.fillRect(-1.5,sd<0?-2.8:-0.4,3,3.2);g.fillStyle='#34312e';g.fillRect(-0.9,sd<0?-3.3:0.2,1.8,3.1);g.fillStyle='rgba(255,255,255,0.2)';g.fillRect(-0.8,sd<0?-3.2:0.3,0.5,2.6);g.restore();}}
 // deck: planks running fore-aft
 g.save();rsHull(g,L*0.86,W*0.74,0);g.fillStyle=wood;g.fill();g.clip();
 const rh=Math.max(1.6,W/14);for(let y=-W/2;y<W/2;y+=rh){let x=-L/2-R()*20;while(x<L/2){const len=L*(0.16+R()*0.22);g.fillStyle=rsHex(dk,0.16+R()*0.3,R()<0.65?[0,0,0]:[120,100,80]);g.fillRect(x,y,len,rh-0.35);g.fillStyle='rgba(0,0,0,0.5)';g.fillRect(x+len-0.3,y,0.5,rh);x+=len;}}
 for(let i=0;i<10;i++){const x=(R()-0.5)*L*0.8,y=(R()-0.5)*W*0.6,rr=3+R()*W*0.3;const gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,R()<0.7?'rgba(20,10,4,0.28)':'rgba(255,235,200,0.08)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
 g.restore();
 // bulwark rail
 g.lineWidth=2.1;g.strokeStyle='#1e140c';rsHull(g,L*0.88,W*0.78,0);g.stroke();g.lineWidth=1.1;g.strokeStyle=wood2;g.stroke();g.lineWidth=0.4;g.strokeStyle='rgba(255,235,200,0.25)';g.stroke();
 // gun carriages inboard
 for(const t of gp){const hw=hwAt(t)*0.62;for(const sd of [-1,1]){g.fillStyle='#3b2817';g.fillRect(t-2,sd*hw-1.4,4,2.8);g.fillStyle='#16130f';g.fillRect(t-0.9,sd<0?-hw-3:hw,1.8,3);}}
 // stern castle, wheel, hatch grate, lantern
 g.fillStyle=rsHex(dk,0.5);g.fillRect(-L*0.47,-W*0.29,L*0.15,W*0.58);g.strokeStyle='rgba(0,0,0,0.6)';g.lineWidth=0.6;g.strokeRect(-L*0.47,-W*0.29,L*0.15,W*0.58);
 for(let i=1;i<4;i++){g.beginPath();g.moveTo(-L*0.47,-W*0.29+i*W*0.145);g.lineTo(-L*0.32,-W*0.29+i*W*0.145);g.stroke();}
 g.strokeStyle='#2a1a0c';g.lineWidth=0.9;g.beginPath();g.arc(-L*0.36,0,W*0.09,0,TAU);g.stroke();for(let i=0;i<6;i++){const a=i/6*TAU;g.beginPath();g.moveTo(-L*0.36+Math.cos(a)*W*0.05,Math.sin(a)*W*0.05);g.lineTo(-L*0.36+Math.cos(a)*W*0.14,Math.sin(a)*W*0.14);g.stroke();}
 g.fillStyle='#2a1a0e';const hx=L*0.04,hw=L*0.1,hh=W*0.3;g.fillRect(hx-hw/2,-hh/2,hw,hh);g.strokeStyle='rgba(150,120,80,0.6)';g.lineWidth=0.4;for(let i=1;i<4;i++){g.beginPath();g.moveTo(hx-hw/2+i*hw/4,-hh/2);g.lineTo(hx-hw/2+i*hw/4,hh/2);g.moveTo(hx-hw/2,-hh/2+i*hh/4);g.lineTo(hx+hw/2,-hh/2+i*hh/4);g.stroke();}
 {const lx=-L*0.5+1,gr=g.createRadialGradient(lx,0,0,lx,0,W*0.55);gr.addColorStop(0,'rgba(255,190,90,0.55)');gr.addColorStop(1,'rgba(255,150,60,0)');g.fillStyle=gr;g.fillRect(lx-W*0.55,-W*0.55,W*1.1,W*1.1);g.fillStyle='#ffd27a';g.beginPath();g.arc(lx,0,1.3,0,TAU);g.fill();}
 // shrouds (rigging) from each mast to the rails, plus barrels/coils for wear
 g.strokeStyle='rgba(25,16,8,0.7)';g.lineWidth=0.45;for(const mx of rsMasts(L))for(const sd of [-1,1])for(const dx of [-4,-1.5,1]){g.beginPath();g.moveTo(mx,0);g.lineTo(mx+dx,sd*W*0.4);g.stroke();}
 for(let i=0;i<2;i++){const x=L*(0.24-i*0.5)+R()*4,y=(i?-1:1)*W*0.2;g.fillStyle='#4a321e';g.beginPath();g.arc(x,y,W*0.06,0,TAU);g.fill();g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=0.4;g.stroke();}
 sp={c,ox:-(L/2+PADX),oy:-(W/2+PADY),w:L+PADX*2,h:W+PADY*2};RS.ship[key]=sp;return sp;}
function rsSail(mx,W,bul,sail){// square sail seen from above: curved canvas with shadowed belly, seams and a yard
 ctx.beginPath();ctx.moveTo(mx,-W*0.85);ctx.quadraticCurveTo(mx+bul*2,0,mx,W*0.85);ctx.quadraticCurveTo(mx+bul*0.6,0,mx,-W*0.85);ctx.fillStyle=sail;ctx.fill();
 ctx.beginPath();ctx.moveTo(mx+bul*0.25,-W*0.8);ctx.quadraticCurveTo(mx+bul*2,0,mx+bul*0.25,W*0.8);ctx.quadraticCurveTo(mx+bul*1.25,0,mx+bul*0.25,-W*0.8);ctx.fillStyle='rgba(40,28,14,0.24)';ctx.fill();
 ctx.strokeStyle='rgba(60,42,20,0.35)';ctx.lineWidth=0.5;ctx.beginPath();for(const f of [-0.45,0.45]){ctx.moveTo(mx+bul*0.3,W*0.85*f);ctx.quadraticCurveTo(mx+bul*1.3,W*0.85*f*0.8,mx+bul*1.1,W*0.85*f);}ctx.stroke();
 ctx.strokeStyle='rgba(255,250,235,0.35)';ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(mx,-W*0.85);ctx.quadraticCurveTo(mx+bul*0.6,0,mx,W*0.85);ctx.stroke();
 ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(mx-0.5,-W*0.9);ctx.lineTo(mx-0.5,W*0.9);ctx.stroke();
 ctx.fillStyle='#21150b';ctx.beginPath();ctx.arc(mx,0,2.3,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,220,170,0.25)';ctx.beginPath();ctx.arc(mx-0.6,-0.6,0.9,0,TAU);ctx.fill();}
const RSAIL={};function rsSailC(c){let v=RSAIL[c];if(v)return v;if(/^#/.test(c)){v=rsHex(c,0.2,[120,100,70]);}else v=c;return RSAIL[c]=v;}
function rsDrawShip(s,sail,flag,thr){if(RS.dbg&4)return RS.old(s,sail,flag,thr);sail=rsSailC(sail);const L=Math.round(s.len),W=Math.round(s.wid);ctx.save();ctx.translate(s.x,s.y);
 let a=1;if(s.sinking||s.dead){const t=(s.sinking||s.dead)/2.5;a=clamp(1-t,0,1);ctx.globalAlpha=a;ctx.scale(1-t*0.3,1-t*0.3);}
 ctx.rotate(s.h);const n=s.cannons||ST.cannons||2;
 const sp=rsShipSprite(L,W,s.paint||'#7b4a23',s.deck||'#b07b45',n);ctx.drawImage(sp.c,sp.ox,sp.oy,sp.w,sp.h);
 if(s.hitT>0){rsHull(ctx,L,W,0);ctx.fillStyle='rgba(200,70,40,0.5)';ctx.fill();}
 const masts=rsMasts(L);const bul=4+thr*7;for(const mx of masts)rsSail(mx,W,bul,sail);
 const fm=masts[masts.length-1];
 if(s.kind==='player'||s.kind==='fleet'){const wv=Math.sin(perfT*0.008)*1.5;ctx.fillStyle=(s.kind==='player'&&s.flagC)||'#111';ctx.beginPath();ctx.moveTo(fm,-7);ctx.lineTo(fm-20,-7+wv);ctx.lineTo(fm-20,7+wv);ctx.lineTo(fm,7);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(225,215,190,0.8)';ctx.lineWidth=0.8;ctx.stroke();
  ctx.fillStyle=(s.kind==='player'&&s.flagS)||'#e8e0cc';ctx.beginPath();ctx.arc(fm-10,-1+wv*0.5,3.2,0,TAU);ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(fm-15,2+wv*0.5);ctx.lineTo(fm-5,6+wv*0.5);ctx.moveTo(fm-15,6+wv*0.5);ctx.lineTo(fm-5,2+wv*0.5);ctx.stroke();
  ctx.fillStyle='#111';ctx.fillRect(fm-11.4,-1.6+wv*0.5,1.1,1.1);ctx.fillRect(fm-9.4,-1.6+wv*0.5,1.1,1.1);}
 else{ctx.fillStyle=flag;ctx.beginPath();ctx.moveTo(fm,0);ctx.lineTo(fm-11,-3+Math.sin(perfT*0.008+s.x)*2);ctx.lineTo(fm-11,4);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=0.5;ctx.stroke();}
 ctx.restore();ctx.globalAlpha=1;}
RS.old=drawShip;drawShip=rsDrawShip;
