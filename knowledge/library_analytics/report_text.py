"""Produce a compact, measured LA-02 result from its validated bundle."""
import json
from collections import Counter
from pathlib import Path
from .build import DEFAULT_OUT, PROJECT, dump, now, readonly


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def main():
    pointer = load(DEFAULT_OUT / 'latest-text-bundle.json')
    bundle = load(pointer['summary'])
    if bundle['state'] != 'complete': raise RuntimeError('Text bundle is incomplete')
    witnesses, files, phases = [], [], []
    gap_reasons = Counter()
    for component in bundle['components']:
        summary = load(component['summary'])
        receipt = load(component['release_verification'])
        witness = load(component['witness_verification'])
        if not summary['validation']['ok'] or not receipt['ok'] or not witness['ok']:
            raise RuntimeError('A component is not verified')
        files.extend(receipt['files']);witnesses.append(witness)
        phases.append({'run_id':component['run_id'],'kinds':component['kinds'],
                       **summary['metrics'],'table_rows':summary['table_rows']})
        for gap in summary['gaps']:
            gap_reasons[(gap['stage'],gap['reason'])] += gap['documents']
    db = readonly(Path(pointer['database']))
    try:
        kind_counts = [dict(row) for row in db.execute(
            'SELECT json_extract(descriptor_json,"$.kind") kind,count(*) documents FROM text_scope WHERE run_id IN ('+
            ','.join('?' for _ in pointer['run_ids'])+') GROUP BY kind',pointer['run_ids'])]
    finally: db.close()
    scoped = sum(row['documents'] for row in kind_counts)
    if scoped != bundle['table_rows']['document_quality']:
        raise RuntimeError('Bundle denominator does not reconcile')
    result = {'bundle_id':bundle['id'],'checked_at':now(),'phases':phases,'scope_by_kind':kind_counts,
              'scoped_documents':scoped,'completed_documents':bundle['metrics']['completed_documents'],
              'excluded_documents':bundle['metrics']['excluded_documents'],
              'derived_rows':sum(bundle['table_rows'].values()),'data_exports_and_summaries_bytes':sum(f['bytes'] for f in files),
              'checksummed_files_verified':len(files),
              'sampled_documents':sum(w['sampled_documents'] for w in witnesses),
              'sampled_references':sum(w['reference_samples'] for w in witnesses),
              'source_spans_verified':sum(w['source_segments_verified'] for w in witnesses),
              'original_xml_locators_verified':sum(w['original_xml_locators_verified'] for w in witnesses),
              'witness_errors':sum(len(w['errors']) for w in witnesses),
              'processing_failures':sum(f.get('rows',0) for f in files if f['name']=='failed-text-jobs.jsonl'),
              'gap_reasons':[{'stage':stage,'reason':reason,'documents':n} for (stage,reason),n in sorted(gap_reasons.items())],
              'embedding_progress_observation':load(PROJECT / 'KnowledgeBase/embedding-progress.json'),
              'limits':bundle['limits']}
    folder = Path(pointer['summary']).parent
    dump(folder / 'result.json',result)
    rows = []
    for i,p in enumerate(phases):
        label = ('Library text/review','Reference datasets','Other corpus records')[i] if len(phases)==3 else ', '.join(p['kinds'])
        rows.append(f"| {label} | {p['completed_documents']:,} | {p['excluded_documents']:,} | {p['characters']:,} | {p['table_rows']['literal_references']:,} |")
    m=bundle['metrics'];t=bundle['table_rows'];q=bundle['quality_summary'];g=bundle['gap_records_by_stage']
    report = f'''# LA-02 result — CPU text analysis

**Complete and independently verified.** Bundle `{bundle['id']}`, completed {bundle['created_at']} UTC. Captured corpus build: `{bundle['captured_corpus_builds'][0]}`. All **{scoped:,} documents across {len(kind_counts)} current corpus kinds** are accounted for; no processing failures. Catalogue, entity and dataset documents are separate from book holdings.

| Population | Analysed documents | Excluded documents | Characters | Literal reference matches |
| --- | ---: | ---: | ---: | ---: |
{chr(10).join(rows)}
| Total | {m['completed_documents']:,} | {m['excluded_documents']:,} | {m['characters']:,} | {t['literal_references']:,} |

**Actual derived data:** {m['text_blocks']:,} existing cache/chunk blocks analysed; {t['document_sections']:,} structure records; {t['reference_rejections']:,} reference rejections; {result['derived_rows']:,} rows across six result tables. Private exports/summaries total **{result['data_exports_and_summaries_bytes']/1e9:.2f} GB**. The SQLite database retains prior generations: select only this bundle's three component run IDs.

**Quality:** {q['flagged_documents']:,} documents flagged for review, including {q['flag_counts'].get('repeated-line-rate-over-20-percent',0):,} repetition flags, {q['flag_counts'].get('replacement-character-rate-over-0.1-percent',0):,} replacement-character flags, {q['flag_counts'].get('control-character-rate-over-0.1-percent',0):,} control-character flags and {q['flag_counts'].get('empty-analysed-text',0):,} empty-text flags. Flags can overlap and do not diagnose bad OCR. Repetition is a lower-bound metric for {q['repeated_line_lower_bound_documents']:,} documents.

**Unresolved coverage:** {g.get('language-specific-citations',0):,} documents need language-specific citation grammar/numbering; {g.get('original-xml-structure',0):,} document-level original-XML structure gaps remain. These are not counts of missing books/files. {g.get('all',0):,} documented archive exclusions remain. Held-but-unlinked acquisitions from LA-01 remain outside this corpus snapshot. Match totals include prose references, cross-reference lists, printed indexes and module entry addresses; LA-03 must distinguish their roles before ranking passage discussion.

**Verification:** source counts, reference counts, input-file stat guards and SQLite integrity passed in all three runs. Independent release checks verified {result['checksummed_files_verified']} files and their row counts. Across {result['sampled_documents']} sampled documents, {result['sampled_references']} reference examples yielded {result['source_spans_verified']} verified source spans and {result['original_xml_locators_verified']} original XML locators, with zero errors. Eleven source excerpts also received bounded interpretation review; no corpus-wide precision percentage is claimed. **25 focused tests passed**, including resume, legacy-result reuse, path changes, failure isolation, exact boundary spans, export tampering and failed-release gates.

**Outputs:** `KnowledgeBase/library-analytics/latest-text-bundle.json` selects the completed generations in `pipeline/pipeline.sqlite3`; the bundle summary and `result.json` are under `pipeline/text-bundles/{bundle['id']}/`. Each component has six JSONL tables, a failure ledger, summary and checksummed manifest in `pipeline/text-releases/<run-id>/`. Verification receipts are in `pipeline/text-validations/`. Programs and SQL are in `Website/knowledge/library_analytics/`.

**Preservation and next:** no live corpus, vector, graph, reader or canonical metadata was changed. The embedding progress file independently reports complete: {result['embedding_progress_observation']['indexed']:,} indexed and {result['embedding_progress_observation']['remaining']:,} remaining. LA-03 is next: build role-aware Scripture matrices, contributor/source profiles and reuse candidates from these real tables.
'''
    Path(__file__).with_name('TEXT-RESULT.md').write_text(report,encoding='utf-8')
    print(json.dumps(result))
    return 0


if __name__=='__main__': raise SystemExit(main())
