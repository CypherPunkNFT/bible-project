import { BookOpen, Church, DoorOpen, Flame, Heart, Home, Scale, ScrollText, ShieldCheck, Sparkles, Sunrise, type LucideIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { PassageText } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import type { LettersOverview } from "@/data/letters/types";
import { CiteMarks } from "./LetterParts";
import { LETTER_TONE } from "./letter-hooks";

// An icon for each theme, chosen from words in its title; a book for anything unmatched.
const ICONS: [RegExp, LucideIcon][] = [
  // Checked in order: "Guarding the faith from false teaching" must meet the shield before "faith" meets the scales.
  [/false|guard/i, ShieldCheck], [/faith|works/i, Scale], [/suffer|endur/i, Flame], [/love/i, Heart], [/coming|return/i, Sunrise],
  [/scripture|quoted/i, ScrollText], [/leader|church/i, Church], [/hospitality|travel/i, DoorOpen], [/holiness|holy/i, Sparkles], [/household|ruler/i, Home],
];
const iconFor = (title: string) => ICONS.find(([re]) => re.test(title))?.[1] ?? BookOpen;
const SHOWN_VERSES = 6;

/**
 * The themes the four groups share, as cards. Opening one widens it across its whole row: the theme in full, the
 * letters that carry it (each opens its group), and the words of its key verses.
 */
export function ThemeCards({ themes, letterName, openLetter }: { themes: LettersOverview["themes"]; letterName: (code: string) => string; openLetter: (code: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="lg-themes">
    {themes.map((theme) => {
      const Icon = iconFor(theme.title);
      const expanded = open === theme.title;
      return <article key={theme.title} className="lg-theme" data-open={expanded || undefined}>
        <button type="button" className="lg-theme-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : theme.title)}>
          <span className="lg-theme-icon"><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="lg-theme-title">{theme.title}</span>
          <span className="lg-theme-count">{theme.letters.length} letters · {theme.claim.refs?.length ?? 0} passages</span>
          {!expanded && <span className="lg-theme-teaser">{theme.claim.text}</span>}
        </button>
        {expanded && <ThemeDetail theme={theme} letterName={letterName} openLetter={openLetter} />}
      </article>;
    })}
  </div>;
}

function ThemeDetail({ theme, letterName, openLetter }: { theme: LettersOverview["themes"][number]; letterName: (code: string) => string; openLetter: (code: string) => void }) {
  const catalog = useCatalog();
  const [all, setAll] = useState(false);
  const refs = theme.claim.refs ?? [];
  return <div className="lg-theme-body">
    <p className="lg-claim">{theme.claim.text}<CiteMarks cites={theme.claim.cites} /></p>
    <p className="lg-subhead" style={{ marginTop: "1rem" }}>Carried by</p>
    <div className="lg-chips" style={{ marginTop: 0 }}>{theme.letters.map((code) => <button key={code} type="button" className="lg-compare-letter"
      style={{ "--tone": `var(--${LETTER_TONE(code)})` } as CSSProperties} onClick={() => openLetter(code)}>{letterName(code)} →</button>)}</div>
    {refs.length > 0 && <>
      <p className="lg-subhead" style={{ marginTop: "1.25rem" }}>In their own words</p>
      <div className="lg-theme-verses">{(all ? refs : refs.slice(0, SHOWN_VERSES)).map((span) => <figure key={span.join("-")}>
        <figcaption>{formatRange(catalog, span[0], span[1])}</figcaption><PassageText span={span} max={5} />
      </figure>)}</div>
      {refs.length > SHOWN_VERSES && !all && <button type="button" className="lg-tab" style={{ marginTop: ".75rem" }} onClick={() => setAll(true)}>Show all {refs.length} passages</button>}
    </>}
  </div>;
}
