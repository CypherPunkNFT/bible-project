# People stories

The site's own life stories for people, written from Scripture. On a person's page a story here replaces
"Their story" from STEP Bible (TIPNR), which STEP marks as adapted from AI output (owner's decision, 2026-10-07). STEP's
text stays in the person's data file untouched, so nothing is lost; the page shows ours and credits it to this site.

The person page is about the person: life, family and character as the text shows them. A ruler's reign or an
apostle's mission has its own page ([src/data/people-pages/](../../../src/data/people-pages/)); the story is a life
summary that points there rather than repeating it.

## Files

One file per group, `<group>.json` (e.g. `apostles.json`, `rulers-kings.json`). Every `*.json` in this folder is read;
a person may have a story in only one file.

```json
{
  "about": "Sourced life stories for <group>. Written from Scripture and the reviewed dossier Research/People/<dossier>.md.",
  "stories": {
    "<person id>": {
      "short": "One sentence, under 30 words, our own words.",
      "paragraphs": [
        { "text": "Two to five sentences in our own words.", "refs": [[11015009, 11015011], [14014001, 14014001]] }
      ]
    }
  }
}
```

| Field | Rule |
|---|---|
| person id | A file in `data/study/people/<id>.json`, and not a record marked `same` (that page sends readers to the other record; write the story there). |
| `short` | One sentence, under 30 words. Shown first. |
| `paragraphs` | Usually 3 to 6; fewer for people Scripture says little about, and the story says so. |
| `text` | Two to five sentences in our own words. Every statement is supported by one of the paragraph's `refs`. |
| `refs` | `[first, last]` verse ids, `book * 1_000_000 + chapter * 1_000 + verse` (Genesis = 1 … Revelation = 66). At least one per paragraph; they become links into the reader. |

## Writing rules

- Scripture only: no tradition, no dates BC, no scholars' views, no identification stated as fact (where a page relies on
  one, say what the text says: "Mark and Luke call him Levi").
- Quotations word for word from the site's KJV, in double quotes, sparingly.
- No moralising, no invented feelings or motives, no adjectives the text does not support.
- Where Kings and Chronicles (or two Gospels, or Matthew and Acts) differ, name both ("Chronicles adds…") rather than
  merging them.
- The factual base is the person's reviewed dossier in [Research/People/](../../../../Research/People/), not STEP's text.

## Checking

```
D:/Python/python.exe scripts/check-people-stories.py
```

[check-people-stories.py](../../../scripts/check-people-stories.py) checks the shape, that every person id exists, that
every verse exists in the KJV, that each quotation matches the KJV of its paragraph's verses word for word (punctuation
and capitals ignored), that `short` is under 30 words, and that our own words carry no confidence words (undoubtedly,
surely, clearly, proves, obviously, certainly) or BC/AD dates. It does not check that the verses say what the paragraph
says: read each paragraph beside its verses.

## What the page data gets

[build-study.py](../../../scripts/build-study.py) applies the stories through
[people_stories.py](../../../scripts/bible/people_stories.py). In `data/study/people/<id>.json`:

| Field | Meaning |
|---|---|
| `story` | `{"short": "...", "paragraphs": [{"text": "...", "refs": [[first, last], ...]}, ...]}`, as written here. |
| `storyBy` | `"site"`: the story was written by this site from Scripture. |

STEP's `short` and `article` stay in the file as they were. The person's one-line row in `data/study/people.json`
(`b`) is not changed by a story.
