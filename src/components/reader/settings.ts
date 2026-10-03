import { useState } from "react";

export interface ReaderSettings {
  redLetters: boolean;
  footnotes: boolean;
  versePerLine: boolean;
  scale: number;
  /** the cross-reference panel opens with each chapter (wide screens) */
  crossRefs: boolean;
}

const DEFAULTS: ReaderSettings = { redLetters: true, footnotes: true, versePerLine: false, scale: 1, crossRefs: true };
const KEY = "bp-reader-settings";

function load(): ReaderSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (parsed && typeof parsed === "object") {
      const value = { ...DEFAULTS, ...(parsed as Partial<ReaderSettings>) };
      value.scale = Math.min(1.5, Math.max(0.85, Number(value.scale) || 1));
      return value;
    }
  } catch (error) {
    console.warn("reader settings: could not read saved settings", error);
  }
  return DEFAULTS;
}

/** Reading options, remembered on this browser only. */
export function useReaderSettings(): [ReaderSettings, (value: ReaderSettings) => void] {
  const [settings, setSettings] = useState<ReaderSettings>(load);
  const update = (value: ReaderSettings) => {
    setSettings(value);
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch (error) {
      console.warn("reader settings: could not save", error);
    }
  };
  return [settings, update];
}
