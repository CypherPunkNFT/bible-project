// The quiz opened out of a lesson's circle (E; owner, 2026-10-24: "zoom into that icon… the whole screen should only show
// the questions", as the home page's map flies onto a city and opens its map out of the dot). Two steps, like that map:
// the path grows towards the circle and carries it to the middle of the screen, then the whole screen opens out of it in a widening circle. Closing runs the same
// two steps back into the circle of the lesson then showing. No motion when the visitor asks for less of it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toneStyle, type Lesson } from "./data";
import { LessonPanel } from "./LessonPanel";

const ZOOM_MS = 650;
const OPEN_MS = 700;
const ZOOM_SCALE = 2.4;

interface Props {
  lesson: Lesson; next: Lesson | null; bookNames: Record<string, string>;
  /** The path's section, which grows towards the circle, and a way to find a lesson's circle in it. */
  sectionOf: () => HTMLElement | null; circleOf: (lessonId: string) => HTMLElement | null;
  onOpen: (lesson: Lesson) => void; onFinish: (lesson: Lesson, right: number, total: number) => void; onClosed: () => void;
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A clip-path circle on the screen, around the middle of `el` (or the middle of the screen). */
function circleAround(el: HTMLElement | null, radius?: number) {
  const r = el?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2, y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  return `circle(${radius ?? (r ? r.width / 2 : 0)}px at ${x}px ${y}px)`;
}

export function LessonStage({ lesson, next, bookNames, sectionOf, circleOf, onOpen, onFinish, onClosed }: Props) {
  const veil = useRef<HTMLDivElement>(null);
  const zoom = useRef<Animation | null>(null);
  const busy = useRef(false);
  const [ready, setReady] = useState(false);
  const lessonId = useRef(lesson.id);
  useEffect(() => { lessonId.current = lesson.id; }, [lesson.id]);

  useLayoutEffect(() => {
    if (busy.current) return;
    busy.current = true;
    const circle = circleOf(lesson.id), section = sectionOf(), el = veil.current!;
    const duration = (ms: number) => (reduced() ? 0 : ms);
    void (async () => {
      if (section && circle) {
        const s = section.getBoundingClientRect(), c = circle.getBoundingClientRect();
        section.dataset.zooming = "";
        section.style.transformOrigin = `${c.left + c.width / 2 - s.left}px ${c.top + c.height / 2 - s.top}px`;
        // The circle glides to the middle of the screen as it grows, as the map flies onto a city.
        const dx = window.innerWidth / 2 - (c.left + c.width / 2), dy = window.innerHeight / 2 - (c.top + c.height / 2);
        zoom.current = section.animate([{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${ZOOM_SCALE})` }],
          { duration: duration(ZOOM_MS), easing: "cubic-bezier(.6,0,.3,1)", fill: "forwards" });
        await zoom.current.finished;
      }
      const far = Math.hypot(window.innerWidth, window.innerHeight);
      el.style.visibility = "visible";
      await el.animate([{ clipPath: circleAround(circle) }, { clipPath: circleAround(circle, far) }],
        { duration: duration(OPEN_MS), easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }).finished;
      document.documentElement.style.overflow = "hidden";
      setReady(true);
      busy.current = false;
    })();
    // Runs once, when the stage first opens; a later lesson (Next lesson) changes only what it shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { document.documentElement.style.overflow = ""; }, []);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setReady(false);
    document.documentElement.style.overflow = "";
    const circle = circleOf(lessonId.current), section = sectionOf(), el = veil.current!;
    const far = Math.hypot(window.innerWidth, window.innerHeight);
    await el.animate([{ clipPath: circleAround(circle, far) }, { clipPath: circleAround(circle) }],
      { duration: reduced() ? 0 : OPEN_MS * 0.8, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }).finished;
    el.style.visibility = "hidden";
    if (zoom.current) {
      zoom.current.reverse();
      await zoom.current.finished;
      zoom.current.cancel();
    }
    if (section) { section.style.transformOrigin = ""; delete section.dataset.zooming; }
    onClosed();
  }, [circleOf, onClosed, sectionOf]);

  return <div ref={veil} className="ck-stage" data-ready={ready ? "" : undefined} style={toneStyle(lesson.part.tone)}>
    <LessonPanel stage lesson={lesson} bookNames={bookNames} next={next} onClose={close} onOpen={onOpen}
      onFinish={(right, total) => onFinish(lesson, right, total)} />
  </div>;
}
