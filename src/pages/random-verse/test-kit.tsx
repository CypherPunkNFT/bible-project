// Shared by the random verse tests: the real catalogue, the Berean's chapter files served from disk in place of the
// network, and a router holding the page's route that records every address it is at.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import RandomVersePage from "./RandomVersePage";
import { RANDOM_VERSE_PATH } from "./share";

export { catalog };

/** Serves /data/text/bsb/<BOOK>/<n>.json (a few chapters to a file) from the repository; `fail` fails every request. */
export function serveChapters(options: { fail?: boolean } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = /^\/data\/(text\/bsb\/[A-Z0-9]+\/\d+\.json)/.exec(String(url));
    if (options.fail || !match) return { ok: false, status: 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(`data/${match[1]}`, "utf8")) };
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
        <Routes><Route path={RANDOM_VERSE_PATH} element={<RandomVersePage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

export const lastAddress = () => seen[seen.length - 1];
