# --- module O (separate online captain profile + harder online economy) hooks ---
rep("const SAVEKEY='pirateSeas_save_v1';","const ONLINE=(()=>{try{return sessionStorage.getItem('pirateSeas_mode')==='online';}catch(e){return false;}})();const OEC={xp:2,up:1.75,hull:1.75,fleet:1.75,craft:1.75,mat:1.5,chance:0.8,loot:0.8,sell:0.9};const SAVEKEY=ONLINE?'pirateSeas_online_v1':'pirateSeas_save_v1';")
rep("const upCost=(def,l)=>Math.round(def.base*Math.pow(def.g,l));","const upCost=(def,l)=>Math.round(def.base*Math.pow(def.g,l)*(ONLINE?OEC.up:1));")
rep("*sellMul(pi,gi,ex)))","*sellMul(pi,gi,ex)*(ONLINE?OEC.sell:1)))")
rep("if(hadSave)$('startBtn').textContent='⛵ Continue voyage';","if(hadSave)$('startBtn').textContent='⛵ Continue voyage';oBoot(hadSave);")
