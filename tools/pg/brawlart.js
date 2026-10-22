// ---------------- rendering (v2: grittier, painted top-down look) ----------------
// Everything below is presentation only: it reads brawl state, never changes gameplay/hitboxes.
const EMO_RE=/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{27BF}\u{2900}-\u{297F}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu;
function noEmo(s){return String(s==null?'':s).replace(EMO_RE,'').replace(/\s{2,}/g,' ').trim();}
function deEmo(root,sels){if(!root)return;for(const sel of sels)for(const el of root.querySelectorAll(sel)){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n,first=true;while((n=w.nextNode())){let v=n.nodeValue.replace(EMO_RE,'').replace(/\s{2,}/g,' ');if(first){v=v.replace(/^\s+/,'');first=false;}n.nodeValue=v;}}}
function prng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hx3(h){h=String(h||'#777').replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');const n=parseInt(h,16)||0;return[(n>>16)&255,(n>>8)&255,n&255];}
function mixc(a,b,t){const A=hx3(a),B=hx3(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const BSPR={};
function bsprite(k){if(BSPR[k])return BSPR[k];const c=document.createElement('canvas'),g=c.getContext('2d');let gr;
 if(k==='shadow'){c.width=c.height=64;gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(0.55,'rgba(0,0,0,.24)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
 else if(k==='glow'){c.width=c.height=128;gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,205,130,.95)');gr.addColorStop(0.22,'rgba(255,150,60,.42)');gr.addColorStop(1,'rgba(255,110,30,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}
 else if(k==='smoke'||k==='dust'){c.width=c.height=96;const R=prng(k==='smoke'?7:11),col=k==='smoke'?'185,180,170':'120,100,75';for(let i=0;i<9;i++){const x=28+R()*40,y=28+R()*40,r=14+R()*18;gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${col},.32)`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(0,0,96,96);}}
 BSPR[k]=c;return c;}
let VIG=null,VIGK='';
function vignette(){const k=vw+'x'+vh;if(VIGK===k&&VIG)return VIG;const c=document.createElement('canvas'),w=c.width=Math.max(2,Math.round(vw/2)),h=c.height=Math.max(2,Math.round(vh/2)),g=c.getContext('2d');
 let gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,140,60,.11)');gr.addColorStop(0.45,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(20,28,55,.18)');g.fillStyle=gr;g.fillRect(0,0,w,h);
 gr=g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.32,w/2,h/2,Math.hypot(w,h)*0.62);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(5,4,3,.56)');g.fillStyle=gr;g.fillRect(0,0,w,h);VIG=c;VIGK=k;return c;}
// ---- looks: muted, period-appropriate palettes, faction accents ----
const SKINS=['#c69a78','#b0805d','#8a5a3b','#d6ae8e','#a06d4c','#6a4530','#c08d6a'];
function facAcc(){const e=BR.e;if(BR.mode==='fort'&&BR.f)return mixc((CLANS[BR.f.clan]||{col:'#777'}).col,'#4a443c',0.35);if(e&&(e.kind==='clan'||e.lead))return mixc(CLANS[e.clan|0].col,'#4a443c',0.3);return null;}
function lookOf(u){if(u.lk)return u.lk;const id=(u.id|0)+1,R=prng(id*977+13);
 const L={skin:SKINS[id%SKINS.length],coat:'#5a4632',shirt:'#b3a68a',hat:'band',hatc:'#5a2a22',trim:'',wpn:'cutlass',tail:0,cape:'',ep:0,armor:0,sc:1,beard:R()<0.5,hair:['#2a1d14','#3b2a1c','#1a1512','#5a4030'][id%4],xbelt:'',sash:'',feather:0,vest:'',pist:(u.maxShots|0)>0,bombs:0,bare:0};
 const e=BR.e,fa=facAcc();
 if(u.side===0){if(u===BR.me)Object.assign(L,{coat:'#3e1c17',shirt:'#c7b996',sash:'#7a5a22',hat:'tricorn',hatc:'#16120f',trim:'#a3843e',tail:1,wpn:'saber',beard:true,skin:'#b98a66',pist:true});
  else{const P=[['#5e4330','#b3a68a'],['#3c4a5c','#a69c84'],['#6e362c','#b1a487'],['#4a4134','#bfb397'],['#55534d','#b3a68a'],['#2f2b27','#a89c80']][id%6];L.coat=P[0];L.shirt=P[1];const h=R();L.hat=h<0.55?'band':h<0.8?'cap':'bare';L.hatc=['#6a2a22','#384050','#5b4a2a','#262422','#4f5a3a'][id%5];L.wpn=R()<0.75?'cutlass':'axe';L.vest=R()<0.4?'#33261a':'';}}
 else{const kind=BR.mode==='fort'?'fort':e?(e.lev?'navy':e.lead?'clan':e.kind):'pirate';
  if(kind==='navy')Object.assign(L,{coat:'#232e48',shirt:'#c9c3b3',xbelt:'#d6d0bf',hat:u.cap?'bicorne':'shako',hatc:'#141518',trim:u.cap?'#a88a48':'',wpn:u.cap?'saber':'cutlass',tail:u.cap?1:0.6,beard:false});
  else if(kind==='merchant')Object.assign(L,{coat:u.cap?'#4a3a28':'#7c6e55',shirt:'#c6bca3',hat:u.cap?'tricorn':'cap',hatc:u.cap?'#2a221a':'#5a4a36',wpn:u.cap?'saber':R()<0.5?'club':'cutlass',tail:u.cap?1:0,vest:u.cap?'#5e4f33':''});
  else if(kind==='fort')Object.assign(L,{coat:'#3a3d34',shirt:'#a39b85',sash:fa||'#6a2a22',hat:u.cap?'bicorne':'morion',hatc:u.cap?'#181818':'#8a8e92',trim:u.cap?'#a88a48':'',wpn:u.cap?'saber':'cutlass',tail:u.cap?1:0.4,beard:R()<0.3});
  else if(kind==='clan')Object.assign(L,{coat:['#2e2925','#3a2c22','#2a2c2e'][id%3],shirt:'#a99d84',sash:fa||'#5a2a22',hat:u.cap?'tricorn':'band',hatc:u.cap?'#15110e':(fa||'#4a2a22'),trim:u.cap?(fa||''):'',wpn:u.cap?'saber':R()<0.7?'cutlass':'axe',tail:u.cap?1:0});
  else if(kind==='boss')Object.assign(L,{coat:'#1f1c1a',shirt:'#9c917a',sash:'#5a1a16',hat:'tricorn',hatc:'#0e0c0b',trim:'#8a7036',wpn:u.cap?'broad':'cutlass',tail:u.cap?1:0});
  else Object.assign(L,{coat:['#5a2a22','#3a2e26','#4a3a2a','#2c2826'][id%4],shirt:'#a99d84',hat:u.cap?'tricorn':R()<0.7?'band':'bare',hatc:['#2a2420','#6a2a22','#3a3a3a'][id%3],wpn:u.cap?'saber':R()<0.7?'cutlass':'axe',tail:u.cap?1:0});
  const B=u.boss;
  if(B==='shadow')Object.assign(L,{coat:'#141318',shirt:'#2a2630',cape:'#1b1922',sash:'#4b3a63',hat:'wide',hatc:'#0d0c10',trim:'#5d5072',wpn:'black',tail:1,feather:1,beard:true,hair:'#0d0c0c',skin:'#a87e62'});
  else if(B==='flame')Object.assign(L,{coat:'#4e1813',shirt:'#8a7a62',sash:'#b0521c',hat:'tricorn',hatc:'#220b08',trim:'#b07028',wpn:'ember',tail:1,bombs:1,beard:true,hair:'#5a2412'});
  else if(B==='iron')Object.assign(L,{coat:'#3b3d40',armor:1,hat:'morion',hatc:'#8e9297',wpn:'hammer',tail:0,beard:true,sc:1.05,sash:''});
  else if(B==='serpent')Object.assign(L,{coat:'#26331f',shirt:'#9c8f6c',sash:'#a8862c',hat:'turban',hatc:'#3a4a2a',trim:'#b8932f',wpn:'rapier',tail:1,pist:true,beard:false});
  else if(B==='brute')Object.assign(L,{coat:'#3a2e24',vest:'#2a2018',hat:'band',hatc:'#1a1715',wpn:'axe',sc:1.08,bare:1,beard:true});
  else if(B==='admiral')Object.assign(L,{coat:'#1b2540',shirt:'#d0cab8',hat:'bicorne',hatc:'#111317',trim:'#d6d0bf',ep:1,cape:'#4a1616',wpn:'saber',tail:1,xbelt:'#d6d0bf',beard:false});}
 if(u.boss)L.sc=Math.max(L.sc,1.12)*(u.boss==='brute'||u.boss==='iron'?1.05:1);L.coatD=mixc(L.coat,'#000',0.32);L.coatH=mixc(L.coat,'#fff',0.14);L.hatH=mixc(L.hatc,'#fff',0.2);L.hatD=mixc(L.hatc,'#000',0.35);L.sleeve=L.bare?L.skin:mixc(L.coat,'#000',0.12);
 u.lk=L;return L;}
function ell(g,x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,TAU);g.fill();}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
function drawBlade(g,x,y,a,type,r){const c=Math.cos(a),s=Math.sin(a),px=-s,py=c;
 if(type==='axe'||type==='hammer'||type==='club'){const len=r*(type==='club'?1.15:1.35);g.strokeStyle=type==='club'?'#5a3d24':'#4a3220';g.lineWidth=r*(type==='club'?0.24:0.14);g.beginPath();g.moveTo(x-c*r*0.15,y-s*r*0.15);g.lineTo(x+c*len,y+s*len);g.stroke();
  if(type==='axe'){const hx=x+c*len*0.9,hy=y+s*len*0.9;g.fillStyle='#7d8288';g.beginPath();g.moveTo(hx-c*r*0.12,hy-s*r*0.12);g.lineTo(hx+px*r*0.62-c*r*0.2,hy+py*r*0.62-s*r*0.2);g.quadraticCurveTo(hx+px*r*0.75+c*r*0.15,hy+py*r*0.75+s*r*0.15,hx+px*r*0.5+c*r*0.32,hy+py*r*0.5+s*r*0.32);g.lineTo(hx+c*r*0.12,hy+s*r*0.12);g.closePath();g.fill();g.strokeStyle='#c9ced4';g.lineWidth=0.8;g.stroke();}
  else if(type==='hammer'){const hx=x+c*len,hy=y+s*len;g.fillStyle='#55595e';g.save();g.translate(hx,hy);g.rotate(a);g.fillRect(-r*0.22,-r*0.42,r*0.44,r*0.84);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(-r*0.22,-r*0.42,r*0.44,r*0.12);g.restore();}
  return;}
 const len=r*({cutlass:1.55,saber:1.75,rapier:2.05,black:2.1,ember:1.7,broad:1.7}[type]||1.55),cv=type==='rapier'?0:type==='black'?0.16:0.11,w=r*({rapier:0.07,ember:0.2,broad:0.2,black:0.13}[type]||0.14);
 const ex=x+c*len,ey=y+s*len,mx=x+c*len*0.55+px*len*cv,my=y+s*len*0.55+py*len*cv;
 g.lineCap='round';g.strokeStyle=type==='black'?'#25262d':type==='ember'?'#4e4944':'#8d939b';g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx,my,ex,ey);g.stroke();
 g.strokeStyle=type==='black'?'rgba(150,135,190,.75)':type==='ember'?'rgba(255,130,40,.9)':'#e4e8ec';g.lineWidth=Math.max(0.7,w*0.32);g.beginPath();g.moveTo(x+px*w*0.3,y+py*w*0.3);g.quadraticCurveTo(mx+px*w*0.3,my+py*w*0.3,ex,ey);g.stroke();
 g.strokeStyle=type==='rapier'||type==='saber'?'#b39a55':'#6e5a32';g.lineWidth=r*0.1;g.beginPath();g.moveTo(x+px*r*0.24,y+py*r*0.24);g.lineTo(x-px*r*0.24,y-py*r*0.24);g.stroke();
 if(type==='rapier'){g.strokeStyle='#b39a55';g.lineWidth=0.9;g.beginPath();g.arc(x+c*r*0.08,y+s*r*0.08,r*0.2,0,TAU);g.stroke();}}
function drawPistol(g,x,y,r){g.fillStyle='#3b2a1c';ell(g,x-r*0.08,y,r*0.16,r*0.1);g.strokeStyle='#26272a';g.lineWidth=r*0.13;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(x+r*0.62,y);g.stroke();g.strokeStyle='rgba(200,205,210,.35)';g.lineWidth=0.6;g.beginPath();g.moveTo(x+r*0.05,y-r*0.03);g.lineTo(x+r*0.6,y-r*0.03);g.stroke();}
function arm(g,sx,sy,hx,hy,col,skin,r){g.lineCap='round';g.strokeStyle=col;g.lineWidth=r*0.34;g.beginPath();g.moveTo(sx,sy);g.lineTo(hx,hy);g.stroke();g.fillStyle=skin;circ(g,hx,hy,r*0.16);}
function drawHat(g,L,hx,r,ts){const hc=L.hatc;g.lineWidth=1;
 switch(L.hat){
  case 'tricorn':g.fillStyle=hc;g.beginPath();g.moveTo(hx+r*0.8,0);g.quadraticCurveTo(hx+r*0.12,-r*0.52,hx-r*0.52,-r*0.74);g.quadraticCurveTo(hx-r*0.34,0,hx-r*0.52,r*0.74);g.quadraticCurveTo(hx+r*0.12,r*0.52,hx+r*0.8,0);g.closePath();g.fill();if(L.trim){g.strokeStyle=L.trim;g.stroke();}g.fillStyle=L.hatH;circ(g,hx-r*0.04,0,r*0.3);break;
  case 'bicorne':g.fillStyle=hc;ell(g,hx-r*0.06,0,r*0.36,r*0.95);if(L.trim){g.strokeStyle=L.trim;g.beginPath();g.ellipse(hx-r*0.06,0,r*0.36,r*0.95,0,0,TAU);g.stroke();}g.fillStyle=L.hatH;ell(g,hx-r*0.06,0,r*0.2,r*0.42);if(L.ep){g.fillStyle='#b8963e';circ(g,hx+r*0.18,-r*0.5,r*0.08);}break;
  case 'wide':g.fillStyle=hc;circ(g,hx,0,r*0.86);if(L.trim){g.strokeStyle=L.trim;g.beginPath();g.arc(hx,0,r*0.86,0,TAU);g.stroke();}g.fillStyle=L.hatH;circ(g,hx-r*0.04,0,r*0.38);if(L.feather){g.strokeStyle='#3c3646';g.lineWidth=r*0.16;g.lineCap='round';g.beginPath();g.moveTo(hx,-r*0.3);g.quadraticCurveTo(hx-r*0.7,-r*0.75,hx-r*1.25,-r*0.35+Math.sin(ts*3)*r*0.08);g.stroke();}break;
  case 'shako':g.fillStyle=hc;circ(g,hx-r*0.02,0,r*0.44);g.fillStyle='#a88a48';g.fillRect(hx+r*0.22,-r*0.12,r*0.16,r*0.24);break;
  case 'morion':g.fillStyle=hc;ell(g,hx,0,r*0.66,r*0.5);g.strokeStyle=L.hatD;g.beginPath();g.ellipse(hx,0,r*0.66,r*0.5,0,0,TAU);g.stroke();g.strokeStyle='rgba(235,240,245,.55)';g.lineWidth=r*0.1;g.beginPath();g.moveTo(hx-r*0.5,0);g.lineTo(hx+r*0.5,0);g.stroke();g.fillStyle='rgba(255,255,255,.18)';ell(g,hx-r*0.12,-r*0.22,r*0.2,r*0.1);break;
  case 'band':g.fillStyle=hc;g.beginPath();g.arc(hx-r*0.02,0,r*0.47,Math.PI*0.42,Math.PI*1.58);g.closePath();g.fill();{const s=Math.sin(ts*4+hx)*r*0.06;g.beginPath();g.moveTo(hx-r*0.4,-r*0.08);g.lineTo(hx-r*0.95,-r*0.24+s);g.lineTo(hx-r*0.85,-r*0.02+s);g.closePath();g.fill();g.beginPath();g.moveTo(hx-r*0.4,r*0.06);g.lineTo(hx-r*0.9,r*0.22+s);g.lineTo(hx-r*0.78,r*0.04+s);g.closePath();g.fill();}g.fillStyle=L.hatD;g.beginPath();g.arc(hx-r*0.02,0,r*0.47,Math.PI*0.42,Math.PI*0.62);g.lineTo(hx,0);g.fill();break;
  case 'cap':g.fillStyle=hc;circ(g,hx-r*0.06,0,r*0.42);g.strokeStyle=L.hatD;g.lineWidth=r*0.1;g.beginPath();g.arc(hx-r*0.06,0,r*0.36,-1.4,1.4);g.stroke();break;
  case 'turban':g.fillStyle=hc;circ(g,hx-r*0.02,0,r*0.54);g.strokeStyle=L.hatH;g.lineWidth=r*0.08;g.beginPath();g.arc(hx-r*0.02,0,r*0.38,-2.2,1.2);g.stroke();g.beginPath();g.arc(hx-r*0.02,0,r*0.22,0.4,3.6);g.stroke();g.fillStyle='#c9a43a';circ(g,hx+r*0.42,0,r*0.09);break;
  default:g.fillStyle=L.hair;circ(g,hx-r*0.1,0,r*0.4);}}
function drawBodyParts(g,L,r,u){const sw=r*0.92,TA=TAU;
 if(L.cape){g.fillStyle=L.cape;g.beginPath();g.moveTo(r*0.1,-sw*0.95);g.quadraticCurveTo(-r*1.2,-sw*1.3,-r*2.05,-sw*0.72);g.quadraticCurveTo(-r*2.3,0,-r*2.05,sw*0.72);g.quadraticCurveTo(-r*1.2,sw*1.3,r*0.1,sw*0.95);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;g.stroke();g.strokeStyle='rgba(255,255,255,.06)';g.beginPath();g.moveTo(-r*0.4,-sw*0.4);g.quadraticCurveTo(-r*1.3,-sw*0.2,-r*1.9,-sw*0.3);g.moveTo(-r*0.4,sw*0.35);g.quadraticCurveTo(-r*1.3,sw*0.25,-r*1.95,sw*0.4);g.stroke();}
 if(L.tail){const len=r*(0.7+0.55*L.tail);g.fillStyle=L.coatD;g.beginPath();g.moveTo(-r*0.1,-sw*0.75);g.lineTo(-len,-sw*0.6);g.lineTo(-len*0.86,0);g.lineTo(-len,sw*0.6);g.lineTo(-r*0.1,sw*0.75);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=0.8;g.beginPath();g.moveTo(-r*0.3,0);g.lineTo(-len*0.86,0);g.stroke();}
 g.fillStyle=L.coat;ell(g,0,0,r*0.56,sw);g.fillStyle='rgba(0,0,0,.24)';ell(g,-r*0.15,0,r*0.42,sw*0.9);g.fillStyle=L.coatH;ell(g,r*0.16,-sw*0.32,r*0.24,sw*0.34);
 if(L.vest){g.fillStyle=L.vest;ell(g,r*0.12,0,r*0.36,sw*0.62);}
 if(L.armor){g.fillStyle='#767b81';ell(g,r*0.04,0,r*0.5,sw*0.8);g.fillStyle='rgba(255,255,255,.2)';ell(g,r*0.14,-sw*0.3,r*0.2,sw*0.28);g.fillStyle='#2e3033';for(const yy of [-0.6,-0.2,0.2,0.6])circ(g,r*0.36,sw*yy,0.9);}
 else{g.fillStyle=L.shirt;g.beginPath();g.moveTo(r*0.52,-sw*0.3);g.lineTo(r*0.12,0);g.lineTo(r*0.52,sw*0.3);g.closePath();g.fill();}
 g.lineCap='butt';if(L.sash){g.strokeStyle=L.sash;g.lineWidth=r*0.16;g.beginPath();g.moveTo(r*0.32,-sw*0.72);g.lineTo(-r*0.32,sw*0.72);g.stroke();}
 if(L.xbelt){g.strokeStyle=L.xbelt;g.lineWidth=r*0.11;g.beginPath();g.moveTo(r*0.32,-sw*0.7);g.lineTo(-r*0.3,sw*0.7);g.moveTo(r*0.32,sw*0.7);g.lineTo(-r*0.3,-sw*0.7);g.stroke();}
 if(L.bombs){g.fillStyle='#1d1d1f';circ(g,-r*0.3,-sw*0.5,r*0.13);circ(g,-r*0.36,-sw*0.2,r*0.13);g.strokeStyle='#a0722a';g.lineWidth=0.7;g.beginPath();g.moveTo(-r*0.3,-sw*0.5-r*0.13);g.lineTo(-r*0.26,-sw*0.5-r*0.24);g.stroke();}
 if(L.ep){g.fillStyle='#b8963e';ell(g,0,-sw*0.86,r*0.22,r*0.27);ell(g,0,sw*0.86,r*0.22,r*0.27);}
 g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1;g.beginPath();g.ellipse(0,0,r*0.56,sw,0,0,TA);g.stroke();
 if(u.boss==='iron'){const sx=r*0.68,sy=-sw*0.36;g.fillStyle='#5f6469';circ(g,sx,sy,r*0.74);g.strokeStyle='#2c2f33';g.lineWidth=2;g.beginPath();g.arc(sx,sy,r*0.74,0,TAU);g.stroke();g.fillStyle='#a6abb1';circ(g,sx,sy,r*0.15);g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=1.2;g.beginPath();g.arc(sx,sy,r*0.6,-2.6,-1.2);g.stroke();}
 const hx=r*0.06;g.fillStyle=L.skin;circ(g,hx,0,r*0.46);if(L.beard){g.fillStyle=L.hair;g.beginPath();g.arc(hx+r*0.2,0,r*0.3,-1.25,1.25);g.closePath();g.fill();}
 drawHat(g,L,hx,r,0);}
function bodySprite(L,r,u){if(L.spr&&L.sprR===r)return L.spr;const K=2.6,x0=-2.45*r,x1=1.6*r,y0=-1.5*r,y1=1.5*r,c=document.createElement('canvas');c.width=Math.ceil((x1-x0)*K);c.height=Math.ceil((y1-y0)*K);const g=c.getContext('2d');g.scale(K,K);g.translate(-x0,-y0);drawBodyParts(g,L,r,u);L.spr=c;L.sprR=r;L.sprB=[x0,y0,x1-x0,y1-y0];return c;}
function drawFigure(g,x,y,face,r,L,u,walk,scl,ts){const sw=r*0.92;
 g.save();g.translate(x,y);g.rotate(face+walk*0.05);if(scl&&scl!==1)g.scale(scl,scl);
 g.fillStyle='#1b1511';const st=walk*r*0.42;ell(g,st+r*0.05,-r*0.32,r*0.3,r*0.16);ell(g,-st+r*0.05,r*0.32,r*0.3,r*0.16);
 const dir=(u.combo%2)?1:-1;let a=0.35,hxr,hyr;const blk=u.blk;
 if(blk){a=-1.45;hxr=r*0.7;hyr=sw*0.42;}
 else{if(u.swing>0){const p=clamp(u.swing/(u.sw0||0.3),0,1);a=dir*(1.15+0.45*p);}else if(u.comboT>0.35){const q=clamp((0.55-u.comboT)/0.2,0,1);a=-dir*(0.2+0.95*q);}
  if(u.cheer!=null)a=-0.4+Math.sin(u.cheer)*1.0;const aa=a*0.55;hxr=Math.cos(aa)*r*0.8;hyr=sw*0.78+Math.sin(aa)*r*0.8;}
 const shot=u.shotT!=null&&BR.t-u.shotT<0.35;let ohx=r*0.42,ohy=-sw*0.95;if(L.pist&&shot){ohx=r*1.05;ohy=-sw*0.28;}else if(blk){ohx=r*0.55;ohy=-sw*0.5;}else if(walk)ohx+=walk*r*0.25;
 arm(g,0,-sw*0.78,ohx,ohy,L.sleeve,L.skin,r);if(L.pist&&((u.shots|0)>0||shot))drawPistol(g,ohx,ohy,r);
 const sp=bodySprite(L,r,u),B=L.sprB;g.drawImage(sp,B[0],B[1],B[2],B[3]);
 arm(g,0,sw*0.78,hxr,hyr,L.sleeve,L.skin,r);drawBlade(g,hxr,hyr,a,L.wpn,r);g.fillStyle=L.skin;circ(g,hxr,hyr,r*0.15);
 g.restore();}
function drawUnit(g,u,ts){if(u.dead)return;const L=lookOf(u),r=u.r*L.sc;
 if(u.over){const k=u.over;g.strokeStyle='rgba(215,228,235,.4)';g.lineWidth=1.2;for(let i=0;i<2;i++){const rr=r*(0.9+((ts*1.3+i*0.5)%1)*1.4);g.beginPath();g.ellipse(u.x,u.y,rr,rr*0.7,0,0,TAU);g.stroke();}
  g.fillStyle='rgba(10,25,35,.5)';ell(g,u.x,u.y,r*0.9,r*0.65);g.fillStyle=L.skin;circ(g,u.x,u.y,r*0.42);drawHat(g,L,u.x,r*0.85,ts);
  g.strokeStyle=L.sleeve;g.lineWidth=r*0.26;g.lineCap='round';const s=Math.sin(ts*9+k*3);g.beginPath();g.moveTo(u.x-r*0.4,u.y);g.lineTo(u.x-r*0.9,u.y-r*0.5*s);g.moveTo(u.x+r*0.4,u.y);g.lineTo(u.x+r*0.9,u.y+r*0.5*s);g.stroke();return;}
 const fade=u.fade>0,A0=fade?0.18:1;g.globalAlpha=A0;
 const mv=Math.hypot(u.inp.mx,u.inp.my)>0.1||Math.hypot(u.vx,u.vy)>30;
 let x=u.x,y=u.y;if(u.hitT>0){x-=Math.cos(u.face)*2.4;y-=Math.sin(u.face)*2.4;}
 if(!BR.lq)g.drawImage(bsprite('shadow'),x-r*1.45+3,y-r*1.2+5,r*2.9,r*2.4);
 if(u===BR.me||u.cap){g.strokeStyle=u===BR.me?'rgba(214,180,100,.8)':(u.side?'rgba(160,48,38,.75)':'rgba(214,180,100,.5)');g.lineWidth=1.3;g.beginPath();g.ellipse(x,y+2,r*1.4,r*1.08,0,0,TAU);g.stroke();}
 if(u.dodge>0){g.globalAlpha=A0*0.22;drawFigure(g,x-u.ddx*12,y-u.ddy*12,u.face,r,L,u,0,0.86,ts);g.globalAlpha=A0;}
 drawFigure(g,x,y,u.face,r,L,u,mv?Math.sin(u.anim*11):0,u.dodge>0?0.86:1,ts);
 if(u.hitT>0){g.globalAlpha=A0*Math.min(1,u.hitT*4)*0.35;g.fillStyle='#1a0806';circ(g,x,y,r*0.95);g.globalAlpha=A0;}
 if(u.swing>0&&u!==BR.me){g.strokeStyle=u.side?'rgba(196,62,42,.62)':'rgba(230,220,200,.32)';g.lineWidth=1.5;g.beginPath();g.arc(x,y,r+12,u.face-0.9,u.face+0.9);g.stroke();}
 if(u.blk){g.strokeStyle='rgba(205,215,225,.45)';g.lineWidth=1.4;g.beginPath();g.arc(x,y,r+5,u.face-1.0,u.face+1.0);g.stroke();}
 if(u.stun>0){g.fillStyle='rgba(235,225,200,.85)';for(let i=0;i<3;i++){const a=ts*5+i*TAU/3;circ(g,x+Math.cos(a)*r*0.8,y-r*1.05+Math.sin(a)*r*0.32,1.4);}}
 if(u.cap||u.hp<u.max*0.98){const w=u.cap?28:16,by=y-r-10;g.fillStyle='rgba(10,8,6,.72)';g.fillRect(x-w/2-1,by-1,w+2,4.5);g.fillStyle=u.side?'#a3302a':'#7f9a5c';g.fillRect(x-w/2,by,w*clamp(u.hp/u.max,0,1),2.5);}
 g.globalAlpha=1;}
function corpseParts(g,L,r,k,A){const sw=r*0.92;g.drawImage(bsprite('shadow'),-r*2,-r*1.2,r*3.6,r*2.4);
 g.strokeStyle=L.coatD;g.lineWidth=r*0.3;g.lineCap='round';g.beginPath();g.moveTo(r*0.1,-r*0.25);g.lineTo(r*(0.4+0.6*k),-r*0.42);g.moveTo(r*0.1,r*0.25);g.lineTo(r*(0.4+0.55*k),r*0.36);g.stroke();
 g.fillStyle='#1b1511';ell(g,r*(0.5+0.6*k),-r*0.42,r*0.18,r*0.14);ell(g,r*(0.5+0.55*k),r*0.36,r*0.18,r*0.14);
 g.fillStyle=L.coat;ell(g,-r*0.3*k,0,r*(0.56+0.25*k),sw*0.9);
 g.strokeStyle=L.sleeve;g.lineWidth=r*0.3;g.beginPath();g.moveTo(-r*0.3,-sw*0.7);g.lineTo(-r*(0.4+0.5*k),-sw*(0.8+0.5*k));g.moveTo(-r*0.3,sw*0.7);g.lineTo(-r*(0.2+0.3*k),sw*(0.8+0.6*k));g.stroke();
 g.fillStyle=L.skin;circ(g,-r*(0.25+0.85*k),0,r*0.44);g.fillStyle=L.hair;circ(g,-r*(0.32+0.88*k),0,r*0.3);
 if(L.hat!=='bare'){g.fillStyle=L.hatc;ell(g,-r*(0.6+1.3*k),sw*(0.3+0.6*k),r*0.42,r*0.3,0.6);}
 if(L.wpn){g.save();drawBlade(g,r*0.1,sw*(1.0+0.4*k),0.9,L.wpn,r);g.restore();}
 g.fillStyle='rgba(0,0,0,.2)';ell(g,-r*0.3,0,r*1.0,sw*0.95);
 }
function drawCorpse(g,c,ts){const age=BR.t-c.t;if(age>12)return;const k=clamp(age/0.35,0,1),A=age>9?Math.max(0,1-(age-9)/3):1;const L=c.lk,r=c.r*L.sc;
 if(k>=1&&!c.spr){const K=2.4,x0=-2.6*r,x1=1.9*r,y0=-1.9*r,y1=3.2*r,cv=document.createElement('canvas');cv.width=Math.ceil((x1-x0)*K);cv.height=Math.ceil((y1-y0)*K);const q=cv.getContext('2d');q.scale(K,K);q.translate(-x0,-y0);corpseParts(q,L,r,1,1);c.spr=cv;c.sb=[x0,y0,x1-x0,y1-y0];}
 g.globalAlpha=A;g.save();g.translate(c.x,c.y);g.rotate(c.face);if(c.spr){g.translate(-r*0.45,0);g.drawImage(c.spr,c.sb[0],c.sb[1],c.sb[2],c.sb[3]);}else{g.translate(-k*r*0.45,0);corpseParts(g,L,r,k,A);}g.restore();g.globalAlpha=1;}
function drawTg(g,tg,ts){const k=clamp(tg.t/tg.T,0,1);const red=tg.ub?'178,34,26':'205,128,44';g.lineWidth=1.6;
 if(tg.k==='circle'||tg.k==='ring'){g.fillStyle=`rgba(${red},${0.1+0.22*k})`;g.strokeStyle=`rgba(${red},.85)`;g.beginPath();g.arc(tg.x,tg.y,tg.r,0,TAU);g.fill();g.stroke();g.lineWidth=2.4;g.beginPath();g.arc(tg.x,tg.y,tg.r*k,0,TAU);g.stroke();}
 else if(tg.k==='cone'){g.fillStyle=`rgba(${red},${0.1+0.22*k})`;g.beginPath();g.moveTo(tg.x,tg.y);g.arc(tg.x,tg.y,tg.r,tg.a-tg.sp,tg.a+tg.sp);g.closePath();g.fill();g.strokeStyle=`rgba(${red},.85)`;g.stroke();}
 else if(tg.k==='line'){g.save();g.translate(tg.x,tg.y);g.rotate(tg.a);g.fillStyle=`rgba(${red},${0.08+0.22*k})`;g.fillRect(0,-tg.w/2,tg.len,tg.w);g.strokeStyle=`rgba(${red},.6)`;g.lineWidth=1;g.strokeRect(0,-tg.w/2,tg.len,tg.w);g.fillStyle=`rgba(${red},.9)`;g.fillRect(0,-1,tg.len*k,2);g.restore();}}
function drawFx(g,f,ts){const k=f.t/f.T,q=1-k;
 if(f.k==='arc'){const a0=f.a-1.1,sp=2.2*Math.min(1,k*3+0.25);g.lineCap='round';g.strokeStyle=`rgba(210,220,230,${0.16*q})`;g.lineWidth=f.heavy?10:7;g.beginPath();g.arc(f.x,f.y,f.r-2,a0,a0+sp);g.stroke();g.strokeStyle=`rgba(232,238,244,${0.5*q})`;g.lineWidth=f.heavy?3:2;g.beginPath();g.arc(f.x,f.y,f.r,a0+sp*0.25,a0+sp);g.stroke();g.strokeStyle=`rgba(255,255,255,${0.85*q})`;g.lineWidth=1;g.beginPath();g.arc(f.x,f.y,f.r+1,a0+sp*0.6,a0+sp);g.stroke();}
 else if(f.k==='spark'){g.globalCompositeOperation='lighter';g.globalAlpha=q;g.drawImage(bsprite('glow'),f.x-10,f.y-10,20,20);g.lineWidth=1.2;g.lineCap='round';const n=f.big?9:6;for(let i=0;i<n;i++){const a=i*2.4+f.x*0.37,l=(f.big?18:11)*(0.3+k);g.strokeStyle=i%2?'rgba(255,225,150,.95)':'rgba(255,170,70,.9)';g.beginPath();g.moveTo(f.x+Math.cos(a)*l*0.4,f.y+Math.sin(a)*l*0.4);g.lineTo(f.x+Math.cos(a)*l,f.y+Math.sin(a)*l+k*4);g.stroke();}g.globalAlpha=1;g.globalCompositeOperation='source-over';}
 else if(f.k==='txt'){const s=noEmo(f.s);if(!s)return;const big=/PARRY|crit/i.test(s)||String(f.s).includes('\u{1F4A5}');g.globalAlpha=q;g.font=`${big?'bold 13px':'bold 11px'} Georgia,'Times New Roman',serif`;g.textAlign='center';const c=s.includes('PARRY')?'#ecd38c':s==='dodge!'?'#c8d6e0':f.c==='#ff8080'?'#d97a62':f.c==='#ffd27a'?'#e9dcb8':'#d8d0c0';g.strokeStyle='rgba(12,9,6,.85)';g.lineWidth=3;const t=s.includes('PARRY')?'PARRY':s;g.strokeText(t,f.x,f.y-k*16);g.fillStyle=c;g.fillText(t,f.x,f.y-k*16);g.globalAlpha=1;}
 else if(f.k==='shot'){if(!f.sm){f.sm=1;BR.fx.push({k:'smoke',x:f.x,y:f.y,t:0,T:1.3,big:1});}g.strokeStyle=`rgba(255,232,180,${0.75*q})`;g.lineWidth=1.1;g.beginPath();g.moveTo(f.x,f.y);g.lineTo(f.x2,f.y2);g.stroke();
  if(k<0.45){const a=Math.atan2(f.y2-f.y,f.x2-f.x),mx=f.x+Math.cos(a)*16,my=f.y+Math.sin(a)*16;g.globalCompositeOperation='lighter';g.drawImage(bsprite('glow'),mx-14,my-14,28,28);g.fillStyle='rgba(255,220,140,.9)';g.beginPath();g.moveTo(mx+Math.cos(a)*9,my+Math.sin(a)*9);g.lineTo(mx+Math.cos(a+1.6)*3,my+Math.sin(a+1.6)*3);g.lineTo(mx+Math.cos(a-1.6)*3,my+Math.sin(a-1.6)*3);g.closePath();g.fill();g.globalCompositeOperation='source-over';}}
 else if(f.k==='smoke'||f.k==='puff'||f.k==='dust'){const sz=(f.big?16:10)+k*(f.big?30:18);g.globalAlpha=(f.k==='puff'?0.45:0.7)*q;g.drawImage(bsprite(f.k==='dust'?'dust':'smoke'),f.x-sz+k*6,f.y-sz-k*10,sz*2,sz*2);g.globalAlpha=1;}
 else if(f.k==='poof'){g.globalAlpha=0.6*q;const sz=12+k*18;g.drawImage(bsprite('dust'),f.x-sz,f.y-sz,sz*2,sz*2);g.globalAlpha=1;}
 else if(f.k==='hit'){g.fillStyle=`rgba(58,14,10,${0.75*q})`;for(let i=0;i<5;i++){const a=f.a+(i-2)*0.35,d=4+k*(10+i*2);circ(g,f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,1.6*(1-k*0.5));}}
 else if(f.k==='boom'){g.globalCompositeOperation='lighter';g.globalAlpha=q;const s=f.r*(0.8+0.6*k);g.drawImage(bsprite('glow'),f.x-s,f.y-s,s*2,s*2);g.globalCompositeOperation='source-over';g.globalAlpha=0.8*q;const z=f.r*(0.6+k);g.drawImage(bsprite('smoke'),f.x-z,f.y-z,z*2,z*2);g.globalAlpha=1;
  g.strokeStyle=`rgba(40,30,22,${q})`;g.lineWidth=1.5;for(let i=0;i<7;i++){const a=i*0.9+f.x,d=f.r*(0.3+k*0.9);g.beginPath();g.moveTo(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d);g.lineTo(f.x+Math.cos(a)*(d+4),f.y+Math.sin(a)*(d+4));g.stroke();}}
 else if(f.k==='cone'){g.globalCompositeOperation='lighter';const gl=bsprite('glow');for(let i=1;i<=5;i++){const d=f.r*i/5.5,s=6+i*5;for(const o of [-0.5,0,0.5]){const a=f.a+o*f.sp;g.globalAlpha=0.45*q;g.drawImage(gl,f.x+Math.cos(a)*d-s,f.y+Math.sin(a)*d-s,s*2,s*2);}}g.globalAlpha=1;g.globalCompositeOperation='source-over';}
 else if(f.k==='splash'){g.strokeStyle=`rgba(225,235,240,${0.7*q})`;g.lineWidth=1.5;g.beginPath();g.ellipse(f.x,f.y,6+k*20,(6+k*20)*0.7,0,0,TAU);g.stroke();g.fillStyle=`rgba(225,235,240,${0.8*q})`;for(let i=0;i<6;i++){const a=i*1.05;circ(g,f.x+Math.cos(a)*(4+k*16),f.y+Math.sin(a)*(4+k*16)-Math.sin(k*Math.PI)*6,1.3);}}
 else if(f.k==='fin'){const x=f.x+Math.sin(k*6)*14;g.strokeStyle=`rgba(200,215,220,${0.4*q})`;g.lineWidth=1;g.beginPath();g.moveTo(x-14,f.y+10);g.lineTo(x,f.y+2);g.lineTo(x+14,f.y+10);g.stroke();g.fillStyle='#2c3640';g.beginPath();g.moveTo(x-7,f.y+5);g.quadraticCurveTo(x-1,f.y-6,x+3,f.y-12);g.lineTo(x+7,f.y+5);g.closePath();g.fill();}}
// ---- arena backgrounds (cached offscreen once per brawl) ----
function hullPath(g,y0,y1,d){d=d||0;const m=(y0+y1)/2;g.beginPath();g.moveTo(-205+d,y0+d);g.lineTo(175,y0+d);g.quadraticCurveTo(232-d*1.6,m,175,y1-d);g.lineTo(-205+d,y1-d);g.quadraticCurveTo(-222+d*1.6,m,-205+d,y0+d);g.closePath();}
function planks(g,R,x0,x1,y0,y1,base){const rh=11;for(let y=y0;y<y1;y+=rh){let x=x0-R()*60;while(x<x1){const len=55+R()*80;g.fillStyle=mixc(base,R()<0.5?'#000000':'#a08868',R()*0.24);g.fillRect(x,y,len,rh);
  g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=0.5;for(let k=0;k<3;k++){const yy=y+2+R()*(rh-4);g.beginPath();g.moveTo(x+2,yy);g.bezierCurveTo(x+len*0.3,yy+(R()-0.5)*2.6,x+len*0.7,yy+(R()-0.5)*2.6,x+len-2,yy+(R()-0.5));g.stroke();}
  g.strokeStyle='rgba(255,232,190,.06)';const yy=y+1.5+R()*(rh-3);g.beginPath();g.moveTo(x+4,yy);g.lineTo(x+len-4,yy+(R()-0.5));g.stroke();
  if(R()<0.16){g.fillStyle='rgba(28,16,8,.55)';ell(g,x+R()*len,y+rh/2,2.3,1.3);}
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x+len-0.6,y,1.2,rh);g.fillStyle='rgba(18,13,9,.9)';for(const nx of [x+3,x+len-4])for(const ny of [y+2.7,y+rh-2.7])circ(g,nx,ny,0.75);x+=len;}
 g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x0,y+rh-0.8,x1-x0,1.1);}}
function barrel(g,x,y,r){g.fillStyle='#4a321e';circ(g,x,y,r);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=0.6;for(let i=0;i<8;i++){const a=i*TAU/8;g.beginPath();g.moveTo(x+Math.cos(a)*r*0.3,y+Math.sin(a)*r*0.3);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.stroke();}g.strokeStyle='#26272a';g.lineWidth=1.4;g.beginPath();g.arc(x,y,r-0.8,0,TAU);g.stroke();g.beginPath();g.arc(x,y,r*0.55,0,TAU);g.stroke();g.fillStyle='rgba(255,235,200,.08)';circ(g,x-r*0.3,y-r*0.3,r*0.4);}
function crate(g,x,y,s,rot){g.save();g.translate(x,y);g.rotate(rot||0);g.fillStyle='#5b4430';g.fillRect(-s/2,-s/2,s,s);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=0.6;for(let i=1;i<4;i++){g.beginPath();g.moveTo(-s/2,-s/2+i*s/4);g.lineTo(s/2,-s/2+i*s/4);g.stroke();}g.strokeStyle='#2c2016';g.lineWidth=1.6;g.strokeRect(-s/2+0.8,-s/2+0.8,s-1.6,s-1.6);g.beginPath();g.moveTo(-s/2,-s/2);g.lineTo(s/2,s/2);g.stroke();g.restore();}
function coil(g,x,y,r){g.strokeStyle='#7d6844';g.lineWidth=1.3;for(let k=r;k>2;k-=2.2){g.beginPath();g.arc(x,y,k,0,TAU);g.stroke();}g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=0.5;for(let k=r-1.1;k>2;k-=2.2){g.beginPath();g.arc(x,y,k,0,TAU);g.stroke();}g.strokeStyle='#7d6844';g.lineWidth=1.3;g.beginPath();g.moveTo(x+r,y);g.quadraticCurveTo(x+r+8,y+4,x+r+12,y-3);g.stroke();}
function bgDeck(g,R){const L=BR.look||{};
 const decks=[[18,262,1,'#58402c','#21160e','#6e5530'],[-262,-18,-1,mixc(L.hull||'#6b4a2a','#3a2a1c',0.38),mixc(L.hull||'#6b4a2a','#120c08',0.6),mixc(L.trim||'#555555','#3a3a3a',0.45)]];
 for(const [y0,y1,o,wood,dark,trim] of decks){const m=(y0+y1)/2,yo=o>0?y1:y0;
  g.save();g.translate(5,7);hullPath(g,y0,y1);g.fillStyle='rgba(0,0,0,.38)';g.fill();g.restore();
  hullPath(g,y0,y1);g.strokeStyle='rgba(200,215,220,.08)';g.lineWidth=16;g.stroke();g.strokeStyle='rgba(225,235,238,.16)';g.lineWidth=6;g.stroke();
  hullPath(g,y0,y1);g.fillStyle=dark;g.fill();
  g.save();hullPath(g,y0,y1,7);g.clip();planks(g,R,-235,240,y0,y1,wood);
  for(let i=0;i<16;i++){const x=-200+R()*400,y=y0+R()*(y1-y0),rr=18+R()*50;const gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,R()<0.6?'rgba(0,0,0,.18)':'rgba(255,240,210,.05)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
  for(let i=0;i<6;i++){const x=-180+R()*360,y=y0+20+R()*(y1-y0-40);g.save();g.translate(x,y);g.scale(4,1);const gr=g.createRadialGradient(0,0,0,0,0,18);gr.addColorStop(0,'rgba(215,232,245,.08)');gr.addColorStop(1,'rgba(215,232,245,0)');g.fillStyle=gr;circ(g,0,0,18);g.restore();}
  // mast, yard and shroud shadows
  for(const [mx,my] of AREAS.deck.obs){if(Math.sign(my)!==o)continue;g.fillStyle='rgba(0,0,0,.2)';g.save();g.translate(mx,my);g.rotate(0.55);g.fillRect(0,-5,170,10);g.restore();g.fillRect(mx+26,y0+4,9,y1-y0-8);
   g.strokeStyle='rgba(0,0,0,.16)';g.lineWidth=1.2;for(const dx of [-50,-30,30,50]){g.beginPath();g.moveTo(mx+18,my+10);g.lineTo(mx+dx+22,yo-o*6+10);g.stroke();}}
  g.restore();
  // bulwark + rail
  hullPath(g,y0,y1,3);g.strokeStyle='#1e140c';g.lineWidth=9;g.stroke();g.strokeStyle=mixc(wood,'#000000',0.18);g.lineWidth=4.5;g.stroke();g.strokeStyle='rgba(255,235,200,.12)';g.lineWidth=1;g.stroke();
  hullPath(g,y0,y1);g.strokeStyle=trim;g.lineWidth=1.6;g.stroke();
  g.fillStyle='#140d08';for(let x=-195;x<=170;x+=36){g.fillRect(x,y0+1.5,3,4);g.fillRect(x,y1-5.5,3,4);}
  // hatch grating
  {const hx=-30,hy=o*190;g.fillStyle='#22170e';g.fillRect(hx,hy-14,60,28);g.fillStyle='#0c0805';for(let i=0;i<9;i++)for(let j=0;j<4;j++)g.fillRect(hx+3+i*6.4,hy-11+j*6.2,4.2,4);g.strokeStyle='#4a3420';g.lineWidth=1.5;g.strokeRect(hx+0.8,hy-13.2,58.4,26.4);}
  // cannons on the outboard rail
  for(let x=-150;x<=150;x+=50){const cy=yo-o*15;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x-9+2,cy-8+2,18,16);g.fillStyle='#3d2a19';g.fillRect(x-9,cy-8,18,16);g.fillStyle='#17110c';for(const wx of [-9,6])for(const wy of [-8,5])g.fillRect(x+wx,cy+wy,3,3);
   g.fillStyle='#1d1f22';g.fillRect(x-3.6,Math.min(cy,yo+o*12),7.2,Math.abs(yo+o*12-cy));g.fillStyle='#2b2e32';g.fillRect(x-4.4,cy-2,8.8,4);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x-2.4,Math.min(cy,yo+o*12),1.2,Math.abs(yo+o*12-cy));
   g.strokeStyle='rgba(140,115,75,.6)';g.lineWidth=0.7;g.beginPath();g.moveTo(x-9,cy);g.lineTo(x-16,yo-o*3);g.moveTo(x+9,cy);g.lineTo(x+16,yo-o*3);g.stroke();}
  // masts with fife rails and iron bands
  for(const [mx,my] of AREAS.deck.obs){if(Math.sign(my)!==o)continue;g.strokeStyle='#1e140c';g.lineWidth=3;g.beginPath();g.arc(mx,my,19,0,TAU);g.stroke();g.fillStyle='#6a4a2c';for(let i=0;i<10;i++){const a=i*TAU/10;circ(g,mx+Math.cos(a)*19,my+Math.sin(a)*19,1.4);}
   const gr=g.createRadialGradient(mx-4,my-4,1,mx,my,13);gr.addColorStop(0,'#7a5634');gr.addColorStop(1,'#2a1b10');g.fillStyle=gr;circ(g,mx,my,13);g.strokeStyle='#2a2a2c';g.lineWidth=1.6;g.beginPath();g.arc(mx,my,9.5,0,TAU);g.stroke();g.beginPath();g.arc(mx,my,12.6,0,TAU);g.stroke();
   coil(g,mx-30,my+o*24,8);}
  // stern & bow clutter (outside the walkable deck)
  crate(g,-191,m-58,15,0.1);crate(g,-190,m-41,13,-0.15);barrel(g,-191,m+48,7.5);barrel(g,-190,m+64,7.5);barrel(g,-178,m+70,6.5);
  g.fillStyle='#2a1c10';g.fillRect(-201,m-14,8,28);g.strokeStyle='#5a3e24';g.lineWidth=2;g.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8;g.moveTo(-197,m);g.lineTo(-197+Math.cos(a)*4,m+Math.sin(a)*15);}g.stroke();
  g.fillStyle='#3a2716';circ(g,191,m,10);g.strokeStyle='#1c130b';g.lineWidth=2;for(let i=0;i<6;i++){const a=i*TAU/6;g.beginPath();g.moveTo(191,m);g.lineTo(191+Math.cos(a)*13,m+Math.sin(a)*13);g.stroke();}coil(g,188,m-o*42,9);coil(g,186,m+o*40,7);}
 // boarding planks across the gap
 for(const [x0,x1] of [[-128,-92],[-18,18],[92,128]]){g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x0+4,-34,x1-x0,72);const w=(x1-x0)/3;for(let i=0;i<3;i++){g.fillStyle=mixc('#6a4c30','#000000',R()*0.25);g.fillRect(x0+i*w,-36,w-0.8,72);g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=0.5;g.beginPath();g.moveTo(x0+i*w+w*0.5,-34);g.lineTo(x0+i*w+w*0.45,34);g.stroke();}
  g.fillStyle='#2c1f13';for(let y=-30;y<34;y+=10)g.fillRect(x0,y,x1-x0,2);g.strokeStyle='#8a7350';g.lineWidth=1.2;g.beginPath();g.moveTo(x0-1,-36);g.quadraticCurveTo(x0-3,0,x0-1,36);g.moveTo(x1+1,-36);g.quadraticCurveTo(x1+3,0,x1+1,36);g.stroke();}}
function bgFort(g,R){const fa=BR.f?mixc((CLANS[BR.f.clan]||{col:'#777777'}).col,'#3a3530',0.3):'#5a4a3a';
 // beach
 g.fillStyle='#6b5a41';g.beginPath();g.moveTo(-240,24);for(let x=-240;x<=240;x+=20)g.lineTo(x,21+R()*6);g.lineTo(240,197);for(let x=240;x>=-240;x-=20)g.lineTo(x,193+R()*8);g.closePath();g.fill();
 let gr=g.createLinearGradient(0,20,0,60);gr.addColorStop(0,'rgba(25,20,14,.45)');gr.addColorStop(1,'rgba(25,20,14,0)');g.fillStyle=gr;g.fillRect(-240,20,480,40);gr=g.createLinearGradient(0,150,0,200);gr.addColorStop(0,'rgba(25,20,14,0)');gr.addColorStop(1,'rgba(25,20,14,.5)');g.fillStyle=gr;g.fillRect(-240,150,480,50);
 for(let i=0;i<700;i++){g.fillStyle=['rgba(140,120,88,.5)','rgba(80,66,46,.5)','rgba(160,140,105,.35)'][i%3];g.fillRect(-240+R()*480,24+R()*170,0.6+R()*1.2,0.6+R()*1.2);}
 for(let i=0;i<14;i++){const x=-60+i*8+R()*6,y=180-i*11;g.fillStyle='rgba(40,32,22,.35)';ell(g,x+(i%2?4:-4),y,1.8,3);}
 g.strokeStyle='rgba(40,60,40,.5)';g.lineWidth=1;for(let i=0;i<10;i++){const x=-230+R()*460,y=185+R()*8;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+6,y-4,x+12,y+1);g.stroke();}
 g.strokeStyle='rgba(230,236,236,.35)';g.lineWidth=2;g.beginPath();for(let x=-240;x<=240;x+=12)g.lineTo(x,199+Math.sin(x*0.07)*2.5);g.stroke();g.strokeStyle='rgba(230,236,236,.15)';g.beginPath();for(let x=-240;x<=240;x+=12)g.lineTo(x,207+Math.sin(x*0.05+1)*3);g.stroke();
 for(const [bx,by,rt] of [[-150,165,0.2],[150,168,-0.2]]){g.save();g.translate(bx,by);g.rotate(rt);g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(3,4,32,11,0,0,TAU);g.fill();g.fillStyle='#33241a';g.beginPath();g.moveTo(-32,0);g.quadraticCurveTo(-26,-11,0,-11);g.quadraticCurveTo(26,-11,34,0);g.quadraticCurveTo(26,11,0,11);g.quadraticCurveTo(-26,11,-32,0);g.fill();g.fillStyle='#4e3825';g.beginPath();g.ellipse(0,0,26,7.5,0,0,TAU);g.fill();g.fillStyle='#2a1d12';for(const tx of [-14,0,14])g.fillRect(tx-1.5,-8,3,16);g.strokeStyle='#5e4630';g.lineWidth=1.6;g.beginPath();g.moveTo(-6,-6);g.lineTo(10,-22);g.moveTo(6,6);g.lineTo(-8,22);g.stroke();g.restore();}
 // courtyard flagstones
 g.fillStyle='#262421';g.fillRect(-240,-320,480,292);
 for(let y=-322;y<-30;){const h=16+R()*8;let x=-244-R()*20;while(x<240){const w=18+R()*22,jy=R()*2.2,jh=h-1.5-R()*3;g.fillStyle=mixc('#4f4a43',R()<0.5?'#6b655b':'#36322d',R()*0.6);g.beginPath();g.moveTo(x+1+R()*1.5,y+jy);g.lineTo(x+w-1-R()*1.5,y+jy+R()*1.2);g.lineTo(x+w-1-R()*1.5,y+jy+jh);g.lineTo(x+1+R()*1.5,y+jy+jh-R()*1.2);g.closePath();g.fill();g.fillStyle='rgba(255,240,220,.035)';g.fillRect(x+2,y+jy+0.5,w-4,1.2);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+2,y+jy+jh-1.4,w-4,1.4);x+=w;}y+=h;}
 g.strokeStyle='rgba(15,13,12,.45)';g.lineWidth=0.7;for(let i=0;i<26;i++){let x=-230+R()*460,y=-310+R()*270;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=(R()-0.5)*16;y+=(R()-0.5)*16;g.lineTo(x,y);}g.stroke();}
 for(let i=0;i<26;i++){const x=-235+R()*470,y=-315+R()*280,rr=6+R()*16;gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(70,92,52,.22)');gr.addColorStop(1,'rgba(70,92,52,0)');g.fillStyle=gr;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
 g.save();g.translate(0,-170);g.scale(0.35,1);gr=g.createRadialGradient(0,0,0,0,0,150);gr.addColorStop(0,'rgba(210,200,180,.07)');gr.addColorStop(1,'rgba(210,200,180,0)');g.fillStyle=gr;circ(g,0,0,150);g.restore();
 gr=g.createLinearGradient(0,-100,0,-46);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');g.fillStyle=gr;g.fillRect(-240,-100,480,54);
 // barracks roofs along the top edge
 g.fillStyle='#2e211b';g.fillRect(-240,-320,480,20);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=0.8;for(let x=-240;x<240;x+=7){g.beginPath();g.moveTo(x,-320);g.lineTo(x,-300);g.stroke();}g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-240,-300,480,5);
 // wall top, parapet and towers
 const wall=(x0,x1)=>{g.fillStyle='#2b2926';g.fillRect(x0,-48,x1-x0,34);g.fillStyle='#6a665f';g.fillRect(x0,-46,x1-x0,24);g.strokeStyle='rgba(20,18,16,.5)';g.lineWidth=0.7;for(let y=-46;y<-22;y+=8)for(let x=x0+((y/8)&1)*7;x<x1;x+=14)g.strokeRect(x,y,14,8);
  g.fillStyle='#4a4741';for(let x=x0+2;x<x1-6;x+=17)g.fillRect(x,-22,10,7);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x0,-46,x1-x0,1.5);};
 wall(-240,-48);wall(48,240);
 for(const tx of [-235,-48,48,215]){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(tx-12+3,-58+4,32,44);g.fillStyle='#57534d';g.fillRect(tx-12,-58,32,44);g.fillStyle='#403d38';g.fillRect(tx-7,-53,22,34);g.fillStyle='#6e6a63';for(let i=0;i<4;i++){g.fillRect(tx-12+i*9,-58,6,4);g.fillRect(tx-12+i*9,-18,6,4);}g.fillStyle='#1f1d1b';g.fillRect(tx+1,-39,6,6);}
 // raised portcullis + broken gate doors
 g.fillStyle='#1d1e20';g.fillRect(-46,-50,92,5);g.fillStyle='#3a3c40';for(let x=-44;x<=44;x+=8)g.fillRect(x,-52,2.4,9);
 for(const [dx,rt,brk] of [[-48,-0.5,0],[48,3.6,1]]){g.save();g.translate(dx,-31);g.rotate(rt);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(2,-3,44,11);g.fillStyle='#3b2a1a';g.beginPath();g.moveTo(0,-5);g.lineTo(brk?36:44,-5);if(brk){g.lineTo(40,-2);g.lineTo(35,0);g.lineTo(41,3);}g.lineTo(brk?37:44,5);g.lineTo(0,5);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=0.5;for(const yy of [-2,1.5]){g.beginPath();g.moveTo(0,yy);g.lineTo(brk?36:44,yy);g.stroke();}g.fillStyle='#202124';for(const bx of [8,22,34])g.fillRect(bx,-5,2.4,10);g.fillStyle='#6b6e72';for(const bx of [8,22,34])for(const by of [-3.5,3.5])circ(g,bx+1.2,by,0.7);g.restore();}
 // causeway over the moat
 g.fillStyle='rgba(0,0,0,.4)';g.fillRect(-42,-26,92,58);g.fillStyle='#6b6458';g.fillRect(-46,-30,92,58);g.strokeStyle='rgba(30,26,22,.55)';g.lineWidth=0.8;for(let y=-26;y<28;y+=10)for(let x=-46+((y/10)&1)*9;x<46;x+=18)g.strokeRect(x,y,18,10);g.fillStyle='#45413b';g.fillRect(-51,-30,6,58);g.fillRect(45,-30,6,58);
 // courtyard features (drawn on the existing obstacle circles)
 {const [x,y,r]=AREAS.fort.obs[0];g.fillStyle='rgba(0,0,0,.35)';circ(g,x+3,y+4,r+3);g.fillStyle='#4b4842';circ(g,x,y,r+2);g.strokeStyle='#2c2a27';g.lineWidth=2;g.beginPath();g.arc(x,y,r+2,0,TAU);g.stroke();g.fillStyle='#3a2716';g.fillRect(x-7,y-8,14,15);g.fillStyle='#1c1e21';g.fillRect(x-3.5,y-2,7,r+10);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x-2,y-2,1.2,r+10);}
 {const [x,y,r]=AREAS.fort.obs[1];g.fillStyle='rgba(0,0,0,.35)';circ(g,x+3,y+4,r+2);barrel(g,x-6,y-5,8);barrel(g,x+7,y-3,8);barrel(g,x,y+8,8);}
 {const [x,y,r]=AREAS.fort.obs[2];g.fillStyle='rgba(0,0,0,.35)';circ(g,x+3,y+4,r+2);g.fillStyle='#5b5750';circ(g,x,y,r);g.fillStyle='#0d1a20';circ(g,x,y,r-4.5);g.fillStyle='rgba(120,160,180,.15)';circ(g,x-2,y-2,r-8);g.fillStyle='#3a2716';g.fillRect(x-r-2,y-1.5,r*2+4,3);}
 // fort flag
 g.fillStyle='rgba(0,0,0,.3)';g.fillRect(4,-296,40,20);g.fillStyle='#1c1a18';circ(g,0,-300,3.5);g.fillStyle=fa;g.beginPath();g.moveTo(2,-306);g.quadraticCurveTo(18,-312,36,-304);g.lineTo(36,-288);g.quadraticCurveTo(18,-296,2,-290);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=1;g.beginPath();g.moveTo(14,-307);g.quadraticCurveTo(16,-298,14,-291);g.stroke();}
function buildArenaBg(){const c=document.createElement('canvas'),K=Math.min(3,Math.max(1.5,brSc()*dpr)),b=arena().b,W=b[1]-b[0],H=b[3]-b[2];c.width=Math.round(W*K);c.height=Math.round(H*K);const g=c.getContext('2d');g.scale(K,K);g.translate(-b[0],-b[2]);
 const R=prng((((BR.e&&BR.e.lvl)|0)*31+7+(BR.mode==='fort'?99:0))|0);if(BR.mode!=='fort')bgDeck(g,R);else bgFort(g,R);g.globalCompositeOperation='lighter';const gl=bsprite('glow');for(const l of BR_LIGHTS[BR.mode==='fort'?'fort':'deck']){g.globalAlpha=0.3;g.drawImage(gl,l[0]-l[2],l[1]-l[2],l[2]*2,l[2]*2);}g.globalAlpha=1;g.globalCompositeOperation='source-over';BR.bg=c;BR.bgK=K;}
function brSc(){return clamp(Math.min(vw,vh)/400*1.1,0.9,1.7);}
const BR_LIGHTS={deck:[[-186,110,62],[-186,-110,62],[94,148,52],[-66,132,52],[94,-148,52],[-66,-132,52]],fort:[[-231,-36,90],[-44,-36,80],[52,-36,80],[219,-36,90]]};
function brLights(g,ts){const fort=BR.mode==='fort',Ls=BR_LIGHTS[fort?'fort':'deck'];
 for(const l of Ls){const f=Math.sin(ts*9+l[0])*Math.sin(ts*13.7+l[1]);if(fort){g.fillStyle='#2a2a2c';g.fillRect(l[0]-2,l[1]-1,4,6);g.fillStyle=`rgba(255,${150+f*40|0},50,.95)`;g.beginPath();g.moveTo(l[0]-3.2,l[1]);g.quadraticCurveTo(l[0]+f*2,l[1]-12-f*3,l[0]+3.2,l[1]);g.fill();g.fillStyle='rgba(255,235,170,.9)';g.beginPath();g.moveTo(l[0]-1.4,l[1]);g.quadraticCurveTo(l[0],l[1]-6,l[0]+1.4,l[1]);g.fill();}
  else{g.fillStyle='#1d1b18';g.fillRect(l[0]-3.5,l[1]-3.5,7,7);g.fillStyle=`rgba(255,${190+f*30|0},110,.95)`;g.fillRect(l[0]-2,l[1]-2,4,4);}}
 if(!BR.fires.length)return;g.globalCompositeOperation='lighter';const gl=bsprite('glow');for(const f of BR.fires){g.globalAlpha=0.5*Math.min(1,f.t);const s=f.r*1.6;g.drawImage(gl,f.cx-s,f.cy-s,s*2,s*2);}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';}
function brawlRender(t){const ts=t/1000;{const d=BR._lt?Math.min(100,t-BR._lt):16;BR._lt=t;BR._fe=BR._fe?BR._fe*0.95+d*0.05:16;if(!BR.lq&&BR._fe>23&&BR.t>1.5)BR.lq=1;}
 if(BR.ph==='zoom'||(BR.ph==='out'&&BR.zt<1)){const z0=zoom;zoom=z0*(1+BR.zt*1.8);try{render(t);}finally{zoom=z0;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=`rgba(7,6,5,${BR.zt*0.92})`;ctx.fillRect(0,0,vw,vh);if(BR.zt<0.65)return;ctx.globalAlpha=(BR.zt-0.65)/0.35;}
 const g=ctx,me=BR.me;if(!me){g.globalAlpha=1;return;}const sc=brSc();const b=arena().b;
 const tx=me.x,ty=me.y-20;BR.cam.x+=(tx-BR.cam.x)*0.12;BR.cam.y+=(ty-BR.cam.y)*0.12;const hw=vw/2/sc,hh=vh/2/sc;
 BR.cam.x=b[1]-b[0]<=hw*2?(b[0]+b[1])/2:clamp(BR.cam.x,b[0]+hw,b[1]-hw);BR.cam.y=b[3]-b[2]<=hh*2?(b[2]+b[3])/2:clamp(BR.cam.y,b[2]+hh-60,b[3]-hh+40);
 const sh=BR.shk>0?rand(-BR.shk,BR.shk):0,sh2=BR.shk>0?rand(-BR.shk,BR.shk):0;
 g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle=BR.mode==='fort'?'#11293a':'#0d2230';g.fillRect(0,0,vw,vh);
 g.setTransform(dpr*sc,0,0,dpr*sc,dpr*(vw/2-(BR.cam.x+sh)*sc),dpr*(vh/2-(BR.cam.y+sh2)*sc));
 if(!BR.lq){const x0=BR.cam.x-hw-40,x1=BR.cam.x+hw+40,y0=BR.cam.y-hh-30,y1=BR.cam.y+hh+30,dx=(ts*11)%140;g.lineWidth=1.5;g.strokeStyle='rgba(150,185,200,.11)';g.beginPath();
  for(let y=Math.floor(y0/34)*34,r=0;y<y1;y+=34,r++){const o=(r*47)%140;for(let x=Math.floor(x0/140)*140-140+o+dx;x<x1;x+=140){const yy=y+Math.sin(ts*0.9+x*0.02+r)*2.5;g.moveTo(x,yy);g.quadraticCurveTo(x+13,yy-4,x+26,yy);}}g.stroke();
  }
 if(BR.mode==='fort'){const X0=b[0]-900,X1=b[1]+900;g.fillStyle='#4f4230';g.fillRect(X0,24,X1-X0,172);g.fillStyle='#1c1a18';g.fillRect(X0,b[2]-900,X1-X0,-14-(b[2]-900));g.fillStyle='#2b2926';g.fillRect(X0,-48,X1-X0,34);g.fillStyle='#4a4741';for(let x=Math.floor(X0/17)*17;x<X1;x+=17)g.fillRect(x,-22,10,7);g.fillStyle='#34312d';g.fillRect(b[0]-14,b[2],14,-14-b[2]);g.fillRect(b[1],b[2],14,-14-b[2]);}
 if(BR.bg){g.imageSmoothingEnabled=Math.abs(BR.bgK-sc*dpr)>0.05;g.drawImage(BR.bg,b[0],b[2],b[1]-b[0],b[3]-b[2]);g.imageSmoothingEnabled=true;}
 if(BR.mode!=='fort'){g.lineCap='round';for(const x of [-160,-55,55,160]){const sw=Math.sin(ts*1.4+x)*1.6;g.strokeStyle='#3d3020';g.lineWidth=2.8;g.beginPath();g.moveTo(x,22);g.quadraticCurveTo(x+6+sw,0,x+2,-22);g.stroke();g.strokeStyle='#8c7550';g.lineWidth=1.3;g.setLineDash([2.4,2.4]);g.beginPath();g.moveTo(x,22);g.quadraticCurveTo(x+6+sw,0,x+2,-22);g.stroke();g.setLineDash([]);g.strokeStyle='#26272a';g.lineWidth=1.8;g.beginPath();g.arc(x+2,-25,3.2,0.2,Math.PI*1.3);g.stroke();}}
 for(const f of BR.fires){const a=Math.min(1,f.t);g.fillStyle=`rgba(40,22,12,${0.35*a})`;circ(g,f.cx,f.cy,f.r*0.8);for(let i=0;i<6;i++){const ang=i*1.05+f.cx,d=f.r*0.45,fl=Math.sin(ts*14+i*2)*3;const x=f.cx+Math.cos(ang)*d,y=f.cy+Math.sin(ang)*d;g.fillStyle=`rgba(255,${120+i*15},40,${0.8*a})`;g.beginPath();g.moveTo(x-3.5,y);g.quadraticCurveTo(x+fl*0.5,y-11-fl,x+3.5,y);g.fill();}}
 for(const tg of BR.tg)drawTg(g,tg,ts);
 if(BR.corpses)for(const c of BR.corpses)drawCorpse(g,c,ts);
 for(let i=0;i<BR.deco.length;i++){const d=BR.deco[i];if(!d.fu)d.fu={id:400+i,side:d.side,anim:d.ph,swing:0,combo:0,comboT:0,blk:0,shots:0,maxShots:0,inp:{mx:0,my:0},boss:'',cap:false,r:9};d.fu.cheer=ts*3.2+d.ph;const L=lookOf(d.fu);const bob=Math.abs(Math.sin(ts*5+d.ph))*1.5;g.drawImage(bsprite('shadow'),d.x-12,d.y-9,26,22);drawFigure(g,d.x,d.y-bob,d.side?Math.PI/2:-Math.PI/2,9,L,d.fu,0,1,ts);}
 const us=BR.u.filter(u=>!u.dead).sort((a,b)=>a.y-b.y);for(const u of us)drawUnit(g,u,ts);
 for(const f of BR.fx)drawFx(g,f,ts);
 brLights(g,ts);
 if(!BR.lq){const sm=bsprite('smoke'),W=b[1]-b[0]+400;for(let i=0;i<3;i++){const x=b[0]-200+((ts*(9+i*2)+i*230)%W),y=b[2]+(i+0.5)*(b[3]-b[2])/3+Math.sin(ts*0.3+i)*25,s=60+i*14;g.globalAlpha=0.11;g.drawImage(sm,x-s,y-s,s*2,s*2);}g.globalAlpha=1;}
 // screen-space: grade + vignette, then HUD
 g.setTransform(dpr,0,0,dpr,0,0);
 const SER="Georgia,'Times New Roman',serif";const slot=topSlot();const W=Math.min(320,vw*0.78),x0=(vw-W)/2,y0=slot.land?slot.y:slot.y-4,H=BR.foeCap?50:36;
 g.fillStyle='rgba(16,13,10,.86)';rr(g,x0,y0,W,H,4);g.fill();g.strokeStyle='rgba(176,140,80,.6)';g.lineWidth=1;rr(g,x0+0.5,y0+0.5,W-1,H-1,4);g.stroke();g.strokeStyle='rgba(0,0,0,.6)';rr(g,x0+2.5,y0+2.5,W-5,H-5,3);g.stroke();
 const my=Math.round(BR.sides[0].pool)+(me.dead?0:1),fo=Math.round(BR.sides[1].pool)+(BR.foeCap&&!BR.foeCap.dead?1:0);
 g.font=`600 12px ${SER}`;g.fillStyle='#e6d9bc';g.textAlign='left';g.fillText(BR.mode==='duel'?'DUEL':`Crew ${my}`,x0+10,y0+15);g.textAlign='right';g.fillText(BR.mode==='duel'?noEmo(BR.boss.name):`${fo} Foes`,x0+W-10,y0+15);
 g.textAlign='center';g.font=`italic 11px ${SER}`;g.fillStyle='#c9a96a';g.fillText(BR.mode==='duel'?'':BR.tac==='hold'?'Hold the Line':BR.tac==='pistols'?'Pistols First':BR.tac?'Charge':'',x0+W/2,y0+15);
 const bar=(y,v,m,c,label)=>{const bx=x0+64,bw=W-64-46;g.font=`600 10px ${SER}`;g.textAlign='left';g.fillStyle='#bfb294';g.fillText(label,x0+10,y+5,52);g.fillStyle='rgba(0,0,0,.65)';g.fillRect(bx-1,y-1,bw+2,6);g.fillStyle=c;g.fillRect(bx,y,bw*clamp(v/m,0,1),4);g.fillStyle='rgba(255,255,255,.14)';g.fillRect(bx,y,bw*clamp(v/m,0,1),1);g.textAlign='right';g.fillStyle='#e6d9bc';g.fillText(String(Math.max(0,Math.ceil(v))),x0+W-10,y+5);};
 bar(y0+26,me.hp,me.max,'#86a062','Captain');if(BR.foeCap)bar(y0+40,BR.foeCap.hp,BR.foeCap.max,'#a3302a',BR.mode==='duel'?'Foe':(BR.mode==='fort'?'Commander':'Enemy Cpt'));
 if(BR.msgT>0&&BR.msg){const m=noEmo(BR.msg);g.font=`italic 600 14px ${SER}`;g.textAlign='center';const mw=Math.min(vw-20,g.measureText(m).width+30),my2=y0+H+8;g.globalAlpha=Math.min(1,BR.msgT*1.5);g.fillStyle='rgba(16,13,10,.8)';rr(g,(vw-mw)/2,my2,mw,25,3);g.fill();g.strokeStyle='rgba(176,140,80,.45)';g.lineWidth=1;g.beginPath();g.moveTo((vw-mw)/2+8,my2+0.5);g.lineTo((vw+mw)/2-8,my2+0.5);g.moveTo((vw-mw)/2+8,my2+24.5);g.lineTo((vw+mw)/2-8,my2+24.5);g.stroke();g.fillStyle='#efe2c2';g.fillText(m,vw/2,my2+17,vw-34);g.globalAlpha=1;}
 if(BR.ph==='fight'&&BR.hint>0&&IS_TOUCH){g.font=`italic 12px ${SER}`;g.fillStyle=`rgba(232,222,198,${Math.min(0.85,BR.hint)})`;g.textAlign='center';g.strokeStyle=`rgba(0,0,0,${Math.min(0.6,BR.hint)})`;g.lineWidth=3;const ht='Drag to move · Slash · hold Block (tap just before a hit to parry) · Dodge';g.strokeText(ht,vw/2,vh*0.62,vw-20);g.fillText(ht,vw/2,vh*0.62,vw-20);}
 if(joy.id!==null&&BR.ph==='fight'){g.strokeStyle='rgba(200,170,110,.4)';g.lineWidth=1.5;g.beginPath();g.arc(joy.bx,joy.by,46,0,TAU);g.stroke();g.fillStyle='rgba(200,170,110,.3)';g.beginPath();g.arc(joy.bx+clamp(joy.x-joy.bx,-46,46),joy.by+clamp(joy.y-joy.by,-46,46),18,0,TAU);g.fill();}
 g.globalAlpha=1;}
