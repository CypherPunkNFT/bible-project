import { useEffect, useMemo, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { AspectSwitch } from "@/components/people-pages/PersonEntry";
import { APOSTLES_GUIDE } from "@/components/people-pages/links";
import { svg } from "./art/kit";
import type { Landing as Draw } from "./art/landing/shared";
import type { Apostle } from "./types";
import { RefLink } from "./ui";

const VIEW = "0 0 1600 900", NARROW = "620 60 980 820";

function useNarrow(width = 760) {
  const query = `(max-width: ${width - 1}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query), on = () => setNarrow(media.matches);
    media.addEventListener("change", on);
    return () => media.removeEventListener("change", on);
  }, [query]);
  return narrow;
}

/**
 * The full-screen landing, unique for each apostle: his own drawing across the whole first screen, the name, one KJV
 * line (the verse the drawing shows), and the key figures as one thin bar beneath. The way back and the person | mission
 * switch sit at the top left; the counter (Counter.tsx) floats at the top right.
 */
export function Landing({ d, draw }: { d: Apostle; draw: Draw }) {
  const narrow = useNarrow();
  const art = useMemo(() => draw(d), [draw, d]);
  const alt = d.alt[0], { line, also, note } = d.landing;
  const figs: [number, string, string][] = [
    [d.verseCount, "verses that name him", alt ? `+ ${alt.count} that name ${alt.name}` : ""],
    [d.periods[1].entries.length, d.key === "paul" ? "records of the call" : d.key === "matthias" ? "record of following Jesus" : "records with Jesus", ""],
    [d.rows.length, "named beside him", ""],
    [d.trad.length, "sources outside Scripture", "on how it ends"],
  ];
  return <section className="land" data-sec="landing" aria-label={d.name}>
    <div className="land-art">{svg(narrow ? NARROW : VIEW, art, "landing plot", { preserveAspectRatio: narrow ? "xMidYMid meet" : "xMaxYMax meet" })}</div>
    <div className="land-veil" aria-hidden="true" />
    <div className="land-top">
      <BackLink fallback={APOSTLES_GUIDE} />
      <AspectSwitch id={d.id} name={d.name} current="mission" />
    </div>
    <div className="land-text">
      <p className="kicker rule">{d.title}</p>
      <h1 className={d.short.length > 7 ? "long" : undefined}>{d.short}{d.epithet && <em>{d.epithet}</em>}</h1>
      <blockquote className="land-line"><p>“{line.t}”</p>
        <footer><RefLink r={[line.v, line.v]} /> · KJV{also && <span className="land-also"> · “{also.t}” <RefLink r={[also.v, also.v]} /></span>}</footer></blockquote>
      {note && <p className="land-note">{note}</p>}
      <p className="aka">{d.otherNames.length ? `Also called ${d.otherNames.join(" · ")}` : d.tagline}</p>
    </div>
    <dl className="land-bar">{figs.map(([n, t, s]) => <div key={t}><dt>{t}{s && <small>{s}</small>}</dt><dd>{n}</dd></div>)}</dl>
  </section>;
}
