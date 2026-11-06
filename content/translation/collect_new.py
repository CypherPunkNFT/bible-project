"""The collecting modes stage 5 job 12 added to extract.py: --sources (content-file text added to SOURCES after the first
collection) and --page-data (text the pages show from data bundled with their code, page_data.py). extract.collect_more
runs them, sources first.
"""
import extract
import page_data


def sources(args) -> set[str]:
    """--sources: the content files' text (SOURCES) not yet in a chunk of its kind, appended without retarget (that is
    retarget.py's, as before: the snapshot of every content text would be ~18 MB). Apologetics text a page chunk holds is
    left out (apply.py puts both kinds into ui.json). Returns the apologetics texts appended, or that would be."""
    appended: set[str] = set()
    for kind, strings in extract.collect().items():
        skip = frozenset(extract.held_texts(args.out, extract.PAGE_KIND)) if kind == "apologetics" else frozenset()
        texts = extract.append(args.out, kind, list(strings.values()), dry_run=args.dry_run, skip=skip)
        appended.update(texts if kind == "apologetics" else ())
    return appended


def page_data_texts(args) -> None:
    """--page-data: the text pages show from data bundled with their code (page_data.py), into the phrase lists of the
    pages that show it. Text the phrase lists those pages load already hold is left out (page_data.HELD)."""
    for kind, texts in page_data.data_strings(extract.SITE, extract.walk).items():
        held = frozenset().union(*(extract.held_texts(args.out, other) for other in page_data.HELD[kind]))
        extract.append(args.out, kind, texts, dry_run=args.dry_run, skip=held)
