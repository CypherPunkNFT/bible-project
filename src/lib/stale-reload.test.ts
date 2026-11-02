import { describe, expect, it } from "vitest";
import { mayReload, remember, RETRY_MS, STALE_CODE } from "./stale-reload";

describe("reload once after a release", () => {
  it("recognises a missing code file in Chrome, Firefox and Safari", () => {
    expect(STALE_CODE.test("Failed to fetch dynamically imported module: https://bibleguide.io/assets/LifePage-x.js")).toBe(true);
    expect(STALE_CODE.test("error loading dynamically imported module")).toBe(true);
    expect(STALE_CODE.test("Importing a module script failed.")).toBe(true);
    expect(STALE_CODE.test("Unable to preload CSS for /assets/LifePage-x.css")).toBe(true);
    expect(STALE_CODE.test("Cannot read properties of undefined (reading 'map')")).toBe(false);
  });

  it("reloads the first time, not again for the same page straight after", () => {
    expect(mayReload(null, "/resources/life", 1000)).toBe(true);
    const stored = remember("/resources/life", 1000);
    expect(mayReload(stored, "/resources/life", 1000 + 5000)).toBe(false);
  });

  it("reloads again for another page, or for the same page after a later release", () => {
    const stored = remember("/resources/life", 1000);
    expect(mayReload(stored, "/study", 2000)).toBe(true);
    expect(mayReload(stored, "/resources/life", 1000 + RETRY_MS + 1)).toBe(true);
  });

  it("does not trip on a path that contains the separator, or on a damaged value", () => {
    expect(mayReload(remember("/a|b", 1000), "/a|b", 2000)).toBe(false);
    expect(mayReload("garbage", "/resources/life", 2000)).toBe(true);
  });
});
