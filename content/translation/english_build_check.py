"""Build check: stops the build when the page code gains on-screen English that is not registered for translation.

Translation system, stage 4 (SiteTranslation/system/HANDOFF.md). It runs first in both build paths: `npm run build`
(package.json prebuild) and the quick release's code build (scripts/quick-release-build.mjs). It uses the net of
unregistered.py's "code" check (text in the page code that looks shown on screen but that extract.py's rules skip) and
compares it with english-baseline.json, the findings that were already there when the check began, so they do not
block anyone while stage 5 fixes them. The baseline is keyed by the English text, as the catalog is, with how many
times the text occurs, so a second copy of a known label is caught and a moved file is not.

The baseline may only shrink. Every run refuses a working baseline that holds more than the committed one, and a
committed one that holds more than the version before it, unless the growth is recorded in its "widenings" list with
a reason, the section and the exact number added (for a later stage that widens the net).

Stage 4 job 9 added five language nets against the same baseline (build_nets.py): sentences built from pieces,
hand-written plurals, number and date formats fixed to one language or left to the browser, tab titles and
descriptions written in the code, and data the site reads untranslated.

  python content/translation/english_build_check.py                    check this Website folder
  python content/translation/english_build_check.py --root DIR --since COMMIT
                                     check a release tree: only text the commits after COMMIT added (the quick release)
  python content/translation/english_build_check.py --shrink           drop what is no longer found (never adds)
  python content/translation/english_build_check.py --first-baseline   write the baseline, once
  python content/translation/english_build_check.py --add-sections "REASON"
                                     write each language-net section no version of the baseline ever held, once

Exit: 0 nothing new; 1 new English, or a baseline that grew; 2 refused (a file it reads is not as expected);
3 the check itself failed. Reads files only; costs nothing.
"""
import argparse
import datetime
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_nets  # noqa: E402
import english_baseline  # noqa: E402
import extract  # noqa: E402
import site_languages  # noqa: E402
import unregistered  # noqa: E402
from english_baseline import NETS, NotARepository, Refused, git, read_json  # noqa: E402

MAIN = extract.SITE  # the Website folder this file is in
HERE = Path(__file__).resolve().parent.relative_to(MAIN).as_posix()  # content/translation
BASELINE = f"{HERE}/english-baseline.json"
RULINGS = f"{HERE}/unregistered-reviewed.json"
JOB6 = extract.DEFAULT_OUT / "system" / "fake-language-reading" / "by-cause.json"
JOB6_CAUSES = ("code-not-collected", "code-known-unregistered")

HOW = {
    "one word": "put it under a key the collector reads (label, title, heading, subtitle, name, text, caption, "
                "description, short, kicker, eyebrow), or between tags: <span>Word</span>",
    "lowercase": "start it with a capital letter or end it with punctuation, or put it between tags",
    "template": "write the sentence as one template string whose words outside ${...} hold no code signs",
    "code": "reword it without the signs that read as code (; = => / a file name or a class-like word)",
    "lost": "a `...${...}...` string earlier on the same line hides it from the collector: move it to its own line",
    "jsx": "give the text between tags a capital letter or punctuation, and keep code signs out of it",
}


def blank_comments(source: str) -> str:
    """extract.without_comments with every comment turned into spaces (newlines kept), so a position in the result is
    the same position in the file and each finding gets its own line."""
    out, position, size = [], 0, len(source)
    while position < size:
        char, pair = source[position], source[position:position + 2]
        end = None
        if pair == "/*":
            found = source.find("*/", position + 2)
            end = size if found < 0 else found + 2
        elif pair == "//" and source[position - 1:position] != ":":
            found = source.find("\n", position)
            end = size if found < 0 else found
        if end is not None:
            out.append(re.sub(r"[^\n]", " ", source[position:end]))
            position = end
        elif char in "\"`" or (char == "'" and not re.match(r"[\w'’]", source[position - 1:position] or " ")):
            end = position + 1
            while end < size and source[end] != char and (char == "`" or source[end] != "\n"):
                end += 2 if source[end] == "\\" else 1
            stop = end + 1 if end < size and source[end] == char else position + 1
            out.append(source[position:stop])
            position = stop
        else:
            out.append(char)
            position += 1
    return "".join(out)


def candidates(original: str, suffix: str) -> list[tuple[int, str, str]]:
    """(line, text, reason) for each piece of one file's code that looks like words shown on screen: the same net as
    unregistered.code_candidates, with each line taken from where the piece itself stands."""
    source = blank_comments(original)
    found = []

    def line(position: int) -> int:
        return source.count("\n", 0, position) + 1

    for start, end, quote, body in unregistered.string_literals(source):
        text = unregistered.literal_text(quote, body)
        if text and unregistered.looks_like_words(text.replace("{n}", "1")) and not unregistered.code_context(source, start, end):
            found.append((line(start), text, unregistered.literal_reason(quote, text)))
    if suffix in (".tsx", ".jsx"):
        for match in unregistered.JSX_TEXT.finditer(source):
            text = " ".join(match.group(1).split())
            if (unregistered.looks_like_words(text) and extract.balanced(text) and not extract.EDGE_CODE.search(text)
                    and not re.search(r"&&|\|\||\?\s|=>|\.\w+\(|\(\s*\"|\",\s*\"", text)):
                lead = len(match.group(1)) - len(match.group(1).lstrip())
                found.append((line(match.start(1) + lead), text, "jsx"))
    return found


class Site:
    """The page code of one Website tree, read with extract.py's rules pointed at it."""

    def __init__(self, root: Path, folders: list[str], rulings: Path):
        self.root = root.resolve()
        previous = extract.SITE, unregistered.SITE
        extract.SITE = unregistered.SITE = self.root
        try:
            # src/generated/ is left out of both sides: the content build rewrites it from content/ and git does not
            # hold it, so a content rebuild must not move this check (its text is checked in the content files).
            self.files = {path.relative_to(self.root).as_posix(): path
                          for path in extract.page_files(include_generated=False)}
            if not self.files:
                raise Refused(f"no page code found under {self.root / 'src'}: expected the site's .ts/.tsx/.js files")
            registered = (extract.page_strings(list(self.files.values())) + extract.resource_page_strings()
                          + extract.debate_section_titles())
        except ValueError as error:
            raise Refused(f"a page file is outside {self.root} (an import through a link?): {error}") from error
        finally:
            extract.SITE, unregistered.SITE = previous
        registered += self.ui_keys(folders)
        self.known = {unregistered.with_numbers_blanked(text) for text in registered}
        self.ruled_texts, self.ruled_files = english_baseline.rulings(rulings, self.root)
        self.ruled_scoped = english_baseline.scoped_rulings(rulings)
        self.later = english_baseline.later_jobs(rulings)
        self.reading_ruled = english_baseline.reading_rulings(rulings)

    def ui_keys(self, folders: list[str]) -> list[str]:
        keys, missing = [], []
        for folder in folders:
            path = self.root / "data" / "i18n" / folder / "ui.json"
            if path.exists():
                keys += list(read_json(path))
            else:
                missing.append(str(path))
        if missing and len(missing) == len(folders):
            raise Refused(f"no translated page text found: expected data/i18n/<folder>/ui.json for {', '.join(folders)} "
                          f"under {self.root}; without them every registered text would look new")
        for path in missing:
            print(f"note: {path} is missing; that language's page text is not counted as registered")
        return keys

    def registered(self, text: str) -> bool:
        if text in self.ruled_texts:
            return True
        blanked = unregistered.with_numbers_blanked(text)
        return blanked in self.known or all(unregistered.with_numbers_blanked(piece) in self.known
                                            for piece in text.split(" · "))

    def findings(self, relative: str, original: str) -> list[tuple[str, int, str, str]]:
        if unregistered.skipped_file(relative, self.ruled_files):
            return []
        scoped = self.ruled_scoped.get(relative, set())
        return [(relative, line, text, reason) for line, text, reason in candidates(original, Path(relative).suffix)
                if text not in scoped and not self.registered(text)]

    def reading_resolved(self) -> set[str]:
        """What a browser-reading baseline text may be resolved by: registered by the page rules over every page file
        (src/generated/ too, which the net leaves out), collected by page_data.py, or named by a ruling."""
        if not hasattr(self, "_reading_resolved"):
            import page_data  # here, not at the top: only --shrink needs it
            previous = extract.SITE
            extract.SITE = self.root
            try:
                texts = extract.page_strings(extract.page_files(include_generated=True))
                try:
                    texts += [text for found in page_data.data_strings(self.root, extract.walk).values() for text in found]
                except SystemExit as error:  # a tree without the pages' bundled data (a made-up test site)
                    print(f"note: page_data.py cannot read {self.root} ({error}); its texts are not counted as registered")
            finally:
                extract.SITE = previous
            self._reading_resolved = {unregistered.with_numbers_blanked(text) for text in texts} | {
                unregistered.with_numbers_blanked(text) for text in self.reading_ruled}
        return self._reading_resolved

    def reading_registered(self, text: str) -> bool:
        return self.registered(text) or unregistered.with_numbers_blanked(text) in self.reading_resolved()

    def all_findings(self) -> list[tuple[str, int, str, str]]:
        return [found for relative, text in self.contents().items() for found in self.findings(relative, text)]

    def contents(self) -> dict[str, str]:
        if not hasattr(self, "_contents"):
            self._contents = {relative: path.read_text("utf-8") for relative, path in self.files.items()}
        return self._contents


def page_like(name: str) -> bool:
    """A path the page code could hold (extract.page_files' rule), for a file that no longer exists."""
    return (name.startswith("src/") and name.endswith(extract.PAGE_SUFFIXES) and not extract.page_file_skipped(name)
            and not name.startswith(extract.GENERATED) and "mockup" not in name.split("/"))


def old_versions(root: Path, since: str, names: list[str]) -> dict[str, str]:
    """Each file as the commit `since` held it; a file it did not hold is left out."""
    found = {}
    for name in names:
        old = subprocess.run(["git", "-C", str(root), "show", f"{since}:{name}"], capture_output=True, check=False)
        if old.returncode == 0:
            found[name] = old.stdout.decode("utf-8")
    return found


def nets_added_since(site: Site, root: Path, since: str, rulings) -> tuple[dict[str, Counter], list]:
    """The language nets on a release tree: per key, how much more the commits after `since` hold. The code nets count
    in the changed files, after against before; the data net judges the whole tree both ways (one disk, so only a change
    to the code moves it)."""
    changed = [name for name in git(root, "diff", "--name-only", "--no-renames", since, "HEAD").splitlines()
               if name in site.files or page_like(name)]
    before = old_versions(root, since, changed)
    now, earlier = build_nets.judge(root, site.contents(), set(), rulings, before, set(changed))
    if not changed:
        return {net: Counter() for net in NETS}, now
    scope = set(changed)
    after_counts = build_nets.counted([f for f in now if f.net == "data" or f.file in scope])
    before_counts = build_nets.counted([f for f in earlier if f.net == "data" or f.file in scope])
    added = {net: Counter({key: count - before_counts[net][key] for key, count in after_counts[net].items()
                           if count > before_counts[net][key]}) for net in NETS}
    return added, now


def unsaved(root: Path) -> set[str]:
    """Paths under src/ with changes not committed (possibly another chat's work in progress)."""
    try:
        lines = git(root, "status", "--porcelain", "--untracked-files=all", "--", "src").splitlines()
    except NotARepository:
        return set()
    return {line[3:].split(" -> ")[-1].strip('"') for line in lines}


def added_since(site: Site, root: Path, since: str) -> tuple[Counter, list]:
    """Per text, how many more times it occurs in the files changed after `since` than it did in them before."""
    changed = [name for name in git(root, "diff", "--name-only", "--no-renames", since, "HEAD").splitlines()
               if name in site.files or page_like(name)]
    before, after, places = Counter(), Counter(), []
    for name in changed:
        old = subprocess.run(["git", "-C", str(root), "show", f"{since}:{name}"], capture_output=True, check=False)
        if old.returncode == 0:
            before.update(text for _, _, text, _ in site.findings(name, old.stdout.decode("utf-8")))
        if name in site.files:
            now = site.findings(name, site.files[name].read_text("utf-8"))
            after.update(text for _, _, text, _ in now)
            places += now
    return Counter({text: after[text] - before[text] for text in after if after[text] > before[text]}), places


def report_new(new: Counter, places: list, allowed: dict[str, int], uncommitted: set[str]) -> None:
    print(f"\nNEW ENGLISH ON SCREEN THAT IS NOT REGISTERED FOR TRANSLATION ({len(new)} text(s)):\n")
    for text in sorted(new):
        where = [(file, line, reason) for file, line, found, reason in places if found == text]
        known = f" (the baseline allows {allowed[text]} of these)" if allowed.get(text) else ""
        print(f'  "{text}"{known}')
        for file, line, reason in where:
            note = "  [not committed: may be another chat's work in progress; leave it to that chat]" if file in uncommitted else ""
            print(f"    {file}:{line}{note}")
        reason = where[0][2] if where else "one word"
        print(f"    why the collector skips it: {unregistered.REASONS[reason]}")
        print(f"    to register it: {HOW[reason]}; then `python content/translation/extract.py --pages` collects it")
    print(f"\n  If a reader never sees it, or it is English on purpose, record a ruling instead, in {RULINGS}:\n"
          '    {"check": "code", "item": "<the text>", "why": "<why it stays English>"}\n')


def nets_against_baseline(site: Site, root: Path, baseline: dict, uncommitted: set[str], rulings):
    """The language nets on this folder: per key, how far today's count passes what the baseline allows."""
    now, _ = build_nets.judge(root, site.contents(), uncommitted, rulings)
    counts = build_nets.counted(now)
    new = {net: Counter({key: count - baseline[net].get(key, 0) for key, count in counts[net].items()
                         if count > baseline[net].get(key, 0)}) for net in NETS}
    return new, now, counts


def recently_changed(root: Path) -> set[str]:
    """Files changed since the baseline was last committed: where a new finding most likely is."""
    try:
        commit = git(root, "log", "-n", "1", "--format=%H", "--", BASELINE).strip()
        return set(git(root, "diff", "--name-only", commit, "--", "src").splitlines()) if commit else set()
    except NotARepository:
        return set()


def check(root: Path, since: str | None) -> int:
    started = time.monotonic()
    rulings = root / RULINGS if (root / RULINGS).exists() else MAIN / RULINGS
    site = Site(root, site_languages.folders(), rulings)
    net_rulings = build_nets.net_rulings(rulings, root)
    if since:
        new, places = added_since(site, root, since)
        allowed, uncommitted = {}, set()
        nets_new, net_places = nets_added_since(site, root, since, net_rulings)
        nets_allowed, recent = {net: {} for net in NETS}, set()
        print(f"English check (release tree {root}, commits after {since[:9]}): {sum(new.values())} unregistered "
              f"text(s) added; language nets: {', '.join(f'{net} {sum(nets_new[net].values())}' for net in NETS)} "
              f"added; {time.monotonic() - started:.1f} s")
    else:
        baseline_path = root / BASELINE
        baseline, growth = english_baseline.load_checked(baseline_path, root, BASELINE)
        places = site.all_findings()
        found = Counter(text for _, _, text, _ in places)
        allowed = {**{text: count for text, count in baseline["code"].items()},
                   **{text: max(found[text], 1) for text in baseline["reading"]}}
        new = Counter({text: count - allowed.get(text, 0) for text, count in found.items() if count > allowed.get(text, 0)})
        stale = sum(1 for text, count in baseline["code"].items() if found[text] < count)
        uncommitted = unsaved(root)
        nets_new, net_places, counts = nets_against_baseline(site, root, baseline, uncommitted, net_rulings)
        nets_allowed, recent = baseline, recently_changed(root)
        print(f"English check: {len(found)} unregistered text(s) in {len(site.files)} page files, {len(new)} new; "
              f"baseline {len(baseline['code'])} + {len(baseline['reading'])} from the browser reading, {stale} of them "
              f"fixed since (run with --shrink to drop them); language nets (found / new): "
              f"{', '.join(f'{net} {sum(counts[net].values())}/{sum(nets_new[net].values())}' for net in NETS)}; "
              f"{time.monotonic() - started:.1f} s")
        if site.later:
            print("handed to later jobs (unregistered-reviewed.json, check \"later\"): "
                  + ", ".join(f"job {job} {count}" for job, count in sorted(site.later.items())))
        if growth:
            print("\n".join(["", "THE BASELINE GREW; it may only shrink:"] + [f"  {line}" for line in growth]))
    if new:
        report_new(new, places, allowed, uncommitted)
    build_nets.report(nets_new, net_places, nets_allowed, uncommitted, recent)
    return 1 if new or any(nets_new.values()) or (not since and growth) else 0


def shrink(root: Path) -> int:
    pending = {name for name in unsaved(root) if not name.startswith("src/pages/mockup/")}
    if pending:
        raise Refused("--shrink reads the working tree, and these page files have unsaved changes (perhaps another "
                      "chat's): " + ", ".join(sorted(pending)[:10]) + ". Shrink once they are committed.")
    path = root / BASELINE
    baseline, growth = english_baseline.load_checked(path, root, BASELINE)
    if growth:  # shrinking now would commit over the growth, and the check compares only the last two commits
        raise Refused("the baseline fails its history check, and a shrink now would hide that from every later check. "
                      "Take the growth back out in a new commit (a widening added later does not count; it belongs in "
                      "the commit that grew it), then shrink. If you did not make this change, leave it to the chat "
                      "that did, or tell the owner:\n" + "\n".join(growth))
    site = Site(root, site_languages.folders(), root / RULINGS)
    found = Counter(text for _, _, text, _ in site.all_findings())
    smaller = english_baseline.shrunk(baseline, found, site.reading_registered)
    now, _ = build_nets.judge(root, site.contents(), set(), build_nets.net_rulings(root / RULINGS, root))
    smaller = english_baseline.shrunk_nets(smaller, build_nets.counted(now))
    english_baseline.write(path, smaller)
    print(f"baseline: {len(baseline['code'])} -> {len(smaller['code'])} texts, "
          f"{len(baseline['reading'])} -> {len(smaller['reading'])} from the browser reading; "
          + ", ".join(f"{net} {len(baseline[net])} -> {len(smaller[net])}" for net in NETS))
    return 0


def add_sections(root: Path, reason: str) -> int:
    """Each language-net section no version of the baseline ever held, from today's findings, with a widening per
    section that records the exact number added, so the growth guard accepts it once and never again."""
    if not reason.strip():
        raise Refused("--add-sections needs the reason it widens the baseline")
    if pending := {name for name in unsaved(root) if not name.startswith("src/pages/mockup/")}:
        raise Refused("page files have unsaved changes (perhaps another chat's), which would enter the baseline: "
                      + ", ".join(sorted(pending)[:10]))
    path = root / BASELINE
    baseline, growth = english_baseline.load_checked(path, root, BASELINE)
    if growth:
        raise Refused("the baseline has grown without a widening; put that right first:\n" + "\n".join(growth))
    held = set().union(*[english_baseline.committed(root, BASELINE, commit, commit)["present"] for commit in
                         git(root, "log", "--format=%H", "--", BASELINE).split()])
    missing = [net for net in NETS if net not in baseline["present"] | held]
    if not missing:
        raise Refused(f"every section ({', '.join(NETS)}) is or was in the baseline; a section is written once")
    site = Site(root, site_languages.folders(), root / RULINGS)
    now, _ = build_nets.judge(root, site.contents(), set(), build_nets.net_rulings(root / RULINGS, root))
    counts = build_nets.counted(now)
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    for net in missing:
        baseline[net] = dict(counts[net])
        if counts[net]:
            baseline["widenings"].append({"date": today, "reason": reason, "added": sum(counts[net].values()), "section": net})
    baseline["present"] = baseline["present"] | set(missing)
    english_baseline.write(path, baseline)
    print("sections added: " + ", ".join(f"{net} ({len(counts[net])} keys, {sum(counts[net].values())} places)" for net in missing))
    return 0


def first_baseline(root: Path) -> int:
    path = root / BASELINE
    if path.exists():
        raise Refused(f"{path} exists; the baseline is written once and may only shrink after (use --shrink)")
    site = Site(root, site_languages.folders(), root / RULINGS)
    found = Counter(text for _, _, text, _ in site.all_findings())
    reading = english_baseline.job6_texts(read_json(JOB6), JOB6_CAUSES)
    english_baseline.write(path, english_baseline.fresh(found, [text for text in reading
                                                                if text not in found and not site.registered(text)]))
    print(f"baseline written: {len(found)} texts ({sum(found.values())} places), plus browser-reading texts; {path}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=MAIN, help="the Website tree to check (default: this one)")
    parser.add_argument("--since", help="check only what the commits after this one added (a release tree)")
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--shrink", action="store_true", help="drop baseline texts no longer found; never adds")
    action.add_argument("--first-baseline", action="store_true", help="write the baseline if there is none")
    action.add_argument("--add-sections", metavar="REASON", help="write the language-net sections the baseline never held")
    args = parser.parse_args()
    try:
        if args.shrink:
            return shrink(args.root)
        if args.add_sections is not None:
            return add_sections(args.root, args.add_sections)
        if args.first_baseline:
            return first_baseline(args.root)
        return check(args.root, args.since)
    except Refused as error:
        print(f"English check refused: {error}", file=sys.stderr)
        return 2
    except Exception as error:  # noqa: BLE001 - any other failure must not read as "new English found"
        print(f"English check failed ({type(error).__name__}): {error}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
