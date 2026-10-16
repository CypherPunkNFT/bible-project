"""Bounded CPU rules with literal attribution/qualification witnesses."""
import re
from .contract import CONFIG

# Sentence punctuation only; hard blank paragraphs prevent cross-paragraph attribution.
CLAUSE=re.compile(r'[^.!?]+(?:[.!?]+[\u201d\"\u2019]?|$)')
OBJECTION=re.compile(r'\b(?:objection(?:\s+\d+)?\s*[:.]?|it (?:may|might|will) be objected|some (?:say|argue|object)|you (?:will|may) say|an? objection)\b',re.I)
REPLY=re.compile(r'\b(?:I answer(?: that)?|I reply|I respond|we answer|reply to objection(?:\s+\d+)?|answer\s*:)\b',re.I)
REPORT=re.compile(r'\b(?:says|saith|said|writes|wrote|contends|asserts|argues|teaches|claims)\b',re.I)
NEG=re.compile(r'\b(?:not(?!\s+on(?:ly|ely|elie)\b)|never|neither|cannot|can\s+not|no\s+(?:man|one|person|longer))\b',re.I)
QUAL=re.compile(r'\b(?:unless|except(?:\s+that)?|only\s+if|provided\s+that|in\s+so\s+far\s+as|insofar\s+as|not\s+always|not\s+necessarily|only|if|although|though|however|but)\b',re.I)
STATEMENT=re.compile(r'\b(?:I (?:affirm|maintain|conclude|hold)|we (?:affirm|maintain|conclude)|is defined|means|therefore|because)\b',re.I)
QUOTES=re.compile(r'“([^”]*)”|"([^"\n]*)"',re.S)
NAME=re.compile(r'((?:(?:St\.|Saint|Dr\.|Mr\.)\s+)?[A-Z][a-zA-Zſ’\-]+(?:\s+[A-Z][a-zA-Zſ’\-]+){0,2})\s+(?:says|saith|said|writes|wrote|contends|asserts|argues|teaches|claims)\b')
BAD_NAMES={'He','She','It','This','That','They','I','We'}

def reported(norm):
    # First-person writing and the adjective "said" are not reported positions.
    cleaned=re.sub(r'\b(?:I|we)\s+(?:said|wrote|write)\b','',norm,flags=re.I)
    cleaned=re.sub(r'\b(?:the|these|those)\s+said\s+\w+','',cleaned,flags=re.I)
    return bool(REPORT.search(cleaned))

def clauses(text):
    """Yield source offsets, retaining original line wraps and punctuation."""
    for paragraph in re.finditer(r'(?:[^\n]|\n(?!\s*\n))+',text):
        for m in CLAUSE.finditer(paragraph.group()):
            value=m.group();left=len(value)-len(value.lstrip());right=len(value.rstrip())
            if right>left:yield paragraph.start()+m.start()+left,paragraph.start()+m.start()+right

def classify(text,context='',author=None):
    norm=text.replace('ſ','s');kind='statement';uncertainty=['rule-candidate; content not independently reviewed']
    if OBJECTION.search(norm):kind='objection'
    elif REPLY.search(norm):kind='reply'
    elif reported(norm):kind='reported-statement'
    elif re.search(r'\b(?:is defined|means)\b',norm,re.I):kind='definition'
    elif re.search(r'\bbecause\b',norm,re.I):kind='premise-candidate'
    elif re.search(r'\btherefore\b',norm,re.I):kind='conclusion-candidate'
    names=[m.group(1) for m in NAME.finditer(text) if m.group(1) not in BAD_NAMES]
    if kind=='objection':speaker=None;role='objector';basis='explicit-objection-cue';endorsement='not-endorsed'
    elif kind=='reported-statement':
        speaker=names[-1] if names else None;role='reported-speaker';basis='explicit-report-name' if speaker else 'unresolved-report-pronoun';endorsement='unresolved'
    else:
        speaker=author if author and ';' not in author else None;role='source-author-candidate' if speaker else 'unresolved-narrator';basis='captured-author-label' if speaker else 'unresolved-source-role';endorsement='unresolved'
        if speaker and re.search(r'\b(?:I|we)\s+(?:answer|reply|respond|affirm|maintain|conclude|hold)\b',norm,re.I):endorsement='candidate-author-assertion'
        uncertainty.append('document author label is not proof of narrator identity or endorsement')
    # A quote does not automatically transfer endorsement or authorship.
    quote_only=norm.startswith(('“','"')) or context.count('“')>context.count('”')
    if quote_only and kind not in ('objection','reported-statement'):
        speaker=None;role='quoted-speaker';basis='unresolved-quotation';endorsement='unresolved'
        uncertainty.append('quotation speaker/endorsement not established')
    if kind=='reported-statement':uncertainty.append('narrator and reported proposition may share this clause; no automatic endorsement')
    if re.search(r'\b(?:public domain book|copyright term|digitized by|digitised by|usage guidelines|scanned by Google)\b',norm,re.I):
        speaker=None;role='editor-or-provider-unresolved';basis='provider-boilerplate-cue';endorsement='unresolved';uncertainty.append('provider/front-matter text, not document author evidence')
    return {'kind':kind,'speaker_label':speaker,'speaker_role':role,'attribution_basis':basis,'endorsement':endorsement,
        'negation':'negation-cue' if NEG.search(norm) else 'no-negation-cue','uncertainty':uncertainty}

def extract(text,author=None):
    out=[];stats={'clauses':0,'unmarked_clauses':0,'oversize_clauses':0,'short_clauses':0}
    for a,b in clauses(text):
        stats['clauses']+=1;t=text[a:b];norm=t.replace('ſ','s')
        if len(t)>CONFIG['limits']['max_clause_characters']:stats['oversize_clauses']+=1;continue
        if len(t)<20:stats['short_clauses']+=1;continue
        if not any(p.search(norm) for p in [OBJECTION,REPLY,REPORT,NEG,QUAL,STATEMENT,QUOTES]):stats['unmarked_clauses']+=1;continue
        # Only the current paragraph prefix establishes open quotation context.
        prefix=text[max(text.rfind('\n\n',0,a)+2,a-1000,0):a]
        record={'start':a,'end':b,'text':t,**classify(t,prefix,author),'qualifications':[],'quotes':[]}
        for m in QUAL.finditer(norm):record['qualifications'].append({'start':a+m.start(),'end':b,'literal':text[a+m.start():b],'kind':'explicit-scope-suffix'})
        for m in QUOTES.finditer(t):
            qa,qb=a+m.start(),a+m.end();before=t[:m.start()];names=[n.group(1) for n in NAME.finditer(before) if n.group(1) not in BAD_NAMES]
            record['quotes'].append({'start':qa,'end':qb,'text':text[qa:qb],'kind':'quotation','speaker_label':names[-1] if names else None,'speaker_role':'quoted-speaker',
              'attribution_basis':'explicit-report-name' if names else 'unresolved-quotation','endorsement':'not-endorsed' if record['kind']=='objection' else 'unresolved',
              'negation':'negation-cue' if NEG.search(m.group().replace('ſ','s')) else 'no-negation-cue','uncertainty':['quotation is not endorsement; nested quotes and quoted Scripture identities unresolved']})
        out.append(record)
    return out,stats
