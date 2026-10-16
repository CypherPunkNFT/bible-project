"""Curated Scripture identities from the project's own People research.

Reads only files already present in the repository: the 21 researched group files under
``Website/src/data/people-pages/`` (rulers, prophets, apostles and the early church), the atlas pins
those files reference in ``Website/data/places.json``, and the tribe records built for
``Research/People/tribes-data.md``. Nothing is fetched from the network and nothing is inferred.

The rows this module produces have the same shape as a ``registry.sqlite3`` ``entities`` row, so the
history/language adapters consume them without change. Identity discipline, deliberately:

* one row per researched person id — the three figures the research covers twice (Moses, Deborah and
  Samuel appear as both ruler and prophet) become one row carrying both roles, never two identities;
* ``otherNames`` and a figure's other person records are retained as recorded candidates and are
  never used as match keys, so no alias is asserted to be the same referent;
* one place row per atlas pin, titled by the atlas name. The research's own annotated labels
  ("Jerusalem, the Temple", "Mount Nebo, where he died") are kept as attestations, not as titles;
* a curated place reference that carries no pin is folded into the pinned row of the same name rather
  than becoming a second, spurious identity for the same place.
"""
import json
import re
from pathlib import Path
from typing import Any

from .inspect_inputs import ROOT
from ..inputs import packed
from ..concept_index import filehash

NAMESPACE = 'scripture-entities'
SITE = ROOT / 'Website'
PEOPLE_PAGES = SITE / 'src/data/people-pages'
PLACES = SITE / 'data/places.json'
TRIBES = SITE / 'design/tribes-directions/data/tribes.json'
DOSSIERS = 'Research/People'

#: The only place-bearing paths that are harvested, per researched role. Everything else that happens
#: to carry a ``name`` is a person or an artifact title: ``records[].capital`` is prose with no pin
#: ("Hebron, then Jerusalem"), ``records[].mother`` is a person, ``outside[].name`` names an
#: inscription, and ``worldStage[].rulers``/``prophets[].person``/``companions[].person`` are people.
PLACE_PATHS: dict[str, list[tuple[str, str | None]]] = {
    'rulers': [('places', None), ('events', 'placeId')],
    'apostles': [('places', None), ('calling', 'placeId')],
    'prophets': [('places', None), ('call', 'placeId'), ('words', 'placeId'), ('signs', 'placeId')],
}

IDENTITY_PERSON = ('curated research identity; recorded variant titles and other person records are '
                   'retained as candidates and are not asserted to be the same referent')
IDENTITY_PLACE = ('curated research place identity bound to one atlas pin; the research\'s own labels '
                  'are attestations, not titles, and a title occurrence does not prove referent identity')
IDENTITY_GROUP = ('tribe identity as the tribe research records it; no link to the free-text '
                  'Ruler.tribe field is attempted')


def read_json(path: Path) -> Any:
    """Read a curated source. A missing or malformed source must fail loudly, never degrade."""
    return json.loads(path.read_text(encoding='utf-8-sig'))


def slug(value: str) -> str:
    """Lowercase, non-alphanumerics collapsed to single hyphens. Used only for unpinned place ids."""
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', value.lower())).strip('-')


def group_ids() -> list[str]:
    """The researched group files, named by the research index rather than by globbing the folder.

    ``index.json`` sits beside the group files and repeats all 199 person records; globbing would
    ingest it twice over.
    """
    return sorted(g['id'] for g in read_json(PEOPLE_PAGES / 'index.json')['groups'])


def source_record(path: Path, role: str) -> dict[str, Any]:
    stat = path.stat()
    return {'path': str(path), 'project_path': path.relative_to(ROOT).as_posix(),
            'role': role, 'sha256': filehash(path), 'bytes': stat.st_size}


def _figure_role(group: dict[str, Any], role: str, figure: dict[str, Any]) -> dict[str, Any]:
    return {'role': {'rulers': 'ruler', 'apostles': 'apostle-or-early-church', 'prophets': 'prophet'}[role],
            'group': group['id'], 'dossier': f"{DOSSIERS}/{group['id']}.md",
            'group_title': group['title'], 'title': figure.get('title'), 'tagline': figure.get('tagline'),
            'kind': figure.get('kind'), 'realm': figure.get('realm'), 'era': figure.get('era'),
            'order': figure.get('order')}


def collect_people(groups: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """One entry per distinct person id, accumulating every role record the research gives it."""
    people: dict[str, dict[str, Any]] = {}
    for group in groups:
        for role in ('rulers', 'apostles', 'prophets'):
            for figure in group.get(role, []):
                entry = people.setdefault(figure['id'], {
                    'name': figure['name'], 'roles': [], 'other_titles': set(),
                    'candidate_person_ids': set(), 'citations': set(), 'passages': set()})
                entry['roles'].append(_figure_role(group, role, figure))
                entry['other_titles'].update(figure.get('otherNames') or [])
                entry['candidate_person_ids'].update(figure.get('personIds') or [])
                entry['passages'].update(tuple(span) for span in figure.get('passages') or [])
                for cite in _figure_citations(figure):
                    entry['citations'].add((group['id'], cite))
    return people


def _figure_citations(value: Any) -> set[str]:
    """Every citation id a figure's claims reference, at any depth within that figure."""
    found: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key == 'cites' and isinstance(child, list):
                found.update(c for c in child if isinstance(c, str))
            else:
                found |= _figure_citations(child)
    elif isinstance(value, list):
        for child in value:
            found |= _figure_citations(child)
    return found


def collect_places(groups: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    """Pinned places keyed by atlas pin, and curated place names that carry no pin."""
    pinned: dict[str, dict[str, Any]] = {}
    unpinned: dict[str, dict[str, Any]] = {}

    def pin_entry(pin: str) -> dict[str, Any]:
        return pinned.setdefault(pin, {'labels': set(), 'tradition': False, 'referenced_by': set(),
                                       'groups': set(), 'unpinned_references': 0})

    for group in groups:
        for role, paths in PLACE_PATHS.items():
            for figure in group.get(role, []):
                references = [figure['capital']] if isinstance(figure.get('capital'), dict) else []
                for key, field in paths:
                    for item in figure.get(key) or []:
                        if not isinstance(item, dict):
                            continue
                        if field is None:
                            references.append(item)
                        elif item.get(field):
                            references.append({'placeId': item[field]})
                for reference in references:
                    pin = reference.get('placeId')
                    name = (reference.get('name') or '').strip()
                    if pin:
                        target = pin_entry(pin)
                        if name:
                            target['labels'].add(name)
                    elif name:
                        target = unpinned.setdefault(
                            name, {'tradition': False, 'referenced_by': set(), 'groups': set()})
                    else:
                        continue
                    if reference.get('tradition'):
                        target['tradition'] = True
                    target['referenced_by'].add(figure['id'])
                    target['groups'].add(group['id'])
    return pinned, unpinned


def person_rows(people: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for person_id, entry in sorted(people.items()):
        record = {
            'person_id': person_id,
            'roles': sorted(entry['roles'], key=lambda r: (r['role'], r['group'])),
            'other_titles': sorted(entry['other_titles']),
            'candidate_person_ids': sorted(entry['candidate_person_ids']),
            'citations': [{'group': g, 'citation_id': c} for g, c in sorted(entry['citations'])],
            'passages': [list(span) for span in sorted(entry['passages'])],
            'identity': IDENTITY_PERSON,
        }
        rows.append({'id': f'{NAMESPACE}:person:{person_id}', 'kind': 'person', 'namespace': NAMESPACE,
                     'original_id': person_id, 'title': entry['name'], 'record': packed(record)})
    return rows


def place_rows(pinned: dict[str, dict[str, Any]], unpinned: dict[str, dict[str, Any]],
               atlas: dict[str, dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, list[str]]]:
    missing = sorted(pin for pin in pinned if pin not in atlas)
    if missing:
        raise ValueError('Curated research references atlas pins absent from places.json: ' + ', '.join(missing))
    by_name: dict[str, list[str]] = {}
    for pin in pinned:
        by_name.setdefault(atlas[pin]['name'], []).append(pin)
    # A curated reference that omitted its pin is the same place under the same name, not a new one.
    folded = {}
    for name, entry in list(unpinned.items()):
        targets = by_name.get(name)
        if not targets:
            continue
        for pin in targets:
            pinned[pin]['unpinned_references'] += 1
            pinned[pin]['referenced_by'] |= entry['referenced_by']
            pinned[pin]['groups'] |= entry['groups']
            pinned[pin]['tradition'] = pinned[pin]['tradition'] or entry['tradition']
        folded[name] = sorted(targets)
        del unpinned[name]

    rows = []
    for pin, entry in sorted(pinned.items()):
        place = atlas[pin]
        siblings = sorted(f'{NAMESPACE}:place:{other}' for other in by_name[place['name']] if other != pin)
        record = {
            'atlas': {'pin': pin, 'name': place['name'], 'type': place.get('type'),
                      'lon': place.get('lon'), 'lat': place.get('lat'),
                      'confidence': place.get('confidence'), 'verses': place.get('verses')},
            'research_labels': sorted(entry['labels']),
            'tradition_flagged': entry['tradition'],
            'unpinned_references': entry['unpinned_references'],
            'referenced_by': sorted(entry['referenced_by']),
            'groups': sorted(entry['groups']),
            'dossiers': [f'{DOSSIERS}/{g}.md' for g in sorted(entry['groups'])],
            'shares_atlas_name_with': siblings,
            'identity': IDENTITY_PLACE,
        }
        rows.append({'id': f'{NAMESPACE}:place:{pin}', 'kind': 'place', 'namespace': NAMESPACE,
                     'original_id': pin, 'title': place['name'], 'record': packed(record)})
    for name, entry in sorted(unpinned.items()):
        record = {
            'atlas': None,
            'atlas_pin': None,
            'research_labels': [name],
            'tradition_flagged': entry['tradition'],
            'referenced_by': sorted(entry['referenced_by']),
            'groups': sorted(entry['groups']),
            'dossiers': [f'{DOSSIERS}/{g}.md' for g in sorted(entry['groups'])],
            'identity': IDENTITY_PLACE,
            'atlas_binding': 'The curated record names this place without an atlas pin; no pin is inferred',
        }
        rows.append({'id': f'{NAMESPACE}:place:unpinned:{slug(name)}', 'kind': 'place',
                     'namespace': NAMESPACE, 'original_id': None, 'title': name, 'record': packed(record)})
    return rows, folded


def group_rows(tribes: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for tribe in sorted(tribes['tribes'], key=lambda t: t['id']):
        son = tribe.get('son') or {}
        record = {
            'tribe_id': tribe['id'],
            'son': {'person_id': son.get('personId'), 'order': son.get('order'),
                    'birth': (son.get('birth') or {}).get('ref')},
            'dossier': f'{DOSSIERS}/tribes-data.md',
            'built_from': TRIBES.relative_to(ROOT).as_posix(),
            'identity': IDENTITY_GROUP,
        }
        rows.append({'id': f'{NAMESPACE}:people-group:{tribe["id"]}', 'kind': 'people-group',
                     'namespace': NAMESPACE, 'original_id': tribe['id'], 'title': tribe['name'],
                     'record': packed(record)})
    return rows


def build() -> dict[str, Any]:
    """Assemble the curated entity set. Deterministic: same repository bytes, same output bytes."""
    sources = [source_record(PEOPLE_PAGES / 'index.json', 'research-group-index')]
    groups = []
    for group_id in group_ids():
        path = PEOPLE_PAGES / (group_id + '.json')
        sources.append(source_record(path, 'researched-figures'))
        groups.append(read_json(path))
    sources.append(source_record(PLACES, 'atlas-pins'))
    sources.append(source_record(TRIBES, 'tribe-records'))

    atlas_list = read_json(PLACES)
    atlas = {place['id']: place for place in atlas_list}
    if len(atlas) != len(atlas_list):
        raise ValueError('places.json contains duplicate pin ids; curated place identity would be ambiguous')

    people = collect_people(groups)
    pinned, unpinned = collect_places(groups)
    places, folded = place_rows(pinned, unpinned, atlas)
    rows = sorted(person_rows(people) + places + group_rows(read_json(TRIBES)), key=lambda r: r['id'])

    identifiers = [row['id'] for row in rows]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError('Curated entity ids are not unique; refusing to freeze an ambiguous dictionary')
    blank = [row['id'] for row in rows if not (row['title'] or '').strip()]
    if blank:
        raise ValueError('Curated entities without a title: ' + ', '.join(blank))

    figures = sum(len(group.get(role, [])) for group in groups for role in ('rulers', 'apostles', 'prophets'))
    return {
        'namespace': NAMESPACE,
        'entities': rows,
        'sources': sorted(sources, key=lambda s: s['project_path']),
        'counts': {'entities': len(rows), 'person': sum(r['kind'] == 'person' for r in rows),
                   'place': sum(r['kind'] == 'place' for r in rows),
                   'place_atlas_pinned': sum(r['kind'] == 'place' and bool(r['original_id']) for r in rows),
                   'people_group': sum(r['kind'] == 'people-group' for r in rows),
                   'researched_figure_records': figures, 'research_groups': len(groups)},
        'merged_person_records': sorted(pid for pid, entry in people.items() if len(entry['roles']) > 1),
        'unpinned_names_folded_into_pinned_places': folded,
    }
