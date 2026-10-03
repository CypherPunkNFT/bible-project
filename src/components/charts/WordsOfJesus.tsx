import { useState } from "react";
import { Link } from "react-router-dom";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

/** How much of each Gospel is Jesus speaking (the KJV's red letters), chapter by chapter. */
export function WordsOfJesus({ stats }: { stats: Stats }) {
  const [hover, setHover] = useState("");
  const withRed = stats.books.filter((b) => b.red > 0);
  const gospels = GOSPELS.map((code) => stats.books.find((b) => b.code === code)).filter((b): b is Stats["books"][number] => !!b);
  const total = withRed.reduce((s, b) => s + b.red, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div>
        <p className="mb-3 min-h-[1.25rem] text-sm text-muted" aria-live="polite">
          {hover || "Each bar is one chapter; red is the share spoken by Jesus. Point at a bar."}
        </p>
        <div className="space-y-4">
          {gospels.map((b) => (
            <div key={b.code}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{b.name}</span>
                <span className="text-muted">{Math.round((b.red / b.words) * 100)}% in red</span>
              </div>
              <div className="flex h-20 items-end gap-[2px]">
                {b.chapters.map(([, words, red], i) => (
                  <Link
                    key={i}
                    to={`/read/kjv/${b.code}/${i + 1}`}
                    aria-label={`${b.name} ${i + 1}: ${Math.round((red / words) * 100)} percent words of Jesus`}
                    onMouseEnter={() => setHover(`${b.name} ${i + 1}: ${formatNumber(red)} of ${formatNumber(words)} words (${Math.round((red / words) * 100)}%)`)}
                    className="relative flex h-full flex-1 flex-col justify-end overflow-hidden rounded-t-sm bg-surface-2"
                  >
                    <span className="block w-full bg-red transition-all" style={{ height: `${(red / words) * 100}%` }} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Red letters by book</h3>
        <ul className="space-y-1.5 text-sm">
          {withRed
            .sort((a, b) => b.red - a.red)
            .map((b) => (
              <li key={b.code} className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-2">
                <span className="truncate">{b.name}</span>
                <span className="h-2.5 rounded-sm bg-red" style={{ width: `${(b.red / withRed[0].red) * 100}%` }} />
                <span className="text-right tabular-nums text-muted">{formatNumber(b.red)}</span>
              </li>
            ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{formatNumber(total)} words in red in the KJV, counted from its own red-letter markup.</p>
      </div>
    </div>
  );
}
