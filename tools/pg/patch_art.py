import re
P='/workspace/pirate-game/index.html'
s=open(P).read()
a=s.find('// ---------------- rendering ----------------');b=s.find('function rr(g,x,y,w,h,r)')
assert a>0 and b>a
s=s[:a]+open('/workspace/tools/pg/brawlart.js').read()+s[b:]
def rep(x,y,n=1):
    global s
    assert s.count(x)==n,(x,s.count(x));s=s.replace(x,y)
rep("Object.assign(BR,{on:true,ph:'zoom',mode,e,f:f||null,u:[],tg:[],fx:[],deco:[],fires:[],","Object.assign(BR,{on:true,ph:'zoom',mode,e,f:f||null,u:[],tg:[],fx:[],deco:[],fires:[],corpses:[],")
rep("function killUnit(v,src){if(v.dead)return;v.dead=1;v.hp=0;addFx('poof',v.x,v.y,{T:0.5});","function killUnit(v,src){if(v.dead)return;v.dead=1;v.hp=0;addFx('dust',v.x,v.y,{T:0.7});if(!v.over&&walk(v.x,v.y,0)){(BR.corpses||(BR.corpses=[])).push({x:v.x,y:v.y,face:v.face,r:v.r,lk:lookOf(v),t:BR.t});if(BR.corpses.length>30)BR.corpses.shift();}")
rep("v.hp-=dmg;v.hitT=0.15;","v.hp-=dmg;v.hitT=0.15;addFx('hit',v.x,v.y,{a:ang+Math.PI,T:0.4});if(kb>=200)BR.shk=Math.max(BR.shk,3);")
rep("u.shots--;u.pcd=0.35;","u.shots--;u.pcd=0.35;u.shotT=BR.t;")
# de-emoji overlay titles/buttons
i=s.find('function showPick');j=s.find("$('brPick').classList.remove('hidden');}",i);assert j>0
s=s[:j]+"deEmo($('brPick'),['#bpTitle','.tac b','#bpCut']);"+s[j:]
rep("$('brRes').classList.remove('hidden');save();}","deEmo($('brRes'),['#brTitle','#brBtns button']);$('brRes').classList.remove('hidden');save();}")
# buttons: drawn icons
SV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
ic={'slash':SV+'<path d="M5 3l11.5 11.5M19 3L7.5 14.5"/><path d="M13.6 17.4l4.2-4.2M10.4 17.4l-4.2-4.2"/><path d="M16.4 16.4l3.6 3.6M7.6 16.4L4 20"/></svg>',
 'block':SV+'<path d="M12 3l7.5 2.8v5.4c0 4.8-3.3 8-7.5 9.8-4.2-1.8-7.5-5-7.5-9.8V5.8z"/><path d="M12 3.4v17.4M5 10.5h14"/></svg>',
 'pistol':SV+'<path d="M2.5 8.5h14.5l1.6-1.6h2.9v3.6h-4.1l-1.1 1.2h-3.2l-1 2.2v5.6H7.6l1.1-6.6H2.5z"/><path d="M11.2 11.9c.6 1.4 1.9 1.9 3.1 1.6"/></svg>',
 'dodge':SV+'<path d="M3 15c3-6 9-8 15-6"/><path d="M15 5.5l3.6 3.4-3.6 3.4"/><path d="M4 19.5h4M9.5 19.5h3"/></svg>',
 'cut':SV+'<circle cx="6" cy="7" r="2.6"/><circle cx="6" cy="17" r="2.6"/><path d="M8.2 8.4L20 17M8.2 15.6L20 7"/></svg>'}
rep('<button id="bSlash" class="btnr" aria-label="Slash">⚔️<b>SLASH</b></button>','<button id="bSlash" class="btnr" aria-label="Slash">'+ic['slash']+'<b>SLASH</b></button>')
rep('<button id="bBlock" class="btnr" aria-label="Block or parry">🛡️<b>BLOCK</b></button>','<button id="bBlock" class="btnr" aria-label="Block or parry">'+ic['block']+'<b>BLOCK</b></button>')
rep('<button id="bPistol" class="btnr" aria-label="Pistol">🔫<b id="bPn">2</b></button>','<button id="bPistol" class="btnr" aria-label="Pistol">'+ic['pistol']+'<b id="bPn">2</b></button>')
rep('<button id="bDodge" class="btnr" aria-label="Dodge roll">💨<b>DODGE</b></button>','<button id="bDodge" class="btnr" aria-label="Dodge roll">'+ic['dodge']+'<b>DODGE</b></button>')
rep('<canvas id="c"></canvas>','<canvas id="c"></canvas><div id="brVig"></div>')
rep('<button id="bCut" class="hidden">✂️ Cut ropes</button>','<button id="bCut" class="hidden">'+ic['cut']+'<span>Cut ropes</span></button>')
CSS="""
#brVig{position:fixed;inset:0;pointer-events:none;display:none;background:linear-gradient(180deg,rgba(255,140,60,.11),rgba(0,0,0,0) 45%,rgba(20,28,55,.18)),radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 42%,rgba(5,4,3,.58) 100%)}
body.brawl #brVig{display:block}
/* brawl v2: darker iron/parchment UI */
#brCtl .btnr{background:radial-gradient(circle at 38% 30%,#4a423b,#1a1613 72%)!important;border:2px solid rgba(178,142,82,.8)!important;color:#eadcbd!important;box-shadow:0 4px 10px rgba(0,0,0,.6),inset 0 0 0 2px rgba(0,0,0,.55),inset 0 2px 3px rgba(255,235,200,.12)!important;font-family:Georgia,'Times New Roman',serif}
#brCtl .btnr svg{width:50%;height:50%;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.8))}
#brCtl .btnr b{font-family:Georgia,'Times New Roman',serif;font-weight:700;letter-spacing:.9px;font-size:9px;color:#d8c69c;margin-top:1px}
#brCtl #bSlash{background:radial-gradient(circle at 38% 30%,#62291f,#1f0d0a 72%)!important}
#brCtl #bBlock{background:radial-gradient(circle at 38% 30%,#3a4450,#121619 72%)!important}
#brCtl #bPistol{background:radial-gradient(circle at 38% 30%,#4c3d2c,#18120c 72%)!important}
#brCtl #bDodge{background:radial-gradient(circle at 38% 30%,#36423b,#101512 72%)!important}
#brCtl #bBlock.held{box-shadow:0 0 0 3px rgba(214,180,100,.55),0 4px 10px rgba(0,0,0,.6)!important}
#brCtl #bPistol b{font-size:12px}
#bCut{background:linear-gradient(180deg,#2c2420,#17120e)!important;border:1px solid rgba(178,142,82,.7)!important;color:#eadcbd!important;font-family:Georgia,'Times New Roman',serif!important;font-weight:700!important;letter-spacing:.4px;border-radius:5px!important;display:flex;align-items:center;gap:6px;box-shadow:0 3px 8px rgba(0,0,0,.55)}
#bCut.hidden{display:none!important}#bCut svg{width:16px;height:16px}
#brPick.overlay,#brRes.overlay{background:rgba(6,5,4,.6)}
#brPick .panel,#brRes .panel{background:linear-gradient(180deg,#2b241e,#16120e)!important;border:1px solid rgba(178,142,82,.65)!important;box-shadow:0 10px 30px rgba(0,0,0,.7),inset 0 0 0 1px rgba(0,0,0,.6)!important;color:#e6dac0!important;font-family:Georgia,'Times New Roman',serif;border-radius:6px!important}
#brPick h2,#brRes h2{color:#dcc48a!important;font-family:Georgia,'Times New Roman',serif;letter-spacing:.4px;border-bottom:1px solid rgba(178,142,82,.35);padding-bottom:6px}
#brPick .note,#brRes .note{background:rgba(0,0,0,.28)!important;color:#d9ccb0!important;border:1px solid rgba(178,142,82,.18)!important}
#brPick .tac,#brPick .b,#brRes .b{background:linear-gradient(180deg,#3a3029,#221b16)!important;color:#efe4c9!important;border:1px solid rgba(178,142,82,.55)!important;font-family:Georgia,'Times New Roman',serif!important;border-radius:5px!important;box-shadow:0 2px 6px rgba(0,0,0,.5)!important}
#brPick .tac b{font-variant:small-caps;letter-spacing:.6px;font-size:16px;color:#e8d29a}
#brPick .tac small{color:#bdb092!important}#brPick .help{color:#b9ac8f!important;background:rgba(0,0,0,.28)!important;border:1px solid rgba(178,142,82,.18)!important}#brPick .help b{color:#e0c88e}
#brPick .b.red,#brRes .b.red{background:linear-gradient(180deg,#58201a,#2e100c)!important}
#brRes .b[disabled]{opacity:.45}
body.brawl #hud{filter:saturate(.4) sepia(.25) brightness(.92);font-family:Georgia,'Times New Roman',serif;background:rgba(16,13,10,.85)!important;box-shadow:inset 0 0 0 1px rgba(176,140,80,.45)}
body.brawl #toast{background:rgba(18,14,11,.9)!important;border:1px solid rgba(178,142,82,.55)!important;color:#e9dcc0!important;font-family:Georgia,'Times New Roman',serif;font-weight:600;border-radius:4px}
"""
i=s.find('</style>');s=s[:i]+CSS+s[i:]
rep("$('bpHelp').innerHTML=IS_TOUCH?'🕹️ Drag anywhere to move • ⚔️ tap to slash (3-hit combo) • 🛡️ hold to block — tap it just before a hit to <b>parry</b> • 🔫 pistol • 💨 dodge roll (dodges red attacks)'","$('bpHelp').innerHTML=IS_TOUCH?'Drag anywhere to move · <b>Slash</b>: tap for a 3-hit combo · <b>Block</b>: hold — tap just before a hit to <b>parry</b> · <b>Pistol</b>: a few shots, then reload · <b>Dodge</b>: roll through red attacks'")
rep("$('toast').style.top=bw?(Math.round((land?t0.y:t0.y-4)+56))+'px'","$('toast').style.top=bw?(Math.round((land?t0.y:t0.y-4)+92))+'px'")
open(P,'w').write(s);print('patched',len(s))
