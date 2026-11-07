# Chapter scenes: the key moments of every chapter, ready to become pictures

For each of the 1,189 chapters, a model picks the key scenes a picture could show and describes how each picture is
composed, ending in a ready-to-paste prompt for an image generator. The owner reads them in the
[Chapter Summary Studio](../chapter-summaries/README.md) under a **Scenes** switch, beside the chapter's Scripture.
Nothing is published; no pictures are made yet.

**State (2026-11-07):** pilot done, waiting for the owner to compare. Both writers wrote all 12 pilot chapters and every
answer passed the script checks (Qwen needed a second try once, on Ezekiel 1). Haiku cost $0.05 in total, about
$0.003 a chapter, so a full Haiku run projects to about $4 at list price; Qwen took about 100 seconds a chapter at 12
at once. To look: start the Studio (`python scripts/chapter_summary_studio.py --data-dir
.local/chapter-summary-studio/claude`, http://127.0.0.1:8947), choose **Scenes** under **Pipelines** in the side panel, then a pilot chapter (its square is underlined in gold).

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
| prompt | The image prompt, 60–160 words, natural language, no art style (a style line is added later for all) |

## How it runs (the assistant does all of this)

| Step | Code |
|---|---|
| Build one input per chapter: the BSB chapter, its Claude summary and outline, its scene limit | [chapter_scenes.py](../../scripts/chapter_scenes.py) `items` |
| Local writer: HyperQwen on 127.0.0.1:18020, thinking off, one retry with the error when an answer fails the checks | `chapter_scenes.py local` |
| Haiku writer: BatchRunner over the same inputs, with the same instructions and schema | BatchRunner, then `chapter_scenes.py import` |
| Script checks: valid JSON, scene count within the limit, verse ranges inside the chapter, every field filled | `chapter_scenes.py` (both writers) |
| Storage: `.local/chapter-scene-studio/scenes.sqlite3`, one row per chapter and writer; the summaries database is never written | `chapter_scenes.py` |
| Display: the Studio's side panel lists the pipelines (Summaries, Scenes); Scenes has its own settings, heading, counts and preview card, showing each writer's scenes for the chapter; a verse chip highlights its verses | [chapter_scenes_view.py](../../scripts/chapter_scenes_view.py), wired into [chapter_summary_studio.py](../../scripts/chapter_summary_studio.py) |

**Pilot chapters (12):** Genesis 22, Exodus 14, Leviticus 16, 1 Chronicles 1, 1 Samuel 17, Psalm 23, Psalm 117,
Ezekiel 1, Mark 4, John 11, Romans 8, Revelation 21. Stories, law, a list of names, two poems (one of 2 verses),
visions, Gospel scenes with Jesus, a letter.

**Full run (after the owner picks):** Qwen is $0 and about an hour of the graphics card; Haiku is quoted from the pilot's
measured cost before it runs.
