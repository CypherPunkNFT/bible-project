#!/usr/bin/env python3
"""Build the meaning-search pack (MeaningPack/site/) that visitors' browsers download once (see ../MEANING_SEARCH.md).

On this PC, $0: fingerprints ("embeddings") for every published study and every World English Bible verse, made with
IBM granite-embedding-small-english-r2 (Apache 2.0), the same model the browser runs on questions. Plus the browser's
copy of that model (onnx-community int8 build) and the plain ONNX Runtime engine. Files over 24 MiB are split into parts,
because Cloudflare Pages refuses files over 25 MiB; src/lib/meaning/engine.ts reassembles them.

  D:/Python/python.exe scripts/build-meaning-pack.py        # needs sentence-transformers, huggingface_hub; GPU optional

Output: MeaningPack/site/meaning.json (manifest: version, files, demo) and MeaningPack/site/<version>/... (immutable).
"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

import numpy as np

WEBSITE = Path(__file__).resolve().parents[1]
PACK = WEBSITE.parent / "MeaningPack" / "site"
STUDIES = WEBSITE / "content" / "apologetics" / "studies"
BIBLE = WEBSITE / "data" / "plain" / "web"
CATALOG = WEBSITE / "data" / "catalog.json"
ORT_DIST = WEBSITE / "node_modules" / "onnxruntime-web" / "dist"

MODEL = "ibm-granite/granite-embedding-small-english-r2"  # documents (PyTorch, full precision)
MODEL_REVISION = None  # resolved and recorded in the manifest
BROWSER_MODEL = "onnx-community/granite-embedding-small-english-r2-ONNX"  # questions (browser, int8)
BROWSER_FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json",
                 "onnx/model_quantized.onnx", "onnx/model_quantized.onnx_data"]
ENGINE_FILES = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]
PART_SIZE = 24 * 1024 * 1024
DIMENSIONS = 384
DEMO_QUESTIONS = ["I keep doubting whether I am really saved", "who picked what went into scripture", "I pray and feel nothing, where is he"]  # meaning finds these first; keyword search misses (2026-10-06 test)


def plain(value) -> str:
    """Study fields are strings or {text: ...} records with citations; keep the words."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(plain(value[k]) for k in ("title", "text") if k in value)
    if isinstance(value, list):
        return "\n".join(plain(v) for v in value)
    return ""


def load_studies() -> list[tuple[str, str]]:
    studies = []
    for path in sorted(STUDIES.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        if record.get("publication") != "published":
            continue
        content = record["content"]
        text = "\n".join(plain(content[k]) for k in ("title", "summary", "answer", "reasoning", "conclusion", "sections", "objection", "reply"))
        studies.append((record["id"], text))
    if not studies:
        raise SystemExit(f"meaning-pack: no published studies in {STUDIES}")
    return studies


def load_bible() -> list[tuple[str, str]]:
    """World English Bible verses in canonical book order, as ("GEN 1:1", text)."""
    order = [book["code"] for book in json.loads(CATALOG.read_text(encoding="utf-8"))["books"]]
    verses = []
    for code in order:
        path = BIBLE / f"{code}.json"
        if path.exists():
            verses += [(f"{code} {ref}", text) for ref, text in json.loads(path.read_text(encoding="utf-8")).items() if text.strip()]
    if len(verses) < 30000:
        raise SystemExit(f"meaning-pack: only {len(verses)} WEB verses in {BIBLE}; expected about 31,100 (run scripts/build-data.py)")
    return verses


def to_int8(vectors: np.ndarray) -> bytes:
    """Unit vectors (-1..1 per number) as one signed byte each; the browser divides by 127."""
    return np.clip(np.round(vectors * 127), -127, 127).astype(np.int8).tobytes()


def write_split(data: bytes, target: Path) -> list[dict]:
    """Write `data` as target, or as target.part000, .part001 ... when over PART_SIZE."""
    target.parent.mkdir(parents=True, exist_ok=True)
    if len(data) <= PART_SIZE:
        target.write_bytes(data)
        return [{"path": target.name, "size": len(data)}]
    parts = []
    for index in range(0, len(data), PART_SIZE):
        part = target.with_name(f"{target.name}.part{index // PART_SIZE:03d}")
        part.write_bytes(data[index:index + PART_SIZE])
        parts.append({"path": part.name, "size": part.stat().st_size})
    return parts


def embed(model, texts: list[str], batch: int) -> np.ndarray:
    return model.encode(texts, batch_size=batch, normalize_embeddings=True, show_progress_bar=True, convert_to_numpy=True).astype(np.float32)


def fetch_browser_model(stage: Path) -> tuple[list[dict], str]:
    from huggingface_hub import HfApi, hf_hub_download

    revision = HfApi().model_info(BROWSER_MODEL).sha
    files = []
    for name in BROWSER_FILES:
        local = Path(hf_hub_download(BROWSER_MODEL, name, revision=revision))
        files.append({"name": f"model/{name}", "parts": write_split(local.read_bytes(), stage / "model" / name)})
    return files, revision


def build() -> None:
    import torch
    from sentence_transformers import SentenceTransformer

    studies, verses = load_studies(), load_bible()
    model = SentenceTransformer(MODEL, device="cuda" if torch.cuda.is_available() else "cpu")
    study_vectors = embed(model, [text for _, text in studies], batch=4)
    verse_vectors = embed(model, [text for _, text in verses], batch=256)
    question_vectors = embed(model, DEMO_QUESTIONS, batch=8)
    demo = [{"question": q, "studies": [studies[j][0] for j in np.argsort(-(study_vectors @ v))[:3]]} for q, v in zip(DEMO_QUESTIONS, question_vectors)]

    stage = PACK / "staging"
    shutil.rmtree(stage, ignore_errors=True)
    files, browser_revision = fetch_browser_model(stage)
    for name in ENGINE_FILES:
        files.append({"name": f"engine/{name}", "parts": write_split((ORT_DIST / name).read_bytes(), stage / "engine" / name)})
    data = {
        "studies.i8": to_int8(study_vectors), "studies.json": json.dumps([sid for sid, _ in studies]).encode(),
        "bible-web.i8": to_int8(verse_vectors), "bible-web.json": json.dumps({"ids": [vid for vid, _ in verses], "text": [t for _, t in verses]}, ensure_ascii=False).encode(),
    }
    for name, payload in data.items():
        files.append({"name": f"index/{name}", "parts": write_split(payload, stage / "index" / name)})

    digest = hashlib.sha256()
    for path in sorted(stage.rglob("*")):
        if path.is_file():
            digest.update(path.relative_to(stage).as_posix().encode())
            digest.update(path.read_bytes())
    version = digest.hexdigest()[:12]
    final = PACK / version
    if final.exists():
        shutil.rmtree(stage)
    else:
        stage.rename(final)
    manifest = {
        "version": version, "dimensions": DIMENSIONS, "model": MODEL, "browserModel": BROWSER_MODEL, "browserModelRevision": browser_revision,
        "pooling": "cls", "counts": {"studies": len(studies), "bibleVerses": len(verses)}, "bible": "web",
        "bytes": sum(part["size"] for f in files for part in f["parts"]), "files": files, "demo": demo,
    }
    partial = PACK / "meaning.json.partial"
    partial.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    partial.replace(PACK / "meaning.json")  # the manifest switches last
    print(f"meaning-pack: {version}: {len(studies)} studies, {len(verses)} verses, {manifest['bytes'] / 1e6:.1f} MB -> {final}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    build()
