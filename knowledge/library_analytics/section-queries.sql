-- Bind :run from connected-research/latest-sections.json. Generations overlap.
-- Counts describe documents/sections, never independently acquired books.

SELECT adapter,disposition,reason,count(*) documents
FROM research_scope WHERE run_id=:run GROUP BY adapter,disposition,reason;

SELECT s.kind,s.state,count(*) sections
FROM sections s JOIN run_sections r ON r.version_id=s.version_id
WHERE r.run_id=:run GROUP BY s.kind,s.state;

-- Inspect a document's real hierarchy and versioned source coordinates.
WITH RECURSIVE tree(version_id,depth) AS (
 SELECT s.version_id,0 FROM sections s JOIN run_sections r ON r.version_id=s.version_id
 WHERE r.run_id=:run AND s.document_id=:document AND s.parent_version_id IS NULL
 UNION ALL
 SELECT c.version_id,p.depth+1 FROM sections c JOIN tree p ON c.parent_version_id=p.version_id
 JOIN run_sections r ON r.version_id=c.version_id WHERE r.run_id=:run
)
SELECT t.depth,s.version_id,s.kind,s.heading,s.state,g.coordinate,g.locator,
 g.block_ordinal,g.start,g.end,g.span_sha256
FROM tree t JOIN sections s ON s.version_id=t.version_id
JOIN section_segments g ON g.version_id=s.version_id
ORDER BY s.native_key,g.ordinal;

-- Explicit gaps: native/cache mismatch, no internal boundaries, page coordinates.
SELECT j.value gap,count(*) documents FROM research_documents d,json_each(d.gaps_json) j
WHERE d.run_id=:run GROUP BY j.value ORDER BY documents DESC;

-- Source-aware located heading search; author is a recorded label, not resolved
-- speaker attribution. This is a literal search, not semantic ranking.
SELECT s.heading,s.kind,s.state,s.version_id,q.document_id,
 json_extract(q.descriptor_json,'$.title') title,
 json_extract(q.descriptor_json,'$.author_label') recorded_author,
 json_extract(q.descriptor_json,'$.source_family') source_family
FROM sections s JOIN run_sections r ON r.version_id=s.version_id
JOIN research_scope q ON q.run_id=r.run_id AND q.document_id=s.document_id
WHERE r.run_id=:run AND s.kind!='document-representation' AND s.heading LIKE :pattern;
