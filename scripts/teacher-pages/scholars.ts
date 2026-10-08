// Scholars data (src/data/teachers/scholars.json): content/teachers/scholars.json (the scholars, finds and the chain of
// the text) plus two things computed here: where the site's own content names each scholar, per site area, and their
// places projected into three map views. Ported from design/scholars-directions/shared/build-scholars.mjs.
import fs from "node:fs";
import path from "node:path";
import type { Era, Faith, Field, Find, Scholar, ScholarsData } from "../../src/data/teachers/pages-types.ts";
import { box, mercator, naturalEarth, projectView, sphere } from "./maps.ts";

interface ScholarEntry extends Omit<Scholar, "era" | "site" | "mentions"> { site: [Scholar["site"] extends infer S ? S extends { status: infer T } ? T : never : never, string] | null; match: string }
interface Input { faiths: Record<Faith, string>; fields: Record<Field, string>; scholars: ScholarEntry[]; finds: Find[]; chain: ScholarsData["chain"] }

// Site areas and the content that feeds them: only text a visitor can read is searched.
const AREAS: [string, string[]][] = [
  ["Letters study", ["src/data/letters"]],
  ["Apologetics", ["content/apologetics", "src/generated/apologetics.ts"]],
  ["Topics", ["data/topics"]],
  ["People pages", ["src/data/people-pages", "content/people"]],
  ["Rulers", ["src/data/who-ruled"]],
];
const ERAS: Record<Era, string> = {
  ancient: "The ancient world (to 500)", medieval: "The Middle Ages (500–1500)", "early-modern": "Reformation to Enlightenment (1500–1800)", modern: "The modern age (1800 on)",
};
// Era by the year of their first listed work (when they did what they are known for), so Erasmus (born 1466, Greek New
// Testament 1516) sits with the Reformation, not the Middle Ages.
const eraOf = (year: number): Era => (year < 500 ? "ancient" : year < 1500 ? "medieval" : year < 1800 ? "early-modern" : "modern");

function areaTexts(site: string): [string, string[]][] {
  const filesUnder = (target: string): string[] => {
    const full = path.join(site, target);
    if (!fs.existsSync(full)) throw new Error(`teacher pages: expected site content at ${target}, found nothing`);
    if (fs.statSync(full).isFile()) return [full];
    return (fs.readdirSync(full, { recursive: true }) as string[]).map((f) => path.join(full, f)).filter((f) => fs.statSync(f).isFile() && /\.(json|ts|md|txt)$/.test(f));
  };
  return AREAS.map(([area, targets]) => [area, targets.flatMap(filesUnder).map((f) => fs.readFileSync(f, "utf8"))]);
}

export function buildScholars(site: string): ScholarsData {
  const input = JSON.parse(fs.readFileSync(path.join(site, "content/teachers/scholars.json"), "utf8")) as Input;
  const ids = new Set(input.scholars.map((s) => s.id));
  for (const f of input.finds) for (const id of f.by) if (!ids.has(id)) throw new Error(`find ${f.id} in content/teachers/scholars.json names unknown scholar ${id}`);
  for (const [id] of input.chain.steps) if (!ids.has(id)) throw new Error(`a chain step in content/teachers/scholars.json names unknown scholar ${id}`);
  const texts = areaTexts(site);
  const mentions = (pattern: string) => {
    const re = new RegExp(`\\b(?:${pattern})`);
    return Object.fromEntries(texts.map(([area, list]) => [area, list.filter((t) => re.test(t)).length]).filter(([, n]) => n));
  };
  const points: Record<string, [number, number]> = {};
  for (const s of input.scholars) points[s.id] = [s.place[1], s.place[2]];
  for (const f of input.finds) points[`find:${f.id}`] = [f.where[1], f.where[2]];
  const views = {
    world: projectView(site, { size: [1000, 520], projection: naturalEarth(), fit: sphere, detail: "110m" }, points),
    med: projectView(site, { size: [1000, 620], projection: mercator(), fit: box(-11, 24, 50, 58), detail: "50m" }, points),
    holyland: projectView(site, { size: [600, 900], projection: mercator(), fit: box(32.6, 27.9, 37.2, 33.5), detail: "50m" }, points),
  };
  return {
    about: "Built by scripts/build-teacher-pages.ts from content/teachers/scholars.json and the site's own content (mentions).",
    faiths: input.faiths, fields: input.fields, eras: ERAS,
    scholars: input.scholars.map(({ match, site: use, ...s }) => ({ ...s, era: eraOf(s.works[0]?.[1] ?? s.born + 30), site: use ? { status: use[0], note: use[1] } : null, mentions: mentions(match) }))
      .sort((a, b) => a.born - b.born),
    finds: input.finds, chain: input.chain, views,
  };
}
