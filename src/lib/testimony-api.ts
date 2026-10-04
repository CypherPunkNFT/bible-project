export async function testimonyApi<T>(path: string, method = "GET", value?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/testimonies/" + path, {
    method, credentials: "same-origin", cache: "no-store", signal,
    ...(value !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) } : {}),
  });
  if (!response.headers.get("Content-Type")?.includes("application/json")) throw new Error("Testimonies are temporarily unavailable. Please try again shortly.");
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "The request could not be completed. Please try again.");
  return result as T;
}
export function testimonyAccessToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export function savedTestimonyValue<T>(key: string): T | null {
  try { return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null; } catch { return null; }
}
export function saveTestimonyValue(key: string, value: unknown) {
  try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* The live API still works when browser storage is disabled. */ }
}
