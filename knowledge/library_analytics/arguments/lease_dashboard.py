"""Read-only global lease and live analytics process inventory, without polling."""
import json
import os
import textwrap
import time
from pathlib import Path

from .inputs import BASE, lease_status
from ..jobs import process_identity


def duration(seconds):
    seconds = max(0, int(seconds))
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}"


def label(command):
    if "-m" in command:
        i = command.index("-m") + 1
        return " ".join(command[i:]).removeprefix("knowledge.library_analytics.")
    return " ".join(command[1:])


def progress_receipts():
    # Only small working receipts: never traverse immutable releases, archived
    # generations, backups or source holdings, and never query analytical facts.
    paths = list(BASE.glob("*.json"))
    for folder in BASE.iterdir():
        if folder.is_dir() and folder.name != "releases":
            paths.extend(folder.glob("*.json"))
    results = {}
    for path in paths:
        if not any(part in path.name for part in ("state", "progress", "launch", "queue", "worker")):
            continue
        try:
            if path.stat().st_size > 1024 * 1024:
                continue
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, dict) or not isinstance(data.get("pid"), int):
                continue
            # A recycled PID is not evidence about the current worker.
            token = data.get("process_token")
            if not token or str(token) != process_identity(data["pid"]):
                continue
            results.setdefault(data["pid"], []).append((path.stat().st_mtime, path, data))
        except (OSError, ValueError):
            continue
    return results


def inventory():
    import psutil
    rows = []
    inaccessible = 0
    for proc in psutil.process_iter(["pid", "ppid", "name"]):
        if proc.pid == os.getpid():
            continue
        if "python" not in (proc.info["name"] or "").lower():
            continue
        try:
            command = proc.cmdline()
            joined = " ".join(command).lower().replace("\\", "/")
            if "library_analytics" not in joined:
                continue
            if "-m" in command and command[command.index("-m") + 1].rsplit(".", 1)[-1] in {"status", "lease_dashboard"}:
                continue
            if not proc.is_running():
                continue
            cpu = proc.cpu_times()
            io = proc.io_counters()
            rows.append({"pid": proc.pid, "ppid": proc.ppid(), "command": command,
                         "created": proc.create_time(), "cpu": cpu.user + cpu.system,
                         "rss": proc.memory_info().rss, "read": io.read_bytes,
                         "write": io.write_bytes, "token": process_identity(proc.pid)})
        except psutil.NoSuchProcess:
            continue
        except psutil.AccessDenied:
            inaccessible += 1
    return rows, inaccessible


def show():
    print("\n" + "=" * 88)
    print(" SHARED ANALYTICS LEASE  |  ALL LIVE ANALYTICS PROCESSES")
    print("=" * 88)
    try:
        owners = lease_status()
        rows, inaccessible = inventory()
        receipts = progress_receipts()
    except Exception as exc:
        print(f" Unable to read complete inventory: {exc}")
        return
    held = {r["pid"]: r for r in owners if r.get("live_identity") == "unknown" or r.get("live_identity") == r.get("process_token")}
    by_pid = {r["pid"]: r for r in rows}
    if not held:
        print(" Lease: FREE")
    for pid, row in held.items():
        command = by_pid.get(pid, {}).get("command", [])
        age = duration(time.time() - row.get("heartbeat", time.time()))
        print(f" Lease holder: PID {pid}  |  {label(command) if command else 'command unavailable'}")
        print(f" Last lease heartbeat: {age} ago")
        if row.get("live_identity") == "unknown":
            print(" Owner creation identity inaccessible; ownership remains protected.")
    print("-" * 88)
    print(f" {'PID':>7}  {'RELATION':<16}  {'UPTIME':>9}  {'CPU TIME':>9}  {'RAM MiB':>9}")
    print("-" * 88)
    ordered = sorted(rows, key=lambda r: (r["pid"] not in held, r["created"]))
    for row in ordered:
        pid = row["pid"]
        evidence = sorted(receipts.get(pid, []), reverse=True, key=lambda x: x[0])
        waiting = next((r for r in evidence if "waiting" in str(r[2].get("state", ""))), None)
        # Prefer a newer state receipt over an older waiting receipt.
        if waiting and any(r[0] > waiting[0] and r[2].get("state") and "waiting" not in str(r[2]["state"]) for r in evidence):
            waiting = None
        module = row["command"][row["command"].index("-m") + 1] if "-m" in row["command"] else ""
        observer = module.rsplit(".", 1)[-1] in {"resource_monitor", "owner_status", "observe_blocking_owner", "status", "lease_dashboard"}
        launcher = any(child["ppid"] == pid and child["command"] == row["command"] for child in rows)
        if pid in held and row["token"] == held[pid].get("process_token"):
            relation = "LEASE HOLDER"
        elif waiting:
            relation = "WAITING (receipt)"
        elif launcher:
            relation = "PYTHON LAUNCHER"
        elif observer:
            relation = "OBSERVER"
        elif row["ppid"] in by_pid:
            relation = "CHILD PROCESS"
        else:
            relation = "NO LEASE"
        print(f" {pid:>7}  {relation:<16}  {duration(time.time() - row['created']):>9}  {duration(row['cpu']):>9}  {row['rss'] / 1048576:>9,.1f}")
        for line in textwrap.wrap(label(row["command"]), width=80):
            print("          " + line)
        print(f"          Disk I/O since start: read {row['read'] / 1073741824:,.2f} GiB; wrote {row['write'] / 1073741824:,.2f} GiB")
        chosen = waiting or (evidence[0] if evidence else None)
        if chosen:
            _, path, data = chosen
            detail = " | ".join(str(data[key]) for key in ("phase", "state") if data.get(key))
            done = data.get("processed_documents", data.get("visited"))
            total = data.get("expected_documents", data.get("expected"))
            if done is not None:
                detail += f" | {done:,}" + (f" / {total:,}" if total else "")
            print(f"          Receipt: {detail or path.name}")
    if not rows:
        print(" No live analytics Python processes found.")
    missing = set(held) - set(by_pid)
    for pid in missing:
        print(f" {pid:>7}  LEASE HOLDER - process details inaccessible")
    print("-" * 88)
    print(f" {len(rows)} live analytics processes; {len(held)} protected lease owner(s).")
    print(" WAITING = identity-matched receipt. NO LEASE = live; wait state unreported.")
    print(" There is one lease slot, no central waiter registry, and no FIFO queue.")
    if inaccessible:
        print(f" {inaccessible} Python processes inaccessible; their analytics role is unknown.")
    print("=" * 88)


if __name__ == "__main__":
    show()
