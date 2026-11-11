// Pieces every sheet shares (design 6.1, 6.2): the words line by line with "[name]" filled in or left as a line to write
// on, the name heading, and the footer. Typed text is drawn with translate="no" and dir="auto", so a name such as Grace or
// Joy is not translated and a right-to-left name prints correctly; React escapes it, so markup prints as text.
import { Fragment, type CSSProperties } from "react";
import { NAME_TOKEN } from "@/data/home-blessings";
import { PAPER_SIZE, type Paper } from "@/pages/life-events/print-sheet";
import { footerAddress, type PrintText } from "../print-job";

export const BSB_SHORT = "Scripture: Berean Standard Bible (public domain)";

/** The sheet's true size, for the sheet CSS. */
export function sheetStyle(paper: Paper, landscape = false): CSSProperties {
  const size = PAPER_SIZE[paper];
  return { "--sheet-width": landscape ? size.height : size.width, "--sheet-height": landscape ? size.width : size.height } as CSSProperties;
}

/** A dash printed after a word stays on its line (Duncan's "led me,—" wrapped the dash alone at 24 pt): a word joiner. */
export const keepDash = (line: string): string => line.replace(/(\S)\u2014/g, "$1\u2060\u2014");

function Line({ line, name }: { line: string; name: string }) {
  const parts = keepDash(line).split(NAME_TOKEN);
  return (
    <span className="hbs-line">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && (name
            ? <span className="hbs-name" translate="no" dir="auto">{name}</span>
            : <span className="hbs-blank" aria-label="space to write a name" />)}
        </Fragment>
      ))}
    </span>
  );
}

/** The words, one stored line per printed line; a stanza break leaves a gap. Older text and Scripture keep lang="en". */
export function SheetWords({ text, name, className = "" }: { text: PrintText; name: string; className?: string }) {
  const english = text.english ? { lang: "en" } : {};
  return (
    <div className={`hbs-words${text.scripture ? " hbs-scripture" : ""} ${className}`.trim()} {...english}>
      {text.lines.map((line, index) => (line === "" ? <span key={index} className="hbs-stanza" aria-hidden="true" /> : <Line key={index} line={line} name={name} />))}
    </div>
  );
}

/** "For Lily": a heading above the words, never inside them. Long names shrink one step before wrapping. */
export function NameHeading({ value }: { value: string }) {
  if (!value) return null;
  return <p className={`hbs-name-heading${value.length > 18 ? " hbs-long" : ""}`} translate="no" dir="auto">{value}</p>;
}

export function Footer({ slug, scripture }: { slug: string; scripture: boolean }) {
  return (
    <p className="hbs-footer">
      {scripture && <span>{BSB_SHORT} · </span>}
      <span>{footerAddress(slug)}</span>
    </p>
  );
}

/** The fill-in card's prompts, each followed by lines to write on (design 6.3). */
export function Prompts({ prompts }: { prompts: string[] }) {
  return (
    <ol className="hbs-prompts">
      {prompts.map((prompt, index) => (
        <li key={prompt}>
          <span>{prompt}</span>
          {index < prompts.length - 1 && <><span className="hbs-write" /><span className="hbs-write" /></>}
        </li>
      ))}
    </ol>
  );
}
