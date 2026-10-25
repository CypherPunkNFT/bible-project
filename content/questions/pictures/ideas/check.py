"""Checks one chunk of picture ideas against its input (TASK.md): every id once, in order, and every field in shape.

    python3 content/questions/pictures/ideas/check.py 001

Prints OK, or each problem found (what, where, what was expected) and exits 1.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DRAW = {"easy", "medium", "hard", "symbol"}
SHOWS = {"none", "god", "jesus"}
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+){0,5}$")
SYMBOLS = set(re.search(r"^Symbols: (.+?)\.$", (HERE / "TASK.md").read_text(encoding="utf-8"), re.MULTILINE | re.DOTALL).group(1).replace("\n", " ").split(", "))


def problems_of(chunk: str) -> list[str]:
    source = json.loads((HERE / "in" / f"chunk-{chunk}.json").read_text(encoding="utf-8"))
    path = HERE / "out" / f"chunk-{chunk}.json"
    if not path.exists():
        return [f"{path} does not exist"]
    try:
        ideas = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"{path} is not valid JSON: {error}"]
    if not isinstance(ideas, list):
        return [f"{path} must hold a JSON list, found {type(ideas).__name__}"]
    found = []
    if len(ideas) != len(source):
        found.append(f"{len(ideas)} entries, expected {len(source)} (one per input question)")
    for index, (want, got) in enumerate(zip(source, ideas)):
        where = f"entry {index + 1} ({want['id']})"
        if not isinstance(got, dict) or got.get("id") != want["id"]:
            found.append(f"{where}: id is {got.get('id') if isinstance(got, dict) else got!r}, expected {want['id']}")
            continue
        words = len(str(got.get("idea", "")).split())
        if not 8 <= words <= 25:
            found.append(f"{where}: idea has {words} words, expected 8 to 25")
        name, draw = str(got.get("name", "")), got.get("draw")
        if not NAME.match(name):
            found.append(f"{where}: name {name!r} is not lower-case kebab-case of at most 6 parts")
        if draw not in DRAW:
            found.append(f"{where}: draw is {draw!r}, expected one of {sorted(DRAW)}")
        if got.get("shows") not in SHOWS:
            found.append(f"{where}: shows is {got.get('shows')!r}, expected one of {sorted(SHOWS)}")
        if draw == "symbol" and name.removeprefix("symbol-") not in SYMBOLS:
            found.append(f"{where}: symbol name {name!r} is not symbol-<one of the TASK.md symbols>")
        if draw != "symbol" and name.startswith("symbol-"):
            found.append(f"{where}: name {name!r} starts with symbol- but draw is {draw!r}")
    return found


if __name__ == "__main__":
    if len(sys.argv) != 2 or not sys.argv[1].isdigit():
        sys.exit("usage: python3 check.py NNN   (the chunk number, e.g. 001)")
    problems = problems_of(sys.argv[1].zfill(3))
    print("OK" if not problems else "\n".join(problems[:60] + ([f"... and {len(problems) - 60} more"] if len(problems) > 60 else [])))
    sys.exit(1 if problems else 0)
