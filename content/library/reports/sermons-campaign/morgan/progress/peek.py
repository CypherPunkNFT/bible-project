"""Print the contents page and every heading-like line (with the lines that follow) of a staged
_djvu.txt file, using the file's own line numbers. Usage: python -I peek.py FILE [after=6]"""
import re
import sys

path = sys.argv[1]
after = int(sys.argv[2]) if len(sys.argv) > 2 else 6
lines = open(path, encoding="utf-8", errors="replace").read().split("\n")
roman = re.compile(r"^\s*(?:[IVXLC]+|\d+)\s*\.?\s*$")
shown = set()
for idx, line in enumerate(lines):
    text = line.strip()
    if "CONTENTS" in text.upper() and len(text) < 20:
        print(f"--- contents at L{idx + 1}")
        count = 0
        for j in range(idx + 1, len(lines)):
            if lines[j].strip():
                print(f"  L{j + 1}: {lines[j].strip()}")
                count += 1
            if count > 60:
                break
        break
for idx, line in enumerate(lines):
    text = line.strip()
    if roman.match(text) and idx not in shown:
        block = []
        j = idx + 1
        while j < len(lines) and len(block) < after:
            if lines[j].strip():
                block.append(f"L{j + 1}: {lines[j].strip()[:110]}")
            j += 1
        print(f"== L{idx + 1}: {text}")
        for b in block:
            print("     " + b)
