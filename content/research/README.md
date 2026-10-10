# Shared research examples

Phase 2 / M04 is a local design-review collection at `/review/research`. Its authoring file is [phase-2.json](phase-2.json); its page code is [src/pages/research](../../src/pages/research/). The existing published Scholars, Apologetics and Study hubs retain their routes and data.

The collection contains two historical/manuscript cases, one Scripture-led lesson, two named editions, two individual editorial contributors and one institutional project. These produce 14 routes and six design-review page types. Paragraph citations retain the existing `source` / `scripture` distinction and exact locations. The lesson uses the existing KJV passage loader and reader links.

## Source credits and use

| Selected source | Held evidence | Presentation |
|---|---|---|
| [RINAP 3, Sennacherib 022 / Q003496](https://oracc.museum.upenn.edu/rinap/rinap3/Q003496/html) | Phase 1 `citation:BA-012`; source/extraction hashes checked again | Site-authored comparison of iii 18–49 and an unchanged quotation beginning at iii 27b. The held edition credits A. Kirk Grayson, Jamie Novotny and RINAP (2012), lemmatization by Novotny (2011), and CC BY-SA 3.0. Attribution, licence link and exact locator travel with the quotation. |
| [Codex Sinaiticus, Mark](https://codexsinaiticus.org/en/manuscript.aspx?folioNo=5&lid=en&quireNo=77&side=r) | Existing readable transcription, revision `af1633b5102cbe6200e79053cc618ac447e1bb16`; Mark 16:1–8 markers, Q.77 f.5r and closing title checked | Original bibliographic description and external links. No manuscript images or transcription body reproduced. [Project introduction](https://codexsinaiticus.org/en/codex/) supplies the manuscript date; [copyright terms](https://codexsinaiticus.org/en/copyright.aspx) distinguish the ancient object from its electronic reproduction. |

The private source paths, hashes and preserved resource identities are in `KnowledgeBase/Research Foundation/phase-2-citations.json`, outside Website Git. These are reused holdings, with no new bulk download. The central `SOURCES.md` is being edited by another chat; this scoped source ledger records the prototype's uses without overwriting that work. Consolidate this ledger into the public source directory before release.

`research-work:*` and `research-edition:*` are explicitly named prototype identities. They do not replace or silently merge the existing library catalogue. Phase 3 must reconcile/promote selected records into the library/contributor authoring systems. The `resource:*` identities are preserved from Phase 1.

## Compile and review

From Website:

```powershell
& D:\Python\python.exe -X utf8 -m knowledge.research_foundation.prototypes
```

The first compile, or a change to authored content, selected source bytes or editorial policy, requires inspection followed by `--review`. This records an **AI-assisted, limited draft review**, with no human acceptance. Do not renew that fingerprint automatically. An ordinary compile rejects missing/stale reviews. Every source is still a draft; `project_public` selects none.

The compiler validates references and Scripture ranges, verifies held sources and the literal quotation, and writes a whitelisted 24.5 KB local bundle to `design/research-phase-2/preview.json`. It also regenerates `../Pages/Research Examples/CONTENT.md` and private verification records. Generated preview data is ignored by Git and served through the existing local Vite preview's `/mockups/` middleware. It is not copied into `dist/`; non-loopback hosts render Not Found before requesting draft data.

```powershell
& D:\Python\python.exe -X utf8 -m unittest knowledge.research_foundation.test_foundation knowledge.research_foundation.test_prototypes
node node_modules/vitest/vitest.mjs run src/pages/research/model.test.ts
node scripts/design-review/research-journeys.mjs
bun run review:inventory
$env:ONLY = 'research-landing,research-catalogue,research-case,research-source,research-contributor,research-lesson'
$env:FRESH = '1'
bun run review:checks
bun run review:shots
```

Build the current site before browser checks. On this Windows host SWC rejected the default AppData cache permissions; a build-scoped `SWC_NATIVE_BINDING_CACHE=C:\Users\lcladm\.cache\swc-bible-project` worked without changing filesystem permissions or package versions. It is not a committed environment setting.

The design board lists these six types with screenshots and machine checks. Only the owner records acceptance. This phase prepares the experience for review; it does not deploy or claim that the twelve-package pilot is complete.
