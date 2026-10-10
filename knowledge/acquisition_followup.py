"""One scheduled check: refresh once, after all configured acquisition missions finish.

Uses Windows Task Scheduler and a detached local runner, not an open AI chat.
Missing reports, incomplete manifests and active Bible workers hold the gate.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from .settings import load, write_json
from .watchdog import inventory, powershell, read_report


def campaign_gate(plan, now):
    root = Path(plan["campaign_dir"])
    missing, invalid, completed = [], [], []
    newest = 0.0
    for mission in plan["missions"]:
        report = root / mission / "REPORT.md"
        manifest = root / mission / "acquisition-manifest.json"
        if not report.is_file() or not report.stat().st_size or not manifest.is_file():
            missing.append(mission)
            continue
        try:
            value = json.loads(manifest.read_text(encoding="utf-8-sig"))
            if not isinstance(value, dict) or not isinstance(value.get("files"), list):
                raise ValueError("Expected an acquisition manifest with a files list")
            if value.get("mission", mission) != mission:
                raise ValueError("Manifest belongs to another mission")
            if value.get("status", "").lower() in ("running", "queued", "in_progress", "in-progress", "failed"):
                raise ValueError("Manifest has not finished")
        except (OSError, ValueError, TypeError) as exc:
            invalid.append({"mission": mission, "reason": str(exc)})
            continue
        completed.append(mission)
    if root.exists():
        newest = max((p.stat().st_mtime for p in root.rglob("*") if p.is_file()), default=0)
    quiet = now.timestamp() - newest >= plan.get("quiet_seconds", 300)
    return {"ready": not missing and not invalid and quiet,
            "completed": completed, "missing": missing, "invalid": invalid,
            "quiet": quiet, "expected": len(plan["missions"])}


def collectors():
    rows = json.loads(powershell(
        "[Console]::OutputEncoding=[Text.UTF8Encoding]::new(); "
        "ConvertTo-Json -InputObject @(Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | "
        "Select-Object ProcessId,CommandLine) -Compress"))
    # Exact campaign script family, including relative command lines. Do not
    # confuse a pause between missions with campaign completion: reports gate it.
    return [r["ProcessId"] for r in rows if re.search(
        r"(?:^|[ /\\])rb\d{2}[-_][^\s\"]*\.py(?:[\s\"]|$)", r.get("CommandLine") or "", re.I)]


def launch(config):
    script = config["site_dir"] / "knowledge/acquisition-followup-run.ps1"
    command = subprocess.list2cmdline(["powershell.exe", "-NoProfile", "-NonInteractive",
        "-ExecutionPolicy", "Bypass", "-File", str(script)])
    quote = lambda text: "'" + str(text).replace("'", "''") + "'"
    # Create outside Task Scheduler's short-lived action process tree, like the
    # existing watchdog recovery. Hidden window and Bible-only working directory.
    result = json.loads(powershell(
        "$startup=New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0}; "
        "$result=Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=" + quote(command) +
        ";CurrentDirectory=" + quote(config["site_dir"]) + ";ProcessStartupInformation=$startup}; "
        "$result | Select-Object ReturnValue,ProcessId | ConvertTo-Json -Compress"))
    if result["ReturnValue"]:
        raise RuntimeError(f"Follow-up launch failed: {result}")
    return result["ProcessId"]


def check(config):
    plan = read_report(config["state_dir"] / "acquisition-followup-plan.json")
    if not plan:
        raise RuntimeError("Missing acquisition-followup-plan.json")
    if plan.get("enabled") is False:
        return {"state": "superseded", "reason": "Owner authorized same-day mission intake; fourteen-mission gate disabled"}
    path = config["state_dir"] / "acquisition-followup.json"
    state = read_report(path)
    now = datetime.now(timezone.utc)
    if state.get("state") in ("complete", "needs_attention"):
        if state["state"] == "complete":
            name = plan["task_name"].replace("'", "''")
            powershell(f"Disable-ScheduledTask -TaskName '{name}' | Out-Null")
        return state
    processes = inventory(config)
    busy = {k: v for k, v in processes.items() if k in ("build", "embed", "refresh", "monitor") and v}
    if state.get("state") in ("launching", "running"):
        if not busy:
            completion = read_report(config["state_dir"] / "intake-completion.json")
            finished = completion.get("completed_at", "")
            launched = state["launched_at"]
            if completion.get("state") == "complete" and finished and datetime.fromisoformat(finished.replace("Z", "+00:00")) >= datetime.fromisoformat(launched):
                state.update(state="complete", completed_at=finished)
            elif (now-datetime.fromisoformat(launched)).total_seconds() > 300:
                state.update(state="needs_attention", error="Follow-up stopped without verified completion; inspect intake completion and watchdog logs")
            write_json(path, state)
        return state
    gate = campaign_gate(plan, now)
    active_collectors = collectors()
    report = {"state": "waiting_for_acquisition", "checked_at": now.isoformat(),
              "gate": gate, "active_collectors": active_collectors, "busy": busy}
    if gate["ready"] and not active_collectors:
        if busy:
            report["state"] = "waiting_for_current_intake"
        else:
            report.update(state="launching", launched_at=now.isoformat())
            write_json(path, report)  # Claim before launch; later checks never launch twice.
            try:
                pid = launch(config)
                write_json(config["state_dir"] / "acquisition-followup-launch.json", {"pid": pid, "launched_at": now.isoformat()})
                return report  # Runner owns state from this point.
            except Exception as exc:
                report.update(state="needs_attention", error=str(exc))
    write_json(path, report)
    return report


def main():
    import msvcrt
    config = load()
    # Share the watchdog's launch mutex so recovery and follow-up cannot race.
    with (config["state_dir"] / "watchdog.lock").open("a+b") as lock:
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            return 0
        try:
            report = check(config)
            print(json.dumps(report))
            return 0
        except Exception as exc:
            write_json(config["state_dir"] / "acquisition-followup-check-error.json",
                       {"checked_at": datetime.now(timezone.utc).isoformat(), "error": str(exc)})
            raise


if __name__ == "__main__":
    sys.exit(main())
