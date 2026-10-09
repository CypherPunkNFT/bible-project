"""List kept pages NOT bylined Billy Graham whose text says it presents a Graham sermon/message."""
import json
import re
import sys

CUE = re.compile(r"Billy Graham (preached|delivered|sermon|message)|message from Billy Graham|sermon from|"
                 r"following (message|sermon)|preached the following|Graham.s (\d{4} )?(sermon|message)")

for line in open(sys.argv[1], encoding="utf-8"):
    rec = json.loads(line)
    if rec["author"] == "Billy Graham":
        continue
    hits = [p["text"][:200] for p in rec["paragraphs"] if CUE.search(p["text"])]
    if hits:
        print(rec["file"][:70], rec["chars"])
        for h in hits[:3]:
            print("    ", h)
