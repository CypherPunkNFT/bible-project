// node --experimental-strip-types --test scripts/build-teachers.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { appRoutes, buildTeachers, checkTeachers, citedPeople, datesFromLocator, nameKey, serialise, type TeachersData } from "./build-teachers.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = buildTeachers(root);
const person = (name: string) => data.teachers.find((t) => t.name === name);

test("citation authors become people: translators, hosts and series are dropped", () => {
  assert.deepEqual(citedPeople("C. F. Keil and F. Delitzsch, tr. James Martin"), ["C. F. Keil", "F. Delitzsch"]);
  assert.deepEqual(citedPeople("R. Jamieson, A. R. Fausset and D. Brown"), ["R. Jamieson", "A. R. Fausset", "D. Brown"]);
  assert.deepEqual(citedPeople("E. H. Plumptre, in C. J. Ellicott (ed.), A New Testament Commentary for English Readers"), ["E. H. Plumptre"]);
  assert.deepEqual(citedPeople("Origen (trans. John Patrick, Ante-Nicene Fathers, vol. 9, ed. Allan Menzies)"), ["Origen"]);
  assert.deepEqual(citedPeople("L. C. L. Brenton (tr.)"), ["L. C. L. Brenton"]);
  assert.deepEqual(citedPeople("tr. J. H. MacMahon"), []);
  assert.deepEqual(citedPeople("H. Torczyner and others"), ["H. Torczyner"]);
});

test("name variants join on surname and first initial", () => {
  assert.equal(nameKey("R. Dick Wilson"), nameKey("R. D. Wilson"));
  assert.equal(nameKey("Morris Jastrow Jr."), nameKey("M. Jastrow Jr."));
  assert.notEqual(nameKey("H. E. Ryle"), nameKey("J. C. Ryle"));
  assert.equal(nameKey("E. König"), "konig|e");
});

test("life dates come only from the registry's evidence locators", () => {
  assert.equal(datesFromLocator("Calvin, Jean (d. 1564)"), "d. 1564");
  assert.equal(datesFromLocator("Perkins, William (1558–1602)"), "1558–1602");
  assert.equal(datesFromLocator("Watson, Thomas (c.1620–1686)"), "c. 1620–1686");
  assert.equal(datesFromLocator("Sermon 41; confession and election discussion"), undefined);
});

test("the owner's examples land where he expects", () => {
  assert.ok(person("Charles Haddon Spurgeon")?.sections.includes("preacher"));
  assert.ok(person("John Bunyan")?.sections.includes("author"));
  for (const name of ["Charles Hodge", "B. B. Warfield", "Geerhardus Vos", "C. F. Keil", "F. Delitzsch", "S. R. Driver", "J. B. Lightfoot", "B. F. Westcott", "Alfred Plummer"]) {
    assert.ok(person(name)?.sections.includes("scholar"), `${name} should be a scholar`);
  }
  assert.equal(person("John Bunyan")?.status, "provisional");
});

test("every listed person has a basis for each section, and nobody is invented", () => {
  const registry = new Map((JSON.parse(fs.readFileSync(path.join(root, "content/library/authors.json"), "utf8")).authors as { id: string; eligibility: string; entityType: string }[]).map((a) => [a.id, a]));
  for (const t of data.teachers) {
    assert.ok(t.sections.length > 0, t.name);
    for (const s of t.sections) assert.ok(t.basis[s], `${t.name}: ${s} has no basis`);
    if (t.origin === "library") {
      const entry = registry.get(t.id);
      assert.ok(entry && entry.entityType === "person" && ["eligible", "provisional"].includes(entry.eligibility), `${t.name} is not an eligible registry person`);
    } else assert.ok(t.cited.length > 0, `${t.name} is listed as cited but cites nothing`);
    if (t.sections.includes("author")) assert.ok(!t.sections.includes("scholar"), `${t.name} is both author and scholar`);
  }
  for (const name of ["Flavius Josephus", "Augustine", "Jewish Encyclopedia"]) assert.equal(person(name), undefined, `${name} must not be listed`);
});

test("the check finds no problem in the real data and catches broken links", () => {
  assert.deepEqual(checkTeachers(root, data), []);
  const broken: TeachersData = JSON.parse(serialise(data));
  const owen = broken.teachers.find((t) => t.name === "John Owen")!;
  owen.published[0].read = "/no-such-page";
  owen.traditions.push("not-a-tradition");
  broken.teachers.find((t) => t.name === "C. F. Keil")!.cited[0].urls.push("not a url");
  const problems = checkTeachers(root, broken).join("\n");
  assert.match(problems, /no-such-page matches no route/);
  assert.match(problems, /unknown tradition not-a-tradition/);
  assert.match(problems, /"not a url" is not a web address/);
});

test("routes are read from App.tsx, with params and splats", () => {
  const routes = appRoutes(root);
  for (const pathname of ["/study/prophets", "/apologetics/texts", "/people/moses-exo-2-10", "/topics/c/god"]) assert.ok(routes.some((r) => r.test(pathname)), pathname);
});

test("the committed data file is what the build produces", () => {
  assert.equal(fs.readFileSync(path.join(root, "src/data/teachers/teachers.json"), "utf8"), serialise(data));
});
