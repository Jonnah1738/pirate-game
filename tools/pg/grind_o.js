// ===== module O: separate ONLINE captain profile (own save key + cloud), harder online economy =====
const OC={k:'',lv:0,x:0,g:0,ready:false,p:null,busy:false,last:0,failT:0,err:'',ups:0,joining:false,t:120};
const OMK='pirateSeas_mode',OLK='pirateSeas_olob',ONK='pirateSeas_onNotice';
function oSetMode(m,lob){try{save();}catch(e){}try{sessionStorage.setItem(OMK,m);if(lob)sessionStorage.setItem(OLK,'1');else sessionStorage.removeItem(OLK);}catch(e){}location.reload();}
// --- harder online economy (offline untouched) ---
if(ONLINE){
 {const _x=xpNeed;xpNeed=function(l){return _x(l)*OEC.xp;};}
 try{if(EXP&&EXP.xpNeed)EXP.xpNeed=xpNeed;}catch(e){}
 for(const k in HULLS)if(HULLS[k].cost)HULLS[k].cost=Math.round(HULLS[k].cost*OEC.hull);
 for(const k in FTYPES)if(FTYPES[k].cost)FTYPES[k].cost=Math.round(FTYPES[k].cost*OEC.fleet);
 {const _c=craftCost;craftCost=function(c,t){const k=_c(c,t);if(!k)return k;const res={};for(const r in k.res)res[r]=Math.ceil(k.res[r]*OEC.craft);const mat=k.mat?Object.fromEntries(Object.entries(k.mat).map(([a,b])=>[a,Math.ceil(b*OEC.mat)])):k.mat;return Object.assign({},k,{res,g:Math.round(k.g*OEC.craft),mat});};}
 {const _ch=craftChance;craftChance=function(c,t){return Math.min(1,_ch(c,t)*OEC.chance);};}
 {const _m=upMat;upMat=function(k,l){const r=_m(k,l);if(!r)return r;const o={};for(const a in r)o[a]=Math.ceil(r[a]*OEC.mat);return o;};}
 {const _lk=grindLootK;grindLootK=function(){return _lk()*OEC.loot;};}
 TIPS.onl="🌐 <b>New online captain!</b> Fresh Lv1 sloop — online is a tougher grind than solo. Under Lv"+NEWB_LV+" you're protected near 🏴‍☠️ havens. Progress saves to the cloud (recovery code in the 🌐 lobby menu).";
}
// --- cloud profile: oc/{code}={u,lv,g,x,t,d,n}, ou/{uid}=code ---
function ocGold(){return Math.max(0,Math.floor((S.gold||0)+(S.vault||0)));}
function ocNorm(c){return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
async function ocGet(code){code=ocNorm(code);if(code.length!==24)throw new Error('Recovery codes are 24 characters.');await fbLoad();const {D}=MPX.fb;const r=await D.get(mpR('oc/'+code));if(!r.exists())throw new Error('No online captain with that code.');return [code,r.val()];}
async function ocClaim(k,v){const {D}=MPX.fb;const up={};up['oc/'+k]={u:MPX.uid,lv:v.lv,g:v.g,x:v.x,d:v.d,n:v.n||'',t:mpTS()};up['ou/'+MPX.uid]=k;await D.update(D.ref(MPX.fb.db),up);}
function ocAdopt(k,v){const r=parseCode(v.d);const s=r.s;s.oc={k};localStorage.setItem(SAVEKEY,JSON.stringify(s));importing=true;try{sessionStorage.setItem(OLK,'1');}catch(e){}location.reload();}
function ocSync(){if(!ONLINE)return Promise.resolve();if(OC.ready)return Promise.resolve();if(OC.p)return OC.p;
 OC.p=(async()=>{await fbLoad();const {D}=MPX.fb;const uid=MPX.uid;let k=(S.oc&&S.oc.k)||'';
  if(!k){const r=await D.get(mpR('ou/'+uid));if(r.exists())k=String(r.val());}
  if(k){const r=await D.get(mpR('oc/'+k));if(r.exists()){const v=r.val();
    if(v.d&&((v.x||0)>(S.xp||0)+0.5||!S.oc||!S.oc.k)){if(v.u!==uid)await ocClaim(k,v);ocAdopt(k,v);await new Promise(()=>{});}
    if(v.u!==uid)await ocClaim(k,v);OC.lv=v.lv|0;OC.x=v.x||0;OC.g=v.g||0;}else k='';}
  if(!k){k=mpGen(24);OC.lv=0;}
  OC.k=k;S.oc={k};save();OC.ready=true;await ocUp(true);
 })().catch(e=>{OC.p=null;throw e;});return OC.p;}
async function ocUp(force){if(!ONLINE||!OC.ready||!MPX.fb||OC.busy)return false;const {D}=MPX.fb;
 const v={u:MPX.uid,lv:clamp(S.clvl|0,1,MAXLVL),g:ocGold(),x:Math.max(0,Math.floor(S.xp||0)),d:makeCode(),n:String(S.mpName||MPX.name||'').slice(0,16),t:mpTS()};
 if(!force&&v.lv===OC.lv&&v.x===OC.x&&v.g===OC.g)return true;
 OC.busy=true;OC.last=Date.now();const up={};up['oc/'+OC.k]=v;up['ou/'+MPX.uid]=OC.k;
 try{await D.update(D.ref(MPX.fb.db),up);const lvUp=v.lv!==OC.lv;OC.lv=v.lv;OC.x=v.x;OC.g=v.g;OC.err='';OC.ups++;OC.failT=0;if(lvUp&&MPX.on)mpUpdP();return true;}
 catch(e){OC.err=String(e&&e.message||e);OC.failT=Date.now();return false;}finally{OC.busy=false;}}
async function ocRestore(code){const [k,v]=await ocGet(code);if(v.u!==MPX.uid)await ocClaim(k,v);ocAdopt(k,v);}
// presence level can never exceed the cloud-confirmed online level (rules enforce the same)
{const _pf=mpProfile;mpProfile=function(){const v=_pf();if(ONLINE)v.l=Math.max(1,Math.min(v.l,Math.max(2,OC.lv|0)));return v;};}
{const _f=mpFrame;mpFrame=function(dt){_f(dt);if(!ONLINE||!OC.ready)return;OC.t-=dt;const now=Date.now();
 if(OC.busy||(OC.failT&&now-OC.failT<30000))return;
 if(OC.t<=0||((S.clvl|0)>OC.lv&&now-OC.last>8000)){OC.t=120;ocUp();}};}
// join/leave: online mode only; sync the cloud profile first; leaving returns to the lobby browser
{const _j=mpJoin;mpJoin=async function(lid,meta,idx){if(!ONLINE)throw new Error('Switch to Play Online first.');await ocSync();OC.joining=true;try{return await _j(lid,meta,idx);}finally{OC.joining=false;}};}
{const _lv=mpLeave;mpLeave=async function(s){const was=MPX.on;if(was&&ONLINE&&!OC.joining)await ocUp(true).catch(()=>{});await _lv(s);if(was&&ONLINE&&!OC.joining&&!s)oSetMode('online',true);};}
Object.assign(mpApi,{mpJoin,mpLeave});
{const _o=mpOpen;mpOpen=function(){if(!ONLINE){oSetMode('online',true);return;}_o();ocSync().then(()=>{if(!$('mpL').classList.contains('hidden'))mpLRender(MPX.lastList||null);}).catch(e=>{mpLSt('❌ '+mpLErr(e),true);});};}
// lobby browser: the cloud section now manages the ONLINE captain (old offline cloud save is not used online)
{const _r=mpLRender;mpLRender=function(list){const keep=$('mpORIn')?$('mpORIn').value:'';_r(list);if(!ONLINE)return;const ri=$('mpRIn');const sec=ri&&ri.closest('.mpSec');if(!sec)return;
 sec.innerHTML=`<h3>🌐 Online captain <small>(cloud save)</small></h3><div>Lv${S.clvl} · 💰${ocGold()} — separate from your offline captain, saved to the cloud automatically.</div>${OC.k&&OC.ready?`<div>Recovery code:</div><div class="mpCode" id="mpOC">${mpFmtCode(OC.k)}</div><div class="mpSt" style="font-size:12px">Write it down: it restores this online captain in any browser. Anyone with the code can load it.</div><button class="mpB" id="mpOUp">⬆️ Save now</button>`:`<div class="mpSt">Connecting your online captain…</div>`}
 <div style="display:flex;gap:6px;margin-top:6px"><input class="mpIn" id="mpORIn" placeholder="Recovery code"><button class="mpB" id="mpORGo">Restore</button></div><div class="mpSt" id="mpORSt"></div>`;
 const st=$('mpORSt');if($('mpOUp'))$('mpOUp').onclick=async()=>{st.textContent='⏳ Saving…';st.textContent=(await ocUp(true))?'✅ Saved to the cloud.':'❌ Not saved yet ('+(/permission/i.test(OC.err)?'too much progress at once — retrying soon':OC.err||'offline')+').';};
 $('mpORGo').onclick=async()=>{st.textContent='⏳ Fetching…';try{const [k,v]=await ocGet($('mpORIn').value);st.innerHTML=`Load this online captain? Lv${v.lv|0} · 💰${v.g|0}<br><b>Replaces the online captain in this browser.</b> Your offline captain is not touched.<br><button class="mpB" id="mpORYes">Yes, load it</button>`;
  $('mpORYes').onclick=async()=>{st.textContent='⏳ Loading…';try{if(v.u!==MPX.uid)await ocClaim(k,v);ocAdopt(k,v);}catch(e){st.textContent='❌ '+mpLErr(e);}};}catch(e){st.textContent='❌ '+mpLErr(e);}};
 $('mpORIn').value=keep;$('mpORIn').addEventListener('keydown',e=>e.stopPropagation());
 const b=$('mpLBody');if(b&&!$('mpOff')){const x=document.createElement('button');x.className='mpBig';x.id='mpOff';x.textContent='⛵ Back to Offline (Solo)';x.onclick=()=>oSetMode('offline');b.appendChild(x);}};}
// --- UI: title modes, ONLINE tag, one-time notice, short intro ---
(()=>{const st=document.createElement('style');st.textContent=`#oTag{position:absolute;right:6px;top:-9px;background:#1f7a3a;color:#fff;font:800 10px/1 system-ui,sans-serif;letter-spacing:1px;padding:3px 6px;border-radius:6px;border:1px solid #9fe0b0;text-shadow:none}
#oNote{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55)}#oNote .panel{max-width:330px;padding:16px;text-align:center}#oNote b{display:block;font-size:18px;margin-bottom:8px}#oNote button{margin-top:12px}
#offBtn{flex:1 1 100%}.oFound{margin-top:10px;padding:8px;border:1.5px solid #b08a4a;border-radius:8px;background:rgba(20,80,60,.12);font-size:14px}.oFound b{display:inline;font-size:15px;margin:0}.oMode{display:inline-block;font-size:12px;vertical-align:middle;background:#1f7a3a;color:#fff;border-radius:6px;padding:2px 6px;margin-left:6px}`;document.head.appendChild(st);})();
// Founding Captains: played online before the fresh-start change (online used the main save then, so it carries MP markers)
NSHOP.push(['sail','founder','Founding Captain',99999,'#14503c'],['flag','founder','Founding Captain',99999,'#0d3a2c','#ffd34d']);
for(const it of NSHOP.slice(-2)){if(!COS[it[0]].some(x=>x[0]===it[1]))COS[it[0]].push([it[1],it[2],999].concat(it.slice(4)));}
function oFounderCheck(){try{if(localStorage.getItem('pirateSeas_founder'))return false;const o=JSON.parse(localStorage.getItem('pirateSeas_save_v1')||'null');if(!o)return false;
 return !!(o.mpName||o.mpLast||o.mpK||o.mpD||o.mpM||o.mpB||(o.mpW&&Object.keys(o.mpW).length)||(o.cloud&&o.cloud.k));}catch(e){return false;}}
function oFounderGrant(){S.cosU=S.cosU||{};S.cosU['sail:founder']=1;S.cosU['flag:founder']=1;S.cos.sail='founder';S.cos.flag='founder';S.mpM=(S.mpM|0)+100;S.founder=1;applyCos();try{localStorage.setItem('pirateSeas_founder','1');}catch(e){}}
function oBoot(hadSave){const sb=$('startBtn'),mb=$('mpBtn');
 if(!ONLINE){sb.textContent=hadSave?'⛵ Offline (Solo) — continue':'⛵ Offline (Solo)';if(mb)mb.textContent='🌐 Play Online';return;}
 if(!hadSave){S.tutDone=true;S.tutStep=0;S.oFresh=1;if(oFounderCheck()){oFounderGrant();try{const o=JSON.parse(localStorage.getItem('pirateSeas_save_v1'));if(o.mpName)S.mpName=String(o.mpName).slice(0,16);}catch(e){}}}if(!S.oIntro)S.tips.onl=0;save();
 const h=document.querySelector('#title h1');if(h)h.insertAdjacentHTML('beforeend','<span class="oMode">ONLINE</span>');
 sb.classList.add('hidden');['tutBtn','xferTitleBtn'].forEach(i=>$(i)&&$(i).classList.add('hidden'));if(mb)mb.textContent='🌐 Play Online — choose a lobby';
 const tf=document.querySelector('#title .tfoot');if(tf&&!$('offBtn')){const b=document.createElement('button');b.className='big';b.id='offBtn';b.textContent='⛵ Offline (Solo)';b.onclick=()=>oSetMode('offline');tf.appendChild(b);}
 const tm=$('titleMsg');tm.innerHTML=`🌐 Online captain · Lv${S.clvl} · 💰${ocGold()} — separate from your offline captain.`;tm.classList.remove('hidden');
 const x=$('titleX');if(x){const y=x.cloneNode(true);x.replaceWith(y);y.addEventListener('click',()=>{initAudio();mpOpen();});}
 sb.addEventListener('click',()=>{if(!S.oIntro){S.oIntro=1;let n=0;const tryTip=()=>{if(++n<40&&(state!=='play'||!$('tipBox').classList.contains('hidden')||(!S.tips.mp&&n<8))){setTimeout(tryTip,1000);return;}S.tips.onl=0;showTip('onl');};setTimeout(tryTip,1200);}});
 const hud=$('hud');if(hud&&!$('oTag')){hud.style.position=hud.style.position||'fixed';const t=document.createElement('span');t.id='oTag';t.textContent='ONLINE';hud.appendChild(t);}
 let seen=false;try{seen=!!localStorage.getItem(ONK);}catch(e){}
 if(!seen){const d=document.createElement('div');d.id='oNote';d.innerHTML=`<div class="panel"><b>🌐 Online captains start fresh.</b>Your offline captain is safe.<br><small>Online has its own Lv1 captain, saved to the cloud — a tougher grind than solo.</small>${S.founder?`<div class="oFound">⚓ <b>Founding Captain!</b> Thanks for sailing on launch day: exclusive Founding Captain flag &amp; sails + 100☠ Infamy.</div>`:''}<br><button class="big" id="oNoteOk">Aye!</button></div>`;document.body.appendChild(d);
  $('oNoteOk').onclick=()=>{try{localStorage.setItem(ONK,'1');}catch(e){}d.remove();};}
 let lob=false;try{lob=!!sessionStorage.getItem(OLK);sessionStorage.removeItem(OLK);}catch(e){}
 if(lob)setTimeout(()=>mpOpen(),50);}
{const _ml=nxMkList;nxMkList=async function(g,q,p){if(Math.round(q)*Math.round(p)>50000)throw new Error('Listing too big — max 50,000💰 total per listing.');return _ml(g,q,p);};nxApi.nxMkList=nxMkList;}
