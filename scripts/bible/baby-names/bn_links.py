"""Biblical baby names: links between names, other spellings, and links from person pages (design 3.4, 3.5, 6.5)."""

from collections import defaultdict

from bn_assemble import Name, slug_of
from bn_sources import StrongEntry


def related_names(names: dict[str, Name], rows: dict[str, dict], lexicon: dict[str, StrongEntry]) -> dict[str, dict]:
    """slug -> {"otherTestament", "sameRoot", "alsoSpelled", "sameTheme"}, each a list of {"slug", "name"}."""
    by_number: dict[str, set[tuple[str, str]]] = defaultdict(set)   # Strong's number -> {(slug, block language)}
    by_root: dict[str, set[str]] = defaultdict(set)
    numbers = lambda block: {block.strongs, *block.meaning.chain[1:], *(g["strongs"] for g in block.greek)}  # noqa: E731
    for name in names.values():
        for block in name.originals.values():
            for number in numbers(block):
                by_number[number].add((name.slug, block.strongs[0]))
            if block.meaning.root:
                by_root[block.meaning.root].add(name.slug)
    spelling_of = {n.slug: n.spelling for n in names.values()}
    link = lambda slugs, self_slug, limit: [{"slug": s, "name": spelling_of[s]} for s in sorted(  # noqa: E731
        (s for s in slugs if s != self_slug), key=lambda s: (not rows[s]["f"], -rows[s]["c"], s))[:limit]]
    related = {}
    for name in names.values():
        # The same name in the other Testament: a page whose original shares a Strong's number with one of this
        # page's originals across the Hebrew/Greek divide (Mary <-> Miriam, Jesus <-> Joshua, James <-> Jacob).
        other = {slug for block in name.originals.values() for number in numbers(block)
                 for slug, language in by_number[number] if language != block.strongs[0]}
        same_root = set().union(*(by_root[b.meaning.root] for b in name.originals.values() if b.meaning.root)) \
            if name.originals else set()
        spelled = {slug_of(f) for b in name.bearers.values() for f in b.forms} & set(spelling_of)
        related[name.slug] = {
            "otherTestament": link(other - spelled, name.slug, 4),
            "alsoSpelled": link(spelled, name.slug, 6),
            "sameRoot": link(same_root - other - spelled, name.slug, 6),
            "sameTheme": same_theme(name.slug, rows, spelling_of),
        }
    return related


def same_theme(slug: str, rows: dict[str, dict], spelling_of: dict[str, str]) -> list[dict]:
    """Three well-known names sharing this name's first theme and gender, most popular first."""
    row = rows[slug]
    if not row["th"]:
        return []
    genders = {"boy": {"boy", "both"}, "girl": {"girl", "both"}}.get(row["g"], {row["g"]})
    pool = [r for r in rows.values() if r["s"] != slug and r["f"] and row["th"][0] in r["th"] and r["g"] in genders]
    pool.sort(key=lambda r: (min(r.get("rb") or 99999, r.get("rg") or 99999), -r["c"], r["s"]))
    return [{"slug": r["s"], "name": spelling_of[r["s"]]} for r in pool[:3]]


def aliases(names: dict[str, Name], people: dict[str, dict], extra: dict[str, str], excluded: set[str]) -> dict[str, list[str]]:
    """Other spelling slug -> [page slug, the form as written]: TIPNR's and the people index's other forms, two-word
    names, and hand-added forms. A form that is a page of its own, or an excluded name, is never an alias."""
    pages = {n.slug for n in names.values()}
    found: dict[str, tuple[int, str, str]] = {}

    def offer(form: str, target: Name) -> None:
        key = slug_of(form)
        if not key or key in pages or form in excluded:
            return
        weight = sum(len(b.refs) for b in target.bearers.values())
        if key not in found or weight > found[key][0]:
            found[key] = (weight, target.slug, form)

    for name in names.values():
        for bearer in name.bearers.values():
            for form in bearer.forms:
                offer(form, name)
            listed = people[bearer.person]["n"]
            if listed != name.spelling and listed.split(" ")[0] == name.spelling:
                offer(listed, name)
    by_spelling = {n.spelling: n for n in names.values()}
    for form, spelling in extra.items():
        if spelling not in by_spelling:
            raise ValueError(f"baby-names: spelling-overrides.json alias '{form}' points to '{spelling}', which has no page")
        offer(form, by_spelling[spelling])
    return {key: [slug, form] for key, (_w, slug, form) in sorted(found.items())}


def person_links(names: dict[str, Name], people: dict[str, dict]) -> dict[str, str | None]:
    """The exceptions for the link on person pages: person id -> page slug where the slug rule applied to the listed
    name would land on the wrong page or none, and person id -> None where the person gets no link."""
    pages = {n.slug: n for n in names.values()}
    best: dict[str, tuple[int, str]] = {}
    for name in names.values():
        for pid, bearer in name.bearers.items():
            if pid not in best or len(bearer.refs) > best[pid][0]:
                best[pid] = (len(bearer.refs), name.slug)
    exceptions: dict[str, str | None] = {}
    for pid, row in sorted(people.items()):
        rule = slug_of(row["n"])
        if rule in pages and pid in pages[rule].bearers:
            continue
        exceptions[pid] = best[pid][1] if pid in best else None
    return exceptions
