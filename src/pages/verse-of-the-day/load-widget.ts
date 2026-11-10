// Loads the widget's own script once (docs/features/verse-widget/design.md 7.4), for the page's verse boxes.

export interface ShownDay {
  date: string;
  text: string;
  reference: string;
  read: string;
  season: { label: string; link: string; linkText: string } | null;
}

interface WidgetApi {
  render(element: HTMLElement, day?: unknown): Promise<ShownDay | null>;
}

declare global {
  interface Window { __bibleGuideVerse?: WidgetApi }
}

export const WIDGET_SCRIPT = "/widget/v1/verse.js";
let loading: Promise<WidgetApi | null> | null = null;

/** The widget's script, added to the page once. */
export function loadWidget(): Promise<WidgetApi | null> {
  if (window.__bibleGuideVerse) return Promise.resolve(window.__bibleGuideVerse);
  if (!loading) {
    loading = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = WIDGET_SCRIPT;
      script.async = true;
      script.onload = () => resolve(window.__bibleGuideVerse ?? null);
      script.onerror = () => {
        console.warn(`verse of the day: ${WIDGET_SCRIPT} could not be loaded`);
        loading = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

