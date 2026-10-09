"""Print lines START..START+COUNT non-empty lines of a staged text, with file line numbers,
squeezing spaces and skipping lines with fewer than 3 letters.
Usage: python -I front.py FILE [start=1] [count=120]"""
import re
import sys

path = sys.argv[1]
start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
count = int(sys.argv[3]) if len(sys.argv) > 3 else 120
lines = open(path, encoding="utf-8", errors="replace").read().split("\n")
shown = 0
for idx in range(start - 1, len(lines)):
    text = re.sub(r"\s+", " ", lines[idx]).strip()
    if len(re.findall(r"[A-Za-z]", text)) < 3:
        continue
    print(f"{idx + 1}: {text[:120]}")
    shown += 1
    if shown >= count:
        break
