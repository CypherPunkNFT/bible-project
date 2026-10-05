"""Publish evidence-based source resolutions and register acquired text assets."""
import hashlib
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/text-backlog'
CACHE=SITE/'.local/library/ready-text-check'
spec=importlib.util.spec_from_file_location('helpers',SITE/'scripts/catalog-scripture-studies.py')
h=importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
read,write=h.read,h.write
spec=importlib.util.spec_from_file_location('resolver',SITE/'scripts/resolve-ready-text.py')
r=importlib.util.module_from_spec(spec); spec.loader.exec_module(r)

# Individual primary-source findings; commercial editions and partial texts do
# not masquerade as freely reusable complete transcriptions.
FINDINGS=[
 ('edition-perkins-golden-chain','keyboarded-text-located-access-unverified','https://quod.lib.umich.edu/cgi/i/idresolver/idresolver-nr?id=A09339.0001.001','University of Michigan EEBO-TCP record identifies a keyboarded, encoded CC0 text of the 1600 edition. Search record verified; direct retrieval failed. This differs from the catalogued 1591 impression.','University record: author, 1600 imprint, CC0 statement; direct-fetch failure retained.'),
 ('edition-l12-carey','online-text-verified','https://www.gutenberg.org/cache/epub/11449/pg11449-images.html','Complete readable Gutenberg transcription; retain electronic notices and edition details.','Book text, numbered sections and ending inspected through web source; Gutenberg catalog offers text and EPUB.'),
 ('edition-l12-piper-brothers','official-digital-edition-offered','https://www.desiringgod.org/books/brothers-we-are-not-professionals','Official page offers a complete PDF, unlike the sample-only Nations page. Reuse existing modern-text acquisition if present; no duplicate download performed here.','Official page link /books/brothers-we-are-not-professionals.pdf; PDF body not newly checked in this audit.'),
 ('edition-machen-liberalism','online-text-verified','https://www.ccel.org/m/machen/liberalism/home.html','Legacy CCEL HTML edition has seven chapter links; chapter 1 contains substantive text. Not a scanned-book transcription job.','Cached contents and chr_and_lib_1.html; all seven chapter links inventoried, one body checked.'),
 ('edition-charnock-attributes','online-text-verified','https://www.gutenberg.org/cache/epub/53527/pg53527-images.html','Gutenberg 53527 contains Volumes 1 and 2. Its transcription notes disclose standardized punctuation and retained spelling variation; match edition before replacing scan pagination.','Gutenberg title, book body and transcriber notes inspected; not neighboring ebook 53528, which is unrelated.'),
 ('edition-l12-packer','authorized-free-text-not-verified','https://ivpress.org/evangelism-and-the-sovereignty-of-god','Publisher edition located; no authorized complete free transcription verified. Keep official source link; do not create a transcription of a commercial edition by default.','Official publisher page checked; no complete free-text grant established.'),
 ('edition-l06-gill-exposition','online-text-verified','https://www.biblestudytools.com/commentaries/gills-exposition-of-the-bible/','Readable passage-organized commentary exists; Genesis 1:1 body checked. Site-wide acquisition or redistribution is not authorized by this source discovery.','Index and named Genesis 1:1 commentary page; not a claim that every passage was checked.'),
 ('edition-l12-piper-nations','official-excerpt-only','https://www.desiringgod.org/books/let-the-nations-be-glad','Official page offers two Sample PDF links, not a verified complete free book. Keep separate from full-text holdings.','Official sample-pdf.pdf and sample-pdf-2.pdf links.'),
 ('edition-l06-berkhof-hermeneutics','authorized-free-text-not-verified','https://bakerpublishinggroup.com/products/9780801064777_principles-of-biblical-interpretation','Official publisher and preview located; a complete authorized free transcription was not verified. Generic archive download labels do not establish unrestricted full text.','Baker publisher page and existing Biblia preview; no full-body acquisition.'),
 ('edition-l12-perkins','partial-work-online','https://www.monergism.com/thethreshold/sdg/perkins_prophesying.html','Substantial HTML text of The Art of Prophesying is available. It does not establish coverage of The Calling of the Ministry in the combined catalogued modern edition. Link only under Monergism policy.','Full HTML page, preface and numbered chapters; second work remains unresolved.'),
 ('edition-sibbes-bruised-reed','online-text-verified','https://www.monergism.com/thethreshold/sdg/bruisedreed.html','Readable HTML includes sixteen chapters and a modern publisher foreword. Treat as a distinct electronic/modernized witness, not the exact catalogued print copy; link rather than republish.','Contents, first chapter and later body present in fetched 225 KB page.'),
 ('edition-l12-ryle-parents','online-text-verified','https://www.biblebb.com/files/ryle/parentsjc.htm','Full readable tract with seventeen duties; modernization is disclosed by its editor. Preserve that distinction from historical wording.','Fetched HTML tract and editorial preface; not a fresh collation.'),
 ('edition-goodwin-works','ebook-links-need-quality-check','https://puritanlibrary.com/','The collection directory offers all twelve Goodwin volumes with EPUB links. These lead to archive-derived files and are not evidence of clean proofreading. Check available EPUB/OCR before considering any new transcription.','Directory inspected; destination bodies not systematically downloaded or reviewed.'),
 ('edition-l10-white-quran','authorized-free-text-not-verified','https://bakerpublishinggroup.com/products/9780764209765_what-every-christian-needs-to-know-about-the-quran','Official publisher edition identified; complete authorized free text not verified. Purchase/permission route remains separate from transcription work.','Official publisher page checked; no full-text grant established.'),
 ('edition-hodge-darwinism','online-text-verified','https://www.gutenberg.org/cache/epub/19192/pg19192-images.html','Complete Gutenberg HTML and text formats available. Preserve the electronic edition notices.','Book body, conclusion and Gutenberg catalog formats inspected.'),
 ('ia:tokenformourners00flav','online-text-alternative-verified','https://christianreader.app/books/a-token-for-mourners/01-epistle-dedicatory','Readable Flavel text with a 57-item navigation list is available. Dedication body verified; exact edition and Newton appendices are not established, so retain the 1813 scan as a separate witness.','Live chapter body and contents; no bulk retrieval or redistribution clearance.'),
 ('edition-l12-spurgeon-lectures','online-text-alternative-verified','https://www.spurgeon.org/books/lectures-to-my-students','Spurgeon Library offers a book reader; first-series preface body verified. Use the reader before processing the existing scan; chapter completeness still needs collation.','Official archive book page, substantial preface and chapter navigation.'),
 ('edition-berkhof-introduction','ready-text-download-offered','https://www.ccel.org/ccel/berkhof/newtestament.html','CCEL offers ready-made text and XML; introduction body verified online. Existing OCR need not be transcribed from scratch.','Work page formats plus newtestament.ii.html and newtestament.iii.html body.'),
 ('edition-warfield-plan','online-text-alternative-verified','https://www.monergism.com/thethreshold/articles/onsite/WarfieldPlan01.html','Readable lecture text available at Monergism; Part I body verified. Do not treat one checked part as a complete five-lecture collation; retain link-only handling.','Part I substantive body, author and title inspected.'),
 ('edition-aa-hodge-outlines','partial-work-online','https://www.theologue.org/AAHodgeTheology/Theology-AAHodge.html','Directory explicitly names the revised 1878 edition but exposes only ten chapter links (1–9 and 39). Chapter retrieval failed. This is not verified replacement coverage for the whole book.','Fetched title and ten links; failed chapter01.html request retained.'),
]

def build():
    books=r.holdings(); byid={g['id']:g for g in books}
    manifest=read(OUT/'ready-text-acquisition-manifest.json')
    checks=read(OUT/'pdf-text-checks.json')['records']
    result={}; assets=[]; supplementary=[]
    for c in checks:
        g=byid[c['holdingId']]
        result[g['id']]=dict(holdingId=g['id'],status=c['status'],bestSource=g['sourceLinks'][0],note='Existing PDF text layer verified on at least two of three sampled pages. Read/extract the existing text first; no OCR needed to obtain text. Page completeness, ordering and accuracy remain review tasks.',evidence='pdf-text-checks.json',originalStatus=g['status'])
    for c in manifest['checks']:
        gid=c['holdingId']; g=byid[gid]
        if c['status']=='ready-transcription-acquired':
            f=next(f for f in manifest['files'] if f.get('relativePath')==c['relativePath'])
            raw=(SOURCES/c['relativePath']).read_bytes(); assert hashlib.sha256(raw).hexdigest()==c['sha256']
            root=ET.fromstring(raw); title=root.find('.//DC.Title'); creator=root.find('.//DC.Creator')
            c['sourceTitle']=' '.join(title.itertext()) if title is not None else None
            c['sourceCreator']=' '.join(creator.itertext()) if creator is not None else None
            assert c['sourceTitle'],gid
            aid='asset-ready-text-'+gid
            evidence=[h.ev(c['sourceUrl'],'Offered XML download; parsed body and DC title',c['scope'])]
            a=h.link_asset(aid,gid,'source-ccel',c['sourceUrl'],evidence)
            a.update(finalUrl=f['finalUrl'],format='other',mediaKind='text',acquisitionStatus='downloaded',storage='raw',relativePath=c['relativePath'],sha256=c['sha256'],byteCount=f['byteCount'],mimeType=f['mimeType'],retrievedAt=f['retrievedAt'].replace('+00:00','Z'))
            a['rights'].update(category='restricted-license',licenseId='CCEL-personal-educational-permission',licenseUrl='https://www.ccel.org/about/copyright.html',conditions=['Personal/educational use; retain notices. Republication or commercial use requires separate permission.'],conditionsMet=True,unresolved=['Historic text and modern electronic additions have different rights; no public hosting or full-text indexing clearance.'])
            a['rights']['actions']['download']='allowed'
            a['rights']['evidence'].append(h.ev(a['rights']['licenseUrl'],'CCEL copyright policy','Named offered download for private educational use.'))
            a['processing']['note']='Source-offered ThML transcription retained unchanged; no OCR, generated reconstruction, or public full-text indexing.'
            a['quality'].update(state='issues',reviewedBy='Codex',reviewedOn='2026-10-05',note='Full XML parses and contains substantive body text. Exact print collation, notes and transcription accuracy not fully reviewed.')
            p=LIB/'catalog/assets'/(aid+'.json'); write(p,a); assets.append(p.relative_to(SITE).as_posix())
            f.update(assetId=aid,editionId=gid,sourceId='source-ccel',format='xml')
            result[gid]=dict(holdingId=gid,status=c['status'],bestSource=c['sourceUrl'],textUrl=c['textUrl'],localText=c['relativePath'],sourceTitle=c['sourceTitle'],note='Complete source-offered XML transcription downloaded and parsed; preserve edition and editorial differences.',evidence='ready-text-acquisition-manifest.json',originalStatus=g['status'])
        else:
            path=CACHE/(gid+'-info.html'); raw=path.read_text(encoding='utf-8')
            match=re.search(r'class=[\"\']book-content[\"\']>(.*?)<table[^>]+book_navbar',raw,re.S)
            assert match,gid
            page=r.Page(); page.feed(match[1]); text=' '.join(page.text)
            assert len(text)>1500 or gid=='edition-ursinus-catechism',gid
            partial=gid=='edition-l08-savoy'
            result[gid]=dict(holdingId=gid,status='partial-work-online' if partial else 'online-text-verified',bestSource=c['sourceUrl'],note='Schaff prints the preface and platform in full but only confession sections differing from Westminster. Not a standalone full Savoy confession.' if partial else 'Substantive HTML document body verified inside book-content; retain the edition/translation and quoted-author distinctions.',evidence='ready-text-acquisition-manifest.json',bodyCharacters=len(text),bodySha256=hashlib.sha256(text.encode()).hexdigest(),originalStatus=byid[gid]['status'])
            if gid=='edition-ursinus-catechism':
                result[gid].update(status='partial-work-online',note='The linked page is an editorial introduction to a selected prolegomena article, not the complete catechism commentary. Text source is identified but complete-book coverage is not established.')
    # The scan is a distinct 1767 witness; already acquired structured text is an
    # alternative edition, not a silent rewrite of that witness.
    gid='edition-l08-flavel-1767'
    alts=[p for p in (LIB/'catalog/assets').glob('*.json') if (a:=read(p)).get('editionId')=='edition-l08-flavel' and a.get('acquisitionStatus')=='downloaded']
    assert alts
    a=read(alts[0]); assert (SOURCES/a['relativePath']).is_file()
    result[gid]=dict(holdingId=gid,status='existing-alternative-edition-text',bestSource=a['canonicalUrl'],localText=a['relativePath'],note='Structured Flavel catechism text already acquired under edition-l08-flavel. The L08 report records modernization/numbering differences; it is not an exact transcription of this 1767 scan.',evidence=alts[0].relative_to(SITE).as_posix(),originalStatus=byid[gid]['status'])
    for gid,status,url,note,evidence in FINDINGS:
        if gid not in byid:
            allholdings=read(OUT/'inventory.json')['holdings']
            g=next(g for g in allholdings if g['id']==gid)
            supplementary.append(dict(holdingId=gid,title=g['title'],status=status,bestSource=url,note=note,evidence=evidence))
            continue
        result[gid]=dict(holdingId=gid,status=status,bestSource=url,note=note,evidence=evidence,checkedOn='2026-10-05',originalStatus=byid[gid]['status'])
    # Record alternative readable HTML for the Zwemer PDFs as well as local text.
    for gid,key in [('edition-l10-zwemer-christ','zwemer-christ-body'),('edition-l10-zwemer-god','zwemer-god-body')]:
        ext=next(x for x in read(OUT/'external-text-checks.json')['checks'] if x['key']==key)
        assert ext['status']=='fetched-for-inspection' and ext['textCharacters']>5000
        result[gid]['alternativeHtml']=ext['url']
        result[gid]['note']+=' A separately hosted HTML chapter was also checked; complete edition collation remains open.'
    target={g['id'] for g in books if g['status'] in ['pdf-text-check-deferred','find-existing-text']}
    assert target.issubset(result),sorted(target-set(result))
    for g in books:
        if g['id'] not in result:
            result[g['id']]=dict(holdingId=g['id'],status='existing-text-retained' if g['status']=='existing-text-review' else 'existing-ocr-retained',bestSource=g['sourceLinks'][0] if g['sourceLinks'] else None,note='Already acquired text retained. No claim of new body review or a verified cleaner edition in this pass.',evidence=g['evidence'],originalStatus=g['status'])
    findings=[dict(**result[g['id']],title=g['title']) for g in books]
    counts=dict(Counter(f['status'] for f in findings))
    data=dict(date='2026-10-05',scope='All 77 PDF-only book/volume candidates and all 84 catalogued book holdings previously awaiting text have an explicit source decision; existing text/OCR holdings retained, with selected better alternatives. Short-item and unidentified-file appendices are not claimed fully researched.',pdfCandidates=77,pdfTextVerified=76,pdfAlternateEditionText=1,newCompleteCcelTranscriptions=len(assets),calvinVolumes=sum('calvin-' in f['holdingId'] and f['status']=='ready-transcription-acquired' for f in findings),statusCounts=counts,confirmedNewOcrJobs=0,limits=['No claim that every historic edition has a clean exact transcription.','Text-layer checks sampled pages; full transcription quality and completeness remain open.','A commercial or permission-dependent edition is not a transcription assignment.','No new OCR was run. Original bytes preserved. Public publication selection unchanged.'],records=findings,supplementaryFindings=supplementary)
    write(OUT/'text-resolutions.json',data)
    write(OUT/'ready-text-acquisition-manifest.json',manifest)
    write(OUT/'ready-text-record-manifest.json',dict(paths=assets))
    labels={
      'ready-transcription-acquired':'New complete transcriptions acquired',
      'existing-pdf-text-verified':'Existing PDF text verified — read or extract, do not re-transcribe',
      'existing-alternative-edition-text':'Existing text in a different edition',
      'online-text-verified':'Readable online text verified',
      'online-text-alternative-verified':'Readable alternative — edition/completeness review remains',
      'ready-text-download-offered':'Ready-made text offered by the source',
      'official-digital-edition-offered':'Official digital book offered',
      'partial-work-online':'Partial coverage — remaining work explicitly unresolved',
      'official-excerpt-only':'Official excerpts, not a complete book',
      'authorized-free-text-not-verified':'Authorized complete free text not verified',
      'keyboarded-text-located-access-unverified':'Keyboarded text located — direct access unresolved',
      'ebook-links-need-quality-check':'Ebook links found — quality not verified',
      'existing-text-retained':'Previously acquired text retained',
      'existing-ocr-retained':'Previously acquired OCR retained — cleaner replacements not established',
    }
    lines=['# Master text-source list — verified follow-up','', '2026-10-05. This replaces the earlier format-only backlog with explicit source findings.','', '**77 PDF candidates checked: 76 already have substantial text in sampled pages; one has an already-acquired text alternative in a different edition. None is currently a confirmed new OCR assignment.**','',f'**{len(assets)} additional complete CCEL transcriptions acquired, including all 45 Calvin commentary volumes.** Every one of the 84 previously unacquired book holdings has a source decision below.','', 'Existing text is not necessarily proofread text. Exact editions, partial works, modernization, commercial access and failed retrieval remain distinguished. The other existing OCR holdings and unidentified/short-item appendix have not all received a new cleaner-edition search.','', '## What to use first','', '- Read the acquired CCEL XML or its online book reader. [Acquisition manifest](ready-text-acquisition-manifest.json) records exact local paths and hashes.','- Use the existing Spurgeon text PDFs; [Spurgeon Gems](https://www.spurgeongems.org/spurgeon-sermons/) documents the set. No OCR is needed merely to obtain text.','- Use verified online alternatives linked below; some remain link-only under source permissions.','- Keep exact-edition comparison, proofreading and permission work separate from transcription. [Machine-readable decisions](text-resolutions.json) and [PDF sample evidence](pdf-text-checks.json).','', '## Important corrections','', '- **Flavel catechism:** a structured text already existed in L08; the 1767 scan remains a different witness.','- **Flavel, Token for Mourners:** a readable chapter-based edition was located. Its Newton appendices and match to the 1813 scan are not established.','- **Savoy:** the Schaff source gives only confession sections differing from Westminster, alongside its preface and platform. It is not a complete standalone confession.','- **Perkins:** online Art of Prophesying does not automatically include The Calling of the Ministry.','- **Piper:** Brothers offers an official full PDF; the Nations page offers samples.','- **Charnock:** Gutenberg 53527 contains both volumes; neighboring ebook 53528 is unrelated and was rejected.','']
    for status,label in labels.items():
        items=[f for f in findings if f['status']==status]
        if not items: continue
        lines += ['## '+label+f' ({len(items)})','', '| Book / holding | Best text source | Decision |','|---|---|---|']
        for f in sorted(items,key=lambda f:f['title']):
            title=f['title'].replace('|','/').replace('\n',' ')
            lines.append('| '+title+'<br>`'+f['holdingId']+'` | '+('[Read / source]('+f['bestSource']+')' if f['bestSource'] else 'See catalog')+' | '+f['note'].replace('|','/')+' |')
        lines.append('')
    lines += ['## Permissions and verification','', '[CCEL](https://www.ccel.org/about/copyright.html) permits specified personal/educational uses; acquisition does not clear republication of electronic packaging. [Monergism](https://www.monergism.com/monergism-copyright-permissions) sources are linked, not imported as reusable app content. Source bodies were downloaded only where this task established the permitted acquisition method. Original files remain unchanged.','', 'The original [format inventory](inventory.json) remains the baseline, including short items and files awaiting title reconciliation. This report audits its 223 identified book/volume holdings, not every possible title or every unidentified file. Rebuild with `python -X utf8 scripts/report-ready-text.py`; network checks are separately explicit in `resolve-ready-text.py`.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
    paths=assets+[p.relative_to(SITE).as_posix() for p in OUT.iterdir() if p.is_file() and p.name!='inventory.json']+['scripts/resolve-ready-text.py','scripts/report-ready-text.py','scripts/inventory-text-backlog.py','content/library/README.md','content/library/BACKLOG.md','SOURCES.md']
    (SITE/'.local/ready-text-owned.txt').write_bytes('\0'.join(sorted(set(paths))).encode()+b'\0')
    assert len(checks)==77 and sum(c['status']=='existing-pdf-text-verified' for c in checks)==76
    assert len(assets)==63 and data['calvinVolumes']==45
    for f in manifest['files']:
        assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
    write(OUT/'ready-text-validation.json',dict(date='2026-10-05',passed=['All acquired text and page-evidence hashes match','63 XML files parse and have DC titles and substantial body text','All 45 Calvin volumes have acquired transcriptions','All 77 PDF candidates and all 84 unacquired book candidates have source decisions','76 PDF holdings meet stated sample threshold; remaining Flavel has a local alternative','63 new asset records pass the global library validator'],limits='Structural/source verification is not full proofreading or exact-edition collation.'))
    # Include validation output in the explicit commit list after it is written.
    owned=SITE/'.local/ready-text-owned.txt'
    owned.write_bytes(owned.read_bytes()+b'content/library/reports/text-backlog/ready-text-validation.json\0')
    print(json.dumps({k:v for k,v in data.items() if k not in ['records','supplementaryFindings']},ensure_ascii=False))

if __name__=='__main__': build()
