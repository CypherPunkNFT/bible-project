# Chapter scenes: the key moments of every chapter, ready to become pictures

For each of the 1,189 chapters, a model picks the key scenes a picture could show and describes how each picture is
composed, ending in a ready-to-paste prompt for an image generator. The owner reads them in the
[Chapter Summary Studio](../chapter-summaries/README.md) under a **Scenes** switch, beside the chapter's Scripture.
Each scene's picture is then drawn on this PC (see [Pictures](#pictures)) and shown in the scene's frame. Nothing
is published.

**State (2026-11-10): one writer, one style, ready for the real picture run.** The owner kept Claude Haiku and
Painterly realism and retired the rest:
- **Local Qwen writer removed:** its 12 trial chapters are out of the database, the `local` command is gone from
  `chapter_scenes.py`, and the page has no writer buttons (scene cards, gallery and captions show Haiku's scenes only).
- **Watercolour storybook, Flat cartoon and Photographic removed:** [themes.json](themes.json) lists only Painterly
  realism, drawn by Codex. The page has no Make pictures button. The graphics-card maker (`chapter_pictures.py`)
  stays in the code but has no theme to draw; the old loop prompt is in [archive/](archive/).
- **Kept, not deleted:** database backup `F:\Backups\BibleProject\chapter-scene-studio\scenes-2026-11-10-before-cleanup.sqlite3`;
  the retired pictures (189 FLUX pictures with their small copies, the Qwen Painterly pictures and originals) in
  `F:\Backups\BibleProject\chapter-scene-studio\retired-2026-11-10\`.
- **Real run:** the manifest lists all 3,213 scenes (9 already drawn in the trial); the run brief is
  [CODEX_IMAGES.md](CODEX_IMAGES.md). The trial's logs and runner are in
  `.local/chapter-scene-studio/codex/painterly-realism/trial-2026-11-10/`.
- **Seven sections at once (owner 2026-11-10):** the first single run stopped on "model at capacity" after 296
  pictures (Genesis to Leviticus). The chapters are cut into 7 sections of about 415 pictures still to draw
  ([sections.json](sections.json)); each runs in its own chat from a paste block that starts "PHASE N of 7", in its
  own folder `codex/painterly-realism/section-N/` (manifest, runner, finalize, reject, block). The single run's
  manifest is kept as `manifest-before-sections.json` and seeded section 1. A capacity or usage-limit stop leaves
  pictures waiting, with the attempt not counted.

Sections below describe the pilot, the two writers and the FLUX themes as they were built; they are history now.

**State (2026-11-09):** every chapter (all 1,189) has Haiku scenes: 3,213 scenes (919 chapters with 3, 186 with 2, 84
with 1), shown in the Studio. The owner chose Haiku; the full run of the 1,177 chapters left after the trial took 17:01–19:30
through BatchRunner (inputs `.local/chapter-scene-studio/haiku-full/items`, results `haiku-full/runs`) and cost $3.81
at list price on the Max plan, against a 3-chapter pilot projection of $2.84 and a $5 hard stop.
8 answers failed the script checks and were redone (`haiku-full/retry-runs`, `retry2-runs`): one broken JSON, three
with the third scene's prompt missing, and four psalms that cited the psalm's heading as verse 0. The heading is in
the input without a verse number, so a psalm can still trip this; a rerun fixed every case. Qwen keeps only the 12 trial
chapters. Pictures are not made yet (about 6 hours of the graphics card per theme for all 3,213).

**Earlier (2026-11-07):** pilot done. Both writers wrote all 12 pilot chapters and every
answer passed the script checks (Qwen needed a second try once, on Ezekiel 1). Haiku cost $0.05 in total, about
$0.003 a chapter, so a full Haiku run projects to about $4 at list price; Qwen took about 100 seconds a chapter at 12
at once. To look: start the Studio (`python scripts/chapter_summary_studio.py --data-dir
.local/chapter-summary-studio/claude`, http://127.0.0.1:8947), choose **Scenes** in the dark **Pipelines** panel on the far left, then a pilot chapter (its square is underlined in gold).

**Haiku runs without `--schema`:** BatchRunner's job canary sends the task with "OK" as the item, and Haiku answers that
in prose, so a schema run fails the canary. The task asks for JSON only and `chapter_scenes.py import` checks every
answer, rejecting any call that ran past `--max-output` (`num_turns` > 1).

## The owner's decisions (2026-11-07)

1. **Up to 3 scenes per chapter, fewer for shorter chapters.** Under 250 words of BSB text: 1 scene (83 chapters).
   250–449 words: up to 2. 450 words or more: up to 3. A chapter with fewer distinct moments (a list of names) may
   return fewer. The first scene is the main one.
2. **Pilot both writers** on the same 12 chapters: the local Qwen model (HyperQwen, $0) and Claude Haiku 5.5 through
   [BatchRunner](../../../../../Tools/BatchRunner/README.md) (under $1). The owner compares them side by side in the
   Studio and picks one for the full run.
3. **No special rules for drawing God or Jesus yet.** The children's picture rules
   ([STANDARD.md](../../../AnswerPictures/STANDARD.md)) do **not** apply here. The owner will judge from the pilot.
   Faithfulness to the BSB still applies: no halos, no apple in Eden, nothing later tradition added.
4. **Wide frames (16:9).**

## What a scene holds

Defined in [scene-schema.json](scene-schema.json); the instructions every writer gets are [scene-task.md](scene-task.md).

| Field | What it is |
|---|---|
| title, kind | Short name; one of event, imagery (poetry's pictures), vision, setting |
| verse_start, verse_end | Where the moment is in the chapter |
| moment | The one frozen instant the picture shows |
| why | Why this is a key scene of the chapter |
| shot, viewpoint, focal_point | Wide/medium/close; where the camera is; what the eye lands on and where it sits in the frame |
| foreground, midground, background | What fills each layer |
| people | Who is there, how many, what each is doing |
| light, mood | Time of day and light (from the text when it says), palette and feeling |
| from_text | Details the verses state, each with its verse |
| added | Details invented for the picture (clothing, buildings, landscape), so the owner can see them |
| avoid | What must not appear because the text does not say it |
| prompt | The image prompt, 60–160 words, natural language, no art style (a style line may be added later for all) |

## How it runs (the assistant does all of this)

| Step | Code |
|---|---|
| Build one input per chapter: the BSB chapter, its Claude summary and outline, its scene limit | [chapter_scenes.py](../../scripts/chapter_scenes.py) `items` |
| Local writer: HyperQwen on 127.0.0.1:18020, thinking off, one retry with the error when an answer fails the checks | `chapter_scenes.py local` |
| Haiku writer: BatchRunner over the same inputs, with the same instructions and schema | BatchRunner, then `chapter_scenes.py import` |
| Script checks: valid JSON, scene count within the limit, verse ranges inside the chapter, every field filled | `chapter_scenes.py` (both writers) |
| Storage: `.local/chapter-scene-studio/scenes.sqlite3`, one row per chapter and writer; the summaries database is never written | `chapter_scenes.py` |
| Display: a primary panel on the far left lists the pipelines (Summaries, Scenes); beside it a secondary panel holds the chosen pipeline's workspace and settings; Scenes has its own heading, counts and preview card, showing each writer's scenes for the chapter; a verse chip highlights its verses | [chapter_scenes_view.py](../../scripts/chapter_scenes_view.py), wired into [chapter_summary_studio.py](../../scripts/chapter_summary_studio.py) |

**Pilot chapters (12):** Genesis 22, Exodus 14, Leviticus 16, 1 Chronicles 1, 1 Samuel 17, Psalm 23, Psalm 117,
Ezekiel 1, Mark 4, John 11, Romans 8, Revelation 21. Stories, law, a list of names, two poems (one of 2 verses),
visions, Gospel scenes with Jesus, a letter.

**Full run:** Haiku, chosen by the owner on 2026-11-09 (see State above).

## Pictures

The owner asked for pictures made from the prompts, starting with what exists (2026-11-07), and chose FLUX.3 Image
Klein. It is the best open image model that runs on the 4090 and whose licence allows the site to use the pictures
(FLUX Kommunity licence: commercial use is free under $5M yearly revenue).
The best model overall is closed and paid (OpenAI's GPT Image 2.6 Sunburst, about $0.21 a picture), and it was not chosen.

| What | Where |
|---|---|
| Model, 20 GB: the image model (bf16), its Qwen3-VL-4B text reader, the decoder | `F:\intelligence models\FLUX.3-image-klein`, from the ungated Unsloth copy `unsloth/flux-3-image-klein` (all 41 files byte-identical to Black Forest Labs' gated repo except the readme; `modular_model_index.json` points at the local folder, the original is kept as `modular_model_index.official.json`) |
| Python environment: torch 2.14.1 + CUDA 13.0, diffusers 0.42.1, transformers 5.22.2 | `Website/.local/flux3-venv` (git-ignored) |
| Picture maker | [chapter_pictures.py](../../scripts/chapter_pictures.py), run with the venv's Python (or the Studio's Make pictures button); store and themes: [scene_pictures.py](../../scripts/scene_pictures.py) |
| Pictures: WebP, 1344 × 768 (16:9), 16 steps, a fixed seed per scene | `.local/chapter-scene-studio/pictures/<theme>/<writer>/<CODE>-<chapter>-<scene index>.webp` and a 480 × 270 copy under `thumbs/`, plus a `pictures` table in `scenes.sqlite3` |
| Shown in the Studio | the scene's frame and the Gallery; click opens it large ([chapter_scenes_view.py](../../scripts/chapter_scenes_view.py), [chapter_scenes_themes.py](../../scripts/chapter_scenes_themes.py), route `/pictures/...`) |

How it works. The prompt goes to the model exactly as the writer wrote it; FLUX.3's own prompt rewriter, a separate
19 GB model, is left off because the scene prompts are already detailed. Each theme puts its style text in front of the prompt (none for Photographic). To keep the
card free, the text reader and the image model are never loaded at the same time. For each batch of 100 scenes, the
text reader reads all the prompts, then the image model draws them all. That takes 6.3 seconds a picture and at most
14.4 GiB of the card's memory. Loading both together, as the standard pipeline does, takes 36 seconds a picture. The
pictures come out identical, checked pixel by pixel on a test scene. All 3,100 or so pictures for every chapter would
take about 6 hours.

A picture counts as made only while its stored hash still matches the scene's current prompt plus its theme's style and the recipe (model,
size, steps) and its file exists. A rewritten scene or a changed recipe therefore gets a new picture on the next run,
and a stopped run carries on where it left off. The run stops itself in three cases: the card has less than 16 GiB
free (HyperQwen running, for example); three pictures in a row fail (out of memory, or a blank frame); or another run
already holds the lock.

## Themes and the gallery (owner 2026-11-07: "make it work to the best of your ability")

The owner wants the same scenes drawn in different art styles ("themes"), picked in the side panel beside Pipelines,
and a gallery of only the pictures in each theme. The first two cartoon themes come from two example pictures the
owner sent; the 63 photographic pictures become the theme "Photographic".

**A theme** is an id, a name, a one-line plain description and a style text placed in front of every scene prompt
(`<style>\n\nScene: <prompt>`; Photographic has no style text, so its 63 pictures stay valid). Themes are listed in
[themes.json](themes.json), in panel order; the assistant writes a new theme from the owner's examples in chat. The
example pictures are kept in `.local/chapter-scene-studio/themes/<id>/` (one is a watermarked stock image, so they are
not committed).

**Pictures per theme.** The pictures table gains a `theme` column (key, writer, scene, theme). Files move to
`pictures/<theme>/<writer>/<CODE>-<N>-<i>.webp`. The hash covers recipe + style + prompt, so editing a theme's style
redraws that theme only. `chapter_pictures.py --theme ID` draws one theme (default: every theme in order).

**The side panel (Scenes).** "Your workspace · Scenes" stays. Below it the Themes list replaces Scene settings: each
theme is a row with a small sample picture, its name and "made / total" pictures, and the chosen one is highlighted.
Under the list come the chosen theme's description and a **Make pictures** button. While a run is going, the button
reads **Stop**, with "Drawing 12 of 63" beside it, refreshed every 2 seconds. When the theme is complete the button
reads "All 63 made". The Writers note stays at the bottom. The chosen theme is remembered in the browser.

**Runs from the page.** `POST /api/pictures/start {theme}` starts `chapter_pictures.py --theme ID` with the image
venv's Python as a child of the Studio (one at a time; the maker's own lock also guards it), logging to
`.local/chapter-scene-studio/pictures-<theme>.log`. `POST /api/pictures/stop` ends it; finished pictures are kept.
`GET /api/pictures/state` gives running, theme, the last log line and the exit message. Code:
`chapter_pictures_runner.py` (standard library only).

**Scenes | Gallery tabs** at the top of the Scenes page.
- Scenes: the scene cards as now, with each frame showing the chosen theme's picture. Under the frame a strip of
  small thumbnails, one per theme that has this scene drawn; clicking one switches the chosen theme for the page.
- Gallery (owner 2026-11-10): the book and chapter pickers stay at the top; the Scripture panel and scene card are
  hidden. Under the pickers, the chosen book's pictures fill the page as a grid grouped by chapter ("1 Samuel 17"),
  with a count; clicking another book redraws it, clicking a chapter scrolls to that chapter. Clicking a picture
  opens it large: picture on the left; on the right the count, title, chapter and verses, the scene's description
  (its "moment") and the BSB verses. The arrow keys and on-screen arrows step through every book, not just the
  chosen one, and the page behind follows: each picture shown makes its book and chapter the page's own, so
  closing the view leaves you on the book and chapter where you stopped. Esc or a click outside closes it.
- **Reviewing pictures** (owner 2026-11-10: "no approve button ... if I just click next, then it's good"): moving on
  from a picture with → or ← approves it; the big red round **✗** on the picture's top-right corner (or the X key)
  flags it, with an optional note in the panel (Enter saves) and a red frame; clicking it again undoes the flag.
  The picture and its panel form one joined, centred block of the same height; the panel scrolls on its own. Closing the view approves nothing. Reviews are kept in the
  `picture_reviews` table of `scenes.sqlite3` (`POST /api/pictures/review`) and count only for the picture as
  drawn now: a redraw (new `made_at`) is unreviewed again. Gallery tiles show ✓ or a red ✗; the filters are All,
  Finished, Not looked at and Flagged; the count line shows the book's approved and flagged pictures.
  `python scripts/codex_pictures.py flagged --theme painterly-realism` lists the flagged ones with their section and note.
- **Read in Bible Guide ↗** in the panel opens the local Bible Guide (localhost:8931) at the chapter with the scene's
  verses highlighted (`/read/bsb/GEN/3?hl=22-24`), in a new tab.
  `GET /api/gallery?theme=ID` returns every scene; a scene not drawn yet has no picture URLs.
- **All | Finished** (owner 2026-11-07): All lists every scene, with a dashed "Not drawn yet" tile where the theme has
  no picture; Finished lists only drawn pictures. The choice is remembered.
- **▶ Speed run** (owner 2026-11-07: "speed run through all the images"): opens the large view at the first picture of
  what the gallery shows (filter and writer chips apply), with a "12 / 63" counter; ← → step through, wrapping at the
  ends. A not-drawn scene shows an empty frame in the run.
- **Verses beside the picture** (owner 2026-11-10): the large view shows the picture on the left and the scene's
  verses (BSB, from `/api/chapter`, one fetch per chapter) in a scrolling panel on the right; on a phone the panel
  sits under the picture.
- **→ crosses books** (owner 2026-11-10): a picture opened from the Scenes page opens inside every drawn picture
  of the theme (a fresh `/api/gallery` list per click, since the runs keep importing), at the one clicked, so → runs
  on past the chosen chapter and book while the page behind stays on it.

**Themes drawn by Codex (2026-11-09).** A theme with `"engine": "codex"` in [themes.json](themes.json) is drawn by
headless Codex's built-in image tool on the owner's ChatGPT login, not by FLUX: `chapter_pictures.py` skips it and
refuses `--theme` for it, and its hash uses its own recipe. [codex_pictures.py](../../scripts/codex_pictures.py)
writes the manifest (`.local/chapter-scene-studio/codex/<theme>/manifest.json`) and imports verified originals
(centre-cropped to 16:9, 1344 x 768, plus the small copy). First one: **Painterly realism**, the owner's style text,
trial on the 63 pilot scenes; run instructions in [CODEX_IMAGES.md](CODEX_IMAGES.md).

**Not now:** a "New theme" form on the page, thumbnails at a smaller size (the WebP files are about 300 KB and load
lazily), publishing anything.

**Built 2026-11-07.** After review, the run state lives in `pictures/.run.json`, which the maker writes while it holds
the lock. A restarted Studio therefore still sees and can stop a run, and Stop ends the whole process tree. The
63 photographic pictures were moved by a one-off migration into `pictures/photographic/`, and their rows got
`theme='photographic'`. A database backup was taken first:
`F:\Backups\BibleProject\chapter-scene-studio\scenes-2026-11-07-before-themes.sqlite3`. Their hashes still match,
which a test checks. Gallery copies (480 × 270) are made with each picture and backfilled at the start of every run.
The gallery adds chapters 30 at a time as you scroll.
