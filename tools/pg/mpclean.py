# Test DB hygiene: remember every anonymous uid + online-captain key a test browser creates, then remove exactly
# those records (ou/{uid}, oc/{key}, lb/{week}/{uid}) with the admin CLI at exit. Never touches records it didn't see.
import json,re,subprocess,atexit,time
UIDS=set();KEYS=set();EXTRA=set();_done=[False]
RX_K=re.compile(r'^[A-Z0-9]{24}$');RX_U=re.compile(r'^[A-Za-z0-9]{20,40}$')
POLL="setInterval(()=>{try{const G=window.__game&&__game.GRIND;if(!G||!G.MPX||!G.MPX.uid)return;const k=(G.OC&&G.OC.k)||(__game.S&&__game.S.oc&&__game.S.oc.k)||'';const s=G.MPX.uid+'|'+k;if(window.__trkL===s)return;window.__trkL=s;window.__trk(G.MPX.uid,k);}catch(e){}},700);"
def _cb(u,k):
    if u and RX_U.match(u):UIDS.add(u)
    if k and RX_K.match(k):KEYS.add(k)
def attach(context):
    try:context.expose_function('__trk',_cb)
    except Exception:pass
    context.add_init_script(POLL)
def trk(pg):
    try:
        r=pg.evaluate("(()=>{try{const G=__game.GRIND;return [G.MPX.uid||'',(G.OC&&G.OC.k)||(__game.S.oc&&__game.S.oc.k)||'']}catch(e){return ['','']}})()")
        _cb(r[0],r[1])
    except Exception:pass
def key(k):_cb('',k)
def path(p):EXTRA.add(p)
def _cli(args,timeout=120):
    return subprocess.run('cd /workspace/pirate-game/firebase && npx -y firebase-tools@latest '+args+' --project pirate-seas-jonnah',shell=True,capture_output=True,text=True,timeout=timeout)
def cleanup():
    if _done[0]:return
    _done[0]=True
    if not (UIDS or KEYS or EXTRA):return
    up={}
    for u in sorted(UIDS):
        r=_cli('database:get /ou/'+u)
        try:
            v=json.loads(r.stdout.strip() or 'null')
            if isinstance(v,str) and RX_K.match(v):KEYS.add(v)
        except Exception:pass
        up['ou/'+u]=None
    wk=int(time.time()*1000+3*864e5)//604800000
    for u in UIDS:
        for w in (wk,wk-1):up[f'lb/W{w}/{u}']=None
    for k in KEYS:up['oc/'+k]=None
    for p in EXTRA:up[p]=None
    open('/tmp/mpclean.json','w').write(json.dumps(up))
    r=_cli('database:update / /tmp/mpclean.json -f')
    print(f'CLEANUP removed {len(KEYS)} oc + {len(UIDS)} ou test records'+('' if r.returncode==0 else ' FAILED '+r.stderr[-200:]),flush=True)
atexit.register(cleanup)
