"""Print KJV passages: python dump.py "GEN 29:31-30:24" "NUM 1:1-47" ..."""
import sys
from kjv import ref, verses_in, verse, label

for r in sys.argv[1:]:
    code = r.split(" ")[0]
    rest = r.split(" ")[1]
    if "-" in rest and ":" in rest.split("-")[1]:
        a, b = ref(r)
        # cross-chapter: iterate the whole book range
        span = [a, b]
    else:
        span = ref(r)
    print("==", r)
    for v in verses_in(span):
        print(f"{(v % 1_000_000) // 1000}:{v % 1000} {verse(v)}")
