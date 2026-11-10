// Shared by the verse cards page tests: the real catalogue, the Berean's chapter files and the verse-of-the-day files
// served from disk in place of the network, and a router holding the page's route that records every address.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import VerseCardsPage from "./VerseCardsPage";

export { catalog };

/** Serves /data/text/bsb/<BOOK>/<n>.json and today's widget day file (always the 10 November 2026 one) from the
 *  repository; `fail` fails every request, as offline. */
export function serveFiles(options: { fail?: boolean } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const text = /^\/data\/(text\/bsb\/[A-Z0-9]+\/\d+\.json)/.exec(String(url));
    const day = /^\/widget\/v1\/days\/\d{4}-\d{2}-\d{2}\.json$/.test(String(url));
    const file = text ? `data/${text[1]}` : day ? "public/widget/v1/days/2026-11-10.json" : null;
    if (options.fail || !file) return { ok: false, status: 404, headers: { get: () => "text/html" }, json: async () => ({}) };
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(file, "utf8")) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Every address the page has been at since the last renderAt, the latest last. */
export const seen: string[] = [];

export function renderAt(path: string) {
  seen.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <AddressProbe onSeen={(address) => seen.push(address)} />
        <Routes><Route path="/verse-cards/*" element={<VerseCardsPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

export const lastAddress = () => seen[seen.length - 1];
