# Codex image run: the "Painterly realism" theme, drawn by headless Codex

Instructions for the agent that runs this job. Read all of it before doing anything. The owner pastes a short
block that points here; this file is the whole brief.

**Job right now: the real run (owner, 2026-11-10).** Draw every scene of every Bible chapter in the "Painterly
realism" style: 3,213 pictures, 9 already done in a trial. Verify each picture and load it into the Studio. Keep
going until all 3,213 are in the Studio or a real blocker stops you. At the trial's pace (about 2.5 minutes per
batch of 3) this is about 45 hours of running, so expect to hit a ChatGPT usage limit along the way. When that
happens, stop as section 5 says; the next start carries on from the manifest.

## 1. What this project is

A Bible study website project picks, for each of the 1,189 Bible chapters, 1 to 3 key scenes and writes a detailed
picture prompt for each (3,213 scenes, all written by Claude Haiku). The owner looks at them in a local web app, the
Chapter Summary Studio (http://127.0.0.1:8947: choose **Scenes** in the dark panel on the far left, then the
**Gallery** tab). There is one art style ("theme"), `painterly-realism`, and it is drawn by **headless Codex using
its built-in image tool on the owner's ChatGPT login**. That is this job. (Earlier styles drawn on the graphics card,
and a second scene writer, were retired on 2026-11-10; ignore any mention of them in older notes.)

Project root (run project commands from here): `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website`

| What | Where |
|---|---|
| Background and design (sections "Pictures" and "Themes and the gallery") | `initiatives/chapter-scenes/README.md` |
| The theme and its style text (`"engine": "codex"`) | `initiatives/chapter-scenes/themes.json`, entry `painterly-realism` |
| **The manifest: the 3,213 pictures to make, one entry each** | `.local/chapter-scene-studio/codex/painterly-realism/manifest.json` |
| The trial's logs, runner and notes (for reference; do not write there, do not reuse its batch folders) | `.local/chapter-scene-studio/codex/painterly-realism/trial-2026-11-10/` |
| Where each finished original goes (the entry's `output` field) | `.local/chapter-scene-studio/codex/painterly-realism/originals/<writer>/<BOOK>-<chapter>-<scene>.png` |
| Per-batch logs and reports (you create these) | `.local/chapter-scene-studio/codex/painterly-realism/batches/<batch>/` |
| Progress notes for the owner (you create and keep this) | `.local/chapter-scene-studio/codex/painterly-realism/progress.md` |
| Manifest builder, Studio import and status | `scripts/codex_pictures.py` (run with the system `python`) |
| Proof that headless Codex image generation works here | runner `D:\FortressOfSolitude\.tmp\run_headless_eden.py`; its output `D:\FortressOfSolitude\.tmp\headless-eden\` (eden.png, events.jsonl, result.txt, stderr.txt) |
| Codex's image skill (each worker reads it) | `C:\Users\lcladm\.codex\skills\.system\imagegen\SKILL.md` |
| Where Codex saves what it generates (originals, keep them) | `C:\Users\lcladm\.codex\generated_images\<thread id>\exec-*.png` |

## 2. The manifest

Built already: 3,213 entries in Bible order, batches `b001`–`b1071`, 3 each. The 9 trial pictures (Genesis 22,
Exodus 14, Leviticus 16) are `in_studio` and are skipped. Each entry:

| Field | Meaning |
|---|---|
| `id` | e.g. `haiku/GEN-22-0`: writer / book code - chapter - scene index (0-based) |
| `key`, `writer`, `scene`, `title`, `verses` | which scene this is |
| `prompt` | **the exact text to draw**: the theme's style, a blank line, `Scene: ` and the scene's prompt. Pass it unchanged |
| `sha` | the Studio's hash of that prompt; do not edit |
| `output` | the absolute path where the chosen original PNG must end up |
| `status` | `pending` → `generated` (file saved) → `verified` (you checked it) → `in_studio` (imported). Or `blocked` |
| `batch`, `attempts`, `session_id`, `artifact`, `file_sha256`, `last_error` | yours to fill: Codex thread id, the path under `.codex\generated_images`, SHA256 of the file at `output`, the latest error |

Rules for the manifest:
- Read it, change only those fields, and write it back **whole after every result** (write a temp file, then
  rename it over the old one). Never hand-edit `prompt`, `sha`, `output`, `id`.
- `python scripts/codex_pictures.py manifest --theme painterly-realism` rebuilds it safely: an unchanged entry keeps
  its run fields, and anything already in the Studio is marked `in_studio`. **Run it once at the start of the run**
  (it also picks up any scene whose prompt changed), and again only if the file is lost or damaged. Never pass
  `--pilot`.
- `python scripts/codex_pictures.py status --theme painterly-realism` counts statuses.
- Never run your own changes to the manifest while `codex_pictures.py import` is running. Run everything one step at
  a time.

## 3. How to call Codex (proven method)

Read `D:\FortressOfSolitude\.tmp\run_headless_eden.py` first; it is the exact working invocation. The trial's batch
runner, `trial-2026-11-10\runner.py` (with `watch.py`, `finalize.py`), drew and imported 5 batches cleanly with this
method. Read it, copy it into the theme folder (its paths are relative to its own folder, so it then points at the new
manifest) and reuse it if it fits this brief, or write your own batch runner (Python, standard library + Pillow,
list-form `subprocess`) in
`.local/chapter-scene-studio/codex/painterly-realism/runner.py`, modelled on it.

Executable: `C:\Users\lcladm\.vscode\extensions\openai.chatgpt-26.1021.22027-win32-x64\bin\windows-x86_64\codex.exe`.
If that folder is gone (the VS Code extension updated), use the newest
`C:\Users\lcladm\.vscode\extensions\openai.chatgpt-*-win32-x64\bin\windows-x86_64\codex.exe` and note it.

Arguments, as one list (no shell string):
```
exec --json --ignore-user-config --skip-git-repo-check
--sandbox workspace-write
-c approval_policy="never"
-c forced_login_method="chatgpt"
-c allow_login_shell=false
-c windows.sandbox="elevated"
-C D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website\.local\chapter-scene-studio\codex\painterly-realism
-o <batch folder>\result.txt
-
```
- The worker prompt goes in on **stdin**. stdout (JSONL events) goes to `<batch folder>\events.jsonl`, stderr to
  `<batch folder>\stderr.txt`. Also save the worker prompt as `<batch folder>\prompt.txt`.
- `-C` is the theme folder so the worker can write into `originals\`. Do not widen the sandbox.
- Windows: launch any shell command through `C:\Windows\System32\cmd.exe` with login off. **PowerShell is blocked by
  Bitdefender.** Do not disable antivirus, add exclusions or bypass the sandbox. The parent process needs normal
  (approved) host execution so Codex can reach the existing ChatGPT login.
- No API key and no Images API. Never set `OPENAI_API_KEY`, never use the imagegen skill's CLI fallback
  (`scripts/image_gen.py`), never let anything switch to paid API billing. Do not use the Fortress Orchestrator.
- The thread id is in the first event (`{"type":"thread.started","thread_id":...}`): store it as `session_id`. The
  generated file's original path appears in the events (the worker's copy command names
  `...\.codex\generated_images\<thread id>\exec-*.png`): store it as `artifact`.
- Each call reads about 100,000 input tokens (mostly cached) of the owner's ChatGPT plan, plus the image itself. That
  is why batches hold 3 pictures, not 1.

## 4. The worker prompt (one per batch of 3)

Fill in the three entries; keep the rest word for word.

```
You are making 3 pictures for a Bible study project, one native image-generation call per picture. First read and
follow C:\Users\lcladm\.codex\skills\.system\imagegen\SKILL.md and use its built-in image_gen tool (default mode).
Never use its CLI fallback, an API key, or the Images API. Never reuse existing images, stock images, SVG or images
drawn with code. Do not install anything or start other agents. Use cmd.exe with login off for shell commands;
PowerShell is blocked on this machine. Write only inside your working directory.

For each picture below, in order:
1. Call the image tool once with the PROMPT exactly as given. Ask for a wide landscape picture, 16:9 if the tool
   allows it, otherwise its widest landscape size. No text, letters, captions, signatures or watermarks in the
   picture.
2. As soon as it is generated, copy the generated file (keep the original where the tool saved it) to the OUTPUT path
   with cmd.exe `copy /B`, creating the folder first with `mkdir` if needed. Do this before starting the next
   picture.
3. If a call fails, retry that picture once. If it fails again, report the exact error and move on.

At the end, report for each picture: ID, OUTPUT path, the original generated file's full path, and done or failed
with the exact error.

PICTURE 1
ID: <id>
OUTPUT: <output>
PROMPT:
<prompt>

PICTURE 2
...

PICTURE 3
...
```

## 5. The loop

1. **Reconcile first** (every start and restart). For every entry: if `output` exists, decodes and is not yet
   `verified`/`in_studio`, mark it `generated` and verify it (step 4) instead of drawing it again. Make sure no
   earlier Codex worker of this run is still running (check its batch folder and the process list) before
   drawing anything; never start a second attempt at a picture while an earlier attempt might still produce it.
2. **Pick the next batch**: the lowest batch id with an entry that is `pending` (or `generated` but failed
   verification). Draw only the entries that still need it. One batch at a time; one worker at a time.
3. **Run the worker** with a finite deadline: about 900 seconds for 3 pictures (pictures take 1-4 minutes each). While
   it runs, watch for files appearing at the `output` paths and mark each `generated` as soon as it appears (and
   write the manifest). If the deadline passes, end only that worker's process tree and keep what it saved.
4. **Verify each new file yourself**, independently of what the worker reported:
   - it exists, is not empty, and opens as an image with Pillow (`Image.open(...).verify()`, then reopen and load);
   - it is landscape (width greater than height) and at least 1024 pixels wide; record the actual size;
   - record its SHA256 in `file_sha256`;
   - **look at it** (open the image) and check it agrees with the entry's `title` and `prompt`: the right event and
     people, the painterly style, no text or watermark, nothing grossly wrong (extra limbs, melted faces, a blank or
     unrelated picture). Note one line per picture in the batch report.
   Pass → `verified`. Fail → back to `pending`, `attempts` + 1, `last_error` saying what was wrong.
5. **Import into the Studio** after each batch: `python scripts/codex_pictures.py import --theme painterly-realism`.
   It center-crops each verified picture to 16:9 and saves 1344 x 768 WebP plus a 480 x 270 small copy under
   `.local/chapter-scene-studio/pictures/painterly-realism/`, records it in the database, and sets `in_studio`.
   If it prints "not imported", read the reason and fix the cause (for example a stale `file_sha256`).
6. **Write the batch report** (`<batch folder>\report.md`: each picture, status, size, SHA256, spot-check line) and
   append a line to `progress.md`.
7. **Go straight to the next batch.** Do not stop after launching a process or after the first batch.

Retries: an entry gets at most 3 attempts in total; after that set `blocked` with the reason and move on to other
entries. A transient failure (timeout, network) waits 60 seconds, then 120, then 240 before the next try. **Stop the
whole run at once, without retrying,** on: a login or authentication error, the image tool being unavailable, a
permissions/sandbox refusal, or a usage-limit/quota message. Record the exact message in `progress.md` and report it.

## 6. Never

- Never change code in `scripts/`, `themes.json`, the scenes, or the database by hand (the import script is the only
  writer of pictures into the Studio).
- Never delete or overwrite verified originals, anything under `.codex\generated_images`, or other themes' pictures.
- Never run `scripts/chapter_pictures.py` (the graphics-card maker; it refuses this theme anyway) or
  `scripts/chapter_scenes.py`.
- Never stop the Studio, HyperQwen, Docker or any process that is not a worker you started in this run.
- Never change global Codex settings (`~\.codex\config.toml`), git state (no commit, push, stash, reset), or publish
  anything.

## 7. When finished

Report: verified and imported / 3,213, any `blocked` entries with their reasons, total attempts, and these paths:
- originals: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website\.local\chapter-scene-studio\codex\painterly-realism\originals\`
- manifest: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website\.local\chapter-scene-studio\codex\painterly-realism\manifest.json`
- progress: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website\.local\chapter-scene-studio\codex\painterly-realism\progress.md`

Then tell the owner where to look: the Studio at http://127.0.0.1:8947 → **Scenes** → **Gallery**, theme **Painterly
realism** in the side panel (it shows the count drawn); **Finished** shows only drawn pictures and **▶ Speed run**
steps through them.
