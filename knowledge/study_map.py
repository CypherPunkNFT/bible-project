"""Render the study inventory from read-only corpus and catalogue inputs.

Run from Website: python -m knowledge.study_map
No inference, network calls, source changes or embedding writes.
"""
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from .settings import load
from .store import connect


def cell(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')


def table(headers, rows):
    return '\n'.join(['| ' + ' | '.join(map(cell, headers)) + ' |',
                      '| ' + ' | '.join('---' for _ in headers) + ' |'] +
                     ['| ' + ' | '.join(map(cell, row)) + ' |' for row in rows])


def build():
    config = load()
    library = config['site_dir'] / 'content/library'
    vocabulary = json.loads((library / 'vocabulary.json').read_text(encoding='utf-8-sig'))
    subjects = {item['id']: item for item in vocabulary['subjects']}
    collections = {item['id']: item for item in vocabulary['collections']}
    works = [json.loads(path.read_text(encoding='utf-8-sig')) for path in sorted((library / 'catalog/works').glob('*.json'))]
    topic_counts = Counter(topic for work in works for topic in set(work.get('subjects', [])))
    collection_counts = Counter(category for work in works for category in set(work.get('collections', [])))
    assert set(topic_counts) <= subjects.keys(), 'Unknown subject IDs need reconciliation'
    assert set(collection_counts) <= collections.keys(), 'Unknown collection IDs need reconciliation'

    def ancestors(identifier):
        chain = []
        while identifier:
            if identifier in chain:
                raise ValueError('Topic hierarchy cycle: ' + identifier)
            chain.append(identifier)
            identifier = subjects[identifier].get('parent')
        return list(reversed(chain))

    paths = {key: ancestors(key) for key in subjects}
    with connect(config['db'], readonly=True) as db:
        build_id = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        edges = dict(db.execute('SELECT relation,COUNT(*) FROM edges GROUP BY relation'))
        ref_count, ref_docs = db.execute('SELECT COUNT(*),COUNT(DISTINCT document_id) FROM references_to').fetchone()
        ref_kinds = list(db.execute('SELECT d.kind,COUNT(*) FROM references_to r JOIN documents d ON d.id=r.document_id GROUP BY d.kind ORDER BY COUNT(*) DESC'))

    meanings = {
        'cross_reference': ('Passage -> passage/range', 'OpenBible source cross-reference; KJV numbering, range and votes retained', 'Imported OpenBible data'),
        'parent': ('Person -> their parent', 'A person has the target as a parent; Aaron -> Amram is an actual example', 'Imported STEP-based people data'),
        'child': ('Person -> their child', 'A person has the target as a child', 'Imported STEP-based people data'),
        'sibling': ('Person -> their sibling', 'A recorded sibling relationship', 'Imported STEP-based people data'),
        'spouse': ('Person -> their spouse', 'A recorded spouse relationship', 'Imported STEP-based people data'),
    }
    pieces = [
        '# Bible Project study map: relationships, collections and topics',
        f'Generated from local inputs at {datetime.now(timezone.utc).isoformat()}. Corpus build: `{build_id}`. Vocabulary date: {vocabulary["updated"]}.',
        '**Purpose:** a tabular map for deliberate study. Tables are the primary interface; a graph is an optional exploration of selected rows. This inventory is generated from actual inputs. Proposed interface work is specified in [STUDY-TABLES.md](STUDY-TABLES.md).',
        '## 1. Relationships already stored',
        table(['Stored relation', 'Rows', 'Direction', 'Meaning', 'Evidence source'],
              [(key, f'{count:,}', *meanings.get(key, ('Unclassified', 'Needs review', 'Inspect source'))) for key, count in sorted(edges.items(), key=lambda item: -item[1])]),
        f'**Total: {sum(edges.values()):,} directed rows.** These are not unique undirected pairs. Reciprocal family entries and passage links are separate rows. Parent/child totals need not match; preserve and audit the imported asymmetries rather than manufacture inverse edges. These rows do not represent extracted doctrinal agreement, influence or topic similarity.',
        '## 2. Separate document-to-Scripture register',
        f'`references_to` contains **{ref_count:,} rows across {ref_docs:,} distinct documents**, separate from the relationship total above. Here “document” includes a person/place record or authored study record; it does not necessarily mean a book or sermon.',
        table(['Source record kind', 'Reference rows'], [(kind, f'{count:,}') for kind, count in ref_kinds]),
        'These references are imported from structured records. They are not a completed citation-extraction pass over all library bodies. Exact reference, numbering basis, source record and future located evidence must remain inspectable.',
        '## 3. Eight collection categories',
        table(['Collection ID', 'Collection', 'Scope', 'Direct formal-catalogue works'],
              [(key, c['label'], c['definition'], f'{collection_counts[key]:,}') for key, c in collections.items()]),
        f'Counts are assignments in the **{len(works):,}-work formal catalogue**, not downloads, body-text matches or the larger acquisition bibliography. A work can belong to multiple collections. Collections describe library organization; subjects below describe what a work discusses. Do not treat these as one hierarchy.',
        '## 4. Topic-family overview',
        table(['Family', 'Defined topics including heading', 'Topics below the heading'],
              [(s['label'], sum(path[0] == key for path in paths.values()), '; '.join(subjects[k]['label'] for k, path in paths.items() if path[0] == key and k != key)) for key, s in subjects.items() if s.get('parent') is None]),
        f'**{len(subjects)} topic definitions**, including {sum(s.get("parent") is None for s in subjects.values())} root headings. Parentage is an editorial vocabulary relationship, not a new finding from the texts. A child topic does not yet create inherited work assignments.',
        '## 5. Complete topic register',
        table(['Topic ID', 'Hierarchy', 'Definition', 'Aliases', 'Direct catalogue works'],
              [(key, ' > '.join(subjects[k]['label'] for k in paths[key]), s['definition'], '; '.join(s.get('aliases', [])) or 'None recorded', f'{topic_counts[key]:,}') for key, s in sorted(subjects.items(), key=lambda item: [subjects[k]['label'] for k in paths[item[0]]])]),
        'A direct catalogue tag is a bibliographic classification, not a located passage finding or an endorsement. Zero means no direct assignment in this catalogue; it does not mean the corpus lacks discussion of the topic. Parent totals are not automatically sums of child assignments.',
        '## 6. Other existing catalogue facets',
        table(['Facet', 'Defined values', 'Values'], [(name, len(vocabulary[name]), '; '.join(vocabulary[name])) for name in ('traditions', 'genres', 'occasions', 'audiences', 'depths', 'eras', 'formats', 'roles')]),
        'These facets are independent filters, not edges asserting doctrine. A tradition assigned to an author does not settle every position in every work. Current era values do not include dedicated patristic or medieval labels; comparative-belief topics and historical periods need deliberate expansion as the collection warrants. Generic topic definitions and sparse aliases need review before becoming executable enrichment rules.',
        '## 7. What remains to be built',
        table(['Connection', 'Present state', 'Required evidence before study use'], [
            ('Author -> work -> edition -> asset', 'Catalogue structure exists; graph crosswalk planned', 'Stable IDs and source-backed attribution; preserve anonymous/disputed identities'),
            ('Work -> collection / subject', 'Catalogue classifications exist', 'Label as catalogue classification; do not present as full-text extraction'),
            ('Located passage -> topic', 'Planned deterministic enrichment', 'Rule, exact text span, intended sense and match/review status'),
            ('Located passage -> Scripture citation', 'Full-library extraction planned', 'Literal citation, valid range, numbering basis and exact source location'),
            ('Section/work -> shared references', 'Planned analysis', 'Contributing citations, scope, duplicate handling and weighting'),
            ('Author/work -> supports / opposes a claim', 'Deferred interpretive layer', 'Attributed claim, quoted speakers, qualifications and reviewed evidence'),
            ('Author/work -> influenced another', 'Deferred historical layer', 'Direct historical/source-dependence evidence; similarity alone is insufficient'),
        ]),
        '## Refresh',
        'From `Website`, run `python -m knowledge.study_map`. The command opens the corpus read-only and regenerates this document from the database and library vocabulary/catalogue. It does not infer relationships, modify the database, re-embed text or publish a website.',
    ]
    output = Path(__file__).with_name('STUDY-MAP.md')
    output.write_bytes(('\n\n'.join(pieces) + '\n').encode('utf-8'))
    print(f'Wrote {output.name}: {sum(edges.values()):,} relationship rows; {len(collections)} collections; {len(subjects)} topics; {len(works):,} formal catalogue works.')


if __name__ == '__main__':
    build()
