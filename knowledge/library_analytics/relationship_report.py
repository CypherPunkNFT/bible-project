"""Render the KR-120 closeout from verified runtime receipts."""
from pathlib import Path
import json
from .relationship_miner import root
from .concept_index import read

def main():
    folder=root()
    names=['population','joint-population','population-verification','quality','coverage','runtime','query-examples','release-verification','latest-relationships','idempotence-verification','query-equivalence']
    data={n:read(folder/(n+'.json')) for n in names}
    p,j,v,q,c,r,e,x,ptr,idem,equiv=[data[n] for n in names]
    assert v['ok'] and x['ok'] and idem['ok'] and equiv['ok']
    lines=['# KR-120 CPU relationship results','',
        'Completed private candidate delivery for the pinned supported snapshot. This is located lexical/reference analysis, independent of the ongoing expansion from the previously embedded 8M to the newer 11M corpus. It does not establish current whole-library coverage, quotation attribution, historical influence or semantic neighbors. No intake, encoder, scheduler, graph or public writer was started.','',
        f"Base generation: `{p['run_id']}`. Joint generation: `{j['run_id']}`. Release: `{ptr['release_id']}`.",'',
        '[Operator and reproducible commands](RELATIONSHIPS.md) · [Working SQL](relationship-queries.sql) · [Backlog](../../initiatives/library-knowledge/TODO.md)','',
        '## Population and populated tables','',
        '| Measure | Count |','| --- | ---: |']
    for label,key in [('Supported documents/XML entries','processed_documents'),('Eligible native/recorded windows','native_windows'),('Candidate/fallback windows deferred','deferred_windows'),('Windows shorter than fingerprint length','short_windows'),('Wording postings','fingerprints'),('Canonical reference postings','references_count'),('Base feature keys','feature_keys'),('Base paired evidence rows','pair_evidence'),('Frequent base features deferred','frequent_features_deferred')]:
        lines.append(f'| {label} | {p["counts"][key]:,} |')
    for key,value in j['counts'].items():lines.append(f'| Joint {key.replace("_"," ")} | {value:,} |')
    pool=read(folder/'evaluation-pool.json')
    for channel in ('wording','cocitation'):
        n=sum(s['pairs'] for s in pool['population_strata'] if s['stratum'][0]==channel)
        lines.append(f'| Distinct {channel} candidate pairs | {n:,} |')
    lines+=['','Evidence rows can repeat a pair through different features; wording and co-citation pair populations can overlap. Documents include XML entries and are not a count of independent books. The parent has 7,920,214 windows overall. Inherited scope retains 113,557 immutable-source adapter deferrals and three archive exclusions.','',
        '## Measured quality','',f"Reviewer: **{q['reviewer_type']}**. Both complete source contexts were inspected for every sampled pair. The deterministic stratified sample is not an unbiased population precision estimate. No rules were tuned on reserved pairs.",'',
        '| Channel | Useful / reviewed | Useful sample precision |','| --- | ---: | ---: |']
    for channel,m in q['metrics'].items():lines.append(f"| {channel} | {m['useful']}/{m['reviewed']} | {m['sample_useful_precision']:.2%} |")
    lines+=['','| Frozen known-pair set | Split | Recovered / known | Recall | Base-only recovery / added |','| --- | --- | ---: | ---: | --- |']
    for label,key in [('Raw overlap','raw_known_pair_recall'),('Substantive overlap','substantive_known_pair_recall'),('Co-citation','cocitation_known_pair_recall')]:
        for split,m in q[key].items():
            gain=f"{m['base_only_recovered']} / +{m['added_recoveries']}" if 'base_only_recovered' in m else 'Not a ranking-baseline comparison'
            lines.append(f"| {label} | {split} | {m['recovered']}/{m['known_pairs']} | {m['recall']:.2%} | {gain} |")
    lines+=['','The raw overlap oracle has only six seed windows and includes repeated website/copyright material; it is not 32 useful independent examples. The supplementary substantive and co-citation oracles were independently discovered and frozen before scoring. Each has 16 development and 16 reserved pairs; shared seeds, works and passages mean these are not independent statistical trials or document-disjoint splits. Recall applies only to these discovered sets, not exhaustive corpus recall. KR-110 question evaluation remains separate and its retrieval gate remains failed.','',
        'Failures and reviewed classifications:','']
    for channel,m in q['metrics'].items():lines.append(f"- **{channel}:** "+'; '.join(f'{k}: {n}' for k,n in m['classifications'].items())+'.')
    lines+=['','Co-citation review by origin:','']
    for m in q['cocitation_origin_metrics']:lines.append(f"- {m['origin']}: {m['useful']}/{m['reviewed']} useful.")
    lines+=['','The review exposed systematic limitations: generated duplicate-page/gap markers can become wording anchors; unresolved work IDs allow reprints/translations through; detached prooftext notes lack paired interpretation; and inherited reference parsing can turn a following numbered book into an extra verse. Literal span/hash verification does not validate canonical book/verse interpretation. These findings block population quotation attribution and verified canonical-reference claims. Two useful Welsh wording samples are adjacent windows of the same source relationship. Retain these failures for a future separately evaluated correction; do not retune this frozen reserved set.']
    lines+=['','## Actual located queries','',
        'From Website, use the existing venv Python with `-m knowledge.library_analytics.relationship_query --window ID --other ID` to reconstruct a pair, or `--window ID --channel wording` / `--channel cocitation` for neighbors. `--author`, `--work` and `--language` filter recorded neighbor metadata; author membership does not attribute each sentence. Neighbors examine at most 200 ranked pairs. `query-examples.json` retains complete contexts, source spans, hashes, identity cautions and actual constrained query responses.','']
    for ex in e['examples']:
        pair=ex['pair'];a,b=pair['left'],pair['right']
        lines.append(f"- **{ex['channel']}**, windows `{a['id']}` → `{b['id']}`: {a['provenance'].get('title')} → {b['provenance'].get('title')}. {ex['selection']}. {ex['review']['notes']}")
    lines+=['','The actual language constraints and impossible-author negative control passed. Reader destinations retain existing containing-book/unresolved states; no unsupported section deep links were invented.','',
        '## Integrity, dependencies and recovery','',
        f"Population verification passed: {v['paired_sources_passed']} sampled paired source reconstructions; zero invalid postings/pairs and zero missing supported documents or inconsistent window counts. Joint reference-window coverage: `{v['joint_window_coverage']}`. Location checks are not relevance judgments.",'',
        'Thirty-six focused relationship/section/job tests and five existing concept compatibility tests passed. These cover normalization and bounds, changed-input rejection, changed-population feature invalidation, atomic rollback/resume, competing owners and unchanged default JobStore behavior. Full SQL plans use indexed left/right endpoint lookup; sampled ranked results match the preserved pre-optimization SQL, including high-degree endpoints.','',
        'Actual same-generation base interruption/resume preserved 256 nonempty documents and their postings/checkpoints. Actual joint interruption after two committed batches preserved 1,250 posting-bearing windows and 20,552 postings. Completed base and joint reruns passed idempotence without changing facts/checkpoints or summaries. Production processes were not forcibly crashed; crash/transaction cases are fixtures. Source/code/config/parent/query-helper/environment dependencies bind generations, with reverse dependency lookup and atomic jobs. Changed inputs require a new generation; cross-generation selective refresh and backup restoration are **not proved**.','',
        'Completed-run idempotence signatures cover job/checkpoint membership, document results, bucket results, joint batches/buckets and summary bytes/timestamps; they do not rehash every full-population posting. Actual interrupted-run proofs additionally hash the selected committed posting subsets. Repeated export validates the immutable files and returns unchanged; independent export verification decompresses all table rows, rather than claiming a second full regeneration.','',
        '## Unresolved coverage and bounded behavior','']
    totals={k:sum(row[k] for row in c['documents']) for k in ('unresolved_work_documents','unresolved_edition_documents','unresolved_work_native_pool_documents','unresolved_edition_native_pool_documents')}
    for key,value in totals.items():lines.append(f'- {key.replace("_"," ")}: **{value:,}**.')
    lines.append(f"- Native-pool identities: `{c['native_pool_identities']}`.")
    for item in c['bounded_group_omissions']:lines.append(f"- {item['channel']} posting representatives omitted by the two-per-group bound: **{item['omitted_posting_representatives']:,}**.")
    lines.append(f"- Joint posting representatives omitted by the group bound: **{c['joint_stage']['omitted_posting_representatives']:,}**. These are feature-posting counts, not distinct omitted windows or missing pair unions.")
    lines+=['- Different original bytes do not prove independent works. Repeated editions, common Bible wording, boilerplate, apparatus, overlapping reference ranges, numbering ambiguity and language-label errors require review.',
        '- Wording uses 16-token shingles with 64-shingle winnowing; a shared normalized 79-token run wholly inside both windows guarantees an anchor. Shorter reuse, paraphrase, translation and matches crossing window boundaries can be missed. Features over 32 postings are retained but excluded from pair generation.',
        '- Joint signatures use the first 12 distinct ranges ordered by retained witness start, at most 32 postings/signature and two windows/group. Reference association does not establish agreement.',
        '- This processor selected no vector/model/build: semantic coverage is zero **for this processor**, not for the library. Existing embeddings remain intact.',
        '- Originals, source/edition identities, contributor credits, Catholic cautions, historical releases and evaluation splits remain preserved. No human or independent review, public-use approval or full-current-corpus acceptance is claimed.','',
        '## Runtime and output paths','',
        '| Measurement | Value |','| --- | ---: |',
        f"| Observed base attempt elapsed lower bound | {r['observed_attempt_seconds_lower_bound']:.1f} s |",
        f"| Document callback time sum | {r['document_processing_seconds']:.1f} s |",
        f"| Base pair callback time sum | {r['pair_processing_seconds']:.1f} s |",
        f"| Joint final attempt elapsed | {r['joint_stage_seconds_final_attempt']:.1f} s |",
        f"| Sampled peak process RSS | {r['peak_sampled_rss_bytes']:,} bytes |",
        f"| Final SQLite bytes, including calibration | {r['database_bytes']:,} |",
        f"| Independently verified release bytes | {x['total_bytes']:,} |",'',
        f"Sampled peak file sizes: `{r['sampled_peak_file_bytes']}`. {r['joint_wal_caution']}",'',
        'Runtime observations are lower bounds and sampled peaks, not continuous instrumentation. Process IO counters are not physical disk traffic. Callback sums are not total wall time; oracle discovery, review, verification and export costs are excluded. Operational profiles used different source strata and are not controlled performance comparisons.','',
        f"Private database: `{folder / 'relationships.sqlite3'}`.",'',
        f"Immutable release: `{ptr['release']}`. All {len(x['files'])} manifest files passed independent hash/size checks, and all 16 gzip table exports passed decompressed row-count checks. A repeated export must return unchanged; see `export-repeat.log`.",'',
        'Runtime receipts: `population.json`, `joint-population.json`, `coverage.json`, `runtime.json`, `quality.json`, `query-examples.json`, `population-verification.json`, `resume-verification.json`, `joint-resume-verification.json`, `idempotence-verification.json`, `query-equivalence.json`, `release-verification.json`; logs and profile/resource history remain beside them. `latest-relationships.json` selects candidate capability only. Exports are reproducible private artifacts, not a dependency-closed or off-device backup.','',
        'This completes the authorized KR-120 CPU handoff. KR-130 is the next roadmap stage and requires a new task authorization; all KR-090 and KR-110–170 tasks and the LK product/operation backlog remain in the existing ledger.','']
    manifest=read(Path(ptr['release'])/'release_manifest.json')
    lines+=['## Reproducible exported tables','','| File | Rows | Compressed bytes |','| --- | ---: | ---: |']
    for item in manifest['files']:
        if 'rows' in item:lines.append(f"| `{item['path']}` | {item['rows']:,} | {item['bytes']:,} |")
    lines.append('')
    target=Path(__file__).with_name('RELATIONSHIPS-RESULT.md');target.write_text('\n'.join(lines),'utf-8')
    print(json.dumps({'report':str(target),'quality':q['metrics'],'joint':j['counts'],'unresolved':totals,'runtime':r,'release':ptr['release'],'files':len(x['files']),'bytes':x['total_bytes']},ensure_ascii=False))

if __name__=='__main__':main()
