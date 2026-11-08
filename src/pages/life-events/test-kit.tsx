// Shared by the life-event page and card maker tests: the real catalogue, the Berean files served from disk in place of
// the network, and stand-ins for what jsdom lacks (document.fonts, window.print).
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { AddressProbe } from "./AddressProbe";
import LifeEventsPage from "./LifeEventsPage";

export const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

/** Serves /data/plain/bsb/<BOOK>.json from the repository; `fail` makes every request fail, as offline. */
export function serveBerean(options: { fail?: boolean } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = /^\/data\/(plain\/bsb\/[A-Z0-9]+\.json)/.exec(String(url));
    if (options.fail || !match) return { ok: false, status: 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(`data/${match[1]}`, "utf8")) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** A controllable document.fonts: `release()` lets every requested face finish loading. */
export function standInFonts() {
  let release: () => void = () => {};
  const loaded = new Promise<void>((resolve) => { release = resolve; });
  const load = vi.fn(async () => { await loaded; return []; });
  Object.defineProperty(document, "fonts", { configurable: true, value: { load, ready: loaded } });
  return { load, release };
}

export function removeFonts() {
  Reflect.deleteProperty(document, "fonts");
}

/** Every address the page has been at since the last renderAt. */
export const seen: string[] = [];

export function renderAt(path: string) {
  seen.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <AddressProbe onSeen={(address) => seen.push(address)} />
        <Routes><Route path="/life-events/*" element={<LifeEventsPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}
