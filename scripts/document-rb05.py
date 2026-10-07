"""Prepare source-first RB05 documentation; never launch intake or final gate."""
import hashlib
import json
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
R=SITE/'content/library/reports/reformed-baptist-overnight/RB05'

def read(path):return json.loads(path.read_text(encoding='utf-8'))
def write(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def main():
    m=read(R/'acquisition-manifest.json')
    targets=read(R/'targets.json')
    pages={'living-as-church':[10,15,20,27,33,39,44,50,57,65,72,77,82],
        'discipline-ii':[8,11,14,17,19,23,25,27,30,33,36,39,41], 'deacons':[34],'lay-elders':[40]}
    for a in m['files']:
        if a['sourceId']=='source-9marks':
            key=next(k for k in pages if a['workId'].endswith(k))
            a['rightsNoticePdfPages']=pages[key]
            a['rightsEvidence']='Explicit issue permission to reproduce/distribute unchanged material, cost-only charging, at most 1000 physical copies and retained 9Marks credit. See one-based PDF pages '+','.join(map(str,pages[key]))+'. Web posting prefers a source link. Applies to this material only; private study acquisition, no owner-authorized public hosting.'
            if key=='living-as-church':a['rightsEvidence']+=' The course separately permits adaptation for teaching.'
        if 'journal-90' in a['workId'] and 'PDF page3' not in a['rightsEvidence']:
            a['rightsEvidence']+=' PDF page3 says past issues are free PDFs; page24 labels Puls teaching notes used by permission. Publisher permission does not transfer that contributor license to us.'
        for t in targets:
            if t['url']==a['url']:
                t['rightsEvidence']=a['rightsEvidence']
                if a.get('rightsNoticePdfPages'):t['rightsNoticePdfPages']=a['rightsNoticePdfPages']
        write((SOURCES/a['relativePath']).with_name('provenance.json'),a)
    write(R/'acquisition-manifest.json',m);write(R/'targets.json',targets)
    # Correct all later planner-visible hints; the original-byte audit remains intact.
    audit=read(R/'holdings-audit.json');corr=read(R/'identity-corrections.json')
    for a in audit['files']:
        if a['assetId']==corr['assetId']:
            a.setdefault('previousAuditedIdentity',{k:a.get(k) for k in ('title','author','workId')})
            a.update(corr['correctedIdentity'])
            a['identityCorrection']='identity-corrections.json; actual original SHA unchanged'
    # The preface explicitly credits Samson with the chief Appendix article.
    rb01=R.parent/'RB01';prior=read(rb01/'acquisition-manifest.json')
    appendix=next(a for a in prior['files'] if a['assetId']=='asset-rb01-b0316e24a0234138ae8c')
    appendix.update(author='John Leadley Dagg; G. W. Samson contributor; quoted historical witnesses',evidenceOnly=True,
        intakeScope='Mixed Appendix: Dagg preface credits G. W. Samson with the chief article. Segment contributor and quoted geography before teaching-text intake.',
        contributorEvidence=dict(url='https://founders.org/library/preface/',locator='last paragraph; July 31, 1858'))
    write((SOURCES/appendix['relativePath']).with_name('provenance.json'),appendix)
    write(rb01/'acquisition-manifest.json',prior)
    pt=read(rb01/'targets.json')
    for a in pt:
        if a['url']==appendix['url']:
            for k in ('author','evidenceOnly','intakeScope','contributorEvidence'):a[k]=appendix[k]
    write(rb01/'targets.json',pt)
    ps=read(rb01/'intake-scope.json')
    for a in ps['files']:
        if a['assetId']==appendix['assetId']:
            a.update(evidenceOnly=True,componentReviewRequired=True,role='historical-appendix-with-contributor-roles',review='../RB05/INTAKE-NOTES.md')
    write(rb01/'intake-scope.json',ps)
    for a in audit['files']:
        if a['assetId']==appendix['assetId']:
            a.update(author=appendix['author'],evidenceOnly=True,intakeScope=appendix['intakeScope'])
    write(R/'holdings-audit.json',audit)
    scopes=[];bib=[];decisions=[]
    for a in m['files']:
        journal=a['format']=='pdf'
        scopes.append(dict(assetId=a['assetId'],relativePath=a['relativePath'],originalSha256=a['sha256'],title=a['title'],author=a['author'],
            evidenceOnly=journal,publicHostingAllowed=False,publicFullTextIndexAllowed=False,
            candidateRole='mixed-journal-with-selected-church-study-components' if journal else 'historical-baptist-introduction',
            sourceRoles=['author argument','Scripture quotation','quoted historical/opposing sources','editor/publisher matter'],
            ingestionRequirement='Keep parent metadata-only until component-specific contributor, rights and quotation enforcement is integrated.' if journal else 'Import only the selected historical introduction; retain transcription defects and do not duplicate the held preface.',
            excludedRoles=['book reviews','advertisements','news','incidental Catholic/progressive reviewed books'],
            limitations='File completeness is not whole-author or contributor approval. No Catholic/progressive work was targeted as teaching or opposition acquisition. Incidental reviewed books stay excluded.' if journal else 'Completes a held work across two transcription hosts, not a newly acquired whole book or critical edition.'))
        bib.append(dict(workId=a['workId'],title=a['title'],author=a['author'],assetIds=[a['assetId']],sourceUrls=[a['url']],
            editions=[{k:a[k] for k in ('assetId','edition','format','completeness','sha256')}],
            kind='new-journal-issue-witness' if journal else 'new-component-of-held-historical-work',
            scope='Source-first identity; contributor/admission/rights scopes remain attached.'))
        decisions.append(dict(workIds=[a['workId']],author=a['author'],globalAuthorApproval=False,
            decision='private-study-acquired; journal parent intake held pending segmented checks' if journal else 'admit-selected-historical-Baptist-introduction',
            sixAnchorBasis='Publisher doctrinal framework and actual selected article scope support bounded private review; see theological-evidence.json. Unverified contributors remain provisional, never globally approved.' if journal else 'Reuse RB01/admission-decisions.json John Leadley Dagg primary evidence: Scripture, Trinity, divine/human Christ, satisfaction, faith justification and bodily resurrection.',
            workBodyFinding='Selected pages treat Baptist membership/polity, discipline, officers, worship or preaching; historical comparisons and quoted voices remain separate. Actual unit locations and contributors are in chapter-map.json.' if journal else 'Christ\u2019s divinity/humanity and redemption ground obedience; the introduction closes with prayer for Spirit-led study and scriptural notes.',
            limitations=['AI-assisted bounded source/work screening, not exhaustive independent human theological review.','No public full-text hosting or global author-registry changes.','Contributor-specific distinctions in THEOLOGICAL-DISTINCTIONS.md are mandatory.']))
    write(R/'bibliography.json',dict(works=bib,countRule='Seven new offered journal-issue witnesses, plus one missing introduction completing a held Dagg work. Forty-eight selected journal units are not forty-eight new books.'))
    write(R/'intake-scope.json',dict(mission='RB05',files=scopes,journalParentsHeld=7,componentsRequireIntegration=True,dbIngested=False,embedded=False,
        priorCorrections=['RB01 Stan Reeves introduction no longer Dagg; old DB attribution must be reconciled later.','RB01 Dagg Appendix now evidenceOnly until Samson/quotation roles integrated.']))
    write(R/'admission-decisions.json',dict(review=dict(date='2026-10-07',reviewer='Codex',kind='ai-assisted',scope='Bounded work/edition acquisition screening; provisional contributors explicitly queued.'),decisions=decisions))
    discovery=read(R/'discovery-evidence.json');compact={}
    selected={a['url'] for a in m['files']}
    for d in discovery:
        d={k:v for k,v in d.items() if k not in ('firstText','firstPages')}
        if 'links' in d:
            d['links']=[x for x in d['links'] if x['url'] in selected or any(q in x['url'].lower() for q in ['.pdf','.epub','copyright','/faq','statement-of-faith'])]
        compact[d['url']]=d
    write(R/'discovery-evidence.json',list(compact.values()))
    registry=SITE/'content/library/sources.json';sources=read(registry)
    for sid,name,url,note,ev in [
        ('source-9marks','9Marks','https://www.9marks.org/','Work-specific permission only. Four historical journals have explicit conditional reproduction notices. Modern books can prohibit retrieval-system storage; offered access is not a publisher-wide acquisition/indexing grant.',m['files'][0]['url']),
        ('source-founders','Founders Ministries','https://founders.org/','Offered issue PDFs and historic HTML witnesses retained privately. Verify each contributor, edition and rights; no general full-text republication or AI-corpus permission inferred.','https://founders.org/journal/issue-73-summer-2008/')]:
        if not any(s['id']==sid for s in sources['sources']):sources['sources'].append(dict(id=sid,name=name,url=url,role='publisher',automation='unreviewed',acquisitionNote=note,
            evidence=[dict(url=ev,locator='Publisher-offered issue file / rights notice',note=note,checkedOn='2026-10-07')],reviewedOn='2026-10-07'))
    sources['updated']='2026-10-07';write(registry,sources)
    print('DOCUMENTED',len(bib),'source-first entries; seven journal holds; two source identities; prior attribution scopes corrected')

if __name__=='__main__':main()
