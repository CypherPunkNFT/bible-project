"""Located literal references using the existing parser on numeric candidates.

The accelerated scan retains the project's parser and bounds. A separate full
line scan preserves printed-index inheritance; windows never invent headings.
"""
import re
from knowledge.enrichment.citations import CitationParser, normalize, boundary_citations, SHORT

VERSION = 'la02-reference-windows-v5'
NUMBERS = re.compile(r'(?<!\d)\d{1,3}(?!\d)|(?<![A-Za-z])[ivxlcdm]{1,8}(?![A-Za-z])', re.I)
WORDS = re.compile(r'[A-Za-z]+|[123]',re.I)
PROSE = re.compile(r'\s+[a-z]{2,}')


class ReferenceScanner:
    def __init__(self, parser):
        self.parser = parser
        self.tails = set(parser.aliases)
        self.tails.update(normalize(a.split()[-1]) for values in SHORT.values() for a in values)
        self.tails.update(re.sub(r'^[123]','',a) for a in parser.aliases)
        self.tails.update(('solomon','songs'))

    def extract(self, text):
        found, rejected = {}, {}
        covered_until = 0
        for numeric in NUMBERS.finditer(text):
            # Book aliases have fewer than 80 non-space characters. Whitespace
            # is unbounded in the existing grammar, so do not truncate it.
            begin = max(0,numeric.start()-128)
            words = list(WORDS.finditer(text,begin,numeric.start()))
            window = 128
            while begin and len(words)<7:
                window *= 2
                begin = max(0,numeric.start()-window)
                words = list(WORDS.finditer(text,begin,numeric.start()))
            if words and words[-1].group().casefold() in ('chapter','chap','ch'):
                words.pop()
            if not words or normalize(words[-1].group()) not in self.tails: continue
            for length in range(min(5,len(words)),0,-1):
                label = normalize(''.join(w.group() for w in words[-length:]))
                start = words[-length].start()
                if start < covered_until: continue
                if label not in self.parser.aliases:
                    # Python's case-insensitive regex admits dotless I, but the
                    # existing alias normalizer may then discard that ordinal.
                    # Preserve the unsupported witness instead of crashing an
                    # entire document or guessing which numbered book it is.
                    if any(ord(c)>127 for c in text[start:numeric.start()]):
                        probe = self.parser.first.match(text,start)
                        if probe and probe.start('chapter')==numeric.start() and normalize(probe['book']) not in self.parser.aliases:
                            hit = {'start':start,'end':probe.end(),'literal':probe.group(),
                                   'reason':'unsupported-book-alias-normalization'}
                            rejected[(start,probe.end(),None,None,None,None,None,hit['reason'])] = hit
                            covered_until = probe.end()
                            break
                    continue
                first = self.parser.first.match(text,start)
                chapter = self.parser.chapter_only.match(text,start) if first is None else None
                match = first or chapter
                if not match or match.start('chapter') != numeric.start(): continue
                if first: covered_until = first.end()
                cursor = match.end()
                if first:
                    tail = self.parser.range.match(text,cursor)
                    if tail: cursor = tail.end()
                    dotted = '.' in text[first.end('chapter'):first.start('verse')]
                    for _ in range(20):
                        tail = self.parser.follow.match(text,cursor) or self.parser.follow_chapter.match(text,cursor)
                        if tail is None and dotted: tail = self.parser.follow_dot.match(text,cursor)
                        if tail is None: break
                        cursor = tail.end()
                        span = self.parser.range.match(text,cursor)
                        if span: cursor = span.end()
                # Only the selected reference and its necessary prose
                # lookahead belong in this parser call. An unrelated malformed
                # citation later in the paragraph must not abort this one.
                end = cursor
                if first and first['verse'].casefold()=='i':
                    # Preserve the original parser's unbounded whitespace
                    # lookahead for ambiguous Roman I followed by prose.
                    prose = PROSE.match(text,first.end())
                    if prose: end = max(end,prose.end())
                while end < len(text) and text[end].isalnum(): end += 1
                hits, failures = self.parser.extract(text[start:end])
                for collection, values in ((found,hits),(rejected,failures)):
                    for hit in values:
                        if hit['start'] != 0 or hit.get('referenceKind') == 'printed_index_entry': continue
                        hit = {**hit,'start':hit['start']+start,'end':hit['end']+start}
                        key = (hit['start'],hit['end'],hit.get('book'),hit.get('chapter'),hit.get('verse'),hit.get('endChapter'),hit.get('endVerse'),hit.get('reason'))
                        collection[key] = hit
                break
        heading = None
        offset = 0
        for line in text.splitlines(keepends=True):
            value = line.strip()
            alias = normalize(value) if len(value) <= 80 else ''
            book_line = self.parser.index_heading.fullmatch(value) if alias in self.parser.aliases else None
            if book_line:
                heading = (self.parser.aliases[normalize(book_line['book'])],offset+line.index(value))
            elif value and heading:
                entry = self.parser.index_entry.fullmatch(value)
                if not entry: heading = None
                else:
                    book,start = heading
                    c,v = int(entry['chapter']),int(entry['verse'])
                    ec,ev = int(entry['ec'] or c),int(entry['ev'] or v)
                    end = offset+len(line.rstrip())
                    if self.parser.valid(book,c,v,ec,ev):
                        hit = dict(book=book,chapter=c,verse=v,endChapter=ec,endVerse=ev,start=start,end=end,
                                   literal=text[start:end] if end-start<=4096 else '',
                                   literalOmitted=end-start>4096,edition='unknown',numbering='unspecified',referenceKind='printed_index_entry',
                                   indexEntry=value,rangeValidation='explicit same-block heading and uninterrupted entries; canonical bounds only')
                        key = (start,end,book,c,v,ec,ev,None)
                        if key not in found: found[key] = hit
            offset += len(line)
        return list(found.values()),list(rejected.values())

    def spans(self, text, hit):
        if hit.get('referenceKind') == 'printed_index_entry':
            head_end = text.find('\n',hit['start'],hit['end'])
            if head_end < 0: head_end = hit['end']
            return [(hit['start'],head_end),(hit['end']-len(hit['indexEntry']),hit['end'])]
        return [(hit['start'],hit['end'])]
