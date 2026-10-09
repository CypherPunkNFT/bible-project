"""Print a review card for extracted pages: head paragraphs, provenance hints, tail.

Usage: python -X utf8 -I review_print.py EXTRACTED.jsonl [--author "Billy Graham"] [--files a.html,b.html] [--skip N]
"""
import json
import re
import sys

SCRIPTURE_CUE = re.compile(
    r"turn (with me )?to|my text|our text|the text (for|of) |I want (us )?to (read|consider|look at|speak|talk)|"
    r"(read|reading) (from|with me)|Scripture:|Text:|passage", re.I)


def main():
    path = sys.argv[1]
    args = sys.argv[2:]
    author = args[args.index("--author") + 1] if "--author" in args else None
    files = set(args[args.index("--files") + 1].split(",")) if "--files" in args else None
    for line in open(path, encoding="utf-8"):
        rec = json.loads(line)
        if author and rec.get("author") != author:
            continue
        if files and rec["file"] not in files:
            continue
        paras = rec["paragraphs"]
        print("=" * 100)
        print(rec["file"], "|", rec["title"], "|", rec["publishDate"], "|", rec["author"], "|", rec["chars"])
        for p in paras[:4]:
            print(f"  [{p['tag']}] {p['text'][:400]}")
        cues = [p["text"][:300] for p in paras[:8] if SCRIPTURE_CUE.search(p["text"])]
        for cue in cues:
            print(f"  CUE: {cue}")
        for hint in rec["provenanceHints"][:4]:
            print(f"  HINT: {hint[:250]}")
        for p in paras[-3:]:
            print(f"  [tail] {p['text'][:250]}")


if __name__ == "__main__":
    main()
