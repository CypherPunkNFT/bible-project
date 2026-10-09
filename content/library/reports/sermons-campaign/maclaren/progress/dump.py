"""Dump the opening raw XML of given leaf divs. Usage: python -I dump.py FILE NCHARS ID [ID...]"""
import re
import sys

text = open(sys.argv[1], encoding="utf-8").read()
n = int(sys.argv[2])
for div_id in sys.argv[3:]:
    m = re.search(r'<div\d[^>]*id="%s"[^>]*>' % re.escape(div_id), text)
    print("#####", div_id)
    print(text[m.start():m.start() + n] if m else "NOT FOUND")
