"""The verse of the day page's English is registered for translation (sequence 32 step 13, job 872, 2026-11-09).

Every text the page and its builder show is collected by `extract.py --pages` through the ordinary page rules, so it
needs no line in page-register.json (docs/features/verse-widget/design.md 7.3). This test proves it and keeps it so: a
reworded sentence the rules would pass by fails here instead of staying English. The snippet code (snippet.ts) and the
widget's own words (public/widget/v1/verse.js) stay English on purpose and are not listed, as do the platforms' brand
names (WordPress, Squarespace, Wix).
"""
from __future__ import annotations

from functools import lru_cache

import extract

# Shown by the page, the builder and the preview: headings, buttons, labels and sentences.
PAGE_TEXTS = [
    "Bible verse of the day", "Read the chapter",
    "Every day a new verse from the Berean Standard Bible, the same for everyone, changing at midnight where you are.",
    "Put it on your church's website", "Where to paste it", "Privacy, in plain words", "For your web person", "Questions",
    "Today's verse appears here", "The verse could not be loaded. Try again later.",
    "Look", "Plain", "Card", "Colours", "Match the visitor's device", "Light", "Dark", "Text in the frame",
    "Dark text, for a light page", "Light text, for a dark page", "Link colour", "Same as the text", "Your own colour",
    "Colour as a hex code", "Font", "Your website's", "Serif", "Sans", "Size", "Standard", "Compact", "Heading",
    "Verse of the day", "Today's verse", "None", "Align", "Left", "Centre",
    "Preview", "Preview on", "White page", "Dark page", "Your colours", "Page colour", "Text colour", "Width",
    "{n} pixels", "Show the longest verse", "The longest verse could not be loaded.",
    "Choose how to add it", "Most websites (recommended)", "If your website does not allow scripts", "Just a link",
    "Copy", "Copied", "Press Ctrl+C, or long-press and choose Copy",
    "Code to paste into your website", "Frame code to paste into your website", "Link code to paste into your website",
    "Link as plain text", "For a website builder that only takes a link, use this line:",
    "Recommended height: {n} pixels. On Wix, set the Embed HTML element to this height.",
    "On a dark page, choose the Card look.",
    "On the plain look, check this colour against your own page in the preview.",
    "This colour is hard to read on both light and dark cards.", "This colour is hard to read on a light card.",
    "This colour is hard to read on a dark card.",
    "Church website platforms", "Your own site", "WordPress help: the Custom HTML block",
    "Squarespace help: code blocks", "Wix help: the HTML iframe element",
    "No cookies, no sign-up, no account and no key.", "Is it free?", "Yes, always, with no account.",
    "Which Bible does it quote?", "The Berean Standard Bible, in English.", "Can we choose the verses?",
    "It shows only two links. What went wrong?",
    "Bible Verse of the Day: Today's Verse, and a Free Widget for Church Websites",
]


@lru_cache(maxsize=1)
def collected() -> frozenset[str]:
    return frozenset(extract.page_strings())


def test_the_page_s_own_words_are_collected() -> None:
    missing = [text for text in PAGE_TEXTS if text not in collected()]
    assert missing == []


def test_the_longer_paragraphs_are_collected() -> None:
    starts = ["Choose how it should look, then copy a few lines of code", "No tracking: Bible Guide keeps no record",
              "Add a Custom HTML block where you want the verse", "Add a Code block, set it to HTML",
              "Choose Add, then Embed code, then Embed HTML", "Paste the code into the page's HTML",
              "The widget loads two files from bibleguide.io", "Every address under /widget/v1/ keeps working",
              "Because it sets no cookies", "The verse of the day that churches show on their own websites"]
    for start in starts:
        assert any(text.startswith(start) for text in collected()), start
