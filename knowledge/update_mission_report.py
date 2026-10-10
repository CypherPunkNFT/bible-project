"""Keep a completed download mission's numeric report current during shared intake."""
import argparse
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
STATE = SITE.parent / 'KnowledgeBase'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(path, value):
    temporary = path.with_name(path.name + '.report-update.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def run(mission, watch):
    if not re.fullmatch(r'RB\d{2}', mission):
        raise ValueError('Invalid mission ID')
    report = SITE / 'content/library/reports/reformed-baptist-overnight' / mission
    summary = read(report / 'rerun-summary.json')
    manifest = read(report / 'acquisition-manifest.json')['files']
    files = [x for x in manifest if x.get('campaignMission') == mission and x.get('countAsBook', True)]
    excluded = sum(x.get('campaignMission') == mission and x.get('disposition') == 'excluded-author' for x in manifest)
    before = summary['embeddingBefore']
    while True:
        try:
            after = read(STATE / 'embedding-progress.json')
            intake = read(STATE / 'intake-completion.json')
        except (OSError, ValueError):
            if not watch:
                raise
            time.sleep(30)
            continue
        incorporated = after.get('corpus_build') != before.get('corpus_build')
        complete = incorporated and after.get('state') == 'complete' and intake.get('state') == 'complete'
        status = 'complete' if complete else 'needs_attention' if intake.get('state') == 'needs_attention' else 'processing'
        summary.update(embeddingAfter=after, intake=intake, processingState=status,
                       excludedAuthorFiles=excluded, updatedAt=datetime.now(timezone.utc).isoformat())
        save(report / 'embedding-after.json', after)
        save(report / 'rerun-summary.json', summary)
        lines = [f'# {mission} re-run acquisition report', '',
                 f"**{summary['files']:,} new originals; {summary['bytes']/1e9:.3f} GB; approximately {summary['distinctWorksEstimate']:,} distinct works; {len(summary['sources'])} acquisition sources (4 checked).**", '',
                 '| Source | Files | GB |', '|---|---:|---:|']
        for source in ['tcp', 'ccel', 'ia', 'monergism']:
            rows = [x for x in files if x['source'] == source]
            lines.append(f"| {source.upper()} | {len(rows):,} | {sum(x['bytes'] for x in rows)/1e9:.3f} |")
        lines += ['', f"Failed downloads: **{summary['failedDownloads']}**; text-export failures: **{summary['exportFailures']}**; collector blockers: **{len(summary['blockers'])}**; previously failed IDs skipped: **{summary['previouslyFailedSkipped']}**. No retries. [Failed-download TODO](FAILED-DOWNLOADS-TODO.md) / [failure details](failed-downloads.json).", '',
                  f"Passage total before: **{before['total']:,}**. Latest after: **{after['total']:,}**. Change: **{after['total']-before['total']:+,}**. Embedded: **{before['indexed']:,} → {after['indexed']:,}**. Snapshot: {after.get('updated_at')}; embedding state: **{after['state']}**."]
        if after['total'] - before['total'] < 100000:
            lines.append('Fewer than 100,000 new passages: the newly downloaded batch is still awaiting incorporation into the shared corpus.' if not incorporated else 'Fewer than 100,000 new passages: existing holdings were skipped and unavailable downloads were deferred without retries.')
        lines += ['', f"Processing: **{status}**; shared intake state: **{intake.get('state', 'unknown')}**. `finish-intake.ps1` was invoked after downloads and returned because the existing pipeline owns the exclusive lock. No second embedding worker was started. Concurrent acquisitions also affect the shared passage totals.", '',
                  f"Author screening excluded **{excluded}** unrelated or unresolved matches; their originals and credits are retained outside library intake. CCEL's **51** matching books were already held. No new evidenceOnly holds; credits retained.", '',
                  '[Acquisition manifest](acquisition-manifest.json). This report updates during processing; no additional downloads are scheduled.']
        if intake.get('state') == 'needs_attention':
            lines += ['', 'Processing blocker: ' + str(intake.get('error', 'Inspect intake-completion.json.'))]
        (report / 'REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
        if not watch or complete or intake.get('state') == 'needs_attention':
            return
        time.sleep(30)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mission')
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    run(args.mission, args.watch)
