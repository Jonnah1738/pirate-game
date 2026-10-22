// ================= M: ONLINE — Firebase RTDB lobbies (cap 16), shared sea, PvP, crews, chat, cloud save =================
// Lazy: nothing here loads or connects until the player taps "Play Online" (or enables cloud save).
const FBCFG={apiKey:'AIzaSyAcjkqDpCOD0Qs9UGJ0z6Ek3RQFShI_6UM',authDomain:'pirate-seas-jonnah.firebaseapp.com',databaseURL:'https://pirate-seas-jonnah-default-rtdb.firebaseio.com',projectId:'pirate-seas-jonnah',storageBucket:'pirate-seas-jonnah.firebasestorage.app',messagingSenderId:'835367601968',appId:'1:835367601968:web:67152b38083c970a626af5'};
const FBV='13.1.0',MCELL=2000,MCN=Math.ceil(WORLD/MCELL),MCAP=16,SAFE_R=650,NEWB_LV=6,NEWB_R=2600,MP_STALE=45000,MPI=300,MP_NEAR=1600;
const MPX={on:false,busy:false,fb:null,uid:null,lid:null,slot:-1,pub:true,code:'',lobName:'',name:'',rem:{},cells:new Set(),un:{},subs:[],cell:'',sendT:0,lastSendT:0,force:false,lfl:'',lh:0,
 ping:0,pq:[],fcL:0,fcR:0,flag:'',hits:{},hitT:0,lastHit:null,killer:null,spec:null,chat:[],feed:[],seenC:{},seenK:{},host:false,j:0,off:0,conn:false,everConn:false,crew:'',crewName:'',cw:{},
 hbT:0,hostT:5,joinT:0,inv:[],unread:0,chatOpen:false,inRate:{},stats:{tx:0,rx:0,txB:0,rxB:0,t0:0},uiT:0,cloudT:120,myEmo:null,lastSay:0,warnT:0};
let fbP=null;
function fbLoad(){if(fbP)return fbP;const B=`https://www.gstatic.com/firebasejs/${FBV}/`;
 fbP=Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-database.js')]).then(async([A,U,D])=>{
  const app=A.getApps().length?A.getApp():A.initializeApp(FBCFG);const au=U.getAuth(app);const db=D.getDatabase(app);
  const user=await new Promise((res,rej)=>{const un=U.onAuthStateChanged(au,u=>{un();if(u)res(u);else U.signInAnonymously(au).then(c=>res(c.user),rej);},rej);});
  MPX.fb={A,U,D,app,au,db};MPX.uid=user.uid;
  D.onValue(D.ref(db,'.info/serverTimeOffset'),s=>{MPX.off=s.val()||0;});
  D.onValue(D.ref(db,'.info/connected'),s=>mpConn(!!s.val()));
  return MPX.fb;}).catch(e=>{fbP=null;throw e;});
 return fbP;}
const mpR=p=>MPX.fb.D.ref(MPX.fb.db,p);
const mpL=(p,lid)=>'lob/'+(lid||MPX.lid)+(p?'/'+p:'');
const mpNow=()=>Date.now()+MPX.off;
const mpTS=()=>MPX.fb.D.serverTimestamp();
const mpEsc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function mpErr(e){const m=String(e&&e.message||e);if(/permission/i.test(m)){MPX.warnT>0||mpFeed('⚠️ The sea refused that order (server rules).');MPX.warnT=3;}else console.warn('MP',m);}
// ---------- profanity filter (names + chat) ----------
const MBAD_S=['fuck','fuk','shit','cunt','bitch','nigg','faggot','whore','slut','pussy','asshole','retard','nazi','hitler','kike','chink','twat','wank','porn','mierda','pendejo','cabron','verga','chinga','joder','maricon','zorra','motherf','dickhead','cocksuck','jerkoff','blowjob','dildo','nutsack','hentai'];
const MBAD_W=['rape','raping','rapist','dick','dicks','cock','cocks','cum','tit','tits','titties','sex','sexy','ass','arse','spic','puta','puto','putas','culo','fag','fags','marica','coño','cono','kys','nsfw','penis','vagina','boobs'];
function mpNorm(t){return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[0@4]/g,c=>({'0':'o','@':'a','4':'a'})[c]).replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/[5$]/g,'s').replace(/7/g,'t').replace(/8/g,'b');}
function mpBadName(n){const z=mpNorm(n),flat=z.replace(/[^a-z]/g,'');if(MBAD_S.some(w=>flat.includes(w)))return true;return z.split(/[^a-z]+/).some(w=>MBAD_W.includes(w));}
function mpClean(t){return String(t==null?'':t).replace(/[\u0000-\u001f\u200b-\u200f\u202a-\u202e]/g,'').split(/(\s+)/).map(w=>{if(/^\s+$/.test(w)||!w)return w;const z=mpNorm(w),flat=z.replace(/[^a-z]/g,'');return MBAD_S.some(b=>flat.includes(b))||z.split(/[^a-z]+/).some(x=>MBAD_W.includes(x))?'✶'.repeat(Math.min(6,Math.max(3,w.length))):w;}).join('');}
function mpNameOk(n){n=String(n||'').replace(/\s+/g,' ').trim();if(n.length<3)return 'At least 3 letters, Captain.';if(n.length>16)return 'Max 16 characters.';if(!/^[\p{L}\p{N} _'.-]+$/u.test(n))return 'Letters, numbers, spaces and - _ . \' only.';if(mpBadName(n))return 'Pick a cleaner name — this one is flagged.';return '';}
// ---------- world helpers ----------
function mpCellOf(x,y){return clamp(Math.floor(x/MCELL),0,MCN-1)+'_'+clamp(Math.floor(y/MCELL),0,MCN-1);}
function mpSafeAt(x,y){for(const p of PORTS)if(p.haven&&Math.hypot(p.port.x-x,p.port.y-y)<SAFE_R)return true;return false;}
function mpNewb(){return (S.clvl|0)<NEWB_LV&&PORTS.some(p=>p.haven&&Math.hypot(p.port.x-P.x,p.port.y-P.y)<NEWB_R);}
function mpFlags(){let f='';if(P.dead)f+='d';if(mpSafeAt(P.x,P.y))f+='z';if(mpNewb())f+='n';if(state==='port'||state==='dead'||state==='title')f+='p';if(hullLocked())f+='b';if(MPX.flag)f+=MPX.flag;return f;}
function mpCanPvp(){return MPX.on&&!mpSafeAt(P.x,P.y)&&!mpNewb()&&MPX.flag!=='w'&&!P.dead;}
function mpCanHit(r){if(!r.vis||r.stale||r.deadF||r.sinking)return false;if(/[zpnbd]/.test(r.fl))return false;if(MPX.crew&&r.cr===MPX.crew)return false;return true;}
function mpNoFire(){if(MPX.on&&MPX.flag==='w'){if(!(MPX.warnT>0)){toast('🏳️ You flew the white flag — lower it (💬 → flags) to fire.');MPX.warnT=2;}return true;}return false;}
function mpRegion(){try{const z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';return({America:'AM',Europe:'EU',Asia:'AS',Australia:'OC',Pacific:'OC',Africa:'AF',Atlantic:'EU',Indian:'AS'})[z.split('/')[0]]||'SEA';}catch(e){return 'SEA';}}
function mpGen(n){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const a=new Uint32Array(n);crypto.getRandomValues(a);return [...a].map(v=>A[v%A.length]).join('');}
const HCODE={sloop:'s',brig:'b',frigate:'f',galleon:'g'},HDEC={s:'sloop',b:'brig',f:'frigate',g:'galleon'};
function mpProfile(){return{n:MPX.name,l:clamp(S.clvl|0,1,999),h:((HCODE[S.ship]||'s')+Math.round(clamp(ST.len||52,30,140))+'x'+Math.round(clamp(ST.wid||18,10,60))).slice(0,10),
 c:[S.cos.sail,S.cos.flag,S.cos.hull,S.cos.fx].join('|').slice(0,60),g:clamp(ST.cannons|0,1,20),rg:clamp(Math.round(ST.range||400),100,2000),cr:MPX.crew,cn:MPX.crewName,
 b:clamp(Math.round(S.mpB||0),0,1e8),k:clamp(S.mpK|0,0,1e6),xy:`${P.x|0},${P.y|0}`};}
// ---------- remote ships ----------
function mpRem(uid){let r=MPX.rem[uid];if(!r)r=MPX.rem[uid]={uid,kind:'mp',n:'…',l:1,hull:'sloop',len:52,wid:18,cannons:2,g:2,rg:420,sailC:'#f6efe0',paint:null,deck:null,flagC:null,flagS:null,fx:null,
 x:0,y:0,h:0,vx:0,vy:0,speed:0,thr:0,buf:[],hpP:100,fl:'',fcL:-1,fcR:-1,cr:'',cn:'',b:0,k:0,vis:false,stale:false,gone:0,seenT:0,cell:'',emo:null,hb:0,j:0,xy:null,hitT:0,sinking:0,deadF:false};return r;}
function mpCos(r,c,crewFlag){const a=String(c||'').split('|');const sail=a[0]||'def';r.sailC=sail==='def'?'#f6efe0':cosItem('sail',sail)[3];const h=cosItem('hull',a[2]||'def');r.paint=h[3];r.deck=h[4];
 const f=cosItem('flag',crewFlag||a[1]||'def');r.flagC=f[3];r.flagS=f[4];r.fx=FXC[a[3]]||null;}
function mpApplyP(uid,v){if(!v)return;if(uid===MPX.uid){MPX.j=v.j||MPX.j;return;}const r=mpRem(uid);const fresh=!r.j;
 r.n=mpClean(String(v.n||'?')).slice(0,16);r.l=v.l|0;const m=/^([sbfg])(\d+)x(\d+)$/.exec(v.h||'');r.hull=m?HDEC[m[1]]:'sloop';r.len=m?clamp(+m[2],30,140):52;r.wid=m?clamp(+m[3],10,60):18;
 r.g=clamp(v.g|0,1,12);r.cannons=r.g;r.rg=clamp(v.rg|0||420,100,2000);r.cr=String(v.cr||'');r.cn=mpClean(v.cn||'').slice(0,20);r.b=v.b|0;r.k=v.k|0;r.hb=v.hb||0;r.j=v.j||0;r.c=v.c;
 const cw=r.cr&&MPX.cw[r.cr];mpCos(r,v.c,cw&&cw.f);
 if(v.xy){const q=String(v.xy).split(',').map(Number);if(q.length===2&&isFinite(q[0]))r.xy=q;}
 r.stale=mpNow()-(r.hb||0)>MP_STALE;
 if(fresh&&r.j>MPX.joinT-1000&&MPX.joinT)mpFeed(`⛵ ${mpEsc(r.n)} sailed into the lobby`);}
function mpMot(uid,str,cell){if(uid===MPX.uid||typeof str!=='string')return;MPX.stats.rx++;MPX.stats.rxB+=str.length+62;
 const a=str.split(',');if(a.length<8)return;const x=+a[0],y=+a[1],h=(+a[2])/100,v=+a[3],hp=clamp(+a[4],0,100),fl=String(a[5]||''),fL=+a[6],fR=+a[7];if(!isFinite(x)||!isFinite(y)||!isFinite(h))return;
 const r=mpRem(uid);const now=performance.now();r.cell=cell;r.gone=0;
 if(!r.vis||!r.buf.length||Math.hypot(x-r.x,y-r.y)>1600){r.buf=[];r.x=x;r.y=y;r.h=h;}
 r.buf.push({t:now,x,y,h,v});if(r.buf.length>8)r.buf.shift();r.vis=true;r.seenT=now;r.hpP=hp;r.fl=fl;
 const wd=r.deadF;r.deadF=fl.includes('d');if(r.deadF&&!wd)r.sinking=0.001;if(!r.deadF&&wd)r.sinking=0;
 if(r.fcL>=0&&fL!==r.fcL)mpVolley(r,-1);if(r.fcR>=0&&fR!==r.fcR)mpVolley(r,1);r.fcL=fL;r.fcR=fR;}
function mpVolley(r,side){if(!r.vis||r.stale)return;if(Math.hypot(r.x-P.x,r.y-P.y)>2400)return;const n0=balls.length;fireBroadside(r,side,clamp(r.g|0,1,12),0,'x',r.rg||420);for(let i=n0;i<balls.length;i++){balls[i].src=r.uid;}}
function mpInterp(dt){const rt=performance.now()-MPI;
 for(const id in MPX.rem){const r=MPX.rem[id];if(r.hitT>0)r.hitT-=dt;if(r.emo){r.emo.t-=dt;if(r.emo.t<=0)r.emo=null;}if(r.sinking)r.sinking+=dt;
  if(!r.vis)continue;if(r.gone&&performance.now()-r.gone>1500){r.vis=false;continue;}if(performance.now()-r.seenT>9500){r.vis=false;continue;}
  const b=r.buf;if(!b.length)continue;let x,y,h,v;const L=b[b.length-1];
  if(rt>=L.t){const e=Math.min((rt-L.t)/1000,1);x=L.x+Math.cos(L.h)*L.v*e;y=L.y+Math.sin(L.h)*L.v*e;h=L.h;v=L.v;}
  else if(rt<=b[0].t){x=b[0].x;y=b[0].y;h=b[0].h;v=b[0].v;}
  else{let i=0;while(i<b.length-2&&b[i+1].t<rt)i++;const A=b[i],B=b[i+1];const f=clamp((rt-A.t)/Math.max(1,B.t-A.t),0,1);x=A.x+(B.x-A.x)*f;y=A.y+(B.y-A.y)*f;h=A.h+angDiff(A.h,B.h)*f;v=A.v+(B.v-A.v)*f;}
  if(dt>0){r.vx=r.vx*0.7+0.3*clamp((x-r.x)/dt,-600,600);r.vy=r.vy*0.7+0.3*clamp((y-r.y)/dt,-600,600);}
  r.x=x;r.y=y;r.h=h;r.speed=v;r.thr=clamp(v/170,0,1);}}
// ---------- PvP: shooter detects, victim validates ----------
function mpHit(b){if(!MPX.on||!mpCanPvp())return false;for(const id in MPX.rem){const r=MPX.rem[id];if(!mpCanHit(r))continue;if(hitTest(r,b,5)){MPX.hits[id]=(MPX.hits[id]||0)+b.dmg;r.hitT=0.25;return true;}}return false;}
function mpXHit(b){if(!P.dead&&b.src!==MPX.uid&&hitTest(P,b,2))return true;for(const id in MPX.rem){if(id===b.src)continue;const r=MPX.rem[id];if(r.vis&&!r.sinking&&hitTest(r,b,3))return true;}return false;}
function mpFlushHits(){const ids=Object.keys(MPX.hits);if(!ids.length)return;const {D,db}=MPX.fb;const up={};let n=0;
 for(const id of ids){const r=MPX.rem[id],raw=MPX.hits[id];if(!r)continue;const lf=clamp(1+0.015*((S.clvl|0)-(r.l|0)),0.85,1.15);const pm=clamp(Math.round(1000*raw/Math.max(1,ST.maxHp)*0.9*lf),1,300);
  const k=D.push(mpR(mpL('ev/'+id))).key;up[mpL(`ev/${id}/${k}`)]={a:MPX.uid,d:pm,k:'b',t:mpTS()};n++;}
 MPX.hits={};if(!n)return;up[mpL('hr/'+MPX.uid)]=mpTS();MPX.stats.tx++;MPX.stats.txB+=120*n;D.update(D.ref(db),up).catch(mpErr);}
function mpEv(snap){const v=snap.val();MPX.fb.D.remove(snap.ref).catch(()=>{});if(!v||!MPX.on)return;MPX.stats.rx++;MPX.stats.rxB+=110;
 const r=MPX.rem[v.a];if(!r||r.stale)return;if(MPX.crew&&r.cr===MPX.crew)return;if(Math.abs(mpNow()-(v.t||0))>6000)return;if(/[znp]/.test(r.fl))return;
 const L=r.buf.length?r.buf[r.buf.length-1]:r;if(Math.hypot(L.x-P.x,L.y-P.y)>1800)return;
 if(P.dead||mpSafeAt(P.x,P.y)||mpNewb()||state==='port'||state==='title'||state==='dead')return;
 const now=performance.now();const q=MPX.inRate[v.a]=(MPX.inRate[v.a]||[]).filter(e=>now-e.t<1000);const sum=q.reduce((s,e)=>s+e.d,0);const d=Math.min(clamp(v.d|0,0,300),450-sum);if(d<=0)return;q.push({t:now,d});
 MPX.lastHit={a:v.a,t:now};const was=P.dead;damagePlayer(d/1000*ST.maxHp);if(!was&&P.dead)MPX.killer={a:v.a,t:now};}
function mpKC(){if(!MPX.on)return null;if(P.dead&&MPX.killer){const r=MPX.rem[MPX.killer.a];if(r&&r.vis)return r;}if(MPX.spec&&MPX.spec.t>0){const r=MPX.rem[MPX.spec.uid];if(r&&r.vis)return r;}return null;}
function mpNearHaven(){let bi=S.lastPort|0,bd=1e18;PORTS.forEach((p,i)=>{if(!p.haven)return;const d=Math.hypot(p.port.x-P.x,p.port.y-P.y);if(d<bd){bd=d;bi=i;}});return bi;}
function mpDied(){if(!MPX.on)return;const k=MPX.killer||(MPX.lastHit&&performance.now()-MPX.lastHit.t<8000?MPX.lastHit:null);MPX.killer=null;MPX.lastHit=null;S.lastPort=mpNearHaven();if(!k)return;
 const r=MPX.rem[k.a];const lost=Math.round(S.gold*(S.infamy<300?0.1:0.22));let b=Math.round(lost*0.6)+Math.round(S.mpB||0);if(MPX.flag==='w')b=Math.round(b*0.5);if(MPX.flag==='r'||(r&&r.fl.includes('r')))b=Math.round(b*1.5);b=clamp(b,0,1000000);
 S.mpD=(S.mpD|0)+1;S.mpB=0;const f=MPX.flag||'';MPX.flag='';
 mpPush('k',{a:k.a,v:MPX.uid,an:(r?r.n:'?').slice(0,16),vn:MPX.name,b,xy:`${P.x|0},${P.y|0}`,f,t:mpTS()});
 setTimeout(()=>{const t=$('deadTxt');if(t)t.innerHTML+=`<br>☠️ Sunk by <b>${mpEsc(r?r.n:'a rival captain')}</b> — they claim ${b}💰 bounty. Respawning at the nearest haven.`;},0);}
function mpPush(path,val){const {D,db}=MPX.fb;const k=D.push(mpR(mpL(path))).key;MPX.stats.tx++;MPX.stats.txB+=JSON.stringify(val).length+60;return D.set(mpR(mpL(path+'/'+k)),val).catch(mpErr);}
function mpPosOf(uid){if(uid===MPX.uid)return[P.x,P.y];const r=MPX.rem[uid];if(!r)return null;if(r.vis)return[r.x,r.y];return r.xy;}
function mpKill(snap){const v=snap.val();if(!v||MPX.seenK[snap.key])return;MPX.seenK[snap.key]=1;if((v.t||0)<MPX.joinT-5000)return;
 const me=MPX.uid;mpFeed(`☠️ <b>${mpEsc(mpClean(v.an))}</b> sank <b>${mpEsc(mpClean(v.vn))}</b>${v.b?` — ${v.b|0}💰 bounty`:''}`);
 const kr=v.a===me?null:MPX.rem[v.a];const kcr=v.a===me?MPX.crew:(kr?kr.cr:'');const inCrew=kcr&&kcr===MPX.crew;if(v.a!==me&&!inCrew)return;
 const q=String(v.xy||'').split(',').map(Number);const near=u=>{const p=mpPosOf(u);return !!p&&(!isFinite(q[0])||Math.hypot(p[0]-q[0],p[1]-q[1])<3000);};
 const mem=new Set([v.a]);if(kcr){if(MPX.crew===kcr&&near(me))mem.add(me);for(const id in MPX.rem){const r=MPX.rem[id];if(r.cr===kcr&&!r.stale&&near(id))mem.add(id);}}
 if(!mem.has(me))return;const share=Math.floor((v.b|0)/mem.size);S.gold+=share;S.earned=(S.earned||0)+share;
 if(v.a===me){S.mpK=(S.mpK|0)+1;S.mpB=(S.mpB||0)+100+Math.round((v.b|0)*0.2);S.infamy+=25;toast(`☠️ You sank ${mpClean(v.vn)}! +${share}💰 bounty${mem.size>1?` (split ${mem.size} ways)`:''}`);}
 else toast(`🤝 Crew bounty share: +${share}💰`);chime();addText(P.x,P.y-50,`+${share} 💰`,'#ffe066',true);save();}
// ---------- motion send ----------
function mpSend(){const {D,db}=MPX.fb;const me=MPX.uid;const cell=mpCellOf(P.x,P.y);const hh=((P.h%TAU)+TAU)%TAU;
 const str=`${P.x|0},${P.y|0},${Math.round(hh*100)},${Math.round(Math.abs(P.speed||0))},${Math.round(clamp(P.hp/ST.maxHp,0,1)*100)},${MPX.lfl},${MPX.fcL},${MPX.fcR},${MPX.seq=((MPX.seq|0)+1)%100}`;
 const t0=performance.now();let p;
 if(cell!==MPX.cell){const up={};up[mpL(`c/${cell}/${me}`)]=str;if(MPX.cell){up[mpL(`c/${MPX.cell}/${me}`)]=null;D.onDisconnect(mpR(mpL(`c/${MPX.cell}/${me}`))).cancel().catch(()=>{});}
  D.onDisconnect(mpR(mpL(`c/${cell}/${me}`))).remove().catch(()=>{});MPX.cell=cell;p=D.update(D.ref(db),up);mpResub();}
 else p=D.set(mpR(mpL(`c/${cell}/${me}`)),str);
 MPX.stats.tx++;MPX.stats.txB+=str.length+80;
 p.then(()=>{MPX.pq.push(performance.now()-t0);if(MPX.pq.length>7)MPX.pq.shift();const s=[...MPX.pq].sort((a,b)=>a-b);MPX.ping=Math.round(s[s.length>>1]);}).catch(mpErr);}
function mpResub(){const {D}=MPX.fb;const [ci,cj]=MPX.cell.split('_').map(Number);const want=new Set();
 for(let i=ci-1;i<=ci+1;i++)for(let j=cj-1;j<=cj+1;j++)if(i>=0&&j>=0&&i<MCN&&j<MCN)want.add(i+'_'+j);
 for(const k of [...MPX.cells])if(!want.has(k)){(MPX.un[k]||[]).forEach(f=>f());delete MPX.un[k];MPX.cells.delete(k);for(const id in MPX.rem){const r=MPX.rem[id];if(r.cell===k)r.gone=performance.now();}}
 for(const k of want)if(!MPX.cells.has(k)){const q=mpR(mpL('c/'+k));MPX.un[k]=[D.onChildAdded(q,s=>mpMot(s.key,s.val(),k)),D.onChildChanged(q,s=>mpMot(s.key,s.val(),k)),D.onChildRemoved(q,s=>{const r=MPX.rem[s.key];if(r&&r.cell===k)r.gone=performance.now();})];MPX.cells.add(k);}}
function mpNearN(R){let n=0;for(const id in MPX.rem){const r=MPX.rem[id];if(r.vis&&!r.stale&&(!R||Math.abs(r.x-P.x)+Math.abs(r.y-P.y)<R*1.3))n++;}return n;}
function mpUpdP(){if(!MPX.on)return Promise.resolve();const {D}=MPX.fb;const v=mpProfile();v.hb=mpTS();MPX.stats.tx++;MPX.stats.txB+=JSON.stringify(v).length+60;return D.update(mpR(mpL('p/'+MPX.uid)),v).catch(mpErr);}
// ---------- per-frame ----------
function mpFrame(dt){if(MPX.warnT>0)MPX.warnT-=dt;if(MPX.fb&&S.cloud&&S.cloud.on){MPX.cloudT-=dt;if(MPX.cloudT<=0){MPX.cloudT=180;mpCloudUp().catch(()=>{});}}
 if(!MPX.on){return;}
 mpInterp(dt);if(MPX.myEmo){MPX.myEmo.t-=dt;if(MPX.myEmo.t<=0)MPX.myEmo=null;}if(MPX.spec){MPX.spec.t-=dt;if(MPX.spec.t<=0)MPX.spec=null;}
 if(!MPX.conn||MPX.rejoining)return mpUI(dt);
 const fl=mpFlags();if(fl!==MPX.lfl){MPX.lfl=fl;MPX.force=true;}
 const mv=Math.abs(P.speed||0)>6||Math.abs(angDiff(MPX.lh,P.h))>0.015;MPX.lh=P.h;const close=mpNearN(MP_NEAR)>0,near=close||mpNearN()>0;const iv=close?(mv?0.25:1):near?(mv?1:2):(mv?1.5:3);
 MPX.sendT-=dt;const now=performance.now();if((MPX.sendT<=0||MPX.force)&&now-MPX.lastSendT>=120){mpSend();MPX.sendT=iv;MPX.force=false;MPX.lastSendT=now;}
 MPX.hitT-=dt;if(MPX.hitT<=0){MPX.hitT=0.25;mpFlushHits();}
 MPX.hbT-=dt;if(MPX.hbT<=0){MPX.hbT=10;mpUpdP();}
 MPX.hostT-=dt;if(MPX.hostT<=0){MPX.hostT=15;mpHostChores();}
 if(MPX.crew&&MPX.cw[MPX.crew]&&MPX.cw[MPX.crew].f){const f=cosItem('flag',MPX.cw[MPX.crew].f);P.flagC=f[3];P.flagS=f[4];}
 mpUI(dt);}
function mpHostId(){let best=MPX.uid,bj=MPX.j||Infinity;for(const id in MPX.rem){const r=MPX.rem[id];if(r.stale||!r.j)continue;if(r.j<bj||(r.j===bj&&id<best)){bj=r.j;best=id;}}return best;}
async function mpHostChores(){const now=mpNow();for(const id in MPX.rem){const r=MPX.rem[id];r.stale=now-(r.hb||0)>MP_STALE;}
 MPX.host=mpHostId()===MPX.uid;if(!MPX.host)return;const {D,db}=MPX.fb;
 try{const s=(await D.get(mpR(mpL('s')))).val()||{};const up={},cells={};
  for(const k in s){const u=s[k];if(!u||u===MPX.uid)continue;const r=MPX.rem[u];if(!r||now-(r.hb||0)>95000){up[mpL('s/'+k)]=null;up[mpL('u/'+u)]=null;up[mpL('p/'+u)]=null;if(r&&r.cell)cells[mpL(`c/${r.cell}/${u}`)]=null;}}
  if(Object.keys(up).length){await D.update(D.ref(db),up);if(Object.keys(cells).length)await D.update(D.ref(db),cells).catch(()=>{});}
  const old={};for(const m of MPX.chat)if(m.t&&now-m.t>610000&&m.k)old[mpL('ch/'+m.k)]=null;if(Object.keys(old).length)D.update(D.ref(db),old).catch(()=>{});
 }catch(e){}}
// ---------- lobby join / create / list / leave ----------
async function mpClaim(lid,meta,idx){const {D,db}=MPX.fb;const me=MPX.uid;
 const [ms,ss]=await Promise.all([D.get(mpR(mpL('m',lid))),D.get(mpR(mpL('s',lid)))]);if(!meta&&!ms.exists())throw new Error('NOLOBBY');
 const s=ss.val()||{};for(const k in s)if(s[k]===me)return{slot:+k,m:ms.val()||meta};
 const prof=Object.assign(mpProfile(),{j:mpTS(),hb:mpTS()});
 for(let i=0;i<MCAP;i++){if(s[i])continue;const up={};up[mpL('s/'+i,lid)]=me;up[mpL('u/'+me,lid)]=String(i);up[mpL('p/'+me,lid)]=prof;
  if(meta&&!ms.exists()){up[mpL('m',lid)]=meta;if(idx)up['idx/'+lid]=idx;}
  try{await D.update(D.ref(db),up);return{slot:i,m:ms.val()||meta};}catch(e){if(!/permission/i.test(String(e&&e.message)))throw e;}}
 throw new Error('FULL');}
async function mpRegDisc(){const {D}=MPX.fb;const me=MPX.uid;await Promise.all([D.onDisconnect(mpR(mpL('s/'+MPX.slot))).remove(),D.onDisconnect(mpR(mpL('u/'+me))).remove(),D.onDisconnect(mpR(mpL('p/'+me))).remove()]);}
async function mpJoin(lid,meta,idx){await fbLoad();if(MPX.on)await mpLeave(true);const nm=mpNameOk(MPX.name);if(nm)throw new Error(nm);
 MPX.busy=true;try{const {D}=MPX.fb;const c=await mpClaim(lid,meta,idx);
  Object.assign(MPX,{on:true,lid,slot:c.slot,lobName:mpClean((c.m&&c.m.n)||'Open Sea'),pub:!!(c.m&&c.m.pub),code:lid[0]==='P'?lid.slice(1):'',rem:{},cell:'',chat:[],seenC:{},seenK:{},inv:[],cw:{},unread:0,hits:{},inRate:{},killer:null,lastHit:null,spec:null,flag:'',hbT:10,hostT:4,sendT:0,force:true,stats:{tx:0,rx:0,txB:0,rxB:0,t0:performance.now()}});
  MPX.joinT=mpNow();await mpRegDisc();
  const sub=(f)=>MPX.subs.push(f);const q=p=>mpR(mpL(p));
  sub(D.onChildAdded(q('p'),s=>{MPX.stats.rx++;MPX.stats.rxB+=180;mpApplyP(s.key,s.val());}));sub(D.onChildChanged(q('p'),s=>{MPX.stats.rx++;MPX.stats.rxB+=180;mpApplyP(s.key,s.val());}));
  sub(D.onChildRemoved(q('p'),s=>{const r=MPX.rem[s.key];if(r){mpFeed(`🌫️ ${mpEsc(r.n)} left the lobby`);delete MPX.rem[s.key];}}));
  sub(D.onChildAdded(D.query(q('ch'),D.limitToLast(30)),s=>{MPX.stats.rx++;MPX.stats.rxB+=150;mpChat(s);}));
  sub(D.onChildAdded(D.query(q('k'),D.limitToLast(10)),s=>{MPX.stats.rx++;MPX.stats.rxB+=160;mpKill(s);}));
  sub(D.onChildAdded(q('ev/'+MPX.uid),mpEv));
  sub(D.onChildAdded(q('inv/'+MPX.uid),s=>{const v=s.val();if(!v)return;MPX.inv.push(Object.assign({from:s.key},v));mpInvShow();}));
  sub(D.onValue(q('cw'),s=>{MPX.cw=s.val()||{};for(const id in MPX.rem){const r=MPX.rem[id];if(r.c!=null){const cw=r.cr&&MPX.cw[r.cr];mpCos(r,r.c,cw&&cw.f);}}}));
  S.mpLast={lid,t:Date.now()};S.mpName=MPX.name;save();
  mpFeed(`🌐 Joined <b>${mpEsc(MPX.lobName)}</b>${MPX.code?` — code <b>${MPX.code}</b>`:''}. PvP is live outside haven waters.`);
  $('mpPill').classList.remove('hidden');setTimeout(()=>showTip('mp'),1800);return lid;}
 finally{MPX.busy=false;}}
async function mpList(){await fbLoad();const {D,db}=MPX.fb;const sn=await D.get(D.query(mpR('idx'),D.orderByChild('t'),D.limitToLast(40)));const ids=[];sn.forEach(c=>{ids.push([c.key,c.val()]);});const now=mpNow();const out=[];
 await Promise.all(ids.map(async([lid,v])=>{let n=0;try{const s=(await D.get(mpR(mpL('s',lid)))).val();if(s)for(const k in s)if(s[k])n++;}catch(e){return;}
  if(n===0){if(now-(v.t||0)>120000)D.update(D.ref(db),{[mpL('',lid)]:null,['idx/'+lid]:null}).catch(()=>{});return;}
  out.push({lid,n,name:mpClean(v.n||'Open Sea'),r:v.r||'',t:v.t||0});}));
 return out.sort((a,b)=>b.n-a.n||b.t-a.t);}
const MLNAMES=['Tortuga Waters','Blackwater Run','Skull Cove','Devil\'s Reach','Kraken Deep','Gallows Bay','Rum Runners','Iron Tide','Ghost Shoals','Port Royal Roads'];
async function mpCreate(pub,name){await fbLoad();name=mpClean(String(name||'').trim()).slice(0,24)||(MLNAMES[(Math.random()*MLNAMES.length)|0]+' '+(10+((Math.random()*89)|0)));const r=mpRegion();
 const lid=pub?'L'+mpGen(8):'P'+mpGen(6);const meta={n:name,r,pub:!!pub,t:mpTS()};return mpJoin(lid,meta,pub?{n:name,r,t:mpTS()}:null);}
async function mpQuick(){const L=await mpList();for(const l of L){if(l.n>=MCAP)continue;try{return await mpJoin(l.lid);}catch(e){if(!/FULL|NOLOBBY/.test(e.message))throw e;}}return mpCreate(true);}
async function mpJoinCode(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6)throw new Error('Codes are 6 characters.');return mpJoin('P'+code);}
async function mpLeave(silent){if(!MPX.on)return;const {D,db}=MPX.fb;const me=MPX.uid,lid=MPX.lid;MPX.subs.forEach(f=>f());MPX.subs=[];for(const k in MPX.un)MPX.un[k].forEach(f=>f());MPX.un={};MPX.cells.clear();MPX.on=false;
 const up={};up[mpL('s/'+MPX.slot,lid)]=null;up[mpL('u/'+me,lid)]=null;up[mpL('p/'+me,lid)]=null;if(MPX.cell)up[mpL(`c/${MPX.cell}/${me}`,lid)]=null;if(MPX.crew===me)up[mpL('cw/'+me,lid)]=null;
 const paths=[mpL('s/'+MPX.slot,lid),mpL('u/'+me,lid),mpL('p/'+me,lid)].concat(MPX.cell?[mpL(`c/${MPX.cell}/${me}`,lid)]:[]);
 try{await D.update(D.ref(db),up);paths.forEach(p=>D.onDisconnect(mpR(p)).cancel().catch(()=>{}));}catch(e){}
 try{const s=await D.get(mpR(mpL('s',lid)));if(!s.exists())await D.update(D.ref(db),{[mpL('',lid)]:null,['idx/'+lid]:null});}catch(e){}
 MPX.rem={};MPX.cell='';MPX.crew='';MPX.crewName='';MPX.flag='';MPX.chatOpen=false;for(let i=balls.length-1;i>=0;i--)if(balls[i].owner==='x')balls.splice(i,1);applyCos();
 ['mpPill','mpChat','mpPanel','mpCard','mpInvP','mpKCB'].forEach(i=>$(i).classList.add('hidden'));$('mpFeed').innerHTML='';
 if(S.cloud&&S.cloud.on)mpCloudUp().catch(()=>{});if(!silent)toast('🌐 Left the online sea — your voyage continues offline.');}
function mpConn(c){const was=MPX.conn;MPX.conn=c;if(!MPX.on)return;if(c&&!was)mpRejoin();else if(!c)mpFeed('📡 Connection lost — reconnecting…');}
async function mpRejoin(){if(MPX.rejoining)return;MPX.rejoining=true;try{const {D}=MPX.fb;const s=(await D.get(mpR(mpL('s/'+MPX.slot)))).val();if(s!==MPX.uid){const c=await mpClaim(MPX.lid,null,null);MPX.slot=c.slot;}await mpRegDisc();await mpUpdP();MPX.cell='';MPX.force=true;mpFeed('📡 Reconnected.');}
 catch(e){mpFeed('⚠️ Could not get back into the lobby ('+mpEsc(e.message)+').');mpLeave(true);}finally{MPX.rejoining=false;}}
// ---------- chat, emotes, flag signals ----------
const MEMO={wave:['👋','waves'],laugh:['😂','laughs'],angry:['😡','is furious'],salute:['🫡','salutes'],rum:['🍾','raises a rum'],skull:['☠️','vows revenge'],
 fw:['🏳️','raises the white flag — surrenders'],fr:['🚩','raises the red flag — no quarter!'],ft:['🤝','signals: trade?'],fx:['🏴','lowers their signal flag'],sys:['⚓','']};
function mpSay(txt,e){if(!MPX.on)return false;const now=performance.now();if(now-MPX.lastSay<1300){toast('⏳ Easy — one message every 1.5 s.');return false;}
 const m=mpClean(String(txt||'').trim()).slice(0,120);if(!m&&!e)return false;MPX.lastSay=now;const {D,db}=MPX.fb;const k=D.push(mpR(mpL('ch'))).key;
 const v={u:MPX.uid,n:MPX.name,m,t:mpTS()};if(e)v.e=e;MPX.stats.tx++;MPX.stats.txB+=JSON.stringify(v).length+80;
 D.update(D.ref(db),{[mpL('ch/'+k)]:v,[mpL('rl/'+MPX.uid)]:mpTS()}).catch(()=>toast('⏳ Message not sent — slow down a little.'));return true;}
function mpEmote(k){if(!MEMO[k])return;if(mpSay('',k))MPX.myEmo={s:MEMO[k][0],t:3};}
function mpSetFlag(f){if(!MPX.on)return;MPX.flag=MPX.flag===f?'':f;MPX.force=true;mpSay('',MPX.flag?'f'+MPX.flag:'fx');mpChatRender();}
function mpChat(snap){if(MPX.seenC[snap.key])return;MPX.seenC[snap.key]=1;const v=snap.val();if(!v)return;
 const m={k:snap.key,u:String(v.u||''),n:mpClean(v.n||'?').slice(0,16),m:mpClean(v.m||'').slice(0,120),e:MEMO[v.e]?v.e:'',t:v.t||0};MPX.chat.push(m);if(MPX.chat.length>60)MPX.chat.shift();
 const fresh=m.t>=MPX.joinT-3000;if(m.e&&fresh&&m.e!=='sys'){const r=MPX.rem[m.u];if(r)r.emo={s:MEMO[m.e][0],t:3};}
 if(fresh&&m.u!==MPX.uid){if(!MPX.chatOpen)MPX.unread++;mpFeed(mpChatLine(m));}if(MPX.chatOpen)mpChatRender();}
function mpChatLine(m){const r=MPX.rem[m.u];const crew=m.u===MPX.uid||(MPX.crew&&r&&r.cr===MPX.crew);const nm=`<b style="color:${m.u===MPX.uid?'#ffd34d':crew?'#8dffa0':'#ffcf8a'}">${mpEsc(m.n)}</b>`;
 if(m.e)return `${MEMO[m.e][0]} ${nm} <i>${mpEsc(m.e==='sys'?m.m:MEMO[m.e][1])}</i>`;return `${nm}: ${mpEsc(m.m)}`;}
// ---------- crews (max 4) ----------
function mpCrewN(cid){if(!cid)return 0;let n=MPX.crew===cid?1:0;for(const id in MPX.rem){const r=MPX.rem[id];if(r.cr===cid&&!r.stale)n++;}return n;}
async function mpInvite(uid){const r=MPX.rem[uid];if(!r||!MPX.on)return;if(MPX.crew&&r.cr===MPX.crew){toast('Already in your crew.');return;}const {D}=MPX.fb;
 if(!MPX.crew){MPX.crew=MPX.uid;MPX.crewName=(MPX.name+"'s Crew").slice(0,20);await D.set(mpR(mpL('cw/'+MPX.uid)),{n:MPX.crewName,f:String(S.cos.flag||'def').slice(0,12)}).catch(mpErr);await mpUpdP();}
 if(mpCrewN(MPX.crew)>=4){toast('⚓ Crew is full — 4 captains max.');return;}
 await D.set(mpR(mpL(`inv/${uid}/${MPX.uid}`)),{c:MPX.crew,n:MPX.name,cn:MPX.crewName,t:mpTS()}).catch(mpErr);toast(`📨 Crew invite sent to ${r.n}.`);}
async function mpInvAnswer(yes){const iv=MPX.inv.shift();if(!iv)return;const {D}=MPX.fb;D.remove(mpR(mpL(`inv/${MPX.uid}/${iv.from}`))).catch(()=>{});
 if(yes){if(mpCrewN(iv.c)>=4)toast('That crew is already full.');else{MPX.crew=String(iv.c);MPX.crewName=mpClean(iv.cn||'Crew').slice(0,20);await mpUpdP();mpSay(`joined the crew ${MPX.crewName}`,'sys');toast(`🤝 You joined ${MPX.crewName}! No friendly fire, shared bounties.`);}}
 mpInvShow();}
function mpCrewLeave(){if(!MPX.crew)return;const was=MPX.crewName;if(MPX.crew===MPX.uid)MPX.fb.D.remove(mpR(mpL('cw/'+MPX.uid))).catch(()=>{});MPX.crew='';MPX.crewName='';applyCos();mpUpdP();mpSay(`left the crew ${was}`,'sys');}
// ---------- cloud save (opt-in; recovery code = bearer key) ----------
async function mpCloudUp(){await fbLoad();if(!S.cloud||!S.cloud.k)return;await MPX.fb.D.set(mpR('rc/'+S.cloud.k),{d:makeCode(),t:mpTS()});S.cloud.t=Date.now();save();}
async function mpCloudOn(){if(!S.cloud||!S.cloud.k)S.cloud={k:mpGen(24),on:1,t:0};S.cloud.on=1;save();await mpCloudUp();return S.cloud.k;}
function mpCloudOff(){if(S.cloud){S.cloud.on=0;save();}}
async function mpCloudGet(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<20)throw new Error('Recovery codes are 24 characters.');await fbLoad();
 const s=await MPX.fb.D.get(mpR('rc/'+code));if(!s.exists())throw new Error('No cloud save found for that code.');return parseCode(s.val().d);}
const mpFmtCode=k=>String(k||'').replace(/(.{4})(?=.)/g,'$1-');
// ---------- drawing ----------
function mpDraw(ts){if(!MPX.on)return;const x0=cam.x-vw/2/zoom-160,x1=cam.x+vw/2/zoom+160,y0=cam.y-vh/2/zoom-160,y1=cam.y+vh/2/zoom+160;const z=1/zoom;
 for(const id in MPX.rem){const r=MPX.rem[id];if(!r.vis||r.stale||r.sinking>2.4)continue;if(r.x<x0||r.x>x1||r.y<y0||r.y>y1)continue;
  if(r.fl.includes('b')){ctx.strokeStyle='rgba(255,210,90,.55)';ctx.lineWidth=3*z;ctx.setLineDash([8*z,6*z]);ctx.beginPath();ctx.arc(r.x,r.y,r.len*0.75,0,TAU);ctx.stroke();ctx.setLineDash([]);}
  drawShip(r,r.sailC,'#111',r.thr);if(r.sinking)continue;
  const crew=MPX.crew&&r.cr===MPX.crew;const yy=r.y-r.len*0.62-10*z;ctx.textAlign='center';ctx.textBaseline='alphabetic';
  const w=56*z,hh=5*z;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(r.x-w/2,yy+3*z,w,hh);ctx.fillStyle=r.hpP>50?'#5be36a':r.hpP>25?'#ffd34d':'#ff6b5b';ctx.fillRect(r.x-w/2,yy+3*z,w*r.hpP/100,hh);
  ctx.font=`bold ${Math.round(12*z)}px Georgia,serif`;ctx.lineWidth=3*z;ctx.strokeStyle='rgba(0,0,0,.85)';const lab=`${r.n} · Lv${r.l}`;ctx.strokeText(lab,r.x,yy);ctx.fillStyle=crew?'#8dffa0':'#ffe2a8';ctx.fillText(lab,r.x,yy);
  let top=yy-14*z;const ic=(r.fl.includes('w')?'🏳️':'')+(r.fl.includes('r')?'🚩':'')+(r.fl.includes('t')?'🤝':'')+(/[nz]/.test(r.fl)?'🛡️':'')+((r.b|0)>=500?'☠️':'');
  if(r.cn){ctx.font=`italic ${Math.round(10*z)}px Georgia,serif`;ctx.strokeText(`⚓ ${r.cn}`,r.x,top);ctx.fillStyle=crew?'#8dffa0':'#d8c9a8';ctx.fillText(`⚓ ${r.cn}`,r.x,top);top-=13*z;}
  if(ic){ctx.font=`${Math.round(13*z)}px serif`;ctx.fillText(ic,r.x,top);top-=16*z;}
  if(r.emo)mpBubble(r.x,top-4*z,r.emo.s,z);}
 if(MPX.myEmo&&!P.dead)mpBubble(P.x,P.y-P.len*0.62-18*z,MPX.myEmo.s,z);
 if(MPX.flag&&!P.dead){ctx.font=`${Math.round(14*z)}px serif`;ctx.textAlign='center';ctx.fillText(MPX.flag==='w'?'🏳️':MPX.flag==='r'?'🚩':'🤝',P.x,P.y-P.len*0.62-4*z);}}
function mpBubble(x,y,s,z){ctx.fillStyle='rgba(245,232,200,.95)';ctx.strokeStyle='#5a3a12';ctx.lineWidth=2*z;ctx.beginPath();ctx.arc(x,y-12*z,15*z,0,TAU);ctx.fill();ctx.stroke();ctx.font=`${Math.round(17*z)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s,x,y-12*z);ctx.textBaseline='alphabetic';}
function mpMap(mx,my,big){if(!MPX.on)return;for(const id in MPX.rem){const r=MPX.rem[id];if(r.stale)continue;const p=r.vis?[r.x,r.y]:r.xy;if(!p)continue;const crew=MPX.crew&&r.cr===MPX.crew;const X=mx(p[0]),Y=my(p[1]);
  ctx.fillStyle=crew?'#5bff7a':'#ff9a3c';ctx.strokeStyle='#000';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(X,Y,big?5:3.2,0,TAU);ctx.fill();ctx.stroke();
  if((r.b|0)>=500){ctx.font=(big?16:10)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('☠️',X,Y-(big?12:8));}
  if(big){ctx.font='bold 11px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=crew?'#bfffcc':'#ffe2a8';ctx.fillText(r.n,X,Y+6);}}}
// ---------- UI ----------
(function(){const st=document.createElement('style');st.textContent=`
#mpBtn{flex:1 1 100%;background:linear-gradient(#3a2a1a,#1f160d)!important;color:#ffd98a!important;border:2px solid #b08a4a!important}
#mpPill{position:fixed;left:calc(8px + env(safe-area-inset-left));top:120px;z-index:7;display:flex;align-items:stretch;gap:4px;max-width:min(260px,64vw);font-family:Georgia,'Times New Roman',serif}
#mpPill .mpInfo{flex:1;min-width:0;background:linear-gradient(#2a2017,#17110b);border:1.5px solid rgba(178,142,82,.85);border-radius:10px;padding:4px 8px;color:#f3e2b0;font-size:12px;line-height:1.3;box-shadow:0 3px 8px rgba(0,0,0,.55);text-align:left;cursor:pointer}
#mpPill .mpInfo div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mpPill button{min-width:44px;border-radius:10px;border:1.5px solid rgba(178,142,82,.85);background:linear-gradient(#3a2a1a,#1f160d);color:#ffd98a;font-size:19px;position:relative;touch-action:manipulation}
#mpPill button b{position:absolute;top:-6px;right:-6px;background:#b8281a;color:#fff;border-radius:9px;font:700 11px sans-serif;padding:1px 5px}
#mpFeed{position:fixed;left:calc(8px + env(safe-area-inset-left));top:170px;z-index:6;max-width:min(300px,70vw);pointer-events:none;font:12px Georgia,serif;color:#f3e2b0;text-shadow:0 1px 2px #000,0 0 3px #000}
#mpFeed div{background:rgba(15,10,6,.62);border-left:3px solid #b08a4a;border-radius:4px;padding:2px 6px;margin-bottom:3px;transition:opacity .6s}
#mpChat{position:fixed;left:0;right:0;bottom:0;z-index:14;max-height:min(58vh,460px);display:flex;flex-direction:column;background:linear-gradient(#2a2017,#120d08);border-top:2px solid #b08a4a;color:#f3e2b0;font-family:Georgia,serif;padding:8px 10px calc(8px + env(safe-area-inset-bottom));box-shadow:0 -6px 18px rgba(0,0,0,.6)}
#mpChat .mpHd{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:4px}
#mpChat .mpLog{flex:1;overflow-y:auto;min-height:90px;font-size:13.5px;line-height:1.4;padding:2px 2px 6px}
#mpChat .mpRow{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
#mpChat input{flex:1;min-width:0;font-size:16px;padding:9px;border-radius:9px;border:1.5px solid #b08a4a;background:#f4e4c1;color:#3b2306}
.mpB{min-height:42px;padding:6px 10px;border-radius:9px;border:1.5px solid #b08a4a;background:linear-gradient(#4a3520,#2a1d10);color:#ffe2a8;font:700 14px Georgia,serif;touch-action:manipulation}
.mpB.on{background:linear-gradient(#8a5a1a,#5a3a10);color:#fff}.mpB:disabled{opacity:.45}
.mpE{min-width:44px;font-size:20px;padding:4px 6px}
#mpL .panel,#mpPanel .panel,#mpCard .panel{text-align:left}
.mpSec{background:rgba(122,78,29,.1);border:1px solid rgba(122,78,29,.3);border-radius:10px;padding:8px;margin:8px 0}
.mpSec h3{margin:0 0 6px;font-size:15px}
.mpIn{font-size:16px;padding:8px;border-radius:8px;border:1.5px solid #7a4e1d;background:#fff8e7;color:#3b2306;min-width:0;width:100%;box-sizing:border-box}
.mpBig{width:100%;min-height:48px;margin:4px 0;border-radius:10px;border:none;font:700 16px Georgia,serif;color:#fff;background:#7a4e1d;touch-action:manipulation}
.mpBig.g{background:#2f7d3b}.mpBig.d{background:#3b2a1a}.mpBig:disabled{opacity:.5}
.mpLob{display:flex;align-items:center;gap:8px;width:100%;min-height:46px;margin:3px 0;padding:6px 10px;border-radius:9px;border:1.5px solid #7a4e1d;background:#fff3d6;color:#3b2306;font:14px Georgia,serif;text-align:left}
.mpLob span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mpLob b{font-size:15px}
.mpSt{font-size:13px;min-height:18px;margin:4px 0;color:#5a3a12}.mpSt.err{color:#b8281a;font-weight:700}
.mpPl{display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(122,78,29,.25);cursor:pointer}
.mpPl i{width:14px;height:14px;border-radius:3px;border:1px solid #000;display:inline-block}
#mpInvP{position:fixed;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top));z-index:12;background:linear-gradient(#2a2017,#17110b);border:2px solid #b08a4a;border-radius:12px;color:#f3e2b0;padding:8px 10px;font:14px Georgia,serif;width:min(340px,92vw);box-shadow:0 6px 16px rgba(0,0,0,.6);text-align:center}
#mpKCB{position:fixed;left:50%;transform:translateX(-50%);top:calc(40% - 30px);z-index:8;background:rgba(40,8,6,.82);border:2px solid #a33;border-radius:12px;color:#ffd9c9;padding:8px 14px;font:700 16px Georgia,serif;pointer-events:none;text-align:center}
.mpCode{font:700 22px ui-monospace,Menlo,monospace;letter-spacing:2px;background:#fff8e7;border:1.5px dashed #7a4e1d;border-radius:8px;padding:6px;text-align:center;user-select:all;-webkit-user-select:all;word-break:break-all}
`;document.head.appendChild(st);
 const tf=document.querySelector('#title .tfoot');if(tf){const b=document.createElement('button');b.id='mpBtn';b.className=($('xferTitleBtn')&&$('xferTitleBtn').className)||'';b.textContent='🌐 Play Online';tf.insertBefore(b,$('tutBtn'));}
 const H=(id,cls,html)=>{const d=document.createElement('div');d.id=id;if(cls)d.className=cls;d.innerHTML=html||'';document.body.appendChild(d);return d;};
 H('mpPill','hidden','<div class="mpInfo" id="mpInfo"></div><button id="mpChatBtn" aria-label="Lobby chat">💬<b id="mpUn" class="hidden">0</b></button>');
 H('mpFeed','');
 H('mpChat','hidden',`<div class="mpHd"><span>💬 Lobby chat</span><button class="mpB" id="mpChatX">✕</button></div><div class="mpLog" id="mpLog"></div>
  <div class="mpRow">${['wave','laugh','angry','salute','rum','skull'].map(k=>`<button class="mpB mpE" data-emo="${k}">${MEMO[k][0]}</button>`).join('')}</div>
  <div class="mpRow"><button class="mpB" data-flag="w">🏳️ Surrender</button><button class="mpB" data-flag="r">🚩 No quarter</button><button class="mpB" data-flag="t">🤝 Trade?</button></div>
  <div class="mpRow"><input id="mpMsg" maxlength="120" placeholder="Say something, Captain…" autocomplete="off"><button class="mpB" id="mpSend">Send</button></div>`);
 H('mpL','overlay hidden','<div class="panel"><div class="phead"><h2>🌐 Play Online</h2><button class="mpB" id="mpLX">✕</button></div><div class="scroll" id="mpLBody" style="padding:0 12px 12px;overflow-y:auto"></div></div>');
 H('mpPanel','overlay hidden','<div class="panel"><div class="phead"><h2 id="mpPT">Lobby</h2><button class="mpB" id="mpPX">✕</button></div><div class="scroll" id="mpPBody" style="padding:0 12px 12px;overflow-y:auto"></div></div>');
 H('mpCard','overlay hidden','<div class="panel" style="width:min(380px,100%)"><div class="phead"><h2 id="mpCT">Captain</h2><button class="mpB" id="mpCX">✕</button></div><div id="mpCBody" style="padding:0 12px 12px"></div></div>');
 H('mpInvP','hidden','');H('mpKCB','hidden','');
})();
function mpFeed(html){const f=$('mpFeed');if(!f)return;const d=document.createElement('div');d.innerHTML=html;f.appendChild(d);while(f.children.length>4)f.removeChild(f.firstChild);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),700);},7000);}
function mpUI(dt){MPX.uiT-=dt;if(MPX.uiT>0)return;MPX.uiT=0.25;const pill=$('mpPill');const show=MPX.on&&(state==='play'||state==='menu'||state==='dead');pill.classList.toggle('hidden',!show);
 const hb=Math.round(($('hud').getBoundingClientRect().bottom)||110);pill.style.top=(hb+6)+'px';$('mpFeed').style.top=(hb+56)+'px';
 let n=1;for(const id in MPX.rem)if(!MPX.rem[id].stale)n++;const pc=!MPX.conn?'#ff6b5b':MPX.ping<150?'#7dff8a':MPX.ping<350?'#ffd34d':'#ff8a5b';
 const zone=mpSafeAt(P.x,P.y)?'⚓ Haven waters — no PvP':mpNewb()?'🛡️ New-captain protection':'⚔️ PvP waters';
 const h=`<div>🌐 <b>${mpEsc(MPX.lobName)}</b> ${n}/${MCAP}${MPX.host?' 👑':''} · <span style="color:${pc}">📶 ${MPX.conn?MPX.ping+'ms':'offline'}</span></div><div style="opacity:.92">${zone}${MPX.crew?` · ⚓ ${mpEsc(MPX.crewName)}`:''}</div>`;
 const inf=$('mpInfo');if(inf._h!==h){inf._h=h;inf.innerHTML=h;}
 const un=$('mpUn');un.textContent=MPX.unread>9?'9+':MPX.unread;un.classList.toggle('hidden',!MPX.unread||MPX.chatOpen);
 const kb=$('mpKCB');const kc=P.dead&&MPX.killer&&MPX.rem[MPX.killer.a];const sp=!P.dead&&MPX.spec&&MPX.rem[MPX.spec.uid];
 kb.classList.toggle('hidden',!(kc||sp));if(kc)kb.innerHTML=`☠️ Sunk by ${mpEsc(kc.n)}<br><small>kill cam</small>`;else if(sp)kb.innerHTML=`👁️ Watching ${mpEsc(sp.n)}`;
 if(!$('mpPanel').classList.contains('hidden'))mpPanelRender();}
function mpChatRender(){if(!MPX.chatOpen)return;const lg=$('mpLog');lg.innerHTML=MPX.chat.slice(-40).map(m=>`<div>${mpChatLine(m)}</div>`).join('')||'<div style="opacity:.7">No messages yet. Say ahoy!</div>';lg.scrollTop=lg.scrollHeight;
 document.querySelectorAll('#mpChat [data-flag]').forEach(b=>b.classList.toggle('on',b.dataset.flag===MPX.flag));}
function mpChatOpen(o){MPX.chatOpen=o;$('mpChat').classList.toggle('hidden',!o);if(o){MPX.unread=0;mpChatRender();}else if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}
function mpInvShow(){const p=$('mpInvP');const iv=MPX.inv[0];if(!iv||!MPX.on){p.classList.add('hidden');return;}p.innerHTML=`⚓ <b>${mpEsc(mpClean(iv.n))}</b> invites you to join <b>${mpEsc(mpClean(iv.cn||'their crew'))}</b><div class="mpRow" style="display:flex;gap:8px;justify-content:center;margin-top:6px"><button class="mpB" id="mpInvY">Join crew</button><button class="mpB" id="mpInvN">Decline</button></div>`;p.classList.remove('hidden');
 $('mpInvY').onclick=()=>mpInvAnswer(true);$('mpInvN').onclick=()=>mpInvAnswer(false);}
function mpSw(r){return `<i style="background:${r.flagC||'#111'}"></i>`;}
function mpPanelRender(){const b=$('mpPBody');let h='';$('mpPT').textContent='🌐 '+MPX.lobName;
 h+=`<div class="mpSt">${MPX.pub?'Public lobby':'🔒 Private lobby'} · ${MPX.host?'👑 you are the lobby host':'host: '+mpEsc((MPX.rem[mpHostId()]||{n:'you'}).n)} · 📶 ${MPX.ping}ms</div>`;
 if(MPX.code)h+=`<div class="mpSec"><h3>🔑 Join code</h3><div class="mpCode">${MPX.code}</div><div class="mpSt">Share it — friends enter it under Play Online → Join with code.</div></div>`;
 const list=[{uid:MPX.uid,n:MPX.name,l:S.clvl,cr:MPX.crew,cn:MPX.crewName,b:S.mpB|0,flagC:P.flagC,me:1}].concat(Object.values(MPX.rem).filter(r=>!r.stale));
 h+=`<div class="mpSec"><h3>Captains (${list.length}/${MCAP})</h3>${list.map(r=>{const crew=MPX.crew&&r.cr===MPX.crew;const d=r.me?'':(()=>{const p=mpPosOf(r.uid);return p?` · ${Math.round(Math.hypot(p[0]-P.x,p[1]-P.y)/100)/10}k`:'';})();
  return `<div class="mpPl" data-uid="${r.me?'':mpEsc(r.uid)}">${mpSw(r)}<span style="flex:1"><b style="color:${r.me?'#8a5a00':crew?'#2f7d3b':'#3b2306'}">${mpEsc(r.n)}</b> Lv${r.l|0}${r.cn?` <small>⚓ ${mpEsc(r.cn)}</small>`:''}${(r.b|0)>=500?' ☠️':''}</span><small>${r.me?'you':(r.b|0)+'💰'+d}</small></div>`;}).join('')}</div>`;
 h+=`<div class="mpSec"><h3>⚓ Crew</h3>${MPX.crew?`<b>${mpEsc(MPX.crewName)}</b> — ${mpCrewN(MPX.crew)}/4 captains. No friendly fire; bounties are shared with crewmates nearby.<br><button class="mpB" id="mpCrewL" style="margin-top:6px">Leave crew</button>`:'Tap a captain to invite them. Crews: up to 4, no friendly fire, shared bounty.'}</div>`;
 h+=`<button class="mpBig d" id="mpLeaveB">⛵ Leave online sea</button>`;
 if(b._h!==h){b._h=h;b.innerHTML=h;}}
function mpPanelOpen(){mpPanelRender();$('mpPanel').classList.remove('hidden');}
function mpCardOpen(uid){const r=MPX.rem[uid];if(!r)return;const H=HULLS[r.hull]||HULLS.sloop;const p=mpPosOf(uid);const d=p?Math.round(Math.hypot(p[0]-P.x,p[1]-P.y)):0;const crew=MPX.crew&&r.cr===MPX.crew;
 const st=/[z]/.test(r.fl)?'⚓ In haven waters (safe)':/n/.test(r.fl)?'🛡️ New-captain protection':/p/.test(r.fl)?'⚓ Docked':r.deadF?'☠️ Sinking':'⚔️ Fair game';
 $('mpCT').innerHTML=`${mpSw(r)} ${mpEsc(r.n)}`;
 $('mpCBody').innerHTML=`<div class="mpSec">🎖️ Level <b>${r.l}</b> · ${H.icon} ${H.name} · ${r.g} guns/side<br>${r.cn?`⚓ Crew <b>${mpEsc(r.cn)}</b>${crew?' (yours)':''}<br>`:''}💰 Bounty <b>${r.b|0}</b> · ☠️ Captains sunk <b>${r.k|0}</b><br>${st} · ${(d/1000).toFixed(1)}k away${r.fl.includes('w')?'<br>🏳️ Flying the white flag':r.fl.includes('r')?'<br>🚩 No quarter!':r.fl.includes('t')?'<br>🤝 Wants to trade':''}</div>
  <div class="mpRow" style="display:flex;gap:6px;flex-wrap:wrap">${crew?'':`<button class="mpB" id="mpCInv" ${mpCrewN(MPX.crew||'x')>=4?'disabled':''}>⚓ Invite to crew</button>`}<button class="mpB" id="mpCWatch">👁️ Watch 5s</button><button class="mpB" id="mpCWave">👋 Wave</button></div>`;
 $('mpCard').classList.remove('hidden');if($('mpCInv'))$('mpCInv').onclick=()=>{mpInvite(uid);$('mpCard').classList.add('hidden');};
 $('mpCWatch').onclick=()=>{MPX.spec={uid,t:5};$('mpCard').classList.add('hidden');};$('mpCWave').onclick=()=>{mpEmote('wave');$('mpCard').classList.add('hidden');};}
// lobby browser
function mpLSt(t,err){const e=$('mpLSt');if(e){e.textContent=t;e.classList.toggle('err',!!err);}}
function mpLRender(list){const b=$('mpLBody');const last=S.mpLast&&Date.now()-S.mpLast.t<15*60000?S.mpLast.lid:'';const cl=S.cloud&&S.cloud.on;
 b.innerHTML=`<div class="mpSt" id="mpLSt">${MPX.uid?'⚓ Signed in (anonymous captain)':'Connecting to the online sea…'}</div>
 <div class="mpSec"><h3>🏴‍☠️ Captain name</h3><input class="mpIn" id="mpName" maxlength="16" value="${mpEsc(S.mpName||MPX.name||'')}" placeholder="Your pirate name"><div class="mpSt" style="font-size:12px">Lv${S.clvl} · ${HULLS[S.ship].icon} ${HULLS[S.ship].name} — you sail your own ship and save. Stats are evened out in PvP.</div></div>
 <button class="mpBig g" id="mpQuick">⚡ Quick Join</button>${last?`<button class="mpBig" id="mpRe">↩️ Rejoin last lobby</button>`:''}
 <div class="mpSec"><h3>⛵ Open lobbies <button class="mpB" id="mpRef" style="float:right;min-height:32px;padding:2px 10px">↻</button></h3><div id="mpList">${list==null?'Loading…':list.length?list.map(l=>`<button class="mpLob" data-lid="${l.lid}" ${l.n>=MCAP?'disabled':''}><span>⚓ ${mpEsc(l.name)} <small>${mpEsc(l.r)}</small></span><b>${l.n}/${MCAP}</b></button>`).join(''):'<i>No open lobbies — Quick Join will start one.</i>'}</div></div>
 <div class="mpSec"><h3>➕ Create lobby</h3><input class="mpIn" id="mpLName" maxlength="24" placeholder="Lobby name (optional)"><div style="display:flex;gap:6px;margin-top:6px"><button class="mpB on" id="mpPub" style="flex:1">🌍 Public</button><button class="mpB" id="mpPriv" style="flex:1">🔒 Private (code)</button></div><button class="mpBig" id="mpCreate">Create lobby</button></div>
 <div class="mpSec"><h3>🔑 Join with code</h3><div style="display:flex;gap:6px"><input class="mpIn" id="mpCode" maxlength="7" placeholder="ABC123" style="text-transform:uppercase"><button class="mpB" id="mpCodeGo">Join</button></div></div>
 <div class="mpSec"><h3>☁️ Cloud save <small>(optional)</small></h3>${cl?`<div>On — backs up every few minutes while online. Your recovery code:</div><div class="mpCode" id="mpRC">${mpFmtCode(S.cloud.k)}</div><div class="mpSt" style="font-size:12px">Write it down: it restores this captain on any device. Anyone with the code can load it.</div><div style="display:flex;gap:6px"><button class="mpB" id="mpCUp" style="flex:1">⬆️ Back up now</button><button class="mpB" id="mpCOff" style="flex:1">Turn off</button></div>`:`<div>Keep a copy of your captain in the cloud (anonymous — no account needed).</div><button class="mpBig" id="mpCOn">☁️ Turn on cloud save</button>`}
  <div style="display:flex;gap:6px;margin-top:6px"><input class="mpIn" id="mpRIn" placeholder="Recovery code"><button class="mpB" id="mpRGo">Restore</button></div><div class="mpSt" id="mpRSt"></div></div>
 <div class="mpSt" style="font-size:12px">⚔️ PvP is on outside haven waters. ⚓ Havens are safe. 🛡️ Captains under Lv${NEWB_LV} are protected near havens. Gold you carry is at risk when sunk — vault gold is safe. Up to ${MCAP} captains per lobby.</div>`;
 let pub=true;$('mpPub').onclick=()=>{pub=true;$('mpPub').classList.add('on');$('mpPriv').classList.remove('on');};$('mpPriv').onclick=()=>{pub=false;$('mpPriv').classList.add('on');$('mpPub').classList.remove('on');};
 const go=async(f,label)=>{const nm=$('mpName').value.replace(/\s+/g,' ').trim();const er=mpNameOk(nm);if(er){mpLSt('❌ '+er,true);return;}MPX.name=nm;S.mpName=nm;save();mpLSt('⏳ '+label+'…');
  document.querySelectorAll('#mpLBody button').forEach(x=>x.disabled=true);
  try{await f();$('mpL').classList.add('hidden');if(state==='title')$('startBtn').click();}catch(e){mpLSt('❌ '+mpLErr(e),true);document.querySelectorAll('#mpLBody button').forEach(x=>x.disabled=false);}};
 $('mpQuick').onclick=()=>go(mpQuick,'Finding a lobby');if($('mpRe'))$('mpRe').onclick=()=>go(()=>mpJoin(last),'Rejoining');
 $('mpCreate').onclick=()=>go(()=>mpCreate(pub,$('mpLName').value),'Creating lobby');$('mpCodeGo').onclick=()=>go(()=>mpJoinCode($('mpCode').value),'Joining');
 $('mpList').onclick=e=>{const t=e.target.closest('[data-lid]');if(t)go(()=>mpJoin(t.dataset.lid).catch(err=>{if(/FULL/.test(err.message)){mpLSt('Lobby full — finding another…');return mpQuick();}throw err;}),'Joining');};
 $('mpRef').onclick=()=>mpLRefresh();
 if($('mpCOn'))$('mpCOn').onclick=async()=>{try{await mpCloudOn();mpLRender(MPX.lastList);}catch(e){$('mpRSt').textContent='❌ '+mpLErr(e);}};
 if($('mpCUp'))$('mpCUp').onclick=async()=>{try{await mpCloudUp();$('mpRSt').textContent='✅ Backed up.';}catch(e){$('mpRSt').textContent='❌ '+mpLErr(e);}};
 if($('mpCOff'))$('mpCOff').onclick=()=>{mpCloudOff();mpLRender(MPX.lastList);};
 $('mpRGo').onclick=async()=>{const st=$('mpRSt');st.textContent='⏳ Fetching…';try{const r=await mpCloudGet($('mpRIn').value);const s=r.s;
  st.innerHTML=`Load this captain? 💰 ${Math.floor(s.gold)} · Lv${s.clvl|0} · ⭐ ${s.infamy|0} infamy<br><b>This replaces your progress on this device.</b><br><button class="mpB" id="mpRYes">Yes, load it</button>`;
  $('mpRYes').onclick=()=>{try{localStorage.setItem(SAVEKEY,JSON.stringify(s));}catch(e){st.textContent='❌ '+e.message;return;}importing=true;try{sessionStorage.setItem('pirateSeas_imported','1');}catch(e){}location.reload();};}catch(e){st.textContent='❌ '+mpLErr(e);}};
 ['mpName','mpLName','mpCode','mpRIn'].forEach(i=>$(i).addEventListener('keydown',e=>e.stopPropagation()));}
function mpLErr(e){const m=String(e&&e.message||e);if(m==='FULL')return 'That lobby is full (16/16).';if(m==='NOLOBBY')return 'No lobby with that code — check it and try again.';if(/permission/i.test(m))return 'The server refused (rules). Try again.';if(/network|fetch|import|offline/i.test(m))return 'Can\'t reach the online sea — check your connection.';return m;}
async function mpLRefresh(){try{const l=await mpList();MPX.lastList=l;if(!$('mpL').classList.contains('hidden')){const keep=$('mpName')&&$('mpName').value;mpLRender(l);if(keep!=null)$('mpName').value=keep;}}catch(e){mpLSt('❌ '+mpLErr(e),true);}}
function mpOpen(){if(!MPX.name)MPX.name=S.mpName||'';if(!MPX.name){const b=PNAMES[(Math.random()*PNAMES.length)|0].replace(/[^A-Za-z ]/g,'').slice(0,12).trim();MPX.name=b+' '+(10+((Math.random()*89)|0));}
 if(MPX.on){mpPanelOpen();return;}mpLRender(MPX.lastList||null);$('mpL').classList.remove('hidden');
 fbLoad().then(()=>{mpLSt('⚓ Signed in (anonymous captain)');mpLRefresh();}).catch(e=>mpLSt('❌ '+mpLErr(e),true));}
$('mpBtn')&&$('mpBtn').addEventListener('click',()=>{initAudio();mpOpen();});
$('mpLX').onclick=()=>$('mpL').classList.add('hidden');$('mpPX').onclick=()=>$('mpPanel').classList.add('hidden');$('mpCX').onclick=()=>$('mpCard').classList.add('hidden');
$('mpInfo').onclick=()=>mpPanelOpen();$('mpChatBtn').onclick=()=>mpChatOpen(!MPX.chatOpen);$('mpChatX').onclick=()=>mpChatOpen(false);
$('mpPBody').addEventListener('click',e=>{const t=e.target;if(t.id==='mpLeaveB'){$('mpPanel').classList.add('hidden');mpLeave();return;}if(t.id==='mpCrewL'){mpCrewLeave();return;}const r=t.closest('[data-uid]');if(r&&r.dataset.uid)mpCardOpen(r.dataset.uid);});
$('mpChat').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.emo)mpEmote(t.dataset.emo);if(t.dataset.flag)mpSetFlag(t.dataset.flag);});
$('mpSend').onclick=()=>{const i=$('mpMsg');if(mpSay(i.value))i.value='';};
$('mpMsg').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){$('mpSend').click();}});$('mpMsg').addEventListener('keyup',e=>e.stopPropagation());
{let pd=null;cv.addEventListener('pointerdown',e=>{pd={x:e.clientX,y:e.clientY,t:performance.now()};},{passive:true});
 cv.addEventListener('pointerup',e=>{const d=pd;pd=null;if(!d||!MPX.on||state!=='play')return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>14||performance.now()-d.t>350)return;
  const wx=cam.x+(e.clientX-vw/2)/zoom,wy=cam.y+(e.clientY-vh/2)/zoom;let best=null,bd=1e9;for(const id in MPX.rem){const r=MPX.rem[id];if(!r.vis||r.stale)continue;const dd=Math.hypot(r.x-wx,r.y-wy);if(dd<r.len*0.8+30&&dd<bd){bd=dd;best=r;}}if(best)mpCardOpen(best.uid);},{passive:true});}
{const _pv=playerVolley;playerVolley=function(side,aim){_pv(side,aim);if(MPX.on){if(side<0)MPX.fcL=(MPX.fcL+1)%100;else MPX.fcR=(MPX.fcR+1)%100;MPX.force=true;}};}
TIPS.mp='🌐 Online: other captains share this sea. PvP outside havens — tap a ship for its captain card, 💬 for chat, emotes and flag signals.';
const mpApi={fbLoad,mpJoin,mpCreate,mpQuick,mpJoinCode,mpLeave,mpList,mpSay,mpEmote,mpSetFlag,mpInvite,mpInvAnswer,mpCrewLeave,mpCrewN,mpCloudOn,mpCloudUp,mpCloudGet,mpClean,mpBadName,mpNameOk,mpOpen,mpCardOpen,mpPanelOpen,mpChatOpen,mpSafeAt,mpNewb,mpHostId,mpFlushHits,mpCellOf};
