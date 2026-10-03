import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem("bp-theme");
    return value === "dark" || value === "light" ? value : null;
  } catch (error) {
    console.warn("theme: localStorage unavailable", error);
    return null;
  }
}

/** Current theme plus a toggle; the choice is remembered on this browser only. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(new Event("bp-theme"));
  }, [theme]);
  const toggle = () =>
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("bp-theme", next);
      } catch (error) {
        console.warn("theme: could not save", error);
      }
      return next;
    });
  return [theme, toggle];
}

/** Re-render canvas charts when the theme changes (they read resolved colours). */
export function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("bp-theme", bump);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", bump);
    return () => {
      window.removeEventListener("bp-theme", bump);
      media.removeEventListener("change", bump);
    };
  }, []);
  return version;
}
