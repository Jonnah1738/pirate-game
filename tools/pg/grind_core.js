// ================= GRIND framework: module hooks =================
const GH={tick:[],sunk:[],mig:[],ev:[],draw:[],hud:[]};
function grindTick(dt){for(const f of GH.tick)f(dt);}
function grindSunk(e){for(const f of GH.sunk)f(e);}
function grindMigrate(d){for(const f of GH.mig)f(d||{});}
function grindEv(t,d){for(const f of GH.ev)f(t,d||{});}
function grindDraw(ts){for(const f of GH.draw)f(ts);}
{const _sev=storyEv;storyEv=function(t,d){_sev(t,d);grindEv(t,d);};}
