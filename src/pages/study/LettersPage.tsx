import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { RefLink, StudyCredits, StudyHeader } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { bookByCode, formatRange } from "@/lib/refs";
import { tone } from "@/lib/sections";
import { loadLetters, studyRefLink, type Letter } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/utils";

const PAUL = new Set(["ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM"]);

export default function LettersPage() {
  const letters = useAsync(loadLetters, "letters");
  const [hover, setHover] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · New Testament letters"
        title="The shape of every letter."
        lead={
          <p>
            Each bar is one letter, its length the number of verses, cut into its sections. Point at a section to name it; click it to read. Open a letter for
            its outline, who wrote it, and to whom.
          </p>
        }
      />
      {letters.status === "loading" && <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}
      {letters.status === "error" && <p className="text-muted">The letters could not be loaded.</p>}
      {letters.status === "ready" && (
        <>
          <p className="sticky top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-10 -mx-4 min-h-[2.25rem] border-b border-line bg-page/95 px-4 py-2 text-sm backdrop-blur sm:-mx-6 sm:px-6" aria-live="polite">
            {hover || <span className="text-muted">Point at a section.</span>}
          </p>
          <div className="mt-4 space-y-2">
            <h2 className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Paul's letters</h2>
            {letters.value.filter((l) => PAUL.has(l.code)).map((letter) => (
              <LetterRow key={letter.code} letter={letter} max={maxVerses(letters.value)} open={open === letter.code} onToggle={() => setOpen(open === letter.code ? null : letter.code)} onHover={setHover} />
            ))}
            <h2 className="pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Hebrews and the general letters</h2>
            {letters.value.filter((l) => !PAUL.has(l.code)).map((letter) => (
              <LetterRow key={letter.code} letter={letter} max={maxVerses(letters.value)} open={open === letter.code} onToggle={() => setOpen(open === letter.code ? null : letter.code)} onHover={setHover} />
            ))}
          </div>
          <StudyCredits>
            Sections and their titles: the headings of the Berean Standard Bible (public domain), as published on eBible.org. Authors and recipients: each
            letter's own opening verses (Hebrews and 1 John do not name either). Lengths are BSB verse counts.
          </StudyCredits>
        </>
      )}
    </div>
  );
}

const maxVerses = (letters: Letter[]) => Math.max(...letters.map((l) => l.verses));

function LetterRow({ letter, max, open, onToggle, onHover }: { letter: Letter; max: number; open: boolean; onToggle: () => void; onHover: (text: string) => void }) {
  const catalog = useCatalog();
  const name = bookByCode(catalog, letter.code)?.name ?? letter.code;
  const colors = tone("epistles");
  const panel = `letter-${letter.code}`;
  return (
    <div>
      <div className="grid grid-cols-[7.5rem_1fr] items-center gap-3 sm:grid-cols-[9rem_1fr]">
        <button type="button" aria-expanded={open} aria-controls={panel} onClick={onToggle} className="flex items-center justify-end gap-1 text-right text-sm font-semibold hover:text-accent">
          {name}
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 overflow-hidden rounded-md" style={{ width: `${Math.max(4, (letter.verses / max) * 100)}%`, minWidth: "2.5rem" }}>
            {letter.sections.map((section, i) => {
              const label = `${name}: ${section.title} (${formatRange(catalog, section.start, section.end).replace(`${name} `, "")}, ${section.verses} verses)`;
              return (
                <Link
                  key={section.start}
                  to={studyRefLink(catalog, [section.start, section.end])}
                  aria-label={label}
                  title={label}
                  onMouseEnter={() => onHover(label)}
                  onFocus={() => onHover(label)}
                  className="h-full border-e border-white/60 transition hover:brightness-110 focus-visible:outline-offset-[-2px]"
                  style={{ flexGrow: section.verses, flexBasis: 0, background: i % 2 ? colors.box : colors.tab }}
                />
              );
            })}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted">{letter.verses} verses</span>
        </div>
      </div>
      {open && (
        <div id={panel} role="region" aria-label={`${name}: outline`} className="mb-4 ms-[8.25rem] mt-3 rounded-xl border border-line bg-surface p-4 sm:ms-[9.75rem]">
          <p className="text-sm">
            {letter.author ? (
              <>
                From <strong>{letter.author}</strong> to <strong>{letter.recipients}</strong>
                {letter.opening.map((span, i) => (
                  <span key={i} className="text-muted">
                    {i === 0 ? " — " : ", "}
                    <RefLink span={span} />
                  </span>
                ))}
              </>
            ) : (
              <span className="text-muted">The letter names neither its writer nor its readers.</span>
            )}
          </p>
          <ol className="mt-3 space-y-1 text-sm">
            {letter.sections.map((section, i) => (
              <li key={section.start} className="grid grid-cols-[1.5rem_1fr_auto] gap-2">
                <span className="text-right tabular-nums text-muted">{i + 1}</span>
                <RefLink span={[section.start, section.end]} label={section.title} className="hover:text-accent" />
                <span className="tabular-nums text-muted">{formatRange(catalog, section.start, section.end).replace(`${name} `, "")}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
