"""Focused file-based acceptance: no preview server or production writes."""
from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

TRACK=Path(__file__).resolve().parent
PROJECT=TRACK.parents[4]
PRIVATE=PROJECT/'KnowledgeBase/library-knowledge/parallel-preparation/01-interfaces'
SHOTS=TRACK/'prototype/screenshots'
SHOTS.mkdir(exist_ok=True)
checks=[]
errors=[]
requests=[]
def check(condition,label):
    assert condition,label
    checks.append(label)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel='msedge')
    context=browser.new_context(offline=True,viewport={'width':1440,'height':1000},reduced_motion='reduce')
    page=context.new_page()
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('request',lambda r: requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
    for name in ['index','passage','topic','shelf']:
        page.goto((TRACK/f'prototype/{name}.html').as_uri())
        page.evaluate('document.fonts.ready')
        check(page.evaluate('document.fonts.check("16px Archivo") && document.fonts.check("16px Literata")'),name+' local fonts')
        if name=='shelf':
            check(page.locator('#shelf-panel').is_hidden(),'shelf initially closed')
            page.screenshot(path=str(SHOTS/'shelf-initial.png'))
            page.get_by_role('button',name='John Calvin Author').click()
            page.locator('#edition').select_option('commentary')
            check(page.locator('#state').input_value()=='catalogue','Calvin commentary catalogue-only')
            check(page.get_by_role('button',name='Read held edition').count()==0,'no reading CTA for catalogue')
            page.locator('#edition').select_option('sermons')
            check(page.locator('#state').input_value()=='readable','Calvin sermons readable')
        for theme in ['light','dark']:
            if page.evaluate('document.documentElement.dataset.theme') != theme:
                page.locator('#theme').click()
            check(page.evaluate('document.documentElement.dataset.theme') == theme,name+' '+theme+' theme control')
            for width in [1440,390]:
                page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
                check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{name} {theme} {width} no overflow')
                page.screenshot(path=str(SHOTS/f'{name}-{theme}-{width}.png'),full_page=True)
        page.set_viewport_size({'width':1440,'height':1000})
        if name=='index': continue
        for state in ['readable','catalogue','candidate','conflict','empty','loading','stale']:
            page.locator('#state').select_option(state)
            check(page.locator('#state-content').inner_text().strip()!='',name+' '+state+' rendered')
            if state in ['candidate','conflict','empty','loading','stale']:
                check(page.get_by_role('button',name='Read held edition').count()==0,name+' '+state+' withholds reading claim')
            if name=='passage':
                page.locator('#state-content').screenshot(path=str(SHOTS/f'state-{state}.png'))
        page.locator('#state').select_option('readable')
        button=page.get_by_role('button',name='Read held edition')
        button.focus();page.keyboard.press('Enter')
        check(page.locator('dialog').is_visible(),name+' keyboard opens dialog')
        check('held-140823cc0ca835eda48a3dc99d4025ef' in page.locator('dialog code').inner_text(),name+' exact known work route')
        page.keyboard.press('Escape')
        check(not page.locator('dialog').is_visible(),name+' Escape closes dialog')
        check(button.evaluate('(e)=>document.activeElement===e'),name+' focus returns to trigger')
        page.locator('#state').select_option('empty');page.get_by_role('button',name='Reset this view').click()
        check(page.locator('#state').evaluate('(e)=>document.activeElement===e'),name+' reset returns focus')
        if name=='passage':
            page.get_by_role('button',name='Next',exact=False).click()
            check(page.locator('#reading-heading').inner_text()=='Ephesians 2','chapter navigation synchronizes context')
            page.get_by_role('button',name='Open Bible reader').click()
            check(page.locator('dialog code').inner_text()=='/read/kjv/EPH/2','Bible route shape preserved')
            page.keyboard.press('Escape')
        if name=='topic':
            page.get_by_role('button',name='Distinguish terms').click()
            check('distinguish related terms' in page.locator('#question-heading').inner_text(),'question switch updates heading')
        if name=='shelf':
            page.get_by_role('button',name='Close shelf').click()
            check(page.locator('#shelf-panel').is_hidden(),'shelf can close')
            page.locator('#search').fill('zzzz')
            check(page.locator('#search-empty').is_visible(),'contributor empty search')
            page.get_by_role('button',name='Clear search').click()
            check(page.locator('.contributors li:visible').count()==3,'contributor clear restores all')
    check(not requests,'zero HTTP requests while offline')
    check(not errors,'zero browser JavaScript errors')
    browser.close()

before=json.loads((PRIVATE/'input-versions.json').read_text())
changed=[f for f,sha in before.items() if hashlib.sha256((PROJECT/f).read_bytes()).hexdigest()!=sha]
result={'checkedAt':datetime.now(timezone.utc).isoformat(),'browser':'installed Microsoft Edge via Playwright','mode':'offline file URLs','checksPassed':len(checks),'checks':checks,'errors':errors,'httpRequests':requests,'inputChanges':changed,'screenshots':len(list(SHOTS.glob('*.png')))}
(PRIVATE/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'checksPassed':len(checks),'screenshots':result['screenshots'],'inputChanges':changed}))
