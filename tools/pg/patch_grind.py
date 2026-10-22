import sys
import os
T='/workspace/tools/pg/';P=os.environ.get('OUTP','/workspace/pirate-game/index.html')
MODS=sys.argv[1].split(',') if len(sys.argv)>1 else ['a']
s=open(os.environ.get('INP',P)).read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)>=1,('MISSING',a[:100])
    s=s.replace(a,b,cnt)
code=open(T+'grind_core.js').read()
for m in MODS: code+='\n'+open(T+'grind_'+m+'.js').read()
if 'b' not in MODS: code+='\n'+open(T+'grind_stub_a.js').read()
# --- module A hooks ---
rep("expRecalc();moraleApply();","expRecalc();moraleApply();grindRecalc();")
rep("P.hp-=dmg;P.calm=0;","if(ST.eva&&!bite)dmg*=1-ST.eva;P.hp-=dmg;P.calm=0;if(!bite&&dmg>ST.maxHp*0.06&&Math.random()<0.05&&S.roster)crewHurt(false);")
rep("function playerDied(){","function playerDied(){if(S.roster)crewHurt(true);")
rep("S.xp=(S.xp||0)+n;","S.xp=(S.xp||0)+n;mastGain(n);")
rep("storyEv('sink',{e});}","storyEv('sink',{e});grindSunk(e);}")
rep("const gold=Math.round(e.gold*rand(0.8,1.25)*","const gold=Math.round(e.gold*rand(0.8,1.25)*grindLootK()*")
rep("function expTick(dt){hardTick(dt);","function expTick(dt){hardTick(dt);grindTick(dt);")
rep("h+=hullShopHTML(p);h+=armoryHTML();}","h+=hullShopHTML(p);h+=craftHTML(p)+mastHTML();h+=armoryHTML();}")
rep("h+=officersHTML(p);}","h+=officersHTML(p);h+=rosterHTML(p);}")
rep("if(storyPortAct(act,arg))return true;","if(storyPortAct(act,arg))return true;if(grindPortAct(act,arg))return true;")
rep("function defaultState(){return{story:stDef(),","function defaultState(){return{res:{wood:0,iron:0,canvas:0,parts:0},craft:{},cpity:{},mast:{sloop:0,brig:0,frigate:0,galleon:0},roster:[],rid:0,hired:[],charm:0,story:stDef(),")
rep("hardMigrate(d);storyMigrate(d);","hardMigrate(d);storyMigrate(d);grindMigrate(d);")
rep("h+=row('🪵 Rare materials',","h+=row('🔨 Shipwright stores',Object.keys(RES).map(k=>`${RES[k][0]} ${RES[k][1]} <b>${resN(k)}</b>`).join(' • ')+` • 👥 named crew ${(S.roster||[]).length}/${crewCap()} • ⭐ ${HULLS[S.ship].name} mastery ${mastLvl()}/10`,'');h+=row('🪵 Rare materials',")
EXP="RES,resN,resGain,CT,COMP,CTIER,CBON,cTier,craftCost,craftChance,craftTry,MXP,MPERK,mastLvl,mastGain,CREWR,TRAITS,RARECREW,crewCap,crewEff,recruitsAt,crewHire,crewXP,crewHurt,crewWage,grindRecalc,ramTick,grindPortAct,grindSunk,grindTick,grindEv,grindMigrate,GH"
import os
for m in MODS:
    f=T+'grind_'+m+'.exp'
    if os.path.exists(f): EXP+=','+open(f).read().strip()
rep("window.__game={STORY:{","window.__game={GRIND:{"+EXP+"},STORY:{")
for m in MODS:
    if os.path.exists(T+'grind_hooks_'+m+'.py'): exec(open(T+'grind_hooks_'+m+'.py').read())
rep("\nreadSafe();const hadSave=load();","\n"+code+"\nreadSafe();const hadSave=load();")
open(P,'w').write(s);print('patched',len(s),MODS)
