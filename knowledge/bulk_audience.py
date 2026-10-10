"""Catalogue-based audience metadata for RB13 originals; no invented editorial changes."""
import re,json

def enrich(record, filters, body=None):
    if filters.get('audienceProfile')!='rb13':return record
    if isinstance(record.get('sourceMetadata'),dict):
        record.setdefault('description',record['sourceMetadata'].get('description',''))
    text=' '.join(str(record.get(k,'')) for k in ['title','subjects','description','topics','audience'])
    audience=set(record.get('audiences',[]))
    if re.search(r'child|children|boys|girls|babes|sunday.?school|sabbath.?school|divine songs',text,re.I):
        audience.update(['children','parents','teachers'])
    if re.search(r'young|youth|teen|rising generation',text,re.I):audience.update(['youth','parents','teachers'])
    if re.search(r'family|families|parent|father|mother|home|marriage',text,re.I):audience.update(['parents','teachers'])
    if re.search(r'catechis|catechet|ignorant|new believer|new christian|gospel|repent|faith|baptis|membership|obedien|christian life|christianity|conversion',text,re.I):
        audience.update(['new believers','youth','parents','teachers'])
    if re.search(r'catechis|catechet',text,re.I):audience.add('children')
    if not audience:audience.update(['new believers','parents','teachers'])
    record.update(audience='; '.join(sorted(audience)),audiences=sorted(audience),
        audienceBasis='Provider catalogue title/subjects/collection; intended-use classification, not an age certification')
    if record['source'] in {'chapel','founders','desiringgod'}:
        if record['source']=='chapel' and record['sourceId']=='cfba':
            record.update(editor='Erroll Hulse',editorStatus='Named adapter in Chapel Library description',
                adaptationChanges='Simplified Baptist catechism for young children, arranged as 134 short questions and answers.',
                adaptationStatus='Publisher-described adaptation; no local changes')
        if record['source']=='chapel' and record['sourceId']=='scat':
            record.update(editor='Charles H. Spurgeon',editorStatus='Named editor in Chapel Library description',
                adaptationChanges="1855 editing of the Baptist Catechism; shortened explanations of the Ten Commandments and the Lord's Prayer.",
                adaptationStatus='Publisher-described historical adaptation in modern offered edition; no local changes')
        record.setdefault('editor',None)
        record.setdefault('adaptationChanges',None)
        record.setdefault('editorStatus','Not stated in supplied catalogue/edition notices')
        record.setdefault('adaptationStatus','No adaptation stated in supplied catalogue; original contemporary work or reprint')
        if record.get('linkedParentCode') and not record.get('adaptationChanges'):
            record.update(adaptationChanges='Publisher-linked language edition ('+str(record.get('language') or 'language stated in source metadata')+') of '+record['linkedParentCode']+'; detailed editorial change list not supplied.',
                adaptationStatus='Language-edition relationship supplied by publisher; no local translation or rewriting')
        if re.search(r'modern english',record.get('title',''),re.I) and not record.get('adaptationChanges'):
            record.update(adaptationChanges='Modern-English rendering, as stated in the publisher title; detailed change list not supplied.',
                adaptationStatus='Publisher-labelled modern-English adaptation; no local changes')
        notes=record.get('editionNotes','')+' '+record.get('description','')
        if body and record.get('format')=='pdf':
            try:
                import fitz
                with fitz.open(stream=body,filetype='pdf') as doc:
                    notes+='\n'+'\n'.join(doc[i].get_text() for i in range(min(6,len(doc))))
            except Exception:pass
        if body and record.get('format')=='html':
            notes+=' '+re.sub(r'<[^>]+>',' ',body[:200000].decode('utf-8','replace'))
        if body and record.get('format')=='json':
            try:
                chapters=json.loads(body)
                notes+=' '.join(re.sub(r'<[^>]+>',' ',x.get('content',{}).get('rendered',''))
                    for x in chapters[:6] if isinstance(x,dict))
            except (ValueError,TypeError):pass
        editor=re.search(r'(?:edited|adapted|revised|abridged|modernized|modernised)\s+by\s+([^\n.;]{3,100})',notes,re.I)
        if editor:
            record['editor']=editor[1].strip();record['editorStatus']='Stated in source edition notices'
        changes=re.findall(r'[^\n.!?]{0,110}\b(?:adapted|abridged|modernized|modernised|updated language|simplified|revised edition|revised and|originally published|translated|translation)[^\n.!?]{0,160}',notes,re.I)
        if changes:
            record['adaptationChanges']='; '.join(dict.fromkeys(x.strip() for x in changes))[:1800]
            record['adaptationStatus']='Source edition statements retained verbatim; no local adaptation'
        record['editorialMetadataBasis']='Provider description and existing first-six-page PDF text/HTML edition notices; absent details left null'
    if isinstance(record.get('derivedText'),dict):
        record['derivedText'].update({k:record.get(k) for k in ['url','title','author','licence','audience',
            'audiences','language','contributor','credit','editor','editorStatus','adaptationChanges','adaptationStatus']})
    return record
