#!/bin/bash
cd /workspace/pirate-game
for t in test_fix1 test_tutfix test_exp1 test_b2 test_b2x test_b3x test_b4 test_b4x test_b5 test_board test_econ test_hard test_classes test_story $EXTRA; do
  if timeout 600 python3 /workspace/tools/pg/$t.py > /tmp/run_$t.log 2>&1; then echo "OK $t"; else
    if timeout 600 python3 /workspace/tools/pg/$t.py > /tmp/run_$t.log 2>&1; then echo "OK(retry) $t"; else echo "FAIL $t"; fi; fi
done
echo ALLDONE
