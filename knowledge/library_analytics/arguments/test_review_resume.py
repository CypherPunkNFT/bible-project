import json
from pathlib import Path
import tempfile
import unittest
from .inputs import ROOT,write_json
from .review_resume import status_writer

class StatusRetryTests(unittest.TestCase):
    def test_status_only_retry_has_identical_payload(self):
        calls=[];payload={'generation':'same','completedStatements':123}
        def flaky(path,value):
            calls.append((path,value))
            if len(calls)<3:raise PermissionError('transient sharing violation')
            return json.dumps(value,ensure_ascii=False,indent=2)+'\n'
        value=status_writer(flaky,retries=3,delay=0)(ROOT/'review/progress.json',payload)
        self.assertEqual(len(calls),3);self.assertEqual(value,json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    def test_other_outputs_are_not_retried(self):
        calls=[]
        def fail(path,value):calls.append(path);raise PermissionError('not a status file')
        with self.assertRaises(PermissionError):status_writer(fail,retries=3,delay=0)(ROOT/'review/complete.json',{})
        self.assertEqual(len(calls),1)
    def test_retry_is_bounded(self):
        calls=[]
        def fail(path,value):calls.append(path);raise PermissionError('persistent')
        with self.assertRaises(PermissionError):status_writer(fail,retries=2,delay=0)(ROOT/'review/progress.json',{})
        self.assertEqual(len(calls),2)

if __name__=='__main__':unittest.main()
