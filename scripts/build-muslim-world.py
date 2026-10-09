"""Build the Islam country explorer from public Pew and IMB source snapshots.

py -3.12 scripts/build-muslim-world.py --refresh
py -3.12 scripts/build-muslim-world.py --cache-dir .local  # existing source files
Neither command changes the immutable sources/ collection.
"""
from pathlib import Path
from collections import Counter
import argparse
import datetime
import hashlib
import json
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PEW_PAGE = 'https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/'
PEW_DATA = 'https://www.pewresearch.org/wp-content/plugins/prc-interactive-features/assets/religion/2022/grf-table/build/index.js'
IMB_ITEM = 'https://www.arcgis.com/home/item.html?id=4480316ef90c467ba30517809180c536'
IMB_LAYER = 'https://services2.arcgis.com/S4ydGgujXcif36k3/arcgis/rest/services/pgOrgPointsStaging/FeatureServer/0'
COUNTRY_CODES = {
    'Afghanistan': ('AFG', '004'), 'Albania': ('ALB', '008'), 'Algeria': ('DZA', '012'),
    'Azerbaijan': ('AZE', '031'), 'Bahrain': ('BHR', '048'), 'Bangladesh': ('BGD', '050'),
    'Bosnia and Herzegovina': ('BIH', '070'), 'Brunei': ('BRN', '096'), 'Burkina Faso': ('BFA', '854'),
    'Chad': ('TCD', '148'), 'Comoros': ('COM', '174'), 'Djibouti': ('DJI', '262'), 'Egypt': ('EGY', '818'),
    'Eritrea': ('ERI', '232'), 'Gambia': ('GMB', '270'), 'Guinea': ('GIN', '324'),
    'Guinea-Bissau': ('GNB', '624'), 'Indonesia': ('IDN', '360'), 'Iran': ('IRN', '364'),
    'Iraq': ('IRQ', '368'), 'Jordan': ('JOR', '400'), 'Kazakhstan': ('KAZ', '398'),
    'Kosovo': ('KOS', None), 'Kuwait': ('KWT', '414'), 'Kyrgyzstan': ('KGZ', '417'),
    'Lebanon': ('LBN', '422'), 'Libya': ('LBY', '434'), 'Malaysia': ('MYS', '458'),
    'Maldives': ('MDV', '462'), 'Mali': ('MLI', '466'), 'Mauritania': ('MRT', '478'),
    'Mayotte': ('MYT', '175'), 'Morocco': ('MAR', '504'), 'Niger': ('NER', '562'),
    'Nigeria': ('NGA', '566'), 'Oman': ('OMN', '512'), 'Pakistan': ('PAK', '586'),
    'Palestinian territories': ('PSE', '275'), 'Qatar': ('QAT', '634'), 'Saudi Arabia': ('SAU', '682'),
    'Senegal': ('SEN', '686'), 'Sierra Leone': ('SLE', '694'), 'Somalia': ('SOM', '706'),
    'Sudan': ('SDN', '729'), 'Syria': ('SYR', '760'), 'Tajikistan': ('TJK', '762'),
    'Tunisia': ('TUN', '788'), 'Turkey': ('TUR', '792'), 'Turkmenistan': ('TKM', '795'),
    'United Arab Emirates': ('ARE', '784'), 'Uzbekistan': ('UZB', '860'),
    'Western Sahara': ('ESH', '732'), 'Yemen': ('YEM', '887'),
}
CATEGORIES = {0: 'unengaged', 1: 'engagedUnreached', 2: 'noLongerUnreached'}
LABELS = {0: 'Unengaged and Unreached', 1: 'Engaged yet Unreached', 2: 'No Longer Unreached'}


def get_json(url):
    with urllib.request.urlopen(url, timeout=45) as response:
        result = json.load(response)
    if 'error' in result:
        raise RuntimeError(result['error'])
    return result


def refresh(cache):
    cache.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(PEW_DATA, timeout=45) as response:
        (cache / 'pew-js.txt').write_bytes(response.read())
    fields = 'PGID,ISOAlpha3,CountryName,Population,EngagementProgress,EngagementProgressDesc,StatusName,UNm49SubRegionName,LanguageName,DisplayName,ReligionName,CaptureDate'
    params = dict(f='json', where='1=1', outFields=fields, returnGeometry='false',
                  resultRecordCount=2000, orderByFields='OBJECTID')
    people = []
    while True:
        params['resultOffset'] = len(people)
        result = get_json(IMB_LAYER + '/query?' + urllib.parse.urlencode(params))
        people.extend(feature['attributes'] for feature in result['features'])
        if not result.get('exceededTransferLimit'):
            break
    (cache / 'imb-pg-snapshot.json').write_bytes(json.dumps(people).encode('utf-8'))


def build(cache):
    pew_raw = (cache / 'pew-js.txt').read_bytes()
    pew_text = pew_raw.decode('utf-8')
    start = re.search(r'\[\{"Region":"', pew_text)
    if not start:
        raise ValueError('Pew source format changed; review its embedded dataset.')
    pew, _ = json.JSONDecoder().raw_decode(pew_text[start.start():])
    pew = [row for row in pew if row['Year'] == 2020 and row['Country'] != 'All Countries'
           and row['Muslims'] / row['Total'] > .5]
    imb_raw = (cache / 'imb-pg-snapshot.json').read_bytes()
    people = json.loads(imb_raw)
    if len({row['PGID'] for row in people}) != len(people):
        raise ValueError('Duplicate people-group IDs in paginated IMB source.')
    dates = {row['CaptureDate'] for row in people}
    if len(dates) != 1:
        raise ValueError('IMB pages cross snapshot dates; fetch a consistent snapshot again.')
    countries = []
    group_manifest = []
    group_output = ROOT / 'public/assets/muslim-world/people-groups'
    group_output.mkdir(parents=True, exist_ok=True)
    for row in pew:
        code, numeric = COUNTRY_CODES[row['Country']]
        groups = [group for group in people if group['ISOAlpha3'] == code and group['StatusName'] == 'Active']
        if not groups:
            raise ValueError(f'No verified IMB data for {code}')
        stats = {key: {'groups': 0, 'population': 0} for key in CATEGORIES.values()}
        for group in groups:
            category = group['EngagementProgress']
            if group['EngagementProgressDesc'] != LABELS[category]:
                raise ValueError(f'Unexpected IMB progress category: {group}')
            if group['Population'] is None or group['Population'] < 0:
                raise ValueError(f'Missing population for {group["PGID"]}; do not substitute zero.')
            stats[CATEGORIES[category]]['groups'] += 1
            stats[CATEGORIES[category]]['population'] += group['Population']
        ordered = sorted(groups, key=lambda group: (-group['Population'], group['PGID']))
        detail_groups = [{'id': group['PGID'], 'name': group['DisplayName'], 'language': group['LanguageName'],
                          'religion': group['ReligionName'], 'population': group['Population'],
                          'status': CATEGORIES[group['EngagementProgress']]} for group in ordered]
        detail = {'country': code, 'snapshotDate': next(iter(dates)), 'sourceSha256': hashlib.sha256(imb_raw).hexdigest(),
                  'groups': detail_groups}
        detail_bytes = (json.dumps(detail, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        (group_output / f'{code}.json').write_bytes(detail_bytes)
        group_manifest.append({'country': code, 'groups': len(groups), 'bytes': len(detail_bytes), 'sha256': hashlib.sha256(detail_bytes).hexdigest()})
        examples = ordered[:3]
        countries.append({
            'code': code, 'numeric': numeric, 'name': row['Country'],
            'region': Counter(group['UNm49SubRegionName'] for group in groups).most_common(1)[0][0],
            'population2020': row['Total'], 'muslimShare2020': round(row['Muslims'] / row['Total'] * 100, 1),
            'religions2020': {key: round(row[key] / row['Total'] * 100, 1)
                              for key in ['Christians', 'Muslims', 'Unaffiliated', 'Hindus', 'Buddhists', 'Jews', 'Other religions']},
            'imb': {'totalGroups': len(groups), 'population': sum(group['Population'] for group in groups), **stats},
            'examples': [{'id': group['PGID'], 'name': group['DisplayName'], 'language': group['LanguageName'],
                          'religion': group['ReligionName'], 'population': group['Population'],
                          'status': CATEGORIES[group['EngagementProgress']]} for group in examples],
        })
    result = {
        'schemaVersion': 1, 'snapshotDate': dates.pop(), 'demographicYear': 2020,
        'retrievedDate': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        'scope': 'Countries and territories with more than 50% Muslim identification in Pew 2020 estimates.',
        'sources': {
            'pew': {'url': PEW_PAGE, 'dataUrl': PEW_DATA, 'sha256': hashlib.sha256(pew_raw).hexdigest()},
            'imb': {'url': IMB_ITEM, 'dataUrl': IMB_LAYER, 'sha256': hashlib.sha256(imb_raw).hexdigest(),
                    'licenseUrl': 'https://creativecommons.org/licenses/by-nc/4.0/',
                    'transformation': 'Active people-group records aggregated by country and the published EngagementProgress category; three largest groups listed as examples.'},
        },
        'countries': countries,
    }
    target = ROOT / 'content/missions/muslim-world.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes((json.dumps(result, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    manifest = {'snapshotDate': result['snapshotDate'], 'sourceSha256': result['sources']['imb']['sha256'],
                'transformation': 'All active IMB records for each selected country; population order; published EngagementProgress categories; names, language, religion and population unchanged.',
                'files': group_manifest}
    (target.parent / 'people-group-manifest.json').write_bytes((json.dumps(manifest, indent=2) + '\n').encode())
    print(f'Built {len(countries)} countries; IMB snapshot {result["snapshotDate"]}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--cache-dir', type=Path, default=ROOT / '.local/missions-sources')
    args = parser.parse_args()
    if args.refresh:
        refresh(args.cache_dir)
    build(args.cache_dir)
