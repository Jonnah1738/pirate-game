#!/usr/bin/env python3
"""Inject (or refresh) the self-contained 2D/3D vote + 'Try Pirate Seas 3D' block into index.html.
Idempotent: replaces everything between the pseas-vote markers. Touches nothing else in the game.
Sources: tools/pg/pseas-vote.js (shared, identical copy lives in pirate-seas-3d/js/pseas-vote.js) + tools/pg/vote2d.js."""
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, '..', '..'))
p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'index.html')
B, E = '<!-- pseas-vote:begin -->', '<!-- pseas-vote:end -->'
js = ''.join(open(os.path.join(here, f), encoding='utf-8').read() for f in ('pseas-vote.js', 'vote2d.js'))
block = B + '\n<script>\n' + js + '</script>\n' + E + '\n'
s = open(p, encoding='utf-8').read()
if B in s:
    s = re.sub(re.escape(B) + r'.*?' + re.escape(E) + r'\n?', lambda m: block, s, flags=re.S)
else:
    i = s.rfind('</body>'); assert i > 0
    s = s[:i] + block + s[i:]
open(p, 'w', encoding='utf-8').write(s)
print('patched', p)
