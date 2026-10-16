"""Source-bound public-use decisions, independent of private intake and publication."""
import argparse
import copy
import json
import sqlite3
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

from jsonschema.exceptions import ValidationError

from ..research_foundation.contract import assert_public, fingerprint, http_url
from ..settings import load, write_json
from .contract import sha256_file
from .crosswalk import normalized, read, verify as verify_crosswalk

ACTIONS = ('metadata', 'quote', 'fullText', 'translation', 'editorial')
DECISIONS = ('allowed', 'conditional', 'denied', 'unknown')


def check_action(action, evidence_ids):
    if set(action) != {'decision', 'scope', 'basis', 'evidenceIds', 'conditions'}:
        raise ValueError('Public-use action fields differ from v1')
    if action['decision'] not in DECISIONS or not action['scope'].strip() or not action['basis'].strip():
        raise ValueError('A decision requires an explicit scope and basis')
    if not action['evidenceIds'] or not set(action['evidenceIds']) <= evidence_ids:
        raise ValueError('Decision evidence absent or unknown')
    if not isinstance(action['conditions'], list) or any(not isinstance(x, str) or not x.strip() for x in action['conditions']):
        raise ValueError('Invalid conditions')
    if action['decision'] == 'conditional' and not action['conditions']:
        raise ValueError('Conditional use requires an unresolved condition')
    if action['decision'] == 'allowed' and action['conditions']:
        raise ValueError('Unfulfilled conditions must not become allowed')


def facts(node, review):
    fields = node['header']['fields']
    titles = [f['text'] for f in fields if f['role'] == 'title']
    authors = [f['text'] for f in fields if f['role'] == 'creator' and f['attributes'].get('scheme') == 'short-form']
    if not authors:
        authors = [f['text'] for f in fields if f['role'] == 'creator' and f['attributes'].get('scheme') != 'ccel']
    if not titles or not authors or not http_url(review['sourceUrl']):
        raise ValueError('Missing source-backed factual metadata')
    result = dict(recordId=node['reader']['recordId'], title=titles[0], authors=list(dict.fromkeys(authors)),
                  sourceUrl=review['sourceUrl'], credit=review['credit'],
                  workId=node['identity']['workId'], editionId=node['identity']['editionId'],
                  catalogueRoute=node['reader']['catalogueRoute'])
    if result['catalogueRoute'] is not None and result['catalogueRoute'] != '/teachers/works/' + result['recordId']:
        raise ValueError('Catalogue route must be an exact on-site record route')
    assert_public(result)
    return result


def readiness(node, uses):
    """Permission alone does not register an edition, review an output, or publish it."""
    result = {}
    for action in ACTIONS:
        blockers = []
        if uses[action]['decision'] != 'allowed':
            blockers.append('public-use-' + uses[action]['decision'])
        if action != 'metadata':
            if uses['metadata']['decision'] != 'allowed': blockers.append('source-metadata-use-not-cleared')
            if node['identity']['status'] != 'resolved': blockers.append('canonical-chain-deferred')
            if action == 'quote':
                if not node['evidenceIds']: blockers.append('no-selected-quotation')
                if node['reader']['status'] != 'readable-local-package': blockers.append('exact-edition-reading-copy-unavailable')
                if not node['passageChecks'] or any(not p['reader'].get('literalMatches') for p in node['passageChecks']):
                    blockers.append('on-site-quotation-alignment-pending')
            else:
                blockers.append('output-specific-review-pending')
        result[action] = dict(rightsAllowed=uses[action]['decision']=='allowed',
                              preparationReady=not blockers, blockers=blockers,
                              publicationSelected=False, published=False)
    return result


def build(config, crosswalk_path, spec_path):
    crosswalk = read(crosswalk_path)
    check = verify_crosswalk(config, crosswalk)
    if not check['valid']: raise ValueError('Stale crosswalk: ' + str(check['reasons']))
    spec = read(spec_path)
    if spec.get('schemaVersion') != 1 or spec.get('reviewKind') != 'ai-assisted':
        raise ValueError('Require v1 scoped AI-assisted use review')
    date.fromisoformat(spec['reviewDate'])
    if spec.get('publicationSelected') is not False:
        raise ValueError('This tool prepares decisions, never selects publication')
    evidence = spec['evidence']
    evidence_ids = {e['id'] for e in evidence}
    if len(evidence_ids) != len(evidence) or not evidence_ids:
        raise ValueError('Unique decision evidence required')
    for entry in evidence:
        if not http_url(entry['url']) or not entry['summary'].strip(): raise ValueError('Invalid policy reference')
        date.fromisoformat(entry['checkedOn'])
    nodes = {n['key']: n for n in crosswalk['nodes']}
    reviews = spec['sources']
    if len(reviews) != len(nodes) or {r['node'] for r in reviews} != set(nodes):
        raise ValueError('Review every selected/candidate source exactly once')
    rows = []
    for review in sorted(reviews, key=lambda r:r['node']):
        node = nodes[review['node']]
        if review['sourceSha256'] != node['sha256']:
            raise ValueError('Use decision belongs to different original bytes')
        if set(review['uses']) != set(ACTIONS): raise ValueError('All five public uses require separate decisions')
        for action in review['uses'].values(): check_action(action, evidence_ids)
        private = review['privateAnalysis']
        if private.get('decision') != 'allowed' or not private.get('basis'):
            raise ValueError('Preserve authorized private analysis separately')
        assertions = review.get('sourceAssertions', [])
        for assertion in assertions:
            root = ET.parse(node['path']).getroot()
            elements = root.findall(assertion['xpath'])
            if not elements or fingerprint([normalized(''.join(e.itertext())) for e in elements]) != assertion['textFingerprint']:
                raise ValueError('Source-bound rights assertion changed')
        if not review['credit'].strip() or not review['limits']:
            raise ValueError('Retain credit and review limits')
        rows.append(dict(node=node['key'], selected=node['selected'], sourceSha256=node['sha256'],
                         privateAnalysis=copy.deepcopy(private), uses=copy.deepcopy(review['uses']),
                         sourceAssertions=copy.deepcopy(assertions), facts=facts(node, review),
                         readiness=readiness(node, review['uses']), limits=review['limits']))
    result = dict(schemaVersion=1, reviewKind=spec['reviewKind'], reviewDate=spec['reviewDate'],
                  publicationSelected=False, publication='private',
                  inputs=dict(crosswalkPath=str(Path(crosswalk_path).resolve()), crosswalkIntegrity=crosswalk['integrity'],
                              crosswalkSha256=sha256_file(crosswalk_path), specPath=str(Path(spec_path).resolve()),
                              specSha256=sha256_file(spec_path), implementationSha256=sha256_file(__file__)),
                  policyEvidence=evidence, sourceReviews=rows,
                  counts=dict(sources=len(rows), selectedSources=sum(r['selected'] for r in rows),
                              privateAnalysisAllowed=len(rows),
                              uses={a:{d:sum(r['uses'][a]['decision']==d for r in rows) for d in DECISIONS} for a in ACTIONS},
                              metadataPreviewsReady=sum(r['readiness']['metadata']['preparationReady'] for r in rows),
                              selectedQuotesReady=sum(r['selected'] and r['readiness']['quote']['preparationReady'] for r in rows),
                              publicOutputsWritten=0),
                  limits=['Dated AI-assisted operational use decisions; no claim of legal advice or human approval.',
                          'Allowed decisions apply only to their stated component and use, not an entire website or corpus.',
                          'Reverification checks local recorded evidence; remote policy changes require explicit re-review.',
                          'Private analysis, public-use permission, output quality and publication selection are separate.'])
    result['integrity'] = fingerprint(result)
    return result


def verify(config, result):
    if result.get('integrity') != fingerprint({k:v for k,v in result.items() if k!='integrity'}):
        return dict(valid=False, reasons=['Use decisions changed since review'])
    try:
        current = build(config, result['inputs']['crosswalkPath'], result['inputs']['specPath'])
        valid = current == result
        return dict(valid=valid, reasons=[] if valid else ['Use-review dependencies changed'])
    except (ValueError, KeyError, OSError, sqlite3.Error, ValidationError, ET.ParseError) as error:
        return dict(valid=False, reasons=[str(error)])


def metadata_preview(config, result):
    """Only source-backed facts. Never copy claims, quotes, bodies or policy free text."""
    check = verify(config, result)
    if not check['valid']: raise ValueError('Stale use decisions: ' + str(check['reasons']))
    rows = []
    for source in result['sourceReviews']:
        if not source['readiness']['metadata']['preparationReady']: continue
        # Do not copy even the entire facts object: keep an explicit export allowlist.
        row = {k:copy.deepcopy(source['facts'][k]) for k in
               ('recordId','title','authors','sourceUrl','credit','workId','editionId','catalogueRoute')}
        row['useDecisions'] = [dict(use=a, decision=source['uses'][a]['decision']) for a in ACTIONS]
        assert_public(row)
        rows.append(row)
    return dict(schemaVersion=1, kind='metadata-only-review-preview', published=False,
                eligibilityIntegrity=result['integrity'], records=rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('build','verify','preview'))
    parser.add_argument('--crosswalk', type=Path)
    parser.add_argument('--spec', type=Path)
    parser.add_argument('--decisions', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(); config = load()
    if not args.output.resolve().is_relative_to((config['state_dir']/'library-knowledge').resolve()):
        parser.error('Output must stay under KnowledgeBase/library-knowledge')
    inputs = [p for p in (args.crosswalk, args.spec, args.decisions) if p]
    if args.action == 'build':
        if not args.crosswalk or not args.spec: parser.error('--crosswalk and --spec required')
        result = build(config, args.crosswalk, args.spec)
    else:
        if not args.decisions: parser.error('--decisions required')
        decisions = read(args.decisions)
        inputs += [Path(decisions['inputs'][k]) for k in ('crosswalkPath','specPath')]
        result = verify(config, decisions) if args.action == 'verify' else metadata_preview(config, decisions)
    if args.output.resolve() in {p.resolve() for p in inputs}:
        parser.error('Output must not overwrite an input')
    write_json(args.output, result)
    print(json.dumps(result.get('counts', {'records':len(result['records'])} if 'records' in result else result)))
    if args.action == 'verify' and not result['valid']: raise SystemExit(1)


if __name__ == '__main__':
    main()
