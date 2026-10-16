"""Run the owned focused checks and persist their actual outcome."""
import time,unittest
from .inputs import OUT
from ..build import dump,now

def main():
 OUT.mkdir(parents=True,exist_ok=True);start=time.monotonic();suite=unittest.defaultTestLoader.loadTestsFromName('knowledge.library_analytics.history_language.test_history_language')
 with (OUT/'focused-tests.log').open('w',encoding='utf-8') as stream:result=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
 receipt={'time':now(),'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'passed':result.wasSuccessful(),'seconds':time.monotonic()-start};dump(OUT/'focused-tests.json',receipt);print(receipt)
 if not result.wasSuccessful():raise SystemExit(1)
if __name__=='__main__':main()
