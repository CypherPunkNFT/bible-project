"""Write this UI task's result only after complete population/export/browser proof."""
from datetime import datetime
import json
from pathlib import Path
import shutil
from .inputs import ROOT,PROJECT,read,sha,write_json

def main():
    home=ROOT/'review';wiki=Path(PROJECT).parent/'JarvisWiki'
    pop=read(home/'completed-projection.json');snapshot=read(wiki/'wiki/projects/bible-refinement-snapshot.json')
    verified=read(wiki/'docs/shots/bible-refinement/population/export-verification.json');browser=read(wiki/'docs/shots/bible-refinement/population/browser-verification.json')
    idempotence=read(wiki/'docs/shots/bible-refinement/population/idempotence-verification.json')
    m=snapshot['projection'];generation=pop['generation']
    if not(pop['state']=='complete' and verified['state']=='passed' and verified['generation']==generation==browser['generation'] and browser['webGeneration']==m['webGeneration'] and browser['mode']=='complete pinned population' and not browser['errors'] and idempotence['state']=='passed' and idempotence['webGeneration']==m['webGeneration']):raise ValueError('Complete matching verification evidence required')
    states=[read(home/'progress.json')]
    for path in [home/'resume-launch.json',*(home/'launch-history').glob('resume-launch-*.json')]:
        if path.exists():
            value=read(path).get('committedProgressBeforeResume')
            if value:states.append(value)
    attempts={str(s.get('pid'))+'-'+s.get('startedAt',''):s for s in states}
    seconds=sum(s.get('seconds',0) for s in attempts.values())
    folder=home/generation/'operator-adapters';folder.mkdir(exist_ok=True)
    sources=[]
    for name in ['launch_review.py','review_resume.py','review_status.py','test_review_resume.py','review_handoff.py']:
        path=Path(__file__).with_name(name);h=sha(path);dest=folder/(path.stem+'-'+h+'.py')
        if not dest.exists():shutil.copyfile(path,dest)
        sources.append({'name':dest.name,'sha256':h})
    write_json(folder/'final-source-manifest.json',{'generation':generation,'semanticProcessorSha256':pop['inputContract']['processor'],'operatorFiles':sources})
    # Preserve the earlier in-progress source snapshot and append this complete
    # task snapshot rather than overwriting archived source identities.
    import hashlib
    code_files=[Path(__file__).with_name(n) for n in ['review_catalog.py','review_query.py','review_status.py','review_resume.py','review_recovery_proof.py','review_archive.py','review_handoff.py','launch_review.py','inspect_review.py','verify_review_points.py','verify_review_queries.py','test_review_catalog.py','test_review_query.py','test_review_resume.py']]
    ui_names=['wiki/_build/'+n for n in ['bible_refinement.py','verify_bible_refinement.py','verify_refinement_idempotence.py','check-bible-refinement.mjs','capture-bible-refinement.mjs','test_bible_refinement.py','test-bible-refinement.mjs','check-refinement-query-scale.mjs','refinement_browser_fixture.py']]
    ui_names+=['wiki/assets/'+n for n in ['bible-refinement.js','bible-refinement-core.js','bible-refinement.css']]
    source_map={**{'arguments/'+p.name:p for p in code_files},**{'JarvisWiki/'+n:wiki/n for n in ui_names}}
    identities=[{'name':n,'sha256':sha(p)} for n,p in sorted(source_map.items())]
    archive_id=hashlib.sha256(json.dumps(identities,sort_keys=True).encode()).hexdigest()
    archive=home/generation/'implementation'/archive_id
    for name,path in source_map.items():
        dest=archive/name;dest.parent.mkdir(parents=True,exist_ok=True)
        if dest.exists() and sha(dest)!=sha(path):raise ValueError('Changed archived task implementation')
        if not dest.exists():shutil.copyfile(path,dest)
    write_json(archive/'manifest.json',{'generation':generation,'implementationId':archive_id,'files':identities,'semanticProcessorSha256':pop['inputContract']['processor']})
    summary={'state':'completed-local-review-tab','generation':generation,'webGeneration':m['webGeneration'],'sourceRun':m['sourceRun'],'sourceRelease':m['sourceRelease'],'catalogSha256':m['catalogSha256'],
        'totals':m['totals'],'scopeRecords':m['sources'],'facetRows':m['facetRows'],'metadataBytes':verified['bytes'],'files':verified['filesVerified'],'coverage':m['coverage'],
        'populationAttempts':[{k:s.get(k) for k in ['pid','startedAt','state','seconds','completedSources','completedStatements','error']} for s in attempts.values()],
        'populationSecondsAcrossAttempts':round(seconds,2),'browserLoadMs':browser['loadMs'],'browserInitialQueryMs':browser['initialQueryMs'],'browserChecks':len(browser['checks']),
        'exportsVerified':True,'browserVerified':True,'exportIdempotenceVerified':True,'implementationId':archive_id,'semanticQualityAccepted':False,'humanOrIndependentReview':False,'newGenerationModelCalls':0,'deploymentPerformed':False,'globalLatestPromoted':False,'sharedCoordinationFilesEdited':False}
    write_json(home/'delivery.json',summary)
    text=f'''# Bible refinement review — result

Completed locally at http://127.0.0.1:8094/projects/bibleproject-refinement.html . No deployment or public Bible integration.

Pinned KR-130 run `{m['sourceRun']}`, release `{m['sourceRelease']}`; parent manifest `{m['sourceManifestSha256']}`. Catalogue metadata snapshot SHA-256 `{m['catalogSha256']}`. Projection `{generation}`; static export `{m['webGeneration']}`.

## Populated results

- `{m['sources']:,}` source records: 98,733 supported, 115,713 deferred, 3 excluded; zero-candidate XML/dictionary/index entries remain visible.
- `{m['totals']['statements']:,}` statements, `{m['totals']['qualifications']:,}` qualification witnesses and `{m['totals']['links']:,}` argument links represented by `{m['facetRows']:,}` complete source/category groups.
- Private tables: `review_documents`, `review_facets`, `review_details`, `review_meta` and the existing owned JobStore tables in `review/{generation}/review.sqlite3`.
- `{verified['filesVerified']}` static metadata files, `{verified['bytes']:,}` bytes, all hashes/sizes/allowlists checked and each asset below 25 MiB. All scope identities, per-source counts and population totals reconcile; every statement witness retains coordinates; both native-render deferrals retained.
- Existing collection mapping: `{m['coverage'].get('collectionMappedSources',0):,}` source records; catalogue tradition memberships `{m['coverage'].get('traditionMembershipSources',0):,}`; missing author labels `{m['coverage'].get('missingAuthorSources',0):,}`. Unmatched categories remain unassigned. No name/title inference.

## Working interface

Four views: source coverage, statement categories, qualification witnesses and argument links. Recorded author/source/member lookups; exact collection, tradition membership, family, genre, language, scope, source flag and candidate classification filters; attribution, uncertainty, endorsement and negation facets for statements. Category totals, stable sorting/pagination, source identities, contributor and catalogue creator roles, credits/cautions and located IDs are available in drilldowns. The browser exports every matching CSV row up to 50,000 groups; the complete immutable JSON export retains all groups. Generation-checked portable notes are browser-local and do not alter analytical truth. Semantic dimension hashes keep note keys independent of display/dictionary ordering.

The table unit is a source/category group, not an individual passage. First located metadata witnesses per group are deterministic inspection examples, not independent quality samples. No passage bodies or qualification literals are served. Qualification totals derive from verified document_results; parent role/endorsement/negation/attribution/uncertainty filters are unavailable in that view. Located exact-ID and category queries are implemented in `arguments.review_query`; actual three-type query receipts are in `point-query-verification.json`.

## Verification and runtime

34 Python argument/recovery/review checks, 4 static exporter tests, 6 navigation tests, pure JavaScript query checks, a disposable hard-exit checkpoint proof and `{len(browser['checks'])}` browser integration checks. Full-population browser load `{browser['loadMs']:,}` ms; initial metadata query/render `{browser['initialQueryMs']:,}` ms on this machine. Desktop, both themes and 390px phone layout checked. No page errors. Native gzip decompression is required; no external JavaScript services or models.

Projection runtime across recorded attempts: `{seconds:,.2f}` seconds (not the final resume's `{pop['seconds']}` seconds alone). Two transient Windows status-file replacement errors were recovered from committed checkpoints. An archived, tested adapter adds bounded retries to identical status JSON writes only. Original category logic, input contract, JobStore/checkpoint operations and global lease are unchanged. Clean-equivalent disposable recovery, idempotence, changed-input rejection and lease refusal are proved in the owned receipts. See delivery.json for attempts and identities.

## Quality limits

This task improves inspection, not extraction accuracy. Original frozen reserved attribution declined to 25/70 from baseline 28/70. Qualification scope improved to 24/33 from 0/33, protection to 42/42 from 0/42 and negation to 56/70 from 35/70. Reviewer remains implementation-agent/model-assisted, without human/independent specialist review. Existing model/prompt/version/cost metadata is retained. No new per-chunk model processing or generation API calls. All semantic outputs remain candidates; exposed evaluation cases must not be reused as a fresh test after tuning. Catholic and source cautions, unknown identities, unsupported strata and limited KR-110/120 gates remain explicit.

## Output paths

- Private projection and contracts: `{home/generation}`
- Private task delivery and recovery/query proofs: `{home}`
- Static files: `{wiki/'wiki/projects/bible-refinement'/m['webGeneration']}`
- Page: `{wiki/'wiki/projects/bibleproject-refinement.html'}`
- UI generator/scripts/styles: `JarvisWiki/wiki/_build/bible_refinement.py`, `wiki/assets/bible-refinement*.js`, `wiki/assets/bible-refinement.css`.
- Full export/browser evidence and screenshots: `JarvisWiki/docs/shots/bible-refinement/population/`.

No intake, embedding, encoder, graph/public writer, scheduler, deployment or KR-150 was started. No global latest or shared TODO/HANDOFF/NEW-CHAT-CONTEXT was edited.
'''
    (home/'REVIEW-RESULT.md').write_text(text,encoding='utf-8')
    handoff=f'''# Coordinator handoff — Bible refinement review

Task complete locally. Read REVIEW-RESULT.md, delivery.json and OPERATOR.md. Preserve the original KR-130 candidate-quality status.

## Exact coordination updates to reconcile later

For the existing shared TODO completion entry, append: “KR-130 metadata quality review tab implemented in JarvisWiki, route /projects/bibleproject-refinement.html. Full {m['sources']:,}-record scope and {m['facetRows']:,} source/category groups verified against the pinned candidate release. No extraction retuning, deployment or KR-150.” Do not create a competing backlog or mark attribution accepted.

For shared HANDOFF, append: “Review projection {generation}, web export {m['webGeneration']}, pinned release {m['sourceRelease']}. Author/source/member, collection/tradition, genre/language, scope and classification filtering; metadata-only located witnesses; portable browser-local notes. Qualified limitations and commands are in connected-research/arguments/review/OPERATOR.md. Task result is REVIEW-RESULT.md; measured evidence is delivery.json and JarvisWiki/docs/shots/bible-refinement/population/. Two Windows progress-file interruptions recovered within the same semantic generation using a bounded status-only I/O adapter.”

For NEW-CHAT-CONTEXT, append: “KR-130 candidate delivery and metadata review browser are complete locally. Semantic attribution remains unaccepted (reserved 25/70). UI reads versioned metadata exports, not passage bodies or live processes. Qualification facets are source totals; no parent-role filter. No public integration/deployment. Preserve review notes by projection/source/semantic-dimension identity. Parallel refresh integration remains a later coordinator step.”

## Shared UI changes made within this request

Narrow additions to JarvisWiki build.py (installer/palette), rail.py (Bible-only page entry), project_navigation.py (Bible page coverage), generated Bible-only navigation panels and search-index.json. Existing dirty Atlas/plan/README/HANDOFF changes were preserved; this chat did not edit shared README/HANDOFF or Bible coordination files. New page, generator, styles, scripts, focused tests and this task's documentation are the owned additions. No full-site rebuild, deployment, auth change, preview restart or new server.

Source contributor roles and catalogue creator roles stay distinct. Tradition membership is not speaker attribution. Source/category notes are not individual-record or whole-population review certification. Browser CSV cap is 50,000 groups; full exports are complete immutable shards. This processor makes no cross-generation reuse claim.

Stop here. Publication and any later extraction/refinement change require their own authorized workstream and fresh quality evaluation.
'''
    (home/'REVIEW-HANDOFF.md').write_text(handoff,encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
