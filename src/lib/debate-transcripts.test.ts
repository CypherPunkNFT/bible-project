import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { transcripts, transcriptTurns } from './debate-transcripts';

it('retains every supplied word and speaker label in order, with reachable section starts', () => {
  for (const record of Object.values(transcripts)) {
    const bytes = readFileSync(`content/apologetics/transcripts/${record.file}`);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
    const source = bytes.toString('utf8');
    const turns = transcriptTurns(source, record);
    expect(turns).toHaveLength(record.turns);
    const reconstructed = turns.map(turn => turn.raw).join('\n\n');
    expect(reconstructed.split(/\s+/).filter(Boolean)).toEqual(source.split(/\s+/).filter(Boolean));
    expect(source.trim().split(/\s+/)).toHaveLength(record.words);
    if (record.file === 'lennox-dawkins.txt') expect(turns.find(turn => turn.speaker === 'Dr. Lennox')?.paragraphs[0]).toContain('Anthropic Principle');
    for (const section of record.sections) expect(turns[section.turn - 1]?.paragraphs.length).toBeGreaterThan(0);
    expect(turns.at(-1)?.raw.endsWith(source.trim().split(/\n/).at(-1)!)).toBe(true);
  }
});
