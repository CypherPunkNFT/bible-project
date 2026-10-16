"""One-shot status for the complete metadata review preparation; no waiting."""
from datetime import datetime,timezone
import os
from .inputs import ROOT,read,lease_status
from ..jobs import process_identity

if __name__=='__main__':
    progress=read(ROOT/'review/progress.json')
    print('\nKR-130 REVIEW TAB PREPARATION |',datetime.now(timezone.utc).isoformat())
    print('State:',progress['state'].upper(),'| Phase:',progress.get('phase','unpublished'))
    print('Saved checkpoint:',progress['updatedAt'])
    if progress.get('expectedStatements'):
        print(f"Statements classified: {progress.get('completedStatements',0):,} / {progress['expectedStatements']:,} ({100*progress.get('completedStatements',0)/progress['expectedStatements']:.2f}%)")
    if progress.get('expectedSources'):
        print(f"Source records committed: {progress.get('completedSources',0):,} / {progress['expectedSources']:,}")
    print('Worker identity:', 'CONFIRMED LIVE' if process_identity(progress['pid'])==progress['process_token'] else 'NOT CONFIRMED LIVE')
    print('Global analytics lease:',[(r['pid'],r['live_identity']==r['process_token']) for r in lease_status()] or 'free')
    if progress.get('error'):print('Error:',progress['error'])
    print('This percentage describes metadata classification, not extraction quality acceptance.\n')
