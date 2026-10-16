from pathlib import Path
import json, hashlib
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[4]
PRIVATE=ROOT/'KnowledgeBase/library-knowledge/parallel-preparation/04-presentation-templates'
OUT=PRIVATE/'specimens'; OUT.mkdir(exist_ok=True)
errors=[]; requests=[]; variants=0
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel='msedge')
    context=browser.new_context(offline=True,viewport={'width':1440,'height':1000})
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda request:requests.append(request.url))
    page.goto((BASE/'gallery/index.html').as_uri())
    page.evaluate('document.fonts.ready')
    assert page.locator('.specimen').count()==5
    assert page.evaluate('document.fonts.check("16px Archivo") && document.fonts.check("16px Literata")')
    for width in [1440,390]:
      page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
      for theme in ['light','dark']:
       page.select_option('#theme',theme)
       for state in ['reviewed','candidate','conflict','stale']:
        page.select_option('#state',state)
        for missing in [False,True]:
         page.locator('#missing').set_checked(missing)
         page.locator('#long').check()
         assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,theme,state,missing)
         assert page.locator('.source[data-evidence="fixture:evidence-1"]').count()==5
         assert page.locator('.source').count()==6
         assert page.locator('.source a').count()==(0 if missing else 5)
         assert page.evaluate('[...document.querySelectorAll("a[href^=http]")].every(a=>a.closest(".source footer"))')
         claim_text=page.locator('[data-claim="fixture:claim-1"]').all_text_contents()
         assert len(set(claim_text))==1,'shared claim drift'
         if state in ['stale','conflict']: assert 'withheld' in claim_text[0]
         if missing: assert page.locator('.source').first.locator('dd').nth(1).inner_text()=='Not recorded'
         variants+=1
       page.select_option('#state','reviewed'); page.locator('#missing').uncheck(); page.locator('#long').uncheck()
       page.screenshot(path=str(OUT/f'{width}-{theme}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.select_option('#theme','light'); page.select_option('#state','conflict')
    page.locator('#long').check();page.locator('#missing').check()
    page.locator('#comparison').screenshot(path=str(OUT/'comparison-conflict-long-missing.png'))
    page.select_option('#state','stale');page.locator('#answer').screenshot(path=str(OUT/'answer-stale.png'))
    page.select_option('#state','reviewed');page.locator('#missing').uncheck();page.locator('#long').uncheck()
    page.locator('.source summary').first.focus();page.keyboard.press('Enter')
    assert page.locator('.source details').first.get_attribute('open') is not None
    assert page.evaluate('document.activeElement.tagName')=='SUMMARY'
    page.locator('#theme').focus();page.keyboard.press('d');page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.id')=='missing'
    page.emulate_media(media='print')
    page.evaluate('window.dispatchEvent(new Event("beforeprint"))')
    assert page.locator('.controls').is_hidden()
    assert page.evaluate('[...document.querySelectorAll("details")].every(d=>d.open)')
    page.set_viewport_size({'width':794,'height':1123})
    for ident in ['answer','passage','comparison','dossier','lesson']:
      page.locator('#'+ident).screenshot(path=str(OUT/f'print-{ident}.png'))
    assert not errors, errors
    assert not [r for r in requests if r.startswith(('http:','https:'))],requests
    browser.close()
versions=json.loads((PRIVATE/'input-versions.json').read_text(encoding='utf-8'))
changed=[path for path,h in versions.items() if hashlib.sha256((ROOT/path).read_bytes()).hexdigest()!=h]
result={'variantsPassed':variants,'templates':5,'sourceBlocks':6,'sharedEvidenceConsumers':5,'screenshots':len(list(OUT.glob('*.png'))),'keyboardChecks':['native details Enter','control Tab focus'],'networkRequests':0,'pageErrors':errors,'changedInputs':changed,'print':'Five print-media raster specimens; no paginated PDF produced','browser':'Installed Microsoft Edge via Playwright; offline file URL','viewports':[1440,390],'themes':['light','dark']}
(PRIVATE/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
assert not changed,changed
