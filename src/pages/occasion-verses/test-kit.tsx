// Shared by the occasion verse picker's tests: the real catalogue, the Berean files served from disk in place of the
// network (some books can be made to fail, as offline), a list with layout so the row window draws every row, and the
// address the router shows.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import OccasionVersesPage from "./OccasionVersesPage";

export const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

/** Serves /data/plain/bsb/<BOOK>.json from the repository; books in `failBooks` fail, as offline. */
export function serveBerean(options: { failBooks?: string[] } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = /^\/data\/plain\/bsb\/([A-Z0-9]+)\.json/.exec(String(url));
    if (!match || options.failBooks?.includes(match[1])) return { ok: false, status: 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(`data/plain/bsb/${match[1]}.json`, "utf8")) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Gives the passage list a width and the window a tall screen, so useRowWindow draws every row of an occasion. */
export function giveListLayout() {
  const original = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains("ov-rows")) return { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 20000, width: 800, height: 20000, toJSON: () => ({}) } as DOMRect;
    return original.call(this);
  });
  vi.stubGlobal("innerHeight", 20000);
}

/** Every address the page has been at since the last renderAt. */
export const seen: string[] = [];
export const lastAddress = () => seen[seen.length - 1];

export function renderAt(path: string) {
  seen.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <AddressProbe onSeen={(address) => seen.push(address)} />
        <Routes><Route path="/occasion-verses" element={<OccasionVersesPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}
