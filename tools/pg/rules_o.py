# Adds the ONLINE captain profile nodes (module o) to firebase/database.rules.json. Idempotent.
# oc/{24-char code} = {u,lv,g,x,t,d,n}; ou/{uid} = code. Presence level is capped by the cloud profile level.
import json
F='/workspace/pirate-game/firebase/database.rules.json'
R=json.load(open(F));RR=R['rules']
S=lambda n:{".validate":"newData.isString() && newData.val().length <= %d"%n}
N=lambda a,b:{".validate":"newData.isNumber() && newData.val() >= %s && newData.val() <= %s"%(a,b)}
NO={".validate":False}
n=lambda k:"newData.child('%s').val()"%k
o=lambda k:"data.child('%s').val()"%k
EL="(now - "+o('t')+")"
CREATE="(!data.exists() && "+n('lv')+" <= 2 && "+n('g')+" <= 2000 && "+n('x')+" <= 1000)"
OWNER=("(data.exists() && "+o('u')+" === auth.uid && "+n('lv')+" >= "+o('lv')+" && "+n('lv')+" <= "+o('lv')+" + 2 + "+EL+" / 120000 && "
       +n('x')+" >= "+o('x')+" && "+n('x')+" <= "+o('x')+" + 20000 + "+EL+" * 0.2 && "+n('g')+" <= "+o('g')+" + 50000 + "+EL+" * 0.15)")
CLAIM="(data.exists() && "+o('u')+" !== auth.uid && "+n('lv')+" === "+o('lv')+" && "+n('g')+" === "+o('g')+" && "+n('x')+" === "+o('x')+" && "+n('d')+" === "+o('d')+")"
RR['oc']={"$k":{".read":"auth != null && $k.matches(/^[A-Z0-9]{24}$/)",
 ".write":"auth != null && $k.matches(/^[A-Z0-9]{24}$/) && ((!newData.exists() && "+o('u')+" === auth.uid) || (newData.exists() && "+n('u')+" === auth.uid && ("+CREATE+" || "+OWNER+" || "+CLAIM+")))",
 ".validate":"newData.hasChildren(['u','lv','g','x','t','d'])","u":S(40),"lv":N(1,60),"g":N(0,1000000000),"x":N(0,10000000000),
 "t":{".validate":"newData.val() === now"},"d":S(400000),"n":S(16),"$other":NO}}
RR['ou']={"$uid":{".read":"auth != null && $uid === auth.uid",".write":"auth != null && $uid === auth.uid",
 ".validate":"newData.isString() && newData.val().matches(/^[A-Z0-9]{24}$/) && newData.parent().parent().child('oc/' + newData.val() + '/u').val() === auth.uid"}}
# presence level <= cloud online-profile level (or <= 2 before the first cloud save)
P=RR['lob']['$lid']['p']['$uid']
P['l']={".validate":"newData.isNumber() && newData.val() >= 1 && newData.val() <= 60 && (newData.val() <= 2 || (root.child('ou/' + auth.uid).exists() && newData.val() <= root.child('oc/' + root.child('ou/' + auth.uid).val() + '/lv').val()))"}
# market: total listing value capped (keeps cloud gold-jump caps meaningful)
M=RR['mk']['$id'];v=M['.validate'];cap=" && newData.child('q').val() * newData.child('p').val() <= 50000"
if cap not in v:M['.validate']=v+cap
json.dump(R,open(F,'w'),indent=1)
print('rules o ok',list(RR.keys()))
