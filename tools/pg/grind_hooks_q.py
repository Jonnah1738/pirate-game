# --- module Q (AI captains) hooks: lobby cap 20 humans (+4 host-run bots), lobby list / pill / panel counts ---
def _cr(a,b,n=1):
    global code
    assert code.count(a)==n,(a,code.count(a))
    code=code.replace(a,b)
_cr("MCAP=16,","MCAP=20,")
_cr("<b>${l.n}/${MCAP}</b>","<b>${l.n}/${MCAP} <small>+${QB_N} bots</small></b>")
_cr("let n=1;for(const id in MPX.rem)if(!MPX.rem[id].stale)n++;","let n=1;for(const id in MPX.rem)if(!MPX.rem[id].stale&&!MPX.rem[id].bot)n++;")
_cr("${n}/${MCAP}${MPX.host?' 👑':''}","${n}/${MCAP}${qbCount()?' +'+qbCount()+' bots':''}${MPX.host?' 👑':''}")
_cr("<h3>Captains (${list.length}/${MCAP})</h3>","<h3>Captains (${list.filter(r=>!r.bot).length}/${MCAP}${list.some(r=>r.bot)?' +'+list.filter(r=>r.bot).length+' bots':''})</h3>")
