"""Verify the current Piper checkpoint and report this acquisition's exact scope."""
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
OUT = SITE / 'content/library/reports/ready-text-completion'
MODERN = SITE / 'content/library/reports/modern-texts'
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p, data): p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    inventory = read(MODERN / 'piper-messages-inventory.json')
    records = read(MODERN / 'piper-results.json')
    pending = [x for x in inventory['items'] if x['url'] not in records]
    exceptions = [r for r in records.values() if r['status'] != 'downloaded']
    hashes = set(); words = 0; count = 0
    for row in records.values():
        if row['status'] != 'downloaded': continue
        for asset in row['assets']:
            raw = (SOURCES / asset['relativePath']).read_bytes()
            assert len(raw) == asset['byteCount'] and hashlib.sha256(raw).hexdigest() == asset['sha256']
            derived = asset['derivedText']; raw = (SITE / derived['path']).read_bytes()
            assert hashlib.sha256(raw).hexdigest() == derived['sha256']
            hashes.add(asset['sha256']); words += derived['wordCount']; count += 1
    access_errors = [x for x in exceptions if x['status'] == 'error']
    snapshot = dict(checkedAt=datetime.now(timezone.utc).isoformat(), expected=len(inventory['items']), processed=len(records),
                    statuses=dict(Counter(r['status'] for r in records.values())), pending=len(pending),
                    verifiedOriginals=count, uniqueOriginalHashes=len(hashes), verifiedDerivedTexts=count, recordedExtractedWords=words,
                    accessErrors=access_errors, inputInventorySha256=hashlib.sha256((MODERN / 'piper-messages-inventory.json').read_bytes()).hexdigest(),
                    inputResultsSha256=hashlib.sha256((MODERN / 'piper-results.json').read_bytes()).hexdigest(),
                    completion='partial-rate-limited' if access_errors else 'inventory-processed' if not pending else 'in-progress',
                    rights='Private noncommercial copies; no public republication or app full-text indexing clearance.',
                    limits='Written messages are not certified verbatim audio transcripts. Multiple-speaker entries remain outside the single-author acquisition.')
    write(OUT / 'piper-snapshot.json', snapshot)
    write(OUT / 'piper-remaining.json', dict(unprocessed=pending, exceptions=exceptions))
    history = read(OUT / 'historical-results.json')
    letters = read(OUT / 'begg-letters-results.json')
    titus = read(OUT / 'begg-titus-results.json')
    summary = dict(historicalAcquiredFiles=len(history), historicalNewDownloads=21, historicalReusedEvidenceFiles=5,
                   goodwinVolumes=12, machenChapters=7, cc0XmlEditions=2, confessionalHtmlDocuments=5,
                   beggPagesChecked=len(letters) + len(titus), beggTranscripts=sum(x['status'] == 'acquired' for x in list(letters.values()) + list(titus.values())),
                   beggNoSubstantialTranscript=sum(x['status'] != 'acquired' for x in letters.values()),
                   piper=snapshot, ocrJobs=0, audioTranscriptionJobs=0, newScanDownloads=0)
    write(OUT / 'summary.json', summary)
    print(json.dumps(dict(piper=snapshot['statuses'], pending=len(pending), verifiedOriginals=count, beggTranscripts=summary['beggTranscripts'], historicalFiles=len(history))))


if __name__ == '__main__': main()
