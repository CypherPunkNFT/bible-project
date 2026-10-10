"""Restricted, versioned term data; no user-authored SQL or executable patterns."""
import json
import re
import unicodedata
from pathlib import Path


def normalize_with_offsets(text):
    # Combining sequences normalize together; every normalized code point maps
    # to the entire original sequence, including ligatures and decomposed accents.
    output, offsets = [], []
    i = 0
    while i < len(text):
        j = i+1
        while j < len(text) and unicodedata.combining(text[j]):
            j += 1
        value = unicodedata.normalize('NFKC', text[i:j]).casefold()
        for character in value:
            output.append(character); offsets.append((i,j))
        i = j
    return ''.join(output), offsets


def phrase_spans(text, phrase):
    normalized, offsets = normalize_with_offsets(text)
    words = unicodedata.normalize('NFKC', phrase).casefold().split()
    pattern = re.compile(r'(?<!\w)' + r'\s+'.join(re.escape(word) for word in words) + r'(?!\w)')
    for match in pattern.finditer(normalized):
        yield offsets[match.start()][0], offsets[match.end()-1][1]


def fts_phrase(text):
    if not isinstance(text,str) or not text.strip() or len(text)>120:
        raise ValueError('Invalid bounded phrase')
    # Only literal strings reach FTS, never raw expressions supplied in a pack.
    return '"' + text.replace('"','""') + '"'


def load_pack(path=None):
    file = Path(path or Path(__file__).parent / 'terms/english-v1.json')
    pack = json.loads(file.read_text('utf-8'))
    if set(pack) != {'version','language','rules','scope'} or pack['language'] != 'en':
        raise ValueError('Unsupported rule pack')
    ids = set()
    for rule in pack['rules']:
        allowed = {'id','topic','phrase','aliases','contextAny','exclude','positive','negative'}
        if set(rule) - allowed or not all(k in rule for k in ('id','topic','phrase','positive','negative')) or rule['id'] in ids:
            raise ValueError('Invalid/duplicate structured rule')
        ids.add(rule['id']); fts_phrase(rule['phrase'])
        for field in ('contextAny','exclude','aliases'):
            if any(not isinstance(x,str) or not x or len(x)>80 for x in rule.get(field,[])):
                raise ValueError('Unsupported rule condition')
    return pack


def matches(text, rule):
    seen=set()
    for start,end in (span for phrase in [rule['phrase'],*rule.get('aliases',[])] for span in phrase_spans(text,phrase)):
        if (start,end) in seen: continue
        seen.add((start,end))
        context = unicodedata.normalize('NFKC', text[max(0,start-180):end+180]).casefold()
        if any(x.casefold() in context for x in rule.get('exclude',[])):
            continue
        if rule.get('contextAny') and not any(x.casefold() in context for x in rule['contextAny']):
            continue
        yield start,end


def compile_rules(pack):
    return [(rule, ' OR '.join(fts_phrase(phrase) for phrase in [rule['phrase'],*rule.get('aliases',[])])) for rule in pack['rules']]
