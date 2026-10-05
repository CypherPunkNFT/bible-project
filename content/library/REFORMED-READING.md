# Reformed theology and historic reading

Owner-requested expansion, 2026-10-05. Canonical inputs are JSON; this file explains the publication and its limits.

The first published reading selection contains **46 works by 30 authors, represented by 48 reading editions and 48 source-link assets**. It covers Calvin, Perkins, Owen, Sibbes, Watson, Flavel, Goodwin, Boston, Edwards, Whitefield, Newton, Spurgeon, Ryle, Charles Hodge, Warfield, Bavinck, Vos, Ursinus, Bullinger, Knox, Turretin, Witsius, Ames, Charnock, Gill, Kuyper, Machen, A. A. Hodge, Archibald Alexander and Berkhof. This is a substantial starting bibliography, not an exhaustive list or a ranking of theologians. The broader author registry also retains modern authors and provisional candidates; those records do not automatically enter this public selection.

## Where the content lives

- [publication.json](publication.json) explicitly selects every public work, edition and asset, the featured first reads and the connected topic/path. Nothing else in the collection desk becomes public because it exists or has a `published` flag.
- `catalog/works/` holds the intellectual work, author identity, subjects and `reading` recommendations. `reading.studyIds` connect historic texts to the existing Apologetics document system.
- `catalog/editions/` identifies the language, edition, extent and `textRights` of the historical text. Unknown dates remain unknown. An old text and a recent translation are different editions.
- `catalog/assets/` identifies the reading destination and the rights of that hosted file or transcription. These 48 assets are **link-only acquisitions with no local book bytes and no full-text indexing**. Public-domain underlying text does not silently grant rights to every file offered by its host.
- [../apologetics/topics/reformed.json](../apologetics/topics/reformed.json), four new study documents and [../apologetics/paths/reformed-foundations.json](../apologetics/paths/reformed-foundations.json) supply the teaching branch. The path also reuses the Scripture and grace guides. Its authored doctrine remains Westminster-based, subordinate to Scripture.

Public destinations are `/apologetics/topics/reformed`, `/apologetics/paths/reformed-foundations` and `/apologetics/texts`. The Bible reading chart remains at `/library`. Author, subject, period, language, reading-level and view filters are shareable URL parameters; results paginate in groups of 12.

## Edition findings

The public-domain assessment is scoped to the identified historic text **in the United States**, using publication evidence and the [Copyright Office's duration guidance](https://www.copyright.gov/circs/circ15a.pdf). In 2026, the relevant general cutoff for published works is before 1931. Later translations, introductions, recordings, editorial additions and host packaging need their own assessment. [CCEL's terms](https://www.ccel.org/about/copyright.html) illustrate why the underlying text and downloadable-file rights are separate.

- Calvin uses Beveridge's historic English translation; the later John Murray introduction is explicitly excluded from that public-domain claim.
- Turretin is a historic **Latin** volume, not the modern Giger/Dennison English translation.
- Ames is an early English scan with a catalogued date written into its title page; it is not the modern Eusden translation.
- Bavinck is the historic English *Philosophy of Revelation*, not a claim about modern English *Reformed Dogmatics*.
- Berkhof is the 1915 *New Testament Introduction*. His later *Systematic Theology* is not admitted by the pre-1931 rule.
- Ursinus is the catechetical prolegomena excerpt, not the complete Heidelberg commentary.
- Goodwin, Bullinger, Turretin and Witsius have explicitly partial volume holdings. Newton and Charnock retain an extent uncertainty. Hodge's three volumes count as **one work**, with three editions/holdings.
- Hodge's *What Is Darwinism?* has the historical-context role. It is not presented as current biological research.

Bibliographical identity, reading purpose, host destinations and the text/file distinction received AI-assisted review. Complete transcription collation and a full-work theological audit have **not** been claimed. Host links may change; preserve evidence and replace a failed destination with a reviewed edition rather than silently relabeling a modern edition as public domain.

## Editing and publication

1. Edit the canonical work, edition, asset or author record. Preserve stable IDs and evidence locators.
2. If adding a public work, add its IDs to all three appropriate manifest lists and connect only to published study documents. Each selected edition must have a published asset and scoped text-rights evidence. Each selected record must have a review attribution.
3. Inspect the actual changes and evidence. A changed edition, selected author, source, vocabulary or reading recommendation invalidates the publication fingerprint. Unrelated in-progress acquisitions remain outside this fingerprint and cannot break this publication.
4. Record the review explicitly, then build and check:

```powershell
node scripts/validate-library.mjs --published
npm run content -- library-review --reviewer "Name" --review-kind ai-assisted --scope "Exactly what was checked and any limits"
npm run content -- library-check
npm run content:build
npm run content:check
```

Use `--review-kind human` only for an actual human review. The review command validates relationships and permissions before recording the fingerprint. It does not research sources or approve theology on the reviewer's behalf. The full collection-desk validator remains available without `--published`.

The normal content build produces ignored `src/generated/reading-library.ts` and two public exports: `public/content/apologetics/reformed-reading.json` and `reformed-reading.md`. JSON contains the selected original records, relevant author/source entries and review fingerprint; Markdown is a readable author/title/edition/reading list. Neither export contains the books' full text. Edit JSON inputs, never the generated projections.

The Vite watcher, content tests, CI and release preparation use the same adapter. A stale review, missing edition, invalid study link or missing metadata permission blocks the build. Release preparation also compares both reading exports with the built site. The publication adapter does not write to the separate KnowledgeBase, acquire book files or start other collection missions.
