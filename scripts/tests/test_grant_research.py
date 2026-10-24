"""build-grant-research.py: reads made-up research through the real Grants Dashboard parser and prints JSON only."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

WEBSITE = Path(__file__).resolve().parents[2]
BUILDER = WEBSITE / "scripts" / "build-grant-research.py"
DASHBOARD = WEBSITE.parents[1] / "Websites" / "GrantsDashboard"

PROSPECTS = """# Prospects

## Local funders

| Funder | Focus | Typical amount | Deadline / cycle | 501(c)(3)? Sponsor? | Open to us now? |
|---|---|---|---|---|---|
| [Example Trust](https://example.org/apply) | Youth reading | $1,000–$5,000 | Closes 15 March 2031 | Yes — IRS letter required | ❌ No |
| [Example Trust Small Grants](https://example.org/small) | Clubs | Up to $500 | Opens 1 May 2031 | No | ✅ Yes |
| [Sample Fund](https://other.example/apply) | Bible apps | Not published | No deadline published | Unclear | Unknown |
| [Other Sample Fund](https://elsewhere.example/) | Churches | $2,000 | Rolling | Yes | No |

| Reason | Funders |
|---|---|
| Needs history | everyone |
"""
TODO = """# To-do

## Dated deadlines

- [ ] Write the letter of inquiry — [source](GRANT_PROSPECTS.md) 📅 2031-03-01
- [x] Read the guidelines

## Lead tracker

| Funder / lead | Status | Notes | Updated |
|---|---|---|---|
| Example Trust | Contacted | Called once | 2031-01-02 |
"""


def write_tree(root: Path) -> Path:
    projects = root / "Projects"
    grants = projects / "RedeemerForgeInc" / "Grants"
    grants.mkdir(parents=True)
    (grants / "GRANT_PROSPECTS.md").write_text(PROSPECTS, encoding="utf-8")
    (grants / "TODO.md").write_text(TODO, encoding="utf-8")
    (grants / "README.md").write_text("# Grants\n\nStart here. See [prospects](GRANT_PROSPECTS.md).\n", encoding="utf-8")
    bible = projects / "BibleProject" / "AppDevelopment" / "Grants"
    bible.mkdir(parents=True)
    (bible / "FREE_TECH.md").write_text("# Free tech\n\n- One\n- Two\n", encoding="utf-8")
    return projects


def run(projects: Path, dashboard: Path = DASHBOARD) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-I", "-B", "-X", "utf8", str(BUILDER), "--projects", str(projects), "--dashboard", str(dashboard)],
                          capture_output=True, text=True, encoding="utf-8", timeout=60, check=False)


needs_dashboard = pytest.mark.skipif(not (DASHBOARD / "dashboard" / "extract.py").is_file(), reason="Grants Dashboard parser not on this machine")


@needs_dashboard
def test_prints_the_research_in_its_own_words(tmp_path):
    projects = write_tree(tmp_path)
    before = sorted(p.relative_to(tmp_path) for p in tmp_path.rglob("*"))
    result = run(projects)
    assert result.returncode == 0, result.stderr
    research = json.loads(result.stdout)
    assert sorted(p.relative_to(tmp_path) for p in tmp_path.rglob("*")) == before  # writes nothing
    names = {lead["name"] for lead in research["leads"]}
    assert {"Example Trust", "Example Trust Small Grants", "Sample Fund", "Other Sample Fund"} <= names
    trust = next(lead for lead in research["leads"] if lead["name"] == "Example Trust")
    assert trust["cells"]["amount"] == "$1,000–$5,000"
    assert trust["cells"]["deadline"] == "Closes 15 March 2031"
    assert trust["open_to_us"] == "Closed" and trust["link"] == "https://example.org/apply"
    assert any(d["date"] == "2031-03-15" for d in trust["dates"])
    assert research["tracker"][0]["status"] == "Contacted"
    assert research["unclassified"] and research["unclassified"][0]["header"] == "reason|funders"


@needs_dashboard
def test_groups_only_matching_names_whose_sites_agree(tmp_path):
    research = json.loads(run(write_tree(tmp_path)).stdout)
    org = {lead["name"]: lead["org"] for lead in research["leads"]}
    assert org["Example Trust"] == org["Example Trust Small Grants"]  # prefix, same site
    assert org["Sample Fund"] != org["Other Sample Fund"]  # suffix, different sites
    assert set(research["organisations"][org["Example Trust"]]["names"]) == {"Example Trust", "Example Trust Small Grants"}


@needs_dashboard
def test_every_markdown_file_becomes_a_document_and_a_missing_one_is_named(tmp_path):
    research = json.loads(run(write_tree(tmp_path)).stdout)
    by_path = {doc["relative"]: doc for doc in research["documents"]}
    assert by_path["BibleProject/AppDevelopment/Grants/FREE_TECH.md"]["error"] is None
    assert by_path["BibleProject/AppDevelopment/Grants/FREE_TECH.md"]["group"] == "Bible Project — funding"
    missing = by_path["RedeemerForgeInc/Grants/DEEP_GRANT_HUNT.md"]
    assert missing["error"].startswith("Could not read DEEP_GRANT_HUNT.md") and missing["blocks"] == []
    assert all("lines" not in doc for doc in research["documents"])


def test_a_missing_parser_is_one_plain_line(tmp_path):
    result = run(write_tree(tmp_path), dashboard=tmp_path / "nowhere")
    assert result.returncode == 2 and result.stdout == ""
    assert result.stderr.strip().startswith("grant research: Grants Dashboard parser not found")
    assert "Traceback" not in result.stderr
