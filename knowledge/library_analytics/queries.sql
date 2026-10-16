-- All queries target the private analytics.sqlite3, never the live corpus.

-- 1. Which source families add the most unique recorded bodies?
SELECT source_family,held_body_recorded_hashes,hashes_unique_to_source,
       hashes_shared_with_other_sources,
       round(100.0*hashes_unique_to_source/nullif(held_body_recorded_hashes,0),1) unique_percent
FROM source_complementarity ORDER BY hashes_unique_to_source DESC;

-- 2. Which sources overlap, and by what fraction of the smaller source?
SELECT o.source_a,o.source_b,o.shared_recorded_hashes,
       round(100.0*o.shared_recorded_hashes/
         min(a.held_body_recorded_hashes,b.held_body_recorded_hashes),1) smaller_source_overlap_percent
FROM source_overlap o JOIN source_complementarity a ON a.source_family=o.source_a
JOIN source_complementarity b ON b.source_family=o.source_b
ORDER BY shared_recorded_hashes DESC;

-- 3. Which declared readable texts are not represented by a same-hash library_text document?
-- Absence here means this join did not match; it does not prove absent content.
SELECT reader_id,title,source_family,availability,corpus_matches,corpus_text_matches,match_state,reader_route
FROM reader_crosswalk WHERE readable_declared=1 AND corpus_text_matches=0
ORDER BY source_family,title;

-- 4. Where would a metadata repair affect the most distinct recorded originals?
SELECT layer,source_family,issue,priority,records,recorded_byte_groups
FROM repair_summary ORDER BY priority DESC,recorded_byte_groups DESC;

-- 5. Which named contributors have large catalogue shelves but few readable records?
SELECT id,name,side,reader_records,readable_records,
       round(100.0*readable_records/nullif(reader_records,0),1) readable_percent
FROM contributor_coverage WHERE reader_records>=10
ORDER BY reader_records-readable_records DESC;

-- 6. Which possible multi-edition titles merit review? No automatic merges.
SELECT layer,example_title,example_author,language,records,original_byte_groups,known_work_ids
FROM title_author_candidates ORDER BY original_byte_groups DESC LIMIT 100;

-- 7. Which source types lack recorded Scripture references?
-- Existing references only: this query cannot establish absence of citations in text.
SELECT source_family,kind,documents,documents_with_recorded_references,recorded_references
FROM recorded_reference_coverage WHERE kind='library_text'
ORDER BY documents-documents_with_recorded_references DESC;

-- 8. Exactly which identity fields disagree between same-byte corpus and reader records?
SELECT * FROM corpus_reader_identity_differences LIMIT 100;
