-- Bind :run to one named KR-120 generation; IDs are KR-110 window IDs.
SELECT disposition,language,count(*) FROM scope WHERE run_id=:run GROUP BY disposition,language;
SELECT channel,disposition,count(*) features,sum(postings) postings
FROM feature_stats WHERE run_id=:run GROUP BY channel,disposition;

-- A single shared range is a citation association, not co-citation.
SELECT left_window,right_window,count(*) distinct_shared_ranges
FROM pair_evidence WHERE run_id=:run AND channel='reference'
GROUP BY left_window,right_window HAVING count(*)>=2;

SELECT left_window,right_window,feature,left_start,left_end,right_start,right_end,left_hash,right_hash
FROM pair_evidence WHERE run_id=:run AND channel='wording' AND left_window=:window;

-- Reverse dependencies identify affected documents. Rebuilding a changed generation
-- also recomputes feature frequencies and neighbors for previously indexed sources.
SELECT document_id,kind,key,fingerprint FROM dependencies WHERE run_id=:run AND kind=:kind AND key=:source_path;

-- The separately versioned joint stage catches rare combinations of common references.
-- Bind :joint_run from the compatible release manifest.
SELECT left_window,right_window,feature FROM joint_pairs WHERE run_id=:joint_run AND left_window=:window;
