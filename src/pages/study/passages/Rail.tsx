// The side dots (mock-up js/dir-b.js rail(), as on the Moses page): one dot per section, and a pill that slides to the
// section in view. Pointing at a dot names its section.
import { useEffect, useRef, useState } from "react";
import { stops } from "./evidence";

export function Rail() {
  const [current, setCurrent] = useState(0), [pillY, setPillY] = useState(0);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (seen) setCurrent(stops.findIndex(([id]) => id === seen.target.id));
    }, { rootMargin: "-40% 0px -50% 0px" });
    for (const [id] of stops) {
      const el = document.getElementById(id);
      if (el) observer.observe(el); else console.error(`passage study: the side dots name section #${id}, which the page does not draw`);
    }
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const measure = () => setPillY((links.current[current]?.offsetTop ?? 6) - 6);
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [current]);
  return <nav className="mg-rail b-rail" aria-label="Chapters">
    <i className="mg-rail-pill" aria-hidden="true" style={{ transform: `translateY(${pillY}px)` }} />
    {stops.map(([id, label], i) => <a key={id} href={`#${id}`} ref={(el) => { links.current[i] = el; }} aria-current={i === current ? "true" : undefined}><i /><span>{label}</span></a>)}
  </nav>;
}
