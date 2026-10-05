import type { CSSProperties } from "react";

export const AP_BASE = "/apologetics";
export const studyUrl = (id: string) => AP_BASE + "/study/" + id;
export const apColor = (value: string) => ({ "--ap-tone": "var(--" + value + ")" }) as CSSProperties;
