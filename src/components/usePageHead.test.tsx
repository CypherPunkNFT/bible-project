import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { chooseSiteLanguage } from "@/lib/page-translator";
import { usePageHead } from "./usePageHead";

// The tab title and description in the reader's language (translation system, stage 5 job 15): usePageHead names the
// page from page-head.ts's texts looked up in the language, and from the heading the page translator has swapped.
const PARAGRAPH = "Find a place. Follow a life. Step into the world of the Bible, then the communities that followed.";
// Under 60 characters in English, over 60 in Spanish: the description must not take it in one language only.
const KICKER = "Cross-references · Book to book · Passages in conversation";
const STRINGS: Record<string, string> = {
  "Bible Atlas: Maps of Every Bible Place": "Atlas bíblico: mapas de cada lugar de la Biblia",
  "Real places": "Lugares reales",
  [PARAGRAPH]: "Encuentra un lugar. Sigue una vida. Entra en el mundo de la Biblia y en las comunidades que lo siguieron.",
  Moses: "Moisés",
  People: "Personas",
  "To Moses": "A Moisés",
  [KICKER]: "Referencias cruzadas · De libro en libro · Pasajes en conversación",
};

function Page({ heading }: { heading: string }) {
  return (
    <main id="main">
      <h1>{heading}</h1>
      <p>{PARAGRAPH}</p>
      <Link to="/people/moses-exo-2-10">To Moses</Link>
    </main>
  );
}

function Site() {
  usePageHead();
  return (
    <Routes>
      <Route path="/study/atlas" element={<Page heading="Real places" />} />
      <Route path="/people/:id" element={<Page heading="Moses" />} />
      <Route path="/study/connections" element={<main id="main"><h1>Moses</h1><p>{KICKER}</p><p>{PARAGRAPH}</p></main>} />
    </Routes>
  );
}

const description = () => document.head.querySelector('meta[name="description"]')?.getAttribute("content");
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");
const versions = () => [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map((link) => `${link.hreflang} ${link.getAttribute("href")}`);
// usePageHead reads the head again 250 ms after the page changes (the translator's swaps included).
const reread = () => act(() => new Promise((done) => setTimeout(done, 400)));

beforeAll(() => {
  // jsdom has no innerText; the page's text is all the hook reads from it.
  Object.defineProperty(HTMLElement.prototype, "innerText", { configurable: true, get() { return this.textContent; } });
});
afterEach(() => vi.unstubAllGlobals());

describe("usePageHead in a translated language", () => {
  it("names the page in the language, after a click to another page, and in English again", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => STRINGS })));
    await chooseSiteLanguage("es");
    const view = render(<MemoryRouter initialEntries={["/study/atlas"]}><Site /></MemoryRouter>);
    await reread();
    expect(document.title).toBe("Atlas bíblico: mapas de cada lugar de la Biblia · Bible Guide");
    expect(description()).toBe(STRINGS[PARAGRAPH]);
    // A main page names its Spanish address and every language's version (job 18; jsdom's host is the local preview).
    expect(canonical()).toBe("https://bibleguide.io/es/study/atlas");
    expect(versions()).toEqual([
      "en https://bibleguide.io/study/atlas", "es https://bibleguide.io/es/study/atlas", "pt https://bibleguide.io/pt/study/atlas",
      "zh-Hans https://bibleguide.io/zh/study/atlas", "ar https://bibleguide.io/ar/study/atlas", "hi https://bibleguide.io/hi/study/atlas",
      "id https://bibleguide.io/id/study/atlas", "x-default https://bibleguide.io/study/atlas",
    ]);

    // A click renders the next page at once; its heading is swapped just after the hook first reads it.
    fireEvent.click(view.getByText("A Moisés"));
    await reread();
    expect(document.title).toBe("Moisés · Personas · Bible Guide");
    // A page with no language addresses: its one English address, and the main page's versions gone.
    expect(canonical()).toBe("https://bibleguide.io/people/moses-exo-2-10");
    expect(versions()).toEqual([]);

    await act(() => chooseSiteLanguage("en"));
    await reread();
    expect(document.title).toBe("Moses · People · Bible Guide");
    expect(description()).toBe(PARAGRAPH);
    view.unmount();
  });

  it("takes the description from the same paragraph in every language (stage 5 review)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => STRINGS })));
    await chooseSiteLanguage("es");
    const view = render(<MemoryRouter initialEntries={["/study/connections"]}><Site /></MemoryRouter>);
    await reread();
    expect(description()).toBe(STRINGS[PARAGRAPH]);
    await act(() => chooseSiteLanguage("en"));
    await reread();
    expect(description()).toBe(PARAGRAPH);
    view.unmount();
  });
});
