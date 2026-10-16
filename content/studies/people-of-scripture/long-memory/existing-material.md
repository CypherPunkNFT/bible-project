# Long Memory — existing content and count audit

Inspected 2026-10-13. Content-only inventory; no generated data was rebuilt.

| Resource | Inspected contribution |
| --- | --- |
| `content/long-memory.json` | Ten selected people; two passages each for words, moments and memory |
| `src/data/long-memory/index.json` | Display identities, roles, descriptions, counts and book metadata |
| `src/data/long-memory/{key}.json` | Mention IDs, curated passage IDs and verse points; all ten count summaries checked |
| `scripts/build-long-memory.mjs` | Deduplicates person-detail refs for mentions; expands inclusive selected ranges; constructs union of verse points; verifies mention count against directory |
| `src/pages/study/LongMemoryPage.tsx` | Four modes, point filtering, count labels and source/limitations text |

## Checked snapshot

| Featured person | Distinct indexed verses | Books |
| --- | --- | --- |
| Jesus | 1,160 | 27 |
| David | 964 | 28 |
| Moses | 786 | 31 |
| Aaron | 333 | 16 |
| Abraham | 275 | 27 |
| Solomon | 272 | 15 |
| Joseph | 197 | 18 |
| Joshua | 189 | 10 |
| Paul | 182 | 15 |
| Peter | 178 | 9 |

Each person's stored mention array has the displayed distinct count and represented-book count. Each also has two passages in each of the other three lenses: 60 curated selections across the ten people. This verifies stored consistency, not every upstream attribution or a top-ten ranking across the directory.

## Rules preserved in the study

- Mentions originate in person-detail references derived from TIPNR and site corrections, not a fresh literal search for an English name.
- The point dataset is a union of mentions and curated selections; its total is not automatically the mention count.
- Selected ranges include context and other speakers. They are not verse-by-verse speech-attribution datasets.
- The same passage may serve more than one purpose. Counts are not mutually exclusive totals of a life.
- The view called Remembered later includes reflection and retelling; it is not restricted to posthumous references or independently dated later compositions.
- The KJV naming issue in Hebrews 4:8 is already explained in the feature's source note.
- The current description credits STEP Bible TIPNR, CC BY 4.0, with site catalogue corrections. Retain provenance if copying source-derived data later.

## Added work

The new study adds sustained explanation and six worked readings. It preserves the existing four methods and ten-person selection. It does not commission a second chart, additional routes, replacement counts or a redesign. Expand selections only through a separately reviewed content decision, retaining the difference between an index and an editorial reading route.
