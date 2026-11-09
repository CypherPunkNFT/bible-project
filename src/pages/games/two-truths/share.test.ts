import { shareResult } from './share';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const stubNavigator=(value: Partial<Navigator>)=>vi.stubGlobal('navigator',value);
it('uses the share sheet where there is one, and reports a closed sheet as cancelled',async()=>{
  stubNavigator({share:vi.fn().mockResolvedValue(undefined)});
  expect(await shareResult('x')).toBe('shared');
  stubNavigator({share:vi.fn().mockRejectedValue(new DOMException('closed','AbortError'))});
  expect(await shareResult('x')).toBe('cancelled');
});
it('falls back to the clipboard, then to a select-and-copy box',async()=>{
  vi.spyOn(console,'warn').mockImplementation(()=>{});
  const writeText=vi.fn().mockResolvedValue(undefined);
  stubNavigator({share:vi.fn().mockRejectedValue(new Error('denied')),clipboard:{writeText} as unknown as Clipboard});
  expect(await shareResult('score')).toBe('copied');expect(writeText).toHaveBeenCalledWith('score');
  stubNavigator({});
  expect(await shareResult('score')).toBe('manual');
});
