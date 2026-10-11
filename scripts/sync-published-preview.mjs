// Retained as a fail-closed guard for old deployment commands.
// Port 8931 serves the working tree build. Published releases must not replace it.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function syncPublishedPreview() {
  throw new Error('Published-to-working-preview synchronization is disabled. Rebuild the current working tree to refresh port 8931; do not copy an older release into dist/.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncPublishedPreview();
}
