"""What counts as on-screen text in the page code: the collector's rules (extract.page_strings) and the wider net that
lists what they miss (unregistered.py, english_build_check.py), in one place so the two read code the same way.

Pure functions of a file's comment-free source; nothing here reads the disk. extract.py and unregistered.py import these
names and keep them as their own (extract.CODE_LIKE, unregistered.looks_like_words, ...), so assigning one of them on
those modules changes nothing here: patch this module instead.
"""
import html
import re

WORD = re.compile(r"[^\W\d_]+")

# --- The collector's rules (from extract.py) -------------------------------------------------------------------------
# Text written into the page code: JSX text between tags, label-like attributes, and prose string literals. The site
# swaps each on screen for its translation (src/components/PageTranslator.tsx), matching the text exactly as shown.
JSX_TEXT = re.compile(r"(?<![=\-])>([^<>{}]{1,600})<")
# JSX text touching an expression on one side: "}start anywhere<", ">Open the map of {", "} answered<". In plain code
# the same shape catches statements, so EDGE_CODE throws those out.
JSX_EDGE = re.compile(r"(?:\}|(?<![=\-])>)([^<>{}]{1,600})(?=[<{])")
# Also thrown out: the pieces of a template string around its ${...} (one text node on screen, never these pieces),
# and SVG path data ("M0,0 L-4,13 Z").
EDGE_CODE = re.compile(r"[;`]|\(\)|\$$|\$\{|^[MmLlHhVvCcSsQqTtAaZz\d\s.,-]*\d[MmLlHhVvCcSsQqTtAaZz\d\s.,-]*$|^(?:export|function|const|let|var|return|else|if|import|interface|type|case|default|"
                       r"async|await|for|while|try|catch|finally|throw|new|typeof|extends|class|as|satisfies)\b")
# A template string with values in it: each ${...} becomes "{n}", the form the site matches counts by ("{n} scholars").
# A value may hold quoted text with braces of its own: ${plural(n, "{n} verse", "{n} verses")} (stage 5 job 14).
TEMPLATE = re.compile(r"`([^`\\\n]*\$\{[^`\\\n]*)`")
TEMPLATE_VALUE = re.compile(r"""\$\{(?:[^{}"']|"[^"\n]*"|'[^'\n]*')*\}""")
PAGE_ATTRIBUTE = re.compile(r'\b(?:aria-label|title|placeholder|alt|label)="([^"\n]{1,300})"')
# One-word labels in data written into the code ({ label: "Study" }, {label:'Practice'}), which PAGE_LITERAL's two-word
# floor skips. Either quote: the Apologetics menu and several study pages use single quotes.
PAGE_PROPERTY = re.compile(r'\b(?:label|title|heading|subtitle|name|text|caption|description|short|kicker|eyebrow)\s*:\s*'
                           r'''(?:"([^"\\\n]{2,300})"|'([^'\\\n]{2,300})')''')
# A single quote touching a word is an apostrophe ("the letter's", "Hebrews'"), not the edge of a string.
# Every string is matched, however short, so that a "nt" cannot put the following quotes out of step; strings_in
# then skips those outside PAGE_LITERAL_LENGTH.
PAGE_LITERAL = re.compile(r'"([^"\\\n]*)"|' + r"(?<![\w'’])'([^'\\\n]*)'(?!\w)|" + r"`([^`$\\\n]*)`")
PAGE_LITERAL_LENGTH = range(3, 401)
CODE_LIKE = re.compile(r"[;=]|=>|&&|\|\||^\W|\",\w+:|\.(tsx?|css|json|svg|png|jpe?g|md)\b|^[\w./@-]+$|\b(?:px|rem|var\(|rgba?\(|hsl)\b"
                       r"|\.\d+m?s\b|\bxM[a-z]+Y[A-Z]|\b(?:translate|scale|rotate)\(|\bMath\.|\bmain h1\b|#root\b")


def class_like(text: str) -> bool:
    tokens = text.split()
    return sum(bool(re.search(r"[-:\[\]/]|^\d", token)) for token in tokens) >= max(1, len(tokens) // 2)


def without_comments(source: str) -> str:
    """The code with its comments blanked, reading strings as strings so a "//" in an address survives. An apostrophe in
    JSX text does not open a string, and a quote left open at the end of its line was not a string."""
    out, position, size = [], 0, len(source)
    while position < size:
        char = source[position]
        pair = source[position:position + 2]
        if pair == "/*":
            end = source.find("*/", position + 2)
            position = size if end < 0 else end + 2
        elif pair == "//" and source[position - 1:position] != ":":
            end = source.find("\n", position)
            position = size if end < 0 else end
        elif char in "\"`" or (char == "'" and not re.match(r"[\w'’]", source[position - 1:position] or " ")):
            end = position + 1
            while end < size and source[end] != char and (char == "`" or source[end] != "\n"):
                end += 2 if source[end] == "\\" else 1
            closed = end < size and source[end] == char
            stop = end + 1 if closed else position + 1
            out.append(source[position:stop])
            position = stop
        else:
            out.append(char)
            position += 1
    return "".join(out)


def balanced(text: str) -> bool:
    return text.count("(") == text.count(")") and text.count("[") == text.count("]")


def translatable(text: str) -> bool:
    text = text.strip()
    return bool(WORD.search(text)) and not text.startswith(("http://", "https://"))


def jsx_prose(text: str) -> bool:
    """JSX text between tags; a semicolon is allowed in a sentence of five words or more ("...be read; every...")."""
    if not translatable(text):
        return False
    if not CODE_LIKE.search(text) or re.fullmatch(r"[A-Z][a-z'’-]+", text):  # a one-word label: <h2>Read</h2>, <th>Date</th>
        return True
    return (len(WORD.findall(text)) >= 5 and bool(re.match(r"[A-Z“‘\"(]", text))
            and not CODE_LIKE.search(text.replace(";", ",")))


def template_text(literal: str) -> str | None:
    text = " ".join(TEMPLATE_VALUE.sub("{n}", literal).split())
    rest = " ".join(text.replace("{n}", " ").split())
    if "$" in rest or "{" in rest or not re.search(r"[A-Za-z]{3}", rest) or EDGE_CODE.search(text.replace("{n}", "0")):
        return None
    one_word = re.fullmatch(r"[A-Za-z]{3,}", rest) and " " in text  # "{n} scholars", not "{n}px"
    return None if (CODE_LIKE.search(rest) and not one_word) or class_like(rest) else text


def first_rules(source: str, suffix: str) -> list[str]:
    """The collector's rules as they stood before stage 5 (job 11), unchanged for .ts and .tsx, so nothing they found is
    lost."""
    found: dict[str, None] = {}
    for match in JSX_TEXT.finditer(source):
        text = " ".join(match.group(1).split())
        if jsx_prose(text):
            found.setdefault(text)
    for match in TEMPLATE.finditer(source):
        if text := template_text(match.group(1)):
            found.setdefault(text)
    # Plain scripts (.js, .mjs, read since stage 5) have no JSX: there these would be pieces of HTML in a template string.
    for match in JSX_EDGE.finditer(source) if suffix not in SCRIPT_SUFFIXES else ():
        text = " ".join(match.group(1).split())
        if translatable(text) and balanced(text) and not CODE_LIKE.search(text) and not EDGE_CODE.search(text):
            found.setdefault(text)
    for match in PAGE_ATTRIBUTE.finditer(source):
        text = " ".join(match.group(1).split())
        if translatable(text):
            found.setdefault(text)
    for match in PAGE_PROPERTY.finditer(source):
        text = " ".join((match.group(1) or match.group(2)).split())
        one_word = re.fullmatch(r"[A-Z][a-z'’]+", text)
        if one_word or (re.match(r"[A-Z]", text) and not CODE_LIKE.search(text) and not class_like(text)):
            found.setdefault(text)
    for match in PAGE_LITERAL.finditer(source):
        literal = next(group for group in match.groups() if group is not None)
        text = " ".join(literal.split())
        if (len(literal) in PAGE_LITERAL_LENGTH and len(WORD.findall(text)) >= 2 and re.search(r"[A-Z]|[.?!,]", text)
                and not CODE_LIKE.search(text) and not class_like(text)):
            found.setdefault(text)
    return list(found)


# A quote, a comma and a quote: the gap between two strings of a call (plural(n, "{n} book", "{n} books") read by the
# rule for text beside a {value}, the "{n}" taken for one), never a text.
BETWEEN_ARGUMENTS = re.compile(r"""["'`]\s*,\s*["'`]""")


def strings_in(source: str, suffix: str) -> list[str]:
    """Every text of one page file's comment-free code that the collector registers, each once, in the order found:
    the first rules, then the gaps stage 5 closed (gap_strings). Never a piece of raw template code or a CSS selector."""
    texts = dict.fromkeys(first_rules(source, suffix))
    texts.update(dict.fromkeys(gap_strings(source, suffix)))
    return [text for text in texts if "${" not in text and not SELECTOR.fullmatch(text) and not BETWEEN_ARGUMENTS.search(text)]


# --- The net's reading of code (from unregistered.py) ----------------------------------------------------------------
CAPITALISED_WORD = re.compile(r"[A-Z][a-z]+(?:['’][a-z]+)?")
# Signs a literal is code, not words: markup, calls, units, colours, file names, addresses.
CODE_TEXT = re.compile(r"[{};<>=\\|]|=>|\(\)|https?://|^[/#.@]|\b\d+(?:px|rem|em|ms|s|vh|vw|deg|%)|var\(|rgba?\(|hsla?\("
                       r"|\.(?:tsx?|json|css|svg|png|jpe?g|webp|md|txt|pdf)\b|\$\{|^[\w-]+:[\w-]")
# What sits just before a literal that is code: an attribute or key that holds a name, a comparison, or a call that
# takes a key, a selector or a message for the console. Not group or kind (since stage 5): their values are labels.
CODE_ATTRIBUTE = re.compile(
    r"\b(?:className|class|key|id|href|to|src|srcSet|type|role|lang|rel|target|name|htmlFor|viewBox|d|fill|stroke|style"
    r"|as|variant|size|tone|color|icon|path|slug|route|value|defaultValue|mode|accept|autoComplete|inputMode|dir"
    r"|data-[\w-]+|aria-(?!label)[\w-]+|transform|points|x|y|cx|cy|r|width|height|fontFamily|textAnchor)\s*=\s*\{?\s*$")
CODE_KEY = re.compile(
    r"(?:^|[{,\s])(?:id|key|slug|href|to|path|route|src|icon|color|tone|type|variant|className|class|lang|code|value"
    r"|ref|anchor|hash|query|param|field|format|style|mode|status|folder|file|url|font|fontFamily|background"
    r"|border|ease|easing|transition|animation|align|justify|position|display|cursor|direction|book|abbr)\s*:\s*$")
CODE_BEFORE = re.compile(
    r"(?:===|!==|==|!=|\bcase|\btype\s+\w+\s*=|\binterface\b.*|\|\s*|&&\s*|\bin\s+)\s*$"
    r"|\b(?:import|from|require|console\.\w+|Error|querySelector(?:All)?|getElementById|addEventListener"
    r"|removeEventListener|fetch|getItem|setItem|removeItem|getAttribute|setAttribute|hasAttribute|removeAttribute"
    r"|includes|startsWith|endsWith|indexOf|split|join|replace|replaceAll|match|test|get|has|set|delete|navigate"
    r"|createElement|closest|matches|toLocale\w*|DateTimeFormat|NumberFormat|describe|it|expect|warn|log|error"
    r"|postMessage|dispatchEvent|Event|CustomEvent|localStorage\.\w+|sessionStorage\.\w+|track|emit|on)\s*\(\s*$"
    r"|\w\[\s*$")
CODE_AFTER = re.compile(r"^\s*(?:===|!==|==|!=|\]|in\b|\?\s*\w+\s*:)")


def looks_like_words(text: str) -> bool:
    """A capitalised word ("Practice"), or a run of words that is not code ("Show all 66 books")."""
    if not text or CODE_TEXT.search(text) or class_like(text):
        return False
    tokens = text.split()
    if len(tokens) == 1:
        return bool(CAPITALISED_WORD.fullmatch(text.rstrip(".:!?")))
    words = [token for token in tokens if re.fullmatch(r"[(“\"‘']?[A-Za-z][a-z'’-]*[)”\"’'.,:;!?]*", token)]
    if len(words) * 2 <= len(tokens):
        return False
    # Two lowercase words are usually a name in code ("sans serif"); a capital, punctuation or three words are not.
    return bool(re.match(r"[A-Z“\"‘(]", text) or re.search(r"[.?!,]", text) or len(words) >= 3)


def code_context(source: str, start: int, end: int) -> bool:
    line_start = source.rfind("\n", 0, start) + 1
    before = source[max(line_start, start - 80):start]
    after = source[end:end + 20]
    return bool(CODE_ATTRIBUTE.search(before) or CODE_KEY.search(before) or CODE_BEFORE.search(before)
                or CODE_AFTER.match(after))


def opens_string(source: str, position: int) -> bool:
    """A quote that starts a string: an apostrophe touching a word ("the letter's") opens nothing."""
    char = source[position]
    return char in "\"`" or (char == "'" and not re.match(r"[\w'’]", source[position - 1:position] or " "))


def string_end(source: str, position: int) -> tuple[int, list[tuple[int, int]]] | None:
    """Where the string opening at `position` closes, and for a backtick string the spans of code inside its ${...}; None
    for a quote left open at the end of its line. A template inside a ${...} is read whole, so its backticks do not
    close the outer one."""
    char, size, end, values = source[position], len(source), position + 1, []
    while end < size and source[end] != char:
        if source[end] == "\\":
            end += 2
        elif char == "`" and source.startswith("${", end):
            close = code_end(source, end + 2)
            values.append((end + 2, close))
            end = close + 1
        elif char != "`" and source[end] == "\n":
            return None
        else:
            end += 1
    return (end, values) if end < size else None


def code_end(source: str, position: int) -> int:
    """The position of the } that closes the code starting at `position` (strings in it skipped); the end if none."""
    depth, size = 0, len(source)
    while position < size:
        char = source[position]
        if char == "{":
            depth += 1
        elif char == "}":
            if depth == 0:
                return position
            depth -= 1
        elif opens_string(source, position) and (found := string_end(source, position)):
            position = found[0] + 1
            continue
        position += 1
    return size


def string_literals(source: str, start: int = 0, stop: int | None = None) -> list[tuple[int, int, str, str]]:
    """(start, end, quote, body) for each string in comment-free code, in order: a backtick string may run over lines
    and hold ${...}, whose code is read for strings of its own (`${open ? "Close" : `Open ${n}`}`); an apostrophe
    touching a word opens nothing, and a quote left open at the end of its line was not a string."""
    stop = len(source) if stop is None else stop
    found, position = [], start
    while position < stop:
        if opens_string(source, position) and (ends := string_end(source, position)) and ends[0] < stop:
            end, values = ends
            found.append((position, end + 1, source[position], source[position + 1:end]))
            for value_start, value_end in values:
                found += string_literals(source, value_start, value_end)
            position = end + 1
            continue
        position += 1
    return found


ENGLISH_WORD = re.compile(r"\b(?:the|and|of|to|a|an|in|is|are|for|on|with|by|or|it|this|that|your|you|every|all|from|at|as|not)\b",
                          re.IGNORECASE)


def english(text: str) -> bool:
    """Page text written in English, not a verse the code quotes in another language ("Jehová te bendiga")."""
    if re.search(r"[^\x00-\x7F\u2010-\u201F\u2026\u00A0\u00B7]", text):
        return False
    return len(text.split()) <= 2 or bool(ENGLISH_WORD.search(text))


# --- The gaps stage 5 closed (job 11): page text the first rules passed by ---------------------------------------------
SCRIPT_SUFFIXES = (".js", ".mjs")
JSX_SUFFIXES = (".tsx", ".jsx")
LONGEST_LITERAL = 4000  # a paragraph written into a data file of the code (the theology articles, the parables)
ONE_WORD = re.compile(r"[A-Z][a-z'’]+")
# Keys whose one-word values are labels a page shows ({ group: "Hebrew Bible" }, { kind: "Chart" }).
LABEL_KEY = re.compile(r"(?:^|[{,\s])(?:group|kind)\s*:\s*$")
# Keys whose values a page never shows: words for search to match ({ aliases: 'salt tasteless saltness' }).
NOT_SHOWN_KEY = re.compile(r"(?:^|[{,\s])(?:aliases|alias|keywords|terms|synonyms|tags|search|query|match|matches)\s*:\s*$")
# A list of CSS selectors ("p,pre,li", "h2, h3"), which a script hands to querySelectorAll.
SELECTOR = re.compile(r"[a-z0-9.#>*:\[\]=-]+(?:\s*,\s*[a-z0-9.#>*:\[\]=-]+)+")
# Signs that a JSX text beside a value is code ("x && y", "a ? b", "=> ", ".map(").
JSX_CODE = re.compile(r"&&|\|\||\?\s|=>|\.\w+\(|\(\s*\"|\",\s*\"")
CLOSING = ")]}"
OPENING = "([{"


def screen_jsx(text: str) -> bool:
    """The net's test for JSX text between tags or beside a {value}: words, not code."""
    return looks_like_words(text) and balanced(text) and not EDGE_CODE.search(text) and not JSX_CODE.search(text)


def masked(source: str, literals: list[tuple[int, int, str, str]]) -> str:
    """The source with every string's inside blanked (its quotes kept), so brackets and ? : in text are not code."""
    chars = list(source)
    for start, end, _, _ in literals:
        chars[start + 1:end - 1] = " " * (end - start - 2)
    return "".join(chars)


def branch_of_choice(code: str, start: int) -> bool:
    """A string that is a branch of a choice: right after `?`, `??` or `||`, or after the `:` of a `?` met walking back
    at the same bracket depth (`n > 1 ? `Told in ${n} books` : "Passage"`), across lines. `code` is masked()."""
    before = code[:start].rstrip()
    if re.search(r"(?:\?\?|\|\||(?<![?.])\?)$", before):
        return True
    if not before.endswith(":"):
        return False
    depth, colons, position = 0, 0, len(before) - 2
    while position >= 0 and start - position < 1200:
        char = before[position]
        if char in CLOSING:
            depth += 1
        elif char in OPENING:
            if depth == 0:
                return False
            depth -= 1
        elif depth == 0 and char == ";":
            return False
        elif depth == 0 and char == ":" and before[position - 1:position] != "?":
            colons += 1
        elif (depth == 0 and char == "?" and before[position + 1:position + 2] not in (".", "?", ":")
              and before[position - 1:position] != "?"):
            if colons == 0:
                return True
            colons -= 1
        position -= 1
    return False


PLURAL_CALL = re.compile(r"\bplural\s*$")


def plural_form(code: str, start: int) -> bool:
    """A form handed to site-format.ts's plural(n, one, many): its second or third argument, shown on screen however it
    looks (" · {n} times", "{n} old maps name it"). `code` is masked()."""
    position, depth, commas = start - 1, 0, 0
    while position >= 0 and start - position < 600:
        char = code[position]
        if char in CLOSING:
            depth += 1
        elif char in OPENING:
            if depth == 0:
                return char == "(" and commas in (1, 2) and bool(PLURAL_CALL.search(code[max(0, position - 20):position]))
            depth -= 1
        elif depth == 0 and char == ",":
            commas += 1
        elif depth == 0 and char == ";":
            return False
        position -= 1
    return False


def shown_lowercase(text: str, body: str, source: str, start: int, end: int) -> bool:
    """A phrase with no capital that a page shows ("in four collections", "(not stated)"): words, not code, not a key
    or a value no reader sees, and English (the home banner's verses in other languages stay out)."""
    line_start = source.rfind("\n", 0, start) + 1
    before = source[max(line_start, start - 80):start]
    object_key = re.search(r"[{,]\s*$", before) and re.match(r"\s*:", source[end:end + 5])
    lookup = re.search(r"""["'][a-z0-9 '-]+["']\s*:\s*$""", before)  # { "song of solomon": "song of songs" }: a lookup
    return (not re.search(r"[A-Z]", text) and len(body) <= LONGEST_LITERAL and looks_like_words(text)
            and not code_context(source, start, end) and not NOT_SHOWN_KEY.search(before) and not object_key
            and not lookup
            and (english(text) or len(WORD.findall(text)) <= 3))


def literal_gaps(source: str) -> list[str]:
    """Strings the first rules miss: after a `${}` template on the same line (their quote pairing was lost there),
    paragraphs over 400 characters, one-word labels under group/kind or in a choice ("Verdict"), lowercase phrases, and
    the forms handed to plural()."""
    found = []
    literals = string_literals(source)
    code = masked(source, literals)
    for start, end, quote, body in literals:
        if "\\" in body or (quote == "`" and "${" in body):
            continue
        text = " ".join(body.split())
        line_start = source.rfind("\n", 0, start) + 1
        before = source[max(line_start, start - 80):start]
        if (len(body) in range(3, LONGEST_LITERAL + 1) and len(WORD.findall(text)) >= 2
                and re.search(r"[A-Z]|[.?!,]", text) and not CODE_LIKE.search(text) and not class_like(text)):
            found.append(text)
        elif (ONE_WORD.fullmatch(text) and (LABEL_KEY.search(before) or branch_of_choice(code, start))
              and (not code_context(source, start, end) or re.search(r"\|\|\s*$", before))):
            found.append(text)
        elif shown_lowercase(text, body, source, start, end):
            found.append(text)
        elif ("{n}" in text or len(WORD.findall(text)) >= 2 or ONE_WORD.fullmatch(text)) and plural_form(code, start):
            found.append(text)  # a single lowercase word ("it", "once") is left to the swap's other rules
    return found


def template_html(source: str) -> list[str]:
    """Text a script writes into the page as HTML in a template string: each text between > and <, with each ${...} as
    {n} (one text node on screen: "Named as his {n} in the family list"), entities read (&amp; is &). A value that
    draws an element (an icon) is no text at all."""
    found = []
    for start, end, quote, body in string_literals(source):
        if quote != "`" or "<" not in body:
            continue
        flat, position = [], start + 1
        while position < end - 1:
            if source.startswith("${", position):
                close = code_end(source, position + 2)
                draws = re.search(r"icon|svg|<", source[position + 2:close], re.IGNORECASE)
                flat.append(" " if draws else "{n}")
                position = close + 1
            else:
                flat.append(source[position])
                position += 1
        for match in re.finditer(r">([^<>]{1,600})<", "".join(flat)):
            text = " ".join(html.unescape(match.group(1)).split())
            rest = " ".join(text.replace("{n}", " ").split())
            if (text.count("{n}") <= 3 and re.search(r"[A-Za-z]{3}", rest) and not CODE_TEXT.search(rest)
                    and not class_like(rest) and balanced(text) and (" " in text or not re.fullmatch(r"[a-z-]+", rest))):
                found.append(text)
    return found


def gap_strings(source: str, suffix: str) -> list[str]:
    found = literal_gaps(source)
    if suffix in JSX_SUFFIXES:  # text beside a {value}: ", the only account", "By", "% of the book"
        found += [text for match in JSX_EDGE.finditer(source) if screen_jsx(text := " ".join(match.group(1).split()))]
    if suffix in SCRIPT_SUFFIXES:
        found += template_html(source)
    return found
