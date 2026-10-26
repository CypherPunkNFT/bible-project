import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SourceDirectory } from '../SourceDirectory';
vi.mock('./useSourceDirectory',()=>({useSourceDirectory:()=>({
 directory:{collections:[],sources:[],split:{records:0,collections:{}},corpus:{measured_at:'2026-10-07',bibliographyUpdatedAt:'2026-10-06',files:4,incompleteIdentity:0}},
 entries:[],failed:'',marker:{current:null},want:()=>{}
})}));
afterEach(()=>vi.unstubAllGlobals());
function render(hostname:string){vi.stubGlobal('window',{location:{hostname}}); return renderToStaticMarkup(<MemoryRouter><SourceDirectory scriptureCount={37}><p>Edition table</p></SourceDirectory></MemoryRouter>);}
describe('public and local dashboard presentation',()=>{
 it('keeps private workspace destinations out of the public rendering',()=>{const html=render('bibleproject.io');expect(html).toContain('Library dashboard');expect(html).not.toContain('Local library workspace');expect(html).not.toContain('/data_analysis/');expect(html).not.toContain('/data_intake/');expect(html).not.toContain('Edition table');});
 it('shows the existing workspace only on loopback without adding decision controls',()=>{const html=render('127.0.0.1');expect(html).toContain('Local library workspace');expect(html).toContain('/data_analysis/candidates/');expect(html).not.toContain('Approve candidate');});
});
