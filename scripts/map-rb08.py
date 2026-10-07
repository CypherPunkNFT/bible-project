"""Offline RB08 question/source tables, verified line/EPUB coordinates; no graph/DB."""
import hashlib
import importlib.util
import json
import re
import zipfile
from pathlib import Path
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
R=SITE/'content/library/reports/reformed-baptist-overnight/RB08'
spec=importlib.util.spec_from_file_location('shared',SITE/'scripts/map-rb04.py')
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
def read(name):return json.loads((R/name).read_text(encoding='utf-8'))
def write(name,x):
    t=x.rstrip()+'\n' if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2)+'\n'
    (R/name).write_text(t,encoding='utf-8',newline='\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def cell(x):return str(x or 'Not stated').replace('|',' / ').replace('\n',' ')

def main():
    new=read('acquisition-manifest.json')['files'];held=read('holdings-audit.json')['files']
    chosen={'asset-modern-piper-b08108c3fb9739cdd3c0-epub','asset-modern-piper-4051bb40dafe67c8781e-epub',
      'asset-modern-piper-17e13148c28ccabe1629-epub','asset-expanded-58d18a8a54e9d80b75e8',
      'asset-expanded-1ea545658fb3ae1e09b1','asset-expanded-e619482273904d1ae96c',
      'asset-ready-library-33fd336f7c903f317e66','asset-ready-library-eddd4f31374b1f53e88c'}
    new_ids={x['assetId'] for x in new};works=[]
    for a in held+new:
        if a['assetId'] not in chosen|new_ids:continue
        d=a.get('derivedText') or a.get('auditDerivative')
        assert d
        raw=(SITE/d['path']).read_bytes();assert sha(raw)==d['sha256']
        ls=raw.decode('utf-8').splitlines()
        w={k:a.get(k) for k in ('assetId','workId','title','author','relativePath','url','edition','completeness')}
        w.update(originalSha256=a.get('sha256') or a['actualSha256'],derivative=d,
          status='new-witness' if a['assetId'] in new_ids else 'already-held-reused',parentIntakeHeld=True,locations=[])
        def unit(lo,hi,label,role='authored-argument-with-nested-citations',author=None,**extra):
            assert 1<=lo<=hi<=len(ls)
            u=dict(title=label,sourceLabel=ls[lo-1],locator=f'derivative-lines:{lo}-{hi}',lineStart=lo,lineEnd=hi,
                   role=role,author=author or w['author'],**extra)
            w['locations'].append(u)
            return u
        if a['relativePath'].endswith('.epub'):
            w['locations']=shared.epub_locations(a)
            for u in w['locations']:
                u.update(author=w['author'],role='source-navigation-with-context-required')
                if a['assetId']=='asset-modern-piper-17e13148c28ccabe1629-epub':
                    chapter_author={'chap01':'John Piper','chap02':'Mark R. Talbot','chap03':'John Piper','chap04':'John Piper',
                       'chap05':'Stephen F. Saint','chap06':'Carl F. Ellis, Jr.','chap07':'David Powlison','chap08':'Dustin Shramek','chap09':'Joni Eareckson Tada',
                       'intro':'Justin Taylor','appen1':'John Piper and David Powlison'}
                    key=Path(u['member']).stem
                    u['author']=chapter_author.get(key,'Piper/Taylor edited anthology: identify exact contributor before use')
                    u['role']='anthology-chapter-with-actual-byline' if key in chapter_author else 'anthology-navigation-or-editorial-unit'
            if a['assetId']=='asset-modern-piper-17e13148c28ccabe1629-epub':
                w['author']='John Piper and Justin Taylor, editors; separately attributed contributors'
                w['identityNote']='Legacy author Piper is a desk/editor label; actual bylines preserved per chapter. No blanket approval of contributors.'
        elif a['assetId']=='asset-ready-library-33fd336f7c903f317e66':
            unit(86,308,'Trinity dictionary entry including bibliography','Carson-entry-surrounded-by-other-author-entries','Donald A. Carson')
            w['excludedLineRanges']=[dict(lineStart=1,lineEnd=85,role='preceding-non-Carson-entries'),dict(lineStart=309,lineEnd=len(ls),role='following-non-Carson-entry')]
            w['completeness']='Held PDF is a dictionary page slice, not a complete Trinity monograph; selected signed Carson entry lines 86-308 only.'
        elif a['assetId'] in new_ids and a['format']=='pdf':
            starts=[i+1 for i,s in enumerate(ls) if s.startswith('SOURCE PDF PAGE: ')]
            pages=20 if a['workId']=='work-rb08-kruger-definition-canon' else 19
            first=1 if pages==20 else 69
            assert len(starts)==pages
            for i,(lo,hi) in enumerate(zip(starts,[x-1 for x in starts[1:]]+[len(ls)])):
                unit(lo,hi,'Source PDF page '+str(i+1)+' / printed page '+str(first+i),sourcePdfPage=i+1,printedPage=first+i)
            if a['workId']=='work-rb08-kruger-definition-canon':
                sections=[(i+1,s.strip()) for i,s in enumerate(ls) if re.match(r'^[1-5]\. (Introduction|The Exclusive Definition|The Functional Definition|The Ontological Definition|Conclusion)',s)]
                assert len(sections)==5
                for i,(lo,label) in enumerate(sections):
                    unit(lo,sections[i+1][0]-1 if i+1<len(sections) else len(ls),label,'scholarly-canon-definition-section-with-footnotes')
            else:
                sections=[(1,'Introduction and question of starting assumptions'),(306,'Neutrality Is Impossible'),
                    (388,'Neutrality Is Ineffective'),(488,'Neutrality is Inconsistent'),(820,'Conclusion')]
                for i,(lo,label) in enumerate(sections):
                    if lo!=1:assert ls[lo-1].strip()==label
                    unit(lo,sections[i+1][0]-1 if i+1<len(sections) else len(ls),label,'authored-apologetic-method-argument-with-footnotes')
        else:
            unit(1,len(ls),'Complete offered article/essay','authored-essay-with-footnotes-and-quoted-voices')
            if a['assetId'] in new_ids:
                spec=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb08-acquire.py')
                r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
                node=r.base.soup((SOURCES/a['relativePath']).read_bytes()).select_one(a['selector'])
                headings=[h for h in node.select('h1,h2,h3,h4') if h.get_text(' ',strip=True)]
                starts=[]
                for heading in headings:
                    label=' '.join(heading.get_text(' ',strip=True).split())
                    parts=heading.get_text('\n',strip=True).splitlines()
                    # Inline italics can split an actual heading across several
                    # derivative lines; match its whole text block, not a label.
                    ix=next((i+1 for i in range(len(ls)-len(parts)+1)
                        if ls[i:i+len(parts)]==parts and (not starts or i+1>starts[-1][0])),None)
                    if ix:starts.append((ix,label))
                for i,(lo,label) in enumerate(starts):
                    hi=starts[i+1][0]-1 if i+1<len(starts) else len(ls)
                    unit(lo,hi,label,'article-section-including-source-quotations')
        works.append(w)
    assert len(works)==25
    wb={w['assetId']:w for w in works}
    by_work={}
    for w in works:by_work.setdefault(w['workId'],[]).append(w)
    def pick(aid,starts=None):
        w=wb[aid];us=w['locations']
        if starts:
            us=[u for u in us if any(u['title'].lower().startswith(s.lower()) for s in starts)]
            assert us,(w['title'],starts)
        return dict(assetId=aid,title=w['title'],originalSha256=w['originalSha256'],status=w['status'],
          locations=[{k:u.get(k) for k in ('title','locator','member','lineStart','lineEnd','author','role')} for u in us])
    def newpick(work,part=None):
        ws=by_work['work-rb08-'+work]
        if part:
            ws=[w for w in ws if next(a for a in new if a['assetId']==w['assetId']).get('seriesPart') in part]
        prefixes=['1.','2.','3.','4.','5.'] if work=='kruger-definition-canon' else ['Introduction','Neutrality','Conclusion'] if work=='kruger-sufficiency-apologetics' else None
        return [pick(w['assetId'],prefixes) for w in ws]
    glory='asset-modern-piper-b08108c3fb9739cdd3c0-epub';death='asset-modern-piper-4051bb40dafe67c8781e-epub'
    suffer='asset-modern-piper-17e13148c28ccabe1629-epub';christ='asset-expanded-58d18a8a54e9d80b75e8'
    insp='asset-expanded-1ea545658fb3ae1e09b1';doctrine='asset-expanded-e619482273904d1ae96c'
    paths=[
      ('Why trust Scripture as God\'s word?', 'Authority is distinguished from reception, manuscript copying and apologetic method.',
       'Piper argues for recognition of divine glory; Warfield for biblical inspiration; Kruger for presuppositional authority. Do not merge them into one anonymous claim.',
       ['2 Timothy 3:16','2 Peter 1:20-21'],newpick('kruger-sufficiency-apologetics')+[pick(glory,['5 ','6 ','7 ','11 ','17 ']),pick(insp,['III.','VI.','VII.'])]),
      ('Why these New Testament books?', 'Trace apostolic origins, early reception, disputed books and self-authentication.',
       'Kruger first-century dating and second-century Muratorian dating are attributed scholarly arguments. The extant fragment is later; early disputes and noncanonical use are acknowledged.',
       ['1 Timothy 5:18','Luke 10:7','2 Peter 3:16','John 10:27'],newpick('kruger-ten-canon-facts')+newpick('kruger-definition-canon')+[pick(glory,['2 ','3 ']),pick(insp,['Appendix I.'])]),
      ('Has transmission destroyed the Gospel text?', 'Compare copying history with arguments about Gospel sources and assumed corruption.',
       'White 2012 series concerns presuppositions/redaction criticism, not a comprehensive manuscript apparatus; Piper chapter 4 addresses textual preservation.',
       ['John 20:31'],newpick('redaction-islam')+[pick(glory,['4 '])]),
      ('How can one God be Father, Son and Spirit?', 'Study monotheism, distinct persons and full deity using sustained biblical argument.',
       'White quotes modalist opponents; Warfield and Carson are conservative Presbyterian/Baptist scholarship respectively. Carson file also contains other dictionary entries: only its signed Trinity entry is mapped.',
       ['Matthew 28:19','John 1:1','John 14:16-17'],newpick('brief-trinity')+newpick('chalcedon-oneness')+[pick(doctrine,['4.']),pick('asset-ready-library-33fd336f7c903f317e66')]),
      ('Is Jesus fully God and fully human?', 'Compare Johannine I am exegesis with two-nature Christology.',
       'Different occurrences of ego eimi do not all have identical syntactic/theological force. Historical opponent statements and creed quotations remain attributed.',
       ['John 1:1','John 1:14','John 8:58','John 13:19','John 18:5-6'],newpick('ego-eimi')+newpick('chalcedon-oneness')+[pick(christ,['The "Two Natures"','The Person Of Christ'])]),
      ('Why does bodily resurrection matter?', 'Read the risen Christ and the relation of Christ\'s death to his resurrection and ours.',
       'These held works establish theological exposition. They are not a new exhaustive modern historical-resurrection evidence monograph.',
       ['1 Corinthians 15:17','Romans 4:25'],[pick(christ,['The Risen Jesus']),pick(death,['4:','41:'])]),
      ('What did the cross accomplish?', 'Use Romans 3 exegesis alongside substitution, sacrifice, ransom and justification.',
       'Carson essay treats ten exegetical turning points, not the whole Glory of the Atonement anthology. Warfield overlap between collections must be deduplicated before later intake.',
       ['Romans 3:21-26','Galatians 3:13','Mark 10:45'],[pick('asset-ready-library-eddd4f31374b1f53e88c'),pick(christ,['Chief Theories','Modern Theories','Christ our Sacrifice']),pick(death,['1:','8:','10:','11:'])]),
      ('How do sovereignty and suffering meet at the cross?', 'Connect biblical providence, Christ\'s suffering, lament and contextual care.',
       'Piper is not the author of every anthology chapter: Powlison, Shramek and Tada retain bylines. Sovereignty arguments do not establish blame for victims or replace careful pastoral/medical care.',
       ['Romans 8:28','Psalm 30:5'],[pick(suffer,['1 ','3 ','7 ','8 ','9 ']),pick(death,['50:'])]),
      ('How should Christians answer Islamic Gospel-corruption arguments?', 'Study the complete two-part Christian response and its examples of source criticism.',
       'Christian authored response, not Muslim primary-text acquisition. Nested Qur\'an/opponent quotations and broad historical/polemical claims are evidence roles, not Christian teaching assertions.',
       ['Matthew 12:39-41','Luke 11:29-32'],newpick('redaction-islam')),
      ('What role do evidence and starting assumptions play?', 'Compare a Scripture-sufficient presuppositional essay with Piper\'s chapter on historical reasoning.',
       'Keep the methods identifiable. This table is an author-attributed reading guide; it does not settle every epistemological dispute or infer connections from vector similarity.',
       ['Colossians 2:3','Romans 1:18-23'],newpick('kruger-sufficiency-apologetics')+[pick(glory,['17 '])])]
    routes=[dict(question=q,purpose=p,limitations=l,scriptureStudyReferences=refs,
       referenceMeaning='Study starting references; citations in a quoted opponent argument are not an assertion of passage endorsement or exhaustive exposition coverage.',entries=e,inferredFromVectors=False) for q,p,l,refs,e in paths]
    write('chapter-map.json',dict(mission='RB08',works=works,unitCount=sum(len(w['locations']) for w in works),dbTouched=False))
    write('reading-paths.json',dict(mission='RB08',paths=routes,dbTouched=False))
    claim_sets=[('ego-eimi','Johannine I am sayings require syntactic and contextual interpretation; selected sayings support Christ deity.',['Usage','Translation','Johannine']),
       ('chalcedon-oneness','White defends triune person distinctions and Christ two natures against modalist readings.',['II.','III.','V.']),
       ('brief-trinity','White distinguishes one divine being from three coequal eternal persons.',['Complete']),
       ('redaction-islam','White argues that importing naturalistic Gospel-source assumptions while protecting Quranic narratives is inconsistent.',['Complete']),
       ('kruger-ten-canon-facts','The series argues for early apostolic books, reception and self-authentication while acknowledging disputed books and noncanonical use.',['Complete']),
       ('kruger-sufficiency-apologetics','Kruger argues neutral starting assumptions are impossible, ineffective and inconsistent with Scripture authority.',['Neutrality']),
       ('kruger-definition-canon','Kruger argues exclusive, functional and ontological definitions clarify complementary dimensions of canon.',['2.','3.','4.','5.'])]
    claims=[]
    for key,claim,prefixes in claim_sets:
        entries=[pick(w['assetId'],prefixes) for w in by_work['work-rb08-'+key]]
        claims.append(dict(workId='work-rb08-'+key,attributedClaim=claim,entries=entries,
            status='source-attributed-argument-not-independent-verification',semanticInference=False,coreTeachingApproved=False))
    write('claim-evidence.json',dict(mission='RB08',claims=claims,graphBuilt=False))
    scopes=[dict(assetId=a['assetId'],workId=a['workId'],originalSha256=a['sha256'],
        theologicalEligibility=a['theologicalEligibility'],theologicalScope=a['theologicalScope'],evidenceOnly=True,
        coreTeachingApproved=False,eligibleForScopedIntake=False,integrated=False,publicHostingAllowed=False,publicFullTextIndexAllowed=False,
        holds=['Modern full-text corpus/retrieval-use rights review remains separate from free reading.',
          'Importer must enforce author prose versus opponent/creed/scholar quotation and footnote roles.',
          'Preserve series identities, actual publication evidence and qualified historical claims.',
          'Respect the newer post-RB14 campaign gate; no DB/vector/enrichment work during RB08.'],
        rightsCategory=a['rightsCategory'],rightsEvidence=a['rightsEvidence']) for a in new]
    for s in scopes:
        if s['workId']=='work-rb08-kruger-definition-canon':
            s['rightsResolvedForPrivateNoncommercialIndexing']=True
            s['holds'][0]='Publisher older-article noncommercial software/indexing permission verified; retain attribution. Commercial use or derivative distribution is not authorized.'
    write('intake-scope.json',dict(mission='RB08',files=scopes,importerEnforcementClaimed=False,dbIngested=False,embedded=False,
        aggregationGate='Prepared RB01-RB08 interim aggregate does not release the post-RB14 scheduled gate.'))
    write('bibliography.json',dict(mission='RB08',records=[{k:a.get(k) for k in ('assetId','workId','title','author','edition','completeness','publicationDate','seriesPart','url','finalUrl','sha256','format','relativePath','theologicalScope','rightsEvidence')} for a in new],formalCatalogueChanged=False))
    md='# RB08: apologetics questions and exact reading locations\n\nTen study questions; seventeen new readable witnesses and eight held witnesses reused. Coordinates are edition-specific and source-hashed in [chapter-map.json](chapter-map.json). All new parents remain outside DB/vector intake. No graph relationships are inferred.\n\n'
    for i,p in enumerate(routes,1):
        md+=f"## {i}. {p['question']}\n\n{p['purpose']}\n\n{p['limitations']}\n\nScripture starting points: {', '.join(p['scriptureStudyReferences'])}. These are study routes, not exhaustive verse-coverage claims.\n\n| Witness | Unit / exact location | Author / voice | State |\n| --- | --- | --- | --- |\n"
        for e in p['entries']:
            for u in e['locations']:
                md+=f"| {cell(e['title'])} | {cell(u['title'])} — `{u['locator']}` | {cell(u['author'])}; {cell(u['role'])} | {cell(e['status'])} |\n"
        md+='\n'
    md+='See [theological decisions](theological-decisions.json), [source exceptions](source-exceptions.json), and [intake scopes](intake-scope.json). An exact body location is not an automatic theological or rights approval.\n'
    write('READING-MAP.md',md)
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'locations;',len(routes),'paths')

if __name__=='__main__':main()
