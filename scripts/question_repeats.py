"""Find the Question Bank's repeats: the same question asked twice in different words, across or within collections.

Nothing is deleted. A repeat stays in the official bank with `repeat_of` naming the one question of its group the site
shows; the page's copy leaves repeats out (owner, 2026-10-22: "we don't have to delete repeats, but we're not going to
show repeats").

How a repeat is found:
  1. Every question is embedded with its answer by the local Qwen3-Embedding-4B daemon (127.0.0.1:8798, $0).
  2. Pairs scoring SCAN_FLOOR or higher are candidates. A pair whose question and answer are both near-identical text
     ("10" / "Ten", "Commandment" / "commandment") is a repeat outright.
  3. Every other candidate is judged "same question?" by Claude Haiku through BatchRunner, 25 pairs to a call, because
     look-alike templates ("the book after Exodus" / "after Leviticus") score as high as true repeats.
Every decision is kept in content/questions/repeats.json, so a rebuild never asks again about a pair already decided.

    python scripts/question_repeats.py prepare           # embed, find candidates, write BatchRunner items
    python scripts/question_repeats.py apply <out-dir>   # read BatchRunner's answers into repeats.json
    (then python scripts/build-question-bank.py)
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
REPEATS = WEBSITE / "content" / "questions" / "repeats.json"
WORK = WEBSITE / ".local" / "question-repeats"
EMBED_URL = "http://127.0.0.1:8798/embed"

SCAN_FLOOR = 0.85  # below this, the 2026-10-22 pilot found no repeats worth the judging
NEAR_TEXT = 0.9  # difflib ratio on normalised text, question and answer both
PAIRS_PER_CALL = 25
ANSWER_CHARS = 400

TASK = """You decide whether two quiz questions are repeats of each other.

Two questions are a REPEAT when someone who has answered one has in effect answered the other: they test the same fact
or the same teaching, even if the question is worded differently, the answer is worded differently ("10" / "Ten";
"Thou shalt not kill" / "You shall not murder"), or one answer gives more detail than the other.

They are NOT a repeat when they ask about different things, however alike they look: "Which book comes after Exodus?"
and "Which book comes after Leviticus?" are different; "Who was Jesus' earthly father?" and "What was Joseph's trade?"
are different; two questions about one story that ask about different parts of it are different.

The input lists numbered pairs, each with question A and question B. Answer for every pair: "pair" is its number as
written (p1, p2, ...) and "same" is true for a repeat, false otherwise."""

SCHEMA = {"type": "object", "properties": {"verdicts": {"type": "array", "items": {
    "type": "object", "properties": {"pair": {"type": "string"}, "same": {"type": "boolean"}},
    "required": ["pair", "same"], "additionalProperties": False}}},
    "required": ["verdicts"], "additionalProperties": False}


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def pair_key(a: str, b: str) -> str:
    return " | ".join(sorted((a, b)))


def load_repeats() -> dict:
    if REPEATS.exists():
        return json.loads(REPEATS.read_text(encoding="utf-8"))
    return {"about": "Repeat decisions for the Question Bank; written by scripts/question_repeats.py.", "pairs": {}}


def save_repeats(data: dict) -> None:
    data["pairs"] = dict(sorted(data["pairs"].items()))
    REPEATS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def mark_repeats(questions: list[dict]) -> int:
    """Give every repeat a `repeat_of` naming the question its group keeps; return how many were marked.

    Groups join every pair decided "same"; the one kept is the most useful to show: one with choices, then from a
    Baptist collection (the site's own tradition), then with a reference, then the original over a copy."""
    by_id = {q["id"]: q for q in questions}
    parent = {qid: qid for qid in by_id}

    def root(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for decision in load_repeats()["pairs"].values():
        a, b = decision["a"], decision["b"]
        if decision["same"] and a in by_id and b in by_id:
            parent[root(a)] = root(b)
    groups: dict[str, list[dict]] = {}
    for qid, q in by_id.items():
        groups.setdefault(root(qid), []).append(q)
    order = {q["id"]: n for n, q in enumerate(questions)}

    def rank(q: dict) -> tuple:
        return (bool(q.get("options")), q.get("tradition") == "Baptist", bool(q.get("reference")),
                q["source_id"] == q.get("attribution_source_id"), -order[q["id"]])

    marked = 0
    for members in groups.values():
        keep = max(members, key=rank)
        for q in members:
            q["repeat_of"] = None if q is keep else keep["id"]
            marked += q is not keep
    return marked


# --- prepare ---------------------------------------------------------------------------------------------------------

def embed(text: str) -> list[float]:
    body = json.dumps({"text": text, "kind": "document"}).encode()
    for _ in range(120):
        try:
            request = urllib.request.Request(EMBED_URL, body, {"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read())["vector"]
        except urllib.error.HTTPError as error:
            if error.code != 503:
                raise RuntimeError(f"embedding failed for {text[:60]!r}: HTTP {error.code}") from error
            time.sleep(2)  # the daemon is loading the model
    raise RuntimeError(f"the embed daemon at {EMBED_URL} stayed busy loading for 4 minutes")


def vectors_for(questions: list[dict]):
    """One unit vector per question, cached by the exact text embedded so an unchanged question is never redone."""
    import numpy as np

    cache_file = WORK / "vectors.npz"
    cache = dict(np.load(cache_file)) if cache_file.exists() else {}
    rows, fresh = [], 0
    for q in questions:
        text = f"Question: {q['question']}\nAnswer: {q['answer']}"
        key = hashlib.sha256(text.encode()).hexdigest()[:24]
        if key not in cache:
            vector = np.asarray(embed(text), dtype=np.float32)
            cache[key] = vector / np.linalg.norm(vector)
            fresh += 1
        rows.append(cache[key])
    WORK.mkdir(parents=True, exist_ok=True)
    np.savez(cache_file, **cache)
    print(f"embedded {fresh} new questions, {len(questions) - fresh} from the cache")
    return np.stack(rows)


def prepare() -> None:
    import numpy as np

    questions = json.loads(BANK.read_text(encoding="utf-8"))["questions"]
    vectors = vectors_for(questions)
    scores = vectors @ vectors.T
    first, second = np.triu_indices(len(questions), k=1)
    hits = scores[first, second] >= SCAN_FLOOR
    repeats = load_repeats()
    to_judge = []
    for a, b, score in zip(first[hits], second[hits], scores[first, second][hits]):
        qa, qb = questions[a], questions[b]
        key = pair_key(qa["id"], qb["id"])
        if key in repeats["pairs"]:
            continue
        near = all(difflib.SequenceMatcher(None, norm(qa[f]), norm(qb[f])).ratio() >= NEAR_TEXT for f in ("question", "answer"))
        if near:
            repeats["pairs"][key] = {"a": qa["id"], "b": qb["id"], "score": round(float(score), 3), "same": True, "by": "near-identical text"}
        else:
            to_judge.append((qa, qb, round(float(score), 3)))
    save_repeats(repeats)
    write_items(to_judge)
    decided = sum(1 for d in repeats["pairs"].values() if d["same"])
    print(f"candidates at {SCAN_FLOOR}+: {int(hits.sum())}; decided repeats so far: {decided}; to judge: {len(to_judge)}")


def write_items(to_judge: list[tuple[dict, dict, float]]) -> None:
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(to_judge), PAIRS_PER_CALL):
        chunk = to_judge[start:start + PAIRS_PER_CALL]
        name = f"pairs-{start // PAIRS_PER_CALL + 1:03d}"
        lines = []
        for n, (qa, qb, _) in enumerate(chunk, 1):
            lines += [f"p{n}", f"  A: {qa['question']}", f"     Answer: {qa['answer'][:ANSWER_CHARS]}",
                      f"  B: {qb['question']}", f"     Answer: {qb['answer'][:ANSWER_CHARS]}", ""]
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [[qa["id"], qb["id"], score] for qa, qb, score in chunk]
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"wrote {len(index)} BatchRunner items to {items}")


# --- apply -----------------------------------------------------------------------------------------------------------

def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    repeats = load_repeats()
    added, missing = 0, []
    for name, pairs in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        verdicts = (reply.get("structured_output") or {}).get("verdicts") or []
        same = {v["pair"]: v["same"] for v in verdicts}
        for n, (a, b, score) in enumerate(pairs, 1):
            if f"p{n}" not in same:
                missing.append(f"{name}:p{n}")
                continue
            repeats["pairs"][pair_key(a, b)] = {"a": a, "b": b, "score": score, "same": same[f"p{n}"], "by": "claude-haiku"}
            added += 1
    save_repeats(repeats)
    print(f"recorded {added} judged pairs; still undecided: {len(missing)} {missing[:10]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    else:
        apply(args.out_dir.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
