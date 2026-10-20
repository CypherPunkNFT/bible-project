import { chromium } from "@playwright/test";
const [out, url, ...sels] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge" });
for (const [theme, width] of [["light", 1440], ["dark", 1440], ["light", 400]]) {
  const ctx = await b.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
  await ctx.addInitScript((t) => localStorage.setItem("bp-theme", t), theme);
  const p = await ctx.newPage(); const errors = [];
  p.on("console", (m) => m.type() === "error" && errors.push(m.text())); p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto("http://127.0.0.1:8931" + url, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  for (const sel of sels) {
    const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    await el.screenshot({ path: `${out}/${sel.replace(/[^a-z0-9]+/gi, "_")}-${width}-${theme}.png` });
  }
  console.log(width, theme, "sideways", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), "errors", errors.join(" | ") || "none");
  await ctx.close();
}
await b.close();
