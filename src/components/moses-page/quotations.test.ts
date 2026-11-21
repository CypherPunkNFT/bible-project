import { afterEach, describe, expect, it, vi } from "vitest";
import { quotations } from "./quotations";

type Span = [number, number];
interface Asked { q: { span: Span; marks: boolean; text?: string }[] }

/** What the page's fillVerses gives each passage: its words, in quotation marks where the quotation asks for them. */
const wordsOf = (span: Span, marks: boolean) => (marks ? `“words ${span[0]}-${span[1]}”` : `words ${span[0]}-${span[1]}`);

function setup({ failFirst = false } = {}) {
  const asked: Span[][] = [];
  let failures = failFirst ? 1 : 0;
  const fill = async <T,>(data: T): Promise<T> => {
    const copy = structuredClone(data) as unknown as Asked;
    asked.push(copy.q.map((q) => q.span));
    if (failures-- > 0) throw new Error("offline");
    for (const q of copy.q) q.text = wordsOf(q.span, q.marks);
    return copy as unknown as T;
  };
  const observed = new Set<Element>();
  let near: (entries: { isIntersecting: boolean; target: Element }[]) => void = () => {};
  class FakeIntersectionObserver {
    constructor(callback: typeof near) { near = callback; }
    observe(element: Element) { observed.add(element); }
    unobserve(element: Element) { observed.delete(element); }
    disconnect() { observed.clear(); }
  }
  const quotes = quotations(fill, { IntersectionObserver: FakeIntersectionObserver as unknown as typeof IntersectionObserver, MutationObserver });
  const show = (element: Element) => near([{ isIntersecting: true, target: element }]);
  return { quotes, asked, observed, show };
}

const settle = () => new Promise((done) => setTimeout(done, 0));
const quoted = (first: number, last = first, marks = false) => ({ quoted: true, span: [first, last] as Span, marks, text: "" });
const INVISIBLE = new RegExp(`^[${String.fromCharCode(0x2063, 0x200b, 0x200c)}]+$`);

/** A page of three sections, each quoting what `data` holds for it. */
function page(sections: { id: string; text: string }[]) {
  const main = document.createElement("main");
  main.insertAdjacentHTML("beforeend", sections.map((s) => `<section id="${s.id}"><p></p></section>`).join(""));
  sections.forEach((s, i) => { main.children[i].querySelector("p")!.textContent = s.text; });
  document.body.append(main);
  return main;
}

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Moses page quotations (quotations.ts)", () => {
  it("marks each quotation with invisible characters, one mark per passage and quotation-mark style", () => {
    const { quotes } = setup();
    const data = quotes.mark({ a: quoted(1001001), b: quoted(1001001), c: quoted(1001001, 1001001, true), kjv: ["1001002"] });
    expect(data.a.text).toMatch(INVISIBLE);
    expect(data.b.text).toBe(data.a.text);
    expect(data.c.text).not.toBe(data.a.text);
    expect((data.kjv as unknown as Record<string, string>)["1001002"]).toMatch(INVISIBLE);
  });

  it("fills a section and every section above it when it nears the screen, with the words fillVerses gives", async () => {
    const { quotes, asked, show } = setup();
    const d = quotes.mark({ one: quoted(1001001, 1001001, true), two: quoted(2001001), three: quoted(3001001) });
    const main = page([{ id: "s1", text: d.one.text }, { id: "s2", text: `120 ${d.two.text} ` }, { id: "s3", text: d.three.text }]);
    const { stop } = quotes.watch(main);
    show(main.children[1]);
    await settle();
    expect(asked).toEqual([[[1001001, 1001001], [2001001, 2001001]]]);
    expect(main.children[0].textContent).toBe("“words 1001001-1001001”");
    expect(main.children[1].textContent).toBe("120 words 2001001-2001001 ");
    expect(main.children[2].textContent).toBe(d.three.text);
    stop();
  });

  it("writes known words at once into what is drawn later, and reads click-only HTML with its section", async () => {
    const { quotes, asked, show } = setup();
    const d = quotes.mark({ one: quoted(1001001), drawer: quoted(4001001) });
    const main = page([{ id: "s1", text: d.one.text }]);
    const { stop } = quotes.watch(main, { later: { s1: () => `<p>${d.drawer.text}</p>` } });
    show(main.children[0]);
    await settle();
    expect(asked).toEqual([[[1001001, 1001001], [4001001, 4001001]]]);
    const sheet = document.createElement("div");
    sheet.insertAdjacentHTML("beforeend", `<blockquote><p>${d.drawer.text}</p></blockquote>`);
    main.append(sheet);
    await Promise.resolve();
    expect(sheet.textContent).toBe("words 4001001-4001001");
    expect(asked).toHaveLength(1);
    stop();
  });

  it("reads a section that quotes only when something in it is chosen, when it nears the screen", async () => {
    const { quotes, asked, observed, show } = setup();
    const d = quotes.mark({ view: quoted(6001001) });
    const main = page([{ id: "ask", text: "What readers still ask" }]);
    const { stop } = quotes.watch(main, { later: { ask: () => `<p>${d.view.text}</p>` } });
    expect(observed.size).toBe(1);
    show(main.children[0]);
    await settle();
    expect(asked).toEqual([[[6001001, 6001001]]]);
    stop();
  });

  it("reads the landing's words before drawing, so they are written as soon as it is watched", async () => {
    const { quotes, observed } = setup();
    const d = quotes.mark({ end: quoted(5034007) });
    await quotes.read(`<p>${d.end.text}</p>`);
    const main = page([{ id: "top", text: d.end.text }]);
    const { stop } = quotes.watch(main);
    expect(main.textContent).toBe("words 5034007-5034007");
    expect(observed.size).toBe(0);
    stop();
  });

  it("tries a failed read again, and says so", async () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { quotes, show } = setup({ failFirst: true });
    const d = quotes.mark({ one: quoted(1001001) });
    const main = page([{ id: "s1", text: d.one.text }]);
    const { stop } = quotes.watch(main);
    show(main.children[0]);
    await vi.advanceTimersByTimeAsync(0);
    expect(error).toHaveBeenCalledOnce();
    expect(main.textContent).toBe(d.one.text);
    await vi.advanceTimersByTimeAsync(2000);
    expect(main.textContent).toBe("words 1001001-1001001");
    stop();
  });

  it("writes nothing once stopped", async () => {
    const { quotes, show } = setup();
    const d = quotes.mark({ one: quoted(1001001) });
    const main = page([{ id: "s1", text: d.one.text }]);
    const { stop } = quotes.watch(main);
    show(main.children[0]);
    stop();
    await settle();
    expect(main.textContent).toBe(d.one.text);
  });
});
