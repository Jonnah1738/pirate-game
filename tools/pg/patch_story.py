import sys
T='/workspace/tools/pg/';P='/workspace/pirate-game/index.html'
s=open(P).read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)>=1,('MISSING',a[:90])
    s=s.replace(a,b,cnt)
STUB="function storyEv(){}function storyTargets(){}function storyTick(){}function storyAct(){return 1;}"
rep(STUB,open(T+'story.js').read())
CSS="""#story{position:fixed;inset:0;z-index:45;display:flex;align-items:flex-end;justify-content:center;background:linear-gradient(rgba(0,0,0,0) 25%,rgba(0,0,0,.72));touch-action:manipulation}
#story.hidden{display:none}
#story .sbox{width:min(540px,calc(100vw - 16px));margin:0 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#2b231c,#16110d);border:1px solid rgba(178,142,82,.65);border-radius:6px;box-shadow:0 10px 34px rgba(0,0,0,.75),inset 0 0 40px rgba(0,0,0,.5);color:#e9dcc0;font-family:Georgia,'Times New Roman',serif;padding:12px 13px 10px}
#story .schap{font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;color:#b28e52;margin-bottom:8px;border-bottom:1px solid rgba(178,142,82,.25);padding-bottom:5px}
#story .srow{display:flex;gap:12px;align-items:flex-start}
#sPor{flex:none;width:66px;height:66px;border-radius:50%;border:2px solid #9c7a45;display:flex;align-items:center;justify-content:center;font-size:32px;background:radial-gradient(circle at 38% 32%,var(--c,#444),#0b0806 78%);filter:sepia(.3) contrast(1.1);box-shadow:0 0 0 3px #1a140f,0 3px 10px rgba(0,0,0,.6)}
#sPor.narr{border-color:#5c4a33;opacity:.85}
#sName{font-variant:small-caps;letter-spacing:.7px;color:#e8d29a;font-weight:700;font-size:16px}#sRole{font-size:11px;color:#a8987a;font-style:italic}
#sText{font-size:15px;line-height:1.45;margin:5px 0 4px;min-height:3.2em}#sText.narr{font-style:italic;color:#cdbf9f}
#sBtns{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;margin-top:8px}
#sBtns button{min-height:44px;padding:6px 16px;background:linear-gradient(#3a3029,#221b16);color:#efe4c9;border:1px solid rgba(178,142,82,.6);border-radius:4px;font-family:Georgia,serif;font-size:14.5px}
#sBtns button.sc{width:100%;text-align:left}#sBtns .sq{width:100%;font-size:12.5px;color:#b9a77f;font-style:italic}
"""
rep("#tipBox{position:fixed;",CSS+"#tipBox{position:fixed;")
HTML="""<div id="story" class="hidden"><div class="sbox"><div class="schap" id="sChap"></div><div class="srow"><div id="sPor"></div><div style="flex:1;min-width:0"><div id="sName"></div><div id="sRole"></div><div id="sText"></div></div></div><div id="sBtns"></div></div></div>
"""
rep('<div id="menu" class="overlay hidden">',HTML+'<div id="menu" class="overlay hidden">')
rep('<div class="tabs" id="mTabs"><button data-m="log">📖 Log</button><button data-m="skills">🎖️ Skills</button><button data-m="trophies">🏆 Trophies</button><button data-m="style">🎨 Style</button><button data-m="rep">🏴 Republic</button></div>',
 '<div class="tabs" id="mTabs"><button data-m="log">📖<br>Log</button><button data-m="story">📜<br>Journal</button><button data-m="skills">🎖️<br>Skills</button><button data-m="trophies">🏆<br>Trophies</button><button data-m="style">🎨<br>Style</button><button data-m="rep">🏴<br>Republic</button></div>')
rep(".tabs button.on{",".tabs#mTabs button{min-width:0;padding:4px 1px;font-size:11px;line-height:1.25}.tabs button.on{")
rep("if(mView==='rep'){$('mBody').innerHTML=repHTML();return;}","if(mView==='rep'){$('mBody').innerHTML=repHTML();return;}if(mView==='story'){$('mBody').innerHTML=journalHTML();return;}")
rep("$('mBody').addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled||ghost())return;const a=b.dataset.act;","$('mBody').addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled||ghost())return;const a=b.dataset.act;if(storyMenuAct(a,b.dataset.arg)){renderMenu();return;}")
rep("function exPortAction(act,arg){if(armsAction(act,arg))return true;","function exPortAction(act,arg){if(armsAction(act,arg))return true;if(storyPortAct(act,arg))return true;")
rep("function dockExtraHTML(p){hEns();let h=ledgerHTML()+vaultHTML(p)+legHTML(p);","function dockExtraHTML(p){hEns();let h=storyPortHTML(p)+ledgerHTML()+vaultHTML(p)+legHTML(p);")
rep("function defaultState(){return{mat:","function defaultState(){return{story:stDef(),mat:")
rep("migrateXp(d);hardMigrate(d);","migrateXp(d);hardMigrate(d);storyMigrate(d);")
rep("window.__game={HARD:{","window.__game={STORY:{CH,SQ,SQI,ACTS,chBegin,storyPortAct,storyMenuAct,actives,storyTick,sLoc,journalHTML,storyEv,chAvail,sNext,bossTick,stepTxt,sDockCheck,get SQUE(){return SQUE},storyMigrate},HARD:{")
open(P,'w').write(s);print('patched',len(s))
