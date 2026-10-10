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


def powershell(script):
    return subprocess.check_output(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
        text=True, encoding="utf-8-sig", timeout=60, creationflags=subprocess.CREATE_NO_WINDOW,
    )


def inventory(config):
    rows = json.loads(powershell("[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); ConvertTo-Json -InputObject @(Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine) -Compress"))
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
        if re.match(r'^"?'+python+r'"?\s+(?:-u\s+)?-m\s+knowledge\.watchdog_awake\s*$',command,re.I):
            result['awake'].append(row['ProcessId'])
        for key, filename in scripts:
            path = config["site_dir"] / "knowledge" / filename
            if re.search(r'-File\s+"?(?:' + re.escape(str(path)) + r'|knowledge[/\\]' + re.escape(filename) + r')"?(?:\s|$)', command, re.I):
                actual_key='startup' if filename=='start.ps1' and not re.search(r'\s-Refresh(?:\s|$)',command,re.I) else key
                result[actual_key].append(row["ProcessId"])
    return result


def recover(config, action, baseline=None):
    # Re-read process identities immediately before stopping anything; never use stale PIDs.
    current = inventory(config)
    if current["build"] or current["refresh"]:
        return "build_started_during_check"
    if current.get("verify"):
        return "verification_started_during_check"
    if baseline and action.startswith('restart_'):
        latest=read_report(config['state_dir']/'embedding-progress.json')
        if latest.get('corpus_build')!=baseline.get('corpus_build'):
            return 'corpus_changed_before_recovery'
        if latest.get('indexed',0)>baseline.get('indexed',0):
            return 'progress_resumed_before_restart'
    keys = ("monitor", "embed", "startup", "encoder") if action in ('restart_hard','restart_stopped','restart_stalled') else ("monitor", "embed", "startup") if action=='restart_soft' else ("monitor",)
    if action == "attach_monitor" and current["monitor"]:
        return "monitor_already_running"
    stop_ids = [pid for key in keys for pid in current[key]]
    if stop_ids:
        powershell("Stop-Process -Id " + ",".join(map(str, stop_ids)) + " -ErrorAction SilentlyContinue")
        # Confirm termination and lock release before launching any replacement.
        stop_deadline=time.monotonic()+25
        for attempt in range(20):
            if time.monotonic()>=stop_deadline:
                raise RuntimeError('Timed out waiting for owned processes to exit; hard retry remains queued')
            remaining=inventory(config)
            if remaining['build'] or remaining['refresh'] or remaining.get('verify'):
                raise RuntimeError('Build/verification started during recovery; replacement deferred')
            survivors=[pid for key in keys for pid in remaining[key]]
            if not survivors: break
            if action=='restart_hard':
                for pid in survivors:
                    # Fresh inventory identities above are restricted to this KB.
                    # No /T: never kill unrelated descendant/download jobs.
                    subprocess.run(['taskkill.exe','/PID',str(pid),'/F'],capture_output=True,timeout=max(.1,min(3,stop_deadline-time.monotonic())),
                                   creationflags=subprocess.CREATE_NO_WINDOW)
            time.sleep(1)
        else:
            raise RuntimeError('Owned processes did not exit; timed hard escalation remains queued')
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


def ensure_awake(config,processes):
    if processes.get('awake'):return {'already_running':processes['awake']}
    command=subprocess.list2cmdline([str(config['state_dir']/'.venv/Scripts/python.exe'),'-m','knowledge.watchdog_awake'])
    quote=lambda value:"'"+str(value).replace("'","''")+"'"
    launched=json.loads(powershell(
        "$startup=New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0}; "
        "$result=Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine="+quote(command)+
        "; CurrentDirectory="+quote(config['site_dir'])+"; ProcessStartupInformation=$startup}; "
        "$result | Select-Object ReturnValue,ProcessId | ConvertTo-Json -Compress"))
    if launched['ReturnValue']:raise RuntimeError('Could not launch temporary sleep blocker: '+str(launched))
    return {'launched_pid':launched['ProcessId']}


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
    command = subprocess.list2cmdline(['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
                                      '-File', str(config['site_dir'] / 'knowledge/campaign-completion-monitor.ps1'),
                                      '-PriorCompletionPid', str(prior)])
    quote = lambda value: "'" + str(value).replace("'", "''") + "'"
    launched = json.loads(powershell(
        "$startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{ShowWindow=[uint16]0}; "
        "$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=" + quote(command) +
        "; CurrentDirectory=" + quote(config['site_dir']) + "; ProcessStartupInformation=$startup}; "
        "$result | Select-Object ReturnValue,ProcessId | ConvertTo-Json -Compress"))
    if launched['ReturnValue']:
        raise RuntimeError(f'Campaign report monitor launch failed: {launched}')
    return {'launched_pid': launched['ProcessId']}


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
