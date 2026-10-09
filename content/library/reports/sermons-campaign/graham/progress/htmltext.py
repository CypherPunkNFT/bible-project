"""Print visible text of an HTML file (scripts/styles stripped). Usage: htmltext.py FILE [grep-regex]"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class TextOnly(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg"}
    BLOCK = {"p", "div", "br", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section", "article", "blockquote"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.depth += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.depth:
            self.depth -= 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.depth:
            self.parts.append(data)


def visible_text(html):
    parser = TextOnly()
    parser.feed(html)
    text = "".join(parser.parts)
    lines = [re.sub(r"[ \t\xa0]+", " ", ln).strip() for ln in text.splitlines()]
    return "\n".join(ln for ln in lines if ln)


if __name__ == "__main__":
    text = visible_text(Path(sys.argv[1]).read_text("utf-8", errors="replace"))
    if len(sys.argv) > 2:
        pat = re.compile(sys.argv[2], re.I)
        text = "\n".join(ln for ln in text.splitlines() if pat.search(ln))
    print(text)
