// Shared data, hooks and helpers; React components stay in their own refresh boundary.
export const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export const MOCKUPS_ENABLED = typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);
