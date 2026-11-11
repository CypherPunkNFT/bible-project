// Shared by the slide maker's tests: the real catalogue, the Berean's chapter files served from disk in place of the
// network, a stand-in canvas (jsdom draws nothing: it measures every letter as half its size and makes a tiny "PNG"),
// and a router holding the page's route that records every address it is at.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import { AddressProbe } from "@/pages/life-events/AddressProbe";
import { catalog } from "@/pages/life-events/test-kit";
import WorshipSlidesPage from "./WorshipSlidesPage";

export { catalog };

export const PATH = "/worship-slides";

/** Serves /data/text/bsb/<BOOK>/<n>.json from the repository and records each file asked for; `fail` fails them all. */
export function serveChapters(options: { fail?: boolean } = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = /^\/data\/(text\/bsb\/[A-Z0-9]+\/\d+\.json)/.exec(String(url));
    if (options.fail || !match) return { ok: false, status: 404, headers: { get: () => "text/plain" }, json: async () => ({}) };
    return { ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => JSON.parse(readFileSync(`data/${match[1]}`, "utf8")) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** jsdom's Blob has no arrayBuffer(); every browser the site supports does. */
function blobBytes() {
  if (typeof Blob.prototype.arrayBuffer === "function") return;
  Object.defineProperty(Blob.prototype, "arrayBuffer", {
    configurable: true,
    value(this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    },
  });
}

/** A 2D context that records what is drawn and measures a letter as half the font's size. */
export function standInCanvas() {
  blobBytes();
  const drawn: string[] = [];
  const context = {
    font: "16px serif",
    fillStyle: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    measureText(text: string) { return { width: text.length * parseFloat(/(\d+(?:\.\d+)?)px/.exec(this.font)?.[1] ?? "16") * 0.5 }; },
    fillText: vi.fn((text: string) => drawn.push(text)),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((() => context) as unknown as typeof HTMLCanvasElement.prototype.getContext);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function toBlob(callback: BlobCallback) {
    callback(new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }));
  });
  return { context, drawn };
}

/** Catches downloads: every file handed to the browser, with its name. */
export function catchDownloads() {
  const files: { name: string; blob: Blob }[] = [];
  const pending = new Map<string, Blob>();
  let n = 0;
  // jsdom has no object addresses: these stand in, and are taken away again by forgetDownloads().
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: (blob: Blob) => { const url = `blob:test/${++n}`; pending.set(url, blob); return url; } });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click(this: HTMLAnchorElement) {
    files.push({ name: this.download, blob: pending.get(this.getAttribute("href") ?? "")! });
  });
  return files;
}

export function forgetDownloads() {
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
}

export const seen: string[] = [];

export function renderAt(path: string) {
  seen.length = 0;
  return render(
    <CatalogContext.Provider value={catalog}>
      <MemoryRouter initialEntries={[path]}>
        <AddressProbe onSeen={(address) => seen.push(address)} />
        <Routes><Route path={PATH} element={<WorshipSlidesPage />} /></Routes>
      </MemoryRouter>
    </CatalogContext.Provider>,
  );
}

export const lastAddress = () => seen[seen.length - 1];
