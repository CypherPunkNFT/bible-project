# Translating Bible Guide

The site is to be translated into every modern language it has a Bible in, starting with Spanish and Brazilian
Portuguese (owner, 2026-10-31). Owner's rules: **translate everything** (creeds, hymns and debate transcripts too),
publish **without a native-speaker review**, and show **no machine-translation notice**. The language button sits in the
header between Contact and Search ([LanguageMenu.tsx](../../src/components/LanguageMenu.tsx)); it shows only on this
computer's preview until a translation is published.

## The full run (from 2026-10-31)

Haiku translates the site in Claude Code cloud sessions, paid from the owner's cloud credit, in its own private
repository: [CypherPunkNFT/site-translation](https://github.com/CypherPunkNFT/site-translation), checked out at
[SiteTranslation/](../../../SiteTranslation/). [extract.py](extract.py) writes the English into it: 819 chunks, 3.0
million words, every unique string once per kind of content. Its `SOURCES` list says which fields of which data files
are translated. Scripture quotations are left out (each language's Bible fills them by reference), and so are book
titles, authors, licences and catalogue metadata. Not in yet: text written into the page code, which first has to move
into string files. The import step will walk the same `SOURCES` and swap each English string for its translation.

## The pilot (2026-10-31)

[pilot/](pilot/) compared Haiku with the local model (HyperQwen) on 50 real items from every part of the site, in both
languages, scored blind by Claude Opus 5.5. Results: [pilot/RESULTS.md](pilot/RESULTS.md). Haiku won 43 of 50 items in
each language, and 45–46 of 50 scored publishable on accuracy, fluency and doctrinal terms, against 26–28 for the local model.

How it was run: [pick_items.py](pilot/pick_items.py) picks the items; the translator instructions are
[task-es.txt](pilot/task-es.txt) and [task-pt.txt](pilot/task-pt.txt); Haiku ran through BatchRunner, the local model
through [run_local.py](pilot/run_local.py); [prepare_judging.py](pilot/prepare_judging.py) checks and blinds;
[task-judge.txt](pilot/task-judge.txt) is the reviewer's brief; [score_report.py](pilot/score_report.py) writes the results.
