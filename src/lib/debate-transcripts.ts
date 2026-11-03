import catalogue from '../../content/apologetics/transcripts/index.json';

export interface TranscriptRecord {
  file: string; received: string; provenance: string; sha256: string;
  words: number; turns: number; sections: { turn: number; title: string }[];
  unit?: string;
  coverage?: string;
  segments?: { line: number; speaker: string; kind: 'speaker' | 'source' | 'reflection' }[];
}
export const transcripts = catalogue as Record<string, TranscriptRecord>;

/** Keep original speaker labels (including Dr. Lennox) and all supplied body text. */
export function transcriptTurns(text: string, record?: TranscriptRecord) {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
  if (record?.segments) {
    const lines = normalized.split('\n');
    return record.segments.map((segment, i) => {
      const raw = lines.slice(segment.line - 1, record.segments![i + 1] ? record.segments![i + 1].line - 1 : lines.length).join('\n').trim();
      return { number: i + 1, speaker: segment.speaker, kind: segment.kind, raw, paragraphs: raw.split(/\n\s*\n/) };
    });
  }
  const labels = [...normalized.matchAll(/^(Larry Taunton|Bill Pryor|Richard Dawkins|John Lennox|Dr\. Lennox): /gm)];
  return labels.map((label, i) => ({
    number: i + 1,
    speaker: label[1],
    kind: 'speaker' as const,
    raw: normalized.slice(label.index, labels[i + 1]?.index ?? normalized.length).trim(),
    paragraphs: normalized.slice(label.index + label[0].length, labels[i + 1]?.index ?? normalized.length).trim().split(/\n\s*\n/),
  }));
}

/** The transcript in a translated language (data/i18n/<folder>/transcripts/<name>.json, written by
 * content/translation/apply.py), or null when it is missing or its speaker turns no longer line up with the English
 * ones; the viewer then stays in English rather than show a broken exchange. */
export async function fetchTranslatedTranscript(folder: string, record: TranscriptRecord): Promise<string | null> {
  try {
    const response = await fetch(`/data/i18n/${folder}/transcripts/${record.file.replace(/\.txt$/, '.json')}`, { cache: 'no-cache' });
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('json')) return null;
    const text = ((await response.json()) as { text?: unknown }).text;
    if (typeof text !== 'string') return null;
    return transcriptTurns(text, record).length === record.turns ? text : null;
  } catch (error) {
    console.warn(`debate transcript: could not read the ${folder} translation of ${record.file} (${String(error)}); showing the English`);
    return null;
  }
}
