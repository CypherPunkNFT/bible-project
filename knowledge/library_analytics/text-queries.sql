-- Bind :run_id and query pipeline/pipeline.sqlite3. Generations are not additive.
-- For the complete population, use the three IDs in latest-text-bundle.json:
-- replace r.run_id=:run_id with r.run_id IN (:library_run,:reference_run,:other_run).
-- Keep catalogue/entity/Bible records distinct from held book works and prose discussions.

-- Corpus population versus processed data, with deliberate exclusions separate.
SELECT q.status,count(*) documents,sum(q.characters) characters,sum(q.blocks) blocks
FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id
WHERE r.run_id=:run_id GROUP BY q.status;

-- English alias coverage is separate from language-specific completeness.
SELECT c.language,c.coverage,count(*) documents,sum(c.accepted) literal_matches,sum(c.rejected) rejected
FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id
WHERE r.run_id=:run_id GROUP BY c.language,c.coverage;

-- Measured quality flags, rather than treating all short texts as bad scans.
SELECT j.value flag,count(*) documents
FROM document_quality q JOIN run_jobs r ON r.job_id=q.job_id,
json_each(q.metrics_json,'$.flags') j
WHERE r.run_id=:run_id GROUP BY j.value ORDER BY documents DESC;

-- Recorded structure and literal heading candidates remain different kinds.
SELECT s.kind,count(*) records,count(DISTINCT s.document_id) documents
FROM document_sections s JOIN run_jobs r ON r.job_id=s.job_id
WHERE r.run_id=:run_id GROUP BY s.kind;

-- Initial Scripture address coverage; this does not establish agreement or exposition.
SELECT l.book,l.chapter,l.reference_kind,count(*) occurrences,count(DISTINCT l.document_id) documents
FROM literal_references l JOIN run_jobs r ON r.job_id=l.job_id
WHERE r.run_id=:run_id GROUP BY l.book,l.chapter,l.reference_kind;

-- Unresolved grammar, numbering, extraction and original-markup gaps.
SELECT g.stage,g.reason,count(*) documents
FROM text_processing_gaps g JOIN run_jobs r ON r.job_id=g.job_id
WHERE r.run_id=:run_id GROUP BY g.stage,g.reason;

-- Actual failed inputs, ready for bounded follow-up without blanket retries.
SELECT j.scope,j.state,j.error,j.attempts
FROM jobs j JOIN run_jobs r ON r.job_id=j.id
WHERE r.run_id=:run_id AND j.state IN ('failed','stale');
