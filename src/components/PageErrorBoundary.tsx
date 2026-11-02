import { Component, type ErrorInfo, type ReactNode } from "react";
import { mayReload, RELOAD_KEY, remember, STALE_CODE } from "@/lib/stale-reload";

/** The last automatic reload ("path|time"), or null; null too where the browser refuses storage. */
function lastReload(): string | null {
  try { return sessionStorage.getItem(RELOAD_KEY); } catch { return null; }
}

interface State { error: Error | null; key: string; reloading: boolean }

/**
 * Keeps one broken page from blanking the whole site: the header and footer stay, and the page area says what
 * happened with a Reload button. Resets when the reader moves to another page (`resetKey` = the path).
 * A page whose code was replaced by a release reloads itself once instead (src/lib/stale-reload.ts); storage that
 * cannot be written means no automatic reload, so it can never loop.
 */
export class PageErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, State> {
  state: State = { error: null, key: this.props.resetKey, reloading: false };

  static getDerivedStateFromError(error: Error) {
    const reloading = STALE_CODE.test(error.message) && mayReload(lastReload(), location.pathname, Date.now());
    return { error, reloading };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: State) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey, reloading: false } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PageErrorBoundary: a page failed to render", error, info.componentStack);
    if (!this.state.reloading) return;
    try {
      sessionStorage.setItem(RELOAD_KEY, remember(location.pathname, Date.now()));
    } catch (storageError) {
      console.error("PageErrorBoundary: could not note the reload, so not reloading", storageError);
      this.setState({ reloading: false });
      return;
    }
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.state.reloading) return <div className="min-h-[50vh]" aria-busy="true" />;
    const stale = STALE_CODE.test(this.state.error.message);
    return <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
      <p className="font-serif text-2xl">{stale ? "This page has been updated." : "This page could not be shown."}</p>
      <p className="text-sm text-muted">{stale ? "The site changed since this tab was opened. Reload to get the latest version." : "Something went wrong while drawing it. Reloading usually fixes it."}</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-accent/50 px-5 py-2 text-sm text-accent hover:bg-accent/10">Reload</button>
    </div>;
  }
}
