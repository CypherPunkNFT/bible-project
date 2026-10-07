"""Inspect a small, explicitly selected author-offered RB08 text set; no images/OCR."""
import importlib.util
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

sys.path.insert(0, str(Path(__file__).resolve().parent))
spec = importlib.util.spec_from_file_location('rb08', Path(__file__).with_name('rb08-acquire.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)

WHITE = [
 'general-apologetics/purpose-and-meaning-of-ego-eimi-in-the-gospel-of-john/',
 'theology-matters/a-brief-definition-of-the-trinity/',
 'oneness-pentecostalism/the-trinity-the-definition-of-chalcedon-and-oneness-theology/',
 'islam/some-brief-thoughts-regarding-liberal-scholarship-redaction-criticism-and-islam-part-1/',
 'islam/some-brief-thoughts-regarding-liberal-scholarship-redaction-criticism-and-islam-part-2/',
]
INDEX = 'https://michaeljkruger.com/the-complete-series-ten-basic-facts-about-the-nt-canon-that-every-christian-should-memorize/'

def main():
    index, _ = r.base.fetch(INDEX)
    node = r.base.soup(index).select_one('.elementor-widget-theme-post-content')
    kruger = []
    for a in node.select('a[href]'):
        label = a.get_text(' ', strip=True)
        if 'wp.me/p2dVaB-' in a['href']:
            kruger.append((urljoin(INDEX, a['href']), label))
    assert len(kruger) == 10, kruger
    selection = [('https://www.aomin.org/aoblog/' + x, None) for x in WHITE] + kruger
    results = []
    for url, label in selection:
        try:
            raw, meta = r.base.fetch(url)
            doc = r.base.soup(raw)
            selector = 'article.type-post .article-content' if 'aomin.org' in url else '.elementor-widget-theme-post-content'
            main = doc.select_one(selector)
            assert main is not None
            text = r.extract(raw, {'format': 'html', 'selector': selector})
            title = doc.select_one('h1')
            author = 'James White' if 'aomin.org' in url else 'Michael J. Kruger'
            dates = []
            for script in doc.select('script[type="application/ld+json"]'):
                try:
                    data = json.loads(script.get_text())
                    for item in data.get('@graph', [data]):
                        if item.get('@type') == 'Article':
                            dates.append({'published': item.get('datePublished'), 'modified': item.get('dateModified')})
                except (ValueError, AttributeError):
                    pass
            if 'aomin.org' in url:
                article = doc.select_one('article.type-post')
                dates += [{'displayed': x.get('datetime', x.get_text(' ',strip=True))} for x in article.select('time')]
            result = dict(meta, title=title.get_text(' ', strip=True) if title else label,
                          author=author, selector=selector, wordCount=len(re.findall(r"\b[\w'-]+\b", text)),
                          headings=[x.get_text(' ', strip=True) for x in main.select('h1,h2,h3,h4')],
                          dates=dates,
                          links=[dict(text=a.get_text(' ',strip=True),url=urljoin(meta['finalUrl'],a['href']))
                                 for a in main.select('a[href]') if a['href'].startswith(('http','/'))])
            results.append(result)
            (r.base.CACHE/'review').mkdir(parents=True,exist_ok=True)
            (r.base.CACHE/'review'/(meta['sha256']+'.txt')).write_text(text,encoding='utf-8')
            print(json.dumps({k:v for k,v in result.items() if k!='links'},ensure_ascii=True),flush=True)
            print('PRIVATE REVIEW',json.dumps(text[:1200]), 'END',json.dumps(text[-700:]),flush=True)
        except Exception as exc:
            results.append(dict(url=url,error=str(exc)))
            print('FAILED',url,str(exc),flush=True)
        r.base.write(r.base.REPORT/'selected-text-review.json',results)

if __name__ == '__main__':
    main()
