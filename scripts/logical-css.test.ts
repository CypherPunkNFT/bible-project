import postcss from "postcss";
import { describe, expect, it } from "vitest";
import logicalCss from "./logical-css.js";

const built = (css: string) => postcss([logicalCss()]).process(css, { from: undefined }).css;

describe("the logical style step", () => {
  it("splits short forms whose left and right differ", () => {
    expect(built("a{padding:0 12px 1px 40px}")).toBe("a{padding-block:0 1px;padding-inline:40px 12px}");
    expect(built("a{margin:0 calc(1px + 2px) 0 auto !important}")).toBe("a{margin-block:0 0 !important;margin-inline:auto calc(1px + 2px) !important}");
    expect(built("a{inset:0 auto 0 1rem}")).toBe("a{inset-block:0 0;inset-inline:1rem auto}");
  });
  it("leaves short forms that are the same on both sides", () => {
    for (const css of ["a{padding:0 8px}", "a{margin:1px 2px 3px 2px}", "a{inset:0}", "a{border-radius:9px}", "a{border-radius:9px/4px}", "a{padding:var(--x)}"]) expect(built(css)).toBe(css);
  });
  it("splits corners that differ", () => {
    expect(built("a{border-radius:1px 2px 3px 4px}")).toBe("a{border-start-start-radius:1px;border-start-end-radius:2px;border-end-end-radius:3px;border-end-start-radius:4px}");
    expect(built("a{border-radius:9px 9px 0 0}")).toBe("a{border-radius:9px 9px 0 0}");
  });
});
