import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DONE_FOR_MS, SHOW_AFTER_MS, downloadBusy, runDownload, type ReportProgress } from "./download";

/** A task the test finishes by hand. */
function controlled() {
  let finish: () => void = () => {}, fail: (error: Error) => void = () => {}, report: ReportProgress = () => {};
  const task = (r: ReportProgress) => { report = r; return new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; }); };
  return { task, finish: () => finish(), fail: (e: Error) => fail(e), report: (f: number | null) => report(f) };
}
const panel = () => document.querySelector(".dl-panel");
const announcer = () => document.querySelector("[data-download-announcer]")?.textContent ?? "";
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe("runDownload", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => { await advance(DONE_FOR_MS * 2); vi.useRealTimers(); });

  it("never shows the panel for a download that finishes well under a second", async () => {
    const t = controlled();
    let ran: Promise<boolean> | undefined;
    await act(async () => { ran = runDownload("Downloading a quick file", t.task); });
    await advance(SHOW_AFTER_MS - 100);
    await act(async () => { t.finish(); });
    expect(await ran).toBe(true);
    await advance(SHOW_AFTER_MS * 2);
    expect(panel()).toBeNull();
    expect(downloadBusy()).toBe(false);
  });

  it("shows the loader with a percentage for a slow download, then Done, then goes", async () => {
    const t = controlled();
    let ran: Promise<boolean> | undefined;
    await act(async () => { ran = runDownload("Downloading the complete catalogue", t.task); });
    await advance(SHOW_AFTER_MS + 10);
    expect(panel()).not.toBeNull();
    expect(panel()!.querySelector(".bl")).not.toBeNull();
    expect(announcer()).toBe("Downloading the complete catalogue…");
    const bar = () => panel()!.querySelector('[role="progressbar"]')!;
    expect(bar().getAttribute("aria-valuenow")).toBeNull();
    expect(bar().textContent).toBe("Downloading…");
    await act(async () => { t.report(0.426); });
    expect(bar().textContent).toBe("42%");
    expect(bar().getAttribute("aria-valuenow")).toBe("42");
    await act(async () => { t.report(1); }); // held under 100 until the file is handed over
    expect(bar().textContent).toBe("99%");
    await act(async () => { t.finish(); });
    expect(await ran).toBe(true);
    expect(bar().textContent).toBe("Done");
    expect(announcer()).toBe("Downloading the complete catalogue: done.");
    await advance(DONE_FOR_MS + 10);
    expect(panel()).toBeNull();
  });

  it("runs one download at a time", async () => {
    const t = controlled();
    let first: Promise<boolean> | undefined;
    await act(async () => { first = runDownload("First", t.task); });
    expect(downloadBusy()).toBe(true);
    const second = vi.fn(async () => {});
    expect(await runDownload("Second", second)).toBe(false);
    expect(second).not.toHaveBeenCalled();
    await act(async () => { t.finish(); });
    expect(await first).toBe(true);
  });

  it("closes the panel and passes the error on when a download fails", async () => {
    const t = controlled();
    let ran: Promise<boolean> | undefined;
    await act(async () => { ran = runDownload("Downloading something", t.task); });
    const caught = ran!.catch((e: Error) => e);
    await advance(SHOW_AFTER_MS + 10);
    expect(panel()).not.toBeNull();
    await act(async () => { t.fail(new Error("HTTP 500")); });
    expect(((await caught) as Error).message).toBe("HTTP 500");
    expect(panel()).toBeNull();
    expect(downloadBusy()).toBe(false);
  });
});
