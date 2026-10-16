"""Sections from existing extraction locators and exact text markers."""
import re
import hashlib
from pathlib import Path
from xml.etree import ElementTree

VERSION = 'la02-structure-v1'
HEADINGS = re.compile(r'^\s*(?:CHAPTER|BOOK|SERMON|SECTION|PART|CONTENTS|APPENDIX)\b[^\n]{0,150}$',re.I|re.M)
PAGES = re.compile(r'^\[Source page ([^\]\n]+)\]',re.M)


def sections(block):
    locator = block.get('locator') or 'unrecorded locator'
    if block.get('coordinate') == 'corpus-chunk':
        kind = 'corpus-locator'
    elif block.get('page') is not None:
        kind = 'extraction-pdf-page'
    elif locator.startswith('EPUB section '):
        kind = 'extraction-epub-section'
    else:
        kind = 'extraction-block'
    yield {'kind':kind,'locator':locator,'label':locator,'start':0,'end':len(block['text']),
           'page_ordinal':block.get('page'),'printed_page_label':None,'status':'recorded-extraction-structure'}
    for match in PAGES.finditer(block['text']):
        yield {'kind':'printed-page-marker','locator':locator,'label':match.group(1),'start':match.start(),'end':match.end(),
               'page_ordinal':None,'printed_page_label':match.group(1),'status':'recorded-marker-label; no reader-page mapping'}
    for match in HEADINGS.finditer(block['text']):
        yield {'kind':'heading-candidate','locator':locator,'label':match.group().strip(),'start':match.start(),'end':match.end(),
               'page_ordinal':None,'printed_page_label':None,'status':'literal-heading-pattern; not a canonical section identity'}


def xml_sections(path,expected_sha,max_bytes=64*1024*1024):
    """Original-markup locators, kept distinct from cached-text offsets."""
    path = Path(path)
    if path.suffix.lower() != '.xml': return [],None
    if not path.is_file(): return [],'original-xml-unavailable'
    if path.stat().st_size > max_bytes: return [],'original-xml-over-size-bound'
    raw = path.read_bytes()
    actual = hashlib.sha256(raw).hexdigest()
    if not expected_sha or actual != expected_sha: return [],'original-xml-hash-not-verified'
    try:
        root = ElementTree.fromstring(raw)
    except ElementTree.ParseError as exc:
        return [],'original-xml-parse-unsupported:' + str(exc)[:120]
    result = []
    def name(tag): return tag.rsplit('}',1)[-1] if isinstance(tag,str) else ''
    def walk(node,xpath,in_body=False):
        local = name(node.tag).lower()
        in_body = in_body or local in ('body','text','div','div1')
        if in_body and (local in ('head','pb','page') or re.fullmatch('div[0-9]*',local)):
            label = (''.join(node.itertext()).strip()[:300] if local == 'head' else node.get('n') or node.get('type') or local)
            result.append({'kind':'xml-' + local,'locator':xpath,'label':label,
                           'xml_id':node.get('{http://www.w3.org/XML/1998/namespace}id') or node.get('id'),
                           'printed_page_label':node.get('n') if local in ('pb','page') else None,
                           'source_path':str(path),'source_sha256':actual,'coordinate':'original-xml-xpath',
                           'status':'verified-original-markup; no inferred cache/chunk alignment'})
        counts = {}
        for child in node:
            tag = name(child.tag)
            if not tag: continue
            counts[tag] = counts.get(tag,0)+1
            walk(child,xpath+'/'+tag+'['+str(counts[tag])+']',in_body)
    try:
        walk(root,'/'+name(root.tag)+'[1]')
    except RecursionError:
        return [],'original-xml-nesting-over-recursion-bound'
    return result,None
