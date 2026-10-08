// Colours for canvas drawing, read from the theme as currently painted; re-read after the theme changes
// (useThemeVersion from @/lib/theme tells a component when).
/** A theme colour token (e.g. "--epistles") as currently painted. */
export const themeColor = (token: string) => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
