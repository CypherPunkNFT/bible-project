# Existing ruler material — bounded inventory

Inspected 2026-10-13. Read-only content review; no datasets or site components changed.

| Resource | Existing contribution | Use here |
| --- | --- | --- |
| `src/data/people-pages/rulers-united-kingdom.json` | Four ruler entries; selected David and Solomon fields inspected | Per-book records, referenced verdicts and qualifications guide the examples |
| `src/data/people-pages/rulers-israel.json` | Nineteen entries; selected Jeroboam I and Ahab fields inspected | Stated actions and verdict notes lead to Kings passages |
| `src/data/people-pages/rulers-judah.json` | Twenty entries; selected Rehoboam and Manasseh fields inspected | Preserve separate Kings/Chronicles records and changes within a reign |
| `src/components/people-pages/RulersGuide.tsx` | Existing timeline/guide and preview verdict labels | Guide labels are finding aids; the new text supplies fuller reading rather than redesigning them |
| Other `rulers-*.json` files | Collections for judges, surrounding kingdoms, Egypt, Persia, Rome, Herods, Assyria/Babylon | Files located, not fully audited; demonstrate that the existing collection exceeds this six-example study |
| `content/people/stories/rulers-*.json` | Existing ruler life-story sources | Files located; no new story collection commissioned and no full claim audit asserted |

## Useful distinctions already present

- Per-book `records` distinguish Kings, Chronicles and, where relevant, Samuel.
- Exact verdict fields carry passage spans; `verdictNotes` preserve exceptions, responses and additional accounts.
- `verdictTone` is a summary classification, not the whole verdict or biography.
- Reign lengths and date systems are stored separately. Scholarly chronology alternatives are not direct quotations of Scripture.
- Identifications may be marked as scripture, textual interpretation or scholarly material; retain that distinction when reusing them.

## Selected qualifications preserved

Solomon's notes retain both his early love of the LORD and later departure. Ahab's notes retain his humbling after judgment. David's notes retain the rebuke over Uriah. Manasseh's notes retain the additional capture, prayer, return and reform narrative in Chronicles. Rehoboam's records distinguish wording about Judah from wording about the king himself. Those distinctions support the accepted aim of avoiding a simple score for a reign.

The draft adds six sustained reading exercises. It does not validate every field or historical source in these collections, change verdict classifications or replace the existing ruler guide. No external identification, chronology or Josephus claim was imported.
