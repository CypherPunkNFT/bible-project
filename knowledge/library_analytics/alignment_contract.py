"""Versioned literal/whitespace/token maps, never cross-edition title matching."""
import re
from array import array
from bisect import bisect_left, bisect_right
from difflib import SequenceMatcher
from .section_contract import text_hash

VERSION = 'kr102-alignment-v1'
SPACE = re.compile(r'\s+')
TOKEN = re.compile(r'\w+|[^\w\s]', re.UNICODE)


def compact(text):
    return SPACE.sub('', text)


class Compact:
    """Piecewise whitespace deletion map in Unicode codepoints, not bytes."""
    def __init__(self, text):
        self.raw = text
        self.text = compact(text)
        self.starts, self.ends, self.normal, self.shifts = (array('Q') for _ in range(4))
        removed = 0
        for match in SPACE.finditer(text):
            self.starts.append(match.start()); self.ends.append(match.end())
            self.normal.append(match.start() - removed)
            removed += match.end() - match.start(); self.shifts.append(removed)

    def normalized(self, position):
        if not 0 <= position <= len(self.raw):
            raise ValueError('Position outside source text')
        index = bisect_right(self.starts, position) - 1
        if index < 0: return position
        before = self.shifts[index - 1] if index else 0
        return position - before - min(position - self.starts[index], self.ends[index] - self.starts[index])

    def original(self, position, end=False):
        if not 0 <= position <= len(self.text):
            raise ValueError('Position outside normalized text')
        index = (bisect_left if end else bisect_right)(self.normal, position) - 1
        return position + (self.shifts[index] if index >= 0 else 0)


class TextMap:
    """Monotone equal-prose islands with explicitly bounded diff fallback.

    Literal maps retain every character. Normalized maps delete whitespace only
    and remain approximate. Token islands retain equal case/punctuation; omitted
    or altered prose stays unresolved, rather than being stretched over gaps.
    """
    def __init__(self, source, target, parts=None, token_limit=30000):
        self.source, self.target = source, target
        self.runs = []
        self._run_ends = None
        self.source_compact = self.target_compact = None
        self.reason = None
        if source == target:
            self.runs = [(0, len(source), 0, len(target), 'literal')]
            self.method = 'literal-identity-v1'
            return
        if parts is not None:
            cursor, target_cursor, runs = 0, 0, []
            for body in parts:
                if not source.startswith(body, cursor):
                    gap = SPACE.match(source, cursor)
                    if gap: cursor = gap.end()
                if not source.startswith(body, cursor): break
                runs.append((cursor, cursor + len(body), target_cursor, target_cursor + len(body), 'literal'))
                cursor += len(body); target_cursor += len(body)
            else:
                if not source[cursor:].strip():
                    self.runs = runs; self.method = 'literal-ordered-parts-v1'
                    return
        self.source_compact, self.target_compact = Compact(source), Compact(target)
        if self.source_compact.text == self.target_compact.text:
            self.runs = [(0, len(self.source_compact.text), 0, len(self.target_compact.text), 'compact')]
            self.method = 'whitespace-only-monotone-v1'
            return
        self.method = 'bounded-equal-token-islands-v1'
        # A bound is a recorded deferral, not an invitation to run quadratic
        # whole-book character diff. Whitespace-only books never hit this bound.
        a, b = [], []
        for destination, text in ((a, source), (b, target)):
            for match in TOKEN.finditer(text):
                destination.append((match.group(), match.start(), match.end()))
                if len(destination) > token_limit:
                    self.reason = 'non-whitespace-change-exceeds-token-diff-bound'
                    return
        matcher = SequenceMatcher(None, [x[0] for x in a], [x[0] for x in b], autojunk=True)
        for i, j, count in matcher.get_matching_blocks():
            if not count: continue
            # Single common punctuation/words are not useful approximate anchors.
            if count < 3 and len(source) > 100: continue
            s0, s1 = a[i][1], a[i + count - 1][2]
            t0, t1 = b[j][1], b[j + count - 1][2]
            sn0, sn1 = self.source_compact.normalized(s0), self.source_compact.normalized(s1)
            tn0, tn1 = self.target_compact.normalized(t0), self.target_compact.normalized(t1)
            if self.source_compact.text[sn0:sn1] != self.target_compact.text[tn0:tn1]:
                raise ValueError('Token island is not equal non-whitespace prose')
            # Even a literal island is approximate when its larger context changed.
            self.runs.append((sn0, sn1, tn0, tn1, 'compact'))
        if not self.runs: self.reason = 'no-monotone-equal-prose-islands'

    def pieces(self, start, end, target_bounds):
        """Yield verified overlaps, clipped both to source section and target block.

        target_bounds are ordered (start,end,metadata). Source positions stay in
        their own representation; target positions stay in the target stream.
        """
        if not 0 <= start <= end <= len(self.source): raise ValueError('Invalid source span')
        if not self.runs: return
        ends = target_bounds.ends if isinstance(target_bounds, Bounds) else [item[1] for item in target_bounds]
        if self.source_compact is not None:
            low, high = self.source_compact.normalized(start), self.source_compact.normalized(end)
        else: low, high = start, end
        if self._run_ends is None: self._run_ends = [r[1] for r in self.runs]
        for run_index in range(bisect_right(self._run_ends, low), len(self.runs)):
            s0, s1, t0, t1, mode = self.runs[run_index]
            if s0 >= high: break
            a, b = max(low, s0), min(high, s1)
            if b <= a: continue
            ta, tb = t0 + a - s0, t0 + b - s0
            if mode == 'compact':
                raw_ta = self.target_compact.original(ta)
                raw_tb = self.target_compact.original(tb, end=True)
            else: raw_ta, raw_tb = ta, tb
            for block_index in range(bisect_right(ends, raw_ta), len(target_bounds)):
                block_start, block_end, metadata = target_bounds[block_index]
                if block_start >= raw_tb: break
                if mode == 'compact':
                    x = max(ta, self.target_compact.normalized(block_start))
                    y = min(tb, self.target_compact.normalized(block_end))
                    if y <= x: continue
                    ts, te = self.target_compact.original(x), self.target_compact.original(y, end=True)
                    ss = self.source_compact.original(s0 + x - t0)
                    se = self.source_compact.original(s0 + y - t0, end=True)
                    state = 'approximate'
                else:
                    ts, te = max(raw_ta, block_start), min(raw_tb, block_end)
                    ss, se = s0 + ts - t0, s0 + te - t0
                    state = 'exact'
                if not start <= ss <= se <= end or not block_start <= ts <= te <= block_end:
                    raise ValueError('Mapped interval escapes its source/target bounds')
                left, right = self.source[ss:se], self.target[ts:te]
                if (state == 'exact' and left != right) or compact(left) != compact(right):
                    raise ValueError('Mapped prose does not round trip')
                yield {'source_start':ss, 'source_end':se, 'target_start':ts-block_start,
                       'target_end':te-block_start, 'state':state, 'method':self.method,
                       'source_span_sha256':text_hash(left), 'target_span_sha256':text_hash(right),
                       'normalized_sha256':text_hash(compact(left)), 'meaningful_characters':len(compact(left)),
                       'target':metadata}


class Bounds(list):
    def __init__(self, values):
        super().__init__(values)
        self.ends = [item[1] for item in values]


def bounds(blocks):
    result, position = [], 0
    for block in blocks:
        end = position + len(block['text'])
        if end > position: result.append((position, end, block))
        position = end
    return Bounds(result)


SCHEMA = '''
CREATE TABLE IF NOT EXISTS alignment_runs(id TEXT PRIMARY KEY,state TEXT,created_at TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS alignment_scope(run_id TEXT,document_id TEXT,adapter TEXT,disposition TEXT,reason TEXT,descriptor_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS alignment_inputs(run_id TEXT,path TEXT,sha256 TEXT,size INTEGER,mtime_ns INTEGER,PRIMARY KEY(run_id,path));
CREATE TABLE IF NOT EXISTS reader_records(run_id TEXT,reader_id TEXT,original_sha256 TEXT,record_sha256 TEXT,record_json TEXT,path TEXT,file_sha256 TEXT,PRIMARY KEY(run_id,reader_id));
CREATE INDEX IF NOT EXISTS reader_original ON reader_records(run_id,original_sha256);
CREATE TABLE IF NOT EXISTS alignment_documents(run_id TEXT,document_id TEXT,state TEXT,sections INTEGER,chunk_rows INTEGER,reader_rows INTEGER,receipt_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS section_index(run_id TEXT,version_id TEXT,document_id TEXT,kind TEXT,heading TEXT,state TEXT,work_id TEXT,edition_id TEXT,coordinate TEXT,PRIMARY KEY(run_id,version_id));
CREATE INDEX IF NOT EXISTS alignment_section_document ON section_index(run_id,document_id);
CREATE INDEX IF NOT EXISTS alignment_section_coordinate ON section_index(run_id,coordinate,version_id);
CREATE TABLE IF NOT EXISTS corpus_documents(run_id TEXT,document_id TEXT,record_sha256 TEXT,record_json TEXT,chunk_stream_sha256 TEXT,source_binding TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS corpus_chunks(run_id TEXT,id TEXT,document_id TEXT,locator TEXT,characters INTEGER,text_sha256 TEXT,row_ordinal INTEGER,PRIMARY KEY(run_id,id));
CREATE INDEX IF NOT EXISTS captured_chunks_document ON corpus_chunks(run_id,document_id);
CREATE TABLE IF NOT EXISTS alignment_maps(run_id TEXT,document_id TEXT,coordinate TEXT,path TEXT,asset_sha256 TEXT,target_type TEXT,target_id TEXT,method TEXT,runs INTEGER,reason TEXT,PRIMARY KEY(run_id,document_id,coordinate,path,target_type,target_id));
CREATE TABLE IF NOT EXISTS section_chunks(run_id TEXT,version_id TEXT,segment_ordinal INTEGER,piece_ordinal INTEGER,chunk_id TEXT,source_start INTEGER,source_end INTEGER,chunk_start INTEGER,chunk_end INTEGER,state TEXT,method TEXT,source_span_sha256 TEXT,target_span_sha256 TEXT,normalized_sha256 TEXT,meaningful_characters INTEGER,PRIMARY KEY(run_id,version_id,segment_ordinal,piece_ordinal));
CREATE INDEX IF NOT EXISTS section_chunk_lookup ON section_chunks(run_id,chunk_id);
CREATE TABLE IF NOT EXISTS section_reader_spans(run_id TEXT,version_id TEXT,segment_ordinal INTEGER,reader_id TEXT,piece_ordinal INTEGER,page_index INTEGER,block_index INTEGER,source_start INTEGER,source_end INTEGER,reader_start INTEGER,reader_end INTEGER,state TEXT,method TEXT,source_span_sha256 TEXT,target_span_sha256 TEXT,normalized_sha256 TEXT,meaningful_characters INTEGER,page_path TEXT,page_sha256 TEXT,PRIMARY KEY(run_id,version_id,segment_ordinal,reader_id,piece_ordinal));
CREATE TABLE IF NOT EXISTS section_destinations(run_id TEXT,version_id TEXT,reader_id TEXT,state TEXT,route TEXT,location_state TEXT,reason TEXT,PRIMARY KEY(run_id,version_id,reader_id));
CREATE TABLE IF NOT EXISTS section_alignment_status(run_id TEXT,version_id TEXT,chunk_state TEXT,reader_state TEXT,navigation_state TEXT,meaningful_characters INTEGER,chunk_covered INTEGER,reader_covered INTEGER,reasons_json TEXT,PRIMARY KEY(run_id,version_id));
'''
