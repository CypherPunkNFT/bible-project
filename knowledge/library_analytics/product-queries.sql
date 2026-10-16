-- PRIVATE queries. Bind :run to the selected parent or consumer generation.
-- products.sqlite3: distinguish corpus documents from resolved work IDs.
SELECT kind,status,count(*) documents,sum(characters) characters,
 count(DISTINCT CASE WHEN work_verified THEN work_id END) known_works
FROM document_dimensions WHERE run_id=:run GROUP BY kind,status;

-- products.sqlite3: retain address roles in passage discovery, without expanding verses.
SELECT m.document_id,d.title,d.work_id,d.edition_id,m.book,m.chapter,m.verse,m.end_chapter,m.end_verse,
 m.role,m.matches,m.sample_reference_id,m.text_job_id
FROM scripture_matrix m JOIN document_dimensions d ON d.run_id=m.run_id AND d.document_id=m.document_id
WHERE m.run_id=:run AND m.book=:book AND :chapter BETWEEN m.chapter AND m.end_chapter
 AND d.kind IN ('library_text','library_review') AND m.role IN ('prose_candidate','boundary_prose_candidate')
ORDER BY m.document_id,m.chapter,m.verse;

-- products.sqlite3: recover the exact source witness from pipeline.sqlite3.
-- SELECT * FROM literal_references WHERE job_id=:text_job_id AND id=:sample_reference_id;

-- consumers.sqlite3: document-normalized collection coverage, retaining kind and role.
SELECT collection_id,kind,linked_documents,eligible_documents,document_fraction,range_address_associations
FROM collection_chapter_profiles WHERE run_id=:run AND book=:book AND chapter=:chapter AND role=:role
ORDER BY document_fraction DESC,linked_documents DESC;

-- consumers.sqlite3: provenance aliases remain inspectable.
SELECT source_channel,collection_id,rule FROM source_collection_aliases WHERE run_id=:run ORDER BY collection_id,source_channel;

-- consumers.sqlite3: collection size, known edition IDs and recorded bytes are different measures.
SELECT collection_id,documents,characters,known_works,known_editions,recorded_original_groups,source_channels
FROM collection_contribution WHERE run_id=:run AND kind IN ('library_text','library_review') ORDER BY known_works DESC;

-- products.sqlite3: keep editors, translators, assemblies and raw-label groups explicit.
SELECT i.id,i.name,i.entity_type,i.identity_basis,p.documents,p.known_works,p.languages_json,p.genres_json,
 p.roles_json,p.prose_candidate_matches,p.readable_documents
FROM contributor_profiles p JOIN contributor_identities i ON i.run_id=p.run_id AND i.id=p.contributor_id
WHERE p.run_id=:run ORDER BY p.known_works DESC,p.documents DESC;

-- consumers.sqlite3: compare terms only within the requested recorded language/genre.
SELECT group_kind,group_id,term,count,document_frequency,eligible_documents,token_fraction,tfidf,comparison_status
FROM group_vocabulary WHERE run_id=:run AND group_kind=:group_kind AND group_id=:group_id AND language=:language AND genre=:genre
ORDER BY tfidf DESC,count DESC,term;

-- products.sqlite3: any full-count term, including terms outside the top-64 exports.
SELECT d.document_id,d.title,d.language,d.genre,v.count,f.tracked_tokens,
 v.count*1.0/max(1,f.tracked_tokens) token_fraction,f.vocabulary_complete
FROM run_jobs r JOIN vocabulary_counts v ON v.job_id=r.job_id
JOIN document_features f ON f.job_id=v.job_id JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=v.document_id
WHERE r.run_id=:run AND v.term=:term ORDER BY token_fraction DESC;

-- products.sqlite3: size-constrained reuse candidates, never automatic duplicate removal.
SELECT a.title title_a,b.title title_b,c.* FROM reuse_candidates c
JOIN document_dimensions a ON a.run_id=c.run_id AND a.document_id=c.document_a
JOIN document_dimensions b ON b.run_id=c.run_id AND b.document_id=c.document_b
WHERE c.run_id=:run ORDER BY c.shared_informative_signatures DESC,c.signature_overlap DESC LIMIT 100;

-- products.sqlite3: resolve phrase/source block evidence for a candidate pair.
SELECT s.document_id,s.phrase,s.evidence_json FROM reuse_signatures s JOIN run_jobs r ON r.job_id=s.job_id
WHERE r.run_id=:run AND s.hash=:evidence_hash AND s.document_id IN (:document_a,:document_b);

-- products.sqlite3: explicit uncertainty, restricted to actual library document kinds.
SELECT source_family,language,count(*) documents,sum(NOT work_verified) unresolved_work_bindings,
 sum(quality_flags_json!='[]') quality_flagged,sum(citation_coverage LIKE '%deferred%') partial_citation_coverage
FROM document_dimensions WHERE run_id=:run AND kind IN ('library_text','library_review') AND status='completed'
GROUP BY source_family,language;

-- products.sqlite3: containing source XML, entry identity and proof state.
SELECT x.document_id,x.asset_path,x.asset_sha256,x.entry_key,x.locators_json,x.state,x.evidence_json
FROM xml_entry_links x JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=:run AND x.document_id=:document_id;

-- consumers.sqlite3: containing-book route; never interpret it as an aligned reader page.
SELECT * FROM xml_reader_links WHERE run_id=:run AND document_id=:document_id;
