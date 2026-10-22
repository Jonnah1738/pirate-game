// ===== Visual restyle part 2: islands, ports, forts, loot (all cached sprites) =====
function rsPalm(g,x,y,s,R){// top-down palm: shadow, trunk crown, fronds with lit midribs
 g.fillStyle='rgba(0,0,0,0.28)';g.beginPath();g.ellipse(x+s*0.35,y+s*0.4,s*0.95,s*0.8,0,0,TAU);g.fill();
 const n=6+((R()*3)|0),a0=R()*TAU;
 for(let i=0;i<n;i++){const a=a0+i/n*TAU+(R()-0.5)*0.4,l=s*(0.85+R()*0.35),ex=x+Math.cos(a)*l,ey=y+Math.sin(a)*l,px=-Math.sin(a)*s*0.2,py=Math.cos(a)*s*0.2,mx=x+Math.cos(a)*l*0.55,my=y+Math.sin(a)*l*0.55;
  g.fillStyle=R()<0.5?'#2f4a26':'#3a5a2c';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx+px,my+py,ex,ey);g.quadraticCurveTo(mx-px,my-py,x,y);g.fill();
  g.strokeStyle='rgba(170,190,110,0.35)';g.lineWidth=0.7;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx+px*0.2,my+py*0.2,ex,ey);g.stroke();}
 g.fillStyle='#4a3a22';g.beginPath();g.arc(x,y,s*0.14,0,TAU);g.fill();}
function rsRock(g,x,y,s,R){const n=6;g.fillStyle='rgba(0,0,0,0.3)';g.beginPath();g.ellipse(x+s*0.25,y+s*0.3,s,s*0.8,0,0,TAU);g.fill();
 g.beginPath();for(let i=0;i<n;i++){const a=i/n*TAU,r=s*(0.7+R()*0.4);i?g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();g.fillStyle=R()<0.5?'#5e5a52':'#6c665a';g.fill();
 g.fillStyle='rgba(255,240,215,0.14)';g.beginPath();g.ellipse(x-s*0.25,y-s*0.25,s*0.4,s*0.28,-0.6,0,TAU);g.fill();g.strokeStyle='rgba(0,0,0,0.35)';g.lineWidth=0.8;g.stroke();}
function rsTorch(g,x,y,r){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,190,90,0.6)');gr.addColorStop(0.35,'rgba(255,140,50,0.22)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);
 g.fillStyle='#3a2614';g.fillRect(x-1.2,y-1.2,2.4,2.4);g.fillStyle='#ffd27a';g.beginPath();g.arc(x,y-0.5,1.6,0,TAU);g.fill();}
function rsRenderIsland(o){
 const R0=o.r*1.3*1.25+30;const S=Math.ceil(R0*2);const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
 const cx=S/2,cy=S/2;const N=120,r=rng(o.seed+5),R=rsRng(o.seed*7+3);
 const shape=(k,add,j)=>{g.beginPath();for(let i=0;i<=N;i++){const a=i/N*TAU;const rr=radiusAt(o,a)*k+add+(j?Math.sin(a*23+o.seed)*j+Math.sin(a*41)*j*0.6:0);const px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();};
 const speck=(n,cols,rad,k)=>{for(let i=0;i<n;i++){const a=R()*TAU,d=radiusAt(o,a)*k*Math.sqrt(R());g.fillStyle=cols[(R()*cols.length)|0];g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,rad*(0.4+R()),0,TAU);g.fill();}};
 // shallows: muted reef water, darker coral patches, broken surf lines
 shape(1.2,26,3);g.fillStyle='rgba(70,120,118,0.20)';g.fill();
 shape(1.1,12,2);g.fillStyle='rgba(95,145,135,0.26)';g.fill();
 g.save();shape(1.2,26,3);g.clip();for(let i=0;i<Math.round(o.r/4);i++){const a=R()*TAU,d=radiusAt(o,a)*(1.05+R()*0.18)+R()*20;const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,rr=4+R()*12;const gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(20,40,40,0.25)');gr.addColorStop(1,'rgba(20,40,40,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}g.restore();
 g.setLineDash([18,9,6,12]);shape(1.12,14,2);g.strokeStyle='rgba(215,230,228,0.16)';g.lineWidth=2;g.stroke();g.setLineDash([]);
 shape(1.03,5,1.5);g.strokeStyle='rgba(225,236,234,0.42)';g.lineWidth=3.2;g.stroke();
 // beach: wet sand rim, dry sand with grain
 shape(1,0,1.2);g.fillStyle='#8a7752';g.fill();
 shape(0.96,-2,1.5);g.fillStyle='#b39a68';g.fill();
 g.save();shape(0.96,-2,1.5);g.clip();speck(Math.round(o.r*6),['rgba(90,70,40,0.18)','rgba(235,215,170,0.16)','rgba(60,50,30,0.12)'],1.4,0.97);g.restore();
 // vegetation: dark scrub with canopy clumps, dirt patches, inner hill and rock core
 shape(0.8,-6,3);g.fillStyle='#3b4f2c';g.fill();
 g.save();shape(0.8,-6,3);g.clip();
 for(let i=0;i<Math.round(o.r*0.9);i++){const a=R()*TAU,d=radiusAt(o,a)*0.8*Math.sqrt(R());const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,rr=4+R()*10;g.fillStyle=['#2e4224','#465f33','#33492a','#55673a','#4a4a2e'][(R()*5)|0];g.beginPath();g.arc(x,y,rr,0,TAU);g.fill();g.fillStyle='rgba(200,220,140,0.07)';g.beginPath();g.arc(x-rr*0.3,y-rr*0.3,rr*0.55,0,TAU);g.fill();}
 for(let i=0;i<Math.round(o.r/30);i++){const a=R()*TAU,d=radiusAt(o,a)*0.6*R();g.fillStyle='rgba(110,85,50,0.35)';g.beginPath();g.ellipse(cx+Math.cos(a)*d,cy+Math.sin(a)*d,8+R()*14,5+R()*8,R()*3,0,TAU);g.fill();}
 g.restore();
 shape(0.5,-6,2);g.fillStyle='rgba(30,44,24,0.55)';g.fill();
 if(o.r>120){shape(0.27,-4,2.5);g.fillStyle='#5f5a4e';g.fill();g.save();shape(0.27,-4,2.5);g.clip();speck(Math.round(o.r*1.2),['rgba(0,0,0,0.25)','rgba(255,240,220,0.12)','#6e685a'],3,0.27);g.restore();shape(0.27,-4,2.5);g.strokeStyle='rgba(20,18,14,0.6)';g.lineWidth=1.5;g.stroke();}
 // boulders on the shore, then palms (drawn, not emoji)
 for(let i=0;i<Math.round(o.r/22);i++){const a=R()*TAU,d=radiusAt(o,a)*(0.86+R()*0.14);rsRock(g,cx+Math.cos(a)*d,cy+Math.sin(a)*d,3+R()*6,R);}
 const np=Math.floor(o.r/18);
 for(let i=0;i<np;i++){const a=r()*TAU,d=radiusAt(o,a)*(0.25+r()*0.5);r();rsPalm(g,cx+Math.cos(a)*d,cy+Math.sin(a)*d,9+R()*7,R);}
 if(o.isPort){
  const a=o.pa,ca=Math.cos(a),sa=Math.sin(a);const edge=radiusAt(o,a);
  // stone quay wall along the harbour front
  g.save();g.translate(cx,cy);g.rotate(a);
  g.fillStyle='#5a554b';g.fillRect(edge-34,-30,16,60);g.strokeStyle='rgba(0,0,0,0.45)';g.lineWidth=0.8;for(let j=-30;j<30;j+=6){g.strokeRect(edge-34+((j/6)%2?0:3),j,8,6);g.strokeRect(edge-26+((j/6)%2?0:3),j,8,6);}
  // pier: planks, pilings, crates and barrels
  g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(edge-24,-6,86,18);
  g.fillStyle='#5b4128';g.fillRect(edge-28,-9,86,18);
  for(let x=edge-28;x<edge+58;x+=4){g.fillStyle=rsHex('#6b4c2e',R()*0.35,R()<0.5?[0,0,0]:[150,120,90]);g.fillRect(x,-9,3.4,18);}
  g.fillStyle='#2a1c10';for(let i=0;i<7;i++){g.beginPath();g.arc(edge-22+i*13,-10,2.4,0,TAU);g.arc(edge-22+i*13,10,2.4,0,TAU);g.fill();}
  g.fillStyle='#4a321e';g.beginPath();g.arc(edge+20,-4,3,0,TAU);g.fill();g.fillStyle='#5b4430';g.fillRect(edge+30,1,6,6);g.strokeStyle='rgba(0,0,0,0.5)';g.strokeRect(edge+30,1,6,6);
  rsTorch(g,edge+56,-10,18);rsTorch(g,edge+56,10,18);
  g.restore();
  // town: shaded tile roofs, packed-earth lanes, a stone keep with its flag
  for(let i=0;i<9;i++){const aa=a+(r()-0.5)*0.9,dd=edge*(0.55+r()*0.32);const hx=cx+Math.cos(aa)*dd,hy=cy+Math.sin(aa)*dd;
   const col=pick(['#8a4a34','#7a4630','#94603e','#6e3e2c']);g.save();g.translate(hx,hy);g.rotate(aa+(R()-0.5)*0.4);
   g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(-7,-5,18,14);g.fillStyle=col;g.fillRect(-9,-7,18,14);g.fillStyle=rsHex(col,0.35);g.fillRect(-9,0,18,7);
   g.strokeStyle='rgba(0,0,0,0.35)';g.lineWidth=0.5;for(let x=-7;x<9;x+=3){g.beginPath();g.moveTo(x,-7);g.lineTo(x,7);g.stroke();}g.strokeStyle='rgba(255,220,180,0.25)';g.beginPath();g.moveTo(-9,0);g.lineTo(9,0);g.stroke();g.restore();}
  const fx=cx+ca*edge*0.62,fy=cy+sa*edge*0.62;
  g.fillStyle='rgba(0,0,0,0.4)';g.fillRect(fx-12,fy-11,30,30);
  g.fillStyle='#6d685d';g.fillRect(fx-15,fy-15,30,30);g.fillStyle='#57534a';g.fillRect(fx-10,fy-10,20,20);
  g.fillStyle='#7d786c';for(let i=0;i<5;i++){g.fillRect(fx-15+i*6.5,fy-17,4,3);g.fillRect(fx-15+i*6.5,fy+14,4,3);g.fillRect(fx-17,fy-15+i*6.5,3,4);g.fillRect(fx+14,fy-15+i*6.5,3,4);}
  g.strokeStyle='rgba(0,0,0,0.4)';g.lineWidth=0.6;for(let j=0;j<4;j++){g.beginPath();g.moveTo(fx-10,fy-10+j*5);g.lineTo(fx+10,fy-10+j*5);g.stroke();}
  rsTorch(g,fx-15,fy-15,14);rsTorch(g,fx+15,fy+15,14);
  g.strokeStyle='#1e140c';g.lineWidth=2;g.beginPath();g.moveTo(fx,fy);g.lineTo(fx,fy-30);g.stroke();g.fillStyle='#c9a24a';g.fillRect(fx,fy-30,16,10);g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(fx,fy-25,16,5);
 }
 // directional light: warm top-left, shadowed bottom-right
 g.save();shape(1,0,1.2);g.clip();const gr=g.createLinearGradient(cx-R0*0.7,cy-R0*0.7,cx+R0*0.7,cy+R0*0.7);gr.addColorStop(0,'rgba(255,215,160,0.10)');gr.addColorStop(0.55,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,0.30)');g.fillStyle=gr;g.fillRect(0,0,S,S);g.restore();
 o.canvas=c;o.half=S/2;
}
renderIsland=rsRenderIsland;
// ---- forts: cached stone star fort (intact / breached), live guns on wooden carriages
function rsFortSprite(ok){const k=ok?'fo':'fb';if(RS[k])return RS[k];const K=clamp(dpr*1.3,2,3.6),H=70,c=document.createElement('canvas');c.width=c.height=Math.ceil(H*2*K);const g=c.getContext('2d');g.scale(K,K);g.translate(H,H);const R=rsRng(ok?11:29);
 const star=(s)=>{g.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU,r=(i%2?40:52)*s;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();};
 g.save();g.translate(4,5);g.filter='blur(3px)';star(1.02);g.fillStyle='rgba(0,0,0,0.5)';g.fill();g.restore();g.filter='none';
 star(1.04);g.fillStyle='#3f3b34';g.fill();star(1);g.fillStyle=ok?'#77726a':'#6a5d4e';g.fill();
 g.save();star(1);g.clip();for(let y=-56;y<56;y+=5)for(let x=-56+((y/5)%2?0:4);x<56;x+=8){g.fillStyle=rsHex(ok?'#7a756b':'#6b5e4f',R()*0.3,R()<0.6?[0,0,0]:[200,190,170]);g.fillRect(x+0.4,y+0.4,7.2,4.2);}
 for(let i=0;i<14;i++){const x=(R()-0.5)*90,y=(R()-0.5)*90,rr=6+R()*16;const gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(30,40,20,0.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}g.restore();
 star(1);g.strokeStyle='#2a2722';g.lineWidth=2.4;g.stroke();star(0.8);g.strokeStyle='rgba(0,0,0,0.35)';g.lineWidth=1.2;g.stroke();
 // courtyard + keep
 g.fillStyle='#4e4436';g.fillRect(-24,-24,48,48);g.fillStyle='rgba(0,0,0,0.3)';g.fillRect(-24,-24,48,4);
 g.fillStyle=ok?'#8a857a':'#6f6252';g.fillRect(-18,-18,36,36);g.fillStyle=ok?'#9a9488':'#7a6b5a';for(let i=0;i<6;i++){g.fillRect(-18+i*6.4,-21,4,3.5);g.fillRect(-18+i*6.4,17.5,4,3.5);g.fillRect(-21,-18+i*6.4,3.5,4);g.fillRect(17.5,-18+i*6.4,3.5,4);}
 g.strokeStyle='rgba(0,0,0,0.4)';g.lineWidth=0.6;for(let j=-18;j<18;j+=6){g.beginPath();g.moveTo(-18,j);g.lineTo(18,j);g.stroke();}
 g.fillStyle='rgba(0,0,0,0.25)';g.fillRect(-18,4,36,14);
 if(!ok){g.fillStyle='#3a2e22';for(let i=0;i<7;i++){g.beginPath();g.arc(-30+R()*60,-34+R()*68,3+R()*5,0,TAU);g.fill();}g.fillStyle='rgba(20,14,10,0.6)';g.beginPath();g.ellipse(22,-8,10,7,0.5,0,TAU);g.fill();}
 for(const [x,y] of [[-46,0],[46,0],[0,-46],[0,46]])rsTorch(g,x*0.82,y*0.82,ok?16:9);
 return RS[k]=c;}
function rsDrawForts(x0,x1,y0,y1,ts){for(const f of FORTS){if(f.x<x0-120||f.x>x1+120||f.y<y0-120||f.y>y1+120)continue;const rt=FRT[f.id],own=fortOwner(f),col=own==='p'?'#5be36a':CLANS[own].col;
 const wallOk=!rt||rt.wall>0;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.drawImage(rsFortSprite(wallOk),-70,-70,140,140);ctx.restore();
 ctx.strokeStyle='#1e140c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-46);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(f.x,f.y-46);ctx.lineTo(f.x+24,f.y-40+Math.sin(ts*3+f.id)*2);ctx.lineTo(f.x,f.y-32);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.45)';ctx.lineWidth=0.8;ctx.stroke();
 const guns=rt?rt.guns:null;if(guns)for(const g of guns){ctx.save();ctx.translate(g.x,g.y);if(g.hp>0){ctx.rotate(g.aim);ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(-7,-6,16,14);ctx.fillStyle='#4a3420';ctx.fillRect(-8,-7,15,14);ctx.fillStyle='#2b1d10';ctx.fillRect(-8,-7,15,2);ctx.fillRect(-8,5,15,2);
   ctx.fillStyle='#1d1b19';ctx.fillRect(-2,-3.6,20,7.2);ctx.fillStyle='#34312d';ctx.fillRect(15,-4.4,4,8.8);ctx.fillStyle='rgba(255,255,255,0.16)';ctx.fillRect(0,-2.6,16,1.4);}
  else{ctx.fillStyle='rgba(40,30,20,0.8)';ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();if(Math.random()<0.05)addPart('smoke',g.x,g.y,0,-15,1,7,null);}ctx.restore();}
 const s=S.forts[f.id];if(s&&s.atk){ctx.strokeStyle=`rgba(127,211,255,${0.4+0.4*Math.sin(ts*5)})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,80,0,TAU);ctx.stroke();}}}
drawForts=rsDrawForts;
// ---- loot: drawn crate / coin pouch instead of emoji
function rsLootSprite(k){const key='l'+k;if(RS[key])return RS[key];const K=3,c=document.createElement('canvas');c.width=c.height=36*K;const g=c.getContext('2d');g.scale(K,K);g.translate(18,18);
 g.fillStyle='rgba(0,0,0,0.35)';g.beginPath();g.ellipse(2,4,12,8,0,0,TAU);g.fill();
 if(k){g.fillStyle='#6b4c2e';g.fillRect(-10,-10,20,20);g.strokeStyle='#2a1c10';g.lineWidth=1.6;g.strokeRect(-10,-10,20,20);g.strokeStyle='#3e2a18';g.lineWidth=1.2;g.beginPath();g.moveTo(-10,-10);g.lineTo(10,10);g.moveTo(-10,-3.3);g.lineTo(10,-3.3);g.moveTo(-10,3.3);g.lineTo(10,3.3);g.stroke();g.fillStyle='rgba(255,230,190,0.15)';g.fillRect(-9,-9,18,2);g.fillStyle='#8a8478';for(const [x,y] of [[-9,-9],[7,-9],[-9,7],[7,7]])g.fillRect(x,y,2,2);}
 else{g.fillStyle='#6a4a2a';g.beginPath();g.moveTo(-9,-2);g.quadraticCurveTo(-12,11,0,11);g.quadraticCurveTo(12,11,9,-2);g.quadraticCurveTo(4,-7,0,-6);g.quadraticCurveTo(-4,-7,-9,-2);g.fill();g.strokeStyle='#2a1c10';g.lineWidth=1.2;g.stroke();
  g.strokeStyle='#c9a24a';g.lineWidth=1.6;g.beginPath();g.moveTo(-5,-5);g.lineTo(5,-5);g.stroke();g.fillStyle='#d9b45a';for(const [x,y] of [[-3,-9],[2,-10],[5,-7]]){g.beginPath();g.arc(x,y,2.6,0,TAU);g.fill();g.strokeStyle='#8a6a20';g.lineWidth=0.6;g.stroke();}g.fillStyle='rgba(255,230,190,0.18)';g.beginPath();g.ellipse(-4,2,2.5,4,0.3,0,TAU);g.fill();}
 return RS[key]=c;}
function rsDrawLoot(l,ts){const bob=Math.sin(ts*3+l.x)*3;ctx.fillStyle='rgba(215,230,232,0.16)';ctx.beginPath();ctx.arc(l.x,l.y,16+Math.sin(ts*4)*3,0,TAU);ctx.fill();ctx.drawImage(rsLootSprite(Object.keys(l.goods).length?1:0),l.x-15,l.y-15+bob,30,30);}
