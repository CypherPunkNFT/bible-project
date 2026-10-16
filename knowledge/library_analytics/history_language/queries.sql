-- Bind :run to the immutable KR-140 generation; all coordinates are representation-specific.
SELECT h.entity_id,h.basis,h.state,w.path,w.asset_sha256,w.locator,w.start,w.end,w.text,h.record_json
FROM historical_links h JOIN witnesses w ON w.id=h.witness_id
WHERE h.run_id=:run AND h.entity_id=:existing_entity_id;

SELECT a.relation,a.source_language,a.target_language,s.path,s.asset_sha256,
 s.locator source_locator,s.start source_start,s.end source_end,s.text source_text,
 t.locator target_locator,t.start target_start,t.end target_end,t.text target_text,
 a.numbering_json,a.credits_json,a.record_json
FROM language_alignments a JOIN witnesses s ON s.id=a.source_witness JOIN witnesses t ON t.id=a.target_witness
WHERE a.run_id=:run AND a.scope_id=:scope_id;

SELECT role,raw,state,record_json FROM dates WHERE run_id=:run AND scope_id=:scope_id;
SELECT * FROM section_bindings WHERE run_id=:run AND scope_id=:scope_id;
SELECT * FROM deferrals WHERE run_id=:run AND scope_id=:scope_id;
-- Dependency invalidation can locate exact owned source jobs without touching shared refresh code.
SELECT scope_id,sha256,size FROM dependencies WHERE run_id=:run AND path=:changed_path;
