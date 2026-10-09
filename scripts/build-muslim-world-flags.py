"""Mirror the atlas's 53 flags from a pinned, MIT-licensed flag-icons revision.

py -3.12 scripts/build-muslim-world-flags.py --refresh
py -3.12 scripts/build-muslim-world-flags.py  # reuse the archived revision
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse
import datetime
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FLAGS = dict(zip(
    'AFG ALB DZA AZE BHR BGD BIH BRN BFA TCD COM DJI EGY ERI GMB GIN GNB IDN IRN IRQ JOR KAZ KOS KWT KGZ LBN LBY MYS MDV MLI MRT MYT MAR NER NGA OMN PAK PSE QAT SAU SEN SLE SOM SDN SYR TJK TUN TUR TKM ARE UZB ESH YEM'.split(),
    'af al dz az bh bd ba bn bf td km dj eg er gm gn gw id ir iq jo kz xk kw kg lb ly my mv ml mr fr ma ne ng om pk ps qa sa sn sl so sd sy tj tn tr tm ae uz eh ye'.split(),
    strict=True,
))

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'BibleProject-local-asset-builder'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

def immutable(path, data):
    if path.exists():
        if path.read_bytes() != data:
            raise ValueError(f'Refusing to change archived original: {path}')
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

def build(refresh):
    manifest_path = ROOT / 'content/missions/flag-manifest.json'
    commit = json.loads(fetch('https://api.github.com/repos/lipis/flag-icons/commits/main'))['sha'] if refresh else json.loads(manifest_path.read_bytes())['commit']
    archive = ROOT.parent / 'sources/missions/muslim-world' / ('flag-icons-' + commit)
    output = ROOT / 'public/assets/muslim-world/flags'
    output.mkdir(parents=True, exist_ok=True)
    base = f'https://raw.githubusercontent.com/lipis/flag-icons/{commit}'
    codes = sorted(set(FLAGS.values()))
    def acquire(name):
        relative = 'LICENSE' if name == 'LICENSE' else f'flags/4x3/{name}.svg'
        path = archive / relative
        data = fetch(base + '/' + relative) if refresh else path.read_bytes()
        if name != 'LICENSE' and (b'<svg' not in data or b'<script' in data or b'http://' in data.replace(b'http://www.w3.org/', b'')):
            raise ValueError(f'Unexpected flag SVG: {name}')
        immutable(path, data)
        return name, (relative, data)
    originals = dict(ThreadPoolExecutor(max_workers=6).map(acquire, ['LICENSE', *codes]))
    entries = []
    for country, code in FLAGS.items():
        relative, data = originals[code]
        (output / f'{country}.svg').write_bytes(data)
        entries.append({'country': country, 'flagCode': code, 'sourceUrl': base + '/' + relative, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    license_data = originals['LICENSE'][1]
    (output / 'LICENSE').write_bytes(license_data)
    manifest = {'source': 'https://github.com/lipis/flag-icons', 'license': 'MIT', 'commit': commit,
                'retrievedDate': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
                'localArchive': str(archive.relative_to(ROOT.parent)).replace('\\', '/'),
                'licenseSha256': hashlib.sha256(license_data).hexdigest(),
                'notes': 'Unmodified 4:3 SVGs, renamed to the atlas country codes. Mayotte uses the French tricolour. Flags do not determine disputed territory status.',
                'flags': entries}
    manifest_path.write_bytes((json.dumps(manifest, indent=2) + '\n').encode())
    print(f'Mirrored {len(entries)} flags, {sum(entry["bytes"] for entry in entries):,} bytes total; revision {commit}.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    build(parser.parse_args().refresh)
