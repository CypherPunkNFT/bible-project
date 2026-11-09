"""Biblical baby names: the meaning method (docs/features/baby-names/design.md 3.3). No model is involved.

For one original word (one Strong's number) the headline meaning comes from, in order:
  1. a hand-checked override (meaning-overrides.json, each citing its source);
  2. the Bible's own explanation (a Berean note "X means ..."), label "Given in the Bible" or "Probable";
  3. Strong's gloss, following "the same as N" style pointers up to three steps, label "Probable";
  4. otherwise "Meaning uncertain", with the origin language.
A Berean "sounds like" note is wordplay: it is shown beneath the headline and never becomes it.
"""

import re
from dataclasses import dataclass, field

from bn_sources import BereanNote, StrongEntry

HEADLINE_MAX = 40
GIVEN, PROBABLE, PROBABLE_HEDGED, UNCERTAIN = "Given in the Bible", "Probable", "Probable (Strong's says 'probably')", "Uncertain"
UNCERTAIN_HEADLINE = "Meaning uncertain"

MEANS = re.compile(r"(?:^|; |\. |Hebrew |which )(?P<name>[A-Z][\w-]+)(?: is another name for [A-Z][\w-]+ and)? "
                   r"(?P<hedge>probably |possibly |likely )?means (?P<meaning>[^;.]+?)(?= and also sounds like|[;.]|$)")
SOUNDS = re.compile(r"(?:^|; |\. )(?P<name>[A-Z][\w-]+),? (?:sounds like|also sounds like)(?P<pun>[^;.]+)")
ARTICLE = r"^(?:an? |the )?(?:probably |perhaps |apparently )?"
POINTER = re.compile(ARTICLE + r"(?:the same as|a form of|a form for|another form (?:of|for)|abbreviated form (?:of|for)|a shorter form of|"
                     r"shorter form of|a shortened form of|a variation of|for|of Hebrew origin \(|of Hebrew origin \(compare |"
                     r"of Hebrew origin, the same as|Aramaic of|by contraction for|contracted for|contraction for|"
                     r"abbreviated from) ?([HG]\d+)")
DERIVATION = re.compile(ARTICLE + r"(?:from|the same as|a form of|form for|formed (?:like|as)|a variation of|for\b|feminine|masculine|dual|plural|"
                        r"of foreign|of Persian|of Egyptian|of Latin|of Hebrew|of Chaldee|of Aramaic|of uncertain|"
                        r"of Phoenician|of Arabic|of Babylonian|of Assyrian|of Greek|of Philistine|of Moabite|of Ethiopian|"
                        r"compare|the same|corresponding|patrial|patronymic|orthographical|by contraction|contracted|"
                        r"abbreviated|abridged|shorter form|another form|primitive|modification|future of|imperative of|active participle|"
                        r"passive participle|intensive|causative|denominative|in Ezekiel|or |rarely|by |"
                        r"\((?:Aramaic|Chaldee)|[HG]\d+)", re.I)
HEBREW_LETTERS = re.compile(r"[֐-׿]")
REFERENCE_ASIDE = re.compile(r"\((?![HG]\d)[^()]*\d[^()]*\)")  # '(2 Chronicles 24:1)' inside a derivation
ORIGINS = [("Persian", "Persian"), ("Egyptian", "Egyptian"), ("Latin", "Latin"), ("Chaldee", "Aramaic"),
           ("Aramaic", "Aramaic"), ("Babylonian", "Babylonian"), ("Assyrian", "Babylonian")]


@dataclass
class Meaning:
    headline: str
    label: str
    source: str                      # 'override' | 'bible' | 'strongs' | 'none'
    strongs_text: str = ""           # Strong's own wording for the entry (shown as Strong's wording)
    chain: list[str] = field(default_factory=list)
    bible_note: dict | None = None   # {"verse": id, "text": ...} when the Bible explains the name
    wordplay: dict | None = None     # {"verse": id, "text": ...} for a "sounds like" note
    explanation: str = ""            # an override's sentence
    cite: str = ""
    needs_check: bool = False
    origin: str = "Hebrew"
    root: str = ""                   # Strong's root number the name comes from ('H2603')


def clean_headline(text: str) -> str:
    """Strong's wording -> a headline: 'Jehovah' -> 'the LORD', no reference numbers, no trailing punctuation, short
    bracketed words kept as words ('God (is) helper' -> 'God is helper'), editorial asides dropped."""
    text = re.sub(r"\(?\b[HG]\d+\b\)?", "", text)
    text = re.sub(r"\s*\((?:with|from|see|compare|especially|as|in|of)\b[^()]*\)", "", text)
    text = re.sub(r"\((\w+(?: \w+)?)\)", r"\1", text)
    text = re.sub(r"\bJehovah-?([a-z]\w*)", r"\1 by the LORD", text)  # 'Jehovah-saved', 'Jehovahpleased'
    text = re.sub(r"\bJehovah\b", "the LORD", text)
    text = re.sub(r"\bJah\b", "the LORD", text)
    text = re.sub(r"\s+", " ", text).strip(" ;,.:\"“”")
    return re.sub(r"^(?:a|an|the) (?!LORD)", "", text)


def first_phrase(text: str) -> str:
    """A dictionary definition's first phrase: 'a mistress, i.e. female noble' -> 'mistress'."""
    text = re.sub(r"^(?:properly|literally|figuratively),? ", "", text.strip())
    text = re.split(r",|;| i\.e\.| \(| or |:", text, maxsplit=1)[0]
    return clean_headline(text)


def origin_of(entry: StrongEntry | None) -> str:
    if entry is None:
        return "other"
    for word, language in ORIGINS:
        if re.search(rf"\b(?:of )?{word}\b", entry.source):
            return language
    if re.search(r"\bof foreign (?:origin|derivation)\b", entry.source):
        return "other"  # Strong's names no language (Sargon, Candace); never call these Hebrew or Greek
    if entry.id.startswith("G"):
        return "Hebrew" if "of Hebrew origin" in entry.source else "Greek"
    return "Hebrew"


def strongs_gloss(entry: StrongEntry) -> tuple[str, bool]:
    """The gloss after the derivation ('from H2603; favored;' -> 'favored'), and whether Strong's hedges it."""
    if entry.id.startswith("G"):
        # Greek names keep their gloss at the start of the definition: 'dear to God; Timotheus, a Christian'.
        head = entry.meaning.split(";")[0].strip()
        if ";" in entry.meaning and not re.search(r"\b(?:the name of|an? (?:Christian|Israelite|Roman|Jew))\b", head):
            return head.strip("() "), False
        return "", False
    parts = [p.strip(" ,") for p in REFERENCE_ASIDE.sub("", entry.source).split(";") if p.strip(" ,")]
    gloss = [p for p in parts if not DERIVATION.match(p) and not HEBREW_LETTERS.search(p)]
    hedged = bool(re.match(r"^(?:probably|perhaps)\b", entry.source))
    return (", ".join(gloss), hedged) if gloss else ("", hedged)


def follow_chain(strongs: str, lexicon: dict[str, StrongEntry]) -> tuple[list[str], StrongEntry | None]:
    """Follow 'the same as N' style pointers up to three steps; the chain of numbers visited and the last entry."""
    chain = [strongs]
    entry = lexicon.get(strongs)
    for _ in range(3):
        if entry is None or strongs_gloss(entry)[0]:
            break
        segments = [part.strip(" ,") for part in REFERENCE_ASIDE.sub("", entry.source).split(";")
                    if not HEBREW_LETTERS.search(part)]
        pointer = next((m for part in segments if (m := POINTER.match(part))), None)
        if not pointer or pointer.group(1) in chain:
            break
        chain.append(pointer.group(1))
        entry = lexicon.get(pointer.group(1))
    return chain, entry


def root_of(entry: StrongEntry | None) -> str:
    """The first word a name is 'from' ('or …; from H2142 and H3050; …' -> 'H2142'), skipping 'the LORD' (H3068,
    H3050) and 'God' (H410), which would make half the names relatives of each other."""
    if entry is None:
        return ""
    for part in REFERENCE_ASIDE.sub("", entry.source).split(";"):
        match = re.match(r"^\s*(?:probably |perhaps )?from (?:the same as )?(.*)", part)
        if match:
            roots = [r for r in re.findall(r"[HG]\d+", match.group(1)) if r not in ("H3068", "H3050", "H410", "H3069")]
            return roots[0] if roots else ""
    return ""


def parse_note(note: BereanNote) -> list[dict]:
    """Every name explanation in one Berean note: [{"name", "kind": 'means'|'sounds', "text", "hedged"}]."""
    found = []
    for match in MEANS.finditer(note.text):
        found.append({"name": match.group("name"), "kind": "means", "text": match.group("meaning").strip(),
                      "hedged": bool(match.group("hedge"))})
        # A combined note need not repeat the name before its wordplay clause (Reuben, Genesis 29:32).
        if re.match(r" and also sounds like\b", note.text[match.end():]):
            found.append({"name": match.group("name"), "kind": "sounds", "text": note.text, "hedged": False})
    for match in SOUNDS.finditer(note.text):
        found.append({"name": match.group("name"), "kind": "sounds", "text": note.text, "hedged": False})
    return found


def strongs_meaning(strongs: str, lexicon: dict[str, StrongEntry]) -> Meaning:
    """Rules 3 and 4: Strong's gloss through its pointers, or 'Meaning uncertain'."""
    chain, entry = follow_chain(strongs, lexicon)
    first = lexicon.get(strongs)
    hebrew = next((lexicon.get(s) for s in chain if s.startswith("H") and lexicon.get(s)), None)
    origin, root = origin_of(hebrew or first), root_of(entry)
    wording = " ".join(x for x in (first.source if first else "", first.meaning if first else "") if x)
    if entry is None:
        return Meaning(UNCERTAIN_HEADLINE, UNCERTAIN, "none", wording, chain, origin=origin)
    gloss, hedged = strongs_gloss(entry)
    # A hedge on any step of the chain hedges the meaning ('probably a shortened form of G3161', Matthat).
    hedged = hedged or any(re.match(r"^(?:probably|perhaps)\b", lexicon[s].source) for s in chain[:-1] if s in lexicon)
    if gloss:
        headline = clean_headline(gloss)
        check = len(headline) > HEADLINE_MAX or not entry.is_name
        if len(headline) > HEADLINE_MAX:
            headline = first_phrase(gloss)
        if check:
            return Meaning(UNCERTAIN_HEADLINE, UNCERTAIN, "none", wording, chain,
                           needs_check=True, origin=origin, root=root)
        return Meaning(headline, PROBABLE_HEDGED if hedged else PROBABLE, "strongs", wording, chain,
                       needs_check=check, origin=origin, root=root)
    if not entry.is_name and entry.meaning:
        # The chain ended on an ordinary word: its definition's first phrase is a draft only (design 3.3 rule 3).
        return Meaning(UNCERTAIN_HEADLINE, UNCERTAIN, "none", wording, chain, needs_check=True,
                       origin=origin, root=root or (chain[-1] if len(chain) > 1 else ""))
    return Meaning(UNCERTAIN_HEADLINE, UNCERTAIN, "none", wording, chain, origin=origin, root=root)


def choose_meaning(strongs: str, lexicon: dict[str, StrongEntry], notes: list[dict], override: dict | None) -> Meaning:
    """The headline for one original word. `notes` are this word's parsed Berean notes, each with its "verse"."""
    meaning = strongs_meaning(strongs, lexicon)
    means = next((n for n in notes if n["kind"] == "means"), None)
    sounds = next((n for n in notes if n["kind"] == "sounds"), None)
    if sounds:
        meaning.wordplay = {"verse": sounds["verse"], "text": sounds["text"]}
    if override:
        meaning.headline, meaning.label, meaning.source = override["headline"], override["label"], "override"
        meaning.explanation, meaning.cite, meaning.needs_check = override.get("explanation", ""), override["cite"], False
        meaning.origin = override.get("origin", meaning.origin)
        if means:
            meaning.bible_note = {"verse": means["verse"], "text": means["text"]}
        return meaning
    if means:
        meaning.headline = re.sub(r"^(The|My|He|She|His|Her|A|An) ", lambda m: m.group(1).lower() + " ",
                                  clean_headline(means["text"]))
        meaning.label = PROBABLE if means["hedged"] else GIVEN
        meaning.source, meaning.needs_check = "bible", len(meaning.headline) > HEADLINE_MAX
        meaning.bible_note = {"verse": means["verse"], "text": means["text"]}
    return meaning


def themes_for(headline: str, themes: dict[str, dict]) -> list[str]:
    """Up to two theme ids whose keywords appear in the headline (design 3.4). Uncertain meanings get none."""
    if headline == UNCERTAIN_HEADLINE or re.search(r"\b(?:no|not|without|never)\b", headline, re.I):
        return []  # an uncertain or negative meaning ("no compassion") matches no theme
    words = headline.lower()
    found = [tid for tid, theme in themes.items() if any(re.search(rf"\b{re.escape(k)}\b", words) for k in theme["words"])]
    return found[:2]
