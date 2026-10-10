import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STUDY_BRANCHES } from "./collections";
import places from "./atlas-places.json";
describe("Study navigation preservation", () => {
    it("keeps every original collection reachable without unpublished review routes", () => {
        const paths = Object.values(STUDY_BRANCHES).flatMap(b => b.areas.flatMap(a => [a.featured.href, ...a.items.map(i => i.href), ...a.support.map(s => s[1])]));
        for (const url of ['/study/structure', '/study/letters', '/study/references', '/study/gospels', '/study/miracles', '/study/names', '/topics', '/study/people', '/study/versions'])
            expect(paths.some(p => p.split(/[?#]/)[0] === url)).toBe(true);
        expect(paths.every(p => !p.startsWith('/review/') && !p.startsWith('/mockups/'))).toBe(true);
    });
    it("uses canonical Atlas place IDs and coordinates", () => {
        const canonical = JSON.parse(readFileSync(resolve(process.cwd(), 'data/places.json'), 'utf8')) as typeof places;
        for (const place of places)
            expect(canonical.find(p => p.id === place.id)).toMatchObject(place);
    });
});
