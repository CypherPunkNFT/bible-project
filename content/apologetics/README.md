# Apologetics document handbook

Edit the apologetics library here. These structured JSON documents are the sole authoring source for the
guides, sources, paths, comparisons, debates, conversation practice and editorial policy. The website and
downloadable reading copies are generated from them. Other Study collections are outside this migration.

Start with [the morality study](studies/morality.json) and [the editorial policy](editorial/library.json).
Each substantive explanation has a stable block ID, plain text and precise citations. You can review one
guide, all guides on a topic, or every guide using a particular source without opening a page component.

## Where content lives

| Folder | Documents | Purpose |
| --- | ---: | --- |
| `studies/` | 25 | Questions, answers, reasoning, objections, replies, limitations and Scripture passages |
| `sources/` | 29 | Authors, URLs, roles and explicit limits on how each source may be used |
| `topics/` | 7 | Topic descriptions and questions |
| `paths/` | 5 | Learning paths and their ordered study IDs |
| `worldviews/` | 2 | Comparisons with citations for both positions |
| `debates/` | 3 | Documentary summaries, transcript sources and reading questions |
| `practice/` | 3 | Imagined conversations, responses and supported feedback |
| `editorial/` | 1 | Doctrinal policy, conversation steps and shared editorial notices |

`schema.json` defines the format and supplies editor completion through each document's `$schema` field.
`scripture-index.json` records the 66 KJV books and verse counts. It supports reference validation without
downloading the full Bible dataset; it is not another place to author doctrine. When local Bible data is
available, the content tests compare every chapter count with the actual KJV data.

## Read and export documents

Run commands from the Website directory, after `bun install`. The tooling uses Node 22.16 or newer.
The commands below do not require a running website or a paid AI service.

```bash
npm run content -- list --kind study
npm run content -- show study/morality
npm run content -- list --topic god
npm run content -- list --source wcf
npm run content -- export --document study/morality --out .local/morality-review
npm run content -- export --topic god --out .local/god-review
npm run content -- export --source wcf --format jsonl --out .local/wcf-review
npm run content -- export --format jsonl --out .local/whole-library
```

Markdown packets contain individual reading documents, `all.md` and a membership index. They include
block IDs, source URLs and scope notes, editorial policy, review history and change fingerprints. JSONL
packets contain one complete record per line, with the original document, resolved cited sources,
editorial policy and dependency IDs. Use JSONL for lossless programmatic analysis or batch AI work.

Exports go under ignored `.local/`. Reusing a packet directory replaces the generated selection and
removes obsolete generated document files, including when changing format. Keep your own research notes
under different filenames. Add `--published` to exclude drafts. The default includes drafts for review.

Add `--include-scripture` to Markdown exports or `show` to include the cited public-domain KJV passages;
this requires the local `data/text/kjv/` files. External theological source texts are not downloaded or
copied by the exporter. Open the cited sections for a real source review and respect their licences.

## Edit a study

Open its JSON document. Keep its top-level `id` stable: routes, learning progress, saved notes and other
documents depend on it. Its filename and folder must match its ID and kind. Keep block IDs stable when
rewriting an existing thought so review findings can identify the same passage across revisions.

The editable body lives under `content`. For example:

```json
{
  "id": "answer",
  "text": "The paragraph being supported.",
  "citations": [
    { "kind": "scripture", "reference": "Romans 3:10-12" },
    { "kind": "source", "source": "wcf", "locator": "16.7" }
  ]
}
```

References use full book names or USFM codes, for example `Romans 3:10-12`, `ROM 3:10-12` or
`Isaiah 52:13-53:12`. Both endpoints must exist in KJV numbering. Cross-book arguments use separate
citations. Source citations need an existing source ID and the exact section supporting that claim.

Arrays preserve paragraph and reading order. A document's `order` controls its place within a collection.
Paths, related studies and comparisons use stable IDs rather than copying another guide's prose. Use
`npm run content -- impact source/wcf` or `impact study/morality` to see direct and indirect dependencies.

## Review and publish changes

1. Read `editorial/library.json`, the target guide and its cited sources. For AI review, export the relevant
   documents and request findings by document key and block ID, with the supporting source section.
2. Separate Scripture, subordinate Reformed exposition, narrowly scoped Catholic or patristic material,
   documentary accounts of other positions and editorial applications. Check that the cited source
   actually supports the claim. Citation presence alone proves nothing about theological accuracy.
3. Apply corrections to the JSON documents. Do not edit generated Markdown, generated TypeScript, the
   runtime adapters in `src/data/apologetics-*`, or copied paragraphs in React components.
4. Run `npm run content:audit`. It checks schema, citations, references and relationships, and reports
   stale reviews as warnings so a revision can be assessed before its review is recorded.
5. After doing the review, record its actual reviewer, type, scope and remaining limitations:

```bash
npm run content -- review study/morality --reviewer "Reviewer name" --review-kind ai-assisted --scope "Claims checked against Romans 3 and WCF 16.7" --note "Describe the checks, findings and any unresolved limits."
```

Use `--review-kind human` only for a review a human actually performed. Recording a review appends a date,
the document fingerprint and its cited-source/editorial-policy fingerprint. It is an explicit attribution,
not a service that reads sources or grants theological approval. Do not bulk refresh records to silence
warnings. Changes to the content, a cited source or the policy invalidate the affected records. Ordering
and prior review-history changes do not. The `impact` command shows broader relationships; it does not
claim that every indirectly related document's theology has changed.

6. Run the publication checks and inspect affected pages:

```bash
npm run content -- validate
npm run content:build
npm run content:check
npm run typecheck
npm run test
npm run build
npx playwright test --config e2e/apologetics.config.ts
```

`validate` and builds reject stale or missing reviews on published documents. The public website contains
published documents only; review records and local research packets are not bundled into its downloads.
The checked-in documents and their review records are part of this public source repository, so never
put private reviewer details, unpublished personal stories, access tokens or confidential notes in them.

## Add a guide or source

```bash
npm run content -- new study/new-question --title "A new question?" --topic god
npm run content -- new source/new-source --title "Source title"
```

These create drafts with empty authoring fields. Drafts are excluded from the website and public exports.
Fill the text, references, source roles and scope notes, then review the result. Change `publication` to
`published` only when ready and run the checks. A published document cannot link to a draft. A study needs
Scripture support and a Reformed teaching source. To add another kind, copy a document of that kind,
replace its ID and content, set it to draft, and clear the copied review history.

When withdrawing a document, remove or revise inbound links before changing its publication state.
The build removes obsolete document downloads as well as excluding the withdrawn content from the app.

## How the website receives content

`scripts/content/` validates the documents and compiles their published fields into
`src/generated/apologetics.ts`. Thin adapters preserve the existing frontend API and routes. Vite runs
the compiler before serving or building and watches document edits during development. Invalid edits
produce a development error overlay and prevent release builds; they do not replace valid artifacts.

The same compiler writes public Markdown documents, `library.md`, `library.json` and an index to
`public/content/apologetics/`. Each study has a download link, and the source room links to the full
Markdown and JSON collections. Both generated directories are ignored by Git. A fresh checkout generates
them automatically during build, development, typecheck or tests. Public exports are never authoring inputs.

The GitHub workflow validates and tests the document system without downloading Bible data. Local tests
also verify the real Scripture text when available. Full application and responsive browser checks remain
part of a release. Structural checks and recorded fingerprints do not replace substantive source review.
Release preparation also compares the built downloads against the current validated documents and refuses
a stale build. Its release manifest records the published collection's fingerprint.

The 2026-10-05 migration preserved all 11 previous runtime collections, including every study paragraph
and citation. Its initial records identify an AI-assisted migration and preservation check, not human
theological approval. The preceding doctrinal source pass remains recorded in those review notes.
