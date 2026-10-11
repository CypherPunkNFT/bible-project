import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { syncPublishedPreview } from '../sync-published-preview.mjs';

test('retired release sync rejects calls without changing the working preview', () => {
  const entry = new URL('../../dist/index.html', import.meta.url);
  const before = readFileSync(entry);
  assert.throws(() => syncPublishedPreview('.release/old/site', 'old-commit'), /synchronization is disabled/);
  assert.deepEqual(readFileSync(entry), before);
});

test('deployment helper has no published-preview synchronization hook', () => {
  const source = readFileSync(new URL('../deploy-pages-resumable.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /syncPublishedPreview|sync-published-preview/);
});
