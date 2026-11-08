#!/usr/bin/env python3
"""Pictures for the key scenes, per theme (art style): FLUX.3 Image Klein on this PC's graphics card, one wide picture
per scene and theme, plus a small copy for the gallery. Store and themes: scene_pictures.py.
Docs: initiatives/chapter-scenes/README.md (sections Pictures; Themes and the gallery).

Run with the image environment, not the system Python (the Studio's Make pictures button does this):
  .local/flux3-venv/Scripts/python.exe scripts/chapter_pictures.py [--theme=ID] [--keys GEN:22,1SA:17] [--limit N]
Without --theme every theme is drawn, in themes.json order. A fresh picture is skipped, so a stopped run resumes.
One run at a time (lock file). While it holds the lock it keeps pictures/.run.json current for the Studio.

Speed: the text reader and the image model never share the card. Per chunk of 100 scenes the text reader reads every
prompt, steps off the card, then the image model draws them all: 6.3 s a picture, 14.4 GiB at most (2026-11-07).
"""
from __future__ import annotations

import argparse
import json
import msvcrt
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import chapter_scenes
import scene_pictures

MODEL = Path("F:/intelligence models/FLUX.3-image-klein")
CHUNK = 100
MIN_FREE_GIB = 16  # the image model peaks at 14.4 GiB; the local language model may hold the card
MAX_FAILURES_IN_A_ROW = 3


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Status:
    """pictures/.run.json, rewritten whole (temp file + rename) on every change, so the Studio never reads half."""

    def __init__(self, pictures: scene_pictures.Pictures, themes: list[str], total: int):
        self.path = pictures.dir / ".run.json"
        names = {t["id"]: t["name"] for t in pictures.themes}
        self.data = {"pid": os.getpid(), "themes": themes, "theme_names": [names[t] for t in themes], "total": total,
                     "done": 0, "failed": 0, "state": "running", "message": "Reading the prompts…",
                     "started_at": now(), "updated_at": now()}
        self.write()

    def write(self, **changes) -> None:
        self.data.update(changes, updated_at=now())
        temp = self.path.with_name(f".run.{os.getpid()}.tmp")
        temp.write_text(json.dumps(self.data, ensure_ascii=False), encoding="utf-8")
        os.replace(temp, self.path)


def looks_blank(image) -> bool:
    """A failed run can return a flat black or grey frame; a real picture has far more contrast than this."""
    from PIL import ImageStat
    return max(ImageStat.Stat(image.convert("RGB")).stddev) < 4


def take_lock(pictures: scene_pictures.Pictures):
    """Holds a byte lock on pictures/.lock for the life of the process; Windows releases it if the process dies. The
    Studio probes the same byte for a moment to see whether a run is going, so a few retries cover that."""
    pictures.dir.mkdir(parents=True, exist_ok=True)
    handle = open(pictures.dir / ".lock", "a+", encoding="utf-8")
    for _ in range(10):
        handle.seek(0)
        try:
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            return handle
        except OSError:
            time.sleep(0.2)
    sys.exit(f"Another picture run holds {pictures.dir / '.lock'}; wait for it to finish.")


def write_thumb(image, path: Path) -> None:
    from PIL import Image
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.stem}.{os.getpid()}.tmp")
    image.convert("RGB").resize(scene_pictures.THUMB_SIZE, Image.LANCZOS).save(temp, "WEBP", quality=82)
    os.replace(temp, path)


def backfill_thumbs(pictures: scene_pictures.Pictures) -> int:
    """Small copies for fresh pictures that have none (pictures made before the gallery existed)."""
    from PIL import Image
    made = 0
    for state in pictures.states():
        args = (state["theme"], state["key"], state["writer"], state["scene"])
        thumb = pictures.dir / scene_pictures.picture_name(*args, thumb=True)
        if state["fresh"] and not thumb.is_file():
            with Image.open(pictures.dir / scene_pictures.picture_name(*args)) as image:
                write_thumb(image, thumb)
            made += 1
    return made


def save(image, pictures: scene_pictures.Pictures, job: dict, seconds: float) -> None:
    """Files first (temp name in the same folder, then a rename), then the row: a crash in between only costs a redo."""
    args = (job["theme"], job["key"], job["writer"], job["scene"])
    path = pictures.dir / scene_pictures.picture_name(*args)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.stem}.{os.getpid()}.tmp")
    image.save(temp, "WEBP", quality=90)
    os.replace(temp, path)
    write_thumb(image, pictures.dir / scene_pictures.picture_name(*args, thumb=True))
    pictures.save(theme=job["theme"], key=job["key"], writer=job["writer"], scene=job["scene"], sha=job["sha"],
                  seed=scene_pictures.seed_for(job["key"], job["writer"], job["scene"]), seconds=round(seconds, 1),
                  made_at=now())


def load_pipelines(torch):
    """The text reader and the image model as two pipelines (FLUX.3's own blocks, without its prompt rewriter), both
    parked in system memory. Same output as the one-piece pipeline: pixel-identical on a test scene."""
    from diffusers.modular_pipelines import Flux3DistilledAutoBlocks
    from diffusers.utils import logging as diffusers_logging
    diffusers_logging.disable_progress_bar()  # one log line per picture; the Studio shows the last one
    text = Flux3DistilledAutoBlocks().sub_blocks["text_encoder"].init_pipeline(str(MODEL))
    text.load_components(dtype={"default": torch.bfloat16})
    draw_blocks = Flux3DistilledAutoBlocks()
    for name in ("prompt_upsampler", "text_encoder", "vae_encoder"):
        draw_blocks.sub_blocks.pop(name)
    draw = draw_blocks.init_pipeline(str(MODEL))
    draw.load_components(dtype={"vae": torch.float32, "default": torch.bfloat16})
    draw.set_progress_bar_config(disable=True)
    return text, draw


def need_card(torch) -> None:
    free = torch.cuda.mem_get_info()[0] / 2**30
    if free < MIN_FREE_GIB:
        sys.exit(f"The graphics card has {free:.1f} GiB free and {MIN_FREE_GIB} GiB is needed. Stop HyperQwen or other "
                 "model servers, then press Make pictures again (finished pictures are kept).")


def read_prompts(torch, text, chunk: list[dict]) -> list:
    need_card(torch)
    text.to("cuda")
    try:
        return [text(prompt=job["text"], output="prompt_embeds").to("cpu") for job in chunk]
    finally:
        text.to("cpu")
        torch.cuda.empty_cache()


def draw_one(torch, draw, embeds, job: dict):
    seed = scene_pictures.seed_for(job["key"], job["writer"], job["scene"])
    return draw(prompt_embeds=embeds.to("cuda"), width=scene_pictures.WIDTH, height=scene_pictures.HEIGHT,
                num_inference_steps=scene_pictures.STEPS, generator=torch.Generator().manual_seed(seed),
                output="images")[0]


def draw_chunk(torch, draw, chunk, embeds, start, pictures, status) -> None:
    for number, (job, embed) in enumerate(zip(chunk, embeds), start + 1):
        where = f"[{number}/{status.data['total']}] {job['theme']} {job['key']} {job['writer']} scene {job['scene'] + 1}"
        began = time.time()
        try:
            image = draw_one(torch, draw, embed, job)
            problem = "came out blank" if looks_blank(image) else None
        except torch.OutOfMemoryError as exc:
            torch.cuda.empty_cache()
            problem = f"ran out of graphics memory ({exc})"
        if problem:
            status.write(failed=status.data["failed"] + 1, failures_in_a_row=status.data.get("failures_in_a_row", 0) + 1)
            print(f"{where}: {problem}; not saved", flush=True)
            if status.data["failures_in_a_row"] >= MAX_FAILURES_IN_A_ROW:
                sys.exit(f"Stopped after {MAX_FAILURES_IN_A_ROW} failures in a row ({problem}).")
            continue
        save(image, pictures, job, time.time() - began)
        status.write(done=status.data["done"] + 1, failures_in_a_row=0,
                     message=f"Drew {job['key']} ({job['writer']}), scene {job['scene'] + 1}")
        print(f"{where}: {time.time() - began:.1f}s", flush=True)


def run(jobs: list[dict], pictures: scene_pictures.Pictures, status: Status) -> None:
    import torch
    text, draw = load_pipelines(torch)
    for start in range(0, len(jobs), CHUNK):
        chunk = jobs[start:start + CHUNK]
        status.write(message=f"Reading prompts {start + 1}–{start + len(chunk)}…")
        embeds = read_prompts(torch, text, chunk)
        need_card(torch)
        draw.to("cuda")
        try:
            draw_chunk(torch, draw, chunk, embeds, start, pictures, status)
        finally:
            draw.to("cpu")
            torch.cuda.empty_cache()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--theme", help="only this theme (an id from themes.json; default: every theme)")
    parser.add_argument("--keys", default="", help="comma-separated chapters such as GEN:22,1SA:17 (default: all)")
    parser.add_argument("--limit", type=int, default=0, help="make at most this many pictures")
    args = parser.parse_args()
    pictures = scene_pictures.Pictures()
    themes = [pictures.theme(args.theme)["id"]] if args.theme else pictures.ids
    keys = {k.strip() for k in args.keys.split(",") if k.strip()}
    unknown = keys - set(chapter_scenes.all_keys())
    if unknown:
        sys.exit(f"Unknown chapters {sorted(unknown)}; expected keys such as GEN:22")
    lock = take_lock(pictures)
    for stale in pictures.dir.rglob("*.tmp"):
        stale.unlink()
    print(f"Small copies made for {backfill_thumbs(pictures)} earlier pictures.", flush=True)
    jobs = [j for j in pictures.pending(themes) if not keys or j["key"] in keys]
    jobs = jobs[:args.limit] if args.limit else jobs
    status = Status(pictures, themes, len(jobs))
    print(f"{len(jobs)} pictures to make for {', '.join(themes)} ({scene_pictures.RECIPE}).", flush=True)
    try:
        if jobs:
            run(jobs, pictures, status)
        status.write(state="finished", message=f"Finished: {status.data['done']} pictures made"
                     + (f", {status.data['failed']} failed." if status.data["failed"] else "."))
    except SystemExit as exc:
        status.write(state="stopped", message=str(exc.code))
        raise
    except BaseException as exc:
        status.write(state="stopped", message=f"Stopped by an error: {type(exc).__name__}: {exc}")
        raise
    finally:
        print(status.data["message"], flush=True)
        lock.close()


if __name__ == "__main__":
    main()
