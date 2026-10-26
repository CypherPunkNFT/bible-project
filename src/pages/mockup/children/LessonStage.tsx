// The quiz opened by zooming into a lesson's circle (E; owner, 2026-10-24: "I want this to zoom in"). Clicking the circle
// presses it and its icon goes away first (owner: the icons were a distraction in the zoom); then the page, as the
// camera's view, zooms in on the empty circle, which moves to the middle of the screen as the view closes in, until the
// inside of the circle fills the screen; the questions, with the lesson's icon beside the title, then fade in there. The
// zoom is spread evenly over the scale (it closes in by the same ratio every moment), as a camera moves in. Only how
// far in it is (--ck-zoom, 0 to 1) is animated; the stylesheet builds the transform from it, so the browser draws the
// page anew at each size and it stays sharp (an animated transform is drawn once and stretched, which showed blocky).
// Back to the lessons runs it all the other way, the icon coming back into its circle last. Every part runs on one
// clock (zoom-clock.ts) that the ticker can slow, pause and step. No motion when the visitor asks for less of it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { toneStyle, type Lesson } from "./data";
import { LessonPanel } from "./LessonPanel";
import { CLICK_MS, ms, zoomClock } from "./zoom-clock";

const ZOOM_MS = 800;
const FADE_MS = 300;
const EASE = "cubic-bezier(.45,0,.35,1)";
const ICON_GONE = { opacity: 0, transform: "scale(.4)" };
const ICON_HERE = { opacity: 1, transform: "scale(1)" };

interface Props {
  lesson: Lesson; next: Lesson | null; bookNames: Record<string, string>;
  /** The page being zoomed, and a way to find a lesson's circle on it. */
  sceneOf: () => HTMLElement | null; circleOf: (lessonId: string) => HTMLElement | null;
  onOpen: (lesson: Lesson) => void; onFinish: (lesson: Lesson, right: number, total: number) => void; onClosed: () => void;
}

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
  /** The zoom holding the page at its end, and the lesson it is on. */
  const held = useRef<Animation | null>(null);
  const zoomedOn = useRef(lesson.id);
  /** That lesson's circle, and the animation keeping its icon away while the lesson is open. */
  const circle = useRef<HTMLElement | null>(null);
  const iconAway = useRef<Animation | null>(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [fill, setFill] = useState("");
  const lessonId = useRef(lesson.id);
  useEffect(() => { lessonId.current = lesson.id; }, [lesson.id]);

  /** Gets ready to zoom onto `id`'s circle: measures it with the page as it is, and gives back the icon of the circle
   *  it was on. The circle keeps its hover look (grown, glowing) while its lesson is open, so it is the same circle
   *  going in and coming back out. */
  const aim = useCallback((id: string) => {
    const scene = sceneOf(), target = circleOf(id);
    if (!scene || !target) return null;
    held.current?.cancel();
    iconAway.current?.cancel();
    circle.current?.removeAttribute("data-zoomed");
    target.dataset.zoomed = "";
    circle.current = target;
    zoomOnto(scene, target);
    zoomedOn.current = id;
    setFill(getComputedStyle(target).backgroundColor);
    return scene;
  }, [circleOf, sceneOf]);

  /** Takes the circle's icon away over `timing`, and keeps it away. */
  const takeIcon = (timing: KeyframeAnimationOptions) => {
    const icon = circle.current?.querySelector("svg");
    return icon ? icon.animate([ICON_HERE, ICON_GONE], { easing: "ease-in", fill: "both", ...timing }) : null;
  };

  useLayoutEffect(() => {
    if (busy.current) return;
    busy.current = true;
    const scene = aim(lesson.id);
    const done = zoomClock.start(`Into lesson ${lesson.n}`, ms(CLICK_MS) + ms(ZOOM_MS) + ms(FADE_MS));
    const press = circle.current?.animate([{ transform: "scale(1.08)" }, { transform: "scale(.92)", offset: 0.4 }, { transform: "scale(1.08)" }], { duration: ms(CLICK_MS), easing: "ease-out" });
    if (press) zoomClock.add(press, "The circle is pressed");
    iconAway.current = takeIcon({ duration: ms(CLICK_MS) });
    if (iconAway.current) zoomClock.add(iconAway.current, "Its icon goes away");
    if (scene) held.current = zoomClock.add(zoom(scene, 0, 1, { delay: ms(CLICK_MS), duration: ms(ZOOM_MS) }), "The page zooms into the circle");
    zoomClock.add(stage.current!.animate([{ opacity: 0 }, { opacity: 1 }], { delay: ms(CLICK_MS) + ms(ZOOM_MS), duration: ms(FADE_MS), fill: "both" }), "The questions appear");
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
    iconAway.current?.cancel();
    circle.current?.removeAttribute("data-zoomed");
    zoomClock.end();
  }, []);

  const close = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    // After Next lesson the view moves, unseen behind the questions, onto the circle of the lesson showing now.
    if (zoomedOn.current !== lessonId.current) {
      const scene = aim(lessonId.current);
      if (scene) held.current = zoom(scene, 1, 1, { duration: 0 });
    }
    // The page may scroll again; its scrollbar comes back while the questions still cover it.
    document.documentElement.style.overflow = "";
    setOpen(false);
    const scene = sceneOf();
    const done = zoomClock.start("Back to the lessons", ms(FADE_MS) + ms(ZOOM_MS) + ms(CLICK_MS));
    zoomClock.add(stage.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(FADE_MS), fill: "both" }), "The questions fade");
    const out = scene && held.current
      ? zoomClock.add(zoom(scene, 1, 0, { delay: ms(FADE_MS), duration: ms(ZOOM_MS) }), "The page zooms out to the path")
      : null;
    const back = takeIcon({ delay: ms(FADE_MS) + ms(ZOOM_MS), duration: ms(CLICK_MS), direction: "reverse", easing: "ease-out" });
    iconAway.current?.cancel();
    if (back) zoomClock.add(back, "The icon comes back into its circle");
    await done;
    out?.cancel();
    back?.cancel();
    held.current?.cancel();
    if (scene) unzoom(scene);
    zoomClock.end();
    onClosed();
  }, [aim, onClosed, sceneOf]);

  const tone = { ...toneStyle(lesson.part.tone), "--fill": fill } as CSSProperties;
  return <div ref={stage} className="ck-stage" data-open={open ? "" : undefined} style={tone}>
    <LessonPanel lesson={lesson} bookNames={bookNames} next={next} onClose={close} onOpen={onOpen}
      onFinish={(right, total) => onFinish(lesson, right, total)} />
  </div>;
}
