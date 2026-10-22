import re
p='/workspace/pirate-game/index.html';s=open(p).read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(n,a[:80]);s=s.replace(a,b)
# CSS: compact bubble + tip, lighter dim
rep("#tutRing.dim{box-shadow:0 0 0 200vmax rgba(0,0,0,.38),0 0 16px 4px rgba(255,211,77,.85)}",
    "#tutRing.dim{box-shadow:0 0 0 200vmax rgba(0,0,0,.14),0 0 16px 4px rgba(255,211,77,.85)}")
rep("#tutBub{position:absolute;left:0;top:0;width:min(340px,calc(100vw - 16px));",
    "#tutBub{position:absolute;left:0;top:0;width:min(330px,calc(100vw - 16px));")
rep("border-radius:14px;padding:8px 12px 8px;box-shadow:0 6px 20px rgba(0,0,0,.55);font-size:15px;line-height:1.35;pointer-events:none}",
    "border-radius:12px;padding:4px 9px 6px;box-shadow:0 4px 14px rgba(0,0,0,.5);font-size:13.5px;line-height:1.28;pointer-events:none;opacity:.97}")
rep("#tutBub .tt{font-weight:800;font-size:12px;opacity:.7;display:flex;justify-content:space-between;margin-bottom:2px}",
    "#tutBub .tt{font-weight:800;font-size:11.5px;display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:2px}#tutBub .tt>span:first-child{opacity:.7}#tutBub .tt .tb{display:flex;gap:6px;margin:0}#tutBub .tt button{min-height:34px;min-width:44px;padding:4px 10px;font-size:12.5px;border-radius:9px}")
rep("#tutProg{height:7px;","#tutProg{height:5px;")
rep('margin-top:6px;overflow:hidden}','margin-top:4px;overflow:hidden}')
rep('''  <div id="tutBub"><div class="tt"><span id="tutCount"></span><span>🎓 Tutorial</span></div><div id="tutTxt"></div><div id="tutProg"><div id="tutBar"></div></div>
  <div class="tb"><button class="b" id="tutSkip">Skip tutorial</button><button class="b" id="tutNext">Next ▶</button></div></div></div>''',
'''  <div id="tutBub"><div class="tt"><span id="tutCount"></span><span class="tb"><button class="b" id="tutSkip">Skip</button><button class="b" id="tutNext">Next ▶</button></span></div><div id="tutTxt"></div><div id="tutProg"><div id="tutBar"></div></div></div></div>''')
rep("$('tutSkip').textContent='Tap again to skip';setTimeout(()=>{T.skipArm=0;if(T.on)$('tutSkip').textContent='Skip tutorial';},3000)",
    "$('tutSkip').textContent='Sure? Tap';setTimeout(()=>{T.skipArm=0;if(T.on)$('tutSkip').textContent='Skip';},3000)")
rep("$('tutCount').textContent=`Step ${T.i+1}/${TSTEPS.length}`;","$('tutCount').textContent=`🎓 Step ${T.i+1}/${TSTEPS.length}`;")
# tip box compact
rep("border:3px solid #a12a1d;border-radius:14px;padding:8px 12px;box-shadow:0 6px 20px rgba(0,0,0,.55);font-size:14.5px;line-height:1.35;pointer-events:none}",
    "border:3px solid #a12a1d;border-radius:12px;padding:5px 10px;box-shadow:0 4px 14px rgba(0,0,0,.5);font-size:13.5px;line-height:1.28;pointer-events:none}")
rep("#tipBox .tb{display:flex;justify-content:flex-end;margin-top:6px}","#tipBox .tb{display:flex;justify-content:flex-end;margin-top:3px}#tipBox .tb button{min-height:36px;padding:4px 12px}")
# layout: bubble always at the top (under HUD / minimap), below the target only if the target is up there
old_lay=s[s.index(" const bw=bub.offsetWidth,bh=bub.offsetHeight;let bx,by;"):s.index(" bx=clamp(bx,8+safe.l,Math.max(8,vw-bw-8-safe.r));")]
new_lay=''' const bw=bub.offsetWidth,bh=bub.offsetHeight;let bx,by;
 {const t0=topSlot();bx=t0.x(bw);by=t0.y;}
 if(r){const pad=6;ring.classList.remove('hidden');arr.classList.remove('hidden');
  const w=Math.round(r.width+pad*2),h=Math.round(r.height+pad*2);if(T.lay.rw!==w||T.lay.rh!==h){T.lay.rw=w;T.lay.rh=h;ring.style.width=w+'px';ring.style.height=h+'px';}
  setBox(ring,'ring',`translate(${Math.round(r.left-pad)}px,${Math.round(r.top-pad)}px)`);
  ring.classList.toggle('dim',!T.c.__done);
  const cx=r.left+r.width/2,cy=r.top+r.height/2;const below=cy<vh*0.5;let ay;
  if(below)ay=r.top+r.height+pad+2;else ay=r.top-pad-42;
  arr.classList.toggle('up',below);arr.firstChild.textContent=below?'▲':'▼';setBox(arr,'arr',`translate(${Math.round(cx)}px,${Math.round(ay)}px)`);
  // the target (or its arrow) is up top where the bubble sits: put the bubble just below the target instead
  const hov=r.left<bx+bw+8&&r.left+r.width>bx-8;
  if(hov&&((r.top<by+bh+8&&r.top+r.height>by-8)||(below&&ay+40>by&&ay<by+bh))){by=below?ay+40:r.top+r.height+pad+4;if(by+bh>vh-8){by=Math.max(8,r.top-pad-bh-6);}}}
 else{ring.classList.add('hidden');arr.classList.add('hidden');
  // keep a world target visible: if it sits under the bubble, move the bubble lower
  if(tg&&tg.world&&state==='play'){const X=sx(tg.world.x),Y=sy(tg.world.y);if(Y>by-30&&Y<by+bh+60&&X>bx-30&&X<bx+bw+30)by=Math.min(vh-bh-130-safe.b,Y+70);}}
'''
s=s.replace(old_lay,new_lay)
rep("// canvas part: ring + bouncing arrow on world targets",
"""// shared top slot for the tutorial bubble and one-time tips: just under the HUD / mini-map (portrait) or between them (landscape)
function topSlot(){const m=miniRect();const land=vw>vh&&vh<560;
 if(land){const L=8+safe.l+Math.min(215,vw*0.52)+8,R=m.x-8;return{land,y:8+safe.t,x:bw=>Math.max(L,(L+R)/2-bw/2)};}
 const hb=Math.round($('hud').getBoundingClientRect().bottom);return{land,y:Math.max(hb,m.y+m.s+28)+6,x:bw=>(vw-bw)/2};}
// canvas part: ring + bouncing arrow on world targets""")
# tips + toast: tip at the top slot, toast goes below whichever box is up there
rep("""function layoutTop(){const k=LANDQ.matches?'L':Math.round($('hud').getBoundingClientRect().bottom);if(hudCache.lay===k)return;hudCache.lay=k;
 if(k==='L'){$('toast').style.top='';$('tipBox').style.top='';return;}$('toast').style.top=(k+8)+'px';$('tipBox').style.top=Math.max(212,k+84)+'px';}""",
"""function layoutTop(){const land=LANDQ.matches,hb=Math.round($('hud').getBoundingClientRect().bottom),t0=topSlot(),tip=$('tipBox'),tipOn=!tip.classList.contains('hidden');
 const bub=$('tutBub'),tutOn=T.on&&!$('tut').classList.contains('hidden');let tb=null;
 if(tipOn)tb=t0.y+tip.offsetHeight;else if(tutOn){const r=bub.getBoundingClientRect();if(r.top<t0.y+40)tb=r.bottom;}
 const k=[land,hb,t0.y,tb==null?'':Math.round(tb)].join(':');if(hudCache.lay===k)return;hudCache.lay=k;
 tip.style.top=t0.y+'px';$('toast').style.top=tb!=null?(Math.round(tb)+6)+'px':land?'':(hb+8)+'px';}""")
open(p,'w').write(s);print('ok')
