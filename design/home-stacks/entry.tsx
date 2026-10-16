import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CatalogProvider } from '@/lib/catalog-context';
import { Layout } from '@/components/Layout';
import Opening from './Opening';

// Preserve ordinary navigation to the real application from this standalone mockup.
document.addEventListener('click', event => {
  const anchor = (event.target as Element).closest('a');
  if (!anchor || anchor.closest('.hero-card-deck') || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.getAttribute('href')?.startsWith('#')) return;
  event.preventDefault();
  event.stopPropagation();
  window.location.assign(anchor.href);
}, true);
createRoot(document.getElementById('root')!).render(<BrowserRouter><CatalogProvider><Layout><Opening /></Layout></CatalogProvider></BrowserRouter>);

