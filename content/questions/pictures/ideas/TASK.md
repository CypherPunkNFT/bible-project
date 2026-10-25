# Task: a picture idea for every Bible question in one chunk

You are writing picture ideas for a children's Bible quiz. When a child picks the right answer, a small line drawing of
that answer appears, so the child remembers it. You write what each drawing shows; the drawings are made later.

## Input and output

- Input: `content/questions/pictures/ideas/in/chunk-NNN.json`, a list of questions, each `{id, q, a, ref}`: the
  question, its right answer and the Bible reference (may be null).
- Output: `content/questions/pictures/ideas/out/chunk-NNN.json`, a JSON list with exactly one entry per input question,
  in the same order:

```json
{"id": "<the input id>", "idea": "<one sentence: what the drawing shows>", "name": "<picture-name>",
 "draw": "easy | medium | hard | symbol", "shows": "none | god | jesus"}
```

Work through the questions yourself, one by one, thinking about each. Do not write a script that produces ideas. Write
the output file in parts of about 50 entries if that is easier, but the finished file is one JSON list.

## What a good idea is

- **It shows the right answer, in the question's setting.** "Which tower did people build to reach heaven? — Babel":
  *A tall unfinished tower of bricks rising into the clouds, with tiny builders on its scaffolding.*
  "What did God do to the builders? — Spread them over all the earth": *Little groups of people walking away in every
  direction from a half-built tower.*
- **One clear thing a child can recognise.** A single scene or object, drawn in simple lines. No crowds of detail.
- **No words, letters or numbers in the drawing.** A number is shown by counting objects: "seven days" is seven small
  suns in a row; "twelve tribes" is twelve tents.
- **One sentence, 8 to 25 words**, describing only what is visible.

## Shared picture names

`name` is a short kebab-case name for the drawing, so questions that need the same drawing share one:
`tower-of-babel`, `people-scattering-from-babel`, `elijah-whirlwind-chariot`, `lamp-lighting-a-path`. Name the scene,
not the question. Use the same name every time the same drawing fits, and a different name when the drawing must
differ. Lower case, words joined by hyphens, at most 5 words.

## How hard to draw (`draw`)

- `easy`: one object or a very simple scene (a lamp, a ring, a tower).
- `medium`: a scene with a person or two and a setting.
- `hard`: an event with action or several people (crossing the Red Sea).
- `symbol`: the answer cannot be drawn as a scene (a doctrine, a word, a book of the Bible, an abstract idea); use one
  symbol from the list below, and set `name` to `symbol-<name>`, for example `symbol-cross`.

Symbols: cross, empty-tomb, crown, crown-of-thorns, open-bible, scroll, tablets-of-the-law, dove, flame, lamp, light-rays,
cloud, rainbow, heart, hands-praying, shepherds-staff, lamb, lion, bread-and-cup, water-drops, seed, tree, vine, wheat,
door, key, path, anchor, shield, sword, scales, star, sun, crown-and-cross, chains-broken, robe, oil-jar, altar, ark,
temple, church, family, globe.

## Three firm rules about God and Jesus

1. **God the Father is never drawn**, not as a person, face, hand or eye. Show what he did instead: light breaking
   through clouds, the sea parting, the people scattering, the burning bush. If the answer is God himself, use a
   symbol (`light-rays` or `cloud`). Set `shows` to `god` whenever the question is about God's own act.
2. **Jesus is only ever a simple figure seen in the distance or from behind, with no face.** Where the verse suits it,
   use a symbol instead: a crown, the cross, the empty tomb, a lamb. Set `shows` to `jesus` whenever Jesus is in the drawing
   or the symbol stands for him.
3. **The Holy Spirit** is a dove or flames, never a person.

Everything else: `shows` is `none`.

## When you finish

1. Run `python3 content/questions/pictures/ideas/check.py NNN` (NNN is the chunk number). It must print `OK`. Fix and
   rerun until it does.
2. Commit only the output file, with the message `Picture ideas: chunk NNN`, and push.
3. Reply with one line: the chunk number, how many entries, and how many distinct names.
