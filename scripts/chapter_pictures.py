#!/usr/bin/env python3
"""Pictures for the key scenes: FLUX.3 Image Klein on this PC's graphics card, one wide picture per scene, stored beside
the scenes (pictures table + .local/chapter-scene-studio/pictures/<writer>/<CODE>-<N>-<index>.webp).
Docs: initiatives/chapter-scenes/README.md.

Run with the image environment, not the system Python:
  .local/flux3-venv/Scripts/python.exe scripts/chapter_pictures.py [--keys GEN:22,1SA:17] [--writer haiku] [--limit N]
A scene whose picture matches its current prompt is skipped, so a stopped run resumes. One run at a time (lock file).

Speed: the text reader and the image model never share the card. Per chunk of 100 scenes the text reader reads every
prompt, steps off the card, then the image model draws them all: 6.3 s a picture, 14.4 GiB at most (2026-11-07).
"""
from __future__ import annotations

import argparse
import hashlib
import msvcrt
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import chapter_scenes

MODEL = Path("F:/intelligence models/FLUX.3-image-klein")
CHUNK = 100
MIN_FREE_GIB = 16  # the image model peaks at 14.4 GiB; the local language model may hold the card
MAX_FAILURES_IN_A_ROW = 3


@dataclass(frozen=True)
class Job:
    key: str
    writer: str
    scene: int
    prompt: str
    sha: str

    @property
    def seed(self) -> int:
        return seed_for(self.key, self.writer, self.scene)


def seed_for(key: str, writer: str, scene: int) -> int:
    """The same scene always gets the same seed, so a remade picture changes only when its prompt or recipe does."""
    return int.from_bytes(hashlib.sha256(f"{key}|{writer}|{scene}".encode("utf-8")).digest()[:4], "big")


def looks_blank(image) -> bool:
    """A failed run can return a flat black or grey frame; a real picture has far more contrast than this."""
    from PIL import ImageStat
    return max(ImageStat.Stat(image.convert("RGB")).stddev) < 4


def take_lock(store: chapter_scenes.Store):
    """Holds a byte lock on pictures/.lock for the life of the process; Windows releases it if the process dies."""
    store.pictures_dir.mkdir(parents=True, exist_ok=True)
    handle = open(store.pictures_dir / ".lock", "a+", encoding="utf-8")
    handle.seek(0)
    try:
        msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
    except OSError:
        sys.exit(f"Another chapter_pictures run holds {store.pictures_dir / '.lock'}; wait for it to finish.")
    return handle


def jobs_to_do(store: chapter_scenes.Store, keys: set[str], writers: set[str], limit: int) -> list[Job]:
    jobs = [Job(*row) for row in store.pending_pictures()
            if (not keys or row[0] in keys) and (not writers or row[1] in writers)]
    return jobs[:limit] if limit else jobs


def save(image, store: chapter_scenes.Store, job: Job, seconds: float) -> None:
    """File first (temp name in the same folder, then a rename), then the row: a crash in between only costs a redo."""
    path = store.pictures_dir / chapter_scenes.picture_name(job.key, job.writer, job.scene)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.stem}.{os.getpid()}.tmp")
    image.save(temp, "WEBP", quality=90)
    os.replace(temp, path)
    store.save_picture(job.key, job.writer, job.scene, job.sha, job.seed, round(seconds, 1),
                       datetime.now(timezone.utc).isoformat(timespec="seconds"))


def load_pipelines(torch):
    """The text reader and the image model as two pipelines (FLUX.3's own blocks, without its prompt rewriter), both
    parked in system memory. Same output as the one-piece pipeline: pixel-identical on a test scene."""
    from diffusers.modular_pipelines import Flux3DistilledAutoBlocks
    text = Flux3DistilledAutoBlocks().sub_blocks["text_encoder"].init_pipeline(str(MODEL))
    text.load_components(dtype={"default": torch.bfloat16})
    draw_blocks = Flux3DistilledAutoBlocks()
    for name in ("prompt_upsampler", "text_encoder", "vae_encoder"):
        draw_blocks.sub_blocks.pop(name)
    draw = draw_blocks.init_pipeline(str(MODEL))
    draw.load_components(dtype={"vae": torch.float32, "default": torch.bfloat16})
    return text, draw


def need_card(torch) -> None:
    free = torch.cuda.mem_get_info()[0] / 2**30
    if free < MIN_FREE_GIB:
        sys.exit(f"The graphics card has {free:.1f} GiB free; {MIN_FREE_GIB} GiB needed. Stop HyperQwen or other "
                 "model servers and run again (finished pictures are kept).")


def read_prompts(torch, text, chunk: list[Job]) -> list:
    need_card(torch)
    text.to("cuda")
    try:
        return [text(prompt=job.prompt, output="prompt_embeds").to("cpu") for job in chunk]
    finally:
        text.to("cpu")
        torch.cuda.empty_cache()


def draw_one(torch, draw, embeds, job: Job):
    return draw(prompt_embeds=embeds.to("cuda"), width=chapter_scenes.PICTURE_WIDTH,
                height=chapter_scenes.PICTURE_HEIGHT, num_inference_steps=chapter_scenes.PICTURE_STEPS,
                generator=torch.Generator().manual_seed(job.seed), output="images")[0]


def run(jobs: list[Job], store: chapter_scenes.Store) -> None:
    import torch
    text, draw = load_pipelines(torch)
    failures = made = 0
    for start in range(0, len(jobs), CHUNK):
        chunk = jobs[start:start + CHUNK]
        embeds = read_prompts(torch, text, chunk)
        need_card(torch)
        draw.to("cuda")
        try:
            for number, (job, embed) in enumerate(zip(chunk, embeds), start + 1):
                where = f"[{number}/{len(jobs)}] {job.key} {job.writer} scene {job.scene + 1}"
                began = time.time()
                try:
                    image = draw_one(torch, draw, embed, job)
                    problem = "came out blank" if looks_blank(image) else None
                except torch.OutOfMemoryError as exc:
                    torch.cuda.empty_cache()
                    problem = f"ran out of graphics memory ({exc})"
                if problem:
                    failures += 1
                    print(f"{where}: {problem}; not saved", flush=True)
                    if failures >= MAX_FAILURES_IN_A_ROW:
                        sys.exit(f"Stopped after {failures} failures in a row; {made} pictures made this run.")
                    continue
                failures = 0
                save(image, store, job, time.time() - began)
                made += 1
                print(f"{where}: {time.time() - began:.1f}s", flush=True)
        finally:
            draw.to("cpu")
            torch.cuda.empty_cache()
    print(f"Done: {made} pictures made.", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--keys", default="", help="comma-separated chapters such as GEN:22,1SA:17 (default: all)")
    parser.add_argument("--writer", choices=["haiku", "qwen"], help="only this writer's scenes (default: both)")
    parser.add_argument("--limit", type=int, default=0, help="make at most this many pictures")
    args = parser.parse_args()
    store = chapter_scenes.Store()
    keys = {k.strip() for k in args.keys.split(",") if k.strip()}
    unknown = keys - set(chapter_scenes.all_keys())
    if unknown:
        sys.exit(f"Unknown chapters {sorted(unknown)}; expected keys such as GEN:22")
    lock = take_lock(store)
    for stale in store.pictures_dir.rglob("*.tmp"):
        stale.unlink()
    jobs = jobs_to_do(store, keys, {args.writer} if args.writer else set(), args.limit)
    print(f"{len(jobs)} pictures to make ({chapter_scenes.RECIPE}).", flush=True)
    if jobs:
        run(jobs, store)
    lock.close()


if __name__ == "__main__":
    main()
