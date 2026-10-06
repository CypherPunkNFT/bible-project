#!/usr/bin/env python3
"""Does meaning search find the right study for everyday questions? Scores a model on 25 paraphrased questions.

Run: D:/Python/python.exe scripts/search-eval/meaning-quality.py BAAI/bge-small-en-v1.5   (needs sentence-transformers)
Results 2026-10-06 and the proposal they support: ../MEANING_SEARCH.md (project root).
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

STUDIES_DIR = Path("D:/FortressOfSolitude/Jarvis/Projects/BibleProject/Website/content/apologetics/studies")
QUESTIONS = {
    "assurance": "I keep doubting whether I am really saved",
    "canon": "who picked what went into scripture",
    "church-harm": "christians have hurt so many people over the centuries",
    "contradictions": "the gospel accounts disagree with each other",
    "conversation": "how do I talk about my faith without starting a fight",
    "covenant": "how do the old and new testaments fit together",
    "cross": "why did jesus have to die",
    "election": "if god already picked who gets saved why bother evangelizing",
    "god": "father son and holy spirit are they one or three",
    "grace": "if I am saved by faith can I just live however I want",
    "hiddenness": "I pray and feel nothing, where is he",
    "islam-cross": "muslims say jesus was never crucified",
    "islam-jesus": "is the quran's isa the same person as the jesus of the gospels",
    "islam-trinity": "explaining three persons in one god to my muslim friend",
    "jesus": "was he only a wise moral man",
    "manuscripts": "hasn't the text been altered by copyists over the centuries",
    "miracles": "are supernatural events possible in a world run by natural laws",
    "morality": "atheists can be kind and honest people too",
    "reformed": "what do calvinists believe",
    "resurrection": "did he truly come back to life after the tomb",
    "science": "evolution and physics explain everything now",
    "scripture": "why should I trust an ancient book",
    "secular": "living as a believer in a non-religious culture",
    "suffering": "why do innocent children get cancer",
    "why-anything": "where did the universe come from in the first place",
}


def plain(value) -> str:
    """Study fields are strings or {text: ...} records (with citations); keep the words."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(plain(value[k]) for k in ("title", "text") if k in value)
    if isinstance(value, list):
        return "\n".join(plain(v) for v in value)
    return ""


def study_text(content: dict) -> str:
    return "\n".join(plain(content[k]) for k in ("title", "summary", "answer", "reasoning", "conclusion", "sections", "objection", "reply"))


def score(ranked: list[list[str]]) -> dict:
    ids = list(QUESTIONS)
    first = sum(r[0] == i for r, i in zip(ranked, ids))
    top3 = sum(i in r[:3] for r, i in zip(ranked, ids))
    mrr = sum(1 / (r.index(i) + 1) for r, i in zip(ranked, ids)) / len(ids)
    return {"first": f"{first}/25", "top3": f"{top3}/25", "mrr": round(mrr, 2)}


def main() -> None:
    studies = {}
    for f in STUDIES_DIR.glob("*.json"):
        d = json.loads(f.read_text(encoding="utf-8"))
        studies[d["id"]] = study_text(d["content"])
    ids = list(studies)
    model_name = sys.argv[1]
    q_prefix = d_prefix = ""
    if "e5" in model_name:
        q_prefix, d_prefix = "query: ", "passage: "
    if "bge" in model_name:
        q_prefix = "Represent this sentence for searching relevant passages: "
    big = any(k in model_name for k in ("4B", "0.6B", "0.6b", "gemma", "270m", "nano"))
    model = SentenceTransformer(model_name, device=os.environ.get("EVAL_DEVICE") or ("cuda" if big else "cpu"), trust_remote_code=True)  # EVAL_DEVICE=cpu overrides
    # Models that ship their own question/passage instructions (Qwen3, Harrier, EmbeddingGemma, Arctic, ...) use them.
    prompts = getattr(model, "prompts", {}) or {}
    q_kw = {"prompt_name": next(n for n in ("query", "search_query", "retrieval_query") if n in prompts)} if any(n in prompts for n in ("query", "search_query", "retrieval_query")) else {}
    d_name = next((n for n in ("document", "passage", "search_document", "retrieval_document") if n in prompts), None)
    d_kw = {"prompt_name": d_name} if d_name else {}
    docs = model.encode([d_prefix + studies[i] for i in ids], normalize_embeddings=True, **d_kw)
    queries = model.encode([q_prefix + q for q in QUESTIONS.values()], normalize_embeddings=True, **q_kw)
    sims = queries @ docs.T
    ranked = [[ids[j] for j in np.argsort(-row)] for row in sims]
    misses = [f"{i} -> {r[0]}" for r, i in zip(ranked, QUESTIONS) if r[0] != i]
    print(json.dumps({"model": model_name, **score(ranked), "misses": misses}))


if __name__ == "__main__":
    main()
