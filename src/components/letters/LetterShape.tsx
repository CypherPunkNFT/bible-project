import type { CSSProperties, ReactNode } from "react";
import { StableTip } from "@/components/StableTip";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadLetters, studyRefLink, type Letter as LetterSections } from "@/lib/study";
import { formatRange } from "@/lib/refs";
import { useAsync } from "@/lib/useAsync";
import type { Letter, Span } from "@/data/letters/types";
import { useKeep, useVerseIndex } from "./letter-hooks";
import { KeepX, Refs } from "./LetterParts";

// Tones for outline kinds (Hebrews: teaching / warning / encouragement; 1 John: righteousness / love / belief).
const KIND_TONES = ["var(--lg)", "var(--revelation)", "var(--poetry)", "var(--prophets)", "var(--acts)"];

type Info = { title: string; span: Span; kind?: string };

/**
 * Each letter as a glowing glass bar cut into its section headings (BSB), as long as the letter; the chosen letter
 * also shows its outline in our own words, coloured by kind.
 */
export function LetterShape({ letters, selected, onSelect, outline = true }: { letters: Letter[]; selected: string; onSelect: (code: string) => void; outline?: boolean }) {
  const catalog = useCatalog();
  const sections = useAsync(loadLetters, "letters");
  const index = useVerseIndex();
  const keep = useKeep<string>(); // keyed "s<start>" for a section, "o<start>" for an outline part
  if (sections.status !== "ready" || !index) return <div style={{ minHeight: 160 }} />;
  const byCode = new Map<string, LetterSections>(sections.value.map((l) => [l.code, l]));
  const longest = Math.max(...letters.map((l) => byCode.get(l.code)?.verses ?? l.verses));
  const chosen = letters.find((l) => l.code === selected) ?? letters[0];
  const kinds = [...new Set(chosen.outline.map((p) => p.kind).filter(Boolean))] as string[];
  const toneOf = (kind?: string) => (kind ? KIND_TONES[kinds.indexOf(kind) % KIND_TONES.length] : "var(--lg)");
  const info = new Map<string, Info>();
  for (const l of letters) for (const s of byCode.get(l.code)?.sections ?? []) info.set(`s${s.start}`, { title: s.title, span: [s.start, s.end] });
  for (const part of chosen.outline) info.set(`o${part.span[0]}`, { title: part.title, span: part.span, kind: part.kind });
  const hover = keep.active ? info.get(keep.active) : undefined;
  // Hidden sizing copies carry the "let go" mark too, so keeping an item never makes the box grow.
  const keptMark = <KeepX onRelease={() => undefined} />;
  const shapeResting = <span className="lg-muted">Section headings from the Berean Standard Bible (public domain). Point at a segment; click to keep it, then open its passage below.</span>;
  const infoTip = (i: Info, mark: ReactNode) => <><strong>{i.title}</strong>{mark}{i.kind && <span className="lg-muted"> · {i.kind}</span>}<Refs refs={[i.span]} /></>;
  const marks = (key: string) => ({ "data-kept": keep.kept === key || undefined, ...keep.bind(key) });

  return <div>
    <div className="lg-bars">
      {letters.map((letter) => {
        const s = byCode.get(letter.code);
        const total = s?.verses ?? letter.verses;
        const on = letter.code === chosen.code;
        return <div key={letter.code} className="lg-bar-row" data-on={on || undefined}>
          <button type="button" className="lg-bar-name" aria-pressed={on} onClick={() => onSelect(letter.code)}>{letter.name}</button>
          <div className="lg-bar" style={{ width: `${(total / longest) * 100}%` }}>
            {(s?.sections ?? []).map((section) => <Link key={section.start} to={studyRefLink(catalog, [section.start, section.end])} {...marks(`s${section.start}`)}
              className={`lg-seg${keep.peek(`s${section.start}`) ? " lg-peek" : ""}`}
              style={{ flexGrow: section.verses }} aria-label={`${section.title}, ${formatRange(catalog, section.start, section.end)}`} />)}
          </div>
          <span className="lg-bar-count">{total} verses</span>
        </div>;
      })}
    </div>
    <StableTip show={hover ? infoTip(hover, keep.kept && <KeepX onRelease={keep.release} />) : shapeResting}
      options={[shapeResting, ...[...info.values()].map((i) => infoTip(i, keptMark))]} />

    {outline && chosen.outline.length > 0 && <div style={{ marginTop: "1.25rem" }}>
      <p className="lg-subhead">{chosen.name} · outline in our own words{kinds.length ? ` · coloured by ${kinds.join(" / ")}` : ""}</p>
      <div className="lg-outline">
        {chosen.outline.map((part) => {
          const length = index(part.span[1]) - index(part.span[0]) + 1;
          return <Link key={part.span[0]} to={studyRefLink(catalog, part.span)} {...marks(`o${part.span[0]}`)}
            className={`lg-outline-part${keep.peek(`o${part.span[0]}`) ? " lg-peek" : ""}`} style={{ flexGrow: length, "--tone": toneOf(part.kind) } as CSSProperties}>
            <span>{part.title}</span>
          </Link>;
        })}
      </div>
      {kinds.length > 0 && <div className="lg-tabs" aria-hidden="true" style={{ marginTop: ".6rem" }}>{kinds.map((k) => <span key={k} className="lg-muted" style={{ fontSize: ".72rem", display: "inline-flex", alignItems: "center", gap: ".35rem", marginRight: ".8rem" }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: toneOf(k) }} />{k}</span>)}</div>}
    </div>}
  </div>;
}
