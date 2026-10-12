"""Rebuild the isolated Preacher2 review from the last saved commit before noon Oct 11."""
from pathlib import Path
import io, json, subprocess, tarfile

SITE = Path(__file__).resolve().parents[1]
REVISION = 'cf1ddd4903539df48badf166d1f10d73921f1ad3'
SNAPSHOT = SITE / '.local' / 'preacher2-noon-snapshot'
OUTPUT = SITE / 'design' / 'preacher2'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=SITE)

prefix = git('rev-parse', '--show-prefix').decode().strip()
archive = git('archive', REVISION, '--', prefix + 'src', prefix + 'tailwind.config.ts')
SNAPSHOT.mkdir(parents=True, exist_ok=True)
with tarfile.open(fileobj=io.BytesIO(archive)) as files:
    for member in files:
        if not member.isfile():
            continue
        relative = Path(member.name.removeprefix(prefix))
        destination = (SNAPSHOT / relative).resolve()
        if not destination.is_relative_to(SNAPSHOT.resolve()):
            raise ValueError('Archive path leaves snapshot directory')
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(files.extractfile(member).read())

(SNAPSHOT / 'src' / 'preview.tsx').write_text('''import {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {MotionConfig} from 'framer-motion';
import {Layout} from './components/Layout';
import {CatalogProvider} from './lib/catalog-context';
import PreachersPage from './pages/teachers/preachers/PreachersPage';
import './index.css';
function Links(){
 const location=useLocation();
 useEffect(()=>{
  if(location.pathname!=='/teachers/preachers-and-authors')window.location.assign(location.pathname+location.search+location.hash);
 },[location]);
 return null;
}
createRoot(document.getElementById('root')!).render(<MotionConfig reducedMotion="user"><MemoryRouter initialEntries={['/teachers/preachers-and-authors']}><CatalogProvider><Links/><Layout><PreachersPage/></Layout></CatalogProvider></MemoryRouter></MotionConfig>);
''', encoding='utf-8')
(SNAPSHOT / 'index.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><meta name="color-scheme" content="light dark"><title>Preacher2 - October 11 snapshot</title><link rel="icon" href="/favicon.svg"><script>try{const theme=localStorage.getItem('bp-theme');if(theme==='dark'||theme==='light')document.documentElement.dataset.theme=theme;}catch{}</script></head><body><div id="root"></div><script type="module" src="/src/preview.tsx"></script></body></html>''', encoding='utf-8')
config = '''import {defineConfig} from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwind from './tailwind.config.ts';
export default defineConfig({
 root:ROOT,base:'/mockups/preacher2/',publicDir:false,
 resolve:{alias:{'@':ROOT+'/src'}},esbuild:{jsx:'automatic'},
 css:{postcss:{plugins:[tailwindcss({...tailwind,content:[ROOT+'/src/**/*.{ts,tsx}']}),autoprefixer()]}},
 build:{outDir:OUTPUT,emptyOutDir:false,copyPublicDir:false}
});
'''.replace('ROOT', json.dumps(SNAPSHOT.as_posix())).replace('OUTPUT', json.dumps(OUTPUT.as_posix()))
(SNAPSHOT / 'vite.config.mjs').write_text(config, encoding='utf-8')
OUTPUT.mkdir(parents=True, exist_ok=True)
subprocess.run(['node', str(SITE/'node_modules/vite/bin/vite.js'), 'build', '--config', str(SNAPSHOT/'vite.config.mjs')], cwd=SITE, check=True)
print('Preacher2: http://127.0.0.1:8931/mockups/preacher2/')
