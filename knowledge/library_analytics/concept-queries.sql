-- Bind :run to the selected named KR-110 generation; never sum historical runs.
SELECT disposition,language,count(*) AS documents
FROM documents WHERE run_id=:run GROUP BY disposition,language;

SELECT o.concept_id,o.basis,count(*) AS occurrences,count(DISTINCT w.document_id) AS documents
FROM concept_occurrences o JOIN windows w ON w.id=o.window_id
WHERE w.run_id=:run GROUP BY o.concept_id,o.basis;

SELECT d.author_label,d.work_id,d.edition_id,d.language,w.version_id,w.segment_ordinal,
       o.start,o.end,o.literal,o.rule_id,o.ambiguity
FROM concept_occurrences o JOIN windows w ON w.id=o.window_id
JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id
WHERE w.run_id=:run AND o.concept_id=:concept AND d.language=:language
  AND w.state!='candidate-unreviewed' AND w.kind!='document-representation'
LIMIT 100;

SELECT w.version_id,w.segment_ordinal,r.first,r.last,r.start,r.end,r.literal,r.reference_kind
FROM reference_occurrences r JOIN windows w ON w.id=r.window_id
WHERE w.run_id=:run AND r.book=:book AND r.first<=:last AND r.last>=:first
  AND w.state!='candidate-unreviewed' AND w.kind!='document-representation'
LIMIT 100;

SELECT document_id,kind,key,fingerprint,details_json FROM dependencies
WHERE run_id=:run AND kind='source' AND key=:source_path;

SELECT question_id,split,method,rank,window_id,components_json,judgment_json
FROM question_evidence WHERE run_id=:run ORDER BY question_id,method,rank;
