# --- module F (boarding hull lock) hooks ---
rep("function damagePlayer(dmg,bite){if(P.dead)return;if(BR.on&&!bite){brawlShipHit(dmg);dmg*=0.4;}","function damagePlayer(dmg,bite){if(P.dead)return;if(hullLocked()){if(BR.on&&!bite)brawlShipHit(dmg);lockFx();return;}")
rep("function damageEnemy(e,dmg){if(e.grap&&BR.on)return;","function damageEnemy(e,dmg){if(e.grap&&(BR.on||GR.e===e))return;")
rep("function brawlStep(dt){BR.t+=dt;","function brawlStep(dt){BR.t+=dt;if(BR.ph==='fight'&&BR.t>BRMAX&&!BR.mpHold){say('⏳ The fight drags on — both crews fall back and cut the ropes',2);endBrawl('retreat');return;}")
rep("BR.repT=S.playTime+90;grapCd=5;","BR.repT=S.playTime+90;grapCd=GRAP_CD;")
