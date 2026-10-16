# Existing people material — bounded inventory

Inspected 2026-10-13. Content-only review; no records or website behavior changed.

| Resource | Existing material | Reuse or explanation needed |
| --- | --- | --- |
| `data/study/people.json` | 3,133 directory rows in the inspected snapshot | Names, alternate labels, short descriptions, counts and periods provide finding aids; rows are not a certified count of distinct individual people |
| `data/study/people/{id}.json` | Individual references, family fields, descriptions and some site-written stories | Selected Ruth, Moses, Timothy and Simon records inspected; go back to cited passages for claims |
| `public/content/study/genealogy.json` | 3,130 family records in the inspected snapshot | Coverage differs from directory row count; not treated as a complete census or independently verified family history |
| `src/lib/study.ts` | Distinguishes directory fields, detail records, group flags, corrections, duplicate identifiers and site-written stories | Preserve provenance and distinguish a person from a clan/group; avoid reading an ID as a chronological fact |
| `src/pages/study/PeoplePage.tsx` | Existing directory, families, prophets, rulers and apostles; source-credit text | Reuse feature scope; its source description notes limitations, so record summaries still need checking |
| `src/components/study/GenealogyExplorer.tsx` | Relationship exploration and warning that biological/legal/adoptive relationships are not always distinguished | Add explanatory content rather than trusting a line's appearance to define its meaning |
| `src/lib/genealogy-catalog.ts` | Separate Matthew/Luke sequences and notes; projection keeps them separate | Preserve each account's wording before attempting harmonization |

## Selected findings

- Ruth's record links spouses and Obed. Her narrative explains bereavement, commitment and the household's future beyond those links.
- Moses has parent/spouse/child fields and a site-written story. Exodus 2 also requires explaining the relationship with Pharaoh's daughter; a simple parent list does not express the complete account.
- Timothy's record recognizes the unnamed father and Eunice. The accompanying narrative also needs Lois, the brethren and Paul without turning all those connections into family lines.
- Several directory entries have the name Simon. Acts 10:5–6 is a direct textual example of how to distinguish two of them.
- One inspected Simon row is described as the tanner while its stable ID is `simon-act-8-13`; do not use that ID's verse-like suffix as proof of a first occurrence or identification. A separate data audit would be needed before altering it.
- The record for Simon among Jesus' brethren contains a qualification about competing interpretations of the parent links. The draft does not inherit those parent links as an undisputed textual statement.
- Gospel notes already say that Matthew and Luke preserve listed ancestry and should not be silently conflated. Study 36 reinforces this useful existing distinction.

## Added content and remaining boundaries

The new study supplies six sustained reading exercises and explicit limits of inference. It does not introduce a replacement person database or certify all source summaries. Counts above are inventory observations only; no claim about a final count of biblical people follows from them. Later tradition, uncertain identity and interpretive relationships should remain visibly distinct from direct scriptural statements.
