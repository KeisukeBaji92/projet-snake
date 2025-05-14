import sys, json, random

state = json.loads(sys.stdin.read() or "{}")
move = random.choice(["UP", "DOWN", "LEFT", "RIGHT"])
print(move, flush=True)
