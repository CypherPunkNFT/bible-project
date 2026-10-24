// The quiz opened by zooming into a lesson's circle (E; owner, 2026-10-24: "I want this to zoom in"). The page is the
// camera's view: it zooms in on the chosen circle, which moves to the middle of the screen as the view closes in, until
// the inside of the circle fills the screen; the questions then show there. The zoom is spread evenly over the scale
// (it closes in by the same ratio every moment), as a camera moves in. Only how far in it is (--ck-zoom, 0 to 1) is
// animated; the stylesheet builds the transform from it, so the browser draws the page anew at each size and it stays
// sharp (an animated transform is drawn once and stretched, which showed blocky; owner, 2026-10-24). The circle's icon
// is not zoomed with the page: a sharp copy of it flies from the circle to its place beside the lesson's title, at a set
// size. Back to the lessons runs it all the other way. Every part runs on one clock (zoom-clock.ts) that the ticker can
// slow, pause and step. No motion when the visitor asks for less of it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { toneStyle, type Lesson } from "./data";
import { lessonIcon } from "./icons";
import { LessonPanel } from "./LessonPanel";
import { zoomClock } from "./zoom-clock";

const ZOOM_MS = 800;
const FADE_MS = 300;
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

/** Sets the page up to zoom onto `circle`: where it scales from, and how far it moves and grows for the inside of the
 *  circle to fill the screen with the circle's middle at the screen's middle (read by the stylesheet's transform). */
function zoomOnto(scene: HTMLElement, circle: HTMLElement) {
  const s = scene.getBoundingClientRect(), c = circle.getBoundingClientRect();
  const x = c.left + c.width / 2, y = c.top + c.height / 2;
  const inside = c.width / 2 - parseFloat(getComputedStyle(circle).borderTopWidth || "0");
  scene.style.transformOrigin = `${x - s.left}px ${y - s.top}px`;
  scene.style.setProperty("--ck-dx", `${window.innerWidth / 2 - x}px`);
  scene.style.setProperty("--ck-dy", `${window.innerHeight / 2 - y}px`);
  scene.style.setProperty("--ck-scale", String((Math.hypot(window.innerWidth, window.innerHeight) / 2 / inside) * 1.08));
  scene.dataset.zoom = "";
}

/** Lets the page go back to as it was, not zoomed. */
function unzoom(scene: HTMLElement) {
  for (const name of ["--ck-dx", "--ck-dy", "--ck-scale"]) scene.style.removeProperty(name);
  scene.style.transformOrigin = "";
  delete scene.dataset.zoom;
}

/** Moves the page from `from` to `to` of the way into the circle. */
const zoom = (scene: HTMLElement, from: number, to: number, timing: KeyframeAnimationOptions) =>
  scene.animate([{ "--ck-zoom": from }, { "--ck-zoom": to }], { easing: EASE, fill: "both", ...timing });

export function LessonStage({ lesson, next, bookNames, sceneOf, circleOf, onOpen, onFinish, onClosed }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLSpanElement>(null);
  /** The zoom holding the page at its end, and the lesson it is on. */
  const held = useRef<Animation | null>(null);
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

  /** Gets ready to zoom onto `id`'s circle: measures it with the page as it is and hides its icon. The circle keeps its
   *  hover look (grown, glowing) while its lesson is open, so it is the same circle going in and coming back out. */
  const aim = useCallback((id: string) => {
    const scene = sceneOf(), circle = circleOf(id);
    if (!scene || !circle) return null;
    held.current?.cancel();
    if (pathIcon.current) pathIcon.current.style.visibility = "";
    scene.querySelector("[data-zoomed]")?.removeAttribute("data-zoomed");
    circle.dataset.zoomed = "";
    const svg = circle.querySelector("svg");
    home.current = svg?.getBoundingClientRect() ?? null;
    if (svg) { svg.style.visibility = "hidden"; pathIcon.current = svg; }
    zoomOnto(scene, circle);
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
    if (scene) held.current = zoomClock.add(zoom(scene, 0, 1, { duration: ms(ZOOM_MS) }), "The page zooms into the circle");
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
    sceneOf()?.querySelector("[data-zoomed]")?.removeAttribute("data-zoomed");
    zoomClock.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const from = titleIcon();
    // After Next lesson the view moves, unseen behind the questions, onto the circle of the lesson showing now.
    if (zoomedOn.current !== lessonId.current) {
      const scene = aim(lessonId.current);
      if (scene) held.current = zoom(scene, 1, 1, { duration: 0 });
    }
    // The page may scroll again; its scrollbar comes back while the questions still cover it.
    document.documentElement.style.overflow = "";
    setOpen(false);
    const scene = sceneOf();
    const done = zoomClock.start("Back to the lessons", ms(FADE_MS) + ms(ZOOM_MS));
    zoomClock.add(stage.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(FADE_MS), fill: "both" }), "The questions fade");
    const out = scene && held.current
      ? zoomClock.add(zoom(scene, 1, 0, { delay: ms(FADE_MS), duration: ms(ZOOM_MS) }), "The page zooms out to the path")
      : null;
    if (from && home.current) zoomClock.add(fly.current!.animate([box(from), box(home.current)], { delay: ms(FADE_MS), duration: ms(ZOOM_MS), easing: EASE, fill: "both" }), "The icon goes back into its circle");
    await done;
    out?.cancel();
    held.current?.cancel();
    if (scene) unzoom(scene);
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
