"""First-token dispatch preserving longest-first literal rule semantics."""
import re
import unicodedata

WORDS=re.compile(r'\w+',re.UNICODE)
def key(word):return word.casefold().replace('i\u0307','i').replace('ı','i')

class FastMatcher:
    def __init__(self,rules):
        phrases={};self.dispatch={}
        for r in rules:
            for phrase in [r['phrase'],*r.get('aliases',[])]:phrases.setdefault(phrase.casefold(),[]).append(r)
        for phrase,rs in sorted(phrases.items(),key=lambda p:(-len(p[0]),p[0])):
            first=WORDS.match(phrase)
            if not first:raise ValueError('Rule phrase must begin with a word')
            pattern=re.compile(r'(?<!\w)'+r'\s+'.join(re.escape(w) for w in phrase.split())+r'(?!\w)',re.I)
            self.dispatch.setdefault(key(first.group()),[]).append((pattern,rs))
    def extract(self,text,language):
        if language not in ('en','enm'):return []
        hits=[];consumed=0
        for word in WORDS.finditer(text):
            if word.start()<consumed:continue
            candidates=self.dispatch.get(key(word.group()))
            if not candidates:continue
            for pattern,rules in candidates:
                m=pattern.match(text,word.start())
                if not m:continue
                consumed=m.end()
                context=unicodedata.normalize('NFKC',text[max(0,m.start()-180):m.end()+180]).casefold()
                for r in rules:
                    if any(x.casefold() in context for x in r.get('exclude',[])):continue
                    if r.get('contextAny') and not any(x.casefold() in context for x in r['contextAny']):continue
                    hits.append((r['topic'],r['id'],m.start(),m.end(),m.group(),r['basis'],
                        'speaker/endorsement unresolved; vocabulary sense not adjudicated'))
                break
        return hits
