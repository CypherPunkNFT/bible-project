# People corrections

[catalogue-corrections.json](catalogue-corrections.json) holds the site's own corrections to STEP Bible's list of
people ([TIPNR](../../../sources/stepbible/TIPNR.txt), CC BY 4.0). It is read by
[build-study.py](../../scripts/build-study.py) through
[people_corrections.py](../../scripts/bible/people_corrections.py) when the study data is built. STEP's licence lets
us change their data if the change is shown to readers, so every changed field is listed on the person's page data.

The problems these fix, with their evidence, are in
[INVENTORY.md](../../../Research/People/INVENTORY.md) sections 5.4 and 6.

## Keys

| Key | What it holds |
|---|---|
| `groups` | Tribes, clans and peoples: kept for family links, flagged `g` and left out of the people list. |
| `periods` | A period for people TIPNR gives no era, with `why`. |
| `fixes` | Corrections to a STEP person, by person id (below). |
| `added` | Records STEP does not have, by a new id in the same style (`sargon-isa-20-1` = Sargon, first named at Isaiah 20:1). |

## A fix

Every fix has `why` (one line) and `evidence` (a verse that shows it, e.g. `"2 Kings 15:10"`), plus any of:

| Field | Value |
|---|---|
| `brief`, `short`, `article`, `description` | A string replaces STEP's text. A list of `[old, new]` pairs edits it in place; each `old` must occur exactly once, so a newer TIPNR that changes the text stops the build instead of being silently mis-edited. `new` may be `""` to cut. |
| `period` | One of the period ids in `src/lib/people-periods.ts`. |
| `names` | `{"add": [...], "remove": [...]}` other names. |
| `refs` | `{"add": [...], "remove": [...]}` single verses, e.g. `"Jer 22:11"`. A verse moved between people is removed from one and added to the other. |
| `family` | `{"parents" / "children" / "siblings" / "partners": {"add": [ids], "remove": [ids]}}`. The link the other way round is changed too, and that person is marked as changed. |
| `same` | The id of the person this record duplicates. Both ids stay (pages link to them); the page can send readers to the other. |
| `note` | The site's own one-line note, for a reading STEP chose that others dispute. |

Ids are never removed or renamed.

## What the page data gets

In `data/study/people/<id>.json`:

| Field | Meaning |
|---|---|
| `fx` | The fields this site changed in STEP's record, in the names above (`brief`, `short`, `article`, `description`, `period`, `names`, `refs`, `family`). Absent when nothing was changed. |
| `same` | The person this record duplicates. |
| `note` | The site's note (written by the site, not STEP). |
| `added` | `1` when the whole record was written by the site, not STEP (no `fx`). |

`brief` and `period` also change the person's row in `data/study/people.json` (`b`, `p`).

## Added records

`added` entries have `why`, `evidence`, `name`, `sex` (`Male` / `Female`), `description`, `era` (TIPNR's era), `period`,
`brief`, `short`, `article`, `refs`, and optionally `names`, `tribe`, `note` and family lists (`parents`, `children`,
`siblings`, `partners`; the link back is added to the other person).
