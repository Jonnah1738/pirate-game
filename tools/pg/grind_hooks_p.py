# --- module P (polish) hooks ---
rep("{const X=lvlFromXp(S.xp||0);h+=row(`🎖️ Captain level","h+=pMenuTop();{const X=lvlFromXp(S.xp||0);h+=row(`🎖️ Captain level")
rep("h+=row('🔊 Sound',","h+=pMenuRows();h+=row('🔊 Sound',")
rep("const a=b.dataset.act;if(storyMenuAct(","const a=b.dataset.act;if(pAct(a))return;if(storyMenuAct(")
_a="const hb=Math.round($('hud').getBoundingClientRect().bottom)||100;d.style.top=(hb+5)+'px';"
assert code.count(_a)==1;code=code.replace(_a,"const hb=Math.round($('hud').getBoundingClientRect().bottom)||100;d.style.top=pLockTop(hb)+'px';")
rep("if(hadSave)$('startBtn').textContent='⛵ Continue voyage';oBoot(hadSave);","if(hadSave)$('startBtn').textContent='⛵ Continue voyage';oBoot(hadSave);ocTitleBtn();ocBootPrompt();")
