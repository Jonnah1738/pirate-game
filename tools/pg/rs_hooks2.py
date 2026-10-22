# restyle chunk 2 hooks: islands/ports/forts/loot
code+='\n'+open(T+'grind_r2.js').read()
rep("ctx.strokeStyle=i===nearPort?'rgba(255,220,90,0.9)':'rgba(255,220,90,0.35)';","ctx.strokeStyle=i===nearPort?'rgba(222,188,110,0.9)':'rgba(222,188,110,0.32)';")
rep("for(const l of loot){const bob=Math.sin(ts*3+l.x)*3;ctx.fillStyle='rgba(255,255,255,0.25)';ctx.beginPath();ctx.arc(l.x,l.y,16+Math.sin(ts*4)*3,0,TAU);ctx.fill();ctx.font='24px serif';ctx.fillText(Object.keys(l.goods).length?'📦':'💰',l.x,l.y+bob);}","for(const l of loot)rsDrawLoot(l,ts);")
