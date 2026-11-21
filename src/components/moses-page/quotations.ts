// Moses' page takes its quotations' words section by section (owner, 2026-11-20: it read about 30 chapter files and the
// whole of Exodus and Hebrews before it drew; data-budgets.json). The page is drawn once, as before, but with an
// invisible mark where each quotation's words go (emptyVerses with a placeholder). When a section nears the screen, the
// words of its marks, and of every section above it, are read in the reader's Bible with the page's own fillVerses (so
// they are the same words, notes and quotation marks) and written into the text in place: once a section has its words,
// the page is exactly what it was before. A mark drawn later (a drawer, a topic panel, a chosen person) takes its words at
// once when they are known. Words only ever go into text, never into HTML.
import { emptyVerses } from "../../lib/verses.ts";

type Span = [number, number];
type Fill = <T>(data: T) => Promise<T>;
interface Passage { span: Span; marks: boolean }
interface Quoted { quoted: true; span: Span; marks: boolean; text?: string }
interface Observers { IntersectionObserver: typeof IntersectionObserver; MutationObserver: typeof MutationObserver }
interface Section { element: Element; ids: number[]; state: "waiting" | "reading" | "done"; later: boolean; reading?: Promise<void> }
export interface WatchOptions {
  /** HTML a section shows only when chosen (its drawers, panels), by the section's id; read with the section's words. */
  later?: Record<string, () => string>;
  /** Called after words were written, for what measured the text (the event lists' scrollers). */
  onSwap?: () => void;
}

const EDGE = "\u2063"; // invisible separator; between two of them, the passage's number in zero-width space (0) and non-joiner (1)
const MARK = /\u2063([\u200b\u200c]+)\u2063/g;
/** How far below (and above) the screen a section starts reading its words: the Egypt chapter, the first section after
 * the landing that quotes, starts about 1,590 px down at 1440x1000, so the first load reads the landing's words only. */
const NEAR = "400px 0px";
/** Waits before reading a section's words again after a failed read; then again when the browser comes back online. */
const RETRY_MS = [2000, 8000, 30000];

const markOf = (id: number) => EDGE + id.toString(2).replace(/0/g, "\u200b").replace(/1/g, "\u200c") + EDGE;
const idOf = (bits: string) => parseInt(bits.replace(/\u200b/g, "0").replace(/\u200c/g, "1"), 2);

/** The marks of one mount of the page (a page per Bible: changing Bible mounts it again). */
export function quotations(fill: Fill, observers: Observers) {
  const passages: Passage[] = [];
  const byKey = new Map<string, number>();
  const words = new Map<number, string>();
  const pending = new Map<number, Promise<void>>();

  /** The marks in a text, as passage numbers; anything else that looks like one is left alone. */
  const marksIn = (text: string): number[] => {
    if (!text.includes(EDGE)) return [];
    return [...text.matchAll(MARK)].map((match) => idOf(match[1])).filter((id) => id < passages.length);
  };

  /** A copy of the data with a mark where each quotation's words go (one mark per passage and quotation-mark style). */
  function mark<T>(data: T): T {
    return emptyVerses(data, (span, marks) => {
      const key = `${span[0]}-${span[1]}-${marks}`;
      let id = byKey.get(key);
      if (id === undefined) {
        id = passages.length;
        passages.push({ span, marks });
        byKey.set(key, id);
      }
      return markOf(id);
    });
  }

  /** Reads the words of these passages, those not read nor being read in one batch; resolves when all are in. */
  function read(ids: Iterable<number>): Promise<void> {
    const missing = [...new Set(ids)].filter((id) => !words.has(id));
    const wanted = missing.filter((id) => !pending.has(id));
    if (wanted.length) {
      const asked: Quoted[] = wanted.map((id) => ({ quoted: true, span: passages[id].span, marks: passages[id].marks }));
      const batch = fill({ q: asked })
        .then(({ q }) => wanted.forEach((id, i) => words.set(id, q[i].text ?? "")))
        .finally(() => wanted.forEach((id) => pending.delete(id)));
      wanted.forEach((id) => pending.set(id, batch));
    }
    return Promise.all(missing.map((id) => pending.get(id))).then(() => undefined);
  }

  /** Writes the words of every known mark under `node` into its text; true when something changed. */
  function swap(node: Node): boolean {
    let changed = false;
    const write = (text: Text) => {
      if (!text.data.includes(EDGE)) return;
      const next = text.data.replace(MARK, (whole, bits: string) => words.get(idOf(bits)) ?? whole);
      if (next !== text.data) { text.data = next; changed = true; }
    };
    if (node.nodeType === Node.TEXT_NODE) write(node as Text);
    else {
      const walker = (node.ownerDocument ?? document).createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) write(text as Text);
    }
    return changed;
  }

  /**
   * Call right after the page's HTML is written, before anything moves parts of it: each child of `main` that holds marks
   * (or has `later` HTML) is a section, given its words when it (or a section below it) nears the screen. Known words are
   * written at once. Returns `jump`, for the page's jumps down to a part of it, and `stop`, which stops it all.
   */
  function watch(main: Element, { later = {}, onSwap = () => {} }: WatchOptions = {}): { jump: (target: Element, scroll: () => void) => void; stop: () => void } {
    let stopped = false, retries = 0, timer = 0, furthest = -1;
    const online = new AbortController();
    // A section is a child of main that quotes, or shows quotations when something in it is chosen (the asked questions).
    const sections: Section[] = [...main.children].map((element): Section => ({ element, ids: marksIn(element.textContent ?? ""), state: "waiting", later: false }))
      .filter((section) => section.ids.length > 0 || section.element.id in later);
    const owner = new Map<number, Section>();
    const own = (section: Section, ids: number[]) => ids.forEach((id) => { if (!owner.has(id)) owner.set(id, section); });
    sections.forEach((section) => own(section, section.ids));
    const swapped = () => { if (!stopped && swap(main)) onSwap(); };

    /** Reads the words of every section down to `last`; resolves when those being read are in (or failed). */
    const through = (last: number): Promise<void> => {
      furthest = Math.max(furthest, last);
      const upTo = sections.slice(0, last + 1);
      const due = upTo.filter((section) => section.state === "waiting");
      if (!stopped && due.length) start(due, last);
      return Promise.all(upTo.map((section) => section.reading)).then(() => undefined);
    };
    const start = (due: Section[], last: number) => {
      for (const section of due) {
        section.state = "reading";
        const extra = later[section.element.id];
        if (extra && !section.later) {
          section.later = true;
          const ids = marksIn(extra());
          section.ids.push(...ids);
          own(section, ids);
        }
      }
      const reading = read(due.flatMap((section) => section.ids)).then(() => {
        if (stopped) return;
        due.forEach((section) => { section.state = "done"; io.unobserve(section.element); });
        retries = 0;
        swapped();
      }, (error: unknown) => {
        if (stopped) return;
        due.forEach((section) => { section.state = "waiting"; });
        const count = due.reduce((sum, section) => sum + section.ids.length, 0);
        console.error(`Moses page: could not read the words of ${count} quotations (sections ${due.map((s) => s.element.id).join(", ")}); ${retries < RETRY_MS.length ? `trying again in ${RETRY_MS[retries] / 1000} s` : "trying again when the browser is back online"}`, error);
        if (retries < RETRY_MS.length) timer = window.setTimeout(() => void through(last), RETRY_MS[retries++]);
      });
      due.forEach((section) => { section.reading = reading; });
    };

    /** Scrolls to `target` (with `scroll`) at once while the sections down to it read their words, and once more when they
     * are in, unless the reader moved the page meanwhile: the words above it push it down, and a smooth scroll keeps the
     * place it set out for, so without this a jump down the page would stop short. */
    const jump = (target: Element, scroll: () => void) => {
      let last = -1;
      sections.forEach((section, i) => {
        if (section.element.contains(target) || section.element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) last = i;
      });
      const waiting = sections.slice(0, last + 1).some((section) => section.state !== "done");
      scroll();
      if (!waiting) return;
      const moved = new AbortController();
      for (const name of ["wheel", "touchstart", "keydown"]) window.addEventListener(name, () => moved.abort(), { once: true, passive: true, signal: moved.signal });
      void through(last).then(() => { if (!stopped && !moved.signal.aborted) scroll(); moved.abort(); });
    };

    const io = new observers.IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) void through(sections.findIndex((section) => section.element === entry.target));
    }, { rootMargin: NEAR });
    const mo = new observers.MutationObserver((records) => {
      const unread: number[] = [];
      let changed = false;
      for (const record of records) record.addedNodes.forEach((node) => {
        const ids = marksIn(node.nodeType === Node.TEXT_NODE ? (node as Text).data : node.nodeType === Node.ELEMENT_NODE ? node.textContent ?? "" : "");
        if (!ids.length) return;
        if (swap(node)) changed = true;
        // A mark whose section has not read its words yet gets them with that section (the page swaps everywhere then).
        unread.push(...ids.filter((id) => !words.has(id) && (owner.get(id)?.state ?? "done") === "done"));
      });
      if (changed) onSwap();
      if (unread.length) read(unread).then(swapped, (error: unknown) => console.error(`Moses page: could not read the words of ${unread.length} quotations just shown`, error));
    });

    swapped(); // the landing's words, read before the page was drawn
    for (const section of sections) {
      if (!(section.element.id in later) && section.ids.every((id) => words.has(id))) section.state = "done";
      else io.observe(section.element);
    }
    mo.observe(main, { childList: true, subtree: true });
    window.addEventListener("online", () => { retries = 0; if (furthest >= 0) void through(furthest); }, { signal: online.signal });
    return { jump, stop: () => { stopped = true; io.disconnect(); mo.disconnect(); window.clearTimeout(timer); online.abort(); } };
  }

  return { mark, watch, /** Reads the words of every mark in this HTML. */ read: (html: string) => read(marksIn(html)) };
}
