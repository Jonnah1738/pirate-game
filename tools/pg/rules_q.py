# Module Q (AI captains) rules: lobby cap 20 humans; host-written bot state (bt/bp), human hits on bots (bh),
# bot kills in the kill feed, bot boss damage (wb). Idempotent.
import json
F='/workspace/pirate-game/firebase/database.rules.json'
R=json.load(open(F));L=R['rules']['lob']['$lid']
MEM="root.child('lob/' + $lid + '/p/' + auth.uid).exists()"
BOT="/^B[0-3]$/"
L['s']['$slot']['.validate']="$slot.matches(/^([0-9]|1[0-9])$/) && newData.isString() && newData.val() === auth.uid"
L['bt']={".write":"auth != null && "+MEM,".validate":"newData.isString() && newData.val().length <= 480"}
S=lambda n:{".validate":"newData.isString() && newData.val().length <= %d"%n}
N=lambda a,b:{".validate":"newData.isNumber() && newData.val() >= %s && newData.val() <= %s"%(a,b)}
L['bp']={".write":"auth != null && "+MEM,"$bid":{".validate":"$bid.matches("+BOT+") && newData.hasChildren(['n','l','h'])",
 "n":{".validate":"newData.isString() && newData.val().length >= 2 && newData.val().length <= 16"},"l":N(1,60),"h":S(10),"c":S(60),"g":N(1,20),"rg":N(100,2000),"b":N(0,1000000),"k":N(0,1000000),"$other":{".validate":False}}}
L['bh']={"$k":{".write":"auth != null && ((!data.exists() && newData.child('a').val() === auth.uid && "+MEM+" && newData.parent().parent().child('hr/' + auth.uid).val() === now) || (!newData.exists() && "+MEM+"))",
 ".validate":"newData.hasChildren(['a','v','d','t'])","a":S(40),"v":{".validate":"newData.isString() && newData.val().matches("+BOT+")"},"d":N(1,400),"t":{".validate":"newData.val() === now"},"$other":{".validate":False}}}
k=L['k']['$kid']
add="(!data.exists() && newData.child('v').isString() && newData.child('v').val().matches("+BOT+") && "+MEM+")"
if 'B[0-3]' not in k['.write']:
    k['.write']=k['.write'].replace("auth != null && (","auth != null && ("+add+" || ",1)
w=L['wb']['$eid']['$uid']
if 'B[0-3]' not in w['.write']:
    w['.write']="("+w['.write']+") || (auth != null && $uid.matches("+BOT+") && "+MEM+")"
json.dump(R,open(F,'w'),indent=1)
print('ok',k['.write'][:200]);print(w['.write'])
