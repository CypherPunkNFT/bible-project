"""Prepare a windowless task, then arm recovery after observing a healthy run."""
import argparse
import csv
import io
import json
import os
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET
from .settings import load, write_json
from .native_supervisor import read, snapshot, decide, stamp
from .encoder_recovery import observe

TASK='BibleProject-Native-Completion-Supervisor'
NS='http://schemas.microsoft.com/windows/2004/02/mit/task'
TAG='{'+NS+'}'
ET.register_namespace('',NS)


def scheduler(*args):
    return subprocess.run(['schtasks',*args],capture_output=True,creationflags=subprocess.CREATE_NO_WINDOW,check=True).stdout


def definition():
    raw=scheduler('/Query','/TN',TASK,'/XML')
    return parse_xml(raw)


def parse_xml(raw):
    # schtasks pipes UTF-8/ANSI bytes with a UTF-16 XML declaration.
    return ET.fromstring(raw.decode('utf-16') if raw.startswith((b'\xff\xfe',b'\xfe\xff')) else raw.decode('utf-8-sig'))


def validate(tree,config):
    required={'.//Command':str(config['state_dir']/'.venv/Scripts/pythonw.exe'),
        './/Arguments':'-m knowledge.native_supervisor --once',
        './/WorkingDirectory':str(config['site_dir']),
        './/Interval':'PT1M','.//Priority':'4','.//Settings/Enabled':'true',
        './/Hidden':'true','.//MultipleInstancesPolicy':'IgnoreNew'}
    for query,value in required.items():
        query='/'.join(TAG+p if p not in ('','.','..') else p for p in query.split('/'))
        item=tree.find(query)
        if query=='.//'+TAG+'Settings/'+TAG+'Enabled' and item is None:
            # Scheduler omits the default true value on export. Check live state.
            task=list(csv.DictReader(io.StringIO(scheduler('/Query','/TN',TASK,'/FO','CSV','/V').decode(errors='replace'))))[0]
            if task['Scheduled Task State']=='Enabled':continue
        if item is None or item.text.casefold()!=value.casefold():
            raise RuntimeError('Task validation failed for '+query)


def prepare(config):
    folder=config['state_dir']/'native-supervisor'
    tree=definition()
    backup=folder/'task-before-windowless.xml'
    if not backup.exists():ET.ElementTree(tree).write(backup,encoding='utf-16',xml_declaration=True)
    exe=config['state_dir']/'.venv/Scripts/pythonw.exe'
    if not exe.exists():raise RuntimeError('Windowless Python executable missing')
    tree.find('.//'+TAG+'Command').text=str(exe)
    tree.find('.//'+TAG+'Arguments').text='-m knowledge.native_supervisor --once'
    settings=tree.find(TAG+'Settings')
    for key,value in [('Enabled','true'),('Hidden','true'),('Priority','4')]:
        item=settings.find(TAG+key)
        if item is None:item=ET.SubElement(settings,TAG+key)
        item.text=value
    path=folder/'task-windowless.xml'
    ET.ElementTree(tree).write(path,encoding='utf-16',xml_declaration=True)
    validate(tree,config)
    result=scheduler('/Create','/F','/TN',TASK,'/XML',str(path)).decode(errors='replace')
    validate(definition(),config)
    write_json(folder/'windowless-registration.json',dict(at=stamp(),registered=True,result=result))
    return dict(registered=True,enabled_at_scheduler=True,control_enabled=read(folder/'control.json').get('enabled'))


def arm(config):
    import msvcrt
    import time
    folder=config['state_dir']/'native-supervisor'
    validate(definition(),config)
    # The legacy scheduler must remain disabled before removing its pause marker.
    legacy=parse_xml(scheduler('/Query','/TN','BibleProject-Knowledge-Watchdog','/XML'))
    if legacy.find('.//'+TAG+'Settings/'+TAG+'Enabled').text!='false':
        raise RuntimeError('Legacy watchdog is enabled; refusing two recovery owners')
    with (folder/'supervisor.lock').open('a+b') as lock:
        lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        control=read(folder/'control.json')
        if control.get('enabled') is True:
            return dict(already_armed=True)
        if control.get('mode')!='embedding_only':raise RuntimeError('Unexpected recovery scope')
        progress=read(config['state_dir']/'embedding-progress.json')
        completion=read(config['state_dir']/'intake-completion.json')
        rows,unknown=snapshot(config)
        action,reason=decide(progress,completion,rows,unknown,time.time())
        if action!='healthy':raise RuntimeError('Expected healthy run before arming: '+reason)
        encoder=observe(config,{})
        if encoder['state']!='healthy':raise RuntimeError('Encoder is not healthy')
        if progress.get('corpus_build')!=control.get('corpus_build'):raise RuntimeError('Corpus authorization differs')
        epoch='armed-'+str(time.time_ns())
        archive=folder/epoch;archive.mkdir()
        write_json(archive/'before.json',dict(control=control,recovery=read(folder/'recovery.json'),
            progress=progress,completion=completion,processes=rows,encoder=encoder))
        write_json(folder/'recovery.json',dict(attempts=0,recovery_epoch=epoch,
            reason='Fresh owner-authorized recovery budget; prior ledger archived',previous_ledger=str(archive/'before.json')))
        control.update(enabled=True,encoder_recovery=True,recovery_epoch=epoch,armed_at=stamp(),
            reason='Owner authorized windowless embedding watchdog and encoder/worker automatic recovery')
        write_json(folder/'control.json',control)
        pause=config['state_dir']/'watchdog.pause'
        if pause.exists():
            (archive/'watchdog.pause').write_bytes(pause.read_bytes());pause.unlink()
        receipt=dict(at=stamp(),armed=True,recovery_epoch=epoch,processes=rows,progress=progress,
            encoder=encoder,attempts=0,max_attempts=3,scope=control['mode'],console_launch='pythonw.exe',
            prior_ledger=str(archive/'before.json'))
        write_json(folder/'arming-result.json',receipt)
        return receipt


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare',action='store_true')
    parser.add_argument('--arm',action='store_true')
    args=parser.parse_args()
    if args.prepare==args.arm:parser.error('Choose --prepare or --arm')
    print(json.dumps(prepare(load()) if args.prepare else arm(load()),indent=2))
