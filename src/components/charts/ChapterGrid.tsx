import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Every chapter as a square, one row per book; the deeper the colour, the longer the chapter. */
export function ChapterGrid({ stats }: { stats: Stats }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string>("");
  const books = stats.books.filter((b) => b.section !== "apocrypha");
  const max = Math.max(...books.flatMap((b) => b.chapters.map((c) => c[1])));

  return (
    <div>
      <p className="mb-3 min-h-[1.25rem] text-sm text-muted" aria-live="polite">
        {hover || "Point at a square to see the chapter; click to read it. Longest chapter: Psalm 119."}
      </p>
      <div className="space-y-[3px]">
        {books.map((b) => (
          <div key={b.code} className="grid grid-cols-[6.5rem_1fr] items-start gap-2">
            <span className="truncate pt-px text-right text-[11px] text-muted">{b.name}</span>
            <div className="flex flex-wrap gap-[2px]">
              {b.chapters.map(([verses, words], i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${b.name} ${i + 1}: ${verses} verses`}
                  onMouseEnter={() => setHover(`${b.name} ${i + 1} — ${verses} verses, ${formatNumber(words)} words`)}
                  onFocus={() => setHover(`${b.name} ${i + 1} — ${verses} verses, ${formatNumber(words)} words`)}
                  onClick={() => navigate(`/read/kjv/${b.code}/${i + 1}`)}
                  className="h-3 w-3 rounded-[2px] transition-transform hover:scale-150"
                  style={{ background: sectionColor(b.section), opacity: 0.2 + 0.8 * Math.sqrt(words / max) }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
