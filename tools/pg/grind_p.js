// ===== module P: polish — graphics setting (auto Low), Cloud Save & Recovery screen, founder DB check, badge layout =====
// ---- Graphics: High / Low / Auto (device setting, not part of the save). Low = cheaper sea blit + fewer foam particles.
const GFXK='pirateSeas_gfx';
const GFX={mode:'auto',auto:'high',n:0,t0:0,bad:0,last:0,skip:0};
try{GFX.mode=localStorage.getItem(GFXK)||'auto';GFX.auto=localStorage.getItem(GFXK+'_auto')||'high';}catch(e){}
function gfxLow(){return GFX.mode==='low'||(GFX.mode==='auto'&&GFX.auto==='low');}
function gfxApply(){RS.low=gfxLow();}
function gfxSet(m){GFX.mode=m;try{localStorage.setItem(GFXK,m);}catch(e){}if(m==='auto'){GFX.auto='high';GFX.bad=0;try{localStorage.removeItem(GFXK+'_auto');}catch(e){}}gfxApply();}
gfxApply();
// auto: measure real frame rate while sailing; 3 consecutive seconds under 40 fps -> switch to Low (remembered on this device)
function gfxTick(){const now=performance.now();if(GFX.mode!=='auto'||GFX.auto==='low')return;
 if(state!=='play'||document.hidden){GFX.t0=0;return;}
 if(!GFX.t0||now-GFX.last>250){GFX.t0=now;GFX.n=0;GFX.last=now;return;}GFX.last=now;GFX.n++;
 if(now-GFX.t0>=1000){const fps=GFX.n*1000/(now-GFX.t0);GFX.t0=now;GFX.n=0;if(GFX.skip<2){GFX.skip++;return;}
  GFX.bad=fps<40?GFX.bad+1:0;if(GFX.bad>=3){GFX.auto='low';try{localStorage.setItem(GFXK+'_auto','low');}catch(e){}gfxApply();toast('⚙️ Graphics set to Low for smoother sailing (☰ Menu → Graphics)');}}}
GH.draw.push(gfxTick);
{const _ap=addPart;addPart=function(type,x,y,vx,vy,life,size,color){if(RS.low&&(type==='foam'||type==='wake')&&Math.random()<0.5)return;return _ap(type,x,y,vx,vy,life,size,color);};}
function gfxLabel(){return GFX.mode==='auto'?`Auto (now ${gfxLow()?'Low':'High'})`:GFX.mode==='low'?'Low':'High';}
// ---- Cloud Save & Recovery screen (online captains)
(()=>{const st=document.createElement('style');st.textContent=`#oCloud{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:12px}#oCloud.hidden{display:none}
#oCloud .panel{max-width:360px;width:100%;padding:14px 16px;text-align:left;max-height:92vh;overflow:auto}#oCloud h3{margin:0 0 8px;font-size:19px}#oCloud .ocCode{font:700 15px/1.35 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.3px;white-space:nowrap;text-align:center;padding:8px;margin:8px 0;border:1.5px dashed #8a6a3a;border-radius:8px;background:rgba(255,248,225,.55);user-select:all;-webkit-user-select:all;word-break:break-all}
#oCloud .ocRow{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#oCloud .ocRow>*{flex:1 1 auto}#oCloud input{min-width:0;padding:8px;font:600 15px ui-monospace,monospace;border-radius:8px;border:1.5px solid #8a6a3a;background:#fffaf0;text-transform:uppercase}#oCloud .ocSt{min-height:18px;font-size:13px;margin-top:4px}#oCloud small{display:block;opacity:.85;line-height:1.35}#oCloud .ocHi{padding:8px;border-radius:8px;background:rgba(176,138,74,.18);border:1px solid rgba(176,138,74,.6);margin-bottom:6px;font-size:14px}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='oCloud';d.className='hidden';d.innerHTML='<div class="panel" id="ocP"></div>';document.body.appendChild(d);
 d.addEventListener('pointerdown',e=>{if(e.target===d)ocClose();});})();
let ocPrev=null;
function ocClose(){$('oCloud').classList.add('hidden');if(ocPrev==='play'&&state==='menu')state='play';ocPrev=null;}
function ocCopy(t){const ok=()=>{const s=$('ocSt');if(s)s.textContent='✅ Copied — paste it somewhere safe (notes, email to yourself).';};
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>ocCopyOld(t,ok));return;}}catch(e){}ocCopyOld(t,ok);}
function ocCopyOld(t,ok){try{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();ok();}catch(e){const s=$('ocSt');if(s)s.textContent='Select the code above and copy it.';}}
function ocOpen(prompt){if(!ONLINE)return;const d=$('oCloud');if(state==='play'){ocPrev='play';state='menu';}d.classList.remove('hidden');ocRender(prompt);
 if(!OC.ready)ocSync().then(()=>{if(!d.classList.contains('hidden'))ocRender(prompt);}).catch(e=>{const s=$('ocSt');if(s)s.textContent='❌ '+mpLErr(e);});}
function ocRender(prompt){const p=$('ocP');const code=OC.ready&&OC.k?mpFmtCode(OC.k):'';
 p.innerHTML=`<h3>☁️ Cloud Save &amp; Recovery</h3>${prompt?`<div class="ocHi">⚓ <b>Save your recovery code now.</b> It's the only way to get this online captain back on a new phone or browser.</div>`:''}
 <small>Online captain · Lv${S.clvl} · 💰${ocGold()} — saved to the cloud automatically. Your offline captain is separate and stays on this device.</small>
 ${code?`<div class="ocCode" id="ocCode">${code}</div><div class="ocRow"><button class="b green" id="ocCopy">📋 Copy code</button><button class="b" id="ocUp">⬆️ Save now</button></div><small>Anyone with this code can load the captain — keep it private.</small>`:`<div class="ocCode">Connecting…</div>`}
 <div class="ocSt" id="ocSt"></div>
 <div style="margin-top:10px"><b>🔄 Restore on this device</b><small>Enter a recovery code to load that online captain here. Replaces the online captain in this browser (offline captain untouched).</small></div>
 <div class="ocRow"><input id="ocIn" placeholder="XXXX-XXXX-…" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="b" id="ocGo">Restore</button></div><div class="ocSt" id="ocRSt"></div>
 <div class="ocRow"><button class="b" id="ocX">${prompt?'✅ I saved it':'Close'}</button></div>`;
 if(prompt){S.oRcP=1;save();}
 if($('ocCopy'))$('ocCopy').onclick=()=>ocCopy(OC.k);
 if($('ocUp'))$('ocUp').onclick=async()=>{const s=$('ocSt');s.textContent='⏳ Saving…';s.textContent=(await ocUp(true))?'✅ Saved to the cloud.':'❌ Not saved yet ('+(/permission/i.test(OC.err)?'too much progress at once — retrying soon':OC.err||'offline')+').';};
 $('ocX').onclick=ocClose;const inp=$('ocIn');['keydown','keyup','keypress'].forEach(t=>inp.addEventListener(t,e=>e.stopPropagation()));
 $('ocGo').onclick=async()=>{const st=$('ocRSt');if(OC.k&&ocNorm(inp.value)===OC.k){st.textContent='That is already this captain.';return;}st.textContent='⏳ Fetching…';try{const [k,v]=await ocGet(inp.value);
  if(k===OC.k){st.textContent='That is already this captain.';return;}
  st.innerHTML=`Load this online captain? Lv${v.lv|0} · 💰${v.g|0}<br><b>Replaces the online captain in this browser.</b><br><button class="b green" id="ocYes">Yes, load it</button>`;
  $('ocYes').onclick=async()=>{st.textContent='⏳ Loading…';try{await ocRestore(k);}catch(e){st.textContent='❌ '+mpLErr(e);}};}catch(e){st.textContent='❌ '+mpLErr(e);}};}
// one-time prompt: after the first online session (on leaving it), or after 4 min of online sailing
const RCPK='pirateSeas_rcp';
{const _lv=mpLeave;mpLeave=async function(s){if(ONLINE&&MPX.on&&!S.oRcP){try{sessionStorage.setItem(RCPK,'1');}catch(e){}}return _lv(s);};mpApi.mpLeave=mpLeave;}
GH.tick.push(dt=>{if(!ONLINE||S.oRcP||!MPX.on||!OC.ready||!OC.k)return;S.oOnT=(S.oOnT||0)+dt;
 if(S.oOnT>240&&state==='play'&&$('tipBox').classList.contains('hidden')&&!T.on&&!hullLocked())ocOpen(true);});
function ocBootPrompt(){let f=false;try{f=!!sessionStorage.getItem(RCPK);sessionStorage.removeItem(RCPK);}catch(e){}if(f&&ONLINE&&!S.oRcP)setTimeout(()=>ocOpen(true),900);}
// ---- Founding Captain: also check the DB for this browser's pre-change online activity (weekly leaderboard / market)
const OFOUND_TS=1792708631000+10*60000;
async function oFounderDb(){if(!ONLINE||S.founder||S.oFdb||!S.oFresh)return;try{if(localStorage.getItem('pirateSeas_founder'))return;}catch(e){}
 await fbLoad();const {D,db}=MPX.fb,uid=MPX.uid;if(!uid)return;let hit=false;
 for(const w of [nxWeek(),nxWeek(-1)]){try{const r=await D.get(mpR('lb/'+w+'/'+uid));if(r.exists()&&(r.val().t||0)<OFOUND_TS){hit=true;break;}}catch(e){}}
 if(!hit){try{const q=await D.get(D.query(D.ref(db,'mk'),D.orderByChild('s'),D.equalTo(uid)));q.forEach(c=>{if(((c.val()||{}).t||0)<OFOUND_TS)hit=true;});}catch(e){}}
 S.oFdb=1;if(hit){oFounderGrant();}save();if(hit){ocUp(true).catch(()=>{});
  const d=document.createElement('div');d.id='oNote';d.innerHTML=`<div class="panel"><b>⚓ Founding Captain!</b>You sailed online on launch day.<div class="oFound">Exclusive Founding Captain flag &amp; sails + 100☠ Infamy added.</div><br><button class="big" id="oNoteOk2">Aye!</button></div>`;document.body.appendChild(d);$('oNoteOk2').onclick=()=>d.remove();}}
{const _s=ocSync;ocSync=function(){return _s().then(r=>{oFounderDb().catch(()=>{});return r;});};}
// ---- boarding badge: never sit on top of the online lobby pill (joiners)
let pLockForce=false;{const _h=hullLocked;hullLocked=function(){return pLockForce||_h();};}
function pLockTest(v){pLockForce=!!v;}
function pLockTop(hb){let t=hb+5;const pl=$('mpPill'),b=$('hullLock');if(pl&&!pl.classList.contains('hidden')&&b){const r=pl.getBoundingClientRect(),w=b.offsetWidth||190,x0=window.innerWidth/2-w/2;
 if(r.width&&r.right>x0-4&&r.bottom>t-2&&r.top<t+26)t=Math.round(r.bottom)+6;}return t;}
// ---- title (online): obvious entry point
function ocTitleBtn(){if(!ONLINE)return;const tf=document.querySelector('#title .tfoot');if(tf&&!$('ocTBtn')){const b=document.createElement('button');b.className='big';b.id='ocTBtn';b.style.flex='1 1 100%';b.textContent='☁️ Cloud Save & Recovery';b.onclick=()=>{initAudio();ocOpen(false);};tf.appendChild(b);}}
function pMenuTop(){return ONLINE?row('☁️ Cloud Save & Recovery','View / copy your recovery code, or restore your online captain on a new device.',btn('ocloud','Open',true)):'';}
function pMenuRows(){return row('⚙️ Graphics',`${gfxLabel()} — Low draws a cheaper sea and fewer foam particles for smoother play on slower phones.`,btn('gfx',GFX.mode==='auto'?'High':GFX.mode==='high'?'Low':'Auto',true));}
function pAct(a){if(a==='ocloud'){$('menu').classList.add('hidden');state='play';ocOpen(false);return true;}
 if(a==='gfx'){gfxSet(GFX.mode==='auto'?'high':GFX.mode==='high'?'low':'auto');renderMenu();return true;}return false;}
