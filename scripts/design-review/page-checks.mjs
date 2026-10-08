// The in-page half of the design review's machine checks (checks.mjs runs these in every page). Each returns a list of
// problems in plain words; an empty list is a pass.

export const CHECKS = [
  { id: "loads", name: "Page opens" },
  { id: "jumps", name: "No jumps when pointing" },
  { id: "scroll", name: "No sideways scroll on a phone" },
  { id: "errors", name: "No errors" },
  { id: "focus", name: "No focus outline" },
  { id: "empty", name: "No empty sections" },
  { id: "links", name: "Every link works" },
];

/** Hover lines must keep their height whatever is pointed at (owner, 2026-10-08: "no jumps anywhere"). */
export async function jumps() {
  const TIPS = ".stable-tip, .lg-tip, .pp-lane-tip, .pp-outline-tip";
  const tips = [...document.querySelectorAll(TIPS)].filter((t) => t.getBoundingClientRect().height > 0);
  if (!tips.length) return [];
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const problems = new Set();
  const legacy = tips.filter((t) => !t.classList.contains("stable-tip")).length;
  if (legacy) problems.add(`${legacy} hover line(s) not built with the shared StableTip`);
  const scopes = [...new Set(tips.map((t) => t.parentElement?.closest("section, figure, .lg-glass") ?? t.parentElement))];
  for (const scope of scopes) {
    const mine = tips.filter((t) => scope.contains(t));
    const start = mine.map((t) => t.getBoundingClientRect().height);
    const targets = [...scope.querySelectorAll("a, button, [role=button], [tabindex], .pp-sync-hit")].filter((el) => !mine.some((t) => t.contains(el))).slice(0, 120);
    for (const el of targets) {
      el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, relatedTarget: document.body }));
      el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body }));
      el.focus({ preventScroll: true });
      await frame();
      mine.forEach((t, i) => {
        const now = t.getBoundingClientRect().height;
        if (Math.abs(now - start[i]) > 0.5) problems.add(`a hover line changed height ${start[i].toFixed(0)}→${now.toFixed(0)} px when pointing at "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}"`);
      });
      el.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }));
      el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
      el.blur();
    }
  }
  return [...problems].slice(0, 4);
}

/** The page must fit a phone's width; name the part that sticks out. */
export function scroll() {
  const root = document.documentElement;
  const width = root.clientWidth;
  if (root.scrollWidth <= width + 1) return [];
  const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true; } return false; };
  const wide = [...document.body.querySelectorAll("*")].filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > width + 1 && !clipped(el); })
    .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];
  const name = wide ? `${wide.tagName.toLowerCase()}${wide.className && typeof wide.className === "string" ? "." + wide.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}` : "unknown";
  return [`the page is ${root.scrollWidth} px wide on a ${width} px screen; widest part: ${name}${wide?.textContent ? ` ("${wide.textContent.trim().slice(0, 30)}")` : ""}`];
}

/** No outline or ring on a focused control (owner, 2026-10-06). Run after one real Tab press, so focus is "visible". */
export function focus() {
  const controls = [...document.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")]
    .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !el.closest("[aria-hidden='true'], [inert]"); }).slice(0, 150);
  const problems = new Set();
  for (const el of controls) {
    const before = getComputedStyle(el).boxShadow;
    el.focus({ preventScroll: true });
    if (document.activeElement !== el) continue;
    const style = getComputedStyle(el);
    const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40);
    if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) problems.add(`"${label}" shows a ${style.outlineWidth} outline when focused`);
    else if (style.boxShadow !== before && /\b0px 0px 0px [1-9]/.test(style.boxShadow)) problems.add(`"${label}" shows a ring when focused`);
    el.blur();
  }
  return [...problems].slice(0, 4);
}

/** A heading with nothing under it should not be shown. */
export function empty() {
  const visible = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  const hasContent = (nodes, heading) => nodes.some((n) => {
    if (n === heading || n.contains?.(heading)) return false;
    if (n.nodeType === 3) return n.textContent.trim().length > 0;
    if (n.nodeType !== 1 || !visible(n)) return false;
    return n.innerText.trim().length > 0 || n.matches("img, svg, canvas, video, iframe, input, select, table, hr") || n.querySelector("img, svg, canvas, video, iframe, input, select, table");
  });
  const problems = [];
  for (const heading of document.querySelectorAll("main h2, main h3")) {
    if (!visible(heading) || heading.closest("[aria-hidden='true'], .sr-only, .stable-tip-sizer")) continue;
    const level = Number(heading.tagName[1]);
    const section = heading.closest("section, article");
    const firstHeading = section?.querySelector("h1, h2, h3");
    let nodes;
    if (section && firstHeading === heading) nodes = [...section.childNodes].flatMap((n) => (n.contains?.(heading) && n !== heading ? [...n.childNodes] : [n]));
    else {
      nodes = [];
      for (let n = heading.nextSibling; n; n = n.nextSibling) {
        if (n.nodeType === 1 && /^H[1-6]$/.test(n.tagName) && Number(n.tagName[1]) <= level) break;
        nodes.push(n);
      }
      if (!nodes.length && heading.parentElement && heading.parentElement !== section) nodes = [...heading.parentElement.parentElement?.childNodes ?? []].filter((n) => n !== heading.parentElement);
    }
    if (!hasContent(nodes, heading)) problems.push(`the heading "${heading.textContent.trim().slice(0, 50)}" has nothing under it`);
  }
  return problems.slice(0, 4);
}

/** Every internal address on the page (checked against the site's routes and ids by checks.mjs). */
export function links() {
  const out = new Set();
  for (const a of document.querySelectorAll("a[href]")) {
    const url = new URL(a.getAttribute("href"), location.href);
    if (url.origin !== location.origin || /^\/(data|assets|atlas-tiles|search-model|api|mockups|review-data)\//.test(url.pathname)) continue;
    out.add(url.pathname + url.search);
  }
  return [...out];
}
