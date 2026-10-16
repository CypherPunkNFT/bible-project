"""One local check per minute, with persistent escalation and vector verification."""
import json
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

from .settings import load, write_json
from .watchdog_recovery import plan, CHECK_SECONDS, STARTUP_SECONDS, PROGRESS_SECONDS, RECONCILE_SECONDS


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
    if processes.get("verify"):
        return "verifying"
    if processes["embed"]:
        # ANN optimization may legitimately take much longer than an embedding batch.
        if progress.get("state") == "optimizing":
            return "optimizing"
        if age(progress, now) >= 1800:
            return "restart_stalled"
        return "healthy" if processes["monitor"] else "attach_monitor"
    if completion.get("state") == "complete" and progress.get("state") == "complete":
        return "complete"
    if processes["monitor"] and completion.get("state") in ("waiting_for_acquisitions", "waiting_for_source_database_reader") and age(completion, now) < 1800:
        return "waiting_for_acquisition"
    if completion.get("state") == "snapshot_complete_followup_pending" and progress.get("state") == "complete":
        return "waiting_for_acquisition"
    # Allow the monitor time to verify the last batch and enter a late-source refresh.
    if processes["monitor"] and age(progress, now) < 300 and progress.get("state") not in ("interrupted", "stalled"):
        return "verifying"
    if progress.get("state") == "complete":
        return "resume_monitor"
    return "restart_stopped"


def inventory(config):
    import psutil
    rows = []
    for process in psutil.process_iter(['pid', 'name']):
        if (process.info['name'] or '').lower() not in ('python.exe', 'pythonw.exe', 'powershell.exe', 'pwsh.exe'):
            continue
        try:
            rows.append({'ProcessId': process.pid, 'CommandLine': subprocess.list2cmdline(process.cmdline())})
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            continue
    python = re.escape(str(config["state_dir"] / ".venv/Scripts/python.exe"))
    pattern = re.compile(r'^"?' + python + r'"?\s+(?:-u\s+)?-m\s+knowledge\s+(encoder|embed|build|verify)\s*$', re.I)
    result = {key: [] for key in ("encoder", "embed", "build", "verify", "refresh", "startup", "monitor", "report_monitor", "awake")}
    scripts = [("monitor", "finish-intake.ps1"), ("monitor", "watchdog-resume.ps1"),
               ("monitor", "acquisition-followup-run.ps1"), ("refresh", "start.ps1"),
               ("report_monitor", "campaign-completion-monitor.ps1")]
    for row in rows:
        command = row.get("CommandLine") or ""
        match = pattern.match(command)
        if match:
            result[match[1].lower()].append(row["ProcessId"])
        if re.match(r'^"?'+python+r'"?\s+(?:-u\s+)?-m\s+knowledge\.finish_intake\s+--(?:refresh|resume)\s*$',command,re.I):
            result['monitor'].append(row['ProcessId'])
        if re.match(r'^"?'+python+r'"?\s+(?:-u\s+)?-m\s+knowledge\.watchdog_awake\s*$',command,re.I):
            result['awake'].append(row['ProcessId'])
        if str(config['site_dir'] / 'knowledge/campaign-report-monitor.py').lower() in command.lower():
            result['report_monitor'].append(row['ProcessId'])
        for key, filename in scripts:
            path = config["site_dir"] / "knowledge" / filename
            if re.search(r'-File\s+"?(?:' + re.escape(str(path)) + r'|knowledge[/\\]' + re.escape(filename) + r')"?(?:\s|$)', command, re.I):
                actual_key='startup' if filename=='start.ps1' and not re.search(r'\s-Refresh(?:\s|$)',command,re.I) else key
                result[actual_key].append(row["ProcessId"])
    return result


def recover(config, action, baseline=None):
    # ATD blocked the old completion chain. Preserve the collected vectors and
    # workers; do not restart that chain while its native replacement is pending.
    raise RuntimeError('Automatic completion recovery needs a native launcher; the blocked PowerShell recovery is not retried.')


def read_report(path):
    return json.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else {}


def ensure_awake(config,processes):
    if processes.get('awake'):return {'already_running':processes['awake']}
    launched=subprocess.Popen([str(config['state_dir']/'.venv/Scripts/python.exe'),'-m','knowledge.watchdog_awake'],
        cwd=config['site_dir'],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW|subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP)
    return {'launched_pid':launched.pid}


def ensure_campaign_report_monitor(config, processes):
    """Use the existing watchdog schedule; the reporter never owns vector writes."""
    runtime = config['state_dir'] / 'campaign-coordination'
    plan = read_report(runtime / 'intake-plan.json')
    if not plan or plan.get('metadataConflicts') or read_report(runtime / 'summary.json').get('state') == 'verified_complete':
        return 'not_needed'
    if processes.get('report_monitor'):
        return {'already_running': processes['report_monitor']}
    completion_pid = read_report(config['state_dir'] / 'intake-completion.json').get('pid', 0)
    prior = completion_pid if completion_pid in processes['monitor'] else next(iter(processes['monitor']), 0)
    with (runtime/'native-monitor.log').open('ab') as output:
        launched=subprocess.Popen([str(config['state_dir']/'.venv/Scripts/python.exe'),
            str(config['site_dir']/'knowledge/campaign-report-monitor.py')],cwd=config['site_dir'],
            stdin=subprocess.DEVNULL,stdout=output,stderr=output,
            creationflags=subprocess.CREATE_NO_WINDOW|subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP)
    return {'launched_pid': launched.pid}


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
        report = {"checked_at": now.isoformat(), "interval_minutes": CHECK_SECONDS/60,
                  "recovery_timers_seconds":dict(startup=STARTUP_SECONDS,progress=PROGRESS_SECONDS,reconciliation=RECONCILE_SECONDS)}
        recovery_state=read_report(state/'watchdog-recovery.json')
        try:
            progress = read_report(state / "embedding-progress.json")
            completion = read_report(state / "intake-completion.json")
            processes = inventory(config)
            action,recovery_state = plan(progress,completion,processes,now,recovery_state,(state / "watchdog.pause").exists())
            write_json(state/'watchdog-recovery.json',recovery_state)
            report.update(state=action, indexed=progress.get("indexed"), total=progress.get("total"), embedding_state=progress.get("state"), processes=processes)
            if action in ("restart_soft", "restart_hard", "attach_monitor", "resume_monitor"):
                report["recovery"] = recover(config, action,progress)
                recovery_state['lastLaunch']=report['recovery']
                if report['recovery']=='progress_resumed_before_restart':
                    recovery_state.update(stage=None,verifiedBy='saved vector count increased before restart',verifiedAt=now.isoformat())
                processes = inventory(config)
            if not (state / 'watchdog.pause').exists():
                report['campaign_report_monitor'] = ensure_campaign_report_monitor(config, processes)
                if action!='complete':report['sleep_blocker']=ensure_awake(config,processes)
            code = 0
        except Exception as exc:
            report.update(state="watchdog_error", error=str(exc))
            recovery_state['lastError']=str(exc)
            code = 1
        write_json(state/'watchdog-recovery.json',recovery_state)
        report['recovery_state']=recovery_state
        write_json(state / "watchdog.json", report)
        with (state / "watchdog.log").open("a", encoding="utf-8") as log:
            log.write(json.dumps(report) + "\n")
        print(json.dumps(report))
        return code


if __name__ == "__main__":
    sys.exit(main())
