import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCatalog } from '@/lib/catalog';
import { useAsync } from '@/lib/useAsync';
import { loadChapterPlain } from '@/lib/data';
import { bookByNum, formatRange, plainLookup, splitId } from '@/lib/refs';
import { sourceById } from '@/data/apologetics-library';
import type { ApCitation } from '@/data/apologetics-types';

const files = new Map<string, Promise<Record<string, string>>>();
function localText(file: string) {
  if (!files.has(file)) files.set(file, fetch('/basis/' + file + '.json').then(response => { if (!response.ok) throw Error('Text unavailable'); return response.json(); }).catch(error => { files.delete(file); throw error; }));
  return files.get(file)!;
}
function CitationText({ citation, version }: { citation: ApCitation; version: string }) {
  const catalog = useCatalog();
  const text = useAsync(async () => {
    if (citation.kind === 'scripture') {
      const a = splitId(citation.span[0]), b = splitId(citation.span[1]);
      const code = bookByNum(catalog, a.num)!.code;
      const chapters = catalog.translations.find(t => t.slug === version)!.books[code];
      const lines: { label: string; text: string }[] = [];
      for (let ch = a.chapter; ch <= b.chapter; ch++) {
        const plain = await loadChapterPlain(version, code, chapters, String(ch));
        for (let v = ch === a.chapter ? a.verse : 1; v <= (ch === b.chapter ? b.verse : 200); v++) {
          const value = plainLookup(plain, ch, v);
          if (value) lines.push({ label: `${ch}:${v}`, text: value });
        }
      }
      return lines;
    }
    const source = sourceById(citation.source);
    const q = citation.source.startsWith('q');
    if (!q && citation.source !== 'wcf') return [];
    const data = await localText(q ? 'quran-pickthall' : 'westminster');
    const reference = (q ? source.title : citation.locator).match(/(\d+)[:.](\d+)(?:[–−-](\d+))?/);
    if (!reference) throw Error('Reference not available');
    const [, chapter, first, last] = reference;
    return Array.from({ length: Number(last ?? first) - Number(first) + 1 }, (_, i) => {
      const label = chapter + (q ? ':' : '.') + (Number(first) + i);
      if (!data[label]) throw Error('Text unavailable');
      return { label, text: data[label] };
    });
  }, JSON.stringify(citation) + version);
  if (text.status === 'loading') return <p role="status">Loading passage…</p>;
  if (text.status === 'error') return <p role="alert">This text could not be loaded. Select another reference or try again.</p>;
  if (!text.value.length && citation.kind === 'source') return <p>Full text is available at <a href={sourceById(citation.source).url} target="_blank" rel="noreferrer">the original source</a>.</p>;
  return <div className="wv-basis-text">{text.value.map(line => <p key={line.label}><sup>{line.label}</sup>{line.text}</p>)}</div>;
}
export default function BasisReader({ christian, islamic }: { christian: ApCitation[]; islamic: ApCitation[] }) {
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(0), [right, setRight] = useState(0);
  const [version, setVersion] = useState('kjv');
  const label = (c: ApCitation) => c.kind === 'scripture' ? formatRange(catalog, ...c.span) : c.source === 'wcf' ? 'Westminster ' + c.locator : sourceById(c.source).title;
  const selected = christian[left];
  const code = selected?.kind === 'scripture' ? bookByNum(catalog, splitId(selected.span[0]).num)?.code : undefined;
  const versions = catalog.translations.filter(t => t.lang === 'en' && t.numbering === 'english' && (!code || t.books[code]));
  const effectiveVersion = versions.some(t => t.slug === version) ? version : 'kjv';
  const translation = catalog.translations.find(t => t.slug === effectiveVersion)!;
  return <div className="wv-paired-basis">

    <div className="wv-basis-filters">{[christian, islamic].map((citations, side) => <div key={side} role="group" aria-label={side === 0 ? 'Christian references' : 'Islamic references'}>{citations.map((citation, i) => <button key={i} type="button" aria-pressed={open && (side === 0 ? left : right) === i} onClick={() => { if (!open) { setLeft(0); setRight(0); } if (side === 0) setLeft(i); else setRight(i); setOpen(true); }}>{label(citation)}</button>)}{side === 1 && <button className="wv-basis-inline-toggle" type="button" aria-label={open ? 'Close paired reading' : 'Read the texts side by side'} aria-expanded={open} aria-controls="wv-basis-reading" onClick={() => setOpen(!open)}>{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>}</div>)}</div>
    {open && <div id="wv-basis-reading" className="wv-basis-columns">{[christian[left], islamic[right]].map((citation, side) => <article key={side} aria-label={side === 0 ? 'Christian source reading' : 'Islamic source reading'}><header><h4>{label(citation)}</h4>{side === 0 && citation.kind === 'scripture' ? <label>Bible version<select value={effectiveVersion} onChange={event => setVersion(event.target.value)}>{versions.map(t => <option key={t.slug} value={t.slug}>{t.abbr} — {t.name}</option>)}</select></label> : <span>{citation.kind === 'source' && citation.source.startsWith('q') ? 'Marmaduke Pickthall · English translation' : sourceById(citation.kind === 'source' ? citation.source : 'wcf').author}</span>}</header><CitationText citation={citation} version={effectiveVersion} />{side === 0 && citation.kind === 'scripture' && translation.credit && <p className="wv-basis-credit">{translation.credit.text} <a href={translation.credit.licenceUrl}>{translation.credit.licence}</a>{translation.credit.changes}</p>}</article>)}</div>}
  </div>;
}
