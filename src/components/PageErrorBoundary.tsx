import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Keeps one broken page from blanking the whole site: the header and footer stay, and the page area says what
 * happened with a Reload button. Resets when the reader moves to another page (`resetKey` = the path).
 */
export class PageErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { error: Error | null; key: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PageErrorBoundary: a page failed to render", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const stale = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(this.state.error.message);
    return <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <p className="font-serif text-2xl">{stale ? "This page has been updated." : "This page could not be shown."}</p>
      <p className="text-sm text-muted">{stale ? "The site changed since this tab was opened. Reload to get the latest version." : "Something went wrong while drawing it. Reloading usually fixes it."}</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-accent/50 px-5 py-2 text-sm text-accent hover:bg-accent/10">Reload</button>
    </div>;
  }
}
