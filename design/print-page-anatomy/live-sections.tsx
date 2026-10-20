// Chapters 05 and 06 run from the live page's own components instead of a frozen copy, so their switches and the
// translation list work here as they do on the site. Served by the local preview (Vite) only.
import { createRoot } from 'react-dom/client';
import { Router, createPath, type To } from 'react-router-dom';
import { TranslationDesk } from '@/pages/study/print-room/TranslationDesk';
import { CriticalDesk } from '@/pages/study/print-room/PrintRoomInvestigations';
import '@/pages/study/print-room/print-room.css';
import '@/pages/study/print-room/proof-sheet.css';
import '@/pages/study/print-room/overhaul.css';

// A link inside these chapters leaves the mock-up for that page on the local site.
const href = (to: To) => typeof to === 'string' ? to : createPath(to);
const navigator = { createHref: href, push: (to: To) => location.assign(href(to)), replace: (to: To) => location.replace(href(to)), go: (n: number) => history.go(n) };

const host = document.getElementById('pr-live');
if (!host) throw new Error('live-sections: no #pr-live element in the mock-up page');
createRoot(host).render(<Router location="/" navigator={navigator}><TranslationDesk/><CriticalDesk/></Router>);
