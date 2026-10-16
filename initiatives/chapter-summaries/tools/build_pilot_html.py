"""Write claude-pilot/report.html: every pilot draft as a reader sees it, with its blind-review critique
(verdict, scores, every issue quoted). Revised chapters show the first draft, its critique, the revision and
its re-review. Built only from saved artifacts; no model calls. Open the file in a browser.

  python initiatives/chapter-summaries/tools/build_pilot_html.py
"""
from __future__ import annotations

import json
from html import escape
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
PILOT = SITE / ".local" / "chapter-summary-studio" / "claude-pilot"
SET_NAMES = {"claude": "Claude", "qwen-same": "Qwen, same packet", "qwen-round-3": "Qwen round 3 (preserved)",
             "qwen-round-2": "Qwen round 2 (preserved)"}
RUNS = [("sample-1", "Sample run: 48 unseen chapters at full-run settings",
         "Writer prompt v3, 200-word limit, 8 Claude writers in parallel. Flagged chapters were revised from their critique "
         "and re-reviewed by a fresh reviewer; both versions are shown.", ["sample-1-rev2", "sample-1-rev"]),
        ("fresh-1", "Fresh chapters: Claude vs Qwen on identical packets",
         "Eight chapters not used in development. Both writers got the same verses, prompt (v2) and checks.", []),
        ("dev-1", "Development chapters: Claude vs Qwen",
         "The eight chapters used in the earlier Qwen rounds. Claude and Qwen wrote from the same packets; Qwen's preserved "
         "round-3 draft (round 2 for Genesis 5) is included.", []),
        ("dev-2", "Development chapters: Claude with prompt v2", "Same packets as dev-1; only the writer prompt changed.", [])]
CSS = """body{font:17px/1.6 system-ui;margin:auto;padding:40px 24px;max-width:1050px;color:#25342c;background:#faf9f4}
h1,h2,h3,h4{line-height:1.25}h1{font-size:38px}table{border-collapse:collapse;width:100%;font-size:14px}
td,th{border:1px solid #cbd4cc;padding:8px;text-align:left;vertical-align:top}
details{background:#fff;border:1px solid #d5dcd4;padding:14px 18px;margin:10px 0;border-radius:8px}
summary{cursor:pointer;font-weight:600}.note{border-left:4px solid #886a27;padding:12px 20px;background:#f5efd9}
.small{font-size:14px;color:#526052}a{color:#246149}section{margin:44px 0}li{margin:6px 0}
.draft{border:1px solid #e3e7df;border-radius:8px;padding:14px 18px;margin:14px 0;background:#fdfdfa}
.pass{color:#2f6b45;font-weight:600}.revise{color:#9a3d22;font-weight:600}.mat{background:#fbeee8}
.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:#e8eee4;margin-left:6px}
.wrap{overflow-x:auto}"""


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def verdict_html(verdict: str | None) -> str:
    if not verdict:
        return '<span class="small">not reviewed</span>'
    return f'<span class="{"pass" if verdict.startswith("no material") else "revise"}">{escape(verdict)}</span>'


def draft_html(draft: dict, heading: str, review: dict | None) -> str:
    refs = ", ".join(f"{r['chapter']}:{r['verse_start']}–{r['verse_end']}" for r in draft["context_references"])
    parts = [f'<div class="draft"><h4>{escape(heading)} — {verdict_html(review and review.get("verdict"))}'
             f'<span class="tag">{len(draft["summary"].split())} words</span></h4>',
             f'<p><strong>{escape(draft["title"])}</strong></p>']
    if draft["context"]:
        parts.append(f'<p class="small"><em>Context ({escape(refs)}):</em> {escape(draft["context"])}</p>')
    parts.append(f'<p>{escape(draft["summary"])}</p><ol class="small">')
    parts += [f'<li><strong>{o["verse_start"]}–{o["verse_end"]} {escape(o["heading"])}</strong> — {escape(o["text"])}</li>'
              for o in draft["outline"]]
    parts.append(f'</ol><p class="small"><em>Invitation:</em> {escape(draft["invitation"])}</p>')
    if review:
        scores = review.get("scores", {})
        parts.append(f'<p class="small"><strong>Critique</strong> · score {sum(scores.values())}/16 '
                     f'({", ".join(f"{k} {v}" for k, v in scores.items())})</p>')
        if review.get("note"):
            parts.append(f'<p class="small">{escape(review["note"])}</p>')
        if review.get("issues"):
            parts.append('<div class="wrap"><table><tr><th>Severity</th><th>Category</th><th>Where</th><th>Quoted</th>'
                         '<th>Verses</th><th>Why</th></tr>')
            for i in sorted(review["issues"], key=lambda x: x["severity"] != "material"):
                parts.append(f'<tr class="{"mat" if i["severity"] == "material" else ""}"><td>{escape(i["severity"])}</td>'
                             f'<td>{escape(i["category"])}</td><td>{escape(i["field"])}</td><td>“{escape(i["quote"])}”</td>'
                             f'<td>{escape(str(i["verses"]))}</td><td>{escape(i["explanation"])}</td></tr>')
            parts.append("</table></div>")
        else:
            parts.append('<p class="small">No issues listed.</p>')
    parts.append("</div>")
    return "".join(parts)


def reviewed_drafts(run: Path, chapter: str) -> list[tuple[str, dict, dict | None]]:
    key_path = run / "blind-review" / "KEY-do-not-open-during-review.json"
    labels = load(key_path)["chapters"].get(chapter, {}) if key_path.exists() else {}
    review_path = run / "blind-review" / "reviews" / f"{chapter}.json"
    reviews = load(review_path)["drafts"] if review_path.exists() else {}
    if not labels and (run / chapter / "draft.json").exists():
        labels = {"A": {"set": "claude", "path": str((run / chapter / "draft.json").relative_to(SITE))}}
    order = list(SET_NAMES)
    return [(SET_NAMES.get(m["set"], m["set"]), load(SITE / m["path"]), reviews.get(label))
            for label, m in sorted(labels.items(), key=lambda kv: order.index(kv[1]["set"]) if kv[1]["set"] in order else 9)]


def run_section(run_id: str, title: str, blurb: str, revision_runs: list[str]) -> str:
    run = PILOT / run_id
    results = load(run / "blind-review" / "results.json")["by_set"] if (run / "blind-review" / "results.json").exists() else {}
    out = [f'<section id="{run_id}"><h2>{escape(title)}</h2><p>{escape(blurb)}</p>']
    if results:
        out.append('<div class="wrap"><table><tr><th>Writer</th><th>Drafts</th><th>No material issue (first review)</th>'
                   '<th>Material issues</th><th>Mean score /16</th><th>Mean words</th></tr>')
        for name, s in results.items():
            out.append(f'<tr><td>{escape(SET_NAMES.get(name, name))}</td><td>{s["drafts"]}</td><td>{s["no_material_issue_found"]}</td>'
                       f'<td>{s["material_issues"]}</td><td>{s["mean_score_of_16"]}</td><td>{s["mean_summary_words"]}</td></tr>')
        out.append("</table></div>")
    for chapter in sorted(p.name for p in run.iterdir() if (p / "sources.json").exists()):
        drafts = reviewed_drafts(run, chapter)
        revision = next(((r, d) for r in revision_runs for d in reviewed_drafts(PILOT / r, chapter)), None)
        final = revision[1][2] if revision else (drafts[0][2] if drafts else None)
        label = verdict_html(final and final.get("verdict"))
        out.append(f'<details><summary>{escape(chapter)} — {label}{"<span class=tag>revised</span>" if revision else ""}</summary>')
        if revision:
            out.append(draft_html(revision[1][1], f"Revised draft ({revision[0]})", revision[1][2]))
        for heading, draft, review in drafts:
            out.append(draft_html(draft, heading + (" — first draft" if revision else ""), review))
        out.append("</details>")
    out.append("</section>")
    return "".join(out)


def main() -> None:
    body = ['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,'
            'initial-scale=1"><title>Claude chapter-summary pilot</title><style>' + CSS + '</style>',
            '<h1>Claude chapter-summary pilot</h1>',
            '<p>Every draft from the 2026-10-13 pilot as a reader sees it, with its critique. Each chapter opens to show '
            'the draft, its score, and every issue quoted against the BSB verses. Material issues are shaded.</p>',
            '<p class="note">Critiques were written by Claude reviewer agents working blind (drafts labelled A/B/C, writer '
            'hidden), not by people. “No material issue found” records one inspection, not approval. Nothing here is '
            'approved or published.</p><p>' + " · ".join(f'<a href="#{r[0]}">{escape(r[1].split(":")[0])}</a>' for r in RUNS) + "</p>"]
    body += [run_section(*r) for r in RUNS if (PILOT / r[0]).exists()]
    (PILOT / "report.html").write_text("".join(body) + "</html>\n", encoding="utf-8")
    print(f"Wrote {PILOT / 'report.html'}")


if __name__ == "__main__":
    main()
