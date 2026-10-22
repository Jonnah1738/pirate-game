# --- module E (sail throttle) hooks ---
rep("function defaultState(){return{","function defaultState(){return{sail:1,")
rep("moveShip(P,desired,bo?1:P.throttle,","moveShip(P,desired,bo?1:thrEff(),")
rep("if(keys['arrowup']||keys['w'])P.throttle=clamp(P.throttle+dt*1.2,0,1);if(keys['arrowdown']||keys['s'])P.throttle=clamp(P.throttle-dt*1.2,0,1);","if(keys['arrowup']||keys['w'])thrNudge(dt*0.8);if(keys['arrowdown']||keys['s'])thrNudge(-dt*0.8);")
rep("if(hold.tU>0.4)P.throttle=clamp(P.throttle+dt*0.9,0,1);","if(hold.tU>0.4)thrNudge(dt*0.7);")
rep("if(hold.tD>0.4)P.throttle=clamp(P.throttle-dt*0.9,0,1);","if(hold.tD>0.4)thrNudge(-dt*0.7);")
rep("bindHold('sailUp','U',()=>{P.throttle=clamp(Math.floor(P.throttle*4+1e-6)/4+0.25,0,1);hold.tU=0;});","bindHold('sailUp','U',()=>{thrStep(1);hold.tU=0;});")
rep("bindHold('sailDn','D',()=>{P.throttle=clamp(Math.ceil(P.throttle*4-1e-6)/4-0.25,0,1);hold.tD=0;});","bindHold('sailDn','D',()=>{thrStep(-1);hold.tD=0;});")
rep("⛵${Math.round(P.throttle*100)}%`","⛵${Math.round(thrEff()*100)}%`")
rep("if(P.throttle>0.01){ctx.strokeStyle='#ffd34d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(joy.bx,joy.by,JR+5,-Math.PI/2,-Math.PI/2+TAU*P.throttle);","if(thrEff()>0.01){ctx.strokeStyle='#ffd34d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(joy.bx,joy.by,JR+5,-Math.PI/2,-Math.PI/2+TAU*thrEff());")
rep("drawShip(P,playerSail(),'#111',P.throttle);","drawShip(P,playerSail(),'#111',P.boost>0?1:thrEff());")
rep("c.maxThr=Math.max(c.maxThr||0,P.throttle);","c.maxThr=Math.max(c.maxThr||0,thrEff());")
rep("function tutStart(i){T.on=true;","function tutStart(i){T.on=true;if(S.sail<0.5)S.sail=1;")
# fleet: hold station when the flagship is stopped
rep("if(dist>35){desired=Math.atan2(dy,dx);thr=clamp(Math.hypot(P.vx,P.vy)/ms+dist/220,0.25,1);}else{desired=P.h;thr=clamp(Math.hypot(P.vx,P.vy)/(ms*0.95),0,1);}}",
 "const pv=Math.hypot(P.vx,P.vy);if(pv<22&&dist<320){if(dist<75)f.hold=1;else if(dist>150)f.hold=0;if(f.hold){desired=P.h;thr=0;}else{desired=Math.atan2(dy,dx);thr=clamp(dist/420,0.12,0.5);}}else{f.hold=0;if(dist>35){desired=Math.atan2(dy,dx);thr=clamp(pv/ms+dist/220,0.25,1);}else{desired=P.h;thr=clamp(pv/(ms*0.95),0,1);}}}")
# menu: steering row mentions the lever
rep("'Drag anywhere on the sea (floating joystick)'","'Drag anywhere on the sea (floating joystick). ⛵ Sail lever on the left sets speed 0–100% (⚓ stop / ⛵ full; keys W/S, +/−, X)'")
