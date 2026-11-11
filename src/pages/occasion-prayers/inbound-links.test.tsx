// The links into the prayer pages that other features planned (design 5.5 and 7.3): four "when you're…" pages and that
// hub, and the sympathy hub's "Explore more". Each link must reach a real occasion page.
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { occasionBySlug } from "@/data/occasion-prayers";
import { removeFonts, renderAt as renderSympathy } from "@/pages/sympathy/test-kit";
import { renderAt as renderWhenYoure, serveBerean } from "@/pages/when-youre/test-kit";

beforeEach(() => {
  serveBerean();
  removeFonts();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const linkTo = (href: string) => screen.getAllByRole("link").filter((link) => link.getAttribute("href") === href);

describe("links into the prayer pages", () => {
  it.each([
    ["facing-surgery", "/prayers/before-surgery"],
    ["big-decision", "/prayers/big-decision"],
    ["out-of-work", "/prayers/looking-for-work"],
    ["struggling-marriage", "/prayers/struggling-marriage"],
  ])("the “when you're…” %s page links its prayer page", (topic, href) => {
    renderWhenYoure(`/when-youre/${topic}`);
    expect(linkTo(href)).toHaveLength(1);
    expect(occasionBySlug(href.slice("/prayers/".length))).toBeDefined();
  });

  it("the “when you're…” hub links the prayers hub for someone you love", () => {
    renderWhenYoure("/when-youre");
    expect(screen.getByRole("link", { name: "Prayers for life's occasions" })).toHaveAttribute("href", "/prayers");
  });

  it("the sympathy hub links the prayers before a funeral", () => {
    renderSympathy("/sympathy");
    expect(screen.getByRole("link", { name: "Prayers before a funeral" })).toHaveAttribute("href", "/prayers/before-a-funeral");
    expect(occasionBySlug("before-a-funeral")).toBeDefined();
  });
});
