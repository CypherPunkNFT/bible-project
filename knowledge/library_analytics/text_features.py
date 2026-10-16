"""Streaming token counts and bounded lexical-reuse signatures, no model calls."""
import hashlib
import heapq
import re
import unicodedata
from collections import Counter,deque
from functools import lru_cache

VERSION='la03-text-features-v1'
WORDS=re.compile(r'[^\W_]+',re.UNICODE)
K=64
MAX_TERMS=50000
ANCHOR_MASK=31
WINDOW=8


def token(value):
    return value.casefold() if value.isascii() else unicodedata.normalize('NFKC',value).casefold()


@lru_cache(maxsize=65536)
def anchor(word):return int.from_bytes(hashlib.blake2b(word.encode(),digest_size=8).digest(),'big')


def phrase_hash(words):return hashlib.blake2b(' '.join(words).encode(),digest_size=16).hexdigest()


class Features:
    def __init__(self,bible_hashes=frozenset()):
        self.terms=Counter();self.total=self.lexical=self.untracked=0;self.digest=hashlib.sha256()
        self.buffer=bytearray();self.window=deque(maxlen=WINDOW);self.signatures={};self.heap=[]
        self.bible=bible_hashes;self.biblical_windows=0;self.candidate_windows=0
    def add(self,text,ordinal):
        for m in WORDS.finditer(text):
            word=token(m.group());self.total+=1
            self.buffer.extend(word.encode());self.buffer.append(0)
            if len(self.buffer)>8192:self.digest.update(self.buffer);self.buffer.clear()
            if len(word)<=40 and not word.isdigit():
                self.lexical+=1
                if word in self.terms or len(self.terms)<MAX_TERMS:self.terms[word]+=1
                else:self.untracked+=1
            self.window.append((word,ordinal,m.start(),m.end()))
            if len(self.window)<WINDOW or anchor(word)&ANCHOR_MASK:continue
            words=[v[0] for v in self.window];h=phrase_hash(words)
            self.candidate_windows+=1
            if sum(w.isdigit() for w in words)>2 or any(w in {'gutenberg','copyright','license','ebook'} for w in words):continue
            if h in self.bible:self.biblical_windows+=1;continue
            if h in self.signatures:continue
            value=int(h,16)
            if len(self.heap)>=K and value>=-self.heap[0]:continue
            if len(self.heap)>=K:
                old=-heapq.heappop(self.heap);self.signatures.pop(f'{old:032x}')
            heapq.heappush(self.heap,-value)
            self.signatures[h]={'phrase':' '.join(words),'token_end_ordinal':self.total,
                'first_block':self.window[0][1],'last_block':ordinal,'start':self.window[0][2],'end':m.end()}
    def result(self):
        self.digest.update(self.buffer);self.buffer.clear()
        return {'normalized_token_sha256':self.digest.hexdigest(),'tokens':self.total,'lexical_tokens':self.lexical,
                'tracked_tokens':sum(self.terms.values()),'unique_tracked_terms':len(self.terms),
                'vocabulary_complete':not self.untracked,'untracked_tokens':self.untracked,
                'sampled_windows':self.candidate_windows,'bible_windows_filtered':self.biblical_windows,
                'retained_signatures':len(self.signatures)}


def bible_baseline(db):
    values=set()
    for row in db.execute("SELECT text FROM verses WHERE edition='kjv' ORDER BY id"):
        window=deque(maxlen=WINDOW)
        for m in WORDS.finditer(row[0]):
            w=token(m.group());window.append(w)
            if len(window)==WINDOW and not anchor(w)&ANCHOR_MASK:values.add(phrase_hash(window))
    return values
