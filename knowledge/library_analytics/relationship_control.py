"""Stop explicitly selected redundant read-only KR-120 checks, never writers."""
import argparse
import psutil
from .jobs import process_identity
from .inputs import packed

def main():
    p=argparse.ArgumentParser();p.add_argument('--stop-readonly-resume-check',action='store_true');p.add_argument('--stop-readonly-joint-resume-check',action='store_true');p.add_argument('--stop-readonly-recall-checks',action='store_true');p.add_argument('--stop-readonly-coverage-check',action='store_true');p.add_argument('--stop-readonly-population-check',action='store_true');a=p.parse_args()
    if sum(vars(a).values())!=1:p.error('Choose one explicit scoped action')
    module='knowledge.library_analytics.relationship_evaluate' if a.stop_readonly_recall_checks else 'knowledge.library_analytics.relationship_joint_resume' if a.stop_readonly_joint_resume_check else 'knowledge.library_analytics.relationship_resume_check'
    if a.stop_readonly_coverage_check:module='knowledge.library_analytics.relationship_receipts'
    if a.stop_readonly_population_check:module='knowledge.library_analytics.relationship_verify'
    for proc in psutil.process_iter(['pid','cmdline']):
        args=proc.info['cmdline'] or []
        if module not in args:continue
        if a.stop_readonly_recall_checks and not any(x in args for x in ('--recall','--substantive-recall')):continue
        token=process_identity(proc.pid)
        if token in (None,'unknown'):continue
        # Recheck both exact command and creation token immediately before stopping.
        if process_identity(proc.pid)!=token or module not in proc.cmdline():continue
        proc.terminate();proc.wait(timeout=10);print(packed({'stopped_redundant_readonly_check':proc.pid,'process_token':token}))

if __name__=='__main__':main()
