// MOCK-UP (home_mockup2): "Every word, traced to its source." The figures (from the dated snapshot on /sources, 7 October
// 2026) count up once in view; each of the eight collections opens the /sources catalogue on that collection (?collection=<id>).
// Styles: home-sources.css.
import { ArrowRight, ArrowUpRight, BookMarked, BookOpen, HeartHandshake, Library, Mic, ScrollText, Shield, Users, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { CollectionArt, collectionTones } from "@/components/sources/CollectionArt";
import "./home-sources.css";

const FIGURES = [
  { value: 37, label: "Bible editions, free to read and download" },
  { value: 39179, label: "texts extracted and searchable" },
  { value: 11.6, decimals: 1, unit: "million", label: "searchable passages" },
  { value: 8, label: "collections, each traced to its sources" },
];

// Names and definitions as on /sources (generated/source-directory.json).
const COLLECTIONS: { id: string; name: string; text: string; Icon: LucideIcon }[] = [
  { id: "sermons", name: "Sermons & exposition", text: "Complete sermons and series, indexed by their text.", Icon: Mic },
  { id: "scripture", name: "Understanding Scripture", text: "Commentary, interpretation, biblical theology and language helps.", Icon: BookOpen },
  { id: "theology", name: "Theology & doctrine", text: "Systematic and particular treatments of doctrine.", Icon: Library },
  { id: "apologetics", name: "Apologetics & other beliefs", text: "Questions, arguments, objections, debates and sourced comparison.", Icon: Shield },
  { id: "christian-life", name: "Christian life & devotion", text: "Prayer, holiness and the concerns of the soul.", Icon: HeartHandshake },
  { id: "ministry", name: "Church & ministry", text: "Preaching, pastoral care, discipleship, worship and missions.", Icon: Users },
  { id: "history", name: "History & lives", text: "Histories, biographies, letters and first-person records.", Icon: ScrollText },
  { id: "standards", name: "Confessions & reference", text: "Confessions, catechisms, dictionaries and bibliographies.", Icon: BookMarked },
];

/** A figure that counts up from zero the first time it scrolls into view (shown at once when motion is reduced). */
function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(0);
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { setShown(value); return; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setShown(value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    if (element.current) observer.observe(element.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);
  return <span ref={element}>{shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

export function HomeSources() {
  return <section className="hs home-wrap" aria-labelledby="hs-title">
    <header className="hs-head">
      <div><p className="home-eyebrow">Sources & references</p>
        <h2 id="hs-title">Every word, <em>traced to its source.</em></h2></div>
      <p>Nothing here is anonymous. Every edition, book, sermon and map layer is held as it was downloaded, with its licence and its
        origin on record, and credited where it is used. When a source is uncertain, or a place is disputed, we say so.</p>
    </header>

    <dl className="hs-figures">{FIGURES.map((figure) => <div key={figure.label}>
      <dt><CountUp value={figure.value} decimals={figure.decimals} />{figure.unit && <small>{figure.unit}</small>}</dt><dd>{figure.label}</dd></div>)}</dl>

    <div className="hs-block">
      <div className="hs-block-head"><h3>How the library is organised</h3><p>Eight collections. Open one to browse its authors and works.</p></div>
      <ul className="hs-collections">{COLLECTIONS.map(({ id, name, text, Icon }, i) => <li key={id} style={{ "--hs-collection-tone": collectionTones[id] } as CSSProperties}>
        <Link to={`/sources?collection=${id}#bibliography`}>
          <span className="hs-collection-top"><Icon className="hs-collection-legacy" size={22} strokeWidth={1.5} aria-hidden /><span className="hs-collection-art"><CollectionArt id={id}/></span><span>{String(i + 1).padStart(2, "0")}</span></span>
          <strong>{name}</strong><span className="hs-collection-text">{text}</span>
          <span className="hs-collection-open">Open the collection <ArrowRight size={14} aria-hidden /></span>
        </Link></li>)}</ul>
    </div>

    <p className="hs-foot"><span>Figures from the dated snapshot of 7 October 2026, not live counters.</span>
      <Link to="/sources">Explore every source <ArrowUpRight size={15} aria-hidden /></Link></p>
  </section>;
}
