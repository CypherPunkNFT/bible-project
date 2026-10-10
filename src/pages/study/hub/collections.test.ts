import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STUDY_BRANCHES, THEOLOGY_TOOLS } from "./collections";
import places from "./atlas-places.json";
describe("Study navigation preservation", () => {
    it("keeps every original collection reachable without unpublished review routes", () => {
        const paths = [...STUDY_BRANCHES.theology.areas.flatMap(a => [a.featured.href, ...a.items.map(i => i.href), ...a.support.map(s => s[1])]), ...THEOLOGY_TOOLS.map(t => t.href)];
        for (const url of ['/study/structure', '/study/letters', '/study/references', '/study/gospels', '/study/miracles', '/study/names', '/topics', '/study/people', '/study/versions', '/study/atlas'])
            expect(paths.some(p => p.split(/[?#]/)[0] === url)).toBe(true);
        expect(paths.every(p => !p.startsWith('/review/') && !p.startsWith('/mockups/'))).toBe(true);
    });
    it("opens existing topic families and groups directly", () => {
        const index = JSON.parse(readFileSync(resolve(process.cwd(), 'data/topics/index.json'), 'utf8'));
        const links = STUDY_BRANCHES.theology.areas.flatMap(a => [a.featured.href, ...a.items.map(i => i.href), ...a.support.map(s => s[1])]);
        for (const href of links.filter(h => h.startsWith('/topics/c/'))) {
            const url = new URL(href, 'http://localhost');
            const family = index.categories.find((c: {id: string}) => c.id === url.pathname.split('/').pop());
            expect(family, href).toBeDefined();
            if (url.searchParams.has('group')) expect(family.subcategories.some((g: {id: string}) => g.id === url.searchParams.get('group')), href).toBe(true);
        }
    });
    it("uses canonical Atlas place IDs and coordinates", () => {
        const canonical = JSON.parse(readFileSync(resolve(process.cwd(), 'data/places.json'), 'utf8')) as typeof places;
        for (const place of places)
            expect(canonical.find(p => p.id === place.id)).toMatchObject(place);
    });
});
