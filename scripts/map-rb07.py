"""RB07 edition-specific primary/secondary reading map. Offline; no DB writes."""
import hashlib
import importlib.util
import json
import re
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB07'
CACHE = SITE / '.local/library/run-rb07-2026-10-07'
spec = importlib.util.spec_from_file_location('rb04map', SITE / 'scripts/map-rb04.py')
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def write(name, value):
    (R / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    new = read('acquisition-manifest.json')['files']
    held = read('holdings-audit.json')['files']
    chosen = {'asset-rb04-f9ea063dff9952ca931d', 'asset-expanded-d34dad3a1d294f76f629',
              'asset-text-gap-carey-pg11449-txt', 'asset-expanded-8a632e04a7d6c4f7f70b'}
    works, components, documents = [], [], []
    assets = {a['assetId']: a for a in held + new}
    new_ids = {a['assetId'] for a in new}
    for a in held + new:
        if a['assetId'] not in chosen | new_ids:
            continue
        d = a.get('derivedText') or a.get('auditDerivative')
        item = {k: a.get(k) for k in ('assetId', 'workId', 'title', 'author', 'url', 'relativePath', 'edition', 'completeness')}
        item.update(status='new-witness' if a['assetId'] in new_ids else 'already-held-reused',
                    originalSha256=a.get('sha256') or a['actualSha256'], derivative=d,
                    parentIntakeHeld=True, locations=[])
        if a['assetId'] == 'asset-expanded-8a632e04a7d6c4f7f70b':
            item.update(author='Horatius Bonar; unnamed daughter prepared condensation under his superintendence',
                        edition='Prefatory Note dated December 1870; Monergism offered digital edition',
                        identityCorrection='Held ledger says Andrew Bonar; actual byline is Horatius Bonar. Do not rewrite original bytes or silently relabel existing DB rows.')
        if a['relativePath'].endswith('.epub'):
            item['locations'] = shared.epub_locations(a)
        works.append(item)
    by_id = {w['assetId']: w for w in works}
    by_work = {w['workId']: w for w in works}
    full = by_id['asset-rb04-f9ea063dff9952ca931d']

    def lines(w):
        raw = (SITE / w['derivative']['path']).read_bytes()
        assert sha(raw) == w['derivative']['sha256']
        return raw.decode('utf-8').splitlines()

    def unit(w, lo, hi, title, author, role, prepare=False, date=None, note=None, recipient=None):
        ls = lines(w)
        assert 1 <= lo <= hi <= len(ls), (title, lo, hi, len(ls))
        text = '\n'.join(ls[lo-1:hi]) + '\n'
        u = dict(title=title, author=author, role=role, kind='edition-specific-reading-unit',
                 sourceLabel=ls[lo-1], locator=f'derivative-lines:{lo}-{hi}', lineStart=lo, lineEnd=hi,
                 readableWords=len(re.findall(r'\b[\w\x27-]+\b', text)), date=date,
                 recipient=recipient, editorialContext=note)
        w['locations'].append(u)
        if date or recipient:
            documents.append(dict(assetId=w['assetId'], originalSha256=w['originalSha256'], **u))
        if prepare:
            cid = 'component-rb07-' + sha((w['assetId'] + ':' + u['locator']).encode())[:20]
            p = CACHE / 'components' / (cid + '.txt')
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding='utf-8', newline='\n')
            components.append(dict(componentId=cid, parentWitnessAssetId=w['assetId'], title=title,
                author=author, role=role, date=date, recipient=recipient,
                originalSha256=w['originalSha256'], fullDerivativeSha256=w['derivative']['sha256'],
                sourceLocator=u['locator'], lineStart=lo, lineEnd=hi,
                componentText=dict(path=p.relative_to(SITE).as_posix(), sha256=sha(p.read_bytes()), wordCount=u['readableWords']),
                editorialContext=note, integrated=False, publicHostingAllowed=False, eligibleForScopedIntake=False,
                reviewRequired='Preserve source voice, nested quotes, editor/translator notes, dates, rights and cross-edition overlaps before aggregate intake.'))
            u['componentId'] = cid
        return u

    # New clean Judson biography: thirteen chapters; appendices are individual
    # primary/secondary documents, not additional books by the biographer.
    w = by_work['work-rb07-edward-judson-life']
    ls = lines(w)
    starts = [i+1 for i,s in enumerate(ls) if i > 400 and re.fullmatch(r'CHAPTER [IVXLC]+\.', s.strip())]
    assert len(starts) == 13
    for n,(lo,hi) in enumerate(zip(starts, [x-1 for x in starts[1:]]+[20850]),1):
        title = next(x.strip() for x in ls[lo:lo+10] if x.strip())
        unit(w,lo,hi,f'Chapter {n}. {title}','Edward Judson with quoted correspondents',
             'later-biography-with-edited-primary-extracts')
    for lo,hi,title,role in [(20855,21441,'Appendix A. Autobiographical Record of Dates and Events','primary-autobiographical-record'),
         (21442,21601,"Appendix B. Judson's First Tract for the Burmans",'primary-tract-English-witness-with-editorial-frame'),
         (21602,21878,'Appendix C. The Threefold Cord','primary-tract-English-witness-with-editorial-frame'),
         (21879,22000,'Appendix D. Advice to Missionary Candidates','primary-letter-in-later-edition')]:
        unit(w,lo,hi,title,'Adoniram Judson',role,True,
             date='1832-06-25' if lo==21879 else None,
             recipient='Foreign Missionary Association, Hamilton Literary and Theological Institution, New York' if lo==21879 else None,
             note='Editor admits some letter/journal condensation (1883 introduction). Source text is not the original manuscript; retain translation/editor apparatus.')
    for lo,hi,date,recipient,title in [(1805,1816,'1812-08-31','Thomas Baldwin','Letter acknowledging baptism writings'),
          (1818,1838,'1812-08-27','Carey, Marshman and Ward','Letter requesting believer baptism'),
          (1880,1927,'1812-09-01','Lucius Bolles','Appeal for Baptist missionary support')]:
        unit(w,lo,hi,title,'Adoniram Judson','primary-letter-as-quoted-in-biography',True,date,
             'Quoted text boundaries; a biographical witness, not an autograph transcription.',recipient)

    # Ward: all twenty-six letter essays; preserve OCR labels separately.
    w = by_work['work-rb07-ward-farewell-letters']
    starts=[324,478,1037,1199,1636,1949,2587,2935,3112,3371,3881,4628,4878,5204,5470,5724,6079,6456,6889,7198,7330,7557,7716,7895,8205,8454]
    subjects=['Return to England','Neglect of the command to preach to every creature','Future state of the unevangelized',
      'Hindoo philosophical system','Popular superstition','Female society in India','Cruelties connected with superstition',
      'Impurities connected with superstition','Concern for a future state','United prayer for divine influence',
      'Triumphs of the missionary cause','Number and character of converts','Progress of translations','Native schools',
      'Moral changes and Serampore College','Character of a converted Hindoo','Final triumphs of Christianity',
      'Advice to a missionary student','Origin of Mennonites','Mennonite worship','Mennonite doctrines',
      'Mennonite churches','Religion in Holland','Religion in America','Episcopal Church in America','Answers to prayer']
    # Topical shorthand follows the actual contents; the source recipient and
    # full heading govern citation.
    for n,(lo,hi,title) in enumerate(zip(starts,[x-1 for x in starts[1:]]+[8531],subjects),1):
        unit(w,lo,hi,f'Letter {n}. {title}','William Ward','primary-letter-essay-with-cultural-and-historical-claims',
             n in {2,3,10,11,12,13,14,15,17,18,26},
             note='1821 voyage edition; numbered source headings may be OCR-damaged. Source cultural generalizations and mission counts are historical claims, not current facts.')

    # Christmas Evans: translator/editor and memoir stay distinct from sermons.
    w = by_work['work-rb07-evans-sermons']
    starts=[2933,3239,3578,3921,4251,4585,4997,5485,5868,6193,6542,6784,7038,7369,7764,8011,8492,8696,9007,9326,9614,9881]
    ls=lines(w)
    for n,(lo,hi) in enumerate(zip(starts,[x-1 for x in starts[1:]]+[10236]),1):
        title=next(s.strip() for s in ls[lo:lo+5] if s.strip())
        unit(w,lo,hi,f'Sermon {n}. {title}','Christmas Evans; English translation witness',
             'translated-Baptist-sermon-with-source-scripture-quotes',True,
             note='1857 Leary & Getz edition; 1846 Advertisement distinguishes two translation hands. Joseph Cross does not endorse every theological view. Not Welsh originals or verbatim oral transcripts.')
    unit(w,492,2932,'Memoir and Portraiture','Joseph Cross; quoted Evans journals',
         'editor-biography-and-nested-primary-quotes')
    unit(w,10237,12839,'Extracts: nine selections; publisher catalogue and editorial notes','Evans, translator/editor and publisher: separate voices',
         'mixed-extracts-publisher-advertisements-and-editorial-notes',
         note='Extracts end at THE END line10840. Advertisements begin10847; FOOTNOTES begin12635. Publisher catalogue is not Evans-authored teaching.')
    w['endmatterScopes']=[
        dict(lineStart=10237,lineEnd=10840,role='nine-edited-extracts'),
        dict(lineStart=10847,lineEnd=12634,role='publisher-advertisements-not-author-teaching'),
        dict(lineStart=12635,lineEnd=12833,role='editor-and-translator-footnotes-not-sermon-author-prose')]
    note_starts=[i+1 for i,s in enumerate(ls) if i>=12635 and re.match(r'^\{[^}]+\}',s)]
    note_ranges={re.match(r'^(\{[^}]+\})',ls[lo-1]).group(1):(lo,hi)
                 for lo,hi in zip(note_starts,[x-1 for x in note_starts[1:]]+[12833])}
    for u in w['locations']:
        if not u['title'].startswith('Sermon '):
            continue
        refs=re.findall(r'\{[^}]+\}','\n'.join(ls[u['lineStart']-1:u['lineEnd']]))
        u['sourceNotes']=[dict(marker=marker,locator=f'derivative-lines:{note_ranges[marker][0]}-{note_ranges[marker][1]}',
            lineStart=note_ranges[marker][0],lineEnd=note_ranges[marker][1],
            role='separate-editor-or-translator-note-or-scripture-reference') for marker in dict.fromkeys(refs) if marker in note_ranges]
        if u.get('componentId'):
            next(c for c in components if c['componentId']==u['componentId'])['sourceNotes']=u['sourceNotes']

    # Carey biography is a later revised witness (mentions 1909). The appendix
    # differs from the 1885 witness and does NOT contain the full Agreement.
    w=by_work['work-rb07-smith-carey-life']
    ls=lines(w)
    starts=[i+1 for i,s in enumerate(ls) if re.fullmatch(r'CHAPTER [IVXLC]+',s.strip())]
    assert len(starts)==16
    for n,(lo,hi) in enumerate(zip(starts,[x-1 for x in starts[1:]]+[13084]),1):
        title=next(s.strip() for s in ls[lo:lo+8] if s.strip())
        if n == 12:
            title += ' ' + ls[8911].strip()
        unit(w,lo,hi,f'Chapter {n}. {title}','George Smith with quoted missionary documents',
             'later-revised-biography-with-primary-extracts')
    for lo,hi,title in [(13087,13236,'1827 Royal Charter of Serampore College'),
         (13237,13366,'Statutes and Regulations of Serampore College'),
         (13367,13378,'Treaty of purchase: Article VI, clause 2')]:
        unit(w,lo,hi,title,'Institutional document, as reproduced by Smith','historical-institutional-primary-document')

    # Institution transcription: only the first two appendix units end cleanly.
    w=by_work['work-rb07-carey-smith-appendix-1885']
    unit(w,2,405,'Appendix I. Serampore Form of Agreement','Serampore missionary brethren',
         'primary-missionary-agreement-in-later-transcription',True,'1805-10-07',
         '1805/1874 document reproduced in 1885 witness. Ten ordinal headings plus Finally; no signature block in this transcription. Textual defects require collation before quotation.')
    unit(w,406,439,'Appendix II. Bible Society report on translations','British and Foreign Bible Society; George Smith editor',
         'historical-report-as-reproduced',date='1885')
    unit(w,440,len(lines(w)),'Appendix III. Education memorandum: INCOMPLETE transcription','George Smith',
         'partial-historical-memorandum-not-complete-document',date='1867-11-29',
         note='Offered HTML stops mid-sentence: and it is. Do not claim complete appendix or prepare this truncated component for intake.')

    # Rice: sixteen chapters, narrator and quoted correspondence kept explicit.
    w=by_work['work-rb07-taylor-luther-rice']
    starts=[898,1325,1973,2654,3085,4091,4787,5522,7005,7530,8163,8758,10200,10643,11446,12107]
    for n,(lo,hi) in enumerate(zip(starts,[x-1 for x in starts[1:]]+[12894]),1):
        unit(w,lo,hi,f'Chapter {n}.','James B. Taylor with quoted Rice and others',
             '1840-biography-with-primary-letters-and-journals',
             note='Institutional commissioning disclosed in preface. Chapter XVI discusses Rice theology, responsibility and close communion; those views remain attributed.')

    unit(w,12897,13009,'Closing memorial verse, prompted by Rice dying words','Charles W. Denison',
         'third-party-memorial-poem-not-Rice-autobiographical-prose',
         note='Explicit byline at source start; poem ends before preservation stamps and endmatter OCR.')

    # Reuse the already-held Fuller witness. No new Fuller book download.
    for lo,hi,title,role,date in [(108069,108613,'Sermon III. Danger of Delay in Religious Concerns','primary-sermon','1791-04-27'),
      (144063,145319,'Thoughts on Preaching: four letters and observations','primary-ministry-letter-series',None),
      (145320,151738,'Memoirs of Samuel Pearce: five chapters and verse','Fuller-biography-with-Pearce-primary-quotes',None),
      (151739,153595,'Apology for Missions to India, Part I','primary-apologetic-work-with-opponent-quotes',None),
      (153596,155406,'Apology for Missions to India, Part II','primary-apologetic-work-with-opponent-quotes',None),
      (155407,157649,'Apology for Missions to India, Part III and appended testimonies','primary-apologetic-work-with-editorial-and-third-party-voices',None),
      (187918,188099,'Establishment of the Glasgow Missionary Society: letter to H. Muir','primary-missionary-letter',None),
      (188100,188260,'Importance of a Lively Faith in Missionary Undertakings','primary-missionary-essay','1799')]:
        unit(full,lo,hi,title,'Andrew Fuller with identified quoted voices',role,True,date,
             'Held 1846 edition; source running headers/OCR retained. Pearce speech/letters and opponents are not automatically Fuller-authored prose.')
    for lo,hi,title in [(145377,146089,'Pearce chapter I. Conversion and ministry'),
       (146090,147277,'Pearce chapter II. Missionary desire and responsibility'),
       (147278,148613,'Pearce chapter III. Ministry while remaining at home'),
       (148614,150246,'Pearce chapter IV. Final affliction'),
       (150247,151738,'Pearce chapter V. Reflections and verse')]:
        unit(full,lo,hi,title,'Andrew Fuller; Pearce correspondence and verse','biographical-chapter-with-nested-primary-documents')

    # Already-held Carey Enquiry, five sections rather than another format.
    w=by_id['asset-text-gap-carey-pg11449-txt']
    for n,(lo,hi,title) in enumerate(zip([120,266,773,1254,1463],[265,772,1253,1462,1688],
       ['Continuing obligation of the Great Commission','Historical attempts to evangelize','State of the world',
        'Practicability of missionary means','Duty of prayer and organized support']),1):
        unit(w,lo,hi,f'Section {n}. {title}','William Carey','primary-missionary-treatise',
             note='Held 1792 work. Historical population/mission tables are not current statistics; do not embed another format as a new work.')

    # Exact selected letter boundaries, reviewed in the 1892 edition. This is
    # a useful selection, not a claim to index every quoted letter in the books.
    w=by_work['work-rb07-serampore-letters']
    for lo,hi,author,date,recipient,title,note in [
      (1576,1719,'William Carey','1794-02-15','Andrew Fuller','Settlement and missionary work','Outside the title range 1800-1816; recipient printed at close.'),
      (2272,2445,'William Carey','1800-12-[unresolved-day]','John Williams','Mission, fellowship and Bengali Scripture','OCR date reads Dec. ^th; day unresolved. Preserve literal source; no invented exact day.'),
      (2481,2579,'William Carey','1801-11-11','John Williams','Missionary correspondence and translation','Date OCR II normalized to 11; edition introduction corroborates.'),
      (2582,2690,'William Carey','1802-06-15','John Williams','Shared gospel work and prayer',None),
      (2758,2784,'John Ryland','1802-05-08','John Williams','Commendation and funding for Chamberlain',None),
      (2826,2887,'William Rogers','1802-07-16','John Williams','Arranging missionary passage',None),
      (2890,2958,'William Rogers','1802-07-17','John Williams','Missionary passage terms',None),
      (3054,3137,'William Carey','1803-03-02','John Williams','Reception of Chamberlain and Scripture work',None),
      (3150,3193,'John Ryland','1803-03-05','John Williams','Missionary transportation and correspondence',None),
      (3479,3520,'Andrew Fuller','1803-12-05','John Williams','Commendation of missionary families',None),
      (3657,3871,'Andrew Fuller','1804-08-01','John Williams','Church renewal, mission and reported conversions','Body OCR year damaged; introduction line940 explicitly dates this letter Aug1 1804; includes Ward-reported dialogue.'),
      (3910,3944,'John Sutcliff','1804-08-29','John Williams','Thanks and exchange of association letters','Plate OCR ANDREW FULLER occurs inside this letter; not a byline. Retain artifact and role warning.'),
      (4068,4142,'Richard Mardon','1805-12-26','John Williams','Mission station and fellowship',None),
      (4392,4480,'Richard Mardon','1806-12-16','John Williams','Restrictions on missionary labors',None),
      (4697,4782,'John Ryland','1807-08-28','John Williams','Peace between nations and evangelical fellowship',None),
      (4811,4913,'William Carey','1809-12-07','John Williams','Native preachers and church growth',None),
      (4915,5079,'Joshua Rowe','1809-12-19','John Williams','Local mission, translation and accounts',None),
      (5081,5182,'John Chamberlain','1812-10-28 / postscript 26th','John Williams','Evangelism, vernacular translation and loss','Source opening Oct28 and closing 26th disagree; preserve both, no silent repair.'),
      (5322,5416,'William Carey','1812-10-20','John Williams','Judson believer baptism and support',None),
      (5422,5514,'Thomas Baldwin and Lucius Bolles; Daniel Sharp role unresolved in OCR signature block','1813-03-23',
       'John Williams, John Stanford, Archibald Maclay, Daniel Hatt and Cornelius Wyckoff, as printed',
       'Cooperation for Judson and Rice',
       'OCR line5506 places To beside DanL Sharp; possible column-order/signature ambiguity. Do not silently assign Sharp as recipient or third signatory without a clean textual witness; no scan inspection in this mission.')]:
        unit(w,lo,hi,title,author,'primary-correspondence-as-printed-with-OCR-artifacts',True,date,note,recipient)

    write('chapter-map.json',dict(mission='RB07',schemaVersion=1,works=works,
        unitCount=sum(len(w['locations']) for w in works),
        countRule='Chapters, sermons, letters, appendix documents, selected components and EPUB navigation can overlap; not unique works or verse coverage.'))
    write('selected-components.json',dict(mission='RB07',components=components,parentHoldsRequired=True,integrated=False))
    write('document-map.json',dict(mission='RB07',documents=documents,
        countRule='Selected source-attested document/date records, not an exhaustive correspondence corpus. Uncertain and conflicting dates remain literal.'))
    print('MAPPED',len(works),'witnesses;',sum(len(w['locations']) for w in works),'units;',len(components),'private slices;',len(documents),'dated/recipient records')


if __name__ == '__main__':
    main()
