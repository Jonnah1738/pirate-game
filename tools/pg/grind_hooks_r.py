# visual restyle hooks (sea + lighting); ships are swapped in grind_r.js
rep("ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=seaColor();ctx.fillRect(0,0,vw,vh);","ctx.setTransform(dpr,0,0,dpr,0,0);rsSea(t);")
rep("ctx.strokeStyle='rgba(255,255,255,0.16)';ctx.lineWidth=2.2;ctx.stroke();\n // world border","ctx.strokeStyle='rgba(196,220,226,0.13)';ctx.lineWidth=1.7;ctx.stroke();\n // world border")
rep("ctx.globalAlpha=a*0.35;ctx.fillStyle='#e8f6ff';","ctx.globalAlpha=a*0.3;ctx.fillStyle='#cfdfe2';")
rep(" ctx.setTransform(dpr,0,0,dpr,0,0);\n grindDraw(ts);"," ctx.setTransform(dpr,0,0,dpr,0,0);\n rsLight();grindDraw(ts);")
rep("else if(p.type==='foam'){ctx.globalAlpha=a*0.85;ctx.fillStyle='#f4fbff';","else if(p.type==='foam'){ctx.globalAlpha=a*0.6;ctx.fillStyle='#d3e0e2';")
