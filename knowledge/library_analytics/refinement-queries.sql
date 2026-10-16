-- Run against pipeline/pipeline.sqlite3; bind :run_id to the selected release.
-- Multiple generations share immutable job results. Never count the whole
-- normalized_metadata table as if it were one generation.

-- Language aliases and recovered assertions, by actual input layer.
SELECT t.layer,t.language_raw,t.language,count(*) records
FROM normalized_metadata t JOIN run_jobs r ON r.job_id=t.job_id
WHERE r.run_id=:run_id AND t.language_raw!=t.language
GROUP BY t.layer,t.language_raw,t.language ORDER BY records DESC;

-- Which structured recovery rules produced useful metadata?
SELECT t.layer,j.key recovered_field,count(*) records
FROM normalized_metadata t JOIN run_jobs r ON r.job_id=t.job_id,
json_each(t.recovery_json) j
WHERE r.run_id=:run_id GROUP BY t.layer,j.key ORDER BY records DESC;

-- All unresolved field proposals and their precise missing evidence.
SELECT t.key,t.state,t.reason,json_extract(t.result_json,'$.proposed_value') proposed_id
FROM correction_candidates t JOIN run_jobs r ON r.job_id=t.job_id
WHERE r.run_id=:run_id AND t.state!='accepted' ORDER BY t.state,t.reason;

-- Correction quantities by destination and field, not books.
SELECT json_extract(t.result_json,'$.target_layer') layer,
json_extract(t.result_json,'$.field') field,t.state,count(*) proposed_fields
FROM correction_candidates t JOIN run_jobs r ON r.job_id=t.job_id
WHERE r.run_id=:run_id GROUP BY layer,field,t.state;

-- Corpus gaps, retaining held-on-disk versus unknown provenance distinctions.
SELECT json_extract(t.result_json,'$.source_family') source,t.state,count(*) reader_records
FROM reader_reconciliation t JOIN run_jobs r ON r.job_id=t.job_id
WHERE r.run_id=:run_id GROUP BY source,t.state ORDER BY reader_records DESC;

-- Metadata defects by reason. Rows can have multiple issues.
SELECT t.layer,j.value issue,count(*) affected_records
FROM normalized_metadata t JOIN run_jobs r ON r.job_id=t.job_id,
json_each(t.issues_json) j
WHERE r.run_id=:run_id GROUP BY t.layer,j.value ORDER BY affected_records DESC;

-- Recovery and reuse history for one generation.
SELECT j.task,j.state,count(*) jobs,sum(c.rows) completed_rows
FROM run_jobs r JOIN jobs j ON j.id=r.job_id LEFT JOIN checkpoints c ON c.job_id=j.id
WHERE r.run_id=:run_id GROUP BY j.task,j.state;
