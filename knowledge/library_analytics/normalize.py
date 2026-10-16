"""Explicit metadata normalization; preserve unknowns and raw assertions."""
import re
import unicodedata

VERSION = 'la01-normalize-v1'
LANGUAGES = {
    'en':'en', 'eng':'en', 'english':'en', 'middle english':'enm', 'enm':'enm',
    'la':'la', 'lat':'la', 'latin':'la', 'grc':'grc', 'ancient greek':'grc',
    'el':'el', 'ell':'el', 'gre':'el', 'modern greek':'el',
    'de':'de', 'deu':'de', 'ger':'de', 'german':'de', 'fr':'fr', 'fra':'fr', 'fre':'fr', 'french':'fr',
    'es':'es', 'spa':'es', 'spanish':'es', 'it':'it', 'ita':'it', 'italian':'it',
    'nl':'nl', 'dut':'nl', 'nld':'nl', 'dutch':'nl', 'cy':'cy', 'wel':'cy', 'cym':'cy',
    'he':'he', 'heb':'he', 'ar':'ar', 'ara':'ar', 'pt':'pt', 'por':'pt', 'ru':'ru', 'rus':'ru',
    'zh':'zh', 'zh-hans':'zh-Hans', 'zh-hant':'zh-Hant', 'ko':'ko', 'kor':'ko',
    'ja':'ja', 'jpn':'ja', 'vi':'vi', 'vie':'vi', 'hi':'hi', 'hin':'hi', 'fa':'fa', 'fas':'fa',
    'cop':'cop', 'syc':'syc', 'syr':'syr', 'uga':'uga', 'mul':'mul',
    'fi':'fi', 'ta':'ta', 'rw':'rw', 'ro':'ro', 'tl':'tl', 'ga':'ga', 'gle':'ga', 'gd':'gd', 'gla':'gd',
    'und':'und', 'unknown':'und', 'unspecified':'und', '':'und',
}
SOURCE_ALIASES = {'tcp-bulk':'tcp', 'ccel-expansion':'ccel', 'ccel-catalog':'ccel'}
GENRES = {'sermons':'sermon', 'commentaries':'commentary', 'catechisms':'catechism',
          'confessions':'confession', 'letters':'letter', 'treatises':'treatise'}


def clean(value):
    return unicodedata.normalize('NFKC', str(value or '')).strip()


def language(value):
    raw = clean(value)
    key = raw.casefold().rstrip('.')
    if key in LANGUAGES:
        return LANGUAGES[key], 'explicit-alias' if LANGUAGES[key] != raw else 'recorded-code'
    if ';' in key:
        pieces = [language(p)[0] for p in key.split(';')]
        if all(p != 'und' for p in pieces) and all(language(p)[1] != 'unmapped' for p in key.split(';')):
            unique = sorted(set(pieces))
            return ';'.join(unique), 'explicit-multi-language'
    # Unrecognized values are retained for investigation, not guessed to be English.
    return raw, 'unmapped'


def source(value):
    raw = clean(value)
    key = raw.removeprefix('library:').removeprefix('source-')
    return SOURCE_ALIASES.get(key, key) or 'unknown'


def normalized(observation, assertions):
    """Recover absent fields only; conflicting populated assertions are flagged."""
    fields = {'language': observation['language'], 'title': observation['title'],
              'author_label': observation['author_label'], 'genre': observation['genre'],
              'source_raw': observation['source_raw']}
    evidence = {}
    issues = []
    for name, existing in fields.items():
        missing = not clean(existing) or (name == 'language' and language(existing)[0] == 'und')
        candidates = assertions.get(name, [])
        usable = [(clean(v), origin) for v, origin in candidates if clean(v)]
        if name == 'language':
            usable = [(v, p) for v, p in usable if language(v)[0] != 'und']
            groups = {language(v)[0] for v, _ in usable}
        else:
            groups = {v for v, _ in usable}
        if missing and len(groups) == 1:
            fields[name] = usable[0][0]
            evidence[name] = {'method':'structured-metadata-recovery', 'assertions':usable}
        elif missing and len(groups) > 1:
            issues.append(name + ':conflicting-recovery-assertions')
    lang, method = language(fields['language'])
    if method == 'unmapped':
        issues.append('language:unmapped')
    return {'key':observation['key'], 'layer':observation['layer'],
            'language_raw':observation['language'], 'language':lang, 'language_method':method,
            'title_raw':observation['title'], 'title':fields['title'],
            'author_raw':observation['author_label'], 'author_label':fields['author_label'],
            'genre_raw':observation['genre'], 'genre':GENRES.get(clean(fields['genre']).casefold(), clean(fields['genre']).casefold()) or 'unknown',
            'source_raw':observation['source_raw'], 'source_family':source(fields['source_raw']),
            'recovery':evidence, 'issues':issues, 'version':VERSION}
