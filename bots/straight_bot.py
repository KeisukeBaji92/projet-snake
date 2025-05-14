import sys, json   # ← tu peux ignorer le state si tu veux
json.loads(sys.stdin.read() or "{}")
move = "UP"
print(move, flush=True)
