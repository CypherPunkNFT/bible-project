// The Names of God exactly as on the CypherPunk NFT Faith page (src/pages/FaithNamesMockupPage.tsx, embedded
// section with preamble): three great words — ABBA FATHER, JESUS CHRIST, HOLY SPIRIT — each filled with the names,
// which unfold into a field of names; pick a name to read its Scripture. One change: "Read in context" opens this
// site's own reader instead of an outside site.
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { nameGroups, type NameEntry } from "@/data/faith-name-order";
import { useCatalog } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { useLetterExpansion } from "./useLetterExpansion";
import "./names-of-god.css";

type Tone = "father" | "jesus" | "spirit";

const BOOK_ALIASES: Record<string, string> = { psalm: "psalms", "song of solomon": "song of songs" };

/** "Mark 14:36" / "Psalm 23:1" -> /read/kjv/MRK/14?hl=36-36 on this site. */
function readerLink(catalog: Catalog, reference: string): string {
  const match = /^(.+?)\s+(\d+):(\d+)(?:[-,](\d+))?/.exec(reference);
  if (!match) return `/search?q=${encodeURIComponent(reference)}`;
  const name = match[1].toLowerCase();
  const book = catalog.books.find((b) => b.name.toLowerCase() === (BOOK_ALIASES[name] ?? name));
  if (!book) return `/search?q=${encodeURIComponent(reference)}`;
  return `/read/kjv/${book.code}/${match[2]}?hl=${match[3]}-${match[4] ?? match[3]}`;
}

function ScriptureReading({ entry, onClose }: { entry: NameEntry; onClose: () => void }) {
  const catalog = useCatalog();
  const [page, setPage] = useState(0);
  const readings = entry.passages.flatMap((passage) => passage.verses.map((verse) => ({ ...verse, reference: passage.reference })));
  const reading = readings[page];
  if (!reading) return null;
  return (
    <article className="word-scripture-content" tabIndex={-1} aria-label={`${entry.name} Scripture`} data-reading-content>
      <header>
        <p>Scripture / {reading.reference} · KJV</p>
        <button type="button" onClick={onClose} aria-label="Back to names">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <h3>{entry.name}</h3>
      <div className="word-scripture-verse" aria-live="polite" aria-atomic="true">
        <blockquote>
          <sup>{reading.number}</sup> {reading.text}
        </blockquote>
      </div>
      <footer>
        <Link to={readerLink(catalog, reading.reference)}>
          Read in context <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
        {readings.length > 1 && (
          <nav aria-label="Scripture passages">
            <button type="button" aria-label="Previous verse" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
              <ArrowLeft size={16} />
            </button>
            <span>
              {page + 1} / {readings.length}
            </span>
            <button type="button" aria-label="Next verse" disabled={page === readings.length - 1} onClick={() => setPage((value) => value + 1)}>
              <ArrowRight size={16} />
            </button>
          </nav>
        )}
      </footer>
    </article>
  );
}

const pillars: Array<{ label: string; stacked: string[]; tone: Tone }> = [
  { label: "FATHER", stacked: ["ABBA", "FATHER"], tone: "father" },
  { label: "JESUS", stacked: ["JESUS", "CHRIST"], tone: "jesus" },
  { label: "SPIRIT", stacked: ["HOLY", "SPIRIT"], tone: "spirit" },
];

function rowsFor(names: NameEntry[], height: number) {
  if (!names.length) return [];
  let cursor = 0;
  // Continue through the approved names, repeating as needed so every row spans the entire word.
  return Array.from({ length: Math.floor((height - 24) / 12) }, () => {
    const row: NameEntry[] = [];
    let length = 0;
    while (length < 156) {
      const entry = names[cursor % names.length];
      length += (row.length ? 3 : 0) + entry.name.length;
      row.push(entry);
      cursor++;
    }
    return row;
  });
}

function NameWord({ words, names, tone }: { words: string[]; names: NameEntry[]; tone: Tone }) {
  const letters = useRef<Array<SVGTextElement | null>>([]);
  const [wordTransforms, setWordTransforms] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<NameEntry | null>(null);
  const [activeOccurrence, setActiveOccurrence] = useState("");
  const [readingSpace, setReadingSpace] = useState({ left: 50, width: 46 });
  const readingRoot = useRef<HTMLDivElement>(null);
  const nameTrigger = useRef<SVGTSpanElement | null>(null);
  const focusReading = useRef(false);
  const id = useId().replace(/:/g, "");
  const maskId = `word-mask-${id}`;
  const filterId = `word-expansion-${id}`;
  // Sized to the farthest empty corner of each fitted Archivo wordform.
  const expansionRadius = tone === "father" ? (words.length > 1 ? 94 : 50) : tone === "jesus" ? 132 : 116;
  const { morphologyRef, glyphsRef, rectangleRef, buttonRef } = useLetterExpansion(expanded, filterId, expansionRadius);
  const label = words.join(" ");
  const lineCount = words.length;
  const height = lineCount * 204 + 8;
  const rows = rowsFor(names, height);
  const seen = new Set<string>();
  const clearReading = (restoreFocus = false) => {
    setSelected(null);
    setActiveOccurrence("");
    if (restoreFocus) (expanded ? nameTrigger.current : buttonRef.current)?.focus({ preventScroll: true });
  };
  const unfold = () => {
    clearReading();
    setExpanded(true);
  };
  const fold = (focus = false) => {
    setExpanded(false);
    if (focus) buttonRef.current?.focus({ preventScroll: true });
  };
  const selectName = (entry: NameEntry, occurrence: string, target: SVGTSpanElement, keyboard = false) => {
    const field = buttonRef.current;
    if (!field || field.dataset.edgeState !== "expanded") return;
    const bounds = field.getBoundingClientRect();
    const word = target.getBoundingClientRect();
    const leftRoom = ((word.left - bounds.left) / bounds.width) * 100;
    const rightStart = ((word.right - bounds.left) / bounds.width) * 100;
    const placeRight = 100 - rightStart > leftRoom;
    const width = Math.min(64, (placeRight ? 100 - rightStart : leftRoom) - 6);
    setReadingSpace({ left: placeRight ? 97 - width : 3, width });
    nameTrigger.current = target;
    focusReading.current = keyboard;
    setActiveOccurrence(occurrence);
    setSelected(entry);
  };

  useEffect(() => {
    if (selected && focusReading.current) {
      readingRoot.current?.querySelector<HTMLElement>(".word-scripture-content")?.focus({ preventScroll: true });
      focusReading.current = false;
    }
  }, [selected, activeOccurrence]);

  useEffect(() => {
    if (!expanded) return;
    const field = buttonRef.current;
    if (!field) return;
    const outside = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Node)) return;
      if (field.contains(event.target) || readingRoot.current?.contains(event.target)) return;
      setExpanded(false);
    };
    const rootStyle = getComputedStyle(document.documentElement);
    const headerSize = rootStyle.getPropertyValue("--header-h").trim();
    const headerHeight = (parseFloat(headerSize) || 64) * (headerSize.endsWith("rem") ? parseFloat(rootStyle.fontSize) : 1);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio <= 0.25) setExpanded(false);
      },
      { threshold: [0, 0.25], rootMargin: `-${headerHeight}px 0px 0px 0px` },
    );
    observer.observe(field);
    document.addEventListener("pointerdown", outside);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded, buttonRef]);

  useEffect(() => {
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const context = document.createElement("canvas").getContext("2d");
      const transforms = letters.current.slice(0, lineCount).map((element, index) => {
        if (!element) return "";
        const bounds = element.getBBox();
        if (!bounds.width || !bounds.height) return "";
        // SVG bounds include font leading; use the actual ink height so stacked lines fit the lettering.
        const font = getComputedStyle(element);
        if (context) context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
        const metrics = context?.measureText(element.textContent ?? "");
        const ascent = metrics?.actualBoundingBoxAscent ?? -bounds.y;
        const inkHeight = ascent + (metrics?.actualBoundingBoxDescent ?? bounds.height + bounds.y);
        return `translate(20 ${16 + index * 204}) scale(${1160 / bounds.width} ${180 / inkHeight}) translate(${-bounds.x} ${ascent})`;
      });
      setWordTransforms(transforms);
    };
    void document.fonts.ready.then(fit);
    document.fonts.addEventListener("loadingdone", fit);
    return () => {
      disposed = true;
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [label, lineCount]);

  return (
    <div
      ref={readingRoot}
      className={`word-interaction word-interaction-${tone}`}
      data-open={expanded}
      data-reading={Boolean(selected)}
      data-stacked={lineCount > 1}
      style={{ "--reading-left": `${readingSpace.left}%`, "--reading-width": `${readingSpace.width}%` } as CSSProperties}
    >
      <div className="word-canvas">
        <div
          ref={buttonRef}
          role={expanded ? "group" : "button"}
          tabIndex={expanded ? -1 : 0}
          className={`names-word names-word-${tone}`}
          aria-label={`${expanded ? "Explore" : "Expand"} ${label} names`}
          aria-expanded={expanded}
          aria-controls={`word-field-${id}`}
          title={expanded ? undefined : "Click to unfold all names"}
          data-expanded={expanded}
          data-reading={expanded && Boolean(selected)}
          onClick={() => {
            if (!expanded) unfold();
          }}
          onDoubleClick={() => {
            if (expanded) fold(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              if (selected) clearReading();
              else fold(true);
            }
            if (!expanded && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              unfold();
            }
          }}
        >
          <svg id={`word-field-${id}`} viewBox={`0 0 1200 ${height}`} aria-hidden={!expanded} focusable="false" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id={filterId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width="1200" height={height} colorInterpolationFilters="sRGB">
                <feMorphology ref={morphologyRef} in="SourceAlpha" operator="dilate" radius="0" />
              </filter>
              <mask id={maskId} className="word-edge-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="1200" height={height}>
                <g ref={glyphsRef}>
                  {words.map((word, index) => (
                    <g key={word} transform={wordTransforms[index]} visibility={wordTransforms[index] ? "visible" : "hidden"}>
                      <text
                        ref={(element) => {
                          letters.current[index] = element;
                        }}
                        x="0"
                        y="0"
                        fill="white"
                        className="word-mask-text"
                      >
                        {word}
                      </text>
                    </g>
                  ))}
                </g>
                <rect ref={rectangleRef} width="1200" height={height} fill="white" visibility="hidden" />
              </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
              <rect width="1200" height={height} className="word-fill" />
              {rows.map((row, index) => (
                <text key={`${tone}-${index}`} x="16" y={20 + index * 12} textLength="1168" lengthAdjust="spacing" className="word-name-row">
                  {row.map((entry, item) => {
                    const first = !seen.has(entry.id);
                    seen.add(entry.id);
                    const occurrence = `${index}-${item}`;
                    return (
                      <tspan key={`${entry.id}-${item}`}>
                        <tspan className="word-name-separator" aria-hidden="true">
                          {item ? " · " : ""}
                        </tspan>
                        <tspan
                          className="word-name-link"
                          role="button"
                          aria-label={entry.name}
                          aria-controls={`scripture-${id}`}
                          aria-pressed={selected !== null && activeOccurrence === occurrence}
                          data-selected={selected !== null && activeOccurrence === occurrence}
                          tabIndex={expanded && first ? 0 : -1}
                          onClick={(event) => {
                            if (!expanded) return;
                            event.stopPropagation();
                            selectName(entry, occurrence, event.currentTarget);
                          }}
                          onDoubleClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              selectName(entry, occurrence, event.currentTarget, true);
                            }
                          }}
                        >
                          {entry.name.toUpperCase()}
                        </tspan>
                      </tspan>
                    );
                  })}
                </text>
              ))}
            </g>
          </svg>
        </div>
        <div
          id={`scripture-${id}`}
          className="word-scripture word-scripture-inside"
          data-visible={Boolean(selected)}
          onKeyDown={(event) => {
            if (event.key === "Escape") clearReading(true);
          }}
        >
          {selected && <ScriptureReading key={selected.id} entry={selected} onClose={() => clearReading(true)} />}
        </div>
      </div>
      <div className="word-field-controls" aria-hidden={!expanded}>
        <span>{selected ? "Select another name to explore" : "Select a name to read Scripture"}</span>
        <button type="button" tabIndex={expanded ? 0 : -1} onClick={() => fold(true)}>
          Fold back ↗
        </button>
      </div>
    </div>
  );
}

/** The Faith page's "His names." section, on its own dark panel so it looks the same on this light site. */
export function NamesOfGod({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <div className="names-of-god-panel">
      <section id="names-of-god" aria-labelledby="names-heading" className="faith-names-mockup names-section-study names-section-embedded">
        <header className="names-section-preamble">
          <div>
            <p className="names-mockup-label">Faith in Christ</p>
            <Heading id="names-heading">His names.</Heading>
          </div>
          <p>
            Names and titles of God as revealed in Scripture.
            <br />
            <span>Click on the names to expand the list and read its passages.</span>
          </p>
        </header>
        <div className="names-pillar-stack">
          {pillars.map((pillar, index) => {
            const group = nameGroups[index] ?? [];
            return (
              <section id={`names-${pillar.tone}`} aria-labelledby={`heading-${pillar.tone}`} className={`names-pillar names-pillar-${pillar.tone}`} key={pillar.tone}>
                <h2 id={`heading-${pillar.tone}`} className="sr-only">
                  {pillar.stacked.join(" ")}
                </h2>
                <NameWord words={pillar.stacked} names={group} tone={pillar.tone} />
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
