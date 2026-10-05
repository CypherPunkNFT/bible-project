"""One local watchdog check, invoked every 30 minutes by Windows Task Scheduler."""
import json
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

from .settings import load, write_json


def age(report, now):
    try:
        return (now - datetime.fromisoformat(report["updated_at"].replace("Z", "+00:00"))).total_seconds()
    except (KeyError, ValueError, TypeError):
        return float("inf")


def decide(progress, completion, processes, now, paused=False):
    if paused:
        return "paused"
    if processes["build"] or processes["refresh"]:
        return "building"
    if processes["embed"]:
        # ANN optimization may legitimately take much longer than an embedding batch.
        if progress.get("state") == "optimizing":
            return "optimizing"
        if age(progress, now) >= 1800:
            return "restart_stalled"
        return "healthy" if processes["monitor"] else "attach_monitor"
    if completion.get("state") == "complete" and progress.get("state") == "complete":
        return "complete"
    # Allow the monitor time to verify the last batch and enter a late-source refresh.
    if processes["monitor"] and age(progress, now) < 300 and progress.get("state") not in ("interrupted", "stalled"):
        return "verifying"
    if progress.get("state") == "complete":
        return "resume_monitor"
    return "restart_stopped"


def powershell(script):
    return subprocess.check_output(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
        text=True, encoding="utf-8-sig", timeout=60, creationflags=subprocess.CREATE_NO_WINDOW,
    )


def inventory(config):
    rows = json.loads(powershell("[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); ConvertTo-Json -InputObject @(Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine) -Compress"))
    python = re.escape(str(config["state_dir"] / ".venv/Scripts/python.exe"))
    pattern = re.compile(r'^"?' + python + r'"?\s+(?:-u\s+)?-m\s+knowledge\s+(encoder|embed|build)\s*$', re.I)
    result = {key: [] for key in ("encoder", "embed", "build", "refresh", "monitor")}
    scripts = [("monitor", "finish-intake.ps1"), ("monitor", "watchdog-resume.ps1"), ("refresh", "start.ps1")]
    for row in rows:
        command = row.get("CommandLine") or ""
        match = pattern.match(command)
        if match:
            result[match[1].lower()].append(row["ProcessId"])
        for key, filename in scripts:
            path = config["site_dir"] / "knowledge" / filename
            if re.search(r'-File\s+"?' + re.escape(str(path)) + r'"?(?:\s|$)', command, re.I):
                result[key].append(row["ProcessId"])
    return result


def recover(config, action):
    # Re-read process identities immediately before stopping anything; never use stale PIDs.
    current = inventory(config)
    if current["build"] or current["refresh"]:
        return "build_started_during_check"
    keys = ("monitor", "embed", "encoder") if action.startswith("restart_") else ("monitor",)
    if action == "attach_monitor" and current["monitor"]:
        return "monitor_already_running"
    stop_ids = [pid for key in keys for pid in current[key]]
    if stop_ids:
        powershell("Stop-Process -Id " + ",".join(map(str, stop_ids)) + " -ErrorAction SilentlyContinue")
    state = config["state_dir"]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    archive = state / "watchdog-history" / stamp
    archive.mkdir(parents=True)
    for name in ("embedding-progress.json", "intake-completion.json", "embedding.log", "embedding-error.log", "encoder-error.log", "intake-completion.log", "intake-completion-error.log"):
        source = state / name
        if source.exists():
            shutil.copy2(source, archive / name)
    # Launch through Windows' process service: Task Scheduler may clean up all
    # descendants of its short-lived action, even with detached creation flags.
    command = subprocess.list2cmdline(["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", str(config["site_dir"] / "knowledge/watchdog-resume.ps1")])
    quote = lambda value: "'" + str(value).replace("'", "''") + "'"
    launched = json.loads(powershell(
        "$startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0}; "
        "$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=" + quote(command) +
        "; CurrentDirectory=" + quote(config["site_dir"]) + "; ProcessStartupInformation=$startup}; "
        "$result | Select-Object ReturnValue,ProcessId | ConvertTo-Json -Compress"
    ))
    if launched["ReturnValue"] != 0:
        raise RuntimeError(f"Windows recovery launch failed: {launched}")
    pid = launched["ProcessId"]
    # A successful Create result alone does not establish that the script started.
    for _ in range(15):
        time.sleep(1)
        if read_report(state / "intake-completion.json").get("pid") == pid and pid in inventory(config)["monitor"]:
            return {"monitor_pid": pid, "archived_logs": str(archive), "output_log": str(state / f"intake-recovery-{pid}.log"), "error_log": str(state / f"intake-recovery-{pid}-error.log")}
    raise RuntimeError(f"Recovery monitor {pid} did not confirm startup; inspect intake-recovery-{pid}-error.log")


def read_report(path):
    return json.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else {}


def main():
    import msvcrt
    config = load()
    state = config["state_dir"]
    now = datetime.now(timezone.utc)
    with (state / "watchdog.lock").open("a+b") as lock:
        lock.seek(0)
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            return 0
        report = {"checked_at": now.isoformat(), "interval_minutes": 30}
        try:
            progress = read_report(state / "embedding-progress.json")
            completion = read_report(state / "intake-completion.json")
            processes = inventory(config)
            action = decide(progress, completion, processes, now, (state / "watchdog.pause").exists())
            report.update(state=action, indexed=progress.get("indexed"), total=progress.get("total"), embedding_state=progress.get("state"), processes=processes)
            if action in ("restart_stopped", "restart_stalled", "attach_monitor", "resume_monitor"):
                report["recovery"] = recover(config, action)
            code = 0
        except Exception as exc:
            report.update(state="watchdog_error", error=str(exc))
            code = 1
        write_json(state / "watchdog.json", report)
        with (state / "watchdog.log").open("a", encoding="utf-8") as log:
            log.write(json.dumps(report) + "\n")
        print(json.dumps(report))
        return code


if __name__ == "__main__":
    sys.exit(main())
