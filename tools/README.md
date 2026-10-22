# Build & test tools (Pirate Seas)

Dev-only scripts; nothing here is loaded by the game.

- Build: the base file is the b760e15 `index.html` (save as `old_grind.html`), then
  `INP=old_grind.html python3 tools/pg/patch_grind.py a,b,c,d,e`.
  Modules: a crafting/mastery/crew, b weather/fishing/codex, c contracts/events,
  d fleet upgrades/lay-ups, e sail throttle lever. Each module is `grind_<m>.js`,
  plus optional `grind_<m>.exp` (debug exports) and `grind_hooks_<m>.py` (string patches).
  (The scripts expect the tools at /workspace/tools/pg/.)
- Tests: serve the folder (`python3 -m http.server 8765`), then run Playwright
  `tools/pg/test_*.py`, or all of them with
  `EXTRA="test_grind_a test_grind_b test_grind_c test_fleet test_throttle" tools/pg/runall.sh`.
