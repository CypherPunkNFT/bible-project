// The quiz opened by zooming into a lesson's circle (E; owner, 2026-10-24: "I want this to zoom in"). The page is the
// camera's view: it zooms in on the chosen circle, which moves to the middle of the screen as the view closes in, until
// the inside of the circle fills the screen; the questions then show there. Back to the lessons zooms out the same way.
// The zoom is spread evenly over the scale (each step closes in by the same ratio), as a camera moves in. No motion
// when the visitor asks for less of it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { toneStyle, type Lesson } from "./data";
import { LessonPanel } from "./LessonPanel";

const ZOOM_MS = 1100;
const FADE_MS = 300;
const STEPS = 16;

interface Props {
  lesson: Lesson; next: Lesson | null; bookNames: Record<string, string>;
  /** The page being zoomed, and a way to find a lesson's circle on it. */
  sceneOf: () => HTMLElement | null; circleOf: (lessonId: string) => HTMLElement | null;
  onOpen: (lesson: Lesson) => void; onFinish: (lesson: Lesson, right: number, total: number) => void; onClosed: () => void;
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((done) => window.setTimeout(done, ms));

/** The zoom onto `circle`: where the page scales from, and the steps from the page as it is to the inside of the
 *  circle filling the screen with the circle's middle at the screen's middle. */
function zoomOnto(scene: HTMLElement, circle: HTMLElement) {
  const s = scene.getBoundingClientRect(), c = circle.getBoundingClientRect();
  const x = c.left + c.width / 2, y = c.top + c.height / 2;
  const dx = window.innerWidth / 2 - x, dy = window.innerHeight / 2 - y;
  const inside = c.width / 2 - parseFloat(getComputedStyle(circle).borderTopWidth || "0");
  const scale = (Math.hypot(window.innerWidth, window.innerHeight) / 2 / inside) * 1.08;
  const frames = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    return { transform: `translate(${dx * t}px, ${dy * t}px) scale(${scale ** t})` };
  });
  return { origin: `${x - s.left}px ${y - s.top}px`, frames };
}

export function LessonStage({ lesson, next, bookNames, sceneOf, circleOf, onOpen, onFinish, onClosed }: Props) {
  const zoom = useRef<Animation | null>(null);
  const zoomedOn = useRef(lesson.id);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [fill, setFill] = useState("");
  const lessonId = useRef(lesson.id);
  useEffect(() => { lessonId.current = lesson.id; }, [lesson.id]);

  /** Sets the page zoomed onto `id`'s circle; `play` false jumps straight to the end. */
  const zoomTo = useCallback((id: string, play: boolean) => {
    const scene = sceneOf(), circle = circleOf(id);
    if (!scene || !circle) return null;
    const { origin, frames } = zoomOnto(scene, circle);
    zoom.current?.cancel();
    scene.style.transformOrigin = origin;
    zoomedOn.current = id;
    setFill(getComputedStyle(circle).backgroundColor);
    zoom.current = scene.animate(frames, { duration: play && !reduced() ? ZOOM_MS : 0, easing: "cubic-bezier(.45,0,.35,1)", fill: "forwards" });
    return zoom.current;
  }, [circleOf, sceneOf]);

  useLayoutEffect(() => {
    if (busy.current) return;
    busy.current = true;
    void (async () => {
      await zoomTo(lesson.id, true)?.finished;
      document.documentElement.style.overflow = "hidden";
      setOpen(true);
      busy.current = false;
    })();
    // Runs once, when the stage first opens; a later lesson (Next lesson) changes only what it shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { document.documentElement.style.overflow = ""; }, []);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    // After Next lesson the view moves, unseen behind the questions, onto the circle of the lesson showing now.
    if (zoomedOn.current !== lessonId.current) zoomTo(lessonId.current, false);
    // The page may scroll again; its scrollbar comes back while the questions still cover it.
    document.documentElement.style.overflow = "";
    setOpen(false);
    await wait(reduced() ? 0 : FADE_MS);
    const z = zoom.current;
    if (z) {
      z.reverse();
      await z.finished;
      z.cancel();
    }
    const scene = sceneOf();
    if (scene) scene.style.transformOrigin = "";
    onClosed();
  }, [onClosed, sceneOf, zoomTo]);

  return <div className="ck-stage" data-open={open ? "" : undefined} style={{ ...toneStyle(lesson.part.tone), "--fill": fill } as CSSProperties}>
    <LessonPanel stage lesson={lesson} bookNames={bookNames} next={next} onClose={close} onOpen={onOpen}
      onFinish={(right, total) => onFinish(lesson, right, total)} />
  </div>;
}
