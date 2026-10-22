// ================= F: BOARDING HULL LOCK =================
// While a boarding fight (or the final grapple pull) is on, both grappled hulls take no damage.
// Anti-exploit: boarding ends after BRMAX s (both crews fall back), then a re-grapple cooldown (GRAP_CD).
const BRMAX=150,GRAP_CD=12;let lockFxT=0;
function hullLocked(){return !!(BR.on||(GR.e&&GR.ph==='pull'));}
function lockFx(){if(performance.now()-lockFxT<900)return;lockFxT=performance.now();addText(P.x,P.y-30,'🔒','#e9d7a5');}
(function(){const st=document.createElement('style');st.textContent=`#hullLock{position:fixed;left:50%;transform:translateX(-50%);top:calc(6px + env(safe-area-inset-top));z-index:40;pointer-events:none;padding:3px 10px;border-radius:9px;font:700 11.5px Georgia,'Times New Roman',serif;letter-spacing:.4px;color:#f1e2b8;background:rgba(20,16,12,.88);border:1px solid rgba(178,142,82,.85);box-shadow:0 2px 6px rgba(0,0,0,.6);white-space:nowrap}#hullLock.hidden{display:none}`;document.head.appendChild(st);
 const d=document.createElement('div');d.id='hullLock';d.className='hidden';d.textContent='🔒 Boarding: hulls locked';document.body.appendChild(d);
 setInterval(()=>{const on=hullLocked();d.classList.toggle('hidden',!on);if(on){const hb=Math.round($('hud').getBoundingClientRect().bottom)||100;d.style.top=(hb+5)+'px';}if(on&&BR.on&&BR.ph==='fight'){const left=Math.max(0,Math.ceil(BRMAX-BR.t));d.textContent=left<=30?`🔒 Boarding: hulls locked • ${left}s`:'🔒 Boarding: hulls locked';}else if(on)d.textContent='🔒 Boarding: hulls locked';},250);})();
