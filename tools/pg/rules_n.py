# Adds online-feature nodes (module n) to firebase/database.rules.json. Idempotent.
import json,sys
F='/workspace/pirate-game/firebase/database.rules.json'
R=json.load(open(F));L=R['rules']['lob']['$lid']
MEM="root.child('lob/' + $lid + '/p/' + auth.uid).exists()"
S=lambda n:{".validate":"newData.isString() && newData.val().length <= %d"%n}
N=lambda a,b:{".validate":"newData.isNumber() && newData.val() >= %s && newData.val() <= %s"%(a,b)}
NOW={".validate":"newData.val() === now"}
NO={".validate":False}
L['w']={".write":"auth != null && "+MEM,
 "e":{".validate":"newData.hasChildren(['id','k','x','y','at','end'])","id":S(20),"k":S(8),"x":N(0,24000),"y":N(0,24000),"at":N(0,9e12),"end":N(0,9e12),"hp":N(0,5000000),"dp":N(0,99),"lv":N(1,99),"$other":NO},
 "nx":N(0,9e12),"sp":S(24),"$other":NO}
L['wb']={"$eid":{"$uid":{".write":"auth != null && $uid === auth.uid && "+MEM+" || (!newData.exists() && auth != null && root.child('lob/' + $lid + '/w/e/id').val() !== $eid)",
 ".validate":"newData.isNumber() && newData.val() >= 0 && newData.val() <= 5000000 && (!data.exists() || newData.val() >= data.val())"}}}
L['wn']={"$eid":{".write":"auth != null && ((!data.exists() && newData.child('u').val() === auth.uid && "+MEM+") || (!newData.exists() && data.child('t').val() < now - 900000))",
 ".validate":"newData.hasChildren(['u','n','t'])","u":S(40),"n":S(16),"t":NOW,"r":S(12),"$other":NO}}
L['tc']={"$z":{".write":"auth != null && "+MEM+" && (newData.exists() ? newData.child('u').val() === auth.uid : (data.child('u').val() === auth.uid || data.child('t').val() < now - 600000))",
 ".validate":"$z.matches(/^[0-9]$/) && newData.hasChildren(['u','n','t'])","u":S(40),"n":S(16),"cr":S(40),"cn":S(20),"t":NOW,"o":N(0,3),"f":S(12),"$other":NO}}
L['du']={"$to":{"$from":{".write":"auth != null && (($from === auth.uid && (!newData.exists() || "+MEM+")) || ($to === auth.uid && !newData.exists()))",
 ".validate":"newData.hasChildren(['n','w','t'])","n":S(16),"w":N(0,100000),"t":NOW,"ok":N(0,1),"$other":NO}}}
L['gf']={"$to":{"$gid":{".write":"auth != null && ((!data.exists() && newData.child('a').val() === auth.uid && "+MEM+") || ($to === auth.uid && !newData.exists()))",
 ".validate":"newData.hasChildren(['a','g','t'])","a":S(40),"g":N(1,20000),"n":S(16),"why":S(16),"t":NOW,"$other":NO}}}
L['bd']={"$host":{".write":"auth != null && $host === auth.uid && (!newData.exists() || "+MEM+")",
 ".validate":"!newData.exists() || newData.hasChildren(['n','t'])","n":S(24),"hn":S(16),"x":N(0,24000),"y":N(0,24000),"t":{".validate":"newData.isNumber() && newData.val() <= now"},"st":S(200),"r":S(12),"g":N(0,1000000),
  "j":{"$uid":{".write":"auth != null && $uid === auth.uid && (!newData.exists() || "+MEM+")",".validate":"newData.hasChildren(['n','t'])","n":S(16),"t":{".validate":"newData.isNumber() && newData.val() <= now"},"o":S(8),"l":N(1,999),"$other":NO}},
  "$other":NO}}
# kill record: duel / smuggling markers
K=L['k']['$kid'];K['du']=N(0,100000);K['sm']=N(0,1);K['f']=K.get('f',S(2))
# leaderboard + global market at the root
R['rules']['lb']={"$wk":{".read":"auth != null",".indexOn":["s"],"$uid":{".write":"auth != null && $uid === auth.uid",
 ".validate":"$wk.matches(/^W[0-9]{4,5}$/) && newData.hasChildren(['n','s','t']) && (!data.exists() || newData.child('s').val() >= data.child('s').val())",
 "n":S(16),"s":N(0,10000000),"k":N(0,1000000),"b":N(0,100000000),"l":N(1,999),"t":NOW,"$other":NO}}}
R['rules']['mk']={".read":"auth != null",".indexOn":["s","t"],"$id":{
 ".write":"auth != null && ((!data.exists() && newData.child('s').val() === auth.uid && newData.child('t').val() === now) || (!newData.exists() && (data.child('s').val() === auth.uid || data.child('t').val() < now - 172800000)))",
 ".validate":"newData.hasChildren(['s','n','g','q','p','t'])","s":S(40),"n":S(16),"g":S(8),"q":N(1,500),"p":N(1,100000),"t":{".validate":"newData.isNumber() && newData.val() <= now"},"h":N(0,99),
 "b":{".write":"auth != null && !data.exists() && newData.val() === auth.uid && data.parent().child('s').val() !== auth.uid && data.parent().exists()",".validate":"newData.isString()"},
 "bn":{".write":"auth != null && !data.exists() && newData.parent().child('b').val() === auth.uid",".validate":"newData.isString() && newData.val().length <= 16"},
 "$other":NO}}
json.dump(R,open(F,'w'),indent=1)
print('rules ok',list(L.keys()),list(R['rules'].keys()))
