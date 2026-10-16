import io
import json
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from knowledge import encoder_recovery as e, native_supervisor as s
from knowledge.settings import write_json


class EncoderRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.state=Path(self.temp.name)
        self.config=dict(state_dir=self.state,site_dir=self.state/'site',embedding=dict(daemon_url='http://127.0.0.1:1'))
        self.folder=self.state/'native-supervisor'
        self.control=dict(enabled=True,mode='embedding_only',corpus_build='build',encoder_recovery=True)
        self.owner=dict(pid=1,parent=0,created=1,role='owner')
        self.worker=dict(pid=2,parent=1,created=1,role='embed')
        write_json(self.folder/'control.json',self.control)
        write_json(self.state/'intake-completion.json',dict(pid=1,state='embedding',updated_at=s.stamp()))
        write_json(self.state/'embedding-progress.json',dict(pid=2,state='running',indexed=10,updated_at=s.stamp()))

    def test_healthy_encoder_does_not_interrupt(self):
        with patch.object(s,'snapshot',return_value=([self.owner,self.worker],[])), \
                patch.object(e,'observe',return_value=dict(state='healthy')), patch.object(s,'terminate_owned') as stop:
            self.assertEqual(s.tick(self.config)['state'],'healthy')
            stop.assert_not_called()

    def test_poisoned_encoder_repaired_before_one_replacement(self):
        order=[]
        with patch.object(s,'snapshot',return_value=([self.owner,self.worker],[])), \
                patch.object(e,'observe',return_value=dict(state='failed',processes=[])), \
                patch.object(s,'terminate_owned',side_effect=lambda *a:order.append('stop')), \
                patch.object(e,'repair',side_effect=lambda *a:order.append('encoder')), \
                patch.object(s,'launch_owner',side_effect=lambda *a:order.append('owner')):
            self.assertEqual(s.tick(self.config)['state'],'restarted')
            self.assertEqual(order,['stop','encoder','owner'])
            self.assertEqual(s.read(self.folder/'recovery.json')['attempts'],1)
            self.assertEqual(s.tick(self.config)['state'],'backoff')
            self.assertEqual(len(order),3)

    def test_uncertain_encoder_identity_is_never_killed(self):
        with patch.object(s,'snapshot',return_value=([self.owner,self.worker],[])), \
                patch.object(e,'observe',return_value=dict(state='attention',reason='Unknown PID')), \
                patch.object(s,'terminate_owned') as stop:
            self.assertEqual(s.tick(self.config)['state'],'attention')
            stop.assert_not_called()

    def test_hung_health_requires_repeated_failures(self):
        with patch.object(s,'snapshot',return_value=([self.owner,self.worker],[])), \
                patch.object(e,'observe',return_value=dict(state='unreachable',failures=1)), \
                patch.object(s,'terminate_owned') as stop:
            self.assertEqual(s.tick(self.config)['state'],'healthy')
            stop.assert_not_called()

    def test_reused_encoder_pid_refuses_termination(self):
        row=dict(pid=99,parent=0,created=1)
        with patch.object(e,'processes',return_value=([row],[])), patch.object(e,'health',return_value=dict(state='failed',pid=99)), patch('psutil.Process') as process:
            process.return_value.create_time.return_value=2
            with self.assertRaisesRegex(RuntimeError,'reused'):
                e.repair(self.config,dict(processes=[row]))
            process.return_value.terminate.assert_not_called()

    def test_encoder_identity_changes_are_refused(self):
        with patch.object(e,'processes',return_value=([dict(pid=3)],[])), patch('psutil.Process') as process:
            with self.assertRaisesRegex(RuntimeError,'identity changed'):
                e.repair(self.config,dict(processes=[]))
            process.assert_not_called()

    def test_multiple_workers_are_protected(self):
        rows=[self.owner,self.worker,dict(self.worker,pid=3)]
        self.assertEqual(s.decide(dict(state='running'),dict(pid=1),rows,[],time.time())[0],'attention')

    def test_pause_stops_encoder_mutations_too(self):
        (self.state/'watchdog.pause').touch()
        with patch.object(s,'snapshot',return_value=([self.owner,self.worker],[])), \
                patch.object(e,'observe',return_value=dict(state='failed')), patch.object(e,'repair') as repair:
            self.assertEqual(s.tick(self.config)['state'],'paused')
            repair.assert_not_called()

    def test_foreign_service_and_uninspected_process_fail_closed(self):
        with patch.object(e,'processes',return_value=([],[])),patch.object(e,'health',return_value=dict(state='foreign')):
            self.assertEqual(e.observe(self.config,{})['state'],'attention')


if __name__=='__main__':unittest.main()
