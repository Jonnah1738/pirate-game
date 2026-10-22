# restyle chunk 3 hooks: UI theme, drawn icons, map/minimap/gauge
code+='\n'+open(T+'grind_r3.js').read()
_i=s.find('</style>');s=s[:_i]+open(T+'rs_theme.css').read()+s[_i:]
# map base: dark chart sea + muted land
rep("g.fillStyle='#1d5f86';g.fillRect(0,0,MAPRES,MAPRES);","g.fillStyle='#183039';g.fillRect(0,0,MAPRES,MAPRES);")
rep("g.fillStyle=o.isPort?(o.clan!=null?'#c7a04a':'#7fbf5a'):'#c9b57a';g.fill();","g.fillStyle=o.isPort?(o.clan!=null?'#b8924a':'#7f9a5a'):'#a8946a';g.fill();g.strokeStyle='rgba(30,20,10,0.6)';g.lineWidth=1;g.stroke();")
rep("d[i*4]=10;d[i*4+1]=22;d[i*4+2]=38;d[i*4+3]=255;","d[i*4]=16;d[i*4+1]=15;d[i*4+2]=14;d[i*4+3]=255;")
rep("ctx.restore();ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1.5;ctx.strokeRect(X,Y,s,s);}","ctx.restore();rsFrame(X,Y,s,s);}")
rep("ctx.fillStyle='rgba(5,10,20,0.78)';ctx.fillRect(0,0,vw,vh);const R=bigMapRect();","ctx.fillStyle='rgba(10,8,6,0.84)';ctx.fillRect(0,0,vw,vh);const R=bigMapRect();")
rep("ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🗺️ Sea chart","ctx.fillStyle='#e8d5a6';ctx.font='bold 14px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Sea chart")
rep("for(const b of mapBtns()){ctx.fillStyle='rgba(10,25,40,0.8)';ctx.beginPath();ctx.arc(b.x,b.y,22,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.fillText(b.t,b.x,b.y+1);}","for(const b of mapBtns())rsMapBtn(b);")
# wind / sail gauge plate
rep("ctx.fillStyle='rgba(10,25,40,0.55)';ctx.fillRect(m.x,m.y+m.s+4,m.s,24);","rsPlate(m.x,m.y+m.s+5,m.s,24);")
rep("ctx.fillStyle='#bfe8ff';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-7,-6);","ctx.fillStyle='#d9c08a';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-7,-6);")
rep("ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.fillText(P.boost>0?`${Math.round(Math.hypot(P.vx,P.vy))}kn  🚀${P.boost.toFixed(1)}s`:`${Math.round(Math.hypot(P.vx,P.vy))}kn  ⛵${Math.round(thrEff()*100)}%`,m.x+26,wy);",
    "ctx.font='bold 11px Georgia,serif';ctx.textAlign='left';ctx.fillStyle='#efe2c4';ctx.fillText(P.boost>0?`${Math.round(Math.hypot(P.vx,P.vy))} kn · boost ${P.boost.toFixed(1)}s`:`${Math.round(Math.hypot(P.vx,P.vy))} kn · sails ${Math.round(thrEff()*100)}%`,m.x+26,wy);")
# port name plates: serif, brass-edged, no emoji
rep("ctx.font='bold 15px sans-serif';const w=ctx.measureText(p.name).width+16;ctx.fillStyle='rgba(20,12,4,0.6)';ctx.fillRect(X-w/2,Y-11,w,22);ctx.fillStyle=p.haven?'#ffb0a0':'#ffe7a8';ctx.fillText((p.haven?'🏴‍☠️ ':'⚖️ ')+p.name,X,Y);",
    "ctx.font='bold 15px Georgia,serif';const w=ctx.measureText(p.name).width+18;rsPlate(X-w/2,Y-11,w,22);ctx.fillStyle=p.haven?'#f0a890':'#ecd59a';ctx.fillText(p.name,X,Y+1);")
