"""One polite official-source policy consultation per missing source; no retries."""
import concurrent.futures
import hashlib
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent
UA = 'BibleProjectSourceDocumentation/1.0 (private local study; policy review)'
TARGETS = {
 'aomin.org':'https://www.aomin.org/aoblog/', 'michaeljkruger.com':'https://michaeljkruger.com/',
 'baptistcatechism.org':'https://baptistcatechism.org/', 'baptistdogmatics.com':'https://www.baptistdogmatics.com/',
 'baptisthistoryhomepage.com':'https://baptisthistoryhomepage.com/', 'bcsmn.edu':'https://bcsmn.edu/',
 'bible.helloao.org':'https://bible.helloao.org/docs/', 'billygraham.org':'https://billygraham.org/',
 'capitolhillbaptist.org':'https://www.capitolhillbaptist.org/', 'careycenter.wmcarey.edu':'https://careycenter.wmcarey.edu/',
 'content.cbtseminary.org':'https://content.cbtseminary.org/', 'crossway.org':'https://www.crossway.org/terms/',
 'cslewisinstitute.org':'https://www.cslewisinstitute.org/', 'earlychristianwritings.com':'https://www.earlychristianwritings.com/',
 'en.wikisource.org':'https://en.wikisource.org/wiki/Wikisource:Copyright_policy',
 'frame-poythress.org':'https://frame-poythress.org/', 'freechristianebooks.org':'https://www.freechristianebooks.org/',
 'history.hanover.edu':'https://history.hanover.edu/texts/', 'jimhamilton.info':'https://jimhamilton.info/',
 'london1644.info':'https://www.london1644.info/', 'onthewing.org':'https://www.onthewing.org/',
 'penelope.uchicago.edu':'https://penelope.uchicago.edu/Thayer/E/Roman/home.html',
 'reformedontheweb.com':'https://www.reformedontheweb.com/', 'reformedreader.org':'https://www.reformedreader.org/',
 'romans45.org':'https://www.romans45.org/', 'sermonindex.net':'https://www.sermonindex.net/',
 'thecalvinist.net':'https://thecalvinist.net/', 'tyndale.tms.edu':'https://tyndale.tms.edu/',
 'tyndalebulletin.org':'https://www.tyndalebulletin.org/', 'zwemercenter.com':'https://www.zwemercenter.com/',
}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None

OPENER = urllib.request.build_opener(NoRedirect)

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent':UA})
    try:
        with OPENER.open(request, timeout=12) as response:
            return response.read(1800000), dict(status=response.status, url=url, contentType=response.headers.get('Content-Type'))
    except urllib.error.HTTPError as exc:
        return b'', dict(status=exc.code,url=url,redirect=exc.headers.get('Location'))

def run_one(source, url):
    folder = OUT / 'evidence' / source
    folder.mkdir(parents=True,exist_ok=True)
    result = dict(source=source,checkedAt=datetime.now(timezone.utc).isoformat(),officialUrl=url,pages=[],policyLinks=[])
    try:
        origin = urllib.parse.urlsplit(url)
        robots_url = urllib.parse.urlunsplit((origin.scheme,origin.netloc,'/robots.txt','',''))
        robots, info = get(robots_url); result['robots']=info
        if info['status'] not in (200,404,410):
            result['outcome']='robots_unavailable'; return result
        robot = urllib.robotparser.RobotFileParser(robots_url)
        if info['status']==200:
            if b'<html' in robots.lower() or b'<!doctype' in robots.lower():
                result['outcome']='invalid_robots_response'; return result
            (folder/'robots.txt').write_bytes(robots)
            robot.parse(robots.decode('utf-8','replace').splitlines())
        else: robot.parse([])
        delay=max(2,robot.crawl_delay(UA) or robot.crawl_delay('*') or 0)
        if delay>30:
            result['outcome']='long_crawl_delay_deferred';return result
        for kind, target in [('official',url)]:
            if not robot.can_fetch(UA,target):
                result['outcome']='robots_disallowed'; return result
            time.sleep(delay)
            data, page = get(target); result['pages'].append(page)
            if page['status']!=200:
                result['outcome']='official_page_unavailable';return result
            (folder/(kind+'.html')).write_bytes(data)
            page.update(path=str(folder/(kind+'.html')),sha256=hashlib.sha256(data).hexdigest())
            text=data.decode('utf-8','replace')
            links=[]
            for quote, href, label in re.findall(r'<a\b[^>]*href\s*=\s*([\"\'])(.*?)\1[^>]*>(.*?)</a>',text,re.I|re.S):
                label=html.unescape(re.sub('<[^>]+>',' ',label)).strip()
                link=urllib.parse.urljoin(target,html.unescape(href))
                if re.search(r'copyright|terms(?: of use| and conditions)?|permissions|licen[cs]e',label,re.I) and urllib.parse.urlsplit(link).netloc==origin.netloc:
                    links.append(dict(url=link,label=label))
            result['policyLinks']=links[:12]
            if links and links[0]['url']!=target and robot.can_fetch(UA,links[0]['url']):
                time.sleep(delay)
                policy, policy_info=get(links[0]['url']);result['pages'].append(policy_info)
                if policy_info['status']==200:
                    (folder/'policy.html').write_bytes(policy)
                    policy_info.update(path=str(folder/'policy.html'),sha256=hashlib.sha256(policy).hexdigest())
            result['outcome']='consulted_policy_link' if len(result['pages'])>1 else 'consulted_official_page_no_policy_link'
    except Exception as exc:
        result.update(outcome='consultation_failed',error=str(exc))
    return result

def main():
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(run_one,key,url):key for key,url in TARGETS.items()}
        for future in concurrent.futures.as_completed(futures):
            result=future.result();results.append(result)
            print(result['source'],result['outcome'],flush=True)
            (OUT/'official-consultations.json').write_text(json.dumps({'items':sorted(results,key=lambda x:x['source'])},indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
