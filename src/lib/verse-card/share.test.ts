import { afterEach, describe, expect, it, vi } from "vitest";
import { cardPageUrl } from "./links";
import type { CardPicture } from "./render";
import { canCopyPicture, canShareFiles, copyPicture, copyText, copyWords, isAppleMobile, isInAppBrowser, savePicture, sharePicture, shareText } from "./share";
import type { CardSpec } from "./spec";

const picture: CardPicture = { blob: new Blob(["png"], { type: "image/png" }), fileName: "John-3-16-Bible-Guide.png", width: 1080, height: 1080 };
const spec: CardSpec = { passage: { text: "Words of the verse.", reference: "John 3:16" }, lines: ["Praying for you, Sam"], link: cardPageUrl("john-3-16", "night"), look: "night" };
const named = (name: string) => Object.assign(new Error(name), { name });

function stubNavigator(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
}

afterEach(() => {
  for (const key of ["share", "canShare", "clipboard", "userAgent", "maxTouchPoints"]) delete (navigator as unknown as Record<string, unknown>)[key];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("what goes with a card", () => {
  it("sends the reference and the card's address, and never the visitor's own line", () => {
    expect(shareText(spec)).toBe("John 3:16 (BSB)\nhttps://bibleguide.io/verse-cards/john-3-16?look=night");
    expect(copyText(spec)).toBe("Words of the verse. — John 3:16 (BSB)\nhttps://bibleguide.io/verse-cards/john-3-16?look=night");
    for (const value of [shareText(spec), copyText(spec), spec.link]) expect(value).not.toContain("Sam");
  });
});

describe("sharing the picture", () => {
  it("offers the share sheet only where it takes files", () => {
    expect(canShareFiles()).toBe(false);
    stubNavigator({ share: vi.fn(), canShare: vi.fn(() => false) });
    expect(canShareFiles()).toBe(false);
    stubNavigator({ canShare: vi.fn(({ files }: { files: File[] }) => files.length === 1) });
    expect(canShareFiles()).toBe(true);
  });

  it("hands the picture and the text to the share sheet", async () => {
    const share = vi.fn(async () => undefined);
    stubNavigator({ share });
    await expect(sharePicture(picture, shareText(spec))).resolves.toBe("shared");
    const data = share.mock.calls[0] as unknown as [{ files: File[]; text: string }];
    expect(data[0].files[0].name).toBe("John-3-16-Bible-Guide.png");
    expect(data[0].text).toBe(shareText(spec));
  });

  it("stays silent when the visitor cancels, and asks for a second tap when the browser says it was too late", async () => {
    stubNavigator({ share: vi.fn(async () => { throw named("AbortError"); }) });
    await expect(sharePicture(picture, "x")).resolves.toBe("cancelled");
    stubNavigator({ share: vi.fn(async () => { throw named("NotAllowedError"); }) });
    await expect(sharePicture(picture, "x")).resolves.toBe("retry");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubNavigator({ share: vi.fn(() => { throw new TypeError("no files"); }) });
    await expect(sharePicture(picture, "x")).resolves.toBe("manual");
  });
});

describe("copying and saving", () => {
  it("offers Copy picture on a computer with image copying, even where there is a share sheet", () => {
    stubNavigator({ share: vi.fn(), canShare: vi.fn(() => true), clipboard: { write: vi.fn(), writeText: vi.fn() } });
    vi.stubGlobal("ClipboardItem", class { constructor(public items: Record<string, unknown>) {} });
    const media = vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({ matches: query === "(pointer: fine)" } as MediaQueryList));
    expect(canCopyPicture()).toBe(true);
    media.mockImplementation(() => ({ matches: false } as MediaQueryList));
    expect(canCopyPicture()).toBe(false);
  });

  it("copies the picture with the clipboard item made at once, and words with a fallback", async () => {
    const write = vi.fn(async () => undefined);
    stubNavigator({ clipboard: { write, writeText: vi.fn(async () => { throw named("NotAllowedError"); }) } });
    const made: unknown[] = [];
    vi.stubGlobal("ClipboardItem", class { constructor(items: Record<string, unknown>) { made.push(items); } });
    const promise = Promise.resolve(picture.blob);
    await expect(copyPicture(promise)).resolves.toBe("copied");
    expect(made).toEqual([{ "image/png": promise }]);
    await expect(copyWords("x")).resolves.toBe("manual");
  });

  it("saves the picture, or shows it to press and hold in the apps' own browsers", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() }));
    expect(savePicture(picture)).toBe("saved");
    expect(click).toHaveBeenCalled();
    stubNavigator({ userAgent: "Mozilla/5.0 (iPhone) Instagram 300.0" });
    expect(savePicture(picture)).toBe("manual");
    expect(isInAppBrowser("FBAV/400")).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)", 5)).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (Macintosh)", 5)).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (Macintosh)", 0)).toBe(false);
  });
});
