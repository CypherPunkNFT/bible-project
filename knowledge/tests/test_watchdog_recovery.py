import unittest
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from datetime import datetime,timedelta,timezone
from knowledge.watchdog_recovery import plan


class RecoveryTimers(unittest.TestCase):
    def setUp(self):
        self.now=datetime(2026,10,8,tzinfo=timezone.utc)
        self.processes=dict(embed=[1],encoder=[2],monitor=[3],startup=[],build=[],refresh=[],verify=[])
        self.progress=dict(state='running',indexed=100,corpus_build='a',updated_at=self.now.isoformat())
        self.completion=dict(state='running')

    def call(self,minute,previous=None,**changes):
        progress=self.progress|changes
        return plan(progress,self.completion,self.processes,self.now+timedelta(minutes=minute),previous)

    def test_healthy_worker_is_not_restarted(self):
        action,state=self.call(0);self.assertEqual(action,'healthy')
        action,state=self.call(1,state,indexed=101,updated_at=(self.now+timedelta(minutes=1)).isoformat())
        self.assertEqual(action,'healthy');self.assertEqual(state['verifiedBy'],'saved vector count increased')

    def test_heartbeat_without_vectors_does_not_hide_stall(self):
        _,state=self.call(0)
        action,state=self.call(10,state,updated_at=(self.now+timedelta(minutes=10)).isoformat())
        self.assertEqual(action,'restart_soft')
        action,state=self.call(20,state,updated_at=(self.now+timedelta(minutes=20)).isoformat())
        self.assertEqual(action,'restart_hard')

    def test_failed_restart_escalates_after_two_minutes(self):
        self.processes['embed']=[]
        action,state=self.call(0,state='interrupted');self.assertEqual(action,'restart_soft')
        action,state=self.call(1,state);self.assertEqual(action,'verifying_restart_startup')
        action,state=self.call(2,state);self.assertEqual(action,'restart_hard')
        action,state=self.call(4,state);self.assertEqual(action,'restart_hard');self.assertEqual(state['attempts'],3)

    def test_reconciliation_has_its_own_grace_period(self):
        self.processes['embed']=[]
        _,state=self.call(0)
        self.processes['embed']=[4]
        action,state=self.call(12,state,state='reconciling');self.assertEqual(action,'verifying_restart_reconciliation')
        action,state=self.call(30,state,state='reconciling');self.assertEqual(action,'restart_hard')

    def test_success_clears_escalation(self):
        self.processes['embed']=[];_,state=self.call(0)
        self.processes['embed']=[4]
        action,state=self.call(1,state,indexed=101,updated_at=(self.now+timedelta(minutes=1)).isoformat())
        self.assertEqual(action,'healthy');self.assertIsNone(state['stage']);self.assertEqual(state['attempts'],1)

    def test_old_optimization_status_cannot_mask_failed_restart(self):
        self.processes['embed']=[]
        _,state=self.call(0,state='interrupted',pid=9)
        self.processes['embed']=[4]
        action,_=self.call(10,state,state='optimizing',pid=9)
        self.assertEqual(action,'restart_hard')

    def test_build_and_verification_are_protected(self):
        for key in ('build','refresh','verify'):
            self.processes[key]=[5]
            action,_=self.call(100)
            self.assertEqual(action,'verifying' if key=='verify' else 'building')
            self.processes[key]=[]

    def test_gpu_contention_is_not_reset(self):
        _,state=self.call(0)
        action,state=self.call(100,state,state='waiting_for_gpu')
        self.assertEqual(action,'waiting_for_gpu');self.assertIsNone(state['stage'])

    def test_optimization_and_pause_are_protected(self):
        action,_=self.call(100,state='optimizing');self.assertEqual(action,'optimizing')
        action,_=plan({}, {}, {}, self.now,paused=True);self.assertEqual(action,'paused')

    def test_new_build_resets_count_baseline(self):
        _,state=self.call(0)
        action,state=self.call(100,state,corpus_build='b',indexed=10,updated_at=(self.now+timedelta(minutes=100)).isoformat())
        self.assertEqual(action,'healthy');self.assertEqual(state['corpusBuild'],'b')

    def test_completion_is_success_not_a_restart(self):
        self.processes['embed']=[];self.completion['state']='complete'
        action,state=self.call(0,state='complete')
        self.assertEqual(action,'complete');self.assertIsNone(state['stage'])

    def test_stuck_post_embedding_monitor_is_resumed(self):
        self.processes['embed']=[]
        action,_=self.call(6,state='complete')
        self.assertEqual(action,'resume_monitor')

    def test_fresh_recovery_monitor_gets_startup_grace_after_completion(self):
        self.processes['embed']=[]
        self.completion['started_at']=(self.now+timedelta(minutes=5)).isoformat()
        action,_=self.call(6,state='complete')
        self.assertEqual(action,'verifying')


class RecoveryActions(unittest.TestCase):
    def exercise(self,action,build=False):
        from knowledge.watchdog import recover
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);vectors=root/'vectors';vectors.mkdir()
            sentinel=vectors/'saved-vector-version';sentinel.write_bytes(b'committed-vector-sentinel')
            config=dict(state_dir=root,site_dir=root/'Website')
            current=dict(encoder=[11],embed=[22],monitor=[33],startup=[44],build=[55] if build else [],refresh=[],verify=[])
            stopped=[];launched=False
            def inventory(_):
                return {k:([77] if k=='monitor' and launched else [id for id in ids if id not in stopped]) for k,ids in current.items()}
            def powershell(command):
                nonlocal launched
                if command.startswith('Stop-Process'):
                    stopped.extend(int(n) for n in command.split(' -Id ')[1].split(' -ErrorAction')[0].split(','))
                    return ''
                launched=True
                (root/'intake-completion.json').write_text(json.dumps(dict(pid=77)))
                return json.dumps(dict(ReturnValue=0,ProcessId=77))
            with patch('knowledge.watchdog.inventory',side_effect=inventory),patch('knowledge.watchdog.powershell',side_effect=powershell),patch('knowledge.watchdog.time.sleep'):
                result=recover(config,action)
            self.assertEqual(sentinel.read_bytes(),b'committed-vector-sentinel')
            return stopped,result

    def test_soft_restart_leaves_encoder_and_vectors_in_place(self):
        stopped,result=self.exercise('restart_soft')
        self.assertEqual(set(stopped),{22,33,44});self.assertEqual(result['monitor_pid'],77)

    def test_hard_restart_recycles_owned_encoder_without_deleting_vectors(self):
        stopped,result=self.exercise('restart_hard')
        self.assertEqual(set(stopped),{11,22,33,44});self.assertEqual(result['monitor_pid'],77)

    def test_recovery_does_not_stop_an_active_build(self):
        stopped,result=self.exercise('restart_hard',True)
        self.assertEqual(stopped,[]);self.assertEqual(result,'build_started_during_check')


if __name__=='__main__':unittest.main()
