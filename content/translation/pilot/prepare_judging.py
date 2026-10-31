"""Reads both translators' answers, runs the mechanical checks, and writes the blind judge items (A and B in random
order, the key kept in judge-key.json). Writes checks.json. Run after haiku-<lang>/ and qwen-<lang>/ are complete."""
import json
import random
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
LANGUAGES = {"es": "Spanish (Latin America and the United States)", "pt": "Brazilian Portuguese"}
TRANSLATORS = ("haiku", "qwen")


def answer_text(path: Path) -> str:
    record = json.loads(path.read_text("utf-8"))
    return record.get("result") or ""


def parse(text: str) -> dict | None:
    # strict=False: a raw line break inside a value (Haiku does this in long creeds) is still a usable answer.
    text = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", text.strip())
    try:
        value = json.loads(text, strict=False)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        try:
            value = json.loads(text[start:end + 1], strict=False) if start >= 0 else None
        except json.JSONDecodeError:
            return None
    return value if isinstance(value, dict) else None


def check(english: dict, translated: dict | None) -> list[str]:
    if translated is None:
        return ["answer is not a JSON object"]
    problems = []
    missing = [key for key in english if key not in translated]
    if missing:
        problems.append(f"missing keys: {', '.join(missing[:6])}")
    for key, source in english.items():
        target = translated.get(key)
        if not isinstance(target, str):
            continue
        # Catalogue ids and titles of English works stay in English by the task's own rule.
        kept_on_purpose = key.endswith(".id") or re.fullmatch(r"work\d+\.title", key)
        if not kept_on_purpose and len(re.findall(r"[A-Za-z]+", source)) >= 4 and target.strip() == source.strip():
            problems.append(f"{key}: left in English")
        if source.count("\n") != target.count("\n"):
            problems.append(f"{key}: {source.count(chr(10)) + 1} lines became {target.count(chr(10)) + 1}")
        lost = set(re.findall(r"\d+", source)) - set(re.findall(r"\d+", target))
        if lost:
            problems.append(f"{key}: numbers lost {sorted(lost)[:4]}")
    return problems


if __name__ == "__main__":
    rng = random.Random(7)
    items = sorted((HERE / "items").glob("*.txt"))
    judge_dir = HERE / "judge-items"
    judge_dir.mkdir(exist_ok=True)
    checks, key = {}, {}
    for language, language_name in LANGUAGES.items():
        for item in items:
            english = json.loads(item.read_text("utf-8"))
            answers = {}
            for translator in TRANSLATORS:
                path = HERE / f"{translator}-{language}" / f"{item.stem}.json"
                if not path.exists():
                    raise SystemExit(f"{path} is missing: finish the {translator} {language} run first")
                answers[translator] = parse(answer_text(path))
                checks[f"{item.stem}|{language}|{translator}"] = check(english, answers[translator])
            order = list(TRANSLATORS)
            rng.shuffle(order)
            name = f"{item.stem}-{language}"
            key[name] = {"A": order[0], "B": order[1]}
            shown = {label: answers[translator] if answers[translator] is not None else "(no usable answer)" for label, translator in zip("AB", order)}
            text = (f"Target language: {language_name}\n\nEnglish source:\n{json.dumps(english, ensure_ascii=False, indent=1)}\n\n"
                    f"Translation A:\n{json.dumps(shown['A'], ensure_ascii=False, indent=1)}\n\nTranslation B:\n{json.dumps(shown['B'], ensure_ascii=False, indent=1)}\n")
            (judge_dir / f"{name}.txt").write_text(text, "utf-8", newline="\n")
    (HERE / "judge-key.json").write_text(json.dumps(key, indent=1), "utf-8")
    (HERE / "checks.json").write_text(json.dumps(checks, ensure_ascii=False, indent=1), "utf-8")
    for language in LANGUAGES:
        for translator in TRANSLATORS:
            flagged = [name for name, problems in checks.items() if name.endswith(f"|{language}|{translator}") and problems]
            print(f"{language} {translator}: {len(flagged)} of {len(items)} items with a mechanical problem")
    print(len(key), "judge items written")
