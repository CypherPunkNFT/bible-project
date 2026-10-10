"""Citation and public-projection contract. No permission is inferred from a licence label."""
import copy
import hashlib
import json
from urllib.parse import urlsplit

SECTIONS = ('scholars', 'apologetics', 'studies')
KINDS = ('historical-observation', 'scholarly-interpretation', 'scientific-finding',
         'philosophical-inference', 'theological-interpretation', 'editorial-context')

def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

def http_url(value):
    if not isinstance(value, str):
        return False
    parsed = urlsplit(value)
    return parsed.scheme in ('http', 'https') and bool(parsed.netloc) and not parsed.username and not parsed.password

def validate_citation(citation):
    required = {'id', 'claimId', 'sourceId', 'editionId', 'locator', 'quote', 'sourceUrl', 'sourceRole',
                'claimKind', 'claim', 'alternatives', 'review', 'limits', 'dates', 'permissions', 'private', 'publication'}
    if set(citation) != required:
        raise ValueError('Citation fields differ from the version 1 contract')
    if citation['claimKind'] not in KINDS:
        raise ValueError('Unknown claim kind')
    if not citation['id'] or not citation['claimId'] or not citation['sourceId']:
        raise ValueError('Missing stable citation identity')
    if set(citation['dates']) != {'objectOrWork', 'discovery', 'editionPublication', 'retrieval', 'review'}:
        raise ValueError('Date roles must be separate')
    if not isinstance(citation['limits'], list) or not all(isinstance(x, str) for x in citation['limits']):
        raise ValueError('Limits must be retained as text')
    if citation['sourceUrl'] is not None and not http_url(citation['sourceUrl']):
        raise ValueError('Invalid source URL')
    if citation['quote'] is not None and (not citation['locator'] or not isinstance(citation['quote'], str)):
        raise ValueError('A quotation needs its exact edition locator')
    if citation['review'].get('kind') not in ('ai-assisted', 'human', 'unreviewed'):
        raise ValueError('Review attribution is required')
    if citation['review'].get('state') not in ('pending', 'reviewed-limited', 'stale'):
        raise ValueError('Unknown review state')
    if not isinstance(citation['claim'], str) or not citation['claim']:
        raise ValueError('The cited claim must be explicit')
    for alternative in citation['alternatives']:
        if set(alternative) != {'interpretation', 'sourceUrl', 'accessScope', 'reviewState'}:
            raise ValueError('Alternative interpretations must retain their scope and review state')
        if alternative['sourceUrl'] is not None and not http_url(alternative['sourceUrl']):
            raise ValueError('Invalid alternative source URL')
    if citation['review'].get('literalMatch') and not citation['quote']:
        raise ValueError('A literal-match flag requires a quotation')
    if set(citation['permissions']) != {'metadata', 'quote', 'fullText'}:
        raise ValueError('Publication actions must be separate')
    for action in citation['permissions'].values():
        if set(action) != {'decision', 'evidence'} or action['decision'] not in ('allowed', 'conditional', 'denied', 'unknown'):
            raise ValueError('Invalid permission action')
        if not isinstance(action['evidence'], list) or not all(isinstance(item, str) and item.strip() for item in action['evidence']):
            raise ValueError('Permission evidence must be a list of nonempty references')
        if action['decision'] == 'allowed' and not action['evidence']:
            raise ValueError('Allowed publication action requires recorded evidence')
    if citation['publication'] not in ('draft', 'published'):
        raise ValueError('Invalid publication state')
    return citation

def section_view(citation, section):
    validate_citation(citation)
    if section not in SECTIONS:
        raise ValueError('Unknown section')
    return {'section': section, 'citationId': citation['id'], 'citation': copy.deepcopy(citation)}

def project_public(citation):
    """Whitelisted payload, including citation locators/limits but never private paths or bodies."""
    validate_citation(citation)
    if citation['publication'] != 'published' or citation['permissions']['metadata']['decision'] != 'allowed':
        return None
    # A quotation and its current review have their own gate; metadata permission is insufficient.
    include_quote = (citation['permissions']['quote']['decision'] == 'allowed'
                     and bool(citation['editionId'])
                     and citation['review'].get('literalMatch') is True
                     and citation['review'].get('state') == 'reviewed-limited'
                     and citation['review'].get('contentFingerprint') == content_fingerprint(citation))
    keys = ('id', 'claimId', 'sourceId', 'editionId', 'locator', 'sourceUrl', 'sourceRole', 'claimKind', 'claim', 'alternatives', 'limits', 'dates')
    result = {key: copy.deepcopy(citation[key]) for key in keys}
    result['quote'] = citation['quote'] if include_quote else None
    result['review'] = {key: citation['review'].get(key) for key in ('state', 'kind', 'scope')}
    if citation['review'].get('state') == 'reviewed-limited' and citation['review'].get('contentFingerprint') != content_fingerprint(citation):
        result['review']['state'] = 'stale'
    assert_public(result)
    return result

def content_fingerprint(citation):
    value = {k: citation[k] for k in ('claimId', 'sourceId', 'editionId', 'locator', 'quote', 'sourceUrl', 'sourceRole', 'claimKind', 'claim', 'alternatives', 'limits', 'dates')}
    value['sourceHashes'] = {k: citation['private'].get(k) for k in ('sourceSha256', 'extractedSha256')}
    return fingerprint(value)

def assert_public(value):
    """Reject unsafe paths/URLs even if nested in prose in an explicitly public projection."""
    import re
    if isinstance(value, dict):
        if any(k in value for k in ('private', 'path', 'sourcePath', 'originalPath', 'raw', 'fullText')):
            raise ValueError('Private field in public payload')
        for child in value.values():
            assert_public(child)
    elif isinstance(value, list):
        for child in value:
            assert_public(child)
    elif isinstance(value, str):
        if re.search(r'(?i)(?:(?<![a-z0-9])[a-z]:[\\/]|file://|\\\\[^\s]+|/(?:Users|home|tmp|private)/)', value):
            raise ValueError('Local path in public payload')

def permissions():
    return {key: {'decision': 'unknown', 'evidence': []} for key in ('metadata', 'quote', 'fullText')}
