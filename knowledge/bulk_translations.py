"""RB14: publisher translations, named edition credits, and held-original links."""
import collections,json,re,sys
from pathlib import Path
import fitz
import bulk_collect as b

REPORT=b.SITE/'content/library/reports/reformed-baptist-overnight/RB14'
LANG={'es','pt','zh','fr','ru','ar','hi'}
APPROVED=re.compile(r'Spurgeon|Bunyan|Watson|Owen|Flavel|Ryle|Boston|Pink|Baptist|Keach|Collins|Beddome|Charnock|Brooks|Manton|Goodwin|Burroughs',re.I)

def text(body,fmt):
    if fmt=='pdf':
        with fitz.open(stream=body,filetype='pdf') as doc:
            ids=sorted(set(range(min(8,len(doc))))|set(range(max(0,len(doc)-4),len(doc))))
            return '\n'.join(doc[i].get_text() for i in ids)
    if fmt=='epub':
        import zipfile,io
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            return '\n'.join(re.sub('<[^>]+>',' ',z.read(n).decode('utf-8','replace')) for n in z.namelist() if n.endswith(('.html','.xhtml','.htm')))
    return body.decode('utf-8','replace')

def enrich(record,body,originals,sermons):
    t=text(body,record['format'])
    if re.search(r'machine.translat|Google Translate|traducci[oó]n autom[aá]tica',t,re.I):raise ValueError('Machine translation notice; excluded')
    # Require an explicit edition translator role, never a name found in a quotation.
    credits=re.findall(r'(?:traducid[oa]\s+por|traducci[oó]n\s+(?:de|por|:)\s*|translated\s+(?:from[^\n]{0,50}?\s+)?by|traduit(?:e)?\s+(?:de\s+l[’\x27]anglais\s+)?par|tradu[cç][aã]o\s+(?:de|por|:)\s*|traduzido\s+por)([^\n;©]{3,110})',t,re.I)
    if not credits and re.search(r'Allan Roman y Thomas Montgomery[\s\S]{0,350}esfuerzo por traducir',t,re.I):
        credits=['Allan Roman','Thomas Montgomery']
    credits+=re.findall(r'TRADUC[ÇC][ÃA]O\s+DO\s+INGLEZ\s+POR\s*[—-]?\s*([^\n]{3,110})',t,re.I)
    names=[]
    for credit in credits:
        credit=re.split(r';|,?\s+(?:usad[oa]|used|con permiso|www\.|https?:|para |for )',credit,flags=re.I)[0].strip(' .,:')
        if re.fullmatch(r'[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][\wÀ-ÿ.\-]+(?:\s+(?:[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][\wÀ-ÿ.\-]+|de|dos|da)){1,5}',credit) and not re.search(r'Gospel|Library|Minister|Translation|Chapel|Biblia|Desiring',credit):names.append(credit)
    # Other scripts still require an explicit translator byline and a personal
    # name; ministry, society, team, anonymous, and machine credits are excluded.
    for pattern,personal in [
        (r'(?:译者|譯者)\s*[:：]\s*([^\n]{2,60})',r'[\u3400-\u9fff]{2,4}'),
        (r'(?:번역자|역자)\s*[:：]\s*([^\n]{2,60})',r'[\uac00-\ud7af]{3,4}'),
        (r'(?:Переводчик|Перевод\s+с\s+английского)\s*[:：]\s*([^\n]{3,90})',r'[А-ЯЁ][а-яё]{2,}(?:\s+[А-ЯЁ][а-яё]{2,}){1,3}'),
        (r'(?:अनुवादक)\s*[:：]\s*([^\n]{3,90})',r'[\u0900-\u097f]{2,}(?:\s+[\u0900-\u097f]{2,}){1,3}'),
        (r'(?:المترجم|ترجمة)\s*[:：]\s*([^\n]{3,90})',r'[\u0600-\u06ff]{2,}(?:\s+[\u0600-\u06ff]{2,}){1,4}')]:
        for candidate in re.findall(pattern,t):
            candidate=candidate.strip(' .،,')
            if re.fullmatch(personal,candidate) and not re.search(r'公会|公會|协会|協會|教会|教會|小组|小組|出版社|事工|匿名|팀|위원회|출판|फेलोशिप|मंत्रालय|دار|فريق|جمعية|مكتبة|مجهول',candidate):
                names.append(candidate);credits.append(candidate)
    if 'spurgeon' in record.get('author','').lower() and str(record.get('language','')).lower() in {'es','spanish'}:
        names=[n for n in names if n.casefold() in {'allan roman','allan román','thomas montgomery'}]
    if not names:raise ValueError('Named individual translator not identified in edition credits; deferred')
    original=originals.get(record.get('linkedParentCode',''))
    if 'spurgeon' in record.get('author','').lower():
        for m in re.finditer(r'(?:serm[oó\ufffd]n|sermon)\s*(?:n[uú]mero|no\.?|n[º°.]|#)?\s*([0-9]{1,4})\b',t[:1200] if original else t,re.I):
            if int(m[1]) in sermons:original=sermons[int(m[1])];break
    if not original:raise ValueError('No verified held original linked by publisher code or sermon number')
    return record|{'originalWorkId':original['workId'],'originalSourceId':original.get('sourceId'),
        'originalPath':original['path'],'originalSha256':original.get('sha256'),
        'translator':'; '.join(dict.fromkeys(names)),'translatorIdentityBasis':'Named translator role in publisher edition credits',
        'translatorCreditEvidence':'; '.join(credits),'translationQuality':'unreviewed','countAsBook':False}

def main():
    b.REPORT=REPORT;REPORT.mkdir(parents=True,exist_ok=True)
    progress=b.read(b.ROOT/'KnowledgeBase/embedding-progress.json',{})
    b.save(REPORT/'passages-before.json',progress)
    scripture=collections.Counter(x.get('lang') for x in b.read(b.SITE/'data/catalog.json')['translations'])
    originals={};held=[];library=collections.Counter();sermons={}
    for f in (b.SITE/'content/library/reports').rglob('acquisition-manifest.json'):
        if f.parent==REPORT:continue
        ledger=b.read(f,{})
        for x in (ledger if isinstance(ledger,list) else ledger.get('files',[])):
            if not isinstance(x,dict):continue
            p=Path(x.get('path') or '')
            if not p.is_file():continue
            held.append(x);library[str(x.get('language') or 'unknown').lower()]+=1
            if x.get('source')=='chapel' and str(x.get('language','en')).lower() in {'en','english'}:
                originals[x['sourceId']]=x|{'workId':x.get('workId') or 'work-chapel-'+x['sourceId']}
    assets=b.SITE/'content/library/catalog/assets'
    for f in assets.glob('*spurgeon*'):
        x=b.read(f);m=re.search(r'sermon-(\d+)',str(x))
        p=Path(x.get('relativePath') or '')
        if not p.is_absolute():p=b.ROOT/'sources'/p
        if m and p.is_file():sermons[int(m[1])]=x|{'workId':'work-spurgeon-sermon-'+m[1],'path':str(p)}
    # Assets may store numbered PDFs without sermon text in their identifiers.
    for f in (b.ROOT/'sources/library').rglob('chs*.pdf'):
        m=re.fullmatch(r'chs(\d+)\.pdf',f.name)
        if m and (b.SITE/'content/library/catalog/works'/('work-spurgeon-sermon-'+m[1].zfill(4)+'.json')).exists():
            sermons.setdefault(int(m[1]),{'workId':'work-spurgeon-sermon-'+m[1].zfill(4),'path':str(f)})
    b.save(REPORT/'language-selection.json',{'scriptureEditions':dict(scripture),'heldManifestLanguages':dict(library),'selected':sorted(LANG),'deferred':['ko'],'reason':'All selected languages have Scripture editions. Korean has no Scripture edition in catalog.json.'})
    candidates=[]
    linked={x['sourceId']:x for x in b.read(b.CACHE/'rb13-chapel-final-linked-editions.json',[])}
    for f in b.CACHE.glob('chapel-detail-*.json'):
        if f.name.endswith('.provenance.json'):continue
        x=b.read(f);lang=x.get('isoLangCode','').lower();author='; '.join(a['name'] for a in x.get('authors',[]))
        if lang not in LANG or not APPROVED.search(author):continue
        code=x['code'];fmt='pdf' if x.get('pdfUrl') else 'epub'
        if not x.get(fmt+'Url'):continue
        candidates.append(b.row('chapel',code,x['title'],author,'Protestant translated works',lang,
            url='https://www.chapellibrary.org'+x[fmt+'Url'],format=fmt,
            linkedParentCode=linked.get(code,{}).get('linkedParentCode'),
            licence='Publisher freely offered edition; edition translator permission and credits retained',
            contributor='Chapel Library / Mount Zion Bible Church',countAsBook=False))
    b.save(b.CACHE/'rb14-chapel-translations.json',candidates)
    print('candidates',len(candidates),'held originals',len(originals),'sermons',len(sermons),flush=True)
    existing={(x.get('source'),x.get('sourceId')):x for x in held}
    failures=[];linkedheld=0;new=[]
    for x in candidates:
        old=existing.get(('chapel',x['sourceId']))
        if not old:new.append(x);continue
        try:
            row=enrich(old|x|{'path':old['path'],'sha256':old['sha256'],'format':old['format']},Path(old['path']).read_bytes(),originals,sermons)
            row.update(acquisitionStatus='held-metadata-linked',campaignMission='RB14')
            b.append_manifest(row);linkedheld+=1
        except Exception as e:failures.append({'source':'chapel','sourceId':x['sourceId'],'url':x['url'],'error':str(e)})
    b.save(b.CACHE/'rb14-chapel-new.json',new)
    acquire=b.acquire
    def translated(x,client):
        row,body=acquire(x,client)
        if row.get('alreadyHeld'):return row,body
        return enrich(row,body,originals,sermons),body
    b.acquire=translated
    result=b.collect('chapel',{'cataloguePath':str(b.CACHE/'rb14-chapel-new.json'),'approvedCollection':True,'deferHardDownloads':True},0)
    failures+=result['failures']
    b.save(REPORT/'failed-downloads-todo.json',{'policy':'No retries; missing translator/original links excluded','items':failures})
    b.save(REPORT/'translation-summary.json',{'candidates':len(candidates),'newFiles':result['downloaded'],'heldFilesLinked':linkedheld,'newBooks':0,'failures':len(failures),'bytes':result['bytes']})
    print('COMPLETE',result['downloaded'],linkedheld,len(failures),flush=True)

if __name__=='__main__':main()
