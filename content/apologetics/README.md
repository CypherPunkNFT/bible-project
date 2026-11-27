# Apologetics document handbook

Edit the apologetics library here. These structured JSON documents are the sole authoring source for the
guides, sources, paths, comparisons, debates, conversation practice and editorial policy. The website and
downloadable reading copies are generated from them. Other Study collections are outside this migration.

Start with [the morality study](studies/morality.json) and [the editorial policy](editorial/library.json).
Each substantive explanation has a stable block ID, plain text and precise citations. You can review one
guide, all guides on a topic, or every guide using a particular source without opening a page component.

## Where content lives

`transcripts/` holds owner-supplied debate text reproduced on the site. Preserve each original `.txt` byte for byte; `index.json` records its SHA-256, receipt date, coverage counts and editorial section starts. The first entry is Lennox–Dawkins, supplied on 2026-10-11. The reader adds speaker formatting, search and navigation without correcting or abridging the supplied wording. Transcript availability is separate from a guide's documentary source link; do not infer recording alignment from the existence of a supplied copy.

| Folder | Documents | Purpose |
| --- | ---: | --- |
| `studies/` | 25 | Questions, answers, reasoning, objections, replies, limitations and Scripture passages |
| `sources/` | 35 | Authors, URLs, roles and explicit limits on how each source may be used |
| `topics/` | 7 | Topic descriptions and questions |
| `paths/` | 5 | Learning paths and their ordered study IDs |
| `worldviews/` | 2 | Comparisons with citations for both positions |
| `debates/` | 9 | Documentary summaries, transcript sources and reading questions |
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

## Article formats (plan APOLOGETICS-FIELDS step 3, 2026-11-27)

One study can take one of ten forms through `content.format`. A study **without** `format` is today's short
answer and keeps today's fields and rules exactly; the 21 articles of the six fields are written that way.
Declaring a format applies its rules, which live in
[scripts/content/formats.ts](../../scripts/content/formats.ts) (each message says what failed, what was expected
and what was found). Start one with `npm run content -- new study/<id> --title "…" --topic jesus --format essay`.

| `format` | Shown as | Needs (beyond title, topic, summary, answer, passages, related, keywords) | Counts |
|---|---|---|---|
| `short-answer` | Short answer | today's reasoning, conclusion, sections, objection, reply, limit, prompt; may add `objections[]` | 2–5 objection pairs, today's one included |
| `essay` | Long-form essay | `spine`, `parts[]` (title, blocks, passages); `limit` on the academic spine, `prompt` on scripture-theology | 3–8 parts |
| `objections` | Objections & replies | `objections[]`: `heldBy` (who makes it), the objection in their terms, a cited `reply` | 5–10 |
| `figure` | Key figure | `figure` (name, dates as the source gives them, tradition, roles, citations), `sections`, `works[]` | ≥1 work |
| `reading` | Primary-source reading | `extracts[]`: source, locator, edition, translator, text, a cited guided `note` | ≥1 |
| `timeline` | Timeline | `events[]`: date, `certainty` (exact, circa, debated, estimate), title, cited text; a debated or estimated date needs `dateNote` | 12–30 |
| `debate-guide` | Views compared | `views[]` (label, `heldBy`, texts, cited case with a named source, reply) and `common` (what all affirm) | 2–5 |
| `glossary` | Glossary | `terms[]` (term, cited definition or `siteDefinition: true`, `seeAlso` naming terms of the same glossary) | 25–60 |
| `faq` | Questions answered | `questions[]` (question, cited answer, optional `study` linking the full article) | 8–15 |
| `case-study` | Case study | `spine: "academic"`, `sections` (setting, the claim, the evidence, what survives), `limit` | ≥4 sections |

Every format may also carry `spine`, `alsoIn` (other field topics that list it), `debates` (debate IDs whose
hinge it addresses), `sections`, `conclusion`, `limit` and `prompt`; a field that belongs to another format is
refused. Missing or misplaced fields, rights and links are errors even in a draft; counts and citations warn in
a draft and block publication.

**The field page (plan step 5, 2026-11-27).** Each field page (`/apologetics/topics/<id>`) draws its articles as the
title-led article card, grouped by format, with a format filter (`?format=`) and live counts; the question library,
saved studies and "This question opens another" keep the study card. A study is listed in its own topic and in every
topic its `alsoIn` names (the hub's and the library's counts too). A topic may name its **Start here** row in
`start`: exactly three published studies of that field (its topic or `alsoIn`); the build refuses any other. No topic
sets it yet; a field step that sets it changes the topic's content, so it records a new topic review.

**Extracts quote public-domain text only (owner decision 3, 2026-11-27: any length, but the specific edition
must be verified public domain).** A source's `checked` says how its text was read, not whether it may be
quoted, so an extract also needs the source's `publicDomain` record (`edition`, `basis`) and must name exactly
that edition. A source whose role is "Scholarship · described, not quoted" can never be quoted. `publicDomain`
is register bookkeeping like `read` and `checked`: kept out of the site data, and adding it leaves studies
citing the source current.

**No page shows a declared format yet.** Until plan step 6 builds each renderer and adds it to `PAGE_READY` in
formats.ts, a study with a declared format stays a draft (publishing it fails). The compiler, the Markdown
downloads, search, the translation extractor and the app's types already carry every format.

**Depth report:** `npm run content -- depth --topic jesus` lists each article's format, words (all prose),
target from [targets.json](targets.json) (part B of the plan: 21 articles today, 95 planned), objection pairs,
citations, Baptist sources, Scripture references, debates and related studies, then the planned articles not yet
written. `--json` gives the same as data.

## Review and publish changes

1. Read `editorial/library.json`, the target guide and its cited sources. For AI review, export the relevant
   documents and request findings by document key and block ID, with the supporting source section.
2. Separate Scripture, the cited confessions (Westminster and the Baptist confession of 1689), Reformed
   exposition, narrowly scoped Catholic or patristic material, documentary accounts of other positions and
   editorial applications. Check that the cited source actually supports the claim. Citation presence alone
   proves nothing about theological accuracy. The site's own doctrinal standard is the Baptist Faith and
   Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../DOCTRINAL-FOUNDATION.md)); the confessions are cited as
   historic witnesses, and where Baptists differ from Westminster (baptism, the covenants, the church) or
   among themselves (election), the guide says so.
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
Scripture support and a Reformed teaching source (a confession or exposition; the tests require one). To add another kind, copy a document of that kind,
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

## Debate media links

Debate documents may include `transcriptCoverage` and `recording` (`url`, `label`, `credit`, `duration`, `note`). Use the transcript source document for the reading link; recording URLs must be canonical YouTube watch URLs. The page and Markdown exports show both links and known coverage limits. Match the event, participants and setting; check runtime so an excerpt is not labelled as the debate. See `docs/debate-media-2026-10-11.json` for the initial nine recordings.
