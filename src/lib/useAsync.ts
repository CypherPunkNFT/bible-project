import { useEffect, useState } from "react";

export type AsyncState<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: unknown };

/** Run a loader whenever `key` changes; ignores results that arrive after the key moved on. */
export function useAsync<T>(loader: () => Promise<T>, key: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  useEffect(() => {
    let current = true;
    setState({ status: "loading" });
    loader()
      .then((value) => current && setState({ status: "ready", value }))
      .catch((error: unknown) => {
        if (!current) return;
        console.warn(`load failed for ${key}`, error);
        setState({ status: "error", error });
      });
    return () => {
      current = false;
    };
    // The loader is recreated every render; `key` is what identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
