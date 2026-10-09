"""Stage candidate archive.org volumes: metadata JSON + existing full text (_djvu.txt).

Resumable: skips any file already present. Stops on 403/429/5xx (fetch exits 2).
Usage: python stage.py  (reads candidates.txt, one identifier per line, # comments allowed)
"""
import json
import pathlib
import subprocess
from urllib.parse import quote
import sys

HERE = pathlib.Path(__file__).resolve().parent
PY = sys.executable
RAW = HERE / "raw"


FAILS = {"row": 0}


def run_fetch(url, out):
    if out.exists():
        return 0
    proc = subprocess.run([PY, "-X", "utf8", str(HERE / "fetch.py"), url, str(out)])
    if proc.returncode == 2:
        print(f"STOP: blocked (403/429) fetching {url}")
        sys.exit(2)
    if proc.returncode == 3:
        err_dir = RAW / "errors"
        err_dir.mkdir(exist_ok=True)
        for f in (out, pathlib.Path(str(out) + ".meta.json")):
            f.rename(err_dir / f"{f.name}.{FAILS['row']}.{len(list(err_dir.iterdir()))}")
        FAILS["row"] += 1
        print(f"ERROR-SKIP {url}")
        if FAILS["row"] >= 3:
            print("STOP: three errors in a row")
            sys.exit(2)
        return 3
    FAILS["row"] = 0
    return proc.returncode


def main():
    ids = [ln.split("#")[0].strip() for ln in (HERE / "candidates.txt").read_text(encoding="utf-8").splitlines()]
    ids = [i for i in ids if i]
    (RAW / "meta").mkdir(parents=True, exist_ok=True)
    (RAW / "txt").mkdir(parents=True, exist_ok=True)
    for ident in ids:
        meta_path = RAW / "meta" / f"{ident}.json"
        run_fetch(f"https://archive.org/metadata/{ident}", meta_path)
        if not meta_path.exists():
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        names = [f["name"] for f in meta.get("files", []) if f["name"].endswith("_djvu.txt")]
        if not names:
            print(f"NO-TEXT {ident}: no _djvu.txt file listed")
            continue
        name = names[0]
        out = RAW / "txt" / f"{ident}__{pathlib.Path(name).name}"
        run_fetch(f"https://archive.org/download/{ident}/{quote(name)}", out)
    print("DONE")


if __name__ == "__main__":
    main()
