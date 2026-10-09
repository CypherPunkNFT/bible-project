"""Extract the Copyright Policy and Terms & Conditions text from a saved gty.org /about page.

The page is a Next.js app; the tab bodies live inside self.__next_f.push([...]) payloads.
Usage: python -X utf8 -I extract_policy.py <saved-about.html>
"""
import html
import json
import re
import sys


def main(path):
    raw = open(path, encoding="utf-8").read()
    chunks = []
    for m in re.finditer(r"self\.__next_f\.push\((\[.*?\])\)</script>", raw, re.S):
        try:
            arr = json.loads(m.group(1))
        except json.JSONDecodeError as exc:
            print(f"skip chunk: {exc}", file=sys.stderr)
            continue
        if len(arr) > 1 and isinstance(arr[1], str):
            chunks.append(arr[1])
    text = "".join(chunks)
    for m in re.finditer(r"<p>The following stipulations|<h3><strong>[^<]*</strong></h3>|<p>[^<]{0,40}(Terms|terms)", text):
        pass
    # Print every HTML-bearing segment that mentions policy keywords
    segments = re.split(r"\n[0-9a-f]+:T[0-9a-f]+,", text)
    for seg in segments:
        if re.search(r"(?i)stipulations|terms and conditions|terms of use|you agree|automated|robot|scrap|harvest", seg) and "<p>" in seg:
            plain = re.sub(r"<li>", "\n - ", seg)
            plain = re.sub(r"</(p|h3|ul|ol)>|<br\s*/?>", "\n", plain)
            plain = html.unescape(re.sub(r"<[^>]+>", "", plain))
            print("=" * 60)
            print(plain[:12000])


if __name__ == "__main__":
    main(sys.argv[1])
