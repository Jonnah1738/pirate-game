// ---- story regions: added AFTER all generated islands & forts, so existing layout, port and fort ids never change ----
var SREGP=null;
const SREG=[
 {id:'drowned',name:'The Drowned Isles',act:3,lvlReq:30,x:2700,y:2600,bonus:1,port:{name:'Saltgrave',r:200,cheap:'teeth',want:'rum',desc:'A drowned town on stilts above a sunken city. Bell-ringers toll for the dead every hour.'},lms:[['Gallows Reef',95],['The Sunken Steeple',80],['Widow\'s Rock',70]]},
 {id:'ember',name:'Ember Reach',act:4,lvlReq:40,x:21300,y:2700,bonus:2,port:{name:'Cinderhold',r:210,cheap:'spice',want:'teeth',desc:'A smoking volcanic harbour where blacksmiths forge Kraken steel in rivers of fire.'},lms:[['Ashfall Cone',110],['The Glass Shore',75],['Brimstone Key',70]]},
 {id:'maelstrom',name:'The Maelstrom',act:5,lvlReq:50,x:21400,y:21400,bonus:2,port:{name:'Last Light',r:190,cheap:'sugar',want:'gems',desc:'The last lighthouse before the edge of every chart. Beyond it, the sea itself turns.'},lms:[['Eye of the Storm',120],['Bonefield Shoals',80],['The Leviathan\'s Ribs',90]]}];
(function(){const free=(x,y,rad,gap)=>!(x<400||y<400||x>WORLD-400||y>WORLD-400)&&!ISL.some(o=>Math.hypot(o.x-x,o.y-y)<o.r*1.3+rad*1.3+gap)&&!FORTS.some(f=>Math.hypot(f.x-x,f.y-y)<rad+600)&&!PORTS.some(p=>Math.hypot(p.port.x-x,p.port.y-y)<rad+900);
 const place=(cx,cy,rad,gap)=>{for(let ring=0;ring<40;ring++)for(let k=0;k<12;k++){const a=k/12*TAU+ring*0.37,d=ring*140;const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d;if(free(x,y,rad,gap))return{x,y};}return null;};
 SREG.forEach((R,ri)=>{const pp=place(R.x,R.y,R.port.r,320);if(!pp)return;const pa=Math.atan2(START.y-pp.y,START.x-pp.x);
  const o=makeIsland(Object.assign({x:pp.x,y:pp.y,pa,haven:1},R.port),70000+ri*97,true);o.outer=true;o.story=R.act;o.region=R.id;o.reqL=R.lvlReq;ISL.push(o);PORTS.push(o);R.pi=PORTS.length-1;R.cx=pp.x;R.cy=pp.y;R.lm=[];
  R.lms.forEach(([nm,rad],li)=>{const a=pa+Math.PI+(li-1)*1.1;const q=place(pp.x+Math.cos(a)*1500,pp.y+Math.sin(a)*1500,rad,220);if(!q)return;const l=makeIsland({x:q.x,y:q.y,r:rad,name:nm},71000+ri*31+li,false);l.outer=true;l.region=R.id;l.lmName=nm;ISL.push(l);R.lm.push({name:nm,x:q.x,y:q.y,r:rad});});});
 SREGP=SREG;})();
function regionAt(x,y){if(!SREGP)return null;for(const R of SREGP)if(R.cx!=null&&Math.hypot(x-R.cx,y-R.cy)<3200)return R;return null;}
