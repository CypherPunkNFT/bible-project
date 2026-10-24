// Tells Bing (and the other IndexNow engines: Yandex, Naver, Seznam) about every page in the live sitemap. Free, no
// account: the engines check ownership by reading the key file at the site's root (public/<key>.txt).
// Run after a release that added or changed pages:  bun scripts/seo/indexnow.ts [--dry-run]
import { readdirSync } from "node:fs";
import path from "node:path";
import { SITE_ORIGIN } from "../../src/lib/page-head.ts";

const BATCH = 10000;
const publicDir = path.resolve(import.meta.dirname, "../../public");
const keyFile = readdirSync(publicDir).find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) throw new Error("indexnow: no key file (32 hex characters .txt) in public/");
const key = keyFile.slice(0, -4);
const keyLocation = `${SITE_ORIGIN}/${keyFile}`;

async function text(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`indexnow: ${url} answered ${response.status}`);
  return response.text();
}

if ((await text(keyLocation)).trim() !== key) throw new Error(`indexnow: ${keyLocation} does not hold the key; release the site first`);
const index = await text(`${SITE_ORIGIN}/sitemap.xml`);
const urls: string[] = [];
for (const [, sitemap] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  for (const [, url] of (await text(sitemap)).matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(url.replaceAll("&amp;", "&"));
}
console.log(`${urls.length.toLocaleString("en-US")} pages in the live sitemap`);
if (process.argv.includes("--dry-run")) process.exit(0);
for (let i = 0; i < urls.length; i += BATCH) {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE_ORIGIN).host, key, keyLocation, urlList: urls.slice(i, i + BATCH) }),
  });
  // 200 = received, 202 = received and the key is still being checked.
  if (response.status !== 200 && response.status !== 202) throw new Error(`indexnow: batch from ${i} answered ${response.status}: ${await response.text()}`);
  console.log(`  sent ${Math.min(i + BATCH, urls.length)}/${urls.length}: ${response.status}`);
}
