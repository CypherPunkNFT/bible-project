import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { chooseSiteLanguage } from "@/lib/page-translator";
import { usePageHead } from "./usePageHead";

// The tab title and description in the reader's language (translation system, stage 5 job 15): usePageHead names the
// page from page-head.ts's texts looked up in the language, and from the heading the page translator has swapped.
const PARAGRAPH = "Find a place. Follow a life. Step into the world of the Bible, then the communities that followed.";
const STRINGS: Record<string, string> = {
  "Bible Atlas: Maps of Every Bible Place": "Atlas bíblico: mapas de cada lugar de la Biblia",
  "Real places": "Lugares reales",
  [PARAGRAPH]: "Encuentra un lugar. Sigue una vida. Entra en el mundo de la Biblia y en las comunidades que lo siguieron.",
  Moses: "Moisés",
  People: "Personas",
  "To Moses": "A Moisés",
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
    </Routes>
  );
}

const description = () => document.head.querySelector('meta[name="description"]')?.getAttribute("content");
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

    // A click renders the next page at once; its heading is swapped just after the hook first reads it.
    fireEvent.click(view.getByText("A Moisés"));
    await reread();
    expect(document.title).toBe("Moisés · Personas · Bible Guide");

    await act(() => chooseSiteLanguage("en"));
    await reread();
    expect(document.title).toBe("Moses · People · Bible Guide");
    expect(description()).toBe(PARAGRAPH);
    view.unmount();
  });
});
