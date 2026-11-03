// The fade on a language change. Only the words fade: boxes, dividers, banners, cards, drawings, maps, moving strips and
// numbers stay on screen as they are (owner, 2026-11-02: "Banners aren't changing at all ... it goes for everything").
// Going to or from Arabic the page mirrors, so a box or drawing that has no twin where the mirror puts it fades too:
// it moves. The fades run apart from the page's work, so they reach the screen however busy the page is.

const FADE_OUT_MS = 260;
const FADE_IN_MS = 420;
// Where the words that change live. The word wall and the scroll's lettering are not here: they never change.
const WORDS = ".site-navigation, footer, #main:not(:has(.home-hub)), .home-hub > :not(.home-opening), .home-hero-copy, .hm6-note-frame, .home-doorway-copy, .home-doorway-art text";
// Leaves the screen with the change, so it fades as a whole.
const WHOLE = ".language-menu-panel";
// Moves to the other side as a whole when the page mirrors.
const WHOLE_WHEN_MIRRORED = ".site-header-row, .correction";
const MIRRORED = `${WORDS}, .home-doorways`;
// Laid out left to right in every language (index.css), so mirroring leaves them where they are.
const KEPT_LEFT_TO_RIGHT = ".hm5-wall, .home-marquee, .hm3-marquee, .hy-page .hc-row, .teacher-reading-window";
// Hebrew and Greek are the same in every language.
const ORIGINAL_LANGUAGE = ":lang(he), :lang(hbo), :lang(grc), :lang(el)";
const LETTER = /\p{L}/u;

type Property = "color" | "opacity";
interface Fade { property: Property; animation: Animation }

let fading: Map<Element, Fade> | null = null;
let wholes: Element[] = [];
// Icons take the colour of the words beside them; held at their own colour, they stay while the words fade.
const pinned = new Map<Element, Animation>();

function near(element: Element): boolean {
  const box = element.getBoundingClientRect();
  return (box.width > 0 || box.height > 0) && box.bottom > -innerHeight / 2 && box.top < innerHeight * 1.5;
}

function pinIcons(element: Element): void {
  for (const icon of element.querySelectorAll("svg")) {
    if (pinned.has(icon)) continue;
    const color = getComputedStyle(icon).color;
    pinned.set(icon, icon.animate([{ color }, { color }], { duration: 1, fill: "forwards" }));
  }
}

function hide(element: Element, property: Property, duration: number): void {
  if (!fading || fading.has(element) || wholes.some((whole) => whole.contains(element))) return;
  if (property === "color") pinIcons(element);
  const keyframe = property === "color" ? { color: "transparent" } : { opacity: 0 };
  fading.set(element, { property, animation: element.animate(keyframe, { duration, easing: "ease-in-out", fill: "forwards" }) });
}

/** Each element holding words near the screen: its text fades, never its box. SVG lettering has no box, so it fades whole. */
function hideWords(root: Element, duration: number): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !LETTER.test(node.nodeValue ?? "") || parent.closest(`script, style, ${ORIGINAL_LANGUAGE}`)) continue;
    const lettering = parent.closest("svg") ? parent.closest("text") : null;
    const element = lettering ?? parent;
    if (near(element)) hide(element, lettering ? "opacity" : "color", duration);
  }
}

const shown = (color: string) => color !== "transparent" && !/(rgba|hsla)\(.*,\s*0\)$|\/\s*0\)$/.test(color);

function hasBox(style: CSSStyleDeclaration): boolean {
  if (shown(style.backgroundColor) || style.backgroundImage !== "none" || style.boxShadow !== "none") return true;
  return (["Top", "Right", "Bottom", "Left"] as const).some((side) =>
    parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== "none" && shown(style[`border${side}Color`]));
}

/** Boxes and drawings the mirror moves: a box stays when it, or one just like it, is where the mirror puts it; a drawing only when centred. */
function movedByMirror(): Element[] {
  const width = document.documentElement.clientWidth;
  const found: { element: Element; box: DOMRect; drawing: boolean; kind: string }[] = [];
  for (const root of document.querySelectorAll(MIRRORED)) {
    for (const element of [root, ...root.querySelectorAll("*")]) {
      if (element.closest(KEPT_LEFT_TO_RIGHT) || !near(element)) continue;
      const drawing = ["svg", "IMG", "CANVAS", "VIDEO"].includes(element.tagName) && !element.parentElement?.closest("svg");
      const style = getComputedStyle(element);
      if (!drawing && (element.closest("svg") || !hasBox(style))) continue;
      // Twins look the same: the left and right columns of cards differ in name only.
      const kind = [element.tagName, style.backgroundColor, style.backgroundImage, style.borderColor, style.borderWidth, style.borderRadius, style.boxShadow].join("|");
      found.push({ element, box: element.getBoundingClientRect(), drawing, kind });
    }
  }
  const at = (box: DOMRect, left: number, top: number) => Math.abs(box.left - left) < 1.5 && Math.abs(box.top - top) < 1.5;
  return found.filter(({ box, drawing, kind }) => {
    const left = width - box.right;
    if (at(box, left, box.top)) return false;
    return drawing || !found.some((other) => other.kind === kind && Math.abs(other.box.width - box.width) < 1.5 && Math.abs(other.box.height - box.height) < 1.5 && at(other.box, left, box.top));
  }).map(({ element }) => element);
}

/** Before the change: fades out what is about to change, and resolves when it has. */
export function fadeWordsOut(mirrors: boolean): Promise<unknown> {
  fading = new Map();
  wholes = [];
  const whole = [...document.querySelectorAll(mirrors ? `${WHOLE}, ${WHOLE_WHEN_MIRRORED}` : WHOLE)].filter(near);
  if (mirrors) whole.push(...movedByMirror());
  for (const element of whole) {
    hide(element, "opacity", FADE_OUT_MS);
    wholes.push(element);
  }
  for (const root of document.querySelectorAll(WORDS)) hideWords(root, FADE_OUT_MS);
  return Promise.all([...fading.values()].map((fade) => fade.animation.finished));
}

/** During the change: words the page draws anew start hidden, so they come in with the rest. */
export function holdNewWords(node: Node): void {
  if (!fading || node.nodeType === Node.COMMENT_NODE) return;
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (element?.closest(WORDS)) hideWords(element, 0);
}

/** After the change has been drawn: the words come back. */
export function fadeWordsIn(): Promise<unknown> {
  const done = fading ?? new Map<Element, Fade>();
  fading = null;
  wholes = [];
  const back = [...done].map(async ([element, fade]) => {
    const fadeIn = element.animate([fade.property === "color" ? { color: "transparent" } : { opacity: 0 }, {}], { duration: FADE_IN_MS, easing: "ease-in-out" });
    fade.animation.cancel();
    await fadeIn.finished;
  });
  return Promise.all(back).finally(() => {
    if (fading) return; // another change began meanwhile and holds the icons again
    pinned.forEach((pin) => pin.cancel());
    pinned.clear();
  });
}
