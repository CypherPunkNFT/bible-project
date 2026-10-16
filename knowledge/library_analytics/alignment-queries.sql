-- Always bind a selected completed run; generations are not additive.
SELECT chunk_state,reader_state,navigation_state,count(*) AS sections
FROM section_alignment_status WHERE run_id=:run
GROUP BY chunk_state,reader_state,navigation_state;

-- Real native headings, retained source review state, current chunk IDs.
SELECT s.version_id,s.heading,s.kind,s.state,a.chunk_state,a.reader_state
FROM section_index s JOIN section_alignment_status a USING(run_id,version_id)
WHERE s.run_id=:run AND s.kind!='document-representation'
  AND s.state!='candidate-unreviewed' AND s.heading LIKE '%'||:term||'%';

SELECT a.segment_ordinal,a.source_start,a.source_end,a.chunk_id,
       c.locator,a.chunk_start,a.chunk_end,a.state,a.method
FROM section_chunks a JOIN corpus_chunks c ON c.run_id=a.run_id AND c.id=a.chunk_id
WHERE a.run_id=:run AND a.version_id=:section
ORDER BY a.segment_ordinal,a.piece_ordinal;

-- Page/block data can be exact while URL navigation only opens the book.
SELECT r.reader_id,r.page_index,r.block_index,r.reader_start,r.reader_end,
       r.state AS location_precision,d.state AS navigation_precision,d.route,
       r.page_path,r.page_sha256
FROM section_reader_spans r JOIN section_destinations d USING(run_id,version_id,reader_id)
WHERE r.run_id=:run AND r.version_id=:section
ORDER BY r.reader_id,r.page_index,r.block_index;

SELECT target_type,method,reason,count(*) AS representations
FROM alignment_maps WHERE run_id=:run GROUP BY target_type,method,reason;

SELECT disposition,reason,count(*) AS documents
FROM alignment_scope WHERE run_id=:run GROUP BY disposition,reason;

-- Reverse lookup for a retrieval/mining chunk, without re-reading source bodies.
SELECT s.version_id,s.heading,s.kind,s.state,a.chunk_start,a.chunk_end,a.state AS alignment_precision
FROM section_chunks a JOIN section_index s USING(run_id,version_id)
WHERE a.run_id=:run AND a.chunk_id=:chunk;
