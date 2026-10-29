// Downloads that take a while show the book loader with a percentage, then "Done" (owner, 2026-10-29). One download
// runs at a time across the site and one panel shows it; a download that finishes well under a second never shows
// it, so it does not flash. The panel lives in its own root on <body>, so it outlasts the page that started the
// download (the file still arrives after the reader moves on).
//
//   const ran = await runDownload("Downloading the complete catalogue", report => work(report));
//   // work calls report(fraction) as it goes (null while the size is unknown) and resolves once the file is saved.
import { createElement, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { DownloadPanel } from "./DownloadPanel";
import { SHOW_AFTER_MS, DONE_FOR_MS, downloadBusy, setActive as set, snapshot, subscribe } from "./download-store";

export { DONE_FOR_MS, SHOW_AFTER_MS, downloadBusy };
export type ReportProgress = (fraction: number | null) => void;

let nextId = 1;
let showTimer: ReturnType<typeof setTimeout> | undefined, doneTimer: ReturnType<typeof setTimeout> | undefined;
function clearTimers() { clearTimeout(showTimer); clearTimeout(doneTimer); showTimer = doneTimer = undefined; }

let liveRegion: HTMLElement | null = null;
let panelHost: HTMLElement | null = null;
/** One polite live region, made before anything is written to it so screen readers announce the writes. */
export function prepareDownloadAnnouncer() {
  if (typeof document === "undefined" || liveRegion?.isConnected) return;
  liveRegion = document.createElement("div");
  liveRegion.setAttribute("role", "status");
  liveRegion.className = "sr-only";
  liveRegion.dataset.downloadAnnouncer = "";
  Object.assign(liveRegion.style, { position: "absolute", width: "1px", height: "1px", margin: "-1px", padding: "0", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: "0" });
  document.body.appendChild(liveRegion);
}
const announce = (text: string) => { if (liveRegion) liveRegion.textContent = text; };
function mountPanel() {
  if (typeof document === "undefined" || panelHost?.isConnected) return;
  panelHost = document.createElement("div");
  panelHost.dataset.downloadPanel = "";
  document.body.appendChild(panelHost);
  createRoot(panelHost).render(createElement(DownloadPanel));
}

/** Run a download with the shared panel. Resolves false (and does nothing) while another download runs; rejects with
 *  the task's error, after closing the panel, if it fails. */
export async function runDownload(label: string, task: (report: ReportProgress) => Promise<unknown>): Promise<boolean> {
  if (downloadBusy()) return false;
  prepareDownloadAnnouncer();
  mountPanel();
  clearTimers();
  const id = nextId++;
  set({ id, label, percent: null, phase: "running", visible: false });
  showTimer = setTimeout(() => {
    if (snapshot()?.id !== id) return;
    set({ ...snapshot()!, visible: true });
    announce(`${label}…`);
  }, SHOW_AFTER_MS);
  const report: ReportProgress = fraction => {
    const current = snapshot();
    if (current?.id !== id || current.phase !== "running") return;
    // Held under 100 until the task resolves: checking and saving the file come after the last byte.
    const percent = fraction === null || !Number.isFinite(fraction) ? null : Math.min(99, Math.max(0, Math.floor(fraction * 100)));
    if (percent !== current.percent) set({ ...current, percent });
  };
  try {
    await task(report);
  } catch (error) {
    clearTimers();
    if (snapshot()?.id === id) set(null);
    throw error;
  }
  clearTimers();
  if (snapshot()?.id !== id) return true;
  if (!snapshot()!.visible) { set(null); return true; }
  set({ ...snapshot()!, percent: 100, phase: "done" });
  announce(`${label}: done.`);
  doneTimer = setTimeout(() => { if (snapshot()?.id === id) set(null); }, DONE_FOR_MS);
  return true;
}

/** Subscribe to the running download (for a control that should look busy meanwhile). */
export function useDownloadBusy() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)?.phase === "running";
}
