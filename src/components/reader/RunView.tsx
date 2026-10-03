import { useId, useState } from "react";
import type { Run } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DisplayOptions {
  redLetters: boolean;
  footnotes: boolean;
}

const FLAG_CLASSES: Record<string, string> = {
  a: "italic opacity-80", // words the translators added
  n: "divine-name",
  s: "italic text-muted",
  i: "italic",
  b: "font-semibold",
  c: "[font-variant:small-caps]",
};

function styledClass(flags: string, options: DisplayOptions): string {
  return cn(
    flags.includes("j") && options.redLetters && "text-red",
    ...flags.split("").map((flag) => FLAG_CLASSES[flag]),
  );
}

/** One run of Scripture as React text — never raw HTML. */
export function RunView({ run, options }: { run: Run; options: DisplayOptions }) {
  if (typeof run === "string") return <>{run}</>;
  if (Array.isArray(run)) {
    const [text, flags] = run;
    if (flags.includes("u")) return <sup className={styledClass(flags, options)}>{text}</sup>;
    return flags ? <span className={styledClass(flags, options)}>{text}</span> : <>{text}</>;
  }
  if ("f" in run) return options.footnotes ? <Footnote text={run.f} /> : null;
  return null;
}

export function Runs({ runs, options }: { runs: Run[]; options: DisplayOptions }) {
  return (
    <>
      {runs.map((run, index) => (
        <RunView key={index} run={run} options={options} />
      ))}
    </>
  );
}

function Footnote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Footnote"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="mx-0.5 rounded px-0.5 align-super font-sans text-[0.65em] font-semibold text-accent hover:bg-accent/15"
      >
        †
      </button>
      {open && (
        <span id={id} role="note" className="mx-1 rounded bg-surface-2 px-1.5 py-0.5 font-sans text-[0.8em] text-muted">
          {text}
        </span>
      )}
    </span>
  );
}
