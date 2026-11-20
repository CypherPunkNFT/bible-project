// Data size budgets (data-budgets.json, the one place they live): fails when a page's first-load data file, or a
// page's first load as a whole, is over budget (owner, 2026-11-19: "enforce it in code so it can't come back").
// - Split data sets (scripts/split-data.ts) are built here in memory from their committed sources, so the result is
//   the same on every computer; none of their first-load parts may be over, no exceptions.
// - Each page lists its first-load data in data-budgets.json "pages" (seeded from the browser scan of every route,
//   scripts/load-scan); a page or file still over budget is on "overBudget" with its measured size as a cap, which may
//   only come down: a file that grows past its cap fails, a cap raised above the last commit's fails, and an entry no
//   longer over budget fails until it is taken off the list. A new fetch a page starts is caught by the load scan, not
//   here: this test checks the files the pages are known to read.
// Files under data/ are built on this computer (data/ is not in git); without data/ those entries are skipped.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buildFromSource } from "../../scripts/split-data.ts";
import { DATASETS } from "../../scripts/split-data/datasets.ts";
import type { Built } from "../../scripts/split-data/engine.ts";

interface OverBudget { item: string; gzipKB: number; rawKB: number; why: string; plan: string }
interface Budgets { perFileGzipKB: number; perFileRawKB: number; pageFirstLoadGzipKB: number; gzipLevel: number; pages: Record<string, string[]>; overBudget: OverBudget[] }
interface Size { gzip: number; raw: number }

const root = path.resolve(__dirname, "../..");
const budgets: Budgets = JSON.parse(readFileSync(path.join(root, "data-budgets.json"), "utf8"));
const kb = (bytes: number) => Math.round(bytes / 102.4) / 10;
/** A measured size may be this much over its cap (gzip output differs a little between zlib builds). */
const TOLERANCE = 1.02;
const hasData = existsSync(path.join(root, "data"));

const built = new Map<string, Built | null>();
/** A data set as split-data builds it; null for one whose source is under data/ on a computer without data/. */
const dataset = (name: string) => {
  if (!built.has(name)) {
    const found = DATASETS.find((d) => d.name === name);
    if (!found) throw new Error(`data-budgets.json names split:${name}, which scripts/split-data/datasets.ts does not have`);
    built.set(name, found.source.startsWith("data/") && !hasData ? null : buildFromSource(found));
  }
  return built.get(name)!;
};
const sizeOf = (bytes: Buffer): Size => ({ gzip: gzipSync(bytes, { level: budgets.gzipLevel }).length, raw: bytes.length });
const sizes = new Map<string, Size | null>();

/** The files one entry of a page's list stands for, each with its size; null for a data/ file on a computer without data/. */
function resolve(token: string): [string, Size | null][] {
  const [kind, rest] = [token.slice(0, token.indexOf(":")), token.slice(token.indexOf(":") + 1)];
  if (kind === "split") {
    const split = dataset(rest);
    if (!split) return [[`split:${rest}`, null]];
    const { manifest, files } = split;
    const first = [manifest.head, ...manifest.layers.list.files.slice(0, manifest.first).map((f) => f.file)];
    return [[`split:${rest}/manifest.json`, sizeOf(Buffer.from(JSON.stringify(manifest, null, 1)))], ...first.map((f): [string, Size] => [`split:${rest}/${f}`, sizeOf(files.get(f)!)])];
  }
  const folder = { data: "data", public: "public", src: "src" }[kind];
  if (!folder || rest.includes("..")) throw new Error(`data-budgets.json: "${token}" is not split:, data:, public: or src: followed by a path`);
  if (!sizes.has(token)) {
    const file = path.join(root, folder, rest);
    if (!existsSync(file)) {
      if (kind === "data" && !hasData) sizes.set(token, null);
      else throw new Error(`data-budgets.json names ${token}, which does not exist: take it off or correct the path`);
    } else sizes.set(token, sizeOf(readFileSync(file)));
  }
  return [[token, sizes.get(token)!]];
}

const over = new Map(budgets.overBudget.map((entry) => [entry.item, entry]));
function withinCap(item: string, size: Size, limit: Size): string | null {
  if (size.gzip <= limit.gzip && size.raw <= limit.raw) return null;
  const cap = over.get(item);
  if (!cap) return `${item}: ${kb(size.gzip)} KB compressed / ${kb(size.raw)} KB raw, over the budget of ${kb(limit.gzip)} / ${kb(limit.raw)} KB`;
  if (size.gzip > cap.gzipKB * 1024 * TOLERANCE || size.raw > cap.rawKB * 1024 * TOLERANCE)
    return `${item}: ${kb(size.gzip)} KB compressed / ${kb(size.raw)} KB raw, grown past its listed cap of ${cap.gzipKB} / ${cap.rawKB} KB`;
  return null;
}
const fileLimit: Size = { gzip: budgets.perFileGzipKB * 1024, raw: budgets.perFileRawKB * 1024 };
const pageLimit: Size = { gzip: budgets.pageFirstLoadGzipKB * 1024, raw: Infinity };

describe("data size budgets", () => {
  it.each(DATASETS.map((d) => d.name))("every part of split:%s a page reads up front is within the per-file budget", (name) => {
    const split = dataset(name);
    if (!split) return;
    const { manifest, files } = split;
    const upFront = [manifest.head, ...Object.values(manifest.layers).flatMap((layer) => layer.files.map((f) => f.file))];
    const problems = upFront.map((file) => [file, sizeOf(files.get(file)!)] as const)
      .filter(([, size]) => size.gzip > fileLimit.gzip || size.raw > fileLimit.raw)
      .map(([file, size]) => `${file}: ${kb(size.gzip)} / ${kb(size.raw)} KB`);
    expect(problems).toEqual([]);
  });

  it("every page's first-load data files are within the per-file budget, or within their listed cap", () => {
    const problems = Object.values(budgets.pages).flat().flatMap(resolve)
      .flatMap(([item, size]) => size ? [withinCap(`file:${item}`, size, fileLimit)] : []).filter(Boolean);
    expect([...new Set(problems)]).toEqual([]);
  });

  it("every page's first load as a whole is within the page budget, or within its listed cap", () => {
    const problems = Object.entries(budgets.pages).map(([page, tokens]) => {
      const files = new Map(tokens.flatMap(resolve));
      if ([...files.values()].some((size) => size === null)) return null;
      const gzip = [...files.values()].reduce((sum, size) => sum + size!.gzip, 0);
      return withinCap(`page:${page}`, { gzip, raw: 0 }, pageLimit);
    }).filter(Boolean);
    expect(problems).toEqual([]);
  });

  it("the over-budget list only shrinks: every entry is still over budget and no cap is above the last commit's", () => {
    const problems: string[] = [];
    let committed: Budgets | null = null;
    try { committed = JSON.parse(execFileSync("git", ["show", "HEAD:data-budgets.json"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); }
    catch { committed = null; } // not a git checkout, or the file is new in this commit
    const before = new Map((committed?.overBudget ?? []).map((entry) => [entry.item, entry]));
    for (const entry of budgets.overBudget) {
      if (!entry.why || !entry.plan) problems.push(`${entry.item}: say why it is over and the plan to bring it under`);
      const old = before.get(entry.item);
      if (old && (entry.gzipKB > old.gzipKB || entry.rawKB > old.rawKB)) problems.push(`${entry.item}: its cap was raised above the last commit's ${old.gzipKB} / ${old.rawKB} KB`);
      const [kind, ...rest] = entry.item.split(":");
      const token = rest.join(":");
      if (kind === "file") {
        const [[, size]] = resolve(token);
        if (size && size.gzip <= fileLimit.gzip && size.raw <= fileLimit.raw) problems.push(`${entry.item} is within budget now: take it off the over-budget list`);
      } else if (kind === "page") {
        const tokens = budgets.pages[token];
        if (!tokens) { problems.push(`${entry.item}: no such page in "pages"`); continue; }
        const files = tokens.flatMap(resolve);
        if (files.every(([, size]) => size) && files.reduce((sum, [, size]) => sum + size!.gzip, 0) <= pageLimit.gzip) problems.push(`${entry.item} is within budget now: take it off the over-budget list`);
      } else problems.push(`${entry.item}: an item is "file:<token>" or "page:<route>"`);
    }
    expect(problems).toEqual([]);
  });
});
