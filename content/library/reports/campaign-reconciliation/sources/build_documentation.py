"""Build canonical SOURCES.md and a source-only completion report."""
import json
import os
import re
from collections import Counter
from pathlib import Path

OUT=Path(__file__).resolve().parent
SITE=OUT.parents[4]
ROOT=SITE.parent

def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))

NAMES={
 '9marks.org':'9Marks', 'aomin.org':'Alpha and Omega Ministries', 'archive.org':'Internet Archive',
 'baptistcatechism.org':'SVRBC Baptist Catechism / Symbolics', 'baptistdogmatics.com':'Baptist Dogmatics',
 'baptisthistoryhomepage.com':'Baptist History Homepage', 'bcsmn.edu':'Bethlehem College and Seminary',
 'bible.helloao.org':'HelloAO Free Use Bible API', 'billygraham.org':'Billy Graham Evangelistic Association',
 'capitolhillbaptist.org':'Capitol Hill Baptist Church', 'careycenter.wmcarey.edu':'William Carey Center',
 'ccel.org':'Christian Classics Ethereal Library (CCEL)', 'chapellibrary.org':'Chapel Library',
 'content.cbtseminary.org':'Covenant Baptist Theological Seminary', 'crossway.org':'Crossway',
 'crosswire.org':'CrossWire SWORD', 'cslewisinstitute.org':'C. S. Lewis Institute',
 'desiringgod.org':'Desiring God', 'earlychristianwritings.com':'Early Christian Writings',
 'en.wikisource.org':'Wikisource', 'founders.org':'Founders Ministries / Founders Journal',
 'frame-poythress.org':'Frame–Poythress', 'freechristianebooks.org':'Free Christian Ebooks',
 'github:lwalen':'lwalen Second London Baptist Confession', 'github:nonlinearfruit':'NonlinearFruit Creeds.json',
 'github:textcreationpartnership':'Text Creation Partnership (EEBO, ECCO and Evans)',
 'gutenberg.org':'Project Gutenberg', 'history.hanover.edu':'Hanover College Historical Texts',
 'jimhamilton.info':'James M. Hamilton Jr.', 'ligonier.org':'Ligonier Ministries / Tabletalk',
 'london1644.info':'London 1644', 'lwf.org':'Love Worth Finding', 'michaeljkruger.com':'Michael J. Kruger / Canon Fodder',
 'monergism.com':'Monergism', 'onthewing.org':'On the Wing', 'penelope.uchicago.edu':'LacusCurtius',
 'reformedontheweb.com':'Reformed on the Web', 'reformedreader.org':'The Reformed Reader',
 'romans45.org':'Phil Johnson’s Bookmarks / Romans45', 'sermonindex.net':'SermonIndex',
 'spurgeongems.org':'Spurgeon Gems', 'thecalvinist.net':'The Calvinist',
 'thegospelcoalition.org':'The Gospel Coalition / Themelios', 'truthforlife.org':'Truth For Life',
 'tyndale.tms.edu':'The Master’s Seminary Journal', 'tyndalebulletin.org':'Tyndale Bulletin',
 'zwemercenter.com':'Zwemer Center for Muslim Studies'}

# Specific rights descriptions are supported by retained policy or edition evidence.
# Other sources receive an explicit unresolved-policy statement, never an inferred licence.
KNOWN={
 'bible.helloao.org':('https://bible.helloao.org/docs/','The official Free Use Bible API describes unrestricted API use, including modification/commercial use, with changed translations renamed. Retain the specific historical commentary/translation identity and do not extend that statement to unrelated linked content.','Official JSON API chapter/commentary endpoints; metadata responses are distinguished from text-bearing chapters.','content/library/reports/campaign-reconciliation/sources/web-consultations.json'),
 'onthewing.org':('https://www.onthewing.org/Copyright.html','The official notice permits free personal use and prohibits sale for profit, with some reimbursement restrictions. It describes its modernization of public-domain works as public domain while requiring no modification, sale, fundraising or false authorship claims. Preserve the author, modernizer and original notice.','Official offered text/PDF reading editions.','content/library/reports/campaign-reconciliation/sources/evidence/onthewing.org/policy.html'),
 'sermonindex.net':('https://www.sermonindex.net/md/copying-permissions/','The official policy describes free personal/ministry and noncommercial sharing use; commercial packaging/sale is excluded. Retain each preacher/source identity and message integrity.','Official held written sermon page; an archive index is not itself a downloaded sermon corpus.','content/library/reports/campaign-reconciliation/sources/evidence/sermonindex.net/policy.html'),
 'crossway.org':('https://www.crossway.org/permissions/','Official permissions distinguish limited quotation from permissions required for larger reproduction/translation. The held public HTML pages retain publisher/author notices; no whole-book or blanket reuse licence is inferred.','Official public HTML pages recorded in the Kruger bibliography acquisition; these are not automatically books.','content/library/reports/campaign-reconciliation/sources/evidence/crossway.org/policy.html'),
 'github:textcreationpartnership':('https://github.com/textcreationpartnership/Texts','TCP CC0-1.0 encoded transcriptions; this does not cover facsimile images. Original TEI contributor/header credits remain attached.','The official TCP catalogue and per-text public repositories; EEBO/ECCO/Evans collection identifiers remain separate.','../sources/bulk-catalogues/tcp.json'),
 'github:lwalen':('https://github.com/lwalen/lbcf/blob/235da776742a7956ebb678ec236382813dbe2c33/LICENSE','CC0 dedication for the pinned repository witnesses; JSON and Markdown remain separate manifestations.','The pinned lwalen/lbcf public GitHub repository.','content/library/sources.json'),
 'github:nonlinearfruit':('https://github.com/NonlinearFruit/Creeds.json/blob/2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5/README.md','Recorded Unlicense applies only to eligible named files; listed exceptions, including Savoy, and modern translations need their own evidence.','The pinned NonlinearFruit/Creeds.json public repository.','content/library/sources.json'),
 'archive.org':('https://archive.org/services/docs/api/metadata.html','Edition-specific historical public-domain assessments and item notices are recorded. Public availability or an unrestricted item flag alone is not a blanket licence. Retain digitizing-library, sponsor, publisher and contributor metadata.','Official search/metadata/download APIs; institutional and microfilm collections; held existing TXT/EPUB/PDF and item metadata. No new OCR.','content/library/reports/reformed-baptist-overnight/'),
 'ccel.org':('https://ccel.org/about/copyright.html','Recorded personal/educational/non-profit electronic-edition terms; underlying historical text and CCEL markup/editorial material have distinct rights. Preserve book/translator/editor and CCEL notices.','The official author catalogue and offered ThML/XML, TXT and other recorded editions.','content/library/reports/modern-texts/ccel-expansion-policy-evidence.json'),
 'gutenberg.org':('https://www.gutenberg.org/policy/license.html','Recorded underlying U.S. public-domain editions plus the Project Gutenberg electronic licence/notices; do not describe the trademark or every edition as unrestricted.','Offline catalogue and documented robot-harvest/static mirrors; mirrorservice.org and mirrors.xmission.com are distribution channels for this source, not separate publishers.','content/library/sources.json'),
 'crosswire.org':('https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/','Each module’s mods.d DistributionLicense and copyright/credit fields govern the module. Held declarations include public domain; there is no blanket licence for all SWORD content.','Official mods.d catalogue and rawzip packages; text exports are derivatives, not additional books.','content/library/reports/reformed-baptist-overnight/RB03/acquisition-manifest.json'),
 'monergism.com':('https://www.monergism.com/monergism-copyright-permissions','Recorded freely offered personal study, family, church and classroom reading editions; restrictions on external republication and curated external corpora remain recorded. Preserve publisher, original author and edition notices.','Official complete free-ebook index and offered EPUB/PDF files; the whole-library page was checked and exposed no active ZIP link.','content/library/reports/modern-texts/monergism-library-policy-evidence.json'),
 'spurgeongems.org':('https://www.spurgeongems.org/about-us/','Recorded free, unchanged, attributed use; restricted permission rather than an unrestricted open licence. Preserve Spurgeon/source credit, numbered sermon identity, guest authors and named translators.','Official individual sermons, collected volume PDFs and Spanish translation catalogue.','content/library/reports/spurgeon/source-access.json'),
 'chapellibrary.org':('https://www.chapellibrary.org/literature','Official freely offered ebook editions; author, publisher, editor/abridgment and translator notices remain authoritative. Free downloads are distinguished from print ordering and from a general open licence.','Official public literature catalogue, multilingual book pages and offered EPUB/PDF download endpoints.','content/library/sources.json'),
 'truthforlife.org':('https://www.truthforlife.org/about/policies/','Recorded private noncommercial reading copies; preserve Alistair Begg, ministry and publication notices. No public hosting or AI-training permission is inferred.','Official written sermon/resource pages and offered reading files; bibliographic pages are not automatically complete transcripts.','content/library/reports/modern-texts/begg-policy-evidence.json'),
 'lwf.org':('https://www.lwf.org/about-us/contact-us/copyright-information','Recorded offered private reading copies; retain Adrian Rogers and Love Worth Finding copyright/credit notices. No open licence or broader redistribution grant is inferred.','Official offered transcript/resource PDFs.','content/library/reports/modern-texts/rogers-access.json'),
 'desiringgod.org':('https://www.desiringgod.org/permissions','Recorded personal/noncommercial permissions for John Piper resources have exceptions; other contributors and third-party/translation editions must retain their own notices. Contributor-wide policy coverage remains incomplete.','Official John Piper written message/article archive, free offered books and authorized translation pages.','content/library/reports/modern-texts/piper-access.json'),
 '9marks.org':('https://www.9marks.org/journal/archives/','Recorded historical journal issue permissions are conditional and issue-specific. Modern books can carry additional retrieval/distribution restrictions; no publisher-wide open licence is inferred.','Official offered journal PDFs and article pages; the bulk archive/API 403 was deferred without bypass.','content/library/sources.json'),
 'founders.org':('https://founders.org/journals/','Recorded offered issue PDFs/HTML and historical public-domain witnesses; modern journal contributors retain copyright. Issue and contributor notices remain authoritative; no blanket open licence.','Official journal archive, offered complete PDFs and public article/media API records.','content/library/sources.json'),
 'ligonier.org':('https://www.ligonier.org/copyright-policy','Existing policy evidence records hyperlink-based sharing and limits on re-upload/distribution, attribution, derivatives and revenue. Held Kruger HTML/Tabletalk pages retain contributor notices; no open licence is inferred.','Official Ligonier/learn pages and Tabletalk articles actually held.','content/library/sources.json'),
 'zwemercenter.com':('https://www.zwemercenter.com/','Three historic PDFs were officially offered for reading/download; two dated editions have recorded U.S. public-domain assessments. The undated ATS impression retains a narrower download-permission record and unresolved public reuse.','Official historic book PDFs, with impression and source notices preserved.','content/library/reports/islam-studies/acquisition-manifest.json'),
 'earlychristianwritings.com':('https://www.earlychristianwritings.com/','Named historical translations are identified in the LC01 manifest; historical underlying text does not establish a blanket website/markup licence.','Official offered HTML transcriptions; named Lightfoot/Roberts/Donaldson translators remain attached.','content/library/reports/letters-cited/LC01/acquisition-manifest.json'),
 'penelope.uchicago.edu':('https://penelope.uchicago.edu/Thayer/E/Roman/home.html','The LC01 record identifies the historical 1914 Rolfe translation and local reading copy; host presentation and notices remain separate from underlying text rights.','LacusCurtius official HTML historical texts.','content/library/reports/letters-cited/LC01/acquisition-manifest.json'),
}

EXTRA=[
 ('ebible','eBible.org','https://ebible.org/','USFM/USFX and edition copr.htm notices','Edition-specific copr.htm is authoritative: recorded public-domain declarations, Hindi IRV CC BY-SA 4.0, and separate annotation/edition qualifications remain intact. Credit each translation and its named rights holder.','../sources/ebible/'),
 ('openbible','OpenBible.info','https://www.openbible.info/','cross-reference TSV/ZIP, geographical data and topic-score ZIP','Recorded cross-references/topics CC BY; geographical dataset CC BY 4.0. Credit OpenBible.info. Topic verse quotations do not inherit dataset permission.','../sources/openbible/'),
 ('stepbible','STEPBible Data','https://github.com/STEPBible/STEPBible-Data','TIPNR proper-name/reference TXT','Recorded CC BY 4.0 source data; retain STEP Bible / Tyndale House credit and the dataset licence/header.','../sources/stepbible/'),
 ('theographic','Theographic Bible Metadata','https://github.com/robertrouse/theographic-bible-metadata','repository ZIP/CSV/JSON','Recorded CC BY-SA 4.0; credit Robert Rouse/Theographic and retain share-alike notice.','../sources/theographic/theographic-bible-metadata-master/LICENSE'),
 ('openscriptures','Open Scriptures','https://github.com/openscriptures','Strong’s/Hebrew lexicon ZIP/XML and Hebrew annotation data','Recorded Strong’s text public domain; HebrewLexicon edition CC BY 4.0; separate Hebrew annotation data CC BY-SA. Preserve the specific dataset licence rather than extending one across the organization.','../sources/openscriptures/'),
 ('nasa','NASA GIBS / Blue Marble','https://earthdata.nasa.gov/','JPG imagery and request records','Recorded NASA public-domain imagery; retain NASA/Blue Marble attribution and request provenance. This is imagery, not library prose.','../sources/nasa-bluemarble/'),
 ('osm-protomaps','OpenStreetMap / Protomaps distribution','https://www.openstreetmap.org/copyright','PMTiles, map extracts, fonts and sprites','Recorded map data ODbL 1.0: © OpenStreetMap contributors; Protomaps distribution credit. Fonts SIL OFL, icons MIT and code licences are separate. This is mapping data, not book acquisition.','../AtlasTiles/README.md'),
 ('natural-earth','Natural Earth','https://www.naturalearthdata.com/about/terms-of-use/','GeoJSON world outlines','Recorded public-domain geography; retain source attribution. This is map geometry, not library prose.','content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md'),
 ('qwen-model','Qwen embedding model','https://huggingface.co/Qwen/Qwen3-Embedding-4B','cached model weights/tokenizer','Apache-2.0 model; current local configuration identifies Qwen3-Embedding-4B and its pinned revision. Retain model identity/licence. Model weights are implementation assets, not acquired theology texts.','knowledge/config.json'),
 ('lancedb-engine','LanceDB search engine','https://github.com/lancedb/lancedb','installed search software','Recorded Apache-2.0 core; preserve component licence notices. Software installation is not a book or text acquisition.','knowledge/README.md'),
 ('granite-model','IBM Granite browser embedding model','https://huggingface.co/ibm-granite/granite-embedding-small-english-r2','int8 ONNX weights/tokenizer and browser model pack','Recorded Apache-2.0 model and onnx-community conversion; retain both model/conversion identities, revision and licence. This is a software/model asset, not library prose.','../MeaningPack/'),
 ('onnx-runtime','ONNX Runtime Web','https://github.com/microsoft/onnxruntime','browser JavaScript/WASM engine','Recorded MIT runtime; retain Microsoft/component licence notices. This is an implementation asset, not an acquired book.','../MeaningPack/'),
 ('transformers-js','Hugging Face Transformers.js','https://github.com/huggingface/transformers.js','installed browser tokenizer/runtime package','Recorded Apache-2.0 package; retain component licence notices. Software is not a theological source or acquired book.','content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md'),
 ('owner-selection','Owner’s CypherPunk Faith selection','local owner repository','JSON snapshots of names and approved groupings','Owner-authored selection; public-domain historical reference inputs retain their own identities. No third-party open licence is invented for the owner’s compilation.','../sources/cypherpunk-faith/'),
]

def anchor(title):
    return re.sub(r'[^\w\- ]','',title.lower()).replace(' ','-')

def main():
    inventory=read(OUT/'source-inventory.json')
    consultations=read(OUT/'official-consultations.json') if (OUT/'official-consultations.json').exists() else {'items':[]}
    consult={x['source']:x for x in consultations['items']}
    original=(OUT/'SOURCES-before-reconciliation.md').read_text(encoding='utf-8-sig')
    # Retain a readable history with working relative links as well as exact original bytes.
    def rebase(match):
        label,target=match.groups()
        if re.match(r'(?:https?://|mailto:|#)',target):return match.group(0)
        target=target.strip('<>')
        path,separator,fragment=target.partition('#')
        destination=SITE/path
        if not destination.exists() and path.startswith('sources/') and (ROOT/path).exists():destination=ROOT/path
        relative=os.path.relpath(destination,OUT).replace('\\','/')
        return '['+label+']('+relative+(separator+fragment if separator else '')+')'
    history=re.sub(r'\[([^\]\n]*)\]\(([^)\n]*)\)',rebase,original)
    (OUT/'HISTORICAL-SOURCES.md').write_text('<!-- Historical snapshot; current source profiles are in Website/SOURCES.md. Older indexing restrictions are historical, not current private-intake gates. -->\n'+history,encoding='utf-8')
    lines=['# Sources','',
      'Reconciled **7 October 2026** from the held-file stocktake and retained acquisition/policy records. Each acquisition provider has one canonical profile below. Source aliases, mirrors and ministry CDN hosts are consolidated; edition and translator notices remain in the original manifests. Counts refer to the stocktake snapshot, not later downloads.', '',
      '**Private local indexing:** the owner authorizes importing and embedding all lawfully held text. Credit and licence fields remain metadata; no new evidenceOnly holds are created. This documentation grants no public hosting, redistribution or AI-training permission and does not override source terms. Missing policy evidence is recorded as a documentation task, not an automatic import hold.', '',
      '**Inventory distinctions:** complete text, articles/sermons, item metadata, catalogue caches, images, ZIP/module packages and extracted derivatives remain separate. An offered page, preview, worksheet or advertisement is not automatically a book. CrossWire packages are not separately embedded when their text export is used. Catalogue/API caches under `../sources/bulk-catalogues/` document discovery/access rather than additional works.', '',
      '[Source reconciliation report](content/library/reports/campaign-reconciliation/sources/REPORT.md) · [machine-readable source documentation](content/library/reports/campaign-reconciliation/sources/source-documentation.json) · [complete historical notes](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md).','',
      '## Canonical acquisition sources','']
    documents=[]; unresolved=[]
    for group in inventory['groups']:
        key=group['id']
        if key=='local-support':continue
        name=NAMES[key]
        canonical=key.replace('github:','github-').replace('.','-')
        evidence=[]
        if key in KNOWN:
            url,rights,channel,local=KNOWN[key]
            evidence.append(dict(url=url,local=local,basis='retained policy or edition evidence'))
            gap='Contributor/third-party and translation exceptions need edition-specific coverage; the existing Piper permission is not a grant for all contributors.' if key=='desiringgod.org' else None
        else:
            url=consult.get(key,{}).get('officialUrl') or ('https://'+key+'/')
            channel='Official offered pages/downloads actually recorded in the held-file manifests; recorded source aliases are retained in the source inventory.'
            rights='No source-wide reuse licence established in the available records. Preserve named author, editor, translator, publisher/ministry and all original copyright notices; source availability is not an open licence.'
            gap='Establish a scoped policy/edition notice from the official source; record the specific allowed use and exceptions without inventing a blanket licence.'
        consultation=consult.get(key)
        if consultation:
            evidence.append(dict(local='content/library/reports/campaign-reconciliation/sources/official-consultations.json',url=consultation['officialUrl'],basis=consultation['outcome']))
        formats=', '.join(sorted(group['formats']))
        lines += [f'<a id="source-{canonical}"></a>',f'### {name}','',
                  f'**Official channel:** [{url}]({url}). {channel}',
                  f"**Held formats:** {formats}; **{group['files']:,} files** including support/metadata representations. These are file counts, not book counts.",
                  f'**Licence/terms and credit:** {rights}',
                  '**Private use:** owner-authorized local indexing of lawfully held text; edition/source notices retained; public publication requires a separate decision.']
        links=[]
        for item in evidence:
            if item.get('local'):links.append('['+item['basis']+']('+item['local']+')')
        if consultation:
            for page in consultation.get('pages',[]):
                if page.get('path'):links.append('[official-page snapshot]('+os.path.relpath(page['path'],SITE).replace('\\','/')+')')
        if links:lines.append('**Evidence:** '+'; '.join(links)+'.')
        if gap:
            lines.append('**Unresolved evidence:** '+gap)
            unresolved.append(dict(sourceId=key,name=name,issue=gap,officialUrl=url,
                                   consultation=consultation.get('outcome') if consultation else 'existing source records only'))
        lines.append('')
        documents.append(dict(sourceId=key,canonicalAnchor='source-'+canonical,name=name,officialChannel=url,
            channelNote=channel,heldFormats=sorted(group['formats']),snapshotFileCount=group['files'],
            licenceAndCredit=rights,evidence=evidence,unresolvedEvidence=gap,
            privateLocalIndexAuthorization='Owner authorizes lawfully held text; credits remain metadata',
            publicPublicationAuthorized=False,sourceAliases=group['aliases'],acquisitionManifests=group['manifests']))
    lines += ['## Scripture, reference data, imagery and software sources','',
              'These sources are documented in the older source register outside the library stocktake. Their dataset/component counts are not added to the library-file totals.','']
    for key,name,url,formats,rights,local in EXTRA:
        lines += [f'<a id="source-{key}"></a>',f'### {name}','',
                  f'**Official channel:** {url if url.startswith("local") else "["+url+"]("+url+")"}. **Held formats:** {formats}.',
                  f'**Licence/terms and credit:** {rights}',
                  f'**Evidence:** [retained source/component records]({local}); exact request, checksum and edition tables remain in the historical notes. Private local use follows the standing authorization; this task adds no publication permissions.','']
        documents.append(dict(sourceId=key,name=name,officialChannel=url,heldFormats=formats,
                              licenceAndCredit=rights,evidence=[dict(local=local,basis='historical source/component records')],
                              publicPublicationAuthorized=False,unresolvedEvidence=None,stocktakeLibrarySource=False))
    # The data builders parse this registry in SOURCES.md, rather than the linked history.
    checksum_rows = re.findall(r'^\| \[[\w-]+\]\([^)]*\) \|.*\| [0-9a-f]{16} \|$', original, re.M)
    if not checksum_rows:
        raise ValueError('The original ledger has no build source checksum rows')
    lines += ['## Build source checksum registry', '',
      'The data builders read these source IDs and SHA-256 prefixes directly from this file. Restored from the pre-reconciliation ledger; licence and edition notes are retained. These rows describe files, not additional acquisition providers.', '',
      '| File | What | Licence | Checksum |', '|---|---|---|---|', *checksum_rows, '']
    lines += ['## Discovery-only sources and historical mission references','',
      '[The existing source registry](content/library/sources.json) also contains discovery/link-only providers such as PRDL, publisher catalogues and MLJ Trust. Discovery entries are not proof of acquired full texts or permission to collect them. The historic Muslim-primary-text comparison references remain historical research records, not approved teaching-source acquisitions.', '',
      'The headings below preserve earlier mission/reference anchors and link to the complete historical text. Historical counts and earlier indexing limitations describe those earlier runs; current private indexing follows the standing owner authorization above.','']
    headings=re.findall(r'^#{1,3} (.+)$',original,re.M)
    seen=Counter()
    for heading in headings:
        if heading=='Sources':continue
        slug=anchor(heading);index=seen[slug];seen[slug]+=1
        if index:slug+='-'+str(index)
        lines += ['## '+heading,'',
                  '[Preserved historical acquisition notes, URLs, hashes, mission reports and qualifications](content/library/reports/campaign-reconciliation/sources/HISTORICAL-SOURCES.md#'+slug+').','']
    result=dict(task='Source documentation',completedOn='2026-10-07',stocktakeSnapshot=inventory['stocktakeSnapshot'],
                canonicalSources=len(documents),libraryAcquisitionSources=sum(x.get('stocktakeLibrarySource',True) for x in documents),
                supplementalSources=len(EXTRA),unresolvedSourceEvidence=len(unresolved),historicalHeadingsPreserved=len(headings)-1,
                stocktakeFiles=inventory['libraryFiles'],localSupportFiles=4,noIntakeOrEmbeddingStarted=True,sources=documents)
    for name,value in [('source-documentation.json',result),('unresolved-evidence.json',dict(count=len(unresolved),items=unresolved))]:
        (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (SITE/'SOURCES.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    report=['# Source documentation completion','',
            f"Completed 7 October 2026. **{len(documents)} canonical source profiles: {result['libraryAcquisitionSources']} acquisition providers and {len(EXTRA)} scripture/data/imagery/software sources.** **{result['historicalHeadingsPreserved']} historical section headings preserved.**",'',
            f"Scope: **{inventory['libraryFiles']:,} library files** in the existing stocktake; support/metadata files are included in those totals and are not counted as books. Four unassigned local-support files are excluded from acquisition-provider counts.",'',
            f"Unresolved source-policy/edition-scope documentation: **{len(unresolved)} sources**; actionable details in `unresolved-evidence.json`. These are documentation gaps, not new evidenceOnly or import holds.",'',
            'Changed: `Website/SOURCES.md` now has one canonical profile per provider, explicit official channels, held formats, policy/edition evidence, credit obligations and private-local scope. Alias/CDN/mirror descriptions are consolidated. Historical claims and per-file tables remain in `HISTORICAL-SOURCES.md`; the 63 build checksum rows are also retained directly in `SOURCES.md` for the data builders. Exact original bytes are saved in `SOURCES-before-reconciliation.md`.', '',
            'Outputs: `source-documentation.json`, `source-inventory.json`, `official-consultations.json`, `unresolved-evidence.json`, `HISTORICAL-SOURCES.md`, `SOURCES-before-reconciliation.md`, and official-page snapshots under `evidence/`.', '',
            'Ownership respected: no catalog records, acquisition manifests, source originals, intake code, databases, download queues, schedulers or embedding workers changed. No intake/embedding started. No public text publication or new permissions inferred.','']
    (OUT/'REPORT.md').write_text('\n'.join(report),encoding='utf-8')
    summary={key:result[key] for key in ('task','completedOn','stocktakeSnapshot','canonicalSources','libraryAcquisitionSources','supplementalSources','unresolvedSourceEvidence','historicalHeadingsPreserved','noIntakeOrEmbeddingStarted')}
    summary.update(status='complete', changedFile='Website/SOURCES.md', outputDirectory='Website/content/library/reports/campaign-reconciliation/sources/',
                   outputs=['REPORT.md','summary.json','source-documentation.json','source-inventory.json','official-consultations.json','web-consultations.json','unresolved-evidence.json','HISTORICAL-SOURCES.md','SOURCES-before-reconciliation.md','evidence/'],
                   sourceDocumentationOnly=True, newEvidenceOnlyHolds=0)
    (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:result[k] for k in ('canonicalSources','libraryAcquisitionSources','supplementalSources','unresolvedSourceEvidence','historicalHeadingsPreserved')}))

if __name__=='__main__':main()
