// The quiz opened by zooming into a lesson's circle (E; owner, 2026-10-24: "I want this to zoom in"). The page is the
// camera's view: it zooms in on the chosen circle, which moves to the middle of the screen as the view closes in, until
// the inside of the circle fills the screen; the questions then show there. The zoom is spread evenly over the scale
// (each step closes in by the same ratio), as a camera moves in. The circle's icon is not zoomed with the page (it
// would blur): a sharp copy of it flies from the circle to its place beside the lesson's title, at a set size (owner,
// 2026-10-24). Back to the lessons runs it all the other way. Every part runs on one clock (zoom-clock.ts) that the
// ticker can slow, pause and step. No motion when the visitor asks for less of it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { toneStyle, type Lesson } from "./data";
import { lessonIcon } from "./icons";
import { LessonPanel } from "./LessonPanel";
import { zoomClock } from "./zoom-clock";

const ZOOM_MS = 1100;
const FADE_MS = 300;
const STEPS = 16;
const EASE = "cubic-bezier(.45,0,.35,1)";

interface Props {
  lesson: Lesson; next: Lesson | null; bookNames: Record<string, string>;
  /** The page being zoomed, and a way to find a lesson's circle on it. */
  sceneOf: () => HTMLElement | null; circleOf: (lessonId: string) => HTMLElement | null;
  onOpen: (lesson: Lesson) => void; onFinish: (lesson: Lesson, right: number, total: number) => void; onClosed: () => void;
}

/** How long a part takes: nothing when the visitor asks for less motion. */
const ms = (time: number) => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : time);
const box = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

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
  const stage = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLSpanElement>(null);
  /** The zoom holding the page at its end, its steps, and the lesson it is on. */
  const held = useRef<Animation | null>(null);
  const frames = useRef<Keyframe[]>([]);
  const zoomedOn = useRef(lesson.id);
  /** The icon on the path, hidden while its copy flies, and where it sits there (measured with the page not zoomed). */
  const pathIcon = useRef<SVGElement | null>(null);
  const home = useRef<DOMRect | null>(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [fill, setFill] = useState("");
  const lessonId = useRef(lesson.id);
  useEffect(() => { lessonId.current = lesson.id; }, [lesson.id]);
  const Icon = lessonIcon(lesson);

  /** Gets ready to zoom onto `id`'s circle: measures it with the page as it is and hides its icon. */
  const aim = useCallback((id: string) => {
    const scene = sceneOf(), circle = circleOf(id);
    if (!scene || !circle) return null;
    held.current?.cancel();
    if (pathIcon.current) pathIcon.current.style.visibility = "";
    const svg = circle.querySelector("svg");
    home.current = svg?.getBoundingClientRect() ?? null;
    if (svg) { svg.style.visibility = "hidden"; pathIcon.current = svg; }
    const zoom = zoomOnto(scene, circle);
    scene.style.transformOrigin = zoom.origin;
    frames.current = zoom.frames;
    zoomedOn.current = id;
    setFill(getComputedStyle(circle).backgroundColor);
    return scene;
  }, [circleOf, sceneOf]);

  const titleIcon = () => stage.current?.querySelector(".ck-stage-icon")?.getBoundingClientRect() ?? null;

  useLayoutEffect(() => {
    if (busy.current) return;
    busy.current = true;
    const scene = aim(lesson.id), to = titleIcon();
    const done = zoomClock.start(`Into lesson ${lesson.n}`, ms(ZOOM_MS) + ms(FADE_MS));
    if (scene) held.current = zoomClock.add(scene.animate(frames.current, { duration: ms(ZOOM_MS), easing: EASE, fill: "forwards" }), "The page zooms into the circle");
    if (home.current && to) zoomClock.add(fly.current!.animate([box(home.current), box(to)], { duration: ms(ZOOM_MS), easing: EASE, fill: "both" }), "The icon moves beside the title");
    zoomClock.add(stage.current!.animate([{ opacity: 0 }, { opacity: 1 }], { delay: ms(ZOOM_MS), duration: ms(FADE_MS), fill: "both" }), "The questions appear");
    void done.then(() => {
      document.documentElement.style.overflow = "hidden";
      setOpen(true);
      busy.current = false;
    });
    // Runs once, when the stage first opens; a later lesson (Next lesson) changes only what it shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    document.documentElement.style.overflow = "";
    if (pathIcon.current) pathIcon.current.style.visibility = "";
    zoomClock.end();
  }, []);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const from = titleIcon();
    // After Next lesson the view moves, unseen behind the questions, onto the circle of the lesson showing now.
    if (zoomedOn.current !== lessonId.current) {
      const scene = aim(lessonId.current);
      if (scene) held.current = scene.animate(frames.current, { duration: 0, fill: "forwards" });
    }
    // The page may scroll again; its scrollbar comes back while the questions still cover it.
    document.documentElement.style.overflow = "";
    setOpen(false);
    const scene = sceneOf();
    const done = zoomClock.start("Back to the lessons", ms(FADE_MS) + ms(ZOOM_MS));
    zoomClock.add(stage.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(FADE_MS), fill: "both" }), "The questions fade");
    const out = scene && held.current
      ? zoomClock.add(scene.animate([...frames.current].reverse(), { delay: ms(FADE_MS), duration: ms(ZOOM_MS), easing: EASE, fill: "both" }), "The page zooms out to the path")
      : null;
    if (from && home.current) zoomClock.add(fly.current!.animate([box(from), box(home.current)], { delay: ms(FADE_MS), duration: ms(ZOOM_MS), easing: EASE, fill: "both" }), "The icon goes back into its circle");
    await done;
    out?.cancel();
    held.current?.cancel();
    if (scene) scene.style.transformOrigin = "";
    zoomClock.end();
    onClosed();
  }, [aim, onClosed, sceneOf]);

  const tone = { ...toneStyle(lesson.part.tone), "--fill": fill } as CSSProperties;
  return <>
    <div ref={stage} className="ck-stage" data-open={open ? "" : undefined} style={tone}>
      <LessonPanel stage lesson={lesson} bookNames={bookNames} next={next} onClose={close} onOpen={onOpen}
        onFinish={(right, total) => onFinish(lesson, right, total)} />
    </div>
    <span ref={fly} className="ck-fly" style={tone} hidden={open} aria-hidden><Icon strokeWidth={1.6} /></span>
  </>;
}
