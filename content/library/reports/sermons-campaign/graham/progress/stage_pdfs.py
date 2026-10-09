"""Download candidate Graham sermon PDFs into staging (scratch), with headers sidecar.

Usage: python -X utf8 stage_pdfs.py STAGEDIR URL [URL ...]
Skips any URL whose staged file already exists. Stops on 429/403/captcha.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fetch import Blocked, fetch  # noqa: E402


def main():
    stage = Path(sys.argv[1])
    stage.mkdir(parents=True, exist_ok=True)
    for url in sys.argv[2:]:
        name = url.rsplit("/", 1)[-1]
        target = stage / name
        if target.exists():
            print(f"skip (staged) {name}")
            continue
        try:
            status, final, headers, body = fetch(url)
        except Blocked as err:
            print(f"STOPPED: {err}")
            return
        print(f"{status} {len(body)} {headers.get('Content-Type')} {name}")
        if status != 200:
            continue
        target.write_bytes(body)
        (stage / f"{name}.headers.json").write_text(json.dumps({
            "url": url, "finalUrl": final, "status": status, "headers": headers,
            "retrievedAt": datetime.now(timezone.utc).isoformat()}, indent=1), "utf-8")


if __name__ == "__main__":
    main()
