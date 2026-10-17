import { existsSync, readFileSync } from "node:fs";
import { initials, isMuseumSlug, objectSubtitle, type MuseumIndex, type Museum, type MuseumObject } from "@/lib/museums";

// The pure helpers are always tested. The data assertions need `npm run museums`, whose output lives
// in the git-ignored data/ folder like all the site's data, so they are skipped where it is absent.
const built = existsSync("data/museums/index.json");

describe("museum addresses", () => {
  it.each(["the-met", "british-museum", "holder-not-recorded", "a1"])("accepts %s", (slug) => {
    expect(isMuseumSlug(slug)).toBe(true);
  });

  it.each([
    ["a", "too short to be a slug"],
    ["../creeds/index", "a path traversal"],
    ["museums/index", "a nested path"],
    ["British-Museum", "upper case"],
    ["the met", "a space"],
    ["", "empty"],
  ])("rejects %s (%s)", (slug) => {
    expect(isMuseumSlug(slug)).toBe(false);
  });
});

describe("emblem initials", () => {
  it("skips the filler words so a mark reads as the institution", () => {
    expect(initials("The Metropolitan Museum of Art")).toBe("MA");
    expect(initials("The Yale Babylonian Collection")).toBe("YBC");
    expect(initials("Bibliothèque nationale de France")).toBe("BF");
  });

  it("falls back to the plain words when every word is filler", () => {
    expect(initials("The Museum")).toBe("TM");
  });
});

describe("object subtitle", () => {
  it("joins only the parts a record actually has", () => {
    const object = { date: "1200 BC", culture: "", period: "", medium: "granite" } as MuseumObject;
    expect(objectSubtitle(object)).toBe("1200 BC · granite");
  });

  it("is empty when the record says nothing", () => {
    expect(objectSubtitle({ date: "", culture: "", period: "", medium: "" } as MuseumObject)).toBe("");
  });
});

describe.skipIf(!built)("the built museum data", () => {
  const index: MuseumIndex = JSON.parse(readFileSync("data/museums/index.json", "utf8"));
  const page = (slug: string): Museum => JSON.parse(readFileSync(`data/museums/${slug}.json`, "utf8"));

  it("gives every card a page, and every slug is a safe address", () => {
    expect(index.cards.length).toBeGreaterThan(0);
    for (const card of index.cards) {
      expect(isMuseumSlug(card.slug), card.slug).toBe(true);
      expect(existsSync(`data/museums/${card.slug}.json`), card.slug).toBe(true);
    }
  });

  it("writes a page for a Coming soon museum too, so its card never links at nothing", () => {
    const soon = index.cards.filter((card) => card.state === "coming-soon");
    expect(soon.length).toBeGreaterThan(0);
    for (const card of soon) {
      const museum = page(card.slug);
      expect(museum.objects).toHaveLength(0);
      expect(museum.why_coming_soon.length).toBeGreaterThan(40);
    }
  });

  it("never shows a photograph without a credit and an open licence", () => {
    const open = new Set(["cc0", "cc by 4.0", "cc by 3.0", "cc by-sa 4.0", "cc by-sa 3.0", "cc by-sa 2.0 fr", "public domain", "gfdl"]);
    let seen = 0;
    for (const card of index.cards) {
      for (const object of page(card.slug).objects) {
        if (!object.photo) continue;
        seen += 1;
        expect(object.photo.credit.trim(), `${card.slug}/${object.id}`).not.toBe("");
        expect(open.has(object.photo.licence.trim().toLowerCase()), object.photo.licence).toBe(true);
        expect(object.photo.view.startsWith("/images/museums/")).toBe(true);
        expect(existsSync(`public${object.photo.view}`), object.photo.view).toBe(true);
        expect(existsSync(`public${object.photo.thumb}`), object.photo.thumb).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("tells the reader how every biblical link was made", () => {
    for (const card of index.cards) {
      for (const object of page(card.slug).objects) {
        expect(object.basis_label.length, `${card.slug}/${object.id}`).toBeGreaterThan(10);
        if (object.basis === "term-match") expect(object.basis_label).toContain("not an identification");
      }
    }
  });

  it("never lists more objects than it holds, nor more than the page cap", () => {
    for (const card of index.cards) {
      const museum = page(card.slug);
      expect(museum.totals.listed, card.slug).toBeLessThanOrEqual(museum.totals.records);
      expect(museum.objects.length, card.slug).toBe(museum.totals.listed);
      expect(museum.objects.length, card.slug).toBeLessThanOrEqual(120);
    }
  });

  it("keeps the two kinds of card apart, because their records are the same records", () => {
    const groups = new Set(index.cards.map((card) => card.group));
    expect(groups.has("collections")).toBe(true);
    expect(groups.has("holders")).toBe(true);
    const fetched = index.cards.filter((card) => card.group === "collections");
    // The collections are where everything came from, so they cover the whole corpus between them;
    // adding the holders on top would count most of it a second time.
    const sum = fetched.reduce((running, card) => running + card.records, 0);
    expect(sum).toBeGreaterThanOrEqual(index.counts.records_in_corpus);
  });

  it("files no object under an institution its own source did not name", () => {
    for (const card of index.cards) {
      const museum = page(card.slug);
      if (museum.group !== "holders" || museum.slug === "holder-not-recorded") continue;
      for (const object of museum.objects) {
        expect(object.recorded_as.trim(), `${card.slug}/${object.id}`).not.toBe("");
      }
    }
  });

  it("never claims a name match is the catalogue row's own object", () => {
    // The corpus ties the Met's "Bead Amulet of Merneptah" to BA-001, the row for the Merneptah
    // stele, because both titles carry the name. An amulet is not a victory stele, and the page must
    // say so rather than repeat the stele's conclusions underneath the amulet.
    const met = page("metropolitan-museum-of-art");
    const amulet = met.objects.find((object) => /bead amulet/i.test(object.title));
    expect(amulet, "the Met's bead amulet is in the listed objects").toBeDefined();
    expect(amulet?.catalogue.map((row) => row.id)).toContain("BA-001");
    expect(amulet?.catalogue.every((row) => row.match === "related")).toBe(true);
    expect(amulet?.basis_label).toContain("not the same object");

    // The 51 named objects were crosswalked by hand, one at a time, and those are identities.
    const named = page("holder-not-recorded").objects.find((object) => /amarna letters/i.test(object.title));
    expect(named?.catalogue.some((row) => row.match === "object")).toBe(true);
  });

  it("counts only the rows that are about the object itself", () => {
    for (const card of index.cards) {
      const museum = page(card.slug);
      const identities = new Set(
        museum.objects.flatMap((object) => object.catalogue.filter((row) => row.match === "object").map((row) => row.id)),
      );
      expect(museum.totals.catalogue_rows, card.slug).toBe(identities.size);
    }
  });

  it("carries the catalogue's own two sentences wherever a row matched", () => {
    const rows = index.cards.reduce((running, card) => running + card.catalogue_rows, 0);
    expect(rows).toBeGreaterThan(0);
    for (const card of index.cards) {
      for (const object of page(card.slug).objects) {
        for (const row of object.catalogue) {
          expect(row.id).toMatch(/^BA-\d{3}$/);
          // Either the two-sentence split, or the single sentence the older audits used. Never
          // nothing: a catalogue heading with no text under it is both useless and a check failure.
          expect(row.supported.length + row.unsupported.length + row.scope.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
