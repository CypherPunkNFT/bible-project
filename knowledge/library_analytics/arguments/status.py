"""One-shot, read-only KR-130 console status; no polling or worker launch."""
import json
import time
from datetime import datetime

from .inputs import ROOT, lease_status
from ..jobs import process_identity


def receipt(name):
    try:
        return json.loads((ROOT / name).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def bar(done, total):
    fraction = min(1, max(0, done / total)) if total else 0
    filled = int(fraction * 28)
    return f"[{'#' * filled}{'-' * (28 - filled)}] {fraction:6.1%}"


def owner_label(row):
    try:
        import psutil
        command = psutil.Process(row["pid"]).cmdline()
        if "-m" in command:
            index = command.index("-m") + 1
            module = command[index].removeprefix("knowledge.library_analytics.")
            action = next((x for x in command[index + 1:] if not x.startswith("-")), "")
            return (module + " " + action).strip()
    except (ImportError, OSError, Exception):
        pass
    return "analytics worker"


def main():
    from .lease_dashboard import show
    show()
    state = receipt("operator-state.json")
    progress = receipt("progress.json")
    plan = receipt("calibration-plan.json")
    population = receipt("population.json")
    verification = receipt("population-verification.json")
    delivery = receipt("delivery-complete.json")
    run_id = progress.get("run_id", "")
    calibration = run_id.endswith("-calibration")
    count = progress.get("processed_documents", 0)
    total = plan.get("declared_supported_documents", 0)
    pid = state.get("pid")
    identity = process_identity(pid) if pid else None
    alive = bool(identity and identity != "unknown" and identity == state.get("process_token"))
    phase = state.get("phase", "not started").replace("-", " ")
    status = state.get("state", "unknown")
    if delivery.get("state") == "private-candidate-delivery-complete":
        headline = "PRIVATE DELIVERY COMPLETE"
    elif status == "failed":
        headline = "FAILED - needs attention"
    elif status == "complete":
        headline = "POPULATION VERIFIED - exports/handoff still pending"
    elif not alive and identity != "unknown":
        headline = "WORKER NOT RUNNING - saved progress below"
    elif status == "waiting-for-global-lease":
        headline = "WAITING FOR SHARED ANALYTICS LEASE"
    else:
        headline = "RUNNING" if alive else "WORKER IDENTITY UNCONFIRMED"
    print("\n" + "=" * 68)
    print(" KR-130  |  ATTRIBUTED ARGUMENTS")
    print("=" * 68)
    print(f" Status       {headline}")
    print(f" Phase        {phase}")
    print(f" Worker       PID {pid or '-'}  ({'alive' if alive else 'unconfirmed' if identity == 'unknown' else 'exited'})")
    try:
        owners = [r for r in lease_status() if r.get("live_identity") == "unknown" or r.get("live_identity") == r.get("process_token")]
        blockers = [r for r in owners if r["pid"] != pid]
        for row in blockers:
            print(f" Lease owner  {owner_label(row)}  (PID {row['pid']})")
        if status == "waiting-for-global-lease" and not blockers:
            print(" Lease        free now; queued worker will retry")
    except Exception as exc:
        print(f" Lease        unavailable: {exc}")
    print("-" * 68)
    cal = receipt("calibration.json")
    cal_done = cal.get("counts", cal).get("processed_documents", count if calibration else 0)
    cal_total = plan.get("calibration_expected_documents", 95)
    print(f" Calibration  {cal_done:,} / {cal_total:,}  {bar(cal_done, cal_total)}")
    pop_done = population.get("counts", population).get("processed_documents", 0 if calibration else count)
    print(f" Population   {pop_done:,} / {total:,}  {bar(pop_done, total)}")
    print(f" Verification {'passed' if verification.get('ok') else 'pending'}")
    print(f" Exports      {'complete' if delivery else 'pending'}")
    print("-" * 68)
    label = "Calibration" if calibration else "Population"
    print(f" {label} counts (last saved checkpoint):")
    print(f"   Statements {progress.get('statements', 0):>14,}")
    print(f"   Qualifiers {progress.get('qualifications', 0):>14,}")
    print(f"   Links      {progress.get('links', 0):>14,}")
    updated = state.get("updated_at_unix", state.get("finished_at_unix", state.get("failed_at_unix")))
    if updated:
        stamp = datetime.fromtimestamp(updated).strftime("%Y-%m-%d %I:%M:%S %p")
        print(f" Updated      {stamp}  ({max(0, int(time.time() - updated)):,}s ago)")
    if state.get("error"):
        print(f" Error        {state['error']}")
    print("=" * 68)
    print(" Snapshot only. Run progress again to refresh.\n")


if __name__ == "__main__":
    main()
