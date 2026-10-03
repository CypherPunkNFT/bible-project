const KEY = "bp-last-read";

/** Remember the last chapter opened, on this browser only. */
export function rememberRead(path: string): void {
  try {
    localStorage.setItem(KEY, path);
  } catch (error) {
    console.warn("last-read: could not save", error);
  }
}

export function lastReadPath(): string | null {
  try {
    const value = localStorage.getItem(KEY);
    return value && /^\/read\/[a-z0-9]+\/[0-9A-Z]{3}\/[0-9a-z]+$/.test(value) ? value : null;
  } catch (error) {
    console.warn("last-read: unavailable", error);
    return null;
  }
}
