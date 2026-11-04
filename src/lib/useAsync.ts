import { useEffect, useRef, useState } from "react";
import { reloadingForLanguage, useSiteLanguage } from "./language";

export type AsyncState<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: unknown };

/** Run a loader whenever `key` changes; ignores results that arrive after the key moved on. A change of language runs it
 * again too, keeping what is shown until the new language's copy arrives (a failure then keeps it as it is). */
export function useAsync<T>(loader: () => Promise<T>, key: string): AsyncState<T> {
  const language = useSiteLanguage();
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const shownKey = useRef<string | null>(null);
  useEffect(() => {
    let current = true;
    const languageOnly = shownKey.current === key;
    shownKey.current = key;
    if (!languageOnly) setState({ status: "loading" });
    const loading = loader();
    if (languageOnly) reloadingForLanguage(loading);
    loading
      .then((value) => current && setState({ status: "ready", value }))
      .catch((error: unknown) => {
        if (!current) return;
        console.warn(`load failed for ${key}`, error);
        if (!languageOnly) setState({ status: "error", error });
      });
    return () => {
      current = false;
    };
    // The loader is recreated every render; `key` (and the language) is what identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, language]);
  return state;
}
