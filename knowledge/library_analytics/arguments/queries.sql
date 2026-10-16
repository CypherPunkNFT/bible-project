-- Always bind the exact run_id from delivered-release.json or population.json.
-- Source-author restrictions do not establish actual speaker or endorsement.
SELECT s.id,s.document_id,s.version_id,s.start,s.end,s.text,s.kind,
       s.speaker_label,s.speaker_role,s.attribution_basis,s.endorsement,
       s.negation,s.uncertainty_json
FROM statements s JOIN scope d
  ON d.run_id=s.run_id AND d.document_id=s.document_id
WHERE s.run_id=:run_id AND s.kind='objection'
  AND json_extract(d.descriptor_json,'$.author_label') LIKE '%Owen%'
ORDER BY s.id LIMIT 20;

-- A statement's actual source and available qualification witnesses.
SELECT s.id,p.coordinate,p.path,p.asset_sha256,p.block_ordinal,p.locator,
       s.start,s.end,s.text_sha256,q.kind,q.start,q.end,q.literal,q.state
FROM statements s JOIN source_spans p ON p.statement_id=s.id
LEFT JOIN qualifications q ON q.statement_id=s.id
WHERE s.run_id=:run_id AND s.id=:statement_id;

-- Structural replies, not adjudicated logical entailment or doctrine.
SELECT l.kind,l.basis,l.state,r.text reply,o.text objection,
       r.version_id,r.start reply_start,o.start objection_start
FROM argument_links l JOIN statements r ON r.id=l.source_id
JOIN statements o ON o.id=l.target_id
WHERE l.run_id=:run_id AND l.kind='reply-to-candidate'
ORDER BY l.id LIMIT 20;

-- Preserved captured contributor roles, with no author-role substitution.
SELECT c.*,json_extract(d.descriptor_json,'$.author_label') source_author_label,
       json_extract(d.descriptor_json,'$.readers') credits_and_cautions
FROM contributors c JOIN scope d
  ON d.run_id=c.run_id AND d.document_id=c.document_id
WHERE c.run_id=:run_id AND c.document_id=:document_id;

-- Located lexical query. "faith" is a literal FTS term, not an interpretation.
SELECT s.id,s.kind,s.text,s.speaker_label,s.endorsement
FROM statement_search f JOIN statements s ON s.id=f.id
WHERE statement_search MATCH 'faith' AND s.run_id=:run_id
ORDER BY length(s.text),s.id LIMIT 20;

SELECT disposition,reason,count(*) documents
FROM scope WHERE run_id=:run_id GROUP BY disposition,reason;
