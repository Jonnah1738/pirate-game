/* 2D adapter for the shared 2D/3D vote + "Try Pirate Seas 3D" link. Read-only use of window.__game; never touches saves. */
(function () {
  'use strict';
  var G = window.__game, V = window.PSEASVote; if (!G || !V) return;
  var URL3D = 'https://jonnah1738.github.io/pirate-seas-3d/', OFF = 'pseas_try3d_off_v1';
  var LIVE = location.hostname === 'jonnah1738.github.io' && (!navigator.webdriver || /[?&]ct=1\b/.test(location.search));
  var PLAYS = { play: 1, port: 1, brawl: 1, fort: 1, mini: 1 };
  function calm() {
    var st = G.state; if (st === 'port') return true;
    if (st !== 'play' || (G.T && G.T.on)) return false;
    try { var P = G.P, S = G.ST(); if (P && S && S.maxHp && P.hp / S.maxHp < 0.4) return false;
      var en = G.enemies || [];
      for (var i = 0; i < en.length; i++) { var e = en[i]; if (!e || e.sinking) continue;
        if (e.kind === 'merchant' && !e.angry && !(e.aggro > 0)) continue;
        var dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy < 900 * 900) return false; }
    } catch (err) { return false; }
    return true;
  }
  var st = document.createElement('style');
  st.textContent = '#psv3d{display:flex;align-items:center;gap:6px;margin:8px auto 0;max-width:100%;box-sizing:border-box;padding:3px 3px 3px 12px;border-radius:999px;' +
    'background:linear-gradient(#3b3129,#211b16);border:1.5px solid #9c7a3e;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 6px rgba(0,0,0,.35);font-family:Georgia,serif}' +
    '#psv3d a{flex:1;color:#f3dfae;font-weight:bold;font-size:13.5px;text-decoration:none;padding:8px 2px;line-height:1.2;text-align:center}' +
    '#psv3d a b{color:#ffd877}#psv3d button{flex:none;width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,.08);color:#e9d3a0;font-size:15px;cursor:pointer}' +
    '.psv-mrow a.b{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;box-sizing:border-box}';
  document.head.appendChild(st);
  function banner() {
    var ft = document.querySelector('#title .tfoot'); if (!ft || document.getElementById('psv3d')) return;
    try { if (localStorage.getItem(OFF)) return; } catch (e) { }
    var d = document.createElement('div'); d.id = 'psv3d';
    d.innerHTML = '<a href="' + URL3D + '" target="_blank" rel="noopener">\u2693 New: <b>Try Pirate Seas 3D</b> \u2197</a><button type="button" aria-label="Hide">\u2715</button>';
    d.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); try { localStorage.setItem(OFF, '1'); } catch (er) { } d.remove(); });
    d.querySelector('a').addEventListener('click', function (e) { e.stopPropagation(); });
    ft.parentNode.insertBefore(d, ft.nextSibling);
  }
  function mrow() {
    var body = document.getElementById('mBody'); if (!body || body.querySelector('.psv-mrow')) return;
    var g = body.querySelector('button[data-act="gfx"]'); var item = g && g.closest('.item'); if (!item) return;
    var r = V.settingsRow(), w = document.createElement('div');
    w.innerHTML = '<div class="item psv-mrow"><div class="it"><b>\uD83C\uDF0A Pirate Seas 3D</b><small>The new 3D version opens in a new tab. Your 2D progress stays right here.</small></div>' +
      '<div class="ib"><a class="b" href="' + URL3D + '" target="_blank" rel="noopener">Try 3D \u2197</a></div></div>' +
      '<div class="item psv-mrow"><div class="it"><b>\u2B50 ' + r.label + '</b><small>' + r.text + '</small></div><div class="ib"><button class="b" data-pv="vote">' + r.button + '</button></div></div>';
    var rows = [].slice.call(w.children);
    rows.forEach(function (x) { x.addEventListener('click', function (e) {
      e.stopPropagation(); if (e.target.closest('[data-pv="vote"]')) { e.preventDefault(); V.open(true); } }); });
    item.after.apply(item, rows);
    var a = rows[0].querySelector('a.b'), ref = rows[1].querySelector('button.b');
    if (a && ref) { var cs = getComputedStyle(ref); ['background', 'border', 'borderRadius', 'color', 'boxShadow', 'font', 'padding', 'minHeight', 'minWidth', 'textShadow', 'letterSpacing'].forEach(function (k) { a.style[k] = cs[k]; }); }
  }
  V.init({ game: '2d', countOn: LIVE, otherUrl: URL3D, settingsName: 'the Captain\u2019s Log',
    isPlaying: function () { return !!PLAYS[G.state]; }, isCalm: calm,
    onClose: function () { var b = document.getElementById('mBody'); if (b) { var o = b.querySelectorAll('.psv-mrow'); for (var i = 0; i < o.length; i++) o[i].remove(); mrow(); } } });
  banner();
  var mb = document.getElementById('mBody'); if (mb) new MutationObserver(mrow).observe(mb, { childList: true });
  var t = document.getElementById('title'); if (t) new MutationObserver(banner).observe(t, { childList: true, subtree: true });
})();
