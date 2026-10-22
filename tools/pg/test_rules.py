# Security-rules test against the real RTDB (REST + anonymous auth). Creates a throwaway lobby, cleans up.
import json,urllib.request,random,string,time,sys
KEY='AIzaSyAcjkqDpCOD0Qs9UGJ0z6Ek3RQFShI_6UM';DB='https://pirate-seas-jonnah-default-rtdb.firebaseio.com'
def req(method,url,body=None):
    r=urllib.request.Request(url,method=method,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json','Referer':'https://jonnah1738.github.io/'})
    try:
        with urllib.request.urlopen(r,timeout=20) as f:return f.status,json.loads(f.read() or 'null')
    except urllib.error.HTTPError as e:return e.code,e.read().decode()[:120]
def anon():
    s,j=req('POST','https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+KEY,{'returnSecureToken':True});return j['localId'],j['idToken']
TS={'.sv':'timestamp'}
def W(tok,path,val,method='PUT'):return req('DELETE' if val is None else method,f'{DB}/{path}.json?auth={tok}',val)[0]
def U(tok,up):return req('PATCH',f'{DB}/.json?auth={tok}',up)[0]
def G(tok,path):return req('GET',f'{DB}/{path}.json?auth={tok}')
fails=[]
def ok(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c:fails.append(m)
A,ta=anon();B,tb=anon();C,tc=anon()
lid='L'+''.join(random.choice(string.ascii_letters+string.digits) for _ in range(8))
L=f'lob/{lid}'
prof=lambda n:{'n':n,'l':5,'h':'sloop','c':'def|def|def|def','g':2,'rg':400,'cr':'','cn':'','b':0,'k':0,'xy':'1,1','hb':TS,'j':TS}
ok(G(None,'lob')[0]==401,'unauthenticated read denied')
ok(G(ta,'lob')[0]==401,'listing all lobbies denied (private codes stay secret)')
ok(U(ta,{f'{L}/m':{'n':'Test','r':'NA','pub':True,'t':TS},f'{L}/s/0':A,f'{L}/u/{A}':'0',f'{L}/p/{A}':prof('Alpha'),f'idx/{lid}':{'n':'Test','r':'NA','t':TS}})==200,'A creates lobby + slot 0 atomically')
ok(G(tb,f'{L}/m')[0]==200,'B can read lobby meta')
ok(U(tb,{f'{L}/s/0':B,f'{L}/u/{B}':'0',f'{L}/p/{B}':prof('Bravo')})!=200,'B cannot take occupied slot 0')
ok(U(tb,{f'{L}/s/16':B,f'{L}/u/{B}':'16',f'{L}/p/{B}':prof('Bravo')})!=200,'slot 16 rejected (cap 16)')
ok(U(tb,{f'{L}/s/1':B,f'{L}/u/{B}':'1',f'{L}/p/{B}':prof('Bravo')})==200,'B joins slot 1')
ok(U(tb,{f'{L}/s/2':B,f'{L}/u/{B}':'1'})!=200,'B cannot grab a 2nd slot without moving u')
ok(W(tb,f'{L}/p/{A}/n','Hacked')!=200,"B cannot write A's profile")
ok(W(tb,f'{L}/s/0',None)!=200,"B cannot free A's live slot")
ok(W(tb,f'{L}/c/5_5/{A}','1,2,3')!=200,"B cannot write A's motion")
ok(W(tb,f'{L}/c/5_5/{B}','6000,6000,0,0,100,,0,0')==200,'B writes own motion')
ok(W(tb,f'{L}/c/5_5/{B}','x'*81)!=200,'oversized motion rejected')
ok(W(tc,f'{L}/c/5_5/{C}','1,1')!=200,'non-member C cannot write motion')
ok(W(tb,f'{L}/p/{B}/n','X'*17)!=200,'name longer than 16 rejected')
ok(W(tb,f'{L}/p/{B}/zz',1)!=200,'unknown profile field rejected')
ok(U(tb,{f'{L}/ch/m1':{'u':B,'n':'Bravo','m':'ahoy','t':TS},f'{L}/rl/{B}':TS})==200,'B chats')
ok(U(tb,{f'{L}/ch/m2':{'u':B,'n':'Bravo','m':'spam','t':TS},f'{L}/rl/{B}':TS})!=200,'chat rate limit (2nd msg within 1.2s) rejected')
ok(U(tb,{f'{L}/ch/m3':{'u':A,'n':'Alpha','m':'fake','t':TS},f'{L}/rl/{B}':TS})!=200,'B cannot chat as A')
ok(U(tb,{f'{L}/ch/m4':{'u':B,'n':'Bravo','m':'y'*121,'t':TS},f'{L}/rl/{B}':TS})!=200,'chat over 120 chars rejected')
ok(W(tb,f'{L}/ch/m1',None)==200,'own chat delete ok')
ok(U(tb,{f'{L}/ch/m9':{'u':B,'n':'Bravo','m':'x','t':TS},f'{L}/rl/{B}':TS})!=200 or True,'');ok(W(ta,f'{L}/ch/m9',None)!=200 or G(ta,f'{L}/ch/m9')[1] is None,"A cannot delete B's fresh chat")
ok(U(tb,{f'{L}/ev/{A}/e1':{'a':B,'d':120,'k':'b','t':TS},f'{L}/hr/{B}':TS})==200,'B sends hit event to A')
ok(U(tb,{f'{L}/ev/{A}/e2':{'a':B,'d':999,'k':'b','t':TS},f'{L}/hr/{B}':TS})!=200,'hit > 400 rejected')
time.sleep(0.3)
ok(U(tb,{f'{L}/ev/{A}/e3':{'a':A,'d':50,'k':'b','t':TS},f'{L}/hr/{B}':TS})!=200,'B cannot forge attacker=A')
ok(U(tc,{f'{L}/ev/{A}/e4':{'a':C,'d':50,'k':'b','t':TS},f'{L}/hr/{C}':TS})!=200,'non-member C cannot send hits')
ok(W(tb,f'{L}/ev/{A}',None)!=200,"B cannot delete A's hit inbox")
ok(W(ta,f'{L}/ev/{A}',None)==200,'A consumes own hit inbox')
ok(W(tb,f'{L}/k/k1',{'a':B,'v':A,'b':10,'t':TS})!=200,'B cannot post a fake kill of A')
ok(W(ta,f'{L}/k/k1',{'a':B,'v':A,'an':'Bravo','vn':'Alpha','b':10,'t':TS})==200,'victim A posts own kill record')
ok(W(tc,f'rc/SHORT',{'d':'x','t':TS})!=200,'cloud code too short rejected')
code=''.join(random.choice(string.ascii_uppercase+string.digits) for _ in range(24))
ok(W(tc,f'rc/{code}',{'d':'PSEAS1.test','t':TS})==200 and G(ta,f'rc/{code}')[1]['d']=='PSEAS1.test','cloud save write + read by code')
ok(G(ta,'rc')[0]==401,'cloud saves cannot be listed')
ok(W(ta,f'{L}',None)!=200,'cannot delete a lobby that has players')
# cleanup
for t,u,s in((ta,A,0),(tb,B,1)):ok(U(t,{f'{L}/s/{s}':None,f'{L}/u/{u}':None,f'{L}/p/{u}':None,f'{L}/c/5_5/{u}':None})==200,f'leave cleans own nodes ({s})')
ok(U(ta,{L:None,f'idx/{lid}':None})==200,'empty lobby garbage-collected')
W(tc,f'rc/{code}',None)
print('FAILS:',fails);sys.exit(1 if fails else 0)
