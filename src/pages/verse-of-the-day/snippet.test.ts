// The code churches paste, the script's own source, its colours and its headers (docs/features/verse-widget/design.md
// 10: "Snippet text", "Static checks on the script's source", "Contrast", "Headers", "The v1 promise").
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AA, CARD_COLOURS, contrastRatio, hardToReadOn } from "./contrast";
import { cleanAccent, DEFAULT_OPTIONS, frameAddress, frameHeight, iframeSnippet, LINK_SNIPPET_HTML, LINK_SNIPPET_TEXT, OPTION_VALUES, scriptSnippet, type WidgetOptions } from "./snippet";
import { WIDGET_SOURCE } from "./widget-kit";

const withOption = (change: Partial<WidgetOptions>): WidgetOptions => ({ ...DEFAULT_OPTIONS, ...change });

describe("verse widget: the snippets", () => {
  it("writes the default script snippet with no data- attributes, and the fallback links", () => {
    const snippet = scriptSnippet(DEFAULT_OPTIONS);
    expect(snippet).toBe(
      '<div class="bibleguide-verse">\n'
      + '  <a href="https://bibleguide.io/verse-of-the-day">Today\'s Bible verse</a>\n'
      + '  from <a href="https://bibleguide.io/">Bible Guide</a>\n'
      + "</div>\n"
      + '<script src="https://bibleguide.io/widget/v1/verse.js" async referrerpolicy="no-referrer"></script>',
    );
  });

  it("adds exactly the attribute of each changed option", () => {
    const cases: [Partial<WidgetOptions>, string][] = [
      [{ style: "card" }, ' data-style="card"'],
      [{ style: "card", theme: "dark" }, ' data-style="card" data-theme="dark"'],
      [{ accent: "#6B38A3" }, ' data-accent="#6b38a3"'],
      [{ font: "serif" }, ' data-font="serif"'],
      [{ size: "compact" }, ' data-size="compact"'],
      [{ heading: "none" }, ' data-heading="none"'],
      [{ align: "center" }, ' data-align="center"'],
      // Plain ignores the card's colours in the script embed, so it is never written.
      [{ theme: "dark" }, ""],
    ];
    for (const [change, attributes] of cases) expect(scriptSnippet(withOption(change)).split("\n")[0], JSON.stringify(change)).toBe(`<div class="bibleguide-verse"${attributes}>`);
  });

  it("keeps anything typed that is not a colour out of every snippet", () => {
    for (const typed of ["red", "#12", "#1234567", "#zzz", '"><script>', "#fff;background:url(x)", "javascript:alert(1)"]) {
      expect(cleanAccent(typed), typed).toBeNull();
      const options = withOption({ accent: typed });
      expect(scriptSnippet(options)).not.toContain("accent");
      expect(iframeSnippet(options)).not.toContain("accent");
    }
    expect(cleanAccent(" #ABC ")).toBe("#abc");
  });

  it("writes the frame snippet with its title, sandbox, referrer policy, lazy loading and recommended height", () => {
    const snippet = iframeSnippet(withOption({ style: "card" }));
    expect(snippet).toContain('src="https://bibleguide.io/widget/v1/frame?style=card"');
    expect(snippet).toContain('title="Bible verse of the day from Bible Guide"');
    expect(snippet).toContain('sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"');
    expect(snippet).not.toContain("allow-same-origin");
    expect(snippet).toContain('referrerpolicy="no-referrer"');
    expect(snippet).toContain('loading="lazy"');
    expect(snippet).toContain(`height="${frameHeight(withOption({ style: "card" }))}"`);
  });

  it("always tells a Plain frame its text colour, and never asks the frame for the website's font", () => {
    expect(frameAddress(DEFAULT_OPTIONS)).toBe("https://bibleguide.io/widget/v1/frame?theme=light");
    expect(frameAddress(withOption({ frameText: "dark", font: "site" }))).toBe("https://bibleguide.io/widget/v1/frame?theme=dark");
    expect(frameAddress(withOption({ style: "card", font: "sans", size: "compact" }))).toBe("https://bibleguide.io/widget/v1/frame?style=card&font=sans&size=compact");
    expect(iframeSnippet(withOption({ style: "card", font: "sans" }))).toContain("frame?style=card&amp;font=sans");
  });

  it("offers a plain link for websites that allow neither", () => {
    expect(LINK_SNIPPET_HTML).toBe('<a href="https://bibleguide.io/verse-of-the-day">Today\'s Bible verse</a> from <a href="https://bibleguide.io/">Bible Guide</a>');
    expect(LINK_SNIPPET_TEXT).toBe("Today's Bible verse: https://bibleguide.io/verse-of-the-day");
  });
});

describe("verse widget: the script's source", () => {
  it("uses nothing that could run text as code, touch storage or load from elsewhere", () => {
    for (const banned of ["eval(", "Function(", "document.write", "innerHTML", "insertAdjacentHTML", "document.cookie", "localStorage", "sessionStorage", "import", "http://", "outerHTML"]) {
      expect(WIDGET_SOURCE.includes(banned), banned).toBe(false);
    }
    const origins = [...WIDGET_SOURCE.matchAll(/https:\/\/[^\s"'/)]+/g)].map((match) => match[0]);
    expect(new Set(origins)).toEqual(new Set(["https://bibleguide.io"]));
  });

  it("stays under 16 KB with its comments", () => {
    expect(Buffer.byteLength(WIDGET_SOURCE, "utf8")).toBeLessThan(16 * 1024);
  });

  it("still knows every option name and value of version 1 (the v1 promise)", () => {
    const optionsBlock = /var OPTIONS = \{([\s\S]*?)\};/.exec(WIDGET_SOURCE)![1];
    for (const [name, values] of Object.entries(OPTION_VALUES)) {
      expect(optionsBlock, name).toContain(`${name}: [${values.map((value) => `"${value}"`).join(", ")}]`);
    }
    expect(WIDGET_SOURCE).toContain('read("accent")');
    expect(WIDGET_SOURCE).toContain("/widget/v1/days/");
    expect(WIDGET_SOURCE).toContain("/widget/v1/pool.json");
  });

  it("draws the card in the colours the contrast check uses", () => {
    for (const surface of Object.values(CARD_COLOURS)) for (const colour of Object.values(surface)) expect(WIDGET_SOURCE, colour).toContain(colour);
  });
});

describe("verse widget: contrast", () => {
  it("reaches 4.5:1 for the text, the quieter lines and the default links on both cards", () => {
    for (const [name, surface] of Object.entries(CARD_COLOURS)) {
      expect(contrastRatio(surface.text, surface.background), `${name} text`).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(surface.muted, surface.background), `${name} muted`).toBeGreaterThanOrEqual(AA);
    }
  });

  it("warns about a pale link colour on a light card and a dark one on a dark card", () => {
    expect(hardToReadOn("#f5dd9c", "light")).toEqual(["light"]);
    expect(hardToReadOn("#22599f", "dark")).toEqual(["dark"]);
    expect(hardToReadOn("#22599f", "light")).toEqual([]);
    expect(hardToReadOn("#22599f", "auto")).toEqual(["dark"]);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});

describe("verse widget: the headers", () => {
  const headers = readFileSync("public/_headers", "utf8");
  const rule = (path: string) => {
    const lines = headers.split(/\r?\n/);
    const start = lines.indexOf(path);
    expect(start, `${path} in public/_headers`).toBeGreaterThanOrEqual(0);
    const body: string[] = [];
    for (const line of lines.slice(start + 1)) {
      if (!/^\s/.test(line)) break;
      body.push(line.trim());
    }
    return body;
  };

  it("opens the widget's files to every website, sends no referrer and refuses to run them as anything but their type", () => {
    const widget = rule("/widget/v1/*");
    expect(widget).toContain("Access-Control-Allow-Origin: *");
    expect(widget).toContain("Referrer-Policy: no-referrer");
    expect(widget).toContain("X-Content-Type-Options: nosniff");
    expect(widget.some((line) => line.startsWith("Cache-Control: public, max-age=86400"))).toBe(true);
  });

  it("gives the frame a strict Content Security Policy and lets it be framed", () => {
    const frame = rule("/widget/v1/frame");
    const policy = frame.find((line) => line.startsWith("Content-Security-Policy:"))!;
    expect(policy).toContain("default-src 'none'");
    expect(policy).toMatch(/script-src 'self' https:\/\/bibleguide\.io;/);
    expect(policy).toMatch(/connect-src 'self' https:\/\/bibleguide\.io;/);
    expect(frame).toContain("! Cache-Control");
    expect(frame).toContain("X-Robots-Tag: noindex");
    expect(frame.some((line) => line.startsWith("X-Frame-Options"))).toBe(false);
  });

  it("keeps the widget's addresses off the Worker, so they stay free static files", () => {
    const routes = JSON.parse(readFileSync("public/_routes.json", "utf8")) as { include: string[] };
    expect(routes.include.some((path) => path.startsWith("/widget"))).toBe(false);
  });
});
