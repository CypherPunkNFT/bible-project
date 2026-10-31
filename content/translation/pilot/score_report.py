"""Unblinds the judge's scores (judge-key.json), adds the mechanical checks and the run costs, and writes RESULTS.md."""
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
NAMES = {"haiku": "Haiku", "qwen": "Local (Qwen)"}
LANGS = {"es": "Spanish", "pt": "Brazilian Portuguese"}


def judged() -> list[dict]:
    key = json.loads((HERE / "judge-key.json").read_text("utf-8"))
    kinds = {m["item"]: m["kind"] for m in json.loads((HERE / "items.json").read_text("utf-8"))}
    rows = []
    for name, order in key.items():
        path = HERE / "judge" / f"{name}.json"
        if not path.exists():
            raise SystemExit(f"{path} is missing: the judge run is not finished")
        verdict = json.loads(path.read_text("utf-8")).get("structured_output")
        if not verdict:
            raise SystemExit(f"{path} has no structured verdict")
        item, language = name.rsplit("-", 1)
        winner = {"A": order["A"], "B": order["B"]}.get(verdict["better"], "tie")
        for label in "AB":
            score = verdict[label.lower()]
            rows.append({"item": item, "kind": kinds[item], "language": language, "translator": order[label],
                         "total": score["accuracy"] + score["fluency"] + score["terminology"], **score,
                         "won": winner == order[label], "tie": winner == "tie", "reason": verdict["reason"]})
    return rows


def mean(values) -> str:
    values = list(values)
    return f"{statistics.mean(values):.1f}" if values else "–"


def local_seconds(language: str) -> tuple[float, int]:
    records = [json.loads(p.read_text("utf-8")) for p in (HERE / f"qwen-{language}").glob("*.json")]
    return max(r["seconds"] for r in records), sum(r["usage"]["completion_tokens"] for r in records)


def haiku_cost(language: str) -> float:
    lines = (HERE / f"haiku-{language}" / "_runner" / "attempts.jsonl").read_text("utf-8").splitlines()
    return sum(float(json.loads(line).get("cost") or 0) for line in lines if line.strip())


def main() -> None:
    rows = judged()
    checks = json.loads((HERE / "checks.json").read_text("utf-8"))
    out = ["# Translation pilot: Haiku and the local model, scored blind", "",
           "50 real items from every part of the site (page text, people, topics, chapter summaries, quiz questions, sources, museums, creeds, hymns, debates), "
           "translated into Spanish and Brazilian Portuguese by each translator with the same instructions. Claude Opus 5.5 scored every pair without knowing which translator was which "
           "(1 to 10 each for accuracy, fluency and Bible and doctrinal terms; 7 = publishable with small edits).", ""]
    for language, language_name in LANGS.items():
        out += [f"## {language_name}", "", "| | Accuracy | Fluency | Terms | Items won | Items scoring 7+ on all three | Mechanical problems |", "|---|---|---|---|---|---|---|"]
        for translator, name in NAMES.items():
            mine = [r for r in rows if r["language"] == language and r["translator"] == translator]
            good = sum(1 for r in mine if min(r["accuracy"], r["fluency"], r["terminology"]) >= 7)
            flagged = sum(1 for k, v in checks.items() if k.endswith(f"|{language}|{translator}") and v)
            out.append(f"| {name} | {mean(r['accuracy'] for r in mine)} | {mean(r['fluency'] for r in mine)} | {mean(r['terminology'] for r in mine)} | "
                       f"{sum(r['won'] for r in mine)} | {good} of {len(mine)} | {flagged} |")
        ties = sum(1 for r in rows if r["language"] == language and r["translator"] == "haiku" and r["tie"])
        out += ["", f"Ties: {ties}.", "", "By kind of text (average of the three scores):", "", "| Kind | Haiku | Local |", "|---|---|---|"]
        by_kind = defaultdict(lambda: defaultdict(list))
        for r in rows:
            if r["language"] == language:
                by_kind[r["kind"]][r["translator"]].append(r["total"] / 3)
        for kind, scores in by_kind.items():
            out.append(f"| {kind} | {mean(scores['haiku'])} | {mean(scores['qwen'])} |")
        out += ["", "Worst errors the reviewer found:", ""]
        worst = sorted((r for r in rows if r["language"] == language and r["errors"]), key=lambda r: r["total"])[:8]
        for r in worst:
            out.append(f"- {NAMES[r['translator']]}, {r['item']} (scored {r['accuracy']}/{r['fluency']}/{r['terminology']}): {r['errors'][0]}")
        out.append("")
    out += ["## Cost and time", ""]
    for language, language_name in LANGS.items():
        seconds, tokens = local_seconds(language)
        out.append(f"- {language_name}: Haiku ${haiku_cost(language):.3f} at list price (billed to the Max plan); local model {seconds:.0f} s for all 50 items, {tokens:,} tokens written, $0.")
    (HERE / "RESULTS.md").write_text("\n".join(out) + "\n", "utf-8", newline="\n")
    print("\n".join(out))


if __name__ == "__main__":
    main()
