"""Owned KR-140 schema; upstream contracts are never migrated."""
VERSION='kr140-history-language-v1'
SRUN='kr101-31239794030518bcb2299a31'
ARUN='kr102-1b03f58bf6e6749f9170bf38'
SCHEMA='''
CREATE TABLE IF NOT EXISTS hl_runs(id TEXT PRIMARY KEY,contract_json TEXT,state TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS scope(run_id TEXT,scope_id TEXT,adapter TEXT,record_json TEXT,PRIMARY KEY(run_id,scope_id));
CREATE TABLE IF NOT EXISTS results(run_id TEXT,scope_id TEXT,state TEXT,counts_json TEXT,seconds REAL,PRIMARY KEY(run_id,scope_id));
CREATE TABLE IF NOT EXISTS dependencies(run_id TEXT,scope_id TEXT,path TEXT,sha256 TEXT,size INTEGER,PRIMARY KEY(run_id,scope_id,path));
CREATE INDEX IF NOT EXISTS reverse_dependencies ON dependencies(path,run_id,scope_id);
CREATE TABLE IF NOT EXISTS witnesses(id TEXT PRIMARY KEY,run_id TEXT,scope_id TEXT,resource_id TEXT,path TEXT,asset_sha256 TEXT,coordinate TEXT,locator TEXT,start INTEGER,end INTEGER,text_sha256 TEXT,text TEXT,metadata_json TEXT);
CREATE INDEX IF NOT EXISTS witnesses_scope ON witnesses(run_id,scope_id);
CREATE TABLE IF NOT EXISTS historical_links(id TEXT PRIMARY KEY,run_id TEXT,scope_id TEXT,entity_id TEXT,witness_id TEXT,basis TEXT,state TEXT,ambiguity_json TEXT,record_json TEXT);
CREATE INDEX IF NOT EXISTS history_entity ON historical_links(run_id,entity_id);
CREATE TABLE IF NOT EXISTS dates(id TEXT PRIMARY KEY,run_id TEXT,scope_id TEXT,witness_id TEXT,role TEXT,raw TEXT,state TEXT,record_json TEXT);
CREATE TABLE IF NOT EXISTS language_alignments(id TEXT PRIMARY KEY,run_id TEXT,scope_id TEXT,source_witness TEXT,target_witness TEXT,source_language TEXT,target_language TEXT,relation TEXT,state TEXT,numbering_json TEXT,credits_json TEXT,record_json TEXT);
CREATE INDEX IF NOT EXISTS languages_scope ON language_alignments(run_id,scope_id);
CREATE TABLE IF NOT EXISTS source_annotations(id TEXT PRIMARY KEY,run_id TEXT,scope_id TEXT,witness_id TEXT,source_key TEXT,annotation_json TEXT);
CREATE INDEX IF NOT EXISTS annotations_scope ON source_annotations(run_id,scope_id);
CREATE TABLE IF NOT EXISTS section_bindings(run_id TEXT,scope_id TEXT,document_id TEXT,version_id TEXT,state TEXT,record_json TEXT,PRIMARY KEY(run_id,scope_id,document_id,version_id));
CREATE TABLE IF NOT EXISTS deferrals(run_id TEXT,scope_id TEXT,reason TEXT,record_json TEXT,PRIMARY KEY(run_id,scope_id,reason));
CREATE TABLE IF NOT EXISTS evaluation_cases(id TEXT PRIMARY KEY,run_id TEXT,adapter TEXT,split TEXT,scope_id TEXT,expected_json TEXT);
CREATE INDEX IF NOT EXISTS evaluation_scope ON evaluation_cases(run_id,scope_id);
'''
CRITERIA={
 'version':VERSION,
 'historical':'Full held research citation set: explicit claim/source identities and literal source witnesses. Name occurrences are ambiguous mention candidates, never influence or endorsement.',
 'lexicon':'All pinned supported HebrewStrong.xml and LexicalIndex.xml entries: headword to source-authored definition/usage only; no verse/prose translation equivalence.',
 'oracc-json':'All registered history:02-assyrian-archives corpusjson JSON resources: native token form to recorded English guideword/sense; names preserve source IDs and are not canonical person IDs.',
 'oracc-atf':'All registered repaired ORACC HTML editions: only explicit labeled en translation groups with unique recoverable line labels. No ordinal zip or similarity matching.',
 'split':'SHA256(adapter + scope + native-key) first 8 hex modulo 5 == 0 reserved, otherwise development; repaired editions split at source level. Frozen before tuning. Existing KR/LK question splits untouched.',
 'baseline':'Historical exact raw quote search; lexicon first global substring for headword/definition; ORACC JSON unstructured guideword substring; ATF equal ordinal source/translation block pairing. Compare exact correct located evidence and explicit deferral safety.',
 'gates':{'located_precision_min':0.98,'annotation_recall_min':0.98,'false_identity_merges_max':0},
 'reviewer':'deterministic source-annotation oracle plus model-assisted implementation-agent content review; no human or independent specialist review',
 'deferrals':['semantic translation equivalence','historical influence','canonical entity disambiguation without explicit authority','dates without source role','unsupported numbering conversion','unbound KR-101/102 historical sources','specialist authenticity and competing interpretation adjudication'],
 'ownership':'Only new history_language modules and private connected-research/history-language outputs. No latest promotion.'}
SUPPLEMENT_VERSION='kr140-scripture-entities-v1'
# Frozen separately from CRITERIA so the already-frozen inputs/criteria.json stays byte-identical and
# the existing generation remains verifiable. Added 15 October 2026.
SUPPLEMENT_CRITERIA={
 'version':SUPPLEMENT_VERSION,
 'namespace':'scripture-entities',
 'scope':"Scripture's own named identities from the project's own People research only: the researched figures in Website/src/data/people-pages (rulers, prophets, apostles and the early church), the atlas pins those files reference, and the tribe records. No web acquisition, no new external source.",
 'person':'One row per researched person id. The three figures researched twice (Moses, Deborah, Samuel as both ruler and prophet) are one identity carrying both role records, never two.',
 'place':"One row per referenced atlas pin, titled by the atlas name; the research's own annotated labels are attestations, not titles. A curated reference that omits its pin is folded into the pinned row of the same name rather than becoming a second identity for the same place.",
 'people-group':'One row per tribe record. Ruler.tribe is free text and is deliberately not parsed or linked.',
 'aliases':'otherNames and a figure\'s other person records are recorded as candidates and are never used as match keys. Alias resolution is deferred to specialist review.',
 'mention_min_title_length':{'scripture-entities':4,'default':6,
  'basis':'Measured on the frozen citation quotes: at 6 the dictionary cannot reach David, Egypt, Edom, Ekron, Gaza, Tyre, Ahaz, Peter, Paul or the tribe Judah, which is most of the epigraphic evidence this source exists to connect (187 located mentions). At 4 it reaches them (278) while still excluding the two- and three-letter titles, of which Pharaoh "So" alone would match the English word "so" nine times.'},
 'identity':'Unchanged from the base criteria: no person equality is asserted, every candidate id is retained, and a title occurrence does not prove referent identity. Mentions stay candidate-ambiguous.',
 'provenance':'Every row records its research group files, their Research/People dossiers and its file-scoped citation ids. Citation ids are only unique within a group file, so group and id are stored together.',
 'deferrals':[
  'No evaluation coverage: inputs/quality-cases.json was frozen before this source existed and is not rewritten, and the located-precision/recall gates score only explicit-citation-claim links. The gates therefore say nothing about this dictionary; a passing run is not evidence that these identities are correct.',
  'The 3,130-record Website/data/study/people index is excluded: its summaries and stories are STEP Bible text its own header records as adapted from AI output, and the project research calls it a starting point, not a source.',
  "The 930 distinct scholarly and patristic citation records in the research are excluded: they are modern works of the same kind as the registry's existing historians and scholars namespaces, and registering them belongs to the registry, not to a Scripture-identity dictionary.",
  'Unpinned curated places are not given atlas coordinates by inference, and places named only by tradition keep their tradition flag.',
  'Canonical disambiguation between same-titled identities (Zechariah resolves to four researched people, Ben-hadad to three, Samaria to two atlas pins) is not attempted.'],
 'ownership':'Supplement frozen under the private inputs directory. The shared registry is read-only and is not written to.'}
