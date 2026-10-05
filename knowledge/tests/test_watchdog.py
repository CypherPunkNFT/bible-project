from datetime import datetime, timedelta, timezone

from knowledge.watchdog import decide


NOW = datetime(2026, 10, 5, 19, tzinfo=timezone.utc)


def check(state="running", minutes=1, embed=True, monitor=True, completion="running", **flags):
    processes = {"embed": [1] if embed else [], "monitor": [2] if monitor else [], "build": [], "refresh": []}
    processes.update(flags)
    return decide({"state": state, "updated_at": (NOW-timedelta(minutes=minutes)).isoformat()}, {"state": completion}, processes, NOW)


def test_healthy_and_gpu_wait_do_not_restart():
    assert check() == "healthy"
    assert check(state="waiting_for_gpu") == "healthy"


def test_dead_worker_and_stale_live_worker_recover():
    assert check(state="interrupted", embed=False) == "restart_stopped"
    assert check(minutes=31) == "restart_stalled"
    assert check(state="waiting_for_gpu", minutes=31) == "restart_stalled"


def test_lost_monitor_is_reattached_without_resetting_encoder():
    assert check(monitor=False) == "attach_monitor"


def test_never_interrupt_build_or_optimization():
    assert check(minutes=90, build=[3]) == "building"
    assert check(minutes=90, refresh=[3]) == "building"
    assert check(state="optimizing", minutes=90) == "optimizing"


def test_completion_and_verification():
    assert check(state="complete", embed=False, completion="complete") == "complete"
    assert check(state="complete", embed=False) == "verifying"
    assert check(state="complete", minutes=6, embed=False) == "resume_monitor"
    assert check(state="complete", embed=False, monitor=False) == "resume_monitor"


def test_pause_overrides_recovery():
    assert decide({}, {}, {}, NOW, paused=True) == "paused"
