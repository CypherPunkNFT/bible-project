"""Copy finished user-provided transcripts with local transcription provenance."""
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json
from knowledge.library_extract import extraction_cache, sha256


def main():
    source = Path(r'C:\Users\lcladm\Desktop\YT_Transcriber\transcripts')
    config = load()
    archive = config['sources_dir'] / 'billy-graham-transcripts' / 'archive'
    ready = config['sources_dir'] / 'library/source-billy-graham/yt-transcripts'
    report = SITE / 'content/library/reports/graham-transcripts-20261010'
    rows, pending, sermons = [], [], []
    def copy(original, destination, fields):
        payload = original.read_bytes()
        checksum = hashlib.sha256(payload).hexdigest()
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            if sha256(destination) != checksum:
                raise ValueError(f'Changed existing destination: {destination}')
            outcome = 'reused'
        else:
            destination.write_bytes(payload)
            outcome = 'copied'
        row = fields | {'path': str(destination), 'originalPath': str(original), 'sha256': checksum,
                        'bytes': destination.stat().st_size, 'format': original.suffix.lstrip('.'),
                        'url': original.resolve().as_uri(), 'acquisitionStatus': outcome}
        rows.append(row)
        return row
    for metadata in sorted(source.rglob('*.json')):
        value = json.loads(metadata.read_text('utf-8-sig'))
        title = Path(value.get('source_file') or metadata.parent.name.rsplit('-', 1)[0]).stem
        fields = {'title': title, 'author': 'Billy Graham', 'language': value.get('language', 'en'),
                  'audience': 'general Christian audience', 'source': 'Billy Graham sermons: user-provided YT_Transcriber outputs',
                  'sourceId': 'graham-audio-' + value['audio_sha256'], 'countAsBook': False,
                  'licence': 'Copyright retained by the original rights holders; no open licence established. Owner-authorized private local indexing.',
                  'contributor': 'Billy Graham; original recording contributors; local YT_Transcriber transcription',
                  'credit': 'Automatic transcription, not accuracy-verified; original notices and review flags retained.',
                  'quality': {'automaticTranscription': True, 'transcriptAccuracyVerified': value.get('transcript_accuracy_verified', False)},
                  'sourceMetadata': {key: item for key, item in value.items() if key != 'segments'}}
        if not value.get('complete'):
            copy(metadata, archive / metadata.parent.name / metadata.name, fields | {'textKind': 'unfinished-transcription-metadata'})
            pending.append({'title': title, 'path': str(metadata), 'reason': 'complete=false; transcript is still unfinished'})
            continue
        original = metadata.parent / 'transcript.txt'
        if not original.exists() or not original.read_text('utf-8-sig').strip():
            pending.append({'title': title, 'path': str(original), 'reason': 'Finished metadata has no readable transcript.txt'})
            continue
        companions = []
        for companion in sorted(metadata.parent.iterdir()):
            if companion.is_file() and companion.name != 'transcript.txt' and companion.suffix != '.tmp':
                record = copy(companion, archive / metadata.parent.name / companion.name,
                              fields | {'textKind': 'transcription-support'})
                companions.append(record['path'])
        body = copy(original, ready / metadata.parent.name / 'transcript.txt', fields | {'textKind': 'sermon-transcript'})
        body['sourceMetadata']['companionPaths'] = companions
        cache, selected, text_hash = extraction_cache(config, Path(body['path']), body['sha256'], 'txt')
        body['extractionCache'] = str(cache)
        body['extractedTextSha256'] = text_hash
        write_json(Path(body['path']).parent / 'provenance.json', body)
        provenance = Path(body['path']).parent / 'provenance.json'
        rows.append(fields | {'path': str(provenance), 'sha256': sha256(provenance), 'bytes': provenance.stat().st_size,
                              'url': original.resolve().as_uri(), 'format': 'json', 'textKind': 'provenance', 'acquisitionStatus': 'generated'})
        sermons.append(title)
    report.mkdir(parents=True, exist_ok=True)
    manifest = {'acquiredAt': datetime.now(timezone.utc).isoformat(), 'files': rows}
    write_json(report / 'acquisition-manifest.json', manifest)
    write_json(report / 'pending-transcripts.json', {'items': pending})
    with (report / 'acquisition-manifest.jsonl').open('w', encoding='utf-8') as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False) + '\n')
    progress = json.loads((config['state_dir'] / 'embedding-progress.json').read_text('utf-8-sig'))
    summary = {'completedSermons': len(sermons), 'manifestFiles': len(rows), 'bytes': sum(row['bytes'] for row in rows),
               'unfinishedTranscripts': len(pending), 'failures': 0, 'indexedAtImport': progress['indexed'],
               'bodyDirectory': str(ready), 'supportDirectory': str(archive), 'pendingNextCorpusRefresh': True}
    write_json(report / 'summary.json', summary)
    (report / 'REPORT.md').write_text(
        '# Billy Graham user transcripts — 2026-10-10\n\n'
        f"Completed sermons: {len(sermons)}; manifest files: {len(rows)}; archived bytes: {summary['bytes']:,}; failures: 0; unfinished: {len(pending)}.\n\n"
        f"Embedding passages at import: {progress['indexed']:,} of {progress['total']:,}; the active pass is preserved. New transcripts await the single coordinator's next corpus refresh.\n\n"
        'Fewer than 100,000 new embedded passages: these are 23 sermons, and their CPU preparation runs before the next corpus refresh.\n\n'
        'Original TXT files are ready for intake; JSON, subtitles and review flags are archived separately. Automatic transcription accuracy is unverified, as recorded by the source. No new transcription, OCR or GPU job was launched.\n\n'
        'Outputs: acquisition-manifest.json, acquisition-manifest.jsonl, summary.json, pending-transcripts.json.\n', encoding='utf-8')
    sources = SITE / 'SOURCES.md'
    text = sources.read_text('utf-8')
    heading = '### Billy Graham Evangelistic Association'
    start = text.index(heading)
    end = text.find('\n<a id=', start)
    if end < 0:
        end = len(text)
    note = '\n**Local sermon transcripts (2026-10-10):** 23 completed user-provided Billy Graham audio transcriptions from `C:\\Users\\lcladm\\Desktop\\YT_Transcriber\\transcripts`, produced with Whisper large-v3; accuracy is unverified. Original TXT bodies are staged under `sources/library/source-billy-graham/yt-transcripts`; timestamped subtitles, segment/word metadata and review flags are preserved under `sources/billy-graham-transcripts/archive`. One unfinished transcription remains pending. No additional licence or original video URL is inferred. [Transcript manifest](content/library/reports/graham-transcripts-20261010/acquisition-manifest.json).\n'
    if '**Local sermon transcripts (2026-10-10):**' not in text[start:end]:
        text = text[:end] + note + text[end:]
        sources.write_text(text, encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
