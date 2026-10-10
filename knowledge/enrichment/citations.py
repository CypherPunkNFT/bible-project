"""Conservative literal citations with original code-point spans; no edition inference."""
import re
import unicodedata

SHORT = {
 'gen':['Gen','Ge','Gn'], 'exo':['Ex','Exod','Exo'], 'lev':['Lev','Le'], 'num':['Num','Nu'], 'deu':['Deut','Dt'],
 'jos':['Josh','Jos'], 'jdg':['Judg','Jdg'], 'rut':['Ruth'], '1sa':['1 Sam','1 Sa'], '2sa':['2 Sam','2 Sa'],
 '1ki':['1 Kings','1 Kgs','1 Ki'], '2ki':['2 Kings','2 Kgs','2 Ki'], '1ch':['1 Chron','1 Chr','1 Ch'], '2ch':['2 Chron','2 Chr','2 Ch'],
 'ezr':['Ezra'], 'neh':['Neh'], 'est':['Esth','Est'], 'job':['Job'], 'psa':['Ps','Psa','Psal','Psalm','Psalms'],
 'pro':['Prov','Pr'], 'ecc':['Eccl','Eccles'], 'sng':['Song of Songs','Song of Solomon','Canticles','Cant'],
 'isa':['Isa','Is'], 'jer':['Jer'], 'lam':['Lam'], 'ezk':['Ezek','Eze','Ezk'], 'dan':['Dan'], 'hos':['Hos'],
 'jol':['Joel'], 'amo':['Amos'], 'oba':['Obad','Ob'], 'jon':['Jonah','Jon'], 'mic':['Mic'], 'nam':['Nah','Na'],
 'hab':['Hab'], 'zep':['Zeph'], 'hag':['Hag'], 'zec':['Zech'], 'mal':['Mal'], 'mat':['Matt','Mt'], 'mrk':['Mark','Mk'],
 'luk':['Luke','Lk'], 'jhn':['John','Jn'], 'act':['Acts','Ac'], 'rom':['Rom','Ro'], '1co':['1 Cor','1 Co'], '2co':['2 Cor','2 Co'],
 'gal':['Gal'], 'eph':['Eph'], 'php':['Phil'], 'col':['Col'], '1th':['1 Thess','1 Thes','1 Th'], '2th':['2 Thess','2 Thes','2 Th'],
 '1ti':['1 Tim','1 Ti'], '2ti':['2 Tim','2 Ti'], 'tit':['Titus','Tit'], 'phm':['Philem','Phlm'], 'heb':['Heb'],
 'jas':['James','Jas'], '1pe':['1 Pet','1 Pe'], '2pe':['2 Pet','2 Pe'], '1jn':['1 John','1 Jn'], '2jn':['2 John','2 Jn'],
 '3jn':['3 John','3 Jn'], 'jud':['Jude'], 'rev':['Rev','Revelation','Apocalypse'],
}
SHORT.update({key:SHORT[key]+aliases for key,aliases in {
    'deu':['Deuter','De'],'hos':['Ho'],'mat':['Math','Mtt'],'heb':['Hebr'],
    'col':['Colos'],'job':['Iob'],'jhn':['Iohn','Joh'],'1ki':['1 King','1 K'],
    '2ki':['2 King','2 K'],'jdg':['Iudg'],'jos':['Iosh'],
}.items()})


def numeral(value):
    if value.isdigit():
        return int(value)
    roman = value.upper()
    if not roman or not re.fullmatch(r'M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})', roman):
        raise ValueError('Invalid Roman numeral')
    numbers = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    return sum(-numbers[c] if i+1 < len(roman) and numbers[c] < numbers[roman[i+1]] else numbers[c] for i,c in enumerate(roman))


def normalize(value):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKC',value).casefold())


class CitationParser:
    version = 'literal-citations-v2.1'

    def __init__(self, books, bounds):
        self.bounds = bounds
        self.aliases = {}
        patterns = []
        for book in books:
            code = book['code'].lower()
            for alias in {book['name'], book['code'], *SHORT.get(code, [])}:
                variants = [alias]
                if alias[0:1] in ('1','2','3'):
                    variants += [('', 'I', 'II', 'III')[int(alias[0])] + alias[1:]]
                for value in variants:
                    self.aliases[normalize(value)] = code
                    words=value.split()
                    patterns.append((re.escape(words[0])+r'\.?\s*'+r'\s*'.join(re.escape(w) for w in words[1:])) if len(words)>1 and words[0] in ('1','2','3','I','II','III') else r'\s*'.join(re.escape(word) for word in words))
        book_pattern = '(?:' + '|'.join(sorted(set(patterns), key=len, reverse=True)) + ')'
        number = r'(?:\d{1,3}|[ivxlcdm]{1,8})'
        self.first = re.compile(r'(?<!\w)(?P<book>'+book_pattern+r')(?![A-Za-z])[:.]?\s*(?P<chapter>'+number+r')\s*[:.,]\s*(?:(?:ver(?:s|se)?|v)\.?\s*)?(?P<verse>'+number+r')(?![A-Za-z0-9])', re.I)
        self.range = re.compile(r'\s*[-–—]\s*(?:(?P<chapter>'+number+r')\s*[:.,]\s*)?(?P<verse>'+number+r')(?![A-Za-z0-9])', re.I)
        # Bare Roman I after a semicolon is commonly prose, not verse one.
        self.follow = re.compile(r'\s*[,;]\s*(?:(?P<chapter>'+number+r')\s*[:.]\s*)?(?P<verse>\d{1,3})(?![A-Za-z0-9])', re.I)
        self.follow_dot = re.compile(r'\s*\.\s*(?P<verse>\d{1,3})(?![A-Za-z0-9])')
        self.follow_chapter = re.compile(r'\s*[.,;]?\s*(?:c|ch|chap)\.?\s*:?\s*(?P<chapter>'+number+r')\s*(?:[:.,]\s*|\s+)(?P<verse>\d{1,3})(?![A-Za-z0-9])',re.I)
        self.chapter_only = re.compile(r'(?<!\w)(?P<book>'+book_pattern+r')(?![A-Za-z])(?P<dot>\.)?\s*(?P<explicit>chap(?:ter)?\.?\s+|ch\.\s*)?(?P<chapter>'+number+r')(?P<terminal>\.)?(?![A-Za-z0-9])',re.I)
        self.index_heading=re.compile(r'^\s*(?P<book>'+book_pattern+r')\s*$',re.I)
        self.index_entry=re.compile(r'^\s*(?P<chapter>\d{1,3}):(?P<verse>\d{1,3})(?:[-–—](?:(?P<ec>\d{1,3}):)?(?P<ev>\d{1,3}))?\s*$')

    def valid(self, book, chapter, verse, end_chapter, end_verse):
        return (chapter,verse) <= (end_chapter,end_verse) and all(
            1 <= v <= self.bounds.get((book,c),0) for c,v in ((chapter,verse),(end_chapter,end_verse)))

    def extract(self, text):
        found, rejected = [], []
        covered=[]
        for match in self.first.finditer(text):
            covered.append((match.start(),match.end()))
            book = self.aliases[normalize(match['book'])]
            try:
                chapter, verse = numeral(match['chapter']), numeral(match['verse'])
                dotted='.' in text[match.end('chapter'):match.start('verse')]
                if match['verse'].lower()=='i' and re.match(r'\s+[a-z]{2,}',text[match.end():]):
                    raise ValueError('Ambiguous Roman I followed by prose')
                cursor, components = match.end(), []
                end_chapter, end_verse = chapter, verse
                tail = self.range.match(text, cursor)
                if tail:
                    end_chapter = numeral(tail['chapter']) if tail['chapter'] else chapter
                    end_verse = numeral(tail['verse']); cursor = tail.end()
                components.append((chapter,verse,end_chapter,end_verse))
                # Joined verse lists are separate references, never invented ranges.
                for _ in range(20):
                    tail = self.follow.match(text, cursor)
                    if not tail: tail=self.follow_chapter.match(text,cursor)
                    if not tail and dotted: tail=self.follow_dot.match(text,cursor)
                    if not tail:
                        break
                    group=tail.groupdict()
                    chapter = numeral(group['chapter']) if group.get('chapter') else chapter
                    verse = numeral(tail['verse']); cursor = tail.end()
                    end_chapter, end_verse = chapter, verse
                    span = self.range.match(text, cursor)
                    if span:
                        end_chapter = numeral(span['chapter']) if span['chapter'] else chapter
                        end_verse = numeral(span['verse']); cursor = span.end()
                    components.append((chapter,verse,end_chapter,end_verse))
                literal = text[match.start():cursor]
                for c,v,ec,ev in components:
                    value = dict(book=book,chapter=c,verse=v,endChapter=ec,endVerse=ev,start=match.start(),end=cursor,literal=literal,
                                 edition='unknown',numbering='unspecified',rangeValidation='chapter/verse bounds of project canonical KJV register; not an edition alignment')
                    if self.valid(book,c,v,ec,ev):
                        found.append(value)
                    else:
                        rejected.append(value | {'reason':'invalid or reversed reference range'})
            except ValueError as error:
                rejected.append(dict(start=match.start(),end=match.end(),literal=match.group(),reason=str(error)))
        for match in self.chapter_only.finditer(text):
            if any(a<=match.start()<b for a,b in covered): continue
            # Require explicit chapter wording, or a printed abbreviation with a
            # terminal chapter period. "John III" could name a person/pope.
            if not match['explicit'] and not (match['dot'] and match['terminal']): continue
            if re.match(r'\s*[:.,-]\s*\d',text[match.end():]): continue
            book=self.aliases[normalize(match['book'])]
            try:
                c=numeral(match['chapter']); last=self.bounds.get((book,c),0)
                if not last: raise ValueError('Unknown chapter bounds')
                found.append(dict(book=book,chapter=c,verse=1,endChapter=c,endVerse=last,start=match.start(),end=match.end(),literal=match.group(),
                                  edition='unknown',numbering='unspecified',referenceKind='chapter',rangeValidation='explicit whole chapter, bounds of project canonical register; no edition alignment'))
            except ValueError as error:
                rejected.append(dict(start=match.start(),end=match.end(),literal=match.group(),reason=str(error)))
        # Printed Scripture indexes: the book heading is explicit evidence, and
        # only uninterrupted blank/numeric-reference lines inherit that heading.
        # Every result retains the entire original heading-to-entry source span.
        heading=None; offset=0
        for line in text.splitlines(keepends=True):
            value=line.strip(); book_line=self.index_heading.fullmatch(value)
            if book_line:
                heading=(self.aliases[normalize(book_line['book'])],offset+line.index(value))
            elif value and heading:
                entry=self.index_entry.fullmatch(value)
                if not entry:
                    heading=None
                else:
                    book,start=heading; c,v=int(entry['chapter']),int(entry['verse']); ec=int(entry['ec'] or c); ev=int(entry['ev'] or v)
                    end=offset+len(line.rstrip())
                    if self.valid(book,c,v,ec,ev) and not any(h['start']==start and h['end']==end and (h['book'],h['chapter'],h['verse'],h['endChapter'],h['endVerse'])==(book,c,v,ec,ev) for h in found):
                        found.append(dict(book=book,chapter=c,verse=v,endChapter=ec,endVerse=ev,start=start,end=end,literal=text[start:end],
                            edition='unknown',numbering='unspecified',referenceKind='printed_index_entry',indexEntry=value,
                            rangeValidation='explicit same-chunk index heading and uninterrupted numeric entry lines; canonical bounds only, no edition alignment'))
            offset+=len(line)
        return found, rejected


def section(locator):
    return re.sub(r'\s*[·]\s*part\s+\d+$', '', locator)


def boundary_citations(parser, left, right):
    if left['document_id'] != right['document_id'] or section(left['locator']) != section(right['locator']):
        return []
    tail, head = left['text'][-160:], right['text'][:160]
    join = len(tail)
    hits, _ = parser.extract(tail + ' ' + head)
    results = []
    for hit in hits:
        if hit['start'] < join and hit['end'] > join+1:
            segments = [dict(chunkId=left['id'],start=len(left['text'])-len(tail)+hit['start'],end=len(left['text'])),
                        dict(chunkId=right['id'],start=0,end=hit['end']-join-1)]
            results.append(hit | {'segments':segments,'joinSeparator':' ','boundaryNote':'Separate exact source spans; whitespace between stripped corpus chunks is reconstructed for parsing, not a contiguous printed quotation'})
    return results
