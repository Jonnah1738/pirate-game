rep("f.d.hp=0;f.sinking=0.001;S.fleet=S.fleet.filter(x=>x!==f.d);chum(f.x,f.y,22);toast(`💀 Your ship ${f.d.name} was sunk!`);","f.d.hp=0;f.sinking=0.001;fleetLayUp(f.d);chum(f.x,f.y,22);")
rep("function syncFleet(){const old=new Map(fleet.map(f=>[f.d,f]));fleet.length=0;S.fleet.forEach((d,i)=>{","function syncFleet(){const old=new Map(fleet.map(f=>[f.d,f]));fleet.length=0;S.fleet.filter(d=>!fRep(d)).forEach((d,i)=>{")
rep("function wagesTotal(){let w=0;for(const d of S.fleet)w+=d.wage||0;","function wagesTotal(){let w=0;for(const d of S.fleet)if(!fRep(d))w+=d.wage||0;")
rep("for(const d of S.fleet)d.unpaid=(d.unpaid||0)+1;","for(const d of S.fleet)if(!fRep(d))d.unpaid=(d.unpaid||0)+1;")
rep("const t=FTYPES[f.d.type];const ms=ST.maxSpeed*t.spd;","const t=FTYPES[f.d.type];const ms=ST.maxSpeed*fSpd(f.d);")
rep("f.rr<=0){f.rr=3.2;","f.rr<=0){f.rr=fRel(f.d);")
rep("f.rl<=0){f.rl=3.2;","f.rl<=0){f.rl=fRel(f.d);")
rep("cannons:clamp(+d.cannons||1,1,6),dmg:clamp(+d.dmg||5,1,40),wage:clamp(+d.wage||4,0,99),unpaid:+d.unpaid||0});","cannons:clamp(+d.cannons||1,1,9),dmg:clamp(+d.dmg||5,1,150),wage:clamp(+d.wage||4,0,99),unpaid:+d.unpaid||0,b:(d.b&&typeof d.b==='object')?{hp:+d.b.hp||0,can:+d.b.can||1,dmg:+d.b.dmg||5}:null,fu:d.fu,ft:d.ft,fp:d.fp,fx:+d.fx||0,rep:+d.rep||0,rept:+d.rept||0});")
rep("Unpaid crews desert after 3 missed wages.","Unpaid crews desert after 3 missed wages. A ship that sinks isn't lost — she's laid up in the shipyard for a few minutes (rush it for gold + timber).")
a="""  for(const d of S.fleet){const t=FTYPES[d.type];const miss=Math.max(0,d.maxHp-Math.ceil(d.hp));const c=Math.ceil(miss*0.6*mk());
   h+=row(`${t.icon} ${esc(d.name)}`,`${t.name} Lv${d.lvl} • ❤️ ${Math.ceil(d.hp)}/${d.maxHp} • ${d.cannons} guns/side • dmg ${d.dmg} • wage ${d.wage}💰/min`,
    btn('frep',miss>0?`Repair ${c}💰`:'✓ Fit',miss>0&&S.gold>=c,d.id)+btn('fren','✏️',true,d.id,'sell')+btn('fdis',fDisArm===d.id?'Sure?':'Dismiss',true,d.id,'red'));}"""
rep(a,"  h+=fleetCards(p);")
