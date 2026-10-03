import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SECTION_BY_ID, sectionColor } from "@/lib/sections";
import type { Stats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface Bar {
  code: string;
  name: string;
  chapter: number;
  verses: number;
  words: number;
  section: Stats["books"][number]["section"];
}

/** Every chapter of the Bible as one bar, height = words, colour = section. Click opens the chapter. */
export function ChapterSpectrum({ stats, slug, height = 120 }: { stats: Stats; slug: string; height?: number }) {
  const navigate = useNavigate();
  const [hover, setHover] = useState<Bar | null>(null);
  const bars = useMemo<Bar[]>(
    () =>
      stats.books
        .filter((b) => b.section !== "apocrypha")
        .flatMap((b) => b.chapters.map(([verses, words], i) => ({ code: b.code, name: b.name, chapter: i + 1, verses, words, section: b.section }))),
    [stats],
  );
  const max = Math.max(...bars.map((b) => b.words));
  const width = bars.length;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-28 w-full sm:h-36"
        role="img"
        aria-label={`All ${bars.length} chapters of the Bible, each bar as tall as the chapter is long, coloured by section`}
        onMouseLeave={() => setHover(null)}
      >
        {bars.map((bar, index) => {
          const h = Math.max(2, (bar.words / max) * height);
          return (
            <rect
              key={`${bar.code}${bar.chapter}`}
              x={index}
              y={height - h}
              width={1}
              height={h}
              fill={sectionColor(bar.section)}
              opacity={hover && hover.code !== bar.code ? 0.35 : 1}
              onMouseEnter={() => setHover(bar)}
              onClick={() => navigate(`/read/${slug}/${bar.code}/${bar.chapter}`)}
              className="cursor-pointer"
            />
          );
        })}
      </svg>
      <figcaption className="mt-2 flex min-h-[1.5rem] flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {hover ? (
          <span>
            <strong className="text-ink">
              {hover.name} {hover.chapter}
            </strong>{" "}
            · {SECTION_BY_ID[hover.section].name} · {hover.verses} verses · {formatNumber(hover.words)} words — click to read
          </span>
        ) : (
          <span>
            {formatNumber(bars.length)} chapters, Genesis to Revelation. Each bar is one chapter; its height is its length. Point at one, click to read it.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
