"""Locate each sermon heading in a staged text and show what is printed under it.

Usage: python -I headings.py FILE START_LINE "Title one|Title two|..." [after=9]
For each title (in order) finds the first short line at/after the previous hit (or START_LINE)
whose letters-only lowercase form contains the title's letters-only lowercase form, then prints
the next AFTER non-empty lines with file line numbers.
"""
import re
import sys

path, start, titles = sys.argv[1], int(sys.argv[2]), sys.argv[3].split("|")
after = int(sys.argv[4]) if len(sys.argv) > 4 else 9
lines = open(path, encoding="utf-8", errors="replace").read().split("\n")


def norm(text):
    return re.sub(r"[^a-z]", "", text.lower())


pos = start - 1
for title in titles:
    key = norm(title)
    hit = None
    for idx in range(pos, len(lines)):
        line = lines[idx]
        if len(line.strip()) < 90 and key and key in norm(line):
            hit = idx
            break
    if hit is None:
        print(f"!! NOT FOUND: {title}")
        continue
    print(f"== {title}  @L{hit + 1}: {lines[hit].strip()}")
    shown, j = 0, hit + 1
    while j < len(lines) and shown < after:
        if lines[j].strip():
            print(f"     L{j + 1}: {re.sub(r'[ ]+', ' ', lines[j].strip())[:115]}")
            shown += 1
        j += 1
    pos = hit + 1
