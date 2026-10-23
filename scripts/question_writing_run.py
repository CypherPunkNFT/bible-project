"""Run waves of the site's question writing end to end, unattended: write, then the reviews until no question is
waiting, then publish (question_writing.py, question_writing_review.py). Every model call goes through BatchRunner,
a 3-item pilot first, then the full run with the pilot's suggested budget.

The driver stops, and says why, when BatchRunner stops for anything but finishing (usage limit, login, budget, a
leak, another full run on this PC), or when the spend would pass --cap-usd (list price; BatchRunner's Haiku figures
are divided by HAIKU_OVERPRICE, see its README). Run it again with the same waves to carry on: a stage prepared but
not applied is run and applied first, and finished items are never asked again.

    python scripts/question_writing_run.py WAVE [WAVE ...] [--parallel 6] [--cap-usd 200]
    python scripts/question_writing_run.py 1 2 3 4 5 --detach    # the whole job in the background
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from question_writing import WORK, apply_write, build_map, load_candidates, prepare_write, written_sections  # noqa: E402
from question_writing_review import STAGES, apply, prepare, publish, report, waiting  # noqa: E402

PYTHON = r"D:\Python\python.exe"
RUNNER = Path(__file__).resolve().parents[4] / "Tools" / "BatchRunner" / "batch_runner.py"
WRITER, QUIZ, CHECKER = "claude-sonnet-5-5", "claude-haiku-5-5", "claude-sonnet-5-5"
MODEL_OF = {"write": WRITER, "open": QUIZ, "closed": QUIZ, "check": CHECKER}
HAIKU_OVERPRICE = 50
WRITE_ATTEMPTS, REVIEW_PASSES = 3, 8
OK_EXITS = {0, 1}  # 1: finished, some items failed; a question with no answer waits for the next pass
BUDGET_USED_UP, BUDGET_ROUNDS = 5, 3  # BatchRunner's exit code when a run's own budget is spent
NOTHING_LEFT = ("No items left to run after the pilot.", "Nothing to pilot")


class Driver:
    def __init__(self, wave: int, parallel: int, cap_usd: float) -> None:
        self.wave, self.run, self.parallel, self.cap = wave, f"full-w{wave}", parallel, cap_usd
        (WORK / self.run).mkdir(parents=True, exist_ok=True)
        self.log_path = WORK / self.run / "driver.log"

    def log(self, text: str) -> None:
        line = f"{datetime.datetime.now():%Y-%m-%d %H:%M:%S} {text}"
        print(line, flush=True)
        with self.log_path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")

    @staticmethod
    def folder_spent(status_path: Path) -> float:
        """A folder's list-price spend so far."""
        if not status_path.exists():
            return 0.0
        status = json.loads(status_path.read_text(encoding="utf-8"))
        usd = status.get("spent_usd") or 0.0
        return usd / HAIKU_OVERPRICE if "haiku" in status.get("resume_command", "") else usd

    def spent(self) -> float:
        """List-price spend of every full-wave run so far."""
        return sum(self.folder_spent(path) for path in WORK.glob("full-w*/*/out/_runner/status.json"))

    def batch(self, folder: Path, model: str) -> None:
        for _attempt in range(BUDGET_ROUNDS):  # a projection that falls short: priced again from what is left
            if self.batch_once(folder, model) != BUDGET_USED_UP:
                return
            self.log(f"{folder.name}: the projected budget fell short; pricing what is left and carrying on")
        raise SystemExit(f"{folder.name}: budget used up {BUDGET_ROUNDS} times; see {folder / 'out' / '_runner'}")

    def batch_once(self, folder: Path, model: str) -> int:
        base = [PYTHON, str(RUNNER), "--task", str(folder / "task.txt"), "--items", str(folder / "items"),
                "--out", str(folder / "out"), "--schema", str(folder / "schema.json"), "--model", model,
                "--parallel", str(self.parallel)]
        for _attempt in range(2):  # a pilot call can fail once for no lasting reason
            pilot = self.call([*base, "--pilot", "3"], folder)
            if any(text in pilot for text in NOTHING_LEFT):
                return 0
            found = re.search(r"suggested --budget-usd ([\d.]+)", pilot)
            if found:
                break
        else:
            raise SystemExit(f"{folder.name}: the pilot failed twice; see {folder / 'out' / '_runner' / 'log.txt'}")
        budget = float(found.group(1))
        scale = HAIKU_OVERPRICE if "haiku" in model else 1
        before = self.folder_spent(folder / "out" / "_runner" / "status.json")
        more = max(0.0, budget / scale - before)  # the suggestion includes what this folder already spent
        if self.spent() + more > self.cap:
            raise SystemExit(f"{folder.name}: ${self.spent():.2f} spent + up to ${more:.2f} would pass the "
                             f"${self.cap:.2f} cap; stopped before the full run")
        return self.call([*base, "--budget-usd", f"{budget:.2f}"], folder, full=True)

    def call(self, command: list[str], folder: Path, full: bool = False) -> str | int:
        """A pilot's console text, or a full run's exit code (0, 1, or BUDGET_USED_UP)."""
        mode = "full" if full else "pilot"
        self.log(f"{folder.name}: {mode} run starts")
        done = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", check=False)
        tail = "\n".join(done.stdout.strip().splitlines()[-4:])
        self.log(f"{folder.name}: {mode} run exit {done.returncode}; spent so far ${self.spent():.2f}\n{tail}")
        if full and done.returncode == BUDGET_USED_UP:
            return done.returncode
        if done.returncode not in OK_EXITS:
            raise SystemExit(f"{folder.name}: BatchRunner stopped (exit {done.returncode}); see "
                             f"{folder / 'out' / '_runner' / 'log.txt'}\n{done.stderr[-2000:]}")
        return done.returncode if full else done.stdout

    def unapplied(self, stage: str) -> Path | None:
        """The latest folder of a stage if it was prepared but never applied (the driver stopped in between)."""
        folders = sorted((WORK / self.run).glob(f"{stage}-*"), key=lambda p: int(p.name.rsplit("-", 1)[1]))
        return folders[-1] if folders and not (folders[-1] / "applied").exists() else None

    def stage(self, stage: str, folder: Path | None = None) -> None:
        if folder is None:
            if stage == "write":
                prepare_write(self.run, [], [], self.wave, 0, 60)
            else:
                prepare(stage, self.run)
            folder = self.unapplied(stage)
        self.batch(folder, MODEL_OF[stage])
        if stage == "write":
            apply_write(self.run, by=WRITER)
        else:
            apply(stage, self.run, by=MODEL_OF[stage])
        (folder / "applied").write_text(datetime.datetime.now().isoformat(), encoding="utf-8")

    def write(self) -> None:
        for attempt in range(WRITE_ATTEMPTS):  # sections with no reply are not written, so the next attempt asks again
            try:
                self.stage("write", self.unapplied("write"))
            except SystemExit as exc:
                if "no section left" in str(exc):
                    return
                raise
            self.log(f"write attempt {attempt + 1} applied")

    def any_waiting(self, stage: str) -> bool:
        return any(waiting(c, stage) for c in load_candidates(self.run)["questions"].values())

    def review(self) -> None:
        for _ in range(REVIEW_PASSES):
            for stage in STAGES:
                if self.unapplied(stage):
                    self.stage(stage, self.unapplied(stage))
            quizzes = [s for s in ("open", "closed") if self.any_waiting(s)]
            for stage in quizzes:
                if self.any_waiting(stage):  # the first quiz may have rejected every question the second awaits
                    self.stage(stage)
            if not quizzes:
                if not self.any_waiting("check"):
                    return
                self.stage("check")
        self.log(f"still waiting after {REVIEW_PASSES} passes; publishing what passed")

    def unwritten(self) -> list[str]:
        sections, _locator, _shown = build_map(60)
        done = written_sections()
        return [s["id"] for s in sections if s["wave"] == self.wave and s["target"] and s["id"] not in done]

    def go(self) -> None:
        self.log(f"wave {self.wave} starts; cap ${self.cap:.2f}, spent so far ${self.spent():.2f}")
        self.write()
        self.review()
        report(self.run)
        publish(self.run)
        left = self.unwritten()
        self.log(f"wave {self.wave} published; spent so far ${self.spent():.2f}; sections of this wave still not "
                 f"written: {len(left)} {left[:20]}")


def detach(arguments: list[str]) -> None:
    log = WORK / "driver-console.txt"
    flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    with log.open("a", encoding="utf-8") as out:
        process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), *arguments], stdout=out,
                                   stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, creationflags=flags,
                                   cwd=str(Path(__file__).resolve().parents[1]))
    print(f"started in the background (pid {process.pid}); console: {log}; each wave logs to {WORK}/full-w<N>/driver.log")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("waves", type=int, nargs="+")
    p.add_argument("--parallel", type=int, default=6)
    p.add_argument("--cap-usd", type=float, default=200.0)
    p.add_argument("--detach", action="store_true", help="run in the background, surviving the chat")
    args = p.parse_args()
    if args.detach:
        detach([a for a in sys.argv[1:] if a != "--detach"])
        return
    for wave in args.waves:  # in order: a wave's sections wait for the linked sections of earlier waves
        driver = Driver(wave, args.parallel, args.cap_usd)
        try:
            driver.go()
        except SystemExit as exc:
            driver.log(f"STOPPED: {exc}")
            raise


if __name__ == "__main__":
    main()
