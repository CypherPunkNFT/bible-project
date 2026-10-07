"""Read-only original/derivative reconciliation for the first eight missions.

Writes metadata only. It cannot import, embed, release the post-RB14 gate or
silently convert a mission-level theological decision into unrestricted intake.
"""
import hashlib
import json
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
ROOT=SITE/'content/library/reports/reformed-baptist-overnight'
OUT=ROOT/'RB01-RB08'
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def write(name,x):
    OUT.mkdir(parents=True,exist_ok=True)
    t=x.rstrip()+'\n' if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2)+'\n'
    (OUT/name).write_text(t,encoding='utf-8',newline='\n')

def main():
    files=[];components=[];inputs=[];missions=[];checks=[]
    for n in range(1,9):
        mission=f'RB{n:02}';folder=ROOT/mission
        manifest=read(folder/'acquisition-manifest.json')
        scopes=read(folder/'intake-scope.json')['files']
        scope_by={x['assetId']:x for x in scopes}
        assert len(scope_by)==len(manifest['files'])
        for name in ['acquisition-manifest.json','intake-scope.json','selected-components.json','fuller-components.json',
          'identity-corrections.json','INTAKE-NOTES.md','source-exceptions.json','checkpoint.json']:
            p=folder/name
            if p.exists():inputs.append(dict(path=p.relative_to(SITE).as_posix(),sha256=sha(p.read_bytes())))
        for a in manifest['files']:
            p=(SOURCES/a['relativePath']).resolve()
            assert p.is_relative_to(SOURCES.resolve())
            raw=p.read_bytes();assert sha(raw)==a['sha256'] and len(raw)==a['byteCount']
            d=a.get('derivedText')
            if d:assert sha((SITE/d['path']).read_bytes())==d['sha256']
            scope=scope_by[a['assetId']]
            record=dict(a,mission=mission,
                missionManifest=(folder/'acquisition-manifest.json').relative_to(SITE).as_posix(),
                scopeManifest=(folder/'intake-scope.json').relative_to(SITE).as_posix(),
                missionScope=scope,aggregateDisposition='prepared-for-scope-rights-and-deduplication-reconciliation',
                canImportWithoutFurtherReview=False,aggregateIngested=False,aggregateEmbedded=False)
            files.append(record)
            checks.append(dict(kind='immutable-original-and-derivative',mission=mission,assetId=a['assetId'],passed=True))
        cs=[]
        for name in ['selected-components.json','fuller-components.json']:
            p=folder/name
            if not p.exists():continue
            for c in read(p)['components']:
                ct=c['componentText'];assert sha((SITE/ct['path']).read_bytes())==ct['sha256']
                cs.append(dict(c,mission=mission,componentManifest=p.relative_to(SITE).as_posix(),
                    canImportWithoutFurtherReview=False,aggregateIntegrated=False,
                    disposition='prepared-private-slice-not-new-download-not-blanket-teaching-approval'))
                checks.append(dict(kind='private-component-hash',mission=mission,componentId=c['componentId'],passed=True))
        components+=cs
        missions.append(dict(mission=mission,originalFiles=len(manifest['files']),
          originalBytes=sum(a['byteCount'] for a in manifest['files']),
          derivativeWords=sum(a.get('derivedText',{}).get('wordCount',0) for a in manifest['files']),
          workIdGroups=len({a.get('workId') for a in manifest['files']}),
          preparedComponents=len(cs),report=(folder/'REPORT.md').relative_to(SITE).as_posix(),
          status='completed-report-present' if (folder/'REPORT.md').exists() else 'acquisitions-checkpointed-report-closeout-in-progress'))
    by_path=defaultdict(list);by_sha=defaultdict(list);by_id=defaultdict(list)
    for a in files:
        by_path[a['relativePath']].append(a);by_sha[a['sha256']].append(a);by_id[a['assetId']].append(a)
    for rows in by_path.values():assert len({a['sha256'] for a in rows})==1
    for rows in by_id.values():assert len({a['relativePath'] for a in rows})==1
    assert len(components)==len({c['componentId'] for c in components})
    by_parent=defaultdict(list)
    for c in components:
        parents=by_id[c['parentWitnessAssetId']]
        assert parents and c['originalSha256']==parents[0]['sha256']
        if c.get('member'):
            with zipfile.ZipFile(SOURCES/parents[0]['relativePath']) as archive:
                raw=archive.read(c['member']);assert sha(raw)==c['memberSha256']
                doc=BeautifulSoup(raw,'html.parser')
                expected=(doc.body or doc).get_text('\n',strip=True)+'\n'
        else:
            assert c['fullDerivativeSha256']==parents[0]['derivedText']['sha256']
            ls=(SITE/parents[0]['derivedText']['path']).read_text(encoding='utf-8').splitlines()
            assert 1<=c['lineStart']<=c['lineEnd']<=len(ls)
            expected='\n'.join(ls[c['lineStart']-1:c['lineEnd']])+'\n'
        # Component writers retain either platform or LF line endings; compare
        # normalized content while still verifying original component byte hash.
        actual=(SITE/c['componentText']['path']).read_text(encoding='utf-8')
        assert actual==expected,(c['componentId'],'component replay')
        if not c.get('member'):by_parent[c['parentWitnessAssetId']].append(c)
        checks.append(dict(kind='component-parent-and-range-replay',componentId=c['componentId'],passed=True))
    overlaps=[]
    for parent,rows in by_parent.items():
        for i,a in enumerate(rows):
            for b in rows[i+1:]:
                lo=max(a['lineStart'],b['lineStart']);hi=min(a['lineEnd'],b['lineEnd'])
                if lo<=hi:overlaps.append(dict(parentWitnessAssetId=parent,a=a['componentId'],b=b['componentId'],lineStart=lo,lineEnd=hi,
                     disposition='do-not-count-or-import-overlap-twice; review nested versus distinct-purpose units'))
    duplicate_groups=[dict(sha256=h,assetIds=[a['assetId'] for a in rows],paths=[a['relativePath'] for a in rows]) for h,rows in by_sha.items() if len(rows)>1]
    corrections=[dict(priority='must-reconcile-before-DB-import',source='RB05/identity-corrections.json',
        instruction='RB01 Founders Introduction is Stan Reeves modern confession editorial, not Dagg; RB05 adds missing actual Dagg Introduction. Dagg Appendix chief article credits G. W. Samson.'),
      dict(priority='preserve-edition-and-author-identity',source='RB04/INTAKE-NOTES.md',instruction='Andrew Fuller versus Francis Fuller; Chapel Booth annotated abridgment versus rough complete historical witness; Fuller memoir/editor/opponent roles.'),
      dict(priority='preserve-extent-and-scripture-citation',source='RB06/INTAKE-NOTES.md',instruction='Held Baxter is Part II only; Ryle introduction Proverbs reference defect; Steele modern Wilson additions; contributor and marital-policy differences.'),
      dict(priority='preserve-primary-editorial-voice-and-dates',source='RB07/INTAKE-NOTES.md',instruction='Held Bonar byline Horatius, not Andrew; Carey revised PG mentions 1909; older Appendix III incomplete; Evans translators/editor notes; Serampore date/signature OCR uncertainties.'),
      dict(priority='desk-label-is-not-author',source='RB08/source-exceptions.json',instruction='Carson desk Islam essay actually Moucarry; Trinity dictionary PDF includes non-Carson neighbors. Suffering anthology chapters have separate actual bylines. No silent old-DB relabeling.')]
    summary=dict(missions=missions,manifestEntries=len(files),distinctOriginalPaths=len(by_path),distinctOriginalByteHashes=len(by_sha),
      originalBytes=sum(rows[0]['byteCount'] for rows in by_path.values()),
      derivativeWordsSum=sum(a.get('derivedText',{}).get('wordCount',0) for a in files),
      formatCounts=dict(Counter(a['format'] for a in files)),preparedPrivateComponents=len(components),
      sameParentRangeOverlapPairs=len(overlaps),countRule='File counts are witnesses/components, not new books. Word totals include overlap, editors and rejected/unselected scope; not unique admitted words.')
    manifest=dict(schemaVersion=1,campaign='RB01-RB08-interim-intake-reconciliation',preparedAt=datetime.now(timezone.utc).isoformat(),
      summary=summary,files=files,preparedComponents=components,immutableInputs=inputs,
      identicalByteGroups=duplicate_groups,sameParentComponentOverlaps=overlaps,requiredIdentityCorrections=corrections,
      ingested=False,embedded=False,graphBuilt=False,enrichmentStarted=False,publicHostingAllowed=False,
      releaseAutomaticGate=False,fullCampaignGate='Owner-expanded RB01-RB14; existing task/scheduler unchanged.',
      requiredNextSteps=['Finish RB09-RB14 under owner instructions.',
        'Reconcile this interim queue with all fourteen actual mission outputs and the current KnowledgeBase follow-up plan.',
        'Integrate work/contributor/quotation/rights scopes into the existing importer; validate parent evidenceOnly behavior and component roles.',
        'Deduplicate work/edition content and overlapping slices; reject sparse Gill exposition and retain incomplete witnesses as partial.',
        'Apply source-first eligible text delta in one dedicated ingestion task, reuse unchanged vectors and verify SQLite/FTS/vector parity.',
        'Only then begin knowledge enrichment under its separate strategy.'])
    write('consolidated-intake-manifest.json',manifest)
    write('verification.json',dict(checksPassed=True,checkCount=len(checks),checks=checks,dbTouched=False,gateReleased=False))
    print(json.dumps(summary,ensure_ascii=True))
    print('AGGREGATE VERIFIED',len(checks),'checks; no DB, vectors or scheduler changed')

if __name__=='__main__':main()
