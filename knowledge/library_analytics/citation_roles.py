"""Conservative positional roles; prose candidates are not verified exposition."""
import re
from array import array
from bisect import bisect_left

VERSION='la03-citation-roles-v1'
PROSE_KINDS={'library_text','library_review','reference','authored_document','study','guide'}
MODULE=re.compile(r'\s*\$\$\$')
REFS=re.compile(r'\s*Refs:',re.I)
PREFIX_CONTENT=re.compile(r'[^ \t\[\](){}:;*•]')
SUFFIX_CONTENT=re.compile(r'[^ \t\[\](){}:;.,*•]')


def line_bounds(block,start,end):
    # Index once; repeatedly scanning a newline-free book is quadratic.
    if '_line_offsets' not in block:block['_line_offsets']=array('I',(m.start() for m in re.finditer('\n',block['text'])))
    offsets=block['_line_offsets'];i=bisect_left(offsets,start);j=bisect_left(offsets,end)
    return (offsets[i-1]+1 if i else 0,offsets[j] if j<len(offsets) else len(block['text']))


def classify(kind,reference_kind,segments,reader,document_id=''):
    if reference_kind=='printed_index_entry':return 'scripture_index','parser-printed-index'
    if document_id.startswith('reference-library:theographic/'):
        return 'source_dataset_association','Theographic-source-proposal'
    if document_id.startswith('reference-library:openbible-topics/'):
        return 'reader_voted_association','OpenBible-reader-voted-score'
    if kind=='bible':return 'bible_text_address','document-kind-bible'
    if kind=='library_catalog':return 'catalogue_address','document-kind-catalogue'
    if kind in ('person','place'):return 'entity_record_address','document-kind-entity'
    if kind=='project_document':return 'documentation_address','document-kind-documentation'
    if len(segments)>1:return 'boundary_prose_candidate','verified-separated-source-spans'
    span=segments[0];b=reader.get(span);text=b['text'];a,z=span['start'],span['end']
    start,end=reader.line_bounds(b,a,z) if hasattr(reader,'line_bounds') else line_bounds(b,a,z)
    if MODULE.match(text,start,a):
        return 'module_entry_address','sword-raw-entry-marker'
    cut=a
    while cut>start and text[cut-1].isspace():cut-=1
    trailing=cut-start>=5 and text[cut-5:cut].casefold()=='refs:' and (cut-start==5 or not (text[cut-6].isalnum() or text[cut-6]=='_'))
    if REFS.match(text,start,end) or trailing:return 'cross_reference_list','explicit-Refs-list'
    # An isolated address is a heading/index candidate, not assured prose.
    if not PREFIX_CONTENT.search(text,start,a) and not SUFFIX_CONTENT.search(text,z,end):
        return 'isolated_address','isolated-address-line'
    if kind=='reference':return 'reference_record_candidate','inline-reference-record; attribution-unresolved'
    if kind in PROSE_KINDS:return 'prose_candidate','inline-grammar-match; attribution-unresolved'
    return 'unclassified_address','unsupported-document-role'
